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
  const session = new BrowserSession(9876, "/tmp/chrome_3d_book_test");
  try {
    console.log("Starting Chrome...");
    await session.start();
    await sleep(2500);

    // Click on landing-album-btn or enter directly
    console.log("Entering album from landing page...");
    const clicked = await session.evaluate(`
      (() => {
        const albumBtn = document.getElementById('landing-album-btn') || 
          Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('3D 艺术画册'));
        if (albumBtn) {
          albumBtn.click();
          return 'clicked album btn';
        }
        const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('直接体验'));
        if (enterBtn) {
          enterBtn.click();
          return 'clicked direct experience';
        }
        return 'not found';
      })()
    `);
    console.log("Landing button result:", clicked);
    await sleep(2000);

    // If we clicked direct experience, now click album tab in left sidebar
    await session.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const albumTab = buttons.find(b => b.textContent && b.textContent.includes('相册'));
        if (albumTab) albumTab.click();
      })()
    `);
    await sleep(1500);

    // 1. Capture initial open book spread
    await session.screenshot("/tmp/album_3d_spread_1.png");

    // 2. Click next page
    console.log("Clicking next page arrow...");
    await session.evaluate(`
      (() => {
        const nextBtn = document.querySelector('button[title="下一页"]');
        if (nextBtn) {
          nextBtn.click();
          return true;
        }
        return false;
      })()
    `);
    // Capture mid-flip animation
    await sleep(300);
    await session.screenshot("/tmp/album_3d_mid_flip.png");

    await sleep(650);
    // Capture post-flip spread
    await session.screenshot("/tmp/album_3d_spread_2.png");

    // 3. Click next again
    console.log("Clicking next page arrow again...");
    await session.evaluate(`
      (() => {
        const nextBtn = document.querySelector('button[title="下一页"]');
        if (nextBtn) nextBtn.click();
      })()
    `);
    await sleep(800);
    await session.screenshot("/tmp/album_3d_spread_3.png");

    // 4. Switch to Cover (-1)
    console.log("Switching to Cover via Grid...");
    await session.evaluate(`
      (() => {
        const gridBtn = document.querySelector('button[title="全书多页网格速览"]');
        if (gridBtn) gridBtn.click();
      })()
    `);
    await sleep(600);
    await session.screenshot("/tmp/album_3d_grid.png");

    // Click cover card in grid
    await session.evaluate(`
      (() => {
        const coverCard = document.querySelector('.grid > div');
        if (coverCard) coverCard.click();
      })()
    `);
    await sleep(800);
    await session.screenshot("/tmp/album_3d_cover.png");

    console.log("All visual QA screenshots captured!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

main();
