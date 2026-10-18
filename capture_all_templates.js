import { spawn } from 'child_process';
import fs from 'fs';

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9666',
    '--window-size=1440,900',
    'http://localhost:3001',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9666/json');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.type === 'page' && t.url.includes('3001')) || tabs[0];
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

    // Clear indexedDB to start clean
    await send('Runtime.evaluate', {
      expression: `window.indexedDB.deleteDatabase("keyval-store"); localStorage.clear(); location.reload();`,
    });
    await new Promise((r) => setTimeout(r, 3500));

    // 1. Full Bleed Vogue Cover
    const snap1 = await send('Page.captureScreenshot');
    fs.writeFileSync('art_1_vogue.png', Buffer.from(snap1.data, 'base64'));
    console.log('Saved art_1_vogue.png');

    // 2. Bazaar Bold Title
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Bazaar Bold"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));
    const snap2 = await send('Page.captureScreenshot');
    fs.writeFileSync('art_2_bazaar.png', Buffer.from(snap2.data, 'base64'));
    console.log('Saved art_2_bazaar.png');

    // 3. Couture Lookbook Split
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("高定画册"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Couture Lookbook"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));
    const snap3 = await send('Page.captureScreenshot');
    fs.writeFileSync('art_3_couture_lookbook.png', Buffer.from(snap3.data, 'base64'));
    console.log('Saved art_3_couture_lookbook.png');

    // 4. 35mm Film Sheet
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("胶片底片"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("35mm Film Sheet"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));
    const snap4 = await send('Page.captureScreenshot');
    fs.writeFileSync('art_4_film_sheet.png', Buffer.from(snap4.data, 'base64'));
    console.log('Saved art_4_film_sheet.png');

    // 5. Mijia 6-inch Quad
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("米家相纸"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("经典四格画报"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 2000));
    const snap5 = await send('Page.captureScreenshot');
    fs.writeFileSync('art_5_mijia_quad.png', Buffer.from(snap5.data, 'base64'));
    console.log('Saved art_5_mijia_quad.png');

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
