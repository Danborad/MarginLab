import { spawn } from 'child_process';
import fs from 'fs';

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9444',
    '--window-size=1440,900',
    'http://localhost:3001',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9444/json');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.type === 'page' && t.url.includes('3001')) || tabs.find(t => t.type === 'page') || tabs[0];
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
    await new Promise((r) => setTimeout(r, 3000));

    // Clear any previous saved data in indexedDB to test fresh start
    await send('Runtime.evaluate', {
      expression: `window.indexedDB.deleteDatabase("keyval-store"); localStorage.clear(); location.reload();`,
    });
    await new Promise((r) => setTimeout(r, 3500));

    // View 1: Main Vogue Full Bleed Cover (Clean Canvas)
    const snap1 = await send('Page.captureScreenshot');
    fs.writeFileSync('view1_vogue_main.png', Buffer.from(snap1.data, 'base64'));
    console.log('1. Saved view1_vogue_main.png');

    // View 2: Switch to "DAZED Heavy-Type"
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("DAZED Heavy-Type"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap2 = await send('Page.captureScreenshot');
    fs.writeFileSync('view2_dazed_heavy.png', Buffer.from(snap2.data, 'base64'));
    console.log('2. Saved view2_dazed_heavy.png');

    // View 3: Switch to "Couture Lookbook • 满幅双拼无缝画报"
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Couture Lookbook"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap3 = await send('Page.captureScreenshot');
    fs.writeFileSync('view3_couture_lookbook.png', Buffer.from(snap3.data, 'base64'));
    console.log('3. Saved view3_couture_lookbook.png');

    // View 4: Test Interactive Crop on the left image
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 550, y: 450, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 550, y: 450, button: 'left' });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("进入框内交互裁切"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const snap4 = await send('Page.captureScreenshot');
    fs.writeFileSync('view4_interactive_crop.png', Buffer.from(snap4.data, 'base64'));
    console.log('4. Saved view4_interactive_crop.png');

    // Confirm Crop
    await send('Runtime.evaluate', {
      expression: `document.getElementById("confirm-crop-btn")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // View 5: Switch Canvas to Mijia 6-inch vertical
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("满幅双拼") || b.textContent.includes("画布") || b.textContent.includes("1200×1600"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 600));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("div")).find(d => d.textContent.includes("米家 6 寸相纸 (竖版)"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Switch to Mijia 6-inch quad template
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("米家相纸"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("经典四格画报"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap5 = await send('Page.captureScreenshot');
    fs.writeFileSync('view5_mijia_6inch_quad.png', Buffer.from(snap5.data, 'base64'));
    console.log('5. Saved view5_mijia_6inch_quad.png');

    // View 6: Switch to Mijia 3-inch polaroid
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("拍立得口袋卡"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap6 = await send('Page.captureScreenshot');
    fs.writeFileSync('view6_mijia_3inch_polaroid.png', Buffer.from(snap6.data, 'base64'));
    console.log('6. Saved view6_mijia_3inch_polaroid.png');

    // Click "保存"
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("保存"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // View 7: Open Projects Modal to see the saved record
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("作品库"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const snap7 = await send('Page.captureScreenshot');
    fs.writeFileSync('view7_saved_projects_modal.png', Buffer.from(snap7.data, 'base64'));
    console.log('7. Saved view7_saved_projects_modal.png');

    ws.close();
    console.log('All gallery and canvas views verified!');
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
