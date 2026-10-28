/* Open the panel with a fake Home Assistant and take a screenshot.
   node tests/frontend/run.mjs --view hjem --user anna --out /tmp/x.png [--width 1280] [--narrow] [--dark] [--lang en]
     [--setup 0] [--as ida] [--click "selector"]... [--wait 900] [--full]
   Prints console errors and exits 1 if there were any. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = { view: "", user: "", mock: "", out: "", width: 1280, height: 900, wait: 900, clicks: [], setup: "1", lang: "da", as: "", evals: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--narrow") opt.narrow = true;
  else if (a === "--dark") opt.dark = true;
  else if (a === "--full") opt.full = true;
  else if (a === "--click") opt.clicks.push(args[++i]);
  else if (a === "--eval") opt.evals.push(args[++i]);
  else opt[a.replace(/^--/, "")] = args[++i];
}
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".html": "text/html", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json" };
const server = http.createServer((req, res) => {
  // The art pack, as Home Assistant serves it (www/hverdagsro-art → /local/hverdagsro-art).
  const url = new URL(req.url, "http://x"), rel = decodeURIComponent(url.pathname).replace(/^\/local\/hverdagsro-art\//, "/art/");
  const p = path.join(ROOT, rel);
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +opt.width, height: +opt.height }, colorScheme: opt.dark ? "dark" : "light", reducedMotion: "reduce" });
const errors = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/camera_proxy|favicon|Failed to load resource/.test(m.text()) && errors.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}\n${e.stack || ""}`));
const q = new URLSearchParams({ mock: opt.mock, user: opt.user, setup: opt.setup, lang: opt.lang, view: opt.view, as: opt.as, narrow: opt.narrow ? "1" : "0", dark: opt.dark ? "1" : "0" });
await page.goto(`http://localhost:${port}/tests/frontend/harness.html?${q}`);
await page.waitForTimeout(+opt.wait);
for (const sel of opt.clicks) {
  try {
    await page.locator(`hverdagsro-panel >> ${sel}`).first().click({ timeout: 3000 });
  } catch (e) {
    errors.push(`click failed: ${sel}: ${e.message.split("\n")[0]}`);
  }
  await page.waitForTimeout(500);
}
for (const code of opt.evals) {
  try {
    const r = await page.evaluate(code);
    if (r !== undefined) console.log("eval:", typeof r === "string" ? r : JSON.stringify(r));
  } catch (e) {
    errors.push(`eval failed: ${e.message}`);
  }
}
if (opt.full) await page.evaluate(() => Object.assign(window.__panel.style, { height: "auto", overflow: "visible" }));
if (opt.out) await page.screenshot({ path: opt.out, fullPage: !!opt.full });
const view = await page.evaluate(() => window.__panel?.ctx?.view);
console.log(`view=${view}`);
if (errors.length) console.log(errors.join("\n"));
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
