/* Hverdagsro – things that work, and things on things.
   - Fixed things (the kitchen, the toilet, the bath …) stay where they are while playing; Byg can still move them.
   - Surfaces: tables, desks, beds, sofas and shelves have tops and shelves that other things can stand on. A thing put
     there rides along when the table is moved.
   - Things that work: taps run, the toilet flushes, the bath and the shower fill with water, the tv has channels,
     the stove burns, the washing machine spins, the kettle steams. Everything is drawn here, in the thing's own
     coordinates (its bottom centre is 0,0), so it follows the thing when it is moved, turned or made bigger. */
import { OL } from "./hv-playcat.js";

/* ------------------------------------------------------------------ fixed things */
export const FIXED = new Set(["koekken", "komfur", "koeleskab", "toilet", "badekar", "haandvask", "bruser", "vaskemaskine", "vaskemaskine2", "boblebad", "bagerovn", "bageovn", "pool", "badebassin", "kagedisk", "postskranke", "kontrolpult", "labbord"]);

/* ------------------------------------------------------------------ surfaces
   key: [width as a part of the thing's width, ...levels as a part of its height, from the floor up]. */
const SURF = {
  desk: [0.9, 0.96], spisebord: [0.9, 0.84], sofabord: [0.9, 0.78], natbord: [0.9, 0.62], familiebord: [0.92, 0.82], langbord: [0.94, 0.82], tebord: [0.8, 0.74],
  cafebord: [0.8, 0.86], gamerbord: [0.9, 0.76], byggebord: [0.9, 0.66], kagerulle: [0.9, 0.84], koekken: [0.95, 0.56], komfur: [0.9, 0.97], undersoegelsesbord: [0.9, 0.66],
  opfinderbord: [0.9, 0.6], troldmandsbord: [0.9, 0.66], labbord: [0.9, 0.52], postskranke: [0.9, 0.64], skoreol: [0.95, 0.99], vaskemaskine: [0.9, 0.97], vaskemaskine2: [0.9, 0.97],
  minikoeleskab: [0.9, 0.99], koeleskab: [0.9, 0.99], papkasser: [0.8, 0.99], sminkebord: [0.9, 0.3], havemoebel: [0.4, 0.62], kagedisk: [0.9, 0.98], marked: [0.9, 0.45],
  bed: [0.6, 0.55], dobbeltseng: [0.62, 0.5], bunk: [0.8, 0.17, 0.74], slotsseng: [0.6, 0.45], muslingeseng: [0.6, 0.22], skyseng: [0.7, 0.32], hospitalsseng: [0.7, 0.46], rumkapsel: [0.6, 0.3],
  sofa: [0.66, 0.36], storsofa: [0.7, 0.36], neonsofa: [0.7, 0.36], skumfidussofa: [0.7, 0.4],
  shelf: [0.8, 0.45, 0.77, 1], wallshelf: [0.9, 0.24], bamsereol: [0.85, 0.08, 0.38, 0.67], regnbuereol: [0.8, 0.1, 0.45, 0.8, 1], stueplanter: [0.85, 0.06, 0.52, 0.99],
  gavehylde: [0.85, 0.06, 0.52, 0.99], pakkehylde: [0.85, 0.06, 0.52, 0.99], foderskab: [0.85, 0.06, 0.5, 0.99], hemmeligdoer: [0.8, 0.28, 0.57, 0.99], slikhylde: [0.85, 0.06, 0.38, 0.7, 0.99],
};
export const isSurface = (k) => !!SURF[k];
/* Things from the theme packs (hv-packs4) that work or open, registered by key: what they look like when on, the
   shelves inside them, and what shape they are drawn with. */
const ON = {}, INSIDE = {}, SHAPE = {};
export const hasInside = (k) => !!INSIDE[k];
export const insideOf = (k) => INSIDE[k] || null;
export const shapeOf = (k) => SHAPE[k] || "";
export function registerFx(key, shape, { fx, on, inside } = {}) {
  SHAPE[key] = shape;
  if (fx) FX[key] = fx;
  if (on) ON[key] = on;
  if (inside) INSIDE[key] = inside;
}
/* More surfaces from the theme packs (hv-packs4.js): the shelves, tables and counters they bring. */
export const addSurfaces = (more) => Object.assign(SURF, more);
/* Where things can stand on a thing: [{ level, x0, x1, y }] in the room. A thing that opens (a fridge, a cupboard, a
   chest) also has shelves inside, but only while it is open: they come with inside: true. */
export function topsOf(it, T) {
  if (!T) return [];
  const sc = it.s || 1, out = [], S = SURF[it.k], I = INSIDE[it.k];
  if (S) {
    const half = (T.w * sc * S[0]) / 2;
    S.slice(1).forEach((f, level) => out.push({ level, x0: it.x - half, x1: it.x + half, y: Math.round(it.y - T.h * sc * f) }));
  }
  if (I && it.on) {
    const half = (T.w * sc * I.w) / 2;
    I.levels.forEach((f, level) => out.push({ level: 10 + level, x0: it.x - half, x1: it.x + half, y: Math.round(it.y - T.h * sc * f), inside: true }));
  }
  return out;
}
/* The best top for a thing dropped at x, y: the nearest one it fits on. */
export function topNear(items, CAT, thing, x, y) {
  const T = CAT[thing.k];
  if (!T || FIXED.has(thing.k) || T.w * (thing.s || 1) > 260 || T.h * (thing.s || 1) > 280) return null;
  const mine = new Set([thing.id, ...ridersOf(items, thing.id).map((r) => r.id)]);
  let best = null;
  for (const it of items) {
    if (mine.has(it.id) || (!SURF[it.k] && !INSIDE[it.k]) || !CAT[it.k]) continue;
    for (const top of topsOf(it, CAT[it.k])) {
      if (x < top.x0 - 10 || x > top.x1 + 10) continue;
      const dd = Math.abs(y - top.y);
      if (dd < 46 && (!best || dd < best.dd)) best = { ...top, id: it.id, dd, wall: false };
    }
  }
  return best;
}
/* The things standing on a thing, and the things on them. */
export function ridersOf(items, id, seen = new Set()) {
  const out = [];
  for (const it of items) if (it.at === id && !seen.has(it.id)) {
    seen.add(it.id);
    out.push(it, ...ridersOf(items, it.id, seen));
  }
  return out;
}
/* What a thing on a top is drawn with: just after what it stands on. */
export function depthOf(items, it, wallK) {
  let d = it.y, cur = it, n = 0;
  while (cur.at && n++ < 6) {
    const under = items.find((x) => x.id === cur.at);
    if (!under) break;
    d = wallK(under.k) ? -1000 + under.y : under.y + 0.01 * n;
    cur = under;
  }
  return d;
}
/* Can the figure hold it in a hand? Small things only. */
export const holdable = (k, T) => !!T && !FIXED.has(k) && T.cat !== "væg" && T.w <= 200 && T.h <= 240 && !SURF[k];

/* ------------------------------------------------------------------ things that work */
/* Screens: [x, y, w, h] of the glass, in the thing's own coordinates. */
const SCREENS = { tv: [-90, -176, 180, 100], konsol: [-98, -188, 196, 106], skaerm: [-66, -116, 132, 72], dobbeltskaerm: [16, -112, 100, 62], computer: [-40, -76, 80, 52], tablet: [-38, -66, 76, 54], mobil: [-15, -78, 30, 60] };
export const CHANNELS = ["Tegnefilm", "Havet", "Fodbold", "Musik", "Rummet"];
let uid = 0;
function channel(ch, [x, y, w, h]) {
  const id = `fx-tv${++uid}`, cx = x + w / 2, cy = y + h / 2, u = Math.min(w, h) / 100;
  const shows = [
    // cartoons: a ball bouncing over the hills
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#9FD4FF"/><path d="M${x} ${y + h * 0.75} q${w / 4} ${-h * 0.25} ${w / 2} 0 t${w / 2} 0 V${y + h} H${x}Z" fill="#6BCB77"/><g class="fx-hop"><circle cx="${cx}" cy="${y + h * 0.5}" r="${10 * u + 3}" fill="#FF6B6B" stroke="${OL}" stroke-width="2"/></g><circle cx="${x + w * 0.85}" cy="${y + h * 0.22}" r="${8 * u + 2}" fill="#FFE066"/>`,
    // the sea: fish swimming
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2F6FED"/><g class="fx-swim">${[0, 1, 2].map((i) => `<g transform="translate(${x + w * (0.2 + i * 0.3)} ${y + h * (0.3 + (i % 2) * 0.35)}) scale(${u + 0.2})"><ellipse rx="12" ry="7" fill="${["#FFB347", "#F15BB5", "#FFE066"][i]}"/><path d="M10 0 l8 -6 v12z" fill="${["#FFB347", "#F15BB5", "#FFE066"][i]}"/><circle cx="-5" cy="-1" r="1.6" fill="${OL}"/></g>`).join("")}</g><g class="fx-bubbles">${[0.2, 0.5, 0.8].map((f, i) => `<circle cx="${x + w * f}" cy="${y + h - 4}" r="${2 + i}" fill="#BFE6FF" style="animation-delay:${-i * 0.5}s"/>`).join("")}</g>`,
    // football: the ball rolls into the goal
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3FA34D"/><path d="M${cx} ${y} V${y + h}" stroke="#fff" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${h * 0.22}" fill="none" stroke="#fff" stroke-width="2"/><rect x="${x + w - 8}" y="${cy - h * 0.2}" width="8" height="${h * 0.4}" fill="none" stroke="#fff" stroke-width="2"/><g class="fx-roll"><circle cx="${x + w * 0.2}" cy="${cy}" r="${6 * u + 2}" fill="#fff" stroke="${OL}" stroke-width="1.5"/></g>`,
    // music: a dancing equaliser
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1B1530"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect class="fx-eq" x="${x + w * (0.08 + i * 0.145)}" y="${y + h * 0.2}" width="${w * 0.1}" height="${h * 0.7}" fill="${["#FF6B6B", "#FFB347", "#FFD93D", "#6BCB77", "#4D96FF", "#9B5DE5"][i]}" style="transform-origin:0 ${y + h * 0.9}px;animation-delay:${-i * 0.17}s"/>`).join("")}`,
    // space: a rocket flying past the stars
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0B1030"/>${[0.1, 0.3, 0.55, 0.7, 0.9].map((f, i) => `<circle cx="${x + w * f}" cy="${y + h * ((i * 0.37) % 1)}" r="1.6" fill="#fff" class="pl-twinkle"/>`).join("")}<g class="fx-fly"><g transform="translate(${x + w * 0.2} ${cy}) scale(${u + 0.2})"><path d="M-14 -6 h18 l10 6 l-10 6 h-18z" fill="#fff" stroke="${OL}" stroke-width="1.5"/><path d="M-14 -4 l-8 4 l8 4z" fill="#FFB347"/></g></g>`,
  ];
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/></clipPath><g clip-path="url(#${id})" pointer-events="none">${shows[(ch - 1) % shows.length]}</g>`;
}
const steam = (x, y, n = 2) => `<g class="fx-steam" pointer-events="none">${Array.from({ length: n }, (_, i) => `<path d="M${x + i * 14 - (n - 1) * 7} ${y} q8 -12 0 -24 q-8 -12 0 -24" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8" style="animation-delay:${-i * 0.4}s"/>`).join("")}</g>`;
const flame = (x, y, s = 1) => `<g class="fx-flame" transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 q-9 -8 -3 -20 q2 8 6 4 q-2 -10 5 -16 q4 14 2 22 q-2 8 -10 10z" fill="#FF8A3C" stroke="${OL}" stroke-width="1.5"/><path d="M0 -2 q-4 -4 -1 -10 q4 4 3 10z" fill="#FFE066"/></g>`;
const bubbles = (x0, x1, y, n = 6) => `<g class="fx-bubbles" pointer-events="none">${Array.from({ length: n }, (_, i) => `<circle cx="${x0 + ((x1 - x0) * (i + 0.5)) / n}" cy="${y}" r="${4 + (i % 3) * 3}" fill="#fff" stroke="#9FD4FF" stroke-width="2" style="animation-delay:${-i * 0.35}s"/>`).join("")}</g>`;
const drops = (x0, x1, y0, y1, n = 7) => `<g class="fx-rain" pointer-events="none">${Array.from({ length: n }, (_, i) => `<path d="M${x0 + ((x1 - x0) * (i + 0.5)) / n} ${y0} v14" stroke="#4FB3FF" stroke-width="4" stroke-linecap="round" style="--fall:${y1 - y0}px;animation-delay:${-(i * 0.13) % 0.6}s"/>`).join("")}</g>`;
const stream = (x, y0, y1) => `<g class="fx-stream" pointer-events="none"><path d="M${x} ${y0} V${y1}" stroke="#4FB3FF" stroke-width="7" stroke-linecap="round" stroke-dasharray="10 6"/><ellipse cx="${x}" cy="${y1}" rx="14" ry="4" fill="#9FD4FF" opacity=".9"/></g>`;

/* What happens when a thing is tapped. toggle: it stays on until tapped again (drawn by onSvg). once: a little scene
   that plays and stops. tv: channels, then off. */
export const FX = {
  haandvask: { once: () => stream(10, -110, -82), sound: "water", ms: 2600 },
  koekken: { once: () => stream(104, -158, -124), sound: "water", ms: 2600 },
  toilet: { once: () => `<g class="fx-flush" pointer-events="none"><ellipse cx="0" cy="-80" rx="34" ry="7" fill="#4FB3FF"/><path d="M-24 -80 q24 -10 48 0 M-14 -80 q14 6 28 0" stroke="#fff" stroke-width="3" fill="none"/></g>`, sound: "flush", ms: 1800 },
  badekar: { toggle: true, sound: "water" },
  boblebad: { toggle: true, sound: "water" },
  bruser: { toggle: true, sound: "shower" },
  komfur: { toggle: true, sound: "fire" },
  vaskemaskine: { toggle: true, sound: "hum" },
  vaskemaskine2: { toggle: true, sound: "hum" },
  kaffemaskine: { toggle: true, sound: "water" },
  elkedel: { toggle: true, sound: "water" },
  mikroovn: { once: () => `<rect x="-50" y="-66" width="76" height="56" rx="4" fill="#FFE8A3" opacity=".75" pointer-events="none"/><g class="fx-turn" pointer-events="none"><ellipse cx="-12" cy="-24" rx="22" ry="5" fill="#fff" stroke="${OL}" stroke-width="2"/></g>`, sound: "hum", after: "ding", ms: 2200 },
  ...Object.fromEntries(Object.keys(SCREENS).map((k) => [k, { tv: true, sound: "tv" }])),
};
export const fxOf = (k) => FX[k] || null;
/* What a thing looks like when it is on. */
export function onSvg(it) {
  if (!it.on) return "";
  if (SCREENS[it.k]) return channel(it.ch || 1, SCREENS[it.k]);
  switch (it.k) {
    case "badekar":
      return `<path d="M-140 -84 H140 Q140 -24 106 -20 H-106 Q-140 -24 -140 -84Z" fill="#7FC8F8" opacity=".85" pointer-events="none"/>${bubbles(-120, 110, -88, 8)}${stream(108, -138, -86)}`;
    case "boblebad":
      return bubbles(-120, 120, -96, 9);
    case "bruser":
      return drops(-46, 46, -262, -40, 8) + steam(0, -150, 3);
    case "komfur":
      return `${[0, 1, 2, 3].map((i) => flame(-36 + i * 24, -126, 0.8)).join("")}${steam(-12, -150, 2)}<rect x="-38" y="-92" width="76" height="54" rx="4" fill="#FF8A3C" opacity=".35" pointer-events="none"/>`;
    case "vaskemaskine":
      return `<g class="fx-spinfast" pointer-events="none"><circle cx="0" cy="-54" r="24" fill="none" stroke="#4D96FF" stroke-width="6" stroke-dasharray="30 10"/><circle cx="12" cy="-54" r="8" fill="#FFB347"/><circle cx="-12" cy="-54" r="8" fill="#F15BB5"/></g>${bubbles(-20, 20, -40, 3)}`;
    case "vaskemaskine2":
      return `<g class="fx-spinfast" pointer-events="none"><circle cx="0" cy="-66" r="22" fill="none" stroke="#4D96FF" stroke-width="6" stroke-dasharray="26 9"/><circle cx="10" cy="-66" r="7" fill="#F15BB5"/><circle cx="-10" cy="-66" r="7" fill="#FFD93D"/></g>${bubbles(-18, 18, -50, 3)}`;
    case "kaffemaskine":
      return `<path d="M0 -60 V-36" stroke="#8B5A3C" stroke-width="4" stroke-dasharray="5 4" class="fx-drip" pointer-events="none"/>${steam(0, -40, 1)}`;
    case "elkedel":
      return steam(-34, -80, 2);
    default:
      return ON[it.k] ? ON[it.k](it) : "";
  }
}
/* A little scene that plays once, put into the thing for a moment. */
/* A pot on a stove that is burning bubbles and steams. */
export function ridingSvg(it, items) {
  if (!it.at || SHAPE[it.k] !== "pot") return "";
  const host = items.find((x) => x.id === it.at);
  return host && host.on && SHAPE[host.k] === "oven" ? `${steam(0, -66, 2)}${bubbles(-20, 20, -54, 4)}` : "";
}
export function onceSvg(it) {
  return FX[it.k]?.once ? FX[it.k].once(it) : "";
}

/* ------------------------------------------------------------------ open things and things that run (theme packs)
   Every one is drawn over the thing from its size (w, h), bottom centre at 0,0, like everything else here. */
const DARK = "#3A3347";
export const LOOKS = {
  /* A door swung open: the shelves inside show, the door stands out at the side. */
  door: (w, h, levels, col) => `<g pointer-events="none"><rect x="${-w * 0.42}" y="${-h * 0.95}" width="${w * 0.84}" height="${h * 0.89}" rx="6" fill="${DARK}" stroke="${OL}" stroke-width="3"/><rect x="${-w * 0.42}" y="${-h * 0.95}" width="${w * 0.84}" height="${h * 0.3}" rx="6" fill="#FFF3C4" opacity=".14"/>${levels.map((f) => `<rect x="${-w * 0.4}" y="${-h * f - 3}" width="${w * 0.8}" height="6" rx="2" fill="#CFD6E6" stroke="${OL}" stroke-width="2"/>`).join("")}<path d="M${w * 0.42} ${-h * 0.95} L${w * 0.66} ${-h * 0.88} V${-h * 0.1} L${w * 0.42} ${-h * 0.06}Z" fill="${col}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><circle cx="${w * 0.6}" cy="${-h * 0.5}" r="3.5" fill="#fff" stroke="${OL}" stroke-width="2"/></g>`,
  /* A lid thrown back: the inside shows. */
  lid: (w, h, col) => `<g pointer-events="none"><ellipse cx="0" cy="${-h * 0.62}" rx="${w * 0.42}" ry="${h * 0.12}" fill="${DARK}" stroke="${OL}" stroke-width="3"/><path d="M${-w * 0.5} ${-h * 0.62} L${-w * 0.4} ${-h * 1.12} H${w * 0.4} L${w * 0.5} ${-h * 0.62}Z" fill="${col}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M${-w * 0.3} ${-h * 0.95} H${w * 0.3}" stroke="#fff" stroke-width="4" opacity=".5"/></g>`,
  /* The top drawer pulled out. */
  drawer: (w, h, col) => `<g pointer-events="none"><rect x="${-w * 0.4}" y="${-h * 0.92}" width="${w * 0.8}" height="${h * 0.26}" rx="5" fill="${DARK}" stroke="${OL}" stroke-width="3"/><rect x="${-w * 0.42}" y="${-h * 0.7}" width="${w * 0.84}" height="${h * 0.2}" rx="5" fill="${col}" stroke="${OL}" stroke-width="3"/><circle cx="0" cy="${-h * 0.6}" r="4" fill="#fff" stroke="${OL}" stroke-width="2"/></g>`,
  /* A stove with its flames. */
  burn: (w, h) => `${[0, 1, 2].map((i) => flame(-w * 0.28 + i * w * 0.28, -h * 1.0, 0.7)).join("")}${steam(-w * 0.1, -h * 1.05, 2)}<rect x="${-w * 0.36}" y="${-h * 0.7}" width="${w * 0.72}" height="${h * 0.46}" rx="4" fill="#FF8A3C" opacity=".35" pointer-events="none"/>`,
  /* The cooker hood: the fan turns and the light is on. */
  hood: (w, h) => `<g pointer-events="none"><path d="M${-w * 0.42} ${-h * 0.5} L${w * 0.42} ${-h * 0.5} L${w * 0.5} ${-h * 0.1} H${-w * 0.5}Z" fill="#FFE8A3" opacity=".55"/><g class="fx-spinfast" transform="translate(0 ${-h * 0.3})"><path d="M-16 0 H16 M0 -16 V16" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>${steam(0, -h * 0.55, 2)}</g>`,
  /* A bath full of water. */
  water: (w, h) => `<path d="M${-w * 0.46} ${-h * 0.72} H${w * 0.46} Q${w * 0.44} ${-h * 0.1} ${w * 0.3} ${-h * 0.06} H${-w * 0.3} Q${-w * 0.44} ${-h * 0.1} ${-w * 0.46} ${-h * 0.72}Z" fill="#7FC8F8" opacity=".85" pointer-events="none"/>${bubbles(-w * 0.4, w * 0.4, -h * 0.76, 7)}`,
  /* A shower running. */
  rain: (w, h) => drops(-w * 0.45, w * 0.45, -h * 0.95, -h * 0.08, 8) + steam(0, -h * 0.55, 3),
  /* A washing machine on spin. */
  spin: (w, h) => `<g class="fx-spinfast" pointer-events="none"><circle cx="0" cy="${-h * 0.45}" r="${Math.min(w, h) * 0.26}" fill="none" stroke="#4D96FF" stroke-width="6" stroke-dasharray="28 9"/><circle cx="10" cy="${-h * 0.45}" r="7" fill="#FFB347"/><circle cx="-10" cy="${-h * 0.45}" r="7" fill="#F15BB5"/></g>`,
  /* Something playing music. */
  notes: (w, h) => `<g class="fx-steam" pointer-events="none"><text x="${-w * 0.2}" y="${-h * 0.9}" font-size="26" fill="${OL}">♪</text><text x="${w * 0.16}" y="${-h * 1.05}" font-size="30" fill="${OL}">♫</text></g>`,
  /* The little scenes that play once. */
  stew: () => `${steam(0, -60, 2)}${bubbles(-22, 22, -50, 5)}`,
  flush: (w, h) => `<g class="fx-flush" pointer-events="none"><ellipse cx="0" cy="${-h * 0.8}" rx="${w * 0.42}" ry="7" fill="#4FB3FF"/><path d="M${-w * 0.3} ${-h * 0.8} q${w * 0.3} -10 ${w * 0.6} 0" stroke="#fff" stroke-width="3" fill="none"/></g>`,
  tap: (w, h) => stream(w * 0.3, -h * 1.3, -h * 0.9),
};
/* A screen of a thing from a theme pack, so it gets the tv's channels. rect: [x, y, w, h] in the thing's own space. */
export function addScreen(key, rect) {
  SCREENS[key] = rect;
  FX[key] = { tv: true, sound: "tv" };
}

/* ------------------------------------------------------------------ the shower (new: a bathroom needs one) */
export const FIX_THINGS = {
  bruser: ["Brusebad", "mob", "#BFE6FF", 150, 300, (k) => `<rect x="-70" y="-24" width="140" height="24" rx="6" fill="#FFFFFF" stroke="${OL}" stroke-width="4"/><rect x="-62" y="-290" width="124" height="266" rx="8" fill="${k}" fill-opacity=".35" stroke="${OL}" stroke-width="4"/><path d="M-40 -270 l30 60" stroke="#fff" stroke-width="6" opacity=".7" stroke-linecap="round"/><path d="M52 -24 V-280 H10" fill="none" stroke="#9AA4BA" stroke-width="7" stroke-linecap="round"/><ellipse cx="0" cy="-270" rx="26" ry="9" fill="#CFD6E6" stroke="${OL}" stroke-width="4"/><circle cx="52" cy="-120" r="9" fill="#E5484D" stroke="${OL}" stroke-width="3"/><circle cx="0" cy="-12" r="5" fill="#9AA4BA"/>`],
};

export const FIX_CSS = `
.fx-hop { animation: fxhop .7s ease-in-out infinite alternate; }
@keyframes fxhop { from { transform: translateY(14px); } to { transform: translateY(-10px); } }
.fx-swim { animation: fxswim 3.2s ease-in-out infinite alternate; }
@keyframes fxswim { from { transform: translateX(-14px); } to { transform: translateX(16px); } }
.fx-roll { animation: fxroll 2.4s ease-in infinite; }
@keyframes fxroll { from { transform: translateX(0); } to { transform: translateX(var(--go, 120px)); } }
.fx-fly { animation: fxroll 2.8s linear infinite; }
.fx-eq { animation: fxeq .5s ease-in-out infinite alternate; transform-box: view-box; }
@keyframes fxeq { from { transform: scaleY(.25); } to { transform: scaleY(1); } }
.fx-bubbles circle { animation: fxbub 1.8s ease-out infinite; }
@keyframes fxbub { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-46px); opacity: 0; } }
.fx-rain path { animation: fxrain .6s linear infinite; }
@keyframes fxrain { from { transform: translateY(0); opacity: 1; } to { transform: translateY(var(--fall, 200px)); opacity: .3; } }
.fx-steam path { animation: fxsteam 2s ease-out infinite; }
@keyframes fxsteam { from { transform: translateY(0); opacity: .8; } to { transform: translateY(-30px); opacity: 0; } }
.fx-flame { animation: fxflame .35s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes fxflame { from { scale: 1 .85; } to { scale: .9 1.1; } }
.fx-stream path { animation: fxflow .3s linear infinite; }
@keyframes fxflow { to { stroke-dashoffset: -16; } }
.fx-flush, .fx-spinfast, .fx-turn { transform-box: fill-box; transform-origin: 50% 50%; }
.fx-flush { animation: fxflush 1.8s ease-in-out; }
@keyframes fxflush { from { transform: rotate(0) scale(1); } to { transform: rotate(720deg) scale(.2); opacity: 0; } }
.fx-spinfast { animation: fxspin .6s linear infinite; }
.fx-turn { animation: fxspin 2s linear infinite; }
@keyframes fxspin { to { transform: rotate(360deg); } }
.fx-drip { animation: fxflow .5s linear infinite; }
@media (prefers-reduced-motion: reduce) { .fx-hop, .fx-swim, .fx-roll, .fx-fly, .fx-eq, .fx-bubbles circle, .fx-rain path, .fx-steam path, .fx-flame, .fx-stream path, .fx-flush, .fx-spinfast, .fx-turn, .fx-drip { animation: none; } }
`;
export const FIX_EN = { Brusebad: "Shower", Tegnefilm: "Cartoons", Havet: "The sea", Fodbold: "Football", Musik: "Music", Rummet: "Space", "Kanal {n}": "Channel {n}", Slukket: "Off" };
