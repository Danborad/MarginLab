import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9844",
    "--user-data-dir=/tmp/chrome_inplace_qa",
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

  if (!tab) {
    console.error("Failed to connect to chrome");
    process.exit(1);
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

  console.log("Connected to browser. Logging into studio...");
  await sleep(1500);

  // Login and navigate to ai-stylize stage
  await send("Runtime.evaluate", {
    expression: `
      (async () => {
        const store = window.__store.getState();
        await store.login("admin", "admin123");
        store.setCurrentView("studio");
        store.setActivePanel("ai-stylize");
      })()
    `,
    awaitPromise: true,
  });
  await sleep(1500);

  // Step 1: Empty state screenshot
  const snap1 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_inplace_1_empty_stage.png", Buffer.from(snap1.data, "base64"));
  console.log("Saved: verify_inplace_1_empty_stage.png");

  // Step 2: Set Source Photo (Portrait sample)
  await send("Runtime.evaluate", {
    expression: `
      (async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 800;
        const ctx = canvas.getContext("2d");
        const grad = ctx.createLinearGradient(0, 0, 600, 800);
        grad.addColorStop(0, "#2c1810");
        grad.addColorStop(0.5, "#8b5a2b");
        grad.addColorStop(1, "#f5deb3");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 800);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px serif";
        ctx.fillText("Editorial Portrait", 120, 400);
        const sampleBase64 = canvas.toDataURL("image/png");

        const store = window.__store.getState();
        store.setAiSourceImage(sampleBase64);
      })()
    `,
    awaitPromise: true,
  });
  await sleep(1000);

  // Step 2: Photo loaded (verify NO filename and NO dimensions bar)
  const snap2 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_inplace_2_photo_loaded_clean.png", Buffer.from(snap2.data, "base64"));
  console.log("Saved: verify_inplace_2_photo_loaded_clean.png");

  // Step 3: Trigger in-place generating state
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        window.__store.setState({ isGeneratingAi: true });
      })()
    `,
  });
  await sleep(600);

  const snap3 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_inplace_3_generating_overlay.png", Buffer.from(snap3.data, "base64"));
  console.log("Saved: verify_inplace_3_generating_overlay.png");

  // Step 4: Generation finished with result
  await send("Runtime.evaluate", {
    expression: `
      (async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 750;
        canvas.height = 1000;
        const ctx = canvas.getContext("2d");
        const grad = ctx.createLinearGradient(0, 0, 750, 1000);
        grad.addColorStop(0, "#09090b");
        grad.addColorStop(0.4, "#451a03");
        grad.addColorStop(0.8, "#78350f");
        grad.addColorStop(1, "#b45309");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 750, 1000);
        ctx.fillStyle = "#fef08a";
        ctx.font = "italic bold 48px serif";
        ctx.fillText("白日焰火 • 梦幻动态", 100, 320);
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px sans-serif";
        ctx.fillText("AI Editorial Masterpiece", 100, 380);
        const artBase64 = canvas.toDataURL("image/png");

        window.__store.setState({
          isGeneratingAi: false,
          latestAiGeneratedImage: artBase64
        });
      })()
    `,
    awaitPromise: true,
  });
  await sleep(1000);

  const snap4 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_inplace_4_result_ready_in_drawer.png", Buffer.from(snap4.data, "base64"));
  console.log("Saved: verify_inplace_4_result_ready_in_drawer.png");

  // Step 5: Test Hold-to-Peek Original
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const peekBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("按住看原图"));
        if (peekBtn) {
          peekBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        }
      })()
    `,
  });
  await sleep(500);

  const snap5 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_inplace_5_hold_peek_original.png", Buffer.from(snap5.data, "base64"));
  console.log("Saved: verify_inplace_5_hold_peek_original.png");

  // Release mouse
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const peekBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("按住看原图"));
        if (peekBtn) {
          peekBtn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        }
      })()
    `,
  });
  await sleep(500);

  // Step 6: Test Light Mode with result ready
  await send("Runtime.evaluate", {
    expression: `
      window.__store.getState().setThemeMode("light");
    `,
  });
  await sleep(1000);

  const snap6 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_inplace_6_light_mode_result.png", Buffer.from(snap6.data, "base64"));
  console.log("Saved: verify_inplace_6_light_mode_result.png");

  // Step 7: Test Light Mode with photo loaded before generate
  await send("Runtime.evaluate", {
    expression: `
      window.__store.setState({ latestAiGeneratedImage: null });
    `,
  });
  await sleep(800);

  const snap7 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("verify_inplace_7_light_mode_photo_clean.png", Buffer.from(snap7.data, "base64"));
  console.log("Saved: verify_inplace_7_light_mode_photo_clean.png");

  ws.close();
  chrome.kill();
  console.log("All verification screenshots captured successfully!");
}

run().catch(console.error);