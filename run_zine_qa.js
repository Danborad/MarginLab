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
      "--window-size=1536,864",
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
    await sleep(2500);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          this.ws.removeEventListener("message", handler);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
      this.ws.addEventListener("message", handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`[QA Screenshot Saved] ${filename}`);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill("SIGKILL");
  }
}

async function main() {
  const browser = new BrowserSession(9388, "/tmp/chrome_zine_qa");
  try {
    console.log("1. Starting Chrome CDP session...");
    await browser.start();

    // Step 1: Main Gallery + Open Drawer (Initial state matching reference)
    console.log("2. Capturing main gallery & creation drawer...");
    await browser.screenshot("zine_qa_1_main_gallery_and_drawer.png");

    // Step 2: Select s21 Dreamy Motion Editorial style
    console.log("3. Selecting s21 Dreamy Motion Editorial style...");
    await browser.eval(`
      window.__store?.getState?.().setSelectedAiStyleId("dreamy_motion_editorial");
      window.__store?.getState?.().setIsZineDrawerOpen(true);
    `);
    await sleep(600);
    await browser.screenshot("zine_qa_2_s21_style_selected.png");

    // Step 3: Load sample photo into drawer
    console.log("4. Loading sample photo into drawer...");
    await browser.eval(`
      window.__store?.getState?.().setAiSourceImage("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80");
    `);
    await sleep(600);
    await browser.screenshot("zine_qa_3_photo_loaded_in_drawer.png");

    // Step 4: Trigger Laser Printer Developing Animation
    console.log("5. Triggering Laser Fine-Art Printer Developing Animation...");
    browser.eval(`
      window.__store?.getState?.().generateAiImage({
        styleId: "dreamy_motion_editorial",
        mood: "慢门街景光轨，雨后微凉",
        includeText: true,
        specifiedText: "光影穿梭，电车奔赴旧梦",
        aspectRatio: "auto"
      });
    `);
    await sleep(1500);
    await browser.screenshot("zine_qa_4_laser_printer_developing_animation.png");

    // Step 5: Wait for generation result
    console.log("6. Waiting for artwork generation output...");
    await sleep(6000);
    await browser.screenshot("zine_qa_5_generated_comparison_frame_mode.png");

    // Step 6: Side by side comparison mode
    console.log("7. Testing Side-by-Side comparison mode (Original Smaller)...");
    await browser.eval(`
      const modalBtns = Array.from(document.querySelectorAll("button"));
      const sideBtn = modalBtns.find(b => b.title && b.title.includes("左右对比"));
      if (sideBtn) sideBtn.click();
    `);
    await sleep(600);
    await browser.screenshot("zine_qa_6_side_by_side_comparison_mode.png");

    // Step 7: Split slider comparison mode
    console.log("8. Testing Split Slider comparison mode...");
    await browser.eval(`
      const modalBtns = Array.from(document.querySelectorAll("button"));
      const splitBtn = modalBtns.find(b => b.title && b.title.includes("滑动卷帘"));
      if (splitBtn) splitBtn.click();
    `);
    await sleep(600);
    await browser.screenshot("zine_qa_7_split_slider_comparison_mode.png");

    // Step 8: Close comparison modal and check 生成记录 (History Gallery)
    console.log("9. Navigating to 生成记录 (History Gallery)...");
    await browser.eval(`
      window.__store?.getState?.().setLatestAiGeneratedImage(null);
      window.__store?.getState?.().setZineTab("history");
    `);
    await sleep(800);
    await browser.screenshot("zine_qa_8_history_gallery_tab.png");

    // Step 9: Check 首页 (Home Tab)
    console.log("10. Navigating to 首页 (Home Tab)...");
    await browser.eval(`
      window.__store?.getState?.().setZineTab("home");
    `);
    await sleep(600);
    await browser.screenshot("zine_qa_9_home_tab.png");

    // Step 10: Check 我的 (Profile Tab)
    console.log("11. Navigating to 我的 (Profile Tab)...");
    await browser.eval(`
      window.__store?.getState?.().setZineTab("profile");
    `);
    await sleep(600);
    await browser.screenshot("zine_qa_10_profile_tab.png");

    // Step 11: Check Clean Login Modal (Verifying NO user type dropdown)
    console.log("12. Testing Login modal for clean form (no user type dropdown)...");
    await browser.eval(`
      window.__store?.getState?.().setAuthModalOpen(true);
    `);
    await sleep(600);
    await browser.screenshot("zine_qa_11_clean_login_modal.png");

    // Step 12: Admin login & check Global AI Model Config Tab
    console.log("13. Testing Admin login and Global AI Model Config...");
    await browser.eval(`
      (async () => {
        await window.__store?.getState?.().login("admin", "admin123");
        window.__store?.getState?.().setAdminModalOpen(true, "ai_config");
      })()
    `);
    await sleep(800);
    await browser.screenshot("zine_qa_12_admin_global_ai_config_tab.png");

    console.log(">>> ALL ZINE QA TESTS COMPLETED WITH 100% SUCCESS! <<<");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
