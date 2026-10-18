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
    await this.send("DOM.enable");
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
    return res.result?.value;
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
  const session = new CDPSession(9244, "/tmp/chrome_qa_album", "1600,900", "http://localhost:3001");
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
      const btns = Array.from(document.querySelectorAll('button'));
      const albumTab = btns.find(b => b.title === '相册' || (b.textContent && b.textContent.includes('相册')));
      if (albumTab) albumTab.click();
    `);
    await sleep(1500);

    // Click "全屏翻阅 3D 实体书" or open album modal
    console.log("Opening 3D Photobook Modal...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const fullBtn = btns.find(b => b.textContent && (b.textContent.includes('全屏翻阅') || b.textContent.includes('翻阅画册') || b.textContent.includes('3D 实体书')));
      if (fullBtn) fullBtn.click();
    `);
    await sleep(2000);

    // Click "全书速览" button inside the photobook stage
    console.log("Switching to 全书速览...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const overviewBtn = btns.find(b => b.textContent && b.textContent.includes('全书速览'));
      if (overviewBtn) overviewBtn.click();
    `);
    await sleep(1500);
    await session.screenshot("screenshots/qa_all_spreads_overview.png");

    // Click to edit page 1 (left of first spread)
    console.log("Opening PageConfigModal for Page 1...");
    await session.eval(`
      const editBtns = Array.from(document.querySelectorAll('button[title*="编辑左页"]'));
      if (editBtns.length > 0) {
        editBtns[0].click();
      } else {
        const sbEdit = Array.from(document.querySelectorAll('button[title*="配置"]'));
        if (sbEdit.length > 0) sbEdit[0].click();
      }
    `);
    await sleep(1500);

    // Capture PageConfigModal - verify it is centered and NOT squashed in sidebar!
    await session.screenshot("screenshots/qa_page_config_modal_centered.png");

    // Click "版式排版" tab
    console.log("Testing 版式排版 tab...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const layoutTab = tabs.find(t => t.textContent && t.textContent.includes('版式排版'));
      if (layoutTab) layoutTab.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_modal_layout_tab.png");

    // Click "画面素材" tab
    console.log("Testing 画面素材 tab...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const imageTab = tabs.find(t => t.textContent && t.textContent.includes('画面素材'));
      if (imageTab) imageTab.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_modal_image_tab.png");

    // Switch back to "拼图模板 (47款)" tab and select Summer Recap template
    console.log("Testing template selection in modal...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const tplTab = tabs.find(t => t.textContent && t.textContent.includes('拼图模板'));
      if (tplTab) tplTab.click();
    `);
    await sleep(1000);

    await session.eval(`
      const cards = Array.from(document.querySelectorAll('div'));
      const summerCard = cards.find(c => c.textContent && c.textContent.includes('Summer Recap'));
      if (summerCard) summerCard.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_modal_summer_selected.png");

    // Click "保存并应用"
    console.log("Saving page configuration...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent && b.textContent.includes('保存并应用'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(1500);

    // Switch to "对开翻书" mode
    console.log("Switching to 3D book mode...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const bookBtn = btns.find(b => b.textContent && b.textContent.includes('对开翻书'));
      if (bookBtn) bookBtn.click();
    `);
    await sleep(2000);
    await session.screenshot("screenshots/qa_3d_book_spread_1.png");

    // Click next page to flip to Spread 2
    console.log("Flipping to Spread 2...");
    await session.eval(`
      // click right page
      const bookSide = document.querySelector('[data-testid="right-page"], .perspective-container');
      const allDivs = Array.from(document.querySelectorAll('div'));
      const rightLeaf = allDivs.find(d => d.style && d.style.transformOrigin && d.style.transformOrigin.includes('left'));
      if (rightLeaf) rightLeaf.click();
    `);
    await sleep(2500);
    await session.screenshot("screenshots/qa_3d_book_spread_2.png");

    console.log("All QA steps completed successfully!");
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    await session.close();
  }
}

run();
