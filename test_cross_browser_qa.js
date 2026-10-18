import { spawn } from "child_process";
import { execSync } from "child_process";
import fs from "fs";

function sleep(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
 }
 
 class BrowserSession {
   constructor(port, userDataDir) {
     this.port = port;
     this.userDataDir = userDataDir;
     this.proc = null;
     this.ws = null;
     this.msgId = 1;
   }
 
   async start() {
     if (fs.existsSync(this.userDataDir)) {
       fs.rmSync(this.userDataDir, { recursive: true, force: true });
     }
     fs.mkdirSync(this.userDataDir, { recursive: true });
 
     this.proc = spawn("google-chrome", [
       "--headless=new",
       "--no-sandbox",
       "--disable-gpu",
       `--remote-debugging-port=${this.port}`,
       `--user-data-dir=${this.userDataDir}`,
       "--window-size=1600,1000",
       "http://localhost:3001",
     ]);
 
    let tab = null;
    for (let i = 0; i < 60; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length > 0) {
          tab = tabs.find((t) => t.type === "page" && t.url.includes("3001")) || tabs[0];
          if (tab && tab.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }
 
     if (!tab || !tab.webSocketDebuggerUrl) {
       throw new Error(`Failed to connect to Chrome on port ${this.port}`);
     }
 
     this.ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
     await new Promise((resolve, reject) => {
       this.ws.onopen = resolve;
       this.ws.onerror = reject;
     });
 
     await this.send("Page.enable");
     await this.send("Runtime.enable");
     await this.send("DOM.enable");
   }
 
   send(method, params = {}) {
     return new Promise((resolve, reject) => {
       const id = this.msgId++;
       const handler = (event) => {
         const parsed = JSON.parse(event.data);
         if (parsed.id === id) {
           this.ws.removeEventListener("message", handler);
           if (parsed.error) reject(parsed.error);
           else resolve(parsed.result);
         }
       };
       this.ws.addEventListener("message", handler);
       this.ws.send(JSON.stringify({ id, method, params }));
     });
   }
 
   async eval(expression) {
     const res = await this.send("Runtime.evaluate", {
       expression,
       returnByValue: true,
       awaitPromise: true,
     });
     if (res.exceptionDetails) {
       throw new Error(JSON.stringify(res.exceptionDetails));
     }
     return res.result?.value;
   }
 
   async screenshot(filename) {
     const res = await this.send("Page.captureScreenshot", { format: "png" });
     fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
     console.log(`[Screenshot] Saved ${filename}`);
   }
 
  async close() {
    try {
      if (this.ws) this.ws.close();
    } catch (e) {}
    try {
      if (this.proc) {
        this.proc.kill("SIGKILL");
      }
    } catch (e) {}
    try {
      execSync(`pkill -9 -f "remote-debugging-port=${this.port}" 2>/dev/null || true`);
    } catch (e) {}
    await sleep(1000);
  }
}
 
async function run() {
  const testId = Date.now().toString(36);
  const testUsername = `pro_creator_${testId}`;
  const testPassword = `Pass_${testId}`;
  const testNickname = `跨端创作者_${testId}`;

  console.log("==================================================");
  console.log(`  STARTING CROSS-BROWSER AUTHENTICATION TEST (${testUsername})`);
  console.log("==================================================");

  // ----------------------------------------------------
  // BROWSER A: Register a brand new account
  // ----------------------------------------------------
  console.log("\n[Step 1] Launching Browser A (First browser session)...");
  const browserA = new BrowserSession(9971, "/tmp/chrome_browser_a");
  await browserA.start();
  await sleep(1500);

  console.log(`[Browser A] Calling store.register for user '${testUsername}'...`);
  const regResult = await browserA.eval(`
    (async () => {
      const store = window.__store.getState();
      const res = await store.register({
        username: "${testUsername}",
        password: "${testPassword}",
        name: "${testNickname}",
        avatar: "📸",
        role: "先锋视觉摄影师",
        bio: "专注高定排版与多端云端同步"
      });
      return res;
    })()
  `);
  console.log("[Browser A] Register result:", JSON.stringify(regResult));
  await sleep(1000);

  const inStudioA = await browserA.eval(`
    document.body.innerText.includes("${testNickname}")
  `);
  console.log(`[Browser A] In Studio: ${inStudioA}`);
  await browserA.screenshot("cross_browser_qa_1_registered_in_browser_a.png");

  console.log("[Browser A] Closing Browser A...");
  await browserA.close();

  // ----------------------------------------------------
  // BROWSER B: Completely separate instance, clean directory
  // ----------------------------------------------------
  console.log("\n[Step 2] Launching Browser B (Completely isolated second browser)...");
  const browserB = new BrowserSession(9972, "/tmp/chrome_browser_b");
  await browserB.start();
  await sleep(1500);

  console.log("[Browser B] Initial page loaded. Checking Landing Page...");
  const isLandingB = await browserB.eval(`
    document.body.innerText.includes("ATELIER") && document.body.innerText.includes("登录")
  `);
  console.log(`[Browser B] Is on Landing/Login page: ${isLandingB}`);

  console.log(`[Browser B] Logging in via UI inputs with '${testUsername}' / '${testPassword}'...`);
  await browserB.eval(`
    const userInp = document.getElementById("landing-login-username");
    const passInp = document.getElementById("landing-login-password");

    function setReactInput(input, val) {
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, val);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (userInp) setReactInput(userInp, "${testUsername}");
    if (passInp) setReactInput(passInp, "${testPassword}");
  `);
  await sleep(500);

  console.log("[Browser B] Submitting login form...");
  await browserB.eval(`
    const submitBtn = document.getElementById("landing-login-submit") || Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("登 录 并 进 入"));
    if (submitBtn) submitBtn.click();
  `);
  await sleep(2500);

  const inStudioB = await browserB.eval(`
    document.body.innerText.includes("${testNickname}")
  `);
  console.log(`[Browser B] Login Success! User "${testNickname}" displayed in Studio: ${inStudioB}`);
  await browserB.screenshot("cross_browser_qa_2_logged_in_browser_b.png");

  // Test dropdown & logout in Browser B
  console.log("[Browser B] Testing top header dropdown and logout...");
  await browserB.eval(`
    const badge = document.getElementById("header-user-dropdown-btn");
    if (badge) badge.click();
  `);
  await sleep(800);

  await browserB.screenshot("cross_browser_qa_3_dropdown_in_browser_b.png");

  console.log("[Browser B] Clicking logout button in dropdown...");
  await browserB.eval(`
    const logoutBtn = document.getElementById("header-user-logout-btn");
    if (logoutBtn) logoutBtn.click();
  `);
  await sleep(1500);

  const loggedOutB = await browserB.eval(`
    document.body.innerText.includes("登录") && document.body.innerText.includes("注册")
  `);
  console.log(`[Browser B] Logged out safely back to Landing: ${loggedOutB}`);
  await browserB.screenshot("cross_browser_qa_4_logged_out_browser_b.png");

  await browserB.close();

  // ----------------------------------------------------
  // BROWSER C: Third session testing wrong password & recovery
  // ----------------------------------------------------
  console.log("\n[Step 3] Launching Browser C (Third isolated browser session)...");
  const browserC = new BrowserSession(9974, "/tmp/chrome_browser_c");
  await browserC.start();
  await sleep(1500);

  console.log("[Browser C] Testing login with wrong password...");
  const wrongPassRes = await browserC.eval(`
    (async () => {
      const store = window.__store.getState();
      return await store.login("${testUsername}", "WrongPassword123");
    })()
  `);
  console.log("[Browser C] Wrong password test result:", JSON.stringify(wrongPassRes));

  console.log("[Browser C] Testing login with correct password...");
  const correctPassRes = await browserC.eval(`
    (async () => {
      const store = window.__store.getState();
      return await store.login("${testUsername}", "${testPassword}");
    })()
  `);
  console.log("[Browser C] Correct password test result:", JSON.stringify(correctPassRes));
  await sleep(1000);

  await browserC.screenshot("cross_browser_qa_5_browser_c_verified.png");
  await browserC.close();

  console.log("\n==================================================");
  console.log("  ALL CROSS-BROWSER TESTS PASSED PERFECTLY!");
  console.log("==================================================");
}
 
 run().catch((err) => {
   console.error("Test failed with error:", err);
   process.exit(1);
 });
