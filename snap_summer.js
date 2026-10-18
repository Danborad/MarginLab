import { spawn } from 'child_process';
import fs from 'fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9847',
    '--user-data-dir=/tmp/chrome_snap_summer',
    '--window-size=1600,1100',
    'http://127.0.0.1:3001',
  ]);

  let tab = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9847/json/list');
      const tabs = await res.json();
      tab = tabs.find((t) => t.type === 'page') || tabs[0];
      if (tab && tab.webSocketDebuggerUrl) break;
    } catch (e) {}
  }

  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', handler);
          resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await sleep(1500);

  await send('Runtime.evaluate', {
    expression: `
      window.__store.getState().setCurrentView('studio');
      window.__store.getState().loadTemplate('summer-recap-film', false);
    `
  });
  await sleep(2500);

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('summer_recap_rendered.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved summer_recap_rendered.png');

  chrome.kill();
  process.exit(0);
}
run();
