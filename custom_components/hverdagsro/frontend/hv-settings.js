/* Hverdagsro – the setup guide and the family settings.
   The guide (view "guide") walks a parent through everything with smart defaults; each step is saved
   when the parent goes on, so it can be resumed. "indstillinger" holds the same editors as tabs. */
import { addDays, esc, slug, startOfDay } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import { occasions, activeDecor, dayNumber, wedName, WED, BIG } from "./hv-decor.js";
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
/* The prototype's Funktioner (FEATS): [module, name, icon, colour, description]. "media" is "music" here. */
const MODS = [
  ["missions", "Missioner", "tasks", "#1E9E62", "Børnene får egne opgaver, de selv krydser af, og perfekte dage"],
  ["points", "Point", "pstar", "#F2B01E", "Point for missioner og rutiner, som kan bruges i shoppen"],
  ["shop", "Pointshop", "shop", "#FF7A59", "Belønninger, mål og køb, som forældre godkender. Kræver point"],
  ["board", "Rutinetavle", "star", "#11A39A", "Visuel tavle for børn, der har brug for faste rutiner"],
  ["rooms", "Værelser", "bulb", "#F2B01E", "Børnenes værelser med lys og scener fra HA"],
  ["music", "Musik", "music", "#E4568C", "Alle højttalere, grupper og Spotify"],
  ["appliances", "Apparater", "plug", "#2F80ED", "Hvidevarer, robotter og ventilation"],
  ["security", "Sikkerhed", "shield", "#D9473B", "Kameraer, døre, vinduer, porte og låse"],
  ["decor", "Pynt", "gift", "#E4568C", "Himlen pynter op til jul, påske, fødselsdage og andre mærkedage"],
  ["pet", "Kæledyr", "star", "#8B5CF6", "Et lille dyr, der bliver gladere, når missionerne er klaret"],
  ["wish", "Ønsker", "gift", "#2F80ED", "Ønskesedler fra Ønskeskyen"],
  ["skema", "Skoleskema", "school", "#3B6BF5", "Aulas skema på børnenes sider"],
  ["read", "Oplæsning", "speaker", "#11A39A", "Læs dagen og beskeder op for børnene"],
  ["meals", "Madplan", "food", "#6E4AFF", "Middagsros madplan, aftensmad og budget"],
  ["energy", "El og biler", "bolt", "#1E9E62", "Elpris og bilerne fra EV Planner under himlen"],
  ["alarm", "Alarm", "shieldf", "#D9473B", "Alarmo med kode"],
  ["waste", "Tømningsdage", "trash2", "#4B5563", "Skraldespande i himlen og påmindelse aftenen før"],
  ["quick", "Quick actions", "homein", "#E39A1C", "Rutiner og genveje på forsiden"],
];
/* The prototype's MODULES: what each child has. */
const KMODS = [["room", "Mit værelse"], ["board", "Rutinetavle"], ["missions", "Missioner"], ["points", "Point"], ["shop", "Pointshop"], ["pet", "Mit dyr"], ["read", "Oplæsning"], ["skema", "Skoleskema"], ["wish", "Ønskeseddel"]];
const KID_DEFAULTS = { room: true, board: false, missions: true, points: true, shop: true, pet: true, read: false, skema: true, wish: true };
const KINST = [["dagpleje", "Dagpleje", "🧸"], ["vuggestue", "Vuggestue", "🍼"], ["bornehave", "Børnehave", "🎨"], ["skole", "Skole", "🎒"]];
const PETS = [["hund", "Hund"], ["kat", "Kat"], ["drage", "Lille drage"]];
/* Alarm modes: [state, name, icon, colour, description, supported_features bit] */
const AL_MODES = [
  ["armed_home", "Hjemme", "home", "#3B6BF5", "Skal-sikring, I er hjemme", 1],
  ["armed_away", "Ude", "walk", "#E5484D", "Hele huset, ingen hjemme", 2],
  ["armed_night", "Nat", "moon", "#7B5CFF", "Skal-sikring og nedenunder", 4],
  ["armed_vacation", "Ferie", "sun", "#11A39A", "Som ude, mens I er væk længe", 32],
  ["armed_custom_bypass", "Egen", "shield", "#E4568C", "Egne sensorer", 16],
];
const RIGHTS = [
  ["Se hele familiens kalender og opgaver", 1, 0],
  ["Oprette aftaler for andre", 1, 0],
  ["Oprette og slette lister", 1, 0],
  ["Give og trække point", 1, 0],
  ["Godkende køb i shoppen", 1, 0],
  ["Sætte priser og belønninger", 1, 0],
  ["Slå moduler til og fra pr. barn", 1, 0],
  ["Ændre +-menu, beskeder og PIN", 1, 0],
  ["Krydse egne missioner af", 1, 1],
  ["Købe i shoppen (venter på godkendelse)", 0, 1],
];
const QA_ICONS = ["homein", "homeout", "sunrise", "moon", "coffee", "bulb", "dish", "curtain", "star", "bolt", "shieldf", "food"];
const QA_COLORS = ["#1E9E62", "#D98A12", "#F2B01E", "#6E4AFF", "#11A39A", "#9A6B4A", "#E3A21C", "#3B6BF5", "#E4568C", "#D9473B"];
const QA_DOMAINS = ["script", "scene", "button", "input_button", "input_boolean", "switch", "light", "automation", "cover", "lock", "fan"];
const QA_THEN = [["", "Intet"], ["disarm", "Frakobl alarmen"], ["armed_home", "Tilkobl · hjemme"], ["armed_away", "Tilkobl · ude"], ["armed_night", "Tilkobl · nat"], ["armed_vacation", "Tilkobl · ferie"]];
/* What Ønskeskyen calls the lists' access. */
const ACCESS = { Public: "Offentlig", Private: "Privat", Hidden: "Skjult", Shared: "Delt", Friends: "Venner" };
/* The occasions' descriptions in the prototype's Pynt rows. */
const DESC = {
  jul: "24.–26. december",
  nytaar: "31. december–1. januar",
  fastelavn: "Søndag 7 uger før påske",
  paaske: "Skærtorsdag–2. påskedag",
  halloween: "31. oktober",
  fodselsdag: "Alle i husstanden · datoerne står på profilerne",
  grundlov: "5. juni",
  sankthans: "23. juni",
  valentin: "14. februar",
  aarsdag: "{names} som kærester",
  bryllup: "{names} · med kobber-, sølv- og guldbryllup",
};
const STEPS = [
  ["velkommen", "Velkommen", "👋", "#6E4AFF", "#11A39A"],
  ["familie", "Familien", "👨‍👩‍👧‍👦", "#EE5E52", "#E39A1C"],
  ["moduler", "Moduler", "✨", "#E3A21A", "#E4568C"],
  ["hjemmet", "Hjemmet", "🏡", "#11A39A", "#3B6BF5"],
  ["huset", "Huset", "📐", "#3B6BF5", "#8B5CF6"],
  ["faerdig", "Færdig", "🎉", "#1FA36A", "#11A39A"],
];
/* The prototype's set-tabs, then what Home Assistant needs on top: the family and the home's entities. */
const TABS = [
  ["funk", "Funktioner", null],
  ["born", "Børn", null],
  ["osky", "Ønskeskyen", "wish"],
  ["musik", "Musik", "music"],
  ["pynt", "Pynt", "decor"],
  ["qa", "Quick actions", "quick"],
  ["alarm", "Alarm", "alarm"],
  ["ret", "Rettigheder", null],
  ["familie", "Familien", null],
  ["hjemmet", "Hjemmet", null],
];
const TAB_ALIAS = { moduler: "funk", avanceret: "hjemmet", born: "born", kids: "born", quick: "qa" };
const DOMAIN_ICON = { weather: "sun", calendar: "cal", todo: "lists", alarm_control_panel: "shieldf", media_player: "speaker", camera: "camera", sensor: "bolt", person: "user", device_tracker: "walk", script: "play", scene: "sparkle", button: "power", input_button: "power", automation: "repeat" };
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
  quick: [["script", "scene", "button", "input_button", "automation"], true, "Genveje"],
};
const RE_MEALS = /\b(mad|madplan|meal|meals|food|dinner|aftensmad|menu)/i;
const RE_WASTE = /(affald|skrald|waste|garbage|trash|renovation|papir|plast|rest|bio|glas|metal|pap\b|tømning|tomning)/i;
const RE_OUTDOOR = /(have|garden|terrasse|terrace|indkørsel|indkorsel|driveway|udenfor|outdoor|yard|altan|balcony|carport|gård|gaard)/i;

/* ------------------------------------------------------------------ local state */
let MODE = "set"; // "guide" while rendering the guide
let TAB = "funk";
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
  return list.map((m) => {
    const { has_pin, pin, ...rest } = m;
    return {
      ...rest,
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
    };
  });
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
      ${multi ? `<div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Annuller"))}</button><button class="btn" data-pk-done>${esc(ctx.t("Færdig"))}<span class="set-pk-n num"></span></button></div>` : ""}</div>`,
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
function homeEditor(ctx, inTabs = false) {
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
  if (isOn(ctx, "music") && !inTabs) parts.push(["speaker", "#DB2777", ctx.t("Højttalere og TV"), ctx.t("Det, I kan styre under Musik."), pickField(ctx, "media")]);
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

/* ------------------------------------------------------------------ editor: decorations (the prototype's Pynt rows) */
const dnDate = (n) => {
  const d = new Date(n * 864e5);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
};
function parentNames(ctx) {
  const p = ctx.parents().map((m) => m.name);
  return p.length > 1 ? `${p.slice(0, -1).join(", ")} ${ctx.t("og")} ${p[p.length - 1]}` : p[0] || ctx.t("I");
}
/* The next big wedding anniversary: [years, name, day number]. */
function nextBig(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const t = dayNumber(new Date());
  for (const [n, nm] of WED) {
    if (!(BIG[n] || n % 5 === 0)) continue;
    const dt = n % 1 ? new Date(Date.UTC(y + Math.floor(n), m - 1 + 6, d)) : new Date(Date.UTC(y + n, m - 1, d));
    const k = Math.round(dt / 864e5);
    if (k >= t) return [n, nm, k];
  }
  return null;
}
function decorEditor(ctx) {
  const s = ctx.data.settings;
  const today = new Date();
  const t = dayNumber(today);
  const live = new Set(activeDecor(today, s, ctx.data.family).map((x) => x.key));
  const days = s.decor_days || {};
  const ann = s.anniversaries || {};
  const short = (n) => ctx.fmt.date(dnDate(n), { day: "numeric", month: "short" });
  return `<div class="dec-list">${occasions(s, ctx.data.family)
    .map((o, i) => {
      const [key, name, em, col, dates, def] = o;
      const on = s.decor?.[key] !== false;
      const before = days[`${key}_before`] ?? def[0];
      const after = days[`${key}_after`] ?? def[1];
      const nx = key === "fodselsdag" ? null : [today.getFullYear(), today.getFullYear() + 1].flatMap((Y) => dates(Y)).filter(([, b]) => b + after >= t).sort((x, y) => x[0] - y[0])[0];
      const isLive = live.has(key) && on;
      const sub = `${ctx.t(DESC[key] || "", { names: parentNames(ctx) })}${nx && on ? ` · ${ctx.t("pyntet {from}–{to}", { from: short(nx[0] - before), to: short(nx[1] + after) })}` : ""}`;
      const st = (k, label, v) =>
        `<span class="dec-st"><small>${esc(ctx.t(label))}</small><button data-act="set-dec-step" data-id="${key}" data-k="${k}" data-d="-1" aria-label="${esc(ctx.t("{n} færre dage", { n: ctx.t(label) }))}" ${v <= 0 ? "disabled" : ""}>−</button><b class="num">${v}</b><button data-act="set-dec-step" data-id="${key}" data-k="${k}" data-d="1" aria-label="${esc(ctx.t("{n} flere dage", { n: ctx.t(label) }))}">+</button><small>${esc(v === 1 ? ctx.t("dag") : ctx.t("dage"))}</small></span>`;
      const annKey = key === "aarsdag" ? "together" : key === "bryllup" ? "wedding" : null;
      let bd = "";
      if (annKey) {
        const iso = ann[annKey] || "";
        const nb = key === "bryllup" ? nextBig(iso) : null;
        const since = iso ? ctx.t("Siden {y}", { y: iso.slice(0, 4) }) : ctx.t("Skriv datoen, så pynter himlen på dagen");
        const big = nb ? ` · ${ctx.t("næste store: {n} år, {name}, {date}", { n: String(nb[0]).replace(".5", "½"), name: wedName(nb[0]) || "", date: `${short(nb[2])} ${dnDate(nb[2]).getFullYear()}` })}` : "";
        bd = `<div class="dec-bd"><label class="dec-p"><span>${esc(annKey === "wedding" ? ctx.t("Gift") : ctx.t("Kærester siden"))}</span><input type="date" value="${esc(iso)}" data-in="set-anniv" data-k="${annKey}" aria-label="${esc(ctx.t(name))}"></label><small class="t-sub">${esc(since + big)}</small></div>`;
      }
      return `<div class="dec-row${on ? "" : " off"}${isLive ? " live" : ""}" style="--dc:${col}"><span class="dec-em">${em}</span><div class="dec-t"><b>${esc(ctx.t(name))}${isLive ? `<i class="dec-live">${esc(ctx.t("Pyntet nu"))}</i>` : ""}</b><small>${esc(sub)}</small></div>
        <div class="dec-ctl">${st("before", "Før", before)}${st("after", "Efter", after)}<button class="iconbtn" data-act="set-dec-prev" data-id="${key}" aria-label="${esc(ctx.t("Vis {name} i himlen", { name: ctx.t(name).toLowerCase() }))}">${svg("eye")}</button></div>
        <button class="toggle" data-act="set-dec-on" data-id="${key}" aria-pressed="${on}" aria-label="${esc(ctx.t(name))}" style="--tc:${col}"></button>${bd}</div>`;
    })
    .join("")}</div>`;
}

/* ------------------------------------------------------------------ the prototype's sections */
const lockTag = (ctx) => `<span class="lock">${svg("shield")}${esc(ctx.t("Kun forældre"))}</span>`;
const sub = (text) => `<p class="t-sub" style="margin:-6px 0 14px">${esc(text)}</p>`;

function featsSection(ctx) {
  return `<section class="card" data-st="funk"><div class="card-head"><h2>${esc(ctx.t("Funktioner"))}</h2>${lockTag(ctx)}</div>
    ${sub(ctx.t("Slå det fra, I ikke bruger. Det forsvinder for hele familien. Pr. barn styres det under Børn."))}${modulesEditor(ctx)}</section>`;
}

/* A member's birthday, like the prototype's bdayField. */
function bdayField(ctx, m) {
  const iso = m.birthday;
  let small = ctx.t("Ikke sat endnu");
  if (iso) {
    const d = new Date(iso + "T12:00:00");
    small = `${ctx.fmt.date(d, { day: "numeric", month: "long", year: "numeric" })} · ${ageText(ctx, iso)}`;
  }
  return `<div class="bd-f"><span class="bd-ic">🎂</span><div><b>${esc(ctx.t("Fødselsdag"))}</b><small>${esc(small)}</small></div><input type="date" value="${esc(iso || "")}" data-in="set-bdate" data-id="${esc(m.id)}" aria-label="${esc(ctx.t("{name}s fødselsdag", { name: m.name }))}"></div>`;
}
/* What Home Assistant needs for a child's modules, in the prototype's bd-f style. */
function kidLinks(ctx, k) {
  const rows = [];
  const pick = (key, em, title, text) =>
    `<div class="bd-f set-kl"><span class="bd-ic">${em}</span><div><b>${esc(title)}</b><small>${esc(text)}</small></div><button class="btn soft sm" data-act="set-kpick" data-id="${esc(k.id)}" data-k="${key}">${esc(k[key] ? ctx.t("Skift") : ctx.t("Vælg"))}</button></div>`;
  if (ctx.feature(k, "pet")) {
    const pet = k.pet || {};
    rows.push(`<div class="bd-f set-kl set-pet"><span class="bd-ic">🐾</span><div><b>${esc(ctx.t("Mit dyr"))}</b><small>${esc(ctx.t("Bliver gladere, når dagens missioner er klaret"))}</small></div>
      <span class="set-pet-in"><input value="${esc(pet.name || "")}" maxlength="20" placeholder="${esc(ctx.t("Navn"))}" data-in="set-pet-name" data-id="${esc(k.id)}" aria-label="${esc(ctx.t("Dyrets navn"))}"><select data-in="set-pet-kind" data-id="${esc(k.id)}" aria-label="${esc(ctx.t("Slags"))}">${PETS.map(([v, n]) => `<option value="${v}" ${(pet.kind || "hund") === v ? "selected" : ""}>${esc(ctx.t(n))}</option>`).join("")}</select></span></div>`);
  }
  if (ctx.feature(k, "skema")) rows.push(pick("skema", "📚", ctx.t("Skoleskema"), k.skema ? nameOf(ctx, k.skema) : ctx.t("Vælg kalenderen med skemaet, fx fra Aula")));
  if (ctx.feature(k, "read")) rows.push(pick("speaker", "🔊", ctx.t("Oplæsning"), k.speaker ? nameOf(ctx, k.speaker) : ctx.t("Vælg højttaleren på værelset")));
  return rows.join("");
}
/* Lessons to leave out of the timetables (Aula has "Pædagog i skolen" and such): tap a lesson from this week, or type. */
function skemaHide(ctx) {
  const cals = ctx.children().filter((k) => k.skema && ctx.feature(k, "skema")).map((k) => k.skema);
  if (!cals.length) return "";
  const hide = ctx.data.settings.skema_hide || [];
  const mon = addDays(startOfDay(new Date()), -((new Date().getDay() + 6) % 7));
  const seen = new Map();
  for (const e of ctx.events(cals, mon, addDays(mon, 7), true)) if (!e.allDay && e.title) seen.set(e.title.trim(), (seen.get(e.title.trim()) || 0) + 1);
  const titles = [...new Set([...hide, ...[...seen.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n)])].slice(0, 24);
  const isHidden = (n) => hide.some((w) => n.toLowerCase().includes(w.toLowerCase()));
  return `<div class="skh"><b>${esc(ctx.t("Skjul i skoleskemaet"))}</b><small class="t-sub">${esc(ctx.t("Tryk på det, der ikke skal vises på skemaet, i kalenderen og på børnenes sider. Fx »Pædagog i skolen«."))}</small>
    <div class="skh-chips">${titles.map((n) => `<button data-act="set-skhide" data-w="${esc(n)}" aria-pressed="${isHidden(n)}">${isHidden(n) ? svg("eye") : ""}${esc(n)}</button>`).join("") || `<span class="t-sub">${esc(ctx.t("Ingen timer i skemaet i denne uge"))}</span>`}</div>
    <div class="skh-add"><input id="skh-in" maxlength="60" placeholder="${esc(ctx.t("Eller skriv et ord, fx Pædagog"))}"><button class="btn soft sm" data-act="set-skhide-add">${svg("plus")}${esc(ctx.t("Skjul"))}</button></div></div>`;
}
function kidsSection(ctx) {
  const kids = ctx.children();
  return `<section class="card" data-st="born"><div class="card-head"><h2>${esc(ctx.t("Børnene"))}</h2>${lockTag(ctx)}</div>
    ${kids.length ? `<div class="kset">${kids
      .map((k) => {
        const mods = KMODS.filter(([m]) => m !== "skema" || k.institution === "skole");
        return `<div class="kset-k" style="--pc:${esc(k.color)}"><div class="kset-h">${ctx.avatar(k.id)}<b>${esc(k.name)}</b></div>
          <div class="inst">${KINST.map(([i, n, em]) => `<button data-act="set-kinst" data-kid="${esc(k.id)}" data-id="${i}" aria-pressed="${k.institution === i}"><span>${em}</span>${esc(ctx.t(n))}</button>`).join("")}</div>
          ${bdayField(ctx, k)}
          <div class="mods" style="grid-template-columns:minmax(0,1fr) 64px">${mods.map(([m, n]) => `<span>${esc(ctx.t(n))}</span><button class="toggle" data-act="set-kmod" data-kid="${esc(k.id)}" data-mod="${m}" aria-pressed="${ctx.feature(k, m)}" aria-label="${esc(ctx.t("{what} for {name}", { what: ctx.t(n), name: k.name }))}" style="--tc:${esc(k.color)}"></button>`).join("")}</div>
          ${kidLinks(ctx, k)}</div>`;
      })
      .join("")}</div>` : `<p class="t-sub">${esc(ctx.t("Der er ingen børn i familien endnu."))} <button class="lnk" data-act="set-tab" data-id="familie">${esc(ctx.t("Tilføj under Familien"))}</button></p>`}
    <p class="t-sub" style="margin-top:10px">${esc(ctx.t("Institutionen bestemmer, hvad barnet ser: skoleskema kun i skole, ellers dagens aflevering og afhentning fra Hent og bring."))}</p>${skemaHide(ctx)}</section>`;
}

/* Ønskeskyen: whose list is it? A guess until a parent chooses. */
function oskyTarget(ctx, l) {
  const set = ctx.data.settings.osky_to || {};
  if (set[l.id]) return set[l.id];
  const t = `${l.title} ${l.kid || ""}`.toLowerCase();
  const m = ctx.members().find((x) => t.includes(x.name.toLowerCase()));
  if (m) return m.id;
  const owner = ctx.parents().find((x) => (l.owner || "").toLowerCase() === x.name.toLowerCase());
  return owner ? owner.id : "andre";
}
function oskyTargets(ctx) {
  const parents = ctx.parents();
  return [
    ...ctx.children().map((m) => [m.id, m.name]),
    ...parents.map((m) => [m.id, m.name]),
    ...(parents.length > 1 ? [["begge", parentNames(ctx)]] : []),
    ["andre", ctx.t("Venner og familie")],
    ["skjul", ctx.t("Vis ikke")],
  ];
}
function oskySection(ctx) {
  const o = ctx.data.osky || { accounts: {}, lists: [] };
  const lists = o.lists || [];
  const when = (iso) => (iso ? `${ctx.fmt.rel(new Date(iso))} ${ctx.fmt.time(new Date(iso))}` : "");
  const targets = oskyTargets(ctx);
  return `<section class="card" data-st="osky"><div class="card-head"><h2>${esc(ctx.t("Ønskeskyen"))}</h2><span class="meta">${esc(ctx.t("{n} ønskesedler", { n: lists.length }))}</span></div>
    ${sub(ctx.t("Hver forælder logger ind med sin egen konto. Så ser Hverdagsro de ønskesedler, I selv har, og dem der er delt med jer."))}
    <div class="os-acc">${ctx.parents()
      .map((p) => {
        const A = o.accounts?.[p.id];
        const small = A ? (A.error ? ctx.t("Kunne ikke hente: {e}", { e: A.error }) : ctx.t("Logget ind som {name} · hentet {when}", { name: A.name || p.name, when: when(A.at) })) : ctx.t("Ikke logget ind");
        return `<div class="os-a${A ? " on" : ""}">${ctx.avatar(p.id)}<div><b>${esc(p.name)}</b><small>${esc(small)}</small></div>${A ? `<button class="btn soft sm" data-act="set-osky-out" data-id="${esc(p.id)}">${esc(ctx.t("Log ud"))}</button>` : `<button class="btn sm" data-act="set-osky-in" data-id="${esc(p.id)}">${svg("cloudy")}${esc(ctx.t("Log ind"))}</button>`}</div>`;
      })
      .join("")}</div>
    ${lists.length ? `<div class="t-sub" style="margin:16px 0 8px">${esc(ctx.t("Hvis ønsker er det?"))}</div>
    <div class="os-lists">${lists
      .map((l) => {
        const to = oskyTarget(ctx, l);
        const via = (l.via || []).map((v) => ctx.member(v)?.name).filter(Boolean);
        const meta = [l.owner, ctx.t("{n} ønsker", { n: l.count ?? (l.wishes || []).length }), l.access ? ctx.t(ACCESS[l.access] || l.access) : "", via.length > 1 ? ctx.t("via {names}", { names: via.join(` ${ctx.t("og")} `) }) : ""].filter(Boolean).join(" · ");
        return `<div class="os-l${to === "skjul" ? " off" : ""}"><span class="os-ic">${svg("gift")}</span><div><b>${esc(l.title)}</b><small>${esc(meta)}</small></div>
          <select data-in="set-osky-to" data-id="${esc(l.id)}" aria-label="${esc(ctx.t("Hvis ønsker er {name}", { name: l.title }))}">${targets.map(([k, n]) => `<option value="${esc(k)}" ${to === k ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>`;
      })
      .join("")}</div>` : ""}
    <p class="t-sub" style="margin-top:10px">${esc(ctx.t("Ønskesedler til børnene vises på deres side under Ønsker. Jeres egne og fælles står under Lister. Venner og familie samles under Lister som gaveidéer."))}</p></section>`;
}
function oskyLogin(ctx, id) {
  const p = ctx.member(id);
  const s = ctx.sheet(`<div class="eyebrow">${esc(ctx.t("Ønskeskyen"))}</div><h2>${esc(ctx.t("Log ind som {name}", { name: p?.name || "" }))}</h2>
    <div class="field"><label for="os-u">${esc(ctx.t("E-mail"))}</label><input id="os-u" type="email" autocomplete="username" placeholder="${esc(ctx.t("navn@eksempel.dk"))}"></div>
    <div class="field"><label for="os-p">${esc(ctx.t("Adgangskode"))}</label><input id="os-p" type="password" autocomplete="current-password"></div>
    <p class="t-sub" style="margin-top:10px">${esc(ctx.t("Hverdagsro logger ind ligesom Ønskeskyen på nettet og gemmer kun nøglen i Home Assistant, ikke adgangskoden. Facebook- og Apple-login kræver, at du først sætter en adgangskode i Ønskeskyen."))}</p>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Annuller"))}</button><button class="btn" id="os-go">${esc(ctx.t("Log ind"))}</button></div>`);
  const u = s.el.querySelector("#os-u");
  const pw = s.el.querySelector("#os-p");
  setTimeout(() => u.focus(), 60);
  const go = async () => {
    const email = u.value.trim();
    if (!email) return u.focus();
    if (!pw.value) return pw.focus();
    const btn = s.el.querySelector("#os-go");
    btn.disabled = true;
    const req = ctx.ws("osky/login", { member: id, email, password: pw.value });
    pw.value = ""; // The password lives only in this one request.
    try {
      await req;
      s.close();
      ctx.toast(ctx.t("{name} er logget ind i Ønskeskyen", { name: p?.name || "" }));
    } catch (err) {
      btn.disabled = false;
      pw.focus();
      ctx.toast(String(err?.message || err));
    }
  };
  s.el.querySelector("#os-go").addEventListener("click", go);
  pw.addEventListener("keydown", (e) => e.key === "Enter" && go());
}

/* The prototype's speaker icons by kind. */
function spkKind(ctx, id) {
  const st = ctx.hass.states[id];
  const n = `${id} ${st?.attributes?.friendly_name || ""}`.toLowerCase();
  if (st?.attributes?.device_class === "tv" || /\btv\b|apple_tv|appletv|chromecast|webos|bravia/.test(n)) return "tv";
  if (/roam|move/.test(n)) return "roam";
  if (/nest|home mini|google/.test(n)) return "nest";
  if (/airport|airplay/.test(n)) return "airport";
  if (/beam|arc|ray|playbar|soundbar|stue/.test(n)) return "bar";
  return "one";
}
function spkIcon(kind) {
  const m = { bar: `<rect x="3" y="9" width="18" height="6" rx="2"/><path d="M6 12h.01M9 12h.01M12 12h.01M15 12h.01M18 12h.01"/>`, one: `<rect x="7" y="3" width="10" height="18" rx="3"/><circle class="woof" cx="12" cy="14" r="3"/><circle cx="12" cy="7" r=".8"/>`, roam: `<path d="M9 3h6l2 18H7z"/><circle class="woof" cx="12" cy="14" r="2.4"/>`, nest: `<ellipse cx="12" cy="13" rx="8" ry="7"/><circle class="woof" cx="12" cy="13" r="3"/>`, airport: `<rect x="5" y="5" width="14" height="14" rx="3"/><circle class="woof" cx="12" cy="12" r="2"/>`, tv: `<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 20h6"/>` }[kind];
  return `<svg viewBox="0 0 24 24" class="ic spk" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${m}</svg>`;
}
const allSpeakers = (ctx) => ctx.entities("media_player");
const shownSpeakers = (ctx) => {
  const all = allSpeakers(ctx);
  const chosen = (ctx.data.settings.media || []).filter((id) => all.includes(id) || ctx.hass.states[id]);
  return chosen.length ? chosen : all;
};
function musicSection(ctx) {
  const all = [...new Set([...allSpeakers(ctx), ...(ctx.data.settings.media || [])])];
  const shown = new Set(shownSpeakers(ctx));
  return `<section class="card" data-st="musik"><div class="card-head"><h2>${esc(ctx.t("Højttalere på Musik"))}</h2><span class="meta">${esc(ctx.t("{n} af {m}", { n: all.filter((id) => shown.has(id)).length, m: all.length }))}</span></div>
    ${all.length ? `<div class="mu-pick">${all.map((id) => `<button data-act="set-spk" data-id="${esc(id)}" aria-pressed="${shown.has(id)}">${spkIcon(spkKind(ctx, id))}<span><b>${esc(nameOf(ctx, id))}</b><small>${esc(id)}</small></span></button>`).join("")}</div>` : `<p class="t-sub">${esc(ctx.t("Home Assistant har ingen højttalere endnu."))}</p>`}</section>`;
}

/* Quick actions: the prototype's QA list and qaForm. */
const condText = (ctx, c = {}) =>
  c.kind === "time" || c.kind === "entity"
    ? `${c.kind === "entity" && c.entity ? ctx.t("Når {e} er tændt", { e: c.entity.replace(/^[a-z_]+\./, "") }) + " · " : ""}${ctx.t("kl. {from}–{to}", { from: String(c.from ?? 0).padStart(2, "0"), to: String(c.to ?? 0).padStart(2, "0") })}`
    : ctx.t("Altid");
function qaIconFor(id, name = "") {
  const n = `${id} ${name}`.toLowerCase();
  if (/kom|hjem|arrive/.test(n)) return "homein";
  if (/gå|gaa|går|leav|ud\b|away/.test(n)) return "homeout";
  if (/morgen|morning/.test(n)) return "sunrise";
  if (/nat|night|godnat|sleep/.test(n)) return "moon";
  if (/kaffe|coffee/.test(n)) return "coffee";
  if (/opvask|dish/.test(n)) return "dish";
  if (/gardin|curtain|cover|blind/.test(n)) return "curtain";
  if (/mad|food|dinner/.test(n)) return "food";
  if (/alarm/.test(n)) return "shieldf";
  if (/^light\.|lys/.test(n)) return "bulb";
  if (/^switch\.|strøm|power/.test(n)) return "bolt";
  return "star";
}
function qaSuggestions(ctx) {
  const used = new Set((ctx.data.quick || []).map((q) => q.entity));
  return [...ctx.entities("script"), ...ctx.entities("scene"), ...ctx.entities("input_button")].filter((id) => !used.has(id) && !ctx.hass.entities?.[id]?.hidden).slice(0, 10);
}
function qaSection(ctx) {
  const list = ctx.data.quick || [];
  const ppl = ctx.members();
  const sug = qaSuggestions(ctx);
  return `<section class="card" data-st="qa"><div class="card-head"><h2>${esc(ctx.t("Quick actions"))}</h2><button class="btn sm" data-act="set-qa-new">${svg("plus")}${esc(ctx.t("Ny"))}</button></div>
    ${sub(ctx.t("Hver knap kører en entitet i Home Assistant. Vælg betingelser for, hvornår den vises, og hvem der ser den."))}
    <div class="qal">${list
      .map((q) => `<div class="qar" style="--qc:${esc(q.color)}"><span class="qa-ic sm">${svg(q.icon)}</span><div class="qar-t"><b>${esc(q.label)}</b><small>${esc(q.entity)}</small><span class="cond${q.cond?.kind === "always" || !q.cond?.kind ? "" : " timed"}">${svg(q.cond?.kind === "always" || !q.cond?.kind ? "check" : "clock")}${esc(condText(ctx, q.cond))}</span></div>
        <div class="qar-who" aria-label="${esc(ctx.t("Vises for"))}">${ppl.map((pp) => `<button class="whob${(q.who || []).includes(pp.id) ? " on" : ""}" data-act="set-qa-who" data-id="${esc(q.id)}" data-p="${esc(pp.id)}" aria-pressed="${(q.who || []).includes(pp.id)}" title="${esc(pp.name)}" style="--pc:${esc(pp.color)}">${ctx.avatar(pp.id, "sm")}</button>`).join("")}</div>
        <button class="iconbtn" data-act="set-qa-edit" data-id="${esc(q.id)}" aria-label="${esc(ctx.t("Ret {name}", { name: q.label }))}">${svg("edit")}</button></div>`)
      .join("")}</div>
    ${!list.length ? `<p class="t-sub">${esc(ctx.t("Ingen knapper endnu. Tryk Ny, eller vælg en af jeres rutiner herunder."))}</p>` : ""}
    ${sug.length ? `<div class="sugg"><span class="eyebrow">${esc(ctx.t("Fra jeres Home Assistant"))}</span><div class="sugg-row">${sug
      .map((id, i) => `<button class="chip sg" data-act="set-qa-add" data-id="${esc(id)}" style="--qc:${QA_COLORS[i % QA_COLORS.length]}">${svg(qaIconFor(id, nameOf(ctx, id)))}${esc(nameOf(ctx, id))}<span>+</span></button>`)
      .join("")}</div></div>` : ""}</section>`;
}
function qaId(label, list) {
  const base = (slug(label).replace(/_/g, "-").slice(0, 40) || "knap").replace(/^[^a-z0-9]+/, "") || "knap";
  let id = /^[a-z0-9]/.test(base) ? base : `q${base}`;
  let n = 2;
  while (list.some((q) => q.id === id)) id = `${base.slice(0, 44)}-${n++}`;
  return id;
}
async function saveQuick(ctx, list, msg) {
  if (await ctx.save("quick", list)) {
    if (msg) ctx.toast(msg);
    ctx.render(true);
  }
}
function qaForm(ctx, q0) {
  const list = ctx.data.quick || [];
  const isNew = !q0;
  const q = q0
    ? clone(q0)
    : { id: "", label: "", icon: "star", color: QA_COLORS[list.length % QA_COLORS.length], entity: qaSuggestions(ctx)[0] || "", desc: "", cond: { kind: "always", from: 20, to: 4, entity: null }, who: ctx.parents().map((m) => m.id), option: null, countdown: 0, then: "" };
  q.cond = { kind: "always", from: 6, to: 10, entity: null, ...(q.cond || {}) };
  if (q.cond.kind === "always" && q0?.cond?.from == null) Object.assign(q.cond, { from: 6, to: 10 });
  const hrs = Array.from({ length: 24 }, (_, h) => `<option value="${h}">${String(h).padStart(2, "0")}.00</option>`).join("");
  const conds = ctx.entities("binary_sensor").concat(ctx.entities("input_boolean"), ctx.entities("schedule"));
  const entOpts = () => {
    const groups = QA_DOMAINS.map((d) => [d, ctx.entities(d)]).filter(([, ids]) => ids.length);
    const known = groups.some(([, ids]) => ids.includes(q.entity));
    const opt = (id) => `<option value="${esc(id)}"${id === q.entity ? " selected" : ""} title="${esc(nameOf(ctx, id))}">${esc(id)}</option>`;
    return (q.entity && !known ? opt(q.entity) : "") + groups.map(([d, ids]) => `<optgroup label="${esc(d)}">${ids.map(opt).join("")}</optgroup>`).join("");
  };
  const s = ctx.sheet(`<h2>${esc(isNew ? ctx.t("Ny quick action") : ctx.t("Rediger {name}", { name: q.label }))}</h2><form id="qf2" class="set-qf">
    <div class="row"><div class="field"><label for="q-l">${esc(ctx.t("Navn"))}</label><input id="q-l" required maxlength="30" value="${esc(q.label)}" placeholder="${esc(ctx.t("Fx Film"))}"></div>
      <div class="field"><label for="q-e">${esc(ctx.t("Entitet"))}</label><select id="q-e">${entOpts()}</select></div></div>
    <div class="field"><span class="lbl">${esc(ctx.t("Ikon"))}</span><div class="iconpick" id="q-i">${QA_ICONS.map((ic) => `<button type="button" data-i="${ic}" aria-pressed="${ic === q.icon}" aria-label="${ic}">${svg(ic)}</button>`).join("")}</div></div>
    <div class="field"><label for="q-d">${esc(ctx.t("Bekræftelse"))}</label><input id="q-d" maxlength="200" value="${esc(q.desc)}" placeholder="${esc(ctx.t("Det, der står, før den køres"))}"></div>
    <div class="field"><span class="lbl">${esc(ctx.t("Vis"))}</span><div class="seg" id="q-c"><button type="button" data-c="always" aria-pressed="${q.cond.kind === "always"}">${esc(ctx.t("Altid"))}</button><button type="button" data-c="time" aria-pressed="${q.cond.kind === "time"}">${esc(ctx.t("Tidsrum"))}</button><button type="button" data-c="entity" aria-pressed="${q.cond.kind === "entity"}">${esc(ctx.t("Når en entitet er tændt"))}</button></div></div>
    <div class="row" id="q-win"${q.cond.kind === "always" ? " hidden" : ""}><div class="field" id="q-ent-f"${q.cond.kind === "entity" ? "" : " hidden"}><label for="q-ent">${esc(ctx.t("Entitet"))}</label><input id="q-ent" list="q-ents" value="${esc(q.cond.entity || "binary_sensor.")}"><datalist id="q-ents">${conds.map((id) => `<option value="${esc(id)}">${esc(nameOf(ctx, id))}</option>`).join("")}</datalist></div><div class="field"><label for="q-f">${esc(ctx.t("Fra"))}</label><select id="q-f">${hrs}</select></div><div class="field"><label for="q-t">${esc(ctx.t("Til"))}</label><select id="q-t">${hrs}</select></div></div>
    <div class="field"><span class="lbl">${esc(ctx.t("Vises for"))}</span><div class="filters" id="q-w">${ctx.members().map((pp) => `<button type="button" class="fchip" data-w="${esc(pp.id)}" aria-pressed="${(q.who || []).includes(pp.id)}" style="--fc:${esc(pp.color)}">${ctx.avatar(pp.id)}${esc(pp.name)}</button>`).join("")}</div></div>
    <details class="set-qmore"${q.option || q.countdown || q.then ? " open" : ""}><summary>${esc(ctx.t("Mere: spørgsmål, nedtælling og alarm"))}</summary>
      <div class="row"><div class="field"><label for="q-ol">${esc(ctx.t("Spørg først"))}</label><input id="q-ol" maxlength="40" value="${esc(q.option?.label || "")}" placeholder="${esc(ctx.t("Fx Start støvsugning"))}"></div>
        <div class="field"><label for="q-ov">${esc(ctx.t("Sendes til rutinen som"))}</label><input id="q-ov" maxlength="40" value="${esc(q.option?.variable || "")}" placeholder="run_vacuum"></div></div>
      <div class="row"><div class="field"><label for="q-cd">${esc(ctx.t("Nedtælling"))}</label><select id="q-cd">${[0, 30, 60, 120, 300, 600].map((v) => `<option value="${v}" ${Number(q.countdown || 0) === v ? "selected" : ""}>${esc(v ? (v < 60 ? ctx.t("{n} sek.", { n: v }) : ctx.t("{n} min.", { n: v / 60 })) : ctx.t("Ingen"))}</option>`).join("")}</select></div>
        <div class="field"><label for="q-th">${esc(ctx.t("Bagefter"))}</label><select id="q-th">${QA_THEN.map(([v, n]) => `<option value="${v}" ${(q.then || "") === v ? "selected" : ""}>${esc(ctx.t(n))}</option>`).join("")}</select></div></div></details>
    <div class="sheet-actions">${isNew ? "" : `<button type="button" class="btn danger" id="q-del" style="margin-right:auto">${svg("trash")}${esc(ctx.t("Fjern"))}</button>`}<button type="button" class="btn soft" data-close>${esc(ctx.t("Annuller"))}</button><button class="btn" type="submit">${esc(ctx.t("Gem"))}</button></div></form>`);
  const el = s.el;
  el.querySelector("#q-f").value = q.cond.from ?? 6;
  el.querySelector("#q-t").value = q.cond.to ?? 10;
  let icon = q.icon || "star", kind = q.cond.kind;
  const color = q.color;
  el.querySelector("#q-e").addEventListener("change", (e) => {
    const v = e.target.value;
    if (!v) return;
    q.entity = v;
    const l = el.querySelector("#q-l");
    if (!l.value.trim()) l.value = nameOf(ctx, v).slice(0, 30);
    if (!q0) {
      icon = qaIconFor(v, nameOf(ctx, v));
      el.querySelectorAll("#q-i button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.i === icon)));
    }
  });
  el.querySelector("#q-i").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (!b) return;
    icon = b.dataset.i;
    el.querySelectorAll("#q-i button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });
  el.querySelector("#q-c").addEventListener("click", (e) => {
    const b = e.target.closest("[data-c]");
    if (!b) return;
    kind = b.dataset.c;
    el.querySelectorAll("#q-c button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    el.querySelector("#q-win").hidden = kind === "always";
    el.querySelector("#q-ent-f").hidden = kind !== "entity";
  });
  el.querySelector("#q-w").addEventListener("click", (e) => {
    const b = e.target.closest("[data-w]");
    if (b) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
  });
  el.querySelector("#q-del")?.addEventListener("click", () => {
    s.close();
    saveQuick(ctx, list.filter((x) => x.id !== q.id), ctx.t("{name} er fjernet", { name: q.label }));
  });
  el.querySelector("#qf2").addEventListener("submit", (e) => {
    e.preventDefault();
    const label = el.querySelector("#q-l").value.trim().slice(0, 30);
    if (!label) return el.querySelector("#q-l").focus();
    if (!q.entity || !ctx.hass.states[q.entity]) return ctx.toast(ctx.t("Vælg den entitet, knappen skal køre"));
    const cEnt = el.querySelector("#q-ent").value.trim();
    if (kind === "entity" && !/^[a-z_]+\.[a-z0-9_]+$/.test(cEnt)) return el.querySelector("#q-ent").focus();
    const ol = el.querySelector("#q-ol").value.trim();
    const ov = el.querySelector("#q-ov").value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40);
    const nq = {
      ...q,
      id: q.id || qaId(label, list),
      label,
      icon,
      color,
      desc: el.querySelector("#q-d").value.trim().slice(0, 200) || ctx.t("Kører {e}", { e: q.entity }),
      cond: kind === "always" ? { kind } : { kind, from: +el.querySelector("#q-f").value, to: +el.querySelector("#q-t").value, entity: kind === "entity" ? cEnt : null },
      who: [...el.querySelectorAll("#q-w [aria-pressed=true]")].map((b) => b.dataset.w),
      option: ol && ov ? { label: ol, variable: ov } : null,
      countdown: +el.querySelector("#q-cd").value,
      then: el.querySelector("#q-th").value,
    };
    const next = [...list];
    const k = next.findIndex((x) => x.id === q.id && q.id);
    if (k >= 0) next[k] = nq;
    else next.push(nq);
    s.close();
    saveQuick(ctx, next, ctx.t("{name} er gemt", { name: nq.label }));
  });
}

/* Alarm: the modes the alarm has, which of them Hverdagsro shows, and who may arm and disarm. */
function alarmSection(ctx) {
  const s = ctx.data.settings;
  const id = s.alarm;
  const st = id && ctx.hass.states[id];
  const sup = Number(st?.attributes?.supported_features ?? 63);
  const r = { code_arm: false, kids_arm: true, kids_disarm: false, modes: [], ...(s.alarm_rights || {}) };
  const supported = AL_MODES.filter((m) => sup & m[5]).map((m) => m[0]);
  const shown = r.modes.length ? r.modes.filter((m) => supported.includes(m)) : supported;
  const names = AL_MODES.filter((m) => supported.includes(m[0])).map((m) => ctx.t(m[1]));
  const an = st?.attributes?.friendly_name || ctx.t("alarmen");
  const have = names.length > 1 ? `${names.slice(0, -1).join(", ")} ${ctx.t("og")} ${names[names.length - 1]}` : names[0] || "";
  if (!id) return `<section class="card" data-st="alarm"><div class="card-head"><h2>${esc(ctx.t("Alarm"))}</h2></div><p class="t-sub">${esc(ctx.t("Vælg jeres alarm under Hjemmet, fx Alarmo."))} <button class="lnk" data-act="set-tab" data-id="hjemmet">${esc(ctx.t("Hjemmet"))}</button></p></section>`;
  return `<section class="card" data-st="alarm"><div class="card-head"><h2>${esc(ctx.t("Alarm"))}</h2><span class="meta">${esc(id)}</span></div>
    <div class="t-sub" style="margin:-4px 0 8px">${esc(ctx.t("Tilkoblinger, der vises"))}</div>
    <div class="al-pick">${AL_MODES.map(([m, n, ic, c, d, bit]) => {
      const ok = sup & bit;
      return `<button class="al-pk" data-act="set-almode" data-id="${m}" aria-pressed="${!!ok && shown.includes(m)}" ${ok ? "" : "disabled"} style="--mc:${c}">${svg(ic)}<span><b>${esc(ctx.t(n))}</b><small>${esc(ok ? ctx.t(d) : ctx.t("Slået fra i {alarm}", { alarm: an }))}</small></span></button>`;
    }).join("")}</div>
    <p class="t-sub" style="margin:8px 0 14px">${esc(ctx.t("Hverdagsro læser fra {alarm}, hvilke tilkoblinger der findes. I har {list}.", { alarm: an, list: have }))}</p>
    <div class="mods" style="grid-template-columns:minmax(0,1fr) 64px">${[["code_arm", "Kræv kode ved tilkobling"], ["kids_arm", "Børn må tilkoble"], ["kids_disarm", "Børn må frakoble"]].map(([k, n]) => `<span>${esc(ctx.t(n))}</span><button class="toggle" data-act="set-alset" data-id="${k}" aria-pressed="${!!r[k]}" aria-label="${esc(ctx.t(n))}"></button>`).join("")}<span>${esc(ctx.t("Kræv kode ved frakobling"))}</span><span class="lock" style="justify-self:center">${svg("lock")}${esc(ctx.t("Altid"))}</span></div>
    <p class="t-sub" style="margin-top:12px">${esc(ctx.t("Koderne er brugernes egne koder i {alarm}. Hverdagsro sender koden videre, og {alarm} afgør, om den er rigtig.", { alarm: an }))}</p></section>`;
}

function rightsSection(ctx) {
  return `<section class="card" data-st="ret"><div class="card-head"><h2>${esc(ctx.t("Rettigheder"))}</h2>${lockTag(ctx)}</div>
    <div class="rights"><span class="h">${esc(ctx.t("Kan"))}</span><span class="h">${esc(ctx.t("Forælder"))}</span><span class="h">${esc(ctx.t("Barn"))}</span>${RIGHTS.map(([t, a, b]) => `<span>${esc(ctx.t(t))}</span><span class="${a ? "y" : "n"}">${svg(a ? "check" : "x")}</span><span class="${b ? "y" : "n"}">${svg(b ? "check" : "x")}</span>`).join("")}</div>
    <p class="t-sub" style="margin-top:12px">${esc(ctx.t("Forældre er dem, der er sat som forælder under Familien. Administratorer i Home Assistant, der ikke er med i familien, kan også ændre alt. En bruger uden familiemedlem, fx en fælles skærm i køkkenet, kan vælge et af børnene."))}</p></section>`;
}

/* The home's basics and about Hverdagsro (what the prototype didn't need). */
function basicsSection(ctx) {
  const s = ctx.data.settings;
  const v = ctx.config?.version || "";
  return `<section class="card set-basics"><div class="card-head"><h2>${esc(ctx.t("Hjemmets navn og sprog"))}</h2></div>
      <div class="row"><div class="field"><label for="set-hn">${esc(ctx.t("Hjemmets navn"))}</label><input id="set-hn" value="${esc(s.home_name || "")}" maxlength="40" data-in="set-s" data-k="home_name" placeholder="${esc(ctx.t("Fx Hjemme hos os"))}"></div>
      <div class="field"><label for="set-mr">${esc(ctx.t("Opgaverne starter forfra kl."))}</label><input id="set-mr" type="time" value="${esc((s.mission_reset || "00:00").replace(".", ":"))}" data-in="set-s" data-k="mission_reset"></div></div>
      <div class="field"><span class="lbl">${esc(ctx.t("Sprog"))}</span><div class="seg" role="group">${[["auto", "Som Home Assistant"], ["da", "Dansk"], ["en", "English"]].map(([k, n]) => `<button data-act="set-lang" data-v="${k}" aria-pressed="${(s.language || "auto") === k}">${esc(k === "en" ? n : ctx.t(n))}</button>`).join("")}</div></div></section>
    <section class="card set-about"><div class="card-head"><h2>${esc(ctx.t("Om Hverdagsro"))}</h2>${v ? `<span class="meta">${esc(ctx.t("Version {v}", { v }))}</span>` : ""}</div>
      <p class="t-sub" style="margin:-6px 0 12px">${esc(ctx.t("Panelets navn, ikon og om det kun er for administratorer ændres under Indstillinger → Enheder og tjenester → Hverdagsro."))}</p>
      <div class="set-about-row"><button class="btn soft" data-act="set-guide">${svg("repeat")}${esc(ctx.t("Kør guiden igen"))}</button>
        <a class="btn soft" href="https://github.com/Dinnsen/ha-hverdagsro" target="_blank" rel="noopener">${svg("link")}${esc(ctx.t("Vejledning"))}</a>
        <a class="btn soft" href="https://github.com/Dinnsen/ha-hverdagsro/issues" target="_blank" rel="noopener">${svg("bell")}${esc(ctx.t("Meld en fejl"))}</a></div></section>`;
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

/* ------------------------------------------------------------------ settings view: the prototype's pSettings */
function settingsTabs(ctx) {
  return TABS.filter(([, , mod]) => !mod || ctx.on(mod));
}
function renderSettings(ctx) {
  MODE = "set";
  G = null;
  const tabs = settingsTabs(ctx);
  const want = TAB_ALIAS[ctx.arg] || ctx.arg;
  if (want && tabs.some((t) => t[0] === want)) TAB = want;
  if (!tabs.some((t) => t[0] === TAB)) TAB = "funk";
  if (!F || !Fdirty) F = clone(ctx.data.family);
  let body = "";
  if (TAB === "funk") body = featsSection(ctx);
  else if (TAB === "born") body = kidsSection(ctx);
  else if (TAB === "osky") body = oskySection(ctx);
  else if (TAB === "musik") body = musicSection(ctx);
  else if (TAB === "pynt")
    body = `<section class="card" data-st="pynt" id="decor"><div class="card-head"><h2>${esc(ctx.t("Pynt i himlen"))}</h2><span class="meta">${esc(ctx.t("Sættes automatisk"))}</span></div>
      <p class="t-sub" style="margin:-6px 0 12px">${esc(ctx.t("Himlen pynter selv op til mærkedagene. Vælg hvilke, og hvor mange dage før og efter selve dagen der er pyntet. Tryk på øjet for at se pynten nu."))}</p>${decorEditor(ctx)}</section>`;
  else if (TAB === "qa") body = qaSection(ctx);
  else if (TAB === "alarm") body = alarmSection(ctx);
  else if (TAB === "ret") body = rightsSection(ctx);
  else if (TAB === "familie") {
    const problem = familyProblem(ctx, F);
    body = `<section class="card" data-st="familie"><div class="card-head"><h2>${esc(ctx.t("Familien"))}</h2>${lockTag(ctx)}</div>
      ${sub(ctx.t("Hvem bor her, og hvem er forælder eller barn. Kobl hver til en person i Home Assistant, så de kan logge ind og se deres egen side."))}${familyEditor(ctx)}</section>
      ${Fdirty ? `<div class="set-bar"><span>${problem ? `${svg("bell")}${esc(problem)}` : esc(ctx.t("Du har ændringer, der ikke er gemt"))}</span><button class="btn soft" data-act="set-fam-undo">${esc(ctx.t("Fortryd"))}</button><button class="btn" data-act="set-fam-save" ${problem ? "disabled" : ""}>${svg("check")}${esc(ctx.t("Gem"))}</button></div>` : ""}`;
  } else {
    const st = ctx.data.settings;
    const g = suggestions(ctx);
    const missing = ["weather", "alarm", "price", "meals_calendar"].filter((k) => !st[k] && g[k]).length + ["calendars", "todo", "media", "cameras"].filter((k) => !st[k]?.length && g[k].length).length + (!st.waste?.length && g.waste.length ? 1 : 0);
    body = `<section class="card" data-st="hjemmet"><div class="card-head"><h2>${esc(ctx.t("Hjemmet"))}</h2>${missing ? `<button class="btn sm" data-act="set-suggest">${svg("sparkle")}${esc(ctx.t("Udfyld automatisk"))}</button>` : `<span class="meta">${esc(ctx.t("Gemmes med det samme"))}</span>`}</div>
      ${sub(ctx.t("Det, Hverdagsro bruger fra Home Assistant: vejret, kalendere, lister, alarm, kameraer, elpris og affald."))}${homeEditor(ctx, true)}</section>${basicsSection(ctx)}`;
  }
  return `<div class="set-tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" data-act="set-tab" data-id="${k}" aria-pressed="${TAB === k}" aria-selected="${TAB === k}">${esc(ctx.t(n))}${k === "familie" && Fdirty ? `<i class="set-dirty"></i>` : ""}</button>`).join("")}</div>
  <div class="set-wrap${animClass(`set:${TAB}`)}" data-t="${TAB}">${body}</div><p class="foot">${esc(ctx.t("Indstillingerne gemmes i Hverdagsro i Home Assistant og gælder for hele familien."))}</p>`;
}

/* ------------------------------------------------------------------ actions */
/* Save one member's change at once, like the prototype (the rest of the family as it is). */
async function saveMember(ctx, id, patch, msg) {
  const list = cleanFamily(ctx.data.family.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  if (F && !Fdirty) F = null;
  if (await ctx.save("family", list)) {
    if (msg) ctx.toast(msg);
    ctx.render(true);
  }
}
const famIdx = (el) => Number(el.dataset.i);
function famChanged(ctx) {
  if (MODE !== "guide") Fdirty = true;
  ctx.render(true);
}
const acts = {
  "set-skhide": async (el, e, ctx) => {
    const w = el.dataset.w, hide = ctx.data.settings.skema_hide || [];
    const on = hide.some((x) => w.toLowerCase().includes(x.toLowerCase()));
    const next = on ? hide.filter((x) => !w.toLowerCase().includes(x.toLowerCase())) : [...hide, w].slice(-20);
    await ctx.save("settings", { ...ctx.data.settings, skema_hide: next });
    ctx.drop("ev:");
    ctx.render(true);
    ctx.toast(on ? ctx.t("»{w}« vises igen", { w }) : ctx.t("»{w}« skjules i skemaet", { w }));
  },
  "set-skhide-add": async (el, e, ctx) => {
    const inp = ctx.$("skh-in"), w = (inp?.value || "").trim();
    if (!w) return;
    const hide = ctx.data.settings.skema_hide || [];
    if (!hide.some((x) => x.toLowerCase() === w.toLowerCase())) await ctx.save("settings", { ...ctx.data.settings, skema_hide: [...hide, w].slice(-20) });
    ctx.drop("ev:");
    ctx.render(true);
    ctx.toast(ctx.t("»{w}« skjules i skemaet", { w }));
  },
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
    if (MODE === "guide") {
      G.modules = next;
      ctx.render(true);
      return;
    }
    ctx.render(true);
    if (await ctx.save("modules", next)) {
      ctx.panel?.requestRender?.(true);
      ctx.render(true);
    }
  },
  "set-kinst": (el, e, ctx) => {
    const m = ctx.member(el.dataset.kid);
    if (!m) return;
    saveMember(ctx, m.id, { institution: el.dataset.id }, ctx.t("{name} går i {inst}", { name: m.name, inst: ctx.t(KINST.find((i) => i[0] === el.dataset.id)?.[1] || "").toLowerCase() }));
  },
  "set-kmod": (el, e, ctx) => {
    const m = ctx.member(el.dataset.kid);
    if (!m) return;
    const f = el.dataset.mod;
    const fam2 = f === "room" ? "rooms" : f;
    if (!ctx.on(fam2) && !ctx.feature(m, f)) return ctx.toast(ctx.t("{what} er slået fra for hele familien under Funktioner", { what: ctx.t(KMODS.find((x) => x[0] === f)?.[1] || f) }));
    const v = !ctx.feature(m, f);
    el.setAttribute("aria-pressed", String(v));
    saveMember(ctx, m.id, { features: { ...KID_DEFAULTS, ...(m.features || {}), [f]: v } });
  },
  "set-kpick": (el, e, ctx) => {
    const m = ctx.member(el.dataset.id);
    const k = el.dataset.k;
    if (!m) return;
    const opts =
      k === "skema"
        ? { title: ctx.t("{name}s skoleskema", { name: m.name }), domains: ["calendar"], suggest: ctx.entities("calendar").filter((id) => /skema|aula|skole|school/i.test(id + nameOf(ctx, id)) || nameOf(ctx, id).toLowerCase().includes(m.name.toLowerCase())) }
        : { title: ctx.t("Højttaler til oplæsning for {name}", { name: m.name }), domains: ["media_player"], suggest: ctx.entities("media_player").filter((id) => nameOf(ctx, id).toLowerCase().includes(m.name.toLowerCase())) };
    openPicker(ctx, { ...opts, multi: false, value: m[k] }, (v) => saveMember(ctx, m.id, { [k]: v || null }));
  },
  "set-osky-in": (el, e, ctx) => oskyLogin(ctx, el.dataset.id),
  "set-osky-out": async (el, e, ctx) => {
    const p = ctx.member(el.dataset.id);
    try {
      await ctx.ws("osky/logout", { member: el.dataset.id });
      ctx.toast(ctx.t("{name} er logget ud af Ønskeskyen", { name: p?.name || "" }));
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
  "set-spk": (el, e, ctx) => {
    const id = el.dataset.id;
    const shown = new Set(shownSpeakers(ctx));
    if (shown.has(id)) {
      if (shown.size === 1) return;
      shown.delete(id);
    } else shown.add(id);
    const all = [...new Set([...allSpeakers(ctx), ...(ctx.data.settings.media || [])])];
    setS(ctx, { media: all.filter((x) => shown.has(x)) });
  },
  "set-qa-new": (el, e, ctx) => qaForm(ctx, null),
  "set-qa-edit": (el, e, ctx) => qaForm(ctx, (ctx.data.quick || []).find((q) => q.id === el.dataset.id)),
  "set-qa-add": (el, e, ctx) => {
    const id = el.dataset.id;
    const list = ctx.data.quick || [];
    const label = nameOf(ctx, id).slice(0, 30);
    const q = { id: qaId(label, list), label, entity: id, icon: qaIconFor(id, label), color: el.style.getPropertyValue("--qc") || QA_COLORS[list.length % QA_COLORS.length], desc: ctx.t("Kører {e}", { e: label }), cond: { kind: "always", from: 6, to: 10, entity: null }, who: ctx.parents().map((m) => m.id), option: null, countdown: 0, then: "" };
    saveQuick(ctx, [...list, q], ctx.t("{name} er tilføjet", { name: label }));
  },
  "set-qa-who": (el, e, ctx) => {
    const list = clone(ctx.data.quick || []);
    const q = list.find((x) => x.id === el.dataset.id);
    if (!q) return;
    const p = el.dataset.p;
    q.who = (q.who || []).includes(p) ? q.who.filter((w) => w !== p) : [...(q.who || []), p];
    el.classList.toggle("on", q.who.includes(p));
    el.setAttribute("aria-pressed", String(q.who.includes(p)));
    saveQuick(ctx, list);
  },
  "set-almode": (el, e, ctx) => {
    const s2 = ctx.data.settings;
    const st = s2.alarm && ctx.hass.states[s2.alarm];
    const sup = Number(st?.attributes?.supported_features ?? 63);
    const supported = AL_MODES.filter((m) => sup & m[5]).map((m) => m[0]);
    const r = { code_arm: false, kids_arm: true, kids_disarm: false, modes: [], ...(s2.alarm_rights || {}) };
    const L = r.modes.length ? r.modes.filter((m) => supported.includes(m)) : supported;
    const id = el.dataset.id;
    if (L.includes(id) && L.length === 1) return ctx.toast(ctx.t("Der skal være mindst én tilkobling"));
    const modes = L.includes(id) ? L.filter((x) => x !== id) : AL_MODES.map((m) => m[0]).filter((m) => m === id || L.includes(m));
    el.setAttribute("aria-pressed", String(modes.includes(id)));
    setS(ctx, { alarm_rights: { ...r, modes } });
  },
  "set-alset": (el, e, ctx) => {
    const r = { code_arm: false, kids_arm: true, kids_disarm: false, modes: [], ...(ctx.data.settings.alarm_rights || {}) };
    r[el.dataset.id] = !r[el.dataset.id];
    el.setAttribute("aria-pressed", String(r[el.dataset.id]));
    setS(ctx, { alarm_rights: r });
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
    days[dk] = Math.max(0, Math.min(40, cur + Number(el.dataset.d)));
    setS(ctx, { decor_days: days });
  },
  "set-dec-prev": (el, e, ctx) => {
    const p = ctx.panel;
    if (!p) return;
    clearTimeout(previewTimer);
    const id = el.dataset.id;
    const on = p._preview !== id;
    p._preview = on ? id : null;
    p._decorKey = null;
    const o = occasions(ctx.data.settings, ctx.data.family).find((x) => x[0] === id);
    // The decorations are seen best in the big sky on the front page.
    ctx.go(ctx.isKid ? "dag" : "hjem");
    ctx.toast(on ? ctx.t("Viser {name} i himlen. Tryk på pynten øverst for at stoppe", { name: ctx.t(o?.[1] || "").toLowerCase() }) : ctx.t("Viser almindelig himmel"));
    if (on)
      previewTimer = setTimeout(() => {
        p._preview = null;
        p._decorKey = null;
        p._header?.();
      }, 20000);
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
  "set-bdate": (el, e, ctx) => {
    if (e.type !== "change" || !el.value) return;
    const m = ctx.member(el.dataset.id);
    if (m) saveMember(ctx, m.id, { birthday: el.value }, ctx.t("{name}s fødselsdag er gemt", { name: m.name }));
  },
  "set-pet-name": (el, e, ctx) => {
    if (e.type !== "change") return;
    const m = ctx.member(el.dataset.id);
    if (!m) return;
    const name = el.value.trim().slice(0, 20);
    saveMember(ctx, m.id, { pet: name ? { name, kind: m.pet?.kind || "hund" } : null });
  },
  "set-pet-kind": (el, e, ctx) => {
    if (e.type !== "change") return;
    const m = ctx.member(el.dataset.id);
    if (!m) return;
    saveMember(ctx, m.id, { pet: { name: m.pet?.name || m.name, kind: el.value } });
  },
  "set-osky-to": (el, e, ctx) => {
    if (e.type !== "change") return;
    const l = (ctx.data.osky?.lists || []).find((x) => x.id === el.dataset.id);
    const to = { ...(ctx.data.settings.osky_to || {}), [el.dataset.id]: el.value };
    setS(ctx, { osky_to: to });
    const who = oskyTargets(ctx).find((x) => x[0] === el.value)?.[1];
    if (l) ctx.toast(el.value === "skjul" ? ctx.t("{list} vises ikke", { list: l.title }) : ctx.t("{list} vises nu for {who}", { list: l.title, who }));
  },
  "set-anniv": (el, e, ctx) => {
    if (e.type !== "change") return;
    setS(ctx, { anniversaries: { ...(ctx.data.settings.anniversaries || {}), [el.dataset.k]: el.value || null } });
  },
};

/* ------------------------------------------------------------------ styles */
const css = `
.skh { margin-top: 14px; padding: 12px; border-radius: 16px; background: var(--surface-2); display: grid; gap: 6px; }
.skh-chips { display: flex; gap: 6px; flex-wrap: wrap; } .skh-chips button { border: 0; border-radius: 999px; padding: 6px 11px; font: inherit; font-size: 12.5px; font-weight: 700; background: var(--surface); color: var(--ink); cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
.skh-chips button[aria-pressed="true"] { background: var(--ink); color: var(--bg); text-decoration: line-through; } .skh-chips .ic { width: 14px; height: 14px; }
.skh-add { display: flex; gap: 6px; } .skh-add input { flex: 1; min-width: 0; border: 1.5px solid var(--line); border-radius: 12px; padding: 7px 10px; font: inherit; background: var(--surface); color: var(--ink); }

.set-p { font-size: 13px; color: var(--muted); line-height: 1.5; margin: 10px 0 0; }
.set-lead { font-size: 15px; color: var(--muted); line-height: 1.5; margin: 0 0 18px; max-width: 70ch; }
.set-page { max-width: 1100px; margin: 0 auto; }
.set-tabs2 button { display: inline-flex; align-items: center; gap: 7px; position: relative; cursor: pointer; }
.set-tabs2 button .ic { width: 16px; height: 16px; }
.set-dirty { width: 8px; height: 8px; border-radius: 50%; background: var(--coral); display: inline-block; }
.set-wrap[data-t="familie"] > [data-st="familie"], .set-wrap[data-t="hjemmet"] > [data-st="hjemmet"] { display: block; }
.set-wrap.set-anim > .card { animation: hvin .35s cubic-bezier(.2,.9,.3,1) both; }
.set-wrap > .card + .card, .set-wrap > .card + .set-bar { margin-top: 14px; }
.set-tabs .set-dirty { margin-left: 6px; }
.set-kl { grid-template-columns: 36px minmax(0, 1fr) auto; }
.set-kl .btn { white-space: nowrap; }
.set-pet { grid-template-columns: 36px minmax(0, 1fr); }
.set-pet-in { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px; }
.set-pet-in input, .set-pet-in select { border: 1.5px solid var(--line); background: var(--surface); border-radius: 10px; padding: 6px 8px; color: var(--ink); font: inherit; min-width: 0; }
.set-qmore { margin-top: 14px; border-top: 1px solid var(--line); padding-top: 10px; }
.set-qmore summary { cursor: pointer; font-size: 12px; font-weight: 700; color: var(--muted); letter-spacing: .5px; text-transform: uppercase; }
.set-basics .row > .field { flex: 1 1 200px; }
.lnk { border: 0; background: none; color: var(--violet); font-weight: 700; padding: 0; cursor: pointer; font: inherit; text-decoration: underline; }
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
  "Skjul i skoleskemaet": "Hide in the timetable", "Tryk på det, der ikke skal vises på skemaet, i kalenderen og på børnenes sider. Fx »Pædagog i skolen«.": "Tap what shouldn't show on the timetable, in the calendar and on the children's pages. E.g. »Pædagog i skolen«.",
  "Ingen timer i skemaet i denne uge": "No lessons this week", "Eller skriv et ord, fx Pædagog": "Or type a word, e.g. Pædagog", Skjul: "Hide", "»{w}« vises igen": "»{w}« shows again", "»{w}« skjules i skemaet": "»{w}« is hidden in the timetable",
  "og": "and",
  "I": "you",
  "{n} færre dage": "{n} fewer days",
  "{n} flere dage": "{n} more days",
  "Siden {y}": "Since {y}",
  "Skriv datoen, så pynter himlen på dagen": "Enter the date and the sky decorates on the day",
  "næste store: {n} år, {name}, {date}": "next big one: {n} years, {name}, {date}",
  "Funktioner": "Features",
  "Slå det fra, I ikke bruger. Det forsvinder for hele familien. Pr. barn styres det under Børn.": "Turn off what you don't use. It disappears for the whole family. Per child it's set under Children.",
  "Ikke sat endnu": "Not set yet",
  "{name}s fødselsdag": "{name}'s birthday",
  "Mit dyr": "My pet",
  "Bliver gladere, når dagens missioner er klaret": "Gets happier when today's missions are done",
  "Dyrets navn": "Pet's name",
  "Slags": "Kind",
  "Skoleskema": "School timetable",
  "Vælg kalenderen med skemaet, fx fra Aula": "Choose the calendar with the timetable, e.g. from Aula",
  "Oplæsning": "Read aloud",
  "Vælg højttaleren på værelset": "Choose the speaker in the room",
  "Børnene": "The children",
  "{what} for {name}": "{what} for {name}",
  "Der er ingen børn i familien endnu.": "There are no children in the family yet.",
  "Tilføj under Familien": "Add under Family",
  "Institutionen bestemmer, hvad barnet ser: skoleskema kun i skole, ellers dagens aflevering og afhentning fra Hent og bring.": "The institution decides what the child sees: the timetable only at school, otherwise today's drop-off and pick-up from Pick-up and drop-off.",
  "Venner og familie": "Friends and family",
  "Vis ikke": "Don't show",
  "Ønskeskyen": "Ønskeskyen",
  "{n} ønskesedler": "{n} wish lists",
  "Hver forælder logger ind med sin egen konto. Så ser Hverdagsro de ønskesedler, I selv har, og dem der er delt med jer.": "Each parent signs in with their own account. Hverdagsro then sees your own wish lists and those shared with you.",
  "Kunne ikke hente: {e}": "Couldn't fetch: {e}",
  "Logget ind som {name} · hentet {when}": "Signed in as {name} · fetched {when}",
  "Ikke logget ind": "Not signed in",
  "Log ud": "Sign out",
  "Log ind": "Sign in",
  "Hvis ønsker er det?": "Whose wishes are these?",
  "{n} ønsker": "{n} wishes",
  "via {names}": "via {names}",
  "Hvis ønsker er {name}": "Whose wishes {name} is",
  "Ønskesedler til børnene vises på deres side under Ønsker. Jeres egne og fælles står under Lister. Venner og familie samles under Lister som gaveidéer.": "Children's wish lists show on their page under Wishes. Your own and shared ones are under Lists. Friends and family are gathered under Lists as gift ideas.",
  "Log ind som {name}": "Sign in as {name}",
  "E-mail": "Email",
  "navn@eksempel.dk": "name@example.com",
  "Adgangskode": "Password",
  "Hverdagsro logger ind ligesom Ønskeskyen på nettet og gemmer kun nøglen i Home Assistant, ikke adgangskoden. Facebook- og Apple-login kræver, at du først sætter en adgangskode i Ønskeskyen.": "Hverdagsro signs in like Ønskeskyen on the web and keeps only the key in Home Assistant, not the password. Facebook and Apple sign-in require that you first set a password in Ønskeskyen.",
  "{name} er logget ind i Ønskeskyen": "{name} is signed in to Ønskeskyen",
  "Højttalere på Musik": "Speakers in Music",
  "{n} af {m}": "{n} of {m}",
  "Home Assistant har ingen højttalere endnu.": "Home Assistant has no speakers yet.",
  "Når {e} er tændt": "When {e} is on",
  "kl. {from}–{to}": "{from}–{to}",
  "Altid": "Always",
  "Quick actions": "Quick actions",
  "Ny": "New",
  "Hver knap kører en entitet i Home Assistant. Vælg betingelser for, hvornår den vises, og hvem der ser den.": "Each button runs an entity in Home Assistant. Choose when it shows and who sees it.",
  "Vises for": "Shown for",
  "Ret {name}": "Edit {name}",
  "Ingen knapper endnu. Tryk Ny, eller vælg en af jeres rutiner herunder.": "No buttons yet. Tap New, or pick one of your routines below.",
  "Fra jeres Home Assistant": "From your Home Assistant",
  "Ny quick action": "New quick action",
  "Rediger {name}": "Edit {name}",
  "Fx Film": "E.g. Movie",
  "Entitet": "Entity",
  "Ikon": "Icon",
  "Bekræftelse": "Confirmation",
  "Det, der står, før den køres": "What it says before it runs",
  "Vis": "Show",
  "Tidsrum": "Time window",
  "Når en entitet er tændt": "When an entity is on",
  "Fra": "From",
  "Til": "To",
  "Mere: spørgsmål, nedtælling og alarm": "More: question, countdown and alarm",
  "Spørg først": "Ask first",
  "Fx Start støvsugning": "E.g. Start vacuuming",
  "Sendes til rutinen som": "Sent to the routine as",
  "Nedtælling": "Countdown",
  "{n} sek.": "{n} s",
  "{n} min.": "{n} min",
  "Bagefter": "Afterwards",
  "{name} er fjernet": "{name} was removed",
  "Vælg den entitet, knappen skal køre": "Choose the entity the button should run",
  "Kører {e}": "Runs {e}",
  "{name} er gemt": "{name} was saved",
  "alarmen": "the alarm",
  "Vælg jeres alarm under Hjemmet, fx Alarmo.": "Choose your alarm under Home, e.g. Alarmo.",
  "Tilkoblinger, der vises": "Arming modes shown",
  "Slået fra i {alarm}": "Turned off in {alarm}",
  "Hverdagsro læser fra {alarm}, hvilke tilkoblinger der findes. I har {list}.": "Hverdagsro reads from {alarm} which arming modes exist. You have {list}.",
  "Kræv kode ved frakobling": "Require a code to disarm",
  "Koderne er brugernes egne koder i {alarm}. Hverdagsro sender koden videre, og {alarm} afgør, om den er rigtig.": "The codes are the users' own codes in {alarm}. Hverdagsro passes the code on, and {alarm} decides whether it is right.",
  "Rettigheder": "Permissions",
  "Hjemmets navn og sprog": "Home name and language",
  "Det, Hverdagsro bruger fra Home Assistant: vejret, kalendere, lister, alarm, kameraer, elpris og affald.": "What Hverdagsro uses from Home Assistant: weather, calendars, lists, alarm, cameras, electricity price and waste.",
  "{name} går i {inst}": "{name} goes to {inst}",
  "{what} er slået fra for hele familien under Funktioner": "{what} is turned off for the whole family under Features",
  "{name}s skoleskema": "{name}'s timetable",
  "Højttaler til oplæsning for {name}": "Read-aloud speaker for {name}",
  "{name} er logget ud af Ønskeskyen": "{name} is signed out of Ønskeskyen",
  "{name} er tilføjet": "{name} was added",
  "Der skal være mindst én tilkobling": "There must be at least one arming mode",
  "Viser {name} i himlen. Tryk på pynten øverst for at stoppe": "Showing {name} in the sky. Tap the decoration at the top to stop",
  "Viser almindelig himmel": "Showing the normal sky",
  "{name}s fødselsdag er gemt": "{name}'s birthday was saved",
  "{list} vises ikke": "{list} is hidden",
  "{list} vises nu for {who}": "{list} now shows for {who}",
  "Missioner": "Missions",
  "Børnene får egne opgaver, de selv krydser af, og perfekte dage": "The children get their own tasks to tick off, and perfect days",
  "Point for missioner og rutiner, som kan bruges i shoppen": "Points for missions and routines to spend in the shop",
  "Rutinetavle": "Routine board",
  "Visuel tavle for børn, der har brug for faste rutiner": "Visual board for children who need fixed routines",
  "Værelser": "Rooms",
  "Børnenes værelser med lys og scener fra HA": "The children's rooms with lights and scenes from HA",
  "Alle højttalere, grupper og Spotify": "All speakers, groups and Spotify",
  "Hvidevarer, robotter og ventilation": "Appliances, robots and ventilation",
  "Kameraer, døre, vinduer, porte og låse": "Cameras, doors, windows, gates and locks",
  "Himlen pynter op til jul, påske, fødselsdage og andre mærkedage": "The sky decorates for Christmas, Easter, birthdays and other occasions",
  "Kæledyr": "Pet",
  "Et lille dyr, der bliver gladere, når missionerne er klaret": "A little pet that gets happier when missions are done",
  "Ønsker": "Wishes",
  "Ønskesedler fra Ønskeskyen": "Wish lists from Ønskeskyen",
  "Aulas skema på børnenes sider": "Aula's timetable on the children's pages",
  "Læs dagen og beskeder op for børnene": "Read the day and messages aloud to the children",
  "Middagsros madplan, aftensmad og budget": "Middagsro meal plan, dinner and budget",
  "El og biler": "Power and cars",
  "Elpris og bilerne fra EV Planner under himlen": "Electricity price and the cars from EV Planner under the sky",
  "Alarmo med kode": "Alarmo with code",
  "Tømningsdage": "Collection days",
  "Skraldespande i himlen og påmindelse aftenen før": "Bins in the sky and a reminder the evening before",
  "Rutiner og genveje på forsiden": "Routines and shortcuts on the front page",
  "Mit værelse": "My room",
  "Ønskeseddel": "Wish list",
  "Hund": "Dog",
  "Kat": "Cat",
  "Lille drage": "Little dragon",
  "Skal-sikring, I er hjemme": "Perimeter, you're home",
  "Ude": "Away",
  "Hele huset, ingen hjemme": "Whole house, nobody home",
  "Nat": "Night",
  "Skal-sikring og nedenunder": "Perimeter and downstairs",
  "Ferie": "Vacation",
  "Som ude, mens I er væk længe": "Like away, while you're gone for long",
  "Egen": "Custom",
  "Egne sensorer": "Own sensors",
  "Se hele familiens kalender og opgaver": "See the whole family's calendar and tasks",
  "Oprette aftaler for andre": "Create events for others",
  "Oprette og slette lister": "Create and delete lists",
  "Godkende køb i shoppen": "Approve purchases in the shop",
  "Sætte priser og belønninger": "Set prices and rewards",
  "Slå moduler til og fra pr. barn": "Turn modules on and off per child",
  "Ændre +-menu, beskeder og PIN": "Change the + menu, messages and PIN",
  "Krydse egne missioner af": "Tick off own missions",
  "Købe i shoppen (venter på godkendelse)": "Buy in the shop (awaits approval)",
  "Intet": "Nothing",
  "Frakobl alarmen": "Disarm the alarm",
  "Tilkobl · hjemme": "Arm · home",
  "Tilkobl · ude": "Arm · away",
  "Tilkobl · nat": "Arm · night",
  "Tilkobl · ferie": "Arm · vacation",
  "Offentlig": "Public",
  "Privat": "Private",
  "Skjult": "Hidden",
  "Delt": "Shared",
  "Venner": "Friends",
  "24.–26. december": "24–26 December",
  "31. december–1. januar": "31 December–1 January",
  "Søndag 7 uger før påske": "Sunday 7 weeks before Easter",
  "Skærtorsdag–2. påskedag": "Maundy Thursday–Easter Monday",
  "31. oktober": "31 October",
  "Alle i husstanden · datoerne står på profilerne": "Everyone in the household · the dates are on the profiles",
  "5. juni": "5 June",
  "23. juni": "23 June",
  "14. februar": "14 February",
  "{names} som kærester": "{names} as a couple",
  "{names} · med kobber-, sølv- og guldbryllup": "{names} · with copper, silver and golden anniversaries",
  "Børn": "Children",
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
  "Annuller": "Cancel",
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
  Genveje: "Shortcuts",
  "Rutiner, scener og knapper bag +-knappen nederst til højre, fx Godnat eller Vi tager hjemmefra.": "Scripts, scenes and buttons behind the + button at the bottom right, e.g. Good night or We're leaving.",
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
