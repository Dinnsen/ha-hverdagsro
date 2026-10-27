/* Hverdagsro – the characters of the play world, drawn from a small description (data), in the same style as the
   children's own avatar: big head, short body, thick outline. Every character here is our own. A character is
   { kind, ... }: animals share one body (ears, snout, tail, outfit and hat vary), the sweet and odd ones have their
   own shape, and people use the avatar drawing with an outfit on top. Drawn from the feet (0,0) upwards. */
import { OL, S, shade } from "./hv-playcat.js";

const T3 = 'stroke-width="3"';
const e = (cx, cy, rx, ry, f, o = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" ${S(o)}/>`;
const c = (cx, cy, r, f, o = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" ${S(o)}/>`;
const p = (d, f = "none", o = "") => `<path d="${d}" fill="${f}" ${S(o)}/>`;
const r = (x, y, w, h, f, rx = 6, o = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${S(o)}/>`;
const ln = (d, col, w = 6) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const dot = (cx, cy, rr, f) => `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${f}"/>`;
const star = (cx, cy, R, f, o = T3) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.45 : R;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }).join(" ");
  return `<polygon points="${pts}" fill="${f}" ${S(o)}/>`;
};

/* Eyes, mouth and cheeks around a point. s scales; mood: "", "wow", "sleep", "grin". */
export function face(x, y, s = 1, mood = "", o = {}) {
  const ex = 20 * s, ey = y - 6 * s, eye = o.eye || OL;
  const eyes = mood === "sleep"
    ? `<path d="M${x - ex - 8 * s} ${ey} q${8 * s} ${6 * s} ${16 * s} 0 M${x + ex - 8 * s} ${ey} q${8 * s} ${6 * s} ${16 * s} 0" fill="none" ${S(T3)}/>`
    : o.screen
      ? `${r(x - ex - 8 * s, ey - 8 * s, 16 * s, 14 * s, eye, 3 * s, 'stroke-width="0"')}${r(x + ex - 8 * s, ey - 8 * s, 16 * s, 14 * s, eye, 3 * s, 'stroke-width="0"')}`
      : `<ellipse cx="${x - ex}" cy="${ey}" rx="${(mood === "wow" ? 9 : 7) * s}" ry="${(mood === "wow" ? 11 : 9) * s}" fill="${eye}"/><ellipse cx="${x + ex}" cy="${ey}" rx="${(mood === "wow" ? 9 : 7) * s}" ry="${(mood === "wow" ? 11 : 9) * s}" fill="${eye}"/><circle cx="${x - ex + 3 * s}" cy="${ey - 4 * s}" r="${2.6 * s}" fill="#fff"/><circle cx="${x + ex + 3 * s}" cy="${ey - 4 * s}" r="${2.6 * s}" fill="#fff"/>`;
  const brows = o.brows ? `<path d="M${x - ex - 9 * s} ${ey - 16 * s} q${9 * s} ${-6 * s} ${18 * s} 0 M${x + ex - 9 * s} ${ey - 16 * s} q${9 * s} ${-6 * s} ${18 * s} 0" fill="none" ${S(T3)}/>` : "";
  const my = y + 14 * s;
  const mouth = o.noMouth ? "" : mood === "wow" ? `<ellipse cx="${x}" cy="${my + 2 * s}" rx="${7 * s}" ry="${9 * s}" fill="${OL}"/>` : mood === "sleep" ? `<path d="M${x - 8 * s} ${my} h${16 * s}" ${S(T3)}/>` : mood === "grin" ? `<path d="M${x - 16 * s} ${my - 4 * s} Q${x} ${my + 16 * s} ${x + 16 * s} ${my - 4 * s}Z" fill="#fff" ${S(T3)}/>` : `<path d="M${x - 11 * s} ${my - 2 * s} Q${x} ${my + 10 * s} ${x + 11 * s} ${my - 2 * s}" fill="none" ${S(T3)}/>`;
  const cheeks = o.noCheeks ? "" : `<circle cx="${x - ex - 12 * s}" cy="${y + 8 * s}" r="${7 * s}" fill="#FF8FA3" opacity=".5"/><circle cx="${x + ex + 12 * s}" cy="${y + 8 * s}" r="${7 * s}" fill="#FF8FA3" opacity=".5"/>`;
  return eyes + brows + cheeks + mouth;
}

/* ------------------------------------------------------------------ hats and things to wear (for animals) */
const HAT_Y = -214;
const HATS = {
  cap: (k) => `${p(`M-48 ${HAT_Y + 14} Q-46 ${HAT_Y - 30} 0 ${HAT_Y - 30} Q46 ${HAT_Y - 30} 48 ${HAT_Y + 14}Z`, k)}${p(`M-50 ${HAT_Y + 12} h100 q8 10 -4 14 h-92 q-12 -4 -4 -14z`, shade(k, 0.75))}${c(0, HAT_Y - 8, 9, "#FFD93D", T3)}`,
  helmet: (k) => `${p(`M-58 ${HAT_Y + 16} Q-54 ${HAT_Y - 40} 0 ${HAT_Y - 40} Q54 ${HAT_Y - 40} 58 ${HAT_Y + 16} Q0 ${HAT_Y + 2} -58 ${HAT_Y + 16}Z`, k)}${p(`M-14 ${HAT_Y - 30} h28 v28 l-14 10 l-14 -10z`, "#FFD93D", T3)}`,
  hardhat: (k) => `${p(`M-52 ${HAT_Y + 10} Q-50 ${HAT_Y - 36} 0 ${HAT_Y - 36} Q50 ${HAT_Y - 36} 52 ${HAT_Y + 10}Z`, k)}${r(-62, HAT_Y + 4, 124, 12, shade(k, 0.85), 6)}${ln(`M0 ${HAT_Y - 34} V${HAT_Y + 4}`, shade(k, 0.75), 8)}`,
  aviator: (k) => `${p(`M-52 ${HAT_Y + 26} Q-54 ${HAT_Y - 34} 0 ${HAT_Y - 34} Q54 ${HAT_Y - 34} 52 ${HAT_Y + 26} l-10 0 Q40 ${HAT_Y - 14} 0 ${HAT_Y - 14} Q-40 ${HAT_Y - 14} -42 ${HAT_Y + 26}Z`, k)}${c(-20, HAT_Y - 4, 14, "#BFE6FF")}${c(20, HAT_Y - 4, 14, "#BFE6FF")}${ln(`M-6 ${HAT_Y - 4} h12`, OL, 4)}`,
  beanie: (k) => `${p(`M-50 ${HAT_Y + 14} Q-50 ${HAT_Y - 40} 0 ${HAT_Y - 40} Q50 ${HAT_Y - 40} 50 ${HAT_Y + 14}Z`, k)}${r(-54, HAT_Y + 2, 108, 18, shade(k, 0.8), 9)}${c(0, HAT_Y - 44, 13, "#fff")}`,
  crown: () => `${p(`M-36 ${HAT_Y - 4} l10 -34 16 22 10 -30 10 30 16 -22 10 34z`, "#FFD93D")}${c(0, HAT_Y - 24, 5, "#FF6B6B", T3)}`,
  bow: (k) => `${p(`M30 ${HAT_Y - 6} l-26 -16 v32z M30 ${HAT_Y - 6} l26 -16 v32z`, k, T3)}${c(30, HAT_Y - 6, 7, k, T3)}`,
  chef: () => `${p(`M-36 ${HAT_Y + 10} V${HAT_Y - 10} Q-60 ${HAT_Y - 30} -36 ${HAT_Y - 50} Q-20 ${HAT_Y - 76} 0 ${HAT_Y - 56} Q20 ${HAT_Y - 76} 36 ${HAT_Y - 50} Q60 ${HAT_Y - 30} 36 ${HAT_Y - 10} V${HAT_Y + 10}Z`, "#fff")}`,
  tophat: (k) => `${r(-56, HAT_Y + 2, 112, 12, k, 6)}${r(-36, HAT_Y - 60, 72, 64, k, 6)}${ln(`M-36 ${HAT_Y - 10} h72`, "#FF6B6B", 8)}`,
  flowers: () => [-44, -22, 0, 22, 44].map((x, i) => `${c(x, HAT_Y + 4 - (i % 2) * 6, 11, ["#FF6B6B", "#FFD93D", "#F15BB5", "#4D96FF", "#FFB347"][i], T3)}${dot(x, HAT_Y + 4 - (i % 2) * 6, 4, "#fff")}`).join(""),
  headset: (k) => `${p(`M-58 ${HAT_Y + 50} Q-60 ${HAT_Y - 30} 0 ${HAT_Y - 30} Q60 ${HAT_Y - 30} 58 ${HAT_Y + 50}`, "none", 'stroke-width="9"')}${r(-70, HAT_Y + 30, 22, 40, k, 10)}${r(48, HAT_Y + 30, 22, 40, k, 10)}`,
  tiara: () => `${p(`M-30 ${HAT_Y + 4} Q0 ${HAT_Y - 18} 30 ${HAT_Y + 4}`, "#FFD93D")}${star(0, HAT_Y - 14, 10, "#FFD93D")}`,
  antenna: (k) => `${ln(`M-14 ${HAT_Y} L-24 ${HAT_Y - 40} M14 ${HAT_Y} L24 ${HAT_Y - 40}`, OL, 4)}${c(-24, HAT_Y - 42, 8, k, T3)}${c(24, HAT_Y - 42, 8, k, T3)}`,
  hood: (k) => `${p(`M-62 ${HAT_Y + 64} Q-70 ${HAT_Y - 44} 0 ${HAT_Y - 44} Q70 ${HAT_Y - 44} 62 ${HAT_Y + 64} Q50 ${HAT_Y - 10} 0 ${HAT_Y - 14} Q-50 ${HAT_Y - 10} -62 ${HAT_Y + 64}Z`, k)}`,
  sailor: (k) => `${p(`M-46 ${HAT_Y + 10} Q-44 ${HAT_Y - 24} 0 ${HAT_Y - 24} Q44 ${HAT_Y - 24} 46 ${HAT_Y + 10}Z`, "#fff")}${r(-52, HAT_Y + 2, 104, 14, k, 7)}${c(0, HAT_Y - 14, 7, "#FFD93D", T3)}`,
  party: (k) => `${p(`M-24 ${HAT_Y} L6 ${HAT_Y - 70} L30 ${HAT_Y}Z`, k)}${c(6, HAT_Y - 72, 9, "#FFD93D", T3)}`,
};
/* On the face and the body: masks, glasses, visors, bags, wings and badges. */
const ACCS = {
  mask: (k) => `${p("M-52 -186 Q0 -200 52 -186 L46 -162 Q24 -152 8 -164 L0 -170 L-8 -164 Q-24 -152 -46 -162Z", k)}`,
  visor: (k) => `${r(-50, -186, 100, 26, k, 13, 'fill-opacity=".85"')}${ln("M-40 -178 h30", "#fff", 4)}`,
  glasses: () => `<g fill="none" ${S(T3)}><circle cx="-20" cy="-174" r="14"/><circle cx="20" cy="-174" r="14"/><path d="M-6 -174 h12"/></g>`,
  goggles: (k) => `${ln("M-58 -176 H58", OL, 6)}${c(-20, -176, 15, "#BFE6FF")}${c(20, -176, 15, "#BFE6FF")}${p("M-35 -176 a15 15 0 0 1 30 0 M5 -176 a15 15 0 0 1 30 0", "none", `stroke="${k}" stroke-width="5"`)}`,
  badge: (k) => star(-18, -96, 9, k),
  star: (k) => star(0, -88, 18, k),
  bolt: (k) => p("M4 -118 L-14 -86 H0 L-6 -58 L16 -94 H2 L10 -118Z", k, T3),
  heart: (k) => p("M0 -72 C-22 -86 -16 -104 -6 -102 C-2 -101 0 -98 0 -96 C0 -98 2 -101 6 -102 C16 -104 22 -86 0 -72Z", k, T3),
  moon: (k) => p("M8 -110 a18 18 0 1 0 0 34 a14 14 0 1 1 0 -34z", k, T3),
  scarf: (k) => `${r(-40, -126, 80, 16, k, 8)}${r(14, -118, 16, 36, k, 6)}`,
  medal: (k) => `${p("M-8 -126 L0 -100 L8 -126", "#4D96FF", T3)}${c(0, -94, 10, k, T3)}`,
};
const BACKS = {
  backpack: (k) => r(-40, -126, 80, 70, k, 16),
  cape: (k) => p("M-40 -124 Q-70 -40 -64 -6 Q0 -18 64 -6 Q70 -40 40 -124Z", k),
  wings: (k) => `${e(-60, -110, 34, 46, k, 'fill-opacity=".85" transform="rotate(-24 -60 -110)"')}${e(60, -110, 34, 46, k, 'fill-opacity=".85" transform="rotate(24 60 -110)"')}`,
  jetpack: (k) => `${r(-44, -130, 30, 70, k, 12)}${r(14, -130, 30, 70, k, 12)}${p("M-38 -60 q9 30 18 0z M20 -60 q9 30 18 0z", "#FFB347", T3)}`,
  shell: (k) => `${c(0, -94, 56, k)}${p("M0 -94 m-30 0 a30 30 0 1 1 30 30 a18 18 0 1 1 -18 -18 a8 8 0 1 1 8 8", "none", T3)}`,
};

/* ------------------------------------------------------------------ animals: one body, many kinds */
const EARS = {
  flop: (k) => `${e(-52, -170, 16, 36, k, 'transform="rotate(16 -52 -170)"')}${e(52, -170, 16, 36, k, 'transform="rotate(-16 52 -170)"')}`,
  point: (k) => `${p("M-54 -186 L-46 -246 L-14 -212Z", k)}${p("M54 -186 L46 -246 L14 -212Z", k)}${p("M-44 -200 L-42 -228 L-26 -212Z M44 -200 L42 -228 L26 -212Z", "#FFB4C2", 'stroke-width="2"')}`,
  round: (k) => `${c(-42, -212, 20, k)}${c(42, -212, 20, k)}${c(-42, -212, 9, "#FFB4C2", 'stroke-width="2"')}${c(42, -212, 9, "#FFB4C2", 'stroke-width="2"')}`,
  long: (k) => `${e(-22, -252, 14, 44, k)}${e(22, -252, 14, 44, k)}${e(-22, -250, 6, 30, "#FFB4C2", 'stroke-width="0"')}${e(22, -250, 6, 30, "#FFB4C2", 'stroke-width="0"')}`,
  big: (k) => `${e(-66, -164, 34, 42, k)}${e(66, -164, 34, 42, k)}${e(-66, -164, 20, 28, "#FFB4C2", 'stroke-width="0"')}${e(66, -164, 20, 28, "#FFB4C2", 'stroke-width="0"')}`,
  tufts: (k) => `${p("M-46 -200 L-50 -238 L-24 -214Z M46 -200 L50 -238 L24 -214Z", k)}`,
  small: (k) => `${c(-40, -214, 12, k)}${c(40, -214, 12, k)}`,
  none: () => "",
};
const TAILS = {
  wag: (k) => `${ln("M36 -50 q34 -10 30 -50", OL, 16)}${ln("M36 -50 q34 -10 30 -50", k, 9)}`,
  bushy: (k) => `${e(60, -72, 22, 46, k, 'transform="rotate(34 60 -72)"')}${e(80, -104, 10, 14, "#fff", 'transform="rotate(34 80 -104)"')}`,
  thin: (k) => `${ln("M36 -36 q50 6 46 -40 q-4 -20 14 -24", OL, 7)}${ln("M36 -36 q50 6 46 -40 q-4 -20 14 -24", k, 3)}`,
  puff: () => c(42, -42, 15, "#fff"),
  curl: (k) => `${ln("M38 -54 c24 -4 24 -30 8 -30 c-12 0 -10 16 4 14", OL, 10)}${ln("M38 -54 c24 -4 24 -30 8 -30 c-12 0 -10 16 4 14", k, 5)}`,
  spikes: (k) => p("M30 -40 L90 -20 L80 -6 L30 -16Z", k),
  none: () => "",
};
const SNOUTS = {
  dog: (b) => `${e(0, -152, 24, 17, b)}${e(0, -162, 9, 6, OL, "")}`,
  bear: (b) => `${e(0, -152, 20, 15, b)}${e(0, -159, 8, 6, OL, "")}`,
  cat: () => `${p("M-6 -160 h12 l-6 7z", "#FF8FA3", 'stroke-width="2"')}${ln("M-30 -156 l-22 -4 M-30 -150 l-22 4 M30 -156 l22 -4 M30 -150 l22 4", OL, 2)}`,
  beak: () => p("M-12 -160 L12 -160 L0 -142Z", "#FFB347", T3),
  trunk: (b, k) => `${ln("M0 -160 Q-6 -120 14 -112", OL, 20)}${ln("M0 -160 Q-6 -120 14 -112", k, 13)}`,
  mouse: () => `${dot(0, -158, 5, "#FF8FA3")}${ln("M-26 -156 l-20 -4 M26 -156 l20 -4", OL, 2)}`,
  none: () => "",
};
const OUTFITS = {
  vest: (k) => p("M-44 -106 Q-48 -60 -40 -32 H-14 V-110Z M44 -106 Q48 -60 40 -32 H14 V-110Z", k),
  uniform: (k) => `${p("M-44 -108 Q-50 -66 -42 -30 H42 Q50 -66 44 -108 Q0 -96 -44 -108Z", k)}${p("M-16 -108 L0 -88 L16 -108", "#fff", T3)}`,
  lifevest: (k) => `${p("M-44 -108 Q-50 -66 -42 -36 H-8 V-110Z M44 -108 Q50 -66 42 -36 H8 V-110Z", k)}${ln("M-40 -72 H40", OL, 4)}`,
  apron: () => `${p("M-30 -104 H30 L34 -26 H-34Z", "#fff")}${r(-14, -70, 28, 18, "#F7B5CF", 4, T3)}`,
  suit: (k) => `${p("M-44 -108 Q-50 -66 -42 -30 H42 Q50 -66 44 -108 Q0 -96 -44 -108Z", k)}${p("M-34 -30 h24 v28 h-24z M10 -30 h24 v28 h-24z", k, T3)}`,
  dress: (k) => p("M-36 -108 H36 L58 -26 H-58Z", k),
  overalls: (k) => `${p("M-40 -82 H40 L42 -26 H-42Z", k)}${ln("M-30 -82 L-26 -110 M30 -82 L26 -110", k, 7)}${dot(-28, -84, 4, "#FFD93D")}${dot(28, -84, 4, "#FFD93D")}`,
  labcoat: () => `${p("M-46 -108 Q-52 -60 -46 -20 H-6 V-108Z M46 -108 Q52 -60 46 -20 H6 V-108Z", "#fff")}`,
  hoodie: (k) => `${p("M-46 -108 Q-50 -66 -42 -30 H42 Q50 -66 46 -108 Q0 -96 -46 -108Z", k)}${r(-20, -70, 40, 18, shade(k, 0.85), 8, T3)}`,
  none: () => "",
};

/* Feathers, scales and spots on the body. */
const MARKS = {
  spots: (k) => [[-24, -82, 8], [20, -56, 10], [26, -96, 6], [-12, -48, 6]].map(([x, y, rr]) => dot(x, y, rr, k)).join(""),
  stripes: (k) => ln("M-40 -96 q10 4 18 0 M-42 -70 q10 4 18 0 M40 -96 q-10 4 -18 0 M42 -70 q-10 4 -18 0", k, 6),
  patch: (k) => e(24, -168, 22, 18, k, 'stroke-width="0"'),
};

function animal(ch, mood) {
  const k = ch.fur || "#C98B55", b = ch.belly || "#F5E1C8", ear = ch.ear || shade(k, 0.82);
  const back = `${(BACKS[ch.back] || (() => ""))(ch.backc || "#FF6B6B")}${(TAILS[ch.tail] || TAILS.none)(ch.tailc || k)}`;
  const legs = `${r(-34, -32, 26, 34, shade(k, 0.9), 12)}${r(8, -32, 26, 34, shade(k, 0.9), 12)}`;
  const body = `${e(0, -72, 46, 52, k)}${ch.noBelly ? "" : e(0, -64, 28, 34, b, 'stroke-width="0"')}${(MARKS[ch.marks] || (() => ""))(ch.markc || shade(k, 0.7))}`;
  const outfit = (OUTFITS[ch.outfit] || OUTFITS.none)(ch.outc || "#4D96FF");
  const arms = `${e(-48, -82, 13, 28, ch.outfit && ch.outfit !== "none" && ch.outfit !== "apron" && ch.outfit !== "vest" && ch.outfit !== "lifevest" ? ch.outc || k : k, 'transform="rotate(22 -48 -82)"')}${e(48, -82, 13, 28, ch.outfit && ch.outfit !== "none" && ch.outfit !== "apron" && ch.outfit !== "vest" && ch.outfit !== "lifevest" ? ch.outc || k : k, 'transform="rotate(-22 48 -82)"')}`;
  const ears = (EARS[ch.ears] || EARS.round)(ear);
  const head = `${c(0, -168, 58, k)}${(MARKS[ch.headmarks] || (() => ""))(ch.markc || shade(k, 0.7))}`;
  const snout = (SNOUTS[ch.snout] || SNOUTS.none)(b, k);
  const muzzle = ch.snout === "dog" || ch.snout === "bear";
  const fc = face(0, muzzle ? -178 : -168, 1, mood, { noMouth: muzzle || ch.snout === "beak" || ch.snout === "trunk", brows: ch.brows });
  const mouthUnder = muzzle ? `<path d="M-10 -146 q10 9 20 0" fill="none" ${S(T3)}/>` : "";
  const acc = (ACCS[ch.acc] || (() => ""))(ch.accc || "#FFD93D");
  const hat = (HATS[ch.hat] || (() => ""))(ch.hatc || "#4D96FF");
  return `${back}${ch.ears === "big" ? ears : ""}${legs}${body}${outfit}${arms}${ch.ears === "big" ? "" : ears}${head}${snout}${fc}${mouthUnder}${acc}${hat}`;
}

/* ------------------------------------------------------------------ the ones with their own shape */
const SHAPES = {
  // A cinnamon bun with icing
  bun: (ch, mood) => `${r(-30, -24, 22, 24, shade(ch.fur || "#D9A066", 0.85), 10)}${r(8, -24, 22, 24, shade(ch.fur || "#D9A066", 0.85), 10)}${c(0, -96, 76, ch.fur || "#D9A066")}${p("M0 -96 m-46 0 a46 46 0 1 1 46 46 a30 30 0 1 1 -30 -30 a14 14 0 1 1 14 14", "none", `stroke="${shade(ch.fur || "#D9A066", 0.7)}" stroke-width="7"`)}${p("M-60 -140 Q-30 -178 20 -170 Q66 -160 64 -126 Q50 -118 44 -132 Q30 -112 18 -136 Q2 -116 -10 -138 Q-28 -118 -40 -136 Q-56 -122 -60 -140Z", ch.icing || "#FFF6EE", T3)}${face(0, -88, 1, mood)}${e(-80, -100, 12, 20, ch.fur || "#D9A066", 'transform="rotate(20 -80 -100)"')}${e(80, -100, 12, 20, ch.fur || "#D9A066", 'transform="rotate(-20 80 -100)"')}`,
  cupcake: (ch, mood) => `${p("M-50 -80 L-38 0 H38 L50 -80Z", ch.fur || "#9B5DE5")}${[-30, -10, 10, 30].map((x) => ln(`M${x} -76 L${x * 0.8} -4`, shade(ch.fur || "#9B5DE5", 0.8), 4)).join("")}${p("M-58 -80 Q-66 -110 -40 -116 Q-40 -150 -6 -146 Q10 -176 34 -150 Q66 -150 58 -112 Q72 -94 58 -80Z", ch.icing || "#F7B5CF")}${c(10, -170, 12, "#FF6B6B")}${[[-30, -106, "#4D96FF"], [20, -120, "#FFD93D"], [-6, -132, "#6BCB77"], [40, -98, "#fff"]].map(([x, y, f]) => r(x, y, 10, 4, f, 2, 'stroke-width="1"')).join("")}${face(0, -46, 0.9, mood)}`,
  donut: (ch, mood) => `${c(0, -84, 74, ch.fur || "#E3A87C")}${p("M-70 -90 Q-66 -150 0 -156 Q66 -150 70 -90 Q60 -70 46 -86 Q30 -66 16 -84 Q0 -62 -16 -84 Q-30 -66 -46 -86 Q-60 -70 -70 -90Z", ch.icing || "#F15BB5", T3)}${c(0, -84, 18, "transparent")}${[[-40, -120, "#FFD93D"], [30, -132, "#4D96FF"], [44, -108, "#fff"], [-20, -138, "#6BCB77"]].map(([x, y, f]) => r(x, y, 12, 4, f, 2, 'stroke-width="1"')).join("")}${face(0, -44, 0.85, mood)}${r(-30, -16, 20, 16, shade(ch.fur || "#E3A87C", 0.8), 8)}${r(10, -16, 20, 16, shade(ch.fur || "#E3A87C", 0.8), 8)}`,
  berry: (ch, mood) => `${r(-28, -22, 20, 22, "#5A9E5F", 9)}${r(8, -22, 20, 22, "#5A9E5F", 9)}${p("M0 -16 C-70 -30 -80 -120 -40 -150 Q0 -170 40 -150 C80 -120 70 -30 0 -16Z", ch.fur || "#FF5A6E")}${[[-30, -110], [22, -120], [-10, -70], [36, -80], [-40, -70], [6, -40]].map(([x, y]) => e(x, y, 3, 5, "#FFE066", 'stroke-width="0"')).join("")}${p("M-40 -148 L-20 -176 L0 -156 L20 -178 L40 -148 Q0 -136 -40 -148Z", "#6BCB77")}${face(0, -96, 0.9, mood)}`,
  mochi: (ch, mood) => `${p("M-70 -10 Q-80 -110 0 -116 Q80 -110 70 -10 Q0 4 -70 -10Z", ch.fur || "#FFFFFF")}${c(-38, -112, 14, ch.fur || "#FFFFFF")}${c(38, -112, 14, ch.fur || "#FFFFFF")}${face(0, -56, 0.9, mood)}`,
  macaron: (ch, mood) => `${p("M-70 -60 Q-70 -126 0 -128 Q70 -126 70 -60Z", ch.fur || "#C7B8FF")}${r(-72, -64, 144, 16, ch.icing || "#FFF6EE", 8)}${p("M-70 -48 Q-70 -6 0 -4 Q70 -6 70 -48Z", ch.fur || "#C7B8FF")}${face(0, -94, 0.85, mood)}`,
  drop: (ch, mood) => `${r(-28, -22, 20, 22, shade(ch.fur || "#4FB3FF", 0.8), 9)}${r(8, -22, 20, 22, shade(ch.fur || "#4FB3FF", 0.8), 9)}${p("M0 -200 C30 -150 70 -110 70 -70 A70 70 0 0 1 -70 -70 C-70 -110 -30 -150 0 -200Z", ch.fur || "#4FB3FF")}${p("M-40 -100 q4 -30 22 -50", "none", 'stroke="#fff" stroke-width="7"')}${face(0, -76, 0.95, mood)}`,
  flower: (ch, mood) => `${ln("M0 0 V-110", "#5A9E5F", 10)}${p("M0 -40 Q-40 -60 -50 -40 Q-30 -26 0 -40Z M0 -62 Q40 -82 50 -62 Q30 -48 0 -62Z", "#6BCB77")}${Array.from({ length: 8 }, (_, i) => e(Math.cos((i * Math.PI) / 4) * 50, -160 + Math.sin((i * Math.PI) / 4) * 50, 24, 16, ch.fur || "#FFD93D", `transform="rotate(${i * 45} ${Math.cos((i * Math.PI) / 4) * 50} ${-160 + Math.sin((i * Math.PI) / 4) * 50})"`)).join("")}${c(0, -160, 40, ch.icing || "#FFB347")}${face(0, -160, 0.75, mood)}`,
  robot: (ch, mood) => `${r(-30, -34, 22, 34, "#9AA4BA", 6)}${r(8, -34, 22, 34, "#9AA4BA", 6)}${r(-48, -110, 96, 80, ch.fur || "#CFD6E6", 18)}${c(0, -72, 14, ch.icing || "#00BBF9", T3)}${ln("M-48 -90 l-20 30 M48 -90 l20 30", OL, 8)}${r(-50, -196, 100, 82, ch.fur || "#CFD6E6", 22)}${r(-38, -184, 76, 56, "#1B1530", 14, T3)}${face(0, -156, 0.8, mood, { eye: ch.icing || "#00BBF9", screen: true, noCheeks: true })}${ln("M0 -196 V-216", OL, 4)}${c(0, -220, 8, "#FFD93D", T3)}`,
  blob: (ch, mood) => `${p("M-74 -6 Q-90 -90 -50 -140 Q0 -190 50 -140 Q90 -90 74 -6 Q0 6 -74 -6Z", ch.fur || "#6BCB77")}${[[-50, -136], [-10, -168], [36, -150], [60, -100]].map(([x, y]) => p(`M${x} ${y} q-8 -18 8 -22 q4 14 -8 22z`, shade(ch.fur || "#6BCB77", 0.8), T3)).join("")}${face(0, -86, 1, mood)}${r(-34, -14, 22, 16, shade(ch.fur || "#6BCB77", 0.8), 8)}${r(12, -14, 22, 16, shade(ch.fur || "#6BCB77", 0.8), 8)}`,
  snail: (ch, mood) => `${p("M-90 -4 Q-100 -40 -60 -44 H60 Q90 -40 90 -4Z", ch.fur || "#FFD8A8")}${c(18, -86, 54, ch.icing || "#C98B55")}${p("M18 -86 m-34 0 a34 34 0 1 1 34 34 a20 20 0 1 1 -20 -20 a8 8 0 1 1 8 8", "none", T3)}${c(-70, -76, 30, ch.fur || "#FFD8A8")}${ln("M-80 -102 L-90 -136 M-62 -104 L-60 -138", OL, 4)}${c(-90, -138, 6, ch.fur || "#FFD8A8", T3)}${c(-60, -140, 6, ch.fur || "#FFD8A8", T3)}${face(-70, -76, 0.6, mood)}`,
  dino: (ch, mood) => `${p("M40 -40 Q100 -30 120 -60 Q100 -10 40 -10Z", ch.fur || "#6BCB77")}${r(-34, -34, 26, 34, shade(ch.fur || "#6BCB77", 0.85), 12)}${r(8, -34, 26, 34, shade(ch.fur || "#6BCB77", 0.85), 12)}${e(0, -76, 52, 54, ch.fur || "#6BCB77")}${e(0, -66, 32, 38, ch.belly || "#FFF0B8", 'stroke-width="0"')}${[-60, -40, -20, 0, 20].map((y, i) => p(`M${-6 + i * 4} ${-224 + i * 34} l14 -18 l6 22z`, "#FFB347", T3)).join("")}${e(0, -168, 60, 54, ch.fur || "#6BCB77")}${e(-48, -84, 12, 22, ch.fur || "#6BCB77", 'transform="rotate(22 -48 -84)"')}${e(48, -84, 12, 22, ch.fur || "#6BCB77", 'transform="rotate(-22 48 -84)"')}${face(0, -170, 1, mood)}${dot(-10, -140, 2, OL)}${dot(10, -140, 2, OL)}`,
  owl: (ch, mood) => `${r(-26, -14, 18, 14, "#FFB347", 6)}${r(8, -14, 18, 14, "#FFB347", 6)}${p("M-66 -10 Q-80 -150 0 -170 Q80 -150 66 -10Z", ch.fur || "#A9764C")}${e(0, -60, 40, 44, ch.belly || "#F2E3CF", 'stroke-width="0"')}${p("M-60 -150 L-70 -196 L-30 -164Z M60 -150 L70 -196 L30 -164Z", ch.fur || "#A9764C")}${c(-26, -128, 24, "#fff")}${c(26, -128, 24, "#fff")}${p("M-8 -110 L8 -110 L0 -96Z", "#FFB347", T3)}${e(-66, -76, 16, 40, shade(ch.fur || "#A9764C", 0.8), 'transform="rotate(14 -66 -76)"')}${e(66, -76, 16, 40, shade(ch.fur || "#A9764C", 0.8), 'transform="rotate(-14 66 -76)"')}${face(0, -122, 1.1, mood, { noMouth: true, noCheeks: true })}`,
  hen: (ch, mood) => `${ln("M-14 0 V-24 M14 0 V-24", "#FFB347", 6)}${e(0, -80, 62, 60, ch.fur || "#FFFFFF")}${e(-56, -86, 18, 30, shade(ch.fur || "#FFFFFF", 0.9), 'transform="rotate(30 -56 -86)"')}${c(18, -150, 40, ch.fur || "#FFFFFF")}${p("M4 -188 q8 -20 16 -2 q8 -20 16 0 q4 10 -10 10z", "#FF6B6B", T3)}${p("M52 -152 L70 -146 L52 -138Z", "#FFB347", T3)}${p("M50 -136 q4 14 -6 14", "#FF6B6B", T3)}${face(22, -152, 0.6, mood, { noMouth: true })}`,
  butterfly: (ch, mood) => `${e(-64, -150, 50, 56, ch.icing || "#C7B8FF", 'transform="rotate(-20 -64 -150)"')}${e(64, -150, 50, 56, ch.icing || "#C7B8FF", 'transform="rotate(20 64 -150)"')}${e(-50, -70, 30, 34, ch.icing2 || "#FFB4C2", 'transform="rotate(20 -50 -70)"')}${e(50, -70, 30, 34, ch.icing2 || "#FFB4C2", 'transform="rotate(-20 50 -70)"')}${p("M-24 -110 H24 L38 -20 H-38Z", ch.fur || "#9B5DE5")}${c(0, -150, 40, ch.skin || "#FFE0C7")}${ln("M-10 -186 L-22 -220 M10 -186 L22 -220", OL, 4)}${c(-22, -222, 6, "#FFD93D", T3)}${c(22, -222, 6, "#FFD93D", T3)}${face(0, -150, 0.8, mood)}`,
};

/* Where the top of each shape is, for its hat. */
const SHAPE_TOP = { bun: -168, cupcake: -172, donut: -156, berry: -160, mochi: -122, macaron: -126, drop: -196, flower: -206, robot: -196, blob: -164, snail: -102, dino: -222, owl: -166, hen: -186, butterfly: -186 };

/* ------------------------------------------------------------------ people: the avatar with an outfit on top */
const PEOPLE = {
  cape: { back: (k) => p("M-44 -134 Q-80 -60 -70 -8 Q0 -22 70 -8 Q80 -60 44 -134Z", k) },
  mask: { front: (k) => p("M-58 -194 Q0 -206 58 -194 L52 -166 Q26 -156 8 -170 L0 -176 L-8 -170 Q-26 -156 -52 -166Z", k) },
  visor: { front: (k) => `${r(-56, -196, 112, 30, k, 15, 'fill-opacity=".85"')}${ln("M-44 -186 h34", "#fff", 4)}` },
  helmet: { front: (k) => `${p("M-66 -170 Q-70 -256 0 -258 Q70 -256 66 -170 L56 -170 Q54 -230 0 -232 Q-54 -230 -56 -170Z", k)}${ln("M0 -258 V-232", shade(k, 0.7), 8)}` },
  labcoat: { front: () => `${p("M-48 -134 L-54 -40 H-8 V-130Z M48 -134 L54 -40 H8 V-130Z", "#fff")}` },
  apron: { front: (k) => `${p("M-30 -128 H30 L36 -50 H-36Z", k || "#fff")}${r(-14, -96, 28, 16, "#fff", 4, T3)}` },
  headphones: { front: (k) => `${p("M-66 -184 Q-66 -262 0 -262 Q66 -262 66 -184", "none", 'stroke-width="9"')}${r(-78, -206, 22, 42, k, 10)}${r(56, -206, 22, 42, k, 10)}` },
  chef: { front: () => p("M-40 -236 V-254 Q-64 -272 -40 -292 Q-24 -318 0 -298 Q24 -318 40 -292 Q64 -272 40 -254 V-236Z", "#fff") },
  cap: { front: (k) => `${p("M-60 -220 Q-58 -270 0 -272 Q58 -270 60 -220Z", k)}${p("M10 -224 h76 q6 8 -4 12 h-72z", shade(k, 0.8))}` },
  crown: { front: () => `${p("M-44 -232 l12 -44 18 28 14 -38 14 38 18 -28 12 44z", "#FFD93D")}` },
  hood: { back: (k) => p("M-74 -150 Q-84 -272 0 -272 Q84 -272 74 -150 Z", k) },
  scarf: { front: (k) => `${r(-44, -140, 88, 16, k, 8)}${r(18, -132, 16, 40, k, 6)}` },
  star: { front: (k) => star(0, -100, 20, k) },
  bolt: { front: (k) => p("M4 -128 L-14 -96 H0 L-6 -68 L16 -104 H2 L10 -128Z", k, T3) },
  vest: { front: (k) => p("M-44 -134 L-50 -66 H-12 V-132Z M44 -134 L50 -66 H12 V-132Z", k) },
  uniform: { front: (k) => `${p("M-44 -134 h88 l6 70 h-100z", k)}${p("M-16 -134 L0 -112 L16 -134", "#fff", T3)}${star(-22, -112, 7, "#FFD93D")}` },
  mic: { front: () => `${ln("M60 -80 L74 -110", OL, 6)}${c(76, -116, 10, "#CFD6E6", T3)}` },
  tablet: { front: () => `${r(-26, -100, 52, 36, "#1B1530", 6)}${r(-20, -94, 40, 24, "#4D96FF", 3, 'stroke-width="2"')}` },
  bag: { front: (k) => `${ln("M-40 -130 L34 -60", OL, 4)}${r(24, -74, 34, 28, k, 6)}` },
  wand: { front: () => `${ln("M60 -76 L84 -120", OL, 5)}${star(86, -124, 12, "#FFD93D")}` },
};
function person(ch, mood, avatar) {
  const parts = (ch.wear || []).map(([key, col]) => [PEOPLE[key] || {}, col]);
  return `${parts.map(([P, col]) => (P.back ? P.back(col) : "")).join("")}${avatar(ch.me || {}, mood)}${parts.map(([P, col]) => (P.front ? P.front(col) : "")).join("")}`;
}

/* A character, drawn from its description. avatar: the avatar drawing, for people. */
export function charSvg(ch, mood = "", avatar = () => "") {
  if (!ch) return "";
  if (ch.kind === "person") return person(ch, mood, avatar);
  if (SHAPES[ch.kind]) {
    const hat = (HATS[ch.hat] || (() => ""))(ch.hatc || "#4D96FF");
    const lift = (SHAPE_TOP[ch.kind] ?? -226) + 226;
    return `${(BACKS[ch.back] || (() => ""))(ch.backc || "#FF6B6B")}${SHAPES[ch.kind](ch, mood)}${hat ? `<g transform="translate(0 ${lift})">${hat}</g>` : ""}${(ACCS[ch.acc] || (() => ""))(ch.accc || "#FFD93D")}`;
  }
  return animal(ch, mood);
}
