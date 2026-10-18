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
  const browser = new BrowserSession(9345, "/tmp/chrome_github_qa");
  try {
    await browser.start();
    await sleep(1500);

    // 1. Log in as admin
    await browser.eval(`
      return window.__store.getState().login("admin", "admin123");
    `);
    await sleep(1200);

    // 2. Open Admin Management Modal on the "styles" tab
    await browser.eval(`
      window.__store.getState().setAdminModalOpen(true, "styles");
    `);
    await sleep(1200);

    // Take screenshot of styles tab with GitHub Reference Repositories Banner & Style cards
    await browser.screenshot("admin_github_1_styles_tab_overview.png");

    // Scroll down slightly to see the cards with GitHub badges
    await browser.eval(`
      const modalBody = document.querySelector(".fixed.inset-0 .overflow-y-auto");
      if (modalBody) modalBody.scrollTop = 220;
    `);
    await sleep(600);
    await browser.screenshot("admin_github_2_cards_with_github_badges.png");

    // 3. Open Edit Style submodal for FANTASY · 奇奇怪怪
    await browser.eval(`
      const editBtns = Array.from(document.querySelectorAll("button")).filter(b => b.innerText.includes("编辑"));
      if (editBtns.length >= 2) {
        editBtns[1].click(); // Click Edit on second style (Fantasy)
      } else if (editBtns.length > 0) {
        editBtns[0].click();
      }
    `);
    await sleep(800);

    // Take screenshot of Edit Style Modal showing the new GitHub URL field
    await browser.screenshot("admin_github_3_edit_modal_github_field.png");

    console.log("All GitHub reference verification steps completed!");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
