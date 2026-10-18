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
  const session = new CDPSession(9245, "/tmp/chrome_qa_edit", "1600,900", "http://localhost:3001");
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

    // 2. Click "相册" in the left sidebar icon bar
    console.log("Clicking '相册' icon button...");
    await session.eval(`
      const albumBtn = document.querySelector('button[title="相册"]');
      if (albumBtn) albumBtn.click();
    `);
    await sleep(1500);
    await session.screenshot("screenshots/qa_sidebar_album_panel.png");

    // 3. Click the edit button on Page 1 / Spread 1 in AlbumPanel
    console.log("Clicking edit button in AlbumPanel...");
    await session.eval(`
      // Find the first edit button in the spread list
      const editBtns = Array.from(document.querySelectorAll('button[title*="配置"], button[title*="编辑"]'));
      console.log('Found edit buttons:', editBtns.length);
      if (editBtns.length > 0) {
        editBtns[0].click();
      }
    `);
    await sleep(1500);
    // Take screenshot of PageConfigModal opened FROM SIDEBAR!
    await session.screenshot("screenshots/qa_modal_from_sidebar_centered.png");

    // 4. In PageConfigModal, test the "拼图模板 (47款)" tab
    console.log("Inspecting template gallery in modal...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const tplTab = tabs.find(t => t.textContent && t.textContent.includes('拼图模板'));
      if (tplTab) tplTab.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_modal_templates_tab.png");

    // Click on "Full Bleed" / "全屏时尚" filter
    console.log("Filtering by Full Bleed category...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const fullBleedBtn = btns.find(b => b.textContent && (b.textContent.includes('全屏时尚') || b.textContent.includes('Full Bleed')));
      if (fullBleedBtn) fullBleedBtn.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_modal_fullbleed_category.png");

    // Select "Vogue Full-Bleed" template
    console.log("Selecting Vogue template...");
    await session.eval(`
      const cards = Array.from(document.querySelectorAll('div'));
      const vogueCard = cards.find(c => c.textContent && c.textContent.includes('Vogue Full-Bleed'));
      if (vogueCard) vogueCard.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_modal_vogue_preview.png");

    // Click "保存并应用"
    console.log("Saving page configuration...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent && b.textContent.includes('保存并应用'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(1500);

    // 5. Open 3D Photobook Modal from Header or Stage
    console.log("Opening 3D Photobook Modal...");
    await session.eval(`
      // Look for 3D photobook open buttons
      const btns = Array.from(document.querySelectorAll('button, div'));
      const bookLaunch = btns.find(b => b.textContent && (b.textContent.includes('3D 实体书本') || b.textContent.includes('3D 实体书') || b.textContent.includes('3D 艺术画册')));
      if (bookLaunch) bookLaunch.click();
    `);
    await sleep(2500);
    await session.screenshot("screenshots/qa_3d_book_live.png");

    console.log("All tests completed successfully!");
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    await session.close();
  }
}

run();
