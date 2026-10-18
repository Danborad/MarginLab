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

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = Konva.stages[0];
        const res = [];
        stage.find('Layer').forEach((layer, li) => {
          const children = [];
          layer.children.forEach(c => {
            children.push({
              className: c.getClassName(),
              id: c.id(),
              name: c.name(),
              x: c.x(),
              y: c.y(),
              width: c.width(),
              height: c.height(),
              attrs: c.attrs,
              subChildren: c.children ? c.children.map(sc => ({
                className: sc.getClassName(),
                id: sc.id(),
                attrs: sc.attrs
              })) : []
            });
          });
          res.push({ layerIndex: li, children });
        });
        return res;
      })()`,
      returnByValue: true
    });
    console.log('EXACT KONVA LAYERS & CHILDREN:');
    console.log(JSON.stringify(check.result.value, null, 2));

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
