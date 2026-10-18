import { spawn } from "child_process";
import fs from "fs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9447",
    "--user-data-dir=/tmp/chrome-admin-scroll",
    "--window-size=1560,1100",
    "about:blank",
  ]);

  let tab = null;
  for (let i = 0; i < 50; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9447/json/list");
      const tabs = await res.json();
      if (Array.isArray(tabs) && tabs.length > 0) {
        tab = tabs.find((t) => t.type === "page") || tabs[0];
        if (tab && tab.webSocketDebuggerUrl) break;
      }
    } catch (e) {}
  }

  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expr) {
    const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
    return res.result ? res.result.value : undefined;
  }

  async function screenshot(filepath) {
    const res = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filepath, Buffer.from(res.data, "base64"));
    console.log("Saved:", filepath);
  }

  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("DOM.enable");
    await send("Page.navigate", { url: "http://127.0.0.1:3001" });
    await sleep(2000);

    // Login and open admin modal on styles tab
    await evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
        await store.fetchAiStyles(true);
        store.setAdminModalOpen(true, 'styles');
      })()
    `);
    await sleep(2000);

    // 1. Scroll container so Style 5, 6, 7, 8 are in full view
    await evaluate(`
      (function() {
        const containers = Array.from(document.querySelectorAll('.overflow-y-auto'));
        // Find the active tab container in modal
        const mainContainer = containers.find(c => c.textContent && c.textContent.includes('文化碎片海报'));
        if (mainContainer) {
          mainContainer.scrollTop = 460;
        }
      })()
    `);
    await sleep(1200);
    await screenshot("admin_scrolled_1_styles_5_to_8.png");

    // 2. Scroll more to see bottom disabled styles
    await evaluate(`
      (function() {
        const containers = Array.from(document.querySelectorAll('.overflow-y-auto'));
        const mainContainer = containers.find(c => c.textContent && c.textContent.includes('文化碎片海报'));
        if (mainContainer) {
          mainContainer.scrollTop = 900;
        }
      })()
    `);
    await sleep(1200);
    await screenshot("admin_scrolled_2_styles_bottom.png");

    // 3. Click "编辑" on Style 5 (文化碎片海报)
    console.log("Clicking Edit button on Style 5...");
    await evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const style5Card = Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('文化碎片海报') && d.textContent.includes('梵想美学'));
        if (style5Card) {
          const editBtn = Array.from(style5Card.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('编辑'));
          if (editBtn) editBtn.click();
        }
      })()
    `);
    await sleep(1500);
    await screenshot("admin_edit_modal_style5_culture_fragment.png");

    // 4. Test copying the GitHub URL from Culture Fragment Poster card
    console.log("Testing copy URL from banner card...");
    await evaluate(`
      (function() {
        const copyBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('复制'));
        if (copyBtns.length >= 4) {
          copyBtns[3].click(); // Culture fragment card copy btn
        }
      })()
    `);
    await sleep(800);
    await screenshot("admin_copy_button_clicked.png");

    console.log("Done successfully!");
  } finally {
    ws.close();
    proc.kill("SIGKILL");
  }
}

run();
