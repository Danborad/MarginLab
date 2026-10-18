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
      "--window-size=1800,1100",
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
      throw new Error("Could not find chrome tab");
    }

    this.ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (this.callbacks && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    this.callbacks = new Map();

    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("DOM.enable");
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  async screenshot(filepath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filepath, Buffer.from(res.data, "base64"));
    console.log(`Saved screenshot to ${filepath}`);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill("SIGKILL");
  }
}

async function main() {
  const session = new BrowserSession(9877, "/tmp/chrome_3d_book_test2");
  try {
    console.log("Starting Chrome...");
    await session.start();
    await sleep(2000);

    // Directly set store into editor view and album panel
    console.log("Switching store into editor view and album panel...");
    const switched = await session.evaluate(`
      (() => {
        if (window.__store) {
          window.__store.getState().setCurrentView('editor');
          window.__store.getState().setActivePanel('album');
          return true;
        }
        return false;
      })()
    `);
    console.log("Store switched:", switched);
    await sleep(1500);

    // 1. Initial Spread (Page 1-2)
    await session.screenshot("/tmp/album_direct_spread_1.png");

    // Click Next Page
    console.log("Clicking Next page...");
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="下一页"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    await sleep(900);
    // 2. Second Spread (Page 3-4)
    await session.screenshot("/tmp/album_direct_spread_2.png");

    // Click Next Page again
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="下一页"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    await sleep(900);
    // 3. Third Spread (Page 5-6)
    await session.screenshot("/tmp/album_direct_spread_3.png");

    // Click Prev Page
    console.log("Clicking Prev page twice to go to cover...");
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="上一页"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="上一页"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="上一页"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    // 4. Closed Cover
    await session.screenshot("/tmp/album_direct_cover.png");

    console.log("Done direct album captures!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

main();
