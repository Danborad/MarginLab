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
    await new Promise((r) => setTimeout(r, 2500));

    // Switch to Lookbook -> Couture Lookbook
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll(".no-scrollbar button")).find(b => b.textContent.includes("高定画册"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 400));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Couture Lookbook"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1800));

    // Check store elements
    const elementsRes = await send('Runtime.evaluate', {
      expression: `JSON.stringify(window.__store.getState().document.elements, null, 2)`,
      returnByValue: true
    });
    console.log('Store elements:');
    console.log(elementsRes.result.value);

    // Check Konva stage layers
    const konvaRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = Konva.stages[0];
        if (!stage) return 'No stage';
        return stage.find('*').map(n => ({
          name: n.name(),
          id: n.id(),
          className: n.getClassName(),
          attrs: n.attrs
        }));
      })()`,
      returnByValue: true
    });
    console.log('Konva nodes:');
    console.log(JSON.stringify(konvaRes.result.value, null, 2));

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
