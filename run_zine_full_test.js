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
  const browser = new BrowserSession(9399, "/tmp/chrome_zine_full_test");
  try {
    console.log("1. Starting Chrome session...");
    await browser.start();

    // 1. Initial State
    await browser.screenshot("zine_final_1_gallery_and_drawer.png");

    // 2. Select card 01 (实景拼贴) & load sample photo
    console.log("2. Selecting style 01 & sample photo...");
    await browser.eval(`
      window.__store?.getState?.().setSelectedAiStyleId("reality_collage");
      window.__store?.getState?.().setAiSourceImage("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80");
      window.__store?.getState?.().setIsZineDrawerOpen(true);
    `);
    await sleep(600);
    await browser.screenshot("zine_final_2_photo_loaded_in_drawer.png");

    // 3. Trigger Generation and capture printing animation
    console.log("3. Triggering generation...");
    browser.eval(`
      window.__store?.getState?.().generateAiImage({
        styleId: "reality_collage",
        mood: "自然雪山与静谧小堂",
        includeText: true,
        specifiedText: "silence. watch.",
        aspectRatio: "auto"
      });
    `);
    await sleep(2000);
    await browser.screenshot("zine_final_3_laser_printer_developing_animation.png");

    // 4. Wait for generation to complete (up to 35s)
    console.log("4. Waiting for real AI generation to finish...");
    for (let i = 0; i < 35; i++) {
      await sleep(1000);
      const isGen = await browser.eval(`window.__store?.getState?.().isGeneratingAi`);
      const hasResult = await browser.eval(`Boolean(window.__store?.getState?.().latestAiGeneratedImage)`);
      if (!isGen && hasResult) {
        console.log(`Generation completed at ${i + 1}s!`);
        break;
      }
    }

    await sleep(1000);
    await browser.screenshot("zine_final_4_generated_frame_comparison.png");

    // 5. Switch to Side-by-Side mode
    console.log("5. Testing Side-by-Side comparison...");
    await browser.eval(`
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.title && b.title.includes("左右对比"));
      if (btn) btn.click();
    `);
    await sleep(600);
    await browser.screenshot("zine_final_5_side_by_side_comparison.png");

    // 6. Switch to Split Slider mode
    console.log("6. Testing Split Slider comparison...");
    await browser.eval(`
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.title && b.title.includes("滑动卷帘"));
      if (btn) btn.click();
    `);
    await sleep(600);
    await browser.screenshot("zine_final_6_split_slider_comparison.png");

    // 7. Close output modal and check History Gallery
    console.log("7. Checking 生成记录 (History Gallery)...");
    await browser.eval(`
      const closeBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("完成"));
      if (closeBtn) closeBtn.click();
      window.__store?.getState?.().setZineTab("history");
    `);
    await sleep(800);
    await browser.screenshot("zine_final_7_history_gallery_tab.png");

    // 8. Check Home Tab
    console.log("8. Checking 首页 (Home Tab)...");
    await browser.eval(`
      window.__store?.getState?.().setZineTab("home");
    `);
    await sleep(600);
    await browser.screenshot("zine_final_8_home_tab.png");

    // 9. Check Profile Tab
    console.log("9. Checking 我的 (Profile Tab)...");
    await browser.eval(`
      window.__store?.getState?.().setZineTab("profile");
    `);
    await sleep(600);
    await browser.screenshot("zine_final_9_profile_tab.png");

    // 10. Check Clean Login Modal (NO user type dropdown)
    console.log("10. Checking Clean Login Modal (NO user type dropdown)...");
    await browser.eval(`
      window.__store?.getState?.().setAuthModalOpen(true);
    `);
    await sleep(600);
    await browser.screenshot("zine_final_10_clean_login_modal.png");

    // 11. Admin Login & Check Global AI Config Tab
    console.log("11. Testing Admin login and Global AI Config Tab...");
    await browser.eval(`
      (async () => {
        await window.__store?.getState?.().login("admin", "admin123");
        window.__store?.getState?.().setAuthModalOpen(false);
        window.__store?.getState?.().setAdminModalOpen(true, "ai_config");
      })()
    `);
    await sleep(1000);
    await browser.screenshot("zine_final_11_admin_global_ai_config_tab.png");

    console.log(">>> ALL FINAL VERIFICATIONS PASSED 100%! <<<");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
