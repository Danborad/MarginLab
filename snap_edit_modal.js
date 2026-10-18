import { spawn } from "child_process";
import fs from "fs";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  const proc = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=9346",
    "--user-data-dir=/tmp/chrome_edit_field",
    "--window-size=1440,900",
    "about:blank",
  ]);

  await sleep(1500);
  const res = await fetch("http://127.0.0.1:9346/json/list");
  const tabs = await res.json();
  const tab = tabs[0];
  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const cur = id++;
    const handler = (m) => {
      const d = JSON.parse(m.data);
      if (d.id === cur) { ws.removeEventListener("message", handler); resolve(d.result); }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:3001" });
  await sleep(2000);

  await send("Runtime.evaluate", {
    expression: `(() => {
      window.__store.getState().login("admin", "admin123");
      window.__store.getState().setAdminModalOpen(true, "styles");
    })()`,
    awaitPromise: true,
  });
  await sleep(1000);

  // Click edit on FANTASY
  await send("Runtime.evaluate", {
    expression: `(() => {
      const editBtns = Array.from(document.querySelectorAll("button")).filter(b => b.innerText.includes("编辑"));
      if (editBtns.length >= 2) editBtns[1].click();
    })()`,
    awaitPromise: true,
  });
  await sleep(800);

  // Scroll the form inside edit modal
  await send("Runtime.evaluate", {
    expression: `(() => {
      const form = document.querySelector(".fixed.inset-0 form");
      if (form) form.scrollTop = 180;
    })()`,
    awaitPromise: true,
  });
  await sleep(500);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("admin_github_4_edit_modal_scrolled_field.png", Buffer.from(shot.data, "base64"));
  console.log("Saved admin_github_4_edit_modal_scrolled_field.png");

  ws.close();
  proc.kill("SIGKILL");
}

run().catch(console.error);
