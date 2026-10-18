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
  const browser = new BrowserSession(9334, "/tmp/chrome_qa_auto");
  try {
    console.log("Starting Browser...");
    await browser.start();
    await sleep(1500);

    // 1. Log in as admin to check Admin Global AI Config with Auto option
    console.log("Step 1: Logging in as admin...");
    await browser.eval(`
      return window.__store.getState().login('admin', 'admin123');
    `);
    await sleep(1500);

    // Open Admin Management Modal on AI Config tab
    console.log("Step 2: Opening Admin Global AI Config Modal...");
    await browser.eval(`
      window.__store.getState().setAdminModalOpen(true, 'ai_config');
    `);
    await sleep(1000);
    await browser.eval(`
      const form = document.querySelector('form.overflow-y-auto');
      if (form) form.scrollTop = form.scrollHeight;
    `);
    await sleep(600);
    await browser.screenshot("auto_ratio_qa_5_admin_scrolled.png");
    await browser.eval(`
      const form = document.querySelector('form.overflow-y-auto');
      if (form) form.scrollTop = 0;
    `);
    await sleep(400);
    await browser.screenshot("auto_ratio_qa_1_admin_config_with_auto.png");

    // Close Admin modal
    await browser.eval(`
      window.__store.getState().setAdminModalOpen(false);
    `);
    await sleep(600);

    // 2. Switch to AI Stylize ("风格化")
    console.log("Step 3: Switching to AI Stylize Mode...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
    `);
    await sleep(1200);

    // Load sample photo "雪山高原" and show Auto + 8 ratios
    console.log("Step 4: Loading source photo to verify Auto is selected by default...");
    await browser.eval(`
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('雪山高原'));
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(1000);
    await browser.screenshot("auto_ratio_qa_2_stylize_stage_with_auto_selected.png");

    // Click 1:1 then click back to Auto
    await browser.eval(`
      const ratioBtn11 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('1:1'));
      if (ratioBtn11) ratioBtn11.click();
    `);
    await sleep(500);
    await browser.screenshot("auto_ratio_qa_3_1to1_selected.png");

    await browser.eval(`
      const ratioBtnAuto = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('自动'));
      if (ratioBtnAuto) ratioBtnAuto.click();
    `);
    await sleep(500);
    await browser.screenshot("auto_ratio_qa_4_auto_reselected.png");

    console.log(">>> AUTO RATIO QA COMPLETED! <<<");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
