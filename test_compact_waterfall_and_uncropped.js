import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9833",
    "--user-data-dir=/tmp/chrome_compact_waterfall",
    "--window-size=1600,1000",
    "http://127.0.0.1:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9833/json/list");
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

  await send("Page.enable");
  await send("Runtime.enable");
  await sleep(1500);

  // 1. Login as admin
  await send("Runtime.evaluate", {
    expression: 'window.__store.getState().login("admin", "admin123")',
    awaitPromise: true,
  });
  await sleep(1200);

  // 2. Open Stylize in Dark mode with Vertical Sample Photo
  await send("Runtime.evaluate", {
    expression: `(() => {
      const store = window.__store.getState();
      store.setThemeMode("dark");
      store.setActivePanel("ai-stylize");
      store.setSelectedAiStyleId("s21-dreamy-motion");
      // Vertical portrait photo (from user attachment)
      store.setAiSourceImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80");
      store.setLatestAiGeneratedImage(null);
    })()`,
    awaitPromise: true,
  });
  await sleep(1000);

  // Screenshot 1: Dark Mode with Vertical Photo Full Display & Compact Waterfall
  let res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("compact_waterfall_dark_vertical.png", Buffer.from(res.data, "base64"));
  console.log("Saved compact_waterfall_dark_vertical.png");

  // 3. Switch to Light Mode
  await send("Runtime.evaluate", {
    expression: 'window.__store.getState().setThemeMode("light")',
    awaitPromise: true,
  });
  await sleep(800);

  // Screenshot 2: Light Mode with Vertical Photo Full Display & Compact Waterfall
  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("compact_waterfall_light_vertical.png", Buffer.from(res.data, "base64"));
  console.log("Saved compact_waterfall_light_vertical.png");

  // 4. Test Horizontal Photo (Landscape 16:9)
  await send("Runtime.evaluate", {
    expression: `(() => {
      const store = window.__store.getState();
      store.setAiSourceImage("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80");
    })()`,
    awaitPromise: true,
  });
  await sleep(1000);

  // Screenshot 3: Horizontal Photo Full Display (Light Mode)
  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("compact_waterfall_light_horizontal.png", Buffer.from(res.data, "base64"));
  console.log("Saved compact_waterfall_light_horizontal.png");

  // Screenshot 4: Horizontal Photo Full Display (Dark Mode)
  await send("Runtime.evaluate", {
    expression: 'window.__store.getState().setThemeMode("dark")',
    awaitPromise: true,
  });
  await sleep(600);
  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("compact_waterfall_dark_horizontal.png", Buffer.from(res.data, "base64"));
  console.log("Saved compact_waterfall_dark_horizontal.png");

  ws.close();
  proc.kill("SIGKILL");
}

run().catch(console.error);
