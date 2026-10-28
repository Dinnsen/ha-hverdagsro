/* Hverdagsro – playing with the pet in the game: give it a treat, throw the ball, cuddle it, and teach it tricks
   (sit, paw, roll over, jump, play dead). Tap the pet for the menu; drag it to move it. It is happier the more it is
   played with, and the hearts of the day show in the menu. */
import { esc } from "./hv-core.js";
import { OL } from "./hv-playcat.js";

let A = null; // { st, save, floatIcons, say, layer, sfx, voice, rw, FLOOR, H }
export function init(api) {
  A = api;
}
const NS = "http://www.w3.org/2000/svg";
export const DOS = [["treat", "🦴", "Godbid"], ["ball", "🎾", "Leg med bold"], ["cuddle", "🤗", "Kæl"], ["paw", "🐾", "Giv pote"], ["sit", "🧘", "Sit"], ["roll", "🔄", "Rul rundt"], ["jump", "⤴️", "Hop"], ["dead", "💤", "Død"]];
const voiceOf = (m) => ({ kat: "cat", drage: "dino" })[m.pet?.kind] || "dog";
const today = () => new Date().toISOString().slice(0, 10);
/* The pet's hearts today (0–5). */
export function hearts() {
  const j = A.st().d.petJoy;
  return j && j.d === today() ? Math.min(5, j.n || 0) : 0;
}
function heartUp() {
  const d = A.st().d, n = hearts();
  d.petJoy = { d: today(), n: Math.min(5, n + 1) };
  return n < 5 && n + 1 === 5;
}
/* The pet is busy while it runs after the ball and brings it back: it cannot be grabbed then. */
const RUN_MS = 2300;
export const busy = () => (A?.st().petBusy || 0) > Date.now();
/* The menu over the pet. */
export function menu(ctx) {
  const st = A.st(), layer = A.layer(ctx);
  if (!layer) return;
  // The pet is off after the ball: asked now, the menu comes up as soon as it is back.
  if (busy()) {
    st.petAsk = true;
    return;
  }
  layer.querySelectorAll(".pt-menu").forEach((n) => n.remove());
  const x = st.d.px, y = st.d.py, rw = A.rw(), g = document.createElementNS(NS, "g");
  g.setAttribute("class", "pt-menu");
  const cy = Math.max(150, y - 230);
  g.innerHTML = `<g transform="translate(${Math.max(200, Math.min(rw - 200, x))} ${cy})"><rect x="-196" y="-88" width="392" height="176" rx="28" fill="#fff" opacity=".8" stroke="${OL}" stroke-width="3"/><rect x="-74" y="-126" width="148" height="30" rx="15" fill="#fff" stroke="${OL}" stroke-width="3"/><text y="-105" text-anchor="middle" class="pt-h">${"❤️".repeat(hearts())}${"🤍".repeat(5 - hearts())}</text>${DOS.map(([k, em, label], i) => {
    const px = ((i % 4) - 1.5) * 92, py = i < 4 ? -50 : 36;
    return `<g class="pt-do" data-pl="petdo" data-k="${k}" transform="translate(${px.toFixed(1)} ${py.toFixed(1)})" role="button" aria-label="${esc(ctx.t(label))}"><circle r="27" fill="#fff" stroke="${OL}" stroke-width="3.5"/><text y="10" text-anchor="middle" font-size="27">${em}</text><text y="44" text-anchor="middle" class="pt-l">${esc(ctx.t(label))}</text></g>`;
  }).join("")}</g>`;
  layer.appendChild(g);
  clearTimeout(st.petMenuT);
  st.petMenuT = setTimeout(() => g.remove(), 6000);
}
export const closeMenu = (ctx) => A?.layer(ctx)?.querySelectorAll(".pt-menu").forEach((n) => n.remove());
/* Do it. */
export function act(ctx, kind) {
  const st = A.st(), m = ctx.member(st.kid), d = st.d;
  closeMenu(ctx);
  const el = ctx.root.querySelector(".pl-pet"), body = el?.querySelector(".pl-petb");
  if (!el || !m?.pet) return;
  const name = m.pet.name || ctx.t("Kæledyret"), cls = (c, ms) => {
    body?.classList.remove("pt-sit", "pt-roll", "pt-paw", "pt-dead", "pt-eat", "pt-wiggle");
    void body?.getBBox?.();
    body?.classList.add(c);
    setTimeout(() => body?.classList.remove(c), ms);
  };
  const top = d.py - 150;
  let full = false;
  if (kind === "treat") {
    // A bone flies to the pet, and it is eaten.
    const layer = A.layer(ctx), g = document.createElementNS(NS, "g");
    g.setAttribute("class", "pt-treat");
    g.innerHTML = `<text x="${d.ax + 60}" y="${d.ay - 120}" font-size="34" style="--dx:${d.px - d.ax - 60}px;--dy:${d.py - 70 - (d.ay - 120)}px">🦴</text>`;
    layer?.appendChild(g);
    setTimeout(() => g.remove(), 700);
    setTimeout(() => {
      cls("pt-eat", 1200);
      A.sfx("yum");
      A.floatIcons(ctx, d.px, top, ["😋", "❤️"]);
    }, 650);
    full = heartUp();
  } else if (kind === "ball") {
    // The ball is thrown; the pet runs after it and brings it back.
    const rw = A.rw(), tx = Math.max(80, Math.min(rw - 80, d.ax + (d.ax < rw / 2 ? 1 : -1) * (260 + Math.random() * 160))), ty = Math.min(A.H - 20, A.FLOOR + 60 + Math.random() * 100);
    const layer = A.layer(ctx), ball = document.createElementNS(NS, "g");
    ball.setAttribute("class", "pt-ball");
    ball.innerHTML = `<circle cx="${d.ax + 50}" cy="${d.ay - 110}" r="16" fill="#C6E85A" stroke="${OL}" stroke-width="3" style="--dx:${tx - d.ax - 50}px;--dy:${ty - 16 - (d.ay - 110)}px"/>`;
    layer?.appendChild(ball);
    A.sfx("bounce");
    A.voice(voiceOf(m));
    const back = [d.px, d.py];
    st.petBusy = Date.now() + RUN_MS;
    setTimeout(() => {
      el.setAttribute("transform", `translate(${tx} ${ty}) scale(.8)`);
      cls("pt-wiggle", 800);
    }, 500);
    setTimeout(() => {
      ball.remove();
      const bx = Math.max(60, Math.min(rw - 60, d.ax + (back[0] < d.ax ? -120 : 120))), by = Math.min(A.H - 8, d.ay + 10);
      el.setAttribute("transform", `translate(${bx} ${by}) scale(.8)`);
      d.px = bx;
      d.py = by;
      A.save(ctx);
    }, 1400);
    setTimeout(() => {
      A.floatIcons(ctx, d.px, d.py - 150, ["🎾", "❤️"]);
      A.sfx("pop");
    }, 2150);
    // Back again: a tap on the pet in the meantime now opens its menu.
    setTimeout(() => {
      st.petBusy = 0;
      if (st.petAsk) {
        st.petAsk = false;
        menu(ctx);
      }
    }, RUN_MS);
    full = heartUp();
  } else if (kind === "cuddle") {
    cls("pt-wiggle", 1400);
    el.classList.add("happy");
    A.sfx("hug");
    A.floatIcons(ctx, d.px, top, ["❤️", "🥰", "❤️"]);
    full = heartUp();
  } else if (kind === "paw") {
    cls("pt-paw", 1300);
    A.voice(voiceOf(m));
    A.say(ctx, d.px, d.py + 60, `🐾 ${name}`);
  } else if (kind === "sit") {
    cls("pt-sit", 1600);
    A.voice(voiceOf(m));
  } else if (kind === "roll") {
    cls("pt-roll", 1000);
    A.sfx("whoosh");
  } else if (kind === "jump") {
    el.classList.remove("jump");
    void el.getBBox?.();
    el.classList.add("jump");
    setTimeout(() => el.classList.remove("jump"), 700);
    A.sfx("bounce");
  } else if (kind === "dead") {
    cls("pt-dead", 1800);
    setTimeout(() => A.floatIcons(ctx, d.px, top, ["💤"]), 300);
  }
  if (["paw", "sit", "roll", "jump", "dead"].includes(kind)) {
    // A trick earns a little cheer, and a heart for every second one.
    setTimeout(() => A.floatIcons(ctx, d.px, top, ["⭐"]), 600);
    st.tricks = (st.tricks || 0) + 1;
    if (st.tricks % 2 === 0) full = heartUp();
  }
  if (full) setTimeout(() => A.say(ctx, d.px, d.py + 60, ctx.t("{name} er glad i dag! ❤️❤️❤️❤️❤️", { name })), 900);
  A.save(ctx);
}

export const PET_CSS = `
.pt-menu .pt-do { cursor: pointer; }
.pt-menu .pt-do:hover circle { fill: #FFF3B0; }
.pt-menu { animation: ptin .2s ease-out; }
@keyframes ptin { from { opacity: 0; } }
.pt-l { font: 800 12px system-ui, sans-serif; fill: #2B2340; paint-order: stroke; stroke: #fff; stroke-width: 4px; }
.pt-h { font-size: 15px; }
.pl-pet .pl-petb.pt-sit { animation: ptsit 1.6s ease-in-out; }
@keyframes ptsit { 20%, 80% { transform: scale(1.06, .78); } }
.pl-pet .pl-petb.pt-roll { animation: ptroll 1s ease-in-out; transform-origin: 50% 70%; }
@keyframes ptroll { to { transform: rotate(360deg); } }
.pl-pet .pl-petb.pt-paw { animation: ptpaw 1.3s ease-in-out; }
@keyframes ptpaw { 20%, 70% { transform: rotate(-10deg) translateY(-6px); } }
.pl-pet .pl-petb.pt-dead { animation: ptdead 1.8s ease-in-out; transform-origin: 50% 100%; }
@keyframes ptdead { 20%, 80% { transform: rotate(90deg) translate(-20px, -10px); } }
.pl-pet .pl-petb.pt-eat { animation: pteat .3s ease-in-out 4; }
@keyframes pteat { 50% { transform: scale(1.04, .94); } }
.pl-pet .pl-petb.pt-wiggle { animation: ptwig .2s ease-in-out 6; }
@keyframes ptwig { 50% { transform: rotate(6deg); } }
.pt-treat text, .pt-ball circle { animation: ptfly .7s cubic-bezier(.3,.7,.5,1) forwards; }
.pt-ball circle { animation-duration: .55s; }
@keyframes ptfly { 50% { transform: translate(calc(var(--dx) * .5), calc(var(--dy) * .5 - 90px)); } to { transform: translate(var(--dx), var(--dy)); } }
@media (prefers-reduced-motion: reduce) { .pl-pet .pl-petb[class*="pt-"], .pt-treat text, .pt-ball circle { animation: none; } }
`;
export const PET_EN = { Godbid: "Treat", "Leg med bold": "Play ball", Kæl: "Cuddle", "Giv pote": "Paw", Sit: "Sit", "Rul rundt": "Roll over", Hop: "Jump", Død: "Play dead", Kæledyret: "The pet", "{name} er glad i dag! ❤️❤️❤️❤️❤️": "{name} is happy today! ❤️❤️❤️❤️❤️" };
