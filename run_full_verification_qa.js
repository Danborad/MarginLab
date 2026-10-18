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

    this.ws.addEventListener("message", (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        this.dialogEvents.push(msg.params);
        this.send("Page.handleJavaScriptDialog", { accept: true });
      }
    });

    await this.send("Page.enable");
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

  async navigate(url) {
    await this.send("Page.navigate", { url });
    await sleep(2500);
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
    console.log("Screenshot saved:", filename);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill("SIGTERM");
    await sleep(500);
  }
}

async function run() {
  const session = new BrowserSession(9550, "/tmp/chrome_full_qa");
  try {
    console.log("1. Starting Chrome...");
    await session.start();

    console.log("2. Navigating to http://127.0.0.1:3001 ...");
    await session.navigate("http://127.0.0.1:3001");

    // QA Check 1: Login Page has NO user type
    console.log("Checking Login Page...");
    const loginPageCheck = await session.evaluate(`
      (function() {
        const text = document.body.textContent || '';
        const selects = Array.from(document.querySelectorAll('select'));
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const mentionsUserType = text.includes('用户类型') || text.includes('选择角色') || text.includes('身份选择');
        return {
          hasUsernameInput: Boolean(document.getElementById('landing-login-username')),
          hasPasswordInput: Boolean(document.getElementById('landing-login-password')),
          hasUserTypeSelect: selects.length > 0,
          hasUserTypeRadio: radios.length > 0,
          mentionsUserType
        };
      })()
    `);
    console.log("Login Page Check:", loginPageCheck);
    await session.screenshot("qa_verif_1_landing_no_usertype.png");

    // Login as ordinary user
    console.log("Logging in as regular user...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('photographer', 'photo123');
        store.setCurrentView('studio');
      })()
    `);
    await sleep(2000);

    // QA Check 2: Regular user studio has NO custom API functionality
    console.log("Checking Regular User Studio for Custom API...");
    const regularUserApiCheck = await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent || '');
        const hasCustomApiBtn = buttons.some(t => t.includes('API 设置') || t.includes('自定义 API') || t.includes('模型配置'));
        const hasAdminBtn = buttons.some(t => t.includes('系统管理') || t.includes('管理后台'));
        return {
          hasCustomApiBtn,
          hasAdminBtn,
          currentUser: window.__store ? window.__store.getState().currentUser?.name : null
        };
      })()
    `);
    console.log("Regular User Studio Check:", regularUserApiCheck);
    await session.screenshot("qa_verif_2_regular_user_clean_studio.png");

    // Logout and login as admin
    console.log("Switching to admin user...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        store.logout();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
      })()
    `);
    await sleep(2000);

    // Open Admin Console
    console.log("Opening Admin Console...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setAdminModalOpen(true, 'users');
      })()
    `);
    await sleep(1500);

    // QA Check 3: In-App Confirmation Dialog (No native window.alert/confirm)
    console.log("Triggering ban action for custom in-app confirm dialog...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const banBtn = buttons.find(b => b.textContent && b.textContent.includes('封禁'));
        if (banBtn) banBtn.click();
      })()
    `);
    await sleep(1000);
    await session.screenshot("qa_verif_3_admin_custom_confirm_modal.png");

    const confirmModalCheck = await session.evaluate(`
      (function() {
        const modalText = document.body.textContent || '';
        return {
          hasConfirmModalTitle: modalText.includes('封禁创作者账号'),
          hasConfirmDesc: modalText.includes('封禁后该账号将无法登录工作台'),
          hasCancelBtn: modalText.includes('取消'),
          hasConfirmActionBtn: modalText.includes('确认封禁')
        };
      })()
    `);
    console.log("In-App Confirm Dialog Check:", confirmModalCheck);

    // Close confirm dialog
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cancelBtn = buttons.find(b => b.textContent && b.textContent.trim() === '取消');
        if (cancelBtn) cancelBtn.click();
      })()
    `);
    await sleep(800);

    // QA Check 4: Styles Tab (No Top GitHub Banner, No Create Button, No Trash Can, GitHub Urls under cards)
    console.log("Checking Admin Styles Tab...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setAdminModalOpen(true, 'styles');
      })()
    `);
    await sleep(1500);

    const stylesTabCheck = await session.evaluate(`
      (function() {
        const modalText = document.body.textContent || '';
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent || '');
        const hasTopBigGithubBanner = modalText.includes('GitHub 原作参考库与 Skill 规范') || modalText.includes('8 项经典开源排版与风格化仓库');
        const hasCreateStyleBtn = buttons.some(t => t.includes('新建风格模板') || t.includes('添加风格'));
        const trashIcons = document.querySelectorAll('svg.lucide-trash2, svg.lucide-trash');
        const githubLinks = Array.from(document.querySelectorAll('a')).filter(a => a.textContent && a.textContent.includes('参考仓库:'));
        return {
          hasTopBigGithubBanner,
          hasCreateStyleBtn,
          hasTrashCan: trashIcons.length > 0,
          githubLinkCount: githubLinks.length
        };
      })()
    `);
    console.log("Styles Tab Cleanliness Check:", stylesTabCheck);
    await session.screenshot("qa_verif_4_admin_styles_no_top_github_no_create_no_delete.png");

    // QA Check 5: Style Edit Modal - Read-Only Category
    console.log("Opening Style Edit Modal...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const editBtn = buttons.find(b => b.textContent && b.textContent.includes('编辑'));
        if (editBtn) editBtn.click();
      })()
    `);
    await sleep(1500);

    const editModalCheck = await session.evaluate(`
      (function() {
        const modalText = document.body.textContent || '';
        const form = document.querySelector('form');
        const selectsInForm = form ? Array.from(form.querySelectorAll('select')) : [];
        return {
          hasReadOnlyCategoryTitle: modalText.includes('风格分类 (内置固定不可更改)'),
          hasFixedBadge: modalText.includes('官方固定'),
          hasSelectInForm: selectsInForm.length > 0,
          hasGithubUrlInput: Boolean(document.querySelector('input[type="url"]'))
        };
      })()
    `);
    console.log("Style Edit Modal Check:", editModalCheck);
    await session.screenshot("qa_verif_5_admin_style_readonly_category.png");

    // Close admin modal
    await session.evaluate(`
      (function() {
        window.__store.getState().setAdminModalOpen(false);
      })()
    `);
    await sleep(1000);

    // QA Check 6: Stylize Studio Stage 3-Zone Panoramic Studio
    console.log("Entering AI Stylize 3-Zone Panoramic Studio...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        store.setActivePanel('ai-stylize');
        const samplePhoto = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'><rect width='800' height='1000' fill='%231f2937'/><circle cx='400' cy='450' r='220' fill='%23d97706'/><text x='400' y='820' font-size='50' fill='white' text-anchor='middle'>PHOTOGRAPHY PORTRAIT</text></svg>";
        store.setAiSourceImage(samplePhoto);
        store.setLatestAiGeneratedImage(null);
      })()
    `);
    await sleep(1500);

    const stylize3ZoneCheck = await session.evaluate(`
      (function() {
        const main = document.querySelector('main');
        const aside = document.querySelector('aside');
        const styleRail = document.querySelector('.lg\\\\:w-\\\\[260px\\\\], .xl\\\\:w-\\\\[280px\\\\]');
        return {
          hasCenterStage: Boolean(main),
          hasRightDock: Boolean(aside),
          hasLeftRail: Boolean(styleRail)
        };
      })()
    `);
    console.log("Stylize 3-Zone Check:", stylize3ZoneCheck);
    await session.screenshot("qa_verif_6_stylize_3zone_panoramic_studio.png");

    console.log("Native Dialog Events Count across entire run:", session.dialogEvents.length);
    console.log("FULL QA VERIFICATION COMPLETE!");
  } catch (err) {
    console.error("QA failed:", err);
  } finally {
    await session.close();
  }
}

run();
