/* 翻页几何 QA：直接把翻页进度设到指定值并截图，用于逐帧检查曲面形态。
   依赖 dev server（默认 http://127.0.0.1:3010/qa-photobook.html）+ window.__qa.set3d */
import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Session {
  constructor(port, userDataDir, winSize, url) {
    this.port = port;
    this.userDataDir = userDataDir;
    this.winSize = winSize;
    this.url = url;
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
      this.url,
    ]);
    let tab = null;
    for (let i = 0; i < 60; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length) {
          tab = tabs.find((t) => t.type === "page" && t.url.includes(new URL(this.url).port)) || tabs[0];
          if (tab && tab.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }
    if (!tab) throw new Error("no tab");
    this.ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
    this.ws.onmessage = (evt) => {
      const m = JSON.parse(evt.data);
      if (m.id && this.callbacks.has(m.id)) {
        const cb = this.callbacks.get(m.id);
        this.callbacks.delete(m.id);
        cb(m);
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
    const res = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (res?.result?.exceptionDetails)
      console.log("EVAL ERR:", JSON.stringify(res.result.exceptionDetails).slice(0, 300));
    return res?.result?.result?.value;
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

const outDir = process.argv[2] || "screenshots/qa_grid";
const port = Number(process.argv[3] || 9897);
const url = process.argv[4] || "http://127.0.0.1:3010/qa-photobook.html";
fs.mkdirSync(outDir, { recursive: true });

const s = new Session(port, `/tmp/chrome_grid_${port}`, "1600,1000", url);
await s.start();
await sleep(2600);

const set = (i, t, sc) =>
  s.evaluate(`window.__qa.set3d(${i}, ${JSON.stringify(t)}, ${sc === undefined ? 1 : sc})`);

for (const p of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) {
  await set(0, { kind: "forward", from: 0, to: 1, progress: p }, 1);
  await sleep(220);
  await s.shot(`${outDir}/fwd_${String(Math.round(p * 100)).padStart(3, "0")}.png`, {
    x: 300,
    y: 90,
    width: 1000,
    height: 700,
  });
}

for (const p of [0.15, 0.5, 0.85]) {
  await set(1, { kind: "backward", from: 1, to: 0, progress: p }, 1);
  await sleep(220);
  await s.shot(`${outDir}/back_${String(Math.round(p * 100)).padStart(3, "0")}.png`, {
    x: 300,
    y: 90,
    width: 1000,
    height: 700,
  });
}

/* 封面合上 / 完全摊开 两个静止态 */
await set(-1, null, 1);
await sleep(320);
await s.shot(`${outDir}/closed_cover.png`, { x: 300, y: 90, width: 1000, height: 700 });
await set(0, null, 1);
await sleep(320);
await s.shot(`${outDir}/open_spread.png`, { x: 300, y: 90, width: 1000, height: 700 });

console.log("grid done:", outDir);
await s.close();
