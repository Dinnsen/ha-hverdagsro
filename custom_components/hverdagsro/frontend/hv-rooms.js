/* Hverdagsro – the rooms: a living picture of every room in the house, with its lights and what else is in it.
   Rooms come from the house (Husbyggeren). A room without its own photo is drawn from its type; children's rooms
   also by age and style. Lamps in the picture follow the real lights; the window follows the sun and the weather. */
import * as House from "./hv-house.js";
import { WX, weatherKind } from "./hv-sky.js";
import { hashStr, mixHex, prng, hexRgb, slug } from "./hv-core.js";
import { ART, ART_IDS, drawArt } from "./hv-roomart.js";

/* ------------------------------------------------------------------ room types (fallback if hv-house.js lacks them) */
import { roomTiles } from "./hv-appliances.js";
const RTYPES_L = [["kid", "Børneværelse"], ["bed", "Soveværelse"], ["guest", "Gæsteværelse"], ["office", "Kontor"], ["living", "Stue"], ["kitchen", "Køkken"], ["bath", "Badeværelse"], ["smallbath", "Lille bad"], ["toilet", "Toilet"], ["utility", "Bryggers"], ["hall", "Entré og gang"], ["walkin", "Walk-in"], ["garage", "Garage"], ["other", "Andet rum"]];
const AGES_L = [["baby", "Baby", "0–1 år"], ["toddler", "Tumling", "1–3 år"], ["child", "Barn", "4–7 år"], ["bigchild", "Stort barn", "8–10 år"], ["preteen", "Preteen", "11–12 år"], ["teen", "Teenager", "13–16 år"], ["young", "Ung", "17+ år"]];
const GSTYLES_L = [["neutral", "Neutral"], ["pige", "Pige"], ["dreng", "Dreng"]];
function guessTypeL(name) {
  const n = String(name || "").toLowerCase();
  return /køkken|kokken|alrum|kitchen/.test(n) ? "kitchen" : /stue|opholds|living/.test(n) ? "living" : /sove|bedroom/.test(n) ? "bed" : /gæstebad|gaestebad|lille bad/.test(n) ? "smallbath" : /bad|bath/.test(n) ? "bath" : /toilet|wc/.test(n) ? "toilet" : /gæste|gaeste|guest/.test(n) ? "guest" : /kontor|office/.test(n) ? "office"
    : /bryggers|vask|værksted|teknik|viktualie|utility/.test(n) ? "utility" : /entr|gang|hall/.test(n) ? "hall" : /walk/.test(n) ? "walkin" : /garage|carport/.test(n) ? "garage" : /værelse|vaerelse|børn|born|kid/.test(n) ? "kid" : "other";
}
const RTYPES = () => (Array.isArray(House.RTYPES) ? House.RTYPES : RTYPES_L);
const AGES = () => (Array.isArray(House.AGES) ? House.AGES : AGES_L);
const GSTYLES = () => (Array.isArray(House.GSTYLES) ? House.GSTYLES : GSTYLES_L);
const guessType = (n) => (typeof House.guessType === "function" ? House.guessType(n) : guessTypeL(n));
const houseOf = (ctx) => {
  let h = null;
  try {
    h = typeof House.houseModel === "function" ? House.houseModel(ctx) : null;
  } catch (e) {
    h = null;
  }
  return h || ctx.data?.house || { rooms: [], items: [] };
};
const ageFromBirthday = (iso) => {
  if (!iso) return null;
  const y = (Date.now() - new Date(iso + "T12:00:00")) / 3.15576e10;
  return y < 1 ? "baby" : y < 4 ? "toddler" : y < 8 ? "child" : y < 11 ? "bigchild" : y < 13 ? "preteen" : y < 17 ? "teen" : "young";
};
/* The room with its defaults filled in (without changing what is stored). */
/* Like the prototype's roomMeta: a room without an area gets the area with the same name, and a room named after a
   child is that child's room. */
const slugDa = (v) => String(v || "").toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a").normalize("NFKD").replace(/[^a-z0-9]/g, "");
function areaByName(ctx, name) {
  const n = slugDa(name);
  if (!n) return "";
  const A = (ctx.areas ? ctx.areas() : []) || [];
  const f = A.find((a) => slugDa(a.name) === n) || A.find((a) => {
    const id = String(a.area_id || "").replace(/_/g, "");
    return id && (id.startsWith(n) || n.startsWith(id));
  });
  return f ? f.area_id : "";
}
const kidByName = (ctx, name) => (ctx.children ? ctx.children() : []).find((c) => c.name && new RegExp(`(^|[^a-zæøå])${c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(name || ""));
function meta(ctx, r) {
  const m = { ...r };
  if (m.kid == null) {
    const k = kidByName(ctx, m.name);
    m.kid = k ? k.id : "";
    if (k && !m.rtype) m.rtype = "kid";
  }
  if (m.area == null) m.area = areaByName(ctx, m.name);
  if (!m.rtype) m.rtype = guessType(m.name);
  if (m.rtype === "kid") {
    const kid = m.kid && ctx.member(m.kid);
    if (!m.age) m.age = ageFromBirthday(kid?.birthday) || "child";
    if (!m.style) m.style = "neutral";
  }
  return m;
}

/* ------------------------------------------------------------------ colours */
const WARM = "#FFC27A", SOFT = "#FFD9A8", NEUTRAL = "#FFEBCF", COOL = "#E4EEFF";
const SW_COLOR = [WARM, SOFT, NEUTRAL, COOL, "#FF6FAE", "#9B7BFF", "#4FB3FF", "#5BE3A0", "#FFB648"], SW_CT = [WARM, SOFT, NEUTRAL, COOL];
const CT_K = { [WARM]: 2700, [SOFT]: 3000, [NEUTRAL]: 4000, [COOL]: 6000 };
const GPAL = {
  neutral: { wall: "#EDE6DC", acc: "#C2703D", acc2: "#7FA36A", bed: "#E8DCC8", rug: "#DCCFBB", side: "#E4DCCF" },
  pige: { wall: "#F4E1E6", acc: "#E4568C", acc2: "#B98BE0", bed: "#F7C6D6", rug: "#F2CFDC", side: "#ECD3DB" },
  dreng: { wall: "#DCE7F2", acc: "#2F6FED", acc2: "#22A06B", bed: "#A9C8EC", rug: "#C3D8EE", side: "#CFDCEA" },
};
const rgbHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const grey = (c) => {
  const m = (c[0] + c[1] + c[2]) / 3;
  return [m, m, m + 6];
};
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/* ------------------------------------------------------------------ 3D: the room is a box seen from the door.
   u: left (0) → right (1) wall, t: front (0) → back wall (1), v: floor (0) → ceiling (1). */
const P3 = (u, t, v) => [120 * t + u * (480 - 240 * t), 270 - 80 * t - v * (270 - 138 * t)];
const sc3 = (t) => (480 - 240 * t) / 480;
const pt3 = (a) => a[0].toFixed(1) + "," + a[1].toFixed(1);
const poly3 = (pts, fill, extra = "") => `<polygon points="${pts.map(pt3).join(" ")}" fill="${fill}" ${extra}/>`;
const ln3 = (a, b, col, w = 1, extra = "") => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const qBack = (u0, u1, v0, v1) => [P3(u0, 1, v0), P3(u1, 1, v0), P3(u1, 1, v1), P3(u0, 1, v1)];
const qLeft = (t0, t1, v0, v1) => [P3(0, t0, v0), P3(0, t1, v0), P3(0, t1, v1), P3(0, t0, v1)];
const qRight = (t0, t1, v0, v1) => [P3(1, t0, v0), P3(1, t1, v0), P3(1, t1, v1), P3(1, t0, v1)];
function box3(u0, u1, t0, t1, v0, v1, front, top, side, extra = "") {
  const f = [P3(u0, t0, v0), P3(u1, t0, v0), P3(u1, t0, v1), P3(u0, t0, v1)], tp = [P3(u0, t0, v1), P3(u1, t0, v1), P3(u1, t1, v1), P3(u0, t1, v1)];
  const sd = (u0 + u1) / 2 < 0.5 ? [P3(u1, t0, v0), P3(u1, t1, v0), P3(u1, t1, v1), P3(u1, t0, v1)] : [P3(u0, t0, v0), P3(u0, t1, v0), P3(u0, t1, v1), P3(u0, t0, v1)];
  return `<g ${extra}>${poly3(sd, side)}${top ? poly3(tp, top) : ""}${poly3(f, front)}</g>`;
}
function shell3(c) {
  let s = `<defs><linearGradient id="${c.k}-cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.ceil}"/><stop offset="1" stop-color="${c.ceil2}"/></linearGradient>
    <linearGradient id="${c.k}-fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c.floor}"/><stop offset="1" stop-color="${c.floor2}"/></linearGradient></defs>`;
  s += poly3([P3(0, 0, 1), P3(1, 0, 1), P3(1, 1, 1), P3(0, 1, 1)], `url(#${c.k}-cg)`);
  s += poly3([P3(0, 0, 0), P3(1, 0, 0), P3(1, 1, 0), P3(0, 1, 0)], `url(#${c.k}-fg)`);
  s += poly3(qLeft(0, 1, 0, 1), c.left) + poly3(qRight(0, 1, 0, 1), c.right) + poly3(qBack(0, 1, 0, 1), c.back);
  for (let u = 0.06; u < 1; u += 0.075) s += ln3(P3(u, 0, 0), P3(u, 1, 0), c.plank, 0.7);
  const r = prng(c.seed || 3);
  for (let i = 0; i < 26; i++) {
    const u = r(), t = r();
    s += ln3(P3(u, t, 0), P3(Math.min(1, u + 0.03), t, 0), c.plank, 0.5);
  }
  [0.3, 0.66].forEach((u) => (s += ln3(P3(u, 0, 1), P3(u, 1, 1), c.seam, 0.8)));
  [0.35, 0.72].forEach((t) => (s += ln3(P3(0, t, 1), P3(1, t, 1), c.seam, 0.8)));
  s += poly3([P3(0, 1, 0), P3(1, 1, 0), P3(1, 1, 0.025), P3(0, 1, 0.025)], "rgba(255,255,255,.6)");
  return s;
}
const lampAttrs = (k, id, cls = "") => `class="rm-lamp ${cls}" data-act="room-lamp" data-k="${k}" data-id="${id}" role="button" tabindex="0"`;
function panthella3(u, t, v, id, k, big = 1) {
  const [x, y] = P3(u, t, v), s = sc3(t) * big, r = 10 * s;
  return `<g ${lampAttrs(k, id)}><circle cx="${x}" cy="${y - 12 * s}" r="${24 * s}" fill="transparent"/>
    <ellipse cx="${x}" cy="${y}" rx="${4.5 * s}" ry="${1.4 * s}" fill="#E9E5E0"/><path d="M${x - 1 * s},${y} L${x - 0.6 * s},${y - 10 * s} L${x + 0.6 * s},${y - 10 * s} L${x + 1 * s},${y}Z" fill="#EDE9E4"/>
    <path class="rm-shade" d="M${x - r},${y - 10 * s} A${r},${r * 0.95} 0 0 1 ${x + r},${y - 10 * s} Z"/>
    <ellipse class="rm-bulb" cx="${x}" cy="${y - 10 * s}" rx="${r * 0.8}" ry="${1.6 * s}" fill="#CFC8C0"/></g>`;
}
function ceilingDisc3(u, t, id, k) {
  const [x, y] = P3(u, t, 1), s = sc3(t);
  return `<g ${lampAttrs(k, id)}><circle cx="${x}" cy="${y + 8}" r="${28 * s}" fill="transparent"/>
    <ellipse cx="${x}" cy="${y + 2 * s}" rx="${24 * s}" ry="${6.5 * s}" fill="#D9D4CD"/><ellipse class="rm-shade" cx="${x}" cy="${y + 4 * s}" rx="${19 * s}" ry="${5 * s}"/><ellipse cx="${x}" cy="${y + 3 * s}" rx="${9 * s}" ry="${2 * s}" fill="rgba(255,255,255,.5)"/></g>`;
}
const halo3 = (k, i, x, y, r, pool) =>
  `<circle id="${k}-l${i}-halo" class="rm-glow" cx="${x}" cy="${y}" r="${r}" filter="url(#${k}-blur)"/>` +
  (pool ? `<ellipse id="${k}-l${i}-pool" class="rm-glow" cx="${pool[0]}" cy="${pool[1]}" rx="${pool[2]}" ry="${pool[3]}" filter="url(#${k}-blur)"/>` : "");
function dust3(k) {
  const r = prng(hashStr(k) % 9999 + 7);
  let s = `<g class="rm-dust" id="${k}-dust">`;
  for (let i = 0; i < 14; i++) s += `<circle cx="${(130 + r() * 230).toFixed(1)}" cy="${(60 + r() * 140).toFixed(1)}" r="${(0.7 + r() * 1.2).toFixed(2)}" fill="#fff" style="animation-delay:-${(r() * 9).toFixed(1)}s;animation-duration:${(7 + r() * 6).toFixed(1)}s"/>`;
  return s + "</g>";
}
function stars3(k) {
  const r = prng(hashStr(k) % 9999 + 13);
  let s = `<g class="rm-stars" id="${k}-stars">`;
  for (let i = 0; i < 30; i++) {
    const [x, y] = P3(0.05 + r() * 0.9, 0.05 + r() * 0.9, 1);
    s += `<circle cx="${x.toFixed(1)}" cy="${(y + 2).toFixed(1)}" r="${(0.8 + r() * 1.3).toFixed(2)}" fill="#FFF4C7" style="animation-delay:-${(r() * 4).toFixed(1)}s"/>`;
  }
  return s + "</g>";
}

/* The window in the back wall, with the blind almost up: the view shows the time of day, the weather and the season. */
const seasonNow = () => {
  const m = new Date().getMonth() + 1;
  return m === 12 || m <= 2 ? "vinter" : m <= 5 ? "forar" : m <= 8 ? "sommer" : "efterar";
};
function window3(u0, u1, v0, v1, k, W) {
  const x0 = 120 + 240 * u0, x1 = 120 + 240 * u1, yt = 190 - 132 * v1, yb = 190 - 132 * v0, w = x1 - x0, h = yb - yt;
  W.win = { x0, yt, w, h, u0, u1 };
  const sea = seasonNow(), r = prng(hashStr(k) % 9999 + 31);
  const leaf = { vinter: ["#8A7A6A", "#9C8C7C", "#7D6E60"], forar: ["#9BD770", "#F4B8CF", "#B8E08A"], sommer: ["#3E8E41", "#5DAA4F", "#4C9A45"], efterar: ["#D9822B", "#C0392B", "#E8B04A"] }[sea];
  const hedge = { vinter: "#7B6A52", forar: "#7DBA55", sommer: "#3F7F3A", efterar: "#A0622D" }[sea];
  let o = `<defs><clipPath id="${k}-wc"><rect x="${x0}" y="${yt}" width="${w}" height="${h}"/></clipPath><linearGradient id="${k}-wsky" x1="0" y1="0" x2="0" y2="1"><stop id="${k}-ws0" offset="0"/><stop id="${k}-ws1" offset="1"/></linearGradient></defs>`;
  o += poly3(qBack(u0 - 0.022, u1 + 0.022, v0 - 0.03, v1 + 0.025), "#FBF8F4");
  o += `<g clip-path="url(#${k}-wc)"><rect x="${x0}" y="${yt}" width="${w}" height="${h}" fill="url(#${k}-wsky)"/>`;
  o += `<g id="${k}-wstars" class="rm-glow">${Array.from({ length: 12 }, () => `<circle cx="${(x0 + r() * w).toFixed(1)}" cy="${(yt + h * 0.14 + r() * h * 0.4).toFixed(1)}" r="${(0.35 + r() * 0.55).toFixed(2)}" fill="#fff"/>`).join("")}</g>`;
  o += `<circle id="${k}-wsun" class="rm-glow" cx="0" cy="0" r="${(h * 0.11).toFixed(1)}" fill="#FFE9A8"/>`;
  o += `<g id="${k}-wmoon" class="rm-glow"><circle cx="0" cy="0" r="${(h * 0.085).toFixed(1)}" fill="#EEF0FF"/><circle id="${k}-wmoonc" cx="${(h * 0.045).toFixed(1)}" cy="${(-h * 0.03).toFixed(1)}" r="${(h * 0.075).toFixed(1)}"/></g>`;
  o += `<g id="${k}-wcl" class="rm-clouds">${[[0.2, 0.3, 1], [0.62, 0.22, 0.8], [0.9, 0.38, 0.9]].map(([a, b, s]) => `<g transform="translate(${(x0 + a * w).toFixed(1)} ${(yt + b * h).toFixed(1)}) scale(${s})"><ellipse cx="0" cy="0" rx="12" ry="4.5" fill="#fff"/><ellipse cx="-5" cy="-3" rx="6" ry="4.5" fill="#fff"/><ellipse cx="4" cy="-4" rx="7" ry="5" fill="#fff"/></g>`).join("")}</g>`;
  const gy = yb - h * 0.2;
  o += `<g><path d="M${x0 + w * 0.52},${gy} v${-h * 0.22} l${w * 0.13},${-h * 0.16} l${w * 0.13},${h * 0.16} v${h * 0.22}z" fill="#C9B8A6"/><path d="M${x0 + w * 0.5},${gy - h * 0.22} l${w * 0.15},${-h * 0.18} l${w * 0.15},${h * 0.18}z" fill="#5C4B44"/><rect id="${k}-wnwin" class="rm-glow" x="${x0 + w * 0.6}" y="${gy - h * 0.16}" width="${w * 0.05}" height="${h * 0.07}" fill="#F7E3A6"/>`;
  [[0.12, 0.55, 0.16], [0.3, 0.5, 0.2], [0.86, 0.52, 0.17], [0.97, 0.6, 0.12]].forEach(([a, b, s], i) => {
    const tx = x0 + a * w, ty = yt + b * h, rr = s * h;
    o += `<rect x="${tx - 1.2}" y="${ty}" width="2.4" height="${gy - ty}" fill="#5B4632"/>`;
    if (sea === "vinter") o += `<path d="M${tx},${ty + rr * 0.2} l${-rr * 0.6},${-rr * 0.7} M${tx},${ty + rr * 0.1} l${rr * 0.55},${-rr * 0.8} M${tx},${ty - rr * 0.2} v${-rr * 0.7}" stroke="#5B4632" stroke-width="1.1" fill="none"/>`;
    else o += [0, 1, 2].map((j) => `<circle cx="${(tx + (j - 1) * rr * 0.45).toFixed(1)}" cy="${(ty - rr * 0.25 - (j === 1 ? rr * 0.35 : 0)).toFixed(1)}" r="${(rr * 0.55).toFixed(1)}" fill="${leaf[(i + j) % 3]}"/>`).join("");
  });
  o += `<rect x="${x0}" y="${gy}" width="${w}" height="${yb - gy}" fill="${sea === "vinter" ? "#E8EDF2" : "#6E9A55"}"/><rect x="${x0}" y="${gy - h * 0.07}" width="${w}" height="${h * 0.09}" rx="3" fill="${hedge}"/></g>`;
  o += `<rect id="${k}-wdim" class="rm-glow" x="${x0}" y="${yt}" width="${w}" height="${h}" fill="#0B1030"/>`;
  o += `<g id="${k}-wrain" class="rm-rain">${Array.from({ length: 16 }, () => {
    const x = x0 + r() * w, y = yt + r() * h;
    return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 1.5).toFixed(1)}" y2="${(y + 5).toFixed(1)}" stroke="#DCE8FF" stroke-width=".7" style="animation-delay:-${(r() * 0.8).toFixed(2)}s"/>`;
  }).join("")}</g>`;
  o += `<g id="${k}-wsnow" class="rm-snow">${Array.from({ length: 16 }, () => `<circle cx="${(x0 + r() * w).toFixed(1)}" cy="${(yt + r() * h).toFixed(1)}" r="${(0.6 + r() * 0.7).toFixed(2)}" fill="#fff" style="animation-delay:-${(r() * 4).toFixed(2)}s"/>`).join("")}</g>`;
  if (sea === "efterar") o += `<g class="rm-leaves">${Array.from({ length: 5 }, (_, i) => `<ellipse cx="${(x0 + r() * w).toFixed(1)}" cy="${yt + 2}" rx="1.4" ry=".8" fill="${leaf[i % 3]}" style="animation-delay:-${(r() * 7).toFixed(2)}s"/>`).join("")}</g>`;
  o += `<path d="M${x0 + w * 0.05},${yb} L${x0 + w * 0.3},${yt} L${x0 + w * 0.38},${yt} L${x0 + w * 0.13},${yb}z" fill="rgba(255,255,255,.07)"/>`;
  const bh = h * 0.1;
  o += `<rect x="${x0}" y="${yt}" width="${w}" height="${bh}" fill="#5F5A5D"/>`;
  for (let y = yt + 1.6; y < yt + bh; y += 1.6) o += ln3([x0, y], [x1, y], "rgba(255,255,255,.12)", 0.5);
  o += `<rect x="${x0}" y="${yt + bh - 1}" width="${w}" height="2" fill="#4A4648"/></g>`;
  o += `<rect x="${(x0 + x1) / 2 - 1.5}" y="${yt}" width="3" height="${h}" fill="#FBF8F4"/>`;
  o += poly3([P3(u0 - 0.035, 1, v0 - 0.025), P3(u1 + 0.035, 1, v0 - 0.025), P3(u1 + 0.035, 0.962, v0 - 0.025), P3(u0 - 0.035, 0.962, v0 - 0.025)], "#FFFFFF");
  return o;
}
const beam3 = (k, u0, u1, v0) => `<polygon id="${k}-beam" class="rm-glow" points="${[P3(u0, 1, v0), P3(u1, 1, v0), P3(u1 - 0.02, 0.5, 0), P3(u0 - 0.12, 0.5, 0)].map(pt3).join(" ")}" fill="#FFF1D2" filter="url(#${k}-blur)"/>`;

/* ------------------------------------------------------------------ the generic room, drawn from its type */
function genDraw(k, r, W) {
  if (r.img) return `<image href="${String(r.img).replace(/"/g, "&quot;")}" x="0" y="0" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>`;
  const t = r.rtype, pal = GPAL[r.style || "neutral"] || GPAL.neutral, age = r.age || "child", wood = "#C9A27A", white = "#F7F5F2";
  const wet = t === "bath" || t === "smallbath" || t === "toilet";
  const wallCol = t === "kid" ? pal.wall : wet ? "#E9EEF0" : t === "kitchen" ? "#F1EEE9" : t === "office" ? "#E6E8E3" : t === "garage" || t === "utility" ? "#E3E1DC" : "#EEE9E2";
  const floor = wet || t === "utility" ? ["#B9B7B2", "#CFCDC8"] : t === "garage" ? ["#9E9C98", "#B2B0AB"] : ["#B07E4F", "#C99A68"];
  let s = shell3({ k, ceil: "#E7E1D8", ceil2: "#D7CFC3", floor: floor[0], floor2: floor[1], left: mixHex(wallCol, "#000000", 0.05), right: t === "kid" ? pal.side : mixHex(wallCol, "#000000", 0.1), back: wallCol, plank: floor[0] === "#B07E4F" ? "rgba(90,55,25,.26)" : "rgba(0,0,0,.08)", seam: "rgba(120,110,95,.35)", seed: (hashStr(k) % 9) + 1 });
  // Each room type has its own window, placed so nothing stands in front of it.
  const WIN = { kid: [0.3, 0.7, 0.38, 0.82], living: [0.48, 0.92, 0.3, 0.86], kitchen: [0.06, 0.4, 0.47, 0.84], bed: [0.64, 0.92, 0.36, 0.84], guest: [0.64, 0.9, 0.38, 0.82], office: [0.55, 0.9, 0.4, 0.84], bath: [0.64, 0.9, 0.6, 0.86], smallbath: [0.58, 0.8, 0.62, 0.86], toilet: [0.58, 0.8, 0.62, 0.86], utility: [0.58, 0.86, 0.45, 0.84], hall: [0.68, 0.88, 0.45, 0.82], walkin: null, garage: null, other: [0.3, 0.7, 0.38, 0.82] };
  const win = t in WIN ? WIN[t] : WIN.other;
  if (win) s += window3(win[0], win[1], win[2], win[3], k, W);
  const rug = (u0, u1, t0, t1, c) => poly3([P3(u0, t0, 0.002), P3(u1, t0, 0.002), P3(u1, t1, 0.002), P3(u0, t1, 0.002)], c) + poly3([P3(u0 + 0.02, t0 + 0.03, 0.003), P3(u1 - 0.02, t0 + 0.03, 0.003), P3(u1 - 0.02, t1 - 0.03, 0.003), P3(u0 + 0.02, t1 - 0.03, 0.003)], "none", `stroke="rgba(255,255,255,.5)" stroke-width="1.2" stroke-dasharray="4 3"`);
  const frame = (u0, u1, v0, v1, f) => poly3(qBack(u0, u1, v0, v1), "#2B2F38") + poly3(qBack(u0 + 0.006, u1 - 0.006, v0 + 0.012, v1 - 0.012), f);
  const plant = (u, tt, v = 0) => {
    const [x, y] = P3(u, tt, v), q = sc3(tt);
    return `<g class="rm-sway slow" style="transform-origin:${x}px ${y}px"><rect x="${x - 6 * q}" y="${y - 12 * q}" width="${12 * q}" height="${12 * q}" rx="${2 * q}" fill="#B9774A"/><path d="M${x},${y - 12 * q} c-4,-14 -12,-20 -16,-18 M${x},${y - 12 * q} c3,-16 10,-22 16,-20 M${x},${y - 12 * q} c0,-14 -2,-22 0,-28" stroke="#4E8F3F" stroke-width="${3.4 * q}" fill="none" stroke-linecap="round"/></g>`;
  };
  const bed = (u0, u1, t0, t1, duvet, kidsize) =>
    box3(u0, u1, t0, t1, 0, 0.1, wood, mixHex(wood, "#FFFFFF", 0.2), mixHex(wood, "#000000", 0.15)) +
    box3(u0, u1, t1 - 0.03, t1, 0, kidsize ? 0.3 : 0.38, mixHex(wood, "#000000", 0.08), mixHex(wood, "#FFFFFF", 0.25), mixHex(wood, "#000000", 0.2)) +
    poly3([P3(u0 + 0.01, t0, 0.12), P3(u1 - 0.01, t0, 0.12), P3(u1 - 0.01, t1 - 0.04, 0.12), P3(u0 + 0.01, t1 - 0.04, 0.12)], "#FBFAF7") +
    poly3([P3(u0 + 0.01, t0, 0.13), P3(u1 - 0.01, t0, 0.13), P3(u1 - 0.01, t0 + (t1 - t0) * 0.62, 0.13), P3(u0 + 0.01, t0 + (t1 - t0) * 0.62, 0.13)], duvet) +
    poly3([P3(u0 + 0.02, t1 - 0.1, 0.14), P3(u1 - 0.02, t1 - 0.1, 0.14), P3(u1 - 0.02, t1 - 0.05, 0.16), P3(u0 + 0.02, t1 - 0.05, 0.16)], "#FFFFFF");
  const desk = (u0, u1, t0, t1, mon) =>
    box3(u0, u1, t0, t1, 0.3, 0.33, white, "#FFFFFF", "#E2DED8") + box3(u0 + 0.01, u0 + 0.03, t0, t0 + 0.02, 0, 0.3, "#D8D4CE", null, "#CFCAC3") + box3(u1 - 0.03, u1 - 0.01, t0, t0 + 0.02, 0, 0.3, "#D8D4CE", null, "#CFCAC3") +
    (mon ? box3((u0 + u1) / 2 - 0.08, (u0 + u1) / 2 + 0.08, t1 - 0.02, t1 - 0.01, 0.34, 0.5, "#1E1F24", null, "#2B2C31") + (mon > 1 ? box3((u0 + u1) / 2 + 0.09, (u0 + u1) / 2 + 0.2, t1 - 0.02, t1 - 0.01, 0.34, 0.48, "#1E1F24", null, "#2B2C31") : "") : "");
  const shelf = (u0, u1, t0, t1, h, toys) => {
    let o = box3(u0, u1, t0, t1, 0, h, white, "#FFFFFF", "#E4E0DA");
    const n = Math.max(2, Math.round(h / 0.16));
    for (let i = 1; i < n; i++) o += ln3(P3(u0, t0, (h * i) / n), P3(u1, t0, (h * i) / n), "#D6D1CA", 1);
    const rr = prng((hashStr(k) % 9999) + 3);
    for (let i = 0; i < 8; i++) {
      const v = (h * (Math.floor(rr() * (n - 1)) + 1)) / n, [x, y] = P3(u0 + rr() * (u1 - u0), t0, v);
      o += `<rect x="${(x - 3).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="${(3 + rr() * 4).toFixed(1)}" height="8" rx="1" fill="${toys ? [pal.acc, pal.acc2, "#F2B01E", "#3B82F6"][i % 4] : ["#8E7F70", "#C9B8A6", "#5E6A75", "#D9CBB8"][i % 4]}"/>`;
    }
    return o;
  };
  const sofa = (u0, u1, t0, t1, c) =>
    box3(u0, u1, t0, t1, 0, 0.15, c, mixHex(c, "#FFFFFF", 0.15), mixHex(c, "#000000", 0.12)) + box3(u0, u1, t1 - 0.06, t1, 0, 0.32, mixHex(c, "#000000", 0.05), mixHex(c, "#FFFFFF", 0.1), mixHex(c, "#000000", 0.15)) +
    box3(u0, u0 + 0.04, t0, t1, 0, 0.24, c, mixHex(c, "#FFFFFF", 0.12), mixHex(c, "#000000", 0.15)) + box3(u1 - 0.04, u1, t0, t1, 0, 0.24, c, mixHex(c, "#FFFFFF", 0.12), mixHex(c, "#000000", 0.15));
  const counter = (u0, u1, tt0, h = 0.3) => box3(u0, u1, tt0, 1, 0, h, white, "#D9D6D1", "#E8E4DE") + box3(u0, u1, tt0 - 0.005, 1, h, h + 0.02, "#BFB9B0", "#CFCAC2", "#B5AFA6");
  switch (t) {
    case "kid": {
      s += rug(0.3, 0.75, 0.25, 0.6, pal.rug);
      if (age === "baby") {
        s += box3(0.05, 0.3, 0.55, 0.85, 0, 0.3, white, "#FFFFFF", "#E7E4DF");
        for (let u = 0.07; u < 0.29; u += 0.025) s += ln3(P3(u, 0.55, 0.1), P3(u, 0.55, 0.29), "#D8D4CE", 0.9);
        s += poly3([P3(0.06, 0.56, 0.12), P3(0.29, 0.56, 0.12), P3(0.29, 0.84, 0.12), P3(0.06, 0.84, 0.12)], pal.bed);
        const [mx, my] = P3(0.17, 0.7, 0.95);
        s += `<g class="rm-bob" style="transform-origin:${mx}px ${my - 20}px">${ln3([mx, my - 26], [mx, my], "#C9C2B8", 1)}${[-14, 0, 14].map((d, i) => `<line x1="${mx}" y1="${my}" x2="${mx + d}" y2="${my + 10}" stroke="#C9C2B8"/><circle cx="${mx + d}" cy="${my + 14}" r="4" fill="${[pal.acc, "#F2B01E", pal.acc2][i]}"/>`).join("")}</g>`;
        s += box3(0.72, 0.95, 0.8, 0.97, 0, 0.34, white, "#FFFFFF", "#E7E4DF") + poly3([P3(0.73, 0.8, 0.345), P3(0.94, 0.8, 0.345), P3(0.94, 0.96, 0.345), P3(0.73, 0.96, 0.345)], pal.rug);
        const [cx, cy] = P3(0.62, 0.45, 0);
        s += `<g class="rm-sway" style="transform-origin:${cx}px ${cy - 34}px"><path d="M${cx - 22},${cy} q22,10 44,0" stroke="${wood}" stroke-width="3" fill="none"/><rect x="${cx - 16}" y="${cy - 34}" width="32" height="28" rx="8" fill="${pal.bed}"/></g>`;
      } else if (age === "toddler") {
        s += bed(0.04, 0.3, 0.45, 0.85, pal.bed, 1) + box3(0.36, 0.5, 0.78, 0.92, 0, 0.12, pal.acc, mixHex(pal.acc, "#FFFFFF", 0.25), mixHex(pal.acc, "#000000", 0.15));
        [[0.42, 0.4, "#F2B01E"], [0.5, 0.36, pal.acc2], [0.58, 0.42, "#E5484D"]].forEach(([u, tt, c]) => {
          const [x, y] = P3(u, tt, 0);
          s += `<rect x="${x - 7}" y="${y - 12}" width="14" height="12" rx="2" fill="${c}"/>`;
        });
        s += shelf(0.72, 0.96, 0.7, 0.96, 0.35, 1) + `<path d="M${pt3(P3(0.68, 0.45, 0))} L${pt3(P3(0.78, 0.5, 0.45))} L${pt3(P3(0.88, 0.45, 0))}Z" fill="${mixHex(pal.acc2, "#FFFFFF", 0.4)}" stroke="${wood}" stroke-width="1.5"/>`;
      } else {
        const teen = age === "teen" || age === "young" || age === "preteen";
        s += bed(0.03, teen ? 0.34 : 0.3, 0.4, 0.86, pal.bed, !teen) + desk(0.62, 0.95, 0.78, 0.96, teen ? (age === "young" ? 2 : 1) : 0) + shelf(0.86, 0.99, 0.3, 0.56, teen ? 0.5 : 0.6, !teen);
        const [x, y] = P3(0.76, 0.66, 0.2), q = sc3(0.66);
        s += teen ? `<rect x="${x - 12 * q}" y="${y - 4 * q}" width="${24 * q}" height="${30 * q}" rx="${6 * q}" fill="#2B2F38"/><rect x="${x - 10 * q}" y="${y - 26 * q}" width="${20 * q}" height="${24 * q}" rx="${5 * q}" fill="${pal.acc}"/>` : `<rect x="${x - 10 * q}" y="${y}" width="${20 * q}" height="${24 * q}" rx="${3 * q}" fill="${wood}"/>`;
        [[0.1, 0.22, 0.55, 0.72, pal.acc2], [0.25, 0.33, 0.5, 0.64, "#F2B01E"]].forEach(([a, b, c, d, f]) => (s += frame(a, b, c, d, f)));
        if (!teen) s += plant(0.58, 0.3);
      }
      break;
    }
    case "bed":
    case "guest": {
      const guest = t === "guest", duvet = guest ? "#E8DCC8" : "#9DB7D5";
      // The bed against the back wall, left of the window; a nightstand each side; the wardrobe along the right wall.
      s += poly3(qBack(0.07, 0.56, 0.02, 0.55), mixHex(wallCol, "#000000", 0.035));
      s += rug(0.04, 0.6, 0.22, 0.62, "#D9CBB8") + bed(0.1, 0.52, 0.42, 0.98, duvet);
      s += box3(0.01, 0.09, 0.86, 0.98, 0, 0.2, wood, mixHex(wood, "#FFFFFF", 0.2), mixHex(wood, "#000000", 0.15)) + box3(0.53, 0.61, 0.86, 0.98, 0, 0.2, wood, mixHex(wood, "#FFFFFF", 0.2), mixHex(wood, "#000000", 0.15));
      s += frame(0.18, 0.44, 0.58, 0.76, guest ? "#D9E4D2" : "#E8DFD2");
      if (guest) s += shelf(0.84, 0.99, 0.14, 0.34, 0.42) + plant(0.93, 0.9);
      else s += poly3(qRight(0.12, 0.62, 0, 0.82), "#EEEAE4") + [0.29, 0.45].map((tt) => ln3(P3(1, tt, 0.02), P3(1, tt, 0.8), "#D8D2CA", 1.2)).join("") + [0.27, 0.31, 0.43, 0.47].map((tt) => `<circle cx="${P3(0.995, tt, 0.42)[0].toFixed(1)}" cy="${P3(0.995, tt, 0.42)[1].toFixed(1)}" r="1.8" fill="#8E8579"/>`).join("") + box3(0.66, 0.92, 0.9, 0.99, 0, 0.12, "#C9B8A6", "#D9CBB8", "#B9A896");
      W.lamps = [[0.05, 0.93, "lamp"], [0.57, 0.93, "lamp"]];
      W.ceil = [0.32, 0.55];
      break;
    }
    case "office": {
      s += rug(0.15, 0.7, 0.2, 0.6, "#C9CED6") + desk(0.05, 0.5, 0.82, 0.98, 2) + shelf(0.87, 1, 0.35, 0.8, 0.72) + plant(0.62, 0.93);
      const [x, y] = P3(0.28, 0.66, 0.2), q = sc3(0.66);
      s += `<rect x="${x - 13 * q}" y="${y}" width="${26 * q}" height="${22 * q}" rx="${5 * q}" fill="#2B2F38"/><rect x="${x - 11 * q}" y="${y - 26 * q}" width="${22 * q}" height="${26 * q}" rx="${5 * q}" fill="#3A3F48"/>`;
      s += frame(0.1, 0.24, 0.6, 0.78, "#D7E3EE") + frame(0.28, 0.38, 0.62, 0.76, "#F2E3C9");
      W.lamps = [[0.42, 0.9, "lamp"], [0.75, 0.4, "lamp"]];
      break;
    }
    case "living": {
      // Sofa along the left wall, the TV on the right wall, the window free at the back.
      s += frame(0.08, 0.36, 0.5, 0.76, "#E3D3BE") + frame(0.12, 0.22, 0.55, 0.7, "#C9D8C2");
      s += rug(0.22, 0.78, 0.16, 0.66, "#D9CBB8");
      s += box3(0.01, 0.2, 0.28, 0.86, 0, 0.15, "#8E9AAF", mixHex("#8E9AAF", "#FFFFFF", 0.15), mixHex("#8E9AAF", "#000000", 0.12));
      s += box3(0.0, 0.05, 0.28, 0.86, 0, 0.34, mixHex("#8E9AAF", "#000000", 0.06), mixHex("#8E9AAF", "#FFFFFF", 0.1), mixHex("#8E9AAF", "#000000", 0.16));
      s += box3(0.01, 0.2, 0.84, 0.9, 0, 0.25, "#8E9AAF", mixHex("#8E9AAF", "#FFFFFF", 0.12), mixHex("#8E9AAF", "#000000", 0.15)) + box3(0.01, 0.2, 0.24, 0.3, 0, 0.25, "#8E9AAF", mixHex("#8E9AAF", "#FFFFFF", 0.12), mixHex("#8E9AAF", "#000000", 0.15));
      [[0.05, 0.4, "#E8DCC8"], [0.05, 0.68, "#C9A27A"]].forEach(([u, tt, c]) => (s += box3(u, u + 0.03, tt, tt + 0.1, 0.15, 0.26, c, mixHex(c, "#FFFFFF", 0.2), mixHex(c, "#000000", 0.12))));
      s += box3(0.36, 0.6, 0.36, 0.54, 0.1, 0.13, wood, mixHex(wood, "#FFFFFF", 0.2), mixHex(wood, "#000000", 0.15));
      s += box3(0.88, 1, 0.3, 0.72, 0, 0.14, "#E2D3BE", "#EDE2D2", "#D6C6AF") + poly3(qRight(0.38, 0.64, 0.3, 0.56), "#1B1E25", `id="${k}-tv"`) + poly3(qRight(0.39, 0.63, 0.31, 0.55), "#272B34");
      const ac = "#C9B79C";
      s += box3(0.66, 0.82, 0.16, 0.3, 0.02, 0.13, ac, mixHex(ac, "#FFFFFF", 0.2), mixHex(ac, "#000000", 0.12)) + box3(0.66, 0.82, 0.12, 0.16, 0.02, 0.28, mixHex(ac, "#000000", 0.06), mixHex(ac, "#FFFFFF", 0.15), mixHex(ac, "#000000", 0.15)) + box3(0.66, 0.69, 0.12, 0.3, 0.02, 0.2, ac, mixHex(ac, "#FFFFFF", 0.12), mixHex(ac, "#000000", 0.15)) + box3(0.79, 0.82, 0.12, 0.3, 0.02, 0.2, ac, mixHex(ac, "#FFFFFF", 0.12), mixHex(ac, "#000000", 0.15));
      s += plant(0.95, 0.93);
      W.psl = [[0.42, 0.46]];
      W.lamps = [[0.06, 0.94, "lamp"], [0.9, 0.82, "lamp"]];
      W.ceil = [0.4, 0.55];
      break;
    }
    case "kitchen": {
      // Worktop along the back with the sink under the window, wall cupboards to the right of it, a tall fridge
      // column in the corner, an island with stools in the middle and the pendants over the island.
      s += poly3(qBack(0.42, 0.85, 0.34, 0.6), "#F2EEE8") + [0.48, 0.54, 0.6, 0.66, 0.72, 0.78].map((u) => ln3(P3(u, 1, 0.34), P3(u, 1, 0.6), "rgba(0,0,0,.05)", 0.8)).join("");
      s += counter(0, 0.85, 0.86);
      s += box3(0.42, 0.85, 0.9, 1, 0.62, 0.9, white, "#FFFFFF", "#E4E0DA") + [0.53, 0.64, 0.75].map((u) => ln3(P3(u, 0.9, 0.62), P3(u, 0.9, 0.9), "#DAD5CE", 1)).join("");
      s += box3(0.85, 1, 0.82, 1, 0, 0.9, "#EFEDEA", "#FFFFFF", "#DEDAD4") + ln3(P3(0.86, 0.82, 0.45), P3(0.99, 0.82, 0.45), "#D2CDC6", 1) + ln3(P3(0.87, 0.82, 0.5), P3(0.87, 0.82, 0.7), "#B5AFA6", 2);
      const [sx, sy] = P3(0.23, 0.93, 0.33), q9 = sc3(0.93);
      s += `<ellipse cx="${sx}" cy="${sy}" rx="${16 * q9}" ry="${3.5 * q9}" fill="#C9CED6"/><path d="M${sx},${sy - 2} v${-10 * q9} q0,-4 ${5 * q9},-4" stroke="#9AA3AE" stroke-width="${2 * q9}" fill="none"/>`;
      s += poly3([P3(0.6, 0.88, 0.322), P3(0.74, 0.88, 0.322), P3(0.74, 0.97, 0.322), P3(0.6, 0.97, 0.322)], "#2B2F38");
      s += box3(0.38, 0.78, 0.36, 0.56, 0, 0.3, white, "#D9D6D1", "#E8E4DE") + box3(0.37, 0.79, 0.35, 0.57, 0.3, 0.32, "#BFB9B0", "#CFCAC2", "#B5AFA6");
      [0.45, 0.58, 0.71].forEach((u) => {
        const [x, y] = P3(u, 0.3, 0.22), q = sc3(0.3);
        s += `<path d="M${x},${y} v${16 * q}" stroke="#2B2F38" stroke-width="${2 * q}"/><ellipse cx="${x}" cy="${y}" rx="${7 * q}" ry="${2.5 * q}" fill="#2B2F38"/>`;
      });
      s += plant(0.04, 0.4);
      W.psl = [[0.47, 0.46], [0.58, 0.46], [0.69, 0.46]];
      W.lamps = [[0.3, 0.88, "lamp"], [0.92, 0.6, "lamp"]];
      W.ceil = [0.6, 0.4];
      break;
    }
    case "bath":
    case "smallbath":
    case "toilet": {
      // Tiles halfway up, the toilet and the vanity with its mirror along the walls, the window high and free.
      const tile = "#DDE5E8", big = t === "bath";
      s += poly3(qBack(0, 1, 0, 0.5), tile) + poly3(qLeft(0, 1, 0, 0.5), mixHex(tile, "#000000", 0.04)) + poly3(qRight(0, 1, 0, 0.5), mixHex(tile, "#000000", 0.07));
      for (let v = 0.1; v < 0.5; v += 0.1) s += ln3(P3(0, 1, v), P3(1, 1, v), "rgba(255,255,255,.7)", 0.8) + ln3(P3(0, 0, v), P3(0, 1, v), "rgba(255,255,255,.6)", 0.8) + ln3(P3(1, 0, v), P3(1, 1, v), "rgba(255,255,255,.6)", 0.8);
      for (let u = 0.1; u < 1; u += 0.1) s += ln3(P3(u, 1, 0), P3(u, 1, 0.5), "rgba(255,255,255,.7)", 0.8);
      if (big) s += box3(0.02, 0.5, 0.72, 0.98, 0, 0.22, "#FDFDFC", "#FFFFFF", "#E7EAEC") + poly3([P3(0.05, 0.75, 0.222), P3(0.47, 0.75, 0.222), P3(0.47, 0.95, 0.222), P3(0.05, 0.95, 0.222)], "#BFE3F2");
      else s += poly3(qBack(0.02, 0.36, 0, 0.92), "rgba(200,225,240,.28)") + ln3(P3(0.36, 1, 0), P3(0.36, 0.72, 0), "#B9C4CC", 1.4) + poly3([P3(0.36, 0.72, 0), P3(0.36, 1, 0), P3(0.36, 1, 0.92), P3(0.36, 0.72, 0.92)], "rgba(200,225,240,.35)") + `<circle cx="${P3(0.18, 1, 0.82)[0]}" cy="${P3(0.18, 1, 0.82)[1]}" r="6" fill="#C9CED6"/>`;
      // vanity and mirror on the right wall
      s += box3(0.84, 1, 0.42, 0.68, 0.24, 0.32, "#C9A27A", "#FFFFFF", "#B48A5A") + poly3(qRight(0.44, 0.66, 0.42, 0.72), "#DCE6EE") + poly3(qRight(0.46, 0.64, 0.44, 0.7), "#E9F1F6");
      // the toilet on the left wall
      s += box3(0.02, 0.12, 0.4, 0.5, 0.14, 0.3, "#FDFDFC", "#FFFFFF", "#E7EAEC") + box3(0.02, 0.17, 0.36, 0.54, 0, 0.14, "#FDFDFC", "#FFFFFF", "#E7EAEC");
      if (big) s += box3(0.62, 0.66, 0.94, 0.99, 0.3, 0.55, "#C9CED6", null, "#B5BCC4") + poly3(qBack(0.55, 0.62, 0.3, 0.52), "#F2B6C6");
      s += plant(0.93, 0.92) + box3(0.4, 0.62, 0.08, 0.3, 0, 0.01, "#BFD3DC", "#C9DCE4", "#BFD3DC");
      W.lamps = [[0.92, 0.55, "lamp"], [0.2, 0.9, "lamp"]];
      W.ceil = [0.45, 0.5];
      break;
    }
    case "utility": {
      // Washer and dryer stacked at the left, the sink under the window, shelves high on the right wall.
      s += box3(0.01, 0.2, 0.76, 0.98, 0, 0.36, "#FBFBFA", "#FFFFFF", "#E2E0DC") + box3(0.01, 0.2, 0.76, 0.98, 0.37, 0.72, "#FBFBFA", "#FFFFFF", "#E2E0DC");
      [[0.18], [0.54]].forEach(([v]) => {
        const [x, y] = P3(0.105, 0.76, v), q = sc3(0.76);
        s += `<circle cx="${x}" cy="${y}" r="${11 * q}" fill="#3A4150" stroke="#C9CDD3" stroke-width="${3 * q}"/>`;
      });
      s += counter(0.22, 0.98, 0.86) + box3(0.6, 0.84, 0.88, 0.97, 0.3, 0.33, "#C9CED6", "#D7DCE2", "#B5BCC4");
      s += [0.42, 0.62].map((v) => poly3([P3(1, 0.2, v), P3(1, 0.7, v), P3(0.94, 0.7, v), P3(0.94, 0.2, v)], "#FFFFFF")).join("");
      [[0.3, 0.42, "#7FB9E8"], [0.42, 0.42, "#F5D08A"], [0.55, 0.62, "#C9A4E8"], [0.32, 0.62, "#E5484D"]].forEach(([tt, v, c]) => {
        const [x, y] = P3(0.975, tt, v);
        s += `<rect x="${(x - 4).toFixed(1)}" y="${(y - 10).toFixed(1)}" width="8" height="10" rx="2" fill="${c}"/>`;
      });
      s += box3(0.42, 0.6, 0.3, 0.44, 0, 0.12, "#D8C7A8", "#E6D8BE", "#C9B793") + box3(0.62, 0.95, 0.12, 0.2, 0.3, 0.32, "#C9CED6", null, "#B5BCC4");
      W.lamps = [[0.5, 0.9, "lamp"], [0.95, 0.4, "lamp"]];
      break;
    }
    case "hall": {
      const entre = /entr|vindfang|hall/i.test(r.name || "");
      if (entre) s += poly3(qBack(0.32, 0.58, 0, 0.78), "#5B4632") + poly3(qBack(0.35, 0.55, 0.42, 0.72), "#DCE6EE") + `<circle cx="${P3(0.54, 1, 0.38)[0]}" cy="${P3(0.54, 1, 0.38)[1]}" r="2.6" fill="#D9B45A"/>`;
      else s += poly3(qBack(0.36, 0.56, 0, 0.78), "#F4F1EC") + ln3(P3(0.36, 1, 0), P3(0.36, 1, 0.78), "#D8D2CA", 1.4) + ln3(P3(0.56, 1, 0), P3(0.56, 1, 0.78), "#D8D2CA", 1.4);
      // bench and hooks with coats on the left wall, shoes below; a mirror on the right wall
      s += box3(0.01, 0.12, 0.45, 0.8, 0.18, 0.22, wood, mixHex(wood, "#FFFFFF", 0.2), mixHex(wood, "#000000", 0.15)) + box3(0.01, 0.12, 0.45, 0.8, 0, 0.06, "#E9E4DC", "#F2EEE8", "#DAD4CB");
      [0.5, 0.6, 0.7].forEach((tt, i) => {
        const [x, y] = P3(0, tt, 0.72), q = sc3(tt);
        s += `<circle cx="${x + 2}" cy="${y}" r="${2.2 * q}" fill="#2B2F38"/>` + (entre || i < 2 ? `<path d="M${x + 2},${y} l${8 * q},${2 * q} l${2 * q},${34 * q} l${-14 * q},${2 * q} z" fill="${["#5E6A75", "#C2703D", "#7FA36A"][i]}" opacity=".9"/>` : "");
        const [bx, by] = P3(0.06, tt + 0.03, 0);
        s += `<ellipse cx="${bx}" cy="${by - 2}" rx="${6 * q}" ry="${2.4 * q}" fill="${["#2B2F38", "#8A6440", "#E5484D"][i]}"/>`;
      });
      s += poly3(qRight(0.4, 0.62, 0.28, 0.85), "#C9B8A6") + poly3(qRight(0.42, 0.6, 0.3, 0.83), "#DCE6EE");
      s += rug(0.25, 0.75, 0.08, entre ? 0.5 : 0.92, entre ? "#B9A896" : "#C9B8A6") + (entre ? "" : frame(0.1, 0.24, 0.5, 0.7, "#E8DFD2"));
      W.lamps = [[0.08, 0.9, "lamp"], [0.92, 0.3, "lamp"]];
      W.ceil = [0.5, 0.45];
      break;
    }
    case "walkin": {
      // Hanging rails with clothes on both side walls, drawers and a mirror at the back.
      const rail = (side) => {
        let o = "";
        const u = side ? 0.995 : 0.005, uu = side ? 0.86 : 0.14;
        o += poly3(side ? qRight(0.15, 0.98, 0.88, 0.9) : qLeft(0.15, 0.98, 0.88, 0.9), "#F2EEE8");
        o += ln3(P3(uu, 0.15, 0.82), P3(uu, 0.98, 0.82), "#9AA3AE", 1.6);
        const rr = prng((hashStr(k) % 999) + (side ? 7 : 3)), cols = ["#2B2F38", "#5E6A75", "#C2703D", "#E8DCC8", "#7FA36A", "#9DB7D5", "#F2B6C6", "#FBFAF7"];
        for (let tt = 0.2; tt < 0.95; tt += 0.045) {
          const L = 0.36 + rr() * 0.22, c = cols[Math.floor(rr() * cols.length)];
          o += poly3([P3(uu, tt, 0.81), P3(uu, tt + 0.035, 0.81), P3(uu, tt + 0.035, 0.81 - L), P3(uu, tt, 0.81 - L)], c, 'stroke="rgba(0,0,0,.12)" stroke-width=".6"');
        }
        o += box3(side ? 0.84 : 0, side ? 1 : 0.16, 0.15, 0.98, 0, 0.12, "#EEEAE4", "#F5F2EE", "#E0DBD4");
        return o;
      };
      s += rail(0) + rail(1) + box3(0.2, 0.8, 0.9, 1, 0, 0.35, "#EEEAE4", "#F5F2EE", "#E0DBD4") + [0.12, 0.24].map((v) => ln3(P3(0.2, 0.9, v), P3(0.8, 0.9, v), "#D8D2CA", 1)).join("") + poly3(qBack(0.38, 0.62, 0.42, 0.88), "#C9B8A6") + poly3(qBack(0.4, 0.6, 0.44, 0.86), "#DCE6EE");
      s += rug(0.3, 0.7, 0.2, 0.7, "#D9CBB8");
      W.lamps = [[0.5, 0.9, "lamp"], [0.3, 0.6, "lamp"]];
      break;
    }
    case "garage": {
      // The garage door at the back, a car seen from behind, shelves and bikes along the sides.
      s += poly3(qBack(0.18, 0.82, 0, 0.78), "#C9CCD1");
      for (let v = 0.08; v < 0.78; v += 0.08) s += ln3(P3(0.18, 1, v), P3(0.82, 1, v), "#AEB3BA", 1.2);
      s += poly3(qBack(0.24, 0.76, 0.62, 0.7), "#DCE6EE");
      s += box3(0, 0.12, 0.3, 0.9, 0, 0.7, "#8E9196", "#A3A6AB", "#7D8085") + [0.18, 0.36, 0.54].map((v) => poly3([P3(0, 0.3, v), P3(0.12, 0.3, v), P3(0.12, 0.9, v), P3(0, 0.9, v)], "#6E7176")).join("");
      [[0.04, 0.5, 0.18, "#E5484D"], [0.06, 0.7, 0.36, "#2F6FD6"], [0.05, 0.6, 0.54, "#F2B01E"]].forEach(([u, tt, v, c]) => (s += box3(u, u + 0.05, tt, tt + 0.08, v, v + 0.1, c, mixHex(c, "#FFFFFF", 0.2), mixHex(c, "#000000", 0.2))));
      const car = (cx, tt, col) => {
        const [x, y] = P3(cx, tt, 0), q = sc3(tt), w = 120 * q, h = 62 * q;
        return `<g><ellipse cx="${x}" cy="${y}" rx="${w * 0.58}" ry="${8 * q}" fill="rgba(0,0,0,.25)"/><rect x="${x - w / 2 - 2 * q}" y="${y - 18 * q}" width="${14 * q}" height="${18 * q}" rx="${3 * q}" fill="#1E1F24"/><rect x="${x + w / 2 - 12 * q}" y="${y - 18 * q}" width="${14 * q}" height="${18 * q}" rx="${3 * q}" fill="#1E1F24"/><path d="M${x - w / 2},${y - 14 * q} v${-h * 0.42} q0,${-8 * q} ${10 * q},${-10 * q} l${12 * q},${-h * 0.36} q${4 * q},${-6 * q} ${12 * q},${-6 * q} h${w - 68 * q} q${8 * q},0 ${12 * q},${6 * q} l${12 * q},${h * 0.36} q${10 * q},${2 * q} ${10 * q},${10 * q} v${h * 0.42} z" fill="${col}"/><path d="M${x - w / 2 + 26 * q},${y - h * 0.62} l${8 * q},${-h * 0.3} h${w - 68 * q} l${8 * q},${h * 0.3} z" fill="#2B3440"/><rect x="${x - w / 2 + 6 * q}" y="${y - h * 0.5}" width="${20 * q}" height="${7 * q}" rx="${3 * q}" fill="#E5484D"/><rect x="${x + w / 2 - 26 * q}" y="${y - h * 0.5}" width="${20 * q}" height="${7 * q}" rx="${3 * q}" fill="#E5484D"/><rect x="${x - 14 * q}" y="${y - h * 0.38}" width="${28 * q}" height="${8 * q}" rx="${1.5 * q}" fill="#F2F2F2"/></g>`;
      };
      s += car(0.5, 0.5, "#C9CED6");
      const bike = (tt) => {
        const [x, y] = P3(0.97, tt, 0.18), q = sc3(tt);
        return `<g stroke="#2B2F38" stroke-width="${1.6 * q}" fill="none"><circle cx="${x - 2 * q}" cy="${y}" r="${12 * q}"/><circle cx="${x - 2 * q}" cy="${y - 42 * q}" r="${12 * q}"/><path d="M${x - 2 * q},${y} l${-4 * q},${-21 * q} l${4 * q},${-21 * q}" stroke="#2F6FD6" stroke-width="${2.2 * q}"/></g>`;
      };
      s += bike(0.35) + bike(0.6);
      W.lamps = [[0.5, 0.9, "lamp"], [0.9, 0.85, "lamp"]];
      W.ceil = [0.5, 0.5];
      break;
    }
    default:
      s += rug(0.25, 0.75, 0.2, 0.6, "#D9CBB8") + plant(0.9, 0.9) + shelf(0.02, 0.2, 0.84, 0.97, 0.5) + frame(0.76, 0.88, 0.55, 0.72, "#E8DFD2");
  }
  return s;
}

/* Where the lamps sit in the picture. */
const GSLOTS = [[0.5, 0.5, "ceil"], [0.18, 0.8, "lamp"], [0.82, 0.7, "lamp"], [0.5, 0.9, "strip"]];
const PSL = [[0.36, 0.45], [0.5, 0.45], [0.64, 0.45], [0.43, 0.6], [0.57, 0.6]];
function slotsFor(lights, W = {}) {
  // The room's drawing says where its lamps go (clear of the window); otherwise the usual places.
  const psl = W.psl || PSL, ceil = W.ceil ? [...W.ceil, "ceil"] : GSLOTS[0], lamps = W.lamps || [GSLOTS[1], GSLOTS[2]];
  let pn = 0, ln = 0;
  return lights.map((l, i) =>
    l.lk === "pendant" ? [...psl[pn++ % psl.length], "pend"] : l.lk === "strip" ? GSLOTS[3] : l.lk === "floor" || l.lk === "table" || l.lk === "wall" ? lamps[ln++ % lamps.length] : i === 0 ? ceil : lamps[ln++ % lamps.length]
  );
}
function genLamps(k, lights, slots) {
  let o = "";
  lights.slice(0, 5).forEach((l, i) => {
    const [u, tt, kind] = slots[i];
    if (kind === "ceil") o += ceilingDisc3(u, tt, l.id, k);
    else if (kind === "pend") {
      const [x, y] = P3(u, tt, 0.62), [ax, ay] = P3(u, tt, 1), q = sc3(tt);
      o += `<g ${lampAttrs(k, l.id)}><circle cx="${x}" cy="${y}" r="${22 * q}" fill="transparent"/>${ln3([ax, ay], [x, y - 8 * q], "#3A3F48", 1)}<path class="rm-shade" d="M${x - 13 * q},${y + 2 * q} Q${x},${y - 18 * q} ${x + 13 * q},${y + 2 * q} Z"/><ellipse class="rm-bulb" cx="${x}" cy="${y + 2 * q}" rx="${9 * q}" ry="${2 * q}" fill="#CFC8C0"/></g>`;
    } else if (kind === "lamp") o += panthella3(u, tt, 0.3, l.id, k, 1.1);
    else {
      const a = P3(0.08, 1, 0.97), b = P3(0.92, 1, 0.97);
      o += `<g ${lampAttrs(k, l.id, "strip")}><line x1="${a[0]}" y1="${a[1] + 4}" x2="${b[0]}" y2="${b[1] + 4}" stroke="transparent" stroke-width="16"/><line class="rm-shade" x1="${a[0]}" y1="${a[1] + 2}" x2="${b[0]}" y2="${b[1] + 2}" stroke-width="3.5" stroke-linecap="round"/></g>`;
    }
  });
  return o;
}
function genGlows(k, lights, slots, W) {
  let o = W.win ? beam3(k, (W.win.x0 - 120) / 240, (W.win.x0 + W.win.w - 120) / 240, 0.38) : "";
  lights.slice(0, 5).forEach((l, i) => {
    const [u, tt, kind] = slots[i];
    if (kind === "pend") {
      const [x, y] = P3(u, tt, 0.62);
      o += halo3(k, i, x, y + 10, 62, [...P3(u, tt, 0), 80, 20]);
    } else if (kind === "ceil") {
      const [x, y] = P3(u, tt, 1);
      o += halo3(k, i, x, y + 16, 90, [...P3(u, tt, 0), 170, 42]);
    } else if (kind === "lamp") {
      const [x, y] = P3(u, tt, 0.3);
      o += halo3(k, i, x, y - 12, 60, [...P3(u, tt, 0), 90, 22]);
    } else {
      const [x, y] = P3(0.5, 1, 0.97);
      o += halo3(k, i, x, y + 10, 120, null);
    }
  });
  return o;
}

/* ------------------------------------------------------------------ lights and the rest of the room, from Home Assistant */
const override = {}; // entity → { on, bri, col, until }: what a tap did, until Home Assistant has answered
const scenes = {}; // room id → the Hverdagsro scene picked last
const COLOR_MODES = ["hs", "xy", "rgb", "rgbw", "rgbww"];
function inPoly(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function lightModel(ctx, id, extra = {}) {
  const s = ctx.st(id);
  const a = s?.attributes || {};
  const modes = a.supported_color_modes || [];
  const type = modes.some((m) => COLOR_MODES.includes(m)) ? "color" : modes.includes("color_temp") ? "ct" : modes.includes("brightness") || a.brightness != null ? "bri" : "onoff";
  let col = WARM;
  if (Array.isArray(a.rgb_color) && a.color_mode && COLOR_MODES.includes(a.color_mode)) col = rgbHex(a.rgb_color);
  else if (a.color_temp_kelvin) col = a.color_temp_kelvin < 2900 ? WARM : a.color_temp_kelvin < 3600 ? SOFT : a.color_temp_kelvin < 4800 ? NEUTRAL : COOL;
  const dom = id.split(".")[0];
  let L = { id, ent: id, dom, name: extra.name || a.friendly_name || id, type: dom === "light" ? type : "onoff", on: s?.state === "on", bri: s?.state === "on" ? (a.brightness != null ? Math.max(1, Math.round((a.brightness / 255) * 100)) : 100) : a.brightness != null ? Math.round((a.brightness / 255) * 100) : 80, col, lk: extra.lk || "", off: !s || s.state === "unavailable" };
  const o = override[id];
  if (o && o.until > Date.now()) L = { ...L, ...o };
  return L;
}
/* A light source drawn in Husbyggeren without an entity: shown, but it can't be switched. */
const noEntity = (it) => ({ id: "i-" + it.id, ent: "", name: it.name || "", type: it.rgb ? "color" : "ct", on: false, bri: 80, col: WARM, lk: it.lk || "", off: true, noent: true });
/* Like the prototype's genRoom: the light sources placed in the room in Husbyggeren. Without any, the room's own
   light (as "Loftlampe"), or the lights in the room's area in Home Assistant. */
function roomLights(ctx, r, all = false) {
  const placed = typeof House.roomLightItems === "function" ? House.roomLightItems(ctx, r.id) : [];
  const seen = new Set();
  const isGroup = (id) => Array.isArray(ctx.hass.states[id]?.attributes?.entity_id);
  let lights = [];
  // The light sources drawn in Husbyggeren first (they have a place in the picture) ...
  for (const it of placed) {
    if (!it.ent || !ctx.hass.states[it.ent] || seen.has(it.ent)) continue;
    seen.add(it.ent);
    lights.push(lightModel(ctx, it.ent, { name: it.name, lk: it.lk }));
  }
  r._placed = lights.length > 0;
  // ... then every other light in the room's area, but not a group of them as well.
  if (r.area) {
    const inArea = ctx.entities("light").filter((id) => ctx.area(id) === r.area);
    const single = inArea.filter((id) => !isGroup(id));
    for (const id of single.length ? single : inArea)
      if (!seen.has(id)) {
        seen.add(id);
        lights.push(lightModel(ctx, id));
      }
  }
  // Lights picked for the lamps of a hand-drawn room, even from another area.
  if (hasArt(r) && r.lamps && typeof r.lamps === "object")
    for (const id of Object.values(r.lamps))
      if (typeof id === "string" && ctx.hass.states[id] && !seen.has(id)) {
        seen.add(id);
        lights.push(lightModel(ctx, id));
      }
  if (!lights.length && r.light && ctx.hass.states[r.light]) lights.push(lightModel(ctx, r.light, { name: ctx.t("Loftlampe") }));
  // Drawn lamps without a light in Home Assistant are shown in the picture, but last and switched off.
  for (const it of placed) if (!it.ent || !ctx.hass.states[it.ent]) lights.push(noEntity(it));
  lights.sort((a, b) => (a.lk === "strip") - (b.lk === "strip") || !!a.noent - !!b.noent);
  // The names and hidden lamps chosen in "Tilpas rummet".
  const cfg = roomCfg(ctx, r);
  lights.forEach((l) => {
    l.base = l.name;
    if (cfg.names[l.id]) l.name = cfg.names[l.id];
  });
  if (!all && cfg.hide.length) lights = lights.filter((l) => !cfg.hide.includes(l.id));
  const w = lights.length === 1 ? 0.85 : 0;
  lights.forEach((l, i) => (l.w = w || (l.lk === "strip" || l.lk === "rgb" ? 0.3 : i === 0 ? 0.7 : Math.max(0.15, 0.45 - i * 0.04))));
  return lights;
}
function areaEntities(ctx, r) {
  if (!r.area) return [];
  const skip = new Set(["light", "sun", "person", "zone", "update", "button", "event", "number", "select", "text", "image", "device_tracker", "automation", "tts", "stt", "conversation", "wake_word", "assist_satellite", "siren"]);
  return Object.keys(ctx.hass?.states || {}).filter((id) => {
    const d = id.split(".")[0];
    if (skip.has(d) || ctx.area(id) !== r.area) return false;
    if (ctx.hass.entities?.[id]?.hidden || ctx.hass.entities?.[id]?.entity_category) return false;
    if (d === "sensor") return ["temperature", "humidity", "co2", "carbon_dioxide", "pm25", "illuminance", "power"].includes(ctx.hass.states[id].attributes.device_class);
    return true;
  });
}
function roomTemp(ctx, r) {
  for (const id of areaEntities(ctx, r)) {
    const s = ctx.st(id);
    if (id.startsWith("sensor.") && s.attributes.device_class === "temperature" && !isNaN(+s.state)) return +s.state;
    if (id.startsWith("climate.") && s.attributes.current_temperature != null) return +s.attributes.current_temperature;
  }
  return null;
}

/* ------------------------------------------------------------------ light in the picture: time of day, weather, lamps */
const KF = (R, S) => [[0, "#0B1030", "#1A2350"], [R - 1.3, "#0E1538", "#27305E"], [R - 0.2, "#3D3F7A", "#F09F7E"], [R + 0.9, "#5E9BE3", "#F5D2A6"], [12, "#3C8BDF", "#A8D6F2"], [S - 1.4, "#5A8DD6", "#F2C68E"], [S, "#4A4A8E", "#EE896B"], [S + 0.9, "#1D2150", "#4A3D7A"], [24, "#0B1030", "#1A2350"]];
function env(ctx) {
  const sun = ctx.st("sun.sun");
  const hrs = (iso) => {
    const d = new Date(iso);
    return d.getHours() + d.getMinutes() / 60;
  };
  let R = 7, S = 17;
  if (sun?.attributes?.next_rising) R = hrs(sun.attributes.next_rising);
  if (sun?.attributes?.next_setting) S = hrs(sun.attributes.next_setting);
  if (!(S > R + 2)) [R, S] = [7, 17];
  const now = new Date(), h = now.getHours() + now.getMinutes() / 60;
  const K = KF(R, S);
  let i = 0;
  while (i < K.length - 2 && K[i + 1][0] <= h) i++;
  const a = K[i], b = K[i + 1], f = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0] || 1)));
  const top = mix(hexRgb(a[1]), hexRgb(b[1]), f), bot = mix(hexRgb(a[2]), hexRgb(b[2]), f);
  const el = h >= R && h <= S ? Math.sin((Math.PI * (h - R)) / (S - R)) : -Math.min(1, Math.min(Math.abs(h - S), Math.abs(R - h), Math.abs(R + 24 - h)) / 3);
  const wxId = ctx.data?.settings?.weather || ctx.entities("weather")[0];
  const kind = wxId ? weatherKind(ctx.st(wxId)?.state) : "partly";
  const wx = WX[kind] || WX.partly;
  return { h, R, S, el, top, bot, wx, day: Math.max(0, Math.min(1, (el + 0.15) / 0.45)) };
}
/* All the styles that make the picture live, as one small style sheet (so a change can fade, and taps can update it). */
function lookCss(k, lights, W, E, sceneStars) {
  const rules = [];
  const r = (sel, css) => rules.push(`${sel}{${css}}`);
  const dayL = W.win ? E.day : E.el > 0 ? 0.8 : 0.1;
  const night = dayL < 0.35, base = 0.72 - 0.64 * dayL * (1 - E.wx.over * 0.3);
  let amb = 0, tr = 0, tg = 0, tb = 0, tw = 0;
  lights.forEach((l) => {
    if (!l.on) return;
    const a = (l.bri / 100) * l.w;
    amb += a;
    const c = hexRgb(l.col);
    tr += c[0] * a;
    tg += c[1] * a;
    tb += c[2] * a;
    tw += a;
  });
  amb = Math.min(1, amb);
  r(`#${k}-dark`, `opacity:${(base * (1 - 0.82 * amb)).toFixed(3)}`);
  r(`#${k}-tint`, `opacity:${Math.min(0.4, amb * 0.45).toFixed(3)};fill:${tw ? rgbHex([tr / tw, tg / tw, tb / tw]) : WARM}`);
  r(`#${k}-dust`, `opacity:${(amb * 0.8).toFixed(2)}`);
  r(`#${k}-stars`, `opacity:${sceneStars && night ? 1 : 0}`);
  const offFill = night ? "#7E7A76" : "#E2DDD6";
  lights.forEach((l, i) => {
    const a = l.on ? l.bri / 100 : 0;
    r(`#${k}-l${i}-halo`, `fill:${l.col};opacity:${(Math.pow(a, 0.8) * (night ? 0.72 : 0.5)).toFixed(3)}`);
    r(`#${k}-l${i}-pool`, `fill:${l.col};opacity:${(Math.pow(a, 0.9) * (night ? 0.5 : 0.32)).toFixed(3)}`);
    const lit = mixHex(l.col, "#FFFFFF", 0.55 - 0.25 * (1 - a));
    r(`[data-k="${k}"][data-id="${l.id}"] .rm-shade`, l.on ? `fill:${lit};stroke:${lit}` : `fill:${offFill};stroke:${offFill}`);
  });
  if (W.win) {
    const { x0, yt, w, h } = W.win;
    const t2 = mix(E.top, grey(E.top), E.wx.over), b2 = mix(E.bot, grey(E.bot), E.wx.over * 0.9);
    r(`#${k}-ws0`, `stop-color:${rgbHex(t2)}`);
    r(`#${k}-ws1`, `stop-color:${rgbHex(b2)}`);
    if (E.h >= E.R && E.h <= E.S) {
      const p = (E.h - E.R) / (E.S - E.R);
      r(`#${k}-wsun`, `transform:translate(${(x0 + w * (0.08 + 0.84 * p)).toFixed(1)}px,${(yt + h * (0.75 - 0.55 * Math.sin(Math.PI * p))).toFixed(1)}px);opacity:${(1 - E.wx.over * 0.85).toFixed(2)}`);
    } else r(`#${k}-wsun`, "opacity:0");
    if (E.day < 0.4) {
      const nh = E.h < E.R ? E.h + 24 : E.h, p = Math.max(0, Math.min(1, (nh - E.S) / (E.R + 24 - E.S)));
      r(`#${k}-wmoon`, `transform:translate(${(x0 + w * (0.12 + 0.76 * p)).toFixed(1)}px,${(yt + h * (0.62 - 0.4 * Math.sin(Math.PI * p))).toFixed(1)}px);opacity:${(1 - E.wx.over * 0.7).toFixed(2)}`);
    } else r(`#${k}-wmoon`, "opacity:0");
    r(`#${k}-wmoonc`, `fill:${rgbHex(t2)}`);
    r(`#${k}-wstars`, `opacity:${((1 - E.day) * (1 - E.wx.over * 0.9)).toFixed(2)}`);
    r(`#${k}-wcl`, `opacity:${Math.min(1, 0.25 + E.wx.over).toFixed(2)}`);
    r(`#${k}-wdim`, `opacity:${((1 - E.day) * 0.82).toFixed(2)}`);
    r(`#${k}-wnwin`, `opacity:${E.day < 0.5 ? 1 : 0.15}`);
    r(`#${k}-wrain`, E.wx.drops === 1 ? "display:inline" : "display:none");
    r(`#${k}-wsnow`, E.wx.drops === 2 ? "display:inline" : "display:none");
    r(`#${k}-beam`, `opacity:${(E.day * (1 - E.wx.over * 0.8) * 0.55).toFixed(2)}`);
  }
  return rules.join("\n");
}
const hasArt = (r) => !r.img && ART_IDS.includes(r.art);
const ARTH = () => ({ P3, sc3, pt3, poly3, ln3, qLeft, qRight, box3, shell3, window3, beam3, panthella3, ceilingDisc3, lampAttrs, halo3 });
const keyOf = (prefix, id) => `rm${prefix}-${slug(id).replace(/_/g, "-")}`;
function scene(ctx, room, lights, prefix = "") {
  const k = keyOf(prefix, room.id);
  const W = {};
  const art = hasArt(room) ? drawArt(ARTH(), room.art, k, W, lights, room.lamps || {}) : null;
  const draw = art ? art.draw : genDraw(k, room, W);
  const pos = (room.page && room.page.pos) || {}, mine = ctx.me?.room_prefs?.[room.id]?.pos || {};
  const slots = slotsFor(lights, W).map((sl, i) => {
    const p = mine[lights[i]?.id] || pos[lights[i]?.id];
    return p ? [p[0], p[1], sl[2]] : sl;
  });
  const sc = PRESETS(room, lights, slots).find((p) => p[0] === scenes[room.id]);
  const E = env(ctx);
  const svg = `<svg class="rm-svg" id="${k}" viewBox="0 0 480 270" role="img" aria-label="${ctx.esc(room.name)}">
    <defs><filter id="${k}-blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14"/></filter><clipPath id="${k}-clip"><rect width="480" height="270"/></clipPath></defs>
    <style id="${k}-look">${lookCss(k, lights, W, E, sc?.[3])}</style>
    <g clip-path="url(#${k}-clip)">${draw}
    <rect id="${k}-dark" class="rm-dark" width="480" height="270" fill="#0B0E22"/>
    <rect id="${k}-tint" class="rm-dark" width="480" height="270" style="mix-blend-mode:soft-light"/>
    <g class="rm-glows">${art ? art.glows : genGlows(k, lights, slots, W)}</g>${stars3(k)}${dust3(k)}${art ? art.lamps : genLamps(k, lights, slots)}</g></svg>`;
  return { k, svg, W, E, slots };
}
/* Re-paint a picture after a tap, before Home Assistant has answered. */
function repaint(ctx, room) {
  for (const prefix of ["", "c"]) {
    const k = keyOf(prefix, room.id);
    const el = ctx.root.getElementById(`${k}-look`);
    if (!el) continue;
    const lights = roomLights(ctx, room);
    const W = {};
    if (hasArt(room)) drawArt(ARTH(), room.art, k, W, lights, room.lamps || {});
    else genDraw(k, room, W);
    const sc = PRESETS(room, lights, slotsFor(lights, W)).find((p) => p[0] === scenes[room.id]);
    el.textContent = lookCss(k, lights, W, env(ctx), sc?.[3]);
  }
}

/* Hverdagsro's own scenes for every room: [id, name, per light [on, bri, colour], stars] */
function PRESETS(room, lights, slots) {
  const all = (on, bri, col) => lights.map(() => (on ? [1, bri, col] : [0]));
  const list = [
    ["klar", "Klar", all(1, 100, NEUTRAL)],
    ["hygge", "Hygge", all(1, 45, WARM)],
    ["daempet", "Dæmpet", all(1, 15, WARM)],
  ];
  if (room.rtype === "kid") list.push(["godnat", "Godnat", lights.map((l, i) => (i === lights.length - 1 || slots[i]?.[2] === "lamp" ? [1, 6, "#FFB070"] : [0])), 1]);
  else list.push(["film", "Film", lights.map((l) => (l.lk === "strip" || l.type === "color" ? [1, 40, "#6366F1"] : [1, 8, WARM]))]);
  return list;
}
function lightCall(ctx, l, on, bri, col) {
  if (!l.ent) return;
  if (l.dom && l.dom !== "light") return ctx.call("homeassistant", on ? "turn_on" : "turn_off", { entity_id: l.ent });
  if (!on) return ctx.call("light", "turn_off", { entity_id: l.ent });
  const data = { entity_id: l.ent };
  if (l.type !== "onoff" && bri != null) data.brightness_pct = bri;
  if (col) {
    if (l.type === "color" && !CT_K[col]) data.rgb_color = hexRgb(col);
    else if ((l.type === "color" || l.type === "ct") && CT_K[col]) data.color_temp_kelvin = CT_K[col];
    else if (l.type === "color") data.rgb_color = hexRgb(col);
  }
  return ctx.call("light", "turn_on", data);
}
const setOverride = (l, patch) => (override[l.ent] = { on: l.on, bri: l.bri, col: l.col, ...override[l.ent], ...patch, until: Date.now() + 5000 });

/* ------------------------------------------------------------------ the room card */
function roomOf(ctx, id) {
  const r = (houseOf(ctx).rooms || []).find((x) => x.id === id);
  return r ? meta(ctx, r) : null;
}
function lightsCard(ctx, room, lights, cls = "s8") {
  const { t, esc, svg } = ctx;
  const sc = scene(ctx, room, lights);
  const presets = PRESETS(room, lights, sc.slots);
  const grad = (p) => {
    const cols = p[2].filter((v) => v[0]).map((v, i) => v[2] || lights[i]?.col || WARM);
    return cols.length ? `linear-gradient(135deg, ${cols.join(", ")})` : "#2B2F45";
  };
  const on = lights.filter((l) => l.on).length;
  const temp = roomTemp(ctx, room);
  const haScenes = room.area ? Object.keys(ctx.hass.states).filter((id) => (id.startsWith("scene.") || id.startsWith("script.")) && ctx.area(id) === room.area) : [];
  const color = (room.kid && ctx.member(room.kid)?.color) || "var(--violet)";
  const kid = ctx.isKid;
  const offline = lights.filter((l) => l.off && !l.noent).map((l) => l.name);
  const foot = kid
    ? ""
    : `<p class="t-sub rm-foot">${esc(room._placed ? t("Scenerne er Hverdagsros egne, og lyskilderne er dem, der står i rummet i Husbyggeren.") : t("Scenerne er Hverdagsros egne, og lyset er rummets lys i Home Assistant."))}${haScenes.length ? ` ${esc(t("Scenerne i Home Assistant ligger til sidst."))}` : ""}${offline.length ? ` ${esc(t("{names} er utilgængelig i HA i dag.", { names: offline.join(t(" og ")) }))}` : ""}</p>`;
  return `<section class="card ${cls} rm-card" data-room="${esc(room.id)}" style="--pc:${color}"><div class="card-head"><h2>${esc((room.rtype === "kid" && room.area && ctx.hass.areas?.[room.area]?.name) || room.name)}</h2><span class="meta">${lights.length ? (on ? esc(t("{n} af {total} lys tændt", { n: on, total: lights.filter((l) => !l.noent).length })) : esc(t("Alt er slukket"))) : esc(t("Ingen lys i rummet"))}${temp != null ? ` · ${ctx.fmt.num(temp, 1)} °C` : ""}</span></div>
    <div class="rm-wrap"><div class="rm-pic">${sc.svg}${lights.length ? `<span class="rm-hint">${svg("bulb")}${esc(t("Tryk på en lampe"))}</span>` : ""}</div>
    <div class="rm-side">${
      lights.length
        ? `<div class="rm-scenes"><button data-act="room-off" data-id="${esc(room.id)}" class="rm-offb"><i>${svg("power")}</i>${esc(t("Sluk alt"))}</button>${presets
            .map((p) => `<button data-act="room-scene" data-id="${esc(room.id)}" data-scene="${p[0]}" aria-pressed="${scenes[room.id] === p[0]}"><i style="background:${grad(p)}"></i>${esc(t(p[1]))}</button>`)
            .join("")}${haScenes.map((id) => `<button data-act="room-ha" data-id="${esc(id)}"><i style="background:var(--surface-2)">${svg(id.startsWith("script.") ? "play" : "sparkle")}</i>${esc(ctx.name(id))}</button>`).join("")}</div>
      <div class="rm-lights">${lights
        .filter((l) => !l.noent)
        .map(
          (l) => `<div class="rm-l${l.on ? " on" : ""}" data-id="${esc(l.id)}" style="--lc:${l.col}"><button class="rm-tg" data-act="room-lamp" data-k="${sc.k}" data-id="${esc(l.id)}" aria-pressed="${l.on}" aria-label="${esc(l.name)}"${l.off ? " disabled" : ""}>${svg("bulb")}</button>
        <div class="rm-ln"><b>${esc(l.name)}</b><small><span class="rm-pct">${l.noent ? esc(t("Slukket")) : l.off ? esc(t("Svarer ikke")) : l.on ? `${l.bri} %` : esc(t("Slukket"))}</span> · ${esc(l.ent || t("Ingen entitet"))}</small></div>
        ${l.type === "onoff" ? "<span></span>" : `<input type="range" min="1" max="100" value="${l.bri}" data-in="room-bri" data-id="${esc(l.id)}" data-room="${esc(room.id)}" aria-label="${esc(t("Lysstyrke {name}", { name: l.name }))}">`}
        ${l.type === "color" || l.type === "ct" ? `<div class="rm-cols">${(l.type === "color" ? SW_COLOR : SW_CT).map((c) => `<button data-act="room-col" data-id="${esc(l.id)}" data-room="${esc(room.id)}" data-col="${c}" style="--sw:${c}" aria-label="${esc(t("Farve"))}" aria-pressed="${c === l.col}"></button>`).join("")}</div>` : ""}</div>`
        )
        .join("")}</div>`
        : `<p class="t-sub">${esc(kid ? t("Der er ikke koblet noget lys til værelset endnu.") : t("Der er ikke koblet lys til rummet. Sæt lyskilder i rummet i Husbyggeren, eller vælg rummets område i Home Assistant."))}</p>`
    }</div></div>${foot}</section>`;
}

/* The prototype's big room card (roomCard: the picture, scenes and lamps), for other pages. `room` is a room of the
   house, a room id, or a child's member id (that child's room). Empty when there is no such room. */
export function roomLightsCard(ctx, room, cls = "s12") {
  const rooms = houseOf(ctx).rooms || [];
  const raw = typeof room === "string" ? rooms.find((x) => x.id === room) || rooms.find((x) => meta(ctx, x).kid === room) : room;
  if (!raw) return "";
  const r = meta(ctx, raw);
  return lightsCard(ctx, r, roomLights(ctx, r), cls);
}

/* A small, living card for a room (the home page uses it). Links to the room's page. */
export function roomCard(ctx, room) {
  if (!room) return "";
  const r = meta(ctx, room);
  const lights = roomLights(ctx, r);
  const sc = scene(ctx, r, lights, "c");
  const on = lights.filter((l) => l.on).length;
  return `<button class="card rm-mini" data-go="rum:${ctx.esc(r.id)}" style="--pc:${(r.kid && ctx.member(r.kid)?.color) || "var(--violet)"}"><span class="rm-pic">${sc.svg.replace(/data-act="room-lamp"/g, "")}</span><span class="rm-mini-t"><b>${ctx.esc(r.name)}</b><small>${lights.length ? (on ? ctx.esc(ctx.t("{n} af {total} lys tændt", { n: on, total: lights.filter((l) => !l.noent).length })) : ctx.esc(ctx.t("Alt er slukket"))) : ctx.esc(typeName(ctx, r))}</small></span>${ctx.svg("go", "ic rm-mini-go")}</button>`;
}
const typeName = (ctx, r) => ctx.t((RTYPES().find((x) => x[0] === r.rtype) || [, "Rum"])[1]);

/* The rest of the room: media, climate, sensors, covers, switches. */
function thingRow(ctx, id) {
  const { esc, svg, t } = ctx;
  const s = ctx.st(id);
  if (!s) return "";
  const d = id.split(".")[0], a = s.attributes, name = ctx.name(id);
  const unav = s.state === "unavailable" || s.state === "unknown";
  let ic = "plug", col = "#64748B", txt = ctx.hass.formatEntityState ? ctx.hass.formatEntityState(s) : s.state, ctl = "", cls = "";
  if (d === "media_player") {
    ic = a.device_class === "tv" || /tv/i.test(id) ? "tv" : "speaker";
    col = ic === "tv" ? "#16A34A" : "#E5484D";
    const playing = s.state === "playing";
    txt = { playing: t("Spiller"), paused: t("På pause"), off: t("Slukket"), idle: t("Ledig"), on: t("Tændt"), standby: t("Slukket"), buffering: t("Henter …") }[s.state] || txt;
    if (playing) {
      cls = "play";
      txt = [a.media_title, a.media_artist].filter(Boolean).join(" · ") || txt;
    }
    if (!unav && s.state !== "off") ctl = `<button class="rp-b" data-act="room-media" data-id="${esc(id)}" aria-label="${esc(playing ? t("Pause") : t("Afspil"))}">${svg(playing ? "pause" : "play")}</button>`;
    else if (!unav) ctl = `<button class="rp-tg" data-act="room-toggle" data-id="${esc(id)}" aria-pressed="false" aria-label="${esc(t("Tænd {name}", { name }))}"><i></i></button>`;
  } else if (d === "climate") {
    ic = "heat";
    col = "#EF4444";
    txt = `${a.current_temperature != null ? `${ctx.fmt.num(a.current_temperature, 1)} °C` : ""}${a.temperature != null ? ` → ${ctx.fmt.num(a.temperature, 1)} °C` : ""}` || txt;
    if (a.temperature != null) ctl = `<span class="rm-step"><button class="rp-b" data-act="room-temp" data-id="${esc(id)}" data-d="-0.5" aria-label="${esc(t("Koldere"))}">−</button><button class="rp-b" data-act="room-temp" data-id="${esc(id)}" data-d="0.5" aria-label="${esc(t("Varmere"))}">+</button></span>`;
  } else if (d === "sensor") {
    const dc = a.device_class;
    ic = dc === "temperature" ? "heat" : dc === "humidity" ? "drop" : dc === "power" ? "bolt" : "sliders";
    col = dc === "temperature" ? "#EF4444" : dc === "humidity" ? "#0EA5E9" : "#64748B";
    txt = unav ? txt : `${isNaN(+s.state) ? s.state : ctx.fmt.num(+s.state, 1)} ${a.unit_of_measurement || ""}`;
  } else if (d === "cover") {
    ic = a.device_class === "garage" ? "garage" : "curtain";
    col = "#64748B";
    const open = s.state === "open" || s.state === "opening";
    if (!unav) txt = open ? t("Åben") : t("Lukket");
    ctl = unav ? "" : `<button class="rp-b" data-act="room-cover" data-id="${esc(id)}">${esc(open ? t("Luk") : t("Åbn"))}</button>`;
  } else if (d === "switch" || d === "fan" || d === "input_boolean" || d === "humidifier") {
    ic = d === "fan" ? "fan" : "power";
    if (!unav) txt = s.state === "on" ? t("Tændt") : t("Slukket");
    col = "#F59E0B";
    ctl = unav ? "" : `<button class="rp-tg${s.state === "on" ? " on" : ""}" data-act="room-toggle" data-id="${esc(id)}" aria-pressed="${s.state === "on"}" aria-label="${esc(t("Tænd eller sluk {name}", { name }))}"><i></i></button>`;
  } else if (d === "binary_sensor") {
    const dc = a.device_class;
    ic = dc === "door" ? "door" : dc === "window" ? "window" : dc === "motion" || dc === "occupancy" || dc === "presence" ? "walk" : dc === "smoke" ? "smoke" : dc === "moisture" ? "drop" : "eye";
    col = s.state === "on" && ["door", "window", "smoke", "moisture", "opening", "garage_door"].includes(dc) ? "#E5484D" : "#10B981";
    if (s.state === "on" && ["smoke", "moisture"].includes(dc)) cls = "bad";
    const on = s.state === "on";
    if (["door", "window", "garage_door", "opening"].includes(dc)) txt = on ? t("Åben") : t("Lukket");
    else if (["motion", "occupancy", "presence"].includes(dc)) txt = on ? t("Bevægelse nu") : t("Rolig");
    else if (dc === "smoke") txt = on ? t("Røg!") : t("OK");
    else if (dc === "moisture") txt = on ? t("Vand!") : t("Tør");
  } else if (d === "lock") {
    ic = "lock";
    col = s.state === "locked" ? "#10B981" : "#E5484D";
    if (!unav) txt = s.state === "locked" ? t("Låst") : t("Ulåst");
    ctl = unav ? "" : `<button class="rp-b" data-act="room-lock" data-id="${esc(id)}">${esc(s.state === "locked" ? t("Lås op") : t("Lås"))}</button>`;
  } else if (d === "vacuum" || d === "lawn_mower") {
    ic = d === "vacuum" ? "vacuum" : "tree";
    col = "#334155";
  } else if (d === "camera") {
    ic = "camera";
    col = "#2F6FED";
  } else if (d === "scene" || d === "script") return "";
  else if (d === "remote" || d === "media_source") return "";
  return `<div class="rp-row st-${unav ? "warn" : cls || "none"}" style="--hc:${col}"><span class="rp-ic">${svg(ic)}</span><div><b>${esc(name)}</b><small>${esc(txt)}</small></div>${ctl}</div>`;
}

/* ------------------------------------------------------------------ the room page (layout A: the picture first) */
/* What a room page shows, and how. The family's choice is stored on the room in the house (room.page); a member's
   own choice ("kun for mig") in their prefs (room_prefs[room id]) and wins over the family's. */
const SHOW = [["pic", "Billede af rummet"], ["scenes", "Stemninger"], ["lights", "Lys"], ["climate", "Klima"], ["media", "Musik og TV"], ["security", "Døre, vinduer og kamera"], ["other", "Andet i rummet"]];
const sel = {}; // room id → the lamp in the drawer
const allOpen = {}; // room id → the list of all lamps is open
const famCfg = (r) => (r && r.page && typeof r.page === "object" ? r.page : {});
const myCfg = (ctx, r) => (r && ctx.me?.room_prefs && typeof ctx.me.room_prefs === "object" ? ctx.me.room_prefs[r.id] || {} : {});
function roomCfg(ctx, r, scope = "") {
  const f = famCfg(r), m = scope === "family" ? {} : myCfg(ctx, r);
  const pick = (k, d) => (Array.isArray(m[k]) || typeof m[k] === "boolean" ? m[k] : Array.isArray(f[k]) || typeof f[k] === "boolean" ? f[k] : d);
  return {
    show: { pic: true, scenes: true, lights: true, climate: true, media: true, security: true, other: true, ...(f.show || {}), ...(m.show || {}) },
    fav: pick("fav", []),
    hide: pick("hide", []),
    add: pick("add", []),
    pos: { ...(f.pos || {}), ...(m.pos || {}) },
    names: { ...(f.names || {}), ...(m.names || {}) },
    pin: pick("pin", false),
  };
}
const hasMine = (ctx, r) => Object.keys(myCfg(ctx, r)).length > 0;
/* What else is in the room, sorted into the page's groups. */
function roomEntities(ctx, room, cfg = null) {
  const ids = new Set(areaEntities(ctx, room));
  if (typeof House.roomItemEntities === "function") for (const id of House.roomItemEntities(ctx, room.id)) if (ctx.hass.states[id] && !id.startsWith("light.")) ids.add(id);
  for (const id of cfg?.add || []) if (ctx.hass.states[id]) ids.add(id);
  return [...ids].filter((id) => !cfg || !cfg.hide.includes(id));
}
function groupOf(ctx, id) {
  const d = id.split(".")[0], dc = ctx.hass.states[id]?.attributes?.device_class;
  if (d === "media_player") return "media";
  if (d === "climate" || d === "fan" || d === "humidifier" || (d === "sensor" && ["temperature", "humidity", "co2", "carbon_dioxide", "pm25", "illuminance"].includes(dc))) return "climate";
  if (d === "lock" || d === "camera" || d === "cover" || d === "binary_sensor" || d === "alarm_control_panel") return "security";
  return "other";
}
const GROUPS = [["climate", "Klima", "heat"], ["media", "Musik og TV", "speaker"], ["security", "Døre, vinduer og kamera", "door"], ["other", "Andet i rummet", "plug"]];
/* The drawer for one lamp: on and off, brightness and colour. */
function lampSheet(ctx, room, l, k) {
  const { t, esc, svg } = ctx;
  return `<section class="card ra-sheet${l.on ? " on" : ""}" data-id="${esc(l.id)}" style="--lc:${l.col}">
    <div class="ra-sh-top"><span class="ra-sh-ic">${svg("bulb")}</span><div class="ra-sh-t"><b>${esc(l.name)}</b><small class="rm-pct">${l.off ? esc(t("Svarer ikke")) : l.on ? (l.type === "onoff" ? esc(t("Tændt")) : `${esc(t("Tændt"))} · ${l.bri} %`) : esc(t("Slukket"))}</small></div>
    <button class="btn ${l.on ? "soft" : ""} ra-sh-tg" data-act="room-lamp" data-k="${k}" data-id="${esc(l.id)}" data-sheet="1" aria-pressed="${l.on}"${l.off ? " disabled" : ""}>${esc(l.on ? t("Sluk") : t("Tænd"))}</button></div>
    ${l.type === "onoff" ? "" : `<label class="ra-bri"><span>${esc(t("Lysstyrke"))}</span><input type="range" min="1" max="100" value="${l.bri}" data-in="room-bri" data-id="${esc(l.id)}" data-room="${esc(room.id)}" aria-label="${esc(t("Lysstyrke {name}", { name: l.name }))}"${l.off ? " disabled" : ""}></label>`}
    ${l.type === "color" || l.type === "ct" ? `<div class="rm-cols ra-cols">${(l.type === "color" ? SW_COLOR : SW_CT).map((c) => `<button data-act="room-col" data-id="${esc(l.id)}" data-room="${esc(room.id)}" data-col="${c}" style="--sw:${c}" aria-label="${esc(t("Farve"))}" aria-pressed="${c === l.col}"></button>`).join("")}</div>` : ""}
  </section>`;
}
function roomPage(ctx, id) {
  const { t, esc, svg } = ctx;
  const raw = (houseOf(ctx).rooms || []).find((x) => x.id === id);
  const back = ctx.isParent && ctx.on("security") ? "sikkerhed" : "hjem";
  if (!raw) return `<section class="card"><h2>${esc(t("Rummet findes ikke længere"))}</h2><button class="btn soft" data-go="${back}">${esc(t("Til Huset"))}</button></section>`;
  const room = meta(ctx, raw);
  const cfg = roomCfg(ctx, room);
  const lights = roomLights(ctx, room);
  const real = lights.filter((l) => !l.noent);
  const on = real.filter((l) => l.on).length;
  const temp = roomTemp(ctx, room);
  const color = (room.kid && ctx.member(room.kid)?.color) || "var(--violet)";
  const sc = scene(ctx, room, lights);
  const ag = AGES().find((a) => a[0] === room.age);
  const count = lights.length ? (on ? t("{n} af {total} lys tændt", { n: on, total: real.length }) : t("Alt er slukket")) : t("Ingen lys i rummet");
  const eyebrow = [typeName(ctx, room), room.rtype === "kid" && ag ? t(ag[1]) : "", temp != null ? `${ctx.fmt.num(temp, 1)} °C` : ""].filter(Boolean).join(" · ");
  const tools = `<button class="ra-back" data-go="${back}">${svg("back")}${esc(back === "sikkerhed" ? t("Huset") : t("Hjem"))}</button>
    <button class="ra-tune" data-act="room-tune" data-id="${esc(room.id)}" aria-label="${esc(t("Tilpas rummet"))}">${svg("sliders")}</button>`;
  const placing = place.room === room.id && real.find((l) => l.id === place.lamp);
  const placer = placing ? `<div class="ra-placer" data-act="room-place-at" data-id="${esc(room.id)}"><span>${esc(t("Tryk der, hvor {name} skal sidde", { name: placing.name }))}</span><button class="btn soft sm" data-act="room-place-stop">${esc(t("Færdig"))}</button></div>` : "";
  const head = cfg.show.pic
    ? `<div class="ra-hero${placing ? " placing" : ""}">${sc.svg}${placer}${tools}<div class="ra-cap"><div><span>${esc(eyebrow)}</span><h2>${esc(room.name)}</h2></div><em>${esc(count)}</em></div></div>`
    : `<div class="ra-flat">${tools}<div class="ra-cap"><div><span>${esc(eyebrow)}</span><h2>${esc(room.name)}</h2></div><em>${esc(count)}</em></div></div>`;
  // The moods: favourites first, then Hverdagsro's own, then the room's scenes in Home Assistant.
  const haScenes = room.area ? Object.keys(ctx.hass.states).filter((x) => (x.startsWith("scene.") || x.startsWith("script.")) && ctx.area(x) === room.area) : [];
  const chips = [
    ...PRESETS(room, lights, sc.slots).map((p) => ({ id: p[0], html: `<button class="ra-chip" data-act="room-scene" data-id="${esc(room.id)}" data-scene="${p[0]}" aria-pressed="${scenes[room.id] === p[0]}">${cfg.fav.includes(p[0]) ? `${svg("pstar")}` : ""}${esc(t(p[1]))}</button>` })),
    ...haScenes.map((x) => ({ id: x, html: `<button class="ra-chip ha" data-act="room-ha" data-id="${esc(x)}">${cfg.fav.includes(x) ? svg("pstar") : svg(x.startsWith("script.") ? "play" : "sparkle")}${esc(ctx.name(x))}</button>` })),
  ].sort((a, b) => (cfg.fav.includes(b.id) ? 1 : 0) - (cfg.fav.includes(a.id) ? 1 : 0) || (cfg.fav.indexOf(a.id) - cfg.fav.indexOf(b.id)));
  const scenesRow = cfg.show.scenes && lights.length
    ? `<div class="ra-chips" role="group" aria-label="${esc(t("Stemninger"))}"><button class="ra-chip off" data-act="room-off" data-id="${esc(room.id)}">${svg("power")}${esc(t("Sluk alt"))}</button>${chips.map((c) => c.html).join("")}</div>`
    : "";
  // The lamp in the drawer: the one tapped last, else the first one that is on, else the first.
  let cur = real.find((l) => l.id === sel[room.id]) || real.find((l) => l.on) || real[0];
  const lightsPart = cfg.show.lights && real.length
    ? `${cfg.show.pic ? `<p class="ra-hint">${esc(t("Tryk på en lampe i billedet, eller vælg en stemning."))}</p>` : ""}
      ${cur ? lampSheet(ctx, room, cur, sc.k) : ""}
      ${real.length > 1 ? `<button class="ra-all" data-act="room-all" data-id="${esc(room.id)}" aria-expanded="${!!allOpen[room.id]}">${esc(t("Alle {n} lamper i rummet", { n: real.length }))}${svg("go", "ic")}</button>` : ""}
      ${allOpen[room.id] && real.length > 1 ? `<div class="ra-list">${real.map((l) => `<button class="ra-li${l.on ? " on" : ""}${cur && l.id === cur.id ? " cur" : ""}" data-act="room-pick" data-room="${esc(room.id)}" data-id="${esc(l.id)}" style="--lc:${l.col}"><i></i><b>${esc(l.name)}</b><small>${esc(l.off ? t("Svarer ikke") : l.on ? (l.type === "onoff" ? t("Tændt") : `${l.bri} %`) : t("Slukket"))}</small></button>`).join("")}</div>` : ""}`
    : cfg.show.lights && !lights.length ? `<p class="t-sub">${esc(t("Der er ikke koblet lys til rummet. Sæt lyskilder i rummet i Husbyggeren, eller vælg rummets område i Home Assistant."))}</p>` : "";
  // Everything else in the room, as small cards per group.
  const ents0 = roomEntities(ctx, room, cfg);
  // The appliances in the room as living tiles (the washing machine spins, the coffee drips); the rest as tiles.
  const [apHtml, apIds] = roomTiles(ctx, ents0), ents = ents0.filter((x) => !apIds.includes(x));
  const groups = GROUPS.filter(([g]) => cfg.show[g]).map(([g, name, ic]) => {
    const rows = ents.filter((x) => groupOf(ctx, x) === g).map((x) => thingRow(ctx, x)).filter(Boolean);
    return rows.length ? `<section class="card ra-group"><div class="card-head"><h2>${svg(ic, "ic")}${esc(t(name))}</h2></div><div class="rp-list">${rows.join("")}</div></section>` : "";
  }).filter(Boolean);
  if (apHtml && cfg.show.other) groups.unshift(`<section class="card ra-group ra-ap"><div class="card-head"><h2>${svg("vacuum", "ic")}${esc(t("Apparater"))}</h2></div><div class="ap-grid">${apHtml}</div></section>`);
  const plan = ctx.isParent && cfg.show.other && typeof House.roomPlan === "function" ? House.roomPlan(ctx, room.id) : null;
  if (plan) groups.push(`<section class="card ra-group rp-mini"><div class="card-head"><h2>${esc(t("På tegningen"))}</h2><span class="meta">${esc(t("{n} møbler", { n: plan.furn }))}</span></div>${plan.svg}</section>`);
  return `<div class="ra rm-card" data-room="${esc(room.id)}" style="--pc:${color}">
    <div class="ra-main">${head}${scenesRow}</div>
    <div class="ra-side">${lightsPart}</div>
    ${groups.length ? `<div class="ra-groups">${groups.join("")}</div>` : ""}
  </div>
  <p class="foot">${esc(room.img ? t("Billedet er jeres eget.") : hasArt(room) ? t("Værelset er håndtegnet.") : room.rtype === "kid" ? t("Billedet er tegnet ud fra rumtypen, alder og stil.") : t("Billedet er tegnet ud fra rumtypen."))} ${esc(t("Tryk på knappen øverst til højre for at vælge, hvad siden viser."))}</p>`;
}

/* "Tilpas rummet": what the page shows, favourite moods, lamps (rename, hide) and the front page. For the whole
   family (parents) or only for me. */
const tune = { s: null, id: "", scope: "" };
const place = { room: "", lamp: "" }; // placing a lamp in the picture
function tuneHtml(ctx, room) {
  const { t, esc, svg } = ctx;
  const fam = ctx.isParent, mine = !!ctx.me;
  if (!tune.scope) tune.scope = fam ? "family" : "me";
  const scope = tune.scope;
  const cfg = roomCfg(ctx, room, scope);
  const all = roomLights(ctx, room, true).filter((l) => !l.noent);
  const sc = PRESETS(room, all, []).map((p) => [p[0], t(p[1])]);
  const ha = room.area ? Object.keys(ctx.hass.states).filter((x) => (x.startsWith("scene.") || x.startsWith("script.")) && ctx.area(x) === room.area).map((x) => [x, ctx.name(x)]) : [];
  const d = `data-room="${esc(room.id)}"`;
  return `<div class="ra-tn"><span class="eyebrow">${esc(room.name)}</span><h2>${esc(t("Tilpas rummet"))}</h2>
    ${fam && mine ? `<div class="seg ra-scope" role="tablist"><button data-act="room-scope" data-v="family" aria-pressed="${scope === "family"}">${esc(t("For hele familien"))}</button><button data-act="room-scope" data-v="me" aria-pressed="${scope === "me"}">${esc(t("Kun for mig"))}</button></div>` : ""}
    <p class="t-sub">${esc(scope === "family" ? t("Det, du vælger her, gælder for alle i familien, som ikke har valgt selv.") : t("Det, du vælger her, gælder kun for dig."))}${scope === "me" && hasMine(ctx, room) ? ` <button class="lnk" data-act="room-reset" ${d}>${esc(t("Brug familiens igen"))}</button>` : ""}</p>
    <div class="ra-tn-list">${SHOW.map(([k, name]) => `<label class="ra-tn-row"><span>${esc(t(name))}</span><input type="checkbox" data-in="room-cfg" ${d} data-k="show.${k}" ${cfg.show[k] ? "checked" : ""}></label>`).join("")}</div>
    ${sc.length || ha.length ? `<b class="ra-tn-h">${esc(t("Favoritstemninger"))}</b><div class="ra-tn-chips">${[...sc, ...ha].map(([id, name]) => `<button class="ra-chip${cfg.fav.includes(id) ? " fav" : ""}" data-act="room-fav" ${d} data-v="${esc(id)}" aria-pressed="${cfg.fav.includes(id)}">${cfg.fav.includes(id) ? svg("pstar") : ""}${esc(name)}</button>`).join("")}</div>` : ""}
    ${all.length ? `<b class="ra-tn-h">${esc(t("Lamper"))}</b><div class="ra-tn-lamps">${all.map((l) => {
      const hidden = cfg.hide.includes(l.id);
      return `<div class="ra-tn-lamp${hidden ? " hid" : ""}" style="--lc:${l.col}"><i></i><input type="text" maxlength="40" value="${esc(cfg.names[l.id] || "")}" placeholder="${esc(l.base || l.name)}" data-in="room-name" ${d} data-id="${esc(l.id)}" aria-label="${esc(t("Navn på {name}", { name: l.base || l.name }))}">${!hasArt(room) && cfg.show.pic && !hidden ? `<button class="iconbtn" data-act="room-place" ${d} data-id="${esc(l.id)}" data-close title="${esc(t("Placér i billedet"))}" aria-label="${esc(t("Placér i billedet"))}">${svg("pin")}</button>` : ""}<button class="btn soft sm" data-act="room-hide" ${d} data-id="${esc(l.id)}">${esc(hidden ? t("Vis") : t("Skjul"))}</button></div>`;
    }).join("")}</div>` : ""}
    ${thingsTune(ctx, room, cfg, d)}
    <label class="ra-tn-row ra-tn-pin"><span>${esc(t("Vis på forsiden"))}</span><input type="checkbox" data-in="room-cfg" ${d} data-k="pin" ${cfg.pin ? "checked" : ""}></label>
    <div class="sheet-actions">${fam && ctx.on("house") ? `<button class="btn soft" data-act="house-redit" data-id="${esc(room.id)}" data-close>${svg("edit")}${esc(t("Billede, type og område"))}</button>` : ""}<button class="btn" data-close>${esc(t("Færdig"))}</button></div></div>`;
}
/* What is on the page: every entity of the room with a tick, and a search box to add more from Home Assistant. */
function thingsTune(ctx, room, cfg, d) {
  const { t, esc, svg } = ctx;
  const all = [...new Set([...roomEntities(ctx, room), ...cfg.hide])].filter((id) => ctx.hass.states[id] && !id.startsWith("light."));
  const q = (tune.q || "").trim().toLowerCase();
  const hits = q.length >= 2 ? Object.keys(ctx.hass.states).filter((id) => !all.includes(id) && !id.startsWith("light.") && !/^(update|persistent_notification|zone|sun|tts|conversation|event|button|device_tracker|person)\./.test(id) && (id.includes(q) || ctx.name(id).toLowerCase().includes(q))).slice(0, 10) : [];
  return `<b class="ra-tn-h">${esc(t("Ting på siden"))}</b><p class="t-sub">${esc(t("Sæt flueben ved det, der skal være på siden. Søg for at hente mere fra Home Assistant."))}</p>
    <div class="ra-tn-list">${all.map((id) => `<label class="ra-tn-row"><span>${esc(ctx.name(id))}<small>${esc(id)}</small></span><input type="checkbox" data-in="room-ent" ${d} data-id="${esc(id)}" ${cfg.hide.includes(id) ? "" : "checked"}></label>`).join("")}</div>
    <div class="ra-tn-add"><input type="search" data-in="room-search" ${d} value="${esc(tune.q || "")}" placeholder="${esc(t("Søg efter en ting i Home Assistant …"))}">${hits.length ? `<div class="ra-tn-hits">${hits.map((id) => `<button data-act="room-addent" ${d} data-id="${esc(id)}">${svg("plus")}<span>${esc(ctx.name(id))}<small>${esc(id)}</small></span></button>`).join("")}</div>` : ""}</div>`;
}
function openTune(ctx, id) {
  const raw = findRoom(ctx, id);
  if (!raw) return;
  tune.id = id;
  tune.scope = "";
  tune.s = ctx.sheet(tuneHtml(ctx, meta(ctx, raw)), { cls: "ra-tune-sheet" });
}
function redrawTune(ctx) {
  const raw = findRoom(ctx, tune.id);
  if (!raw || !tune.s?.el?.isConnected) return;
  const at = tune.s.el.scrollTop;
  tune.s.el.innerHTML = tuneHtml(ctx, meta(ctx, raw));
  tune.s.el.scrollTop = at;
}
/* Change one setting in the chosen scope, save it and redraw. */
async function setCfg(ctx, roomId, change) {
  const scope = tune.scope || (ctx.isParent ? "family" : "me");
  if (scope === "family") {
    if (!ctx.isParent) return;
    const house = JSON.parse(JSON.stringify(ctx.data?.house || {}));
    const r = (house.rooms || []).find((x) => x.id === roomId);
    if (!r) return;
    r.page = change({ ...famCfg(r) });
    await ctx.save("house", house);
  } else if (ctx.me) {
    const all = { ...(ctx.me.room_prefs || {}) };
    const next = change({ ...(all[roomId] || {}) });
    if (next && Object.keys(next).length) all[roomId] = next;
    else delete all[roomId];
    ctx.me.room_prefs = all;
    try {
      await ctx.ws("prefs", { member: ctx.me.id, prefs: { room_prefs: all } });
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  }
  redrawTune(ctx);
  ctx.render();
}
/* The rooms pinned to the front page, as small living cards. */
export function pinnedRooms(ctx) {
  const rooms = (houseOf(ctx).rooms || []).filter((r) => roomCfg(ctx, r).pin);
  if (!rooms.length) return "";
  return `<section class="card s12 ra-pins"><div class="card-head"><h2>${ctx.esc(ctx.t("Rum"))}</h2></div><div class="ra-pin-grid">${rooms.map((r) => roomCard(ctx, r)).join("")}</div></section>`;
}

const findRoom = (ctx, id) => (houseOf(ctx).rooms || []).find((x) => x.id === id);

const acts = {
  "room-lamp": (el, ev, ctx) => {
    const roomEl = el.closest("[data-room]");
    const k = el.dataset.k;
    let room = roomEl ? findRoom(ctx, roomEl.dataset.room) : null;
    if (!room) room = (houseOf(ctx).rooms || []).find((r) => keyOf("", r.id) === k || keyOf("c", r.id) === k);
    if (!room) return;
    room = meta(ctx, room);
    const l = roomLights(ctx, room).find((x) => x.id === el.dataset.id);
    if (!l || l.off) return;
    // On the room page a tap on a lamp that is on first opens it in the drawer; the next tap turns it off.
    const page = el.closest(".ra");
    if (page && !el.dataset.sheet) {
      const was = sel[room.id];
      sel[room.id] = l.id;
      if (l.on && was !== l.id) return ctx.render();
    }
    ctx.q(`.rm-card[data-room="${CSS.escape(room.id)}"]`)?.classList.add("touched");
    setOverride(l, { on: !l.on });
    delete scenes[room.id];
    repaint(ctx, room);
    const row = ctx.q(`.rm-card[data-room="${CSS.escape(room.id)}"] .rm-l[data-id="${CSS.escape(l.id)}"]`);
    if (row) {
      row.classList.toggle("on", !l.on);
      row.querySelector(".rm-tg")?.setAttribute("aria-pressed", String(!l.on));
    }
    if (page) ctx.render();
    return lightCall(ctx, l, !l.on, null, null);
  },
  "room-pick": (el, ev, ctx) => {
    sel[el.dataset.room] = el.dataset.id;
    ctx.render();
  },
  "room-all": (el, ev, ctx) => {
    allOpen[el.dataset.id] = !allOpen[el.dataset.id];
    ctx.render();
  },
  "room-tune": (el, ev, ctx) => openTune(ctx, el.dataset.id),
  "room-scope": (el, ev, ctx) => {
    tune.scope = el.dataset.v;
    redrawTune(ctx);
  },
  "room-fav": (el, ev, ctx) => {
    const raw = findRoom(ctx, el.dataset.room);
    if (!raw) return;
    const cur = roomCfg(ctx, raw, tune.scope).fav, v = el.dataset.v;
    return setCfg(ctx, raw.id, (c) => ({ ...c, fav: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v].slice(-12) }));
  },
  "room-hide": (el, ev, ctx) => {
    const raw = findRoom(ctx, el.dataset.room);
    if (!raw) return;
    const cur = roomCfg(ctx, raw, tune.scope).hide, v = el.dataset.id;
    if (sel[raw.id] === v) delete sel[raw.id];
    return setCfg(ctx, raw.id, (c) => ({ ...c, hide: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v].slice(-40) }));
  },
  "room-reset": (el, ev, ctx) => setCfg(ctx, el.dataset.room, () => ({})),
  "room-addent": (el, ev, ctx) => {
    const raw = findRoom(ctx, el.dataset.room);
    if (!raw) return;
    const cur = roomCfg(ctx, raw, tune.scope), id = el.dataset.id;
    tune.q = "";
    return setCfg(ctx, raw.id, (c) => ({ ...c, add: [...new Set([...cur.add, id])].slice(-60), hide: cur.hide.filter((x) => x !== id) }));
  },
  "room-place": (el, ev, ctx) => {
    place.room = el.dataset.room;
    place.lamp = el.dataset.id;
    ctx.render();
  },
  "room-place-stop": (el, ev, ctx) => {
    place.room = place.lamp = "";
    ctx.render();
  },
  "room-place-at": (el, ev, ctx) => {
    const raw = findRoom(ctx, el.dataset.id), svgEl = el.parentElement?.querySelector("svg.rm-svg");
    if (!raw || !svgEl || !place.lamp) return;
    const r = svgEl.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * 480, y = ((ev.clientY - r.top) / r.height) * 270;
    const room = meta(ctx, raw), lights = roomLights(ctx, room), i = lights.findIndex((l) => l.id === place.lamp);
    const kind = i >= 0 ? slotsFor(lights)[i][2] : "lamp";
    // Back from the picture to the room's own coordinates (u across, t into the room), for the kind of lamp.
    let tt = kind === "ceil" ? y / 58 : kind === "lamp" ? (189 - y) / 38.6 : kind === "pend" ? 0.5 : 1;
    tt = Math.max(0.05, Math.min(0.95, tt));
    const u = Math.max(0.04, Math.min(0.96, (x - 120 * tt) / (480 - 240 * tt)));
    const lamp = place.lamp;
    place.room = place.lamp = "";
    return setCfg(ctx, raw.id, (c) => ({ ...c, pos: { ...(c.pos || {}), [lamp]: [Math.round(u * 1000) / 1000, Math.round(tt * 1000) / 1000] } }));
  },
  "room-off": (el, ev, ctx) => {
    const room = meta(ctx, findRoom(ctx, el.dataset.id));
    const lights = roomLights(ctx, room).filter((l) => l.on && l.ent);
    delete scenes[room.id];
    lights.forEach((l) => setOverride(l, { on: false }));
    repaint(ctx, room);
    ctx.render();
    if (lights.length) return ctx.call("homeassistant", "turn_off", { entity_id: lights.map((l) => l.ent) });
  },
  "room-scene": async (el, ev, ctx) => {
    const room = meta(ctx, findRoom(ctx, el.dataset.id));
    const lights = roomLights(ctx, room);
    const p = PRESETS(room, lights, slotsFor(lights)).find((x) => x[0] === el.dataset.scene);
    if (!p) return;
    scenes[room.id] = p[0];
    lights.forEach((l, i) => {
      const [on, bri, col] = p[2][i];
      setOverride(l, { on: !!on, ...(on ? { bri, col: l.type === "color" || CT_K[col] ? col : l.col } : {}) });
    });
    repaint(ctx, room);
    ctx.render();
    await Promise.all(lights.filter((l) => !l.off).map((l, i) => lightCall(ctx, l, !!p[2][i][0], p[2][i][1], p[2][i][2])));
  },
  "room-ha": (el, ev, ctx) => {
    const id = el.dataset.id;
    ctx.toast(ctx.t("{name} er sat i gang", { name: ctx.name(id) }));
    return ctx.call(id.split(".")[0], "turn_on", { entity_id: id });
  },
  "room-col": (el, ev, ctx) => {
    const room = meta(ctx, findRoom(ctx, el.dataset.room));
    const l = roomLights(ctx, room).find((x) => x.id === el.dataset.id);
    if (!l || l.off) return;
    const col = el.dataset.col;
    delete scenes[room.id];
    setOverride(l, { on: true, col });
    repaint(ctx, room);
    el.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === el)));
    el.closest(".rm-l, .ra-sheet")?.style.setProperty("--lc", col);
    return lightCall(ctx, l, true, null, col);
  },
  "room-toggle": (el, ev, ctx) => ctx.call("homeassistant", "toggle", { entity_id: el.dataset.id }),
  "room-media": (el, ev, ctx) => ctx.call("media_player", "media_play_pause", { entity_id: el.dataset.id }),
  "room-cover": (el, ev, ctx) => {
    const s = ctx.hass.states[el.dataset.id];
    return ctx.call("cover", s?.state === "open" || s?.state === "opening" ? "close_cover" : "open_cover", { entity_id: el.dataset.id });
  },
  "room-lock": (el, ev, ctx) => {
    const id = el.dataset.id, locked = ctx.hass.states[id]?.state === "locked";
    if (!locked) return ctx.call("lock", "lock", { entity_id: id });
    ctx.confirm(ctx.t("Lås {name} op?", { name: ctx.name(id) }), ctx.t("Døren låses op med det samme."), ctx.t("Lås op"), () => ctx.call("lock", "unlock", { entity_id: id }));
  },
  "room-temp": (el, ev, ctx) => {
    const id = el.dataset.id, cur = +ctx.hass.states[id]?.attributes?.temperature;
    if (isNaN(cur)) return;
    return ctx.call("climate", "set_temperature", { entity_id: id, temperature: Math.round((cur + +el.dataset.d) * 2) / 2 });
  },
};

const inputs = {
  "room-ent": (el, ev, ctx) => {
    if (ev.type !== "change") return;
    const raw = findRoom(ctx, el.dataset.room);
    if (!raw) return;
    const cur = roomCfg(ctx, raw, tune.scope), id = el.dataset.id;
    return setCfg(ctx, raw.id, (c) => ({ ...c, hide: el.checked ? cur.hide.filter((x) => x !== id) : [...new Set([...cur.hide, id])].slice(-80) }));
  },
  "room-search": (el, ev, ctx) => {
    tune.q = el.value;
    clearTimeout(tune.qT);
    tune.qT = setTimeout(() => {
      const at = el.selectionStart;
      redrawTune(ctx);
      const n = tune.s?.el?.querySelector('[data-in="room-search"]');
      if (n) {
        n.focus();
        try {
          n.setSelectionRange(at, at);
        } catch (err) {
          /* not a text field */
        }
      }
    }, 250);
  },
  "room-cfg": (el, ev, ctx) => {
    if (ev.type !== "change") return;
    const k = el.dataset.k, v = !!el.checked;
    return setCfg(ctx, el.dataset.room, (c) => (k === "pin" ? { ...c, pin: v } : { ...c, show: { ...(c.show || {}), [k.slice(5)]: v } }));
  },
  "room-name": (el, ev, ctx) => {
    if (ev.type !== "change") return;
    const id = el.dataset.id, v = el.value.trim().slice(0, 40);
    return setCfg(ctx, el.dataset.room, (c) => {
      const names = { ...(c.names || {}) };
      if (v) names[id] = v;
      else delete names[id];
      return { ...c, names };
    });
  },
  "room-bri": (el, ev, ctx) => {
    const room = meta(ctx, findRoom(ctx, el.dataset.room));
    const l = roomLights(ctx, room).find((x) => x.id === el.dataset.id);
    if (!l || l.off) return;
    const bri = +el.value;
    delete scenes[room.id];
    setOverride(l, { on: true, bri });
    const row = el.closest(".rm-l, .ra-sheet");
    if (row) {
      row.classList.add("on");
      row.querySelector(".rm-pct").textContent = row.classList.contains("ra-sheet") ? `${ctx.t("Tændt")} · ${bri} %` : `${bri} %`;
      row.querySelector(".rm-tg")?.setAttribute("aria-pressed", "true");
    }
    repaint(ctx, room);
    if (ev.type === "change") lightCall(ctx, l, true, bri, null);
  },
};

const views = {
  rum: {
    render: (ctx) => roomPage(ctx, ctx.arg),
    title: (ctx) => findRoom(ctx, ctx.arg)?.name || ctx.t("Rum"),
  },
  // The lights and their moods in the child's real room (opened from Mit værelse).
  mitlys: {
    kidOnly: true,
    module: "house",
    render(ctx) {
      const { t, esc, svg } = ctx;
      if (ctx.me && !ctx.feature(ctx.me, "room")) return `<section class="card"><h2>${esc(t("Værelset er slået fra"))}</h2><p class="t-sub">${esc(t("Far eller mor kan slå det til."))}</p></section>`;
      const r = (houseOf(ctx).rooms || []).find((x) => ctx.me && meta(ctx, x).kid === ctx.me.id);
      if (r) {
        const room = meta(ctx, r);
        return `<button class="back" data-go="vaerelse">${svg("back")}${esc(t("Mit værelse"))}</button>${lightsCard(ctx, room, roomLights(ctx, room), "s12")}`;
      }
      return `<section class="card hv-empty rm-none"><span class="rm-none-ic">${svg("room", "ic big")}</span><h2>${esc(t("Dit værelse er ikke sat op endnu"))}</h2><p class="t-sub">${esc(t("Bed far eller mor om at vælge dit værelse, når de tegner huset i Hverdagsro."))}</p></section>`;
    },
    title: (ctx) => ctx.t("Lys og stemning"),
  },
};

const css = `
.rp-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.rp-row { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto auto; justify-items: center; text-align: center; padding: 12px 8px 10px; gap: 6px; border-radius: 18px; }
.rp-row > div { min-width: 0; width: 100%; } .rp-row small { white-space: normal; }
.rp-ic { width: 46px; height: 46px; border-radius: 14px; } .rp-ic .ic { width: 24px; height: 24px; }
.ra-ap .ap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
.ra-placer { position: absolute; inset: 0; z-index: 4; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; padding: 14px; background: rgba(27,21,48,.18); cursor: crosshair; color: #fff; font-weight: 800; text-shadow: 0 1px 4px rgba(0,0,0,.5); }
.ra-hero.placing .rm-svg [data-act] { pointer-events: none; }
.ra-tn-row small { display: block; font-size: 10.5px; color: var(--muted); font-weight: 500; word-break: break-all; }
.ra-tn-add { position: relative; margin-top: 8px; } .ra-tn-add input { width: 100%; }
.ra-tn-hits { display: grid; gap: 4px; margin-top: 6px; }
.ra-tn-hits button { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; border: 0; border-radius: 12px; background: var(--surface-2); padding: 8px 10px; font: inherit; color: var(--ink); cursor: pointer; }
.ra-tn-hits button small { display: block; font-size: 10.5px; color: var(--muted); }
.ra-tn-lamp .iconbtn { width: 32px; height: 32px; }

.rp-grid { margin-bottom: 8px; }
.rm-mini { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0; padding: 0; overflow: hidden; border: 0; text-align: left; color: var(--ink); cursor: pointer; position: relative; transition: transform .25s cubic-bezier(.2,.9,.3,1.2), box-shadow .25s; }
.rm-mini:hover { transform: translateY(-3px); }
.rm-mini .rm-pic { border-radius: 0; box-shadow: none; display: block; }
.rm-mini-t { display: block; padding: 10px 40px 12px 14px; }
.rm-mini-t b { display: block; font-size: 15px; }
.rm-mini-t small { color: var(--muted); font-size: 12.5px; }
.rm-mini-go { position: absolute; right: 12px; bottom: 16px; width: 18px; height: 18px; color: var(--muted); }
.rm-l .rm-tg[disabled] { opacity: .45; }
.rm-step { display: inline-flex; gap: 4px; }
.rm-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.rm-f { display: grid; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--muted); }
.rm-f select { font: inherit; font-size: 14px; font-weight: 600; color: var(--ink); background: var(--surface-2); border: 1.5px solid var(--line); border-radius: 12px; padding: 8px 10px; width: 100%; }
.rm-photo { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 12px; align-items: center; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
.rm-photo img, .rm-ph { width: 76px; height: 56px; border-radius: 12px; object-fit: cover; background: var(--surface-2); display: grid; place-items: center; color: var(--muted); }
.rm-photo b { display: block; font-size: 14px; } .rm-photo small { display: block; color: var(--muted); font-size: 12px; margin: 2px 0 8px; }
.rm-pbtns { display: flex; gap: 6px; flex-wrap: wrap; } .rm-pbtns label { cursor: pointer; }
.rm-ph .ic { width: 24px; height: 24px; }
.rm-edit .lnk { display: inline-flex; align-items: center; gap: 5px; font-weight: 700; }
.rm-edit .lnk .ic { width: 14px; height: 14px; }
.rm-none-ic { width: 76px; height: 76px; border-radius: 26px; display: grid; place-items: center; background: color-mix(in srgb, var(--violet) 12%, var(--surface)); animation: rmbob 5s ease-in-out infinite; }
.v-vaerelse .rp-head { margin-top: 0; }
@media (prefers-reduced-motion: reduce) { .rm-mini:hover { transform: none; } }
/* the room page, layout A: the picture first */
.ra { display: grid; gap: 14px; grid-template-columns: minmax(0, 1fr); margin-bottom: 8px; }
@media (min-width: 900px) { .ra { grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr); align-items: start; } .ra-groups { grid-column: 1 / -1; } }
.ra-main, .ra-side { display: grid; gap: 12px; min-width: 0; align-content: start; }
.ra-hero { position: relative; border-radius: 26px; overflow: hidden; background: #2A2440; box-shadow: var(--shadow); }
.ra-hero .rm-svg { display: block; width: 100%; height: auto; }
.ra-hero::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 48%; background: linear-gradient(to top, rgba(12, 10, 28, .7), transparent); pointer-events: none; }
.ra-back, .ra-tune { position: absolute; top: 12px; z-index: 2; min-height: 44px; border: 0; border-radius: 999px; background: rgba(27, 21, 48, .55); color: #fff; font: inherit; font-size: 14px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.ra-back { left: 12px; padding: 0 14px 0 8px; }
.ra-tune { right: 12px; width: 44px; justify-content: center; }
.ra-back .ic, .ra-tune .ic { width: 20px; height: 20px; }
.ra-cap { position: absolute; left: 16px; right: 16px; bottom: 14px; z-index: 2; display: flex; justify-content: space-between; align-items: flex-end; gap: 10px; color: #fff; pointer-events: none; }
.ra-cap span { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; opacity: .9; }
.ra-cap h2 { margin: 0; font-size: clamp(24px, 4vw, 34px); font-weight: 800; letter-spacing: -.02em; line-height: 1.1; }
.ra-cap em { font-style: normal; font-size: 13px; font-weight: 700; padding: 6px 10px; border-radius: 999px; background: rgba(27, 21, 48, .55); white-space: nowrap; }
.ra-flat { position: relative; padding: 68px 16px 16px; border-radius: 26px; background: color-mix(in srgb, var(--pc) 80%, #1B1530); }
.ra-flat .ra-cap { position: static; }
.ra-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 2px; margin: 0 -2px; }
.ra-chips::-webkit-scrollbar { display: none; }
.ra-chip { flex: none; min-height: 44px; padding: 0 16px; border-radius: 999px; border: 0; background: var(--surface); color: var(--ink); font: inherit; font-size: 14px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: inset 0 0 0 1.5px var(--line); }
.ra-chip[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--pc, var(--violet)); background: color-mix(in srgb, var(--pc, var(--violet)) 10%, var(--surface)); }
.ra-chip.off { background: var(--ink); color: var(--surface); box-shadow: none; }
.ra-chip .ic { width: 16px; height: 16px; }
.ra-chip svg path[fill="currentColor"] { color: #F5B000; }
.ra-hint { margin: 0; color: var(--muted); font-size: 13px; }
.ra-sheet { display: grid; gap: 14px; }
.ra-sh-top { display: flex; align-items: center; gap: 12px; }
.ra-sh-ic { width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); flex: none; transition: background .3s, box-shadow .3s; }
.ra-sh-ic .ic { width: 22px; height: 22px; }
.ra-sheet.on .ra-sh-ic { background: var(--lc); color: #3A2A10; box-shadow: 0 0 22px color-mix(in srgb, var(--lc) 70%, transparent); }
.ra-sh-t { flex: 1; min-width: 0; }
.ra-sh-t b { display: block; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ra-sh-t small { color: var(--muted); font-size: 13px; }
.ra-bri { display: grid; gap: 6px; font-size: 12px; font-weight: 700; color: var(--muted); }
.ra-bri input { width: 100%; accent-color: var(--pc, var(--violet)); min-height: 28px; }
.ra-cols { display: flex; flex-wrap: wrap; gap: 10px; }
.ra-cols button { width: 34px; height: 34px; }
.ra-sh-tg { min-width: 84px; }
.ra-all { min-height: 44px; border: 0; background: none; padding: 0 2px; font: inherit; font-size: 14px; font-weight: 700; color: var(--violet); display: inline-flex; align-items: center; gap: 4px; cursor: pointer; justify-self: start; }
.ra-all .ic { width: 16px; height: 16px; transition: transform .2s; }
.ra-all[aria-expanded="true"] .ic { transform: rotate(90deg); }
.ra-list { display: grid; gap: 6px; }
.ra-li { display: grid; grid-template-columns: 12px minmax(0, 1fr) auto; gap: 10px; align-items: center; min-height: 48px; padding: 0 14px; border-radius: 14px; border: 0; background: var(--surface); font: inherit; color: var(--ink); text-align: left; cursor: pointer; box-shadow: inset 0 0 0 1.5px var(--line); }
.ra-li b { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ra-li small { color: var(--muted); font-size: 12.5px; }
.ra-li i { width: 10px; height: 10px; border-radius: 9px; background: var(--line); }
.ra-li.on i { background: var(--lc); box-shadow: 0 0 8px var(--lc); }
.ra-li.cur { box-shadow: inset 0 0 0 2px var(--pc, var(--violet)); }
.ra-groups { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.ra-group .card-head h2 { display: inline-flex; align-items: center; gap: 8px; }
.ra-group .card-head h2 .ic { width: 18px; height: 18px; color: var(--muted); }
.ra-tn { display: grid; gap: 12px; }
.ra-tn h2 { margin: 0; }
.ra-tn .t-sub { margin: 0; }
.ra-scope { display: flex; background: var(--surface-2); border-radius: 999px; padding: 4px; }
.ra-scope button { flex: 1; min-height: 40px; border-radius: 999px; border: 0; background: transparent; font: inherit; font-weight: 700; font-size: 13px; color: var(--ink); cursor: pointer; }
.ra-scope button[aria-pressed="true"] { background: var(--ink); color: var(--surface); }
.ra-tn-list { display: grid; }
.ra-tn-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 50px; border-bottom: 1px solid var(--line); font-weight: 700; cursor: pointer; }
.ra-tn-row input { width: 22px; height: 22px; accent-color: var(--violet); flex: none; }
.ra-tn-pin { border: 0; background: var(--surface-2); border-radius: 14px; padding: 0 14px; }
.ra-tn-h { font-size: 14px; margin-top: 4px; }
.ra-tn-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ra-tn-chips .ra-chip { min-height: 38px; }
.ra-tn-chips .ra-chip.fav { background: var(--ink); color: var(--surface); box-shadow: none; }
.ra-tn-lamps { display: grid; gap: 8px; }
.ra-tn-lamp { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; gap: 10px; align-items: center; }
.ra-tn-lamp i { width: 10px; height: 10px; border-radius: 9px; background: var(--lc); }
.ra-tn-lamp input { font: inherit; font-size: 14px; font-weight: 600; min-width: 0; border: 1.5px solid var(--line); border-radius: 10px; padding: 8px 10px; background: var(--surface); color: var(--ink); }
.ra-tn-lamp.hid { opacity: .55; }
.ra-pin-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.ra-pin-grid .rm-pic { max-height: 180px; overflow: hidden; }
@media (max-width: 600px) { .ra-hero, .ra-flat { border-radius: 22px; } .ra-cap em { display: none; } }
`;

const en = {
  "Ting på siden": "Things on the page", "Sæt flueben ved det, der skal være på siden. Søg for at hente mere fra Home Assistant.": "Tick what should be on the page. Search to add more from Home Assistant.", "Søg efter en ting i Home Assistant …": "Search for a thing in Home Assistant …", "Placér i billedet": "Place in the picture", "Tryk der, hvor {name} skal sidde": "Tap where {name} should go", Apparater: "Appliances",
  "Værelset er håndtegnet.": "The room is hand-drawn.",
  Loftlampe: "Ceiling light", "Scenerne er Hverdagsros egne, og lyskilderne er dem, der står i rummet i Husbyggeren.": "The scenes are Hverdagsro's own, and the light sources are the ones placed in the room in the House builder.",
  "Scenerne er Hverdagsros egne, og lyset er rummets lys i Home Assistant.": "The scenes are Hverdagsro's own, and the lights are the room's lights in Home Assistant.", "Scenerne i Home Assistant ligger til sidst.": "The scenes from Home Assistant come last.",
  "{names} er utilgængelig i HA i dag.": "{names} is unavailable in HA today.", " og ": " and ", "Ingen entitet": "No entity",
  "Der er ikke koblet lys til rummet. Sæt lyskilder i rummet i Husbyggeren, eller vælg rummets område i Home Assistant.": "No lights are linked to the room. Place light sources in the room in the House builder, or choose the room's area in Home Assistant.",
  "Til Huset": "To the House", "område {name}": "area {name}", "Redigér rummet": "Edit the room", "På tegningen": "On the drawing", "{n} møbler": "{n} pieces of furniture",
  "Der er ikke sat enheder i rummet endnu. Det gøres i Husbyggeren.": "No devices have been placed in the room yet. That's done in the House builder.", "Billedet er jeres eget.": "The picture is your own.",
  "Billedet er tegnet ud fra rumtypen, alder og stil.": "The picture is drawn from the room type, age and style.", "Billedet er tegnet ud fra rumtypen.": "The picture is drawn from the room type.",
  "Lamperne i billedet er lyskilderne, I har sat i rummet i Husbyggeren.": "The lamps in the picture are the light sources you placed in the room in the House builder.", "Værelset er slået fra": "The room is turned off", "Far eller mor kan slå det til.": "Dad or Mum can turn it on.",
  Børneværelse: "Child's room", Soveværelse: "Bedroom", Gæsteværelse: "Guest room", Kontor: "Office", Stue: "Living room", Køkken: "Kitchen", Badeværelse: "Bathroom", "Lille bad": "Small bathroom", Toilet: "Toilet", Bryggers: "Utility room", "Entré og gang": "Hall", "Walk-in": "Walk-in closet", Garage: "Garage", "Andet rum": "Other room", Rum: "Room",
  Baby: "Baby", Tumling: "Toddler", Barn: "Child", "Stort barn": "Big child", Preteen: "Preteen", Teenager: "Teenager", Ung: "Young adult", "0–1 år": "0–1 years", "1–3 år": "1–3 years", "4–7 år": "4–7 years", "8–10 år": "8–10 years", "11–12 år": "11–12 years", "13–16 år": "13–16 years", "17+ år": "17+ years",
  Neutral: "Neutral", Pige: "Girl", Dreng: "Boy",
  Klar: "Bright", Hygge: "Cosy", Dæmpet: "Dimmed", Godnat: "Good night", Film: "Movie",
  Lys: "Lights", "{n} af {total} lys tændt": "{n} of {total} lights on", "Alt er slukket": "Everything is off", "Ingen lys i rummet": "No lights in the room", "Tryk på en lampe": "Tap a lamp", "Sluk alt": "All off",
  "Svarer ikke": "Not responding", Slukket: "Off", "Lysstyrke {name}": "Brightness {name}", Farve: "Colour",
  "Der er ikke koblet noget lys til værelset endnu.": "No lights are linked to your room yet.",
  "Der er ikke koblet lys til rummet. Vælg rummets område i Home Assistant herunder, eller sæt lyskilder i rummet i Husbyggeren.": "No lights are linked to the room. Choose the room's Home Assistant area below, or place lights in the room in the House builder.",
  Pause: "Pause", Afspil: "Play", Spiller: "Playing", Ledig: "Idle", "På pause": "Paused", Tændt: "On", "Henter …": "Loading …", Åben: "Open", Lukket: "Closed", "Bevægelse nu": "Motion now", Rolig: "Quiet", "Røg!": "Smoke!", OK: "OK", "Vand!": "Water!", Tør: "Dry", Låst: "Locked", Ulåst: "Unlocked", "Tænd {name}": "Turn on {name}", Koldere: "Cooler", Varmere: "Warmer", Luk: "Close", Åbn: "Open", "Tænd eller sluk {name}": "Turn {name} on or off", "Lås op": "Unlock", Lås: "Lock",
  Rummet: "The room", "Redigér i Husbyggeren": "Edit in the House builder", "Intet område": "No area", Ingen: "None", Rumtype: "Room type", Alder: "Age", Stil: "Style", "Område i Home Assistant": "Home Assistant area",
  "Rummets eget billede": "The room's own photo", "Tegnet ud fra rumtypen": "Drawn from the room type", "Læg et billede af rummet ind. Lyset lægges ovenpå.": "Add a photo of the room. The light is laid on top.", "Skift billede": "Change photo", "Læg billede ind": "Add photo", Fjern: "Remove",
  "Rummet findes ikke længere": "The room no longer exists", Tilbage: "Back", Huset: "House", Hjem: "Home", "Lægger billedet op …": "Uploading the photo …", "I rummet": "In the room", "{n} ting": "{n} things",
  "Der er ikke andet i rummet i Home Assistant.": "There is nothing else in the room in Home Assistant.", "Vælg rummets område i Home Assistant for at se, hvad der står i det.": "Choose the room's Home Assistant area to see what is in it.",
  "Billedet er jeres eget. Lyset i billedet følger lamperne i rummet.": "The photo is your own. The light in the picture follows the lamps in the room.",
  "Billedet er tegnet ud fra rumtypen, alder og stil. Lyset følger lamperne i rummet, og vinduet følger solen og vejret.": "The picture is drawn from the room type, age and style. The light follows the lamps in the room, and the window follows the sun and the weather.",
  "Billedet er tegnet ud fra rumtypen. Lyset følger lamperne i rummet, og vinduet følger solen og vejret.": "The picture is drawn from the room type. The light follows the lamps in the room, and the window follows the sun and the weather.",
  "{name} er sat i gang": "{name} has started", "Lås {name} op?": "Unlock {name}?", "Døren låses op med det samme.": "The door is unlocked right away.",
  "Billedet er for stort": "The photo is too large", "Billed-upload er ikke slået til i Home Assistant": "Image upload is not enabled in Home Assistant", "Billedet er lagt ind": "The photo has been added", "Billedet kunne ikke lægges op: {error}": "The photo could not be uploaded: {error}",
  "Billede af rummet": "Picture of the room", Stemninger: "Moods", Klima: "Climate", "Musik og TV": "Music and TV", "Døre, vinduer og kamera": "Doors, windows and camera", "Andet i rummet": "Other things in the room",
  "Tilpas rummet": "Customise the room", "For hele familien": "For the whole family", "Kun for mig": "Only for me", "Det, du vælger her, gælder for alle i familien, som ikke har valgt selv.": "What you choose here applies to everyone in the family who hasn't chosen for themselves.",
  "Det, du vælger her, gælder kun for dig.": "What you choose here only applies to you.", "Brug familiens igen": "Use the family's again", Favoritstemninger: "Favourite moods", Lamper: "Lamps", "Navn på {name}": "Name of {name}", Vis: "Show", Skjul: "Hide",
  "Vis på forsiden": "Show on the front page", "Billede, type og område": "Picture, type and area", Færdig: "Done", Sluk: "Turn off", Tænd: "Turn on", Lysstyrke: "Brightness",
  "Tryk på en lampe i billedet, eller vælg en stemning.": "Tap a lamp in the picture, or pick a mood.", "Alle {n} lamper i rummet": "All {n} lamps in the room",
  "Tryk på knappen øverst til højre for at vælge, hvad siden viser.": "Use the button at the top right to choose what the page shows.",
  "Dit værelse er ikke sat op endnu": "Your room isn't set up yet", "Bed far eller mor om at vælge dit værelse, når de tegner huset i Hverdagsro.": "Ask a parent to pick your room when they draw the house in Hverdagsro.", "Mit værelse": "My room",
};

export default { id: "rooms", views, acts, inputs, css, en };
