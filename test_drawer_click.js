import { spawn } from "child_process";
import fs from "fs";

async function run() {
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--user-data-dir=/tmp/chrome-mobile-qa-drawer-" + Date.now(),
    "--remote-debugging-port=9996",
    "--window-size=390,844",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9996/json");
      const tabs = await res.json();
      if (Array.isArray(tabs) && tabs.length > 0) {
        tab = tabs.find(t => t.type === "page") || tabs[0];
        if (tab && tab.webSocketDebuggerUrl) break;
      }
    } catch (e) {}
  }

  if (!tab) {
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

    await new Promise((r) => setTimeout(r, 1200));

    // Log in
    await evalCode(`
      (async () => {
        const store = window.__store.getState();
        await store.login("atelier", "123456");
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));

    // Check button text
    const btnTexts = await evalCode(`
      Array.from(document.querySelectorAll("button")).map(b => b.innerText || b.textContent)
    `);
    console.log("Found buttons:", btnTexts);

    // Click bottom bar "模板" button
    console.log("Clicking 模板 button...");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => (b.innerText || b.textContent).includes("模板"));
      if (btn) {
        console.log("Found 模板 btn, clicking it...");
        btn.click();
      }
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_templates_open.png");

    // Click "素材" button
    console.log("Clicking 素材 button...");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => (b.innerText || b.textContent).includes("素材"));
      if (btn) btn.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_media_open.png");

    // Click "属性" button
    console.log("Clicking 属性 button...");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => (b.innerText || b.textContent).includes("属性"));
      if (btn) btn.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_properties_open.png");

    // Click "背景" button
    console.log("Clicking 背景 button...");
    await evalCode(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => (b.innerText || b.textContent).includes("背景"));
      if (btn) btn.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_background_open.png");

    // Open User Profile Modal
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(true, "profile");
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_modal_profile_open.png");

    // Open Replace Photo Modal
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(false);
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) store.openReplacePhotoModal(firstImg.id);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_modal_replace_photo_open.png");

    // Open Export Modal
    await evalCode(`
      const store = window.__store.getState();
      store.closeReplacePhotoModal();
      store.setExportModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_modal_export_open.png");

    // Open Preset Size Modal
    await evalCode(`
      const store = window.__store.getState();
      store.setExportModalOpen(false);
      store.setPresetModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_modal_preset_open.png");

    // Open Project Manager Modal
    await evalCode(`
      const store = window.__store.getState();
      store.setPresetModalOpen(false);
      store.setProjectModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_modal_projects_open.png");

    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
