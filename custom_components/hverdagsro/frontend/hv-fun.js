/* Hverdagsro – Familieleg: the whole family plays together in the play world.
   The mission of the day, the star hunt, hide and seek, fun tasks from the grown-ups, calling the family over, and the
   party when the family reaches a goal. The state lives in Home Assistant (ctx.data.fun); this draws it and sends
   what happens. hv-play hands over what it knows of the game through init(api). */
import { esc } from "./hv-core.js";
import * as World from "./hv-world.js";
import * as Sound from "./hv-sound.js";
import * as Life from "./hv-life.js";

let A = null; // the game: { st, presenceKey, goTo, say, confetti, floatIcons, redraw, placeName, publish, coinPop, draw }
export function init(api) {
  A = api;
}
const EMPTY = { tasks: [], hunt: null, hide: null, party: null, day: null };
export const funOf = (ctx) => ({ ...EMPTY, ...(ctx.data?.fun || {}) });
const nameOf = (ctx, id) => ctx.member(id)?.name || "";
const ago = (iso) => (iso ? Date.now() - new Date(iso).getTime() : Infinity);

/* What the mission of the day asks, in words. */
const MISSION = {
  wave: ["👋", "Vink til hinanden {n} gange"],
  visit: ["🗺️", "Besøg {n} forskellige steder"],
  talk: ["💬", "Snak med {n} figurer"],
  meet: ["🤝", "Mød hinanden et sted i spillet"],
  build: ["🛋️", "Sæt {n} nye ting op"],
  hug: ["🤗", "Giv {n} krammere"],
  star: ["⭐", "Find dagens {n} stjerner"],
};
/* Things to hide in hide and seek. */
export const HIDE_THINGS = ["skattekiste", "teddy", "ball", "gaveaeske", "hvalpebamse", "enhjoerning", "pakker", "kylling"];

/* ------------------------------------------------------------------ talking to Home Assistant */
async function send(ctx, action, payload = {}) {
  try {
    const res = await ctx.ws("fun", { action, ...payload });
    if (res) ctx.data.fun = res;
    return res;
  } catch (err) {
    ctx.toast(String(err?.message || err));
    return null;
  }
}
/* Something happened that today's mission may count. Only sent when it counts. */
export function event(ctx, kind, key = "") {
  const day = funOf(ctx).day, st = A?.st();
  if (!day || day.paid || day.kind !== kind || !st) return;
  if ((kind === "visit" || kind === "star") && (!key || (day.keys || []).includes(key))) return;
  send(ctx, "event", { member: st.kid, kind, key }).then((res) => res && refresh(ctx));
}

/* ------------------------------------------------------------------ where things can be hidden: the house */
export function homeSpaces(ctx) {
  const out = World.houseRooms(ctx).map((h) => (h.kid ? `room:${h.kid}` : h.id));
  for (const k of ctx.children()) if (!out.includes(`room:${k.id}`)) out.push(`room:${k.id}`);
  out.push("have");
  return [...new Set(out)];
}
/* From a key others see (room:<id>, a place) to where to go. */
export function goKey(key) {
  const st = A.st(), m = String(key).match(/^room:(.+)$/);
  if (m) return m[1] === st.kid ? "vaerelse" : `visit:${m[1]}`;
  return key;
}
function placeLabel(ctx, key) {
  const m = String(key).match(/^room:(.+)$/);
  if (m) return m[1] === A.st().kid ? ctx.t("Mit værelse") : ctx.t("{name}s værelse", { name: nameOf(ctx, m[1]) });
  return A.placeName(ctx, key) || key;
}
/* Today's three stars, the same for the whole family: from the date. */
function dayStars(ctx) {
  const day = funOf(ctx).day;
  if (!day || day.kind !== "star") return [];
  const spaces = homeSpaces(ctx), seed = [...day.date].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 11);
  return Array.from({ length: day.need }, (_, i) => {
    const h = (seed * (i + 7) * 2654435761) >>> 0;
    return { id: `${day.date}:${i}`, space: spaces[h % spaces.length], x: 140 + (h % 720), y: 360 + ((h >> 8) % 230), day: true };
  }).filter((s) => !(day.keys || []).includes(s.id));
}

/* ------------------------------------------------------------------ on the stage */
const starSvg = (x, y, id, day) =>
  `<g class="fun-star" data-pl="star" data-k="${esc(id)}"${day ? ' data-day="1"' : ""} transform="translate(${x} ${y})" role="button" aria-label="★"><circle r="46" fill="transparent"/><circle r="30" class="fun-glow" fill="#FFE066"/><polygon points="0,-30 8,-10 29,-9 12,4 18,25 0,13 -18,25 -12,4 -29,-9 -8,-10" fill="#FFD93D" stroke="#2B2340" stroke-width="4" stroke-linejoin="round"/><circle cx="-6" cy="-4" r="3" fill="#2B2340"/><circle cx="6" cy="-4" r="3" fill="#2B2340"/></g>`;
export function overlay(ctx) {
  if (!A) return "";
  const st = A.st(), here = A.presenceKey(), f = funOf(ctx);
  let s = "";
  if (st.build) return s;
  const hunt = f.hunt;
  if (hunt && !hunt.done) for (const star of hunt.stars) if (star.space === here && !hunt.found[star.id]) s += starSvg(star.x, star.y, star.id, false);
  for (const star of dayStars(ctx)) if (star.space === here) s += starSvg(star.x, star.y, star.id, true);
  const hide = f.hide;
  if (hide && hide.space === here) {
    const mine = hide.by === st.kid, found = !!hide.found_by;
    if (mine || found)
      s += `<g class="fun-hidden${found ? " found" : ""}" pointer-events="none" transform="translate(${hide.x} ${hide.y}) scale(.7)">${A.draw(hide.thing)}<text y="${found ? -150 : -120}" text-anchor="middle" class="fun-hl">${esc(found ? `🎉 ${ctx.t("Fundet af {name}", { name: nameOf(ctx, hide.found_by) })}` : `👀 ${ctx.t("Gemt her")}`)}</text></g>`;
  }
  if (st.hiding) s += `<rect width="1000" height="700" fill="rgba(255,217,61,.12)" pointer-events="none"/>`;
  return s;
}
/* A tap on the stage: hide a thing here, or look for one (warmer, colder). True when the tap is used up. */
export function tapStage(ctx, p, target) {
  if (!A) return false;
  const st = A.st(), f = funOf(ctx), here = A.presenceKey();
  if (st.hiding) {
    const thing = st.hiding;
    st.hiding = null;
    send(ctx, "hide", { member: st.kid, space: here, x: Math.round(p.x), y: Math.round(p.y), thing }).then((res) => {
      if (!res) return;
      Sound.sfx("pop");
      A.redraw(ctx);
      A.say(ctx, p.x, p.y + 180, ctx.t("Gemt! Nu skal de andre lede."));
      A.publish(ctx, { emote: "invite" });
    });
    return true;
  }
  const hide = f.hide;
  if (!hide || hide.found_by || hide.by === st.kid || hide.space !== here || target?.closest?.("[data-pl='star'],[data-pl='bub'],[data-pl='daily']")) return false;
  const d = Math.hypot(p.x - hide.x, p.y - hide.y);
  if (d <= 75) {
    send(ctx, "seek", { member: st.kid, space: here, x: Math.round(p.x), y: Math.round(p.y) }).then((res) => {
      if (res?.hide?.found_by === st.kid) {
        A.redraw(ctx);
        A.confetti(ctx, hide.x, hide.y - 60, "#FFD93D", true);
        Sound.sfx("chest");
        A.coinPop(ctx, hide.x, hide.y - 80, 10);
      }
    });
    return true;
  }
  const hint = d < 140 ? "🔥 Brandvarmt!" : d < 240 ? "♨️ Varmt!" : d < 400 ? "🌤️ Lunkent" : "❄️ Koldt";
  A.say(ctx, p.x, p.y + 200, ctx.t(hint));
  return false;
}
export async function tapStar(ctx, el) {
  const st = A.st(), id = el.dataset.k, tr = el.getAttribute("transform").match(/translate\(([\d.]+) ([\d.]+)\)/);
  el.classList.add("got");
  Sound.sfx("coin");
  if (tr) {
    A.confetti(ctx, +tr[1], +tr[2], "#FFD93D");
    A.coinPop(ctx, +tr[1], +tr[2], el.dataset.day ? 0 : 3);
  }
  setTimeout(() => el.remove(), 500);
  if (el.dataset.day) return event(ctx, "star", id);
  const res = await send(ctx, "hunt_find", { member: st.kid, star: id });
  if (res) refresh(ctx);
}

/* ------------------------------------------------------------------ the line above the stage */
export function banner(ctx) {
  if (!A) return "";
  const st = A.st(), f = funOf(ctx), t = ctx.t, chips = [];
  const day = f.day;
  if (day && MISSION[day.kind]) {
    const [em, text] = MISSION[day.kind];
    chips.push(`<button class="fun-chip${day.paid ? " done" : ""}" data-pl="fun"><span>${em}</span>${esc(t(text, { n: day.need }))} <b>${day.paid ? "✓" : `${day.count}/${day.need}`}</b></button>`);
  }
  if (f.hunt && !f.hunt.done) {
    const left = f.hunt.stars.filter((s) => !f.hunt.found[s.id]);
    const where = [...new Set(left.map((s) => s.space))].filter((k) => k !== A.presenceKey()).slice(0, 3);
    chips.push(`<span class="fun-chip hunt"><span>⭐</span>${esc(t("Stjernejagt"))} <b>${f.hunt.stars.length - left.length}/${f.hunt.stars.length}</b>${where.map((k) => `<button data-pl="go" data-k="${esc(goKey(k))}">${esc(placeLabel(ctx, k))}</button>`).join("")}</span>`);
  }
  if (f.hide && !f.hide.found_by && f.hide.by !== st.kid) {
    const there = f.hide.space === A.presenceKey();
    chips.push(`<span class="fun-chip hide"><span>🔍</span>${esc(t("{name} har gemt noget i {place}", { name: nameOf(ctx, f.hide.by), place: placeLabel(ctx, f.hide.space) }))}${there ? ` <b>${esc(t("Tryk rundt og led!"))}</b>` : `<button data-pl="go" data-k="${esc(goKey(f.hide.space))}">${esc(t("Gå derhen"))}</button>`}</span>`);
  }
  const inv = st.invite;
  if (inv && Date.now() - inv.at < 120000 && inv.space !== A.presenceKey())
    chips.push(`<span class="fun-chip call"><span>📣</span>${esc(t("{name} kalder: kom til {place}!", { name: nameOf(ctx, inv.from), place: placeLabel(ctx, inv.space) }))}<button data-pl="go" data-k="${esc(goKey(inv.space))}">${esc(t("Kom!"))}</button></span>`);
  return chips.length ? `<div class="fun-bar">${chips.join("")}</div>` : "";
}
/* The number on the family button: what waits for me. */
export function badge(ctx) {
  if (!A) return 0;
  const st = A.st(), f = funOf(ctx), me = ctx.member(st.kid);
  if (me?.role === "parent") return f.tasks.reduce((n, task) => n + Object.values(task.done || {}).filter((v) => v === "wait").length, 0);
  // A child: tasks and challenges waiting to be done, and the challenges they made that wait for their ok.
  const todo = f.tasks.filter((task) => task.by !== st.kid && (!task.for.length || task.for.includes(st.kid)) && !task.done?.[st.kid]).length;
  return todo + f.tasks.filter((task) => task.by === st.kid).reduce((n, task) => n + Object.values(task.done || {}).filter((v) => v === "wait").length, 0);
}

/* ------------------------------------------------------------------ the family sheet */
let sheet = null;
export function openSheet(ctx) {
  sheet = ctx.sheet(`<div class="fun-sheet-in">${body(ctx)}</div>`, { wide: true, cls: "fun-sheet" });
}
export function refresh(ctx) {
  if (sheet && sheet.el.isConnected) sheet.el.querySelector(".fun-sheet-in").innerHTML = body(ctx);
  if (A && !A.st().build && !A.st().shop) A.redraw(ctx);
}
function body(ctx) {
  const st = A.st(), f = funOf(ctx), t = ctx.t, me = ctx.member(st.kid), parent = me?.role === "parent" || ctx.isParent;
  const live = Object.entries(st.peers || {}).filter(([, pe]) => pe.space && Date.now() - (pe.seen || 0) < 45000).map(([id, pe]) => [id, pe.space]);
  const kids = ctx.members();
  const sel = st.funWho || new Set(kids.map((k) => k.id));
  const who = (act, set) => kids.map((k) => `<button class="pl-chip" data-act="${act}" data-k="${esc(k.id)}" aria-pressed="${set.has(k.id)}" style="--c:${esc(k.color || "#9B5DE5")}">${esc(k.name)}</button>`).join("");
  let h = `<h2>👨‍👩‍👧‍👦 ${esc(t("Familieleg"))}</h2><p class="t-sub">${esc(t("Leg sammen hele familien, på samme tid."))}</p>`;
  // Who plays right now.
  h += `<div class="fun-sec"><b>${esc(t("Spiller lige nu"))}</b><div class="fun-row">${[[st.kid, A.presenceKey()], ...live].map(([id, sp]) => `<span class="fun-who" style="--c:${esc(ctx.member(id)?.color || "#9B5DE5")}">${esc(nameOf(ctx, id))}<small>${esc(placeLabel(ctx, sp))}</small>${id !== st.kid ? `<button class="pl-chip" data-act="fun-go" data-k="${esc(goKey(sp))}">${esc(t("Gå hen til"))}</button>` : ""}</span>`).join("")}</div>
    <button class="btn soft" data-act="fun-call">📣 ${esc(t("Kald familien hertil"))}</button></div>`;
  // The mission of the day.
  const day = f.day;
  if (day && MISSION[day.kind]) {
    const [em, text] = MISSION[day.kind];
    h += `<div class="fun-sec"><b>${esc(t("Dagens familiemission"))}</b><div class="fun-mission"><span class="fun-em">${em}</span><div><div>${esc(t(text, { n: day.need }))}</div><i class="fun-prog" style="--p:${Math.round((day.count / day.need) * 100)}%"></i><small>${esc(day.paid ? t("Klaret! Alle der hjalp, fik mønter.") : day.who.length ? t("Hjælper: {names}", { names: day.who.map((id) => nameOf(ctx, id)).join(", ") }) : t("Alle kan hjælpe. Når I når målet, får alle der hjalp, mønter."))}</small></div></div></div>`;
  }
  // The family's building site, and helping each other (hv-life).
  h += Life.siteSection(ctx) + Life.helpSection(ctx);
  // The star hunt.
  const hunt = f.hunt;
  h += `<div class="fun-sec"><b>⭐ ${esc(t("Stjernejagt"))}</b>`;
  if (hunt && !hunt.done) {
    const left = hunt.stars.filter((s) => !hunt.found[s.id]);
    h += `<p>${esc(t("{n} af {all} stjerner fundet. De er gemt rundt i huset.", { n: hunt.stars.length - left.length, all: hunt.stars.length }))}</p><div class="fun-row">${[...new Set(left.map((s) => s.space))].map((k) => `<button class="pl-chip" data-act="fun-go" data-k="${esc(goKey(k))}">${esc(placeLabel(ctx, k))} · ${left.filter((s) => s.space === k).length}</button>`).join("")}</div>${hunt.by === st.kid || parent ? `<button class="btn soft" data-act="fun-hunt-stop">${esc(t("Stop jagten"))}</button>` : ""}`;
  } else {
    if (hunt?.done) h += `<p>🎉 ${esc(t("Alle stjerner er fundet!"))}</p>`;
    h += `<p class="t-sub">${esc(t("Stjerner bliver gemt rundt i huset. Hvem er med?"))}</p><div class="fun-row">${who("fun-who", sel)}</div><div class="fun-row">${[5, 8, 12].map((n) => `<button class="btn${n === 8 ? "" : " soft"}" data-act="fun-hunt" data-k="${n}">${esc(t("{n} stjerner", { n }))}</button>`).join("")}</div>`;
  }
  h += `</div>`;
  // Hide and seek.
  const hide = f.hide;
  h += `<div class="fun-sec"><b>🔍 ${esc(t("Gemmeleg"))}</b>`;
  if (hide && !hide.found_by) {
    h += hide.by === st.kid ? `<p>${esc(t("Du har gemt noget i {place}. Nu leder de andre.", { place: placeLabel(ctx, hide.space) }))}</p><button class="btn soft" data-act="fun-hide-stop">${esc(t("Tag det frem igen"))}</button>` : `<p>${esc(t("{name} har gemt noget i {place}. Gå derhen og tryk rundt: varmt eller koldt?", { name: nameOf(ctx, hide.by), place: placeLabel(ctx, hide.space) }))}</p><button class="btn" data-act="fun-go" data-k="${esc(goKey(hide.space))}">${esc(t("Gå derhen"))}</button>${parent ? ` <button class="btn soft" data-act="fun-hide-stop">${esc(t("Stop legen"))}</button>` : ""}`;
  } else {
    if (hide?.found_by) h += `<p>🎉 ${esc(t("{name} fandt det!", { name: nameOf(ctx, hide.found_by) }))}</p>`;
    h += `<p class="t-sub">${esc(t("Vælg noget at gemme. Tryk så der, hvor det skal gemmes, så leder de andre."))}</p><div class="fun-things">${HIDE_THINGS.map((k) => `<button data-act="fun-hide" data-k="${esc(k)}" aria-label="${esc(k)}"><svg viewBox="-110 -200 220 210">${A.draw(k)}</svg></button>`).join("")}</div>`;
  }
  h += `</div>`;
  // Fun tasks.
  const mine = parent ? f.tasks : f.tasks.filter((task) => task.by === st.kid || !task.for.length || task.for.includes(st.kid));
  h += `<div class="fun-sec"><b>🎈 ${esc(t("Sjove opgaver"))}</b>`;
  h += mine.length
    ? `<ul class="fun-tasks">${mine
        .slice()
        .reverse()
        .map((task) => {
          const tag = task.real ? t("I virkeligheden") : t("I spillet"), forWho = task.for.length ? task.for.map((id) => nameOf(ctx, id)).join(", ") : t("Alle");
          let right = "";
          if (parent || task.by === st.kid) {
            const waits = Object.entries(task.done || {}).filter(([, v]) => v === "wait").map(([id]) => id);
            const oks = Object.entries(task.done || {}).filter(([, v]) => v === "ok").map(([id]) => nameOf(ctx, id));
            right = `${waits.map((id) => `<button class="btn" data-act="fun-approve" data-k="${esc(task.id)}" data-m="${esc(id)}">✓ ${esc(nameOf(ctx, id))}</button>`).join("")}${oks.length ? `<small>✓ ${esc(oks.join(", "))}</small>` : ""}<button class="pl-chip" data-act="fun-task-del" data-k="${esc(task.id)}" aria-label="${esc(t("Fjern"))}">×</button>`;
          } else {
            const s = task.done?.[st.kid];
            right = s === "ok" ? `<b>✓ ${esc(t("Godkendt"))}</b>` : s === "wait" ? `<small>${esc(task.kid ? t("Venter på {name}", { name: nameOf(ctx, task.by) }) : t("Venter på en voksen"))}</small>` : `<button class="btn" data-act="fun-done" data-k="${esc(task.id)}">${esc(t("Færdig!"))}</button>`;
          }
          const from = task.kid ? ` · ${t("fra {name}", { name: nameOf(ctx, task.by) })}` : "";
          return `<li><span class="fun-em">${esc(task.emoji || "⭐")}</span><div><div>${esc(task.title)}</div><small>${esc(tag)} · ${esc(forWho)} · 🪙 ${task.coins}${esc(from)}</small></div><div class="fun-tr">${right}</div></li>`;
        })
        .join("")}</ul>`
    : `<p class="t-sub">${esc(parent ? t("Giv børnene en lille, sjov opgave. Den dukker op i spillet.") : t("Ingen opgaver lige nu. Lav selv en udfordring til de andre!"))}</p>`;
  {
    const fw = st.funFor || new Set(), coinChoices = parent ? [3, 5, 10, 20] : [0, 1, 2, 3, 5], coins = st.funCoins ?? (parent ? 5 : 1), real = st.funReal ?? parent;
    h += `<div class="fun-new">${parent ? "" : `<b>${esc(t("Lav en udfordring til de andre"))}</b><small class="t-sub">${esc(t("Mønterne kommer fra dine egne, når du godkender."))}</small>`}<input class="input" data-fun="title" maxlength="80" value="${esc(st.funTitle || "")}" placeholder="${esc(parent ? t("Fx: Find noget rødt i huset") : t("Fx: Find min bamse i haven"))}">
      <div class="fun-row">${["⭐", "🔴", "💃", "🧦", "🎨", "🧹", "🌳", "📚", "🤗", "🍎"].map((em, i) => `<button class="pl-chip" data-act="fun-em" data-k="${em}" aria-pressed="${(st.funEm || "⭐") === em}">${em}</button>`).join("")}</div>
      <div class="fun-row"><span class="t-sub">${esc(t("Til"))}</span><button class="pl-chip" data-act="fun-for" data-k="" aria-pressed="${!fw.size}">${esc(t("Alle"))}</button>${ctx.members().filter((k) => k.id !== st.kid && (parent ? k.role === "child" : true)).map((k) => `<button class="pl-chip" data-act="fun-for" data-k="${esc(k.id)}" aria-pressed="${fw.has(k.id)}">${esc(k.name)}</button>`).join("")}</div>
      <div class="fun-row"><span class="t-sub">🪙</span>${coinChoices.map((n) => `<button class="pl-chip" data-act="fun-coins" data-k="${n}" aria-pressed="${coins === n}">${n}</button>`).join("")}<button class="pl-chip" data-act="fun-real" aria-pressed="${!!real}">${esc(real ? t("I virkeligheden") : t("I spillet"))}</button></div>
      <button class="btn" data-act="fun-task-add">${esc(parent ? t("Giv opgaven") : t("Send udfordringen"))}</button></div>`;
  }
  h += `</div><div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Luk"))}</button></div>`;
  return h;
}
/* The buttons in the sheet (the panel hands them over as acts). */
export const acts = {
  "fun-go": (el, ev, ctx) => {
    sheet?.close();
    A.goTo(ctx, el.dataset.k);
  },
  "fun-call": (el, ev, ctx) => {
    A.publish(ctx, { emote: "invite" });
    Sound.sfx("music");
    ctx.toast(ctx.t("Familien er kaldt hertil"));
  },
  "fun-who": (el, ev, ctx) => {
    const st = A.st(), set = (st.funWho ||= new Set(ctx.members().map((k) => k.id)));
    set.has(el.dataset.k) ? set.delete(el.dataset.k) : set.add(el.dataset.k);
    refresh(ctx);
  },
  "fun-hunt": async (el, ev, ctx) => {
    const st = A.st(), who = [...(st.funWho || new Set(ctx.members().map((k) => k.id)))];
    const res = await send(ctx, "hunt_start", { member: st.kid, spaces: homeSpaces(ctx), n: +el.dataset.k, who });
    if (!res) return;
    A.publish(ctx, { emote: "invite" });
    Sound.sfx("level");
    refresh(ctx);
  },
  "fun-hunt-stop": async (el, ev, ctx) => {
    if (await send(ctx, "hunt_stop", { member: A.st().kid })) refresh(ctx);
  },
  "fun-hide": (el, ev, ctx) => {
    const st = A.st();
    st.hiding = el.dataset.k;
    sheet?.close();
    A.redraw(ctx);
    ctx.toast(ctx.t("Tryk der, hvor du vil gemme den"));
  },
  "fun-hide-stop": async (el, ev, ctx) => {
    if (await send(ctx, "hide_stop", { member: A.st().kid })) refresh(ctx);
  },
  "fun-done": async (el, ev, ctx) => {
    if (await send(ctx, "task_done", { member: A.st().kid, task: el.dataset.k })) {
      Sound.sfx("buy");
      refresh(ctx);
    }
  },
  "fun-approve": async (el, ev, ctx) => {
    if (await send(ctx, "task_approve", { member: el.dataset.m, task: el.dataset.k, approver: A.st().kid })) refresh(ctx);
  },
  "fun-task-del": async (el, ev, ctx) => {
    if (await send(ctx, "task_remove", { task: el.dataset.k, approver: A.st().kid })) refresh(ctx);
  },
  "fun-em": (el, ev, ctx) => {
    keepTitle(el, ctx);
    A.st().funEm = el.dataset.k;
    refresh(ctx);
  },
  "fun-for": (el, ev, ctx) => {
    keepTitle(el, ctx);
    const st = A.st(), set = (st.funFor ||= new Set());
    if (!el.dataset.k) set.clear();
    else set.has(el.dataset.k) ? set.delete(el.dataset.k) : set.add(el.dataset.k);
    refresh(ctx);
  },
  "fun-coins": (el, ev, ctx) => {
    keepTitle(el, ctx);
    A.st().funCoins = +el.dataset.k;
    refresh(ctx);
  },
  "fun-real": (el, ev, ctx) => {
    keepTitle(el, ctx);
    const st = A.st();
    const parent = ctx.member(st.kid)?.role === "parent" || ctx.isParent;
    st.funReal = !(st.funReal ?? parent);
    refresh(ctx);
  },
  "fun-task-add": async (el, ev, ctx) => {
    const st = A.st(), input = el.closest(".sheet")?.querySelector('[data-fun="title"]'), title = (input?.value || "").trim();
    if (!title) return ctx.toast(ctx.t("Skriv, hvad opgaven er"));
    const parent = ctx.member(st.kid)?.role === "parent" || ctx.isParent;
    const res = await send(ctx, "task_add", { title, emoji: st.funEm || "⭐", coins: st.funCoins ?? (parent ? 5 : 1), real: st.funReal ?? parent, for: [...(st.funFor || [])], approver: st.kid });
    if (!res) return;
    st.funTitle = "";
    refresh(ctx);
  },
};
/* Typing is not lost when a chip is pressed (the sheet draws again). */
function keepTitle(el, ctx) {
  const input = el.closest(".sheet")?.querySelector('[data-fun="title"]');
  if (input) A.st().funTitle = input.value;
  setTimeout(() => {
    const again = sheet?.el.querySelector('[data-fun="title"]');
    if (again && A.st().funTitle) again.value = A.st().funTitle;
  });
}

/* ------------------------------------------------------------------ the party */
const PARTY = { day: "Dagens familiemission er klaret!", hunt: "Alle stjerner er fundet!", hide: "Gemmelegen er slut. Godt fundet!", task: "En opgave er godkendt!" };
export function party(ctx) {
  if (!A) return;
  const p = funOf(ctx).party, st = A.st();
  if (!p || ago(p.at) > 5 * 60000 || st.partySeen === p.id) return;
  let seen = "";
  try {
    seen = localStorage.getItem(`hverdagsro-party-${st.kid}`) || "";
  } catch (err) {
    /* private window */
  }
  st.partySeen = p.id;
  if (seen === p.id) return;
  try {
    localStorage.setItem(`hverdagsro-party-${st.kid}`, p.id);
  } catch (err) {
    /* private window */
  }
  Sound.sfx("level");
  [200, 500, 800].forEach((x, i) => setTimeout(() => A.confetti(ctx, x, 260 + (i % 2) * 80, ["#F15BB5", "#FFD93D", "#4D96FF"][i], true), i * 250));
  const names = (p.who || []).map((id) => nameOf(ctx, id)).filter(Boolean).join(", ");
  A.say(ctx, 500, 520, `🎉 ${ctx.t(PARTY[p.reason] || "Fest!")}${names ? ` ${names}` : ""}`);
}

export const FUN_EN = {
  "Vink til hinanden {n} gange": "Wave to each other {n} times",
  "Besøg {n} forskellige steder": "Visit {n} different places",
  "Snak med {n} figurer": "Talk to {n} characters",
  "Mød hinanden et sted i spillet": "Meet each other somewhere in the game",
  "Sæt {n} nye ting op": "Put up {n} new things",
  "Giv {n} krammere": "Give {n} hugs",
  "Find dagens {n} stjerner": "Find today's {n} stars",
  "Fundet af {name}": "Found by {name}",
  "Gemt her": "Hidden here",
  "Gemt! Nu skal de andre lede.": "Hidden! Now the others look for it.",
  "🔥 Brandvarmt!": "🔥 Boiling hot!",
  "♨️ Varmt!": "♨️ Warm!",
  "🌤️ Lunkent": "🌤️ Lukewarm",
  "❄️ Koldt": "❄️ Cold",
  Stjernejagt: "Star hunt",
  "{name} har gemt noget i {place}": "{name} has hidden something in {place}",
  "Tryk rundt og led!": "Tap around and look!",
  "Gå derhen": "Go there",
  "{name} kalder: kom til {place}!": "{name} calls: come to {place}!",
  "Kom!": "Come!",
  Familieleg: "Family play",
  Familie: "Family",
  "Leg sammen hele familien, på samme tid.": "Play together as a whole family, at the same time.",
  "Spiller lige nu": "Playing now",
  "Gå hen til": "Go to",
  "Kald familien hertil": "Call the family here",
  "Dagens familiemission": "Today's family mission",
  "Klaret! Alle der hjalp, fik mønter.": "Done! Everyone who helped got coins.",
  "Hjælper: {names}": "Helping: {names}",
  "Alle kan hjælpe. Når I når målet, får alle der hjalp, mønter.": "Everyone can help. When you reach the goal, everyone who helped gets coins.",
  "{n} af {all} stjerner fundet. De er gemt rundt i huset.": "{n} of {all} stars found. They are hidden around the house.",
  "Stop jagten": "Stop the hunt",
  "Alle stjerner er fundet!": "All the stars are found!",
  "Stjerner bliver gemt rundt i huset. Hvem er med?": "Stars get hidden around the house. Who is playing?",
  "{n} stjerner": "{n} stars",
  Gemmeleg: "Hide and seek",
  "Du har gemt noget i {place}. Nu leder de andre.": "You hid something in {place}. Now the others look.",
  "Tag det frem igen": "Take it out again",
  "{name} har gemt noget i {place}. Gå derhen og tryk rundt: varmt eller koldt?": "{name} has hidden something in {place}. Go there and tap around: warm or cold?",
  "Stop legen": "Stop the game",
  "{name} fandt det!": "{name} found it!",
  "Vælg noget at gemme. Tryk så der, hvor det skal gemmes, så leder de andre.": "Pick something to hide. Then tap where to hide it, and the others look for it.",
  "Sjove opgaver": "Fun tasks",
  "I virkeligheden": "In real life",
  "I spillet": "In the game",
  Alle: "Everyone",
  Godkendt: "Approved",
  "Venter på en voksen": "Waiting for a grown-up",
  "Færdig!": "Done!",
  "Giv børnene en lille, sjov opgave. Den dukker op i spillet.": "Give the children a small, fun task. It pops up in the game.",
  "Ingen opgaver lige nu.": "No tasks right now.",
  "Fx: Find noget rødt i huset": "E.g. Find something red in the house",
  Til: "For",
  "Giv opgaven": "Give the task",
  "Familien er kaldt hertil": "The family has been called here",
  "Tryk der, hvor du vil gemme den": "Tap where you want to hide it",
  "Skriv, hvad opgaven er": "Write what the task is",
  "Dagens familiemission er klaret!": "Today's family mission is done!",
  "Gemmelegen er slut. Godt fundet!": "Hide and seek is over. Well found!",
  "En opgave er godkendt!": "A task is approved!",
  "Fest!": "Party!",
  "fra {name}": "from {name}",
  "Venter på {name}": "Waiting for {name}",
  "Ingen opgaver lige nu. Lav selv en udfordring til de andre!": "No tasks right now. Make a challenge for the others!",
  "Lav en udfordring til de andre": "Make a challenge for the others",
  "Mønterne kommer fra dine egne, når du godkender.": "The coins come from your own when you approve.",
  "Fx: Find min bamse i haven": "E.g. Find my teddy in the garden",
  "Send udfordringen": "Send the challenge",
  "Kram": "Hug",
  "High five": "High five",
  "Vink": "Wave",
};

export const FUN_CSS = `
.fun-bar { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 10px; }
.fun-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: #fff; border: 2px solid #2B2340; color: #2B2340; font: inherit; font-weight: 700; font-size: 14px; }
button.fun-chip { cursor: pointer; }
.fun-chip.done { background: #D9F7DF; }
.fun-chip.hunt { background: #FFF6C9; }
.fun-chip.hide { background: #E6F0FF; }
.fun-chip.call { background: #FFE0EC; animation: funpulse 1.2s ease-in-out infinite; }
.fun-chip button { border: 0; background: #2B2340; color: #fff; border-radius: 999px; padding: 3px 10px; font: inherit; font-size: 13px; cursor: pointer; }
.fun-chip b { font-variant-numeric: tabular-nums; }
@keyframes funpulse { 50% { transform: scale(1.04); } }
.fun-star { cursor: pointer; animation: funstar 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
.fun-star .fun-glow { opacity: .5; animation: funglow 1.6s ease-in-out infinite; }
.fun-star.got { animation: fungot .5s ease-in forwards; }
@keyframes funstar { 50% { transform: translateY(-10px) rotate(8deg); } }
@keyframes funglow { 50% { opacity: .15; } }
@keyframes fungot { to { transform: translateY(-120px) scale(1.6); opacity: 0; } }
.fun-hidden { opacity: .45; }
.fun-hidden.found { opacity: 1; }
.fun-hl { font: 800 30px system-ui, sans-serif; fill: #2B2340; paint-order: stroke; stroke: #fff; stroke-width: 8px; }
.pl-famb { position: relative; }
.pl-famb .fun-n { position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; border-radius: 10px; background: #E5484D; color: #fff; font-size: 12px; font-weight: 800; display: grid; place-items: center; padding: 0 5px; }
.fun-sheet h2 { margin: 0 0 4px; }
.fun-sec { border-top: 1px solid var(--line, #eee); padding: 12px 0; display: grid; gap: 8px; }
.fun-sec p { margin: 0; }
.fun-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.fun-who { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 14px; background: color-mix(in srgb, var(--c) 16%, transparent); font-weight: 700; }
.fun-who small { font-weight: 500; opacity: .75; }
.fun-mission { display: flex; gap: 12px; align-items: center; }
.fun-em { font-size: 28px; line-height: 1; }
.fun-prog { display: block; height: 10px; border-radius: 6px; background: var(--line, #eee); margin: 6px 0 4px; position: relative; overflow: hidden; }
.fun-prog::after { content: ""; position: absolute; inset: 0 auto 0 0; width: var(--p); background: #6BCB77; border-radius: 6px; }
.fun-things { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; }
.fun-things button { border: 2px solid var(--line, #ddd); border-radius: 14px; background: #FFF6E6; padding: 4px; cursor: pointer; }
.fun-things svg { width: 100%; height: 60px; display: block; }
.fun-tasks { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.fun-tasks li { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 14px; background: var(--card2, #F6F3FA); }
.fun-tasks li > div:nth-child(2) { flex: 1; }
.fun-tasks small { opacity: .75; }
.fun-tr { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.fun-new { display: grid; gap: 8px; padding: 10px; border-radius: 14px; border: 2px dashed var(--line, #ddd); }
.pl-emo { cursor: pointer; }
.pl-emo circle { transition: transform .15s; }
.pl-emo:hover circle { transform: scale(1.08); }
.pl-body.hug { animation: plhug .9s ease-in-out !important; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes plhug { 30%, 70% { transform: scaleX(1.08) translateY(-6px); } }
`;
