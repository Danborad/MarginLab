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
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("DOM.enable");
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
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
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(path) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path, Buffer.from(res.data, "base64"));
    console.log(`Saved: ${path}`);
  }

  async mouse(type, x, y, button = "left") {
    const params = {
      type,
      x: Math.round(x),
      y: Math.round(y),
      button,
      buttons: type === "mouseReleased" ? 0 : 1,
    };
    await this.send("Input.dispatchMouseEvent", params);
  }

  async close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }
    if (this.proc) {
      try {
        this.proc.kill("SIGKILL");
      } catch (e) {}
    }
  }
}

async function run() {
  const outDir = "/tmp/book_drag_qa";
  fs.mkdirSync(outDir, { recursive: true });

  const session = new BrowserSession(9899, "/tmp/chrome_drag_session", "1440,900");
  await session.start();
  await sleep(2000);

  try {
    // 1. 打开画册在 Spread 0
    await session.evaluate(`
      (() => {
        const st = window.__store.getState();
        st.setAlbumModalOpen(true);
        st.setCurrentAlbumId('album_jiuzhaigou');
        st.setCurrentSpreadIndex(0);
      })()
    `);
    await sleep(800);
    await session.screenshot(`${outDir}/01_spread0.png`);

    const rect = await session.evaluate(`
      (() => {
        const el = document.querySelector('[style*="perspective"]');
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      })()
    `);
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;

    // 2. 在 Spread 0 上按住右页并向左拖动 180px
    console.log("Testing mouse drag forward on spread 0...");
    await session.mouse("mousePressed", cx + 120, cy);
    await sleep(40);
    for (let i = 1; i <= 8; i++) {
      await session.mouse("mouseMoved", cx + 120 - i * 22, cy);
      await sleep(25);
    }
    await session.screenshot(`${outDir}/02_drag_forward_mid.png`);

    // 松开鼠标，提交翻页
    await session.mouse("mouseReleased", cx - 60, cy);
    await sleep(1000);
    await session.screenshot(`${outDir}/03_after_drag_forward.png`);

    const idxAfterForward = await session.evaluate(`window.__store.getState().currentSpreadIndex`);
    console.log("Index after drag forward:", idxAfterForward);

    // 3. 在 Spread 1 上按住左页并向右拖动 180px
    console.log("Testing mouse drag backward on spread 1...");
    await session.mouse("mousePressed", cx - 120, cy);
    await sleep(40);
    for (let i = 1; i <= 8; i++) {
      await session.mouse("mouseMoved", cx - 120 + i * 22, cy);
      await sleep(25);
    }
    await session.screenshot(`${outDir}/04_drag_backward_mid.png`);

    // 松开鼠标，提交向后翻页
    await session.mouse("mouseReleased", cx + 60, cy);
    await sleep(1000);
    await session.screenshot(`${outDir}/05_after_drag_backward.png`);

    const idxAfterBackward = await session.evaluate(`window.__store.getState().currentSpreadIndex`);
    console.log("Index after drag backward:", idxAfterBackward);

    // 4. 小拖动回弹测试 (拖动距离不足 20px)
    console.log("Testing small drag snap back...");
    await session.mouse("mousePressed", cx + 120, cy);
    await sleep(30);
    for (let i = 1; i <= 3; i++) {
      await session.mouse("mouseMoved", cx + 120 - i * 5, cy);
      await sleep(20);
    }
    await session.mouse("mouseReleased", cx + 105, cy);
    await sleep(800);
    const idxAfterSmall = await session.evaluate(`window.__store.getState().currentSpreadIndex`);
    console.log("Index after small drag (should remain same):", idxAfterSmall);

    // 5. 测试小屏幕视口下的自适应 (800x600)
    console.log("Testing small viewport (800x600)...");
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: 800,
      height: 600,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(500);
    await session.screenshot(`${outDir}/06_small_viewport_800x600.png`);

    // 恢复正常视口
    await session.send("Emulation.clearDeviceMetricsOverride");
    await sleep(400);

    console.log("Drag and responsiveness test finished!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

run();
