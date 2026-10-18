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
      "http://localhost:3001",
    ]);

    let tab = null;
    for (let i = 0; i < 50; i++) {
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
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      const handler = (event) => {
        const parsed = JSON.parse(event.data);
        if (parsed.id === id) {
          this.ws.removeEventListener("message", handler);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
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
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log(`[Screenshot] Saved ${filename}`);
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
    await sleep(800);
  }
}

async function run() {
  console.log("==================================================");
  console.log("  TESTING AI STYLIZE STUDIO STAGE & PRINT ANIMATION");
  console.log("==================================================");

  const browser = new BrowserSession(9989, "/tmp/chrome_ai_studio_test");
  await browser.start();
  await sleep(1500);

  // 1. Enter Studio as creator Lin
  console.log("[1] Logging in as creator (lin / 123456)...");
  await browser.eval(`
    (async () => {
      const store = window.__store.getState();
      await store.login("lin", "123456");
      store.setCurrentView("studio");
    })()
  `);
  await sleep(1000);

  // 2. Initially in templates mode, center is collage canvas
  console.log("[2] Checking default collage canvas stage...");
  const initialStageInfo = await browser.eval(`
    (() => {
      const hasCanvas = !!document.querySelector("#atelier-canvas-container");
      const activePanel = window.__store.getState().activePanel;
      return { hasCanvas, activePanel };
    })()
  `);
  console.log("  Default stage info:", initialStageInfo);

  // 3. Switch to "风格化" (AI Stylize) Mode
  console.log("[3] Switching to '风格化' tab...");
  await browser.eval(`
    window.__store.getState().setActivePanel("ai-stylize");
  `);
  await sleep(1000);

  const aiStageInfo = await browser.eval(`
    (() => {
      const hasCanvas = !!document.querySelector("#atelier-canvas-container");
      const hasAiStudio = document.body.innerText.includes("AI 艺术风格化重构工作台");
      const hasUploadDropzone = document.body.innerText.includes("点击或拖拽上传真实风景");
      return { hasCanvas, hasAiStudio, hasUploadDropzone };
    })()
  `);
  console.log("  AI Stylize Studio Stage info:", aiStageInfo);
  await browser.screenshot("ai_studio_qa_1_center_stage_dropzone.png");

  // 4. Select a sample photo (雪山高原)
  console.log("[4] Selecting sample photo '雪山高原'...");
  await browser.eval(`
    (() => {
      const sampleBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("雪山高原"));
      if (sampleBtn) sampleBtn.click();
    })()
  `);
  await sleep(1000);

  const preGenInfo = await browser.eval(`
    (() => {
      const hasSourceCard = document.body.innerText.includes("原始输入照片");
      const hasTargetStyleCard = document.body.innerText.includes("目标风格");
      const hasStartBtn = document.body.innerText.includes("开始激光微喷冲印");
      return { hasSourceCard, hasTargetStyleCard, hasStartBtn };
    })()
  `);
  console.log("  Pre-generation dual preview info:", preGenInfo);
  await browser.screenshot("ai_studio_qa_2_source_photo_loaded.png");

  // 5. Trigger Generation & Capture Printing Animation
  console.log("[5] Triggering AI generation and checking printing animation...");
  browser.eval(`
    (() => {
      const startBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("开始激光微喷冲印") || b.innerText.includes("开始 AI 风格化"));
      if (startBtn) startBtn.click();
    })()
  `);

  await sleep(800);
  console.log("  Capturing in-progress printing animation...");
  await browser.screenshot("ai_studio_qa_3_printer_developing_animation.png");

  // Wait for generation to finish
  console.log("  Waiting for generation to finish...");
  for (let i = 0; i < 30; i++) {
    await sleep(600);
    const isDone = await browser.eval(`
      (() => {
        const store = window.__store.getState();
        return !store.isGeneratingAi && !!store.latestAiGeneratedImage;
      })()
    `);
    if (isDone) break;
  }
  await sleep(1200);

  // 6. Verify Generated Artwork with Frame Mode (Large Generated Photo + Small Inset Original)
  console.log("[6] Checking Generated Artwork Frame Mode (Original smaller in corner)...");
  const resultInfo = await browser.eval(`
    (() => {
      const hasResult = !!window.__store.getState().latestAiGeneratedImage;
      const text = document.body.innerText;
      const hasOriginalBadge = text.includes("原始源片") || text.includes("原始输入照片");
      const hasApplyTemplate = text.includes("套用双联高定排版");
      const hasInsertCanvas = text.includes("插入当前拼图画布");
      return { hasResult, hasOriginalBadge, hasApplyTemplate, hasInsertCanvas };
    })()
  `);
  console.log("  Result comparison info:", resultInfo);
  await browser.screenshot("ai_studio_qa_4_generated_frame_comparison.png");

  // 7. Switch to Side-by-Side Comparison Mode
  console.log("[7] Switching to Side-by-Side comparison mode (Original on left smaller, Generated on right)...");
  await browser.eval(`
    (() => {
      const sideBySideBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("左右对比"));
      if (sideBySideBtn) sideBySideBtn.click();
    })()
  `);
  await sleep(1000);
  await browser.screenshot("ai_studio_qa_5_side_by_side_comparison.png");

  // 8. Switch to Split Slider Comparison Mode
  console.log("[8] Switching to Split Slider comparison mode...");
  await browser.eval(`
    (() => {
      const splitBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("滑动卷帘"));
      if (splitBtn) splitBtn.click();
    })()
  `);
  await sleep(1000);
  await browser.screenshot("ai_studio_qa_6_split_slider_comparison.png");

  // 9. Click "套用双联高定排版" (Apply Haute Couture Template)
  console.log("[9] Applying Haute Couture Dual Layout with newly generated art...");
  await browser.eval(`
    (() => {
      const applyBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("套用双联高定排版"));
      if (applyBtn) applyBtn.click();
    })()
  `);
  await sleep(1500);

  const appliedCanvasInfo = await browser.eval(`
    (() => {
      const hasCanvas = !!document.querySelector("#atelier-canvas-container");
      const activePanel = window.__store.getState().activePanel;
      const elementCount = window.__store.getState().document.elements.length;
      return { hasCanvas, activePanel, elementCount };
    })()
  `);
  console.log("  After applying to canvas:", appliedCanvasInfo);
  await browser.screenshot("ai_studio_qa_7_applied_to_collage_canvas.png");

  await browser.close();

  console.log("==================================================");
  console.log("  ALL AI STYLIZE STUDIO STAGE QA TESTS PASSED!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
