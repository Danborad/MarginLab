import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9836",
    "--user-data-dir=/tmp/chrome_verify_scrolled",
    "--window-size=1600,1000",
    "http://127.0.0.1:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9836/json/list");
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

  // 1. Login as lin (regular user)
  await send("Runtime.evaluate", {
    expression: 'window.__store.getState().login("lin", "123456")',
    awaitPromise: true,
  });
  await sleep(1200);

  // 2. Open Stylize in Light mode with Vertical Photo
  await send("Runtime.evaluate", {
    expression: `(() => {
      const store = window.__store.getState();
      store.setThemeMode("light");
      store.setActivePanel("ai-stylize");
      store.setSelectedAiStyleId("reality_collage");
      store.setAiSourceImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80");
      store.setLatestAiGeneratedImage(null);
    })()`,
    awaitPromise: true,
  });
  await sleep(1000);

  // Scroll drawer down to show form controls
  await send("Runtime.evaluate", {
    expression: `(() => {
      const aside = document.querySelector("aside");
      if (aside) {
        aside.scrollTop = 260;
      }
    })()`,
    awaitPromise: true,
  });
  await sleep(800);

  let res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_drawer_scrolled_controls.png", Buffer.from(res.data, "base64"));
  console.log("Saved verify_drawer_scrolled_controls.png");

  // Also test generation state
  await send("Runtime.evaluate", {
    expression: `(() => {
      const store = window.__store.getState();
      store.isGeneratingAi = true;
    })()`,
    awaitPromise: true,
  });
  await sleep(600);
  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_generating_state.png", Buffer.from(res.data, "base64"));
  console.log("Saved verify_generating_state.png");

  // Also test comparison state
  await send("Runtime.evaluate", {
    expression: `(() => {
      const store = window.__store.getState();
      store.isGeneratingAi = false;
      store.setLatestAiGeneratedImage("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80");
    })()`,
    awaitPromise: true,
  });
  await sleep(600);
  res = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_comparison_result.png", Buffer.from(res.data, "base64"));
  console.log("Saved verify_comparison_result.png");

  ws.close();
  proc.kill("SIGKILL");
}

run().catch(console.error);
