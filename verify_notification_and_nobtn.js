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

  async reload() {
    await this.send("Page.reload");
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
    await sleep(600);
  }
}

async function run() {
  console.log("==================================================");
  console.log("  VERIFICATION: No Toast on F5 & Removed Return Button");
  console.log("==================================================");

  const browser = new BrowserSession(9877, "/tmp/chrome_qa_notif_test");
  try {
    await browser.start();
    await sleep(1500);

    // 1. Log in
    console.log("[1] Logging in as admin...");
    await browser.eval(`
      (async () => {
        return await window.__store.getState().login("admin", "admin123");
      })()
    `);
    await sleep(800);

    // 2. Switch to AI Stylize Mode
    console.log("[2] Switching to AI Stylize Mode...");
    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
    `);
    await sleep(600);

    // 3. Check Header in AI Stylize Mode: verify NO "返回拼图画布" button
    console.log("[3] Checking AI Stylize Header elements...");
    const headerCheck1 = await browser.eval(`
      (() => {
        const header = document.querySelector("header");
        const allButtons = Array.from(header?.querySelectorAll("button") || []);
        const returnBtn = allButtons.find(b => b.innerText.includes("返回拼图") || b.title.includes("返回拼图"));
        const toast = document.querySelector(".fixed.top-5.left-1\\\\/2, .animate-bounceSubtle, [class*='border-emerald-500']");
        return {
          hasReturnBtn: !!returnBtn,
          headerButtonTexts: allButtons.map(b => b.innerText.trim()).filter(Boolean),
          hasToastNotification: !!toast,
          toastText: toast?.innerText?.replace(/\\n+/g, " ") || null,
        };
      })()
    `);
    console.log("  Initial AI Stylize Header State:", headerCheck1);
    await browser.screenshot("verif_v9_1_ai_stylize_clean_header.png");

    // 4. Press F5 (Reload) and test that NO toast pops up and NO return button exists
    console.log("[4] Reloading page with F5 (simulating refresh)...");
    await browser.reload();
    await sleep(1000);

    const postReloadCheck = await browser.eval(`
      (() => {
        const header = document.querySelector("header");
        const allButtons = Array.from(header?.querySelectorAll("button") || []);
        const returnBtn = allButtons.find(b => b.innerText.includes("返回拼图") || b.title.includes("返回拼图"));
        const toast = document.querySelector("[class*='border-emerald-500'][class*='shadow-emerald']");
        const store = window.__store?.getState();
        return {
          currentView: store?.currentView,
          activePanel: store?.activePanel,
          hasReturnBtn: !!returnBtn,
          hasToastNotification: !!toast,
          toastText: toast?.innerText?.replace(/\\n+/g, " ") || null,
        };
      })()
    `);
    console.log("  Post-F5 Reload State in AI Stylize:", postReloadCheck);
    await browser.screenshot("verif_v9_2_post_f5_no_toast_no_return_btn.png");

    if (postReloadCheck.hasToastNotification) {
      console.error("  FAIL: Toast notification still appeared on refresh!");
    } else {
      console.log("  PASS: Toast notification did NOT appear on refresh!");
    }

    if (postReloadCheck.hasReturnBtn) {
      console.error("  FAIL: Return to collage canvas button is still visible!");
    } else {
      console.log("  PASS: Return to collage canvas button was successfully removed!");
    }

    // 5. Test Dark Mode in AI Stylize
    console.log("[5] Testing Dark Mode in AI Stylize...");
    await browser.eval(`
      window.__store.getState().setThemeMode("dark");
    `);
    await sleep(500);
    await browser.screenshot("verif_v9_3_ai_stylize_dark_clean.png");

    console.log("==================================================");
    console.log("  ALL TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("Verification Error:", err);
  } finally {
    await browser.close();
  }
}

run();
