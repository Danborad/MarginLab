import { spawn } from 'child_process';
import fs from 'fs';

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9999',
    '--window-size=1600,1000',
    'http://localhost:3001',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9999/json');
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
    await new Promise((r) => setTimeout(r, 1000));

    // Reload page clean
    await send('Runtime.evaluate', {
      expression: `window.indexedDB.deleteDatabase("keyval-store"); localStorage.clear(); location.reload();`,
    });
    await new Promise((r) => setTimeout(r, 2500));

    const templatesToTest = [
      { cat: '全屏大字', title: 'Bazaar Bold Title', out: 'showcase_bazaar.png' },
      { cat: '全屏大字', title: 'DAZED Heavy-Type', out: 'showcase_dazed.png' },
      { cat: '杂志画报', title: 'Kinfolk Living', out: 'showcase_kinfolk.png' },
      { cat: '高定画册', title: 'Couture Lookbook', out: 'showcase_couture.png' },
      { cat: '多图画廊', title: 'Nine-Grid Archive', out: 'showcase_nine_grid.png' },
      { cat: '东方留白', title: 'Zen Silence', out: 'showcase_zen.png' },
      { cat: '东方留白', title: 'Architectural Silence', out: 'showcase_arch.png' },
    ];

    for (const item of templatesToTest) {
      // Click category pill inside sidebar specifically
      await send('Runtime.evaluate', {
        expression: `Array.from(document.querySelectorAll(".no-scrollbar button")).find(b => b.textContent.includes("${item.cat}"))?.click();`,
      });
      await new Promise((r) => setTimeout(r, 400));

      // Click template card
      await send('Runtime.evaluate', {
        expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("${item.title}"))?.closest(".group")?.click();`,
      });
      await new Promise((r) => setTimeout(r, 2000));

      const snap = await send('Page.captureScreenshot');
      fs.writeFileSync(item.out, Buffer.from(snap.data, 'base64'));
      console.log(`Saved ${item.out}`);
    }

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
