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
    if (!tab || !tab.webSocketDebuggerUrl) throw new Error("no chrome tab");

    this.ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (this.callbacks.has(msg.id)) {
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
      throw new Error("eval error: " + JSON.stringify(res.exceptionDetails.exception));
    }
    return res.result ? res.result.value : null;
  }

  async screenshot(filepath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filepath, Buffer.from(res.data, "base64"));
  }

  async mouse(type, x, y, extra = {}) {
    await this.send("Input.dispatchMouseEvent", {
      type,
      x,
      y,
      button: "left",
      clickCount: type === "mouseMoved" ? 0 : 1,
      buttons: type === "mouseReleased" ? 0 : 1,
      ...extra,
    });
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill("SIGKILL");
  }
}

async function enterAlbum(session) {
  return session.evaluate(`
    (() => {
      if (!window.__store) return 'no-store';
      const st = window.__store.getState();
      st.setCurrentView('editor');
      st.setActivePanel('album');
      return 'ok';
    })()
  `);
}

const PROBE = `
  (() => {
    const stage = document.querySelector('div.relative.flex-1.w-full.flex.items-center.justify-center.overflow-hidden');
    const persp = document.querySelector('[style*="perspective"]');
    const box = persp ? persp.parentElement : null;
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom), right: Math.round(b.right) };
    };
    return JSON.stringify({ stage: r(stage), box: r(box), win: { w: innerWidth, h: innerHeight } });
  })()
`;

async function run(port, winSize, tag, outDir) {
  const session = new BrowserSession(port, `/tmp/chrome_book_v2_${tag}`, winSize);
  const out = [];
  try {
    await session.start();
    await sleep(2500);
    const entered = await enterAlbum(session);
    console.log(`[${tag}] enter album:`, entered);
    await sleep(1800);

    // 封面
    await session.screenshot(`${outDir}/${tag}_00_cover.png`);
    console.log(`[${tag}] probe cover:`, await session.evaluate(PROBE));

    // 翻开 → 第一对开页
    await session.evaluate(`document.querySelector('button[title="下一页"]').click()`);
    await sleep(1100);
    await session.screenshot(`${outDir}/${tag}_01_spread1.png`);
    console.log(`[${tag}] probe spread1:`, await session.evaluate(PROBE));

    // 再翻一页
    await session.evaluate(`document.querySelector('button[title="下一页"]').click()`);
    await sleep(1100);
    await session.screenshot(`${outDir}/${tag}_02_spread2.png`);

    // 拖动翻页测试：按住右页向左拖，中途截图
    const geo = JSON.parse(await session.evaluate(PROBE));
    const cx = Math.round(geo.stage.x + geo.stage.w / 2) + 120;
    const cy = Math.round(geo.stage.y + geo.stage.h / 2);
    console.log(`[${tag}] drag from (${cx},${cy})`);

    await session.mouse("mousePressed", cx, cy);
    await sleep(60);
    for (let i = 1; i <= 10; i += 1) {
      await session.mouse("mouseMoved", cx - i * 18, cy);
      await sleep(28);
    }
    await sleep(80);
    await session.screenshot(`${outDir}/${tag}_03_drag_mid.png`);
    const midAngle = await session.evaluate(`
      (() => {
        const el = document.querySelector('[style*="rotateY"][style*="will-change"]');
        return el ? el.style.transform : 'none';
      })()
    `);
    console.log(`[${tag}] mid-drag leaf transform:`, midAngle);

    // 继续拖动到超过阈值再松手 → 应该完成翻页
    for (let i = 11; i <= 20; i += 1) {
      await session.mouse("mouseMoved", cx - i * 18, cy);
      await sleep(22);
    }
    await session.mouse("mouseReleased", cx - 360, cy);
    await sleep(1200);
    await session.screenshot(`${outDir}/${tag}_04_after_drag_commit.png`);
    const infoAfterDrag = await session.evaluate(`
      (() => {
        const el = [...document.querySelectorAll('span')].find(s => /第 \\d+ - \\d+ 页|画册封面|画册封底/.test(s.textContent || ''));
        return el ? el.textContent.trim() : 'unknown';
      })()
    `);
    console.log(`[${tag}] page indicator after drag-commit:`, infoAfterDrag);

    // 小位移拖动 → 应回弹，不翻页
    await session.mouse("mousePressed", cx, cy);
    await sleep(50);
    for (let i = 1; i <= 5; i += 1) {
      await session.mouse("mouseMoved", cx - i * 8, cy);
      await sleep(25);
    }
    await session.mouse("mouseReleased", cx - 40, cy);
    await sleep(900);
    await session.screenshot(`${outDir}/${tag}_05_after_small_drag.png`);
    const infoAfterSmall = await session.evaluate(`
      (() => {
        const el = [...document.querySelectorAll('span')].find(s => /第 \\d+ - \\d+ 页|画册封面|画册封底/.test(s.textContent || ''));
        return el ? el.textContent.trim() : 'unknown';
      })()
    `);
    console.log(`[${tag}] page indicator after small drag (should be unchanged):`, infoAfterSmall);


    // 回到封面
    console.log(`[${tag}] back to cover...`);
    await session.evaluate(`
      (() => {
        window.__store.getState().setCurrentSpreadIndex(-1);
        return true;
      })()
    `);
    await sleep(800);
    await session.screenshot(`${outDir}/${tag}_08_cover_closed.png`);

    // 封面拖动翻开
    await session.mouse("mousePressed", cx, cy);
    await sleep(50);
    for (let i = 1; i <= 6; i += 1) {
      await session.mouse("mouseMoved", cx - i * 22, cy);
      await sleep(26);
    }
    await session.screenshot(`${outDir}/${tag}_09_cover_drag_mid.png`);
    for (let i = 7; i <= 14; i += 1) {
      await session.mouse("mouseMoved", cx - i * 22, cy);
      await sleep(20);
    }
    await session.mouse("mouseReleased", cx - 320, cy);
    await sleep(1200);
    await session.screenshot(`${outDir}/${tag}_10_after_cover_open.png`);
    const infoAfterCoverDrag = await session.evaluate(`
      (() => {
        const el = [...document.querySelectorAll('span')].find(s => /第 \\d+ - \\d+ 页|画册封面|画册封底/.test(s.textContent || ''));
        return el ? el.textContent.trim() : 'unknown';
      })()
    `);
    console.log(`[${tag}] after cover drag-open ->`, infoAfterCoverDrag);

    // 切换浅色桌面，检查对比度
    await session.evaluate(`
      (() => {
        const st = window.__store.getState();
        const alb = st.albums.find(a => a.id === st.currentAlbumId) || st.albums[0];
        st.updateAlbumTheme(alb.id, 'neutral');
        return alb.id;
      })()
    `);
    await sleep(700);
    await session.screenshot(`${outDir}/${tag}_06_light_desk.png`);

    // 空态：回到深色 + 全书速览
    await session.evaluate(`
      (() => {
        const st = window.__store.getState();
        const alb = st.albums.find(a => a.id === st.currentAlbumId) || st.albums[0];
        st.updateAlbumTheme(alb.id, 'indigo');
        return true;
      })()
    `);
    await sleep(400);
    await session.evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('全书速览'))?.click()`);
    await sleep(700);
    await session.screenshot(`${outDir}/${tag}_07_grid.png`);

    console.log(`[${tag}] DONE`);
  } catch (err) {
    console.error(`[${tag}] FAILED:`, err);
  } finally {
    await session.close();
  }
  return out;
}

async function main() {
  const outDir = "/tmp/book_v2";
  fs.mkdirSync(outDir, { recursive: true });
  await run(9881, "1800,1100", "big", outDir);
  await run(9882, "1440,820", "small", outDir);
  console.log("all done");
}

main();
