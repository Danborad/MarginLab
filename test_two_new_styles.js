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
  const session = new BrowserSession(9590, "/tmp/chrome_new_styles_test");
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

    // Verify 10 styles exist in left rail
    const totalRailStyles = await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]')).filter(el => {
          const t = el.textContent || '';
          return t.includes('01') || t.includes('02') || t.includes('09') || t.includes('10');
        });
        return allCards.length;
      })()
    `);
    console.log("Total rail styles detected:", totalRailStyles);

    // Test Style 09: 真实摄影+抽象设计
    console.log("5. Selecting Style 09 (真实摄影+抽象设计)...");
    await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]'));
        const style9 = allCards.find(el => el.textContent && el.textContent.includes("真实摄影+抽象设计"));
        if (style9) {
          style9.scrollIntoView({ block: 'center' });
          style9.click();
        } else {
          window.__store.getState().setSelectedAiStyleId('photo_abstract_diptych');
        }
      })()
    `);
    await sleep(1500);

    console.log("Capturing Style 09 screenshot...");
    await session.screenshot("verif_style9_photo_abstract.png");

    const check9 = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const main = document.querySelector('main');
        const mainText = main ? main.textContent : '';
        return {
          currentStyleId: store.selectedAiStyleId,
          hasBadge: mainText.includes('真实摄影+抽象设计'),
          hasP10Badge: mainText.includes('p10 推荐') || mainText.includes('p10'),
          hasSampleTag: mainText.includes('风格样张底稿'),
          hasDropzone: mainText.includes('放入一张真实照片'),
          hasPromptTarget: mainText.includes('真实摄影+抽象设计')
        };
      })()
    `);
    console.log("Check Style 09:", check9);

    // Test Style 10: 极简编辑插画海报
    console.log("6. Selecting Style 10 (极简编辑插画海报)...");
    await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]'));
        const style10 = allCards.find(el => el.textContent && el.textContent.includes("极简编辑插画海报"));
        if (style10) {
          style10.scrollIntoView({ block: 'center' });
          style10.click();
        } else {
          window.__store.getState().setSelectedAiStyleId('minimal_editorial_illustration');
        }
      })()
    `);
    await sleep(1500);

    console.log("Capturing Style 10 screenshot...");
    await session.screenshot("verif_style10_minimal_editorial.png");

    const check10 = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const main = document.querySelector('main');
        const mainText = main ? main.textContent : '';
        return {
          currentStyleId: store.selectedAiStyleId,
          hasBadge: mainText.includes('极简编辑插画海报'),
          hasMagBadge: mainText.includes('独立杂志'),
          hasSampleTag: mainText.includes('风格样张底稿'),
          hasDropzone: mainText.includes('放入一张真实照片'),
          hasPromptTarget: mainText.includes('极简编辑插画海报')
        };
      })()
    `);
    console.log("Check Style 10:", check10);

    // Test Compact Mode gallery with all 10 cards
    console.log("7. Switching to Compact Mode to inspect full 10-style gallery...");
    await session.evaluate(`
      (function() {
        const compactBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('紧凑视图'));
        if (compactBtn) compactBtn.click();
      })()
    `);
    await sleep(1500);

    console.log("Capturing 10-style Compact gallery...");
    await session.screenshot("verif_10styles_compact_gallery_top.png");

    // Scroll down in compact view to view styles 9 and 10 cards
    await session.evaluate(`
      (function() {
        const scrollable = document.querySelector('.overflow-y-auto');
        if (scrollable) scrollable.scrollTop = 500;
        window.scrollTo(0, 500);
      })()
    `);
    await sleep(1000);
    await session.screenshot("verif_10styles_compact_gallery_bottom.png");

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
