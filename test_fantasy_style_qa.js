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
  const browser = new BrowserSession(9338, "/tmp/chrome_qa_fantasy2");
  try {
    console.log("Starting Browser...");
    await browser.start();
    await sleep(1500);

    // 1. Log in
    console.log("Logging in as lin...");
    await browser.eval(`
      return window.__store.getState().login("lin", "123456");
    `);
    await sleep(1200);

    // 2. Switch to AI Stylize Studio
    console.log("Opening AI Stylize Studio...");
    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
    `);
    await sleep(1000);

    // 3. Select FANTASY style directly via store or click
    console.log("Selecting FANTASY 奇奇怪怪 style...");
    await browser.eval(`
      window.__store.getState().setSelectedAiStyleId("fantasy_qiqiguaiguai");
    `);
    await sleep(800);
    await browser.screenshot("fantasy_qa_2_selected_card.png");

    // 4. Load a pet photo into source image
    console.log("Setting source image (Cute cat / dog)...");
    await browser.eval(`
      window.__store.getState().setAiSourceImage("https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80");
    `);
    await sleep(1000);
    await browser.screenshot("fantasy_qa_3_pet_photo_loaded.png");

    // 5. Test generation
    console.log("Clicking generate button...");
    await browser.eval(`
      const genBtn = document.querySelector("#stage-generate-btn-text") || Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("开始AI 风格化重构") || b.textContent.includes("冲印") || b.textContent.includes("生成"));
      if (genBtn) genBtn.click();
    `);
    await sleep(2000);
    await browser.screenshot("fantasy_qa_4_generating_overlay.png");

    // Wait for generation to finish
    console.log("Waiting for result...");
    for (let i = 0; i < 35; i++) {
      await sleep(1000);
      const isGen = await browser.eval(`return window.__store.getState().isGeneratingAi;`);
      if (!isGen) {
        console.log(`Generation completed at ${i+1}s!`);
        break;
      }
    }
    await sleep(1500);
    await browser.screenshot("fantasy_qa_5_poster_result.png");

    // 6. Test Side-by-side mode
    console.log("Switching to Side-by-side comparison...");
    await browser.eval(`
      const sideBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("左右对比"));
      if (sideBtn) sideBtn.click();
    `);
    await sleep(800);
    await browser.screenshot("fantasy_qa_6_side_by_side_mode.png");

    // 7. Test Light mode
    console.log("Testing in Light Mode...");
    await browser.eval(`
      window.__store.getState().setTheme("light");
    `);
    await sleep(800);
    await browser.screenshot("fantasy_qa_7_light_mode_poster.png");

    // 8. Apply to canvas
    console.log("Applying stylized poster to collage canvas...");
    await browser.eval(`
      const applyBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("应用到拼图画布") || b.textContent.includes("套用"));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(1500);
    await browser.screenshot("fantasy_qa_8_applied_canvas.png");

    console.log(">>> ALL FANTASY STYLE QA TESTS COMPLETED! <<<");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
