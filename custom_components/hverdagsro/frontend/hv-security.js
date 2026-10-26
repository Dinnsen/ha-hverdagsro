/* Hverdagsro – Sikkerhed: the alarm, the live plan of the house, doors, windows and locks, the cameras and
   what happened in the last day. A port of the prototype's pSec, alarmSheet and camSheet. */
import * as House from "./hv-house.js";

/* Alarm modes: [state, name, icon, colour, description, supported_features bit, service] */
const AL_MODES = [
  ["armed_home", "Hjemme", "home", "#3B6BF5", "Skal-sikring, I er hjemme", 1, "alarm_arm_home"],
  ["armed_away", "Ude", "walk", "#E5484D", "Hele huset, ingen hjemme", 2, "alarm_arm_away"],
  ["armed_night", "Nat", "moon", "#7B5CFF", "Skal-sikring om natten", 4, "alarm_arm_night"],
  ["armed_vacation", "Ferie", "sun", "#11A39A", "Som ude, mens I er væk længe", 32, "alarm_arm_vacation"],
  ["armed_custom_bypass", "Egen", "shield", "#E4568C", "Egne sensorer", 16, "alarm_arm_custom_bypass"],
];
const AL_STATE = {
  disarmed: ["Frakoblet", "var(--good)"],
  armed_home: ["Tilkoblet · hjemme", "#3B6BF5"],
  armed_away: ["Tilkoblet · ude", "#E5484D"],
  armed_night: ["Tilkoblet · nat", "#7B5CFF"],
  armed_vacation: ["Tilkoblet · ferie", "#11A39A"],
  armed_custom_bypass: ["Tilkoblet · egen", "#E4568C"],
  arming: ["Tilkobler …", "var(--warn)"],
  pending: ["Venter …", "var(--warn)"],
  disarming: ["Frakobler …", "var(--warn)"],
  triggered: ["Alarm!", "var(--bad)"],
  unavailable: ["Alarmen svarer ikke", "var(--muted)"],
  unknown: ["Alarmen svarer ikke", "var(--muted)"],
};

/* Sensors the page cares about: [kind, icon, Danish name] */
const KIND = {
  door: ["door", "Dør"],
  window: ["window", "Vindue"],
  port: ["garage", "Port"],
  lock: ["lock", "Lås"],
  smoke: ["smoke", "Røgalarm"],
  leak: ["drop", "Vandføler"],
  motion: ["walk", "Bevægelse"],
};
const DC_KIND = { door: "door", garage_door: "port", opening: "door", window: "window", smoke: "smoke", gas: "smoke", carbon_monoxide: "smoke", moisture: "leak", motion: "motion", occupancy: "motion" };

let tab = "huset"; // narrow screens: huset | kamera | haendelser
let filter = "alle";
let camTimer = null;

const H = (name) => (typeof House[name] === "function" ? House[name] : null);
const houseData = (ctx) => {
  try {
    return H("houseModel")?.(ctx) || ctx.data.house || {};
  } catch (e) {
    return ctx.data.house || {};
  }
};
const hasHouse = (ctx) => {
  const empty = H("houseEmpty");
  if (empty) {
    try {
      return !empty(ctx);
    } catch (e) {
      /* fall through */
    }
  }
  const h = ctx.data.house || {};
  return !!((h.rooms || []).length || (h.walls || []).length);
};

/* ------------------------------------------------------------------ the sensors */
function sensors(ctx) {
  const out = [];
  const seen = new Set();
  const add = (ent, kind, name) => {
    if (!ent || seen.has(ent) || !ctx.hass.states[ent]) return;
    seen.add(ent);
    out.push({ ent, kind, name: name || ctx.name(ent) });
  };
  const items = (houseData(ctx).items || []).filter((i) => i && i.ent);
  for (const it of houseData(ctx).items || []) {
    if (!it) continue;
    if (it.type === "door" || it.type === "window") add(it.ent, it.type, it.name);
    else if (it.type === "port") add(it.ent, "port", it.name);
    else if (it.type === "smoke") add(it.ent, "smoke", it.name);
    else if (it.type === "leak") add(it.ent, "leak", it.name);
    else if (it.type === "motion") add(it.ent, "motion", it.name);
    if (it.lock) add(it.lock, "lock", it.lockName || `${it.name} · ${ctx.t("lås")}`);
  }
  if (!items.length) {
    for (const id of ctx.entities("binary_sensor")) {
      const k = DC_KIND[ctx.hass.states[id].attributes.device_class];
      if (k && !ctx.hass.entities?.[id]?.hidden) add(id, k);
    }
    for (const id of ctx.entities("cover")) if (["garage", "gate", "door"].includes(ctx.hass.states[id].attributes.device_class)) add(id, "port");
    for (const id of ctx.entities("lock")) add(id, "lock");
  }
  return out;
}
function sState(ctx, s) {
  const st = ctx.st(s.ent);
  const v = st?.state;
  if (!st || v === "unavailable" || v === "unknown") return { txt: ctx.t("Svarer ikke"), cls: "warn", bad: false, off: true };
  if (s.kind === "lock") {
    if (v === "locked") return { txt: ctx.t("Låst"), cls: "ok" };
    if (v === "jammed") return { txt: ctx.t("Sidder fast"), cls: "bad", bad: true };
    if (v === "locking" || v === "unlocking") return { txt: v === "locking" ? ctx.t("Låser …") : ctx.t("Låser op …"), cls: "warn" };
    return { txt: ctx.t("Ulåst"), cls: "bad", bad: true };
  }
  if (s.kind === "port" && s.ent.startsWith("cover.")) {
    if (v === "closed") return { txt: ctx.t("Lukket"), cls: "ok" };
    if (v === "opening" || v === "closing") return { txt: v === "opening" ? ctx.t("Åbner …") : ctx.t("Lukker …"), cls: "warn", bad: true };
    return { txt: ctx.t("Åben"), cls: "bad", bad: true };
  }
  const on = v === "on" || v === "open";
  if (s.kind === "smoke") return on ? { txt: ctx.t("Røg!"), cls: "bad", bad: true } : { txt: ctx.t("OK"), cls: "ok" };
  if (s.kind === "leak") return on ? { txt: ctx.t("Vand!"), cls: "bad", bad: true } : { txt: ctx.t("Tør"), cls: "ok" };
  if (s.kind === "motion") return on ? { txt: ctx.t("Bevægelse nu"), cls: "live" } : { txt: ctx.t("Rolig"), cls: "ok" };
  return on ? { txt: s.kind === "window" ? ctx.t("Åbent") : ctx.t("Åben"), cls: "bad", bad: true } : { txt: ctx.t("Lukket"), cls: "ok" };
}
const since = (ctx, id) => {
  const s = ctx.hass.states[id];
  return s?.last_changed ? `${ctx.fmt.rel(s.last_changed)} ${ctx.fmt.time(s.last_changed)}` : "";
};

/* ------------------------------------------------------------------ the alarm (the prototype's alarmSheet) */
const alarmId = (ctx) => ctx.data?.settings?.alarm || null;
function alarmLook(ctx) {
  const id = alarmId(ctx);
  const s = id && ctx.st(id);
  if (!s) return null;
  const [label, color] = AL_STATE[s.state] || [s.state, "var(--muted)"];
  const armed = !["disarmed", "unavailable", "unknown"].includes(s.state);
  return { s, label: ctx.t(label), color, armed };
}
const rights = (ctx) => ({ code_arm: false, kids_arm: true, kids_disarm: false, modes: [], ...(ctx.data?.settings?.alarm_rights || {}) });
/* The arm modes Alarmo has (supported_features) and the parents chose to show. */
function alarmModes(ctx, s) {
  const f = s.attributes.supported_features;
  const R = rights(ctx);
  return AL_MODES.filter((m) => (f == null || f & m[5]) && (!R.modes.length || R.modes.includes(m[0])));
}
const platformName = (ctx, id, fallback) => {
  const p = ctx.platform(id);
  return p ? p.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : fallback;
};

function alarmSheet(ctx, modeFirst) {
  const { t, esc, svg } = ctx;
  const id = alarmId(ctx);
  if (!id || !ctx.hass.states[id]) {
    if (ctx.isParent) ctx.go("indstillinger:hjemmet");
    else ctx.toast(t("Der er ikke valgt en alarm"));
    return;
  }
  const L = alarmLook(ctx);
  const s = L.s;
  const R = rights(ctx);
  const kid = !!ctx.isKid;
  const canArm = !kid || R.kids_arm, canDisarm = !kid || R.kids_disarm;
  const by = s.attributes.changed_by;
  const at = s.last_changed ? ctx.fmt.time(new Date(s.last_changed)) : "";
  const open = sensors(ctx).filter((x) => ["door", "window", "port"].includes(x.kind) && sState(ctx, x).bad).length;
  const sub = `${by ? t("Sidst ændret af {name} kl. {time}", { name: by, time: at }) : t("Sidst ændret kl. {time}", { time: at })} · ${open ? t("{n} åbne vinduer og døre", { n: open }) : t("alle vinduer og døre er lukkede")}`;
  const sheet = ctx.sheet(`<div class="al" style="--ac:${L.color}">
    <div class="al-head"><span class="al-shield${L.armed ? " armed" : ""}">${svg("shieldf")}</span><div><div class="eyebrow">${esc(platformName(ctx, id, ctx.name(id)))}</div><h2>${esc(L.label)}</h2><div class="t-sub">${esc(sub)}</div></div></div>
    <div class="al-step"></div></div>`);
  const step = sheet.el.querySelector(".al-step");
  let mode = modeFirst || null, code = "", timer = null;
  const fmt = s.attributes.code_format;
  // Like the prototype's ALARM_SET: the code is always asked for to disarm, and to arm only when the parents chose so.
  const needCode = (m) => (m === "disarm" ? true : !!R.code_arm);
  const paintModes = () => {
    if (L.armed)
      step.innerHTML = canDisarm
        ? `<button class="al-mode big" data-m="disarm" style="--mc:var(--good)">${svg("shield")}<b>${esc(t("Frakobl"))}</b><small>${esc(t("Kræver kode"))}</small></button>`
        : `<p class="t-sub">${esc(t("Kun far eller mor kan frakoble alarmen."))}</p>`;
    else {
      const modes = alarmModes(ctx, s);
      step.innerHTML = !canArm
        ? `<p class="t-sub">${esc(t("Du kan ikke tilkoble alarmen."))}</p>`
        : modes.length
          ? `<div class="al-modes" style="--n:${modes.length}">${modes.map(([m, n, ic, c, d]) => `<button class="al-mode" data-m="${m}" style="--mc:${c}">${svg(ic)}<b>${esc(t(n))}</b><small>${esc(t(d))}</small></button>`).join("")}</div>`
          : `<p class="t-sub">${esc(t("Alarmen kan ikke tilkobles herfra."))}</p>`;
    }
  };
  const paintPad = () => {
    const what = mode === "disarm" ? t("Skriv koden for at frakoble") : t("Skriv koden for at tilkoble · {mode}", { mode: t(AL_MODES.find((m) => m[0] === mode)[1]).toLowerCase() });
    if (fmt === "text") {
      step.innerHTML = `<div class="t-sub" style="justify-content:center;margin-top:6px">${esc(what)}</div><form class="sec-codef"><input type="password" autocomplete="off" class="sec-code" aria-label="${esc(t("Kode"))}"><button class="btn">${esc(t("OK"))}</button></form>`;
      const f = step.querySelector("form");
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        code = f.querySelector("input").value;
        if (code) apply();
      });
      setTimeout(() => f.querySelector("input")?.focus(), 50);
      return;
    }
    step.innerHTML = `<div class="t-sub" style="justify-content:center;margin-top:6px">${esc(what)}</div><div class="pin-dots" id="ad">${"<i></i>".repeat(4)}</div><div class="pinpad" id="ap">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"]
      .map((n) => (n === "" ? "<span></span>" : `<button data-n="${n}" aria-label="${n === "⌫" ? esc(t("Slet")) : n}">${n}</button>`))
      .join("")}</div>`;
  };
  const dots = () => {
    const d = step.querySelector("#ad");
    if (!d) return;
    d.innerHTML = "<i></i>".repeat(Math.max(4, code.length));
    d.querySelectorAll("i").forEach((x, i) => x.classList.toggle("on", i < code.length));
  };
  const apply = async () => {
    const data = { entity_id: id };
    if (code) data.code = code;
    const service = mode === "disarm" ? "alarm_disarm" : AL_MODES.find((m) => m[0] === mode)[6];
    try {
      await ctx.hass.callService("alarm_control_panel", service, data);
      sheet.close();
      ctx.toast(mode === "disarm" ? t("Alarmen er frakoblet") : t("Alarmen tilkobles · {mode}", { mode: t(AL_MODES.find((m) => m[0] === mode)[1]).toLowerCase() }));
    } catch (err) {
      code = "";
      const d = step.querySelector("#ad");
      if (d) {
        dots();
        d.classList.remove("shake");
        void d.offsetWidth;
        d.classList.add("shake");
      }
      const inp = step.querySelector(".sec-code");
      if (inp) inp.value = "";
      ctx.toast(/code|kode/i.test(err?.message || "") ? t("Forkert kode") : t("Alarmen svarede ikke: {error}", { error: err?.message || err }));
    }
  };
  step.addEventListener("click", (e) => {
    const n = e.target.closest("[data-n]");
    if (n) {
      clearTimeout(timer);
      code = n.dataset.n === "⌫" ? code.slice(0, -1) : (code + n.dataset.n).slice(0, 10);
      dots();
      // Like the prototype: the code is sent when it is typed (4 digits), or a moment after a longer code.
      if (code.length >= 4) timer = setTimeout(apply, code.length === 4 ? 700 : 900);
      return;
    }
    const b = e.target.closest("[data-m]");
    if (!b) return;
    mode = b.dataset.m;
    if (needCode(mode)) paintPad();
    else apply();
  });
  if (mode && needCode(mode)) paintPad();
  else paintModes();
}

/* ------------------------------------------------------------------ cameras */
const cams = (ctx) => {
  const own = (ctx.data.settings.cameras || []).filter((id) => ctx.hass.states[id]);
  if (own.length) return own;
  return [...new Set(houseData(ctx).items.filter((i) => i.type === "camera" && i.ent && ctx.hass.states[i.ent]).map((i) => i.ent))];
};
const camItem = (ctx, id) => (houseData(ctx).items || []).find((i) => i.type === "camera" && i.ent === id) || { name: ctx.name(id), scene: "garden" };
const camSrc = (ctx, id) => {
  const s = ctx.st(id);
  const pic = s?.attributes?.entity_picture;
  if (!pic || s.state === "unavailable") return null;
  return `${pic}${pic.includes("?") ? "&" : "?"}_=${Math.floor(Date.now() / 10000)}`;
};
const camObj = (id) => id.replace(/^camera\./, "");
/* What Frigate sees right now: its occupancy sensors per object. */
function camBox(ctx, id) {
  const base = camObj(id);
  for (const [obj, cls, label] of [["car", "car", "bil"], ["person", "car", "person"], ["cat", "cat", "kat"], ["dog", "cat", "hund"]]) {
    const s = ctx.st(`binary_sensor.${base}_${obj}_occupancy`);
    if (s?.state === "on") return `<span class="cam-box ${cls}"><small>${esc(ctx.t(label))}</small></span>`;
  }
  return "";
}
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function camTile(ctx, id, cls = "cam-tile") {
  const src = camSrc(ctx, id);
  const it = camItem(ctx, id);
  const scene = H("camScene") ? H("camScene")(ctx, it) : "";
  return `<button class="${cls} sec-cam-t" data-act="sec-cam" data-id="${esc(id)}">${scene}${src ? `<img class="sec-img" data-cam="${esc(id)}" src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : ""}<span class="cam-ov"><b>${esc(it.name || ctx.name(id))}</b><span class="cam-live"><i></i>LIVE</span></span><span class="cam-time num" data-clock="1">${ctx.fmt.time(new Date())}</span>${camBox(ctx, id)}</button>`;
}
function camSheet(ctx, id) {
  const { esc, svg, t } = ctx;
  const s = ctx.hass.states[id];
  if (!s) return;
  const it = camItem(ctx, id);
  const token = s.attributes.access_token;
  const stream = token && s.state !== "unavailable" ? `/api/camera_proxy_stream/${id}?token=${encodeURIComponent(token)}` : camSrc(ctx, id);
  const scene = H("camScene") ? H("camScene")(ctx, it, true) : "";
  const evs = camEvents(ctx, id);
  const base = camObj(id);
  const SW = [["detect", "Detektion"], ["motion", "Bevægelse"], ["recordings", "Optagelser"], ["snapshots", "Snapshots"]].map(([k, n]) => [`switch.${base}_${k}`, n]).filter(([e]) => ctx.hass.states[e]);
  const now = new Date(), h = now.getHours() + now.getMinutes() / 60;
  const talk = ctx.hass.states[`button.${base}_talk`] || /dør|door|klokke|bell/i.test(it.name || "");
  const sheet = ctx.sheet(`<div class="eyebrow">${esc(platformName(ctx, id, t("Kamera")))} · ${esc(id)}</div><h2>${esc(it.name || ctx.name(id))}</h2>
    <div class="cam-big">${scene}${stream ? `<img class="sec-big-img" src="${esc(stream)}" alt="${esc(it.name || ctx.name(id))}" onerror="this.remove()">` : ""}<span class="cam-ov"><b>${esc(it.name || ctx.name(id))}</b><span class="cam-live"><i></i>LIVE</span></span><span class="cam-time num" data-clock="1">${ctx.fmt.time(now)}</span>${camBox(ctx, id)}</div>
    <div class="cam-scrub"><input type="range" min="0" max="24" step=".25" value="${h.toFixed(2)}" aria-label="${esc(t("Spol i dagens optagelser"))}" class="cam-scr"><div class="cam-marks">${evs.map((e) => `<i style="left:${(((e.when.getHours() + e.when.getMinutes() / 60) / 24) * 100).toFixed(1)}%"></i>`).join("")}</div></div>
    <div class="ap-chips" style="margin-top:12px">${talk ? `<button data-cact="talk">${svg("speaker")}${esc(t("Tal"))}</button>` : ""}<button data-cact="snap">${svg("camera")}${esc(t("Snapshot"))}</button><button data-cact="last">${svg("play")}${esc(t("Seneste hændelse"))}</button></div>
    ${SW.length ? `<div class="mods" style="grid-template-columns:minmax(0,1fr) 64px;margin-top:14px">${SW.map(([e, n]) => `<span>${esc(t(n))}</span><button class="toggle" data-csw="${esc(e)}" aria-pressed="${ctx.hass.states[e].state === "on"}" aria-label="${esc(t(n))}"></button>`).join("")}</div>` : ""}
    ${evs.length ? `<div class="sec-tl" style="margin-top:12px">${evs.slice(0, 12).map((e) => `<div class="sec-ev k-${e.kind}"><span class="sec-t"><b class="num">${ctx.fmt.time(e.when)}</b><small>${esc(ctx.fmt.rel(e.when))}</small></span><span class="sec-ei">${svg(EV_ICON[e.kind] || "car")}</span><span class="sec-et">${esc(e.text)}</span></div>`).join("")}</div>` : `<p class="t-sub" style="margin-top:12px">${esc(t("Ingen hændelser det seneste døgn."))}</p>`}
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Luk"))}</button></div>`, { cls: "cam-sheet" });
  const scr = sheet.el.querySelector(".cam-scr");
  scr.addEventListener("input", () => {
    const v = +scr.value;
    sheet.el.querySelector(".cam-time").textContent = ctx.fmt.time(new Date(new Date().setHours(Math.floor(v), Math.round((v % 1) * 60))));
    sheet.el.querySelector(".cam-live").classList.toggle("rec", Math.abs(v - h) > 0.3);
  });
  sheet.el.addEventListener("click", (e) => {
    const sw = e.target.closest("[data-csw]");
    if (sw) {
      const on = sw.getAttribute("aria-pressed") === "true";
      sw.setAttribute("aria-pressed", String(!on));
      ctx.call("switch", on ? "turn_off" : "turn_on", { entity_id: sw.dataset.csw });
      return;
    }
    const a = e.target.closest("[data-cact]")?.dataset.cact;
    if (a === "snap") {
      const src = camSrc(ctx, id);
      if (src) window.open(src, "_blank", "noopener");
    } else if (a === "last") {
      if (evs[0]) {
        sheet.close();
        moreInfo(ctx, evs[0].id);
      } else ctx.toast(t("Ingen hændelser det seneste døgn."));
    } else if (a === "talk") {
      const b = `button.${base}_talk`;
      if (ctx.hass.states[b]) ctx.call("button", "press", { entity_id: b });
      else moreInfo(ctx, id);
    }
  });
}
const moreInfo = (ctx, id) => ctx.host.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));

/* ------------------------------------------------------------------ the log of the last day */
/* Frigate's sensors for a camera (occupancy and motion): the camera's own events. */
const camSensors = (ctx, id) => {
  const base = camObj(id);
  return Object.keys(ctx.hass.states).filter((e) => e.startsWith(`binary_sensor.${base}_`) && /_(occupancy|motion)$/.test(e));
};
function logEntities(ctx, list) {
  return [...new Set([alarmId(ctx), ...list.map((s) => s.ent), ...cams(ctx).flatMap((c) => camSensors(ctx, c))].filter(Boolean))].slice(0, 80);
}
function events(ctx, list) {
  const ids = logEntities(ctx, list);
  if (!ids.length) return [];
  const latest = ids.map((id) => ctx.hass.states[id]?.last_changed || "").sort().pop();
  const end = new Date(), start = new Date(Date.now() - 864e5);
  const raw = ctx.load(`sec-log:${ids.join(",")}:${latest}`, () => ctx.hass.callWS({ type: "logbook/get_events", start_time: start.toISOString(), end_time: end.toISOString(), entity_ids: ids }), 60000);
  const kinds = Object.fromEntries(list.map((s) => [s.ent, s]));
  const camOf = Object.fromEntries(cams(ctx).flatMap((c) => camSensors(ctx, c).map((e) => [e, c])));
  return (Array.isArray(raw) ? raw : [])
    .filter((e) => e.entity_id && e.state != null)
    .map((e) => {
      const when = typeof e.when === "number" ? new Date(e.when * 1000) : new Date(e.when);
      const s = kinds[e.entity_id];
      const cam = camOf[e.entity_id];
      const obj = cam ? (e.entity_id.match(/_(car|person|cat|dog|bicycle|motorcycle|bird)_occupancy$/) || [])[1] || "motion" : null;
      const kind = e.entity_id === alarmId(ctx) ? "alarm" : cam ? (obj === "car" ? "car" : obj === "person" ? "person" : obj === "cat" || obj === "dog" ? "cat" : "motion") : s?.kind || "door";
      return { when, id: e.entity_id, cam, kind, state: e.state, name: cam ? camItem(ctx, cam).name || ctx.name(cam) : s?.name || e.name || ctx.name(e.entity_id) };
    })
    .filter((e) => !isNaN(e.when))
    .sort((a, b) => b.when - a.when)
    .slice(0, 80);
}
const camEvents = (ctx, id) =>
  events(ctx, sensors(ctx))
    .filter((e) => e.cam === id && e.state === "on")
    .map((e) => ({ ...e, text: evText(ctx, e) }))
    .filter((e) => e.text);
function evText(ctx, e) {
  const t = ctx.t, on = e.state === "on" || e.state === "open";
  if (e.state === "unavailable" || e.state === "unknown") return e.kind === "alarm" ? t("Alarmen svarede ikke") : t("{name} svarede ikke", { name: e.name });
  if (e.kind === "alarm") return t("Alarmen: {state}", { state: t((AL_STATE[e.state] || [e.state])[0]).toLowerCase() });
  if (e.cam) return on ? { car: t("Bil ved {name}", { name: e.name }), person: t("Person ved {name}", { name: e.name }), cat: t("Dyr ved {name}", { name: e.name }) }[e.kind] || t("Bevægelse ved {name}", { name: e.name }) : null;
  if (e.kind === "lock") return e.state === "locked" ? t("{name} blev låst", { name: e.name }) : e.state === "unlocked" ? t("{name} blev låst op", { name: e.name }) : null;
  if (e.kind === "motion") return on ? t("Bevægelse: {name}", { name: e.name }) : null;
  if (e.kind === "smoke") return on ? t("{name} gik i gang", { name: e.name }) : t("{name} er stille igen", { name: e.name });
  if (e.kind === "leak") return on ? t("{name} mærkede vand", { name: e.name }) : t("{name} er tør igen", { name: e.name });
  if (e.state === "opening" || e.state === "closing") return null;
  return on ? t("{name} blev åbnet", { name: e.name }) : null;
}
const EV_ICON = { alarm: "bell", door: "door", window: "window", port: "garage", lock: "lock", smoke: "smoke", leak: "drop", motion: "walk", car: "car", person: "user", cat: "paw", sys: "bell" };
// The prototype's filters: Alle, Døre, Kameraer, System.
const EV_FILTERS = [["alle", "Alle"], ["doere", "Døre"], ["kamera", "Kameraer"], ["system", "System"]];
const evIn = (e) =>
  filter === "alle" ||
  (filter === "doere" && ["door", "window", "port", "lock"].includes(e.kind)) ||
  (filter === "kamera" && !!e.cam) ||
  (filter === "system" && (e.kind === "alarm" || e.kind === "smoke" || e.kind === "leak" || e.state === "unavailable"));

/* ------------------------------------------------------------------ cars (the prototype's CAR_LOCKS) */
function carLocks(ctx) {
  const used = new Set(houseData(ctx).items.flatMap((i) => [i.lock, i.ent]).filter(Boolean));
  const out = [];
  for (const it of houseData(ctx).items.filter((i) => i.type === "car")) {
    let id = it.lock && ctx.hass.states[it.lock] ? it.lock : null;
    if (!id) {
      const words = String(it.name || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      id = ctx.entities("lock").find((l) => !used.has(l) && words.some((w) => ctx.name(l).toLowerCase().includes(w) || l.includes(w)));
    }
    if (id) out.push({ id, name: it.name || ctx.name(id) });
  }
  return out;
}
const carsAway = (ctx) => houseData(ctx).items.filter((i) => i.type === "car" && i.presence && !["home", "on", "true"].includes(String(ctx.hass.states[i.presence]?.state).toLowerCase()));

/* ------------------------------------------------------------------ the page (the prototype's pSec) */
const LAYERS = [["sikkerhed", "Sikkerhed"], ["lys", "Lys"], ["indretning", "Møbler"], ["energi", "Biler og energi"], ["apparater", "Apparater"], ["medier", "Sonos og TV"], ["netvaerk", "Netværk"]];
let layers = new Set(["sikkerhed", "lys", "apparater", "indretning", "energi"]);

function render(ctx) {
  const { t, esc, svg } = ctx;
  const list = sensors(ctx);
  const st = list.map((s) => ({ ...s, ...sState(ctx, s) }));
  const of = (k) => st.filter((s) => s.kind === k);
  const openD = of("door").filter((s) => s.bad).length, openW = of("window").filter((s) => s.bad).length, openC = of("port").filter((s) => s.bad).length;
  const lockDoors = (houseData(ctx).items || []).filter((i) => (i.type === "door" || i.type === "window") && i.lockOn && i.lock && ctx.hass.states[i.lock]);
  const looseLocks = !lockDoors.length ? of("lock") : [];
  const unlD = lockDoors.filter((d) => ctx.hass.states[d.lock].state !== "locked").length + looseLocks.filter((s) => s.bad).length;
  const CL = carLocks(ctx);
  const unl = CL.filter((l) => ctx.hass.states[l.id]?.state !== "locked").length;
  const off = st.filter((s) => s.off).length;
  const smokeBad = st.filter((s) => (s.kind === "smoke" || s.kind === "leak") && s.bad).length;
  const n = openD + openW + openC;
  const allOk = !n && !unl && !unlD && !smokeBad;
  const L = alarmLook(ctx);
  const ac = L ? L.color : "var(--good)";
  const head = !st.length && !CL.length
    ? t("Ingen døre eller vinduer at holde øje med endnu")
    : allOk
      ? t("Alt er lukket og låst")
      : [n ? t("{n} ting står åben", { n }) : "", unlD ? t("{n} dør ulåst", { n: unlD }) : "", unl ? t("bil ulåst") : "", smokeBad ? t("Alarm fra en føler!") : ""].filter(Boolean).join(" · ");
  const chips = [
    `<span class="${openD ? "bad" : ""}">${svg("door")}${esc(openD ? t("{n} dør åben", { n: openD }) : t("Døre lukket"))}</span>`,
    `<span class="${openW ? "bad" : ""}">${svg("window")}${esc(openW ? t("{n} vindue åbent", { n: openW }) : t("Vinduer lukket"))}</span>`,
    of("port").length ? `<span class="${openC ? "bad" : ""}">${svg("garage")}${esc(openC ? t("Port åben") : t("Porte lukket"))}</span>` : "",
    lockDoors.length || looseLocks.length ? `<span class="${unlD ? "bad" : ""}">${svg("lock")}${esc(unlD ? t("{n} dør ulåst", { n: unlD }) : t("Døre låst"))}</span>` : "",
    CL.length ? `<span class="${unl ? "bad" : ""}">${svg("car")}${esc(unl ? t("Bil ulåst") : t("Biler låst"))}</span>` : "",
    off ? `<span class="warnc">${svg("window")}${esc(t(off === 1 ? "{n} sensor svarer ikke" : "{n} sensorer svarer ikke", { n: off }))}</span>` : "",
    of("smoke").length || !st.length ? `<span class="${smokeBad ? "bad" : ""}">${svg("smoke")}${esc(smokeBad ? t("Røg!") : t("Røgalarmer OK"))}</span>` : "",
  ].join("");

  const status = `<section class="sx-status${allOk ? " ok" : " warn"}" style="--ac:${ac}">
    <button class="sec-shield${L?.armed ? " armed" : ""}" data-act="alarm" aria-label="${esc(t("Alarm"))}: ${esc(L ? L.label : t("ingen alarm valgt"))}"><span class="sec-rings"><i></i><i></i><i></i></span>${svg("shieldf")}</button>
    <div class="sx-st"><span class="eyebrow">${esc(L ? L.label : t("Ingen alarm valgt"))}</span><b>${esc(head)}</b><div class="sec-chips">${chips}</div></div>
    ${L ? `<button class="btn" data-act="alarm">${svg("shield")}${esc(L.armed ? t("Frakobl") : t("Tilkobl"))}</button>` : `<button class="btn soft" data-go="indstillinger:hjemmet">${svg("shield")}${esc(t("Vælg alarm"))}</button>`}</section>`;

  const ctls = [
    ...st.filter((s) => s.kind === "port" && s.ent.startsWith("cover.")).map((s) => `<button class="sx-ctl${s.bad ? " bad" : ""}" data-act="sec-ctl" data-id="${esc(s.ent)}" data-kind="port"${s.off ? " disabled" : ""}>${svg("garage")}<span><b>${esc(s.name)}</b><small>${esc(s.bad ? t("Åben · tryk for at lukke") : t("Lukket · tryk for at åbne"))}</small></span></button>`),
    ...lockDoors.map((d) => {
      const locked = ctx.hass.states[d.lock].state === "locked";
      return `<button class="sx-ctl${locked ? "" : " bad"}" data-act="sec-ctl" data-id="${esc(d.lock)}" data-kind="lock">${svg("lock")}<span><b>${esc(d.name)}</b><small>${esc(locked ? t("Låst") : t("Ulåst"))}</small></span></button>`;
    }),
    ...looseLocks.map((s) => `<button class="sx-ctl${s.bad ? " bad" : ""}" data-act="sec-ctl" data-id="${esc(s.ent)}" data-kind="lock"${s.off ? " disabled" : ""}>${svg("lock")}<span><b>${esc(s.name)}</b><small>${esc(s.txt)}</small></span></button>`),
    ...carsAway(ctx).map((c) => `<span class="sx-ctl">${svg("car")}<span><b>${esc(c.name)}</b><small>${esc(t("Ude"))}</small></span></span>`),
    ...CL.map((l) => {
      const locked = ctx.hass.states[l.id]?.state === "locked";
      return `<button class="sx-ctl${locked ? "" : " bad"}" data-act="sec-ctl" data-id="${esc(l.id)}" data-kind="lock">${svg("car")}<span><b>${esc(l.name)}</b><small>${esc(locked ? t("Låst") : t("Ulåst"))}</small></span></button>`;
    }),
  ].join("");
  const ctlRow = ctls ? `<div class="sx-ctls">${ctls}</div>` : "";

  let plan;
  const hp = H("housePlan");
  if (hp && hasHouse(ctx)) {
    let inner = "";
    try {
      inner = hp(ctx, { layers: [...layers] });
    } catch (err) {
      console.error("Hverdagsro:", err);
      inner = `<p class="t-sub">${esc(t("Planen kunne ikke tegnes"))}</p>`;
    }
    const hasK = houseData(ctx).items.some((i) => i.type === "temp");
    plan = `<section class="card sx-plan" data-pane="huset"><div class="card-head"><h2>${esc(t("Huset"))}</h2><div class="sx-layers">${[...LAYERS, ...(hasK ? [["klima", "Klima"]] : [])].map(([k, l]) => `<button data-act="sec-layer" data-id="${k}" aria-pressed="${layers.has(k)}">${esc(t(l))}</button>`).join("")}${ctx.isParent && ctx.on("house") ? `<button class="sx-edit" data-go="husbygger">${svg("edit")}${esc(t("Redigér huset"))}</button>` : ""}</div></div>
      ${inner}<p class="sx-swipe">${esc(t("Stryg til siden for at se hele huset."))}</p>${ctlRow}
      <div class="sec-legend"><span class="t-sub">${esc(t("Tryk på et rum for at åbne det, eller på en dør, et vindue eller en markør."))}</span></div></section>`;
  } else {
    const rows = st.filter((s) => s.kind !== "lock" && !(s.kind === "port" && s.ent.startsWith("cover.")));
    rows.sort((a, b) => (b.bad || 0) - (a.bad || 0) || (b.off || 0) - (a.off || 0));
    const sensorList = rows.length
      ? `<div class="sec-list sec-sens">${rows.slice(0, 40).map((s, i) => `<button class="sec-srow st-${s.cls}" data-act="sec-more" data-id="${esc(s.ent)}" style="animation-delay:${Math.min(i, 12) * 25}ms"><span class="sec-sic">${svg(KIND[s.kind][0])}</span><span class="sec-sn"><b>${esc(s.name)}</b><small>${esc(t(KIND[s.kind][1]))}${ctx.hass.states[s.ent]?.last_changed ? ` · ${esc(since(ctx, s.ent))}` : ""}</small></span><span class="sec-sv">${esc(s.txt)}</span></button>`).join("")}</div>`
      : "";
    plan = `<section class="card sx-plan" data-pane="huset">${
      ctx.on("house") && ctx.isParent
        ? `<div class="sec-cta"><span class="sec-cta-art">${svg("house")}<i></i><i></i><i></i></span><div><h2>${esc(t("Tegn jeres hus"))}</h2><p class="t-sub">${esc(t("Tegn rum, døre og vinduer, og sæt jeres enheder ind. Så kan I se hele huset levende her: hvad der er åbent, låst og tændt."))}</p><button class="btn" data-go="husbygger">${svg("edit")}${esc(t("Åbn Husbyggeren"))}</button></div></div>`
        : `<div class="card-head"><h2>${esc(t("Huset"))}</h2></div>`
    }${ctlRow}${sensorList ? `<h3 class="sec-h3">${esc(t("Døre, vinduer og følere"))}</h3>${sensorList}` : !ctlRow ? `<p class="t-sub">${esc(t("Der er ikke fundet døre, vinduer, låse eller røgalarmer i Home Assistant."))}</p>` : ""}</section>`;
  }

  const C = cams(ctx);
  const camCard = `<section class="card" data-pane="kamera"><div class="card-head"><h2>${esc(t("Kameraer"))}</h2>${C.length ? `<span class="meta">${esc(platformName(ctx, C[0], String(C.length)))}</span>` : ""}</div>${
    C.length ? `<div class="cam-grid sm">${C.map((id) => camTile(ctx, id)).join("")}</div>` : `<p class="t-sub">${esc(t("Der er ikke valgt kameraer."))} ${ctx.isParent ? `<button class="lnk" data-go="indstillinger:hjemmet">${esc(t("Vælg kameraer"))}</button>` : ""}</p>`
  }</section>`;

  const evs = events(ctx, list)
    .map((e) => ({ ...e, text: evText(ctx, e) }))
    .filter((e) => e.text)
    .filter(evIn);
  const loading = !evs.length && ctx._loading?.size;
  const evCard = `<section class="card" data-pane="haendelser"><div class="card-head"><h2>${esc(t("Seneste døgn"))}</h2><div class="filters sm">${EV_FILTERS.map(([k, l]) => `<button class="fchip" data-act="sec-filter" data-id="${k}" aria-pressed="${k === filter}">${esc(t(l))}</button>`).join("")}</div></div>
    ${evs.length ? `<div class="sec-tl">${evs.map((e, i) => `<button class="sec-ev k-${e.kind}" data-act="sec-ev" data-id="${esc(e.cam || e.id)}" data-cam="${e.cam ? 1 : ""}" style="animation-delay:${Math.min(i, 15) * 30}ms"><span class="sec-t"><b class="num">${ctx.fmt.time(e.when)}</b><small>${esc(ctx.fmt.rel(e.when))}</small></span><span class="sec-ei">${svg(EV_ICON[e.kind] || "bell")}</span><span class="sec-et">${esc(e.text)}</span></button>`).join("")}</div>` : `<p class="t-sub">${esc(loading ? t("Henter …") : t("Intet at vise det seneste døgn."))}</p>`}</section>`;

  return `<div class="sx" data-tab="${tab}">${status}
    <div class="seg sx-tabs">${[["huset", "Huset"], ["kamera", "Kameraer"], ["haendelser", "Hændelser"]].map(([k, l]) => `<button data-act="sec-tab" data-id="${k}" aria-pressed="${tab === k}">${esc(t(l))}</button>`).join("")}</div>
    <div class="sx-grid">${plan}<div class="sx-side">${camCard}${evCard}</div></div></div>`;
}

/* Fresh camera pictures every 10 seconds, without drawing the page again. */
function after(ctx) {
  clearInterval(camTimer);
  camTimer = setInterval(() => {
    if (ctx.view !== "sikkerhed" || !ctx.host.isConnected) {
      clearInterval(camTimer);
      return;
    }
    ctx.qa("img.sec-img[data-cam]").forEach((img) => {
      const src = camSrc(ctx, img.dataset.cam);
      if (src) img.src = src;
    });
    const now = ctx.fmt.time(new Date());
    ctx.qa(".sec-cam-t .cam-time").forEach((el) => (el.textContent = now));
  }, 10000);
}

const acts = {
  alarm: (el, ev, ctx) => alarmSheet(ctx, el?.dataset?.mode || null),
  "sec-tab": (el, ev, ctx) => {
    tab = el.dataset.id;
    ctx.render(true);
  },
  "sec-filter": (el, ev, ctx) => {
    filter = el.dataset.id;
    ctx.render(true);
  },
  "sec-cam": (el, ev, ctx) => camSheet(ctx, el.dataset.id),
  "sec-layer": (el, ev, ctx) => {
    const k = el.dataset.id;
    if (layers.has(k)) layers.delete(k);
    else layers.add(k);
    ctx.render(true);
  },
  /* An event: a camera opens the camera; a door or window shows its card on the plan; anything else Home Assistant's own dialog. */
  "sec-ev": (el, ev, ctx) => {
    const id = el.dataset.id;
    if (el.dataset.cam) return camSheet(ctx, id);
    const it = H("itemForEntity") && hasHouse(ctx) ? H("itemForEntity")(ctx, id) : null;
    if (!it) return moreInfo(ctx, id);
    tab = "huset";
    H("openPop")?.(it.id);
    ctx.render(true);
    setTimeout(() => ctx.q(".sx-stage")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  },
  "sec-more": (el, ev, ctx) => moreInfo(ctx, el.dataset.id),
  "sec-ctl": (el, ev, ctx) => {
    const id = el.dataset.id, s = ctx.hass.states[id];
    if (!s) return;
    if (el.dataset.kind === "lock") {
      if (s.state === "locked")
        return ctx.confirm(ctx.t("Lås {name} op?", { name: ctx.name(id) }), ctx.t("Låsen åbnes med det samme."), ctx.t("Lås op"), () => ctx.call("lock", "unlock", { entity_id: id }));
      ctx.toast(ctx.t("{name} låses", { name: ctx.name(id) }));
      return ctx.call("lock", "lock", { entity_id: id });
    }
    const open = s.state === "open" || s.state === "opening";
    if (!open)
      return ctx.confirm(ctx.t("Åbn {name}?", { name: ctx.name(id) }), ctx.t("Porten åbner med det samme."), ctx.t("Åbn"), () => ctx.call("cover", "open_cover", { entity_id: id }));
    ctx.toast(ctx.t("{name} lukker", { name: ctx.name(id) }));
    return ctx.call("cover", "close_cover", { entity_id: id });
  },
};

const css = `
.sec-h3 { font-size: 14px; margin: 18px 0 8px; color: var(--muted); font-weight: 800; }
.sec-sens { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px; }
.sec-srow { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 10px; align-items: center; border: 0; background: var(--surface-2); color: var(--ink); text-align: left; border-radius: 14px; padding: 7px 10px 7px 7px; animation: pop .35s both; cursor: pointer; }
.sec-sic { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; background: color-mix(in srgb, var(--good) 14%, var(--surface)); color: var(--good); }
.sec-sic .ic { width: 18px; height: 18px; }
.sec-sn { min-width: 0; } .sec-sn b { display: block; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sec-sn small { display: block; font-size: 11.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sec-sv { font-size: 12px; font-weight: 800; color: var(--good); }
.sec-srow.st-bad .sec-sic { background: color-mix(in srgb, var(--bad) 15%, var(--surface)); color: var(--bad); animation: secpulse 1.6s ease-in-out infinite; } .sec-srow.st-bad .sec-sv { color: var(--bad); }
.sec-srow.st-warn .sec-sic { background: color-mix(in srgb, var(--warn) 15%, var(--surface)); color: var(--warn); } .sec-srow.st-warn .sec-sv { color: var(--warn); }
.sec-srow.st-live .sec-sic { background: color-mix(in srgb, #EAB308 18%, var(--surface)); color: #CA8A04; box-shadow: 0 0 0 0 #EAB308; animation: secping2 1.6s ease-out infinite; } .sec-srow.st-live .sec-sv { color: #CA8A04; }
@keyframes secpulse { 50% { transform: scale(1.08); } }
@keyframes secping2 { 0% { box-shadow: 0 0 0 0 rgba(234,179,8,.55); } 100% { box-shadow: 0 0 0 10px rgba(234,179,8,0); } }
.sx-ctl[disabled] { opacity: .5; }
.sec-chips .warnc { color: var(--warn); } .sec-chips .warnc .ic { color: var(--warn); }
.sec-cta { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 18px; align-items: center; padding: 8px 4px; }
.sec-cta h2 { margin: 0 0 4px; } .sec-cta .btn { margin-top: 10px; }
.sec-cta-art { position: relative; width: 92px; height: 92px; border-radius: 28px; display: grid; place-items: center; color: var(--violet); background: color-mix(in srgb, var(--violet) 12%, var(--surface)); }
.sec-cta-art > .ic { width: 46px; height: 46px; animation: rmbob 5s ease-in-out infinite; }
.sec-cta-art i { position: absolute; inset: 0; border-radius: inherit; border: 2px solid var(--violet); opacity: 0; animation: secring 3.2s ease-out infinite; }
.sec-cta-art i:nth-child(3) { animation-delay: 1.06s; } .sec-cta-art i:nth-child(4) { animation-delay: 2.12s; }
@media (max-width: 520px) { .sec-cta { grid-template-columns: minmax(0, 1fr); justify-items: start; } }
.cam-tile img.sec-img, .cam-big img.sec-big-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.sec-noimg { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 6px; color: rgba(255,255,255,.6); background: linear-gradient(135deg, #1E2230, #2A3042); }
.sec-noimg .ic { width: 28px; height: 28px; } .sec-noimg small { font-size: 12px; font-weight: 700; }
.sec-camacts { margin-top: 12px; }
.sec-camacts button .ic { width: 16px; height: 16px; }
.al-what { justify-content: center; text-align: center; margin-top: 6px; display: block; }
.pinpad .sec-ok { background: var(--good); color: #fff; }
.sec-dots { min-height: 20px; }
.sec-codef { display: flex; gap: 8px; margin-top: 14px; }
.sec-codef input { flex: 1; min-width: 0; font: inherit; font-size: 18px; padding: 10px 14px; border-radius: 14px; border: 1.5px solid var(--line); background: var(--surface-2); color: var(--ink); letter-spacing: 3px; }
.al-modes .al-mode { animation: pop .35s both; cursor: pointer; }
`;

const en = {
  Hjemme: "Home", Ude: "Away", Nat: "Night", Ferie: "Vacation", Egen: "Custom",
  "Skal-sikring, I er hjemme": "Perimeter, you're home", "Hele huset, ingen hjemme": "The whole house, nobody home", "Skal-sikring om natten": "Perimeter at night", "Som ude, mens I er væk længe": "Like away, while you're gone long", "Egne sensorer": "Your own sensors",
  Frakoblet: "Disarmed", "Tilkoblet · hjemme": "Armed · home", "Tilkoblet · ude": "Armed · away", "Tilkoblet · nat": "Armed · night", "Tilkoblet · ferie": "Armed · vacation", "Tilkoblet · egen": "Armed · custom",
  "Tilkobler …": "Arming …", "Venter …": "Pending …", "Frakobler …": "Disarming …", "Alarm!": "Alarm!", "Alarmen svarer ikke": "The alarm isn't responding",
  Dør: "Door", Vindue: "Window", Port: "Gate", Lås: "Lock", Røgalarm: "Smoke alarm", Vandføler: "Leak sensor", Bevægelse: "Motion", lås: "lock",
  "Svarer ikke": "Not responding", Låst: "Locked", "Sidder fast": "Jammed", "Låser …": "Locking …", "Låser op …": "Unlocking …", Ulåst: "Unlocked", Lukket: "Closed", "Åbner …": "Opening …", "Lukker …": "Closing …", Åben: "Open", Åbent: "Open",
  "Røg!": "Smoke!", OK: "OK", "Vand!": "Water!", Tør: "Dry", "Bevægelse nu": "Motion now", Rolig: "Quiet",
  "Der er ikke valgt en alarm": "No alarm has been chosen", "Ændret {when}": "Changed {when}", "af {name}": "by {name}", "{n} åbne vinduer og døre": "{n} open windows and doors", "alle vinduer og døre er lukkede": "all windows and doors are closed",
  "Kun far eller mor kan ændre alarmen.": "Only a parent can change the alarm.", Frakobl: "Disarm", "Kræver kode": "Needs the code", "Alarmen kan ikke tilkobles herfra.": "The alarm can't be armed from here.",
  "Skriv koden for at frakoble": "Enter the code to disarm", "Skriv koden for at tilkoble · {mode}": "Enter the code to arm · {mode}", Slet: "Delete", Kode: "Code",
  "Alarmen frakobles": "Disarming the alarm", "Alarmen tilkobles · {mode}": "Arming the alarm · {mode}", "Forkert kode": "Wrong code", "Alarmen svarede ikke: {error}": "The alarm didn't respond: {error}",
  "Intet billede": "No picture", LIVE: "LIVE", Kamera: "Camera", "Kameraet svarer ikke": "The camera isn't responding", "Åbn i Home Assistant": "Open in Home Assistant", Luk: "Close",
  "Alarmen: {state}": "Alarm: {state}", "{name} blev låst": "{name} was locked", "{name} blev låst op": "{name} was unlocked", "Bevægelse: {name}": "Motion: {name}", "{name} gik i gang": "{name} went off", "{name} er stille igen": "{name} is quiet again",
  "{name} mærkede vand": "{name} detected water", "{name} er tør igen": "{name} is dry again", "{name} svarede ikke": "{name} didn't respond", "{name} blev åbnet": "{name} was opened", "{name} blev lukket": "{name} was closed",
  Alle: "All", "Døre og vinduer": "Doors and windows", Alarm: "Alarm",
  "{n} ting står åben": "{n} thing is open", "{n} ting står åbne": "{n} things are open", "{n} lås er ulåst": "{n} lock is unlocked", "{n} låse er ulåste": "{n} locks are unlocked", "Alarm fra en føler!": "A sensor raised the alarm!",
  "Ingen døre eller vinduer at holde øje med endnu": "No doors or windows to watch yet", "Alt er lukket og låst": "Everything is closed and locked",
  "{n} dør åben": "{n} door open", "{n} døre åbne": "{n} doors open", "Døre lukket": "Doors closed", "{n} vindue åbent": "{n} window open", "{n} vinduer åbne": "{n} windows open", "Vinduer lukket": "Windows closed",
  "Port åben": "Gate open", "Porte lukket": "Gates closed", "{n} ulåst": "{n} unlocked", "{n} ulåste": "{n} unlocked", "Alt låst": "All locked", "Røgalarmer OK": "Smoke alarms OK", Tørt: "Dry",
  "{n} sensor svarer ikke": "{n} sensor isn't responding", "{n} sensorer svarer ikke": "{n} sensors aren't responding",
  "ingen alarm valgt": "no alarm chosen", "Ingen alarm valgt": "No alarm chosen", Tilkobl: "Arm", "Vælg alarm": "Choose alarm",
  "tryk for at låse": "tap to lock", "tryk for at låse op": "tap to unlock", "tryk for at lukke": "tap to close", "tryk for at åbne": "tap to open",
  "Planen kunne ikke tegnes": "The plan could not be drawn", Huset: "House", "Redigér huset": "Edit the house", "Stryg til siden for at se hele huset.": "Swipe sideways to see the whole house.",
  "Tryk på et rum for at åbne det, eller på en dør, et vindue eller en markør.": "Tap a room to open it, or a door, a window or a marker.", "Døre, vinduer og følere": "Doors, windows and sensors",
  "Tegn jeres hus": "Draw your house", "Tegn rum, døre og vinduer, og sæt jeres enheder ind. Så kan I se hele huset levende her: hvad der er åbent, låst og tændt.": "Draw rooms, doors and windows, and place your devices. Then you can see the whole house come alive here: what is open, locked and on.",
  "Åbn Husbyggeren": "Open the House builder", "Døre, vinduer og låse": "Doors, windows and locks", "Der er ikke fundet døre, vinduer, låse eller røgalarmer i Home Assistant.": "No doors, windows, locks or smoke alarms were found in Home Assistant.",
  Kameraer: "Cameras", "Der er ikke valgt kameraer.": "No cameras have been chosen.", "Vælg kameraer": "Choose cameras", "Seneste døgn": "Last 24 hours", "Henter …": "Loading …", "Intet at vise det seneste døgn.": "Nothing to show from the last 24 hours.", Hændelser: "Events",
  Sikkerhed: "Security", Møbler: "Furniture", "Biler og energi": "Cars and energy", Apparater: "Appliances", "Sonos og TV": "Sonos and TV", Netværk: "Network", Klima: "Climate",
  Døre: "Doors", System: "System", "Døre låst": "Doors locked", "{n} dør ulåst": "{n} door unlocked", "bil ulåst": "car unlocked", "Bil ulåst": "Car unlocked", "Biler låst": "Cars locked",
  "Åben · tryk for at lukke": "Open · tap to close", "Lukket · tryk for at åbne": "Closed · tap to open",
  "Kun far eller mor kan frakoble alarmen.": "Only Dad or Mum can disarm the alarm.", "Du kan ikke tilkoble alarmen.": "You can't arm the alarm.",
  "Sidst ændret af {name} kl. {time}": "Last changed by {name} at {time}", "Sidst ændret kl. {time}": "Last changed at {time}", "Alarmen er frakoblet": "The alarm is disarmed",
  "Spol i dagens optagelser": "Scrub through today's recordings", Tal: "Talk", Snapshot: "Snapshot", "Seneste hændelse": "Latest event", Detektion: "Detection", Optagelser: "Recordings", Snapshots: "Snapshots",
  "Ingen hændelser det seneste døgn.": "No events in the last 24 hours.", bil: "car", person: "person", kat: "cat", hund: "dog",
  "Bil ved {name}": "Car at {name}", "Person ved {name}": "Person at {name}", "Dyr ved {name}": "Animal at {name}", "Bevægelse ved {name}": "Motion at {name}", "Alarmen svarede ikke": "The alarm didn't respond",
  "Lås {name} op?": "Unlock {name}?", "Låsen åbnes med det samme.": "The lock opens right away.", "Lås op": "Unlock", "{name} låses": "Locking {name}", "Åbn {name}?": "Open {name}?", "Porten åbner med det samme.": "The gate opens right away.", Åbn: "Open", "{name} lukker": "{name} is closing",
};

export default {
  id: "security",
  views: {
    sikkerhed: { parentOnly: true, module: "security", render, after, title: (ctx) => ctx.t("Sikkerhed") },
  },
  acts,
  css,
  en,
};
