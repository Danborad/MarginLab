import { spawn, execSync } from "child_process";
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
    for (let i = 0; i < 50; i++) {
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
      if (this.proc) this.proc.kill("SIGKILL");
    } catch (e) {}
    try {
      execSync(`pkill -9 -f "remote-debugging-port=${this.port}" 2>/dev/null || true`);
    } catch (e) {}
    await sleep(800);
  }
}

async function run() {
  console.log("==================================================");
  console.log("  STARTING ADMIN USER MANAGEMENT & AI MODEL QA");
  console.log("==================================================");

  const browser = new BrowserSession(9976, "/tmp/chrome_admin_qa_full");
  await browser.start();
  await sleep(1500);

  // 1. Landing Page with Demo Admin account
  console.log("[1] Checking Landing Page & Demo Admin Button...");
  const adminBtnText = await browser.eval(`
    (() => {
      const btn = document.querySelector("#landing-demo-admin");
      return btn ? btn.innerText : "NOT_FOUND";
    })()
  `);
  console.log("  Landing admin demo pill:", JSON.stringify(adminBtnText));
  await browser.screenshot("admin_qa_1_landing_page_admin_demo.png");

  // 2. Click Admin Demo and Log in
  console.log("[2] Logging in as Super Admin (admin / admin123)...");
  await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      await store.login("admin", "admin123");
    })()
  `);
  await sleep(1000);

  const isAuth = await browser.eval(`
    (() => {
      const store = window.__store.getState();
      return {
        isAuthenticated: store.isAuthenticated,
        user: store.currentUser,
        hasAdminBtn: !!document.querySelector("#header-admin-quick-btn"),
      };
    })()
  `);
  console.log("  Logged in user:", isAuth.user?.name, "| isAdmin:", isAuth.user?.isAdmin, "| Top Admin Btn:", isAuth.hasAdminBtn);
  await browser.screenshot("admin_qa_2_admin_logged_in_studio.png");

  // 3. Open Admin Management Modal (Users Tab)
  console.log("[3] Opening Admin Management Console...");
  await browser.eval(`
    window.__store.getState().setAdminModalOpen(true, "users");
  `);
  await sleep(1200);

  const stats = await browser.eval(`
    (() => {
      const store = window.__store.getState();
      return store.adminStats;
    })()
  `);
  console.log("  Admin stats loaded:", stats);
  await browser.screenshot("admin_qa_3_admin_user_management_modal.png");

  // 4. Test User Creation in Admin Modal
  console.log("[4] Creating new creator account in admin panel...");
  const createRes = await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      return await store.adminCreateUser({
        username: "creative_director_" + Date.now().toString(36),
        password: "Pass" + Date.now().toString(36),
        name: "先锋视觉艺术指导",
        avatar: "💎",
        role: "高定杂志封面艺术总监",
        isAdmin: false,
      });
    })()
  `);
  console.log("  Admin create user result:", createRes);
  await sleep(800);

  // 5. Test Banning a creator (e.g. mia)
  console.log("[5] Banning user 'mia' in admin panel...");
  const banRes = await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      return await store.adminSetUserStatus("user_life", "banned");
    })()
  `);
  console.log("  Ban user 'mia' result:", banRes);
  await sleep(800);

  await browser.screenshot("admin_qa_4_user_created_and_mia_banned.png");

  // 6. Switch to Global AI Model Config Tab in Admin Modal
  console.log("[6] Switching to Global AI Model Configuration Tab...");
  await browser.eval(`
    window.__store.getState().setAdminModalOpen(true, "ai_config");
  `);
  await sleep(800);

  await browser.screenshot("admin_qa_5_admin_global_ai_config_tab.png");

  // 7. Test AI Model Settings Save
  console.log("[7] Saving global AI model configuration as Admin...");
  const saveAiRes = await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      return await store.saveAiConfig({
        baseUrl: "https://api.openai.com/v1",
        apiKey: "sk-image2-platform-master-key-8888",
        model: "image2",
        size: "1024x1024",
      });
    })()
  `);
  console.log("  Save AI config result:", saveAiRes);
  await sleep(800);

  await browser.screenshot("admin_qa_6_admin_ai_config_saved.png");

  // 8. Logout from Admin & Test Regular User (Lin - photographer)
  console.log("[8] Logging out Admin and logging in as regular creator (Lin)...");
  await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      await store.logout();
      await store.login("lin", "123456");
    })()
  `);
  await sleep(1000);

  const regularUserState = await browser.eval(`
    (() => {
      const store = window.__store.getState();
      return {
        user: store.currentUser,
        hasAdminBtn: !!document.querySelector("#header-admin-quick-btn"),
      };
    })()
  `);
  console.log("  Regular user logged in:", regularUserState.user?.name, "| isAdmin:", regularUserState.user?.isAdmin, "| Has Admin Top Btn:", regularUserState.hasAdminBtn);

  // Open AI Settings Modal as regular user to see read-only view
  await browser.eval(`
    window.__store.getState().setAiSettingsModalOpen(true);
  `);
  await sleep(800);

  await browser.screenshot("admin_qa_7_regular_user_ai_readonly_view.png");

  // 9. Test Banned User Login Rejection (Mia)
  console.log("[9] Testing Banned User (Mia) Login rejection...");
  await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      await store.setAiSettingsModalOpen(false);
      await store.logout();
    })()
  `);
  await sleep(600);

  const loginBannedRes = await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      return await store.login("mia", "123456");
    })()
  `);
  console.log("  Banned user login result:", loginBannedRes);

  await browser.screenshot("admin_qa_8_banned_user_login_blocked.png");

  await browser.close();

  console.log("==================================================");
  console.log("  ALL ADMIN & AI MODEL QA TESTS COMPLETED!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
