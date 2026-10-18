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
  const browser = new BrowserSession(9333, "/tmp/chrome_qa_final");
  try {
    console.log("Starting Browser and Navigating to http://127.0.0.1:3001...");
    await browser.start();
    await sleep(1500);

    // 1. Landing Page Clean Verification (No user type / roles shown)
    console.log("Step 1: Capturing clean landing login page...");
    await browser.screenshot("final_qa_1_landing_login_clean.png");

    // Click register tab
    await browser.eval(`
      const regBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('注册新账号'));
      if (regBtn) regBtn.click();
    `);
    await sleep(600);
    console.log("Step 2: Capturing clean registration view...");
    await browser.screenshot("final_qa_2_landing_register_clean.png");

    // Login as regular user 'lin' via store
    console.log("Logging in as regular user 'lin'...");
    await browser.eval(`
      return window.__store.getState().login('lin', '123456');
    `);
    await sleep(1500);

    // 2. Regular user workspace (Clean, no API config prompts)
    console.log("Step 3: Capturing regular user workspace...");
    await browser.screenshot("final_qa_3_regular_user_studio.png");

    // Check user dropdown for regular user
    await browser.eval(`
      const userBtn = document.querySelector('#header-user-dropdown-btn');
      if (userBtn) userBtn.click();
    `);
    await sleep(500);
    console.log("Step 4: Capturing regular user clean dropdown (no admin/api options)...");
    await browser.screenshot("final_qa_4_regular_user_dropdown_clean.png");

    await browser.eval(`
      const userBtn = document.querySelector('#header-user-dropdown-btn');
      if (userBtn) userBtn.click();
    `);
    await sleep(500);

    // 3. Switch to AI Stylize ("风格化")
    console.log("Step 5: Switching to AI Stylize Mode (Center is Style Showcase & Upload Stage)...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
    `);
    await sleep(1200);
    await browser.screenshot("final_qa_5_ai_stylize_center_stage.png");

    // 4. Load sample photo ("雪山高原") and show 8 aspect ratios
    console.log("Step 6: Loading source photo with 8 wireframe ratios...");
    await browser.eval(`
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('雪山高原'));
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(1000);
    await browser.screenshot("final_qa_6_source_photo_loaded_with_8_ratios.png");

    // 5. Trigger Generate -> Capture Printer Developing Animation
    console.log("Step 7: Triggering AI Generation to capture photo printer animation...");
    await browser.eval(`
      const genBtn = document.querySelector('#stage-generate-btn-text') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('开始激光微喷冲印'));
      if (genBtn) genBtn.click();
    `);
    await sleep(2200);
    await browser.screenshot("final_qa_7_photo_printer_developing_animation.png");

    // Wait for generation to complete and show results
    await sleep(5500);
    console.log("Step 8: Generated Artwork Frame Comparison (original photo smaller in corner)...");
    await browser.screenshot("final_qa_8_generated_artwork_frame_comparison.png");

    // 6. Mode 2: Side-by-Side Comparison
    console.log("Step 9: Side-by-side comparison (original smaller on left)...");
    await browser.eval(`
      const sbsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('左右对比'));
      if (sbsBtn) sbsBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("final_qa_9_side_by_side_comparison.png");

    // Mode 3: Split Slider Comparison
    console.log("Step 10: Split slider comparison...");
    await browser.eval(`
      const splitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('滑动卷帘'));
      if (splitBtn) splitBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("final_qa_10_split_slider_comparison.png");

    // 7. Apply to Dual-Tile Haute Couture Layout
    console.log("Step 11: Applying to Haute Couture Template...");
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用双联高定排版'));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(1800);
    await browser.screenshot("final_qa_11_applied_to_collage_canvas.png");

    console.log(">>> ALL FINAL QA SCREENSHOTS CAPTURED SUCCESSFULLY! <<<");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
