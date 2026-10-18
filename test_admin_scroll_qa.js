import { spawn } from "child_process";
import fs from "fs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9335",
    "--user-data-dir=/tmp/chrome_qa_scroll",
    "--window-size=1440,900",
    "http://127.0.0.1:3001",
  ]);

  await sleep(1500);
  const res = await fetch("http://127.0.0.1:9335/json/list");
  const tabs = await res.json();
  const tab = tabs[0];
  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === curId) {
        ws.removeEventListener("message", handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await sleep(1500);

  // Login as admin
  await send("Runtime.evaluate", {
    expression: `window.__store.getState().login('admin', 'admin123')`,
    awaitPromise: true,
  });
  await sleep(1200);

  // Open Admin modal on AI Config tab
  await send("Runtime.evaluate", {
    expression: `window.__store.getState().setAdminModalOpen(true, 'ai_config')`,
    awaitPromise: true,
  });
  await sleep(1000);

  // Scroll modal body down to show ratio picker
  await send("Runtime.evaluate", {
    expression: `
      const form = document.querySelector('form.overflow-y-auto');
      if (form) form.scrollTop = form.scrollHeight;
    `,
    awaitPromise: true,
  });
  await sleep(600);

  const scr = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("auto_ratio_qa_5_admin_scrolled.png", Buffer.from(scr.data, "base64"));
  console.log("Saved: auto_ratio_qa_5_admin_scrolled.png");

  ws.close();
  proc.kill("SIGKILL");
}

run().catch(console.error);
