/* Hverdagsro – the new towns of the world: seven towns (Hjemmebyen, Børnebyen, Årstidsbyen, Strandbyen, Handelsbyen,
   Slotsbyen, Neonbyen), one place for every theme pack (hv-packs4). Each place is a furnished room: the pack's own
   furniture along the walls, its things on the shelves, tables and counters, and pictures, curtains and lamps up.
   Everything is laid out from the pack's data when the game starts; the child can then move, buy and add things as in
   any other place. The map page "Byerne" shows one town at a time. All our own drawings and places. */
import { OL, shade } from "./hv-playcat.js";
import { BG, addWorld } from "./hv-world.js";
import { box, windows, gable, door, tree, pine, sign, Pp, flat, poly } from "./hv-city.js";
import { PACKS4 } from "./hv-packs4.js";
import { WORLD_TOWNS } from "./hv-worlds.js";
import { TOWNS4 } from "./hv-packs4-data.js";
import { arrange } from "./hv-layout.js";
import { roomBg, STYLES } from "./hv-roombg.js";

const { W, H, FLOOR, rect, out, rep, skyDef } = BG;

/* ------------------------------------------------------------------ laying out a room from a pack */
const hash = (s) => [...s].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
/* What each place is made of, in order from the left (hv-layout): the rooms of a home, a shop, a bar, a park. */
const HOME = ["kitchen", "dining", "sofa", "tv", "shelf", "bed", "wardrobe", "desk", "bath", "corner"];
const BY_TOWN = {
  hjem: HOME,
  born: ["shelf", "sofa", "corner", "bed", "dining", "desk"],
  saeson: ["fireplace", "sofa", "dining", "corner", "bed"],
  strand: ["outdoor", "sofa", "kitchen", "dining", "bed", "corner"],
  handel: ["shop", "bar", "corner"],
  slot: ["fireplace", "sofa", "dining", "bed", "wardrobe", "desk", "shelf", "bath"],
  neon: ["sofa", "tv", "desk", "bed", "corner", "shelf"],
};
const BY_PACK = {
  "hd-lejlighed": ["kitchen", "sofa", "tv", "desk", "bed", "wardrobe", "bath"],
  "hd-skovhytte": ["fireplace", "sofa", "kitchen", "dining", "bed", "corner"],
  "hd-aertehus": ["kitchen", "dining", "sofa", "fireplace", "bed", "corner"],
  "hd-velkomst": ["sofa", "tv", "dining", "kitchen", "bed", "wardrobe"],
  "hd-miniverden": ["bed", "desk", "tv", "sofa", "shelf", "wardrobe"],
  "hd-bohem": ["sofa", "corner", "bed", "dining", "shelf", "corner"],
  "hd-japandi": ["sofa", "tv", "kitchen", "dining", "bed", "wardrobe", "corner"],
  "hd-boernehave": ["shelf", "corner", "sofa", "dining", "bed", "shelf"],
  "hd-byparken": ["outdoor", "corner", "outdoor", "bar"],
  "hd-aktivpark": ["outdoor", "sofa", "outdoor", "corner"],
  "hd-supermarked": ["shop", "shop", "bar"],
  "hd-lokalbutik": ["shop", "bar", "shop"],
  "hd-modebutik2": ["shop", "art", "shop", "corner"],
  "hd-loppemarked": ["shop", "outdoor", "shop"],
  "hd-glans": ["shop", "desk", "corner"],
  "hd-bageri": ["bar", "shop", "dining", "dining", "corner"],
  "hd-restaurant": ["kitchen", "bar", "dining", "dining", "corner"],
  "hd-hotel": ["bar", "sofa", "dining", "bed", "bath", "corner"],
  "hd-velvaere": ["bath", "corner", "bed", "sofa"],
  "hd-boblespa": ["bath", "sofa", "corner", "bath"],
  "hd-poolvilla": ["outdoor", "kitchen", "dining", "sofa", "bed"],
  "hd-autocamper": ["fireplace", "bed", "kitchen", "outdoor", "corner"],
  "hd-uhyggehus": ["fireplace", "shelf", "bed", "corner", "art"],
  "hd-julestue": ["fireplace", "sofa", "dining", "corner", "shelf"],
  "hd-vaerksted": ["desk", "shelf", "desk", "corner", "art"],
  "hd-rengoering": ["kitchen", "bath", "sofa", "corner"],
  "hd-streamer": ["desk", "tv", "sofa", "shelf", "bed"],
  "hd-stjernehus": ["sofa", "tv", "bar", "bed", "bath", "corner"],
  "hd-palae": ["fireplace", "sofa", "dining", "kitchen", "bed", "wardrobe", "desk", "shelf", "bath"],
  "hd-herregaard": ["fireplace", "sofa", "dining", "desk", "shelf", "bed", "wardrobe"],
  "hd-bryllup": ["outdoor", "dining", "bar", "corner"],
};
/* What hangs on the wall of a house or a shop of a pack, like the places of the worlds have: a door at each end, a window
   with its curtains for every stretch of wall, a lamp between. */
function dressing(width) {
  const fx = [["door", 110], ["door", width - 110]];
  for (let x = 330; x < width - 220; x += 470) fx.push(["window", x], ["curtain", x], ["light", x + 235]);
  return fx;
}
function layout(pk) {
  const stations = BY_PACK[pk.id] || BY_TOWN[pk.town] || HOME;
  const { decor, width } = arrange(pk.items, stations, pk.id, { min: 1000, max: 2200 });
  return { decor, wd: width };
}

/* ------------------------------------------------------------------ the places */
export const TOWNS = [...WORLD_TOWNS, ...TOWNS4.map((t) => ({ ...t, places: PACKS4.filter((p) => p.town === t.id) }))];
const places = {};
for (const pk of PACKS4) {
  const { decor, wd } = layout(pk);
  for (const [kind, x] of dressing(wd)) if (kind === "curtain") decor.push(["hd-hjem-gardin", x, 372]);
  places[pk.id] = {
    n: pk.n, area: pk.town, em: pk.em, inside: true, width: wd,
    bg: (s0, s1, tod, w) => roomBg({ ...pk, fx: dressing(wd) }, STYLES[hash(pk.id) % STYLES.length], s0, s1, tod, w),
    decor, npcs: [],
  };
}
addWorld({ places, areas: TOWNS4.map((t) => ({ id: t.id, n: t.n, em: t.em, lvl: t.lvl, x: 0, y: 0, col: t.col, map: "byer" })) });

/* ------------------------------------------------------------------ the map page */
const MW = 1000, MH = 620;
const BLOCKS = [[0, 0], [14, 0], [28, 0], [42, 0], [0, 14], [14, 14], [28, 14], [42, 14], [0, 28], [14, 28], [28, 28], [42, 28]];
/* What each building is, by pack: [kind, variation]. Every one of the 47 is its own building. */
const KIND = {
  "hd-storfamilie": ["house", 1], "hd-lejlighed": ["tower", 0], "hd-skovhytte": ["cabin", 0], "hd-aertehus": ["cottage", 1], "hd-velkomst": ["house", 0],
  "hd-miniverden": ["tall", 1], "hd-bohem": ["cottage", 0], "hd-japandi": ["villa", 1],
  "hd-boernehave": ["house", 2], "hd-krammebjoern": ["cottage", 2], "hd-katoghund": ["hut", 1], "hd-bedstevenner": ["tall", 0], "hd-aktivpark": ["park", 1], "hd-byparken": ["park", 0],
  "hd-julestue": ["cabin", 1], "hd-foraar": ["cottage", 3], "hd-uhyggehus": ["haunted", 0], "hd-gaveregn": ["shop", 2], "hd-startkassen": ["hut", 0],
  "hd-kystvilla": ["villa", 0], "hd-strandhus": ["cabin", 2], "hd-poolvilla": ["villa", 2], "hd-autocamper": ["camper", 0], "hd-taghave": ["tall", 2], "hd-solnedgang": ["house", 3],
  "hd-supermarked": ["mall", 0], "hd-lokalbutik": ["shop", 0], "hd-modebutik2": ["shop", 1], "hd-loppemarked": ["pavilion", 1], "hd-glans": ["shop", 3], "hd-bageri": ["shop", 4], "hd-restaurant": ["shop", 5],
  "hd-herregaard": ["manor", 0], "hd-palae": ["manor", 1], "hd-hotel": ["tower", 2], "hd-gammeldags": ["house", 4], "hd-bryllup": ["pavilion", 0], "hd-velvaere": ["villa", 3],
  "hd-neonregnbue": ["tower", 1], "hd-streamer": ["tower", 3], "hd-tusindaar": ["mall", 1], "hd-solskin": ["tall", 3], "hd-stjernehus": ["villa", 4], "hd-loft": ["tower", 4], "hd-vaerksted": ["shop", 2], "hd-rengoering": ["house", 5], "hd-boblespa": ["pavilion", 2],
};
/* What a building of a world looks like, by what the place is. */
const KINDS_BY_NAME = [
  [/hospital|ward|treatment|basement|entrance|mall|center|centre|station|stadium|arcade/i, "mall"], [/school|class|campus|lecture|dorm|univers|court|bank|theatre|studio/i, "manor"],
  [/apartment|loft|hotel|block|office|workplace|tower|lodge/i, "tower"], [/store|shop|salon|tailor|bakery|cafe|café|restaurant|food|emporium|dentist|vet|market/i, "shop"],
  [/park|playground|field|forest|garden|arena|wildlife|beach|piste|skate|rink|bay|lagoon|pool|festival|onsen|boat/i, "park"], [/cabin|bungalow|barn|hut|house|home|farm/i, "cabin"],
];
function kindFor(pk) {
  const hit = KINDS_BY_NAME.find(([rx]) => rx.test(pk.en || pk.n));
  return [hit ? hit[1] : "house", hash(pk.id) % 5];
}
const BUILD = {
  house: (x, y, c1, c2, v) => `${box(x + 1.2, y + 1.5, 8 + (v % 2), 6 - (v % 3) * 0.4, 3.4 + (v % 3) * 0.5, c1)}${gable(x + 1.2, y + 1.5, 8 + (v % 2), 6 - (v % 3) * 0.4, 3.4 + (v % 3) * 0.5, 2.4, c2, c1)}${windows(x + 1.2, y + 1.5, 8 + (v % 2), 6 - (v % 3) * 0.4, 3.4 + (v % 3) * 0.5, 1, 4, 3, "#C7E6FF")}${door(x + 5, y + 1.5, 6)}${v % 2 ? box(x + 8, y + 2, 0.8, 0.8, 5.2, shade(c2, 0.8)) : ""}${tree(x + 10.5, y + 9, 0.8)}`,
  cottage: (x, y, c1, c2, v) => `${box(x + 2.5, y + 2.5, 6, 5, 2.8, c1)}${gable(x + 2.5, y + 2.5, 6, 5, 2.8, 2.2, c2, c1)}${windows(x + 2.5, y + 2.5, 6, 5, 2.8, 1, 2, 2, "#FFF3B0")}${door(x + 4.8, y + 2.5, 5, 1.3, 2.2)}${box(x + 7.6, y + 3, 0.7, 0.7, 4.6, "#8B5A3C")}${tree(x + 1, y + 9, 0.8, v % 2 ? "#F7B5CF" : "#6BCB77")}${tree(x + 10, y + 9.5, 0.6)}`,
  tall: (x, y, c1, c2, v) => `${box(x + 3, y + 2, 6, 6, 7 + (v % 2), c1)}${gable(x + 3, y + 2, 6, 6, 7 + (v % 2), 2.6, c2, c1)}${windows(x + 3, y + 2, 6, 6, 7 + (v % 2), 3, 3, 3, "#C7E6FF")}${door(x + 5.2, y + 2, 6, 1.4, 2.4)}`,
  shop: (x, y, c1, c2, v) => `${box(x + 0.6, y + 1.5, 10.8, 6.5, 4.2 + (v % 2) * 0.8, c1)}${windows(x + 0.6, y + 1.5, 10.8, 6.5, 4.2 + (v % 2) * 0.8, 1, 5, 3, "#FFF6E6")}${box(x + 0.6, y + 7.7, 10.8, 0.5, 0.8, c2, 3.0)}${rep(5, (i) => box(x + 1.2 + i * 2.2, y + 7.7, 1.1, 0.5, 0.8, "#fff", 3.0))}${door(x + 4.8 + (v % 3), y + 1.5, 6.5, 2, 2.4, "#BFE6FF")}`,
  mall: (x, y, c1, c2, v) => `${box(x + 0.6, y + 1, 10.8, 9, 5.8, c1)}${windows(x + 0.6, y + 1, 10.8, 9, 5.8, 2, 6, 4, "#FFF6E6")}${box(x + 3.5, y + 9.7, 5, 0.8, 1.2, c2, 3)}${door(x + 4.8, y + 1, 9, 2.4, 2.6, "#BFE6FF")}${box(x + 4.5, y + 3, 3, 2, 1.2, c2, 5.8)}`,
  tower: (x, y, c1, c2, v) => `${box(x + 2.5, y + 2, 6, 5.5, 9 + (v % 3) * 1.5, c1)}${windows(x + 2.5, y + 2, 6, 5.5, 9 + (v % 3) * 1.5, 4 + (v % 3), 4, 3, "#FFF6E6")}${box(x + 2.9, y + 2.4, 5.2, 4.7, 0.8, c2, 9 + (v % 3) * 1.5)}${door(x + 4.6, y + 2, 5.5)}`,
  manor: (x, y, c1, c2, v) => `${box(x + 1, y + 1, 10, 7, 5 + v, c1)}${rep(5, (i) => box(x + 1.6 + i * 2, y + 7.6, 0.6, 0.6, 3.6, "#FFFFFF"))}${gable(x + 1, y + 1, 10, 7, 5 + v, 2.4, c2, c1)}${windows(x + 1, y + 1, 10, 7, 5 + v, 2, 5, 3, "#FFF6E6")}${door(x + 5.2, y + 1, 7, 1.6, 2.6)}${v ? box(x + 0.6, y + 1.5, 2, 2, 7.5, c1) + box(x + 9.4, y + 1.5, 2, 2, 7.5, c1) : ""}`,
  villa: (x, y, c1, c2, v) => `${box(x + 1, y + 1, 7.5 + (v % 2), 5, 3, c1)}${box(x + 3, y + 1, 5.5, 5, 2.4, shade(c1, 0.95), 3)}${windows(x + 1, y + 1, 7.5 + (v % 2), 5, 3, 1, 3, 2, "#9FD4FF")}${flat([[x + 2, y + 7.2, 0.45], [x + 10, y + 7.2, 0.45], [x + 10, y + 10.8, 0.45], [x + 2, y + 10.8, 0.45]], "#4FB3FF", `stroke="${OL}" stroke-width="1.5"`)}${door(x + 4, y + 1, 5, 1.6, 2.4, c2)}${v > 1 ? tree(x + 10.8, y + 3, 0.8, "#4FB05F") : ""}`,
  cabin: (x, y, c1, c2, v) => `${box(x + 2, y + 2, 7, 5, 3, c1)}${gable(x + 2, y + 2, 7, 5, 3, 2.2, c2, c1)}${windows(x + 2, y + 2, 7, 5, 3, 1, 2, 2, "#FFF3B0")}${door(x + 4.8, y + 2, 5, 1.3, 2.2)}${pine(x + 0.8, y + 1, 1)}${pine(x + 10, y + 2, 0.8)}${pine(x + 10.4, y + 8, 1)}${v % 2 ? pine(x + 1, y + 9, 0.9) : ""}`,
  hut: (x, y, c1, c2, v) => `${box(x + 3.5, y + 3, 4.5, 4, 2.4, c1)}${gable(x + 3.5, y + 3, 4.5, 4, 2.4, 1.8, c2, c1)}${door(x + 5, y + 3, 4, 1.2, 1.9)}${tree(x + 9.5, y + 8, 0.7)}${v % 2 ? tree(x + 1.5, y + 8.5, 0.6) : ""}`,
  pavilion: (x, y, c1, c2, v) => `${flat([[x + 1, y + 1, 0.4], [x + 11, y + 1, 0.4], [x + 11, y + 10, 0.4], [x + 1, y + 10, 0.4]], shade(c1, 1.1), `stroke="${OL}" stroke-width="1.5"`)}${rep(4, (i) => box(x + 1.4 + (i % 2) * 8.8, y + 1.6 + Math.floor(i / 2) * 7.2, 0.6, 0.6, 3.8, "#FFFFFF", 0.4))}${box(x + 1, y + 1, 10, 9, 0.5, c2, 4.2)}${tree(x + 0.5, y + 11, 0.7)}`,
  park: (x, y, c1, c2, v) => `${flat([[x + 0.6, y + 0.6, 0.4], [x + 11.4, y + 0.6, 0.4], [x + 11.4, y + 11.4, 0.4], [x + 0.6, y + 11.4, 0.4]], "#9BD7A0", `stroke="${OL}" stroke-width="1.5"`)}${tree(x + 2, y + 2, 0.8)}${tree(x + 10, y + 3, 0.8, "#8FD08A")}${tree(x + 3, y + 10, 0.7)}${box(x + 5.6, y + 5.6, 2.6, 0.8, 0.8, c2, 0.4)}${v ? box(x + 4, y + 8, 4, 0.6, 1.6, c1, 0.4) : tree(x + 8.5, y + 8.5, 0.8)}`,
  haunted: (x, y, c1, c2) => `${box(x + 3, y + 2, 6, 6, 6.4, "#5D4E7A")}${gable(x + 3, y + 2, 6, 6, 6.4, 3.8, "#2B2340", "#5D4E7A")}${windows(x + 3, y + 2, 6, 6, 6.4, 2, 3, 3, "#FFD93D")}${door(x + 5.2, y + 2, 6, 1.4, 2.4, "#3A2A55")}${pine(x + 1, y + 9, 1)}${pine(x + 10.4, y + 9.4, 0.9)}`,
  camper: (x, y, c1, c2) => `${box(x + 2, y + 4, 7, 3, 2.8, c1)}${box(x + 7.4, y + 4, 2.2, 3, 1.6, shade(c1, 0.9))}${windows(x + 2, y + 4, 7, 3, 2.8, 1, 3, 1, "#C7E6FF")}${box(x + 1, y + 7.1, 5, 0.5, 0.5, c2, 2.2)}${pine(x + 0.6, y + 1.4, 1)}${pine(x + 10.6, y + 9, 0.9)}`,
};
/* One town seen from above. opts: { town: id, seen: [place ids] }. */
export function townsSvg(ctx, lv, here, peers, t, opts = {}) {
  const town = TOWNS.find((x) => x.id === opts.town) || TOWNS[0];
  const open = lv >= town.lvl;
  // the real sky: the colours of the hour, a dark night, and the weather that is falling
  const [sky0, sky1, tod] = opts.sky || [shade(town.col, 1.15), "#FFF8EC", "day"];
  const sky = `<linearGradient id="bm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky0}"/><stop offset="1" stop-color="${sky1}"/></linearGradient>`;
  const wxSvg = opts.wx ? `<g class="fx-rain" pointer-events="none">${rep(24, (j) => (opts.wx === "rain" ? `<path d="M${30 + j * 40} 20 v14" stroke="#4FB3FF" stroke-width="3" stroke-linecap="round" style="--fall:560px;animation-delay:${-(j * 0.13) % 0.9}s"/>` : `<circle cx="${30 + j * 40}" cy="20" r="4" fill="#fff" style="--fall:560px;animation-delay:${-(j * 0.31) % 2.4}s"/>`))}</g>` : "";
  const nightSvg = tod === "night" ? `<rect width="${MW}" height="${MH}" fill="#0B1030" opacity=".42" pointer-events="none"/>${rep(14, (j) => `<circle cx="${(j * 173) % MW}" cy="${(j * 61) % 180 + 10}" r="2.5" fill="#fff" class="pl-twinkle" pointer-events="none"/>`)}` : tod === "dusk" ? `<rect width="${MW}" height="${MH}" fill="#FF8A3C" opacity=".12" pointer-events="none"/>` : "";
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
  town.places.forEach((pk, i) => {
    const blk = BLOCKS[i];
    if (!blk) return;
    const [kind, variant] = KIND[pk.id] || kindFor(pk), [c0, c1] = [pk.cols[0], pk.cols[1] || pk.cols[0]];
    const [px, py] = Pp(blk[0] + 0.4 + 5.5, blk[1] + 0.4 + 4.5, 6.4), sx = px + 26, sy = py - 46;
    const who = peers.filter((pe) => pe.space === pk.id), seen = (opts.seen || []).includes(pk.id);
    const badge = !open
      ? `<g class="tm-lock" pointer-events="none"><rect x="${sx - 30}" y="${sy - 12}" width="60" height="24" rx="12" fill="#fff" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 5}" class="tm-newt">🔒 ${town.lvl}</text></g>`
      : seen
        ? `<g class="tm-seen" pointer-events="none"><circle cx="${sx}" cy="${sy}" r="11" fill="#6BCB77" stroke="#fff" stroke-width="3"/><path d="M${sx - 5} ${sy} l4 4 l7 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`
        : `<g class="tm-new" pointer-events="none"><rect x="${sx - 19}" y="${sy - 11}" width="38" height="22" rx="11" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 5}" class="tm-newt">${t("NY")}</text></g>`;
    items.push([blk[0] + blk[1], `<g class="tm-place${open ? "" : " locked"}${pk.id === here ? " here" : ""}" data-pl="go" data-k="${pk.id}" role="button" aria-label="${t(pk.n)}">${BUILD[kind](blk[0] + 0.4, blk[1] + 0.4, c0, c1, variant)}${sign(blk[0] + 0.4 + 5.5, blk[1] + 0.4 + 4.5, 6.4, pk.em)}<text x="${px}" y="${py + 34}" class="tm-lbl">${t(pk.n)}</text>${badge}${who.map((pe, j) => `<circle cx="${sx - 22 + j * 12}" cy="${sy + 18}" r="8" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="2"/>`).join("")}</g>`]);
  });
  items.sort((a, b) => a[0] - b[0]);
  const tw = Math.max(220, t(town.n).length * 17 + 90);
  const title = `<g pointer-events="none"><rect x="20" y="64" width="${tw}" height="44" rx="22" fill="#fff" stroke="${OL}" stroke-width="2.5"/><text x="${20 + tw / 2}" y="93" class="tm-area">${town.em} ${t(town.n)}${open ? "" : ` · ${t("niv. {n}", { n: town.lvl })}`}</text></g>`;
  return `<defs>${sky}</defs><rect width="${MW}" height="${MH}" fill="url(#bm-sky)"/>${far}${land}${roads}${plots}${bus}${items.map((x) => x[1]).join("")}${nightSvg}${wxSvg}${title}`;
}
export const TOWNS_EN = {
  Byerne: "The towns", "Til Verden": "To the world", Hjemmebyen: "Home Town", "Børnebyen": "Kids' Town", "Årstidsbyen": "Season Town", Strandbyen: "Beach Town",
  Handelsbyen: "Shopping Town", Slotsbyen: "Castle Town", Neonbyen: "Neon Town",
};
