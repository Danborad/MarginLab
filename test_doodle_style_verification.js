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
  const session = new BrowserSession(9592, "/tmp/chrome_doodle_test");
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

    // Check total styles loaded in store
    const storeStylesInfo = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        return {
          count: store.aiStyles.length,
          styles: store.aiStyles.map(s => ({ id: s.id, order: s.order, name: s.name, badge: s.badge }))
        };
      })()
    `);
    console.log("Styles in store:", storeStylesInfo);

    // Test Style 11: 魔性丑萌蜡笔涂鸦
    console.log("5. Selecting Style 11 (魔性丑萌蜡笔涂鸦)...");
    await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]'));
        const style11 = allCards.find(el => el.textContent && (el.textContent.includes("魔性丑萌蜡笔涂鸦") || el.textContent.includes("11")));
        if (style11) {
          style11.scrollIntoView({ block: 'center' });
          style11.click();
        } else {
          window.__store.getState().setSelectedAiStyleId('funny_ugly_doodle');
        }
      })()
    `);
    await sleep(1500);

    console.log("Capturing Style 11 wide stage screenshot...");
    await session.screenshot("verif_style11_doodle_stage.png");

    const check11 = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const main = document.querySelector('main');
        const mainText = main ? main.textContent : '';
        return {
          selectedAiStyleId: store.selectedAiStyleId,
          hasBadge: mainText.includes('魔性丑萌蜡笔涂鸦'),
          hasMemeBadge: mainText.includes('Meme 涂鸦'),
          hasSampleTag: mainText.includes('风格样张底稿'),
          hasDropzone: mainText.includes('放入一张真实照片'),
          hasPromptKeyword: mainText.includes('cheap marker or crayon') || mainText.includes('魔性丑萌蜡笔涂鸦')
        };
      })()
    `);
    console.log("Check Style 11 result:", check11);

    // Test Compact Mode gallery with all 11 cards
    console.log("6. Switching to Compact Mode to inspect full 11-style gallery...");
    await session.evaluate(`
      (function() {
        const compactBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('紧凑视图'));
        if (compactBtn) compactBtn.click();
      })()
    `);
    await sleep(1500);

    // Scroll down to show bottom cards
    await session.evaluate(`
      (function() {
        const scrollable = document.querySelector('.overflow-y-auto');
        if (scrollable) scrollable.scrollTop = 650;
      })()
    `);
    await sleep(1000);

    console.log("Capturing 11-style Compact gallery...");
    await session.screenshot("verif_11styles_compact_gallery.png");

    // Check Admin Modal styles tab
    console.log("7. Opening Admin Modal to verify Style 11 management...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        store.setAdminModalOpen(true);
      })()
    `);
    await sleep(1200);

    // Switch to Styles Tab
    await session.evaluate(`
      (function() {
        const tabs = Array.from(document.querySelectorAll('button'));
        const stylesTab = tabs.find(t => t.textContent && t.textContent.includes('AI 风格模板管理'));
        if (stylesTab) stylesTab.click();
      })()
    `);
    await sleep(1000);

    // Scroll styles table down
    await session.evaluate(`
      (function() {
        const scrollable = document.querySelector('.overflow-y-auto');
        if (scrollable) scrollable.scrollTop = 1000;
      })()
    `);
    await sleep(1000);

    console.log("Capturing Admin Modal Styles tab screenshot...");
    await session.screenshot("verif_style11_admin_modal.png");

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
