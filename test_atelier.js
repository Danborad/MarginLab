import { spawn } from "child_process";
import fs from "fs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class BrowserSession {
  constructor(port, userDataDir, winSize) {
    this.port = port;
    this.userDataDir = userDataDir;
    this.winSize = winSize;
    this.proc = null;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
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
      `--window-size=${this.winSize}`,
      "http://localhost:3001",
    ]);

    let tab = null;
    for (let i = 0; i < 60; i++) {
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
    if (!tab || !tab.webSocketDebuggerUrl) throw new Error("no chrome tab found");

    this.ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        cb(msg);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = this.msgId++;
      this.callbacks.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.result?.value;
  }

  async screenshot(path) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    if (res?.result?.data) {
      fs.writeFileSync(path, Buffer.from(res.result.data, "base64"));
      console.log("Saved screenshot:", path);
    }
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill();
  }
}

async function test() {
  const session = new BrowserSession(9893, "/tmp/chrome_atelier", "1680,1050");
  await session.start();
  await sleep(2000);

  // Switch to studio mode, open album panel, and select album_atelier_collage
  await session.evaluate(`
    (() => {
      const st = window.__store.getState();
      st.enterAsGuest();
      st.setActivePanel('album');
      st.setCurrentAlbumId('album_atelier_collage');
      st.setCurrentSpreadIndex(-1);
    })()
  `);
  await sleep(1500);
  await session.screenshot("screenshots/atelier_cover.png");

  // Turn to spread 0
  await session.evaluate(`
    (() => {
      window.__store.getState().setCurrentSpreadIndex(0);
    })()
  `);
  await sleep(1500);
  await session.screenshot("screenshots/atelier_spread0.png");

  await session.close();
}

test().catch(console.error);
