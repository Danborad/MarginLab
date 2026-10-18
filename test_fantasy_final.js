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
  const browser = new BrowserSession(9339, "/tmp/chrome_qa_fantasy3");
  try {
    console.log("Starting Browser...");
    await browser.start();
    await sleep(1500);

    // 1. Log in
    console.log("Logging in as lin...");
    await browser.eval(`
      return window.__store.getState().login("lin", "123456");
    `);
    await sleep(1200);

    // 2. Switch to AI Stylize Studio
    console.log("Opening AI Stylize Studio...");
    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
      window.__store.getState().setSelectedAiStyleId("fantasy_qiqiguaiguai");
    `);
    await sleep(1000);

    // 3. Toggle light mode
    console.log("Testing Light Mode in Stylize Studio...");
    await browser.eval(`
      window.__store.getState().toggleThemeMode();
    `);
    await sleep(800);
    await browser.screenshot("fantasy_qa_9_light_mode_stylize.png");

    // 4. Toggle back to dark mode
    await browser.eval(`
      window.__store.getState().toggleThemeMode();
    `);
    await sleep(600);

    // 5. Check generated history in store
    console.log("Checking AI history...");
    const history = await browser.eval(`
      return window.__store.getState().aiHistory;
    `);
    console.log("AI History items:", history ? history.length : 0);

    // 6. Test applying the latest result to canvas
    console.log("Applying to canvas...");
    await browser.eval(`
      const latest = window.__store.getState().latestAiGeneratedImage || (window.__store.getState().aiHistory && window.__store.getState().aiHistory[0]?.resultUrl);
      if (latest) {
        window.__store.getState().applyStylizedImageToCanvas(latest, "add");
      }
    `);
    await sleep(1500);
    await browser.screenshot("fantasy_qa_10_canvas_with_artwork.png");

    console.log(">>> FINAL VERIFICATION COMPLETED! <<<");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
