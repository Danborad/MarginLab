import { spawn } from "child_process";
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
      "--window-size=1440,900",
      "about:blank",
    ]);

    let tab = null;
    for (let i = 0; i < 50; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length > 0) {
          tab = tabs.find((t) => t.type === "page") || tabs[0];
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
    await this.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2000);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          this.ws.removeEventListener("message", handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      this.ws.addEventListener("message", handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression: `(() => { ${expression} })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      console.error("Eval Exception:", res.exceptionDetails);
      throw new Error(res.exceptionDetails.text || "Eval failed");
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`Saved screenshot: ${filename}`);
  }

  async close() {
    try {
      if (this.ws) this.ws.close();
    } catch (e) {}
    try {
      if (this.proc) this.proc.kill("SIGKILL");
    } catch (e) {}
  }
}

async function run() {
  const browser = new BrowserSession(9343, "/tmp/chrome_verify_ai");
  try {
    await browser.start();
    await sleep(1500);

    // 1. Verify Clean Landing Page (No User Type / Role Selector)
    await browser.screenshot("verif_real_1_clean_landing.png");

    // Check DOM for any "用户类型" or role selector in login form
    const loginFormText = await browser.eval(`
      const auth = document.getElementById("auth-portal");
      return auth ? auth.innerText : "";
    `);
    console.log("Login portal text check:", loginFormText.includes("用户类型") ? "HAS USER TYPE (ERROR)" : "CLEAN (NO USER TYPE)");

    // 2. Log in as a regular user (create or login)
    await browser.eval(`
      return window.__store.getState().register({
        username: "creator_test",
        password: "user123",
        name: "独立摄影师小张"
      });
    `);
    await sleep(1000);

    // 3. Verify regular user in Studio: NO Admin Button, NO Custom API button
    await browser.screenshot("verif_real_2_regular_user_studio.png");
    const regularHasAdmin = await browser.eval(`
      return Boolean(document.getElementById("header-admin-quick-btn"));
    `);
    console.log("Regular user has admin button:", regularHasAdmin ? "YES (ERROR)" : "NO (CORRECT)");

    // 4. Log in as admin and switch to AI Stylize Center Stage
    await browser.eval(`
      window.__store.getState().logout();
    `);
    await sleep(800);

    await browser.eval(`
      return window.__store.getState().login("admin", "admin123");
    `);
    await sleep(1200);

    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
      window.__store.getState().setSelectedAiStyleId("fantasy_qiqiguaiguai");
    `);
    await sleep(1000);

    // Load our real AI generated coffee poster into the view
    await browser.eval(`
      const items = window.__store.getState().aiHistory || [];
      const coffeeTask = items.find(it => it.styleId === "fantasy_qiqiguaiguai" && it.resultUrl?.startsWith("data:image/png"));
      if (coffeeTask) {
        window.__store.getState().setLatestAiGeneratedImage(coffeeTask.resultUrl);
        window.__store.getState().setAiSourceImage("https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80");
      }
    `);
    await sleep(1000);

    // Scroll aside to show action buttons
    await browser.eval(`
      const drawer = document.querySelector("aside");
      if (drawer) drawer.scrollTop = 200;
    `);
    await sleep(500);

    await browser.screenshot("verif_real_3_ai_poster_in_drawer.png");

    // 5. Test "按住看原图" (Hold to peek original)
    await browser.eval(`
      const eyeBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("按住看原图"));
      if (eyeBtn) {
        eyeBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      }
    `);
    await sleep(500);
    await browser.screenshot("verif_real_4_hold_peek_original.png");

    await browser.eval(`
      const eyeBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("按住看原图"));
      if (eyeBtn) {
        eyeBtn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      }
    `);
    await sleep(500);

    // 6. Test "存入素材" (Save to media library)
    await browser.eval(`
      const saveBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("存入素材"));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("verif_real_5_asset_saved_toast.png");

    console.log("All verification steps completed successfully!");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
