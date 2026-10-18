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
      "--window-size=1680,1050",
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

  async navigate(url) {
    await this.send("Page.navigate", { url });
    await sleep(2500);
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log("Screenshot saved:", filename);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill("SIGTERM");
    await sleep(500);
  }
}

async function run() {
  const session = new BrowserSession(9598, "/tmp/chrome_rr_ui_test");
  try {
    console.log("1. Starting Chrome...");
    await session.start();

    console.log("2. Navigating to http://127.0.0.1:3001 ...");
    await session.navigate("http://127.0.0.1:3001");

    // Login as admin
    console.log("3. Logging in as admin...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
      })()
    `);
    await sleep(2000);

    // Enter AI Stylize panel in Wide Workspace mode
    console.log("4. Entering AI Stylize Stage...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        store.setActivePanel('ai-stylize');
        store.setThemeMode('light');
        store.fetchAiStyles();
      })()
    `);
    await sleep(1500);

    // Expand Wide Workspace by clicking expand button if not wide
    await session.evaluate(`
      (function() {
        const expandBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('展开工作台'));
        if (expandBtn) expandBtn.click();
      })()
    `);
    await sleep(1000);

    // Select Style 08: 纪实重构 · 超现实舞台
    console.log("5. Selecting Style 08 (纪实重构 · 超现实舞台)...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setSelectedAiStyleId('reality_restaged');
      })()
    `);
    await sleep(1500);

    console.log("Capturing Style 08 wide stage screenshot...");
    await session.screenshot("verif_reality_restaged_stage_updated.png");

    // Switch to compact mode
    await session.evaluate(`
      (function() {
        const compactBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('紧凑视图'));
        if (compactBtn) compactBtn.click();
      })()
    `);
    await sleep(1200);

    // Scroll down in compact view to view card 08
    await session.evaluate(`
      (function() {
        const scrollable = document.querySelector('.overflow-y-auto');
        if (scrollable) scrollable.scrollTop = 350;
      })()
    `);
    await sleep(1000);
    await session.screenshot("verif_reality_restaged_card_updated.png");

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
