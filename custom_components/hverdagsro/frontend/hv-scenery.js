/* Hverdagsro – what lies round the buildings: the pool and the palms, the beach and its porch, the café terrace, the
   bakery's garden, the lotus pond, the park gate, the tree swing, the loading dock, the rooftop, the campsite. In the
   original every outdoor stretch of a pack is built of its own back and front pieces (a pool with a back and a front, a
   patio with a roof, a porch with stairs, a lotus garden, a gate, a truck, a waterfall…); here each is drawn in our own
   way and fills the stretch as wide as it is. A theme draws from the horizon (y = FLOOR) up, and the ground in front. */
import { OL, shade } from "./hv-playcat.js";
import { BG } from "./hv-world.js";

const { H, FLOOR, T3, rect, out, rep } = BG;
const ol = () => out(T3);
const ol2 = () => out(`stroke-width="2"`);
const el = (cx, cy, rx, ry, f, ex = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" ${ex}/>`;
const ci = (cx, cy, r, f, ex = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" ${ex}/>`;
const pa = (d, f, ex = "") => `<path d="${d}" fill="${f}" ${ex}/>`;
const ln = (d, c, w = 4) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
/* x positions along a stretch, one every `step` px, from `from`, with a little spread by the seed */
const along = (wd, step, from, fn, seed = 0) => rep(Math.max(0, Math.floor((wd - from) / step) + 1), (i) => fn(from + i * step + ((i * 37 + seed * 23) % 40), i));
const ground = (wd, col, lines = "") => `${rect(0, FLOOR, wd, H - FLOOR, col)}${lines}<path d="M0 ${FLOOR} H${wd}" stroke="${shade(col, 0.78)}" stroke-width="6"/>`;
const planks = (wd, col) => rep(Math.ceil(wd / 90), (i) => `<path d="M${i * 90} ${FLOOR} L${i * 90 - 40} ${H}" stroke="${shade(col, 0.82)}" stroke-width="3"/>`);
const tiles = (wd, col) => rep(Math.ceil(wd / 100), (i) => `<path d="M${i * 100} ${FLOOR} V${H}" stroke="${shade(col, 0.9)}" stroke-width="3"/>`) + rep(4, (j) => `<path d="M0 ${FLOOR + 45 + j * 45} H${wd}" stroke="${shade(col, 0.9)}" stroke-width="3"/>`);

/* ------------------------------------------------------------------ the parts */
const palm = (x, s = 1, lean = 30) => {
  const tx = x + lean * s, ty = FLOOR - 190 * s;
  return `${ln(`M${x} ${FLOOR} Q${x + lean * 0.2 * s} ${FLOOR - 100 * s} ${tx} ${ty}`, "#8A5A34", 16 * s)}${ln(`M${x} ${FLOOR} Q${x + lean * 0.2 * s} ${FLOOR - 100 * s} ${tx} ${ty}`, "#B07A4A", 9 * s)}${rep(7, (i) => `<g transform="translate(${tx} ${ty}) rotate(${-110 + i * 36}) scale(${s})">${pa("M0 0 Q36 -34 96 -4 Q50 -12 0 0Z", i % 2 ? "#4FB05F" : "#6BCB77", ol())}</g>`)}${ci(tx + 4 * s, ty + 6 * s, 7 * s, "#7A4A28", ol())}`;
};
const bush = (x, y, s = 1, col = "#5A9E5F") => `${el(x, y, 44 * s, 8 * s, "rgba(0,0,0,.12)")}${ci(x - 22 * s, y - 20 * s, 26 * s, col, ol())}${ci(x + 22 * s, y - 20 * s, 26 * s, shade(col, 1.1), ol())}${ci(x, y - 34 * s, 30 * s, shade(col, 0.95), ol())}`;
const flowers = (x, y, n, cols = ["#FF6B9D", "#FFD93D", "#fff", "#9B5DE5"]) => rep(n, (i) => `<g transform="translate(${x + i * 26} ${y - (i % 2) * 6})">${ln("M0 0 v-22", "#4FB05F", 3)}${ci(0, -26, 8, cols[i % cols.length], ol())}${ci(0, -26, 3, "#FFD93D")}</g>`);
const lamp = (x, h = 150) => `${rect(x - 5, FLOOR - h, 10, h, "#5B6478", 3, ol())}${rect(x - 16, FLOOR - h - 26, 32, 28, "#FFF3B0", 8, ol())}`;
const tree = (x, s = 1, col = "#6BCB77") => `${rect(x - 10 * s, FLOOR - 140 * s, 20 * s, 140 * s, "#A9764C", 5, ol())}${ci(x, FLOOR - 170 * s, 62 * s, col, ol())}${ci(x - 40 * s, FLOOR - 140 * s, 40 * s, shade(col, 0.92), ol())}${ci(x + 42 * s, FLOOR - 146 * s, 42 * s, shade(col, 1.06), ol())}`;
const pine = (x, s = 1) => `${rect(x - 8 * s, FLOOR - 30 * s, 16 * s, 30 * s, "#8A5A34")}${[0, 1, 2].map((i) => pa(`M${x - (70 - i * 14) * s} ${FLOOR - (20 + i * 62) * s} L${x} ${FLOOR - (110 + i * 62) * s} L${x + (70 - i * 14) * s} ${FLOOR - (20 + i * 62) * s}Z`, shade("#3F7F4A", 1 + i * 0.08), ol())).join("")}`;
const parasol = (x, y, col, s = 1) => `${rect(x - 3, y - 150 * s, 6, 150 * s, "#8A6A4A")}${pa(`M${x - 90 * s} ${y - 150 * s} Q${x} ${y - 230 * s} ${x + 90 * s} ${y - 150 * s}Z`, col, ol())}${pa(`M${x - 30 * s} ${y - 150 * s} Q${x - 24 * s} ${y - 210 * s} ${x} ${y - 218 * s} Q${x + 24 * s} ${y - 210 * s} ${x + 30 * s} ${y - 150 * s}Z`, "#fff", 'opacity=".8"')}`;
const table = (x, y, col = "#fff") => `${el(x, y, 56, 10, "rgba(0,0,0,.12)")}${rect(x - 5, y - 60, 10, 58, "#8A6A4A")}${el(x, y - 62, 58, 12, col, ol())}${rect(x - 70, y - 40, 22, 40, "#C98B55", 4, ol())}${rect(x + 48, y - 40, 22, 40, "#C98B55", 4, ol())}`;
const lounger = (x, y, col) => `${el(x, y, 62, 9, "rgba(0,0,0,.12)")}${pa(`M${x - 64} ${y - 20} H${x + 20} L${x + 66} ${y - 52} L${x + 52} ${y - 62} L${x + 10} ${y - 34} H${x - 64}Z`, col, ol())}${rect(x - 62, y - 18, 8, 18, "#8A6A4A")}${rect(x + 12, y - 18, 8, 18, "#8A6A4A")}`;
const stringLights = (x0, x1, y, night) => `${ln(`M${x0} ${y} Q${(x0 + x1) / 2} ${y + 46} ${x1} ${y}`, "#3A3347", 2)}${rep(Math.max(2, Math.floor((x1 - x0) / 46)), (i) => { const t = (i + 0.5) / Math.max(2, Math.floor((x1 - x0) / 46)); const px = x0 + (x1 - x0) * t, py = y + 46 * 2 * t * (1 - t) + 3; return ci(px, py + 4, 6, ["#FFD93D", "#FF8A3C", "#fff", "#FF6B9D"][i % 4], night ? 'class="pl-glow"' : ol2()); })}`;
const fence = (x0, x1, y = FLOOR, h = 70, col = "#C98B55") => `${rep(Math.ceil((x1 - x0) / 36), (i) => pa(`M${x0 + i * 36 + 2} ${y} V${y - h + 8} L${x0 + i * 36 + 12} ${y - h} L${x0 + i * 36 + 22} ${y - h + 8} V${y}Z`, col, ol()))}${ln(`M${x0} ${y - h * 0.62} H${x1} M${x0} ${y - h * 0.22} H${x1}`, shade(col, 0.8), 7)}`;
const skyline = (wd, col, night, seed = 0, top = 130) => rep(Math.ceil(wd / 108), (i) => {
  const h = top + ((i * 53 + seed * 31) % 120), x = i * 108 + 6;
  return `${rect(x, h, 96, FLOOR - h, shade(col, 0.9 + (i % 3) * 0.07), 3, ol())}${rep(4, (j) => rep(2, (k) => rect(x + 16 + k * 44, h + 20 + j * 44, 22, 24, night ? "#FFE066" : "#C7E6FF", 2, 'opacity=".85"')))}`;
});
const lotus = (x, y, s = 1) => `${el(x, y, 34 * s, 9 * s, "#4FB05F", ol())}${pa(`M${x - 4 * s} ${y - 4 * s} q${-8 * s} ${-22 * s} 0 ${-30 * s} q${8 * s} ${8 * s} ${0} ${30 * s}Z M${x + 4 * s} ${y - 4 * s} q${10 * s} ${-18 * s} ${2 * s} ${-28 * s} q${-8 * s} ${10 * s} ${-2 * s} ${28 * s}Z`, "#FF9EC4", ol2())}`;
const lantern = (x, s = 1) => `${rect(x - 12 * s, FLOOR - 24 * s, 24 * s, 24 * s, "#9AA4BA", 4, ol())}${rect(x - 7 * s, FLOOR - 70 * s, 14 * s, 46 * s, "#B8C0D0", 3, ol())}${rect(x - 22 * s, FLOOR - 100 * s, 44 * s, 32 * s, "#FFE8A3", 5, ol())}${pa(`M${x - 34 * s} ${FLOOR - 98 * s} Q${x} ${FLOOR - 140 * s} ${x + 34 * s} ${FLOOR - 98 * s}Z`, "#8A93A8", ol())}`;
const hillsOf = (wd, a, b, seed) => `${hillsW(wd, a, 330, seed)}${hillsW(wd, b, 385, seed + 1)}`;
const hillsW = (wd, col, y, k) => `<path d="M0 ${y} ${rep(Math.ceil(wd / 340), (i) => `Q${i * 340 + 170} ${y - 56 - ((i + k) % 3) * 18} ${i * 340 + 340} ${y - 6 - ((i + k) % 2) * 14}`)} V${FLOOR} H0Z" fill="${col}"/>`;

/* ------------------------------------------------------------------ the themes */
export const SCENERY = {
  /* a pool villa: palms behind, a roofed patio, the pool in the deck with its ladder, loungers */
  pool: (wd, night, seed) => {
    const deck = "#EFE0C8";
    const back = `${hillsOf(wd, "#BFE3D0", "#9FD5B5", seed)}${along(wd, 380, 120, (x, i) => palm(x, 0.9 + (i % 3) * 0.12, i % 2 ? 40 : -34), seed)}`;
    const patio = along(wd, 1300, 420, (x) => `${rect(x - 170, FLOOR - 200, 340, 18, "#fff", 4, ol())}${rep(5, (i) => rect(x - 160 + i * 80, FLOOR - 182, 12, 182, "#fff", 3, ol()))}${rect(x - 170, FLOOR - 214, 340, 16, "#7DD3C0", 6, ol())}${stringLights(x - 160, x + 160, FLOOR - 160, night)}`, seed);
    const pools = along(wd, 1300, 760, (x) => `${rect(x - 300, FLOOR + 22, 600, 150, "#fff", 40, ol())}${rect(x - 284, FLOOR + 34, 568, 126, night ? "#2F6FB8" : "#4FC3F7", 32)}${rep(6, (i) => ln(`M${x - 250 + i * 90} ${FLOOR + 70 + (i % 2) * 24} q22 -12 44 0 q22 12 44 0`, "#fff", 4).replace("<path", '<path opacity=".6"'))}${ln(`M${x + 230} ${FLOOR + 32} v-34 q0 -14 14 -14 M${x + 262} ${FLOOR + 32} v-34 q0 -14 -14 -14`, "#C9D2E3", 6)}${ci(x - 120, FLOOR + 96, 22, "#FF6B9D", ol())}${ci(x - 120, FLOOR + 96, 10, "#fff")}`, seed);
    const chairs = along(wd, 1300, 160, (x, i) => `${lounger(x, FLOOR + 130, i % 2 ? "#FF8A8A" : "#FFB86B")}${parasol(x + 130, FLOOR + 120, i % 2 ? "#FFD93D" : "#4FC3F7", 0.8)}`, seed);
    return `${back}${patio}${ground(wd, deck, tiles(wd, deck))}${pools}${chairs}`;
  },
  /* a spa: a bubbling pool with a ladder, towels, steam */
  spa: (wd, night, seed) => {
    const deck = "#E8F2F0";
    const pools = along(wd, 1000, 520, (x) => `${rect(x - 330, FLOOR + 16, 660, 170, "#fff", 50, ol())}${rect(x - 312, FLOOR + 30, 624, 140, night ? "#3A7CC0" : "#7DDBF0", 40)}${rep(8, (i) => ci(x - 270 + i * 76, FLOOR + 50 + (i * 37) % 80, 10 + (i % 3) * 5, "#fff", 'opacity=".7"'))}${ln(`M${x + 240} ${FLOOR + 24} v-40 q0 -14 14 -14 M${x + 272} ${FLOOR + 24} v-40 q0 -14 -14 -14`, "#C9D2E3", 6)}`, seed);
    const steam = along(wd, 440, 200, (x, i) => `<g class="fx-steam" opacity=".7">${ln(`M${x} ${FLOOR - 30} q16 -34 0 -62 q-16 -30 0 -60`, "#fff", 7)}</g>`, seed);
    const towels = along(wd, 1000, 120, (x, i) => `${rect(x, FLOOR + 90, 90, 14, ["#FFB6D5", "#B8E8F2", "#FFE8A3"][i % 3], 4, ol())}${rect(x + 10, FLOOR + 76, 70, 14, ["#B8E8F2", "#FFB6D5", "#C8F0D0"][i % 3], 4, ol())}${bush(x + 160, FLOOR + 60, 0.8, "#6BCB77")}`, seed);
    return `${skyline(wd, "#B8C6DA", night, seed, 190)}${along(wd, 300, 90, (x, i) => palm(x, 0.7, i % 2 ? 24 : -24), seed)}${ground(wd, deck, tiles(wd, deck))}${steam}${pools}${towels}`;
  },
  /* a beach house: the sea, boats, sand, a porch with stairs and a sofa */
  beach: (wd, night, seed) => {
    const sea = `${rect(0, 250, wd, FLOOR - 250, night ? "#27508A" : "#4FB3FF")}${rep(Math.ceil(wd / 150), (i) => ln(`M${i * 150 + 20} ${290 + (i % 4) * 36} q22 -12 44 0 q22 12 44 0`, "#fff", 4).replace("<path", '<path opacity=".6"'))}<path d="M0 250 H${wd}" stroke="#2F8FD6" stroke-width="5"/>${along(wd, 900, 300, (x, i) => `<g transform="translate(${x} ${300 + (i % 2) * 40})">${pa("M-46 0 H46 L30 24 H-30Z", "#E5484D", ol())}${rect(-2, -96, 4, 96, "#8A6A4A")}${pa("M4 -96 L60 -14 H4Z", "#fff", ol())}${pa("M-4 -80 L-44 -14 H-4Z", "#FFD93D", ol())}</g>`, seed)}`;
    const sand = "#F5DEB3";
    const porch = along(wd, 1200, 560, (x) => `${rect(x - 260, FLOOR - 28, 520, 28, "#C98B55", 4, ol())}${rep(9, (i) => rect(x - 250 + i * 58, FLOOR - 120, 10, 92, "#fff", 3, ol()))}${rect(x - 262, FLOOR - 128, 524, 12, "#fff", 4, ol())}${rect(x - 262, FLOOR + 4, 524, 16, "#A9764C", 3, ol())}${rep(3, (i) => rect(x - 90 + i * 0, FLOOR + 20 + i * 18, 180 + i * 40 - 0, 18, "#C98B55", 3, ol()))}`, seed);
    const beach = along(wd, 600, 140, (x, i) => `${parasol(x, FLOOR + 90, ["#FF6B6B", "#4FC3F7", "#FFD93D"][i % 3], 0.8)}${pa(`M${x + 70} ${FLOOR + 110} q10 -16 26 0 q-10 6 -26 0Z`, "#FFB6C1", ol2())}`, seed);
    return `${sea}${porch}${ground(wd, sand, rep(Math.ceil(wd / 70), (i) => ci(i * 70 + ((i * 29) % 40), FLOOR + 30 + ((i * 53) % 130), 3, "#E8C98F")))}${beach}${palm(60, 0.8, 26)}`;
  },
  /* a café terrace: an awning, a lit wall, tables and parasols, flower boxes */
  terrace: (wd, night, seed) => {
    const wall = "#FFE9D6";
    const front = `${rect(0, 60, wd, FLOOR - 60, wall)}${rep(Math.ceil(wd / 60), (i) => (i % 2 ? "" : rect(i * 60, 60, 30, FLOOR - 60, "#FFE0C2")))}${along(wd, 360, 120, (x, i) => `${rect(x - 70, 120, 140, 190, night ? "#FFE8A3" : "#C7E6FF", 8, ol())}${ln(`M${x} 120 V310 M${x - 70} 215 H${x + 70}`, OL, 4)}${rect(x - 84, 310, 168, 28, "#8A6A4A", 5, ol())}${flowers(x - 66, 312, 6, ["#FF6B9D", "#fff", "#FFD93D"])}`, seed)}`;
    const nA = Math.ceil(wd / 100), awn = `<path d="M0 78 H${nA * 100} V118 ${rep(nA, (j) => `Q${(nA - 1 - j) * 100 + 50} 150 ${(nA - 1 - j) * 100} 118`)} Z" fill="#E5484D" ${ol()}/>${rep(Math.ceil(wd / 100), (i) => `<path d="M${i * 100 + 25} 78 V136" stroke="#fff" stroke-width="24" opacity=".92"/>`)}${stringLights(0, wd, 168, night)}`;
    const sets = along(wd, 330, 140, (x, i) => `${table(x, FLOOR + 110 + (i % 2) * 40, i % 2 ? "#FFF3B0" : "#fff")}${i % 3 === 0 ? parasol(x, FLOOR + 110 + (i % 2) * 40, ["#E5484D", "#FFD93D", "#4FC3F7"][i % 3] ?? "#E5484D", 0.9) : ""}`, seed);
    const pots = along(wd, 900, 60, (x) => `${rect(x - 22, FLOOR - 60, 44, 60, "#C2502A", 6, ol())}${bush(x, FLOOR - 54, 0.7, "#4FB05F")}`, seed);
    return `${front}${awn}${ground(wd, "#D9C9B0", rep(Math.ceil(wd / 80), (i) => rep(3, (j) => rect(i * 80 + (j % 2) * 40, FLOOR + 14 + j * 54, 70, 40, "#CDBB9C", 8, 'opacity=".6"')))) }${pots}${sets}`;
  },
  /* a bakery's garden: picket fence, vegetable beds, a trellis with roses, a bench */
  garden: (wd, night, seed) => {
    const back = `${hillsOf(wd, "#CDEBC8", "#A8DDB0", seed)}${along(wd, 520, 80, (x, i) => tree(x, 0.8 + (i % 3) * 0.14, ["#8FD08A", "#6BCB77", "#F7B5CF"][i % 3]), seed)}${fence(0, wd, FLOOR, 80, "#FFFFFF")}`;
    const trellis = along(wd, 1000, 360, (x) => `${rect(x - 70, FLOOR - 190, 140, 190, "none", 4, `stroke="#fff" stroke-width="8"`)}${rep(5, (i) => ln(`M${x - 70 + i * 35} ${FLOOR - 190} V${FLOOR}`, "#fff", 4))}${rep(8, (i) => ci(x - 56 + (i % 4) * 36, FLOOR - 170 + Math.floor(i / 4) * 90 + (i % 3) * 14, 12, ["#FF6B9D", "#FF8A8A"][i % 2], ol2()))}`, seed);
    const beds = along(wd, 520, 90, (x, i) => `${rect(x - 100, FLOOR + 40, 200, 56, "#8A5A34", 10, ol())}${rep(4, (j) => `${ci(x - 66 + j * 44, FLOOR + 40, 20, ["#6BCB77", "#8FD08A", "#B8E87A", "#5A9E5F"][(i + j) % 4], ol())}${ci(x - 66 + j * 44, FLOOR + 40, 9, "#4FB05F")}`)}`, seed);
    const bench = along(wd, 1000, 700, (x) => `${rect(x - 70, FLOOR + 90, 140, 14, "#fff", 4, ol())}${rect(x - 70, FLOOR + 50, 140, 12, "#fff", 4, ol())}${rect(x - 60, FLOOR + 104, 10, 26, "#C98B55")}${rect(x + 50, FLOOR + 104, 10, 26, "#C98B55")}${rect(x + 90, FLOOR + 106, 30, 28, "#4FC3F7", 6, ol())}`, seed);
    return `${back}${trellis}${ground(wd, "#8FD08A", rep(Math.ceil(wd / 60), (i) => ln(`M${i * 60 + 10} ${FLOOR + 22} l6 -10 l6 10`, "#6BB86F", 3)))}${beds}${bench}`;
  },
  /* a lotus garden: bamboo, a stone lantern, a pond with an arched bridge, raked gravel */
  pond: (wd, night, seed) => {
    const bamboo = along(wd, 190, 40, (x, i) => `${rect(x, FLOOR - 250 - (i % 3) * 30, 14, 250 + (i % 3) * 30, "#7BC26B", 5, ol())}${rep(4, (j) => rect(x - 1, FLOOR - 70 - j * 64, 16, 7, "#5A9E5F"))}${pa(`M${x + 14} ${FLOOR - 230 - (i % 3) * 30} q60 -20 90 14 q-50 -6 -90 -2Z`, "#8FD08A", ol2())}`, seed);
    const ponds = along(wd, 1100, 560, (x, i) => `${el(x, FLOOR + 90, 320, 76, "#8A93A8", ol())}${el(x, FLOOR + 90, 300, 62, night ? "#2D5E9E" : "#6EC8E8")}${lotus(x - 130, FLOOR + 80)}${lotus(x - 20, FLOOR + 110, 1.2)}${lotus(x + 120, FLOOR + 76, 0.9)}${lotus(x + 200, FLOOR + 106)}${el(x - 60, FLOOR + 130, 18, 6, "#FF8A3C", 'opacity=".8"')}${pa(`M${x - 300} ${FLOOR + 40} Q${x} ${FLOOR - 60} ${x + 300} ${FLOOR + 40} V${FLOOR + 60} H${x + 270} Q${x} ${FLOOR - 20} ${x - 270} ${FLOOR + 60} H${x - 300}Z`, "#E5484D", ol())}`, seed);
    const rocks = along(wd, 420, 220, (x, i) => `${el(x, FLOOR + 140 + (i % 2) * 14, 40 + (i % 3) * 12, 18, "#9AA4BA", ol())}${el(x - 14, FLOOR + 132 + (i % 2) * 14, 18, 9, "#B8C0D0")}`, seed);
    return `${hillsOf(wd, "#CDEBC8", "#B0DDB2", seed)}${bamboo}${along(wd, 1100, 250, (x) => lantern(x, 1.1), seed)}${tree(120, 0.9, "#F28B82")}${ground(wd, "#EADFC8", rep(Math.ceil(wd / 40), (i) => `<path d="M${i * 40} ${FLOOR + 6} q10 20 0 40 q-10 20 0 40" stroke="#D9CBAA" stroke-width="3" fill="none"/>`))}${ponds}${rocks}`;
  },
  /* an old cottage garden: a stone gate with ivy, a tiered fountain, a waterfall in the hill */
  fountain: (wd, night, seed) => {
    const hill = `${hillsOf(wd, "#BFE3C0", "#98D3A0", seed)}${along(wd, 1300, 200, (x) => `${pa(`M${x - 40} ${FLOOR - 70} Q${x} ${FLOOR - 250} ${x + 40} ${FLOOR - 70}Z`, "#9AA4BA", ol())}${rect(x - 12, FLOOR - 200, 24, 190, night ? "#9CC9F0" : "#BFE9FF", 8, 'opacity=".85"')}${el(x, FLOOR - 4, 66, 12, "#BFE9FF", ol())}`, seed)}`;
    const gate = along(wd, 1300, 700, (x) => `${rect(x - 150, FLOOR - 200, 56, 200, "#B8B0A0", 4, ol())}${rect(x + 94, FLOOR - 200, 56, 200, "#B8B0A0", 4, ol())}${pa(`M${x - 94} ${FLOOR - 200} Q${x} ${FLOOR - 320} ${x + 94} ${FLOOR - 200} V${FLOOR - 170} Q${x} ${FLOOR - 290} ${x - 94} ${FLOOR - 170}Z`, "#C9C2B2", ol())}${rep(5, (i) => ci(x - 140 + (i % 2) * 18, FLOOR - 40 - i * 36, 14, "#4FB05F", ol2()))}${rep(5, (i) => ci(x + 130 - (i % 2) * 18, FLOOR - 60 - i * 36, 14, "#5A9E5F", ol2()))}${ln(`M${x - 94} ${FLOOR} V${FLOOR - 190} M${x - 50} ${FLOOR} V${FLOOR - 230} M${x} ${FLOOR} V${FLOOR - 250} M${x + 50} ${FLOOR} V${FLOOR - 230} M${x + 94} ${FLOOR} V${FLOOR - 190}`, "#3A3347", 6)}`, seed);
    const fountains = along(wd, 1300, 330, (x) => `${el(x, FLOOR + 90, 110, 26, "#B8B0A0", ol())}${el(x, FLOOR + 86, 94, 18, "#8ED8F8")}${rect(x - 10, FLOOR - 20, 20, 100, "#C9C2B2", 4, ol())}${el(x, FLOOR - 24, 52, 12, "#B8B0A0", ol())}${el(x, FLOOR - 28, 42, 7, "#8ED8F8")}${rep(5, (i) => ln(`M${x} ${FLOOR - 30} q${(i - 2) * 22} ${-50 + Math.abs(i - 2) * 14} ${(i - 2) * 38} ${40 - Math.abs(i - 2) * 6}`, "#BFE9FF", 4))}`, seed);
    return `${hill}${gate}${ground(wd, "#9FD48A", rep(Math.ceil(wd / 70), (i) => `<path d="M${i * 70} ${FLOOR + 20} q10 -10 20 0" stroke="#7CBB6A" stroke-width="3" fill="none"/>`))}${along(wd, 360, 80, (x, i) => flowers(x, FLOOR + 150, 4), seed)}${fountains}`;
  },
  /* a city park: an iron gate, a winding path, a pond with ducks, lamps and benches */
  parkgate: (wd, night, seed) => {
    const back = `${hillsOf(wd, "#BDE5BF", "#9FD5A6", seed)}${along(wd, 340, 90, (x, i) => tree(x, 0.8 + (i % 3) * 0.16, ["#6BCB77", "#8FD08A", "#5A9E5F"][i % 3]), seed)}`;
    const gates = along(wd, 1500, 450, (x) => `${rect(x - 170, FLOOR - 200, 36, 200, "#3A3347", 4)}${rect(x + 134, FLOOR - 200, 36, 200, "#3A3347", 4)}${pa(`M${x - 134} ${FLOOR - 190} Q${x} ${FLOOR - 310} ${x + 134} ${FLOOR - 190}`, "none", 'stroke="#3A3347" stroke-width="10"')}${rep(9, (i) => ln(`M${x - 124 + i * 31} ${FLOOR} V${FLOOR - 180 + Math.abs(i - 4) * 14}`, "#3A3347", 5))}${ci(x - 152, FLOOR - 214, 12, "#FFD93D", ol())}${ci(x + 152, FLOOR - 214, 12, "#FFD93D", ol())}${rect(x - 52, FLOOR - 120, 104, 34, "#fff", 8, ol())}`, seed);
    const ponds = along(wd, 1500, 1050, (x) => `${el(x, FLOOR + 100, 280, 62, "#B8B0A0", ol())}${el(x, FLOOR + 100, 262, 50, night ? "#2D5E9E" : "#7FD0F2")}${ci(x - 60, FLOOR + 96, 14, "#FFD93D", ol())}${ci(x - 40, FLOOR + 90, 8, "#FF8A3C")}${ci(x + 80, FLOOR + 110, 14, "#fff", ol())}${ci(x + 100, FLOOR + 104, 8, "#FF8A3C")}`, seed);
    const lamps = along(wd, 520, 250, (x) => lamp(x, 170), seed);
    const benches = along(wd, 760, 320, (x) => `${rect(x - 56, FLOOR + 126, 112, 12, "#C98B55", 4, ol())}${rect(x - 56, FLOOR + 96, 112, 10, "#C98B55", 4, ol())}${rect(x - 48, FLOOR + 138, 8, 22, "#5B6478")}${rect(x + 40, FLOOR + 138, 8, 22, "#5B6478")}`, seed);
    return `${back}${gates}${lamps}${ground(wd, "#9FD48A", `<path d="M0 ${FLOOR + 70} Q${wd * 0.25} ${FLOOR + 30} ${wd * 0.5} ${FLOOR + 90} T${wd} ${FLOOR + 60} V${FLOOR + 140} Q${wd * 0.75} ${FLOOR + 170} ${wd * 0.5} ${FLOOR + 150} T0 ${FLOOR + 160}Z" fill="#E8D9B5" opacity=".75"/>`)}${ponds}${benches}`;
  },
  /* an activity park: a great tree with a swing, a slide, flags, and a city hanging upside down in the sky */
  play: (wd, night, seed) => {
    const inverted = rep(Math.ceil(wd / 110), (i) => { const h = 70 + ((i * 47 + seed * 19) % 110); return `${rect(i * 110 + 8, 0, 94, h, shade("#B8A6E0", 0.92 + (i % 3) * 0.06), 4, ol())}${rep(2, (j) => rect(i * 110 + 24, h - 40 - j * 34, 20, 20, night ? "#FFE066" : "#E8F2FF", 2, 'opacity=".85"'))}`; });
    const trees = along(wd, 1400, 360, (x) => `${rect(x - 30, FLOOR - 250, 60, 250, "#9C6B3F", 12, ol())}${ci(x, FLOOR - 300, 120, "#6BCB77", ol())}${ci(x - 110, FLOOR - 240, 72, "#5A9E5F", ol())}${ci(x + 112, FLOOR - 246, 76, "#8FD08A", ol())}${ln(`M${x + 50} ${FLOOR - 250} q-6 60 0 120`, "#8A6A4A", 5)}${ln(`M${x + 90} ${FLOOR - 250} q6 60 0 120`, "#8A6A4A", 5)}${rect(x + 42, FLOOR - 132, 56, 12, "#FFB86B", 4, ol())}`, seed);
    const slides = along(wd, 1400, 920, (x) => `${rect(x - 70, FLOOR - 200, 12, 200, "#4D96FF")}${rect(x - 70, FLOOR - 210, 90, 12, "#4D96FF", 3, ol())}${pa(`M${x + 20} ${FLOOR - 204} Q${x + 130} ${FLOOR - 120} ${x + 190} ${FLOOR}`, "none", 'stroke="#FFD93D" stroke-width="22" stroke-linecap="round"')}${ln(`M${x - 64} ${FLOOR} L${x - 20} ${FLOOR - 200}`, "#4D96FF", 7)}`, seed);
    const flags = `${ln(`M0 70 Q${wd / 2} 150 ${wd} 70`, "#3A3347", 2)}${rep(Math.ceil(wd / 60), (i) => { const t = i / Math.ceil(wd / 60); return pa(`M${i * 60} ${70 + 160 * t * (1 - t) * 2} l24 0 l-12 26Z`, ["#FF6B6B", "#FFD93D", "#4D96FF", "#6BCB77"][i % 4], ol2()); })}`;
    return `${inverted}${flags}${hillsOf(wd, "#C8E8C0", "#A8DDB0", seed)}${trees}${slides}${ground(wd, "#B8E08A", rep(Math.ceil(wd / 80), (i) => `<circle cx="${i * 80 + 20}" cy="${FLOOR + 40 + (i * 47) % 120}" r="4" fill="#9CCB6A"/>`))}${along(wd, 700, 200, (x, i) => `${el(x, FLOOR + 120, 90, 20, "#F5DEB3", ol())}${ci(x - 30, FLOOR + 106, 8, "#FF6B6B")}${ci(x + 24, FLOOR + 110, 8, "#4D96FF")}`, seed)}`;
  },
  /* a supermarket yard: a loading dock with a truck, pallets, crates, a gate with a barrier, bollards */
  yard: (wd, night, seed) => {
    const wall = `${rect(0, 150, wd, FLOOR - 150, "#E4E8F0")}${rep(Math.ceil(wd / 90), (i) => `<path d="M${i * 90} 150 V${FLOOR}" stroke="#D3D9E6" stroke-width="3"/>`)}${rect(0, 140, wd, 18, "#4D96FF", 3, ol())}`;
    const docks = along(wd, 700, 160, (x, i) => `${rect(x - 70, FLOOR - 200, 140, 200, "#9AA4BA", 6, ol())}${rep(6, (j) => `<path d="M${x - 70} ${FLOOR - 200 + j * 33} H${x + 70}" stroke="#7A849E" stroke-width="3"/>`)}${rect(x - 70, FLOOR - 40, 140, 40, "#3A3347", 0)}`, seed);
    const trucks = along(wd, 1500, 800, (x) => `${rect(x - 220, FLOOR - 40, 300, 130, "#fff", 10, ol())}${rect(x - 220, FLOOR + 10, 300, 24, "#4D96FF")}${pa(`M${x + 90} ${FLOOR + 90} V${FLOOR - 10} H${x + 170} L${x + 220} ${FLOOR + 40} V${FLOOR + 90}Z`, "#4D96FF", ol())}${pa(`M${x + 110} ${FLOOR + 6} H${x + 160} L${x + 196} ${FLOOR + 40} H${x + 110}Z`, "#C7E6FF", ol2())}${ci(x - 150, FLOOR + 96, 28, "#3A3347", ol())}${ci(x - 150, FLOOR + 96, 11, "#B8C0D0")}${ci(x + 20, FLOOR + 96, 28, "#3A3347", ol())}${ci(x + 20, FLOOR + 96, 11, "#B8C0D0")}${ci(x + 150, FLOOR + 96, 28, "#3A3347", ol())}${ci(x + 150, FLOOR + 96, 11, "#B8C0D0")}${rect(x - 180, FLOOR - 20, 90, 20, "#FFB86B", 4, ol2())}`, seed);
    const crates = along(wd, 420, 300, (x, i) => `${rect(x - 36, FLOOR + 130, 72, 50, "#C98B55", 4, ol())}${rect(x - 36, FLOOR + 82, 72, 48, "#D9A06A", 4, ol())}${ln(`M${x - 36} ${FLOOR + 105} H${x + 36} M${x - 36} ${FLOOR + 154} H${x + 36}`, "#A9764C", 4)}`, seed);
    const bollards = rep(Math.ceil(wd / 150), (i) => `${rect(i * 150 + 40, FLOOR + 170, 18, 40, i % 2 ? "#FFD93D" : "#fff", 8, ol())}`);
    const gate = along(wd, 1500, 1200, (x) => `${rect(x - 8, FLOOR - 70, 16, 80, "#5B6478", 4, ol())}${rect(x + 8, FLOOR - 58, 190, 14, "#fff", 3, ol())}${rep(5, (i) => rect(x + 24 + i * 36, FLOOR - 58, 18, 14, "#E5484D"))}`, seed);
    return `${wall}${docks}${ground(wd, "#B8BCCB", rep(Math.ceil(wd / 120), (i) => rect(i * 120 + 30, FLOOR + 190, 60, 8, "#fff", 3)))}${trucks}${gate}${crates}${bollards}`;
  },
  /* a rooftop: the skyline, chimneys and vents, planters, string lights, a water tank */
  rooftop: (wd, night, seed) => {
    const stuff = along(wd, 520, 140, (x, i) => (i % 3 === 0 ? `${rect(x - 36, FLOOR - 110, 72, 110, "#A9764C", 6, ol())}${pa(`M${x - 46} ${FLOOR - 110} L${x} ${FLOOR - 160} L${x + 46} ${FLOOR - 110}Z`, "#7A849E", ol())}${rep(3, (j) => rect(x - 36, FLOOR - 90 + j * 30, 72, 4, "#8A5A34"))}` : i % 3 === 1 ? `${rect(x - 26, FLOOR - 120, 52, 120, "#C2502A", 4, ol())}${rep(4, (j) => rect(x - 26, FLOOR - 112 + j * 28, 52, 6, "#A03F1F"))}${rect(x - 32, FLOOR - 130, 64, 14, "#8A93A8", 3, ol())}<g class="fx-steam" opacity=".7">${ln(`M${x} ${FLOOR - 140} q14 -30 0 -54 q-14 -26 0 -50`, "#fff", 8)}</g>` : `${rect(x - 44, FLOOR - 90, 88, 90, "#B8C0D0", 5, ol())}${rep(3, (j) => ln(`M${x - 34} ${FLOOR - 74 + j * 22} H${x + 34}`, "#8A93A8", 5))}`), seed);
    const planters = along(wd, 520, 330, (x, i) => `${rect(x - 70, FLOOR + 20, 140, 46, "#C98B55", 6, ol())}${rep(4, (j) => `${ln(`M${x - 50 + j * 34} ${FLOOR + 20} v-40`, "#4FB05F", 4)}${ci(x - 50 + j * 34, FLOOR - 28 + (j % 2) * 10, 11, ["#E5484D", "#FF8A3C", "#E5484D", "#FFD93D"][j], ol2())}`)}`, seed);
    const rail = `${rect(0, FLOOR - 22, wd, 10, "#E9EEF6", 4, ol())}${rep(Math.ceil(wd / 40), (i) => rect(i * 40 + 14, FLOOR - 12, 8, 54, "#E9EEF6", 3, ol()))}`;
    const tanks = along(wd, 1800, 900, (x) => `${rect(x - 70, FLOOR - 220, 140, 150, "#9AA4BA", 14, ol())}${rep(3, (j) => rect(x - 70, FLOOR - 200 + j * 44, 140, 6, "#7A849E"))}${ln(`M${x - 50} ${FLOOR - 70} L${x - 62} ${FLOOR} M${x + 50} ${FLOOR - 70} L${x + 62} ${FLOOR}`, "#5B6478", 8)}`, seed);
    return `${skyline(wd, "#9AA4BA", night, seed, 120)}${tanks}${stuff}${rail}${ground(wd, "#B8BCCB", rep(Math.ceil(wd / 100), (i) => `<path d="M${i * 100} ${FLOOR} V${H}" stroke="#A6AABB" stroke-width="3"/>`))}${stringLights(30, wd - 30, FLOOR - 180, night)}${planters}${along(wd, 900, 520, (x, i) => lounger(x, FLOOR + 140, ["#FFB86B", "#7DD3C0"][i % 2]), seed)}`;
  },
  /* a campsite: pines, a campfire, a tent, the van, and a saucer with its beam */
  camp: (wd, night, seed) => {
    const ufo = along(wd, 2400, 700, (x) => `<g transform="translate(${x} 110)">${night ? pa("M-50 20 L-120 330 H120 L50 20Z", "#B8FFB0", 'opacity=".25"') : ""}${el(0, 0, 70, 20, "#B8C0D0", ol())}${pa("M-30 -4 Q0 -50 30 -4Z", "#7DD3F8", ol())}${[-44, -14, 16, 46].map((q) => ci(q, 6, 5, "#FFD93D")).join("")}</g>`, seed);
    const pines = along(wd, 230, 60, (x, i) => pine(x, 1.1 + (i % 3) * 0.3), seed);
    const fires = along(wd, 1100, 620, (x) => `${pa(`M${x - 40} ${FLOOR + 110} L${x + 40} ${FLOOR + 128} M${x + 40} ${FLOOR + 110} L${x - 40} ${FLOOR + 128}`, "none", 'stroke="#8A5A34" stroke-width="12" stroke-linecap="round"')}${pa(`M${x} ${FLOOR + 112} Q${x - 30} ${FLOOR + 80} ${x - 10} ${FLOOR + 50} Q${x} ${FLOOR + 74} ${x + 12} ${FLOOR + 56} Q${x + 34} ${FLOOR + 84} ${x} ${FLOOR + 112}Z`, "#FF8A3C", `class="fx-flame" ${ol()}`)}${pa(`M${x} ${FLOOR + 112} Q${x - 12} ${FLOOR + 92} ${x} ${FLOOR + 78} Q${x + 14} ${FLOOR + 94} ${x} ${FLOOR + 112}Z`, "#FFD93D")}${rep(6, (i) => ci(x - 70 + i * 28, FLOOR + 140 + (i % 2) * 6, 11, "#9AA4BA", ol2()))}`, seed);
    const tents = along(wd, 1100, 260, (x) => `${pa(`M${x - 110} ${FLOOR + 90} L${x} ${FLOOR - 40} L${x + 110} ${FLOOR + 90}Z`, "#FF8A3C", ol())}${pa(`M${x - 28} ${FLOOR + 90} L${x} ${FLOOR + 30} L${x + 28} ${FLOOR + 90}Z`, "#8A3F1A")}${ln(`M${x} ${FLOOR - 40} V${FLOOR - 70}`, "#3A3347", 4)}${pa(`M${x} ${FLOOR - 70} l30 8 l-30 8Z`, "#E5484D")}`, seed);
    return `${ufo}${hillsOf(wd, "#7FB77E", "#5F9E67", seed)}${pines}${ground(wd, "#B89B6A", rep(Math.ceil(wd / 90), (i) => ci(i * 90 + 20, FLOOR + 30 + (i * 53) % 150, 5, "#A58655")))}${tents}${fires}`;
  },
  /* a porch: wooden boards, posts and a railing, a rocking chair, a mailbox, a tree */
  porch: (wd, night, seed) => {
    const back = `${hillsOf(wd, "#BFE3C0", "#98D3A0", seed)}${along(wd, 460, 100, (x, i) => (i % 2 ? pine(x, 1.2) : tree(x, 0.9 + (i % 3) * 0.1, ["#6BCB77", "#8FD08A"][i % 2])), seed)}`;
    const porch = `${rect(0, FLOOR - 160, wd, 12, "#fff", 3, ol())}${rep(Math.ceil(wd / 230), (i) => rect(i * 230 + 60, FLOOR - 150, 18, 150, "#fff", 4, ol()))}${rep(Math.ceil(wd / 46), (i) => rect(i * 46 + 18, FLOOR - 90, 8, 80, "#fff", 3, ol()))}${rect(0, FLOOR - 98, wd, 10, "#fff", 3, ol())}`;
    const rockers = along(wd, 640, 240, (x, i) => `${pa(`M${x - 40} ${FLOOR + 80} Q${x} ${FLOOR + 92} ${x + 40} ${FLOOR + 80}`, "none", 'stroke="#8A5A34" stroke-width="7" stroke-linecap="round"')}${rect(x - 30, FLOOR + 40, 60, 12, "#C98B55", 4, ol())}${rect(x - 30, FLOOR - 30, 12, 72, "#C98B55", 4, ol())}${rep(3, (j) => rect(x - 30, FLOOR - 24 + j * 20, 54, 6, "#C98B55", 3))}${rect(x - 26, FLOOR + 34, 52, 12, ["#FF8A8A", "#7DD3C0"][i % 2], 4, ol2())}`, seed);
    const mail = along(wd, 1300, 900, (x) => `${rect(x - 5, FLOOR + 60, 10, 90, "#8A6A4A")}${rect(x - 30, FLOOR + 30, 60, 36, "#E5484D", 12, ol())}${rect(x + 24, FLOOR + 24, 4, 20, "#FFD93D")}`, seed);
    return `${back}${porch}${ground(wd, "#C98B55", planks(wd, "#C98B55"))}${rockers}${along(wd, 700, 150, (x) => flowers(x, FLOOR + 150, 5), seed)}${mail}`;
  },
  /* a mansion or manor: clipped hedges, topiary, a gravel drive, columns, lamps */
  manor: (wd, night, seed) => {
    const hedge = `${rect(0, FLOOR - 140, wd, 140, "#3F7F4A")}${rep(Math.ceil(wd / 40), (i) => ci(i * 40 + 20, FLOOR - 140, 22, "#3F7F4A"))}${rep(Math.ceil(wd / 60), (i) => `<path d="M${i * 60 + 30} ${FLOOR - 120} q10 10 0 30" stroke="#2F6A3A" stroke-width="3" fill="none"/>`)}`;
    const topiary = along(wd, 380, 180, (x, i) => `${rect(x - 8, FLOOR - 40, 16, 40, "#8A5A34")}${i % 2 ? ci(x, FLOOR - 84, 38, "#4FB05F", ol()) + ci(x, FLOOR - 140, 26, "#5ABF68", ol()) : pa(`M${x - 36} ${FLOOR - 40} L${x} ${FLOOR - 190} L${x + 36} ${FLOOR - 40}Z`, "#4FB05F", ol())}`, seed);
    const columns = along(wd, 1100, 140, (x) => `${rect(x - 70, FLOOR - 230, 28, 230, "#F4EEE4", 4, ol())}${rect(x + 42, FLOOR - 230, 28, 230, "#F4EEE4", 4, ol())}${rect(x - 84, FLOOR - 250, 168, 24, "#F4EEE4", 4, ol())}${pa(`M${x - 84} ${FLOOR - 250} L${x} ${FLOOR - 310} L${x + 84} ${FLOOR - 250}Z`, "#E6DCC8", ol())}`, seed);
    return `${skyline(wd, "#B8C6DA", night, seed, 230)}${hedge}${columns}${topiary}${along(wd, 700, 420, (x) => lamp(x, 190), seed)}${ground(wd, "#D8CFC0", rep(Math.ceil(wd / 24), (i) => ci(i * 24 + ((i * 17) % 20), FLOOR + 14 + ((i * 41) % 170), 2.5, "#C2B8A6")))}${along(wd, 560, 260, (x, i) => `${el(x, FLOOR + 150, 120, 22, "#6BCB77", ol())}${flowers(x - 80, FLOOR + 150, 7, ["#fff", "#F7B5CF", "#FFD93D"])}`, seed)}`;
  },
  /* a city balcony: a railing in front, the town behind with its windows, neon signs, plants, string lights */
  city: (wd, night, seed) => {
    const sign = along(wd, 700, 200, (x, i) => (i % 2 ? `${rect(x - 70, 150, 140, 54, "#1B1530", 12, ol())}<text x="${x}" y="188" text-anchor="middle" font-size="30" font-weight="900" fill="${["#FF6BD6", "#6BF0FF", "#B8FF6B"][i % 3]}" class="${night ? "pl-glow" : ""}">${["OPEN", "CAFÉ", "★ ★ ★"][i % 3]}</text>` : `${rect(x - 8, 120, 16, 90, "#B8C0D0")}${ci(x, 112, 32, ["#FFD93D", "#FF6BD6", "#6BF0FF"][i % 3], ol())}`), seed);
    const rail = `${rect(0, FLOOR - 130, wd, 12, "#E9EEF6", 4, ol())}${rep(Math.ceil(wd / 46), (i) => rect(i * 46 + 18, FLOOR - 118, 10, 118, "#E9EEF6", 3, ol()))}`;
    const plants = along(wd, 520, 90, (x, i) => `${rect(x - 34, FLOOR - 70, 68, 70, "#C2502A", 8, ol())}${bush(x, FLOOR - 64, 0.8, ["#4FB05F", "#6BCB77"][i % 2])}`, seed);
    return `${skyline(wd, "#9AA4BA", night, seed, 130)}${sign}${rail}${stringLights(10, wd - 10, FLOOR - 200, night)}${rect(0, FLOOR, wd, H - FLOOR, "#C98B55")}${planks(wd, "#C98B55")}${plants}${along(wd, 900, 400, (x, i) => table(x, FLOOR + 130, ["#fff", "#FFF3B0"][i % 2]), seed)}`;
  },
};
/* which theme a building's outdoor stretches wear (by its id), and the theme of those without: the garden or the balcony */
export const THEME_OF = {
  "hd-poolvilla": "pool", "hd-bedstevenner": "pool", "hd-boblespa": "spa", "hd-velvaere": "spa", "hd-strandhus": "beach", "hd-solnedgang": "beach", "hd-kystvilla": "beach", "hd-stjernehus": "pool",
  "hd-restaurant": "terrace", "hd-bryllup": "terrace", "hd-bageri": "garden", "hd-japandi": "pond", "hd-aertehus": "fountain", "hd-foraar": "fountain", "hd-byparken": "parkgate", "hd-aktivpark": "play",
  "hd-supermarked": "yard", "hd-vaerksted": "yard", "hd-taghave": "rooftop", "hd-rengoering": "rooftop", "hd-autocamper": "camp", "hd-skovhytte": "porch", "hd-julestue": "porch", "hd-bohem": "porch", "hd-lokalbutik": "porch",
  "hd-lokalbutik-ahorn": "porch", "hd-glans": "porch", "hd-herregaard": "manor", "hd-palae": "manor", "hd-gammeldags": "manor", "hd-uhyggehus": "manor", "hd-lejlighed": "city", "hd-hotel": "pool",
  "hd-loft": "city", "hd-neonregnbue": "city", "hd-streamer": "city", "hd-tusindaar": "city", "hd-solskin": "city", "hd-lokalbutik-gade": "city", "hd-modebutik2": "city", "hd-loppemarked": "terrace", "hd-boernehave": "play",
  "hd-katoghund": "garden", "hd-krammebjoern": "garden", "hd-startkassen-stort": "garden", "hd-velkomst": "garden", "hd-storfamilie": "garden",
};
