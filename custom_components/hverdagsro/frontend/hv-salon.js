/* Hverdagsro – the things of the beauty and the bathroom, as the original has them: the hair dye machine (every hair colour),
   the haircut machine (every hairstyle and beard), the toothbrush (a tiny one and a giant one), and the photo booth (four
   pictures in a strip). And carrying with two hands: a big thing is held in front of the body with both arms. Our own
   drawings and interactions; the pictures taken go in the same album as the mirror's. */
import { OL, shade, DRAW } from "./hv-playcat.js";
import { AV } from "./hv-avatars.js";

const { r, c, e, p, ln, dot, rep, T3 } = DRAW;
let A = null; // { st, publish, redraw, save, sfx, floatIcons, avatar, look, esc, flash }
export function init(api) {
  A = api;
}

/* ------------------------------------------------------------------ the things */
export const SALON_THINGS = {
  fotoboks: ["Fotoboks", "mob", "#7B5CE0", 150, 270, (k) => `${r(-75, -268, 150, 268, k, 14)}${r(-60, -256, 120, 46, "#FFF3B0", 10, T3)}${c(-26, -233, 11, "#2B2340")}${c(-26, -233, 5, "#7DD3F8")}${dot(22, -233, 6, "#FF6B6B")}${dot(42, -233, 6, "#6BCB77")}${r(-52, -190, 104, 160, "#E5484D", 6, T3)}${rep(5, (i) => ln(`M${-40 + i * 20} -188 V-32`, "#fff", 8))}${r(-52, -36, 104, 8, shade("#E5484D", 0.8), 2)}${r(54, -170, 16, 40, "#fff", 3, T3)}${ln("M-44 0 v-10 M44 0 v-10", OL, 6)}`],
  haarfarvemaskine: ["Hårfarvemaskine", "mob", "#F15BB5", 140, 250, (k) => `${e(0, -6, 52, 10, "#9AA4BA")}${r(-8, -150, 16, 146, "#B8C0D0", 3, T3)}${p("M-62 -176 Q-62 -250 0 -250 Q62 -250 62 -176Z", k)}${rep(5, (i) => ln(`M${-48 + i * 24} -178 Q${-48 + i * 24} -226 ${-30 + i * 15} -246`, ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#9B5DE5"][i], 8))}${r(-66, -182, 132, 12, shade(k, 0.8), 5, T3)}${r(-36, -130, 72, 40, "#F7F2E8", 8, T3)}${[["#FF6B6B", -22], ["#FFD93D", -7], ["#4D96FF", 8], ["#6BCB77", 23]].map(([col, x]) => dot(x, -110, 6, col)).join("")}`],
  klippemaskine: ["Klippemaskine", "mob", "#4D96FF", 130, 210, (k) => `${e(0, -6, 50, 10, "#9AA4BA")}${r(-8, -120, 16, 116, "#B8C0D0", 3, T3)}${r(-40, -200, 80, 86, k, 14)}${p("M-34 -118 H34 V-100 H28 V-108 H22 V-100 H16 V-108 H10 V-100 H4 V-108 H-2 V-100 H-8 V-108 H-14 V-100 H-20 V-108 H-26 V-100 H-34Z", "#CFD6E6", T3)}${dot(0, -166, 10, "#fff")}${ln("M0 -166 v-10", OL, 4)}${ln("M40 -170 q40 10 30 60 q-6 30 -40 40", "#3A3347", 4)}`],
  tandboerste: ["Tandbørste", "pynt", "#4FC3F7", 50, 130, (k) => `${r(-7, -124, 14, 100, k, 7)}${r(-9, -52, 18, 30, shade(k, 0.85), 8)}${r(-15, -150, 30, 36, "#fff", 8, T3)}${rep(5, (i) => ln(`M${-10 + i * 5} -152 v-14`, "#FFD93D", 3))}`],
  kaempetandboerste: ["Kæmpe-tandbørste", "pynt", "#FF8AC0", 90, 330, (k) => `${r(-14, -310, 28, 230, k, 14)}${r(-18, -170, 36, 70, shade(k, 0.85), 16)}${r(-32, -330, 64, 96, "#fff", 18, T3)}${rep(6, (i) => ln(`M${-24 + i * 10} -334 v-34`, "#4D96FF", 6))}${dot(0, -210, 8, "#fff")}`],
};
export const SALON_EN = {
  Fotoboks: "Photo booth", Hårfarvemaskine: "Hair dye machine", Klippemaskine: "Haircut machine", Tandbørste: "Toothbrush", "Kæmpe-tandbørste": "Giant toothbrush",
  "Tag 4 billeder": "Take 4 pictures", Fotostrimlen: "The photo strip", "Din hårfarve": "Your hair colour", "Din frisure": "Your hairstyle", "Kort hår": "Short hair", "Langt hår": "Long hair",
  "Skørt hår": "Crazy hair", Skæg: "Beard", "Intet skæg": "No beard", "Ny frisure": "New hairstyle", "Børster tænder": "Brushing teeth", "Så blev håret farvet!": "Your hair has a new colour!", "Så blev håret klippet!": "A fresh haircut!",
  "Kom ud": "Come out", "Smil!": "Smile!",
};
/* the places that have them: the hair salon, the fashion store and the wedding venue */
export const SALON_PLACES = {
  "by-frisor": [["haarfarvemaskine", 70, 470], ["klippemaskine", 940, 470]],
  "hd-modebutik2": [["fotoboks", 220, 520]],
  "hd-bryllup": [["fotoboks", 260, 520]],
  "by-lejlighed": [["tandboerste", 560, 610]],
};
export const SALON_KEYS = Object.keys(SALON_THINGS);

/* ------------------------------------------------------------------ two hands */
/* A big thing is held in front with both hands (the rest, a small thing, in the right hand). */
const TWO = new Set(["kaempetandboerste", "guitar", "bamse", "stortbamse", "ball", "pude", "hjertepude", "kage", "pizza", "surfbraet", "paraply"]);
export const twoHand = (k, T) => !!T && (TWO.has(k) || T.w >= 130 || T.h >= 150);
export const carrying = (d, CAT) => !!d.hand && twoHand(d.hand.k, CAT[d.hand.k]);

/* ------------------------------------------------------------------ what a tap does */
const SHEET = { cls: "pl-pop av-sheet", wide: true };
export function tap(ctx, it) {
  if (!A || !SALON_THINGS[it.k]) return false;
  if (it.k === "haarfarvemaskine") dyeSheet(ctx);
  else if (it.k === "klippemaskine") cutSheet(ctx);
  else if (it.k === "fotoboks") boothSheet(ctx);
  else brush(ctx, it);
  return true;
}
const idN = (g, n) => g + String(n).padStart(3, "0");
const STYLES = [...AV.hair.Short.map((n) => idN("S", n)), ...AV.hair.Long.map((n) => idN("L", n)), ...AV.hair.Crazy.map((n) => idN("C", n))];
const BEARDS = AV.hair.Beard.map((n) => idN("B", n));
const preview = (ctx, mood = "") => `<div class="av-mir-pv"><svg viewBox="-120 -330 240 350" aria-hidden="true">${A.avatar(A.look(ctx), mood)}</svg></div>`;
function open(ctx, kind, draw) {
  const st = A.st();
  const sh = ctx.sheet(draw(), SHEET);
  st.salon = { kind, el: sh.el, draw };
}
function refresh(ctx) {
  const M = A.st().salon;
  const box = M?.el.querySelector(".av-salon");
  if (box) box.outerHTML = M.draw();
  A.save(ctx);
  A.publish(ctx);
  A.redraw(ctx);
}

/* the hair dye machine: every hair colour of the original */
function dyeSheet(ctx) {
  const t = ctx.t;
  open(ctx, "dye", () => `<div class="av-salon"><h2>🎨 ${A.esc(t("Hårfarvemaskine"))}</h2>${preview(ctx)}<h3>${A.esc(t("Din hårfarve"))}</h3><div class="av-swatches">${AV.sw.hair.map(([col], i) => `<button class="av-swb${A.st().d.me.hairc === col ? " on" : ""}" data-act="salon" data-k="dye:${i}" style="background:${col}" aria-label="${i + 1}"></button>`).join("")}</div><div class="pl-pop-b"><button class="btn" data-close>${A.esc(t("Færdig"))}</button></div></div>`);
}
/* the haircut machine: every hairstyle and beard */
function cutSheet(ctx) {
  const t = ctx.t;
  open(ctx, "cut", () => `<div class="av-salon"><h2>✂️ ${A.esc(t("Klippemaskine"))}</h2>${preview(ctx)}<h3>${A.esc(t("Din frisure"))}</h3><div class="av-mir-b">${[["prev", "◀"], ["next", "▶"], ["S", "Kort hår"], ["L", "Langt hår"], ["C", "Skørt hår"], ["bald", "🥚"], ["beard", "Skæg"], ["nobeard", "Intet skæg"]].map(([k, l]) => `<button class="pl-chip" data-act="salon" data-k="cut:${k}">${k.length < 3 ? l : A.esc(t(l))}</button>`).join("")}</div><div class="pl-pop-b"><button class="btn" data-close>${A.esc(t("Færdig"))}</button></div></div>`);
}
/* the photo booth: four pictures in a row */
function boothSheet(ctx) {
  const t = ctx.t;
  open(ctx, "booth", () => {
    const strip = A.st().salon?.strip;
    return `<div class="av-salon"><h2>📸 ${A.esc(t("Fotoboks"))}</h2>${strip ? `<h3>${A.esc(t("Fotostrimlen"))}</h3><div class="av-strip">${strip.map((s) => `<figure><svg viewBox="-120 -320 240 340" aria-hidden="true">${A.avatar(s.me, s.mood)}</svg></figure>`).join("")}</div>` : preview(ctx)}<div class="av-booth-c" aria-live="polite"></div><div class="pl-pop-b"><button class="btn" data-act="salon" data-k="booth:go">📸 ${A.esc(t("Tag 4 billeder"))}</button><button class="btn soft" data-close>${A.esc(t("Færdig"))}</button></div></div>`;
  });
}
const POSES = ["happy", "surprised", "kiss", "laughter", "wink", "celebrate", "hearteyes", "smug"].filter((id) => AV.expr.some(([x]) => x === id));
function booth(ctx) {
  const st = A.st(), M = st.salon;
  if (!M || M.busy) return;
  M.busy = true;
  M.strip = null;
  const shots = [];
  const label = (txt) => {
    const el = M.el.querySelector(".av-booth-c");
    if (el) el.textContent = txt;
  };
  const shoot = (i) => {
    if (!M.el.isConnected) return (M.busy = false);
    const t = ctx.t;
    const steps = ["3", "2", "1", t("Smil!")];
    steps.forEach((s, j) => setTimeout(() => label(s), j * 450));
    setTimeout(() => {
      if (!M.el.isConnected) return (M.busy = false);
      const mood = `x:${POSES[(i * 3 + Math.floor(Math.random() * 3)) % POSES.length]}`;
      shots.push({ me: { ...st.d.me }, mood });
      A.sfx("pop");
      const f = document.createElement("div");
      f.className = "av-flash";
      (M.el.querySelector(".av-salon") || M.el).appendChild(f);
      setTimeout(() => f.remove(), 450);
      const d = new Date();
      (st.d.photos ||= []).push({ me: { ...st.d.me }, mood, d: `${d.getDate()}/${d.getMonth() + 1}` });
      if (i < 3) setTimeout(() => shoot(i + 1), 700);
      else {
        st.d.photos = st.d.photos.slice(-12);
        M.strip = shots;
        M.busy = false;
        A.save(ctx);
        label("");
        const box = M.el.querySelector(".av-salon");
        if (box) box.outerHTML = M.draw();
      }
    }, 1800);
  };
  shoot(0);
}

/* the toothbrush: brush, with foam */
function brush(ctx, it) {
  const st = A.st(), t = ctx.t;
  A.sfx("pop");
  setTimeout(() => A.sfx("pop"), 280);
  setTimeout(() => A.sfx("pop"), 560);
  A.flash(ctx, "yummy", 2400);
  A.floatIcons(ctx, st.d.ax, st.d.ay - 250, ["🪥", "🫧", "🫧", "✨"]);
  const body = ctx.root.querySelector(".pl-me .pl-body");
  body?.classList.add("brushing");
  setTimeout(() => body?.classList.remove("brushing"), 2400);
  ctx.toast?.(`🪥 ${t("Børster tænder")}`);
  void it;
}

/* a button in a sheet */
export function act(ctx, k) {
  const st = A.st(), me = st.d.me;
  if (k.startsWith("dye:")) {
    me.hairc = AV.sw.hair[+k.slice(4)]?.[0] || me.hairc;
    A.sfx("pop");
  } else if (k.startsWith("cut:")) {
    const m = k.slice(4), cur = Math.max(0, STYLES.indexOf(me.hs));
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    if (m === "prev") me.hs = STYLES[(cur + STYLES.length - 1) % STYLES.length];
    else if (m === "next") me.hs = STYLES[(cur + 1) % STYLES.length];
    else if (m === "S") me.hs = idN("S", pick(AV.hair.Short));
    else if (m === "L") me.hs = idN("L", pick(AV.hair.Long));
    else if (m === "C") me.hs = idN("C", pick(AV.hair.Crazy));
    else if (m === "bald") me.hs = "";
    else if (m === "beard") me.bd = pick(BEARDS);
    else if (m === "nobeard") me.bd = "";
    A.sfx("clap");
  } else if (k === "booth:go") return booth(ctx);
  refresh(ctx);
}

export const SALON_CSS = `
.av-swatches { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 8px 0; max-width: 520px; }
.av-swb { width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${OL}; cursor: pointer; padding: 0; }
.av-swb.on { box-shadow: 0 0 0 4px #FFD93D; }
.av-strip { display: flex; flex-direction: column; gap: 6px; background: #fff; border: 3px solid ${OL}; border-radius: 8px; padding: 8px; width: 130px; margin: 6px auto; }
.av-strip figure { margin: 0; border: 2px solid ${OL}; background: #FFF3B0; }
.av-strip svg { width: 100%; height: 96px; display: block; }
.av-booth-c { font: 900 36px system-ui, sans-serif; min-height: 44px; text-align: center; color: ${OL}; }
.pl-body.brushing .pl-arm.r { animation: avbrush .22s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 0 0; }
@keyframes avbrush { to { transform: rotate(-18deg); } }
.pl-body.twohand .pl-arm { transition: none; }
`;
