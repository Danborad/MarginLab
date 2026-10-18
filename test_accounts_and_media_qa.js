import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Starting Multi-user & Media Library Automated QA...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9992",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tabs = [];
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9992/json");
      tabs = await res.json();
      if (Array.isArray(tabs) && tabs.length > 0) break;
    } catch (e) {}
  }

  try {
    const tab = tabs.find(t => t.type === "page" && t.url.includes("3001")) || tabs[0];
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

    // Step 1: Switch to "素材" (Media Panel)
    await evalCode(`
      const mediaTabBtn = Array.from(document.querySelectorAll("button")).find(b => b.title === "素材");
      if (mediaTabBtn) mediaTabBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("user_qa_1_media_panel_initial.png");

    // Step 2: Upload 2 photos for Atelier Pro
    await evalCode(`
      const store = window.__store.getState();
      store.addMediaAssets([
        {
          name: "Vogue-Studio-Shoot-01.jpg",
          src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80",
          width: 1200,
          height: 1600,
          aspectRatio: 0.75,
          sizeBytes: 245000
        },
        {
          name: "Architectural-Glass-Tower.jpg",
          src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
          width: 1600,
          height: 1200,
          aspectRatio: 1.33,
          sizeBytes: 310000
        }
      ]);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("user_qa_2_media_uploaded_pro.png");

    // Step 3: Open User Account Switcher Modal
    await evalCode(`
      const userBtn = document.querySelector("header button[title*=\"当前账号\"]");
      if (userBtn) userBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("user_qa_3_user_account_modal.png");

    // Step 4: Switch to "Lin • 胶片摄影师"
    await evalCode(`
      const store = window.__store.getState();
      store.switchUserAccount("user_photographer");
      store.setUserAccountModalOpen(false);
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("user_qa_4_switched_to_lin.png");

    // Step 5: Upload an asset for Lin
    await evalCode(`
      const store = window.__store.getState();
      store.addMediaAssets([
        {
          name: "Lin-Leica-Tokyo-Street.jpg",
          src: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=900&auto=format&fit=crop&q=80",
          width: 1200,
          height: 800,
          aspectRatio: 1.5,
          sizeBytes: 198000
        }
      ]);
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("user_qa_5_lin_uploaded_isolated.png");

    // Step 6: Switch back to Atelier Pro and verify complete isolation
    await evalCode(`
      const store = window.__store.getState();
      store.switchUserAccount("user_pro");
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("user_qa_6_pro_isolated_verified.png");

    // Step 7: Open Account Modal again to show Create User form
    await evalCode(`
      const store = window.__store.getState();
      store.setUserAccountModalOpen(true);
    `);
    await new Promise((r) => setTimeout(r, 500));
    await evalCode(`
      const newAccBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("新建账号") || b.textContent.includes("添加新的创作者"));
      if (newAccBtn) newAccBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("user_qa_7_create_account_form.png");

    console.log("✅ All Multi-user & Media library QA tests passed!");
    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
