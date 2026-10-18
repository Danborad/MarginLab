import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("📸 Capturing dedicated sharp Auth showcase screenshots...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9996",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9996/json");
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
      console.log(`Saved screenshot: ${filename}`);
    };

    await new Promise((r) => setTimeout(r, 1500));

    // 1. Capture Login Tab View
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(true, "login");
    `);
    await new Promise((r) => setTimeout(r, 700));
    await snap("auth_showcase_1_login_tab.png");

    // 2. Capture Register Tab View
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(true, "register");
    `);
    await new Promise((r) => setTimeout(r, 700));
    await snap("auth_showcase_2_register_tab.png");

    // 3. Capture Profile & Security Dashboard View
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(true, "profile");
    `);
    await new Promise((r) => setTimeout(r, 700));
    await snap("auth_showcase_3_profile_tab.png");

    // 4. Capture Media Panel in Logged In State with Isolated Assets
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(false);
      store.setActivePanel("media");
      store.addMediaAssets([
        {
          name: "Tokyo-Street-Night-35mm.jpg",
          src: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=900&auto=format&fit=crop&q=80",
          width: 1200,
          height: 800,
          aspectRatio: 1.5,
          sizeBytes: 195000
        },
        {
          name: "Kyoto-Zen-Tea-Master.jpg",
          src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&auto=format&fit=crop&q=80",
          width: 1600,
          height: 1066,
          aspectRatio: 1.5,
          sizeBytes: 260000
        }
      ]);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("auth_showcase_4_user_media_isolated.png");

    // 5. Capture Logged Out Guest State
    await evalCode(`
      const store = window.__store.getState();
      store.logout();
      store.setAuthModalOpen(false);
    `);
    await new Promise((r) => setTimeout(r, 700));
    await snap("auth_showcase_5_logged_out_guest.png");

    console.log("✅ All clean showcase screenshots captured successfully!");
    ws.close();
  } catch (err) {
    console.error("Capture error:", err);
  } finally {
    chrome.kill();
  }
}
run();
