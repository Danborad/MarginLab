import { spawn } from "child_process";
import fs from "fs";

async function run() {
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--user-data-dir=/tmp/chrome-modals-test-" + Date.now(),
    "--remote-debugging-port=9999",
    "--window-size=390,844",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9999/json");
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

    // 1. Open Profile Modal via clicking Header user button
    console.log("1. Opening profile modal by clicking header user button...");
    await evalCode(`
      const userBtn = Array.from(document.querySelectorAll("header button")).find(b => b.title && b.title.includes("当前账号"));
      if (userBtn) userBtn.click();
      else window.__store.getState().setAuthModalOpen(true, "profile");
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("modal_test_1_profile.png");

    // Close profile modal
    console.log("Closing profile modal...");
    await evalCode(`
      window.__store.getState().setAuthModalOpen(false);
    `);
    await new Promise((r) => setTimeout(r, 600));

    // 2. Open Replace Photo Modal via clicking floating replace button
    console.log("2. Opening Replace Photo Modal...");
    await evalCode(`
      const store = window.__store.getState();
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) store.openReplacePhotoModal(firstImg.id);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("modal_test_2_replace_photo.png");

    // Close replace modal
    await evalCode(`window.__store.getState().closeReplacePhotoModal()`);
    await new Promise((r) => setTimeout(r, 600));

    // 3. Open Export Modal via clicking Header Export button
    console.log("3. Opening Export Modal...");
    await evalCode(`
      const exportBtn = Array.from(document.querySelectorAll("header button")).find(b => b.textContent.includes("导出"));
      if (exportBtn) exportBtn.click();
      else window.__store.getState().setExportModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("modal_test_3_export.png");

    // Close export modal
    await evalCode(`window.__store.getState().setExportModalOpen(false)`);
    await new Promise((r) => setTimeout(r, 600));

    // 4. Open Preset Sizes Modal via clicking Header Preset button
    console.log("4. Opening Preset Size Modal...");
    await evalCode(`
      const presetBtn = Array.from(document.querySelectorAll("header button")).find(b => b.title && b.title.includes("相纸"));
      if (presetBtn) presetBtn.click();
      else window.__store.getState().setPresetModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("modal_test_4_presets.png");

    // Close preset modal
    await evalCode(`window.__store.getState().setPresetModalOpen(false)`);
    await new Promise((r) => setTimeout(r, 600));

    // 5. Open Project Library Modal
    console.log("5. Opening Project Library Modal...");
    await evalCode(`
      window.__store.getState().setProjectModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("modal_test_5_projects.png");

    // Close project modal
    await evalCode(`window.__store.getState().setProjectModalOpen(false)`);
    await new Promise((r) => setTimeout(r, 600));

    // 6. Open Auto-Layout Modal
    console.log("6. Opening Auto-Layout Modal...");
    await evalCode(`
      window.__store.getState().setAutoLayoutModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("modal_test_6_auto_layout.png");

    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
