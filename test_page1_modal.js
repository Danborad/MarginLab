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
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.cbs.has(m.id)) {
        const cb = this.cbs.get(m.id);
        this.cbs.delete(m.id);
        cb(m);
      }
    };
    await this.send("Page.enable");
    await this.send("Runtime.enable");
  }
  send(method, params = {}) {
    return new Promise((res) => {
      const id = this.msgId++;
      this.cbs.set(id, res);
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
  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const data = res.result?.data || res.data;
    fs.writeFileSync(filename, Buffer.from(data, "base64"));
    console.log(`Saved screenshot: ${filename}`);
  }
  async close() {
    try {
      this.ws?.close();
      this.proc?.kill("SIGKILL");
    } catch (e) {}
  }
}

async function run() {
  const session = new CDPSession(9259, "/tmp/chrome_p1", "1600,900", "http://localhost:3001");
  try {
    console.log("Starting Chrome CDP session...");
    await session.start();
    await sleep(2000);

    // 1. Enter Studio by clicking "直接体验 →"
    console.log("Entering Studio workspace...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const guestBtn = btns.find(b => b.textContent && b.textContent.includes('直接体验'));
      if (guestBtn) guestBtn.click();
    `);
    await sleep(2000);

    // 2. Open Album panel in LeftSidebar
    console.log("Opening Album panel in sidebar...");
    await session.eval(`
      const albumBtn = document.querySelector('button[title="相册"]');
      if (albumBtn) albumBtn.click();
    `);
    await sleep(1500);

    // 3. Click "配置左页 (P.1)" button
    console.log("Clicking '配置左页 (P.1)'...");
    const clicked = await session.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('配置左页'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    `);
    console.log("Clicked 配置左页:", clicked);
    await sleep(1500);

    // Take screenshot of PageConfigModal for Page 1
    await session.screenshot("screenshots/qa_page1_modal_real.png");

    // 4. Click "全屏时尚" category in modal
    console.log("Clicking '全屏时尚' in template category list...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const catBtn = btns.find(b => b.textContent && b.textContent.includes('全屏时尚'));
      if (catBtn) catBtn.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_page1_category_fullbleed.png");

    // 5. Click "Vogue Full-Bleed" template
    console.log("Selecting Vogue Full-Bleed template...");
    await session.eval(`
      const cards = Array.from(document.querySelectorAll('div'));
      const vogue = cards.find(c => c.textContent && c.textContent.includes('Vogue Full-Bleed'));
      if (vogue) vogue.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_page1_vogue_selected.png");

    // 6. Click "版式排版" tab
    console.log("Clicking '版式排版' tab...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const layoutTab = tabs.find(t => t.textContent && t.textContent.includes('版式排版'));
      if (layoutTab) layoutTab.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_page1_tab_layout.png");

    // 7. Click "保存并应用"
    console.log("Clicking '保存并应用'...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent && b.textContent.includes('保存并应用'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(1500);

    // 8. Capture updated 3D book spread
    console.log("Capturing 3D book with updated Vogue template on Page 1...");
    await session.screenshot("screenshots/qa_3d_book_with_vogue.png");

    console.log("Test finished successfully!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
