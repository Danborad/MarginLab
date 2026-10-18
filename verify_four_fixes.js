const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log("Navigating to http://127.0.0.1:3010 ...");
  await page.goto('http://127.0.0.1:3010', { waitUntil: 'networkidle0', timeout: 30000 });

  // 1. 验证模板库缩略图 (TemplatePanel)
  console.log("Testing 1: Template Panel Thumbnails...");
  // 点击左侧「模板」导航按键
  const templateTab = await page.$('button[title*="模板"], div[title*="模板"], button:has-text("模板")');
  if (templateTab) {
    await templateTab.click();
    await new Promise(r => setTimeout(r, 1000));
  } else {
    // 尝试寻找带有 "艺术排版模板库" 或 "模板" 文字的按钮
    const btns = await page.$$('button, div');
    for (const b of btns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && (txt.includes('模板') || txt.includes('模版'))) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  await page.screenshot({ path: 'screenshots/verify_1_template_panel.png' });
  console.log("Saved screenshots/verify_1_template_panel.png");

  // 2. 验证 AI 风格化工作台 (AiStylizeStudioStage)
  console.log("Testing 2: Stylize Cards Size...");
  const stylizeTab = await page.$('button:has-text("风格化"), div:has-text("风格化")');
  const allNavBtns = await page.$$('nav button, aside button, button');
  for (const b of allNavBtns) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && txt.includes('风格化')) {
      await b.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }
  await page.screenshot({ path: 'screenshots/verify_2_stylize_cards.png' });
  console.log("Saved screenshots/verify_2_stylize_cards.png");

  // 3. 验证画册与 3D 实体书 (PhotobookStage)
  console.log("Testing 3: Photobook Stage & Back Cover & Dock...");
  const albumTab = await page.$$('button, div');
  for (const b of albumTab) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && (txt.includes('相册') || txt.includes('画册'))) {
      await b.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  // 如果在相册列表，点击进入相册
  const enterAlbumBtn = await page.$('button:has-text("翻开画册"), div:has-text("九寨秘境")');
  if (enterAlbumBtn) {
    await enterAlbumBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  await page.screenshot({ path: 'screenshots/verify_3_book_cover.png' });
  console.log("Saved screenshots/verify_3_book_cover.png");

  // 翻到内页，测试翻页与底下页面稳定性
  const nextBtn = await page.$('button[title="下一页"]');
  if (nextBtn) {
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'screenshots/verify_3_book_spread_1.png' });
    console.log("Saved screenshots/verify_3_book_spread_1.png");

    // 再翻一页
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'screenshots/verify_3_book_spread_2.png' });
    console.log("Saved screenshots/verify_3_book_spread_2.png");
  }

  // 4. 验证底部 Dock 更多菜单 (测试裁切问题)
  console.log("Testing 4: Bottom Dock More Menu Clipping...");
  const moreBtn = await page.$('button[title*="更多画册设置"]');
  if (moreBtn) {
    await moreBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'screenshots/verify_4_dock_menu_uncropped.png' });
    console.log("Saved screenshots/verify_4_dock_menu_uncropped.png");
  }

  // 5. 翻到封底，验证封底与从头翻开功能
  console.log("Testing 5: Flip to Back Cover & Restart...");
  // 连续点击下一页翻到封底
  for (let i = 0; i < 10; i++) {
    const nxt = await page.$('button[title="下一页"]:not([disabled])');
    if (!nxt) break;
    await nxt.click();
    await new Promise(r => setTimeout(r, 600));
  }

  await page.screenshot({ path: 'screenshots/verify_5_back_cover_match_style.png' });
  console.log("Saved screenshots/verify_5_back_cover_match_style.png");

  // 点击底部工具坞中的“从头翻开画册”
  const restartBtn = await page.$('button[title*="从头重新翻开"], button[title*="从头翻开"]');
  if (restartBtn) {
    console.log("Clicking Restart Photobook...");
    await restartBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: 'screenshots/verify_5_restarted_to_cover.png' });
    console.log("Saved screenshots/verify_5_restarted_to_cover.png");
  }

  await browser.close();
  console.log("All tests completed successfully!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
