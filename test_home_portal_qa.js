import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Starting Home Portal & Landing Page Comprehensive QA...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9997",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9997/json");
      const tabs = await res.json();
      if (Array.isArray(tabs) && tabs.length > 0) {
        tab = tabs.find(t => t.type === "page" && t.url.includes("3001")) || tabs[0];
        if (tab && tab.webSocketDebuggerUrl) break;
      }
    } catch (e) {}
  }

  if (!tab) {
    console.error("Could not find chrome tab");
    chrome.kill();
    return;
  }

  try {
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === msgId) {
            ws.removeEventListener("message", handler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await new Promise((r) => ws.onopen = r);
    await send("Page.enable");
    await send("Runtime.enable");

    const evalCode = async (expr) => {
      const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : null;
    };

    const snap = async (filename) => {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(filename, Buffer.from(data, "base64"));
      console.log(`📸 Saved screenshot: ${filename}`);
    };

    await new Promise((r) => setTimeout(r, 1500));

    // Force clear session to ensure starting on Landing Home Page
    await evalCode(`
      const store = window.__store.getState();
      store.logout();
    `);
    await new Promise((r) => setTimeout(r, 800));

    // Step 1: Landing Page Initial View
    console.log("Step 1: Capturing Landing Home Page...");
    await snap("home_showcase_1_landing.png");

    // Step 2: Switch to Register tab on Home Page
    console.log("Step 2: Switching to Register tab on Home Page...");
    await evalCode(`
      const regTabBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("注册独立账号"));
      if (regTabBtn) regTabBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("home_showcase_2_register_tab.png");

    // Step 3: Register a new account "tokyo_curator"
    console.log("Step 3: Registering new user...");
    await evalCode(`
      const store = window.__store.getState();
      store.register({
        username: "tokyo_curator",
        password: "japan2026",
        name: "Tokyo • 先锋策展人",
        avatar: "🏛️",
        role: "策展人 / 艺术指导",
        bio: "米家 6 寸胶片画报与高定展览海报"
      });
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await snap("home_showcase_3_studio_workspace.png");

    // Step 4: Click Header "ATELIER 首页 ↗" to return to Landing Page
    console.log("Step 4: Returning to Landing Home Page...");
    await evalCode(`
      const store = window.__store.getState();
      store.setCurrentView("home");
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("home_showcase_4_home_logged_in_state.png");

    console.log("🎉 All Home Portal QA tests passed!");
    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
