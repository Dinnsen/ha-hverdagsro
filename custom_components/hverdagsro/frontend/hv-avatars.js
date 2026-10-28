/* Hverdagsro – the avatar catalog drawn: 548 hair styles and beards, 1,552 pieces of clothes, 647 hats, 664 masks and
   glasses, 193 ear accessories, the face parts (eyes, brows, noses, mouths, blush, freckles, wrinkles, scars) and the
   32 expressions of the original's character creator. The names, kinds and colours are in hv-avatars-data.js (made by
   tools/homedesigner/build_avatars.py); everything is drawn here with our own shapes, from the numbers and kinds.
   A figure (me) can have: hs (hair style: "S004" short, "L011" long, "C014" crazy), bd (beard "B012"), cl (clothes:
   a number in AV.cl), ht (hat), mk (mask or glasses), er (ear accessory), fe fb fn fm fh ff fw fs (the variant of its
   eyes, brows, nose, mouth, blush, freckles, wrinkles, scar) and the old fields (skin, hairc, top, bottom …). */
import { OL, S, shade } from "./hv-playcat.js";
import { AV } from "./hv-avatars-data.js";

export { AV };
const s = (o) => S(o);
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
const num = (id) => parseInt(String(id).replace(/\D/g, ""), 10) || 0;
const hashOf = (str) => [...String(str)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
const RAINBOW = ["#E5484D", "#FF8A3C", "#FFD93D", "#6BCB77", "#4D96FF", "#9B5DE5", "#F15BB5"];

/* ------------------------------------------------------------------ hair and beards */
const blob = (d, c, o = "") => `<path d="${d}" fill="${c}" ${s(o)}/>`;
const CAP = (top, c) => blob(`M-60 -196 C-60 ${top} 60 ${top} 60 -196 C40 -216 20 -208 0 -218 C-20 -208 -40 -216 -60 -196Z`, c);
/* Short hair: 12 shapes, each in 21 variations. */
function shortHair(n, c) {
  const fam = n % 12, v = Math.floor(n / 12) % 21, side = v & 1 ? 1 : -1, lift = (v % 3) * 8, top = -284 - lift;
  const streak = v % 4 === 3 ? `<path d="M${side * 10} ${top + 20} q${side * 14} 24 ${side * 6} 46" fill="none" stroke="${shade(c, 1.35)}" stroke-width="7" stroke-linecap="round"/>` : "";
  const front = [
    () => CAP(top + 10, c),
    () => `${CAP(top + 6, c)}${blob(`M${-side * 20} -250 q${side * 56} -8 ${side * 74} 60 q${-side * 6} -36 ${-side * 40} -40 q${-side * 20} -4 ${-side * 34} -20z`, c)}`,
    () => `${CAP(top + 6, c)}${blob(`M-34 -258 q34 -64 78 -14 q-8 22 -34 18 q-20 -16 -44 -4z`, c)}`,
    () => blob(`M-60 -196 L-68 ${top + 30} -44 ${top + 50} -38 ${top + 6} -14 ${top + 40} 2 ${top - 8} 18 ${top + 40} 42 ${top + 4} 46 ${top + 50} 68 ${top + 30} 60 -196 C30 -214 -30 -214 -60 -196Z`, c),
    () => `${CAP(top + 24, c)}${rep(7, (i) => `<circle cx="${-48 + i * 16}" cy="${-246 - lift * 0.5 - (i % 2) * 10}" r="${16 + (i % 3) * 2}" fill="${c}" ${s()}/>`)}`,
    () => blob(`M-64 -188 C-64 ${top + 8} 64 ${top + 8} 64 -188 L64 -208 L-64 -208Z`, c) + blob("M-62 -206 H62 V-214 H-62Z", shade(c, 0.9), 'stroke-width="3"'),
    () => `${CAP(top + 12, c)}${blob(`M${-side * 56} -214 q${side * 70} -34 ${side * 112} 34 q${-side * 50} -22 ${-side * 112} -4z`, c)}`,
    () => ({ back: `<circle cx="0" cy="-238" r="${84 + lift / 2}" fill="${c}" ${s()}/>`, front: CAP(top + 30, c) }),
    () => blob(`M-14 -196 L-20 ${top - 6} 0 ${top - 22} 20 ${top - 6} 14 -196Z`, c) + blob("M-60 -200 C-58 -224 -40 -214 -34 -200 L-60 -196Z", shade(c, 0.85), 'stroke-width="3"') + blob("M60 -200 C58 -224 40 -214 34 -200 L60 -196Z", shade(c, 0.85), 'stroke-width="3"'),
    () => blob(`M-60 -196 C-60 ${top + 4} 60 ${top + 4} 60 -196 C54 -226 20 -240 -10 -226 C-34 -218 -50 -212 -60 -196Z`, c),
    () => blob(`M-58 -204 C-58 ${top + 26} 58 ${top + 26} 58 -204 C40 -220 -40 -220 -58 -204Z`, c) + rep(9, (i) => `<circle cx="${-40 + i * 10}" cy="${-232 - (i % 3) * 5}" r="1.6" fill="${shade(c, 0.7)}"/>`),
    () => blob(`M-62 -196 L-70 ${top + 36} -50 ${top + 24} -44 ${top + 54} -22 ${top + 20} -8 ${top + 52} 12 ${top + 14} 30 ${top + 50} 50 ${top + 22} 70 ${top + 40} 62 -196 C30 -222 -30 -222 -62 -196Z`, c),
  ][fam]();
  return typeof front === "string" ? { back: "", front: front + streak } : { back: front.back, front: front.front + streak };
}
/* Long hair: 10 shapes. */
function longHair(n, c) {
  const fam = n % 10, v = Math.floor(n / 10) % 22, side = v & 1 ? 1 : -1, top = -286 + (v % 3) * -6;
  const cap = blob(`M-62 -196 C-62 ${top} 62 ${top} 62 -196 C30 -226 -10 -228 -62 -196Z`, c);
  const fringe = blob(`M-62 -196 C-62 ${top} 62 ${top} 62 -196 C40 -214 10 -226 ${side * 4} -204 C-10 -226 -40 -210 -62 -196Z`, c);
  const curtain = (w, len, wave = 0) => blob(`M${-w} -196 C${-w - 8} -140 ${-w + 4} ${-96 + len} ${-w + 14} ${-90 + len} ${wave ? `q${w * 0.5} ${wave} ${w} 0 t${w} 0` : `L${w - 14} ${-90 + len}`} C${w - 4} ${-96 + len} ${w + 8} -140 ${w} -196Z`, c);
  return [
    () => ({ back: curtain(64, 20), front: fringe }),
    () => ({ back: curtain(66, 14, 14), front: fringe }),
    () => ({ back: rep(6, (i) => `<circle cx="${i < 3 ? -58 + i * 4 : 58 - (i - 3) * 4}" cy="${-170 + (i % 3) * 38}" r="26" fill="${c}" ${s()}/>`), front: cap }),
    () => ({ back: curtain(64, 0), front: `${cap}${blob(`M-62 -196 q40 -40 110 10 q-50 -4 -110 -10z`, c)}` }),
    () => ({ back: blob("M50 -236 C100 -236 108 -170 82 -128 C76 -166 66 -190 46 -204Z", c), front: `${cap}<circle cx="52" cy="-228" r="9" fill="#FF6B6B" ${s('stroke-width="3"')}/>` }),
    () => ({ back: blob("M52 -176 C104 -170 100 -112 76 -86 C74 -124 64 -150 48 -160Z", c), front: `${cap}<circle cx="56" cy="-170" r="8" fill="#FFD93D" ${s('stroke-width="3"')}/>` }),
    () => ({ back: blob("M-52 -236 C-104 -236 -104 -180 -82 -150 C-78 -184 -66 -204 -46 -214Z", c) + blob("M52 -236 C104 -236 104 -180 82 -150 C78 -184 66 -204 46 -214Z", c), front: `${cap}<circle cx="-54" cy="-218" r="8" fill="#F15BB5" ${s('stroke-width="3"')}/><circle cx="54" cy="-218" r="8" fill="#F15BB5" ${s('stroke-width="3"')}/>` }),
    () => ({ back: `<path d="M${-side * 56} -190 q${-side * 18} 60 ${-side * 6} 112 q${side * 4} 30 ${side * 14} 14" fill="none" stroke="${OL}" stroke-width="24" stroke-linecap="round"/><path d="M${-side * 56} -190 q${-side * 18} 60 ${-side * 6} 112 q${side * 4} 30 ${side * 14} 14" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round"/>`, front: cap }),
    () => ({ back: [-1, 1].map((k) => `<path d="M${k * 58} -190 q${k * 14} 50 ${k * 6} 90" fill="none" stroke="${OL}" stroke-width="20" stroke-linecap="round"/><path d="M${k * 58} -190 q${k * 14} 50 ${k * 6} 90" fill="none" stroke="${c}" stroke-width="13" stroke-linecap="round"/>`).join(""), front: fringe }),
    () => ({ back: curtain(62, -10), front: `${cap}<circle cx="0" cy="-272" r="22" fill="${c}" ${s()}/>` }),
  ][fam]();
}
/* Crazy hair: eight wild shapes, in colours. */
function crazyHair(n, c) {
  const fam = n % 8, v = Math.floor(n / 8), col = [c, RAINBOW[v % 7], RAINBOW[(v + 3) % 7], shade(c, 1.2)][v % 4];
  return [
    () => ({ back: `<circle cx="0" cy="-232" r="104" fill="${col}" ${s()}/>`, front: "" }),
    () => ({ back: "", front: rep(7, (i) => blob(`M${-48 + i * 16} -240 l8 -${40 + (i % 3) * 14} 8 40z`, RAINBOW[i])) + blob("M-60 -196 C-60 -250 60 -250 60 -196 C30 -222 -30 -222 -60 -196Z", col) }),
    () => ({ back: "", front: blob("M-60 -196 C-60 -250 60 -250 60 -196 C30 -222 -30 -222 -60 -196Z", col) + blob("M-30 -246 Q-26 -330 4 -350 Q34 -330 30 -246Z", col) + blob("M-24 -290 q28 -10 50 0 M-26 -316 q28 -10 54 0", "none", 'stroke-width="4"') }),
    () => ({ back: `<circle cx="-70" cy="-250" r="34" fill="${col}" ${s()}/><circle cx="70" cy="-250" r="34" fill="${col}" ${s()}/>`, front: blob("M-60 -196 C-60 -270 60 -270 60 -196 C30 -222 -30 -222 -60 -196Z", col) }),
    () => ({ back: "", front: blob("M-60 -196 C-60 -270 60 -270 60 -196 C30 -222 -30 -222 -60 -196Z", col) + blob("M-46 -252 q-34 -44 -4 -70 q0 30 24 52z", col) + blob("M46 -252 q34 -44 4 -70 q0 30 -24 52z", col) }),
    () => ({ back: rep(8, (i) => `<circle cx="${-84 + i * 24}" cy="${-250 - Math.sin(i) * 14}" r="30" fill="${i % 2 ? col : shade(col, 1.15)}" ${s()}/>`), front: blob("M-60 -196 C-60 -262 60 -262 60 -196 C30 -222 -30 -222 -60 -196Z", col) }),
    () => ({ back: "", front: blob("M-62 -196 L-80 -250 -40 -234 -52 -296 -10 -246 8 -314 24 -246 62 -290 52 -230 82 -246 62 -196 C30 -220 -30 -220 -62 -196Z", col) }),
    () => ({ back: "", front: blob("M-60 -196 C-60 -262 60 -262 60 -196 C30 -222 -30 -222 -60 -196Z", col) + rep(5, (i) => `<path d="M0 -250 q${-60 + i * 30} -80 ${-80 + i * 40} -40" fill="none" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M0 -250 q${-60 + i * 30} -80 ${-80 + i * 40} -40" fill="none" stroke="${RAINBOW[i + 1]}" stroke-width="7" stroke-linecap="round"/>`) }),
  ][fam]();
}
/* The hair of a figure: { back, front } for an id like "S004", "L011" or "C014". */
export function hairOf(id, c) {
  const k = String(id)[0], n = num(id);
  if (k === "S") return shortHair(n, c);
  if (k === "L") return longHair(n, c);
  if (k === "C") return crazyHair(n, c);
  return { back: "", front: "" };
}
/* Beards: eight shapes ("B012"). */
export function beardOf(id, c) {
  const n = num(id), fam = n % 8, v = Math.floor(n / 8), len = (v % 3) * 8;
  return [
    () => rep(14, (i) => `<circle cx="${-30 + i * 4.6}" cy="${-140 + (i % 3) * 5}" r="1.6" fill="${shade(c, 0.8)}"/>`),
    () => blob(`M-14 -146 Q0 ${-122 + len} 14 -146 Q0 -138 -14 -146Z`, c, 'stroke-width="3"'),
    () => blob(`M-58 -174 Q-62 ${-110 + len} 0 ${-106 + len} Q62 ${-110 + len} 58 -174 Q50 -144 24 -144 Q0 -156 -24 -144 Q-50 -144 -58 -174Z`, c),
    () => blob("M-26 -150 Q-12 -160 0 -152 Q12 -160 26 -150 Q12 -142 0 -146 Q-12 -142 -26 -150Z", c, 'stroke-width="3"'),
    () => blob("M-34 -148 Q-18 -164 0 -152 Q18 -164 34 -148 Q40 -160 36 -170 Q30 -150 0 -144 Q-30 -150 -36 -170 Q-40 -160 -34 -148Z", c, 'stroke-width="3"'),
    () => `<path d="M-58 -178 Q-56 -126 0 -122 Q56 -126 58 -178" fill="none" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M-58 -178 Q-56 -126 0 -122 Q56 -126 58 -178" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
    () => blob("M-60 -190 L-52 -140 -38 -150 -38 -190Z", c, 'stroke-width="3"') + blob("M60 -190 L52 -140 38 -150 38 -190Z", c, 'stroke-width="3"'),
    () => blob("M-5 -142 h10 v12 h-10z", c, 'stroke-width="2.5"'),
  ][fam]();
}

/* ------------------------------------------------------------------ clothes */
const hexOK = (x) => (/^#[0-9a-f]{6}$/i.test(x || "") ? x : "#4D96FF");
const KIND = { kjole: "kjole", tshirt: "tshirt", sweater: "sweater", skjorte: "skjorte", jakke: "jakke", costume: "costume", sport: "sport", hoodie: "hoodie", overalls: "overalls", cardigan: "cardigan", swim: "swim", suit: "suit", towel: "towel", puffer: "puffer", coat: "coat", robe: "robe", onesie: "onesie", uniform: "uniform", vest: "vest", pyjamas: "pyjamas", regnfrakke: "regnfrakke", traeningsdragt: "traeningsdragt" };
/* The clothes of a figure (me.cl: a number in AV.cl) into the fields the avatar already knows: top, bottom, kinds and pattern. */
export function dress(me) {
  const it = me.cl != null && me.cl >= 0 ? AV.cl[me.cl] : null;
  if (!it) return me;
  const [, , , top, c1, c2, pat, bot] = it;
  const topk = KIND[top] || "tshirt";
  return { ...me, topk, top: hexOK(c1), bottom: hexOK(["swim", "onesie", "puffer"].includes(topk) ? c1 : c2), botk: (topk === "swim" ? "shorts" : topk === "onesie" ? "leggings" : bot || "bukser"), pat, _long: ["kjole", "coat", "robe", "towel"].includes(topk) };
}
export const longTop = (tk) => ["kjole", "coat", "robe", "towel"].includes(tk);
export const newTop = (tk) => ["sweater", "coat", "suit", "swim", "robe", "towel", "onesie", "puffer", "uniform", "costume", "vest"].includes(tk);
/* The body of the new kinds of tops. */
export function bodyOf(tk, top, c2, sit, sk) {
  const ln = sit ? 80 : 100, lt = shade(top, 1.2), dk = shade(top, 0.8);
  switch (tk) {
    case "sweater":
      return `<path d="M-44 -134 h88 l6 70 h-100z" fill="${top}" ${s()}/><path d="M-30 -134 q30 20 60 0" fill="none" ${s()}/><path d="M-48 -72 h96 v10 h-96z" fill="${dk}" ${s('stroke-width="3"')}/>${rep(4, (i) => `<path d="M${-30 + i * 20} -126 v50" stroke="${dk}" stroke-width="2.5" opacity=".5"/>`)}`;
    case "coat":
      return `<path d="M-44 -134 h88 l16 ${ln + 6} h-120z" fill="${top}" ${s()}/><path d="M-14 -134 L0 -100 L14 -134 M0 -100 V${-34 + (sit ? 0 : 6)}" fill="none" ${s('stroke-width="3"')}/>${[-100, -76, -52].map((y) => `<circle cx="8" cy="${y}" r="3.5" fill="${dk}"/>`).join("")}<path d="M-44 -134 L-16 -118 L-8 -134 M44 -134 L16 -118 L8 -134" fill="${lt}" ${s('stroke-width="3"')}/>`;
    case "suit":
      return `<path d="M-44 -134 h88 l6 70 h-100z" fill="${top}" ${s()}/><path d="M-14 -134 L0 -90 L14 -134Z" fill="#fff" ${s('stroke-width="3"')}/><path d="M0 -128 l-7 14 7 38 7 -38z" fill="#E5484D" ${s('stroke-width="3"')}/><path d="M-44 -134 L-14 -128 L0 -70 M44 -134 L14 -128 L0 -70" fill="${lt}" ${s('stroke-width="3"')}/>${[-90, -76].map((y) => `<circle cx="-4" cy="${y}" r="2.5" fill="${dk}"/>`).join("")}`;
    case "swim":
      return `<path d="M-30 -134 h60 l8 66 h-76z" fill="${top}" ${s()}/><path d="M-44 -134 h14 v20 h-14z M30 -134 h14 v20 h-14z" fill="${sk}" ${s('stroke-width="3"')}/><path d="M-30 -106 h60" stroke="${lt}" stroke-width="5"/>`;
    case "robe":
      return `<path d="M-44 -134 h88 l16 ${ln} h-120z" fill="${top}" ${s()}/><path d="M-30 -134 L0 -90 L30 -134" fill="${lt}" ${s('stroke-width="3"')}/><path d="M-46 -92 h92" stroke="${dk}" stroke-width="9" stroke-linecap="round"/><path d="M6 -92 q10 24 4 40 M-6 -92 q-10 24 -4 40" fill="none" stroke="${dk}" stroke-width="5"/>`;
    case "towel":
      return `<path d="M-46 -128 h92 l14 ${ln - 4} h-120z" fill="${top}" ${s()}/>${[-108, -90, -72, -54].map((y) => `<path d="M-48 ${y} h96" stroke="${c2 && c2 !== top ? c2 : shade(top, 0.85)}" stroke-width="5" opacity=".8"/>`).join("")}<path d="M14 -128 q14 10 4 24" fill="none" ${s('stroke-width="3"')}/>`;
    case "onesie":
      return `<path d="M-44 -134 h88 l6 70 h-100z" fill="${top}" ${s()}/><path d="M-26 -134 q26 22 52 0" fill="${lt}" ${s('stroke-width="3"')}/><path d="M0 -118 V-66" ${s('stroke-width="3"')}/>${rep(3, (i) => `<circle cx="0" cy="${-110 + i * 16}" r="3.2" fill="${dk}"/>`)}<circle cx="-24" cy="-92" r="8" fill="${lt}" ${s('stroke-width="3"')}/>`;
    case "puffer":
      return `<path d="M-46 -134 h92 l6 70 h-104z" fill="${top}" ${s()}/>${[-112, -92, -72].map((y) => `<path d="M-48 ${y} q48 10 96 0" fill="none" stroke="${dk}" stroke-width="4"/>`).join("")}<path d="M-26 -134 q26 16 52 0" fill="${lt}" ${s('stroke-width="3"')}/><path d="M0 -122 V-66" ${s('stroke-width="3"')}/>`;
    case "uniform":
      return `<path d="M-44 -134 h88 l6 70 h-100z" fill="${top}" ${s()}/><path d="M-22 -134 L0 -108 L22 -134" fill="#fff" ${s('stroke-width="3"')}/><rect x="14" y="-106" width="18" height="12" rx="3" fill="${c2 && c2 !== top ? c2 : "#FFD93D"}" ${s('stroke-width="2.5"')}/><path d="M-44 -76 h88" stroke="${dk}" stroke-width="5"/>${[-96, -80].map((y) => `<circle cx="-10" cy="${y}" r="2.6" fill="${dk}"/>`).join("")}`;
    case "costume":
      return `<path d="M-44 -134 h88 l6 70 h-100z" fill="${top}" ${s()}/><path d="M0 -124 l10 20 22 3 -16 14 5 22 -21 -11 -21 11 5 -22 -16 -14 22 -3z" fill="${c2 && c2 !== top ? c2 : "#FFD93D"}" ${s('stroke-width="3"')}/><path d="M-44 -76 h88" stroke="${dk}" stroke-width="5"/>`;
    case "vest":
      return `<path d="M-44 -134 h88 l6 70 h-100z" fill="#fff" ${s()}/><path d="M-34 -134 h68 l4 70 h-76z" fill="${top}" ${s()}/><path d="M0 -134 V-66" ${s('stroke-width="3"')}/>${[-100, -84].map((y) => `<circle cx="-8" cy="${y}" r="2.6" fill="${dk}"/>`).join("")}`;
    default:
      return null;
  }
}
/* What the sleeves of the new tops are made of: the colour of the top, or bare skin. */
export const sleeveOf = (tk, top, sk) => (["swim", "towel", "vest"].includes(tk) ? sk : ["sweater", "coat", "suit", "robe", "onesie", "puffer", "uniform", "costume"].includes(tk) ? top : null);
/* A pattern on the torso: stripes, dots, plaid, flowers, camo, stars, hearts, rainbow, leopard, zebra. */
export function patternOf(pat, top, id, long, sit) {
  if (!pat) return "";
  const ln = sit ? 80 : 100, lt = shade(top, 1.35), dk = shade(top, 0.7);
  const clip = long ? `M-46 -134 h92 l16 ${ln} h-124z` : "M-44 -134 h88 l6 70 h-100z";
  const marks = {
    stripes: rep(6, (i) => `<rect x="-60" y="${-130 + i * 16}" width="120" height="7" fill="${lt}" opacity=".8"/>`),
    dots: rep(18, (i) => `<circle cx="${-36 + (i % 6) * 14 + (Math.floor(i / 6) % 2) * 7}" cy="${-122 + Math.floor(i / 6) * 22}" r="4" fill="${lt}" opacity=".85"/>`),
    plaid: rep(6, (i) => `<rect x="${-56 + i * 20}" y="-140" width="7" height="140" fill="${dk}" opacity=".35"/><rect x="-60" y="${-132 + i * 18}" width="120" height="6" fill="${dk}" opacity=".35"/>`),
    flowers: rep(9, (i) => `<g transform="translate(${-32 + (i % 3) * 32} ${-116 + Math.floor(i / 3) * 24})"><circle r="3" fill="#FFD93D"/>${rep(5, (j) => `<circle cx="${Math.cos(j * 1.256) * 6}" cy="${Math.sin(j * 1.256) * 6}" r="3.2" fill="#fff" opacity=".9"/>`)}</g>`),
    camo: rep(8, (i) => `<ellipse cx="${-34 + (i % 4) * 22}" cy="${-118 + Math.floor(i / 4) * 30}" rx="${12 + (i % 3) * 3}" ry="8" fill="${i % 2 ? dk : shade(top, 1.2)}" opacity=".7"/>`),
    stars: rep(8, (i) => `<path transform="translate(${-30 + (i % 4) * 20} ${-116 + Math.floor(i / 4) * 30}) scale(.55)" d="M0 -9 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#FFF6C9"/>`),
    hearts: rep(8, (i) => `<path transform="translate(${-30 + (i % 4) * 20} ${-114 + Math.floor(i / 4) * 30}) scale(.7)" d="M0 8 C-12 -2 -8 -10 -3 -9 C-1 -9 0 -7 0 -6 C0 -7 1 -9 3 -9 C8 -10 12 -2 0 8z" fill="#FFB3C7"/>`),
    rainbow: RAINBOW.map((c, i) => `<rect x="-60" y="${-134 + i * 10}" width="120" height="10" fill="${c}" opacity=".85"/>`).join(""),
    leopard: rep(10, (i) => `<ellipse cx="${-36 + (i % 5) * 18}" cy="${-120 + Math.floor(i / 5) * 28}" rx="6" ry="4" fill="none" stroke="${dk}" stroke-width="3" transform="rotate(${i * 20} 0 0)"/>`),
    zebra: rep(7, (i) => `<path d="M${-54 + i * 17} -134 q8 30 -6 70" fill="none" stroke="${OL}" stroke-width="6" opacity=".8"/>`),
  }[pat];
  return marks ? `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})" pointer-events="none">${marks}</g>` : "";
}

/* ------------------------------------------------------------------ hats */
const hv = (it) => ({ c1: hexOK(it[4]), c2: it[5] ? hexOK(it[5]) : shade(hexOK(it[4]), 0.78), seed: hashOf(it[0]), fam: it[3] });
const HATS = {
  cap: (c) => `${blob("M-60 -206 C-58 -268 58 -268 60 -206Z", c.c1)}${blob("M24 -210 h72 q8 8 -4 14 h-68z", c.c2)}<circle cx="0" cy="-262" r="5" fill="${c.c2}"/>`,
  beanie: (c) => `${blob("M-62 -204 C-66 -282 66 -282 62 -204Z", c.c1)}${blob("M-66 -222 h132 v24 h-132z", c.c2)}${rep(6, (i) => `<path d="M${-54 + i * 22} -220 v20" stroke="${c.c1}" stroke-width="3" opacity=".6"/>`)}${c.seed & 1 ? `<circle cx="0" cy="-282" r="14" fill="#fff" ${s()}/>` : ""}`,
  helmet: (c) => `${blob("M-68 -184 C-74 -294 74 -294 68 -184 L-68 -184Z", c.c1)}<path d="M-68 -222 H68" stroke="${OL}" stroke-width="4"/>${blob("M-34 -258 q34 -14 68 0 l-6 30 h-56z", c.c2, 'stroke-width="3"')}`,
  crown: (c) => blob("M-38 -236 l8 -34 14 22 8 -30 8 30 14 -22 8 34z", c.c1 === "#FFFFFF" ? "#FFD93D" : c.c1) + `<circle cx="0" cy="-262" r="5" fill="${c.c2}"/>`,
  headband: (c) => `<path d="M-58 -210 Q0 -268 58 -210" fill="none" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><path d="M-58 -210 Q0 -268 58 -210" fill="none" stroke="${c.c1}" stroke-width="8" stroke-linecap="round"/>`,
  bow: (c) => `${blob("M26 -240 l-26 -16 v32z M26 -240 l26 -16 v32z", c.c1, 'stroke-width="3.5"')}<circle cx="26" cy="-240" r="7" fill="${c.c2}" ${s('stroke-width="3"')}/>`,
  hood: (c) => `${blob("M-76 -150 C-84 -260 84 -260 76 -150 L60 -176 C60 -230 -60 -230 -60 -176Z", c.c1)}<path d="M-60 -176 C-60 -232 60 -232 60 -176" fill="none" stroke="${c.c2}" stroke-width="5"/>`,
  wig: (c) => rep(9, (i) => `<circle cx="${-64 + i * 16}" cy="${-244 - Math.sin(i * 0.7) * 22}" r="26" fill="${c.c1}" ${s()}/>`),
  horns: (c) => `${blob("M-46 -236 q-20 -44 -2 -62 q10 26 20 54z", c.c1)}${blob("M46 -236 q20 -44 2 -62 q-10 26 -20 54z", c.c1)}`,
  ears: (c) => `${blob(c.seed % 3 ? "M-54 -234 l-20 -50 44 22z" : "M-60 -238 a22 22 0 1 1 40 -14z", c.c1)}${blob(c.seed % 3 ? "M54 -234 l20 -50 -44 22z" : "M60 -238 a22 22 0 1 0 -40 -14z", c.c1)}<path d="M-52 -246 l-10 -22 18 10z M52 -246 l10 -22 -18 10z" fill="#FFB3C7"/>`,
  flower: (c) => rep(7, (i) => `<g transform="translate(${-52 + i * 17} ${-232 - Math.sin(i / 6 * Math.PI) * 28})"><circle r="9" fill="${RAINBOW[(i + c.seed) % 7]}" ${s('stroke-width="2.5"')}/><circle r="3.4" fill="#FFD93D"/></g>`),
  party: (c) => `${blob("M-26 -240 L0 -318 26 -240Z", c.c1)}${rep(3, (i) => `<path d="M${-18 + i * 4} ${-262 + i * 8} h${36 - i * 8}" stroke="${c.c2}" stroke-width="5"/>`)}<circle cx="0" cy="-318" r="9" fill="${c.c2}" ${s('stroke-width="3"')}/>`,
  bucket: (c) => `${blob("M-52 -210 C-50 -262 50 -262 52 -210Z", c.c1)}${blob("M-82 -204 q82 -22 164 0 q-2 14 -26 8 q-56 -8 -112 0 q-24 6 -26 -8z", c.c2)}`,
  cowboy: (c) => `${blob("M-44 -212 C-46 -270 -22 -276 0 -268 C22 -276 46 -270 44 -212Z", c.c1)}${blob("M-96 -204 q48 -20 96 -2 q48 -18 96 2 q-6 14 -26 6 q-70 -14 -140 0 q-20 8 -26 -6z", c.c2)}`,
  chef: (c) => `${rep(4, (i) => `<circle cx="${-44 + i * 29}" cy="${-262 - (i % 2) * 10}" r="28" fill="#fff" ${s()}/>`)}${blob("M-54 -212 h108 v-24 h-108z", "#fff")}`,
  witch: (c) => `${blob("M-28 -230 Q-8 -280 14 -330 Q30 -290 28 -230Z", c.c1)}${blob("M-84 -226 q84 -16 168 0 q-10 14 -34 6 q-50 -10 -100 0 q-24 8 -34 -6z", c.c1)}<rect x="-24" y="-250" width="48" height="12" fill="${c.c2}" ${s('stroke-width="3"')}/>`,
  sunhat: (c) => `${blob("M-48 -216 C-46 -268 46 -268 48 -216Z", c.c1)}<ellipse cx="0" cy="-214" rx="96" ry="16" fill="${c.c1}" ${s()}/><path d="M-48 -224 h96" stroke="${c.c2}" stroke-width="9"/>`,
  tophat: (c) => `${blob("M-34 -224 V-322 H34 V-224Z", c.c1)}<path d="M-34 -246 H34" stroke="${c.c2}" stroke-width="12"/>${blob("M-62 -224 h124 q4 12 -8 12 h-108 q-12 0 -8 -12z", c.c1)}`,
  pirate: (c) => `${blob("M-82 -216 L-30 -274 30 -274 82 -216 Q0 -240 -82 -216Z", "#2B2340")}<circle cx="0" cy="-246" r="9" fill="#fff"/><path d="M-5 -241 h10 M-3 -236 v4 M3 -236 v4" stroke="#2B2340" stroke-width="2"/>`,
  santa: (c) => `${blob("M-60 -212 Q-50 -290 28 -300 Q60 -296 66 -256 Q72 -232 66 -212Z", "#E5484D")}${blob("M-66 -222 h132 v22 h-132z", "#fff")}<circle cx="64" cy="-276" r="14" fill="#fff" ${s()}/>`,
  halo: () => `<ellipse cx="0" cy="-272" rx="40" ry="10" fill="none" stroke="${OL}" stroke-width="12"/><ellipse cx="0" cy="-272" rx="40" ry="10" fill="none" stroke="#FFD93D" stroke-width="6"/>`,
  beret: (c) => `${blob("M-62 -214 C-70 -262 40 -278 70 -236 C60 -218 -20 -204 -62 -214Z", c.c1)}<circle cx="6" cy="-262" r="5" fill="${c.c2}"/>`,
  hat: (c) => [HATS.cap, HATS.bucket, HATS.beanie, HATS.beret, HATS.sunhat][c.seed % 5](c),
};
export const hatOf = (i) => {
  const it = AV.hat[i];
  if (!it) return "";
  const c = hv(it);
  return (HATS[c.fam] || HATS.hat)(c);
};
export const hatBehind = (i) => (["hood", "wig", "ears"].includes(AV.hat[i]?.[3]) ? hatOf(i) : "");

/* ------------------------------------------------------------------ masks, glasses and ear accessories */
const rim = (cx, r, c, sw = 4) => `<circle cx="${cx}" cy="-178" r="${r}" fill="#fff" fill-opacity=".2" stroke="${c}" stroke-width="${sw}"/>`;
const MASKS = {
  glasses: (c) => {
    const k = c.seed % 5, f = c.c1 === "#FFFFFF" ? OL : c.c1;
    const lens = (x) => [rim(x, 14, f), `<rect x="${x - 15}" y="-192" width="30" height="24" rx="6" fill="#fff" fill-opacity=".2" stroke="${f}" stroke-width="4"/>`, `<path d="M${x - 16} -186 q16 -14 32 0 q0 18 -16 20 q-16 -2 -16 -20z" fill="#fff" fill-opacity=".2" stroke="${f}" stroke-width="4"/>`, `<path d="M${x} -166 c-20 -12 -16 -26 -6 -26 c4 0 6 3 6 5 c0 -2 2 -5 6 -5 c10 0 14 14 -6 26z" fill="#fff" fill-opacity=".25" stroke="${f}" stroke-width="3.5"/>`, `<path d="M${x} -194 l4 9 10 1 -8 7 2 10 -8 -5 -8 5 2 -10 -8 -7 10 -1z" fill="#fff" fill-opacity=".25" stroke="${f}" stroke-width="3"/>`][k];
    return `${lens(-22)}${lens(22)}<path d="M-8 -178 h16" stroke="${f}" stroke-width="4"/>`;
  },
  sunglasses: (c) => `<path d="M-42 -190 h34 q2 20 -16 22 q-18 -2 -18 -22z M8 -190 h34 q0 20 -18 22 q-18 -2 -16 -22z" fill="${c.c1 === "#FFFFFF" ? "#1B1530" : shade(c.c1, 0.45)}" ${s('stroke-width="3"')}/><path d="M-8 -186 h16" ${s('stroke-width="3"')}/><path d="M-38 -186 l12 -2 M12 -186 l12 -2" stroke="#fff" stroke-width="3" opacity=".6"/>`,
  monocle: (c) => `${rim(22, 17, "#E9C46A", 4)}<path d="M38 -168 q14 22 8 50" fill="none" stroke="#E9C46A" stroke-width="2.5"/>`,
  goggles: (c) => `<path d="M-64 -184 h128" stroke="${OL}" stroke-width="14"/><path d="M-64 -184 h128" stroke="${c.c1}" stroke-width="8"/>${[-24, 24].map((x) => `<circle cx="${x}" cy="-180" r="20" fill="#CFEFFF" fill-opacity=".55" stroke="${OL}" stroke-width="5"/><circle cx="${x}" cy="-180" r="14" fill="none" stroke="${c.c2}" stroke-width="4"/>`).join("")}`,
  eyepatch: (c) => `<path d="M-60 -218 L36 -168" stroke="${OL}" stroke-width="5"/><ellipse cx="-22" cy="-180" rx="19" ry="17" fill="#1B1530" ${s('stroke-width="3"')}/>`,
  facepaint: (c) => [
    () => rep(3, (i) => `<path d="M${-58 + i * 6} ${-168 + i * 8} h-12 M${58 - i * 6} ${-168 + i * 8} h12" stroke="${c.c1}" stroke-width="5" stroke-linecap="round"/>`),
    () => `<path transform="translate(-40 -158) scale(.8)" d="M0 -9 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="${c.c1}" ${s('stroke-width="2"')}/><path transform="translate(40 -158) scale(.8)" d="M0 -9 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="${c.c2}" ${s('stroke-width="2"')}/>`,
    () => `<path d="M-60 -160 h-26 M-60 -150 l-24 8 M60 -160 h26 M60 -150 l24 8" stroke="${OL}" stroke-width="3"/><circle cx="0" cy="-166" r="6" fill="${c.c1}" ${s('stroke-width="2.5"')}/>`,
    () => `<path d="M-40 -150 c-14 -10 -10 -20 -4 -20 c2 0 4 2 4 3 c0 -1 2 -3 4 -3 c6 0 10 10 -4 20z M40 -150 c-14 -10 -10 -20 -4 -20 c2 0 4 2 4 3 c0 -1 2 -3 4 -3 c6 0 10 10 -4 20z" fill="${c.c1}" ${s('stroke-width="2.5"')}/>`,
  ][c.seed % 4](),
  facemask: (c) => `<path d="M-42 -172 H42 Q44 -134 0 -130 Q-44 -134 -42 -172Z" fill="${c.c1}" ${s('stroke-width="3.5"')}/>${[-160, -148].map((y) => `<path d="M-40 ${y} H40" stroke="${shade(c.c1, 0.8)}" stroke-width="2.5"/>`).join("")}<path d="M-42 -170 q-14 -4 -20 -10 M42 -170 q14 -4 20 -10" fill="none" stroke="${OL}" stroke-width="3"/>`,
  helmet: (c) => `${blob("M-72 -150 C-82 -296 82 -296 72 -150 Q60 -126 0 -126 Q-60 -126 -72 -150Z", c.c1)}<path d="M-54 -214 Q0 -230 54 -214 Q60 -150 0 -146 Q-60 -150 -54 -214Z" fill="#CFEFFF" fill-opacity=".28" ${s('stroke-width="4"')}/><path d="M-40 -200 q20 -10 40 -4" stroke="#fff" stroke-width="5" opacity=".7" fill="none"/>`,
  hood: (c) => HATS.hood(c),
  mustache: (c) => blob("M-30 -150 Q-14 -164 0 -152 Q14 -164 30 -150 Q14 -142 0 -146 Q-14 -142 -30 -150Z", shade(c.c1, 0.6), 'stroke-width="3"'),
  clownnose: (c) => `<circle cx="0" cy="-166" r="11" fill="${c.c1 === "#FFFFFF" ? "#E5484D" : c.c1}" ${s('stroke-width="3"')}/><circle cx="-3" cy="-169" r="3" fill="#fff" opacity=".6"/>`,
  mask: (c) => (c.seed % 10 < 7 ? MASKS.glasses(c) : MASKS.mask2(c)),
  mask2: (c) => `<path d="M-52 -184 Q-26 -204 0 -190 Q26 -204 52 -184 Q46 -158 22 -160 Q8 -166 0 -176 Q-8 -166 -22 -160 Q-46 -158 -52 -184Z" fill="${c.c1}" ${s('stroke-width="3"')}/><ellipse cx="-22" cy="-180" rx="8" ry="6" fill="#fff"/><ellipse cx="22" cy="-180" rx="8" ry="6" fill="#fff"/>`,
};
export const maskOf = (i) => {
  const it = AV.mask[i];
  if (!it) return "";
  const c = hv(it);
  return (MASKS[c.fam] || MASKS.mask)(c);
};
export const maskBehind = (i) => (AV.mask[i]?.[3] === "hood" ? maskOf(i) : "");
const EARS = {
  stud: (c, k) => `<circle cx="${k * 60}" cy="-166" r="4" fill="${c.c1}" ${s('stroke-width="2"')}/>`,
  hoop: (c, k) => `<circle cx="${k * 62}" cy="-156" r="10" fill="none" stroke="${c.c1}" stroke-width="4"/>`,
  dangle: (c, k) => `<path d="M${k * 60} -166 v14" stroke="${c.c1}" stroke-width="2.5"/><path d="M${k * 60} -152 l-5 10 5 8 5 -8z" fill="${c.c2 || c.c1}" ${s('stroke-width="2"')}/>`,
  pearl: (c, k) => `<circle cx="${k * 60}" cy="-165" r="5.5" fill="#fff" ${s('stroke-width="2"')}/>`,
  hearing: (c, k) => `<path d="M${k * 66} -190 q${k * 14} 30 ${k * 2} 52" fill="none" stroke="#E8C69A" stroke-width="9" stroke-linecap="round"/><path d="M${k * 66} -190 q${k * 14} 30 ${k * 2} 52" fill="none" stroke="${OL}" stroke-width="2"/>`,
  bud: (c, k) => `<circle cx="${k * 58}" cy="-176" r="6" fill="#fff" ${s('stroke-width="2.5"')}/><path d="M${k * 58} -170 v18" stroke="#fff" stroke-width="5"/><path d="M${k * 58} -170 v18" stroke="${OL}" stroke-width="1.5"/>`,
  cuff: (c, k) => `<path d="M${k * 64} -190 q${k * 14} 10 ${k * 4} 26" fill="none" stroke="${c.c1}" stroke-width="5" stroke-linecap="round"/>`,
  charm: (c, k) => `<path d="M${k * 60} -166 v8" stroke="${c.c1}" stroke-width="2"/><path transform="translate(${k * 60} -150) scale(.7)" d="M0 -9 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="${c.c1}" ${s('stroke-width="2.5"')}/>`,
};
export const earOf = (i) => {
  const it = AV.ear[i];
  if (!it) return "";
  const c = hv(it);
  const f = EARS[c.fam] || EARS.stud;
  return f(c, -1) + f(c, 1);
};

/* ------------------------------------------------------------------ the face: eyes, brows, noses, mouths and more */
const rn = (n, k, m = 1) => Math.floor(n / m) % k;
export function eyesOf(n, ec) {
  const fam = n % 8, sz = [0.9, 1, 1.12][rn(n, 3, 8)], sp = [20, 22, 25][rn(n, 3, 24)];
  const e = (x, side) => [
    `<ellipse cx="${x}" cy="-180" rx="${7 * sz}" ry="${9 * sz}" fill="${ec}"/><circle cx="${x + 3}" cy="-184" r="2.6" fill="#fff"/>`,
    `<ellipse cx="${x}" cy="-180" rx="${9 * sz}" ry="${11 * sz}" fill="${ec}"/><circle cx="${x + 3}" cy="-185" r="3.4" fill="#fff"/><circle cx="${x - 3}" cy="-175" r="1.8" fill="#fff"/>`,
    `<path d="M${x - 10 * sz} -178 Q${x} ${-194 * 1} ${x + 10 * sz} -178 Q${x} -166 ${x - 10 * sz} -178Z" fill="${ec}"/><circle cx="${x + 2}" cy="-181" r="2.2" fill="#fff"/>`,
    `<ellipse cx="${x}" cy="-180" rx="${10 * sz}" ry="${7 * sz}" fill="${ec}"/><circle cx="${x + 3}" cy="-183" r="2.4" fill="#fff"/>`,
    `<circle cx="${x}" cy="-180" r="${5 * sz}" fill="${ec}"/>`,
    `<ellipse cx="${x}" cy="-180" rx="${7 * sz}" ry="${9 * sz}" fill="${ec}"/><circle cx="${x + 3}" cy="-184" r="2.6" fill="#fff"/><path d="M${x + side * 7} -188 l${side * 7} -5 M${x + side * 8} -183 l${side * 8} -2" stroke="${OL}" stroke-width="2.5" stroke-linecap="round"/>`,
    `<ellipse cx="${x}" cy="-178" rx="${7 * sz}" ry="${8 * sz}" fill="${ec}"/><path d="M${x - 9} -184 h18" stroke="${OL}" stroke-width="3.5" stroke-linecap="round"/>`,
    `<ellipse cx="${x}" cy="-180" rx="${8 * sz}" ry="${10 * sz}" fill="${ec}"/><path d="M${x + 4} -190 l2 4 4 1 -4 2 -2 4 -2 -4 -4 -2 4 -1z" fill="#fff"/>`,
  ][fam];
  return e(-sp, -1) + e(sp, 1);
}
export function browsOf(n) {
  const fam = n % 7, w = [3.5, 5, 7][rn(n, 3, 7)], sp = [22, 25, 28][rn(n, 3, 21)];
  const b = (k) => [
    `M${k * (sp - 14)} -198 h${k * 28}`, `M${k * (sp - 14)} -196 q${k * 14} -12 ${k * 28} 0`, `M${k * (sp - 14)} -204 l${k * 28} 8`, `M${k * (sp - 14)} -194 l${k * 28} -8`,
    `M${k * (sp - 14)} -198 q${k * 14} -4 ${k * 28} -2`, `M${k * (sp - 14)} -200 h${k * 28}`, k < 0 ? `M${k * (sp - 14)} -196 q${k * 14} -12 ${k * 28} 0` : `M${k * (sp - 14)} -196 h${k * 28}`,
  ][fam];
  return `<path d="${b(-1)} ${b(1)}" fill="none" stroke="${OL}" stroke-width="${w}" stroke-linecap="round"/>`;
}
export function noseOf(n, sk) {
  const fam = n % 6, k = [0.9, 1, 1.15][rn(n, 3, 6)], d = shade(sk, 0.78);
  return [
    `<ellipse cx="0" cy="-168" rx="${3 * k}" ry="${2.4 * k}" fill="${d}"/>`, `<path d="M0 -176 l${-6 * k} 12 ${12 * k} 0z" fill="${shade(sk, 0.9)}" stroke="${d}" stroke-width="2"/>`, `<circle cx="0" cy="-166" r="${5 * k}" fill="${shade(sk, 0.92)}" stroke="${d}" stroke-width="2"/>`,
    `<path d="M0 -180 v${14 * k} q${5 * k} 4 ${-2} 4" fill="none" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`, `<path d="M${-9 * k} -166 q${9 * k} 8 ${18 * k} 0" fill="none" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`, `<path d="M0 -178 q${-6 * k} 10 ${-3 * k} 14 q${6 * k} 2 ${6 * k} -2" fill="none" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`,
  ][fam];
}
export function mouthOf(n) {
  const fam = n % 8, w = [12, 14, 17][rn(n, 3, 8)];
  return [
    `<path d="M${-w} -156 Q0 -142 ${w} -156" fill="#fff" ${s('stroke-width="3.5"')}/>`, `<path d="M${-w - 4} -158 Q0 -132 ${w + 4} -158Z" fill="#fff" ${s('stroke-width="3.5"')}/>`, `<path d="M${-w / 2} -154 Q0 -148 ${w / 2} -154" fill="none" ${s('stroke-width="3.5"')}/>`,
    `<path d="M${-w} -152 Q${-w / 3} -146 ${w} -158" fill="none" ${s('stroke-width="3.5"')}/>`, `<path d="M${-w} -158 Q0 -136 ${w} -158Z" fill="#fff" ${s('stroke-width="3.5"')}/><path d="M-2 -150 h4 v7 h-4z" fill="#FF6B8A"/>`,
    `<ellipse cx="0" cy="-150" rx="${w / 3}" ry="${w / 3.4}" fill="#FF8FA3" ${s('stroke-width="3"')}/>`, `<path d="M${-w} -154 q${w / 2} 8 ${w} 0 q${w / 2} 8 ${w} 0" fill="none" ${s('stroke-width="3.5"')}/>`, `<path d="M${-w} -152 h${2 * w}" ${s('stroke-width="3.5"')}/>`,
  ][fam];
}
export const blushOf = (n, c = "#FF8FA3") => [
  `<circle cx="-36" cy="-158" r="9" fill="${c}" opacity=".6"/><circle cx="36" cy="-158" r="9" fill="${c}" opacity=".6"/>`,
  `<ellipse cx="-38" cy="-158" rx="12" ry="7" fill="${c}" opacity=".55"/><ellipse cx="38" cy="-158" rx="12" ry="7" fill="${c}" opacity=".55"/>`,
  `<path d="M-46 -160 l8 -6 M-38 -158 l8 -6 M46 -160 l-8 -6 M38 -158 l-8 -6" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  `<path transform="translate(-38 -158) scale(.7)" d="M0 8 C-12 -2 -8 -10 -3 -9 C-1 -9 0 -7 0 -6 C0 -7 1 -9 3 -9 C8 -10 12 -2 0 8z" fill="${c}"/><path transform="translate(38 -158) scale(.7)" d="M0 8 C-12 -2 -8 -10 -3 -9 C-1 -9 0 -7 0 -6 C0 -7 1 -9 3 -9 C8 -10 12 -2 0 8z" fill="${c}"/>`,
  `<circle cx="-38" cy="-158" r="12" fill="${c}" opacity=".28"/><circle cx="38" cy="-158" r="12" fill="${c}" opacity=".28"/><circle cx="-38" cy="-158" r="6" fill="${c}" opacity=".5"/><circle cx="38" cy="-158" r="6" fill="${c}" opacity=".5"/>`,
][n % 5];
export const frecklesOf = (n, c = "#A9764C") => rep(5 + (n % 4), (i) => `<circle cx="${(i % 2 ? 1 : -1) * (8 + (i * 7 + n) % 22)}" cy="${-168 + ((i * 5 + n) % 9)}" r="1.9" fill="${c}"/>`);
export const wrinklesOf = (n) => [
  `<path d="M-52 -184 q-6 4 -4 10 M52 -184 q6 4 4 10" fill="none" stroke="${OL}" stroke-width="2" opacity=".5"/>`, `<path d="M-30 -214 q30 -8 60 0 M-26 -222 q26 -6 52 0" fill="none" stroke="${OL}" stroke-width="2" opacity=".45"/>`,
  `<path d="M-24 -150 q-6 6 -2 14 M24 -150 q6 6 2 14" fill="none" stroke="${OL}" stroke-width="2" opacity=".5"/>`, `<path d="M-46 -164 q4 6 0 12 M46 -164 q-4 6 0 12" fill="none" stroke="${OL}" stroke-width="2" opacity=".5"/>`,
  `<path d="M-40 -194 l-8 -2 M-40 -188 l-10 2 M40 -194 l8 -2 M40 -188 l10 2" stroke="${OL}" stroke-width="2" opacity=".45"/>`,
][n % 5];
export const scarOf = (n) => [`<path d="M-34 -204 l16 24 M-28 -204 l-2 6 M-24 -194 l-2 6" fill="none" stroke="#B3504E" stroke-width="3" stroke-linecap="round"/>`, `<path d="M22 -170 l18 -8 M26 -176 l2 10 M34 -180 l2 8" fill="none" stroke="#B3504E" stroke-width="3" stroke-linecap="round"/>`, `<path d="M-6 -222 l12 -4" stroke="#B3504E" stroke-width="4" stroke-linecap="round"/>`][n % 3];

/* ------------------------------------------------------------------ the 32 expressions */
export const EXPRS = AV.expr.map(([id]) => id);
const EYE = (ec) => `<ellipse cx="-22" cy="-180" rx="7" ry="9" fill="${ec}"/><ellipse cx="22" cy="-180" rx="7" ry="9" fill="${ec}"/><circle cx="-19" cy="-184" r="2.6" fill="#fff"/><circle cx="25" cy="-184" r="2.6" fill="#fff"/>`;
const ARC = (up = 1) => `<path d="M-30 -178 q8 ${-10 * up} 16 0 M14 -178 q8 ${-10 * up} 16 0" fill="none" ${s('stroke-width="4"')}/>`;
const CLOSED = `<path d="M-30 -180 q8 6 16 0 M14 -180 q8 6 16 0" fill="none" ${s('stroke-width="3.5"')}/>`;
const BROW = (a, b) => `<path d="M-34 ${-196 + a} l22 ${b - a} M34 ${-196 + a} l-22 ${b - a}" fill="none" ${s('stroke-width="4.5"')}/>`;
const TEAR = (x) => `<path d="M${x} -166 q-6 10 0 14 q6 -4 0 -14z" fill="#9FD4FF" ${s('stroke-width="2"')}/>`;
const SMILE = `<path d="M-14 -156 Q0 -142 14 -156" fill="#fff" ${s('stroke-width="3.5"')}/>`;
const OPEN = (w, h, tongue) => `<ellipse cx="0" cy="-148" rx="${w}" ry="${h}" fill="#7B2D3B" ${s('stroke-width="3.5"')}/>${tongue ? `<ellipse cx="0" cy="${-148 + h * 0.5}" rx="${w * 0.6}" ry="${h * 0.45}" fill="#FF8FA3"/>` : ""}`;
const HEART = (x, y, c = "#FF6B8A", k = 1) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 8 C-12 -2 -8 -10 -3 -9 C-1 -9 0 -7 0 -6 C0 -7 1 -9 3 -9 C8 -10 12 -2 0 8z" fill="${c}" ${s('stroke-width="2.5"')}/>`;
const SWEAT = (x, y) => `<path d="M${x} ${y} q-7 10 0 16 q7 -6 0 -16z" fill="#9FD4FF" ${s('stroke-width="2"')}/>`;
const STAR = (x, y, k = 1, c = "#FFD93D") => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -9 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="${c}" ${s('stroke-width="2.5"')}/>`;
/* The face for an expression id ("happy" …): { eyes, brows, mouth, extra } for a figure with the eye colour ec. */
export function expression(id, ec) {
  const E = EYE(ec), nb = "";
  const x = {
    neutral: [E, nb, `<path d="M-10 -152 h20" ${s()}/>`, ""], happy: [ARC(), nb, `<path d="M-18 -158 Q0 -134 18 -158Z" fill="#fff" ${s('stroke-width="3.5"')}/>`, ""],
    surprised: [`<circle cx="-22" cy="-180" r="11" fill="#fff" ${s('stroke-width="3"')}/><circle cx="22" cy="-180" r="11" fill="#fff" ${s('stroke-width="3"')}/><circle cx="-22" cy="-180" r="4.5" fill="${ec}"/><circle cx="22" cy="-180" r="4.5" fill="${ec}"/>`, BROW(-14, -22), OPEN(9, 12), ""],
    sleepy: [`<path d="M-30 -178 q8 6 16 0 M14 -178 q8 6 16 0" fill="none" ${s('stroke-width="3.5"')}/>`, "", `<ellipse cx="0" cy="-150" rx="6" ry="4" fill="#7B2D3B" ${s('stroke-width="3"')}/>`, `<text x="46" y="-226" class="pl-zzz" font-size="22" font-weight="900" fill="${OL}">z</text>`],
    blink: [CLOSED, "", SMILE, ""], sick: [`<path d="M-30 -186 l16 12 M-14 -186 l-16 12 M14 -186 l16 12 M30 -186 l-16 12" stroke="${OL}" stroke-width="3.5" stroke-linecap="round"/>`, BROW(-4, -10), `<path d="M-14 -150 q4 -8 7 0 q4 8 7 0 q4 -8 7 0" fill="none" ${s('stroke-width="3.5"')}/>`, `<ellipse cx="0" cy="-168" rx="48" ry="38" fill="#9ED36A" opacity=".28"/>`],
    angry: [E, BROW(-8, 2), `<path d="M-14 -146 Q0 -158 14 -146" fill="none" ${s('stroke-width="4"')}/>`, `<ellipse cx="-36" cy="-160" rx="10" ry="7" fill="#E5484D" opacity=".35"/><ellipse cx="36" cy="-160" rx="10" ry="7" fill="#E5484D" opacity=".35"/>`],
    rage: [E, `<path d="M-38 -208 l26 12 M38 -208 l-26 12" fill="none" ${s('stroke-width="6"')}/>`, `<path d="M-18 -158 L-12 -146 -6 -158 0 -146 6 -158 12 -146 18 -158Z" fill="#fff" ${s('stroke-width="3.5"')}/>`, `<ellipse cx="0" cy="-168" rx="52" ry="40" fill="#E5484D" opacity=".38"/><path d="M-52 -230 q-8 -18 4 -30 M52 -230 q8 -18 -4 -30" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`],
    sad: [E, `<path d="M-34 -196 l22 -8 M34 -196 l-22 -8" fill="none" ${s('stroke-width="4.5"')}/>`, `<path d="M-14 -146 Q0 -158 14 -146" fill="none" ${s('stroke-width="3.5"')}/>`, TEAR(-26)],
    sob: [CLOSED, `<path d="M-34 -196 l22 -8 M34 -196 l-22 -8" fill="none" ${s('stroke-width="4.5"')}/>`, OPEN(12, 10), `<path d="M-26 -172 q-8 20 -4 36 M26 -172 q8 20 4 36" fill="none" stroke="#9FD4FF" stroke-width="7" stroke-linecap="round"/>`],
    scream: [`<circle cx="-22" cy="-182" r="10" fill="#fff" ${s('stroke-width="3"')}/><circle cx="22" cy="-182" r="10" fill="#fff" ${s('stroke-width="3"')}/><circle cx="-22" cy="-182" r="3" fill="${ec}"/><circle cx="22" cy="-182" r="3" fill="${ec}"/>`, BROW(-16, -24), OPEN(16, 20, true), SWEAT(60, -190)],
    laughter: [ARC(), nb, `<path d="M-20 -160 Q0 -128 20 -160Z" fill="#7B2D3B" ${s('stroke-width="3.5"')}/><path d="M-12 -150 Q0 -142 12 -150" fill="#FF8FA3"/>`, `<path d="M-40 -170 q-4 10 -2 16 M40 -170 q4 10 2 16" fill="none" stroke="#9FD4FF" stroke-width="5" stroke-linecap="round"/>`],
    celebrate: [ARC(), "", `<path d="M-18 -158 Q0 -134 18 -158Z" fill="#fff" ${s('stroke-width="3.5"')}/>`, `${STAR(-70, -240, 1.2)}${STAR(72, -236, 1, "#F15BB5")}${STAR(60, -270, 0.8, "#4D96FF")}`],
    hyper: [`<circle cx="-22" cy="-180" r="12" fill="${ec}"/><circle cx="22" cy="-180" r="12" fill="${ec}"/><circle cx="-18" cy="-185" r="4" fill="#fff"/><circle cx="26" cy="-185" r="4" fill="#fff"/>`, BROW(-14, -22), `<path d="M-22 -160 Q0 -124 22 -160Z" fill="#fff" ${s('stroke-width="3.5"')}/>`, `${SWEAT(58, -196)}${STAR(-66, -236, 0.9)}`],
    confused: [E, `<path d="M-34 -196 l22 -4 M34 -206 l-22 6" fill="none" ${s('stroke-width="4.5"')}/>`, `<path d="M-14 -152 q7 -8 14 0 q7 8 14 0" fill="none" ${s('stroke-width="3.5"')}/>`, `<text x="52" y="-226" font-size="34" font-weight="900" fill="${OL}">?</text>`],
    creepy: [`<circle cx="-22" cy="-180" r="11" fill="#fff" ${s('stroke-width="3"')}/><circle cx="22" cy="-180" r="11" fill="#fff" ${s('stroke-width="3"')}/><circle cx="-22" cy="-180" r="3" fill="${OL}"/><circle cx="22" cy="-180" r="3" fill="${OL}"/>`, BROW(-10, -2), `<path d="M-24 -156 Q0 -134 24 -156 Q0 -146 -24 -156Z" fill="#fff" ${s('stroke-width="3.5"')}/>${rep(5, (i) => `<path d="M${-16 + i * 8} -154 v4" stroke="${OL}" stroke-width="2"/>`)}`, ""],
    dead: [`<path d="M-30 -188 l16 16 M-14 -188 l-16 16 M14 -188 l16 16 M30 -188 l-16 16" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>`, "", `<path d="M-10 -152 h20" ${s()}/><path d="M2 -152 q4 14 10 8" fill="#FF8FA3" ${s('stroke-width="2.5"')}/>`, ""],
    kiss: [CLOSED, "", `<ellipse cx="0" cy="-150" rx="6" ry="5" fill="#FF6B8A" ${s('stroke-width="3"')}/>`, HEART(46, -190)],
    evilkiss: [E, BROW(-8, 0), `<ellipse cx="0" cy="-150" rx="6" ry="5" fill="#9B2335" ${s('stroke-width="3"')}/>`, HEART(46, -190, "#9B2335")],
    hearteyes: [`${HEART(-22, -182, "#FF4F7A", 1.5)}${HEART(22, -182, "#FF4F7A", 1.5)}`, "", `<path d="M-18 -158 Q0 -134 18 -158Z" fill="#fff" ${s('stroke-width="3.5"')}/>`, ""],
    heartbreak: [E, BROW(2, -8), `<path d="M-14 -146 Q0 -156 14 -146" fill="none" ${s('stroke-width="3.5"')}/>`, `${TEAR(-26)}<path transform="translate(48 -196) scale(1.3)" d="M0 8 C-12 -2 -8 -10 -3 -9 C-1 -9 0 -7 0 -6 C0 -7 1 -9 3 -9 C8 -10 12 -2 0 8z" fill="#C2364F" ${s('stroke-width="2"')}/><path d="M48 -198 l-4 8 6 4 -4 8" fill="none" stroke="#fff" stroke-width="2.5"/>`],
    flushed: [E, "", `<path d="M-8 -150 q8 4 16 0" fill="none" ${s('stroke-width="3.5"')}/>`, `<circle cx="-36" cy="-160" r="13" fill="#FF6B7A" opacity=".5"/><circle cx="36" cy="-160" r="13" fill="#FF6B7A" opacity=".5"/>`],
    freezing: [`<path d="M-30 -178 q8 -8 16 0 M14 -178 q8 -8 16 0" fill="none" ${s('stroke-width="4"')}/>`, "", `<path d="M-14 -152 l4 -4 4 4 4 -4 4 4 4 -4 4 4 4 -4" fill="none" ${s('stroke-width="3.5"')}/>`, `<ellipse cx="0" cy="-168" rx="52" ry="40" fill="#9FD4FF" opacity=".42"/>${rep(3, (i) => `<path d="M${-14 + i * 14} -128 v10 l-3 -4z" fill="#CFEFFF" ${s('stroke-width="2"')}/>`)}`],
    warm: [`<path d="M-30 -180 q8 6 16 0 M14 -180 q8 6 16 0" fill="none" ${s('stroke-width="3.5"')}/>`, "", `<path d="M-14 -154 Q0 -142 14 -154Z" fill="#fff" ${s('stroke-width="3.5"')}/><path d="M-4 -150 q4 14 10 8" fill="#FF8FA3" ${s('stroke-width="2.5"')}/>`, `<ellipse cx="0" cy="-168" rx="52" ry="40" fill="#FF8A3C" opacity=".28"/>${SWEAT(56, -200)}${SWEAT(-58, -170)}`],
    smug: [`<path d="M-30 -182 h16 M14 -182 h16" ${s('stroke-width="4"')}/><path d="M-30 -180 q8 -6 16 0 M14 -180 q8 -6 16 0" fill="${ec}" ${s('stroke-width="3"')}/>`, `<path d="M-34 -194 l22 -2 M34 -204 l-22 8" fill="none" ${s('stroke-width="4.5"')}/>`, `<path d="M-14 -152 Q4 -144 18 -158" fill="none" ${s('stroke-width="3.5"')}/>`, ""],
    evilsmirk: [E, BROW(-8, 0), `<path d="M-16 -152 Q4 -142 20 -160" fill="#fff" ${s('stroke-width="3.5"')}/><path d="M14 -154 l3 8 3 -10" fill="#fff" stroke="${OL}" stroke-width="2"/>`, ""],
    grimace: [E, `<path d="M-34 -196 l22 -2 M34 -196 l-22 -2" fill="none" ${s('stroke-width="4.5"')}/>`, `<rect x="-20" y="-160" width="40" height="16" rx="5" fill="#fff" ${s('stroke-width="3.5"')}/>${rep(4, (i) => `<path d="M${-12 + i * 8} -160 v16" stroke="${OL}" stroke-width="2"/>`)}<path d="M-20 -152 h40" stroke="${OL}" stroke-width="2"/>`, SWEAT(58, -198)],
    pleading: [`<circle cx="-22" cy="-180" r="12" fill="${ec}"/><circle cx="22" cy="-180" r="12" fill="${ec}"/><circle cx="-18" cy="-185" r="4.5" fill="#fff"/><circle cx="26" cy="-185" r="4.5" fill="#fff"/><circle cx="-24" cy="-174" r="2.2" fill="#fff"/><circle cx="20" cy="-174" r="2.2" fill="#fff"/>`, `<path d="M-34 -198 l22 -8 M34 -198 l-22 -8" fill="none" ${s('stroke-width="4"')}/>`, `<path d="M-8 -150 q4 -4 8 0 q4 4 8 0" fill="none" ${s('stroke-width="3.5"')}/>`, ""],
    rolling: [`<circle cx="-22" cy="-180" r="10" fill="#fff" ${s('stroke-width="3"')}/><circle cx="22" cy="-180" r="10" fill="#fff" ${s('stroke-width="3"')}/><circle cx="-22" cy="-186" r="4.5" fill="${ec}"/><circle cx="22" cy="-186" r="4.5" fill="${ec}"/>`, `<path d="M-34 -198 l22 -4 M34 -198 l-22 -4" fill="none" ${s('stroke-width="4"')}/>`, `<path d="M-10 -152 h20" ${s()}/>`, ""],
    yummy: [ARC(), "", `<path d="M-16 -158 Q0 -138 16 -158Z" fill="#fff" ${s('stroke-width="3.5"')}/><path d="M6 -150 q14 -2 12 8 q-10 4 -12 -8z" fill="#FF8FA3" ${s('stroke-width="2.5"')}/>`, ""],
    fart: [E, `<path d="M-34 -196 l22 -4 M34 -198 l-22 -2" fill="none" ${s('stroke-width="4"')}/>`, `<path d="M-10 -150 q6 6 12 -2 q4 2 8 -2" fill="none" ${s('stroke-width="3.5"')}/>`, `<g fill="#CDE6A0" ${s('stroke-width="2.5"')}><circle cx="62" cy="-110" r="9"/><circle cx="74" cy="-102" r="7"/><circle cx="84" cy="-96" r="5"/></g>`],
    wink: [`<ellipse cx="-22" cy="-180" rx="7" ry="9" fill="${ec}"/><circle cx="-19" cy="-184" r="2.6" fill="#fff"/><path d="M14 -180 q8 6 16 0" fill="none" ${s('stroke-width="3.5"')}/>`, "", SMILE, STAR(52, -200, 0.7)],
  }[id];
  return x ? { eyes: x[0], brows: x[1], mouth: x[2], extra: x[3] } : null;
}

/* ------------------------------------------------------------------ the premade figures */
const palette = (k, i) => (AV.sw[k] && AV.sw[k][i % AV.sw[k].length]) || ["#F6C9A3", "#E3A87C"];
const KIDS = new Set(["School", "After School", "Treehouse", "WaterPark", "AmusementPark", "Stable", "Pets", "PomPomEmporium", "Winter", "Arcade"]);
const ADULTS = new Set(["Office", "Hospital", "University", "FancyRestaurant", "MovieStudio", "MusicFestival", "CentralStation", "City"]);
const LONGISH = (h) => (h >> 3) % 100 < 52;
/* A premade figure: [name, world, age, fantasy, clothes, hat, mask, ear, seed, parts] to the look of an avatar. */
export function personLook(p) {
  const [name, world, age, fant, cl, ht, mk, er, seed, parts] = p;
  const h = seed >>> 0, baby = age === 1, elder = age === 3;
  const grownup = elder || ADULTS.has(world) || (!KIDS.has(world) && (h >>> 5) % 100 < 55);
  const me = {
    skin: fant ? ["#9FD4B8", "#B9A6E8", "#8FC4F0", "#F2A6B8", "#E8C46A"][h % 5] : palette("skin", h)[0],
    hs: (LONGISH(h) ? "L" : "S") + String((h >>> 7) % (LONGISH(h) ? 217 : 252)).padStart(3, "0"),
    hairc: elder ? ["#CFD6E6", "#E8E8F0", "#B7BFD0"][h % 3] : palette("hair", h >>> 4)[0],
    age: baby ? "toddler" : elder ? "adult" : grownup ? "adult" : ["small", "kid", "kid", "tween", "teen"][(h >>> 9) % 5],
    cl: cl >= 0 ? cl : (h >>> 11) % AV.cl.length,
    eyec: ["#2B2340", "#5B3A21", "#2F6FED", "#3F9E5A", "#7A6A8A"][(h >>> 13) % 5],
    fe: h % 284, fb: (h >>> 3) % 525, fn: (h >>> 5) % 544, fm: (h >>> 8) % 567,
  };
  if (!LONGISH(h) && !baby && (h >>> 17) % 100 < 14 && grownup) me.bd = "B" + String((h >>> 19) % 47).padStart(3, "0");
  if (parts & 1) me.ff = h % 127;
  if (parts & 2) me.fh = h % 233;
  if (parts & 4) me.fw = h % 83;
  if (parts & 8) me.fs = h % 12;
  if (ht >= 0) me.ht = ht;
  else if ((h >>> 21) % 100 < 12) me.ht = (h >>> 12) % AV.hat.length;
  if (mk >= 0) me.mk = mk;
  else if ((h >>> 23) % 100 < 14) me.mk = (h >>> 14) % AV.mask.length;
  if (er >= 0) me.er = er;
  else if ((h >>> 25) % 100 < 16) me.er = (h >>> 16) % AV.ear.length;
  if (baby) me.hs = "S" + String((h >>> 7) % 12).padStart(3, "0");
  return me;
}

/* ------------------------------------------------------------------ what the figures say, by world */
const SAY = {
  _: [["Hej! Dejligt at se dig.", "Hi! Nice to see you."], ["Hvad skal vi lege?", "What shall we play?"], ["Det er en god dag i dag!", "It is a good day today!"], ["Vil du være min ven?", "Will you be my friend?"], ["Jeg elsker at være her.", "I love being here."]],
  Hospital: [["Husk at vaske hænder!", "Remember to wash your hands!"], ["Her tager vi os af hinanden.", "Here we take care of each other."]],
  School: [["Har du lavet lektier?", "Did you do your homework?"], ["Frikvarter er bedst!", "Break time is the best!"]],
  "After School": [["Hvad skal vi lave efter skole?", "What shall we do after school?"], ["Tid til leg!", "Time to play!"]],
  Farm: [["Hønsene har lagt æg i dag.", "The hens have laid eggs today."], ["Kan du lugte høet?", "Can you smell the hay?"]],
  BunBakery: [["Mmm, det dufter af nybagt brød!", "Mmm, it smells of fresh bread!"]],
  Office: [["Jeg har et møde om lidt.", "I have a meeting soon."], ["Kaffe, tak!", "Coffee, please!"]],
  Pets: [["Se mit kæledyr!", "Look at my pet!"], ["Dyr er de bedste venner.", "Animals are the best friends."]],
  Vacation: [["Solen skinner, og vandet er dejligt!", "The sun is shining and the water is lovely!"], ["Ferie er bedst.", "Holidays are the best."]],
  Waterfront: [["Hører du bølgerne?", "Can you hear the waves?"], ["Skibene sejler ud.", "The ships are sailing out."]],
  MagoMall: [["Der er tilbud i butikkerne!", "There are sales in the shops!"], ["Skal vi shoppe?", "Shall we go shopping?"]],
  Winter: [["Brrr, det er koldt!", "Brrr, it is cold!"], ["Lad os bygge en snemand.", "Let's build a snowman."]],
  Arcade: [["Jeg slår din rekord!", "I will beat your record!"], ["Spil igen!", "Play again!"]],
  FancyRestaurant: [["Bordet er dækket.", "The table is set."], ["Må jeg tage din bestilling?", "May I take your order?"]],
  Dentist: [["Husk at børste tænder!", "Remember to brush your teeth!"], ["Åbn stort!", "Open wide!"]],
  University: [["Jeg læser til eksamen.", "I am studying for my exam."], ["Biblioteket er stille.", "The library is quiet."]],
  HighSchool: [["Skal du med til festen?", "Are you coming to the party?"], ["Prøven var svær.", "The test was hard."]],
  MovieStudio: [["Lys, kamera, action!", "Lights, camera, action!"], ["Vi optager en scene.", "We are shooting a scene."]],
  PomPomEmporium: [["Se alle de bløde pomponer!", "Look at all the soft pompoms!"], ["Jeg laver en hue.", "I am making a hat."]],
  AmusementPark: [["Hurtigere rutsjebane!", "Faster roller coaster!"], ["Skal vi prøve pariserhjulet?", "Shall we try the big wheel?"]],
  WaterPark: [["Plask! Rutsjebanen er fed!", "Splash! The slide is great!"]],
  OutdoorPool: [["Spring i vandet!", "Jump in the water!"]],
  HauntedHouse: [["Bøh! Hvad var den lyd?", "Boo! What was that sound?"], ["Jeg er ikke bange …", "I am not scared …"]],
  TreeHouse: [["Tag stigen op til trætoppen!", "Take the ladder up to the treetop!"]],
  IceSkating: [["Pas på isen!", "Mind the ice!"], ["Se mig glide!", "Watch me glide!"]],
  Wildlife: [["Vær stille ved dyrene.", "Be quiet around the animals."]],
  HarvestFestival: [["Græskarrene er store i år!", "The pumpkins are big this year!"]],
  AllStarStadium: [["Heja holdet!", "Go team!"], ["Mål!", "Goal!"]],
  CentralStation: [["Toget kører om lidt.", "The train leaves soon."], ["Hvor skal du hen?", "Where are you going?"]],
  MusicFestival: [["Musikken er helt fantastisk!", "The music is fantastic!"], ["Dans med!", "Dance along!"]],
  PetAdoptionCenter: [["Vil du adoptere et kæledyr?", "Would you like to adopt a pet?"], ["De er alle søde.", "They are all cute."]],
  Stable: [["Hestene skal have hø.", "The horses need hay."], ["Skal vi ride en tur?", "Shall we go for a ride?"]],
  Town: [["God dag, nabo!", "Good day, neighbour!"]], City: [["Byen er travl i dag.", "The city is busy today."]], Neighborhood: [["God dag, nabo!", "Good day, neighbour!"]],
};
export const AV_EN = {};
for (const list of Object.values(SAY)) for (const [da, en] of list) AV_EN[da] = en;
for (const [, da, en] of AV.expr) AV_EN[da] = en;
for (const [, da, en] of AV.dance) AV_EN[da] = en;
for (const [, da, en] of AV.cat) AV_EN[da] = en;
for (const list of [AV.cl, AV.hat, AV.mask, AV.ear]) for (const it of list) AV_EN[it[1]] = it[2];
/* What a figure of that world says: its own two lines, and the ones for everybody. */
export const linesFor = (world, seed) => {
  const own = SAY[world] || [], all = SAY._, out = own.map(([da]) => da);
  out.push(all[seed % all.length][0], all[(seed >>> 3) % all.length][0]);
  return [...new Set(out)];
};

/* ------------------------------------------------------------------ helpers for the workshop */
export const has = (v) => v !== undefined && v !== null && v !== "";
const idN = (g, n) => g + String(n).padStart(3, "0");
/* A new look, drawn by chance from the whole catalog (the original's randomize button). */
export function randomLook() {
  const r = (n) => Math.floor(Math.random() * n), of = (a) => a[r(a.length)], chance = (p) => Math.random() < p;
  const crazy = chance(0.08), long = !crazy && chance(0.5);
  return {
    hs: crazy ? idN("C", of(AV.hair.Crazy)) : long ? idN("L", of(AV.hair.Long)) : idN("S", of(AV.hair.Short)),
    hairc: of(AV.sw.hair)[0], skin: of(AV.sw.skin)[0], eyec: of(["#2B2340", "#5B3A21", "#2F6FED", "#3F9E5A", "#7A6A8A"]), cl: r(AV.cl.length),
    fe: r(284), fb: r(525), fn: r(544), fm: r(567), fh: chance(0.6) ? r(233) : "", ff: chance(0.25) ? r(127) : "", fw: "", fs: chance(0.05) ? r(12) : "",
    bd: !long && !crazy && chance(0.12) ? idN("B", of(AV.hair.Beard)) : "", ht: chance(0.25) ? r(AV.hat.length) : "", mk: chance(0.3) ? r(AV.mask.length) : "", er: chance(0.3) ? r(AV.ear.length) : "", expr: "",
  };
}

/* ------------------------------------------------------------------ the premade pets */
const FUR = {
  dog: ["#C98B55", "#E9B65A", "#3A3A55", "#FFFFFF", "#9AA4BA", "#8B5A2B"], cat: ["#FFB347", "#9AA4BA", "#3A3A55", "#FFFFFF", "#C98B55", "#F5E1C8"],
  rabbit: ["#FFFFFF", "#C9B7A0", "#9AA4BA", "#F5E1C8"], mouse: ["#C9B7A0", "#FFFFFF", "#9AA4BA", "#E8C69A"], horse: ["#8B5A2B", "#3A3A55", "#E8C69A", "#FFFFFF"],
  pig: ["#F7B5CF", "#FFD1DF"], bear: ["#C98B55", "#9AA4BA", "#3A3A55", "#E8C69A"], owl: ["#A9764C", "#CFD6E6"], hen: ["#FFFFFF", "#FFD93D", "#C98B55", "#E5484D"],
  dino: ["#6BCB77", "#4FB3FF", "#9B5DE5", "#FFB347"], butterfly: ["#C7B8FF", "#FFB347", "#4FB3FF", "#F7B5CF"], blob: ["#6BCB77", "#4FB3FF", "#FF8A3C", "#F7B5CF", "#9B5DE5"], robot: ["#CFD6E6", "#FFD93D", "#4FB3FF"],
};
const BODY = {
  dog: { kind: "dog", ears: "flop", snout: "dog", tail: "wag" }, cat: { kind: "cat", ears: "point", snout: "cat", tail: "thin" }, rabbit: { kind: "rabbit", ears: "long", snout: "mouse", tail: "puff" },
  mouse: { kind: "mouse", ears: "round", snout: "mouse", tail: "thin" }, horse: { kind: "horse", ears: "point", snout: "dog", tail: "bushy" }, pig: { kind: "pig", ears: "flop", snout: "none", tail: "curl" },
  bear: { kind: "bear", ears: "round", snout: "bear", tail: "puff" }, owl: { kind: "owl" }, hen: { kind: "hen" }, dino: { kind: "dino" }, butterfly: { kind: "butterfly" }, blob: { kind: "blob" }, robot: { kind: "robot" },
};
const GUESS = ["dog", "cat", "bear", "mouse", "rabbit", "hen", "pig", "dog", "cat"];
const PETSAY = {
  dog: [["Vuf vuf!", "Woof woof!"], ["Skal vi lege med bolden?", "Shall we play with the ball?"]], cat: [["Miav!", "Meow!"], ["Klø mig bag øret.", "Scratch me behind the ear."]],
  rabbit: [["Hop hop!", "Hop hop!"], ["Jeg elsker gulerødder.", "I love carrots."]], mouse: [["Pip pip!", "Squeak squeak!"]], horse: [["Vrinsk!", "Neigh!"], ["Skal vi ride en tur?", "Shall we go for a ride?"]],
  pig: [["Øf øf!", "Oink oink!"]], bear: [["Brum!", "Grr!"], ["Jeg elsker honning.", "I love honey."]], owl: [["Uhu!", "Hoot!"]], hen: [["Pip! Kluk kluk!", "Peep! Cluck cluck!"]], dino: [["Rawr!", "Rawr!"]],
  butterfly: [["Jeg flyver fra blomst til blomst.", "I fly from flower to flower."]], blob: [["Plask plask!", "Splash splash!"]], robot: [["Bip bop!", "Beep boop!"]],
};
for (const list of Object.values(PETSAY)) for (const [da, en] of list) AV_EN[da] = en;
/* A premade pet: [name, world, species, colour, seed, Danish species] to a character the game can draw, and what it says. */
export function petLook(row) {
  const [, , sp0, col, seed] = row, h = seed >>> 0, sp = sp0 || GUESS[h % GUESS.length], body = BODY[sp], fur = col || FUR[sp][(h >>> 5) % FUR[sp].length];
  const ch = { ...body, fur, belly: shade(fur, 1.25) };
  if (sp === "dog" || sp === "cat") ch.marks = ["", "", "spots", "patch"][(h >>> 9) % 4];
  if ((h >>> 12) % 100 < 14 && ["dog", "cat", "rabbit", "bear", "mouse", "pig"].includes(sp)) ch.hat = ["bow", "party", "beanie", "crown", "cap"][(h >>> 14) % 5];
  return { kind: body.kind, ...ch, _say: PETSAY[sp] ? PETSAY[sp].map(([da]) => da) : ["Hej!"] };
}
