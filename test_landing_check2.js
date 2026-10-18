import { spawn, execSync } from "child_process";
import fs from "fs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkLanding() {
  const userDataDir = "/tmp/chrome_landing_check2";
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
  fs.mkdirSync(userDataDir, { recursive: true });

  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9974",
    `--user-data-dir=${userDataDir}`,
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 50; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9974/json/list");
      const tabs = await res.json();
      if (Array.isArray(tabs) && tabs.length > 0) {
        tab = tabs.find((t) => t.type === "page" && t.url.includes("3001")) || tabs[0];
        if (tab && tab.webSocketDebuggerUrl) break;
      }
    } catch (e) {}
  }

  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.id === id) {
        ws.removeEventListener("message", handler);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await sleep(2000);

  const res = await send("Runtime.evaluate", {
    expression: "document.title",
    returnByValue: true,
  });

  console.log("Page title:", res.result?.value);

  const evalAdmin = await send("Runtime.evaluate", {
    expression: "document.querySelector('#landing-demo-admin') ? document.querySelector('#landing-demo-admin').innerText : 'NO_ADMIN_ID'",
    returnByValue: true,
  });
  console.log("Admin button text:
", evalAdmin.result?.value);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("admin_qa_1_landing_page_admin_demo.png", Buffer.from(shot.data, "base64"));
  console.log("Screenshot saved: admin_qa_1_landing_page_admin_demo.png");

  ws.close();
  proc.kill("SIGKILL");
}

checkLanding().catch(console.error);
