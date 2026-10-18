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
  const browser = new BrowserSession(9338, "/tmp/chrome_qa_real_api");
  try {
    console.log("Starting Browser...");
    await browser.start();
    await sleep(1500);

    // 1. Log in
    console.log("Logging in as lin...");
    await browser.eval(`
      return window.__store.getState().login('lin', '123456');
    `);
    await sleep(1500);

    // 2. Open AI Stylize Studio Stage
    console.log("Opening AI Stylize Panel & Studio Stage...");
    await browser.eval(`
      window.__store.getState().setActivePanel('ai-stylize');
    `);
    await sleep(1200);

    // 3. Load Sample 1: 电车旧梦
    console.log("Loading Sample 1: 电车旧梦...");
    await browser.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('电车旧梦') || b.textContent.includes('样图1'));
      if (btn) btn.click();
    `);
    await sleep(1000);
    await browser.screenshot("real_api_qa_1_source_loaded.png");

    // 4. Click generate to trigger real API call to chatgpt2api
    console.log("Triggering REAL AI Generation through chatgpt2api...");
    await browser.eval(`
      const genBtn = document.querySelector('#stage-generate-btn-text') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('开始激光微喷冲印'));
      if (genBtn) genBtn.click();
    `);
    await sleep(3000);
    await browser.screenshot("real_api_qa_2_laser_printer_running.png");

    // Poll until generation finishes
    console.log("Waiting for real AI generation to finish (typically 20-30s)...");
    for (let i = 0; i < 40; i++) {
      await sleep(1500);
      const isDone = await browser.eval(`
        return !!window.__store.getState().latestAiGeneratedImage;
      `);
      if (isDone) {
        console.log(`Real AI Generation finished at attempt ${i+1}!`);
        break;
      }
    }

    await sleep(2000);
    await browser.screenshot("real_api_qa_3_real_generated_image_frame_mode.png");

    // 5. Side-by-side mode
    console.log("Switching to Side-by-Side comparison mode...");
    await browser.eval(`
      const sbsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('左右对比'));
      if (sbsBtn) sbsBtn.click();
    `);
    await sleep(1000);
    await browser.screenshot("real_api_qa_4_real_image_side_by_side.png");

    // 6. Split Slider mode
    console.log("Switching to Split Slider comparison mode...");
    await browser.eval(`
      const splitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('滑动卷帘'));
      if (splitBtn) splitBtn.click();
    `);
    await sleep(1000);
    await browser.screenshot("real_api_qa_5_real_image_split_slider.png");

    // 7. Apply to Haute Couture Template on Collage Canvas
    console.log("Applying real AI image to s21 template on collage canvas...");
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('套用') && (b.textContent.includes('排版') || b.textContent.includes('高定')));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(2000);
    await browser.screenshot("real_api_qa_6_canvas_with_real_ai_artwork.png");

    console.log(">>> REAL API GENERATION QA COMPLETE! <<<");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
