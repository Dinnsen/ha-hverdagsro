/* Hverdagsro – electricity and cars: the strip under the sky (the prototype's buildStatus) and the car popup
   (carSheet with the price clock and EV Planner's charging box).
   Prices come from the price sensor in the settings (Energi Data Service, Nord Pool …) or from EV Planner.
   The cars come from EV Planner: its websocket (ev_planner/subscribe, vehicle_set) when it is installed, otherwise
   its entities (sensor.<car>_status with soc/target_soc, select.<car>_mode …). */
import { esc, startOfDay } from "./hv-core.js";
import { svg } from "./hv-icons.js";

const pad = (n) => String(n).padStart(2, "0");
const kr = (v) => Number(v).toFixed(2).replace(".", ",");
export const priceColor = (p) => (p < 0.4 ? "#3CCB83" : p < 0.8 ? "#F0C04A" : p < 1.1 ? "#F08A3A" : "#F0564A");
const CAR_COLORS = ["#3CCB83", "#11A39A", "#3B6BF5", "#E39A1C", "#8B5CF6"];
const EV_MODES = [["smart", "Smart", "clock"], ["charge_now", "Lad nu", "bolt"], ["pause", "Pause", "pause"], ["off", "Fra", "power"]];
const EV_DAYS = [["mon", "Man", "mandagen"], ["tue", "Tir", "tirsdagen"], ["wed", "Ons", "onsdagen"], ["thu", "Tor", "torsdagen"], ["fri", "Fre", "fredagen"], ["sat", "Lør", "lørdagen"], ["sun", "Søn", "søndagen"]];
const STATUS = {
  off: "Fra",
  paused: "Sat på pause",
  unplugged: "Ikke sat til",
  planned: "Planlagt",
  charging: "Lader",
  charging_now: "Lader nu",
  charging_low_soc: "Lavt batteri: lader",
  charging_low_price: "Billig strøm: lader",
  keeping_on: "Holder laderen tændt",
  completed: "Opladet",
  no_plan: "Ingen plan",
  charger_busy: "Laderen er optaget",
  no_soc: "Batteriniveau mangler",
  no_price_data: "Ingen prisdata",
  not_enough_prices: "Venter på priser",
  no_window: "Intet ladevindue",
  connected: "Sat til",
};
const DAY_LONG = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];

let EVP = null; // EV Planner's own state, when its websocket is there
let evpTried = false;

/* ------------------------------------------------------------------ prices */
/* Hourly prices from now and 24 hours ahead: [{ at, h (hours from today's midnight), p }]. */
export function dayAhead(ctx) {
  const t0 = startOfDay(new Date());
  const byHour = new Map();
  const put = (at, p) => {
    if (at == null || Number.isNaN(p)) return;
    const k = new Date(at);
    k.setMinutes(0, 0, 0);
    if (!byHour.has(+k)) byHour.set(+k, []);
    byHour.get(+k).push(p);
  };
  const id = ctx.data?.settings?.price;
  const st = id && ctx.hass?.states?.[id];
  if (st) {
    const a = st.attributes || {};
    const parse = (list, off) => {
      if (!Array.isArray(list)) return;
      list.forEach((x, i) => {
        if (typeof x === "number") return put(+t0 + off * 864e5 + (i * 24 * 3600e3) / list.length, x);
        put(x.hour || x.start || x.time || x.startsAt, Number(x.price ?? x.value ?? x.total));
      });
    };
    parse(a.raw_today || a.today || a.prices_today, 0);
    parse(a.raw_tomorrow || a.tomorrow || a.prices_tomorrow, 1);
  }
  if (!byHour.size && EVP?.prices) EVP.prices.forEach((x) => put(x.start, Number(x.price)));
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const out = [];
  for (let k = 0; k < 24; k++) {
    const at = new Date(+now + k * 3600e3);
    const list = byHour.get(+at);
    if (!list) break;
    out.push({ at, h: (at - t0) / 3600e3, p: list.reduce((s, v) => s + v, 0) / list.length });
  }
  if (!out.length && st && !Number.isNaN(Number(st.state))) out.push({ at: now, h: (now - t0) / 3600e3, p: Number(st.state) });
  return out;
}
const realNow = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
const hhOf = (iso) => {
  const d = new Date(iso);
  return (d - startOfDay(new Date())) / 3600e3;
};
const hm = (ctx, d) => ctx.fmt.time(d);
/* "00" for a whole hour, "00.30" otherwise, as the prototype writes "sæt stikket i inden kl. 00". */
const hShort = (d) => pad(d.getHours()) + (d.getMinutes() ? `.${pad(d.getMinutes())}` : "");

/* ------------------------------------------------------------------ cars */
async function subscribeEvp(ctx) {
  if (evpTried) return;
  evpTried = true;
  const hasEv = Object.values(ctx.hass?.entities || {}).some((e) => e.platform === "ev_planner");
  if (!hasEv) return;
  try {
    const unsub = await ctx.hass.connection.subscribeMessage(
      (msg) => {
        EVP = msg;
        ctx.panel?.refreshStatus?.();
      },
      { type: "ev_planner/subscribe" }
    );
    ctx.panel?._unsubs?.push(unsub);
  } catch (err) {
    EVP = null; // an older EV Planner without the websocket: the entities are used
  }
}

/* The cars, in one shape whether they come from EV Planner's websocket or its entities. */
export function evCars(ctx) {
  const ents = ctx.hass?.entities || {};
  const sib = (dev, suffix) => Object.values(ents).find((x) => x.device_id === dev && x.platform === "ev_planner" && x.entity_id.endsWith(suffix))?.entity_id;
  const fromEntities = [];
  for (const [id, e] of Object.entries(ents)) {
    if (e.platform !== "ev_planner" || !/^sensor\..+_status$/.test(id) || id.startsWith("sensor.guest")) continue;
    const s = ctx.st(id);
    if (!s || !("soc" in (s.attributes || {}))) continue;
    const dev = e.device_id && ctx.hass.devices?.[e.device_id];
    fromEntities.push({ id, device: e.device_id, name: dev?.name_by_user || dev?.name || String(s.attributes.friendly_name || id).replace(/\s*status$/i, ""), statusEntity: id, state: s });
  }
  const byName = (n) => fromEntities.find((c) => c.name.toLowerCase() === String(n).toLowerCase());
  if (EVP?.vehicles?.length) {
    return EVP.vehicles.map((v, i) => {
      const ent = byName(v.name);
      return {
        key: v.id,
        vehicleId: v.id,
        name: v.name,
        color: CAR_COLORS[i % CAR_COLORS.length],
        soc: v.soc == null ? null : Math.round(v.soc),
        target: v.target ?? v.settings?.target_soc,
        min: v.settings?.min_soc,
        capacity: v.capacity,
        status: v.status,
        home: v.home,
        connected: v.connected,
        charging: v.charging,
        charger: v.charger?.name || "",
        deadline: v.deadline,
        settings: v.settings || {},
        plan: v.plan,
        month: v.month,
        device: ent?.device,
        image: v.image,
      };
    });
  }
  return fromEntities.map((c, i) => {
    const a = c.state.attributes;
    const start = sib(c.device, "_plan_start"), end = sib(c.device, "_plan_end"), cost = sib(c.device, "_plan_cost");
    const val = (eid) => (eid ? ctx.st(eid)?.state : undefined);
    const ok = (v) => v != null && !["unknown", "unavailable", ""].includes(v);
    const ready = val(sib(c.device, "_ready_by"));
    return {
      key: c.id,
      vehicleId: null,
      name: c.name,
      color: CAR_COLORS[i % CAR_COLORS.length],
      soc: a.soc == null ? null : Math.round(Number(a.soc)),
      target: a.target_soc,
      min: Number(val(sib(c.device, "_minimum_level"))) || null,
      capacity: null,
      status: c.state.state,
      home: a.connected ? true : null,
      connected: !!a.connected,
      charging: c.state.state.startsWith("charging"),
      charger: "",
      deadline: a.deadline || null,
      settings: { mode: val(sib(c.device, "_mode")), use_ready_by: val(Object.values(ents).find((x) => x.device_id === c.device && x.entity_id.startsWith("switch.") && x.entity_id.endsWith("_ready_by"))?.entity_id) === "on", ready_by: ok(ready) ? String(ready).slice(0, 5) : "07:00", continuous: val(sib(c.device, "_one_period")) === "on" },
      plan: ok(val(start)) ? { start: val(start), end: ok(val(end)) ? val(end) : null, cost: Number(val(cost)) || null, segments: [{ start: val(start), end: val(end) }] } : null,
      month: { energy: Number(val(sib(c.device, "_energy_this_month"))) || 0 },
      device: c.device,
      entities: (suffix) => sib(c.device, suffix),
      summary: val(sib(c.device, "_summary")),
    };
  });
}

function dayWord(ctx, d) {
  const n = Math.round((startOfDay(d) - startOfDay(new Date())) / 864e5);
  return n === 0 ? ctx.t("i dag") : n === 1 ? ctx.t("i morgen") : ctx.t(DAY_LONG[d.getDay()]);
}
/* The plan as the prototype writes it: window, price and when. */
function planOf(ctx, c) {
  const p = c.plan;
  if (!p?.start) return null;
  const s = new Date(p.start), e = p.end ? new Date(p.end) : null;
  const night = s.getHours() < 6 && Math.round((startOfDay(s) - startOfDay(new Date())) / 864e5) === 1 && new Date().getHours() >= 12;
  const when = night ? ctx.t("i nat") : dayWord(ctx, s);
  return { s, e, when, win: `${hm(ctx, s)}–${e ? hm(ctx, e) : ""}`, cost: p.cost != null ? `${kr(p.cost)} kr` : "–" };
}
function statusText(ctx, c) {
  return ctx.t(STATUS[c.status] || c.status || "");
}
function carLines(ctx, c) {
  const pl = planOf(ctx, c);
  let l1;
  if (c.status === "unplugged" || (!c.connected && c.status !== "charging")) l1 = `${c.home === false ? ctx.t("Ude") : ctx.t("Hjemme")} · ${ctx.t("ikke sat til")}`;
  else l1 = statusText(ctx, c);
  let l2 = "";
  if (pl) l2 = ctx.t("Plan {when} {win} · {cost}", { when: pl.when, win: pl.win, cost: pl.cost });
  else if (c.deadline) {
    const d = new Date(c.deadline);
    l2 = ctx.t("Klar {day} kl. {time}", { day: dayWord(ctx, d), time: hm(ctx, d) });
  } else if (c.summary) l2 = c.summary;
  return [l1, l2];
}
function longStatus(ctx, c) {
  const pl = planOf(ctx, c);
  const base = statusText(ctx, c);
  if (c.status === "unplugged" && pl) return ctx.t("Ikke sat til · sæt stikket i inden kl. {time}", { time: hShort(new Date(pl.s)) });
  if (c.deadline) {
    const d = new Date(c.deadline);
    return `${base} · ${ctx.t("klar {day} kl. {time}", { day: dayWord(ctx, d), time: hm(ctx, d) })}`;
  }
  return base;
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

export function hasStatus(ctx) {
  subscribeEvp(ctx);
  if (!ctx.on("energy") || ctx.isKid) return false;
  return dayAhead(ctx).length > 0 || evCars(ctx).length > 0;
}

/* buildStatus: price now with the next 24 hours, and one tile per car. */
export function statusHtml(ctx) {
  const hrs = dayAhead(ctx);
  const cars = evCars(ctx);
  let h = "";
  if (hrs.length) {
    const max = Math.max(...hrs.map((x) => x.p), 0.01), nowP = hrs[0].p;
    const low = hrs.reduce((a, b) => (b.p < a.p ? b : a)), high = hrs.reduce((a, b) => (b.p > a.p ? b : a));
    const hh = (h) => pad(Math.floor(h) % 24);
    const unit = (ctx.hass.states[ctx.data.settings.price]?.attributes?.unit_of_measurement || "kr/kWh").replace(/^DKK/, "kr");
    const bars = hrs
      .map((x, i) => `<span class="${i === 0 ? "now" : ""}${x.h >= 24 && hrs[i - 1]?.h < 24 ? " midnight" : ""}" style="height:${Math.max(3, (x.p / max) * 30)}px;background:${priceColor(x.p)};animation-delay:${i * 18}ms" title="${esc(`${x.h >= 24 ? ctx.t("i morgen") + " " : ""}${ctx.t("kl.")} ${hh(x.h)}: ${kr(x.p)} kr`)}"></span>`)
      .join("");
    const ticks = [0, 6, 12, 18, 23].filter((k) => k < hrs.length);
    h += `<div class="st el">
      <div class="el-now"><small>${esc(ctx.t("El nu"))}</small><b class="num" style="color:${priceColor(nowP)}">${kr(nowP)}</b><span>${esc(unit)}</span></div>
      <div class="spark-box"><div class="spark" aria-label="${esc(ctx.t("Elpris de næste 24 timer"))}">${bars}</div><div class="spark-ax">${ticks.map((k) => `<span>${k === 0 ? esc(ctx.t("nu")) : hh(hrs[k].h)}</span>`).join("")}</div></div>
      <div class="spark-notes"><span class="spark-note">${esc(ctx.t("Billigst"))} <b>${esc(ctx.t("kl."))} ${hh(low.h)}</b> · ${kr(low.p)}</span><span class="spark-note">${esc(ctx.t("Dyrest"))} <b>${esc(ctx.t("kl."))} ${hh(high.h)}</b> · ${kr(high.p)}</span></div>
    </div>`;
  }
  cars.forEach((c, i) => {
    const [l1, l2] = carLines(ctx, c);
    h += `<button class="st car car${i + 1}" data-act="en-car" data-id="${esc(c.key)}" aria-label="${esc(ctx.t("Åbn {name} i EV Planner", { name: c.name }))}">${ring(c.soc, c.color)}<div class="st-text"><div class="st-main">${esc(c.name)}</div><div class="st-sub">${esc(l1)}</div>${l2 ? `<div class="st-sub l2">${esc(l2)}</div>` : ""}</div>${svg("go", "ic go")}</button>`;
  });
  return h;
}

/* ------------------------------------------------------------------ the car popup */
const evColor = (t) => {
  const stops = [[0, [0, 184, 148]], [0.5, [233, 185, 73]], [1, [228, 87, 46]]];
  t = Math.max(0, Math.min(1, t));
  const n = t <= 0.5 ? 0 : 1, [t0, c0] = stops[n], [t1, c1] = stops[n + 1], k = (t - t0) / (t1 - t0);
  return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(",")})`;
};
const polar = (r, h) => {
  const a = (((h / 24) * 360 - 90) * Math.PI) / 180;
  return `${(200 + r * Math.cos(a)).toFixed(2)} ${(200 + r * Math.sin(a)).toFixed(2)}`;
};
const arcD = (r, f, t) => {
  const span = Math.max(0, Math.min(23.999, t - f));
  return `M${polar(r, f)} A${r} ${r} 0 ${span > 12 ? 1 : 0} 1 ${polar(r, f + span)}`;
};
function windowOf(c) {
  const segs = c.plan?.segments?.filter((s) => s.start) || [];
  if (!segs.length) return null;
  return [hhOf(segs[0].start), hhOf(segs[segs.length - 1].end || segs[0].start)];
}
function priceClock(ctx, c) {
  const nowH = realNow(), hrs = dayAhead(ctx), vals = hrs.map((x) => x.p), mn = Math.min(...vals), mx = Math.max(...vals);
  let s = `<defs><linearGradient id="evp-win" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#00B894"/><stop offset="1" stop-color="#A3E635"/></linearGradient><filter id="evp-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter></defs><circle cx="200" cy="200" r="118" class="face"/>`;
  for (let h = 0; h < 24; h++) s += `<path d="M${polar(196, h)} L${polar(h % 6 ? 192 : 188, h)}" class="tick${h % 6 ? "" : " major"}"/>`;
  [0, 6, 12, 18].forEach((h) => {
    const [x, y] = polar(106, h).split(" ");
    s += `<text x="${x}" y="${y}" class="hour" dominant-baseline="central" text-anchor="middle">${pad(h)}</text>`;
  });
  hrs.forEach((x, i) => {
    const f = Math.max(x.h, nowH), t = x.h + 1, k = mx > mn ? (x.p - mn) / (mx - mn) : 0.5, r = 150 + k * 34, g = Math.min(0.04, (t - f) * 0.12);
    s += `<path class="bar" style="fill:${evColor(k)};animation-delay:${i * 22}ms" d="M${polar(142, f + g)} L${polar(r, f + g)} A${r} ${r} 0 0 1 ${polar(r, t - g)} L${polar(142, t - g)} A142 142 0 0 0 ${polar(142, f + g)}Z"><title>${esc(ctx.t("kl."))} ${pad(Math.floor(x.h) % 24)}: ${kr(x.p)} kr</title></path>`;
  });
  const win = windowOf(c);
  if (win) {
    const past = win[1] < nowH, d = arcD(128, win[0], win[1]);
    if (!past) s += `<path d="${d}" class="window-glow" filter="url(#evp-glow)"/>`;
    s += `<path d="${d}" class="window${past ? " past" : ""}" pathLength="1"/>`;
  }
  const [nx, ny] = polar(196, nowH).split(" ");
  s += `<path d="M${polar(112, nowH)} L${polar(196, nowH)}" class="needle"/><circle cx="${nx}" cy="${ny}" r="4.5" class="needle-dot"/>`;
  return s;
}
function clockCenter(ctx, c) {
  const pl = planOf(ctx, c), win = windowOf(c);
  if (pl && win) return `<strong>${esc(pl.cost)}</strong><span>${esc(pl.win)}</span>${win[1] < realNow() ? `<em>${esc(ctx.t("Planen er slut"))}</em>` : ""}`;
  const hrs = dayAhead(ctx);
  if (!hrs.length) return `<strong>–</strong><span>${esc(ctx.t("Pris nu"))}</span>`;
  const low = hrs.reduce((a, b) => (b.p < a.p ? b : a), hrs[0]);
  return `<strong>${kr(hrs[0].p)} kr</strong><span>${esc(ctx.t("Pris nu"))}</span><em>${esc(ctx.t("Billigst kl. {t}", { t: `${pad(Math.floor(low.h) % 24)}.00` }))}</em>`;
}

/* Writes a change to EV Planner: its websocket, or the car's entities. */
async function setCar(ctx, c, settings) {
  if (c.vehicleId) {
    try {
      await ctx.hass.callWS({ type: "ev_planner/vehicle_set", vehicle_id: c.vehicleId, settings });
      return true;
    } catch (err) {
      ctx.toast(String(err?.message || err));
      return false;
    }
  }
  const e = c.entities;
  if (!e) return false;
  const jobs = [];
  if ("mode" in settings && e("_mode")) jobs.push(ctx.call("select", "select_option", { entity_id: e("_mode"), option: settings.mode }));
  if ("target_soc" in settings && e("_target")) jobs.push(ctx.call("number", "set_value", { entity_id: e("_target"), value: settings.target_soc }));
  if ("continuous" in settings && e("_one_period")) jobs.push(ctx.call("switch", settings.continuous ? "turn_on" : "turn_off", { entity_id: e("_one_period") }));
  const sw = Object.values(ctx.hass.entities).find((x) => x.device_id === c.device && x.entity_id.startsWith("switch.") && x.entity_id.endsWith("_ready_by"))?.entity_id;
  const tm = Object.values(ctx.hass.entities).find((x) => x.device_id === c.device && x.entity_id.startsWith("time.") && x.entity_id.endsWith("_ready_by"))?.entity_id;
  if ("use_ready_by" in settings && sw) jobs.push(ctx.call("switch", settings.use_ready_by ? "turn_on" : "turn_off", { entity_id: sw }));
  if ("ready_by" in settings && tm) jobs.push(ctx.call("time", "set_value", { entity_id: tm, time: `${settings.ready_by}:00` }));
  return (await Promise.all(jobs)).every(Boolean);
}

function carSheet(ctx, key) {
  const c = evCars(ctx).find((x) => x.key === key);
  if (!c) return;
  const pl = planOf(ctx, c);
  const S = {
    soc: c.soc ?? 0,
    target: Math.round(c.settings.target_soc ?? c.target ?? 80),
    min: Math.round(c.settings.min_soc ?? c.min ?? 0),
    cap: c.capacity || 0,
    mode: c.settings.mode || "smart",
    useReady: !!c.settings.use_ready_by,
    ready: c.settings.ready_by || "07:00",
    sched: { ...(c.settings.schedule || {}) },
    cont: !!c.settings.continuous,
  };
  const kwh = (v) => `${v.toFixed(1).replace(".", ",")} kWh`;
  const gain = () => Math.max(0, (S.cap * (S.target - S.soc)) / 100);
  const s = ctx.sheet(
    `<div class="evp-brand">${svg("bolt")}EV PLANNER</div>
    <div class="evp-head"><div style="min-width:0"><h2>${esc(c.name)}</h2><div class="t-sub">${esc(c.charger || "")}</div></div><span class="batt">${svg("battery")}${c.soc == null ? esc(ctx.t("Ukendt")) : `${c.soc} %`}</span></div>
    <div class="cs-grid"><div class="cs-left">
      <div class="dial-wrap"><svg class="dial" viewBox="0 0 400 400" role="img" aria-label="${esc(ctx.t("Prisur for det næste døgn"))}">${priceClock(ctx, c)}</svg><div class="dial-center">${clockCenter(ctx, c)}</div></div>
      <div class="status-pill${c.charging || c.status === "keeping_on" ? " on" : ""}" id="cb-status"><i></i><span>${esc(longStatus(ctx, c))}</span></div>
      <div class="evp-plan"><div><small>${esc(ctx.t("Plan"))}</small><b>${esc(pl ? pl.win : ctx.t("Venter"))}</b></div><div><small>${esc(ctx.t("Pris"))}</small><b>${esc(pl ? pl.cost : "–")}</b></div><div><small>${esc(ctx.t("Behov"))}</small><b id="cb-need">${S.cap ? kwh(gain()) : c.plan?.energy != null ? kwh(Number(c.plan.energy)) : "–"}</b></div></div>
    </div><section class="cb" id="cb" style="--cc:${c.color}"></section></div>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button><button class="btn" id="evp-open">${esc(ctx.t("Åbn i EV Planner ›"))}</button></div>
    <p class="t-sub" style="margin-top:12px">${esc(ctx.t("Ændringer her skrives direkte til EV Planner, som lægger en ny plan. Regler og beskeder findes i EV Planner."))}</p>`
  );
  s.el.classList.add("car-sheet");
  const box = s.el.querySelector("#cb");
  let pickDay = null, customReady = false, saveT;
  const hhmm = (t) => String(t).slice(0, 5).replace(":", ctx.lang() === "da" ? "." : ":");
  const saved = (msg) => {
    const st = s.el.querySelector("#cb-status");
    st.classList.add("replan");
    st.querySelector("span").textContent = ctx.t("EV Planner lægger en ny plan …");
    const need = s.el.querySelector("#cb-need");
    if (S.cap) need.textContent = kwh(gain());
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      st.classList.remove("replan");
      st.querySelector("span").textContent = S.mode === "off" ? ctx.t("Slået fra") : S.mode === "pause" ? ctx.t("Sat på pause") : S.mode === "charge_now" ? ctx.t("Lader, så snart stikket er i") : longStatus(ctx, c);
    }, 1400);
    ctx.toast(`${c.name}: ${msg}`);
  };
  const write = (settings, msg) => setCar(ctx, c, settings).then((ok) => ok && saved(msg));
  const batParts = () => `<i class="cb-now" style="width:${S.soc}%"></i><i class="cb-tgt" style="left:${S.soc}%;width:${Math.max(0, S.target - S.soc)}%"></i><i class="cb-flow${S.mode === "charge_now" ? " on" : ""}" style="left:${S.soc}%;width:${Math.max(0, S.target - S.soc)}%"></i>
      <span class="cb-ticks">${[20, 40, 60, 80].map((v) => `<i style="left:${v}%"></i>`).join("")}</span><i class="cb-min" style="left:${S.min}%" title="${esc(ctx.t("Minimum {n} %", { n: S.min }))}"></i>
      <span class="cb-h now" style="left:${S.soc}%" data-l="${S.soc} %"></span><button class="cb-h tgt" role="slider" aria-label="${esc(ctx.t("Mål"))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${S.target}" style="left:${S.target}%" data-l="${S.target} %"></button>`;
  const paint = () => {
    const sched = EV_DAYS.map(([d, n]) => {
      const v = S.sched[d] || "default", shown = v === "default" ? hhmm(S.ready) : v === "none" ? "–" : hhmm(v);
      return `<button class="cb-day ${v === "default" ? "std" : v === "none" ? "none" : "own"}${pickDay === d ? " open" : ""}" data-day="${d}" aria-expanded="${pickDay === d}" ${S.useReady && c.vehicleId ? "" : "disabled"}><b>${esc(ctx.t(n))}</b><span>${shown}</span></button>`;
    }).join("");
    const pd = pickDay && EV_DAYS.find((x) => x[0] === pickDay), pv = pickDay ? S.sched[pickDay] || "default" : null, own = pv && pv !== "default" && pv !== "none";
    const preset = ["06:00", "07:00", "08:00"].includes(S.ready), cust = customReady || (S.useReady && !preset);
    box.innerHTML = `<h3>${svg("bolt")}<span>${esc(ctx.t("Opladning"))}</span></h3>
      <div class="cb-modes" role="radiogroup" aria-label="${esc(ctx.t("Tilstand"))}">${EV_MODES.map(([k, n, ic]) => `<button role="radio" data-mode="${k}" aria-checked="${S.mode === k}" class="m-${k}">${svg(ic)}<span>${esc(ctx.t(n))}</span></button>`).join("")}</div>
      <div class="cb-bat${S.mode === "off" || S.mode === "pause" ? " dim" : ""}"><div class="cb-cells" id="cb-cells">${batParts()}</div><span class="cb-nub"></span></div>
      <div class="cb-leg"><span>${esc(ctx.t("Nu"))} <b>${S.soc} %</b></span><span class="cb-gain">${S.cap && gain() > 0 ? esc(ctx.t("+{kwh} i batteriet", { kwh: kwh(gain()) })) : ""}</span><span>${esc(ctx.t("Mål"))} <b id="cb-tl">${S.target} %</b></span></div>
      <p class="cb-hint">${esc(ctx.t("Nu-niveauet kommer fra bilen. Træk i målet."))}</p>
      <div class="cb-f"><span class="lbl">${esc(ctx.t("Klar kl."))}</span><div class="cb-chips">${["06:00", "07:00", "08:00"].map((t) => `<button data-ready="${t}" aria-pressed="${S.useReady && S.ready === t && !cust}">${hhmm(t)}</button>`).join("")}${cust ? `<label class="cb-time${S.useReady ? " on" : ""}"><input type="time" step="900" value="${S.ready}" id="cb-rt" aria-label="${esc(ctx.t("Klar kl."))}"></label>` : `<button data-ready="custom">${esc(ctx.t("Andet"))}</button>`}<button data-ready="none" class="none" aria-pressed="${!S.useReady}">${esc(ctx.t("Ingen frist"))}</button></div></div>
      ${c.vehicleId ? `<div class="cb-f"><span class="lbl">${esc(ctx.t("Ugeplan"))}</span><div class="cb-week${S.useReady ? "" : " dim"}">${sched}</div>${S.useReady ? "" : `<small class="cb-hint">${esc(ctx.t("Vælg et klar-tidspunkt for at bruge ugeplanen."))}</small>`}
        ${pd ? `<div class="cb-pick"><p>${esc(ctx.t("Klar kl. om {day}", { day: ctx.t(pd[2]) }))}</p><div class="cb-chips"><button data-sv="default" aria-pressed="${pv === "default"}">${esc(ctx.t("Standard ({t})", { t: hhmm(S.ready) }))}</button><label class="cb-time${own ? " on" : ""}"><input type="time" step="900" value="${own ? pv : S.ready}" id="cb-st" aria-label="${esc(ctx.t("Andet tidspunkt"))}"></label><button data-sv="none" class="none" aria-pressed="${pv === "none"}">${esc(ctx.t("Ingen frist"))}</button></div></div>` : ""}</div>` : ""}
      <div class="cb-f"><span class="lbl">${esc(ctx.t("Plan"))}</span><div class="seg cb-seg">${[[true, "Én periode"], [false, "Billigste perioder"]].map(([v, n]) => `<button data-cont="${v}" aria-pressed="${S.cont === v}">${esc(ctx.t(n))}</button>`).join("")}</div></div>`;
  };
  paint();
  box.addEventListener("click", (e) => {
    const m = e.target.closest("[data-mode]");
    if (m) {
      S.mode = m.dataset.mode;
      paint();
      return write({ mode: S.mode }, ctx.t(EV_MODES.find((x) => x[0] === S.mode)[1]));
    }
    const r = e.target.closest("[data-ready]");
    if (r) {
      const t = r.dataset.ready;
      if (t === "custom") {
        customReady = true;
        paint();
        box.querySelector("#cb-rt")?.focus({ preventScroll: true });
        return;
      }
      if (t === "none") {
        S.useReady = false;
        customReady = false;
        pickDay = null;
        paint();
        return write({ use_ready_by: false }, ctx.t("ingen frist"));
      }
      S.useReady = true;
      S.ready = t;
      customReady = false;
      paint();
      return write({ use_ready_by: true, ready_by: t }, ctx.t("klar kl. {t}", { t: hhmm(t) }));
    }
    const d = e.target.closest("[data-day]");
    if (d) {
      pickDay = pickDay === d.dataset.day ? null : d.dataset.day;
      paint();
      return;
    }
    const sv = e.target.closest("[data-sv]");
    if (sv) {
      if (sv.dataset.sv === "default") delete S.sched[pickDay];
      else S.sched[pickDay] = "none";
      const day = pickDay;
      paint();
      return write({ schedule: { [day]: sv.dataset.sv } }, `${ctx.t(EV_DAYS.find((x) => x[0] === day)[2])}: ${sv.dataset.sv === "none" ? ctx.t("ingen frist") : ctx.t("standard")}`);
    }
    const ct = e.target.closest("[data-cont]");
    if (ct) {
      S.cont = ct.dataset.cont === "true";
      paint();
      return write({ continuous: S.cont }, S.cont ? ctx.t("én periode") : ctx.t("billigste perioder"));
    }
  });
  box.addEventListener("change", (e) => {
    if (e.target.id === "cb-rt" && e.target.value) {
      S.useReady = true;
      S.ready = e.target.value;
      paint();
      write({ use_ready_by: true, ready_by: S.ready }, ctx.t("klar kl. {t}", { t: hhmm(S.ready) }));
    }
    if (e.target.id === "cb-st" && e.target.value) {
      const day = pickDay;
      S.sched[day] = e.target.value;
      paint();
      write({ schedule: { [day]: e.target.value } }, `${ctx.t(EV_DAYS.find((x) => x[0] === day)[2])}: ${ctx.t("klar kl. {t}", { t: hhmm(e.target.value) })}`);
    }
  });
  // Drag the target (mouse, finger and arrow keys).
  const setT = (v, final) => {
    S.target = Math.max(10, Math.min(100, Math.round(v)));
    const cells = box.querySelector("#cb-cells"), w = `${Math.max(0, S.target - S.soc)}%`;
    cells.querySelector(".cb-tgt").style.width = w;
    cells.querySelector(".cb-flow").style.width = w;
    const h = cells.querySelector(".cb-h.tgt");
    h.style.left = `${S.target}%`;
    h.dataset.l = `${S.target} %`;
    h.setAttribute("aria-valuenow", S.target);
    box.querySelector("#cb-tl").textContent = `${S.target} %`;
    box.querySelector(".cb-gain").textContent = S.cap && gain() > 0 ? ctx.t("+{kwh} i batteriet", { kwh: kwh(gain()) }) : "";
    if (final) write({ target_soc: S.target }, ctx.t("mål {n} %", { n: S.target }));
  };
  let dragging = false;
  const fromX = (x) => {
    const r = box.querySelector("#cb-cells").getBoundingClientRect();
    return ((x - r.left) / r.width) * 100;
  };
  box.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("#cb-cells")) return;
    dragging = true;
    e.preventDefault();
    box.querySelector("#cb-cells").setPointerCapture?.(e.pointerId);
    box.classList.add("dragging");
    setT(fromX(e.clientX));
  });
  box.addEventListener("pointermove", (e) => dragging && setT(fromX(e.clientX)));
  const end = () => {
    if (!dragging) return;
    dragging = false;
    box.classList.remove("dragging");
    setT(S.target, true);
  };
  box.addEventListener("pointerup", end);
  box.addEventListener("pointercancel", end);
  box.addEventListener("keydown", (e) => {
    if (!e.target.classList.contains("tgt")) return;
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (!k) return;
    e.preventDefault();
    setT(S.target + k);
    clearTimeout(box._kt);
    box._kt = setTimeout(() => setT(S.target, true), 600);
    box.querySelector(".cb-h.tgt").focus({ preventScroll: true });
  });
  s.el.querySelector("#evp-open").addEventListener("click", () => {
    s.close();
    const panels = ctx.hass.panels || {};
    const url = Object.keys(panels).find((p) => /ev[-_]?planner/.test(p)) || "ev-planner";
    navigateHa(`/${url}`);
  });
}

/* Opens a page of Home Assistant's frontend, e.g. EV Planner. */
export function navigateHa(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

/* For the timeline and "Næste": today's (and tonight's) charging plans, [{ s (hours from today 00), t, c }]. */
export function evTimeline(ctx) {
  const out = [];
  evCars(ctx).forEach((c) => {
    const w = windowOf(c);
    if (!w || w[0] > 30 || w[1] < realNow()) return;
    const s = new Date(c.plan.segments[0].start);
    out.push({ s: Math.min(w[0], 23.75), t: ctx.t("{name} lader fra kl. {t}", { name: c.name.split(" ")[0], t: pad(s.getHours()) + (s.getMinutes() ? `.${pad(s.getMinutes())}` : "") }), c: c.color, adult: true });
  });
  return out;
}

const acts = {
  "en-car": (el, e, ctx) => carSheet(ctx, el.dataset.id),
};

const css = `
.st.car .ring { width: 46px; height: 46px; flex: none; }
.st.car .ring text { font: 800 11px var(--font-display); fill: var(--ink); }
`;

const en = {
  "El nu": "Power now",
  "Elpris de næste 24 timer": "Electricity price for the next 24 hours",
  nu: "now",
  Billigst: "Cheapest",
  Dyrest: "Most expensive",
  "Åbn {name} i EV Planner": "Open {name} in EV Planner",
  "i nat": "tonight",
  søndag: "Sunday",
  mandag: "Monday",
  tirsdag: "Tuesday",
  onsdag: "Wednesday",
  torsdag: "Thursday",
  fredag: "Friday",
  lørdag: "Saturday",
  Ude: "Away",
  Hjemme: "Home",
  "ikke sat til": "not plugged in",
  "Plan {when} {win} · {cost}": "Plan {when} {win} · {cost}",
  "Klar {day} kl. {time}": "Ready {day} at {time}",
  "klar {day} kl. {time}": "ready {day} at {time}",
  "Ikke sat til · sæt stikket i inden kl. {time}": "Not plugged in · plug in before {time}",
  Fra: "Off",
  "Sat på pause": "Paused",
  "Ikke sat til": "Not plugged in",
  Planlagt: "Planned",
  Lader: "Charging",
  "Lader nu": "Charging now",
  "Lavt batteri: lader": "Low battery: charging",
  "Billig strøm: lader": "Cheap power: charging",
  "Holder laderen tændt": "Keeping the charger on",
  Opladet: "Charged",
  "Ingen plan": "No plan",
  "Laderen er optaget": "The charger is busy",
  "Batteriniveau mangler": "Battery level missing",
  "Ingen prisdata": "No price data",
  "Venter på priser": "Waiting for prices",
  "Intet ladevindue": "No charging window",
  "Sat til": "Plugged in",
  Ukendt: "Unknown",
  "Prisur for det næste døgn": "Price clock for the next 24 hours",
  Plan: "Plan",
  Venter: "Waiting",
  Pris: "Price",
  Behov: "Needed",
  "Åbn i EV Planner ›": "Open in EV Planner ›",
  "Ændringer her skrives direkte til EV Planner, som lægger en ny plan. Regler og beskeder findes i EV Planner.": "Changes here go straight to EV Planner, which makes a new plan. Rules and messages are in EV Planner.",
  "EV Planner lægger en ny plan …": "EV Planner is making a new plan …",
  "Slået fra": "Turned off",
  "Lader, så snart stikket er i": "Charges as soon as it's plugged in",
  "Minimum {n} %": "Minimum {n} %",
  Mål: "Target",
  Opladning: "Charging",
  Tilstand: "Mode",
  Smart: "Smart",
  "Lad nu": "Charge now",
  Pause: "Pause",
  Nu: "Now",
  "+{kwh} i batteriet": "+{kwh} in the battery",
  "Nu-niveauet kommer fra bilen. Træk i målet.": "The level now comes from the car. Drag the target.",
  "Klar kl.": "Ready by",
  Andet: "Other",
  "Ingen frist": "No deadline",
  Ugeplan: "Week plan",
  "Vælg et klar-tidspunkt for at bruge ugeplanen.": "Choose a ready-by time to use the week plan.",
  "Klar kl. om {day}": "Ready by on {day}",
  "Standard ({t})": "Default ({t})",
  "Andet tidspunkt": "Other time",
  "Én periode": "One period",
  "Billigste perioder": "Cheapest periods",
  "ingen frist": "no deadline",
  "klar kl. {t}": "ready by {t}",
  standard: "default",
  "én periode": "one period",
  "billigste perioder": "cheapest periods",
  "mål {n} %": "target {n} %",
  "Planen er slut": "The plan is over",
  "Pris nu": "Price now",
  "Billigst kl. {t}": "Cheapest at {t}",
  mandagen: "Monday",
  tirsdagen: "Tuesday",
  onsdagen: "Wednesday",
  torsdagen: "Thursday",
  fredagen: "Friday",
  lørdagen: "Saturday",
  søndagen: "Sunday",
  Man: "Mon",
  Tir: "Tue",
  Ons: "Wed",
  Tor: "Thu",
  Fre: "Fri",
  Lør: "Sat",
  Søn: "Sun",
  "{name} lader fra kl. {t}": "{name} charges from {t}",
};

export default { id: "energy", views: {}, acts, inputs: {}, css, en };
