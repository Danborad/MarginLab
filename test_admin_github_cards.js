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
      "--window-size=1560,1000",
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
      throw new Error("Chrome tab not found on port " + this.port);
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
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          this.ws.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      this.ws.addEventListener("message", handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error("Eval failed: " + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filepath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filepath, Buffer.from(res.data, "base64"));
    console.log("Screenshot saved:", filepath);
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.proc) {
      this.proc.kill("SIGKILL");
    }
  }
}

async function run() {
  const session = new BrowserSession(9445, "/tmp/chrome-admin-github");
  try {
    console.log("Starting Chrome CDP on 9445...");
    await session.start();

    console.log("Navigating to http://127.0.0.1:3001 ...");
    await session.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2000);

    // Reliable input filler for React controlled components
    console.log("Filling login credentials for admin...");
    await session.evaluate(`
      (function() {
        function fillReactInput(selector, val) {
          const el = document.querySelector(selector);
          if (!el) return false;
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }

        const inputs = Array.from(document.querySelectorAll('input'));
        const userInput = inputs.find(i => i.placeholder && i.placeholder.includes('账号'));
        const passInput = inputs.find(i => i.type === 'password');

        if (userInput) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(userInput, 'admin');
          userInput.dispatchEvent(new Event('input', { bubbles: true }));
          userInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (passInput) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(passInput, 'admin123');
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          passInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const buttons = Array.from(document.querySelectorAll('button'));
        const submitBtn = buttons.find(b => b.textContent && b.textContent.includes('登录并进入工作台'));
        if (submitBtn) submitBtn.click();
      })()
    `);
    await sleep(2500);

    await session.screenshot("admin_verif_1_logged_in.png");

    // Click Admin Management button in header
    console.log("Opening admin management modal...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const adminBtn = buttons.find(b => b.textContent && (b.textContent.includes('系统管控') || b.textContent.includes('管理员')));
        if (adminBtn) adminBtn.click();
      })()
    `);
    await sleep(1500);

    // Switch to 风格化管理 Tab
    console.log("Switching to 风格化管理 Tab...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const stylesTab = buttons.find(b => b.textContent && b.textContent.includes('风格化'));
        if (stylesTab) stylesTab.click();
      })()
    `);
    await sleep(1500);

    await session.screenshot("admin_verif_2_styles_tab.png");

    // Inspect github reference cards in DOM
    const repoCardsText = await session.evaluate(`
      (function() {
        return Array.from(document.querySelectorAll('a[href*="github.com"]'))
          .map(a => ({
            href: a.href,
            text: a.textContent.trim(),
            parentText: a.parentElement ? a.parentElement.parentElement?.textContent.trim().substring(0, 80) : ''
          }));
      })()
    `);
    console.log("Found GitHub links in Admin Modal:", repoCardsText);

    // Scroll admin modal to inspect the 4 new styles
    await session.evaluate(`
      (function() {
        const scrollable = document.querySelector('.overflow-y-auto');
        if (scrollable) {
          scrollable.scrollTop = 420;
        }
      })()
    `);
    await sleep(1000);
    await session.screenshot("admin_verif_3_new_styles_in_list.png");

    // Scroll more to see remaining styles
    await session.evaluate(`
      (function() {
        const scrollable = document.querySelector('.overflow-y-auto');
        if (scrollable) {
          scrollable.scrollTop = 850;
        }
      })()
    `);
    await sleep(1000);
    await session.screenshot("admin_verif_4_styles_list_bottom.png");

    console.log("Admin modal test completed successfully!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

run();
