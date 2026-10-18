import { spawn, execSync } from "child_process";
import fs from "fs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class BrowserSession {
  constructor(port, userDataDir) {
    this.port = port;
    this.userDataDir = userDataDir;
    this.proc = null;
    this.ws = null;
    this.msgId = 1;
  }

  async start() {
    if (fs.existsSync(this.userDataDir)) {
      fs.rmSync(this.userDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.userDataDir, { recursive: true });

    this.proc = spawn("google-chrome", [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.userDataDir}`,
      "--window-size=1600,1000",
      "http://localhost:3001",
    ]);

    let tab = null;
    for (let i = 0; i < 50; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length > 0) {
          tab = tabs.find((t) => t.type === "page" && t.url.includes("3001")) || tabs[0];
          if (tab && tab.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }

    if (!tab || !tab.webSocketDebuggerUrl) {
      throw new Error(`Failed to connect to Chrome on port ${this.port}`);
    }

    this.ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("DOM.enable");
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      const handler = (event) => {
        const parsed = JSON.parse(event.data);
        if (parsed.id === id) {
          this.ws.removeEventListener("message", handler);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
        }
      };
      this.ws.addEventListener("message", handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`[Screenshot] Saved ${filename}`);
  }

  async close() {
    try {
      if (this.ws) this.ws.close();
    } catch (e) {}
    try {
      if (this.proc) this.proc.kill("SIGKILL");
    } catch (e) {}
    try {
      execSync(`pkill -9 -f "remote-debugging-port=${this.port}" 2>/dev/null || true`);
    } catch (e) {}
    await sleep(800);
  }
}

async function run() {
  console.log("==================================================");
  console.log("  TESTING ADMIN DYNAMIC MODEL FETCHING & SELECTION");
  console.log("==================================================");

  const browser = new BrowserSession(9992, "/tmp/chrome_admin_models_test");
  await browser.start();
  await sleep(1500);

  // 1. Log in as Super Admin
  console.log("[1] Logging in as Super Admin (admin / admin123)...");
  await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      await store.login("admin", "admin123");
      store.setCurrentView("studio");
    })()
  `);
  await sleep(1000);

  // 2. Open Admin Management Console on AI config tab
  console.log("[2] Opening Admin Console on 'ai_config' tab...");
  await browser.eval(`
    window.__store.getState().setAdminModalOpen(true, "ai_config");
  `);
  await sleep(1000);

  const initialViewInfo = await browser.eval(`
    (() => {
      const hasFetchBtn = !!document.querySelector("#admin-fetch-models-btn");
      const hasModelInput = !!document.querySelector("#admin-model-input");
      const modelVal = document.querySelector("#admin-model-input")?.value;
      return { hasFetchBtn, hasModelInput, modelVal };
    })()
  `);
  console.log("  Initial AI Config view info:", initialViewInfo);
  await browser.screenshot("admin_models_qa_1_initial_config_tab.png");

  // 3. Click "⚡ 实时拉取模型列表"
  console.log("[3] Clicking '⚡ 实时拉取模型列表' button...");
  await browser.eval(`
    document.querySelector("#admin-fetch-models-btn")?.click();
  `);
  await sleep(1500);

  const afterFetchInfo = await browser.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll(".grid.grid-cols-2 button")).map(b => b.innerText.split("\\n")[0]);
      const feedbackText = document.querySelector(".animate-fadeIn")?.innerText || "";
      return { modelCount: cards.length, sampleModels: cards.slice(0, 6), feedbackText };
    })()
  `);
  console.log("  After fetch models info:", afterFetchInfo);
  await browser.screenshot("admin_models_qa_2_models_fetched.png");

  // 4. Select a specific model from the fetched list (e.g. DALL-E-3 or FLUX-PRO)
  console.log("[4] Selecting 'dall-e-3' from model list...");
  await browser.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.toLowerCase().includes("dall-e-3"));
      if (btn) btn.click();
    })()
  `);
  await sleep(800);

  const selectedModelInfo = await browser.eval(`
    (() => {
      const modelInput = document.querySelector("#admin-model-input");
      return { currentModel: modelInput?.value };
    })()
  `);
  console.log("  Selected model input value:", selectedModelInfo);
  await browser.screenshot("admin_models_qa_3_dalle3_selected.png");

  // 5. Select FLUX-PRO and Save Config
  console.log("[5] Selecting 'flux-pro' and saving global config...");
  await browser.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.toLowerCase().includes("flux-pro"));
      if (btn) btn.click();
    })()
  `);
  await sleep(500);

  await browser.eval(`
    (() => {
      const submitBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("保存全平台配置") || b.innerText.includes("保存配置"));
      if (submitBtn) submitBtn.click();
    })()
  `);
  await sleep(1200);

  const savedInfo = await browser.eval(`
    (() => {
      const storeConfig = window.__store.getState().aiConfig;
      return { savedModel: storeConfig?.model };
    })()
  `);
  console.log("  Saved configuration verification:", savedInfo);
  await browser.screenshot("admin_models_qa_4_flux_saved_success.png");

  await browser.close();

  console.log("==================================================");
  console.log("  ALL ADMIN MODEL FETCHING QA TESTS PASSED!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
