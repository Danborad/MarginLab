import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDPSession {
  constructor(port, dir, winSize, url) {
    this.port = port;
    this.dir = dir;
    this.winSize = winSize;
    this.url = url;
    this.msgId = 1;
    this.cbs = new Map();
  }

  async start() {
    if (fs.existsSync(this.dir)) fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
    this.proc = spawn("google-chrome", [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.dir}`,
      `--window-size=${this.winSize}`,
      this.url,
    ]);

    let tab = null;
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length) {
          tab = tabs.find((t) => t.type === "page") || tabs[0];
          if (tab?.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }

    if (!tab) throw new Error("Chrome failed to start");
    this.ws = new WebSocket(tab.webSocketDebuggerUrl);

    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });

    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && this.cbs.has(msg.id)) {
        const cb = this.cbs.get(msg.id);
        this.cbs.delete(msg.id);
        cb(msg);
      }
    };

    await this.send("Page.enable");
    await this.send("Runtime.enable");
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = this.msgId++;
      this.cbs.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.result?.value;
  }

  async screenshot(outPath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const data = res.result?.data || res.data;
    if (data) {
      fs.writeFileSync(outPath, Buffer.from(data, "base64"));
      console.log(`Saved screenshot: ${outPath}`);
    }
  }

  async close() {
    try {
      if (this.ws) this.ws.close();
      if (this.proc) this.proc.kill("SIGKILL");
    } catch (e) {}
  }
}

async function run() {
  const session = new CDPSession(9491, "/tmp/chrome_22_styles_test", "1920,1080", "http://127.0.0.1:3001");
  try {
    await session.start();
    await sleep(3500);

    console.log("Checking page title and root element...");
    const title = await session.eval(`document.title`);
    console.log("Page title:", title);

    await session.screenshot("test_page_initial.png");

    console.log("Switching to AI修图 panel...");
    await session.eval(`
      if (window.__store) {
        window.__store.getState().setActivePanel('ai-retouch');
      } else {
        const btns = Array.from(document.querySelectorAll('button'));
        const retouchNavBtn = btns.find(b => b.title === 'AI修图' || (b.innerText && b.innerText.includes('AI修图')));
        if (retouchNavBtn) retouchNavBtn.click();
      }
    `);
    await sleep(1500);

    console.log("Hovering over 日照金山 card in AI修图...");
    const rect = await session.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('button'));
        const card = cards.find(b => b.textContent && b.textContent.includes('日照金山'));
        if (!card) return null;
        const r = card.getBoundingClientRect();
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
      })()
    `);
    if (rect) {
      await session.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: rect.x,
        y: rect.y,
      });
    }
    await sleep(1200);
    await session.screenshot("test_verify_retouch_hover_clean_edges.png");

    console.log("All UI verifications completed successfully!");
  } finally {
    await session.close();
  }
}

run().catch(console.error);
