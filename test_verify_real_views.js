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
  const cdp = new CDPSession(9444, "/tmp/chrome_album_verify_real", "1440,960", "http://127.0.0.1:3010");
  try {
    console.log("Starting Chrome session...");
    await cdp.start();
    await sleep(2000);

    // 1. 清理旧缓存并强制刷新
    console.log("Resetting localStorage to load fresh v8 album models...");
    await cdp.eval(`
      (() => {
        localStorage.clear();
        location.reload();
      })()
    `);
    await sleep(2500);

    // 2. 打开画册视图
    console.log("Opening Photobook view...");
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const albumBtn = btns.find(b => b.textContent && (b.textContent.includes('画册') || b.textContent.includes('进入 3D 画册翻阅')));
        if (albumBtn) albumBtn.click();
      })()
    `);
    await sleep(1500);

    // 3. 截取闭合封面 (Cover View, index = -1)
    console.log("Capturing 3D Book Cover View...");
    await cdp.screenshot("screenshots/v2_01_closed_cover_literary.png");

    // 4. 翻开画册至第 1 对开页 (Spread 0, index = 0)
    console.log("Navigating to Spread 0...");
    await cdp.eval(`
      (() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === '下一页');
        if (nextBtn) nextBtn.click();
      })()
    `);
    await sleep(1200);
    await cdp.screenshot("screenshots/v2_02_open_spread_0_fanned_right.png");

    // 5. 翻开画册至第 3 对开页 (Spread 2, index = 2)
    console.log("Navigating to Spread 2...");
    await cdp.eval(`
      (() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === '下一页');
        if (nextBtn) nextBtn.click();
      })()
    `);
    await sleep(1200);
    await cdp.eval(`
      (() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === '下一页');
        if (nextBtn) nextBtn.click();
      })()
    `);
    await sleep(1200);
    await cdp.screenshot("screenshots/v2_03_open_spread_2_dual_fanned.png");

    // 6. 翻回封面并打开封面定制弹窗
    console.log("Flipping back to cover...");
    for (let i = 0; i < 4; i++) {
      await cdp.eval(`
        (() => {
          const prevBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === '上一页');
          if (prevBtn && !prevBtn.disabled) prevBtn.click();
        })()
      `);
      await sleep(650);
    }

    console.log("Opening Cover Config Modal...");
    await cdp.eval(`
      (() => {
        const editCoverBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('自定义封面与装订'));
        if (editCoverBtn) editCoverBtn.click();
      })()
    `);
    await sleep(1200);
    await cdp.screenshot("screenshots/v2_04_cover_config_modal.png");

    // 7. 切换为「现代书腰」风格
    console.log("Selecting Modern Obi Band style...");
    await cdp.eval(`
      (() => {
        const headings = Array.from(document.querySelectorAll('h4'));
        const obiH4 = headings.find(h => h.textContent && h.textContent.includes('现代书腰'));
        if (obiH4) {
          const card = obiH4.closest('div[class*="border"]');
          if (card) card.click();
        }
      })()
    `);
    await sleep(1000);
    await cdp.screenshot("screenshots/v2_05_obi_band_selected_preview.png");

    // 8. 保存并应用至画册
    console.log("Saving Cover style...");
    await cdp.eval(`
      (() => {
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('保存并应用至画册'));
        if (saveBtn) saveBtn.click();
      })()
    `);
    await sleep(1200);

    // 9. 截取更新后的 3D 封面效果
    await cdp.screenshot("screenshots/v2_06_applied_3d_obi_cover.png");

    console.log("Verification finished successfully!");
  } catch (e) {
    console.error("Test error:", e);
  } finally {
    await cdp.close();
  }
}

run();
