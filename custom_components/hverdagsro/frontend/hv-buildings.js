/* Hverdagsro – the buildings of the town map, seen from above at an angle. Every building is as tall as it has floors in the
   original (a floor is a storey here), has the roof, porch, awning, balcony or tower of what it is, and stands in a lot with
   what the pack has round it (a pool and palms, a pier, a terrace, a lotus pond, a gate, a swing in a tree, a tent and a
   fire, a loading dock, a hedge garden). All our own drawings, built of the helpers of hv-city. */
import { OL, shade } from "./hv-playcat.js";
import { BG } from "./hv-world.js";
import { box, windows, gable, door, tree, pine, flat, poly, Pp } from "./hv-city.js";

const { rep } = BG;
const ln = (a, b, c = OL, w = 2) => {
  const [x1, y1] = Pp(...a), [x2, y2] = Pp(...b);
  return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
};
const dot = (p, r, f, ex = `stroke="${OL}" stroke-width="1.5"`) => {
  const [x, y] = Pp(...p);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${f}" ${ex}/>`;
};
const rectF = (x, y, w, d, z, col, ex = `stroke="${OL}" stroke-width="1.5"`) => flat([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], col, ex);

/* ------------------------------------------------------------------ parts */
/* floors stacked, with a ledge between and windows on each */
function stack(x, y, w, d, n, sh, col, band, win, cf, cr) {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += box(x, y, w, d, sh, i % 2 ? shade(col, 0.97) : col, i * sh) + windows(x, y, w, d, sh, 1, cf, cr, win, i * sh);
    if (band) s += box(x - 0.15, y - 0.15, w + 0.3, d + 0.3, 0.22, band, (i + 1) * sh - 0.22);
  }
  return s;
}
/* a pyramid roof */
const hip = (x, y, w, d, z, rh, col) =>
  `${poly([[x - 0.3, y + d + 0.3, z], [x + w + 0.3, y + d + 0.3, z], [x + w / 2, y + d / 2, z + rh]], col)}${poly([[x + w + 0.3, y - 0.3, z], [x + w + 0.3, y + d + 0.3, z], [x + w / 2, y + d / 2, z + rh]], shade(col, 0.82))}`;
/* a flat roof with its parapet, a stair house and air-conditioners */
const flatRoof = (x, y, w, d, z, col, extras = true) =>
  `${box(x - 0.1, y - 0.1, w + 0.2, d + 0.2, 0.45, col, z)}${extras ? box(x + w * 0.15, y + d * 0.2, w * 0.3, d * 0.3, 0.9, shade(col, 1.12), z + 0.45) + box(x + w * 0.62, y + d * 0.55, 1, 0.8, 0.55, "#C9D2E3", z + 0.45) : ""}`;
const awning = (x, y, w, d, z, c1, c2 = "#FFFFFF", k = 6) =>
  rep(k, (i) => {
    const a = x + (i * w) / k, b = x + ((i + 1) * w) / k;
    return flat([[a, y + d, z], [b, y + d, z], [b, y + d + 1, z - 0.55], [a, y + d + 1, z - 0.55]], i % 2 ? c2 : c1, `stroke="${OL}" stroke-width="1"`);
  });
const balcony = (x, y, w, d, z) => `${box(x, y + d, w, 0.9, 0.2, "#D9D2C4", z)}${box(x, y + d + 0.8, w, 0.12, 0.8, "#E9EEF6", z + 0.2)}`;
const porch = (x, y, w, d, col = "#C98B55") => `${box(x, y + d, w, 1.5, 0.3, col)}${box(x, y + d + 1.3, w, 0.12, 0.2, shade(col, 0.8), 0.3)}${rep(3, (i) => box(x + 0.1 + (i * (w - 0.4)) / 2, y + d + 1.2, 0.2, 0.2, 2.1, "#FFFFFF", 0.3))}${box(x - 0.1, y + d - 0.1, w + 0.2, 1.8, 0.25, shade(col, 0.7), 2.4)}`;
const chimney = (x, y, z, col = "#B5654A") => `${box(x, y, 0.8, 0.8, 1.6, col, z)}${dot([x + 0.4, y + 0.4, z + 2.3], 4, "#fff", 'opacity=".8"')}${dot([x + 0.7, y + 0.2, z + 3.1], 5.5, "#fff", 'opacity=".6"')}`;
const palm = (x, y, s = 1) => {
  const [bx, by] = Pp(x, y), tx = bx + 4 * s, ty = by - 40 * s;
  return `<path d="M${bx} ${by} Q${bx + 6 * s} ${by - 20 * s} ${tx} ${ty}" stroke="#9C6B3F" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>${rep(6, (i) => `<path d="M${tx} ${ty} q${Math.cos((i * 60 * Math.PI) / 180) * 22 * s} ${Math.sin((i * 60 * Math.PI) / 180) * 12 * s - 10 * s} ${Math.cos((i * 60 * Math.PI) / 180) * 28 * s} ${Math.sin((i * 60 * Math.PI) / 180) * 14 * s + 5 * s}" stroke="#3F9A55" stroke-width="${5 * s}" fill="none" stroke-linecap="round"/>`)}`;
};
const parasol = (x, y, col) => {
  const [bx, by] = Pp(x, y);
  return `<path d="M${bx} ${by} v-26" stroke="${OL}" stroke-width="2"/><path d="M${bx - 15} ${by - 26} Q${bx} ${by - 42} ${bx + 15} ${by - 26}Z" fill="${col}" stroke="${OL}" stroke-width="1.5"/>`;
};
const table = (x, y, col = "#FFFFFF") => `${box(x, y, 0.9, 0.9, 0.7, col)}`;
const hedge = (x, y, w, d) => box(x, y, w, d, 0.9, "#4FB05F");
const post = (x, y) => box(x, y, 0.22, 0.22, 0.9, "#FFFFFF");
const fenceLine = (x0, y0, x1, y1, n = 8) => `${ln([x0, y0, 0.55], [x1, y1, 0.55], "#C98B55", 2)}${rep(n + 1, (i) => post(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n))}`;
const pool = (x, y, w, d) => `${rectF(x - 0.25, y - 0.25, w + 0.5, d + 0.5, 0.06, "#FFFFFF")}${rectF(x, y, w, d, 0.1, "#4FC3F7", 'stroke="#2F8FD6" stroke-width="1"')}${ln([x + w * 0.2, y + d * 0.35, 0.12], [x + w * 0.45, y + d * 0.35, 0.12], "#fff", 2)}${ln([x + w * 0.4, y + d * 0.7, 0.12], [x + w * 0.75, y + d * 0.7, 0.12], "#fff", 2)}`;
const fire = (x, y) => `${dot([x, y, 0.2], 8, "#8A5A34")}${dot([x, y, 0.8], 6, "#FF8A3C")}${dot([x, y, 1.2], 3.5, "#FFD93D", "")}`;
const tent = (x, y, col) => {
  const [a, b] = Pp(x, y, 0.2);
  return `<path d="M${a - 22} ${b} L${a} ${b - 30} L${a + 22} ${b}Z" fill="${col}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M${a - 5} ${b} L${a} ${b - 14} L${a + 5} ${b}Z" fill="${shade(col, 0.6)}"/>`;
};
const lamp = (x, y) => `${ln([x, y, 0], [x, y, 2.2], "#5B6478", 3)}${dot([x, y, 2.4], 4, "#FFF3B0")}`;
const bridge = (x, y, w) => `${box(x, y, w, 1, 0.5, "#E5484D")}${box(x + 0.4, y, w - 0.8, 1, 0.5, shade("#E5484D", 1.1), 0.5)}`;
const gate = (x, y, w) => `${box(x, y, 0.7, 0.7, 3, "#3A3347")}${box(x + w, y, 0.7, 0.7, 3, "#3A3347")}${ln([x + 0.3, y + 0.3, 3], [x + w + 0.3, y + 0.3, 3], "#3A3347", 4)}${rep(4, (i) => ln([x + 0.3 + (i + 1) * (w / 5), y + 0.3, 0], [x + 0.3 + (i + 1) * (w / 5), y + 0.3, 3], "#3A3347", 2))}`;
const truck = (x, y) => `${box(x, y, 3.2, 1.5, 1.7, "#FFFFFF", 0.4)}${box(x + 3.2, y, 1.3, 1.5, 1.2, "#4D96FF", 0.4)}${rep(3, (i) => dot([x + 0.5 + i * 1.6, y + 1.6, 0.35], 4, "#3A3347"))}`;
const ufo = (x, y, z) => {
  const [a, b] = Pp(x, y, z);
  return `<ellipse cx="${a}" cy="${b}" rx="14" ry="4.5" fill="#B8C0D0" stroke="${OL}" stroke-width="1.5"/><path d="M${a - 6} ${b - 2} Q${a} ${b - 14} ${a + 6} ${b - 2}Z" fill="#7DD3F8" stroke="${OL}" stroke-width="1.2"/>`;
};

/* ------------------------------------------------------------------ the bodies, by kind: (x, y) the back corner of the block, n floors */
export const BODY = {
  house: (x, y, c1, c2, v, n) => {
    const w = 7.4 + (v % 2), d = 5.4, sh = 2.5, X = x + 1.8, Y = y + 1.8, top = n * sh;
    return `${stack(X, Y, w, d, n, sh, c1, shade(c1, 0.88), "#C7E6FF", 3 + (v % 2), 2)}${v % 3 === 2 ? hip(X, Y, w, d, top, 2.6, c2) : gable(X, Y, w, d, top, 2.4, c2, c1)}${v % 2 ? chimney(X + w - 1.6, Y + 1.4, top + 1) : ""}${door(X + w / 2 - 0.7, Y, d, 1.4, 2.2)}${porch(X + w / 2 - 1.5, Y, 3, d)}${n > 1 ? balcony(X + 0.8, Y, 2.2, d, sh) : ""}`;
  },
  cottage: (x, y, c1, c2, v, n) => {
    const w = 6.4, d = 5, sh = 2.6, X = x + 2.4, Y = y + 2.4, top = n * sh;
    return `${stack(X, Y, w, d, n, sh, c1, null, "#FFF3B0", 2, 2)}${gable(X, Y, w, d, top, 2.4, c2, c1)}${chimney(X + w - 1.4, Y + 1.2, top + 1.1, "#9A6A52")}${door(X + 2.4, Y, d, 1.3, 2.2)}${porch(X + 1.6, Y, 3, d, "#B5865A")}${v % 2 ? box(X + w + 0.3, Y + 0.5, 0.8, 1.6, 0.6, "#C98B55") : ""}`;
  },
  tall: (x, y, c1, c2, v, n) => {
    const w = 6, d = 6, sh = 2.4, X = x + 3, Y = y + 2, top = n * sh;
    return `${stack(X, Y, w, d, n, sh, c1, shade(c1, 0.85), "#C7E6FF", 3, 3)}${hip(X, Y, w, d, top, 3, c2)}${box(X + 2.4, Y + 2.4, 1.2, 1.2, 1.6, shade(c2, 0.9), top)}${door(X + 2.3, Y, d, 1.4, 2.4)}${balcony(X + 0.7, Y, 2, d, sh)}${balcony(X + 3.4, Y, 2, d, sh * 2)}`;
  },
  tower: (x, y, c1, c2, v, n) => {
    const w = 6, d = 5.5, sh = 2.2, N = Math.max(n * 2 + 1, 4 + (v % 3)), X = x + 2.8, Y = y + 2.2, top = N * sh;
    return `${stack(X, Y, w, d, N, sh, c1, shade(c1, 0.9), "#FFF6E6", 4, 3)}${flatRoof(X, Y, w, d, top, c2)}${rep(Math.floor(N / 2), (i) => balcony(X + 0.6 + (i % 2) * 2.6, Y, 2.2, d, (i * 2 + 1) * sh))}${door(X + 2.3, Y, d, 1.5, 2.2, "#BFE6FF")}${awning(X + 1.6, Y, 3, d, 2.5, c2)}${v % 2 ? `${ln([X + w / 2, Y + d / 2, top + 0.45], [X + w / 2, Y + d / 2, top + 3.4], OL, 2)}${dot([X + w / 2, Y + d / 2, top + 3.5], 2.5, "#E5484D")}` : ""}`;
  },
  shop: (x, y, c1, c2, v, n) => {
    const w = 10.4, d = 6, sh = 2.6, X = x + 0.8, Y = y + 1.4, top = n * sh;
    return `${stack(X, Y, w, d, n, sh, c1, c2, "#FFF6E6", 5, 3)}${flat([[X + 0.5, Y + d, 0.3], [X + w - 0.5, Y + d, 0.3], [X + w - 0.5, Y + d, 2.0], [X + 0.5, Y + d, 2.0]], "#BFE6FF", `stroke="${OL}" stroke-width="1.5"`)}${door(X + 4.8 + (v % 3) * 0.6, Y, d, 1.6, 2.3, "#BFE6FF")}${awning(X + 0.3, Y, w - 0.6, d, 2.55, c2, "#FFFFFF", 8)}${flatRoof(X, Y, w, d, top, shade(c1, 0.92), v % 2 === 0)}${v % 3 === 0 ? gable(X, Y, w, d, top + 0.45, 1.4, c2, c1) : ""}`;
  },
  mall: (x, y, c1, c2, v, n) => {
    const w = 10.8, d = 8.4, sh = 3, X = x + 0.6, Y = y + 0.8, top = Math.max(n, 2) * sh;
    return `${stack(X, Y, w, d, Math.max(n, 2), sh, c1, c2, "#FFF6E6", 6, 4)}${flatRoof(X, Y, w, d, top, shade(c1, 0.9))}${box(X + 3.5, Y + d, 3.8, 1.4, 0.3, c2, 0)}${box(X + 3.3, Y + d, 4.2, 1.5, 0.3, shade(c2, 0.8), 3.1)}${door(X + 4.4, Y, d, 2, 2.6, "#BFE6FF")}${rep(6, (i) => rectF(X + 0.8 + i * 1.7, Y + d + 1.4, 1.2, 2.4, 0.04, "#E7EAF2", 'stroke="#fff" stroke-width="1"'))}${box(X + 3.4, Y + d, 4, 0.3, 4.2, c2, 3)}`;
  },
  manor: (x, y, c1, c2, v, n) => {
    const w = 9.6, d = 6, sh = 2.7, N = Math.max(n, 2), X = x + 1.2, Y = y + 1.6, top = N * sh;
    return `${stack(X, Y, w, d, N, sh, c1, "#FFFFFF", "#FFF6E6", 5, 3)}${hip(X, Y, w, d, top, 2.8, c2)}${box(X - 0.1, Y + 0.8, 2.2, 3.2, N * sh + 0.8, c1)}${hip(X - 0.1, Y + 0.8, 2.2, 3.2, N * sh + 0.8, 2, c2)}${box(X + w - 2.1, Y + 0.8, 2.2, 3.2, N * sh + 0.8, c1)}${hip(X + w - 2.1, Y + 0.8, 2.2, 3.2, N * sh + 0.8, 2, c2)}${rep(5, (i) => box(X + 2.6 + i * 1.1, Y + d, 0.35, 0.35, 3.2, "#FFFFFF"))}${box(X + 2.3, Y + d - 0.1, 6, 0.6, 0.3, "#E6DCC8", 3.2)}${door(X + w / 2 - 0.8, Y, d, 1.6, 2.6)}${box(X + w / 2 - 1.4, Y + d, 2.8, 1.6, 0.2, "#D8CFC0")}`;
  },
  villa: (x, y, c1, c2, v, n) => {
    const sh = 2.5, X = x + 1, Y = y + 1, N = Math.max(n, 1);
    return `${box(X, Y, 7.8, 5, sh, c1)}${windows(X, Y, 7.8, 5, sh, 1, 3, 2, "#9FD4FF")}${N > 1 ? box(X + 2, Y, 5.8, 5, sh, shade(c1, 0.96), sh) + windows(X + 2, Y, 5.8, 5, sh, 1, 2, 2, "#9FD4FF", sh) + balcony(X + 2.4, Y, 2.6, 5, sh) : ""}${N > 2 ? box(X + 3.4, Y + 1, 4.4, 3.4, sh, shade(c1, 0.92), sh * 2) + windows(X + 3.4, Y + 1, 4.4, 3.4, sh, 1, 2, 1, "#9FD4FF", sh * 2) : ""}${flatRoof(X, Y, 7.8, 5, sh, c2, false)}${N > 1 ? flatRoof(X + 2, Y, 5.8, 5, sh * 2, c2, false) : ""}${door(X + 1.2, Y, 5, 1.6, 2.2, c2)}`;
  },
  cabin: (x, y, c1, c2, v, n) => {
    const w = 6.6, d = 5, sh = 2.4, X = x + 2.2, Y = y + 2.2, top = n * sh;
    return `${stack(X, Y, w, d, n, sh, c1, shade(c1, 0.8), "#FFF3B0", 2, 2)}${rep(4, (i) => ln([X, Y + d, 0.6 + i * 0.5], [X + w, Y + d, 0.6 + i * 0.5], shade(c1, 0.75), 1.4))}${gable(X, Y, w, d, top, 2.4, c2, c1)}${chimney(X + w - 1.5, Y + 1.1, top + 1, "#8A6A52")}${door(X + 2.6, Y, d, 1.3, 2.1)}${porch(X + 1.6, Y, 3, d, "#9C6B3F")}${box(X - 1.2, Y + 1, 0.9, 2.4, 0.9, "#8A5A34")}${pine(x + 0.8, y + 1, 1)}${pine(x + 10, y + 2, 0.8)}${pine(x + 10.4, y + 8, 1)}`;
  },
  hut: (x, y, c1, c2) => `${box(x + 3.5, y + 3, 4.5, 4, 2.4, c1)}${gable(x + 3.5, y + 3, 4.5, 4, 2.4, 1.8, c2, c1)}${door(x + 5, y + 3, 4, 1.2, 1.9)}${windows(x + 3.5, y + 3, 4.5, 4, 2.4, 1, 1, 1, "#FFF3B0")}${chimney(x + 6.6, y + 4, 3.1)}${porch(x + 4.6, y + 3, 2, 4)}`,
  pavilion: (x, y, c1, c2, v) => `${rectF(x + 1, y + 1, 10, 9, 0.2, shade(c1, 1.1))}${rep(6, (i) => box(x + 1.4 + (i % 3) * 4.4, y + 1.6 + Math.floor(i / 3) * 6.8, 0.6, 0.6, 3.8, "#FFFFFF", 0.2))}${box(x + 0.8, y + 0.8, 10.4, 9.4, 0.5, c2, 4)}${hip(x + 0.8, y + 0.8, 10.4, 9.4, 4.5, 2.2, shade(c2, 1.1))}${rep(3, (i) => table(x + 3 + i * 2.6, y + 5 + (i % 2)))}${v === 2 ? dot([x + 6, y + 5.5, 1.5], 12, "#BFE9FF", 'opacity=".7"') : ""}`,
  park: (x, y, c1, c2, v) => `${rectF(x + 0.6, y + 0.6, 10.8, 10.8, 0.1, "#9BD7A0")}${rectF(x + 0.6, y + 5.4, 10.8, 1.6, 0.14, "#E8D9B5", "")}${tree(x + 2, y + 2, 0.9)}${tree(x + 10, y + 3, 0.9, "#8FD08A")}${tree(x + 3, y + 10, 0.8)}${v ? `${box(x + 5, y + 3.2, 2.4, 1, 0.9, c1)}${box(x + 5, y + 8, 2.4, 0.8, 0.8, c2)}` : `${rectF(x + 4, y + 2.4, 4, 2.6, 0.2, "#7FD0F2")}${tree(x + 8.5, y + 8.5, 0.9)}`}`,
  haunted: (x, y) => `${box(x + 3, y + 2, 6, 6, 6.4, "#5D4E7A")}${windows(x + 3, y + 2, 6, 6, 6.4, 2, 3, 3, "#FFD93D")}${gable(x + 3, y + 2, 6, 6, 6.4, 3.8, "#2B2340", "#5D4E7A")}${box(x + 7.6, y + 2.6, 1.4, 1.4, 9.2, "#4A3B66")}${hip(x + 7.6, y + 2.6, 1.4, 1.4, 9.2, 1.8, "#2B2340")}${door(x + 5.2, y + 2, 6, 1.4, 2.4, "#3A2A55")}${pine(x + 1, y + 9, 1)}${pine(x + 10.4, y + 9.4, 0.9)}${dot([x + 6, y + 8.6, 0.4], 3, "#9B5DE5")}`,
  camper: (x, y, c1, c2) => `${rectF(x + 0.6, y + 0.6, 10.8, 10.8, 0.1, "#B89B6A")}${box(x + 2, y + 4, 7, 3, 2.8, c1)}${box(x + 7.4, y + 4, 2.2, 3, 1.6, shade(c1, 0.9))}${windows(x + 2, y + 4, 7, 3, 2.8, 1, 3, 1, "#C7E6FF")}${box(x + 1, y + 7.1, 5, 0.5, 0.5, c2, 2.2)}${dot([x + 3, y + 7.1, 0.35], 4.5, "#3A3347")}${dot([x + 8, y + 7.1, 0.35], 4.5, "#3A3347")}${tent(x + 2.5, y + 9.2, "#FF8A3C")}${fire(x + 6.2, y + 9.4)}${ufo(x + 6, y + 2, 11)}${pine(x + 0.6, y + 1.4, 1)}${pine(x + 10.6, y + 9, 0.9)}`,
};

/* ------------------------------------------------------------------ the lot round it, by the theme of the pack: [behind, in front] */
export const LOT = {
  pool: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#EFE0C8"), `${pool(x + 2, y + 8.4, 6.4, 3)}${palm(x + 0.9, y + 7.4, 1.1)}${palm(x + 11, y + 7, 1)}${palm(x + 10.2, y + 11.2, 0.8)}${parasol(x + 9.6, y + 9.2, "#FFD93D")}${rectF(x + 0.8, y + 9.8, 1.6, 0.7, 0.2, "#FF8A8A")}`],
  spa: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#E8F2F0"), `${pool(x + 2.6, y + 8, 5.6, 3)}${palm(x + 1, y + 8.4, 0.9)}${dot([x + 3.6, y + 9, 0.5], 3, "#fff", "")}${dot([x + 5.2, y + 9.8, 0.5], 4, "#fff", "")}${rectF(x + 9, y + 9, 1.6, 0.7, 0.2, "#FFB6D5")}`],
  beach: (x, y) => [`${rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#F5DEB3")}${rectF(x + 0.3, y + 9.4, 11.4, 2.3, 0.12, "#4FB3FF", 'stroke="#2F8FD6" stroke-width="1"')}${ln([x + 1, y + 10.2, 0.15], [x + 3, y + 10.2, 0.15], "#fff", 2)}${ln([x + 6, y + 11, 0.15], [x + 9, y + 11, 0.15], "#fff", 2)}`, `${box(x + 3.2, y + 8.4, 5, 1, 0.3, "#C98B55")}${parasol(x + 1.4, y + 8, "#FF6B6B")}${parasol(x + 10.2, y + 7.8, "#4FC3F7")}${palm(x + 0.9, y + 5.4, 0.9)}`],
  terrace: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#D9C9B0"), `${rep(3, (i) => table(x + 1.6 + i * 3.2, y + 8.2 + (i % 2) * 1.1))}${parasol(x + 2, y + 8.4, "#E5484D")}${parasol(x + 8.4, y + 9.1, "#FFD93D")}${lamp(x + 0.8, y + 10.8)}${lamp(x + 11, y + 10.8)}`],
  garden: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#9CD58F"), `${fenceLine(x + 0.8, y + 11, x + 11, y + 11, 12)}${fenceLine(x + 11, y + 6, x + 11, y + 11, 4)}${rep(3, (i) => rectF(x + 1.2 + i * 2, y + 8.4, 1.5, 1.2, 0.22, "#8A5A34"))}${dot([x + 1.9, y + 9, 0.6], 3, "#6BCB77")}${dot([x + 3.9, y + 9, 0.6], 3, "#8FD08A")}${dot([x + 5.9, y + 9, 0.6], 3, "#5A9E5F")}${box(x + 9.4, y + 8.6, 1.4, 0.5, 0.5, "#FFFFFF")}`],
  pond: (x, y) => [`${rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#EADFC8")}${rectF(x + 2.4, y + 8.2, 6.4, 3.2, 0.12, "#6EC8E8", 'stroke="#8A93A8" stroke-width="1.6"')}${dot([x + 4, y + 9, 0.15], 4, "#FF9EC4", "")}${dot([x + 6.6, y + 9.8, 0.15], 4, "#FF9EC4", "")}`, `${bridge(x + 3, y + 9, 3.4)}${lamp(x + 1.2, y + 8)}${lamp(x + 10.4, y + 8)}${rep(3, (i) => dot([x + 9.4 + (i % 2) * 0.5, y + 4.6 + i * 1.3, 2.6 + i * 0.4], 2.2, "#8FD08A"))}${tree(x + 0.8, y + 4, 0.8, "#F28B82")}`],
  fountain: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#9FD48A"), `${gate(x + 3.4, y + 10.4, 4.4)}${dot([x + 6, y + 8.4, 0.5], 14, "#BFE9FF", 'opacity=".9"')}${dot([x + 6, y + 8.4, 1.9], 4, "#fff", "")}${rep(4, (i) => dot([x + 1.4 + i * 3, y + 6.2, 0.4], 3, ["#FF6B9D", "#FFD93D", "#fff", "#9B5DE5"][i]))}`],
  parkgate: (x, y) => [`${rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#9FD48A")}${rectF(x + 5, y + 4, 2, 7.6, 0.12, "#E8D9B5", "")}${rectF(x + 1, y + 7.6, 3.6, 2.4, 0.12, "#7FD0F2", 'stroke="#8A93A8" stroke-width="1.4"')}`, `${gate(x + 4, y + 11, 4)}${lamp(x + 3, y + 10)}${lamp(x + 9, y + 10)}${tree(x + 10.2, y + 4.2, 0.8)}${tree(x + 1.6, y + 4.4, 0.8, "#8FD08A")}`],
  play: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#B8E08A"), `${tree(x + 9.4, y + 6, 1.6)}${ln([x + 8.9, y + 6.5, 4.6], [x + 8.9, y + 6.5, 2.2], "#8A6A4A", 1.6)}${box(x + 8.6, y + 6.2, 0.7, 0.7, 0.18, "#FFB86B", 2)}${box(x + 1.4, y + 8.2, 1.4, 1.4, 2.2, "#4D96FF")}${ln([x + 2.8, y + 9, 2.2], [x + 5, y + 10, 0.1], "#FFD93D", 5)}${rectF(x + 1, y + 5.4, 2.2, 1.8, 0.12, "#F5DEB3")}`],
  yard: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#B8BCCB"), `${truck(x + 1.4, y + 8.6)}${box(x + 7.2, y + 9.4, 1.1, 1, 1.1, "#C98B55")}${box(x + 8.5, y + 9.4, 1.1, 1, 1.1, "#D9A06A")}${rep(5, (i) => box(x + 6.4 + i * 1, y + 11.2, 0.4, 0.4, 0.5, i % 2 ? "#FFD93D" : "#FFFFFF"))}`],
  rooftop: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#B8BCCB"), `${rep(3, (i) => box(x + 1.4 + i * 3, y + 10.2, 1.6, 0.8, 0.6, "#C98B55"))}${rep(3, (i) => dot([x + 2.1 + i * 3, y + 10.6, 0.9], 3.2, "#E5484D"))}${box(x + 9.8, y + 2, 1.6, 1.6, 2.4, "#9AA4BA")}`],
  camp: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#B89B6A"), `${tent(x + 2.6, y + 9.2, "#FF8A3C")}${tent(x + 9.2, y + 9.6, "#4D96FF")}${fire(x + 6, y + 10)}${pine(x + 0.7, y + 3, 1.1)}${pine(x + 11, y + 3, 1.2)}`],
  porch: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#A8DDB0"), `${rectF(x + 5, y + 8, 2, 3.6, 0.12, "#E8D9B5", "")}${box(x + 10.2, y + 9.6, 0.3, 0.3, 1, "#8A6A4A")}${box(x + 9.9, y + 9.4, 0.9, 0.6, 0.5, "#E5484D", 1)}${tree(x + 1, y + 10, 0.9)}${tree(x + 11, y + 1.6, 0.8, "#8FD08A")}`],
  manor: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#D8CFC0"), `${rectF(x + 5, y + 7.4, 2.4, 4.2, 0.12, "#C2B8A6", "")}${rep(2, (i) => hedge(x + 0.8 + i * 8.6, y + 8.6, 2.6, 0.9))}${rep(2, (i) => dot([x + 2 + i * 8.4, y + 10.6, 1.6], 4.5, "#5ABF68"))}${lamp(x + 4.6, y + 11)}${lamp(x + 7.8, y + 11)}`],
  city: (x, y) => [rectF(x + 0.3, y + 0.3, 11.4, 11.4, 0.08, "#CBD0DE"), `${rectF(x + 0.3, y + 11, 11.4, 0.7, 0.14, "#9AA4BA", "")}${lamp(x + 1, y + 10.4)}${lamp(x + 10.6, y + 10.4)}${box(x + 3, y + 10, 1.8, 0.6, 0.5, "#8A5A34")}${dot([x + 3.9, y + 10.2, 0.9], 3.6, "#6BCB77")}`],
};
/* kind: what it is, v: which of its variations, n: how many floors, theme: what the pack has round it, (x, y): the block */
export function buildingSvg(kind, v, c1, c2, n, theme, x, y) {
  // the park and the campsite are lots themselves
  const [under, over] = kind === "park" || kind === "camper" ? ["", ""] : (LOT[theme] || (() => ["", ""]))(x, y);
  return `${under}${BODY[kind](x, y - 1.4, c1, c2, v, n)}${over}`;
}
