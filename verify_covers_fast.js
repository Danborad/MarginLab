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
      "--window-size=1920,1080",
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
    await this.send("Network.enable");
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
      if (this.proc) this.proc.kill("SIGKILL");
    } catch (e) {}
  }
}

async function main() {
  const browser = new BrowserSession(46123, "/tmp/chrome_cover_test");
  try {
    console.log("Starting test browser session...");
    await browser.start();
    await sleep(2000);

    // Click Login as admin or demo
    console.log("Navigating to AI Stylize stage...");
    await browser.eval(`
      (() => {
        const store = window.__COLLAGE_STORE__?.getState?.();
        if (store) {
          // If not logged in, login demo user
          if (!store.currentUser) {
            store.login("admin@collage.local", "Admin@123456");
          }
          store.setActiveView("stylize");
        } else {
          // Click login button if on landing
          const btns = Array.from(document.querySelectorAll("button"));
          const demoBtn = btns.find(b => b.textContent.includes("快速体验") || b.textContent.includes("登录") || b.textContent.includes("进入工坊"));
          if (demoBtn) demoBtn.click();
        }
      })()
    `);
    await sleep(2000);

    // Make sure we are on stylize view
    await browser.eval(`
      (() => {
        const store = window.__COLLAGE_STORE__?.getState?.();
        if (store && store.activeView !== "stylize") {
          store.setActiveView("stylize");
        }
      })()
    `);
    await sleep(1500);

    // Inspect cards
    const cardInfo = await browser.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll(".group.rounded-2xl"));
        return cards.map((c, i) => {
          const img = c.querySelector("img");
          const svg = c.querySelector("svg");
          const title = c.querySelector("h4")?.textContent || "";
          return {
            index: i + 1,
            title,
            hasImg: Boolean(img),
            imgSrc: img ? img.src : null,
            imgComplete: img ? img.complete : false,
            imgNaturalWidth: img ? img.naturalWidth : 0,
            hasSvg: Boolean(svg),
          };
        });
      })()
    `);

    console.log("Card inspection results:", JSON.stringify(cardInfo, null, 2));

    await browser.screenshot("verif_covers_1_first_load.png");

    // Test F5 Refresh
    console.log("Testing F5 page reload (instant cache)...");
    await browser.reload();
    await sleep(1500);

    // Switch back to stylize view after reload
    await browser.eval(`
      (() => {
        const store = window.__COLLAGE_STORE__?.getState?.();
        if (store) {
          store.setActiveView("stylize");
        }
      })()
    `);
    await sleep(1500);

    const postReloadInfo = await browser.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll(".group.rounded-2xl"));
        return cards.map((c, i) => {
          const img = c.querySelector("img");
          return {
            index: i + 1,
            title: c.querySelector("h4")?.textContent || "",
            hasImg: Boolean(img),
            imgSrc: img ? img.src : null,
            imgComplete: img ? img.complete : false,
            imgNaturalWidth: img ? img.naturalWidth : 0,
          };
        });
      })()
    `);

    console.log("Post-reload card inspection results:", JSON.stringify(postReloadInfo, null, 2));
    await browser.screenshot("verif_covers_2_post_reload.png");

    // Scroll to bottom to view all 11 cards
    await browser.eval(`
      (() => {
        window.scrollTo({ top: 600, behavior: "instant" });
      })()
    `);
    await sleep(1000);
    await browser.screenshot("verif_covers_3_bottom_styles.png");

    console.log("Verification complete!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

main();
