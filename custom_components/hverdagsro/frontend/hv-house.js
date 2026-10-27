/* Hverdagsro – the house: one model for the live plan (Huset/Sikkerhed, rooms) and the Husbygger.

   The model is stored in ctx.data.house:
     { name, rooms: [{ id, name, rtype, area, light, pts, kid, age, style, img, art, lamps: { place: light } }],
       walls: [{ id, a: [x, y], b: [x, y], k: "ext" | "int" | "open" }],
       areas: [{ id, kind, name, pts } | { id, kind: "label", name, x, y, rot }],
       items: [{ type, id, name, x, y, ent, ... }] }
   1 metre is 60 units on the drawing. Live states come from each item's entities; nothing here is made up. */
import { ART, ART_IDS } from "./hv-roomart.js";
import { esc, hashStr, prng } from "./hv-core.js";
import { activeDecor } from "./hv-decor.js";
import * as Appl from "./hv-appliances.js";
import { P, svg } from "./hv-icons.js";

let C = null;
const t = (s, v) => (C ? C.t(s, v) : s);

/* ------------------------------------------------------------------ constants */
// type: [Danish name, icon, colour, entity domains (comma separated, "" = any), layer]
export const HT = {
  door: ["Dør", "door", "#10B981", "binary_sensor", "sikkerhed"],
  window: ["Vindue", "window", "#38BDF8", "binary_sensor", "sikkerhed"],
  port: ["Garageport", "garage", "#64748B", "cover,binary_sensor", "sikkerhed"],
  camera: ["Kamera", "camera", "#2F6FED", "camera", "sikkerhed"],
  motion: ["Bevægelse", "walk", "#EAB308", "binary_sensor", "sikkerhed"],
  smoke: ["Røgalarm", "smoke", "#A855F7", "binary_sensor", "sikkerhed"],
  leak: ["Vandføler", "drop", "#0EA5E9", "binary_sensor", "sikkerhed"],
  speaker: ["Højttaler", "speaker", "#E5484D", "media_player", "medier"],
  tv: ["TV", "tv", "#16A34A", "media_player", "medier"],
  lamp: ["Lampe", "bulb", "#F5B301", "light,switch", "lys"],
  temp: ["Termometer", "heat", "#EF4444", "sensor,climate", "klima"],
  ap: ["Accesspoint", "wifi", "#F97316", "sensor,binary_sensor,device_tracker,update", "netvaerk"],
  washer: ["Vaskemaskine", "plug", "#64748B", "", "apparater"],
  dryer: ["Tørretumbler", "plug", "#64748B", "", "apparater"],
  dish: ["Opvasker", "dish", "#3B82F6", "", "apparater"],
  oven: ["Ovn", "flame", "#E4572E", "", "apparater"],
  hob: ["Induktion", "flame", "#E4572E", "", "apparater"],
  coffee: ["Kaffemaskine", "coffee", "#8B5E3C", "", "apparater"],
  fridge: ["Køleskab", "plug", "#10B981", "", "apparater"],
  freezer: ["Fryser", "plug", "#38BDF8", "", "apparater"],
  vent: ["Ventilation", "fan", "#64748B", "", "apparater"],
  vacuum: ["Robotstøvsuger", "vacuum", "#334155", "vacuum", "apparater"],
  mower: ["Plæneklipper", "tree", "#3F8F3A", "lawn_mower,vacuum,sensor", "apparater"],
  furn: ["Møbel", "sofa", "#A16207", "", "indretning"],
  light: ["Lyskilde", "bulb", "#F5B301", "light,switch", "lys"],
  car: ["Bil", "car", "#2F6FED", "", "energi"],
  charger: ["Lader", "bolt", "#10B981", "sensor,binary_sensor,switch", "energi"],
  solar: ["Solceller", "sun", "#F59E0B", "sensor", "energi"],
  battery: ["Batteri", "battery", "#22C55E", "sensor", "energi"],
  tree: ["Træ", "tree", "#3F8F3A", "", "ude"],
  bush: ["Busk", "tree", "#4E9F3D", "", "ude"],
};
const OPENING = new Set(["door", "window", "port"]);
const APK = new Set(["washer", "dryer", "dish", "oven", "hob", "coffee", "fridge", "freezer", "vent", "vacuum", "mower"]);
const ROBOT = new Set(["vacuum", "mower"]);
const OBJ = new Set(["furn", "light", "car", "charger", "solar", "battery", "tree", "bush"]);
const PX_M = 60;
const CM = (v) => Math.round((v * PX_M) / 100);
/* Furniture: [name, width cm, depth cm, rooms it belongs to]. The back of a piece is its top edge (-y),
   which is the side that goes against a wall. */
const FURN = {
  // Stue
  sofa: ["Sofa", 230, 95, "stue"], corner: ["Hjørnesofa", 280, 200, "stue"], chaise: ["Sofa med chaiselong", 270, 160, "stue"], arm: ["Lænestol", 85, 85, "stue,sove"],
  pouf: ["Puf", 55, 55, "stue,born"], coffee: ["Sofabord", 120, 60, "stue"], sidet: ["Sidebord", 45, 45, "stue,sove"], tvbench: ["TV-bord", 180, 40, "stue,sove"],
  sideboard: ["Skænk", 160, 45, "stue,kok,ent"], shelf: ["Reol", 120, 35, "stue,born,kontor,bry"], piano: ["Klaver", 150, 60, "stue"], stove: ["Brændeovn", 55, 50, "stue"],
  rug: ["Tæppe", 240, 170, "stue,sove,born"], plant: ["Plante", 50, 50, "stue,kok,kontor,ent"],
  // Køkken
  base: ["Underskab", 60, 60, "kok,bry"], sinkc: ["Køkkenvask", 80, 60, "kok"], hobc: ["Kogeplade", 60, 60, "kok"], dishc: ["Opvaskemaskine", 60, 60, "kok"],
  ovenc: ["Ovn i højskab", 60, 60, "kok"], fridgec: ["Køleskab", 60, 65, "kok,bry"], tall: ["Højskab", 60, 60, "kok,bry"], wallc: ["Overskab", 60, 35, "kok,bry,bad"],
  counter: ["Køkkenbord", 300, 62, "kok"], island: ["Køkkenø", 200, 100, "kok"], table: ["Spisebord", 200, 95, "kok,stue"], tround: ["Rundt bord", 110, 110, "kok,stue"],
  chair: ["Stol", 48, 50, "kok,stue,born,kontor"], stool: ["Barstol", 40, 40, "kok"], bench: ["Bænk", 140, 40, "kok,ent"],
  // Soveværelse
  bed2: ["Dobbeltseng", 180, 200, "sove"], bed1: ["Enkeltseng", 90, 200, "sove,born"], nightstand: ["Natbord", 45, 40, "sove,born"], wardrobe: ["Garderobeskab", 120, 60, "sove,born,ent"],
  dresser: ["Kommode", 100, 50, "sove,born"], vanity: ["Toiletbord", 100, 45, "sove"], bbench: ["Sengebænk", 140, 40, "sove"],
  // Børneværelse
  bunk: ["Køjeseng", 95, 205, "born"], crib: ["Tremmeseng", 70, 140, "born"], desk: ["Skrivebord", 120, 60, "born,kontor"], toybox: ["Legetøjskasse", 70, 40, "born"],
  playk: ["Legekøkken", 80, 35, "born"], tipi: ["Legetelt", 120, 120, "born"], beanbag: ["Sækkestol", 80, 80, "born,stue"],
  // Bad
  tub: ["Badekar", 170, 75, "bad"], shower: ["Bruseniche", 90, 90, "bad"], toilet: ["Toilet", 40, 65, "bad"], sink: ["Håndvask", 60, 45, "bad"],
  vanityb: ["Vaskeskab", 80, 46, "bad"], mirror: ["Spejlskab", 80, 15, "bad"], towel: ["Håndklædetørrer", 50, 10, "bad"],
  // Bryggers
  wm: ["Vaskemaskine", 60, 60, "bry,bad"], td: ["Tørretumbler", 60, 60, "bry,bad"], tower: ["Vaskesøjle", 60, 65, "bry"], usink: ["Bryggersvask", 60, 50, "bry"],
  rack: ["Tørrestativ", 180, 55, "bry"], clean: ["Rengøringsskab", 60, 60, "bry"], hooks: ["Knagerække", 100, 12, "bry,ent"],
  // Entré og kontor
  shoes: ["Skoreol", 80, 30, "ent"], mirrorw: ["Spejl", 60, 5, "ent,sove"], standd: ["Hæve-sænkebord", 160, 80, "kontor"], ochair: ["Kontorstol", 62, 62, "kontor"],
  cabinet: ["Arkivskab", 45, 60, "kontor"],
  // Garage og skur
  work: ["Værkbænk", 180, 70, "gar"], gshelf: ["Stålreol", 120, 45, "gar"], bike: ["Cykel", 180, 60, "gar"], bins: ["Affaldsspande", 150, 75, "gar,have"], tools: ["Værktøjsvæg", 200, 12, "gar"],
  // Have
  gset: ["Havemøbler", 240, 180, "have"], gtable: ["Havebord", 180, 90, "have"], lounge: ["Loungemøbler", 240, 200, "have"], lounger: ["Liggestol", 70, 190, "have"],
  parasol: ["Parasol", 300, 300, "have"], pizza: ["Pizzaovn", 80, 80, "have"], weber: ["Kuglegrill", 60, 60, "have"], grill: ["Gasgrill", 140, 60, "have"],
  firepit: ["Bålfad", 80, 80, "have"], tramp: ["Trampolin", 366, 366, "have"], sandbox: ["Sandkasse", 150, 150, "have"], raised: ["Højbed", 200, 80, "have"],
  playhouse: ["Legehus", 150, 150, "have"], swing: ["Gyngestativ", 250, 160, "have"], shed: ["Skur og værksted", 300, 250, "have,gar"],
};
const FCATS = [
  ["stue", "Stue"], ["kok", "Køkken"], ["sove", "Soveværelse"], ["born", "Børneværelse"], ["bad", "Badeværelse"], ["bry", "Bryggers"], ["ent", "Entré"], ["kontor", "Kontor"], ["gar", "Garage og skur"],
];
const furnIn = (cat) => {
  const ks = Object.keys(FURN).filter((k) => FURN[k][3].split(",").includes(cat));
  // The room's own furniture first, then what it shares with other rooms.
  return [...ks.filter((k) => FURN[k][3].startsWith(cat)), ...ks.filter((k) => !FURN[k][3].startsWith(cat))];
};
/* Furniture that stands against a wall: it turns its back to the wall and follows the wall. */
const WALLF = new Set(["sofa", "corner", "chaise", "tvbench", "sideboard", "shelf", "piano", "base", "sinkc", "hobc", "dishc", "ovenc", "fridgec", "tall", "wallc", "counter", "bed2", "bed1", "nightstand", "wardrobe", "dresser", "vanity", "bunk", "crib", "desk", "toybox", "playk", "tub", "toilet", "sink", "vanityb", "mirror", "towel", "wm", "td", "tower", "usink", "rack", "clean", "hooks", "shoes", "mirrorw", "standd", "cabinet", "work", "gshelf", "bins", "tools", "bench"]);
const ROUNDF = new Set(["tround", "plant", "pouf", "sidet", "stool", "beanbag", "ochair", "parasol", "weber", "firepit", "tramp", "tipi"]);
const LIGHTK = { ceiling: ["Loftlampe", 40], pendant: ["Pendel", 45], spot: ["Spot", 12], floor: ["Gulvlampe", 45], table: ["Bordlampe", 28], wall: ["Væglampe", 25], strip: ["LED-strip", 150], rgb: ["RGBWW-pære", 16], garden: ["Havelampe", 25] };
const ROUNDL = new Set(["ceiling", "pendant", "spot", "floor", "table", "rgb", "garden"]);
const CABLE = {
  connected: ["Sat til", "#3B82F6"], waiting: ["Venter på bilen", "#8B5CF6"], charging: ["Lader op", "#22C55E"], scheduled: ["Planlagt", "#F59E0B"],
  paused: ["Pause", "#F59E0B"], complete: ["Opladet", "#10B981"], fault: ["Fejl", "#E5484D"], none: ["Ikke sat til", "#94A3B8"],
};
const PORTS = { fl: ["Foran venstre", -0.5, -0.36], fr: ["Foran højre", 0.5, -0.36], ml: ["Midt venstre", -0.5, 0], mr: ["Midt højre", 0.5, 0], bl: ["Bag venstre", -0.5, 0.36], br: ["Bag højre", 0.5, 0.36], front: ["Front", 0, -0.5], rear: ["Bag", 0, 0.5] };
const LCOLS = ["#FFD98A", "#FFF3D6", "#FF6B6B", "#F59E0B", "#22C55E", "#38BDF8", "#6366F1", "#EC4899"];
const CARCOLS = ["#F2F2F2", "#C9CED6", "#6B7280", "#1F2937", "#B91C1C", "#1D4ED8", "#0F766E"];
const AREAK = { lawn: "Græs", tiles: "Fliser", deck: "Terrasse", bed: "Bed", drive: "Indkørsel", gravel: "Grus" };
const XTOOLS = { tvset: ["TV-skærm", "tv"], spkbox: ["Højttaler", "speaker"], soundbar: ["Soundbar", "speaker"] };

export const RTYPES = [
  ["kid", "Børneværelse"], ["bed", "Soveværelse"], ["guest", "Gæsteværelse"], ["office", "Kontor"], ["living", "Stue"], ["kitchen", "Køkken"], ["bath", "Badeværelse"],
  ["smallbath", "Lille bad"], ["toilet", "Toilet"], ["utility", "Bryggers"], ["hall", "Entré og gang"], ["walkin", "Walk-in"], ["garage", "Garage"], ["other", "Andet rum"],
];
export const AGES = [["baby", "Baby", "0–1 år"], ["toddler", "Tumling", "1–3 år"], ["child", "Barn", "4–7 år"], ["bigchild", "Stort barn", "8–10 år"], ["preteen", "Preteen", "11–12 år"], ["teen", "Teenager", "13–16 år"], ["young", "Ung", "17+ år"]];
export const GSTYLES = [["neutral", "Neutral"], ["pige", "Pige"], ["dreng", "Dreng"]];

/* A room's type from its name, in Danish and English. */
export function guessType(name) {
  const n = String(name || "").toLowerCase();
  if (/køkken|kokken|kitchen|alrum/.test(n)) return "kitchen";
  if (/stue|opholds|living|lounge|dagligstue/.test(n)) return "living";
  if (/sove|bedroom|master/.test(n)) return "bed";
  if (/gæstebad|gaestebad|lille bad|small bath|half bath/.test(n)) return "smallbath";
  if (/bad|bath/.test(n)) return "bath";
  if (/toilet|\bwc\b|lavatory/.test(n)) return "toilet";
  if (/gæste|gaeste|guest/.test(n)) return "guest";
  if (/kontor|office|study|arbejds/.test(n)) return "office";
  if (/bryggers|vask|laundry|utility|værksted|vaerksted|teknik|viktualie|depot|pantry|storage/.test(n)) return "utility";
  if (/entr|gang|hall|corridor|vindfang/.test(n)) return "hall";
  if (/walk/.test(n)) return "walkin";
  if (/garage|carport/.test(n)) return "garage";
  if (/børne|borne|barn|kid|child|nursery|teen|værelse|vaerelse|room/.test(n)) return "kid";
  return "other";
}
const OUTDOOR = /have|garden|terrasse|terrace|patio|indkørsel|indkorsel|driveway|gård|gaard|yard|altan|balcony|udendørs|outdoor|carport/i;

/* "Komplet møblering": furniture per room type. [kind, fx, fy, rot] in fractions of the room. */
const FURNSET = {
  living: [["furn:rug", 0.5, 0.55, 0], ["furn:sofa", 0.5, 0.86, 180], ["furn:table", 0.5, 0.55, 0], ["furn:arm", 0.13, 0.55, 90], ["furn:tvbench", 0.5, 0.08, 0], ["tvset", 0.5, 0.05, 0], ["furn:plant", 0.92, 0.12, 0], ["light:floor", 0.88, 0.86, 0], ["light:pendant", 0.5, 0.55, 0]],
  kitchen: [["furn:counter", 0.5, 0.08, 0], ["furn:island", 0.5, 0.42, 0], ["furn:table", 0.5, 0.8, 0], ["furn:chair", 0.38, 0.66, 0], ["furn:chair", 0.62, 0.66, 0], ["furn:chair", 0.38, 0.94, 180], ["furn:chair", 0.62, 0.94, 180], ["light:pendant", 0.5, 0.8, 0], ["light:spot", 0.3, 0.3, 0], ["light:spot", 0.7, 0.3, 0]],
  bed: [["furn:bed2", 0.5, 0.36, 0], ["furn:dresser", 0.5, 0.93, 180], ["furn:wardrobe", 0.12, 0.08, 0], ["light:table", 0.2, 0.12, 0], ["light:table", 0.8, 0.12, 0], ["light:ceiling", 0.5, 0.6, 0]],
  guest: [["furn:bed2", 0.5, 0.36, 0], ["furn:dresser", 0.85, 0.92, 180], ["light:ceiling", 0.5, 0.65, 0]],
  kid: [["furn:bed1", 0.16, 0.36, 0], ["furn:desk", 0.75, 0.08, 0], ["furn:chair", 0.75, 0.22, 180], ["furn:shelf", 0.82, 0.93, 180], ["furn:rug", 0.55, 0.6, 0], ["light:rgb", 0.16, 0.08, 0], ["light:ceiling", 0.55, 0.55, 0]],
  office: [["furn:desk", 0.5, 0.1, 0], ["furn:chair", 0.5, 0.26, 180], ["furn:shelf", 0.92, 0.5, 90], ["furn:plant", 0.1, 0.88, 0], ["light:ceiling", 0.5, 0.55, 0]],
  bath: [["furn:tub", 0.5, 0.12, 0], ["furn:toilet", 0.1, 0.78, 90], ["furn:sink", 0.5, 0.92, 180], ["furn:shower", 0.86, 0.82, 0], ["light:spot", 0.5, 0.5, 0]],
  smallbath: [["furn:shower", 0.78, 0.22, 0], ["furn:toilet", 0.22, 0.18, 0], ["furn:sink", 0.5, 0.9, 180], ["light:spot", 0.5, 0.55, 0]],
  toilet: [["furn:toilet", 0.5, 0.2, 0], ["furn:sink", 0.5, 0.9, 180], ["light:spot", 0.5, 0.55, 0]],
  utility: [["furn:counter", 0.5, 0.08, 0], ["furn:shelf", 0.5, 0.93, 180], ["light:ceiling", 0.5, 0.5, 0]],
  hall: [["furn:rug", 0.5, 0.5, 0], ["furn:shelf", 0.5, 0.08, 0], ["light:spot", 0.5, 0.5, 0]],
  walkin: [["furn:wardrobe", 0.3, 0.1, 0], ["furn:wardrobe", 0.7, 0.1, 0], ["furn:wardrobe", 0.5, 0.9, 180], ["light:spot", 0.5, 0.5, 0]],
  garage: [["furn:shelf", 0.5, 0.06, 0], ["light:ceiling", 0.5, 0.5, 0]],
  other: [["furn:rug", 0.5, 0.5, 0], ["light:ceiling", 0.5, 0.5, 0]],
};

/* ------------------------------------------------------------------ geometry */
const clone = (o) => JSON.parse(JSON.stringify(o));
const f1 = (v) => (+v).toFixed(1);
const tt = (x) => String(x || "").split(":")[0];
const rotP = (it, lx, ly) => {
  const a = ((it.rot || 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [it.x + lx * c - ly * s, it.y + lx * s + ly * c];
};
const pip = ([x, y], poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const roomAt = (H, x, y) => H.rooms.find((r) => r.pts && pip([x, y], r.pts));
const centroid = (p) => [p.reduce((a, q) => a + q[0], 0) / p.length, p.reduce((a, q) => a + q[1], 0) / p.length];
const bbox = (p) => {
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
const isObj = (it) => OBJ.has(it.type) || ((it.type === "tv" || it.type === "speaker") && !!it.w);
const isRoundObj = (o) => (o.type === "furn" && ROUNDF.has(o.fk)) || (o.type === "light" && ROUNDL.has(o.lk)) || o.type === "tree" || o.type === "bush";

function normArea(a) {
  if (a.kind !== "label" && !a.pts && a.w != null) {
    a.pts = [[a.x, a.y], [a.x + a.w, a.y], [a.x + a.w, a.y + a.h], [a.x, a.y + a.h]];
    delete a.w;
    delete a.h;
  }
  return a;
}
function normHouse(H) {
  H = H && typeof H === "object" ? H : {};
  H.name = H.name || "";
  H.rooms = (H.rooms || []).filter((r) => r && Array.isArray(r.pts) && r.pts.length >= 3);
  H.walls = (H.walls || []).filter((w) => w && w.a && w.b);
  H.areas = (H.areas || []).filter(Boolean).map(normArea);
  H.items = (H.items || []).filter((i) => i && HT[i.type]);
  H.items.forEach((i) => {
    if (i.lock && i.lockOn == null) i.lockOn = 1;
    // Openings used to be either horizontal or vertical; now they have the angle of their wall.
    if (OPENING.has(i.type) && i.ang == null) {
      i.ang = i.dir === "v" ? 90 : 0;
      if (i.dir === "v") i.side = -(i.side || 1);
    }
    delete i.dir;
  });
  return H;
}
export const houseModel = (ctx) => normHouse(clone(ctx?.data?.house || {}));
export const houseEmpty = (ctx) => {
  const H = ctx?.data?.house;
  return !H || (!(H.rooms || []).length && !(H.walls || []).length);
};

function hBox(H) {
  const xs = [], ys = [];
  H.rooms.forEach((r) => r.pts.forEach((p) => (xs.push(p[0]), ys.push(p[1]))));
  H.walls.forEach((w) => (xs.push(w.a[0], w.b[0]), ys.push(w.a[1], w.b[1])));
  H.areas.forEach((a) => (a.pts || [[a.x, a.y]]).forEach((p) => (xs.push(p[0]), ys.push(p[1]))));
  H.items.forEach((i) => {
    const r = i.w && !OPENING.has(i.type) ? Math.max(i.w, i.h || 0) / 2 : 0;
    xs.push(i.x - r, i.x + r);
    ys.push(i.y - r, i.y + r);
  });
  if (!xs.length) return [0, 0, 1400, 1000];
  const p = 70, x0 = Math.min(...xs) - p, y0 = Math.min(...ys) - p;
  return [x0, y0, Math.max(...xs) + p - x0, Math.max(...ys) + p - y0];
}

/* ------------------------------------------------------------------ live states */
const OFF = new Set(["unavailable", "unknown"]);
let LV = {}; // live state per item id, only filled for the live plan
const lv = (it) => LV[it.id] || {};
const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const rgbHex = (c) => (Array.isArray(c) ? "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("") : null);
const RUN = /run|wash|dry|rins|spin|clean|mow|brew|heat|bak|cook|on$|^on|active|program|work|return|edge|spot/i;
const IDLE = /^(off|idle|standby|docked|paused|finished|end|ready|done|0|false|unavailable|unknown|charging|sleep|stopped|not_running|inactive|none)$/i;
function cableOf(state) {
  const v = String(state ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  if (!v || OFF.has(v)) return "none";
  if (/fault|error|fejl/.test(v)) return "fault";
  if (/^(charging|lader|on|true)$/.test(v) || /^charging/.test(v)) return "charging";
  if (/schedul|planned|planlagt|delay/.test(v)) return "scheduled";
  if (/pause|suspended_evse|stopped/.test(v)) return "paused";
  if (/complete|finished|full|charged|done|opladet/.test(v)) return "complete";
  if (/waiting|awaiting|suspended_ev|ready/.test(v)) return "waiting";
  if (/connect|plugged|occupied/.test(v) && !/disconnect|not_/.test(v)) return "connected";
  return "none";
}
function liveOf(it) {
  const g = (id) => (id ? C.st(id) : null);
  const appl = it.appl && (C.data?.appliances || []).find((a) => a.id === it.appl);
  const ent = it.ent || appl?.entity || "";
  const s = g(ent), v = s?.state, a = s?.attributes || {};
  const L = { s, ent, off: !!s && OFF.has(v), missing: !!ent && !s };
  switch (it.type) {
    case "door":
    case "window":
      L.open = v === "on" || v === "open" || v === "opening";
      if (it.lockOn && it.lock) {
        const l = g(it.lock);
        L.lockState = l?.state;
        L.locked = l?.state === "locked";
      }
      break;
    case "port":
      L.open = ["open", "opening", "closing", "on"].includes(v);
      L.moving = v === "opening" || v === "closing";
      break;
    case "motion":
      L.live = v === "on";
      break;
    case "smoke":
    case "leak":
      L.alarm = v === "on";
      break;
    case "speaker":
    case "tv":
      L.play = v === "playing";
      L.on = !!v && !["off", "standby", "unavailable", "unknown"].includes(v);
      L.title = a.media_title || "";
      L.artist = a.media_artist || a.app_name || "";
      L.pic = a.entity_picture || "";
      L.vol = a.volume_level != null ? Math.round(a.volume_level * 100) : null;
      break;
    case "lamp":
    case "light":
      L.on = v === "on";
      L.bri = a.brightness != null ? Math.max(1, Math.round((a.brightness / 255) * 100)) : L.on ? 100 : 0;
      L.color = rgbHex(a.rgb_color);
      L.rgb = (a.supported_color_modes || []).some((m) => ["rgb", "rgbw", "rgbww", "hs", "xy"].includes(m));
      L.fx = !!a.effect && !/^(none|off|solid)$/i.test(a.effect);
      L.dim = (a.supported_color_modes || []).some((m) => m !== "onoff");
      break;
    case "temp":
      L.val = it.ent?.startsWith("climate.") ? a.current_temperature : num(v);
      break;
    case "ap":
      L.val = v;
      break;
    case "car": {
      const pres = g(it.presence);
      L.home = !it.presence || ["home", "on", "true", "hjemme"].includes(String(pres?.state).toLowerCase());
      const bat = g(it.battery);
      L.soc = bat ? num(bat.state) : null;
      const plug = g(it.plug);
      L.cable = plug ? cableOf(plug.state) : it.plug ? "none" : null;
      // A car EV Planner knows (same name): its charge level and status, when the drawing has none of its own.
      const ev = !it.battery || !it.plug ? evCar(it) : null;
      if (ev) {
        if (L.soc == null && ev.attributes.soc != null) L.soc = num(ev.attributes.soc);
        if (L.cable == null) L.cable = ev.attributes.connected === false || ev.state === "unplugged" ? "none" : cableOf(ev.state === "connected" ? "connected" : ev.state);
        L.ev = ev.entity_id;
      }
      if (it.lock) {
        L.lockState = g(it.lock)?.state;
        L.locked = L.lockState === "locked";
      }
      break;
    }
    case "solar":
      L.val = num(v);
      L.unit = a.unit_of_measurement || "";
      break;
    case "battery":
      L.soc = num(v);
      break;
    case "charger":
      L.val = v;
      break;
  }
  if (APK.has(it.type)) {
    const dom = ent.split(".")[0];
    L.text = s ? (C.hass.formatEntityState ? C.hass.formatEntityState(s) : v) : "";
    if (dom === "vacuum") L.run = ["cleaning", "returning"].includes(v);
    else if (dom === "lawn_mower") L.run = v === "mowing" || v === "returning";
    else L.run = !!v && !IDLE.test(v) && (RUN.test(v) || (num(v) != null && num(v) > 5)) && (!/^on$/i.test(v) || it.type === "coffee");
    L.temp = applTemp(appl, ent);
    // The Apparater page's own reading of the appliance (its status and facts), when it shares it.
    if (appl && typeof Appl.status === "function") {
      try {
        const st = Appl.status(C, appl);
        L.text = st.txt;
        L.run = st.key === "run";
        if (typeof Appl.details === "function") {
          const x = Appl.details(C, appl);
          L.facts = [...(L.run && x.left != null ? [[t("Tid"), `${Math.round(x.left)} min`]] : []), ...(x.facts || [])];
        }
      } catch (err) {
        /* the plan still shows the raw state */
      }
    }
  }
  return L;
}
/* The status sensor of a car in EV Planner with the same name as the drawn car. */
function evCar(it) {
  const ents = C?.hass?.entities || {};
  const want = String(it.name || "").toLowerCase().replace(/[^a-z0-9æøå]+/g, "");
  if (!want) return null;
  for (const [id, e] of Object.entries(ents)) {
    if (e.platform !== "ev_planner" || !/^sensor\..+_status$/.test(id) || id.startsWith("sensor.guest")) continue;
    const s = C.st(id);
    const dev = e.device_id && C.hass.devices?.[e.device_id];
    const name = String(dev?.name_by_user || dev?.name || s?.attributes?.friendly_name || "").toLowerCase().replace(/\s*status$/, "").replace(/[^a-z0-9æøå]+/g, "");
    if (s && name && (name === want || name.includes(want) || want.includes(name))) return s;
  }
  return null;
}
/* A fridge's or oven's temperature: a temperature sensor among the appliance's linked entities. */
function applTemp(appl, ent) {
  const ids = [...(appl?.controls || []), ent];
  for (const id of ids) {
    const s = id && C.hass.states[id];
    if (s && (s.attributes.device_class === "temperature" || id.startsWith("climate.")) && num(s.attributes.current_temperature ?? s.state) != null) return num(s.attributes.current_temperature ?? s.state);
  }
  return null;
}
const sunUp = () => (C?.hass?.states?.["sun.sun"]?.attributes?.elevation ?? 10) > 0;
function lastText(s) {
  if (!s?.last_changed) return "";
  const d = new Date(s.last_changed);
  return `${C.fmt.rel(d)} ${C.fmt.time(d)}`;
}

function hState(it) {
  const L = lv(it);
  if (L.missing) return [t("Findes ikke i Home Assistant"), "warn"];
  if (L.off) return [t("Svarer ikke"), "off"];
  switch (it.type) {
    case "door":
    case "window":
      if (!L.ent) return [t("Ikke koblet"), "warn"];
      return L.open ? [it.type === "door" ? t("Åben") : t("Åbent"), "bad"] : [t("Lukket"), "ok"];
    case "port":
      if (!L.ent) return [t("Ikke koblet"), "warn"];
      return L.moving ? [t("Kører"), "play"] : L.open ? [t("Åben"), "bad"] : [t("Lukket"), "ok"];
    case "camera":
      return L.ent ? [t("Live"), "ok"] : [t("Ikke koblet"), "warn"];
    case "motion":
      if (!L.ent) return [t("Ikke koblet"), "warn"];
      return L.live ? [t("Bevægelse nu"), "live"] : [t("Rolig · sidst {when}", { when: lastText(L.s) }), ""];
    case "smoke":
      if (!L.ent) return [t("Ikke koblet"), "warn"];
      return L.alarm ? [t("Røg registreret"), "bad"] : [t("OK · ingen røg"), "ok"];
    case "leak":
      if (!L.ent) return [t("Ikke koblet"), "warn"];
      return L.alarm ? [t("Vand registreret"), "bad"] : [t("Tørt"), "ok"];
    case "speaker":
      if (!L.ent) return [t("Ikke koblet til en højttaler"), "warn"];
      return L.play ? [t("Spiller {title}", { title: L.title }), "play"] : L.title ? [t("På pause · {title}", { title: L.title }), ""] : [t("Ledig"), ""];
    case "tv":
      if (!L.ent) return [t("Ikke koblet"), "warn"];
      return L.on ? [L.title ? t("Tændt · {title}", { title: L.title }) : t("Tændt"), "play"] : [t("Slukket"), ""];
    case "lamp":
    case "light":
      if (!L.ent) return it.type === "light" ? [t("Ikke koblet"), ""] : [t("Ikke koblet"), "warn"];
      return L.on ? [t("Tændt · {n} %", { n: L.bri }), "lit"] : [t("Slukket"), ""];
    case "temp":
      return L.val != null ? [`${C.fmt.num(L.val, 1)}°`, ""] : [t("Ikke koblet"), "warn"];
    case "ap": {
      if (!L.ent) return [t("Ikke koblet"), "warn"];
      // UniFi and friends: the number of devices on the access point, and whether it is online.
      const base = L.ent.replace(/_(clients|state|uptime|cpu_utilization|memory_utilization)$/, "");
      const cl = C.st(L.ent.endsWith("_clients") ? L.ent : base + "_clients"), stt = C.st(base + "_state");
      const down = stt && !["connected", "online", "on"].includes(String(stt.state).toLowerCase());
      if (down) return [t("Offline"), "bad"];
      if (cl && num(cl.state) != null) return [t("Online · {n} enheder", { n: Math.round(num(cl.state)) }), "ok"];
      return [C.hass.formatEntityState ? C.hass.formatEntityState(L.s) : String(L.val), "ok"];
    }
    case "car":
      if (!L.home) return [t("Ude"), ""];
      if (L.cable) return [`${t(CABLE[L.cable][0])}${L.soc != null ? ` · ${Math.round(L.soc)} %` : ""}`, L.cable === "charging" ? "play" : L.cable === "fault" ? "off" : "ok"];
      return [L.soc != null ? `${Math.round(L.soc)} %` : t("Hjemme"), "ok"];
    case "charger": {
      const st = chargerState(it);
      return [t(CABLE[st][0]), st === "charging" ? "play" : st === "fault" ? "off" : "ok"];
    }
    case "solar":
      if (!L.ent) return [sunUp() ? t("Solen skinner") : t("Ingen sol lige nu"), ""];
      return L.val ? [t("Producerer {v} {u}", { v: C.fmt.num(L.val, 1), u: L.unit }), "play"] : [t("Ingen produktion lige nu"), ""];
    case "battery":
      return L.soc != null ? [`${Math.round(L.soc)} %`, "ok"] : [t("Ikke koblet"), ""];
    case "furn":
    case "tree":
    case "bush":
      return ["", ""];
  }
  if (APK.has(it.type)) {
    if (!L.ent) return [t("Ikke koblet"), "warn"];
    return [L.text || "", L.run ? "play" : "ok"];
  }
  return ["", ""];
}

/* ------------------------------------------------------------------ drawing: objects */
function furnSvg(k, w, h) {
  const W = w / 2, Hh = h / 2, rep = (n, fn) => Array.from({ length: n }, (_, i) => fn(i, n)).join("");
  const R = (x, y, ww, hh, rx, c) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, ww))}" height="${f1(Math.max(0, hh))}" rx="${rx}" class="${c}"/>`;
  switch (k) {
    case "sofa":
    case "arm": {
      const b = h * 0.3, a = Math.min(w * 0.14, 16), n = k === "sofa" ? 3 : 1, cw = (w - 2 * a) / n;
      return R(-W, -Hh, w, h, 7, "fu-fab") + R(-W, -Hh, w, b, 6, "fu-fab2") + R(-W, -Hh, a, h, 6, "fu-fab2") + R(W - a, -Hh, a, h, 6, "fu-fab2") + Array.from({ length: n }, (_, i) => R(-W + a + i * cw + 1.5, -Hh + b + 1.5, cw - 3, h - b - 3, 5, "fu-cush")).join("");
    }
    case "bed2":
    case "bed1":
    case "crib": {
      const pil = k === "bed2" ? 2 : 1, pw = (w - 10) / pil;
      return (
        R(-W, -Hh, w, h, 4, "fu-wood") + R(-W + 3, -Hh + 3, w - 6, h - 6, 4, "fu-sheet") + Array.from({ length: pil }, (_, i) => R(-W + 5 + i * pw + 1, -Hh + 6, pw - 2, h * 0.14, 5, "fu-pillow")).join("") +
        R(-W + 3, -Hh + h * 0.3, w - 6, h * 0.7 - 3, 4, "fu-duvet") + `<path d="M${-W + 3} ${f1(-Hh + h * 0.3 + 8)} H${W - 3}" class="fu-fold"/>` +
        (k === "crib" ? Array.from({ length: Math.floor(h / 8) }, (_, i) => `<path d="M${-W} ${f1(-Hh + i * 8)} h3 M${W - 3} ${f1(-Hh + i * 8)} h3" class="fu-bar"/>`).join("") : "")
      );
    }
    case "table":
      return R(-W, -Hh, w, h, 4, "fu-wood") + `<path d="M${-W + 6} ${-Hh + 6} H${W - 6}" class="fu-grain"/>`;
    case "tround":
      return `<circle r="${W}" class="fu-wood"/><circle r="${W * 0.6}" class="fu-grain"/>`;
    case "chair":
      return R(-W, -Hh + h * 0.22, w, h * 0.78, 5, "fu-seat") + R(-W, -Hh, w, h * 0.22, 3, "fu-wood");
    case "desk":
      return R(-W, -Hh, w, h, 3, "fu-wood") + R(-w * 0.18, -Hh + 3, w * 0.36, 4, 2, "fu-dark");
    case "wardrobe":
    case "dresser":
    case "shelf": {
      const n = Math.max(2, Math.round(w / (k === "shelf" ? 24 : 36)));
      return (
        R(-W, -Hh, w, h, 2, k === "shelf" ? "fu-wood" : "fu-wood2") +
        Array.from({ length: n - 1 }, (_, i) => `<path d="M${f1(-W + ((i + 1) * w) / n)} ${-Hh} V${Hh}" class="fu-ln"/>`).join("") +
        (k !== "shelf" ? Array.from({ length: n }, (_, i) => `<circle cx="${f1(-W + ((i + 0.5) * w) / n)}" cy="${f1(Hh - 4)}" r="1.6" class="fu-knob"/>`).join("") : "")
      );
    }
    case "counter":
      return R(-W, -Hh, w, h, 2, "fu-stone") + `<path d="M${-W} ${f1(Hh - 4)} H${W}" class="fu-ln"/>` + R(-w * 0.12, -Hh + 6, w * 0.16, h * 0.55, 4, "fu-steel");
    case "island":
      return R(-W, -Hh, w, h, 6, "fu-stone") + R(-W + 4, -Hh + 4, w - 8, h - 8, 4, "fu-stone2");
    case "tvbench":
      return R(-W, -Hh, w, h, 3, "fu-wood2") + `<path d="M${f1(-w / 6)} ${-Hh} V${Hh} M${f1(w / 6)} ${-Hh} V${Hh}" class="fu-ln"/>`;
    case "tub":
      return R(-W, -Hh, w, h, Math.min(w, h) * 0.3, "fu-white") + R(-W + 6, -Hh + 6, w - 12, h - 12, Math.min(w, h) * 0.26, "fu-water") + `<circle cx="${f1(W - 14)}" cy="0" r="2.5" class="fu-knob"/>`;
    case "shower":
      return R(-W, -Hh, w, h, 3, "fu-tile") + `<path d="M${-W} ${-Hh} L${W} ${Hh} M${W} ${-Hh} L${-W} ${Hh}" class="fu-ln"/><circle r="3" class="fu-knob"/>`;
    case "toilet":
      return R(-W, -Hh, w, h * 0.28, 3, "fu-white") + `<ellipse cx="0" cy="${f1(h * 0.14)}" rx="${f1(W * 0.92)}" ry="${f1(h * 0.34)}" class="fu-white"/><ellipse cx="0" cy="${f1(h * 0.17)}" rx="${f1(W * 0.55)}" ry="${f1(h * 0.22)}" class="fu-water"/>`;
    case "sink":
      return R(-W, -Hh, w, h, 4, "fu-white") + `<ellipse cx="0" cy="${f1(h * 0.08)}" rx="${f1(W * 0.7)}" ry="${f1(Hh * 0.62)}" class="fu-water"/><circle cx="0" cy="${f1(-Hh + 5)}" r="2" class="fu-knob"/>`;
    case "corner": {
      const b = Math.min(h, w) * 0.2, a = w * 0.36, sh = h * 0.42;
      return `<path d="M${-W} ${-Hh} H${W} V${f1(-Hh + sh)} H${f1(-W + a)} V${Hh} H${-W} Z" class="fu-fab"/>` + R(-W, -Hh, w, b, 6, "fu-fab2") + R(-W, -Hh, b, h, 6, "fu-fab2") +
        [0.3, 0.55, 0.8].map((x) => R(-W + w * x - w * 0.11, -Hh + b + 2, w * 0.22, sh - b - 4, 5, "fu-cush")).join("") + R(-W + b + 2, -Hh + sh + 2, a - b - 4, h - sh - 6, 5, "fu-cush");
    }
    case "chaise": {
      const b = h * 0.18, sh = h * 0.58, cw = w * 0.32;
      return R(-W, -Hh, w, sh, 7, "fu-fab") + R(W - cw, -Hh, cw, h, 7, "fu-fab") + R(-W, -Hh, w, b, 6, "fu-fab2") + R(-W, -Hh, w * 0.06, sh, 5, "fu-fab2") +
        [0, 1].map((i) => R(-W + w * 0.07 + i * (w - cw - w * 0.07) / 2 + 1.5, -Hh + b + 2, (w - cw - w * 0.07) / 2 - 3, sh - b - 4, 5, "fu-cush")).join("") + R(W - cw + 2, -Hh + b + 2, cw - 4, h - b - 4, 6, "fu-cush");
    }
    case "pouf":
      return `<circle r="${W}" class="fu-fab"/><circle r="${W * 0.6}" class="fu-cush"/>`;
    case "beanbag":
      return `<path d="M${-W * 0.9} ${f1(Hh * 0.2)} C${-W} ${-Hh} ${W} ${-Hh * 1.05} ${W * 0.95} ${f1(Hh * 0.1)} C${W * 0.9} ${Hh} ${-W * 0.8} ${Hh} ${-W * 0.9} ${f1(Hh * 0.2)}Z" class="fu-fab"/><ellipse cx="0" cy="${f1(Hh * 0.18)}" rx="${f1(W * 0.5)}" ry="${f1(Hh * 0.38)}" class="fu-cush"/>`;
    case "sidet":
      return `<circle r="${W}" class="fu-wood"/><circle r="${W * 0.55}" class="fu-grain"/>`;
    case "coffee":
      return R(-W, -Hh, w, h, Math.min(h, 14), "fu-wood") + `<path d="M${-W + 10} 0 H${W - 10}" class="fu-grain"/>`;
    case "sideboard":
    case "nightstand":
    case "cabinet": {
      const n = k === "sideboard" ? 3 : 1;
      return R(-W, -Hh, w, h, 3, k === "cabinet" ? "fu-steel" : "fu-wood2") + Array.from({ length: n - 1 }, (_, i) => `<path d="M${f1(-W + ((i + 1) * w) / n)} ${-Hh} V${Hh}" class="fu-ln"/>`).join("") +
        (k === "cabinet" ? [0.3, 0.55, 0.8].map((y) => `<path d="M${-W + 4} ${f1(-Hh + h * y)} H${W - 4}" class="fu-ln"/>`).join("") : Array.from({ length: n }, (_, i) => `<circle cx="${f1(-W + ((i + 0.5) * w) / n)}" cy="${f1(Hh - 4)}" r="1.8" class="fu-knob"/>`).join(""));
    }
    case "piano":
      return R(-W, -Hh, w, h, 4, "fu-dark") + R(-W + 4, Hh - h * 0.32, w - 8, h * 0.28, 2, "fu-white") + Array.from({ length: Math.floor((w - 8) / 6) }, (_, i) => `<path d="M${f1(-W + 4 + i * 6)} ${f1(Hh - h * 0.32)} v${f1(h * 0.16)}" class="fu-keys"/>`).join("");
    case "stove":
      return R(-W, -Hh, w, h, 8, "fu-dark") + `<circle cy="${f1(Hh * 0.15)}" r="${f1(Math.min(W, Hh) * 0.55)}" class="fu-fire"/>`;
    case "base":
    case "tall":
    case "clean":
      return R(-W, -Hh, w, h, 2, k === "base" ? "fu-stone" : "fu-white") + `<path d="M${-W} ${f1(Hh - 4)} H${W}" class="fu-ln"/>` + (k === "base" ? "" : `<path d="M0 ${-Hh + 3} V${Hh - 6}" class="fu-ln"/>`) + `<circle cx="${f1(k === "base" ? 0 : -4)}" cy="${f1(Hh - 7)}" r="1.6" class="fu-knob"/>`;
    case "wallc":
      return R(-W, -Hh, w, h, 2, "fu-dash") + `<path d="M${-W} ${-Hh} L${W} ${Hh} M${W} ${-Hh} L${-W} ${Hh}" class="fu-dashln"/>`;
    case "sinkc":
    case "usink":
      return R(-W, -Hh, w, h, 2, k === "usink" ? "fu-steel" : "fu-stone") + R(-W * 0.72, -Hh * 0.55, W * 1.44, Hh * 1.3, 6, "fu-basin") + `<circle cx="0" cy="${f1(-Hh + 6)}" r="2.6" class="fu-knob"/>`;
    case "hobc":
      return R(-W, -Hh, w, h, 2, "fu-stone") + R(-W + 4, -Hh + 4, w - 8, h - 8, 3, "fu-glassd") + [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => `<circle cx="${f1(a * W * 0.42)}" cy="${f1(b * Hh * 0.42)}" r="${f1(Math.min(W, Hh) * (a * b > 0 ? 0.34 : 0.26))}" class="fu-ring"/>`).join("");
    case "dishc":
      return R(-W, -Hh, w, h, 2, "fu-stone") + R(-W + 3, Hh - 10, w - 6, 7, 2, "fu-steel") + `<path d="M${-W + 8} ${f1(-Hh + h * 0.3)} H${W - 8} M${-W + 8} ${f1(-Hh + h * 0.5)} H${W - 8}" class="fu-ln"/>`;
    case "ovenc":
      return R(-W, -Hh, w, h, 2, "fu-white") + R(-W + 4, Hh - h * 0.42, w - 8, h * 0.36, 3, "fu-glassd") + `<path d="M${-W + 6} ${f1(Hh - h * 0.46)} H${W - 6}" class="fu-handle"/>`;
    case "fridgec":
      return R(-W, -Hh, w, h, 3, "fu-white") + `<path d="M${-W} ${f1(-Hh + h * 0.38)} H${W}" class="fu-ln"/><path d="M${W - 6} ${f1(-Hh + h * 0.46)} V${f1(Hh - 6)}" class="fu-handle"/>`;
    case "stool":
      return `<circle r="${W}" class="fu-seat"/><circle r="${W * 0.55}" class="fu-grain"/>`;
    case "bench":
    case "bbench":
    case "ebench":
      return R(-W, -Hh, w, h, 4, k === "bbench" ? "fu-fab" : "fu-wood") + (k === "bbench" ? R(-W + 4, -Hh + 4, w - 8, h - 8, 4, "fu-cush") : [0.33, 0.66].map((y) => `<path d="M${-W + 3} ${f1(-Hh + h * y)} H${W - 3}" class="fu-grain"/>`).join(""));
    case "vanity":
      return R(-W, -Hh, w, h, 3, "fu-wood2") + R(-W * 0.6, -Hh, W * 1.2, 4, 1, "fu-glass") + `<circle cx="${f1(W * 0.6)}" cy="${f1(Hh - 5)}" r="1.8" class="fu-knob"/>`;
    case "bunk":
      return R(-W, -Hh, w, h, 4, "fu-wood") + R(-W + 3, -Hh + 3, w - 6, h - 6, 4, "fu-sheet") + R(-W + 5, -Hh + 6, w - 10, h * 0.13, 5, "fu-pillow") + R(-W + 3, -Hh + h * 0.3, w - 6, h * 0.7 - 3, 4, "fu-duvet2") +
        R(-W - 3, -Hh + h * 0.55, 6, h * 0.3, 2, "fu-wood") + [0.6, 0.68, 0.76].map((y) => `<path d="M${-W - 3} ${f1(-Hh + h * y)} h6" class="fu-ln"/>`).join("") + R(-W + 2, -Hh + 2, w - 4, h - 4, 4, "fu-dash");
    case "toybox":
      return R(-W, -Hh, w, h, 5, "fu-toy") + `<path d="M${-W + 4} ${f1(-Hh + h * 0.35)} H${W - 4}" class="fu-ln"/>` + `<circle cx="${f1(-W * 0.4)}" cy="${f1(Hh * 0.25)}" r="3" class="fu-dot1"/><circle cx="${f1(W * 0.3)}" cy="${f1(Hh * 0.3)}" r="3" class="fu-dot2"/>`;
    case "playk":
      return R(-W, -Hh, w, h, 3, "fu-white") + `<circle cx="${f1(-W * 0.45)}" cy="0" r="${f1(Hh * 0.45)}" class="fu-ring"/><circle cx="${f1(-W * 0.1)}" cy="0" r="${f1(Hh * 0.35)}" class="fu-ring"/>` + R(W * 0.2, -Hh * 0.5, W * 0.65, Hh, 3, "fu-basin");
    case "tipi": {
      const n = 6, pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return `${f1(Math.cos(a) * W)},${f1(Math.sin(a) * W)}`; }).join(" ");
      return `<polygon points="${pts}" class="fu-tent"/>` + Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return `<path d="M0 0 L${f1(Math.cos(a) * W)} ${f1(Math.sin(a) * W)}" class="fu-ln"/>`; }).join("") + `<circle r="${f1(W * 0.12)}" class="fu-wood"/>`;
    }
    case "vanityb":
      return R(-W, -Hh, w, h, 4, "fu-wood2") + `<ellipse cx="0" cy="${f1(Hh * 0.1)}" rx="${f1(W * 0.62)}" ry="${f1(Hh * 0.55)}" class="fu-white"/><ellipse cx="0" cy="${f1(Hh * 0.14)}" rx="${f1(W * 0.45)}" ry="${f1(Hh * 0.36)}" class="fu-water"/><circle cx="0" cy="${f1(-Hh + 5)}" r="2" class="fu-knob"/>`;
    case "mirror":
    case "mirrorw":
      return R(-W, -Hh, w, h, 2, "fu-glass") + `<path d="M${f1(-W * 0.6)} ${f1(Hh * 0.6)} L${f1(-W * 0.2)} ${f1(-Hh * 0.6)}" class="fu-shine"/>`;
    case "towel":
    case "hooks":
    case "tools":
      return R(-W, -Hh, w, h, 3, k === "towel" ? "fu-steel" : "fu-wood") + rep(Math.max(2, Math.floor(w / 14)), (i, n) => `<circle cx="${f1(-W + ((i + 0.5) * w) / n)}" cy="0" r="${f1(Math.min(2.6, h * 0.3))}" class="fu-knob"/>`);
    case "wm":
    case "td":
      return R(-W, -Hh, w, h, 4, "fu-white") + R(-W + 3, -Hh + 3, w - 6, h * 0.16, 2, "fu-panel") + `<circle cx="0" cy="${f1(h * 0.08)}" r="${f1(Math.min(W, Hh) * 0.62)}" class="fu-steel"/><circle cx="0" cy="${f1(h * 0.08)}" r="${f1(Math.min(W, Hh) * 0.45)}" class="${k === "wm" ? "fu-water" : "fu-glassd"}"/>`;
    case "tower":
      return R(-W, -Hh, w, h, 4, "fu-white") + `<circle cx="0" cy="0" r="${f1(Math.min(W, Hh) * 0.55)}" class="fu-steel"/><circle cx="0" cy="0" r="${f1(Math.min(W, Hh) * 0.36)}" class="fu-water"/>` + R(-W + 3, -Hh + 3, w - 6, 5, 2, "fu-panel") + R(-W + 3, Hh - 8, w - 6, 5, 2, "fu-panel");
    case "rack":
      return R(-W, -Hh, w, h, 3, "fu-frame") + rep(Math.max(3, Math.floor(w / 14)), (i, n) => `<path d="M${f1(-W + ((i + 1) * w) / (n + 1))} ${-Hh + 2} V${Hh - 2}" class="fu-rod"/>`);
    case "shoes":
      return R(-W, -Hh, w, h, 3, "fu-wood2") + rep(Math.max(2, Math.floor(w / 22)), (i, n) => `<ellipse cx="${f1(-W + ((i + 0.5) * w) / n)}" cy="${f1(Hh * 0.1)}" rx="${f1(w / n / 2.8)}" ry="${f1(Hh * 0.55)}" class="fu-shoe"/>`);
    case "standd":
      return R(-W, -Hh, w, h, 4, "fu-wood") + R(-w * 0.2, -Hh + 4, w * 0.4, 5, 2, "fu-dark") + R(-w * 0.12, -Hh + h * 0.5, w * 0.24, h * 0.18, 3, "fu-panel") + `<path d="M${f1(-W + 10)} ${-Hh} V${Hh} M${f1(W - 10)} ${-Hh} V${Hh}" class="fu-rod"/>`;
    case "ochair":
      return `<circle r="${W}" class="fu-frame"/>` + [0, 72, 144, 216, 288].map((d) => `<path d="M0 0 L${f1(Math.cos((d * Math.PI) / 180) * W * 0.95)} ${f1(Math.sin((d * Math.PI) / 180) * W * 0.95)}" class="fu-rod"/>`).join("") + `<circle r="${f1(W * 0.62)}" class="fu-fab"/><path d="M${f1(-W * 0.6)} ${f1(-W * 0.55)} Q0 ${f1(-W * 0.95)} ${f1(W * 0.6)} ${f1(-W * 0.55)}" class="fu-back"/>`;
    case "work":
      return R(-W, -Hh, w, h, 3, "fu-wood") + `<path d="M${-W + 6} ${f1(-Hh + h * 0.35)} H${W - 6} M${-W + 6} ${f1(-Hh + h * 0.65)} H${W - 6}" class="fu-grain"/>` + R(W - 22, Hh - 14, 18, 12, 2, "fu-steel");
    case "gshelf":
      return R(-W, -Hh, w, h, 2, "fu-steel") + rep(Math.max(2, Math.round(w / 40)), (i, n) => R(-W + 4 + (i * (w - 8)) / n, -Hh + 4, (w - 8) / n - 4, h - 8, 2, i % 2 ? "fu-box2" : "fu-box"));
    case "bike": {
      const r = Math.min(Hh * 0.9, w * 0.17);
      return `<circle cx="${f1(-W + r + 2)}" cy="0" r="${f1(r)}" class="fu-wheel"/><circle cx="${f1(W - r - 2)}" cy="0" r="${f1(r)}" class="fu-wheel"/><path d="M${f1(-W + r + 2)} 0 L${f1(-w * 0.05)} ${f1(-r * 0.5)} L${f1(W - r - 2)} 0 M${f1(-w * 0.05)} ${f1(-r * 0.5)} L${f1(w * 0.12)} ${f1(-r * 0.9)}" class="fu-bikef"/>`;
    }
    case "bins":
      return ["#3F7F3A", "#334155", "#2F6FD6"].map((c, i) => R(-W + (i * w) / 3 + 2, -Hh + 2, w / 3 - 4, h - 4, 5, "fu-bin") .replace("/>", ` style="fill:${c}"/>`) + R(-W + (i * w) / 3 + 2, -Hh + 2, w / 3 - 4, 8, 3, "fu-lid")).join("");
    case "gset": {
      const tw = w * 0.62, th = h * 0.5;
      const ch = [[-0.3, -1], [0, -1], [0.3, -1], [-0.3, 1], [0, 1], [0.3, 1]].map(([a, b]) => R(a * tw - 11, b * (th / 2 + 14) - 11, 22, 22, 5, "fu-rattan")).join("");
      return ch + R(-tw / 2, -th / 2, tw, th, 5, "fu-teak") + [0.25, 0.5, 0.75].map((x) => `<path d="M${f1(-tw / 2 + tw * x)} ${f1(-th / 2 + 3)} V${f1(th / 2 - 3)}" class="fu-grain"/>`).join("");
    }
    case "gtable":
      return R(-W, -Hh, w, h, 5, "fu-teak") + Array.from({ length: 5 }, (_, i) => `<path d="M${f1(-W + ((i + 1) * w) / 6)} ${-Hh + 3} V${Hh - 3}" class="fu-grain"/>`).join("");
    case "lounge": {
      const b = Math.min(w, h) * 0.18, a = w * 0.3, sh = h * 0.36;
      return `<path d="M${-W} ${-Hh} H${W} V${f1(-Hh + sh)} H${f1(-W + a)} V${Hh} H${-W} Z" class="fu-rattan"/>` + R(-W + b, -Hh + b, w - b - 4, sh - b - 4, 5, "fu-cushw") + R(-W + b, -Hh + sh - 4, a - b - 4, h - sh, 5, "fu-cushw") + R(w * 0.02, h * 0.06, w * 0.34, h * 0.3, 6, "fu-teak");
    }
    case "lounger":
      return R(-W, -Hh, w, h, 8, "fu-teak") + R(-W + 4, -Hh + 4, w - 8, h * 0.32, 6, "fu-cushw") + R(-W + 4, -Hh + h * 0.36, w - 8, h * 0.6, 6, "fu-cushw");
    case "parasol":
      return Array.from({ length: 8 }, (_, i) => { const a1 = (i / 8) * Math.PI * 2, a2 = ((i + 1) / 8) * Math.PI * 2; return `<path d="M0 0 L${f1(Math.cos(a1) * W)} ${f1(Math.sin(a1) * W)} L${f1(Math.cos(a2) * W)} ${f1(Math.sin(a2) * W)} Z" class="${i % 2 ? "fu-par1" : "fu-par2"}"/>`; }).join("") + `<circle r="4" class="fu-wood"/>`;
    case "pizza":
      return R(-W, -Hh, w, h, 6, "fu-brick") + `<circle cy="${f1(Hh * 0.05)}" r="${f1(Math.min(W, Hh) * 0.75)}" class="fu-dome"/><path d="M${f1(-W * 0.35)} ${f1(Hh)} A${f1(W * 0.35)} ${f1(W * 0.35)} 0 0 1 ${f1(W * 0.35)} ${f1(Hh)}" class="fu-fire"/>`;
    case "weber":
      return [0, 120, 240].map((d) => `<path d="M0 0 L${f1(Math.cos((d * Math.PI) / 180) * W * 1.05)} ${f1(Math.sin((d * Math.PI) / 180) * W * 1.05)}" class="fu-rod"/>`).join("") + `<circle r="${f1(W * 0.85)}" class="fu-dark"/><circle r="${f1(W * 0.65)}" class="fu-grate"/>` + [-0.4, -0.2, 0, 0.2, 0.4].map((y) => `<path d="M${f1(-W * 0.6 * Math.sqrt(1 - y * y * 2.4))} ${f1(y * W)} H${f1(W * 0.6 * Math.sqrt(1 - y * y * 2.4))}" class="fu-rod"/>`).join("");
    case "grill":
      return R(-W, -Hh, w, h, 4, "fu-steel") + R(-W * 0.55, -Hh + 4, W * 1.1, h - 8, 4, "fu-dark") + Array.from({ length: 6 }, (_, i) => `<path d="M${f1(-W * 0.5 + (i * W) / 5)} ${-Hh + 7} V${Hh - 7}" class="fu-rod"/>`).join("");
    case "firepit":
      return `<circle r="${W}" class="fu-steel"/><circle r="${f1(W * 0.75)}" class="fu-dark"/><circle r="${f1(W * 0.45)}" class="fu-fire"/>`;
    case "tramp":
      return `<circle r="${W}" class="fu-net"/><circle r="${f1(W * 0.9)}" class="fu-pad"/><circle r="${f1(W * 0.78)}" class="fu-mat"/>` + Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<circle cx="${f1(Math.cos(a) * W)}" cy="${f1(Math.sin(a) * W)}" r="3" class="fu-post"/>`; }).join("");
    case "sandbox":
      return R(-W, -Hh, w, h, 4, "fu-wood") + R(-W + 8, -Hh + 8, w - 16, h - 16, 3, "fu-sand") + `<circle cx="${f1(W * 0.25)}" cy="${f1(-Hh * 0.2)}" r="5" class="fu-dot1"/><rect x="${f1(-W * 0.4)}" y="${f1(Hh * 0.15)}" width="10" height="7" rx="2" class="fu-dot2"/>`;
    case "raised":
      return R(-W, -Hh, w, h, 4, "fu-wood") + R(-W + 6, -Hh + 6, w - 12, h - 12, 3, "fu-soil") + rep(Math.max(3, Math.floor(w / 26)), (i, n) => `<circle cx="${f1(-W + 14 + (i * (w - 28)) / Math.max(1, n - 1))}" cy="${f1(i % 2 ? Hh * 0.25 : -Hh * 0.25)}" r="${f1(Math.min(9, h * 0.16))}" class="fu-leaf"/>`);
    case "playhouse":
    case "shed":
      return R(-W, -Hh, w, h, 3, k === "shed" ? "fu-roof" : "fu-roofk") + `<path d="M${-W} 0 H${W}" class="fu-ridge"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${f1(-W + ((i + 1) * w) / 7)} ${-Hh} V${Hh}" class="fu-shingle"/>`).join("") + R(-w * 0.12, Hh - 4, w * 0.24, 6, 2, "fu-door");
    case "swing":
      return `<path d="M${-W} ${-Hh} L${-W + 10} 0 L${-W} ${Hh} M${W} ${-Hh} L${W - 10} 0 L${W} ${Hh} M${-W + 10} 0 H${W - 10}" class="fu-frameln"/>` + [-0.28, 0.28].map((x) => R(w * x - 14, -6, 28, 12, 3, "fu-toy")).join("");
    case "rug":
      return R(-W, -Hh, w, h, 6, "fu-rug") + R(-W + 7, -Hh + 7, w - 14, h - 14, 4, "fu-rug2");
    case "plant":
      return `<circle r="${W * 0.55}" class="fu-pot"/>` + [0, 72, 144, 216, 288].map((d) => `<ellipse rx="${f1(W * 0.5)}" ry="${f1(W * 0.2)}" transform="rotate(${d}) translate(${f1(W * 0.45)} 0)" class="fu-leaf"/>`).join("");
  }
  return R(-W, -Hh, w, h, 4, "fu-wood");
}

function lightSvg(it, plan) {
  const L = lv(it), k = it.lk || "ceiling", w = it.w || 30, h = it.h || w, W = w / 2, on = plan && L.on;
  const col = (L.rgb || it.rgb) && L.color ? L.color : "#FFD98A";
  const gid = "lg-" + String(it.id).replace(/[^a-zA-Z0-9_-]/g, "");
  const bri = L.bri ?? 80;
  const glowR = k === "strip" ? 0 : Math.max(60, w * 2.4) * ((bri / 100) * 0.6 + 0.4);
  let g = on ? `<defs><radialGradient id="${gid}"><stop offset="0" stop-color="${col}" stop-opacity=".9"/><stop offset=".5" stop-color="${col}" stop-opacity=".28"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs>` : "";
  if (on && glowR) g += `<circle r="${f1(glowR)}" fill="url(#${gid})" class="lt-glow${L.fx ? " fx" : ""}"/>`;
  if (on && k === "strip") g += `<rect x="${-W - 10}" y="${-Math.max(h, 4) / 2 - 10}" width="${w + 20}" height="${Math.max(h, 4) + 20}" rx="12" fill="${col}" class="lt-sglow${L.fx ? " fx" : ""}"/>`;
  let b;
  switch (k) {
    case "strip":
      b = `<rect x="${-W}" y="${-Math.max(h, 3) / 2}" width="${w}" height="${Math.max(h, 3)}" rx="2" class="lt-strip"${on ? ` style="fill:${col}"` : ""}/>`;
      break;
    case "spot":
      b = `<circle r="${W}" class="lt-shade"/><circle r="${W * 0.45}" class="lt-bulb"/>`;
      break;
    case "floor":
      b = `<circle r="${W}" class="lt-shade"/><circle r="${W * 0.3}" class="lt-bulb"/><path d="M${W * 0.7} ${W * 0.7} l${W * 0.5} ${W * 0.5}" class="lt-arm"/>`;
      break;
    case "table":
      b = `<circle r="${W}" class="lt-shade"/><circle r="${W * 0.35}" class="lt-bulb"/>`;
      break;
    case "wall":
      b = `<path d="M${-W} ${-h / 2} A${W} ${W} 0 0 0 ${W} ${-h / 2} Z" class="lt-shade"/><circle cy="${f1(-h / 2 + W * 0.35)}" r="${W * 0.25}" class="lt-bulb"/>`;
      break;
    case "rgb":
      b = `<circle r="${W + 3}" class="lt-rgbring"/><circle r="${W}" class="lt-bulb"${on ? ` style="fill:${col}"` : ""}/>`;
      break;
    case "garden":
      b = `<rect x="${-W * 0.6}" y="${-W * 0.6}" width="${W * 1.2}" height="${W * 1.2}" rx="2" class="lt-post"/><circle r="${W * 0.35}" class="lt-bulb"/>`;
      break;
    case "pendant":
      b = `<circle r="${W}" class="lt-shade"/><circle r="${W * 0.62}" class="lt-shade2"/><circle r="${W * 0.25}" class="lt-bulb"/>`;
      break;
    default:
      b = `<circle r="${W}" class="lt-shade"/><circle r="${W * 0.5}" class="lt-bulb"/>`;
  }
  return g + `<g class="lt-b${on ? " on" : ""}">${b}</g>`;
}

function carSvg(it) {
  const w = it.w, h = it.h, W = w / 2, L = h / 2, col = it.col || "#E5E7EB";
  const wh = [[-W - 2, -L * 0.62], [W - 6, -L * 0.62], [-W - 2, L * 0.5], [W - 6, L * 0.5]].map(([x, y]) => `<rect x="${f1(x)}" y="${f1(y)}" width="8" height="${f1(h * 0.17)}" rx="3" class="car-wh"/>`).join("");
  return `${wh}<rect x="${-W}" y="${-L}" width="${w}" height="${h}" rx="${f1(w * 0.3)}" class="car-body" style="fill:${col}"/>
    <path d="M${f1(-W * 0.78)} ${f1(-L * 0.32)} Q0 ${f1(-L * 0.44)} ${f1(W * 0.78)} ${f1(-L * 0.32)} L${f1(W * 0.68)} ${f1(-L * 0.12)} L${f1(-W * 0.68)} ${f1(-L * 0.12)} Z" class="car-glass"/>
    <rect x="${f1(-W * 0.68)}" y="${f1(-L * 0.12)}" width="${f1(w * 0.68)}" height="${f1(L * 0.48)}" rx="6" class="car-roof"/>
    <path d="M${f1(-W * 0.66)} ${f1(L * 0.38)} L${f1(W * 0.66)} ${f1(L * 0.38)} L${f1(W * 0.74)} ${f1(L * 0.56)} Q0 ${f1(L * 0.64)} ${f1(-W * 0.74)} ${f1(L * 0.56)} Z" class="car-glass"/>
    <rect x="${f1(-W - 6)}" y="${f1(-L * 0.2)}" width="7" height="5" rx="2" class="car-mir" style="fill:${col}"/><rect x="${f1(W - 1)}" y="${f1(-L * 0.2)}" width="7" height="5" rx="2" class="car-mir" style="fill:${col}"/>
    <rect x="${f1(-W * 0.8)}" y="${f1(-L + 3)}" width="${f1(w * 0.22)}" height="5" rx="2" class="car-lamp"/><rect x="${f1(W * 0.8 - w * 0.22)}" y="${f1(-L + 3)}" width="${f1(w * 0.22)}" height="5" rx="2" class="car-lamp"/>
    <rect x="${f1(-W * 0.8)}" y="${f1(L - 7)}" width="${f1(w * 0.22)}" height="4" rx="2" class="car-tail"/><rect x="${f1(W * 0.8 - w * 0.22)}" y="${f1(L - 7)}" width="${f1(w * 0.22)}" height="4" rx="2" class="car-tail"/>`;
}
const carPort = (it) => {
  const p = PORTS[it.port || "bl"] || PORTS.bl;
  return rotP(it, p[1] * it.w, p[2] * it.h);
};
const carPortDir = (it) => {
  const p = PORTS[it.port || "bl"] || PORTS.bl, a = ((it.rot || 0) * Math.PI) / 180, lx = p[1] !== 0 ? Math.sign(p[1]) : 0, ly = p[1] === 0 ? Math.sign(p[2]) : 0;
  return [lx * Math.cos(a) - ly * Math.sin(a), lx * Math.sin(a) + ly * Math.cos(a)];
};
const chgSock = (it) => rotP(it, 0, -(it.h || 30) / 2);
const chgDir = (it) => {
  const a = ((it.rot || 0) * Math.PI) / 180;
  return [Math.sin(a), -Math.cos(a)];
};
/* The cable from the car's charge port to the charger: shown while the car is home and plugged in. */
function cableState(car, plan) {
  if (!plan) return car.plug ? "connected" : "none";
  const L = lv(car);
  if (!L.home) return "none";
  return L.cable || "none";
}
function cableSvg(car, chg, plan) {
  if (!chg) return "";
  const st = cableState(car, plan);
  if (plan && st === "none") return "";
  const A = carPort(car), B = chgSock(chg), da = carPortDir(car), db = chgDir(chg), k = Math.max(30, Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.45);
  const c1 = [A[0] + da[0] * k, A[1] + da[1] * k + 14], c2 = [B[0] + db[0] * k, B[1] + db[1] * k + 14];
  const d = `M${A.map(f1).join(",")} C${c1.map(f1).join(",")} ${c2.map(f1).join(",")} ${B.map(f1).join(",")}`;
  const tm = 0.5, mt = 1 - tm, mid = [0, 1].map((i) => mt ** 3 * A[i] + 3 * mt * mt * tm * c1[i] + 3 * mt * tm * tm * c2[i] + tm ** 3 * B[i]);
  const col = CABLE[st][1];
  const ic = { scheduled: "timer", paused: "pause", complete: "check", fault: "bell", charging: "bolt", connected: "plug", waiting: "clock" }[st];
  const spark = (begin) => `<circle r="5" class="cb-spark"><animateMotion dur="4.2s" begin="${begin}" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path="${d}"/></circle>`;
  return `<g class="cb cb-${st}" style="--cc:${col}" pointer-events="none"><path d="${d}" class="cb-base"/><path d="${d}" class="cb-st"/>${st === "charging" && plan ? spark("0s") + spark("-2.1s") : ""}
    <circle cx="${f1(A[0])}" cy="${f1(A[1])}" r="5" class="cb-plug"/>${ic && plan ? `<g class="cb-badge" transform="translate(${f1(mid[0])},${f1(mid[1])})"><circle r="15"/><g transform="translate(-9,-9) scale(.75)" class="cb-ic">${P[ic] || ""}</g></g>` : ""}</g>`;
}
function chargerState(it) {
  const H = CUR;
  const sts = H ? H.items.filter((i) => i.type === "car" && i.chg === it.id).map((c) => cableState(c, true)) : [];
  const own = lv(it).val != null ? cableOf(lv(it).val) : "none";
  return ["fault", "charging", "paused", "scheduled", "waiting", "connected", "complete"].find((s) => sts.includes(s) || own === s) || "none";
}
function chargerSvg(it, plan) {
  const w = it.w || 24, h = it.h || 30, st = plan ? chargerState(it) : "none";
  return { st, svg: `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" class="chg-box"/><circle r="${Math.min(w, h) * 0.26}" class="chg-led" style="--cc:${CABLE[st][1]}"/><rect x="${-w * 0.22}" y="${-h / 2 - 3}" width="${w * 0.44}" height="5" rx="2" class="chg-sock"/>` };
}
function solarSvg(it, plan) {
  const w = it.w, h = it.h, cols = Math.max(1, Math.round(w / CM(105))), rows = Math.max(1, Math.round(h / CM(175))), cw = w / cols, ch = h / rows;
  const L = lv(it), shine = plan && (L.ent ? L.val > 0 : sunUp());
  let s = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" class="sol-frame"/>`;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) s += `<rect x="${f1(-w / 2 + i * cw + 1.5)}" y="${f1(-h / 2 + j * ch + 1.5)}" width="${f1(cw - 3)}" height="${f1(ch - 3)}" rx="1.5" class="sol-cell"/>`;
  if (shine) s += `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" class="sol-shine" style="--sw:${w}px"/>`;
  return s;
}
function batterySvg(it, plan) {
  const w = it.w, h = it.h, soc = plan ? lv(it).soc ?? 0 : 64, n = 5, bh = (h - 14) / n;
  return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="7" class="bat-box"/>${Array.from({ length: n }, (_, i) => `<rect x="${-w / 2 + 6}" y="${f1(h / 2 - 7 - (i + 1) * bh + 1.5)}" width="${w - 12}" height="${f1(bh - 3)}" rx="2" class="bat-cell${(i + 1) / n <= soc / 100 + 0.1 ? " on" : ""}${plan && i === Math.min(n - 1, Math.floor((soc / 100) * n)) ? " lvl" : ""}"/>`).join("")}`;
}
function treeSvg(it, plan) {
  const r = (it.w || 120) / 2, bush = it.type === "bush";
  return `<circle r="${r}" class="tr-shadow" transform="translate(6 6)"/><g class="tr-can${plan ? " sway" : ""}" style="animation-delay:${-(hashStr(it.id) % 50) / 10}s">${
    bush
      ? `<circle r="${r}" class="tr-1"/><circle cx="${-r * 0.3}" cy="${-r * 0.25}" r="${r * 0.55}" class="tr-2"/>`
      : `<circle r="${r}" class="tr-1"/><circle cx="${-r * 0.28}" cy="${-r * 0.3}" r="${r * 0.6}" class="tr-2"/><circle cx="${r * 0.32}" cy="${r * 0.12}" r="${r * 0.5}" class="tr-2"/><circle cx="${-r * 0.1}" cy="${r * 0.35}" r="${r * 0.4}" class="tr-3"/>`
  }</g>${bush ? "" : `<circle r="${Math.max(3, r * 0.08)}" class="tr-trunk"/>`}`;
}

const hit = (it, plan, label) =>
  plan ? `data-act="house-ent" data-id="${esc(it.id)}" tabindex="0" role="button" aria-label="${esc(it.name)}${label ? ": " + esc(label) : ""}"` : `data-he="item:${esc(it.id)}"`;

function hObj(it, o) {
  const plan = o.mode === "plan", x = it.x, y = it.y, rot = it.rot || 0, sel = !plan && o.sel === it.id, L = lv(it);
  let inner = "", fx = "", over = "", cls = "", inter = plan;
  const T = it.type;
  if (T === "furn") {
    inner = furnSvg(it.fk, it.w, it.h);
    inter = false;
    cls = it.fk === "rug" ? " rug" : "";
  } else if (T === "tree" || T === "bush") {
    inner = treeSvg(it, plan);
    inter = false;
  } else if (T === "light") {
    inner = lightSvg(it, plan);
    cls = plan && L.on ? " on" : "";
    inter = plan && !!it.ent;
  } else if (T === "car") {
    if (plan && !L.home) return "";
    inner = carSvg(it);
    if (plan && L.soc != null) {
      const soc = Math.round(L.soc), st = L.cable;
      over = `<g class="car-soc${st === "charging" ? " chg" : ""}" transform="translate(${x},${y})" pointer-events="none"><rect x="-34" y="-15" width="68" height="30" rx="15"/><rect x="-26" y="-6" width="24" height="12" rx="3" class="cs-b"/><rect x="-25" y="-5" width="${f1((22 * soc) / 100)}" height="10" rx="2" class="cs-f" style="--sc:${soc < 30 ? "#E5484D" : soc < 60 ? "#F59E0B" : "#22C55E"}"/><text x="14" y="6" text-anchor="middle">${soc}%</text></g>`;
    }
  } else if (T === "charger") {
    const r = chargerSvg(it, plan);
    inner = r.svg;
    cls = " st-" + r.st;
  } else if (T === "solar") inner = solarSvg(it, plan);
  else if (T === "battery") inner = batterySvg(it, plan);
  else if (T === "tv") {
    const w = it.w, h = it.h || 6, on = plan && L.on;
    inner = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2" class="tv-body"/><rect x="${-w / 2 + 3}" y="${h / 2 - 2}" width="${w - 6}" height="2" class="tv-scr"/>`;
    if (on) fx = `<path d="M${-w / 2} ${h / 2} L${w / 2} ${h / 2} L${w * 0.8} ${h / 2 + w * 0.7} L${-w * 0.8} ${h / 2 + w * 0.7} Z" class="tv-beam"/>`;
    cls = on ? " on" : "";
  } else if (T === "speaker") {
    const w = it.w, h = it.h || w, play = plan && L.play;
    inner = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) * 0.3}" class="spk-body"/>${
      w > h * 2.5 ? Array.from({ length: Math.floor(w / 8) }, (_, i) => `<circle cx="${f1(-w / 2 + 4 + i * 8)}" cy="0" r="1.4" class="spk-dot"/>`).join("") : `<circle r="${Math.min(w, h) * 0.3}" class="spk-cone"/>`
    }`;
    cls = play ? " play" : "";
    if (play) over = `<g class="hm-notes" style="--hc:#E5484D" pointer-events="none">${["♪", "♫", "♩"].map((n, i) => `<text x="${x + (i % 2 ? 8 : -12)}" y="${y - 10}" style="animation-delay:${i * 1.6}s;--dx:${[-24, 22, -6][i]}px">${n}</text>`).join("")}</g><circle cx="${x}" cy="${y}" r="16" class="spk-wave" style="--hc:#E5484D" pointer-events="none"/>`;
  }
  const hitR = T === "car" ? 0 : Math.max(16, Math.min(it.w || 30, 60) / 2);
  const attrs = plan ? (inter || T === "car" ? hit(it, plan, hState(it)[0]) : `pointer-events="none"`) : `data-he="item:${esc(it.id)}"`;
  return `<g class="ob ob-${T}${it.fk ? " fk-" + it.fk : ""}${it.lk ? " lk-" + it.lk : ""}${cls}${sel ? " sel" : ""}" ${attrs}><g transform="translate(${x},${y}) rotate(${rot})">${fx}${inner}${hitR && inter ? `<circle r="${hitR}" class="ho-hit"/>` : ""}</g>${over}</g>`;
}

/* Openings: a door with leaf and swing, a window with glass, a port with slats. Drawn along their wall, at any angle:
   the wall runs along the local x axis, and "side" is the side the door opens to. */
function hOpening(it, o) {
  const plan = o.mode === "plan", L = lv(it), w = it.w || 60, x = it.x, y = it.y, hw = w / 2, T = 16, col = HT[it.type][2];
  const ang = it.ang || 0, sd = it.side || 1, open = plan && L.open, off = plan && L.off;
  const st = off ? " off" : open ? " open" : "";
  let s = `<rect x="${-hw}" y="${-T / 2}" width="${w}" height="${T}" class="ho-gap"/>`;
  if (it.type === "door") {
    const leaf = (hx, ax, Ln) => {
      const base = ax > 0 ? 0 : 180, sg = Math.sign(ax * sd) || 1, a2 = sg * 82, er = (a2 * Math.PI) / 180;
      return `<g transform="translate(${hx},0) rotate(${base})"><path class="ho-arc" d="M${Ln},0 A${Ln},${Ln} 0 0 ${sg > 0 ? 1 : 0} ${f1(Ln * Math.cos(er))},${f1(Ln * Math.sin(er))}"/><g class="ho-leaf" style="--ang:${a2}deg;transform:rotate(${open ? a2 : 0}deg)"><rect x="0" y="-3.5" width="${Ln}" height="7" rx="3"/></g><circle r="4.5" class="ho-hinge"/></g>`;
    };
    if (it.dbl) s += leaf(-hw, 1, hw) + leaf(hw, -1, hw);
    else s += it.hinge === "r" ? leaf(hw, -1, w) : leaf(-hw, 1, w);
  } else if (it.type === "window") {
    s += `<line x1="${-hw}" y1="-3" x2="${hw}" y2="-3" class="ho-glass"/><line x1="${-hw}" y1="3" x2="${hw}" y2="3" class="ho-glass"/>`;
    if (open) s += `<g transform="translate(${-hw},0)"><g class="ho-sash" style="--ang:${sd * 28}deg;transform:rotate(${sd * 28}deg)"><rect x="0" y="-3" width="${w}" height="6" rx="3"/></g></g>`;
  } else {
    const n = Math.max(3, Math.round(w / 26));
    s += `<g class="ho-port${open ? " a-open" : ""}"><rect x="${-hw}" y="-7" width="${w}" height="14" rx="4" class="ho-pbody"/>${Array.from({ length: n - 1 }, (_, i) => `<line x1="${f1(-hw + ((i + 1) * w) / n)}" y1="-7" x2="${f1(-hw + ((i + 1) * w) / n)}" y2="7" class="ho-pln"/>`).join("")}</g>`;
  }
  const g = (lx, ly) => {
    const a = (ang * Math.PI) / 180;
    return [x + lx * Math.cos(a) - ly * Math.sin(a), y + lx * Math.sin(a) + ly * Math.cos(a)];
  };
  let out = `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(ang)})">${s}</g>`;
  if (it.type === "port" && plan) {
    const [tx, ty] = g(0, -sd * 26);
    out += `<text x="${f1(tx)}" y="${f1(ty)}" class="sec-lbl sm ho-plbl" text-anchor="middle">${esc(it.short || it.name)} · ${esc(open ? t("åben") : t("lukket"))}</text>`;
  }
  const hasLock = it.lockOn && it.lock;
  if (hasLock) {
    const locked = plan ? L.locked : true;
    const [lx, ly] = g(hw - 8, sd * 30);
    out += `<g class="ho-lock${locked ? " locked" : ""}"><circle cx="${f1(lx)}" cy="${f1(ly)}" r="13"/><path d="M${f1(lx - 5)},${f1(ly - 1)} h10 v8 h-10z" class="lk-body"/><path class="lk-sh" d="M${f1(lx - 3.2)},${f1(ly - 1)} v-3.4 a3.2,3.2 0 0 1 6.4,0 v3.4"/></g>`;
  }
  return `<g class="ho ho-${it.type}${st}${hasLock ? " haslock" : ""}${!plan && o.sel === it.id ? " sel" : ""}${!plan && o.msel?.has("item:" + it.id) ? " msel" : ""}" style="--hc:${col}" ${hit(it, plan, plan ? hState(it)[0] : "")}><circle cx="${x}" cy="${y}" r="${Math.max(30, hw * 0.8)}" class="ho-hit"/>${open ? `<circle cx="${x}" cy="${y}" r="${hw * 0.7 + 10}" class="ho-alert"/>` : ""}${out}</g>`;
}

/* Robots drive a route inside their room (vacuum: here and there) or lawn (mower: in lanes). */
function robotPath(it, H) {
  const zr = H.rooms.find((r) => r.id === it.zone), za = H.areas.find((a) => a.id === it.zone);
  let poly = zr ? zr.pts : za && za.pts ? za.pts : null;
  if (!poly) {
    const r = it.type === "mower" ? H.areas.find((a) => a.kind === "lawn" && a.pts) : roomAt(H, it.x, it.y);
    poly = r ? r.pts : [[it.x - 120, it.y - 90], [it.x + 120, it.y - 90], [it.x + 120, it.y + 90], [it.x - 120, it.y + 90]];
  }
  const [bx0, by0, bx1, by1] = bbox(poly), m = it.type === "mower" ? 24 : 26, x0 = bx0 + m, x1 = bx1 - m, y0 = by0 + m, y1 = by1 - m;
  const pts = [[it.x, it.y]];
  if (it.type === "mower") {
    let dir = 0;
    for (let yy = y0; yy <= y1; yy += 44) {
      const row = dir ? [[x1, yy], [x0, yy]] : [[x0, yy], [x1, yy]];
      row.forEach((q) => pip(q, poly) && pts.push(q));
      dir ^= 1;
    }
  } else {
    const r = prng((hashStr(it.id) % 9973) + 3);
    let n = 0, g = 0;
    while (n < 14 && g < 400) {
      g++;
      const q = [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)];
      if (pip(q, poly)) {
        pts.push(q);
        n++;
      }
    }
  }
  pts.push([it.x, it.y]);
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  // Calm: about 18 units (30 cm) a second.
  return { d: "M" + pts.map((q) => q.map(f1).join(",")).join(" L"), dur: Math.max(45, len / 18), poly };
}

/* The prototype's small appliance drawings (apArt), used on the plan. */
function planArt(kind, L) {
  const run = !!L.run;
  switch (kind) {
    case "washer":
    case "dryer":
      return `<svg viewBox="0 0 120 120" class="ap-svg"><rect x="16" y="8" width="88" height="106" rx="8" fill="#FBFBFA" stroke="#E2E0DC"/><rect x="24" y="13" width="34" height="10" rx="3" fill="#1D2027"/><circle cx="88" cy="18" r="5" fill="#E6E4E0" stroke="#C9C6C0"/><circle cx="60" cy="68" r="34" fill="#E9E8E5"/><circle cx="60" cy="68" r="29" fill="#C9CDD3" stroke="#AEB3BA" stroke-width="3"/><circle cx="60" cy="68" r="25" fill="#3A4150"/><g fill-opacity=".9"${run ? ` class="ap-drum" style="transform-origin:60px 68px"` : ""}><circle cx="50" cy="62" r="7" fill="#E5484D"/><circle cx="68" cy="74" r="8" fill="#F2B01E"/><circle cx="64" cy="58" r="6" fill="#6C8CFF"/></g><path d="M44,56 a20,20 0 0 1 12,-10" stroke="rgba(255,255,255,.6)" stroke-width="2" fill="none"/></svg>`;
    case "dish":
      return `<svg viewBox="0 0 120 120" class="ap-svg"><rect x="10" y="6" width="100" height="10" fill="#C9A77C"/><rect x="12" y="16" width="96" height="88" rx="2" fill="#F4F2EE" stroke="#E2DED7"/><rect x="40" y="22" width="40" height="3" rx="1.5" fill="#B9B4AC"/><rect x="12" y="104" width="96" height="6" fill="#D8D3CB"/><ellipse cx="60" cy="116" rx="12" ry="2.6" fill="${run ? "#3B82F6" : "transparent"}" class="${run ? "ap-pulse" : ""}"/></svg>`;
    case "oven":
      return `<svg viewBox="0 0 120 120" class="ap-svg"><rect x="10" y="12" width="100" height="96" rx="4" fill="#1C1E24"/><rect x="10" y="12" width="100" height="16" fill="#26292F"/><rect x="20" y="36" width="80" height="58" rx="5" fill="${run ? "#3A1E10" : "#0D0F13"}"/><line x1="26" y1="70" x2="94" y2="70" stroke="#5B5F68" stroke-width="1.6"/><rect x="22" y="98" width="76" height="4" rx="2" fill="#4A4E57"/></svg>`;
    case "hob":
      return `<svg viewBox="0 0 120 120" class="ap-svg"><rect x="8" y="18" width="104" height="84" rx="6" fill="#16181D"/>${[[34, 44, 15], [86, 44, 13], [34, 78, 13], [86, 78, 15]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${run && i === 0 ? "#E5484D" : "#3A3E47"}" stroke-width="1.2"/>`).join("")}</svg>`;
    case "coffee":
      return `<svg viewBox="0 0 120 120" class="ap-svg"><rect x="10" y="10" width="100" height="100" rx="4" fill="#1C1E24"/><rect x="18" y="16" width="84" height="12" rx="3" fill="${run ? "#2E4A3A" : "#2A2D34"}"/><circle cx="96" cy="22" r="2.6" fill="${run ? "#3CCB83" : "#555"}"/><rect x="40" y="34" width="40" height="70" rx="3" fill="#101216"/><rect x="52" y="34" width="16" height="10" rx="2" fill="#5B5F68"/><path d="M48,78 h24 l-3,20 h-18z" fill="#F4F1EC"/><path d="M72,82 q8,2 0,10" stroke="#F4F1EC" stroke-width="3" fill="none"/>${run ? `<g class="ap-steam"><path d="M56,74 q-3,-5 0,-9" stroke="#fff" stroke-width="1.4" fill="none"/><path d="M64,74 q3,-5 0,-9" stroke="#fff" stroke-width="1.4" fill="none"/></g>` : ""}<rect x="38" y="100" width="44" height="4" rx="1" fill="#3A3E47"/></svg>`;
    case "fridge":
    case "freezer": {
      const fz = kind === "freezer";
      const tmp = L.temp != null ? `${Math.round(L.temp)}°` : fz ? "−18°" : "4°";
      return `<svg viewBox="0 0 120 120" class="ap-svg"><rect x="28" y="4" width="64" height="112" rx="3" fill="#F4F2EE" stroke="#E2DED7"/><rect x="82" y="40" width="3" height="34" rx="1.5" fill="#B9B4AC"/><rect x="38" y="14" width="30" height="16" rx="4" fill="#1D2027"/><text x="53" y="25" font-size="8" fill="${fz ? "#7FC4FF" : "#7FE0B0"}" text-anchor="middle" font-family="Figtree" font-weight="800">${tmp}</text>${fz ? `<path d="M60,58 v20 M51,63 l18,10 M51,73 l18,-10" stroke="#9CC9F2" stroke-width="1.6" stroke-linecap="round"/>` : `<g fill="#BFE6D2"><circle cx="52" cy="66" r="5"/><circle cx="62" cy="70" r="4"/></g>`}</svg>`;
    }
    case "vent":
      return `<svg viewBox="0 0 120 120" class="ap-svg"><rect x="10" y="18" width="100" height="84" rx="8" fill="#F3F2EF" stroke="#E0DDD6"/>${[38, 82].map((x) => `<circle cx="${x}" cy="60" r="18" fill="#E2E0DA"/><g class="ap-fan" style="transform-origin:${x}px 60px">${[0, 72, 144, 216, 288].map((r) => `<path d="M${x},60 q10,-14 2,-17 q-6,4 -2,17" fill="#9AA3AE" transform="rotate(${r} ${x} 60)"/>`).join("")}</g><circle cx="${x}" cy="60" r="3" fill="#6B7380"/>`).join("")}</svg>`;
  }
  return "";
}

/* The prototype's camera pictures (camScene): shown while a camera has no picture of its own. */
export function camScene(ctx, c, big = false) {
  const night = (ctx?.hass?.states?.["sun.sun"]?.attributes?.elevation ?? 10) < -3;
  const sky = night ? "#20242C" : "#B9CBD8", grass = night ? "#3A4038" : "#7FA36A", wall = night ? "#5A5E66" : "#E7E2DA";
  const scene = c.scene || "garden";
  let s = `<rect width="320" height="180" fill="${sky}"/>`;
  if (scene === "drive")
    s += `<rect y="96" width="320" height="84" fill="${night ? "#474A4F" : "#A3A19C"}"/><rect x="0" y="20" width="120" height="90" fill="${wall}"/><rect x="14" y="44" width="92" height="66" fill="${night ? "#6B6F77" : "#CFCAC1"}"/>${[0, 1, 2, 3].map((i) => `<line x1="14" y1="${54 + i * 15}" x2="106" y2="${54 + i * 15}" stroke="rgba(0,0,0,.12)"/>`).join("")}<rect y="70" x="120" width="200" height="30" fill="${night ? "#2C3A2A" : "#4E7A3F"}"/><path d="M0,180 L130,96 L190,96 L320,180z" fill="${night ? "#55585E" : "#B8B5AF"}"/><g class="cam-car"><rect x="128" y="104" width="70" height="30" rx="8" fill="${night ? "#8C9097" : "#2B2E35"}"/><rect x="140" y="96" width="46" height="16" rx="6" fill="${night ? "#9DA1A8" : "#3A3E47"}"/><circle cx="142" cy="136" r="6" fill="#111"/><circle cx="186" cy="136" r="6" fill="#111"/></g>`;
  else if (scene === "side")
    s += `<rect y="90" width="320" height="90" fill="${grass}"/><path d="M0,0 L120,40 L120,140 L0,180z" fill="${wall}"/>${[0, 1].map((i) => `<rect x="${30 + i * 50}" y="${60 + i * 8}" width="26" height="40" fill="${night ? "#1E222A" : "#6E8090"}" transform="skewY(18)"/>`).join("")}<path d="M120,140 L320,120 L320,180 L0,180z" fill="${night ? "#555" : "#A9A7A2"}" opacity=".5"/><rect x="200" y="60" width="120" height="44" rx="10" fill="${night ? "#2F3A2E" : "#5E8C4E"}"/>`;
  else if (scene === "doorbell") {
    const hw = ctx?.on?.("decor") && activeDecor(new Date(), ctx.data?.settings, ctx.data?.family).some((d) => d.key === "halloween");
    s += `<rect width="320" height="180" fill="${night ? "#3D4047" : "#D6D0C6"}"/><ellipse cx="160" cy="210" rx="220" ry="120" fill="${night ? "#4C4F55" : "#B9B3A8"}"/><rect x="118" y="132" width="84" height="34" rx="4" fill="${night ? "#3B3530" : "#7B5B3E"}"/><text x="160" y="154" font-size="11" text-anchor="middle" fill="rgba(255,255,255,.6)" font-family="Figtree" font-weight="800">VELKOMMEN</text>${hw ? `<circle cx="70" cy="140" r="16" fill="#E8711C"/><circle cx="252" cy="146" r="12" fill="#E8711C"/>` : ""}`;
  } else
    s += `<rect y="84" width="320" height="96" fill="${grass}"/>${[[40, 70, 28], [92, 62, 34], [270, 66, 30]].map(([x, y, r]) => `<rect x="${x - 3}" y="${y}" width="6" height="30" fill="#5B4632"/><circle cx="${x}" cy="${y - 6}" r="${r}" fill="${night ? "#2F3A2E" : "#C9772E"}" opacity=".95"/>`).join("")}<rect x="150" y="96" width="90" height="14" fill="${night ? "#5B5146" : "#A0794F"}"/><g class="cam-cat"><ellipse cx="0" cy="0" rx="9" ry="5" fill="#2A2420"/><circle cx="9" cy="-4" r="4" fill="#2A2420"/><path d="M-9,-1 q-8,-6 -6,-12" stroke="#2A2420" stroke-width="2.4" fill="none"/></g>`;
  return `<svg class="cam-svg${night ? " ir" : ""}${big ? " big" : ""}" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">${s}</svg>`;
}

function hAppl(it, o, txt, cls, fx) {
  const x = it.x, y = it.y, plan = o.mode === "plan", col = HT[it.type][2], L = lv(it);
  let s = fx;
  if (ROBOT.has(it.type)) {
    const body =
      it.type === "vacuum"
        ? `<circle r="14" class="rb-v"/><circle r="6.5" class="rb-v2"/><path d="M6 -10 A12 12 0 0 1 6 10" class="rb-bump"/><circle cx="9" r="2.4" class="rb-led"/>`
        : `<rect x="-17" y="-12" width="34" height="24" rx="8" class="rb-m"/><rect x="-7" y="-7" width="14" height="14" rx="4" class="rb-m2"/><circle cx="13" r="2.4" class="rb-led"/><rect x="-15" y="-15" width="8" height="5" rx="2" class="rb-w"/><rect x="-15" y="10" width="8" height="5" rx="2" class="rb-w"/>`;
    s += `<g class="rb-dock"><rect x="${x - 15}" y="${y - 6}" width="30" height="12" rx="4"/><circle cx="${x}" cy="${y}" r="2.5" class="rb-dl"/></g>`;
    if (plan && L.run) {
      const R = robotPath(it, CUR);
      s += `<path d="${R.d}" class="rb-route"/><g class="rb rb-${it.type}">${body}<animateMotion dur="${R.dur.toFixed(0)}s" repeatCount="indefinite" rotate="auto" path="${R.d}"/></g>`;
    } else {
      s += `<g class="rb rb-${it.type}" transform="translate(${x},${y})">${body}</g>`;
      if (!plan && o.sel === it.id) {
        const R = robotPath(it, CUR);
        s += `<polygon points="${R.poly.map((q) => q.join(",")).join(" ")}" class="rb-zone"/>`;
      }
    }
  } else {
    const art = planArt(it.type, plan ? L : {}).replace('<svg viewBox="0 0 120 120" class="ap-svg">', `<svg x="${x - 17}" y="${y - 17}" width="34" height="34" viewBox="0 0 120 120" class="ap-svg">`);
    s += `${cls === "play" ? `<circle class="hm-runring" cx="${x}" cy="${y}" r="26"/>` : ""}<g class="hm-body" style="transform-origin:${x}px ${y}px"><rect x="${x - 21}" y="${y - 21}" width="42" height="42" rx="12" class="hm-tile"/>${art}</g>${plan && (L.off || L.missing) ? `<circle class="hm-offdot" cx="${x + 17}" cy="${y - 17}" r="5"/>` : ""}`;
  }
  const tw = Math.max(70, it.name.length * 8.6 + 26);
  const tip = plan ? `<g class="hm-tip"><rect x="${x - tw / 2}" y="${y - 62}" width="${tw}" height="28" rx="14"/><text x="${x}" y="${y - 43}" text-anchor="middle">${esc(it.name)}</text></g>` : "";
  return `<g class="hm hm-ap hm-${it.type} st-${cls || "none"}${o.sel === it.id ? " sel" : ""}" style="--hc:${col}" ${hit(it, plan, txt)}>${ROBOT.has(it.type) && plan ? `<circle cx="${x}" cy="${y}" r="22" class="ho-hit"/>` : ""}${s}${tip}</g>`;
}

/* Devices: animated markers. */
function hMarker(it, o) {
  const [, ic, col, dom] = HT[it.type], plan = o.mode === "plan", [txt, cls] = plan ? hState(it) : ["", ""], x = it.x, y = it.y, L = lv(it);
  let fx = "";
  if (it.type === "camera" && (plan || o.sel === it.id)) {
    const R = it.r || 240, a = it.a ?? 270, sw = it.s ?? 60, a1 = ((a - sw / 2) * Math.PI) / 180, a2 = ((a + sw / 2) * Math.PI) / 180, am = (a * Math.PI) / 180;
    fx = `<path class="hm-cone" d="M${x},${y} L${f1(x + Math.cos(a1) * R)},${f1(y + Math.sin(a1) * R)} A${R},${R} 0 0 1 ${f1(x + Math.cos(a2) * R)},${f1(y + Math.sin(a2) * R)}Z"/>${
      plan ? `<line class="hm-scan" x1="${x}" y1="${y}" x2="${f1(x + Math.cos(am) * R)}" y2="${f1(y + Math.sin(am) * R)}" style="transform-origin:${x}px ${y}px;--s:${sw / 2}deg"/>` : ""
    }`;
  }
  if (plan) {
    if (it.type === "motion") fx += `<g class="hm-radar" style="transform-origin:${x}px ${y}px"><path d="M${x},${y} L${x + 46},${y} A46,46 0 0 0 ${f1(x + 46 * Math.cos(-0.7))},${f1(y + 46 * Math.sin(-0.7))}Z"/></g><circle class="hm-rip" cx="${x}" cy="${y}" r="20"/><circle class="hm-rip r2" cx="${x}" cy="${y}" r="20"/>`;
    if (it.type === "speaker" && L.play)
      fx += `<g class="hm-waves">${[0, 1].map((i) => `<circle cx="${x}" cy="${y}" r="20" style="animation-delay:${i * 1.8}s"/>`).join("")}</g><g class="hm-notes">${["♪", "♫", "♩", "♬"].map((n, i) => `<text x="${x + (i % 2 ? 8 : -12)}" y="${y - 14}" style="animation-delay:${i * 1.3}s;--dx:${[-26, 22, -8, 30][i]}px">${n}</text>`).join("")}</g>`;
    if (it.type === "ap") fx += `<g class="hm-wifi">${[0, 1, 2].map((i) => `<circle cx="${x}" cy="${y}" r="18" style="animation-delay:${i * 1.2}s"/>`).join("")}</g>`;
    if (it.type === "smoke" || it.type === "leak") fx += `<circle class="hm-breath${L.alarm ? " alarm" : ""}" cx="${x}" cy="${y}" r="24"/>`;
    if (it.type === "tv" && L.on) fx += `<circle class="hm-flick" cx="${x}" cy="${y}" r="30"/>`;
    if (it.type === "lamp" && L.on) fx += `<circle class="hm-lampglow" cx="${x}" cy="${y}" r="48"${L.color ? ` style="fill:${L.color}"` : ""}/>`;
  }
  if (APK.has(it.type)) return hAppl(it, o, txt, cls, fx);
  const tw = Math.max(70, it.name.length * 8.6 + 26);
  const tip = plan ? `<g class="hm-tip"><rect x="${x - tw / 2}" y="${y - 58}" width="${tw}" height="28" rx="14"/><text x="${x}" y="${y - 39}" text-anchor="middle">${esc(it.name)}</text></g>` : "";
  const badge =
    it.type === "camera"
      ? `<circle class="hm-rec" cx="${x + 12}" cy="${y - 12}" r="4.5"/>`
      : it.type === "temp" && plan && L.val != null
        ? `<g class="hm-val"><rect x="${x + 14}" y="${y - 30}" width="46" height="22" rx="11"/><text x="${x + 37}" y="${y - 15}" text-anchor="middle">${C.fmt.num(L.val, 1)}°</text></g>`
        : it.type === "smoke" && plan && !L.alarm && L.ent
          ? `<circle class="hm-okdot" cx="${x + 12}" cy="${y - 12}" r="4.5"/>`
          : "";
  return `<g class="hm hm-${it.type} st-${cls || "none"}${L.live ? " live" : ""}${!it.ent && dom ? " nolink" : ""}${o.sel === it.id ? " sel" : ""}" style="--hc:${col}" ${hit(it, plan, txt)}>${fx}<g class="hm-body" style="transform-origin:${x}px ${y}px"><circle class="hm-base" cx="${x}" cy="${y}" r="17"/><g class="hm-ic" transform="translate(${x - 10.5},${y - 10.5}) scale(.875)">${P[ic] || ""}</g></g>${badge}${tip}</g>`;
}

let CUR = null; // the house being drawn (for robots and chargers)

function roomLit(r) {
  if (r.light) return C.st(r.light)?.state === "on";
  if (!r.area || !C.hass?.entities) return false;
  return Object.values(C.hass.entities).some((e) => e.entity_id?.startsWith("light.") && C.area(e.entity_id) === r.area && C.st(e.entity_id)?.state === "on");
}

/* Surfaces speak for themselves: grass, tiles and gravel only get a label when they have a name of their own. */
const SURF = { lawn: ["Græs", "Grass", "Græsplæne", "Plæne"], tiles: ["Fliser", "Tiles"], gravel: ["Grus", "Gravel"] };
const areaLabel = (a) => !!a.name && !(SURF[a.kind] && SURF[a.kind].concat(t(AREAK[a.kind])).some((n) => n.toLowerCase() === String(a.name).trim().toLowerCase()));
function houseSvg(H, o) {
  CUR = H;
  const pts = (p) => p.map((q) => q.join(",")).join(" ");
  const Ls = o.layers || null, plan = o.mode === "plan", m = o.mode;
  let s = `<defs><pattern id="hx-deck-${m}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" class="sx-deckbg"/><path d="M0,8 h16" class="sx-deckln"/></pattern>
    <pattern id="hx-tiles-${m}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" class="hx-tilebg"/><path d="M24 0H0V24" class="hx-tileln"/></pattern>
    <pattern id="hx-bed-${m}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" class="hx-soil"/><circle cx="6" cy="7" r="3.4" class="hx-sprout"/><circle cx="16" cy="16" r="2.8" class="hx-sprout2"/></pattern>
    <pattern id="hx-gravel-${m}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" class="hx-gravbg"/><circle cx="3" cy="4" r="1.4" class="hx-grav"/><circle cx="9" cy="9" r="1.2" class="hx-grav"/></pattern>
    <pattern id="hx-lawn-${m}" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" class="hx-lawnbg"/><rect width="28" height="56" class="hx-lawnst"/></pattern>
    <radialGradient id="hx-lit-${m}"><stop offset="0" stop-color="#FFD98A" stop-opacity=".95"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient></defs>`;
  const fill = (k) => ({ deck: `url(#hx-deck-${m})`, tiles: `url(#hx-tiles-${m})`, bed: `url(#hx-bed-${m})`, gravel: `url(#hx-gravel-${m})`, lawn: `url(#hx-lawn-${m})` })[k];
  H.areas.forEach((a) => {
    const sel = o.sel === "area:" + a.id ? " sel" : "", at = plan ? ` pointer-events="none"` : ` data-he="area:${esc(a.id)}"`;
    if (a.kind === "label" || !a.pts) s += `<text x="${a.x}" y="${a.y}" class="sec-lbl out big hx-area${sel}"${at}${a.rot ? ` transform="rotate(${a.rot} ${a.x} ${a.y})"` : ""} text-anchor="middle">${esc(a.name)}</text>`;
    else {
      const [cx, cy] = centroid(a.pts);
      s += `<g class="hx-area k-${esc(a.kind)}${sel}"${at}><polygon points="${pts(a.pts)}" ${fill(a.kind) ? `fill="${fill(a.kind)}"` : `class="hx-${esc(a.kind)}"`}/>${a.kind === "bed" || !areaLabel(a) ? "" : `<text x="${f1(cx)}" y="${f1(cy + 8)}" class="sec-lbl out" text-anchor="middle">${esc(a.name)}</text>`}</g>`;
    }
  });
  H.rooms.forEach((r) => {
    const lit = plan && (!Ls || Ls.has("lys")) && roomLit(r), [cx, cy] = centroid(r.pts), sel = o.sel === "room:" + r.id;
    const at = plan ? `data-go="rum:${esc(r.id)}" tabindex="0" role="link" aria-label="${esc(t("Åbn {room}", { room: r.name }))}"` : `data-he="room:${esc(r.id)}"`;
    s += `<polygon points="${pts(r.pts)}" class="sec-room${lit ? " lit" : ""}${sel ? " sel" : ""}" ${at}/>${lit ? `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="80" fill="url(#hx-lit-${m})" class="sx-glow" pointer-events="none"/>` : ""}`;
  });
  const litRooms = new Set();
  if (plan) H.rooms.forEach((r) => (!Ls || Ls.has("lys")) && roomLit(r) && litRooms.add(r.id));
  const lbls = H.rooms
    .map((r) => {
      const [cx, cy] = centroid(r.pts);
      return `<text x="${f1(cx)}" y="${f1(cy + 7)}" class="sec-lbl rlbl${litRooms.has(r.id) ? " lit" : ""}${r.pts.length > 4 && r.pts.length > 6 ? " sm" : ""}" text-anchor="middle" pointer-events="none">${esc(r.name)}</text>`;
    })
    .join("");
  const vis = (it) => !plan || !Ls || HT[it.type][4] === "ude" || Ls.has(HT[it.type][4]);
  const I = H.items.filter(vis);
  I.filter((i) => i.type === "furn" && i.fk === "rug").forEach((i) => (s += hObj(i, o)));
  I.filter((i) => i.type === "furn" && i.fk !== "rug").forEach((i) => (s += hObj(i, o)));
  H.walls.forEach((w) => {
    const k = w.k || "int", sel = o.sel === "wall:" + w.id || o.msel?.has("wall:" + w.id);
    s += `<line x1="${w.a[0]}" y1="${w.a[1]}" x2="${w.b[0]}" y2="${w.b[1]}" class="hx-wall k-${esc(k)}${sel ? " sel" : ""}"${plan ? ` pointer-events="none"` : ` data-he="wall:${esc(w.id)}"`}/>`;
    if (k === "hedge" || k === "fence") s += `<line x1="${w.a[0]}" y1="${w.a[1]}" x2="${w.b[0]}" y2="${w.b[1]}" class="hx-${k}2"/>`;
  });
  s += lbls;
  I.filter((i) => i.type === "tree" || i.type === "bush").forEach((i) => (s += hObj(i, o)));
  I.filter((i) => OPENING.has(i.type)).forEach((i) => (s += hOpening(i, o)));
  I.filter((i) => i.type === "solar" || i.type === "battery").forEach((i) => (s += hObj(i, o)));
  I.filter((i) => i.type === "car").forEach((i) => (s += hObj(i, o)));
  I.filter((i) => i.type === "car" && i.chg).forEach((i) => (s += cableSvg(i, H.items.find((c) => c.id === i.chg), plan)));
  I.filter((i) => i.type === "charger").forEach((i) => (s += hObj(i, o)));
  I.filter((i) => i.type === "light").forEach((i) => (s += hObj(i, o)));
  I.filter((i) => (i.type === "tv" || i.type === "speaker") && i.w).forEach((i) => (s += hObj(i, o)));
  I.filter((i) => !OPENING.has(i.type) && !isObj(i)).forEach((i) => (s += hMarker(i, o)));
  return s;
}

/* ------------------------------------------------------------------ the live plan */
let popId = null;

/* Show an item's card on the plan (an event in Sikkerhed, "Seneste døgn"). */
export function openPop(id) {
  popId = id;
}
export const itemForEntity = (ctx, ent) => houseModel(ctx).items.find((i) => i.ent === ent || i.lock === ent);

/* ---- for the room pages (the prototype's pRoomPage): the room on the drawing, and what stands in it */
const roomOfId = (H, id) => (H.rooms || []).find((r) => r.id === id);
/* The light sources placed in the room in Husbyggeren, in drawing order. */
export function roomLightItems(ctx, roomId) {
  const H = houseModel(ctx), r = roomOfId(H, roomId);
  if (!r || !r.pts) return [];
  return H.items.filter((i) => (i.type === "light" || i.type === "lamp") && roomAt(H, i.x, i.y) === r);
}
/* The little drawing of the room ("På tegningen") and how many pieces of furniture are in it. */
export function roomPlan(ctx, roomId) {
  C = ctx;
  const H = houseModel(ctx), r = roomOfId(H, roomId);
  if (!r || !r.pts) return null;
  LV = {};
  H.items.forEach((it) => (LV[it.id] = liveOf(it)));
  const xs = r.pts.map((p) => p[0]), ys = r.pts.map((p) => p[1]), pad = 50;
  const vb = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
  const furn = H.items.filter((i) => i.type === "furn" && roomAt(H, i.x, i.y) === r).length;
  const inner = houseSvg(H, { mode: "mini", layers: new Set(["sikkerhed", "lys", "medier", "netvaerk", "klima", "apparater", "indretning", "energi"]) })
    .replace(/\sdata-(h[eir]|act|go|id|k)="[^"]*"/g, "")
    .replace(/\s(role|tabindex)="[^"]*"/g, "");
  return { furn, svg: `<svg viewBox="${vb.map(f1).join(" ")}" class="rp-plan" aria-hidden="true">${inner}<polygon points="${r.pts.map((p) => p.join(",")).join(" ")}" class="rp-focus"/></svg>` };
}
/* What stands in the room ("I rummet"): one row per device, like the prototype's rows, with its control. */
export function roomThings(ctx, roomId) {
  C = ctx;
  const H = houseModel(ctx), r = roomOfId(H, roomId);
  if (!r || !r.pts) return [];
  LV = {};
  H.items.forEach((it) => (LV[it.id] = liveOf(it)));
  const its = H.items.filter((i) => i.type !== "light" && i.type !== "lamp" && roomAt(H, i.x, i.y) === r && !["furn", "tree", "bush"].includes(i.type));
  return its.map((it) => {
    const [, ic, col] = HT[it.type] || ["", "plug", "#64748B"];
    const [txt, cls] = hState(it);
    const L = lv(it), id_ = esc(it.id);
    let ctl = "";
    if (it.type === "speaker" && L.ent && L.s && L.s.state !== "off" && L.s.state !== "unavailable") ctl = `<button class="rp-b" data-act="house-media" data-id="${id_}" aria-label="${esc(L.play ? t("Pause") : t("Afspil"))}">${svg(L.play ? "pause" : "play")}</button>`;
    else if (it.type === "tv" && L.ent) ctl = `<button class="rp-tg${L.on ? " on" : ""}" data-act="house-power" data-id="${id_}" aria-pressed="${!!L.on}" aria-label="${esc(t("Tænd eller sluk {name}", { name: it.name }))}"><i></i></button>`;
    else if (it.type === "port" && L.ent && L.ent.startsWith("cover.")) ctl = `<button class="rp-b" data-act="house-cover" data-id="${id_}">${esc(L.open ? t("Luk") : t("Åbn"))}</button>`;
    else if (it.type === "camera" && L.ent) ctl = `<button class="rp-b" data-act="${C.acts["sec-cam"] ? "sec-cam" : "house-cam"}" data-id="${esc(C.acts["sec-cam"] ? L.ent : it.id)}" aria-label="${esc(t("Åbn kamera ›"))}">${svg("camera")}</button>`;
    const icon = APK.has(it.type) ? `<span class="hz-apic">${planArt(it.type, L)}</span>` : svg(ic);
    return `<div class="rp-row st-${cls || "none"}" style="--hc:${col}"><span class="rp-ic">${icon}</span><div><b>${esc(it.name)}</b><small>${esc(txt)}</small></div>${ctl}</div>`;
  });
}

export function housePlan(ctx, opts = {}) {
  C = ctx;
  const H = houseModel(ctx);
  if (!H.rooms.length && !H.walls.length) {
    return `<div class="hp-empty card">${svg("house", "ic big")}<h3>${esc(t("Huset er ikke tegnet endnu"))}</h3><p class="t-sub">${esc(t("Tegn jeres hus i Husbyggeren. Så kan I se døre, vinduer, lys og enheder på planen."))}</p>${
      ctx.isParent && ctx.on("house") ? `<button class="btn" data-go="husbygger">${svg("edit")}${esc(t("Åbn Husbyggeren"))}</button>` : ""
    }</div>`;
  }
  LV = {};
  H.items.forEach((it) => (LV[it.id] = liveOf(it)));
  const vb = hBox(H);
  const layers = opts.layers ? new Set(opts.layers) : null;
  const style = opts.height ? ` style="max-height:${typeof opts.height === "number" ? opts.height + "px" : opts.height}"` : "";
  const pop = popId ? hPop(H, popId, vb) : "";
  if (popId && !pop) popId = null;
  return `<div class="hp-plan sec-scroll${opts.compact ? " compact" : ""}"><div class="sx-stage hp-stage"><svg class="sec-plan" viewBox="${vb.map(f1).join(" ")}" role="img" aria-label="${esc(t("Grundplan for {name}", { name: H.name || t("huset") }))}"${style}><rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" rx="24" class="sec-ground" data-act="house-pop-close"/>${houseSvg(H, { mode: "plan", layers })}</svg>${pop}</div></div>`;
}

/* A sensor of a device class on the same device, e.g. the smoke alarm's battery. */
function sibling(ent, dc) {
  const dev = ent && C.hass.entities?.[ent]?.device_id;
  if (!dev) return null;
  const id = Object.keys(C.hass.entities).find((e) => e !== ent && C.hass.entities[e].device_id === dev && C.hass.states[e]?.attributes?.device_class === dc);
  return id ? C.hass.states[id] : null;
}

function hPop(H, id, vb) {
  const it = H.items.find((i) => i.id === id);
  if (!it) return "";
  const L = lv(it), [n, ic, col] = HT[it.type], [txt, cls] = hState(it), rm = roomAt(H, it.x, it.y);
  const lx = ((it.x - vb[0]) / vb[2]) * 100, ly = ((it.y - vb[1]) / vb[3]) * 100;
  const pos = `left:${Math.max(4, Math.min(96, lx)).toFixed(1)}%;top:${ly.toFixed(1)}%`, below = ly < 34, edge = lx < 22 ? " l" : lx > 78 ? " r" : "";
  const id_ = esc(it.id);
  const big = (on, icon, title, sub, act, warn = false) => `<button class="hp-big${on ? " on" : warn ? " warn" : ""}" data-act="${act}" data-id="${id_}">${svg(icon)}<span><b>${esc(title)}</b><small>${esc(sub)}</small></span><i class="hp-sw"></i></button>`;
  const row = (k, v) => `<div class="hp-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
  let body = "";
  const T = it.type;
  if (T === "door" || T === "window") {
    body = L.s ? row(L.open ? t("Åbnet") : t("Sidst ændret"), lastText(L.s)) : "";
    if (it.lockOn && it.lock) body += big(L.locked, "lock", L.locked ? t("Låst") : t("Ulåst"), L.locked ? t("Tryk for at låse op") : t("Tryk for at låse"), "house-lock", !L.locked);
    else body += `<div class="hp-row"><span>${esc(t("Lås"))}</span><b class="t-sub">${esc(T === "door" ? t("Ingen lås på døren") : t("Ingen lås på vinduet"))}</b></div>`;
  } else if (T === "port") {
    body = L.ent?.startsWith("cover.") ? big(!L.open, "garage", L.open ? t("Åben") : t("Lukket"), L.open ? t("Tryk for at lukke") : t("Tryk for at åbne"), "house-cover", L.open) : "";
    if (L.moving) body += `<button class="btn soft sm" data-act="house-cover-stop" data-id="${id_}">${svg("pause")}${esc(t("Stop"))}</button>`;
  } else if (T === "camera") {
    const pic = L.s?.attributes?.entity_picture;
    body = `<button class="hp-cam" data-act="${C.acts["sec-cam"] && L.ent ? "sec-cam" : "house-cam"}" data-id="${esc(C.acts["sec-cam"] && L.ent ? L.ent : it.id)}">${camScene(C, it)}${pic && L.s.state !== "unavailable" ? `<img src="${esc(pic)}" alt="" loading="lazy" onerror="this.remove()">` : ""}<span class="cam-live"><i></i>LIVE</span><span class="hp-open">${esc(t("Åbn kamera ›"))}</span></button>`;
  } else if (T === "speaker" || T === "tv") {
    if (L.ent) {
      body = L.title
        ? `<div class="hp-now">${L.pic ? `<img class="hp-art" src="${esc(L.pic)}" alt="">` : `<span class="hp-art">${svg("music")}</span>`}<span><b>${esc(L.title)}</b><small>${esc(L.artist)}</small></span><button class="hp-pl" data-act="house-media" data-id="${id_}" aria-label="${esc(L.play ? t("Pause") : t("Afspil"))}">${svg(L.play ? "pause" : "play")}</button></div>`
        : "";
      if (T === "tv") body += big(L.on, "tv", L.on ? t("Tændt") : t("Slukket"), L.on ? t("Tryk for at slukke") : t("Tryk for at tænde"), "house-power");
      if (L.vol != null) body += `<label class="hp-vol">${svg("speaker")}<input type="range" min="0" max="100" value="${L.vol}" data-in="house-vol" data-id="${id_}" aria-label="${esc(t("Lydstyrke"))}"><b class="num">${L.vol}</b></label>`;
      if (C.on("music") && C.views.musik) body += `<button class="lnk" data-go="musik">${esc(t("Åbn i Musik ›"))}</button>`;
    } else body = `<p class="t-sub" style="margin:0">${esc(t("Ikke koblet til en entitet endnu. Det gøres i Husbyggeren."))}</p>`;
  } else if (T === "lamp" || T === "light") {
    if (L.ent) {
      body = big(L.on, "bulb", L.on ? t("Tændt") : t("Slukket"), t(LIGHTK[it.lk] ? LIGHTK[it.lk][0] : "Lyskilde"), "house-light");
      if (L.dim && L.ent.startsWith("light.")) body += `<label class="hp-vol">${svg("sun")}<input type="range" min="1" max="100" value="${L.on ? L.bri : 80}" data-in="house-bri" data-id="${id_}" aria-label="${esc(t("Lysstyrke"))}"><b class="num">${L.on ? L.bri : 80}</b></label>`;
      const fxList = (L.s?.attributes?.effect_list || []).filter((x) => !/^(none|off|solid)$/i.test(x));
      if (L.rgb) body += `<div class="hp-cols">${LCOLS.map((c) => `<button data-act="house-lcol" data-id="${id_}" data-c="${c}" style="--c:${c}" aria-pressed="${L.color?.toUpperCase() === c}" aria-label="${esc(t("Farve"))}"></button>`).join("")}${fxList.length ? `<button class="hp-fx${L.fx ? " on" : ""}" data-act="house-lfx" data-id="${id_}">${esc(t("Farveskift"))}</button>` : ""}</div>`;
    } else body = `<p class="t-sub" style="margin:0">${esc(t("Ikke koblet til en entitet endnu. Det gøres i Husbyggeren."))}</p>`;
  } else if (T === "motion") body = L.s ? row(t("Sidste bevægelse"), L.live ? t("lige nu") : lastText(L.s)) : "";
  else if (T === "smoke" || T === "leak") {
    const bat = sibling(L.ent, "battery");
    body = (bat ? row(t("Batteri"), C.hass.formatEntityState ? C.hass.formatEntityState(bat) : `${bat.state} %`) : "") + (L.s ? row(t("Sidst ændret"), lastText(L.s)) : "");
  } else if (T === "temp" || T === "ap") body = L.s ? row(t("Sidst ændret"), lastText(L.s)) : "";
  else if (T === "car") {
    body = L.soc != null ? `<div class="hp-soc"><span><i style="width:${Math.max(0, Math.min(100, L.soc))}%"></i></span><b class="num">${Math.round(L.soc)} %</b></div>` : "";
    if (L.cable) body += row(t("Ladning"), t(CABLE[L.cable][0]));
    const sum = L.ev && Object.keys(C.hass.entities || {}).find((e) => e.endsWith("_summary") && C.hass.entities[e].device_id === C.hass.entities[L.ev]?.device_id);
    if (sum && C.hass.states[sum]) body += row("EV Planner", C.hass.states[sum].state);
    if (it.lock) body += big(L.locked, "lock", L.locked ? t("Låst") : t("Ulåst"), L.locked ? t("Tryk for at låse op") : t("Tryk for at låse"), "house-lock", !L.locked);
    if (L.ev) body += `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px"><button class="lnk" data-act="en-car" data-id="${esc(L.ev)}">${esc(t("Åbn i EV Planner ›"))}</button></div>`;
    else if (!it.presence && !it.battery && !it.plug) body += `<p class="t-sub" style="margin:0">${esc(t("Vælg bilens entiteter i Husbyggeren."))}</p>`;
  } else if (T === "charger") {
    const cars = CUR.items.filter((i) => i.type === "car" && i.chg === it.id);
    body = cars.length ? cars.map((c) => row(c.name, lv(c).home ? t(CABLE[cableState(c, true)][0]) : t("Ude"))).join("") : `<p class="t-sub" style="margin:0">${esc(t("Ingen biler koblet til laderen."))}</p>`;
  } else if (T === "solar" || T === "battery") body = L.s ? row(t("Sidst ændret"), lastText(L.s)) : "";
  else if (APK.has(T)) {
    if (ROBOT.has(T) && L.ent && /^(vacuum|lawn_mower)\./.test(L.ent)) body = big(L.run, HT[T][1], L.run ? t("Kører") : t("I ladestation"), L.run ? t("Tryk for at sende den hjem") : t("Tryk for at starte"), "house-robot");
    if (L.facts?.length) body += L.facts.slice(0, 4).map(([k, v]) => row(k, v)).join("");
    else if (L.s) body += row(t("I Home Assistant nu"), L.text || L.s.state);
    const bat = ROBOT.has(T) && (L.s?.attributes?.battery_level != null ? { state: L.s.attributes.battery_level } : sibling(L.ent, "battery"));
    if (bat) body += row(t("Batteri"), `${Math.round(num(bat.state))} %`);
    if (C.on("appliances") && C.views.apparater) body += `<button class="lnk" data-go="apparater">${esc(t("Åbn i Apparater ›"))}</button>`;
  }
  return `<div class="hm-pop${below ? " below" : ""}${edge}" style="${pos};--hc:${col}" role="dialog" aria-label="${esc(it.name)}"><div class="hp-h"><span class="hp-ic">${svg(ic)}</span><div><b>${esc(it.name)}</b><small>${esc(t(it.type === "furn" && FURN[it.fk] ? FURN[it.fk][0] : n))}${rm ? ` · ${esc(rm.name)}` : ""}</small></div><button class="hp-x" data-act="house-pop-close" aria-label="${esc(t("Luk"))}">${svg("x")}</button></div>
    ${txt ? `<div class="hp-st st-${cls || "none"}"><i></i>${esc(txt)}</div>` : ""}${body}<div class="hp-ent">${esc(L.ent || t("Ingen entitet"))}${C.isParent && C.on("house") ? ` · <button class="lnk" data-act="house-edit" data-id="${id_}">${esc(t("Redigér"))}</button>` : ""}</div></div>`;
}

/* ------------------------------------------------------------------ the Husbygger */
let HZ = null;
const HB_TOOLS = [["vaelg", "Vælg og flyt", "cursor"], ["rum", "Rum", "room"], ["vaeg", "Væg", "wall"]];
const GARDEN_F = ["gset", "gtable", "lounge", "lounger", "parasol", "pizza", "weber", "grill", "firepit", "tramp", "sandbox", "raised", "playhouse", "swing", "shed", "bins"];
const HZ_GROUPS = [
  ["tegn", "Tegn", ["vaelg", "rum", "vaeg"]],
  ["ude", "Have og udearealer", ["ude:lawn", "ude:tiles", "ude:deck", "ude:bed", "ude:drive", "ude:gravel", "vaeg:hedge", "vaeg:fence", "tree", "bush", "light:garden", ...GARDEN_F.map((k) => "furn:" + k)]],
  ["sik", "Sikkerhed og sensorer", ["door", "window", "port", "camera", "motion", "smoke", "leak", "temp", "ap"]],
  ["lys", "Lys", Object.keys(LIGHTK).filter((k) => k !== "garden").map((k) => "light:" + k).concat(["lamp"])],
  ...FCATS.map(([c, n]) => ["f-" + c, n, furnIn(c).filter((k) => c === "gar" || !GARDEN_F.includes(k)).map((k) => "furn:" + k)]),
  ["med", "TV og højttalere", ["tvset", "soundbar", "spkbox", "tv", "speaker"]],
  ["app", "Apparater", [...APK]],
  ["en", "Biler og energi", ["car", "charger", "solar", "battery"]],
];
const isPlace = (x) => !!x && (!!HT[tt(x)] || !!XTOOLS[x]);
const toolType = (x) => (XTOOLS[x] ? XTOOLS[x][1] : tt(x));
const hbId = (p) => p + Math.random().toString(36).slice(2, 7);
const $ = (id) => C.$(id);

function hbInit(ctx) {
  const base = JSON.stringify(ctx.data.house || {});
  if (HZ && (HZ.dirty || HZ.base === base)) return;
  const d = houseModel(ctx);
  HZ = { open: new Set(["tegn"]), d, base, sel: null, msel: new Set(), multiMode: false, tool: "vaelg", view: hBox(d), snap: true, hist: [], fut: [], dirty: false, chain: null, chainPts: null, hover: null, pend: null, corner: null, grp: "tegn", fitted: false, save: "ok" };
}
const hbFind = (key) => {
  if (!key || !HZ) return null;
  const i = key.indexOf(":"), k = key.slice(0, i), id = key.slice(i + 1), D = HZ.d;
  return k === "item" ? D.items.find((x) => x.id === id) : k === "room" ? D.rooms.find((x) => x.id === id) : k === "wall" ? D.walls.find((x) => x.id === id) : k === "area" ? D.areas.find((x) => x.id === id) : null;
};
function hbPush() {
  HZ.hist.push(JSON.stringify(HZ.d));
  if (HZ.hist.length > 80) HZ.hist.shift();
  HZ.fut = [];
  markDirty();
}
/* Every change is saved by itself a moment later, so nothing is lost when the page is closed or reloaded. */
let saveTimer = null;
function markDirty() {
  HZ.dirty = true;
  HZ.save = "wait";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => hbSave(), 1200);
  saveBadge();
}
function flushSave() {
  if (!HZ?.dirty || !saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  hbSave();
}
const saveHtml = () =>
  HZ.save === "err"
    ? `<span class="hz-save err">${svg("bell")}${esc(t("Ikke gemt"))}</span><button class="btn sm" data-hz="save">${esc(t("Prøv igen"))}</button>`
    : HZ.save === "busy" || HZ.save === "wait"
      ? `<span class="hz-save busy">${svg("clock")}${esc(t("Gemmer…"))}</span>`
      : `<span class="hz-save">${svg("check")}${esc(t("Alt er gemt"))}</span>`;
function saveBadge() {
  const el = C?.root?.querySelector(".hz-savebox");
  if (el) el.innerHTML = saveHtml();
}

function toolInfo(id) {
  const [b, sub] = id.split(":"), mini = (inner, vb = "-32 -32 64 64") => `<svg viewBox="${vb}" class="hz-mini">${inner}</svg>`;
  if (b === "ude") return [t(AREAK[sub]), `<span class="hz-sw k-${sub}"></span>`];
  if (b === "vaeg" && sub) return [sub === "hedge" ? t("Hæk") : t("Hegn"), mini(`<line x1="-26" y1="0" x2="26" y2="0" class="hx-wall k-${sub}"/><line x1="-26" y1="0" x2="26" y2="0" class="hx-${sub}2"/>`)];
  if (b === "furn") {
    const [n, wc, dc] = FURN[sub], k = 54 / Math.max(wc, dc);
    return [t(n), mini(furnSvg(sub, wc * k, dc * k))];
  }
  if (b === "light") {
    const [n] = LIGHTK[sub];
    return [t(n), mini(lightSvg({ lk: sub, id: "ic" + sub, w: sub === "strip" ? 54 : sub === "spot" || sub === "rgb" ? 22 : 40, h: sub === "strip" ? 6 : undefined }, false))];
  }
  if (XTOOLS[id]) return [t(XTOOLS[id][0]), svg(XTOOLS[id][1])];
  if (id === "tv") return [t("TV-markør"), svg("tv")];
  if (id === "speaker") return [t("Højttaler-markør"), svg("speaker")];
  if (id === "lamp") return [t("Lampe-markør"), svg("bulb")];
  const ht = HB_TOOLS.find((x) => x[0] === id);
  if (ht) return [t(ht[1]), svg(ht[2])];
  return [HT[id] ? t(HT[id][0]) : id, svg(HT[id] ? HT[id][1] : "plus")];
}
const hzTool = (id) => {
  const [lbl, ic] = toolInfo(id), ht = HT[toolType(id)];
  return `<button class="hz-tool" data-hz="tool" data-id="${id}" aria-pressed="${(HZ.pend ? HZ.pend.type : HZ.tool) === id}" ${ht ? `style="--hc:${ht[2]}"` : ""} title="${esc(lbl)}">${ic}<span>${esc(lbl)}</span></button>`;
};
function hzPalM() {
  const g = HZ_GROUPS.find((x) => x[0] === HZ.grp) || HZ_GROUPS[0];
  return `<div class="hz-pal-m"><div class="hz-gchips">${HZ_GROUPS.map(([k, n]) => `<button data-hz="grp" data-id="${k}" aria-pressed="${g[0] === k}">${esc(t(n))}</button>`).join("")}</div><div class="hz-tl">${g[2].map(hzTool).join("")}</div></div>`;
}
function hzPalette() {
  return `<aside class="hz-tools" aria-label="${esc(t("Værktøjer"))}">${hzPalM()}${HZ_GROUPS.map(([g, n, ids]) => `<details class="hz-tg hz-pal-d" data-g="${g}" ${HZ.open.has(g) ? "open" : ""}><summary>${esc(t(n))}</summary><div class="hz-tl">${ids.map(hzTool).join("")}</div></details>`).join("")}</aside>`;
}
function hbHint() {
  if (HZ.pend) return t("Tryk på planen for at placere {name}.", { name: HZ.pend.name });
  if (isPlace(HZ.tool)) {
    const lbl = toolInfo(HZ.tool)[0].toLowerCase();
    if (OPENING.has(HZ.tool)) return t("Tryk på en væg for at sætte {what} i. Den lægger sig ind i væggen.", { what: lbl });
    if (isObj({ type: toolType(HZ.tool), w: XTOOLS[HZ.tool] ? 1 : 0 }) || tt(HZ.tool) === "furn" || tt(HZ.tool) === "light") return t("Tryk på planen for at placere {what}. Træk i hjørnet for størrelse og i den runde knap for at dreje.", { what: lbl });
    return t("Tryk på planen for at placere {what}.", { what: lbl });
  }
  if (HZ.tool.startsWith("ude:")) return t("Træk et rektangel for {what}. Bagefter kan du trække i hjørnerne og tilføje knæk.", { what: t(AREAK[HZ.tool.slice(4)]).toLowerCase() });
  if (HZ.tool === "rum") return t("Træk et rektangel for at tegne et rum. Væggene kommer med af sig selv.");
  if (HZ.tool.startsWith("vaeg")) {
    const what = HZ.tool === "vaeg:hedge" ? t("hækken") : HZ.tool === "vaeg:fence" ? t("hegnet") : t("væggen");
    return HZ.chain
      ? HZ.chainPts?.length >= 3 && HZ.tool === "vaeg"
        ? t("Tryk for næste hjørne. Tryk på startpunktet for at lukke rummet. Esc eller Færdig for at stoppe.")
        : t("Tryk for næste hjørne. Den fanger andre vægges ender. Esc, Enter eller Færdig for at stoppe.")
      : t("Tryk der, hvor {what} starter. Den fanger andre vægges ender og hjørner.", { what });
  }
  if (HZ.multiMode) return t("Tryk på ting for at markere flere, eller træk en ramme om dem.");
  return t("Træk i ting for at flytte dem. Shift-klik eller træk med Shift for at markere flere. Hold Alt nede for at placere frit.");
}
const hintHtml = () =>
  `<span>${esc(hbHint())}</span>${HZ.chain ? `<button class="btn sm" data-hz="endwall">${esc(t("Færdig"))}</button>` : HZ.pend || HZ.tool !== "vaelg" ? `<button class="btn soft sm" data-hz="tool" data-id="vaelg">${esc(t("Annullér"))}</button>` : ""}`;

function pHouse() {
  const D = HZ.d;
  return `<div class="hz">
  <section class="hz-top"><div><span class="eyebrow">${esc(t("Husbygger"))}${D.name ? ` · ${esc(D.name)}` : ""}</span><h2 class="h2">${esc(t("Byg huset"))}</h2><span class="hz-sync">${svg("users")}${esc(t("Gemmes af sig selv i Home Assistant, så hele familien ser den samme tegning"))}</span></div>
    <div class="hz-acts"><span class="hz-savebox">${saveHtml()}</span><button class="iconbtn" data-hz="undo" aria-label="${esc(t("Fortryd"))}" title="${esc(t("Fortryd"))} (Ctrl/⌘ Z)" ${HZ.hist.length ? "" : "disabled"}>${svg("undo")}</button><button class="iconbtn" data-hz="redo" aria-label="${esc(t("Gentag"))}" title="${esc(t("Gentag"))} (Ctrl/⌘ ⇧ Z)" ${HZ.fut.length ? "" : "disabled"}>${svg("redo")}</button>
      ${C.on("security") && C.views.sikkerhed ? `<button class="btn soft" data-hz="leave">${esc(t("Til Sikkerhed"))}</button>` : ""}</div></section>
  <div class="hz-body">
    ${hzPalette()}
    <div class="hz-canvas"><svg id="hz-svg" viewBox="${HZ.view.join(" ")}" aria-label="${esc(t("Tegning af huset"))}"></svg>
      <div class="hz-zoom"><button class="iconbtn" data-hz="zin" aria-label="${esc(t("Zoom ind"))}">${svg("zin")}</button><button class="iconbtn" data-hz="zout" aria-label="${esc(t("Zoom ud"))}">${svg("zout")}</button><button class="iconbtn" data-hz="fit" aria-label="${esc(t("Vis hele huset"))}">${svg("fit")}</button><button class="iconbtn${HZ.snap ? " on" : ""}" data-hz="snap" aria-pressed="${HZ.snap}" aria-label="${esc(t("Fastgør til vægge og gitter"))}" title="${esc(t("Fastgør til vægge og gitter. Hold Alt nede for at placere frit."))}">${svg("grid")}</button><button class="iconbtn${HZ.multiMode ? " on" : ""}" data-hz="multi" aria-pressed="${HZ.multiMode}" aria-label="${esc(t("Markér flere"))}" title="${esc(t("Markér flere: tryk på ting, eller træk en ramme. Med tastatur: hold Shift."))}">${svg("check")}</button></div>
      <div class="hz-hint" id="hz-hint">${hintHtml()}</div></div>
    <aside class="hz-props" id="hz-props">${hbProps()}</aside>
  </div></div>`;
}

/* Entity fields: a search field with a list of matching entities from Home Assistant (name, entity id or area). */
function domList(dom) {
  const doms = String(dom || "").split(",").filter(Boolean);
  return Object.keys(C.hass?.states || {}).filter((id) => !doms.length || doms.includes(id.split(".")[0]));
}
function entInfo(ent, dom) {
  if (!ent) return `<span class="ei warn">${svg("bell")}${esc(t("Ikke koblet til en entitet"))}</span>`;
  const s = C.hass?.states?.[ent];
  if (s) return `<span class="ei ok">${svg("check")}${esc(t("Fundet i Home Assistant · {name}", { name: s.attributes.friendly_name || ent }))}</span>`;
  const doms = String(dom || "").split(",").filter(Boolean);
  if (doms.length && !doms.includes(ent.split(".")[0])) return `<span class="ei bad">${svg("x")}${esc(t("Skal være en {domain}-entitet", { domain: doms.join(" / ") }))}</span>`;
  return `<span class="ei bad">${svg("x")}${esc(t("Findes ikke i Home Assistant"))}</span>`;
}
const fld = (lbl, inner, hint = "") => `<label class="hz-f"><span>${esc(lbl)}</span>${inner}${hint}</label>`;
function entFld(key, val, dom, lbl) {
  return `<div class="hz-f"><span>${esc(lbl || t("Entitet"))}</span><div class="hz-ep"><input data-hf="${key}" data-ep="${esc(dom || "")}" value="${esc(val || "")}" placeholder="${esc(t("Søg på navn, område eller entitet"))}" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false"><div class="hz-epl" role="listbox" hidden></div></div><span class="hz-ei" data-ei="${key}" data-dom="${esc(dom || "")}">${entInfo(val, dom)}</span></div>`;
}
function pickList(input) {
  const box = input.parentElement.querySelector(".hz-epl"), q = input.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
  const exact = C.hass.states[input.value.trim()];
  const rows = domList(input.dataset.ep)
    .map((id) => {
      const st = C.hass.states[id], name = st.attributes.friendly_name || "", area = C.hass.areas?.[C.area(id)]?.name || "", hay = `${id} ${name} ${area}`.toLowerCase();
      if (words.length && !exact && !words.every((w) => hay.includes(w))) return null;
      const score = !words.length ? 0 : (name.toLowerCase().startsWith(q) ? 0 : 1) + (id.toLowerCase().includes(q) ? 0 : 1);
      return [score, name || id, id, area];
    })
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]))
    .slice(0, 60);
  box.innerHTML = rows.length ? rows.map(([, name, id, area], i) => `<button type="button" data-epv="${esc(id)}" role="option"${i === 0 ? ' class="on"' : ""}><b>${esc(name)}</b><small>${esc(id)}${area ? " · " + esc(area) : ""}</small></button>`).join("") : `<div class="none">${esc(t("Ingen entiteter passer"))}</div>`;
  box.hidden = false;
  input.setAttribute("aria-expanded", "true");
}
function pickSet(input, id) {
  input.value = id;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  const box = input.parentElement.querySelector(".hz-epl");
  box.hidden = true;
  input.setAttribute("aria-expanded", "false");
}
function bindPickers(root) {
  root.addEventListener("focusin", (e) => e.target.dataset?.ep != null && pickList(e.target));
  root.addEventListener("input", (e) => e.target.dataset?.ep != null && e.isTrusted && pickList(e.target));
  root.addEventListener("focusout", (e) => {
    if (e.target.dataset?.ep == null) return;
    const box = e.target.parentElement.querySelector(".hz-epl");
    setTimeout(() => (box.hidden = true), 150);
  });
  root.addEventListener("mousedown", (e) => {
    const b = e.target.closest("[data-epv]");
    if (!b) return;
    e.preventDefault();
    pickSet(b.closest(".hz-ep").querySelector("input"), b.dataset.epv);
  });
  root.addEventListener("keydown", (e) => {
    const input = e.target;
    if (input.dataset?.ep == null) return;
    const box = input.parentElement.querySelector(".hz-epl"), opts = [...box.querySelectorAll("[data-epv]")], cur = opts.findIndex((b) => b.classList.contains("on"));
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (box.hidden) return pickList(input);
      const n = Math.max(0, Math.min(opts.length - 1, cur + (e.key === "ArrowDown" ? 1 : -1)));
      opts.forEach((b, i) => b.classList.toggle("on", i === n));
      opts[n]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && !box.hidden && opts[cur]) {
      e.preventDefault();
      pickSet(input, opts[cur].dataset.epv);
    } else if (e.key === "Escape") box.hidden = true;
  });
}
const sel = (f, opts, v) => `<select data-hf="${f}">${opts.map(([k, l]) => `<option value="${esc(k)}" ${String(v ?? "") === String(k) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;

/* Entities in Home Assistant that belong on the plan but aren't placed yet. */
function suggestions() {
  const used = new Set(HZ.d.items.flatMap((i) => [i.ent, i.lock]).filter(Boolean));
  const out = [];
  for (const [id, s] of Object.entries(C.hass?.states || {})) {
    if (used.has(id)) continue;
    const dom = id.split(".")[0], dc = s.attributes.device_class;
    let type = null;
    if (dom === "binary_sensor") type = { door: "door", garage_door: "port", window: "window", opening: "window", motion: "motion", occupancy: "motion", presence: "motion", smoke: "smoke", gas: "smoke", carbon_monoxide: "smoke", moisture: "leak" }[dc] || null;
    else if (dom === "cover" && ["garage", "gate"].includes(dc)) type = "port";
    else if (dom === "camera") type = "camera";
    else if (dom === "media_player") type = dc === "tv" || /tv|apple_tv|chromecast/i.test(id) ? "tv" : "speaker";
    else if (dom === "vacuum") type = "vacuum";
    else if (dom === "lawn_mower") type = "mower";
    if (type) out.push([type, id, s.attributes.friendly_name || id, C.area(id)]);
  }
  // Like the prototype: the sensors of the doors and windows first, then motion, then the other devices.
  const ORDER = ["window", "door", "port", "motion", "smoke", "leak", "camera", "speaker", "tv", "vacuum", "mower"];
  return out.sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]) || a[2].localeCompare(b[2])).slice(0, 40);
}

function hbProps() {
  const D = HZ.d, o = hbFind(HZ.sel), keys = selKeys();
  if (keys.size > 1) {
    const n = (k) => [...keys].filter((x) => x.startsWith(k + ":")).length;
    const parts = [["item", t("ting")], ["room", t("rum")], ["wall", t("vægge")], ["area", t("arealer")]].filter(([k]) => n(k)).map(([k, l]) => `${n(k)} ${l}`);
    return `<div class="hz-pp"><div class="hz-ph"><span class="hz-pi" style="--hc:#6E4AFF">${svg("check")}</span><div><b>${esc(t("{n} valgt", { n: keys.size }))}</b><small>${esc(parts.join(" · "))}</small></div></div>
      <p class="t-sub">${esc(t("Træk i en af dem for at flytte dem alle. Rum tager deres vægge og møbler med. Pilene flytter dem også."))}</p>
      <div class="hz-row2"><button class="btn soft sm" data-hz="dup">${svg("plus")}${esc(t("Dublér"))}</button>${n("item") ? `<button class="btn soft sm" data-hz="rot" data-id="90">↻ 90°</button>` : ""}<button class="btn soft sm" data-hz="clearsel">${esc(t("Fravælg"))}</button></div>
      <div class="hz-row2"><button class="btn soft sm danger-t" data-hz="del">${svg("trash")}${esc(t("Slet {n}", { n: keys.size }))}</button></div></div>`;
  }
  if (!o) {
    const un = suggestions();
    const areas = C.areas();
    const placeable = un.filter((s) => s[3] && D.rooms.some((r) => r.area === s[3])).length;
    return `<div class="hz-ov"><h3>${esc(t("Huset"))}</h3>${fld(t("Navn"), `<input data-hf="hname" value="${esc(D.name)}" placeholder="${esc(t("Fx Hjemme"))}">`)}
      <div class="hz-cnt">${[["room", D.rooms.length, t("rum")], ["wall", D.walls.length, t("vægge")], ["door", D.items.filter((i) => i.type === "door").length, t("døre")], ["window", D.items.filter((i) => i.type === "window").length, t("vinduer")], ["camera", D.items.filter((i) => !OPENING.has(i.type) && i.type !== "furn").length, t("enheder")]].map(([ic, n, l]) => `<span>${svg(ic)}<b class="num">${n}</b>${esc(l)}</span>`).join("")}</div>
      ${areas.length ? `<div class="hz-quick"><b>${esc(t("Kom hurtigt i gang"))}</b><span>${esc(t("Hent jeres områder fra Home Assistant som rum. Rumtypen gættes ud fra navnet, og enheder i områderne kan sættes ind med ét tryk."))}</span><button class="btn sm" data-hz="haimport">${svg("house")}${esc(t("Start fra jeres områder"))}</button></div>` : ""}
      ${un.length ? `<h4>${esc(t("Fra Home Assistant, ikke placeret"))}</h4>${placeable ? `<button class="btn soft sm" data-hz="autoplace" style="margin-bottom:8px">${svg("sparkle")}${esc(t("Placér {n} i deres rum", { n: placeable }))}</button>` : ""}<div class="hz-un">${un.map(([ty, e, n]) => `<button data-hz="pend" data-id="${esc(e)}" style="--hc:${HT[ty][2]}">${svg(HT[ty][1])}<span><b>${esc(n)}</b><small>${esc(e)}</small></span><i>${esc(t("Placér"))}</i></button>`).join("")}</div>` : ""}
      <h4>${esc(t("Sådan bygger du"))}</h4><ol class="hz-how"><li>${esc(t("Tegn rum med Rum. Væggene kommer med."))}</li><li>${esc(t("Ret vægge med Væg, eller træk i deres ender."))}</li><li>${esc(t("Sæt døre, vinduer og porte i væggene, og vælg deres sensor."))}</li><li>${esc(t("Placér kameraer, højttalere, lys og møbler, og kobl dem til en entitet."))}</li><li>${esc(t("Alt gemmes af sig selv. Planen bruger tegningen med det samme."))}</li></ol>
      <div class="hz-keys"><span><kbd>Ctrl/⌘ Z</kbd> ${esc(t("fortryd"))} · <kbd>⇧</kbd>+<kbd>Z</kbd> ${esc(t("gentag"))}</span><span><kbd>Delete</kbd> ${esc(t("slet"))} · <kbd>Esc</kbd> ${esc(t("stop eller fravælg"))}</span><span><kbd>← ↑ → ↓</kbd> ${esc(t("flyt"))} (<kbd>⇧</kbd> ${esc(t("langt"))}, <kbd>Alt</kbd> ${esc(t("fint"))})</span><span><kbd>⇧</kbd>+${esc(t("klik eller træk"))}: ${esc(t("markér flere"))} · <kbd>Alt</kbd> ${esc(t("hold nede: placér frit"))}</span><span><kbd>,</kbd> <kbd>.</kbd> ${esc(t("drej"))} · <kbd>Ctrl/⌘ D</kbd> ${esc(t("dublér"))}</span></div>
      <div class="hz-reset"><div class="hz-io"><button class="btn soft sm" data-hz="export">${svg("share")}${esc(t("Gem som fil"))}</button><button class="btn soft sm" data-hz="copy">${svg("share")}${esc(t("Kopiér tegningen"))}</button><button class="btn soft sm" data-hz="import">${svg("plus")}${esc(t("Indsæt en tegning"))}</button><label class="btn soft sm hz-up">${svg("plus")}${esc(t("Hent fra fil"))}<input type="file" accept="application/json,.json" data-hzfile="1" hidden></label></div><button class="btn soft sm" data-hz="blank">${esc(t("Start på en tom tegning"))}</button></div></div>`;
  }
  const k = HZ.sel.split(":")[0];
  const del = `<button class="btn soft sm danger-t" data-hz="del">${svg("trash")}${esc(t("Slet"))}</button>`;
  if (k === "room") {
    const kids = C.children();
    let meta = fld(t("Rumtype"), sel("rtype", RTYPES.map(([a, b]) => [a, t(b)]), o.rtype || guessType(o.name)), `<span class="t-sub" style="font-size:11.5px">${esc(t("Bestemmer, hvordan rummet tegnes, når det åbnes."))}</span>`);
    if ((o.rtype || guessType(o.name)) === "kid")
      meta += `<div class="hz-lock">${fld(t("Barn"), sel("kid", [["", t("Intet barn valgt")], ...kids.map((m) => [m.id, m.name])], o.kid || ""))}${fld(t("Alder"), sel("age", AGES.map(([a, n, y]) => [a, `${t(n)} · ${t(y)}`]), o.age || "child"))}<div class="hz-f" style="margin:0"><span>${esc(t("Stil"))}</span><div class="seg">${GSTYLES.map(([a, n]) => `<button data-hz="rstyle" data-id="${a}" aria-pressed="${(o.style || "neutral") === a}">${esc(t(n))}</button>`).join("")}</div></div></div>`;
    if ((o.rtype || guessType(o.name)) === "kid" || ART_IDS.includes(o.art)) {
      meta += fld(t("Tegning"), sel("art", [["", t("Tegnes ud fra alder og stil")], ...ART_IDS.map((a) => [a, t(ART[a].name)])], o.art || ""), `<span class="t-sub" style="font-size:11.5px">${esc(t("Vælg en af de håndtegnede værelser."))}</span>`);
      if (ART_IDS.includes(o.art)) {
        const lights = C.entities("light");
        const near = o.area ? lights.filter((id) => C.area(id) === o.area) : [];
        const opts = [["", t("Automatisk")], ...near.map((id) => [id, C.name(id)]), ...lights.filter((id) => !near.includes(id)).map((id) => [id, `${C.name(id)} · ${id}`])];
        meta += `<div class="hz-lock">${ART[o.art].slots.map(([id, , , lbl]) => fld(t(lbl), sel("lamp:" + id, opts, o.lamps?.[id] || ""))).join("")}</div>`;
      }
    }
    meta += fld(t("Område i Home Assistant"), sel("area", [["", t("Intet område")], ...C.areas().map((a) => [a.area_id, a.name])], o.area || ""), `<span class="t-sub" style="font-size:11.5px">${esc(t("Lys og enheder i området vises, når rummet åbnes."))}</span>`);
    meta += `<div class="hz-f"><span>${esc(t("Billede af rummet"))}</span><div class="hz-row2" style="margin:0"><label class="btn soft sm hz-up">${svg("camera")}${esc(o.img ? t("Skift billede") : t("Brug eget billede"))}<input type="file" accept="image/*" data-hzimg="${esc(o.id)}" hidden></label>${o.img ? `<button class="btn soft sm" data-hz="noimg">${esc(t("Brug tegningen"))}</button>` : ""}</div><span class="t-sub" style="font-size:11.5px">${esc(o.img ? t("Eget billede.") : t("Tegnes ud fra rumtypen, til I lægger et eget billede ind."))}</span></div>`;
    const saved = (C.data.house?.rooms || []).some((x) => x.id === o.id);
    return `<div class="hz-pp"><div class="hz-ph"><span class="hz-pi" style="--hc:#6E4AFF">${svg("room")}</span><div><b>${esc(t("Rum"))}</b><small>${esc(t("{n} hjørner", { n: o.pts.length }))} · ${esc(roomArea(o))}</small></div></div>
      ${fld(t("Navn"), `<input data-hf="name" value="${esc(o.name)}">`)}${meta}${entFld("light", o.light, "light,switch", t("Lys i rummet"))}
      <div class="hz-row2"><button class="btn soft sm" data-hz="furnish">${svg("sofa")}${esc(t("Møblér rummet"))}</button>${saved && C.views.rum ? `<button class="btn soft sm" data-hz="openroom">${svg("go")}${esc(t("Åbn rummet"))}</button>` : ""}</div>
      <div class="hz-row2"><button class="btn soft sm" data-hz="addcorner">${svg("plus")}${esc(t("Tilføj knæk"))}</button><button class="btn soft sm" data-hz="delcorner" ${o.pts.length > 3 ? "" : "disabled"}>${esc(t("Fjern hjørne"))}</button></div>
      <p class="t-sub">${esc(t("Træk i hjørnerne for at ændre formen. Træk i rummet for at flytte det."))}</p><div class="hz-row2">${del}</div></div>`;
  }
  if (k === "wall") {
    const len = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
    return `<div class="hz-pp"><div class="hz-ph"><span class="hz-pi" style="--hc:#334155">${svg("wall")}</span><div><b>${esc(t("Væg"))}</b><small class="num">${esc(t("{m} m på tegningen", { m: C.fmt.num(len / PX_M, 2) }))}</small></div></div>
      <div class="hz-f"><span>${esc(t("Slags"))}</span><div class="seg">${[["ext", t("Ydervæg")], ["int", t("Indervæg")], ["open", t("Åben side")], ["hedge", t("Hæk")], ["fence", t("Hegn")]].map(([v, n]) => `<button data-hz="wallk" data-id="${v}" aria-pressed="${(o.k || "int") === v}">${esc(n)}</button>`).join("")}</div></div>
      ${(() => {
        const on = D.items.filter((i) => i.wall === o.id).length;
        return on ? `<p class="t-sub">${esc(t("{n} ting sidder på væggen og flytter med.", { n: on }))}</p>` : "";
      })()}
      <p class="t-sub">${esc(t("Træk i enderne for at flytte dem. De klikker fast på andre vægges ender, og rum og vægge, der mødes der, følger med."))}</p><div class="hz-row2">${del}</div></div>`;
  }
  if (k === "area")
    return `<div class="hz-pp"><div class="hz-ph"><span class="hz-pi" style="--hc:#5E8C4E">${svg("tree")}</span><div><b>${esc(t("Udeareal"))}</b><small>${o.pts ? esc(t("{n} hjørner", { n: o.pts.length })) : esc(t("Tekst"))}</small></div></div>
    ${fld(t("Navn"), `<input data-hf="name" value="${esc(o.name)}">`)}${
      o.pts
        ? `<div class="hz-f"><span>${esc(t("Slags"))}</span><div class="hz-kinds">${Object.entries(AREAK).map(([v, n]) => `<button data-hz="areak" data-id="${v}" aria-pressed="${o.kind === v}"><span class="hz-sw k-${v}"></span>${esc(t(n))}</button>`).join("")}</div></div>
    <div class="hz-row2"><button class="btn soft sm" data-hz="addcorner">${svg("plus")}${esc(t("Tilføj knæk"))}</button><button class="btn soft sm" data-hz="delcorner" ${o.pts.length > 3 ? "" : "disabled"}>${esc(t("Fjern hjørne"))}</button></div><p class="t-sub">${esc(t("Træk i hjørnerne for at give arealet form. Et nyt knæk kommer midt på den længste side, eller efter det hjørne, du har valgt."))}</p>`
        : ""
    }<div class="hz-row2">${del}</div></div>`;

  const [n, ic, col, dom] = HT[o.type];
  let ex = "";
  if (isObj(o)) {
    let top = "", bot = "";
    if (o.type === "furn") top += fld(t("Møbel"), sel("fk", Object.entries(FURN).map(([a, v]) => [a, t(v[0])]), o.fk));
    if (o.type === "light") {
      top += fld(t("Slags"), sel("lk", Object.entries(LIGHTK).map(([a, v]) => [a, t(v[0])]), o.lk));
      bot += `<div class="hz-lock"><label class="hz-chk"><input type="checkbox" data-hf="rgb" ${o.rgb ? "checked" : ""}><span><b>${esc(t("Farver (RGBWW)"))}</b><small>${esc(t("Lyskilden kan skifte farve og køre farveskift."))}</small></span></label></div>`;
    }
    if (o.type === "car") {
      top +=
        entFld("presence", o.presence, "device_tracker,person,binary_sensor", t("Hjemme (device tracker)")) +
        entFld("battery", o.battery, "sensor", t("Batteri i %")) +
        entFld("plug", o.plug, "sensor,binary_sensor,switch", t("Ladestatus")) +
        entFld("lock", o.lock, "lock", t("Bilens lås")) +
        fld(t("Ladestik på bilen"), sel("port", Object.entries(PORTS).map(([a, v]) => [a, t(v[0])]), o.port || "bl")) +
        fld(t("Lader"), sel("chg", [["", t("Ingen")], ...HZ.d.items.filter((i) => i.type === "charger").map((c) => [c.id, c.name])], o.chg || ""), `<span class="t-sub" style="font-size:11.5px">${esc(t("Ledningen tegnes fra stikket på bilen til laderen, når bilen er sat til. Bilen vises kun, når den er hjemme."))}</span>`);
      bot += `<div class="hz-f"><span>${esc(t("Farve"))}</span><div class="hz-cols">${CARCOLS.map((c) => `<button data-hz="carcol" data-id="${c}" style="--c:${c}" aria-pressed="${o.col === c}" aria-label="${esc(t("Farve"))}"></button>`).join("")}</div></div>`;
    }
    ex +=
      top +
      `<div class="hz-row3">${fld(t("Bredde"), `<input type="number" min="5" max="5000" value="${Math.round((o.w / PX_M) * 100)}" data-hf="wcm">`, `<small class="t-sub">cm</small>`)}${isRoundObj(o) ? "" : fld(t("Dybde"), `<input type="number" min="3" max="5000" value="${Math.round(((o.h || o.w) / PX_M) * 100)}" data-hf="hcm">`, `<small class="t-sub">cm</small>`)}</div>` +
      fld(t("Drejning"), `<input type="range" min="0" max="359" value="${Math.round(o.rot || 0)}" data-hf="rot">`, `<div class="hz-rots">${[[-90, "↺ 90°"], [-15, "↺ 15°"], [15, "↻ 15°"], [90, "↻ 90°"]].map(([v, l]) => `<button class="btn soft sm" data-hz="rot" data-id="${v}">${l}</button>`).join("")}</div>`) +
      bot +
      `<div class="hz-row2"><button class="btn soft sm" data-hz="dup">${svg("plus")}${esc(t("Dublér"))}</button></div>`;
  }
  if (APK.has(o.type)) {
    const opts = (C.data.appliances || []).filter((a) => a.kind === o.type || o.type === "mower" || o.type === "vacuum");
    if (opts.length) ex += fld(t("Apparat i Hverdagsro"), sel("appl", [["", t("Ikke koblet")], ...opts.map((a) => [a.id, a.name || C.name(a.entity)])], o.appl || ""));
    if (ROBOT.has(o.type)) {
      const zs = [...HZ.d.rooms.map((r) => [r.id, r.name]), ...HZ.d.areas.filter((a) => a.pts).map((a) => [a.id, a.name])];
      ex += fld(o.type === "mower" ? t("Klipper i") : t("Støvsuger i"), sel("zone", [["", t("Der, hvor den står")], ...zs], o.zone || ""), `<span class="t-sub" style="font-size:11.5px">${esc(t("Ladestationen er der, hvor markøren står."))}</span>`);
    }
  }
  if (OPENING.has(o.type)) {
    // The two sides of the wall, named by the room on each side.
    const a = ((o.ang || 0) * Math.PI) / 180, sideName = (sd) => {
      const q = [o.x - Math.sin(a) * sd * 40, o.y + Math.cos(a) * sd * 40], r = roomAt(HZ.d, q[0], q[1]);
      return r ? r.name : t("Udenfor");
    };
    ex +=
      `<div class="hz-row3">${fld(t("Bredde"), `<input type="number" min="25" max="${o.type === "port" ? 1000 : 600}" value="${Math.round((o.w / PX_M) * 100)}" data-hf="wcmo">`, `<small class="t-sub">cm</small>`)}<div></div></div>` +
      `<div class="hz-f" style="margin-top:-6px"><input type="range" min="15" max="${o.type === "port" ? 360 : 240}" value="${o.w}" data-hf="w" aria-label="${esc(t("Bredde"))}"></div>` +
      (o.type === "door"
        ? `<div class="hz-f"><span>${esc(t("Dørblad"))}</span><div class="seg">${[["l", t("Hængsel venstre")], ["r", t("Hængsel højre")], ["dbl", t("Dobbeltdør")]].map(([v, x]) => `<button data-hz="hinge" data-id="${v}" aria-pressed="${v === "dbl" ? !!o.dbl : !o.dbl && (o.hinge || "l") === v}">${esc(x)}</button>`).join("")}</div></div>`
        : "") +
      (o.type !== "port" ? `<div class="hz-f"><span>${esc(t("Åbner mod"))}</span><div class="seg"><button data-hz="side" data-id="1" aria-pressed="${(o.side || 1) === 1}">${esc(sideName(1))}</button><button data-hz="side" data-id="-1" aria-pressed="${o.side === -1}">${esc(sideName(-1))}</button></div></div>` : "") +
      `<p class="t-sub">${esc(o.wall ? t("Sidder i væggen og flytter med den. Træk langs væggen for at flytte den.") : t("Træk den hen på en væg, så sætter den sig fast."))}</p>`;
  }
  if (isObj(o) && isWallObj(o))
    ex += o.wall
      ? `<div class="hz-row2"><span class="t-sub" style="flex:1;align-self:center">${esc(t("Står op ad væggen og følger den."))}</span><button class="btn soft sm" data-hz="detach">${esc(t("Slip væggen"))}</button></div>`
      : `<p class="t-sub">${esc(t("Træk den hen til en væg, så vender den ryggen til væggen og følger med den. Hold Alt nede for at placere frit."))}</p>`;
  if (o.type === "door" || o.type === "window")
    ex += `<div class="hz-lock"><label class="hz-chk"><input type="checkbox" data-hf="lockOn" ${o.lockOn ? "checked" : ""}><span><b>${esc(t("Har lås i Home Assistant"))}</b><small>${esc(o.type === "door" ? t("Så kan I se og styre, om døren er låst.") : t("Så kan I se og styre, om vinduet er låst."))}</small></span></label>${o.lockOn ? entFld("lock", o.lock, "lock", t("Lås")) : ""}</div>`;
  if (o.type === "camera") ex += fld(t("Retning"), `<input type="range" min="0" max="359" value="${o.a ?? 270}" data-hf="a">`) + fld(t("Synsvinkel"), `<input type="range" min="15" max="160" value="${o.s ?? 60}" data-hf="s">`) + fld(t("Rækkevidde"), `<input type="range" min="60" max="420" value="${o.r || 240}" data-hf="r">`);
  const title = o.type === "furn" && FURN[o.fk] ? FURN[o.fk][0] : o.type === "light" && LIGHTK[o.lk] ? LIGHTK[o.lk][0] : n;
  const r = roomAt(HZ.d, o.x, o.y);
  const showEnt = o.type !== "furn" && o.type !== "tree" && o.type !== "bush" && o.type !== "car";
  return `<div class="hz-pp"><div class="hz-ph"><span class="hz-pi" style="--hc:${col}">${svg(ic)}</span><div><b>${esc(t(title))}</b><small>${esc(r ? r.name : t("Udenfor"))}</small></div></div>
    ${fld(t("Navn"), `<input data-hf="name" value="${esc(o.name)}">`)}${showEnt ? entFld("ent", o.ent, dom, o.type === "door" || o.type === "window" ? t("Kontaktsensor") : o.type === "port" ? t("Port i HA") : t("Entitet")) : ""}${ex}<div class="hz-row2">${del}</div></div>`;
}
const roomArea = (r) => {
  const [x0, y0, x1, y1] = bbox(r.pts);
  let a = 0;
  for (let i = 0, j = r.pts.length - 1; i < r.pts.length; j = i++) a += (r.pts[j][0] + r.pts[i][0]) * (r.pts[j][1] - r.pts[i][1]);
  const m2 = Math.abs(a / 2) / (PX_M * PX_M);
  return `${C.fmt.num(m2 || ((x1 - x0) * (y1 - y0)) / (PX_M * PX_M), 1)} m²`;
};

function hbDraw() {
  const svgEl = $("hz-svg");
  if (!svgEl || !HZ) return;
  const D = HZ.d, v = HZ.view;
  LV = {};
  svgEl.setAttribute("viewBox", v.join(" "));
  const k = (HZ.k = v[2] / (svgEl.clientWidth || 800));
  let s = `<defs><pattern id="hz-g1" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" class="hz-gl"/></pattern><pattern id="hz-g2" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#hz-g1)"/><path d="M100 0H0V100" class="hz-gl2"/></pattern></defs>
    <rect x="${v[0] - v[2]}" y="${v[1] - v[3]}" width="${v[2] * 3}" height="${v[3] * 3}" fill="url(#hz-g2)" class="hz-bg"/>`;
  s += houseSvg(D, { mode: "edit", sel: HZ.sel && HZ.sel.startsWith("item:") ? HZ.sel.slice(5) : HZ.sel });
  const o = hbFind(HZ.sel), hr = 8 * k, keys = selKeys();
  // Several things chosen: a dashed outline round each.
  if (keys.size > 1)
    for (const key of keys) {
      const x = hbFind(key);
      if (!x) continue;
      const kk = key.split(":")[0];
      if (kk === "room" || (kk === "area" && x.pts)) s += `<polygon points="${x.pts.map((q) => q.join(",")).join(" ")}" class="hz-msel"/>`;
      else if (kk === "wall") s += `<line x1="${x.a[0]}" y1="${x.a[1]}" x2="${x.b[0]}" y2="${x.b[1]}" class="hz-msel" style="stroke-width:14;opacity:.5"/>`;
      else if (kk === "item") s += `<circle cx="${x.x}" cy="${x.y}" r="${Math.max(18, Math.min(120, (x.w || 30) / 2 + 8))}" class="hz-msel"/>`;
      else s += `<circle cx="${x.x}" cy="${x.y}" r="24" class="hz-msel"/>`;
    }
  // While drawing walls and rooms: the points to snap to.
  if (HZ.tool.startsWith("vaeg") || HZ.tool === "rum" || (HZ.sel && (HZ.sel.startsWith("wall:") || HZ.sel.startsWith("room:")))) {
    const seen = new Set();
    D.walls.forEach((w) =>
      [w.a, w.b].forEach((q) => {
        const key = Math.round(q[0]) + "," + Math.round(q[1]);
        if (seen.has(key)) return;
        seen.add(key);
        const hot = HZ.hover && HZ.snapKind && HZ.snapKind !== "grid" && dist(q, HZ.hover) < 1;
        s += `<circle cx="${q[0]}" cy="${q[1]}" r="${(hot ? 7 : 4.5) * k}" class="hz-anchor${hot ? " hot" : ""}"/>`;
      }),
    );
    if (HZ.chainPts && HZ.chainPts.length >= 3) {
      const q = HZ.chainPts[0], hot = HZ.hover && dist(q, HZ.hover) < 1;
      s += `<circle cx="${q[0]}" cy="${q[1]}" r="${(hot ? 10 : 7) * k}" class="hz-anchor hot"/>`;
    }
  }
  if (o && HZ.sel.startsWith("room:") && keys.size === 1) {
    s += o.pts
      .map((p, i) => {
        const q = o.pts[(i + 1) % o.pts.length], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        return dist(p, q) > 40 * k ? `<rect x="${f1(m[0] - hr * 0.7)}" y="${f1(m[1] - hr * 0.7)}" width="${f1(hr * 1.4)}" height="${f1(hr * 1.4)}" rx="${f1(hr * 0.35)}" class="hz-eh" data-hh="redge:${esc(o.id)}:${i}"/>` : "";
      })
      .join("");
    s += o.pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${hr}" class="hz-h${HZ.corner === i ? " on" : ""}" data-hh="room:${esc(o.id)}:${i}"/>`).join("");
  }
  if (o && HZ.sel.startsWith("wall:")) s += ["a", "b"].map((e) => `<circle cx="${o[e][0]}" cy="${o[e][1]}" r="${hr}" class="hz-h" data-hh="wall:${esc(o.id)}:${e}"/>`).join("");
  if (o && HZ.sel.startsWith("area:") && o.pts) s += o.pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${hr}" class="hz-h${HZ.corner === i ? " on" : ""}" data-hh="area:${esc(o.id)}:${i}"/>`).join("");
  if (o && HZ.sel.startsWith("item:") && isObj(o)) {
    const oh = o.h || o.w, c4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => rotP(o, (a * o.w) / 2, (b * oh) / 2)), top = rotP(o, 0, -oh / 2), rh = rotP(o, 0, -oh / 2 - 34 * k);
    s += `<polygon points="${c4.map((q) => q.map(f1).join(",")).join(" ")}" class="hz-objsel"/><line x1="${top[0]}" y1="${top[1]}" x2="${rh[0]}" y2="${rh[1]}" class="hz-rotln"/><circle cx="${rh[0]}" cy="${rh[1]}" r="${hr * 1.1}" class="hz-h rot" data-hh="obj:${esc(o.id)}:rot"/><circle cx="${c4[2][0]}" cy="${c4[2][1]}" r="${hr}" class="hz-h rs" data-hh="obj:${esc(o.id)}:rs"/>`;
    if (o.type === "car") {
      const pp = carPort(o);
      s += `<circle cx="${pp[0]}" cy="${pp[1]}" r="${hr * 0.9}" class="hz-port"/>`;
    }
  }
  if (o && HZ.sel.startsWith("item:") && !isObj(o)) s += `<circle cx="${o.x}" cy="${o.y}" r="${OPENING.has(o.type) ? Math.max(28, (o.w || 60) / 2 + 8) : 27}" class="hz-selring"/>`;
  if (HZ.prev) {
    const p = HZ.prev;
    s += `<rect x="${Math.min(p.a[0], p.b[0])}" y="${Math.min(p.a[1], p.b[1])}" width="${Math.abs(p.b[0] - p.a[0])}" height="${Math.abs(p.b[1] - p.a[1])}" class="hz-prev"/><text x="${(p.a[0] + p.b[0]) / 2}" y="${(p.a[1] + p.b[1]) / 2}" class="hz-meas" text-anchor="middle">${C.fmt.num(Math.abs(p.b[0] - p.a[0]) / PX_M, 1)} × ${C.fmt.num(Math.abs(p.b[1] - p.a[1]) / PX_M, 1)} m</text>`;
  }
  if (HZ.chain && HZ.hover) {
    const a = HZ.chain, b = HZ.hover;
    s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="hz-wprev"/><circle cx="${a[0]}" cy="${a[1]}" r="${hr * 0.8}" class="hz-h on"/><text x="${(a[0] + b[0]) / 2}" y="${(a[1] + b[1]) / 2 - 12 * k}" class="hz-meas" text-anchor="middle">${C.fmt.num(Math.hypot(b[0] - a[0], b[1] - a[1]) / PX_M, 2)} m</text>`;
  }
  if (HZ.hover && (isPlace(HZ.tool) || HZ.pend)) {
    const ty = toolType(HZ.pend ? HZ.pend.type : HZ.tool), ow = ty === "port" ? 150 : ty === "window" ? 90 : 60;
    const sp = OPENING.has(ty) ? hbWallSnap(HZ.hover, 46, ow / 2) : null, p = sp ? sp.p : HZ.hover;
    if (sp) s += `<g transform="translate(${f1(p[0])},${f1(p[1])}) rotate(${f1(sp.ang)})"><rect x="${-ow / 2}" y="-9" width="${ow}" height="18" rx="5" class="hz-ghost" style="--hc:${HT[ty][2]}"/></g>`;
    else s += `<circle cx="${p[0]}" cy="${p[1]}" r="18" class="hz-ghost" style="--hc:${HT[ty][2]}"/>`;
  }
  if (HZ.marq) {
    const [a, b] = HZ.marq;
    s += `<rect x="${Math.min(a[0], b[0])}" y="${Math.min(a[1], b[1])}" width="${Math.abs(b[0] - a[0])}" height="${Math.abs(b[1] - a[1])}" class="hz-marq"/>`;
  }
  svgEl.innerHTML = s;
  svgEl.querySelectorAll(".hz-meas").forEach((x) => (x.style.fontSize = 13 * k + "px"));
}

function hbRefresh(props = true) {
  hbDraw();
  if (props) {
    const p = $("hz-props");
    if (p) p.innerHTML = hbProps();
  }
  const h = $("hz-hint");
  if (h) h.innerHTML = hintHtml();
  const root = C.root;
  root.querySelectorAll(".hz-acts [data-hz=undo]").forEach((b) => (b.disabled = !HZ.hist.length));
  root.querySelectorAll(".hz-acts [data-hz=redo]").forEach((b) => (b.disabled = !HZ.fut.length));
  saveBadge();
  root.querySelectorAll(".hz-zoom [data-hz=multi]").forEach((b) => (b.classList.toggle("on", !!HZ.multiMode), b.setAttribute("aria-pressed", String(!!HZ.multiMode))));
  root.querySelectorAll(".hz-tool").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === (HZ.pend ? HZ.pend.type : HZ.tool))));
}

/* ------------------------------------------------------------------ snapping
   With the grid on, points snap to wall ends and room corners, then onto walls, then to the grid. Openings sit in a
   wall at the wall's angle; wall furniture turns its back to the wall. Both remember their wall and follow it.
   Holding Alt (Option) places freely. */
const TOL = 9; // drawing units: wall ends and room corners this close belong together (rooms sit inside their walls)
let FREE = false;
const snapOn = () => !!HZ && HZ.snap && !FREE;
const sn = (v, step = 5) => (snapOn() ? Math.round(v / step) * step : Math.round(v * 2) / 2);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
function projSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
  const q = [a[0] + dx * u, a[1] + dy * u];
  return { u, q, d: dist(p, q), L: Math.sqrt(L2) };
}
const wallAng = (w) => (Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]) * 180) / Math.PI;
const wallHalf = (w) => ({ ext: 6, int: 3.5, open: 2, hedge: 11, fence: 2 })[w.k || "int"] || 3.5;
const isWallObj = (it) => (it.type === "furn" && WALLF.has(it.fk)) || (it.type === "light" && (it.lk === "wall" || it.lk === "strip")) || ((it.type === "tv" || it.type === "speaker") && !!it.w);
function hbMagnet(p, skip = {}) {
  if (!snapOn()) return { p: [Math.round(p[0] * 2) / 2, Math.round(p[1] * 2) / 2], kind: "free" };
  const r = 14 * (HZ.k || 1);
  let best = null, bd = r;
  const test = (q, kind) => {
    const d = dist(p, q);
    if (d < bd) {
      bd = d;
      best = { p: [q[0], q[1]], kind };
    }
  };
  HZ.d.walls.forEach((w) => skip.walls?.has(w.id) || (test(w.a, "end"), test(w.b, "end")));
  if (skip.start) test(skip.start, "start");
  HZ.d.rooms.forEach((rm) => skip.rooms?.has(rm.id) || rm.pts.forEach((q) => test(q, "corner")));
  if (best) return best;
  bd = r * 0.8;
  HZ.d.walls.forEach((w) => {
    if (skip.walls?.has(w.id)) return;
    const pr = projSeg(p, w.a, w.b);
    if (pr.d < bd) {
      bd = pr.d;
      best = { p: [Math.round(pr.q[0] * 2) / 2, Math.round(pr.q[1] * 2) / 2], kind: "wall" };
    }
  });
  return best || { p: [sn(p[0], 10), sn(p[1], 10)], kind: "grid" };
}
/* Lock a line to 0/45/90 degrees when it is close. */
function axisLock(from, q) {
  if (!snapOn()) return q;
  const dx = q[0] - from[0], dy = q[1] - from[1], L = Math.hypot(dx, dy);
  if (L < 1) return q;
  const a = Math.atan2(dy, dx), step = Math.PI / 4, r = Math.round(a / step) * step;
  if (Math.abs(a - r) > 0.1) return q;
  return [Math.round((from[0] + Math.cos(r) * L) * 2) / 2, Math.round((from[1] + Math.sin(r) * L) * 2) / 2];
}
/* The nearest wall to a point, as a place on it: where, how far along and at which angle. */
function hbWallSnap(p, maxD = 46, half = 0, skipWalls) {
  let best = null, bd = maxD;
  HZ.d.walls.forEach((w) => {
    if (skipWalls?.has(w.id)) return;
    const pr = projSeg(p, w.a, w.b);
    if (pr.d >= bd || pr.L < 2 * half + 4) return;
    bd = pr.d;
    let along = pr.u * pr.L;
    if (snapOn()) along = Math.round(along / 5) * 5;
    along = Math.max(half, Math.min(pr.L - half, along));
    const u = along / pr.L, q = [w.a[0] + (w.b[0] - w.a[0]) * u, w.a[1] + (w.b[1] - w.a[1]) * u];
    const r = (wallAng(w) * Math.PI) / 180, n = [-Math.sin(r), Math.cos(r)];
    best = { w, wall: w.id, u, p: q, ang: wallAng(w), side: (p[0] - q[0]) * n[0] + (p[1] - q[1]) * n[1] >= 0 ? 1 : -1, d: pr.d };
  });
  return best;
}
/* Put an item on its wall: an opening in it, a piece of furniture with its back to it. */
function placeOnWall(it, w) {
  const u = Math.max(0, Math.min(1, it.wu ?? 0.5)), q = [w.a[0] + (w.b[0] - w.a[0]) * u, w.a[1] + (w.b[1] - w.a[1]) * u], ang = wallAng(w);
  if (OPENING.has(it.type)) {
    it.x = Math.round(q[0] * 10) / 10;
    it.y = Math.round(q[1] * 10) / 10;
    it.ang = Math.round(ang * 100) / 100;
    return;
  }
  const r = (ang * Math.PI) / 180, n = [-Math.sin(r), Math.cos(r)], sd = it.ws || 1, off = (it.h || it.w) / 2 + wallHalf(w) + 1;
  it.x = Math.round((q[0] + n[0] * sd * off) * 10) / 10;
  it.y = Math.round((q[1] + n[1] * sd * off) * 10) / 10;
  it.rot = Math.round((((ang + (sd < 0 ? 180 : 0)) % 360) + 360) % 360);
}
/* Everything that hangs on a wall follows it. */
function hbFollow(D) {
  D.items.forEach((it) => {
    if (!it.wall) return;
    const w = D.walls.find((x) => x.id === it.wall);
    if (!w) {
      delete it.wall;
      delete it.wu;
      delete it.ws;
      return;
    }
    placeOnWall(it, w);
  });
}
/* Try to hang an item on the nearest wall (from where its centre would be); otherwise let it go. */
function hbAttach(it, c) {
  const opening = OPENING.has(it.type);
  if (!opening && (!isWallObj(it) || !snapOn())) return false;
  const depth = opening ? 0 : (it.h || it.w) / 2;
  const sp = hbWallSnap(c, opening ? 46 : depth + 26, opening ? (it.w || 60) / 2 : it.w / 2);
  if (!sp) return false;
  it.wall = sp.wall;
  it.wu = Math.round(sp.u * 10000) / 10000;
  if (!opening) it.ws = sp.side;
  placeOnWall(it, sp.w);
  return true;
}
const detach = (it) => {
  delete it.wall;
  delete it.wu;
  delete it.ws;
};
/* Move wall ends and room corners that sit at the given points (as they were in base) along with them. */
function linkMove(base, D, moves, opt = {}) {
  const done = new Set();
  for (const [old, d] of moves) {
    base.walls.forEach((bw, wi) => {
      if (opt.walls?.has(bw.id)) return;
      ["a", "b"].forEach((e) => {
        const key = "w" + wi + e;
        if (done.has(key) || dist(bw[e], old) > TOL) return;
        done.add(key);
        D.walls[wi][e] = [bw[e][0] + d[0], bw[e][1] + d[1]];
      });
    });
    if (opt.noRooms) continue;
    base.rooms.forEach((br, ri) => {
      if (opt.rooms?.has(br.id)) return;
      br.pts.forEach((q, qi) => {
        const key = "r" + ri + ":" + qi;
        if (done.has(key) || dist(q, old) > TOL) return;
        done.add(key);
        D.rooms[ri].pts[qi] = [q[0] + d[0], q[1] + d[1]];
      });
    });
  }
}
const onPoly = (p, pts) => pts.some((q, i) => projSeg(p, q, pts[(i + 1) % pts.length]).d <= TOL) || pip(p, pts);
/* What moves when the selection moves: the rooms with their own walls and what stands in them. */
function moveSet(base, keys) {
  const rooms = new Set(), walls = new Set(), items = new Set(), areas = new Set();
  for (const key of keys) {
    const [k, id] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
    if (k === "room") rooms.add(id);
    if (k === "wall") walls.add(id);
    if (k === "item") items.add(id);
    if (k === "area") areas.add(id);
  }
  const selRooms = base.rooms.filter((r) => rooms.has(r.id)), others = base.rooms.filter((r) => !rooms.has(r.id));
  for (const r of selRooms) {
    base.walls.forEach((w) => {
      if (!onPoly(w.a, r.pts) || !onPoly(w.b, r.pts)) return;
      // A wall shared with a room that stays, stays.
      const mid = [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
      if (others.some((o) => onPoly(w.a, o.pts) && onPoly(w.b, o.pts) && projSeg(mid, ...nearEdge(mid, o.pts)).d <= TOL)) return;
      walls.add(w.id);
    });
    base.items.forEach((it) => {
      if (it.wall && !walls.has(it.wall)) return;
      if (pip([it.x, it.y], r.pts)) items.add(it.id);
    });
  }
  return { rooms, walls, items, areas };
}
const nearEdge = (p, pts) => {
  let best = [pts[0], pts[1]], bd = Infinity;
  pts.forEach((q, i) => {
    const e = [q, pts[(i + 1) % pts.length]], d = projSeg(p, e[0], e[1]).d;
    if (d < bd) {
      bd = d;
      best = e;
    }
  });
  return best;
};
function applyMove(base, D, set, d) {
  const moves = [];
  D.rooms.forEach((r, i) => {
    if (!set.rooms.has(r.id)) return;
    r.pts = base.rooms[i].pts.map((q) => [q[0] + d[0], q[1] + d[1]]);
  });
  D.walls.forEach((w, i) => {
    if (!set.walls.has(w.id)) return;
    const b = base.walls[i];
    w.a = [b.a[0] + d[0], b.a[1] + d[1]];
    w.b = [b.b[0] + d[0], b.b[1] + d[1]];
    moves.push([b.a, d], [b.b, d]);
  });
  D.areas.forEach((a, i) => {
    if (!set.areas.has(a.id)) return;
    const b = base.areas[i];
    if (b.pts) a.pts = b.pts.map((q) => [q[0] + d[0], q[1] + d[1]]);
    else {
      a.x = b.x + d[0];
      a.y = b.y + d[1];
    }
  });
  D.items.forEach((it, i) => {
    if (!set.items.has(it.id)) return;
    const b = base.items[i];
    it.x = b.x + d[0];
    it.y = b.y + d[1];
    if (it.wall && !set.walls.has(it.wall)) detach(it);
  });
  // Walls that meet the moved walls stretch along; the rooms at the ends of a moved wall follow too.
  linkMove(base, D, moves, { walls: set.walls, rooms: set.rooms, noRooms: set.rooms.size > 0 });
  hbFollow(D);
}
const selKeys = () => new Set([...(HZ.msel || []), HZ.sel].filter(Boolean));
function hbAddWall(a, b, k = "int") {
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 8) return;
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 3;
  const dup = HZ.d.walls.some((w) => (near(w.a, a) && near(w.b, b)) || (near(w.a, b) && near(w.b, a)));
  if (!dup) HZ.d.walls.push({ id: hbId("w"), a, b, k });
}
function newItem(x, p, pre = {}) {
  const [b0, sub] = String(x).split(":");
  let ex = {}, ty = x;
  if (XTOOLS[x]) {
    ex = x === "tvset" ? { w: CM(140), h: 5, rot: 0 } : x === "soundbar" ? { w: CM(100), h: 9, rot: 0 } : { w: 22, h: 18, rot: 0 };
    ex.name = t(XTOOLS[x][0]);
    ty = XTOOLS[x][1];
  } else if (b0 === "furn") {
    ex = { fk: sub, w: CM(FURN[sub][1]), h: CM(FURN[sub][2]), rot: 0, name: t(FURN[sub][0]) };
    ty = "furn";
  } else if (b0 === "light") {
    ex = { lk: sub, w: CM(LIGHTK[sub][1]), h: sub === "strip" ? 4 : CM(LIGHTK[sub][1]), rot: 0, rgb: sub === "rgb" || sub === "strip" ? 1 : 0, name: t(LIGHTK[sub][0]) };
    ty = "light";
  } else if (x === "car") {
    const ch = HZ.d.items.find((i) => i.type === "charger");
    ex = { w: CM(185), h: CM(470), rot: 0, port: "bl", chg: ch ? ch.id : "", col: "#F2F2F2", name: t("Bil") };
  } else if (x === "charger") ex = { w: 24, h: 30, rot: 0, name: t("Lader") };
  else if (x === "solar") ex = { w: CM(105) * 4, h: CM(175) * 2, rot: 0, name: t("Solceller") };
  else if (x === "battery") ex = { w: 40, h: 64, rot: 0, name: t("Batteri") };
  else if (x === "tree" || x === "bush") ex = { w: CM(x === "tree" ? 250 : 70), h: CM(x === "tree" ? 250 : 70), rot: 0, name: t(HT[x][0]) };
  pre = Object.assign(ex, pre);
  const ow = OPENING.has(ty) ? pre.w || (ty === "port" ? 150 : ty === "window" ? 90 : 60) : 0;
  const sp = OPENING.has(ty) ? hbWallSnap(p, 46, ow / 2) : null, q = sp ? sp.p : [sn(p[0]), sn(p[1])], same = HZ.d.items.filter((i) => i.type === ty).length + 1;
  const zr = ROBOT.has(ty) ? (ty === "mower" ? HZ.d.areas.find((z) => z.kind === "lawn" && z.pts) || roomAt(HZ.d, q[0], q[1]) : roomAt(HZ.d, q[0], q[1])) : null;
  if (zr) pre = Object.assign({ zone: zr.id }, pre);
  if (APK.has(ty) && !pre.appl) {
    const known = (C.data.appliances || []).find((a) => a.kind === ty && !HZ.d.items.some((i) => i.appl === a.id));
    if (known) pre = Object.assign({ name: known.name || C.name(known.entity), appl: known.id }, pre);
  }
  const it = Object.assign(
    { type: ty, id: hbId(ty[0]), name: `${t(HT[ty][0])} ${same}`, x: q[0], y: q[1], ent: "" },
    OPENING.has(ty) ? { ang: sp ? sp.ang : 0, w: ow, side: 1, hinge: "l", ...(sp ? { wall: sp.wall, wu: Math.round(sp.u * 10000) / 10000 } : {}) } : {},
    ty === "camera" ? { a: 270, s: 60, r: 220 } : {},
    pre,
  );
  let snapped = !!sp;
  if (!OPENING.has(ty) && isWallObj(it) && !pre.noWall) snapped = hbAttach(it, q);
  delete it.noWall;
  return { it, snapped };
}
function hbPlace(x, p, pre = {}) {
  hbPush();
  const { it, snapped } = newItem(x, p, pre);
  HZ.d.items.push(it);
  HZ.sel = "item:" + it.id;
  HZ.tool = "vaelg";
  HZ.pend = null;
  hbRefresh();
  if (OPENING.has(it.type) && !snapped) C.toast(t("Der var ingen væg tæt på. Træk den hen på en væg."));
}
function hbToSvg(e) {
  const svgEl = $("hz-svg"), pt = svgEl.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const r = pt.matrixTransform(svgEl.getScreenCTM().inverse());
  return [r.x, r.y];
}
function hbZoom(f, c) {
  const v = HZ.view, cx = c ? c[0] : v[0] + v[2] / 2, cy = c ? c[1] : v[1] + v[3] / 2, w = Math.max(200, Math.min(8000, v[2] * f)), h = v[3] * (w / v[2]);
  HZ.view = [cx - (cx - v[0]) * (w / v[2]), cy - (cy - v[1]) * (w / v[2]), w, h];
  hbDraw();
}
function hbFit() {
  const b = hBox(HZ.d), el = $("hz-svg"), ar = el && el.clientWidth ? el.clientHeight / el.clientWidth : 0.75;
  let [x, y, w, h] = b;
  if (h / w > ar) {
    const nw = h / ar;
    x -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w * ar;
    y -= (nh - h) / 2;
    h = nh;
  }
  HZ.view = [x, y, w, h];
  hbDraw();
}

/* Furnish a room by its type: furniture and lights fitted into the room. What is already there stays: only what the
   room doesn't have yet is added. */
function furnish(r) {
  const [x0, y0, x1, y1] = bbox(r.pts), W = x1 - x0, Hh = y1 - y0;
  const rtype = r.rtype || guessType(r.name);
  let set = FURNSET[rtype] || FURNSET.other;
  if (rtype === "kid" && (r.age === "baby" || r.age === "toddler")) set = set.map((s) => (s[0] === "furn:bed1" ? ["furn:crib", s[1], s[2], s[3]] : s));
  const inside = HZ.d.items.filter((i) => (i.type === "furn" || i.type === "light") && pip([i.x, i.y], r.pts));
  const have = {};
  inside.forEach((i) => {
    const key = i.type === "furn" ? "furn:" + i.fk : "light:" + i.lk;
    have[key] = (have[key] || 0) + 1;
  });
  let n = 0, lit = inside.some((i) => i.type === "light" && i.ent);
  for (const [tool, fx, fy, rot] of set) {
    if (have[tool]) {
      have[tool]--;
      continue;
    }
    const { it } = newItem(tool, [x0 + W * fx, y0 + Hh * fy], { rot, noWall: 1 });
    const rotated = rot % 180 !== 0;
    const fw = rotated ? it.h || it.w : it.w, fh = rotated ? it.w : it.h || it.w;
    const k = Math.min(1, (W * 0.9) / fw, (Hh * 0.9) / fh);
    if (k < 1) {
      it.w = Math.max(6, Math.round(it.w * k));
      if (it.h) it.h = Math.max(3, Math.round(it.h * k));
    }
    // keep it inside the room
    const hw = (rotated ? it.h || it.w : it.w) / 2, hh = (rotated ? it.w : it.h || it.w) / 2;
    it.x = Math.round(Math.max(x0 + hw + 4, Math.min(x1 - hw - 4, it.x)));
    it.y = Math.round(Math.max(y0 + hh + 4, Math.min(y1 - hh - 4, it.y)));
    if ((tool === "light:ceiling" || tool === "light:pendant") && r.light && !lit) {
      it.ent = r.light;
      lit = true;
    }
    if (isWallObj(it)) {
      const sp = hbWallSnap([it.x, it.y], (it.h || it.w) / 2 + 20, it.w / 2);
      if (sp) {
        it.wall = sp.wall;
        it.wu = Math.round(sp.u * 10000) / 10000;
        it.ws = sp.side;
        placeOnWall(it, sp.w);
      }
    }
    HZ.d.items.push(it);
    n++;
  }
  return n;
}

/* Rooms from Home Assistant's areas, laid out in a grid next to what is drawn. */
function importAreas() {
  const D = HZ.d, b = D.rooms.length || D.walls.length ? hBox(D) : [0, 0, 0, 0];
  const have = new Set(D.rooms.map((r) => r.area).concat(D.areas.map((a) => a.area)).filter(Boolean));
  let n = 0, o = 0;
  const x0 = D.rooms.length ? b[0] + b[2] + 60 : 100, y0 = D.rooms.length ? b[1] + 40 : 100;
  const list = C.areas().filter((a) => !have.has(a.area_id));
  const indoor = list.filter((a) => !OUTDOOR.test(a.name)), outdoor = list.filter((a) => OUTDOOR.test(a.name));
  const cols = Math.max(2, Math.ceil(Math.sqrt(indoor.length)));
  indoor.forEach((a) => {
    const ty = guessType(a.name);
    const w = ty === "living" || ty === "kitchen" ? 300 : ty === "toilet" || ty === "walkin" ? 140 : ty === "hall" ? 160 : 220, h = ty === "living" || ty === "kitchen" ? 240 : ty === "toilet" ? 140 : 190;
    const cx = x0 + (n % cols) * 330, cy = y0 + Math.floor(n / cols) * 270;
    const r = { id: hbId("r"), name: a.name, light: "", area: a.area_id, rtype: ty, pts: [[cx + 3, cy + 3], [cx + w - 3, cy + 3], [cx + w - 3, cy + h - 3], [cx + 3, cy + h - 3]] };
    if (ty === "kid") Object.assign(r, { age: "child", style: "neutral" });
    const kid = C.children().find((m) => a.name.toLowerCase().includes(m.name.toLowerCase()));
    if (kid) r.kid = kid.id;
    const lights = Object.keys(C.hass.states).filter((id) => id.startsWith("light.") && C.area(id) === a.area_id);
    if (lights.length === 1) r.light = lights[0];
    D.rooms.push(r);
    hbAddWall([cx, cy], [cx + w, cy], "ext");
    hbAddWall([cx + w, cy], [cx + w, cy + h], "ext");
    hbAddWall([cx + w, cy + h], [cx, cy + h], "ext");
    hbAddWall([cx, cy + h], [cx, cy], "ext");
    n++;
  });
  const yOut = y0 + Math.ceil(indoor.length / cols) * 270 + 40;
  outdoor.forEach((a) => {
    const kind = /indkørsel|indkorsel|driveway|carport/i.test(a.name) ? "drive" : /terrasse|terrace|patio|altan|balcony/i.test(a.name) ? "deck" : "lawn";
    const cx = x0 + o * 460;
    D.areas.push({ id: hbId("a"), kind, name: a.name, area: a.area_id, pts: [[cx, yOut], [cx + 420, yOut], [cx + 420, yOut + 260], [cx, yOut + 260]] });
    o++;
  });
  return n + o;
}

function autoPlace() {
  const D = HZ.d;
  let n = 0;
  const slot = {};
  for (const [ty, ent, name, area] of suggestions()) {
    const r = area && D.rooms.find((x) => x.area === area);
    if (!r) continue;
    const [cx, cy] = centroid(r.pts), [x0, y0, x1, y1] = bbox(r.pts);
    const i = (slot[r.id] = (slot[r.id] || 0) + 1);
    const ring = [[0, -70], [70, 0], [0, 70], [-70, 0], [60, -60], [60, 60], [-60, 60], [-60, -60]][(i - 1) % 8];
    let p = [cx + ring[0] * (1 + Math.floor((i - 1) / 8) * 0.6), cy + ring[1] * (1 + Math.floor((i - 1) / 8) * 0.6)];
    if (OPENING.has(ty)) {
      // put it on the room's longest outer-most wall
      const edges = r.pts.map((q, j) => [q, r.pts[(j + 1) % r.pts.length]]);
      const e = edges.sort((a, b) => Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]) - Math.hypot(a[1][0] - a[0][0], a[1][1] - a[0][1]))[(i - 1) % edges.length];
      p = [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2];
    }
    p = [Math.max(x0 + 20, Math.min(x1 - 20, p[0])), Math.max(y0 + 20, Math.min(y1 - 20, p[1]))];
    const { it } = newItem(ty, p, { name, ent });
    D.items.push(it);
    n++;
  }
  return n;
}

function cleanHouse(d) {
  const H = clone(d);
  H.items.forEach((i) => {
    delete i.live;
    if (!i.lockOn) delete i.lock;
  });
  return { name: H.name || "", rooms: H.rooms, walls: H.walls, areas: H.areas, items: H.items };
}

async function hbSave() {
  saveTimer = null;
  if (!HZ || !HZ.dirty) return;
  const clean = cleanHouse(HZ.d);
  const size = JSON.stringify(clean).length;
  if (size > 600000) {
    HZ.save = "err";
    saveBadge();
    C.toast(t("Tegningen er for stor til at blive gemt ({kb} kB). Brug mindre billeder af rummene.", { kb: Math.round(size / 1024) }));
    return;
  }
  HZ.save = "busy";
  saveBadge();
  const sent = JSON.stringify(HZ.d);
  const ok = await C.save("house", clean);
  if (!HZ) return;
  if (ok) {
    // Changed again while saving: that is saved next.
    if (JSON.stringify(HZ.d) === sent) {
      HZ.dirty = false;
      HZ.save = "ok";
    } else markDirty();
    HZ.base = JSON.stringify(C.data.house || {});
  } else HZ.save = "err";
  saveBadge();
}

function textSheet(txt) {
  const s = C.sheet(`<h2>${esc(txt ? t("Kopiér tegningen") : t("Indsæt en tegning"))}</h2><p class="t-sub">${esc(txt ? t("Markér og kopiér teksten. Den kan sættes ind i en anden Hverdagsro igen.") : t("Sæt teksten fra »Kopiér tegningen« ind her."))}</p><textarea class="hz-ta" rows="8" ${txt ? "readonly" : ""}>${esc(txt)}</textarea><div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Luk"))}</button>${txt ? "" : `<button class="btn" data-imp>${esc(t("Brug tegningen"))}</button>`}</div>`);
  const ta = s.el.querySelector(".hz-ta");
  if (txt) {
    ta.focus();
    ta.select();
  }
  s.el.querySelector("[data-imp]")?.addEventListener("click", () => {
    if (useJson(ta.value)) s.close();
  });
}
function useJson(text) {
  try {
    const h = JSON.parse(text);
    const plan = h && h.plan && h.plan.rooms ? h.plan : h;
    if (!plan || !Array.isArray(plan.rooms) || !Array.isArray(plan.items)) throw new Error("x");
    hbPush();
    HZ.d = normHouse(Object.assign({ walls: [], areas: [] }, plan));
    HZ.sel = null;
    hbFit();
    hbRefresh();
    C.toast(t("Tegningen er sat ind. Husk at gemme."));
    return true;
  } catch (e) {
    C.toast(t("Det ligner ikke en tegning fra Husbyggeren"));
    return false;
  }
}

/* A room photo: uploaded to Home Assistant's image store when possible, otherwise kept small in the drawing. */
async function roomPhoto(file, roomId) {
  const r = HZ.d.rooms.find((x) => x.id === roomId);
  if (!r || !file) return;
  let url = null;
  if (C.hass.fetchWithAuth) {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await C.hass.fetchWithAuth("/api/image/upload", { method: "POST", body: fd });
      if (res.ok) {
        const j = await res.json();
        if (j?.id) url = `/api/image/serve/${j.id}/original`;
      }
    } catch (e) {
      url = null;
    }
  }
  if (!url) url = await downscale(file, 900, 0.74);
  hbPush();
  r.img = url;
  hbRefresh();
  C.toast(t("Billedet er lagt ind. Husk at gemme."));
}
function downscale(file, max, q) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => {
        const sc = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * sc);
        c.height = Math.round(im.height * sc);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", q));
      };
      im.onerror = rej;
      im.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

function hzClick(e) {
  const b = e.target.closest("[data-hz]");
  if (!b || !HZ) return;
  e.preventDefault();
  const a = b.dataset.hz, id = b.dataset.id, o = hbFind(HZ.sel);
  if (a === "tool") {
    HZ.tool = id;
    HZ.pend = null;
    hbEndChain();
    if (id !== "vaelg") {
      HZ.sel = null;
      HZ.corner = null;
    }
    return hbRefresh();
  }
  if (a === "grp") {
    HZ.grp = id;
    const m = C.root.querySelector(".hz-pal-m");
    if (m) m.outerHTML = hzPalM();
    return;
  }
  if (a === "pend") {
    const s = suggestions().find((x) => x[1] === id);
    if (!s) return;
    HZ.pend = { type: s[0], ent: s[1], name: s[2] };
    HZ.tool = s[0];
    HZ.sel = null;
    return hbRefresh();
  }
  if (a === "endwall") {
    hbEndChain();
    HZ.tool = "vaelg";
    return hbRefresh();
  }
  if ((a === "undo" && HZ.hist.length) || (a === "redo" && HZ.fut.length)) {
    (a === "undo" ? HZ.fut : HZ.hist).push(JSON.stringify(HZ.d));
    HZ.d = JSON.parse((a === "undo" ? HZ.hist : HZ.fut).pop());
    hbEndChain();
    markDirty();
    HZ.msel = new Set([...(HZ.msel || [])].filter((k) => hbFind(k)));
    if (!hbFind(HZ.sel)) HZ.sel = null;
    return hbRefresh();
  }
  if (a === "undo" || a === "redo") return;
  if (a === "multi") {
    HZ.multiMode = !HZ.multiMode;
    C.toast(HZ.multiMode ? t("Markér flere: tryk på ting, eller træk en ramme om dem") : t("Markér flere: fra"));
    return hbRefresh(false);
  }
  if (a === "clearsel") {
    HZ.sel = null;
    HZ.msel = new Set();
    return hbRefresh();
  }
  if (a === "zin") return hbZoom(1 / 1.25);
  if (a === "zout") return hbZoom(1.25);
  if (a === "fit") return hbFit();
  if (a === "snap") {
    HZ.snap = !HZ.snap;
    b.classList.toggle("on", HZ.snap);
    b.setAttribute("aria-pressed", String(HZ.snap));
    return C.toast(HZ.snap ? t("Fastgør til vægge og gitter: til") : t("Fastgør til vægge og gitter: fra"));
  }
  if (a === "save") return hbSave();
  if (a === "leave") {
    flushSave();
    return leave(false);
  }
  if (a === "openroom" && o) return C.go("rum:" + o.id);
  if (a === "haimport") {
    hbPush();
    const n = importAreas();
    hbFit();
    hbRefresh();
    return C.toast(n ? t("{n} rum og arealer er hentet fra Home Assistant. Træk dem på plads, og ret rumtypen, hvis gættet er forkert.", { n }) : t("Alle områder fra Home Assistant er allerede med"));
  }
  if (a === "autoplace") {
    hbPush();
    const n = autoPlace();
    hbRefresh();
    return C.toast(t("{n} enheder er placeret. Træk dem det rigtige sted hen.", { n }));
  }
  if (a === "copy") {
    const txt = JSON.stringify(cleanHouse(HZ.d));
    const done = () => C.toast(t("Tegningen er kopieret"));
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(done, () => textSheet(txt));
    else textSheet(txt);
    return;
  }
  if (a === "export") {
    const blob = new Blob([JSON.stringify(cleanHouse(HZ.d), null, 1)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hverdagsro-hus${HZ.d.name ? "-" + HZ.d.name.toLowerCase().replace(/[^a-z0-9æøå]+/g, "-") : ""}.json`;
    C.root.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    return;
  }
  if (a === "import") return textSheet("");
  if (a === "blank") {
    return C.confirm(t("Start på en tom tegning?"), t("Tegningen ryddes. Du kan fortryde, til du gemmer."), t("Ryd tegningen"), () => {
      hbPush();
      HZ.d = { name: HZ.d.name, rooms: [], walls: [], areas: [], items: [] };
      HZ.sel = null;
      HZ.view = [0, 0, 1400, 1000];
      hbRefresh();
    });
  }
  if (a === "del" && o) {
    hbPush();
    const keys = selKeys(), D = HZ.d;
    D.items = D.items.filter((x) => !keys.has("item:" + x.id));
    D.rooms = D.rooms.filter((x) => !keys.has("room:" + x.id));
    D.walls = D.walls.filter((x) => !keys.has("wall:" + x.id));
    D.areas = D.areas.filter((x) => !keys.has("area:" + x.id));
    hbFollow(D);
    HZ.sel = null;
    HZ.msel = new Set();
    return hbRefresh();
  }
  if (a === "dup" && o) {
    hbPush();
    const got = new Set();
    for (const key of selKeys()) {
      const x = hbFind(key), k = key.split(":")[0];
      if (!x) continue;
      if (k === "item") {
        const c = Object.assign(clone(x), { id: hbId(x.type[0]), x: x.x + 24, y: x.y + 24 });
        detach(c);
        HZ.d.items.push(c);
        got.add("item:" + c.id);
      } else if (k === "room" || (k === "area" && x.pts)) {
        const c = Object.assign(clone(x), { id: hbId(k[0]), pts: x.pts.map((q) => [q[0] + 30, q[1] + 30]) });
        if (k === "room") c.name = `${x.name} (${t("kopi")})`;
        (k === "room" ? HZ.d.rooms : HZ.d.areas).push(c);
        got.add(k + ":" + c.id);
      } else if (k === "wall") {
        const c = { ...clone(x), id: hbId("w"), a: [x.a[0] + 30, x.a[1] + 30], b: [x.b[0] + 30, x.b[1] + 30] };
        HZ.d.walls.push(c);
        got.add("wall:" + c.id);
      }
    }
    HZ.msel = got.size > 1 ? got : new Set();
    HZ.sel = [...got][0] || null;
    return hbRefresh();
  }
  if (a === "rot" && o && selKeys().size > 1) {
    hbPush();
    for (const key of selKeys()) {
      const x = hbFind(key);
      if (!key.startsWith("item:") || !x || !isObj(x)) continue;
      x.rot = ((((x.rot || 0) + +id) % 360) + 360) % 360;
      detach(x);
    }
    return hbRefresh();
  }
  if (!o) return;
  hbPush();
  if (a === "furnish") {
    const n = furnish(o);
    C.toast(n ? t("{n} ting er sat ind i {room}. Det, der stod der i forvejen, er bevaret.", { room: o.name, n }) : t("{room} har allerede det hele", { room: o.name }));
  }
  if (a === "wallk") o.k = id;
  if (a === "areak") o.kind = id;
  if (a === "hinge") {
    if (id === "dbl") o.dbl = o.dbl ? 0 : 1;
    else {
      o.dbl = 0;
      o.hinge = id;
    }
  }
  if (a === "side") o.side = +id;
  if (a === "flip") o.side = -(o.side || 1);
  if (a === "detach") detach(o);
  if (a === "rstyle") o.style = id;
  if (a === "noimg") delete o.img;
  if (a === "rot") {
    o.rot = ((((o.rot || 0) + +id) % 360) + 360) % 360;
    detach(o);
  }
  if (a === "carcol") o.col = id;

  if (a === "addcorner") {
    let bi = 0, bl = 0;
    if (HZ.corner != null && HZ.corner < o.pts.length) bi = HZ.corner;
    else
      o.pts.forEach((p, i) => {
        const q = o.pts[(i + 1) % o.pts.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (l > bl) {
          bl = l;
          bi = i;
        }
      });
    const p = o.pts[bi], q = o.pts[(bi + 1) % o.pts.length];
    o.pts.splice(bi + 1, 0, [sn((p[0] + q[0]) / 2), sn((p[1] + q[1]) / 2)]);
    HZ.corner = bi + 1;
  }
  if (a === "delcorner" && o.pts.length > 3) {
    o.pts.splice(HZ.corner != null ? HZ.corner : o.pts.length - 1, 1);
    HZ.corner = null;
  }
  hbRefresh();
}
function leave(discard) {
  if (discard) {
    HZ = null;
  }
  C.go("sikkerhed");
}

function hzInput(e) {
  const el = e.target, f = el.dataset?.hf;
  if (!f || !HZ) return;
  // A search field only sets its entity when one is picked, or when what was typed is an entity (or nothing).
  if (el.dataset.ep != null) {
    if (e.type === "input" && e.isTrusted) return;
    const v = el.value.trim();
    if (v && !C.hass.states[v]) return;
  }
  if (f === "hname") {
    HZ.d.name = el.value;
    markDirty();
    return;
  }
  const o = hbFind(HZ.sel);
  if (!o) return;
  if (!HZ.typing) {
    hbPush();
    HZ.typing = 1;
    setTimeout(() => (HZ && (HZ.typing = 0)), 900);
  }
  markDirty();
  if (f === "lockOn") {
    o.lockOn = el.checked ? 1 : 0;
    return hbRefresh();
  }
  if (f === "appl") {
    const a = (C.data.appliances || []).find((x) => x.id === el.value);
    o.appl = a ? a.id : "";
    if (a && /\s\d+$/.test(o.name)) o.name = a.name || C.name(a.entity);
    return hbRefresh();
  }
  if (f === "wcm" || f === "hcm") {
    const v = Math.max(3, +el.value || 0);
    if (f === "wcm") {
      o.w = CM(v);
      if (isRoundObj(o)) o.h = o.w;
    } else o.h = CM(v);
    return hbRefresh(false);
  }
  if (f === "rot") {
    o.rot = +el.value;
    return hbRefresh(false);
  }
  if (f === "rgb") {
    o.rgb = el.checked ? 1 : 0;
    return hbRefresh();
  }
  if (f === "art") {
    if (el.value) o.art = el.value;
    else delete o.art;
    return hbRefresh();
  }
  if (f.startsWith("lamp:")) {
    const slot = f.slice(5);
    o.lamps = { ...(o.lamps || {}) };
    if (el.value) o.lamps[slot] = el.value;
    else delete o.lamps[slot];
    if (!Object.keys(o.lamps).length) delete o.lamps;
    return hbRefresh();
  }
  if (["rtype", "kid", "age", "area", "zone"].includes(f)) {
    o[f] = el.value;
    if (f === "rtype" && o.rtype === "kid" && !o.age) o.age = "child";
    if (f === "area" && !o.light) {
      const lights = Object.keys(C.hass.states).filter((id) => id.startsWith("light.") && C.area(id) === o.area);
      if (lights.length === 1) o.light = lights[0];
    }
    return hbRefresh();
  }
  if (["fk", "lk", "port", "chg"].includes(f)) {
    o[f] = el.value;
    if (f === "lk") {
      if (ROUNDL.has(o.lk)) o.h = o.w;
      else if (o.lk === "strip") o.h = 4;
    }
    if (f === "fk") {
      if (ROUNDF.has(o.fk)) o.h = o.w;
      if (/\s\d+$/.test(o.name) || Object.values(FURN).some((v) => t(v[0]) === o.name)) o.name = t(FURN[o.fk][0]);
    }
    return hbRefresh();
  }
  if (f === "wcmo") {
    o.w = Math.max(15, Math.min(f === "wcmo" && o.type === "port" ? 600 : 400, CM(+el.value || 0)));
    if (o.wall) hbFollow(HZ.d);
    const r = C.root.querySelector('#hz-props [data-hf="w"]');
    if (r) r.value = o.w;
    return hbRefresh(false);
  }
  o[f] = ["w", "a", "s", "r"].includes(f) ? +el.value : el.value.trim ? el.value.trim() : el.value;
  if (f === "w") {
    const c = C.root.querySelector('#hz-props [data-hf="wcmo"]');
    if (c) c.value = Math.round((o.w / PX_M) * 100);
  }
  if (f === "name") o.name = el.value;
  const ei = C.root.querySelector(`#hz-props [data-ei="${f}"]`);
  if (ei) ei.innerHTML = entInfo(el.value.trim(), ei.dataset.dom);
  if (f === "ent" && e.type === "change") {
    const s = C.hass.states[o.ent];
    if (s && (/\s\d+$/.test(o.name) || !o.name.trim())) {
      o.name = s.attributes.friendly_name || o.name;
      const nm = C.root.querySelector('#hz-props [data-hf="name"]');
      if (nm) nm.value = o.name;
    }
  }
  hbRefresh(false);
}

/* A finished drag or nudge: one step in the history, and saved shortly after. */
function hbCommit(before) {
  HZ.hist.push(before);
  if (HZ.hist.length > 80) HZ.hist.shift();
  HZ.fut = [];
  markDirty();
}
/* Move what is chosen by d (from base): one item on its own snaps to walls; rooms take their walls and furniture. */
function hbMoveSel(base, keys, d, raw) {
  HZ.d = clone(base);
  if (keys.size === 1) {
    const key = [...keys][0];
    if (key.startsWith("item:")) {
      const id = key.slice(5), o = HZ.d.items.find((x) => x.id === id), O = base.items.find((x) => x.id === id);
      if (!o) return;
      const c = [O.x + raw[0], O.y + raw[1]];
      if (OPENING.has(o.type) || isWallObj(o)) {
        if (hbAttach(o, c)) return;
        detach(o);
      }
      o.x = sn(c[0]);
      o.y = sn(c[1]);
      return;
    }
  }
  applyMove(base, HZ.d, moveSet(base, keys), d);
}
function hbStartChain(q) {
  HZ.chain = q;
  HZ.chainPts = [q];
}
function hbEndChain() {
  HZ.chain = null;
  HZ.chainPts = null;
  HZ.hover = null;
}
/* A wall drawn back to where it started closes a room. */
function hbChainPoint(q) {
  if (!HZ.chain) return hbStartChain(q);
  hbPush();
  const kind = HZ.tool.includes(":") ? HZ.tool.split(":")[1] : "int";
  hbAddWall(HZ.chain, q, kind);
  const pts = HZ.chainPts;
  if (pts.length >= 3 && dist(q, pts[0]) < 1) {
    hbEndChain();
    if (kind === "int" || kind === "ext") {
      let a = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
      if (Math.abs(a / 2) > 40 * 40) {
        const [cx, cy] = centroid(pts);
        // The room sits just inside its walls.
        const inset = pts.map((q2) => {
          const dx = cx - q2[0], dy = cy - q2[1], L = Math.hypot(dx, dy) || 1;
          return [Math.round((q2[0] + (dx / L) * 5) * 2) / 2, Math.round((q2[1] + (dy / L) * 5) * 2) / 2];
        });
        const r = { id: hbId("r"), name: t("Rum {n}", { n: HZ.d.rooms.length + 1 }), light: "", area: "", rtype: "other", pts: inset };
        HZ.d.rooms.push(r);
        HZ.sel = "room:" + r.id;
        HZ.msel = new Set();
        HZ.tool = "vaelg";
        C.toast(t("Væggene er lukket, og rummet er sat ind. Giv det et navn."));
      }
    }
    return;
  }
  HZ.chain = q;
  pts.push(q);
}
function hbSelect(key, add) {
  if (!add) {
    HZ.msel = new Set();
    HZ.sel = key;
    HZ.corner = null;
    return;
  }
  const all = selKeys();
  if (all.has(key)) all.delete(key);
  else all.add(key);
  HZ.msel = all;
  HZ.sel = all.size ? [...all][all.size - 1] : null;
  if (all.size <= 1) HZ.msel = new Set();
}

function hbBind() {
  const svgEl = $("hz-svg");
  if (!svgEl || svgEl.dataset.bound) return;
  svgEl.dataset.bound = "1";
  if (!HZ.fitted) {
    HZ.fitted = true;
    hbFit();
  } else {
    const ar = svgEl.clientHeight / (svgEl.clientWidth || 1), v = HZ.view;
    HZ.view = [v[0], v[1], v[2], v[2] * ar];
    hbDraw();
  }
  const ptrs = new Map();
  let drag = null, pinch = null;
  svgEl.addEventListener("pointerdown", (e) => {
    FREE = e.altKey;
    try {
      svgEl.setPointerCapture(e.pointerId);
    } catch (err) {
      /* synthetic events */
    }
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), v: [...HZ.view] };
      drag = null;
      HZ.prev = null;
      HZ.marq = null;
      return;
    }
    const p = hbToSvg(e), tg = e.target, D = HZ.d;
    let hh = tg.closest("[data-hh]"), he = tg.closest("[data-he]");
    // A door or a lamp under a room's edge handle wins over the handle.
    if (hh && hh.dataset.hh.startsWith("redge:")) {
      const under = C.root.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest?.('[data-he^="item:"]')).find(Boolean);
      if (under) {
        hh = null;
        he = under;
      }
    }
    const add = e.shiftKey || e.metaKey || e.ctrlKey || HZ.multiMode;
    if (HZ.pend) return hbPlace(HZ.pend.type, p, { name: HZ.pend.name, ent: HZ.pend.ent });
    if (isPlace(HZ.tool)) return hbPlace(HZ.tool, p);
    if (HZ.tool === "rum" || HZ.tool.startsWith("ude:")) {
      const a = hbMagnet(p).p;
      HZ.prev = { a, b: a };
      drag = { kind: "rect" };
      return;
    }
    if (HZ.tool.startsWith("vaeg")) {
      let q = hbMagnet(p, { start: HZ.chainPts?.length >= 3 ? HZ.chainPts[0] : null }).p;
      if (HZ.chain) q = axisLock(HZ.chain, q);
      if (HZ.hover && HZ.chain && dist(HZ.hover, p) < 30 * (HZ.k || 1)) q = HZ.hover;
      hbChainPoint(q);
      hbRefresh(!HZ.chain);
      return;
    }
    if (hh) {
      const [k, id, i] = hh.dataset.hh.split(":");
      drag = { kind: "handle", k, id, i, start: p, base: clone(D), before: JSON.stringify(D), moved: false };
      if (k === "room" || k === "area") HZ.corner = +i;
      return;
    }
    if (he) {
      const key = he.dataset.he;
      if (add) {
        hbSelect(key, true);
        hbRefresh();
        return;
      }
      if (!selKeys().has(key)) {
        hbSelect(key, false);
        hbRefresh();
      }
      drag = { kind: "move", keys: selKeys(), start: p, base: clone(D), before: JSON.stringify(D), moved: false };
      return;
    }
    if (add) {
      HZ.marq = [p, p];
      drag = { kind: "marq", keep: e.shiftKey || HZ.multiMode };
      return;
    }
    if (HZ.sel || HZ.msel?.size) {
      HZ.sel = null;
      HZ.msel = new Set();
      HZ.corner = null;
      hbRefresh();
    }
    drag = { kind: "pan", c: [e.clientX, e.clientY], v: [...HZ.view] };
  });
  svgEl.addEventListener("pointermove", (e) => {
    FREE = e.altKey;
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      HZ.view = [...pinch.v];
      const r = svgEl.getBoundingClientRect(), mid = [((a[0] + b[0]) / 2 - r.left) / r.width, ((a[1] + b[1]) / 2 - r.top) / r.height];
      hbZoom(pinch.d / d, [pinch.v[0] + mid[0] * pinch.v[2], pinch.v[1] + mid[1] * pinch.v[3]]);
      return;
    }
    const p = hbToSvg(e);
    if (HZ.tool.startsWith("vaeg") && !drag) {
      const m = hbMagnet(p, { start: HZ.chainPts?.length >= 3 ? HZ.chainPts[0] : null });
      HZ.snapKind = m.kind;
      HZ.hover = HZ.chain && m.kind !== "end" && m.kind !== "start" ? axisLock(HZ.chain, m.p) : m.p;
      return hbDraw();
    }
    if ((isPlace(HZ.tool) || HZ.pend) && !drag) {
      HZ.hover = p;
      return hbDraw();
    }
    if (!drag) return;
    if (drag.kind === "pan") {
      const r = svgEl.getBoundingClientRect(), f = drag.v[2] / r.width;
      HZ.view = [drag.v[0] - (e.clientX - drag.c[0]) * f, drag.v[1] - (e.clientY - drag.c[1]) * f, drag.v[2], drag.v[3]];
      return hbDraw();
    }
    if (drag.kind === "marq") {
      HZ.marq[1] = p;
      return hbDraw();
    }
    if (drag.kind === "rect") {
      const m = hbMagnet(p);
      HZ.prev.b = m.p;
      return hbDraw();
    }
    if (drag.kind === "handle" && drag.k === "obj") {
      const o = hbFind("item:" + drag.id), dx = p[0] - o.x, dy = p[1] - o.y, a = ((o.rot || 0) * Math.PI) / 180;
      drag.moved = true;
      if (drag.i === "rs") {
        const lx = dx * Math.cos(a) + dy * Math.sin(a), ly = -dx * Math.sin(a) + dy * Math.cos(a), s5 = (v) => (snapOn() ? Math.round(v / 3) * 3 : v);
        o.w = Math.max(6, s5(2 * Math.abs(lx)));
        o.h = isRoundObj(o) ? o.w : Math.max(3, s5(2 * Math.abs(ly)));
        if (o.wall) hbFollow(HZ.d);
      } else {
        let ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (snapOn()) ang = Math.round(ang / 15) * 15;
        o.rot = ((Math.round(ang) % 360) + 360) % 360;
        if (o.wall) detach(o);
      }
      return hbDraw();
    }
    if (drag.kind === "handle") {
      const B = drag.base;
      drag.moved = true;
      HZ.d = clone(B);
      const D = HZ.d;
      if (drag.k === "room") {
        const ri = B.rooms.findIndex((r) => r.id === drag.id), old = B.rooms[ri].pts[+drag.i];
        const q = hbMagnet(p, { rooms: new Set([drag.id]) }).p, d = [q[0] - old[0], q[1] - old[1]];
        D.rooms[ri].pts[+drag.i] = q;
        linkMove(B, D, [[old, d]], { rooms: new Set([drag.id]) });
      }
      if (drag.k === "redge") {
        const ri = B.rooms.findIndex((r) => r.id === drag.id), pts = B.rooms[ri].pts, i = +drag.i, j = (i + 1) % pts.length;
        const ex = pts[j][0] - pts[i][0], ey = pts[j][1] - pts[i][1], L = Math.hypot(ex, ey) || 1, n = [-ey / L, ex / L];
        const dn = sn((p[0] - drag.start[0]) * n[0] + (p[1] - drag.start[1]) * n[1], 5), d = [n[0] * dn, n[1] * dn];
        D.rooms[ri].pts[i] = [pts[i][0] + d[0], pts[i][1] + d[1]];
        D.rooms[ri].pts[j] = [pts[j][0] + d[0], pts[j][1] + d[1]];
        linkMove(B, D, [[pts[i], d], [pts[j], d]], { rooms: new Set([drag.id]) });
      }
      if (drag.k === "wall") {
        const wi = B.walls.findIndex((w) => w.id === drag.id), w = B.walls[wi], old = w[drag.i], other = w[drag.i === "a" ? "b" : "a"];
        const m = hbMagnet(p, { walls: new Set([drag.id]) });
        const q = m.kind === "end" || m.kind === "corner" ? m.p : axisLock(other, m.p), d = [q[0] - old[0], q[1] - old[1]];
        linkMove(B, D, [[old, d]]);
        D.walls[wi][drag.i] = q;
      }
      if (drag.k === "area") {
        const o = D.areas.find((a) => a.id === drag.id);
        if (o?.pts) o.pts[+drag.i] = [sn(p[0], 10), sn(p[1], 10)];
      }
      hbFollow(D);
      return hbDraw();
    }
    if (drag.kind === "move") {
      const dx = p[0] - drag.start[0], dy = p[1] - drag.start[1];
      if (Math.hypot(dx, dy) / (HZ.k || 1) < 3 && !drag.moved) return;
      drag.moved = true;
      const big = [...drag.keys].some((k) => !k.startsWith("item:"));
      hbMoveSel(drag.base, drag.keys, [sn(dx, big ? 10 : 5), sn(dy, big ? 10 : 5)], [dx, dy]);
      return hbDraw();
    }
  });
  const up = (e) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.kind === "marq") {
      const [a, b] = HZ.marq, x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
      HZ.marq = null;
      const inR = (q) => q[0] >= x0 && q[0] <= x1 && q[1] >= y0 && q[1] <= y1, D = HZ.d;
      const got = new Set(d.keep ? selKeys() : []);
      if (x1 - x0 > 4 || y1 - y0 > 4) {
        D.items.forEach((i) => inR([i.x, i.y]) && got.add("item:" + i.id));
        D.rooms.forEach((r) => r.pts.every(inR) && got.add("room:" + r.id));
        D.walls.forEach((w) => inR(w.a) && inR(w.b) && got.add("wall:" + w.id));
        D.areas.forEach((ar) => (ar.pts ? ar.pts.every(inR) : inR([ar.x, ar.y])) && got.add("area:" + ar.id));
      }
      HZ.msel = got.size > 1 ? got : new Set();
      HZ.sel = got.size ? [...got][got.size - 1] : null;
      return hbRefresh();
    }
    if (d.kind === "rect") {
      const p = HZ.prev;
      HZ.prev = null;
      const x0 = Math.min(p.a[0], p.b[0]), y0 = Math.min(p.a[1], p.b[1]), x1 = Math.max(p.a[0], p.b[0]), y1 = Math.max(p.a[1], p.b[1]);
      if (x1 - x0 < 30 || y1 - y0 < 30) {
        hbDraw();
        return C.toast(t("Træk lidt længere for at tegne"));
      }
      hbPush();
      if (HZ.tool.startsWith("ude:")) {
        const kd = HZ.tool.slice(4), a = { id: hbId("a"), kind: kd, name: t(AREAK[kd]), pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] };
        HZ.d.areas.push(a);
        HZ.sel = "area:" + a.id;
      } else {
        const name = t("Rum {n}", { n: HZ.d.rooms.length + 1 });
        const r = { id: hbId("r"), name, light: "", area: "", rtype: "other", pts: [[x0 + 5, y0 + 5], [x1 - 5, y0 + 5], [x1 - 5, y1 - 5], [x0 + 5, y1 - 5]] };
        HZ.d.rooms.push(r);
        hbAddWall([x0, y0], [x1, y0]);
        hbAddWall([x1, y0], [x1, y1]);
        hbAddWall([x1, y1], [x0, y1]);
        hbAddWall([x0, y1], [x0, y0]);
        HZ.sel = "room:" + r.id;
      }
      HZ.msel = new Set();
      HZ.tool = "vaelg";
      return hbRefresh();
    }
    if ((d.kind === "move" || d.kind === "handle") && d.moved) {
      hbCommit(d.before);
      hbRefresh();
    }
  };
  svgEl.addEventListener("pointerup", up);
  svgEl.addEventListener("pointercancel", up);
  svgEl.addEventListener("pointerleave", () => {
    if (isPlace(HZ.tool) || HZ.pend || (HZ.tool.startsWith("vaeg") && !HZ.chain)) {
      HZ.hover = null;
      hbDraw();
    }
  });
  svgEl.addEventListener("dblclick", () => {
    if (HZ.chain) {
      hbEndChain();
      HZ.tool = "vaelg";
      hbRefresh();
    }
  });
  svgEl.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      hbZoom(e.deltaY > 0 ? 1.12 : 1 / 1.12, hbToSvg(e));
    },
    { passive: false },
  );
  const hz = C.root.querySelector(".hz");
  hz.addEventListener("click", hzClick);
  hz.addEventListener(
    "toggle",
    (e) => {
      const d = e.target;
      if (d.dataset?.g) d.open ? HZ.open.add(d.dataset.g) : HZ.open.delete(d.dataset.g);
    },
    true,
  );
  const props = $("hz-props");
  props.addEventListener("input", hzInput);
  props.addEventListener("change", (e) => {
    const f = e.target.dataset?.hzimg;
    if (f && e.target.files?.[0]) return roomPhoto(e.target.files[0], f);
    if (e.target.dataset?.hzfile && e.target.files?.[0]) {
      e.target.files[0].text().then(useJson);
      return;
    }
    if (e.target.dataset?.ep != null) hzInput(e);
  });
  bindPickers(props);
}

/* The keyboard, anywhere on the page while the house is open: undo, delete, escape, arrows to nudge, and more. */
let nudge = null;
function onKey(e) {
  if (!C || C.view !== "husbygger" || !HZ || !C.host?.isConnected) return;
  FREE = e.altKey;
  const path = e.composedPath ? e.composedPath() : [e.target];
  if (path.some((el) => el?.matches?.("input,textarea,select,[contenteditable=true]"))) return;
  if (C.root.querySelector(".sheet-bg")) return;
  const k = e.key, mod = e.metaKey || e.ctrlKey, done = () => {
    e.preventDefault();
    e.stopPropagation();
  };
  if (mod && k.toLowerCase() === "z") {
    done();
    return hzAct(e.shiftKey ? "redo" : "undo");
  }
  if (mod && k.toLowerCase() === "y") {
    done();
    return hzAct("redo");
  }
  if (mod && k.toLowerCase() === "d" && HZ.sel) {
    done();
    return hzAct("dup");
  }
  if (mod && k.toLowerCase() === "a") {
    done();
    HZ.msel = new Set([...HZ.d.items.map((i) => "item:" + i.id), ...HZ.d.rooms.map((r) => "room:" + r.id), ...HZ.d.walls.map((w) => "wall:" + w.id), ...HZ.d.areas.map((a) => "area:" + a.id)]);
    HZ.sel = [...HZ.msel][0] || null;
    return hbRefresh();
  }
  if ((k === "Delete" || k === "Backspace") && HZ.sel) {
    done();
    return hzAct("del");
  }
  if (k === "Escape") {
    done();
    const had = HZ.chain || HZ.pend || HZ.tool !== "vaelg";
    hbEndChain();
    HZ.pend = null;
    HZ.prev = null;
    HZ.marq = null;
    if (had) HZ.tool = "vaelg";
    else {
      HZ.sel = null;
      HZ.msel = new Set();
    }
    return hbRefresh();
  }
  if (k === "Enter" && HZ.chain) {
    done();
    hbEndChain();
    HZ.tool = "vaelg";
    return hbRefresh();
  }
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
  if (arrows && HZ.sel) {
    done();
    const step = e.shiftKey ? 30 : e.altKey ? 1 : 5;
    // Nudges right after each other are one step in the history.
    if (!nudge || Date.now() - nudge.t > 900) nudge = { before: JSON.stringify(HZ.d), base: clone(HZ.d), d: [0, 0] };
    nudge.d = [nudge.d[0] + arrows[0] * step, nudge.d[1] + arrows[1] * step];
    nudge.t = Date.now();
    const was = HZ.snap;
    HZ.snap = false;
    hbMoveSel(nudge.base, selKeys(), nudge.d, nudge.d);
    HZ.snap = was;
    if (!nudge.saved) {
      nudge.saved = 1;
      hbCommit(nudge.before);
    } else markDirty();
    return hbRefresh();
  }
  if ((k === "," || k === ".") && HZ.sel) {
    done();
    return hzAct("rot", String((k === "," ? -1 : 1) * (e.shiftKey ? 90 : 15)));
  }
  if (mod || e.altKey) return;
  const x = { v: "vaelg", r: "rum", w: "vaeg", u: "ude:lawn", d: "door", f: "window", k: "camera" }[k.toLowerCase()];
  if (x) {
    done();
    HZ.tool = x;
    HZ.pend = null;
    hbEndChain();
    hbRefresh();
  }
}
const onKeyUp = (e) => {
  FREE = e.altKey;
};
/* Run a button's action from the keyboard, also when the button isn't on the screen. */
function hzAct(a, id) {
  const b = document.createElement("button");
  b.dataset.hz = a;
  if (id != null) b.dataset.id = id;
  hzClick({ target: b, preventDefault() {} });
}

/* ------------------------------------------------------------------ acts for the live plan */
const planItem = (el) => houseModel(C).items.find((i) => i.id === el.dataset.id);
const acts = {
  "house-ent"(el, e, ctx) {
    C = ctx;
    popId = popId === el.dataset.id ? null : el.dataset.id;
    ctx.render(true);
  },
  "house-pop-close"(el, e, ctx) {
    if (!popId) return;
    popId = null;
    ctx.render(true);
  },
  "house-redit"(el, e, ctx) {
    C = ctx;
    popId = null;
    hbInit(ctx);
    if (HZ.d.rooms.some((r) => r.id === el.dataset.id)) {
      HZ.sel = "room:" + el.dataset.id;
      HZ.tool = "vaelg";
    }
    ctx.go("husbygger");
  },
  "house-edit"(el, e, ctx) {
    C = ctx;
    popId = null;
    hbInit(ctx);
    if (HZ.d.items.some((i) => i.id === el.dataset.id)) {
      HZ.sel = "item:" + el.dataset.id;
      HZ.tool = "vaelg";
    }
    ctx.go("husbygger");
  },
  "house-light"(el, e, ctx) {
    const it = planItem(el);
    if (it?.ent) ctx.call(it.ent.split(".")[0] === "switch" ? "switch" : "light", "toggle", { entity_id: it.ent });
  },
  "house-lcol"(el, e, ctx) {
    const it = planItem(el), c = el.dataset.c;
    if (it?.ent && c) ctx.call("light", "turn_on", { entity_id: it.ent, rgb_color: [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) });
  },
  "house-lfx"(el, e, ctx) {
    const it = planItem(el);
    const s = it?.ent && ctx.hass.states[it.ent];
    if (!s) return;
    const list = (s.attributes.effect_list || []).filter((x) => !/^(none|off|solid)$/i.test(x));
    const on = !!s.attributes.effect && !/^(none|off|solid)$/i.test(s.attributes.effect);
    ctx.call("light", "turn_on", { entity_id: it.ent, effect: on ? (s.attributes.effect_list || []).find((x) => /^(none|off|solid)$/i.test(x)) || "none" : list.find((x) => /colorloop|loop|rainbow|cycle/i.test(x)) || list[0] });
  },
  "house-lock"(el, e, ctx) {
    const it = planItem(el);
    if (!it?.lock) return;
    const locked = ctx.hass.states[it.lock]?.state === "locked";
    ctx.call("lock", locked ? "unlock" : "lock", { entity_id: it.lock });
  },
  "house-cover"(el, e, ctx) {
    const it = planItem(el);
    if (!it?.ent) return;
    const open = ["open", "opening"].includes(ctx.hass.states[it.ent]?.state);
    const go = () => ctx.call("cover", open ? "close_cover" : "open_cover", { entity_id: it.ent });
    if (open) go();
    else ctx.confirm(t("Åbn {name}?", { name: it.name }), t("Porten åbner med det samme."), t("Åbn"), go);
  },
  "house-cover-stop"(el, e, ctx) {
    const it = planItem(el);
    if (it?.ent) ctx.call("cover", "stop_cover", { entity_id: it.ent });
  },
  "house-media"(el, e, ctx) {
    const it = planItem(el);
    if (it?.ent) ctx.call("media_player", "media_play_pause", { entity_id: it.ent });
  },
  "house-power"(el, e, ctx) {
    const it = planItem(el);
    if (it?.ent) ctx.call("media_player", "toggle", { entity_id: it.ent });
  },
  "house-robot"(el, e, ctx) {
    const it = planItem(el);
    const appl = it && (ctx.data.appliances || []).find((a) => a.id === it.appl);
    const ent = it?.ent || appl?.entity;
    if (!ent) return;
    const dom = ent.split(".")[0], s = ctx.hass.states[ent]?.state;
    if (dom === "vacuum") ctx.call("vacuum", ["cleaning"].includes(s) ? "return_to_base" : "start", { entity_id: ent });
    else if (dom === "lawn_mower") ctx.call("lawn_mower", s === "mowing" ? "dock" : "start_mowing", { entity_id: ent });
  },
  "house-cam"(el, e, ctx) {
    const it = planItem(el);
    if (!it?.ent) return;
    const s = ctx.hass.states[it.ent];
    const stream = `/api/camera_proxy_stream/${it.ent}?token=${encodeURIComponent(s?.attributes?.access_token || "")}`;
    const pic = s?.attributes?.entity_picture || "";
    ctx.sheet(`<div class="eyebrow">${esc(t("Kamera"))}</div><h2>${esc(it.name)}</h2><div class="hp-camview"><img src="${esc(s?.attributes?.access_token ? stream : pic)}" alt="${esc(it.name)}"><span class="cam-live"><i></i>LIVE</span></div><div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Luk"))}</button></div>`, { wide: true });
  },
};
const inputs = {
  "house-bri"(el, e, ctx) {
    const it = planItem(el);
    const b = el.parentElement.querySelector("b");
    if (b) b.textContent = el.value;
    if (e.type === "change" && it?.ent) ctx.call("light", "turn_on", { entity_id: it.ent, brightness_pct: +el.value });
  },
  "house-vol"(el, e, ctx) {
    const it = planItem(el);
    const b = el.parentElement.querySelector("b");
    if (b) b.textContent = el.value;
    if (e.type === "change" && it?.ent) ctx.call("media_player", "volume_set", { entity_id: it.ent, volume_level: +el.value / 100 });
  },
};

/* ------------------------------------------------------------------ module */
const css = `
.hp-plan .sec-plan [data-act], .hp-plan .sec-plan [data-go] { cursor: pointer; }
.hp-plan .sec-plan [data-act]:focus-visible, .hp-plan .sec-plan [data-go]:focus-visible { outline: none; }
.hp-plan .sec-plan .sec-room[data-go]:hover, .hp-plan .sec-plan .sec-room[data-go]:focus-visible { fill: color-mix(in srgb, var(--violet) 12%, var(--surface)); }
.hp-plan .sec-ground { cursor: default !important; }
.hp-plan.compact .sec-plan { max-height: 340px; }
.hp-plan .hm-tip { opacity: 0; transition: opacity .3s; pointer-events: none; }
.hp-plan .hm:hover .hm-tip, .hp-plan .hm:focus-visible .hm-tip, .hp-plan .ho:focus-visible .hm-tip { opacity: 1; }
.hp-empty { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 36px 20px; }
.hp-empty .ic.big { width: 44px; height: 44px; color: var(--violet); }
.hp-empty h3 { margin: 0; font: 800 19px var(--font-display); }
.hp-empty p { max-width: 420px; margin: 0 0 6px; }
.hm-pop .hp-cam img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.hm-pop .hp-cam > svg { display: block; width: 100%; height: 100%; }
.hm-pop .hp-art { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; flex: none; display: grid; place-items: center; background: var(--surface-2); color: var(--violet); }
.hm-pop .hp-art .ic { width: 20px; height: 20px; }
.hp-camview { position: relative; border-radius: 18px; overflow: hidden; background: #111; }
.hp-camview img { display: block; width: 100%; max-height: 70vh; object-fit: contain; }
.hp-camview .cam-live { position: absolute; left: 12px; top: 12px; }
.hm-ap .hm-ic { stroke: var(--hc); }
.hp-plan .sec-lbl.lit { fill: #4A3410; }
.hm-breath.alarm { fill: #E5484D !important; opacity: .45; }
#hz-svg .hz-meas { paint-order: stroke; }
.hz-props datalist { display: none; }
.hz-un { max-height: 320px; overflow: auto; }
@media (prefers-reduced-motion: reduce) { .hp-plan animateMotion { display: none; } }

.fu-keys { stroke: #333; stroke-width: .8; } .fu-fire { fill: #FF8A3D; filter: drop-shadow(0 0 3px #FFB347); }
.fu-dash { fill: color-mix(in srgb, var(--ink) 4%, transparent); stroke: color-mix(in srgb, var(--ink) 45%, transparent); stroke-width: 1.3; stroke-dasharray: 4 3; }
.fu-dashln { stroke: color-mix(in srgb, var(--ink) 22%, transparent); stroke-width: 1; }
.fu-basin { fill: color-mix(in srgb, #C9CED6 70%, #fff); stroke: #9AA3AE; stroke-width: 1.1; } .fu-glassd { fill: #2B2F38; } .fu-ring { fill: none; stroke: #6B7280; stroke-width: 1.4; }
.fu-handle { stroke: #9AA3AE; stroke-width: 2.4; stroke-linecap: round; } .fu-duvet2 { fill: color-mix(in srgb, #F2B6C6 60%, var(--surface)); }
.fu-toy { fill: #F2B01E; stroke: #C88A0A; stroke-width: 1; } .fu-dot1 { fill: #E5484D; } .fu-dot2 { fill: #2F6FD6; }
.fu-tent { fill: color-mix(in srgb, #F3E7D3 85%, var(--surface)); stroke: #C9B48F; stroke-width: 1.2; }
.fu-glass { fill: color-mix(in srgb, #BFE3F2 75%, #fff); stroke: #8FB8CC; stroke-width: 1; } .fu-shine { stroke: #fff; stroke-width: 1.4; opacity: .8; }
.fu-panel { fill: #E4E7EB; } .fu-frame { fill: color-mix(in srgb, #9AA3AE 25%, transparent); stroke: #6B7280; stroke-width: 1.2; } .fu-frameln { fill: none; stroke: #6B7280; stroke-width: 3; stroke-linecap: round; }
.fu-rod { stroke: #6B7280; stroke-width: 1.6; stroke-linecap: round; } .fu-shoe { fill: #5B4632; opacity: .7; } .fu-back { fill: none; stroke: #2B2F38; stroke-width: 4; stroke-linecap: round; }
.fu-box { fill: #C9A27A; } .fu-box2 { fill: #8E9AAF; } .fu-wheel { fill: none; stroke: #2B2F38; stroke-width: 2.4; } .fu-bikef { fill: none; stroke: #2F6FD6; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.fu-bin { stroke: rgba(0,0,0,.25); stroke-width: 1; } .fu-lid { fill: rgba(0,0,0,.25); }
.fu-rattan { fill: color-mix(in srgb, #8B6B4A 80%, var(--surface)); stroke: #5E4632; stroke-width: 1.2; } .fu-teak { fill: color-mix(in srgb, #B98652 85%, var(--surface)); stroke: #7A5634; stroke-width: 1.2; }
.fu-cushw { fill: #F2EEE6; stroke: #D8D0C2; stroke-width: 1; } .fu-par1 { fill: #F2EEE6; } .fu-par2 { fill: #E8DCC4; } .fu-par1, .fu-par2 { stroke: #CDBF9F; stroke-width: 1; }
.fu-brick { fill: #B5543A; stroke: #7A3220; stroke-width: 1.2; } .fu-dome { fill: #D9CBB8; stroke: #9C8B74; stroke-width: 1.2; } .fu-grate { fill: none; stroke: #9AA3AE; stroke-width: 1.2; }
.fu-net { fill: none; stroke: color-mix(in srgb, #2B2F38 50%, transparent); stroke-width: 2; stroke-dasharray: 3 3; } .fu-pad { fill: #2F6FD6; } .fu-mat { fill: #1F2430; } .fu-post { fill: #6B7280; }
.fu-sand { fill: #EBD7A6; } .fu-soil { fill: #6B4A2E; }
.fu-roof, .fu-roofk { stroke: rgba(0,0,0,.3); stroke-width: 1.4; } .fu-roof { fill: #59626E; } .fu-roofk { fill: #D96C4E; } .fu-ridge { stroke: rgba(0,0,0,.35); stroke-width: 2.5; }
.fu-shingle { stroke: rgba(255,255,255,.12); stroke-width: 1; } .fu-door { fill: #F2EEE6; }
.hx-wall.k-hedge { stroke: #4E8F3F; stroke-width: 22; stroke-linecap: round; } .hx-hedge2 { stroke: #63A852; stroke-width: 12; stroke-linecap: round; stroke-dasharray: 2 14; pointer-events: none; }
.hx-wall.k-fence { stroke: #8A6440; stroke-width: 4; stroke-linecap: round; } .hx-fence2 { stroke: #6B4A2E; stroke-width: 9; stroke-dasharray: 3 37; pointer-events: none; }
.hz-anchor { fill: var(--surface); stroke: color-mix(in srgb, var(--violet) 60%, transparent); stroke-width: 2; vector-effect: non-scaling-stroke; pointer-events: none; }
.hz-anchor.hot { fill: var(--violet); stroke: #fff; }
.hz-guide { stroke: var(--violet); stroke-width: 1.5; stroke-dasharray: 6 5; vector-effect: non-scaling-stroke; pointer-events: none; opacity: .8; }
.hz-marq { fill: color-mix(in srgb, var(--violet) 10%, transparent); stroke: var(--violet); stroke-width: 1.5; stroke-dasharray: 6 4; vector-effect: non-scaling-stroke; pointer-events: none; }
.hz-msel { fill: none; stroke: var(--violet); stroke-width: 2; stroke-dasharray: 5 4; vector-effect: non-scaling-stroke; pointer-events: none; }
.hz-eh { fill: var(--violet); stroke: #fff; stroke-width: 2; cursor: ew-resize; vector-effect: non-scaling-stroke; }
.hz-save { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: var(--muted); padding: 4px 10px; border-radius: 999px; background: var(--surface-2); }
.hz-save.busy { color: var(--violet); } .hz-save.err { color: var(--bad); background: color-mix(in srgb, var(--bad) 12%, var(--surface)); }
.hz-save .ic { width: 14px; height: 14px; }
.hz-keys { font-size: 11.5px; color: var(--muted); display: grid; gap: 3px; margin: 6px 0 0; }
.hz-keys kbd { font: 700 10.5px var(--font-body); background: var(--surface-2); border-radius: 5px; padding: 1px 5px; box-shadow: inset 0 -1px 0 var(--line); }
.hz-ep { position: relative; }
.hz-epl { position: absolute; z-index: 5; left: 0; right: 0; top: calc(100% + 4px); background: var(--surface); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.18); max-height: 260px; overflow: auto; padding: 4px; }
.hz-epl button { display: block; width: 100%; text-align: left; border: 0; background: transparent; padding: 7px 9px; border-radius: 9px; cursor: pointer; font: inherit; color: var(--ink); }
.hz-epl button:hover, .hz-epl button.on { background: var(--surface-2); } .hz-epl b { display: block; font-size: 13px; } .hz-epl small { font-size: 11px; color: var(--muted); }
.hz-epl .none { padding: 9px; font-size: 12.5px; color: var(--muted); }
.hz-tool.multi[aria-pressed="true"] { background: var(--violet); }
.hz-tools summary { font-size: 9.5px !important; letter-spacing: .2px !important; overflow-wrap: anywhere; hyphens: auto; line-height: 1.25; }
.hz-tools .hz-tl { display: grid; grid-template-columns: minmax(0, 1fr); }
`;

const en = {
  Tegning: "Drawing", "Tegnes ud fra alder og stil": "Drawn from age and style", "Vælg en af de håndtegnede værelser.": "Pick one of the hand-drawn rooms.", Automatisk: "Automatic",
  "Stort barn med sovesofa og skrivebord": "Big child with sofa bed and desk", "Barn med bilbane og juniorseng": "Child with car track and junior bed", "Lille barn med tremmeseng og luftballon": "Little child with cot and balloon",
  "Lampe i vinduet": "Lamp in the window", "Lysbånd over skrivebordet": "Light strip over the desk", "Lille lampe på reolen": "Small lamp on the shelf", Fjerlampe: "Feather lamp", "Luftballon-lampe": "Balloon lamp",
  "Tænd eller sluk {name}": "Turn {name} on or off",
  Tid: "Time", Åbnet: "Opened", "Ingen lås på døren": "No lock on the door", "Ingen lås på vinduet": "No lock on the window", Farveskift: "Colour effect",
  "Åbn i EV Planner ›": "Open in EV Planner ›", "I ladestation": "Docked", "I Home Assistant nu": "In Home Assistant now",
  "Dør": "Door", "Vindue": "Window", "Garageport": "Garage door", "Kamera": "Camera", "Bevægelse": "Motion", "Røgalarm": "Smoke alarm", "Vandføler": "Leak sensor",
  "Højttaler": "Speaker", "TV": "TV", "Lampe": "Lamp", "Termometer": "Thermometer", "Accesspoint": "Access point", "Vaskemaskine": "Washing machine", "Tørretumbler": "Tumble dryer",
  "Opvasker": "Dishwasher", "Ovn": "Oven", "Induktion": "Hob", "Kaffemaskine": "Coffee machine", "Køleskab": "Fridge", "Fryser": "Freezer", "Ventilation": "Ventilation",
  "Robotstøvsuger": "Robot vacuum", "Plæneklipper": "Lawn mower", "Møbel": "Furniture", "Lyskilde": "Light", "Bil": "Car", "Lader": "Charger", "Solceller": "Solar panels",
  "Batteri": "Battery", "Træ": "Tree", "Busk": "Bush",
  "Sofa": "Sofa", "Lænestol": "Armchair", "Dobbeltseng": "Double bed", "Enkeltseng": "Single bed", "Tremmeseng": "Cot", "Spisebord": "Dining table", "Rundt bord": "Round table",
  "Stol": "Chair", "Skrivebord": "Desk", "Garderobeskab": "Wardrobe", "Kommode": "Chest of drawers", "Reol": "Bookcase", "Køkkenbord": "Kitchen counter", "Køkkenø": "Kitchen island",
  "TV-bord": "TV bench", "Badekar": "Bathtub", "Bruseniche": "Shower", "Toilet": "Toilet", "Håndvask": "Sink", "Tæppe": "Rug", "Plante": "Plant",
  "Loftlampe": "Ceiling light", "Pendel": "Pendant", "Spot": "Spotlight", "Gulvlampe": "Floor lamp", "Bordlampe": "Table lamp", "Væglampe": "Wall light", "LED-strip": "LED strip",
  "RGBWW-pære": "RGBWW bulb", "Havelampe": "Garden light",
  "Sat til": "Plugged in", "Venter på bilen": "Waiting for the car", "Lader op": "Charging", "Planlagt": "Scheduled", "Pause": "Paused", "Opladet": "Charged", "Fejl": "Fault", "Ikke sat til": "Not plugged in",
  "Foran venstre": "Front left", "Foran højre": "Front right", "Midt venstre": "Middle left", "Midt højre": "Middle right", "Bag venstre": "Rear left", "Bag højre": "Rear right", "Front": "Front", "Bag": "Rear",
  "Græs": "Lawn", "Fliser": "Paving", "Terrasse": "Deck", "Bed": "Flower bed", "Indkørsel": "Driveway", "Grus": "Gravel",
  "TV-skærm": "TV screen", "Soundbar": "Soundbar",
  "Børneværelse": "Child's room", "Soveværelse": "Bedroom", "Gæsteværelse": "Guest room", "Kontor": "Office", "Stue": "Living room", "Køkken": "Kitchen", "Badeværelse": "Bathroom",
  "Lille bad": "Small bathroom", "Bryggers": "Utility room", "Entré og gang": "Hall", "Walk-in": "Walk-in closet", "Garage": "Garage", "Andet rum": "Other room",
  "Baby": "Baby", "Tumling": "Toddler", "Barn": "Child", "Stort barn": "Big child", "Preteen": "Preteen", "Teenager": "Teenager", "Ung": "Young adult",
  "0–1 år": "0–1 years", "1–3 år": "1–3 years", "4–7 år": "4–7 years", "8–10 år": "8–10 years", "11–12 år": "11–12 years", "13–16 år": "13–16 years", "17+ år": "17+ years",
  "Neutral": "Neutral", "Pige": "Girl", "Dreng": "Boy",
  "Findes ikke i Home Assistant": "Not found in Home Assistant", "Svarer ikke": "Not responding", "Ikke koblet": "Not linked", "Åben": "Open", "Åbent": "Open", "Lukket": "Closed",
  "Kører": "Running", "Live": "Live", "Bevægelse nu": "Motion now", "Rolig · sidst {when}": "Quiet · last {when}", "Røg registreret": "Smoke detected", "OK · ingen røg": "OK · no smoke",
  "Vand registreret": "Water detected", "Tørt": "Dry", "Ikke koblet til en højttaler": "Not linked to a speaker", "Spiller {title}": "Playing {title}", "På pause · {title}": "Paused · {title}",
  "Ledig": "Idle", "Tændt · {title}": "On · {title}", "Tændt": "On", "Slukket": "Off", "Tændt · {n} %": "On · {n} %", "Online": "Online", "Ude": "Away", "Hjemme": "Home",
  "Solen skinner": "The sun is shining", "Ingen sol lige nu": "No sun right now", "Producerer {v} {u}": "Producing {v} {u}", "Ingen produktion lige nu": "Not producing right now",
  "åben": "open", "lukket": "closed", "Åbn {room}": "Open {room}",
  "Huset er ikke tegnet endnu": "The house isn't drawn yet", "Tegn jeres hus i Husbyggeren. Så kan I se døre, vinduer, lys og enheder på planen.": "Draw your house in the House builder. Then you can see doors, windows, lights and devices on the plan.",
  "Åbn Husbyggeren": "Open the House builder", "Grundplan for {name}": "Floor plan of {name}", "huset": "the house",
  "Sidst ændret": "Last changed", "Låst": "Locked", "Ulåst": "Unlocked", "Tryk for at låse op": "Tap to unlock", "Tryk for at låse": "Tap to lock", "Tryk for at lukke": "Tap to close", "Tryk for at åbne": "Tap to open",
  "Stop": "Stop", "Åbn kamera ›": "Open camera ›", "Pause": "Pause", "Afspil": "Play", "Tryk for at slukke": "Tap to turn off", "Tryk for at tænde": "Tap to turn on", "Lydstyrke": "Volume",
  "Åbn i Musik ›": "Open in Music ›", "Ikke koblet til en entitet endnu. Det gøres i Husbyggeren.": "Not linked to an entity yet. Do that in the House builder.", "Lysstyrke": "Brightness", "Farve": "Colour",
  "Sidste bevægelse": "Last motion", "lige nu": "just now", "Ladning": "Charging", "Vælg bilens entiteter i Husbyggeren.": "Choose the car's entities in the House builder.",
  "Ingen biler koblet til laderen.": "No cars linked to the charger.", "Holder pause": "Resting", "Tryk for at sende den hjem": "Tap to send it home", "Tryk for at starte": "Tap to start",
  "Åbn i Apparater ›": "Open in Appliances ›", "Luk": "Close", "Ingen entitet": "No entity", "Redigér": "Edit",
  "Vælg og flyt": "Select and move", "Rum": "Room", "Væg": "Wall", "Tegn": "Draw", "Have og udearealer": "Garden and outdoor areas", "Sikkerhed og sensorer": "Security and sensors", "Lys": "Lights",
  "Møbler": "Furniture", "TV og højttalere": "TV and speakers", "Apparater": "Appliances", "Biler og energi": "Cars and energy",
  "TV-markør": "TV marker", "Højttaler-markør": "Speaker marker", "Lampe-markør": "Lamp marker", "Værktøjer": "Tools",
  "Tryk på planen for at placere {name}.": "Tap the plan to place {name}.", "Tryk på en væg for at sætte {what} i. Den lægger sig ind i væggen.": "Tap a wall to put in the {what}. It snaps into the wall.",
  "Tryk på planen for at placere {what}. Træk i hjørnet for størrelse og i den runde knap for at dreje.": "Tap the plan to place the {what}. Drag the corner to resize and the round handle to rotate.",
  "Tryk på planen for at placere {what}.": "Tap the plan to place the {what}.", "Træk et rektangel for {what}. Bagefter kan du trække i hjørnerne og tilføje knæk.": "Drag a rectangle for the {what}. Afterwards you can drag the corners and add bends.",
  "Træk et rektangel for at tegne et rum. Væggene kommer med af sig selv.": "Drag a rectangle to draw a room. The walls come with it.",
  "Tryk for næste hjørne. Dobbelttryk, Esc eller Færdig for at stoppe.": "Tap for the next corner. Double-tap, Esc or Done to stop.", "Tryk der, hvor væggen starter.": "Tap where the wall starts.",
  "Træk i ting for at flytte dem. Træk i en tom flade for at panorere. Rul eller knib for at zoome.": "Drag things to move them. Drag an empty spot to pan. Scroll or pinch to zoom.",
  "Færdig": "Done", "Annullér": "Cancel", "Husbygger": "House builder", "Byg huset": "Build the house", "Gemmes i Home Assistant, så hele familien ser den samme tegning": "Saved in Home Assistant, so the whole family sees the same drawing",
  "Ikke gemt": "Not saved", "Fortryd": "Undo", "Gentag": "Redo", "Til Sikkerhed": "To Security", "Gem huset": "Save the house", "Tegning af huset": "Drawing of the house",
  "Zoom ind": "Zoom in", "Zoom ud": "Zoom out", "Vis hele huset": "Show the whole house", "Fastgør til gitter": "Snap to grid",
  "Ikke koblet til en entitet": "Not linked to an entity", "Fundet i Home Assistant · {name}": "Found in Home Assistant · {name}", "Skal være en {domain}-entitet": "Must be a {domain} entity",
  "Entitet": "Entity", "Huset": "The house", "Navn": "Name", "Fx Hjemme": "E.g. Home", "rum": "rooms", "vægge": "walls", "døre": "doors", "vinduer": "windows", "enheder": "devices",
  "Kom hurtigt i gang": "Get started quickly", "Hent jeres områder fra Home Assistant som rum. Rumtypen gættes ud fra navnet, og enheder i områderne kan sættes ind med ét tryk.": "Bring in your areas from Home Assistant as rooms. The room type is guessed from the name, and devices in the areas can be placed with one tap.",
  "Start fra jeres områder": "Start from your areas", "Fra Home Assistant, ikke placeret": "From Home Assistant, not placed", "Placér {n} i deres rum": "Place {n} in their rooms", "Placér": "Place",
  "Sådan bygger du": "How to build", "Tegn rum med Rum. Væggene kommer med.": "Draw rooms with Room. The walls come with them.", "Ret vægge med Væg, eller træk i deres ender.": "Adjust walls with Wall, or drag their ends.",
  "Sæt døre, vinduer og porte i væggene, og vælg deres sensor.": "Put doors, windows and garage doors in the walls and choose their sensor.", "Placér kameraer, højttalere, lys og møbler, og kobl dem til en entitet.": "Place cameras, speakers, lights and furniture, and link them to an entity.",
  "Tryk Gem huset. Planen bruger tegningen med det samme.": "Tap Save the house. The plan uses the drawing right away.", "Gem som fil": "Save as file", "Kopiér tegningen": "Copy the drawing", "Indsæt en tegning": "Paste a drawing",
  "Hent fra fil": "Load from file", "Start på en tom tegning": "Start a blank drawing", "Slet": "Delete", "Rumtype": "Room type", "Bestemmer, hvordan rummet tegnes, når det åbnes.": "Decides how the room is drawn when it's opened.",
  "Intet barn valgt": "No child chosen", "Alder": "Age", "Stil": "Style", "Område i Home Assistant": "Area in Home Assistant", "Intet område": "No area",
  "Lys og enheder i området vises, når rummet åbnes.": "Lights and devices in the area show when the room is opened.", "Billede af rummet": "Picture of the room", "Skift billede": "Change picture", "Brug eget billede": "Use your own picture",
  "Brug tegningen": "Use the drawing", "Eget billede.": "Your own picture.", "Tegnes ud fra rumtypen, til I lægger et eget billede ind.": "Drawn from the room type until you add your own picture.",
  "{n} hjørner": "{n} corners", "Lys i rummet": "Light in the room", "Møblér rummet": "Furnish the room", "Åbn rummet": "Open the room", "Tilføj knæk": "Add a bend", "Fjern hjørne": "Remove corner",
  "Træk i hjørnerne for at ændre formen. Træk i rummet for at flytte det.": "Drag the corners to change the shape. Drag the room to move it.", "{m} m på tegningen": "{m} m on the drawing",
  "Slags": "Kind", "Ydervæg": "Outer wall", "Indervæg": "Inner wall", "Åben side": "Open side", "Træk i enderne for at flytte dem. De klikker fast på andre vægges ender.": "Drag the ends to move them. They snap to the ends of other walls.",
  "Udeareal": "Outdoor area", "Tekst": "Text", "Træk i hjørnerne for at give arealet form. Et nyt knæk kommer midt på den længste side, eller efter det hjørne, du har valgt.": "Drag the corners to shape the area. A new bend goes in the middle of the longest side, or after the corner you've chosen.",
  "Farver (RGBWW)": "Colours (RGBWW)", "Lyskilden kan skifte farve og køre farveskift.": "The light can change colour and run colour effects.",
  "Hjemme (device tracker)": "Home (device tracker)", "Batteri i %": "Battery in %", "Ladestatus": "Charging status", "Bilens lås": "The car's lock", "Ladestik på bilen": "Charge port on the car", "Ingen": "None",
  "Ledningen tegnes fra stikket på bilen til laderen, når bilen er sat til. Bilen vises kun, når den er hjemme.": "The cable is drawn from the car's charge port to the charger when the car is plugged in. The car only shows when it's home.",
  "Bredde": "Width", "Dybde": "Depth", "Drejning": "Rotation", "Dublér": "Duplicate", "Apparat i Hverdagsro": "Appliance in Hverdagsro", "Klipper i": "Mows in", "Støvsuger i": "Vacuums in",
  "Der, hvor den står": "Where it stands", "Ladestationen er der, hvor markøren står.": "The dock is where the marker stands.", "Dørblad": "Door leaf", "Hængsel venstre": "Hinge left", "Hængsel højre": "Hinge right",
  "Dobbeltdør": "Double door", "Åbner mod": "Opens towards", "Syd": "South", "Nord": "North", "Øst": "East", "Vest": "West", "Har lås i Home Assistant": "Has a lock in Home Assistant",
  "Så kan I se og styre, om døren er låst.": "Then you can see and control whether the door is locked.", "Så kan I se og styre, om vinduet er låst.": "Then you can see and control whether the window is locked.",
  "Lås": "Lock", "Retning": "Direction", "Synsvinkel": "Field of view", "Rækkevidde": "Range", "Udenfor": "Outside", "Kontaktsensor": "Contact sensor", "Port i HA": "Garage door in HA",
  "Der var ingen væg tæt på. Træk den hen på en væg.": "There was no wall nearby. Drag it onto a wall.",
  "{room} er møbleret med {n} ting. Flyt og drej dem, så de passer.": "{room} is furnished with {n} things. Move and rotate them to fit.",
  "Tegningen er for stor til at blive gemt ({kb} kB). Brug mindre billeder af rummene.": "The drawing is too large to save ({kb} kB). Use smaller pictures of the rooms.",
  "Huset er gemt for hele familien.": "The house is saved for the whole family.",
  "Markér og kopiér teksten. Den kan sættes ind i en anden Hverdagsro igen.": "Select and copy the text. It can be pasted into another Hverdagsro.", "Sæt teksten fra »Kopiér tegningen« ind her.": "Paste the text from “Copy the drawing” here.",
  "Tegningen er sat ind. Husk at gemme.": "The drawing is in. Remember to save.", "Det ligner ikke en tegning fra Husbyggeren": "That doesn't look like a drawing from the House builder",
  "Billedet er lagt ind. Husk at gemme.": "The picture is in. Remember to save.", "Fastgør til gitter: til": "Snap to grid: on", "Fastgør til gitter: fra": "Snap to grid: off",
  "Gem huset først?": "Save the house first?", "Du har ændringer, der ikke er gemt.": "You have changes that aren't saved.", "Forlad uden at gemme": "Leave without saving",
  "{n} rum og arealer er hentet fra Home Assistant. Træk dem på plads, og ret rumtypen, hvis gættet er forkert.": "{n} rooms and areas came from Home Assistant. Drag them into place, and fix the room type if the guess is wrong.",
  "Alle områder fra Home Assistant er allerede med": "All areas from Home Assistant are already in", "{n} enheder er placeret. Træk dem det rigtige sted hen.": "{n} devices are placed. Drag them to the right spot.",
  "Tegningen er kopieret": "The drawing is copied", "Start på en tom tegning?": "Start a blank drawing?", "Tegningen ryddes. Du kan fortryde, til du gemmer.": "The drawing is cleared. You can undo until you save.",
  "Ryd tegningen": "Clear the drawing", "Træk lidt længere for at tegne": "Drag a little further to draw", "Rum {n}": "Room {n}", "Åbn {name}?": "Open {name}?", "Porten åbner med det samme.": "The door opens right away.", "Åbn": "Open",
};

export default {
  id: "house",
  views: {
    husbygger: {
      parentOnly: true,
      module: "house",
      title: () => t("Husbygger"),
      replace: true, // drawn and bound by hand: replaced, never patched
      keep: true, // and left alone while it is open, so a drag is never cut off by an update
      render(ctx) {
        C = ctx;
        hbInit(ctx);
        return pHouse();
      },
      after(ctx) {
        C = ctx;
        hbBind();
      },
    },
  },
  acts,
  inputs,
  init(ctx) {
    C = ctx;
    // On the document, so the keys work wherever the focus is, and before Home Assistant's own shortcuts.
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("pagehide", flushSave);
    document.addEventListener("visibilitychange", () => document.hidden && flushSave());
    window.addEventListener("resize", () => {
      if (!HZ || ctx.view !== "husbygger") return;
      const el = ctx.$("hz-svg");
      if (!el || !el.clientWidth) return;
      const v = HZ.view;
      HZ.view = [v[0], v[1], v[2], (v[2] * el.clientHeight) / el.clientWidth];
      hbDraw();
    });
  },
  css,
  en,
};
