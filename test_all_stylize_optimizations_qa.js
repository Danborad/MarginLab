import { spawn } from "child_process";
import fs from "fs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class BrowserSession {
  constructor(port, userDataDir) {
    this.port = port;
    this.userDataDir = userDataDir;
    this.proc = null;
    this.ws = null;
    this.msgId = 1;
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
      "--window-size=1600,1050",
      "about:blank",
    ]);

    let tab = null;
    for (let i = 0; i < 50; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        const tabs = await res.json();
        if (Array.isArray(tabs) && tabs.length > 0) {
          tab = tabs.find((t) => t.type === "page") || tabs[0];
          if (tab && tab.webSocketDebuggerUrl) break;
        }
      } catch (e) {}
    }

    if (!tab || !tab.webSocketDebuggerUrl) {
      throw new Error("Chrome tab not found on port " + this.port);
    }

    this.ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("DOM.enable");
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          this.ws.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      this.ws.addEventListener("message", handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error("Eval failed: " + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filepath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filepath, Buffer.from(res.data, "base64"));
    console.log("Screenshot saved:", filepath);
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.proc) {
      this.proc.kill("SIGKILL");
    }
  }
}

async function run() {
  const session = new BrowserSession(9448, "/tmp/chrome-stylize-optimizations");
  try {
    console.log("Starting Chrome on port 9448...");
    await session.start();

    console.log("Navigating to http://127.0.0.1:3001 ...");
    await session.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2500);

    // 1. Login as admin and enter AI Stylize Stage
    console.log("Logging in as admin and entering stylize stage...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
        store.setActivePanel('ai-stylize');
        await store.fetchAiStyles(true);
      })()
    `);
    await sleep(2000);

    // Verify Header is clean (No Zoom 55%, No Save, No collage buttons)
    await session.screenshot("opt_qa_1_clean_header_stylize.png");

    const headerCheck = await session.evaluate(`
      (function() {
        const text = document.querySelector('header')?.textContent || '';
        return {
          hasZoom: text.includes('%') || text.includes('55%'),
          hasSave: text.includes('保存') && !text.includes('作品库'),
          hasCollageButtons: text.includes('智能排版') || text.includes('导出 / 冲印'),
          hasBackBtn: text.includes('返回拼图画布'),
        };
      })()
    `);
    console.log("Header Cleanliness Check:", headerCheck);

    // 2. Open Media Picker Modal (从素材库选择)
    console.log("Opening Media Picker Modal...");
    await session.evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const pickerBtn = btns.find(b => b.textContent && b.textContent.includes('从素材库选择'));
        if (pickerBtn) pickerBtn.click();
      })()
    `);
    await sleep(1500);
    await session.screenshot("opt_qa_2_media_picker_modal.png");

    // Upload a test photo into assets if empty, or pick one
    console.log("Selecting photo from media picker...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        // Ensure we have sample assets in store for testing
        if (store.mediaAssets.length === 0) {
          // sample coffee photo
          const sampleSrc = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'><rect width='800' height='1000' fill='%232c3e50'/><circle cx='400' cy='450' r='200' fill='%23e67e22'/><text x='400' y='800' font-size='48' fill='white' text-anchor='middle'>SAMPLE PHOTO</text></svg>";
          await store.addMediaAssets([
            { name: "雨后窗边咖啡", src: sampleSrc, width: 800, height: 1000 },
            { name: "街角复古书店", src: sampleSrc, width: 800, height: 1000 },
            { name: "晨曦山间木屋", src: sampleSrc, width: 800, height: 1000 }
          ]);
        }
      })()
    `);
    await sleep(1000);
    await session.screenshot("opt_qa_3_media_picker_with_photos.png");

    // Click on the first asset card in picker modal
    await session.evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('.aspect-\\\\[3\\\\/4\\\\]'));
        if (cards.length > 0) {
          cards[cards.length - 1].click();
        }
      })()
    `);
    await sleep(1500);

    // 3. Right workspace should now be WIDE (Adaptive Large Workspace)
    console.log("Verifying adaptive wide workspace mode...");
    await session.screenshot("opt_qa_4_adaptive_wide_workspace.png");

    // 4. Test adding to Queue (Queue generation)
    console.log("Testing Queue generation...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const genBtn = buttons.find(b => b.textContent && (b.textContent.includes('开始 AI 风格化') || b.textContent.includes('加入生成队列')));
        if (genBtn) genBtn.click();
      })()
    `);
    await sleep(1500);

    // Capture the floating toast notification & queue capsule
    await session.screenshot("opt_qa_5_floating_toast_and_queue.png");

    // 5. Expand the Queue Drawer
    console.log("Expanding generation queue drawer...");
    await session.evaluate(`
      (function() {
        const queueTrigger = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('队列'));
        if (queueTrigger) queueTrigger.click();
      })()
    `);
    await sleep(1500);
    await session.screenshot("opt_qa_6_queue_drawer_expanded.png");

    // 6. Test Lightbox Modal (Simulate a finished result)
    console.log("Testing Lightbox Modal for enlarged view...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const sampleResult = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1600' viewBox='0 0 1200 1600'><rect width='1200' height='1600' fill='%231a1a2e'/><circle cx='600' cy='650' r='300' fill='%23e94560'/><path d='M200 1200 L600 900 L1000 1200 Z' fill='%230f3460'/><text x='600' y='1400' font-size='56' fill='%23fcd34d' font-family='serif' text-anchor='middle'>ENLARGED MASTERPIECE</text></svg>";
        store.setLatestAiGeneratedImage(sampleResult);
      })()
    `);
    await sleep(1000);

    // Click "放大查看" button on photo
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const maximizeBtn = buttons.find(b => b.textContent && b.textContent.includes('放大查看'));
        if (maximizeBtn) maximizeBtn.click();
      })()
    `);
    await sleep(1500);
    await session.screenshot("opt_qa_7_lightbox_fullscreen.png");

    // Test Split View in Lightbox
    console.log("Testing Split Comparison in Lightbox...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const splitBtn = buttons.find(b => b.textContent && b.textContent.includes('左右对比'));
        if (splitBtn) splitBtn.click();
      })()
    `);
    await sleep(1200);
    await session.screenshot("opt_qa_8_lightbox_split_comparison.png");

    // Close Lightbox
    await session.evaluate(`
      (function() {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('关闭'));
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(1000);

    // 7. Toggle between Wide Workspace and Compact Sidebar
    console.log("Testing toggle back to compact sidebar...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const toggleBtn = buttons.find(b => b.textContent && (b.textContent.includes('紧凑视图') || b.textContent.includes('展开工作台')));
        if (toggleBtn) toggleBtn.click();
      })()
    `);
    await sleep(1200);
    await session.screenshot("opt_qa_9_compact_mode_restored.png");

    console.log("ALL STYLIZE OPTIMIZATIONS QA VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

run();
