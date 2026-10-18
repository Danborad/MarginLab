import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("🚀 Testing Header User Dropdown & 1-Click Logout...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9997",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9997/json/list");
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
    console.log(`📸 Captured: ${filename}`);
  };

  await new Promise(r => setTimeout(r, 1000));

  console.log("1. Logging in as 'atelier'...");
  await evalCode(`(async () => { await window.__store.getState().login("atelier", "123456"); })()`);
  await new Promise(r => setTimeout(r, 800));

  console.log("2. Clicking User Account dropdown in Header...");
  let clickDrop = await evalCode(`
    (() => {
      const userBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Atelier') || b.title?.includes('当前账号'));
      if (userBtn) {
        userBtn.click();
        return { clicked: true, text: userBtn.textContent };
      }
      return { clicked: false };
    })()
  `);
  console.log("Clicked dropdown button:", clickDrop);
  await new Promise(r => setTimeout(r, 500));
  await capture("dropdown_qa_1_opened.png");

  console.log("3. Testing 1-Click Logout from Dropdown...");
  let clickLogout = await evalCode(`
    (async () => {
      const logoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('退出当前登录'));
      if (logoutBtn) {
        logoutBtn.click();
        await new Promise(r => setTimeout(r, 800));
        const s = window.__store.getState();
        return { clickedLogout: true, view: s.currentView, isAuth: s.isAuthenticated, user: s.currentUser };
      }
      return { clickedLogout: false };
    })()
  `);
  console.log("Logout action result:", clickLogout);
  await new Promise(r => setTimeout(r, 500));
  await capture("dropdown_qa_2_logged_out.png");

  console.log("4. Logging back in and testing '编辑账号资料' in dropdown...");
  await evalCode(`(async () => { await window.__store.getState().login("atelier", "123456"); })()`);
  await new Promise(r => setTimeout(r, 800));

  await evalCode(`
    (() => {
      const userBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Atelier') || b.title?.includes('当前账号'));
      if (userBtn) userBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 500));

  let clickEdit = await evalCode(`
    (() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('编辑账号与个人中心'));
      if (editBtn) {
        editBtn.click();
        return { clickedEdit: true };
      }
      return { clickedEdit: false };
    })()
  `);
  console.log("Click edit result:", clickEdit);
  await new Promise(r => setTimeout(r, 800));
  await capture("dropdown_qa_3_profile_opened.png");

  ws.close();
  chrome.kill();
  console.log("🎉 Header User Dropdown & 1-Click Logout tests complete!");
}

run().catch(console.error);
