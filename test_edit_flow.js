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

async function run() {
  const session = new BrowserSession(9895, "/tmp/chrome_qa_edit", "1680,1050");
  await session.start();
  await sleep(2500);

  // Directly test updating page via store action and UI
  await session.evaluate(`
    (() => {
      const st = window.__store.getState();
      st.enterAsGuest();
      st.setActivePanel('album');
      st.setCurrentAlbumId('album_jiuzhaigou');
      st.setCurrentSpreadIndex(0);
      // Update left page to polaroid
      st.updateAlbumPage('album_jiuzhaigou', 0, 'left', {
        layoutType: 'polaroid',
        title: '牟尼沟拍立得时光',
        bodyText: '手持拍立得走过飞瀑，水花轻溅，胶片在指尖渐渐浮现出岁月的色彩。'
      });
    })()
  `);
  await sleep(1500);
  await session.screenshot("screenshots/qa_comprehensive/08_left_page_polaroid.png");

  // Also test editing cover title and subtitle
  await session.evaluate(`
    (() => {
      const st = window.__store.getState();
      st.updateAlbumCover('album_jiuzhaigou', {
        title: '川西秘境 · 典藏手札',
        subtitle: '九寨沟 · 牟尼沟 · 松潘古城',
        author: 'Atelier Artisan',
        theme: 'burgundy'
      });
      st.setCurrentSpreadIndex(-1);
    })()
  `);
  await sleep(1500);
  await session.screenshot("screenshots/qa_comprehensive/09_cover_customized.png");

  // Also test back cover
  await session.evaluate(`
    (() => {
      const st = window.__store.getState();
      st.updateAlbumBackCover('album_jiuzhaigou', {
        title: '川西秘境 · 终篇手札',
        bodyText: '每一次快门都是对时光的挽留。山水常在，记忆永青。'
      });
      st.setCurrentSpreadIndex(st.albums.find(a => a.id === 'album_jiuzhaigou').spreads.length);
    })()
  `);
  await sleep(1500);
  await session.screenshot("screenshots/qa_comprehensive/10_back_cover_customized.png");

  await session.close();
  console.log("Edit flow tests finished!");
}

run().catch(console.error);
