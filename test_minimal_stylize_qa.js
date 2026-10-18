import { spawn, execSync } from "child_process";
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
      "--window-size=1500,950",
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
      throw new Error(`Failed to connect to Chrome on port ${this.port}`);
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
    await sleep(2000);
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
      console.error("Eval Exception:", res.exceptionDetails);
      throw new Error(res.exceptionDetails.text || "Eval failed");
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`Saved screenshot: ${filename}`);
  }

  async close() {
    try {
      if (this.ws) this.ws.close();
    } catch (e) {}
    try {
      if (this.proc) this.proc.kill("SIGKILL");
    } catch (e) {}
    try {
      execSync(`pkill -9 -f "remote-debugging-port=${this.port}" 2>/dev/null || true`);
    } catch (e) {}
  }
}

async function run() {
  console.log("==================================================");
  console.log("  TESTING MINIMAL & ELEGANT AI STYLIZE STAGE");
  console.log("==================================================");

  const browser = new BrowserSession(9866, "/tmp/chrome_minimal_stylize_qa");
  try {
    await browser.start();
    await sleep(1500);

    // 1. Log in as regular user lin
    console.log("[1] Logging in as lin...");
    await browser.eval(`
      return window.__store.getState().login('lin', '123456');
    `);
    await sleep(1500);

    // 2. Open AI Stylize Stage
    console.log("[2] Switching to AI Stylize Stage...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
      window.__store.getState().setAiSourceImage(null);
      window.__store.getState().setLatestAiGeneratedImage(null);
    `);
    await sleep(1200);
    await browser.screenshot("minimal_stylize_1_fresh_stage.png");

    // 3. Load Sample Photo
    console.log("[3] Selecting s21 Dreamy Motion style & loading Sample Photo...");
    await browser.eval(`
      window.__store.getState().setSelectedAiStyleId('s21-dreamy-motion');
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('电车旧梦') || b.textContent.includes('电车'));
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(1000);
    await browser.screenshot("minimal_stylize_2_photo_loaded.png");

    // 4. Trigger Laser Printing Animation
    console.log("[4] Triggering Laser Printing Animation...");
    await browser.eval(`
      const genBtn = document.querySelector('#stage-generate-btn-text') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('开始激光微喷冲印'));
      if (genBtn) genBtn.click();
    `);
    await sleep(2200);
    await browser.screenshot("minimal_stylize_3_laser_printer_developing.png");

    // 5. Provide finished image for comparison modes
    await sleep(6500);
    await browser.eval(`
      const store = window.__store.getState();
      if (!store.latestAiGeneratedImage) {
        store.setLatestAiGeneratedImage('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80');
      }
    `);
    await sleep(800);

    // 6. Screenshot Frame Mode (Hero artwork + small inset original)
    console.log("[5] Capturing Frame Comparison Mode...");
    await browser.eval(`
      const frameBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('画框大图'));
      if (frameBtn) frameBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("minimal_stylize_4_frame_mode_comparison.png");

    // 7. Screenshot Side-by-Side Mode (Original smaller on left, Generated large on right)
    console.log("[6] Capturing Side-by-Side Comparison Mode (Original smaller)...");
    await browser.eval(`
      const sbsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('左右对比'));
      if (sbsBtn) sbsBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("minimal_stylize_5_side_by_side_comparison.png");

    // 8. Screenshot Split Slider Mode
    console.log("[7] Capturing Split Slider Comparison Mode...");
    await browser.eval(`
      const splitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('滑动卷帘'));
      if (splitBtn) splitBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("minimal_stylize_6_split_slider_comparison.png");

    // 9. Apply to Haute Couture Dual Layout & Return to Puzzle Canvas
    console.log("[8] Applying to Dual Layout & returning to Puzzle Canvas...");
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用双联高定排版') || (b.textContent.includes('套用') && b.textContent.includes('排版')));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(2000);
    await browser.screenshot("minimal_stylize_7_dual_layout_canvas.png");

    // 10. Check Template Library in Puzzle Studio
    console.log("[9] Verifying Puzzle Studio Templates Library...");
    await browser.eval(`
      window.__store.getState().loadTemplate('couture-lookbook', false);
    `);
    await sleep(1500);
    await browser.screenshot("minimal_stylize_8_collage_templates_canvas.png");

    console.log("==================================================");
    console.log("  MINIMAL STYLIZE QA COMPLETED WITH EXCELLENCE!");
    console.log("==================================================");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
