import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDPSession {
  constructor(port, dir, winSize, url) {
    this.port = port;
    this.dir = dir;
    this.winSize = winSize;
    this.url = url;
    this.msgId = 1;
    this.cbs = new Map();
  }

  async start() {
    if (fs.existsSync(this.dir)) fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
    this.proc = spawn("google-chrome", [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.dir}`,
      `--window-size=${this.winSize}`,
      this.url,
    ]);

    let tab = null;
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length) {
          tab = tabs.find((t) => t.type === "page") || tabs[0];
          if (tab?.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }

    if (!tab) throw new Error("Chrome failed to start or expose target");
    this.ws = new WebSocket(tab.webSocketDebuggerUrl);

    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });

    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && this.cbs.has(msg.id)) {
        const cb = this.cbs.get(msg.id);
        this.cbs.delete(msg.id);
        cb(msg);
      }
    };

    await this.send("Page.enable");
    await this.send("Runtime.enable");
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = this.msgId++;
      this.cbs.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.result?.value;
  }

  async waitFor(expr, timeoutMs = 12000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const val = await this.eval(expr);
        if (val) return val;
      } catch (e) {}
      await sleep(200);
    }
    throw new Error(`Timeout waiting for expression: ${expr}`);
  }

  async screenshot(outPath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const data = res.result?.data || res.data;
    if (data) {
      fs.writeFileSync(outPath, Buffer.from(data, "base64"));
      console.log(`Saved screenshot: ${outPath}`);
    }
  }

  async close() {
    try {
      if (this.ws) this.ws.close();
      if (this.proc) this.proc.kill("SIGKILL");
    } catch (e) {}
  }
}

async function run() {
  const session = new CDPSession(9448, "/tmp/chrome_exact_qa", "1920,1080", "http://127.0.0.1:3010");
  try {
    await session.start();
    console.log("Browser connected. Waiting for app...");
    await session.waitFor(`document.readyState === 'complete' && !!window.__store`);

    // 如果处于落地页，点击直接体验
    await session.eval(`
      const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && (btn.textContent.includes('直接体验') || btn.textContent.includes('开始创作')));
      if (b) b.click();
    `);
    await sleep(800);

    // ─────────────────────────────────────────────────────────────
    // 1. 验证模板面板缩略图
    // ─────────────────────────────────────────────────────────────
    console.log("1. Testing Template Panel...");
    await session.eval(`window.__store.getState().setActivePanel("templates");`);
    await sleep(1000);
    await session.screenshot("screenshots/exact_1_template_panel.png");

    // ─────────────────────────────────────────────────────────────
    // 2. 验证 AI 风格化工作台（卡片尺寸紧凑精巧）
    // ─────────────────────────────────────────────────────────────
    console.log("2. Testing Ai Stylize Studio Cards...");
    await session.eval(`window.__store.getState().setActivePanel("ai-stylize");`);
    await sleep(1200);
    await session.screenshot("screenshots/exact_2_ai_stylize_cards.png");

    // ─────────────────────────────────────────────────────────────
    // 3. 验证 3D 画册舞台 (封面)
    // ─────────────────────────────────────────────────────────────
    console.log("3. Testing 3D Photobook Stage (Cover)...");
    await session.eval(`
      window.__store.getState().setActivePanel("album");
      window.__store.getState().setCurrentSpreadIndex(-1);
    `);
    await sleep(1500);
    await session.screenshot("screenshots/exact_3_book_cover.png");

    // 翻到内页 Spread 0 (P.1-2)
    console.log("3. Turning to Spread 0...");
    await session.eval(`
      const nextBtn = document.querySelector('button[title="下一页"]');
      if (nextBtn) nextBtn.click();
    `);
    await sleep(1200);
    await session.screenshot("screenshots/exact_3_book_spread0.png");

    // 翻到内页 Spread 1 (P.3-4)
    console.log("3. Turning to Spread 1...");
    await session.eval(`
      const nextBtn = document.querySelector('button[title="下一页"]');
      if (nextBtn) nextBtn.click();
    `);
    await sleep(1200);
    await session.screenshot("screenshots/exact_3_book_spread1.png");

    // ─────────────────────────────────────────────────────────────
    // 4. 验证底部 Dock 更多菜单 (修复裁切)
    // ─────────────────────────────────────────────────────────────
    console.log("4. Testing Dock More Menu (Upward expanded)...");
    await session.eval(`
      const moreBtn = document.querySelector('button[title*="更多画册设置"]');
      if (moreBtn) moreBtn.click();
    `);
    await sleep(700);
    await session.screenshot("screenshots/exact_4_dock_menu.png");

    // 关闭菜单
    await session.eval(`
      const moreBtn = document.querySelector('button[title*="更多画册设置"]');
      if (moreBtn) moreBtn.click();
    `);
    await sleep(400);

    // ─────────────────────────────────────────────────────────────
    // 5. 翻到封底，验证封底与封面风格统一、书上无大黄按钮
    // ─────────────────────────────────────────────────────────────
    console.log("5. Testing Back Cover Style...");
    // 连翻几页直至封底
    for (let i = 0; i < 10; i++) {
      const reachedEnd = await session.eval(`
        const nextBtn = document.querySelector('button[title="下一页"]');
        if (!nextBtn || nextBtn.disabled || nextBtn.classList.contains('opacity-20')) return true;
        nextBtn.click();
        return false;
      `);
      if (reachedEnd) break;
      await sleep(400);
    }
    await sleep(1500);
    await session.screenshot("screenshots/exact_5_back_cover.png");

    // ─────────────────────────────────────────────────────────────
    // 6. 验证底部 Dock 中的“从头翻开画册”按键与跳转回封面
    // ─────────────────────────────────────────────────────────────
    console.log("6. Clicking Restart Photobook from Bottom Dock...");
    await session.eval(`
      const restartBtn = document.querySelector('button[title*="从头重新翻开"], button[title*="从头翻开"]');
      if (restartBtn) restartBtn.click();
    `);
    await sleep(1500);
    await session.screenshot("screenshots/exact_6_restarted_cover.png");

    console.log("All exact tests finished successfully!");
  } finally {
    await session.close();
  }
}

run().catch(console.error);
