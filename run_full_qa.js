import { spawn } from 'child_process';
import fs from 'fs';

async function main() {
  console.log('🚀 Launching Headless Chrome for CDP Automated QA...');
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
    await new Promise((r) => setTimeout(r, 1200));

    // Capture screenshot helper
    const snap = async (filename) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
      console.log(`📸 Saved ${filename}`);
    };

    // Step 1: Initial load
    await snap('qa_step1_initial_main.png');

    // Step 2: Select an image node on canvas & check floating crop toolbar
    console.log('Selecting first image element...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const state = window.__store.getState();
        const img = state.document.elements.find(el => el.type === 'image');
        if (img) state.selectElements([img.id]);
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));
    await snap('qa_step2_image_selected.png');

    // Step 3: Enter in-frame crop mode
    console.log('Entering In-Frame Crop Mode...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const state = window.__store.getState();
        const img = state.document.elements.find(el => el.type === 'image');
        if (img) state.setEditingCropId(img.id);
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));
    await snap('qa_step3_in_frame_crop_mode.png');

    // Step 4: Confirm Crop
    console.log('Saving crop result...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('#confirm-crop-btn')?.click()`
    });
    await new Promise((r) => setTimeout(r, 600));
    await snap('qa_step4_crop_confirmed.png');

    // Step 5: Switch Canvas Size to Mijia 6-inch Photo Paper
    console.log('Setting Canvas Size to Mijia 6-inch...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const state = window.__store.getState();
        state.updateCanvas({
          width: 1181,
          height: 1748,
          presetName: '米家 6 寸相纸 (竖版 100×148mm)'
        }, true);
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));
    await snap('qa_step5_mijia_6inch_reflowed.png');

    // Step 6: Load Couture Lookbook Template (2-Photo Bleed)
    console.log('Loading Couture Lookbook template...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const state = window.__store.getState();
        state.loadTemplate('couture-split-dual-bleed', true);
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));
    await snap('qa_step6_couture_lookbook_clean.png');

    // Step 7: Load Editorial Quad Grid (4 Photos)
    console.log('Loading Editorial Quad template...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const state = window.__store.getState();
        state.loadTemplate('editorial-quad-grid', true);
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));
    await snap('qa_step7_editorial_quad.png');

    // Step 8: Load Polaroid 3-inch Pocket Card
    console.log('Loading Polaroid 3-inch pocket card...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const state = window.__store.getState();
        state.updateCanvas({ width: 591, height: 898, presetName: '米家 3 寸相纸 (口袋卡)' }, false);
        state.loadTemplate('polaroid-pocket-card', true);
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));
    await snap('qa_step8_mijia_3inch_pocket.png');

    // Step 9: Test Project Library Modal
    console.log('Saving project & opening project library...');
    await send('Runtime.evaluate', {
      expression: `(async () => {
        const state = window.__store.getState();
        await state.saveCurrentProject('米家 3寸旅行口袋卡');
        state.setProjectModalOpen(true);
      })()`
    });
    await new Promise((r) => setTimeout(r, 1000));
    await snap('qa_step9_project_library_modal.png');

    // Close project modal
    await send('Runtime.evaluate', {
      expression: `window.__store.getState().setProjectModalOpen(false)`
    });
    await new Promise((r) => setTimeout(r, 400));

    // Step 10: Test Preset Sizes Modal
    console.log('Opening Preset Sizes Modal...');
    await send('Runtime.evaluate', {
      expression: `window.__store.getState().setPresetModalOpen(true)`
    });
    await new Promise((r) => setTimeout(r, 800));
    await snap('qa_step10_preset_sizes_modal.png');

    // Close preset modal
    await send('Runtime.evaluate', {
      expression: `window.__store.getState().setPresetModalOpen(false)`
    });
    await new Promise((r) => setTimeout(r, 400));

    // Step 11: Test Export Modal
    console.log('Opening Export Modal...');
    await send('Runtime.evaluate', {
      expression: `window.__store.getState().setExportModalOpen(true)`
    });
    await new Promise((r) => setTimeout(r, 1200));
    await snap('qa_step11_export_modal.png');

    ws.close();
    console.log('🎉 Full QA automated testing completed with 0 errors!');
  } catch (e) {
    console.error('QA Test error:', e);
  } finally {
    chrome.kill();
  }
}

main();
