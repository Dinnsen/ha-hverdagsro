/* Hverdagsro – electricity and cars: the strip under the sky on the home page.
   The price comes from the price sensor in the settings (Energi Data Service, Nord Pool and others with
   raw_today/raw_tomorrow or today/tomorrow). The cars come from EV Planner, when it is installed. */
import { esc, startOfDay } from "./hv-core.js";
import { svg } from "./hv-icons.js";

const pad = (n) => String(n).padStart(2, "0");

/* Hourly prices from now and 24 hours ahead: [{ at: Date, h: 0-23, p: number }]. */
export function dayAhead(ctx) {
  const id = ctx.data?.settings?.price;
  const st = id && ctx.hass?.states?.[id];
  if (!st) return [];
  const a = st.attributes || {};
  const t0 = startOfDay(new Date());
  const parse = (list, dayOffset) => {
    if (!Array.isArray(list) || !list.length) return [];
    return list
      .map((x, i) => {
        if (typeof x === "number") {
          const per = 24 / list.length;
          return { at: new Date(+t0 + dayOffset * 864e5 + i * per * 3600e3), p: x };
        }
        const when = x.hour || x.start || x.time || x.startsAt;
        const p = Number(x.price ?? x.value ?? x.total);
        return when && !Number.isNaN(p) ? { at: new Date(when), p } : null;
      })
      .filter(Boolean);
  };
  const all = [...parse(a.raw_today || a.today || a.prices_today, 0), ...parse(a.raw_tomorrow || a.tomorrow || a.prices_tomorrow, 1)];
  const byHour = new Map();
  for (const x of all) {
    const k = new Date(x.at);
    k.setMinutes(0, 0, 0);
    const key = +k;
    if (!byHour.has(key)) byHour.set(key, []);
    byHour.get(key).push(x.p);
  }
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const out = [];
  for (let k = 0; k < 24; k++) {
    const at = new Date(+now + k * 3600e3);
    const list = byHour.get(+at);
    if (!list) break;
    out.push({ at, h: at.getHours(), p: list.reduce((s, v) => s + v, 0) / list.length });
  }
  if (!out.length && !Number.isNaN(Number(st.state))) out.push({ at: now, h: now.getHours(), p: Number(st.state) });
  return out;
}

export function priceColor(p, lo, hi) {
  const t = hi > lo ? (p - lo) / (hi - lo) : 0.5;
  return t < 0.25 ? "#3CCB83" : t < 0.5 ? "#F0C04A" : t < 0.75 ? "#F08A3A" : "#F0564A";
}

/* The cars in EV Planner: one status sensor per car with soc and target_soc. */
export function evCars(ctx) {
  const ents = ctx.hass?.entities || {};
  const out = [];
  for (const [id, e] of Object.entries(ents)) {
    if (e.platform !== "ev_planner" || !/^sensor\..+_status$/.test(id) || id.startsWith("sensor.guest")) continue;
    const s = ctx.st(id);
    if (!s || !("soc" in (s.attributes || {}))) continue;
    const dev = e.device_id && ctx.hass.devices?.[e.device_id];
    const sib = (suffix) => Object.values(ents).find((x) => x.device_id === e.device_id && x.entity_id.endsWith(suffix))?.entity_id;
    out.push({
      id,
      device: e.device_id,
      name: dev?.name_by_user || dev?.name || (s.attributes.friendly_name || id).replace(/\s*status$/i, ""),
      soc: s.attributes.soc == null ? null : Math.round(Number(s.attributes.soc)),
      target: s.attributes.target_soc,
      state: s,
      summary: sib("_summary"),
      charging: s.state === "charging",
      picture: s.attributes.entity_picture,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function ring(soc, color) {
  const n = 12, gap = 6, R = 16, segs = [];
  for (let i = 0; i < n; i++) {
    const a0 = ((i * 30 + gap / 2 - 90) * Math.PI) / 180, a1 = (((i + 1) * 30 - gap / 2 - 90) * Math.PI) / 180;
    const on = soc != null && (i + 1) * (100 / n) <= soc + 4;
    segs.push(`<path d="M${(20 + R * Math.cos(a0)).toFixed(2)} ${(20 + R * Math.sin(a0)).toFixed(2)} A${R} ${R} 0 0 1 ${(20 + R * Math.cos(a1)).toFixed(2)} ${(20 + R * Math.sin(a1)).toFixed(2)}" stroke="${on ? color : "var(--line)"}" stroke-width="5" fill="none" stroke-linecap="round"/>`);
  }
  return `<svg class="ring" viewBox="0 0 40 40" aria-hidden="true">${segs.join("")}<text x="20" y="24" text-anchor="middle">${soc == null ? "?" : soc}</text></svg>`;
}
const socColor = (soc) => (soc == null ? "var(--muted)" : soc < 25 ? "#F0564A" : soc < 50 ? "#F0A93A" : soc < 80 ? "#3CCB83" : "#11A39A");

export function hasStatus(ctx) {
  if (!ctx.on("energy") || ctx.isKid) return false;
  return dayAhead(ctx).length > 0 || evCars(ctx).length > 0;
}

/* The strip: price now with the next 24 hours, and one tile per car. */
export function statusHtml(ctx) {
  const hrs = dayAhead(ctx);
  const cars = evCars(ctx);
  let h = "";
  if (hrs.length) {
    const vals = hrs.map((x) => x.p), lo = Math.min(...vals), hi = Math.max(...vals), max = Math.max(...vals.map(Math.abs)) || 1;
    const low = hrs.reduce((a, b) => (b.p < a.p ? b : a)), high = hrs.reduce((a, b) => (b.p > a.p ? b : a));
    const unit = ctx.hass.states[ctx.data.settings.price]?.attributes?.unit_of_measurement || "kr/kWh";
    const bars = hrs
      .map((x, i) => `<span class="${i === 0 ? "now" : ""}${i && x.h === 0 ? " midnight" : ""}" style="height:${Math.max(3, (Math.abs(x.p) / max) * 30)}px;background:${priceColor(x.p, lo, hi)};animation-delay:${i * 18}ms" title="${esc(`${i && x.h < hrs[0].h ? ctx.t("i morgen") + " " : ""}${ctx.t("kl.")} ${pad(x.h)}: ${ctx.fmt.num(x.p, 2)}`)}"></span>`)
      .join("");
    const ticks = [0, 6, 12, 18, hrs.length - 1].filter((k, i, a) => k < hrs.length && a.indexOf(k) === i);
    h += `<div class="st el">
      <div class="el-now"><small>${esc(ctx.t("El nu"))}</small><b class="num" style="color:${priceColor(hrs[0].p, lo, hi)}">${ctx.fmt.num(hrs[0].p, 2)}</b><span>${esc(unit)}</span></div>
      <div class="spark-box"><div class="spark" aria-label="${esc(ctx.t("Elpris de næste 24 timer"))}">${bars}</div><div class="spark-ax">${ticks.map((k) => `<span>${k === 0 ? esc(ctx.t("nu")) : pad(hrs[k].h)}</span>`).join("")}</div></div>
      <div class="spark-notes"><span class="spark-note">${esc(ctx.t("Billigst"))} <b>${esc(ctx.t("kl."))} ${pad(low.h)}</b> · ${ctx.fmt.num(low.p, 2)}</span><span class="spark-note">${esc(ctx.t("Dyrest"))} <b>${esc(ctx.t("kl."))} ${pad(high.h)}</b> · ${ctx.fmt.num(high.p, 2)}</span></div>
    </div>`;
  }
  cars.forEach((c) => {
    const line = ctx.hass.formatEntityState ? ctx.hass.formatEntityState(c.state) : c.state.state;
    const sum = c.summary && ctx.st(c.summary);
    const l2 = sum && !["unknown", "unavailable", ""].includes(sum.state) ? sum.state : c.target != null ? ctx.t("Mål {n} %", { n: Math.round(c.target) }) : "";
    h += `<button class="st car${c.charging ? " charging" : ""}" data-act="en-car" data-id="${esc(c.id)}" aria-label="${esc(ctx.t("Åbn {name} i EV Planner", { name: c.name }))}">${ring(c.soc, socColor(c.soc))}<div class="st-text"><div class="st-main">${esc(c.name)}</div><div class="st-sub">${esc(line)}</div>${l2 ? `<div class="st-sub l2">${esc(l2)}</div>` : ""}</div>${svg("go", "ic go")}</button>`;
  });
  return h;
}

/* Opens a panel of Home Assistant's frontend, e.g. EV Planner. */
export function navigateHa(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

const acts = {
  "en-car": (el, e, ctx) => {
    const panels = ctx.hass.panels || {};
    const url = Object.keys(panels).find((p) => /ev[-_]?planner/.test(p)) || "ev-planner";
    const dev = evCars(ctx).find((c) => c.id === el.dataset.id)?.device;
    if (panels[url] || !Object.keys(panels).length) return navigateHa(`/${url}`);
    navigateHa(dev ? `/config/devices/device/${dev}` : "/config/integrations/integration/ev_planner");
  },
};

const css = `
.status { background: var(--surface); border-bottom: 1px solid var(--line); }
.status .wrap { display: grid; grid-template-columns: minmax(0, 1.6fr) repeat(auto-fit, minmax(0, 1fr)); }
.st.car { border: 0; background: none; color: inherit; text-align: left; cursor: pointer; font: inherit; }
.st.car .ring { width: 46px; height: 46px; flex: none; }
.st.car .ring text { font: 800 11px var(--font-display); fill: var(--ink); }
.st.car .go { width: 18px; height: 18px; color: var(--muted); flex: none; }
.st.car.charging .ring { animation: enpulse 2.4s ease-in-out infinite; }
@keyframes enpulse { 50% { filter: drop-shadow(0 0 6px #3CCB83); } }
.st-sub.l2 { font-size: 12px; }
@media (max-width: 760px) {
  .status .wrap { grid-template-columns: 1fr 1fr; padding-block: 4px; }
  .status .st.el { grid-column: 1 / -1; padding-right: 0; border-bottom: 1px solid var(--line); }
  .status .st.car { border-left: 0; padding-left: 0; }
  .status .st.car + .st.car { border-left: 1px solid var(--line); padding-left: 12px; }
  .status .spark-box { max-width: none; }
}
@media (max-width: 420px) { .status .spark-notes { display: none; } }
`;

const en = {
  "El nu": "Power now",
  "Elpris de næste 24 timer": "Electricity price for the next 24 hours",
  nu: "now",
  Billigst: "Cheapest",
  Dyrest: "Most expensive",
  "Mål {n} %": "Target {n} %",
  "Åbn {name} i EV Planner": "Open {name} in EV Planner",
};

export default { id: "energy", views: {}, acts, inputs: {}, css, en };
