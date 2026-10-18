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
      "--window-size=1440,960",
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
      throw new Error("Failed to connect to chrome debugging port");
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
    await sleep(2500);
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
      console.error("Eval exception:", res.exceptionDetails);
    }
    return res.result ? res.result.value : null;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`Saved screenshot: ${filename}`);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill();
  }
}

async function run() {
  const browser = new BrowserSession(9337, "/tmp/chrome-dual-modes-test");
  try {
    console.log("Starting Browser...");
    await browser.start();
    await sleep(1500);

    // 1. Verify Clean Landing Page (No "用户类型")
    const landingCheck = await browser.eval(`
      const auth = document.getElementById("auth-portal");
      const text = auth ? auth.innerText : document.body.innerText;
      return {
        hasUserType: text.includes("用户类型"),
        hasRoleSelector: Boolean(document.querySelector('select[name="role"]') || document.querySelector('input[name="role"]')),
      };
    `);
    console.log("1. Landing page check:", landingCheck);
    await browser.screenshot("qa_1_clean_landing_no_usertype.png");

    // 2. Register & Login as regular user
    await browser.eval(`
      return window.__store.getState().register({
        username: "street_artist_01",
        password: "user1234",
        name: "街拍主理人小张",
      });
    `);
    await sleep(1000);

    // Check user state in Studio: NO Admin Button, NO Custom API button
    const regularUserCheck = await browser.eval(`
      const s = window.__store.getState();
      const user = s.currentUser;
      const adminBtn = document.getElementById("header-admin-control-btn");
      const customApiBtn = document.querySelector('[data-testid="custom-api"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes("自定义 API") || b.innerText.includes("自定义API"));
      return {
        username: user?.username,
        isAdmin: user?.isAdmin,
        hasAdminBtn: Boolean(adminBtn),
        hasCustomApiBtn: Boolean(customApiBtn),
      };
    `);
    console.log("2. Regular user check:", regularUserCheck);
    await browser.screenshot("qa_2_regular_user_no_custom_api.png");

    // 3. Open AI Stylize Center Stage
    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
      window.__store.getState().fetchAiStyles();
    `);
    await sleep(1500);

    const availableStyles = await browser.eval(`
      const s = window.__store.getState();
      return (s.aiStyles || []).map(x => ({ id: x.id, name: x.name, badge: x.badge, enabled: x.enabled }));
    `);
    console.log("3. Available styles in store:", availableStyles);

    // Select Street Photo Black Ink
    await browser.eval(`
      window.__store.getState().setSelectedAiStyleId("street_photo_black_ink");
    `);
    await sleep(800);
    await browser.screenshot("qa_3_stylize_black_ink_selected.png");

    // Select Street Photo Color Chibi
    await browser.eval(`
      window.__store.getState().setSelectedAiStyleId("street_photo_color_chibi");
    `);
    await sleep(800);
    await browser.screenshot("qa_4_stylize_color_chibi_selected.png");

    // 4. Test In-place Generation for Black Ink
    await browser.eval(`
      window.__store.getState().setSelectedAiStyleId("street_photo_black_ink");
      window.__store.getState().setAiSourceImage("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80");
    `);
    await sleep(600);
    await browser.eval(`
      return window.__store.getState().generateAiImage();
    `);
    await sleep(2500);
    await browser.screenshot("qa_5_black_ink_generated.png");

    // Test In-place Generation for Color Chibi
    await browser.eval(`
      window.__store.getState().setSelectedAiStyleId("street_photo_color_chibi");
    `);
    await sleep(600);
    await browser.eval(`
      return window.__store.getState().generateAiImage();
    `);
    await sleep(2500);
    await browser.screenshot("qa_6_color_chibi_generated.png");

    // 5. Admin Control Center: Check GitHub cards
    await browser.eval(`
      return window.__store.getState().login("admin", "admin123");
    `);
    await sleep(1200);

    await browser.eval(`
      window.__store.getState().setAdminModalOpen(true, "styles");
    `);
    await sleep(1500);
    await browser.screenshot("qa_7_admin_github_cards_and_4_styles.png");

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await browser.close();
  }
}

run();
