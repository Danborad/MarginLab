import { spawn } from 'child_process';
import fs from 'fs';

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9888',
    '--window-size=1600,1000',
    'http://localhost:3001',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9888/json');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.type === 'page' && t.url.includes('3001')) || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await new Promise((r) => (ws.onopen = r));
    await new Promise((r) => setTimeout(r, 2500));

    // 0. Clear previous state for a pristine test
    await send('Runtime.evaluate', {
      expression: `window.indexedDB.deleteDatabase("keyval-store"); localStorage.clear(); location.reload();`,
    });
    await new Promise((r) => setTimeout(r, 3000));

    console.log('--- Step 1: Check Default Canvas & Vogue Full Bleed ---');
    const snap1 = await send('Page.captureScreenshot');
    fs.writeFileSync('v1_vogue_main.png', Buffer.from(snap1.data, 'base64'));

    console.log('--- Step 2: Test Switching to Cereal Minimalist (White Paper & Elegant Typography) ---');
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("杂志画报"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Cereal"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap2 = await send('Page.captureScreenshot');
    fs.writeFileSync('v2_cereal_white.png', Buffer.from(snap2.data, 'base64'));

    console.log('--- Step 3: Test Interactive Crop Mode ---');
    // Click on center image
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 800, y: 500, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 800, y: 500, button: 'left' });
    await new Promise((r) => setTimeout(r, 500));

    // Enter Crop Mode
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("进入框内交互裁切"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const snap3_crop = await send('Page.captureScreenshot');
    fs.writeFileSync('v3_crop_mode.png', Buffer.from(snap3_crop.data, 'base64'));

    // Zoom to 1.5x in crop mode and click 1.5x button
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "1.5x")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Confirm crop
    await send('Runtime.evaluate', {
      expression: `document.getElementById("confirm-crop-btn")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const snap3_cropped = await send('Page.captureScreenshot');
    fs.writeFileSync('v3_crop_confirmed.png', Buffer.from(snap3_cropped.data, 'base64'));

    console.log('--- Step 4: Test Size Preset Modal (Switch to Mijia 6-inch 100x148mm) ---');
    // Open Size Modal from Header
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("画布") || b.textContent.includes("Cereal") || b.textContent.includes("1200×1600"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const snap4_modal = await send('Page.captureScreenshot');
    fs.writeFileSync('v4_preset_size_modal.png', Buffer.from(snap4_modal.data, 'base64'));

    // Select Mijia 6-inch vertical
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("div")).find(d => d.textContent.includes("米家 6 寸相纸 (竖版)"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const snap4_mijia6 = await send('Page.captureScreenshot');
    fs.writeFileSync('v4_mijia_6inch_reflowed.png', Buffer.from(snap4_mijia6.data, 'base64'));

    console.log('--- Step 5: Test Switching to Multi-Photo Gallery: Editorial Quad ---');
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("多图画廊"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("经典四格相簿画报"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap5_quad = await send('Page.captureScreenshot');
    fs.writeFileSync('v5_mijia_6inch_quad.png', Buffer.from(snap5_quad.data, 'base64'));

    console.log('--- Step 6: Test Saving to Local Project Library ---');
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("保存"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Open Project Manager Modal
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("作品库"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const snap6_library = await send('Page.captureScreenshot');
    fs.writeFileSync('v6_project_library_modal.png', Buffer.from(snap6_library.data, 'base64'));

    // Close Modal
    await send('Runtime.evaluate', {
      expression: `document.getElementById("close-project-modal-btn")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));

    console.log('--- Step 7: Test Export Modal with 300 DPI Mijia Print Guide ---');
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("导出"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const snap7_export = await send('Page.captureScreenshot');
    fs.writeFileSync('v7_export_modal.png', Buffer.from(snap7_export.data, 'base64'));

    ws.close();
    console.log('Verification completed successfully!');
  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    chrome.kill();
  }
}

main();
