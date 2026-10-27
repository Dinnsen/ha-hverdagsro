/* Hverdagsro – the child's own wall in the game: the school timetable and the routine list hang as two little posters
   by the window, with a tick over what is done. Tapped, they open big enough to read; the routine cards can be ticked
   off there too. And the bubbles of the day can be tucked away and fetched again. */
import { esc } from "./hv-core.js";
import * as Kids from "./hv-kids.js";
import { OL } from "./hv-playcat.js";

let A = null; // { st, save, redraw, sfx }
export function init(api) {
  A = api;
}
const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/* The school day the poster shows: today on a weekday, else the next Monday. */
function schoolDay() {
  const d = sod(new Date()), w = d.getDay();
  if (w === 6) d.setDate(d.getDate() + 2);
  if (w === 0) d.setDate(d.getDate() + 1);
  return d;
}
function lessons(ctx, m) {
  if (!m?.skema || !ctx.feature(m, "skema")) return null;
  const d = schoolDay(), e = new Date(d.getTime() + 864e5);
  return ctx.events([m.skema], d, e).filter((x) => !x.allDay).sort((a, b) => a.start - b.start);
}
/* The routine cards of the day: [slot, name, [[emoji, label, done, index]]]. */
function routines(ctx, m) {
  if (!ctx.on("board") || !ctx.feature(m, "board")) return null;
  const B = ctx.data.routines?.boards?.[m.id] || {}, done = ctx.data.board_done?.[m.id] || [];
  const card = (cid) => (Kids.RCARDS || []).find((x) => x[0] === cid) || (ctx.data.routines?.cards || []).find((x) => x[0] === cid) || [cid, cid, "⭐"];
  const out = (Kids.RSLOTS || []).filter(([slot]) => (B[slot] || []).length).map(([slot, name]) => [slot, name, B[slot].map((cid, i) => {
    const c = card(cid);
    return [c[2], c[1], done.includes(`${slot}:${i}`), i];
  })]);
  return out.length ? out : null;
}
/* The slot of the day right now. */
const slotNow = () => {
  const h = new Date().getHours();
  return h < 12 ? "morgen" : h < 17.5 ? "eftermiddag" : "aften";
};

/* ------------------------------------------------------------------ the posters */
export function wallSvg(ctx, m) {
  const t = ctx.t, L = lessons(ctx, m), R = routines(ctx, m);
  let s = "";
  if (L) {
    const x = 300, y = 282, w = 96, h = 134, list = L.slice(0, 6);
    s += `<g class="wl-poster" data-pl="wall-skema" role="button" aria-label="${esc(t("Mit skema"))}" transform="rotate(-3 ${x + w / 2} ${y})"><path d="M${x + w / 2} ${y - 18} L${x + 10} ${y} M${x + w / 2} ${y - 18} L${x + w - 10} ${y}" stroke="${OL}" stroke-width="2"/><circle cx="${x + w / 2}" cy="${y - 18}" r="4" fill="#E5484D"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="${OL}" stroke-width="3.5"/><rect x="${x}" y="${y}" width="${w}" height="24" rx="8" fill="#0EA5E9" stroke="${OL}" stroke-width="3.5"/><text x="${x + w / 2}" y="${y + 17}" class="wl-h">${esc(t("SKEMA"))}</text>${list.length ? list.map((e, i) => `<rect x="${x + 8}" y="${y + 29 + i * 17}" width="${w - 16}" height="14" rx="4" fill="${Kids.subjColor ? Kids.subjColor(e.title) : "#C7E6FF"}"/><text x="${x + 12}" y="${y + 40 + i * 17}" class="wl-t">${esc(String(e.title).slice(0, 11))}</text>`).join("") : `<text x="${x + w / 2}" y="${y + 70}" class="wl-e">${esc(t("Fri!"))}</text>`}</g>`;
  }
  if (R) {
    const x = 410, y = 282, w = 92, h = 134, cur = R.find((r) => r[0] === slotNow()) || R[0], cards = cur[2].slice(0, 6);
    s += `<g class="wl-poster" data-pl="wall-rutine" role="button" aria-label="${esc(t("Mine rutiner"))}" transform="rotate(2.5 ${x + w / 2} ${y})"><path d="M${x + w / 2} ${y - 18} L${x + 10} ${y} M${x + w / 2} ${y - 18} L${x + w - 10} ${y}" stroke="${OL}" stroke-width="2"/><circle cx="${x + w / 2}" cy="${y - 18}" r="4" fill="#6BCB77"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#FFF6E6" stroke="${OL}" stroke-width="3.5"/><rect x="${x}" y="${y}" width="${w}" height="24" rx="8" fill="#8B5CF6" stroke="${OL}" stroke-width="3.5"/><text x="${x + w / 2}" y="${y + 17}" class="wl-h">${esc(t("RUTINE"))}</text>${cards.map(([em, , done], i) => `<text x="${x + 14}" y="${y + 43 + i * 17}" class="wl-em">${em}</text><rect x="${x + 30}" y="${y + 32 + i * 17}" width="${w - 44}" height="7" rx="3.5" fill="${done ? "#C9C2D6" : "#2B2340"}" opacity="${done ? 0.6 : 0.25}"/>${done ? `<path d="M${x + w - 24} ${y + 35 + i * 17} l5 5 l9 -11" stroke="#3FA34D" stroke-width="3.5" fill="none" stroke-linecap="round"/>` : `<rect x="${x + w - 22}" y="${y + 30 + i * 17}" width="12" height="12" rx="3" fill="#fff" stroke="${OL}" stroke-width="2"/>`}`).join("")}</g>`;
  }
  return s;
}

/* ------------------------------------------------------------------ the posters, big */
export function tap(ctx, el) {
  const k = el?.dataset?.pl;
  if (k === "wall-skema") return openSkema(ctx);
  if (k === "wall-rutine") return openRoutine(ctx);
  if (k === "bubhide" || k === "bubshow") {
    A.st().d.bubHide = k === "bubhide";
    A.sfx("tap");
    A.save(ctx);
    A.redraw(ctx);
    return true;
  }
  return false;
}
function openSkema(ctx) {
  const m = ctx.member(A.st().kid);
  if (!m) return true;
  // The whole week, as on the Skema page, without the buttons to change week.
  const grid = () => Kids.skemaGrid(ctx, m).replace(/<span class="chip hk-wk">[\s\S]*?<\/span><\/div>$/, "</div>");
  const sh = ctx.sheet(`<div class="wl-big"><h2>📅 ${esc(ctx.t("Mit skema"))}</h2><div class="wl-grid">${grid()}</div><div class="sheet-actions"><button class="btn" data-close>${esc(ctx.t("Luk"))}</button></div></div>`, { cls: "wl-sheet", wide: true });
  // The week's lessons may still be on their way from the calendar: draw them when they come.
  let n = 0;
  const again = () => {
    if (!sh.el.isConnected || n++ > 8) return;
    const box = sh.el.querySelector(".wl-grid"), html = grid();
    if (box && box.innerHTML !== html) box.innerHTML = html;
    setTimeout(again, 600);
  };
  setTimeout(again, 400);
  return true;
}
function routineHtml(ctx, m) {
  const R = routines(ctx, m) || [], now = slotNow();
  return R.map(([slot, name, cards]) => `<section class="wl-slot${slot === now ? " now" : ""}"><h3>${esc(ctx.t(name))}${slot === now ? ` <small>${esc(ctx.t("nu"))}</small>` : ""}</h3><ul>${cards.map(([em, label, done, i]) => `<li><button class="wl-card${done ? " done" : ""}" data-act="wall-card" data-slot="${slot}" data-i="${i}"${done ? " disabled" : ""}><span class="wl-cem">${em}</span><span>${esc(ctx.t(label))}</span><i>${done ? "✓" : ""}</i></button></li>`).join("")}</ul></section>`).join("");
}
function openRoutine(ctx) {
  const m = ctx.member(A.st().kid);
  if (!m) return true;
  ctx.sheet(`<div class="wl-big"><h2>✅ ${esc(ctx.t("Mine rutiner"))}</h2><div class="wl-slots">${routineHtml(ctx, m)}</div><div class="sheet-actions"><button class="btn" data-close>${esc(ctx.t("Luk"))}</button></div></div>`, { cls: "wl-sheet" });
  return true;
}
export const WALL_ACTS = {
  /* Tick a routine card off on the big poster. */
  "wall-card": async (el, e, ctx) => {
    const m = ctx.member(A.st().kid), slot = el.dataset.slot, i = +el.dataset.i;
    if (!m) return;
    el.classList.add("done");
    el.disabled = true;
    el.querySelector("i").textContent = "✓";
    A.sfx("coin");
    try {
      const res = await ctx.ws("board", { member: m.id, slot, index: i, done: true });
      (ctx.data.board_done ||= {})[m.id] = res.done;
      A.redraw(ctx);
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  },
};

/* ------------------------------------------------------------------ the bubbles tucked away */
export function bubToggle(ctx, n, hidden) {
  const t = ctx.t;
  if (hidden) return `<g class="pl-bubmini" data-pl="bubshow" role="button" aria-label="${esc(t("Vis dagens ting"))}" transform="translate(52 52)"><circle r="30" fill="#fff" stroke="#FFB347" stroke-width="6"/><text y="10" text-anchor="middle" font-size="28">📋</text><g transform="translate(22 -22)"><circle r="14" fill="#E5484D" stroke="#fff" stroke-width="3"/><text y="5" text-anchor="middle" class="pl-pocketn">${n}</text></g></g>`;
  return "";
}
export function hideButton(ctx, x, y) {
  return `<g class="pl-bubhide" data-pl="bubhide" role="button" aria-label="${esc(ctx.t("Gem boblerne væk"))}" transform="translate(${x} ${y})"><circle r="18" fill="#fff" stroke="${OL}" stroke-width="3" opacity=".9"/><path d="M-7 4 l7 -7 l7 7" stroke="${OL}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

export const WALL_CSS = `
.wl-poster { cursor: pointer; }
.wl-poster:hover > rect:first-of-type { filter: brightness(1.05); }
.wl-h { font: 900 13px system-ui, sans-serif; fill: #fff; text-anchor: middle; letter-spacing: .06em; }
.wl-t { font: 800 10px system-ui, sans-serif; fill: #2B2340; }
.wl-e { font: 900 16px system-ui, sans-serif; fill: #2B2340; text-anchor: middle; }
.wl-em { font-size: 13px; text-anchor: middle; }
.pl-bubhide, .pl-bubmini { cursor: pointer; }
.wl-big h2 { margin: 0 0 12px; }
.wl-slots { display: grid; gap: 14px; }
.wl-slot h3 { margin: 0 0 8px; font-size: 18px; }
.wl-slot h3 small { font-size: 12px; background: #FFD93D; color: #2B2340; border-radius: 999px; padding: 2px 8px; vertical-align: middle; }
.wl-slot ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.wl-card { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border-radius: 16px; border: 2px solid var(--line, #E2E2EA); background: var(--card, #fff); color: inherit; font: inherit; font-size: 18px; font-weight: 700; text-align: left; cursor: pointer; }
.wl-card .wl-cem { font-size: 28px; }
.wl-card i { margin-left: auto; width: 30px; height: 30px; border-radius: 9px; border: 2.5px solid currentColor; display: grid; place-items: center; font-style: normal; font-weight: 900; color: #3FA34D; }
.wl-card.done { opacity: .6; text-decoration: line-through; cursor: default; }
.wl-card.done i { background: #DFF5E1; }
.wl-sheet .skema-wrap { max-height: 70vh; }
`;
export const WALL_EN = { SKEMA: "TIMETABLE", RUTINE: "ROUTINE", "Fri!": "Free!", "Mine rutiner": "My routines", nu: "now", "Vis dagens ting": "Show today's things", "Gem boblerne væk": "Tuck the bubbles away", Luk: "Close" };
