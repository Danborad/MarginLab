/* 翻页流畅度探针：在真实页面上录制一帧一次的时间戳，统计掉帧。 */
import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = Number(process.argv[2] || 9891);
const url = process.argv[3] || "http://localhost:3001";

const userDataDir = `/tmp/chrome_perf_${port}`;
if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });
fs.mkdirSync(userDataDir, { recursive: true });
const proc = spawn("google-chrome", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--window-size=1680,1050",
  url,
]);

let tab = null;
for (let i = 0; i < 60; i++) {
  await sleep(300);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`);
    const tabs = await res.json();
    if (tabs?.length) {
      tab = tabs.find((t) => t.type === "page") || tabs[0];
      if (tab?.webSocketDebuggerUrl) break;
    }
  } catch (e) {}
}
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let msgId = 1;
const cbs = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && cbs.has(m.id)) {
    const cb = cbs.get(m.id);
    cbs.delete(m.id);
    cb(m);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = msgId++;
    cbs.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r?.result?.exceptionDetails) console.log("ERR", JSON.stringify(r.result.exceptionDetails).slice(0, 200));
  return r?.result?.result?.value;
};
const mouse = (type, x, y, extra = {}) =>
  send("Input.dispatchMouseEvent", {
    type,
    x,
    y,
    button: "left",
    buttons: type === "mouseReleased" ? 0 : 1,
    clickCount: 1,
    ...extra,
  });

await sleep(3000);
console.log(await evaluate("location.href"));
await evaluate(`
  (() => {
    const st = window.__store.getState();
    st.enterAsGuest();
    st.setActivePanel('album');
    st.setCurrentAlbumId('album_jiuzhaigou');
    st.setCurrentSpreadIndex(0);
  })()
`);
await sleep(1600);

const rect = await evaluate(`
  (() => { const b = document.querySelector('[style*="perspective"]').getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height }; })()
`);
console.log("rect", rect);

await evaluate(`
  (() => {
    window.__frames = [];
    let last = performance.now();
    const tick = (now) => { window.__frames.push(now - last); last = now; if (window.__rec) requestAnimationFrame(tick); };
    window.__rec = true;
    requestAnimationFrame(tick);
  })()
`);

await send("Performance.enable");
const metricsOf = async () => {
  const r = await send("Performance.getMetrics");
  const out = {};
  for (const m of r?.result?.metrics || []) out[m.name] = m.value;
  return out;
};
const before = await metricsOf();

const cx = rect.x + rect.w / 2 + rect.w * 0.25;
const cy = rect.y + rect.h / 2;
await mouse("mousePressed", cx, cy);
await sleep(25);
await mouse("mouseReleased", cx, cy, { buttons: 0 });
await sleep(1400);
await evaluate("window.__rec = false");
const after = await metricsOf();
const keys = [
  "ScriptDuration",
  "TaskDuration",
  "LayoutDuration",
  "RecalcStyleDuration",
  "DevToolsCommandDuration",
];
const diff = {};
for (const k of keys) diff[k] = +((after[k] || 0) - (before[k] || 0)).toFixed(3);
console.log("perf diff(s):", diff);

const stats = await evaluate(`
  (() => {
    const f = window.__frames.filter((x) => x > 0);
    const sorted = [...f].sort((a, b) => a - b);
    const pct = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
    return {
      n: f.length,
      median: +pct(0.5).toFixed(1),
      p90: +pct(0.9).toFixed(1),
      p99: +pct(0.99).toFixed(1),
      max: +Math.max(...f).toFixed(1),
      over20: f.filter((x) => x > 20).length,
      over33: f.filter((x) => x > 33).length,
    };
  })()
`);
console.log("frame stats(ms):", stats);
ws.close();
proc.kill();
