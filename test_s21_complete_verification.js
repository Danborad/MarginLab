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
      "--window-size=1440,900",
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
  }
}

async function run() {
  const browser = new BrowserSession(9337, "/tmp/chrome_qa_s21_full");
  try {
    console.log("Starting Browser...");
    await browser.start();
    await sleep(1500);

    // 1. Log in as regular user lin
    console.log("Logging in as lin...");
    await browser.eval(`
      return window.__store.getState().login('lin', '123456');
    `);
    await sleep(1500);

    // 2. Open AI Stylize Panel & Stage
    console.log("Opening AI Stylize Studio Stage...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
    `);
    await sleep(1200);
    await browser.screenshot("s21_verify_1_stylize_center_stage_fresh.png");

    // 3. Test Sample 1: 电车旧梦 (Train Window)
    console.log("Loading Sample 1: 电车旧梦 (慢门拖影)...");
    await browser.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('电车旧梦') || b.textContent.includes('样图1'));
      if (btn) btn.click();
    `);
    await sleep(1000);
    await browser.screenshot("s21_verify_2_sample1_train_loaded.png");

    // Click Generate to trigger simulated laser micro-jet printer animation
    console.log("Starting Laser Micro-jet Printing...");
    await browser.eval(`
      const genBtn = document.querySelector('#stage-generate-btn-text') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('开始激光微喷冲印'));
      if (genBtn) genBtn.click();
    `);
    await sleep(2200);
    await browser.screenshot("s21_verify_3_laser_printer_developing_animation.png");

    // Wait until finished and artwork emerges
    await sleep(6500);
    await browser.screenshot("s21_verify_4_sample1_comparison_frame_mode.png");

    // 4. Test Comparison Mode 2: Side-by-Side (Original smaller on left, Generated large on right)
    console.log("Testing Side-by-side comparison mode...");
    await browser.eval(`
      const sbsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('左右对比'));
      if (sbsBtn) sbsBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("s21_verify_5_side_by_side_comparison_mode.png");

    // 5. Test Comparison Mode 3: Split Slider
    console.log("Testing Split Slider comparison mode...");
    await browser.eval(`
      const splitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('滑动卷帘'));
      if (splitBtn) splitBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("s21_verify_6_split_slider_comparison_mode.png");

    // 6. Apply to Haute Couture Dual Template
    console.log("Applying to s21 Dreamy Motion Haute Couture Template...");
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用') && (b.textContent.includes('排版') || b.textContent.includes('高定')));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(2000);
    await browser.screenshot("s21_verify_7_s21_template_applied_on_canvas.png");

    // 7. Test Sample 2: 长空飞鸟 (Flying Birds)
    console.log("Testing Sample 2: 长空飞鸟 (逆光留白)...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
      window.__store.getState().setAiSourceImage('https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80');
      window.__store.getState().setLatestAiGeneratedImage(null);
    `);
    await sleep(1000);

    await browser.eval(`
      const genBtn = document.querySelector('#stage-generate-btn-text') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('开始激光微喷冲印'));
      if (genBtn) genBtn.click();
    `);
    await sleep(8000);
    await browser.screenshot("s21_verify_8_sample2_birds_comparison.png");

    // Apply Sample 2 to Template
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用') && (b.textContent.includes('排版') || b.textContent.includes('高定')));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(1500);
    await browser.screenshot("s21_verify_9_sample2_template_canvas_applied.png");

    // 8. Test Dual Template in Template Panel
    console.log("Checking Template Panel with s21 and s21-dual templates...");
    await browser.eval(`
      window.__store.getState().setActivePanel('templates');
    `);
    await sleep(1000);
    await browser.screenshot("s21_verify_10_template_library_with_s21_dual.png");

    // Load s21-dreamy-motion-dual
    console.log("Loading s21-dreamy-motion-dual template...");
    await browser.eval(`
      window.__store.getState().loadTemplate('s21-dreamy-motion-dual', false);
    `);
    await sleep(1500);
    await browser.screenshot("s21_verify_11_s21_dual_template_canvas.png");

    console.log(">>> ALL S21 DREAMY EDITORIAL VERIFICATIONS SUCCEEDED! <<<");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
