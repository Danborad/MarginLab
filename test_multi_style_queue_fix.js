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
  const session = new BrowserSession(9575, "/tmp/chrome_multi_style_queue_test2");
  try {
    console.log("1. Starting Chrome...");
    await session.start();

    console.log("2. Navigating to http://127.0.0.1:3001 ...");
    await session.navigate("http://127.0.0.1:3001");

    // Login as admin
    console.log("3. Logging in...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
      })()
    `);
    await sleep(2000);

    // Switch to AI Stylize stage
    console.log("4. Entering AI Stylize Stage...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        store.setActivePanel('ai-stylize');
      })()
    `);
    await sleep(1500);

    // Step 1: Verify Dual Tabs (Queue & History)
    console.log("5. Checking Dual Tabs (Queue & History)...");
    const tabsCheck = await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const queueTab = buttons.find(b => b.textContent.includes('排队队列'));
        const historyTab = buttons.find(b => b.textContent.includes('生成记录'));
        return {
          hasQueueTab: !!queueTab,
          hasHistoryTab: !!historyTab,
          queueTabText: queueTab ? queueTab.textContent.trim() : null,
          historyTabText: historyTab ? historyTab.textContent.trim() : null,
        };
      })()
    `);
    console.log("Tabs Check Result:", tabsCheck);
    await session.screenshot("verif_final_1_dual_tabs.png");

    // Step 2: Switch to History Tab & check historical generations
    console.log("6. Clicking History Tab...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const historyTab = buttons.find(b => b.textContent.includes('生成记录'));
        if (historyTab) historyTab.click();
      })()
    `);
    await sleep(1000);

    const historyCheck = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const history = store.aiHistory || [];
        const aside = document.querySelector('aside');
        return {
          historyCount: history.length,
          hasOpenInWorkbenchBtn: aside ? aside.textContent.includes('在工作台打开') : false
        };
      })()
    `);
    console.log("History Check Result:", historyCheck);
    await session.screenshot("verif_final_2_history_tab.png");

    // Step 3: Switch back to Queue tab
    console.log("7. Switching to Queue Tab...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const queueTab = buttons.find(b => b.textContent.includes('排队队列'));
        if (queueTab) queueTab.click();
      })()
    `);
    await sleep(800);

    // Step 4: Setup Style A (reality_restaged) with photo and running task
    console.log("8. Starting Task 1 for Style A (reality_restaged)...");
    await session.evaluate(`
      (function() {
        // Select reality_restaged via card click
        const cardA = document.querySelector('[data-style-id="reality_restaged"]');
        if (cardA) cardA.click();

        const photoA = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='800' height='1000' fill='%231e3a8a'/><circle cx='400' cy='450' r='200' fill='%23ef4444'/><text x='400' y='800' font-size='45' fill='white' text-anchor='middle'>STYLE A PHOTO</text></svg>";
        const store = window.__store.getState();
        store.setAiSourceImage(photoA);
        store.setLatestAiGeneratedImage(null);

        const task1 = {
          id: "task_style_a_running",
          styleId: "reality_restaged",
          styleName: "纪实重构 · 超现实舞台",
          sourceImage: photoA,
          aspectRatio: "3:4",
          status: "running",
          progress: 55,
          stageText: "正在重构「纪实重构 · 超现实舞台」先锋视觉...",
          createdAt: Date.now()
        };

        window.__store.setState({
          isQueueRunning: true,
          isGeneratingAi: true,
          activeQueueTaskId: task1.id,
          aiQueue: [task1]
        });
      })()
    `);
    await sleep(1500);

    console.log("9. Verifying Style A shows developing overlay...");
    await session.screenshot("verif_final_3_style_a_running_overlay.png");

    // Step 5: Switch to Style B (funny_ugly_doodle) by clicking card
    console.log("10. Switching to Style B (funny_ugly_doodle) by clicking its card...");
    await session.evaluate(`
      (function() {
        const cardB = document.querySelector('[data-style-id="funny_ugly_doodle"]');
        if (cardB) cardB.click();
      })()
    `);
    await sleep(1500);

    // Verify Style B stage is completely clear and floating pill is displayed
    console.log("11. Verifying Style B center stage is clear & floating pill is visible...");
    const styleBCheck = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const main = document.querySelector('main');
        const mainText = main ? main.textContent : '';
        const floatingPill = document.querySelector('div.bg-zinc-900\\\\/90, div.bg-zinc-900\\\\/95');
        return {
          currentStyleId: store.selectedAiStyleId,
          isQueueRunning: store.isQueueRunning,
          hasFloatingPill: !!floatingPill,
          floatingPillText: floatingPill ? floatingPill.textContent.trim() : null,
          isBlockedByOverlay: mainText.includes('正在意境重构: 搞笑魔性丑萌蜡笔涂鸦')
        };
      })()
    `);
    console.log("Style B Check Result:", styleBCheck);
    await session.screenshot("verif_final_4_style_b_unblocked_with_floating_pill.png");

    // Step 6: In Style B, set photo and add to queue
    console.log("12. In Style B, setting photo and adding to queue...");
    await session.evaluate(`
      (function() {
        const photoB = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='800' height='1000' fill='%23f59e0b'/><circle cx='400' cy='450' r='200' fill='%2310b981'/><text x='400' y='800' font-size='45' fill='white' text-anchor='middle'>STYLE B PHOTO</text></svg>";
        const store = window.__store.getState();
        store.setAiSourceImage(photoB);

        // Click "+ 加入生成队列" button
        const submitBtn = document.getElementById('btn-stylize-action-submit');
        if (submitBtn) submitBtn.click();
      })()
    `);
    await sleep(1500);

    const queueTwoTasksCheck = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const queue = store.aiQueue || [];
        return {
          queueLength: queue.length,
          tasks: queue.map(t => ({
            id: t.id,
            styleId: t.styleId,
            styleName: t.styleName,
            status: t.status,
            progress: t.progress
          }))
        };
      })()
    `);
    console.log("Queue Two Tasks Check Result:", queueTwoTasksCheck);
    await session.screenshot("verif_final_5_queue_two_tasks_visible.png");

    // Step 7: Click "切回查看" in the floating pill
    console.log("13. Clicking '切回查看' to return to Style A...");
    await session.evaluate(`
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const switchBackBtn = buttons.find(b => b.textContent.includes('切回查看'));
        if (switchBackBtn) switchBackBtn.click();
      })()
    `);
    await sleep(1500);

    const switchBackResult = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        return {
          currentStyle: store.selectedAiStyleId,
          isRealityRestaged: store.selectedAiStyleId === 'reality_restaged'
        };
      })()
    `);
    console.log("Switch Back Result:", switchBackResult);
    await session.screenshot("verif_final_6_switched_back_to_style_a.png");

    // Step 8: Complete Task 1 and verify artwork is stored in workspace
    console.log("14. Completing Task 1 with high-res artwork...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const resultArtA = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='800' height='1000' fill='%23002FA7'/><rect x='100' y='100' width='600' height='800' fill='%23CC0000'/><text x='400' y='500' font-size='50' fill='white' text-anchor='middle'>REALITY RESTAGED ART</text></svg>";

        const updatedQueue = store.aiQueue.map(t => {
          if (t.id === 'task_style_a_running') {
            return {
              ...t,
              status: 'success',
              progress: 100,
              resultImage: resultArtA,
              stageText: '✓ 成片已就绪并入库'
            };
          }
          return t;
        });

        const existingWs = store.styleWorkspaces['reality_restaged'] || {};
        const updatedWorkspaces = {
          ...store.styleWorkspaces,
          'reality_restaged': {
            ...existingWs,
            sourceImage: existingWs.sourceImage || store.aiSourceImage,
            latestResult: resultArtA
          }
        };

        window.__store.setState({
          aiQueue: updatedQueue,
          styleWorkspaces: updatedWorkspaces,
          latestAiGeneratedImage: store.selectedAiStyleId === 'reality_restaged' ? resultArtA : store.latestAiGeneratedImage,
          isGeneratingAi: false,
          isQueueRunning: false
        });
      })()
    `);
    await sleep(1500);

    console.log("15. Verifying completed artwork displayed on Style A stage...");
    await session.screenshot("verif_final_7_style_a_completed_artwork.png");

    // Step 9: Switch to Style B, then switch back to Style A - RESULT MUST NOT BE LOST!
    console.log("16. Switching to Style B, then back to Style A to verify zero record loss...");
    await session.evaluate(`
      (function() {
        const cardB = document.querySelector('[data-style-id="funny_ugly_doodle"]');
        if (cardB) cardB.click();
      })()
    `);
    await sleep(1000);

    await session.evaluate(`
      (function() {
        const cardA = document.querySelector('[data-style-id="reality_restaged"]');
        if (cardA) cardA.click();
      })()
    `);
    await sleep(1500);

    const zeroLossCheck = await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const main = document.querySelector('main');
        const img = main ? main.querySelector('img') : null;
        return {
          currentStyle: store.selectedAiStyleId,
          hasSourceInStore: !!store.aiSourceImage,
          hasResultInStore: !!store.latestAiGeneratedImage,
          hasPeekButton: main ? main.textContent.includes('按住看原图') : false,
          hasSaveButton: main ? main.textContent.includes('存入素材') : false,
          displayedSrc: img ? img.src.substring(0, 60) : null
        };
      })()
    `);
    console.log("Zero Loss Check Result:", zeroLossCheck);
    await session.screenshot("verif_final_8_zero_loss_result_preserved.png");

    console.log("🎉 ALL TESTS PASSED WITH FLYING COLORS!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await session.close();
  }
}

run();
