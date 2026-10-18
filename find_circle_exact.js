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
      expression: `window.__store.getState().loadTemplate('couture-split-dual-bleed', false);`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Inspect all elements and their background / border-radius / pseudo-elements
    const checkAll = await send('Runtime.evaluate', {
      expression: `(() => {
        const all = document.querySelectorAll('*');
        const list = [];
        all.forEach(el => {
          const cs = window.getComputedStyle(el);
          const before = window.getComputedStyle(el, '::before');
          const after = window.getComputedStyle(el, '::after');
          
          function checkStyle(s, prefix) {
            if (s.borderRadius !== '0px' && s.borderRadius !== '2px' && s.borderRadius !== '4px' && s.borderRadius !== '6px' && s.borderRadius !== '8px' && s.borderRadius !== '12px' && s.borderRadius !== '16px') {
              list.push({ prefix, tag: el.tagName, id: el.id, class: el.className, w: el.clientWidth, h: el.clientHeight, br: s.borderRadius, bg: s.backgroundColor, bgi: s.backgroundImage, shadow: s.boxShadow, mask: s.mask || s.webkitMask });
            }
          }
          checkStyle(cs, 'self');
          checkStyle(before, 'before');
          checkStyle(after, 'after');
        });
        return list;
      })()`,
      returnByValue: true
    });
    console.log('CHECK ALL RESULT:');
    console.log(JSON.stringify(checkAll.result.value, null, 2));

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
