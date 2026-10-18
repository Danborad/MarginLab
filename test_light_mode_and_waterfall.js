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
      "--window-size=1600,1000",
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
  console.log("  VERIFYING LIGHT MODE & WATERFALL STYLIZE STAGE");
  console.log("==================================================");

  const browser = new BrowserSession(9850, "/tmp/chrome_light_waterfall_qa");
  try {
    await browser.start();
    await sleep(1500);

    // 1. Landing Page in Dark Mode
    console.log("[1] Checking Landing Page (Dark mode)...");
    await browser.screenshot("verif_theme_1_landing_dark.png");

    // 2. Switch Landing Page to Light Mode
    console.log("[2] Switching to Light Mode on Landing Page...");
    await browser.eval(`
      window.__store.getState().setThemeMode('light');
    `);
    await sleep(600);
    await browser.screenshot("verif_theme_2_landing_light.png");

    // 3. Log in as regular user lin in Light Mode
    console.log("[3] Logging in as lin in Light Mode...");
    await browser.eval(`
      return window.__store.getState().login('lin', '123456');
    `);
    await sleep(1200);
    await browser.screenshot("verif_theme_3_studio_light.png");

    // 4. Open AI Stylize Stage in Light Mode (Left Waterfall + Right Settings)
    console.log("[4] Opening AI Stylize Stage in Light Mode (Waterfall + Right Settings)...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
      window.__store.getState().setAiSourceImage(null);
      window.__store.getState().setLatestAiGeneratedImage(null);
    `);
    await sleep(1000);
    await browser.screenshot("verif_waterfall_4_stylize_light.png");

    // 5. Load photo in right settings panel (Light Mode)
    console.log("[5] Loading photo in right settings panel...");
    await browser.eval(`
      window.__store.getState().setSelectedAiStyleId('s21-dreamy-motion');
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('电车旧梦') || b.textContent.includes('电车'));
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("verif_waterfall_5_photo_loaded_light.png");

    // 6. Switch back to Dark Mode to verify AI Stylize Stage in Dark Mode
    console.log("[6] Switching back to Dark Mode for AI Stylize Stage...");
    await browser.eval(`
      window.__store.getState().setThemeMode('dark');
    `);
    await sleep(600);
    await browser.screenshot("verif_waterfall_6_stylize_dark_waterfall.png");

    // 7. Check Modern Loading Animation (Generating state, NO PRINTER)
    console.log("[7] Checking Modern AI Loading Animation (isGenerating: true)...");
    await browser.eval(`
      window.__store.getState().generateAiImage({ styleId: 's21-dreamy-motion' });
    `);
    await sleep(1500);
    await browser.screenshot("verif_loading_7_modern_ai_spinner.png");

    // 8. Provide completed image and check comparison views
    console.log("[8] Checking Comparison Views...");
    await sleep(4000);
    await browser.eval(`
      const store = window.__store.getState();
      store.setLatestAiGeneratedImage('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80');
    `);
    await sleep(800);
    await browser.screenshot("verif_comp_8_frame_comparison.png");

    // 9. Side by Side Comparison
    await browser.eval(`
      const sbsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('左右对比'));
      if (sbsBtn) sbsBtn.click();
    `);
    await sleep(600);
    await browser.screenshot("verif_comp_9_side_by_side.png");

    // 10. Apply to Dual Layout Template & return to canvas
    console.log("[10] Applying to Dual Layout & returning to Canvas...");
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用双联高定排版'));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(1500);
    await browser.screenshot("verif_canvas_10_dual_layout_applied.png");

    console.log("==================================================");
    console.log("  ALL LIGHT MODE & WATERFALL TESTS COMPLETED!");
    console.log("==================================================");
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error("Test Suite Failed:", e);
  process.exit(1);
});
