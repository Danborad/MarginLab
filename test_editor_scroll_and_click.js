import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const dir = "/tmp/chrome_editor_scroll";
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9486",
    `--user-data-dir=${dir}`,
    "--window-size=1920,1080",
    "http://127.0.0.1:3010",
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const res = await fetch("http://127.0.0.1:9486/json/list");
      const tabs = await res.json();
      if (tabs?.[0]?.webSocketDebuggerUrl) {
        wsUrl = tabs[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((res) => (ws.onopen = res));

  let msgId = 1;
  const cbs = new Map();
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && cbs.has(msg.id)) {
      const cb = cbs.get(msg.id);
      cbs.delete(msg.id);
      cb(msg);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      cbs.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evalExpr = async (expr) => {
    const res = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.result?.value;
  };

  const screenshot = async (outPath) => {
    const res = await send("Page.captureScreenshot", { format: "png" });
    const data = res.result?.data || res.data;
    if (data) {
      fs.writeFileSync(outPath, Buffer.from(data, "base64"));
      console.log(`Saved screenshot: ${outPath}`);
    }
  };

  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await sleep(1500);

    console.log("Setting studio view & AI stylize...");
    await evalExpr(`
      window.__store.getState().login("admin", "admin123");
      window.__store.getState().setCurrentView("studio");
      window.__store.getState().setActivePanel("ai-stylize");
    `);
    await sleep(1000);

    console.log("Switching to custom editor...");
    await evalExpr(`
      const btns = Array.from(document.querySelectorAll('button'));
      const editBtn = btns.find(b => b.textContent && b.textContent.includes('AI 自由图片编辑'));
      if (editBtn) editBtn.click();
    `);
    await sleep(1000);

    console.log("Scrolling left panel down to show generate button...");
    await evalExpr(`
      const leftCol = Array.from(document.querySelectorAll('div')).find(d => d.className && d.className.includes('w-full lg:w-[460px]'));
      if (leftCol) {
        leftCol.scrollTop = leftCol.scrollHeight;
      }
    `);
    await sleep(500);
    await screenshot("screenshots/req_check_3_button_scrolled.png");

    console.log("Clicking generate button...");
    await evalExpr(`
      const genBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('调用 API 开始 AI 图像生成'));
      if (genBtn) genBtn.click();
    `);
    await sleep(1000);
    await screenshot("screenshots/req_check_3_clicked_feedback.png");

    console.log("Done!");
  } finally {
    ws.close();
    proc.kill("SIGKILL");
  }
}

run().catch(console.error);
