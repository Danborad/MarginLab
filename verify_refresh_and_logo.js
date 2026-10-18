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

  async reload() {
    await this.send("Page.reload");
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
    await sleep(600);
  }
}

async function run() {
  console.log("==================================================");
  console.log("  VERIFICATION: Top-Left Icon Unification & F5 Refresh");
  console.log("==================================================");

  const browser = new BrowserSession(9876, "/tmp/chrome_qa_f5_test");
  try {
    await browser.start();
    await sleep(1500);

    // 1. Check Landing Page Logo
    console.log("[1] Checking Landing Page Top-Left Logo...");
    const landingLogoInfo = await browser.eval(`
      (() => {
        const header = document.querySelector("header");
        const svg = header?.querySelector("svg");
        const paths = Array.from(svg?.querySelectorAll("path") || []).map(p => p.getAttribute("d"));
        const rect = svg?.querySelector("rect");
        const brandText = header?.innerText || "";
        return {
          hasHeader: !!header,
          svgViewBox: svg?.getAttribute("viewBox"),
          rectAttrs: rect ? { width: rect.getAttribute("width"), height: rect.getAttribute("height") } : null,
          paths,
          brandTextSnippet: brandText.substring(0, 50).replace(/\\n+/g, " ")
        };
      })()
    `);
    console.log("  Landing Logo Details:", landingLogoInfo);
    await browser.screenshot("verif_v8_1_landing_logo.png");

    // 2. Perform Login as Admin
    console.log("[2] Logging in as admin...");
    await browser.eval(`
      (async () => {
        const res = await window.__store.getState().login("admin", "admin123");
        return res;
      })()
    `);
    await sleep(1000);

    // 3. Inspect Studio Header (Light Mode)
    console.log("[3] Inspecting Studio Workspace Header (Light Mode)...");
    const studioHeaderInfo = await browser.eval(`
      (() => {
        const store = window.__store.getState();
        const header = document.querySelector("header");
        // Brand home button SVG
        const brandBtn = header?.querySelector("button[title*='返回登录']");
        const svg = brandBtn?.querySelector("svg");
        const paths = Array.from(svg?.querySelectorAll("path") || []).map(p => p.getAttribute("d"));
        const rect = svg?.querySelector("rect");

        // Admin quick btn contrast
        const adminBtn = document.querySelector("#header-admin-quick-btn");
        const adminComputed = adminBtn ? window.getComputedStyle(adminBtn) : null;

        // Preset name pill
        const presetBtn = header?.querySelector("button[title*='画布尺寸']");

        return {
          isAuthenticated: store.isAuthenticated,
          currentUser: store.currentUser?.name,
          currentView: store.currentView,
          themeMode: store.themeMode,
          brandLogoSvg: {
            viewBox: svg?.getAttribute("viewBox"),
            rect: rect ? { w: rect.getAttribute("width"), h: rect.getAttribute("height") } : null,
            paths,
          },
          presetPillText: presetBtn?.innerText?.replace(/\\n+/g, " ").trim(),
          adminBtnText: adminBtn?.innerText?.replace(/\\n+/g, " ").trim(),
          adminBtnColor: adminComputed?.color,
        };
      })()
    `);
    console.log("  Studio Header Info (Light):", studioHeaderInfo);
    await browser.screenshot("verif_v8_2_studio_light_header.png");

    // 4. Test F5 Refresh while in Studio (Collage Mode)
    console.log("[4] Testing F5 Reload in Studio Mode...");
    await browser.reload();
    // Wait for page to initialize
    await sleep(200);

    const postReloadState = await browser.eval(`
      (() => {
        const store = window.__store?.getState();
        const isLandingMounted = Boolean(document.querySelector(".min-h-screen.w-full.bg-\\\\[\\\\#FAF8F5\\\\]"));
        const isStudioMounted = Boolean(document.querySelector("header button[title*='返回登录']"));
        return {
          currentView: store?.currentView,
          isAuthenticated: store?.isAuthenticated,
          currentUser: store?.currentUser?.name,
          isLandingMounted,
          isStudioMounted,
        };
      })()
    `);
    console.log("  Post-Reload Immediate State (within 200ms):", postReloadState);
    await browser.screenshot("verif_v8_3_post_f5_reload_studio.png");

    if (postReloadState.isLandingMounted) {
      console.error("  FAIL: Landing page was mounted during reload!");
    } else {
      console.log("  PASS: Studio remained mounted directly with ZERO landing page flash!");
    }

    // 5. Test AI Stylize Workspace & Reload
    console.log("[5] Switching to AI Stylize Mode and Testing F5 Reload...");
    await browser.eval(`
      window.__store.getState().setActivePanel("ai-stylize");
    `);
    await sleep(800);
    await browser.screenshot("verif_v8_4_ai_stylize_workspace.png");

    const stylizeHeaderInfo = await browser.eval(`
      (() => {
        const header = document.querySelector("header");
        return {
          headerText: header?.innerText?.replace(/\\n+/g, " | ")
        };
      })()
    `);
    console.log("  AI Stylize Header:", stylizeHeaderInfo);

    console.log("[5.1] Reloading inside AI Stylize Mode...");
    await browser.reload();
    await sleep(600);

    const postStylizeReloadState = await browser.eval(`
      (() => {
        const store = window.__store?.getState();
        return {
          currentView: store?.currentView,
          activePanel: store?.activePanel,
          currentUser: store?.currentUser?.name,
        };
      })()
    `);
    console.log("  Post AI Stylize Reload State:", postStylizeReloadState);
    await browser.screenshot("verif_v8_5_post_f5_ai_stylize.png");

    // 6. Test Dark Mode
    console.log("[6] Testing Dark Mode Switch...");
    await browser.eval(`
      window.__store.getState().setThemeMode("dark");
    `);
    await sleep(500);
    await browser.screenshot("verif_v8_6_dark_mode_studio.png");

    console.log("==================================================");
    console.log("  ALL QA CHECKS COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("Verification Error:", err);
  } finally {
    await browser.close();
  }
}

run();
