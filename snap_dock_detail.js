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
    "--remote-debugging-port=9570",
    "--user-data-dir=/tmp/chrome_dock_snap",
    "--window-size=1600,1050",
    "about:blank",
  ]);

  let tab = null;
  for (let i = 0; i < 50; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9570/json/list");
      const tabs = await res.json();
      if (Array.isArray(tabs) && tabs.length > 0) {
        tab = tabs.find((t) => t.type === "page") || tabs[0];
        if (tab && tab.webSocketDebuggerUrl) break;
      }
    } catch (e) {}
  }

  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let msgId = 1;
  const send = (method, params = {}) => {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await send("Page.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:3001" });
  await sleep(2500);

  // Login as admin & enter stylize
  await send("Runtime.evaluate", {
    expression: `
      (async () => {
        const store = window.__store.getState();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
        store.setActivePanel('ai-stylize');
        const samplePhoto = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'><rect width='800' height='1000' fill='%231f2937'/><circle cx='400' cy='450' r='220' fill='%23d97706'/><text x='400' y='820' font-size='50' fill='white' text-anchor='middle'>PHOTOGRAPHY PORTRAIT</text></svg>";
        store.setAiSourceImage(samplePhoto);
        store.setLatestAiGeneratedImage(null);
      })()
    `,
    awaitPromise: true,
  });
  await sleep(1500);

  // Get clip rect of the right dock
  const clipRes = await send("Runtime.evaluate", {
    expression: `
      (function() {
        const aside = document.querySelector('aside');
        const r = aside.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 };
      })()
    `,
    returnByValue: true,
  });
  const clip = clipRes.result.value;

  // Snap 1: Idle state closeup of right dock
  const snap1 = await send("Page.captureScreenshot", { format: "png", clip });
  fs.writeFileSync("dock_detail_1_idle_under_ratios.png", Buffer.from(snap1.data, "base64"));
  console.log("Saved: dock_detail_1_idle_under_ratios.png");

  // Simulate active running task
  await send("Runtime.evaluate", {
    expression: `
      (function() {
        const store = window.__store.getState();
        const samplePhoto = store.aiSourceImage;
        const taskRunning = {
          id: "task_running_now",
          styleId: "street_photo_color_chibi",
          styleName: "彩色轻Q实景插画",
          sourceImage: samplePhoto,
          aspectRatio: "3:4",
          status: "running",
          progress: 75,
          stageText: "正在重构「彩色轻Q实景插画」先锋视觉...",
          createdAt: Date.now()
        };
        store.aiQueue = [taskRunning];
        store.isQueueRunning = true;
        store.isGeneratingAi = true;
        store.setSelectedAiStyleId("street_photo_color_chibi");
      })()
    `,
  });
  await sleep(1000);

  // Snap 2: Running state closeup of right dock
  const snap2 = await send("Page.captureScreenshot", { format: "png", clip });
  fs.writeFileSync("dock_detail_2_running_task_no_overlap.png", Buffer.from(snap2.data, "base64"));
  console.log("Saved: dock_detail_2_running_task_no_overlap.png");

  ws.close();
  proc.kill();
  console.log("Done!");
}

run();
