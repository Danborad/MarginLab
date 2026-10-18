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
  const session = new BrowserSession(9580, "/tmp/chrome_complete_test");
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
    console.log("4. Entering AI Stylize Stage with default Style 01...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        store.setActivePanel('ai-stylize');
        store.setThemeMode('light');
        store.setSelectedAiStyleId('dreamy_motion_editorial');
        store.setAiSourceImage(null);
        store.setLatestAiGeneratedImage(null);
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

    console.log("Test A: Style 01 in Light Mode (Translucent cover visible)...");
    await session.screenshot("final_verif_1_style01_light.png");

    // Simulate generated result
    console.log("Test B: Simulating a generated artwork...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const fakeResult = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='768' height='1024' viewBox='0 0 768 1024'><rect width='768' height='1024' fill='%230f172a'/><circle cx='384' cy='450' r='250' fill='%23ec4899'/><text x='384' y='820' font-size='40' fill='white' text-anchor='middle'>ANIME ILLUSTRATION GIRL</text></svg>";
        store.setLatestAiGeneratedImage(fakeResult);
      })()
    `);
    await sleep(1000);
    await session.screenshot("final_verif_2_artwork_displayed.png");

    // Click Style 04 (Street Photo Color Chibi) on left rail
    console.log("Test C: Switching to Style 04 (彩色轻Q实景插画)...");
    await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]'));
        const style4 = allCards.find(el => el.textContent && el.textContent.includes("04") && el.textContent.includes("彩色轻Q"));
        if (style4) style4.click();
      })()
    `);
    await sleep(1500);
    await session.screenshot("final_verif_3_style04_cleared_to_default.png");

    // Click Style 03 (Street Photo Black Ink) on left rail
    console.log("Test D: Switching to Style 03 (黑白手绘实景插画)...");
    await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]'));
        const style3 = allCards.find(el => el.textContent && el.textContent.includes("03") && el.textContent.includes("黑白手绘"));
        if (style3) style3.click();
      })()
    `);
    await sleep(1500);
    await session.screenshot("final_verif_4_style03_black_ink.png");

    // Click Style 08 (纪实重构 · 超现实舞台)
    console.log("Test E: Switching to Style 08 (纪实重构 · 超现实舞台)...");
    await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]'));
        const style8 = allCards.find(el => el.textContent && el.textContent.includes("08") && el.textContent.includes("纪实重构"));
        if (style8) style8.click();
      })()
    `);
    await sleep(1500);
    await session.screenshot("final_verif_5_style08_reality_restaged.png");

    // Switch to dark mode
    console.log("Test F: Toggling to Dark Mode (Whole app dark)...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setThemeMode('dark');
      })()
    `);
    await sleep(1200);
    await session.screenshot("final_verif_6_dark_mode_full.png");

    // Test Compact Mode (Click 紧凑视图)
    console.log("Test G: Switching to Compact Mode...");
    await session.evaluate(`
      (function() {
        const compactBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('紧凑视图'));
        if (compactBtn) compactBtn.click();
      })()
    `);
    await sleep(1200);
    await session.screenshot("final_verif_7_compact_mode.png");

    console.log("ALL COMPLETE VERIFICATION SUITE FINISHED!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
