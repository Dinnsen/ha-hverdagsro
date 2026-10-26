/* Hverdagsro – the family's calendar, meal plan and to-do lists.
   Everything comes from Home Assistant: calendar.* entities (the family's and each member's own),
   the meal-plan calendar, and todo.* lists. Nothing is stored by Hverdagsro itself. */
import { addDays, esc, hashStr, startOfDay } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import { weatherKind } from "./hv-sky.js";

/* Calendar entity features (homeassistant.components.calendar.CalendarEntityFeature) */
const CAL_CREATE = 1, CAL_DELETE = 2, CAL_UPDATE = 4;
/* To-do list features (homeassistant.components.todo.TodoListEntityFeature) */
const TODO_DUE_DATE = 16, TODO_DUE_DATETIME = 32, TODO_DESCRIPTION = 64;
const SHARED = "_";
const VIOLET = "#6E4AFF";
const LIST_COLORS = ["#6E4AFF", "#1FA36A", "#3B6BF5", "#E4568C", "#11A39A", "#C2703D"];
const WX_ICON = { rain: "rain", snow: "snow", cloudy: "cloudy", partly: "partly", sun: "sun" };
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;

/* Local UI state */
const cal = { week: 0, sel: null, mode: null, filters: {} };
const meal = { week: 0 };
const lst = { id: null, showDone: false, seen: {}, pending: {} };
let shownEvents = [];
let shownMeals = [];
let lastMeals = [];

/* ---------------------------------------------------------------- helpers */
const pad = (n) => String(n).padStart(2, "0");
const monday = (d) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s) => new Date(`${s}T00:00:00`);
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const haDateTime = (day, time) => `${day} ${time}:00`;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const features = (ctx, id) => {
  const f = ctx.hass?.states?.[id]?.attributes?.supported_features;
  return f == null ? CAL_CREATE | CAL_DELETE | CAL_UPDATE : Number(f);
};
function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - y0) / 864e5 + 1) / 7);
}
const covers = (e, day) => {
  const s = startOfDay(day), n = addDays(s, 1);
  return e.start < n && (e.end > s || +e.start === +s);
};
const skeleton = (n = 3) => `<div class="ls-skel">${Array.from({ length: n }, (_, i) => `<i style="animation-delay:${i * 120}ms"></i>`).join("")}</div>`;

/* Events with their uid, so they can be changed or deleted. Cached under "ev:" so ctx.drop("ev:") clears them. */
function loadEvents(ctx, cals, start, end) {
  const list = [...new Set((cals || []).filter(Boolean))];
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
            uid: e.uid || null,
            recurrence_id: e.recurrence_id || null,
            rrule: e.rrule || null,
          };
        })
        .sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));
    },
    120000
  );
  return value === undefined ? null : value;
}

/* ================================================================ Calendar */
function owners(ctx) {
  const map = {};
  for (const m of ctx.members()) if (m.calendar) map[m.calendar] = m;
  return map;
}
function calendars(ctx) {
  const meals = ctx.data.settings.meals_calendar;
  const list = [...(ctx.data.settings.calendars || []), ...ctx.members().map((m) => m.calendar)].filter((c) => c && c !== meals && ctx.hass.states[c]);
  return [...new Set(list)];
}
const groupOf = (own, e) => own[e.calendar]?.id || SHARED;
const colorOf = (own, e) => own[e.calendar]?.color || VIOLET;

function filterChips(ctx, own, cals) {
  const groups = [];
  const seen = new Set();
  for (const c of cals) {
    const m = own[c];
    const g = m ? m.id : SHARED;
    if (seen.has(g)) continue;
    seen.add(g);
    groups.push(m ? { id: m.id, name: m.name, color: m.color, av: ctx.avatar(m.id) } : { id: SHARED, name: ctx.t("Fælles"), color: VIOLET, av: `<span class="av" style="background:${VIOLET}">${svg("users")}</span>` });
  }
  if (groups.length < 2) return "";
  return `<div class="filters">${groups
    .map((g) => `<button class="fchip" data-act="lists-filter" data-id="${esc(g.id)}" aria-pressed="${cal.filters[g.id] !== false}" style="--fc:${g.color}">${g.av}${esc(g.name)}</button>`)
    .join("")}</div>`;
}

function dinnerFor(ctx, meals, day) {
  if (!meals) return "";
  const list = meals.filter((e) => covers(e, day));
  return list.map((e) => e.title).join(", ");
}
function wasteFor(ctx, day) {
  if (!ctx.on("waste")) return [];
  try {
    return (ctx.waste?.() || []).filter((w) => isoDay(w.date) === isoDay(day));
  } catch (err) {
    return [];
  }
}
function weatherFor(ctx, day) {
  const f = (ctx.forecast?.daily || []).find((d) => isoDay(new Date(d.datetime)) === isoDay(day));
  if (!f) return "";
  return `${svg(WX_ICON[weatherKind(f.condition)])}${Math.round(f.temperature)}°`;
}
const timeText = (ctx, e) => {
  if (e.allDay) {
    const days = Math.round((startOfDay(e.end) - startOfDay(e.start)) / 864e5);
    return days > 1 ? ctx.t("Hele dagen · {n} dage", { n: days }) : ctx.t("Hele dagen");
  }
  return `${ctx.fmt.time(e.start)}–${ctx.fmt.time(e.end)}`;
};

function renderCalendar(ctx) {
  const own = owners(ctx);
  const cals = calendars(ctx);
  if (!cals.length) {
    return `<section class="card hv-empty ls-empty">${svg("cal", "ic big")}<h2>${esc(ctx.t("Ingen kalendere endnu"))}</h2>
      <p class="t-sub">${esc(ctx.t("Vælg familiens kalendere, så samles alle aftaler her."))}</p>
      ${ctx.isParent ? `<button class="btn" data-go="indstillinger:hjemmet">${svg("gear")}${esc(ctx.t("Vælg kalendere"))}</button>` : ""}</section>`;
  }
  const today = startOfDay(new Date());
  const start = addDays(monday(today), cal.week * 7);
  const end = addDays(start, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  if (!cal.sel || fromIso(cal.sel) < start || fromIso(cal.sel) >= end) cal.sel = isoDay(cal.week === 0 ? today : start);
  const mode = cal.mode || (ctx.host.clientWidth && ctx.host.clientWidth < 760 ? "dag" : "uge");
  const all = loadEvents(ctx, cals, start, end);
  const mealCal = ctx.on("meals") && ctx.data.settings.meals_calendar;
  const meals = mealCal ? loadEvents(ctx, [mealCal], start, end) : null;
  const evs = (all || []).filter((e) => cal.filters[groupOf(own, e)] !== false);
  shownEvents = evs;
  lastMeals = meals || [];
  const canCreate = ctx.isParent && cals.some((c) => features(ctx, c) & CAL_CREATE);
  const label = `${ctx.t("Uge {n}", { n: isoWeek(start) })} · ${ctx.fmt.date(start, { day: "numeric", month: "short" })} – ${ctx.fmt.date(addDays(end, -1), { day: "numeric", month: "short" })}`;

  const tools = `<div class="cal-tools">${filterChips(ctx, own, cals) || "<span></span>"}
    <div class="ls-tools-r"><div class="seg ls-mode" role="group" aria-label="${esc(ctx.t("Visning"))}">
      <button data-act="lists-mode" data-mode="dag" aria-pressed="${mode === "dag"}">${esc(ctx.t("Dag"))}</button><button data-act="lists-mode" data-mode="uge" aria-pressed="${mode === "uge"}">${esc(ctx.t("Uge"))}</button></div>
      ${canCreate ? `<button class="btn" data-act="lists-newev">${svg("plus")}${esc(ctx.t("Ny begivenhed"))}</button>` : ""}</div></div>`;
  const nav = `<div class="ls-weeknav"><button class="iconbtn" data-act="lists-week" data-d="-1" aria-label="${esc(ctx.t("Forrige uge"))}">${svg("back")}</button>
    <b class="num">${esc(label)}</b><button class="iconbtn" data-act="lists-week" data-d="1" aria-label="${esc(ctx.t("Næste uge"))}">${svg("go")}</button>
    ${cal.week !== 0 ? `<button class="btn soft sm" data-act="lists-week" data-d="0">${esc(ctx.t("I dag"))}</button>` : ""}</div>`;

  const dayEvents = (d) => evs.filter((e) => covers(e, d));
  const strip = `<div class="ls-strip" role="tablist">${days
    .map((d) => {
      const id = isoDay(d);
      const list = dayEvents(d);
      const dots = [...new Set(list.map((e) => colorOf(own, e)))].slice(0, 4);
      return `<button class="ls-sd${+d === +today ? " today" : ""}${d < today ? " past" : ""}" role="tab" data-act="lists-day" data-d="${id}" aria-selected="${id === cal.sel}" aria-pressed="${id === cal.sel}">
        <span>${esc(ctx.fmt.short(d))}</span><b class="num">${d.getDate()}</b><i>${dots.map((c) => `<em style="background:${c}"></em>`).join("")}</i></button>`;
    })
    .join("")}</div>`;

  let body;
  if (all === null) body = skeleton(4);
  else if (mode === "dag") {
    const d = fromIso(cal.sel);
    const list = dayEvents(d);
    const allDay = list.filter((e) => e.allDay);
    const timed = list.filter((e) => !e.allDay);
    const dinner = dinnerFor(ctx, meals, d);
    const bins = wasteFor(ctx, d);
    const wx = weatherFor(ctx, d);
    const nowLine = +d === +today;
    let nowPlaced = false;
    const now = new Date();
    const rows = timed
      .map((e) => {
        let line = "";
        if (nowLine && !nowPlaced && e.start > now) {
          nowPlaced = true;
          line = `<div class="ls-nowline"><span class="num">${ctx.fmt.time(now)}</span></div>`;
        }
        const idx = evs.indexOf(e);
        const m = own[e.calendar];
        return `${line}<button class="ls-ag${e.end < now ? " past" : ""}" data-act="lists-ev" data-i="${idx}" style="--ec:${colorOf(own, e)};animation-delay:${Math.min(idx, 10) * 45}ms">
          <span class="ls-ag-t num"><b>${ctx.fmt.time(e.start)}</b><small>${ctx.fmt.time(e.end)}</small></span>
          <span class="ls-ag-b"><b>${esc(e.title)}</b>${e.location ? `<small>${esc(e.location)}</small>` : ""}</span>
          ${m ? ctx.avatar(m.id, "sm") : ""}</button>`;
      })
      .join("");
    body = `<section class="card ls-day">
      <div class="card-head"><div><div class="eyebrow">${esc(cap(ctx.fmt.rel(d)))}</div><h2>${esc(cap(ctx.fmt.day(d)))} ${esc(ctx.fmt.date(d))}</h2></div>${wx ? `<span class="ls-wx">${wx}</span>` : ""}</div>
      ${allDay.length || bins.length ? `<div class="ls-allday">${allDay
        .map((e) => `<button class="ev" data-act="lists-ev" data-i="${evs.indexOf(e)}" style="--ec:${colorOf(own, e)}"><b>${esc(e.title)}</b><small>${esc(timeText(ctx, e))}</small></button>`)
        .join("")}${bins.map((w) => `<div class="ev ls-bin" style="--ec:${w.color}">${svg("trash2")}<b>${esc(w.name)}</b><small>${esc(ctx.t("Tømning"))}</small></div>`).join("")}</div>` : ""}
      <div class="ls-agenda">${rows}${nowLine && !nowPlaced && timed.length ? `<div class="ls-nowline"><span class="num">${ctx.fmt.time(now)}</span></div>` : ""}
      ${!timed.length && !allDay.length ? `<div class="ls-free">${svg("sun")}<span>${esc(ctx.t("Ingen aftaler. En rolig dag."))}</span></div>` : ""}</div>
      ${dinner ? `<div class="ev-dinner ls-dinner">${svg("food")}<span><b>${esc(ctx.t("Aftensmad"))}</b> ${esc(dinner)}</span></div>` : ""}</section>`;
  } else {
    body = `<div class="week ls-week">${days
      .map((d, i) => {
        const list = dayEvents(d);
        const dinner = dinnerFor(ctx, meals, d);
        const bins = wasteFor(ctx, d);
        const wx = weatherFor(ctx, d);
        return `<div class="wday${+d === +today ? " today" : ""}${d < today ? " ls-past" : ""}">
          <button class="wday-h ls-wh" data-act="lists-day" data-d="${isoDay(d)}" data-mode="dag" aria-label="${esc(cap(ctx.fmt.day(d)))} ${esc(ctx.fmt.date(d))}"><span>${esc(ctx.fmt.short(d))}</span><b>${d.getDate()}</b><em>${wx}</em></button>
          ${bins.map((w) => `<div class="ev ls-bin" style="--ec:${w.color}">${svg("trash2")}<b>${esc(w.name)}</b><small>${esc(ctx.t("Tømning"))}</small></div>`).join("")}
          ${list
            .map((e, k) => `<button class="ev" data-act="lists-ev" data-i="${evs.indexOf(e)}" style="--ec:${colorOf(own, e)};animation-delay:${i * 40 + k * 50}ms"><b>${esc(e.title)}</b><small class="num">${esc(e.allDay ? ctx.t("Hele dagen") : `${ctx.fmt.time(e.start)}–${ctx.fmt.time(e.end)}`)}</small></button>`)
            .join("") || `<div class="t-sub ls-none">${esc(ctx.t("Intet i kalenderen"))}</div>`}
          ${dinner ? `<div class="ev-dinner">${svg("food")}<span>${esc(dinner)}</span></div>` : ""}</div>`;
      })
      .join("")}</div>`;
  }
  const error = all !== null && !all.length && Object.entries(ctx.cache).find(([k, v]) => k.startsWith("ev:lists:") && v.error)?.[1].error;
  return `${tools}${nav}${mode === "dag" ? strip : ""}${body}${error ? `<p class="t-sub">${esc(ctx.t("Kalenderen kunne ikke hentes: {error}", { error }))}</p>` : ""}`;
}

function eventSheet(ctx, e) {
  const own = owners(ctx);
  const m = own[e.calendar];
  const d = e.start;
  const canDelete = ctx.isParent && e.uid && features(ctx, e.calendar) & CAL_DELETE;
  const mealCal = ctx.on("meals") && ctx.data.settings.meals_calendar;
  const s = ctx.sheet(`<div class="eyebrow">${esc(cap(ctx.fmt.day(d)))} ${esc(ctx.fmt.date(d))}</div><h2>${esc(e.title)}</h2>
    <dl class="kv"><dt>${esc(ctx.t("Tid"))}</dt><dd class="num">${esc(timeText(ctx, e))}</dd>
    <dt>${esc(ctx.t("Kalender"))}</dt><dd>${m ? `<span class="chip"><i style="background:${m.color}"></i>${esc(m.name)}</span>` : `<span class="chip"><i style="background:${VIOLET}"></i>${esc(ctx.name(e.calendar))}</span>`}</dd>
    ${e.location ? `<dt>${esc(ctx.t("Sted"))}</dt><dd>${esc(e.location)}</dd>` : ""}
    ${e.description ? `<dt>${esc(ctx.t("Noter"))}</dt><dd class="ls-desc">${esc(e.description)}</dd>` : ""}
    ${e.rrule ? `<dt>${esc(ctx.t("Gentages"))}</dt><dd>${esc(ctx.t("Ja"))}</dd>` : ""}
    ${mealCal && shownMealsFor(d) ? `<dt>${esc(ctx.t("Aftensmad"))}</dt><dd>${esc(shownMealsFor(d))}</dd>` : ""}</dl>
    <div class="sheet-actions">${canDelete ? `<button class="btn danger" data-del>${svg("trash")}${esc(ctx.t("Slet"))}</button>` : ""}<button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
  s.el.querySelector("[data-del]")?.addEventListener("click", () => {
    s.close();
    ctx.confirm(ctx.t("Slet aftalen?"), ctx.t("»{title}« slettes fra kalenderen.", { title: e.title }), ctx.t("Slet"), async () => {
      try {
        await ctx.hass.callWS({ type: "calendar/event/delete", entity_id: e.calendar, uid: e.uid, ...(e.recurrence_id ? { recurrence_id: e.recurrence_id } : {}) });
        ctx.toast(ctx.t("Aftalen er slettet"));
      } catch (err) {
        ctx.toast(ctx.t("Kunne ikke slette: {error}", { error: err?.message || err }));
      }
      ctx.drop("ev:");
      ctx.render();
    });
  });
}
const shownMealsFor = (d) => lastMeals.filter((e) => covers(e, d)).map((e) => e.title).join(", ");

function newEventSheet(ctx) {
  const own = owners(ctx);
  const cals = calendars(ctx).filter((c) => features(ctx, c) & CAL_CREATE);
  const mine = cals.find((c) => own[c]?.id === ctx.me?.id) || cals.find((c) => !own[c]) || cals[0];
  const day = cal.sel || isoDay(new Date());
  const nextHour = Math.min(22, new Date().getHours() + 1);
  let allDay = false;
  const s = ctx.sheet(`<h2>${esc(ctx.t("Ny begivenhed"))}</h2><form class="ls-form">
    <div class="field"><label for="ls-t">${esc(ctx.t("Hvad"))}</label><input id="ls-t" required maxlength="120" placeholder="${esc(ctx.t("Fx fødselsdag hos mormor"))}" autocomplete="off"></div>
    <div class="field"><span class="lbl">${esc(ctx.t("Kalender"))}</span><div class="filters ls-cals">${cals
      .map((c) => {
        const m = own[c];
        return `<button type="button" class="fchip" data-c="${esc(c)}" aria-pressed="${c === mine}" style="--fc:${m?.color || VIOLET}">${m ? ctx.avatar(m.id) : `<span class="av" style="background:${VIOLET}">${svg("users")}</span>`}${esc(m ? m.name : ctx.name(c))}</button>`;
      })
      .join("")}</div></div>
    <div class="row"><div class="field"><label for="ls-d">${esc(ctx.t("Dag"))}</label><input id="ls-d" type="date" value="${day}" required></div>
      <div class="field ls-time"><label for="ls-s">${esc(ctx.t("Fra"))}</label><input id="ls-s" type="time" value="${pad(nextHour)}:00"></div>
      <div class="field ls-time"><label for="ls-e">${esc(ctx.t("Til"))}</label><input id="ls-e" type="time" value="${pad(Math.min(23, nextHour + 1))}:00"></div></div>
    <label class="ls-switch"><input type="checkbox" id="ls-all"><span></span>${esc(ctx.t("Hele dagen"))}</label>
    <div class="field"><label for="ls-l">${esc(ctx.t("Sted (valgfrit)"))}</label><input id="ls-l" maxlength="120" autocomplete="off"></div>
    <div class="sheet-actions"><button type="button" class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" type="submit">${esc(ctx.t("Gem"))}</button></div></form>`);
  const el = s.el;
  let chosen = mine;
  el.querySelector(".ls-cals").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-c]");
    if (!b) return;
    chosen = b.dataset.c;
    el.querySelectorAll(".ls-cals [data-c]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });
  el.querySelector("#ls-all").addEventListener("change", (ev) => {
    allDay = ev.target.checked;
    el.querySelectorAll(".ls-time").forEach((x) => (x.hidden = allDay));
  });
  setTimeout(() => el.querySelector("#ls-t")?.focus(), 50);
  el.querySelector("form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const title = el.querySelector("#ls-t").value.trim();
    const d = el.querySelector("#ls-d").value;
    if (!title || !d || !chosen) return;
    const data = { entity_id: chosen, summary: title };
    const loc = el.querySelector("#ls-l").value.trim();
    if (loc) data.location = loc;
    if (allDay) Object.assign(data, { start_date: d, end_date: isoDay(addDays(fromIso(d), 1)) });
    else {
      const st = el.querySelector("#ls-s").value || "12:00";
      let en = el.querySelector("#ls-e").value || st;
      let endDay = d;
      if (en <= st) {
        const x = new Date(`${d}T${st}:00`);
        x.setHours(x.getHours() + 1);
        en = hm(x);
        endDay = isoDay(x);
      }
      Object.assign(data, { start_date_time: haDateTime(d, st), end_date_time: haDateTime(endDay, en) });
    }
    const btn = el.querySelector("[type=submit]");
    btn.disabled = true;
    const ok = await ctx.call("calendar", "create_event", data);
    btn.disabled = false;
    if (!ok) return;
    s.close();
    cal.sel = d;
    const diff = Math.floor((monday(fromIso(d)) - monday(new Date())) / (7 * 864e5));
    cal.week = Math.round(diff);
    ctx.drop("ev:");
    ctx.render();
    ctx.toast(ctx.t("»{title}« er lagt i kalenderen", { title }));
  });
}

/* ================================================================ Meal plan */
function renderMeals(ctx) {
  const mc = ctx.data.settings.meals_calendar;
  if (!mc || !ctx.hass.states[mc]) {
    return `<section class="card hv-empty ls-empty">${svg("food", "ic big")}<h2>${esc(ctx.t("Ingen madplan endnu"))}</h2>
      <p class="t-sub">${esc(ctx.t("Vælg den kalender, jeres aftensmad står i. Hver dag er en begivenhed med retten som titel."))}</p>
      ${ctx.isParent ? `<button class="btn" data-go="indstillinger:hjemmet">${svg("gear")}${esc(ctx.t("Vælg madplanens kalender"))}</button>` : ""}</section>`;
  }
  const today = startOfDay(new Date());
  const start = addDays(monday(today), meal.week * 7);
  const end = addDays(start, 7);
  const evs = loadEvents(ctx, [mc], start, end);
  lastMeals = evs || [];
  const canEdit = ctx.isParent && features(ctx, mc) & (CAL_CREATE | CAL_UPDATE);
  const label = `${ctx.t("Uge {n}", { n: isoWeek(start) })} · ${ctx.fmt.date(start, { day: "numeric", month: "short" })} – ${ctx.fmt.date(addDays(end, -1), { day: "numeric", month: "short" })}`;
  const nav = `<div class="ls-weeknav"><button class="iconbtn" data-act="lists-mweek" data-d="-1" aria-label="${esc(ctx.t("Forrige uge"))}">${svg("back")}</button>
    <b class="num">${esc(label)}</b><button class="iconbtn" data-act="lists-mweek" data-d="1" aria-label="${esc(ctx.t("Næste uge"))}">${svg("go")}</button>
    ${meal.week !== 0 ? `<button class="btn soft sm" data-act="lists-mweek" data-d="0">${esc(ctx.t("I dag"))}</button>` : ""}<span class="grow"></span>
    ${ctx.on("lists") && (ctx.data.settings.todo || []).length ? `<button class="btn soft sm" data-go="lister">${svg("cart")}${esc(ctx.t("Indkøbslisten"))}</button>` : ""}</div>`;
  if (evs === null) return nav + skeleton(3);
  shownMeals = [];
  const cards = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    const list = evs.filter((e) => covers(e, d));
    shownMeals[i] = list;
    const tonight = +d === +today;
    const past = d < today;
    const eyebrow = tonight ? ctx.t("I aften") : +d === +addDays(today, 1) ? ctx.t("I morgen") : cap(ctx.fmt.day(d));
    const timed = list.find((e) => !e.allDay);
    const sub = timed ? ctx.t("Kl. {time}", { time: ctx.fmt.time(timed.start) }) : list[0]?.description ? list[0].description.split("\n")[0] : "";
    const inner = `<div class="eyebrow">${esc(eyebrow)} · ${esc(ctx.fmt.date(d, { day: "numeric", month: "short" }))}</div>
      <h3>${list.length ? esc(list.map((e) => e.title).join(" · ")) : `<span class="ls-nodish">${esc(ctx.t("Ingen ret endnu"))}</span>`}</h3>
      ${sub ? `<div class="m-sub">${esc(sub)}</div>` : ""}${canEdit ? `<span class="ls-medit">${svg(list.length ? "edit" : "plus")}</span>` : ""}`;
    const cls = `meal ls-meal${tonight ? " tonight" : ""}${!list.length ? " rest" : ""}${past ? " ls-past" : ""}`;
    const style = `animation:pop .5s ${i * 60}ms both`;
    return canEdit
      ? `<button class="${cls}" data-act="lists-meal" data-i="${i}" style="${style}">${inner}</button>`
      : `<article class="${cls}" style="${style}">${inner}</article>`;
  }).join("");
  return `${nav}<div class="meals ls-meals">${cards}</div>
    <p class="foot">${esc(ctx.t("Madplanen kommer fra kalenderen »{name}«. Retten er begivenhedens titel.", { name: ctx.name(mc) }))}</p>`;
}

function mealSheet(ctx, i) {
  const mc = ctx.data.settings.meals_calendar;
  const today = startOfDay(new Date());
  const start = addDays(monday(today), meal.week * 7);
  const d = addDays(start, i);
  const list = shownMeals[i] || [];
  const cur = list[0];
  const f = features(ctx, mc);
  const canUpdate = cur?.uid && f & CAL_UPDATE;
  const canDelete = cur?.uid && f & CAL_DELETE;
  // Suggestions: dishes from the last weeks.
  const back = loadEvents(ctx, [mc], addDays(start, -28), start) || [];
  const sugg = [...new Set([...back, ...lastMeals].map((e) => e.title.trim()).filter(Boolean))].filter((t) => t !== cur?.title).slice(-10).reverse();
  const s = ctx.sheet(`<div class="eyebrow">${esc(cap(ctx.fmt.day(d)))} ${esc(ctx.fmt.date(d))}</div><h2>${esc(ctx.t("Aftensmad"))}</h2>
    <form class="ls-form"><div class="field"><label for="ls-m">${esc(ctx.t("Ret"))}</label><input id="ls-m" required maxlength="120" value="${esc(cur?.title || "")}" placeholder="${esc(ctx.t("Fx lasagne"))}" autocomplete="off"></div>
    ${sugg.length ? `<div class="field"><span class="lbl">${esc(ctx.t("Forslag fra de sidste uger"))}</span><div class="ls-sugg">${sugg.map((t) => `<button type="button" class="chip" data-s="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>` : ""}
    ${list.length > 1 ? `<p class="t-sub">${esc(ctx.t("Der står {n} retter denne dag. Kun den første ændres.", { n: list.length }))}</p>` : ""}
    <div class="sheet-actions">${canDelete ? `<button type="button" class="btn danger" data-del>${svg("trash")}${esc(ctx.t("Fjern"))}</button>` : ""}<button type="button" class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" type="submit">${esc(ctx.t("Gem"))}</button></div></form>`);
  const el = s.el;
  const input = el.querySelector("#ls-m");
  setTimeout(() => input.focus(), 50);
  el.querySelector(".ls-sugg")?.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-s]");
    if (b) input.value = b.dataset.s;
  });
  const done = (msg) => {
    s.close();
    ctx.drop("ev:");
    ctx.render();
    if (msg) ctx.toast(msg);
  };
  el.querySelector("[data-del]")?.addEventListener("click", async () => {
    try {
      await ctx.hass.callWS({ type: "calendar/event/delete", entity_id: mc, uid: cur.uid, ...(cur.recurrence_id ? { recurrence_id: cur.recurrence_id } : {}) });
      done(ctx.t("Retten er fjernet"));
    } catch (err) {
      ctx.toast(ctx.t("Kunne ikke slette: {error}", { error: err?.message || err }));
    }
  });
  el.querySelector("form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const title = input.value.trim();
    if (!title) return;
    const day = isoDay(d), next = isoDay(addDays(d, 1));
    if (canUpdate) {
      try {
        const event = cur.allDay ? { summary: title, dtstart: day, dtend: next } : { summary: title, dtstart: cur.start.toISOString(), dtend: cur.end.toISOString() };
        await ctx.hass.callWS({ type: "calendar/event/update", entity_id: mc, uid: cur.uid, ...(cur.recurrence_id ? { recurrence_id: cur.recurrence_id } : {}), event });
        done(ctx.t("Aftensmaden er gemt"));
      } catch (err) {
        ctx.toast(ctx.t("Kunne ikke gemme: {error}", { error: err?.message || err }));
      }
      return;
    }
    const ok = await ctx.call("calendar", "create_event", { entity_id: mc, summary: title, start_date: day, end_date: next });
    if (ok) done(ctx.t("Aftensmaden er gemt"));
  });
}

/* ================================================================ To-do lists */
function todoLists(ctx) {
  return (ctx.data.settings.todo || []).filter((id) => ctx.hass.states[id]);
}
const isShopping = (ctx, id) => /indk|shop|handle|grocer|indkøb/i.test(`${id} ${ctx.name(id)}`);
const listColor = (ctx, id) => (isShopping(ctx, id) ? "#E8742A" : LIST_COLORS[hashStr(id) % LIST_COLORS.length]);

function items(ctx, id) {
  const state = ctx.st(id)?.state;
  const key = "todo:" + id;
  // A new state means the list changed somewhere else: fetch it again.
  if (lst.seen[id] !== undefined && lst.seen[id] !== state && ctx.cache[key]) ctx.drop(key);
  lst.seen[id] = state;
  const value = ctx.load(key, () => ctx.hass.callWS({ type: "todo/item/list", entity_id: id }).then((r) => r?.items || []), 30000);
  if (value === undefined) return null;
  return value;
}
const openCount = (ctx, id) => {
  const n = Number(ctx.hass.states[id]?.state);
  if (Number.isFinite(n)) return n;
  const v = ctx.cache["todo:" + id]?.value;
  return v ? v.filter((i) => i.status !== "completed").length : "";
};
function dueText(ctx, due) {
  if (!due) return null;
  const hasTime = /T|\s\d/.test(due);
  const d = hasTime ? new Date(due) : fromIso(due.slice(0, 10));
  const over = hasTime ? d < new Date() : d < startOfDay(new Date());
  return { text: cap(ctx.fmt.rel(d)) + (hasTime ? ` ${ctx.fmt.time(d)}` : ""), over, today: isoDay(d) === isoDay(new Date()) };
}

function itemRow(ctx, id, it, color) {
  const done = it.status === "completed";
  const due = dueText(ctx, it.due);
  return `<div class="item ls-item${done ? " done" : ""}">
    <button class="check" data-act="lists-check" data-list="${esc(id)}" data-uid="${esc(it.uid)}" aria-label="${esc(it.summary)}" aria-pressed="${done}" style="${done ? `background:${color};border-color:transparent` : ""}">${CHECK}</button>
    <button class="ls-it" data-act="lists-edit" data-list="${esc(id)}" data-uid="${esc(it.uid)}"><span class="t-ttl">${esc(it.summary)}</span>${it.description ? `<small>${esc(it.description)}</small>` : ""}</button>
    ${due ? `<span class="ls-due${due.over && !done ? " over" : due.today ? " today" : ""}">${svg("clock")}${esc(due.text)}</span>` : "<span></span>"}
    <button class="iconbtn" data-act="lists-del" data-list="${esc(id)}" data-uid="${esc(it.uid)}" aria-label="${esc(ctx.t("Fjern {name}", { name: it.summary }))}">${svg("x")}</button></div>`;
}

function renderLists(ctx) {
  const lists = todoLists(ctx);
  if (!lists.length) {
    return `<section class="card hv-empty ls-empty">${svg("lists", "ic big")}<h2>${esc(ctx.t("Ingen lister endnu"))}</h2>
      <p class="t-sub">${esc(ctx.isParent ? ctx.t("Vælg de to-do-lister fra Home Assistant, familien skal bruge – fx indkøb og huskeliste.") : ctx.t("Bed en voksen om at vælge familiens lister."))}</p>
      ${ctx.isParent ? `<button class="btn" data-act="lists-pick">${svg("plus")}${esc(ctx.t("Vælg lister"))}</button>` : ""}</section>`;
  }
  if (!lists.includes(lst.id)) lst.id = lists[0];
  const id = lst.id;
  const color = listColor(ctx, id);
  const chips = `<div class="lists">${lists
    .map((l, i) => `<button class="lchip" data-act="lists-list" data-id="${esc(l)}" aria-pressed="${l === id}" style="animation-delay:${i * 50}ms"><span class="dot" style="background:${listColor(ctx, l)}">${svg(isShopping(ctx, l) ? "cart" : "lists")}</span>${esc(ctx.name(l))}<small>${openCount(ctx, l)}</small></button>`)
    .join("")}${ctx.isParent ? `<button class="lchip new" data-act="lists-pick">${svg("plus")}${esc(ctx.t("Lister"))}</button>` : ""}</div>`;
  const all = items(ctx, id);
  const f = Number(ctx.hass.states[id]?.attributes?.supported_features || 0);
  const dueOk = f & (TODO_DUE_DATE | TODO_DUE_DATETIME);
  let body;
  if (all === null) body = skeleton(4);
  else {
    const list = all.filter((it) => !lst.pending[`${id}:${it.uid}`]?.gone);
    const open = list.filter((it) => it.status !== "completed");
    const closed = list.filter((it) => it.status === "completed");
    const err = ctx.cache["todo:" + id]?.error;
    body = `${err && !all.length ? `<p class="t-sub">${esc(ctx.t("Listen kunne ikke hentes: {error}", { error: err }))}</p>` : ""}
      <div class="items">${open.map((it) => itemRow(ctx, id, it, color)).join("") || `<div class="ls-free">${svg("check")}<span>${esc(closed.length ? ctx.t("Alt er klaret!") : ctx.t("Listen er tom. Tilføj det første punkt herunder."))}</span></div>`}</div>
      <form class="add ls-add" data-list="${esc(id)}"><input name="t" placeholder="${esc(ctx.t("Tilføj til {name}", { name: ctx.name(id).toLowerCase() }))}" autocomplete="off" maxlength="200" enterkeyhint="done">
        ${dueOk ? `<input name="d" type="date" class="ls-adddate" aria-label="${esc(ctx.t("Dato"))}">` : ""}<button class="btn" type="submit">${svg("plus")}${esc(ctx.t("Tilføj"))}</button></form>
      ${closed.length ? `<div class="ls-donehead"><button class="ls-toggle" data-act="lists-showdone" aria-expanded="${lst.showDone}">${svg(lst.showDone ? "up" : "down")}${esc(ctx.t("Klaret ({n})", { n: closed.length }))}</button>
        <button class="btn soft sm" data-act="lists-clear" data-list="${esc(id)}">${svg("trash")}${esc(ctx.t("Ryd klarede"))}</button></div>
        ${lst.showDone ? `<div class="items ls-closed">${closed.map((it) => itemRow(ctx, id, it, color)).join("")}</div>` : ""}` : ""}`;
    const total = list.length;
    body = `<div class="progress"><i style="width:${total ? (closed.length / total) * 100 : 0}%;background:${color}"></i></div>${body}`;
    body = `<div class="card-head"><h2>${esc(ctx.name(id))}</h2><span class="meta num">${esc(ctx.t("{done} af {total} klaret", { done: closed.length, total }))}</span></div>${body}`;
    return `${chips}<section class="card ls-list" style="--lc:${color}">${body}</section>`;
  }
  return `${chips}<section class="card ls-list"><div class="card-head"><h2>${esc(ctx.name(id))}</h2></div>${body}</section>`;
}

function findItem(ctx, list, uid) {
  return (ctx.cache["todo:" + list]?.value || []).find((i) => i.uid === uid);
}
async function refreshSoon(ctx, list) {
  setTimeout(() => {
    ctx.drop("todo:" + list);
    ctx.render();
  }, 700);
}

function editItemSheet(ctx, list, uid) {
  const it = findItem(ctx, list, uid);
  if (!it) return;
  const f = Number(ctx.hass.states[list]?.attributes?.supported_features || 0);
  const dueOk = f & TODO_DUE_DATE, dueTimeOk = f & TODO_DUE_DATETIME, descOk = f & TODO_DESCRIPTION;
  const due = it.due || "";
  const s = ctx.sheet(`<div class="eyebrow">${esc(ctx.name(list))}</div><h2>${esc(ctx.t("Ret punkt"))}</h2><form class="ls-form">
    <div class="field"><label for="ls-it">${esc(ctx.t("Tekst"))}</label><input id="ls-it" required maxlength="200" value="${esc(it.summary)}" autocomplete="off"></div>
    ${dueOk || dueTimeOk ? `<div class="row"><div class="field"><label for="ls-du">${esc(ctx.t("Dato"))}</label><input id="ls-du" type="date" value="${esc(due.slice(0, 10))}"></div>
      ${dueTimeOk ? `<div class="field"><label for="ls-dt">${esc(ctx.t("Tid"))}</label><input id="ls-dt" type="time" value="${/T|\s/.test(due) ? hm(new Date(due)) : ""}"></div>` : ""}</div>` : ""}
    ${descOk ? `<div class="field"><label for="ls-de">${esc(ctx.t("Noter"))}</label><textarea id="ls-de" rows="3" maxlength="1000">${esc(it.description || "")}</textarea></div>` : ""}
    <div class="sheet-actions"><button type="button" class="btn danger" data-del>${svg("trash")}${esc(ctx.t("Slet"))}</button><button type="button" class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" type="submit">${esc(ctx.t("Gem"))}</button></div></form>`);
  const el = s.el;
  el.querySelector("[data-del]").addEventListener("click", () => {
    s.close();
    removeItem(ctx, list, uid);
  });
  el.querySelector("form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const text = el.querySelector("#ls-it").value.trim();
    if (!text) return;
    const data = { entity_id: list, item: uid };
    if (text !== it.summary) data.rename = text;
    const d = el.querySelector("#ls-du")?.value || "";
    const t = el.querySelector("#ls-dt")?.value || "";
    const newDue = d ? (t ? `${d} ${t}:00` : d) : "";
    const oldDue = due ? (/T|\s/.test(due) ? `${due.slice(0, 10)} ${hm(new Date(due))}:00` : due.slice(0, 10)) : "";
    if (newDue !== oldDue) {
      if (!newDue) data.due_date = null;
      else if (t) data.due_datetime = newDue;
      else data.due_date = d;
    }
    const desc = el.querySelector("#ls-de");
    if (desc && desc.value.trim() !== (it.description || "")) data.description = desc.value.trim();
    s.close();
    if (Object.keys(data).length === 2) return;
    Object.assign(it, { summary: text, ...(desc ? { description: desc.value.trim() } : {}) });
    if (newDue !== oldDue) it.due = newDue ? newDue.replace(" ", "T") : undefined;
    ctx.render();
    if (await ctx.call("todo", "update_item", data)) refreshSoon(ctx, list);
  });
}

async function removeItem(ctx, list, uid) {
  const key = `${list}:${uid}`;
  lst.pending[key] = { gone: true };
  ctx.render();
  const ok = await ctx.call("todo", "remove_item", { entity_id: list, item: [uid] });
  delete lst.pending[key];
  if (ok) {
    const v = ctx.cache["todo:" + list]?.value;
    if (v) ctx.cache["todo:" + list].value = v.filter((i) => i.uid !== uid);
    refreshSoon(ctx, list);
  }
  ctx.render();
}

function pickListsSheet(ctx) {
  const all = ctx.entities("todo");
  const cur = new Set(ctx.data.settings.todo || []);
  const s = ctx.sheet(`<h2>${esc(ctx.t("Familiens lister"))}</h2><p class="t-sub">${esc(ctx.t("Vælg hvilke to-do-lister fra Home Assistant, familien ser. Nye lister laves i Home Assistant, fx med Lokal to-do-integrationen."))}</p>
    <div class="ls-pick">${all.length ? all
      .map((id) => `<label class="ls-pickrow"><input type="checkbox" value="${esc(id)}"${cur.has(id) ? " checked" : ""}><span class="dot" style="background:${listColor(ctx, id)}">${svg(isShopping(ctx, id) ? "cart" : "lists")}</span><b>${esc(ctx.name(id))}</b><small>${esc(id)}</small></label>`)
      .join("") : `<p class="t-sub">${esc(ctx.t("Home Assistant har ingen to-do-lister endnu."))}</p>`}</div>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" data-save>${esc(ctx.t("Gem"))}</button></div>`);
  s.el.querySelector("[data-save]").addEventListener("click", async () => {
    const chosen = [...s.el.querySelectorAll("input:checked")].map((x) => x.value);
    // Keep the order the family already had; add new lists at the end.
    const order = [...(ctx.data.settings.todo || []).filter((x) => chosen.includes(x)), ...chosen.filter((x) => !cur.has(x))];
    s.close();
    if (await ctx.save("settings", { ...ctx.data.settings, todo: order })) ctx.toast(ctx.t("Listerne er gemt"));
    ctx.render();
  });
}

/* ================================================================ module */
export default {
  id: "lists",
  views: {
    kalender: { module: "calendar", title: (ctx) => ctx.t("Kalender"), render: renderCalendar },
    madplan: { module: "meals", title: (ctx) => ctx.t("Madplan"), render: renderMeals },
    lister: {
      module: "lists",
      title: (ctx) => ctx.t("Lister"),
      render: renderLists,
      after(ctx) {
        const form = ctx.q(".ls-add");
        if (!form) return;
        form.addEventListener("submit", async (ev) => {
          ev.preventDefault();
          const list = form.dataset.list;
          const input = form.querySelector("[name=t]");
          const text = input.value.trim();
          if (!text) return;
          const date = form.querySelector("[name=d]")?.value;
          const v = ctx.cache["todo:" + list]?.value;
          if (v) v.push({ uid: `new-${Date.now()}`, summary: text, status: "needs_action", ...(date ? { due: date } : {}) });
          input.value = "";
          lst.keepFocus = true;
          ctx.render(true);
          const ok = await ctx.call("todo", "add_item", { entity_id: list, item: text, ...(date ? { due_date: date } : {}) });
          if (ok) refreshSoon(ctx, list);
        });
        if (lst.keepFocus) {
          lst.keepFocus = false;
          form.querySelector("[name=t]")?.focus();
        }
      },
    },
  },
  acts: {
    /* calendar */
    "lists-filter": (el, ev, ctx) => {
      const id = el.dataset.id;
      cal.filters[id] = cal.filters[id] === false;
      ctx.render(true);
    },
    "lists-mode": (el, ev, ctx) => {
      cal.mode = el.dataset.mode;
      ctx.render(true);
    },
    "lists-week": (el, ev, ctx) => {
      const d = Number(el.dataset.d);
      cal.week = d === 0 ? 0 : cal.week + d;
      cal.sel = null;
      ctx.render(true);
    },
    "lists-day": (el, ev, ctx) => {
      cal.sel = el.dataset.d;
      if (el.dataset.mode) cal.mode = el.dataset.mode;
      ctx.render(true);
    },
    "lists-ev": (el, ev, ctx) => {
      const e = shownEvents[Number(el.dataset.i)];
      if (e) eventSheet(ctx, e);
    },
    "lists-newev": (el, ev, ctx) => newEventSheet(ctx),
    /* meals */
    "lists-mweek": (el, ev, ctx) => {
      const d = Number(el.dataset.d);
      meal.week = d === 0 ? 0 : meal.week + d;
      ctx.render(true);
    },
    "lists-meal": (el, ev, ctx) => mealSheet(ctx, Number(el.dataset.i)),
    /* lists */
    "lists-list": (el, ev, ctx) => {
      lst.id = el.dataset.id;
      ctx.render(true);
    },
    "lists-pick": (el, ev, ctx) => pickListsSheet(ctx),
    "lists-check": async (el, ev, ctx) => {
      const { list, uid } = el.dataset;
      const it = findItem(ctx, list, uid);
      if (!it) return;
      const next = it.status === "completed" ? "needs_action" : "completed";
      it.status = next;
      el.setAttribute("aria-pressed", String(next === "completed"));
      el.closest(".item")?.classList.toggle("done", next === "completed");
      setTimeout(() => ctx.render(true), next === "completed" ? 420 : 0);
      if (await ctx.call("todo", "update_item", { entity_id: list, item: uid, status: next })) refreshSoon(ctx, list);
    },
    "lists-edit": (el, ev, ctx) => editItemSheet(ctx, el.dataset.list, el.dataset.uid),
    "lists-del": (el, ev, ctx) => {
      el.closest(".item")?.classList.add("gone");
      setTimeout(() => removeItem(ctx, el.dataset.list, el.dataset.uid), 250);
    },
    "lists-showdone": (el, ev, ctx) => {
      lst.showDone = !lst.showDone;
      ctx.render(true);
    },
    "lists-clear": (el, ev, ctx) => {
      const list = el.dataset.list;
      ctx.confirm(ctx.t("Ryd klarede punkter?"), ctx.t("Alle afkrydsede punkter fjernes fra »{name}«.", { name: ctx.name(list) }), ctx.t("Ryd"), async () => {
        const v = ctx.cache["todo:" + list]?.value;
        if (v) ctx.cache["todo:" + list].value = v.filter((i) => i.status !== "completed");
        ctx.render(true);
        if (await ctx.call("todo", "remove_completed_items", { entity_id: list })) refreshSoon(ctx, list);
      });
    },
  },
  inputs: {},
  css: `
.ls-tools-r { display: flex; gap: 8px; align-items: center; margin-left: auto; flex-wrap: wrap; }
.ls-mode { padding: 3px; }
.ls-mode button { padding: 6px 14px; }
.seg button[aria-pressed="true"] { background: var(--surface); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.ls-weeknav { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; flex-wrap: wrap; }
.ls-weeknav b { font-family: var(--font-display); font-size: 16px; padding: 0 4px; }
.ls-weeknav .grow { flex: 1; }
.ls-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-bottom: 12px; position: relative; z-index: 1; }
.ls-sd { border: 0; background: var(--surface); box-shadow: var(--shadow); border-radius: 14px; padding: 8px 2px 7px; display: grid; justify-items: center; gap: 2px; color: var(--ink); min-width: 0; transition: transform .2s, background .2s; touch-action: manipulation; }
.ls-sd span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--muted); }
.ls-sd b { font: 800 19px/1.1 var(--font-display); }
.ls-sd i { display: flex; gap: 3px; height: 6px; }
.ls-sd i em { width: 6px; height: 6px; border-radius: 50%; }
.ls-sd.today { outline: 2px solid var(--petrol); outline-offset: -2px; }
.ls-sd.past { opacity: .6; }
.ls-sd[aria-pressed="true"] { background: var(--ink); color: var(--bg); transform: translateY(-2px); opacity: 1; }
.ls-sd[aria-pressed="true"] span { color: inherit; opacity: .75; }
.ls-sd:active { transform: scale(.96); }
.ls-day .card-head { align-items: flex-start; }
.ls-wx { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: var(--muted); }
.ls-wx .ic { width: 20px; height: 20px; }
.ls-allday { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.ls-allday .ev { flex: 1 1 180px; }
.ls-bin { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ls-bin .ic { width: 15px; height: 15px; color: var(--ec); }
.ls-bin b { display: inline !important; }
.ls-agenda { display: grid; gap: 6px; }
.ls-ag { border: 0; text-align: left; display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 14px; background: color-mix(in srgb, var(--ec) 10%, var(--surface)); color: var(--ink); position: relative; overflow: hidden; animation: pop .45s cubic-bezier(.2,.9,.3,1.2) both; }
.ls-ag::before { content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 4px; border-radius: 0 4px 4px 0; background: var(--ec); }
.ls-ag.past { opacity: .55; }
.ls-ag-t { display: grid; line-height: 1.15; }
.ls-ag-t b { font-weight: 800; }
.ls-ag-t small, .ls-ag-b small { color: var(--muted); font-size: 12px; }
.ls-ag-b { display: grid; min-width: 0; }
.ls-ag-b b { font-weight: 700; overflow-wrap: anywhere; }
.ls-nowline { position: relative; height: 14px; margin: 2px 0; }
.ls-nowline::before { content: ""; position: absolute; left: 50px; right: 0; top: 50%; height: 2px; background: var(--bad); border-radius: 2px; }
.ls-nowline span { position: absolute; left: 0; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 800; color: #fff; background: var(--bad); border-radius: 999px; padding: 1px 7px; }
.ls-free { display: flex; align-items: center; gap: 10px; padding: 18px 12px; border-radius: 14px; background: var(--surface-2); color: var(--muted); font-weight: 600; }
.ls-free .ic { width: 22px; height: 22px; color: var(--gold); }
.ls-dinner { margin-top: 12px; padding-top: 10px; font-size: 13px; }
.ls-wh { border: 0; background: none; color: inherit; width: 100%; text-align: left; border-bottom: 1px solid var(--line); border-radius: 8px 8px 0 0; cursor: pointer; }
.ls-wh:hover b { color: var(--violet); }
.ls-past { opacity: .72; }
.ls-none { padding: 6px 4px; }
.ls-week .ev { cursor: pointer; color: var(--ink); }
.ls-meal { min-height: 104px; border: 0; text-align: left; color: inherit; position: relative; cursor: pointer; transition: transform .2s; }
.ls-meal:hover { transform: translateY(-2px); }
.ls-meal.ls-past { opacity: .6; }
.ls-medit { position: absolute; right: 10px; top: 10px; width: 26px; height: 26px; border-radius: 9px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); opacity: 0; transition: opacity .2s; }
.ls-medit .ic { width: 15px; height: 15px; }
.ls-meal:hover .ls-medit, .ls-meal:focus-visible .ls-medit, .ls-meal.rest .ls-medit { opacity: 1; }
.meal.tonight .ls-medit { background: rgba(255,255,255,.22); color: #fff; }
.ls-nodish { color: var(--muted); font-weight: 600; font-size: 15px; }
.ls-sugg { display: flex; flex-wrap: wrap; gap: 6px; }
.ls-sugg .chip { border: 0; cursor: pointer; }
.ls-sugg .chip:hover { background: color-mix(in srgb, var(--violet) 14%, var(--surface-2)); }
.ls-form textarea { border: 1.5px solid var(--line); background: var(--surface-2); border-radius: 12px; padding: 10px 12px; font: inherit; color: inherit; resize: vertical; }
.ls-form .field[hidden] { display: none; }
.ls-cals .av .ic, .cal-tools .av .ic { width: 12px; height: 12px; color: #fff; }
.ls-switch { display: inline-flex; align-items: center; gap: 10px; margin-top: 14px; font-weight: 700; cursor: pointer; }
.ls-switch input { position: absolute; opacity: 0; pointer-events: none; }
.ls-switch span { width: 40px; height: 24px; border-radius: 999px; background: var(--line); position: relative; transition: background .2s; }
.ls-switch span::after { content: ""; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.ls-switch input:checked + span { background: var(--violet); }
.ls-switch input:checked + span::after { transform: translateX(16px); }
.ls-switch input:focus-visible + span { outline: 2px solid var(--violet); outline-offset: 2px; }
.ls-item .ls-it { border: 0; background: none; text-align: left; padding: 0; display: grid; min-width: 0; color: inherit; cursor: text; }
.ls-item .ls-it small { color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
.ls-item .check { cursor: pointer; }
.ls-item:not(.done) .check:hover { border-color: var(--lc, var(--violet)); }
.ls-due { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.ls-due .ic { width: 13px; height: 13px; }
.ls-due.today { color: var(--warn); }
.ls-due.over { color: var(--bad); }
.ls-add .ls-adddate { flex: 0 1 150px; min-width: 130px; }
.ls-donehead { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 18px; }
.ls-toggle { border: 0; background: none; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: var(--muted); padding: 6px 4px; }
.ls-toggle .ic { width: 16px; height: 16px; }
.ls-closed { margin-top: 8px; }
.ls-pick { display: grid; gap: 6px; margin-top: 14px; max-height: 50vh; overflow: auto; }
.ls-pickrow { display: grid; grid-template-columns: auto auto minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 10px; align-items: center; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); cursor: pointer; }
.ls-pickrow input { grid-row: span 2; width: 18px; height: 18px; accent-color: var(--violet); }
.ls-pickrow .dot { grid-row: span 2; width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; color: #fff; }
.ls-pickrow .dot .ic { width: 17px; height: 17px; }
.ls-pickrow small { color: var(--muted); font-size: 11.5px; }
.ls-skel { display: grid; gap: 10px; }
.ls-skel i { display: block; height: 58px; border-radius: 14px; background: linear-gradient(90deg, var(--surface-2), var(--surface), var(--surface-2)); background-size: 200% 100%; animation: lsShimmer 1.4s ease-in-out infinite; }
@keyframes lsShimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
@media (min-width: 1360px) { .ls-meals { grid-template-columns: repeat(7, minmax(0, 1fr)); } }
@media (max-width: 520px) {
  .ls-strip { gap: 4px; }
  .ls-sd b { font-size: 17px; }
  .ls-ag { grid-template-columns: 46px minmax(0, 1fr) auto; gap: 10px; }
  .ls-nowline::before { left: 44px; }
  .ls-item { grid-template-columns: 30px minmax(0, 1fr) auto; }
  .ls-item .ls-due { grid-column: 2; grid-row: 2; }
  .ls-item > span:empty { display: none; }
  .ls-item > .iconbtn { grid-column: 3; grid-row: 1; }
  .ls-tools-r { margin-left: 0; width: 100%; justify-content: space-between; }
}
`,
  en: {
    "Fælles": "Shared",
    "Ingen kalendere endnu": "No calendars yet",
    "Vælg familiens kalendere, så samles alle aftaler her.": "Choose the family's calendars and every event is gathered here.",
    "Vælg kalendere": "Choose calendars",
    "Uge {n}": "Week {n}",
    "Visning": "View",
    "Dag": "Day",
    "Uge": "Week",
    "Ny begivenhed": "New event",
    "Forrige uge": "Previous week",
    "Næste uge": "Next week",
    "I dag": "Today",
    "Hele dagen · {n} dage": "All day · {n} days",
    "Hele dagen": "All day",
    "Tømning": "Collection",
    "Ingen aftaler. En rolig dag.": "Nothing planned. A calm day.",
    "Aftensmad": "Dinner",
    "Intet i kalenderen": "Nothing planned",
    "Tid": "Time",
    "Kalender": "Calendar",
    "Sted": "Place",
    "Noter": "Notes",
    "Gentages": "Repeats",
    "Ja": "Yes",
    "Slet": "Delete",
    "Luk": "Close",
    "Slet aftalen?": "Delete the event?",
    "»{title}« slettes fra kalenderen.": "“{title}” will be removed from the calendar.",
    "Aftalen er slettet": "The event was deleted",
    "Kunne ikke slette: {error}": "Couldn't delete: {error}",
    "Hvad": "What",
    "Fx fødselsdag hos mormor": "E.g. birthday at grandma's",
    "Fra": "From",
    "Til": "To",
    "Sted (valgfrit)": "Place (optional)",
    "Annullér": "Cancel",
    "Gem": "Save",
    "»{title}« er lagt i kalenderen": "“{title}” was added to the calendar",
    "Ingen madplan endnu": "No meal plan yet",
    "Vælg den kalender, jeres aftensmad står i. Hver dag er en begivenhed med retten som titel.": "Choose the calendar that holds your dinners. Each day is an event with the dish as its title.",
    "Vælg madplanens kalender": "Choose the meal plan calendar",
    "Indkøbslisten": "Shopping list",
    "I aften": "Tonight",
    "I morgen": "Tomorrow",
    "Kl. {time}": "At {time}",
    "Ingen ret endnu": "Nothing planned yet",
    "Madplanen kommer fra kalenderen »{name}«. Retten er begivenhedens titel.": "The meal plan comes from the calendar “{name}”. The dish is the event's title.",
    "Ret": "Dish",
    "Fx lasagne": "E.g. lasagne",
    "Forslag fra de sidste uger": "Ideas from the last weeks",
    "Der står {n} retter denne dag. Kun den første ændres.": "There are {n} dishes this day. Only the first one is changed.",
    "Fjern": "Remove",
    "Retten er fjernet": "The dish was removed",
    "Aftensmaden er gemt": "Dinner is saved",
    "Kunne ikke gemme: {error}": "Couldn't save: {error}",
    "Fjern {name}": "Remove {name}",
    "Ingen lister endnu": "No lists yet",
    "Vælg de to-do-lister fra Home Assistant, familien skal bruge – fx indkøb og huskeliste.": "Choose the Home Assistant to-do lists the family uses – e.g. shopping and reminders.",
    "Bed en voksen om at vælge familiens lister.": "Ask a grown-up to choose the family's lists.",
    "Vælg lister": "Choose lists",
    "Lister": "Lists",
    "Listen kunne ikke hentes: {error}": "The list couldn't be loaded: {error}",
    "Alt er klaret!": "All done!",
    "Listen er tom. Tilføj det første punkt herunder.": "The list is empty. Add the first item below.",
    "Tilføj til {name}": "Add to {name}",
    "Dato": "Date",
    "Tilføj": "Add",
    "Klaret ({n})": "Done ({n})",
    "Ryd klarede": "Clear done",
    "{done} af {total} klaret": "{done} of {total} done",
    "Ret punkt": "Edit item",
    "Tekst": "Text",
    "Familiens lister": "The family's lists",
    "Vælg hvilke to-do-lister fra Home Assistant, familien ser. Nye lister laves i Home Assistant, fx med Lokal to-do-integrationen.": "Choose which Home Assistant to-do lists the family sees. New lists are made in Home Assistant, e.g. with the Local To-do integration.",
    "Home Assistant har ingen to-do-lister endnu.": "Home Assistant has no to-do lists yet.",
    "Listerne er gemt": "The lists are saved",
    "Ryd klarede punkter?": "Clear done items?",
    "Alle afkrydsede punkter fjernes fra »{name}«.": "All checked items are removed from “{name}”.",
    "Ryd": "Clear",
    "Madplan": "Meal plan",
    "Kalenderen kunne ikke hentes: {error}": "The calendar couldn't be loaded: {error}",
  },
};
