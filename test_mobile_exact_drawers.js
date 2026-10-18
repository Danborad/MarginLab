import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Testing Mobile Drawers with Exact IDs...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--user-data-dir=/tmp/chrome-mobile-drawer-exact-" + Date.now(),
    "--remote-debugging-port=9997",
    "--window-size=390,844",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9997/json");
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

    // 1. Click #mobile-nav-templates
    console.log("1. Clicking #mobile-nav-templates...");
    await evalCode(`
      const el = document.getElementById("mobile-nav-templates");
      if (el) el.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_1_templates.png");

    // 2. Click #mobile-nav-media
    console.log("2. Clicking #mobile-nav-media...");
    await evalCode(`
      const el = document.getElementById("mobile-nav-media");
      if (el) el.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_2_media.png");

    // 3. Click #mobile-nav-text
    console.log("3. Clicking #mobile-nav-text...");
    await evalCode(`
      const el = document.getElementById("mobile-nav-text");
      if (el) el.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_3_text.png");

    // 4. Click #mobile-nav-shapes
    console.log("4. Clicking #mobile-nav-shapes...");
    await evalCode(`
      const el = document.getElementById("mobile-nav-shapes");
      if (el) el.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_4_shapes.png");

    // 5. Click #mobile-nav-stickers
    console.log("5. Clicking #mobile-nav-stickers...");
    await evalCode(`
      const el = document.getElementById("mobile-nav-stickers");
      if (el) el.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_5_stickers.png");

    // 6. Click #mobile-nav-background
    console.log("6. Clicking #mobile-nav-background...");
    await evalCode(`
      const el = document.getElementById("mobile-nav-background");
      if (el) el.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_6_background.png");

    // 7. Click #mobile-nav-layers
    console.log("7. Clicking #mobile-nav-layers...");
    await evalCode(`
      const el = document.getElementById("mobile-nav-layers");
      if (el) el.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_7_layers.png");

    // 8. Select an image element and Click #mobile-nav-properties
    console.log("8. Clicking #mobile-nav-properties with selected element...");
    await evalCode(`
      const store = window.__store.getState();
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) store.selectElements([firstImg.id]);
      const el = document.getElementById("mobile-nav-properties");
      if (el) el.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_8_properties.png");

    // 9. Open In-Frame Interactive Crop
    console.log("9. Opening Interactive Crop on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) store.setEditingCropId(firstImg.id);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_9_interactive_crop.png");

    // Close crop and open Profile Modal
    console.log("10. Opening User Profile Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.setEditingCropId(null);
      store.setAuthModalOpen(true, "profile");
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_10_user_profile_modal.png");

    // Open Replace Photo Modal
    console.log("11. Opening Replace Photo Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(false);
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) store.openReplacePhotoModal(firstImg.id);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_11_replace_photo_modal.png");

    // Open Export Modal
    console.log("12. Opening Export Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.closeReplacePhotoModal();
      store.setExportModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_12_export_modal.png");

    // Open Preset Size Modal
    console.log("13. Opening Preset Size Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.setExportModalOpen(false);
      store.setPresetModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_13_preset_modal.png");

    // Open Projects Library Modal
    console.log("14. Opening Projects Library Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.setPresetModalOpen(false);
      store.setProjectModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("mobile_drawer_14_projects_modal.png");

    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
