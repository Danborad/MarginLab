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
  const browser = new BrowserSession(9344, "/tmp/chrome_test_poster");
  try {
    await browser.start();
    await sleep(1500);

    // Login as admin
    await browser.eval(`
      return window.__store.getState().login("admin", "admin123");
    `);
    await sleep(1200);

    // Switch to AI Stylize panel and select fantasy
    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
      window.__store.getState().setSelectedAiStyleId("fantasy_qiqiguaiguai");
    `);
    await sleep(1000);

    // Fetch history from server
    await browser.eval(`
      return window.__store.getState().fetchAiHistory();
    `);
    await sleep(800);

    // Set source image and latest result
    const hasHistory = await browser.eval(`
      const items = window.__store.getState().aiHistory || [];
      const realItem = items.find(it => it.styleId === "fantasy_qiqiguaiguai" && it.resultUrl && it.resultUrl.startsWith("data:image/png"));
      if (realItem) {
        window.__store.getState().setAiSourceImage("https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80");
        window.__store.getState().setLatestAiGeneratedImage(realItem.resultUrl);
        return true;
      }
      return false;
    `);
    console.log("History item found & loaded:", hasHistory);
    await sleep(1000);

    // Take overview screenshot of the center stage and right drawer
    await browser.screenshot("real_poster_qa_1_stage_overview.png");

    // Scroll aside slightly to see both image and buttons
    await browser.eval(`
      const drawer = document.querySelector("aside");
      if (drawer) drawer.scrollTop = 150;
    `);
    await sleep(500);
    await browser.screenshot("real_poster_qa_2_drawer_scrolled.png");

    // Test click [存入素材]
    await browser.eval(`
      const btns = Array.from(document.querySelectorAll("button"));
      const saveBtn = btns.find(b => b.innerText.includes("存入素材"));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(600);
    await browser.screenshot("real_poster_qa_3_saved_to_assets_toast.png");

    console.log("Verification finished!");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
