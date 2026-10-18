import { spawn } from 'child_process';
import fs from 'fs';

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    'http://localhost:3001',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    console.log('Open Chrome tabs:', tabs.length);
    const tab = tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const msgId = id++;
        const handler = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await new Promise((r) => (ws.onopen = r));

    // Wait for images & fonts to load
    await new Promise((r) => setTimeout(r, 3500));

    // 1. Screenshot of initial full bleed bold fashion poster (Vogue Cover)
    const snap1 = await send('Page.captureScreenshot');
    fs.writeFileSync('qa1_vogue_cover.png', Buffer.from(snap1.data, 'base64'));
    console.log('1. Saved qa1_vogue_cover.png');

    // 2. Click "保存" (Save) button in header
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("保存"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // 3. Open "作品库" (Projects modal)
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("作品库"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const snap2 = await send('Page.captureScreenshot');
    fs.writeFileSync('qa2_projects_modal.png', Buffer.from(snap2.data, 'base64'));
    console.log('2. Saved qa2_projects_modal.png');

    // Close modal by clicking X
    await send('Runtime.evaluate', {
      expression: `document.getElementById("close-project-modal-btn")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 400));

    // 4. Open "相纸与画布尺寸设置"
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("全屏大字封面") || b.textContent.includes("画布") || b.textContent.includes("米家"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const snap3 = await send('Page.captureScreenshot');
    fs.writeFileSync('qa3_preset_sizes_modal.png', Buffer.from(snap3.data, 'base64'));
    console.log('3. Saved qa3_preset_sizes_modal.png');

    // Select "米家 6 寸相纸 (竖版)"
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("div")).find(d => d.textContent.includes("米家 6 寸相纸 (竖版)"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // 5. Select "高定画册" tab -> choose "Couture Lookbook"
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("高定画册"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Couture Lookbook"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap4 = await send('Page.captureScreenshot');
    fs.writeFileSync('qa4_couture_lookbook.png', Buffer.from(snap4.data, 'base64'));
    console.log('4. Saved qa4_couture_lookbook.png');

    // 6. Click on Left Image on canvas and open Interactive Crop
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 550, y: 450, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 550, y: 450, button: 'left' });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("进入框内交互裁切"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const snap5 = await send('Page.captureScreenshot');
    fs.writeFileSync('qa5_interactive_crop_mode.png', Buffer.from(snap5.data, 'base64'));
    console.log('5. Saved qa5_interactive_crop_mode.png');

    // Drag image inside crop frame & zoom
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 600, y: 400, button: 'left' });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 520, y: 350 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 520, y: 350 });
    await new Promise((r) => setTimeout(r, 400));

    // Click "完成裁切"
    await send('Runtime.evaluate', {
      expression: `document.getElementById("confirm-crop-btn")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // 7. Select "🖨️ 米家相纸" category and choose "米家 6寸 • 经典四格画报"
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("米家相纸"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("经典四格画报"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap6 = await send('Page.captureScreenshot');
    fs.writeFileSync('qa6_mijia_quad.png', Buffer.from(snap6.data, 'base64'));
    console.log('6. Saved qa6_mijia_quad.png');

    // 8. Open Export Modal
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("导出 / 冲印") || b.textContent.includes("导出"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const snap7 = await send('Page.captureScreenshot');
    fs.writeFileSync('qa7_export_modal.png', Buffer.from(snap7.data, 'base64'));
    console.log('7. Saved qa7_export_modal.png');

    ws.close();
    console.log('All QA screenshots saved successfully!');
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
