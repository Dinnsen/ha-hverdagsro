/* Hverdagsro – the family panel for Home Assistant. No build step, no dependencies.
   The panel is a web component with a shadow root. Every page is a module (hv-*.js) that renders
   from one shared context; see hv-core.js for the contract. */
import css from "./hv-style.js";
import css2 from "./hv-style2.js";
import { addDays, createCtx, esc, startOfDay } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import { addTexts } from "./hv-text.js";
import { createSky, weatherKind } from "./hv-sky.js";
import { activeDecor, ageOn, occasions, wedName } from "./hv-decor.js";
import home from "./hv-home.js";
import lists from "./hv-lists.js";
import music from "./hv-music.js";
import appliances from "./hv-appliances.js";
import security from "./hv-security.js";
import house from "./hv-house.js";
import rooms from "./hv-rooms.js";
import settings from "./hv-settings.js";
import energy, { hasStatus, statusHtml } from "./hv-energy.js";

const MODULES = [home, lists, music, appliances, security, house, rooms, settings, energy];

/* The tabs, in order. [view, label, icon, module flag (or null), who] */
const PARENT_TABS = [
  ["hjem", "Hjem", "home", null],
  ["kalender", "Kalender", "cal", "calendar"],
  ["opgaver", "Opgaver", "tasks", "missions"],
  ["madplan", "Madplan", "food", "meals"],
  ["lister", "Lister", "lists", "lists"],
  ["musik", "Musik", "music", "music"],
  ["apparater", "Apparater", "plug", "appliances"],
  ["sikkerhed", "Huset", "shield", "security"],
];
const KID_TABS = [
  ["dag", "Min dag", "home", null],
  ["shop", "Shop", "shop", "shop"],
  ["vaerelse", "Værelse", "bulb", "house"],
  ["lister", "Lister", "lists", "lists"],
];
const WX_ICON = { rain: "rain", snow: "snow", cloudy: "cloudy", partly: "partly", sun: "sun" };
const TL0 = 6, TL1 = 24;
const pct = (h) => ((Math.max(TL0, Math.min(TL1, h)) - TL0) / (TL1 - TL0)) * 100;
const priceColor = (p, lo, hi) => {
  const t = hi > lo ? (p - lo) / (hi - lo) : 0.5;
  return t < 0.25 ? "#3CCB83" : t < 0.5 ? "#F0C04A" : t < 0.75 ? "#F08A3A" : "#F0564A";
};

class HverdagsroPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.ctx = createCtx(this);
    this._queued = false;
    this._lastRender = 0;
    this._wxOpen = false;
    this._forecast = { daily: [], hourly: [] };
    this._unsubs = [];
    this.ctx.modules = MODULES;
    for (const m of MODULES) {
      addTexts(m.en);
      Object.assign(this.ctx.views, m.views || {});
      Object.assign(this.ctx.acts, m.acts || {});
      Object.assign(this.ctx.inputs, m.inputs || {});
    }
    this.ctx.panel = this;
    this.ctx.applyTheme = () => this._theme();
    // Shared with the modules: the coming waste pickups and the weather forecast.
    this.ctx.waste = () => this._wasteList();
    Object.defineProperty(this.ctx, "forecast", { get: () => this._forecast });
  }

  // ------------------------------------------------------------------ Home Assistant
  set hass(hass) {
    const first = !this.ctx.hass;
    const old = this.ctx.hass;
    this.ctx.hass = hass;
    if (first) {
      this._boot();
      return;
    }
    if (!this.ctx.data) return;
    // Re-render when an entity the page shows has changed.
    for (const id of this.ctx._watch) {
      if (old?.states?.[id] !== hass.states?.[id]) {
        this.requestRender();
        this._header();
        return;
      }
    }
    if (old?.themes?.darkMode !== hass.themes?.darkMode) this._theme();
  }
  get hass() {
    return this.ctx.hass;
  }
  set narrow(narrow) {
    this.ctx.narrow = !!narrow;
    this.toggleAttribute("narrow", !!narrow);
    this._menuBtn();
  }
  set panel(panel) {
    this.ctx.config = panel?.config || {};
  }
  set route(_route) {}

  connectedCallback() {
    if (this.ctx.hass && !this._unsubs.length && this._booted) this._subscribe();
    this._sky?.start();
    this._tick = setInterval(() => this._header(), 30000);
  }

  disconnectedCallback() {
    for (const u of this._unsubs) {
      try {
        u();
      } catch (e) {
        /* already gone */
      }
    }
    this._unsubs = [];
    this._sky?.stop();
    clearInterval(this._tick);
  }

  // ------------------------------------------------------------------ start
  _boot() {
    this._booted = true;
    const root = this.shadowRoot;
    root.innerHTML = `<style>${css}${css2}${MODULES.map((m) => m.css || "").join("\n")}</style>
      <div class="hv-app" id="app">
        <header class="hero compact" id="hero">
          <canvas id="sky" aria-hidden="true"></canvas>
          <button class="waste-hit" id="waste-hit" hidden></button>
          <div class="wrap">
            <div class="hero-top">
              <button class="glass hbtn menu-btn" id="menu-btn" hidden aria-label="Menu">${svg("menu")}</button>
              <button class="brand" id="brand" aria-label="Hverdagsro">${svg("home")}<span>Hverdagsro</span></button>
              <span class="mini-title" id="mini-title"></span>
              <span class="grow"></span>
              <span class="clock num" id="clock"></span>
              <button class="glass wx-btn" id="wx-btn" hidden aria-expanded="false"></button>
              <button class="glass hbtn" id="alarm-btn" hidden></button>
              <button class="glass me" id="me" aria-haspopup="menu"></button>
            </div>
            <div class="greet" id="greet"></div>
            <div class="spacer"></div>
            <div class="tl-wrap" id="tl-wrap">
              <div class="tl-row"><span class="tl-next" id="tl-next"></span><span class="tl-hint" id="tl-hint"></span><span class="grow"></span><button class="back-now" id="back-now" hidden></button></div>
              <div class="tl" id="tl" role="slider" tabindex="0" aria-valuemin="6" aria-valuemax="24"></div>
              <div class="wk" id="wk"></div>
            </div>
          </div>
        </header>
        <section class="status" id="status-sec" hidden aria-label="El og biler"><div class="wrap" id="status"></div></section>
        <nav class="tabs"><div class="wrap" role="tablist" id="tabs"></div></nav>
        <div class="fab" id="fab" hidden></div>
        <main class="wrap" id="main"><div class="hv-loading">${svg("home")}<span>${esc(this.ctx.t("Henter Hverdagsro …"))}</span></div></main>
      </div>`;
    this.scroller = this;
    const ctx = this.ctx;
    this._sky = createSky(ctx.$("sky"), {
      decor: () => this._decor(),
      alarm: () => this._alarmLook(),
      waste: () => this._bins(),
      wasteButton: ctx.$("waste-hit"),
    });
    this._sky.start();
    this._bindHeader();
    this._bindMain();
    this._bindFab();
    this._menuBtn();
    for (const m of MODULES) m.init?.(ctx);
    this._subscribe();
  }

  async _subscribe() {
    const ctx = this.ctx;
    try {
      const unsub = await ctx.hass.connection.subscribeMessage((state) => this._onState(state), { type: "hverdagsro/subscribe" });
      this._unsubs.push(unsub);
    } catch (err) {
      ctx.$("main").innerHTML = `<section class="card hv-empty">${svg("bell", "ic big")}<h2>${esc(ctx.t("Hverdagsro svarer ikke"))}</h2><p class="t-sub">${esc(err?.message || String(err))}</p></section>`;
    }
  }

  _onState(state) {
    const ctx = this.ctx;
    const first = !ctx.data;
    ctx.data = state;
    try {
      ctx.viewAs = localStorage.getItem("hverdagsro-as") || null;
    } catch (e) {
      ctx.viewAs = null;
    }
    ctx.refreshMe();
    if (first) {
      let start = null;
      try {
        start = sessionStorage.getItem("hverdagsro-view");
      } catch (e) {
        /* private mode */
      }
      const [v, ...rest] = String(start || this._homeView()).split(":");
      ctx.view = v;
      ctx.arg = rest.join(":");
      this._weatherSubscribe();
    }
    this._theme();
    this.requestRender(true);
  }

  _homeView() {
    return this.ctx.isKid ? "dag" : "hjem";
  }

  _theme() {
    const ctx = this.ctx, m = ctx.me;
    const skin = m?.skin || "standard";
    const mode = m?.mode || "auto";
    const dark = skin === "rummet" || (mode === "auto" ? !!ctx.hass?.themes?.darkMode : mode === "dark");
    this.setAttribute("data-skin", skin);
    this.setAttribute("data-theme", dark ? "dark" : "light");
  }

  // ------------------------------------------------------------------ render
  requestRender(now = false) {
    if (now) {
      this._render();
      return;
    }
    if (this._queued) return;
    this._queued = true;
    const wait = Math.max(0, 250 - (performance.now() - this._lastRender));
    setTimeout(() => {
      this._queued = false;
      // Don't redraw under someone's fingers.
      const active = this.shadowRoot.activeElement;
      if (active && active.matches?.("input, textarea, select") && this.ctx.$("main").contains(active)) {
        this._dirty = true;
        return;
      }
      if (this.ctx._busy || this.shadowRoot.querySelector(".sheet-bg.locked")) {
        this._dirty = true;
        return;
      }
      this._render();
    }, wait);
  }

  _tabs() {
    const ctx = this.ctx;
    const list = (ctx.isKid ? KID_TABS : PARENT_TABS).filter(([v, , , mod]) => ctx.views[v] && (!mod || ctx.on(mod)) && (ctx.views[v].visible?.(ctx) ?? true));
    return list.map(([v, label, icon]) => [v, ctx.t(label), icon]);
  }

  _validView() {
    const ctx = this.ctx;
    if (!ctx.data.setup_done) return ctx.isParent ? "guide" : "ikke-klar";
    if (!ctx.me && !ctx.isParent) return "hvem";
    const v = ctx.views[ctx.view];
    if (!v) return this._homeView();
    if (v.parentOnly && !ctx.isParent) return this._homeView();
    if (v.kidOnly && !ctx.isKid) return this._homeView();
    // Children only get their own pages.
    if (ctx.isKid && !KID_TABS.some((t) => t[0] === ctx.view) && !["mig", "rum", "hvem"].includes(ctx.view)) return this._homeView();
    if (v.module && !ctx.on(v.module)) return this._homeView();
    return ctx.view;
  }

  _render() {
    const ctx = this.ctx;
    if (!ctx.data) return;
    this._lastRender = performance.now();
    this._dirty = false;
    const valid = this._validView();
    if (valid !== ctx.view) {
      ctx.view = valid;
      ctx.arg = valid === ctx.view ? ctx.arg : "";
    }
    ctx._watch = new Set();
    const view = ctx.views[ctx.view] || { render: () => `<section class="card hv-empty">${svg("more", "ic big")}<h2>${esc(ctx.t("Siden findes ikke"))}</h2></section>` };
    let html;
    try {
      html = view.render(ctx);
    } catch (err) {
      console.error("Hverdagsro:", err);
      html = `<section class="card hv-empty">${svg("bell", "ic big")}<h2>${esc(ctx.t("Siden kunne ikke vises"))}</h2><p class="t-sub">${esc(err?.message || err)}</p></section>`;
    }
    const main = ctx.$("main");
    const scrollTop = this.scrollTop;
    const fresh = this._shown !== `${ctx.view}:${ctx.arg}`;
    this._shown = `${ctx.view}:${ctx.arg}`;
    main.innerHTML = `<div class="view v-${esc(ctx.view)}${fresh ? " view-in" : ""}">${html}</div>`;
    this.scrollTop = scrollTop;
    this._buildTabs();
    this._header();
    try {
      view.after?.(ctx);
    } catch (err) {
      console.error("Hverdagsro:", err);
    }
  }

  _buildTabs() {
    const ctx = this.ctx;
    const tabs = ctx.$("tabs");
    const hidden = ["guide", "ikke-klar", "hvem"].includes(ctx.view);
    tabs.parentElement.hidden = hidden;
    if (hidden) return;
    let T = this._tabs(), more = [];
    if (this.clientWidth < 860 && T.length > 5) {
      more = T.slice(4);
      T = T.slice(0, 4);
    }
    this._more = more;
    // Pages without their own tab light up the tab they belong to.
    const cur = ({ rum: ctx.isKid ? "vaerelse" : "sikkerhed", husbygger: "sikkerhed", person: "hjem" })[ctx.view] || ctx.view;
    const badge = (v) => {
      if (v === "opgaver" && ctx.isParent) return (ctx.data.requests || []).filter((r) => r.status === "pending").length;
      if (v === "dag" && ctx.me) return ctx.views.dag?.badge?.(ctx) || 0;
      return 0;
    };
    tabs.innerHTML =
      T.map(([id, name, ic]) => {
        const n = badge(id);
        return `<button class="tab" role="tab" aria-selected="${id === cur}" data-tab="${id}">${svg(ic)}<span>${esc(name)}</span>${n ? `<span class="badge num">${n}</span>` : ""}</button>`;
      }).join("") +
      (more.length
        ? `<button class="tab" role="tab" aria-selected="${more.some((t) => t[0] === cur)}" data-more="1">${svg(more.find((t) => t[0] === cur)?.[2] || "more")}<span>${esc(more.find((t) => t[0] === cur)?.[1] || ctx.t("Mere"))}</span></button>`
        : "");
  }

  // ------------------------------------------------------------------ header
  _menuBtn() {
    const b = this.ctx.$?.("menu-btn");
    if (b) b.hidden = !this.ctx.narrow;
  }

  _bindHeader() {
    const ctx = this.ctx;
    ctx.$("menu-btn").addEventListener("click", () => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })));
    ctx.$("brand").addEventListener("click", () => ctx.go(this._homeView()));
    ctx.$("me").addEventListener("click", () => this._profileMenu());
    ctx.$("alarm-btn").addEventListener("click", () => ctx.acts.alarm?.(null, null, ctx));
    ctx.$("waste-hit").addEventListener("click", () => this._wasteSheet());
    ctx.$("wx-btn").addEventListener("click", () => {
      if (ctx.view !== this._homeView()) {
        this._wxOpen = true;
        ctx.go(this._homeView());
      } else {
        this._wxOpen = !this._wxOpen;
        this._header();
      }
    });
    const tl = ctx.$("tl");
    const set = (e) => {
      const r = tl.getBoundingClientRect();
      this._sky.setHour(TL0 + Math.max(0, Math.min(0.999, (e.clientX - r.left) / r.width)) * (TL1 - TL0));
      this._now();
    };
    let scrub = false;
    tl.addEventListener("pointerdown", (e) => {
      scrub = true;
      try {
        tl.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      set(e);
    });
    tl.addEventListener("pointermove", (e) => scrub && set(e));
    tl.addEventListener("pointerup", () => (scrub = false));
    tl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      this._sky.setHour(Math.max(TL0, Math.min(TL1 - 0.01, this._sky.hour + (e.key === "ArrowRight" ? 0.25 : -0.25))));
      this._now();
      e.preventDefault();
    });
    ctx.$("back-now").addEventListener("click", () => {
      this._sky.setHour(null);
      this._now();
    });
    ctx.$("tabs").addEventListener("click", (e) => {
      if (e.target.closest("[data-more]")) return this._moreSheet();
      const b = e.target.closest("[data-tab]");
      if (b) ctx.go(b.dataset.tab);
    });
  }

  _header() {
    const ctx = this.ctx;
    if (!ctx.data || !ctx.hass) return;
    const hero = ctx.$("hero");
    const home = ctx.view === this._homeView();
    const big = home && ctx.data.setup_done;
    hero.classList.toggle("compact", !big);
    hero.classList.toggle("open", big && this._wxOpen);
    const view = ctx.views[ctx.view];
    ctx.$("mini-title").textContent = view?.title?.(ctx) || "";
    // Electricity and cars under the sky, on the parents' home page.
    const sec = ctx.$("status-sec");
    const showStatus = big && hasStatus(ctx);
    sec.hidden = !showStatus;
    if (showStatus) {
      const html = statusHtml(ctx);
      if (html !== this._statusHtml) ctx.$("status").innerHTML = this._statusHtml = html;
    }
    this._fab();
    // Sun and weather
    const sun = ctx.hass.states["sun.sun"];
    if (sun) {
      const hrs = (iso) => {
        const d = new Date(iso);
        return d.getHours() + d.getMinutes() / 60;
      };
      const rise = sun.attributes.next_rising && hrs(sun.attributes.next_rising);
      const set = sun.attributes.next_setting && hrs(sun.attributes.next_setting);
      if (rise && set) this._sky.setSun(rise, set);
    }
    const wxId = ctx.data.settings.weather || ctx.entities("weather")[0];
    const wx = wxId && ctx.hass.states[wxId];
    const wxBtn = ctx.$("wx-btn");
    if (wx) {
      const kind = weatherKind(wx.state);
      this._sky.setWeather(kind);
      const t = wx.attributes.temperature;
      wxBtn.hidden = false;
      wxBtn.innerHTML = `${svg(WX_ICON[kind])}<span class="num">${t != null ? Math.round(t) + "°" : ""}</span>${svg("chev", "ic chev")}`;
      wxBtn.title = ctx.t("Vejrudsigten");
      wxBtn.setAttribute("aria-expanded", String(big && this._wxOpen));
    } else wxBtn.hidden = true;
    // Alarm
    const al = ctx.data.settings.alarm && ctx.on("security") ? ctx.hass.states[ctx.data.settings.alarm] : null;
    const ab = ctx.$("alarm-btn");
    ab.hidden = !al || ctx.isKid;
    if (al) {
      const look = this._alarmLook();
      ab.innerHTML = `<span class="ashield${look ? " armed" : ""}" style="--ac:${look ? look.color : "var(--good)"}">${svg("shieldf")}</span>`;
      ab.title = ctx.t("Alarm") + ": " + (ctx.hass.formatEntityState ? ctx.hass.formatEntityState(al) : al.state);
    }
    // Me
    const me = ctx.me;
    ctx.$("me").innerHTML = me
      ? `${ctx.avatar(me.id)}<span class="nm">${esc(me.name)}</span>`
      : `<span class="av" style="background:#6E4AFF">${esc((ctx.hass.user?.name || "?").charAt(0))}</span><span class="nm">${esc(ctx.hass.user?.name || "")}</span>`;
    ctx.$("clock").textContent = ctx.fmt.time(new Date());
    this._greet(big);
    this._timeline(big);
    this._now();
  }

  _greet(big) {
    const ctx = this.ctx;
    const g = ctx.$("greet");
    if (!big) {
      g.innerHTML = "";
      return;
    }
    const now = new Date();
    const h = now.getHours();
    const hello = h < 5 ? "God nat" : h < 10 ? "God morgen" : h < 12 ? "God formiddag" : h < 18 ? "God eftermiddag" : "God aften";
    const week = ctx.lang() === "da" ? ` · ${ctx.t("uge")} ${isoWeek(now)}` : "";
    const date = `${ctx.fmt.day(now)} ${ctx.fmt.date(now)}${week}`;
    const me = ctx.me;
    const chips = [this._decorChip()];
    if (ctx.isKid && me) {
      const k = ctx.views.dag?.summary?.(ctx) || {};
      if (ctx.on("points")) chips.push(`<span class="glass">${svg("pstar")}<span class="num">${ctx.points(me.id)}</span> ${esc(ctx.t("point"))}</span>`);
      if (ctx.on("missions") && k.total) chips.push(`<span class="glass">${k.done}/${k.total} ${esc(ctx.t("missioner"))}</span>`);
      g.innerHTML = `<div class="date">${esc(cap(date))}</div><h1>${esc(ctx.t("Hej {name}", { name: me.name }))}</h1><div class="kidbar">${chips.join("")}</div>`;
    } else {
      const next = this._todayEvents().find((e) => !e.allDay && e.start > now);
      if (next) chips.push(`<span class="hl">${svg("clock")}${esc(next.title)} ${esc(ctx.t("kl."))} ${ctx.fmt.time(next.start)}</span>`);
      g.innerHTML = `<div class="date">${esc(cap(date))}</div><h1>${esc(ctx.t(hello))}${me ? `, ${esc(me.name)}` : ""}</h1><div class="line">${chips.join("")}</div>`;
    }
    g.querySelector("[data-decor]")?.addEventListener("click", () => ctx.go("indstillinger:pynt"));
  }

  _todayEvents() {
    const ctx = this.ctx;
    let cals = [...(ctx.data.settings.calendars || [])];
    if (ctx.isKid) {
      // A child sees the shared calendars and their own, not the other members' calendars.
      const others = new Set(ctx.members().filter((m) => m.id !== ctx.me?.id && m.calendar).map((m) => m.calendar));
      cals = [...new Set([ctx.me?.calendar, ...cals.filter((c) => !others.has(c))].filter(Boolean))];
    }
    if (!cals.length || !ctx.on("calendar")) return [];
    const s = startOfDay(new Date());
    return ctx.events(cals, s, addDays(s, 1));
  }

  _prices() {
    const ctx = this.ctx;
    const id = ctx.data.settings.price;
    const st = id && ctx.hass.states[id];
    if (!st || !ctx.on("energy")) return null;
    const a = st.attributes;
    const today = a.raw_today || a.today || a.prices_today || null;
    if (!Array.isArray(today) || !today.length) return null;
    const vals = today.map((x) => (typeof x === "number" ? { h: null, p: x } : { h: new Date(x.hour || x.start || x.time).getHours(), p: Number(x.price ?? x.value) }));
    const byHour = {};
    vals.forEach((v, i) => {
      const h = v.h ?? Math.floor((i * 24) / vals.length);
      (byHour[h] ||= []).push(v.p);
    });
    const out = {};
    for (const [h, list] of Object.entries(byHour)) out[h] = list.reduce((s, x) => s + x, 0) / list.length;
    return out;
  }

  _timeline(big) {
    const ctx = this.ctx;
    const wrap = ctx.$("tl-wrap");
    wrap.hidden = !big;
    if (!big) return;
    const evs = this._todayEvents().filter((e) => !e.allDay);
    const prices = this._prices();
    const key = JSON.stringify([evs.map((e) => [e.title, +e.start]), prices, this._forecast.hourly.length, ctx.lang()]);
    if (key !== this._tlKey) {
      this._tlKey = key;
      let h = '<div class="tl-wx" aria-hidden="true">';
      const hourly = this._forecast.hourly || [];
      for (let x = TL0 + 1; x <= TL1; x++) {
        const f = hourly.find((d) => new Date(d.datetime).getHours() === x % 24 && new Date(d.datetime).getDate() === new Date().getDate() + (x === 24 ? 1 : 0));
        if (!f) continue;
        h += `<div class="${x % 2 ? "odd" : ""}" style="left:${pct(x - 0.5)}%">${svg(WX_ICON[weatherKind(f.condition)])}<span class="num">${Math.round(f.temperature)}°</span>${f.precipitation ? `<i style="height:${Math.min(10, 2 + f.precipitation * 7)}px"></i>` : ""}</div>`;
      }
      h += '</div><div class="tl-axis">';
      const pv = prices ? Object.values(prices) : [];
      const lo = Math.min(...pv), hi = Math.max(...pv);
      for (let x = TL0; x < TL1; x++) {
        const p = prices?.[x];
        h += `<span style="background:${p != null ? priceColor(p, lo, hi) : "rgba(255,255,255,.35)"}"${p != null ? ` title="${ctx.t("kl.")} ${String(x).padStart(2, "0")}: ${ctx.fmt.num(p, 2)}"` : ""}></span>`;
      }
      h += '</div><div class="tl-hours">';
      for (let x = TL0; x <= TL1; x += 3) h += `<span style="left:${pct(x)}%">${String(x).padStart(2, "0")}</span>`;
      h += "</div>";
      if (this._sky.set) h += `<div class="tl-sun" style="left:${pct(this._sky.set)}%"></div>`;
      evs.slice(0, 8).forEach((ev, i) => {
        const hh = ev.start.getHours() + ev.start.getMinutes() / 60;
        if (hh < TL0) return;
        const col = this._calColor(ev.calendar);
        h += `<div class="tl-ev${i % 2 ? " row2" : ""}${hh > 21 ? " end" : ""}" style="left:${pct(hh)}%;animation-delay:${0.25 + i * 0.08}s" title="${esc(ev.title)}"><i style="background:${col}"></i><span class="lbl">${esc(ev.title)} ${ctx.fmt.time(ev.start)}</span></div>`;
      });
      h += '<div class="tl-now" id="tl-now"><b id="tl-now-b"></b></div>';
      ctx.$("tl").innerHTML = h;
      ctx.$("tl-hint").textContent = ctx.t("Træk i tidslinjen for at se dagen gå");
      ctx.$("back-now").innerHTML = `${svg("back")}${esc(ctx.t("Nu"))}`;
      const daily = (this._forecast.daily || []).slice(0, 7);
      if (daily.length) {
        const lo2 = Math.min(...daily.map((d) => d.templow ?? d.temperature)), hi2 = Math.max(...daily.map((d) => d.temperature));
        ctx.$("wk").innerHTML = daily
          .map((d) => {
            const mn = d.templow ?? d.temperature, mx = d.temperature;
            return `<div><b>${esc(cap(ctx.fmt.short(d.datetime)))}</b>${svg(WX_ICON[weatherKind(d.condition)])}<span class="range"><i style="left:${((mn - lo2) / (hi2 - lo2 || 1)) * 100}%;right:${100 - ((mx - lo2) / (hi2 - lo2 || 1)) * 100}%"></i></span><small>${Math.round(mn)}° / ${Math.round(mx)}°${d.precipitation ? ` · ${ctx.fmt.num(d.precipitation, 1)} mm` : ""}</small></div>`;
          })
          .join("");
      }
    }
  }

  _calColor(cal) {
    const ctx = this.ctx;
    const owner = ctx.members().find((m) => m.calendar === cal);
    return owner?.color || "#6E4AFF";
  }

  _now() {
    const ctx = this.ctx;
    const n = ctx.$("tl-now");
    const hour = this._sky.hour;
    if (n) {
      n.style.left = pct(hour) + "%";
      n.style.display = hour < TL0 ? "none" : "";
      ctx.$("tl-now-b").textContent = ctx.fmt.time(new Date(new Date().setHours(Math.floor(hour), Math.round((hour % 1) * 60))));
    }
    const evs = this._todayEvents().filter((e) => !e.allDay);
    const next = evs.find((e) => e.start.getHours() + e.start.getMinutes() / 60 > hour);
    const nx = ctx.$("tl-next");
    if (nx) nx.textContent = next ? `${ctx.t("Næste")}: ${next.title} ${ctx.fmt.time(next.start)}` : ctx.t("Ikke mere i dag");
    const manual = Math.abs(hour - (new Date().getHours() + new Date().getMinutes() / 60)) > 0.05;
    ctx.$("back-now").hidden = !manual;
    ctx.$("tl-hint").hidden = manual || this._wxOpen;
  }

  async _weatherSubscribe() {
    const ctx = this.ctx;
    const id = ctx.data.settings.weather || ctx.entities("weather")[0];
    if (!id || this._wxSub === id) return;
    this._wxSub = id;
    for (const type of ["daily", "hourly"]) {
      try {
        const unsub = await ctx.hass.connection.subscribeMessage(
          (msg) => {
            this._forecast[type] = msg.forecast || [];
            this._tlKey = null;
            this._header();
          },
          { type: "weather/subscribe_forecast", forecast_type: type, entity_id: id }
        );
        this._unsubs.push(unsub);
      } catch (err) {
        /* the weather entity doesn't support this forecast type */
      }
    }
  }

  // ------------------------------------------------------------------ decorations
  _decor() {
    const ctx = this.ctx;
    if (!ctx.data || !ctx.on("decor")) return [];
    const key = new Date().toDateString() + JSON.stringify(ctx.data.settings.decor) + JSON.stringify(ctx.data.settings.decor_days) + (this._preview || "");
    if (this._decorKey !== key) {
      this._decorKey = key;
      this._decorList = activeDecor(new Date(), ctx.data.settings, ctx.data.family, this._preview);
    }
    return this._decorList;
  }

  _decorChip() {
    const ctx = this.ctx;
    const L = this._decor();
    if (!L.length) return "";
    const e = L[0];
    const o = occasions(ctx.data.settings, ctx.data.family).find((x) => x[0] === e.key);
    if (!o) return "";
    let txt;
    const name = ctx.t(o[1]);
    if (e.key === "fodselsdag") {
      const m = ctx.member(e.who);
      const age = m?.birthday ? ageOn(m.birthday, e.a) : "";
      txt =
        e.d0 > 1 ? ctx.t("{name} fylder {age} om {n} dage", { name: m?.name, age, n: e.d0 })
        : e.d0 === 1 ? ctx.t("{name} fylder {age} i morgen", { name: m?.name, age })
        : e.d0 === 0 ? ctx.t("Tillykke med de {age} år, {name}!", { name: m?.name, age })
        : ctx.t("{name} er blevet {age}", { name: m?.name, age });
    } else if (e.key === "bryllup" || e.key === "aarsdag") {
      const yrs = String(e.who).replace(".5", "½");
      const nm = e.key === "bryllup" && ctx.lang() === "da" ? `, ${wedName(e.who)}` : "";
      txt = e.d0 > 1 ? `${name} ${ctx.t("om {n} dage", { n: e.d0 })} · ${yrs} ${ctx.t("år")}${nm}` : e.d0 === 1 ? `${name} ${ctx.t("i morgen")} · ${yrs} ${ctx.t("år")}${nm}` : `${ctx.t(o[6])} · ${yrs} ${ctx.t("år")}`;
    } else txt = e.d0 > 1 ? `${name} ${ctx.t("om {n} dage", { n: e.d0 })}` : e.d0 === 1 ? `${name} ${ctx.t("i morgen")}` : ctx.t(o[6]);
    return `<button class="hl dchip" data-decor="1" style="--dc:${o[3]}"><span class="dem">${o[2]}</span><span>${esc(txt)}</span></button>`;
  }

  _alarmLook() {
    const ctx = this.ctx;
    const id = ctx.data?.settings?.alarm;
    const st = id && ctx.on("security") ? ctx.hass.states[id] : null;
    if (!st) return null;
    const s = st.state;
    if (s === "disarmed" || s === "unavailable" || s === "unknown") return null;
    if (s === "arming" || s === "pending") return { state: s, color: "#F0A93A", speed: 3.2 };
    if (s === "triggered") return { state: s, color: "#E5484D", speed: 6 };
    const col = { armed_home: "#3B6BF5", armed_away: "#E5484D", armed_night: "#7C5CFF", armed_vacation: "#0EA5A0", armed_custom_bypass: "#3B6BF5" }[s] || "#3B6BF5";
    return { state: s, color: col, speed: 1.1 };
  }

  // ------------------------------------------------------------------ waste
  _wasteList() {
    const ctx = this.ctx;
    if (!ctx.on("waste")) return [];
    const out = [];
    const s = startOfDay(new Date());
    const cals = (ctx.data.settings.waste || []).filter((w) => w.entity.startsWith("calendar."));
    const evs = cals.length ? ctx.events(cals.map((w) => w.entity), s, addDays(s, 60)) : [];
    for (const w of ctx.data.settings.waste || []) {
      let date = null;
      if (w.entity.startsWith("calendar.")) {
        const ev = evs.find((e) => e.calendar === w.entity && e.start >= s);
        date = ev?.start || null;
      } else {
        const st = ctx.hass.states[w.entity];
        const v = st?.state;
        if (v && /^\d{4}-\d{2}-\d{2}/.test(v)) date = new Date(v.slice(0, 10) + "T12:00:00");
        else if (v && /^\d+$/.test(v)) date = addDays(s, Number(v));
        else if (st?.attributes?.next_date) date = new Date(st.attributes.next_date);
      }
      if (date) out.push({ ...w, name: w.name || ctx.name(w.entity), date, days: Math.round((startOfDay(date) - s) / 864e5) });
    }
    return out.sort((a, b) => a.date - b.date);
  }

  _bins() {
    const ctx = this.ctx;
    if (!ctx.data || !ctx.on("waste")) return [];
    const list = this._wasteList();
    if (!list.length) return [];
    const first = list[0];
    const same = list.filter((w) => w.days === first.days);
    const label = first.days === 0 ? ctx.t("i dag") : first.days === 1 ? ctx.t("i morgen") : first.days < 7 ? ctx.fmt.day(first.date) : ctx.fmt.date(first.date, { day: "numeric", month: "short" });
    return same.map((w) => ({ body: w.color, lid: w.color, label, soon: first.days <= 1 })).concat(list.filter((w) => w.days !== first.days).slice(0, 3).map((w) => ({ body: w.color, lid: w.color, label, soon: false })));
  }

  _wasteSheet() {
    const ctx = this.ctx;
    const list = this._wasteList();
    ctx.sheet(`<div class="eyebrow">${esc(ctx.t("Tømningsdage"))}</div><h2>${esc(ctx.t("Skrald"))}</h2>
      <div class="bins">${list
        .map((w, i) => `<div class="bin-row" style="animation-delay:${i * 70}ms"><span class="bin-ic" style="background:${w.color}">${svg("trash2")}</span><div><b>${esc(w.name)}</b><small>${esc(cap(ctx.fmt.rel(w.date)))} · ${esc(ctx.fmt.date(w.date))}</small></div><span class="bin-d${w.days <= 1 ? " soon" : ""}">${w.days === 0 ? esc(ctx.t("i dag")) : w.days === 1 ? esc(ctx.t("i morgen")) : esc(ctx.t("om {n} dage", { n: w.days }))}</span></div>`)
        .join("")}</div>
      <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
  }

  // ------------------------------------------------------------------ menus
  _profileMenu() {
    const ctx = this.ctx;
    const me = ctx.me;
    const items = [];
    if (me) items.push(["mig", "gear", ctx.t("Mine indstillinger"), ctx.t("Tema og farver")]);
    if (ctx.isParent && me) items.push([`person:${me.id}`, "user", ctx.t("Min side"), ctx.t("Opgaver og ugen")]);
    if (ctx.isParent) {
      items.push(["indstillinger", "shield", ctx.t("Familieindstillinger"), ctx.t("Familie, moduler, hjemmet og pynt")]);
      if (ctx.on("house")) items.push(["husbygger", "house", ctx.t("Husbygger"), ctx.t("Vægge, rum, døre og enheder")]);
    }
    const real = ctx.member(ctx.data.me);
    const canSwitch = ctx.data.can_manage || !real;
    const others = canSwitch ? ctx.members().filter((m) => m.id !== me?.id && (ctx.data.can_manage || m.role === "child")) : [];
    const s = ctx.sheet(`<div class="pm-h">${me ? ctx.avatar(me.id) : ""}<div><b>${esc(me?.name || ctx.hass.user?.name || "")}</b><small>${esc(ctx.isParent ? ctx.t("Forælder") : me ? ctx.t("Barn") : "")}</small></div></div>
      <div class="pm-list">${items.map(([v, ic, t, sub]) => `<button class="pm-i" data-pm="${esc(v)}">${svg(ic)}<span><b>${esc(t)}</b><small>${esc(sub)}</small></span></button>`).join("")}</div>
      ${others.length ? `<div class="eyebrow" style="margin:14px 0 8px">${esc(ctx.data.can_manage ? ctx.t("Se Hverdagsro som") : ctx.t("Hvem er du?"))}</div><div class="pm-who">${others.map((m) => `<button data-as="${m.id}">${ctx.avatar(m.id, "sm")}<span>${esc(m.name)}</span></button>`).join("")}${ctx.viewAs ? `<button data-as="">${svg("back")}<span>${esc(ctx.t("Tilbage til mig"))}</span></button>` : ""}</div>` : ""}`);
    s.el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pm]");
      if (b) {
        s.close();
        ctx.go(b.dataset.pm);
        return;
      }
      const a = e.target.closest("[data-as]");
      if (a) {
        s.close();
        this.viewAs(a.dataset.as || null);
      }
    });
  }

  viewAs(id) {
    const ctx = this.ctx;
    ctx.viewAs = id;
    try {
      if (id) localStorage.setItem("hverdagsro-as", id);
      else localStorage.removeItem("hverdagsro-as");
    } catch (e) {
      /* private mode */
    }
    ctx.refreshMe();
    this._theme();
    ctx.go(this._homeView());
    if (id) ctx.toast(ctx.t("Du ser nu Hverdagsro som {name}", { name: ctx.member(id)?.name }));
  }

  _moreStat(id) {
    const ctx = this.ctx;
    const st = ctx.data.settings;
    switch (id) {
      case "lister":
        return ctx.t("{n} lister", { n: (st.todo || []).length });
      case "musik": {
        const players = (st.media || []).length ? st.media : ctx.entities("media_player");
        const p = players.map((x) => ctx.hass.states[x]).find((x) => x?.state === "playing");
        return p ? ctx.t("Spiller {what} · {where}", { what: p.attributes.media_title || p.attributes.media_artist || "", where: p.attributes.friendly_name || "" }) : ctx.t("Intet spiller");
      }
      case "apparater": {
        const list = ctx.data.appliances || [];
        const run = list.filter((a) => /^(run|running|on|cleaning|mowing|washing|drying|heating|in_progress|active|program_running|brewing)$/i.test(String(ctx.hass.states[a.entity]?.state || "").replace(/^.*\./, ""))).length;
        const off = list.filter((a) => ["unavailable", "unknown", undefined].includes(ctx.hass.states[a.entity]?.state)).length;
        return list.length ? (run ? ctx.t("{n} kører lige nu", { n: run }) : off ? ctx.t("Alt er stille · {n} offline", { n: off }) : ctx.t("Alt er stille")) : ctx.t("Tilføj jeres apparater");
      }
      case "sikkerhed": {
        const al = st.alarm && ctx.hass.states[st.alarm];
        const open = (ctx.data.house?.items || []).filter((i) => ["door", "window", "port"].includes(i.type) && ["on", "open", "opening"].includes(ctx.hass.states[i.ent]?.state)).length;
        const a = al ? (ctx.hass.formatEntityState ? ctx.hass.formatEntityState(al) : al.state) : ctx.t("Huset");
        return `${a} · ${open ? ctx.t("{n} står åben", { n: open }) : ctx.t("alt lukket")}`;
      }
      case "madplan":
        return ctx.t("Ugens aftensmad");
      case "kalender":
        return ctx.t("Familiens uge");
      case "opgaver": {
        const n = (ctx.data.requests || []).filter((r) => r.status === "pending").length;
        return n ? ctx.t("{n} venter på godkendelse", { n }) : ctx.t("Missioner og belønninger");
      }
      case "shop":
        return ctx.t("{n} point", { n: ctx.points(ctx.me?.id) });
      case "vaerelse":
        return ctx.t("Lys og stemning");
    }
    return "";
  }

  _moreSheet() {
    const ctx = this.ctx;
    const COL = { lister: "#10B981", musik: "#E4568C", apparater: "#F59E0B", sikkerhed: "#2F6FED", madplan: "#F97316", kalender: "#6E4AFF", opgaver: "#0EA5E9", shop: "#F59E0B", vaerelse: "#F5B301", dag: "#6E4AFF" };
    const old = ctx.q(".more-bg");
    if (old) return old.close();
    const bg = document.createElement("div");
    bg.className = "more-bg";
    const links = ctx.isParent
      ? `<div class="more-links" style="animation-delay:${80 + this._more.length * 45}ms">${ctx.on("house") ? `<button data-mt="husbygger">${svg("house")}${esc(ctx.t("Husbygger"))}</button>` : ""}<button data-mt="indstillinger">${svg("shield")}${esc(ctx.t("Familieindstillinger"))}</button><button data-mt="mig">${svg("gear")}${esc(ctx.t("Mine indstillinger"))}</button></div>`
      : "";
    bg.innerHTML = `<div class="more-pop" role="dialog" aria-modal="true" aria-label="${esc(ctx.t("Mere"))}"><span class="more-grab" aria-hidden="true"></span><div class="more-h"><h2>${esc(ctx.t("Mere"))}</h2><button class="iconbtn" data-mclose aria-label="${esc(ctx.t("Luk"))}">${svg("x")}</button></div>
      <div class="more-tiles">${this._more
        .map(([id, name, ic], i) => `<button class="more-t" data-mt="${id}" aria-current="${id === ctx.view}" style="--mc:${COL[id] || "var(--violet)"};animation-delay:${50 + i * 45}ms"><span class="more-ic">${svg(ic)}</span><span class="more-tx"><b>${esc(name)}</b><small>${esc(this._moreStat(id))}</small></span>${svg("go", "ic more-ch")}</button>`)
        .join("")}</div>${links}</div>`;
    const close = () => {
      if (bg.classList.contains("out")) return;
      bg.classList.add("out");
      setTimeout(() => bg.remove(), 230);
    };
    bg.close = close;
    this.shadowRoot.appendChild(bg);
    bg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-mt]");
      if (b) {
        close();
        ctx.go(b.dataset.mt);
        return;
      }
      if (e.target === bg || e.target.closest("[data-mclose]")) close();
    });
    const pop = bg.querySelector(".more-pop");
    let y0 = null, dy = 0;
    pop.addEventListener("pointerdown", (e) => {
      if (!e.target.closest(".more-grab, .more-h h2")) return;
      y0 = e.clientY;
      dy = 0;
      pop.setPointerCapture(e.pointerId);
      pop.style.transition = "none";
    });
    pop.addEventListener("pointermove", (e) => {
      if (y0 == null) return;
      dy = Math.max(0, e.clientY - y0);
      pop.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      if (y0 == null) return;
      y0 = null;
      pop.style.transition = "";
      if (dy > 70) close();
      else pop.style.transform = "";
    };
    pop.addEventListener("pointerup", end);
    pop.addEventListener("pointercancel", end);
  }

  // ------------------------------------------------------------------ the + button
  _quickItems() {
    const ctx = this.ctx;
    if (!ctx.isParent) return [];
    const items = [];
    const al = ctx.data.settings.alarm && ctx.on("security") ? ctx.hass.states[ctx.data.settings.alarm] : null;
    if (al) {
      const look = this._alarmLook();
      items.push({ id: "alarm", label: ctx.t("Alarm"), sub: ctx.hass.formatEntityState ? ctx.hass.formatEntityState(al) : al.state, icon: "shieldf", color: look?.color || "#1E9E62", armed: !!look });
    }
    for (const id of ctx.data.settings.quick || []) {
      const s = ctx.hass.states[id];
      if (!s) continue;
      const d = id.split(".")[0];
      const icon = d === "scene" ? "sparkle" : d === "script" ? "play" : d === "automation" ? "repeat" : "power";
      const color = ["#6E4AFF", "#11A39A", "#F08A3A", "#E4568C", "#2F6FED", "#F2B01E"][items.length % 6];
      items.push({ id, label: s.attributes.friendly_name || id, sub: ctx.t(d === "scene" ? "Scene" : d === "script" ? "Rutine" : d === "automation" ? "Automatisering" : "Knap"), icon, color, running: s.state === "on" && d === "script" });
    }
    return items;
  }

  _fab() {
    const ctx = this.ctx;
    const f = ctx.$("fab");
    if (!f) return;
    const items = this._quickItems();
    const hide = !ctx.isParent || ["guide", "husbygger"].includes(ctx.view);
    const sig = JSON.stringify([items, this._fabOpen, hide, ctx.lang()]);
    if (sig === this._fabSig) return;
    this._fabSig = sig;
    f.hidden = hide;
    if (hide) return;
    const n = items.length + 1;
    const list = [
      ...items.map((q, i) => `<button class="fi" data-fab-run="${esc(q.id)}" style="--qc:${q.color};--d:${(n - 1 - i) * 40}ms"><span class="fl"><b>${esc(q.label)}</b><small>${esc(q.sub)}</small></span><span class="qa-ic${q.armed ? " armed" : ""}">${svg(q.icon)}</span></button>`),
      `<button class="fi edit" data-fab-edit="1" style="--d:0ms"><span class="fl"><b>${esc(ctx.t("Tilpas"))}</b><small>${esc(ctx.t("Vælg genveje"))}</small></span><span class="qa-ic">${svg("edit")}</span></button>`,
    ];
    const armed = items.find((q) => q.armed);
    f.classList.toggle("open", !!this._fabOpen);
    f.innerHTML = `<div class="fab-scrim" data-fab-close></div><div class="fab-list" role="menu">${list.join("")}</div>
      <button class="fab-btn" data-fab aria-expanded="${!!this._fabOpen}" aria-label="${esc(ctx.t("Genveje"))}">${svg("plus")}${armed ? `<span class="fab-dot" style="background:${armed.color}"></span>` : ""}</button>`;
  }

  _bindFab() {
    const ctx = this.ctx;
    ctx.$("fab").addEventListener("click", (e) => {
      const toggle = (open) => {
        this._fabOpen = open;
        this._fabSig = "";
        this._fab();
      };
      if (e.target.closest("[data-fab]")) return toggle(!this._fabOpen);
      if (e.target.closest("[data-fab-close]")) return toggle(false);
      if (e.target.closest("[data-fab-edit]")) {
        toggle(false);
        return ctx.go("indstillinger:hjemmet");
      }
      const run = e.target.closest("[data-fab-run]");
      if (!run) return;
      toggle(false);
      const id = run.dataset.fabRun;
      if (id === "alarm") return ctx.acts.alarm?.(null, null, ctx);
      this._runQuick(id);
    });
  }

  _runQuick(id) {
    const ctx = this.ctx;
    const s = ctx.hass.states[id];
    if (!s) return;
    const d = id.split(".")[0];
    const name = s.attributes.friendly_name || id;
    const sh = ctx.sheet(`<div class="qa-sheet" style="--qc:var(--violet)"><span class="qa-ic big">${svg(d === "scene" ? "sparkle" : "play")}</span><h2>${esc(ctx.t("Kør {name}?", { name }))}</h2><div class="t-sub" style="justify-content:center">${esc(id)}</div>
      <div class="sheet-actions" style="justify-content:center"><button class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn" data-run>${svg("play")}${esc(ctx.t("Kør"))}</button></div></div>`);
    sh.el.querySelector("[data-run]").addEventListener("click", async () => {
      sh.close();
      const svc = d === "script" || d === "scene" ? [d, "turn_on"] : d === "automation" ? [d, "trigger"] : [d, "press"];
      if (await ctx.call(svc[0], svc[1], { entity_id: id })) ctx.toast(ctx.t("{name} kører", { name }));
    });
  }

  // ------------------------------------------------------------------ events in the page
  _bindMain() {
    const ctx = this.ctx;
    const root = this.shadowRoot;
    root.addEventListener("click", (e) => {
      if (e.target.closest(".sheet") && !e.target.closest("[data-act],[data-go]")) return;
      const go = e.target.closest("[data-go]");
      if (go) {
        e.preventDefault();
        root.querySelector(".sheet-bg")?.close?.();
        ctx.go(go.dataset.go);
        return;
      }
      const a = e.target.closest("[data-act]");
      if (!a) return;
      const fn = ctx.acts[a.dataset.act];
      if (fn) {
        e.preventDefault();
        Promise.resolve(fn(a, e, ctx)).catch((err) => ctx.toast(String(err?.message || err)));
      }
    });
    const onInput = (e) => {
      const el = e.target.closest?.("[data-in]");
      if (!el) return;
      const fn = ctx.inputs[el.dataset.in];
      if (fn) fn(el, e, ctx);
    };
    root.addEventListener("input", onInput);
    root.addEventListener("change", onInput);
    root.addEventListener("focusout", () => {
      if (this._dirty) setTimeout(() => this._dirty && this.requestRender(), 50);
    });
  }

  onNavigate() {
    this._tlKey = this._tlKey && null;
  }
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - y0) / 864e5 + 1) / 7);
}

if (!customElements.get("hverdagsro-panel")) customElements.define("hverdagsro-panel", HverdagsroPanel);
