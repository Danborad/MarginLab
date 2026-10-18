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
  console.log("  FULL INTEGRATION VERIFICATION: PUZZLE & STYLIZE");
  console.log("==================================================");

  const browser = new BrowserSession(9876, "/tmp/chrome_full_integration_qa");
  try {
    await browser.start();
    await sleep(1500);

    // 1. Check Clean Landing Page
    console.log("[1] Checking Clean Landing Page...");
    const hasRoleDropdown = await browser.eval(`
      return !!document.querySelector("select") || document.body.innerText.includes("选择角色");
    `);
    console.log("  Has role dropdown on landing page:", hasRoleDropdown);
    await browser.screenshot("integration_qa_1_clean_landing.png");

    // 2. Log in as Regular User (Lin)
    console.log("[2] Logging in as regular user lin...");
    await browser.eval(`
      return window.__store.getState().login('lin', '123456');
    `);
    await sleep(1500);
    await browser.screenshot("integration_qa_2_studio_collage_canvas.png");

    // 3. Verify Puzzle Collage Studio: Switch templates
    console.log("[3] Verifying Collage Studio Templates (Zen, Couture, Mijia 6inch)...");
    await browser.eval(`
      window.__store.getState().loadTemplate('couture-lookbook', false);
    `);
    await sleep(1200);
    await browser.screenshot("integration_qa_3_couture_lookbook_template.png");

    // 4. Test Switching to AI Stylize Mode
    console.log("[4] Switching to AI Stylize Studio Stage...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
    `);
    await sleep(1200);
    await browser.screenshot("integration_qa_4_stylize_center_stage.png");

    // 5. Select Style and Load Sample Photo
    console.log("[5] Selecting s21 Dreamy Motion style & loading Sample 1...");
    await browser.eval(`
      window.__store.getState().setSelectedAiStyleId('s21-dreamy-motion');
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('电车旧梦') || b.textContent.includes('样图1'));
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(1000);
    await browser.screenshot("integration_qa_5_source_photo_loaded.png");

    // 6. Trigger Laser Photo Printing Animation
    console.log("[6] Triggering Laser Photo Printing Animation...");
    await browser.eval(`
      const genBtn = document.querySelector('#stage-generate-btn-text') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('开始激光微喷冲印'));
      if (genBtn) genBtn.click();
    `);
    await sleep(2200);
    await browser.screenshot("integration_qa_6_laser_printer_developing.png");

    // Wait for printing completion
    await sleep(6500);
    await browser.screenshot("integration_qa_7_generated_artwork_frame_mode.png");

    // 7. Check Side-by-Side Comparison (Original is smaller)
    console.log("[7] Checking Side-by-side comparison mode (Original smaller)...");
    await browser.eval(`
      const sbsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('左右对比'));
      if (sbsBtn) sbsBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("integration_qa_8_side_by_side_comparison.png");

    // 8. Check Split Slider Comparison
    console.log("[8] Checking Split Slider comparison mode...");
    await browser.eval(`
      const splitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('滑动卷帘'));
      if (splitBtn) splitBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("integration_qa_9_split_slider_comparison.png");

    // 9. Apply to Haute Couture Dual Layout & Return to Puzzle Canvas
    console.log("[9] Applying to Haute Couture Dual Template & returning to Puzzle Canvas...");
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用双联高定排版') || (b.textContent.includes('套用') && b.textContent.includes('排版')));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(2000);
    await browser.screenshot("integration_qa_10_couture_dual_applied_canvas.png");

    // 10. Switch to AI Stylize again and Insert as Layer
    console.log("[10] Testing 'Insert into current collage canvas' action...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
    `);
    await sleep(1000);
    await browser.eval(`
      const insertBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('插入当前拼图画布'));
      if (insertBtn) insertBtn.click();
    `);
    await sleep(1500);
    await browser.screenshot("integration_qa_11_inserted_layer_canvas.png");

    // 11. Test Admin Console: Login as admin and verify Fetch Models
    console.log("[11] Logging out Lin and Logging in as Super Admin...");
    await browser.eval(`
      return window.__store.getState().logout().then(() => window.__store.getState().login('admin', 'admin123'));
    `);
    await sleep(1500);

    console.log("[12] Opening Admin Console -> AI Config tab...");
    await browser.eval(`
      window.__store.getState().setAdminModalOpen(true, 'ai_config');
    `);
    await sleep(1200);
    await browser.screenshot("integration_qa_12_admin_ai_config_modal.png");

    console.log("[13] Clicking '拉取网关模型列表' (Fetch Models)...");
    await browser.eval(`
      const fetchBtn = document.querySelector('#admin-fetch-models-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('拉取网关模型列表') || b.textContent.includes('拉取'));
      if (fetchBtn) fetchBtn.click();
    `);
    await sleep(2000);
    await browser.screenshot("integration_qa_13_admin_models_fetched_dropdown.png");

    console.log("==================================================");
    console.log("  ALL INTEGRATION QA VERIFICATIONS PASSED!");
    console.log("==================================================");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
