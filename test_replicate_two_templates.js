import { spawn } from 'child_process';
import fs from 'fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9845',
    '--user-data-dir=/tmp/chrome_replicate_qa',
    '--window-size=1600,1100',
    'http://127.0.0.1:3001',
  ]);

  let tab = null;
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9845/json/list');
      const tabs = await res.json();
      tab = tabs.find((t) => t.type === 'page') || tabs[0];
      if (tab && tab.webSocketDebuggerUrl) break;
    } catch (e) {}
  }

  if (!tab) {
    console.error('Failed to connect to chrome');
    process.exit(1);
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
  await send('DOM.enable');
  await sleep(1500);

  // Switch to studio mode if on landing
  await send('Runtime.evaluate', {
    expression: `
      if (window.__store) {
        window.__store.getState().setCurrentView('studio');
      }
    `
  });
  await sleep(1000);

  // 1. Load quiet-journeys-grid
  console.log('Loading quiet-journeys-grid...');
  const resQuiet = await send('Runtime.evaluate', {
    expression: `
      window.__store.getState().loadTemplate('quiet-journeys-grid', false);
      const doc = window.__store.getState().document;
      JSON.stringify({
        name: doc.name,
        bg: doc.canvas.backgroundColor,
        elementsCount: doc.elements.length,
        imageCount: doc.elements.filter(e => e.type === 'image').length,
        textCount: doc.elements.filter(e => e.type === 'text').length,
      });
    `,
    returnByValue: true
  });
  console.log('quiet-journeys-grid info:', resQuiet.result?.value);
  await sleep(2500);

  // Take screenshot of Quiet Journeys
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verify_quiet_journeys.png', Buffer.from(snap1.data, 'base64'));
  console.log('Saved verify_quiet_journeys.png');

  // 2. Load summer-recap-film
  console.log('Loading summer-recap-film...');
  const resSummer = await send('Runtime.evaluate', {
    expression: `
      window.__store.getState().loadTemplate('summer-recap-film', false);
      const doc = window.__store.getState().document;
      JSON.stringify({
        name: doc.name,
        bg: doc.canvas.backgroundColor,
        elementsCount: doc.elements.length,
        imageCount: doc.elements.filter(e => e.type === 'image').length,
        textCount: doc.elements.filter(e => e.type === 'text').length,
      });
    `,
    returnByValue: true
  });
  console.log('summer-recap-film info:', resSummer.result?.value);
  await sleep(2500);

  // Take screenshot of Summer Recap
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verify_summer_recap.png', Buffer.from(snap2.data, 'base64'));
  console.log('Saved verify_summer_recap.png');

  // Open Template Panel
  await send('Runtime.evaluate', {
    expression: `
      window.__store.getState().setActivePanel('templates');
    `
  });
  await sleep(1200);
  const snapPanel = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verify_templates_panel.png', Buffer.from(snapPanel.data, 'base64'));
  console.log('Saved verify_templates_panel.png');

  chrome.kill();
  console.log('Done!');
  process.exit(0);
}

run();
