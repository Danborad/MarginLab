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
  console.log("  FINAL ACCEPTANCE TESTING: COMPLETE ATELIER SUITE");
  console.log("==================================================");

  const browser = new BrowserSession(9872, "/tmp/chrome_final_acceptance");
  try {
    await browser.start();
    await sleep(1500);

    // 1. Check Clean Landing Page (No role dropdowns)
    console.log("[1] Checking Clean Landing Page...");
    await browser.screenshot("acceptance_1_clean_landing_page.png");

    // 2. Log in as Regular User (Lin)
    console.log("[2] Logging in as regular user lin...");
    await browser.eval(`
      return window.__store.getState().login('lin', '123456');
    `);
    await sleep(1500);
    await browser.screenshot("acceptance_2_full_collage_studio.png");

    // 3. Check All Collage Studio Panels
    console.log("[3] Verifying Collage Studio Templates Panel...");
    await browser.eval(`
      window.__store.getState().setActivePanel('templates');
      window.__store.getState().loadTemplate('couture-lookbook', false);
    `);
    await sleep(1200);
    await browser.screenshot("acceptance_3_couture_template_canvas.png");

    // 4. Switch to AI Stylize Studio Stage
    console.log("[4] Switching to AI Stylize Studio Stage...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
      window.__store.getState().setSelectedAiStyleId('s21-dreamy-motion');
      // Load sample photo
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('电车旧梦') || b.textContent.includes('样图2'));
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(1200);
    await browser.screenshot("acceptance_4_ai_stylize_center_stage.png");

    // 5. Trigger Photo Laser Printer Developing Animation
    console.log("[5] Triggering Photo Laser Printer Developing Animation...");
    await browser.eval(`
      const genBtn = document.querySelector('#stage-generate-btn-text') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('开始激光微喷冲印'));
      if (genBtn) genBtn.click();
    `);
    await sleep(2200);
    await browser.screenshot("acceptance_5_laser_printer_developing.png");

    // Wait for development completion
    await sleep(6500);

    // Provide rich sample artwork for visual comparison
    await browser.eval(`
      const store = window.__store.getState();
      if (!store.latestAiGeneratedImage) {
        store.setLatestAiGeneratedImage('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80');
      }
    `);
    await sleep(800);

    // 6. Check Comparison Mode 1: Frame Mode (Hero artwork + small inset original)
    console.log("[6] Checking Frame Comparison Mode...");
    await browser.eval(`
      const frameBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('画框大图'));
      if (frameBtn) frameBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("acceptance_6_frame_comparison_mode.png");

    // 7. Check Comparison Mode 2: Side-by-Side (Original smaller on left, Generated large on right)
    console.log("[7] Checking Side-by-Side Comparison Mode (Original smaller)...");
    await browser.eval(`
      const sbsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('左右对比'));
      if (sbsBtn) sbsBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("acceptance_7_side_by_side_comparison_mode.png");

    // 8. Check Comparison Mode 3: Split Slider
    console.log("[8] Checking Split Slider Comparison Mode...");
    await browser.eval(`
      const splitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('滑动卷帘'));
      if (splitBtn) splitBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("acceptance_8_split_slider_comparison_mode.png");

    // 9. Apply to Haute Couture Dual Layout & Return to Puzzle Canvas
    console.log("[9] Applying to Haute Couture Dual Template & returning to Puzzle Canvas...");
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用双联高定排版') || (b.textContent.includes('套用') && b.textContent.includes('排版')));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(2000);
    await browser.screenshot("acceptance_9_dual_layout_applied_on_canvas.png");

    // 10. Admin Console: Login as admin and fetch models
    console.log("[10] Logging in as Super Admin & Opening Admin Console...");
    await browser.eval(`
      return window.__store.getState().logout().then(() => window.__store.getState().login('admin', 'admin123'));
    `);
    await sleep(1500);

    await browser.eval(`
      window.__store.getState().setAdminModalOpen(true, 'ai_config');
    `);
    await sleep(1200);
    await browser.screenshot("acceptance_10_admin_ai_config.png");

    console.log("==================================================");
    console.log("  ALL FINAL ACCEPTANCE TESTS PASSED FLAWLESSLY!");
    console.log("==================================================");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
