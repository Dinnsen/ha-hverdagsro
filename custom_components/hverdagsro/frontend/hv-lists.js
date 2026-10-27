/* Hverdagsro – Kalender, Madplan and Lister, ported 1:1 from the prototype (pCal, pMeals, pLists, listCard, onskeCard,
   openEvent, newEvent, newList). Everything comes from Home Assistant: the family's calendar.* entities, the meal-plan
   calendar, the todo.* lists and the wish lists from Ønskeskyen (data.osky). */
import { addDays, esc, startOfDay } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import { weatherKind } from "./hv-sky.js";
import * as KIDS from "./hv-kids.js";

const CAL_CREATE = 1;
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
const STAR = svg("pstar", "ic star");
const FAM_COLOR = "#11A39A";
const LIST_COLORS = ["#6E4AFF", "#E8742A", "#1FA36A", "#3B6BF5", "#E4568C", "#11A39A"];
const WXNAME = { rain: "Regn", cloudy: "Skyet", sun: "Sol", snow: "Sne", partly: "Delvis skyet" };
const MONTHS = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];

/* Module state, like the prototype's globals. */
const filters = {};
let listId = null;
let listConfirm = null;
let wishAdd = null;
const seen = {};

const pad = (n) => String(n).padStart(2, "0");
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d) => `${pad(d.getHours())}.${pad(d.getMinutes())}`;
const deg = (v) => `${Math.round(v)}°`;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const sameDay = (a, b) => isoDay(a) === isoDay(b);
const DAY_SHORT = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
const dayShort = (ctx, d) => (ctx.lang() === "da" ? DAY_SHORT[d.getDay()] : ctx.fmt.short(d));

/* ---------------------------------------------------------------- confetti (the prototype's burst) */
function burst(ctx, x, y, color, n = 26) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  let cv = ctx.root.getElementById("ls-confetti");
  if (!cv) {
    cv = document.createElement("canvas");
    cv.id = "ls-confetti";
    cv.className = "ls-confetti";
    ctx.root.appendChild(cv);
  }
  const DPR = window.devicePixelRatio || 1;
  cv.width = innerWidth * DPR;
  cv.height = innerHeight * DPR;
  const g = cv.getContext("2d");
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cols = [color || "#6E4AFF", "#FFB020", "#19B6A5", "#FF7A59", "#6E4AFF"];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(140, 360);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, r: rnd(3, 6), c: cols[i % cols.length], life: 1, rot: rnd(0, 6) });
  }
  let t0 = performance.now();
  requestAnimationFrame(function step(t) {
    const dt = Math.min(0.04, (t - t0) / 1000);
    t0 = t;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 620 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.1;
      p.rot += dt * 8;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.c;
      g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      g.restore();
    }
    if (parts.some((p) => p.life > 0)) requestAnimationFrame(step);
    else g.clearRect(0, 0, innerWidth, innerHeight);
  });
}

/* ---------------------------------------------------------------- calendar data */
function loadEvents(ctx, cals, start, end) {
  const list = [...new Set((cals || []).filter((c) => c && ctx.hass.states[c]))];
  if (!list.length) return [];
  for (const c of list) ctx.st(c);
  const key = `ev:lists:${list.join(",")}:${isoDay(start)}:${isoDay(end)}`;
  const value = ctx.load(
    key,
    async () => {
      const all = await Promise.all(
        list.map((c) =>
          ctx.hass
            .callApi("GET", `calendars/${c}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`)
            .then((items) => (items || []).map((e) => ({ ...e, calendar: c })))
            .catch(() => [])
        )
      );
      return all
        .flat()
        .map((e) => {
          const allDay = !!e.start?.date && !e.start?.dateTime;
          return {
            title: e.summary || "",
            start: new Date(e.start?.dateTime || `${e.start?.date}T00:00:00`),
            end: new Date(e.end?.dateTime || `${e.end?.date}T00:00:00`),
            allDay,
            calendar: e.calendar,
            location: e.location || "",
            description: e.description || "",
          };
        })
        .sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));
    },
    120000
  );
  return value === undefined ? null : value;
}

const PEOPLE = (ctx) => ctx.members();
const famAv = (cls = "") => `<span class="av ${cls}" style="background:${FAM_COLOR}">F</span>`;
const pcolor = (ctx, id) => (id === "familie" ? FAM_COLOR : ctx.color(id));
const pname = (ctx, id) => (id === "familie" ? ctx.t("Familien") : ctx.member(id)?.name || id);
const av = (ctx, id, cls = "") => (id === "familie" ? famAv(cls) : ctx.avatar(id, cls));

/* The calendars of the week: the shared ones, each member's own and the children's school schedule. */
function calSources(ctx) {
  const meals = ctx.data.settings.meals_calendar;
  const own = {}, skema = {};
  for (const m of PEOPLE(ctx)) {
    if (m.calendar) own[m.calendar] = m;
    if (m.skema && ctx.feature(m, "skema")) skema[m.skema] = m;
  }
  const shared = (ctx.data.settings.calendars || []).filter((c) => c !== meals && !own[c] && !skema[c]);
  return { own, skema, shared, all: [...new Set([...shared, ...Object.keys(own), ...Object.keys(skema)])].filter((c) => c !== meals) };
}

/* Who an event is for: the owner of the calendar, the members named in the title, or the family. */
function whoOf(ctx, src, e) {
  if (src.own[e.calendar]) return [src.own[e.calendar].id];
  if (src.skema[e.calendar]) return [src.skema[e.calendar].id];
  const named = PEOPLE(ctx).filter((m) => new RegExp(`(^|[^\\p{L}])${m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu").test(e.title));
  return named.length ? named.map((m) => m.id) : ["familie"];
}

function weekEvents(ctx) {
  const src = calSources(ctx);
  const t0 = startOfDay(new Date());
  const raw = loadEvents(ctx, src.all, t0, addDays(t0, 7));
  if (raw === null) return null;
  const out = [];
  // The school schedule (Aula) is shown as one block per day: "Skole · dansk og matematik".
  const school = {};
  for (const e of raw) {
    const who = whoOf(ctx, src, e);
    if (src.skema[e.calendar] && !e.allDay) {
      const k = `${e.calendar}|${isoDay(e.start)}`;
      (school[k] ||= { e: [], who }).e.push(e);
      continue;
    }
    out.push({ ...e, who, src: ctx.name(e.calendar) });
  }
  for (const { e, who } of Object.values(school)) {
    e.sort((a, b) => a.start - b.start);
    const subj = [...new Set(e.map((x) => x.title.split(/[(,]/)[0].trim().toLowerCase()).filter((x) => x && !/^skole\b/.test(x)))].slice(0, 2);
    const own = e.length === 1 && /^skole\b/i.test(e[0].title) ? e[0].title : null;
    out.push({ title: own || `${ctx.t("Skole")}${subj.length ? ` · ${subj.join(` ${ctx.t("og")} `)}` : ""}`, start: e[0].start, end: e[e.length - 1].end, allDay: false, calendar: e[0].calendar, who, src: ctx.name(e[0].calendar), school: true });
  }
  // Hent og bring: who picks up the children (routines.pickups).
  // Only today and tomorrow, like the prototype: the whole week's plan is under Hent og bring.
  for (let i = 0; i < 2; i++) {
    const d = addDays(t0, i);
    for (const kid of ctx.children().map((k) => k.id)) {
      const pf = typeof KIDS.pickupFor === "function" ? KIDS.pickupFor(ctx, kid, d) : null;
      const step = pf?.hent;
      const kidM = ctx.member(kid);
      if (!step?.who || !kidM) continue;
      const by = ctx.member(step.who) || (ctx.data.routines?.helpers || []).find((h) => h.id === step.who);
      if (!by) continue;
      const [h, m] = String(step.at || "15:00").split(/[:.]/).map(Number);
      const s = new Date(d);
      s.setHours(h || 0, m || 0, 0, 0);
      out.push({ title: ctx.t("{who} henter {kid}", { who: by.name, kid: kidM.name }), start: s, end: s, allDay: false, who: [kid], by: step.who, byName: by.name, src: ctx.t("Hent og bring"), pick: true, point: true });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

function mealsFor(ctx, days = 7) {
  const id = ctx.data.settings.meals_calendar;
  if (!id || !ctx.on("meals") || !ctx.hass.states[id]) return [];
  const t0 = startOfDay(new Date());
  return loadEvents(ctx, [id], t0, addDays(t0, days)) || [];
}
const dinnerOn = (meals, d) => meals.find((e) => (e.allDay ? e.start <= d && e.end > d : sameDay(e.start, d)));
const forecastOn = (ctx, d) => (ctx.forecast?.daily || []).find((f) => sameDay(new Date(f.datetime), d));
const wasteOn = (ctx, d) => (ctx.on("waste") ? (ctx.waste?.() || []).filter((w) => sameDay(w.date, d)) : []);

function timeLabel(ctx, e) {
  if (e.allDay) return ctx.t("Hele dagen");
  if (e.point || +e.end === +e.start) return hm(e.start);
  const end = sameDay(e.start, e.end) ? hm(e.end) : `${dayShort(ctx, e.end).toLowerCase()} ${hm(e.end)}`;
  return `${hm(e.start)}–${end}`;
}

/* ---------------------------------------------------------------- Kalender (pCal) */
function pCal(ctx) {
  const evs = weekEvents(ctx);
  const meals = mealsFor(ctx);
  const t0 = startOfDay(new Date());
  const ids = [...PEOPLE(ctx).map((p) => p.id), "familie"];
  for (const id of ids) if (filters[id] === undefined) filters[id] = true;
  const shown = (ev) => ev.who.some((w) => filters[w] !== false);
  const days = Array.from({ length: 7 }, (_, i) => addDays(t0, i));
  const dayCol = (d, i) => {
    const list = (evs || []).filter((e) => (e.allDay ? e.start <= d && e.end > d : sameDay(e.start, d)) && shown(e));
    const f = forecastOn(ctx, d);
    const bins = wasteOn(ctx, d);
    const dinner = dinnerOn(meals, d);
    return `<div class="wday${i === 0 ? " today" : ""}"><div class="wday-h"><span>${esc(dayShort(ctx, d))}</span><b>${d.getDate()}</b><em>${f ? svg(weatherKind(f.condition)) + deg(f.temperature) : ""}</em></div>${
      bins.length ? `<button class="ev wev" data-act="lists-waste" style="--ec:${esc(bins[0].color)}">${svg("trash2")}<b>${esc(bins.map((w) => w.name).join(` ${ctx.t("og")} `))}</b><small>${esc(ctx.t("Tømning"))}</small></button>` : ""
    }
      ${
        evs === null
          ? `<div class="ls-skel"><i></i><i></i></div>`
          : list.map((e, k) => `<button class="ev${e.pick ? " pick" : ""}" data-act="lists-ev" data-i="${evs.indexOf(e)}" style="--ec:${pcolor(ctx, e.who[0])};animation-delay:${i * 40 + k * 50}ms"><b>${esc(e.title)}</b><small>${esc(timeLabel(ctx, e))}</small></button>`).join("") || `<div class="t-sub" style="padding:6px 4px">${esc(ctx.t("Intet i kalenderen"))}</div>`
      }
      ${ctx.on("meals") && ctx.data.settings.meals_calendar ? `<div class="ev-dinner">${svg("food")}<span>${esc(dinner?.title || ctx.t("Ikke planlagt"))}</span></div>` : ""}</div>`;
  };
  const src = calSources(ctx);
  const names = src.all.map((c) => ctx.name(c));
  const range = `${days[0].getDate()}.${days[0].getMonth() !== days[6].getMonth() ? ` ${MONTHS[days[0].getMonth()]}` : ""}–${days[6].getDate()}. ${MONTHS[days[6].getMonth()]}`;
  const firstSchool = (evs || []).find((e) => e.school);
  const foot = names.length
    ? `${ctx.t("Aftaler fra {names} for {range}.", { names: joinNames(ctx, names), range })}${firstSchool ? ` ${ctx.t("Skemaet står samlet som »Skole til kl. {t}«; det fulde skema ligger på barnets side.", { t: hm(firstSchool.end).replace(/\.00$/, "") })}` : ""}`
    : ctx.t("Vælg familiens kalendere under Familieindstillinger › Hjemmet.");
  return `<div class="cal-tools"><div class="filters">${ids
    .map((id) => `<button class="fchip" data-act="lists-filter" data-id="${esc(id)}" aria-pressed="${filters[id] !== false}" style="--fc:${pcolor(ctx, id)}">${av(ctx, id)}${esc(pname(ctx, id))}</button>`)
    .join("")}</div>${ctx.isParent ? `<button class="btn" data-act="lists-newev">${svg("plus")}${esc(ctx.t("Ny aftale"))}</button>` : ""}</div>
  <div class="week">${days.map(dayCol).join("")}</div>
  <p class="foot">${esc(foot)}</p>`;
}
const joinNames = (ctx, list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} ${ctx.t("og")} ${list[list.length - 1]}`);

function openEvent(ctx, e) {
  const d = startOfDay(e.start);
  const f = forecastOn(ctx, d);
  const dinner = dinnerOn(mealsFor(ctx), d);
  const henter = e.byName || (e.description || "").match(/Henter:\s*([^\n]+)/i)?.[1];
  const kind = f ? weatherKind(f.condition) : null;
  ctx.sheet(`<div class="eyebrow">${esc(ctx.fmt.day(d))} ${d.getDate()}. ${esc(ctx.lang() === "da" ? MONTHS[d.getMonth()] : ctx.fmt.date(d, { month: "long" }))}</div><h2>${esc(e.title)}</h2>
    <dl class="kv"><dt>${esc(ctx.t("Tid"))}</dt><dd class="num">${esc(timeLabel(ctx, e).replace("–", " – "))}</dd><dt>${esc(ctx.t("Hvem"))}</dt><dd style="display:flex;gap:6px;flex-wrap:wrap">${e.who.map((x) => `<span class="chip"><i style="background:${pcolor(ctx, x)}"></i>${esc(pname(ctx, x))}</span>`).join("")}</dd>
    ${henter ? `<dt>${esc(ctx.t("Henter"))}</dt><dd>${esc(henter)}</dd>` : ""}${e.location ? `<dt>${esc(ctx.t("Sted"))}</dt><dd>${esc(e.location)}</dd>` : ""}<dt>${esc(ctx.t("{_}Fra", { _: "" }))}</dt><dd>${esc(e.src || "")}</dd><dt>${esc(ctx.t("Vejr"))}</dt><dd>${f ? `${esc(ctx.t(WXNAME[kind]))}, ${deg(f.templow ?? f.temperature)} ${esc(ctx.t("til"))} ${deg(f.temperature)}` : esc(ctx.t("Ingen prognose endnu"))}</dd>${ctx.on("meals") && ctx.data.settings.meals_calendar ? `<dt>${esc(ctx.t("Aftensmad"))}</dt><dd>${esc(dinner?.title || ctx.t("Ikke planlagt"))}</dd>` : ""}</dl>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
}

function writableCalendar(ctx, id) {
  const s = ctx.hass.states[id];
  return !!s && ((s.attributes.supported_features || 0) & CAL_CREATE) !== 0;
}

function newEvent(ctx) {
  const people = PEOPLE(ctx);
  const t0 = startOfDay(new Date());
  const kid = ctx.children()[0]?.id;
  const bg = ctx.sheet(`<h2>${esc(ctx.t("Ny aftale"))}</h2><form id="nf"><div class="field"><label for="nf-t">${esc(ctx.t("Hvad"))}</label><input id="nf-t" required placeholder="${esc(ctx.t("Fx Elvin til fødselsdag hos Alma"))}"></div>
    <div class="field"><span class="lbl">${esc(ctx.t("For hvem"))}</span><div class="filters" id="nf-who">${people.map((p) => `<button type="button" class="fchip" data-w="${esc(p.id)}" aria-pressed="${p.id === kid}" style="--fc:${pcolor(ctx, p.id)}">${ctx.avatar(p.id)}${esc(p.name)}</button>`).join("")}</div></div>
    <div class="row"><div class="field"><label for="nf-d">${esc(ctx.t("Dag"))}</label><select id="nf-d">${Array.from({ length: 7 }, (_, i) => addDays(t0, i))
      .map((d, i) => `<option value="${i}">${esc(cap(dayShort(ctx, d)))} ${d.getDate()}. ${esc(MONTHS[d.getMonth()].slice(0, 3))}.</option>`)
      .join("")}</select></div><div class="field"><label for="nf-s">${esc(ctx.t("{_}Fra", { _: "" }))}</label><input id="nf-s" type="time" value="15:00"></div><div class="field"><label for="nf-e">${esc(ctx.t("Til"))}</label><input id="nf-e" type="time" value="17:00"></div></div>
    <div class="field"><label for="nf-b">${esc(ctx.t("Hvem henter"))}</label><select id="nf-b"><option value="">${esc(ctx.t("{_}Ingen", { _: "" }))}</option>${ctx.parents().map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select></div>
    <div class="sheet-actions"><button type="button" class="btn soft" data-close>${esc(ctx.t("Annuller"))}</button><button class="btn" type="submit">${esc(ctx.t("Gem aftale"))}</button></div></form>`);
  const el = bg.el;
  el.querySelector("#nf-who").addEventListener("click", (e) => {
    const b = e.target.closest("[data-w]");
    if (b) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
  });
  el.querySelector("#nf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const who = [...el.querySelectorAll("#nf-who [aria-pressed=true]")].map((b) => b.dataset.w);
    const by = el.querySelector("#nf-b").value;
    const title = el.querySelector("#nf-t").value.trim();
    const d = addDays(t0, +el.querySelector("#nf-d").value);
    const s = el.querySelector("#nf-s").value || "15:00", en = el.querySelector("#nf-e").value || s;
    // The member's own calendar when the appointment is theirs alone; otherwise the family's calendar.
    const own = who.length === 1 ? ctx.member(who[0])?.calendar : null;
    const shared = (ctx.data.settings.calendars || []).filter((c) => c !== ctx.data.settings.meals_calendar);
    const target = [own, ...shared, ...PEOPLE(ctx).map((m) => m.calendar)].find((c) => c && writableCalendar(ctx, c));
    if (!target) return ctx.toast(ctx.t("Ingen af kalenderne kan få nye aftaler fra Home Assistant"));
    const desc = [who.length && !own ? `${ctx.t("For")}: ${who.map((w) => pname(ctx, w)).join(", ")}` : "", by ? `${ctx.t("Henter")}: ${ctx.member(by)?.name}` : ""].filter(Boolean).join("\n");
    const day = isoDay(d);
    const ok = await ctx.call("calendar", "create_event", { entity_id: target, summary: title, start_date_time: `${day} ${s}:00`, end_date_time: `${day} ${en < s ? s : en}:00`, ...(desc ? { description: desc } : {}) });
    if (!ok) return;
    bg.close();
    ctx.drop("ev:");
    ctx.render();
    ctx.toast(by ? ctx.t("Gemt. {name} står som den, der henter.", { name: ctx.member(by)?.name }) : ctx.t("Aftalen er gemt"));
  });
}

/* ---------------------------------------------------------------- Madplan (pMeals) */
function budget(ctx) {
  const cal = ctx.data.settings.meals_calendar;
  const platform = cal && ctx.hass.entities?.[cal]?.platform;
  const ents = ctx.hass.entities || {};
  const ids = Object.keys(ctx.hass.states).filter((e) => e.startsWith("sensor.") && /budget/i.test(e) && (!platform || ents[e]?.platform === platform || /middagsro/.test(e)));
  // Middagsro's "food budget left this week" has the week's money as "available".
  const id = ids.find((e) => ctx.hass.states[e].attributes.available != null) || ids.find((e) => /week|uge/i.test(e));
  const s = id && ctx.st(id);
  if (!s || Number.isNaN(Number(s.state))) return null;
  const total = Number(s.attributes.available ?? s.attributes.budget ?? s.attributes.total ?? s.attributes.limit);
  return { left: Number(s.state), unit: s.attributes.unit_of_measurement || "kr", frac: total > 0 ? Math.max(0, Math.min(1, Number(s.state) / total)) : null };
}
const isMiddagsro = (ctx, id) => !!id && (ctx.hass.entities?.[id]?.platform === "middagsro" || /middagsro/i.test(id));
const panelUrl = (ctx, re) => Object.keys(ctx.hass.panels || {}).find((p) => re.test(p));

function pMeals(ctx) {
  const id = ctx.data.settings.meals_calendar;
  if (!id || !ctx.hass.states[id])
    return `<section class="card hv-empty">${svg("food", "ic big")}<h2>${esc(ctx.t("Ingen madplan endnu"))}</h2><p class="t-sub">${esc(ctx.t("Vælg den kalender, der har aftensmaden, fx Middagsros madplan."))}</p>${ctx.isParent ? `<button class="btn" data-go="indstillinger:hjemmet">${svg("gear")}${esc(ctx.t("Vælg kalender"))}</button>` : ""}</section>`;
  const meals = loadEvents(ctx, [id], startOfDay(new Date()), addDays(startOfDay(new Date()), 7));
  const mid = isMiddagsro(ctx, id);
  const b = budget(ctx);
  const t0 = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(t0, i));
  const cards = days
    .map((d, i) => {
      const m = meals && dinnerOn(meals, d);
      const title = m?.title || ctx.t("Ikke planlagt");
      const min = (m?.description || "").match(/(\d+)\s*min/i)?.[1];
      const rest = /^rest/i.test(title) || /\b(rest|leftover)/i.test((m?.description || "").split("\n")[0]) || !m;
      const sub = rest && m ? ctx.t("Restedag") : i === 0 && m ? ((m.description || "").split("\n").find((l) => /kl\./.test(l)) || "") : "";
      return `<article class="meal${i === 0 ? " tonight" : ""}${rest ? " rest" : ""}" style="animation:pop .5s ${i * 60}ms both"${ctx.isParent && !mid ? ` data-act="lists-meal" data-i="${i}" role="button" tabindex="0"` : ""}><div class="eyebrow">${esc(i === 0 ? ctx.t("I aften") : cap(ctx.fmt.day(d)))}${min ? ` · ${min} min` : ""}</div><h3>${esc(title)}</h3><div class="m-sub">${esc(sub)}</div></article>`;
    })
    .join("");
  const shop = (ctx.data.settings.todo || []).find((l) => isShopping(ctx, l));
  const mPanel = panelUrl(ctx, /middagsro/);
  return `<section class="card" style="margin-bottom:16px"><div class="card-head"><h2>${esc(ctx.t("Ugens madplan"))}</h2><span class="meta">${esc(mid ? ctx.t("Fra Middagsro") : ctx.name(id))}</span></div>${
    b ? `<div class="budget"><span class="num" style="font-weight:700">${ctx.fmt.num(b.left, 2)} ${esc(b.unit)}</span>${b.frac != null ? `<div class="bar"><i style="width:${Math.round(b.frac * 100)}%"></i></div>` : `<div class="bar"></div>`}<span class="t-sub">${esc(ctx.t("tilbage i ugen"))}</span></div>` : ""
  }</section>
  <div class="meals">${meals === null ? `<div class="ls-skel"><i></i><i></i><i></i></div>` : cards}</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">${shop ? `<button class="btn" data-act="lists-openlist" data-id="${esc(shop)}">${svg("cart")}${esc(ctx.t("Indkøbslisten"))}</button>` : ""}${mPanel ? `<button class="btn soft" data-act="lists-panel" data-id="${esc(mPanel)}">${esc(ctx.t("Åbn i Middagsro"))}</button>` : ""}</div>
  <p class="foot">${esc(mid ? ctx.t("Fanen viser Middagsros madplan direkte. Skift ret, bedøm og lav ny plan sker i Middagsro, så de to apps aldrig er uenige.") : ctx.t("Madplanen er kalenderen {name}. Tryk på en dag for at sætte aftensmaden.", { name: ctx.name(id) }))}</p>`;
}

function mealSheet(ctx, i) {
  const id = ctx.data.settings.meals_calendar;
  const d = addDays(startOfDay(new Date()), i);
  const cur = dinnerOn(mealsFor(ctx), d);
  const bg = ctx.sheet(`<div class="eyebrow">${esc(cap(ctx.fmt.day(d)))} ${d.getDate()}. ${esc(MONTHS[d.getMonth()])}</div><h2>${esc(ctx.t("Aftensmad"))}</h2>
    <form id="mf"><div class="field"><label for="mf-t">${esc(ctx.t("{_}Ret", { _: "" }))}</label><input id="mf-t" required value="${esc(cur?.title || "")}" placeholder="${esc(ctx.t("Fx Lasagne"))}"></div>
    <div class="sheet-actions"><button type="button" class="btn soft" data-close>${esc(ctx.t("Annuller"))}</button><button class="btn" type="submit">${esc(ctx.t("Gem"))}</button></div></form>`);
  bg.el.querySelector("#mf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = bg.el.querySelector("#mf-t").value.trim();
    if (!title) return;
    const ok = await ctx.call("calendar", "create_event", { entity_id: id, summary: title, start_date: isoDay(d), end_date: isoDay(addDays(d, 1)) });
    if (!ok) return;
    bg.close();
    ctx.drop("ev:");
    ctx.render();
    ctx.toast(ctx.t("{name} er sat på madplanen", { name: title }));
  });
}

/* ---------------------------------------------------------------- Lister (pLists) */
const isShopping = (ctx, id) => /indk|shop|handle|grocer/i.test(`${id} ${ctx.name(id)}`) || isMiddagsro(ctx, id);
function listMeta(ctx, id) {
  const n = `${id} ${ctx.name(id)}`.toLowerCase();
  if (isShopping(ctx, id)) return { color: "#6E4AFF", icon: "cart", locked: isMiddagsro(ctx, id) };
  const icon = /apotek|medicin|pharm/.test(n) ? "plus" : /weekend|fast|hver|repeat/.test(n) ? "repeat" : /halloween|fest|party|jul|pynt/.test(n) ? "star" : "lists";
  // The colours go round in the prototype's order: orange, green, blue, pink, petrol.
  const others = (ctx.data.settings.todo || []).filter((x) => ctx.hass.states[x] && !isShopping(ctx, x));
  const i = Math.max(0, others.indexOf(id));
  return { color: LIST_COLORS[1 + (i % (LIST_COLORS.length - 1))], icon, locked: false };
}
function todoItems(ctx, id) {
  const state = ctx.st(id)?.state;
  const key = "todo:" + id;
  if (seen[id] !== undefined && seen[id] !== state && ctx.cache[key]) ctx.drop(key);
  seen[id] = state;
  const value = ctx.load(key, () => ctx.hass.callWS({ type: "todo/item/list", entity_id: id }).then((r) => r?.items || []), 30000);
  return value === undefined ? null : value;
}
const refreshSoon = (ctx, id) =>
  setTimeout(() => {
    ctx.drop("todo:" + id);
    ctx.render();
  }, 700);

/* The wish lists from Ønskeskyen that are shown under Lister. */
function oskyLists(ctx) {
  if (!ctx.on("wish")) return [];
  const to = ctx.data.settings.osky_to || {};
  return (ctx.data.osky?.lists || []).filter((l) => (to[l.id] || "andre") !== "skjul").map((l) => ({ ...l, to: to[l.id] || "andre" }));
}
function allLists(ctx) {
  const todos = (ctx.data.settings.todo || []).filter((id) => ctx.hass.states[id]).map((id) => ({ id, kind: "todo", name: ctx.name(id), ...listMeta(ctx, id) }));
  const wishes = oskyLists(ctx).map((l) => ({ id: `o-${l.id}`, kind: "onske", name: l.title, color: "#2F80ED", icon: "cloudy", osky: l }));
  return [...todos, ...wishes];
}

function listCard(ctx, L) {
  if (L.kind === "onske") return onskeCard(ctx, L);
  const items = todoItems(ctx, L.id);
  const list = items || [];
  const done = list.filter((i) => i.status === "completed").length;
  const kid = !ctx.isParent;
  return `${listConfirm === L.id ? `<div class="confirm"><span>${esc(ctx.t("Slet listen »{name}« med {n} punkter?", { name: L.name, n: list.length }))}</span><button class="btn danger sm" data-act="lists-dellist-yes">${esc(ctx.t("Slet listen"))}</button><button class="btn soft sm" data-act="lists-dellist-no">${esc(ctx.t("Behold"))}</button></div>` : ""}
  <section class="card">
    <div class="card-head"><h2>${esc(L.name)}</h2><div style="display:flex;gap:6px;align-items:center"><span class="meta num">${esc(ctx.t("{done} af {n} klaret", { done, n: list.length }))}</span>${L.locked ? `<span class="lock" title="${esc(ctx.t("Indkøbslisten ejes af Middagsro"))}">${svg("lock")}Middagsro</span>` : kid ? "" : `<button class="iconbtn" data-act="lists-dellist" aria-label="${esc(ctx.t("Slet listen {name}", { name: L.name }))}">${svg("trash")}</button>`}</div></div>
    ${L.locked ? `<div class="t-sub" style="margin-top:-8px">${esc(ctx.t("Fra Middagsros madplan"))}</div>` : ""}
    <div class="progress"><i style="width:${list.length ? (done / list.length) * 100 : 0}%;background:${L.color}"></i></div>
    <div class="items">${
      items === null
        ? `<div class="ls-skel"><i></i><i></i><i></i></div>`
        : list
            .map(
              (it, i) => `<div class="item${it.status === "completed" ? " done" : ""}" data-item="${i}"><button class="check" data-act="lists-item" data-uid="${esc(it.uid)}" aria-label="${esc(it.summary)}" aria-pressed="${it.status === "completed"}" style="${it.status === "completed" ? `background:${L.color};border-color:transparent` : ""}">${CHECK}</button><span class="t-ttl">${esc(it.summary)}</span><span class="t-sub num">${esc(it.description || (it.due ? cap(ctx.fmt.rel(new Date(it.due))) : ""))}</span><button class="iconbtn" data-act="lists-delitem" data-uid="${esc(it.uid)}" aria-label="${esc(ctx.t("Fjern {name}", { name: it.summary }))}">${svg("x")}</button></div>`
            )
            .join("") || `<div class="t-sub">${esc(ctx.t("Listen er tom. Tilføj det første punkt herunder."))}</div>`
    }</div>
    <form class="add" id="ls-add" data-list="${esc(L.id)}"><input id="ls-add-t" placeholder="${esc(ctx.t("Tilføj til {name}", { name: L.name.toLowerCase() }))}" autocomplete="off"><button class="btn" type="submit">${svg("plus")}${esc(ctx.t("Tilføj"))}</button></form>
  </section>`;
}

/* ---------------------------------------------------------------- Ønskeskyen */
/* The prototype's wishEm: a picture for a wish from its title. */
const WISH_EM = [
  [["paw patrol"], "🐶"], [["hot wheels", "bil"], "🚗"], [["brio", "jernbane"], "🚂"], [["bog", "børnebøger"], "📖"], [["hjelm"], "🚲"], [["dino"], "🦕"], [["puslespil"], "🧩"], [["legehus"], "🏠"],
  [["glas"], "🍺"], [["strik", "shirt"], "👕"], [["hue", "light", "pære"], "💡"], [["camera"], "📷"], [["sand"], "🏖️"], [["spil"], "🎲"], [["bad"], "🛁"], [["tilskud"], "💝"],
];
const wishEm = (t) => {
  const s = String(t).toLowerCase();
  return (WISH_EM.find(([words]) => words.some((w) => s.includes(w))) || [null, "🎁"])[1];
};
const priceText = (w) => (w.price != null ? `${String(w.price).replace(".", ",")} ${w.currency === "DKK" || !w.currency ? "kr" : w.currency}` : "");
const kidOf = (ctx, l) => ctx.children().find((k) => k.id === l.to)?.id;
function canAddWish(ctx, l) {
  if (!ctx.isParent) return l.to === ctx.me?.id;
  return l.to === ctx.me?.id || l.to === "begge" || !!kidOf(ctx, l);
}
function syncedText(ctx, l) {
  const acc = ctx.data.osky?.accounts?.[l.via?.[0]];
  if (!acc?.at) return ctx.t("lige nu");
  const at = new Date(acc.at);
  const min = Math.round((Date.now() - at) / 60000);
  return min < 1 ? ctx.t("lige nu") : min < 60 ? ctx.t("for {n} min. siden", { n: min }) : `${ctx.fmt.rel(at)} ${ctx.fmt.time(at)}`;
}
function wishForm(ctx, l) {
  const kid = !ctx.isParent, forKid = !!kidOf(ctx, l) && !kid;
  return `<form class="wish-add" id="wish-f" data-l="${esc(l.id)}" autocomplete="off">
    <div class="wa-h"><b>${esc(kid ? ctx.t("Hvad ønsker du dig?") : forKid ? ctx.t("Nyt ønske til {name}", { name: ctx.member(l.to).name }) : ctx.t("Nyt ønske"))}</b><button type="button" class="iconbtn" data-act="lists-wishadd" data-id="${esc(l.id)}" aria-label="${esc(ctx.t("Luk"))}">${svg("x")}</button></div>
    <label class="field"><span class="lbl">${esc(kid ? ctx.t("Mit ønske") : ctx.t("Ønske"))}</span><input id="wa-t" required maxlength="90" placeholder="${esc(kid ? ctx.t("Fx en dinosaur-bog") : ctx.t("Fx LEGO Technic 42151"))}"></label>
    ${kid ? "" : `<div class="wa-2"><label class="field"><span class="lbl">${esc(ctx.t("Pris"))}</span><input id="wa-p" inputmode="decimal" placeholder="${esc(ctx.t("Valgfri"))}"></label><label class="field"><span class="lbl">${esc(ctx.t("Link"))}</span><input id="wa-s" placeholder="${esc(ctx.t("Fx https://br.dk/…"))}"></label></div>`}
    <div class="wa-f"><span></span><button class="btn" type="submit">${svg("plus")}${esc(kid ? ctx.t("Sæt på min ønskeseddel") : ctx.t("Tilføj ønske"))}</button></div>
    <small class="t-sub">${esc(kid ? ctx.t("Far eller mor kan se det med det samme.") : ctx.t("Ønsket lægges også i Ønskeskyen."))}</small></form>`;
}
/* The Ønskeskyen card is the kids module's (the same card as the children's Ønsker page). On Lister it also gets
   the prototype's "Fjern forbindelsen" (trash + confirm). Falls back to the local port if hv-kids lacks it. */
function onskeCard(ctx, L) {
  if (typeof KIDS.onskeCard === "function") {
    let html = KIDS.onskeCard(ctx, L.osky);
    if (ctx.isParent)
      html = html.replace(
        /(data-act="kids-oshare"[^>]*>[\s\S]*?<\/button>)/,
        `$1<button class="iconbtn" data-act="lists-dellist" aria-label="${esc(ctx.t("Fjern forbindelsen til {name}", { name: L.name }))}">${svg("trash")}</button>`
      );
    const confirm = listConfirm === L.id ? `<div class="confirm"><span>${esc(ctx.t("Fjern forbindelsen til »{name}«? Listen i Ønskeskyen bliver ikke slettet.", { name: L.name }))}</span><button class="btn danger sm" data-act="lists-dellist-yes">${esc(ctx.t("Fjern forbindelsen"))}</button><button class="btn soft sm" data-act="lists-dellist-no">${esc(ctx.t("Behold"))}</button></div>` : "";
    return confirm + html;
  }
  return onskeCardLocal(ctx, L);
}
function onskeCardLocal(ctx, L) {
  const l = L.osky;
  const kid = !ctx.isParent;
  const res = l.wishes.filter((w) => w.reserved).length;
  const can = canAddWish(ctx, l);
  const kidId = kidOf(ctx, l);
  return `${listConfirm === L.id ? `<div class="confirm"><span>${esc(ctx.t("Fjern forbindelsen til »{name}«? Listen i Ønskeskyen bliver ikke slettet.", { name: L.name }))}</span><button class="btn danger sm" data-act="lists-dellist-yes">${esc(ctx.t("Fjern forbindelsen"))}</button><button class="btn soft sm" data-act="lists-dellist-no">${esc(ctx.t("Behold"))}</button></div>` : ""}
  <section class="card">
    <div class="card-head"><h2>${esc(L.name)}</h2><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="osky">${svg("cloudy")}Ønskeskyen</span><button class="iconbtn" data-act="lists-sync" aria-label="${esc(ctx.t("Hent igen fra Ønskeskyen"))}">${svg("repeat")}</button>${kid ? "" : `<button class="btn soft sm" data-act="lists-share" data-id="${esc(l.id)}">${svg("share")}${esc(ctx.t("Del"))}</button><button class="iconbtn" data-act="lists-dellist" aria-label="${esc(ctx.t("Fjern forbindelsen til {name}", { name: L.name }))}">${svg("trash")}</button>`}</div></div>
    <div class="t-sub" style="margin:-8px 0 12px">${esc(ctx.t("Hentet fra Ønskeskyen {when}", { when: syncedText(ctx, l) }))}${kid ? "" : ` · ${esc(ctx.t("{n} ønsker · {r} reserveret", { n: l.count || l.wishes.length, r: res }))}`}</div>
    ${can ? (wishAdd === l.id ? wishForm(ctx, l) : `<button class="wish-new${kid ? " kid" : ""}" data-act="lists-wishadd" data-id="${esc(l.id)}"><span>${svg("plus")}</span><b>${esc(kid ? ctx.t("Ønsk dig noget") : kidId ? ctx.t("Tilføj et ønske til {name}", { name: ctx.member(kidId).name }) : ctx.t("Tilføj et ønske"))}</b></button>`) : ""}
    <div class="wishes">${l.wishes.map((w, i) => wishCard(ctx, l, w, i)).join("") || `<div class="t-sub">${esc(ctx.t("Ingen ønsker endnu."))}</div>`}</div>
    <div class="osky-foot"><span>${esc(can ? (kid ? ctx.t("Dine ønsker kommer også på din børneprofil i Ønskeskyen.") : ctx.t("Ønsker du tilføjer her, lægges i Ønskeskyen. Reservationer laves i Ønskeskyen.")) : ctx.t("Ønskesedlen ejes af en anden. Nye ønsker og reservationer laves i Ønskeskyen."))}</span><button class="btn sm" data-act="lists-oskyopen" data-id="${esc(l.id)}">${esc(kid ? ctx.t("Åbn min børneprofil") : ctx.t("Åbn i Ønskeskyen"))} ›</button></div>
  </section>`;
}
function wishCard(ctx, l, w, i) {
  const kid = !ctx.isParent;
  const kidId = kidOf(ctx, l);
  const inShop = (ctx.data.rewards || []).some((r) => r.title === w.title.slice(0, 60) && r.member === kidId);
  const thumb = w.photo ? `<span class="thumb"><img src="${esc(w.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>` : `<span class="thumb">${wishEm(w.title)}</span>`;
  const p = priceText(w);
  return `<div class="wish" style="animation-delay:${i * 60}ms">${thumb}<div style="min-width:0"><div class="t-ttl">${esc(w.title)}</div><div class="t-sub">${esc(w.shop || "")}<span class="num">${p ? (w.shop ? " · " : "") + esc(p) : ""}</span></div>${!kid && w.reserved ? `<span class="res">${svg("lock")}${esc(ctx.t("Reserveret"))}</span>` : ""}</div>
    <div class="wish-b">${kid || !kidId || !ctx.on("shop") ? "" : `<button class="btn soft sm" data-act="lists-wish2shop" data-l="${esc(l.id)}" data-i="${i}" ${inShop ? "disabled" : ""}>${inShop ? esc(ctx.t("Er et mål i shoppen")) : `${STAR}${esc(ctx.t("Gør til mål"))}`}</button>`}${w.url ? `<a class="iconbtn" href="${esc(w.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(ctx.t("Åbn {name}", { name: w.title }))}">${svg("go")}</a>` : ""}</div></div>`;
}

let LISTS_FOR_PICK = [];
function listPicker(ctx) {
  const row = (l) => `<button class="lx-opt" role="option" data-pick="${esc(l.id)}" aria-selected="${l.id === listId}"><span class="dot" style="background:${l.color}">${svg(l.icon)}</span><span class="lx-n">${esc(l.name)}</span><small class="num">${l.n}</small>${l.id === listId ? svg("check", "ic lx-ok") : ""}</button>`;
  const own = LISTS_FOR_PICK.filter((l) => !l.wish), wish = LISTS_FOR_PICK.filter((l) => l.wish);
  const s = ctx.sheet(`<h2>${esc(ctx.t("Vælg liste"))}</h2><div class="lx-opts" role="listbox">${own.map(row).join("")}</div>${wish.length ? `<div class="eyebrow" style="margin:14px 0 6px">${esc(ctx.t("Ønskesedler"))}</div><div class="lx-opts" role="listbox">${wish.map(row).join("")}</div>` : ""}`, { cls: "lx-sheet" });
  s.el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (!b) return;
    s.close();
    listId = b.dataset.pick;
    ctx.render(true);
  });
}

function pLists(ctx) {
  const LS = allLists(ctx);
  let L = LS.find((l) => l.id === listId) || LS[0];
  const count = (l) =>
    l.kind === "onske"
      ? l.osky.wishes.length || l.osky.count
      : (() => {
          const v = Number(ctx.hass.states[l.id]?.state);
          return Number.isFinite(v) ? v : "";
        })();
  // One list at a time, chosen in a dropdown (the lists and the wish lists in groups).
  const chips = `<div class="lx-bar">${
    L
      ? `<button class="lx-pick" data-act="lists-pick" aria-haspopup="listbox"><span class="dot" style="background:${L.color}">${svg(L.icon)}</span><span class="lx-n">${esc(L.name)}</span><small class="num">${count(L)}</small>${svg("chev", "ic lx-ch")}</button>`
      : ""
  }${ctx.isParent ? `<button class="lchip new" data-act="lists-newlist">${svg("plus")}${esc(ctx.t("Ny liste"))}</button>` : ""}</div>`;
  LISTS_FOR_PICK = LS.map((l) => ({ id: l.id, name: l.name, color: l.color, icon: l.icon, wish: l.kind === "onske", n: count(l) }));
  if (!L) return chips + `<section class="card"><h2>${esc(ctx.t("Ingen lister"))}</h2><p class="t-sub">${esc(ctx.isParent ? ctx.t("Opret den første liste med knappen ovenfor.") : ctx.t("Bed far eller mor om at lave en liste."))}</p></section>`;
  listId = L.id;
  const mid = LS.some((l) => l.locked);
  return chips + listCard(ctx, L) + `<p class="foot">${esc(mid ? ctx.t("Indkøbslisten bygges af Middagsros madplan. Alle andre lister er hver en to-do-liste i Home Assistant. Ønskesedler hentes fra Ønskeskyen. Kun forældre kan oprette og slette lister.") : ctx.t("Hver liste er en to-do-liste i Home Assistant. Ønskesedler hentes fra Ønskeskyen. Kun forældre kan oprette og slette lister."))}</p>`;
}

/* Ny liste: a new to-do list in Home Assistant (the Local To-do integration), or a wish list from Ønskeskyen. */
function newList(ctx) {
  let col = LIST_COLORS[4], kind = "list";
  const lists = (ctx.data.osky?.lists || []).filter((l) => (ctx.data.settings.osky_to || {})[l.id] === "skjul" || !(l.id in (ctx.data.settings.osky_to || {})));
  const logged = Object.keys(ctx.data.osky?.accounts || {}).length > 0;
  const people = [...PEOPLE(ctx).map((p) => [p.id, p.name]), ["begge", ctx.t("Far og mor")], ["andre", ctx.t("Venner og familie")]];
  const bg = ctx.sheet(`<h2>${esc(ctx.t("Ny liste"))}</h2><form id="nl"><div class="field"><label for="nl-t">${esc(ctx.t("Navn"))}</label><input id="nl-t" placeholder="${esc(ctx.t("Fx Elmers fødselsdag"))}"></div>
    <div class="field"><span class="lbl">${esc(ctx.t("Slags"))}</span><div class="seg" id="nl-k"><button type="button" data-k="list" aria-pressed="true">${esc(ctx.t("Liste"))}</button>${ctx.on("wish") ? `<button type="button" data-k="onske" aria-pressed="false">Ønskeskyen</button>` : ""}</div></div>
    <div class="field" id="nl-l-f" hidden>${
      logged
        ? `<label for="nl-l">${esc(ctx.t("Ønskeseddel"))}</label><select id="nl-l">${lists.map((l) => `<option value="${esc(l.id)}">${esc(l.title)} · ${esc(l.owner)}</option>`).join("") || `<option value="">${esc(ctx.t("Alle ønskesedler vises allerede"))}</option>`}</select><input id="nl-link" style="margin-top:8px" placeholder="${esc(ctx.t("Eller link fra Ønskeskyen: Del › Kopiér link"))}" autocomplete="off">`
        : `<p class="t-sub">${esc(ctx.t("Log ind i Ønskeskyen under Familieindstillinger først."))} <button type="button" class="lnk" data-go="indstillinger:osky">${esc(ctx.t("Åbn"))}</button></p>`
    }</div>
    <div class="field" id="nl-kid-f" hidden><label for="nl-kid">${esc(ctx.t("Hvis ønsker"))}</label><select id="nl-kid">${people.map(([id, n]) => `<option value="${esc(id)}">${esc(n)}</option>`).join("")}</select></div>
    <div class="field" id="nl-c-f"><span class="lbl">${esc(ctx.t("Farve"))}</span><div class="swatches" id="nl-c">${LIST_COLORS.map((c) => `<button type="button" class="sw" data-c="${c}" aria-pressed="${c === col}" style="background:${c}" aria-label="${esc(ctx.t("Farve"))}"></button>`).join("")}</div></div>
    <div class="sheet-actions"><button type="button" class="btn soft" data-close>${esc(ctx.t("Annuller"))}</button><button class="btn" type="submit">${esc(ctx.t("Opret liste"))}</button></div></form>`);
  const el = bg.el;
  el.querySelector("#nl-c").addEventListener("click", (e) => {
    const b = e.target.closest("[data-c]");
    if (!b) return;
    col = b.dataset.c;
    el.querySelectorAll("#nl-c .sw").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });
  el.querySelector("#nl-k").addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    kind = b.dataset.k;
    el.querySelectorAll("#nl-k button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    el.querySelector("#nl-kid-f").hidden = kind !== "onske";
    el.querySelector("#nl-l-f").hidden = kind !== "onske";
    el.querySelector("#nl-c-f").hidden = kind === "onske";
  });
  el.querySelector("#nl").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (kind === "onske") {
      const link = el.querySelector("#nl-link")?.value.trim() || "";
      const fromLink = link.match(/wishlists\/([A-Za-z0-9]+)/)?.[1];
      const id = fromLink || el.querySelector("#nl-l")?.value;
      if (!id) return;
      if (!(ctx.data.osky?.lists || []).some((l) => l.id === id)) return ctx.toast(ctx.t("Ønskesedlen er ikke delt med jer i Ønskeskyen"));
      const to = el.querySelector("#nl-kid").value;
      bg.close();
      if (await ctx.save("settings", { ...ctx.data.settings, osky_to: { ...(ctx.data.settings.osky_to || {}), [id]: to } })) {
        listId = `o-${id}`;
        ctx.go("lister");
        ctx.toast(ctx.t("Ønskesedlen vises nu under Lister"));
      }
      return;
    }
    const name = el.querySelector("#nl-t").value.trim();
    if (!name) return el.querySelector("#nl-t").focus();
    bg.close();
    const entity = await createTodoList(ctx, name);
    if (!entity) return;
    const todo = [...new Set([...(ctx.data.settings.todo || []), entity])];
    if (await ctx.save("settings", { ...ctx.data.settings, todo })) {
      listId = entity;
      ctx.go("lister");
      ctx.toast(ctx.t("Listen »{name}« er oprettet", { name }));
    }
  });
}

async function createTodoList(ctx, name) {
  try {
    const flow = await ctx.hass.callApi("POST", "config/config_entries/flow", { handler: "local_todo", show_advanced_options: false });
    const res = await ctx.hass.callApi("POST", `config/config_entries/flow/${flow.flow_id}`, { todo_list_name: name });
    if (res?.type !== "create_entry") throw new Error(res?.errors ? Object.values(res.errors).join(", ") : ctx.t("Home Assistant oprettede ikke listen"));
    // The new list's entity: todo.<name>, found once Home Assistant has it.
    for (let i = 0; i < 20; i++) {
      const id = Object.keys(ctx.hass.states).find((e) => e.startsWith("todo.") && ctx.name(e).toLowerCase() === name.toLowerCase() && !(ctx.data.settings.todo || []).includes(e));
      if (id) return id;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(ctx.t("Listen blev oprettet, men kunne ikke findes"));
  } catch (err) {
    ctx.toast(ctx.t("Listen kunne ikke oprettes: {error}", { error: err?.message || err?.body?.message || err }));
    return null;
  }
}

async function deleteList(ctx) {
  const L = allLists(ctx).find((l) => l.id === listId);
  listConfirm = null;
  if (!L) return;
  if (L.kind === "onske") {
    await ctx.save("settings", { ...ctx.data.settings, osky_to: { ...(ctx.data.settings.osky_to || {}), [L.osky.id]: "skjul" } });
    listId = null;
    ctx.render();
    return ctx.toast(ctx.t("Forbindelsen til Ønskeskyen er fjernet"));
  }
  // A Local To-do list is deleted in Home Assistant; other lists are only taken off Hverdagsro.
  if (ctx.hass.entities?.[L.id]?.platform === "local_todo" && ctx.hass.user?.is_admin) {
    try {
      const reg = await ctx.hass.callWS({ type: "config/entity_registry/get", entity_id: L.id });
      if (reg?.config_entry_id) await ctx.hass.callApi("DELETE", `config/config_entries/entry/${reg.config_entry_id}`);
    } catch (err) {
      ctx.toast(ctx.t("Listen kunne ikke slettes: {error}", { error: err?.message || err }));
      return;
    }
  }
  await ctx.save("settings", { ...ctx.data.settings, todo: (ctx.data.settings.todo || []).filter((x) => x !== L.id) });
  listId = null;
  ctx.render();
  ctx.toast(ctx.t("Listen »{name}« er slettet", { name: L.name }));
}

/* ---------------------------------------------------------------- acts */
const acts = {
  "lists-filter": (el, e, ctx) => {
    filters[el.dataset.id] = filters[el.dataset.id] === false;
    ctx.render(true);
  },
  "lists-newev": (el, e, ctx) => newEvent(ctx),
  "lists-ev": (el, e, ctx) => {
    const ev = weekEvents(ctx)?.[+el.dataset.i];
    if (ev) openEvent(ctx, ev);
  },
  "lists-waste": (el, e, ctx) => ctx.wasteSheet?.(),
  "lists-meal": (el, e, ctx) => mealSheet(ctx, +el.dataset.i),
  "lists-openlist": (el, e, ctx) => {
    listId = el.dataset.id;
    ctx.go("lister");
  },
  "lists-panel": (el) => {
    history.pushState(null, "", `/${el.dataset.id}`);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  },
  "lists-pick": (el, e, ctx) => listPicker(ctx),
  "lists-list": (el, e, ctx) => {
    listId = el.dataset.id;
    listConfirm = null;
    wishAdd = null;
    ctx.render(true);
  },
  "lists-newlist": (el, e, ctx) => (ctx.isParent ? newList(ctx) : ctx.toast(ctx.t("Det må kun far eller mor"))),
  "lists-dellist": (el, e, ctx) => {
    if (!ctx.isParent) return ctx.toast(ctx.t("Det må kun far eller mor"));
    listConfirm = listId;
    ctx.render(true);
  },
  "lists-dellist-no": (el, e, ctx) => {
    listConfirm = null;
    ctx.render(true);
  },
  "lists-dellist-yes": (el, e, ctx) => deleteList(ctx),
  "lists-item": async (el, e, ctx) => {
    const id = listId;
    const it = (ctx.cache["todo:" + id]?.value || []).find((x) => x.uid === el.dataset.uid);
    if (!it) return;
    const next = it.status === "completed" ? "needs_action" : "completed";
    it.status = next;
    if (next === "completed") {
      const r = el.getBoundingClientRect();
      burst(ctx, r.left + 14, r.top + 14, listMeta(ctx, id).color, 14);
    }
    ctx.render(true);
    if (await ctx.call("todo", "update_item", { entity_id: id, item: it.uid, status: next })) refreshSoon(ctx, id);
  },
  "lists-delitem": async (el, e, ctx) => {
    const id = listId;
    el.closest("[data-item]")?.classList.add("gone");
    setTimeout(async () => {
      const v = ctx.cache["todo:" + id]?.value;
      const it = v?.find((x) => x.uid === el.dataset.uid);
      if (v && it) v.splice(v.indexOf(it), 1);
      ctx.render(true);
      if (await ctx.call("todo", "remove_item", { entity_id: id, item: el.dataset.uid })) refreshSoon(ctx, id);
    }, 250);
  },
  "lists-sync": async (el, e, ctx) => {
    el.classList.add("spin");
    try {
      await ctx.ws("osky/refresh");
      ctx.toast(ctx.t("Opdateret fra Ønskeskyen"));
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
    el.classList.remove("spin");
  },
  "lists-share": async (el, e, ctx) => {
    const url = `https://onskeskyen.dk/da/wishlists/${el.dataset.id}`;
    try {
      await navigator.clipboard.writeText(url);
      ctx.toast(ctx.t("Ønskeskyen-linket er kopieret"));
    } catch (err) {
      ctx.toast(url);
    }
  },
  "lists-oskyopen": (el) => window.open(`https://onskeskyen.dk/da/wishlists/${el.dataset.id}`, "_blank", "noopener"),
  "lists-wishadd": (el, e, ctx) => {
    wishAdd = wishAdd === el.dataset.id ? null : el.dataset.id;
    ctx.render(true);
    setTimeout(() => ctx.$("wa-t")?.focus({ preventScroll: true }), 30);
  },
  "lists-wish2shop": async (el, e, ctx) => {
    const l = (ctx.data.osky?.lists || []).find((x) => x.id === el.dataset.l);
    const w = l?.wishes[+el.dataset.i];
    const kid = l && kidOf(ctx, { ...l, to: (ctx.data.settings.osky_to || {})[l.id] });
    if (!w || !kid) return;
    const cost = Math.max(1, Math.round(Number(w.price) || 200));
    const id = `w${Date.now().toString(36)}`;
    const rewards = [...(ctx.data.rewards || []), { id, title: w.title.slice(0, 60), member: kid, cost, emoji: wishEm(w.title) }];
    if (await ctx.save("rewards", rewards)) ctx.toast(ctx.t("{name} er et mål i {kid}s shop", { name: w.title, kid: ctx.member(kid).name }));
  },
};

/* ---------------------------------------------------------------- forms */
function after(ctx) {
  // The page is patched in place on updates, so a form can still have its listener from last time.
  const add = ctx.$("ls-add");
  if (add && !add._hv && (add._hv = 1))
    add.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = ctx.$("ls-add-t");
      const text = input.value.trim();
      if (!text) return;
      const id = add.dataset.list;
      const v = ctx.cache["todo:" + id]?.value;
      if (v) v.unshift({ uid: `new-${Date.now()}`, summary: text, status: "needs_action" });
      ctx.render(true);
      ctx.$("ls-add-t")?.focus();
      if (await ctx.call("todo", "add_item", { entity_id: id, item: text })) refreshSoon(ctx, id);
    });
  const wf = ctx.$("wish-f");
  if (wf && !wf._hv && (wf._hv = 1))
    wf.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = ctx.$("wa-t").value.trim();
      if (!title) return;
      const p = ctx.$("wa-p")?.value.trim().replace(/\s*kr\.?$/i, "").replace(",", ".");
      let url = ctx.$("wa-s")?.value.trim() || "";
      if (url && !/^https?:\/\//.test(url)) url = `https://${url}`;
      const btn = wf.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await ctx.ws("osky/wish", { list: wf.dataset.l, title, ...(p && !Number.isNaN(Number(p)) ? { price: Number(p) } : {}), ...(url ? { url } : {}) });
        wishAdd = null;
        if (!ctx.isParent) {
          const r = wf.getBoundingClientRect();
          burst(ctx, r.left + 40, r.top + 30, ctx.color(ctx.me?.id));
        }
        ctx.toast(!ctx.isParent ? ctx.t("Dit ønske er sat på ønskesedlen") : ctx.t("{name} er tilføjet", { name: title }));
        ctx.render(true);
      } catch (err) {
        btn.disabled = false;
        ctx.toast(String(err?.message || err));
      }
    });
}

const css = `
.lx-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
.lx-pick { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 16px; padding: 8px 12px 8px 8px; font: 800 17px var(--font-display); cursor: pointer; box-shadow: var(--shadow); text-align: left; }
.lx-pick .dot, .lx-opt .dot { width: 32px; height: 32px; border-radius: 11px; display: grid; place-items: center; color: #fff; flex: none; }
.lx-pick .dot .ic, .lx-opt .dot .ic { width: 18px; height: 18px; }
.lx-n { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lx-pick small, .lx-opt small { color: var(--muted); font: 700 13px var(--font-body); }
.lx-ch { width: 18px; height: 18px; color: var(--muted); flex: none; }
.lx-opts { display: grid; gap: 4px; }
.lx-opt { display: flex; align-items: center; gap: 10px; border: 0; background: none; color: var(--ink); padding: 8px; border-radius: 14px; font: 700 15px var(--font-body); cursor: pointer; text-align: left; }
.lx-opt[aria-selected="true"] { background: var(--surface-2); }
.lx-ok { width: 18px; height: 18px; color: var(--violet); }

.ls-confetti { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 90; }
.ls-skel { display: grid; gap: 8px; padding: 4px; }
.ls-skel i { display: block; height: 34px; border-radius: 10px; background: linear-gradient(90deg, var(--surface-2), var(--line), var(--surface-2)); background-size: 200% 100%; animation: lsshine 1.2s linear infinite; }
@keyframes lsshine { to { background-position: -200% 0; } }
.meal[data-act] { cursor: pointer; }
.wish .thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.wish-b a.iconbtn { display: inline-grid; place-items: center; color: inherit; }
`;

const en = {
  "Vælg liste": "Choose a list",
  Familien: "The family",
  "Ny aftale": "New appointment",
  "Intet i kalenderen": "Nothing in the calendar",
  "Ikke planlagt": "Not planned",
  Tømning: "Collection",
  og: "and",
  Skole: "School",
  "Hent og bring": "Drop-off and pick-up",
  "{who} henter {kid}": "{who} picks up {kid}",
  "Hele dagen": "All day",
  "Aftaler fra {names} for {range}.": "Appointments from {names} for {range}.",
  "Skemaet står samlet som »Skole til kl. {t}«; det fulde skema ligger på barnets side.": "The timetable is shown as one block, “School until {t}”; the full timetable is on the child's page.",
  "Vælg familiens kalendere under Familieindstillinger › Hjemmet.": "Choose the family's calendars under Family settings › Home.",
  Tid: "Time",
  Hvem: "Who",
  Henter: "Picks up",
  Sted: "Place",
  "{_}Fra": "{_}From",
  Vejr: "Weather",
  til: "to",
  "Ingen prognose endnu": "No forecast yet",
  Aftensmad: "Dinner",
  Luk: "Close",
  Regn: "Rain",
  Skyet: "Cloudy",
  Sol: "Sun",
  Sne: "Snow",
  "Delvis skyet": "Partly cloudy",
  Hvad: "What",
  "Fx Elvin til fødselsdag hos Alma": "E.g. birthday party at Alma's",
  "For hvem": "For whom",
  Dag: "Day",
  Til: "To",
  "Hvem henter": "Who picks up",
  "{_}Ingen": "{_}Nobody",
  Annuller: "Cancel",
  "Gem aftale": "Save appointment",
  For: "For",
  "Ingen af kalenderne kan få nye aftaler fra Home Assistant": "None of the calendars accept new appointments from Home Assistant",
  "Gemt. {name} står som den, der henter.": "Saved. {name} is down as picking up.",
  "Aftalen er gemt": "The appointment is saved",
  "Ingen madplan endnu": "No meal plan yet",
  "Vælg den kalender, der har aftensmaden, fx Middagsros madplan.": "Choose the calendar with the dinners, e.g. Middagsro's meal plan.",
  "Vælg kalender": "Choose calendar",
  "I aften": "Tonight",
  Restedag: "Leftovers day",
  "Ugens madplan": "This week's meals",
  "Fra Middagsro": "From Middagsro",
  "tilbage i ugen": "left this week",
  Indkøbslisten: "Shopping list",
  "Åbn i Middagsro": "Open in Middagsro",
  "Fanen viser Middagsros madplan direkte. Skift ret, bedøm og lav ny plan sker i Middagsro, så de to apps aldrig er uenige.": "This tab shows Middagsro's meal plan directly. Changing dishes, rating and making a new plan happen in Middagsro, so the two apps never disagree.",
  "Madplanen er kalenderen {name}. Tryk på en dag for at sætte aftensmaden.": "The meal plan is the calendar {name}. Tap a day to set the dinner.",
  "{_}Ret": "{_}Dish",
  "Fx Lasagne": "E.g. Lasagne",
  Gem: "Save",
  "{name} er sat på madplanen": "{name} is on the meal plan",
  "Slet listen »{name}« med {n} punkter?": "Delete the list “{name}” with {n} items?",
  "Slet listen": "Delete list",
  Behold: "Keep",
  "{done} af {n} klaret": "{done} of {n} done",
  "Indkøbslisten ejes af Middagsro": "The shopping list belongs to Middagsro",
  "Slet listen {name}": "Delete the list {name}",
  "Fra Middagsros madplan": "From Middagsro's meal plan",
  "Fjern {name}": "Remove {name}",
  "Listen er tom. Tilføj det første punkt herunder.": "The list is empty. Add the first item below.",
  "Tilføj til {name}": "Add to {name}",
  Tilføj: "Add",
  "lige nu": "just now",
  "for {n} min. siden": "{n} min. ago",
  "Hvad ønsker du dig?": "What do you wish for?",
  "Nyt ønske til {name}": "New wish for {name}",
  "Nyt ønske": "New wish",
  "Mit ønske": "My wish",
  Ønske: "Wish",
  "Fx en dinosaur-bog": "E.g. a dinosaur book",
  "Fx LEGO Technic 42151": "E.g. LEGO Technic 42151",
  Pris: "Price",
  Valgfri: "Optional",
  Link: "Link",
  "Fx https://br.dk/…": "E.g. https://shop.com/…",
  "Sæt på min ønskeseddel": "Put it on my wish list",
  "Tilføj ønske": "Add wish",
  "Far eller mor kan se det med det samme.": "Mum or dad can see it straight away.",
  "Ønsket lægges også i Ønskeskyen.": "The wish is also added in Ønskeskyen.",
  "Fjern forbindelsen til »{name}«? Listen i Ønskeskyen bliver ikke slettet.": "Remove the link to “{name}”? The list in Ønskeskyen isn't deleted.",
  "Fjern forbindelsen": "Remove the link",
  "Hent igen fra Ønskeskyen": "Fetch again from Ønskeskyen",
  Del: "Share",
  "Fjern forbindelsen til {name}": "Remove the link to {name}",
  "Hentet fra Ønskeskyen {when}": "Fetched from Ønskeskyen {when}",
  "{n} ønsker · {r} reserveret": "{n} wishes · {r} reserved",
  "Ønsk dig noget": "Wish for something",
  "Tilføj et ønske til {name}": "Add a wish for {name}",
  "Tilføj et ønske": "Add a wish",
  "Ingen ønsker endnu.": "No wishes yet.",
  "Dine ønsker kommer også på din børneprofil i Ønskeskyen.": "Your wishes also go on your child profile in Ønskeskyen.",
  "Ønsker du tilføjer her, lægges i Ønskeskyen. Reservationer laves i Ønskeskyen.": "Wishes you add here go into Ønskeskyen. Reservations are made in Ønskeskyen.",
  "Ønskesedlen ejes af en anden. Nye ønsker og reservationer laves i Ønskeskyen.": "Someone else owns this wish list. New wishes and reservations are made in Ønskeskyen.",
  "Åbn min børneprofil": "Open my child profile",
  "Åbn i Ønskeskyen": "Open in Ønskeskyen",
  Reserveret: "Reserved",
  "Er et mål i shoppen": "Is a goal in the shop",
  "Gør til mål": "Make it a goal",
  "Åbn {name}": "Open {name}",
  "Ny liste": "New list",
  "Ingen lister": "No lists",
  "Opret den første liste med knappen ovenfor.": "Create the first list with the button above.",
  "Bed far eller mor om at lave en liste.": "Ask mum or dad to make a list.",
  "Hver liste er en to-do-liste i Home Assistant. Ønskesedler hentes fra Ønskeskyen. Kun forældre kan oprette og slette lister.": "Each list is a to-do list in Home Assistant. Wish lists come from Ønskeskyen. Only parents can create and delete lists.",
  "Far og mor": "Mum and dad",
  "Indkøbslisten bygges af Middagsros madplan. Alle andre lister er hver en to-do-liste i Home Assistant. Ønskesedler hentes fra Ønskeskyen. Kun forældre kan oprette og slette lister.": "The shopping list is built from Middagsro's meal plan. All other lists are each a to-do list in Home Assistant. Wish lists come from Ønskeskyen. Only parents can create and delete lists.",
  "Venner og familie": "Friends and family",
  Navn: "Name",
  "Fx Elmers fødselsdag": "E.g. Tom's birthday",
  Slags: "Kind",
  Liste: "List",
  Ønskeseddel: "Wish list",
  "Alle ønskesedler vises allerede": "All wish lists are shown already",
  "Eller link fra Ønskeskyen: Del › Kopiér link": "Or a link from Ønskeskyen: Share › Copy link",
  "Log ind i Ønskeskyen under Familieindstillinger først.": "Log in to Ønskeskyen under Family settings first.",
  Åbn: "Open",
  "Hvis ønsker": "Whose wishes",
  Farve: "Colour",
  "Opret liste": "Create list",
  "Ønskesedlen er ikke delt med jer i Ønskeskyen": "That wish list isn't shared with you in Ønskeskyen",
  "Ønskesedlen vises nu under Lister": "The wish list is now shown under Lists",
  "Listen »{name}« er oprettet": "The list “{name}” is created",
  "Home Assistant oprettede ikke listen": "Home Assistant didn't create the list",
  "Listen blev oprettet, men kunne ikke findes": "The list was created but couldn't be found",
  "Listen kunne ikke oprettes: {error}": "The list couldn't be created: {error}",
  "Forbindelsen til Ønskeskyen er fjernet": "The link to Ønskeskyen is removed",
  "Listen kunne ikke slettes: {error}": "The list couldn't be deleted: {error}",
  "Listen »{name}« er slettet": "The list “{name}” is deleted",
  "Det må kun far eller mor": "Only mum or dad can do that",
  "Opdateret fra Ønskeskyen": "Updated from Ønskeskyen",
  "Ønskeskyen-linket er kopieret": "The Ønskeskyen link is copied",
  "{name} er et mål i {kid}s shop": "{name} is a goal in {kid}'s shop",
  "Dit ønske er sat på ønskesedlen": "Your wish is on the wish list",
  "{name} er tilføjet": "{name} is added",
};

export default {
  id: "lists",
  views: {
    kalender: { module: "calendar", parentOnly: true, title: (ctx) => ctx.t("Kalender"), render: pCal },
    madplan: { module: "meals", parentOnly: true, title: (ctx) => ctx.t("Madplan"), render: pMeals },
    lister: { module: "lists", title: (ctx) => ctx.t("Lister"), render: pLists, after },
  },
  acts,
  inputs: {},
  css,
  en,
};
