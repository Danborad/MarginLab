import { spawn } from "child_process";
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
      "--window-size=1440,900",
      "about:blank",
    ]);

    let tab = null;
    for (let i = 0; i < 50; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length > 0) {
          tab = tabs.find((t) => t.type === "page") || tabs[0];
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
    await this.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2000);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          this.ws.removeEventListener("message", handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      this.ws.addEventListener("message", handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression: `(() => { ${expression} })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      console.error("Eval Exception:", res.exceptionDetails);
      throw new Error(res.exceptionDetails.text || "Eval failed");
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`Saved screenshot: ${filename}`);
  }

  async close() {
    try {
      if (this.ws) this.ws.close();
    } catch (e) {}
    try {
      if (this.proc) this.proc.kill("SIGKILL");
    } catch (e) {}
  }
}

async function run() {
  const browser = new BrowserSession(9341, "/tmp/chrome_fix_qa");
  try {
    console.log("Starting Browser...");
    await browser.start();
    await sleep(1500);

    // 1. Log in as admin
    console.log("Logging in as admin to verify canvas is clean...");
    await browser.eval(`
      return window.__store.getState().login("admin", "admin123");
    `);
    await sleep(1500);

    // Check canvas: it should be clean Quiet Journeys template, NO dog, NO s21
    await browser.screenshot("fix_qa_1_clean_canvas_opened.png");

    // 2. Switch to AI Stylize Studio
    console.log("Opening AI Stylize Studio...");
    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
      window.__store.getState().setSelectedAiStyleId("fantasy_qiqiguaiguai");
    `);
    await sleep(1000);

    // 3. Set a cute coffee/cafe lifestyle picture as sourceImage
    console.log("Setting source image (lifestyle coffee photo)...");
    const testImg = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80";
    await browser.eval(`
      window.__store.getState().setAiSourceImage("${testImg}");
    `);
    await sleep(1000);
    await browser.screenshot("fix_qa_2_coffee_photo_loaded.png");

    // 4. Set custom specified text and click generate
    console.log("Setting specified text and generating...");
    await browser.eval(`
      const inputEl = document.querySelector('input[placeholder*="本人正在加载"]') || document.querySelector('input[placeholder*="After the rain"]');
      if (inputEl) {
        inputEl.value = "今日咖啡续命中";
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
    `);
    await sleep(500);

    await browser.eval(`
      const genBtn = document.querySelector("#stage-generate-btn-text") || Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("开始AI 风格化重构") || b.textContent.includes("冲印") || b.textContent.includes("生成"));
      if (genBtn) genBtn.click();
    `);
    await sleep(2000);

    // Wait for generation to complete
    console.log("Waiting for generation result...");
    for (let i = 0; i < 35; i++) {
      await sleep(1000);
      const isGen = await browser.eval(`return window.__store.getState().isGeneratingAi;`);
      if (!isGen) {
        console.log(`Generation finished at ${i+1}s!`);
        break;
      }
    }
    await sleep(1500);
    await browser.screenshot("fix_qa_3_poster_with_real_photo.png");

    // 5. Check action buttons below result: verify NO "套用双联排版", only "存入素材" and "下载高清成片"
    const buttonsText = await browser.eval(`
      return Array.from(document.querySelectorAll("button, a")).map(b => b.textContent.trim()).filter(t => t.includes("存入素材") || t.includes("下载") || t.includes("双联") || t.includes("双排"));
    `);
    console.log("Action buttons found:", buttonsText);

    // 6. Click "存入素材"
    console.log("Clicking [存入素材]...");
    await browser.eval(`
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("存入素材"));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(1200);
    await browser.screenshot("fix_qa_4_asset_saved_toast.png");

    // 7. Open Media panel to verify the new asset is in the library
    console.log("Checking Media Panel for saved asset...");
    await browser.eval(`
      window.__store.getState().setActivePanel("media");
    `);
    await sleep(1000);
    await browser.screenshot("fix_qa_5_media_panel_with_asset.png");

    console.log(">>> ALL FIX VERIFICATION COMPLETED! <<<");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
