/* Hverdagsro – home: the parents' front page with the family band, a person's page, the child's day and shop,
   Opgaver, "who are you?" on a shared tablet and Mine indstillinger. Ported 1:1 from the prototype
   (pHome, familyBand/BANDS, personPage, parentPage, pets, kDay, kShop, pTasks, pMe), with Home Assistant's data. */
import { addDays, esc, slug, startOfDay, uid } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import * as Rooms from "./hv-rooms.js";
import * as Kids from "./hv-kids.js";
import * as House from "./hv-house.js";

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
const INST = [
  ["dagpleje", "Dagpleje", "🧸"],
  ["vuggestue", "Vuggestue", "🍼"],
  ["bornehave", "Børnehave", "🎨"],
  ["skole", "Skole", "🎒"],
];
const MSGS = {
  parent: [["shop", "Børnene køber i shoppen"], ["mission", "En mission er klaret"], ["goal", "Et mål er nået"], ["calendar", "Aftaler flyttet eller aflyst"], ["pickup", "Hvem henter i dag"], ["waste", "Skrald skal stilles ud"]],
  kid: [["points", "Mine point"], ["next", "Næste aftale"], ["school", "Skoledagen slutter"], ["pin", "Besked fra far eller mor"]],
};
const BANDS = [["historier", "Historier"], ["huset", "Huset"], ["spor", "Dagens spor"], ["bobler", "Bobler"], ["live", "Live-linje"], ["kort", "Kort"]];
const SUBJ = { Dansk: "#7C5CF0", Matematik: "#3B6BF5", Engelsk: "#11A39A", "Natur/teknik": "#2E9E55", Idræt: "#F08A3A", Musik: "#E4568C", Billedkunst: "#D99A12", Historie: "#9A6B4A", Kristendom: "#6B7A99", "Klassens tid": "#8A86A0", "Leg og læring": "#E3A21C" };
const DAYS_ISO = ["Hver dag", "Hverdage", "Weekender"];
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>`;
const STAR = svg("pstar");
const DINNER = "17:30";

// ---------------------------------------------------------------- local state
let kidDay = 0;
let bandStyle = (() => {
  try {
    return localStorage.getItem("hverdagsro-band") || "kort";
  } catch (e) {
    return "kort";
  }
})();
let storyT = null;
let storyKey = null;
let liveI = 0;
let liveTimer = null;

// ---------------------------------------------------------------- time helpers
const pad = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const weekday = (d) => (d.getDay() + 6) % 7; // Monday = 0
const hoursOf = (d) => d.getHours() + d.getMinutes() / 60;
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const at = (base, t) => {
  const [h, m] = String(t || "00:00").split(/[:.]/).map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};
const pct = (h) => ((Math.max(6, Math.min(24, h)) - 6) / 18) * 100;
const today0 = () => startOfDay(new Date());
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const DA_SHORT = ["man", "tir", "ons", "tor", "fre", "lør", "søn"];
const shortDay = (ctx, d) => (ctx.lang() === "da" ? DA_SHORT[weekday(d)] : ctx.fmt.short(d).replace(/\.$/, "").toLowerCase());

/* "om 26 min", "nu", "man. 13.00" – the prototype's countdown() */
function countdown(ctx, d) {
  if (!d) return "";
  const days = Math.round((startOfDay(d) - today0()) / 864e5);
  if (days > 0) return `${shortDay(ctx, d)}. ${ctx.fmt.time(d)}`;
  const m = Math.round((d - Date.now()) / 60000);
  if (m <= 0 && m > -20) return ctx.t("nu");
  if (m < 0) return ctx.fmt.time(d);
  return m < 60 ? ctx.t("om {n} min", { n: m }) : ctx.t("om {h} t {m} min", { h: Math.floor(m / 60), m: m % 60 });
}

// ---------------------------------------------------------------- members, presence and pictures
function av(ctx, id, cls = "") {
  if (id === "fam") return `<span class="av ${cls}" style="background:#11A39A" title="${esc(ctx.t("Familien"))}">F</span>`;
  const m = ctx.member(id);
  if (m?.photo) return `<span class="av ${cls}" style="--pc:${esc(m.color)};background:${esc(m.color)}"><img src="${esc(m.photo)}" alt=""></span>`;
  return ctx.avatar(id, cls);
}
const kidsOf = (ctx) => ctx.children();

function battery(ctx, m) {
  const ents = ctx.hass.entities || {};
  const person = m.person && ctx.hass.states[m.person];
  const trackers = [m.device_tracker, ...(person?.attributes?.device_trackers || [])].filter(Boolean);
  const devBattery = (dev) => Object.keys(ents).find((e) => ents[e].device_id === dev && e.startsWith("sensor.") && ctx.hass.states[e]?.attributes?.device_class === "battery");
  const tracker = trackers.find((t) => ents[t]?.device_id && ents[t]?.platform === "mobile_app") || trackers.find((t) => ents[t]?.device_id);
  let id = tracker ? devBattery(ents[tracker].device_id) : null;
  if (!id) {
    // The person is followed by a helper tracker (no device): find the member's phone in the companion app by name.
    const key = slug(m.name).replace(/_/g, "");
    const phones = Object.keys(ents)
      .filter((t) => t.startsWith("device_tracker.") && ents[t].platform === "mobile_app" && ents[t].device_id)
      .filter((t) => `${t} ${ctx.hass.states[t]?.attributes?.friendly_name || ""}`.toLowerCase().replace(/[^a-z0-9æøå]/g, "").includes(key))
      .filter((t) => !/ipad|watch|tablet|mac|book/i.test(t));
    const found = phones.map((t) => devBattery(ents[t].device_id)).filter(Boolean);
    id = found.sort((a, b) => new Date(ctx.hass.states[b]?.last_updated || 0) - new Date(ctx.hass.states[a]?.last_updated || 0))[0] || null;
  }
  const v = id ? Number(ctx.st(id)?.state) : NaN;
  return Number.isFinite(v) ? Math.round(v) : null;
}

/* The prototype's PRES: home, the text, since when, fresh, the phone's battery. A child without a phone follows a parent. */
function pres(ctx, m) {
  const s = m.person && ctx.st(m.person);
  if (s && !["unknown", "unavailable"].includes(s.state)) {
    const home = s.state === "home";
    const since = s.last_changed ? new Date(s.last_changed) : null;
    const zone = home ? ctx.t("Hjemme") : s.state === "not_home" ? ctx.t("Ude") : `${ctx.t("Ude")} · ${ctx.hass.formatEntityState ? ctx.hass.formatEntityState(s) : s.state}`;
    return {
      known: true,
      home,
      txt: zone,
      since: since ? (startOfDay(since).getTime() === today0().getTime() ? ctx.fmt.time(since) : ctx.fmt.rel(since)) : "",
      sinceH: since && startOfDay(since).getTime() === today0().getTime() ? hoursOf(since) : null,
      fresh: since && Date.now() - since < 2 * 3600e3,
      battery: battery(ctx, m),
    };
  }
  const parents = ctx.parents().map((p) => [p, p.person && ctx.hass.states[p.person]]).filter(([, st]) => st);
  const home = parents.find(([, st]) => st.state === "home");
  if (!parents.length) return { known: false, home: null, txt: m.role === "child" ? ctx.t((INST.find((i) => i[0] === m.institution) || [0, "Barn"])[1]) : ctx.t("Forælder") };
  const p = home ? home[0] : parents[0][0];
  return { known: true, home: !!home, txt: `${home ? ctx.t("Hjemme") : ctx.t("Ude")} · ${ctx.t("følger {name}", { name: p.name })}`, since: "", fresh: false, battery: null };
}

function whoName(ctx, id) {
  if (id === "mor") return ctx.t("Mor");
  if (id === "far") return ctx.t("Far");
  return ctx.member(id)?.name || (ctx.data.routines?.helpers || []).find((h) => h.id === id)?.name || id || "";
}

// ---------------------------------------------------------------- missions (the prototype's TASKS)
function missionsFor(ctx, m, date = today0()) {
  const wd = weekday(date);
  const kid = m.role === "child";
  return (ctx.data.missions || [])
    .filter((x) => (x.member === m.id || (kid && x.member === "all")) && (x.days || []).includes(wd))
    .sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
}
function doneSet(ctx, iso) {
  if (iso === ctx.data.today) return ctx.data.done_today || {};
  return (ctx.data.done_week || {})[iso] || {};
}
function daysText(ctx, days) {
  const d = [...(days || [])].sort().join(",");
  if (d === "0,1,2,3,4,5,6") return ctx.t("Hver dag");
  if (d === "0,1,2,3,4") return ctx.t("Hverdage");
  if (d === "5,6") return ctx.t("Weekender");
  const ds = (days || []).map((i) => addDays(today0(), (i - weekday(today0()) + 7) % 7));
  return ds.length === 1 ? cap(ctx.fmt.day(ds[0])) : ds.map((d) => cap(shortDay(ctx, d))).join(", ");
}
function tasksFor(ctx, m, date = today0()) {
  const iso = isoOf(date);
  const done = doneSet(ctx, iso);
  return missionsFor(ctx, m, date).map((x) => ({
    id: x.id,
    who: m.id,
    t: x.title,
    em: x.emoji,
    pts: x.points,
    done: `${x.id}:${m.id}` in done,
    due: x.time ? ctx.fmt.time(at(date, x.time)) : "",
    time: x.time,
    rep: daysText(ctx, x.days),
    extra: (x.days || []).length === 1 && date.getTime() === today0().getTime() ? false : false,
  })).concat(m.role === "child" ? schoolAndRoutines(ctx, m, date, done) : []);
}
/* The routine board and homework show among the child's missions, without points. */
function schoolAndRoutines(ctx, m, date, done) {
  const extra = [...(typeof Kids.routineMissions === "function" ? Kids.routineMissions(ctx, m.id, date) : []), ...(typeof Kids.homeworkFor === "function" ? Kids.homeworkFor(ctx, m.id, date) : [])];
  return extra.map((x) => ({ id: x.id, who: m.id, t: x.t, em: x.em, pts: 0, done: x.kind === "homework" ? `${x.id}:${m.id}` in done : x.done, due: "", time: x.kind === "routine" ? x.time : "", rep: x.sub, kind: x.kind, slot: x.slot }));
}
function streak(ctx, m) {
  const t = today0();
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(t, -i);
    if (d < addDays(t, -weekday(t))) break;
    const L = tasksFor(ctx, m, d);
    if (!L.length) continue;
    const perfect = L.every((x) => x.done);
    if (perfect) n++;
    else if (i > 0) break;
  }
  return n;
}
function rewardsOf(ctx, id) {
  return (ctx.data.rewards || []).filter((r) => r.member === id || r.member === "all").sort((a, b) => a.cost - b.cost);
}
let CTX = null;
function chosenGoal(id) {
  return CTX?.member(id)?.goal || null;
}
/* The prototype's goalOf: the chosen goal, else the cheapest reward not yet afforded. */
function goalOf(ctx, k) {
  const list = rewardsOf(ctx, k.id);
  const pts = ctx.points(k.id);
  const pick = list.find((r) => r.id === (k.goal || chosenGoal(k.id))) || list.find((r) => r.cost > pts) || list[list.length - 1];
  return pick ? { id: pick.id, em: pick.emoji, t: pick.title, cost: pick.cost } : { id: null, em: "🎁", t: ctx.t("Intet mål"), cost: 100 };
}
const pending = (ctx, id) => (ctx.on("shop") ? (ctx.data.requests || []).filter((r) => r.status === "pending" && (!id || r.member === id)) : []);
const rewardById = (ctx, id) => (ctx.data.rewards || []).find((r) => r.id === id);

// ---------------------------------------------------------------- calendar, dinner and pickups
function sharedCalendars(ctx) {
  const own = new Set(ctx.members().map((m) => m.calendar).filter(Boolean));
  return (ctx.data.settings.calendars || []).filter((c) => !own.has(c));
}
function allCalendars(ctx) {
  if (!ctx.on("calendar")) return [];
  return [...new Set([...(ctx.data.settings.calendars || []), ...ctx.members().map((m) => m.calendar)].filter(Boolean))];
}
function events(ctx, days = 2) {
  const cals = allCalendars(ctx);
  if (!cals.length) return [];
  return ctx.events(cals, today0(), addDays(today0(), days));
}
const nameRe = (m) => new RegExp(`\\b${m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i");
/* The members an event is about: the owner of its calendar, or everyone named in the title. */
function eventWho(ctx, e) {
  const owner = ctx.members().find((m) => m.calendar === e.calendar);
  if (owner) return [owner.id];
  const named = ctx.members().filter((m) => nameRe(m).test(e.title)).map((m) => m.id);
  return named.length ? named : sharedCalendars(ctx).includes(e.calendar) ? ["fam"] : [];
}
function eventsOf(ctx, m, days = 7) {
  return events(ctx, days).filter((e) => e.calendar === m.calendar || (sharedCalendars(ctx).includes(e.calendar) && nameRe(m).test(e.title)));
}
const stripName = (m, title) => cap(title.replace(nameRe(m), "").replace(/\s{2,}/g, " ").trim()) || title;
function meals(ctx, days = 3) {
  const id = ctx.data.settings.meals_calendar;
  if (!id || !ctx.on("meals")) return [];
  return ctx.events([id], today0(), addDays(today0(), days));
}
function dinnerOn(ctx, date) {
  const d = startOfDay(date).getTime();
  const e = meals(ctx, 8).find((x) => startOfDay(x.start).getTime() === d);
  if (!e) return null;
  return { title: e.title, at: e.allDay ? at(date, DINNER) : e.start, desc: e.description || "", calendar: e.calendar };
}
/* Hent og bring on a day: [{kid, part: bring|hent, who, at: Date}] */
function pickupsOn(ctx, date) {
  const wd = String(weekday(date) + 1);
  const out = [];
  const kids = typeof Kids.pickupFor === "function" ? ctx.children().map((k) => [k.id, null]) : Object.entries(ctx.data.routines?.pickups || {});
  for (const [kidId, plan] of kids) {
    const kid = ctx.member(kidId);
    const day = typeof Kids.pickupFor === "function" ? Kids.pickupFor(ctx, kidId, date) : plan?.[wd];
    if (!kid || !day) continue;
    for (const part of ["bring", "hent"]) {
      const step = day[part];
      if (step?.who && step.at) out.push({ kid, part, who: step.who, at: at(date, step.at) });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}
function skemaOn(ctx, m, date) {
  if (!m.skema || !ctx.feature(m, "skema")) return [];
  const s = startOfDay(date);
  return ctx.events([m.skema], s, addDays(s, 1)).filter((e) => !e.allDay);
}

/* The prototype's NEXTUP: the next thing for the member, from pickups, school, missions with a time and the calendar. */
function nextUp(ctx, m) {
  const now = Date.now();
  const c = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today0(), i);
    for (const p of pickupsOn(ctx, d)) {
      if (p.who === m.id) c.push({ icon: "pickup", title: `${p.part === "bring" ? ctx.t("Bringer") : ctx.t("Henter")} ${p.kid.name}`, at: p.at });
      if (p.kid.id === m.id && p.part === "bring" && m.institution !== "skole") c.push({ icon: "school", title: ctx.t((INST.find((x) => x[0] === m.institution) || [0, "Institution"])[1]), at: p.at });
    }
    const sk = skemaOn(ctx, m, d);
    if (sk.length) c.push({ icon: "school", title: ctx.t("Skole"), at: sk[0].start });
    if (c.some((x) => x.at > now) && i > 0) break;
  }
  for (const t of tasksFor(ctx, m)) if (t.time && !t.done) c.push({ icon: "tasks", title: t.t, at: at(today0(), t.time) });
  for (const e of eventsOf(ctx, m)) if (!e.allDay) c.push({ icon: m.role === "child" ? "star" : "cal", title: stripName(m, e.title), at: e.start });
  const fut = c.filter((x) => x.at - now > -20 * 60000).sort((a, b) => a.at - b.at);
  return fut[0] || null;
}

/* The prototype's LANES: the day as blocks on a track from 6 to 24, and when the member came home. */
function lanesOf(ctx, m) {
  const pr = pres(ctx, m);
  const blocks = [];
  for (const e of eventsOf(ctx, m, 1)) {
    if (e.allDay || startOfDay(e.start).getTime() !== today0().getTime()) continue;
    blocks.push([hoursOf(e.start), Math.min(24, e.end > addDays(today0(), 1) ? 24 : hoursOf(e.end)), m.color, stripName(m, e.title)]);
  }
  for (const t of tasksFor(ctx, m)) if (t.time) blocks.push([hoursOf(at(today0(), t.time)), hoursOf(at(today0(), t.time)) + 0.25, m.color, t.t]);
  for (const p of pickupsOn(ctx, today0())) if (p.who === m.id) blocks.push([hoursOf(p.at), hoursOf(p.at) + 0.33, m.color, `${p.part === "bring" ? ctx.t("Bringer") : ctx.t("Henter")} ${p.kid.name}`]);
  const dn = dinnerOn(ctx, today0());
  if (dn) blocks.push([hoursOf(dn.at), hoursOf(dn.at) + 0.75, "#6E4AFF", ctx.t("Aftensmad")]);
  blocks.sort((a, b) => a[0] - b[0]);
  return { mark: pr.home && pr.sinceH != null ? [pr.sinceH, ctx.t("Kom hjem kl. {t}", { t: pr.since })] : null, away: !pr.home && pr.sinceH != null ? pr.sinceH : null, blocks };
}
const hm = (ctx, h) => ctx.fmt.time(at(today0(), `${Math.floor(h)}:${Math.round((h % 1) * 60)}`));

// ---------------------------------------------------------------- rows (the prototype's ag, taskRow, approveRow)
function ag(ctx, time, ttl, sub, who, color, cls = "") {
  return `<div class="ag ${cls}"><span class="time">${time}</span><span class="bar" style="background:${color}"></span><div style="min-width:0"><div class="ttl">${esc(ttl)}</div><div class="sub">${esc(sub)}</div></div><div class="who">${who.map((w) => av(ctx, w, "sm")).join("")}</div></div>`;
}
function taskRow(ctx, t) {
  const p = ctx.member(t.who);
  const pts = t.pts && p?.role === "child" && ctx.feature(p, "points");
  return `<div class="task${t.done ? " done" : ""}" data-task="${esc(t.id)}">
    <button class="check" data-act="home-task" data-id="${esc(t.id)}" data-member="${esc(t.who)}" aria-label="${esc(ctx.t("Marker {what} som klaret", { what: t.t }))}" aria-pressed="${!!t.done}" style="${t.done ? `background:${esc(p?.color)}` : ""}">${CHECK}</button>
    <div style="min-width:0"><div class="t-ttl">${esc(t.t)}</div><div class="t-sub">${av(ctx, t.who, "sm")}<span>${esc(p?.name || "")}</span>${t.due ? `<span>${esc(t.due)}</span>` : t.rep ? `<span>${svg("repeat")}${esc(t.rep)}</span>` : ""}</div></div>
    ${pts ? `<span class="t-pts">+${t.pts}${STAR}</span>` : "<span></span>"}
  </div>`;
}
function approveRow(ctx, pq) {
  const k = ctx.member(pq.member);
  const r = rewardById(ctx, pq.reward) || { emoji: "🎁", title: ctx.t("En belønning"), cost: 0 };
  if (!k) return "";
  return `<div class="approve">${av(ctx, k.id)}<div class="t-ttl">${esc(k.name)} ${esc(ctx.t("vil købe"))} <b>${esc(r.emoji)} ${esc(r.title)}</b> ${esc(ctx.t("for {n} point", { n: r.cost }))}<div class="t-sub">${esc(ctx.t("Venter på en forælder · {name} har {n} point", { name: k.name, n: ctx.points(k.id) }))}</div></div><button class="btn sm" data-act="home-approve" data-id="${esc(pq.id)}">${esc(ctx.t("Godkend"))}</button><button class="btn soft sm" data-act="home-reject" data-id="${esc(pq.id)}">${esc(ctx.t("Afvis"))}</button></div>`;
}

// ---------------------------------------------------------------- pets
function petMood(ctx, p) {
  const mine = tasksFor(ctx, p);
  const r = mine.length ? mine.filter((t) => t.done).length / mine.length : 0;
  return r >= 0.99 ? [ctx.t("Superglad"), "happy"] : r >= 0.5 ? [ctx.t("Glad"), "happy"] : r > 0 ? [ctx.t("Okay"), ""] : [ctx.t("Savner dig"), ""];
}
function petSvg(ctx, p) {
  const mood = petMood(ctx, p), col = esc(p.color), kind = p.pet?.kind || "hund";
  const ears =
    kind === "kat"
      ? `<path d="M30 34 26 14 44 28M70 34 74 14 56 28" fill="${col}"/>`
      : kind === "drage"
        ? `<path d="M36 26 32 10 46 24M64 26 68 10 54 24" fill="${col}"/><path d="M14 66c-9-5-10-16-2-21 0 8 6 12 10 14" fill="${col}" opacity=".7"/>`
        : `<ellipse cx="26" cy="38" rx="9" ry="16" fill="${col}" opacity=".8" transform="rotate(20 26 38)"/><ellipse cx="74" cy="38" rx="9" ry="16" fill="${col}" opacity=".8" transform="rotate(-20 74 38)"/>`;
  const mouth = mood[1] ? `<path d="M42 62q8 8 16 0" stroke="#1B1530" stroke-width="3" fill="none" stroke-linecap="round"/>` : `<path d="M43 64h14" stroke="#1B1530" stroke-width="3" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="93" rx="28" ry="5" fill="currentColor" opacity=".12"/><g class="body">${ears}<ellipse cx="50" cy="56" rx="32" ry="30" fill="${col}"/><ellipse cx="50" cy="67" rx="18" ry="13" fill="#fff" opacity=".85"/><circle cx="39" cy="50" r="5" fill="#1B1530"/><circle cx="61" cy="50" r="5" fill="#1B1530"/><circle cx="40.5" cy="48.5" r="1.6" fill="#fff"/><circle cx="62.5" cy="48.5" r="1.6" fill="#fff"/><ellipse cx="50" cy="58" rx="4" ry="3" fill="#1B1530"/>${mouth}<circle cx="31" cy="60" r="4" fill="#FF7A9A" opacity=".5"/><circle cx="69" cy="60" r="4" fill="#FF7A9A" opacity=".5"/></g></svg>`;
}
const hasPet = (ctx, p) => p.role === "child" && !!p.pet && ctx.feature(p, "pet");
function petBlock(ctx, p) {
  if (!p.pet) return `<p class="t-sub">${esc(ctx.t("{name} har ikke et dyr endnu. Vælg et under Familieindstillinger › Børn.", { name: p.name }))}</p>`;
  const mood = petMood(ctx, p);
  const kind = p.pet.kind === "hund" ? ctx.t("Hund") : p.pet.kind === "kat" ? ctx.t("Kat") : ctx.t("Lille drage");
  return `<div class="pet ${mood[1]}">${petSvg(ctx, p)}<div><h3>${esc(p.pet.name)}</h3><div class="t-sub">${esc(kind)}</div><div class="mood" style="color:${esc(p.color)}">${esc(mood[0])}</div><div class="t-sub">${esc(ctx.t("Bliver gladere, når dagens missioner er klaret"))}</div></div></div>`;
}

// ---------------------------------------------------------------- the family band: Kort and the five other styles
const doneFirst = (ctx, id) => tasksFor(ctx, ctx.member(id)).sort((a, b) => (b.done ? 1 : 0) - (a.done ? 1 : 0));
const arcDeg = (cx, cy, r, a0, a1) => {
  const pt = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)].map((v) => v.toFixed(2)).join(" ");
  return `M${pt(a0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(a1)}`;
};
const shortState = (ctx, p) => {
  const pr = pres(ctx, p);
  return pr.home ? ctx.t("Hjemme") : pr.known ? ctx.t("Ude") : "";
};
function nextText(ctx, p) {
  const nx = nextUp(ctx, p);
  return nx ? `${nx.title} ${countdown(ctx, nx.at)}` : ctx.t("Intet planlagt");
}

function familyBandPicker(ctx) {
  return `<div class="band-pick" role="group" aria-label="${esc(ctx.t("Vælg familiebåndet"))}"><span>${esc(ctx.t("Vis som"))}</span>${BANDS.map(([k, n], i) => `<button data-act="home-band" data-id="${k}" aria-pressed="${k === bandStyle}">${i < 5 ? `${i + 1}. ` : ""}${esc(ctx.t(n))}</button>`).join("")}</div>`;
}
function familyBand(ctx) {
  return ({ historier: bandStories, huset: bandHouse, spor: bandLanes, bobler: bandBubbles, live: bandLive, kort: bandCards })[bandStyle]?.(ctx) || bandCards(ctx);
}

/* 1. Historier */
function bandStories(ctx) {
  return `<div class="stories">${ctx
    .members()
    .map((p, i) => {
      const mine = doneFirst(ctx, p.id), n = Math.max(1, mine.length), seg = 360 / n, gap = n > 1 ? 16 : 0;
      const ring = mine.length
        ? mine.map((t, k) => `<path d="${arcDeg(34, 34, 31, k * seg + gap / 2 - 90, (k + 1) * seg - gap / 2 - 90)}" stroke="${t.done ? esc(p.color) : "var(--line)"}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join("")
        : `<circle cx="34" cy="34" r="31" stroke="var(--line)" stroke-width="4" fill="none"/>`;
      const pr = pres(ctx, p);
      return `<button class="story${pr.fresh ? " fresh" : ""}" data-act="home-story" data-id="${esc(p.id)}" style="--pc:${esc(p.color)};animation-delay:${i * 70}ms">
      <span class="sr"><svg viewBox="0 0 68 68" aria-hidden="true">${ring}</svg>${av(ctx, p.id)}${p.role === "child" && ctx.feature(p, "points") ? `<span class="sbadge">${svg("pstar")}${ctx.points(p.id)}</span>` : ""}<span class="sdot ${pr.home ? "in" : "out"}"></span></span>
      <b>${esc(p.name)}</b><small>${esc(shortState(ctx, p))}</small><small class="snext">${esc(nextText(ctx, p))}</small></button>`;
    })
    .join("")}</div>`;
}
function closeStory(ctx) {
  clearTimeout(storyT);
  ctx.root.querySelectorAll(".storyv").forEach((x) => x.remove());
  if (storyKey) ctx.root.removeEventListener("keydown", storyKey, true);
  storyKey = null;
}
function openStory(ctx, id, slide = 0, fresh = true) {
  closeStory(ctx);
  const p = ctx.member(id);
  if (!p) return;
  const pr = pres(ctx, p), mine = tasksFor(ctx, p), done = mine.filter((t) => t.done).length, nx = nextUp(ctx, p), kid = p.role === "child", g = kid ? goalOf(ctx, p) : null;
  const pts = ctx.points(id);
  const slides = [
    `<small>${esc(ctx.t("Lige nu"))}</small><h3>${esc(pr.txt)}</h3><p>${pr.since ? esc((pr.home ? ctx.t("Kom hjem kl. ") : ctx.t("Gik kl. ")) + pr.since) : pr.home ? esc(ctx.t("Hjemme")) : ""}</p>`,
    `<small>${esc(ctx.t("Næste"))}</small><h3>${esc(nx ? nx.title : ctx.t("Intet planlagt"))}</h3><p class="big num">${esc(nx ? countdown(ctx, nx.at) : "")}</p>`,
    kid && ctx.feature(p, "points")
      ? `<small>${esc(ctx.t("Point"))}</small><h3><span class="num">${pts}</span>${svg("pstar")}</h3><p>${ctx.feature(p, "missions") ? `${svg("flame")}${esc(ctx.t("{n} perfekte dage · {d}/{t} missioner", { n: streak(ctx, p), d: done, t: mine.length }))}` : ""}</p>${ctx.feature(p, "shop") ? `<div class="sbar"><i style="width:${Math.min(100, (pts / g.cost) * 100)}%"></i></div><p>${esc(g.em)} ${esc(g.t)} · ${pts}/${g.cost}</p>` : ""}${hasPet(ctx, p) ? `<div class="spet">${petSvg(ctx, p)}</div>` : ""}`
      : kid && ctx.feature(p, "missions")
        ? `<small>${esc(ctx.t("Missioner"))}</small><h3>${esc(ctx.t("{d}/{t} klaret", { d: done, t: mine.length }))}</h3><p>${svg("flame")}${esc(ctx.t("{n} perfekte dage", { n: streak(ctx, p) }))}</p>${hasPet(ctx, p) ? `<div class="spet">${petSvg(ctx, p)}</div>` : ""}`
        : `<small>${esc(ctx.t("Dagen"))}</small><h3>${esc(ctx.t("{d}/{t} opgaver klaret", { d: done, t: mine.length }))}</h3><p>${pr.battery != null ? `${svg("battery")}${pr.battery} % ` : ""}</p>`,
  ];
  const el = document.createElement("div");
  el.className = "storyv" + (fresh ? " first" : "");
  el.style.setProperty("--pc", p.color);
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", ctx.t("{name}s historie", { name: p.name }));
  el.innerHTML = `<div class="sv-in"><div class="sv-bars">${slides.map((_, k) => `<span><i class="${k < slide ? "full" : k === slide ? "run" : ""}"></i></span>`).join("")}</div>
    <div class="sv-head">${av(ctx, id)}<b>${esc(p.name)}</b><button class="sv-x" aria-label="${esc(ctx.t("Luk"))}">${svg("x")}</button></div>
    <div class="sv-body">${slides[slide]}</div><button class="btn sv-go" data-sv-person>${esc(ctx.t("Se {name}s side", { name: p.name }))}</button><span class="sv-hint">${esc(ctx.t("Tryk til højre for næste, til venstre for forrige"))}</span></div>`;
  ctx.root.appendChild(el);
  const people = ctx.members();
  const step = (d) => {
    const ns = slide + d;
    if (ns < 0) return openStory(ctx, id, 0, false);
    if (ns >= slides.length) {
      const k = people.findIndex((x) => x.id === id);
      return k < people.length - 1 ? openStory(ctx, people[k + 1].id, 0, false) : closeStory(ctx);
    }
    openStory(ctx, id, ns, false);
  };
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target.closest(".sv-x")) return closeStory(ctx);
    if (e.target.closest("[data-sv-person]")) {
      closeStory(ctx);
      return ctx.go("person:" + id);
    }
    step(e.clientX < window.innerWidth / 3 ? -1 : 1);
  });
  storyT = setTimeout(() => step(1), 4200);
  storyKey = (e) => {
    if (e.key === "Escape") closeStory(ctx);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  };
  ctx.root.addEventListener("keydown", storyKey, true);
}

/* 2. Huset */
function bandHouse(ctx) {
  const people = ctx.members();
  const home = people.filter((p) => pres(ctx, p).home), away = people.filter((p) => !pres(ctx, p).home);
  const dn = dinnerOn(ctx, today0());
  return `<div class="hb"><div class="hb-house"><span class="hb-smoke" aria-hidden="true"><i></i><i></i><i></i></span><div class="hb-roof" aria-hidden="true"></div>
    <div class="hb-body"><div class="hb-top"><b>${esc(ctx.t("Hjemme {n} af {t}", { n: home.length, t: people.length }))}</b>${dn ? `<span>${svg("food")}${esc(countdown(ctx, dn.at))}</span>` : ""}</div>
    <div class="hb-people">${home.map((p, i) => `<button class="hb-p" data-go="person:${esc(p.id)}" style="animation-delay:${i * 90}ms">${av(ctx, p.id)}<small>${esc(p.name)}</small></button>`).join("")}</div></div></div>
    <div class="hb-out"><div class="hb-road" aria-hidden="true"></div>${away.map((p) => `<button class="hb-walker" data-go="person:${esc(p.id)}">${av(ctx, p.id)}<small>${esc(p.name)}<br>${esc(pres(ctx, p).txt.replace(`${ctx.t("Ude")} · `, ""))}</small></button>`).join("") || `<span class="t-sub">${esc(ctx.t("Alle er hjemme"))}</span>`}</div></div>`;
}

/* 3. Dagens spor */
function bandLanes(ctx) {
  const h = hoursOf(new Date());
  const f = pct(h) / 100;
  return `<div class="lanes card"><div class="lanes-in">
    <div class="lanes-axis">${[6, 9, 12, 15, 18, 21, 24].map((x) => `<span style="left:calc(34px + (100% - 34px) * ${pct(x) / 100})">${pad(x)}</span>`).join("")}</div>
    ${ctx
      .members()
      .map((p, i) => {
        const L = lanesOf(ctx, p);
        return `<button class="lane" data-go="person:${esc(p.id)}" style="--pc:${esc(p.color)}" aria-label="${esc(p.name)}">${av(ctx, p.id, "sm")}<span class="ltrack">${L.away != null ? `<i class="laway" style="left:${pct(L.away)}%;width:${Math.max(0, pct(h) - pct(L.away))}%" title="${esc(ctx.t("Ude"))}"></i>` : ""}${L.blocks.map((b, k) => `<i class="lblk" style="left:${pct(b[0])}%;width:${Math.max(0.8, pct(b[1]) - pct(b[0]))}%;background:${esc(b[2])};animation-delay:${i * 80 + k * 60}ms" title="${esc(b[3])} ${hm(ctx, b[0])}"><span>${esc(b[3])}</span></i>`).join("")}${L.mark ? `<i class="lmark" style="left:${pct(L.mark[0])}%" title="${esc(L.mark[1])}"></i>` : ""}</span></button>`;
      })
      .join("")}
    <span class="lnow" style="left:calc(34px + (100% - 34px) * ${f})"><b>${hm(ctx, h)}</b></span></div></div>`;
}

/* 4. Bobler */
function bandBubbles(ctx) {
  const people = ctx.members();
  const home = people.filter((p) => pres(ctx, p).home), away = people.filter((p) => !pres(ctx, p).home);
  const POS = [[15, 56], [38, 62], [61, 54], [84, 62]];
  const evs = events(ctx, 2);
  const size = (p) => (window.innerWidth < 640 ? 34 : 46) + Math.min(4, tasksFor(ctx, p).filter((t) => !t.done).length + evs.filter((e) => eventWho(ctx, e).includes(p.id)).length) * 5;
  const bub = (p, [x, y], i) => `<button class="bubble" data-go="person:${esc(p.id)}" style="left:${x}%;top:${y}%;--s:${size(p)}px;--pc:${esc(p.color)};animation-duration:${5 + (i % 3)}s;animation-delay:-${i * 0.8}s" title="${esc(p.name)}">${av(ctx, p.id)}${p.role === "child" && ctx.feature(p, "points") ? `<span class="orbit" aria-hidden="true"><span class="sat">${ctx.points(p.id)}</span></span>` : ""}<small>${esc(p.name)}</small></button>`;
  return `<div class="bub"><div class="bub-home"><span class="bub-l">${svg("home")}${esc(ctx.t("Hjemme"))} · ${home.length}</span>${home.map((p, i) => bub(p, POS[i % 4], i)).join("")}</div>
    <div class="bub-away"><span class="bub-l">${svg("walk")}${esc(ctx.t("Ude"))} · ${away.length}</span>${away.map((p, i) => bub(p, [50, 58], i + 4)).join("")}</div></div>`;
}

/* 5. Live-linje */
function bandLive(ctx) {
  const people = ctx.members();
  const homeN = people.filter((p) => pres(ctx, p).home).length;
  const dn = dinnerOn(ctx, today0());
  const items = [{ ic: "home", html: `<b>${esc(ctx.t("{n} af {t}", { n: homeN, t: people.length }))}</b> ${esc(ctx.t("er hjemme"))}${dn ? ` · ${esc(ctx.t("aftensmad"))} ${esc(countdown(ctx, dn.at))}` : ""}` }];
  for (const p of people) {
    const pr = pres(ctx, p);
    const nx = nextUp(ctx, p);
    const pq = pending(ctx, p.id)[0];
    const r = pq && rewardById(ctx, pq.reward);
    let html = `<b>${esc(p.name)}</b> ${esc(pr.txt.toLowerCase())}${pr.since ? ` · ${esc(ctx.t("siden {t}", { t: pr.since }))}` : ""}`;
    if (r) html = `<b>${esc(p.name)}</b> ${esc(ctx.t("vil købe {what} · venter på jer", { what: r.title.toLowerCase() }))}`;
    else if (p.role === "child" && ctx.feature(p, "points")) html = `<b>${esc(p.name)}</b> ${esc(ctx.t("har {p} point og {s} perfekte dage", { p: ctx.points(p.id), s: streak(ctx, p) }))}`;
    if (nx) html += ` · ${esc(nx.title.toLowerCase())} ${esc(countdown(ctx, nx.at))}`;
    items.push({ id: p.id, html });
  }
  liveI = 0;
  return `<div class="live card"><div class="stack">${people.map((p) => `<button class="stk" data-go="person:${esc(p.id)}" title="${esc(p.name)}">${av(ctx, p.id)}<i class="${pres(ctx, p).home ? "in" : "out"}"></i></button>`).join("")}</div>
    <div class="live-win" aria-live="polite"><div class="live-track" id="hh-live-track">${items.map((it) => `<button class="live-it" ${it.id ? `data-go="person:${esc(it.id)}"` : ""}>${it.id ? av(ctx, it.id, "sm") : `<span class="live-ic">${svg(it.ic)}</span>`}<span>${it.html}</span></button>`).join("")}</div></div>
    <span class="live-tag"><i></i>${esc(ctx.t("Live"))}</span></div>`;
}

/* Kort: one long card per person */
function bandCards(ctx) {
  const people = ctx.members();
  const homeN = people.filter((p) => pres(ctx, p).home).length;
  const dn = dinnerOn(ctx, today0());
  const h = hoursOf(new Date());
  let html = `<div class="fband stackv" aria-label="${esc(ctx.t("Familien"))}"><div class="fsum"><span class="lbl">${esc(ctx.t("Hjemme nu"))}</span><b class="num">${homeN}<small>/${people.length}</small></b><div class="dots">${people.map((p) => `<i class="${pres(ctx, p).home ? "in" : ""}" title="${esc(p.name)}"></i>`).join("")}</div>${dn ? `<div class="nx">${esc(ctx.t("Aftensmad sammen"))}<strong>${esc(countdown(ctx, dn.at))}</strong></div>` : ""}</div>`;
  people.forEach((p, i) => {
    const pr = pres(ctx, p), mine = tasksFor(ctx, p), done = mine.filter((t) => t.done).length, f = mine.length ? done / mine.length : 0, C = 2 * Math.PI * 30, nx = nextUp(ctx, p);
    const kid = p.role === "child";
    const facts = kid
      ? `${ctx.feature(p, "points") ? `<span class="fact fpts">${svg("pstar")}<span class="num">${ctx.points(p.id)}</span></span>` : ""}${ctx.feature(p, "missions") ? `<span class="fact flame">${svg("flame")}${streak(ctx, p)}</span><span class="fact">${done}/${mine.length}${ctx.feature(p, "points") ? "" : ` ${esc(ctx.t("klaret"))}`}</span>` : ""}`
      : `<span class="fact">${done}/${mine.length} ${esc(ctx.t("klaret"))}</span>`;
    const bat = pr.battery != null ? `<span class="nbat${pr.battery <= 20 ? " low" : ""}" title="${esc(ctx.t("Telefonens batteri"))}"><span class="bglyph"><i style="width:${pr.battery}%"></i></span>${pr.battery}%</span>` : "";
    const L = lanesOf(ctx, p);
    html += `<button class="pod" data-go="person:${esc(p.id)}" style="--pc:${esc(p.color)};animation-delay:${(i + 1) * 70}ms" aria-label="${esc(p.name)}: ${esc(pr.txt)}">
      <span class="ringav"><svg viewBox="0 0 66 66" aria-hidden="true"><circle cx="33" cy="33" r="30" fill="none" stroke="var(--surface-2)" stroke-width="4"/><circle class="arc" cx="33" cy="33" r="30" fill="none" stroke="${esc(p.color)}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - Math.max(f, 0.03))).toFixed(1)}"/></svg>${av(ctx, p.id)}${pr.known ? `<span class="pres ${pr.home ? "home" : "away"}${pr.fresh ? " fresh" : ""}" title="${esc(pr.txt)}">${svg(pr.home ? "home" : "walk")}</span>` : ""}</span>
      <span class="who"><span class="nm"><span class="nmt">${esc(p.name)}</span>${hasPet(ctx, p) ? `<span class="ipet" aria-hidden="true">${petSvg(ctx, p)}</span>` : ""}${bat}</span><span class="pst">${esc(pr.txt)}${pr.since ? ` · ${esc(ctx.t("siden {t}", { t: pr.since }))}` : ""}</span></span>
      <span class="facts">${facts}</span>
      <span class="rlane" aria-hidden="true"><span class="ltrack">${L.away != null ? `<i class="laway" style="left:${pct(L.away)}%;width:${Math.max(0, pct(h) - pct(L.away))}%"></i>` : ""}${L.blocks.map((b, k) => `<i class="lblk" style="left:${pct(b[0])}%;width:${Math.max(0.8, pct(b[1]) - pct(b[0]))}%;background:${esc(b[2])};animation-delay:${i * 80 + k * 60}ms" title="${esc(b[3])} ${hm(ctx, b[0])}"><span>${esc(b[3])}</span></i>`).join("")}${L.mark ? `<i class="lmark" style="left:${pct(L.mark[0])}%"></i>` : ""}<i class="rnow" style="left:${pct(h)}%"></i></span><span class="rl-ax"><span>06</span><span>12</span><span>18</span><span>24</span></span></span>
      <span class="next">${nx ? `<span class="nl">${svg(nx.icon)}<span>${esc(nx.title)}</span></span><b>${esc(countdown(ctx, nx.at))}</b>` : `<span class="nl"><span>${esc(ctx.t("Intet planlagt"))}</span></span><b>–</b>`}</span>
    </button>`;
  });
  return html + "</div>";
}

// ---------------------------------------------------------------- the parents' home (pHome)
function emptyFamily(ctx) {
  return `<section class="card hv-empty">${svg("users", "ic big")}<h2>${esc(ctx.t("Ingen i familien endnu"))}</h2><p class="t-sub">${esc(ctx.t("Tilføj familien under Familieindstillinger, så kommer forsiden til live."))}</p><button class="btn" data-go="indstillinger:familie">${svg("users")}${esc(ctx.t("Tilføj familien"))}</button></section>`;
}
function pickupLine(ctx) {
  const now = Date.now();
  const list = [0, 1].flatMap((i) => pickupsOn(ctx, addDays(today0(), i))).filter((p) => p.at > now && ctx.member(p.who));
  const p = list.find((x) => x.who === ctx.me?.id && x.part === "hent") || list.find((x) => x.who === ctx.me?.id) || list.find((x) => x.part === "hent") || list[0];
  if (!p) return "";
  const who = ctx.member(p.who);
  const verb = p.part === "bring" ? ctx.t("bringer") : ctx.t("henter");
  const today = startOfDay(p.at).getTime() === today0().getTime();
  const remind = ctx.data.settings.pickup_reminder !== false ? `<div class="t-sub">${esc(ctx.t("Påmindelse til {name} kl. {t}", { name: who.name, t: ctx.fmt.time(new Date(+p.at - 30 * 60000)) }))}</div>` : "";
  return `<div class="pickup">${svg("pickup")}<div style="flex:1;min-width:0"><b>${esc(`${who.name} ${verb} ${p.kid.name}${today ? "" : ` ${ctx.t("i morgen")}`} ${ctx.t("kl.")} ${ctx.fmt.time(p.at)}`)}</b>${remind}</div></div>`;
}
function pHome(ctx) {
  if (!ctx.members().length) return emptyFamily(ctx);
  const kids = kidsOf(ctx);
  const t0 = today0(), t1 = addDays(t0, 1);
  const evs = events(ctx, 2).filter((e) => !e.allDay || e.start < addDays(t0, 2));
  const dayRows = (d) => {
    const rows = evs
      .filter((e) => startOfDay(e.start).getTime() === d.getTime() || (e.allDay && e.start <= d && e.end > d))
      .map((e) => {
        const who = eventWho(ctx, e);
        const owner = ctx.member(who[0]);
        const cal = ctx.hass.states[e.calendar]?.attributes?.friendly_name || "";
        return { s: e.allDay ? "" : hhmm(e.start), html: ag(ctx, e.allDay ? ctx.t("Hele dagen") : ctx.fmt.time(e.start), e.title, [e.location, cal].filter(Boolean).join(" · "), who, owner?.color || "#11A39A") };
      });
    const dn = dinnerOn(ctx, d);
    if (dn) rows.push({ s: hhmm(dn.at), html: ag(ctx, ctx.fmt.time(dn.at), d.getTime() === t0.getTime() ? ctx.t("Aftensmad") : dn.title, d.getTime() === t0.getTime() ? dn.title : ctx.hass.states[dn.calendar]?.attributes?.friendly_name || ctx.t("Madplan"), ["fam"], "#6E4AFF") });
    return rows.sort((a, b) => a.s.localeCompare(b.s)).map((r) => r.html).join("");
  };
  const cards = [];
  const pend = pending(ctx);
  if (pend.length) cards.push(`<section class="card s12"><div class="tasks">${pend.map((r) => approveRow(ctx, r)).join("")}</div></section>`);
  const span = `${cap(shortDay(ctx, t0))} ${t0.getDate()}. – ${shortDay(ctx, t1)} ${ctx.fmt.date(t1, { day: "numeric", month: "short" })}`;
  cards.push(`<section class="card s12">
      <div class="card-head"><h2>${esc(ctx.t("I dag og i morgen"))}</h2><span class="meta">${esc(span)}</span></div>
      <div class="agenda">
        <div class="day-split">${esc(ctx.t("I dag"))}</div>${dayRows(t0) || `<div class="t-sub">${esc(ctx.t("Ingen aftaler i dag"))}</div>`}
        <div class="day-split">${esc(ctx.t("I morgen, {day}", { day: ctx.fmt.day(t1) }))}</div>${dayRows(t1) || `<div class="t-sub">${esc(ctx.t("Ingen aftaler i morgen"))}</div>`}
      </div>${pickupLine(ctx)}
    </section>`);
  const goals = ctx.on("points") && ctx.on("shop") && kids.some((k) => ctx.feature(k, "shop"));
  if (ctx.on("meals") && ctx.data.settings.meals_calendar) {
    const dn = dinnerOn(ctx, t0);
    const later = [1, 2].map((i) => [addDays(t0, i), dinnerOn(ctx, addDays(t0, i))]).filter(([, x]) => x);
    const from = dn ? ctx.hass.states[dn.calendar]?.attributes?.friendly_name || "" : "";
    const mins = dn?.desc.match(/(\d+)\s*min/i)?.[1];
    cards.push(`<section class="card ${goals ? "s6" : "s12"}">
      <div class="card-head"><h2>${esc(ctx.t("Aftensmad"))}</h2><button class="btn soft sm" data-go="madplan">${esc(ctx.t("Madplan"))}</button></div>
      <div class="dinner"><div class="plate">${svg("food")}</div><div style="min-width:0"><div class="eyebrow">${esc(ctx.t("I aften"))}${mins ? ` · ${esc(mins)} min` : ""}</div><h3>${esc(dn?.title || ctx.t("Ikke planlagt endnu"))}</h3>${from ? `<div class="t-sub">${esc(ctx.t("Fra {name}", { name: from }))}</div>` : ""}</div></div>
      ${later.length ? `<div class="minis">${later.map(([d, x], i) => `<div class="mini"><span>${esc(i === 0 ? ctx.t("I morgen") : cap(ctx.fmt.day(d)))}</span><span>${esc(x.title)}</span></div>`).join("")}</div>` : ""}
    </section>`);
  }
  if (goals) {
    const lid = (ctx.data.settings.todo || [])[0];
    const items = lid && ctx.on("lists") ? ctx.load("todo:" + lid, () => ctx.hass.callWS({ type: "todo/item/list", entity_id: lid }).then((r) => r.items || []), 30000) : null;
    const lname = lid ? ctx.name(lid) : "";
    cards.push(`<section class="card ${ctx.on("meals") && ctx.data.settings.meals_calendar ? "s6" : "s12"}">
      <div class="card-head"><h2>${esc(ctx.t("Børnenes mål"))}</h2><button class="btn soft sm" data-act="home-quick">${svg("plus")}${esc(ctx.t("Hurtig opret"))}</button></div>
      <div class="tasks">${kids
        .filter((k) => ctx.feature(k, "shop"))
        .map((k) => {
          const r = goalOf(ctx, k), pts = ctx.points(k.id);
          return `<button class="task" style="grid-template-columns:auto minmax(0,1fr) auto;border:0;text-align:left" data-go="person:${esc(k.id)}">${av(ctx, k.id)}<div><div class="t-ttl">${esc(r.em)} ${esc(r.t)}</div><div class="progress" style="margin:6px 0 0"><i style="width:${Math.min(100, (pts / r.cost) * 100)}%;background:${esc(k.color)}"></i></div></div><span class="t-pts num">${pts}/${r.cost}</span></button>`;
        })
        .join("")}</div>
      ${lid && ctx.on("lists") ? `<div class="mini" style="margin-top:14px"><span>${esc(ctx.t("Liste"))}</span><span>${items ? `${esc(lname)}: ${esc(ctx.t("{d} af {t} klaret", { d: items.filter((i) => i.status === "completed").length, t: items.length }))} · ` : `${esc(lname)} · `}<a href="#" data-go="lister" style="color:var(--violet);font-weight:700">${esc(ctx.t("åbn"))}</a></span></div>` : ""}
    </section>`);
  }
  const todo = ctx
    .members()
    .flatMap((m) => tasksFor(ctx, m))
    .filter((t) => !t.done)
    .slice(0, 4);
  if (ctx.on("missions"))
    cards.push(`<section class="card s12">
      <div class="card-head"><h2>${esc(ctx.t("Opgaver i dag"))}</h2><button class="btn soft sm" data-go="opgaver">${esc(ctx.t("Alle opgaver"))}</button></div>
      <div class="tasks">${todo.map((t) => taskRow(ctx, t)).join("") || `<div class="t-sub">${esc(ctx.t("Alt er klaret i dag"))}</div>`}</div>
    </section>`);
  return `<div class="homegrid">
  <aside class="home-fam" aria-label="${esc(ctx.t("Familien"))}">${familyBand(ctx)}</aside>
  <div class="grid home-main">${cards.join("")}</div></div>`;
}

// ---------------------------------------------------------------- Opgaver (pTasks)
function bigRing(ctx, k) {
  const r = goalOf(ctx, k), C = 2 * Math.PI * 46, f = Math.min(1, ctx.points(k.id) / r.cost);
  return `<div class="big-ring"><svg viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="46" stroke="var(--surface-2)" stroke-width="9" fill="none"/><circle cx="52" cy="52" r="46" stroke="${esc(k.color)}" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - f)).toFixed(1)}" style="transition:stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)"/></svg>${av(ctx, k.id)}</div>`;
}
function startCard(ctx) {
  const nRec = (ctx.data.missions || []).length;
  const boards = kidsOf(ctx).filter((k) => ctx.feature(k, "board") && Object.values(ctx.data.routines?.boards?.[k.id] || {}).some((l) => l.length)).map((k) => k.name);
  const nHb = Object.values(ctx.data.routines?.pickups || {}).flatMap((p) => Object.values(p || {}).flatMap((d) => [d?.bring, d?.hent])).filter((s) => s?.who && s.who !== "mor").length;
  return `<section class="kig"><div class="kig-t"><span class="eyebrow">${esc(ctx.t("Kom i gang"))}</span><h2 class="h2">${esc(ctx.t("Faste rutiner på 2 minutter"))}</h2></div><div class="kig-row">
    <button class="kig-b" data-go="rutiner:opgaver" style="--kc:#F2B01E"><span class="kig-em">🧺</span><b>${esc(ctx.t("Faste opgaver"))}</b><small>${esc(ctx.t("{n} gentager sig", { n: nRec }))}</small></button>
    <button class="kig-b" data-go="rutiner:hent" style="--kc:#3B6BF5"><span class="kig-em">🚗</span><b>${esc(ctx.t("Hent og bring"))}</b><small>${esc(ctx.t("{n} ture om ugen", { n: nHb }))}</small></button>
    ${ctx.on("board") ? `<button class="kig-b" data-go="rutiner:tavle" style="--kc:#11A39A"><span class="kig-em">🌈</span><b>${esc(ctx.t("Rutinetavle"))}</b><small>${esc(boards.length ? boards.join(` ${ctx.t("og")} `) : ctx.t("Ingen endnu"))}</small></button>` : ""}</div></section>`;
}
function pTasks(ctx) {
  if (!ctx.members().length) return emptyFamily(ctx);
  const kids = kidsOf(ctx);
  const groups = [...kids.filter((k) => ctx.feature(k, "missions")), ...ctx.parents()].map((p) => ({ p, list: tasksFor(ctx, p) })).filter((g) => g.list.length);
  const pend = pending(ctx);
  return `${startCard(ctx)}
  ${pend.length ? `<section class="card" style="margin-bottom:16px"><div class="card-head"><h2>${esc(ctx.t("Godkend køb"))}</h2><span class="lock">${svg("shield")}${esc(ctx.t("Kun forældre"))}</span></div><div class="tasks">${pend.map((r) => approveRow(ctx, r)).join("")}</div></section>` : ""}
  ${ctx.on("points") ? `<div class="kids">${kids
    .filter((k) => ctx.feature(k, "points"))
    .map((k) => {
      const r = goalOf(ctx, k), pts = ctx.points(k.id);
      return `<button class="kid" style="--kc:${esc(k.color)}" data-go="person:${esc(k.id)}">${bigRing(ctx, k)}<div class="score num">${pts}${svg("pstar")}</div>${ctx.feature(k, "missions") ? `<span class="streak">${svg("flame")}${esc(ctx.t("{n} perfekte dage", { n: streak(ctx, k) }))}</span>` : ""}${ctx.feature(k, "shop") ? `<div class="goal">${r.cost - pts > 0 ? ctx.t("{n} point til {what}", { n: r.cost - pts, what: `<b>${esc(r.em)} ${esc(r.t)}</b>` }) : ctx.t("{what} er tjent!", { what: `<b>${esc(r.t)}</b>` })}</div>` : ""}</button>`;
    })
    .join("")}</div>` : ""}
  <div style="display:flex;justify-content:flex-end;margin:16px 0 0"><button class="btn" data-act="home-quick">${svg("plus")}${esc(ctx.t("Hurtig opret"))}</button></div>
  <div class="cols-2" style="margin-top:12px">${groups.map((g) => `<section class="card"><div class="person-head">${av(ctx, g.p.id)}<h3>${esc(g.p.name)}</h3><span class="meta">${esc(ctx.t("{d} af {t} klaret", { d: g.list.filter((t) => t.done).length, t: g.list.length }))}</span></div><div class="tasks">${g.list.map((t) => taskRow(ctx, t)).join("")}</div></section>`).join("") || `<section class="card"><p class="t-sub">${esc(ctx.t("Ingen opgaver i dag. Lav faste opgaver under Faste rutiner."))}</p></section>`}</div>
  <p class="foot">${esc(ctx.t("Missioner og point er to funktioner: børnene kan have missioner uden point. Med point får de dem, så snart de krydser af; et køb i shoppen venter på en forælder. Når alle dagens missioner er klaret, tæller dagen som perfekt."))}</p>`;
}

// ---------------------------------------------------------------- the school schedule (from the skema calendar)
function subjColor(name, fallback) {
  const key = Object.keys(SUBJ).find((k) => String(name).toLowerCase().startsWith(k.toLowerCase()));
  return key ? SUBJ[key] : fallback;
}
/* The prototype's skemaGrid: this week's lessons from the schedule calendar, Monday to Friday. */
function skemaCard(ctx, m) {
  if (typeof Kids.skemaGrid === "function") return Kids.skemaGrid(ctx, m);
  const mon = addDays(today0(), -weekday(today0()) + (weekday(today0()) > 4 ? 7 : 0));
  const evs = ctx.events([m.skema], mon, addDays(mon, 5)).filter((e) => !e.allDay);
  let T0 = 8, T1 = 14;
  evs.forEach((e) => {
    T0 = Math.min(T0, e.start.getHours());
    T1 = Math.max(T1, Math.ceil(hoursOf(e.end)));
  });
  T1 = Math.min(T1, 18);
  const PXH = 60, Hh = (T1 - T0) * PXH;
  const tY = (d) => (hoursOf(d) - T0) * PXH;
  const t0 = today0();
  let h = `<div class="skema-wrap"><div class="skema"><span></span>`;
  for (let i = 0; i < 5; i++) {
    const d = addDays(mon, i), rel = Math.round((d - t0) / 864e5);
    h += `<div class="sk-h${rel === 0 ? " today" : ""}">${esc(cap(shortDay(ctx, d)))}<small>${esc(`${d.getDate()}. ${ctx.fmt.date(d, { month: "short" }).replace(/\.$/, "")}.`)}${rel === 0 ? ` · ${esc(ctx.t("i dag"))}` : rel === 1 ? ` · ${esc(ctx.t("i morgen"))}` : ""}</small></div>`;
  }
  const hours = [];
  for (let x = T0; x <= T1; x++) hours.push(x);
  h += `<div class="sk-times" style="height:${Hh}px">${hours.map((x) => `<span style="top:${(x - T0) * PXH}px">${pad(x)}.00</span>`).join("")}</div>`;
  for (let i = 0; i < 5; i++) {
    const d = addDays(mon, i);
    const day = evs.filter((e) => startOfDay(e.start).getTime() === d.getTime()).sort((a, b) => a.start - b.start);
    h += `<div class="sk-col" style="height:${Hh}px">`;
    day.forEach((e, k) => {
      const n = day[k + 1];
      if (n && n.start - e.end >= 10 * 60000) h += `<div class="sk-break" style="top:${tY(e.end)}px;height:${tY(n.start) - tY(e.end)}px" title="${esc(ctx.t("Frikvarter"))}"></div>`;
    });
    day.forEach((e, li) => {
      const who = [e.location, (e.description || "").split("\n")[0]].filter(Boolean).join(" · ").slice(0, 40);
      const st = ctx.fmt.time(e.start), en = ctx.fmt.time(e.end);
      h += `<div class="sk-l" style="top:${tY(e.start) + 2}px;height:${Math.max(18, tY(e.end) - tY(e.start) - 4)}px;background:${subjColor(e.title, m.color)};animation-delay:${i * 60 + li * 40}ms" title="${esc(`${e.title} ${st}–${en}${who ? ` · ${who}` : ""}`)}"><b>${esc(e.title)}</b><small>${esc(st)}${who ? ` · ${esc(who)}` : ""}</small></div>`;
    });
    h += `</div>`;
  }
  h += `</div></div><div class="sk-legend"><span class="chip"><i style="background:${SUBJ.Dansk}"></i>${esc(ctx.t("Fra {cal}", { cal: ctx.name(m.skema) }))}</span>${evs.length ? "" : `<span class="chip">${esc(ctx.t("Ingen timer i denne uge"))}</span>`}</div>`;
  return h;
}

// ---------------------------------------------------------------- person pages
function bdayField(ctx, m) {
  const input = ctx.isParent ? `<input type="date" data-in="home-bday" data-id="${esc(m.id)}" value="${esc(m.birthday || "")}" aria-label="${esc(ctx.t("Fødselsdag for {name}", { name: m.name }))}">` : "";
  if (!m.birthday) return `<div class="bd-f"><span class="bd-ic">🎂</span><div><b>${esc(ctx.t("Fødselsdag"))}</b><small>${esc(ctx.t("Ikke sat"))}</small></div>${input}</div>`;
  const [y] = m.birthday.split("-").map(Number);
  const d = new Date(`${m.birthday}T12:00:00`);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return `<div class="bd-f"><span class="bd-ic">🎂</span><div><b>${esc(ctx.t("Fødselsdag"))}</b><small>${esc(ctx.fmt.date(d, { day: "numeric", month: "long", year: "numeric" }))} · ${esc(ctx.t("{n} år", { n: age }))}</small></div>${input}</div>`;
}
/* The child's room as the prototype's roomCard (lights, scenes, the drawing); the rooms module owns it. */
function roomBlock(ctx, room) {
  if (typeof Rooms.roomLightsCard === "function") return Rooms.roomLightsCard(ctx, room, "s12");
  if (typeof Rooms.roomCard === "function") return `<div class="s12 hh-room">${Rooms.roomCard(ctx, room)}</div>`;
  return "";
}
function personPage(ctx) {
  const p = ctx.member(ctx.arg) || ctx.members()[0];
  if (!p) return emptyFamily(ctx);
  if (p.role === "parent") return parentPage(ctx, p);
  const id = p.id, r = goalOf(ctx, p), mine = tasksFor(ctx, p), shop = rewardsOf(ctx, id), pend = pending(ctx, id), pts = ctx.points(id);
  let house = null;
  try {
    house = typeof House.houseModel === "function" ? House.houseModel(ctx) : null;
  } catch (e) {
    house = null;
  }
  const rooms = (house || ctx.data.house || {}).rooms || [];
  const room = rooms.find((x) => x.kid === id) || rooms.find((x) => !x.kid && (x.id === id || nameRe(p).test(x.name || "")));
  const pin = ctx.data.pins?.[id];
  const inst = INST.find((i) => i[0] === p.institution);
  const card = (on, cls, body) => (on ? `<section class="card ${cls}">${body}</section>` : "");
  return `
  <button class="back" data-go="hjem">${svg("back")}${esc(ctx.t("Hjem"))}</button>
  <section class="p-hero" style="--pc:${esc(p.color)}">${av(ctx, id)}<div style="position:relative;z-index:1"><h2>${esc(p.name)}</h2><div class="role">${esc([ctx.t("Barn"), p.person ? ctx.t("person i Home Assistant") : ctx.t("profil uden telefon"), p.has_pin ? ctx.t("egen PIN") : ""].filter(Boolean).join(" · "))}</div>
    <div class="stats">${ctx.feature(p, "points") ? `<span>${svg("pstar")}${esc(ctx.t("{n} point", { n: pts }))}</span>` : ""}${ctx.feature(p, "missions") ? `<span>${svg("flame")}${esc(ctx.t("{n} perfekte dage", { n: streak(ctx, p) }))}</span><span>${esc(ctx.t("{d}/{t} missioner i dag", { d: mine.filter((t) => t.done).length, t: mine.length }))}</span>` : ""}</div></div>
    <div class="acts"><button class="btn" data-act="home-photo" data-id="${esc(id)}">${svg("camera")}${esc(p.photo ? ctx.t("Skift billede") : ctx.t("Sæt billede"))}</button><button class="btn" data-act="home-seeas" data-id="${esc(id)}">${svg("user")}${esc(ctx.t("Se som {name}", { name: p.name }))}</button>${ctx.feature(p, "points") ? `<button class="btn" data-act="home-givepts" data-id="${esc(id)}">${STAR}${esc(ctx.t("Giv 5 point"))}</button>` : ""}</div></section>
  <div class="grid" style="margin-top:16px">
    ${ctx.feature(p, "room") && room ? roomBlock(ctx, room) : ""}
    ${pend.length ? `<section class="card s12"><div class="tasks">${pend.map((x) => approveRow(ctx, x)).join("")}</div></section>` : ""}
    ${card(ctx.feature(p, "skema"), hasPet(ctx, p) ? "s8" : "s12", `<div class="card-head"><h2>${esc(ctx.t("Skoleskema"))}</h2><span class="meta">${esc(p.skema ? ctx.t("Uge {n} · fra {cal}", { n: isoWeek(today0()), cal: ctx.name(p.skema) }) : ctx.t("Uge {n}", { n: isoWeek(today0()) }))}</span></div>${p.skema ? skemaCard(ctx, p) : `<p class="t-sub">${esc(ctx.t("Vælg skemaets kalender (fx fra Aula) under Familieindstillinger › Børn."))}</p>`}`)}
    ${card(ctx.feature(p, "pet"), ctx.feature(p, "skema") ? "s4" : "s12", `<div class="card-head"><h2>${esc(ctx.t("Mit dyr"))}</h2><span class="meta">${esc(ctx.t("Slået til"))}</span></div>${petBlock(ctx, p)}<div class="minis">${ctx.feature(p, "shop") ? `<div class="mini"><span>${esc(ctx.t("Mål"))}</span><span>${esc(r.em)} ${esc(r.t)} · ${pts}/${r.cost}</span></div>` : ""}${pin ? `<div class="mini"><span>${esc(ctx.t("Besked"))}</span><span>${esc(pin.text)}</span></div>` : ""}</div>`)}
    ${card(ctx.feature(p, "missions"), ctx.feature(p, "shop") ? "s6" : "s12", `<div class="card-head"><h2>${esc(ctx.t("Missioner"))}</h2><button class="btn soft sm" data-act="home-quick" data-kind="mission" data-member="${esc(id)}">${svg("plus")}${esc(ctx.t("Ny mission"))}</button></div><div class="tasks">${mine.map((t) => taskRow(ctx, t)).join("") || `<div class="t-sub">${esc(ctx.t("Ingen missioner"))}</div>`}</div>`)}
    ${card(ctx.feature(p, "shop"), ctx.feature(p, "missions") ? "s6" : "s12", `<div class="card-head"><h2>${esc(ctx.t("Pointshop"))}</h2><span class="meta">${esc(ctx.t("Forældre sætter priserne"))}</span></div><div class="tasks">${shop.map((w) => `<div class="task" style="grid-template-columns:40px minmax(0,1fr) auto auto"><span style="font-size:26px;text-align:center">${esc(w.emoji)}</span><div><div class="t-ttl">${esc(w.title)}</div><div class="t-sub">${esc(w.id === r.id ? ctx.t("Mål") : w.member === "all" ? ctx.t("Belønning · alle børn") : ctx.t("Belønning"))}</div></div><span class="t-pts">${w.cost}${STAR}</span><button class="iconbtn" data-act="home-delreward" data-id="${esc(w.id)}" aria-label="${esc(ctx.t("Fjern {what}", { what: w.title }))}">${svg("trash")}</button></div>`).join("") || `<div class="t-sub">${esc(ctx.t("Ingen belønninger endnu"))}</div>`}</div><button class="btn soft sm" data-act="home-quick" data-kind="reward" data-member="${esc(id)}" style="margin-top:12px">${svg("plus")}${esc(ctx.t("Ny belønning"))}</button>`)}
    ${(() => {
      // The child's wish lists from Ønskeskyen (chosen under Familieindstillinger › Ønskeskyen).
      const wl = typeof Kids.wishListsFor === "function" ? Kids.wishListsFor(ctx, id) : [];
      if (!ctx.on("wish") || !wl.length) return "";
      return wl.map((l) => (typeof Kids.onskeCard === "function" ? `<div class="s12">${Kids.onskeCard(ctx, l)}</div>` : "")).join("");
    })()}
    <section class="card s12"><div class="card-head"><h2>${esc(ctx.t("Profil"))}</h2><button class="btn soft sm" data-go="indstillinger:born">${svg("shield")}${esc(ctx.t("Moduler og institution"))}</button></div><div class="kprof">${bdayField(ctx, p)}${inst ? `<div class="bd-f"><span class="bd-ic">${inst[2]}</span><div><b>${esc(ctx.t(inst[1]))}</b><small>${esc(p.institution === "skole" ? ctx.t("Skoleskema fra Aula") : ctx.t("Dagens aflevering og afhentning fra Hent og bring"))}</small></div></div>` : ""}</div></section>
  </div>`;
}
function parentPage(ctx, p) {
  const mine = tasksFor(ctx, p);
  const evs = events(ctx, 7).filter((e) => e.start > Date.now() - 3600e3 && (eventWho(ctx, e).includes(p.id) || eventWho(ctx, e).includes("fam")));
  const picks = [0, 1, 2, 3, 4, 5, 6].flatMap((i) => pickupsOn(ctx, addDays(today0(), i))).filter((x) => x.who === p.id && x.part === "hent" && x.at > Date.now());
  const pr = pres(ctx, p);
  const rows = [
    ...evs.map((e) => ({ at: e.start, html: ag(ctx, e.allDay ? ctx.t("Hele dagen") : ctx.fmt.time(e.start), e.title, `${ctx.fmt.day(e.start)} · ${ctx.hass.states[e.calendar]?.attributes?.friendly_name || ""}`, eventWho(ctx, e), ctx.member(eventWho(ctx, e)[0])?.color || "#11A39A") })),
    ...picks.map((x) => ({ at: x.at, html: ag(ctx, ctx.fmt.time(x.at), `${p.name} ${ctx.t("henter")} ${x.kid.name}`, `${ctx.fmt.day(x.at)} · ${ctx.t("Hvem henter")} · ${ctx.t("du henter")}`, [x.kid.id], x.kid.color) })),
  ].sort((a, b) => a.at - b.at);
  const lists = (ctx.data.osky?.lists || []).filter((l) => ["begge", p.id].includes(ctx.data.settings.osky_to?.[l.id]));
  return `
  <button class="back" data-go="hjem">${svg("back")}${esc(ctx.t("Hjem"))}</button>
  <section class="p-hero" style="--pc:${esc(p.color)}">${av(ctx, p.id)}<div style="position:relative;z-index:1"><h2>${esc(p.name)}</h2><div class="role">${esc([p.title, ctx.t("forælder"), ctx.hass.user?.is_admin && ctx.data.me === p.id ? ctx.t("administrator") : ""].filter(Boolean).join(" · "))}</div><div class="stats"><span>${esc(ctx.t("{n} åbne opgaver", { n: mine.filter((t) => !t.done).length }))}</span><span>${esc(ctx.t("{n} aftaler i ugen", { n: rows.length }))}</span><span>${esc(pr.txt)}${pr.since ? ` · ${esc(ctx.t("siden {t}", { t: pr.since }))}` : ""}</span></div></div><div class="acts"><button class="btn" data-act="home-photo" data-id="${esc(p.id)}">${svg("camera")}${esc(p.photo ? ctx.t("Skift billede") : ctx.t("Sæt billede"))}</button></div></section>
  <div class="grid" style="margin-top:16px">
    <section class="card s6"><div class="card-head"><h2>${esc(ctx.t("Opgaver"))}</h2></div><div class="tasks">${mine.map((t) => taskRow(ctx, t)).join("") || `<div class="t-sub">${esc(ctx.t("Ingen opgaver"))}</div>`}</div>
      <div class="card-head" style="margin:20px 0 10px"><h2>${esc(ctx.t("Ugen"))}</h2></div><div class="agenda">${rows.map((r) => r.html).join("") || `<div class="t-sub">${esc(ctx.t("Ingen aftaler"))}</div>`}</div></section>
    <section class="card s6"><div class="card-head"><h2>${esc(ctx.t("Profil"))}</h2></div>${bdayField(ctx, p)}
      <div class="card-head" style="margin:18px 0 8px"><h2>${esc(ctx.t("Ønskesedler"))}</h2></div>${lists.length ? `<div class="sec-list">${lists.map((l) => `<button class="sec-row" data-go="lister:osky-${esc(l.id)}" style="border:0;text-align:left;width:100%"><span class="sec-ic">${svg("gift")}</span><div><b>${esc(l.title)}</b><small>${esc(ctx.t("{n} ønsker · Ønskeskyen", { n: l.count }))}</small></div><span></span></button>`).join("")}</div>` : `<p class="t-sub">${esc(ctx.t("Ingen ønskesedler valgt. Vælg dem under Familieindstillinger › Ønskeskyen."))}</p>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn soft sm" data-go="mig">${svg("gear")}${esc(ctx.t("Mine indstillinger"))}</button><button class="btn soft sm" data-go="indstillinger">${svg("shield")}${esc(ctx.t("Familieindstillinger"))}</button></div>
    </section>
  </div>`;
}

// ---------------------------------------------------------------- the child's day (kDay) and shop (kShop)
function kidSchedule(ctx, m, i) {
  const d = addDays(today0(), i);
  const items = [];
  for (const e of skemaOn(ctx, m, d)) items.push({ s: hhmm(e.start), e: e.end, t: e.title, sub: [ctx.t("Skole"), e.location].filter(Boolean).join(" · "), c: SUBJ[e.title] || SUBJ[e.title.split(/[ ,·]/)[0]] || m.color, school: true });
  for (const e of eventsOf(ctx, m, 8)) if (!e.allDay && startOfDay(e.start).getTime() === d.getTime()) items.push({ s: hhmm(e.start), t: stripName(m, e.title), sub: ctx.hass.states[e.calendar]?.attributes?.friendly_name || "", c: m.color });
  if (m.institution !== "skole")
    for (const p of pickupsOn(ctx, d).filter((x) => x.kid.id === m.id)) {
      const nm = ctx.t((INST.find((x) => x[0] === m.institution) || [0, "institution"])[1]).toLowerCase();
      items.push(p.part === "bring" ? { s: hhmm(p.at), t: ctx.t("Afleveres i {where}", { where: nm }), sub: ctx.t("{name} afleverer", { name: whoName(ctx, p.who) }), c: m.color } : { s: hhmm(p.at), t: ctx.t("Bliver hentet"), sub: ctx.t("{name} henter", { name: whoName(ctx, p.who) }), c: m.color });
    }
  for (const t of tasksFor(ctx, m, d)) if (t.time) items.push({ s: t.time, t: t.t, sub: ctx.t("Mission"), c: m.color });
  const dn = dinnerOn(ctx, d);
  if (dn) items.push({ s: hhmm(dn.at), t: ctx.t("Aftensmad"), sub: dn.title, c: "#6E4AFF" });
  return items.sort((a, b) => a.s.localeCompare(b.s));
}
function readText(ctx, m) {
  const mine = tasksFor(ctx, m).filter((t) => !t.done);
  const pin = ctx.data.pins?.[m.id]?.text;
  return `${ctx.t("Hej {name}.", { name: m.name })} ${ctx.feature(m, "points") ? ctx.t("Du har {n} point.", { n: ctx.points(m.id) }) : ""} ${!ctx.feature(m, "missions") ? "" : mine.length ? ctx.t("Dine missioner er: {list}.", { list: mine.map((t) => t.t).join(", ") }) : ctx.t("Du har klaret alle dine missioner.")} ${pin ? `${pin}.` : ""}`.replace(/\s+/g, " ").trim();
}
function kDay(ctx) {
  const p = ctx.me;
  if (!p) return "";
  const items = kidSchedule(ctx, p, kidDay), mine = tasksFor(ctx, p, addDays(today0(), kidDay)), done = mine.filter((t) => t.done).length;
  const nowS = kidDay === 0 ? hhmm(new Date()) : "00:00";
  const nextI = items.findIndex((x) => x.s >= nowS), cur = kidDay === 0 ? items.filter((x) => x.s < nowS).at(-1) : null, next = items[nextI];
  const lessons = items.filter((x) => x.school);
  const lastLesson = lessons.length ? ctx.fmt.time(lessons.reduce((a, b) => (b.e > a ? b.e : a), lessons[0].e)) : null;
  const pin = ctx.data.pins?.[p.id];
  const from = ctx.parents()[0];
  const canTick = kidDay === 0;
  return `<div style="--kc:${esc(p.color)}">
  ${pin ? `<div class="pin-msg card" style="margin-bottom:14px">${from ? av(ctx, from.id, "sm") : ""}<span class="txt">${esc(pin.text)}</span>${ctx.feature(p, "read") ? `<button class="iconbtn" data-act="home-read" data-txt="${esc(pin.text)}" aria-label="${esc(ctx.t("Læs beskeden op"))}">${svg("speaker")}</button>` : ""}</div>` : ctx.feature(p, "read") ? `<div class="pin-msg card" style="margin-bottom:14px">${svg("speaker")}<span class="txt">${esc(ctx.t("Hør din dag"))}</span><button class="iconbtn" data-act="home-read" aria-label="${esc(ctx.t("Læs dagen op"))}">${svg("speaker")}</button></div>` : ""}
  <div class="days">${[0, 1, 2, 3, 4, 5].map((i) => { const d = addDays(today0(), i); return `<button class="dbtn" data-act="home-kday" data-i="${i}" aria-pressed="${i === kidDay}"><small>${esc(i === 0 ? ctx.t("I dag") : cap(shortDay(ctx, d)))}</small><b>${d.getDate()}</b></button>`; }).join("")}</div>
  <div class="grid" style="margin-top:14px">
    <section class="card ${ctx.feature(p, "missions") || hasPet(ctx, p) ? "s7" : "s12"}">
      <div class="nownext" style="margin-bottom:14px"><div class="nn now"><small>${esc(kidDay === 0 ? ctx.t("Nu") : ctx.t("Først"))}</small><b>${esc(kidDay === 0 ? (cur ? cur.t : ctx.t("Fri")) : items[0]?.t || ctx.t("Fri"))}</b></div><div class="nn"><small>${esc(ctx.t("Næste"))}</small><b>${esc(next ? `${next.t} ${ctx.t("kl.")} ${ctx.fmt.time(at(today0(), next.s))}` : ctx.t("Godnat"))}</b></div></div>
      <div class="agenda">${items.map((x, i) => ag(ctx, ctx.fmt.time(at(today0(), x.s)), x.t, x.sub, [], x.c, kidDay === 0 && x.s < nowS ? "past" : i === nextI && kidDay === 0 ? "next" : "")).join("") || `<div class="t-sub">${esc(ctx.t("Ingen planer"))}</div>`}</div>
      ${lastLesson ? `<div class="approve" style="margin-top:12px;background:color-mix(in srgb,var(--kc) 12%,var(--surface))"><span class="t-ttl">${esc(ctx.t("Skoledagen slutter kl. {t}", { t: lastLesson }))}</span><button class="btn sm" data-act="home-toast" data-msg="${esc(ctx.t("Skoledagen er afsluttet. Godt gået!"))}">${esc(ctx.t("Afslut dagen"))}</button><button class="btn soft sm" data-act="home-sick">${esc(ctx.t("Meld syg"))}</button></div>` : ""}
    </section>
    ${ctx.feature(p, "missions") || hasPet(ctx, p) ? `<section class="card s5">` : ""}${ctx.feature(p, "missions") ? `
      <div class="card-head"><h2>${esc(kidDay === 0 ? ctx.t("Missioner i dag") : ctx.t("Missioner"))}</h2><span class="meta num">${esc(ctx.t("{d}/{t} klaret", { d: done, t: mine.length }))}</span></div>
      <div class="tasks">${mine.map((t) => `<div class="task mission${t.done ? " done" : ""}" data-task="${esc(t.id)}"><button class="check" data-act="home-task" data-id="${esc(t.id)}" data-member="${esc(p.id)}" aria-label="${esc(t.t)}" aria-pressed="${!!t.done}" ${canTick ? "" : "disabled"} style="${t.done ? `background:${esc(p.color)}` : ""}">${CHECK}</button><div style="min-width:0"><div class="t-ttl">${esc(t.t)}</div><div class="t-sub">${esc(ctx.t("Dagens mission"))}${t.due ? ` · ${esc(t.due)}` : ""}</div></div>${ctx.feature(p, "points") && t.pts ? `<span class="t-pts" style="font-size:16px">+${t.pts}${STAR}</span>` : "<span></span>"}</div>`).join("") || `<div class="t-sub">${esc(ctx.t("Ingen missioner"))}</div>`}</div>` : ""}
      ${hasPet(ctx, p) ? `<div style="margin-top:16px">${petBlock(ctx, p)}</div>` : ""}
    ${ctx.feature(p, "missions") || hasPet(ctx, p) ? `</section>` : ""}
  </div></div>`;
}
function kShop(ctx) {
  const p = ctx.isKid ? ctx.me : ctx.member(ctx.arg) || kidsOf(ctx).find((k) => ctx.feature(k, "shop"));
  if (!p) return `<section class="card"><h2>${esc(ctx.t("Ingen børn med shop"))}</h2></section>`;
  if (!ctx.feature(p, "shop")) return `<section class="card"><h2>${esc(ctx.t("Shoppen er slået fra"))}</h2><p class="t-sub">${esc(ctx.t("Far eller mor kan slå den til."))}</p></section>`;
  const r = goalOf(ctx, p), pend = pending(ctx, p.id), pts = ctx.points(p.id);
  const shop = rewardsOf(ctx, p.id).sort((a, b) => (b.id === r.id) - (a.id === r.id));
  const picker = ctx.isParent ? `<div class="filters" style="margin-bottom:14px">${kidsOf(ctx).filter((k) => ctx.feature(k, "shop")).map((k) => `<button class="fchip" data-go="shop:${esc(k.id)}" aria-pressed="${k.id === p.id}" style="--fc:${esc(k.color)}">${av(ctx, k.id)}${esc(k.name)}</button>`).join("")}</div>` : "";
  return `${picker}<div class="goal-card"><span class="em">${esc(r.em)}</span><div style="flex:1;min-width:180px"><div class="eyebrow" style="color:rgba(255,255,255,.8)">${esc(ctx.isKid ? ctx.t("Mit mål") : ctx.t("{name}s mål", { name: p.name }))}</div><h3>${esc(r.t)}</h3><div class="bar"><i style="width:${Math.min(100, (pts / r.cost) * 100)}%"></i></div><div style="margin-top:6px;font-weight:700" class="num">${esc(ctx.t("{p} af {c} point", { p: pts, c: r.cost }))}</div></div></div>
  ${pend.length ? `<div class="approve" style="margin-top:14px">${svg("lock")}<span class="t-ttl">${esc(ctx.t("{what} venter på, at far eller mor godkender", { what: pend.map((x) => rewardById(ctx, x.reward)?.title || "").join(", ") }))}</span>${ctx.isParent ? pend.map((x) => `<button class="btn sm" data-act="home-approve" data-id="${esc(x.id)}">${esc(ctx.t("Godkend"))}</button>`).join("") : ""}</div>` : ""}
  <h2 class="h2" style="margin:22px 0 12px">${esc(ctx.isKid ? ctx.t("Min pointshop") : ctx.t("{name}s pointshop", { name: p.name }))}</h2>
  <div class="shop">${shop
    .map((w, i) => {
      const waiting = pend.some((x) => x.reward === w.id);
      return `<div class="ware" style="animation:pop .45s ${i * 60}ms both">${w.id === r.id ? `<span class="tag">${esc(ctx.t("Mål"))}</span>` : ""}<span class="em">${esc(w.emoji)}</span><b>${esc(w.title)}</b><span class="price">${w.cost}${STAR}</span>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px"><button class="btn sm" data-act="home-buy" data-id="${esc(w.id)}" data-member="${esc(p.id)}" ${pts < w.cost || waiting ? "disabled" : ""}>${esc(waiting ? ctx.t("Venter") : pts < w.cost ? ctx.t("Mangler {n}", { n: w.cost - pts }) : ctx.isKid ? ctx.t("Køb") : ctx.t("Køb for {name}", { name: p.name }))}</button>${w.id !== r.id ? `<button class="btn soft sm" data-act="home-setgoal" data-id="${esc(w.id)}" data-member="${esc(p.id)}">${esc(ctx.t("Gør til mål"))}</button>` : ""}</div></div>`;
    })
    .join("") || `<p class="t-sub">${esc(ctx.t("Der er ingen belønninger endnu."))}</p>`}</div>
  <p class="foot">${esc(ctx.t("Pointene trækkes først, når far eller mor har godkendt købet."))}</p>`;
}

// ---------------------------------------------------------------- Mine indstillinger (pMe)
const condText = (ctx, c) =>
  !c || c.kind === "always" ? ctx.t("Altid") : `${c.kind === "entity" ? ctx.t("Når {e} er tændt · ", { e: String(c.entity || "").replace("binary_sensor.", "") }) : ""}${ctx.t("kl.")} ${pad(c.from)}–${pad(c.to)}`;
function myQuick(ctx, m) {
  const order = m.quick_order || [];
  const mine = (ctx.data.quick || []).filter((q) => (q.who || []).includes(m.id));
  return mine.sort((a, b) => {
    const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
    return (ia < 0 ? 999 + mine.indexOf(a) : ia) - (ib < 0 ? 999 + mine.indexOf(b) : ib);
  });
}
function meRow(ctx, m, q, i, n) {
  const hidden = (m.quick_hide || []).includes(q.id);
  return `<div class="qar me-r${hidden ? " off" : ""}" style="--qc:${esc(q.color)}"><span class="qa-ic sm">${svg(q.icon)}</span><div class="qar-t"><b>${esc(q.label)}</b><small>${esc(q.entity)}</small><span class="cond${!q.cond || q.cond.kind === "always" ? "" : " timed"}">${svg(!q.cond || q.cond.kind === "always" ? "check" : "clock")}${esc(condText(ctx, q.cond))}</span></div>
    <span class="ord">${i >= 0 ? `<button class="iconbtn" data-act="home-qaup" data-id="${esc(q.id)}" aria-label="${esc(ctx.t("Flyt op"))}" ${i === 0 ? "disabled" : ""}>${svg("up")}</button><button class="iconbtn" data-act="home-qadown" data-id="${esc(q.id)}" aria-label="${esc(ctx.t("Flyt ned"))}" ${i === n - 1 ? "disabled" : ""}>${svg("down")}</button>` : ""}</span>
    <button class="toggle" data-act="home-qahide" data-id="${esc(q.id)}" aria-pressed="${!hidden}" aria-label="${esc(ctx.t("Vis {what} i min +-menu", { what: q.label }))}" style="--tc:${esc(q.color)}"></button></div>`;
}
function skinPicker(ctx, m) {
  const skin = m.skin || "standard", mode = m.mode || "auto";
  return `<section class="card s12"><div class="card-head"><h2>${esc(ctx.t("Tema"))}</h2><span class="meta">${esc(ctx.t("Kun for {name}", { name: m.name }))}</span></div>
    <div class="sk-grid">${SKINS.map(([k, n, acc, bg]) => `<button class="sk" data-act="home-skin" data-id="${k}" aria-pressed="${skin === k}" style="--sa:${acc};--sb:${bg}"><span class="sk-prev"><i class="sk-sky"></i><i class="sk-card"></i><i class="sk-btn"></i><i class="sk-chip"></i></span><b>${esc(ctx.t(n))}</b></button>`).join("")}</div>
    <div class="seg" style="margin-top:14px;max-width:360px">${[["auto", "Automatisk"], ["light", "Lyst"], ["dark", "Mørkt"]].map(([k, n]) => `<button data-act="home-skinmode" data-id="${k}" aria-pressed="${mode === k}" ${skin === "rummet" ? "disabled" : ""}>${esc(ctx.t(n))}</button>`).join("")}</div></section>`;
}
function pMe(ctx) {
  const p = ctx.me;
  if (!p) return `<section class="card hv-empty">${svg("user", "ic big")}<h2>${esc(ctx.t("Du er ikke med i familien"))}</h2><p class="t-sub">${esc(ctx.t("Tilføj dig selv under Familieindstillinger for at vælge dit eget tema."))}</p>${ctx.isParent ? `<button class="btn" data-go="indstillinger:familie">${esc(ctx.t("Familieindstillinger"))}</button>` : ""}</section>`;
  const kid = p.role === "child";
  const mine = myQuick(ctx, p);
  const msgs = kid ? MSGS.kid : MSGS.parent;
  const off = p.msg_off || [];
  const alarmRow = ctx.on("alarm") && ctx.data.settings.alarm && (!kid || ctx.data.settings.alarm_rights?.kids_arm !== false || ctx.data.settings.alarm_rights?.kids_disarm);
  return `<section class="me-hero" style="--pc:${esc(p.color)}">${av(ctx, p.id)}<div><h2>${esc(p.name)}</h2><small>${esc(kid ? ctx.t("Barn") : `${p.title ? `${p.title} · ` : ""}${ctx.t("forælder")}`)}${esc(p.person ? ` · ${ctx.t("person i Home Assistant")}` : ` · ${ctx.t("profil")}`)}</small></div><button class="btn soft sm" data-act="home-photo" data-id="${esc(p.id)}">${svg("camera")}${esc(p.photo ? ctx.t("Skift billede") : ctx.t("Sæt billede"))}</button></section>
  <div class="grid" style="margin-top:16px">
  <section class="card s7"${kid ? " inert" : ""}><div class="card-head"><h2>${esc(ctx.t("Min +-menu"))}</h2><span class="meta">${kid ? `${svg("lock")}${esc(ctx.t("Far eller mor bestemmer"))}` : esc(ctx.t("Kun for {name}", { name: p.name }))}</span></div>
    <p class="t-sub" style="margin:-6px 0 12px">${esc(ctx.t("Vælg, hvilke knapper der står i din +-menu, og i hvilken rækkefølge."))}${kid ? "" : ` ${esc(ctx.t("Nye knapper og hvem der må bruge dem, styres i familieindstillingerne."))}`}</p>
    <div class="qal">${alarmRow ? meRow(ctx, p, { id: "alarm", label: ctx.t("Alarm"), icon: "shieldf", color: "#D9473B", entity: ctx.data.settings.alarm, cond: { kind: "always" } }, -1, 0) : ""}${ctx.on("quick") ? mine.map((q, i) => meRow(ctx, p, q, i, mine.length)).join("") : ""}</div>
    ${!mine.length ? `<p class="t-sub">${esc(ctx.t("Der er ingen knapper til dig endnu."))}${kid ? ` ${esc(ctx.t("Bed far eller mor om at give dig nogle."))}` : ""}</p>` : ""}
    ${kid ? "" : `<button class="btn soft sm" data-go="indstillinger:qa" style="margin-top:12px">${svg("shield")}${esc(ctx.t("Familieindstillinger"))}</button>`}</section>
  <section class="card s5"><div class="card-head"><h2>${esc(ctx.t("Beskeder til mig"))}</h2>${kid ? `<span class="meta">${svg("lock")}${esc(ctx.t("Far eller mor bestemmer"))}</span>` : ""}</div><div${kid && !ctx.data.can_manage ? ' inert class="kid-lock"' : ""}>
    ${p.notify ? "" : `<p class="t-sub" style="margin:-4px 0 10px">${esc(ctx.t("Vælg din telefon under Familieindstillinger › Familien for at få beskeder."))}</p>`}
    <div class="mods" style="grid-template-columns:minmax(0,1fr) 64px">${msgs.map(([k, t]) => `<span>${esc(ctx.t(t))}</span><button class="toggle" data-act="home-msg" data-id="${k}" aria-pressed="${!off.includes(k)}" aria-label="${esc(ctx.t(t))}"></button>`).join("")}</div>
    ${kid ? `<div class="card-head" style="margin:18px 0 8px"><h2>${esc(ctx.t("Min PIN"))}</h2></div><p class="t-sub">${svg("lock")} ${esc(ctx.t("Din PIN skiftes af far eller mor."))}</p>` : ""}</div>
    <button class="btn soft" data-act="home-who" style="margin-top:16px">${svg("users")}${esc(ctx.t("Skift bruger"))}</button></section>${skinPicker(ctx, p)}${homeScreenCard(ctx)}</div>`;
}

/* Hverdagsro as its own icon on the phone's home screen. */
let installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvt = e;
});
function homeScreenCard(ctx) {
  const ua = navigator.userAgent || "", base = ctx.config?.static_url || "";
  const haApp = /Home Assistant\//i.test(ua), ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), android = /Android/i.test(ua);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone;
  const steps = haApp
    ? [ctx.t("Hjemmeskærmen kan ikke få et ikon fra Home Assistant-appen."), ctx.t("Åbn jeres Home Assistant i {browser} (samme adresse som i appen), og gå til Hverdagsro.", { browser: ios ? "Safari" : "Chrome" }), ctx.t("Følg så trinene herunder.")]
    : ios
      ? [ctx.t("Tryk på Del-knappen nederst i Safari."), ctx.t("Vælg »Føj til hjemmeskærm«."), ctx.t("Tryk »Tilføj«. Ikonet åbner Hverdagsro direkte.")]
      : android
        ? [ctx.t("Tryk på ⋮ øverst i Chrome."), ctx.t("Vælg »Føj til startskærm« eller »Installer app«."), ctx.t("Ikonet åbner Hverdagsro direkte.")]
        : [ctx.t("I Chrome eller Edge: klik på installér-ikonet i adresselinjen, eller ⋮ › »Gem og del« › »Installer side som app«."), ctx.t("I Safari på Mac: Arkiv › »Føj til Dock«.")];
  return `<section class="card s12 hs-card"><div class="hs-row">${base ? `<img class="hs-icon" src="${esc(base)}/icons/icon-192.png" alt="" width="64" height="64">` : ""}<div><h2>${esc(ctx.t("Hverdagsro på hjemmeskærmen"))}</h2><p class="t-sub">${esc(standalone ? ctx.t("Hverdagsro er åbnet fra hjemmeskærmen.") : ctx.t("Få Hverdagsro som sit eget ikon, der åbner lige ind i familiens hverdag."))}</p></div>
    ${installEvt && !haApp ? `<button class="btn" data-act="home-install">${svg("plus")}${esc(ctx.t("Installér"))}</button>` : ""}</div>
    ${standalone ? "" : `<ol class="hs-steps">${steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`}</section>`;
}

// ---------------------------------------------------------------- who are you (shared tablet) and PIN
function whoView(ctx) {
  const kids = kidsOf(ctx);
  return `<section class="hv-who"><span class="eyebrow">${esc(ctx.data.settings.home_name || ctx.t("Hverdagsro"))}</span><h1 class="h2" style="font-size:32px;margin:6px 0 0">${esc(ctx.t("Hvem er du?"))}</h1><p class="t-sub" style="justify-content:center">${esc(ctx.t("Tryk på dig selv. Har du en PIN, skal du skrive den."))}</p>
    <div class="who-grid">${kids.map((k, i) => `<button data-act="home-pick" data-id="${esc(k.id)}" style="animation:pop .45s ${i * 70}ms both">${av(ctx, k.id)}<span>${esc(k.name)}</span></button>`).join("")}</div></section>`;
}
function pinSheet(ctx, id, then) {
  const p = ctx.member(id);
  let code = "";
  const s = ctx.sheet(`<div style="text-align:center">${av(ctx, id, "pin-av")}<h2 style="margin-top:10px">${esc(ctx.t("Hej {name}", { name: p.name }))}</h2><div class="t-sub" style="justify-content:center">${esc(ctx.t("Skriv din PIN."))}</div></div>
    <div class="pin-dots" id="hh-pd">${"<i></i>".repeat(4)}</div><div class="pinpad" id="hh-pp">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((n) => (n === "" ? "<span></span>" : `<button data-n="${n}" aria-label="${n === "⌫" ? esc(ctx.t("Slet")) : n}">${n}</button>`)).join("")}</div>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button></div>`);
  const dots = s.el.querySelector("#hh-pd");
  s.el.querySelector("#hh-pp").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-n]");
    if (!b) return;
    const n = b.dataset.n;
    code = n === "⌫" ? code.slice(0, -1) : (code + n).slice(0, 6);
    dots.querySelectorAll("i").forEach((d, i) => d.classList.toggle("on", i < code.length));
    if (code.length < 4) return;
    let ok = false;
    try {
      ok = (await ctx.ws("pin", { member: id, pin: code }))?.ok;
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
    if (ok) {
      s.close();
      then();
    } else if (code.length >= 4) {
      dots.classList.remove("shake");
      void dots.offsetWidth;
      dots.classList.add("shake");
      code = "";
      setTimeout(() => dots.querySelectorAll("i").forEach((d) => d.classList.remove("on")), 300);
    }
  });
}
function whoSheet(ctx) {
  const people = ctx.data.can_manage ? ctx.members() : kidsOf(ctx);
  const s = ctx.sheet(`<h2>${esc(ctx.t("Hvem bruger Hverdagsro?"))}</h2><div class="t-sub">${esc(ctx.t("Forældre ser alt. Børn ser deres egen dag og bruger deres PIN."))}</div>
    <div class="who-list">${people.map((p) => `<button data-who="${esc(p.id)}" aria-current="${p.id === ctx.me?.id}">${av(ctx, p.id)}<span>${esc(p.name)}<small>${esc(p.role === "parent" ? `${p.title ? `${p.title} · ` : ""}${ctx.t("forælder")}` : `${ctx.t("Barn")}${p.has_pin ? " · PIN" : ""}`)}</small></span></button>`).join("")}</div>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
  s.el.querySelector(".who-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-who]");
    if (!b) return;
    const id = b.dataset.who;
    s.close();
    if (id === ctx.me?.id) return;
    const real = ctx.data.me === id;
    const go = () => ctx.panel.viewAs(real ? null : id);
    if (ctx.member(id)?.role === "child" && ctx.member(id)?.has_pin && !ctx.data.can_manage) pinSheet(ctx, id, go);
    else go();
  });
}

// ---------------------------------------------------------------- quick create (Hurtig opret)
function quickCreate(ctx, only = null, member = null) {
  if (only) return itemForm(ctx, only, member);
  const s = ctx.sheet(`<h2>${esc(ctx.t("Hurtig opret"))}</h2><div class="qc">
    ${ctx.on("missions") ? `<button data-q="mission">${svg("tasks")}${esc(ctx.t("Mission"))}<small>${esc(ctx.t("En opgave til et barn"))}${ctx.on("points") ? esc(ctx.t(", evt. med point")) : ""}</small></button>` : ""}${ctx.on("shop") ? `<button data-q="reward">${svg("gift")}${esc(ctx.t("Belønning"))}<small>${esc(ctx.t("En vare i pointshoppen"))}</small></button>` : ""}
    ${ctx.on("calendar") ? `<button data-q="event">${svg("cal")}${esc(ctx.t("Aftale"))}<small>${esc(ctx.t("Med »hvem henter«"))}</small></button>` : ""}${ctx.on("lists") ? `<button data-q="list">${svg("lists")}${esc(ctx.t("Liste"))}<small>${esc(ctx.t("Liste, fast liste eller ønskeseddel"))}</small></button>` : ""}</div>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
  s.el.querySelector(".qc").addEventListener("click", (e) => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    s.close();
    const q = b.dataset.q;
    if (q === "mission" || q === "reward") return itemForm(ctx, q);
    if (q === "event") return ctx.acts["lists-newev"] ? ctx.acts["lists-newev"](document.createElement("button"), null, ctx) : ctx.go("kalender");
    ctx.go("lister");
  });
}
function uniqueId(base, list) {
  let id = (base || "").replace(/^[^a-z0-9]+/, "").slice(0, 40) || uid("m");
  if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(id)) id = uid("m");
  let out = id, n = 2;
  while (list.some((x) => x.id === out)) out = `${id.slice(0, 44)}-${n++}`;
  return out;
}
function itemForm(ctx, kind, member = null) {
  const kids = kidsOf(ctx), m = kind === "mission";
  const owners = m ? [...kids.filter((k) => ctx.feature(k, "missions")), ...ctx.parents()] : [...kids.filter((k) => ctx.feature(k, "shop"))];
  const s = ctx.sheet(`<h2>${esc(m ? ctx.t("Ny mission") : ctx.t("Ny belønning"))}</h2><form id="hh-qf"><div class="field"><label for="hh-qf-t">${esc(m ? ctx.t("Hvad skal gøres") : ctx.t("Belønning"))}</label><input id="hh-qf-t" required maxlength="${m ? 80 : 60}" placeholder="${esc(m ? ctx.t("Fx Pak skoletasken") : ctx.t("Fx Biograftur"))}"></div>
    <div class="row"><div class="field"><label for="hh-qf-k">${esc(m ? ctx.t("Hvem") : ctx.t("Barn"))}</label><select id="hh-qf-k">${owners.map((k) => `<option value="${esc(k.id)}" ${k.id === member ? "selected" : ""}>${esc(k.name)}</option>`).join("")}<option value="all">${esc(ctx.t("Alle børn"))}</option></select></div>${!m || ctx.on("points") ? `<div class="field"><label for="hh-qf-p">${esc(m ? ctx.t("Point") : ctx.t("Pris i point"))}</label><input id="hh-qf-p" type="number" min="${m ? 0 : 1}" value="${m ? 5 : 50}"></div>` : ""}</div>
    ${m ? `<div class="row"><div class="field"><label for="hh-qf-r">${esc(ctx.t("Gentag"))}</label><select id="hh-qf-r"><option value="once">${esc(ctx.t("Én gang (ekstra)"))}</option><option value="day" selected>${esc(ctx.t("Hver dag"))}</option><option value="evening">${esc(ctx.t("Hver aften"))}</option><option value="week">${esc(ctx.t("Hver uge"))}</option></select></div><div class="field"><label for="hh-qf-tm">${esc(ctx.t("Tidspunkt"))}</label><input id="hh-qf-tm" type="time"></div></div>` : `<div class="field"><label for="hh-qf-e">${esc(ctx.t("Ikon"))}</label><input id="hh-qf-e" value="🎁" maxlength="4"></div>`}
    <div class="sheet-actions"><button type="button" class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" type="submit">${esc(ctx.t("Opret"))}</button></div></form>`);
  if (member) s.el.querySelector("#hh-qf-k").value = member;
  setTimeout(() => s.el.querySelector("#hh-qf-t").focus(), 50);
  s.el.querySelector("#hh-qf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = s.el.querySelector("#hh-qf-t").value.trim();
    if (!t) return;
    const who = s.el.querySelector("#hh-qf-k").value;
    const pf = s.el.querySelector("#hh-qf-p");
    const pts = pf ? Math.max(m ? 0 : 1, parseInt(pf.value, 10) || 0) : 0;
    const owner = ctx.member(who);
    if (m) {
      const rep = s.el.querySelector("#hh-qf-r").value;
      const days = rep === "week" || rep === "once" ? [weekday(today0())] : [0, 1, 2, 3, 4, 5, 6];
      const time = s.el.querySelector("#hh-qf-tm").value || null;
      const list = [...(ctx.data.missions || [])];
      list.push({ id: uniqueId(slug(t).replace(/_/g, "-"), list), title: t, member: who, points: owner?.role === "parent" ? 0 : pts, days, time, emoji: "", part: rep === "evening" ? "evening" : "day" });
      s.close();
      if (await ctx.save("missions", list)) ctx.toast(ctx.t("Missionen er oprettet til {name}", { name: owner?.name || ctx.t("alle børn") }));
    } else {
      const list = [...(ctx.data.rewards || [])];
      list.push({ id: uniqueId(slug(t).replace(/_/g, "-"), list), title: t, member: who, cost: pts, emoji: s.el.querySelector("#hh-qf-e").value.trim() || "🎁" });
      s.close();
      if (await ctx.save("rewards", list)) ctx.toast(ctx.t("Belønningen er oprettet til {name}", { name: owner?.name || ctx.t("alle børn") }));
    }
    ctx.render();
  });
}

// ---------------------------------------------------------------- effects (confetti and flying points)
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

// ---------------------------------------------------------------- reading aloud (Oplæsning)
async function speak(ctx, text) {
  const m = ctx.me;
  const tts = ctx.entities("tts")[0];
  const player = m?.speaker || (ctx.data.settings.media || [])[0];
  if (tts && player) {
    if (await ctx.call("tts", "speak", { entity_id: tts, media_player_entity_id: player, message: text, cache: false })) ctx.toast(ctx.t("Læser op på {where} …", { where: ctx.name(player) }));
    return;
  }
  try {
    if (!("speechSynthesis" in window)) throw new Error("no speech");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = ctx.lang() === "da" ? "da-DK" : "en-GB";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    ctx.toast(ctx.t("Læser op …"));
  } catch (e) {
    ctx.toast(ctx.t("Vælg en højttaler til oplæsning under Familieindstillinger › Børn."));
  }
}

// ---------------------------------------------------------------- photos
function pickPhoto(ctx, id) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", async () => {
    const f = input.files?.[0];
    if (!f) return;
    let url = null;
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await ctx.hass.fetchWithAuth("/api/image/upload", { method: "POST", body: fd });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      url = `/api/image/serve/${j.id}/512x512`;
    } catch (err) {
      // Without image upload: a small picture straight in Hverdagsro.
      url = await new Promise((res) => {
        const rd = new FileReader();
        rd.onload = () => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement("canvas"), S = 192, k = Math.max(S / img.width, S / img.height);
            c.width = S;
            c.height = S;
            c.getContext("2d").drawImage(img, (S - img.width * k) / 2, (S - img.height * k) / 2, img.width * k, img.height * k);
            res(c.toDataURL("image/jpeg", 0.82));
          };
          img.onerror = () => res(null);
          img.src = rd.result;
        };
        rd.readAsDataURL(f);
      });
    }
    if (!url) return ctx.toast(ctx.t("Billedet kunne ikke læses. Prøv et JPG eller PNG."));
    try {
      await ctx.ws("prefs", { member: id, prefs: { photo: url } });
      const m = ctx.member(id);
      if (m) m.photo = url;
      ctx.toast(ctx.t("Nyt billede af {name}", { name: m?.name || "" }));
      ctx.render();
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  });
  input.click();
}

async function setPrefs(ctx, m, prefs) {
  Object.assign(m, prefs);
  ctx.render();
  try {
    await ctx.ws("prefs", { member: m.id, prefs });
  } catch (err) {
    ctx.toast(String(err?.message || err));
  }
}

// ---------------------------------------------------------------- acts
const acts = {
  "home-install": async (el, e, ctx) => {
    if (!installEvt) return;
    installEvt.prompt();
    const r = await installEvt.userChoice.catch(() => null);
    installEvt = null;
    if (r?.outcome === "accepted") ctx.toast(ctx.t("Hverdagsro er lagt på hjemmeskærmen"));
    ctx.render(true);
  },
  async "home-task"(el, ev, ctx) {
    const member = ctx.member(el.dataset.member);
    // A part of the routine board: tick (or untick) all its cards.
    if (el.dataset.id.startsWith("rb:") && member) {
      if (ctx.isKid && ctx.me?.id !== member.id) return ctx.toast(ctx.t("Det kan kun far eller mor"));
      const slot = el.dataset.id.slice(3), cards = ctx.data.routines?.boards?.[member.id]?.[slot] || [];
      const D = (ctx.data.board_done ||= {}), mine = D[member.id] || [];
      const all = cards.every((c, i) => mine.includes(`${slot}:${i}`));
      if (!all) {
        const r = el.getBoundingClientRect();
        burst(ctx, r.left + r.width / 2, r.top + r.height / 2, member.color);
      }
      for (let i = 0; i < cards.length; i++) {
        if (mine.includes(`${slot}:${i}`) === !all) continue;
        try {
          const res = await ctx.ws("board", { member: member.id, slot, index: i, done: !all });
          D[member.id] = res.done;
        } catch (err) {
          return ctx.toast(String(err?.message || err));
        }
      }
      return ctx.render();
    }
    const mission = el.dataset.id.startsWith("lektie:") ? { id: el.dataset.id, points: 0, title: "" } : (ctx.data.missions || []).find((x) => x.id === el.dataset.id);
    if (!member || !mission) return;
    if (ctx.isKid && ctx.me?.id !== member.id) return ctx.toast(ctx.t("Det kan kun far eller mor"));
    const key = `${mission.id}:${member.id}`;
    const done = !(key in (ctx.data.done_today || {}));
    const before = { done: { ...(ctx.data.done_today || {}) }, points: { ...(ctx.data.points || {}) } };
    const row = el.closest("[data-task]");
    row?.classList.toggle("done", done);
    el.style.background = done ? member.color : "";
    el.setAttribute("aria-pressed", String(done));
    const dt = { ...(ctx.data.done_today || {}) };
    if (done) dt[key] = { at: new Date().toISOString(), by: ctx.data.me };
    else delete dt[key];
    ctx.data.done_today = dt;
    ctx.data.done_week = { ...(ctx.data.done_week || {}), [ctx.data.today]: dt };
    const usePts = member.role === "child" && ctx.feature(member, "points") && mission.points;
    if (usePts) ctx.data.points = { ...ctx.data.points, [member.id]: Math.max(0, ctx.points(member.id) + (done ? mission.points : -mission.points)) };
    if (done) {
      const r = el.getBoundingClientRect();
      burst(ctx, r.left + r.width / 2, r.top + r.height / 2, member.color);
      if (usePts) flyPts(ctx, r.right + 6, r.top, mission.points);
      const mine = tasksFor(ctx, member);
      if (member.role === "child" && mine.length && mine.every((t) => t.done)) setTimeout(() => ctx.toast(ctx.t("Perfekt dag! {name} har nu {n} perfekte dage i træk", { name: member.name, n: streak(ctx, member) })), 700);
    }
    setTimeout(() => ctx.render(), 650);
    try {
      await ctx.ws("mission", { mission: mission.id, member: member.id, done });
    } catch (err) {
      ctx.data.done_today = before.done;
      ctx.data.points = before.points;
      ctx.toast(String(err?.message || err));
      ctx.render();
    }
  },
  async "home-approve"(el, ev, ctx) {
    const pq = (ctx.data.requests || []).find((x) => x.id === el.dataset.id);
    el.disabled = true;
    try {
      await ctx.ws("reward/decide", { request: el.dataset.id, approve: true });
      const b = el.getBoundingClientRect();
      burst(ctx, b.left + 30, b.top + 10, "#F2B01E");
      ctx.toast(ctx.t("Godkendt: {name} får {what}", { name: ctx.member(pq?.member)?.name || "", what: rewardById(ctx, pq?.reward)?.title || "" }));
    } catch (err) {
      el.disabled = false;
      ctx.toast(String(err?.message || err));
    }
  },
  async "home-reject"(el, ev, ctx) {
    el.disabled = true;
    try {
      await ctx.ws("reward/decide", { request: el.dataset.id, approve: false });
      ctx.toast(ctx.t("Købet er afvist, og pointene er bevaret"));
    } catch (err) {
      el.disabled = false;
      ctx.toast(String(err?.message || err));
    }
  },
  async "home-givepts"(el, ev, ctx) {
    const k = ctx.member(el.dataset.id);
    const b = el.getBoundingClientRect();
    try {
      const r = await ctx.ws("points", { member: k.id, delta: 5, reason: ctx.t("Ekstra point") });
      ctx.data.points = { ...ctx.data.points, [k.id]: r.points };
      flyPts(ctx, b.right, b.top, 5);
      burst(ctx, b.left + 40, b.top + 10, k.color);
      ctx.toast(ctx.t("{name} fik 5 point", { name: k.name }));
      ctx.render();
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
  "home-seeas"(el, ev, ctx) {
    ctx.panel.viewAs(el.dataset.id);
  },
  async "home-buy"(el, ev, ctx) {
    const member = el.dataset.member;
    const r = rewardById(ctx, el.dataset.id);
    el.disabled = true;
    try {
      const req = await ctx.ws("reward/request", { member, reward: el.dataset.id });
      const box = el.getBoundingClientRect();
      burst(ctx, box.left + box.width / 2, box.top, ctx.member(member)?.color, 40);
      ctx.toast(req?.status === "approved" ? ctx.t("{what} er købt", { what: r?.title }) : ctx.t("{what} venter på godkendelse fra far eller mor", { what: r?.title }));
    } catch (err) {
      el.disabled = false;
      ctx.toast(String(err?.message || err));
    }
  },
  async "home-setgoal"(el, ev, ctx) {
    const m = ctx.member(el.dataset.member);
    if (m) m.goal = el.dataset.id;
    ctx.render();
    try {
      await ctx.ws("prefs", { member: el.dataset.member, prefs: { goal: el.dataset.id } });
      ctx.toast(ctx.t("Nyt mål!"));
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
  "home-kday"(el, ev, ctx) {
    kidDay = +el.dataset.i || 0;
    ctx.render(true);
  },
  "home-read"(el, ev, ctx) {
    speak(ctx, el.dataset.txt || readText(ctx, ctx.me));
  },
  "home-toast"(el, ev, ctx) {
    ctx.toast(el.dataset.msg);
  },
  async "home-sick"(el, ev, ctx) {
    const m = ctx.me;
    let sent = 0;
    for (const p of ctx.parents()) if (p.notify && (await ctx.call("notify", p.notify.split(".")[1], { title: ctx.t("Syg"), message: ctx.t("{name} har meldt sig syg", { name: m?.name }) }))) sent++;
    ctx.toast(sent ? ctx.t("Far og mor har fået besked om, at du er syg") : ctx.t("Sig det til far eller mor"));
  },
  "home-band"(el, ev, ctx) {
    bandStyle = el.dataset.id;
    try {
      localStorage.setItem("hverdagsro-band", bandStyle);
    } catch (e) {
      /* private mode */
    }
    ctx.render(true);
  },
  "home-story"(el, ev, ctx) {
    openStory(ctx, el.dataset.id);
  },
  "home-quick"(el, ev, ctx) {
    if (!ctx.isParent) return ctx.toast(ctx.t("Det kan kun far eller mor"));
    quickCreate(ctx, el.dataset.kind || null, el.dataset.member || null);
  },
  "home-delreward"(el, ev, ctx) {
    const r = rewardById(ctx, el.dataset.id);
    if (!r) return;
    ctx.confirm(ctx.t("Fjern {what}?", { what: r.title }), ctx.t("Belønningen forsvinder fra shoppen."), ctx.t("Fjern"), async () => {
      await ctx.save("rewards", (ctx.data.rewards || []).filter((x) => x.id !== r.id));
      ctx.render();
    });
  },
  "home-photo"(el, ev, ctx) {
    pickPhoto(ctx, el.dataset.id);
  },
  "home-msg"(el, ev, ctx) {
    const m = ctx.me;
    if (!m) return;
    const off = new Set(m.msg_off || []);
    if (off.has(el.dataset.id)) off.delete(el.dataset.id);
    else off.add(el.dataset.id);
    el.setAttribute("aria-pressed", String(!off.has(el.dataset.id)));
    setPrefs(ctx, m, { msg_off: [...off] });
  },
  "home-qahide"(el, ev, ctx) {
    const m = ctx.me;
    if (!m) return;
    const hide = new Set(m.quick_hide || []);
    if (hide.has(el.dataset.id)) hide.delete(el.dataset.id);
    else hide.add(el.dataset.id);
    setPrefs(ctx, m, { quick_hide: [...hide] });
  },
  "home-qaup"(el, ev, ctx) {
    const m = ctx.me;
    const ids = myQuick(ctx, m).map((q) => q.id);
    const i = ids.indexOf(el.dataset.id);
    if (i > 0) [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
    setPrefs(ctx, m, { quick_order: ids });
  },
  "home-qadown"(el, ev, ctx) {
    const m = ctx.me;
    const ids = myQuick(ctx, m).map((q) => q.id);
    const i = ids.indexOf(el.dataset.id);
    if (i >= 0 && i < ids.length - 1) [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
    setPrefs(ctx, m, { quick_order: ids });
  },
  "home-who"(el, ev, ctx) {
    whoSheet(ctx);
  },
  "home-pick"(el, ev, ctx) {
    const k = ctx.member(el.dataset.id);
    if (!k) return;
    const go = () => ctx.panel.viewAs(k.id);
    if (k.has_pin) pinSheet(ctx, k.id, go);
    else go();
  },
  async "home-skin"(el, ev, ctx) {
    const m = ctx.me;
    if (!m) return;
    const old = { skin: m.skin, mode: m.mode };
    m.skin = el.dataset.id;
    ctx.applyTheme?.();
    ctx.render();
    try {
      await ctx.ws("theme", { member: m.id, skin: m.skin, mode: m.mode || "auto" });
    } catch (err) {
      Object.assign(m, old);
      ctx.applyTheme?.();
      ctx.toast(String(err?.message || err));
      ctx.render();
    }
  },
  async "home-skinmode"(el, ev, ctx) {
    const m = ctx.me;
    if (!m) return;
    const old = m.mode;
    m.mode = el.dataset.id;
    ctx.applyTheme?.();
    ctx.render();
    try {
      await ctx.ws("theme", { member: m.id, skin: m.skin || "standard", mode: m.mode });
    } catch (err) {
      m.mode = old;
      ctx.applyTheme?.();
      ctx.toast(String(err?.message || err));
      ctx.render();
    }
  },
};

// ---------------------------------------------------------------- views
function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - y0) / 864e5 + 1) / 7);
}
const views = {
  hjem: { parentOnly: true, render: pHome, title: (ctx) => ctx.t("Hjem"), after: (ctx) => startLive(ctx) },
  person: { parentOnly: true, render: personPage, title: (ctx) => ctx.member(ctx.arg)?.name || "" },
  dag: {
    kidOnly: true,
    render: kDay,
    title: (ctx) => ctx.t("Min dag"),
    summary: (ctx) => {
      const L = ctx.me ? tasksFor(ctx, ctx.me) : [];
      return { done: L.filter((t) => t.done).length, total: L.length };
    },
    badge: (ctx) => (ctx.me && ctx.feature(ctx.me, "missions") ? tasksFor(ctx, ctx.me).filter((t) => !t.done).length : 0),
  },
  shop: { module: "shop", render: kShop, title: (ctx) => ctx.t("Shop") },
  opgaver: { parentOnly: true, module: "missions", render: pTasks, title: (ctx) => ctx.t("Opgaver"), badge: (ctx) => ctx.members().flatMap((m) => tasksFor(ctx, m)).filter((t) => !t.done).length },
  hvem: { render: whoView, title: (ctx) => ctx.t("Hvem er du?") },
  "ikke-klar": {
    render: (ctx) => `<section class="card hv-empty">${svg("sparkle", "ic big")}<h2>${esc(ctx.t("Hverdagsro er ikke sat op endnu"))}</h2><p class="t-sub">${esc(ctx.t("Far eller mor skal lige gøre guiden færdig. Så er alt klar."))}</p></section>`,
    title: () => "",
  },
  mig: { render: pMe, title: (ctx) => ctx.t("Mine indstillinger") },
};
function startLive(ctx) {
  clearInterval(liveTimer);
  if (bandStyle !== "live") return;
  liveTimer = setInterval(() => {
    const t = ctx.root.getElementById("hh-live-track");
    if (!t || reduce()) return t ? undefined : clearInterval(liveTimer);
    liveI = (liveI + 1) % t.children.length;
    t.style.transform = `translateY(-${liveI * 44}px)`;
  }, 3200);
}

const css = `
.hs-card { margin-top: 0; } .hs-row { display: flex; gap: 14px; align-items: center; } .hs-row > div { flex: 1; } .hs-row h2 { margin: 0 0 2px; }
.hs-icon { width: 64px; height: 64px; border-radius: 16px; box-shadow: 0 8px 20px rgba(110,74,255,.25); flex: none; }
.hs-steps { margin: 12px 0 0; padding-left: 20px; display: grid; gap: 4px; font-size: 14px; }

.hh-confetti { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 98; }
.home-fam .band-pick { margin-top: 12px; }
.task .check[disabled] { opacity: .5; }
.hh-room > .rm-mini { width: 100%; }
.hh-room .rm-pic { max-height: 280px; overflow: hidden; }
`;

const en = {
  "Hverdagsro på hjemmeskærmen": "Hverdagsro on the home screen", "Hverdagsro er åbnet fra hjemmeskærmen.": "Hverdagsro is open from the home screen.",
  "Få Hverdagsro som sit eget ikon, der åbner lige ind i familiens hverdag.": "Get Hverdagsro as its own icon that opens straight into the family's day.", Installér: "Install",
  "Hjemmeskærmen kan ikke få et ikon fra Home Assistant-appen.": "The Home Assistant app can't put an icon on the home screen.",
  "Åbn jeres Home Assistant i {browser} (samme adresse som i appen), og gå til Hverdagsro.": "Open your Home Assistant in {browser} (same address as in the app) and go to Hverdagsro.",
  "Følg så trinene herunder.": "Then follow the steps below.", "Tryk på Del-knappen nederst i Safari.": "Tap the Share button at the bottom of Safari.",
  "Vælg »Føj til hjemmeskærm«.": "Choose »Add to Home Screen«.", "Tryk »Tilføj«. Ikonet åbner Hverdagsro direkte.": "Tap »Add«. The icon opens Hverdagsro directly.",
  "Tryk på ⋮ øverst i Chrome.": "Tap ⋮ at the top of Chrome.", "Vælg »Føj til startskærm« eller »Installer app«.": "Choose »Add to Home screen« or »Install app«.", "Ikonet åbner Hverdagsro direkte.": "The icon opens Hverdagsro directly.",
  "I Chrome eller Edge: klik på installér-ikonet i adresselinjen, eller ⋮ › »Gem og del« › »Installer side som app«.": "In Chrome or Edge: click the install icon in the address bar, or ⋮ › »Save and share« › »Install page as app«.",
  "I Safari på Mac: Arkiv › »Føj til Dock«.": "In Safari on a Mac: File › »Add to Dock«.", "Hverdagsro er lagt på hjemmeskærmen": "Hverdagsro is on the home screen",
  nu: "now",
  "om {n} min": "in {n} min",
  "om {h} t {m} min": "in {h} h {m} min",
  Hjemme: "Home",
  Ude: "Out",
  "følger {name}": "with {name}",
  Barn: "Child",
  Forælder: "Parent",
  forælder: "parent",
  Mor: "Mum",
  Far: "Dad",
  Dagpleje: "Childminder",
  Vuggestue: "Nursery",
  Børnehave: "Kindergarten",
  Skole: "School",
  Institution: "Institution",
  "Hver dag": "Every day",
  Hverdage: "Weekdays",
  Weekender: "Weekends",
  "Intet mål": "No goal",
  Bringer: "Brings",
  Henter: "Picks up",
  bringer: "brings",
  henter: "picks up",
  "Kom hjem kl. {t}": "Came home at {t}",
  Aftensmad: "Dinner",
  "Marker {what} som klaret": "Mark {what} as done",
  "En belønning": "A reward",
  "vil købe": "wants to buy",
  "for {n} point": "for {n} points",
  "Venter på en forælder · {name} har {n} point": "Waiting for a parent · {name} has {n} points",
  Godkend: "Approve",
  Afvis: "Decline",
  Superglad: "Overjoyed",
  Glad: "Happy",
  Okay: "Okay",
  "Savner dig": "Misses you",
  Hund: "Dog",
  Kat: "Cat",
  "Lille drage": "Little dragon",
  "Bliver gladere, når dagens missioner er klaret": "Gets happier when today's missions are done",
  "{name} har ikke et dyr endnu. Vælg et under Familieindstillinger › Børn.": "{name} has no pet yet. Choose one under Family settings › Children.",
  "Intet planlagt": "Nothing planned",
  "Vælg familiebåndet": "Choose the family band",
  "Vis som": "Show as",
  Historier: "Stories",
  Huset: "The house",
  "Dagens spor": "Today's tracks",
  Bobler: "Bubbles",
  "Live-linje": "Live line",
  Kort: "Cards",
  "Lige nu": "Right now",
  "Kom hjem kl. ": "Came home at ",
  "Gik kl. ": "Left at ",
  Næste: "Next",
  Point: "Points",
  "{n} perfekte dage · {d}/{t} missioner": "{n} perfect days · {d}/{t} missions",
  Missioner: "Missions",
  "{d}/{t} klaret": "{d}/{t} done",
  "{n} perfekte dage": "{n} perfect days",
  Dagen: "The day",
  "{d}/{t} opgaver klaret": "{d}/{t} tasks done",
  "{name}s historie": "{name}'s story",
  Luk: "Close",
  "Se {name}s side": "See {name}'s page",
  "Tryk til højre for næste, til venstre for forrige": "Tap right for next, left for previous",
  "Hjemme {n} af {t}": "Home {n} of {t}",
  "Alle er hjemme": "Everyone is home",
  "{n} af {t}": "{n} of {t}",
  "er hjemme": "are home",
  aftensmad: "dinner",
  "siden {t}": "since {t}",
  "vil købe {what} · venter på jer": "wants to buy {what} · waiting for you",
  "har {p} point og {s} perfekte dage": "has {p} points and {s} perfect days",
  Live: "Live",
  Familien: "The family",
  "Hjemme nu": "Home now",
  "Aftensmad sammen": "Dinner together",
  klaret: "done",
  "Telefonens batteri": "Phone battery",
  "Ingen i familien endnu": "No one in the family yet",
  "Tilføj familien under Familieindstillinger, så kommer forsiden til live.": "Add the family under Family settings and the home page comes alive.",
  "Tilføj familien": "Add the family",
  "Påmindelse til {name} kl. {t}": "Reminder to {name} at {t}",
  "kl.": "at",
  "Hele dagen": "All day",
  "Hent og bring": "Drop-off and pick-up",
  "I dag og i morgen": "Today and tomorrow",
  "I dag": "Today",
  "Ingen aftaler i dag": "Nothing planned today",
  "I morgen, {day}": "Tomorrow, {day}",
  "Ingen aftaler i morgen": "Nothing planned tomorrow",
  Madplan: "Meal plan",
  "I aften": "Tonight",
  "Ikke planlagt endnu": "Not planned yet",
  "Fra {name}": "From {name}",
  "I morgen": "Tomorrow",
  "i morgen": "tomorrow",
  "Børnenes mål": "The children's goals",
  "Hurtig opret": "Quick add",
  Liste: "List",
  "{d} af {t} klaret": "{d} of {t} done",
  åbn: "open",
  "Opgaver i dag": "Tasks today",
  "Alle opgaver": "All tasks",
  "Alt er klaret i dag": "Everything is done today",
  "Kom i gang": "Get started",
  "Faste rutiner på 2 minutter": "Routines in 2 minutes",
  "Faste opgaver": "Regular tasks",
  "{n} gentager sig": "{n} repeat",
  "{n} ture om ugen": "{n} trips a week",
  Rutinetavle: "Routine board",
  og: "and",
  "Ingen endnu": "None yet",
  "Godkend køb": "Approve purchases",
  "Kun forældre": "Parents only",
  "{n} point til {what}": "{n} points to {what}",
  "{what} er tjent!": "{what} is earned!",
  "Ingen opgaver i dag. Lav faste opgaver under Faste rutiner.": "No tasks today. Make regular tasks under Routines.",
  "Missioner og point er to funktioner: børnene kan have missioner uden point. Med point får de dem, så snart de krydser af; et køb i shoppen venter på en forælder. Når alle dagens missioner er klaret, tæller dagen som perfekt.":
    "Missions and points are two features: children can have missions without points. With points they get them as soon as they tick off; a purchase in the shop waits for a parent. When all of today's missions are done, the day counts as perfect.",
  "i dag": "today",
  Frikvarter: "Break",
  "Fra {cal}": "From {cal}",
  "Ingen timer i denne uge": "No lessons this week",
  Fødselsdag: "Birthday",
  "Fødselsdag for {name}": "Birthday for {name}",
  "Fødselsdagen er gemt": "The birthday is saved",
  "Hvem henter": "Who picks up",
  "Ikke sat": "Not set",
  "{n} år": "{n} years",
  "person i Home Assistant": "person in Home Assistant",
  "profil uden telefon": "profile without a phone",
  "egen PIN": "own PIN",
  "{n} point": "{n} points",
  "{d}/{t} missioner i dag": "{d}/{t} missions today",
  "Skift billede": "Change picture",
  "Sæt billede": "Add picture",
  "Se som {name}": "See as {name}",
  "Giv 5 point": "Give 5 points",
  Skoleskema: "School schedule",
  "Uge {n}": "Week {n}",
  "Uge {n} · fra {cal}": "Week {n} · from {cal}",
  "Vælg skemaets kalender (fx fra Aula) under Familieindstillinger › Børn.": "Choose the schedule's calendar (e.g. from Aula) under Family settings › Children.",
  "Mit dyr": "My pet",
  "Slået til": "On",
  Mål: "Goal",
  Besked: "Message",
  "Ny mission": "New mission",
  "Ingen missioner": "No missions",
  Pointshop: "Points shop",
  "Forældre sætter priserne": "Parents set the prices",
  "Belønning · alle børn": "Reward · all children",
  Belønning: "Reward",
  "Fjern {what}": "Remove {what}",
  "Ingen belønninger endnu": "No rewards yet",
  "Ny belønning": "New reward",
  Profil: "Profile",
  "Moduler og institution": "Modules and institution",
  "Skoleskema fra Aula": "School schedule from Aula",
  "Dagens aflevering og afhentning fra Hent og bring": "Today's drop-off and pick-up from Drop-off and pick-up",
  administrator: "administrator",
  "du henter": "you pick up",
  "{n} åbne opgaver": "{n} open tasks",
  "{n} aftaler i ugen": "{n} events this week",
  Opgaver: "Tasks",
  "Ingen opgaver": "No tasks",
  Ugen: "The week",
  "Ingen aftaler": "No events",
  Ønskesedler: "Wish lists",
  "{n} ønsker · Ønskeskyen": "{n} wishes · Ønskeskyen",
  "Ingen ønskesedler valgt. Vælg dem under Familieindstillinger › Ønskeskyen.": "No wish lists chosen. Choose them under Family settings › Ønskeskyen.",
  "Mine indstillinger": "My settings",
  Familieindstillinger: "Family settings",
  Hjem: "Home",
  "Afleveres i {where}": "Dropped off at {where}",
  "{name} afleverer": "{name} drops off",
  "Bliver hentet": "Picked up",
  "{name} henter": "{name} picks up",
  Mission: "Mission",
  "Hej {name}.": "Hi {name}.",
  "Du har {n} point.": "You have {n} points.",
  "Dine missioner er: {list}.": "Your missions are: {list}.",
  "Du har klaret alle dine missioner.": "You've done all your missions.",
  "Læs beskeden op": "Read the message aloud",
  "Hør din dag": "Hear your day",
  "Læs dagen op": "Read the day aloud",
  Nu: "Now",
  Først: "First",
  Fri: "Free",
  Godnat: "Good night",
  "Ingen planer": "No plans",
  "Skoledagen slutter kl. {t}": "School ends at {t}",
  "Skoledagen er afsluttet. Godt gået!": "School's done. Well done!",
  "Afslut dagen": "End the day",
  "Meld syg": "Report sick",
  "Missioner i dag": "Missions today",
  "Dagens mission": "Today's mission",
  "Ingen børn med shop": "No children with a shop",
  "Shoppen er slået fra": "The shop is off",
  "Far eller mor kan slå den til.": "Mum or Dad can turn it on.",
  "Mit mål": "My goal",
  "{name}s mål": "{name}'s goal",
  "{p} af {c} point": "{p} of {c} points",
  "{what} venter på, at far eller mor godkender": "{what} is waiting for Mum or Dad to approve",
  "Min pointshop": "My points shop",
  "{name}s pointshop": "{name}'s points shop",
  Venter: "Waiting",
  "Mangler {n}": "{n} to go",
  Køb: "Buy",
  "Køb for {name}": "Buy for {name}",
  "Gør til mål": "Make it my goal",
  "Der er ingen belønninger endnu.": "There are no rewards yet.",
  "Pointene trækkes først, når far eller mor har godkendt købet.": "The points are only taken when Mum or Dad has approved the purchase.",
  Altid: "Always",
  "Når {e} er tændt · ": "When {e} is on · ",
  "Flyt op": "Move up",
  "Flyt ned": "Move down",
  "Vis {what} i min +-menu": "Show {what} in my + menu",
  Tema: "Theme",
  "Kun for {name}": "Only for {name}",
  Automatisk: "Automatic",
  Lyst: "Light",
  Mørkt: "Dark",
  Hverdagsro: "Hverdagsro",
  Nordlys: "Northern lights",
  Hav: "Sea",
  Skov: "Forest",
  Sand: "Sand",
  Rosa: "Pink",
  Rummet: "Space",
  Kontrast: "Contrast",
  "Du er ikke med i familien": "You're not in the family",
  "Tilføj dig selv under Familieindstillinger for at vælge dit eget tema.": "Add yourself under Family settings to choose your own theme.",
  profil: "profile",
  "Min +-menu": "My + menu",
  "Far eller mor bestemmer": "Mum or Dad decides",
  "Vælg, hvilke knapper der står i din +-menu, og i hvilken rækkefølge.": "Choose which buttons are in your + menu, and in which order.",
  "Nye knapper og hvem der må bruge dem, styres i familieindstillingerne.": "New buttons, and who may use them, are set in the family settings.",
  Alarm: "Alarm",
  "Der er ingen knapper til dig endnu.": "There are no buttons for you yet.",
  "Bed far eller mor om at give dig nogle.": "Ask Mum or Dad to give you some.",
  "Beskeder til mig": "Messages to me",
  "Vælg din telefon under Familieindstillinger › Familien for at få beskeder.": "Choose your phone under Family settings › The family to get messages.",
  "Børnene køber i shoppen": "The children buy in the shop",
  "En mission er klaret": "A mission is done",
  "Et mål er nået": "A goal is reached",
  "Aftaler flyttet eller aflyst": "Events moved or cancelled",
  "Hvem henter i dag": "Who picks up today",
  "Skrald skal stilles ud": "The bin must go out",
  "Mine point": "My points",
  "Næste aftale": "Next event",
  "Skoledagen slutter": "School ends",
  "Besked fra far eller mor": "Message from Mum or Dad",
  "Min PIN": "My PIN",
  "Din PIN skiftes af far eller mor.": "Mum or Dad changes your PIN.",
  "Skift bruger": "Switch user",
  "Hvem er du?": "Who are you?",
  "Tryk på dig selv. Har du en PIN, skal du skrive den.": "Tap yourself. If you have a PIN, type it.",
  "Hej {name}": "Hi {name}",
  "Skriv din PIN.": "Type your PIN.",
  Slet: "Delete",
  Annullér: "Cancel",
  "Hvem bruger Hverdagsro?": "Who is using Hverdagsro?",
  "Forældre ser alt. Børn ser deres egen dag og bruger deres PIN.": "Parents see everything. Children see their own day and use their PIN.",
  "En opgave til et barn": "A task for a child",
  ", evt. med point": ", with points if you like",
  "En vare i pointshoppen": "An item in the points shop",
  Aftale: "Event",
  "Med »hvem henter«": "With »who picks up«",
  "Liste, fast liste eller ønskeseddel": "List, regular list or wish list",
  "Én gang (ekstra)": "Once (extra)",
  "Hvad skal gøres": "What to do",
  "Fx Pak skoletasken": "E.g. Pack the school bag",
  "Fx Biograftur": "E.g. Trip to the cinema",
  Hvem: "Who",
  "Alle børn": "All children",
  "Pris i point": "Price in points",
  Gentag: "Repeat",
  "Hver aften": "Every evening",
  "Hver uge": "Every week",
  Tidspunkt: "Time",
  Ikon: "Icon",
  Opret: "Create",
  "Missionen er oprettet til {name}": "The mission is created for {name}",
  "Belønningen er oprettet til {name}": "The reward is created for {name}",
  "alle børn": "all children",
  "Læser op på {where} …": "Reading aloud on {where} …",
  "Læser op …": "Reading aloud …",
  "Vælg en højttaler til oplæsning under Familieindstillinger › Børn.": "Choose a speaker for reading aloud under Family settings › Children.",
  "Billedet kunne ikke læses. Prøv et JPG eller PNG.": "The picture couldn't be read. Try a JPG or PNG.",
  "Nyt billede af {name}": "New picture of {name}",
  "Det kan kun far eller mor": "Only Mum or Dad can do that",
  "Perfekt dag! {name} har nu {n} perfekte dage i træk": "Perfect day! {name} now has {n} perfect days in a row",
  "Godkendt: {name} får {what}": "Approved: {name} gets {what}",
  "Købet er afvist, og pointene er bevaret": "The purchase is declined, and the points are kept",
  "Ekstra point": "Extra points",
  "{name} fik 5 point": "{name} got 5 points",
  "{what} er købt": "{what} is bought",
  "{what} venter på godkendelse fra far eller mor": "{what} is waiting for approval from Mum or Dad",
  "Nyt mål!": "New goal!",
  Syg: "Sick",
  "{name} har meldt sig syg": "{name} has reported sick",
  "Far og mor har fået besked om, at du er syg": "Mum and Dad know you're sick",
  "Sig det til far eller mor": "Tell Mum or Dad",
  "Fjern {what}?": "Remove {what}?",
  "Belønningen forsvinder fra shoppen.": "The reward disappears from the shop.",
  Fjern: "Remove",
  "Min dag": "My day",
  Shop: "Shop",
  "Hverdagsro er ikke sat op endnu": "Hverdagsro isn't set up yet",
  "Far eller mor skal lige gøre guiden færdig. Så er alt klar.": "Mum or Dad just has to finish the guide. Then everything is ready.",
};

const inputs = {
  async "home-bday"(el, ev, ctx) {
    if (ev.type !== "change" || !ctx.isParent) return;
    const v = el.value;
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    const fam = ctx.members().map(({ has_pin: _h, ...m }) => JSON.parse(JSON.stringify(m)));
    const m = fam.find((x) => x.id === el.dataset.id);
    if (!m) return;
    if (v) m.birthday = v;
    else delete m.birthday;
    if (await ctx.save("family", fam)) ctx.toast(ctx.t("Fødselsdagen er gemt"));
    ctx.render();
  },
};

export default { id: "home", views, acts, inputs, css, en, init: (ctx) => (CTX = ctx) };
