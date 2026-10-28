/* Hverdagsro – the houses of the theme packs, with all their floors. A house has as many floors as the original's: a
   family home three, a manor four, a hotel three, a flat five. Every floor is a long row of rooms, each as wide as
   the original's (hv-floors-data, made by tools/homedesigner from the shells of the original): a living room, a
   kitchen, bedrooms, a bath, a garden or a balcony outside. The rooms are furnished by what they are for (hv-layout),
   from the pack's own furniture first, and the lift in each floor (as the original has) takes you to the others.
   Our own drawings and rooms. */
import { shade } from "./hv-playcat.js";
import { addWorld, PLACES } from "./hv-world.js";
import { registerFx } from "./hv-fixtures.js";
import { PROTO } from "./hv-proto.js";
import { PACKS4, PACKS4_EN, HOME4, placeThing } from "./hv-packs4.js";
import { HOUSES } from "./hv-floors-data.js";
import { arrange } from "./hv-layout.js";
import { floorBg } from "./hv-roombg.js";
import { THEME_OF } from "./hv-scenery.js";

const hash = (s) => [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
const UNIT = 38.3;

/* ------------------------------------------------------------------ what the rooms of a house are */
/* What a room is for: the stations it is furnished with, in order (hv-layout). */
const TYPES = {
  living: ["sofa", "tv", "shelf", "corner"], fire: ["fireplace", "sofa", "shelf", "corner", "art"], kitchen: ["kitchen", "dining"],
  kitchenb: ["kitchen", "bar", "dining"], dining: ["dining", "art", "corner"], bedroom: ["bed", "wardrobe", "corner", "art"],
  kids: ["bed", "shelf", "corner", "desk"], bath: ["bath", "corner"], study: ["desk", "shelf", "corner", "art"], hall: ["wardrobe", "corner", "art"],
  attic: ["shelf", "desk", "corner", "art"], garden: ["outdoor", "corner", "outdoor", "corner"], park: ["outdoor", "corner", "outdoor", "outdoor"],
  balcony: ["outdoor", "corner"], lobby: ["bar", "sofa", "corner", "art"], counter: ["bar", "dining", "corner"], hotelroom: ["bed", "tv", "bath", "corner"],
  shop: ["shop", "art"], shopb: ["shop", "corner", "art"], studio: ["desk", "tv", "corner", "shelf"], spa: ["bath", "sofa", "corner"],
};
/* What each kind of house has, floor by floor: the ground floor (g), the floors above (u), the top floor (t). The
   biggest room gets the first, the next the second … and it starts again. */
const PLANS = {
  home: { g: ["living", "kitchen", "dining", "hall", "study", "bath"], u: ["bedroom", "bath", "kids", "bedroom", "study", "hall"], t: ["bedroom", "study", "bath", "attic"] },
  apartment: { g: ["living", "kitchen", "hall", "bath", "study"], u: ["bedroom", "bath", "study", "living", "hall"], t: ["living", "bedroom", "bath"] },
  manor: { g: ["fire", "dining", "kitchen", "hall", "study", "bath"], u: ["bedroom", "bedroom", "study", "bath", "hall"], t: ["bedroom", "attic", "study", "bath"] },
  cabin: { g: ["fire", "kitchen", "bedroom", "bath"], u: ["bedroom", "attic", "bath"], t: ["attic", "bedroom"] },
  kids: { g: ["kids", "living", "dining", "kids", "bath"], u: ["kids", "kids", "bath", "study"], t: ["kids", "attic"] },
  studio: { g: ["studio", "living", "kitchen", "study", "bath"], u: ["studio", "bedroom", "bath", "study"], t: ["studio", "attic"] },
  hotel: { g: ["lobby", "counter", "living", "hall"], u: ["hotelroom", "hotelroom", "hotelroom", "bath", "hall"], t: ["hotelroom", "hotelroom", "fire", "hall"] },
  shop: { g: ["shop", "shop", "shopb", "counter", "hall"], u: ["shopb", "shop", "study", "hall"], t: ["study", "shopb"] },
  restaurant: { g: ["counter", "dining", "kitchenb", "dining", "hall"], u: ["dining", "kitchenb", "living"], t: ["dining", "study"] },
  spa: { g: ["spa", "bath", "living", "spa", "hall"], u: ["spa", "bath", "hall"], t: ["spa", "bath"] },
  park: { g: ["park"], u: ["park"], t: ["park"], out: true },
  camper: { g: ["garden"], u: ["kitchen", "bedroom"], t: ["kitchen", "bedroom"] },
};
const PLAN_OF = {
  "hd-storfamilie": "home", "hd-aertehus": "home", "hd-velkomst": "home", "hd-bohem": "home", "hd-japandi": "home", "hd-foraar": "home", "hd-solnedgang": "home",
  "hd-strandhus": "home", "hd-poolvilla": "home", "hd-kystvilla": "home", "hd-startkassen": "home", "hd-startkassen-stort": "home", "hd-rengoering": "home",
  "hd-julestue": "cabin", "hd-skovhytte": "cabin", "hd-uhyggehus": "manor", "hd-gammeldags": "manor", "hd-herregaard": "manor", "hd-palae": "manor",
  "hd-lejlighed": "apartment", "hd-taghave": "apartment", "hd-loft": "studio", "hd-tusindaar": "studio", "hd-neonregnbue": "studio", "hd-streamer": "studio",
  "hd-solskin": "studio", "hd-stjernehus": "studio", "hd-vaerksted": "studio", "hd-boernehave": "kids", "hd-krammebjoern": "kids", "hd-bedstevenner": "kids",
  "hd-katoghund": "kids", "hd-miniverden": "kids", "hd-aktivpark": "park", "hd-byparken": "park", "hd-supermarked": "shop", "hd-lokalbutik": "shop",
  "hd-lokalbutik-ahorn": "shop", "hd-lokalbutik-gade": "shop", "hd-modebutik2": "shop", "hd-loppemarked": "shop", "hd-glans": "shop", "hd-gaveregn": "shop",
  "hd-bageri": "restaurant", "hd-restaurant": "restaurant", "hd-bryllup": "restaurant", "hd-hotel": "hotel", "hd-velvaere": "spa", "hd-boblespa": "spa", "hd-autocamper": "camper",
};
/* The names of the floors. */
const FLOORS_DA = ["Stuen", "1. sal", "2. sal", "3. sal", "4. sal"];
const SHOP_FLOORS = ["Stueplan", "1. sal", "2. sal", "3. sal"];
export const FLOORS_EN = { Etager: "Floors", "🛗 Huset har {n} etager. Tag liften, eller tryk på Etager.": "🛗 This house has {n} floors. Take the lift, or tap Floors.", "Du er her": "You are here", Stuen: "Ground floor", Stueplan: "Ground floor", "1. sal": "1st floor", "2. sal": "2nd floor", "3. sal": "3rd floor", "4. sal": "4th floor", Udenfor: "Outside", Indeni: "Inside", "Hvilken etage?": "Which floor?", "Ind i vognen": "Into the van", Ud: "Out" };
const labelOf = (plan, fi) => (plan === "camper" ? ["Udenfor", "Indeni"][fi] : (["shop", "hotel", "restaurant"].includes(plan) ? SHOP_FLOORS : FLOORS_DA)[fi] || `${fi}. sal`);

/* The look of each kind of room: pattern, wall and floor, from the pack's own colours. */
const mix = (a, b, t) => {
  if (a.length !== 7 || b.length !== 7) return a;
  const f = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [f(a), f(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};
function lookOf(type, pk) {
  const acc = pk.cols[1] || pk.cols[0], hi = pk.cols[0];
  switch (type) {
    case "kitchen": case "kitchenb": return { style: "tiles", wall: mix(pk.wall, "#FFFFFF", 0.45), floor: mix(pk.floor, "#FFFFFF", 0.4) };
    case "bath": case "spa": return { style: "tiles", wall: mix("#DDF1F7", acc, 0.12), floor: "#E3EAF0" };
    case "bedroom": case "hotelroom": return { style: "stripes", wall: mix(pk.wall, acc, 0.22), floor: pk.floor };
    case "kids": return { style: "dots", wall: mix(pk.wall, hi, 0.28), floor: mix(pk.floor, hi, 0.15) };
    case "attic": return { style: "bricks", wall: shade(pk.wall, 0.92), floor: shade(pk.floor, 0.92) };
    case "shop": case "shopb": return { style: "stripes", wall: mix(pk.wall, hi, 0.16), floor: mix(pk.floor, "#FFFFFF", 0.3) };
    case "studio": return { style: "plain", wall: mix(pk.wall, "#2B2340", 0.14), floor: pk.floor };
    case "dining": case "counter": case "lobby": return { style: "panel", wall: mix(pk.wall, acc, 0.1), floor: pk.floor };
    case "hall": case "study": return { style: "plain", wall: shade(pk.wall, 0.97), floor: shade(pk.floor, 1.06) };
    default: return { style: "panel", wall: pk.wall, floor: pk.floor };
  }
}

/* ------------------------------------------------------------------ the furniture a room falls back on */
/* If the pack has no bed, no table, no counter for a room that needs one: a plain one, in the pack's colours. */
const FILLERS = [["sofa", 0], ["armchair", 1], ["coffeetable", 0], ["table", 1], ["chair", 0], ["chair", 1], ["bed", 0], ["bed", 1], ["desk", 0], ["counter", 0], ["counter", 1], ["shopshelf", 0], ["shopshelf", 1],
  ["display", 0], ["bathtub", 0], ["toilet", 0], ["sink", 0], ["shower", 0], ["floorlamp", 0], ["bookcase", 0],
  ["parasol", 0], ["bbq", 0], ["fountain", 0], ["tent", 0], ["bench", 0], ["lounger", 0]];
function fillersOf(pk) {
  return FILLERS.filter(([shape]) => PROTO[shape]).map(([shape, n], i) => {
    const P = PROTO[shape], key = `hv-fill-${pk.id}-${shape}-${n}`;
    // drawn at the size of the shape itself (a scale of one)
    return placeThing(key, shape, Math.round((P[0] / UNIT) * 100), Math.round((P[1] / UNIT) * 100), pk.cols[(i + n) % pk.cols.length], pk.cols[(i + 3) % pk.cols.length], n);
  });
}

/* ------------------------------------------------------------------ building a house */
const PAD_LIFT = 190; // the room kept free for a lift at the start of a room
/* Where the windows are: those of the original, else one for every stretch of wall. */
function windowsOf(r, data) {
  const w = r.x1 - r.x0;
  if (w < 380) return [];
  const own = data.filter((x) => x > r.x0 + 70 && x < r.x1 - 70);
  if (own.length) return own;
  const n = Math.max(1, Math.floor((w - 140) / 520));
  return Array.from({ length: n }, (_, i) => Math.round(r.x0 + (w * (i + 0.5)) / n));
}

/* The places of one building: one for every floor. */
function buildHouse(bid, house, pk, meta, places) {
  const kind = PLAN_OF[bid] || "home", plan = PLANS[kind], n = house.floors.length;
  const ids = house.floors.map((_, fi) => (fi ? `${bid}-e${fi + 1}` : bid));
  const labels = house.floors.map((_, fi) => labelOf(kind, fi));
  const left = new Set(pk.items), prefer = new Set(pk.items), home = Object.keys(HOME4), fill = fillersOf(pk);
  const lifts = [];
  FLOOR_LIST[bid] = ids.map((id, fi) => [id, labels[fi]]);
  house.floors.forEach((F, fi) => {
    const allOut = plan.out || (kind === "camper" && fi === 0);
    const last = F.rooms.length - 1;
    const rooms = F.rooms.map(([x0, x1, k], i) => ({ x0: i ? x0 : 0, x1: i === last ? F.w : x1, out: k === "out" || allOut, hall: k === "hall" }));
    // a big room is furnished in zones, one after the other (a living room and its dining end)
    const zones = [];
    rooms.forEach((r, ri) => {
      const w = r.x1 - r.x0, nz = Math.max(1, r.out ? Math.round(w / 1200) : Math.ceil(w / 1100));
      for (let z = 0; z < nz; z++) zones.push({ ri, out: r.out, hall: r.hall, x0: Math.round(r.x0 + (w * z) / nz), x1: Math.round(r.x0 + (w * (z + 1)) / nz) });
    });
    // what each is: the biggest first
    const L = fi === 0 ? plan.g : fi === n - 1 && n > 2 ? plan.t : plan.u;
    const order = zones.map((_, i) => i).sort((a, b) => zones[b].x1 - zones[b].x0 - (zones[a].x1 - zones[a].x0));
    let rank = 0, bath = false;
    for (const i of order) {
      const z = zones[i], w = z.x1 - z.x0;
      if (z.out) z.type = kind === "park" ? "park" : w < 520 ? "balcony" : "garden";
      else if (z.hall) z.type = "hall";
      else if (w < 340) {
        z.type = !bath && L.includes("bath") ? "bath" : "hall";
        bath = bath || z.type === "bath";
      } else z.type = L[rank++ % L.length];
    }
    // the lift (or the door into the van) stands in the room of the original, else in the biggest room
    let lz = -1;
    if (n > 1) {
      const fitFor = (z) => z.x1 - z.x0 >= 480 && z.type !== "bath";
      const at = F.lift == null ? -1 : zones.findIndex((z) => F.lift >= z.x0 && F.lift < z.x1 && fitFor(z));
      // the lift stands in the hall between the rooms, if there is one
      lz = at >= 0 ? at : order.find((i) => zones[i].hall && fitFor(zones[i])) ?? order.find((i) => !zones[i].out && fitFor(zones[i])) ?? order.find((i) => fitFor(zones[i])) ?? -1;
    }
    const decor = [], zoneDecor = zones.map(() => []);
    let liftX = null, liftKey = "";
    if (lz >= 0) {
      const z = zones[lz];
      liftX = z.x0 + 135;
      liftKey = `hv-${kind === "camper" ? "door" : "lift"}-${bid}-${fi}`;
      const shape = kind === "camper" ? "housedoor" : "lift", P = PROTO[shape];
      placeThing(liftKey, shape, Math.round((P[0] / UNIT) * 100 * 0.9), Math.round((P[1] / UNIT) * 100 * 0.9), kind === "camper" ? pk.cols[0] : "#CFD6E6", pk.cols[1] || "#6BCB77", 0);
      lifts.push({ fi, key: liftKey, x: liftX });
    }
    // furnish the biggest rooms first, so they get the best of the pack's furniture
    for (const i of order) {
      const z = zones[i], w = z.x1 - z.x0;
      const { decor: d, used } = arrange([...left, ...fill, ...home], TYPES[z.type], `${bid}:${fi}:${i}`, {
        min: w, max: w, fit: true, prefer, curtains: false, indoor: !z.out, offset: i === lz ? PAD_LIFT : 0,
      });
      for (const k of used) left.delete(k);
      zoneDecor[i] = d.map((e) => (e.length > 3 ? [e[0], e[1] + z.x0, e[2], e[3]] : [e[0], e[1] + z.x0, e[2]]));
    }
    zoneDecor.forEach((d) => decor.push(...d));
    // windows, with their curtains and lamps; the door out on the ground floor
    const winData = F.win || [];
    const fxOf = rooms.map((r) => {
      if (r.out) return [];
      const fx = [];
      for (const x of windowsOf(r, winData)) {
        fx.push(["window", x]);
        if (x + 235 < r.x1 - 60) fx.push(["light", x + 235]);
        decor.push(["hd-hjem-gardin", x, 372]);
      }
      return fx;
    });
    if (fi === 0 && kind !== "camper") {
      const ins = rooms.map((_, i) => i).filter((i) => !rooms[i].out);
      if (ins.length) {
        const d = F.door[0], hit = d == null ? undefined : ins.find((i) => d > rooms[i].x0 + 50 && d < rooms[i].x1 - 50);
        const ri = hit ?? ins[ins.length - 1];
        fxOf[ri].push(["door", hit !== undefined ? d : rooms[ri].x1 - 110]);
      }
    }
    if (liftKey) decor.push([liftKey, liftX, 528]);
    const types = new Map();
    zones.forEach((z) => !types.has(z.ri) && types.set(z.ri, z.type));
    const spec = {
      cols: pk.cols,
      theme: kind === "camper" ? "camp" : THEME_OF[bid] || "",
      rooms: rooms.map((r, ri) => {
        const t = types.get(ri), look = r.out ? {} : lookOf(t, pk);
        return { ...r, kind: t, ...look, style: look.style, fx: fxOf[ri] };
      }),
    };
    places[ids[fi]] = {
      n: fi ? `${meta.n} · ${labels[fi]}` : meta.n, area: pk.town, em: pk.em, inside: true, width: F.w, of: bid, lift: liftX,
      bg: (s0, s1, tod, wd) => floorBg(spec, s0, s1, tod, wd),
      decor, npcs: [],
    };
    if (fi) {
      FLOORS_EN[places[ids[fi]].n] = `${meta.en} · ${FLOORS_EN[labels[fi]] || labels[fi]}`;
    }
  });
  // the lifts take you to the other floors
  for (const l of lifts) {
    const to = ids.map((id, fi) => [id, labels[fi], lifts.find((q) => q.fi === fi)?.x ?? 140]).filter((_, fi) => fi !== l.fi);
    if (kind === "camper") for (const t of to) t[1] = l.fi === 0 ? "Ind i vognen" : "Ud";
    registerFx(l.key, kind === "camper" ? "housedoor" : "lift", { fx: { lift: to, sound: "tap" } });
  }
}

/* ------------------------------------------------------------------ all the buildings */
/* The buildings that are not the pack's own (a pack with several houses): their names. */
const EXTRA = {
  "hd-lokalbutik-ahorn": { n: "Ahornalléen", en: "Maple Avenue", em: "🏪" },
  "hd-lokalbutik-gade": { n: "Næbgaden", en: "Beak Street", em: "🛍️" },
  "hd-startkassen-stort": { n: "Det store startkasse-hus", en: "The big starter house", em: "🏠" },
};
export const BUILDINGS = [];
/* The floors of every building, bottom first: [[place id, name], …]; and what a place is a floor of. */
const FLOOR_LIST = {};
export function floorList(sid) {
  const bid = PLACES[sid]?.of;
  return bid && FLOOR_LIST[bid]?.length > 1 ? FLOOR_LIST[bid] : null;
}
const places = {};
for (const [bid, house] of Object.entries(HOUSES)) {
  const pk = PACKS4.find((p) => p.id === house.pack);
  if (!pk) continue;
  const ex = EXTRA[bid];
  const meta = ex ? { n: ex.n, en: ex.en, em: ex.em } : { n: pk.n, en: PACKS4_EN[pk.n] || pk.n, em: pk.em };
  buildHouse(bid, house, pk, meta, places);
  if (ex) {
    PACKS4_EN[ex.n] = ex.en;
    BUILDINGS.push({ ...pk, id: bid, n: ex.n, em: ex.em, pack: pk.id });
  } else BUILDINGS.push({ ...pk, pack: pk.id });
}
addWorld({ places });
