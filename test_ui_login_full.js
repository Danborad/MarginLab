import { spawn } from "child_process";

async function run() {
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9995",
    "--window-size=1600,1000",
    "http://localhost:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9995/json/list");
      const tabs = await res.json();
      if (Array.isArray(tabs) && tabs.length > 0) {
        tab = tabs.find(t => t.type === "page" && t.url.includes("3001")) || tabs[0];
        if (tab && tab.webSocketDebuggerUrl) break;
      }
    } catch (e) {}
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

  await new Promise(r => setTimeout(r, 1000));

  console.log("--- 1. Testing Default Accounts Login on Landing Page ---");
  // Click on "atelier" demo button
  let clickDemoRes = await evalCode(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Atelier Pro'));
      if (btn) {
        btn.click();
        const userInput = document.querySelector('input[placeholder*="账号"]');
        const passInput = document.querySelector('input[placeholder*="密码"]');
        return { clicked: true, user: userInput?.value, pass: passInput?.value };
      }
      return { clicked: false };
    })()
  `);
  console.log("Click demo result:", clickDemoRes);

  // Click login submit button
  let submitRes = await evalCode(`
    (async () => {
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.includes('登录'));
      if (submitBtn) {
        submitBtn.click();
        await new Promise(r => setTimeout(r, 800));
        const s = window.__store.getState();
        return { clickedSubmit: true, view: s.currentView, user: s.currentUser?.name, isAuth: s.isAuthenticated };
      }
      return { clickedSubmit: false };
    })()
  `);
  console.log("Login submit result:", submitRes);

  console.log("--- 2. Now in Studio, test Logout via Header ---");
  let logoutRes = await evalCode(`
    (async () => {
      // Find logout button in Header or User Account modal
      const s = window.__store.getState();
      await s.logout();
      await new Promise(r => setTimeout(r, 500));
      const s2 = window.__store.getState();
      return { view: s2.currentView, user: s2.currentUser, isAuth: s2.isAuthenticated };
    })()
  `);
  console.log("Logout result:", logoutRes);

  console.log("--- 3. On Landing Page, switch to Register Tab ---");
  let switchTabRes = await evalCode(`
    (async () => {
      const regTabBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('注册独立账号'));
      if (regTabBtn) regTabBtn.click();
      await new Promise(r => setTimeout(r, 300));
      return { inRegister: !!document.querySelector('input[placeholder*="my_photo_studio"]') };
    })()
  `);
  console.log("Switch tab result:", switchTabRes);

  console.log("--- 4. Fill in Registration Form & Submit ---");
  let registerSubmitRes = await evalCode(`
    (async () => {
      // simulate React synthetic input changes
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else {
          valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const userInp = document.querySelector('input[placeholder*="my_photo_studio"]');
      const nameInp = document.querySelector('input[placeholder*="极简艺术空间"]');
      const passInps = document.querySelectorAll('input[type="password"]');
      const captchaInp = document.querySelector('input[placeholder*="验证码"]');

      if (userInp) setNativeValue(userInp, 'zhong777');
      if (nameInp) setNativeValue(nameInp, '醒梦视觉');
      if (passInps[0]) setNativeValue(passInps[0], 'abc12345');
      if (passInps[1]) setNativeValue(passInps[1], 'abc12345');

      // bypass captcha check in test or get actual code from DOM/canvas
      // Let's call store.register directly or trigger form
      const s = window.__store.getState();
      const reg = await s.register({
        username: 'zhong777',
        password: 'abc12345',
        name: '醒梦视觉',
        avatar: '🎬',
        role: '视觉指导',
        bio: '测试创作者'
      });
      await new Promise(r => setTimeout(r, 500));
      const s2 = window.__store.getState();
      return { reg, view: s2.currentView, user: s2.currentUser?.username, count: s2.userAccounts.length };
    })()
  `);
  console.log("Register submit result:", registerSubmitRes);

  console.log("--- 5. Now in Studio, Logout ---");
  await evalCode(`(async () => { await window.__store.getState().logout(); })()`);
  await new Promise(r => setTimeout(r, 500));

  console.log("--- 6. Back on Landing Page, test Login with 'zhong777' / 'abc12345' ---");
  let manualLoginRes = await evalCode(`
    (async () => {
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else {
          valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const userInput = document.querySelector('input[placeholder*="账号"]');
      const passInput = document.querySelector('input[placeholder*="密码"]');
      if (userInput) setNativeValue(userInput, 'zhong777');
      if (passInput) setNativeValue(passInput, 'abc12345');

      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.includes('登录'));
      if (submitBtn) submitBtn.click();

      await new Promise(r => setTimeout(r, 1000));
      const s = window.__store.getState();
      return { 
        view: s.currentView, 
        user: s.currentUser?.name, 
        isAuth: s.isAuthenticated,
        loginError: document.querySelector('.bg-red-500\\/15')?.textContent,
        loginSuccess: document.querySelector('.bg-emerald-500\\/15')?.textContent
      };
    })()
  `);
  console.log("Manual UI login result:", manualLoginRes);

  console.log("--- 7. Test F5 reload and then try to login again ---");
  await send("Page.reload");
  await new Promise(r => setTimeout(r, 1500));

  let reloadLoginRes = await evalCode(`
    (async () => {
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else {
          valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const userInput = document.querySelector('input[placeholder*="账号"]');
      const passInput = document.querySelector('input[placeholder*="密码"]');
      if (userInput) setNativeValue(userInput, 'zhong777');
      if (passInput) setNativeValue(passInput, 'abc12345');

      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.includes('登录'));
      if (submitBtn) submitBtn.click();

      await new Promise(r => setTimeout(r, 1000));
      const s = window.__store.getState();
      return { 
        view: s.currentView, 
        user: s.currentUser?.name, 
        isAuth: s.isAuthenticated,
        loginError: document.querySelector('.bg-red-500\\/15')?.textContent,
        loginSuccess: document.querySelector('.bg-emerald-500\\/15')?.textContent
      };
    })()
  `);
  console.log("Reload UI login result:", reloadLoginRes);

  ws.close();
  chrome.kill();
}

run().catch(console.error);
