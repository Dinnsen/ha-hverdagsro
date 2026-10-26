/* Hverdagsro – the family panel for Home Assistant. No build step, no dependencies.
   The panel is a web component with a shadow root. Every page is a module (hv-*.js) that renders
   from one shared context; see hv-core.js for the contract. */
import css from "./hv-style.js";
import css2 from "./hv-style2.js";
import { addDays, createCtx, esc, pad2, startOfDay } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import { addTexts, setModule } from "./hv-text.js";
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
import energy, { evTimeline, hasStatus, priceColor, statusHtml } from "./hv-energy.js";
import quick, { alarmLabel, alarmState, bindFab, buildFab } from "./hv-quick.js";
import kids from "./hv-kids.js";

const MODULES = [home, lists, music, appliances, security, house, rooms, settings, energy, quick, kids];

/* The tabs, in order. [view, label, icon, module flag (or null), who] */
const PARENT_TABS = [
  ["hjem", "Hjem", "home", null],
  ["kalender", "Kalender", "cal", "calendar"],
  ["opgaver", "Opgaver", "tasks", "missions"],
  ["madplan", "Madplan", "food", "meals"],
  ["lister", "Lister", "lists", "lists"],
  ["musik", "Musik", "music", "music"],
  ["apparater", "Apparater", "plug", "appliances"],
  ["sikkerhed", "Sikkerhed", "shield", "security"],
];
const WX_ICON = { rain: "rain", snow: "snow", cloudy: "cloudy", partly: "partly", sun: "sun" };
const TL0 = 6, TL1 = 24;
const pct = (h) => ((Math.max(TL0, Math.min(TL1, h)) - TL0) / (TL1 - TL0)) * 100;
const WXNAME = { rain: "Regn", cloudy: "Skyet", sun: "Sol", snow: "Sne", partly: "Delvis skyet" };
const ICON_APP = `<svg viewBox="0 0 512 512" aria-hidden="true"><defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19B6A5"/><stop offset="1" stop-color="#6E4AFF"/></linearGradient></defs><rect width="512" height="512" rx="116" fill="url(#hg)"/><rect x="108" y="132" width="296" height="268" rx="44" fill="#fff"/><path d="M152 132H360a44 44 0 0 1 44 44v34H108v-34a44 44 0 0 1 44-44z" fill="#1B1530"/><rect x="178" y="100" width="26" height="64" rx="13" fill="#fff"/><rect x="308" y="100" width="26" height="64" rx="13" fill="#fff"/><circle cx="172" cy="268" r="20" fill="#6E4AFF"/><circle cx="228" cy="268" r="20" fill="#FF7A59"/><path d="M284 234c2.8 10.7 9.8 17.3 34 34-24.2 16.7-31.2 23.3-34 34-2.8-10.7-9.8-17.3-34-34 24.2-16.7 31.2-23.3 34-34z" fill="#1B1530"/><circle cx="340" cy="268" r="20" fill="#19B6A5"/><circle cx="172" cy="338" r="20" fill="#FFB020"/><circle cx="228" cy="338" r="20" fill="#E7E3F3"/><circle cx="284" cy="338" r="20" fill="#6E4AFF"/><circle cx="340" cy="338" r="20" fill="#E7E3F3"/></svg>`;
const realNow = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
const kr = (v) => Number(v).toFixed(2).replace(".", ",");
const hmOf = (h) => {
  let H = Math.floor(h), M = Math.round((h - H) * 60);
  if (M === 60) {
    H++;
    M = 0;
  }
  return `${pad2(H % 24)}.${pad2(M)}`;
};
/* "Hjemmelavet lasagne med salat" → "Lasagne": the chip in the greeting has room for the dish, not the recipe. */
const shortDish = (title) => {
  let t = String(title || "").split(/ med |, | og /i)[0].trim();
  t = t.replace(/^(hjemmelavet|hjemmelavede|dansk|danske|klassisk|klassiske|hurtig|hurtige|nem|nemme|lækker|lækre)\s+/i, "");
  return cap(t);
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
    this._viewModule = {};
    this._actModule = {};
    this.ctx.modules = MODULES;
    for (const m of MODULES) {
      addTexts(m.en, m.id);
      for (const v of Object.keys(m.views || {})) this._viewModule[v] = m.id;
      for (const a of Object.keys(m.acts || {})) this._actModule[a] = m.id;
      for (const i of Object.keys(m.inputs || {})) this._actModule["in:" + i] = m.id;
      Object.assign(this.ctx.views, m.views || {});
      Object.assign(this.ctx.acts, m.acts || {});
      Object.assign(this.ctx.inputs, m.inputs || {});
    }
    this.ctx.panel = this;
    this.ctx.applyTheme = () => this._theme();
    // Shared with the modules: the coming waste pickups and the weather forecast.
    this.ctx.waste = () => this._wasteList();
    this.ctx.wasteSheet = () => this._wasteSheet();
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
              <button class="brand" id="brand" aria-label="${esc(this.ctx.t("Til forsiden"))}">${ICON_APP}<span class="nm">Hverdagsro</span></button>
              <span class="mini-title" id="mini-title"></span>
              <span class="grow"></span>
              <span class="clock num" id="clock"></span>
              <button class="glass wx-btn" id="wx-btn" hidden aria-expanded="false"></button>
              <button class="glass hbtn" id="alarm-btn" hidden aria-label="Alarm"></button>
              <button class="glass me" id="me" aria-label="${esc(this.ctx.t("Profil og indstillinger"))}" aria-haspopup="menu"></button>
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
      setModule(this._viewModule[ctx.view] || null);
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

  _homeView() {
    const ctx = this.ctx;
    return ctx.isKid ? (ctx.feature(ctx.me, "board") && ctx.views.tavle ? "tavle" : "dag") : "hjem";
  }

  // ------------------------------------------------------------------ tabs and views (the prototype's tabsFor/validView)
  _tabs() {
    const ctx = this.ctx;
    let list;
    if (ctx.isKid) {
      const m = ctx.me;
      list = [
        ...(ctx.feature(m, "board") ? [["tavle", "Rutine", "star"]] : []),
        ["dag", "Min dag", "home"],
        ...(ctx.feature(m, "room") ? [["vaerelse", "Værelse", "bulb"]] : []),
        ...(ctx.feature(m, "shop") ? [["shop", "Shop", "shop"]] : []),
        ...(ctx.feature(m, "skema") ? [["skema", "Skema", "school"]] : []),
        ...(ctx.feature(m, "wish") ? [["onsker", "Ønsker", "gift"]] : []),
      ];
    } else {
      list = PARENT_TABS.filter(([v]) => (v !== "madplan" || ctx.on("meals")) && (v !== "musik" || ctx.on("music")) && (v !== "apparater" || ctx.on("appliances")) && (v !== "sikkerhed" || ctx.on("security")) && (v !== "lister" || ctx.on("lists")) && (v !== "kalender" || ctx.on("calendar")));
    }
    return list.filter(([v]) => ctx.views[v]).map(([v, label, icon]) => [v, ctx.t(label), icon]);
  }

  _validView() {
    const ctx = this.ctx;
    if (!ctx.data.setup_done) return ctx.isParent ? "guide" : "ikke-klar";
    if (!ctx.me && !ctx.isParent) return "hvem";
    const v = ctx.view;
    if (!ctx.views[v]) return this._homeView();
    if (v === "person") return ctx.isKid ? "dag" : v;
    if (["indstillinger", "rutiner", "husbygger", "guide"].includes(v)) return ctx.isKid || !ctx.isParent ? this._homeView() : v;
    if (v === "mig" || v === "rum") return v;
    if (!this._tabs().some((t) => t[0] === v)) return this._homeView();
    return v;
  }

  /* Today's missions for a member, and how many are not done (the prototype's open TASKS). */
  _openFor(m) {
    const ctx = this.ctx;
    if (!m || !ctx.on("missions") || (m.role === "child" && !ctx.feature(m, "missions"))) return 0;
    const wd = (new Date(`${ctx.data.today}T12:00:00`).getDay() + 6) % 7;
    const done = ctx.data.done_today || {};
    return (ctx.data.missions || []).filter((x) => (x.member === m.id || (x.member === "all" && m.role === "child")) && (x.days || []).includes(wd) && !(`${x.id}:${m.id}` in done)).length;
  }

  _buildTabs() {
    const ctx = this.ctx;
    const tabs = ctx.$("tabs");
    const hidden = ["guide", "ikke-klar", "hvem"].includes(ctx.view);
    tabs.parentElement.hidden = hidden;
    if (hidden) return;
    const open = ctx.isKid ? this._openFor(ctx.me) : ctx.members().reduce((n, m) => n + this._openFor(m), 0);
    const pending = (ctx.data.requests || []).filter((r) => r.status === "pending").length;
    const cur = ctx.view === "person" ? "" : ctx.view;
    let T = this._tabs(), more = [];
    if (innerWidth < 860 && T.length > 5) {
      more = T.slice(4);
      T = T.slice(0, 4);
    }
    this._more = more;
    tabs.innerHTML =
      T.map(([id, name, ic]) => {
        const n = id === "opgaver" ? open + pending : id === "dag" ? open : 0;
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
    this._rebuildFab = bindFab(ctx, ctx.$("fab"), () => this._sky.hour);
    addEventListener("resize", () => {
      const n = innerWidth < 860;
      if (n !== this._lastNarrow) {
        this._lastNarrow = n;
        if (ctx.data) this._buildTabs();
      }
    });
  }

  refreshStatus() {
    this._statusHtml = null;
    this._tlKey = null;
    this._header();
  }

  _miniTitle() {
    const ctx = this.ctx;
    const titles = { husbygger: "Husbygger", musik: "Musik", apparater: "Apparater", sikkerhed: "Sikkerhed", vaerelse: "Mit værelse", mig: "Mine indstillinger", rutiner: "Faste rutiner", tavle: "Rutine", indstillinger: "Familieindstillinger", kalender: "Kalender", opgaver: "Opgaver", madplan: "Madplan", lister: "Lister", shop: "Shop", skema: "Skema", onsker: "Ønsker", guide: "Kom i gang" };
    if (ctx.view === "person") return ctx.member(ctx.arg)?.name || "";
    if (ctx.view === "rum") return (ctx.data.house?.rooms || []).find((r) => r.id === ctx.arg)?.name || ctx.t("Rum");
    return titles[ctx.view] ? ctx.t(titles[ctx.view]) : ctx.views[ctx.view]?.title?.(ctx) || "";
  }

  _header() {
    const ctx = this.ctx;
    if (!ctx.data || !ctx.hass) return;
    const hero = ctx.$("hero");
    const home = ctx.view === this._homeView();
    const big = home && ctx.data.setup_done;
    hero.classList.toggle("compact", !big);
    hero.classList.toggle("open", big && this._wxOpen);
    ctx.$("mini-title").textContent = this._miniTitle();
    // Electricity and cars under the sky, on the parents' home page.
    const sec = ctx.$("status-sec");
    const showStatus = !ctx.isKid && ctx.view === "hjem" && hasStatus(ctx);
    sec.hidden = !showStatus;
    if (showStatus) {
      const html = statusHtml(ctx);
      if (html !== this._statusHtml) ctx.$("status").innerHTML = this._statusHtml = html;
    }
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
      const hourly = (this._forecast.hourly || []).find((f) => Math.abs(new Date(f.datetime) - new Date(new Date().setHours(Math.floor(this._sky.hour), 0, 0, 0))) < 1800e3);
      const t = this._sky.hour !== undefined && hourly && Math.abs(this._sky.hour - realNow()) > 0.05 ? hourly.temperature : wx.attributes.temperature;
      const c = hourly && Math.abs(this._sky.hour - realNow()) > 0.05 ? weatherKind(hourly.condition) : kind;
      wxBtn.hidden = false;
      wxBtn.innerHTML = `${svg(WX_ICON[c])}<span class="num">${t != null ? Math.round(t) + "°" : ""}</span>${svg("chev", "ic chev")}`;
      wxBtn.title = ctx.t("{wx} · tryk for vejrudsigten", { wx: ctx.t(WXNAME[c]) });
      wxBtn.setAttribute("aria-expanded", String(big && this._wxOpen));
    } else wxBtn.hidden = true;
    // Alarm
    const al = alarmState(ctx);
    const ab = ctx.$("alarm-btn");
    ab.hidden = !al;
    if (al) {
      const [label, color] = alarmLabel(ctx, al);
      ab.innerHTML = `<span class="ashield${al.state !== "disarmed" ? " armed" : ""}" style="--ac:${color}">${svg("shieldf")}</span>`;
      ab.title = `${ctx.t("Alarm")}: ${label}`;
    }
    // Me
    const me = ctx.me;
    ctx.$("me").innerHTML = me
      ? `${ctx.avatar(me.id)}<span class="nm">${esc(me.name)}</span>`
      : `<span class="av" style="background:#6E4AFF">${esc((ctx.hass.user?.name || "?").charAt(0))}</span><span class="nm">${esc(ctx.hass.user?.name || "")}</span>`;
    ctx.$("clock").textContent = hmOf(realNow());
    this._greet(big);
    this._timeline(big);
    this._now();
  }

  /* Tonight's dinner (before 18.30) or tomorrow's, for the chip in the greeting. */
  _dinnerChip() {
    const ctx = this.ctx;
    const id = ctx.data.settings.meals_calendar;
    if (!id || !ctx.on("meals")) return "";
    const s = startOfDay(new Date());
    const evs = ctx.events([id], s, addDays(s, 2));
    const late = this._sky.hour >= 18.5;
    const day = late ? addDays(s, 1) : s;
    const ev = evs.find((e) => startOfDay(e.start).getTime() === day.getTime());
    if (!ev) return "";
    const short = shortDish(ev.title);
    const txt = late ? ctx.t("{dish} i morgen", { dish: short }) : ev.allDay ? ctx.t("{dish} i aften", { dish: short }) : ctx.t("{dish} kl. {t}", { dish: short, t: ctx.fmt.time(ev.start) });
    return `<span class="hl">${svg("food")}${esc(txt)}</span>`;
  }

  /* Days this week where all of the child's missions were done. */
  _perfectDays(m) {
    const ctx = this.ctx;
    let n = 0;
    for (const [iso, done] of Object.entries(ctx.data.done_week || {})) {
      if (iso >= ctx.data.today) continue;
      const wd = (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;
      const list = (ctx.data.missions || []).filter((x) => (x.member === m.id || x.member === "all") && (x.days || []).includes(wd));
      if (list.length && list.every((x) => `${x.id}:${m.id}` in done)) n++;
    }
    return n;
  }

  _greet(big) {
    const ctx = this.ctx;
    const g = ctx.$("greet");
    if (!big) {
      g.innerHTML = this._greetHtml = "";
      return;
    }
    const now = new Date();
    const me = ctx.me;
    let html;
    if (ctx.isKid && me) {
      const wd = (now.getDay() + 6) % 7;
      const tasks = (ctx.data.missions || []).filter((x) => (x.member === me.id || x.member === "all") && (x.days || []).includes(wd));
      const done = tasks.filter((x) => `${x.id}:${me.id}` in (ctx.data.done_today || {})).length;
      html = `<div class="date">${esc(cap(`${ctx.fmt.day(now)} ${ctx.fmt.date(now)}`))}</div><h1>${esc(ctx.t("Hej {name}", { name: me.name }))}</h1>
        <div class="kidbar">${this._decorChip()}${ctx.feature(me, "points") ? `<span class="glass">${svg("pstar")}<span class="num">${ctx.points(me.id)}</span> ${esc(ctx.t("point"))}</span>` : ""}${ctx.feature(me, "missions") ? `<span class="glass">${svg("flame")}${esc(ctx.t("{n} perfekte dage", { n: this._perfectDays(me) }))}</span><span class="glass">${done}/${tasks.length} ${esc(ctx.t("missioner"))}</span>` : ""}${ctx.feature(me, "read") ? `<button class="glass" data-act="read">${svg("speaker")}${esc(ctx.t("Læs op"))}</button>` : ""}</div>`;
    } else {
      const h = this._sky.hour;
      const hello = h < 5 ? "God nat" : h < 10 ? "God morgen" : h < 12 ? "God formiddag" : h < 17.5 ? "God eftermiddag" : h < 22.5 ? "God aften" : "God nat";
      const date = `${ctx.fmt.day(now)} ${ctx.fmt.date(now)} · ${ctx.t("uge")} ${isoWeek(now)}`;
      html = `<div class="date">${esc(cap(date))}</div><h1>${esc(ctx.t(hello))}${me ? `, ${esc(me.name)}` : ""}</h1><div class="line">${this._decorChip()}${this._dinnerChip()}</div>`;
    }
    if (html === this._greetHtml) return;
    g.innerHTML = this._greetHtml = html;
    g.querySelector("[data-decor]")?.addEventListener("click", () => ctx.go("indstillinger:pynt"));
  }

  _todayEvents() {
    const ctx = this.ctx;
    let cals = [...(ctx.data.settings.calendars || []), ...ctx.members().map((m) => m.calendar).filter(Boolean)];
    if (ctx.isKid) {
      // A child sees the shared calendars and their own, not the other members' calendars.
      const others = new Set(ctx.members().filter((m) => m.id !== ctx.me?.id && m.calendar).map((m) => m.calendar));
      cals = [ctx.me?.calendar, ...cals.filter((c) => !others.has(c))];
    }
    cals = [...new Set(cals.filter(Boolean))];
    if (!cals.length || !ctx.on("calendar")) return [];
    const s = startOfDay(new Date());
    return ctx.events(cals, s, addDays(s, 1));
  }

  /* Today's prices per hour (from midnight), for the timeline's colour bar. */
  _prices() {
    const ctx = this.ctx;
    const id = ctx.data.settings.price;
    const st = id && ctx.hass.states[id];
    if (!st || !ctx.on("energy")) return null;
    const a = st.attributes;
    const today = a.raw_today || a.today || a.prices_today || null;
    if (!Array.isArray(today) || !today.length) return null;
    const byHour = {};
    today.forEach((x, i) => {
      const h = typeof x === "number" ? Math.floor((i * 24) / today.length) : new Date(x.hour || x.start || x.time || x.startsAt).getHours();
      const p = typeof x === "number" ? x : Number(x.price ?? x.value ?? x.total);
      if (!Number.isNaN(p)) (byHour[h] ||= []).push(p);
    });
    const out = {};
    for (const [h, list] of Object.entries(byHour)) out[h] = list.reduce((s, v) => s + v, 0) / list.length;
    return out;
  }

  /* The timeline's bubbles: calendar events, dinner, pick-ups and EV Planner's charging. */
  _tlEvents() {
    const ctx = this.ctx;
    const out = [];
    const fromDate = (d) => d.getHours() + d.getMinutes() / 60;
    for (const ev of this._todayEvents()) {
      if (ev.allDay || startOfDay(ev.start).getTime() !== startOfDay(new Date()).getTime()) continue;
      out.push({ s: fromDate(ev.start), t: `${ev.title} ${ctx.fmt.time(ev.start)}`, c: this._calColor(ev.calendar) });
    }
    const mealsId = ctx.data.settings.meals_calendar;
    if (mealsId && ctx.on("meals")) {
      const s = startOfDay(new Date());
      const dinner = ctx.events([mealsId], s, addDays(s, 1)).find((e) => !e.allDay);
      if (dinner) out.push({ s: fromDate(dinner.start), t: ctx.t("Aftensmad {t}", { t: ctx.fmt.time(dinner.start) }), c: "#6E4AFF" });
    }
    // Hent og bring today.
    const wd = String(new Date().getDay() || 7);
    for (const [kidId, plan] of Object.entries(ctx.data.routines?.pickups || {})) {
      const kid = ctx.member(kidId);
      if (!kid || kid.institution === "none") continue;
      const step = plan?.[wd]?.hent;
      if (!step?.who || !step?.at) continue;
      if (ctx.isKid && ctx.me?.id !== kidId) continue;
      const who = ctx.member(step.who) || (ctx.data.routines.helpers || []).find((h) => h.id === step.who);
      if (!who) continue;
      const [hh, mm] = String(step.at).split(/[:.]/).map(Number);
      const t = ctx.isKid ? ctx.t("{who} henter dig {t}", { who: who.name, t: `${pad2(hh)}.${pad2(mm || 0)}` }) : ctx.t("{who} henter {kid}", { who: who.name, kid: kid.name });
      out.push({ s: hh + (mm || 0) / 60, t, c: who.color || "#EC4899" });
    }
    out.push(...evTimeline(ctx));
    const list = out.filter((e) => e.s >= TL0 && !(ctx.isKid && e.adult)).sort((a, b) => a.s - b.s);
    // Two rows of bubbles, so neighbours don't cover each other: each bubble's width in hours from its text.
    const w = Math.max(320, this.ctx.$("tl")?.clientWidth || 1200);
    const ends = [-99, -99];
    for (const e of list) {
      const span = ((e.t.length * 6.6 + 34) / w) * (TL1 - TL0);
      const a = e.s > 21 ? e.s - span : e.s, b = e.s > 21 ? e.s : e.s + span;
      const row = a >= ends[0] ? 0 : a >= ends[1] ? 1 : ends[0] <= ends[1] ? 0 : 1;
      e.row2 = row === 1;
      ends[row] = b + 0.1;
    }
    return list;
  }

  _timeline(big) {
    const ctx = this.ctx;
    const wrap = ctx.$("tl-wrap");
    wrap.hidden = !big;
    if (!big) return;
    const evs = this._tlEvents();
    const prices = this._prices();
    const nowH = Math.floor(realNow());
    const key = JSON.stringify([evs, prices, this._forecast.hourly.length, this._forecast.daily.length, ctx.lang(), nowH, this._sky.set]);
    if (key === this._tlKey) return;
    this._tlKey = key;
    let h = '<div class="tl-wx" aria-hidden="true">';
    const hourly = this._forecast.hourly || [];
    const t0 = startOfDay(new Date());
    for (let x = TL0 + 1; x <= TL1; x++) {
      const at = +t0 + x * 3600e3;
      const f = hourly.find((d) => Math.abs(new Date(d.datetime) - at) < 1800e3);
      if (!f) continue;
      const mm = f.precipitation || 0;
      h += `<div class="${x <= nowH ? "past" : ""}${x % 2 ? " odd" : ""}" style="left:${pct(x - 0.5)}%">${svg(WX_ICON[weatherKind(f.condition)])}<span class="num">${Math.round(f.temperature)}°</span>${mm ? `<i style="height:${Math.min(10, 2 + mm * 7)}px"></i>` : ""}</div>`;
    }
    h += '</div><div class="tl-axis">';
    for (let x = TL0; x < TL1; x++) {
      const p = prices?.[x];
      h += `<span style="background:${p != null ? priceColor(p) : "rgba(255,255,255,.35)"}"${p != null ? ` title="${esc(ctx.t("kl."))} ${pad2(x)}: ${kr(p)} kr/kWh"` : ""}></span>`;
    }
    h += '</div><div class="tl-hours">';
    for (let x = TL0; x <= TL1; x += 3) h += `<span style="left:${pct(x)}%">${pad2(x)}</span>`;
    h += "</div>";
    if (this._sky.set) h += `<div class="tl-sun" style="left:${pct(this._sky.set)}%" title="${esc(ctx.t("Solnedgang {t}", { t: hmOf(this._sky.set, ctx) }))}"></div>`;
    evs.forEach((ev, i) => {
      h += `<div class="tl-ev${ev.row2 ? " row2" : ""}${ev.s > 21 ? " end" : ""}" style="left:${pct(ev.s)}%;animation-delay:${0.25 + i * 0.08}s" title="${esc(ev.t)}"><i style="background:${ev.c}"></i><span class="lbl">${esc(ev.t)}</span></div>`;
    });
    h += '<div class="tl-now" id="tl-now"><b id="tl-now-b"></b></div>';
    ctx.$("tl").innerHTML = h;
    ctx.$("tl-hint").textContent = ctx.t("Træk i tidslinjen for at se dagen gå");
    ctx.$("back-now").textContent = ctx.t("Tilbage til nu");
    const daily = (this._forecast.daily || []).slice(0, 6);
    if (daily.length) {
      const lo = Math.min(...daily.map((d) => d.templow ?? d.temperature)), hi = Math.max(...daily.map((d) => d.temperature));
      ctx.$("wk").innerHTML = daily
        .map((d, i) => {
          const mn = d.templow ?? d.temperature, mx = d.temperature, mm = d.precipitation;
          const name = i === 0 && startOfDay(new Date(d.datetime)).getTime() === t0.getTime() ? ctx.t("I dag") : cap(ctx.fmt.short(d.datetime));
          return `<div><b>${esc(name)}</b>${svg(WX_ICON[weatherKind(d.condition)])}<span class="range"><i style="left:${((mn - lo) / (hi - lo || 1)) * 100}%;right:${100 - ((mx - lo) / (hi - lo || 1)) * 100}%"></i></span><small>${Math.round(mn)}° / ${Math.round(mx)}°${mm ? ` · ${ctx.fmt.num(mm, 1)} mm` : ""}</small></div>`;
        })
        .join("");
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
      ctx.$("tl-now-b").textContent = hmOf(hour, ctx);
      ctx.$("tl").setAttribute("aria-valuenow", hour.toFixed(2));
      ctx.$("tl").setAttribute("aria-valuetext", `${ctx.t("kl.")} ${hmOf(hour, ctx)}`);
    }
    const next = ctx.$("tl-wrap").hidden ? null : this._tlEvents().find((e) => e.s > hour);
    const nx = ctx.$("tl-next");
    if (nx) nx.textContent = next ? `${ctx.t("Næste")}: ${next.t}` : ctx.t("Ikke mere i dag");
    const manual = Math.abs(hour - realNow()) > 0.05;
    ctx.$("back-now").hidden = !manual;
    ctx.$("tl-hint").hidden = manual || this._wxOpen;
    buildFab(ctx, ctx.$("fab"), hour);
    if (manual || this._wasManual) this._greet(!ctx.$("tl-wrap").hidden);
    this._wasManual = manual;
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
    ctx.qa(".pm-bg").forEach((x) => x.remove());
    const me = ctx.me;
    const real = ctx.member(ctx.data.me);
    const others = this._whoList().filter((m) => m.id !== me?.id);
    const sub = me ? (me.role === "parent" ? `${me.title || ctx.t("Forælder")} · ${ctx.t("forælder")}${ctx.data.is_admin && real?.id === me.id ? ` · ${ctx.t("administrator")}` : ""}` : ctx.t("Barn")) : ctx.data.is_admin ? ctx.t("Administrator") : "";
    const bg = document.createElement("div");
    bg.className = "pm-bg";
    bg.innerHTML = `<div class="pm" role="menu" aria-label="${esc(ctx.t("Profil"))}">
      <div class="pm-head">${me ? ctx.avatar(me.id) : `<span class="av" style="background:#6E4AFF">${esc((ctx.hass.user?.name || "?").charAt(0))}</span>`}<div><b>${esc(me?.name || ctx.hass.user?.name || "")}</b><small>${esc(sub)}</small></div></div>
      ${me ? `<button class="pm-i" data-pm="mig">${svg("gear")}<span><b>${esc(ctx.t("Mine indstillinger"))}</b><small>${esc(me.role === "child" ? ctx.t("Min +-menu, beskeder og PIN") : ctx.t("Min +-menu, beskeder"))}</small></span></button>` : ""}
      ${ctx.isParent ? `${me ? `<button class="pm-i" data-pm="person:${esc(me.id)}">${svg("user")}<span><b>${esc(ctx.t("Min side"))}</b><small>${esc(ctx.t("Opgaver og ugen"))}</small></span></button>` : ""}
      ${ctx.views.rutiner ? `<button class="pm-i" data-pm="rutiner">${svg("repeat")}<span><b>${esc(ctx.t("Faste rutiner"))}</b><small>${esc(ctx.t("Opgaver, hent og bring, rutinetavler"))}</small></span></button>` : ""}
      ${ctx.on("house") && ctx.views.husbygger ? `<button class="pm-i" data-pm="husbygger">${svg("house")}<span><b>${esc(ctx.t("Husbygger"))}</b><small>${esc(ctx.t("Vægge, rum, døre, vinduer og enheder"))}</small></span></button>` : ""}
      <button class="pm-i fam" data-pm="indstillinger">${svg("shield")}<span><b>${esc(ctx.t("Familieindstillinger"))}</b><small>${esc(ctx.t("Funktioner, quick actions og alarm"))}</small></span></button>` : ""}
      ${others.length ? `<button class="pm-i" data-pm="who">${svg("users")}<span><b>${esc(ctx.t("Skift bruger"))}</b><small>${esc(others.map((x) => x.name).join(", "))}</small></span></button>` : ""}</div>`;
    ctx.root.appendChild(bg);
    const key = (e) => e.key === "Escape" && close();
    const close = () => {
      bg.classList.add("out");
      setTimeout(() => bg.remove(), 180);
      ctx.root.removeEventListener("keydown", key);
    };
    ctx.root.addEventListener("keydown", key);
    bg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pm]");
      if (b) {
        close();
        if (b.dataset.pm === "who") this._whoSheet();
        else ctx.go(b.dataset.pm);
      } else if (!e.target.closest(".pm")) close();
    });
    bg.querySelector(".pm-i")?.focus({ preventScroll: true });
  }

  /* Who this Home Assistant user may switch to: parents and administrators everyone, a shared tablet the
     children, a child only itself. */
  _whoList() {
    const ctx = this.ctx;
    const real = ctx.member(ctx.data.me);
    if (ctx.data.can_manage) return ctx.members();
    if (!real) return ctx.children();
    return [real];
  }

  _whoSheet() {
    const ctx = this.ctx;
    const s = ctx.sheet(`<h2>${esc(ctx.t("Hvem bruger Hverdagsro?"))}</h2><div class="t-sub">${esc(ctx.t("Forældre ser alt. Børn ser deres egen dag og bruger deres PIN."))}</div>
      <div class="who-list">${this._whoList()
        .map((m) => `<button data-who="${esc(m.id)}" aria-current="${m.id === ctx.me?.id}">${ctx.avatar(m.id)}<span>${esc(m.name)}<small>${esc(m.role === "parent" ? `${m.title || ctx.t("Forælder")} · ${ctx.t("forælder")}` : m.has_pin ? ctx.t("Barn · PIN") : ctx.t("Barn"))}</small></span></button>`)
        .join("")}</div>
      <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
    s.el.querySelector(".who-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-who]");
      if (!b) return;
      const id = b.dataset.who;
      s.close();
      if (id === ctx.me?.id) return;
      const target = ctx.member(id);
      if (target?.has_pin && (target.role === "child" || ctx.isKid)) this._pinSheet(id);
      else this._switchTo(id);
    });
  }

  _pinSheet(id) {
    const ctx = this.ctx;
    const m = ctx.member(id);
    let code = "";
    const s = ctx.sheet(`<div style="text-align:center">${ctx.avatar(id, "pin-av")}<h2 style="margin-top:10px">${esc(ctx.t("Hej {name}", { name: m.name }))}</h2><div class="t-sub" style="justify-content:center">${esc(ctx.t("Skriv din PIN."))}</div></div>
      <div class="pin-dots" id="pd">${"<i></i>".repeat(4)}</div><div class="pinpad" id="pp">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((n) => (n === "" ? "<span></span>" : `<button data-n="${n}" aria-label="${n === "⌫" ? esc(ctx.t("Slet")) : n}">${n}</button>`)).join("")}</div>
      <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Annuller"))}</button></div>`);
    const dots = s.el.querySelector("#pd");
    let wrongTimer = 0, busy = false;
    const paint = () => {
      // Four dots like the prototype; a 5- or 6-digit PIN grows the row as it is typed.
      while (dots.children.length < Math.max(4, code.length)) dots.appendChild(document.createElement("i"));
      while (dots.children.length > Math.max(4, code.length)) dots.lastChild.remove();
      dots.querySelectorAll("i").forEach((d, i) => d.classList.toggle("on", i < code.length));
    };
    const wrong = () => {
      dots.classList.remove("shake");
      void dots.offsetWidth;
      dots.classList.add("shake");
      code = "";
      setTimeout(paint, 300);
    };
    s.el.querySelector("#pp").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-n]");
      if (!b || busy) return;
      clearTimeout(wrongTimer);
      const n = b.dataset.n;
      code = n === "⌫" ? code.slice(0, -1) : (code + n).slice(0, 6);
      paint();
      if (code.length < 4 || n === "⌫") return;
      busy = true;
      let ok = false;
      try {
        ok = !!(await ctx.ws("pin", { member: id, pin: code }))?.ok;
      } catch (err) {
        ok = false;
      }
      busy = false;
      if (ok) {
        s.close();
        this._switchTo(id);
      } else if (code.length >= 6) wrong();
      else wrongTimer = setTimeout(wrong, 1200);
    });
  }

  _switchTo(id) {
    const ctx = this.ctx;
    this.viewAs(id === ctx.data.me ? null : id, true);
    ctx.toast(ctx.t("Du er nu {name}", { name: ctx.member(id)?.name || "" }));
  }

  viewAs(id, quiet = false) {
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
    this._wxOpen = false;
    ctx.go(this._homeView());
    if (id && !quiet) ctx.toast(ctx.t("Du ser nu Hverdagsro som {name}", { name: ctx.member(id)?.name }));
  }

  /* The Mere menu's line under each page (the prototype's moreStat). */
  _moreStat(id) {
    const ctx = this.ctx;
    const st = ctx.data.settings;
    switch (id) {
      case "musik": {
        const players = (st.media || []).length ? st.media : ctx.entities("media_player");
        const states = players.map((x) => ctx.hass.states[x]).filter(Boolean);
        const p = states.find((x) => x.state === "playing");
        if (p) return ctx.t("Spiller {what} · {where}", { what: p.attributes.media_title || p.attributes.media_artist || "", where: p.attributes.friendly_name || "" });
        return states.some((x) => x.state === "paused") ? ctx.t("På pause") : ctx.t("Intet spiller");
      }
      case "apparater": {
        const list = ctx.data.appliances || [];
        const run = list.filter((a) => /^(run|running|cleaning|mowing|washing|drying|rinsing|spinning|heating|cooking|baking|brewing|preheating|in_progress|inprogress|active|program_running|working|operating)$/i.test(String(ctx.hass.states[a.entity]?.state || "").replace(/^.*\./, ""))).length;
        const off = list.filter((a) => ["unavailable", "unknown", undefined].includes(ctx.hass.states[a.entity]?.state)).length;
        return run ? ctx.t("{n} kører lige nu", { n: run }) : off ? ctx.t("Alt er stille · {n} offline", { n: off }) : ctx.t("Alt er stille");
      }
      case "sikkerhed": {
        const al = alarmState(ctx);
        const open = (ctx.data.house?.items || []).filter((i) => ["door", "window", "port"].includes(i.type) && ["on", "open", "opening"].includes(ctx.hass.states[i.ent]?.state)).length;
        const a = al ? alarmLabel(ctx, al)[0] : ctx.t("Huset");
        return `${a} · ${open ? ctx.t("{n} står åben", { n: open }) : ctx.t("alt lukket")}`;
      }
      case "lister":
        return ctx.t("{n} lister", { n: (st.todo || []).length });
      case "madplan": {
        const chip = this._dinnerChip().replace(/<[^>]+>/g, "");
        return chip || ctx.t("Ugens aftensmad");
      }
      case "kalender":
        return ctx.t("Familiens uge");
      case "opgaver":
        return ctx.t("{n} åbne opgaver", { n: ctx.members().reduce((n, m) => n + this._openFor(m), 0) });
      case "onsker":
        return ctx.t("Min ønskeseddel");
      case "skema":
        return ctx.t("Ugens skema");
      case "shop":
        return ctx.t("{n} point", { n: ctx.points(ctx.me?.id) });
    }
    return "";
  }

  _moreSheet() {
    const ctx = this.ctx;
    const COL = { lister: "#10B981", musik: "#E4568C", apparater: "#F59E0B", sikkerhed: "#2F6FED", madplan: "#F97316", kalender: "#6E4AFF", opgaver: "#0EA5E9", shop: "#F59E0B", skema: "#0EA5E9", onsker: "#2F80ED", vaerelse: "#F5B301", tavle: "#8B5CF6", dag: "#6E4AFF" };
    const old = ctx.q(".more-bg");
    if (old) return old.close();
    const bg = document.createElement("div");
    bg.className = "more-bg";
    const links = ctx.isKid
      ? ""
      : `<div class="more-links" style="animation-delay:${80 + this._more.length * 45}ms">${ctx.on("house") && ctx.views.husbygger ? `<button data-mt="husbygger">${svg("house")}${esc(ctx.t("Husbygger"))}</button>` : ""}${ctx.isParent ? `<button data-mt="indstillinger">${svg("shield")}${esc(ctx.t("Familieindstillinger"))}</button>` : ""}<button data-mt="mig">${svg("gear")}${esc(ctx.t("Mine indstillinger"))}</button></div>`;
    bg.innerHTML = `<div class="more-pop" role="dialog" aria-modal="true" aria-label="${esc(ctx.t("Mere"))}"><span class="more-grab" aria-hidden="true"></span><div class="more-h"><h2>${esc(ctx.t("Mere"))}</h2><button class="iconbtn" data-mclose aria-label="${esc(ctx.t("Luk"))}">${svg("x")}</button></div>
      <div class="more-tiles">${this._more
        .map(([id, name, ic], i) => `<button class="more-t" data-mt="${id}" aria-current="${id === ctx.view}" style="--mc:${COL[id] || "var(--violet)"};animation-delay:${50 + i * 45}ms"><span class="more-ic">${svg(ic)}</span><span class="more-tx"><b>${esc(name)}</b><small>${esc(this._moreStat(id))}</small></span>${svg("go", "ic more-ch")}</button>`)
        .join("")}</div>${links}</div>`;
    const mb = ctx.q("[data-more]");
    const key = (e) => e.key === "Escape" && close();
    const close = () => {
      if (bg.classList.contains("out")) return;
      bg.classList.add("out");
      ctx.root.removeEventListener("keydown", key);
      setTimeout(() => bg.remove(), 230);
      mb?.setAttribute("aria-expanded", "false");
    };
    bg.close = close;
    ctx.root.addEventListener("keydown", key);
    ctx.root.appendChild(bg);
    mb?.setAttribute("aria-expanded", "true");
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
      setModule(this._actModule[a.dataset.act] || this._viewModule[ctx.view] || null);
      if (fn) {
        e.preventDefault();
        Promise.resolve(fn(a, e, ctx)).catch((err) => ctx.toast(String(err?.message || err)));
      }
    });
    const onInput = (e) => {
      const el = e.target.closest?.("[data-in]");
      if (!el) return;
      const fn = ctx.inputs[el.dataset.in];
      setModule(this._actModule["in:" + el.dataset.in] || this._viewModule[ctx.view] || null);
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
