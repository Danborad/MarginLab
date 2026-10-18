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
  const cdp = new CDPSession(9455, "/tmp/chrome_test_save", "1440,960", "http://127.0.0.1:3010");
  try {
    console.log("Starting Chrome...");
    await cdp.start();
    await sleep(2000);

    // 打开画册视图
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const albumBtn = btns.find(b => b.textContent && (b.textContent.includes('画册') || b.textContent.includes('进入 3D 画册翻阅')));
        if (albumBtn) albumBtn.click();
      })()
    `);
    await sleep(1500);

    // 打开编辑封面
    await cdp.eval(`
      (() => {
        const editCoverBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('自定义封面与装订'));
        if (editCoverBtn) editCoverBtn.click();
      })()
    `);
    await sleep(1000);

    // 选中现代书腰
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
    await sleep(800);

    // 点击保存并应用
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const saveBtn = btns.find(b => b.textContent && b.textContent.includes('保存并应用'));
        if (saveBtn) saveBtn.click();
      })()
    `);
    await sleep(1200);

    // 截取闭合状态下应用了现代书腰的 3D 实体书
    await cdp.screenshot("screenshots/v2_07_applied_obi_in_3d_stage.png");
    console.log("Done!");
  } finally {
    await cdp.close();
  }
}

run();
