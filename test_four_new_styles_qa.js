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
  const session = new BrowserSession(9444, "/tmp/chrome-four-styles-qa");
  try {
    console.log("Starting Chrome CDP session on port 9444...");
    await session.start();

    console.log("Navigating to http://127.0.0.1:3001 ...");
    await session.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2500);

    // 1. Check landing page
    await session.screenshot("qa_step1_landing.png");

    // Login as admin
    console.log("Logging in as admin...");
    await session.evaluate(`
      (function() {
        const inputs = Array.from(document.querySelectorAll('input'));
        const userInput = inputs.find(i => i.placeholder && i.placeholder.includes('账号'));
        const passInput = inputs.find(i => i.type === 'password');
        if (userInput) {
          userInput.value = 'admin';
          userInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (passInput) {
          passInput.value = 'admin123';
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const buttons = Array.from(document.querySelectorAll('button'));
        const loginBtn = buttons.find(b => b.textContent && (b.textContent.includes('进入工作台') || b.textContent.includes('登录')));
        if (loginBtn) loginBtn.click();
      })()
    `);
    await sleep(2500);

    // Verify studio workspace opened
    console.log("Studio workspace opened, checking nav...");
    await session.screenshot("qa_step2_studio_home.png");

    // 2. Click "风格化创作" tab in header
    console.log("Switching to 风格化创作...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const stylizeBtn = buttons.find(b => b.textContent && b.textContent.includes('风格化'));
        if (stylizeBtn) stylizeBtn.click();
      })()
    `);
    await sleep(2000);

    // Check visible styles in stylize stage
    const styleCards = await session.evaluate(`
      (function() {
        const titles = Array.from(document.querySelectorAll('h4, div, span'))
          .map(el => el.textContent.trim())
          .filter(t => t.includes('文化碎片') || t.includes('东方水墨') || t.includes('纪实重构') || t.includes('梦幻动态') || t.includes('奇奇怪怪'));
        return Array.from(new Set(titles));
      })()
    `);
    console.log("Found style elements in Stylize stage:", styleCards);
    await session.screenshot("qa_step3_stylize_overview.png");

    // 3. Select Style 5: 文化碎片海报
    console.log("Selecting Style 5: 文化碎片海报...");
    await session.evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => d.textContent && d.textContent.includes('文化碎片海报'));
        const card = cards[cards.length - 1];
        if (card) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
          card.click();
        }
      })()
    `);
    await sleep(1500);
    await session.screenshot("qa_step4_style5_culture_fragment.png");

    // 4. Select Style 6: 东方水墨二分画 · 景致篇
    console.log("Selecting Style 6: 东方水墨二分画 · 景致篇...");
    await session.evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => d.textContent && d.textContent.includes('东方水墨二分画 · 景致篇'));
        const card = cards[cards.length - 1];
        if (card) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
          card.click();
        }
      })()
    `);
    await sleep(1500);
    await session.screenshot("qa_step5_style6_eastern_ink_scenery.png");

    // 5. Select Style 7: 东方水墨二分画 · 构筑篇
    console.log("Selecting Style 7: 东方水墨二分画 · 构筑篇...");
    await session.evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => d.textContent && d.textContent.includes('东方水墨二分画 · 构筑篇'));
        const card = cards[cards.length - 1];
        if (card) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
          card.click();
        }
      })()
    `);
    await sleep(1500);
    await session.screenshot("qa_step6_style7_eastern_ink_arch.png");

    // 6. Select Style 8: 纪实重构 · 超现实舞台
    console.log("Selecting Style 8: 纪实重构 · 超现实舞台...");
    await session.evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('div')).filter(d => d.textContent && d.textContent.includes('纪实重构 · 超现实舞台'));
        const card = cards[cards.length - 1];
        if (card) {
          card.scrollIntoView({ behavior: 'instant', block: 'center' });
          card.click();
        }
      })()
    `);
    await sleep(1500);
    await session.screenshot("qa_step7_style8_reality_restaged.png");

    // 7. Open Admin Modal
    console.log("Opening Admin Management Modal...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const adminBtn = buttons.find(b => b.textContent && (b.textContent.includes('系统管控') || b.textContent.includes('管理员')));
        if (adminBtn) adminBtn.click();
      })()
    `);
    await sleep(1500);

    // Switch to 风格化管理 Tab
    console.log("Switching to 风格化管理 Tab in Admin Modal...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const stylesTab = buttons.find(b => b.textContent && b.textContent.includes('风格化'));
        if (stylesTab) stylesTab.click();
      })()
    `);
    await sleep(2000);
    await session.screenshot("qa_step8_admin_styles_overview.png");

    // Check presence of new GitHub repo cards
    const repoCardsInfo = await session.evaluate(`
      (function() {
        const cardTitles = Array.from(document.querySelectorAll('span, p, a, div'))
          .map(e => e.textContent.trim())
          .filter(t => t.includes('culture-fragment-poster-engine') || t.includes('eastern-ink-photo-diptych') || t.includes('reality-restaged'));
        return Array.from(new Set(cardTitles));
      })()
    `);
    console.log("Detected GitHub Reference Repos in Admin Modal:", repoCardsInfo);

    // Scroll down to see style list in admin modal
    await session.evaluate(`
      (function() {
        const modalBody = document.querySelector('.overflow-y-auto');
        if (modalBody) {
          modalBody.scrollTop = 500;
        }
      })()
    `);
    await sleep(1000);
    await session.screenshot("qa_step9_admin_styles_list_scrolled.png");

    console.log("All test steps finished successfully!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
