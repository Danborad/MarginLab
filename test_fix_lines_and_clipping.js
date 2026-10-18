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
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", {
      type,
      x,
      y,
      button: "left",
      buttons: type === "mouseReleased" ? 0 : 1,
      clickCount: 1,
      ...extra,
    });
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

const outDir = "screenshots/qa_fix_lines_clip";
fs.mkdirSync(outDir, { recursive: true });

const s = new Session(9896, "/tmp/chrome_fix_9896", "1680,1050", "http://localhost:3001");
await s.start();
await sleep(2500);

await s.evaluate(`
  (() => {
    const st = window.__store.getState();
    st.enterAsGuest();
    st.setActivePanel('album');
    st.setCurrentAlbumId('album_jiuzhaigou');
    st.setCurrentSpreadIndex(0);
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
console.log("stage rect:", rect);
const cx = rect.x + rect.w / 2;
const cy = rect.y + rect.h / 2;
const clip = {
  x: Math.round(rect.x - 260),
  y: Math.round(rect.y - 80),
  width: Math.round(rect.w + 520),
  height: Math.round(rect.h + 170),
};

// ── Case 1: 拖动封面开合（复现并验证 Image 1 的线条问题） ──────────
console.log("--- Case 1: Dragging Cover to Spread 0 ---");
await s.evaluate(`window.__store.getState().setCurrentSpreadIndex(-1)`);
await sleep(1000);

// 拖拽封面微抬起（正如 Image 1 中的姿态）
const coverStart = cx + 200;
await s.mouse("mousePressed", coverStart, cy);
await sleep(50);
await s.mouse("mouseMoved", coverStart - 120, cy, { buttons: 1 });
await sleep(120);
await s.shot(`${outDir}/case1_cover_half_lifted.png`, clip);

await s.mouse("mouseMoved", coverStart - 260, cy, { buttons: 1 });
await sleep(120);
await s.shot(`${outDir}/case1_cover_upright.png`, clip);

await s.mouse("mouseReleased", coverStart - 260, cy, { buttons: 0 });
await sleep(800);

// ── Case 2: 内页立起中段（复现并验证 Image 2 的裁切/突刺问题） ───────
console.log("--- Case 2: Vertical Inner Page (Image 2) ---");
await s.evaluate(`window.__store.getState().setCurrentSpreadIndex(1)`);
await sleep(1000);

// 拖拽内页到立起 90度位置
const pageStart = cx + 280;
await s.mouse("mousePressed", pageStart, cy);
await sleep(50);
await s.mouse("mouseMoved", pageStart - 200, cy, { buttons: 1 });
await sleep(120);
await s.shot(`${outDir}/case2_page_turning_45deg.png`, clip);

await s.mouse("mouseMoved", pageStart - 320, cy, { buttons: 1 });
await sleep(120);
await s.shot(`${outDir}/case2_page_turning_vertical_90deg.png`, clip);

await s.mouse("mouseMoved", pageStart - 440, cy, { buttons: 1 });
await sleep(120);
await s.shot(`${outDir}/case2_page_turning_135deg.png`, clip);

await s.mouse("mouseReleased", pageStart - 440, cy, { buttons: 0 });
await sleep(800);
await s.shot(`${outDir}/case2_page_landed.png`, clip);

await s.close();
console.log("QA lines & clipping test completed!");
