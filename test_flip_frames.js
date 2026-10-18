import { spawn } from "child_process";
import fs from "fs";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

class BrowserSession {
  constructor(port, userDataDir, winSize) {
    this.port = port; this.userDataDir = userDataDir; this.winSize = winSize;
    this.proc = null; this.ws = null; this.msgId = 1; this.callbacks = new Map();
  }
  async start() {
    if (fs.existsSync(this.userDataDir)) fs.rmSync(this.userDataDir, { recursive: true, force: true });
    fs.mkdirSync(this.userDataDir, { recursive: true });
    this.proc = spawn("google-chrome", [
      "--headless=new", "--no-sandbox", "--disable-gpu",
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
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id); this.callbacks.delete(msg.id); cb(msg);
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
    if (res?.result?.exceptionDetails) console.log("EVAL ERR:", JSON.stringify(res.result.exceptionDetails).slice(0, 400));
    return res?.result?.result?.value;
  }
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", {
      type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1, ...extra,
    });
  }
  async screenshot(path) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    if (res?.result?.data) fs.writeFileSync(path, Buffer.from(res.result.data, "base64"));
  }
  async close() { if (this.ws) this.ws.close(); if (this.proc) this.proc.kill(); }
}

const outDir = "screenshots/qa_flip4";
fs.mkdirSync(outDir, { recursive: true });

const session = new BrowserSession(9891, "/tmp/chrome_flip4", "1680,1050");
await session.start();
await sleep(2500);

await session.evaluate(`
  (() => {
    const st = window.__store.getState();
    st.enterAsGuest();
    st.setActivePanel('album');
    st.setCurrentAlbumId('album_jiuzhaigou');
    st.setCurrentSpreadIndex(0);
  })()
`);
await sleep(1200);

const rect = await session.evaluate(`
  (() => {
    const el = document.querySelector('[style*="perspective"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  })()
`);
console.log("stage rect:", rect);

const cx = rect.x + rect.w / 2;
const cy = rect.y + rect.h / 2;

// Drag from right side of the book leftwards, capturing many frames
await session.mouse("mousePressed", cx + 220, cy);
await sleep(60);
const steps = [60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 770];
let n = 0;
for (const d of steps) {
  await session.mouse("mouseMoved", cx + 220 - d, cy, { buttons: 1 });
  await sleep(90);
  await session.screenshot(`${outDir}/drag_${String(n).padStart(2, "0")}_dx${d}.png`);
  n++;
}
await session.mouse("mouseReleased", cx + 220 - 770, cy, { buttons: 0 });
await sleep(1200);
await session.screenshot(`${outDir}/after_release.png`);

console.log("flip frames captured");
await session.close();
