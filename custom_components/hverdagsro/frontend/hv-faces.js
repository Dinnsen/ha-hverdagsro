/* Hverdagsro – what a figure can do, as the original's characters can: make any of 32 expressions, dance (six dances), talk
   with a moving mouth, make a face when it eats, look in the mirror (and change hair, clothes and colours there) and
   have its picture taken. Tap the head of your figure for the menu of expressions and dances. When a radio or a speaker
   plays, the people in the room dance to it. Our own drawings and movements. */
import { OL } from "./hv-playcat.js";
import { AV, hairOf, randomLook } from "./hv-avatars.js";

let A = null; // { st, layer, cam, redraw, save, sfx, voice, floatIcons, avatar, look, esc, W }
export function init(api) {
  A = api;
}
const NS = "http://www.w3.org/2000/svg";
export const DANCES = [["1", "💃"], ["2", "🕺"], ["3", "🤸"], ["Prom", "👗"], ["PoolYoga", "🧘"], ["PoolYoga2", "🏊"]];
const ICONS = { laughter: ["😂"], celebrate: ["🎉"], kiss: ["😘", "❤️"], hearteyes: ["😍"], sad: ["💧"], sob: ["😭"], angry: ["💢"], rage: ["🔥"], scream: ["😱"], confused: ["❓"], creepy: ["👻"], dead: ["💀"], freezing: ["🥶"], warm: ["🥵"], fart: ["💨"], yummy: ["😋"], sick: ["🤢"], heartbreak: ["💔"], smug: ["😏"], pleading: ["🥺"], hyper: ["⚡"], flushed: ["😳"], evilkiss: ["💋"], evilsmirk: ["😈"], grimace: ["😬"], rolling: ["🙄"], wink: ["😉"], happy: ["😊"], surprised: ["❗"], sleepy: ["💤"] };

/* ------------------------------------------------------------------ the menu over your figure */
export function close(ctx) {
  A?.layer(ctx)?.querySelectorAll(".av-menu").forEach((n) => n.remove());
}
export function menu(ctx, tab = "expr") {
  const st = A.st(), layer = A.layer(ctx);
  if (!layer) return;
  close(ctx);
  const t = ctx.t, me = A.look(ctx), g = document.createElementNS(NS, "g");
  g.setAttribute("class", "av-menu");
  const cx = A.cam() + A.W / 2, cols = 8, cell = 64;
  let inner = "";
  if (tab === "expr") {
    inner = AV.expr.map(([id, da], i) => {
      const x = (i % cols) * cell - (cols * cell) / 2, y = Math.floor(i / cols) * 70;
      return `<g class="av-do" data-pl="avdo" data-k="x:${id}" role="button" aria-label="${A.esc(t(da))}" transform="translate(${x} ${y})"><rect x="2" y="0" width="60" height="64" rx="14" fill="#fff" stroke="${OL}" stroke-width="3"/><svg x="6" y="3" width="52" height="46" viewBox="-84 -262 168 150" pointer-events="none">${A.avatar({ ...me, expr: "" }, `x:${id}`)}</svg><text x="32" y="60" text-anchor="middle" class="av-l">${A.esc(t(da)).slice(0, 11)}</text></g>`;
    }).join("");
  } else {
    inner = `${DANCES.map(([id, em], i) => {
      const x = (i % 4) * 100 - 200 + 4, y = Math.floor(i / 4) * 90 + 10, da = AV.dance.find((d) => d[0] === id)?.[1] || id;
      return `<g class="av-do" data-pl="avdo" data-k="d:${id}" role="button" aria-label="${A.esc(t(da))}" transform="translate(${x} ${y})"><rect width="92" height="80" rx="16" fill="${st.dance === id ? "#FFF3B0" : "#fff"}" stroke="${OL}" stroke-width="3"/><text x="46" y="38" text-anchor="middle" font-size="32">${em}</text><text x="46" y="68" text-anchor="middle" class="av-l">${A.esc(t(da))}</text></g>`;
    }).join("")}<g class="av-do" data-pl="avdo" data-k="d:" role="button" transform="translate(204 100)"><rect width="92" height="80" rx="16" fill="#fff" stroke="${OL}" stroke-width="3"/><text x="46" y="38" text-anchor="middle" font-size="32">⏹️</text><text x="46" y="68" text-anchor="middle" class="av-l">${A.esc(t("Stop"))}</text></g>`;
  }
  const tabs = [["expr", "😀", "Udtryk"], ["dance", "💃", "Dans"]].map(([k, em, n], i) => `<g class="av-do" data-pl="avtab" data-k="${k}" role="button" transform="translate(${-110 + i * 120} -52)"><rect width="108" height="38" rx="19" fill="${tab === k ? "#9B5DE5" : "#fff"}" stroke="${OL}" stroke-width="3"/><text x="54" y="26" text-anchor="middle" class="av-t" fill="${tab === k ? "#fff" : OL}">${em} ${A.esc(t(n))}</text></g>`).join("");
  g.innerHTML = `<g transform="translate(${cx} 268)"><rect x="-282" y="-66" width="564" height="${tab === "expr" ? 348 : 214}" rx="30" fill="#FFF8EC" opacity=".96" stroke="${OL}" stroke-width="4"/>${tabs}<g transform="translate(0 0)">${inner}</g></g>`;
  layer.appendChild(g);
  clearTimeout(st.avMenuT);
  st.avMenuT = setTimeout(() => g.remove(), 12000);
}
/* A tap in the menu. */
export function pick(ctx, k) {
  const st = A.st();
  if (k.startsWith("d:")) {
    st.dance = k.slice(2);
    A.sfx(st.dance ? "music" : "tap");
    close(ctx);
    return A.redraw(ctx);
  }
  const id = k.slice(2);
  close(ctx);
  flash(ctx, id, 4200);
}
/* Make an expression for a while, with a little sound and a symbol over the head. */
export function flash(ctx, id, ms = 3200) {
  const st = A.st();
  st.mood = `x:${id}`;
  clearTimeout(st.moodT);
  st.moodT = setTimeout(() => {
    st.mood = "";
    A.redraw(ctx);
  }, ms);
  if (id === "sleepy") A.sfx("snore");
  else if (["laughter", "celebrate", "hyper"].includes(id)) A.sfx("clap");
  else if (["kiss", "evilkiss", "wink", "yummy"].includes(id)) A.sfx("pop");
  else A.voice("person");
  if (ICONS[id]) A.floatIcons(ctx, st.d.ax, st.d.ay - 280, ICONS[id]);
  A.redraw(ctx);
}

/* ------------------------------------------------------------------ talking, and dancing to the radio */
/* A mouth that moves while it talks. */
export function talk(body, text) {
  if (!body) return;
  body.classList.add("talking");
  setTimeout(() => body.classList.remove("talking"), Math.min(3200, 500 + String(text).length * 70));
}
const MUSIC = new Set(["radio", "speaker", "piano", "tv", "screen"]);
/* The dance the people of a room do now: the one of a radio or a speaker that is on, else none. */
export function danceIn(room, shapeOf) {
  if (!room?.items) return "";
  return room.items.some((it) => it.on && MUSIC.has(shapeOf(it.k)) && shapeOf(it.k) !== "tv" && shapeOf(it.k) !== "screen") ? "1" : "";
}
const NPC_DANCES = ["1", "2", "3", "Prom"];
/* Which dance a person of the room does to the radio. */
export const danceFor = (who) => NPC_DANCES[[...String(who)].reduce((n, c) => n + c.charCodeAt(0), 0) % 4];
export const danceClass = (id) => (id ? ` av-dance d${id}` : "");

/* ------------------------------------------------------------------ the mirror and the camera */
const PICS = 12;
export function mirror(ctx) {
  const st = A.st(), t = ctx.t;
  const draw = () => {
    const me = A.look(ctx);
    const photos = (st.d.photos || []).slice(-PICS);
    return `<div class="av-mir"><h2>🪞 ${A.esc(t("Spejlet"))}</h2><div class="av-mir-pv"><svg viewBox="-120 -330 240 350" aria-hidden="true">${A.avatar(me, st.mood || "")}</svg></div>
      <div class="av-mir-b">${[["hair", "💇", "Ny frisure"], ["color", "🎨", "Ny hårfarve"], ["clothes", "👕", "Nyt tøj"], ["hat", "🎩", "Hat"], ["face", "😀", "Nyt ansigt"], ["photo", "📸", "Tag et billede"], ["workshop", "🧰", "Figurværkstedet"]].map(([k, em, n]) => `<button class="pl-chip" data-act="av-mirror" data-k="${k}">${em} ${A.esc(t(n))}</button>`).join("")}</div>
      <div class="av-mir-x">${AV.expr.slice(0, 12).map(([id, da]) => `<button class="pl-chip" data-act="av-mirror" data-k="x:${id}">${A.esc(t(da))}</button>`).join("")}</div>
      ${photos.length ? `<h3>📷 ${A.esc(t("Billeder"))}</h3><div class="av-pics">${photos.map((p, i) => `<figure class="av-pic"><svg viewBox="-120 -320 240 340" aria-hidden="true">${A.avatar(p.me, p.mood || "")}</svg><figcaption>${A.esc(p.d)}</figcaption><button class="av-pic-x" data-act="av-mirror" data-k="del:${i}" aria-label="${A.esc(t("Fjern"))}">×</button></figure>`).join("")}</div>` : ""}
      <div class="pl-pop-b"><button class="btn" data-close>${A.esc(t("Færdig"))}</button></div></div>`;
  };
  const sh = ctx.sheet(draw(), { cls: "pl-pop av-sheet", wide: true });
  st.mirror = { el: sh.el, draw };
}
export function mirrorAct(ctx, k) {
  const st = A.st(), M = st.mirror;
  if (!M) return;
  const me = st.d.me, rl = randomLook();
  if (k === "hair") Object.assign(me, { hs: rl.hs, bd: rl.bd });
  else if (k === "color") me.hairc = rl.hairc;
  else if (k === "clothes") me.cl = rl.cl;
  else if (k === "hat") me.ht = me.ht === "" || me.ht == null ? Math.floor(Math.random() * AV.hat.length) : "";
  else if (k === "face") Object.assign(me, { fe: rl.fe, fb: rl.fb, fn: rl.fn, fm: rl.fm, fh: rl.fh, ff: rl.ff });
  else if (k === "workshop") {
    M.el.closest(".sheet-bg")?.close?.();
    st.build = true;
    st.tab = "mig";
    st.sel = null;
    A.save(ctx);
    return A.redraw(ctx);
  } else if (k === "photo") {
    A.sfx("pop");
    const d = new Date();
    (st.d.photos ||= []).push({ me: { ...me }, mood: st.mood || "", d: `${d.getDate()}/${d.getMonth() + 1}` });
    st.d.photos = st.d.photos.slice(-PICS);
    flashShot(M.el);
  } else if (k.startsWith("x:")) {
    st.mood = k;
    clearTimeout(st.moodT);
    st.moodT = setTimeout(() => {
      st.mood = "";
      A.redraw(ctx);
    }, 5000);
  } else if (k.startsWith("del:")) st.d.photos.splice(+k.slice(4), 1);
  A.save(ctx);
  const box = M.el.querySelector(".av-mir");
  if (box) box.outerHTML = M.draw();
  A.redraw(ctx);
}
function flashShot(el) {
  const f = document.createElement("div");
  f.className = "av-flash";
  (el.querySelector(".av-mir") || el).appendChild(f);
  setTimeout(() => f.remove(), 500);
}
void hairOf;

export const FACES_CSS = `
.av-do { cursor: pointer; }
.av-do:hover rect { fill: #FFF3B0; }
.av-l { font: 800 10px system-ui, sans-serif; fill: ${OL}; }
.av-t { font: 800 14px system-ui, sans-serif; }
.av-menu { animation: avin .18s ease-out; }
@keyframes avin { from { opacity: 0; } }
.pl-body.talking .av-mouth { animation: avflap .2s steps(2) infinite; transform-box: fill-box; transform-origin: 50% 30%; }
@keyframes avflap { 50% { transform: scale(1, .4); } }
.av-head, .av-torso { transform-box: fill-box; }
.av-head { transform-origin: 50% 88%; }
.av-torso { transform-origin: 50% 100%; }
.av-dance .pl-arm.l { transform-box: fill-box; transform-origin: 100% 0; }
.av-dance .pl-arm.r { transform-box: fill-box; transform-origin: 0 0; }
.av-dance .pl-leg { transform-box: fill-box; transform-origin: 50% 0; }
.av-dance.d1 .av-head { animation: avrock 1s ease-in-out infinite; }
.av-dance.d1 .av-torso { animation: avbounce .5s ease-in-out infinite; }
.av-dance.d1 .pl-arm.l { animation: avarm .5s ease-in-out infinite; }
.av-dance.d1 .pl-arm.r { animation: avarm .5s ease-in-out infinite reverse; }
.av-dance.d2 .pl-arm.l { animation: avwave .6s ease-in-out infinite; }
.av-dance.d2 .pl-arm.r { animation: avwave .6s ease-in-out infinite reverse; }
.av-dance.d2 .pl-leg.l { animation: avsway .6s ease-in-out infinite; }
.av-dance.d2 .pl-leg.r { animation: avsway .6s ease-in-out infinite reverse; }
.av-dance.d2 .av-head { animation: avrock .6s ease-in-out infinite; }
.av-dance.d3 .pl-arm.l { animation: avup .5s ease-in-out infinite; }
.av-dance.d3 .pl-arm.r { animation: avup .5s ease-in-out infinite; }
.av-dance.d3 .pl-leg.l, .av-dance.dProm .pl-leg.l { animation: avjump .5s ease-in-out infinite; }
.av-dance.d3 .pl-leg.r { animation: avjump .5s ease-in-out infinite; }
.av-dance.d3 .av-torso { animation: avbounce .5s ease-in-out infinite; }
.av-dance.dProm .av-torso { animation: avsway2 1.4s ease-in-out infinite; }
.av-dance.dProm .pl-arm.l { animation: avarm 1.4s ease-in-out infinite; }
.av-dance.dProm .pl-arm.r { animation: avarm 1.4s ease-in-out infinite reverse; }
.av-dance.dProm .av-head { animation: avrock 1.4s ease-in-out infinite; }
.av-dance.dPoolYoga .pl-arm.l, .av-dance.dPoolYoga .pl-arm.r { animation: avup 3s ease-in-out infinite; }
.av-dance.dPoolYoga .av-torso { animation: avbend 3s ease-in-out infinite; }
.av-dance.dPoolYoga .av-head { animation: avrock 3s ease-in-out infinite; }
.av-dance.dPoolYoga2 .av-torso { animation: avfold 3.4s ease-in-out infinite; }
.av-dance.dPoolYoga2 .av-head { animation: avrock 3.4s ease-in-out infinite; }
.av-dance.dPoolYoga2 .pl-arm.l { animation: avwave 3.4s ease-in-out infinite; }
.av-dance.dPoolYoga2 .pl-arm.r { animation: avwave 3.4s ease-in-out infinite reverse; }
@keyframes avrock { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
@keyframes avbounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
@keyframes avarm { 0%, 100% { transform: rotate(-30deg); } 50% { transform: rotate(30deg); } }
@keyframes avwave { 0%, 100% { transform: rotate(-70deg); } 50% { transform: rotate(10deg); } }
@keyframes avup { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-150deg); } }
@keyframes avsway { 0%, 100% { transform: rotate(-12deg); } 50% { transform: rotate(12deg); } }
@keyframes avjump { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes avsway2 { 0%, 100% { transform: translateX(-8px) rotate(-3deg); } 50% { transform: translateX(8px) rotate(3deg); } }
@keyframes avbend { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-10deg) translateY(-4px); } }
@keyframes avfold { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(18deg); } }
.av-mir { text-align: center; position: relative; }
.av-mir-pv svg { width: 220px; height: 320px; background: #F3E9FF; border-radius: 24px; border: 4px solid #2B2340; }
.av-mir-b, .av-mir-x { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 8px 0; }
.av-pics { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.av-pic { position: relative; margin: 0; background: #fff; border: 3px solid #2B2340; border-radius: 6px; padding: 6px 6px 2px; width: 92px; transform: rotate(-2deg); }
.av-pic:nth-child(even) { transform: rotate(2deg); }
.av-pic svg { width: 100%; height: 110px; background: #FFF3B0; }
.av-pic figcaption { font: 800 11px system-ui, sans-serif; }
.av-pic-x { position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #2B2340; background: #fff; font-weight: 900; cursor: pointer; }
.av-flash { position: absolute; inset: 0; background: #fff; animation: avflash .45s ease-out forwards; border-radius: 24px; pointer-events: none; }
@keyframes avflash { from { opacity: .95; } to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .av-dance *, .pl-body.talking .av-mouth { animation: none !important; } }
`;
export const FACES_EN = { Stop: "Stop", Spejlet: "The mirror", "Ny frisure": "New hairstyle", "Ny hårfarve": "New hair colour", "Nyt tøj": "New clothes", Hat: "Hat", "Nyt ansigt": "New face", "Tag et billede": "Take a picture", Figurværkstedet: "The figure workshop", Billeder: "Pictures", Udtryk: "Expression", Dans: "Dance" };
