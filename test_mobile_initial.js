import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("📸 Testing Mobile Views...");
  // Launch chrome with mobile viewport
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9992",
    "--window-size=390,844",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9992/json");
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
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

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

    // 1. Mobile Landing Page Top
    await snap("mobile_1_landing_top.png");

    // Scroll to Auth Form
    await evalCode(`
      const el = document.getElementById("auth-portal");
      if (el) el.scrollIntoView();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_2_landing_auth_form.png");

    // Switch to Register Tab
    await evalCode(`
      const regBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("注册独立账号"));
      if (regBtn) regBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_3_landing_register_form.png");

    // 2. Enter Studio Workspace as demo user "atelier"
    console.log("Entering Studio workspace...");
    await evalCode(`
      (async () => {
        const store = window.__store.getState();
        await store.login("atelier", "123456");
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await snap("mobile_4_studio_workspace.png");

    // 3. Open Mobile Drawer for Templates
    await evalCode(`
      const tplBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("模板"));
      if (tplBtn) tplBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_5_drawer_templates.png");

    // 4. Open Mobile Drawer for Media
    await evalCode(`
      const mediaBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("素材"));
      if (mediaBtn) mediaBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_6_drawer_media.png");

    // 5. Open Mobile Drawer for Properties
    await evalCode(`
      const propBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("属性"));
      if (propBtn) propBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_7_drawer_properties.png");

    // 6. Close Drawer and open User Account Profile Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(true, "profile");
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_8_user_profile_modal.png");

    // 7. Open Export Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(false);
      store.setExportModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_9_export_modal.png");

    // 8. Open Preset Size Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.setExportModalOpen(false);
      store.setPresetModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_10_preset_modal.png");

    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
