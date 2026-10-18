import { spawn } from "child_process";

async function run() {
  console.log("🚀 Running Login & Auth debug test...");
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9992",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch("http://127.0.0.1:9992/json");
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

  console.log("1. Checking store initial state...");
  let storeState = await evalCode(`
    (() => {
      const s = window.__store ? window.__store.getState() : null;
      return s ? { currentView: s.currentView, isAuth: s.isAuthenticated, user: s.currentUser ? s.currentUser.username : null, accountsCount: s.userAccounts.length, accounts: s.userAccounts.map(a => a.username) } : null;
    })()
  `);
  console.log("Initial state:", JSON.stringify(storeState, null, 2));

  console.log("2. Testing Registration...");
  let regRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.register({
        username: "testuser999",
        password: "password123",
        name: "Test User 999",
        avatar: "🎨",
        role: "测试创作者",
        bio: "测试简介"
      });
    })()
  `);
  console.log("Registration result:", JSON.stringify(regRes, null, 2));

  let afterReg = await evalCode(`
    (() => {
      const s = window.__store.getState();
      return { currentView: s.currentView, isAuth: s.isAuthenticated, user: s.currentUser ? s.currentUser.username : null, accountsCount: s.userAccounts.length, accounts: s.userAccounts.map(a => a.username) };
    })()
  `);
  console.log("After registration state:", JSON.stringify(afterReg, null, 2));

  console.log("3. Testing Logout...");
  await evalCode(`
    (async () => {
      const s = window.__store.getState();
      await s.logout();
    })()
  `);

  let afterLogout = await evalCode(`
    (() => {
      const s = window.__store.getState();
      return { currentView: s.currentView, isAuth: s.isAuthenticated, user: s.currentUser ? s.currentUser.username : null, accountsCount: s.userAccounts.length, accounts: s.userAccounts.map(a => a.username) };
    })()
  `);
  console.log("After logout state:", JSON.stringify(afterLogout, null, 2));

  console.log("4. Testing Login with registered account...");
  let loginRes = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.login("testuser999", "password123");
    })()
  `);
  console.log("Login result:", JSON.stringify(loginRes, null, 2));

  let afterLogin = await evalCode(`
    (() => {
      const s = window.__store.getState();
      return { currentView: s.currentView, isAuth: s.isAuthenticated, user: s.currentUser ? s.currentUser.username : null };
    })()
  `);
  console.log("After login state:", JSON.stringify(afterLogin, null, 2));

  console.log("5. Testing Page Reload (F5)...");
  await send("Page.reload");
  await new Promise(r => setTimeout(r, 2000));

  let afterReload = await evalCode(`
    (() => {
      const s = window.__store.getState();
      return { currentView: s.currentView, isAuth: s.isAuthenticated, user: s.currentUser ? s.currentUser.username : null, accountsCount: s.userAccounts.length, accounts: s.userAccounts.map(a => a.username) };
    })()
  `);
  console.log("After reload state:", JSON.stringify(afterReload, null, 2));

  console.log("6. Testing Logout after Reload and then UI Login Form...");
  await evalCode(`(async () => { await window.__store.getState().logout(); })()`);
  await new Promise(r => setTimeout(r, 500));

  let uiLoginAttempt = await evalCode(`
    (async () => {
      // simulate user typing into input and clicking submit
      const userInp = document.querySelector('input[placeholder*="账号"]');
      const passInp = document.querySelector('input[placeholder*="密码"]');
      const submitBtn = document.querySelector('button[type="submit"]');
      return { hasUserInp: !!userInp, hasPassInp: !!passInp, hasSubmit: !!submitBtn, userVal: userInp?.value };
    })()
  `);
  console.log("UI login elements:", JSON.stringify(uiLoginAttempt, null, 2));

  // Let's test calling login through store
  let loginRes2 = await evalCode(`
    (async () => {
      const s = window.__store.getState();
      return await s.login("testuser999", "password123");
    })()
  `);
  console.log("Login result 2:", JSON.stringify(loginRes2, null, 2));

  let finalState = await evalCode(`
    (() => {
      const s = window.__store.getState();
      return { currentView: s.currentView, isAuth: s.isAuthenticated, user: s.currentUser ? s.currentUser.username : null };
    })()
  `);
  console.log("Final state:", JSON.stringify(finalState, null, 2));

  ws.close();
  chrome.kill();
}

run().catch(console.error);
