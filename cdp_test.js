import { spawn } from 'child_process';

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
    console.log('Tabs:', tabs.length);
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

    // Wait for images to load
    await new Promise((r) => setTimeout(r, 4000));

    // Screenshot 1: Main Vogue Full Bleed Cover
    const snap1 = await send('Page.captureScreenshot');
    import('fs').then((fs) => {
      fs.writeFileSync('verify_vogue_fullbleed.png', Buffer.from(snap1.data, 'base64'));
      console.log('Saved verify_vogue_fullbleed.png');
    });

    // Evaluate click on Project Manager (作品库)
    await send('Runtime.evaluate', {
      expression: `document.querySelector("button:has(svg) span:contains('作品库')")?.closest("button")?.click() || Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("作品库"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const snap2 = await send('Page.captureScreenshot');
    import('fs').then((fs) => {
      fs.writeFileSync('verify_projects_modal.png', Buffer.from(snap2.data, 'base64'));
      console.log('Saved verify_projects_modal.png');
    });

    // Close modal by pressing Escape
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 500));

    // Open Presets / Sizes modal
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("全屏大字封面") || b.textContent.includes("自定义") || b.textContent.includes("米家"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const snap3 = await send('Page.captureScreenshot');
    import('fs').then((fs) => {
      fs.writeFileSync('verify_sizes_modal.png', Buffer.from(snap3.data, 'base64'));
      console.log('Saved verify_sizes_modal.png');
    });

    // Select Mijia 6-inch vertical
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("div")).find(d => d.textContent.includes("米家 6 寸相纸 (竖版)"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const snap4 = await send('Page.captureScreenshot');
    import('fs').then((fs) => {
      fs.writeFileSync('verify_mijia_6inch.png', Buffer.from(snap4.data, 'base64'));
      console.log('Saved verify_mijia_6inch.png');
    });

    // Switch to Lookbook tab and select Couture Lookbook
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("高定画册"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 600));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Couture Lookbook"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const snap5 = await send('Page.captureScreenshot');
    import('fs').then((fs) => {
      fs.writeFileSync('verify_couture_clean.png', Buffer.from(snap5.data, 'base64'));
      console.log('Saved verify_couture_clean.png');
    });

    // Select the left image on canvas and click interactive crop
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 550, y: 450, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 550, y: 450, button: 'left' });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("进入框内交互裁切"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const snap6 = await send('Page.captureScreenshot');
    import('fs').then((fs) => {
      fs.writeFileSync('verify_crop_working.png', Buffer.from(snap6.data, 'base64'));
      console.log('Saved verify_crop_working.png');
    });

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
