/* Hverdagsro – the setup guide and the family settings.
   The guide (view "guide") walks a parent through everything with smart defaults; each step is saved
   when the parent goes on, so it can be resumed. "indstillinger" holds the same editors as tabs. */
import { esc, slug } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import { occasions, activeDecor, dayNumber, wedName } from "./hv-decor.js";
import * as House from "./hv-house.js";

/* ------------------------------------------------------------------ constants */
const PALETTE = ["#EE5E52", "#3B6BF5", "#8B5CF6", "#1FA36A", "#E39A1C", "#E4568C", "#11A39A", "#6E4AFF", "#0EA5E9", "#C2703D"];
const BIN_COLORS = ["#4B5563", "#2F7D4F", "#8B5E3C", "#2F6FED", "#E3A21A", "#10B981", "#D9473B", "#7C3AED"];
const INST = [
  ["none", "Hjemme", "🏠"],
  ["dagpleje", "Dagpleje", "🧸"],
  ["vuggestue", "Vuggestue", "🍼"],
  ["bornehave", "Børnehave", "🎨"],
  ["skole", "Skole", "🎒"],
];
/* [module, name, icon, colour, description] */
const MODS = [
  ["missions", "Opgaver", "tasks", "#3B6BF5", "Faste opgaver og missioner, børnene krydser af."],
  ["points", "Point", "pstar", "#E3A21A", "Børnene tjener point, når opgaverne er klaret."],
  ["shop", "Pointshop", "shop", "#E4568C", "Point byttes til belønninger, som I godkender."],
  ["lists", "Lister", "lists", "#10B981", "Indkøb og huskelister fra Home Assistant."],
  ["calendar", "Kalender", "cal", "#6E4AFF", "Familiens kalendere samlet ét sted og i tidslinjen."],
  ["meals", "Madplan", "food", "#F97316", "Ugens aftensmad fra en kalender."],
  ["music", "Musik", "music", "#DB2777", "Styr højttalerne, skift rum og spil overalt."],
  ["appliances", "Apparater", "plug", "#64748B", "Vaskemaskine, opvasker, robotter og meget mere."],
  ["security", "Sikkerhed", "shield", "#2F6FED", "Alarm, døre, vinduer, låse og kameraer."],
  ["house", "Huset", "house", "#0EA5A0", "Tegn huset, og se det hele leve på en plan."],
  ["decor", "Pynt", "sparkle", "#C9A227", "Himlen pynter selv op til jul, fødselsdage og mærkedage."],
  ["energy", "Elpris", "bolt", "#22C55E", "Elprisen hen over dagen i tidslinjen."],
  ["waste", "Affald", "trash2", "#2F7D4F", "Skraldespandene i himlen, når der er tømning."],
];
const STEPS = [
  ["velkommen", "Velkommen", "👋", "#6E4AFF", "#11A39A"],
  ["familie", "Familien", "👨‍👩‍👧‍👦", "#EE5E52", "#E39A1C"],
  ["moduler", "Moduler", "✨", "#E3A21A", "#E4568C"],
  ["hjemmet", "Hjemmet", "🏡", "#11A39A", "#3B6BF5"],
  ["huset", "Huset", "📐", "#3B6BF5", "#8B5CF6"],
  ["faerdig", "Færdig", "🎉", "#1FA36A", "#11A39A"],
];
const TABS = [
  ["familie", "Familien", "users"],
  ["moduler", "Moduler", "grid"],
  ["hjemmet", "Hjemmet", "home"],
  ["pynt", "Pynt", "sparkle"],
  ["avanceret", "Avanceret", "sliders"],
];
const DOMAIN_ICON = { weather: "sun", calendar: "cal", todo: "lists", alarm_control_panel: "shieldf", media_player: "speaker", camera: "camera", sensor: "bolt", person: "user", device_tracker: "walk" };
/* Settings keys that are entities: [key, domains, multi, title] */
const PICKS = {
  weather: [["weather"], false, "Vejr"],
  calendars: [["calendar"], true, "Kalendere"],
  meals_calendar: [["calendar"], false, "Madplan"],
  todo: [["todo"], true, "Lister"],
  alarm: [["alarm_control_panel"], false, "Alarm"],
  media: [["media_player"], true, "Højttalere og TV"],
  cameras: [["camera"], true, "Kameraer"],
  price: [["sensor"], false, "Elpris"],
};
const RE_MEALS = /\b(mad|madplan|meal|meals|food|dinner|aftensmad|menu)/i;
const RE_WASTE = /(affald|skrald|waste|garbage|trash|renovation|papir|plast|rest|bio|glas|metal|pap\b|tømning|tomning)/i;
const RE_OUTDOOR = /(have|garden|terrasse|terrace|indkørsel|indkorsel|driveway|udenfor|outdoor|yard|altan|balcony|carport|gård|gaard)/i;

/* ------------------------------------------------------------------ local state */
let MODE = "set"; // "guide" while rendering the guide
let TAB = "familie";
let G = null; // the guide's drafts
let F = null; // the family draft in settings
let Fdirty = false;
let previewTimer = null;
let lastAnim = "";
/* Entrance animations only when a step or tab is shown, not on every re-render. */
function animClass(key) {
  const a = key !== lastAnim;
  lastAnim = key;
  return a ? " set-anim" : "";
}

const clone = (x) => JSON.parse(JSON.stringify(x));
const hasHouse = () => typeof House.guessType === "function";

/* ------------------------------------------------------------------ detection */
const nameOf = (ctx, id) => ctx.name(id);
function isPrice(st) {
  const a = st?.attributes || {};
  return ["raw_today", "today", "prices_today"].some((k) => Array.isArray(a[k]) && a[k].length) || /\/\s*kwh/i.test(a.unit_of_measurement || "");
}
function isWaste(ctx, id) {
  const st = ctx.hass.states[id];
  if (!st) return false;
  if (id.startsWith("calendar.")) return RE_WASTE.test(nameOf(ctx, id) + " " + id);
  if (!id.startsWith("sensor.")) return false;
  const n = nameOf(ctx, id) + " " + id;
  return RE_WASTE.test(n) && (st.attributes.device_class === "date" || /^\d{4}-\d{2}-\d{2}/.test(st.state) || /^\d+$/.test(st.state) || !!st.attributes.next_date);
}
function binColor(name, used = []) {
  const n = String(name).toLowerCase();
  const c = /rest/.test(n) ? "#4B5563" : /mad|bio|organ/.test(n) ? "#8B5E3C" : /papir|pap|paper/.test(n) ? "#2F6FED" : /plast/.test(n) ? "#E3A21A" : /glas|metal/.test(n) ? "#10B981" : /farlig|hazard/.test(n) ? "#D9473B" : null;
  return c || BIN_COLORS.find((x) => !used.includes(x)) || "#2F7D4F";
}
function suggestions(ctx) {
  const E = (d, f) => ctx.entities(d, f);
  const cals = E("calendar");
  const meals = cals.filter((id) => RE_MEALS.test(nameOf(ctx, id) + " " + id));
  const waste = [...E("sensor"), ...cals].filter((id) => isWaste(ctx, id));
  return {
    weather: E("weather")[0] || null,
    calendars: cals.filter((id) => !meals.includes(id) && !waste.includes(id)).slice(0, 8),
    meals_calendar: meals[0] || null,
    todo: E("todo").slice(0, 8),
    alarm: E("alarm_control_panel")[0] || null,
    media: E("media_player").slice(0, 12),
    cameras: E("camera").slice(0, 8),
    price: E("sensor", isPrice)[0] || null,
    waste: waste.slice(0, 8),
  };
}
/* Fill the empty parts of the settings with what Home Assistant has. */
function withSuggestions(ctx, settings) {
  const s = clone(settings);
  const g = suggestions(ctx);
  for (const k of ["weather", "meals_calendar", "alarm", "price"]) if (!s[k] && g[k]) s[k] = g[k];
  for (const k of ["calendars", "todo", "media", "cameras"]) if (!s[k]?.length && g[k].length) s[k] = g[k];
  if (!s.waste?.length && g.waste.length) {
    const used = [];
    s.waste = g.waste.map((id) => {
      const name = nameOf(ctx, id).slice(0, 30);
      const color = binColor(name, used);
      used.push(color);
      return { entity: id, name, color };
    });
  }
  return s;
}

/* ------------------------------------------------------------------ the family */
function userPerson(ctx) {
  const uid = ctx.hass?.user?.id;
  return ctx.entities("person").find((id) => ctx.hass.states[id]?.attributes?.user_id === uid) || null;
}
function uniqueId(name, taken) {
  const base = slug(name).replace(/^_+/, "").slice(0, 40) || "medlem";
  let id = /^[a-z0-9]/.test(base) ? base : `m${base}`;
  let n = 2;
  while (taken.has(id)) id = `${base.slice(0, 44)}_${n++}`;
  taken.add(id);
  return id;
}
function nextColor(list) {
  const used = list.map((m) => m.color);
  return PALETTE.find((c) => !used.includes(c)) || PALETTE[list.length % PALETTE.length];
}
function memberFromPerson(ctx, person, list, taken) {
  const st = ctx.hass.states[person];
  const name = (st?.attributes?.friendly_name || person.split(".")[1]).slice(0, 40);
  const mine = person === userPerson(ctx);
  const role = mine || st?.attributes?.user_id ? "parent" : "child";
  return { id: uniqueId(name, taken), name, role, person, color: nextColor(list), birthday: null, institution: "none", skin: "standard", mode: "auto", calendar: null, device_tracker: null };
}
function familyFromPersons(ctx) {
  const list = [];
  const taken = new Set();
  const mine = userPerson(ctx);
  const persons = ctx.entities("person").sort((a, b) => (a === mine ? -1 : b === mine ? 1 : 0));
  for (const p of persons) list.push(memberFromPerson(ctx, p, list, taken));
  return list;
}
function ageGroup(birthday) {
  if (!birthday) return null;
  const b = new Date(birthday + "T12:00:00");
  const years = (Date.now() - b) / (365.25 * 864e5);
  return years < 1 ? "baby" : years < 4 ? "toddler" : years < 8 ? "child" : years < 11 ? "bigchild" : years < 13 ? "preteen" : years < 17 ? "teen" : "young";
}
function ageText(ctx, birthday) {
  if (!birthday) return "";
  const b = new Date(birthday + "T12:00:00"), n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age >= 0 ? ctx.t("{n} år", { n: age }) : "";
}
/* Problems that would stop the family from being saved, or lock the parent out. */
function familyProblem(ctx, list) {
  if (!list.length) return ctx.t("Tilføj mindst ét familiemedlem.");
  if (list.some((m) => !String(m.name || "").trim())) return ctx.t("Alle skal have et navn.");
  if (!list.some((m) => m.role === "parent")) return ctx.t("Der skal være mindst én forælder.");
  const persons = list.map((m) => m.person).filter(Boolean);
  if (new Set(persons).size !== persons.length) return ctx.t("En person i Home Assistant kan kun være ét familiemedlem.");
  const mine = userPerson(ctx);
  const me = mine && list.find((m) => m.person === mine);
  if (me && me.role !== "parent") return ctx.t("Du er sat som barn. Så kan du ikke længere ændre indstillingerne. Gør dig selv til forælder først.");
  if (!me && !ctx.hass.user?.is_admin) return ctx.t("Du skal selv være med som forælder for at kunne ændre indstillingerne.");
  return null;
}
function cleanFamily(list) {
  return list.map((m) => ({
    id: m.id,
    name: String(m.name).trim().slice(0, 40),
    role: m.role,
    person: m.person || null,
    color: String(m.color || "#6E4AFF").toUpperCase(),
    birthday: m.birthday || null,
    institution: m.role === "child" ? m.institution || "none" : "none",
    skin: m.skin || "standard",
    mode: m.mode || "auto",
    calendar: m.calendar || null,
    device_tracker: m.device_tracker || null,
  }));
}
const fam = (ctx) => (MODE === "guide" ? G.family : F);

/* ------------------------------------------------------------------ settings in the guide or saved directly */
const S = (ctx) => (MODE === "guide" ? G.settings : ctx.data.settings);
const M = (ctx) => (MODE === "guide" ? G.modules : ctx.data.modules);
const isOn = (ctx, m) => M(ctx)?.[m] !== false;
async function setS(ctx, patch) {
  if (MODE === "guide") {
    Object.assign(G.settings, patch);
    ctx.render();
    return;
  }
  const value = { ...ctx.data.settings, ...patch };
  ctx.render();
  if (await ctx.save("settings", value)) ctx.render();
}

/* ------------------------------------------------------------------ small pieces */
function avatarFor(ctx, m, cls = "") {
  const pic = m.person && ctx.hass.states[m.person]?.attributes?.entity_picture;
  return `<span class="av ${cls}" style="background:${esc(m.color)}">${pic ? `<img src="${esc(pic)}" alt="">` : esc((m.name || "?").trim().charAt(0).toUpperCase() || "?")}</span>`;
}
function stateText(ctx, id) {
  const st = ctx.hass.states[id];
  if (!st) return ctx.t("findes ikke");
  const unit = st.attributes.unit_of_measurement;
  return `${st.state}${unit ? " " + unit : ""}`;
}
function entChip(ctx, id, key, removable = true) {
  const dom = id.split(".")[0];
  const missing = !ctx.hass.states[id];
  return `<span class="set-chip${missing ? " miss" : ""}" title="${esc(id)}">${svg(DOMAIN_ICON[dom] || "plug")}<span>${esc(nameOf(ctx, id))}</span>${
    removable ? `<button data-act="set-unpick" data-k="${esc(key)}" data-v="${esc(id)}" aria-label="${esc(ctx.t("Fjern {name}", { name: nameOf(ctx, id) }))}">${svg("x")}</button>` : ""
  }</span>`;
}
function pickField(ctx, key) {
  const [, multi] = PICKS[key];
  const v = S(ctx)[key];
  const list = multi ? v || [] : v ? [v] : [];
  return `<div class="set-pf">${list.map((id) => entChip(ctx, id, key)).join("")}<button class="set-addc" data-act="set-pick" data-k="${key}">${svg(list.length ? (multi ? "plus" : "edit") : "plus")}${esc(list.length ? (multi ? ctx.t("Tilføj") : ctx.t("Skift")) : ctx.t("Vælg"))}</button></div>`;
}

/* ------------------------------------------------------------------ the entity picker */
function openPicker(ctx, { title, domains, multi, value, filter, suggest = [], none = true }, done) {
  const all = domains.flatMap((d) => ctx.entities(d, filter ? (st) => filter(st) : undefined));
  const sug = suggest.filter((id) => all.includes(id));
  const rest = all.filter((id) => !sug.includes(id));
  const chosen = new Set(multi ? value || [] : value ? [value] : []);
  let query = "";
  const row = (id, i) => {
    const dom = id.split(".")[0];
    const on = chosen.has(id);
    return `<button class="set-pk-row" data-pid="${esc(id)}" aria-pressed="${on}" style="animation-delay:${Math.min(i, 14) * 18}ms"><span class="set-pk-ic">${svg(DOMAIN_ICON[dom] || "plug")}</span><span class="set-pk-t"><b>${esc(nameOf(ctx, id))}</b><small>${esc(id)}</small></span><span class="set-pk-st">${esc(stateText(ctx, id))}</span><span class="set-pk-ck">${svg("check")}</span></button>`;
  };
  const list = () => {
    const q = query.trim().toLowerCase();
    const m = (id) => !q || id.toLowerCase().includes(q) || nameOf(ctx, id).toLowerCase().includes(q);
    const a = sug.filter(m), b = rest.filter(m);
    let i = 0;
    let h = "";
    if (!multi && none && !q) h += `<button class="set-pk-row none" data-pid="" aria-pressed="${!chosen.size}"><span class="set-pk-ic">${svg("x")}</span><span class="set-pk-t"><b>${esc(ctx.t("Ingen"))}</b></span><span class="set-pk-ck">${svg("check")}</span></button>`;
    if (a.length) h += `<div class="eyebrow set-pk-h">${esc(ctx.t("Forslag"))}</div>` + a.map((id) => row(id, i++)).join("");
    if (b.length) h += `${a.length ? `<div class="eyebrow set-pk-h">${esc(ctx.t("Alle"))}</div>` : ""}` + b.map((id) => row(id, i++)).join("");
    if (!a.length && !b.length) h += `<div class="set-pk-empty">${svg("search")}<span>${esc(all.length ? ctx.t("Intet passer til søgningen") : ctx.t("Home Assistant har ingen af dem endnu"))}</span></div>`;
    return h;
  };
  const s = ctx.sheet(
    `<div class="set-pk"><h2>${esc(title)}</h2>
      <label class="set-pk-search">${svg("search")}<input type="search" placeholder="${esc(ctx.t("Søg på navn eller entitet"))}" aria-label="${esc(ctx.t("Søg"))}"></label>
      <div class="set-pk-list" role="listbox" aria-multiselectable="${multi}">${list()}</div>
      ${multi ? `<div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" data-pk-done>${esc(ctx.t("Færdig"))}<span class="set-pk-n num"></span></button></div>` : ""}</div>`,
    { cls: "set-pk-sheet" }
  );
  const L = s.el.querySelector(".set-pk-list");
  const count = () => {
    const n = s.el.querySelector(".set-pk-n");
    if (n) n.textContent = chosen.size ? ` · ${chosen.size}` : "";
  };
  count();
  const inp = s.el.querySelector("input");
  inp.addEventListener("input", () => {
    query = inp.value;
    L.innerHTML = list();
  });
  if (all.length > 8 && matchMedia("(pointer: fine)").matches) setTimeout(() => inp.focus(), 60);
  L.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pid]");
    if (!b) return;
    const id = b.dataset.pid;
    if (!multi) {
      s.close();
      done(id || null);
      return;
    }
    if (chosen.has(id)) chosen.delete(id);
    else chosen.add(id);
    b.setAttribute("aria-pressed", String(chosen.has(id)));
    count();
  });
  s.el.querySelector("[data-pk-done]")?.addEventListener("click", () => {
    s.close();
    // Keep the order the entities were chosen in, as far as possible.
    const before = (value || []).filter((id) => chosen.has(id));
    done([...before, ...[...chosen].filter((id) => !before.includes(id))]);
  });
}

/* ------------------------------------------------------------------ editor: the family */
function familyEditor(ctx) {
  const list = fam(ctx);
  const taken = new Set(list.map((m) => m.person).filter(Boolean));
  const free = ctx.entities("person").filter((p) => !taken.has(p));
  const mine = userPerson(ctx);
  const card = (m, i) => {
    const kid = m.role === "child";
    return `<div class="set-m${kid ? " is-kid" : ""}" style="--pc:${esc(m.color)};animation-delay:${i * 60}ms">
      <div class="set-m-top">${avatarFor(ctx, m, "set-m-av")}
        <div class="set-m-nm"><input value="${esc(m.name)}" maxlength="40" data-in="set-m" data-i="${i}" data-k="name" aria-label="${esc(ctx.t("Navn"))}" placeholder="${esc(ctx.t("Navn"))}">
          <small>${m.person ? `${svg("link")}${esc(nameOf(ctx, m.person))}${m.person === mine ? ` · ${esc(ctx.t("dig"))}` : ""}` : esc(ctx.t("Ikke koblet til en person"))}</small></div>
        <button class="iconbtn" data-act="set-m-del" data-i="${i}" aria-label="${esc(ctx.t("Fjern {name}", { name: m.name }))}">${svg("trash")}</button></div>
      <div class="seg set-m-role" role="group" aria-label="${esc(ctx.t("Rolle"))}"><button data-act="set-m-role" data-i="${i}" data-r="parent" aria-pressed="${!kid}">${esc(ctx.t("Forælder"))}</button><button data-act="set-m-role" data-i="${i}" data-r="child" aria-pressed="${kid}">${esc(ctx.t("Barn"))}</button></div>
      <div class="set-m-cols" role="group" aria-label="${esc(ctx.t("Farve"))}">${PALETTE.map((c) => `<button data-act="set-m-color" data-i="${i}" data-c="${c}" aria-pressed="${c === String(m.color).toUpperCase()}" style="--sw:${c}" aria-label="${c}"></button>`).join("")}</div>
      <div class="bd-f"><span class="bd-ic">🎂</span><div><b>${esc(ctx.t("Fødselsdag"))}</b><small>${m.birthday ? esc(`${ctx.fmt.date(m.birthday + "T12:00:00", { day: "numeric", month: "long", year: "numeric" })} · ${ageText(ctx, m.birthday)}`) : esc(ctx.t("Bruges til pynt og alder"))}</small></div><input type="date" value="${esc(m.birthday || "")}" data-in="set-m" data-i="${i}" data-k="birthday" aria-label="${esc(ctx.t("Fødselsdag"))}"></div>
      ${kid ? `<div class="inst set-inst" role="group" aria-label="${esc(ctx.t("Institution"))}">${INST.map(([v, n, em]) => `<button data-act="set-m-inst" data-i="${i}" data-v="${v}" aria-pressed="${(m.institution || "none") === v}"><span>${em}</span>${esc(ctx.t(n))}</button>`).join("")}</div>` : ""}
      <div class="set-m-links">
        <button class="set-link" data-act="set-m-pick" data-i="${i}" data-k="person">${svg("user")}<span><small>${esc(ctx.t("Person"))}</small><b>${esc(m.person ? nameOf(ctx, m.person) : ctx.t("Ingen"))}</b></span></button>
        <button class="set-link" data-act="set-m-pick" data-i="${i}" data-k="calendar">${svg("cal")}<span><small>${esc(ctx.t("Kalender"))}</small><b>${esc(m.calendar ? nameOf(ctx, m.calendar) : ctx.t("Ingen"))}</b></span></button>
      </div></div>`;
  };
  return `<div class="set-ms">${list.map(card).join("")}
      <button class="set-m add" data-act="set-m-add">${svg("plus")}<b>${esc(ctx.t("Tilføj et familiemedlem"))}</b><small>${esc(ctx.t("Også børn uden egen bruger i Home Assistant"))}</small></button></div>
    ${free.length ? `<div class="set-free"><span class="eyebrow">${esc(ctx.t("Personer i Home Assistant, der ikke er med"))}</span><div class="set-free-row">${free.map((p) => `<button class="chip sg" data-act="set-m-add" data-person="${esc(p)}" style="--qc:var(--violet)">${svg("user")}${esc(nameOf(ctx, p))}<span>+</span></button>`).join("")}</div></div>` : ""}`;
}

/* ------------------------------------------------------------------ editor: modules */
function modulesEditor(ctx) {
  return `<div class="feats set-feats">${MODS.map(([k, n, ic, c, d], i) => {
    const on = isOn(ctx, k);
    const blocked = k === "shop" && !isOn(ctx, "points");
    return `<button class="feat${on && !blocked ? " on" : ""}" data-act="set-mod" data-id="${k}" aria-pressed="${on && !blocked}" ${blocked ? `disabled title="${esc(ctx.t("Slå point til for at bruge pointshoppen"))}"` : ""} style="--fc:${c};animation-delay:${i * 35}ms"><span class="feat-ic">${svg(ic)}</span><span class="feat-t"><b>${esc(ctx.t(n))}</b><small>${esc(ctx.t(d))}</small></span><span class="toggle" aria-hidden="true" style="--tc:${c}"></span></button>`;
  }).join("")}</div>`;
}

/* ------------------------------------------------------------------ editor: the home */
function homeEditor(ctx) {
  const s = S(ctx);
  const sec = (ic, color, title, text, body, i) =>
    `<div class="set-h" style="--hc:${color};animation-delay:${i * 50}ms"><span class="set-h-ic">${svg(ic)}</span><div class="set-h-b"><b>${esc(title)}</b><small>${esc(text)}</small>${body}</div></div>`;
  const parts = [];
  parts.push(["sun", "#E3A21A", ctx.t("Vejret"), ctx.t("Himlen i toppen følger vejret og viser ugens udsigt."), pickField(ctx, "weather")]);
  if (isOn(ctx, "calendar")) parts.push(["cal", "#6E4AFF", ctx.t("Kalendere"), ctx.t("Aftalerne i tidslinjen og på kalenderen. Børnenes egne kalendere vælges under Familien."), pickField(ctx, "calendars")]);
  if (isOn(ctx, "meals")) parts.push(["food", "#F97316", ctx.t("Madplan"), ctx.t("En kalender med aftensmaden. Hver aftale er dagens ret."), pickField(ctx, "meals_calendar")]);
  if (isOn(ctx, "lists")) parts.push(["lists", "#10B981", ctx.t("Lister"), ctx.t("Indkøbslister og huskelister fra Home Assistant."), pickField(ctx, "todo")]);
  if (isOn(ctx, "security")) {
    parts.push(["shieldf", "#2F6FED", ctx.t("Alarm"), ctx.t("Alarmen i toppen og under Huset, fx Alarmo."), pickField(ctx, "alarm")]);
    parts.push(["camera", "#0EA5E9", ctx.t("Kameraer"), ctx.t("Kameraerne under Huset."), pickField(ctx, "cameras")]);
  }
  if (isOn(ctx, "music")) parts.push(["speaker", "#DB2777", ctx.t("Højttalere og TV"), ctx.t("Det, I kan styre under Musik."), pickField(ctx, "media")]);
  if (isOn(ctx, "energy")) parts.push(["bolt", "#22C55E", ctx.t("Elpris"), ctx.t("En sensor med timepriser, fx Nord Pool eller Energi Data Service."), pickField(ctx, "price")]);
  if (isOn(ctx, "waste")) parts.push(["trash2", "#2F7D4F", ctx.t("Affald"), ctx.t("Sensorer med næste tømningsdag, eller en kalender med tømningerne."), wasteEditor(ctx)]);
  return `<div class="set-hs">${parts.map((p, i) => sec(...p, i)).join("")}</div>`;
}
function wasteEditor(ctx) {
  const list = S(ctx).waste || [];
  return `<div class="set-ws">${list
    .map(
      (w, i) => `<div class="set-w" style="--bc:${esc(w.color)}"><span class="set-w-bin" aria-hidden="true"><i></i></span>
      <div class="set-w-b"><input value="${esc(w.name)}" maxlength="30" data-in="set-waste-name" data-i="${i}" aria-label="${esc(ctx.t("Navn"))}" placeholder="${esc(nameOf(ctx, w.entity))}"><small>${esc(nameOf(ctx, w.entity))} · ${esc(stateText(ctx, w.entity))}</small>
      <div class="set-w-cols">${BIN_COLORS.map((c) => `<button data-act="set-waste-color" data-i="${i}" data-c="${c}" aria-pressed="${c === String(w.color).toUpperCase()}" style="--sw:${c}" aria-label="${c}"></button>`).join("")}</div></div>
      <button class="iconbtn" data-act="set-waste-del" data-i="${i}" aria-label="${esc(ctx.t("Fjern {name}", { name: w.name || nameOf(ctx, w.entity) }))}">${svg("trash")}</button></div>`
    )
    .join("")}${list.length < 8 ? `<button class="set-addc" data-act="set-waste-add">${svg("plus")}${esc(ctx.t("Tilføj en spand"))}</button>` : ""}</div>`;
}

/* ------------------------------------------------------------------ editor: decorations */
const dnDate = (n) => {
  const d = new Date(n * 864e5);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
};
function decorEditor(ctx) {
  const s = ctx.data.settings;
  const today = new Date();
  const t = dayNumber(today);
  const live = new Set(activeDecor(today, s, ctx.data.family).map((x) => x.key));
  const days = s.decor_days || {};
  const ann = s.anniversaries || {};
  return `<div class="dec-list">${occasions(s, ctx.data.family)
    .map((o, i) => {
      const [key, name, em, col, dates, def, greet] = o;
      const on = s.decor?.[key] !== false;
      const before = days[`${key}_before`] ?? def[0];
      const after = days[`${key}_after`] ?? def[1];
      const wins = [today.getFullYear(), today.getFullYear() + 1].flatMap((Y) => dates(Y)).filter(([, b]) => b + after >= t).sort((x, y) => x[0] - y[0]);
      const nx = wins[0];
      let sub = ctx.t(greet);
      if (key === "fodselsdag" && !ctx.data.family.some((m) => m.birthday)) sub = ctx.t("Skriv fødselsdagene under Familien");
      else if ((key === "aarsdag" && !ann.together) || (key === "bryllup" && !ann.wedding)) sub = ctx.t("Skriv datoen herunder");
      else if (nx && on) {
        const who = key === "fodselsdag" ? ctx.member(nx[2])?.name : null;
        sub = `${who ? who + " · " : ""}${ctx.t("pyntet {from}–{to}", { from: ctx.fmt.date(dnDate(nx[0] - before), { day: "numeric", month: "short" }), to: ctx.fmt.date(dnDate(nx[1] + after), { day: "numeric", month: "short" }) })}`;
        if (key === "bryllup" && typeof nx[2] === "number" && ctx.lang() === "da") sub += ` · ${String(nx[2]).replace(".5", "½")} år${wedName(nx[2]) ? ", " + wedName(nx[2]) : ""}`;
      }
      const st = (k, label, v) =>
        `<span class="dec-st"><small>${esc(ctx.t(label))}</small><button data-act="set-dec-step" data-id="${key}" data-k="${k}" data-d="-1" aria-label="${esc(ctx.t("Færre dage"))}" ${v <= 0 ? "disabled" : ""}>−</button><b class="num">${v}</b><button data-act="set-dec-step" data-id="${key}" data-k="${k}" data-d="1" aria-label="${esc(ctx.t("Flere dage"))}" ${v >= 60 ? "disabled" : ""}>+</button><small>${esc(v === 1 ? ctx.t("dag") : ctx.t("dage"))}</small></span>`;
      const annKey = key === "aarsdag" ? "together" : key === "bryllup" ? "wedding" : null;
      return `<div class="dec-row${on ? "" : " off"}${live.has(key) && on ? " live" : ""}" style="--dc:${col};animation-delay:${i * 30}ms"><span class="dec-em">${em}</span>
        <div class="dec-t"><b>${esc(ctx.t(name))}${live.has(key) && on ? `<i class="dec-live">${esc(ctx.t("Pyntet nu"))}</i>` : ""}</b><small>${esc(sub)}</small></div>
        <div class="dec-ctl">${st("before", "Før", before)}${st("after", "Efter", after)}<button class="iconbtn" data-act="set-dec-prev" data-id="${key}" aria-label="${esc(ctx.t("Vis {name} i himlen", { name: ctx.t(name) }))}">${svg("eye")}</button></div>
        <button class="toggle" data-act="set-dec-on" data-id="${key}" aria-pressed="${on}" aria-label="${esc(ctx.t(name))}" style="--tc:${col}"></button>
        ${annKey ? `<div class="dec-bd"><label class="dec-p"><span>${esc(annKey === "wedding" ? ctx.t("Gift") : ctx.t("Kærester siden"))}</span><input type="date" value="${esc(ann[annKey] || "")}" data-in="set-anniv" data-k="${annKey}" aria-label="${esc(ctx.t(name))}"></label></div>` : ""}</div>`;
    })
    .join("")}</div>`;
}

/* ------------------------------------------------------------------ editor: advanced */
function advancedEditor(ctx) {
  const s = ctx.data.settings;
  const v = ctx.config?.version || "";
  const rights = [
    ["Ændre indstillinger, opgaver og belønninger", 1, 0],
    ["Give og trække point", 1, 0],
    ["Godkende køb i pointshoppen", 1, 0],
    ["Tegne huset", 1, 0],
    ["Krydse egne opgaver af", 1, 1],
    ["Ønske sig noget fra pointshoppen", 0, 1],
    ["Vælge eget tema", 1, 1],
  ];
  return `<div class="set-adv">
    <section class="card"><div class="card-head"><h2>${esc(ctx.t("Hjemmet"))}</h2></div>
      <div class="field"><label for="set-hn">${esc(ctx.t("Hjemmets navn"))}</label><input id="set-hn" value="${esc(s.home_name || "")}" maxlength="40" data-in="set-s" data-k="home_name" placeholder="${esc(ctx.t("Fx Hjemme hos os"))}"></div>
      <div class="field"><span class="lbl">${esc(ctx.t("Sprog"))}</span><div class="seg" role="group">${[["auto", "Som Home Assistant"], ["da", "Dansk"], ["en", "English"]].map(([k, n]) => `<button data-act="set-lang" data-v="${k}" aria-pressed="${(s.language || "auto") === k}">${esc(k === "en" ? n : ctx.t(n))}</button>`).join("")}</div></div>
      <div class="field"><label for="set-mr">${esc(ctx.t("Opgaverne starter forfra kl."))}</label><input id="set-mr" type="time" value="${esc((s.mission_reset || "00:00").replace(".", ":"))}" data-in="set-s" data-k="mission_reset"></div>
    </section>
    <section class="card"><div class="card-head"><h2>${esc(ctx.t("Hvem må hvad"))}</h2><span class="lock">${svg("shield")}${esc(ctx.t("Kun forældre"))}</span></div>
      <div class="rights"><span class="h">${esc(ctx.t("Kan"))}</span><span class="h">${esc(ctx.t("Forælder"))}</span><span class="h">${esc(ctx.t("Barn"))}</span>${rights.map(([t, a, b]) => `<span>${esc(ctx.t(t))}</span><span class="${a ? "y" : "n"}">${svg(a ? "check" : "x")}</span><span class="${b ? "y" : "n"}">${svg(b ? "check" : "x")}</span>`).join("")}</div>
      <p class="set-p">${esc(ctx.t("Forældre er dem, der er sat som forælder under Familien. Administratorer i Home Assistant, der ikke er med i familien, kan også ændre alt. En bruger uden familiemedlem, fx en fælles skærm i køkkenet, kan vælge et af børnene."))}</p>
      <p class="set-p">${esc(ctx.t("Panelets navn, ikon og om det kun er for administratorer ændres under Indstillinger → Enheder og tjenester → Hverdagsro."))}</p>
    </section>
    <section class="card set-about"><div class="card-head"><h2>${esc(ctx.t("Om Hverdagsro"))}</h2>${v ? `<span class="meta">${esc(ctx.t("Version {v}", { v }))}</span>` : ""}</div>
      <div class="set-about-row">
        <button class="btn soft" data-act="set-guide">${svg("repeat")}${esc(ctx.t("Kør guiden igen"))}</button>
        <a class="btn soft" href="https://github.com/Dinnsen/ha-hverdagsro" target="_blank" rel="noopener">${svg("link")}${esc(ctx.t("Vejledning"))}</a>
        <a class="btn soft" href="https://github.com/Dinnsen/ha-hverdagsro/issues" target="_blank" rel="noopener">${svg("bell")}${esc(ctx.t("Meld en fejl"))}</a>
      </div></section></div>`;
}

/* ------------------------------------------------------------------ the house step */
function localGuess(name) {
  const n = String(name).toLowerCase();
  return /køkken|kokken|kitchen|alrum/.test(n) ? "kitchen" : /stue|living|opholds/.test(n) ? "living" : /sove|bedroom|master/.test(n) ? "bed" : /gæstebad|gaestebad|lille bad/.test(n) ? "smallbath" : /bad|bath/.test(n) ? "bath" : /toilet|wc/.test(n) ? "toilet" : /gæste|gaeste|guest/.test(n) ? "guest" : /kontor|office|studie/.test(n) ? "office" : /bryggers|vask|utility|laundry|teknik|værksted|vaerksted|depot/.test(n) ? "utility" : /entr|gang|hall/.test(n) ? "hall" : /walk/.test(n) ? "walkin" : /garage|carport/.test(n) ? "garage" : /værelse|vaerelse|børn|born|kid|nursery|room/.test(n) ? "kid" : "other";
}
const guess = (name) => {
  try {
    if (hasHouse()) return House.guessType(name) || localGuess(name);
  } catch (e) {
    /* fall back */
  }
  return localGuess(name);
};
const ROOM_M = { living: [6, 5], kitchen: [5, 4], bed: [4, 4], kid: [3.5, 3.5], guest: [3.5, 3], office: [3, 3], bath: [3, 2.5], smallbath: [2, 2], toilet: [1.5, 2], utility: [3, 2.5], hall: [2, 4], walkin: [2, 2], garage: [6, 6], other: [3, 3] };
const TYPE_NAME = { living: "Stue", kitchen: "Køkken", bed: "Soveværelse", kid: "Børneværelse", guest: "Gæsteværelse", office: "Kontor", bath: "Badeværelse", smallbath: "Lille bad", toilet: "Toilet", utility: "Bryggers", hall: "Entré og gang", walkin: "Walk-in", garage: "Garage", other: "Andet rum" };
function indoorAreas(ctx) {
  return ctx.areas().filter((a) => !RE_OUTDOOR.test(a.name + " " + a.area_id));
}
function roomsFromAreas(ctx, skip) {
  const areas = indoorAreas(ctx).filter((a) => !skip.has(a.area_id));
  const kids = (MODE === "guide" ? G.family : ctx.data.family).filter((m) => m.role === "child");
  const rooms = [];
  const walls = [];
  const ids = new Set();
  const U = 60;
  let x = 100, y = 100, rowH = 0;
  for (const a of areas) {
    const rtype = guess(a.name);
    const [wm, hm] = ROOM_M[rtype] || ROOM_M.other;
    const w = Math.round(wm * U), h = Math.round(hm * U);
    if (x + w > 100 + 20 * U && x > 100) {
      x = 100;
      y += rowH;
      rowH = 0;
    }
    let id = slug(a.area_id) || "rum";
    while (ids.has(id)) id += "_2";
    ids.add(id);
    const light = Object.keys(ctx.hass.entities || {}).find((e) => e.startsWith("light.") && ctx.area(e) === a.area_id) || "";
    const room = { id, name: a.name, rtype, area: a.area_id, light, pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] };
    if (rtype === "kid") {
      const kid = kids.find((k) => a.name.toLowerCase().includes(k.name.toLowerCase()));
      Object.assign(room, { kid: kid?.id || "", age: ageGroup(kid?.birthday) || "child", style: "neutral" });
    }
    rooms.push(room);
    const P = room.pts;
    for (let i = 0; i < 4; i++) walls.push({ id: `w_${id}_${i}`, a: P[i], b: P[(i + 1) % 4], k: "int" });
    x += w;
    rowH = Math.max(rowH, h);
  }
  // Shared edges become one wall.
  const seen = new Set();
  const uniq = walls.filter((w) => {
    const k = [w.a.join(","), w.b.join(",")].sort().join("|");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { rooms, walls: uniq };
}
function houseStep(ctx) {
  const h = ctx.data.house || {};
  const n = (h.rooms || []).length;
  const areas = indoorAreas(ctx);
  const ch = G.houseChoice;
  const opt = (k, ic, title, text, extra = "") =>
    `<button class="set-opt${ch === k ? " on" : ""}" data-act="set-house" data-v="${k}" aria-pressed="${ch === k}"><span class="set-opt-ic">${svg(ic)}</span><span class="set-opt-t"><b>${esc(title)}</b><small>${esc(text)}</small></span><span class="set-opt-ck">${svg("check")}</span>${extra}</button>`;
  let h2 = "";
  if (n) h2 += `<div class="set-note">${svg("check")}<span>${esc(ctx.t("Huset har allerede {n} rum. Det beholdes, medmindre I vælger andet.", { n }))}</span></div>`;
  h2 += `<div class="set-opts">`;
  if (n) h2 += opt("keep", "check", ctx.t("Behold huset"), ctx.t("Fortsæt med den tegning, I har."));
  h2 += opt("draw", "cursor", ctx.t("Tegn huset"), ctx.t("Husbyggeren åbner, når guiden er færdig. Tegn vægge, rum, døre og vinduer, og sæt enhederne på."));
  if (areas.length) h2 += opt("areas", "grid", ctx.t("Lav rum fra jeres områder"), ctx.t("{n} områder fra Home Assistant bliver til rum, som I kan flytte på bagefter.", { n: areas.length }));
  h2 += opt("skip", "go", ctx.t("Spring over"), ctx.t("I kan altid tegne huset senere."));
  h2 += `</div>`;
  if (ch === "areas") {
    h2 += `<div class="set-areas"><span class="eyebrow">${esc(ctx.t("Rummene"))}</span><div class="set-area-grid">${areas
      .map((a, i) => {
        const on = !G.skipAreas.has(a.area_id);
        const t = guess(a.name);
        return `<button class="set-area" data-act="set-area-tg" data-id="${esc(a.area_id)}" aria-pressed="${on}" style="animation-delay:${i * 40}ms"><b>${esc(a.name)}</b><small>${esc(ctx.t(TYPE_NAME[t] || "Andet rum") === a.name ? ctx.t("Rum") : ctx.t(TYPE_NAME[t] || "Andet rum"))}</small><span class="set-pk-ck">${svg("check")}</span></button>`;
      })
      .join("")}</div></div>`;
  }
  return h2;
}

/* ------------------------------------------------------------------ the guide */
function initGuide(ctx) {
  const d = ctx.data;
  let step = 0;
  try {
    step = Math.min(STEPS.length - 1, Math.max(0, Number(localStorage.getItem("hverdagsro-guide-step")) || 0));
  } catch (e) {
    /* private mode */
  }
  if (!d.family.length) step = Math.min(step, 1);
  G = {
    step,
    dir: 1,
    family: d.family.length ? clone(d.family) : familyFromPersons(ctx),
    modules: { ...d.modules },
    settings: withSuggestions(ctx, d.settings),
    houseChoice: (d.house?.rooms || []).length ? "keep" : null,
    skipAreas: new Set(),
    busy: false,
  };
}
function setStep(ctx, i) {
  G.dir = i >= G.step ? 1 : -1;
  G.step = i;
  try {
    localStorage.setItem("hverdagsro-guide-step", String(i));
  } catch (e) {
    /* private mode */
  }
  ctx.render(true);
}
function stepBody(ctx) {
  const k = STEPS[G.step][0];
  if (k === "velkommen") {
    const s = G.settings;
    const tiles = [
      ["tasks", "#3B6BF5", "Dagen for hele familien", "Opgaver, point og belønninger, som børnene selv kan krydse af."],
      ["cal", "#6E4AFF", "Overblik", "Kalendere, madplan, lister og vejret i én levende tidslinje."],
      ["house", "#0EA5A0", "Huset", "Lys, musik, alarm, døre og apparater på jeres egen tegning."],
    ];
    return `<p class="set-lead">${esc(ctx.t("Hverdagsro samler familiens hverdag i Home Assistant. Guiden tager et par minutter, og alt kan ændres bagefter."))}</p>
      <div class="set-tiles">${tiles.map(([ic, c, t, d], i) => `<div class="set-tile" style="--tc:${c};animation-delay:${120 + i * 90}ms"><span>${svg(ic)}</span><b>${esc(ctx.t(t))}</b><small>${esc(ctx.t(d))}</small></div>`).join("")}</div>
      <div class="field"><label for="set-g-hn">${esc(ctx.t("Hvad hedder jeres hjem?"))}</label><input id="set-g-hn" value="${esc(s.home_name || "")}" maxlength="40" data-in="set-s" data-k="home_name" placeholder="${esc(ctx.t("Fx Hjemme hos os"))}"></div>
      <div class="field"><span class="lbl">${esc(ctx.t("Sprog"))}</span><div class="seg" role="group">${[["auto", "Som Home Assistant"], ["da", "Dansk"], ["en", "English"]].map(([k2, n]) => `<button data-act="set-lang" data-v="${k2}" aria-pressed="${(s.language || "auto") === k2}">${esc(k2 === "en" ? n : ctx.t(n))}</button>`).join("")}</div></div>`;
  }
  if (k === "familie") {
    const found = ctx.entities("person").length;
    return `<p class="set-lead">${esc(found ? ctx.t("Vi har fundet {n} personer i Home Assistant. Vælg, hvem der er forældre og børn, og giv hver en farve.", { n: found }) : ctx.t("Tilføj familien. I kan koble hver person til en person i Home Assistant, så de kan logge ind og se deres egen side."))}</p>${familyEditor(ctx)}`;
  }
  if (k === "moduler") return `<p class="set-lead">${esc(ctx.t("Slå det til, I vil bruge. Det, der er slået fra, forsvinder for hele familien."))}</p>${modulesEditor(ctx)}`;
  if (k === "hjemmet") return `<p class="set-lead">${esc(ctx.t("Vi har valgt det, vi fandt i Home Assistant. Ret det, der ikke passer."))}</p>${homeEditor(ctx)}`;
  if (k === "huset") return `<p class="set-lead">${esc(ctx.t("Huset er en plan over jeres hjem, hvor lys, døre, vinduer, højttalere og apparater lever. Tryk på et rum for at åbne det."))}</p>${houseStep(ctx)}`;
  // Done
  const fam2 = G.family;
  const on = MODS.filter(([m]) => G.modules[m] !== false);
  const s = G.settings;
  const linked = ["weather", "meals_calendar", "alarm", "price"].filter((x) => s[x]).length + ["calendars", "todo", "media", "cameras", "waste"].reduce((n, x) => n + (s[x] || []).length, 0);
  const rooms = (ctx.data.house?.rooms || []).length;
  const box = (ic, c, n, label, body, i) => `<div class="set-sum" style="--tc:${c};animation-delay:${i * 90}ms"><span class="set-sum-ic">${svg(ic)}</span><b class="num">${n}</b><small>${esc(label)}</small>${body}</div>`;
  return `<div class="set-done-hero"><div class="set-confetti" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="--i:${i};--c:${PALETTE[i % PALETTE.length]}"></i>`).join("")}</div>
      <h3>${esc(ctx.t("Alt er klar"))}</h3><p class="set-lead">${esc(ctx.t("Her er, hvad I har sat op. Det hele kan ændres under Familieindstillinger."))}</p></div>
    <div class="set-sums">
      ${box("users", "#EE5E52", fam2.length, ctx.t("i familien"), `<div class="set-sum-avs">${fam2.map((m) => avatarFor(ctx, m, "sm")).join("")}</div>`, 0)}
      ${box("grid", "#E3A21A", on.length, ctx.t("moduler slået til"), `<div class="set-sum-ics">${on.map(([, , ic, c]) => `<span style="--c:${c}">${svg(ic)}</span>`).join("")}</div>`, 1)}
      ${box("link", "#11A39A", linked, ctx.t("ting fra Home Assistant"), "", 2)}
      ${box("house", "#3B6BF5", rooms, ctx.t("rum i huset"), G.houseChoice === "draw" ? `<small class="set-sum-x">${esc(ctx.t("Husbyggeren åbner bagefter"))}</small>` : "", 3)}
    </div>`;
}
function renderGuide(ctx) {
  MODE = "guide";
  if (!G) initGuide(ctx);
  const [key, name, em, c1, c2] = STEPS[G.step];
  const last = G.step === STEPS.length - 1;
  const problem = key === "familie" ? familyProblem(ctx, G.family) : null;
  const anim = animClass(`guide:${G.step}`);
  const stepsNav = STEPS.map(([k, n, e], i) => `<button class="set-g-dot${i === G.step ? " cur" : ""}${i < G.step ? " done" : ""}" data-act="set-g-goto" data-i="${i}" ${i > G.step ? "disabled" : ""} aria-current="${i === G.step ? "step" : "false"}"><span>${i < G.step ? svg("check") : i + 1}</span><small>${esc(ctx.t(n))}</small></button>`).join("");
  return `<div class="set-g" style="--g1:${c1};--g2:${c2}">
    <nav class="set-g-steps" aria-label="${esc(ctx.t("Trin"))}"><div class="set-g-bar"><i style="width:${(G.step / (STEPS.length - 1)) * 100}%"></i></div>${stepsNav}</nav>
    <section class="set-g-card">
      <header class="set-g-head"><span class="set-g-em" aria-hidden="true">${em}</span><div><span class="set-g-of">${esc(ctx.t("Trin {n} af {m}", { n: G.step + 1, m: STEPS.length }))}</span><h2>${esc(G.step === 0 ? ctx.t("Velkommen til Hverdagsro") : ctx.t(name))}</h2></div>
        <i class="set-g-blob a"></i><i class="set-g-blob b"></i></header>
      <div class="set-g-body${anim ? ` ${G.dir > 0 ? "fwd" : "bwd"} set-anim` : ""}" data-step="${key}">${stepBody(ctx)}</div>
      <footer class="set-g-foot">
        ${G.step > 0 ? `<button class="btn soft" data-act="set-g-back">${svg("back")}${esc(ctx.t("Tilbage"))}</button>` : `<span></span>`}
        ${problem ? `<span class="set-g-warn">${svg("bell")}${esc(problem)}</span>` : `<span class="grow"></span>`}
        <button class="btn set-g-next" data-act="set-g-next" ${problem || G.busy ? "disabled" : ""}>${esc(last ? ctx.t("Start Hverdagsro") : G.step === 0 ? ctx.t("Kom i gang") : key === "huset" && !G.houseChoice ? ctx.t("Spring over") : ctx.t("Næste"))}${svg(last ? "sparkle" : "go")}</button>
      </footer>
    </section></div>`;
}
async function guideNext(ctx) {
  if (G.busy) return;
  const key = STEPS[G.step][0];
  G.busy = true;
  ctx.render(true);
  let ok = true;
  try {
    if (key === "velkommen") ok = await ctx.save("settings", { ...ctx.data.settings, home_name: G.settings.home_name || "", language: G.settings.language || "auto" });
    else if (key === "familie") {
      const problem = familyProblem(ctx, G.family);
      if (problem) {
        ctx.toast(problem);
        ok = false;
      } else {
        G.family = cleanFamily(G.family);
        ok = await ctx.save("family", G.family);
      }
    } else if (key === "moduler") ok = await ctx.save("modules", G.modules);
    else if (key === "hjemmet") ok = await ctx.save("settings", { ...G.settings, home_name: ctx.data.settings.home_name, language: ctx.data.settings.language });
    else if (key === "huset") {
      if (G.houseChoice === "areas") {
        const { rooms, walls } = roomsFromAreas(ctx, G.skipAreas);
        const h = ctx.data.house || {};
        ok = await ctx.save("house", { name: h.name || ctx.data.settings.home_name || "", rooms, walls, areas: h.areas || [], items: h.items || [] });
        if (ok) ctx.toast(ctx.t("{n} rum er lagt ind i huset", { n: rooms.length }));
      }
    } else if (key === "faerdig") {
      await ctx.ws("setup_done");
      ctx.data.setup_done = true;
      const after = G.houseChoice === "draw" && ctx.on("house") ? "husbygger" : "hjem";
      G = null;
      try {
        localStorage.removeItem("hverdagsro-guide-step");
      } catch (e) {
        /* private mode */
      }
      ctx.toast(ctx.t("Velkommen til Hverdagsro"));
      ctx.go(after);
      return;
    }
  } catch (err) {
    ok = false;
    ctx.toast(String(err?.message || err));
  } finally {
    if (G) G.busy = false;
  }
  if (ok) setStep(ctx, G.step + 1);
  else ctx.render(true);
}

/* ------------------------------------------------------------------ settings view */
function renderSettings(ctx) {
  MODE = "set";
  G = null;
  const arg = ctx.arg && TABS.some((t) => t[0] === ctx.arg) ? ctx.arg : TAB;
  TAB = arg;
  if (!F || !Fdirty) F = clone(ctx.data.family);
  const tabs = `<div class="set-tabs set-tabs2" role="tablist">${TABS.map(([k, n, ic]) => `<button role="tab" data-act="set-tab" data-id="${k}" aria-pressed="${TAB === k}" aria-selected="${TAB === k}">${svg(ic)}${esc(ctx.t(n))}${k === "familie" && Fdirty ? `<i class="set-dirty"></i>` : ""}</button>`).join("")}</div>`;
  let body = "";
  if (TAB === "familie") {
    const problem = familyProblem(ctx, F);
    body = `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Familien"))}</h2><span class="lock">${svg("shield")}${esc(ctx.t("Kun forældre"))}</span></div>${familyEditor(ctx)}</section>
      ${Fdirty ? `<div class="set-bar"><span>${problem ? `${svg("bell")}${esc(problem)}` : esc(ctx.t("Du har ændringer, der ikke er gemt"))}</span><button class="btn soft" data-act="set-fam-undo">${esc(ctx.t("Fortryd"))}</button><button class="btn" data-act="set-fam-save" ${problem ? "disabled" : ""}>${svg("check")}${esc(ctx.t("Gem"))}</button></div>` : ""}`;
  } else if (TAB === "moduler") body = `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Moduler"))}</h2><span class="meta">${esc(ctx.t("Gælder for hele familien"))}</span></div>${modulesEditor(ctx)}</section>`;
  else if (TAB === "hjemmet") {
    const s = ctx.data.settings;
    const g = suggestions(ctx);
    const missing = ["weather", "alarm", "price", "meals_calendar"].filter((k) => !s[k] && g[k]).length + ["calendars", "todo", "media", "cameras"].filter((k) => !s[k]?.length && g[k].length).length + (!s.waste?.length && g.waste.length ? 1 : 0);
    body = `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Hjemmet"))}</h2>${missing ? `<button class="btn sm" data-act="set-suggest">${svg("sparkle")}${esc(ctx.t("Udfyld automatisk"))}</button>` : `<span class="meta">${esc(ctx.t("Gemmes med det samme"))}</span>`}</div>${homeEditor(ctx)}</section>`;
  } else if (TAB === "pynt")
    body = `<section class="card"><div class="card-head"><h2>${esc(ctx.t("Pynt i himlen"))}</h2><span class="meta">${esc(ctx.t("Sættes automatisk"))}</span></div>
      <p class="set-p" style="margin:-6px 0 12px">${esc(ctx.t("Himlen pynter selv op til mærkedagene. Vælg hvilke, og hvor mange dage før og efter der er pyntet. Tryk på øjet for at se pynten nu."))}</p>
      ${ctx.on("decor") ? decorEditor(ctx) : `<div class="set-note">${svg("sparkle")}<span>${esc(ctx.t("Pynt er slået fra."))}</span><button class="btn sm" data-act="set-mod" data-id="decor">${esc(ctx.t("Slå til"))}</button></div>`}</section>`;
  else body = advancedEditor(ctx);
  return `<div class="set-page">${tabs}<div class="set-body${animClass(`set:${TAB}`)}" data-tab="${TAB}">${body}</div>
    <p class="foot">${esc(ctx.t("Indstillingerne gemmes i Hverdagsro i Home Assistant og gælder for hele familien."))}</p></div>`;
}

/* ------------------------------------------------------------------ actions */
const famIdx = (el) => Number(el.dataset.i);
function famChanged(ctx) {
  if (MODE !== "guide") Fdirty = true;
  ctx.render(true);
}
const acts = {
  "set-tab": (el, e, ctx) => {
    TAB = el.dataset.id;
    ctx.arg = TAB;
    try {
      sessionStorage.setItem("hverdagsro-view", `indstillinger:${TAB}`);
    } catch (err) {
      /* private mode */
    }
    ctx.render(true);
  },
  "set-g-next": (el, e, ctx) => guideNext(ctx),
  "set-g-back": (el, e, ctx) => setStep(ctx, Math.max(0, G.step - 1)),
  "set-g-goto": (el, e, ctx) => {
    const i = famIdx(el);
    if (i <= G.step) setStep(ctx, i);
  },
  "set-m-role": (el, e, ctx) => {
    const m = fam(ctx)[famIdx(el)];
    m.role = el.dataset.r;
    famChanged(ctx);
  },
  "set-m-color": (el, e, ctx) => {
    fam(ctx)[famIdx(el)].color = el.dataset.c;
    famChanged(ctx);
  },
  "set-m-inst": (el, e, ctx) => {
    fam(ctx)[famIdx(el)].institution = el.dataset.v;
    famChanged(ctx);
  },
  "set-m-del": (el, e, ctx) => {
    const list = fam(ctx);
    const m = list[famIdx(el)];
    const go = () => {
      list.splice(famIdx(el), 1);
      famChanged(ctx);
    };
    if (MODE === "guide" || !ctx.data.family.some((x) => x.id === m.id)) return go();
    ctx.confirm(ctx.t("Fjern {name}?", { name: m.name }), ctx.t("{name} forsvinder fra Hverdagsro, når I gemmer. Point og opgaver til {name} forsvinder også.", { name: m.name }), ctx.t("Fjern"), go);
  },
  "set-m-add": (el, e, ctx) => {
    const list = fam(ctx);
    const taken = new Set(list.map((m) => m.id));
    if (el.dataset.person) list.push(memberFromPerson(ctx, el.dataset.person, list, taken));
    else list.push({ id: uniqueId(ctx.t("Nyt medlem") + (list.length + 1), taken), name: "", role: "child", person: null, color: nextColor(list), birthday: null, institution: "none", skin: "standard", mode: "auto", calendar: null, device_tracker: null });
    famChanged(ctx);
    if (!el.dataset.person)
      setTimeout(() => {
        const inputs = ctx.qa('[data-in="set-m"][data-k="name"]');
        inputs[inputs.length - 1]?.focus();
      }, 80);
  },
  "set-m-pick": (el, e, ctx) => {
    const list = fam(ctx);
    const m = list[famIdx(el)];
    const k = el.dataset.k;
    const used = new Set(list.filter((x) => x !== m).map((x) => x.person).filter(Boolean));
    const opts =
      k === "person"
        ? { title: ctx.t("Person i Home Assistant"), domains: ["person"], filter: (st) => !used.has(st.entity_id) }
        : { title: ctx.t("{name}s kalender", { name: m.name || ctx.t("Barnet") }), domains: ["calendar"], suggest: ctx.entities("calendar").filter((id) => m.name && nameOf(ctx, id).toLowerCase().includes(m.name.toLowerCase())) };
    openPicker(ctx, { ...opts, multi: false, value: m[k] }, (v) => {
      m[k] = v;
      if (k === "person" && v && !m.name) m.name = (ctx.hass.states[v]?.attributes?.friendly_name || "").slice(0, 40);
      famChanged(ctx);
    });
  },
  "set-fam-undo": (el, e, ctx) => {
    F = clone(ctx.data.family);
    Fdirty = false;
    ctx.render(true);
  },
  "set-fam-save": async (el, e, ctx) => {
    const problem = familyProblem(ctx, F);
    if (problem) return ctx.toast(problem);
    el.disabled = true;
    const list = cleanFamily(F);
    if (await ctx.save("family", list)) {
      Fdirty = false;
      F = null;
      ctx.toast(ctx.t("Familien er gemt"));
    }
    ctx.render(true);
  },
  "set-mod": async (el, e, ctx) => {
    const k = el.dataset.id;
    const next = { ...M(ctx), [k]: !isOn(ctx, k) };
    if (k === "points" && !next.points) next.shop = false;
    if (MODE === "guide") {
      G.modules = next;
      ctx.render(true);
      return;
    }
    ctx.render(true);
    if (await ctx.save("modules", next)) {
      ctx.toast(next[k] ? ctx.t("{name} er slået til", { name: ctx.t(MODS.find((x) => x[0] === k)[1]) }) : ctx.t("{name} er slået fra", { name: ctx.t(MODS.find((x) => x[0] === k)[1]) }));
      ctx.render(true);
    }
  },
  "set-pick": (el, e, ctx) => {
    const key = el.dataset.k;
    const [domains, multi, title] = PICKS[key];
    const g = suggestions(ctx);
    const sug = [].concat(g[key] || []);
    const filter = key === "price" ? (st) => isPrice(st) || /pris|price|spot|kwh/i.test(st.entity_id + " " + (st.attributes.friendly_name || "")) : undefined;
    openPicker(ctx, { title: ctx.t(title), domains, multi, value: S(ctx)[key], suggest: sug, filter }, (v) => setS(ctx, { [key]: v }));
  },
  "set-unpick": (el, e, ctx) => {
    const key = el.dataset.k;
    const cur = S(ctx)[key];
    setS(ctx, { [key]: Array.isArray(cur) ? cur.filter((x) => x !== el.dataset.v) : null });
  },
  "set-suggest": (el, e, ctx) => {
    setS(ctx, withSuggestions(ctx, ctx.data.settings));
    ctx.toast(ctx.t("Det, vi fandt i Home Assistant, er lagt ind"));
  },
  "set-waste-add": (el, e, ctx) => {
    const cur = S(ctx).waste || [];
    const have = new Set(cur.map((w) => w.entity));
    const sug = [...ctx.entities("sensor"), ...ctx.entities("calendar")].filter((id) => isWaste(ctx, id) && !have.has(id));
    openPicker(
      ctx,
      { title: ctx.t("Affald"), domains: ["sensor", "calendar"], multi: true, value: [], suggest: sug, filter: (st) => !have.has(st.entity_id) && (st.entity_id.startsWith("calendar.") || st.attributes.device_class === "date" || /^\d{4}-\d{2}-\d{2}/.test(st.state) || RE_WASTE.test(st.entity_id + " " + (st.attributes.friendly_name || ""))) },
      (ids) => {
        const used = cur.map((w) => w.color);
        const add = (ids || []).map((id) => {
          const name = nameOf(ctx, id).slice(0, 30);
          const color = binColor(name, used);
          used.push(color);
          return { entity: id, name, color };
        });
        setS(ctx, { waste: [...cur, ...add].slice(0, 8) });
      }
    );
  },
  "set-waste-del": (el, e, ctx) => {
    const cur = [...(S(ctx).waste || [])];
    cur.splice(famIdx(el), 1);
    setS(ctx, { waste: cur });
  },
  "set-waste-color": (el, e, ctx) => {
    const cur = clone(S(ctx).waste || []);
    cur[famIdx(el)].color = el.dataset.c;
    setS(ctx, { waste: cur });
  },
  "set-dec-on": (el, e, ctx) => {
    const k = el.dataset.id;
    const decor = { ...(ctx.data.settings.decor || {}) };
    decor[k] = decor[k] === false;
    setS(ctx, { decor });
  },
  "set-dec-step": (el, e, ctx) => {
    const k = el.dataset.id;
    const o = occasions(ctx.data.settings, ctx.data.family).find((x) => x[0] === k);
    const days = { ...(ctx.data.settings.decor_days || {}) };
    const dk = `${k}_${el.dataset.k}`;
    const cur = days[dk] ?? o[5][el.dataset.k === "before" ? 0 : 1];
    days[dk] = Math.max(0, Math.min(60, cur + Number(el.dataset.d)));
    setS(ctx, { decor_days: days });
  },
  "set-dec-prev": (el, e, ctx) => {
    const p = ctx.panel;
    if (!p) return;
    clearTimeout(previewTimer);
    p._preview = el.dataset.id;
    p._decorKey = null;
    const o = occasions(ctx.data.settings, ctx.data.family).find((x) => x[0] === el.dataset.id);
    // The decorations are seen best in the big sky on the front page.
    ctx.go(ctx.isKid ? "dag" : "hjem");
    ctx.toast(ctx.t("Sådan ser {name} ud i himlen", { name: ctx.t(o?.[1] || "") }));
    previewTimer = setTimeout(() => {
      p._preview = null;
      p._decorKey = null;
      p._header?.();
    }, 12000);
  },
  "set-lang": (el, e, ctx) => setS(ctx, { language: el.dataset.v }),
  "set-house": (el, e, ctx) => {
    G.houseChoice = el.dataset.v;
    ctx.render(true);
  },
  "set-area-tg": (el, e, ctx) => {
    const id = el.dataset.id;
    if (G.skipAreas.has(id)) G.skipAreas.delete(id);
    else G.skipAreas.add(id);
    ctx.render(true);
  },
  "set-guide": (el, e, ctx) => {
    G = null;
    try {
      localStorage.setItem("hverdagsro-guide-step", "0");
    } catch (err) {
      /* private mode */
    }
    ctx.go("guide");
  },
};

const inputs = {
  "set-m": (el, e, ctx) => {
    const m = fam(ctx)[famIdx(el)];
    if (!m) return;
    m[el.dataset.k] = el.dataset.k === "birthday" ? el.value || null : el.value;
    if (MODE !== "guide" && !Fdirty) {
      Fdirty = true;
      if (e.type === "change") ctx.render();
    }
    if (e.type === "change") ctx.render();
  },
  "set-s": (el, e, ctx) => {
    const k = el.dataset.k;
    if (MODE === "guide") {
      G.settings[k] = el.value;
      return;
    }
    if (e.type !== "change") return;
    setS(ctx, { [k]: k === "mission_reset" ? el.value || "00:00" : el.value });
  },
  "set-waste-name": (el, e, ctx) => {
    if (e.type !== "change" && MODE !== "guide") return;
    const cur = clone(S(ctx).waste || []);
    if (!cur[famIdx(el)]) return;
    cur[famIdx(el)].name = el.value.slice(0, 30);
    if (MODE === "guide") G.settings.waste = cur;
    else setS(ctx, { waste: cur });
  },
  "set-anniv": (el, e, ctx) => {
    if (e.type !== "change") return;
    setS(ctx, { anniversaries: { ...(ctx.data.settings.anniversaries || {}), [el.dataset.k]: el.value || null } });
  },
};

/* ------------------------------------------------------------------ styles */
const css = `
.set-p { font-size: 13px; color: var(--muted); line-height: 1.5; margin: 10px 0 0; }
.set-lead { font-size: 15px; color: var(--muted); line-height: 1.5; margin: 0 0 18px; max-width: 70ch; }
.set-page { max-width: 1100px; margin: 0 auto; }
.set-tabs2 button { display: inline-flex; align-items: center; gap: 7px; position: relative; cursor: pointer; }
.set-tabs2 button .ic { width: 16px; height: 16px; }
.set-dirty { width: 8px; height: 8px; border-radius: 50%; background: var(--coral); display: inline-block; }
.set-anim.set-body > .card { animation: hvin .35s cubic-bezier(.2,.9,.3,1) both; }
.set-adv { display: grid; gap: 14px; }
.set-about-row { display: flex; gap: 8px; flex-wrap: wrap; }
.set-about-row a { text-decoration: none; }
.set-note { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 16px; background: color-mix(in srgb, var(--good) 10%, var(--surface-2)); font-weight: 600; font-size: 14px; margin-bottom: 12px; }
.set-note .ic { width: 18px; height: 18px; color: var(--good); flex: none; }
.set-note .btn { margin-left: auto; }

/* Members */
.set-ms { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
.set-m { border-radius: 20px; padding: 14px; background: color-mix(in srgb, var(--pc, var(--violet)) 7%, var(--surface-2)); border: 1.5px solid color-mix(in srgb, var(--pc, var(--violet)) 22%, transparent); display: flex; flex-direction: column; gap: 10px; min-width: 0; transition: background .3s, border-color .3s; }
.set-m-top { display: flex; align-items: center; gap: 10px; }
.set-m-av { width: 46px; height: 46px; font-size: 19px; box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--pc); transition: box-shadow .3s, background .3s; }
.set-m-nm { flex: 1; min-width: 0; }
.set-m-nm input { width: 100%; box-sizing: border-box; border: 0; background: transparent; font: 800 18px var(--font-display); color: var(--ink); padding: 2px 0; border-bottom: 1.5px dashed transparent; border-radius: 0; }
.set-m-nm input:focus { outline: none; border-bottom-color: var(--pc); }
.set-m-nm small { display: flex; align-items: center; gap: 4px; color: var(--muted); font-size: 12px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.set-m-nm small .ic { width: 12px; height: 12px; flex: none; }
.set-m-role button { cursor: pointer; }
.set-m-role button[aria-pressed="true"] { color: var(--pc); }
.set-m-cols, .set-w-cols { display: flex; gap: 6px; flex-wrap: wrap; padding: 2px; }
.set-m-cols button, .set-w-cols button { width: 20px; height: 20px; border-radius: 50%; border: 0; background: var(--sw); cursor: pointer; transition: transform .2s cubic-bezier(.2,.8,.2,1.4), box-shadow .2s; padding: 0; }
.set-m-cols button[aria-pressed="true"], .set-w-cols button[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--sw); transform: scale(1.1); }
.set-m-cols button:hover, .set-w-cols button:hover { transform: scale(1.18); }
.set-inst { display: flex; flex-wrap: wrap; gap: 5px; }
.set-inst button { cursor: pointer; flex-direction: row; gap: 5px; padding: 5px 10px 5px 7px; font-size: 12.5px; border-radius: 999px; }
.set-inst button span { font-size: 15px; }
.set-m-links { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.set-link { display: flex; align-items: center; gap: 8px; text-align: left; border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px; padding: 8px 10px; color: var(--ink); cursor: pointer; min-width: 0; transition: border-color .2s; }
.set-link:hover { border-color: var(--pc); }
.set-link > .ic { width: 18px; height: 18px; color: var(--pc); flex: none; }
.set-link span { min-width: 0; }
.set-link small { display: block; font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
.set-link b { display: block; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.set-m.add { align-items: center; justify-content: center; text-align: center; border: 2px dashed var(--line); background: transparent; color: var(--muted); cursor: pointer; min-height: 160px; gap: 6px; }
.set-m.add:hover { border-color: var(--violet); color: var(--violet); }
.set-m.add .ic { width: 30px; height: 30px; }
.set-m.add b { color: var(--ink); font-size: 15px; }
.set-m.add small { font-size: 12.5px; }
.set-free { margin-top: 16px; }
.set-free-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }

/* Entity fields */
.set-pf { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; align-items: center; }
.set-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 4px 4px 10px; border-radius: 999px; background: var(--surface); border: 1.5px solid color-mix(in srgb, var(--hc, var(--violet)) 35%, var(--line)); font-size: 13px; font-weight: 600; max-width: 100%; animation: pop .3s both; }
.set-chip > .ic { width: 15px; height: 15px; color: var(--hc, var(--violet)); flex: none; }
.set-chip > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.set-chip button { width: 22px; height: 22px; border-radius: 50%; border: 0; background: var(--surface-2); color: var(--muted); display: grid; place-items: center; padding: 0; cursor: pointer; flex: none; }
.set-chip button .ic { width: 12px; height: 12px; }
.set-chip.miss { border-style: dashed; opacity: .7; }
.set-addc { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 999px; border: 1.5px dashed color-mix(in srgb, var(--hc, var(--violet)) 50%, var(--line)); background: transparent; color: var(--hc, var(--violet)); font-weight: 700; font-size: 13px; cursor: pointer; }
.set-addc .ic { width: 14px; height: 14px; }
.set-hs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); gap: 12px; }
.set-h { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 12px; padding: 14px; border-radius: 18px; background: color-mix(in srgb, var(--hc) 6%, var(--surface-2)); }
.set-h-ic { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: var(--hc); color: #fff; }
.set-h-ic .ic { width: 21px; height: 21px; }
.set-h-b > b { display: block; font-size: 15px; }
.set-h-b > small { display: block; font-size: 12.5px; color: var(--muted); line-height: 1.35; }

/* Waste */
.set-ws { display: grid; gap: 8px; margin-top: 8px; }
.set-w { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 10px; align-items: center; background: var(--surface); border-radius: 14px; padding: 8px 8px 8px 10px; }
.set-w-bin { width: 28px; height: 34px; border-radius: 4px 4px 7px 7px; background: var(--bc); position: relative; box-shadow: inset -5px 0 0 rgba(0,0,0,.12); }
.set-w-bin i { position: absolute; left: -3px; right: -3px; top: -5px; height: 7px; border-radius: 3px; background: color-mix(in srgb, var(--bc) 80%, #000); }
.set-w-b { min-width: 0; display: grid; gap: 4px; }
.set-w-b input { border: 0; background: transparent; font-weight: 700; font-size: 14px; color: var(--ink); padding: 0; }
.set-w-b input:focus { outline: none; text-decoration: underline; text-decoration-color: var(--bc); }
.set-w-b small { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.set-w-cols button { width: 18px; height: 18px; }

/* Picker */
.set-pk h2 { margin: 0 0 12px; }
.set-pk-search { display: flex; align-items: center; gap: 8px; border: 1.5px solid var(--line); background: var(--surface-2); border-radius: 14px; padding: 0 12px; }
.set-pk-search .ic { width: 17px; height: 17px; color: var(--muted); }
.set-pk-search input { flex: 1; border: 0; background: transparent; padding: 11px 0; color: var(--ink); font: inherit; min-width: 0; }
.set-pk-search input:focus { outline: none; }
.set-pk-list { display: grid; gap: 4px; margin-top: 10px; max-height: min(52vh, 460px); overflow: auto; padding: 2px; }
.set-pk-h { margin: 10px 4px 4px; }
.set-pk-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto 24px; gap: 10px; align-items: center; text-align: left; border: 0; background: transparent; border-radius: 14px; padding: 8px; color: var(--ink); cursor: pointer; animation: pop .3s both; }
.set-pk-row:hover { background: var(--surface-2); }
.set-pk-row[aria-pressed="true"] { background: color-mix(in srgb, var(--violet) 10%, var(--surface)); }
.set-pk-ic { width: 34px; height: 34px; border-radius: 11px; background: var(--surface-2); display: grid; place-items: center; color: var(--violet); }
.set-pk-ic .ic { width: 17px; height: 17px; }
.set-pk-t { min-width: 0; }
.set-pk-t b { display: block; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.set-pk-t small { display: block; font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.set-pk-st { font-size: 12px; color: var(--muted); max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.set-pk-row.none { grid-template-columns: 34px minmax(0, 1fr) 24px; }
.set-pk-ck { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--line); display: grid; place-items: center; color: transparent; transition: background .2s, border-color .2s, transform .25s cubic-bezier(.2,.8,.2,1.5); }
.set-pk-ck .ic { width: 13px; height: 13px; }
[aria-pressed="true"] > .set-pk-ck { background: var(--violet); border-color: var(--violet); color: #fff; transform: scale(1.08); }
.set-pk-empty { display: grid; justify-items: center; gap: 6px; padding: 28px 10px; color: var(--muted); font-weight: 600; }
.set-pk-empty .ic { width: 26px; height: 26px; }
@media (max-width: 520px) { .set-pk-st { display: none; } .set-pk-row { grid-template-columns: 34px minmax(0, 1fr) 24px; } }

/* Save bar */
.set-bar { position: sticky; bottom: 14px; z-index: 5; margin-top: 14px; display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 16px; border-radius: 18px; background: var(--ink); color: var(--bg); box-shadow: 0 12px 34px rgba(0,0,0,.25); animation: up .35s cubic-bezier(.2,.9,.3,1) both; }
.set-bar > span { flex: 1; font-weight: 700; font-size: 13.5px; display: flex; align-items: center; gap: 8px; min-width: 0; }
.set-bar > span .ic { width: 17px; height: 17px; color: var(--gold); flex: none; }
.set-bar .btn { background: var(--bg); color: var(--ink); }
.set-bar .btn.soft { background: transparent; color: var(--bg); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--bg) 40%, transparent); }

/* The guide */
.set-g { max-width: 980px; margin: 0 auto; }
.set-g-steps { position: relative; display: grid; grid-template-columns: repeat(6, 1fr); margin: 0 0 16px; }
.set-g-bar { position: absolute; left: calc(100% / 12); right: calc(100% / 12); top: 15px; height: 3px; border-radius: 3px; background: var(--line); }
.set-g-bar i { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: linear-gradient(90deg, var(--g1), var(--g2)); transition: width .6s cubic-bezier(.2,.9,.3,1); }
.set-g-dot { position: relative; display: grid; justify-items: center; gap: 6px; border: 0; background: none; color: var(--muted); padding: 0; cursor: pointer; font: inherit; }
.set-g-dot[disabled] { cursor: default; }
.set-g-dot span { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--surface); box-shadow: inset 0 0 0 2px var(--line); font-weight: 800; font-size: 13px; transition: background .35s, box-shadow .35s, transform .35s cubic-bezier(.2,.8,.2,1.5), color .35s; }
.set-g-dot span .ic { width: 15px; height: 15px; }
.set-g-dot.done span { background: var(--g1); box-shadow: none; color: #fff; }
.set-g-dot.cur span { background: linear-gradient(135deg, var(--g1), var(--g2)); color: #fff; box-shadow: 0 0 0 5px color-mix(in srgb, var(--g1) 22%, transparent); transform: scale(1.12); }
.set-g-dot small { font-size: 12px; font-weight: 700; }
.set-g-dot.cur small { color: var(--ink); }
.set-g-card { background: var(--surface); border-radius: 26px; box-shadow: var(--shadow); overflow: hidden; }
.set-g-head { position: relative; display: flex; align-items: center; gap: 16px; padding: 26px 26px 24px; color: #fff; background: linear-gradient(120deg, var(--g1), var(--g2)); overflow: hidden; transition: background .6s; }
.set-g-head h2 { margin: 2px 0 0; font: 800 clamp(22px, 4vw, 32px)/1.1 var(--font-display); color: #fff; position: relative; z-index: 1; }
.set-g-of { font-size: 12px; font-weight: 800; letter-spacing: .8px; text-transform: uppercase; opacity: .85; position: relative; z-index: 1; }
.set-g-em { width: 64px; height: 64px; flex: none; display: grid; place-items: center; font-size: 34px; border-radius: 22px; background: rgba(255,255,255,.2); backdrop-filter: blur(6px); position: relative; z-index: 1; animation: setfloat 4s ease-in-out infinite; }
.set-g-blob { position: absolute; border-radius: 50%; background: rgba(255,255,255,.14); pointer-events: none; }
.set-g-blob.a { width: 220px; height: 220px; right: -40px; top: -90px; animation: setdrift 9s ease-in-out infinite; }
.set-g-blob.b { width: 120px; height: 120px; right: 160px; bottom: -70px; animation: setdrift 7s ease-in-out infinite reverse; }
@keyframes setfloat { 0%,100% { transform: translateY(0) rotate(-4deg) } 50% { transform: translateY(-6px) rotate(4deg) } }
@keyframes setdrift { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-18px, 12px) } }
.set-g-body { padding: 24px 26px 8px; }
.set-g-body.set-anim.fwd { animation: setin-r .45s cubic-bezier(.2,.9,.3,1) both; }
.set-g-body.set-anim.bwd { animation: setin-l .45s cubic-bezier(.2,.9,.3,1) both; }
@keyframes setin-r { from { opacity: 0; transform: translateX(28px) } to { opacity: 1; transform: none } }
@keyframes setin-l { from { opacity: 0; transform: translateX(-28px) } to { opacity: 1; transform: none } }
.set-g-foot { position: sticky; bottom: 0; display: flex; align-items: center; gap: 10px; padding: 14px 26px 20px; background: linear-gradient(to top, var(--surface) 75%, transparent); z-index: 2; }
.set-g-foot .grow { flex: 1; }
.set-g-warn { flex: 1; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--bad); min-width: 0; }
.set-g-warn .ic { width: 16px; height: 16px; flex: none; }
.set-g-next { background: linear-gradient(120deg, var(--g1), var(--g2)); color: #fff; padding: 12px 20px; border-radius: 14px; font-size: 15px; box-shadow: 0 8px 22px color-mix(in srgb, var(--g1) 35%, transparent); cursor: pointer; transition: transform .2s, box-shadow .2s; }
.set-g-next:not([disabled]):hover { transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--g1) 45%, transparent); }
.set-g-next .ic { width: 17px; height: 17px; }
.set-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 8px; }
.set-tile { border-radius: 20px; padding: 16px; background: color-mix(in srgb, var(--tc) 8%, var(--surface-2)); }
.set-tile > span { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--tc); color: #fff; margin-bottom: 10px; }
.set-tile > span .ic { width: 22px; height: 22px; }
.set-tile b { display: block; font-size: 15px; }
.set-tile small { display: block; font-size: 13px; color: var(--muted); line-height: 1.4; margin-top: 3px; }
.set-opts { display: grid; gap: 10px; }
.set-opt { display: grid; grid-template-columns: 46px minmax(0, 1fr) 26px; gap: 14px; align-items: center; text-align: left; border: 1.5px solid var(--line); background: var(--surface); border-radius: 18px; padding: 14px; color: var(--ink); cursor: pointer; transition: border-color .25s, background .25s, transform .2s; }
.set-opt:hover { transform: translateY(-1px); }
.set-opt.on { border-color: var(--g1); background: color-mix(in srgb, var(--g1) 7%, var(--surface)); }
.set-opt-ic { width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; background: var(--surface-2); color: var(--g1); }
.set-opt.on .set-opt-ic { background: var(--g1); color: #fff; }
.set-opt-ic .ic { width: 22px; height: 22px; }
.set-opt-t b { display: block; font-size: 15px; }
.set-opt-t small { display: block; font-size: 13px; color: var(--muted); line-height: 1.4; }
.set-opt-ck { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--line); display: grid; place-items: center; color: transparent; }
.set-opt.on .set-opt-ck { background: var(--g1); border-color: var(--g1); color: #fff; }
.set-opt-ck .ic { width: 14px; height: 14px; }
.set-areas { margin-top: 16px; }
.set-area-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; margin-top: 8px; }
.set-area { position: relative; text-align: left; border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px; padding: 10px 40px 10px 12px; color: var(--ink); cursor: pointer; }
.set-area b { display: block; font-size: 14px; }
.set-area small { color: var(--muted); font-size: 12px; }
.set-area .set-pk-ck { position: absolute; right: 10px; top: 50%; margin-top: -11px; }
.set-area[aria-pressed="true"] { border-color: var(--g1); }
.set-area[aria-pressed="true"] > .set-pk-ck { background: var(--g1); border-color: var(--g1); }
.set-area[aria-pressed="false"] { opacity: .55; }
.set-done-hero { position: relative; text-align: center; padding: 8px 0 4px; }
.set-done-hero h3 { font: 800 26px var(--font-display); margin: 0 0 6px; }
.set-done-hero .set-lead { margin: 0 auto 18px; }
.set-confetti { position: absolute; inset: -30px 0 auto; height: 0; pointer-events: none; }
.set-confetti i { position: absolute; left: calc(5% + var(--i) * 5%); top: 0; width: 8px; height: 13px; border-radius: 2px; background: var(--c); animation: setconf 2.6s calc(var(--i) * -0.17s) cubic-bezier(.3,.6,.4,1) infinite; opacity: 0; }
@keyframes setconf { 0% { transform: translateY(-10px) rotate(0); opacity: 0 } 10% { opacity: 1 } 100% { transform: translateY(130px) rotate(540deg); opacity: 0 } }
.set-sums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.set-sum { border-radius: 20px; padding: 16px; background: color-mix(in srgb, var(--tc) 8%, var(--surface-2)); display: grid; gap: 4px; align-content: start; }
.set-sum-ic { width: 40px; height: 40px; border-radius: 13px; display: grid; place-items: center; background: var(--tc); color: #fff; }
.set-sum-ic .ic { width: 20px; height: 20px; }
.set-sum > b { font: 800 30px var(--font-display); margin-top: 6px; }
.set-sum > small { color: var(--muted); font-weight: 600; font-size: 13px; }
.set-sum-avs { display: flex; margin-top: 6px; }
.set-sum-avs .av { margin-right: -6px; box-shadow: 0 0 0 2px var(--surface); }
.set-sum-ics { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.set-sum-ics span { width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; background: var(--c); color: #fff; }
.set-sum-ics .ic { width: 14px; height: 14px; }
.set-sum-x { color: var(--tc) !important; font-weight: 700 !important; font-size: 12px; }
@media (max-width: 760px) {
  .set-tiles { grid-template-columns: 1fr; }
  .set-sums { grid-template-columns: 1fr 1fr; }
  .set-g-dot small { display: none; }
  .set-g-head { padding: 20px 18px; }
  .set-g-em { width: 52px; height: 52px; font-size: 28px; border-radius: 18px; }
  .set-g-body { padding: 18px 16px 6px; }
  .set-g-foot { padding: 12px 16px 16px; flex-wrap: wrap; }
  .set-g-warn { order: -1; flex-basis: 100%; }
  .set-g-foot .grow { display: none; }
  .set-g-next { margin-left: auto; }
  .set-ms { grid-template-columns: 1fr; }
  .set-bar { flex-wrap: wrap; }
  .set-bar > span { flex-basis: 100%; }
}
:host([data-theme="dark"]) .set-g-dot span { background: var(--surface-2); }
@media (max-width: 560px) {
  .set-body .dec-ctl { flex-wrap: nowrap; gap: 4px; }
  .set-body .dec-st { padding: 2px 4px 2px 2px; gap: 2px; }
  .set-body .dec-st button { width: 24px; height: 24px; }
  .set-body .dec-st > small:first-child { padding: 0 2px 0 6px; }
  .set-body .dec-ctl .iconbtn { width: 28px; margin-left: auto; }
}
.set-feats .feat { animation: none; }
.set-anim .set-m, .set-anim .set-h, .set-anim .set-area { animation: pop .45s both; }
.set-anim .set-tile, .set-anim .set-sum { animation: pop .5s both; }
.set-anim .feat, .set-anim .dec-row { animation: pop .4s both; }
.set-m .bd-f { grid-template-columns: 34px minmax(0, 1fr); row-gap: 6px; }
.set-m .bd-f small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.set-m .bd-f input { grid-column: 2; width: 100%; box-sizing: border-box; font: inherit; }
`;

/* ------------------------------------------------------------------ English */
const en = {
  "Hjemme": "At home",
  "Dagpleje": "Childminder",
  "Vuggestue": "Nursery",
  "Børnehave": "Kindergarten",
  "Skole": "School",
  "Opgaver": "Tasks",
  "Point": "Points",
  "Pointshop": "Points shop",
  "Lister": "Lists",
  "Kalender": "Calendar",
  "Madplan": "Meal plan",
  "Musik": "Music",
  "Apparater": "Appliances",
  "Sikkerhed": "Security",
  "Huset": "The house",
  "Pynt": "Decorations",
  "Elpris": "Electricity price",
  "Affald": "Waste",
  "Faste opgaver og missioner, børnene krydser af.": "Regular tasks and missions the children tick off.",
  "Børnene tjener point, når opgaverne er klaret.": "The children earn points when tasks are done.",
  "Point byttes til belønninger, som I godkender.": "Points are traded for rewards that you approve.",
  "Indkøb og huskelister fra Home Assistant.": "Shopping and to-do lists from Home Assistant.",
  "Familiens kalendere samlet ét sted og i tidslinjen.": "The family's calendars in one place and on the timeline.",
  "Ugens aftensmad fra en kalender.": "This week's dinners from a calendar.",
  "Styr højttalerne, skift rum og spil overalt.": "Control the speakers, switch rooms and play everywhere.",
  "Vaskemaskine, opvasker, robotter og meget mere.": "Washing machine, dishwasher, robots and much more.",
  "Alarm, døre, vinduer, låse og kameraer.": "Alarm, doors, windows, locks and cameras.",
  "Tegn huset, og se det hele leve på en plan.": "Draw the house and watch it all come alive on a floor plan.",
  "Himlen pynter selv op til jul, fødselsdage og mærkedage.": "The sky decorates itself for Christmas, birthdays and special days.",
  "Elprisen hen over dagen i tidslinjen.": "The electricity price through the day on the timeline.",
  "Skraldespandene i himlen, når der er tømning.": "The bins appear in the sky when they are emptied.",
  "Velkommen": "Welcome",
  "Familien": "The family",
  "Moduler": "Modules",
  "Hjemmet": "The home",
  "Færdig": "Done",
  "Avanceret": "Advanced",
  "Vejr": "Weather",
  "Kalendere": "Calendars",
  "Alarm": "Alarm",
  "Højttalere og TV": "Speakers and TVs",
  "Kameraer": "Cameras",
  "findes ikke": "missing",
  "Fjern {name}": "Remove {name}",
  "Tilføj": "Add",
  "Skift": "Change",
  "Vælg": "Choose",
  "Ingen": "None",
  "Forslag": "Suggestions",
  "Alle": "All",
  "Intet passer til søgningen": "Nothing matches the search",
  "Home Assistant har ingen af dem endnu": "Home Assistant doesn't have any yet",
  "Søg på navn eller entitet": "Search by name or entity",
  "Søg": "Search",
  "Annullér": "Cancel",
  "{n} år": "{n} years",
  "Tilføj mindst ét familiemedlem.": "Add at least one family member.",
  "Alle skal have et navn.": "Everyone needs a name.",
  "Der skal være mindst én forælder.": "There must be at least one parent.",
  "En person i Home Assistant kan kun være ét familiemedlem.": "A person in Home Assistant can only be one family member.",
  "Du er sat som barn. Så kan du ikke længere ændre indstillingerne. Gør dig selv til forælder først.": "You are set as a child, so you could no longer change the settings. Make yourself a parent first.",
  "Du skal selv være med som forælder for at kunne ændre indstillingerne.": "You must be in the family as a parent to change the settings.",
  "Navn": "Name",
  "dig": "you",
  "Ikke koblet til en person": "Not linked to a person",
  "Rolle": "Role",
  "Forælder": "Parent",
  "Barn": "Child",
  "Farve": "Colour",
  "Fødselsdag": "Birthday",
  "Bruges til pynt og alder": "Used for decorations and age",
  "Institution": "Daycare or school",
  "Person": "Person",
  "Egen kalender": "Own calendar",
  "Tilføj et familiemedlem": "Add a family member",
  "Også børn uden egen bruger i Home Assistant": "Also children without their own Home Assistant user",
  "Personer i Home Assistant, der ikke er med": "People in Home Assistant who aren't included",
  "Slå point til for at bruge pointshoppen": "Turn on points to use the points shop",
  "Vejret": "The weather",
  "Himlen i toppen følger vejret og viser ugens udsigt.": "The sky at the top follows the weather and shows the week's forecast.",
  "Aftalerne i tidslinjen og på kalenderen. Børnenes egne kalendere vælges under Familien.": "The events on the timeline and in the calendar. The children's own calendars are chosen under The family.",
  "En kalender med aftensmaden. Hver aftale er dagens ret.": "A calendar with the dinners. Each event is the dish of the day.",
  "Indkøbslister og huskelister fra Home Assistant.": "Shopping lists and to-do lists from Home Assistant.",
  "Alarmen i toppen og under Huset, fx Alarmo.": "The alarm at the top and under The house, e.g. Alarmo.",
  "Kameraerne under Huset.": "The cameras under The house.",
  "Det, I kan styre under Musik.": "What you can control under Music.",
  "En sensor med timepriser, fx Nord Pool eller Energi Data Service.": "A sensor with hourly prices, e.g. Nord Pool or Energi Data Service.",
  "Sensorer med næste tømningsdag, eller en kalender med tømningerne.": "Sensors with the next collection day, or a calendar with the collections.",
  "Tilføj en spand": "Add a bin",
  "pyntet {from}–{to}": "decorated {from}–{to}",
  "Skriv fødselsdagene under Familien": "Add the birthdays under The family",
  "Skriv datoen herunder": "Enter the date below",
  "Før": "Before",
  "Efter": "After",
  "Færre dage": "Fewer days",
  "Flere dage": "More days",
  "dag": "day",
  "dage": "days",
  "Pyntet nu": "Decorated now",
  "Vis {name} i himlen": "Show {name} in the sky",
  "Gift": "Married",
  "Kærester siden": "Together since",
  "Jul": "Christmas",
  "Nytår": "New Year",
  "Fastelavn": "Shrovetide",
  "Påske": "Easter",
  "Halloween": "Halloween",
  "Fødselsdage": "Birthdays",
  "Grundlovsdag": "Constitution Day",
  "Sankt Hans": "Midsummer",
  "Valentinsdag": "Valentine's Day",
  "Årsdag": "Anniversary",
  "Bryllupsdag": "Wedding anniversary",
  "Glædelig jul": "Merry Christmas",
  "Godt nytår": "Happy New Year",
  "Glædelig fastelavn": "Happy Shrovetide",
  "God påske": "Happy Easter",
  "Glædelig halloween": "Happy Halloween",
  "Tillykke": "Happy birthday",
  "God grundlovsdag": "Happy Constitution Day",
  "God sankthans": "Happy Midsummer",
  "Glædelig valentinsdag": "Happy Valentine's Day",
  "Tillykke med årsdagen": "Happy anniversary",
  "Tillykke med bryllupsdagen": "Happy wedding anniversary",
  "Ændre indstillinger, opgaver og belønninger": "Change settings, tasks and rewards",
  "Give og trække point": "Give and take points",
  "Godkende køb i pointshoppen": "Approve purchases in the points shop",
  "Tegne huset": "Draw the house",
  "Krydse egne opgaver af": "Tick off their own tasks",
  "Ønske sig noget fra pointshoppen": "Ask for something from the points shop",
  "Vælge eget tema": "Choose their own theme",
  "Hjemmets navn": "Name of the home",
  "Fx Hjemme hos os": "E.g. Our home",
  "Sprog": "Language",
  "Som Home Assistant": "Same as Home Assistant",
  "Dansk": "Danish",
  "Opgaverne starter forfra kl.": "Tasks start over at",
  "Hvem må hvad": "Who may do what",
  "Kun forældre": "Parents only",
  "Kan": "Can",
  "Forældre er dem, der er sat som forælder under Familien. Administratorer i Home Assistant, der ikke er med i familien, kan også ændre alt. En bruger uden familiemedlem, fx en fælles skærm i køkkenet, kan vælge et af børnene.":
    "Parents are the people set as parent under The family. Home Assistant administrators who aren't in the family can also change everything. A user without a family member, such as a shared screen in the kitchen, can choose one of the children.",
  "Panelets navn, ikon og om det kun er for administratorer ændres under Indstillinger → Enheder og tjenester → Hverdagsro.": "The panel's name, icon and whether it's for administrators only are changed under Settings → Devices & services → Hverdagsro.",
  "Om Hverdagsro": "About Hverdagsro",
  "Version {v}": "Version {v}",
  "Kør guiden igen": "Run the guide again",
  "Vejledning": "Documentation",
  "Meld en fejl": "Report a bug",
  "Huset har allerede {n} rum. Det beholdes, medmindre I vælger andet.": "The house already has {n} rooms. They are kept unless you choose otherwise.",
  "Behold huset": "Keep the house",
  "Fortsæt med den tegning, I har.": "Continue with the drawing you have.",
  "Tegn huset": "Draw the house",
  "Husbyggeren åbner, når guiden er færdig. Tegn vægge, rum, døre og vinduer, og sæt enhederne på.": "The house builder opens when the guide is done. Draw walls, rooms, doors and windows, and place your devices.",
  "Lav rum fra jeres områder": "Make rooms from your areas",
  "{n} områder fra Home Assistant bliver til rum, som I kan flytte på bagefter.": "{n} areas from Home Assistant become rooms that you can move around afterwards.",
  "Spring over": "Skip",
  "I kan altid tegne huset senere.": "You can always draw the house later.",
  "Rummene": "The rooms",
  "Rum": "Room",
  "Stue": "Living room",
  "Køkken": "Kitchen",
  "Soveværelse": "Bedroom",
  "Børneværelse": "Children's room",
  "Gæsteværelse": "Guest room",
  "Kontor": "Office",
  "Badeværelse": "Bathroom",
  "Lille bad": "Small bathroom",
  "Toilet": "Toilet",
  "Bryggers": "Utility room",
  "Entré og gang": "Hall",
  "Walk-in": "Walk-in",
  "Garage": "Garage",
  "Andet rum": "Other room",
  "Dagen for hele familien": "The day for the whole family",
  "Opgaver, point og belønninger, som børnene selv kan krydse af.": "Tasks, points and rewards that the children tick off themselves.",
  "Overblik": "Overview",
  "Kalendere, madplan, lister og vejret i én levende tidslinje.": "Calendars, meal plan, lists and the weather on one living timeline.",
  "Lys, musik, alarm, døre og apparater på jeres egen tegning.": "Lights, music, alarm, doors and appliances on your own drawing.",
  "Hverdagsro samler familiens hverdag i Home Assistant. Guiden tager et par minutter, og alt kan ændres bagefter.": "Hverdagsro brings the family's everyday life together in Home Assistant. The guide takes a few minutes, and everything can be changed afterwards.",
  "Hvad hedder jeres hjem?": "What is your home called?",
  "Vi har fundet {n} personer i Home Assistant. Vælg, hvem der er forældre og børn, og giv hver en farve.": "We found {n} people in Home Assistant. Choose who are parents and children, and give each a colour.",
  "Tilføj familien. I kan koble hver person til en person i Home Assistant, så de kan logge ind og se deres egen side.": "Add the family. You can link each member to a person in Home Assistant, so they can log in and see their own page.",
  "Slå det til, I vil bruge. Det, der er slået fra, forsvinder for hele familien.": "Turn on what you want to use. What is turned off disappears for the whole family.",
  "Vi har valgt det, vi fandt i Home Assistant. Ret det, der ikke passer.": "We've chosen what we found in Home Assistant. Change whatever isn't right.",
  "Huset er en plan over jeres hjem, hvor lys, døre, vinduer, højttalere og apparater lever. Tryk på et rum for at åbne det.": "The house is a floor plan of your home where lights, doors, windows, speakers and appliances come alive. Tap a room to open it.",
  "Alt er klar": "All set",
  "Her er, hvad I har sat op. Det hele kan ændres under Familieindstillinger.": "Here's what you've set up. Everything can be changed under Family settings.",
  "i familien": "in the family",
  "moduler slået til": "modules turned on",
  "ting fra Home Assistant": "things from Home Assistant",
  "rum i huset": "rooms in the house",
  "Husbyggeren åbner bagefter": "The house builder opens next",
  "Trin": "Steps",
  "Trin {n} af {m}": "Step {n} of {m}",
  "Velkommen til Hverdagsro": "Welcome to Hverdagsro",
  "Tilbage": "Back",
  "Start Hverdagsro": "Start Hverdagsro",
  "Kom i gang": "Get started",
  "Næste": "Next",
  "{n} rum er lagt ind i huset": "{n} rooms have been added to the house",
  "Du har ændringer, der ikke er gemt": "You have unsaved changes",
  "Fortryd": "Undo",
  "Gem": "Save",
  "Gælder for hele familien": "Applies to the whole family",
  "Udfyld automatisk": "Fill in automatically",
  "Gemmes med det samme": "Saved straight away",
  "Pynt i himlen": "Decorations in the sky",
  "Sættes automatisk": "Set automatically",
  "Himlen pynter selv op til mærkedagene. Vælg hvilke, og hvor mange dage før og efter der er pyntet. Tryk på øjet for at se pynten nu.": "The sky decorates itself for special days. Choose which ones, and how many days before and after it stays decorated. Tap the eye to see the decorations now.",
  "Pynt er slået fra.": "Decorations are turned off.",
  "Slå til": "Turn on",
  "Indstillingerne gemmes i Hverdagsro i Home Assistant og gælder for hele familien.": "The settings are stored by Hverdagsro in Home Assistant and apply to the whole family.",
  "Fjern {name}?": "Remove {name}?",
  "{name} forsvinder fra Hverdagsro, når I gemmer. Point og opgaver til {name} forsvinder også.": "{name} disappears from Hverdagsro when you save. Points and tasks for {name} disappear too.",
  "Fjern": "Remove",
  "Nyt medlem": "New member",
  "Person i Home Assistant": "Person in Home Assistant",
  "{name}s kalender": "{name}'s calendar",
  "Barnet": "The child",
  "Familien er gemt": "The family has been saved",
  "{name} er slået til": "{name} is turned on",
  "{name} er slået fra": "{name} is turned off",
  "Det, vi fandt i Home Assistant, er lagt ind": "What we found in Home Assistant has been added",
  "Sådan ser {name} ud i himlen": "This is how {name} looks in the sky",
  "Familieindstillinger": "Family settings",
  "Indstillinger": "Settings",
};

/* ------------------------------------------------------------------ the module */
export default {
  id: "settings",
  views: {
    guide: {
      parentOnly: true,
      render: renderGuide,
      title: (ctx) => ctx.t("Kom i gang"),
    },
    indstillinger: {
      parentOnly: true,
      render: renderSettings,
      title: (ctx) => (ctx.narrow ? ctx.t("Indstillinger") : ctx.t("Familieindstillinger")),
    },
  },
  acts,
  inputs,
  css,
  en,
};

// Exported for tests and for other modules (the house builder may reuse them).
export { suggestions, withSuggestions, familyFromPersons, roomsFromAreas, familyProblem };
