import { spawn } from 'child_process';

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

    // Clear and reload
    await send('Runtime.evaluate', {
      expression: `window.indexedDB.deleteDatabase("keyval-store"); localStorage.clear(); location.reload();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `window.__store.getState().loadTemplate('couture-split-dual-bleed', true);`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const checkDom = await send('Runtime.evaluate', {
      expression: `(() => {
        const results = [];
        document.querySelectorAll('*').forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.borderRadius === '50%' || style.borderRadius.includes('9999') || style.borderRadius.includes('100%') || style.backgroundImage.includes('radial') || style.backgroundImage.includes('circle')) {
            results.push({ tag: el.tagName, className: el.className, id: el.id, bg: style.backgroundColor, bgi: style.backgroundImage, br: style.borderRadius, w: el.clientWidth, h: el.clientHeight });
          }
        });
        return results;
      })()`,
      returnByValue: true
    });
    console.log('Matching DOM elements with circle/radial:');
    console.log(JSON.stringify(checkDom.result.value, null, 2));

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
