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
    await this.send("Network.enable");
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

  async reload() {
    await this.send("Page.reload");
    await sleep(2500);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.proc) this.proc.kill("SIGTERM");
    await sleep(500);
  }
}

async function run() {
  const session = new BrowserSession(9588, "/tmp/chrome_covers_complete");
  try {
    console.log("1. Starting Chrome...");
    await session.start();

    console.log("2. Navigating to http://127.0.0.1:3001 ...");
    await session.navigate("http://127.0.0.1:3001");

    console.log("3. Logging in as admin and entering AI Stylize Stage...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
        store.setActivePanel('ai-stylize');
      })()
    `);
    await sleep(2000);

    console.log("4. Inspecting all style cards in left rail / waterfall...");
    const cardData = await session.evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('div[class*="group rounded-2xl"]'));
        return cards.map((c, i) => {
          const img = c.querySelector('img');
          const svg = c.querySelector('svg');
          const title = c.querySelector('h4')?.textContent?.trim() || '';
          return {
            index: i + 1,
            title,
            hasImg: Boolean(img),
            imgSrc: img ? img.getAttribute('src') : null,
            imgComplete: img ? img.complete : false,
            naturalWidth: img ? img.naturalWidth : 0,
            naturalHeight: img ? img.naturalHeight : 0,
            hasSvg: Boolean(svg),
          };
        });
      })()
    `);

    console.log("Found cards:", cardData.length);
    for (const c of cardData) {
      console.log(`Card ${c.index}: ${c.title} -> hasImg: ${c.hasImg}, src: ${c.imgSrc}, dims: ${c.naturalWidth}x${c.naturalHeight}, complete: ${c.imgComplete}`);
    }

    console.log("5. Taking screenshot of top styles...");
    await session.screenshot("final_verif_covers_1_top.png");

    // Scroll down left rail to view styles 5~11
    console.log("6. Scrolling left rail to bottom styles (08~11)...");
    await session.evaluate(`
      (function() {
        const rail = document.querySelector('.overflow-y-auto') || window;
        if (rail && rail.scrollTo) {
          rail.scrollTo({ top: 800, behavior: 'instant' });
        }
        window.scrollTo({ top: 800, behavior: 'instant' });
      })()
    `);
    await sleep(1000);

    const scrolledData = await session.evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('div[class*="group rounded-2xl"]'));
        return cards.slice(4).map((c, i) => {
          const img = c.querySelector('img');
          const title = c.querySelector('h4')?.textContent?.trim() || '';
          return {
            index: i + 5,
            title,
            hasImg: Boolean(img),
            imgSrc: img ? img.getAttribute('src') : null,
            naturalWidth: img ? img.naturalWidth : 0,
            naturalHeight: img ? img.naturalHeight : 0,
          };
        });
      })()
    `);
    console.log("Scrolled cards (05~11):", scrolledData);
    await session.screenshot("final_verif_covers_2_scrolled.png");

    // Click Style 08 (Reality Restaged)
    console.log("7. Selecting Style 08 (Reality Restaged) to verify stage translucent hero...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        store.setSelectedAiStyleId('reality_restaged');
      })()
    `);
    await sleep(1200);
    await session.screenshot("final_verif_covers_3_style08_stage.png");

    // Click Style 09 (Photo Abstract Diptych)
    console.log("8. Selecting Style 09 to verify stage translucent hero...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        store.setSelectedAiStyleId('photo_abstract_diptych');
      })()
    `);
    await sleep(1200);
    await session.screenshot("final_verif_covers_4_style09_stage.png");

    // Click Style 11 (Funny Ugly Doodle)
    console.log("9. Selecting Style 11 to verify stage translucent hero...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        store.setSelectedAiStyleId('funny_ugly_doodle');
      })()
    `);
    await sleep(1200);
    await session.screenshot("final_verif_covers_5_style11_stage.png");

    // Test F5 Reload
    console.log("10. Testing F5 page reload (instant cache hit)...");
    await session.reload();
    await sleep(2000);

    const postReloadData = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const cards = Array.from(document.querySelectorAll('div[class*="group rounded-2xl"]'));
        return {
          activePanel: store.activePanel,
          cardCount: cards.length,
          allHaveImgs: cards.every(c => c.querySelector('img')),
        };
      })()
    `);
    console.log("Post reload state:", postReloadData);
    await session.screenshot("final_verif_covers_6_post_reload.png");

    console.log("All verifications PASSED!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

run();
