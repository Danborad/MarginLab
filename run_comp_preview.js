import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9844",
    "--user-data-dir=/tmp/chrome_comp_preview",
    "--window-size=1600,1000",
    "http://127.0.0.1:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9844/json/list");
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

  // Login as lin
  await send("Runtime.evaluate", {
    expression: 'window.__store.getState().login("lin", "123456")',
    awaitPromise: true,
  });
  await sleep(1200);

  // Set AI state with photo and result in Dark Mode
  await send("Runtime.evaluate", {
    expression: `(() => {
      const store = window.__store.getState();
      store.setThemeMode("dark");
      store.setActivePanel("ai-stylize");
      store.setSelectedAiStyleId("s21-dreamy-motion");
      store.setAiSourceImage("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80");
      store.setLatestAiGeneratedImage("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80");
    })()`,
    awaitPromise: true,
  });
  await sleep(1000);

  // Screenshot Dark Frame Mode
  let res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("final_comp_dark_frame.png", Buffer.from(res.data, "base64"));
  console.log("Saved final_comp_dark_frame.png");

  // Switch to Light Mode
  await send("Runtime.evaluate", {
    expression: 'window.__store.getState().setThemeMode("light")',
    awaitPromise: true,
  });
  await sleep(800);

  // Screenshot Light Frame Mode
  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("final_comp_light_frame.png", Buffer.from(res.data, "base64"));
  console.log("Saved final_comp_light_frame.png");

  // Screenshot Light Side by Side Mode
  await send("Runtime.evaluate", {
    expression: 'Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("左右对比"))?.click()',
    awaitPromise: true,
  });
  await sleep(600);
  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("final_comp_light_side_by_side.png", Buffer.from(res.data, "base64"));
  console.log("Saved final_comp_light_side_by_side.png");

  // Apply Dual Layout
  await send("Runtime.evaluate", {
    expression: 'Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("套用双联高定排版"))?.click()',
    awaitPromise: true,
  });
  await sleep(1500);
  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("final_canvas_light_dual.png", Buffer.from(res.data, "base64"));
  console.log("Saved final_canvas_light_dual.png");

  ws.close();
  proc.kill("SIGKILL");
}

run().catch(console.error);
