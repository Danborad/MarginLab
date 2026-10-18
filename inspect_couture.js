import { spawn } from 'child_process';

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9777',
    '--window-size=1440,900',
    'http://localhost:3001',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9777/json');
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
    await new Promise((r) => setTimeout(r, 2500));

    // Clear indexedDB
    await send('Runtime.evaluate', {
      expression: `window.indexedDB.deleteDatabase("keyval-store"); localStorage.clear(); location.reload();`,
    });
    await new Promise((r) => setTimeout(r, 3000));

    // Switch to Lookbook tab -> Couture Lookbook
    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("高定画册"))?.click();`,
    });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Couture Lookbook"))?.closest(".group")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `JSON.stringify(window.__store.getState().document.elements, null, 2)`,
      returnByValue: true
    });

    console.log('Couture elements:');
    console.log(evalRes.result.value);

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
