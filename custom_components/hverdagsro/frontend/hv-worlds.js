/* Hverdagsro – the worlds of the play world: 34 towns, with 104 places in them (a hospital, a bakery, a school, a farm,
   a mall, a ski lodge …), laid out like the original's: the same furniture, in the same order, as wide, with the
   shelves where the original has them. The furniture is drawn with our own shapes (hv-proto) at the sizes of the
   original (hv-worlds-data, made by tools/homedesigner), then dressed with little things (hv-layout). */
import { BG, addWorld } from "./hv-world.js";
import { shade } from "./hv-playcat.js";
import { WORLDS, PLACES } from "./hv-worlds-data.js";
import { HOME4, META4, placeThing } from "./hv-packs4.js";
import { ROLE, dress } from "./hv-layout.js";
import { roomBg, STYLES } from "./hv-roombg.js";

void BG;
const hash = (s) => [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
const rnd = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
/* What a place is, by its name, for its sign on the map and in the room list. */
const SIGNS = [
  [/hospital|ward|treatment|entrance|basement/i, "🏥"], [/dentist/i, "🦷"], [/vet|adoption|pet/i, "🐾"], [/school|class|campus|lecture|dorm|youth|mess/i, "🏫"],
  [/bakery|bun/i, "🥐"], [/restaurant|food|kitchen|dining|cafe|café/i, "🍽️"], [/salon|hair/i, "💇"], [/tailor|fashion|pom/i, "👗"], [/store|shop|mall|market|emporium|electronics/i, "🛍️"],
  [/theatre|stage|festival|studio|movie/i, "🎭"], [/bank|court|office|workplace/i, "🏢"], [/apartment|loft|block|home|house|bungalow|cabin|hotel|lodge/i, "🏠"],
  [/park|playground|field|forest|garden|arena|wildlife/i, "🌳"], [/beach|bay|lagoon|pool|aquarium|boat|piste|onsen|ice|rink/i, "🌊"], [/station|platform|airport/i, "🚉"], [/arcade/i, "🕹️"],
];
const signFor = (name, fallback) => SIGNS.find(([rx]) => rx.test(name))?.[1] || fallback;

const places = {};
export const WORLD_TOWNS = [];
for (const w of WORLDS) {
  const palette = [w.col, shade(w.col, 0.8), "#FFD93D", "#FFFFFF", "#6BCB77", "#4D96FF", "#F15BB5", "#FF8A3C"];
  const members = [];
  for (const id of w.places) {
    const loc = PLACES[id];
    if (!loc) continue;
    const key = `w-${id}`, R = rnd(hash(key)), decor = [], placed = [];
    loc.things.forEach(([shape, x, y, uw, uh, wall], i) => {
      const n = (hash(key + i) >>> 3) % 4, k = palette[(hash(key + shape + i) >>> 5) % palette.length], a = palette[(hash(key + i) >>> 7) % palette.length];
      const thing = placeThing(`lw-${shape}-${Math.round(uw / 25)}-${Math.round(uh / 25)}-${n}-${palette.indexOf(k)}`, shape, uw, uh, k, a, n);
      placed.push({ k: thing, ...META4[thing], role: ROLE[shape] || "extra", x, y, idx: decor.length, noFill: !!wall && shape !== "wallshelf" });
      decor.push([thing, x, y]);
    });
    // little things on the shelves and tables, from the everyday things of the house
    const small = Object.keys(HOME4).map((k) => ({ k, ...META4[k], role: ROLE[META4[k].shape] || "extra" }));
    dress(placed, small, decor, R);
    const pk = { wall: w.wall, floor: w.floor, cols: [w.col, shade(w.col, 0.8)], fx: loc.fx };
    places[key] = {
      n: loc.n, area: `w-${w.id}`, em: signFor(loc.en, w.em), inside: true, width: loc.w,
      bg: (s0, s1, tod, wd) => roomBg(pk, STYLES[hash(key) % STYLES.length], s0, s1, tod, wd),
      decor, npcs: [],
    };
    members.push({ id: key, n: loc.n, en: loc.en, em: places[key].em, cols: [w.col, shade(w.col, 0.8)], town: `w-${w.id}` });
  }
  if (members.length) WORLD_TOWNS.push({ id: `w-${w.id}`, n: w.n, en: w.en, em: w.em, lvl: w.lvl, col: w.col, places: members });
}
addWorld({ places, areas: WORLD_TOWNS.map((t) => ({ id: t.id, n: t.n, em: t.em, lvl: t.lvl, x: 0, y: 0, col: t.col, map: "byer" })) });

/* English names, looked up by the Danish text. */
export const WORLDS_EN = {};
for (const w of WORLDS) {
  WORLDS_EN[w.n] = w.en;
  for (const id of w.places) if (PLACES[id]) WORLDS_EN[PLACES[id].n] = PLACES[id].en;
}
