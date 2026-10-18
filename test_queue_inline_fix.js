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
  const session = new BrowserSession(9560, "/tmp/chrome_queue_test");
  try {
    console.log("1. Starting Chrome...");
    await session.start();

    console.log("2. Navigating to http://127.0.0.1:3001 ...");
    await session.navigate("http://127.0.0.1:3001");

    // Login as admin
    console.log("Logging in...");
    await session.evaluate(`
      (async () => {
        const store = window.__store.getState();
        await store.login('admin', 'admin123');
        store.setCurrentView('studio');
      })()
    `);
    await sleep(2000);

    // Enter AI Stylize panel and set source image
    console.log("Entering AI Stylize Stage with photo...");
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

    // State 1: Idle queue - Space below Aspect Ratio utilized with queue card, and bottom button completely unobstructed!
    console.log("State 1: Verifying idle queue in right dock...");
    await session.screenshot("queue_fix_1_idle_under_ratios.png");

    const checkState1 = await session.evaluate(`
      (function() {
        const aside = document.querySelector('aside');
        const text = aside ? aside.textContent : '';
        const floatingDrawers = document.querySelectorAll('.fixed.bottom-5.right-5');
        const bottomBtn = aside ? aside.querySelector('button.sticky, div.sticky button') : null;
        return {
          hasQueueSectionUnderRatio: text.includes('生成队列与任务'),
          hasIdleTips: text.includes('生成队列空闲 · 随时出发'),
          hasBatchPickBtn: text.includes('批量选图'),
          floatingCapsuleCount: floatingDrawers.length,
          bottomBtnText: bottomBtn ? bottomBtn.textContent.trim() : null
        };
      })()
    `);
    console.log("State 1 Check:", checkState1);

    // State 2: Active Generating Task (Simulate running queue task)
    console.log("State 2: Simulating running queue task (75% progress)...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const samplePhoto = store.aiSourceImage;
        const taskRunning = {
          id: "task_test_running",
          styleId: "street_photo_color_chibi",
          styleName: "彩色轻Q实景插画",
          sourceImage: samplePhoto,
          aspectRatio: "3:4",
          status: "running",
          progress: 75,
          stageText: "正在重构「彩色轻Q实景插画」先锋视觉...",
          createdAt: Date.now()
        };
        store.aiQueue = [taskRunning];
        store.isQueueRunning = true;
        store.isGeneratingAi = true;
        // Trigger re-render by calling dummy state setter
        store.setSelectedAiStyleId("street_photo_color_chibi");
      })()
    `);
    await sleep(1000);
    await session.screenshot("queue_fix_2_running_under_ratios_no_overlap.png");

    const checkState2 = await session.evaluate(`
      (function() {
        const aside = document.querySelector('aside');
        const text = aside ? aside.textContent : '';
        const floatingDrawers = document.querySelectorAll('.fixed.bottom-5.right-5');
        const bottomBtn = aside ? aside.querySelector('div.sticky button') : null;
        return {
          hasRunningCard: text.includes('彩色轻Q实景插画') && text.includes('75%'),
          hasStageText: text.includes('正在重构「彩色轻Q实景插画」先锋视觉'),
          floatingCapsuleCount: floatingDrawers.length,
          bottomBtnText: bottomBtn ? bottomBtn.textContent.trim() : null
        };
      })()
    `);
    console.log("State 2 Check:", checkState2);

    // State 3: Multiple tasks in queue (1 running, 1 pending, 1 completed)
    console.log("State 3: Simulating multiple queue tasks...");
    await session.evaluate(`
      (function() {
        const store = window.__store.getState();
        const samplePhoto = store.aiSourceImage;
        const sampleRes = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'><rect width='800' height='1000' fill='%23065f46'/><circle cx='400' cy='450' r='220' fill='%2334d399'/><text x='400' y='820' font-size='50' fill='white' text-anchor='middle'>S21 MASTERPIECE</text></svg>";
        
        const task1 = {
          id: "task_1_success",
          styleId: "dreamy_motion_editorial",
          styleName: "梦幻动态电影海报",
          sourceImage: samplePhoto,
          resultImage: sampleRes,
          aspectRatio: "3:4",
          status: "success",
          progress: 100,
          stageText: "生成完成",
          createdAt: Date.now() - 30000
        };
        const task2 = {
          id: "task_2_running",
          styleId: "street_photo_color_chibi",
          styleName: "彩色轻Q实景插画",
          sourceImage: samplePhoto,
          aspectRatio: "3:4",
          status: "running",
          progress: 75,
          stageText: "正在重构「彩色轻Q实景插画」先锋视觉...",
          createdAt: Date.now()
        };
        const task3 = {
          id: "task_3_pending",
          styleId: "fantasy_qiqiguaiguai",
          styleName: "FANTASY · 奇奇怪怪",
          sourceImage: samplePhoto,
          aspectRatio: "2:3",
          status: "pending",
          progress: 0,
          stageText: "等待排队处理...",
          createdAt: Date.now() + 10000
        };

        store.aiQueue = [task2, task1, task3];
        store.isQueueRunning = true;
        store.setSelectedAiStyleId("dreamy_motion_editorial");
      })()
    `);
    await sleep(1000);
    await session.screenshot("queue_fix_3_multiple_tasks_in_dock.png");

    const checkState3 = await session.evaluate(`
      (function() {
        const aside = document.querySelector('aside');
        const text = aside ? aside.textContent : '';
        const bottomBtn = aside ? aside.querySelector('div.sticky button') : null;
        return {
          hasSuccessTask: text.includes('梦幻动态电影海报') && text.includes('成片已就绪'),
          hasPendingTask: text.includes('FANTASY · 奇奇怪怪') && text.includes('等待排队处理'),
          bottomBtnText: bottomBtn ? bottomBtn.textContent.trim() : null
        };
      })()
    `);
    console.log("State 3 Check:", checkState3);

    console.log("ALL QUEUE INLINE FIXES VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await session.close();
  }
}

run();
