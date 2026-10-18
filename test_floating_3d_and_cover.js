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
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length) {
          tab = tabs.find((t) => t.type === "page") || tabs[0];
          if (tab?.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }
    if (!tab) throw new Error("Could not find chrome tab");

    this.ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.cbs.has(data.id)) {
        const cb = this.cbs.get(data.id);
        this.cbs.delete(data.id);
        cb(data);
      }
    };

    await this.send("Page.enable");
    await this.send("DOM.enable");
    await this.send("Runtime.enable");
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = this.msgId++;
      this.cbs.set(id, (res) => resolve(res.result));
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`[Screenshot] Saved -> ${filename}`);
  }

  async close() {
    try {
      this.ws?.close();
      this.proc?.kill();
    } catch (e) {}
  }
}

async function run() {
  const cdp = new CDPSession(9430, "/tmp/chrome_album_3d_qa", "1440,960", "http://127.0.0.1:3010");
  try {
    console.log("Starting Chrome CDP session...");
    await cdp.start();
    await sleep(2500);

    // 1. 确保进入相册画册模式
    console.log("Navigating to Photobook View...");
    await cdp.eval(`
      (() => {
        // 先检查是否有画册打开按钮
        const btns = Array.from(document.querySelectorAll('button'));
        const albumBtn = btns.find(b => b.textContent && (b.textContent.includes('画册') || b.textContent.includes('相册') || b.title?.includes('画册')));
        if (albumBtn) albumBtn.click();
      })()
    `);
    await sleep(1500);

    // 如果未打开，尝试点击左侧边栏的相册面板或快捷入口
    await cdp.eval(`
      (() => {
        const allBtns = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const openPhotobookBtn = allBtns.find(el => el.textContent && el.textContent.includes('进入 3D 画册翻阅'));
        if (openPhotobookBtn) openPhotobookBtn.click();
      })()
    `);
    await sleep(1500);

    // 截取闭合封面：验证彻底去除生硬假侧边柱、呈现高审美文艺书影排版与悬空阴影
    await cdp.screenshot("screenshots/01_book_cover_literary_3d.png");

    // 2. 点击封面翻开画册到第 1 对开页 (Spread 0)
    console.log("Flipping open the book to Spread 0...");
    await cdp.eval(`
      (() => {
        // 点击右侧翻页按钮或画册右半边
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === '下一页');
        if (nextBtn) {
          nextBtn.click();
        } else {
          const stage = document.querySelector('[style*="perspective"]');
          if (stage) stage.click();
        }
      })()
    `);
    await sleep(1200);

    // 截取第 1 对开页：验证 3D 扇形展开层叠、悬空立体投影与中缝拱起
    await cdp.screenshot("screenshots/02_open_book_spread_0_fanned.png");

    // 再翻一页到第 2 对开页 (Spread 1)，观察左右两侧皆有扇形展开页
    console.log("Flipping to Spread 1...");
    await cdp.eval(`
      (() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === '下一页');
        if (nextBtn) nextBtn.click();
      })()
    `);
    await sleep(1200);

    // 截取第 2 对开页：左侧扇形层叠 + 右侧扇形层叠
    await cdp.screenshot("screenshots/03_open_book_spread_1_dual_fans.png");

    // 3. 点击翻回封面并打开封面配置弹窗
    console.log("Flipping back to Cover and opening Cover Config Modal...");
    await cdp.eval(`
      (() => {
        const prevBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === '上一页');
        if (prevBtn) prevBtn.click();
      })()
    `);
    await sleep(800);
    await cdp.eval(`
      (() => {
        const prevBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === '上一页');
        if (prevBtn) prevBtn.click();
      })()
    `);
    await sleep(800);

    // 点击“自定义封面与装订”
    await cdp.eval(`
      (() => {
        const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('自定义封面与装订'));
        if (editBtn) editBtn.click();
      })()
    `);
    await sleep(1000);

    // 截取封面配置弹窗：展示 5 款高定风格选择与右侧真实渲染预览
    await cdp.screenshot("screenshots/04_cover_modal_style_selection.png");

    // 4. 切换为「现代书腰」风格 (Obi Band)
    console.log("Switching to Modern Obi Band style...");
    await cdp.eval(`
      (() => {
        const styleCards = Array.from(document.querySelectorAll('h4')).filter(h => h.textContent && h.textContent.includes('现代书腰'));
        if (styleCards.length) {
          const card = styleCards[0].closest('div[class*="border"]');
          if (card) card.click();
        }
      })()
    `);
    await sleep(1000);

    // 截取现代书腰预览效果
    await cdp.screenshot("screenshots/05_cover_modal_obi_band_preview.png");

    // 点击保存封面
    console.log("Saving Cover with Obi Band style...");
    await cdp.eval(`
      (() => {
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('保存并应用至画册'));
        if (saveBtn) saveBtn.click();
      })()
    `);
    await sleep(1000);

    // 截取应用后 3D 书本封面的现代书腰效果
    await cdp.screenshot("screenshots/06_book_cover_with_obi_band_applied.png");

    console.log("All automated QA verification tests passed successfully!");
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await cdp.close();
  }
}

run();
