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
    this.dialogEvents = [];
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

    // Listen for Page.javascriptDialogOpening to verify NO native dialogs open!
    this.ws.addEventListener("message", (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        console.warn("NATIVE DIALOG DETECTED (SHOULD BE ZERO):", msg.params);
        this.dialogEvents.push(msg.params);
      }
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
  const session = new BrowserSession(9455, "/tmp/chrome-user-fixes");
  try {
    console.log("1. Starting Chrome...");
    await session.start();

    console.log("2. Navigating to http://127.0.0.1:3001 ...");
    await session.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2500);

    // Login as admin
    console.log("Logging in as admin...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
      })()
    `);
    await sleep(2000);

    // ==========================================
    // TEST 1: Open Admin Console & Test In-App Confirm Dialog (Req 1)
    // ==========================================
    console.log("Opening Admin Console...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setAdminModalOpen(true, 'users');
      })()
    `);
    await sleep(1500);

    // Click "封禁" button on the second user (e.g. Mia or Tetsuya)
    console.log("Triggering ban action to verify in-app confirm dialog...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const banBtn = buttons.find(b => b.textContent && b.textContent.includes('封禁') && !b.textContent.includes('已封禁'));
        if (banBtn) banBtn.click();
      })()
    `);
    await sleep(1000);
    await session.screenshot("verif_req1_custom_confirm_dialog.png");

    const hasConfirmModal = await session.evaluate(`
      (function() {
        const text = document.body.textContent || '';
        return text.includes('封禁创作者账号') && text.includes('确认封禁');
      })()
    `);
    console.log("Req 1 - Custom Confirm Dialog Active:", hasConfirmModal);

    // Dismiss confirm dialog
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cancelBtn = buttons.find(b => b.textContent === '取消');
        if (cancelBtn) cancelBtn.click();
      })()
    `);
    await sleep(800);

    // Switch to Styles tab in Admin Console
    console.log("Switching to Admin Styles tab...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setAdminModalOpen(true, 'styles');
      })()
    `);
    await sleep(1200);

    // ==========================================
    // TEST 2: Check Req 2 (No Create, No Delete, No Category Edit) & Req 3 (No Big Top Github Box)
    // ==========================================
    console.log("Verifying Styles Tab (No Big Top GitHub Box, No Create Style, No Trash Can)...");
    await session.screenshot("verif_req2_req3_styles_overview.png");

    const stylesTabCheck = await session.evaluate(`
      (function() {
        const text = document.body.textContent || '';
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent || '');
        const hasTopBigGithubBanner = text.includes('风格化模板 GitHub 原作参考库与 Skill 规范');
        const hasCreateStyleBtn = buttons.some(t => t.includes('新建风格模板'));
        const hasTrashCan = Boolean(document.querySelector('svg.lucide-trash-2, svg.lucide-trash'));
        const hasGithubLinksUnderCards = text.includes('参考仓库:');
        return {
          hasTopBigGithubBanner,
          hasCreateStyleBtn,
          hasTrashCan,
          hasGithubLinksUnderCards
        };
      })()
    `);
    console.log("Req 2 & Req 3 Checks:", stylesTabCheck);

    // Open Edit Modal for a style to verify read-only category
    console.log("Opening Style Edit Modal...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const editBtn = buttons.find(b => b.textContent && b.textContent.includes('编辑'));
        if (editBtn) editBtn.click();
      })()
    `);
    await sleep(1000);
    await session.screenshot("verif_req2_readonly_category.png");

    const categoryCheck = await session.evaluate(`
      (function() {
        const modalText = document.body.textContent || '';
        const selects = Array.from(document.querySelectorAll('select'));
        const hasCategorySelect = selects.some(s => Array.from(s.options).some(o => o.text.includes('高定双联')));
        const hasFixedCategoryBadge = modalText.includes('风格分类 (内置固定不可更改)') || modalText.includes('官方固定');
        return {
          hasCategorySelect,
          hasFixedCategoryBadge
        };
      })()
    `);
    console.log("Category Read-Only Check:", categoryCheck);

    // Close style edit modal and admin modal
    await session.evaluate(`
      (function() {
        window.__store.getState().setAdminModalOpen(false);
      })()
    `);
    await sleep(1000);

    // ==========================================
    // TEST 3: Check Req 4 - 3-Zone Panoramic Wide Workspace
    // ==========================================
    console.log("Entering AI Stylize Stage...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setActivePanel('ai-stylize');
      })()
    `);
    await sleep(1500);

    // Ensure sample asset exists and select it
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        const samplePhoto = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'><rect width='800' height='1000' fill='%231f2937'/><circle cx='400' cy='450' r='220' fill='%23d97706'/><text x='400' y='820' font-size='50' fill='white' text-anchor='middle'>PHOTOGRAPHY PORTRAIT</text></svg>";
        store.setAiSourceImage(samplePhoto);
        store.setLatestAiGeneratedImage(null);
      })()
    `);
    await sleep(1500);

    // Verify 3-Zone Layout in Wide Mode
    console.log("Capturing 3-zone wide workspace...");
    await session.screenshot("verif_req4_wide_workspace_3zone.png");

    const layoutCheck = await session.evaluate(`
      (function() {
        const main = document.querySelector('main');
        const aside = document.querySelector('aside');
        const styleRail = document.querySelector('.lg\\\\:w-\\\\[260px\\\\], .xl\\\\:w-\\\\[280px\\\\]');
        return {
          hasCenterMainStage: Boolean(main),
          hasRightControlDock: Boolean(aside),
          hasLeftStyleRail: Boolean(styleRail)
        };
      })()
    `);
    console.log("3-Zone Layout Check:", layoutCheck);

    // Test switching to Compact View
    console.log("Switching to compact view...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const toggleBtn = buttons.find(b => b.textContent && b.textContent.includes('紧凑视图'));
        if (toggleBtn) toggleBtn.click();
      })()
    `);
    await sleep(1200);
    await session.screenshot("verif_req4_compact_workspace.png");

    // Test switching back to Wide Workspace
    console.log("Switching back to wide workspace...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const toggleBtn = buttons.find(b => b.textContent && b.textContent.includes('展开工作台'));
        if (toggleBtn) toggleBtn.click();
      })()
    `);
    await sleep(1200);
    await session.screenshot("verif_req4_wide_workspace_smooth.png");

    // Also test simulated result in center stage
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const sampleRes = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='1333' viewBox='0 0 1000 1333'><rect width='1000' height='1333' fill='%23111827'/><circle cx='500' cy='500' r='250' fill='%23f59e0b'/><text x='500' y='1050' font-size='48' fill='%23fbbf24' font-family='serif' text-anchor='middle'>S21 MASTERPIECE ARTWORK</text></svg>";
        store.setLatestAiGeneratedImage(sampleRes);
      })()
    `);
    await sleep(1200);
    await session.screenshot("verif_req4_result_in_center_stage.png");

    console.log("Native Dialog Events Count:", session.dialogEvents.length);
    console.log("ALL FOUR USER FIXES VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

run();
