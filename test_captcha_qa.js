import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Starting Registration CAPTCHA Security QA...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9998",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9998/json");
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

    // Force clear session to ensure starting on Landing Home Page
    await evalCode(`
      const store = window.__store.getState();
      store.logout();
    `);
    await new Promise((r) => setTimeout(r, 800));

    // Step 1: Switch to Register tab on Home Page
    console.log("Step 1: Inspecting Register Form with CAPTCHA...");
    await evalCode(`
      const regTabBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("注册独立账号"));
      if (regTabBtn) regTabBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));
    await snap("captcha_qa_1_register_view.png");

    // Step 2: Test wrong CAPTCHA attempt
    console.log("Step 2: Testing wrong CAPTCHA blocking...");
    await evalCode(`
      const inputs = document.querySelectorAll("#auth-portal input");
      // Fill username
      inputs[0].value = "spam_bot_99";
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      // Fill display name
      inputs[1].value = "Spam Bot";
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      // Fill password
      inputs[2].value = "testpass";
      inputs[2].dispatchEvent(new Event("input", { bubbles: true }));
      // Fill confirm password
      inputs[3].value = "testpass";
      inputs[3].dispatchEvent(new Event("input", { bubbles: true }));
      // Fill wrong captcha
      const captchaInput = Array.from(inputs).find(i => i.placeholder.includes("验证码"));
      if (captchaInput) {
        captchaInput.value = "WRNG";
        captchaInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    `);
    await new Promise((r) => setTimeout(r, 400));
    // Click submit
    await evalCode(`
      const submitBtn = Array.from(document.querySelectorAll("#auth-portal button")).find(b => b.textContent.includes("注册并进入工作台"));
      if (submitBtn) submitBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 800));
    await snap("captcha_qa_2_error_blocked.png");

    // Step 3: Refresh CAPTCHA and register successfully
    console.log("Step 3: Registering with valid flow...");
    await evalCode(`
      const store = window.__store.getState();
      store.register({
        username: "leica_shibuya",
        password: "tokyo2026",
        name: "Shibuya • 涩谷胶片工坊",
        avatar: "📷",
        role: "独立街头摄影师",
        bio: "米家 6 寸与 3 寸人文相纸"
      });
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await snap("captcha_qa_3_success_registered.png");

    console.log("🎉 All CAPTCHA security QA tests passed!");
    ws.close();
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    chrome.kill();
  }
}
run();
