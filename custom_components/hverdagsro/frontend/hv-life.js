/* Hverdagsro – everyday life in the game: the play world and Hverdagsro's own days hang together.
   1. The characters ask for help with the real tasks of the day (missions and homework), and say thank you.
   2. The child's room mirrors the day: a mess while tidying is waiting, sparkles when it is done, a plant that grows
      with every good day of the week.
   3. Tonight's dinner (the meal plan) is on the kitchen wall and in the café; the children vote for next week's dinners.
   4. Homework becomes knowledge: books on a shelf, stamps per subject, and things to discover.
   5. The routines are the game's day: the avatar wakes in bed, does what the cards say, wears pyjamas in the evening,
      and gets a good-night story.
   6. The family's building site: everything real that anyone does lays a brick (the bricks are counted in Home
      Assistant, see funplay.py).
   7./8. Help each other: say you helped a sibling or a grown-up; they say yes, and both get coins.
   9. The postman brings the day: a letter with today's and tomorrow's plans.
  10. When the game may be played: the grown-ups choose (after the morning routine, the homework, all of today's
      missions, or minutes earned by helping).
   hv-play hands over what it knows of the game through init(api). */
import { esc } from "./hv-core.js";
import * as Sound from "./hv-sound.js";
import * as Kids from "./hv-kids.js";
import * as Lists from "./hv-lists.js";
import * as World from "./hv-world.js";
import { charSvg } from "./hv-chars.js";
import { OL } from "./hv-playcat.js";

let A = null; // { st, R, CAT, save, redraw, say, floatIcons, confetti, coinPop, goTo, spaceId, owned, unlock, avatarSvg, placeName, complete }
export function init(api) {
  A = api;
}
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const nameOf = (ctx, id) => ctx.member(id)?.name || "";

/* ------------------------------------------------------------------ the tasks of the day */
/* What is still to do today for a member: missions and homework (routine cards are the room's bubbles). */
export function openTasks(ctx, m) {
  if (!m) return [];
  const dt = ctx.data.done_today || {}, out = [];
  if (ctx.feature(m, "missions") || m.role === "parent")
    for (const x of ctx.missionsOn ? ctx.missionsOn(m) : []) if (!(`${x.id}:${m.id}` in dt)) out.push({ kind: "mission", id: x.id, em: x.emoji || "⭐", title: x.title, who: m.id });
  for (const x of Kids.homeworkFor ? Kids.homeworkFor(ctx, m.id) : []) if (!(`${x.id}:${m.id}` in dt)) out.push({ kind: "homework", id: x.id, em: "✏️", title: x.t, who: m.id });
  return out;
}
/* Who in the world asks for help with a task: by what the task is about. [pattern, character, place] */
const HELPERS = [
  [/bord|opvask|køkken|tallerken|mad|frokost|morgenmad|aftensmad|bage|madpakke|kage/i, "kasper", "by-cafe"],
  [/hund|kat|kanin|dyr|fodr|akvarie|marsvin|hamster|luft|fisk/i, "karla", "by-cafe"],
  [/ryd|oprydning|værelse|seng|legetøj|støvsug|vasketøj|tøj|garderobe/i, "naja", "by-lejlighed"],
  [/skrald|affald|have|blade|vande|planter|ude|cykel|sne|græs|bil/i, "sif", "by-camping"],
  [/tand|bad|bruse|vaske|hår|negle/i, "fie", "by-frisor"],
  [/post|brev|pakke|indkøb|handle|butik/i, "per", "by-post"],
  [/læs|lektie|skole|stav|regn|matematik|dansk|engelsk|tysk|natur|bog/i, "olga", "by-camping"],
];
export function helperFor(task) {
  if (task.kind === "homework") return ["olga", "by-camping"];
  const h = HELPERS.find(([re]) => re.test(task.title || ""));
  return h ? [h[1], h[2]] : ["bent", "by-torv"];
}
/* The quests for the child playing: character id → [tasks]. */
export function quests(ctx) {
  const st = A.st(), m = ctx.member(st.kid), out = {};
  for (const task of openTasks(ctx, m)) {
    const [npc, place] = helperFor(task);
    (out[npc] ||= { place, tasks: [] }).tasks.push(task);
  }
  return out;
}
/* A red "!" over the characters who need help here. */
export function questSvg(ctx) {
  const st = A.st();
  if (st.build) return "";
  const q = quests(ctx), room = A.R(), npc = room.npc || {};
  let s = "";
  for (const [id, info] of Object.entries(q)) {
    const at = npc[id];
    if (!at || !info.tasks.length) continue;
    s += `<g class="lf-quest" pointer-events="none" transform="translate(${at[0] + 34} ${at[1] - 250})"><circle r="22" fill="#E5484D" stroke="#fff" stroke-width="4"/><text y="9" text-anchor="middle" class="lf-q">!</text></g>`;
  }
  // The grown-ups at home with a task of their own: "will you help me?"
  for (const [key, at] of Object.entries(npc)) {
    if (!key.startsWith("fam:")) continue;
    const p = ctx.member(key.slice(4));
    if (p && openTasks(ctx, p).length) s += `<g class="lf-quest" pointer-events="none" transform="translate(${at[0] + 34} ${at[1] - 250})"><circle r="22" fill="#4D96FF" stroke="#fff" stroke-width="4"/><text y="9" text-anchor="middle" class="lf-q">?</text></g>`;
  }
  return s;
}
/* The places with a character who needs help, for the map. */
export const questPlaces = (ctx) => [...new Set(Object.values(quests(ctx)).map((q) => q.place))];
/* Tapping a character: their quest, if they have one. True when it opened. */
export function tapCharacter(ctx, id) {
  if (String(id).startsWith("fam:")) {
    const p = ctx.member(id.slice(4)), tasks = p ? openTasks(ctx, p) : [];
    if (!tasks.length) return false;
    inviteSheet(ctx, p, tasks);
    return true;
  }
  const q = quests(ctx)[id];
  if (!q || !q.tasks.length) return false;
  questSheet(ctx, id, q.tasks);
  return true;
}
function questSheet(ctx, id, tasks) {
  const N = World.NPCS[id], t = ctx.t;
  Sound.voice(N?.[3]?.kind || "person");
  ctx.sheet(`<div class="lf-who"><svg viewBox="-130 -330 260 340" aria-hidden="true">${charSvg(N[3], "", A.avatarSvg)}</svg><div><h2>${esc(N[0])}</h2><p class="t-sub">${esc(t("Kan du hjælpe mig? Når du har gjort det rigtigt derhjemme, så tryk Klaret!"))}</p></div></div>
    <ul class="lf-tasks">${tasks.map((task) => `<li><span>${esc(task.em)}</span><b>${esc(task.title)}</b><button class="btn" data-act="life-done" data-kind="${task.kind}" data-k="${esc(task.id)}" data-npc="${esc(id)}">✓ ${esc(t("Klaret!"))}</button></li>`).join("")}</ul>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Senere"))}</button></div>`);
}
function inviteSheet(ctx, p, tasks) {
  const t = ctx.t, st = A.st();
  Sound.voice("person");
  ctx.sheet(`<h2>${esc(t("{name} har brug for hjælp", { name: p.name }))}</h2><p class="t-sub">${esc(t("Vil du hjælpe til? Når I har gjort det sammen, siger {name} ja, og I får begge mønter.", { name: p.name }))}</p>
    <ul class="lf-tasks">${tasks.map((task) => `<li><span>${esc(task.em)}</span><b>${esc(task.title)}</b><button class="btn" data-act="life-help" data-helped="${esc(p.id)}" data-k="${esc(task.id)}" data-title="${esc(task.title)}">🤝 ${esc(t("Jeg hjælper!"))}</button></li>`).join("")}</ul>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Senere"))}</button></div>`);
  void st;
}
/* Every five thank-yous: a little present from the town. */
async function thanks(ctx, npc) {
  const st = A.st(), N = World.NPCS[npc];
  st.d.hearts = (st.d.hearts || 0) + 1;
  Sound.sfx("level");
  const at = A.R().npc?.[npc] || [500, 560];
  A.confetti(ctx, at[0], at[1] - 160, "#F15BB5", true);
  A.floatIcons(ctx, at[0], at[1] - 200, ["❤️", "✨", "❤️"]);
  A.say(ctx, at[0], at[1], `${N ? N[0] : ""}: ${ctx.t("Tusind tak for hjælpen!")} ❤️ ${st.d.hearts}`);
  if (st.d.hearts % 5 === 0) {
    const owned = A.owned(), pool = Object.entries(A.CAT).filter(([k, v]) => v.pack !== "start" && v.pack !== "home" && v.pack !== "world" && v.price <= 30 && !owned.has(k)).map(([k]) => k);
    if (pool.length) {
      const k = pool[Math.floor(Math.random() * pool.length)];
      await A.unlock([k], 0);
      setTimeout(() => A.say(ctx, at[0], at[1], `🎁 ${ctx.t("En tak-gave: {name}!", { name: ctx.t(A.CAT[k].n) })}`), 1800);
    }
  }
  A.save(ctx);
}

/* ------------------------------------------------------------------ 2. the room mirrors the day */
const TIDY = /ryd|oprydning|værelse|seng|legetøj/i;
const doneTidy = (ctx, kid) => (ctx.data.missions || []).some((x) => TIDY.test(x.title) && `${x.id}:${kid}` in (ctx.data.done_today || {}));
/* Good days this week (something done), for the plant on the window sill. */
function goodDays(ctx, kid) {
  return Object.values(ctx.data.done_week || {}).filter((day) => Object.keys(day || {}).some((k) => k.endsWith(`:${kid}`))).length;
}
export function roomSvg(ctx) {
  const st = A.st(), m = ctx.member(st.kid);
  if (!m || A.spaceId() !== "vaerelse" || st.build) return "";
  let s = "";
  const open = openTasks(ctx, m).some((x) => TIDY.test(x.title));
  if (open)
    // A little mess on the floor while tidying waits.
    s += `<g class="lf-mess" pointer-events="none">${[[180, 640, "#FF6B6B", -20], [330, 655, "#4D96FF", 15], [720, 650, "#FFD93D", -8], [860, 640, "#6BCB77", 25]].map(([x, y, c, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-26 -8 h52 l-6 16 h-40z" fill="${c}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M-12 -8 v-10 h24 v10" fill="${c}" stroke="${OL}" stroke-width="3"/></g>`).join("")}<circle cx="560" cy="648" r="14" fill="#F15BB5" stroke="${OL}" stroke-width="3"/><rect x="420" y="636" width="26" height="22" rx="4" fill="#FFB347" stroke="${OL}" stroke-width="3" transform="rotate(12 433 647)"/></g>`;
  else if (doneTidy(ctx, m.id)) s += `<g class="lf-shine" pointer-events="none">${[[160, 420], [430, 300], [700, 380], [880, 520], [300, 560]].map(([x, y], i) => `<text x="${x}" y="${y}" class="lf-spark" style="animation-delay:${i * 0.4}s">✨</text>`).join("")}</g>`;
  // The plant of the week grows with every good day.
  const n = Math.min(7, goodDays(ctx, m.id));
  s += `<g class="lf-plant" data-pl="lf-plant" transform="translate(620 262)" role="button" aria-label="${esc(ctx.t("Ugens plante"))}"><path d="M-16 0 h32 l-4 20 h-24z" fill="#E07A5F" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>${n ? `<path d="M0 0 V${-8 - n * 8}" stroke="#3F9E5A" stroke-width="4"/>` : ""}${Array.from({ length: n }, (_, i) => `<ellipse cx="${i % 2 ? 8 : -8}" cy="${-8 - i * 8}" rx="8" ry="4" fill="#6BCB77" stroke="${OL}" stroke-width="1.5" transform="rotate(${i % 2 ? -25 : 25} ${i % 2 ? 8 : -8} ${-8 - i * 8})"/>`).join("")}${n >= 5 ? `<circle cx="0" cy="${-14 - n * 8}" r="9" fill="${n >= 7 ? "#F15BB5" : "#FFD93D"}" stroke="${OL}" stroke-width="2"/>` : ""}</g>`;
  return s;
}

/* ------------------------------------------------------------------ 3. tonight's dinner, and votes */
export function dinnerToday(ctx) {
  try {
    const meals = Lists.mealsFor ? Lists.mealsFor(ctx, 2) : [];
    const d = Lists.dinnerOn && meals ? Lists.dinnerOn(meals, new Date()) : null;
    return d?.title || "";
  } catch (err) {
    return "";
  }
}
/* The dinner sign on the wall of the house kitchen and the café. */
export function dinnerSvg(ctx, pl) {
  if (!pl || A.st().build) return "";
  const kitchen = pl.id === "by-cafe" || (pl.area === "hjem" && pl.look === "kitchen");
  const dish = kitchen ? dinnerToday(ctx) : "";
  if (!kitchen) return "";
  const text = dish ? `${ctx.t("I aften")}: ${dish}` : ctx.t("Hvad skal vi spise?");
  const w = Math.min(420, 90 + text.length * 12);
  return `<g class="lf-dinner" data-pl="lf-vote" role="button" transform="translate(${pl.id === "by-cafe" ? 640 : 300} ${pl.id === "by-cafe" ? 330 : 120})"><rect x="${-w / 2}" y="-32" width="${w}" height="56" rx="12" fill="#2B2340" stroke="#C98B55" stroke-width="6"/><text y="6" text-anchor="middle" class="lf-dt">🍽️ ${esc(text.length > 34 ? text.slice(0, 33) + "…" : text)}</text></g>`;
}
const DISHES = ["Pizza", "Pasta med kødsovs", "Tacos", "Lasagne", "Fiskefrikadeller", "Kylling i karry", "Suppe", "Pandekager", "Burger", "Frikadeller", "Sushi", "Risengrød", "Boller i karry", "Wok"];
function voteSheet(ctx) {
  const st = A.st(), t = ctx.t, week = weekOf(), mine = ctx.data.fun?.votes?.[week]?.[st.kid] || "";
  const dish = dinnerToday(ctx);
  ctx.sheet(`<h2>🍽️ ${esc(dish ? t("I aften: {dish}", { dish }) : t("Madplanen"))}</h2><p class="t-sub">${esc(t("Hvad skal vi spise i næste uge? Stem på din favorit. De voksne kan se det i madplanen."))}</p>
    <div class="fun-row">${DISHES.map((d) => `<button class="pl-chip" data-act="life-vote" data-k="${esc(d)}" aria-pressed="${mine === d}">${esc(t(d))}</button>`).join("")}</div>
    <div class="pl-story-new"><input class="input" data-vote maxlength="40" placeholder="${esc(t("Eller skriv din egen ret"))}"><button class="btn" data-act="life-vote">${esc(t("Stem"))}</button></div>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Luk"))}</button></div>`);
}
function weekOf(d = new Date()) {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(m.getDate()).padStart(2, "0")}`;
}
/* The children's votes for the meal plan page (hv-lists): [[dish, [names]]]. */
export function votesOf(ctx) {
  const v = ctx.data.fun?.votes?.[weekOf()] || {}, by = {};
  for (const [id, dish] of Object.entries(v)) (by[dish] ||= []).push(nameOf(ctx, id));
  return Object.entries(by).sort((a, b) => b[1].length - a[1].length);
}

/* ------------------------------------------------------------------ 4. homework becomes knowledge */
const subjectOf = (id) => {
  const slug = String(id).split(":")[2] || "";
  const w = slug.split("-")[0] || "lektier";
  return w.charAt(0).toUpperCase() + w.slice(1);
};
const DISCOVER = [[5, "teleskop"], [10, "mikroskop"], [15, "globus"], [20, "krystalkugle"], [30, "stortavle"]];
/* New homework done (on any screen) counts once. Returns true when something was learnt. */
export function syncKnowledge(ctx) {
  const st = A.st(), kid = st.kid, k = (st.d.know ||= { seen: [], subj: {} });
  let fresh = 0;
  for (const day of [ctx.data.done_today || {}, ...Object.values(ctx.data.done_week || {})])
    for (const key of Object.keys(day || {})) {
      if (!key.startsWith("lektie:") || !key.endsWith(`:${kid}`)) continue;
      const id = key.slice(0, -(kid.length + 1));
      if (k.seen.includes(id)) continue;
      k.seen = [...k.seen, id].slice(-200);
      const s = subjectOf(id);
      k.subj[s] = (k.subj[s] || 0) + 1;
      fresh++;
    }
  if (!fresh) return false;
  const total = Object.values(k.subj).reduce((a, n) => a + n, 0), owned = A.owned();
  const gift = DISCOVER.find(([n, item]) => total >= n && A.CAT[item] && !owned.has(item));
  if (gift) A.unlock([gift[1]], 0).then(() => ctx.toast(ctx.t("Din viden har åbnet: {name}!", { name: ctx.t(A.CAT[gift[1]].n) })));
  A.save(ctx);
  return true;
}
export function shelfSvg(ctx) {
  const st = A.st();
  if (A.spaceId() !== "vaerelse" || st.build) return "";
  const subj = st.d.know?.subj || {}, books = Object.values(subj).reduce((a, n) => a + n, 0);
  const cols = ["#E5484D", "#4D96FF", "#FFD93D", "#6BCB77", "#9B5DE5", "#FF8A3C"];
  const shown = Math.min(14, books);
  return `<g class="lf-shelf" data-pl="lf-know" role="button" aria-label="${esc(ctx.t("Min viden"))}" transform="translate(110 250)"><rect x="-6" y="0" width="200" height="12" rx="4" fill="#C98B55" stroke="${OL}" stroke-width="3"/>${Array.from({ length: shown }, (_, i) => `<rect x="${i * 13}" y="${-34 - (i % 3) * 4}" width="11" height="${34 + (i % 3) * 4}" rx="2" fill="${cols[i % cols.length]}" stroke="${OL}" stroke-width="1.5"/>`).join("")}${books ? "" : `<text x="94" y="-10" text-anchor="middle" class="lf-small">📚 0</text>`}</g>`;
}
function knowSheet(ctx) {
  const st = A.st(), t = ctx.t, subj = Object.entries(st.d.know?.subj || {}).sort((a, b) => b[1] - a[1]), total = subj.reduce((a, [, n]) => a + n, 0);
  const next = DISCOVER.find(([n]) => total < n);
  ctx.sheet(`<h2>📚 ${esc(t("Min viden"))}</h2><p class="t-sub">${esc(t("Hver lektie bliver til en bog på din hylde. For hver 5 i et fag får du et stempel."))}</p>
    ${subj.length ? `<ul class="lf-know">${subj.map(([s, n]) => `<li><b>${esc(s)}</b><span>${"📕".repeat(Math.min(n, 10))}</span><i>${"⭐".repeat(Math.floor(n / 5)) || "·"}</i></li>`).join("")}</ul>` : `<p>${esc(t("Ingen lektier endnu. Når du laver dem, kommer bøgerne her."))}</p>`}
    ${next ? `<p class="t-sub">${esc(t("{n} lektier mere, så opdager du noget nyt.", { n: next[0] - total }))}</p>` : ""}
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Luk"))}</button></div>`);
}

/* ------------------------------------------------------------------ 5. the routines are the game's day */
const evening = () => {
  const h = new Date().getHours();
  return h >= 19 || h < 6;
};
/* Pyjamas in the evening, at home. */
export const nightLook = (me, sid) => (evening() && (sid === "vaerelse" || String(sid).startsWith("h:")) ? { ...me, topk: "pyjamas", botk: "bukser", bottom: me.top || "#4D96FF", shoek: "sandaler", extra: "ingen", acc: "ingen" } : me);
/* The first visit of a morning, before the morning routine: in bed. */
export function wakeUp(ctx) {
  const st = A.st(), m = ctx.member(st.kid), h = new Date().getHours();
  if (!m || h < 5 || h >= 11 || st.d.woke === today() || A.spaceId() !== "vaerelse") return;
  const morning = Kids.routineMissions ? Kids.routineMissions(ctx, m.id).find((x) => x.slot === "morgen") : null;
  st.d.woke = today();
  if (!morning || morning.done) return;
  const bed = (st.d.items || []).find((it) => ["bed", "bunk", "dobbeltseng", "slotsseng", "muslingeseng"].includes(it.k));
  if (bed) st.d.seat = { space: "vaerelse", id: bed.id, x: bed.x, y: bed.y };
  A.save(ctx);
}
/* A card done: the avatar does it. */
export function cardDone(ctx, em) {
  const st = A.st();
  A.floatIcons(ctx, st.d.ax, st.d.ay - 260, [em, "✨"]);
}
/* The moon by the window in the evening: a good-night story. */
export function nightSvg(ctx) {
  if (!evening() || A.spaceId() !== "vaerelse" || A.st().build) return "";
  return `<g class="lf-moon" data-pl="lf-night" role="button" aria-label="${esc(ctx.t("Godnathistorie"))}" transform="translate(944 172)"><circle r="30" fill="#FFF6C9" stroke="${OL}" stroke-width="3"/><circle cx="12" cy="-8" r="26" fill="#2E3A6E"/><text x="-62" y="-20" class="lf-small">📖</text></g>`;
}
function story(ctx) {
  const st = A.st(), t = ctx.t, m = ctx.member(st.kid), name = m?.name || "";
  const seen = (st.d.seen || []).slice(-3).map((k) => World.PLACES[k]?.n).filter(Boolean);
  const place = seen.length ? t(seen[seen.length - 1]) : t("Centrum");
  const pool = Object.values(World.NPCS);
  const friend = pool[(new Date().getDate() * 7 + name.length) % pool.length][0];
  const dish = dinnerToday(ctx);
  const done = Object.keys(ctx.data.done_today || {}).filter((k) => k.endsWith(`:${st.kid}`)).length;
  const lines = [
    t("Der var engang et barn, der hed {name}.", { name }),
    t("I dag var {name} en tur i {place}, og der mødte {name} {friend}.", { name, place, friend }),
    done ? t("{friend} havde hørt, at {name} havde klaret {n} ting i dag, og blev så glad, at alle stjernerne på himlen begyndte at blinke.", { friend, name, n: done }) : t("{friend} fortalte om en hemmelig stjerne, der kun lyser for børn, der hjælper hinanden.", { friend }),
    dish ? t("Til aftensmad var der {dish}, og det duftede helt ud på gaden.", { dish }) : t("Om aftenen duftede hele byen af pandekager."),
    t("Nu ligger {name} i sin seng. Månen kigger ind ad vinduet og hvisker: Godnat, {name}. I morgen bliver en god dag.", { name }),
  ];
  return lines;
}
function storySheet(ctx) {
  const t = ctx.t, lines = story(ctx);
  ctx.sheet(`<h2>🌙 ${esc(t("Godnathistorie"))}</h2><div class="lf-story">${lines.map((l) => `<p>${esc(l)}</p>`).join("")}</div><div class="sheet-actions"><button class="btn soft" data-act="life-read">🔊 ${esc(t("Læs højt"))}</button><button class="btn" data-close>${esc(t("Godnat"))}</button></div>`);
}

/* ------------------------------------------------------------------ 6. the family's building site (in Centrum) */
export const BUILD_NAMES = { legeplads: "Legepladsen", traehule: "Trætophulen", zoo: "Zoo", observatorium: "Observatoriet", karrusel: "Karrusellen", badesoe: "Badesøen", borg: "Borgen", raketbase: "Raketbasen" };
const BUILD_NEED = { legeplads: 20, traehule: 25, zoo: 30, observatorium: 35, karrusel: 35, badesoe: 40, borg: 45, raketbase: 50 };
const BUILD_ORDER = Object.keys(BUILD_NAMES);
/* What a finished project puts on the site. */
const BUILT_DECOR = {
  legeplads: [["gyngestativ", 140, 470], ["rutsjebane", 300, 470]],
  traehule: [["trae", 460, 450], ["pudefort", 470, 600]],
  zoo: [["ko", 620, 610], ["gris", 720, 620], ["faar", 820, 610]],
  observatorium: [["teleskop", 900, 470]],
  karrusel: [["karrusel", 220, 610]],
  badesoe: [["badebassin", 560, 520]],
  borg: [["slotsport", 760, 470]],
  raketbase: [["raket", 940, 600]],
};
export function siteState(ctx) {
  const b = ctx.data.fun?.build || { i: 0, bricks: 0, who: {}, built: [] };
  const name = BUILD_ORDER[(b.i || 0) % BUILD_ORDER.length];
  return { ...b, name, need: BUILD_NEED[name] };
}
export function siteSvg(ctx) {
  if (A.spaceId() !== "by-byg") return "";
  const b = siteState(ctx), CAT = A.CAT, t = ctx.t;
  let s = "";
  for (const done of b.built || []) for (const [k, x, y] of BUILT_DECOR[done] || []) if (CAT[k]) s += `<g transform="translate(${x} ${y}) scale(.8)" pointer-events="none">${CAT[k].d(CAT[k].c)}</g>`;
  // The project under way: scaffolding that fills up with bricks.
  const p = Math.min(1, b.bricks / b.need), h = 40 + p * 200;
  s += `<g class="lf-site" pointer-events="none" transform="translate(500 600)"><rect x="-130" y="${-h}" width="260" height="${h}" fill="#E8C39E" stroke="${OL}" stroke-width="4"/>${Array.from({ length: Math.floor(h / 22) }, (_, i) => Array.from({ length: 6 }, (_, j) => `<rect x="${-126 + j * 42 + (i % 2) * 21}" y="${-20 - i * 22}" width="38" height="18" rx="2" fill="#C2502A" stroke="${OL}" stroke-width="1.5"/>`).join("")).join("")}<path d="M-150 0 V-260 M150 0 V-260 M-150 -130 H150 M-150 -250 H150" stroke="#9AA4BA" stroke-width="8"/></g>`;
  s += `<g class="lf-sitesign" pointer-events="none" transform="translate(500 120)"><rect x="-200" y="-36" width="400" height="72" rx="14" fill="#FFD93D" stroke="${OL}" stroke-width="4"/><text y="-6" text-anchor="middle" class="lf-dt" style="fill:#2B2340">🧱 ${esc(t(BUILD_NAMES[b.name]))}</text><text y="22" text-anchor="middle" class="lf-small">${b.bricks} / ${b.need}</text></g>`;
  return s;
}
/* The building site in the family sheet. */
export function siteSection(ctx) {
  const b = siteState(ctx), t = ctx.t;
  return `<div class="fun-sec"><b>🧱 ${esc(t("Familiens byggeplads"))}</b><p>${esc(t("Alt det, I klarer derhjemme, lægger mursten. Nu bygger I: {name}.", { name: t(BUILD_NAMES[b.name]) }))}</p><i class="fun-prog" style="--p:${Math.round((b.bricks / b.need) * 100)}%"></i><small>${b.bricks} / ${b.need}${Object.keys(b.who || {}).length ? ` · ${esc(Object.entries(b.who).filter(([, n]) => n > 0).map(([id, n]) => `${nameOf(ctx, id)} ${n}`).join(", "))}` : ""}</small>${(b.built || []).length ? `<small>${esc(t("Bygget"))}: ${esc(b.built.map((x) => t(BUILD_NAMES[x] || x)).join(", "))}</small>` : ""}<button class="pl-chip" data-act="fun-go" data-k="by-byg">${esc(t("Gå til byggepladsen"))}</button></div>`;
}

/* ------------------------------------------------------------------ 7./8. help each other */
export function helpSection(ctx) {
  const st = A.st(), t = ctx.t, f = ctx.data.fun || {}, me = ctx.member(st.kid), parent = me?.role === "parent" || ctx.isParent;
  const others = ctx.members().filter((x) => x.id !== st.kid);
  const open = others.flatMap((x) => openTasks(ctx, x).slice(0, 3).map((task) => ({ ...task, p: x })));
  const mineAsked = (f.helps || []).filter((h) => !h.ok && (h.for === st.kid || parent));
  let h = `<div class="fun-sec"><b>🤝 ${esc(t("Hjælp hinanden"))}</b>`;
  if (mineAsked.length) h += `<ul class="fun-tasks">${mineAsked.map((x) => `<li><span class="fun-em">🤝</span><div><div>${esc(t("{by} hjalp {for} med: {title}", { by: nameOf(ctx, x.by), for: x.for === st.kid ? t("dig") : nameOf(ctx, x.for), title: x.title }))}</div><small>${esc(t("Passer det? Så får I begge mønter."))}</small></div><div class="fun-tr"><button class="btn" data-act="life-help-ok" data-k="${esc(x.id)}">${esc(t("Ja, tak!"))}</button></div></li>`).join("")}</ul>`;
  h += open.length ? `<ul class="fun-tasks">${open.map((x) => `<li><span class="fun-em">${esc(x.em)}</span><div><div>${esc(x.title)}</div><small>${esc(x.p.name)}</small></div><div class="fun-tr">${(f.helps || []).some((hh) => hh.by === st.kid && hh.task === x.id && !hh.ok) ? `<small>${esc(t("Venter på {name}", { name: x.p.name }))}</small>` : `<button class="pl-chip" data-act="life-help" data-helped="${esc(x.p.id)}" data-k="${esc(x.id)}" data-title="${esc(x.title)}">🤝 ${esc(t("Jeg hjalp!"))}</button>`}</div></li>`).join("")}</ul>` : `<p class="t-sub">${esc(t("Ingen har noget, de mangler hjælp til lige nu."))}</p>`;
  return h + `</div>`;
}

/* ------------------------------------------------------------------ 9. the postman brings the day */
function letter(ctx) {
  const st = A.st(), kid = st.kid, t = ctx.t, lines = [];
  const now = new Date(), tomorrow = new Date(now.getTime() + 864e5);
  for (const [d, label] of [[now, t("I dag")], [tomorrow, t("I morgen")]]) {
    const pf = Kids.pickupFor ? Kids.pickupFor(ctx, kid, d) : null;
    if (pf?.hent?.name) lines.push(`🚗 ${label}: ${t("{who} henter dig kl. {at}", { who: pf.hent.name, at: pf.hent.at || "" })}`);
    if (pf?.bring?.name && d === tomorrow) lines.push(`🎒 ${label}: ${t("{who} følger dig", { who: pf.bring.name })}`);
    let evs = null;
    try {
      evs = Lists.weekEvents ? Lists.weekEvents(ctx) : null;
    } catch (err) {
      evs = null;
    }
    for (const e of (evs || []).filter((e) => !e.pick && e.start.toDateString() === d.toDateString() && (e.who || []).some((w) => w === kid || w === "familie")).slice(0, 3))
      lines.push(`📅 ${label}: ${e.title}${e.allDay ? "" : ` ${t("kl.")} ${String(e.start.getHours()).padStart(2, "0")}.${String(e.start.getMinutes()).padStart(2, "0")}`}`);
  }
  const dish = dinnerToday(ctx);
  if (dish) lines.push(`🍽️ ${t("I aften")}: ${dish}`);
  const f = (ctx.forecast?.daily || []).find((x) => new Date(x.datetime).toDateString() === tomorrow.toDateString());
  if (f && /rain|pour/.test(f.condition)) lines.push(`☔ ${t("I morgen regner det. Husk regntøj!")}`);
  if (f && /snow/.test(f.condition)) lines.push(`❄️ ${t("I morgen sner det. Husk vanter!")}`);
  return lines;
}
export function mailSvg(ctx) {
  const st = A.st();
  if (A.spaceId() !== "vaerelse" || st.build || st.d.mail === today() || !letter(ctx).length) return "";
  return `<g class="lf-mail" data-pl="lf-mail" role="button" aria-label="${esc(ctx.t("Post fra Postbud Per"))}" transform="translate(860 62)"><rect x="-34" y="-24" width="68" height="48" rx="8" fill="#fff" stroke="${OL}" stroke-width="4"/><path d="M-34 -24 L0 6 L34 -24" fill="none" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><circle cx="28" cy="-22" r="10" fill="#E5484D" stroke="#fff" stroke-width="3"/></g>`;
}
function mailSheet(ctx) {
  const st = A.st(), t = ctx.t, N = World.NPCS.per;
  st.d.mail = today();
  A.save(ctx);
  ctx.sheet(`<div class="lf-who">${N ? `<svg viewBox="-130 -330 260 340" aria-hidden="true">${charSvg(N[3], "", A.avatarSvg)}</svg>` : ""}<div><h2>📬 ${esc(t("Post fra Postbud Per"))}</h2><p class="t-sub">${esc(t("Hej {name}! Her er din dag.", { name: nameOf(ctx, st.kid) }))}</p></div></div><ul class="lf-letter">${letter(ctx).map((l) => `<li>${esc(l)}</li>`).join("")}</ul><div class="sheet-actions"><button class="btn" data-close>${esc(t("Tak, Per!"))}</button></div>`);
  setTimeout(() => A.redraw(ctx), 50);
}

/* ------------------------------------------------------------------ 10. when the game may be played */
export function gate(ctx) {
  const st = A.st(), m = ctx.member(st.kid), g = m?.game_gate;
  if (!m || m.role !== "child" || !g || g.mode === "off" || ctx.isParent) return { blocked: false };
  const t = ctx.t;
  if (g.mode === "morning") {
    const r = Kids.routineMissions ? Kids.routineMissions(ctx, m.id).find((x) => x.slot === "morgen") : null;
    // Only in the morning: after noon the morning routine no longer holds the game back.
    return r && !r.done && new Date().getHours() < 12 ? { blocked: true, text: t("Spillet åbner, når morgenrutinen er klaret 🌅") } : { blocked: false };
  }
  if (g.mode === "homework") {
    const hw = openTasks(ctx, m).filter((x) => x.kind === "homework");
    return hw.length ? { blocked: true, text: t("Spillet åbner, når lektierne er lavet ✏️") } : { blocked: false };
  }
  if (g.mode === "missions") {
    const left = openTasks(ctx, m).length;
    return left ? { blocked: true, text: t("Spillet åbner, når dagens opgaver er klaret ({n} tilbage)", { n: left }) } : { blocked: false };
  }
  // Earned: minutes for every thing done today, plus a start.
  const dt = ctx.data.done_today || {}, cards = (ctx.data.board_done?.[m.id] || []).filter((k) => !k.endsWith(":bonus")).length;
  const done = Object.keys(dt).filter((k) => k.endsWith(`:${m.id}`)).length + cards;
  const played = ctx.data.fun?.played?.[m.id], used = played?.date === today() ? played.min : 0;
  const left = (g.base ?? 15) + (g.per ?? 10) * done - used;
  return left > 0 ? { blocked: false, left } : { blocked: true, left: 0, text: t("Tiden er brugt i dag. Hjælp til, så får du {n} minutter mere for hver ting.", { n: g.per ?? 10 }) };
}
export function gateSvg(ctx, g) {
  if (!g?.blocked) return "";
  return `<g class="lf-gate" pointer-events="none"><rect x="230" y="260" width="540" height="96" rx="24" fill="#fff" stroke="${OL}" stroke-width="5"/><text x="500" y="300" text-anchor="middle" class="lf-dt" style="fill:#2B2340">🔒 ${esc(ctx.t("Spillet holder pause"))}</text><text x="500" y="336" text-anchor="middle" class="lf-small">${esc(g.text.length > 60 ? g.text.slice(0, 58) + "…" : g.text)}</text></g>`;
}
/* A minute of play, while the game is on the screen and a child earns time. */
let tickT = null;
export function startTicks(ctx) {
  clearInterval(tickT);
  tickT = setInterval(() => {
    const st = A.st(), m = st && ctx.member(st.kid);
    if (!m || ctx.view !== "vaerelse" || !ctx.host?.isConnected || document.hidden) return;
    if (m.game_gate?.mode !== "earn" || m.role !== "child") return;
    ctx
      .ws("fun", { action: "tick", member: m.id })
      .then((res) => {
        if (res) ctx.data.fun = res;
        const g = gate(ctx);
        if (g.blocked || (g.left != null && g.left <= 2)) A.redraw(ctx);
      })
      .catch(() => {});
  }, 60000);
}

/* ------------------------------------------------------------------ taps on the stage */
export function tapStage(ctx, t) {
  const pl = t?.dataset?.pl;
  if (pl === "lf-vote") return voteSheet(ctx), true;
  if (pl === "lf-know") return knowSheet(ctx), true;
  if (pl === "lf-night") return storySheet(ctx), true;
  if (pl === "lf-mail") return mailSheet(ctx), true;
  if (pl === "lf-plant") {
    const st = A.st(), n = Math.min(7, goodDays(ctx, st.kid));
    A.say(ctx, 620, 380, `🌱 ${ctx.t("Ugens plante vokser for hver god dag: {n} af 7", { n })}`);
    return true;
  }
  return false;
}
export const acts = {
  "life-done": async (el, ev, ctx) => {
    el.closest(".sheet-bg")?.close?.();
    const ok = await A.complete(ctx, el.dataset.kind, el.dataset.k);
    if (ok) await thanks(ctx, el.dataset.npc);
  },
  "life-help": async (el, ev, ctx) => {
    const st = A.st();
    try {
      const res = await ctx.ws("fun", { action: "help_ask", member: st.kid, helped: el.dataset.helped, task: el.dataset.k, title: el.dataset.title });
      if (res) ctx.data.fun = res;
      Sound.sfx("buy");
      ctx.toast(ctx.t("Sendt! {name} siger ja, når I har gjort det.", { name: nameOf(ctx, el.dataset.helped) }));
      el.closest(".sheet-bg")?.close?.();
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
  "life-help-ok": async (el, ev, ctx) => {
    try {
      const res = await ctx.ws("fun", { action: "help_ok", help: el.dataset.k });
      if (res) ctx.data.fun = res;
      Sound.sfx("level");
      el.closest("li")?.remove();
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
  "life-vote": async (el, ev, ctx) => {
    const st = A.st(), typed = el.closest(".sheet")?.querySelector("[data-vote]")?.value?.trim(), dish = el.dataset.k || typed;
    if (!dish) return;
    try {
      const res = await ctx.ws("fun", { action: "vote", member: st.kid, dish });
      if (res) ctx.data.fun = res;
      Sound.sfx("pop");
      el.closest(".sheet-bg")?.close?.();
      ctx.toast(ctx.t("Din stemme: {dish}", { dish: ctx.t(dish) }));
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
  "life-read": (el, ev, ctx) => {
    try {
      const u = new SpeechSynthesisUtterance(story(ctx).join(" "));
      u.lang = ctx.lang() === "da" ? "da-DK" : "en-GB";
      u.rate = 0.9;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (err) {
      ctx.toast(ctx.t("Kan ikke læse højt her"));
    }
  },
};

export const LIFE_CSS = `
.lf-q { font: 900 30px system-ui, sans-serif; fill: #fff; }
.lf-quest { animation: lfbob 1.6s ease-in-out infinite; transform-box: fill-box; }
@keyframes lfbob { 50% { transform: translateY(-8px); } }
.lf-spark { font-size: 26px; animation: plglint 3s ease-in-out infinite; opacity: 0; }
.lf-dt { font: 800 22px system-ui, sans-serif; fill: #FFF3D6; }
.lf-small { font: 800 16px system-ui, sans-serif; fill: #2B2340; }
.lf-dinner, .lf-shelf, .lf-moon, .lf-mail, .lf-plant { cursor: pointer; }
.lf-mail { animation: lfbob 2s ease-in-out infinite; transform-box: fill-box; }
.lf-who { display: flex; gap: 12px; align-items: center; }
.lf-who svg { width: 90px; height: 110px; flex: none; }
.lf-tasks { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 8px; }
.lf-tasks li { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 14px; background: var(--card2, #F6F3FA); }
.lf-tasks li b { flex: 1; }
.lf-tasks li span { font-size: 24px; }
.lf-know { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 6px; }
.lf-know li { display: grid; grid-template-columns: 120px 1fr auto; gap: 8px; align-items: center; }
.lf-story p { font-size: 17px; line-height: 1.55; margin: 0 0 10px; }
.lf-letter { margin: 10px 0; padding-left: 0; list-style: none; display: grid; gap: 8px; font-size: 16px; }
.pl-timer { display: inline-flex; align-items: center; gap: 4px; padding: 8px 12px; border-radius: 999px; background: #E2F5D9; font-weight: 800; }
.pl-timer.low { background: #FFE0E0; }
`;

export const LIFE_EN = {
  "Kan du hjælpe mig? Når du har gjort det rigtigt derhjemme, så tryk Klaret!": "Can you help me? When you have really done it at home, tap Done!",
  "Klaret!": "Done!", Senere: "Later", "{name} har brug for hjælp": "{name} needs help",
  "Vil du hjælpe til? Når I har gjort det sammen, siger {name} ja, og I får begge mønter.": "Will you help? When you have done it together, {name} says yes, and you both get coins.",
  "Jeg hjælper!": "I'll help!", "Tusind tak for hjælpen!": "Thank you so much for helping!", "En tak-gave: {name}!": "A thank-you present: {name}!",
  "Ugens plante": "The plant of the week", "Ugens plante vokser for hver god dag: {n} af 7": "The plant of the week grows with every good day: {n} of 7",
  "I aften": "Tonight", "Hvad skal vi spise?": "What shall we eat?", "I aften: {dish}": "Tonight: {dish}", Madplanen: "The meal plan",
  "Hvad skal vi spise i næste uge? Stem på din favorit. De voksne kan se det i madplanen.": "What shall we eat next week? Vote for your favourite. The grown-ups can see it in the meal plan.",
  "Eller skriv din egen ret": "Or write your own dish", Stem: "Vote", "Din stemme: {dish}": "Your vote: {dish}",
  Pizza: "Pizza", "Pasta med kødsovs": "Pasta bolognese", Tacos: "Tacos", Lasagne: "Lasagne", Fiskefrikadeller: "Fish cakes", "Kylling i karry": "Chicken curry", Suppe: "Soup", Pandekager: "Pancakes", Burger: "Burger", Frikadeller: "Meatballs", Sushi: "Sushi", "Risengrød": "Rice pudding", "Boller i karry": "Meatballs in curry", Wok: "Stir-fry",
  "Min viden": "My knowledge", "Hver lektie bliver til en bog på din hylde. For hver 5 i et fag får du et stempel.": "Every piece of homework becomes a book on your shelf. For every 5 in a subject you get a stamp.",
  "Ingen lektier endnu. Når du laver dem, kommer bøgerne her.": "No homework yet. When you do it, the books come here.", "{n} lektier mere, så opdager du noget nyt.": "{n} more pieces of homework, and you discover something new.", "Din viden har åbnet: {name}!": "Your knowledge has opened: {name}!",
  Godnathistorie: "Bedtime story", "Læs højt": "Read aloud", Godnat: "Good night", "Kan ikke læse højt her": "Can't read aloud here",
  "Der var engang et barn, der hed {name}.": "Once upon a time there was a child called {name}.",
  "I dag var {name} en tur i {place}, og der mødte {name} {friend}.": "Today {name} went to {place}, and there {name} met {friend}.",
  "{friend} havde hørt, at {name} havde klaret {n} ting i dag, og blev så glad, at alle stjernerne på himlen begyndte at blinke.": "{friend} had heard that {name} had done {n} things today, and was so happy that all the stars in the sky began to twinkle.",
  "{friend} fortalte om en hemmelig stjerne, der kun lyser for børn, der hjælper hinanden.": "{friend} told of a secret star that only shines for children who help each other.",
  "Til aftensmad var der {dish}, og det duftede helt ud på gaden.": "For dinner there was {dish}, and you could smell it all the way out in the street.",
  "Om aftenen duftede hele byen af pandekager.": "In the evening the whole town smelled of pancakes.",
  "Nu ligger {name} i sin seng. Månen kigger ind ad vinduet og hvisker: Godnat, {name}. I morgen bliver en god dag.": "Now {name} is in bed. The moon looks in through the window and whispers: Good night, {name}. Tomorrow will be a good day.",
  Legepladsen: "The playground", "Trætophulen": "The tree house", Zoo: "The zoo", Observatoriet: "The observatory", Karrusellen: "The carousel", "Badesøen": "The bathing lake", Borgen: "The castle", Raketbasen: "The rocket base",
  "Familiens byggeplads": "The family's building site", "Alt det, I klarer derhjemme, lægger mursten. Nu bygger I: {name}.": "Everything you do at home lays bricks. Now you are building: {name}.", Bygget: "Built", "Gå til byggepladsen": "Go to the building site",
  "Hjælp hinanden": "Help each other", "{by} hjalp {for} med: {title}": "{by} helped {for} with: {title}", dig: "you", "Passer det? Så får I begge mønter.": "Is that right? Then you both get coins.", "Ja, tak!": "Yes, thanks!",
  "Jeg hjalp!": "I helped!", "Venter på {name}": "Waiting for {name}", "Ingen har noget, de mangler hjælp til lige nu.": "Nobody needs help right now.", "Sendt! {name} siger ja, når I har gjort det.": "Sent! {name} says yes when you have done it.",
  "Post fra Postbud Per": "Mail from Per the postman", "Hej {name}! Her er din dag.": "Hi {name}! Here is your day.", "Tak, Per!": "Thanks, Per!", "I dag": "Today", "I morgen": "Tomorrow",
  "{who} henter dig kl. {at}": "{who} picks you up at {at}", "{who} følger dig": "{who} takes you", "kl.": "at", "I morgen regner det. Husk regntøj!": "It rains tomorrow. Remember rainwear!", "I morgen sner det. Husk vanter!": "It snows tomorrow. Remember mittens!",
  "Spillet åbner, når morgenrutinen er klaret 🌅": "The game opens when the morning routine is done 🌅", "Spillet åbner, når lektierne er lavet ✏️": "The game opens when the homework is done ✏️",
  "Spillet åbner, når dagens opgaver er klaret ({n} tilbage)": "The game opens when today's tasks are done ({n} left)", "Tiden er brugt i dag. Hjælp til, så får du {n} minutter mere for hver ting.": "Time is up for today. Help out, and you get {n} more minutes for each thing.",
  "Spillet holder pause": "The game is taking a break", "{n} min": "{n} min",
};
void A;
/* What this module shows that comes from elsewhere (the calendars, today's done things): when it changes, the
   game draws again (the game page keeps itself and is not redrawn by the panel). */
export function sig(ctx) {
  try {
    return JSON.stringify([dinnerToday(ctx), letter(ctx).length, Object.keys(ctx.data.done_today || {}).length, ctx.data.board_done?.[A.st().kid]?.length || 0]);
  } catch (err) {
    return "";
  }
}
