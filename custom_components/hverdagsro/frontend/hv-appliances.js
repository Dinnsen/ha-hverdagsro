/* Hverdagsro – Apparater (appliances).
   The family's appliances are ordinary Home Assistant entities: data.appliances = [{ id, entity, name, kind, controls[] }].
   The main entity gives the status (Home Connect, Miele, LG ThinQ, SmartThings, Electrolux, iRobot, Gardena, a smart plug's
   power sensor …); the linked "controls" add facts (remaining time, temperature, door, battery) and buttons
   (button.press, switch on/off, select a program). Parents add, edit, delete and reorder; the order is saved for the family. */
import { esc, slug } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import { dayAhead } from "./hv-energy.js";

export const KINDS = ["washer", "dryer", "dish", "oven", "hob", "coffee", "fridge", "freezer", "vacuum", "mower", "vent", "other"];
const KIND_NAME = { washer: "Vaskemaskine", dryer: "Tørretumbler", dish: "Opvasker", oven: "Ovn", hob: "Kogeplade", coffee: "Kaffemaskine", fridge: "Køleskab", freezer: "Fryser", vacuum: "Robotstøvsuger", mower: "Plæneklipper", vent: "Ventilation", other: "Andet apparat" };
const MAIN_DOMAINS = /^(sensor|binary_sensor|switch|vacuum|lawn_mower|fan|climate|water_heater|select|humidifier|input_boolean|button)\./;

let editing = false;
const sched = {}; // appliance id → the start time we asked for (Home Connect: start in …)

// The prototype's "kommende" list: appliance kinds Hverdagsro will learn later. Shown in Tilpas as "Kommer senere".
const APPL_FUT = [["emhaette", "Emhætte", "Bosch/Siemens via Home Connect", "hood"], ["varmepumpe", "Varmepumpe", "Fx Daikin, Nibe eller Panasonic", "heat"], ["sol", "Solceller og batteri", "Energi-dashboardet", "sun"], ["fjernvarme", "Fjernvarme", "Kamstrup Multical", "heat"], ["vand", "Vandmåler og hovedhane", "Kamstrup og lækagesensorer", "drop"], ["vindue", "Vinduespudserrobot", "Til de store glaspartier", "vacuum"], ["mop", "Robotmoppe", "Køkken og bad", "vacuum"], ["affugter", "Affugter", "Bryggers og bad", "drop"], ["luftrenser", "Luftrenser", "Pollen om foråret", "fan"], ["airfryer", "Airfryer", "Besked, når maden er klar", "food"]];

// ------------------------------------------------------------------ status
const RUN = /^(run|running|on_running|cleaning|mowing|washing|drying|rinsing|spinning|heating|cooking|baking|brewing|preheating|in_progress|inprogress|active|program_running|working|operating)$/;
const DONE = /^(finished|finish|done|complete|completed|end|ended|program_finished|programfinished)$/;
const READY = /^(ready|idle|standby|inactive|waiting|power_on|on_standby)$/;
const PAUSE = /^(pause|paused|stopped)$/;
const SCHED = /^(delayedstart|delayed_start|scheduled|delay|reserved)$/;
const DOCK = /^(docked|charging|charged)$/;
const BACK = /^(returning|return_to_base|returning_home)$/;
const ERR = /^(error|fault|actionrequired|action_required|aborting|stuck|failure)$/;

function guessKind(entity, name = "") {
  const d = entity.split(".")[0], n = `${entity} ${name}`.toLowerCase();
  if (d === "vacuum" || /støvsuger|stovsuger|roomba|vacuum|roborock|dreame/.test(n)) return "vacuum";
  if (d === "lawn_mower" || /klipper|mower|sileno|automower|landroid/.test(n)) return "mower";
  if (/tørre|torre|dryer|tumbler/.test(n)) return "dryer";
  if (/opvask|dish/.test(n)) return "dish";
  if (/vask|wash/.test(n)) return "washer";
  if (/ovn|oven|steam/.test(n)) return "oven";
  if (/plade|induktion|cooktop|hob|komfur/.test(n)) return "hob";
  if (/kaffe|coffee|espresso/.test(n)) return "coffee";
  if (/frys|freezer/.test(n)) return "freezer";
  if (/køle|kole|fridge|refrigerator/.test(n)) return "fridge";
  if (d === "fan" || /vent|emhætte|emhaette|hood|genvinding|recuperat/.test(n)) return "vent";
  return "other";
}

export function status(ctx, a) {
  const s = ctx.st(a.entity);
  if (!s || s.state === "unavailable" || s.state === "unknown") return { txt: ctx.t("Ikke forbundet"), cls: "bad", key: "offline" };
  const d = a.entity.split(".")[0];
  const v = String(s.state).toLowerCase().replace(/\s+/g, "_");
  const num = parseFloat(s.state);
  // A fridge or freezer is on unless its power switch says otherwise; the main entity is often its door.
  if (a.kind === "fridge" || a.kind === "freezer") {
    const dev = ctx.hass.entities?.[a.entity]?.device_id;
    const sibs = dev ? Object.values(ctx.hass.entities).filter((e) => e.device_id === dev).map((e) => e.entity_id) : [];
    const power = [a.entity, ...(a.controls || []), ...sibs].find((id) => /^switch\..*(power|strom|strøm)/.test(id));
    const conn = sibs.find((id) => /^binary_sensor\..*connectivity/.test(id));
    const door = [a.entity, ...sibs].find((id) => /door|dør|dor$/.test(id) && !/alarm/.test(id));
    const doorOpen = door && ["on", "open", "opened"].includes(String(ctx.st(door)?.state).toLowerCase());
    if (power && ctx.st(power)?.state === "off") return { txt: ctx.t("Slukket"), cls: "", key: "off" };
    if (conn && ctx.st(conn)?.state === "off") return { txt: ctx.t("Ikke forbundet"), cls: "bad", key: "offline" };
    if (doorOpen) return { txt: ctx.t("Døren står åben"), cls: "bad", key: "error" };
    return { txt: ctx.t("Tændt"), cls: "ok", key: "on" };
  }
  if (d === "sensor" && !Number.isNaN(num) && /^-?[\d.]+$/.test(s.state)) {
    const unit = s.attributes.unit_of_measurement || "";
    if (/^k?W$/.test(unit)) return num > (unit === "kW" ? 0.005 : 5) ? { txt: ctx.t("Kører"), cls: "run", key: "run" } : { txt: ctx.t("Slukket"), cls: "", key: "off" };
    return { txt: `${ctx.fmt.num(num, num % 1 ? 1 : 0)} ${unit}`.trim(), cls: "", key: "value" };
  }
  if (RUN.test(v)) return { txt: ctx.t("Kører"), cls: "run", key: "run" };
  if (DONE.test(v)) return { txt: ctx.t("Færdig"), cls: "ok", key: "done" };
  if (SCHED.test(v)) return { txt: sched[a.id] ? ctx.t("Starter kl. {time}", { time: ctx.fmt.time(sched[a.id]) }) : ctx.t("Starter senere"), cls: "warn", key: "scheduled" };
  if (PAUSE.test(v)) return { txt: ctx.t("På pause"), cls: "warn", key: "paused" };
  if (DOCK.test(v)) return { txt: ctx.t("I ladestation"), cls: "ok", key: "docked" };
  if (BACK.test(v)) return { txt: ctx.t("Kører hjem"), cls: "run", key: "run" };
  if (ERR.test(v)) return { txt: ctx.t("Kræver opmærksomhed"), cls: "bad", key: "error" };
  if (READY.test(v)) return { txt: ctx.t("{_}Klar", { _: "" }), cls: "ok", key: "ready" };
  if (v === "on" || v === "true" || v === "heat" || v === "cool" || v === "auto") {
    const always = ["fridge", "freezer", "vent"].includes(a.kind);
    return { txt: ctx.t("Kører"), cls: always || a.kind === "coffee" ? "ok" : "run", key: always ? "on" : "run" };
  }
  // A Home Connect power switch that is off means the machine is in standby.
  if (d === "switch" && v === "off" && ctx.platform(a.entity) === "home_connect") return { txt: ctx.t("Standby"), cls: "", key: "standby" };
  if (v === "off" || v === "false" || v === "power_off") return { txt: ctx.t("Slukket"), cls: "", key: "off" };
  const shown = ctx.hass.formatEntityState ? ctx.hass.formatEntityState(s) : s.state;
  return { txt: String(shown).charAt(0).toUpperCase() + String(shown).slice(1), cls: "", key: "other" };
}

// ------------------------------------------------------------------ facts and controls from linked entities
function shortName(ctx, id, a) {
  const n = ctx.name(id);
  for (const base of [a.name, ctx.name(a.entity)].filter(Boolean)) if (n.toLowerCase().startsWith(base.toLowerCase()) && n.length > base.length) return cap(n.slice(base.length).trim());
  return n;
}
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
// Numbers like the prototype writes them: 21°, −18°, 14,2°, 100 %, 2.868.
function fmtState(ctx, s) {
  const u = s.attributes.unit_of_measurement || "", v = Number(s.state);
  if (s.state !== "" && !Number.isNaN(v) && /^-?[\d.]+$/.test(s.state)) {
    const n = ctx.fmt.num(Math.abs(v), v % 1 ? 1 : 0), sign = v < 0 ? "−" : "";
    if (/^°[CF]?$/.test(u)) return `${sign}${n}°`;
    return `${sign}${n}${u ? (u === "%" ? " %" : ` ${u}`) : ""}`;
  }
  return ctx.hass.formatEntityState ? ctx.hass.formatEntityState(s) : `${s.state}${u ? " " + u : ""}`;
}

export function details(ctx, a) {
  const out = { facts: [], buttons: [], left: null, finish: null, temp: null, door: null, battery: null, progress: null, filter: false, stop: null, start: null };
  const main = ctx.st(a.entity);
  if (main) {
    const at = main.attributes;
    if (at.battery_level != null) out.battery = Number(at.battery_level);
    if (at.current_temperature != null) out.temp = Number(at.current_temperature);
    if (at.fan_speed) out.facts.push([ctx.t("Styrke"), String(at.fan_speed)]);
  }
  for (const id of a.controls || []) {
    const s = ctx.st(id);
    if (!s) continue;
    const d = id.split(".")[0], dc = s.attributes.device_class, nm = shortName(ctx, id, a), n = `${id} ${nm}`.toLowerCase();
    const bad = s.state === "unavailable" || s.state === "unknown";
    if (/filter/.test(n) && (d === "binary_sensor" || d === "sensor")) {
      // A filter that needs changing: a problem sensor that is on, or days/percent left at zero.
      const v = parseFloat(s.state);
      if (!bad) out.filter = d === "binary_sensor" ? s.state === "on" : !Number.isNaN(v) && v <= 0;
      continue;
    }
    if (d === "button" && /stop/.test(n)) out.stop = id;
    else if (d === "button" && /start/.test(n)) out.start = id;
    if (d === "button") out.buttons.push({ id, kind: "press", name: nm });
    else if (d === "switch" || d === "input_boolean") out.buttons.push({ id, kind: "switch", name: nm, on: s.state === "on" });
    else if (d === "select" || d === "input_select") out.buttons.push({ id, kind: "select", name: nm, value: s.state, options: s.attributes.options || [] });
    else if (bad) continue;
    else if ((d === "sensor" && (dc === "duration" || /^(min|h|s)$/.test(s.attributes.unit_of_measurement || ""))) || /tilbage|remaining|time_left|time left|resttid|rest_tid/.test(n)) {
      const u = s.attributes.unit_of_measurement, v = parseFloat(s.state);
      if (!Number.isNaN(v)) out.left = u === "h" ? v * 60 : u === "s" ? v / 60 : v;
      else if (/^\d{1,2}:\d{2}/.test(s.state)) {
        const [h, m] = s.state.split(":").map(Number);
        out.left = h * 60 + m;
      }
    } else if (d === "sensor" && dc === "timestamp") {
      const t = new Date(s.state);
      if (!Number.isNaN(+t) && /finish|færdig|faerdig|slut|end|done|klar/.test(n)) out.finish = t;
      else if (!Number.isNaN(+t)) out.facts.push([nm, ctx.fmt.rel(t) + " " + ctx.fmt.time(t)]);
    } else if (d === "sensor" && /progress|fremdrift|forløb/.test(n) && s.attributes.unit_of_measurement === "%") out.progress = parseFloat(s.state);
    else if (dc === "temperature" && out.temp == null) {
      out.temp = parseFloat(s.state);
      out.facts.push([nm, fmtState(ctx, s)]);
    } else if (d === "binary_sensor" && (dc === "door" || /dør|door|låge|lage/.test(n))) {
      out.door = s.state === "on";
      out.facts.push([nm, s.state === "on" ? ctx.t("Åben") : ctx.t("Lukket")]);
    } else if (dc === "battery") {
      out.battery = parseFloat(s.state);
    } else out.facts.push([nm, fmtState(ctx, s)]);
  }
  if (out.left == null && out.finish) out.left = Math.max(0, Math.round((out.finish - Date.now()) / 60000));
  if (out.battery != null && !Number.isNaN(out.battery)) out.facts.unshift([ctx.t("Batteri"), `${Math.round(out.battery)} %`]);
  return out;
}

const leftText = (ctx, m) => {
  m = Math.round(m);
  if (m <= 0) return ctx.t("Næsten færdig");
  return m >= 60 ? ctx.t("{h} t {m} min tilbage", { h: Math.floor(m / 60), m: m % 60 }) : ctx.t("{m} min tilbage", { m });
};

// ------------------------------------------------------------------ drawings
function apArt(kind, x = {}) {
  const run = !!x.run, temp = x.temp != null && !Number.isNaN(x.temp) ? Math.round(x.temp) : null;
  const R = run ? " run" : "";
  switch (kind) {
    case "washer":
    case "dryer": {
      const dry = kind === "dryer";
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true"><rect x="16" y="8" width="88" height="106" rx="8" fill="#FBFBFA" stroke="#E2E0DC"/><rect x="24" y="13" width="34" height="10" rx="3" fill="#1D2027"/>${
        run ? `<rect x="27" y="16" width="${dry ? 14 : 20}" height="4" rx="2" fill="#7FD1FF" class="ap-pulse"/>` : ""
      }<circle cx="88" cy="18" r="5" fill="#E6E4E0" stroke="#C9C6C0"/><circle cx="60" cy="68" r="34" fill="#E9E8E5"/><circle cx="60" cy="68" r="29" fill="#C9CDD3" stroke="#AEB3BA" stroke-width="3"/><circle cx="60" cy="68" r="25" fill="${dry ? "#4A4150" : "#3A4150"}"/><clipPath id="apdr-${kind}"><circle cx="60" cy="68" r="25"/></clipPath><g clip-path="url(#apdr-${kind})">${
        !dry && run ? `<path class="ap-water" d="M28,76 q8,-5 16,0 t16,0 t16,0 t16,0 v30 h-64z" fill="#5BA8F0" opacity=".55"/>` : ""
      }<g class="ap-drum" style="transform-box: view-box; transform-origin: 60px 68px"><circle cx="50" cy="62" r="7" fill="#E5484D" fill-opacity=".9"/><circle cx="68" cy="74" r="8" fill="#F2B01E" fill-opacity=".9"/><circle cx="64" cy="58" r="6" fill="#6C8CFF" fill-opacity=".9"/><circle cx="52" cy="78" r="5" fill="#3CCB83" fill-opacity=".85"/></g></g><path d="M44,56 a20,20 0 0 1 12,-10" stroke="rgba(255,255,255,.6)" stroke-width="2" fill="none"/></svg>`;
    }
    case "dish":
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true"><rect x="10" y="6" width="100" height="10" fill="#C9A77C"/><rect x="12" y="16" width="96" height="88" rx="2" fill="#F4F2EE" stroke="#E2DED7"/><rect x="40" y="22" width="40" height="3" rx="1.5" fill="#B9B4AC"/>${
        run ? `<g class="ap-steam"><path d="M48,46 q-3,-6 0,-11" stroke="#9CC9F2" stroke-width="2" fill="none"/><path d="M60,46 q3,-6 0,-11" stroke="#9CC9F2" stroke-width="2" fill="none"/><path d="M72,46 q-3,-6 0,-11" stroke="#9CC9F2" stroke-width="2" fill="none"/></g>` : ""
      }<rect x="12" y="104" width="96" height="6" fill="#D8D3CB"/><ellipse cx="60" cy="116" rx="12" ry="2.6" fill="${run ? "#3B82F6" : x.key === "scheduled" ? "#F2B01E" : "transparent"}" class="${run || x.key === "scheduled" ? "ap-pulse" : ""}"/></svg>`;
    case "oven":
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true"><rect x="10" y="12" width="100" height="96" rx="4" fill="#1C1E24"/><rect x="10" y="12" width="100" height="16" fill="#26292F"/>${
        temp != null ? `<text x="60" y="24" font-size="9" fill="${run ? "#FFB35C" : "#8A8F99"}" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800">${temp}°</text>` : ""
      }<rect x="20" y="36" width="80" height="58" rx="5" fill="#0D0F13"/>${run ? `<rect x="20" y="36" width="80" height="58" rx="5" fill="#FF8A2B" opacity=".55" class="ap-glow"/><path d="M28,90 h64" stroke="#FF5A1F" stroke-width="2.4" class="ap-glow"/>` : ""}<line x1="26" y1="70" x2="94" y2="70" stroke="#5B5F68" stroke-width="1.6"/><rect x="22" y="98" width="76" height="4" rx="2" fill="#4A4E57"/></svg>`;
    case "hob":
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true"><rect x="8" y="18" width="104" height="84" rx="6" fill="#16181D"/>${[[34, 44, 15], [86, 44, 13], [34, 78, 13], [86, 78, 15]]
        .map(([cx, cy, r], i) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${run && i % 3 === 0 ? "rgba(255,70,40,.35)" : "none"}" stroke="${run && i % 3 === 0 ? "#FF5A3C" : "#3A3E47"}" stroke-width="${run && i % 3 === 0 ? 2.2 : 1.2}" class="${run && i % 3 === 0 ? "ap-zone" : ""}"/>`)
        .join("")}</svg>`;
    case "coffee":
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true"><rect x="10" y="10" width="100" height="100" rx="4" fill="#1C1E24"/><rect x="18" y="16" width="84" height="12" rx="3" fill="${run ? "#2E4A3A" : "#2A2D34"}"/><circle cx="96" cy="22" r="2.6" fill="${run ? "#3CCB83" : "#555"}"/><rect x="40" y="34" width="40" height="70" rx="3" fill="#101216"/><rect x="52" y="34" width="16" height="10" rx="2" fill="#5B5F68"/>${
        run ? `<rect x="58.5" y="44" width="3" height="32" fill="#6B3E1F" class="ap-pour"/>` : ""
      }<path d="M48,78 h24 l-3,20 h-18z" fill="#F4F1EC"/><path d="M72,82 q8,2 0,10" stroke="#F4F1EC" stroke-width="3" fill="none"/>${
        run ? `<g class="ap-steam"><path d="M56,74 q-3,-5 0,-9" stroke="#fff" stroke-width="1.4" fill="none"/><path d="M64,74 q3,-5 0,-9" stroke="#fff" stroke-width="1.4" fill="none"/></g>` : ""
      }<rect x="38" y="100" width="44" height="4" rx="1" fill="#3A3E47"/></svg>`;
    case "fridge":
    case "freezer": {
      const fz = kind === "freezer", t = temp ?? (fz ? -18 : 4);
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true">${
        x.door ? `<rect x="28" y="4" width="64" height="112" rx="3" fill="#FFF6D6"/><path d="M28,4 l-18,8 v96 l18,8z" fill="#F4F2EE" stroke="#E2DED7"/><rect x="28" y="4" width="64" height="112" rx="3" fill="#FFE9A8" opacity=".5" class="ap-alarm"/>` : `<rect x="28" y="4" width="64" height="112" rx="3" fill="#F4F2EE" stroke="#E2DED7"/><rect x="82" y="40" width="3" height="34" rx="1.5" fill="#B9B4AC"/>`
      }<rect x="38" y="14" width="30" height="16" rx="4" fill="#1D2027"/><text x="53" y="25" font-size="8" fill="${fz ? "#7FC4FF" : "#7FE0B0"}" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800">${t}°</text>${
        fz ? `<path d="M60,58 v20 M51,63 l18,10 M51,73 l18,-10" stroke="#9CC9F2" stroke-width="1.6" stroke-linecap="round"/>` : `<g fill="#BFE6D2"><circle cx="52" cy="66" r="5"/><circle cx="62" cy="70" r="4"/></g>`
      }</svg>`;
    }
    case "vacuum":
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true">${run ? `<path d="M14,100 C30,60 60,96 80,62 S108,30 104,18" stroke="color-mix(in srgb, var(--violet) 40%, transparent)" stroke-width="3" stroke-dasharray="3 6" fill="none" class="apx-trail"/>` : ""}<g class="${run ? "apx-roam" : ""}"><circle cx="60" cy="62" r="40" fill="#34373F"/><circle cx="60" cy="62" r="24" fill="#4A4E57"/><circle cx="60" cy="34" r="3.5" fill="${run ? "#3CCB83" : "#888"}"/><g class="${run ? "apx-brush" : ""}" style="transform-box: view-box; transform-origin: 30px 88px"><path d="M30,88 l-10,-4 M30,88 l-4,10 M30,88 l9,5" stroke="#9AA3AE" stroke-width="2" stroke-linecap="round"/></g></g>${
        x.battery != null ? `<rect x="88" y="100" width="22" height="10" rx="2" fill="none" stroke="#9AA3AE"/><rect x="89.5" y="101.5" width="${Math.max(1, (19 * Math.min(100, x.battery)) / 100)}" height="7" rx="1" fill="${x.battery < 20 ? "#E5484D" : "#3CCB83"}"/>` : ""
      }</svg>`;
    case "mower":
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true"><rect x="4" y="16" width="112" height="90" rx="10" fill="#5DAA4F"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${4 + i * 16}" y="16" width="8" height="90" fill="#6BB85C" opacity=".7"/>`).join("")}<g class="${run ? "apx-mow" : ""}"><rect x="78" y="74" width="34" height="24" rx="4" fill="#3E4A3C"/><rect x="82" y="80" width="26" height="16" rx="7" fill="#E3E6E0"/><rect x="88" y="84" width="14" height="8" rx="3" fill="#F28C1B"/></g>${
        run ? "" : `<path d="M74,98 h40" stroke="#3E4A3C" stroke-width="3" stroke-linecap="round" opacity=".5"/>`
      }</svg>`;
    case "vent":
      return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true"><rect x="10" y="18" width="100" height="84" rx="8" fill="#F3F2EF" stroke="#E0DDD6"/>${[38, 82]
        .map((cx) => `<circle cx="${cx}" cy="60" r="18" fill="#E2E0DA"/><g class="${run ? "ap-fan" : ""}" style="transform-origin:${cx}px 60px">${[0, 72, 144, 216, 288].map((r) => `<path d="M${cx},60 q10,-14 2,-17 q-6,4 -2,17" fill="#9AA3AE" transform="rotate(${r} ${cx} 60)"/>`).join("")}</g><circle cx="${cx}" cy="60" r="3" fill="#6B7380"/>`)
        .join("")}${x.warn ? `<circle cx="100" cy="28" r="5" fill="#D98A12" class="ap-alarm"/>` : ""}</svg>`;
  }
  return `<svg viewBox="0 0 120 120" class="ap-svg${R}" aria-hidden="true"><rect x="22" y="22" width="76" height="76" rx="18" fill="color-mix(in srgb, var(--violet) 14%, var(--surface))"/><g transform="translate(36 36) scale(2)" fill="none" stroke="var(--violet)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/></g>${
    run ? `<circle cx="92" cy="28" r="6" fill="#3CCB83" class="ap-pulse"/>` : ""
  }</svg>`;
}

// ------------------------------------------------------------------ controls
function mainControls(ctx, a, st) {
  const d = a.entity.split(".")[0], out = [];
  const s = ctx.hass.states[a.entity];
  if (!s || st.key === "offline") return out;
  if (d === "vacuum") {
    if (st.key === "run") out.push(`<button class="ap-mini-b" data-act="ap-call" data-id="${esc(a.id)}" data-s="pause">${svg("pause")}${esc(ctx.t("Pause"))}</button><button class="ap-mini-b" data-act="ap-call" data-id="${esc(a.id)}" data-s="return_to_base">${svg("home")}${esc(ctx.t("Hjem"))}</button>`);
    else out.push(`<button class="ap-mini-b pri" data-act="ap-call" data-id="${esc(a.id)}" data-s="start">${svg("play")}${esc(ctx.t("Start"))}</button>${st.key !== "docked" ? `<button class="ap-mini-b" data-act="ap-call" data-id="${esc(a.id)}" data-s="return_to_base">${svg("home")}${esc(ctx.t("Hjem"))}</button>` : ""}`);
  } else if (d === "lawn_mower") {
    if (st.key === "run") out.push(`<button class="ap-mini-b" data-act="ap-call" data-id="${esc(a.id)}" data-s="pause">${svg("pause")}${esc(ctx.t("Pause"))}</button><button class="ap-mini-b" data-act="ap-call" data-id="${esc(a.id)}" data-s="dock">${svg("home")}${esc(ctx.t("Hjem"))}</button>`);
    else out.push(`<button class="ap-mini-b pri" data-act="ap-call" data-id="${esc(a.id)}" data-s="start_mowing">${svg("play")}${esc(ctx.t("Klip"))}</button>${st.key !== "docked" ? `<button class="ap-mini-b" data-act="ap-call" data-id="${esc(a.id)}" data-s="dock">${svg("home")}${esc(ctx.t("Hjem"))}</button>` : ""}`);
  } else if (["switch", "input_boolean", "fan", "humidifier"].includes(d)) {
    const on = s.state === "on";
    out.push(`<button class="ap-pw${on ? " on" : ""}" data-act="ap-power" data-id="${esc(a.id)}" aria-pressed="${on}">${svg("power")}${esc(on ? ctx.t("Tændt") : ctx.t("Tænd"))}</button>`);
  } else if (d === "button") out.push(`<button class="ap-mini-b pri" data-act="ap-press" data-id="${esc(a.entity)}">${svg("play")}${esc(ctx.t("Start"))}</button>`);
  return out;
}

function controlButtons(ctx, x, max = 99) {
  return x.buttons
    .slice(0, max)
    .map((b) => {
      if (b.kind === "press") return `<button class="ap-mini-b" data-act="ap-press" data-id="${esc(b.id)}">${svg("play")}${esc(b.name)}</button>`;
      if (b.kind === "switch") return `<button class="ap-pw${b.on ? " on" : ""}" data-act="ap-switch" data-id="${esc(b.id)}" aria-pressed="${b.on}">${svg("power")}${esc(b.name)}</button>`;
      return `<label class="apx-sel"><span>${esc(b.name)}</span><select data-in="ap-select" data-id="${esc(b.id)}">${b.options.map((o) => `<option${o === b.value ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
    })
    .join("");
}

// ------------------------------------------------------------------ the prototype's apCtl: the coffee machine's power, the dishwasher's start
const devOf = (ctx, a) => ctx.hass.entities?.[a.entity]?.device_id || null;
const isHc = (ctx, a) => ctx.platform(a.entity) === "home_connect" && !!devOf(ctx, a);

// The cheapest time to start a ~4 hour Eco programme in the hours we have prices for (EV Planner or the price sensor).
function cheapest(ctx, hours = 4) {
  let d = [];
  try {
    d = dayAhead(ctx) || [];
  } catch (err) {
    d = [];
  }
  if (d.length < 2) return null;
  const n = Math.min(hours, d.length);
  let best = null;
  for (let i = 0; i + n <= d.length; i++) {
    const avg = d.slice(i, i + n).reduce((t, x) => t + x.p, 0) / n;
    if (!best || avg < best.avg - 1e-9) best = { at: d[i].at, avg };
  }
  return best && best.at > Date.now() - 3600e3 ? best.at : null;
}

/* The family's own "start at the cheapest hour" for the dishwasher (a button, input_button or script), and the time it
   has worked out, when Home Assistant has one. That way their own automation does the starting. */
function ownCheap(ctx) {
  const ids = Object.keys(ctx.hass.states);
  const re = /(opvask|dish)/i, cheap = /(billig|cheap)/i;
  const press = ids.find((id) => /^(input_button|button|script)\./.test(id) && re.test(id + ctx.name(id)) && cheap.test(id + ctx.name(id)));
  if (!press) return null;
  const tid = ids.find((id) => id.startsWith("sensor.") && re.test(id) && cheap.test(id) && !Number.isNaN(Date.parse(ctx.hass.states[id].state)));
  const at = tid ? Date.parse(ctx.hass.states[tid].state) : null;
  return { press, at: at && at > Date.now() - 60000 ? at : null };
}
const cheapAt = (ctx, a) => ownCheap(ctx)?.at || (isHc(ctx, a) ? cheapest(ctx) : null);
const cheapLabel = (ctx, c) => (c && c - Date.now() > 15 * 60000 ? ctx.t("Billigst {time}", { time: ctx.fmt.time(c) }) : c ? ctx.t("Billigst nu") : ctx.t("Billigst"));

function apCtl(ctx, a, st, x) {
  if (st.key === "offline") return "";
  if (a.kind === "coffee" && /^(switch|input_boolean)\./.test(a.entity)) {
    const on = ctx.hass.states[a.entity]?.state === "on";
    return `<button class="ap-pw${on ? " on" : ""}" data-act="ap-power" data-id="${esc(a.id)}" aria-pressed="${on}">${svg("power")}${esc(on ? ctx.t("Tændt") : ctx.t("Tænd"))}</button>`;
  }
  if (a.kind === "dish") {
    if (st.key === "run")
      return `${x.left != null ? `<span class="ap-left num">${esc(leftText(ctx, x.left))}</span>` : ""}${x.stop ? `<button class="ap-mini-b" data-act="ap-dishstop" data-id="${esc(a.id)}">${esc(ctx.t("Stop"))}</button>` : ""}`;
    if (st.key === "scheduled")
      return x.stop ? `<button class="ap-mini-b" data-act="ap-dishstop" data-id="${esc(a.id)}">${esc(sched[a.id] ? ctx.t("Fortryd kl. {time}", { time: ctx.fmt.time(sched[a.id]) }) : ctx.t("Fortryd"))}</button>` : "";
    const own = ownCheap(ctx);
    if (!isHc(ctx, a) && !x.start && !own) return "";
    const c = cheapAt(ctx, a);
    return `${isHc(ctx, a) || x.start ? `<button class="ap-mini-b pri" data-act="ap-dishnow" data-id="${esc(a.id)}">${svg("play")}${esc(ctx.t("Eco nu"))}</button>` : ""}${
      own || c ? `<button class="ap-mini-b" data-act="ap-dishcheap" data-id="${esc(a.id)}">${svg("bolt")}${esc(cheapLabel(ctx, c))}</button>` : ""
    }`;
  }
  return "";
}

// ------------------------------------------------------------------ page
const ord = (ctx, id, i, n) =>
  `<div class="ap-ord"><button class="ap-hdl" data-apdrag="${esc(id)}" aria-label="${esc(ctx.t("Træk for at flytte"))}">${svg("drag")}</button><span class="num">${i + 1}</span><button class="ap-mv" data-act="ap-move" data-id="${esc(id)}" data-d="-1" aria-label="${esc(ctx.t("Flyt frem"))}" ${i ? "" : "disabled"}>${svg("back")}</button><button class="ap-mv" data-act="ap-move" data-id="${esc(id)}" data-d="1" aria-label="${esc(ctx.t("Flyt tilbage"))}" ${i < n - 1 ? "" : "disabled"}>${svg("go")}</button></div>`;

function firstFact(ctx, a, st, x) {
  if (st.key === "run" && x.left != null && a.kind !== "dish") return leftText(ctx, x.left);
  if (st.key === "done") return ctx.t("Tøm den gerne");
  if (a.kind === "dish" && st.key !== "run" && st.key !== "offline") {
    const c = cheapAt(ctx, a);
    if (c) return ctx.t("kl. {time}", { time: ctx.fmt.time(c) });
  }
  return x.facts[0] ? x.facts[0][1] : "";
}

function tile(ctx, a, i, n) {
  const st = status(ctx, a), x = details(ctx, a), run = st.key === "run";
  const sub = st.key === "offline" ? "" : firstFact(ctx, a, st, x);
  const ctl = editing ? "" : apCtl(ctx, a, st, x);
  return `<div class="ap-t k-${esc(a.kind)}${st.key === "offline" ? " off" : ""}${run ? " run" : ""}${editing ? " edit" : ""}" data-apid="${esc(a.id)}" style="--i:${i}">${editing ? ord(ctx, a.id, i, n) : ""}<button class="ap-tb" data-act="${editing ? "ap-edit" : "ap-open"}" data-id="${esc(a.id)}"><span class="ap-art">${apArt(a.kind, { run, temp: x.temp, door: x.door, battery: x.battery, key: st.key, warn: x.filter })}</span><span class="ap-tt"><b>${esc(a.name || ctx.name(a.entity))}</b><small class="ap-st ${st.cls}"><i></i>${esc(st.txt)}</small>${
    sub ? `<small class="ap-f">${esc(sub)}</small>` : ""
  }</span></button>${run && x.progress != null ? `<div class="ap-bar"><i style="width:${Math.max(2, Math.min(100, x.progress))}%"></i></div>` : ""}${ctl ? `<div class="ap-c">${ctl}</div>` : ""}</div>`;
}

const modelOf = (ctx, entity) => {
  const d = ctx.hass.devices?.[ctx.hass.entities?.[entity]?.device_id];
  return d ? [d.manufacturer, d.model].filter(Boolean).join(" ") : "";
};

/* Appliances Home Assistant already knows: robots, Home Connect-style programme sensors, appliance switches
   and fridge/freezer doors. One per device, not already on the page. */
function suggest(ctx) {
  const used = new Set((ctx.data.appliances || []).flatMap((a) => [a.entity, ...(a.controls || [])]));
  const usedDev = new Set((ctx.data.appliances || []).map((a) => ctx.hass.entities?.[a.entity]?.device_id).filter(Boolean));
  const rank = (id) => {
    const d = id.split(".")[0], s = ctx.hass.states[id], n = `${id} ${ctx.name(id)}`.toLowerCase();
    if (d === "vacuum" || d === "lawn_mower") return 1;
    if (d === "sensor" && /operation_?state|operationstate|program_?progress|machine_?state|appliance_?state/.test(n)) return 2;
    if (d === "sensor" && s?.attributes?.device_class === "enum" && guessKind(id, ctx.name(id)) !== "other") return 3;
    if ((d === "sensor" || d === "binary_sensor") && /door|dør/.test(n) && ["fridge", "freezer"].includes(guessKind(id, ctx.name(id)))) return 4;
    if (d === "switch" && /power|strøm|tænd/.test(n) && guessKind(id, ctx.name(id)) !== "other") return 5;
    return 0;
  };
  const best = new Map();
  for (const id of Object.keys(ctx.hass.states)) {
    if (used.has(id)) continue;
    const r = rank(id);
    if (!r) continue;
    const ent = ctx.hass.entities?.[id];
    if (ent?.hidden || ent?.entity_category) continue;
    const dev = ent?.device_id || id;
    if (usedDev.has(dev)) continue;
    const cur = best.get(dev);
    if (!cur || r < cur.r) best.set(dev, { id, r, dev });
  }
  return [...best.values()]
    .map(({ id, dev }) => {
      const d = ctx.hass.devices?.[dev];
      const name = (d?.name_by_user || d?.name || ctx.name(id)).slice(0, 40);
      return { entity: id, name, kind: guessKind(id, `${name} ${ctx.name(id)}`) };
    })
    .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));
}
function suggestBox(ctx) {
  const list = ctx.isParent ? suggest(ctx) : [];
  if (!list.length) return "";
  return `<section class="card apx-sugg"><div class="card-head"><h2>${esc(ctx.t("Fundet i Home Assistant"))}</h2><button class="btn sm" data-act="ap-sugg-all">${svg("plus")}${esc(ctx.t("Tilføj alle {n}", { n: list.length }))}</button></div>
    <div class="apx-sugg-l">${list.map((x) => `<button class="apx-sg" data-act="ap-sugg" data-entity="${esc(x.entity)}"><span class="ap-art">${apArt(x.kind)}</span><span><b>${esc(x.name)}</b><small>${esc(ctx.t(KIND_NAME[x.kind]))}</small></span>${svg("plus", "ic apx-sg-p")}</button>`).join("")}</div></section>`;
}
function fromSuggestion(ctx, x, list) {
  let base = slug(x.name).replace(/_/g, "-").slice(0, 40) || "apparat", nid = base, n = 2;
  if (!/^[a-z0-9]/.test(nid)) nid = base = "a" + base;
  while (list.some((a) => a.id === nid)) nid = `${base}-${n++}`;
  const controls = siblings(ctx, x.entity).filter((id) => interesting(ctx, id)).slice(0, 12);
  return { id: nid, entity: x.entity, name: x.name, kind: x.kind, controls };
}

const DAYPART = (h) => (h < 5 ? "nat" : h < 10 ? "morgen" : h < 12 ? "formiddag" : h < 18 ? "eftermiddag" : h < 23 ? "aften" : "nat");

function picker(ctx, list) {
  const sugg = suggest(ctx);
  const btn = (act, id, on, art, name, small, extra = "") =>
    `<button data-act="${act}" data-id="${esc(id)}" aria-pressed="${on}"${extra}><span class="ap-mini">${art}</span>${esc(name)}<small>${esc(small)}</small></button>`;
  return `<section class="card ap-pick" style="margin-top:14px"><div class="card-head"><h2>${esc(ctx.t("Vis på siden"))}</h2><span class="meta">${esc(ctx.t("{n} valgt", { n: list.length }))} · <button class="lnk" data-act="ap-add">${esc(ctx.t("Tilføj selv"))}</button></span></div><div class="ap-picks">${[
    ...list.map((a) => btn("ap-show", a.id, true, apArt(a.kind), a.name || ctx.name(a.entity), modelOf(ctx, a.entity) || ctx.t(KIND_NAME[a.kind] || KIND_NAME.other))),
    ...sugg.map((x) => btn("ap-sugg", x.entity, false, apArt(x.kind), x.name, modelOf(ctx, x.entity) || ctx.t(KIND_NAME[x.kind]))),
    ...APPL_FUT.map((f) => `<button class="fut" aria-pressed="false" disabled><span class="ap-mini fi">${svg(f[3])}</span>${esc(ctx.t(f[1]))}<small>${esc(ctx.t("Kommer senere · {hint}", { hint: ctx.t(f[2]) }))}</small></button>`),
  ].join("")}</div></section>`;
}

function render(ctx) {
  const list = (ctx.data.appliances || []).filter((a) => a && a.entity);
  if (!ctx.isParent) editing = false;
  if (!list.length && !editing)
    return `<section class="card hv-empty apx-empty"><div class="apx-trio">${apArt("washer", { run: true })}${apArt("coffee", { run: true })}${apArt("vacuum", { run: true })}</div><h2>${esc(ctx.t("Ingen apparater endnu"))}</h2><p class="t-sub">${esc(
      ctx.t("Vis vaskemaskinen, opvaskeren, robotstøvsugeren og de andre her, så alle kan se, hvad der kører, og hvornår det er færdigt.")
    )}</p>${ctx.isParent ? `<button class="btn" data-act="ap-add">${svg("plus")}${esc(ctx.t("Tilføj apparat"))}</button>` : ""}</section>${suggestBox(ctx)}`;
  const rows = list.map((a) => [a, status(ctx, a), details(ctx, a)]);
  const running = rows.filter(([, s]) => s.key === "run").length;
  const issues = rows
    .filter(([, s, x]) => s.key === "offline" || s.key === "error" || x.filter)
    .map(([a, s, x]) => {
      const name = a.name || ctx.name(a.entity);
      return x.filter && s.key !== "offline" ? ctx.t("{name}: skift filter", { name }) : s.key === "offline" ? ctx.t("{name} er ikke forbundet", { name }) : ctx.t("{name} kræver opmærksomhed", { name });
    });
  const now = new Date();
  const when = `${ctx.fmt.day(now).toLowerCase()} ${ctx.t(DAYPART(now.getHours()))}`;
  const hasCoffee = list.some((a) => a.kind === "coffee"), hasDish = list.some((a) => a.kind === "dish" && isHc(ctx, a));
  const foot = [
    ctx.t("Status fra Home Assistant {when}.", { when }),
    hasCoffee && hasDish
      ? ctx.t("Programmer vælges på maskinerne; Hverdagsro tænder og slukker kun kaffemaskinen og starter opvaskeren.")
      : hasCoffee
      ? ctx.t("Programmer vælges på maskinerne; Hverdagsro tænder og slukker kun kaffemaskinen.")
      : hasDish
      ? ctx.t("Programmer vælges på maskinerne; Hverdagsro starter kun opvaskeren.")
      : ctx.t("Programmer vælges på maskinerne."),
  ].join(" ");
  return `<section class="ap-top"><div><span class="eyebrow">${esc(ctx.t("Apparater"))}</span><h2 class="h2">${esc(running ? ctx.t("{n} kører lige nu", { n: running }) : ctx.t("Alt er stille"))}</h2>${issues.length ? `<p class="t-sub">${esc(issues.join(" · "))}</p>` : ""}</div>
    ${ctx.isParent ? `<button class="btn ${editing ? "" : "soft"}" data-act="ap-editmode">${svg(editing ? "check" : "edit")}${esc(editing ? ctx.t("Færdig") : ctx.t("Tilpas"))}</button>` : ""}</section>
  ${editing ? `<div class="ap-edhint">${svg("drag")}<span>${esc(ctx.t("Træk i håndtaget eller brug pilene for at ændre rækkefølgen. Vælg nederst, hvilke apparater der skal vises."))}</span></div>` : ""}
  <div class="ap-tiles${editing ? " editing" : ""}" id="ap-tiles">${list.map((a, i) => tile(ctx, a, i, list.length)).join("")}</div>
  ${editing ? picker(ctx, list) : ""}
  <p class="foot">${esc(foot)}</p>`;
}

// ------------------------------------------------------------------ sheets
function openSheet(ctx, id) {
  const a = (ctx.data.appliances || []).find((x) => x.id === id);
  if (!a) return;
  const st = status(ctx, a), x = details(ctx, a), run = st.key === "run";
  const c = a.kind === "dish" && !run ? cheapAt(ctx, a) : null;
  const facts = [...(c ? [[ctx.t("Billigst start"), ctx.t("kl. {time}", { time: ctx.fmt.time(c) })]] : []), ...(run && x.left != null ? [[ctx.t("Tid"), leftText(ctx, x.left)]] : []), ...(x.finish ? [[ctx.t("Færdig"), ctx.fmt.time(x.finish)]] : []), ...x.facts];
  const ctl = apCtl(ctx, a, st, x) + mainControls(ctx, a, st).filter((h) => !/ap-pw/.test(h) || a.kind !== "coffee").join("") + controlButtons(ctx, { buttons: x.buttons.filter((b) => b.id !== x.stop && b.id !== x.start) });
  const area = ctx.area(a.entity);
  const model = modelOf(ctx, a.entity);
  const s = ctx.sheet(`<div class="eyebrow">${esc([area && ctx.hass.areas?.[area]?.name, a.entity].filter(Boolean).join(" · "))}</div><h2>${esc(a.name || ctx.name(a.entity))}</h2>${model ? `<p class="t-sub" style="margin-top:-4px">${esc(model)}</p>` : ""}
    <div class="ap-sh"><span class="ap-art lg">${apArt(a.kind, { run, temp: x.temp, door: x.door, battery: x.battery, key: st.key, warn: x.filter })}</span><div><span class="ap-st ${st.cls}"><i></i>${esc(st.txt)}</span>
      ${run && x.progress != null ? `<div class="ap-bar" style="margin-top:10px"><i style="width:${Math.max(2, Math.min(100, x.progress))}%"></i></div>` : ""}
      <div class="ap-facts">${facts.map(([k, v]) => `<span><small>${esc(k)}</small><b>${esc(v)}</b></span>`).join("") || `<span class="t-sub">${esc(st.key === "offline" ? ctx.t("Svarer ikke i HA lige nu.") : ctx.t("Ingen flere oplysninger."))}</span>`}</div>
      ${ctl ? `<div class="ap-c" style="margin-top:10px">${ctl}</div>` : ""}</div></div>
    <div class="sheet-actions">${ctx.isParent ? `<button class="btn soft" data-act="ap-edit" data-id="${esc(a.id)}" data-close>${svg("edit")}${esc(ctx.t("Ret"))}</button>` : ""}<button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
  // Like the prototype: a control in the sheet closes it.
  s.el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act^='ap-dish'],[data-act='ap-power']");
    if (b) setTimeout(() => s.close(), 0);
  });
}

const candidates = (ctx) =>
  Object.keys(ctx.hass.states)
    .filter((id) => MAIN_DOMAINS.test(id))
    .sort((p, q) => ctx.name(p).localeCompare(ctx.name(q), ctx.locale()));

function siblings(ctx, entity) {
  const dev = ctx.hass.entities?.[entity]?.device_id;
  if (!dev) return [];
  return Object.values(ctx.hass.entities)
    .filter((e) => e.device_id === dev && e.entity_id !== entity && !e.hidden && ctx.hass.states[e.entity_id] && /^(sensor|binary_sensor|switch|button|select|number)\./.test(e.entity_id))
    .map((e) => e.entity_id)
    .slice(0, 30);
}
const interesting = (ctx, id) => {
  const s = ctx.hass.states[id], dc = s?.attributes?.device_class, n = `${id} ${ctx.name(id)}`.toLowerCase();
  return /^(button|switch|select)\./.test(id) || ["duration", "timestamp", "temperature", "door", "battery"].includes(dc) || /tilbage|remaining|program|door|dør|progress|finish|færdig/.test(n);
};

function controlList(ctx, entity, chosen) {
  const sib = siblings(ctx, entity);
  const all = [...new Set([...sib, ...(chosen || [])])];
  if (!all.length)
    return `<p class="t-sub">${esc(
      ctx.hass.states[entity] ? ctx.t("Der er ingen andre enheder på samme enhed i Home Assistant.") : ctx.t("Vælg først apparatets hovedenhed. Andre enheder på samme enhed i Home Assistant dukker så op her.")
    )}</p>`;
  const bar = `<div class="apx-all"><button type="button" class="btn soft sm" data-act="ap-ctlall" data-on="1">${esc(ctx.t("Vælg alle"))}</button><button type="button" class="btn soft sm" data-act="ap-ctlall" data-on="0">${esc(ctx.t("Fravælg alle"))}</button></div>`;
  return bar + all
    .map((id) => {
      const on = chosen ? chosen.includes(id) : interesting(ctx, id);
      const s = ctx.hass.states[id];
      return `<label class="apx-ctl"><input type="checkbox" value="${esc(id)}" ${on ? "checked" : ""}><span><b>${esc(ctx.name(id))}</b><small>${esc(id)}${s ? " · " + esc(fmtState(ctx, s)) : ""}</small></span></label>`;
    })
    .join("");
}

function editSheet(ctx, id) {
  const a = (ctx.data.appliances || []).find((x) => x.id === id) || null;
  const ent = a?.entity || "";
  const opts = candidates(ctx)
    .map((e) => `<option value="${esc(e)}">${esc(ctx.name(e))}</option>`)
    .join("");
  const s = ctx.sheet(
    `<div class="eyebrow">${esc(ctx.t("Apparater"))}</div><h2>${esc(a ? ctx.t("Ret {name}", { name: a.name || ctx.name(a.entity) }) : ctx.t("Tilføj apparat"))}</h2>
    <form class="apx-form" data-apform="${esc(a?.id || "")}">
      <label class="field"><span>${esc(ctx.t("Enhed i Home Assistant"))}</span><input name="entity" list="apx-ents" value="${esc(ent)}" placeholder="sensor.vaskemaskine_status" data-in="ap-ent" autocomplete="off" required><datalist id="apx-ents">${opts}</datalist><small class="t-sub">${esc(ctx.t("Status-sensoren, kontakten eller robotten. Fx Home Connect, Miele, LG ThinQ, SmartThings eller en smart stikkontakt med strømmåling."))}</small></label>
      <label class="field"><span>${esc(ctx.t("Navn"))}</span><input name="name" maxlength="40" value="${esc(a?.name || "")}" placeholder="${esc(ctx.t("Fx Vaskemaskine"))}"></label>
      <div class="field"><span>${esc(ctx.t("Slags"))}</span><div class="apx-kinds">${KINDS.map(
        (k) => `<button type="button" class="apx-kind" data-act="ap-kind" data-k="${k}" aria-pressed="${(a?.kind || guessKind(ent)) === k}"><span class="ap-mini">${apArt(k)}</span><small>${esc(ctx.t(KIND_NAME[k]))}</small></button>`
      ).join("")}</div></div>
      <div class="field"><span>${esc(ctx.t("Vis også"))}</span><div class="apx-ctls" id="apx-ctls">${controlList(ctx, ent, a ? a.controls : null)}</div></div>
    </form>
    <div class="sheet-actions">${a ? `<button class="btn danger" data-act="ap-del" data-id="${esc(a.id)}">${svg("trash")}${esc(ctx.t("Slet"))}</button><span style="flex:1"></span>` : ""}<button class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" data-act="ap-save">${svg("check")}${esc(ctx.t("Gem"))}</button></div>`,
    { cls: "apx-sheet" }
  );
  s.el.querySelector("form").addEventListener("submit", (e) => e.preventDefault());
  return s;
}

async function saveList(ctx, list, msg) {
  if (await ctx.save("appliances", list)) {
    if (msg) ctx.toast(msg);
    ctx.render();
    return true;
  }
  return false;
}

// ------------------------------------------------------------------ actions
const find = (ctx, id) => (ctx.data.appliances || []).find((a) => a.id === id);
const acts = {
  "ap-ctlall": (el) => {
    el.closest(".apx-ctls")?.querySelectorAll(".apx-ctl input").forEach((c) => (c.checked = el.dataset.on === "1"));
  },
  "ap-open": (el, e, ctx) => openSheet(ctx, el.dataset.id),
  "ap-editmode": (el, e, ctx) => {
    editing = !editing;
    ctx.render();
  },
  "ap-add": (el, e, ctx) => editSheet(ctx, null),
  "ap-sugg": async (el, e, ctx) => {
    const x = suggest(ctx).find((y) => y.entity === (el.dataset.entity || el.dataset.id));
    if (!x) return;
    const list = [...(ctx.data.appliances || [])];
    list.push(fromSuggestion(ctx, x, list));
    await saveList(ctx, list, ctx.t("{name} er tilføjet", { name: x.name }));
  },
  "ap-sugg-all": async (el, e, ctx) => {
    const list = [...(ctx.data.appliances || [])];
    const add = suggest(ctx);
    for (const x of add) list.push(fromSuggestion(ctx, x, list));
    await saveList(ctx, list.slice(0, 80), ctx.t("{n} apparater er tilføjet", { n: add.length }));
  },
  "ap-edit": (el, e, ctx) => {
    ctx.q(".sheet-bg")?.close?.();
    editSheet(ctx, el.dataset.id);
  },
  "ap-kind": (el) => {
    el.closest(".apx-kinds").querySelectorAll("[data-k]").forEach((b) => b.setAttribute("aria-pressed", String(b === el)));
    el.closest("form").dataset.kindSet = "1";
  },
  "ap-save": async (el, e, ctx) => {
    const sheet = el.closest(".sheet"), f = sheet.querySelector("form");
    const entity = f.entity.value.trim();
    if (!ctx.hass.states[entity]) {
      f.entity.focus();
      return ctx.toast(ctx.t("Vælg en enhed, der findes i Home Assistant"));
    }
    const kind = f.querySelector(".apx-kind[aria-pressed=true]")?.dataset.k || guessKind(entity, f.name.value);
    const name = f.name.value.trim().slice(0, 40) || ctx.name(entity).slice(0, 40);
    const controls = [...f.querySelectorAll(".apx-ctl input:checked")].map((c) => c.value).slice(0, 40);
    const list = [...(ctx.data.appliances || [])];
    const old = f.dataset.apform;
    if (old) {
      const i = list.findIndex((a) => a.id === old);
      if (i >= 0) list[i] = { ...list[i], entity, name, kind, controls };
    } else {
      let base = slug(name).replace(/_/g, "-").slice(0, 40) || "apparat", nid = base, n = 2;
      if (!/^[a-z0-9]/.test(nid)) nid = base = "a" + base;
      while (list.some((a) => a.id === nid)) nid = `${base}-${n++}`;
      list.push({ id: nid, entity, name, kind, controls });
    }
    sheet.closest(".sheet-bg")?.close?.();
    await saveList(ctx, list, old ? ctx.t("{name} er gemt", { name }) : ctx.t("{name} er tilføjet", { name }));
  },
  "ap-del": (el, e, ctx) => {
    const a = find(ctx, el.dataset.id);
    if (!a) return;
    el.closest(".sheet-bg")?.close?.();
    ctx.confirm(ctx.t("Slet {name}?", { name: a.name || ctx.name(a.entity) }), ctx.t("Apparatet forsvinder fra siden. Intet ændres i Home Assistant."), ctx.t("Slet"), () =>
      saveList(ctx, (ctx.data.appliances || []).filter((x) => x.id !== a.id), ctx.t("{name} er slettet", { name: a.name || ctx.name(a.entity) }))
    );
  },
  "ap-move": async (el, e, ctx) => {
    const list = [...(ctx.data.appliances || [])], i = list.findIndex((a) => a.id === el.dataset.id), j = i + Number(el.dataset.d);
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await saveList(ctx, list);
    ctx.q(`[data-apid="${CSS.escape(el.dataset.id)}"]`)?.classList.add("moved");
  },
  "ap-call": async (el, e, ctx) => {
    const a = find(ctx, el.dataset.id);
    if (!a) return;
    const d = a.entity.split(".")[0], s = el.dataset.s;
    if (await ctx.call(d, s, { entity_id: a.entity }))
      ctx.toast(
        { start: ctx.t("{name} går i gang", { name: a.name }), start_mowing: ctx.t("{name} går i gang", { name: a.name }), pause: ctx.t("{name} holder pause", { name: a.name }), return_to_base: ctx.t("{name} kører hjem", { name: a.name }), dock: ctx.t("{name} kører hjem", { name: a.name }) }[s] || a.name
      );
  },
  // Tilpas → Vis på siden: take an appliance off the page (it can be found again under the same list).
  "ap-show": (el, e, ctx) => {
    const a = find(ctx, el.dataset.id);
    if (!a) return;
    const name = a.name || ctx.name(a.entity);
    const go = () => saveList(ctx, (ctx.data.appliances || []).filter((x) => x.id !== a.id), ctx.t("{name} vises ikke længere", { name }));
    if (JSON.stringify(ctx.data.house || {}).includes(`"appl":"${a.id}"`))
      return ctx.confirm(ctx.t("Fjern {name} fra siden?", { name }), ctx.t("{name} står også på jeres tegning af huset og forsvinder derfra."), ctx.t("Fjern"), go);
    return go();
  },
  // The dishwasher: Eco now, or Eco when the power is cheapest (Home Connect's delayed start), or stop.
  "ap-dishnow": async (el, e, ctx) => {
    const a = find(ctx, el.dataset.id);
    if (!a) return;
    const x = details(ctx, a);
    const ok = isHc(ctx, a)
      ? await ctx.call("home_connect", "set_program_and_options", { device_id: devOf(ctx, a), affects_to: "active_program", program: "dishcare_dishwasher_program_eco_50" })
      : x.start && (await ctx.call("button", "press", { entity_id: x.start }));
    if (ok) {
      delete sched[a.id];
      ctx.toast(ctx.t("{name} kører Eco 50°", { name: a.name || ctx.name(a.entity) }));
    }
  },
  "ap-dishcheap": async (el, e, ctx) => {
    const a = find(ctx, el.dataset.id);
    if (!a) return;
    const own = ownCheap(ctx), nm = a.name || ctx.name(a.entity);
    if (own) {
      const d = own.press.split(".")[0];
      const ok = await ctx.call(d === "script" ? "script" : d, d === "script" ? "turn_on" : "press", { entity_id: own.press });
      if (ok) ctx.toast(own.at ? ctx.t("{name} starter Eco kl. {time}, når strømmen er billigst", { name: nm, time: ctx.fmt.time(own.at) }) : ctx.t("{name} starter, når strømmen er billigst", { name: nm }));
      return;
    }
    const c = cheapest(ctx);
    if (!c) return;
    // The cheapest hour is now: start right away.
    if (c - Date.now() <= 15 * 60000) return acts["ap-dishnow"](el, e, ctx);
    const secs = Math.max(60, Math.round((c - Date.now()) / 60000) * 60);
    const ok = await ctx.call("home_connect", "set_program_and_options", {
      device_id: devOf(ctx, a),
      affects_to: "active_program",
      program: "dishcare_dishwasher_program_eco_50",
      b_s_h_common_option_start_in_relative: secs,
    });
    if (ok) {
      sched[a.id] = c;
      ctx.render();
      ctx.toast(ctx.t("{name} starter Eco kl. {time}, når strømmen er billigst", { name: a.name || ctx.name(a.entity), time: ctx.fmt.time(c) }));
    }
  },
  "ap-dishstop": async (el, e, ctx) => {
    const a = find(ctx, el.dataset.id), x = a && details(ctx, a);
    if (!x?.stop) return;
    if (await ctx.call("button", "press", { entity_id: x.stop })) {
      delete sched[a.id];
      ctx.toast(ctx.t("{name} er stoppet", { name: a.name || ctx.name(a.entity) }));
    }
  },
  "ap-power": async (el, e, ctx) => {
    const a = find(ctx, el.dataset.id);
    if (!a) return;
    const on = ctx.hass.states[a.entity]?.state === "on";
    if (await ctx.call("homeassistant", on ? "turn_off" : "turn_on", { entity_id: a.entity })) ctx.toast(on ? ctx.t("{name} er slukket", { name: a.name }) : ctx.t("{name} er tændt", { name: a.name }));
  },
  "ap-switch": (el, e, ctx) => {
    const on = el.getAttribute("aria-pressed") === "true";
    return ctx.call("homeassistant", on ? "turn_off" : "turn_on", { entity_id: el.dataset.id });
  },
  "ap-press": async (el, e, ctx) => {
    if (await ctx.call("button", "press", { entity_id: el.dataset.id })) ctx.toast(ctx.t("Sendt: {name}", { name: el.textContent.trim() }));
  },
};

const inputs = {
  "ap-select": (el, e, ctx) => {
    if (e.type !== "change") return;
    const d = el.dataset.id.split(".")[0];
    ctx.call(d, "select_option", { entity_id: el.dataset.id, option: el.value });
  },
  // Picking the main entity: guess the kind and name, and list the other entities of the same device.
  "ap-ent": (el, e, ctx) => {
    const f = el.closest("form"), id = el.value.trim();
    if (!ctx.hass.states[id]) return;
    if (!f.name.value) f.name.placeholder = ctx.name(id);
    if (!f.dataset.kindSet) {
      const k = guessKind(id, ctx.name(id));
      f.querySelectorAll(".apx-kind").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === k)));
    }
    const box = f.querySelector("#apx-ctls");
    if (box && box.dataset.for !== id) {
      box.dataset.for = id;
      box.innerHTML = controlList(ctx, id, null);
    }
  },
};

// Drag to reorder (the handle in edit mode). Saved for the whole family when you let go.
function init(ctx) {
  ctx.root.addEventListener("pointerdown", (e) => {
    const h = e.target.closest?.("[data-apdrag]");
    if (!h) return;
    e.preventDefault();
    const tileEl = h.closest(".ap-t"), grid = tileEl.parentElement;
    tileEl.classList.add("dragging");
    ctx._busy = true;
    try {
      h.setPointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
    let moved = false;
    const mv = (ev) => {
      const over = ctx.root
        .elementsFromPoint(ev.clientX, ev.clientY)
        .map((el) => el.closest && el.closest(".ap-t[data-apid]"))
        .find((t) => t && t !== tileEl && t.parentElement === grid);
      if (!over) return;
      const r = over.getBoundingClientRect(), after = ev.clientX > r.left + r.width / 2, ref = after ? over.nextSibling : over;
      if (ref === tileEl || tileEl.nextSibling === ref) return;
      const first = [...grid.children].map((c) => [c, c.getBoundingClientRect()]);
      grid.insertBefore(tileEl, ref);
      moved = true;
      first.forEach(([c, r0]) => {
        if (c === tileEl) return;
        const r1 = c.getBoundingClientRect(), dx = r0.left - r1.left, dy = r0.top - r1.top;
        if (dx || dy) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    };
    const up = async () => {
      h.removeEventListener("pointermove", mv);
      h.removeEventListener("pointerup", up);
      h.removeEventListener("pointercancel", up);
      tileEl.classList.remove("dragging");
      ctx._busy = false;
      if (!moved) return;
      const ids = [...grid.querySelectorAll(".ap-t[data-apid]")].map((t) => t.dataset.apid);
      const list = [...(ctx.data.appliances || [])].sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
      await saveList(ctx, list, ctx.t("Rækkefølgen er gemt"));
    };
    h.addEventListener("pointermove", mv);
    h.addEventListener("pointerup", up);
    h.addEventListener("pointercancel", up);
  });
}

const css = `
.apx-all { display: flex; gap: 6px; margin-bottom: 6px; }

.apx-sugg { margin-top: 16px; }
.apx-sugg-l { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
.apx-sg { display: flex; align-items: center; gap: 10px; text-align: left; border: 1.5px dashed var(--line); background: var(--surface-2); color: var(--ink); border-radius: 16px; padding: 8px 10px; cursor: pointer; font: inherit; }
.apx-sg:hover { border-color: var(--violet); }
.apx-sg .ap-art { width: 44px; height: 44px; flex: none; }
.apx-sg b { display: block; font-size: 14px; }
.apx-sg small { color: var(--muted); font-size: 12px; }
.apx-sg > span:nth-child(2) { flex: 1; min-width: 0; }
.apx-sg-p { width: 18px; height: 18px; color: var(--violet); flex: none; }
.apx-acts { display: flex; gap: 8px; flex-wrap: wrap; }
.apx-add { border: 1.5px dashed var(--line) !important; box-shadow: none !important; background: transparent !important; align-items: center; justify-content: center; min-height: 92px; color: var(--muted); cursor: pointer; font: inherit; flex-direction: row !important; gap: 10px !important; }
.apx-add:hover { color: var(--violet); border-color: var(--violet) !important; }
.apx-plus { width: 34px; height: 34px; border-radius: 12px; display: grid; place-items: center; background: var(--surface-2); }
.apx-plus .ic { width: 18px; height: 18px; }
.ap-tiles.editing .apx-add { display: none; }
.ap-t .ap-bar { margin: 0; height: 6px; }
.apx-sel { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; }
.apx-sel select { border: 1.5px solid var(--line); border-radius: 999px; padding: 4px 8px; background: var(--surface); color: var(--ink); font: inherit; max-width: 160px; }
.apx-empty { overflow: hidden; }
.apx-trio { display: flex; gap: 10px; justify-content: center; margin-bottom: 6px; }
.apx-trio .ap-svg { width: 76px; height: 76px; border-radius: 18px; background: var(--surface-2); padding: 6px; animation: pop .45s both; }
.apx-trio .ap-svg:nth-child(2) { animation-delay: .08s; } .apx-trio .ap-svg:nth-child(3) { animation-delay: .16s; }
.apx-form { display: grid; gap: 14px; margin-top: 6px; }
.apx-form .field { display: grid; gap: 6px; }
.apx-form .field > span { font-weight: 700; font-size: 13px; }
.apx-form input[name] { border: 1.5px solid var(--line); border-radius: 12px; padding: 10px 12px; background: var(--surface); color: var(--ink); font: inherit; }
.apx-form input[name]:focus { outline: none; border-color: var(--violet); }
.apx-kinds { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 6px; }
.apx-kind { display: grid; justify-items: center; gap: 4px; border: 1.5px solid var(--line); background: var(--surface); border-radius: 14px; padding: 8px 4px; color: var(--ink); cursor: pointer; }
.apx-kind .ap-mini { width: 44px; height: 44px; }
.apx-kind .ap-mini .ap-svg { width: 42px; }
.apx-kind small { font-size: 11px; font-weight: 700; text-align: center; line-height: 1.2; }
.apx-kind[aria-pressed="true"] { border-color: var(--violet); background: color-mix(in srgb, var(--violet) 9%, var(--surface)); }
.apx-ctls { display: grid; gap: 4px; max-height: 240px; overflow-y: auto; }
.apx-ctl { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 8px; align-items: center; padding: 6px 8px; border-radius: 10px; background: var(--surface-2); cursor: pointer; }
.apx-ctl input { accent-color: var(--violet); width: 18px; height: 18px; }
.apx-ctl b { display: block; font-size: 13px; } .apx-ctl small { font-size: 11px; color: var(--muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.apx-roam { animation: apxroam 7s ease-in-out infinite; transform-box: view-box; transform-origin: 60px 62px; }
@keyframes apxroam { 0% { transform: translate(-6px, 4px) rotate(-8deg); } 50% { transform: translate(6px, -4px) rotate(10deg); } 100% { transform: translate(-6px, 4px) rotate(-8deg); } }
.apx-brush { animation: apspin .5s linear infinite; }
.apx-trail { animation: apxdash 1.2s linear infinite; } @keyframes apxdash { to { stroke-dashoffset: -18; } }
.apx-mow { animation: apxmow 6s ease-in-out infinite; } @keyframes apxmow { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-62px, 0); } 50% { transform: translate(-62px, -50px); } 75% { transform: translate(0, -50px); } }
.ap-svg.run .ap-drum { transform-box: view-box; transform-origin: 60px 68px; }
@media (max-width: 520px) { .apx-kinds { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
`;

const en = {
  "Døren står åben": "The door is open",
  Tændt: "On",
  Standby: "Standby",
  "Starter kl. {time}": "Starts at {time}",
  Stop: "Stop",
  "Fortryd kl. {time}": "Cancel {time}",
  Fortryd: "Cancel",
  "Eco nu": "Eco now",
  "Billigst {time}": "Cheapest {time}", "Billigst nu": "Cheapest now", Billigst: "Cheapest", "{name} starter, når strømmen er billigst": "{name} starts when power is cheapest",
  "kl. {time}": "at {time}",
  "Vis på siden": "Show on the page",
  "{n} valgt": "{n} chosen",
  "Tilføj selv": "Add manually",
  "Kommer senere · {hint}": "Coming later · {hint}",
  Emhætte: "Cooker hood",
  "Bosch/Siemens via Home Connect": "Bosch/Siemens via Home Connect",
  Varmepumpe: "Heat pump",
  "Fx Daikin, Nibe eller Panasonic": "E.g. Daikin, Nibe or Panasonic",
  "Solceller og batteri": "Solar panels and battery",
  "Energi-dashboardet": "The energy dashboard",
  Fjernvarme: "District heating",
  "Kamstrup Multical": "Kamstrup Multical",
  "Vandmåler og hovedhane": "Water meter and main valve",
  "Kamstrup og lækagesensorer": "Kamstrup and leak sensors",
  Vinduespudserrobot: "Window cleaning robot",
  "Til de store glaspartier": "For the large windows",
  Robotmoppe: "Robot mop",
  "Køkken og bad": "Kitchen and bathroom",
  Affugter: "Dehumidifier",
  "Bryggers og bad": "Utility room and bathroom",
  Luftrenser: "Air purifier",
  "Pollen om foråret": "Pollen in spring",
  Airfryer: "Air fryer",
  "Besked, når maden er klar": "A message when the food is ready",
  "{name}: skift filter": "{name}: change the filter",
  nat: "night",
  morgen: "morning",
  formiddag: "morning",
  eftermiddag: "afternoon",
  aften: "evening",
  "Status fra Home Assistant {when}.": "Status from Home Assistant {when}.",
  "Programmer vælges på maskinerne; Hverdagsro tænder og slukker kun kaffemaskinen og starter opvaskeren.": "Programmes are chosen on the machines; Hverdagsro only turns the coffee machine on and off and starts the dishwasher.",
  "Programmer vælges på maskinerne; Hverdagsro tænder og slukker kun kaffemaskinen.": "Programmes are chosen on the machines; Hverdagsro only turns the coffee machine on and off.",
  "Programmer vælges på maskinerne; Hverdagsro starter kun opvaskeren.": "Programmes are chosen on the machines; Hverdagsro only starts the dishwasher.",
  "Programmer vælges på maskinerne.": "Programmes are chosen on the machines.",
  "Træk i håndtaget eller brug pilene for at ændre rækkefølgen. Vælg nederst, hvilke apparater der skal vises.": "Drag the handle or use the arrows to change the order. Choose at the bottom which appliances to show.",
  "Billigst start": "Cheapest start",
  "Svarer ikke i HA lige nu.": "Not responding in HA right now.",
  "{name} vises ikke længere": "{name} is no longer shown",
  "Fjern {name} fra siden?": "Remove {name} from the page?",
  "{name} står også på jeres tegning af huset og forsvinder derfra.": "{name} is also on your drawing of the house and will disappear from there.",
  Fjern: "Remove",
  "{name} kører Eco 50°": "{name} is running Eco 50°",
  "{name} starter Eco kl. {time}, når strømmen er billigst": "{name} starts Eco at {time}, when power is cheapest",
  "{name} er stoppet": "{name} has stopped",
  "Fundet i Home Assistant": "Found in Home Assistant",
  "Tilføj alle {n}": "Add all {n}",
  "{n} apparater er tilføjet": "{n} appliances added",
  Apparater: "Appliances",
  Vaskemaskine: "Washing machine",
  "Fx Vaskemaskine": "E.g. Washing machine",
  Tørretumbler: "Tumble dryer",
  Opvasker: "Dishwasher",
  Ovn: "Oven",
  Kogeplade: "Hob",
  Kaffemaskine: "Coffee machine",
  Køleskab: "Fridge",
  Fryser: "Freezer",
  Robotstøvsuger: "Robot vacuum",
  Plæneklipper: "Lawn mower",
  Ventilation: "Ventilation",
  "Andet apparat": "Other appliance",
  "Ikke forbundet": "Not connected",
  Kører: "Running",
  Slukket: "Off",
  Færdig: "Finished",
  "Starter senere": "Starts later",
  "På pause": "Paused",
  "I ladestation": "Docked",
  "Kører hjem": "Returning",
  "Kræver opmærksomhed": "Needs attention",
  "{_}Klar": "{_}Ready",
  Tændt: "On",
  Styrke: "Power",
  Åben: "Open",
  Lukket: "Closed",
  Batteri: "Battery",
  "Næsten færdig": "Almost done",
  "{h} t {m} min tilbage": "{h} h {m} min left",
  "{m} min tilbage": "{m} min left",
  Pause: "Pause",
  Hjem: "Home",
  Start: "Start",
  Klip: "Mow",
  Tænd: "Turn on",
  "Tøm den gerne": "Ready to empty",
  "Træk for at flytte": "Drag to move",
  "Flyt frem": "Move forward",
  "Flyt tilbage": "Move back",
  "Ingen apparater endnu": "No appliances yet",
  "Vis vaskemaskinen, opvaskeren, robotstøvsugeren og de andre her, så alle kan se, hvad der kører, og hvornår det er færdigt.": "Show the washing machine, the dishwasher, the robot vacuum and the rest here, so everyone can see what's running and when it's done.",
  "Tilføj apparat": "Add appliance",
  "{n} kører lige nu": "{n} running now",
  "{name} er færdig": "{name} is finished",
  "Alt er stille": "All quiet",
  "{name} er ikke forbundet": "{name} is not connected",
  "{name} kræver opmærksomhed": "{name} needs attention",
  Tilføj: "Add",
  Tilpas: "Customise",
  "Træk i håndtaget eller brug pilene for at ændre rækkefølgen. Tryk på et apparat for at rette det.": "Drag the handle or use the arrows to change the order. Tap an appliance to edit it.",
  Tid: "Time",
  "Svarer ikke i Home Assistant lige nu.": "Not responding in Home Assistant right now.",
  "Ingen flere oplysninger.": "No more details.",
  Ret: "Edit",
  "Der er ingen andre enheder på samme enhed i Home Assistant.": "There are no other entities on the same device in Home Assistant.",
  Luk: "Close",
  "Vælg først apparatets hovedenhed. Andre enheder på samme enhed i Home Assistant dukker så op her.": "First choose the appliance's main entity. Other entities on the same device in Home Assistant then show up here.",
  "Ret {name}": "Edit {name}",
  "Enhed i Home Assistant": "Entity in Home Assistant",
  "Status-sensoren, kontakten eller robotten. Fx Home Connect, Miele, LG ThinQ, SmartThings eller en smart stikkontakt med strømmåling.": "The status sensor, switch or robot. E.g. Home Connect, Miele, LG ThinQ, SmartThings or a smart plug with power metering.",
  Navn: "Name",
  Slags: "Kind",
  "Vis også": "Also show",
  Slet: "Delete",
  Annullér: "Cancel",
  Gem: "Save",
  "Vælg en enhed, der findes i Home Assistant": "Choose an entity that exists in Home Assistant",
  "{name} er gemt": "{name} is saved",
  "{name} er tilføjet": "{name} is added",
  "Slet {name}?": "Delete {name}?",
  "Apparatet forsvinder fra siden. Intet ændres i Home Assistant.": "The appliance disappears from the page. Nothing changes in Home Assistant.",
  "{name} er slettet": "{name} is deleted",
  "{name} går i gang": "{name} is starting",
  "{name} holder pause": "{name} is pausing",
  "{name} kører hjem": "{name} is heading home",
  "{name} er slukket": "{name} is off",
  "{name} er tændt": "{name} is on",
  "Sendt: {name}": "Sent: {name}",
  "Rækkefølgen er gemt": "The order is saved",
};

export default {
  id: "appliances",
  views: {
    apparater: { module: "appliances", render, title: (ctx) => ctx.t("Apparater") },
  },
  acts,
  inputs,
  init,
  css,
  en,
};
