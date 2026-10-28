/* Hverdagsro – the theme packs (part 4): forty-seven packs of furniture and things for the rooms of the play world,
   one for every kind of home, shop and hangout, each with its own colours. The names, shapes and colours are in
   hv-packs4-data.js (made by tools/homedesigner/build_packs.py); the shapes themselves are drawn in hv-proto.js. All our own
   drawings; no characters or brands from films, shows or games. Same shape as hv-playcat's THINGS:
   key: [name, category, colour, width, height, draw(c), price, flat]. */
import { PROTO } from "./hv-proto.js";
import { PACKDATA } from "./hv-packs4-data.js";
import { addSurfaces, addScreen, registerFx, LOOKS } from "./hv-fixtures.js";

/* What a thing costs, from its kind and the level of its pack. */
const BASE = { mob: 30, lys: 25, væg: 20, pynt: 12, leg: 15 };
const price = (cat, lvl) => Math.max(5, Math.round(((BASE[cat] || 15) * (0.8 + lvl * 0.1)) / 5) * 5);

export const THINGS4 = {};
export const PACKS4 = [];
export const PACKS4_EN = {};
/* Which shape each thing is drawn with (hv-towns lays the rooms out from it). */
export const META4 = {};
const SURF4 = {};

/* What can be done with a thing, by its shape: things that open (and have shelves inside), a stove to light, a hood,
   taps, a bath, a screen with channels. The shelves are parts of the height, from the floor up. */
const DOORS = { fridge: [0.1, 0.34, 0.58, 0.82], cabinet: [0.12, 0.45, 0.78], wardrobe: [0.1, 0.5] };
const SCREEN = { tv: [-82, -122, 164, 88], screen: [-52, -96, 104, 60], laptop: [-33, -55, 66, 34] };
function works(key, shape, w, h, s, k, flags = {}) {
  const R = (fx, on, inside) => registerFx(key, shape, { fx, on, inside });
  // What the original says: this thing has doors or drawers and a room inside (levels as parts of its height).
  const opens = flags.o && flags.o.length && w >= 60 && h >= 50 ? flags.o : null;
  if (opens && !["dresser", "chest"].includes(shape)) R({ toggle: true, sound: "chest" }, (it) => LOOKS.door(w, h, opens, it.c || k), { w: 0.78, levels: opens });
  else if (DOORS[shape]) R({ toggle: true, sound: "chest" }, (it) => LOOKS.door(w, h, DOORS[shape], it.c || k), { w: 0.78, levels: DOORS[shape] });
  else if (shape === "dresser") R({ toggle: true, sound: "chest" }, (it) => LOOKS.drawer(w, h, it.c || k), { w: 0.74, levels: opens || [0.55, 0.2] });
  else if (shape === "chest") R({ toggle: true, sound: "chest" }, (it) => LOOKS.lid(w, h, it.c || k), { w: 0.78, levels: [0.3] });
  else if (shape === "oven") R({ toggle: true, sound: "fire" }, () => LOOKS.burn(w, h));
  else if (shape === "hood") R({ toggle: true, sound: "hum" }, () => LOOKS.hood(w, h));
  else if (shape === "washer") R({ toggle: true, sound: "hum" }, () => LOOKS.spin(w, h));
  else if (shape === "bathtub") R({ toggle: true, sound: "water" }, () => LOOKS.water(w, h));
  else if (shape === "shower") R({ toggle: true, sound: "shower" }, () => LOOKS.rain(w, h));
  else if (shape === "sink") R({ once: () => LOOKS.tap(w, h), sound: "water", ms: 2600 });
  else if (shape === "toilet") R({ once: () => LOOKS.flush(w, h), sound: "flush", ms: 1800 });
  else if (shape === "pot") R({ once: () => LOOKS.stew(), sound: "water", ms: 2400 });
  else if (shape === "curtain") R({ toggle: true, sound: "whoosh" }, (it) => LOOKS.drawn(w, h, it.c || k));
  else if (shape === "radio" || shape === "speaker") R({ toggle: true, sound: "music" }, () => LOOKS.notes(w, h));
  else if (SCREEN[shape]) {
    registerFx(key, shape);
    addScreen(key, SCREEN[shape].map((v) => Math.round(v * s)));
  } else if (opens) R({ toggle: true, sound: "chest" }, (it) => LOOKS.door(w, h, opens, it.c || k), { w: 0.78, levels: opens });
  // a light to turn on, on something that is not a lamp
  else if (flags.l && !["lys"].includes(META4[key].cat)) R({ toggle: true, sound: "tap" }, () => LOOKS.glow(w, h));
  else registerFx(key, shape);
}

/* The pixels one unit of the original is worth here: measured on the furniture of the game, so a thing is as big
   beside the furniture as it is in the original. Furniture stays close to its shape; the rest follows the original. */
const UNIT = 38.3;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function fit(P, size, uw, uh) {
  if (!uw || !uh) return size / 100;
  const s = Math.sqrt(((uw / 100) * UNIT) / P[0] * (((uh / 100) * UNIT) / P[1]));
  return P[2] === "mob" ? clamp(s, 0.75, 1.35) : clamp(s, 0.22, 1.8);
}

function add(key, name, shapeName, k, a, n, size, lvl, en, uw = 0, uh = 0, flags = {}, free = false) {
  const P = PROTO[shapeName];
  if (!P) throw new Error(`hv-packs4: no shape "${shapeName}" for ${key}`);
  const s = free ? clamp(Math.sqrt(((uw / 100) * UNIT) / P[0] * (((uh / 100) * UNIT) / P[1])), 0.3, 3.2) : fit(P, size, uw, uh);
  const [w, h, cat, draw, surf, flat] = P;
  THINGS4[key] = [
    name, cat, k, Math.round(w * s), Math.round(h * s),
    s === 1 ? (c) => draw(c, a, n) : (c) => `<g transform="scale(${s})">${draw(c, a, n)}</g>`,
    lvl == null ? 0 : price(cat, lvl), flat ? 1 : 0,
  ];
  META4[key] = { shape: shapeName, scale: s, cat, w: Math.round(w * s), h: Math.round(h * s) };
  if (Array.isArray(surf)) SURF4[key] = surf;
  // open storage (a basket, a bowl, a box without a lid): things can stand in it
  else if (flags.s && flags.s.length && META4[key].w >= 50) SURF4[key] = [0.7, ...flags.s];
  works(key, shapeName, META4[key].w, META4[key].h, s, k, flags);
  if (en) PACKS4_EN[name] = en;
}

for (const pk of PACKDATA) {
  for (const [key, name, shapeName, ci, ai, n, size, en, uw, uh, flags] of pk.items) add(key, name, shapeName, pk.cols[ci], pk.cols[ai], n, size, pk.lvl, en, uw, uh, flags);
  PACKS4.push({ id: pk.id, n: pk.n, em: pk.em, lvl: pk.lvl, d: pk.d, items: pk.items.map((it) => it[0]), town: pk.town, cols: pk.cols, wall: pk.wall, floor: pk.floor });
  PACKS4_EN[pk.n] = pk.en;
  PACKS4_EN[pk.d] = pk.den;
}

/* The everyday things for the rooms of the house: free for everybody (like hv-homethings). Bookcases and shelves
   to fill, little things to put on them. */
export const HOME4 = {};
const HOME = [
  ["hd-hjem-bogreol", "Bogreol", "bookcase", "#C98B55", "#E5484D", 0, 100, "Bookcase"],
  ["hd-hjem-bogreol2", "Bogreol, lys", "bookcase", "#E8C69A", "#4D96FF", 1, 100, "Light bookcase"],
  ["hd-hjem-reol", "Åben reol", "shelfunit", "#E8C69A", "#6BCB77", 0, 100, "Open shelves"],
  ["hd-hjem-reol2", "Åben reol, hvid", "shelfunit", "#FFFFFF", "#4D96FF", 1, 100, "White open shelves"],
  ["hd-hjem-kubereol", "Kubereol", "cubes", "#F4A261", "#E5484D", 0, 100, "Cube shelves"],
  ["hd-hjem-vaeghylde", "Vægreol", "wallshelf", "#C98B55", "#FFD93D", 0, 100, "Wall shelf"],
  ["hd-hjem-vaeghylde2", "Vægreol med ting", "wallshelf", "#FFFFFF", "#F15BB5", 1, 100, "Wall shelf with things"],
  ["hd-hjem-kommode", "Kommode", "dresser", "#E8C69A", "#C98B55", 0, 100, "Chest of drawers"],
  ["hd-hjem-skab", "Skab", "cabinet", "#A9764C", "#FFD93D", 0, 100, "Cupboard"],
  ["hd-hjem-vase", "Vase", "vase", "#4D96FF", "#FFD93D", 0, 100, "Vase"],
  ["hd-hjem-vase2", "Vase med blomster", "vase", "#F15BB5", "#FFD93D", 1, 100, "Vase with flowers"],
  ["hd-hjem-blomster", "Buket", "flowers", "#FF6B6B", "#FFD93D", 0, 100, "Bouquet"],
  ["hd-hjem-lys", "Stearinlys", "candle", "#FFFFFF", "#FFB347", 0, 100, "Candle"],
  ["hd-hjem-boger", "Stak bøger", "books", "#4D96FF", "#E5484D", 0, 100, "Pile of books"],
  ["hd-hjem-bog", "Bog", "book", "#6BCB77", "#FFD93D", 0, 100, "Book"],
  ["hd-hjem-plante", "Lille plante", "smallplant", "#6BCB77", "#E5484D", 0, 100, "Little plant"],
  ["hd-hjem-bigplante", "Stor plante", "plant", "#6BCB77", "#C98B55", 1, 100, "Big plant"],
  ["hd-hjem-kaktus", "Kaktus", "cactus", "#4FB05F", "#F15BB5", 0, 100, "Cactus"],
  ["hd-hjem-pude", "Pude", "pillow", "#FFB347", "#E5484D", 1, 100, "Cushion"],
  ["hd-hjem-ramme", "Billede i ramme", "frame", "#C98B55", "#6BCB77", 0, 100, "Framed picture"],
  ["hd-hjem-ramme2", "Hjerte i ramme", "frame", "#FFFFFF", "#F15BB5", 1, 100, "Framed heart"],
  ["hd-hjem-landskab", "Landskabsmaleri", "landscape", "#9B5DE5", "#6BCB77", 0, 100, "Landscape painting"],
  ["hd-hjem-ur", "Vægur", "clock", "#E5484D", "#FFFFFF", 0, 100, "Wall clock"],
  ["hd-hjem-spejl", "Spejl", "mirror", "#FFB347", "#FFFFFF", 0, 100, "Mirror"],
  ["hd-hjem-gardin", "Gardiner", "curtain", "#FFD93D", "#FFFFFF", 0, 100, "Curtains"],
  ["hd-hjem-kurv", "Kurv", "basket", "#C98B55", "#6BCB77", 0, 100, "Basket"],
  ["hd-hjem-kop", "Kop", "cup", "#4D96FF", "#FFFFFF", 0, 100, "Cup"],
  ["hd-hjem-skaal", "Frugtskål", "bowl", "#F15BB5", "#FFFFFF", 1, 100, "Fruit bowl"],
  ["hd-hjem-tallerken", "Tallerken", "plate", "#FFFFFF", "#4D96FF", 0, 100, "Plate"],
  ["hd-hjem-gryde", "Gryde", "pot", "#E5484D", "#FFD93D", 0, 100, "Pot"],
  ["hd-hjem-flaske", "Flaske", "bottle", "#6BCB77", "#FFFFFF", 0, 100, "Bottle"],
  ["hd-hjem-krukke", "Syltetøjsglas", "jar", "#FF6B6B", "#6BCB77", 0, 100, "Jam jar"],
  ["hd-hjem-kasse", "Opbevaringskasse", "box", "#9B5DE5", "#FFD93D", 0, 100, "Storage box"],
  ["hd-hjem-traekasse", "Trækasse", "crate", "#C98B55", "#6BCB77", 0, 100, "Wooden crate"],
  ["hd-hjem-radio", "Lille radio", "radio", "#00BBF9", "#FF6B6B", 0, 100, "Little radio"],
  ["hd-hjem-computer", "Bærbar computer", "laptop", "#CFD6E6", "#E5484D", 0, 100, "Laptop"],
  ["hd-hjem-bamse", "Bamse", "toy", "#D9A066", "#F7B5CF", 0, 100, "Teddy bear"],
  ["hd-hjem-pokal", "Pokal", "trophy", "#FFD93D", "#C98B55", 0, 100, "Trophy"],
  ["hd-hjem-skammel", "Skammel", "stool", "#C98B55", "#FFD93D", 0, 100, "Stool"],
  ["hd-hjem-baenk", "Bænk", "bench", "#6BCB77", "#FFD93D", 0, 100, "Bench"],
  ["hd-hjem-skraldespand", "Skraldespand", "trash", "#9AA4BA", "#4D96FF", 0, 100, "Waste bin"],
  ["hd-hjem-koleskab", "Køleskab, kan åbnes", "fridge", "#CFD6E6", "#9AA4BA", 0, 100, "Fridge (opens)"],
  ["hd-hjem-komfur", "Komfur, kan tændes", "oven", "#FFFFFF", "#E5484D", 0, 100, "Stove (turns on)"],
  ["hd-hjem-emhaette", "Emhætte", "hood", "#CFD6E6", "#4D96FF", 0, 100, "Cooker hood"],
  ["hd-hjem-kiste", "Kiste, kan åbnes", "chest", "#C98B55", "#FFD93D", 0, 100, "Chest (opens)"],
  ["hd-hjem-klaedeskab", "Klædeskab, kan åbnes", "wardrobe", "#E8C69A", "#C98B55", 0, 100, "Wardrobe (opens)"],
  ["hd-hjem-fjernsyn", "Fjernsyn med kanaler", "tv", "#3A3A55", "#6BCB77", 0, 100, "Tv with channels"],
  ["hd-hjem-loftlampe", "Loftlampe", "ceilinglamp", "#FFB347", "#FFFFFF", 0, 100, "Ceiling lamp"],
  ["hd-hjem-taeppe", "Gulvtæppe, rundt", "rug", "#4D96FF", "#FFD93D", 0, 100, "Round rug"],
  ["hd-hjem-taeppe2", "Gulvtæppe, prikket", "rug", "#F15BB5", "#FFFFFF", 1, 100, "Spotted rug"],
];
for (const [key, name, shapeName, k, a, n, size, en] of HOME) {
  add(key, name, shapeName, k, a, n, size, null, en);
  HOME4[key] = THINGS4[key];
  delete THINGS4[key];
}
/* The free ones are drawn from THINGS4 too (the shape is in META4 and the surface in the table below). */
addSurfaces(SURF4);
/* The stove the game already has lights the pots on it too. */
registerFx("komfur", "oven");

/* The furniture of the places of the worlds (hv-worlds): a shape at the size the original's furniture has. Free for
   everybody, and not in the shop. */
export const PLACE4 = {};
export function placeThing(key, shapeName, uw, uh, k, a, n) {
  if (THINGS4[key] || PLACE4[key]) return key;
  add(key, shapeName, shapeName, k, a, n, 100, null, "", uw, uh, {}, true);
  PLACE4[key] = THINGS4[key];
  delete THINGS4[key];
  return key;
}
