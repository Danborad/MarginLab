import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9865",
    "--user-data-dir=/tmp/chrome_light_mode_qa",
    "--window-size=1600,1000",
    "http://127.0.0.1:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9865/json/list");
      const tabs = await res.json();
      tab = tabs.find((t) => t.type === "page") || tabs[0];
      if (tab && tab.webSocketDebuggerUrl) break;
    } catch (e) {}
  }

  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener("message", handler);
          resolve(d.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expr) => {
    const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return res?.result?.value;
  };

  const snap = async (filename) => {
    const res = await send("Page.captureScreenshot", { format: "png" });
    if (res?.data) {
      fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
      console.log(`[Screenshot Captured] ${filename}`);
    }
  };

  await send("Page.enable");
  await send("DOM.enable");
  await send("Runtime.enable");

  await sleep(1000);

  // Switch to studio, stylize stage, and light mode
  await evaluate(`
    (async () => {
      const store = window.__store.getState();
      await store.login('admin', 'admin123');
      store.setCurrentView('studio');
      store.setActivePanel('ai-stylize');
      if (store.themeMode === 'dark') {
        store.toggleThemeMode();
      }
    })()
  `);
  await sleep(1500);

  await snap("qa_light_1_stylize_stage_single_s21.png");

  // Open Admin Styles tab in Light Mode
  await evaluate(`
    window.__store.getState().setAdminModalOpen(true, 'styles');
  `);
  await sleep(1500);
  await snap("qa_light_2_admin_styles_tab.png");

  ws.close();
  proc.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
