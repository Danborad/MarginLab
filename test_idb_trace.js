import { spawn } from "child_process";

async function run() {
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9994",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9994/json/list");
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

  // Wait for initial load
  await new Promise(r => setTimeout(r, 1000));

  console.log("Step 1: Check initial store & IDB accounts");
  let idbInit = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      const accounts = s.userAccounts;
      return { storeCount: accounts?.length, storeUsernames: accounts?.map(a => a.username) };
    })()
  `);
  console.log("Step 1:", idbInit);

  console.log("Step 2: Register user 'testuser101'");
  let regRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      const res = await s.register({
        username: "testuser101",
        password: "password123",
        name: "Test User 101",
        avatar: "🎨",
        role: "测试创作者",
        bio: "测试简介"
      });
      const s2 = window.__store.getState();
      return { res, storeCount: s2.userAccounts.length, storeUsernames: s2.userAccounts.map(a => a.username) };
    })()
  `);
  console.log("Step 2 after reg:", regRes);

  console.log("Step 3: Call logout()");
  let logoutRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      await s.logout();
      const s2 = window.__store.getState();
      return { storeCount: s2.userAccounts.length, storeUsernames: s2.userAccounts.map(a => a.username) };
    })()
  `);
  console.log("Step 3 after logout:", logoutRes);

  console.log("Step 4: Reload page");
  await send("Page.reload");
  await new Promise(r => setTimeout(r, 1500));

  let reloadRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return { 
        storeAccs: s.userAccounts.length, 
        storeUsernames: s.userAccounts.map(a => a.username),
        currentUser: s.currentUser ? s.currentUser.username : null,
        currentView: s.currentView
      };
    })()
  `);
  console.log("Step 4 after reload:", reloadRes);

  console.log("Step 5: Login with testuser101");
  let loginRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.login("testuser101", "password123");
    })()
  `);
  console.log("Step 5 login:", loginRes);

  ws.close();
  chrome.kill();
}

run().catch(console.error);
