import { spawn } from "child_process";
import fs from "fs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class BrowserSession {
  constructor(port, userDataDir, winSize) {
    this.port = port;
    this.userDataDir = userDataDir;
    this.winSize = winSize;
    this.proc = null;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
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
      `--window-size=${this.winSize}`,
      "http://localhost:3001",
    ]);

    let tab = null;
    for (let i = 0; i < 60; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length > 0) {
          tab = tabs.find((t) => t.type === "page" && t.url.includes("3001")) || tabs[0];
          if (tab && tab.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }
    if (!tab || !tab.webSocketDebuggerUrl) throw new Error("no chrome tab found");

    this.ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        cb(msg);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = this.msgId++;
      this.callbacks.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.result?.value;
  }

  async screenshot(path) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    if (res?.result?.data) {
      fs.writeFileSync(path, Buffer.from(res.result.data, "base64"));
      console.log("Saved screenshot:", path);
    }
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill();
  }
}

async function run() {
  const outDir = "screenshots/qa_comprehensive";
  fs.mkdirSync(outDir, { recursive: true });

  const session = new BrowserSession(9894, "/tmp/chrome_qa_final", "1680,1050");
  await session.start();
  console.log("Browser session started");
  await sleep(2500);

  // 1. Fresh state check
  const state1 = await session.evaluate(`
    (() => {
      const st = window.__store.getState();
      st.enterAsGuest();
      st.setActivePanel('album');
      st.setCurrentAlbumId('album_jiuzhaigou');
      st.setCurrentSpreadIndex(-1); // 从封面开始
      return {
        albumTitle: st.albums.find(a => a.id === st.currentAlbumId)?.title,
        spreadsCount: st.albums.find(a => a.id === st.currentAlbumId)?.spreads.length,
        currentSpreadIndex: st.currentSpreadIndex,
      };
    })()
  `);
  console.log("Step 1 State (Cover closed):", state1);
  await sleep(1500);
  await session.screenshot(`${outDir}/01_cover_closed.png`);

  // 2. Open book to Spread 0 (P.1 - 2)
  await session.evaluate(`
    (() => {
      window.__store.getState().setCurrentSpreadIndex(0);
    })()
  `);
  await sleep(1500);
  await session.screenshot(`${outDir}/02_spread_0_opened.png`);

  // 3. Flip to Spread 4 (P.9 - 10) which previously was blank white in user screenshot!
  await session.evaluate(`
    (() => {
      window.__store.getState().setCurrentSpreadIndex(4);
    })()
  `);
  await sleep(1500);
  await session.screenshot(`${outDir}/03_spread_4_p9_10.png`);

  // 4. Switch to Grid View (全书速览)
  await session.evaluate(`
    (() => {
      // Find button for "全书速览"
      const btns = Array.from(document.querySelectorAll('button'));
      const gridBtn = btns.find(b => b.textContent.includes('全书速览'));
      if (gridBtn) gridBtn.click();
    })()
  `);
  await sleep(1500);
  await session.screenshot(`${outDir}/04_grid_view.png`);

  // 5. Open PageConfigModal by clicking "配置左页 (P.1)" in book view
  await session.evaluate(`
    (() => {
      // Switch back to book view
      const btns = Array.from(document.querySelectorAll('button'));
      const bookBtn = btns.find(b => b.textContent.includes('对开翻书'));
      if (bookBtn) bookBtn.click();
      window.__store.getState().setCurrentSpreadIndex(0);
    })()
  `);
  await sleep(1000);

  // Click edit left page
  await session.evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const editBtn = btns.find(b => b.textContent.includes('配置左页'));
      if (editBtn) editBtn.click();
    })()
  `);
  await sleep(1200);
  await session.screenshot(`${outDir}/05_page_config_modal.png`);

  // 6. Test editing in modal: change layout to polaroid and change title
  await session.evaluate(`
    (() => {
      // Click on "版式排版" tab
      const tabs = Array.from(document.querySelectorAll('button'));
      const layoutTab = tabs.find(t => t.textContent.includes('版式排版'));
      if (layoutTab) layoutTab.click();
    })()
  `);
  await sleep(600);
  await session.evaluate(`
    (() => {
      // Select "时光拍立得"
      const cards = Array.from(document.querySelectorAll('div'));
      const polaroidCard = cards.find(c => c.textContent.includes('时光拍立得 (Polaroid)'));
      if (polaroidCard) polaroidCard.click();
    })()
  `);
  await sleep(800);
  await session.screenshot(`${outDir}/06_modal_polaroid_selected.png`);

  // Click "保存并应用"
  await session.evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent.includes('保存并应用'));
      if (saveBtn) saveBtn.click();
    })()
  `);
  await sleep(1500);
  await session.screenshot(`${outDir}/07_after_edit_applied.png`);

  await session.close();
  console.log("All tests completed!");
}

run().catch(console.error);
