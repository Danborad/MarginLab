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

const outDir = "screenshots/qa_flips_dual";
fs.mkdirSync(outDir, { recursive: true });

const s = new Session(9892, "/tmp/chrome_dual_9892", "1680,1050", "http://localhost:3001");
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
  y: Math.round(rect.y - 40),
  width: Math.round(rect.w + 520),
  height: Math.round(rect.h + 130),
};

// 1. 拖拽往前翻 (P.1-2 -> P.3-4)
console.log("--- 1. Drag Forward ---");
const fwdStart = cx + 320;
await s.mouse("mousePressed", fwdStart, cy + 100);
await sleep(50);
for (const d of [60, 160, 260, 360, 460, 540]) {
  await s.mouse("mouseMoved", fwdStart - d, cy + 100, { buttons: 1 });
  await sleep(40);
  await s.shot(`${outDir}/1_fwd_drag_${d}.png`, clip);
}
await s.mouse("mouseReleased", fwdStart - 540, cy + 100, { buttons: 0 });
await sleep(900);
await s.shot(`${outDir}/1_fwd_landed.png`, clip);

let curSpread = await s.evaluate(`window.__store.getState().currentSpreadIndex`);
console.log("After fwd drag, spread index:", curSpread);

// 2. 拖拽往后翻 (P.3-4 -> P.1-2)
console.log("--- 2. Drag Backward ---");
const backStart = cx - 320;
await s.mouse("mousePressed", backStart, cy + 100);
await sleep(50);
for (const d of [60, 160, 260, 360, 460, 540]) {
  await s.mouse("mouseMoved", backStart + d, cy + 100, { buttons: 1 });
  await sleep(40);
  await s.shot(`${outDir}/2_back_drag_${d}.png`, clip);
}
await s.mouse("mouseReleased", backStart + 540, cy + 100, { buttons: 0 });
await sleep(900);
await s.shot(`${outDir}/2_back_landed.png`, clip);

curSpread = await s.evaluate(`window.__store.getState().currentSpreadIndex`);
console.log("After back drag, spread index:", curSpread);

// 3. 点击按钮自动翻页 (P.1-2 -> P.3-4)
console.log("--- 3. Auto Click Forward ---");
await s.evaluate(`
  (() => {
    const nextBtn = document.querySelector('button[title="下一页"]');
    if (nextBtn) nextBtn.click();
  })()
`);
for (let i = 0; i < 6; i++) {
  await sleep(90);
  await s.shot(`${outDir}/3_auto_fwd_${i}.png`, clip);
}
await sleep(500);
await s.shot(`${outDir}/3_auto_fwd_landed.png`, clip);
curSpread = await s.evaluate(`window.__store.getState().currentSpreadIndex`);
console.log("After auto forward, spread index:", curSpread);

// 4. 点击按钮自动后翻 (P.3-4 -> P.1-2)
console.log("--- 4. Auto Click Backward ---");
await s.evaluate(`
  (() => {
    const prevBtn = document.querySelector('button[title="上一页"]');
    if (prevBtn) prevBtn.click();
  })()
`);
for (let i = 0; i < 6; i++) {
  await sleep(90);
  await s.shot(`${outDir}/4_auto_back_${i}.png`, clip);
}
await sleep(500);
await s.shot(`${outDir}/4_auto_back_landed.png`, clip);
curSpread = await s.evaluate(`window.__store.getState().currentSpreadIndex`);
console.log("After auto backward, spread index:", curSpread);

await s.close();
console.log("All flips QA test completed successfully!");
