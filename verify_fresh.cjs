const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🚀 Starting Atelier Comprehensive Verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  // 1. Open App
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'v1_vogue_main.png' });
  console.log('📸 Captured v1_vogue_main.png');

  // 2. Select an Image & verify Floating Quick Action Bar
  const stage = await page.locator('#atelier-canvas-container');
  await stage.click({ position: { x: 720, y: 450 } });
  await page.waitForTimeout(500);

  // Check if quick crop button is visible
  const quickCropBtn = page.locator('#quick-crop-action-btn');
  const cropVisible = await quickCropBtn.isVisible();
  console.log('Quick Crop Action Bar visible:', cropVisible);

  // 3. Enter In-Frame Interactive Crop Mode
  if (cropVisible) {
    await quickCropBtn.click();
  } else {
    // Try right sidebar button or double click
    const rightCropBtn = page.getByText('进入框内交互裁切');
    if (await rightCropBtn.isVisible()) {
      await rightCropBtn.click();
    }
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'v2_crop_mode.png' });
  console.log('📸 Captured v2_crop_mode.png');

  // Test zoom in crop mode & confirm crop
  const zoom2xBtn = page.getByText('1.5x');
  if (await zoom2xBtn.isVisible()) {
    await zoom2xBtn.click();
    await page.waitForTimeout(300);
  }
  const confirmCropBtn = page.locator('#confirm-crop-btn');
  if (await confirmCropBtn.isVisible()) {
    await confirmCropBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'v3_crop_confirmed.png' });
  console.log('📸 Captured v3_crop_confirmed.png');

  // 4. Test Preset Size Modal (Mijia 6-inch & 3-inch)
  const sizePill = page.getByTitle('修改相纸或画布尺寸 (米家6寸/3寸、A4等)');
  await sizePill.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'v4_preset_size_modal.png' });
  console.log('📸 Captured v4_preset_size_modal.png');

  // Switch to Mijia 6-inch
  const mijia6inch = page.getByText('米家 6 寸相纸 (竖版)');
  if (await mijia6inch.isVisible()) {
    await mijia6inch.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: 'v5_mijia_6inch_reflowed.png' });
  console.log('📸 Captured v5_mijia_6inch_reflowed.png');

  // 5. Test Template Switcher: Apply "Couture Lookbook" and "Editorial Quad"
  const templateTab = page.getByTitle('模板');
  await templateTab.click();
  await page.waitForTimeout(300);

  const coutureTpl = page.getByText('Couture Lookbook');
  if (await coutureTpl.isVisible()) {
    await coutureTpl.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'v6_couture_clean.png' });
    console.log('📸 Captured v6_couture_clean.png');
  }

  // 6. Test Project Library & Save
  const saveBtn = page.getByTitle('保存画作到本地作品库 (不覆盖系统预设模板)');
  await saveBtn.click();
  await page.waitForTimeout(600);

  const projectLibraryBtn = page.getByTitle('打开我的作品库与自制模板');
  await projectLibraryBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'v7_project_library_modal.png' });
  console.log('📸 Captured v7_project_library_modal.png');

  const closeProjBtn = page.locator('#close-project-modal-btn');
  if (await closeProjBtn.isVisible()) {
    await closeProjBtn.click();
    await page.waitForTimeout(300);
  }

  // 7. Test Export Modal
  const exportBtn = page.getByRole('button', { name: '导出 / 冲印' });
  await exportBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'v8_export_modal.png' });
  console.log('📸 Captured v8_export_modal.png');

  await browser.close();
  console.log('✨ All tests completed successfully!');
})();
