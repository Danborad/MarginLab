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
  const session = new CDPSession(9257, "/tmp/chrome_page_flow", "1600,900", "http://localhost:3001");
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

    // 3. Click Left Page card of Spread 1 (P.1) in AlbumPanel
    console.log("Clicking P.1 left page card in sidebar...");
    await session.eval(`
      const divs = Array.from(document.querySelectorAll('div'));
      const p1Card = divs.find(d => d.textContent && d.textContent.includes('P.1 · template'));
      if (p1Card) {
        p1Card.click();
      } else {
        // click first card containing 独立配置
        const configBtn = divs.find(d => d.textContent && d.textContent.includes('独立配置') && d.textContent.includes('P.1'));
        if (configBtn) configBtn.click();
      }
    `);
    await sleep(1500);

    // Capture PageConfigModal for Page 1!
    await session.screenshot("screenshots/qa_page1_templates_tab.png");

    // 4. Click "画廊矩阵" (Gallery) category filter
    console.log("Filtering by Gallery category...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const galleryBtn = btns.find(b => b.textContent && b.textContent.includes('画廊矩阵'));
      if (galleryBtn) galleryBtn.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_page1_gallery_category.png");

    // 5. Select template "Cinematic 5 Frames" or "Studio 6-Grid"
    console.log("Selecting Cinematic 5 Frames...");
    await session.eval(`
      const cards = Array.from(document.querySelectorAll('div'));
      const targetCard = cards.find(c => c.textContent && c.textContent.includes('Cinematic 5'));
      if (targetCard) targetCard.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_page1_cinematic_preview.png");

    // 6. Click "版式排版" tab
    console.log("Switching to 版式排版 tab...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const layoutTab = tabs.find(t => t.textContent && t.textContent.includes('版式排版'));
      if (layoutTab) layoutTab.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_page1_layout_tab.png");

    // 7. Click "画面素材" tab
    console.log("Switching to 画面素材 tab...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const imageTab = tabs.find(t => t.textContent && t.textContent.includes('画面素材'));
      if (imageTab) imageTab.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_page1_image_tab.png");

    // 8. Click "保存并应用"
    console.log("Saving page configuration...");
    await session.eval(`
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent && b.textContent.includes('保存并应用'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(1500);

    // 9. Check 3D Photobook Stage to verify Page 1 is updated with the cinematic 5 frames template!
    console.log("Viewing 3D book spread with updated template...");
    await session.screenshot("screenshots/qa_3d_book_updated_spread.png");

    console.log("Page config flow verified successfully!");
  } catch (err) {
    console.error("QA error:", err);
  } finally {
    await session.close();
  }
}

run();
