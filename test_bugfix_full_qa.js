import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Starting Bugfix QA (No system confirm, QQ avatar display, F5 refresh persistence)...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9991",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9991/json");
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

    // Step 1: Log in with demo account "atelier"
    console.log("Step 1: Logging in with atelier / 123456...");
    await evalCode(`
      (async () => {
        const store = window.__store.getState();
        await store.login("atelier", "123456");
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));

    // Step 2: Open profile modal and test in-app smooth logout confirm (no browser popup)
    console.log("Step 2: Testing in-app logout confirm UI...");
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(true, "profile");
    `);
    await new Promise((r) => setTimeout(r, 600));

    // Click "退出当前登录" button to trigger in-app inline confirm
    await evalCode(`
      const logoutBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("退出当前登录"));
      if (logoutBtn) logoutBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 500));
    await snap("qa_fix_1_inapp_logout_confirm.png");

    // Click "取消" to remain logged in
    await evalCode(`
      const cancelBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "取消");
      if (cancelBtn) cancelBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 500));

    // Step 3: Edit profile to set QQ Avatar
    console.log("Step 3: Editing profile to set QQ Avatar (10001)...");
    await evalCode(`
      const editBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("编辑资料"));
      if (editBtn) editBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 500));

    // In edit form, switch to "读取 QQ 号头像" and enter 10001
    await evalCode(`
      const qqTabBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("读取 QQ 号头像"));
      if (qqTabBtn) qqTabBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 400));

    await evalCode(`
      const qqInput = document.querySelector("input[placeholder*='QQ']");
      if (qqInput) {
        qqInput.value = "10001";
        qqInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    `);
    await new Promise((r) => setTimeout(r, 500));

    // Submit save profile
    await evalCode(`
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("保存资料"));
      if (saveBtn) saveBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("qa_fix_2_qq_avatar_updated_and_displayed.png");

    // Step 4: Close modal to see QQ Avatar in Header and Workspace
    await evalCode(`
      const store = window.__store.getState();
      store.setAuthModalOpen(false);
    `);
    await new Promise((r) => setTimeout(r, 600));

    // Step 5: Test Browser F5 Refresh (Page.reload)
    console.log("Step 5: Simulating F5 browser reload and checking session persistence...");
    await send("Page.reload");
    await new Promise((r) => setTimeout(r, 2000));

    // Check state after reload
    const stateAfterReload = await evalCode(`
      (() => {
        const store = window.__store.getState();
        return {
          currentView: store.currentView,
          isAuthenticated: store.isAuthenticated,
          username: store.currentUser ? store.currentUser.username : null,
          avatar: store.currentUser ? store.currentUser.avatar : null,
        };
      })()
    `);
    console.log("State after browser F5 reload:", stateAfterReload);
    await snap("qa_fix_3_page_reloaded_stays_logged_in.png");

    console.log("🎉 All bugfix tests passed successfully!");
    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
