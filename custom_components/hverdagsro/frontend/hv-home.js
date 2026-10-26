/* Hverdagsro – home: the parents' front page, a person's page, the child's day, the shop,
   managing missions and rewards, "who are you?" on a shared tablet and my own settings. */
import { addDays, esc, slug, startOfDay, uid } from "./hv-core.js";
import { svg } from "./hv-icons.js";

const PARTS = [
  ["morning", "Morgen", "sunrise"],
  ["day", "I løbet af dagen", "sun"],
  ["afternoon", "Eftermiddag", "partly"],
  ["evening", "Aften", "moon"],
];
const SKINS = [
  ["standard", "Hverdagsro", "#6E4AFF", "#F2F4F6"],
  ["nordlys", "Nordlys", "#0EA5A0", "#EEF6F5"],
  ["hav", "Hav", "#2F6FED", "#EEF3FA"],
  ["skov", "Skov", "#2E8B57", "#F0F5EF"],
  ["sand", "Sand", "#C2703D", "#F7F2EB"],
  ["rosa", "Rosa", "#E4568C", "#FBF0F4"],
  ["rummet", "Rummet", "#8B5CF6", "#0E1024"],
  ["kontrast", "Kontrast", "#111111", "#FFFFFF"],
];
const INST = { none: "", dagpleje: "Dagpleje", vuggestue: "Vuggestue", bornehave: "Børnehave", skole: "Skole" };
const EMOJI = ["🪥", "🛏️", "🎒", "🍽️", "🧸", "🌙", "👕", "🧹", "🐶", "📚", "🎹", "🥦", "🚿", "🧺", "🗑️", "🌱", "⭐", "🎁"];
const REWARD_EMOJI = ["🎁", "🎬", "🍦", "🧱", "📱", "🎮", "🍕", "🏊", "🎨", "📚", "🧸", "⚽", "🍿", "🎡"];
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>`;
const STAR = svg("pstar");

// Local UI state
let kidDay = 0; // the child's day picker: 0 = today
let shopKid = null; // the parents' shop: which child
let opTab = "missioner";
let celebrated = "";

// ---------------------------------------------------------------- helpers
const weekday = (d) => (d.getDay() + 6) % 7; // Monday = 0
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayDate = (ctx) => (ctx.data?.today ? new Date(`${ctx.data.today}T12:00:00`) : new Date());
const PART_ORDER = Object.fromEntries(PARTS.map((p, i) => [p[0], i]));
const sortMissions = (list) =>
  [...list].sort((a, b) => (PART_ORDER[a.part] ?? 1) - (PART_ORDER[b.part] ?? 1) || String(a.time || "99").localeCompare(String(b.time || "99")));

function missionsFor(ctx, member, date = todayDate(ctx)) {
  if (!member || !ctx.on("missions")) return [];
  const wd = weekday(date);
  const forAll = member.role === "child";
  return sortMissions((ctx.data.missions || []).filter((m) => (m.member === member.id || (forAll && m.member === "all")) && (m.days || []).includes(wd)));
}
function doneOn(ctx, iso) {
  if (iso === ctx.data.today) return ctx.data.done_today || {};
  return (ctx.data.done_week || {})[iso] || {};
}
const isDone = (ctx, mission, memberId, iso = ctx.data.today) => `${mission.id}:${memberId}` in doneOn(ctx, iso);
function progress(ctx, member, date = todayDate(ctx)) {
  const list = missionsFor(ctx, member, date);
  const iso = isoOf(date);
  return { list, total: list.length, done: list.filter((m) => isDone(ctx, m, member.id, iso)).length };
}
function weekDates(ctx) {
  const t = todayDate(ctx);
  const mon = addDays(t, -weekday(t));
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}
function perfectDays(ctx, member) {
  const today = ctx.data.today;
  return weekDates(ctx).filter((d) => {
    const iso = isoOf(d);
    if (iso > today) return false;
    const p = progress(ctx, member, d);
    return p.total > 0 && p.done === p.total;
  }).length;
}
function rewardsFor(ctx, id) {
  return (ctx.data.rewards || []).filter((r) => r.member === "all" || r.member === id).sort((a, b) => a.cost - b.cost);
}
function goalOf(ctx, id) {
  const pts = ctx.points(id);
  const list = rewardsFor(ctx, id);
  return list.find((r) => r.cost > pts) || list[list.length - 1] || null;
}
const pending = (ctx, id) => (ctx.data.requests || []).filter((r) => r.status === "pending" && (!id || r.member === id));
const reward = (ctx, id) => (ctx.data.rewards || []).find((r) => r.id === id);
const pointsOn = (ctx) => ctx.on("points");
const timeText = (ctx, hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return ctx.fmt.time(new Date(2000, 0, 1, h, m));
};
const timeDate = (hhmm, base = new Date()) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
};

function until(ctx, d) {
  const mins = Math.round((d - Date.now()) / 60000);
  const sameDay = startOfDay(d).getTime() === startOfDay(new Date()).getTime();
  if (mins < -1) return sameDay ? ctx.fmt.time(d) : `${ctx.fmt.rel(d)} ${ctx.fmt.time(d)}`;
  if (mins <= 0) return ctx.t("nu");
  if (mins < 60) return ctx.t("om {n} min", { n: mins });
  if (sameDay) return ctx.t("om {h} t {m} min", { h: Math.floor(mins / 60), m: mins % 60 });
  return `${ctx.fmt.rel(d)} ${ctx.fmt.time(d)}`;
}

function presence(ctx, m) {
  const s = m.person && ctx.st(m.person);
  if (!s || s.state === "unknown" || s.state === "unavailable") return null;
  const home = s.state === "home";
  const zone = home ? ctx.t("Hjemme") : s.state === "not_home" ? ctx.t("Ude") : ctx.hass.formatEntityState ? ctx.hass.formatEntityState(s) : s.state;
  const since = s.last_changed ? new Date(s.last_changed) : null;
  const fresh = since && Date.now() - since < 15 * 60000;
  const sinceTxt = since ? (startOfDay(since).getTime() === startOfDay(new Date()).getTime() ? ctx.fmt.time(since) : ctx.fmt.rel(since)) : "";
  return { home, text: zone, since: sinceTxt, fresh };
}

/* The battery of the member's phone: a battery sensor on the same device as their tracker. */
function phoneBattery(ctx, m) {
  const ents = ctx.hass.entities || {};
  const person = m.person && ctx.hass.states[m.person];
  const trackers = [m.device_tracker, ...(person?.attributes?.device_trackers || [])].filter(Boolean);
  const tracker = trackers.find((t) => ents[t]?.platform === "mobile_app") || trackers[0];
  const dev = tracker && ents[tracker]?.device_id;
  if (!dev) return null;
  const id = Object.keys(ents).find((e) => ents[e].device_id === dev && e.startsWith("sensor.") && ctx.hass.states[e]?.attributes?.device_class === "battery");
  const v = id ? Number(ctx.st(id)?.state) : NaN;
  return Number.isFinite(v) ? Math.round(v) : null;
}

function calendars(ctx) {
  if (!ctx.on("calendar")) return [];
  const set = new Set([...(ctx.data.settings.calendars || []), ...ctx.members().map((m) => m.calendar)].filter(Boolean));
  return [...set];
}
function sharedCalendars(ctx) {
  const own = new Set(ctx.members().map((m) => m.calendar).filter(Boolean));
  return (ctx.data.settings.calendars || []).filter((c) => !own.has(c));
}
function events(ctx, days = 2) {
  const cals = calendars(ctx);
  if (!cals.length) return [];
  const s = startOfDay(new Date());
  return ctx.events(cals, s, addDays(s, Math.max(2, days)));
}
const calOwner = (ctx, cal) => ctx.members().find((m) => m.calendar === cal);
function meals(ctx) {
  const id = ctx.data.settings.meals_calendar;
  if (!id || !ctx.on("meals")) return [];
  const s = startOfDay(new Date());
  return ctx.events([id], s, addDays(s, 3));
}

function nextUp(ctx, m) {
  const now = new Date();
  const options = [];
  if (m.role === "child") {
    const open = missionsFor(ctx, m).filter((x) => x.time && !isDone(ctx, x, m.id) && timeDate(x.time) > now - 30 * 60000);
    if (open.length) options.push({ icon: "star", title: open[0].title, at: timeDate(open[0].time) });
  }
  if (m.calendar) {
    const ev = events(ctx).find((e) => e.calendar === m.calendar && !e.allDay && e.end > now);
    if (ev) options.push({ icon: "cal", title: ev.title, at: ev.start });
  }
  options.sort((a, b) => a.at - b.at);
  const o = options[0];
  return o ? { ...o, when: until(ctx, o.at) } : null;
}

function ring(ctx, m, f, size = 66, r = 30) {
  const C = 2 * Math.PI * r;
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="4"/><circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${esc(m.color)}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - Math.max(f, 0.03))).toFixed(1)}"/></svg>`;
}
function bigRing(ctx, m) {
  const g = goalOf(ctx, m.id);
  const f = g ? Math.min(1, ctx.points(m.id) / g.cost) : 0;
  const C = 2 * Math.PI * 46;
  return `<div class="big-ring"><svg viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="46" stroke="var(--surface-2)" stroke-width="9" fill="none"/><circle cx="52" cy="52" r="46" stroke="${esc(m.color)}" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - f)).toFixed(1)}" class="hh-ringarc"/></svg>${ctx.avatar(m.id)}</div>`;
}
function daysText(ctx, days) {
  const d = [...(days || [])].sort();
  if (d.length === 7) return ctx.t("Hver dag");
  if (d.join() === "0,1,2,3,4") return ctx.t("Hverdage");
  if (d.join() === "5,6") return ctx.t("Weekender");
  const mon = new Date(2024, 0, 1);
  return d.map((i) => cap(ctx.fmt.short(addDays(mon, i)))).join(", ");
}
const partName = (ctx, part) => ctx.t((PARTS.find((p) => p[0] === part) || PARTS[1])[1]);

// ---------------------------------------------------------------- rows
function missionRow(ctx, mission, member, { big = false, iso = ctx.data.today, locked = false, noWho = false } = {}) {
  const done = isDone(ctx, mission, member.id, iso);
  const canTick = !locked && iso === ctx.data.today;
  const sub = big || noWho
    ? [mission.time ? `${svg("clock")}${timeText(ctx, mission.time)}` : "", big ? "" : esc(partName(ctx, mission.part))].filter(Boolean).join(" · ") || (big ? esc(ctx.t("Når du vil")) : "")
    : `${ctx.avatar(member.id, "sm")}<span>${esc(member.name)} · ${esc(partName(ctx, mission.part))}</span>${mission.time ? `<span>${svg("clock")}${timeText(ctx, mission.time)}</span>` : ""}`;
  return `<div class="task${big ? " mission" : ""}${done ? " done" : ""}" style="--pc:${esc(member.color)}">
    <button class="check" data-act="home-mission" data-id="${esc(mission.id)}" data-member="${esc(member.id)}" aria-pressed="${done}" aria-label="${esc(ctx.t("Marker {name} som klaret", { name: mission.title }))}" style="${done ? `background:${esc(member.color)}` : ""}" ${canTick ? "" : "disabled"}>${CHECK}</button>
    <div style="min-width:0"><div class="t-ttl">${mission.emoji ? `<span class="hh-emo">${esc(mission.emoji)}</span>` : ""}${esc(mission.title)}</div><div class="t-sub">${sub}</div></div>
    ${pointsOn(ctx) && mission.points ? `<span class="t-pts"${big ? ' style="font-size:16px"' : ""}>+${mission.points}${STAR}</span>` : "<span></span>"}
  </div>`;
}

function approveRow(ctx, rq) {
  const k = ctx.member(rq.member);
  const r = reward(ctx, rq.reward) || { emoji: "🎁", title: ctx.t("En belønning"), cost: 0 };
  if (!k) return "";
  return `<div class="approve">${ctx.avatar(k.id)}<div class="t-ttl">${ctx.t("{name} vil købe {what} for {n} point", { name: esc(k.name), what: `<b>${esc(r.emoji)} ${esc(r.title)}</b>`, n: r.cost })}<div class="t-sub">${esc(ctx.t("Venter på en forælder · {name} har {n} point", { name: k.name, n: ctx.points(k.id) }))}</div></div>
    <button class="btn sm" data-act="home-decide" data-id="${esc(rq.id)}" data-ok="1" ${ctx.points(k.id) < r.cost ? "disabled" : ""}>${esc(ctx.t("Godkend"))}</button><button class="btn soft sm" data-act="home-decide" data-id="${esc(rq.id)}">${esc(ctx.t("Afvis"))}</button></div>`;
}

function ag(ctx, time, ttl, sub, who, color, cls = "") {
  return `<div class="ag ${cls}"><span class="time">${time}</span><span class="bar" style="background:${esc(color)}"></span><div style="min-width:0"><div class="ttl">${esc(ttl)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div><div class="who">${who.map((w) => ctx.avatar(w, "sm")).join("")}</div></div>`;
}
function evRow(ctx, e) {
  const owner = calOwner(ctx, e.calendar);
  const now = new Date();
  const cls = e.end < now ? "past" : e.start <= now ? "next" : "";
  const sub = [e.location, owner ? "" : ctx.name(e.calendar)].filter(Boolean).join(" · ");
  return ag(ctx, e.allDay ? ctx.t("Hele dagen") : ctx.fmt.time(e.start), e.title, sub, owner ? [owner.id] : [], owner?.color || "var(--violet)", cls);
}

// ---------------------------------------------------------------- family band (cards)
function familyBand(ctx) {
  const people = ctx.members();
  const known = people.filter((m) => presence(ctx, m));
  const homeN = known.filter((m) => presence(ctx, m).home).length;
  const dinner = meals(ctx).find((e) => startOfDay(e.start).getTime() === startOfDay(new Date()).getTime());
  let h = `<div class="fband stackv" aria-label="${esc(ctx.t("Familien"))}"><div class="fsum"><span class="lbl">${esc(ctx.t("Hjemme nu"))}</span><b class="num">${homeN}<small>/${known.length || people.length}</small></b><div class="dots">${(known.length ? known : people)
    .map((m) => `<i class="${presence(ctx, m)?.home ? "in" : ""}" title="${esc(m.name)}"></i>`)
    .join("")}</div>${dinner ? `<div class="nx">${esc(ctx.t("I aften"))}<strong>${esc(dinner.title)}</strong></div>` : ""}</div>`;
  people.forEach((m, i) => {
    const pr = presence(ctx, m);
    const p = progress(ctx, m);
    const kid = m.role === "child";
    const f = p.total ? p.done / p.total : 0;
    const facts = [];
    if (kid && pointsOn(ctx)) facts.push(`<span class="fact fpts">${STAR}<span class="num">${ctx.points(m.id)}</span></span>`);
    if (kid && ctx.on("missions")) {
      const perfect = perfectDays(ctx, m);
      if (perfect) facts.push(`<span class="fact flame" title="${esc(ctx.t("Perfekte dage i denne uge"))}">${svg("flame")}${perfect}</span>`);
    }
    if (p.total) facts.push(`<span class="fact">${p.done}/${p.total}${kid && pointsOn(ctx) ? "" : ` ${esc(ctx.t("klaret"))}`}</span>`);
    const nx = nextUp(ctx, m);
    const label = pr ? `${pr.text}${pr.since ? ` · ${ctx.t("siden {t}", { t: pr.since })}` : ""}` : kid ? ctx.t(INST[m.institution] || "Barn") || ctx.t("Barn") : ctx.t("Forælder");
    h += `<button class="pod" data-go="person:${esc(m.id)}" style="--pc:${esc(m.color)};animation-delay:${(i + 1) * 70}ms" aria-label="${esc(m.name)}${pr ? `: ${esc(pr.text)}` : ""}">
      <span class="ringav">${ring(ctx, m, f)}${ctx.avatar(m.id)}${pr ? `<span class="pres ${pr.home ? "home" : "away"}${pr.fresh ? " fresh" : ""}" title="${esc(pr.text)}">${svg(pr.home ? "home" : "walk")}</span>` : ""}</span>
      <span class="who"><span class="nm"><span class="nmt">${esc(m.name)}</span>${(() => {
        const b = phoneBattery(ctx, m);
        return b == null ? "" : `<span class="nbat${b <= 20 ? " low" : ""}" title="${esc(ctx.t("Telefonens batteri"))}"><span class="bglyph"><i style="width:${b}%"></i></span>${b}%</span>`;
      })()}</span><span class="pst">${esc(label)}</span></span>
      <span class="facts">${facts.join("")}</span>
      <span class="next">${nx ? `<span class="nl">${svg(nx.icon === "star" ? "pstar" : "cal")}<span>${esc(nx.title)}</span></span><b>${esc(nx.when)}</b>` : `<span class="nl"><span>${esc(ctx.t("Intet planlagt"))}</span></span><b>–</b>`}</span>
    </button>`;
  });
  return h + "</div>";
}

// ---------------------------------------------------------------- views
function emptyFamily(ctx) {
  return `<section class="card hv-empty">${svg("users", "ic big")}<h2>${esc(ctx.t("Ingen i familien endnu"))}</h2><p class="t-sub">${esc(ctx.t("Tilføj familien under Familieindstillinger, så kommer forsiden til live."))}</p><button class="btn" data-go="indstillinger:familie">${svg("users")}${esc(ctx.t("Tilføj familien"))}</button></section>`;
}

function pHome(ctx) {
  if (!ctx.members().length) return emptyFamily(ctx);
  const kids = ctx.children();
  const pend = ctx.on("shop") ? pending(ctx) : [];
  const evs = events(ctx);
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const evToday = evs.filter((e) => e.start < tomorrow && e.end > today);
  const evTomorrow = evs.filter((e) => e.start >= tomorrow && e.start < addDays(tomorrow, 1));
  const ml = meals(ctx);
  const dinner = ml.find((e) => e.start < tomorrow && e.end > today);
  const cards = [];
  if (pend.length) cards.push(`<section class="card s12"><div class="card-head"><h2>${esc(ctx.t("Godkend køb"))}</h2><span class="lock">${svg("shield")}${esc(ctx.t("Kun forældre"))}</span></div><div class="tasks">${pend.map((r) => approveRow(ctx, r)).join("")}</div></section>`);
  if (calendars(ctx).length) {
    const span = `${ctx.fmt.short(today)} ${ctx.fmt.date(today, { day: "numeric" })} – ${ctx.fmt.short(tomorrow)} ${ctx.fmt.date(tomorrow, { day: "numeric", month: "short" })}`;
    cards.push(`<section class="card s12"><div class="card-head"><h2>${esc(ctx.t("I dag og i morgen"))}</h2><span class="meta">${esc(span)}</span></div>
      <div class="agenda" style="--kc:var(--violet)"><div class="day-split">${esc(ctx.t("I dag"))}</div>${evToday.map((e) => evRow(ctx, e)).join("") || `<div class="t-sub hh-none">${esc(ctx.t("Ingen aftaler i dag"))}</div>`}
      <div class="day-split">${esc(ctx.t("I morgen, {day}", { day: ctx.fmt.day(tomorrow) }))}</div>${evTomorrow.map((e) => evRow(ctx, e)).join("") || `<div class="t-sub hh-none">${esc(ctx.t("Ingen aftaler i morgen"))}</div>`}</div>
      ${ctx.on("calendar") ? `<div class="hh-foot"><button class="btn soft sm" data-go="kalender">${svg("cal")}${esc(ctx.t("Kalender"))}</button></div>` : ""}</section>`);
  }
  const goals = pointsOn(ctx) && ctx.on("shop") && kids.length;
  if (ctx.data.settings.meals_calendar && ctx.on("meals")) {
    const later = ml.filter((e) => e.start >= tomorrow).slice(0, 2);
    cards.push(`<section class="card ${goals ? "s6" : "s12"}"><div class="card-head"><h2>${esc(ctx.t("Aftensmad"))}</h2><button class="btn soft sm" data-go="madplan">${esc(ctx.t("Madplan"))}</button></div>
      <div class="dinner"><div class="plate">${svg("food")}</div><div style="min-width:0"><div class="eyebrow">${esc(ctx.t("I aften"))}</div><h3>${esc(dinner?.title || ctx.t("Ikke planlagt endnu"))}</h3>${dinner?.description ? `<div class="t-sub">${esc(dinner.description.slice(0, 120))}</div>` : ""}</div></div>
      ${later.length ? `<div class="minis">${later.map((e) => `<div class="mini"><span>${esc(cap(ctx.fmt.rel(e.start)))}</span><span>${esc(e.title)}</span></div>`).join("")}</div>` : ""}</section>`);
  }
  if (goals) {
    cards.push(`<section class="card ${ctx.data.settings.meals_calendar && ctx.on("meals") ? "s6" : "s12"}"><div class="card-head"><h2>${esc(ctx.t("Børnenes mål"))}</h2><button class="btn soft sm" data-go="shop">${svg("shop")}${esc(ctx.t("Shop"))}</button></div>
      <div class="tasks">${kids
        .map((k) => {
          const g = goalOf(ctx, k.id);
          const pts = ctx.points(k.id);
          return `<button class="task hh-goalrow" data-go="person:${esc(k.id)}">${ctx.avatar(k.id)}<div style="min-width:0"><div class="t-ttl">${g ? `${esc(g.emoji)} ${esc(g.title)}` : esc(ctx.t("Intet mål endnu"))}</div><div class="progress" style="margin:6px 0 0"><i style="width:${g ? Math.min(100, (pts / g.cost) * 100) : 0}%;background:${esc(k.color)}"></i></div></div><span class="t-pts num">${pts}${g ? `/${g.cost}` : ""}</span></button>`;
        })
        .join("")}</div></section>`);
  }
  if (ctx.on("missions") && kids.length) {
    const groups = kids.map((k) => ({ k, p: progress(ctx, k) })).filter((g) => g.p.total);
    cards.push(`<section class="card s12"><div class="card-head"><h2>${esc(ctx.t("Børnene i dag"))}</h2><button class="btn soft sm" data-go="opgaver">${esc(ctx.t("Alle opgaver"))}</button></div>
      ${groups.length ? `<div class="hh-kidsday">${groups
        .map(({ k, p }) => {
          const open = p.list.filter((m) => !isDone(ctx, m, k.id));
          return `<div class="hh-kd" style="--pc:${esc(k.color)}"><button class="hh-kd-h" data-go="person:${esc(k.id)}">${ctx.avatar(k.id, "sm")}<b>${esc(k.name)}</b><span class="hh-kd-n num">${p.done}/${p.total}</span></button><div class="progress"><i style="width:${(p.done / p.total) * 100}%;background:${esc(k.color)}"></i></div>
          <div class="tasks">${(open.length ? open.slice(0, 3) : []).map((m) => missionRow(ctx, m, k, { noWho: true })).join("") || `<div class="hh-alldone">${svg("check")}${esc(ctx.t("Alle missioner er klaret"))}</div>`}${open.length > 3 ? `<button class="hh-more" data-go="person:${esc(k.id)}">${esc(ctx.t("+{n} mere", { n: open.length - 3 }))}</button>` : ""}</div></div>`;
        })
        .join("")}</div>` : `<p class="t-sub">${esc(ctx.t("Ingen missioner i dag."))} <button class="lnk" data-go="opgaver">${esc(ctx.t("Opret missioner"))}</button></p>`}</section>`);
  }
  if (!cards.length) cards.push(`<section class="card s12 hv-empty">${svg("sparkle", "ic big")}<h2>${esc(ctx.t("Alt er roligt"))}</h2><p class="t-sub">${esc(ctx.t("Slå flere moduler til under Familieindstillinger."))}</p><button class="btn soft" data-go="indstillinger:moduler">${esc(ctx.t("Moduler"))}</button></section>`);
  return `<div class="homegrid"><aside class="home-fam" aria-label="${esc(ctx.t("Familien"))}">${familyBand(ctx)}</aside><div class="grid home-main">${cards.join("")}</div></div>`;
}

function weekStrip(ctx, m) {
  const dates = weekDates(ctx);
  const today = ctx.data.today;
  return `<div class="hh-week1">${dates
    .map((d) => {
      const iso = isoOf(d);
      const p = progress(ctx, m, d);
      const future = iso > today;
      const f = p.total ? p.done / p.total : 0;
      const perfect = p.total && p.done === p.total && !future;
      return `<div class="hh-wd${iso === today ? " today" : ""}${future ? " future" : ""}${perfect ? " perfect" : ""}" style="--pc:${esc(m.color)}"><small>${esc(ctx.fmt.short(d))}</small><span class="hh-wd-c"><i style="height:${future ? 0 : Math.max(f, p.total ? 0.06 : 0) * 100}%"></i>${perfect ? svg("check") : ""}</span><b class="num">${p.total ? (future ? p.total : `${p.done}/${p.total}`) : "–"}</b></div>`;
    })
    .join("")}</div>`;
}

function personPage(ctx) {
  const m = ctx.member(ctx.arg);
  if (!m) return `<button class="back" data-go="hjem">${svg("back")}${esc(ctx.t("Hjem"))}</button>${emptyFamily(ctx)}`;
  const kid = m.role === "child";
  const pr = presence(ctx, m);
  const p = progress(ctx, m);
  const stats = [];
  if (pr) stats.push(`<span>${svg(pr.home ? "home" : "walk")}${esc(pr.text)}${pr.since ? ` · ${esc(ctx.t("siden {t}", { t: pr.since }))}` : ""}</span>`);
  if (kid && pointsOn(ctx)) stats.push(`<span>${STAR}${esc(ctx.t("{n} point", { n: ctx.points(m.id) }))}</span>`);
  if (p.total) stats.push(`<span>${esc(ctx.t("{done}/{total} missioner i dag", { done: p.done, total: p.total }))}</span>`);
  if (kid && ctx.on("missions")) stats.push(`<span>${svg("flame")}${esc(ctx.t("{n} perfekte dage i ugen", { n: perfectDays(ctx, m) }))}</span>`);
  const role = kid ? [ctx.t("Barn"), ctx.t(INST[m.institution] || "")].filter(Boolean).join(" · ") : ctx.t("Forælder");
  const acts = [];
  if (kid) acts.push(`<button class="btn" data-act="home-seeas" data-id="${esc(m.id)}">${svg("user")}${esc(ctx.t("Se som {name}", { name: m.name }))}</button>`);
  if (kid && pointsOn(ctx)) acts.push(`<button class="btn" data-act="home-points" data-id="${esc(m.id)}">${STAR}${esc(ctx.t("Point"))}</button>`);
  if (m.id === ctx.data.me) acts.push(`<button class="btn" data-go="mig">${svg("gear")}${esc(ctx.t("Mine indstillinger"))}</button>`);
  const cards = [];
  const pend = pending(ctx, m.id);
  if (pend.length && ctx.on("shop")) cards.push(`<section class="card s12"><div class="tasks">${pend.map((r) => approveRow(ctx, r)).join("")}</div></section>`);
  if (ctx.on("missions") && (kid || p.total)) {
    cards.push(`<section class="card s6"><div class="card-head"><h2>${esc(ctx.t("Missioner i dag"))}</h2><button class="btn soft sm" data-act="home-newmission" data-member="${esc(m.id)}">${svg("plus")}${esc(ctx.t("Ny mission"))}</button></div>
      <div class="tasks">${p.list.map((x) => missionRow(ctx, x, m, { noWho: true })).join("") || `<div class="t-sub">${esc(ctx.t("Ingen missioner i dag"))}</div>`}</div>
      <div class="card-head" style="margin:20px 0 10px"><h2>${esc(ctx.t("Ugen"))}</h2></div>${weekStrip(ctx, m)}</section>`);
  }
  if (kid && pointsOn(ctx)) {
    const led = (ctx.data.ledger || []).filter((l) => l.member === m.id).slice(-8).reverse();
    const g = goalOf(ctx, m.id);
    cards.push(`<section class="card s6"><div class="card-head"><h2>${esc(ctx.t("Point"))}</h2><span class="meta num">${ctx.points(m.id)} ${esc(ctx.t("point"))}</span></div>
      ${g && ctx.on("shop") ? `<div class="hh-goalmini" style="--pc:${esc(m.color)}"><span class="hh-gem">${esc(g.emoji)}</span><div style="flex:1;min-width:0"><b>${esc(g.title)}</b><div class="progress" style="margin:6px 0 0"><i style="width:${Math.min(100, (ctx.points(m.id) / g.cost) * 100)}%;background:${esc(m.color)}"></i></div></div><span class="t-pts num">${ctx.points(m.id)}/${g.cost}</span></div>` : ""}
      <div class="hh-quick">${[5, 10, 25].map((n) => `<button class="btn soft sm" data-act="home-give" data-id="${esc(m.id)}" data-n="${n}">+${n}</button>`).join("")}<button class="btn soft sm" data-act="home-give" data-id="${esc(m.id)}" data-n="-5">−5</button><button class="btn soft sm" data-act="home-points" data-id="${esc(m.id)}">${esc(ctx.t("Andet …"))}</button></div>
      <div class="hh-ledger">${led.length ? led.map((l) => `<div class="hh-led"><span class="hh-led-d num ${l.delta < 0 ? "neg" : ""}">${l.delta > 0 ? "+" : ""}${l.delta}</span><div style="min-width:0"><b>${esc(l.reason || ctx.t("Point"))}</b><small>${esc(cap(ctx.fmt.rel(l.at)))} ${esc(ctx.fmt.time(l.at))}${l.by && ctx.member(l.by) ? ` · ${esc(ctx.member(l.by).name)}` : ""}</small></div></div>`).join("") : `<div class="t-sub">${esc(ctx.t("Ingen point endnu"))}</div>`}</div></section>`);
  }
  if (m.calendar && ctx.on("calendar")) {
    const s = startOfDay(new Date());
    const evs = ctx.events([m.calendar], s, addDays(s, 7));
    let last = "";
    const rows = evs
      .map((e) => {
        const d = startOfDay(e.start) < s ? s : startOfDay(e.start);
        const head = d.getTime() !== last ? `<div class="day-split">${esc(cap(ctx.fmt.rel(d)))}</div>` : "";
        last = d.getTime();
        return head + evRow(ctx, e);
      })
      .join("");
    cards.push(`<section class="card s12"><div class="card-head"><h2>${esc(ctx.t("Den næste uge"))}</h2><span class="meta">${esc(ctx.name(m.calendar))}</span></div><div class="agenda">${rows || `<div class="t-sub">${esc(ctx.t("Ingen aftaler den næste uge"))}</div>`}</div></section>`);
  }
  const prof = [];
  if (m.birthday) {
    const b = new Date(`${m.birthday}T12:00:00`);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
    prof.push(`<div class="bd-f"><span class="bd-ic">🎂</span><div><b>${esc(ctx.fmt.date(b, { day: "numeric", month: "long", year: "numeric" }))}</b><small>${esc(ctx.t("{n} år", { n: age }))}</small></div></div>`);
  }
  if (m.person) prof.push(`<div class="bd-f"><span class="bd-ic">${svg("user")}</span><div><b>${esc(ctx.name(m.person))}</b><small>${esc(ctx.t("Person i Home Assistant"))}</small></div></div>`);
  if (m.calendar) prof.push(`<div class="bd-f"><span class="bd-ic">${svg("cal")}</span><div><b>${esc(ctx.name(m.calendar))}</b><small>${esc(ctx.t("Kalender"))}</small></div></div>`);
  cards.push(`<section class="card s12"><div class="card-head"><h2>${esc(ctx.t("Profil"))}</h2><button class="btn soft sm" data-go="indstillinger:familie">${svg("shield")}${esc(ctx.t("Ret i Familieindstillinger"))}</button></div>${prof.length ? `<div class="kprof">${prof.join("")}</div>` : `<p class="t-sub">${esc(ctx.t("Tilføj fødselsdag, person og kalender under Familieindstillinger."))}</p>`}</section>`);
  return `<button class="back" data-go="hjem">${svg("back")}${esc(ctx.t("Hjem"))}</button>
    <section class="p-hero" style="--pc:${esc(m.color)}">${ctx.avatar(m.id)}<div style="position:relative;z-index:1"><h2>${esc(m.name)}</h2><div class="role">${esc(role)}</div><div class="stats">${stats.join("")}</div></div><div class="acts">${acts.join("")}</div></section>
    <div class="grid" style="margin-top:16px">${cards.join("")}</div>`;
}

function kidDayView(ctx) {
  const me = ctx.me;
  if (!me) return "";
  const base = todayDate(ctx);
  const date = addDays(base, kidDay);
  const iso = isoOf(date);
  const p = progress(ctx, me, date);
  const showMissions = ctx.on("missions");
  // The agenda: my calendar and the family's shared calendars.
  const cals = ctx.on("calendar") ? [me.calendar, ...sharedCalendars(ctx)].filter(Boolean) : [];
  const s = startOfDay(date);
  const evs = cals.length ? ctx.events(cals, s, addDays(s, 1)) : [];
  const dinner = meals(ctx).find((e) => startOfDay(e.start).getTime() <= s.getTime() && e.end > s);
  const now = new Date();
  const timed = evs.filter((e) => !e.allDay);
  const cur = kidDay === 0 ? timed.filter((e) => e.start <= now && e.end > now).at(-1) : null;
  const next = timed.find((e) => (kidDay === 0 ? e.start > now : true));
  const days = Array.from({ length: 6 }, (_, i) => addDays(base, i));
  const parts = PARTS.map(([k, label, ic]) => {
    const list = p.list.filter((m) => (m.part || "day") === k);
    if (!list.length) return "";
    return `<div class="hh-part"><span class="hh-part-h">${svg(ic)}${esc(ctx.t(label))}</span><div class="tasks">${list.map((m) => missionRow(ctx, m, me, { big: true, iso })).join("")}</div></div>`;
  }).join("");
  const allDone = p.total && p.done === p.total;
  const g = pointsOn(ctx) && ctx.on("shop") ? goalOf(ctx, me.id) : null;
  const pts = ctx.points(me.id);
  const missionsCard = showMissions
    ? `<section class="card s7"><div class="card-head"><h2>${esc(kidDay === 0 ? ctx.t("Mine missioner i dag") : ctx.t("Missioner {day}", { day: ctx.fmt.day(date) }))}</h2><span class="meta num">${esc(ctx.t("{done}/{total} klaret", { done: p.done, total: p.total }))}</span></div>
      ${p.total ? `<div class="rb-bar" style="--kc:${esc(me.color)}"><i style="width:${(p.done / p.total) * 100}%"></i><span class="num">${p.done} ${esc(ctx.t("af"))} ${p.total}</span></div>` : ""}
      ${allDone && kidDay === 0 ? `<div class="rb-yay" style="--kc:${esc(me.color)};margin-bottom:14px"><span class="rb-star">🌟</span><h2>${esc(ctx.t("Perfekt dag!"))}</h2><p>${esc(ctx.t("Du har klaret alle dine missioner, {name}.", { name: me.name }))}</p></div>` : ""}
      ${parts || `<div class="hv-empty"><span style="font-size:40px">🌈</span><p class="t-sub">${esc(ctx.t("Ingen missioner {day}.", { day: kidDay === 0 ? ctx.t("i dag") : ctx.fmt.day(date) }))}</p></div>`}</section>`
    : "";
  const pointsCard =
    pointsOn(ctx)
      ? `<section class="card ${showMissions ? "s5" : "s12"} hh-me" style="--pc:${esc(me.color)}">${bigRing(ctx, me)}<div class="score num">${pts}${STAR}</div>${ctx.on("missions") ? `<span class="streak">${svg("flame")}${esc(ctx.t("{n} perfekte dage i ugen", { n: perfectDays(ctx, me) }))}</span>` : ""}${g ? `<div class="goal">${g.cost > pts ? ctx.t("{n} point til {what}", { n: g.cost - pts, what: `<b>${esc(g.emoji)} ${esc(g.title)}</b>` }) : ctx.t("{what} er tjent!", { what: `<b>${esc(g.emoji)} ${esc(g.title)}</b>` })}</div><button class="btn soft sm" data-go="shop">${svg("shop")}${esc(ctx.t("Til shoppen"))}</button>` : ""}</section>`
      : "";
  const agenda = `<section class="card ${showMissions ? "s5" : "s12"}"><div class="nownext" style="margin-bottom:14px;--kc:${esc(me.color)}"><div class="nn now"><small>${esc(kidDay === 0 ? ctx.t("Nu") : ctx.t("Først"))}</small><b>${esc(kidDay === 0 ? cur?.title || ctx.t("Fri") : timed[0]?.title || ctx.t("Fri"))}</b></div><div class="nn"><small>${esc(ctx.t("Næste"))}</small><b>${next && (kidDay !== 0 || next !== timed[0] || true) ? esc(`${next.title} ${ctx.t("kl.")} ${ctx.fmt.time(next.start)}`) : esc(ctx.t("Godnat"))}</b></div></div>
    <div class="agenda" style="--kc:${esc(me.color)}">${dinner ? ag(ctx, ctx.t("I aften"), dinner.title, ctx.t("Aftensmad"), [], "var(--coral)") : ""}${evs.map((e) => evRow(ctx, e)).join("") || `<div class="t-sub">${esc(ctx.t("Ingen aftaler"))}</div>`}</div></section>`;
  return `<div style="--kc:${esc(me.color)}">
    <div class="days">${days.map((d, i) => `<button class="dbtn" data-act="home-kday" data-i="${i}" aria-pressed="${i === kidDay}"><small>${esc(i === 0 ? ctx.t("I dag") : ctx.fmt.short(d))}</small><b>${d.getDate()}</b></button>`).join("")}</div>
    <div class="grid" style="margin-top:14px">${missionsCard}${showMissions ? `<div class="s5 hh-col">${pointsCard}${agenda}</div>` : pointsCard + agenda}</div></div>`;
}

function shopView(ctx) {
  const kids = ctx.children();
  let kid = ctx.isKid ? ctx.me : null;
  if (!kid) {
    if (!kids.length) return emptyFamily(ctx);
    kid = ctx.member(shopKid) || kids[0];
  }
  if (!pointsOn(ctx)) return `<section class="card hv-empty">${svg("shop", "ic big")}<h2>${esc(ctx.t("Point er slået fra"))}</h2><p class="t-sub">${esc(ctx.t("Shoppen bruger point. Slå point til under Familieindstillinger."))}</p></section>`;
  const pts = ctx.points(kid.id);
  const list = rewardsFor(ctx, kid.id);
  const g = goalOf(ctx, kid.id);
  const pend = pending(ctx, kid.id);
  const recent = (ctx.data.requests || []).filter((r) => r.member === kid.id && r.status !== "pending");
  const switcher = ctx.isParent
    ? `<div class="hh-kids-pick" role="group" aria-label="${esc(ctx.t("Vælg barn"))}">${kids.map((k) => `<button class="hh-kp${k.id === kid.id ? " on" : ""}" data-act="home-shopkid" data-id="${esc(k.id)}" style="--pc:${esc(k.color)}" aria-pressed="${k.id === kid.id}">${ctx.avatar(k.id, "sm")}<span>${esc(k.name)}</span><b class="num">${ctx.points(k.id)}</b></button>`).join("")}<span class="grow"></span><button class="btn soft sm" data-act="home-optab" data-id="belonninger">${svg("edit")}${esc(ctx.t("Ret belønninger"))}</button></div>`
    : "";
  if (!list.length)
    return `${switcher}<section class="card hv-empty">${svg("gift", "ic big")}<h2>${esc(ctx.t("Shoppen er tom"))}</h2><p class="t-sub">${esc(ctx.isParent ? ctx.t("Opret belønninger, som børnene kan købe for deres point.") : ctx.t("Far eller mor har ikke lagt noget i shoppen endnu."))}</p>${ctx.isParent ? `<button class="btn" data-act="home-editreward">${svg("plus")}${esc(ctx.t("Ny belønning"))}</button>` : ""}</section>`;
  return `${switcher}
    ${g ? `<div class="goal-card" style="background:linear-gradient(135deg, ${esc(kid.color)}, var(--coral))"><span class="em">${esc(g.emoji)}</span><div style="flex:1;min-width:180px"><div class="eyebrow" style="color:rgba(255,255,255,.8)">${esc(ctx.isKid ? ctx.t("Mit mål") : ctx.t("{name}s mål", { name: kid.name }))}</div><h3>${esc(g.title)}</h3><div class="bar"><i style="width:${Math.min(100, (pts / g.cost) * 100)}%"></i></div><div style="margin-top:6px;font-weight:700" class="num">${esc(ctx.t("{n} af {cost} point", { n: pts, cost: g.cost }))}</div></div></div>` : ""}
    ${pend.length ? `<div class="approve" style="margin-top:14px">${svg("lock")}<span class="t-ttl">${esc(ctx.t("{what} venter på, at en forælder godkender", { what: pend.map((x) => reward(ctx, x.reward)?.title || "").join(", ") }))}</span>${ctx.isParent ? pend.map((x) => `<button class="btn sm" data-act="home-decide" data-id="${esc(x.id)}" data-ok="1">${esc(ctx.t("Godkend"))}</button>`).join("") : ""}</div>` : ""}
    <h2 class="h2" style="margin:22px 0 12px">${esc(ctx.isKid ? ctx.t("Min pointshop") : ctx.t("{name}s pointshop", { name: kid.name }))}</h2>
    <div class="shop">${list
      .map((w, i) => {
        const waiting = pend.some((x) => x.reward === w.id);
        const lack = w.cost - pts;
        const label = waiting ? ctx.t("Venter") : lack > 0 ? ctx.t("Mangler {n}", { n: lack }) : ctx.isParent ? ctx.t("Køb for {name}", { name: kid.name }) : ctx.t("Køb");
        return `<div class="ware" style="animation:pop .45s ${i * 60}ms both">${g && w.id === g.id ? `<span class="tag">${esc(ctx.t("Mål"))}</span>` : ""}<span class="em">${esc(w.emoji)}</span><b>${esc(w.title)}</b><span class="price">${w.cost}${STAR}</span>
          ${lack > 0 ? `<div class="progress hh-wp"><i style="width:${Math.min(100, (pts / w.cost) * 100)}%;background:${esc(kid.color)}"></i></div>` : ""}
          <button class="btn sm" data-act="home-buy" data-id="${esc(w.id)}" data-member="${esc(kid.id)}" ${lack > 0 || waiting ? "disabled" : ""}>${esc(label)}</button></div>`;
      })
      .join("")}</div>
    ${recent.length ? `<div class="card" style="margin-top:16px"><div class="card-head"><h2>${esc(ctx.t("I dag"))}</h2></div><div class="tasks">${recent.map((r) => `<div class="hh-led"><span class="hh-led-d ${r.status === "approved" ? "" : "neg"}">${r.status === "approved" ? svg("check") : svg("x")}</span><div><b>${esc(reward(ctx, r.reward)?.title || "")}</b><small>${esc(r.status === "approved" ? ctx.t("Godkendt") : ctx.t("Afvist"))}</small></div></div>`).join("")}</div></div>` : ""}
    <p class="foot">${esc(ctx.t("Pointene trækkes først, når en forælder har godkendt købet."))}</p>`;
}

function tasksView(ctx) {
  const kids = ctx.children();
  if (!ctx.members().length) return emptyFamily(ctx);
  const pend = ctx.on("shop") ? pending(ctx) : [];
  const tabs = [["missioner", "Missioner"], ...(pointsOn(ctx) && ctx.on("shop") ? [["belonninger", "Belønninger"]] : []), ["ugen", "Ugen"]];
  if (!tabs.some((t) => t[0] === opTab)) opTab = "missioner";
  let body = "";
  if (opTab === "missioner") {
    const owners = [...kids, { id: "all", name: ctx.t("Alle børn"), color: "var(--violet)", role: "child", all: true }, ...ctx.parents()];
    body = `<div class="cols-2" style="margin-top:12px">${owners
      .map((o) => {
        const list = sortMissions((ctx.data.missions || []).filter((m) => m.member === o.id));
        if (!list.length && o.role === "parent") return "";
        return `<section class="card" style="--pc:${esc(o.color)}"><div class="person-head">${o.all ? `<span class="av" style="background:var(--violet)">${svg("users")}</span>` : ctx.avatar(o.id)}<h3>${esc(o.name)}</h3><span class="meta">${esc(ctx.t("{n} missioner", { n: list.length }))}</span></div>
          <div class="tasks">${list.map((m) => missionEditRow(ctx, m)).join("") || `<div class="t-sub">${esc(o.all ? ctx.t("Missioner for alle børnene, fx tandbørstning.") : ctx.t("Ingen missioner endnu"))}</div>`}</div>
          <button class="btn soft sm hh-add" data-act="home-newmission" data-member="${esc(o.id)}">${svg("plus")}${esc(ctx.t("Ny mission"))}</button></section>`;
      })
      .join("")}</div>`;
  } else if (opTab === "belonninger") {
    const list = [...(ctx.data.rewards || [])].sort((a, b) => a.cost - b.cost);
    body = `<section class="card" style="margin-top:12px"><div class="card-head"><h2>${esc(ctx.t("Belønninger"))}</h2><button class="btn sm" data-act="home-editreward">${svg("plus")}${esc(ctx.t("Ny belønning"))}</button></div>
      <div class="tasks">${list
        .map((r) => {
          const who = r.member === "all" ? ctx.t("Alle børn") : ctx.member(r.member)?.name || r.member;
          return `<div class="task hh-rrow"><span class="hh-bigemo">${esc(r.emoji)}</span><div style="min-width:0"><div class="t-ttl">${esc(r.title)}</div><div class="t-sub">${esc(who)}</div></div><span class="t-pts num">${r.cost}${STAR}</span><span class="hh-rowbtns"><button class="iconbtn" data-act="home-editreward" data-id="${esc(r.id)}" aria-label="${esc(ctx.t("Ret {name}", { name: r.title }))}">${svg("edit")}</button><button class="iconbtn" data-act="home-delreward" data-id="${esc(r.id)}" aria-label="${esc(ctx.t("Slet {name}", { name: r.title }))}">${svg("trash")}</button></span></div>`;
        })
        .join("") || `<div class="t-sub">${esc(ctx.t("Ingen belønninger endnu. Børnene kan købe dem for deres point."))}</div>`}</div></section>`;
  } else {
    const dates = weekDates(ctx);
    body = `<section class="card" style="margin-top:12px;overflow:auto"><div class="card-head"><h2>${esc(ctx.t("Ugen"))}</h2><span class="meta">${esc(ctx.t("Uge {n}", { n: isoWeek(todayDate(ctx)) }))}</span></div>
      <div class="hh-wgrid" style="grid-template-columns:minmax(110px,1.2fr) repeat(7,minmax(40px,1fr))"><span></span>${dates.map((d) => `<span class="hh-wh${isoOf(d) === ctx.data.today ? " today" : ""}">${esc(ctx.fmt.short(d))}<small>${d.getDate()}</small></span>`).join("")}
      ${kids
        .map((k) => `<span class="hh-wn">${ctx.avatar(k.id, "sm")}${esc(k.name)}</span>${dates
          .map((d) => {
            const iso = isoOf(d);
            const p = progress(ctx, k, d);
            const fut = iso > ctx.data.today;
            const f = p.total ? p.done / p.total : 0;
            return `<span class="hh-wc${fut ? " future" : ""}${p.total && f === 1 && !fut ? " perfect" : ""}" style="--pc:${esc(k.color)};--f:${fut ? 0 : f}" title="${esc(`${k.name}: ${p.done}/${p.total}`)}">${p.total ? (fut ? p.total : f === 1 ? svg("check") : `${p.done}/${p.total}`) : "–"}</span>`;
          })
          .join("")}`)
        .join("")}</div></section>`;
  }
  return `${pend.length ? `<section class="card" style="margin-bottom:16px"><div class="card-head"><h2>${esc(ctx.t("Godkend køb"))}</h2><span class="lock">${svg("shield")}${esc(ctx.t("Kun forældre"))}</span></div><div class="tasks">${pend.map((r) => approveRow(ctx, r)).join("")}</div></section>` : ""}
    ${kids.length && pointsOn(ctx) ? `<div class="kids hh-kids">${kids
      .map((k) => {
        const g = ctx.on("shop") ? goalOf(ctx, k.id) : null;
        const pts = ctx.points(k.id);
        return `<button class="kid" style="--kc:${esc(k.color)}" data-go="person:${esc(k.id)}">${bigRing(ctx, k)}<div class="score num">${pts}${STAR}</div>${ctx.on("missions") ? `<span class="streak">${svg("flame")}${esc(ctx.t("{n} perfekte dage i ugen", { n: perfectDays(ctx, k) }))}</span>` : ""}${g ? `<div class="goal">${g.cost > pts ? ctx.t("{n} point til {what}", { n: g.cost - pts, what: `<b>${esc(g.emoji)} ${esc(g.title)}</b>` }) : ctx.t("{what} er tjent!", { what: `<b>${esc(g.title)}</b>` })}</div>` : ""}</button>`;
      })
      .join("")}</div>` : ""}
    <div class="seg hh-tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" data-act="home-optab" data-id="${k}" aria-pressed="${opTab === k}">${esc(ctx.t(n))}</button>`).join("")}</div>
    ${body}`;
}

function missionEditRow(ctx, m) {
  return `<div class="task hh-mrow"><span class="hh-bigemo">${esc(m.emoji || "⭐")}</span><div style="min-width:0"><div class="t-ttl">${esc(m.title)}</div><div class="t-sub"><span>${esc(daysText(ctx, m.days))}</span><span>${esc(partName(ctx, m.part))}</span>${m.time ? `<span>${svg("clock")}${timeText(ctx, m.time)}</span>` : ""}</div></div>
    ${pointsOn(ctx) && m.points ? `<span class="t-pts">+${m.points}${STAR}</span>` : "<span></span>"}<span class="hh-rowbtns"><button class="iconbtn" data-act="home-editmission" data-id="${esc(m.id)}" aria-label="${esc(ctx.t("Ret {name}", { name: m.title }))}">${svg("edit")}</button><button class="iconbtn" data-act="home-delmission" data-id="${esc(m.id)}" aria-label="${esc(ctx.t("Slet {name}", { name: m.title }))}">${svg("trash")}</button></span></div>`;
}

function whoView(ctx) {
  const kids = ctx.children();
  return `<section class="hv-who"><span style="font-size:46px">👋</span><h1 class="h2" style="font-size:32px;margin:8px 0 4px">${esc(ctx.t("Hvem er du?"))}</h1><p class="t-sub" style="justify-content:center">${esc(ctx.t("Vælg dig selv. Skærmen husker det, til du skifter."))}</p>
    <div class="who-grid hh-whogrid">${kids.map((k, i) => `<button data-act="home-as" data-id="${esc(k.id)}" style="--pc:${esc(k.color)};animation:pop .5s ${i * 80}ms both">${ctx.avatar(k.id)}<span>${esc(k.name)}</span></button>`).join("") || `<p class="t-sub">${esc(ctx.t("Der er ingen børn i familien endnu."))}</p>`}</div>
    <p class="foot" style="margin:24px auto 0">${esc(ctx.t("Forældre logger ind med deres egen bruger for at styre familien."))}</p></section>`;
}

function notReady(ctx) {
  return `<section class="card hv-empty" style="max-width:560px;margin:24px auto">${svg("home", "ic big")}<h2>${esc(ctx.t("Hverdagsro er ikke klar endnu"))}</h2><p class="t-sub" style="justify-content:center;text-align:center">${esc(ctx.t("En forælder skal først gøre opsætningen færdig. Så dukker familien, missionerne og resten op her."))}</p></section>`;
}

function meView(ctx) {
  const m = ctx.me;
  if (!m) return `<section class="card hv-empty">${svg("user", "ic big")}<h2>${esc(ctx.t("Du er ikke med i familien"))}</h2><p class="t-sub">${esc(ctx.t("Tilføj dig selv under Familieindstillinger for at vælge dit eget tema."))}</p>${ctx.isParent ? `<button class="btn" data-go="indstillinger:familie">${esc(ctx.t("Familieindstillinger"))}</button>` : ""}</section>`;
  const tablet = !ctx.data.me && !ctx.data.can_manage;
  const skin = m.skin || "standard";
  const mode = m.mode || "auto";
  return `<section class="me-hero" style="--pc:${esc(m.color)}">${ctx.avatar(m.id)}<div><h2>${esc(m.name)}</h2><small>${esc(m.role === "parent" ? ctx.t("Forælder") : ctx.t("Barn"))}${m.person ? ` · ${esc(ctx.t("person i Home Assistant"))}` : ""}</small></div>${tablet ? `<button class="btn soft sm" data-act="home-as" data-id="">${svg("users")}${esc(ctx.t("Skift bruger"))}</button>` : ""}</section>
    <div class="grid" style="margin-top:16px"><section class="card s12"><div class="card-head"><h2>${esc(ctx.t("Tema"))}</h2><span class="meta">${esc(ctx.t("Kun for {name}", { name: m.name }))}</span></div>
      <div class="sk-grid">${SKINS.map(([k, n, acc, bg]) => `<button class="sk" data-act="home-skin" data-id="${k}" aria-pressed="${skin === k}" style="--sa:${acc};--sb:${bg}"><span class="sk-prev"><i class="sk-sky"></i><i class="sk-card"></i><i class="sk-btn"></i><i class="sk-chip"></i></span><b>${esc(ctx.t(n))}</b></button>`).join("")}</div>
      <div class="seg" style="margin-top:14px;max-width:360px">${[["auto", "Automatisk"], ["light", "Lyst"], ["dark", "Mørkt"]].map(([k, n]) => `<button data-act="home-skinmode" data-id="${k}" aria-pressed="${mode === k}" ${skin === "rummet" ? "disabled" : ""}>${esc(ctx.t(n))}</button>`).join("")}</div>
      <p class="t-sub" style="margin-top:10px">${esc(ctx.t("Automatisk følger Home Assistants lyse eller mørke tema."))}</p></section>
    ${ctx.isParent ? `<section class="card s12"><div class="card-head"><h2>${esc(ctx.t("Familien"))}</h2></div><div class="hh-quick"><button class="btn soft sm" data-go="indstillinger">${svg("shield")}${esc(ctx.t("Familieindstillinger"))}</button><button class="btn soft sm" data-go="person:${esc(m.id)}">${svg("user")}${esc(ctx.t("Min side"))}</button></div></section>` : ""}</div>`;
}

// ---------------------------------------------------------------- effects
function confettiCanvas(ctx) {
  let cv = ctx.root.querySelector("canvas.hh-confetti");
  if (!cv) {
    cv = document.createElement("canvas");
    cv.className = "hh-confetti";
    cv.setAttribute("aria-hidden", "true");
    ctx.root.appendChild(cv);
  }
  return cv;
}
const reduce = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
let parts = [];
let running = false;
function burst(ctx, x, y, color, n = 26) {
  if (reduce()) return;
  const cv = confettiCanvas(ctx);
  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth, H = window.innerHeight;
  if (!running) {
    cv.width = W * dpr;
    cv.height = H * dpr;
  }
  const g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = [color || "#6E4AFF", "#FFB020", "#19B6A5", "#FF7A59", "#6E4AFF"];
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(140, 360);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, r: rnd(3, 6), c: cols[i % cols.length], life: 1, rot: rnd(0, 6) });
  }
  if (running) return;
  running = true;
  let t0 = performance.now();
  requestAnimationFrame(function step(t) {
    const dt = Math.min(0.04, (t - t0) / 1000);
    t0 = t;
    g.clearRect(0, 0, W, H);
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
    parts = parts.filter((p) => p.life > 0);
    if (parts.length) requestAnimationFrame(step);
    else {
      running = false;
      g.clearRect(0, 0, W, H);
    }
  });
}
function flyPts(ctx, x, y, n) {
  const f = document.createElement("div");
  f.className = "fly";
  f.textContent = `+${n}`;
  f.style.left = `${x}px`;
  f.style.top = `${y}px`;
  ctx.root.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}

// ---------------------------------------------------------------- sheets
function missionSheet(ctx, mission, memberId) {
  const isNew = !mission;
  const m = mission || { id: "", title: "", member: memberId || ctx.children()[0]?.id || "all", points: 5, days: [0, 1, 2, 3, 4, 5, 6], time: null, emoji: "⭐", part: "day" };
  const mon = new Date(2024, 0, 1);
  const owners = [...ctx.children().map((k) => [k.id, k.name]), ["all", ctx.t("Alle børn")], ...ctx.parents().map((p) => [p.id, p.name])];
  const s = ctx.sheet(`<div class="eyebrow">${esc(isNew ? ctx.t("Ny mission") : ctx.t("Ret mission"))}</div><h2>${esc(isNew ? ctx.t("Hvad skal klares?") : m.title)}</h2>
    <form class="hh-form" novalidate>
      <div class="field"><label for="hh-title">${esc(ctx.t("Mission"))}</label><input id="hh-title" name="title" maxlength="80" required value="${esc(m.title)}" placeholder="${esc(ctx.t("Fx Red seng"))}" autocomplete="off"></div>
      <div class="field"><span class="lbl">${esc(ctx.t("Ikon"))}</span><div class="hh-emos">${EMOJI.map((e) => `<button type="button" class="hh-emobtn" data-emo="${e}" aria-pressed="${m.emoji === e}">${e}</button>`).join("")}<input name="emoji" class="hh-emoin" maxlength="8" value="${esc(m.emoji)}" aria-label="${esc(ctx.t("Eget ikon"))}"></div></div>
      <div class="field"><label for="hh-who">${esc(ctx.t("Hvem"))}</label><select id="hh-who" name="member">${owners.map(([id, n]) => `<option value="${esc(id)}" ${id === m.member ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
      <div class="field"><span class="lbl">${esc(ctx.t("Dage"))}</span><div class="hh-days">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<button type="button" class="hh-day" data-day="${i}" aria-pressed="${m.days.includes(i)}">${esc(ctx.fmt.short(addDays(mon, i)))}</button>`).join("")}</div>
        <div class="hh-dayq"><button type="button" class="lnk" data-days="0,1,2,3,4,5,6">${esc(ctx.t("Hver dag"))}</button><button type="button" class="lnk" data-days="0,1,2,3,4">${esc(ctx.t("Hverdage"))}</button><button type="button" class="lnk" data-days="5,6">${esc(ctx.t("Weekender"))}</button></div></div>
      <div class="field"><span class="lbl">${esc(ctx.t("Hvornår på dagen"))}</span><div class="seg hh-partseg">${PARTS.map(([k, n, ic]) => `<button type="button" data-part="${k}" aria-pressed="${m.part === k}">${svg(ic)}<span>${esc(ctx.t(n))}</span></button>`).join("")}</div></div>
      <div class="hh-row2"><div class="field"><label for="hh-time">${esc(ctx.t("Klokken (valgfrit)"))}</label><input id="hh-time" name="time" type="time" value="${esc(m.time || "")}"></div>
      ${pointsOn(ctx) ? `<div class="field"><label for="hh-pts">${esc(ctx.t("Point"))}</label><input id="hh-pts" name="points" type="number" min="0" max="1000" step="1" inputmode="numeric" value="${m.points}"></div>` : ""}</div>
      <div class="sheet-actions">${isNew ? "" : `<button type="button" class="btn soft danger-t" data-del>${svg("trash")}${esc(ctx.t("Slet"))}</button><span class="grow"></span>`}<button type="button" class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button type="submit" class="btn">${esc(ctx.t("Gem"))}</button></div>
    </form>`);
  const form = s.el.querySelector("form");
  let days = [...m.days];
  let part = m.part;
  const paintDays = () => s.el.querySelectorAll("[data-day]").forEach((b) => b.setAttribute("aria-pressed", String(days.includes(+b.dataset.day))));
  s.el.addEventListener("click", (e) => {
    const emo = e.target.closest("[data-emo]");
    if (emo) {
      form.emoji.value = emo.dataset.emo;
      s.el.querySelectorAll("[data-emo]").forEach((b) => b.setAttribute("aria-pressed", String(b === emo)));
    }
    const d = e.target.closest("[data-day]");
    if (d) {
      const i = +d.dataset.day;
      days = days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort();
      paintDays();
    }
    const q = e.target.closest("[data-days]");
    if (q) {
      days = q.dataset.days.split(",").map(Number);
      paintDays();
    }
    const p = e.target.closest("[data-part]");
    if (p) {
      part = p.dataset.part;
      s.el.querySelectorAll("[data-part]").forEach((b) => b.setAttribute("aria-pressed", String(b === p)));
    }
    if (e.target.closest("[data-del]")) {
      s.close();
      deleteMission(ctx, m.id);
    }
  });
  setTimeout(() => form.title.focus(), 50);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    if (!title) return form.title.focus();
    if (!days.length) return ctx.toast(ctx.t("Vælg mindst én dag"));
    const list = [...(ctx.data.missions || [])];
    const item = {
      id: m.id || uniqueId(slug(title).replace(/_/g, "-"), list),
      title,
      member: form.member.value,
      points: pointsOn(ctx) ? Math.max(0, Math.min(1000, parseInt(form.points?.value, 10) || 0)) : m.points,
      days,
      time: form.time.value || null,
      emoji: form.emoji.value.trim().slice(0, 8),
      part,
    };
    const i = list.findIndex((x) => x.id === m.id);
    if (i >= 0) list[i] = item;
    else list.push(item);
    s.close();
    if (await ctx.save("missions", list)) ctx.toast(isNew ? ctx.t("Missionen er oprettet") : ctx.t("Missionen er gemt"));
    ctx.render();
  });
}

function uniqueId(base, list) {
  let id = (base || "").replace(/^[^a-z0-9]+/, "").slice(0, 40) || uid("m");
  if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(id)) id = uid("m");
  let out = id, n = 2;
  while (list.some((x) => x.id === out)) out = `${id.slice(0, 44)}-${n++}`;
  return out;
}

function deleteMission(ctx, id) {
  const m = (ctx.data.missions || []).find((x) => x.id === id);
  if (!m) return;
  ctx.confirm(ctx.t("Slet {name}?", { name: m.title }), ctx.t("Missionen forsvinder for alle. Point, der allerede er givet, bliver."), ctx.t("Slet"), async () => {
    if (await ctx.save("missions", (ctx.data.missions || []).filter((x) => x.id !== id))) ctx.toast(ctx.t("Missionen er slettet"));
    ctx.render();
  });
}

function rewardSheet(ctx, r0) {
  const isNew = !r0;
  const r = r0 || { id: "", title: "", member: "all", cost: 50, emoji: "🎁" };
  const owners = [["all", ctx.t("Alle børn")], ...ctx.children().map((k) => [k.id, k.name])];
  const s = ctx.sheet(`<div class="eyebrow">${esc(isNew ? ctx.t("Ny belønning") : ctx.t("Ret belønning"))}</div><h2>${esc(isNew ? ctx.t("Hvad kan man købe?") : r.title)}</h2>
    <form class="hh-form" novalidate>
      <div class="field"><label for="hh-rt">${esc(ctx.t("Belønning"))}</label><input id="hh-rt" name="title" maxlength="60" value="${esc(r.title)}" placeholder="${esc(ctx.t("Fx Vælg aftenens film"))}" autocomplete="off"></div>
      <div class="field"><span class="lbl">${esc(ctx.t("Ikon"))}</span><div class="hh-emos">${REWARD_EMOJI.map((e) => `<button type="button" class="hh-emobtn" data-emo="${e}" aria-pressed="${r.emoji === e}">${e}</button>`).join("")}<input name="emoji" class="hh-emoin" maxlength="8" value="${esc(r.emoji)}" aria-label="${esc(ctx.t("Eget ikon"))}"></div></div>
      <div class="hh-row2"><div class="field"><label for="hh-rw">${esc(ctx.t("Hvem"))}</label><select id="hh-rw" name="member">${owners.map(([id, n]) => `<option value="${esc(id)}" ${id === r.member ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
      <div class="field"><label for="hh-rc">${esc(ctx.t("Pris i point"))}</label><input id="hh-rc" name="cost" type="number" min="1" max="100000" inputmode="numeric" value="${r.cost}"></div></div>
      <div class="sheet-actions"><button type="button" class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button type="submit" class="btn">${esc(ctx.t("Gem"))}</button></div></form>`);
  const form = s.el.querySelector("form");
  s.el.addEventListener("click", (e) => {
    const emo = e.target.closest("[data-emo]");
    if (!emo) return;
    form.emoji.value = emo.dataset.emo;
    s.el.querySelectorAll("[data-emo]").forEach((b) => b.setAttribute("aria-pressed", String(b === emo)));
  });
  setTimeout(() => form.title.focus(), 50);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    if (!title) return form.title.focus();
    const list = [...(ctx.data.rewards || [])];
    const item = { id: r.id || uniqueId(slug(title).replace(/_/g, "-"), list), title, member: form.member.value, cost: Math.max(1, Math.min(100000, parseInt(form.cost.value, 10) || 1)), emoji: form.emoji.value.trim().slice(0, 8) || "🎁" };
    const i = list.findIndex((x) => x.id === r.id);
    if (i >= 0) list[i] = item;
    else list.push(item);
    s.close();
    if (await ctx.save("rewards", list)) ctx.toast(isNew ? ctx.t("Belønningen er oprettet") : ctx.t("Belønningen er gemt"));
    ctx.render();
  });
}

function pointsSheet(ctx, id) {
  const m = ctx.member(id);
  if (!m) return;
  const s = ctx.sheet(`<div class="eyebrow">${esc(ctx.t("Point"))}</div><h2>${esc(ctx.t("Giv eller træk point fra {name}", { name: m.name }))}</h2>
    <form class="hh-form" novalidate><div class="hh-row2"><div class="field"><label for="hh-pn">${esc(ctx.t("Point"))}</label><input id="hh-pn" name="n" type="number" inputmode="numeric" value="5" min="-100000" max="100000"></div>
    <div class="field"><label for="hh-pr">${esc(ctx.t("Hvorfor"))}</label><input id="hh-pr" name="reason" maxlength="80" placeholder="${esc(ctx.t("Fx Hjalp med indkøb"))}"></div></div>
    <p class="t-sub">${esc(ctx.t("Brug minus for at trække point fra. {name} har {n} point nu.", { name: m.name, n: ctx.points(m.id) }))}</p>
    <div class="sheet-actions"><button type="button" class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button type="submit" class="btn">${esc(ctx.t("Gem"))}</button></div></form>`);
  const form = s.el.querySelector("form");
  setTimeout(() => form.n.select(), 50);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const n = parseInt(form.n.value, 10);
    if (!n) return form.n.focus();
    s.close();
    await givePoints(ctx, m.id, n, form.reason.value.trim());
  });
}

async function givePoints(ctx, id, n, reason = "") {
  try {
    const r = await ctx.ws("points", { member: id, delta: n, reason: reason || (n > 0 ? ctx.t("Ekstra point") : ctx.t("Point trukket fra")) });
    ctx.data.points = { ...ctx.data.points, [id]: r.points };
    ctx.toast(n > 0 ? ctx.t("{name} fik {n} point", { name: ctx.member(id)?.name, n }) : ctx.t("{n} point trukket fra {name}", { name: ctx.member(id)?.name, n: -n }));
    ctx.render();
  } catch (err) {
    ctx.toast(String(err?.message || err));
  }
}

// ---------------------------------------------------------------- acts
const acts = {
  async "home-mission"(el, ev, ctx) {
    const mid = el.dataset.id;
    const member = ctx.member(el.dataset.member);
    const mission = (ctx.data.missions || []).find((x) => x.id === mid);
    if (!member || !mission) return;
    if (ctx.isKid && ctx.me?.id !== member.id) return ctx.toast(ctx.t("Det kan kun far eller mor"));
    const key = `${mid}:${member.id}`;
    const done = !(key in (ctx.data.done_today || {}));
    // Show it at once; the server's answer follows.
    const before = { done: { ...(ctx.data.done_today || {}) }, points: { ...(ctx.data.points || {}) } };
    const row = el.closest(".task");
    row?.classList.toggle("done", done);
    el.style.background = done ? member.color : "";
    el.setAttribute("aria-pressed", String(done));
    const dt = { ...(ctx.data.done_today || {}) };
    if (done) dt[key] = { at: new Date().toISOString(), by: ctx.data.me };
    else delete dt[key];
    ctx.data.done_today = dt;
    ctx.data.done_week = { ...(ctx.data.done_week || {}), [ctx.data.today]: dt };
    const usePts = pointsOn(ctx) && mission.points;
    if (usePts) ctx.data.points = { ...ctx.data.points, [member.id]: Math.max(0, ctx.points(member.id) + (done ? mission.points : -mission.points)) };
    if (done) {
      const r = el.getBoundingClientRect();
      burst(ctx, r.left + r.width / 2, r.top + r.height / 2, member.color);
      if (usePts) flyPts(ctx, r.right + 6, r.top, mission.points);
      const p = progress(ctx, member);
      const tag = `${ctx.data.today}:${member.id}`;
      if (p.total && p.done === p.total && celebrated !== tag) {
        celebrated = tag;
        setTimeout(() => {
          burst(ctx, window.innerWidth / 2, window.innerHeight / 3, member.color, 90);
          ctx.toast(ctx.t("Perfekt dag! {name} har klaret alle missioner", { name: member.name }));
        }, 450);
      }
    }
    setTimeout(() => ctx.render(), 650);
    try {
      await ctx.ws("mission", { mission: mid, member: member.id, done });
    } catch (err) {
      ctx.data.done_today = before.done;
      ctx.data.done_week = { ...(ctx.data.done_week || {}), [ctx.data.today]: before.done };
      ctx.data.points = before.points;
      ctx.toast(String(err?.message || err));
      ctx.render();
    }
  },
  async "home-decide"(el, ev, ctx) {
    const ok = !!el.dataset.ok;
    el.disabled = true;
    try {
      await ctx.ws("reward/decide", { request: el.dataset.id, approve: ok });
      ctx.toast(ok ? ctx.t("Købet er godkendt") : ctx.t("Købet er afvist"));
      if (ok) {
        const r = el.getBoundingClientRect();
        burst(ctx, r.left + r.width / 2, r.top, "#F2B01E");
      }
    } catch (err) {
      el.disabled = false;
      ctx.toast(String(err?.message || err));
    }
  },
  async "home-buy"(el, ev, ctx) {
    const member = el.dataset.member;
    const r = reward(ctx, el.dataset.id);
    el.disabled = true;
    try {
      const req = await ctx.ws("reward/request", { member, reward: el.dataset.id });
      const box = el.getBoundingClientRect();
      burst(ctx, box.left + box.width / 2, box.top, ctx.member(member)?.color, 40);
      ctx.toast(req?.status === "approved" ? ctx.t("{what} er købt", { what: r?.title }) : ctx.t("Sendt til far og mor. De skal godkende {what}.", { what: r?.title }));
    } catch (err) {
      el.disabled = false;
      ctx.toast(String(err?.message || err));
    }
  },
  "home-kday"(el, ev, ctx) {
    kidDay = +el.dataset.i || 0;
    ctx.render(true);
  },
  "home-shopkid"(el, ev, ctx) {
    shopKid = el.dataset.id;
    ctx.render(true);
  },
  "home-optab"(el, ev, ctx) {
    opTab = el.dataset.id;
    if (ctx.view !== "opgaver") ctx.go("opgaver");
    else ctx.render(true);
  },
  "home-newmission"(el, ev, ctx) {
    missionSheet(ctx, null, el.dataset.member);
  },
  "home-editmission"(el, ev, ctx) {
    missionSheet(ctx, (ctx.data.missions || []).find((x) => x.id === el.dataset.id));
  },
  "home-delmission"(el, ev, ctx) {
    deleteMission(ctx, el.dataset.id);
  },
  "home-editreward"(el, ev, ctx) {
    rewardSheet(ctx, el.dataset.id ? reward(ctx, el.dataset.id) : null);
  },
  "home-delreward"(el, ev, ctx) {
    const r = reward(ctx, el.dataset.id);
    if (!r) return;
    ctx.confirm(ctx.t("Slet {name}?", { name: r.title }), ctx.t("Belønningen forsvinder fra shoppen."), ctx.t("Slet"), async () => {
      if (await ctx.save("rewards", (ctx.data.rewards || []).filter((x) => x.id !== r.id))) ctx.toast(ctx.t("Belønningen er slettet"));
      ctx.render();
    });
  },
  "home-points"(el, ev, ctx) {
    pointsSheet(ctx, el.dataset.id);
  },
  "home-give"(el, ev, ctx) {
    const n = parseInt(el.dataset.n, 10);
    if (n > 0) {
      const r = el.getBoundingClientRect();
      flyPts(ctx, r.left + r.width / 2, r.top, n);
    }
    return givePoints(ctx, el.dataset.id, n);
  },
  "home-seeas"(el, ev, ctx) {
    ctx.panel?.viewAs(el.dataset.id);
  },
  "home-as"(el, ev, ctx) {
    kidDay = 0;
    ctx.panel?.viewAs(el.dataset.id || null);
  },
  async "home-skin"(el, ev, ctx) {
    await setTheme(ctx, el.dataset.id, el.dataset.id === "rummet" ? "dark" : ctx.me?.mode || "auto");
  },
  async "home-skinmode"(el, ev, ctx) {
    await setTheme(ctx, ctx.me?.skin || "standard", el.dataset.id);
  },
};

async function setTheme(ctx, skin, mode) {
  const m = ctx.me;
  if (!m) return;
  const before = { skin: m.skin, mode: m.mode };
  m.skin = skin;
  m.mode = mode;
  ctx.applyTheme?.();
  ctx.render(true);
  try {
    await ctx.ws("theme", { member: m.id, skin, mode });
  } catch (err) {
    Object.assign(m, before);
    ctx.applyTheme?.();
    ctx.render(true);
    ctx.toast(String(err?.message || err));
  }
}

function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : s;
}
function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - y0) / 864e5 + 1) / 7);
}

// ---------------------------------------------------------------- module
const views = {
  hjem: { render: pHome, title: (ctx) => ctx.t("Hjem"), parentOnly: true },
  person: { render: personPage, title: (ctx) => ctx.member(ctx.arg)?.name || "", parentOnly: true },
  dag: {
    render: kidDayView,
    title: (ctx) => ctx.t("Min dag"),
    kidOnly: true,
    summary(ctx) {
      const p = progress(ctx, ctx.me);
      return { done: p.done, total: p.total };
    },
    badge(ctx) {
      if (!ctx.me) return 0;
      const p = progress(ctx, ctx.me);
      return p.total - p.done;
    },
  },
  shop: { render: shopView, title: (ctx) => ctx.t("Shop"), module: "shop" },
  opgaver: { render: tasksView, title: (ctx) => ctx.t("Opgaver"), parentOnly: true, module: "missions" },
  hvem: { render: whoView, title: (ctx) => ctx.t("Hvem er du?") },
  "ikke-klar": { render: notReady, title: () => "" },
  mig: { render: meView, title: (ctx) => ctx.t("Mine indstillinger") },
};

const css = `
.hh-whogrid { grid-template-columns: repeat(auto-fit, minmax(140px, 180px)) !important; justify-content: center; }
.hh-confetti { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 98; }
.hh-emo { margin-right: 6px; }
.hh-none { padding: 6px; }
.hh-foot { display: flex; justify-content: flex-end; margin-top: 10px; }
.hh-goalrow { grid-template-columns: auto minmax(0, 1fr) auto; border: 0; text-align: left; width: 100%; color: var(--ink); cursor: pointer; }
.hh-kidsday { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.hh-kd { border-radius: 18px; padding: 12px; background: color-mix(in srgb, var(--pc) 7%, var(--surface)); border: 1px solid color-mix(in srgb, var(--pc) 16%, var(--line)); min-width: 0; }
.hh-kd-h { display: flex; align-items: center; gap: 8px; border: 0; background: none; color: var(--ink); padding: 0; width: 100%; font: inherit; cursor: pointer; }
.hh-kd-h b { font-weight: 800; }
.hh-kd-n { margin-left: auto; font-weight: 800; color: var(--pc); }
.hh-kd .progress { margin: 8px 0 10px; }
.hh-kd .task { background: var(--surface); }
.hh-alldone { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--good); padding: 8px 4px; }
.hh-alldone .ic { width: 18px; height: 18px; }
.hh-more, .lnk { border: 0; background: none; color: var(--violet); font-weight: 700; padding: 4px 2px; cursor: pointer; font: inherit; font-weight: 700; }
.hh-week1 { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.hh-wd { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; }
.hh-wd small { color: var(--muted); font-weight: 700; text-transform: capitalize; }
.hh-wd.today small { color: var(--pc); }
.hh-wd-c { width: 100%; max-width: 40px; height: 46px; border-radius: 12px; background: var(--surface-2); position: relative; overflow: hidden; display: grid; place-items: center; }
.hh-wd-c i { position: absolute; left: 0; right: 0; bottom: 0; background: var(--pc); opacity: .85; border-radius: 10px 10px 0 0; animation: hhgrow .9s cubic-bezier(.2,.8,.2,1) both; transform-origin: bottom; }
.hh-wd-c .ic { position: relative; color: #fff; width: 18px; height: 18px; }
.hh-wd.today .hh-wd-c { box-shadow: 0 0 0 2px var(--pc); }
.hh-wd.future { opacity: .5; }
.hh-wd b { font-weight: 800; font-size: 11.5px; }
@keyframes hhgrow { from { transform: scaleY(0); } }
.hh-goalmini { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; background: color-mix(in srgb, var(--pc) 9%, var(--surface-2)); }
.hh-gem { font-size: 28px; }
.hh-quick { display: flex; gap: 6px; flex-wrap: wrap; margin: 12px 0; }
.hh-ledger { display: flex; flex-direction: column; gap: 4px; }
.hh-led { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 10px; align-items: center; padding: 6px 4px; border-bottom: 1px solid var(--line); }
.hh-led:last-child { border-bottom: 0; }
.hh-led b { display: block; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hh-led small { color: var(--muted); font-size: 12px; }
.hh-led-d { font-weight: 800; color: var(--good); text-align: center; border-radius: 10px; background: color-mix(in srgb, var(--good) 12%, transparent); padding: 4px 0; display: grid; place-items: center; }
.hh-led-d.neg { color: var(--bad); background: color-mix(in srgb, var(--bad) 12%, transparent); }
.hh-led-d .ic { width: 16px; height: 16px; }
.hh-part + .hh-part { margin-top: 14px; }
.hh-part-h { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: var(--muted); margin: 0 4px 8px; }
.hh-part-h .ic { width: 16px; height: 16px; color: var(--kc, var(--violet)); }
.hh-part .mission .t-sub .ic, .task .t-sub .ic { width: 13px; height: 13px; vertical-align: -2px; }
.hh-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.hh-me { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; background: radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--pc) 16%, var(--surface)), var(--surface)); }
.hh-me .hh-ringarc { transition: stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1); }
.hh-kids-pick { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.hh-kids-pick .grow { flex: 1; }
.hh-kp { display: inline-flex; align-items: center; gap: 8px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 999px; padding: 4px 12px 4px 4px; font-weight: 700; cursor: pointer; transition: border-color .2s, background .2s; }
.hh-kp b { color: var(--muted); font-size: 12.5px; }
.hh-kp.on { border-color: var(--pc); background: color-mix(in srgb, var(--pc) 10%, var(--surface)); }
.hh-kp.on b { color: var(--pc); }
.hh-wp { width: 100%; margin: 0; }
.hh-kids { grid-template-columns: repeat(auto-fit, minmax(180px, 260px)); }
@media (max-width: 640px) {
  .hh-kids { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: minmax(150px, 44%); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; margin-inline: -16px; padding: 2px 16px 8px; }
  .hh-kids .kid { scroll-snap-align: start; padding: 12px 10px; }
  .hh-kids .kid .big-ring { width: 74px; height: 74px; }
  .hh-kids .kid .score { font-size: 22px; }
  .hh-kids .kid .streak { font-size: 11px; }
}
.hh-tabs { margin: 16px 0 0; max-width: 460px; }
.hh-add { margin-top: 10px; }
.hh-mrow, .hh-rrow { grid-template-columns: 40px minmax(0, 1fr) auto auto; }
.hh-bigemo { font-size: 24px; text-align: center; line-height: 1; }
.hh-rowbtns { display: inline-flex; }
.hh-wgrid { display: grid; gap: 6px; align-items: center; min-width: 440px; }
.hh-wh { text-align: center; font-size: 12px; font-weight: 800; color: var(--muted); text-transform: capitalize; }
.hh-wh small { display: block; font-size: 11px; font-weight: 600; }
.hh-wh.today { color: var(--violet); }
.hh-wn { display: flex; align-items: center; gap: 8px; font-weight: 700; min-width: 0; }
.hh-wc { height: 38px; border-radius: 12px; display: grid; place-items: center; font-size: 12px; font-weight: 800; background: color-mix(in srgb, var(--pc) calc(var(--f) * 55%), var(--surface-2)); color: var(--ink); }
.hh-wc.perfect { background: var(--pc); color: #fff; }
.hh-wc.perfect .ic { width: 18px; height: 18px; }
.hh-wc.future { opacity: .45; }
.hh-form .field:first-child { margin-top: 6px; }
.hh-row2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0 12px; }
.hh-form input, .hh-form select { color: var(--ink); font: inherit; }
.hh-emos { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.hh-emobtn { width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid var(--line); background: var(--surface-2); font-size: 20px; cursor: pointer; transition: transform .15s; }
.hh-emobtn[aria-pressed="true"] { border-color: var(--violet); background: color-mix(in srgb, var(--violet) 14%, var(--surface)); transform: scale(1.08); }
.hh-emoin { width: 64px; text-align: center; font-size: 18px !important; }
.hh-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.hh-day { border: 1.5px solid var(--line); background: var(--surface-2); color: var(--muted); border-radius: 10px; padding: 9px 0; font-weight: 800; font-size: 12.5px; text-transform: capitalize; cursor: pointer; }
.hh-day[aria-pressed="true"] { background: var(--violet); border-color: var(--violet); color: #fff; }
.hh-dayq { display: flex; gap: 12px; margin-top: 4px; font-size: 13px; }
.hh-partseg { flex-wrap: wrap; }
.hh-partseg button { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 96px; }
.hh-partseg .ic { width: 15px; height: 15px; }
.sheet-actions .grow { flex: 1; }
.danger-t { color: var(--bad) !important; }
.task .check[disabled] { opacity: .5; cursor: default; }
@media (max-width: 640px) { .hh-partseg button span { font-size: 12px; } .hh-week1 { gap: 3px; } }
`;

const en = {
  "Telefonens batteri": "Phone battery",
  Morgen: "Morning",
  "I løbet af dagen": "During the day",
  Eftermiddag: "Afternoon",
  Aften: "Evening",
  Hverdagsro: "Hverdagsro",
  Nordlys: "Northern lights",
  Hav: "Sea",
  Skov: "Forest",
  Sand: "Sand",
  Rosa: "Pink",
  Rummet: "Space",
  Kontrast: "Contrast",
  Dagpleje: "Childminder",
  Vuggestue: "Nursery",
  Børnehave: "Kindergarten",
  Skole: "School",
  nu: "now",
  "om {n} min": "in {n} min",
  "om {h} t {m} min": "in {h} h {m} min",
  Hjemme: "Home",
  Ude: "Away",
  "Hver dag": "Every day",
  Hverdage: "Weekdays",
  Weekender: "Weekends",
  "Marker {name} som klaret": "Mark {name} as done",
  "En belønning": "A reward",
  "{name} vil købe {what} for {n} point": "{name} wants to buy {what} for {n} points",
  "Venter på en forælder · {name} har {n} point": "Waiting for a parent · {name} has {n} points",
  Godkend: "Approve",
  Afvis: "Decline",
  "Hele dagen": "All day",
  Familien: "The family",
  "Hjemme nu": "Home now",
  "I aften": "Tonight",
  "Perfekte dage i denne uge": "Perfect days this week",
  klaret: "done",
  Barn: "Child",
  Forælder: "Parent",
  "siden {t}": "since {t}",
  "Intet planlagt": "Nothing planned",
  "Ingen i familien endnu": "No one in the family yet",
  "Tilføj familien under Familieindstillinger, så kommer forsiden til live.": "Add the family in Family settings and the front page comes to life.",
  "Tilføj familien": "Add the family",
  "Godkend køb": "Approve purchases",
  "Kun forældre": "Parents only",
  "I dag og i morgen": "Today and tomorrow",
  "I dag": "Today",
  "Ingen aftaler i dag": "Nothing planned today",
  "I morgen, {day}": "Tomorrow, {day}",
  "Ingen aftaler i morgen": "Nothing planned tomorrow",
  Kalender: "Calendar",
  Aftensmad: "Dinner",
  Madplan: "Meal plan",
  "Ikke planlagt endnu": "Not planned yet",
  "Børnenes mål": "The children's goals",
  Shop: "Shop",
  "Intet mål endnu": "No goal yet",
  "Børnene i dag": "The children today",
  "Alle opgaver": "All tasks",
  "Alle missioner er klaret": "All missions done",
  "+{n} mere": "+{n} more",
  "Ingen missioner i dag.": "No missions today.",
  "Opret missioner": "Create missions",
  "Alt er roligt": "All is calm",
  "Slå flere moduler til under Familieindstillinger.": "Turn on more modules in Family settings.",
  Moduler: "Modules",
  Hjem: "Home",
  "{n} point": "{n} points",
  "{done}/{total} missioner i dag": "{done}/{total} missions today",
  "{n} perfekte dage i ugen": "{n} perfect days this week",
  "Se som {name}": "See as {name}",
  Point: "Points",
  "Mine indstillinger": "My settings",
  "Missioner i dag": "Missions today",
  "Ny mission": "New mission",
  "Ingen missioner i dag": "No missions today",
  Ugen: "The week",
  point: "points",
  "Andet …": "Other …",
  "Ingen point endnu": "No points yet",
  "Den næste uge": "The coming week",
  "Ingen aftaler den næste uge": "Nothing planned the coming week",
  "{n} år": "{n} years",
  "Person i Home Assistant": "Person in Home Assistant",
  Profil: "Profile",
  "Ret i Familieindstillinger": "Edit in Family settings",
  "Tilføj fødselsdag, person og kalender under Familieindstillinger.": "Add birthday, person and calendar in Family settings.",
  "Mine missioner i dag": "My missions today",
  "Missioner {day}": "Missions {day}",
  "{done}/{total} klaret": "{done}/{total} done",
  af: "of",
  "Perfekt dag!": "Perfect day!",
  "Du har klaret alle dine missioner, {name}.": "You have done all your missions, {name}.",
  "Ingen missioner {day}.": "No missions {day}.",
  "i dag": "today",
  "{n} point til {what}": "{n} points to {what}",
  "{what} er tjent!": "{what} is earned!",
  "Til shoppen": "To the shop",
  Nu: "Now",
  Først: "First",
  Fri: "Free",
  Næste: "Next",
  "kl.": "at",
  Godnat: "Good night",
  "Ingen aftaler": "Nothing planned",
  "Point er slået fra": "Points are turned off",
  "Shoppen bruger point. Slå point til under Familieindstillinger.": "The shop uses points. Turn points on in Family settings.",
  "Vælg barn": "Choose child",
  "Ret belønninger": "Edit rewards",
  "Shoppen er tom": "The shop is empty",
  "Opret belønninger, som børnene kan købe for deres point.": "Create rewards the children can buy with their points.",
  "Far eller mor har ikke lagt noget i shoppen endnu.": "Mum or dad hasn't put anything in the shop yet.",
  "Ny belønning": "New reward",
  "Mit mål": "My goal",
  "{name}s mål": "{name}'s goal",
  "{n} af {cost} point": "{n} of {cost} points",
  "{what} venter på, at en forælder godkender": "{what} is waiting for a parent to approve",
  "Min pointshop": "My points shop",
  "{name}s pointshop": "{name}'s points shop",
  Venter: "Waiting",
  "Mangler {n}": "{n} to go",
  "Køb for {name}": "Buy for {name}",
  Køb: "Buy",
  Mål: "Goal",
  Godkendt: "Approved",
  Afvist: "Declined",
  "Pointene trækkes først, når en forælder har godkendt købet.": "The points are only taken when a parent has approved the purchase.",
  Missioner: "Missions",
  Belønninger: "Rewards",
  "Alle børn": "All children",
  "{n} missioner": "{n} missions",
  "Missioner for alle børnene, fx tandbørstning.": "Missions for all the children, like brushing teeth.",
  "Ingen missioner endnu": "No missions yet",
  "Ret {name}": "Edit {name}",
  "Slet {name}": "Delete {name}",
  "Ingen belønninger endnu. Børnene kan købe dem for deres point.": "No rewards yet. The children can buy them with their points.",
  "Uge {n}": "Week {n}",
  "Hvem er du?": "Who are you?",
  "Vælg dig selv. Skærmen husker det, til du skifter.": "Pick yourself. This screen remembers until you switch.",
  "Der er ingen børn i familien endnu.": "There are no children in the family yet.",
  "Forældre logger ind med deres egen bruger for at styre familien.": "Parents sign in with their own user to manage the family.",
  "Hverdagsro er ikke klar endnu": "Hverdagsro isn't ready yet",
  "En forælder skal først gøre opsætningen færdig. Så dukker familien, missionerne og resten op her.": "A parent needs to finish the setup first. Then the family, the missions and the rest show up here.",
  "Du er ikke med i familien": "You're not in the family",
  "Tilføj dig selv under Familieindstillinger for at vælge dit eget tema.": "Add yourself in Family settings to pick your own theme.",
  Familieindstillinger: "Family settings",
  "person i Home Assistant": "person in Home Assistant",
  "Skift bruger": "Switch user",
  Tema: "Theme",
  "Kun for {name}": "Only for {name}",
  Automatisk: "Automatic",
  Lyst: "Light",
  Mørkt: "Dark",
  "Automatisk følger Home Assistants lyse eller mørke tema.": "Automatic follows Home Assistant's light or dark theme.",
  "Min side": "My page",
  "Ret mission": "Edit mission",
  "Hvad skal klares?": "What needs doing?",
  Mission: "Mission",
  "Fx Red seng": "E.g. Make the bed",
  Ikon: "Icon",
  "Eget ikon": "Own icon",
  Hvem: "Who",
  Dage: "Days",
  "Hvornår på dagen": "When in the day",
  "Klokken (valgfrit)": "Time (optional)",
  Slet: "Delete",
  Annullér: "Cancel",
  Gem: "Save",
  "Vælg mindst én dag": "Pick at least one day",
  "Missionen er oprettet": "The mission is created",
  "Missionen er gemt": "The mission is saved",
  "Slet {name}?": "Delete {name}?",
  "Missionen forsvinder for alle. Point, der allerede er givet, bliver.": "The mission disappears for everyone. Points already given stay.",
  "Missionen er slettet": "The mission is deleted",
  "Ret belønning": "Edit reward",
  "Hvad kan man købe?": "What can be bought?",
  Belønning: "Reward",
  "Fx Vælg aftenens film": "E.g. Pick tonight's film",
  "Pris i point": "Price in points",
  "Belønningen er oprettet": "The reward is created",
  "Belønningen er gemt": "The reward is saved",
  "Giv eller træk point fra {name}": "Give or take points from {name}",
  Hvorfor: "Why",
  "Fx Hjalp med indkøb": "E.g. Helped with the shopping",
  "Brug minus for at trække point fra. {name} har {n} point nu.": "Use minus to take points away. {name} has {n} points now.",
  "Ekstra point": "Extra points",
  "Point trukket fra": "Points taken away",
  "{name} fik {n} point": "{name} got {n} points",
  "{n} point trukket fra {name}": "{n} points taken from {name}",
  "Det kan kun far eller mor": "Only mum or dad can do that",
  "Perfekt dag! {name} har klaret alle missioner": "Perfect day! {name} has done all missions",
  "Købet er godkendt": "The purchase is approved",
  "Købet er afvist": "The purchase is declined",
  "{what} er købt": "{what} is bought",
  "Sendt til far og mor. De skal godkende {what}.": "Sent to mum and dad. They need to approve {what}.",
  "Belønningen forsvinder fra shoppen.": "The reward disappears from the shop.",
  "Belønningen er slettet": "The reward is deleted",
  "Min dag": "My day",
  Opgaver: "Tasks",
  "Når du vil": "Whenever you like",
};

export default { id: "home", views, acts, inputs: {}, css, en };
