/* Hverdagsro – the backdrop of a place: a wall with its own pattern, windows along it, a floor. Used by the places of
   the theme packs (hv-towns) and of the worlds (hv-worlds). */
import { OL, shade } from "./hv-playcat.js";
import { BG } from "./hv-world.js";

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

