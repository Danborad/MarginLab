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

    const templatesToTest = [
      { id: 'vogue-fullbleed-cover', name: 'showcase_1_vogue.png' },
      { id: 'bazaar-bold-masthead', name: 'showcase_2_bazaar.png' },
      { id: 'dazed-heavy-title', name: 'showcase_3_dazed.png' },
      { id: 'zurich-swiss-poster', name: 'showcase_4_zurich.png' },
      { id: 'cereal-white-editorial', name: 'showcase_5_cereal.png' },
      { id: 'kinfolk-slow-living', name: 'showcase_6_kinfolk.png' },
      { id: 'couture-split-dual-bleed', name: 'showcase_7_couture.png' },
      { id: 'editorial-quad-grid', name: 'showcase_8_editorial_quad.png' },
      { id: 'four-tile-fullbleed', name: 'showcase_9_four_tile.png' },
      { id: 'nine-grid-archive', name: 'showcase_10_nine_grid.png' },
      { id: 'polaroid-pocket-card', name: 'showcase_11_polaroid_3inch.png' },
      { id: 'zen-minimalist', name: 'showcase_12_zen.png' },
    ];

    for (const t of templatesToTest) {
      await send('Runtime.evaluate', {
        expression: `window.__store.getState().loadTemplate('${t.id}', true);`,
      });
      await new Promise((r) => setTimeout(r, 1000));
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(t.name, Buffer.from(res.data, 'base64'));
      console.log(`Saved ${t.name}`);
    }

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
