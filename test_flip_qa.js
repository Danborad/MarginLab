/* 翻页 QA：抓取一次完整翻页的细帧（裁剪到书本区域，保证帧率足够） */
import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    if (fs.existsSync(this.userDataDir)) fs.rmSync(this.userDataDir, { recursive: true, force: true });
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
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
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
    if (res?.result?.exceptionDetails)
      console.log("EVAL ERR:", JSON.stringify(res.result.exceptionDetails).slice(0, 400));
    return res?.result?.result?.value;
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

const outDir = process.argv[2] || "screenshots/qa_flip5";
const port = Number(process.argv[3] || 9893);
const mode = process.argv[4] || "drag";
fs.mkdirSync(outDir, { recursive: true });

const session = new BrowserSession(port, `/tmp/chrome_qa_${port}`, "1680,1050");
await session.start();
await sleep(2600);

await session.evaluate(`
  (() => {
    const st = window.__store.getState();
    st.enterAsGuest();
    st.setActivePanel('album');
    st.setCurrentAlbumId('album_jiuzhaigou');
    st.setCurrentSpreadIndex(0);
  })()
`);
await sleep(1400);

const rect = await session.evaluate(`
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
  y: Math.round(rect.y - 40),
  width: Math.round(rect.w + 520),
  height: Math.round(rect.h + 130),
};

if (mode === "drag") {
  const startX = cx + 320;
  await session.mouse("mousePressed", startX, cy + 120);
  await sleep(50);
  const steps = [];
  for (let d = 10; d <= 560; d += 25) steps.push(d);
  let n = 0;
  for (const d of steps) {
    await session.mouse("mouseMoved", startX - d, cy + 120, { buttons: 1 });
    await sleep(40);
    await session.shot(`${outDir}/drag_${String(n).padStart(2, "0")}_dx${d}.png`, clip);
    n++;
  }
  await session.mouse("mouseReleased", startX - 560, cy + 120, { buttons: 0 });
  await sleep(1000);
  await session.shot(`${outDir}/after_release.png`, clip);
  console.log("drag frames:", n);
} else {
  await session.mouse("mousePressed", cx + 150, cy);
  await sleep(30);
  await session.mouse("mouseReleased", cx + 150, cy, { buttons: 0 });
  const t0 = Date.now();
  for (let i = 0; i < 16; i++) {
    await session.shot(`${outDir}/auto_${String(i).padStart(2, "0")}_t${Date.now() - t0}.png`, clip);
    await sleep(30);
  }
  await sleep(700);
  await session.shot(`${outDir}/auto_done.png`, clip);
  console.log("auto frames captured");
}

await session.close();
