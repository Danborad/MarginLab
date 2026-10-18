import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Starting Full Mobile QA Suite (iPhone 390x844, iPhone SE 375x667, iPad 768x1024)...");
  
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9993",
    "--window-size=390,844",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9993/json");
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

    const setViewport = async (w, h, scale = 2) => {
      await send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: scale,
        mobile: true,
      });
    };

    const evalCode = async (expr) => {
      const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : null;
    };

    const snap = async (filename) => {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(filename, Buffer.from(data, "base64"));
      console.log(`📸 Saved screenshot: ${filename}`);
    };

    // 1. Mobile Landing Page (iPhone 390x844)
    await setViewport(390, 844);
    await send("Page.reload");
    await new Promise((r) => setTimeout(r, 1500));

    // Ensure we start on home view
    await evalCode(`
      const store = window.__store.getState();
      store.setCurrentView("home");
      store.setAuthModalOpen(false);
    `);
    await new Promise((r) => setTimeout(r, 600));

    console.log("Testing Mobile Landing Page...");
    await snap("mobile_qa_1_landing_hero.png");

    // Scroll to login form
    await evalCode(`
      const el = document.getElementById("auth-portal");
      if (el) el.scrollIntoView({ behavior: "instant" });
    `);
    await new Promise((r) => setTimeout(r, 500));
    await snap("mobile_qa_2_landing_login_tab.png");

    // Switch to Register Form on Mobile
    await evalCode(`
      const regBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("注册独立账号"));
      if (regBtn) regBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 500));
    await snap("mobile_qa_3_landing_register_tab.png");

    // 2. Log in and enter Studio Workspace
    console.log("Logging in and entering mobile Studio workspace...");
    await evalCode(`
      (async () => {
        const store = window.__store.getState();
        await store.login("atelier", "123456");
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await snap("mobile_qa_4_studio_main_canvas.png");

    // 3. Select single image element to test Floating Quick Action Bar on mobile
    console.log("Selecting image element...");
    await evalCode(`
      const store = window.__store.getState();
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) {
        store.selectElements([firstImg.id]);
      }
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_5_selected_image_floating_bar.png");

    // 4. Open In-Frame Interactive Crop on Mobile
    console.log("Opening interactive crop on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) {
        store.setEditingCropId(firstImg.id);
      }
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_6_interactive_crop_layer.png");

    // Close crop
    await evalCode(`
      const store = window.__store.getState();
      store.setEditingCropId(null);
    `);
    await new Promise((r) => setTimeout(r, 500));

    // 5. Open Mobile Bottom Drawer - Templates Tab
    console.log("Opening bottom drawer - Templates...");
    await evalCode(`
      const navBtns = Array.from(document.querySelectorAll("button"));
      const tplBtn = navBtns.find(b => b.textContent.trim() === "模板");
      if (tplBtn) tplBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_7_drawer_templates.png");

    // 6. Open Mobile Bottom Drawer - Media Tab
    console.log("Opening bottom drawer - Media...");
    await evalCode(`
      const navBtns = Array.from(document.querySelectorAll("button"));
      const mediaBtn = navBtns.find(b => b.textContent.trim() === "素材");
      if (mediaBtn) mediaBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_8_drawer_media.png");

    // 7. Open Mobile Bottom Drawer - Properties Tab
    console.log("Opening bottom drawer - Properties...");
    await evalCode(`
      const navBtns = Array.from(document.querySelectorAll("button"));
      const propBtn = navBtns.find(b => b.textContent.trim() === "属性");
      if (propBtn) propBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_9_drawer_properties.png");

    // 8. Open Mobile Bottom Drawer - Background & Paper Tab
    console.log("Opening bottom drawer - Background & Paper...");
    await evalCode(`
      const navBtns = Array.from(document.querySelectorAll("button"));
      const bgBtn = navBtns.find(b => b.textContent.trim() === "背景");
      if (bgBtn) bgBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_10_drawer_background.png");

    // 9. Close Drawer and Open User Profile Modal on Mobile
    console.log("Opening User Profile Modal on mobile...");
    await evalCode(`
      const closeBtn = document.querySelector("button svg.lucide-x")?.parentElement;
      if (closeBtn) closeBtn.click();
      const store = window.__store.getState();
      store.setAuthModalOpen(true, "profile");
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_11_modal_user_profile.png");

    // 10. Open Replace Photo Modal on Mobile
    console.log("Opening Replace Photo Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(false);
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) {
        store.openReplacePhotoModal(firstImg.id);
      }
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_12_modal_replace_photo.png");

    // 11. Open Export Modal on Mobile
    console.log("Opening Export Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.closeReplacePhotoModal();
      store.setExportModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_13_modal_export.png");

    // 12. Open Preset Size Modal on Mobile
    console.log("Opening Preset Size Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.setExportModalOpen(false);
      store.setPresetModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_14_modal_preset_sizes.png");

    // 13. Open Project Library Modal on Mobile
    console.log("Opening Project Library Modal on mobile...");
    await evalCode(`
      const store = window.__store.getState();
      store.setPresetModalOpen(false);
      store.setProjectModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_15_modal_project_library.png");

    // 14. Test on iPhone SE (375x667 compact screen)
    console.log("Testing on iPhone SE compact screen (375x667)...");
    await evalCode(`
      const store = window.__store.getState();
      store.setProjectModalOpen(false);
    `);
    await setViewport(375, 667);
    await new Promise((r) => setTimeout(r, 600));
    await snap("mobile_qa_16_iphone_se_canvas.png");

    console.log("🎉 Full Mobile QA Suite finished successfully!");
    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
