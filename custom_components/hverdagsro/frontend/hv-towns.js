/* Hverdagsro – the new towns of the world: seven towns (Hjemmebyen, Børnebyen, Årstidsbyen, Strandbyen, Handelsbyen,
   Slotsbyen, Neonbyen), one building for every theme pack (hv-packs4), and some packs have more than one. A building has
   the floors of the original's house (hv-floors); the child can move, buy and add things as in any other place. The map
   page "Byerne" shows one town at a time. All our own drawings and places. */
import { OL, shade } from "./hv-playcat.js";
import { BG, addWorld, PLACES } from "./hv-world.js";
import { box, windows, tree, sign, Pp, flat, poly } from "./hv-city.js";
import { WORLD_TOWNS } from "./hv-worlds.js";
import { TOWNS4 } from "./hv-packs4-data.js";
import { BUILDINGS } from "./hv-floors.js";
import { HOUSES } from "./hv-floors-data.js";
import { buildingSvg } from "./hv-buildings.js";
import { THEME_OF } from "./hv-scenery.js";

const { rep } = BG;
const hash = (s) => [...s].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);

/* ------------------------------------------------------------------ the towns and their buildings */
/* Every building has its floors as places (hv-floors); here is the map of them. */
export const TOWNS = [...WORLD_TOWNS, ...TOWNS4.map((t) => ({ ...t, places: BUILDINGS.filter((p) => p.town === t.id) }))];
addWorld({ areas: TOWNS4.map((t) => ({ id: t.id, n: t.n, em: t.em, lvl: t.lvl, x: 0, y: 0, col: t.col, map: "byer" })) });
/* The building a place is a floor of. */
const buildingOf = (id) => PLACES[id]?.of || id;

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
  "hd-lokalbutik-ahorn": ["shop", 6], "hd-lokalbutik-gade": ["mall", 2], "hd-startkassen-stort": ["house", 6],
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
    const who = peers.filter((pe) => buildingOf(pe.space) === pk.id), seen = (opts.seen || []).includes(pk.id);
    const nFl = HOUSES[pk.id]?.floors.length || 1;
    const floorsB = nFl > 1 ? `<g class="tm-floorsb" pointer-events="none"><rect x="${sx - 80}" y="${sy - 11}" width="42" height="22" rx="11" fill="#fff" stroke="${OL}" stroke-width="2"/><text x="${sx - 59}" y="${sy + 5}" class="tm-newt">🛗${nFl}</text></g>` : "";
    const badge = !open
      ? `<g class="tm-lock" pointer-events="none"><rect x="${sx - 30}" y="${sy - 12}" width="60" height="24" rx="12" fill="#fff" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 5}" class="tm-newt">🔒 ${town.lvl}</text></g>`
      : seen
        ? `<g class="tm-seen" pointer-events="none"><circle cx="${sx}" cy="${sy}" r="11" fill="#6BCB77" stroke="#fff" stroke-width="3"/><path d="M${sx - 5} ${sy} l4 4 l7 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`
        : `<g class="tm-new" pointer-events="none"><rect x="${sx - 19}" y="${sy - 11}" width="38" height="22" rx="11" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 5}" class="tm-newt">${t("NY")}</text></g>`;
    items.push([blk[0] + blk[1], `<g class="tm-place${open ? "" : " locked"}${pk.id === buildingOf(here) ? " here" : ""}" data-pl="go" data-k="${pk.id}" role="button" aria-label="${t(pk.n)}">${buildingSvg(kind, variant, c0, c1, HOUSES[pk.id]?.floors.length || 1 + (hash(pk.id) % 2), THEME_OF[pk.id] || "", blk[0] + 0.4, blk[1] + 0.4)}${sign(blk[0] + 0.4 + 5.5, blk[1] + 0.4 + 4.5, 6.4, pk.em)}<text x="${px}" y="${py + 34}" class="tm-lbl">${t(pk.n)}</text>${floorsB}${badge}${who.map((pe, j) => `<circle cx="${sx - 22 + j * 12}" cy="${sy + 18}" r="8" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="2"/>`).join("")}</g>`]);
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
