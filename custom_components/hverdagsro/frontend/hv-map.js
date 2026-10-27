/* Hverdagsro – the world map as a little pastel town seen from above at an angle (2.5D): roads, blocks, a river and
   a skyline, with a building for every place, a sign on its roof, and the family's own house in the middle as an
   open doll's house drawn from its floor plan in Husbyggeren. Everything is drawn here; the buildings are our own. */
import { OL, shade } from "./hv-playcat.js";
import { AREAS, PLACES, NPCS, houseRooms } from "./hv-world.js";

const W = 1000, H = 620;
const IX = 11, IY = 5.6, ZH = 8, OX = 500, OY = 120;
const P = (x, y, z = 0) => [OX + (x - y) * IX, OY + (x + y) * IY - z * ZH];
const pts = (a) => a.map(([x, y, z]) => P(x, y, z).map((n) => n.toFixed(1)).join(",")).join(" ");
const poly = (a, f, o = "") => `<polygon points="${pts(a)}" fill="${f}" stroke="${OL}" stroke-width="2" stroke-linejoin="round" ${o}/>`;
const flat = (a, f, o = "") => `<polygon points="${pts(a)}" fill="${f}" ${o}/>`;
const rep = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");

/* ------------------------------------------------------------------ building blocks */
/* A box standing on the ground: the two faces we see, and its top. */
function box(x, y, w, d, h, col, z0 = 0, topCol = null) {
  return `${poly([[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z0 + h], [x, y + d, z0 + h]], col)}${poly([[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z0 + h], [x + w, y, z0 + h]], shade(col, 0.84))}${poly([[x, y, z0 + h], [x + w, y, z0 + h], [x + w, y + d, z0 + h], [x, y + d, z0 + h]], topCol || shade(col, 1.1))}`;
}
/* Windows on the two faces we see. */
function windows(x, y, w, d, h, rows, colsF, colsR, col = "#C7E6FF", z0 = 0) {
  let s = "";
  const rh = h / rows;
  for (let r = 0; r < rows; r++) {
    const za = z0 + r * rh + rh * 0.3, zb = z0 + r * rh + rh * 0.78;
    for (let c = 0; c < colsF; c++) {
      const a = x + (c + 0.25) * (w / colsF), b = x + (c + 0.75) * (w / colsF);
      s += flat([[a, y + d, za], [b, y + d, za], [b, y + d, zb], [a, y + d, zb]], col, `stroke="${OL}" stroke-width="1.2"`);
    }
    for (let c = 0; c < colsR; c++) {
      const a = y + (c + 0.25) * (d / colsR), b = y + (c + 0.75) * (d / colsR);
      s += flat([[x + w, a, za], [x + w, b, za], [x + w, b, zb], [x + w, a, zb]], shade(col, 0.85), `stroke="${OL}" stroke-width="1.2"`);
    }
  }
  return s;
}
/* A pitched roof along x. */
function gable(x, y, w, d, h, rh, roof, wall) {
  return `${poly([[x, y, h], [x + w, y, h], [x + w, y + d / 2, h + rh], [x, y + d / 2, h + rh]], shade(roof, 0.8))}${poly([[x + w, y, h], [x + w, y + d, h], [x + w, y + d / 2, h + rh]], shade(wall, 0.84))}${poly([[x, y + d, h], [x + w, y + d, h], [x + w, y + d / 2, h + rh], [x, y + d / 2, h + rh]], roof)}`;
}
/* A door on the front face. */
const door = (x, y, d, w = 1.4, h = 2.4, col = "#C98B55") => flat([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]], col, `stroke="${OL}" stroke-width="1.5"`);
/* A round tree. */
function tree(x, y, s = 1, col = "#6BCB77") {
  const [bx, by] = P(x, y), [tx, ty] = P(x, y, 3.2 * s);
  return `<g class="tm-tree"><ellipse cx="${bx}" cy="${by}" rx="${7 * s}" ry="${3.5 * s}" fill="rgba(0,0,0,.12)"/><path d="M${bx} ${by} V${ty + 6 * s}" stroke="#A9764C" stroke-width="${3 * s}" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="${10 * s}" fill="${col}" stroke="${OL}" stroke-width="2"/><circle cx="${tx - 3 * s}" cy="${ty - 3 * s}" r="${3.5 * s}" fill="#fff" opacity=".35"/></g>`;
}
/* A street lamp. */
function lamp(x, y) {
  const [bx, by] = P(x, y), [, ty] = P(x, y, 3.2);
  return `<path d="M${bx} ${by} V${ty}" stroke="#7A849E" stroke-width="2"/><circle cx="${bx}" cy="${ty}" r="3" fill="#FFE066" stroke="${OL}" stroke-width="1"/>`;
}
/* A sign on a roof: a round badge with the place's picture. */
function sign(x, y, z, em, cls = "") {
  const [sx, sy] = P(x, y, z);
  return `<g class="tm-sign ${cls}"><path d="M${sx} ${sy} v-12" stroke="${OL}" stroke-width="2"/><circle cx="${sx}" cy="${sy - 30}" r="19" fill="#fff" stroke="${OL}" stroke-width="2.5"/><text x="${sx}" y="${sy - 22}" class="tm-em">${em}</text></g>`;
}
const label = (x, y, z, text) => {
  const [lx, ly] = P(x, y, z);
  return `<text x="${lx}" y="${ly}" class="tm-lbl">${text}</text>`;
};

/* ------------------------------------------------------------------ the buildings, one per place */
/* Each returns svg drawn inside a block (bx, by is the block's back corner, 12 x 12). */
const BUILD = {
  "skov-lysning": (bx, by) => `${[[1, 1], [3, 0.6], [5.2, 1.4], [1, 4], [2.8, 6], [0.8, 8], [4.4, 3.4]].map(([a, b], i) => tree(bx + a, by + b, 0.9 + (i % 3) * 0.12, ["#5A9E5F", "#6BCB77", "#4E9A5A"][i % 3])).join("")}${(() => {
      const [hx, hy] = P(bx + 4, by + 8), [, ty] = P(bx + 4, by + 8, 4);
      return `<path d="M${hx - 12} ${hy} v${ty - hy + 12} h24 v${hy - ty - 12}z" fill="#FFF6E6" stroke="${OL}" stroke-width="2"/><path d="M${hx - 26} ${ty + 14} Q${hx} ${ty - 22} ${hx + 26} ${ty + 14}Z" fill="#FF6B6B" stroke="${OL}" stroke-width="2"/><circle cx="${hx - 8}" cy="${ty + 2}" r="4" fill="#fff"/><circle cx="${hx + 9}" cy="${ty + 6}" r="3" fill="#fff"/>`;
    })()}${sign(bx + 4, by + 8, 4.8, "🌲")}`,
  "skov-gaard": (bx, by) => `${box(bx + 6.5, by + 4, 4.5, 4.5, 3.2, "#C2502A")}${gable(bx + 6.5, by + 4, 4.5, 4.5, 3.2, 2.2, "#8B3A1F", "#C2502A")}${door(bx + 8, by + 4, 4.5, 1.6, 2.2, "#8B3A1F")}${box(bx + 10.2, by + 1.6, 1.4, 1.4, 5, "#E8E8E8")}${flat([[bx + 1, by + 9.4, 0.05], [bx + 5, by + 9.4, 0.05], [bx + 5, by + 11, 0.05], [bx + 1, by + 11, 0.05]], "#C9B26B")}${sign(bx + 8.7, by + 6.2, 6.4, "🐔")}`,
  "tekno-lab": (bx, by) => `${box(bx + 0.8, by + 5.5, 6, 5.5, 3, "#E8F6FF")}${windows(bx + 0.8, by + 5.5, 6, 5.5, 3, 2, 4, 3, "#9BE7FF")}${(() => {
      const [cx, cy] = P(bx + 3.8, by + 8.2, 3);
      return `<path d="M${cx - 26} ${cy} A26 18 0 0 1 ${cx + 26} ${cy}Z" fill="#CFD6E6" stroke="${OL}" stroke-width="2"/><path d="M${cx - 6} ${cy - 16} l16 -10" stroke="${OL}" stroke-width="3"/>`;
    })()}${sign(bx + 3.8, by + 8.2, 5.4, "🧪")}`,
  "tekno-tag": (bx, by) => `${box(bx + 7, by + 1, 4, 4, 13, "#9BB7E8")}${windows(bx + 7, by + 1, 4, 4, 13, 7, 3, 3, "#E8F6FF")}${(() => {
      const [ax, ay] = P(bx + 9, by + 3, 13), [, ty] = P(bx + 9, by + 3, 17);
      return `<path d="M${ax} ${ay} V${ty}" stroke="${OL}" stroke-width="2.5"/><circle cx="${ax}" cy="${ty}" r="4" fill="#FF6B6B" stroke="${OL}" stroke-width="1.5" class="pl-blink"/>`;
    })()}${sign(bx + 9, by + 3, 13.6, "🦸")}`,
  "nat-gade": (bx, by) => `${[[0.8, 1, 3.5, "#3A2E5A"], [0.8, 4.8, 4.6, "#2E3A6E"], [0.8, 8.6, 3, "#4A3D7A"]].map(([a, b, h, c]) => `${box(bx + a, by + b, 3.4, 3.2, h, c)}${gable(bx + a, by + b, 3.4, 3.2, h, 1.6, "#1B1530", c)}${windows(bx + a, by + b, 3.4, 3.2, h, 2, 2, 2, "#FFE066")}`).join("")}${sign(bx + 2.5, by + 6.4, 7.4, "🌙")}`,
  "nat-hule": (bx, by) => {
    const [cx, cy] = P(bx + 8, by + 8);
    return `<path d="M${cx - 60} ${cy + 6} Q${cx - 50} ${cy - 70} ${cx} ${cy - 80} Q${cx + 56} ${cy - 66} ${cx + 64} ${cy + 6}Z" fill="#6E6A8A" stroke="${OL}" stroke-width="2"/><path d="M${cx - 30} ${cy - 40} q14 -18 30 -10 M${cx + 18} ${cy - 54} q10 -6 20 4" stroke="#8A86A6" stroke-width="4" fill="none"/><path d="M${cx - 18} ${cy + 4} Q${cx} ${cy - 40} ${cx + 20} ${cy + 4}Z" fill="#1B1530" stroke="${OL}" stroke-width="2"/><circle cx="${cx - 6}" cy="${cy - 14}" r="3" fill="#9BE7FF"/><circle cx="${cx + 7}" cy="${cy - 12}" r="3" fill="#9BE7FF"/>${sign(bx + 8, by + 8, 10.5, "🦉")}`;
  },
  "pop-scene": (bx, by) => `${box(bx + 1, by + 1, 7.5, 6, 5, "#F7D9A8")}${windows(bx + 1, by + 1, 7.5, 6, 5, 2, 5, 4, "#FFF6E6")}${box(bx + 1, by + 1, 7.5, 6, 0.9, "#9B5DE5", 5)}${flat([[bx + 2.5, by + 7, 0], [bx + 7, by + 7, 0], [bx + 7, by + 7, 2.6], [bx + 2.5, by + 7, 2.6]], "#D9473B", `stroke="${OL}" stroke-width="1.5"`)}${label(bx + 4.8, by + 7, 4, "★ STJERNESKUD ★")}${sign(bx + 4.8, by + 4, 6, "🎤")}`,
  "pop-studie": (bx, by) => `${box(bx + 3, by + 8, 5, 3.4, 3.6, "#C7B8FF")}${windows(bx + 3, by + 8, 5, 3.4, 3.6, 2, 4, 2, "#FFF0B8")}${(() => {
      const [cx, cy] = P(bx + 5.5, by + 9.7, 3.6);
      return `<circle cx="${cx}" cy="${cy - 16}" r="15" fill="#CFD6E6" stroke="${OL}" stroke-width="2"/><path d="M${cx - 15} ${cy - 16} h30 M${cx} ${cy - 31} v30" stroke="#9AA4BA" stroke-width="1.5"/><circle cx="${cx - 5}" cy="${cy - 21}" r="3" fill="#fff"/>`;
    })()}${sign(bx + 5.5, by + 9.7, 7.6, "💃")}`,
  "park-plads": (bx, by) => {
    const [cx, cy] = P(bx + 3.5, by + 3.5), [, wy] = P(bx + 3.5, by + 3.5, 7);
    return `<path d="M${cx - 14} ${cy} L${cx} ${wy} L${cx + 14} ${cy}" stroke="${OL}" stroke-width="3" fill="none"/><g class="tm-wheel" style="transform-origin:${cx}px ${wy}px"><circle cx="${cx}" cy="${wy}" r="40" fill="none" stroke="#4D96FF" stroke-width="5"/>${rep(8, (i) => `<path d="M${cx} ${wy} l${(Math.cos((i * Math.PI) / 4) * 40).toFixed(1)} ${(Math.sin((i * Math.PI) / 4) * 40).toFixed(1)}" stroke="#4D96FF" stroke-width="2"/><rect x="${(cx + Math.cos((i * Math.PI) / 4) * 40 - 6).toFixed(1)}" y="${(wy + Math.sin((i * Math.PI) / 4) * 40 - 5).toFixed(1)}" width="12" height="10" rx="3" fill="${["#FF6B6B", "#FFD93D", "#6BCB77", "#F15BB5"][i % 4]}" stroke="${OL}" stroke-width="1.2"/>`)}</g>${(() => {
      const [kx, ky] = P(bx + 8.5, by + 3), [, kt] = P(bx + 8.5, by + 3, 4);
      return `<ellipse cx="${kx}" cy="${ky}" rx="26" ry="10" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><path d="M${kx} ${ky} V${kt}" stroke="${OL}" stroke-width="2"/><path d="M${kx - 28} ${kt + 10} L${kx} ${kt - 6} L${kx + 28} ${kt + 10}Z" fill="#F15BB5" stroke="${OL}" stroke-width="2"/>`;
    })()}${sign(bx + 3.5, by + 3.5, 12.4, "🎡")}`;
  },
  "park-vand": (bx, by) => `${flat([[bx + 2, by + 7, 0.1], [bx + 9, by + 7, 0.1], [bx + 9, by + 11, 0.1], [bx + 2, by + 11, 0.1]], "#4FB3FF", `stroke="${OL}" stroke-width="2"`)}${flat([[bx + 3, by + 8, 0.12], [bx + 5, by + 8, 0.12], [bx + 5, by + 9, 0.12], [bx + 3, by + 9, 0.12]], "#9BE7FF")}${(() => {
      const [sx, sy] = P(bx + 9.5, by + 7.5), [, st] = P(bx + 9.5, by + 7.5, 5), [ex, ey] = P(bx + 6, by + 9);
      return `<path d="M${sx} ${sy} V${st}" stroke="${OL}" stroke-width="3"/><path d="M${sx} ${st} Q${sx - 10} ${(st + ey) / 2} ${ex} ${ey}" stroke="#FFB347" stroke-width="7" fill="none"/>`;
    })()}${sign(bx + 5.5, by + 9, 3, "💦")}`,
  "slik-bageri": (bx, by) => `${box(bx + 1, by + 1, 5, 4.6, 3.6, "#FFE4EE")}${windows(bx + 1, by + 1, 5, 4.6, 3.6, 1, 3, 3, "#FFF6EE")}${box(bx + 1, by + 1, 5, 4.6, 0.6, "#F15BB5", 3.6)}${(() => {
      const [cx, cy] = P(bx + 3.5, by + 3.3, 4.2);
      return `<path d="M${cx - 16} ${cy} L${cx - 12} ${cy - 18} H${cx + 12} L${cx + 16} ${cy}Z" fill="#9B5DE5" stroke="${OL}" stroke-width="2"/><path d="M${cx - 18} ${cy - 18} Q${cx - 18} ${cy - 40} ${cx} ${cy - 40} Q${cx + 18} ${cy - 40} ${cx + 18} ${cy - 18}Z" fill="#F7B5CF" stroke="${OL}" stroke-width="2"/><circle cx="${cx}" cy="${cy - 44}" r="6" fill="#FF6B6B" stroke="${OL}" stroke-width="1.5"/>`;
    })()}${sign(bx + 3.5, by + 3.3, 9.6, "🧁")}`,
  "slik-butik": (bx, by) => `${box(bx + 5.5, by + 6.5, 5.5, 4.5, 3, "#E2D5FF")}${windows(bx + 5.5, by + 6.5, 5.5, 4.5, 3, 1, 3, 3, "#FFF6EE")}${(() => {
      const [cx, cy] = P(bx + 8.2, by + 8.7, 3);
      return `<path d="M${cx} ${cy} V${cy - 36}" stroke="#fff" stroke-width="4"/><circle cx="${cx}" cy="${cy - 44}" r="15" fill="#FF6B6B" stroke="${OL}" stroke-width="2"/><path d="M${cx} ${cy - 44} m-9 0 a9 9 0 1 1 9 9 a5 5 0 1 1 -5 -5" stroke="#fff" stroke-width="2.5" fill="none"/>`;
    })()}${sign(bx + 8.2, by + 8.7, 8.4, "🍭")}`,
  "redning-station": (bx, by) => `${box(bx + 0.8, by + 1, 7, 5, 3.4, "#E5484D")}${rep(3, (i) => flat([[bx + 1.4 + i * 2.2, by + 6, 0], [bx + 3 + i * 2.2, by + 6, 0], [bx + 3 + i * 2.2, by + 6, 2.4], [bx + 1.4 + i * 2.2, by + 6, 2.4]], "#3A3A55", `stroke="${OL}" stroke-width="1.5"`))}${box(bx + 6.2, by + 1.2, 1.6, 1.6, 6.4, "#E5484D")}${windows(bx + 6.2, by + 1.2, 1.6, 1.6, 6.4, 3, 1, 1, "#FFF6E6")}${label(bx + 3.6, by + 6, 3, "REDNING")}${sign(bx + 4.3, by + 3.5, 4, "🚒")}`,
  "redning-havn": (bx, by) => `${flat([[bx + 9, by + 7, 0.3], [bx + 15, by + 7, 0.3], [bx + 15, by + 9, 0.3], [bx + 9, by + 9, 0.3]], "#C98B55", `stroke="${OL}" stroke-width="2"`)}${(() => {
      const [lx, ly] = P(bx + 15, by + 4), [, lt] = P(bx + 15, by + 4, 7);
      return `<path d="M${lx - 9} ${ly} L${lx - 6} ${lt} H${lx + 6} L${lx + 9} ${ly}Z" fill="#fff" stroke="${OL}" stroke-width="2"/><path d="M${lx - 8} ${(ly + lt) / 2 + 8} H${lx + 8} M${lx - 7} ${(ly + lt) / 2 - 10} H${lx + 7}" stroke="#E5484D" stroke-width="6"/><circle cx="${lx}" cy="${lt - 6}" r="7" fill="#FFE066" stroke="${OL}" stroke-width="2"/>`;
    })()}${(() => {
      const [bxp, byp] = P(bx + 13.5, by + 10.5, -0.2);
      return `<path d="M${bxp - 18} ${byp - 6} H${bxp + 18} L${bxp + 12} ${byp + 4} H${bxp - 12}Z" fill="#FFB347" stroke="${OL}" stroke-width="2"/><rect x="${bxp - 7}" y="${byp - 16}" width="14" height="10" rx="2" fill="#fff" stroke="${OL}" stroke-width="1.5"/>`;
    })()}${sign(bx + 12, by + 8, 1.6, "⚓")}`,
};

/* ------------------------------------------------------------------ the family's house: an open doll's house */
function dollhouse(ctx, x0, y0, w, d, here, peers) {
  const rooms = (ctx.data?.house?.rooms || []).filter((r) => Array.isArray(r.pts) && r.pts.length >= 3);
  if (!rooms.length) {
    return `<g class="wm-room${here === "vaerelse" ? " here" : ""}" data-pl="go" data-k="vaerelse" role="button">${box(x0 + 2, y0 + 1, 7, 5, 3.4, "#FFF6E6")}${gable(x0 + 2, y0 + 1, 7, 5, 3.4, 2.4, "#E5484D", "#FFF6E6")}${windows(x0 + 2, y0 + 1, 7, 5, 3.4, 1, 3, 2, "#C7E6FF")}${door(x0 + 5, y0 + 1, 5)}</g>${sign(x0 + 5.5, y0 + 3.5, 6, "🏠")}`;
  }
  const xs = rooms.flatMap((r) => r.pts.map((q) => q[0])), ys = rooms.flatMap((r) => r.pts.map((q) => q[1]));
  const ax = Math.min(...xs), bx = Math.max(...xs), ay = Math.min(...ys), by = Math.max(...ys);
  const s = Math.min(w / (bx - ax || 1), d / (by - ay || 1));
  const map = ([px, py]) => [x0 + (px - ax) * s + (w - (bx - ax) * s) / 2, y0 + (py - ay) * s + (d - (by - ay) * s) / 2];
  const HR = houseRooms(ctx);
  const FL = 0.4, WH = 2;
  let floors = "", walls = [];
  for (const r of rooms) {
    const h = HR.find((x) => x.room.id === r.id), q = r.pts.map(map);
    const key = h?.kid ? (h.kid === ctx.me?.id ? "vaerelse" : `visit:${h.kid}`) : `h:${r.id}`;
    const pk = h?.kid ? `room:${h.kid}` : key, who = peers.filter((pe) => pe.space === pk);
    const col = h?.kid ? "#C7E6FF" : { kitchen: "#FFF0B8", living: "#FFE4CC", bath: "#D8F1FF", bed: "#E2D5FF", garage: "#E2E8F0", hall: "#FFF6E6", office: "#E8F6E0" }[h?.look] || "#FFF6E6";
    const cx = q.reduce((a, p) => a + p[0], 0) / q.length, cy = q.reduce((a, p) => a + p[1], 0) / q.length;
    const [tx, ty] = P(cx, cy, FL);
    floors += `<g class="wm-room${key === here ? " here" : ""}" data-pl="go" data-k="${key}" role="button" aria-label="${r.name}">${poly(q.map(([a, b]) => [a, b, FL]), col)}<text x="${tx.toFixed(1)}" y="${(ty + 7).toFixed(1)}" class="tm-room">${h?.em || ""}</text>${who.map((pe, j) => `<circle cx="${(tx + 12 - j * 10).toFixed(1)}" cy="${(ty - 12).toFixed(1)}" r="7" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="2.5"/>`).join("")}</g>`;
    q.forEach((p, i) => walls.push([p, q[(i + 1) % q.length]]));
  }
  // The walls: low, so the rooms can be seen; the ones at the back first.
  walls.sort((a, b) => a[0][0] + a[0][1] + a[1][0] + a[1][1] - (b[0][0] + b[0][1] + b[1][0] + b[1][1]));
  const wallSvg = walls.map(([a, b]) => {
    const front = b[1] + a[1] > 0 && Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
    return poly([[a[0], a[1], FL], [b[0], b[1], FL], [b[0], b[1], WH], [a[0], a[1], WH]], front ? "#FFFFFF" : "#F2EDE6", 'opacity=".92" pointer-events="none"');
  }).join("");
  const base = poly([[x0 - 0.3, y0 - 0.3, 0], [x0 + w + 0.3, y0 - 0.3, 0], [x0 + w + 0.3, y0 + d + 0.3, 0], [x0 - 0.3, y0 + d + 0.3, 0]], "#E8E2D6", 'stroke-width="1.5"');
  return `${base}${box(x0 - 0.3, y0 - 0.3, w + 0.6, d + 0.6, FL, "#D9CFC0")}${floors}${wallSvg}`;
}

/* ------------------------------------------------------------------ the whole town */
/* The blocks (back corner x, y) of the areas, and which places stand in them. */
const BLOCKS = { skov: [0, 0], tekno: [14, 0], nat: [28, 0], pop: [0, 14], hjem: [14, 14], park: [28, 14], slik: [0, 28], butik: [14, 28], redning: [28, 28] };
export function townSvg(ctx, lv, here, peers, t, opts = {}) {
  const sky = `<linearGradient id="tm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD4FF"/><stop offset="1" stop-color="#E4F4FF"/></linearGradient>`;
  // The city far away, and the hills.
  const skyline = rep(22, (i) => {
    const x = i * 48 - 10, h = 60 + ((i * 53) % 90), c = ["#BFD8F2", "#D6E6F7", "#C8DAF0"][i % 3];
    return `<rect x="${x}" y="${190 - h}" width="40" height="${h + 40}" rx="4" fill="${c}"/>${rep(Math.floor(h / 22), (j) => `<rect x="${x + 8}" y="${200 - h + j * 22}" width="8" height="10" fill="#fff" opacity=".6"/><rect x="${x + 24}" y="${200 - h + j * 22}" width="8" height="10" fill="#fff" opacity=".6"/>`)}`;
  });
  const hills = `<path d="M0 190 Q180 130 360 170 T720 160 T1000 150 V260 H0Z" fill="#B5E3A8"/>`;
  // The land, as a big slab, and the river on the right.
  const land = `${poly([[0, 44, -2.5], [44, 44, -2.5], [44, 44, 0], [0, 44, 0]], "#A97C55")}${poly([[44, 0, -2.5], [44, 44, -2.5], [44, 44, 0], [44, 0, 0]], "#8E6646")}${poly([[0, 0, 0], [44, 0, 0], [44, 44, 0], [0, 44, 0]], "#A8DD9A")}`;
  const river = `${flat([[40.6, 0, 0.02], [44, 0, 0.02], [44, 44, 0.02], [40.6, 44, 0.02]], "#7FC8F8")}${rep(9, (i) => {
    const [a, b] = P(42.2, 2 + i * 4.8, 0.03);
    return `<path d="M${a - 10} ${b} q5 -3 10 0 t10 0" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`;
  })}`;
  // Roads with a dashed middle, and the sidewalks of the blocks.
  const road = (x, y, w, d) => flat([[x, y, 0.04], [x + w, y, 0.04], [x + w, y + d, 0.04], [x, y + d, 0.04]], "#B8BCCB");
  const dash = (ax, ay, bx2, by2) => {
    const [x1, y1] = P(ax, ay, 0.05), [x2, y2] = P(bx2, by2, 0.05);
    return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#fff" stroke-width="2" stroke-dasharray="8 7"/>`;
  };
  const roads = `${road(12, 0, 2, 41)}${road(26, 0, 2, 41)}${road(0, 12, 41, 2)}${road(0, 26, 41, 2)}${dash(13, 0, 13, 41)}${dash(27, 0, 27, 41)}${dash(0, 13, 41, 13)}${dash(0, 27, 41, 27)}${box(39.4, 12.3, 2.6, 1.4, 0.6, "#C98B55")}${box(39.4, 26.3, 2.6, 1.4, 0.6, "#C98B55")}`;
  const plotCol = { skov: "#8FD08A", park: "#9BD7A0", nat: "#8E88AA", hjem: "#B5E3A8", redning: "#DCD7E6", tekno: "#DCE6F2", pop: "#EDE3F7", slik: "#FBE3EC", butik: "#F2EDE6" };
  const plots = Object.entries(BLOCKS).map(([a, [x, y]]) => box(x + 0.4, y + 0.4, 11.2, 11.2, 0.35, plotCol[a] || "#E9E4F0")).join("");
  // The buildings, the back ones first.
  const items = [];
  for (const [id, place] of Object.entries(PLACES)) {
    const blk = BLOCKS[place.area];
    if (!blk || !BUILD[id]) continue;
    const area = AREAS.find((a) => a.id === place.area), open = lv >= (area?.lvl || 1);
    const who = peers.filter((pe) => pe.space === id);
    const [sx, sy] = P(blk[0] + 6, blk[1] + 6, 6);
    // Explored (been there) or new (open, not been there yet). Two places share a block: one badge each side.
    const nth = Object.entries(PLACES).filter(([, pl]) => pl.area === place.area).findIndex(([k]) => k === id);
    const [bx2, by2] = P(blk[0] + (nth ? 9 : 3), blk[1] + (nth ? 9 : 3), 5);
    const seen = (opts.seen || []).includes(id);
    const status = !open || !opts.seen ? "" : seen ? `<g class="tm-seen" pointer-events="none"><circle cx="${bx2}" cy="${by2}" r="11" fill="#6BCB77" stroke="#fff" stroke-width="3"/><path d="M${bx2 - 5} ${by2} l4 4 l7 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>` : `<g class="tm-new" pointer-events="none"><rect x="${bx2 - 19}" y="${by2 - 11}" width="38" height="22" rx="11" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><text x="${bx2}" y="${by2 + 5}" class="tm-newt">${t("NY")}</text></g>`;
    items.push([blk[0] + blk[1] + (id.endsWith("havn") || id.endsWith("vand") || id.endsWith("butik") || id.endsWith("gaard") || id.endsWith("studie") || id.endsWith("hule") ? 1 : 0), `<g class="tm-place${open ? "" : " locked"}${id === here ? " here" : ""}" data-pl="go" data-k="${id}" role="button" aria-label="${t(place.n)}">${BUILD[id](blk[0] + 0.4, blk[1] + 0.4)}${open ? "" : `<g class="tm-lock"><circle cx="${sx}" cy="${sy}" r="16" fill="#fff" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 6}" class="tm-em">🔒</text></g>`}${status}${who.map((pe, j) => `<circle cx="${sx + 22 - j * 12}" cy="${sy - 22}" r="9" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="3"/>`).join("")}</g>`]);
  }
  // The town's trees and lamps along the roads.
  const deco = [[11, 3], [11, 9], [15, 11], [24, 11.4], [29, 11.4], [38, 11.2], [11, 17], [11, 23], [29, 25.4], [11.4, 31], [11.4, 37], [25.4, 37], [29, 39], [38, 25.5], [15, 25.5], [1, 42.5], [6, 42.6], [17, 42.6], [33, 42.4], [-0.2, 20], [-0.2, 34]].map(([a, b], i) => (i % 3 ? tree(a, b, 0.65, ["#6BCB77", "#5A9E5F", "#8FD08A"][i % 3]) : lamp(a, b))).join("");
  // The shop: coins buy things.
  const shop = `<g class="tm-place" data-pl="shop" role="button" aria-label="${t("Butikken")}">${box(16, 30.5, 8, 6, 3.4, "#FFF3B0")}${windows(16, 30.5, 8, 6, 3.4, 1, 4, 3, "#FFFFFF")}${flat([[16, 36.5, 3.4], [24, 36.5, 3.4], [24, 36.5, 2.6], [16, 36.5, 2.6]], "#FF6B6B", `stroke="${OL}" stroke-width="1.5"`)}${door(19.4, 30.5, 6, 1.4, 2.3, "#FFD93D")}${sign(20, 33.5, 3.6, "🪙")}${label(20, 36.5, 1.4, t("BUTIKKEN"))}</g>`;
  const fountain = (() => {
    const [fx, fy] = P(20, 39.2);
    return `<ellipse cx="${fx}" cy="${fy}" rx="26" ry="11" fill="#9BE7FF" stroke="${OL}" stroke-width="2"/><path d="M${fx} ${fy} v-16 m-8 6 q8 -18 16 0" stroke="#4FB3FF" stroke-width="3" fill="none"/>`;
  })();
  // Home: the doll's house and the garden.
  const home = dollhouse(ctx, 14.8, 14.8, 10.4, 7.6, here, peers);
  const gw = peers.filter((pe) => pe.space === "have");
  const garden = `<g class="tm-place${here === "have" ? " here" : ""}" data-pl="go" data-k="have" role="button" aria-label="${t("Haven")}">${flat([[15, 22.6, 0.37], [25, 22.6, 0.37], [25, 25.6, 0.37], [15, 25.6, 0.37]], "#8FD08A", `stroke="${OL}" stroke-width="1.5"`)}${tree(16.4, 24, 0.7)}${(() => {
    const [tx, ty] = P(21, 24.2, 0.4);
    return `<ellipse cx="${tx}" cy="${ty}" rx="20" ry="8" fill="#4D96FF" stroke="${OL}" stroke-width="2"/><ellipse cx="${tx}" cy="${ty}" rx="14" ry="5" fill="#1B1530"/>`;
  })()}${sign(23.6, 24, 0.4, "🌳")}${gw.map((pe, j) => {
    const [gx, gy] = P(23.6, 24, 4.4);
    return `<circle cx="${gx + 22 - j * 12}" cy="${gy - 12}" r="9" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="3"/>`;
  }).join("")}</g>`;
  // Today's gift over the house, until it is opened.
  const [hx, hy] = P(20, 17, 6);
  const gift = opts.gift ? `<g class="tm-gift" data-pl="daily" role="button" aria-label="${t("Dagens gave")}"><rect x="${hx - 64}" y="${hy - 60}" width="128" height="40" rx="14" fill="#fff" stroke="${OL}" stroke-width="2.5"/><path d="M${hx - 8} ${hy - 22} l8 12 l8 -12z" fill="#fff" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><rect x="${hx - 10}" y="${hy - 25}" width="20" height="6" fill="#fff"/><text x="${hx}" y="${hy - 34}" class="tm-gt">🎁 ${t("Dagens gave")}</text></g>` : "";
  const names = AREAS.filter((a) => BLOCKS[a.id]).map((a) => {
    const [x, y] = BLOCKS[a.id], [lx, ly] = P(x + 6, y + 11.6, 0.4);
    const text = `${t(a.n)}${lv >= a.lvl ? "" : ` · ${t("niv. {n}", { n: a.lvl })}`}`;
    return `<g class="tm-name${lv >= a.lvl ? "" : " locked"}"><rect x="${lx - text.length * 4.3 - 10}" y="${ly + 4}" width="${text.length * 8.6 + 20}" height="22" rx="11" fill="${lv >= a.lvl ? "#fff" : "#E8E4F0"}" stroke="${OL}" stroke-width="2"/><text x="${lx}" y="${ly + 20}" class="tm-area">${text}</text></g>`;
  }).join("");
  // Zebra crossings, parked cars and a bus stop.
  const zebra = [[13, 12], [27, 12], [13, 26], [27, 26]].map(([x, y]) => rep(4, (i) => flat([[x - 1 + i * 0.5, y + 2.3, 0.06], [x - 0.75 + i * 0.5, y + 2.3, 0.06], [x - 0.75 + i * 0.5, y + 3.5, 0.06], [x - 1 + i * 0.5, y + 3.5, 0.06]], "#fff"))).join("");
  const car = (x, y, c, along) => (along ? box(x, y, 1.8, 0.9, 0.7, c, 0.04) + box(x + 0.4, y, 1, 0.9, 0.55, "#CFE8FF", 0.74) : box(x, y, 0.9, 1.8, 0.7, c, 0.04) + box(x, y + 0.4, 0.9, 1, 0.55, "#CFE8FF", 0.74));
  const cars = `${car(12.3, 6, "#FF6B6B", false)}${car(4, 13.2, "#4D96FF", true)}${car(26.6, 33, "#FFD93D", false)}${car(32, 26.3, "#6BCB77", true)}`;
  // The bus stop: the bus goes to Centrum.
  const [bsx, bsy] = P(6, 27, 3);
  const stop = `<g class="tm-place" data-pl="city" role="button" aria-label="${t("Til Centrum")}">${box(4.5, 26.4, 3, 0.5, 2.2, "#E8F6FF", 0.05)}${box(4.5, 26.2, 3, 0.9, 0.2, "#4D96FF", 2.25)}</g>`;
  const busLabel = `<g class="tm-place" data-pl="city" role="button" aria-label="${t("Til Centrum")}"><rect x="${bsx - 62}" y="${bsy - 34}" width="124" height="26" rx="13" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><text x="${bsx}" y="${bsy - 16}" class="tm-area">🚌 ${t("Til Centrum")}</text></g>`;
  items.sort((a, b) => a[0] - b[0]);
  return `<defs>${sky}</defs><rect width="${W}" height="${H}" fill="url(#tm-sky)"/>${skyline}${hills}${land}${river}${roads}${zebra}${plots}${cars}${stop}${deco}${home}${sign(20, 15.6, 2.2, "🏠", "tm-home")}${garden}${items.map((i) => i[1]).join("")}${shop}${fountain}${names}${busLabel}${gift}`;
}

export const MAP_EN = { BUTIKKEN: "SHOP", "Dagens gave": "Today's gift" };
void NPCS;
