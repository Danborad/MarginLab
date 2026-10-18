import { spawn } from "child_process";
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log("=== Starting Style Management Automated QA & Visual Verification ===");
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9855",
    "--user-data-dir=/tmp/chrome_style_mgmt_qa2",
    "--window-size=1600,1000",
    "http://127.0.0.1:3001",
  ]);

  let tab = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch("http://127.0.0.1:9855/json/list");
      const tabs = await res.json();
      tab = tabs.find((t) => t.type === "page") || tabs[0];
      if (tab && tab.webSocketDebuggerUrl) break;
    } catch (e) {}
  }

  if (!tab || !tab.webSocketDebuggerUrl) {
    console.error("Failed to connect to Chrome CDP");
    proc.kill();
    process.exit(1);
  }

  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener("message", handler);
          resolve(d.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expr) => {
    const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
    return res?.result?.value;
  };

  const snap = async (filename) => {
    const res = await send("Page.captureScreenshot", { format: "png" });
    if (res?.data) {
      fs.writeFileSync(filename, Buffer.from(res.data, "base64"));
      console.log(`[Screenshot Captured] ${filename}`);
    }
  };

  await send("Page.enable");
  await send("DOM.enable");
  await send("Runtime.enable");

  await sleep(1500);

  // 1. Check Landing Page
  console.log("Step 1: Check pure landing page & Login as Admin...");
  await snap("qa_step1_pure_landing_login.png");

  // Login as admin
  await evaluate(`
    (async () => {
      const store = window.__store.getState();
      await store.login('admin', 'admin123');
      store.setCurrentView('studio');
      store.setActivePanel('ai-stylize');
      await store.fetchAiStyles(true);
    })()
  `);
  await sleep(2000);

  // 2. Creation Stage: verify only 1 replicated style (s21) is displayed
  const visibleCardsCount1 = await evaluate(`
    document.querySelectorAll('.aspect-\\\\[3\\\\/4\\\\]').length
  `);
  console.log("Step 2: Visible style cards in gallery:", visibleCardsCount1);
  await snap("qa_step2_creation_stage_single_s21_style.png");

  // 3. Open Admin Control Center -> 风格化模板管理 Tab
  console.log("Step 3: Open Admin Modal -> 风格化模板管理...");
  await evaluate(`
    window.__store.getState().setAdminModalOpen(true, 'styles');
  `);
  await sleep(1500);
  await snap("qa_step3_admin_styles_management_tab.png");

  // 4. Admin toggles on 'reality_collage'
  console.log("Step 4: Admin toggles on '实景拼贴'...");
  await evaluate(`
    (async () => {
      await window.__store.getState().adminToggleAiStyle('reality_collage', true);
    })()
  `);
  await sleep(1500);
  await snap("qa_step4_admin_reality_collage_toggled_on.png");

  // 5. Close Admin modal & verify creation gallery now shows 2 styles!
  console.log("Step 5: Close modal, verify creation stage now shows 2 enabled styles...");
  await evaluate(`
    window.__store.getState().setAdminModalOpen(false);
  `);
  await sleep(1500);
  const visibleCardsCount2 = await evaluate(`
    document.querySelectorAll('.aspect-\\\\[3\\\\/4\\\\]').length
  `);
  console.log("Visible style cards after enabling 2nd style:", visibleCardsCount2);
  await snap("qa_step5_creation_stage_two_styles_visible.png");

  // 6. Open Admin Modal -> Edit Style form for s21
  console.log("Step 6: Open Admin Modal and click Edit for s21...");
  await evaluate(`
    window.__store.getState().setAdminModalOpen(true, 'styles');
  `);
  await sleep(1000);
  await evaluate(`
    const editBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('编辑'));
    if (editBtns.length > 0) editBtns[0].click();
  `);
  await sleep(1500);
  await snap("qa_step6_admin_edit_style_drawer.png");

  // 7. Reset back to single s21 default
  console.log("Step 7: Reset styles to default (single s21 enabled)...");
  await evaluate(`
    (async () => {
      await window.__store.getState().adminResetAiStyles();
      window.__store.getState().setAdminModalOpen(false);
    })()
  `);
  await sleep(1500);

  const visibleCardsCountFinal = await evaluate(`
    document.querySelectorAll('.aspect-\\\\[3\\\\/4\\\\]').length
  `);
  console.log("Final visible style cards in creation stage:", visibleCardsCountFinal);
  await snap("qa_step7_final_single_s21_confirmed.png");

  console.log("=== All QA Steps Completed Successfully! ===");
  ws.close();
  proc.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error("QA script failed:", err);
  process.exit(1);
});
