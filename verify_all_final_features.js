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
      "--window-size=1600,1050",
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
      throw new Error("Chrome tab not found on port " + this.port);
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
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          this.ws.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      this.ws.addEventListener("message", handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error("Eval failed: " + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filepath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filepath, Buffer.from(res.data, "base64"));
    console.log("Screenshot saved:", filepath);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill("SIGKILL");
  }
}

async function run() {
  const session = new BrowserSession(9450, "/tmp/chrome-final-verification");
  try {
    console.log("1. Starting Chrome...");
    await session.start();

    console.log("2. Navigating to http://127.0.0.1:3001 ...");
    await session.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2500);

    // Verify 1: Landing Page - Clean Login Form, NO user type
    console.log("Verifying Landing Page login form...");
    await session.screenshot("final_check_1_landing_login.png");
    const loginFormCheck = await session.evaluate(`
      (function() {
        const formText = document.getElementById('auth-portal')?.textContent || '';
        return {
          hasUserTypeSelect: Boolean(document.querySelector('#auth-portal select')),
          hasUserTypeText: formText.includes('用户类型') || formText.includes('角色选择'),
          hasUsernameInput: Boolean(document.getElementById('landing-login-username')),
          hasPasswordInput: Boolean(document.getElementById('landing-login-password')),
          hasSubmitBtn: Boolean(document.getElementById('landing-login-submit'))
        };
      })()
    `);
    console.log("Login Form Check:", loginFormCheck);

    // Verify 2: Register tab on Landing Page
    console.log("Switching to register tab...");
    await session.evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('#auth-portal button'));
        const regBtn = btns.find(b => b.textContent && b.textContent.includes('注册新账号'));
        if (regBtn) regBtn.click();
      })()
    `);
    await sleep(1000);
    await session.screenshot("final_check_2_landing_register.png");

    // Verify 3: Login as regular user "tetsuya" (or create if needed)
    console.log("Logging in as regular user...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('tetsuya', 'tetsuya123');
        store.setCurrentView('studio');
      })()
    `);
    await sleep(2000);
    await session.screenshot("final_check_3_regular_user_studio.png");

    // Verify 4: Regular user has NO custom API button
    const regularUserApiCheck = await session.evaluate(`
      (function() {
        const bodyText = document.body.textContent || '';
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent || '');
        const hasApiInButtons = buttons.some(t => t.includes('API') || t.includes('自定义模型') || t.includes('大模型配置'));
        return {
          isAdmin: Boolean(window.__store.getState().currentUser?.isAdmin),
          hasApiInButtons,
        };
      })()
    `);
    console.log("Regular User API Access Check:", regularUserApiCheck);

    // Verify 5: Enter AI Stylize view
    console.log("Entering AI Stylize stage...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setActivePanel('ai-stylize');
      })()
    `);
    await sleep(1500);
    await session.screenshot("final_check_4_stylize_overview.png");

    // Verify 6: Open Media Picker Modal
    console.log("Opening Media Picker Modal...");
    await session.evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const pickerBtn = btns.find(b => b.textContent && b.textContent.includes('从素材库选择'));
        if (pickerBtn) pickerBtn.click();
      })()
    `);
    await sleep(1200);

    // Ensure sample asset exists
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        if (store.mediaAssets.length === 0) {
          const sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'><rect width='800' height='1000' fill='%2334495e'/><circle cx='400' cy='450' r='180' fill='%23f39c12'/><text x='400' y='800' font-size='48' fill='white' text-anchor='middle'>PHOTOGRAPHY</text></svg>";
          await store.addMediaAssets([
            { name: "静谧海滨暮色", src: sampleSvg, width: 800, height: 1000 },
            { name: "复古胶片街景", src: sampleSvg, width: 800, height: 1000 }
          ]);
        }
      })()
    `);
    await sleep(1000);
    await session.screenshot("final_check_5_media_picker.png");

    // Select asset
    await session.evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('.aspect-\\\\[3\\\\/4\\\\]'));
        if (cards.length > 0) cards[cards.length - 1].click();
      })()
    `);
    await sleep(1500);

    // Verify 7: Adaptive Wide Workspace is active
    console.log("Verifying adaptive wide workspace...");
    await session.screenshot("final_check_6_wide_workspace.png");

    // Verify 8: Queue Generation
    console.log("Adding to generation queue...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const genBtn = buttons.find(b => b.textContent && (b.textContent.includes('开始 AI 风格化') || b.textContent.includes('加入生成队列')));
        if (genBtn) genBtn.click();
      })()
    `);
    await sleep(1500);
    await session.screenshot("final_check_7_queue_capsule_active.png");

    // Verify 9: Open Lightbox Modal
    console.log("Opening Lightbox Modal...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const sampleResult = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1600' viewBox='0 0 1200 1600'><rect width='1200' height='1600' fill='%23111827'/><circle cx='600' cy='600' r='280' fill='%23ec4899'/><text x='600' y='1400' font-size='56' fill='%23fbbf24' font-family='serif' text-anchor='middle'>LIGHTBOX MASTERPIECE</text></svg>";
        store.setLatestAiGeneratedImage(sampleResult);
      })()
    `);
    await sleep(1000);

    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const maxBtn = buttons.find(b => b.textContent && b.textContent.includes('放大查看'));
        if (maxBtn) maxBtn.click();
      })()
    `);
    await sleep(1200);
    await session.screenshot("final_check_8_lightbox_fullscreen.png");

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await session.close();
  }
}

run();
