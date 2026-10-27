/* Hverdagsro – the children's own pages and the parents' fixed routines, 1:1 with the prototype:
   Rutinetavle (tavle), Mit skema (skema), Mine ønsker (onsker) and Faste rutiner (rutiner: faste opgaver, hent og bring,
   rutinetavle-byggeren). Data: ctx.data.routines {helpers, pickups, boards, cards}, ctx.data.board_done, ctx.data.missions,
   the child's school calendar (member.skema) and Ønskeskyen (ctx.data.osky, settings.osky_to). */
import { addDays, esc, slug, startOfDay } from "./hv-core.js";
import { P, svg } from "./hv-icons.js";

// ------------------------------------------------------------------ the prototype's catalogues
/* Routine cards: [id, label, emoji, category]. */
export const RCARDS = [
  ["op", "Stå op", "⏰", "morgen"], ["tis", "Tisse", "🚽", "krop"], ["haand", "Vaske hænder", "🧼", "krop"], ["taend", "Børste tænder", "🪥", "krop"], ["ansigt", "Vaske sig", "🚿", "krop"],
  ["findtoj", "Finde tøj frem", "🧦", "toj"], ["toj", "Tage tøj på", "👕", "toj"], ["morgenmad", "Spise morgenmad", "🥣", "mad"], ["haar", "Rede hår", "💇", "krop"], ["taske", "Pakke taske", "🎒", "skole"],
  ["madpakke", "Madpakke med", "🥪", "mad"], ["sko", "Sko og jakke på", "👟", "toj"], ["regntoj", "Regntøj", "🧥", "toj"], ["hjelm", "Cykelhjelm", "🚲", "toj"], ["vand", "Drikke vand", "💧", "mad"],
  ["frugt", "Spise frugt", "🍎", "mad"], ["medicin", "Medicin", "💊", "krop"], ["lektier", "Lektier", "✏️", "skole"], ["laese", "Læse", "📖", "skole"], ["ude", "Lege ude", "🛝", "leg"],
  ["rydop", "Rydde op", "🧸", "hjem"], ["skaerm", "Skærmtid", "📱", "leg"], ["hjaelp", "Hjælpe til", "🥕", "hjem"], ["dyr", "Fodre dyr", "🐟", "hjem"], ["dekk", "Dække bord", "🍴", "hjem"],
  ["aftensmad", "Aftensmad", "🍝", "mad"], ["bad", "Bad", "🛁", "krop"], ["nattoj", "Nattøj på", "🌙", "toj"], ["historie", "Godnathistorie", "📚", "sove"], ["kram", "Godnatkram", "🤗", "sove"], ["sove", "Sove", "😴", "sove"],
];
const RCAT = { morgen: ["#F2B01E", "Morgen"], krop: ["#2F80ED", "Krop"], toj: ["#8B5CF6", "Tøj"], mad: ["#FF7A59", "Mad"], skole: ["#1E9E62", "Skole"], leg: ["#E4568C", "Leg"], hjem: ["#11A39A", "Hjemme"], sove: ["#4A3F78", "Sove"] };
const RSLOTS = [["morgen", "Morgen", "sunrise", "06–09", 5, 12], ["eftermiddag", "Efter skole", "sun", "13–17", 12, 17.5], ["aften", "Aften", "moon", "17.30–20.30", 17.5, 29]];
const CHORES = [["Tøm opvaskeren", "🍽️", 10], ["Dæk bord", "🍴", 5], ["Ryd af bordet", "🧽", 5], ["Red seng", "🛏️", 5], ["Ryd op på værelset", "🧸", 10], ["Læg tøj til vask", "🧺", 5], ["Fodr dyrene", "🐟", 5], ["Skrald ud", "🗑️", 5], ["Støvsug", "🧹", 15], ["Vand planter", "🪴", 5], ["Pak skoletasken", "🎒", 5], ["Lektier", "✏️", 10], ["Læs 20 minutter", "📖", 10], ["Bær indkøb ind", "🛍️", 5], ["Hæng vasketøj op", "👕", 10], ["Børst tænder", "🪥", 5], ["Fodr fuglene", "🐦", 5], ["Hjælp med aftensmad", "🥕", 10]];
const WD = ["M", "T", "O", "T", "F", "L", "S"];
const WD_LONG = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"];
const HB_DAYS = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag"];
const HB_COLORS = ["#EC4899", "#0EA5E9", "#F97316", "#14B8A6", "#A855F7", "#84CC16", "#EAB308", "#64748B"];
const SUBJ = { Dansk: "#7C5CF0", Matematik: "#3B6BF5", Engelsk: "#11A39A", "Natur/teknik": "#2E9E55", Idræt: "#F08A3A", Musik: "#E4568C", Billedkunst: "#D99A12", Historie: "#9A6B4A", Kristendom: "#6B7A99", "Klassens tid": "#8A86A0", "Leg og læring": "#E3A21C", Tysk: "#C2703D", Fysik: "#0EA5E9", Biologi: "#2E9E55", Geografi: "#14B8A6", Samfundsfag: "#6B7A99", Håndværk: "#A16207" };
const SUBJ_EXTRA = ["#7C5CF0", "#3B6BF5", "#11A39A", "#2E9E55", "#F08A3A", "#E4568C", "#D99A12", "#9A6B4A", "#6B7A99"];
const WISH_EMO = ["🎁", "🧸", "🚗", "📚", "🎮", "⚽", "🎨", "🦕", "🧩", "👕", "🎧", "🚲"];
const INST = { dagpleje: "Dagpleje", vuggestue: "Vuggestue", bornehave: "Børnehave", skole: "Skole", none: "Institution" };
const STAR = svg("pstar", "ic star");

// ------------------------------------------------------------------ local state
let rtab = "opgaver";
let rWho = null;
let hbKid = null;
let hbWeek = 0; // null: the fixed plan; 0: this week, 1: next week, -1: last week …
let bKid = null;
let bZone = "morgen";
let bCat = "alle";
let tavleSlot = null;
let skemaWeek = 0;
let wishAdd = null;
let wishEmo = "🎁";
let drag = null;
let suppressClick = false;

// ------------------------------------------------------------------ helpers
const clone = (o) => JSON.parse(JSON.stringify(o));
const pc = (ctx, id) => ctx.member(id)?.color || "#6E4AFF";
const hourNow = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
const slotNow = () => {
  const h = hourNow() < 5 ? hourNow() + 24 : hourNow();
  return (RSLOTS.find((s) => h >= s[4] && h < s[5]) || RSLOTS[2])[0];
};
const routines = (ctx) => {
  const r = ctx.data?.routines || {};
  return { helpers: r.helpers || [], pickups: r.pickups || {}, boards: r.boards || {}, cards: r.cards || [], weeks: r.weeks || {} };
};
/* Hent og bring has a fixed plan, and each week can have its own plan on top (only the days that differ). */
const weekKey = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / 86400000 + 1) / 7)).padStart(2, "0")}`;
};
const rcard = (ctx, id) => RCARDS.find((c) => c[0] === id) || routines(ctx).cards.find((c) => c[0] === id) || [id, id, "⭐", "hjem"];
const catCol = (c) => (RCAT[c[3]] || RCAT.hjem)[0];
const boardOf = (ctx, kid) => ({ morgen: [], eftermiddag: [], aften: [], ...(routines(ctx).boards[kid] || {}) });
const doneOf = (ctx, kid) => ctx.data?.board_done?.[kid] || [];
const mondayOf = (d) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
const ddmm = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
const hhmmDot = (s) => String(s || "").replace(":", ".");
const reduce = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

async function saveRoutines(ctx, mutate) {
  const r = clone(routines(ctx));
  mutate(r);
  ctx.render();
  return ctx.save("routines", r);
}

/* The people who can bring and pick up: the parents (persons in HA) and the helpers (Mormor, a neighbour …).
   data.routines.helpers is the list once it has been edited; until then it is the parents. */
function helpers(ctx) {
  const list = routines(ctx).helpers;
  // Once a parent is in the list, the list decides (order, removed parents); until then the parents come first.
  const base = list.some((h) => ctx.member(h.id)) ? list : [...ctx.parents().map((m) => ({ id: m.id, name: m.name })), ...list];
  return base.map((h) => {
    const m = ctx.member(h.id);
    return m ? { id: m.id, name: m.name, member: true } : { id: h.id, name: h.name, color: h.color || "#EC4899" };
  });
}
function hbWho(ctx, id) {
  if (id === "mor") return { name: ctx.t("Hos mor"), c: "var(--muted)", l: "🏠" };
  const h = helpers(ctx).find((x) => x.id === id) || (ctx.member(id) ? { id, name: ctx.member(id).name, member: true } : null);
  if (!h) return { name: ctx.t("Ingen"), c: "var(--line)", l: "–" };
  const m = h.member && ctx.member(h.id);
  const ph = m && (m.photo || (m.person && ctx.hass?.states?.[m.person]?.attributes?.entity_picture));
  return { name: h.name, c: m ? m.color : h.color, l: h.name.charAt(0).toUpperCase(), ph };
}
const hbAv = (ctx, id, cls = "") => {
  const w = hbWho(ctx, id);
  return `<span class="hb-av ${cls}" style="--hc:${esc(w.c)}${w.ph ? `;background:${esc(w.c)} url('${esc(w.ph)}') center / cover` : ""}">${w.ph ? "" : esc(w.l)}</span>`;
};
/* The plan for one child, Monday–Friday: { bring: [[who, at] x5], hent: [[who, at] x5] }. */
function hbPlan(ctx, kid, wk = null) {
  const R = routines(ctx), p = R.pickups[kid] || {}, w = (wk && R.weeks[wk]?.[kid]) || {};
  // [who, at, own]: own is true when the week has its own plan for that day.
  const row = (d, t) => {
    const o = w[String(d + 1)]?.[t], s = o || p[String(d + 1)]?.[t] || {};
    return [s.who || "", s.at || (t === "bring" ? "07:45" : "15:00"), !!o];
  };
  return { bring: [0, 1, 2, 3, 4].map((d) => row(d, "bring")), hent: [0, 1, 2, 3, 4].map((d) => row(d, "hent")) };
}
function setPlan(r, kid, t, d, who, at, wk = null) {
  const base = wk ? (((r.weeks ||= {})[wk] ||= {})) : r.pickups;
  const p = (base[kid] ||= {});
  const day = (p[String(d + 1)] ||= {});
  day[t] = { who, at };
}
/* Old weeks are dropped, so the plan doesn't grow forever. */
function pruneWeeks(r) {
  const keep = weekKey(addDays(new Date(), -14));
  for (const k of Object.keys(r.weeks || {})) if (k < keep) delete r.weeks[k];
  if (r.weeks && !Object.keys(r.weeks).length) delete r.weeks;
}
const hbWk = () => (hbWeek == null ? null : weekKey(addDays(new Date(), hbWeek * 7)));
const hbTrips = (ctx, id) => ctx.children().reduce((n, k) => {
  const K = hbPlan(ctx, k.id);
  return n + K.bring.filter((r) => r[0] === id).length + K.hent.filter((r) => r[0] === id).length;
}, 0);

/* The routine board as missions without points: one per part of the day, done when every card is done. Today only. */
export function routineMissions(ctx, kid, date = new Date()) {
  const m = ctx.member(kid);
  if (!m || !ctx.on("board") || !ctx.feature(m, "board") || startOfDay(date).getTime() !== startOfDay(new Date()).getTime() || !ctx.atHome(m, date)) return [];
  const B = boardOf(ctx, kid), done = doneOf(ctx, kid);
  return RSLOTS.filter(([slot]) => B[slot]?.length).map(([slot, name, , span, h0]) => {
    const n = B[slot].filter((c, i) => done.includes(`${slot}:${i}`)).length;
    return { id: `rb:${slot}`, kind: "routine", t: ctx.t({ morgen: "Morgenrutinen", eftermiddag: "Rutinen efter skole", aften: "Aftenrutinen" }[slot]), em: rcard(ctx, B[slot][0])[2], done: n === B[slot].length, sub: ctx.t("{n} af {total} kort", { n, total: B[slot].length }), time: `${String(Math.floor(h0 + 1)).padStart(2, "0")}:00`, cards: B[slot].length, slot };
  });
}
/* Homework from Aula (Min Uddannelse's "opgaver", via the Aula integration) as missions without points. */
export function homeworkFor(ctx, kid, date = new Date()) {
  const m = ctx.member(kid);
  if (!m) return [];
  const name = slug(m.name), first = m.name.split(/\s+/)[0].toLowerCase();
  const id = Object.keys(ctx.hass?.states || {}).find((e) => {
    const s = ctx.hass.states[e];
    return e.startsWith("sensor.") && s.attributes.mu_opgaver != null && (e.includes(name) || String(s.attributes.friendly_name || "").toLowerCase().includes(first));
  });
  if (!id) return [];
  const wd = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"][date.getDay()];
  const html = String(ctx.hass.states[id].attributes.mu_opgaver || "");
  if (!html.includes("<h2")) return [];
  const text = (h) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
  return html
    .split(/<h2>/i)
    .slice(1)
    .map((part) => {
      const title = text(part.split(/<\/h2>/i)[0]);
      const day = (part.match(/Ugedag:\s*([^<]+)/i)?.[1] || "").trim().toLowerCase();
      const hold = (part.match(/Hold:\s*([^<]+)/i)?.[1] || "").trim();
      return { title, day, hold };
    })
    .filter((x) => x.title && (!x.day || x.day === wd))
    .map((x) => ({ id: `lektie:${weekKey(date)}:${slug(x.title).slice(0, 60)}`, kind: "homework", t: x.title, em: "✏️", done: false, sub: x.hold ? ctx.t("Lektier · {hold}", { hold: x.hold }) : ctx.t("Lektier") }));
}

/* Who brings and picks up a child on a day: { bring: {who, name, at}, hent: {who, name, at} } or null. */
export function pickupFor(ctx, kidId, date = new Date()) {
  // A child at their other home is not brought or picked up from here.
  if (!ctx.atHome(ctx.member(kidId), date)) return null;
  const R = routines(ctx), wd = String(((date.getDay() + 6) % 7) + 1), own = R.weeks[weekKey(date)]?.[kidId]?.[wd];
  const day = own || R.pickups[kidId]?.[wd] ? { ...(R.pickups[kidId]?.[wd] || {}), ...(own || {}) } : null;
  if (!day) return null;
  const one = (s) => (s?.who ? { who: s.who, name: hbWho(ctx, s.who).name, at: s.at || "" } : null);
  const out = { bring: one(day.bring), hent: one(day.hent) };
  return out.bring || out.hent ? out : null;
}

// ------------------------------------------------------------------ confetti and reading aloud
function canvas(ctx) {
  let cv = ctx.root.querySelector("canvas.hk-confetti");
  if (!cv) {
    cv = document.createElement("canvas");
    cv.className = "hk-confetti";
    cv.setAttribute("aria-hidden", "true");
    ctx.root.appendChild(cv);
  }
  return cv;
}
let parts = [];
let running = false;
function burst(ctx, x, y, color, n = 26) {
  if (reduce()) return;
  const cv = canvas(ctx), dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
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
    parts.forEach((p) => {
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
    });
    parts = parts.filter((p) => p.life > 0);
    if (parts.length) requestAnimationFrame(step);
    else {
      running = false;
      g.clearRect(0, 0, W, H);
    }
  });
}
/* Oplæsning: the child's speaker with Home Assistant's text-to-speech, otherwise the device's own voice. */
async function speak(ctx, text) {
  const spk = ctx.me?.speaker;
  const tts = ctx.entities("tts")[0];
  if (spk && tts) {
    if (await ctx.call("tts", "speak", { entity_id: tts, media_player_entity_id: spk, message: text, language: ctx.lang() === "da" ? "da" : "en" })) ctx.toast(ctx.t("Læser op …"));
    return;
  }
  try {
    if (!("speechSynthesis" in window)) throw new Error("no speech");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = ctx.lang() === "da" ? "da-DK" : "en-GB";
    u.rate = 0.95;
    speechSynthesis.speak(u);
    ctx.toast(ctx.t("Læser op …"));
  } catch (e) {
    ctx.toast(ctx.t("Oplæsning virker i Home Assistant-appen"));
  }
}

// ================================================================== Rutinetavle (the child)
function kBoard(ctx) {
  const kid = ctx.me?.id;
  if (!kid) return "";
  const B = boardOf(ctx, kid), slot = tavleSlot || slotNow(), list = B[slot] || [], done = doneOf(ctx, kid);
  const isDone = (i) => done.includes(`${slot}:${i}`);
  const left = list.map((c, i) => i).filter((i) => !isDone(i)), next = left[0];
  const pct = list.length ? (list.length - left.length) / list.length : 0, all = list.length && !left.length;
  if (!B.morgen.length && !B.eftermiddag.length && !B.aften.length)
    return `<section class="card hv-empty">${svg("star", "ic big")}<h2>${esc(ctx.t("Din tavle er tom"))}</h2><p class="t-sub">${esc(ctx.t("Far eller mor lægger kortene på din tavle under Faste rutiner."))}</p></section>`;
  return `<div class="rb" style="--kc:${esc(pc(ctx, kid))}">
    <div class="rb-slots">${RSLOTS.map(([k, n, ic, tm]) => {
      const L = B[k] || [], d = L.filter((c, i) => done.includes(`${k}:${i}`)).length, f = L.length ? d / L.length : 0, C = 2 * Math.PI * 15;
      return `<button class="rb-s${k === slot ? " on" : ""}" data-act="kids-tslot" data-id="${k}"><span class="rb-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width="3.5"/><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - f)).toFixed(1)}" transform="rotate(-90 18 18)"/></svg>${svg(ic)}</span><span><b>${esc(ctx.t(n))}</b><small>${tm}${k === slotNow() ? ` · ${esc(ctx.t("nu"))}` : ""}</small></span></button>`;
    }).join("")}</div>
    <div class="rb-bar"><i style="width:${pct * 100}%"></i><span class="num">${esc(ctx.t("{n} af {m}", { n: list.length - left.length, m: list.length }))}</span></div>
    ${all
      ? `<div class="rb-yay"><span class="rb-star">🌟</span><h2>${esc(ctx.t({ morgen: "Morgenen er klaret!", eftermiddag: "Eftermiddagen er klaret!", aften: "Aftenen er klaret!" }[slot]))}</h2><p>${esc(ctx.t("Godt gået, {name}.", { name: ctx.me.name }))}${ctx.feature(ctx.me, "points") ? ` ${esc(ctx.t("Du har fået 5 point."))}` : ""}</p></div>`
      : `<div class="rb-path">${list
          .map((cid, i) => {
            if (isDone(i)) return "";
            const c = rcard(ctx, cid);
            return `<button class="rcd${i === next ? " next" : ""}" data-act="kids-rtap" data-i="${i}" style="--cc:${catCol(c)};animation-delay:${i * 45}ms"><span class="rcd-n num">${i + 1}</span>${i === next ? `<span class="rcd-now">${esc(ctx.t("Nu"))}</span>` : ""}<span class="rcd-em">${esc(c[2])}</span><b>${esc(ctx.t(c[1]))}</b></button>`;
          })
          .join("")}</div>`}
    ${list.length - left.length ? `<div class="rb-tray"><span class="eyebrow">${esc(ctx.t("Klaret"))}</span><div class="rb-done">${list.map((cid, i) => (isDone(i) ? `<button class="rdn" data-act="kids-rundo" data-i="${i}" title="${esc(ctx.t("Fortryd {what}", { what: ctx.t(rcard(ctx, cid)[1]) }))}"><span>${esc(rcard(ctx, cid)[2])}</span><i>${svg("check")}</i></button>` : "")).join("")}</div></div>` : ""}
    <div class="rb-foot"><span>${svg("repeat")}${esc(ctx.t("Tavlen starter forfra i nat kl. 00"))}</span>${ctx.feature(ctx.me, "read") && next != null ? `<button class="btn soft sm" data-act="kids-read" data-txt="${esc(ctx.t("Nu skal du: {what}", { what: ctx.t(rcard(ctx, list[next])[1]) }))}">${svg("speaker")}${esc(ctx.t("Læs op"))}</button>` : ""}<button class="btn soft sm" data-act="kids-breset">${esc(ctx.t("Start forfra"))}</button></div></div>`;
}

// ================================================================== Mit skema
function subjColor(name) {
  const key = Object.keys(SUBJ).find((k) => String(name).toLowerCase().startsWith(k.toLowerCase()));
  if (key) return SUBJ[key];
  let h = 0;
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SUBJ_EXTRA[h % SUBJ_EXTRA.length];
}
export function skemaGrid(ctx, member) {
  const mon = addDays(mondayOf(new Date()), skemaWeek * 7);
  const evs = ctx.events([member.skema], mon, addDays(mon, 5)).filter((e) => !e.allDay);
  const loading = ctx._loading.size && !evs.length;
  let T0 = 8, T1 = 14;
  evs.forEach((e) => {
    T0 = Math.min(T0, e.start.getHours());
    T1 = Math.max(T1, Math.ceil(e.end.getHours() + e.end.getMinutes() / 60));
  });
  T1 = Math.min(T1, 18);
  const PXH = 60, Hh = (T1 - T0) * PXH;
  const tY = (d) => (d.getHours() + d.getMinutes() / 60 - T0) * PXH;
  const today = startOfDay(new Date());
  let h = `<div class="skema-wrap"><div class="skema"><span></span>`;
  for (let i = 0; i < 5; i++) {
    const d = addDays(mon, i), isToday = +d === +today, rel = Math.round((d - today) / 864e5);
    h += `<div class="sk-h${isToday ? " today" : ""}">${esc(cap(ctx.fmt.short(d)).slice(0, 3))}<small>${esc(ctx.fmt.date(d, { day: "numeric", month: "short" }))}${rel === 0 ? ` · ${esc(ctx.t("i dag"))}` : rel === 1 ? ` · ${esc(ctx.t("i morgen"))}` : ""}</small></div>`;
  }
  const hours = [];
  for (let t = T0; t <= T1; t++) hours.push(t);
  h += `<div class="sk-times" style="height:${Hh}px">${hours.map((t) => `<span style="top:${(t - T0) * PXH}px">${String(t).padStart(2, "0")}.00</span>`).join("")}</div>`;
  for (let i = 0; i < 5; i++) {
    const d = addDays(mon, i);
    const day = evs.filter((e) => +startOfDay(e.start) === +d).sort((a, b) => a.start - b.start);
    h += `<div class="sk-col" style="height:${Hh}px">`;
    // Breaks: the gaps between lessons.
    day.forEach((e, k) => {
      const n = day[k + 1];
      if (n && n.start - e.end >= 10 * 60000) h += `<div class="sk-break" style="top:${tY(e.end)}px;height:${tY(n.start) - tY(e.end)}px" title="${esc(ctx.t("Frikvarter"))}"></div>`;
    });
    day.forEach((e, li) => {
      const who = [e.location, (e.description || "").split("\n")[0]].filter(Boolean).join(" · ").slice(0, 40);
      const s = ctx.fmt.time(e.start), en = ctx.fmt.time(e.end);
      h += `<div class="sk-l" style="top:${tY(e.start) + 2}px;height:${Math.max(18, tY(e.end) - tY(e.start) - 4)}px;background:${subjColor(e.title)};animation-delay:${i * 60 + li * 40}ms" title="${esc(`${e.title} ${s}–${en}${who ? " · " + who : ""}`)}"><b>${esc(e.title)}</b><small>${esc(s)}${who ? ` · ${esc(who)}` : ""}</small></div>`;
    });
    h += `</div>`;
  }
  const calName = ctx.name(member.skema);
  h += `</div></div><div class="sk-legend"><span class="chip"><i style="background:${SUBJ.Dansk}"></i>${esc(ctx.t("Fra {cal}", { cal: calName }))}</span>${!evs.length && !loading ? `<span class="chip">${esc(ctx.t("Ingen timer i denne uge"))}</span>` : ""}<span class="chip hk-wk"><button class="iconbtn" data-act="kids-skweek" data-d="-1" aria-label="${esc(ctx.t("Forrige uge"))}">${svg("back")}</button><button class="iconbtn" data-act="kids-skweek" data-d="1" aria-label="${esc(ctx.t("Næste uge"))}">${svg("go")}</button></span></div>`;
  return h;
}
function kSkema(ctx) {
  const m = ctx.me;
  if (!m || !ctx.feature(m, "skema")) return `<section class="card"><h2>${esc(ctx.t("Skemaet er slået fra"))}</h2></section>`;
  if (!m.skema)
    return `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Mit skema"))}</h2></div><p class="t-sub">${esc(ctx.t("Far eller mor kan vælge din skemakalender, fx fra Aula, under Familieindstillinger."))}</p></section>`;
  const mon = addDays(mondayOf(new Date()), skemaWeek * 7);
  return `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Mit skema"))}</h2><span class="meta">${esc(ctx.t("Uge {n} · fra {cal}", { n: isoWeek(mon), cal: ctx.name(m.skema) }))}</span></div>${skemaGrid(ctx, m)}</section>`;
}

// ================================================================== Ønsker (Ønskeskyen)
const wishEm = (t) => {
  const s = String(t).toLowerCase();
  return s.includes("paw patrol") ? "🐶" : s.includes("hot wheels") || s.includes("bil") ? "🚗" : s.includes("brio") || s.includes("jernbane") ? "🚂" : s.includes("bog") || s.includes("børnebøger") ? "📖" : s.includes("hjelm") ? "🚲" : s.includes("dino") ? "🦕" : s.includes("puslespil") ? "🧩" : s.includes("legehus") ? "🏠" : s.includes("glas") ? "🍺" : s.includes("strik") || s.includes("shirt") ? "👕" : s.includes("hue") || s.includes("light") || s.includes("pære") ? "💡" : s.includes("camera") ? "📷" : s.includes("sand") ? "🏖️" : s.includes("spil") ? "🎲" : s.includes("bad") ? "🛁" : s.includes("tilskud") ? "💝" : "🎁";
};
/* Ønskeskyen lists shown for someone: a member id, "begge", "andre"… (settings.osky_to). */
export function wishListsFor(ctx, target) {
  const to = ctx.data?.settings?.osky_to || {};
  return (ctx.data?.osky?.lists || []).filter((l) => (to[l.id] || "") === target);
}
function syncedText(ctx, l) {
  const acc = ctx.data?.osky?.accounts?.[l.via?.[0]];
  if (!acc?.at) return ctx.t("lige nu");
  const d = new Date(acc.at), mins = Math.round((Date.now() - d) / 60000);
  if (mins < 2) return ctx.t("lige nu");
  if (mins < 60) return ctx.t("for {n} min. siden", { n: mins });
  return `${ctx.fmt.rel(d)} ${ctx.fmt.time(d)}`;
}
function canAddWish(ctx, l) {
  const to = ctx.data?.settings?.osky_to?.[l.id];
  if (ctx.isKid) return to === ctx.me?.id;
  return ctx.isParent && to !== "andre";
}
function wishForm(ctx, l) {
  const kid = ctx.isKid, owner = ctx.member(ctx.data?.settings?.osky_to?.[l.id]);
  const forKid = !kid && owner?.role === "child";
  return `<form class="wish-add" data-wishform="${esc(l.id)}" autocomplete="off">
    <div class="wa-h"><b>${esc(kid ? ctx.t("Hvad ønsker du dig?") : forKid ? ctx.t("Nyt ønske til {name}", { name: owner.name }) : ctx.t("Nyt ønske"))}</b><button type="button" class="iconbtn" data-act="kids-wishadd" data-id="${esc(l.id)}" aria-label="${esc(ctx.t("Luk"))}">${svg("x")}</button></div>
    ${kid ? `<div class="wa-emo" role="radiogroup" aria-label="${esc(ctx.t("Vælg et billede"))}">${WISH_EMO.map((e) => `<button type="button" data-emo="${e}" aria-pressed="${e === wishEmo}">${e}</button>`).join("")}</div>` : ""}
    <label class="field"><span class="lbl">${esc(kid ? ctx.t("Mit ønske") : ctx.t("Ønske"))}</span><input name="t" required maxlength="90" placeholder="${esc(kid ? ctx.t("Fx en dinosaur-bog") : ctx.t("Fx LEGO Technic 42151"))}"></label>
    ${kid ? "" : `<div class="wa-2"><label class="field"><span class="lbl">${esc(ctx.t("Pris"))}</span><input name="p" inputmode="decimal" placeholder="${esc(ctx.t("Valgfri"))}"></label><label class="field"><span class="lbl">${esc(ctx.t("Link"))}</span><input name="s" type="url" placeholder="https://"></label></div>`}
    <div class="wa-f"><button class="btn" type="submit">${svg("plus")}${esc(kid ? ctx.t("Sæt på min ønskeseddel") : ctx.t("Tilføj ønske"))}</button></div>
    <small class="t-sub">${esc(kid ? ctx.t("Far eller mor kan se det med det samme.") : ctx.t("Ønsket lægges også i Ønskeskyen."))}</small></form>`;
}
function wishCard(ctx, l, w, i) {
  const kid = ctx.isKid;
  const q = w.price != null ? `${ctx.fmt.num(w.price, w.price % 1 ? 2 : 0)} ${w.currency === "DKK" || !w.currency ? "kr" : esc(w.currency)}` : "";
  const em = w.em || (kid && w.emo) || wishEm(w.title);
  const inShop = (ctx.data?.rewards || []).some((r) => r.title === w.title);
  // "Gør til mål" only on a child's wish list, as in the prototype.
  const toKid = ctx.member(ctx.data?.settings?.osky_to?.[l.id])?.role === "child";
  return `<div class="wish${w.fresh ? " fresh" : ""}" style="animation-delay:${i * 60}ms"><span class="thumb">${w.photo ? `<img src="${esc(w.photo)}" alt="" loading="lazy">` : esc(em)}</span><div style="min-width:0"><div class="t-ttl">${esc(w.title)}</div><div class="t-sub">${esc(w.shop || "")}<span class="num">${q ? (w.shop ? " · " : "") + esc(q) : ""}</span></div>${!kid && w.reserved ? `<span class="res">${svg("lock")}${esc(ctx.t("Reserveret"))}</span>` : ""}</div>
    <div class="wish-b">${kid || !ctx.isParent || !toKid ? "" : `<button class="btn soft sm" data-act="kids-wish2shop" data-list="${esc(l.id)}" data-i="${i}" ${inShop ? "disabled" : ""}>${inShop ? esc(ctx.t("Er et mål i shoppen")) : `${STAR}${esc(ctx.t("Gør til mål"))}`}</button>`}${w.url && !kid ? `<a class="iconbtn" href="${esc(w.url)}" target="_blank" rel="noopener" aria-label="${esc(ctx.t("Åbn {what}", { what: w.title }))}">${svg("link")}</a>` : ""}</div></div>`;
}
/* One Ønskeskyen list as the prototype's card. Exported for the Lists page. */
export function onskeCard(ctx, l) {
  const kid = ctx.isKid, wishes = l.wishes || [], res = wishes.filter((w) => w.reserved).length, can = canAddWish(ctx, l);
  const owner = ctx.member(ctx.data?.settings?.osky_to?.[l.id]);
  return `<section class="card">
    <div class="card-head"><h2>${esc(l.title)}</h2><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="osky">${svg("cloudy")}Ønskeskyen</span><button class="iconbtn" data-act="kids-osync" aria-label="${esc(ctx.t("Hent igen fra Ønskeskyen"))}">${svg("repeat")}</button>${kid ? "" : `<button class="btn soft sm" data-act="kids-oshare" data-id="${esc(l.id)}">${svg("share")}${esc(ctx.t("Del"))}</button>`}</div></div>
    <div class="t-sub" style="margin:-8px 0 12px">${esc(ctx.t("Hentet fra Ønskeskyen {when}", { when: syncedText(ctx, l) }))}${kid ? "" : ` · ${esc(ctx.t("{n} ønsker", { n: l.count ?? wishes.length }))} · ${esc(ctx.t("{n} reserveret", { n: res }))}`}</div>
    ${can ? (wishAdd === l.id ? wishForm(ctx, l) : `<button class="wish-new${kid ? " kid" : ""}" data-act="kids-wishadd" data-id="${esc(l.id)}"><span>${svg("plus")}</span><b>${esc(kid ? ctx.t("Ønsk dig noget") : owner?.role === "child" ? ctx.t("Tilføj et ønske til {name}", { name: owner.name }) : ctx.t("Tilføj et ønske"))}</b></button>`) : ""}
    <div class="wishes">${wishes.map((w, i) => wishCard(ctx, l, w, i)).join("") || `<div class="t-sub">${esc(l.count ? ctx.t("{n} ønsker hentes fra Ønskeskyen …", { n: l.count }) : ctx.t("Ingen ønsker endnu."))}</div>`}</div>
    <div class="osky-foot"><span>${esc(can ? (kid ? ctx.t("Dine ønsker kommer også på din børneprofil i Ønskeskyen.") : ctx.t("Ønsker du tilføjer her, lægges i Ønskeskyen. Reservationer laves i Ønskeskyen.")) : ctx.t("Ønskesedlen ejes af en anden. Nye ønsker og reservationer laves i Ønskeskyen."))}</span><a class="btn sm" href="https://onskeskyen.dk/da/wishlists/${encodeURIComponent(l.id)}" target="_blank" rel="noopener">${esc(kid ? ctx.t("Åbn min børneprofil") : ctx.t("Åbn i Ønskeskyen"))} ›</a></div>
  </section>`;
}
function kWish(ctx) {
  const m = ctx.me;
  if (!m || !ctx.feature(m, "wish")) return `<section class="card"><h2>${esc(ctx.t("Ønskesedlen er slået fra"))}</h2><p class="t-sub">${esc(ctx.t("Far eller mor kan slå den til."))}</p></section>`;
  const lists = wishListsFor(ctx, m.id);
  if (!lists.length)
    return `<section class="card"><h2>${esc(ctx.t("Mine ønsker"))}</h2><p class="t-sub">${esc(ctx.t("Du har ikke en ønskeseddel her endnu. Bed far eller mor om at forbinde din børneprofil i Ønskeskyen."))}</p></section>`;
  return lists.map((l) => onskeCard(ctx, l)).join(`<div style="height:16px"></div>`);
}

// ================================================================== Faste rutiner (parents)
function pRoutines(ctx) {
  const tabs = [["opgaver", "Faste opgaver", "🧺"], ["hent", "Hent og bring", "🚗"], ...(ctx.on("board") ? [["tavle", "Rutinetavle", "🌈"]] : [])];
  if (!tabs.some((t) => t[0] === rtab)) rtab = "opgaver";
  const body = { opgaver: rChores, hent: rPickup, tavle: rBuilder }[rtab](ctx);
  return `<div class="rt-tabs" role="tablist">${tabs.map(([k, n, em]) => `<button role="tab" data-act="kids-rtab" data-id="${k}" aria-selected="${k === rtab}"><span>${em}</span>${esc(ctx.t(n))}</button>`).join("")}</div>
  <div class="hk-rbody" style="margin-top:14px">${body}</div>`;
}

// ---------------------------------------------------------------- faste opgaver (missions with days)
/* For a child with two homes: in which home a fixed task applies. */
const whereText = (ctx, p, w) => (w === "always" ? `🏠🚗 ${ctx.t("Begge hjem")}` : w === "away" ? `🚗 ${p.custody?.away || ctx.t("Det andet hjem")}` : `🏠 ${p.custody?.here || ctx.t("Hjemme hos os")}`);
function rChores(ctx) {
  const people = ctx.members();
  if (!people.length) return `<section class="card"><p class="t-sub">${esc(ctx.t("Tilføj familien først."))}</p></section>`;
  if (!people.some((p) => p.id === rWho)) rWho = (ctx.children()[0] || people[0]).id;
  const p = ctx.member(rWho), all = ctx.data.missions || [], mine = all.filter((r) => r.member === rWho);
  const pts = p.role === "child" && ctx.feature(p, "points"), two = !!p.custody?.enabled;
  return `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Hvem?"))}</h2><span class="meta">${esc(ctx.t("{n} faste opgaver i familien", { n: all.length }))}</span></div>
    <div class="filters">${people.map((x) => `<button class="fchip" data-act="kids-rwho" data-id="${esc(x.id)}" aria-pressed="${x.id === rWho}" style="--fc:${esc(x.color)}">${ctx.avatar(x.id)}${esc(x.name)}<small class="num" style="opacity:.6">${all.filter((r) => r.member === x.id).length}</small></button>`).join("")}</div></section>
  <div class="grid" style="margin-top:16px">
  <section class="card s7"><div class="card-head"><h2>${esc(ctx.t("{name}s faste opgaver", { name: p.name }))}</h2><span class="meta">${esc(ctx.t("Tryk på dagene"))}</span></div>
    <div class="rc-list">${mine.map((r) => `<div class="rcr" style="--pc:${esc(p.color)}"><span class="rc-em">${esc(r.emoji || "⭐")}</span><div class="rcr-t"><b>${esc(r.title)}</b><span class="wd">${WD.map((d, k) => `<button data-act="kids-rday" data-id="${esc(r.id)}" data-d="${k}" aria-pressed="${r.days.includes(k)}" aria-label="${esc(ctx.t(WD_LONG[k]))}">${esc(ctx.t(d))}</button>`).join("")}</span>${two ? `<button class="rc-where" data-act="kids-rwhere" data-id="${esc(r.id)}">${esc(whereText(ctx, p, r.where || "here"))}</button>` : ""}</div>
      ${pts ? `<span class="step"><button data-act="kids-rpts" data-id="${esc(r.id)}" data-d="-5" aria-label="${esc(ctx.t("Færre point"))}">−</button><b class="num">${r.points}</b>${STAR}<button data-act="kids-rpts" data-id="${esc(r.id)}" data-d="5" aria-label="${esc(ctx.t("Flere point"))}">+</button></span>` : "<span></span>"}
      <button class="iconbtn" data-act="kids-rdel" data-id="${esc(r.id)}" aria-label="${esc(ctx.t("Fjern {what}", { what: r.title }))}">${svg("x")}</button></div>`).join("") || `<p class="t-sub">${esc(ctx.t("Ingen faste opgaver endnu. Tryk på en opgave til højre."))}</p>`}</div>
    <div class="t-sub" style="margin-top:12px">${esc(pts ? ctx.t("Faste opgaver dukker selv op på de valgte dage og giver point, når de er klaret.") : ctx.t("Faste opgaver dukker selv op på de valgte dage."))} ${esc(ctx.t("Genvej:"))} <button class="lnk" data-act="kids-rall" data-d="hverdage">${esc(ctx.t("alle på hverdage"))}</button> · <button class="lnk" data-act="kids-rall" data-d="hver">${esc(ctx.t("alle hver dag"))}</button></div></section>
  <section class="card s5"><div class="card-head"><h2>${esc(ctx.t("Tryk for at tilføje"))}</h2></div>
    <div class="chore-grid">${CHORES.map(([t, em]) => {
      const has = mine.some((r) => r.title === ctx.t(t) || r.title === t);
      return `<button class="chore${has ? " has" : ""}" data-act="kids-radd" data-id="${esc(t)}">${has ? `<i>${svg("check")}</i>` : ""}<span>${em}</span>${esc(ctx.t(t))}</button>`;
    }).join("")}</div>
    <form class="add" data-kidsform="rown"><input name="t" placeholder="${esc(ctx.t("Egen opgave"))}" autocomplete="off"><button class="btn" type="submit">${svg("plus")}${esc(ctx.t("Tilføj"))}</button></form></section></div>`;
}
function newMissionId(list, title) {
  let base = slug(title).replace(/_/g, "-").slice(0, 40) || "opgave";
  if (!/^[a-z0-9]/.test(base)) base = "m" + base;
  let id = base, n = 2;
  while (list.some((m) => m.id === id)) id = `${base}-${n++}`;
  return id;
}
async function saveMissions(ctx, list) {
  ctx.data.missions = list;
  ctx.render();
  return ctx.save("missions", list);
}

// ---------------------------------------------------------------- hent og bring
function rPickup(ctx) {
  const kids = ctx.children();
  if (!kids.length) return `<section class="card"><p class="t-sub">${esc(ctx.t("Der er ingen børn i familien endnu."))}</p></section>`;
  if (!kids.some((k) => k.id === hbKid)) hbKid = kids[0].id;
  const wk = hbWk(), kid = ctx.member(hbKid), K = hbPlan(ctx, hbKid, wk), mon = mondayOf(addDays(new Date(), (hbWeek || 0) * 7)), H = helpers(ctx);
  const sec = (t, title, sub, ic) => `<section class="hb-sec hb-${t}"><div class="hb-sh"><span class="hb-si">${svg(ic)}</span><div><h3>${esc(title)}</h3><small>${esc(sub)}</small></div></div>
    <div class="hb-rows">${K[t].map(([who, tm], d) => {
      const w = hbWho(ctx, who), mor = who === "mor";
      const own = K[t][d][2], away = wk && !ctx.atHome(kid, addDays(mon, d));
      return `<button class="hb-row${mor ? " mor" : ""}${who ? "" : " none"}${own ? " own" : ""}${away ? " away" : ""}" data-act="kids-hbday" data-t="${t}" data-d="${d}" ${mor ? "disabled" : ""} style="--hc:${esc(w.c)};animation-delay:${d * 40}ms">
      <span class="hb-day"><b>${esc(ctx.t(HB_DAYS[d]).slice(0, 3))}</b>${wk ? `<small>${ddmm(addDays(mon, d))}</small>` : ""}</span>${hbAv(ctx, who)}<span class="hb-nm">${esc(w.name)}${away ? `<small>${esc(ctx.homeLabel(kid, addDays(mon, d)))}</small>` : mor ? `<small>${esc(ctx.t("fra kalenderen"))}</small>` : own ? `<small>${esc(ctx.t("kun denne uge"))}</small>` : ""}</span><span class="hb-tm num">${mor || !who ? "" : hhmmDot(tm)}</span>${mor ? "" : svg("chev")}</button>`;
    }).join("")}</div>
    <div class="hb-week"><small>${esc(ctx.t("Hele ugen:"))}</small>${H.map((h) => `<button data-act="kids-hbweek" data-t="${t}" data-id="${esc(h.id)}" style="--hc:${esc(hbWho(ctx, h.id).c)}" title="${esc(ctx.t("{name} alle dage", { name: h.name }))}">${hbAv(ctx, h.id, "sm")}</button>`).join("")}</div></section>`;
  const instName = ctx.t(INST[kid.institution] || INST.none).toLowerCase();
  const others = kids.filter((k) => k.id !== hbKid);
  const rel = hbWeek === 0 ? ctx.t("denne uge") : hbWeek === 1 ? ctx.t("næste uge") : hbWeek === -1 ? ctx.t("sidste uge") : "";
  const ownDays = wk ? [...K.bring, ...K.hent].filter((r) => r[2]).length : 0;
  const weekBar = `<section class="card hb-wk"><div class="hb-wnav"><button class="hb-fix" data-act="kids-hbwk" data-w="fixed" aria-pressed="${!wk}">${svg("repeat")}${esc(ctx.t("Fast plan"))}</button>
      <div class="hb-wsel${wk ? " on" : ""}"><button class="iconbtn" data-act="kids-hbwk" data-w="-1" aria-label="${esc(ctx.t("Ugen før"))}">${svg("back")}</button><button class="hb-wlbl" data-act="kids-hbwk" data-w="now"><b>${esc(ctx.t("Uge {n}", { n: isoWeek(mon) }))}</b><small>${esc(`${ddmm(mon)}–${ddmm(addDays(mon, 4))}${rel ? " · " + rel : ""}`)}</small></button><button class="iconbtn" data-act="kids-hbwk" data-w="+1" aria-label="${esc(ctx.t("Ugen efter"))}">${svg("go")}</button></div></div>
    <p class="t-sub hb-wtxt">${esc(wk ? (ownDays ? ctx.t("Ugen følger den faste plan, undtagen {n} ændringer, der kun gælder denne uge.", { n: ownDays }) : ctx.t("Ugen følger den faste plan. Ændringer her gælder kun denne uge.")) : ctx.t("Den faste plan gælder hver uge, til en uge får sin egen plan."))}</p>
    <div class="hb-wacts">${wk ? `<button class="btn soft sm" data-act="kids-hbcopy">${svg("repeat")}${esc(ctx.t("Kopiér fra ugen før"))}</button>${ownDays ? `<button class="btn soft sm" data-act="kids-hbreset">${esc(ctx.t("Brug den faste plan"))}</button><button class="btn soft sm" data-act="kids-hbfix">${svg("check")}${esc(ctx.t("Gør ugen til fast plan"))}</button>` : ""}` : ""}${others.map((o) => `<button class="btn soft sm" data-act="kids-hbsame" data-id="${esc(o.id)}">${ctx.avatar(o.id)}${esc(ctx.t("Samme som {name}", { name: o.name }))}</button>`).join("")}</div></section>`;
  return `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Hvilket barn?"))}</h2><span class="meta">${esc(wk ? ctx.t("Uge {n}", { n: isoWeek(mon) }) : ctx.t("Fast plan"))}</span></div>
    <div class="hb-kids">${kids.map((k) => {
      const P2 = hbPlan(ctx, k.id, wk), n = [...P2.bring, ...P2.hent].filter((r) => r[0] && r[0] !== "mor").length;
      return `<button class="hb-kid" data-act="kids-hbkid" data-id="${esc(k.id)}" aria-pressed="${k.id === hbKid}" style="--pc:${esc(k.color)}">${ctx.avatar(k.id)}<span><b>${esc(k.name)}</b><small>${esc(ctx.t("{n} ture", { n }))}</small></span></button>`;
    }).join("")}</div></section>
  ${weekBar}
  <div class="hb-two" style="--pc:${esc(kid.color)}">${sec("bring", ctx.t("Bring {name}", { name: kid.name }), ctx.t("Om morgenen"), "sunrise")}${sec("hent", ctx.t("Hent {name}", { name: kid.name }), ctx.t("Fra {inst}", { inst: instName }), "pickup")}</div>
  ${[...K.bring, ...K.hent].some((r) => r[0] === "mor") ? `<p class="t-sub" style="margin:10px 2px 0">${esc(ctx.t("Dage, hvor {name} er hos sin mor, kommer fra kalenderen og kan ikke ændres her.", { name: kid.name }))}</p>` : ""}
  <section class="card" style="margin-top:16px"><div class="card-head"><h2>${esc(ctx.t("Hvem henter og bringer"))}</h2><button class="btn soft sm" data-act="kids-hbhelper">${svg("plus")}${esc(ctx.t("Tilføj"))}</button></div>
    <div class="hb-helpers">${H.map((h) => `<div class="hb-hp" style="--hc:${esc(hbWho(ctx, h.id).c)}">${hbAv(ctx, h.id)}<span><b>${esc(h.name)}</b><small>${esc(ctx.t("{n} ture om ugen", { n: hbTrips(ctx, h.id) }))}</small></span><button class="iconbtn" data-act="kids-hbhelper" data-id="${esc(h.id)}" aria-label="${esc(ctx.t("Ret {name}", { name: h.name }))}">${svg("edit")}</button></div>`).join("")}</div>
    <label class="optrow" style="margin:14px 0 0"><span>${esc(ctx.t("Besked om morgenen til den, der henter eller bringer"))}</span><button type="button" class="toggle" data-act="kids-hbrem" aria-pressed="${ctx.data.settings.pickup_reminder !== false}" aria-label="${esc(ctx.t("Besked om morgenen"))}"></button></label></section>`;
}
function hbDaySheet(ctx, t, d) {
  const wk = hbWk(), kid = ctx.member(hbKid), K = hbPlan(ctx, hbKid, wk)[t], [cur, tm] = K[d], days = new Set([d]);
  const s = ctx.sheet(`<div class="eyebrow">${esc(t === "bring" ? ctx.t("Bring om morgenen") : ctx.t("Hent efter skole"))}</div><h2>${esc(t === "bring" ? ctx.t("Bring {name} · {day}", { name: kid.name, day: ctx.t(WD_LONG[d]) }) : ctx.t("Hent {name} · {day}", { name: kid.name, day: ctx.t(WD_LONG[d]) }))}</h2>
    <div class="hb-pick">${[...helpers(ctx).map((h) => h.id), ""].map((id) => {
      const w = hbWho(ctx, id);
      return `<button data-who="${esc(id)}" aria-pressed="${id === cur}" style="--hc:${esc(w.c)}">${hbAv(ctx, id)}<b>${esc(w.name)}</b></button>`;
    }).join("")}</div>
    <div class="field" style="margin-top:14px"><label for="hk-tm">${esc(ctx.t("Tidspunkt"))}</label><input id="hk-tm" type="time" lang="da" value="${esc(tm)}" step="300"></div>
    <div class="t-sub" style="margin:14px 0 6px">${esc(ctx.t("Gælder også"))}</div><div class="wd hb-wd" style="--pc:${esc(kid.color)}">${HB_DAYS.map((n, k) => `<button data-day="${k}" aria-pressed="${k === d}" ${K[k][0] === "mor" ? "disabled" : ""} aria-label="${esc(ctx.t(n))}">${esc(ctx.t(n).charAt(0))}</button>`).join("")}</div>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" data-hksave>${esc(ctx.t("Gem"))}</button></div>`);
  let who = cur;
  s.el.addEventListener("click", (e) => {
    const w = e.target.closest("[data-who]");
    if (w) {
      who = w.dataset.who;
      s.el.querySelectorAll("[data-who]").forEach((x) => x.setAttribute("aria-pressed", String(x === w)));
      return;
    }
    const dy = e.target.closest("[data-day]");
    if (dy) {
      const k = +dy.dataset.day;
      days.has(k) ? days.delete(k) : days.add(k);
      dy.setAttribute("aria-pressed", String(days.has(k)));
      return;
    }
    if (e.target.closest("[data-hksave]")) {
      const time = s.el.querySelector("#hk-tm").value || tm;
      s.close();
      saveRoutines(ctx, (r) => {
        days.forEach((k) => K[k][0] !== "mor" && setPlan(r, hbKid, t, k, who, time, wk));
        pruneWeeks(r);
      });
      const what = days.size > 1 ? ctx.t("{n} dage", { n: days.size }) : ctx.t(WD_LONG[d]);
      ctx.toast(t === "bring" ? ctx.t("{who} bringer {kid} {when} kl. {time}", { who: hbWho(ctx, who).name, kid: kid.name, when: what, time: hhmmDot(time) }) : ctx.t("{who} henter {kid} {when} kl. {time}", { who: hbWho(ctx, who).name, kid: kid.name, when: what, time: hhmmDot(time) }));
    }
  });
}
function hbHelperSheet(ctx, id) {
  const H = helpers(ctx), h = id ? H.find((x) => x.id === id) : null, isPerson = !!h?.member;
  const used = HB_COLORS.filter((c) => !H.some((x) => x.color === c));
  let col = h ? h.color || null : used[0] || HB_COLORS[0];
  const s = ctx.sheet(`<div class="eyebrow">${esc(ctx.t("Hent og bring"))}</div><h2>${esc(h ? ctx.t("Ret {name}", { name: h.name }) : ctx.t("Tilføj en, der henter"))}</h2>
    <div class="field"><label for="hk-nm">${esc(ctx.t("Navn"))}</label><input id="hk-nm" value="${h ? esc(h.name) : ""}" placeholder="${esc(ctx.t("Fx Morfar, Farmor, nabo"))}" autocomplete="off"${isPerson ? " disabled" : ""}></div>
    ${isPerson ? `<p class="t-sub" style="margin-top:10px">${esc(ctx.t("{name} er en person i Home Assistant og bruger sin egen farve og sit eget billede.", { name: h.name }))}</p>` : `<div class="t-sub" style="margin:14px 0 6px">${esc(ctx.t("Farve"))}</div><div class="hb-sw">${HB_COLORS.map((c) => `<button data-col="${c}" aria-pressed="${c === col}" style="--hc:${c}" aria-label="${esc(ctx.t("Farve"))}"></button>`).join("")}</div>`}
    <div class="sheet-actions">${h ? `<button class="btn danger" data-hkdel>${svg("trash")}${esc(ctx.t("Fjern"))}</button>` : ""}<button class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" data-hkok>${esc(h ? ctx.t("Gem") : ctx.t("Tilføj"))}</button></div>`);
  const base = () => H.map((x) => (x.member ? { id: x.id, name: x.name } : { id: x.id, name: x.name, color: x.color }));
  s.el.addEventListener("click", (e) => {
    const c = e.target.closest("[data-col]");
    if (c) {
      col = c.dataset.col;
      s.el.querySelectorAll("[data-col]").forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      return;
    }
    if (e.target.closest("[data-hkok]")) {
      const nm = s.el.querySelector("#hk-nm").value.trim();
      if (!nm) return s.el.querySelector("#hk-nm").focus();
      s.close();
      saveRoutines(ctx, (r) => {
        r.helpers = base();
        if (h) {
          const x = r.helpers.find((y) => y.id === h.id);
          if (!isPerson) Object.assign(x, { name: nm.slice(0, 30), color: col || x.color });
        } else {
          let nid = slug(nm).replace(/_/g, "-").slice(0, 40) || "hjaelper";
          if (!/^[a-z0-9]/.test(nid)) nid = "h" + nid;
          while (r.helpers.some((y) => y.id === nid) || ctx.member(nid)) nid += "-2";
          r.helpers.push({ id: nid, name: nm.slice(0, 30), color: col || HB_COLORS[0] });
        }
      });
      ctx.toast(h ? ctx.t("{name} er rettet", { name: nm }) : ctx.t("{name} kan nu hente og bringe", { name: nm }));
    }
    if (e.target.closest("[data-hkdel]")) {
      const n = hbTrips(ctx, id);
      s.close();
      saveRoutines(ctx, (r) => {
        r.helpers = base().filter((x) => x.id !== id);
        for (const kid of Object.values(r.pickups)) for (const day of Object.values(kid)) for (const t of ["bring", "hent"]) if (day?.[t]?.who === id) day[t].who = "";
      });
      ctx.toast(n ? ctx.t("{name} er fjernet · {n} ture mangler nu en, der henter eller bringer", { name: h.name, n }) : ctx.t("{name} er fjernet", { name: h.name }));
    }
  });
  setTimeout(() => s.el.querySelector("#hk-nm")?.focus({ preventScroll: true }), 30);
}

// ---------------------------------------------------------------- rutinetavle-byggeren
function rBuilder(ctx) {
  const kids = ctx.children();
  if (!kids.length) return `<section class="card"><p class="t-sub">${esc(ctx.t("Der er ingen børn i familien endnu."))}</p></section>`;
  if (!kids.some((k) => k.id === bKid)) bKid = kids[0].id;
  const kid = ctx.member(bKid), B = boardOf(ctx, bKid), cats = ["alle", ...Object.keys(RCAT)];
  const pal = [...RCARDS, ...routines(ctx).cards].filter((c) => bCat === "alle" || c[3] === bCat);
  const on = { ...{ board: false }, ...(kid.features || {}) }.board !== false && !!(kid.features || {}).board;
  return `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Rutinetavle"))}</h2><div style="display:flex;gap:8px;align-items:center"><span class="meta">${esc(ctx.t("Slået til for {name}", { name: kid.name }))}</span><button class="toggle" data-act="kids-bmod" aria-pressed="${on}" aria-label="${esc(ctx.t("Rutinetavle for {name}", { name: kid.name }))}" style="--tc:${esc(kid.color)}"></button></div></div>
    <div class="filters">${kids.map((k) => `<button class="fchip" data-act="kids-bkid" data-id="${esc(k.id)}" aria-pressed="${k.id === bKid}" style="--fc:${esc(k.color)}">${ctx.avatar(k.id)}${esc(k.name)}</button>`).join("")}<button class="btn soft sm" data-act="kids-seeas" data-id="${esc(bKid)}" style="margin-left:auto">${svg("user")}${esc(ctx.t("Se som {name}", { name: kid.name }))}</button></div>
    <p class="t-sub" style="margin:12px 0 0">${esc(ctx.t("Træk kort fra paletten ind i en rutine, eller tryk på et kort for at lægge det i den valgte rutine. Træk et kort ud af rutinen for at fjerne det. Tavlen starter forfra hver nat kl. 00."))}</p></section>
  <div class="bb" style="--pc:${esc(kid.color)}">
    <div class="bb-seg">${RSLOTS.map(([k, n]) => `<button data-act="kids-bzone" data-id="${k}" aria-pressed="${k === bZone}">${esc(ctx.t(n))} <small class="num">${B[k].length}</small></button>`).join("")}</div>
    <div class="bb-cols">${RSLOTS.map(([k, n, ic, tm]) => `<section class="bb-col${k === bZone ? " active" : ""}" data-zone="${k}"><button class="bb-h" data-act="kids-bzone" data-id="${k}">${svg(ic)}<b>${esc(ctx.t(n))}</b><small>${tm}</small><span class="num">${B[k].length}</span></button>
      <div class="bb-list">${B[k].map((cid, i) => {
        const c = rcard(ctx, cid);
        return `<div class="bb-card" data-drag="${esc(cid)}" data-from="${k}" data-idx="${i}" style="--cc:${catCol(c)}"><span class="bb-n num">${i + 1}</span><span class="bb-em">${esc(c[2])}</span><b>${esc(ctx.t(c[1]))}</b><button class="iconbtn" data-act="kids-bdel" data-id="${k}" data-i="${i}" aria-label="${esc(ctx.t("Fjern {what}", { what: ctx.t(c[1]) }))}">${svg("x")}</button></div>`;
      }).join("")}<div class="bb-drop">${svg("plus")}${esc(ctx.t("Træk kort hertil"))}</div></div></section>`).join("")}</div>
    <section class="bb-pal card"><div class="card-head"><h2>${esc(ctx.t("Kort"))}</h2><span class="meta">${esc(ctx.t("{n} kort", { n: pal.length }))}</span></div>
      <div class="bb-cats">${cats.map((c) => `<button data-act="kids-bcat" data-id="${c}" aria-pressed="${c === bCat}" style="--cc:${c === "alle" ? "var(--ink)" : RCAT[c][0]}">${esc(c === "alle" ? ctx.t("Alle") : ctx.t(RCAT[c][1]))}</button>`).join("")}</div>
      <div class="pal">${pal.map((c) => `<button class="pc" data-drag="${esc(c[0])}" data-act="kids-badd" data-id="${esc(c[0])}" style="--cc:${catCol(c)}"><span>${esc(c[2])}</span>${esc(ctx.t(c[1]))}</button>`).join("")}</div>
      <form class="add" data-kidsform="bown"><input name="e" value="⭐" maxlength="4" style="flex:0 0 56px;min-width:56px;text-align:center" aria-label="${esc(ctx.t("Billede"))}"><input name="t" placeholder="${esc(ctx.t("Eget kort, fx Svømmetaske"))}" autocomplete="off"><button class="btn" type="submit">${svg("plus")}${esc(ctx.t("Lav kort"))}</button></form></section>
  </div>`;
}
/* Changing a board starts the child's day over on it (like the prototype): the done marks of the day go. */
function boardChange(ctx, mutate) {
  return saveRoutines(ctx, (r) => {
    const b = (r.boards[bKid] ||= { morgen: [], eftermiddag: [], aften: [] });
    for (const k of ["morgen", "eftermiddag", "aften"]) b[k] ||= [];
    mutate(b, r);
  });
}

// ------------------------------------------------------------------ drag and drop (the board builder)
function onDown(ctx, e) {
  const el = e.target.closest?.("[data-drag]");
  if (!el || e.button > 0 || e.target.closest(".iconbtn") || ctx.view !== "rutiner") return;
  if (e.pointerType === "mouse") e.preventDefault();
  drag = { el, id: el.dataset.drag, from: el.dataset.from || null, idx: el.dataset.idx != null ? +el.dataset.idx : null, x: e.clientX, y: e.clientY, on: false, touch: e.pointerType === "touch" };
  if (drag.touch) drag.timer = setTimeout(() => drag && !drag.on && startDrag(ctx, drag.x, drag.y), 260);
}
function startDrag(ctx, x, y) {
  drag.on = true;
  const r = drag.el.getBoundingClientRect();
  drag.dx = x - r.left;
  drag.dy = y - r.top;
  const g = drag.el.cloneNode(true);
  g.classList.add("ghost-drag");
  g.style.width = r.width + "px";
  g.style.left = x - drag.dx + "px";
  g.style.top = y - drag.dy + "px";
  ctx.root.appendChild(g);
  drag.g = g;
  if (drag.from) drag.el.classList.add("lifted");
  ctx.host.classList.add("dragging");
  try {
    navigator.vibrate?.(15);
  } catch (err) {
    /* no vibration */
  }
}
function onMove(ctx, e) {
  if (!drag) return;
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (!drag.on) {
    drag.sx ??= e.clientX;
    drag.sy ??= e.clientY;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 7) {
      if (drag.touch) {
        clearTimeout(drag.timer);
        drag = null;
      } else startDrag(ctx, e.clientX, e.clientY);
    }
    return;
  }
  drag.g.style.left = e.clientX - drag.dx + "px";
  drag.g.style.top = e.clientY - drag.dy + "px";
  const edge = 70, v = e.clientY < edge + 60 ? -1 : e.clientY > innerHeight - edge ? 1 : 0;
  if (v && !drag.scroller) drag.scroller = setInterval(() => drag?.on && ctx.host.scrollBy(0, (drag.y < edge + 60 ? -1 : drag.y > innerHeight - edge ? 1 : 0) * 14), 16);
  if (!v && drag.scroller) {
    clearInterval(drag.scroller);
    drag.scroller = null;
  }
  ctx.qa(".bb-col.over").forEach((z) => z.classList.remove("over"));
  ctx.qa(".bb-ph").forEach((z) => z.remove());
  const under = ctx.root.elementFromPoint(e.clientX, e.clientY), zone = under?.closest(".bb-col");
  if (zone) {
    zone.classList.add("over");
    const list = zone.querySelector(".bb-list"), cards = [...list.querySelectorAll(".bb-card:not(.lifted)")];
    const at = cards.findIndex((c) => {
      const r = c.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });
    const ph = document.createElement("div");
    ph.className = "bb-ph";
    at < 0 ? list.insertBefore(ph, list.querySelector(".bb-drop")) : list.insertBefore(ph, cards[at]);
    drag.zone = zone.dataset.zone;
    drag.at = at < 0 ? cards.length : at;
  } else drag.zone = null;
}
function onUp(ctx) {
  if (!drag) return;
  clearTimeout(drag.timer);
  clearInterval(drag.scroller);
  const d = drag;
  drag = null;
  if (!d.on) return;
  d.g.remove();
  ctx.host.classList.remove("dragging");
  suppressClick = true;
  setTimeout(() => (suppressClick = false), 50);
  if (!d.zone && d.from == null) return ctx.render();
  const name = ctx.t(rcard(ctx, d.id)[1]);
  boardChange(ctx, (b) => {
    if (d.from != null) b[d.from].splice(d.idx, 1);
    if (d.zone) b[d.zone].splice(Math.min(d.at, b[d.zone].length), 0, d.id);
  });
  if (d.zone) {
    bZone = d.zone;
    ctx.toast(ctx.t("{what} er lagt i {slot}", { what: name, slot: ctx.t(RSLOTS.find((x) => x[0] === d.zone)[1]).toLowerCase() }));
  } else ctx.toast(ctx.t("{what} er fjernet", { what: name }));
}

// ------------------------------------------------------------------ acts
const acts = {
  // the child's board
  "kids-tslot": (el, e, ctx) => {
    tavleSlot = el.dataset.id;
    ctx.render();
  },
  "kids-rtap": async (el, e, ctx) => {
    const kid = ctx.me?.id, slot = tavleSlot || slotNow(), i = +el.dataset.i;
    if (!kid) return;
    const r = el.getBoundingClientRect();
    el.classList.add("away");
    burst(ctx, r.left + r.width / 2, r.top + r.height / 2, getComputedStyle(el).getPropertyValue("--cc").trim() || "#11A39A", 22);
    const D = (ctx.data.board_done ||= {});
    const mine = (D[kid] = [...(D[kid] || [])]);
    if (!mine.includes(`${slot}:${i}`)) mine.push(`${slot}:${i}`);
    const L = boardOf(ctx, kid)[slot];
    if (L.every((c, k) => mine.includes(`${slot}:${k}`))) setTimeout(() => burst(ctx, innerWidth / 2, innerHeight / 3, ctx.me.color, 60), 420);
    setTimeout(() => ctx.render(), 380);
    try {
      const res = await ctx.ws("board", { member: kid, slot, index: i, done: true });
      D[kid] = res.done;
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
  "kids-rundo": async (el, e, ctx) => {
    const kid = ctx.me?.id, slot = tavleSlot || slotNow(), i = +el.dataset.i;
    const D = (ctx.data.board_done ||= {});
    D[kid] = (D[kid] || []).filter((k) => k !== `${slot}:${i}`);
    ctx.render();
    await ctx.ws("board", { member: kid, slot, index: i, done: false });
  },
  "kids-breset": async (el, e, ctx) => {
    const kid = ctx.me?.id, slot = tavleSlot || slotNow();
    const D = (ctx.data.board_done ||= {});
    const idx = (D[kid] || []).filter((k) => k.startsWith(slot + ":") && !k.endsWith(":bonus")).map((k) => +k.split(":")[1]);
    D[kid] = (D[kid] || []).filter((k) => !k.startsWith(slot + ":") || k.endsWith(":bonus"));
    ctx.render();
    ctx.toast(ctx.t("Tavlen starter forfra"));
    for (const i of idx) await ctx.ws("board", { member: kid, slot, index: i, done: false });
  },
  "kids-read": (el, e, ctx) => speak(ctx, el.dataset.txt || ""),
  // skema
  "kids-skweek": (el, e, ctx) => {
    skemaWeek = Math.max(-4, Math.min(8, skemaWeek + +el.dataset.d));
    ctx.render();
  },
  // wishes
  "kids-wishadd": (el, e, ctx) => {
    wishAdd = wishAdd === el.dataset.id ? null : el.dataset.id;
    wishEmo = "🎁";
    ctx.render();
    setTimeout(() => ctx.q("[data-wishform] input[name=t]")?.focus({ preventScroll: true }), 30);
  },
  "kids-osync": async (el, e, ctx) => {
    ctx.toast(ctx.t("Henter fra Ønskeskyen …"));
    try {
      await ctx.ws("osky/refresh");
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
  "kids-oshare": async (el, e, ctx) => {
    const url = `https://onskeskyen.dk/da/wishlists/${encodeURIComponent(el.dataset.id)}`;
    try {
      if (navigator.share) await navigator.share({ url });
      else {
        await navigator.clipboard.writeText(url);
        ctx.toast(ctx.t("Linket er kopieret"));
      }
    } catch (err) {
      /* cancelled */
    }
  },
  "kids-wish2shop": async (el, e, ctx) => {
    const l = (ctx.data.osky?.lists || []).find((x) => x.id === el.dataset.list), w = l?.wishes?.[+el.dataset.i];
    const owner = ctx.member(ctx.data.settings.osky_to?.[l?.id]);
    if (!w) return;
    const list = [...(ctx.data.rewards || [])];
    let id = slug(w.title).replace(/_/g, "-").slice(0, 40) || "oenske";
    if (!/^[a-z0-9]/.test(id)) id = "w" + id;
    while (list.some((r) => r.id === id)) id += "-2";
    const cost = Math.max(10, Math.round((w.price || 100) / 5 / 5) * 5);
    list.push({ id, title: w.title.slice(0, 60), member: owner?.role === "child" ? owner.id : "all", cost, emoji: wishEm(w.title) });
    ctx.data.rewards = list;
    ctx.render();
    if (await ctx.save("rewards", list)) ctx.toast(ctx.t("{what} er et mål i shoppen for {n} point", { what: w.title, n: cost }));
  },
  // routines
  "kids-rtab": (el, e, ctx) => {
    rtab = el.dataset.id;
    if (ctx.view !== "rutiner") ctx.go("rutiner");
    else ctx.render();
  },
  "kids-rwho": (el, e, ctx) => {
    rWho = el.dataset.id;
    ctx.render();
  },
  "kids-radd": (el, e, ctx) => {
    const c = CHORES.find((x) => x[0] === el.dataset.id);
    const who = ctx.member(rWho), list = [...(ctx.data.missions || [])];
    const title = ctx.t(c[0]);
    const has = list.find((r) => r.member === rWho && (r.title === title || r.title === c[0]));
    if (has) return saveMissions(ctx, list.filter((r) => r !== has));
    list.push({ id: newMissionId(list, title), title, member: rWho, points: who.role === "child" ? c[2] : 0, days: who.role === "child" ? [0, 1, 2, 3, 4, 5, 6] : [5], time: null, emoji: c[1], part: "day" });
    const b = el.getBoundingClientRect();
    burst(ctx, b.left + b.width / 2, b.top + 10, who.color, 12);
    saveMissions(ctx, list);
    ctx.toast(ctx.t("{what} gentager sig nu for {name}", { what: title, name: who.name }));
  },
  "kids-rday": (el, e, ctx) => {
    const d = +el.dataset.d;
    const list = (ctx.data.missions || []).map((r) => {
      if (r.id !== el.dataset.id) return r;
      const days = r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort();
      return { ...r, days };
    });
    el.setAttribute("aria-pressed", String(list.find((r) => r.id === el.dataset.id).days.includes(d)));
    ctx.data.missions = list;
    ctx.save("missions", list);
  },
  "kids-rwhere": (el, e, ctx) => {
    const next = { here: "away", away: "always", always: "here" };
    saveMissions(ctx, (ctx.data.missions || []).map((r) => (r.id === el.dataset.id ? { ...r, where: next[r.where || "here"] } : r)));
  },
  "kids-rpts": (el, e, ctx) => {
    const list = (ctx.data.missions || []).map((r) => (r.id === el.dataset.id ? { ...r, points: Math.max(0, Math.min(50, r.points + +el.dataset.d)) } : r));
    saveMissions(ctx, list);
  },
  "kids-rdel": (el, e, ctx) => saveMissions(ctx, (ctx.data.missions || []).filter((r) => r.id !== el.dataset.id)),
  "kids-rall": (el, e, ctx) => {
    const days = el.dataset.d === "hver" ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
    saveMissions(ctx, (ctx.data.missions || []).map((r) => (r.member === rWho ? { ...r, days } : r)));
  },
  "kids-hbkid": (el, e, ctx) => {
    hbKid = el.dataset.id;
    ctx.render();
  },
  "kids-hbday": (el, e, ctx) => hbDaySheet(ctx, el.dataset.t, +el.dataset.d),
  "kids-hbwk": (el, e, ctx) => {
    const w = el.dataset.w;
    hbWeek = w === "fixed" ? null : w === "now" ? 0 : (hbWeek ?? 0) + (w === "+1" ? 1 : -1);
    ctx.render(true);
  },
  // This week as last week was (all days, both ways).
  "kids-hbcopy": (el, e, ctx) => {
    const wk = hbWk(), prev = weekKey(addDays(new Date(), ((hbWeek || 0) - 1) * 7)), P = hbPlan(ctx, hbKid, prev);
    saveRoutines(ctx, (r) => {
      ["bring", "hent"].forEach((t) => P[t].forEach(([who, at], d) => who !== "mor" && setPlan(r, hbKid, t, d, who, at, wk)));
      pruneWeeks(r);
    });
    ctx.toast(ctx.t("Ugen er sat som ugen før"));
  },
  "kids-hbreset": (el, e, ctx) => {
    const wk = hbWk();
    saveRoutines(ctx, (r) => {
      if (r.weeks?.[wk]) delete r.weeks[wk][hbKid];
      if (r.weeks?.[wk] && !Object.keys(r.weeks[wk]).length) delete r.weeks[wk];
      pruneWeeks(r);
    });
    ctx.toast(ctx.t("Ugen følger den faste plan igen"));
  },
  "kids-hbfix": (el, e, ctx) => {
    const wk = hbWk(), P = hbPlan(ctx, hbKid, wk);
    saveRoutines(ctx, (r) => {
      ["bring", "hent"].forEach((t) => P[t].forEach(([who, at], d) => who !== "mor" && setPlan(r, hbKid, t, d, who, at)));
      if (r.weeks?.[wk]) delete r.weeks[wk][hbKid];
      pruneWeeks(r);
    });
    ctx.toast(ctx.t("Ugen er nu den faste plan"));
  },
  // The same people and times as another child.
  "kids-hbsame": (el, e, ctx) => {
    const wk = hbWk(), other = ctx.member(el.dataset.id), P = hbPlan(ctx, el.dataset.id, wk), mine = hbPlan(ctx, hbKid, wk);
    if (!other) return;
    saveRoutines(ctx, (r) => {
      ["bring", "hent"].forEach((t) => P[t].forEach(([who, at], d) => who !== "mor" && mine[t][d][0] !== "mor" && setPlan(r, hbKid, t, d, who, at, wk)));
      pruneWeeks(r);
    });
    ctx.toast(ctx.t("{kid} hentes og bringes som {other}", { kid: ctx.member(hbKid).name, other: other.name }));
  },
  "kids-hbweek": (el, e, ctx) => {
    const t = el.dataset.t, id = el.dataset.id, wk = hbWk(), K = hbPlan(ctx, hbKid, wk)[t];
    let n = 0;
    saveRoutines(ctx, (r) => K.forEach((row, k) => row[0] !== "mor" && (setPlan(r, hbKid, t, k, id, row[1], wk), n++)));
    const kid = ctx.member(hbKid).name, who = hbWho(ctx, id).name;
    ctx.toast(t === "bring" ? ctx.t("{who} bringer {kid} alle {n} dage", { who, kid, n }) : ctx.t("{who} henter {kid} alle {n} dage", { who, kid, n }));
  },
  "kids-hbhelper": (el, e, ctx) => hbHelperSheet(ctx, el.dataset.id || null),
  "kids-hbrem": async (el, e, ctx) => {
    const on = ctx.data.settings.pickup_reminder === false;
    el.setAttribute("aria-pressed", String(on));
    await ctx.save("settings", { ...ctx.data.settings, pickup_reminder: on });
    ctx.toast(on ? ctx.t("Den, der henter eller bringer, får en besked om morgenen") : ctx.t("Beskederne er slået fra"));
  },
  "kids-bkid": (el, e, ctx) => {
    bKid = el.dataset.id;
    ctx.render();
  },
  "kids-bzone": (el, e, ctx) => {
    bZone = el.dataset.id;
    ctx.render();
  },
  "kids-bcat": (el, e, ctx) => {
    bCat = el.dataset.id;
    ctx.render();
  },
  "kids-badd": (el, e, ctx) => {
    if (suppressClick) return;
    const id = el.dataset.id;
    boardChange(ctx, (b) => b[bZone].push(id));
    ctx.toast(ctx.t("{what} er lagt i {slot}", { what: ctx.t(rcard(ctx, id)[1]), slot: ctx.t(RSLOTS.find((x) => x[0] === bZone)[1]).toLowerCase() }));
    setTimeout(() => ctx.q(`.bb-col[data-zone="${bZone}"] .bb-card:last-of-type`)?.classList.add("pop-in"), 30);
  },
  "kids-bdel": (el, e, ctx) => boardChange(ctx, (b) => b[el.dataset.id].splice(+el.dataset.i, 1)),
  "kids-bmod": async (el, e, ctx) => {
    const fam = clone(ctx.members());
    const k = fam.find((m) => m.id === bKid);
    const v = !k.features?.board;
    k.features = { ...(k.features || {}), board: v };
    el.setAttribute("aria-pressed", String(v));
    await ctx.save("family", fam.map(({ has_pin: _h, ...m }) => m));
    ctx.toast(v ? ctx.t("{name} har nu en rutinetavle", { name: k.name }) : ctx.t("Rutinetavlen er slået fra for {name}", { name: k.name }));
  },
  "kids-seeas": (el, e, ctx) => ctx.panel?.viewAs?.(el.dataset.id),
};

function init(ctx) {
  const root = ctx.root;
  root.addEventListener("pointerdown", (e) => onDown(ctx, e));
  root.addEventListener("pointermove", (e) => onMove(ctx, e));
  root.addEventListener("pointerup", () => onUp(ctx));
  root.addEventListener("pointercancel", () => {
    if (drag) {
      clearInterval(drag.scroller);
      drag.g?.remove();
    }
    ctx.host.classList.remove("dragging");
    drag = null;
  });
  root.addEventListener("touchmove", (e) => drag?.on && e.preventDefault(), { passive: false });
  root.addEventListener("click", (e) => {
    if (suppressClick) {
      e.stopPropagation();
      e.preventDefault();
      suppressClick = false;
      return;
    }
    const b = e.target.closest?.("[data-emo]");
    if (b) {
      wishEmo = b.dataset.emo;
      b.parentElement.querySelectorAll("[data-emo]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }
  }, true);
  root.addEventListener("submit", async (e) => {
    const f = e.target;
    if (f.dataset.kidsform === "rown") {
      e.preventDefault();
      const t = f.t.value.trim().slice(0, 80);
      if (!t) return;
      const who = ctx.member(rWho), list = [...(ctx.data.missions || [])];
      list.push({ id: newMissionId(list, t), title: t, member: rWho, points: who.role === "child" ? 5 : 0, days: [0, 1, 2, 3, 4, 5, 6], time: null, emoji: "⭐", part: "day" });
      f.t.value = "";
      saveMissions(ctx, list);
      ctx.toast(ctx.t("{what} gentager sig nu for {name}", { what: t, name: who.name }));
    } else if (f.dataset.kidsform === "bown") {
      e.preventDefault();
      const t = f.t.value.trim().slice(0, 30);
      if (!t) return;
      const em = f.e.value.trim().slice(0, 4) || "⭐";
      let id = "c" + slug(t).replace(/_/g, "").slice(0, 20);
      if (routines(ctx).cards.some((c) => c[0] === id) || RCARDS.some((c) => c[0] === id)) id += Date.now().toString(36).slice(-4);
      saveRoutines(ctx, (r) => {
        r.cards.push([id, t, em, "hjem"]);
        const b = (r.boards[bKid] ||= { morgen: [], eftermiddag: [], aften: [] });
        (b[bZone] ||= []).push(id);
      });
      ctx.toast(ctx.t("{what} er lavet og lagt i {slot}", { what: t, slot: ctx.t(RSLOTS.find((x) => x[0] === bZone)[1]).toLowerCase() }));
    } else if (f.dataset.wishform) {
      e.preventDefault();
      const l = (ctx.data.osky?.lists || []).find((x) => x.id === f.dataset.wishform);
      const t = f.t.value.trim();
      if (!l || !t) return;
      const p = f.p ? parseFloat(f.p.value.replace(/\s*kr\.?$/i, "").replace(",", ".")) : NaN;
      const url = f.s?.value.trim() || null;
      const btn = f.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await ctx.ws("osky/wish", { list: l.id, title: t, ...(Number.isFinite(p) ? { price: p } : {}), ...(url ? { url } : {}) });
        l.wishes = [{ id: "new", title: t, price: Number.isFinite(p) ? p : null, currency: "DKK", photo: null, url, shop: "", reserved: 0, fresh: 1, em: ctx.isKid ? wishEmo : undefined }, ...(l.wishes || [])];
        wishAdd = null;
        ctx.render();
        if (ctx.isKid) {
          const r = ctx.q(".wish.fresh")?.getBoundingClientRect();
          if (r) burst(ctx, r.left + 40, r.top + 30, ctx.me?.color);
        }
        ctx.toast(ctx.isKid ? ctx.t("Dit ønske er sat på ønskesedlen") : ctx.t("{what} er tilføjet til {list}", { what: t, list: l.title }));
      } catch (err) {
        btn.disabled = false;
        ctx.toast(String(err?.message || err));
      }
    }
  });
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - y0) / 864e5 + 1) / 7);
}

const views = {
  tavle: { kidOnly: true, module: "board", visible: (ctx) => ctx.feature(ctx.me, "board"), render: kBoard, title: (ctx) => ctx.t("Rutine") },
  skema: { kidOnly: true, module: "skema", visible: (ctx) => ctx.feature(ctx.me, "skema"), render: kSkema, title: (ctx) => ctx.t("Skema") },
  onsker: { kidOnly: true, module: "wish", visible: (ctx) => ctx.feature(ctx.me, "wish"), render: kWish, title: (ctx) => ctx.t("Ønsker") },
  rutiner: { parentOnly: true, render: pRoutines, title: (ctx) => ctx.t("Faste rutiner") },
};

const css = `
.hb-wk { margin-top: 16px; }
.hb-wnav { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.hb-fix { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 999px; padding: 9px 14px; font: inherit; font-weight: 800; font-size: 13px; background: var(--surface-2); color: var(--ink); cursor: pointer; }
.hb-fix .ic { width: 16px; height: 16px; } .hb-fix[aria-pressed="true"] { background: var(--ink); color: var(--bg); }
.hb-wsel { display: flex; align-items: center; gap: 4px; border-radius: 999px; padding: 3px; background: var(--surface-2); }
.hb-wsel.on { background: color-mix(in srgb, var(--pc, var(--violet)) 14%, var(--surface)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--violet) 35%, transparent); }
.hb-wlbl { border: 0; background: transparent; font: inherit; color: var(--ink); text-align: center; cursor: pointer; padding: 2px 8px; min-width: 150px; }
.hb-wlbl b { display: block; font-size: 14px; } .hb-wlbl small { font-size: 11.5px; color: var(--muted); }
.hb-wtxt { margin: 10px 0 8px; } .hb-wacts { display: flex; gap: 6px; flex-wrap: wrap; } .hb-wacts .av { width: 20px; height: 20px; font-size: 10px; }
.hb-row.own { box-shadow: inset 3px 0 0 var(--violet); } .hb-row.own .hb-nm small { color: var(--violet); font-weight: 700; }

canvas.hk-confetti { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 90; }
.wish .thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.hk-wk { padding: 0 4px !important; gap: 0 !important; }
.hk-wk .iconbtn { width: 28px; height: 28px; }
.hb-row.none .hb-nm { color: var(--muted); }
.rc-where { justify-self: start; margin-top: 4px; border: 0; border-radius: 999px; padding: 5px 10px; font: 700 12px var(--font-body); background: var(--surface-2); color: var(--ink); cursor: pointer; }
.hb-row.away { opacity: .5; background: repeating-linear-gradient(135deg, transparent 0 8px, color-mix(in srgb, var(--muted) 10%, transparent) 8px 16px); }
`;

const en = {
  "Begge hjem": "Both homes", "Det andet hjem": "The other home", "Hjemme hos os": "At home with us", "Hos den anden forælder": "With the other parent",
  Morgenrutinen: "Morning routine", "Rutinen efter skole": "After-school routine", Aftenrutinen: "Evening routine", "{n} af {total} kort": "{n} of {total} cards", "Lektier · {hold}": "Homework · {hold}",
  "Fast plan": "Fixed plan", "kun denne uge": "this week only", "denne uge": "this week", "næste uge": "next week", "sidste uge": "last week", "Ugen før": "Week before", "Ugen efter": "Week after",
  "Ugen følger den faste plan, undtagen {n} ændringer, der kun gælder denne uge.": "The week follows the fixed plan, except {n} changes for this week only.",
  "Ugen følger den faste plan. Ændringer her gælder kun denne uge.": "The week follows the fixed plan. Changes here are for this week only.",
  "Den faste plan gælder hver uge, til en uge får sin egen plan.": "The fixed plan applies every week, until a week gets its own plan.",
  "Kopiér fra ugen før": "Copy from the week before", "Brug den faste plan": "Use the fixed plan", "Gør ugen til fast plan": "Make this week the fixed plan", "Samme som {name}": "Same as {name}",
  "Ugen er sat som ugen før": "The week is set like the week before", "Ugen følger den faste plan igen": "The week follows the fixed plan again", "Ugen er nu den faste plan": "This week is now the fixed plan",
  "{kid} hentes og bringes som {other}": "{kid} is dropped off and picked up like {other}",
  // tabs, titles
  Rutine: "Routine", Skema: "Timetable", Ønsker: "Wishes", "Faste rutiner": "Fixed routines", "Faste opgaver": "Fixed tasks", "Hent og bring": "Drop-off and pick-up", Rutinetavle: "Routine board",
  // routine cards and categories
  "Stå op": "Get up", Tisse: "Pee", "Vaske hænder": "Wash hands", "Børste tænder": "Brush teeth", "Vaske sig": "Wash", "Finde tøj frem": "Lay out clothes", "Tage tøj på": "Get dressed", "Spise morgenmad": "Eat breakfast",
  "Rede hår": "Brush hair", "Pakke taske": "Pack bag", "Madpakke med": "Packed lunch", "Sko og jakke på": "Shoes and jacket on", Regntøj: "Rain gear", Cykelhjelm: "Bike helmet", "Drikke vand": "Drink water", "Spise frugt": "Eat fruit",
  Medicin: "Medicine", Lektier: "Homework", Læse: "Read", "Lege ude": "Play outside", "Rydde op": "Tidy up", Skærmtid: "Screen time", "Hjælpe til": "Help out", "Fodre dyr": "Feed the pets", "Dække bord": "Set the table",
  Aftensmad: "Dinner", Bad: "Bath", "Nattøj på": "Pyjamas on", Godnathistorie: "Bedtime story", Godnatkram: "Goodnight hug", Sove: "Sleep",
  Morgen: "Morning", "Efter skole": "After school", Aften: "Evening", Krop: "Body", Tøj: "Clothes", Mad: "Food", Skole: "School", Leg: "Play", Hjemme: "Home",
  // board
  nu: "now", Nu: "Now", "{n} af {m}": "{n} of {m}", "Morgenen er klaret!": "The morning is done!", "Eftermiddagen er klaret!": "The afternoon is done!", "Aftenen er klaret!": "The evening is done!", "Godt gået, {name}.": "Well done, {name}.", "Du har fået 5 point.": "You got 5 points.", Klaret: "Done", "Fortryd {what}": "Undo {what}",
  "Tavlen starter forfra i nat kl. 00": "The board starts over tonight at 00", "Nu skal du: {what}": "Now you: {what}", "Læs op": "Read aloud", "Start forfra": "Start over", "Tavlen starter forfra": "The board starts over",
  "Din tavle er tom": "Your board is empty", "Far eller mor lægger kortene på din tavle under Faste rutiner.": "Mum or dad puts the cards on your board under Fixed routines.",
  "Læser op …": "Reading aloud …", "Oplæsning virker i Home Assistant-appen": "Reading aloud works in the Home Assistant app",
  // skema
  "Skemaet er slået fra": "The timetable is turned off", "Mit skema": "My timetable", "Far eller mor kan vælge din skemakalender, fx fra Aula, under Familieindstillinger.": "Mum or dad can choose your timetable calendar, e.g. from Aula, in Family settings.",
  "Uge {n} · fra {cal}": "Week {n} · from {cal}", "Fra {cal}": "From {cal}", "Ingen timer i denne uge": "No lessons this week", Frikvarter: "Break", "i dag": "today", "i morgen": "tomorrow", "Forrige uge": "Previous week", "Næste uge": "Next week",
  // wishes
  "Ønskesedlen er slået fra": "The wish list is turned off", "Far eller mor kan slå den til.": "Mum or dad can turn it on.", "Mine ønsker": "My wishes",
  "Du har ikke en ønskeseddel her endnu. Bed far eller mor om at forbinde din børneprofil i Ønskeskyen.": "You don't have a wish list here yet. Ask mum or dad to connect your child profile in Ønskeskyen.",
  "lige nu": "just now", "for {n} min. siden": "{n} min. ago", "Hent igen fra Ønskeskyen": "Fetch again from Ønskeskyen", Del: "Share", "Hentet fra Ønskeskyen {when}": "Fetched from Ønskeskyen {when}", "{n} ønsker": "{n} wishes", "{n} reserveret": "{n} reserved",
  "Ønsk dig noget": "Wish for something", "Tilføj et ønske til {name}": "Add a wish for {name}", "Tilføj et ønske": "Add a wish", "{n} ønsker hentes fra Ønskeskyen …": "{n} wishes are being fetched from Ønskeskyen …", "Ingen ønsker endnu.": "No wishes yet.",
  "Dine ønsker kommer også på din børneprofil i Ønskeskyen.": "Your wishes also go on your child profile in Ønskeskyen.", "Ønsker du tilføjer her, lægges i Ønskeskyen. Reservationer laves i Ønskeskyen.": "Wishes you add here go to Ønskeskyen. Reservations are made in Ønskeskyen.",
  "Ønskesedlen ejes af en anden. Nye ønsker og reservationer laves i Ønskeskyen.": "Someone else owns this wish list. New wishes and reservations are made in Ønskeskyen.", "Åbn min børneprofil": "Open my child profile", "Åbn i Ønskeskyen": "Open in Ønskeskyen",
  "Hvad ønsker du dig?": "What do you wish for?", "Nyt ønske til {name}": "New wish for {name}", "Nyt ønske": "New wish", Luk: "Close", "Vælg et billede": "Choose a picture", "Mit ønske": "My wish", Ønske: "Wish", "Fx en dinosaur-bog": "E.g. a dinosaur book", "Fx LEGO Technic 42151": "E.g. LEGO Technic 42151",
  Pris: "Price", Valgfri: "Optional", Link: "Link", "Sæt på min ønskeseddel": "Put it on my wish list", "Tilføj ønske": "Add wish", "Far eller mor kan se det med det samme.": "Mum or dad can see it right away.", "Ønsket lægges også i Ønskeskyen.": "The wish is also added in Ønskeskyen.",
  Reserveret: "Reserved", "Er et mål i shoppen": "Is a goal in the shop", "Gør til mål": "Make it a goal", "Åbn {what}": "Open {what}", "Henter fra Ønskeskyen …": "Fetching from Ønskeskyen …", "Linket er kopieret": "The link is copied",
  "{what} er et mål i shoppen for {n} point": "{what} is a goal in the shop for {n} points", "Dit ønske er sat på ønskesedlen": "Your wish is on the wish list", "{what} er tilføjet til {list}": "{what} is added to {list}",
  // chores
  "Tilføj familien først.": "Add the family first.", "Hvem?": "Who?", "{n} faste opgaver i familien": "{n} fixed tasks in the family", "{name}s faste opgaver": "{name}'s fixed tasks", "Tryk på dagene": "Tap the days",
  mandag: "Monday", tirsdag: "Tuesday", onsdag: "Wednesday", torsdag: "Thursday", fredag: "Friday", lørdag: "Saturday", søndag: "Sunday", M: "M", T: "T", O: "W", F: "F", L: "S", S: "S",
  "Færre point": "Fewer points", "Flere point": "More points", "Fjern {what}": "Remove {what}", "Ingen faste opgaver endnu. Tryk på en opgave til højre.": "No fixed tasks yet. Tap a task on the right.",
  "Faste opgaver dukker selv op på de valgte dage og giver point, når de er klaret.": "Fixed tasks show up by themselves on the chosen days and give points when they're done.", "Faste opgaver dukker selv op på de valgte dage.": "Fixed tasks show up by themselves on the chosen days.",
  "Genvej:": "Shortcut:", "alle på hverdage": "all on weekdays", "alle hver dag": "all every day", "Tryk for at tilføje": "Tap to add", "Egen opgave": "Own task", Tilføj: "Add", "{what} gentager sig nu for {name}": "{what} now repeats for {name}",
  "Tøm opvaskeren": "Empty the dishwasher", "Dæk bord": "Set the table", "Ryd af bordet": "Clear the table", "Red seng": "Make the bed", "Ryd op på værelset": "Tidy the room", "Læg tøj til vask": "Put clothes in the wash", "Fodr dyrene": "Feed the pets", "Skrald ud": "Take out the rubbish",
  Støvsug: "Vacuum", "Vand planter": "Water the plants", "Pak skoletasken": "Pack the school bag", "Læs 20 minutter": "Read for 20 minutes", "Bær indkøb ind": "Carry in the shopping", "Hæng vasketøj op": "Hang up the laundry", "Børst tænder": "Brush teeth", "Fodr fuglene": "Feed the birds", "Hjælp med aftensmad": "Help with dinner",
  // pickups
  "Der er ingen børn i familien endnu.": "There are no children in the family yet.", "Hos mor": "At mum's", Ingen: "Nobody", "fra kalenderen": "from the calendar", "Hele ugen:": "All week:", "{name} alle dage": "{name} every day",
  Mandag: "Monday", Tirsdag: "Tuesday", Onsdag: "Wednesday", Torsdag: "Thursday", Fredag: "Friday", "Hvilket barn?": "Which child?", "Uge {n}": "Week {n}", "{n} ture": "{n} trips", "Bring {name}": "Drop off {name}", "Hent {name}": "Pick up {name}", "Om morgenen": "In the morning", "Fra {inst}": "From {inst}",
  Dagpleje: "Childminder", Vuggestue: "Nursery", Børnehave: "Kindergarten", Institution: "Institution", "Dage, hvor {name} er hos sin mor, kommer fra kalenderen og kan ikke ændres her.": "Days when {name} is at mum's come from the calendar and can't be changed here.",
  "Hvem henter og bringer": "Who drops off and picks up", "{n} ture om ugen": "{n} trips a week", "Ret {name}": "Edit {name}", "Besked om morgenen til den, der henter eller bringer": "A message in the morning to whoever drops off or picks up", "Besked om morgenen": "Morning message",
  "Bring om morgenen": "Drop off in the morning", "Hent efter skole": "Pick up after school", "Bring {name} · {day}": "Drop off {name} · {day}", "Hent {name} · {day}": "Pick up {name} · {day}", Tidspunkt: "Time", "Gælder også": "Also applies to", Annullér: "Cancel", Gem: "Save",
  "{n} dage": "{n} days", "{who} bringer {kid} {when} kl. {time}": "{who} drops off {kid} {when} at {time}", "{who} henter {kid} {when} kl. {time}": "{who} picks up {kid} {when} at {time}", "Tilføj en, der henter": "Add someone who picks up", Navn: "Name", "Fx Morfar, Farmor, nabo": "E.g. Grandad, Granny, neighbour",
  "{name} er en person i Home Assistant og bruger sin egen farve og sit eget billede.": "{name} is a person in Home Assistant and uses their own colour and picture.", Farve: "Colour", Fjern: "Remove", "{name} er rettet": "{name} is updated", "{name} kan nu hente og bringe": "{name} can now drop off and pick up",
  "{name} er fjernet · {n} ture mangler nu en, der henter eller bringer": "{name} is removed · {n} trips now need someone", "{name} er fjernet": "{name} is removed", "{who} bringer {kid} alle {n} dage": "{who} drops off {kid} all {n} days", "{who} henter {kid} alle {n} dage": "{who} picks up {kid} all {n} days",
  "Den, der henter eller bringer, får en besked om morgenen": "Whoever drops off or picks up gets a message in the morning", "Beskederne er slået fra": "The messages are turned off",
  // board builder
  "Slået til for {name}": "On for {name}", "Rutinetavle for {name}": "Routine board for {name}", "Se som {name}": "See as {name}",
  "Træk kort fra paletten ind i en rutine, eller tryk på et kort for at lægge det i den valgte rutine. Træk et kort ud af rutinen for at fjerne det. Tavlen starter forfra hver nat kl. 00.": "Drag cards from the palette into a routine, or tap a card to put it in the chosen routine. Drag a card out of the routine to remove it. The board starts over every night at 00.",
  "Træk kort hertil": "Drag cards here", Kort: "Cards", "{n} kort": "{n} cards", Alle: "All", Billede: "Picture", "Eget kort, fx Svømmetaske": "Own card, e.g. Swimming bag", "Lav kort": "Make card",
  "{what} er lagt i {slot}": "{what} is put in {slot}", "{what} er fjernet": "{what} is removed", "{what} er lavet og lagt i {slot}": "{what} is made and put in {slot}", "{name} har nu en rutinetavle": "{name} now has a routine board", "Rutinetavlen er slået fra for {name}": "The routine board is off for {name}",
};

export default { id: "kids", views, acts, inputs: {}, init, css, en };
