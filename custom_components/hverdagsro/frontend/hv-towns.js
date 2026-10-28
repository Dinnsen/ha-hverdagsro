/* Hverdagsro – the new towns of the world: seven towns (Hjemmebyen, Børnebyen, Årstidsbyen, Strandbyen, Handelsbyen,
   Slotsbyen, Neonbyen), one place for every theme pack (hv-packs4). Each place is a furnished room: the pack's own
   furniture along the walls, its things on the shelves, tables and counters, and pictures, curtains and lamps up.
   Everything is laid out from the pack's data when the game starts; the child can then move, buy and add things as in
   any other place. The map page "Byerne" shows one town at a time. All our own drawings and places. */
import { OL, shade } from "./hv-playcat.js";
import { BG, addWorld } from "./hv-world.js";
import { box, windows, gable, door, tree, pine, sign, Pp, flat, poly } from "./hv-city.js";
import { PACKS4, THINGS4, META4 } from "./hv-packs4.js";
import { TOWNS4 } from "./hv-packs4-data.js";
import { PROTO } from "./hv-proto.js";
import { insideOf } from "./hv-fixtures.js";

const { W, H, FLOOR, rect, out, rep, skyDef } = BG;

/* ------------------------------------------------------------------ laying out a room from a pack */
const WALL = new Set(["frame", "poster", "landscape", "clock", "sign", "neon", "curtain", "garland", "banner", "shelfwall", "hooks", "card", "mirror", "mirrorcab", "wallshelf", "hood"]);
/* How high up the wall each kind hangs: the y of its bottom. */
const HANG = { curtain: 372, mirror: 296, frame: 270, poster: 280, landscape: 270, clock: 190, sign: 250, neon: 250, garland: 130, banner: 112, shelfwall: 270, hooks: 260, card: 270, mirrorcab: 290, wallshelf: 290, hood: 330 };
const FRONT = new Set(["coffeetable", "pouf", "stool", "bench", "roundtable", "lounger", "bbq", "fountain", "pool", "tent", "scale", "ball", "trash", "barrel"]);
const hash = (s) => [...s].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
const rnd = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
/* The surfaces (hv-fixtures SURF) of a shape, from the shape table: [width part, ...levels]. */
const surfOf = (key) => {
  const s = PROTO[META4[key]?.shape]?.[4];
  return Array.isArray(s) ? s : null;
};

function layout(pk) {
  const R = rnd(hash(pk.id)), keys = pk.items.filter((k) => THINGS4[k]);
  const info = (k) => ({ k, ...META4[k], T: THINGS4[k] });
  const all = keys.map(info);
  const wallThings = all.filter((t) => WALL.has(t.shape) && t.shape !== "wallshelf" && t.shape !== "hood");
  const wallShelves = all.filter((t) => t.shape === "wallshelf");
  const hoods = all.filter((t) => t.shape === "hood");
  const ceiling = all.filter((t) => t.shape === "ceilinglamp");
  const rugs = all.filter((t) => t.shape === "rug");
  const small = all.filter((t) => !WALL.has(t.shape) && t.shape !== "ceilinglamp" && t.shape !== "rug" && t.w <= 120 && t.h <= 130 && t.cat !== "mob");
  const big = all.filter((t) => !WALL.has(t.shape) && t.shape !== "ceilinglamp" && t.shape !== "rug" && !small.includes(t) && t.h <= 260);
  const order = [...big].sort((a, b) => (surfOf(b.k) ? 1 : 0) - (surfOf(a.k) ? 1 : 0) || b.h - a.h);
  // A room is as wide as its furniture needs: a long room that scrolls, like the rooms of the house, not a crowd.
  const chosen = order.slice(0, 14);
  const wd = Math.max(1000, Math.min(2200, Math.round((chosen.reduce((a, t) => a + t.w + 26, 0) / 2 + 160) / 100) * 100));
  const decor = [], placed = [];
  const put = (k, x, y, o) => decor.push(o ? [k, Math.round(x), Math.round(y), o] : [k, Math.round(x), Math.round(y)]);
  // The floor, in two rows: the tall things against the wall, the low ones in front.
  const rows = [{ y: 528, x: 70, max: wd - 70 }, { y: 604, x: 90, max: wd - 80 }];
  for (const t of chosen) {
    const lowOne = t.h < 100 || FRONT.has(t.shape);
    for (const row of lowOne ? [rows[1], rows[0]] : rows) {
      if (row.x + t.w > row.max) continue;
      const x = row.x + t.w / 2;
      row.x += t.w + 26;
      placed.push({ ...t, x, y: row.y, idx: decor.length });
      put(t.k, x, row.y);
      break;
    }
  }
  if (rugs[0]) put(rugs[0].k, wd / 2, 612);
  // On the wall, spread along its length; a cooker hood goes right over the stove.
  const wl = wallThings.slice(0, 4 + Math.floor((wd - 1000) / 300));
  const span = (wd - 180) / Math.max(1, wl.length - 1);
  wl.forEach((t, i) => put(t.k, wl.length === 1 ? wd / 2 : 90 + i * span, HANG[t.shape] ?? 270));
  const stove = placed.find((t) => t.shape === "oven");
  if (stove && hoods[0]) put(hoods[0].k, stove.x, HANG.hood);
  wallShelves.slice(0, 1 + Math.floor((wd - 1000) / 700)).forEach((t, i) => {
    const x = 220 + i * 640;
    placed.push({ ...t, x, y: HANG.wallshelf, idx: decor.length });
    put(t.k, x, HANG.wallshelf);
  });
  if (ceiling[0]) for (let x = 500; x < wd; x += 700) put(ceiling[0].k, x, 140);
  // The little things: on every top (a shelf, a table, a counter, a bed), and inside what opens (a fridge, a
  // cupboard, a chest: out of sight until the door is opened).
  let n = 0;
  const pool = small.length ? small : all.filter((t) => t.cat !== "mob" && t.w <= 120);
  const pickSmall = () => pool[Math.floor(R() * pool.length)];
  for (const host of placed) {
    if (!pool.length) break;
    const S = surfOf(host.k);
    if (S) {
      const lv = S.slice(1).filter((f) => f > 0.1 || S.length === 2);
      const levels = lv.length > 2 ? [lv[lv.length - 1], lv[Math.floor((lv.length - 1) / 2)]] : lv;
      for (const f of levels) {
        const count = Math.max(1, Math.min(3, Math.floor((host.w * S[0]) / 80)));
        const left = host.x - (host.w * S[0]) / 2 + 24, step = count > 1 ? (host.w * S[0] - 48) / (count - 1) : 0;
        for (let i = 0; i < count && n < 34; i++, n++) put(pickSmall().k, count > 1 ? left + i * step : host.x, host.y - host.h * f);
      }
    }
    const I = insideOf(host.k);
    if (I) {
      for (const f of I.levels.slice(0, 3)) {
        const count = Math.max(1, Math.min(2, Math.floor((host.w * I.w) / 90)));
        const left = host.x - (host.w * I.w) / 2 + 26, step = count > 1 ? (host.w * I.w - 52) / (count - 1) : 0;
        for (let i = 0; i < count; i++) put(pickSmall().k, count > 1 ? left + i * step : host.x, host.y - host.h * f, { in: decor.length - host.idx });
      }
    }
  }
  return { decor, wd };
}

/* ------------------------------------------------------------------ the backdrop of a place */
const STYLES = ["panel", "stripes", "dots", "bricks", "tiles", "plain"];
function roomBg(pk, style, s0, s1, tod, wd = W) {
  const wall = BG.look?.wall || pk.wall, floor = BG.look?.floor || pk.floor, accent = pk.cols[1] || "#fff";
  let deco = "";
  if (style === "stripes") deco = rep(Math.ceil(wd / 60), (i) => (i % 2 ? "" : rect(i * 60, 0, 30, FLOOR, shade(wall, 0.95))));
  else if (style === "dots") deco = rep(Math.ceil(wd / 50), (i) => rep(7, (j) => `<circle cx="${i * 50 + 25 + (j % 2) * 25}" cy="${30 + j * 55}" r="5" fill="${shade(wall, 0.9)}"/>`));
  else if (style === "bricks") deco = rep(9, (j) => rep(Math.ceil(wd / 90) + 1, (i) => rect(i * 90 - (j % 2) * 45, 20 + j * 46, 86, 42, shade(wall, 0.96), 3, `stroke="${shade(wall, 0.86)}" stroke-width="2"`)));
  else if (style === "tiles") deco = rep(Math.ceil(wd / 40), (i) => rep(6, (j) => `<rect x="${i * 40}" y="${FLOOR - 180 + j * 30}" width="40" height="30" fill="none" stroke="${shade(wall, 0.82)}" stroke-width="3"/>`));
  else if (style === "panel") deco = `${rect(0, FLOOR - 170, wd, 170, shade(wall, 0.93))}${rect(0, FLOOR - 176, wd, 10, shade(wall, 0.85))}${rep(Math.ceil(wd / 120), (i) => rect(i * 120 + 14, FLOOR - 150, 92, 120, "none", 6, `stroke="${shade(wall, 0.82)}" stroke-width="3"`))}`;
  const winAt = (win) => `${rect(win, 70, 190, 160, "#fff", 12, out())}${rect(win + 12, 82, 166, 136, "url(#pl-sky)", 6)}${tod === "night" ? `<circle cx="${win + 120}" cy="120" r="16" fill="#FFF6C9"/>` : `<circle cx="${win + 120}" cy="120" r="20" fill="#FFE066"/>`}<path d="M${win + 95} 82 V218 M${win + 12} 150 H${win + 178}" stroke="${OL}" stroke-width="6"/>`;
  const window = skyDef(s0, s1) + rep(Math.max(1, Math.floor((wd - 100) / 700)), (i) => winAt(Math.min(wd - 260, 640 + i * 700)));
  return `${rect(0, 0, wd, FLOOR, wall)}${deco}${window}${rect(0, 0, wd, 12, accent, 0, 'opacity=".5"')}${rect(0, FLOOR - 16, wd, 16, "#fff", 0, out())}${rect(0, FLOOR, wd, H - FLOOR, floor)}${rep(6, (i) => `<path d="M0 ${FLOOR + 30 * (i + 1)} H${wd}" stroke="${shade(floor, 0.88)}" stroke-width="3"/>`)}`;
}

/* ------------------------------------------------------------------ the places */
export const TOWNS = TOWNS4.map((t) => ({ ...t, packs: PACKS4.filter((p) => p.town === t.id) }));
const places = {};
for (const pk of PACKS4) {
  const { decor, wd } = layout(pk);
  places[pk.id] = {
    n: pk.n, area: pk.town, em: pk.em, inside: true, width: wd,
    bg: (s0, s1, tod, w) => roomBg(pk, STYLES[hash(pk.id) % STYLES.length], s0, s1, tod, w),
    decor, npcs: [],
  };
}
addWorld({ places, areas: TOWNS4.map((t) => ({ id: t.id, n: t.n, em: t.em, lvl: t.lvl, x: 0, y: 0, col: t.col, map: "byer" })) });

/* ------------------------------------------------------------------ the map page */
const MW = 1000, MH = 620;
const BLOCKS = [[0, 0], [14, 0], [28, 0], [42, 0], [0, 14], [14, 14], [28, 14], [42, 14], [0, 28], [14, 28], [28, 28], [42, 28]];
const KIND = { hjem: "house", born: "house", saeson: "cabin", strand: "villa", handel: "shop", slot: "manor", neon: "tower" };
const BUILD = {
  house: (x, y, c1, c2) => `${box(x + 1.5, y + 1.5, 8, 6, 3.6, c1)}${gable(x + 1.5, y + 1.5, 8, 6, 3.6, 2.6, c2, c1)}${windows(x + 1.5, y + 1.5, 8, 6, 3.6, 1, 4, 3, "#C7E6FF")}${door(x + 5, y + 1.5, 6)}${tree(x + 10.5, y + 9, 0.8)}`,
  cabin: (x, y, c1, c2) => `${box(x + 2, y + 2, 7, 5, 3, c1)}${gable(x + 2, y + 2, 7, 5, 3, 2.2, c2, c1)}${windows(x + 2, y + 2, 7, 5, 3, 1, 2, 2, "#FFF3B0")}${door(x + 4.8, y + 2, 5, 1.3, 2.2)}${pine(x + 0.8, y + 1, 1)}${pine(x + 10, y + 2, 0.8)}${pine(x + 10.4, y + 8, 1)}`,
  villa: (x, y, c1, c2) => `${box(x + 1, y + 1, 7.5, 5, 3, c1)}${box(x + 3, y + 1, 5.5, 5, 2.4, shade(c1, 0.95), 3)}${windows(x + 1, y + 1, 7.5, 5, 3, 1, 3, 2, "#9FD4FF")}${flat([[x + 2, y + 7.2, 0.45], [x + 10, y + 7.2, 0.45], [x + 10, y + 10.8, 0.45], [x + 2, y + 10.8, 0.45]], "#4FB3FF", `stroke="${OL}" stroke-width="1.5"`)}${door(x + 4, y + 1, 5, 1.6, 2.4, c2)}`,
  shop: (x, y, c1, c2) => `${box(x + 0.6, y + 1, 10.8, 7, 4.2, c1)}${windows(x + 0.6, y + 1, 10.8, 7, 4.2, 1, 5, 3, "#FFF6E6")}${box(x + 0.6, y + 7.6, 10.8, 0.5, 0.8, c2, 3.2)}${door(x + 5, y + 1, 7, 2, 2.4, "#BFE6FF")}`,
  manor: (x, y, c1, c2) => `${box(x + 1, y + 1, 10, 7, 5, c1)}${rep(5, (i) => box(x + 1.6 + i * 2, y + 7.6, 0.6, 0.6, 3.6, "#FFFFFF"))}${gable(x + 1, y + 1, 10, 7, 5, 2.4, c2, c1)}${windows(x + 1, y + 1, 10, 7, 5, 2, 5, 3, "#FFF6E6")}${door(x + 5.2, y + 1, 7, 1.6, 2.6)}`,
  tower: (x, y, c1, c2) => `${box(x + 2, y + 1.5, 7, 6, 9, c1)}${windows(x + 2, y + 1.5, 7, 6, 9, 4, 4, 3, "#FFF6E6")}${box(x + 2.4, y + 1.9, 6.2, 5.2, 1, c2, 9)}${door(x + 4.8, y + 1.5, 6)}`,
};
/* One town seen from above. opts: { town: id, seen: [place ids] }. */
export function townsSvg(ctx, lv, here, peers, t, opts = {}) {
  const town = TOWNS.find((x) => x.id === opts.town) || TOWNS[0];
  const open = lv >= town.lvl;
  const sky = `<linearGradient id="bm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(town.col, 1.15)}"/><stop offset="1" stop-color="#FFF8EC"/></linearGradient>`;
  const far = rep(24, (i) => {
    const x = i * 44 - 10, h = 50 + ((i * 41) % 100);
    return `<rect x="${x}" y="${200 - h}" width="38" height="${h + 40}" rx="3" fill="${shade(town.col, 1.25 - (i % 3) * 0.05)}" opacity=".55"/>`;
  });
  const land = `${poly([[0, 42, -2.5], [56, 42, -2.5], [56, 42, 0], [0, 42, 0]], "#A97C55")}${poly([[56, 0, -2.5], [56, 42, -2.5], [56, 42, 0], [56, 0, 0]], "#8E6646")}${poly([[0, 0, 0], [56, 0, 0], [56, 42, 0], [0, 42, 0]], shade(town.col, 1.2))}`;
  const road = (x, y, w, d) => flat([[x, y, 0.04], [x + w, y, 0.04], [x + w, y + d, 0.04], [x, y + d, 0.04]], "#B8BCCB");
  const roads = `${road(12, 0, 2, 42)}${road(26, 0, 2, 42)}${road(40, 0, 2, 42)}${road(0, 12, 56, 2)}${road(0, 26, 56, 2)}`;
  const plots = BLOCKS.map(([x, y], i) => box(x + 0.4, y + 0.4, 11.2, 11.2, 0.35, ["#FBE3EC", "#E2F0FB", "#FFF6D6", "#DFF3D8"][i % 4])).join("");
  const [bx2, by2] = Pp(48, 39.5, 0.5);
  const bus = `<g class="tm-place" data-pl="town" role="button" aria-label="${t("Til Verden")}">${box(43.5, 36.6, 8, 2.6, 2.4, "#FFD93D", 0.4)}${windows(43.5, 36.6, 8, 2.6, 2.4, 1, 5, 1, "#C7E6FF", 0.4)}<rect x="${bx2 - 46}" y="${by2 + 12}" width="92" height="26" rx="13" fill="#fff" stroke="${OL}" stroke-width="2"/><text x="${bx2}" y="${by2 + 30}" class="tm-area">🚌 ${t("Til Verden")}</text></g>${tree(52.6, 40.6, 0.7)}`;
  const items = [];
  town.packs.forEach((pk, i) => {
    const blk = BLOCKS[i];
    if (!blk) return;
    const kind = KIND[town.id] || "house", [c0, c1] = [pk.cols[0], pk.cols[1] || pk.cols[0]];
    const [px, py] = Pp(blk[0] + 0.4 + 5.5, blk[1] + 0.4 + 4.5, 6.4), sx = px + 26, sy = py - 46;
    const who = peers.filter((pe) => pe.space === pk.id), seen = (opts.seen || []).includes(pk.id);
    const badge = !open
      ? `<g class="tm-lock" pointer-events="none"><rect x="${sx - 30}" y="${sy - 12}" width="60" height="24" rx="12" fill="#fff" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 5}" class="tm-newt">🔒 ${town.lvl}</text></g>`
      : seen
        ? `<g class="tm-seen" pointer-events="none"><circle cx="${sx}" cy="${sy}" r="11" fill="#6BCB77" stroke="#fff" stroke-width="3"/><path d="M${sx - 5} ${sy} l4 4 l7 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`
        : `<g class="tm-new" pointer-events="none"><rect x="${sx - 19}" y="${sy - 11}" width="38" height="22" rx="11" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 5}" class="tm-newt">${t("NY")}</text></g>`;
    items.push([blk[0] + blk[1], `<g class="tm-place${open ? "" : " locked"}${pk.id === here ? " here" : ""}" data-pl="go" data-k="${pk.id}" role="button" aria-label="${t(pk.n)}">${BUILD[kind](blk[0] + 0.4, blk[1] + 0.4, c0, c1)}${sign(blk[0] + 0.4 + 5.5, blk[1] + 0.4 + 4.5, 6.4, pk.em)}<text x="${px}" y="${py + 34}" class="tm-lbl">${t(pk.n)}</text>${badge}${who.map((pe, j) => `<circle cx="${sx - 22 + j * 12}" cy="${sy + 18}" r="8" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="2"/>`).join("")}</g>`]);
  });
  items.sort((a, b) => a[0] - b[0]);
  const tw = Math.max(220, t(town.n).length * 17 + 90);
  const title = `<g pointer-events="none"><rect x="20" y="64" width="${tw}" height="44" rx="22" fill="#fff" stroke="${OL}" stroke-width="2.5"/><text x="${20 + tw / 2}" y="93" class="tm-area">${town.em} ${t(town.n)}${open ? "" : ` · ${t("niv. {n}", { n: town.lvl })}`}</text></g>`;
  return `<defs>${sky}</defs><rect width="${MW}" height="${MH}" fill="url(#bm-sky)"/>${far}${land}${roads}${plots}${bus}${items.map((x) => x[1]).join("")}${title}`;
}
export const TOWNS_EN = {
  Byerne: "The towns", "Til Verden": "To the world", Hjemmebyen: "Home Town", "Børnebyen": "Kids' Town", "Årstidsbyen": "Season Town", Strandbyen: "Beach Town",
  Handelsbyen: "Shopping Town", Slotsbyen: "Castle Town", Neonbyen: "Neon Town",
};
