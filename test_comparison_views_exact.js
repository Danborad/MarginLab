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
      "--window-size=1500,950",
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
    try {
      execSync(`pkill -9 -f "remote-debugging-port=${this.port}" 2>/dev/null || true`);
    } catch (e) {}
  }
}

async function run() {
  const browser = new BrowserSession(9860, "/tmp/chrome_comparison_exact");
  try {
    await browser.start();
    await sleep(1500);

    // Login
    await browser.eval(`
      return window.__store.getState().login('lin', '123456');
    `);
    await sleep(1200);

    // Set state: Active stylize stage, photo loaded, generation finished
    await browser.eval(`
      const store = window.__store.getState();
      store.setActivePanel('ai-stylize');
      store.setSelectedAiStyleId('s21-dreamy-motion');
      store.setAiSourceImage('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80');
      store.setLatestAiGeneratedImage('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80');
    `);
    await sleep(1000);

    // 1. Frame Comparison Mode
    await browser.screenshot("clean_comp_1_frame_mode.png");

    // 2. Side by Side Comparison Mode
    await browser.eval(`
      const sbsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('左右对比'));
      if (sbsBtn) sbsBtn.click();
    `);
    await sleep(600);
    await browser.screenshot("clean_comp_2_side_by_side.png");

    // 3. Split Slider Comparison Mode
    await browser.eval(`
      const splitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('滑动卷帘'));
      if (splitBtn) splitBtn.click();
    `);
    await sleep(600);
    await browser.screenshot("clean_comp_3_split_slider.png");

    // 4. Apply to Haute Couture Dual Layout
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用双联高定排版'));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(1500);
    await browser.screenshot("clean_comp_4_dual_layout_applied.png");

    console.log("ALL CLEAN COMPARISON QA PASSED!");
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
