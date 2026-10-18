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
     await sleep(800);
   }
 }
 
 async function run() {
   console.log("==================================================");
   console.log("  STARTING AI STYLIZE ENGINE & IMAGE2 QA TEST");
   console.log("==================================================");
 
   const browser = new BrowserSession(9971, "/tmp/chrome_ai_qa");
   await browser.start();
   await sleep(1500);
 
   console.log("[1] Logging into Studio as Atelier Pro...");
   await browser.eval(`
     (async () => {
       const store = window.__store.getState();
       await store.login("atelier", "123456");
     })()
   `);
   await sleep(1000);
 
   console.log("[2] Switching to AI Stylize Panel...");
   await browser.eval(`
     window.__store.getState().setActivePanel("ai-stylize");
   `);
   await sleep(800);
 
   await browser.screenshot("ai_stylize_qa_1_panel_overview.png");
 
   console.log("[3] Opening AI Model Configuration Modal...");
   await browser.eval(`
     window.__store.getState().setAiSettingsModalOpen(true);
   `);
   await sleep(800);
 
   await browser.screenshot("ai_stylize_qa_2_settings_modal.png");
 
   console.log("[4] Closing Settings Modal & selecting sample photo...");
   await browser.eval(`
     window.__store.getState().setAiSettingsModalOpen(false);
     const sampleBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("雪山高原"));
     if (sampleBtn) sampleBtn.click();
   `);
   await sleep(800);
 
   await browser.screenshot("ai_stylize_qa_3_source_photo_selected.png");
 
  console.log("[5] Inspecting Canvas image selection and property panel...");
  await browser.eval(`
    (() => {
      const store = window.__store.getState();
      const imgEl = store.document.elements.find(e => e.type === "image");
      if (imgEl) {
        store.selectElements([imgEl.id]);
      }
    })()
  `);
  await sleep(800);

  await browser.screenshot("ai_stylize_qa_4_image_selected_with_ai_btn.png");

  console.log("[6] Triggering AI Stylize Modal from canvas...");
  await browser.eval(`
    (() => {
      const store = window.__store.getState();
      store.openAiStylizeModal();
    })()
  `);
  await sleep(800);
 
   await browser.screenshot("ai_stylize_qa_5_ai_stylize_modal_active.png");
 
   await browser.close();
 
   console.log("==================================================");
   console.log("  ALL AI STYLIZE QA TESTS COMPLETED SUCCESSFULLY!");
   console.log("==================================================");
 }
 
 run().catch((err) => {
   console.error("Test failed with error:", err);
   process.exit(1);
 });
