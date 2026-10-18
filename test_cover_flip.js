import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Session {
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
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length) {
          tab = tabs.find((t) => t.type === "page") || tabs[0];
          if (tab?.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }
    this.ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.cbs.has(m.id)) {
        const cb = this.cbs.get(m.id);
        this.cbs.delete(m.id);
        cb(m);
      }
    };
  }
  send(method, params = {}) {
    return new Promise((res) => {
      const id = this.msgId++;
      this.cbs.set(id, res);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r?.result?.exceptionDetails)
      console.log("EVAL ERR:", JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r?.result?.result?.value;
  }
  async shot(path, clip) {
    const res = await this.send("Page.captureScreenshot", {
      format: "png",
      ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
    });
    if (res?.result?.data) fs.writeFileSync(path, Buffer.from(res.result.data, "base64"));
  }
  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill();
  }
}

const outDir = "screenshots/qa_cover";
fs.mkdirSync(outDir, { recursive: true });

const s = new Session(9894, "/tmp/chrome_cover_9894", "1680,1050", "http://localhost:3001");
await s.start();
await sleep(2500);

// 设为封面闭合态 (index = -1)
await s.evaluate(`
  (() => {
    const st = window.__store.getState();
    st.enterAsGuest();
    st.setActivePanel('album');
    st.setCurrentAlbumId('album_jiuzhaigou');
    st.setCurrentSpreadIndex(-1);
  })()
`);
await sleep(1500);

const rect = await s.evaluate(`
  (() => {
    const el = document.querySelector('[style*="perspective"]');
    const b = el.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  })()
`);
const clip = {
  x: Math.round(rect.x - 260),
  y: Math.round(rect.y - 40),
  width: Math.round(rect.w + 520),
  height: Math.round(rect.h + 130),
};

// 1. 封面闭合静止帧
await s.shot(`${outDir}/01_cover_closed.png`, clip);

// 2. 点击封面打开书本
await s.evaluate(`
  (() => {
    const nextBtn = document.querySelector('button[title="下一页"]');
    if (nextBtn) nextBtn.click();
  })()
`);
for (let i = 0; i < 6; i++) {
  await sleep(90);
  await s.shot(`${outDir}/02_open_step_${i}.png`, clip);
}
await sleep(500);
await s.shot(`${outDir}/03_spread0_opened.png`, clip);

// 3. 点击上一页合上封面
await s.evaluate(`
  (() => {
    const prevBtn = document.querySelector('button[title="上一页"]');
    if (prevBtn) prevBtn.click();
  })()
`);
for (let i = 0; i < 6; i++) {
  await sleep(90);
  await s.shot(`${outDir}/04_close_step_${i}.png`, clip);
}
await sleep(500);
await s.shot(`${outDir}/05_cover_closed_again.png`, clip);

await s.close();
console.log("Cover flip QA completed!");
