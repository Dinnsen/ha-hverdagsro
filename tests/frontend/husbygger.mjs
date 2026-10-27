/* Husbyggeren by hand, with a fake Home Assistant: draw walls that close into a room (one of them slanted), put a
   door in the slanted wall, move the room with its walls and door, use the keyboard, select several things and
   check that it all saves by itself. Run: node tests/frontend/husbygger.mjs [--out shot.png] */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "";
const TYPES = { ".js": "text/javascript", ".html": "text/html", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && !/camera_proxy|favicon|Failed to load resource/.test(m.text()) && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
await page.goto(`http://localhost:${server.address().port}/tests/frontend/harness.html?view=husbygger`);
await page.waitForTimeout(900);

const fails = [];
const check = (ok, what) => (ok ? console.log("ok  ", what) : (fails.push(what), console.log("FAIL", what)));
const house = () => page.evaluate(() => window.__panel.ctx.data.house);
const panel = page.locator("hverdagsro-panel");
// Drawing units to screen pixels.
const scr = (x, y) =>
  page.evaluate(([x, y]) => {
    const svg = window.__panel.shadowRoot.getElementById("hz-svg"), pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const r = pt.matrixTransform(svg.getScreenCTM());
    return [r.x, r.y];
  }, [x, y]);
const click = async (x, y, mods = []) => {
  const [a, b] = await scr(x, y);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.click(a, b);
  for (const m of mods) await page.keyboard.up(m);
  await page.waitForTimeout(60);
};
const drag = async (x0, y0, x1, y1, mods = []) => {
  const [a, b] = await scr(x0, y0), [c, d] = await scr(x1, y1);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.move(a, b);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(a + ((c - a) * i) / 8, b + ((d - b) * i) / 8);
  await page.mouse.up();
  for (const m of mods) await page.keyboard.up(m);
  await page.waitForTimeout(80);
};

// A blank drawing.
await panel.locator("[data-hz=blank]").click();
await panel.locator(".sheet [data-yes]").click();
await page.waitForTimeout(300);

// Walls round a room with a slanted side, back to the start: the room closes by itself.
await page.mouse.move(10, 10);
await page.keyboard.press("w");
for (const [x, y] of [[100, 100], [500, 100], [500, 400], [300, 520], [100, 400], [100, 100]]) await click(x, y);
await page.waitForTimeout(1600);
let H = await house();
check(H.walls.length === 5, `5 walls drawn (${H.walls.length})`);
check(H.rooms.length === 1, `the walls closed into a room (${H.rooms.length})`);
const slant = H.walls.find((w) => w.a[0] === 500 && w.b[0] === 300);
check(!!slant, "the slanted wall is there");

// A door in the slanted wall: it takes the wall's angle and remembers the wall.
await page.keyboard.press("d");
await click(402, 462);
await page.waitForTimeout(1600);
H = await house();
let door = H.items.find((i) => i.type === "door");
const ang = (Math.atan2(slant.b[1] - slant.a[1], slant.b[0] - slant.a[0]) * 180) / Math.PI;
check(door && Math.abs(door.ang - ang) < 0.5, `door follows the slanted wall's angle (${door?.ang} vs ${ang.toFixed(2)})`);
check(door && door.wall === slant.id, "door is attached to its wall");

// Move the room: its walls and the door come along.
await page.keyboard.press("Escape");
await page.keyboard.press("v");
await drag(220, 250, 320, 250);
await page.waitForTimeout(1600);
H = await house();
const wall2 = H.walls.find((w) => w.id === slant.id), door2 = H.items.find((i) => i.id === door.id);
check(wall2 && wall2.a[0] === 600, `the room's walls moved with it (${wall2?.a})`);
check(door2 && Math.abs(door2.x - door.x - 100) < 1, `the door moved with its wall (${door?.x} → ${door2?.x})`);
check(H.rooms[0].pts[0][0] > 190, "the room moved");

// Keyboard: delete the door, undo, nudge it along.
await click(door2.x, door2.y);
await page.keyboard.press("Delete");
await page.waitForTimeout(200);
let n = await page.evaluate(() => window.__panel.shadowRoot.querySelectorAll("#hz-svg .ho-door").length);
check(n === 0, "Delete removes the door");
await page.keyboard.press("Control+z");
await page.waitForTimeout(200);
n = await page.evaluate(() => window.__panel.shadowRoot.querySelectorAll("#hz-svg .ho-door").length);
check(n === 1, "Ctrl+Z brings it back");
await page.keyboard.press("Escape");

// A sofa against the top wall turns its back to it; arrows move it.
await page.evaluate(() => window.__panel.shadowRoot.querySelector('[data-hz=tool][data-id="furn:sofa"]')?.click());
await click(400, 150);
await page.waitForTimeout(1600);
H = await house();
let sofa = H.items.find((i) => i.fk === "sofa");
check(sofa && sofa.wall && sofa.rot === 0, `sofa stands with its back to the wall (rot ${sofa?.rot}, wall ${sofa?.wall})`);
await page.keyboard.press("ArrowLeft");
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(1600);
H = await house();
const sofa2 = H.items.find((i) => i.id === sofa.id);
check(sofa2 && sofa2.x < sofa.x, `arrows move it (${sofa.x} → ${sofa2?.x})`);

// Shift-drag a frame round everything: all of it is chosen.
await page.keyboard.press("Escape");
await page.keyboard.press("Escape");
await drag(0, 0, 900, 700, ["Shift"]);
const chosen = await page.evaluate(() => window.__panel.shadowRoot.querySelector("#hz-props .hz-ph b")?.textContent || "");
check(/valgt/.test(chosen), `a frame chooses several (${chosen})`);
const badge = await page.evaluate(() => window.__panel.shadowRoot.querySelector(".hz-savebox")?.textContent || "");
check(/gemt/i.test(badge), `saved by itself (${badge})`);

if (out) await page.screenshot({ path: out });
if (errors.length) console.log(errors.join("\n"));
await browser.close();
server.close();
process.exit(fails.length || errors.length ? 1 : 0);
