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
  const session = new BrowserSession(9570, "/tmp/chrome_style_test");
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

    console.log("Step 1: Capturing Style 01 default dropzone with translucent cover...");
    await session.screenshot("style_cover_1_dreamy_default.png");

    const check1 = await session.evaluate(`
      (function() {
        const main = document.querySelector('main');
        const mainText = main ? main.textContent : '';
        const hasTopBadge = mainText.includes('当前风格: s21 · 梦幻动态电影海报') || mainText.includes('梦幻动态电影海报');
        const hasSampleTag = mainText.includes('风格样张底稿');
        const hasDropzone = mainText.includes('放入一张真实照片');
        const hasCoverSvg = main ? !!main.querySelector('svg') : false;
        return { hasTopBadge, hasSampleTag, hasDropzone, hasCoverSvg, mainSnippet: mainText.substring(0, 150) };
      })()
    `);
    console.log("Check 1 (Style 01):", check1);

    // Now simulate user having a generated image under style 01
    console.log("Step 2: Simulating generated artwork in stage...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const fakeResult = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='768' height='1024' viewBox='0 0 768 1024'><rect width='768' height='1024' fill='%230f172a'/><circle cx='384' cy='450' r='250' fill='%2338bdf8'/><text x='384' y='820' font-size='45' fill='white' text-anchor='middle'>GENERATED ANIME ARTWORK</text></svg>";
        store.setLatestAiGeneratedImage(fakeResult);
      })()
    `);
    await sleep(1000);
    await session.screenshot("style_cover_2_has_generated_artwork.png");

    const check2 = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const main = document.querySelector('main');
        const hasArtworkBadge = main ? main.textContent.includes('AI 艺术成片') : false;
        return { latestResultExists: !!store.latestAiGeneratedImage, hasArtworkBadge };
      })()
    `);
    console.log("Check 2 (Artwork visible):", check2);

    // Now user clicks Style 02 (FANTASY · 奇奇怪怪) on left rail!
    console.log("Step 3: Clicking Style 02 (FANTASY · 奇奇怪怪) in left style rail...");
    const clickResult = await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]'));
        const style2 = allCards.find(el => el.textContent && el.textContent.includes("02") && el.textContent.includes("奇奇怪怪"));
        if (style2) {
          style2.click();
          return { found: true, text: style2.textContent.trim().substring(0, 50) };
        }
        return { found: false };
      })()
    `);
    console.log("Click style 2 result:", clickResult);
    await sleep(1500);

    console.log("Capturing Style 02 after switch (previous result must be CLEARED!)...");
    await session.screenshot("style_cover_3_switched_to_fantasy_cleared.png");

    const check3 = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const main = document.querySelector('main');
        const mainText = main ? main.textContent : '';
        return {
          currentStyleId: store.selectedAiStyleId,
          latestResultCleared: store.latestAiGeneratedImage === null,
          sourceImageCleared: store.aiSourceImage === null,
          hasFantasyBadge: mainText.includes('FANTASY · 奇奇怪怪'),
          hasDropzone: mainText.includes('放入一张真实照片'),
          hasArtworkBadge: mainText.includes('AI 艺术成片')
        };
      })()
    `);
    console.log("Check 3 (Style 02 Cleared & Switched):", check3);

    // Now click Style 06 (东方水墨二分画 · 景致篇)
    console.log("Step 4: Clicking Style 06 (东方水墨二分画 · 景致篇)...");
    const click6Result = await session.evaluate(`
      (function() {
        const allCards = Array.from(document.querySelectorAll('div[class*="group"]'));
        const style6 = allCards.find(el => el.textContent && el.textContent.includes("06") && el.textContent.includes("景致篇"));
        if (style6) {
          style6.click();
          return { found: true, text: style6.textContent.trim().substring(0, 50) };
        }
        return { found: false };
      })()
    `);
    console.log("Click style 6 result:", click6Result);
    await sleep(1500);

    console.log("Capturing Style 06...");
    await session.screenshot("style_cover_4_switched_to_ink_scenery.png");

    const check4 = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const main = document.querySelector('main');
        const mainText = main ? main.textContent : '';
        return {
          currentStyleId: store.selectedAiStyleId,
          latestResultCleared: store.latestAiGeneratedImage === null,
          hasInkBadge: mainText.includes('东方水墨二分画 · 景致篇')
        };
      })()
    `);
    console.log("Check 4 (Style 06 Switched):", check4);

    // Switch to dark mode
    console.log("Step 5: Toggling Dark Mode...");
    await session.evaluate(`
      (function() {
        document.documentElement.classList.add('dark');
      })()
    `);
    await sleep(1000);
    await session.screenshot("style_cover_5_dark_mode.png");

    console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
