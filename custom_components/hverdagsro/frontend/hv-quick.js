/* Hverdagsro – the + button (the prototype's buildFab, runQA and startGo), confetti and read aloud.
   The buttons are data.quick: each runs an entity in Home Assistant, shown when its condition holds (always,
   a time window, or while an entity is on), for the members in `who`, in each member's own order (quick_order)
   and without those they hid (quick_hide). The alarm is the first button when the family uses it. */
import { esc } from "./hv-core.js";
import { svg } from "./hv-icons.js";

const pad = (n) => String(n).padStart(2, "0");
export const ALARM_STATES = {
  disarmed: ["Frakoblet", "var(--good)"],
  armed_home: ["Tilkoblet · hjemme", "#3B6BF5"],
  armed_away: ["Tilkoblet · ude", "var(--bad)"],
  armed_night: ["Tilkoblet · nat", "#6E4AFF"],
  armed_vacation: ["Tilkoblet · ferie", "#11A39A"],
  armed_custom_bypass: ["Tilkoblet · egen", "#E4568C"],
  arming: ["Tilkobler …", "var(--warn)"],
  pending: ["Tilkobler …", "var(--warn)"],
  triggered: ["Alarm!", "var(--bad)"],
};
const inWin = (from, to, h) => (from < to ? h >= from && h < to : h >= from || h < to);

let fabOpen = false, fabSig = "", goTimer = null;

export function alarmState(ctx) {
  const id = ctx.data?.settings?.alarm;
  const st = id && ctx.on("alarm") ? ctx.hass.states[id] : null;
  return st && !["unavailable", "unknown"].includes(st.state) ? st : null;
}
export function alarmLabel(ctx, st) {
  const A = ALARM_STATES[st?.state] || ALARM_STATES.disarmed;
  return [ctx.t(A[0]), A[1]];
}

export function qaVisible(ctx, q, hour) {
  const c = q.cond || { kind: "always" };
  if (c.kind === "always") return true;
  if (c.kind === "entity" && c.entity && ctx.hass.states[c.entity]) return ctx.hass.states[c.entity].state === "on";
  return inWin(c.from ?? 0, c.to ?? 24, Math.floor(hour) % 24);
}
export function condText(ctx, c) {
  if (!c || c.kind === "always") return ctx.t("Altid");
  const win = ctx.t("kl. {from}–{to}", { from: pad(c.from ?? 0), to: pad(c.to ?? 0) });
  return c.kind === "entity" ? `${ctx.t("Når {name} er tændt", { name: ctx.name(c.entity || "") })} · ${win}` : win;
}

/* The member's buttons in their own order, without those they hid. */
export function quickFor(ctx, member) {
  if (!member || !ctx.on("quick")) return [];
  const order = member.quick_order || [];
  const hide = member.quick_hide || [];
  return (ctx.data.quick || [])
    .filter((q) => (q.who || []).includes(member.id) && !hide.includes(q.id))
    .map((q, i) => [q, order.includes(q.id) ? order.indexOf(q.id) : 1000 + i])
    .sort((a, b) => a[1] - b[1])
    .map(([q]) => q);
}
export function showAlarm(ctx, member) {
  if (!alarmState(ctx) || (member?.quick_hide || []).includes("alarm")) return false;
  const r = ctx.data.settings.alarm_rights || {};
  return !ctx.isKid || r.kids_arm !== false || !!r.kids_disarm;
}
function badgeOf(ctx, q) {
  const s = ctx.hass.states[q.entity];
  const members = s?.attributes?.entity_id;
  if (Array.isArray(members) && q.entity.startsWith("light.")) return members.filter((id) => ctx.hass.states[id]?.state === "on").length || 0;
  return 0;
}

export function buildFab(ctx, el, hour) {
  if (!el) return;
  const me = ctx.me;
  const hide = !ctx.data || ["guide", "husbygger", "ikke-klar", "hvem"].includes(ctx.view) || !me;
  const mine = hide ? [] : quickFor(ctx, me);
  const shown = mine.filter((q) => qaVisible(ctx, q, hour)), later = mine.filter((q) => !qaVisible(ctx, q, hour));
  const al = !hide && showAlarm(ctx, me) ? alarmState(ctx) : null;
  const items = [];
  if (al) {
    const [label, color] = alarmLabel(ctx, al);
    const arming = al.state === "arming" || al.state === "pending";
    items.push(`<button class="fi" data-fab-run="alarm" style="--qc:${color}"><span class="fl"><b>${esc(ctx.t("Alarm"))}</b><small>${esc(arming ? ctx.t("tilkobler …") : label.replace(ctx.t("Tilkoblet · "), ""))}</small></span><span class="qa-ic${al.state !== "disarmed" ? " armed" : ""}">${svg("shieldf")}</span></button>`);
  }
  shown.forEach((q) => {
    const badge = badgeOf(ctx, q);
    const sub = q.countdown ? ctx.t("Om {n} min", { n: Math.max(1, Math.round(q.countdown / 60)) }) : (q.cond?.kind || "always") === "always" ? ctx.t("Kør") : ctx.t("til kl. {t}", { t: pad(q.cond.to) });
    items.push(`<button class="fi" data-fab-run="${esc(q.id)}" style="--qc:${esc(q.color)}"><span class="fl"><b>${esc(q.label)}</b><small>${esc(sub)}</small></span><span class="qa-ic">${svg(q.icon)}${badge ? `<span class="qa-badge">${badge}</span>` : ""}</span></button>`);
  });
  later.forEach((q) => items.push(`<span class="fi ghost" style="--qc:${esc(q.color)}"><span class="fl"><b>${esc(q.label)}</b><small>${esc(ctx.t("fra kl. {t}", { t: pad(q.cond?.from ?? 0) }))}</small></span><span class="qa-ic">${svg(q.icon)}</span></span>`));
  if (!hide && ctx.on("quick") && (items.length || ctx.isParent)) items.push(`<button class="fi edit" data-fab-edit="1"><span class="fl"><b>${esc(ctx.t("Tilpas"))}</b><small>${esc(ctx.t("Min +-menu"))}</small></span><span class="qa-ic">${svg("edit")}</span></button>`);
  const sig = items.join("") + fabOpen + ctx.lang();
  if (sig === fabSig) return;
  fabSig = sig;
  el.hidden = !items.length;
  if (!items.length) {
    fabOpen = false;
    return;
  }
  const armed = al && al.state !== "disarmed";
  el.classList.toggle("open", fabOpen);
  const n = items.length;
  el.innerHTML = `<div class="fab-scrim" data-fab-close></div><div class="fab-list" role="menu">${items
    .map((it, i) => (it.includes(' style="') ? it.replace(' style="', ` style="--d:${(n - 1 - i) * 40}ms;`) : it.replace(/^<(button|span) /, `<$1 style="--d:${(n - 1 - i) * 40}ms" `)))
    .join("")}</div>
    <button class="fab-btn" data-fab aria-expanded="${fabOpen}" aria-label="${esc(ctx.t("Quick actions"))}">${svg("plus")}${armed ? `<span class="fab-dot" style="background:${alarmLabel(ctx, al)[1]}"></span>` : ""}</button>`;
}

export function bindFab(ctx, el, hourOf) {
  const rebuild = () => {
    fabSig = "";
    buildFab(ctx, el, hourOf());
  };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-fab]")) {
      fabOpen = !fabOpen;
      return rebuild();
    }
    if (e.target.closest("[data-fab-close]")) {
      fabOpen = false;
      return rebuild();
    }
    const edit = e.target.closest("[data-fab-edit]");
    const run = e.target.closest("[data-fab-run]");
    if (!edit && !run) return;
    fabOpen = false;
    rebuild();
    if (edit) return ctx.go("mig");
    const id = run.dataset.fabRun;
    if (id === "alarm") return ctx.acts.alarm?.(null, null, ctx);
    const q = (ctx.data.quick || []).find((x) => x.id === id);
    if (q) runQA(ctx, q, el);
  });
  ctx.root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && fabOpen) {
      fabOpen = false;
      rebuild();
    }
  });
  return rebuild;
}

async function runEntity(ctx, q, withOpt) {
  const d = q.entity.split(".")[0];
  if (d === "script") return ctx.call("script", "turn_on", { entity_id: q.entity, ...(q.option ? { variables: { [q.option.variable]: !!withOpt } } : {}) });
  if (d === "scene") return ctx.call("scene", "turn_on", { entity_id: q.entity });
  if (d === "button" || d === "input_button") return ctx.call(d, "press", { entity_id: q.entity });
  if (d === "automation") return ctx.call("automation", "trigger", { entity_id: q.entity });
  return ctx.call("homeassistant", "toggle", { entity_id: q.entity });
}

export function runQA(ctx, q, fabEl) {
  const s = ctx.sheet(`<div class="qa-sheet" style="--qc:${esc(q.color)}"><span class="qa-ic big">${svg(q.icon)}</span><h2>${esc(ctx.t("Kør {name}-rutinen?", { name: q.label }))}</h2><p class="t-sub" style="justify-content:center;text-align:center">${esc(q.desc || ctx.t("Kører {entity}", { entity: q.entity }))}</p>
    ${q.option ? `<label class="optrow"><span>${esc(q.option.label)}</span><button type="button" class="toggle" id="qa-opt" aria-pressed="false" aria-label="${esc(q.option.label)}"></button></label>` : ""}
    <div class="t-sub" style="justify-content:center;margin-top:8px">${esc(q.entity)}</div>
    <div class="sheet-actions" style="justify-content:center"><button class="btn soft" data-close>${esc(ctx.t("Annuller"))}</button><button class="btn" id="qa-run" style="background:var(--qc);color:#fff">${svg(q.icon)}${esc(ctx.t("Kør"))}</button></div></div>`);
  const opt = s.el.querySelector("#qa-opt");
  opt?.addEventListener("click", () => opt.setAttribute("aria-pressed", String(opt.getAttribute("aria-pressed") !== "true")));
  s.el.querySelector("#qa-run").addEventListener("click", async () => {
    const withOpt = opt?.getAttribute("aria-pressed") === "true";
    s.close();
    const tile = fabEl?.querySelector(".fab-btn");
    if (tile) {
      tile.classList.remove("fired");
      void tile.offsetWidth;
      tile.classList.add("fired");
      const r = tile.getBoundingClientRect();
      burst(ctx, r.left + r.width / 2, r.top + 30, q.color, 18);
    }
    if (q.countdown) return startGo(ctx, q, withOpt);
    if (await runEntity(ctx, q, withOpt)) ctx.toast(ctx.t("{name}-rutinen kører", { name: q.label }) + (withOpt ? ` · ${q.option.label.replace("?", "").toLowerCase()}` : ""));
  });
}

function startGo(ctx, q, withOpt) {
  clearInterval(goTimer);
  let left = q.countdown;
  ctx.qa(".gopill").forEach((x) => x.remove());
  const pill = document.createElement("div");
  pill.className = "gopill";
  pill.style.setProperty("--qc", q.color);
  const paint = () => {
    pill.innerHTML = `<span class="qa-ic">${svg(q.icon)}</span><span><b>${esc(q.label)}</b> ${esc(ctx.t("om"))} <b class="num">${Math.floor(left / 60)}:${pad(left % 60)}</b>${withOpt ? ` · ${esc(q.option.label.replace("?", "").toLowerCase())}` : ""}</span><button class="btn sm" data-gocancel>${esc(ctx.t("Annuller"))}</button><i style="width:${(1 - left / q.countdown) * 100}%"></i>`;
  };
  paint();
  ctx.root.appendChild(pill);
  pill.addEventListener("click", (e) => {
    if (!e.target.closest("[data-gocancel]")) return;
    clearInterval(goTimer);
    pill.remove();
    ctx.toast(ctx.t("{name}-rutinen er annulleret", { name: q.label }));
  });
  goTimer = setInterval(async () => {
    left--;
    paint();
    if (left > 0) return;
    clearInterval(goTimer);
    pill.remove();
    if (await runEntity(ctx, q, withOpt)) {
      const then = q.then && q.then !== "disarm" ? ALARM_STATES[q.then] : null;
      ctx.toast(then ? ctx.t("{name}-rutinen kører · alarmen bliver {state}", { name: q.label, state: ctx.t(then[0]).toLowerCase() }) : ctx.t("{name}-rutinen kører", { name: q.label }));
    }
  }, 1000);
  ctx.toast(ctx.t("{name}-rutinen starter om {n} min", { name: q.label, n: Math.max(1, Math.round(q.countdown / 60)) }));
}

/* ------------------------------------------------------------------ confetti (the prototype's burst) */
let parts = [], cfOn = false;
export function burst(ctx, x, y, color, n = 26) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  let cf = ctx.$("confetti");
  if (!cf) {
    cf = document.createElement("canvas");
    cf.id = "confetti";
    cf.setAttribute("aria-hidden", "true");
    ctx.root.appendChild(cf);
  }
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const cfx = cf.getContext("2d");
  if (!cfOn) {
    cf.width = innerWidth * DPR;
    cf.height = innerHeight * DPR;
    cfx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const cols = [color || "#6E4AFF", "#FFB020", "#19B6A5", "#FF7A59", "#6E4AFF"];
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(140, 360);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, r: rnd(3, 6), c: cols[i % cols.length], life: 1, rot: rnd(0, 6) });
  }
  if (cfOn) return;
  cfOn = true;
  let t0 = performance.now();
  requestAnimationFrame(function step(t) {
    const dt = Math.min(0.04, (t - t0) / 1000);
    t0 = t;
    cfx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => {
      p.vy += 620 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.1;
      p.rot += dt * 8;
      cfx.save();
      cfx.translate(p.x, p.y);
      cfx.rotate(p.rot);
      cfx.globalAlpha = Math.max(0, p.life);
      cfx.fillStyle = p.c;
      cfx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      cfx.restore();
    });
    parts = parts.filter((p) => p.life > 0);
    if (parts.length) requestAnimationFrame(step);
    else {
      cfOn = false;
      cfx.clearRect(0, 0, innerWidth, innerHeight);
    }
  });
}

/* ------------------------------------------------------------------ read aloud (Oplæsning) */
export function readText(ctx) {
  const m = ctx.me;
  if (!m) return "";
  const today = (ctx.data.today ? new Date(`${ctx.data.today}T12:00:00`) : new Date()).getDay();
  const wd = (today + 6) % 7;
  const mine = (ctx.data.missions || []).filter((x) => (x.member === m.id || (x.member === "all" && m.role === "child")) && (x.days || []).includes(wd));
  const open = mine.filter((x) => !(`${x.id}:${m.id}` in (ctx.data.done_today || {})));
  const pin = ctx.data.pins?.[m.id]?.text;
  return [
    ctx.t("Hej {name}.", { name: m.name }),
    ctx.feature(m, "points") ? ctx.t("Du har {n} point.", { n: ctx.points(m.id) }) : "",
    !ctx.feature(m, "missions") ? "" : open.length ? ctx.t("Dine missioner er: {list}.", { list: open.map((x) => x.title).join(", ") }) : ctx.t("Du har klaret alle dine missioner."),
    pin ? `${pin}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
export async function speak(ctx, text) {
  const speaker = ctx.me?.speaker;
  const tts = speaker && ctx.entities("tts")[0];
  if (tts) {
    if (await ctx.call("tts", "speak", { entity_id: tts, media_player_entity_id: speaker, message: text, language: ctx.lang() === "da" ? "da" : "en" })) ctx.toast(ctx.t("Læser op …"));
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
  } catch (err) {
    ctx.toast(ctx.t("Vælg en højttaler til oplæsning under Børn i familieindstillingerne"));
  }
}

const acts = {
  read: (el, e, ctx) => speak(ctx, el?.dataset?.txt || readText(ctx)),
};

const en = {
  Frakoblet: "Disarmed",
  "Tilkoblet · hjemme": "Armed · home",
  "Tilkoblet · ude": "Armed · away",
  "Tilkoblet · nat": "Armed · night",
  "Tilkoblet · ferie": "Armed · vacation",
  "Tilkoblet · egen": "Armed · custom",
  "Tilkobler …": "Arming …",
  "Alarm!": "Alarm!",
  "Tilkoblet · ": "Armed · ",
  "tilkobler …": "arming …",
  Altid: "Always",
  "kl. {from}–{to}": "{from}–{to}",
  "Når {name} er tændt": "When {name} is on",
  "Om {n} min": "In {n} min",
  Kør: "Run",
  "til kl. {t}": "until {t}",
  "fra kl. {t}": "from {t}",
  Tilpas: "Customise",
  "Min +-menu": "My + menu",
  "Quick actions": "Quick actions",
  "Kør {name}-rutinen?": "Run the {name} routine?",
  "Kører {entity}": "Runs {entity}",
  Annuller: "Cancel",
  "{name}-rutinen kører": "The {name} routine is running",
  om: "in",
  "{name}-rutinen er annulleret": "The {name} routine was cancelled",
  "{name}-rutinen kører · alarmen bliver {state}": "The {name} routine is running · the alarm will be {state}",
  "{name}-rutinen starter om {n} min": "The {name} routine starts in {n} min",
  "Hej {name}.": "Hi {name}.",
  "Du har {n} point.": "You have {n} points.",
  "Dine missioner er: {list}.": "Your missions are: {list}.",
  "Du har klaret alle dine missioner.": "You have done all your missions.",
  "Læser op …": "Reading aloud …",
  "Vælg en højttaler til oplæsning under Børn i familieindstillingerne": "Choose a speaker for reading aloud under Children in the family settings",
};

export default { id: "quick", views: {}, acts, inputs: {}, en };
