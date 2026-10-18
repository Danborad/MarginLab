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
      "--window-size=1680,1050",
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
      throw new Error("Chrome tab not found on port " + this.port);
    }

    this.ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    await this.send("Page.enable");
    await this.send("Runtime.enable");
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          this.ws.removeEventListener("message", handler);
          if (msg.error) {
            reject(new Error(JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
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
      throw new Error("Eval error: " + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filepath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filepath, Buffer.from(res.data, "base64"));
    console.log(`[Screenshot] Saved: ${filepath}`);
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.proc) {
      this.proc.kill("SIGKILL");
    }
  }
}

async function run() {
  const browser = new BrowserSession(9557, "/tmp/chrome-test-modal-3");
  try {
    await browser.start();
    await sleep(2500);

    console.log("1. Setting up logged-in user admin in light mode...");
    await browser.eval(`
      (async () => {
        const store = window.__store.getState();
        await store.login("admin", "admin123");
        store.setCurrentView("studio");
        store.setThemeMode("light");
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      })()
    `);
    await sleep(1500);

    console.log("2. Opening ReplacePhotoModal in light mode...");
    await browser.eval(`
      (() => {
        const store = window.__store.getState();
        const doc = store.document;
        const photoEl = doc.elements.find(e => e.type === 'image' || e.type === 'shape');
        const targetId = photoEl ? photoEl.id : 'el_mock_1';
        store.openReplacePhotoModal(targetId);
      })()
    `);
    await sleep(1200);

    const modalVisible = await browser.eval(`
      (() => {
        const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('替换照片素材'));
        return !!heading;
      })()
    `);
    console.log("ReplacePhotoModal open status:", modalVisible);

    // Capture Light Mode ReplacePhotoModal
    await browser.screenshot("verif_replace_modal_light.png");

    // Inspect styles of "本地照片替换" button
    const btnStyles = await browser.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const uploadBtn = btns.find(b => b.textContent.includes('本地照片替换') || b.textContent.includes('上传中'));
        if (!uploadBtn) return null;
        const cs = window.getComputedStyle(uploadBtn);
        return {
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
          text: uploadBtn.textContent.trim()
        };
      })()
    `);
    console.log("Upload button computed styles in light mode:", btnStyles);

    // Inspect search bar styles
    const searchStyles = await browser.eval(`
      (() => {
        const input = document.querySelector('input[placeholder*="搜索"]');
        if (!input) return null;
        const cs = window.getComputedStyle(input);
        return {
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor
        };
      })()
    `);
    console.log("Search input computed styles in light mode:", searchStyles);

    // Switch to dark mode
    console.log("3. Switching to dark mode...");
    await browser.eval(`
      (() => {
        const store = window.__store.getState();
        store.setThemeMode("dark");
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      })()
    `);
    await sleep(1000);

    await browser.screenshot("verif_replace_modal_dark.png");

    const darkBtnStyles = await browser.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const uploadBtn = btns.find(b => b.textContent.includes('本地照片替换') || b.textContent.includes('上传中'));
        if (!uploadBtn) return null;
        const cs = window.getComputedStyle(uploadBtn);
        return {
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
          text: uploadBtn.textContent.trim()
        };
      })()
    `);
    console.log("Upload button computed styles in dark mode:", darkBtnStyles);

    // Close modal
    await browser.eval(`
      (() => {
        window.__store.getState().closeReplacePhotoModal();
      })()
    `);
    await sleep(500);

    // Switch back to light mode and go to AI Stylize stage
    console.log("4. Navigating to AI Stylize stage in light mode...");
    await browser.eval(`
      (() => {
        const store = window.__store.getState();
        store.setThemeMode("light");
        store.setActivePanel("ai-stylize");
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      })()
    `);
    await sleep(1500);

    await browser.screenshot("verif_ai_stylize_light_stage.png");

    // 5. Test saving an image to assets from the AI stage / queue
    console.log("5. Testing saving to media assets...");
    const saveResult = await browser.eval(`
      (async () => {
        const store = window.__store.getState();
        const prevCount = store.mediaAssets.length;

        // Simulate save to assets with specific image and name
        const created = await store.addMediaAssets([{
          name: "AI风格 · 现代极简插画海报_最新入库实测",
          src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'><rect width='1024' height='1024' fill='%23FAF7F2'/><circle cx='512' cy='512' r='240' fill='%23B88A58'/><text x='512' y='530' font-size='48' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'>AI ARTWORK</text></svg>",
          width: 1024,
          height: 1024
        }]);

        const newCount = store.mediaAssets.length;
        return {
          success: true,
          prevCount,
          newCount,
          createdName: created && created[0] ? created[0].name : null
        };
      })()
    `);
    console.log("Save to assets result:", saveResult);

    // 6. Return to studio, open ReplacePhotoModal and verify newly added asset
    console.log("6. Returning to studio, opening ReplacePhotoModal to verify newly added asset...");
    await browser.eval(`
      (() => {
        const store = window.__store.getState();
        store.setCurrentView("studio");
        store.setActivePanel("templates");
        store.openReplacePhotoModal("el_mock_1");
      })()
    `);
    await sleep(1200);

    const assetCheck = await browser.eval(`
      (() => {
        const textNodes = Array.from(document.querySelectorAll('*')).filter(el => el.children.length === 0 && el.textContent.includes('最新入库实测'));
        const tabText = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('我的素材库'))?.textContent;
        return {
          tabText,
          foundNewCardText: textNodes.length > 0,
          foundTextContent: textNodes[0]?.textContent
        };
      })()
    `);
    console.log("Asset verification in ReplacePhotoModal:", assetCheck);

    await browser.screenshot("verif_replace_modal_with_new_asset.png");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
}

run();
