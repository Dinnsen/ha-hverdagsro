/* Hverdagsro – Musik.
   The family's speakers and TVs are Home Assistant media players (settings.media, or every media_player when none is chosen).
   A "zone" is one speaker, or a group of speakers that play the same (attributes.group_members, the first is the leader).
   Only Home Assistant's generic media-player features are used, read from supported_features, so it works with any
   integration. Tested against what these well-used integrations expose:
     - Sonos: grouping (join/unjoin), shuffle/repeat, sources, browse, bass/treble/loudness/night sound as number/switch entities
     - Music Assistant: grouping, queue-backed next/previous, shuffle/repeat, browse of the whole library and radio
     - Google Cast (Chromecast, Nest speakers): play/pause/volume, browse, TVs with turn on/off
     - Spotify (Spotify Connect): sources = Connect devices, shuffle/repeat, browse playlists
     - Apple TV / AirPlay: power, transport, volume, artwork
   Inspired by the Sonos card (maxi media player), Mediocre Media Player, Mini Media Player and Mushroom. */
import { esc, hashStr, prng } from "./hv-core.js";
import { svg } from "./hv-icons.js";

// MediaPlayerEntityFeature
const F = {
  PAUSE: 1, SEEK: 2, VOLUME_SET: 4, VOLUME_MUTE: 8, PREVIOUS: 16, NEXT: 32, TURN_ON: 128, TURN_OFF: 256,
  PLAY_MEDIA: 512, SELECT_SOURCE: 2048, STOP: 4096, PLAY: 16384, SHUFFLE: 32768, SOUND_MODE: 65536,
  BROWSE: 131072, REPEAT: 262144, GROUPING: 524288,
};
const LS_ZONE = "hverdagsro-music-zone";
const ACTIVE = new Set(["playing", "paused", "buffering"]);

let zone = null; // the chosen speaker (entity id)
let tab = "spiller"; // narrow screens: spiller | hojt | udforsk
let browse = []; // the browse path: [{ id, type, title }]
let focus = null;

const has = (s, f) => ((s?.attributes?.supported_features || 0) & f) === f;
const isTv = (ctx, id) => ctx.hass.states[id]?.attributes?.device_class === "tv" || /\btv\b|fjernsyn|apple tv|chromecast|shield|google tv/i.test(ctx.name(id));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ------------------------------------------------------------------ generated covers (when there is no artwork)
const COVER_PAL = [["#FF6B6B", "#FFD93D"], ["#6C5CE7", "#00CEC9"], ["#0F2027", "#2C9FB0"], ["#F8B195", "#6C5B7B"], ["#11998E", "#38EF7D"], ["#FC5C7D", "#6A82FB"], ["#F7971E", "#FFD200"], ["#1D2B64", "#F8CDDA"], ["#8E2DE2", "#4A00E0"], ["#00B4DB", "#0083B0"], ["#E96443", "#904E95"], ["#3A1C71", "#FFAF7B"]];
const coverCols = (seed) => COVER_PAL[hashStr(seed) % COVER_PAL.length];
let coverN = 0;
export function cover(seed, label = "") {
  const h = hashStr(seed), [a, b] = coverCols(seed), st = (h >> 5) % 5, id = "mucv" + coverN++, r = prng((h % 9973) + 1);
  let art = "";
  if (st === 0) for (let i = 6; i > 0; i--) art += `<circle cx="${30 + (h % 40)}" cy="${40 + (h % 30)}" r="${i * 11}" fill="none" stroke="rgba(255,255,255,${0.08 + i * 0.03})" stroke-width="5"/>`;
  else if (st === 1) for (let i = -4; i < 10; i++) art += `<rect x="${i * 14}" y="-20" width="7" height="160" fill="rgba(255,255,255,.14)" transform="rotate(30 50 50)"/>`;
  else if (st === 2) art += `<circle cx="64" cy="38" r="22" fill="rgba(255,255,255,.85)"/>` + [0, 1, 2].map((i) => `<path d="M0,${66 + i * 11} q25,-10 50,0 t50,0 v40 h-100z" fill="rgba(0,0,0,${0.12 + i * 0.08})"/>`).join("");
  else if (st === 3) for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) art += `<circle cx="${10 + x * 16}" cy="${10 + y * 16}" r="${2 + r() * 5}" fill="rgba(255,255,255,${0.15 + r() * 0.5})"/>`;
  else for (let i = 0; i < 4; i++) art += `<ellipse cx="${r() * 100}" cy="${r() * 100}" rx="${20 + r() * 30}" ry="${14 + r() * 24}" fill="rgba(255,255,255,${0.1 + r() * 0.22})" transform="rotate(${r() * 90} 50 50)"/>`;
  return `<svg class="cover" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100" height="100" fill="url(#${id})"/>${art}${
    label ? `<text x="8" y="90" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="${label.length > 10 ? 10 : 13}" fill="#fff">${esc(label.slice(0, 16))}</text>` : ""
  }</svg>`;
}

function spkIcon(kind) {
  const m = {
    bar: `<rect x="3" y="9" width="18" height="6" rx="2"/><path d="M6 12h.01M9 12h.01M12 12h.01M15 12h.01M18 12h.01"/>`,
    one: `<rect x="7" y="3" width="10" height="18" rx="3"/><circle class="woof" cx="12" cy="14" r="3"/><circle cx="12" cy="7" r=".8"/>`,
    roam: `<path d="M9 3h6l2 18H7z"/><circle class="woof" cx="12" cy="14" r="2.4"/>`,
    nest: `<ellipse cx="12" cy="13" rx="8" ry="7"/><circle class="woof" cx="12" cy="13" r="3"/>`,
    airport: `<rect x="5" y="5" width="14" height="14" rx="3"/><circle class="woof" cx="12" cy="12" r="2"/>`,
    tv: `<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 20h6"/>`,
    cloud: `<path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.3 1.5A3.3 3.3 0 0 0 7 18z"/><path class="woof" d="M10 13.5v2M12 12.5v4M14 13.5v2"/>`,
  }[kind] || "";
  return `<svg viewBox="0 0 24 24" class="ic spk" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${m}</svg>`;
}

function kindOf(ctx, id) {
  const dev = ctx.hass.devices?.[ctx.hass.entities?.[id]?.device_id];
  const n = `${ctx.name(id)} ${dev?.model || ""}`.toLowerCase(), p = ctx.platform(id) || "";
  if (isTv(ctx, id)) return "tv";
  if (p === "spotify" || /spotify/.test(n)) return "cloud";
  if (/arc|beam|ray|bar|playbar|playbase/.test(n)) return "bar";
  if (/roam|move/.test(n)) return "roam";
  if (/nest|google|home mini|echo|alexa/.test(n) || p === "cast") return "nest";
  if (/airport|airplay|homepod/.test(n)) return "airport";
  return "one";
}

// ------------------------------------------------------------------ players and zones
function players(ctx) {
  const chosen = (ctx.data?.settings?.media || []).filter((id) => ctx.hass.states[id]);
  const list = chosen.length ? chosen : ctx.entities("media_player");
  list.forEach((id) => ctx.st(id)); // re-render when one changes
  return list;
}

function groupOf(ctx, id) {
  const gm = ctx.hass.states[id]?.attributes?.group_members;
  if (Array.isArray(gm) && gm.length > 1 && gm.includes(id)) return gm.filter((x) => ctx.hass.states[x]);
  return [id];
}
const leaderOf = (ctx, id) => groupOf(ctx, id)[0] || id;

function zones(ctx, list) {
  const seen = new Set(), out = [];
  for (const id of list) {
    if (seen.has(id)) continue;
    const g = groupOf(ctx, id).filter((x) => list.includes(x) || x === id);
    g.forEach((x) => seen.add(x));
    out.push({ id: g[0], members: g });
  }
  const rank = (z) => ({ playing: 3, buffering: 3, paused: 2 })[ctx.hass.states[z.id]?.state] || (ctx.unavailable(z.id) ? 0 : 1);
  return out.sort((a, b) => rank(b) - rank(a));
}

const zoneName = (ctx, members) => (members.length > 2 ? `${ctx.name(members[0])} + ${members.length - 1}` : members.map((m) => ctx.name(m)).join(" + "));

function pickZone(ctx, list) {
  if (!zone) {
    try {
      zone = localStorage.getItem(LS_ZONE);
    } catch (e) {
      zone = null;
    }
  }
  if (!zone || !list.includes(zone)) zone = list.find((id) => ctx.hass.states[id]?.state === "playing") || list[0] || null;
  return zone;
}

function position(s) {
  const a = s?.attributes || {};
  if (a.media_position == null) return 0;
  let p = Number(a.media_position);
  if (s.state === "playing" && a.media_position_updated_at) p += (Date.now() - new Date(a.media_position_updated_at)) / 1000;
  return Math.max(0, Math.min(Number(a.media_duration) || p, p));
}

// The generated cover's seed, like the prototype: the station for live radio, else the album.
function seedOf(ctx, s, id) {
  const a = s?.attributes || {};
  return (!Number(a.media_duration) ? a.media_channel || a.media_album_name : a.media_album_name || a.media_artist) || a.media_title || ctx.name(id);
}

function art(ctx, s, seed, label = "") {
  const pic = s?.attributes?.entity_picture;
  if (pic) return `<img class="cover" src="${esc(ctx.hass.hassUrl ? ctx.hass.hassUrl(pic) : pic)}" alt="" loading="lazy">`;
  return cover(seed, label);
}

function stateText(ctx, s) {
  if (!s || s.state === "unavailable" || s.state === "unknown") return ctx.t("Ikke forbundet");
  const a = s.attributes;
  if (s.state === "playing") return a.media_title || ctx.t("Spiller");
  if (s.state === "paused") return ctx.t("På pause · {title}", { title: a.media_title || "" }).replace(/ · $/, "");
  if (s.state === "buffering") return ctx.t("Henter …");
  if (s.state === "off") return ctx.t("Slukket");
  if (s.state === "standby") return ctx.t("Standby");
  return ctx.t("Ledig");
}


// ------------------------------------------------------------------ the queue, the sleep timer and moving the music
// Queues: Sonos (sonos.get_queue) lists the whole queue; Music Assistant (music_assistant.get_queue) gives the next item.
const queueKind = (ctx, id) => {
  const p = ctx.platform(id);
  return p === "sonos" || p === "music_assistant" ? p : null;
};
let mQueue = false; // the queue card is open
const sleepUntil = {}; // entity → timestamp the sleep timer ends (set from here)

async function respond(ctx, domain, service, entity) {
  const r = await ctx.hass.callWS({ type: "call_service", domain, service, target: { entity_id: entity }, return_response: true });
  return r?.response?.[entity];
}

function queueOf(ctx, lead) {
  const kind = queueKind(ctx, lead);
  if (!kind) return null;
  const S = ctx.hass.states[lead];
  const key = `mu-q:${lead}:${S?.attributes?.media_title || ""}`;
  const v = ctx.load(key, async () => {
    if (kind === "sonos") {
      const items = (await respond(ctx, "sonos", "get_queue", lead)) || [];
      const at = Number(S?.attributes?.queue_position);
      const from = Number.isFinite(at) ? at + 1 : 0;
      return items.slice(from).map((x, i) => ({ title: x.media_title || "", artist: x.media_artist || "", dur: 0, pos: from + i }));
    }
    const q = (await respond(ctx, "music_assistant", "get_queue", lead)) || {};
    const n = q.next_item;
    if (!n) return [];
    const mi = n.media_item || {};
    return [{ title: mi.name || n.name || "", artist: (mi.artists || []).map((a) => a.name).join(", "), dur: n.duration || mi.duration || 0, pos: null }];
  }, 30000);
  return { kind, items: v || null };
}

function sleepLeft(id) {
  const t = sleepUntil[id];
  if (!t) return 0;
  const m = Math.ceil((t - Date.now()) / 60000);
  if (m <= 0) {
    delete sleepUntil[id];
    return 0;
  }
  return m;
}

// ------------------------------------------------------------------ the music library (media browsing)
// Udforsk: one tab per source at the top of the player's library (the prototype's Christian / Katrine / Radio),
// then the source's playlists, albums and stations. Folders open; anything playable plays in the chosen zone.
let mAcc = null; // the chosen source (its media_content_id)
let quick = []; // the idle hero's quick picks

function browseKey(lead, at) {
  return `mu-br:${lead}:${at ? at.type + "|" + at.id : ""}`;
}
function browseLoad(ctx, lead, at) {
  const key = browseKey(lead, at);
  return ctx.load(key, () => ctx.hass.callWS({ type: "media_player/browse_media", entity_id: lead, ...(at ? { media_content_id: at.id, media_content_type: at.type } : {}) }), 300000);
}
const thumbUrl = (ctx, t) => (t.startsWith("/") && ctx.hass.hassUrl ? ctx.hass.hassUrl(t) : t);

function sources(ctx, lead) {
  const root = browseLoad(ctx, lead, null);
  if (!root) return null;
  // Favourites are the idle hero's quick picks; the tabs are the sources (accounts, radio, library).
  const all = (root.children || []).filter((c) => c.can_expand);
  const plain = all.filter((c) => !/favorit|favorite/i.test(`${c.title} ${c.media_content_type} ${c.media_content_id}`));
  const kids = plain.length ? plain : all;
  return kids.length ? kids : [{ title: root.title || ctx.t("Bibliotek"), media_content_id: root.media_content_id, media_content_type: root.media_content_type, root: true }];
}

function quickPicks(ctx, lead) {
  const S = ctx.hass.states[lead];
  if (!has(S, F.BROWSE) || !has(S, F.PLAY_MEDIA)) return [];
  const root = browseLoad(ctx, lead, null);
  if (!root) return [];
  const kids = root.children || [];
  const fav = kids.find((c) => c.can_expand && /favorit|favorite/i.test(`${c.title} ${c.media_content_type} ${c.media_content_id}`));
  let list = kids;
  if (fav) {
    const res = browseLoad(ctx, lead, { id: fav.media_content_id, type: fav.media_content_type });
    if (res) list = res.children || [];
  }
  return list.filter((c) => c.can_play).slice(0, 4);
}

// ------------------------------------------------------------------ the page
function render(ctx) {
  const list = players(ctx);
  if (!list.length)
    return `<section class="card hv-empty">${svg("music", "ic big")}<h2>${esc(ctx.t("Ingen højttalere endnu"))}</h2><p class="t-sub">${esc(
      ctx.t("Når I har medieafspillere i Home Assistant, kan I styre dem her. Vælg hvilke under Familieindstillinger.")
    )}</p>${ctx.isParent ? `<button class="btn" data-go="indstillinger:musik">${svg("gear")}${esc(ctx.t("Vælg afspillere"))}</button>` : ""}</section>`;
  const cur = pickZone(ctx, list);
  const group = groupOf(ctx, cur);
  const lead = group[0];
  const S = ctx.hass.states[lead];
  const a = S?.attributes || {};
  const playing = S?.state === "playing" || S?.state === "buffering";
  const active = ACTIVE.has(S?.state) || (!!a.media_title && S?.state !== "off" && S?.state !== "idle");
  const seed = seedOf(ctx, S, lead);
  const [c1, c2] = coverCols(seed);
  const zs = zones(ctx, list);
  const live = !Number(a.media_duration);

  const zoneBar = `<div class="mu-zones" role="tablist" aria-label="${esc(ctx.t("Vælg afspiller"))}">${zs
    .map((z) => {
      const zs_ = ctx.hass.states[z.id], on = z.members.includes(cur), pl = zs_?.state === "playing", act = ACTIVE.has(zs_?.state);
      return act
        ? `<button class="mu-z${on ? " on" : ""}${pl ? " playing" : ""}" role="tab" aria-selected="${on}" data-act="mu-zone" data-id="${esc(z.id)}">${art(ctx, zs_, seedOf(ctx, zs_, z.id))}<span><b>${esc(zoneName(ctx, z.members))}</b><small>${esc(stateText(ctx, zs_))}</small></span>${
            pl ? `<span class="mu-eq on sm"><i></i><i></i><i></i></span>` : `<span class="mu-zp">${svg("pause")}</span>`
          }</button>`
        : `<button class="mu-z idle${on ? " on" : ""}" role="tab" aria-selected="${on}" data-act="mu-zone" data-id="${esc(z.id)}"><span class="mu-zi">${spkIcon(kindOf(ctx, z.id))}</span><span><b>${esc(zoneName(ctx, z.members))}</b><small>${esc(stateText(ctx, zs_))}</small></span></button>`;
    })
    .join("")}</div>`;

  const volRow = (id, many) => {
    const s = ctx.hass.states[id], v = Math.round((s?.attributes?.volume_level ?? 0) * 100), muted = !!s?.attributes?.is_volume_muted;
    const canVol = has(s, F.VOLUME_SET), canMute = has(s, F.VOLUME_MUTE);
    if (!canVol && !canMute) return "";
    return `<div class="mu-vol${muted ? " muted" : ""}">${
      canMute ? `<button class="mu-mute" data-act="mu-mute" data-id="${esc(id)}" aria-label="${esc(muted ? ctx.t("Slå lyd til i {name}", { name: ctx.name(id) }) : ctx.t("Slå lyd fra i {name}", { name: ctx.name(id) }))}">${svg(muted ? "mute" : "speaker")}</button>` : svg("speaker")
    }<input type="range" min="0" max="100" value="${v}" data-in="mu-vol" data-id="${esc(id)}" ${canVol ? "" : "disabled"} aria-label="${esc(ctx.t("Lydstyrke {name}", { name: ctx.name(id) }))}"><b class="num">${v}</b><small>${esc(ctx.name(id))}</small>${
      many && has(s, F.GROUPING) ? `<button class="mu-x" data-act="mu-unjoin" data-id="${esc(id)}" aria-label="${esc(ctx.t("Tag {name} ud af gruppen", { name: ctx.name(id) }))}">${svg("x")}</button>` : ""
    }</div>`;
  };
  const avg = Math.round((group.reduce((t, id) => t + (ctx.hass.states[id]?.attributes?.volume_level ?? 0), 0) / group.length) * 100);
  const grpVol = `<div class="mu-gv">${
    group.length > 1 ? `<div class="mu-vol all">${svg("speaker")}<input type="range" min="0" max="100" value="${avg}" data-in="mu-gvol" aria-label="${esc(ctx.t("Lydstyrke for hele gruppen"))}"><b class="num" id="mu-mv">${avg}</b><small>${esc(ctx.t("Alle"))}</small></div>` : ""
  }${group.map((id) => volRow(id, group.length > 1)).join("")}</div>`;

  const canGroup = has(S, F.GROUPING) && list.some((id) => id !== cur && has(ctx.hass.states[id], F.GROUPING));
  const Q = active ? queueOf(ctx, lead) : null;
  let hero;
  if (active) {
    const dur = Number(a.media_duration) || 0, pos = position(S);
    const from = live ? ctx.t("{name} direkte", { name: a.media_channel || a.media_album_name || a.media_artist || a.source || ctx.t("Radio") }) : a.app_name || a.source || "";
    const src = [zoneName(ctx, group), from].filter(Boolean).join(" · ");
    const sub = live ? a.media_artist || "" : [a.media_artist, a.media_album_name].filter(Boolean).join(" · ") || a.media_series_title || a.media_channel || "";
    const ctl = [];
    if (has(S, F.SHUFFLE)) ctl.push(`<button class="mu-b${a.shuffle ? " on" : ""}" data-act="mu-shuffle" aria-pressed="${!!a.shuffle}" aria-label="${esc(ctx.t("Bland"))}">${svg("shuffle")}</button>`);
    if (has(S, F.PREVIOUS)) ctl.push(`<button class="mu-b" data-act="mu-prev" aria-label="${esc(ctx.t("Forrige"))}">${svg("prev")}</button>`);
    if (has(S, F.PAUSE) || has(S, F.PLAY)) ctl.push(`<button class="mu-play" data-act="mu-play" aria-label="${esc(playing ? ctx.t("Pause") : ctx.t("Afspil"))}">${svg(playing ? "pause" : "play")}</button>`);
    else if (has(S, F.STOP) && playing) ctl.push(`<button class="mu-play" data-act="mu-stop" aria-label="${esc(ctx.t("Stop"))}">${svg("x")}</button>`);
    if (has(S, F.NEXT)) ctl.push(`<button class="mu-b" data-act="mu-next" aria-label="${esc(ctx.t("Næste"))}">${svg("next")}</button>`);
    if (has(S, F.REPEAT)) ctl.push(`<button class="mu-b${a.repeat && a.repeat !== "off" ? " on" : ""}" data-act="mu-repeat" aria-label="${esc(ctx.t("{_}Gentag", { _: "" }))}">${svg("repeat")}${a.repeat === "one" ? "<small>1</small>" : ""}</button>`);
    const tools = [];
    if (Q) tools.push(`<button class="mu-tool${mQueue ? " on" : ""}" data-act="mu-queue">${svg("queue")}${esc(ctx.t("Kø"))}${Q.items && Q.items.length ? ` <b class="num">${Q.items.length}</b>` : ""}</button>`);
    if (ctx.platform(lead) === "sonos") {
      const left = sleepLeft(lead);
      tools.push(`<button class="mu-tool${left ? " on" : ""}" data-act="mu-sleep">${svg("timer")}${esc(left ? ctx.t("Slukker om {n} min", { n: left }) : ctx.t("Sove-timer"))}</button>`);
    }
    if (canGroup || queueKind(ctx, lead) === "music_assistant") tools.push(`<button class="mu-tool" data-act="mu-xfer">${svg("transfer")}${esc(ctx.t("Flyt"))}</button>`);
    if (canGroup) tools.push(`<button class="mu-tool" data-act="mu-group">${svg("link")}${esc(ctx.t("Gruppér"))}</button>`);
    if (!has(S, F.BROWSE) && has(S, F.SELECT_SOURCE) && (a.source_list || []).length) tools.push(`<button class="mu-tool" data-act="mu-source">${svg("music")}${esc(a.source || ctx.t("Kilde"))}</button>`);
    hero = `<section class="mu-hero${playing ? " playing" : ""}" style="--c1:${c1};--c2:${c2}">
      <div class="mu-bg"><i></i><i></i><i></i></div>
      <div class="mu-art"><div class="mu-vinyl"><i></i></div><div class="mu-cover">${art(ctx, S, seed, live ? a.media_channel || a.media_album_name || "" : "")}</div></div>
      <div class="mu-info">
        <span class="mu-src">${spkIcon(kindOf(ctx, lead))}${esc(src)}</span>
        <h2>${esc(a.media_title || ctx.name(lead))}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}
        <div class="mu-eq"><i></i><i></i><i></i><i></i><i></i></div>
        ${
          dur
            ? `<div class="mu-prog"><span class="num" id="mu-pos">${mmss(pos)}</span><input type="range" min="0" max="${Math.round(dur)}" value="${Math.round(pos)}" id="mu-range" data-in="mu-seek" ${has(S, F.SEEK) ? "" : "disabled"} aria-label="${esc(ctx.t("Position"))}"><span class="num">${mmss(dur)}</span></div>`
            : `<div class="mu-live"><i></i>${esc(ctx.t("Direkte radio"))}</div>`
        }
        <div class="mu-ctl">${ctl.join("")}</div>
        ${tools.length ? `<div class="mu-tools">${tools.join("")}</div>` : ""}
        ${grpVol}
      </div></section>`;
  } else {
    const off = S?.state === "off" || S?.state === "standby";
    const others = zs.filter((z) => !z.members.includes(cur) && ACTIVE.has(ctx.hass.states[z.id]?.state) && has(ctx.hass.states[z.id], F.GROUPING) && has(S, F.GROUPING));
    quick = quickPicks(ctx, lead);
    const name = ctx.name(lead);
    hero = `<section class="mu-hero idle" style="--c1:${c1};--c2:${c2}"><div class="mu-bg"><i></i><i></i><i></i></div><div class="mu-art"><div class="mu-cover idle">${spkIcon(kindOf(ctx, lead))}</div></div>
      <div class="mu-info"><span class="mu-src">${spkIcon(kindOf(ctx, lead))}${esc(name)} · ${esc(lead)}</span><h2>${esc(
        ctx.unavailable(lead) ? ctx.t("{name} svarer ikke", { name }) : off ? ctx.t("{name} er slukket", { name }) : ctx.t("{name} er ledig", { name })
      )}</h2><p>${esc(has(S, F.BROWSE) ? ctx.t("Vælg noget i Udforsk, eller lad {name} spille med en anden højttaler.", { name }) : ctx.t("Start musikken i jeres app, eller lad {name} spille med en anden højttaler.", { name }))}</p>
        ${off && has(S, F.TURN_ON) ? `<div class="mu-tools"><button class="mu-tool on" data-act="mu-poweron" data-id="${esc(lead)}">${svg("power")}${esc(ctx.t("Tænd"))}</button></div>` : ""}
        ${quick.length ? `<div class="mu-quick">${quick.map((c, i) => `<button class="mu-q" data-act="mu-quick" data-id="${i}">${c.thumbnail ? `<img class="cover" src="${esc(thumbUrl(ctx, c.thumbnail))}" alt="" loading="lazy">` : cover(c.title || String(i), (c.title || "").length < 12 ? c.title : "")}<span>${esc(c.title || "")}</span></button>`).join("")}</div>` : ""}
        ${others.length ? `<div class="mu-join">${others.map((z) => `<button class="mu-tool" data-act="mu-joinzone" data-id="${esc(z.id)}">${svg("link")}${esc(ctx.t("Spil med {name}", { name: zoneName(ctx, z.members) }))}</button>`).join("")}</div>` : ""}
        ${grpVol}</div></section>`;
  }

  // The queue (Sonos, Music Assistant)
  let queue = "";
  if (Q && mQueue) {
    const rows = Q.items;
    queue = `<section class="card mu-queue"><div class="card-head"><h2>${esc(ctx.t("Næste i køen"))}</h2><span class="meta">${esc(zoneName(ctx, group))}</span></div>${
      rows === null
        ? `<p class="t-sub">${esc(ctx.t("Henter køen …"))}</p>`
        : rows.length
        ? `<div class="mu-ql">${rows
            .map((t, i) => {
              const sonos = Q.kind === "sonos";
              return `<div class="mu-qi" style="animation-delay:${i * 40}ms"><span class="num">${i + 1}</span>${cover(seed + t.title)}<span><b>${esc(t.title)}</b><small>${esc([t.artist, t.dur ? mmss(t.dur) : ""].filter(Boolean).join(" · "))}</small></span>${
                sonos
                  ? `<button class="iconbtn" data-act="mu-qplay" data-id="${t.pos}" aria-label="${esc(ctx.t("Spil {title} nu", { title: t.title }))}">${svg("play")}</button><button class="iconbtn" data-act="mu-qup" data-id="${i}" aria-label="${esc(ctx.t("Flyt op"))}" disabled>${svg("up")}</button><button class="iconbtn" data-act="mu-qdel" data-id="${t.pos}" aria-label="${esc(ctx.t("Fjern fra køen"))}">${svg("x")}</button>`
                  : `<button class="iconbtn" data-act="mu-next" aria-label="${esc(ctx.t("Spil {title} nu", { title: t.title }))}">${svg("play")}</button>`
              }</div>`;
            })
            .join("")}</div>`
        : `<p class="t-sub">${esc(live ? ctx.t("Radio har ikke en kø.") : ctx.t("Køen er tom."))}</p>`
    }</section>`;
  }

  // Speakers: presets ("Hele huset" and every area with more than one speaker), then each speaker
  const groupable = list.filter((id) => has(ctx.hass.states[id], F.GROUPING));
  const presets = [];
  if (has(S, F.GROUPING) && groupable.length > 1) {
    const same = (ids) => ids.every((id) => group.includes(id)) && group.length === ids.length;
    presets.push(`<button class="fchip" data-act="mu-all" aria-pressed="${same(groupable)}">${esc(ctx.t("Hele huset"))}</button>`);
    const byArea = {};
    for (const id of groupable) {
      const ar = ctx.area(id);
      if (ar) (byArea[ar] ||= []).push(id);
    }
    for (const [ar, ids] of Object.entries(byArea)) {
      if (ids.length < 2 || ids.length === groupable.length) continue;
      presets.push(`<button class="fchip" data-act="mu-area" data-id="${esc(ar)}" aria-pressed="${same(ids)}">${esc(ctx.hass.areas?.[ar]?.name || ar)}</button>`);
    }
  }
  const spks = list
    .map((id) => {
      const s = ctx.hass.states[id], inSel = group.includes(id), pl = s?.state === "playing", act = ACTIVE.has(s?.state), muted = !!s?.attributes?.is_volume_muted;
      const v = Math.round((s?.attributes?.volume_level ?? 0) * 100);
      const g = groupOf(ctx, id);
      const canLink = id !== cur && has(s, F.GROUPING) && has(ctx.hass.states[cur], F.GROUPING);
      const btns = [];
      if (act && (has(s, F.PAUSE) || has(s, F.PLAY))) btns.push(`<button class="mu-sp" data-act="mu-spk" data-id="${esc(id)}" aria-label="${esc(ctx.t(pl ? "Pause i {name}" : "Afspil i {name}", { name: ctx.name(id) }))}">${svg(pl ? "pause" : "play")}</button>`);
      else if ((s?.state === "off" || s?.state === "standby") && has(s, F.TURN_ON)) btns.push(`<button class="mu-sp" data-act="mu-poweron" data-id="${esc(id)}" aria-label="${esc(ctx.t("Tænd {name}", { name: ctx.name(id) }))}">${svg("power")}</button>`);
      if (canLink)
        btns.push(`<button class="mu-link${inSel ? " on" : ""}" data-act="mu-link" data-id="${esc(id)}" aria-pressed="${inSel}" aria-label="${esc(inSel ? ctx.t("Tag ud af gruppen") : ctx.t("Spil med {name}", { name: zoneName(ctx, group) }))}">${svg("link")}</button>`);
      else if (id === cur) btns.push(`<span class="mu-here">${esc(ctx.t("Valgt"))}</span>`);
      if (settingsOf(ctx, id).length) btns.push(`<button class="iconbtn mu-gear" data-act="mu-gear" data-id="${esc(id)}" aria-label="${esc(ctx.t("Klang for {name}", { name: ctx.name(id) }))}">${svg("sliders")}</button>`);
      const title = s?.attributes?.media_title || "";
      const small = act ? `${ctx.t(pl ? "Spiller: {title}" : "På pause: {title}", { title })}${g.length > 1 ? ` · ${ctx.t("{n} sammen", { n: g.length })}` : ""}` : stateText(ctx, s);
      return `<div class="mu-spk${inSel ? " sel" : ""}${pl ? " playing" : ""}${muted ? " muted" : ""}${focus === id ? " focus" : ""}${ctx.unavailable(id) ? " mu-off" : ""}"><button class="mu-si" data-act="mu-zone" data-id="${esc(id)}" aria-label="${esc(ctx.t("Vælg {name}", { name: ctx.name(id) }))}">${spkIcon(kindOf(ctx, id))}</button><button class="mu-sn" data-act="mu-zone" data-id="${esc(id)}"><b>${esc(ctx.name(id))}</b><small>${esc(small)}</small></button>
        <div class="mu-sb">${btns.join("")}</div>
        ${
          has(s, F.VOLUME_SET) || has(s, F.VOLUME_MUTE)
            ? `<div class="mu-sv">${has(s, F.VOLUME_MUTE) ? `<button class="mu-mute" data-act="mu-mute" data-id="${esc(id)}" aria-label="${esc(muted ? ctx.t("Slå lyd til") : ctx.t("Slå lyd fra"))}">${svg(muted ? "mute" : "speaker")}</button>` : "<span></span>"}<input type="range" min="0" max="100" value="${v}" data-in="mu-vol" data-id="${esc(id)}" ${has(s, F.VOLUME_SET) ? "" : "disabled"} aria-label="${esc(ctx.t("Lydstyrke {name}", { name: ctx.name(id) }))}"><b class="num">${v}</b></div>`
            : ""
        }</div>`;
    })
    .join("");

  return `<div class="mu" data-tab="${tab}">${zoneBar}<div class="seg mu-tabs">${[["spiller", "Afspiller"], ["hojt", "Højttalere"], ["udforsk", "Udforsk"]]
    .map(([k, l]) => `<button data-act="mu-tab" data-id="${k}" aria-pressed="${tab === k}">${esc(ctx.t(l))}</button>`)
    .join("")}</div>
  <div class="mu-layout"><div class="mu-pa" data-pane="spiller">${hero}${queue}</div>
  <section class="card mu-pc" id="mu-spk" data-pane="hojt"><div class="card-head"><h2>${esc(ctx.t("Højttalere"))}</h2>${
    ctx.isParent ? `<span class="meta"><button class="lnk" data-go="indstillinger:musik">${esc(ctx.t("Vælg hvilke"))}</button></span>` : ""
  }</div>
    ${presets.length ? `<div class="mu-pre">${presets.join("")}</div>` : ""}
    <div class="mu-spks">${spks}</div></section>
  <section class="card mu-pb" data-pane="udforsk">${browsePane(ctx, lead, group)}</section>
  </div></div>`;
}

// ------------------------------------------------------------------ Udforsk
function browsePane(ctx, lead, group) {
  const S = ctx.hass.states[lead];
  const head = `<div class="card-head"><h2>${esc(ctx.t("Udforsk"))}</h2><span class="meta">${esc(ctx.t("Spiller i {name}", { name: zoneName(ctx, group) }))}</span></div>`;
  if (!has(S, F.BROWSE) || !has(S, F.PLAY_MEDIA))
    return `${head}<p class="t-sub">${esc(ctx.t("{name} kan ikke gennemse musik i Home Assistant. Vælg en anden højttaler, eller start musikken i jeres app.", { name: ctx.name(lead) }))}</p>`;
  const srcs = sources(ctx, lead);
  const rootErr = ctx.cache[browseKey(lead, null)]?.error;
  if (!srcs) {
    if (rootErr) return `${head}<p class="t-sub">${esc(ctx.t("Kunne ikke hente biblioteket: {error}", { error: rootErr }))}</p>`;
    return `${head}<div class="mu-grid">${Array.from({ length: 6 }, () => `<div class="mu-item mu-skel"><span class="cover"></span><b></b></div>`).join("")}</div>`;
  }
  if (!srcs.some((s) => s.media_content_id === mAcc)) {
    mAcc = srcs[0].media_content_id;
    browse = [];
  }
  const src = srcs.find((s) => s.media_content_id === mAcc);
  const members = ctx.members();
  const who = (title) => members.find((m) => new RegExp(`(^|[^\\p{L}])${m.name}s?([^\\p{L}]|$)`, "iu").test(title || ""));
  const seg = srcs.length > 1
    ? `<div class="seg mu-acc">${srcs
        .map((s, i) => {
          const m = who(s.title);
          return `<button data-act="mu-acc" data-id="${i}" aria-pressed="${s === src}">${m ? ctx.avatar(m.id, "sm") : ""}${esc(m ? m.name : s.title)}</button>`;
        })
        .join("")}</div>`
    : "";
  const at = browse.length ? browse[browse.length - 1] : src.root ? null : { id: src.media_content_id, type: src.media_content_type, title: src.title };
  const res = browseLoad(ctx, lead, at);
  const err = ctx.cache[browseKey(lead, at)]?.error;
  const crumbs = browse.length
    ? `<div class="mu-crumbs"><button class="iconbtn" data-act="mu-up" aria-label="${esc(ctx.t("Tilbage"))}">${svg("back")}</button>${[src.title, ...browse.map((b) => b.title)]
        .map((t, i) => `<button class="mu-crumb" data-act="mu-crumb" data-id="${i}">${esc(t)}</button>`)
        .join(`<span aria-hidden="true">›</span>`)}</div>`
    : "";
  const label = (browse.length ? browse[browse.length - 1].title : src.title) || "";
  const search = `<label class="mu-search">${svg("search")}<input id="mu-q" data-in="mu-query" placeholder="${esc(ctx.t("Søg i {name}", { name: label.toLowerCase() }))}" autocomplete="off"></label>`;
  let body;
  if (!res && !err) body = `<div class="mu-grid">${Array.from({ length: 6 }, () => `<div class="mu-item mu-skel"><span class="cover"></span><b></b></div>`).join("")}</div>`;
  else if (err && !res) body = `<p class="t-sub">${esc(ctx.t("Kunne ikke hente biblioteket: {error}", { error: err }))}</p>`;
  else {
    const kids = (res.children || []).slice(0, 200);
    body = kids.length
      ? `<div class="mu-grid" id="mu-br" data-none="${esc(ctx.t("Intet fundet."))}">${kids
          .map((c, i) => {
            const thumb = c.thumbnail ? `<img class="cover" src="${esc(thumbUrl(ctx, c.thumbnail))}" alt="" loading="lazy">` : cover(String(mAcc) + (c.title || i), (c.title || "").length < 14 && !c.can_expand ? c.title : "");
            return `<button class="mu-item" data-act="mu-item" data-id="${i}" data-title="${esc((c.title || "").toLowerCase())}" style="animation-delay:${Math.min(i, 20) * 25}ms">${thumb}<b>${esc(c.title || "")}</b><small>${esc(mediaClass(ctx, c))}</small>${c.can_play ? `<span class="mu-pi">${svg("play")}</span>` : ""}</button>`;
          })
          .join("")}</div>`
      : `<p class="t-sub">${esc(ctx.t("Intet fundet."))}</p>`;
  }
  return `${head}${seg}${crumbs}${search}${body}<p class="t-sub" style="margin-top:12px">${esc(ctx.t("Fra {entity}.", { entity: lead }))}</p>`;
}

function mediaClass(ctx, c) {
  const k = c.media_class || c.children_media_class || "";
  return ctx.t({ playlist: "Playliste", album: "Album", artist: "Kunstner", track: "Nummer", music: "Musik", podcast: "Podcast", channel: "Direkte", directory: "Mappe", genre: "Genre", app: "App", episode: "Afsnit", movie: "Film", tv_show: "Serie", video: "Video" }[k] || "");
}

function browseItem(ctx, i) {
  const list = players(ctx);
  const l = leaderOf(ctx, pickZone(ctx, list));
  const srcs = sources(ctx, l) || [];
  const src = srcs.find((s) => s.media_content_id === mAcc);
  const at = browse.length ? browse[browse.length - 1] : !src || src.root ? null : { id: src.media_content_id, type: src.media_content_type };
  const res = ctx.cache[browseKey(l, at)]?.value;
  return { lead: l, item: res?.children?.[+i] };
}

// ------------------------------------------------------------------ Klang: the speaker's own settings (bass, treble, loudness, night sound, speech …)
function settingsOf(ctx, id) {
  const ent = ctx.hass.entities?.[id];
  if (!ent?.device_id) return [];
  return Object.values(ctx.hass.entities)
    .filter((e) => e.device_id === ent.device_id && e.entity_id !== id && !e.hidden && /^(number|switch|select)\./.test(e.entity_id) && ctx.hass.states[e.entity_id])
    .map((e) => e.entity_id)
    .slice(0, 14);
}

function shortName(ctx, id, owner) {
  const n = ctx.name(id), base = ctx.name(owner);
  const s = n.toLowerCase().startsWith(base.toLowerCase()) ? n.slice(base.length).trim() : n;
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : n;
}
const signed = (v) => `${+v > 0 ? "+" : ""}${v}`;

function gearSheet(ctx, id) {
  const all = settingsOf(ctx, id);
  const nums = all.filter((e) => e.startsWith("number."));
  const sws = all.filter((e) => e.startsWith("switch."));
  const sels = all.filter((e) => e.startsWith("select."));
  const sliders = nums
    .map((e) => {
      const s = ctx.hass.states[e], a = s.attributes;
      return `<label class="mu-eqf"><span>${esc(shortName(ctx, e, id))}</span><input type="range" min="${a.min ?? 0}" max="${a.max ?? 100}" step="${a.step ?? 1}" value="${esc(s.state)}" data-in="mu-num" data-id="${esc(e)}"><b class="num">${esc(signed(s.state))}</b></label>`;
    })
    .join("");
  const toggles = sws
    .map((e) => {
      const nm = esc(shortName(ctx, e, id));
      return `<span>${nm}</span><button class="toggle" data-act="mu-sw" data-id="${esc(e)}" aria-pressed="${ctx.hass.states[e].state === "on"}" aria-label="${nm}"></button>`;
    })
    .join("");
  const selects = sels
    .map((e) => {
      const s = ctx.hass.states[e];
      return `<label class="mu-swr"><span>${esc(shortName(ctx, e, id))}</span><select data-in="mu-sel" data-id="${esc(e)}">${(s.attributes.options || []).map((o) => `<option${o === s.state ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
    })
    .join("");
  ctx.sheet(`<div class="eyebrow">${esc(id)}</div><h2>${esc(ctx.t("Klang · {name}", { name: ctx.name(id) }))}</h2>
    ${sliders ? `<div class="mu-eqs">${sliders}</div>` : ""}
    ${toggles ? `<div class="mods" style="grid-template-columns:minmax(0,1fr) 64px;margin-top:12px">${toggles}</div>` : ""}
    ${selects}
    <p class="t-sub" style="margin-top:10px">${esc(ctx.t("Indstillingerne sendes direkte til {name}.", { name: ctx.name(id) }))}</p>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
}

// The prototype's muPick: a list of speakers to choose from.
function muPick(ctx, title, ids, cb) {
  const s = ctx.sheet(`<h2>${esc(title)}</h2><div class="mu-pickl">${ids
    .map((id) => {
      const st = ctx.hass.states[id], act = ACTIVE.has(st?.state);
      const small = act ? ctx.t(st.state === "playing" ? "Spiller: {title}" : "På pause: {title}", { title: st.attributes.media_title || "" }) : stateText(ctx, st);
      return `<button data-pick="${esc(id)}">${spkIcon(kindOf(ctx, id))}<span><b>${esc(ctx.name(id))}</b><small>${esc(small)}</small></span></button>`;
    })
    .join("")}</div><div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
  s.el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (b) {
      s.close();
      cb(b.dataset.pick);
    }
  });
}

function pickSheet(ctx, title, options, current, onPick) {
  const s = ctx.sheet(`<h2>${esc(title)}</h2><div class="mu-pickl">${options
    .map((o, i) => `<button data-pick="${i}" aria-pressed="${o === current}">${svg(o === current ? "check" : "music")}<span><b>${esc(o)}</b></span></button>`)
    .join("")}</div><div class="sheet-actions"><button class="btn soft" data-close>${esc(ctx.t("Luk"))}</button></div>`);
  s.el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (b) {
      s.close();
      onPick(options[+b.dataset.pick]);
    }
  });
}

// ------------------------------------------------------------------ actions
const cur = (ctx) => pickZone(ctx, players(ctx));
const lead = (ctx) => leaderOf(ctx, cur(ctx));
const mp = (ctx, service, data) => ctx.call("media_player", service, data);
const join = (ctx, leader, ids) => (ids.length ? mp(ctx, "join", { entity_id: leader, group_members: ids }) : Promise.resolve(true));
const setZone = (id) => {
  zone = id;
  try {
    localStorage.setItem(LS_ZONE, zone);
  } catch (err) {
    /* private mode */
  }
};
const playItem = async (ctx, l, item) => {
  if (!item) return false;
  const ok = await mp(ctx, "play_media", { entity_id: l, media_content_id: item.media_content_id, media_content_type: item.media_content_type });
  if (ok) ctx.toast(ctx.t("Spiller {title} i {name}", { title: item.title, name: zoneName(ctx, groupOf(ctx, l)) }));
  return ok;
};

const acts = {
  "mu-zone": (el, e, ctx) => {
    setZone(el.dataset.id);
    browse = [];
    focus = null;
    if (ctx.host.clientWidth < 900) tab = "spiller";
    ctx.render();
  },
  "mu-tab": (el, e, ctx) => {
    tab = el.dataset.id;
    ctx.render();
  },
  "mu-play": (el, e, ctx) => mp(ctx, "media_play_pause", { entity_id: lead(ctx) }),
  "mu-stop": (el, e, ctx) => mp(ctx, "media_stop", { entity_id: lead(ctx) }),
  "mu-next": (el, e, ctx) => {
    if (!Number(ctx.hass.states[lead(ctx)]?.attributes?.media_duration) && !has(ctx.hass.states[lead(ctx)], F.NEXT)) return ctx.toast(ctx.t("Radioen har ikke et næste nummer"));
    return mp(ctx, "media_next_track", { entity_id: lead(ctx) });
  },
  "mu-prev": (el, e, ctx) => mp(ctx, "media_previous_track", { entity_id: lead(ctx) }),
  "mu-shuffle": (el, e, ctx) => mp(ctx, "shuffle_set", { entity_id: lead(ctx), shuffle: !ctx.hass.states[lead(ctx)]?.attributes?.shuffle }),
  "mu-repeat": (el, e, ctx) => {
    const r = ctx.hass.states[lead(ctx)]?.attributes?.repeat || "off";
    return mp(ctx, "repeat_set", { entity_id: lead(ctx), repeat: { off: "all", all: "one", one: "off" }[r] || "off" });
  },
  "mu-spk": async (el, e, ctx) => {
    const id = el.dataset.id, l = leaderOf(ctx, id), pl = ctx.hass.states[l]?.state === "playing";
    if (await mp(ctx, "media_play_pause", { entity_id: l })) ctx.toast(`${zoneName(ctx, groupOf(ctx, l))}: ${pl ? ctx.t("på pause") : ctx.t("spiller")}`);
  },
  "mu-poweron": (el, e, ctx) => mp(ctx, "turn_on", { entity_id: el.dataset.id }),
  "mu-mute": (el, e, ctx) => {
    const id = el.dataset.id;
    return mp(ctx, "volume_mute", { entity_id: id, is_volume_muted: !ctx.hass.states[id]?.attributes?.is_volume_muted });
  },
  "mu-unjoin": async (el, e, ctx) => {
    const id = el.dataset.id;
    if (groupOf(ctx, id).length < 2) return ctx.toast(ctx.t("Der skal være mindst én højttaler"));
    if (id === zone) setZone(groupOf(ctx, id).find((x) => x !== id) || id);
    if (await mp(ctx, "unjoin", { entity_id: id })) ctx.toast(ctx.t("{name} er taget ud af gruppen", { name: ctx.name(id) }));
  },
  "mu-link": async (el, e, ctx) => {
    const id = el.dataset.id, c = cur(ctx), g = groupOf(ctx, c);
    if (g.includes(id)) {
      if (await mp(ctx, "unjoin", { entity_id: id })) ctx.toast(ctx.t("{name} er taget ud af gruppen", { name: ctx.name(id) }));
    } else if (await join(ctx, g[0], [id])) {
      focus = id;
      ctx.toast(ctx.t("{name} spiller nu med", { name: ctx.name(id) }));
    }
  },
  "mu-joinzone": async (el, e, ctx) => {
    const target = el.dataset.id, me = cur(ctx);
    if (await join(ctx, leaderOf(ctx, target), [me])) ctx.toast(ctx.t("{name} spiller nu med {other}", { name: ctx.name(me), other: zoneName(ctx, groupOf(ctx, target)) }));
  },
  "mu-all": async (el, e, ctx) => {
    const g = groupOf(ctx, cur(ctx)), ids = players(ctx).filter((id) => !g.includes(id) && has(ctx.hass.states[id], F.GROUPING));
    if (await join(ctx, g[0], ids)) ctx.toast(ctx.t("Hele huset spiller {title}", { title: ctx.hass.states[g[0]]?.attributes?.media_title || ctx.t("sammen") }));
  },
  "mu-area": async (el, e, ctx) => {
    const area = el.dataset.id, c = cur(ctx), g = groupOf(ctx, c);
    const ids = players(ctx).filter((id) => ctx.area(id) === area && has(ctx.hass.states[id], F.GROUPING));
    const leader = ids.includes(g[0]) ? g[0] : ids.includes(c) ? c : ids[0];
    for (const id of g) if (!ids.includes(id) && id !== leader) await mp(ctx, "unjoin", { entity_id: id });
    await join(ctx, leader, ids.filter((id) => id !== leader && !g.includes(id)));
    setZone(leader);
    ctx.toast(ctx.t("{area} spiller {title}", { area: ctx.hass.areas?.[area]?.name || area, title: ctx.hass.states[leader]?.attributes?.media_title || ctx.t("sammen") }));
  },
  "mu-queue": (el, e, ctx) => {
    mQueue = !mQueue;
    if (mQueue) ctx.drop(`mu-q:${lead(ctx)}`);
    ctx.render();
  },
  "mu-qplay": async (el, e, ctx) => {
    if (await ctx.call("sonos", "play_queue", { entity_id: lead(ctx), queue_position: +el.dataset.id })) ctx.drop(`mu-q:${lead(ctx)}`);
  },
  "mu-qdel": async (el, e, ctx) => {
    if (await ctx.call("sonos", "remove_from_queue", { entity_id: lead(ctx), queue_position: +el.dataset.id })) {
      ctx.drop(`mu-q:${lead(ctx)}`);
      ctx.render();
    }
  },
  "mu-qup": () => {},
  "mu-sleep": async (el, e, ctx) => {
    const l = lead(ctx), left = sleepLeft(l);
    const next = left ? { 15: 30, 30: 60 }[[15, 30, 60].find((m) => left <= m)] || 0 : 15;
    const ok = next ? await ctx.call("sonos", "set_sleep_timer", { entity_id: l, sleep_time: next * 60 }) : await ctx.call("sonos", "clear_sleep_timer", { entity_id: l });
    if (!ok) return;
    if (next) sleepUntil[l] = Date.now() + next * 60000;
    else delete sleepUntil[l];
    ctx.render();
    ctx.toast(next ? ctx.t("Musikken slukker om {n} min", { n: next }) : ctx.t("Sove-timeren er slået fra"));
  },
  "mu-xfer": (el, e, ctx) => {
    const l = lead(ctx), g = groupOf(ctx, l), title = ctx.hass.states[l]?.attributes?.media_title || ctx.t("Musikken");
    const ma = queueKind(ctx, l) === "music_assistant";
    const ids = players(ctx).filter((id) => !g.includes(id) && (ma ? ctx.platform(id) === "music_assistant" : has(ctx.hass.states[id], F.GROUPING)));
    if (!ids.length) return ctx.toast(ctx.t("Der er ingen andre højttalere at flytte til"));
    muPick(ctx, ctx.t("Flyt musikken til"), ids, async (id) => {
      let ok;
      if (ma) ok = await ctx.call("music_assistant", "transfer_queue", { entity_id: id, source_player: l });
      else {
        ok = await join(ctx, l, [id]);
        if (ok) for (const m of g) await mp(ctx, "unjoin", { entity_id: m });
      }
      if (!ok) return;
      setZone(id);
      ctx.toast(ctx.t("{title} spiller nu i {name}", { title, name: ctx.name(id) }));
    });
  },
  "mu-group": (el, e, ctx) => {
    tab = "hojt";
    ctx.render();
    ctx.$("mu-spk")?.scrollIntoView({ behavior: "smooth", block: "start" });
  },
  "mu-quick": (el, e, ctx) => playItem(ctx, lead(ctx), quick[+el.dataset.id]),
  "mu-source": (el, e, ctx) => {
    const id = lead(ctx), a = ctx.hass.states[id]?.attributes || {};
    pickSheet(ctx, ctx.t("Vælg kilde"), a.source_list || [], a.source, (src) => mp(ctx, "select_source", { entity_id: id, source: src }));
  },
  "mu-gear": (el, e, ctx) => gearSheet(ctx, el.dataset.id),
  "mu-sw": async (el, e, ctx) => {
    const on = el.getAttribute("aria-pressed") === "true";
    el.setAttribute("aria-pressed", String(!on));
    if (!(await ctx.call("switch", on ? "turn_off" : "turn_on", { entity_id: el.dataset.id }))) el.setAttribute("aria-pressed", String(on));
  },
  "mu-acc": (el, e, ctx) => {
    const srcs = sources(ctx, lead(ctx)) || [];
    mAcc = srcs[+el.dataset.id]?.media_content_id ?? mAcc;
    browse = [];
    ctx.render();
  },
  "mu-item": async (el, e, ctx) => {
    const { lead: l, item } = browseItem(ctx, el.dataset.id);
    if (!item) return;
    if (!item.can_play && item.can_expand) {
      browse.push({ id: item.media_content_id, type: item.media_content_type, title: item.title });
      return ctx.render();
    }
    if (await playItem(ctx, l, item)) {
      tab = "spiller";
      ctx.render();
      ctx.host.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  },
  "mu-up": (el, e, ctx) => {
    browse.pop();
    ctx.render();
  },
  "mu-crumb": (el, e, ctx) => {
    browse = browse.slice(0, +el.dataset.id);
    ctx.render();
  },
};

// Sliders: the number moves while you drag, Home Assistant is told when you let go.
const inputs = {
  "mu-vol": (el, e, ctx) => {
    const v = +el.value;
    ctx.qa(`[data-in="mu-vol"][data-id="${CSS.escape(el.dataset.id)}"]`).forEach((r) => {
      if (r !== el) r.value = v;
      const b = r.nextElementSibling;
      if (b) b.textContent = v;
    });
    if (e.type === "change") mp(ctx, "volume_set", { entity_id: el.dataset.id, volume_level: v / 100 });
  },
  "mu-gvol": (el, e, ctx) => {
    const g = groupOf(ctx, cur(ctx)), target = +el.value;
    const vols = g.map((id) => (ctx.hass.states[id]?.attributes?.volume_level ?? 0) * 100);
    const avg = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);
    const next = vols.map((v) => Math.max(0, Math.min(100, Math.round(avg < 1 ? target : (v * target) / avg))));
    const b = ctx.$("mu-mv");
    if (b) b.textContent = target;
    g.forEach((id, i) =>
      ctx.qa(`[data-in="mu-vol"][data-id="${CSS.escape(id)}"]`).forEach((r) => {
        r.value = next[i];
        if (r.nextElementSibling) r.nextElementSibling.textContent = next[i];
      })
    );
    if (e.type === "change") g.forEach((id, i) => mp(ctx, "volume_set", { entity_id: id, volume_level: next[i] / 100 }));
  },
  "mu-seek": (el, e, ctx) => {
    const p = ctx.$("mu-pos");
    if (p) p.textContent = mmss(+el.value);
    if (e.type === "change") mp(ctx, "media_seek", { entity_id: lead(ctx), seek_position: +el.value });
  },
  "mu-num": (el, e, ctx) => {
    if (el.nextElementSibling) el.nextElementSibling.textContent = signed(el.value);
    if (e.type === "change") ctx.call("number", "set_value", { entity_id: el.dataset.id, value: +el.value });
  },
  "mu-sel": (el, e, ctx) => {
    if (e.type === "change") ctx.call("select", "select_option", { entity_id: el.dataset.id, option: el.value });
  },
  "mu-query": (el) => {
    const q = el.value.trim().toLowerCase();
    let n = 0;
    el.closest(".mu-pb")?.querySelectorAll(".mu-item").forEach((it) => {
      it.hidden = !!q && !it.dataset.title?.includes(q);
      if (!it.hidden) n++;
    });
    const grid = el.closest(".mu-pb")?.querySelector(".mu-grid");
    if (grid) grid.dataset.empty = n ? "" : "1";
  },
};

function init(ctx) {
  // Move the progress bar every second without re-rendering the page; refresh the sleep timer's minutes.
  setInterval(() => {
    if (ctx.view !== "musik" || !ctx.hass) return;
    const r = ctx.$("mu-range"), p = ctx.$("mu-pos");
    if (!r || !p) return;
    const s = ctx.hass.states[lead(ctx)];
    if (s?.state !== "playing") return;
    const pos = position(s);
    if (ctx.root.activeElement !== r) r.value = Math.round(pos);
    p.textContent = mmss(pos);
  }, 1000);
  setInterval(() => {
    if (ctx.view === "musik" && ctx.hass && Object.keys(sleepUntil).length) ctx.render();
  }, 60000);
}

const css = `
.mu-hero { isolation: isolate; }
.mu-cover img.cover { width: 100%; height: 100%; object-fit: cover; display: block; }
.mu-z img.cover { width: 42px; height: 42px; border-radius: 12px; flex: none; object-fit: cover; }
.mu-q img.cover { width: 100%; aspect-ratio: 1; border-radius: 12px; display: block; object-fit: cover; }
.mu-item[hidden] { display: none; }
.mu-item img.cover { width: 100%; aspect-ratio: 1; border-radius: 14px; display: block; object-fit: cover; box-shadow: 0 6px 16px rgba(0,0,0,.12); transition: transform .2s; background: var(--surface-2); }
@media (hover: hover) { .mu-item:hover img.cover { transform: translateY(-3px); } }
.mu-item b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mu-grid[data-empty="1"]::after { content: attr(data-none); color: var(--muted); }
.mu-skel .cover { display: block; width: 100%; aspect-ratio: 1; border-radius: 14px; background: linear-gradient(90deg, var(--surface-2), var(--line), var(--surface-2)); background-size: 200% 100%; animation: muskel 1.2s linear infinite; }
.mu-skel b { display: block; height: 10px; width: 70%; margin-top: 8px; border-radius: 5px; background: var(--surface-2); }
@keyframes muskel { to { background-position: -200% 0; } }
.mu-crumbs { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin: 0 0 10px; color: var(--muted); font-size: 13px; }
.mu-crumb { border: 0; background: none; color: var(--violet); font-weight: 700; padding: 2px 4px; border-radius: 6px; cursor: pointer; }
.mu-crumb:last-child { color: var(--ink); }
.mu-swr { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line); font-weight: 700; font-size: 14px; }
.mu-swr select { border: 1.5px solid var(--line); border-radius: 10px; padding: 6px 8px; background: var(--surface); color: var(--ink); font: inherit; }
.mu-spk.mu-off { opacity: .55; }
.mu-hero.idle .mu-tool.on { background: #fff; color: #1B1530; }
.mu-pickl button[aria-pressed="true"] { border-color: var(--violet); }
.mu-acc .av.sm { width: 20px; height: 20px; font-size: 10px; flex: none; }
`;
const en = {
  Musik: "Music",
  "{name} direkte": "{name} live",
  Radio: "Radio",
  "Direkte radio": "Live radio",
  Kø: "Queue",
  "Slukker om {n} min": "Off in {n} min",
  "Sove-timer": "Sleep timer",
  Flyt: "Move",
  "Vælg noget i Udforsk, eller lad {name} spille med en anden højttaler.": "Pick something in Browse, or let {name} play along with another speaker.",
  "Start musikken i jeres app, eller lad {name} spille med en anden højttaler.": "Start the music in your app, or let {name} play along with another speaker.",
  "Næste i køen": "Up next",
  "Henter køen …": "Loading the queue …",
  "Spil {title} nu": "Play {title} now",
  "Flyt op": "Move up",
  "Fjern fra køen": "Remove from the queue",
  "Radio har ikke en kø.": "Radio has no queue.",
  "Køen er tom.": "The queue is empty.",
  "Hele huset": "Whole house",
  "Tag ud af gruppen": "Remove from the group",
  "Spiller: {title}": "Playing: {title}",
  "På pause: {title}": "Paused: {title}",
  "Søg i {name}": "Search {name}",
  "Intet fundet.": "Nothing found.",
  "Fra {entity}.": "From {entity}.",
  "Indstillingerne sendes direkte til {name}.": "The settings go straight to {name}.",
  "Radioen har ikke et næste nummer": "The radio has no next track",
  "på pause": "paused",
  spiller: "playing",
  "Der skal være mindst én højttaler": "There has to be at least one speaker",
  "Hele huset spiller {title}": "The whole house is playing {title}",
  sammen: "together",
  "{area} spiller {title}": "{area} is playing {title}",
  "Musikken slukker om {n} min": "The music stops in {n} min",
  "Sove-timeren er slået fra": "The sleep timer is off",
  Musikken: "The music",
  "Der er ingen andre højttalere at flytte til": "There are no other speakers to move to",
  "Flyt musikken til": "Move the music to",
  "{title} spiller nu i {name}": "{title} is now playing in {name}",
  "Ingen højttalere endnu": "No speakers yet",
  "Når I har medieafspillere i Home Assistant, kan I styre dem her. Vælg hvilke under Familieindstillinger.": "When you have media players in Home Assistant, you can control them here. Choose which in Family settings.",
  "Vælg afspillere": "Choose players",
  "Vælg afspiller": "Choose player",
  "Ikke forbundet": "Not connected",
  Spiller: "Playing",
  "På pause · {title}": "Paused · {title}",
  "Henter …": "Loading …",
  Slukket: "Off",
  Standby: "Standby",
  Ledig: "Idle",
  "Slå lyd til i {name}": "Unmute {name}",
  "Slå lyd fra i {name}": "Mute {name}",
  "Lydstyrke {name}": "Volume {name}",
  "Tag {name} ud af gruppen": "Remove {name} from the group",
  "Lydstyrke for hele gruppen": "Volume for the whole group",
  Alle: "All",
  Kilde: "Source",
  Lydtilstand: "Sound mode",
  Udforsk: "Browse",
  Gruppér: "Group",
  Klang: "Sound",
  Sluk: "Turn off",
  Bland: "Shuffle",
  Forrige: "Previous",
  Pause: "Pause",
  Afspil: "Play",
  Stop: "Stop",
  Næste: "Next",
  "{_}Gentag": "{_}Repeat",
  Position: "Position",
  Direkte: "Live",
  Tænd: "Turn on",
  "Find noget at spille": "Find something to play",
  "Vælg kilde": "Choose source",
  "{name} svarer ikke": "{name} isn't responding",
  "{name} er slukket": "{name} is off",
  "{name} er ledig": "{name} is free",
  "Start noget, eller lad {name} spille med en anden højttaler.": "Start something, or let {name} play along with another speaker.",
  "Find noget at spille, eller vælg en anden højttaler.": "Find something to play, or choose another speaker.",
  "Spil med {name}": "Play with {name}",
  "Spil overalt": "Play everywhere",
  "Kun {name}": "Only {name}",
  "Pause i {name}": "Pause in {name}",
  "Afspil i {name}": "Play in {name}",
  "Tænd {name}": "Turn on {name}",
  "Lad {name} spille med": "Let {name} play along",
  Valgt: "Selected",
  "Klang for {name}": "Sound settings for {name}",
  "{n} sammen": "{n} together",
  "Slå lyd til": "Unmute",
  "Slå lyd fra": "Mute",
  "Vælg {name}": "Choose {name}",
  Afspiller: "Player",
  Højttalere: "Speakers",
  "Vælg hvilke": "Choose which",
  "{name} kan ikke gennemse musik i Home Assistant. Vælg en anden højttaler, eller start musikken i jeres app.": "{name} can't browse music in Home Assistant. Choose another speaker, or start the music in your app.",
  Tilbage: "Back",
  Bibliotek: "Library",
  "Kunne ikke hente biblioteket: {error}": "Couldn't load the library: {error}",
  "Afspil {title}": "Play {title}",
  "Her er tomt.": "Nothing here.",
  "Søg her": "Search here",
  "Spiller i {name}": "Playing in {name}",
  Playliste: "Playlist",
  Album: "Album",
  Kunstner: "Artist",
  Nummer: "Track",
  Podcast: "Podcast",
  Kanal: "Channel",
  Mappe: "Folder",
  Genre: "Genre",
  App: "App",
  Afsnit: "Episode",
  Film: "Movie",
  Serie: "Series",
  Video: "Video",
  "Klang · {name}": "Sound · {name}",
  Luk: "Close",
  "{name} er taget ud af gruppen": "{name} has left the group",
  "{name} spiller nu med": "{name} is now playing along",
  "{name} spiller nu med {other}": "{name} is now playing with {other}",
  "Musikken spiller nu overalt": "The music is now playing everywhere",
  "Kun {name} spiller nu": "Only {name} is playing now",
  "{area} spiller sammen": "{area} is playing together",
  "Spiller {title} i {name}": "Playing {title} in {name}",
};

export default {
  id: "music",
  views: {
    musik: { module: "music", render, title: (ctx) => ctx.t("Musik") },
  },
  acts,
  inputs,
  init,
  css,
  en,
};
