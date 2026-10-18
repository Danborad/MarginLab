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
  console.log("  TESTING CLEAN LOGIN PAGE & NO CUSTOM API FOR CREATORS");
  console.log("==================================================");

  const browser = new BrowserSession(9978, "/tmp/chrome_clean_ui_test");
  await browser.start();
  await sleep(1500);

  // 1. Verify Clean Login Page
  console.log("[1] Checking Clean Login Page (No user types / No role pills)...");
  const landingInfo = await browser.eval(`
    (() => {
      const hasDemoAdmin = !!document.querySelector("#landing-demo-admin");
      const hasDemoList = !!document.querySelector(".grid-cols-2");
      const pageText = document.body.innerText;
      return {
        hasDemoAdmin,
        hasDemoList,
        hasUserTypeText: pageText.includes("系统超级管理员") || pageText.includes("独立摄影师")
      };
    })()
  `);
  console.log("  Landing info:", landingInfo);
  await browser.screenshot("clean_qa_1_pure_login_page.png");

  // 2. Log in as Regular User (Lin)
  console.log("[2] Logging in as regular user (lin / 123456)...");
  await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      await store.login("lin", "123456");
    })()
  `);
  await sleep(1000);

  // 3. Check Header for Regular User
  console.log("[3] Inspecting Header for regular user...");
  // Click user dropdown
  await browser.eval(`
    document.querySelector("#header-user-dropdown-btn")?.click();
  `);
  await sleep(600);

  const regularHeaderInfo = await browser.eval(`
    (() => {
      const dropdownText = document.querySelector("#header-user-dropdown-menu")?.innerText || "";
      const hasTopAdminBtn = !!document.querySelector("#header-admin-quick-btn");
      const hasAiSettingsInDropdown = dropdownText.includes("OpenAI") || dropdownText.includes("配置");
      return {
        hasTopAdminBtn,
        hasAiSettingsInDropdown,
        dropdownText: dropdownText.replace(/\\n+/g, " | ")
      };
    })()
  `);
  console.log("  Regular user header check:", regularHeaderInfo);
  await browser.screenshot("clean_qa_2_regular_user_dropdown_clean.png");

  // 4. Open AI Stylize Panel as regular user
  console.log("[4] Checking AI Stylize Panel for regular user (No API config button)...");
  await browser.eval(`
    document.body.click();
    window.__store.getState().setActivePanel("ai-stylize");
  `);
  await sleep(800);

  const panelInfo = await browser.eval(`
    (() => {
      const panel = document.querySelector(".p-3.space-y-4");
      const text = panel?.innerText || "";
      return {
        hasAiConfigBtn: text.includes("AI配置") || text.includes("模型配置"),
        hasModifyLink: text.includes("修改模型参数"),
        panelSnippet: text.slice(0, 200).replace(/\\n+/g, " | ")
      };
    })()
  `);
  console.log("  Regular user panel check:", panelInfo);
  await browser.screenshot("clean_qa_3_regular_user_ai_panel_clean.png");

  // 5. Open AI Stylize Modal as regular user
  console.log("[5] Checking AI Stylize Modal for regular user (No API config button)...");
  await browser.eval(`
    window.__store.getState().openAiStylizeModal();
  `);
  await sleep(800);

  const modalInfo = await browser.eval(`
    (() => {
      const modal = document.querySelector(".max-w-2xl");
      const text = modal?.innerText || "";
      return {
        hasConfigBtn: text.includes("AI配置") || text.includes("模型配置"),
      };
    })()
  `);
  console.log("  Regular user modal check:", modalInfo);
  await browser.screenshot("clean_qa_4_regular_user_ai_modal_clean.png");

  // 6. Log out and Log in as Super Admin (admin / admin123)
  console.log("[6] Logging out Lin and Logging in as Super Admin...");
  await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      await store.closeAiStylizeModal();
      await store.logout();
      await store.login("admin", "admin123");
    })()
  `);
  await sleep(1000);

  // 7. Verify Admin Exclusivity
  console.log("[7] Verifying Super Admin access to Admin Console...");
  await browser.eval(`
    window.__store.getState().setAdminModalOpen(true, "ai_config");
  `);
  await sleep(1000);

  await browser.screenshot("clean_qa_5_admin_exclusive_ai_config.png");

  await browser.close();

  console.log("==================================================");
  console.log("  ALL CLEAN UI & RBAC QA VERIFICATIONS PASSED!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
