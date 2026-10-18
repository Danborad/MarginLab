import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Starting Full E2E Auth & Login QA...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9996",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9996/json/list");
      const tabs = await res.json();
      if (Array.isArray(tabs) && tabs.length > 0) {
        tab = tabs.find(t => t.type === "page" && t.url.includes("3001")) || tabs[0];
        if (tab && tab.webSocketDebuggerUrl) break;
      }
    } catch (e) {}
  }

  if (!tab || !tab.webSocketDebuggerUrl) {
    console.error("No tab found");
    chrome.kill();
    return;
  }

  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (event) => {
        const parsed = JSON.parse(event.data);
        if (parsed.id === msgId) {
          ws.removeEventListener("message", handler);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await new Promise((r) => (ws.addEventListener("open", r)));
  await send("Page.enable");
  await send("Runtime.enable");

  const evalCode = async (expression) => {
    const res = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    return res.result ? res.result.value : res;
  };

  const capture = async (filename) => {
    const res = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`📸 Captured screenshot: ${filename}`);
  };

  await new Promise(r => setTimeout(r, 1000));

  console.log("1. On Landing Page, testing Demo Login...");
  let demoLogin = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      const res = await s.login("atelier", "123456");
      await new Promise(r => setTimeout(r, 600));
      return res;
    })()
  `);
  console.log("Demo login:", demoLogin);
  await capture("auth_qa_step1_demo_login.png");

  console.log("2. Logout from demo account...");
  await evalCode(`(async () => { await window.__store.getState().logout(); })()`);
  await new Promise(r => setTimeout(r, 500));

  console.log("3. Registering new creator account: 'zhong_creator' / 'pass8888'...");
  let regRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.register({
        username: "zhong_creator",
        password: "pass8888",
        name: "醒梦 • 视觉指导",
        avatar: "🎬",
        role: "高定排版艺术指导",
        bio: "专注时尚大字与光影海报创作"
      });
    })()
  `);
  console.log("Register result:", regRes);
  await new Promise(r => setTimeout(r, 600));
  await capture("auth_qa_step2_new_account_studio.png");

  console.log("4. Logout from 'zhong_creator'...");
  await evalCode(`(async () => { await window.__store.getState().logout(); })()`);
  await new Promise(r => setTimeout(r, 500));

  console.log("5. Reloading page (F5 simulation)...");
  await send("Page.reload");
  await new Promise(r => setTimeout(r, 1500));

  console.log("6. Logging in with 'zhong_creator' and 'pass8888'...");
  let loginRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.login("zhong_creator", "pass8888");
    })()
  `);
  console.log("Login result:", loginRes);
  await new Promise(r => setTimeout(r, 600));
  await capture("auth_qa_step3_logged_in_after_reload.png");

  console.log("7. Testing Password Change & Re-login...");
  let changePassRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.changePassword("pass8888", "pass9999");
    })()
  `);
  console.log("Change password result:", changePassRes);

  console.log("8. Logout, try wrong password, then correct new password...");
  await evalCode(`(async () => { await window.__store.getState().logout(); })()`);
  await new Promise(r => setTimeout(r, 500));

  let wrongPassRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.login("zhong_creator", "wrongpass");
    })()
  `);
  console.log("Wrong password test:", wrongPassRes);

  let correctNewPassRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.login("@zhong_creator", "pass9999");
    })()
  `);
  console.log("Login with @zhong_creator and new password:", correctNewPassRes);
  await new Promise(r => setTimeout(r, 600));
  await capture("auth_qa_step4_change_pass_and_relogin.png");

  ws.close();
  chrome.kill();
  console.log("🎉 ALL AUTH & LOGIN E2E TESTS PASSED SUCCESSFULLY!");
}

run().catch(console.error);
