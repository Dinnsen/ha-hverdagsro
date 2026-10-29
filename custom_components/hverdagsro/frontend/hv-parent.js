/* Hverdagsro – the room game for the grown-ups: unlock a pack or a place for a child (or take it away again), give or take
   coins and levels, set the prices (all of them in per cent, a pack's things, a single place) and lock what a child may not
   buy. Everything is kept by Home Assistant (the family's game settings), so every device sees it. Only for grown-ups. */
let A = null; // { packs, places, placeName, packName, levels, levelOf, esc, redraw }
export function init(api) {
  A = api;
}
const DEFAULT = { mult: 100, prices: {}, locked: [] };
export const cfg = (ctx) => ({ ...DEFAULT, ...(ctx.data?.gamecfg || {}) });
/* The price of a thing, a place or a look with the grown-ups' settings: a price of its own, else one for its pack (per thing),
   else the base price in per cent. */
export function price(ctx, id, base, packId = "") {
  if (!ctx) return base;
  const c = cfg(ctx), own = c.prices?.[id];
  if (own != null) return own;
  const pk = packId ? c.prices?.[`pack:${packId}`] : undefined;
  if (pk != null) return pk;
  const step = base > 20 ? 5 : 1;
  return Math.round(((base || 0) * (c.mult ?? 100)) / 100 / step) * step;
}
export const locked = (ctx, id, packId = "") => {
  const c = cfg(ctx);
  return (c.locked || []).includes(id) || (!!packId && (c.locked || []).includes(`pack:${packId}`));
};
export const isGrownUp = (ctx) => !!ctx.data?.can_manage;
/* What the room game may do to the real house (Indstillinger › Spillet): all on, until a grown-up says otherwise. */
export const rights = (ctx) => ({ light: true, covers: true, media: true, kids_off: [], block: [], ...(ctx.data?.settings?.game_rights || {}) });

/* ------------------------------------------------------------------ the sheet */
const TABS = [["kid", "👧", "Barnet"], ["price", "💰", "Priser"], ["lock", "🔒", "Låse"]];
let S = null; // { tab, kid, el }
export function sheet(ctx) {
  if (!isGrownUp(ctx)) return;
  const kids = ctx.members().filter((m) => m.role === "child");
  S = { tab: "kid", kid: ctx.me?.role === "child" ? ctx.me.id : kids[0]?.id, el: null, edit: { ...cfg(ctx), prices: { ...cfg(ctx).prices }, locked: [...cfg(ctx).locked] } };
  const sh = ctx.sheet(draw(ctx, kids), { cls: "pl-pop gp-sheet", wide: true });
  S.el = sh.el;
  sh.el.addEventListener("click", (e) => onClick(ctx, e));
  sh.el.addEventListener("input", (e) => onInput(ctx, e));
}
const game = (ctx, id) => ({ coins: 0, xp: 0, owned: [], ...(ctx.data?.game?.[id] || {}) });
function draw(ctx, kids = ctx.members().filter((m) => m.role === "child")) {
  const t = ctx.t, e = A.esc;
  const tabs = TABS.map(([k, em, n]) => `<button class="pl-chip${S.tab === k ? " on" : ""}" data-gp="tab:${k}">${em} ${e(t(n))}</button>`).join("");
  return `<div class="gp"><h2>🔑 ${e(t("Forældre"))}</h2><p class="t-sub">${e(t("Lås op, sæt priser og lås ting, så de passer til jeres børn."))}</p><div class="av-mir-b">${tabs}</div>${body(ctx, kids)}<div class="pl-pop-b"><button class="btn" data-close>${e(t("Færdig"))}</button></div></div>`;
}
function body(ctx, kids) {
  const t = ctx.t, e = A.esc;
  if (S.tab === "kid") {
    const g = game(ctx, S.kid), lv = A.levelOf(g.xp), owned = new Set(g.owned);
    const chips = kids.map((m) => `<button class="pl-chip${m.id === S.kid ? " on" : ""}" data-gp="kid:${e(m.id)}">${e(m.name)}</button>`).join("");
    const btn = (k, label) => `<button class="pl-chip" data-gp="${k}">${e(label)}</button>`;
    const packs = A.packs().map((pk) => {
      const has = owned.has(`pack:${pk.id}`);
      return `<li><span>${pk.em} ${e(t(pk.n))}</span><button class="pl-chip${has ? " on" : ""}" data-gp="${has ? "revoke" : "grant"}:pack:${e(pk.id)}">${has ? `✓ ${e(t("Låst op"))}` : e(t("Lås op"))}</button></li>`;
    }).join("");
    const places = A.places().map((id) => {
      const has = owned.has(`place:${id}`);
      return `<li><span>${e(t(A.placeName(id)))}</span><button class="pl-chip${has ? " on" : ""}" data-gp="${has ? "revoke" : "grant"}:place:${e(id)}">${has ? `✓ ${e(t("Låst op"))}` : e(t("Lås op"))}</button></li>`;
    }).join("");
    return `<div class="av-mir-b">${chips}</div><p><b>${g.coins}</b> ${e(t("mønter"))} · ${e(t("niveau {n}", { n: lv }))} · ${g.xp} xp</p>
      <div class="av-mir-b">${btn("coins:-50", "−50")}${btn("coins:-10", "−10")}${btn("coins:10", "+10 🪙")}${btn("coins:50", "+50 🪙")}${btn("coins:200", "+200 🪙")}${btn("level:1", `⬆ ${t("Et niveau op")}`)}${btn("level:-1", `⬇ ${t("Et niveau ned")}`)}</div>
      <div class="av-mir-b">${btn("all", `🔓 ${t("Lås alle pakker og steder op")}`)}${btn("none", `🔒 ${t("Tag alt låst op væk")}`)}</div>
      <h3>${e(t("Pakker"))}</h3><ul class="gp-list">${packs}</ul><h3>${e(t("Steder"))}</h3><ul class="gp-list">${places}</ul>`;
  }
  const c = S.edit;
  if (S.tab === "price") {
    const rows = [...A.packs().map((pk) => [`pack:${pk.id}`, `${pk.em} ${t(pk.n)}`, t("pris pr. ting")]), ...A.places().map((id) => [`place:${id}`, t(A.placeName(id)), t("pris")])]
      .map(([k, n, ph]) => `<li><span>${e(n)}</span><input type="number" min="0" max="5000" step="5" inputmode="numeric" data-gp-price="${e(k)}" value="${c.prices[k] ?? ""}" placeholder="${e(ph)}" aria-label="${e(n)}"></li>`).join("");
    return `<label class="gp-mult"><span>${e(t("Alle priser"))}: <b>${c.mult}%</b></span><input type="range" min="0" max="300" step="10" value="${c.mult}" data-gp-mult="1" aria-label="${e(t("Alle priser"))}"></label>
      <p class="t-sub">${e(t("Et tal i et felt gælder for den ene pakke eller det ene sted og slår procenten. Tomt felt = standardprisen. 0 = gratis."))}</p>
      <ul class="gp-list">${rows}</ul><div class="pl-pop-b"><button class="btn" data-gp="save">${e(t("Gem priser"))}</button></div>`;
  }
  const rows = [...A.packs().map((pk) => [`pack:${pk.id}`, `${pk.em} ${t(pk.n)}`]), ...A.places().map((id) => [`place:${id}`, t(A.placeName(id))])]
    .map(([k, n]) => `<li><span>${e(n)}</span><button class="pl-chip${c.locked.includes(k) ? " on" : ""}" data-gp="lock:${e(k)}">${c.locked.includes(k) ? `🔒 ${e(t("Låst"))}` : e(t("Åben"))}</button></li>`).join("");
  return `<p class="t-sub">${e(t("Det, der er låst, kan børnene ikke købe, før en voksen låser det op."))}</p><ul class="gp-list">${rows}</ul><div class="pl-pop-b"><button class="btn" data-gp="save">${e(t("Gem låse"))}</button></div>`;
}
function rerender(ctx) {
  const box = S?.el?.querySelector(".gp");
  if (box) box.outerHTML = draw(ctx);
}
async function admin(ctx, payload) {
  const res = await ctx.ws("game_admin", payload);
  if (payload.action === "config") ctx.data.gamecfg = res;
  else ctx.data.game = { ...(ctx.data.game || {}), [payload.member]: res };
  return res;
}
async function onClick(ctx, ev) {
  const b = ev.target.closest?.("[data-gp]");
  if (!b || !S) return;
  const k = b.dataset.gp, id = S.kid;
  try {
    if (k.startsWith("tab:")) S.tab = k.slice(4);
    else if (k.startsWith("kid:")) S.kid = k.slice(4);
    else if (k.startsWith("grant:")) await admin(ctx, { action: "grant", member: id, items: [k.slice(6)] });
    else if (k.startsWith("revoke:")) await admin(ctx, { action: "revoke", member: id, items: [k.slice(7)] });
    else if (k.startsWith("coins:")) await admin(ctx, { action: "coins", member: id, amount: +k.slice(6) });
    else if (k.startsWith("level:")) {
      const g = game(ctx, id), lv = A.levelOf(g.xp), to = Math.max(1, Math.min(A.levels.length, lv + +k.slice(6)));
      await admin(ctx, { action: "xp", member: id, amount: A.levels[to - 1] - g.xp });
    } else if (k === "all") await admin(ctx, { action: "grant", member: id, items: [...A.packs().map((pk) => `pack:${pk.id}`), ...A.places().map((p) => `place:${p}`)] });
    else if (k === "none") await admin(ctx, { action: "revoke", member: id, items: game(ctx, id).owned.filter((x) => /^(pack|place):/.test(x)) });
    else if (k.startsWith("lock:")) {
      const key = k.slice(5), l = S.edit.locked;
      S.edit.locked = l.includes(key) ? l.filter((x) => x !== key) : [...l, key];
    } else if (k === "save") {
      await admin(ctx, { action: "config", config: { mult: S.edit.mult, prices: S.edit.prices, locked: S.edit.locked } });
      ctx.toast(ctx.t("Gemt"));
    }
  } catch (err) {
    ctx.toast(String(err?.message || err));
  }
  rerender(ctx);
  A.redraw(ctx);
}
function onInput(ctx, ev) {
  const el = ev.target;
  if (!S || !el) return;
  if (el.dataset.gpMult) {
    S.edit.mult = +el.value;
    const b = el.closest(".gp-mult")?.querySelector("b");
    if (b) b.textContent = `${S.edit.mult}%`;
  } else if (el.dataset.gpPrice) {
    const v = el.value.trim();
    if (v === "") delete S.edit.prices[el.dataset.gpPrice];
    else S.edit.prices[el.dataset.gpPrice] = Math.max(0, Math.min(5000, Math.round(+v) || 0));
  }
}

export const PARENT_EN = {
  Forældre: "Grown-ups", "Lås op, sæt priser og lås ting, så de passer til jeres børn.": "Unlock things, set prices and lock things to suit your children.", Barnet: "The child", Priser: "Prices", Låse: "Locks",
  mønter: "coins", "niveau {n}": "level {n}", "Et niveau op": "One level up", "Et niveau ned": "One level down", "Lås alle pakker og steder op": "Unlock all packs and places", "Tag alt låst op væk": "Take all unlocked packs and places away",
  Pakker: "Packs", Steder: "Places", "Lås op": "Unlock", "Låst op": "Unlocked", "pris pr. ting": "price per thing", pris: "price", "Alle priser": "All prices",
  "Et tal i et felt gælder for den ene pakke eller det ene sted og slår procenten. Tomt felt = standardprisen. 0 = gratis.": "A number in a field is for that one pack or place and beats the per cent. Empty = the standard price. 0 = free.",
  "Gem priser": "Save prices", "Gem låse": "Save locks", Gemt: "Saved", Låst: "Locked", Åben: "Open", "Det, der er låst, kan børnene ikke købe, før en voksen låser det op.": "What is locked cannot be bought by the children until a grown-up unlocks it.",
  "Låst af en voksen": "Locked by a grown-up",
};
export const PARENT_CSS = `
.gp { text-align: center; }
.gp h3 { margin: 14px 0 4px; }
.gp-list { list-style: none; margin: 6px 0; padding: 0; max-height: 38vh; overflow: auto; text-align: left; }
.gp-list li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 4px; border-bottom: 1px solid rgba(0,0,0,.08); }
.gp-list input { width: 110px; padding: 6px 8px; border-radius: 10px; border: 2px solid #2B2340; font: inherit; }
.gp-mult { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }
.gp .pl-chip.on { background: #2B2340; color: #fff; }
`;
