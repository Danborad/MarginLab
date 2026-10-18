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
  async waitFor(expr, timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const val = await this.eval(expr);
      if (val) return val;
      await sleep(250);
    }
    throw new Error(`Timeout waiting for expression: ${expr}`);
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
  const session = new CDPSession(9265, "/tmp/chrome_robust", "1600,900", "http://localhost:3001");
  try {
    console.log("Starting Chrome CDP session...");
    await session.start();

    // 1. Wait for landing page to load and click directly into 3D book modal or studio
    console.log("Waiting for app to load...");
    await session.waitFor(`document.readyState === 'complete' && !!document.querySelector('button')`);

    // Click "沉浸式翻阅《九寨沟旅记》画册" or "直接体验 →"
    console.log("Entering 3D Book...");
    await session.eval(`
      const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && (btn.textContent.includes('沉浸式翻阅') || btn.textContent.includes('3D 艺术画册')));
      if (b) b.click();
      else {
        const guest = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.includes('直接体验'));
        if (guest) guest.click();
      }
    `);

    // Wait for 3D Book stage to appear
    console.log("Waiting for 3D book stage...");
    await session.waitFor(`
      !!document.querySelector('button[title*="全屏翻阅"], .perspective-container, [data-testid="book-container"]') ||
      Array.from(document.querySelectorAll('button')).some(b => b.textContent && b.textContent.includes('对开翻书'))
    `);
    await sleep(1500);

    // Capture initial 3D book spread
    await session.screenshot("screenshots/qa_robust_spread1.png");

    // Click "配置左页 (P.1)"
    console.log("Opening PageConfigModal for Page 1...");
    await session.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('配置左页'));
      if (btn) btn.click();
    `);

    // Wait for PageConfigModal to open
    await session.waitFor(`
      Array.from(document.querySelectorAll('div')).some(d => d.textContent && d.textContent.includes('独立配置第 1 页'))
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_robust_page1_modal.png");

    // Click "全屏时尚" category in modal
    console.log("Clicking '全屏时尚' category...");
    await session.eval(`
      const cat = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('全屏时尚'));
      if (cat) cat.click();
    `);
    await sleep(800);
    await session.screenshot("screenshots/qa_robust_category_fullbleed.png");

    // Select "Vogue Full-Bleed" template
    console.log("Selecting Vogue Full-Bleed template...");
    await session.eval(`
      const cards = Array.from(document.querySelectorAll('div'));
      const vogue = cards.find(c => c.textContent && c.textContent.includes('Vogue Full-Bleed'));
      if (vogue) vogue.click();
    `);
    await sleep(1000);
    await session.screenshot("screenshots/qa_robust_vogue_selected.png");

    // Click "版式排版" tab
    console.log("Clicking '版式排版' tab...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const layoutTab = tabs.find(t => t.textContent && t.textContent.includes('版式排版'));
      if (layoutTab) layoutTab.click();
    `);
    await sleep(800);
    await session.screenshot("screenshots/qa_robust_tab_layout.png");

    // Click "画面素材" tab
    console.log("Clicking '画面素材' tab...");
    await session.eval(`
      const tabs = Array.from(document.querySelectorAll('button'));
      const imgTab = tabs.find(t => t.textContent && t.textContent.includes('画面素材'));
      if (imgTab) imgTab.click();
    `);
    await sleep(800);
    await session.screenshot("screenshots/qa_robust_tab_image.png");

    // Click "保存并应用"
    console.log("Saving page config...");
    await session.eval(`
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('保存并应用'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(1500);

    // Capture updated 3D book spread with Vogue template on left!
    console.log("Capturing updated 3D book with Vogue template on Page 1...");
    await session.screenshot("screenshots/qa_robust_spread1_updated.png");

    // Click "全书速览" to verify the overview grid has updated and has clean high-res templates
    console.log("Switching to 全书速览...");
    await session.eval(`
      const overviewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('全书速览'));
      if (overviewBtn) overviewBtn.click();
    `);
    await sleep(1500);
    await session.screenshot("screenshots/qa_robust_all_spreads_overview.png");

    console.log("Robust verification test completed successfully!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
