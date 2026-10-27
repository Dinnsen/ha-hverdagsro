/* Hverdagsro – the panel's core: one shared context (ctx) that every module renders from.

   Contract for modules (hv-*.js):
     export default {
       id: "music",
       views: { musik: { render(ctx) => html, title(ctx) => string, after?(ctx), hero?: "compact" } },
       acts:   { name(el, ev, ctx) {} },     // <button data-act="name" data-id="…">
       inputs: { name(el, ev, ctx) {} },     // <input data-in="name">, fired on input and change
       init?(ctx) {}                         // once, when the panel starts
     }

   ctx gives the module:
     ctx.hass, ctx.data (Hverdagsro's stored state), ctx.view, ctx.arg (text after ":" in the view)
     ctx.t(text, vars)       Danish source text, translated when Home Assistant runs in English
     ctx.esc(text), ctx.svg(icon, cls)
     ctx.st(entity_id)       the state object (and the view re-renders when it changes)
     ctx.val(id), ctx.attr(id, key), ctx.name(id), ctx.entities(domain), ctx.area(id)
     ctx.call(domain, service, data)          Home Assistant action
     ctx.ws(type, payload)                    hverdagsro/<type> websocket command
     ctx.save(section, value)                 save a section (parents only)
     ctx.go(view), ctx.render(), ctx.toast(text), ctx.sheet(html, opts) → { el, close }
     ctx.me, ctx.member(id), ctx.children(), ctx.parents(), ctx.isParent, ctx.isKid, ctx.on(module)
     ctx.load(key, fn, ttlMs) async data with cache; re-renders when it arrives (calendar events, todo items …)
     ctx.fmt.time(date), ctx.fmt.date(date), ctx.fmt.day(date), ctx.now()
*/
import { svg } from "./hv-icons.js";
import { translate } from "./hv-text.js";

export const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const pad = (n) => String(n).padStart(2, "0");

export function createCtx(host) {
  const ctx = {
    host,
    root: host.shadowRoot,
    hass: null,
    data: null,
    config: {},
    view: "hjem",
    arg: "",
    narrow: false,
    modules: [],
    views: {},
    acts: {},
    inputs: {},
    cache: {},
    _watch: new Set(),
    _loading: new Set(),
    esc,
    svg,
  };

  // ---------------------------------------------------------------- language
  ctx.lang = () => {
    const pref = ctx.data?.settings?.language;
    if (pref && pref !== "auto") return pref;
    const l = (ctx.hass?.locale?.language || ctx.hass?.language || "da").toLowerCase();
    return l.startsWith("da") || l.startsWith("nb") || l.startsWith("no") ? "da" : "en";
  };
  ctx.t = (text, vars) => translate(ctx.lang(), text, vars);
  ctx.locale = () => (ctx.lang() === "da" ? "da-DK" : ctx.hass?.locale?.language || "en-GB");

  // ---------------------------------------------------------------- Home Assistant state
  ctx.st = (id) => {
    if (!id) return undefined;
    ctx._watch.add(id);
    return ctx.hass?.states?.[id];
  };
  ctx.val = (id) => ctx.st(id)?.state;
  ctx.attr = (id, key) => ctx.st(id)?.attributes?.[key];
  ctx.name = (id) => {
    const s = ctx.hass?.states?.[id];
    return s?.attributes?.friendly_name || id || "";
  };
  ctx.entities = (domain, filter) =>
    Object.keys(ctx.hass?.states || {})
      .filter((id) => id.startsWith(domain + ".") && (!filter || filter(ctx.hass.states[id])))
      .sort((a, b) => ctx.name(a).localeCompare(ctx.name(b), ctx.locale()));
  ctx.area = (id) => {
    const ent = ctx.hass?.entities?.[id];
    if (!ent) return null;
    if (ent.area_id) return ent.area_id;
    const dev = ent.device_id && ctx.hass?.devices?.[ent.device_id];
    return dev?.area_id || null;
  };
  ctx.areas = () =>
    Object.values(ctx.hass?.areas || {}).sort((a, b) => a.name.localeCompare(b.name, ctx.locale()));
  ctx.platform = (id) => ctx.hass?.entities?.[id]?.platform;
  ctx.unavailable = (id) => {
    const s = ctx.hass?.states?.[id];
    return !s || s.state === "unavailable" || s.state === "unknown";
  };
  ctx.call = async (domain, service, data = {}) => {
    try {
      await ctx.hass.callService(domain, service, data);
      return true;
    } catch (err) {
      ctx.toast(ctx.t("Kunne ikke {what}: {error}", { what: `${domain}.${service}`, error: err?.message || err }));
      return false;
    }
  };
  ctx.ws = (type, payload = {}) => ctx.hass.callWS({ type: `hverdagsro/${type}`, ...payload });
  ctx.save = async (section, value) => {
    const before = ctx.data?.[section];
    if (ctx.data) ctx.data[section] = value;
    try {
      let result;
      try {
        result = await ctx.ws("save", { section, value });
      } catch (err) {
        // Saving the family restarts Hverdagsro for a moment; try once more when it's back.
        if (err?.code !== "not_loaded") throw err;
        await new Promise((r) => setTimeout(r, 1500));
        result = await ctx.ws("save", { section, value });
      }
      if (ctx.data) ctx.data[section] = result.value;
      return true;
    } catch (err) {
      if (ctx.data) ctx.data[section] = before;
      ctx.toast(ctx.t("Det blev ikke gemt: {error}", { error: err?.message || err }));
      ctx.render();
      return false;
    }
  };

  // ---------------------------------------------------------------- family
  ctx.members = () => ctx.data?.family || [];
  ctx.member = (id) => ctx.members().find((m) => m.id === id);
  ctx.children = () => ctx.members().filter((m) => m.role === "child");
  /* A child with two homes: are they here (sleeping here) on a day? Children with one home always are. */
  ctx.atHome = (m, d = new Date()) => {
    const c = m?.custody;
    if (!c || !c.enabled || !c.start) return true;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (c.except && iso in c.except) return !!c.except[iso];
    const cyc = Array.isArray(c.cycle) && c.cycle.length ? c.cycle : [1];
    const [y, mo, da] = String(c.start).split("-").map(Number);
    const n = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(y, mo - 1, da)) / 864e5);
    if (isNaN(n)) return true;
    return !!cyc[((n % cyc.length) + cyc.length) % cyc.length];
  };
  /* The missions a member has on a day (weekday, and which home a child is in). */
  ctx.missionsOn = (m, d = new Date(), all = true) => {
    if (!m) return [];
    const wd = (d.getDay() + 6) % 7, kid = m.role === "child", here = ctx.atHome(m, d);
    return (ctx.data?.missions || []).filter((x) => (x.member === m.id || (all && kid && x.member === "all")) && (x.days || []).includes(wd) && ((x.where || "here") === "always" || ((x.where || "here") === "away") !== here));
  };
  /* Where a child sleeps on a day, as a short label ("" for children with one home). */
  ctx.homeLabel = (m, d = new Date()) => {
    const c = m?.custody;
    if (!c || !c.enabled || !c.start) return "";
    return ctx.atHome(m, d) ? c.here || ctx.t("Hjemme hos os") : c.away || ctx.t("Hos den anden forælder");
  };
  ctx.parents = () => ctx.members().filter((m) => m.role === "parent");
  ctx.me = null;
  ctx.viewAs = null;
  ctx.refreshMe = () => {
    const real = ctx.member(ctx.data?.me) || null;
    const manage = !!ctx.data?.can_manage;
    let as = ctx.viewAs ? ctx.member(ctx.viewAs) : null;
    // Parents may see the panel as anyone; a shared tablet (a user without a member) as one of the children.
    if (as && !manage && (real || as.role !== "child")) as = null;
    ctx.me = as || real;
    ctx.isParent = manage && (!as || as.role === "parent");
    ctx.isKid = !!ctx.me && ctx.me.role === "child" && !ctx.isParent;
  };
  ctx.on = (module) => ctx.data?.modules?.[module] !== false && (module !== "shop" || ctx.data?.modules?.points !== false);
  /* A child's module (Moduler pr. barn), like the prototype's MODS: on for the family and for the child. */
  const KID_DEFAULTS = { room: true, board: false, missions: true, points: true, shop: true, pet: true, read: false, skema: true, wish: true };
  ctx.feature = (m, f) => {
    const member = typeof m === "string" ? ctx.member(m) : m;
    if (!member || !ctx.on(f === "room" ? "rooms" : f)) return false;
    if (f === "shop" && !ctx.feature(member, "points")) return false;
    if (f === "skema" && member.institution !== "skole") return false;
    if (member.role !== "child") return true;
    return { ...KID_DEFAULTS, ...(member.features || {}) }[f] !== false;
  };
  ctx.color = (id) => ctx.member(id)?.color || "#6E4AFF";
  ctx.initials = (m) => (m?.name || "?").trim().charAt(0).toUpperCase();
  ctx.avatar = (id, cls = "") => {
    const m = ctx.member(id);
    const pic = m?.photo || (m?.person && ctx.hass?.states?.[m.person]?.attributes?.entity_picture);
    return `<span class="av ${cls}" style="--pc:${m?.color || "#6E4AFF"};background:${m?.color || "#6E4AFF"}">${
      pic ? `<img src="${esc(pic)}" alt="">` : esc(ctx.initials(m))
    }</span>`;
  };
  ctx.points = (id) => ctx.data?.points?.[id] || 0;
  ctx.home = (m) => {
    if (!m) return null;
    const s = m.person && ctx.st(m.person);
    return s ? s.state === "home" : null;
  };

  // ---------------------------------------------------------------- dates
  ctx.now = () => new Date();
  ctx.fmt = {
    time: (d) => {
      const x = d instanceof Date ? d : new Date(d);
      return ctx.lang() === "da" ? `${pad(x.getHours())}.${pad(x.getMinutes())}` : `${pad(x.getHours())}:${pad(x.getMinutes())}`;
    },
    date: (d, opts = { day: "numeric", month: "long" }) => new Date(d).toLocaleDateString(ctx.locale(), opts),
    day: (d) => new Date(d).toLocaleDateString(ctx.locale(), { weekday: "long" }),
    short: (d) => new Date(d).toLocaleDateString(ctx.locale(), { weekday: "short" }).replace(".", ""),
    iso: (d) => {
      const x = new Date(d);
      return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
    },
    rel: (d) => {
      const days = Math.round((startOfDay(d) - startOfDay(new Date())) / 864e5);
      if (days === 0) return ctx.t("i dag");
      if (days === 1) return ctx.t("i morgen");
      if (days === -1) return ctx.t("i går");
      if (days > 1 && days < 7) return ctx.fmt.day(d);
      return ctx.fmt.date(d, { day: "numeric", month: "short" });
    },
    num: (n, digits = 0) => Number(n).toLocaleString(ctx.locale(), { maximumFractionDigits: digits, minimumFractionDigits: digits }),
  };

  // ---------------------------------------------------------------- async data with cache
  ctx.load = (key, fn, ttl = 60000) => {
    const hit = ctx.cache[key];
    const fresh = hit && Date.now() - hit.at < ttl;
    if (!fresh && !ctx._loading.has(key)) {
      ctx._loading.add(key);
      Promise.resolve()
        .then(fn)
        .then((value) => {
          ctx.cache[key] = { at: Date.now(), value };
        })
        .catch((err) => {
          ctx.cache[key] = { at: Date.now(), value: hit?.value, error: String(err?.message || err) };
        })
        .finally(() => {
          ctx._loading.delete(key);
          ctx.render();
        });
    }
    return hit?.value;
  };
  ctx.drop = (prefix) => {
    for (const key of Object.keys(ctx.cache)) if (key.startsWith(prefix)) delete ctx.cache[key];
  };

  // Calendar events for one or more calendars between two dates.
  ctx.events = (calendars, start, end, all = false) => {
    const list = (calendars || []).filter(Boolean);
    const key = `ev:${list.join(",")}:${start.toISOString()}:${end.toISOString()}`;
    return (
      ctx.load(key, async () => {
        const all = await Promise.all(
          list.map((cal) =>
            ctx.hass
              .callApi("GET", `calendars/${cal}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`)
              .then((items) => items.map((e) => ({ ...e, calendar: cal })))
              .catch(() => [])
          )
        );
        return all
          .flat()
          .map((e) => {
            const allDay = !!e.start?.date && !e.start?.dateTime;
            const s = new Date(e.start?.dateTime || `${e.start?.date}T00:00:00`);
            const en = new Date(e.end?.dateTime || `${e.end?.date}T00:00:00`);
            return { title: e.summary || "", start: s, end: en, allDay, calendar: e.calendar, location: e.location || "", description: e.description || "" };
          })
          .sort((a, b) => a.start - b.start);
      }, 120000) || []
    ).filter((e) => all || !ctx.hiddenLesson(e));
  };
  /* Lessons in a child's timetable the family has chosen not to see (Aula's "Pædagog i skolen" and the like). */
  ctx.hiddenLesson = (e) => {
    const words = ctx.data?.settings?.skema_hide || [];
    if (!words.length || !ctx.members().some((m) => m.skema === e.calendar)) return false;
    const t = `${e.title} ${e.description || ""}`.toLowerCase();
    return words.some((w) => w && t.includes(String(w).toLowerCase()));
  };

  // ---------------------------------------------------------------- UI helpers
  ctx.$ = (id) => ctx.root.getElementById(id);
  ctx.q = (sel) => ctx.root.querySelector(sel);
  ctx.qa = (sel) => [...ctx.root.querySelectorAll(sel)];

  ctx.toast = (msg) => {
    ctx.qa(".toast").forEach((t) => t.remove());
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    ctx.root.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  };

  ctx.sheet = (html, { wide = false, cls = "" } = {}) => {
    const bg = document.createElement("div");
    bg.className = "sheet-bg";
    bg.innerHTML = `<div class="sheet ${wide ? "wide" : ""} ${cls}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
    const close = () => {
      bg.remove();
      ctx.root.removeEventListener("keydown", onKey, true);
    };
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    bg.addEventListener("click", (e) => {
      if (e.target === bg || e.target.closest("[data-close]")) close();
    });
    ctx.root.addEventListener("keydown", onKey, true);
    ctx.root.appendChild(bg);
    const sheet = bg.querySelector(".sheet");
    sheet.focus({ preventScroll: true });
    bg.close = close;
    return { el: sheet, bg, close };
  };

  ctx.confirm = (title, text, yes, onYes) => {
    const s = ctx.sheet(`<h2>${esc(title)}</h2><p class="t-sub">${esc(text)}</p>
      <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Annullér"))}</button><button class="btn danger" data-yes>${esc(yes)}</button></div>`);
    s.el.querySelector("[data-yes]").addEventListener("click", () => {
      s.close();
      onYes();
    });
  };

  ctx.go = (view) => {
    const [v, ...rest] = String(view).split(":");
    ctx.view = v;
    ctx.arg = rest.join(":");
    try {
      sessionStorage.setItem("hverdagsro-view", view);
    } catch (e) {
      /* private mode */
    }
    ctx.host.onNavigate?.();
    ctx.render(true);
    ctx.host.scroller?.scrollTo({ top: 0, behavior: "smooth" });
  };

  ctx.render = (now = false) => ctx.host.requestRender(now);

  return ctx;
}

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const pad2 = pad;

/* A small, seeded random generator (for drawings that must look the same every time). */
export function prng(seed) {
  let x = seed % 233280;
  return () => (x = (x * 9301 + 49297) % 233280) / 233280;
}
export const hashStr = (s) => {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
};
export const hexRgb = (h) => {
  const s = String(h).replace("#", "");
  const v = s.length === 3 ? s.split("").map((c) => c + c).join("") : s.padEnd(6, "0");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) || 0);
};
export const mixHex = (a, b, t) => {
  const A = hexRgb(a),
    B = hexRgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
export const uid = (prefix = "x") => `${prefix}${Math.random().toString(36).slice(2, 8)}`;
export const slug = (v) =>
  String(v)
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[éè]/g, "e")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "x";

/* Patch a page in place instead of replacing it: elements that are still there are kept, so an open picker stays
   open, a focused field keeps its text, the scroll position stays and nothing plays its entrance animation again. */
export function morph(target, html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  morphKids(target, tpl.content);
}
function morphKids(a, b) {
  const want = [...b.childNodes];
  let have = [...a.childNodes];
  for (let i = 0; i < want.length; i++) {
    const n = want[i], o = have[i];
    if (!o) a.appendChild(n);
    else if (!sameKind(o, n)) a.replaceChild(n, o);
    else morphNode(o, n);
  }
  have = [...a.childNodes];
  for (let i = want.length; i < have.length; i++) have[i].remove();
}
const sameKind = (o, n) => o.nodeType === n.nodeType && o.nodeName === n.nodeName && (o.nodeType !== 1 || (o.getAttribute("id") || "") === (n.getAttribute("id") || ""));
function morphNode(o, n) {
  if (o.nodeType !== 1) {
    if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
    return;
  }
  const focused = o.getRootNode?.().activeElement === o;
  for (const { name } of [...o.attributes]) if (!n.hasAttribute(name) && name !== "data-bound") o.removeAttribute(name);
  for (const { name, value } of [...n.attributes]) {
    if (o.getAttribute(name) === value) continue;
    if (focused && (name === "value" || name === "checked")) continue;
    o.setAttribute(name, value);
    if (name === "value" && "value" in o && o.tagName !== "OPTION") o.value = value;
    if (name === "checked") o.checked = true;
  }
  if (!focused && o.tagName === "INPUT" && (o.type === "checkbox" || o.type === "radio")) o.checked = n.hasAttribute("checked");
  if (o.tagName === "TEXTAREA") {
    if (!focused && o.value !== n.value) o.value = n.value;
    return;
  }
  morphKids(o, n);
  if (o.tagName === "SELECT" && !focused) {
    const sel = n.querySelector("option[selected]");
    o.value = sel ? sel.value : o.options[0]?.value ?? "";
  }
}
