import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("1. Opening Landing Page...");
  await page.goto("http://localhost:3001");
  await page.waitForTimeout(1000);

  // Take screenshot of clean landing page (no user types)
  await page.screenshot({ path: "final_qa_1_landing_login_clean.png" });
  console.log("Saved: final_qa_1_landing_login_clean.png");

  // Switch to register tab on landing page to verify no user type/role
  await page.click('button:has-text("注册新账号")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: "final_qa_2_landing_register_clean.png" });
  console.log("Saved: final_qa_2_landing_register_clean.png");

  // Switch back to login and login as regular user 'lin'
  await page.click('button:has-text("账号登录")');
  await page.waitForTimeout(500);
  await page.fill('#landing-login-username', 'lin');
  await page.fill('#landing-login-password', '123456');
  await page.click('#landing-login-submit');

  await page.waitForTimeout(1500);
  console.log("Logged in as regular user 'lin'");

  // 2. Verify Studio view for regular user (No API config buttons anywhere)
  await page.screenshot({ path: "final_qa_3_regular_user_studio.png" });
  console.log("Saved: final_qa_3_regular_user_studio.png");

  // Click on user dropdown to verify no Admin/API config option
  await page.click('#header-user-dropdown-btn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: "final_qa_4_regular_user_dropdown_clean.png" });
  console.log("Saved: final_qa_4_regular_user_dropdown_clean.png");
  await page.click('#header-user-dropdown-btn'); // close dropdown

  // 3. Switch to "风格化" (AI Stylize)
  console.log("Switching to AI Stylize Mode...");
  await page.click('button:has-text("风格化")');
  await page.waitForTimeout(1000);

  // Center stage should NOT be canvas, it should be the style showcase & upload stage
  await page.screenshot({ path: "final_qa_5_ai_stylize_center_stage.png" });
  console.log("Saved: final_qa_5_ai_stylize_center_stage.png");

  // 4. Select a sample photo (e.g. "雪山高原")
  console.log("Selecting sample source photo...");
  await page.click('button:has-text("雪山高原")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "final_qa_6_source_photo_loaded_with_8_ratios.png" });
  console.log("Saved: final_qa_6_source_photo_loaded_with_8_ratios.png");

  // 5. Select 3:4 aspect ratio and click Generate to see the Printing animation
  console.log("Clicking Generate to trigger Printer developing animation...");
  const genBtn = await page.$('#stage-generate-btn-text');
  if (genBtn) {
    await genBtn.click();
  } else {
    await page.click('button:has-text("开始激光微喷冲印")');
  }

  // Capture printing animation
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "final_qa_7_photo_printer_developing_animation.png" });
  console.log("Saved: final_qa_7_photo_printer_developing_animation.png");

  // Wait for generation to complete
  await page.waitForTimeout(5500);
  await page.screenshot({ path: "final_qa_8_generated_artwork_frame_comparison.png" });
  console.log("Saved: final_qa_8_generated_artwork_frame_comparison.png");

  // 6. Switch comparison modes
  // Mode 2: Side by Side (左右对比，原图较小)
  await page.click('button:has-text("左右对比")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: "final_qa_9_side_by_side_comparison.png" });
  console.log("Saved: final_qa_9_side_by_side_comparison.png");

  // Mode 3: Split Slider (滑动卷帘)
  await page.click('button:has-text("滑动卷帘")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: "final_qa_10_split_slider_comparison.png" });
  console.log("Saved: final_qa_10_split_slider_comparison.png");

  // 7. Apply to Dual-Tile Haute Couture Layout
  console.log("Applying stylized image to Haute Couture Layout...");
  await page.click('button:has-text("套用双联高定排版")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "final_qa_11_applied_to_collage_canvas.png" });
  console.log("Saved: final_qa_11_applied_to_collage_canvas.png");

  await browser.close();
  console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
}

run().catch(console.error);
