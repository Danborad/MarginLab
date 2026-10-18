import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9835",
    "--user-data-dir=/tmp/chrome_verify_all",
    "--window-size=1600,1000",
    "http://127.0.0.1:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9835/json/list");
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

  // 1. Landing Page (Clean, no user type)
  await send("Runtime.evaluate", {
    expression: '(() => { window.__store.getState().logout(); window.__store.getState().setCurrentView("home"); })()',
    awaitPromise: true,
  });
  await sleep(1000);
  let res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_step1_clean_landing_login.png", Buffer.from(res.data, "base64"));
  console.log("Saved verify_step1_clean_landing_login.png");

  // 2. Login as regular user (lin / 123456)
  await send("Runtime.evaluate", {
    expression: 'window.__store.getState().login("lin", "123456")',
    awaitPromise: true,
  });
  await sleep(1200);

  // 3. AI Stylize Stage in Light mode with Vertical Photo (matching user reference)
  await send("Runtime.evaluate", {
    expression: `(() => {
      const store = window.__store.getState();
      store.setThemeMode("light");
      store.setActivePanel("ai-stylize");
      store.setSelectedAiStyleId("reality_collage");
      // Vertical portrait photo matching reference
      store.setAiSourceImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80");
      store.setLatestAiGeneratedImage(null);
    })()`,
    awaitPromise: true,
  });
  await sleep(1200);

  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_step2_stylize_light_vertical_hero.png", Buffer.from(res.data, "base64"));
  console.log("Saved verify_step2_stylize_light_vertical_hero.png");

  // 4. AI Stylize Stage in Dark mode with Vertical Photo
  await send("Runtime.evaluate", {
    expression: 'window.__store.getState().setThemeMode("dark")',
    awaitPromise: true,
  });
  await sleep(800);

  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_step3_stylize_dark_vertical_hero.png", Buffer.from(res.data, "base64"));
  console.log("Saved verify_step3_stylize_dark_vertical_hero.png");

  // 5. Test empty photo state (dropzone)
  await send("Runtime.evaluate", {
    expression: `(() => {
      const store = window.__store.getState();
      store.setThemeMode("light");
      store.setAiSourceImage(null);
      store.setLatestAiGeneratedImage(null);
    })()`,
    awaitPromise: true,
  });
  await sleep(800);

  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_step4_stylize_empty_dropzone.png", Buffer.from(res.data, "base64"));
  console.log("Saved verify_step4_stylize_empty_dropzone.png");

  ws.close();
  proc.kill("SIGKILL");
}

run().catch(console.error);
