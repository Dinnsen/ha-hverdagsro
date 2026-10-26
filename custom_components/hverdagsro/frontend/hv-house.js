/* Hverdagsro – the house: one model for the live plan (Huset/Sikkerhed, rooms) and the Husbygger.

   The model is stored in ctx.data.house:
     { name, rooms: [{ id, name, rtype, area, light, pts, kid, age, style, img }],
       walls: [{ id, a: [x, y], b: [x, y], k: "ext" | "int" | "open" }],
       areas: [{ id, kind, name, pts } | { id, kind: "label", name, x, y, rot }],
       items: [{ type, id, name, x, y, ent, ... }] }
   1 metre is 60 units on the drawing. Live states come from each item's entities; nothing here is made up. */
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
  ap: ["Accesspoint", "wifi", "#F97316", "sensor,device_tracker", "netvaerk"],
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
const FURN = {
  sofa: ["Sofa", 230, 95], arm: ["Lænestol", 85, 85], bed2: ["Dobbeltseng", 180, 200], bed1: ["Enkeltseng", 90, 200], crib: ["Tremmeseng", 70, 140],
  table: ["Spisebord", 200, 95], tround: ["Rundt bord", 110, 110], chair: ["Stol", 48, 50], desk: ["Skrivebord", 120, 60], wardrobe: ["Garderobeskab", 120, 60],
  dresser: ["Kommode", 100, 50], shelf: ["Reol", 120, 35], counter: ["Køkkenbord", 300, 62], island: ["Køkkenø", 200, 100], tvbench: ["TV-bord", 180, 40],
  tub: ["Badekar", 170, 75], shower: ["Bruseniche", 90, 90], toilet: ["Toilet", 40, 65], sink: ["Håndvask", 60, 45], rug: ["Tæppe", 240, 170], plant: ["Plante", 50, 50],
};
const ROUNDF = new Set(["tround", "plant"]);
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
    case "ap":
      return L.ent ? [C.hass.formatEntityState ? C.hass.formatEntityState(L.s) : String(L.val), "ok"] : [t("Online"), "ok"];
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
  const W = w / 2, Hh = h / 2;
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

/* Openings: a door with leaf and swing, a window with glass, a port with slats. */
function hOpening(it, o) {
  const plan = o.mode === "plan", L = lv(it), h = it.dir === "h", w = it.w || 60, x = it.x, y = it.y, hw = w / 2, T = 16, col = HT[it.type][2];
  const open = plan && L.open, off = plan && L.off;
  const st = off ? " off" : open ? " open" : "";
  let s = h ? `<rect x="${x - hw}" y="${y - T / 2}" width="${w}" height="${T}" class="ho-gap"/>` : `<rect x="${x - T / 2}" y="${y - hw}" width="${T}" height="${w}" class="ho-gap"/>`;
  const nx = h ? 0 : it.side || 1, ny = h ? it.side || 1 : 0;
  if (it.type === "door") {
    const leaf = (hx, hy, ax, ay, Ln) => {
      const base = (Math.atan2(ay, ax) * 180) / Math.PI, sg = Math.sign(ax * ny - ay * nx) || 1, ang = sg * 82, er = (ang * Math.PI) / 180;
      return `<g transform="translate(${hx},${hy}) rotate(${base})"><path class="ho-arc" d="M${Ln},0 A${Ln},${Ln} 0 0 ${sg > 0 ? 1 : 0} ${f1(Ln * Math.cos(er))},${f1(Ln * Math.sin(er))}"/><g class="ho-leaf" style="--ang:${ang}deg;transform:rotate(${open ? ang : 0}deg)"><rect x="0" y="-3.5" width="${Ln}" height="7" rx="3"/></g><circle r="4.5" class="ho-hinge"/></g>`;
    };
    const sx = h ? x - hw : x, sy = h ? y : y - hw, ex = h ? x + hw : x, ey = h ? y : y + hw;
    if (it.dbl) s += leaf(sx, sy, ex - sx, ey - sy, hw) + leaf(ex, ey, sx - ex, sy - ey, hw);
    else s += it.hinge === "r" ? leaf(ex, ey, sx - ex, sy - ey, w) : leaf(sx, sy, ex - sx, ey - sy, w);
  } else if (it.type === "window") {
    s += h
      ? `<line x1="${x - hw}" y1="${y - 3}" x2="${x + hw}" y2="${y - 3}" class="ho-glass"/><line x1="${x - hw}" y1="${y + 3}" x2="${x + hw}" y2="${y + 3}" class="ho-glass"/>`
      : `<line x1="${x - 3}" y1="${y - hw}" x2="${x - 3}" y2="${y + hw}" class="ho-glass"/><line x1="${x + 3}" y1="${y - hw}" x2="${x + 3}" y2="${y + hw}" class="ho-glass"/>`;
    if (open) s += `<g transform="translate(${h ? x - hw : x},${h ? y : y - hw}) rotate(${h ? 0 : 90})"><g class="ho-sash" style="--ang:${(h ? ny : -nx) * 28}deg;transform:rotate(${(h ? ny : -nx) * 28}deg)"><rect x="0" y="-3" width="${w}" height="6" rx="3"/></g></g>`;
  } else {
    const n = Math.max(3, Math.round(w / 26));
    s += `<g class="ho-port${open ? " a-open" : ""}">${
      h
        ? `<rect x="${x - hw}" y="${y - 7}" width="${w}" height="14" rx="4" class="ho-pbody"/>${Array.from({ length: n - 1 }, (_, i) => `<line x1="${x - hw + ((i + 1) * w) / n}" y1="${y - 7}" x2="${x - hw + ((i + 1) * w) / n}" y2="${y + 7}" class="ho-pln"/>`).join("")}`
        : `<rect x="${x - 7}" y="${y - hw}" width="14" height="${w}" rx="4" class="ho-pbody"/>`
    }</g>`;
    if (plan) s += `<text x="${h ? x : x + 30}" y="${h ? y - 26 : y}" class="sec-lbl sm ho-plbl" text-anchor="middle">${esc(it.short || it.name)} · ${esc(open ? t("åben") : t("lukket"))}</text>`;
  }
  const hasLock = it.lockOn && it.lock;
  if (hasLock) {
    const locked = plan ? L.locked : true;
    const lx = x + nx * 30 + (h ? hw - 8 : 0), ly = y + ny * 30 + (h ? 0 : hw - 8);
    s += `<g class="ho-lock${locked ? " locked" : ""}"><circle cx="${lx}" cy="${ly}" r="13"/><path d="M${lx - 5},${ly - 1} h10 v8 h-10z" class="lk-body"/><path class="lk-sh" d="M${lx - 3.2},${ly - 1} v-3.4 a3.2,3.2 0 0 1 6.4,0 v3.4"/></g>`;
  }
  return `<g class="ho ho-${it.type}${st}${hasLock ? " haslock" : ""}${!plan && o.sel === it.id ? " sel" : ""}" style="--hc:${col}" ${hit(it, plan, plan ? hState(it)[0] : "")}><circle cx="${x}" cy="${y}" r="${Math.max(30, hw * 0.8)}" class="ho-hit"/>${open ? `<circle cx="${x}" cy="${y}" r="${hw * 0.7 + 10}" class="ho-alert"/>` : ""}${s}</g>`;
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
      s += `<g class="hx-area k-${esc(a.kind)}${sel}"${at}><polygon points="${pts(a.pts)}" ${fill(a.kind) ? `fill="${fill(a.kind)}"` : `class="hx-${esc(a.kind)}"`}/>${a.kind === "bed" ? "" : `<text x="${f1(cx)}" y="${f1(cy + 8)}" class="sec-lbl out" text-anchor="middle">${esc(a.name)}</text>`}</g>`;
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
    s += `<line x1="${w.a[0]}" y1="${w.a[1]}" x2="${w.b[0]}" y2="${w.b[1]}" class="hx-wall k-${esc(w.k || "int")}${o.sel === "wall:" + w.id ? " sel" : ""}"${plan ? ` pointer-events="none"` : ` data-he="wall:${esc(w.id)}"`}/>`;
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
const HZ_GROUPS = [
  ["tegn", "Tegn", ["vaelg", "rum", "vaeg"]],
  ["ude", "Have og udearealer", ["ude:lawn", "ude:tiles", "ude:deck", "ude:bed", "ude:drive", "ude:gravel", "tree", "bush", "light:garden"]],
  ["sik", "Sikkerhed og sensorer", ["door", "window", "port", "camera", "motion", "smoke", "leak", "temp", "ap"]],
  ["lys", "Lys", Object.keys(LIGHTK).filter((k) => k !== "garden").map((k) => "light:" + k).concat(["lamp"])],
  ["mob", "Møbler", Object.keys(FURN).map((k) => "furn:" + k)],
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
  HZ = { open: new Set(["tegn", "mob", "lys"]), d, base, sel: null, tool: "vaelg", view: hBox(d), snap: true, hist: [], fut: [], dirty: false, chain: null, hover: null, pend: null, corner: null, grp: "tegn", fitted: false };
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
  HZ.dirty = true;
}

function toolInfo(id) {
  const [b, sub] = id.split(":"), mini = (inner, vb = "-32 -32 64 64") => `<svg viewBox="${vb}" class="hz-mini">${inner}</svg>`;
  if (b === "ude") return [t(AREAK[sub]), `<span class="hz-sw k-${sub}"></span>`];
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
  if (HZ.tool === "vaeg") return HZ.chain ? t("Tryk for næste hjørne. Dobbelttryk, Esc eller Færdig for at stoppe.") : t("Tryk der, hvor væggen starter.");
  return t("Træk i ting for at flytte dem. Træk i en tom flade for at panorere. Rul eller knib for at zoome.");
}
const hintHtml = () =>
  `<span>${esc(hbHint())}</span>${HZ.chain ? `<button class="btn sm" data-hz="endwall">${esc(t("Færdig"))}</button>` : HZ.pend || HZ.tool !== "vaelg" ? `<button class="btn soft sm" data-hz="tool" data-id="vaelg">${esc(t("Annullér"))}</button>` : ""}`;

function pHouse() {
  const D = HZ.d;
  return `<div class="hz">
  <section class="hz-top"><div><span class="eyebrow">${esc(t("Husbygger"))}${D.name ? ` · ${esc(D.name)}` : ""}</span><h2 class="h2">${esc(t("Byg huset"))}</h2><span class="hz-sync">${svg("users")}${esc(t("Gemmes i Home Assistant, så hele familien ser den samme tegning"))}</span></div>
    <div class="hz-acts">${HZ.dirty ? `<span class="hz-dirty">${esc(t("Ikke gemt"))}</span>` : ""}<button class="iconbtn" data-hz="undo" aria-label="${esc(t("Fortryd"))}" ${HZ.hist.length ? "" : "disabled"}>${svg("undo")}</button><button class="iconbtn" data-hz="redo" aria-label="${esc(t("Gentag"))}" ${HZ.fut.length ? "" : "disabled"}>${svg("redo")}</button>
      ${C.on("security") && C.views.sikkerhed ? `<button class="btn soft" data-hz="leave">${esc(t("Til Sikkerhed"))}</button>` : ""}<button class="btn" data-hz="save" ${HZ.dirty ? "" : "disabled"}>${svg("check")}${esc(t("Gem huset"))}</button></div></section>
  <div class="hz-body">
    ${hzPalette()}
    <div class="hz-canvas"><svg id="hz-svg" viewBox="${HZ.view.join(" ")}" aria-label="${esc(t("Tegning af huset"))}"></svg>
      <div class="hz-zoom"><button class="iconbtn" data-hz="zin" aria-label="${esc(t("Zoom ind"))}">${svg("zin")}</button><button class="iconbtn" data-hz="zout" aria-label="${esc(t("Zoom ud"))}">${svg("zout")}</button><button class="iconbtn" data-hz="fit" aria-label="${esc(t("Vis hele huset"))}">${svg("fit")}</button><button class="iconbtn${HZ.snap ? " on" : ""}" data-hz="snap" aria-pressed="${HZ.snap}" aria-label="${esc(t("Fastgør til gitter"))}">${svg("grid")}</button></div>
      <div class="hz-hint" id="hz-hint">${hintHtml()}</div></div>
    <aside class="hz-props" id="hz-props">${hbProps()}</aside>
  </div></div>`;
}

/* Entity fields: an input with a list of matching entities from Home Assistant. */
function domList(dom) {
  const doms = String(dom || "").split(",").filter(Boolean);
  const ids = Object.keys(C.hass?.states || {}).filter((id) => !doms.length || doms.includes(id.split(".")[0]));
  return ids.sort().slice(0, 1500);
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
  const list = `dl-${key}-${String(dom || "all").replace(/,/g, "-")}`;
  const opts = domList(dom).map((id) => `<option value="${esc(id)}">${esc(C.hass.states[id].attributes.friendly_name || "")}</option>`).join("");
  return fld(lbl || t("Entitet"), `<input data-hf="${key}" value="${esc(val || "")}" list="${list}" placeholder="${esc(String(dom || "").split(",")[0] || "sensor")}.…" autocomplete="off" spellcheck="false"><datalist id="${list}">${opts}</datalist>`, `<span class="hz-ei" data-ei="${key}" data-dom="${esc(dom || "")}">${entInfo(val, dom)}</span>`);
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
  const D = HZ.d, o = hbFind(HZ.sel);
  if (!o) {
    const un = suggestions();
    const areas = C.areas();
    const placeable = un.filter((s) => s[3] && D.rooms.some((r) => r.area === s[3])).length;
    return `<div class="hz-ov"><h3>${esc(t("Huset"))}</h3>${fld(t("Navn"), `<input data-hf="hname" value="${esc(D.name)}" placeholder="${esc(t("Fx Hjemme"))}">`)}
      <div class="hz-cnt">${[["room", D.rooms.length, t("rum")], ["wall", D.walls.length, t("vægge")], ["door", D.items.filter((i) => i.type === "door").length, t("døre")], ["window", D.items.filter((i) => i.type === "window").length, t("vinduer")], ["camera", D.items.filter((i) => !OPENING.has(i.type) && i.type !== "furn").length, t("enheder")]].map(([ic, n, l]) => `<span>${svg(ic)}<b class="num">${n}</b>${esc(l)}</span>`).join("")}</div>
      ${areas.length ? `<div class="hz-quick"><b>${esc(t("Kom hurtigt i gang"))}</b><span>${esc(t("Hent jeres områder fra Home Assistant som rum. Rumtypen gættes ud fra navnet, og enheder i områderne kan sættes ind med ét tryk."))}</span><button class="btn sm" data-hz="haimport">${svg("house")}${esc(t("Start fra jeres områder"))}</button></div>` : ""}
      ${un.length ? `<h4>${esc(t("Fra Home Assistant, ikke placeret"))}</h4>${placeable ? `<button class="btn soft sm" data-hz="autoplace" style="margin-bottom:8px">${svg("sparkle")}${esc(t("Placér {n} i deres rum", { n: placeable }))}</button>` : ""}<div class="hz-un">${un.map(([ty, e, n]) => `<button data-hz="pend" data-id="${esc(e)}" style="--hc:${HT[ty][2]}">${svg(HT[ty][1])}<span><b>${esc(n)}</b><small>${esc(e)}</small></span><i>${esc(t("Placér"))}</i></button>`).join("")}</div>` : ""}
      <h4>${esc(t("Sådan bygger du"))}</h4><ol class="hz-how"><li>${esc(t("Tegn rum med Rum. Væggene kommer med."))}</li><li>${esc(t("Ret vægge med Væg, eller træk i deres ender."))}</li><li>${esc(t("Sæt døre, vinduer og porte i væggene, og vælg deres sensor."))}</li><li>${esc(t("Placér kameraer, højttalere, lys og møbler, og kobl dem til en entitet."))}</li><li>${esc(t("Tryk Gem huset. Planen bruger tegningen med det samme."))}</li></ol>
      <div class="hz-reset"><div class="hz-io"><button class="btn soft sm" data-hz="export">${svg("share")}${esc(t("Gem som fil"))}</button><button class="btn soft sm" data-hz="copy">${svg("share")}${esc(t("Kopiér tegningen"))}</button><button class="btn soft sm" data-hz="import">${svg("plus")}${esc(t("Indsæt en tegning"))}</button><label class="btn soft sm hz-up">${svg("plus")}${esc(t("Hent fra fil"))}<input type="file" accept="application/json,.json" data-hzfile="1" hidden></label></div><button class="btn soft sm" data-hz="blank">${esc(t("Start på en tom tegning"))}</button></div></div>`;
  }
  const k = HZ.sel.split(":")[0];
  const del = `<button class="btn soft sm danger-t" data-hz="del">${svg("trash")}${esc(t("Slet"))}</button>`;
  if (k === "room") {
    const kids = C.children();
    let meta = fld(t("Rumtype"), sel("rtype", RTYPES.map(([a, b]) => [a, t(b)]), o.rtype || guessType(o.name)), `<span class="t-sub" style="font-size:11.5px">${esc(t("Bestemmer, hvordan rummet tegnes, når det åbnes."))}</span>`);
    if ((o.rtype || guessType(o.name)) === "kid")
      meta += `<div class="hz-lock">${fld(t("Barn"), sel("kid", [["", t("Intet barn valgt")], ...kids.map((m) => [m.id, m.name])], o.kid || ""))}${fld(t("Alder"), sel("age", AGES.map(([a, n, y]) => [a, `${t(n)} · ${t(y)}`]), o.age || "child"))}<div class="hz-f" style="margin:0"><span>${esc(t("Stil"))}</span><div class="seg">${GSTYLES.map(([a, n]) => `<button data-hz="rstyle" data-id="${a}" aria-pressed="${(o.style || "neutral") === a}">${esc(t(n))}</button>`).join("")}</div></div></div>`;
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
      <div class="hz-f"><span>${esc(t("Slags"))}</span><div class="seg">${[["ext", t("Ydervæg")], ["int", t("Indervæg")], ["open", t("Åben side")]].map(([v, n]) => `<button data-hz="wallk" data-id="${v}" aria-pressed="${(o.k || "int") === v}">${esc(n)}</button>`).join("")}</div></div>
      <p class="t-sub">${esc(t("Træk i enderne for at flytte dem. De klikker fast på andre vægges ender."))}</p><div class="hz-row2">${del}</div></div>`;
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
  if (OPENING.has(o.type))
    ex +=
      fld(t("Bredde"), `<input type="range" min="30" max="${o.type === "port" ? 320 : 200}" value="${o.w}" data-hf="w">`) +
      (o.type === "door"
        ? `<div class="hz-f"><span>${esc(t("Dørblad"))}</span><div class="seg">${[["l", t("Hængsel venstre")], ["r", t("Hængsel højre")], ["dbl", t("Dobbeltdør")]].map(([v, x]) => `<button data-hz="hinge" data-id="${v}" aria-pressed="${v === "dbl" ? !!o.dbl : !o.dbl && (o.hinge || "l") === v}">${esc(x)}</button>`).join("")}</div></div>`
        : "") +
      (o.type !== "port" ? `<div class="hz-f"><span>${esc(t("Åbner mod"))}</span><div class="seg"><button data-hz="side" data-id="1" aria-pressed="${(o.side || 1) === 1}">${esc(o.dir === "h" ? t("Syd") : t("Øst"))}</button><button data-hz="side" data-id="-1" aria-pressed="${o.side === -1}">${esc(o.dir === "h" ? t("Nord") : t("Vest"))}</button></div></div>` : "");
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
  const o = hbFind(HZ.sel), hr = 8 * k;
  if (o && HZ.sel.startsWith("room:")) s += o.pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${hr}" class="hz-h${HZ.corner === i ? " on" : ""}" data-hh="room:${esc(o.id)}:${i}"/>`).join("");
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
    const ty = toolType(HZ.pend ? HZ.pend.type : HZ.tool), sp = OPENING.has(ty) ? hbWallSnap(HZ.hover) : null, p = sp ? sp.p : HZ.hover;
    s += `<circle cx="${p[0]}" cy="${p[1]}" r="18" class="hz-ghost" style="--hc:${HT[ty][2]}"/>`;
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
  const sv = root.querySelector(".hz-acts [data-hz=save]");
  if (sv) sv.disabled = !HZ.dirty;
  const ac = root.querySelector(".hz-acts");
  if (ac) {
    const d = ac.querySelector(".hz-dirty");
    if (HZ.dirty && !d) ac.insertAdjacentHTML("afterbegin", `<span class="hz-dirty">${esc(t("Ikke gemt"))}</span>`);
    if (!HZ.dirty && d) d.remove();
  }
  root.querySelectorAll(".hz-tool").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === (HZ.pend ? HZ.pend.type : HZ.tool))));
}

const sn = (v) => (HZ.snap ? Math.round(v / 10) * 10 : Math.round(v * 2) / 2);
function hbMagnet(p, skip) {
  let best = null, bd = 16 * (HZ.k || 1);
  const test = (q) => {
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = q;
    }
  };
  HZ.d.walls.forEach((w) => w !== skip && (test(w.a), test(w.b)));
  HZ.d.rooms.forEach((r) => r.pts.forEach(test));
  return best ? [best[0], best[1]] : [sn(p[0]), sn(p[1])];
}
function hbWallSnap(p, maxD = 46) {
  let best = null, bd = maxD;
  HZ.d.walls.forEach((w) => {
    const [ax, ay] = w.a, [bx, by] = w.b, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const tt_ = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L2)), q = [ax + dx * tt_, ay + dy * tt_], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) {
      bd = d;
      const hz = Math.abs(dx) >= Math.abs(dy);
      best = { p: [hz ? sn(q[0]) : q[0], hz ? q[1] : sn(q[1])], dir: hz ? "h" : "v" };
    }
  });
  return best;
}
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
  const sp = OPENING.has(ty) ? hbWallSnap(p) : null, q = sp ? sp.p : [sn(p[0]), sn(p[1])], same = HZ.d.items.filter((i) => i.type === ty).length + 1;
  const zr = ROBOT.has(ty) ? (ty === "mower" ? HZ.d.areas.find((z) => z.kind === "lawn" && z.pts) || roomAt(HZ.d, q[0], q[1]) : roomAt(HZ.d, q[0], q[1])) : null;
  if (zr) pre = Object.assign({ zone: zr.id }, pre);
  if (APK.has(ty) && !pre.appl) {
    const known = (C.data.appliances || []).find((a) => a.kind === ty && !HZ.d.items.some((i) => i.appl === a.id));
    if (known) pre = Object.assign({ name: known.name || C.name(known.entity), appl: known.id }, pre);
  }
  const it = Object.assign(
    { type: ty, id: hbId(ty[0]), name: `${t(HT[ty][0])} ${same}`, x: q[0], y: q[1], ent: "" },
    OPENING.has(ty) ? { dir: sp ? sp.dir : "h", w: ty === "port" ? 150 : ty === "window" ? 90 : 60, side: 1, hinge: "l" } : {},
    ty === "camera" ? { a: 270, s: 60, r: 220 } : {},
    pre,
  );
  return { it, snapped: !!sp };
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

/* Furnish a room by its type: furniture and lights fitted into the room. */
function furnish(r) {
  const [x0, y0, x1, y1] = bbox(r.pts), W = x1 - x0, Hh = y1 - y0;
  const rtype = r.rtype || guessType(r.name);
  let set = FURNSET[rtype] || FURNSET.other;
  if (rtype === "kid" && (r.age === "baby" || r.age === "toddler")) set = set.map((s) => (s[0] === "furn:bed1" ? ["furn:crib", s[1], s[2], s[3]] : s));
  const inside = HZ.d.items.filter((i) => (i.type === "furn" || i.type === "light") && pip([i.x, i.y], r.pts));
  if (inside.length) HZ.d.items = HZ.d.items.filter((i) => !inside.includes(i));
  let n = 0;
  for (const [tool, fx, fy, rot] of set) {
    const { it } = newItem(tool, [x0 + W * fx, y0 + Hh * fy], { rot });
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
    if (tool.startsWith("light:") && n === 0 && r.light && (tool === "light:ceiling" || tool === "light:pendant")) it.ent = r.light;
    if (tool === "light:ceiling" || tool === "light:pendant") {
      if (r.light && !it.ent) it.ent = r.light;
      n++;
    }
    HZ.d.items.push(it);
  }
  return set.length;
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
  const clean = cleanHouse(HZ.d);
  const size = JSON.stringify(clean).length;
  if (size > 600000) {
    C.toast(t("Tegningen er for stor til at blive gemt ({kb} kB). Brug mindre billeder af rummene.", { kb: Math.round(size / 1024) }));
    return;
  }
  const btn = C.root.querySelector(".hz-acts [data-hz=save]");
  if (btn) btn.disabled = true;
  const ok = await C.save("house", clean);
  if (ok) {
    HZ.dirty = false;
    HZ.hist = [];
    HZ.fut = [];
    HZ.base = JSON.stringify(C.data.house || {});
    hbRefresh(false);
    C.toast(t("Huset er gemt for hele familien."));
  } else if (btn) btn.disabled = false;
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
    HZ.chain = null;
    HZ.hover = null;
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
    HZ.chain = null;
    HZ.hover = null;
    HZ.tool = "vaelg";
    return hbRefresh();
  }
  if (a === "undo" && HZ.hist.length) {
    HZ.fut.push(JSON.stringify(HZ.d));
    HZ.d = JSON.parse(HZ.hist.pop());
    HZ.dirty = true;
    if (!hbFind(HZ.sel)) HZ.sel = null;
    return hbRefresh();
  }
  if (a === "redo" && HZ.fut.length) {
    HZ.hist.push(JSON.stringify(HZ.d));
    HZ.d = JSON.parse(HZ.fut.pop());
    HZ.dirty = true;
    if (!hbFind(HZ.sel)) HZ.sel = null;
    return hbRefresh();
  }
  if (a === "zin") return hbZoom(1 / 1.25);
  if (a === "zout") return hbZoom(1.25);
  if (a === "fit") return hbFit();
  if (a === "snap") {
    HZ.snap = !HZ.snap;
    b.classList.toggle("on", HZ.snap);
    b.setAttribute("aria-pressed", String(HZ.snap));
    return C.toast(HZ.snap ? t("Fastgør til gitter: til") : t("Fastgør til gitter: fra"));
  }
  if (a === "save") return hbSave();
  if (a === "leave") {
    if (HZ.dirty) return C.confirm(t("Gem huset først?"), t("Du har ændringer, der ikke er gemt."), t("Forlad uden at gemme"), () => leave(true));
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
    const i = HZ.sel.indexOf(":"), k = HZ.sel.slice(0, i), oid = HZ.sel.slice(i + 1), D = HZ.d;
    if (k === "item") D.items = D.items.filter((x) => x.id !== oid);
    if (k === "room") D.rooms = D.rooms.filter((x) => x.id !== oid);
    if (k === "wall") D.walls = D.walls.filter((x) => x.id !== oid);
    if (k === "area") D.areas = D.areas.filter((x) => x.id !== oid);
    HZ.sel = null;
    return hbRefresh();
  }
  if (!o) return;
  hbPush();
  if (a === "furnish") {
    const n = furnish(o);
    C.toast(t("{room} er møbleret med {n} ting. Flyt og drej dem, så de passer.", { room: o.name, n }));
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
  if (a === "rstyle") o.style = id;
  if (a === "noimg") delete o.img;
  if (a === "rot") o.rot = ((((o.rot || 0) + +id) % 360) + 360) % 360;
  if (a === "carcol") o.col = id;
  if (a === "dup") {
    const c = Object.assign(clone(o), { id: hbId(o.type[0]), x: o.x + 24, y: o.y + 24 });
    HZ.d.items.push(c);
    HZ.sel = "item:" + c.id;
  }
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
  if (f === "hname") {
    HZ.d.name = el.value;
    HZ.dirty = true;
    return hbRefresh(false);
  }
  const o = hbFind(HZ.sel);
  if (!o) return;
  if (!HZ.typing) {
    hbPush();
    HZ.typing = 1;
    setTimeout(() => (HZ && (HZ.typing = 0)), 900);
  }
  HZ.dirty = true;
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
  o[f] = ["w", "a", "s", "r"].includes(f) ? +el.value : el.value.trim ? el.value.trim() : el.value;
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
      return;
    }
    const p = hbToSvg(e), tg = e.target, hh = tg.closest("[data-hh]"), he = tg.closest("[data-he]"), D = HZ.d;
    if (HZ.pend) return hbPlace(HZ.pend.type, p, { name: HZ.pend.name, ent: HZ.pend.ent });
    if (isPlace(HZ.tool)) return hbPlace(HZ.tool, p);
    if (HZ.tool === "rum" || HZ.tool.startsWith("ude:")) {
      const a = [sn(p[0]), sn(p[1])];
      HZ.prev = { a, b: a };
      drag = { kind: "rect" };
      return;
    }
    if (HZ.tool === "vaeg") {
      const q = hbMagnet(p);
      if (!HZ.chain) HZ.chain = q;
      else {
        hbPush();
        hbAddWall(HZ.chain, HZ.hover || q, "int");
        HZ.chain = HZ.hover || q;
      }
      hbRefresh(false);
      return;
    }
    if (hh) {
      const [k, id, i] = hh.dataset.hh.split(":");
      drag = { kind: "handle", k, id, i, before: JSON.stringify(D), moved: false };
      if (k === "room" || k === "area") HZ.corner = +i;
      return;
    }
    if (he) {
      const key = he.dataset.he;
      if (HZ.sel !== key) {
        HZ.sel = key;
        HZ.corner = null;
        hbRefresh();
      }
      drag = { kind: "move", key, start: p, orig: clone(hbFind(key)), before: JSON.stringify(D), moved: false };
      return;
    }
    if (HZ.sel) {
      HZ.sel = null;
      HZ.corner = null;
      hbRefresh();
    }
    drag = { kind: "pan", c: [e.clientX, e.clientY], v: [...HZ.view] };
  });
  svgEl.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      HZ.view = [...pinch.v];
      const r = svgEl.getBoundingClientRect(), mid = [((a[0] + b[0]) / 2 - r.left) / r.width, ((a[1] + b[1]) / 2 - r.top) / r.height];
      hbZoom(pinch.d / d, [pinch.v[0] + mid[0] * pinch.v[2], pinch.v[1] + mid[1] * pinch.v[3]]);
      return;
    }
    const p = hbToSvg(e);
    if (HZ.tool === "vaeg" && HZ.chain) {
      let q = hbMagnet(p);
      const dx = q[0] - HZ.chain[0], dy = q[1] - HZ.chain[1];
      if (Math.abs(dx) < Math.abs(dy) * 0.18) q = [HZ.chain[0], q[1]];
      else if (Math.abs(dy) < Math.abs(dx) * 0.18) q = [q[0], HZ.chain[1]];
      HZ.hover = q;
      return hbDraw();
    }
    if (isPlace(HZ.tool) || HZ.pend) {
      HZ.hover = p;
      return hbDraw();
    }
    if (!drag) return;
    if (drag.kind === "pan") {
      const r = svgEl.getBoundingClientRect(), f = drag.v[2] / r.width;
      HZ.view = [drag.v[0] - (e.clientX - drag.c[0]) * f, drag.v[1] - (e.clientY - drag.c[1]) * f, drag.v[2], drag.v[3]];
      return hbDraw();
    }
    if (drag.kind === "rect") {
      HZ.prev.b = [sn(p[0]), sn(p[1])];
      return hbDraw();
    }
    if (drag.kind === "handle" && drag.k === "obj") {
      const o = hbFind("item:" + drag.id), dx = p[0] - o.x, dy = p[1] - o.y, a = ((o.rot || 0) * Math.PI) / 180;
      drag.moved = true;
      if (drag.i === "rs") {
        const lx = dx * Math.cos(a) + dy * Math.sin(a), ly = -dx * Math.sin(a) + dy * Math.cos(a), s5 = (v) => (HZ.snap ? Math.round(v / 3) * 3 : v);
        o.w = Math.max(6, s5(2 * Math.abs(lx)));
        o.h = isRoundObj(o) ? o.w : Math.max(3, s5(2 * Math.abs(ly)));
      } else {
        let ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (HZ.snap) ang = Math.round(ang / 15) * 15;
        o.rot = ((Math.round(ang) % 360) + 360) % 360;
      }
      return hbDraw();
    }
    if (drag.kind === "handle") {
      const o = hbFind(drag.k + ":" + drag.id);
      drag.moved = true;
      if (drag.k === "room") o.pts[+drag.i] = [sn(p[0]), sn(p[1])];
      if (drag.k === "wall") {
        let q = hbMagnet(p, o);
        const other = o[drag.i === "a" ? "b" : "a"], dx = q[0] - other[0], dy = q[1] - other[1];
        if (Math.abs(dx) < Math.abs(dy) * 0.18) q = [other[0], q[1]];
        else if (Math.abs(dy) < Math.abs(dx) * 0.18) q = [q[0], other[1]];
        o[drag.i] = q;
      }
      if (drag.k === "area" && o.pts) o.pts[+drag.i] = [sn(p[0]), sn(p[1])];
      return hbDraw();
    }
    if (drag.kind === "move") {
      const o = hbFind(drag.key), dx = p[0] - drag.start[0], dy = p[1] - drag.start[1];
      if ((Math.hypot(dx, dy) / (HZ.k || 1)) < 3 && !drag.moved) return;
      drag.moved = true;
      const k = drag.key.split(":")[0], O = drag.orig, sdx = sn(dx), sdy = sn(dy);
      if (k === "room") o.pts = O.pts.map((q) => [q[0] + sdx, q[1] + sdy]);
      else if (k === "wall") {
        o.a = [O.a[0] + sdx, O.a[1] + sdy];
        o.b = [O.b[0] + sdx, O.b[1] + sdy];
      } else if (k === "area") {
        if (O.pts) o.pts = O.pts.map((q) => [q[0] + sdx, q[1] + sdy]);
        else {
          o.x = O.x + sdx;
          o.y = O.y + sdy;
        }
      } else if (OPENING.has(o.type)) {
        const sp = hbWallSnap([O.x + dx, O.y + dy]);
        if (sp) {
          o.x = sp.p[0];
          o.y = sp.p[1];
          o.dir = sp.dir;
        } else {
          o.x = sn(O.x + dx);
          o.y = sn(O.y + dy);
        }
      } else {
        o.x = sn(O.x + dx);
        o.y = sn(O.y + dy);
      }
      return hbDraw();
    }
  });
  const up = (e) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!drag) return;
    const d = drag;
    drag = null;
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
        const r = { id: hbId("r"), name, light: "", area: "", rtype: "other", pts: [[x0 + 3, y0 + 3], [x1 - 3, y0 + 3], [x1 - 3, y1 - 3], [x0 + 3, y1 - 3]] };
        HZ.d.rooms.push(r);
        hbAddWall([x0, y0], [x1, y0]);
        hbAddWall([x1, y0], [x1, y1]);
        hbAddWall([x1, y1], [x0, y1]);
        hbAddWall([x0, y1], [x0, y0]);
        HZ.sel = "room:" + r.id;
      }
      HZ.tool = "vaelg";
      return hbRefresh();
    }
    if ((d.kind === "move" || d.kind === "handle") && d.moved) {
      HZ.hist.push(d.before);
      HZ.fut = [];
      HZ.dirty = true;
      hbRefresh();
    }
  };
  svgEl.addEventListener("pointerup", up);
  svgEl.addEventListener("pointercancel", up);
  svgEl.addEventListener("pointerleave", () => {
    if (isPlace(HZ.tool) || HZ.pend) {
      HZ.hover = null;
      hbDraw();
    }
  });
  svgEl.addEventListener("dblclick", () => {
    if (HZ.chain) {
      HZ.chain = null;
      HZ.hover = null;
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
    if (e.target.dataset?.hf === "ent") hzInput(e);
  });
}

function onKey(e) {
  if (!C || C.view !== "husbygger" || !HZ) return;
  const path = e.composedPath ? e.composedPath()[0] : e.target;
  if (path?.closest?.("input,textarea,select")) return;
  if (C.root.querySelector(".sheet-bg")) return;
  const click = (sel_) => C.root.querySelector(sel_)?.click();
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    return click(`.hz-acts [data-hz=${e.shiftKey ? "redo" : "undo"}]`);
  }
  if ((e.key === "Delete" || e.key === "Backspace") && HZ.sel) {
    e.preventDefault();
    return click("[data-hz=del]");
  }
  if (e.key === "Escape") {
    HZ.chain = null;
    HZ.hover = null;
    HZ.pend = null;
    HZ.prev = null;
    if (HZ.tool !== "vaelg") HZ.tool = "vaelg";
    else HZ.sel = null;
    return hbRefresh();
  }
  const x = { v: "vaelg", r: "rum", w: "vaeg", u: "ude:lawn", d: "door", f: "window", k: "camera" }[e.key.toLowerCase()];
  if (x && !e.metaKey && !e.ctrlKey && !e.altKey) {
    HZ.tool = x;
    HZ.pend = null;
    HZ.chain = null;
    hbRefresh();
  }
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
`;

const en = {
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
    ctx.root.addEventListener("keydown", onKey);
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
