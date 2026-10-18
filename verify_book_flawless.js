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
    console.log(`Saved screenshot: ${path}`);
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

async function runTest() {
  const outDir = "/tmp/book_flawless_qa";
  fs.mkdirSync(outDir, { recursive: true });

  const session = new BrowserSession(9890, "/tmp/chrome_qa_flawless", "1680,1050");
  await session.start();
  console.log("Browser session started");

  try {
    await sleep(2500);

    // 确保打开画册弹窗，并切换至九寨沟旅记相册
    const initRes = await session.evaluate(`
      (() => {
        const st = window.__store.getState();
        st.setAlbumModalOpen(true);
        st.setCurrentAlbumId('album_jiuzhaigou');
        st.setCurrentSpreadIndex(-1); // 从封面开始
        return {
          currentAlbumId: st.currentAlbumId,
          currentSpreadIndex: st.currentSpreadIndex,
          modalOpen: st.albumModalOpen,
          albumsCount: st.albums.length
        };
      })()
    `);
    console.log("Initialized album state:", initRes);
    await sleep(1000);

    // 1. 闭合封面截图
    await session.screenshot(`${outDir}/01_cover_closed.png`);

    // 获取舞台中心坐标
    const rect = await session.evaluate(`
      (() => {
        const el = document.querySelector('[style*="perspective"]');
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      })()
    `);
    console.log("Stage rect:", rect);
    const cx = rect ? rect.x + rect.width / 2 : 840;
    const cy = rect ? rect.y + rect.height / 2 : 525;

    // 2. 封面拖动中途 (向左拖 140px，观察平滑 3D 旋转开合与阴影)
    await session.mouse("mousePressed", cx + 80, cy);
    await sleep(40);
    for (let i = 1; i <= 8; i++) {
      await session.mouse("mouseMoved", cx + 80 - i * 20, cy);
      await sleep(25);
    }
    await sleep(200);
    await session.screenshot(`${outDir}/02_cover_drag_midway.png`);

    // 3. 继续拖动松开，完成封面翻开 -> 进入 Spread 1
    for (let i = 9; i <= 14; i++) {
      await session.mouse("mouseMoved", cx + 80 - i * 20, cy);
      await sleep(20);
    }
    await session.mouse("mouseReleased", cx - 200, cy);
    await sleep(1000);
    await session.screenshot(`${outDir}/03_spread_1_opened.png`);

    const pageInfo1 = await session.evaluate(`
      (() => {
        const st = window.__store.getState();
        return { index: st.currentSpreadIndex };
      })()
    `);
    console.log("After cover open, spread index:", pageInfo1);

    // 4. 点击下一页按钮翻页 -> Spread 2
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="下一页"]');
        if (btn) btn.click();
      })()
    `);
    // 抓取翻页中途帧 (约 220ms 后)
    await sleep(220);
    await session.screenshot(`${outDir}/04_spread_turn_forward_mid.png`);
    await sleep(700);
    await session.screenshot(`${outDir}/05_spread_2_opened.png`);

    // 5. 点击上一页按钮后退翻页 -> 回到 Spread 1
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="上一页"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(220);
    await session.screenshot(`${outDir}/06_spread_turn_backward_mid.png`);
    await sleep(700);
    await session.screenshot(`${outDir}/07_spread_1_returned.png`);

    // 6. 从 Spread 1 点击上一页 -> 合上封面
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="上一页"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(240);
    await session.screenshot(`${outDir}/08_cover_closing_mid.png`);
    await sleep(700);
    await session.screenshot(`${outDir}/09_cover_closed_smoothly.png`);

    // 7. 直接跳到末页，测试封底闭合
    await session.evaluate(`
      (() => {
        const st = window.__store.getState();
        const alb = st.albums.find(a => a.id === st.currentAlbumId);
        st.setCurrentSpreadIndex(alb.spreads.length - 1);
      })()
    `);
    await sleep(600);
    await session.screenshot(`${outDir}/10_last_spread.png`);

    // 点击下一页 -> 闭合到封底
    await session.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="下一页"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(240);
    await session.screenshot(`${outDir}/11_backcover_closing_mid.png`);
    await sleep(700);
    await session.screenshot(`${outDir}/12_backcover_closed.png`);

    // 8. 切换浅色背景桌面
    await session.evaluate(`
      (() => {
        const st = window.__store.getState();
        st.updateAlbumTheme('album_jiuzhaigou', 'neutral');
      })()
    `);
    await sleep(600);
    await session.screenshot(`${outDir}/13_light_theme_backcover.png`);

    // 9. 打开全书速览网格
    await session.evaluate(`
      (() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('全书速览'));
        if (btn) btn.click();
      })()
    `);
    await sleep(600);
    await session.screenshot(`${outDir}/14_grid_view.png`);

    console.log("All visual QA steps completed successfully!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

runTest();
