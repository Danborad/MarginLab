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

    // Clear and reload
    await send('Runtime.evaluate', {
      expression: `window.indexedDB.deleteDatabase("keyval-store"); localStorage.clear(); location.reload();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `window.__store.getState().loadTemplate('couture-split-dual-bleed', false);`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Let's hide Konva stage and take screenshot
    await send('Runtime.evaluate', {
      expression: `document.querySelector('#atelier-canvas-container').style.opacity = '0';`
    });
    let res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('test_hide_canvas.png', Buffer.from(res.data, 'base64'));

    // Let's restore and hide all elements except canvas container
    await send('Runtime.evaluate', {
      expression: `
        document.querySelector('#atelier-canvas-container').style.opacity = '1';
        const stage = Konva.stages[0];
        const layers = stage.getLayers();
        console.log('Total layers:', layers.length);
        // Hide Layer 1 (background)
        layers[0].hide();
        stage.draw();
      `
    });
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('test_hide_layer1.png', Buffer.from(res.data, 'base64'));

    // Hide Layer 2 (elements)
    await send('Runtime.evaluate', {
      expression: `
        const stage = Konva.stages[0];
        const layers = stage.getLayers();
        layers[0].show();
        layers[1].hide();
        stage.draw();
      `
    });
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('test_hide_layer2.png', Buffer.from(res.data, 'base64'));

    // Hide individual elements in Layer 2
    await send('Runtime.evaluate', {
      expression: `
        const stage = Konva.stages[0];
        const layer2 = stage.getLayers()[1];
        layer2.show();
        const children = layer2.getChildren();
        const info = children.map(c => ({ id: c.id(), name: c.name(), type: c.getClassName(), attrs: c.attrs }));
        return info;
      `,
      returnByValue: true
    }).then(r => console.log('Layer 2 children:', r.result?.value));

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
