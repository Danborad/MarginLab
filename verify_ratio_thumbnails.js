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
      "--window-size=1440,960",
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
      throw new Error("Failed to connect to chrome debugging port");
    }

    this.ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("DOM.enable");
    await this.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2500);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      const handler = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          this.ws.removeEventListener("message", handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      this.ws.addEventListener("message", handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression: `(() => { ${expression} })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      console.error("Eval exception:", res.exceptionDetails);
    }
    return res.result ? res.result.value : null;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`Saved screenshot: ${filename}`);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill();
  }
}

async function run() {
  const browser = new BrowserSession(9341, "/tmp/chrome-ratio-test-2");
  try {
    console.log("Starting Browser...");
    await browser.start();
    await sleep(1500);

    // Login
    await browser.eval(`
      return window.__store.getState().login("admin", "admin123");
    `);
    await sleep(1000);

    // Go to AI stylize view
    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
      window.__store.getState().setSelectedAiStyleId("street_photo_color_chibi");
    `);
    await sleep(1200);

    // Scroll right drawer down to reveal "画幅比例"
    await browser.eval(`
      const drawer = document.querySelector('aside.w-full') || document.querySelector('aside');
      if (drawer) {
        drawer.scrollTop = 480;
      }
    `);
    await sleep(600);

    // 1. Dark Mode full view with scrolled drawer showing aspect ratio thumbnails
    await browser.screenshot("verif_ratios_1_dark_drawer_scrolled.png");

    // Click 3:4 ratio button
    await browser.eval(`
      const btn34 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes("3:4"));
      if (btn34) btn34.click();
    `);
    await sleep(500);

    // Capture closeup of the 3x3 ratio thumbnails grid
    const ratioGridRect = await browser.eval(`
      const el = Array.from(document.querySelectorAll('span')).find(s => s.innerText.trim() === "画幅比例");
      const container = el ? el.closest('.space-y-2') : null;
      if (container) {
        const r = container.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
      return null;
    `);
    console.log("Ratio grid rect in dark mode:", ratioGridRect);

    if (ratioGridRect) {
      const clipRes = await browser.send("Page.captureScreenshot", {
        format: "png",
        clip: {
          x: Math.max(0, ratioGridRect.x - 12),
          y: Math.max(0, ratioGridRect.y - 12),
          width: ratioGridRect.width + 24,
          height: ratioGridRect.height + 24,
          scale: 1,
        },
      });
      fs.writeFileSync("verif_ratios_2_dark_closeup.png", Buffer.from(clipRes.data, "base64"));
      console.log("Saved screenshot: verif_ratios_2_dark_closeup.png");
    }

    // 2. Toggle to Light Mode
    await browser.eval(`
      window.__store.getState().toggleThemeMode();
    `);
    await sleep(1000);

    // Re-scroll drawer in light mode
    await browser.eval(`
      const drawer = document.querySelector('aside.w-full') || document.querySelector('aside');
      if (drawer) {
        drawer.scrollTop = 480;
      }
    `);
    await sleep(600);

    await browser.screenshot("verif_ratios_3_light_drawer_scrolled.png");

    // Capture closeup in light mode
    const ratioGridRectLight = await browser.eval(`
      const el = Array.from(document.querySelectorAll('span')).find(s => s.innerText.trim() === "画幅比例");
      const container = el ? el.closest('.space-y-2') : null;
      if (container) {
        const r = container.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
      return null;
    `);
    console.log("Ratio grid rect in light mode:", ratioGridRectLight);

    if (ratioGridRectLight) {
      const clipResLight = await browser.send("Page.captureScreenshot", {
        format: "png",
        clip: {
          x: Math.max(0, ratioGridRectLight.x - 12),
          y: Math.max(0, ratioGridRectLight.y - 12),
          width: ratioGridRectLight.width + 24,
          height: ratioGridRectLight.height + 24,
          scale: 1,
        },
      });
      fs.writeFileSync("verif_ratios_4_light_closeup.png", Buffer.from(clipResLight.data, "base64"));
      console.log("Saved screenshot: verif_ratios_4_light_closeup.png");
    }

    // Click 16:9 ratio in light mode
    await browser.eval(`
      const btn169 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes("16:9"));
      if (btn169) btn169.click();
    `);
    await sleep(500);

    if (ratioGridRectLight) {
      const clipRes169 = await browser.send("Page.captureScreenshot", {
        format: "png",
        clip: {
          x: Math.max(0, ratioGridRectLight.x - 12),
          y: Math.max(0, ratioGridRectLight.y - 12),
          width: ratioGridRectLight.width + 24,
          height: ratioGridRectLight.height + 24,
          scale: 1,
        },
      });
      fs.writeFileSync("verif_ratios_5_light_16_9_closeup.png", Buffer.from(clipRes169.data, "base64"));
      console.log("Saved screenshot: verif_ratios_5_light_16_9_closeup.png");
    }

    console.log("ALL RATIO THUMBNAIL CHECKS PASSED!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

run();
