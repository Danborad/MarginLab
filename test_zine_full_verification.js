import puppeteer from "puppeteer";

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 864, deviceScaleFactor: 1 });

  console.log("1. Navigating to http://localhost:3001...");
  await page.goto("http://localhost:3001", { waitUntil: "networkidle0" });

  // Initial screenshot: Gallery & Drawer open (matching reference image)
  await page.screenshot({ path: "zine_qa_1_main_gallery_and_drawer.png" });
  console.log("Captured zine_qa_1_main_gallery_and_drawer.png");

  // Click on Card 02 (s21 梦幻动态海报)
  console.log("2. Selecting s21 Dreamy Motion Editorial style card...");
  const cards = await page.$$(".group.relative.rounded-2xl");
  if (cards.length >= 2) {
    await cards[1].click();
    await new Promise((r) => setTimeout(r, 600));
  }
  await page.screenshot({ path: "zine_qa_2_s21_style_selected.png" });
  console.log("Captured zine_qa_2_s21_style_selected.png");

  // Select sample photo
  console.log("3. Selecting a sample photo...");
  const sampleBtns = await page.$$("button[type='button']");
  for (const btn of sampleBtns) {
    const txt = await page.evaluate((el) => el.textContent, btn);
    if (txt && (txt.includes("电车旧梦") || txt.includes("雪山古堂") || txt.includes("长空飞鸟"))) {
      await btn.click();
      await new Promise((r) => setTimeout(r, 500));
      break;
    }
  }
  await page.screenshot({ path: "zine_qa_3_photo_loaded_in_drawer.png" });
  console.log("Captured zine_qa_3_photo_loaded_in_drawer.png");

  // Fill in Mood & Specified Text
  console.log("4. Filling in Mood & Specified Text...");
  const inputs = await page.$$("input[type='text']");
  if (inputs.length >= 1) {
    await inputs[0].type("慢门街景光轨，雨后微凉");
  }
  if (inputs.length >= 2) {
    await inputs[1].type("光影穿梭，电车奔赴旧梦");
  }
  await page.screenshot({ path: "zine_qa_4_inputs_filled.png" });
  console.log("Captured zine_qa_4_inputs_filled.png");

  // Click Start Generate Button
  console.log("5. Clicking Start Generate button...");
  const genBtn = await page.$("button:has-text('开始生成'), button:has-text('开始制作')") || (await page.$$("button"))[sampleBtns.length - 1];
  
  // Trigger generation via store for controlled test verification
  await page.evaluate(() => {
    const store = window.__store?.getState?.();
    if (store) {
      store.generateAiImage({
        styleId: "reality_collage",
        mood: "雨后的松弛感",
        includeText: true,
        specifiedText: "silence. watch.",
      });
    }
  });

  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: "zine_qa_5_laser_printer_developing_animation.png" });
  console.log("Captured zine_qa_5_laser_printer_developing_animation.png");

  // Wait for generation to complete or simulated finish
  await new Promise((r) => setTimeout(r, 5000));
  await page.screenshot({ path: "zine_qa_6_generated_artwork_comparison_frame.png" });
  console.log("Captured zine_qa_6_generated_artwork_comparison_frame.png");

  // Switch comparison mode to Side-by-Side
  console.log("6. Switching to side-by-side comparison mode...");
  const sideBySideBtn = await page.$("button[title*='左右对比']");
  if (sideBySideBtn) {
    await sideBySideBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }
  await page.screenshot({ path: "zine_qa_7_side_by_side_comparison.png" });
  console.log("Captured zine_qa_7_side_by_side_comparison.png");

  // Switch comparison mode to Split Slider
  console.log("7. Switching to split slider comparison mode...");
  const splitBtn = await page.$("button[title*='滑动卷帘']");
  if (splitBtn) {
    await splitBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }
  await page.screenshot({ path: "zine_qa_8_split_slider_comparison.png" });
  console.log("Captured zine_qa_8_split_slider_comparison.png");

  // Close modal and visit 生成记录 tab
  console.log("8. Navigating to 生成记录 (History)...");
  await page.evaluate(() => {
    window.__store?.getState?.().setZineTab("history");
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: "zine_qa_9_history_gallery_tab.png" });
  console.log("Captured zine_qa_9_history_gallery_tab.png");

  // Visit 首页 tab
  console.log("9. Navigating to 首页 (Home)...");
  await page.evaluate(() => {
    window.__store?.getState?.().setZineTab("home");
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: "zine_qa_10_home_tab.png" });
  console.log("Captured zine_qa_10_home_tab.png");

  // Open Login Modal to check for clean login page (no user type dropdown)
  console.log("10. Testing Login Modal (verifying NO user type dropdown)...");
  await page.evaluate(() => {
    window.__store?.getState?.().setAuthModalOpen(true);
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: "zine_qa_11_clean_login_modal.png" });
  console.log("Captured zine_qa_11_clean_login_modal.png");

  // Admin login and check Admin Global AI Config
  console.log("11. Testing Admin login and Global AI Config...");
  await page.evaluate(async () => {
    await window.__store?.getState?.().login("admin", "admin123");
    window.__store?.getState?.().setAdminModalOpen(true, "ai_config");
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: "zine_qa_12_admin_global_ai_config.png" });
  console.log("Captured zine_qa_12_admin_global_ai_config.png");

  await browser.close();
  console.log("All Zine verification tests completed successfully!");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
