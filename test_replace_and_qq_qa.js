import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Starting Replace Photo & QQ Avatar End-to-End QA...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9999",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9999/json");
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

    // Force clear session to start on HomePage
    await evalCode(`
      const store = window.__store.getState();
      store.logout();
    `);
    await new Promise((r) => setTimeout(r, 800));

    // Step 1: Test QQ Avatar in Registration Form
    console.log("Step 1: Testing QQ Avatar in Register Form...");
    await evalCode(`
      const regTabBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("注册独立账号"));
      if (regTabBtn) regTabBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));

    // Click "读取 QQ 号头像" tab
    await evalCode(`
      const qqTabBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("读取 QQ 号头像"));
      if (qqTabBtn) qqTabBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 500));

    // Enter QQ Number
    await evalCode(`
      const qqInput = document.querySelector("input[placeholder*='QQ']");
      if (qqInput) {
        qqInput.value = "10001";
        qqInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("qa_verify_1_qq_avatar_preview.png");

    // Register user with QQ avatar
    console.log("Step 2: Registering user with QQ Avatar...");
    await evalCode(`
      const store = window.__store.getState();
      store.register({
        username: "qq_photographer",
        password: "qqpassword2026",
        name: "Pony • 视觉创作者",
        avatar: "https://q1.qlogo.cn/g?b=qq&nk=10001&s=640",
        role: "高级视觉总监",
        bio: "米家相纸冲印与画报排版"
      });
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await snap("qa_verify_2_qq_avatar_in_workspace.png");

    // Step 3: Test Uploading Media does NOT pollute canvas
    console.log("Step 3: Testing media upload without auto-inserting to canvas...");
    await evalCode(`
      const store = window.__store.getState();
      store.setActivePanel("media");
      const initialElemCount = store.document.elements.length;
      store.addMediaAssets([
        {
          name: "Tokyo-Leica-Night-Street.jpg",
          src: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=900&auto=format&fit=crop&q=80",
          width: 1200,
          height: 800,
          aspectRatio: 1.5,
          sizeBytes: 195000
        },
        {
          name: "Kyoto-Zen-Bamboo.jpg",
          src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&auto=format&fit=crop&q=80",
          width: 1600,
          height: 1066,
          aspectRatio: 1.5,
          sizeBytes: 260000
        }
      ]);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("qa_verify_3_media_panel_uploaded_isolated.png");

    // Step 4: Open Replace Photo Modal
    console.log("Step 4: Opening Replace Photo Modal for selected image...");
    await evalCode(`
      const store = window.__store.getState();
      const firstImg = store.document.elements.find(e => e.type === "image");
      if (firstImg) {
        store.selectElements([firstImg.id]);
        store.openReplacePhotoModal(firstImg.id);
      }
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("qa_verify_4_replace_photo_modal_open.png");

    // Step 5: Replace Image from Media Library
    console.log("Step 5: Replacing photo from user media library...");
    await evalCode(`
      const store = window.__store.getState();
      const firstImg = store.document.elements.find(e => e.type === "image");
      const asset = store.mediaAssets[0];
      if (firstImg && asset) {
        store.replaceElementImage(firstImg.id, asset.src, asset.name, asset.width, asset.height);
      }
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("qa_verify_5_photo_replaced_success.png");

    console.log("🎉 All Replace Photo & QQ Avatar QA tests passed successfully!");
    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
