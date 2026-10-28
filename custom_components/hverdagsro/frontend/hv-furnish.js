/* Hverdagsro – more in every room of the house: bookcases and open shelves with things on them, shelves on the wall,
   pictures, a clock, a plant, a basket. What the family has put in a room in Husbyggeren stays where it is; this is
   added around it, where there is room (hv-world). All from the free everyday things of hv-packs4. */
import { META4 } from "./hv-packs4.js";
import { PROTO } from "./hv-proto.js";
import { insideOf } from "./hv-fixtures.js";

/* A bookcase or a shelf with things on it: [key, x, y] for the shelf and for every thing on its levels.
   stock: [[level, [keys…]], …] (level 0 is the bottom shelf; the last one the top). */
function hosted(key, x, y, stock) {
  const M = META4[key], S = PROTO[M.shape][4], width = M.w * S[0], out = [[key, x, y]];
  for (const [level, keys] of stock) {
    const f = S[1 + level];
    if (f == null) continue;
    keys.forEach((k, i) => out.push([k, x - width / 2 + (width * (i + 0.5)) / keys.length, y - M.h * f]));
  }
  return out;
}
const wall = (key, x, y) => [key, x, y];
/* Something that opens, with things inside it: out of sight until the door is opened (stock as for hosted, but the
   levels are the shelves inside). */
function stocked(key, x, y, stock) {
  const M = META4[key], I = insideOf(key), out = [[key, x, y]];
  if (!I) return out;
  const width = M.w * I.w;
  for (const [level, keys] of stock) {
    const f = I.levels[level];
    if (f == null) continue;
    keys.forEach((k, i) => out.push([k, x - width / 2 + (width * (i + 0.5)) / keys.length, y - M.h * f, { in: out.length }]));
  }
  return out;
}

/* What each kind of room gets, drawn for a room 1000 wide (a wider room gets it again, a little changed). */
const EXTRAS = {
  living: () => [
    hosted("hd-hjem-reol2", 890, 520, [[4, ["hd-hjem-vase2"]], [3, ["hd-hjem-bamse", "hd-hjem-bog", "hd-hjem-lys"]], [2, ["hd-hjem-kasse", "hd-hjem-plante"]], [1, ["hd-hjem-radio", "hd-hjem-kop", "hd-hjem-krukke"]]]),
    hosted("hd-hjem-bogreol", 100, 520, [[1, ["hd-hjem-plante", "hd-hjem-vase"]]]),
    hosted("hd-hjem-vaeghylde", 440, 292, [[0, ["hd-hjem-lys", "hd-hjem-boger", "hd-hjem-plante"]]]),
    wall("hd-hjem-ramme", 190, 262), wall("hd-hjem-ur", 520, 190),
    ["hd-hjem-kurv", 700, 612], ["hd-hjem-bigplante", 960, 612],
  ],
  kitchen: () => [
    stocked("hd-hjem-koleskab", 90, 520, [[0, ["hd-hjem-flaske", "hd-hjem-krukke"]], [1, ["hd-hjem-skaal"]], [2, ["hd-hjem-flaske"]]]),
    stocked("hd-hjem-skab", 960, 520, [[0, ["hd-hjem-tallerken", "hd-hjem-kop"]], [1, ["hd-hjem-gryde"]], [2, ["hd-hjem-skaal", "hd-hjem-krukke"]]]),
    wall("hd-hjem-emhaette", 520, 340),
    hosted("hd-hjem-vaeghylde2", 150, 272, [[0, ["hd-hjem-kop", "hd-hjem-skaal", "hd-hjem-krukke"]]]),
    hosted("hd-hjem-vaeghylde", 450, 272, [[0, ["hd-hjem-tallerken", "hd-hjem-flaske", "hd-hjem-gryde"]]]),
    wall("hd-hjem-ur", 600, 200), ["hd-hjem-kurv", 960, 612], ["hd-hjem-traekasse", 60, 612],
  ],
  bath: () => [
    hosted("hd-hjem-vaeghylde2", 150, 262, [[0, ["hd-hjem-flaske", "hd-hjem-krukke", "hd-hjem-lys"]]]),
    wall("hd-hjem-spejl", 540, 300), ["hd-hjem-kurv", 60, 612], ["hd-hjem-skraldespand", 500, 612], ["hd-hjem-plante", 950, 612],
    hosted("hd-hjem-skab", 700, 520, [[1, ["hd-hjem-flaske", "hd-hjem-plante"]]]),
  ],
  bed: () => [
    stocked("hd-hjem-klaedeskab", 960, 520, [[0, ["hd-hjem-kasse"]], [1, ["hd-hjem-pude", "hd-hjem-bamse"]]]),
    stocked("hd-hjem-kiste", 400, 612, [[0, ["hd-hjem-bamse", "hd-hjem-pokal"]]]),
    hosted("hd-hjem-kommode", 120, 530, [[1, ["hd-hjem-lys", "hd-hjem-ramme2", "hd-hjem-pokal"]]]),
    hosted("hd-hjem-reol", 640, 520, [[4, ["hd-hjem-vase"]], [3, ["hd-hjem-boger", "hd-hjem-bamse"]], [2, ["hd-hjem-kasse", "hd-hjem-plante"]], [1, ["hd-hjem-bog", "hd-hjem-radio"]]]),
    wall("hd-hjem-ramme", 270, 270), wall("hd-hjem-landskab", 880, 280), ["hd-hjem-taeppe", 500, 616], ["hd-hjem-kurv", 940, 612],
  ],
  office: () => [
    hosted("hd-hjem-bogreol", 110, 520, [[1, ["hd-hjem-pokal", "hd-hjem-plante"]]]),
    hosted("hd-hjem-bogreol2", 330, 520, [[1, ["hd-hjem-vase"]]]),
    hosted("hd-hjem-vaeghylde", 620, 270, [[0, ["hd-hjem-boger", "hd-hjem-bamse", "hd-hjem-kop"]]]),
    wall("hd-hjem-ur", 700, 200), ["hd-hjem-traekasse", 620, 612], ["hd-hjem-skraldespand", 960, 612],
  ],
  hall: () => [
    hosted("hd-hjem-vaeghylde", 160, 270, [[0, ["hd-hjem-lys", "hd-hjem-kop", "hd-hjem-plante"]]]),
    hosted("hd-hjem-kommode", 880, 530, [[1, ["hd-hjem-vase2", "hd-hjem-bog", "hd-hjem-ramme2"]]]),
    wall("hd-hjem-spejl", 480, 310), ["hd-hjem-kurv", 150, 612], ["hd-hjem-skammel", 640, 600],
  ],
  utility: () => [
    hosted("hd-hjem-reol2", 120, 520, [[3, ["hd-hjem-kasse", "hd-hjem-kurv"]], [2, ["hd-hjem-flaske", "hd-hjem-krukke"]], [1, ["hd-hjem-kasse", "hd-hjem-traekasse"]]]),
    ["hd-hjem-kurv", 900, 612], ["hd-hjem-skraldespand", 620, 612], wall("hd-hjem-ur", 640, 200),
  ],
  garage: () => [
    hosted("hd-hjem-reol", 110, 520, [[4, ["hd-hjem-kasse"]], [3, ["hd-hjem-traekasse", "hd-hjem-flaske"]], [2, ["hd-hjem-gryde", "hd-hjem-kasse"]], [1, ["hd-hjem-traekasse", "hd-hjem-krukke"]]]),
    ["hd-hjem-traekasse", 500, 610], ["hd-hjem-kasse", 580, 610], wall("hd-hjem-ur", 400, 190),
  ],
  kid: () => [
    hosted("hd-hjem-reol2", 900, 520, [[4, ["hd-hjem-pokal"]], [3, ["hd-hjem-bamse", "hd-hjem-bog"]], [2, ["hd-hjem-bamse", "hd-hjem-kasse"]], [1, ["hd-hjem-kurv", "hd-hjem-boger"]]]),
    hosted("hd-hjem-kubereol", 470, 520, [[1, ["hd-hjem-bamse"]]]),
    wall("hd-hjem-ramme2", 200, 262), wall("hd-hjem-vaeghylde2", 500, 300), ["hd-hjem-taeppe2", 520, 616], ["hd-hjem-kurv", 80, 612],
  ],
  other: () => [
    hosted("hd-hjem-reol", 880, 520, [[4, ["hd-hjem-vase"]], [3, ["hd-hjem-boger", "hd-hjem-plante"]], [2, ["hd-hjem-kasse", "hd-hjem-bog"]], [1, ["hd-hjem-kop", "hd-hjem-skaal"]]]),
    wall("hd-hjem-ramme", 300, 262), wall("hd-hjem-ur", 560, 190), ["hd-hjem-bigplante", 80, 612], ["hd-hjem-kurv", 560, 612],
  ],
};
/* The wall space the window takes (in a room 1000 wide) and a rough width for what is already there. */
const WINDOW = [560, 870], NEAR = 110;
const band = (y) => (y < 440 ? "wall" : "floor");
/* More for a room: `base` is what the room already has ([key, x, y] ...). Returns base plus what fits around it.
   A shelf and the things on it go in together or not at all. */
export function furnish(look, base, wd = 1000) {
  const make = EXTRAS[look] || EXTRAS.other, out = [...base];
  const blocks = Math.max(1, Math.round(wd / 1000));
  for (let i = 0; i < blocks; i++) {
    for (const item of make()) {
      const group = (typeof item[0] === "string" ? [item] : item).map(([k, x, y]) => [k, Math.round(x + i * 1000), Math.round(y)]);
      const host = group[0];
      if (host[1] > wd - 40) continue;
      if (i === 0 && host[2] < 440 && host[1] > WINDOW[0] && host[1] < WINDOW[1]) continue;
      const crowded = out.some(([, ox, oy]) => band(oy) === band(host[2]) && Math.abs(ox - host[1]) < NEAR && Math.abs(oy - host[2]) < 70);
      if (!crowded) out.push(...group);
    }
  }
  return out;
}
