/* The home-screen app: app.html signs in (to a fake Home Assistant), shows Hverdagsro without the menu button,
   keeps its own name and start page, and gives the panel the registries. Run: node tests/frontend/app.mjs */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TYPES = { ".js": "text/javascript", ".html": "text/html", ".png": "image/png", ".webmanifest": "application/manifest+json", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (rel === "/hverdagsro_app/haws-9.4.0.js") rel = "/tests/frontend/fake-haws.js";
  else if (rel.startsWith("/hverdagsro_app/")) rel = rel.replace("/hverdagsro_app/", "/custom_components/hverdagsro/app/");
  const p = path.join(ROOT, rel);
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const errors = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/camera_proxy|favicon|Failed to load resource/.test(m.text()) && errors.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
const fail = (why) => errors.push(why);
const base = `http://localhost:${server.address().port}`;
await page.goto(`${base}/hverdagsro_app/app.html`);
await page.waitForFunction(() => document.querySelector("hverdagsro-panel")?.shadowRoot?.querySelector("#main .card"), null, { timeout: 15000 }).catch(() => fail("the panel did not show"));
if (process.env.SHOT) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: process.env.SHOT });
}
const r = await page.evaluate(() => {
  const el = document.querySelector("hverdagsro-panel");
  const h = el.hass;
  return {
    msgHidden: document.getElementById("msg").hidden,
    app: el.hasAttribute("app"),
    menu: el.shadowRoot.getElementById("menu-btn")?.hidden,
    manifest: document.querySelector('link[rel="manifest"]').getAttribute("href"),
    touch: document.querySelectorAll('link[rel="apple-touch-icon"]').length,
    entities: Object.keys(h.entities).length,
    tesla: h.entities["sensor.tesla_model_3_status"]?.device_id,
    area: h.entities["light.stue"]?.area_id,
    areas: Object.keys(h.areas).length,
    devices: Object.keys(h.devices).length,
    formatted: h.formatEntityState({ state: "21.456", attributes: { unit_of_measurement: "°C" } }),
    on: h.formatEntityState({ state: "on", attributes: {} }),
    url: h.hassUrl("/api/x"),
  };
});
console.log(JSON.stringify(r));
if (!r.msgHidden) fail("the start message is still shown");
if (!r.app || r.menu !== true) fail("the menu button shows in the app");
if (r.manifest !== "app.webmanifest?v=1" || r.touch !== 1) fail(`the page's manifest or icon was changed: ${r.manifest} ${r.touch}`);
if (!r.entities || r.tesla !== "dev_tesla" || r.area !== "stue" || !r.areas || !r.devices) fail("the registries are missing");
if (r.formatted !== "21,5 °C" || r.on !== "Tændt") fail(`formatEntityState: ${r.formatted} ${r.on}`);
if (!r.url.endsWith("/api/x") || !r.url.startsWith("http")) fail(`hassUrl: ${r.url}`);
// A light from the panel goes through call_service.
await page.evaluate(() => document.querySelector("hverdagsro-panel").hass.callService("light", "toggle", { entity_id: "light.stue" }));
await page.waitForTimeout(300);
if (!(await page.evaluate(() => window.__sent.includes("call_service")))) fail("call_service was not sent");
// The profile page: the app says it is open from the home screen and shows no steps.
await page.evaluate(() => { sessionStorage.setItem("hverdagsro-view", "mig"); });
await page.reload();
await page.waitForFunction(() => document.querySelector("hverdagsro-panel")?.shadowRoot?.querySelector(".hs-card"), null, { timeout: 15000 }).catch(() => fail("no home-screen card on the profile page"));
const card = await page.evaluate(() => { const c = document.querySelector("hverdagsro-panel").shadowRoot.querySelector(".hs-card"); return { text: c.textContent, steps: !!c.querySelector(".hs-steps"), btns: !!c.querySelector(".hs-btns") }; });
if (card.steps || card.btns || !/åbnet fra hjemmeskærmen/.test(card.text)) fail(`the card in the app: ${JSON.stringify(card)}`);
await browser.close();
server.close();
if (errors.length) {
  console.log(errors.join("\n"));
  process.exit(1);
}
console.log("app ok");
