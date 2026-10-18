import { spawn } from 'child_process';

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9555',
    '--window-size=1440,900',
    'http://localhost:3001',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9555/json');
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
    await new Promise((r) => setTimeout(r, 2000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const store = window.__store?.getState();
        if (!store) return 'no store';
        return {
          name: store.document.name,
          canvas: store.document.canvas,
          elements: store.document.elements.map(e => ({
            id: e.id,
            type: e.type,
            name: e.name,
            x: e.x,
            y: e.y,
            width: e.width,
            height: e.height,
            zIndex: e.zIndex,
            visible: e.visible,
            text: e.text,
            fontSize: e.fontSize,
            color: e.color,
            fontFamily: e.fontFamily
          }))
        };
      })()`,
      returnByValue: true
    });

    console.log(JSON.stringify(evalRes.result.value, null, 2));

    // Also check what Konva nodes exist on stage
    const konvaNodes = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = Konva.stages[0];
        if (!stage) return 'no konva stage';
        const layer = stage.getLayers()[1];
        if (!layer) return 'no layer 1';
        return layer.getChildren().map(n => ({
          id: n.id(),
          className: n.getClassName(),
          x: n.x(),
          y: n.y(),
          width: n.width(),
          height: n.height(),
          visible: n.visible(),
          childrenCount: n.getChildren ? n.getChildren().length : 0,
          textProps: n.getClassName() === 'Group' && n.findOne('Text') ? {
            text: n.findOne('Text').text(),
            fontSize: n.findOne('Text').fontSize(),
            fill: n.findOne('Text').fill(),
            x: n.findOne('Text').x(),
            y: n.findOne('Text').y(),
            width: n.findOne('Text').width(),
            height: n.findOne('Text').height(),
            fontFamily: n.findOne('Text').fontFamily(),
            fontStyle: n.findOne('Text').fontStyle(),
          } : null
        }));
      })()`,
      returnByValue: true
    });

    console.log('Konva Nodes:');
    console.log(JSON.stringify(konvaNodes.result.value, null, 2));

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main();
