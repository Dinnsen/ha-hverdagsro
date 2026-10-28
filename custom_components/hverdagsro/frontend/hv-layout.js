/* Hverdagsro – furnishing a room so it makes sense: a kitchen is a row of units with the fridge, the stove and the
   hood over it, and a dining table with chairs; a bedroom has the bed between two bedside tables; a living room has a
   sofa group with a rug and a coffee table, and the tv on a cabinet. A room is a row of such stations, each laid out
   by what the things in it are for, and then dressed: things on every top, things inside what opens, pictures over
   the furniture. Used for the places of the towns (hv-towns) and for the rooms of the house (hv-furnish).
   Our own design. A thing is [key, x, y] or [key, x, y, { in: n }] (inside the thing n entries back). */
import { insideOf } from "./hv-fixtures.js";
import { META4 } from "./hv-packs4.js";
import { PROTO } from "./hv-proto.js";

const BACK = 528, FRONT = 604, EDGE = 60, GAP = 22;
/* What a shape is for. */
const ROLE = {
  sofa: "seat", armchair: "seat", bench: "seat", pouf: "seat", lounger: "seat", hammock: "seat", chair: "chair", stool: "chair",
  coffeetable: "lowtable", roundtable: "table", table: "table", desk: "desk", counter: "counter", island: "counter",
  bookcase: "shelf", shelfunit: "shelf", cubes: "shelf", cabinet: "storage", dresser: "storage", chest: "storage", wardrobe: "wardrobe",
  rack: "rack", display: "display", shopshelf: "shopshelf", bed: "bed", bunk: "bed", crib: "bed",
  fridge: "fridge", oven: "oven", sink: "sink", washer: "washer", hood: "hood", bathtub: "bath", toilet: "toilet", shower: "shower",
  tv: "tv", screen: "tv", console: "tv", laptop: "laptop", radio: "radio", speaker: "radio", piano: "piano",
  floorlamp: "lamp", tablelamp: "smalllamp", lantern: "smalllamp", candle: "smalllamp", ceilinglamp: "ceiling", fairy: "smalllamp",
  plant: "plant", tree: "plant", cactus: "plant", smallplant: "smallplant", flowers: "smallplant", vase: "smallplant",
  rug: "rug", curtain: "curtain", fireplace: "fireplace", parasol: "outdoor", tent: "outdoor", bbq: "outdoor", fountain: "outdoor", fence: "outdoor",
  frame: "art", poster: "art", landscape: "art", clock: "art", sign: "art", neon: "art", banner: "art", garland: "art", card: "art", mirror: "mirror", mirrorcab: "mirror", wallshelf: "wallshelf", hooks: "hooks",
  trash: "extra", basket: "extra", box: "extra", crate: "extra", barrel: "extra", cart: "extra", mannequin: "extra", statue: "extra", pedestal: "extra", ladder: "extra", pool: "extra",
};
/* How high up the wall each kind hangs: the y of its bottom. */
const HANG = { curtain: 372, mirror: 300, frame: 262, poster: 262, landscape: 256, clock: 190, sign: 240, neon: 240, garland: 130, banner: 112, card: 262, hooks: 250, mirrorcab: 290, wallshelf: 300, hood: 330 };
/* What belongs on what: the little things by kind, and which kinds go with which furniture. */
const KITCH = new Set(["cup", "bowl", "plate", "pot", "bottle", "jar", "fruit", "cake", "drink", "tool"]);
const DECOR = new Set(["vase", "flowers", "smallplant", "candle", "books", "book", "statue", "trophy", "tablelamp", "lantern"]);
const TECH = new Set(["radio", "laptop", "phone", "camera", "speaker", "console", "tablelamp"]);
const TOYS = new Set(["toy", "doll", "ball", "blocks", "pet"]);
const GOES = {
  counter: [KITCH], sink: [KITCH], oven: [KITCH], fridge: [KITCH], washer: [KITCH], table: [KITCH, DECOR], lowtable: [DECOR, KITCH], desk: [TECH, DECOR],
  shelf: [DECOR, TOYS], storage: [DECOR, TECH], wardrobe: [DECOR], display: [DECOR, TOYS], shopshelf: [KITCH, DECOR], wallshelf: [DECOR], bed: [DECOR],
  seat: [DECOR], bath: [KITCH], rack: [DECOR],
};
const hash = (s) => [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
const rnd = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const surfOf = (k) => {
  const s = PROTO[META4[k]?.shape]?.[4];
  return Array.isArray(s) ? s : null;
};

/* Lay out a room: `keys` are what there is to use, `stations` what the room is (names below), `width` how wide it may be.
   Returns { decor, width }. */
export function arrange(keys, stations, seed, opts = {}) {
  const R = rnd(hash(seed)), used = new Set();
  const things = keys.filter((k) => META4[k]).map((k) => ({ k, ...META4[k], role: ROLE[META4[k].shape] || "extra" }));
  const by = {};
  for (const t of things) (by[t.role] ||= []).push(t);
  for (const list of Object.values(by)) list.sort((a, b) => b.w * b.h - a.w * a.h);
  const decor = [], placed = [], rows = { back: EDGE, front: EDGE + 40 };
  const put = (k, x, y, o) => decor.push(o ? [k, Math.round(x), Math.round(y), o] : [k, Math.round(x), Math.round(y)]);
  /* the next unused thing for a role (largest first), or one that may be used again */
  const take = (role, again = false) => {
    const free = (by[role] || []).find((t) => !used.has(t.k));
    if (free) {
      used.add(free.k);
      return free;
    }
    return again && by[role]?.length ? by[role][Math.floor(R() * by[role].length)] : null;
  };
  const station = { x0: EDGE, hosts: [] };
  /* in the back row: at the cursor; in the front row: at x, or at the cursor if that is taken */
  const back = (t, gap = GAP) => {
    const x = rows.back + t.w / 2;
    rows.back += t.w + gap;
    placed.push({ ...t, x, y: BACK, idx: decor.length });
    put(t.k, x, BACK);
    return x;
  };
  const front = (t, at) => {
    let x = at ?? rows.front + t.w / 2;
    if (x - t.w / 2 < rows.front - 4) x = rows.front + t.w / 2;
    rows.front = x + t.w / 2 + GAP;
    placed.push({ ...t, x, y: FRONT, idx: decor.length });
    put(t.k, x, FRONT);
    return x;
  };
  const floorRug = (x) => {
    const rug = take("rug");
    if (rug) put(rug.k, x, FRONT + 8);
  };
  const wall = (t, x, y) => t && put(t.k, x, y ?? HANG[t.shape] ?? 262);
  const art = (x) => wall(take("art", true), x);
  const lampAt = () => {
    const l = take("lamp");
    if (l) back(l, 6);
  };
  const plantAt = () => {
    const p = take("plant");
    if (p) back(p, 10);
  };
  /* Stations: each uses the back row from where it is, and the front row in front of what it put there. */
  const ST = {
    sofa() {
      const s = take("seat");
      if (!s) return;
      lampAt();
      const x = back(s);
      const t = take("lowtable");
      if (t) front(t, x);
      floorRug(x);
      art(x);
      const arm = take("seat");
      if (arm) back(arm, 6);
      plantAt();
    },
    tv() {
      const c = take("storage") || take("counter");
      const tv = take("tv");
      if (!c && !tv) return;
      let x = 0;
      if (c) x = back(c);
      if (tv) {
        // on the cabinet if there is one, else on the floor
        const sf = c && surfOf(c.k);
        const y = c ? BACK - c.h * (sf ? sf[sf.length - 1] : 0.95) : BACK;
        const tx = c ? x : back(tv);
        put(tv.k, tx, y);
        placed.push({ ...tv, x: tx, y, idx: decor.length - 1, noFill: true });
      }
      const r = take("radio");
      if (r && c) put(r.k, x + (c.w * 0.3 || 40), BACK - c.h * 0.95);
      plantAt();
    },
    dining() {
      const t = take("table");
      if (!t) return;
      const x = front(t);
      const c1 = take("chair", true), c2 = take("chair", true);
      if (c1) put(c1.k, x - t.w / 2 - c1.w * 0.4, FRONT - 6);
      if (c2) put(c2.k, x + t.w / 2 + c2.w * 0.4, FRONT - 6);
      rows.front = Math.max(rows.front, x + t.w / 2 + (c2?.w || 60) + 20);
      rows.back = Math.max(rows.back, x - t.w / 2);
      const ceil = take("ceiling");
      if (ceil) put(ceil.k, x, 150);
    },
    kitchen() {
      const f = take("fridge");
      if (f) back(f, 8);
      const c1 = take("counter");
      if (c1) back(c1, 4);
      const sink = take("sink");
      if (sink) back(sink, 4);
      const ov = take("oven");
      let ox = 0;
      if (ov) ox = back(ov, 4);
      const hood = take("hood");
      if (hood && ov) put(hood.k, ox, HANG.hood);
      const c2 = take("counter", false);
      if (c2) back(c2, 4);
      const w = take("washer");
      if (w) back(w, 8);
      const sh = take("wallshelf");
      if (sh) {
        wall(sh, rows.back - 120, HANG.wallshelf);
        placed.push({ ...sh, x: rows.back - 120, y: HANG.wallshelf, idx: decor.length - 1 });
      }
      const s = take("storage");
      if (s) back(s, 8);
    },
    bed() {
      const n1 = take("storage");
      const b = take("bed");
      if (!b) return;
      if (n1 && n1.w < 160 && n1.h < 190) back(n1, 4);
      const x = back(b, 4);
      const n2 = take("storage");
      if (n2 && n2.w < 160 && n2.h < 190) back(n2, GAP);
      wall(take("art", true), x, 250);
      floorRug(x);
    },
    wardrobe() {
      const w = take("wardrobe") || take("storage");
      if (w) back(w);
      const d = take("storage");
      if (d) back(d);
      wall(take("art", true), rows.back - 120);
      const mir = take("mirror");
      if (mir) wall(mir, rows.back - 60);
    },
    desk() {
      const d = take("desk");
      if (!d) return;
      const x = back(d);
      const c = take("chair", true);
      if (c) front(c, x);
      const l = take("laptop");
      if (l) put(l.k, x - d.w * 0.15, BACK - d.h * 0.88);
      const sl = take("smalllamp");
      if (sl) put(sl.k, x + d.w * 0.3, BACK - d.h * 0.88);
      const sh = take("shelf");
      if (sh) back(sh, 10);
      wall(take("art", true), x);
    },
    shelf() {
      const s1 = take("shelf"), s2 = take("shelf");
      if (s1) back(s1, 8);
      if (s2) back(s2, 8);
      plantAt();
    },
    bath() {
      const t = take("bath");
      if (t) back(t, 14);
      const to = take("toilet");
      if (to) back(to, 14);
      const si = take("sink") || take("counter");
      let x = 0;
      if (si) x = back(si, 14);
      const m = take("mirror");
      if (m && si) wall(m, x);
      const sh = take("shower");
      if (sh) back(sh, 14);
      const k = take("extra");
      if (k) front(k);
      floorRug(rows.back - 160);
    },
    shop() {
      for (let i = 0; i < 4; i++) {
        const s = take("shopshelf") || take("shelf") || take("display");
        if (s) back(s, 14);
      }
      const c = take("counter");
      if (c) front(c);
      const d = take("display");
      if (d) front(d);
      const cart = take("extra");
      if (cart) front(cart);
      wall(take("art", true), rows.back - 300);
      wall(take("art", true), rows.back - 100);
    },
    bar() {
      const c = take("counter");
      if (!c) return;
      const x = back(c);
      for (let i = 0; i < 3; i++) {
        const st = take("chair", true);
        if (st) front(st, x - c.w * 0.3 + i * c.w * 0.3);
      }
      const ceil = take("ceiling");
      if (ceil) put(ceil.k, x, 150);
    },
    corner() {
      plantAt();
      const sp = take("smallplant");
      if (sp) front(sp);
    },
    outdoor() {
      for (const t of (by.outdoor || []).slice(0, 3)) back(t, 40);
      const b = take("seat");
      if (b) front(b);
    },
    fireplace() {
      const f = take("fireplace");
      if (f) {
        const x = back(f);
        wall(take("art", true), x, 240);
        const ar = take("seat");
        if (ar) front(ar, x);
      }
    },
    art() {
      for (let i = 0; i < 3; i++) art(rows.back - 80 - i * 200);
    },
  };
  for (const name of stations) ST[name]?.();
  // what is left over: other furniture along the back, until the room is as wide as it can be
  const wmax = opts.max || 2200;
  for (const t of things) {
    if (used.has(t.k) || t.role === "art" || t.role === "curtain" || t.role === "rug" || t.role === "ceiling" || t.w > 280) continue;
    if (t.role === "smalllamp" || t.role === "smallplant" || t.role === "extra") continue;
    if (rows.back + t.w > wmax - EDGE) break;
    used.add(t.k);
    back(t);
  }
  const width = Math.max(opts.min || 1000, Math.min(wmax, Math.round((Math.max(rows.back, rows.front) + EDGE) / 100) * 100));
  // curtains at the windows, a lamp from the ceiling, pictures on bare wall
  const cur = take("curtain");
  if (cur) put(cur.k, Math.min(width - 260, 600), HANG.curtain);
  const ceil = take("ceiling");
  if (ceil && !decor.some(([k]) => META4[k]?.shape === "ceilinglamp")) for (let x = 500; x < width; x += 700) put(ceil.k, x, 150);
  // dress the room: things on every top, things inside what opens
  const small = things.filter((t) => t.w <= 120 && t.h <= 130 && t.cat !== "mob" && t.cat !== "væg" && t.role !== "rug" && t.role !== "ceiling" && t.shape !== "decal");
  const pool = small.length ? small : things.filter((t) => t.w <= 90 && t.h <= 100);
  let n = 0;
  const pick = (role) => {
    const kinds = GOES[role];
    if (kinds) for (const set of kinds) {
      const some = pool.filter((t) => set.has(t.shape));
      if (some.length && R() < 0.8) return some[Math.floor(R() * some.length)];
    }
    return pool[Math.floor(R() * pool.length)];
  };
  for (const host of placed) {
    if (!pool.length || host.noFill) continue;
    const S = surfOf(host.k);
    if (S) {
      const lv = S.slice(1).filter((f) => f > 0.1 || S.length === 2);
      const levels = lv.length > 2 ? [lv[lv.length - 1], lv[Math.floor((lv.length - 1) / 2)]] : lv;
      for (const f of levels) {
        const count = Math.max(1, Math.min(3, Math.floor((host.w * S[0]) / 90)));
        const left = host.x - (host.w * S[0]) / 2 + 26, step = count > 1 ? (host.w * S[0] - 52) / (count - 1) : 0;
        for (let i = 0; i < count && n < 46; i++, n++) put(pick(host.role).k, count > 1 ? left + i * step : host.x, host.y - host.h * f);
      }
    }
    const I = insideOf(host.k);
    if (I) {
      for (const f of I.levels.slice(0, 3)) {
        const count = Math.max(1, Math.min(2, Math.floor((host.w * I.w) / 90)));
        const left = host.x - (host.w * I.w) / 2 + 26, step = count > 1 ? (host.w * I.w - 52) / (count - 1) : 0;
        for (let i = 0; i < count; i++) put(pick(host.role).k, count > 1 ? left + i * step : host.x, host.y - host.h * f, { in: decor.length - host.idx });
      }
    }
  }
  return { decor, width };
}
