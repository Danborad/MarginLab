import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Running Mobile Views Visual Verification...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--user-data-dir=/tmp/chrome-mobile-verify-" + Date.now(),
    "--remote-debugging-port=9998",
    "--window-size=390,844",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9998/json");
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

    // 1. Landing Page
    await evalCode(`
      const store = window.__store.getState();
      store.setCurrentView("home");
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_1_landing.png");

    // 2. Studio Workspace
    await evalCode(`
      (async () => {
        const store = window.__store.getState();
        await store.login("atelier", "123456");
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await snap("mobile_verify_2_studio_main.png");

    // 3. Test Drawer: Templates
    await evalCode(`document.getElementById("mobile-nav-templates")?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_3_drawer_templates.png");

    // 4. Test Drawer: Media
    await evalCode(`document.getElementById("drawer-tab-media")?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_4_drawer_media.png");

    // 5. Test Drawer: Text
    await evalCode(`document.getElementById("drawer-tab-text")?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_5_drawer_text.png");

    // 6. Test Drawer: Shapes
    await evalCode(`document.getElementById("drawer-tab-shapes")?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_6_drawer_shapes.png");

    // 7. Test Drawer: Stickers
    await evalCode(`document.getElementById("drawer-tab-stickers")?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_7_drawer_stickers.png");

    // 8. Test Drawer: Background
    await evalCode(`document.getElementById("drawer-tab-background")?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_8_drawer_background.png");

    // 9. Test Drawer: Layers
    await evalCode(`document.getElementById("drawer-tab-layers")?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_9_drawer_layers.png");

    // 10. Select Image and Test Drawer: Properties
    await evalCode(`
      const store = window.__store.getState();
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) store.selectElements([firstImg.id]);
      document.getElementById("drawer-tab-properties")?.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_10_drawer_properties.png");

    // 11. Close Drawer
    await evalCode(`document.getElementById("close-mobile-drawer-btn")?.click()`);
    await new Promise((r) => setTimeout(r, 500));

    // 12. Profile Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(true, "profile");
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_11_modal_profile.png");

    // 13. Replace Photo Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(false);
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) store.openReplacePhotoModal(firstImg.id);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_12_modal_replace_photo.png");

    // 14. Export Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.closeReplacePhotoModal();
      store.setExportModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_13_modal_export.png");

    // 15. Preset Size Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.setExportModalOpen(false);
      store.setPresetModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_14_modal_preset_sizes.png");

    // 16. Projects Library Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.setPresetModalOpen(false);
      store.setProjectModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_15_modal_project_library.png");

    // 17. Intelligent Auto Layout Modal on Mobile
    await evalCode(`
      const store = window.__store.getState();
      store.setProjectModalOpen(false);
      store.setAutoLayoutModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_verify_16_modal_auto_layout.png");

    console.log("🎉 All 16 verification tests completed!");
    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
