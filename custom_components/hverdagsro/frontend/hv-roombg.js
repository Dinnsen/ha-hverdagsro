/* Hverdagsro – the backdrop of a place: a wall with its own pattern, windows along it, a floor. Used by the places of
   the theme packs (hv-towns) and of the worlds (hv-worlds). */
import { OL, shade } from "./hv-playcat.js";
import { BG } from "./hv-world.js";
import { SCENERY } from "./hv-scenery.js";

const { W, H, FLOOR, T3, rect, out, rep, skyDef } = BG;

/* ------------------------------------------------------------------ the backdrop of a place */
export const STYLES = ["panel", "stripes", "dots", "bricks", "tiles", "plain"];
export function roomBg(pk, style, s0, s1, tod, wd = W) {
  const wall = BG.look?.wall || pk.wall, floor = BG.look?.floor || pk.floor, accent = pk.cols[1] || "#fff";
  let deco = "";
  if (style === "stripes") deco = rep(Math.ceil(wd / 60), (i) => (i % 2 ? "" : rect(i * 60, 0, 30, FLOOR, shade(wall, 0.95))));
  else if (style === "dots") deco = rep(Math.ceil(wd / 50), (i) => rep(7, (j) => `<circle cx="${i * 50 + 25 + (j % 2) * 25}" cy="${30 + j * 55}" r="5" fill="${shade(wall, 0.9)}"/>`));
  else if (style === "bricks") deco = rep(9, (j) => rep(Math.ceil(wd / 90) + 1, (i) => rect(i * 90 - (j % 2) * 45, 20 + j * 46, 86, 42, shade(wall, 0.96), 3, `stroke="${shade(wall, 0.86)}" stroke-width="2"`)));
  else if (style === "tiles") deco = rep(Math.ceil(wd / 40), (i) => rep(6, (j) => `<rect x="${i * 40}" y="${FLOOR - 180 + j * 30}" width="40" height="30" fill="none" stroke="${shade(wall, 0.82)}" stroke-width="3"/>`));
  else if (style === "panel") deco = `${rect(0, FLOOR - 170, wd, 170, shade(wall, 0.93))}${rect(0, FLOOR - 176, wd, 10, shade(wall, 0.85))}${rep(Math.ceil(wd / 120), (i) => rect(i * 120 + 14, FLOOR - 150, 92, 120, "none", 6, `stroke="${shade(wall, 0.82)}" stroke-width="3"`))}`;
  // the real weather outside: rain or snow falls in front of the sky
  const wx = BG.wx || "";
  const weather = (win) =>
    wx
      ? `<clipPath id="bw-${win}"><rect x="${win + 12}" y="82" width="166" height="136" rx="6"/></clipPath><g class="fx-rain" clip-path="url(#bw-${win})">${rep(8, (j) => (wx === "rain" ? `<path d="M${win + 22 + j * 20} 80 v12" stroke="#4FB3FF" stroke-width="3" stroke-linecap="round" style="--fall:150px;animation-delay:${-(j * 0.17) % 0.6}s"/>` : `<circle cx="${win + 24 + j * 20}" cy="84" r="4" fill="#fff" style="--fall:150px;animation-delay:${-(j * 0.23) % 1.4}s"/>`))}</g>`
      : "";
  const winAt = (win) => `${rect(win, 70, 190, 160, "#fff", 12, out())}${rect(win + 12, 82, 166, 136, "url(#pl-sky)", 6)}${tod === "night" ? `<circle cx="${win + 120}" cy="120" r="16" fill="#FFF6C9"/>` : `<circle cx="${win + 120}" cy="120" r="20" fill="#FFE066"/>`}${weather(win)}<path d="M${win + 95} 82 V218 M${win + 12} 150 H${win + 178}" stroke="${OL}" stroke-width="6"/>`;
  // the windows, doors, curtains and lights of the original, where it has them; else a window of our own
  const fx = pk.fx || [];
  const at = (kind) => fx.filter(([k]) => k === kind).map(([, x]) => x);
  const wins = at("window");
  const window =
    skyDef(s0, s1) +
    (wins.length
      ? wins.map((x) => winAt(Math.max(8, Math.min(wd - 200, x - 95)))).join("")
      : rep(Math.max(1, Math.floor((wd - 100) / 700)), (i) => winAt(Math.min(wd - 260, 640 + i * 700))));
  const doors = at("door").map((x) => `${rect(x - 36, FLOOR - 190, 72, 190, shade(wall, 0.72), 8, out())}${rect(x - 26, FLOOR - 176, 52, 70, shade(wall, 0.62), 4, 'stroke-width="2" stroke="#2B2340"')}<circle cx="${x + 22}" cy="${FLOOR - 92}" r="5" fill="#FFD93D" stroke="#2B2340" stroke-width="2"/>`).join("");
  const lights = at("light").map((x) => `<ellipse cx="${x}" cy="170" rx="46" ry="40" class="pl-glow" fill="#FFE8A3"/><path d="M${x - 12} 150 h24 l-5 26 h-14z" fill="#FFE8A3" ${out(T3)}/>`).join("");
  return `${rect(0, 0, wd, FLOOR, wall)}${deco}${window}${rect(0, 0, wd, 12, accent, 0, 'opacity=".5"')}${doors}${lights}${rect(0, FLOOR - 16, wd, 16, "#fff", 0, out())}${rect(0, FLOOR, wd, H - FLOOR, floor)}${rep(6, (i) => `<path d="M0 ${FLOOR + 30 * (i + 1)} H${wd}" stroke="${shade(floor, 0.88)}" stroke-width="3"/>`)}`;
}

/* ------------------------------------------------------------------ outdoors: a garden, a balcony, a park */
const hillsW = (wd, col, y, k) => `<path d="M0 ${y} ${rep(Math.ceil(wd / 340), (i) => `Q${i * 340 + 170} ${y - 56 - ((i + k) % 3) * 18} ${i * 340 + 340} ${y - 6 - ((i + k) % 2) * 14}`)} V${FLOOR} H0Z" fill="${col}"/>`;
export function outdoorBg(kind, s0, s1, tod, wd = W, seed = 0, theme = "") {
  const night = tod === "night";
  const wx = BG.wx || "";
  const sky = `${skyDef(s0, s1)}${rect(0, 0, wd, FLOOR, "url(#pl-sky)")}${BG.sunMoon(Math.max(140, wd * 0.7), 90, tod)}${night ? "" : rep(Math.max(1, Math.floor(wd / 520)), (i) => BG.cloud(160 + i * 520 + ((seed + i) % 3) * 40, 70 + ((i + seed) % 2) * 34, 0.8 + ((i + seed) % 3) * 0.1))}`;
  const rain = wx
    ? `<g class="fx-rain" pointer-events="none">${rep(Math.ceil(wd / 44), (j) => (wx === "rain" ? `<path d="M${14 + j * 44} 20 v14" stroke="#4FB3FF" stroke-width="3" stroke-linecap="round" style="--fall:560px;animation-delay:${-(j * 0.13) % 0.9}s"/>` : `<circle cx="${14 + j * 44}" cy="20" r="4" fill="#fff" style="--fall:560px;animation-delay:${-(j * 0.31) % 2.4}s"/>`))}</g>`
    : "";
  // the pack's own surroundings, where it has them
  if (SCENERY[theme]) return `${sky}${SCENERY[theme](wd, night, seed)}${rain}`;
  if (kind === "balcony") {
    // a railing, and the roofs of the town behind it
    const roofs = rep(Math.ceil(wd / 120), (i) => rect(i * 120 + 6, 150 + ((i * 37 + seed * 11) % 110), 100, FLOOR, shade("#9AA4BA", 0.9 + (i % 3) * 0.08), 3, out(BG.T3)));
    const rail = `${rect(0, FLOOR - 130, wd, 12, "#E9EEF6", 4, out())}${rep(Math.ceil(wd / 46), (i) => rect(i * 46 + 18, FLOOR - 118, 10, 118, "#E9EEF6", 3, out(BG.T3)))}`;
    return `${sky}${roofs}${rail}${rect(0, FLOOR, wd, H - FLOOR, "#C98B55")}${rep(Math.ceil(wd / 150), (i) => `<path d="M${i * 150} ${FLOOR} V${H}" stroke="${shade("#C98B55", 0.8)}" stroke-width="4"/>`)}${rain}`;
  }
  // a garden or a park: hills, trees, a fence, grass
  const trees = rep(Math.ceil(wd / 260), (i) => {
    const x = 90 + i * 260 + ((i * 53 + seed * 29) % 70), s = 0.8 + ((i + seed) % 3) * 0.16;
    return `<rect x="${x - 9}" y="${FLOOR - 150 * s}" width="18" height="${150 * s}" rx="5" fill="#A9764C" ${out(BG.T3)}/><circle cx="${x}" cy="${FLOOR - 170 * s}" r="${58 * s}" fill="${["#6BCB77", "#5A9E5F", "#8FD08A"][(i + seed) % 3]}" ${out()}/>`;
  });
  const fence = kind === "park" ? "" : `${rep(Math.ceil(wd / 40), (i) => rect(i * 40 + 4, FLOOR - 70, 12, 70, "#C98B55", 4, out(BG.T3)))}<path d="M0 ${FLOOR - 50} H${wd} M0 ${FLOOR - 20} H${wd}" stroke="#A9764C" stroke-width="8"/>`;
  const flowers = rep(Math.ceil(wd / 170), (i) => `<g transform="translate(${60 + i * 170 + ((i * 41 + seed * 7) % 60)} ${FLOOR + 118 + (i % 2) * 44})"><path d="M0 0 v-18" stroke="#4FB05F" stroke-width="3"/><circle cy="-22" r="7" fill="${["#FF6B6B", "#FFD93D", "#F15BB5", "#fff"][(i + seed) % 4]}"/></g>`);
  return `${sky}${hillsW(wd, "#A8DDB0", 320, seed)}${hillsW(wd, "#8FD08A", 380, seed + 1)}${trees}${fence}${rect(0, FLOOR, wd, H - FLOOR, "#7CC489")}<path d="M0 ${FLOOR} H${wd}" stroke="#5FA874" stroke-width="6"/>${rect(0, FLOOR + 70, wd, 52, "#E7D3A8", 0, 'opacity=".55"')}${flowers}${rain}`;
}

/* ------------------------------------------------------------------ a whole floor: its rooms side by side
   F: { cols, rooms: [{ x0, x1, out, kind, wall, floor, style, fx: [[kind, x] …] }] } (x as on the floor; the rooms tile it) */
export function floorBg(F, s0, s1, tod, wd) {
  const parts = F.rooms.map((r, i) => {
    const w = r.x1 - r.x0;
    const inner = r.out
      ? outdoorBg(r.kind, s0, s1, tod, w, i, r.kind === "balcony" && !/^(city|rooftop|terrace)$/.test(F.theme || "") ? "city" : F.theme)
      : roomBg({ wall: r.wall, floor: r.floor, cols: F.cols, fx: (r.fx || []).map(([k, x]) => [k, x - r.x0]) }, r.style, s0, s1, tod, w);
    return `<svg x="${r.x0}" y="0" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}">${inner}</svg>`;
  });
  // the walls between the rooms: a post with a doorway in it (a glass door where it meets the garden)
  const posts = F.rooms.slice(1).map((r, i) => {
    const x = r.x0, a = F.rooms[i], glass = a.out !== r.out;
    if (a.out && r.out) return "";
    return `<g pointer-events="none"><rect x="${x - 14}" y="-10" width="28" height="${FLOOR + 20}" fill="${glass ? "#DDEBFA" : "#F4EEE4"}" stroke="${OL}" stroke-width="4"/>${glass ? `<path d="M${x} 20 V${FLOOR}" stroke="${OL}" stroke-width="3"/>` : `<rect x="${x - 40}" y="${FLOOR - 200}" width="80" height="200" rx="10" fill="none" stroke="${OL}" stroke-width="5"/><rect x="${x - 40}" y="${FLOOR - 212}" width="80" height="14" rx="6" fill="#F4EEE4" stroke="${OL}" stroke-width="4"/>`}</g>`;
  });
  return `${parts.join("")}${posts.join("")}`;
}
