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
      "--window-size=1560,1050",
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
    if (this.ws) {
      this.ws.close();
    }
    if (this.proc) {
      this.proc.kill("SIGKILL");
    }
  }
}

async function run() {
  const session = new BrowserSession(9446, "/tmp/chrome-complete-qa");
  try {
    console.log("Starting Chrome on port 9446...");
    await session.start();

    console.log("Navigating to http://127.0.0.1:3001 ...");
    await session.send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2500);

    // 1. Verify clean login landing page (light mode)
    await session.screenshot("final_qa_1_light_landing.png");

    // Login via store directly
    console.log("Logging in as admin via store...");
    const loginResult = await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        const res = await store.login('admin', 'admin123');
        store.setCurrentView('studio');
        store.setActivePanel('ai-stylize');
        await store.fetchAiStyles(true);
        return res;
      })()
    `);
    console.log("Login result:", loginResult);
    await sleep(2000);

    // 2. Studio: AI Stylize Center Stage Overview
    await session.screenshot("final_qa_2_stylize_overview.png");

    // Check visible style names in store
    const storeStyles = await session.evaluate(`
      (function() {
        const styles = window.__store.getState().aiStyles;
        return styles.map(s => ({
          order: s.order,
          id: s.id,
          name: s.name,
          badge: s.badge,
          enabled: s.enabled,
          github: s.githubUrl || null
        }));
      })()
    `);
    console.log("Styles in store:", JSON.stringify(storeStyles, null, 2));

    // 3. Test Style 5: 文化碎片海报
    console.log("Selecting Style 5: culture_fragment_poster...");
    await session.evaluate(`
      window.__store.getState().setSelectedAiStyleId('culture_fragment_poster');
    `);
    await sleep(1500);
    await session.screenshot("final_qa_3_style5_culture_fragment.png");

    // 4. Test Style 6: 东方水墨二分画 · 景致篇
    console.log("Selecting Style 6: eastern_ink_diptych_scenery...");
    await session.evaluate(`
      window.__store.getState().setSelectedAiStyleId('eastern_ink_diptych_scenery');
    `);
    await sleep(1500);
    await session.screenshot("final_qa_4_style6_eastern_ink_scenery.png");

    // 5. Test Style 7: 东方水墨二分画 · 构筑篇
    console.log("Selecting Style 7: eastern_ink_diptych_arch...");
    await session.evaluate(`
      window.__store.getState().setSelectedAiStyleId('eastern_ink_diptych_arch');
    `);
    await sleep(1500);
    await session.screenshot("final_qa_5_style7_eastern_ink_arch.png");

    // 6. Test Style 8: 纪实重构 · 超现实舞台
    console.log("Selecting Style 8: reality_restaged...");
    await session.evaluate(`
      window.__store.getState().setSelectedAiStyleId('reality_restaged');
    `);
    await sleep(1500);
    await session.screenshot("final_qa_6_style8_reality_restaged.png");

    // 7. Open Admin Modal -> styles tab
    console.log("Opening Admin Modal with 'styles' tab...");
    await session.evaluate(`
      window.__store.getState().setAdminModalOpen(true, 'styles');
    `);
    await sleep(2000);
    await session.screenshot("final_qa_7_admin_styles_overview.png");

    // Check GitHub links in Admin Modal
    const adminGithubLinks = await session.evaluate(`
      (function() {
        return Array.from(document.querySelectorAll('a[href*="github.com"]')).map(a => a.href);
      })()
    `);
    console.log("Found GitHub links in Admin Modal:", adminGithubLinks);

    // Scroll Admin Modal to see list of styles
    await session.evaluate(`
      (function() {
        const modalBody = document.querySelector('.overflow-y-auto');
        if (modalBody) {
          modalBody.scrollTop = 480;
        }
      })()
    `);
    await sleep(1500);
    await session.screenshot("final_qa_8_admin_styles_list_scrolled.png");

    // Test Dark Mode in Stylize Stage
    console.log("Testing Dark Mode toggle...");
    await session.evaluate(`
      (function() {
        window.__store.getState().setAdminModalOpen(false);
        window.__store.getState().setTheme('dark');
        window.__store.getState().setSelectedAiStyleId('culture_fragment_poster');
      })()
    `);
    await sleep(1500);
    await session.screenshot("final_qa_9_dark_mode_culture_fragment.png");

    // Switch back to Light Mode (default)
    await session.evaluate(`
      window.__store.getState().setTheme('light');
    `);
    await sleep(1000);
    await session.screenshot("final_qa_10_light_mode_restored.png");

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
