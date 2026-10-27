/* Hverdagsro – more ways to play in the world:
   - the pocket: take characters and things with you from place to place (role play),
   - secrets: hidden stickers and secret rooms to find, all over the world,
   - the post office: a free gift every Friday (to Sunday),
   - the hair salon chair, cooking at the café stove, and the party music player,
   - season decorations in the town around Halloween, Christmas and the other occasions.
   hv-play hands over what it knows of the game through init(api). Everything the child does is saved in the playroom. */
import { esc } from "./hv-core.js";
import * as Sound from "./hv-sound.js";
import { BG, addWorld } from "./hv-world.js";
import { OL } from "./hv-playcat.js";

let A = null; // { st, R, CAT, save, redraw, say, floatIcons, confetti, coinPop, goTo, presenceKey, spaceId, placeOf, owned, unlock, packs, seasonPacks, HAIRS, HAIRC, weekKey, W, H, FLOOR }
export function init(api) {
  A = api;
}
const { W, FLOOR, T3, rect, out, rep, skyDef, ground } = BG;

/* ------------------------------------------------------------------ the pocket */
const POCKET = [948, 62], MAX_POCKET = 8;
export const pocketHit = (x, y) => Math.hypot(x - POCKET[0], y - POCKET[1]) < 80;
export function pocketSvg(ctx) {
  const st = A.st(), n = (st.d.pocket || []).length;
  return `<g class="pl-pocket${st.pocketOpen ? " open" : ""}" data-pl="pocket" role="button" aria-label="${esc(ctx.t("Lommen"))}" transform="translate(${POCKET[0]} ${POCKET[1]})"><circle r="40" fill="#fff" stroke="${OL}" stroke-width="4" opacity=".92"/><path d="M-26 -14 h52 l-6 40 h-40z" fill="#C98B55" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M-16 -14 q16 -26 32 0" fill="none" stroke="${OL}" stroke-width="4"/>${n ? `<circle cx="30" cy="-30" r="15" fill="#E5484D" stroke="#fff" stroke-width="3"/><text x="30" y="-24" text-anchor="middle" class="pl-pocketn">${n}</text>` : ""}</g>`;
}
/* Put a character or a thing in the pocket (dragged onto it). */
export function toPocket(ctx, kind, id) {
  const st = A.st(), room = A.R();
  if (room.ro) return false;
  const list = (st.d.pocket ||= []);
  if (list.length >= MAX_POCKET) {
    ctx.toast(ctx.t("Lommen er fuld"));
    return false;
  }
  if (kind === "npc") {
    if (String(id).startsWith("fam:")) return false;
    delete room.npc?.[id];
    (st.d.moved ||= {})[id] = "pocket";
    list.push({ t: "npc", id });
  } else {
    const it = room.items.find((x) => x.id === id);
    if (!it) return false;
    room.items = room.items.filter((x) => x !== it);
    list.push({ t: "item", it: { ...it } });
    st.sel = null;
  }
  Sound.sfx("pop");
  A.save(ctx);
  A.redraw(ctx);
  return true;
}
/* The pocket opened: what is in it, to take out here. */
export function pocketBar(ctx, draw) {
  const st = A.st();
  if (!st.pocketOpen) return "";
  const list = st.d.pocket || [];
  return `<div class="pl-pocketbar"><b>👜 ${esc(ctx.t("Lommen"))}</b>${list.length ? list.map((p, i) => `<button data-pl="unpocket" data-k="${i}" aria-label="${esc(ctx.t("Tag frem"))}"><svg viewBox="-130 -330 260 340">${draw(p)}</svg></button>`).join("") : `<span class="t-sub">${esc(ctx.t("Træk en figur eller en ting (i Byg) hen på tasken for at tage den med."))}</span>`}</div>`;
}
export function fromPocket(ctx, i) {
  const st = A.st(), room = A.R(), list = st.d.pocket || [], p = list[i];
  if (!p || room.ro) return;
  list.splice(i, 1);
  const x = 380 + Math.round(Math.random() * 240);
  if (p.t === "npc") {
    (room.npc ||= {})[p.id] = [x, 590];
    st.d.moved[p.id] = A.spaceId();
  } else room.items.push({ ...p.it, x, y: p.it.y < FLOOR ? p.it.y : 580 });
  Sound.sfx("whoosh");
  A.save(ctx);
  A.redraw(ctx);
}

/* ------------------------------------------------------------------ secrets */
/* [id, place, x, y, sticker, name, secret room it opens] */
export const SECRETS = [
  ["s-seng", "vaerelse", 210, 600, "🧦", "En gammel sok under sengen"],
  ["s-have", "have", 940, 600, "🐞", "En mariehøne i græsset"],
  ["s-station", "redning-station", 60, 420, "🦴", "Hundenes gemte kødben"],
  ["s-havn", "redning-havn", 420, 560, "🧜", "En dør under molen", "hem-grotte"],
  ["s-lysning", "skov-lysning", 180, 440, "🍄", "En lille dør i svampehuset", "hem-svamp"],
  ["s-gaard", "skov-gaard", 660, 300, "🥚", "Et gyldent æg i høet"],
  ["s-studie", "pop-studie", 960, 220, "🎧", "Et par glemte høretelefoner"],
  ["s-scene", "pop-scene", 70, 160, "🎟️", "En backstage-billet"],
  ["s-bageri", "slik-bageri", 760, 360, "🍪", "Den hemmelige småkageopskrift"],
  ["s-slik", "slik-butik", 60, 600, "🍬", "En gylden slikkepind"],
  ["s-park", "park-plads", 120, 300, "🎈", "En ballon i træet"],
  ["s-vand", "park-vand", 940, 380, "🐚", "En perle i en musling"],
  ["s-lab", "tekno-lab", 120, 400, "🔋", "Et lysende batteri"],
  ["s-tag", "tekno-tag", 960, 200, "🛰️", "En lille satellit"],
  ["s-gade", "nat-gade", 380, 120, "⭐", "Et stjerneskud"],
  ["s-hule", "nat-hule", 900, 300, "💎", "En lem i hulens væg", "hem-skat"],
  ["s-cafe", "by-cafe", 60, 600, "🥐", "Et halvspist croissant"],
  ["s-frisor", "by-frisor", 960, 300, "🎀", "En glemt hårsløjfe"],
  ["s-post", "by-post", 40, 300, "✉️", "Et brev uden afsender"],
  ["s-lejlighed", "by-lejlighed", 520, 120, "🪜", "En lem til loftet", "hem-loft"],
  ["s-tagterrasse", "by-tag", 60, 200, "🕊️", "En due med en besked"],
  ["s-kolbotte", "by-park", 680, 520, "🛹", "Et gyldent skateboard"],
  ["s-torv", "by-torv", 500, 540, "🪙", "En mønt i springvandet"],
  ["s-camping", "by-camping", 860, 520, "🐟", "En fisk i søen"],
  ["s-hospital", "by-hospital", 520, 200, "🩹", "Et plaster med hjerter"],
  ["s-indkob", "by-indkob", 960, 120, "🧸", "En bamse bag skiltet"],
  ["s-uni", "by-uni", 360, 260, "📜", "En dør bag tavlen", "hem-bibliotek"],
  ["s-villa", "by-villa", 560, 620, "🦆", "En badeand i poolen"],
  ["s-familiehus", "by-familiehus", 960, 440, "🧩", "Den sidste puslespilsbrik"],
  ["s-grotte", "hem-grotte", 820, 560, "👑", "Havfruens krone"],
  ["s-svamp", "hem-svamp", 160, 560, "🧚", "En lille fe"],
  ["s-skat", "hem-skat", 500, 600, "🏆", "Den gyldne pokal"],
  ["s-loft", "hem-loft", 820, 540, "📦", "En kasse med gamle billeder"],
  ["s-bibliotek", "hem-bibliotek", 200, 300, "🔮", "En lysende kugle"],
];
/* The secret rooms: places that are on no map. */
const secretBg = {
  grotte: () => `${rect(0, 0, W, 700, "#0B4F6C")}${rep(9, (i) => `<circle cx="${i * 120 + 40}" cy="${80 + (i % 3) * 60}" r="${8 + (i % 4) * 4}" fill="#9BE7FF" opacity=".35"/>`)}<path d="M0 0 H${W} V90 Q800 170 600 100 T200 120 T0 80Z" fill="#073B52" ${out()}/>${ground("#E9D6A8")}${rep(6, (i) => `<path d="M${i * 180 + 60} ${FLOOR} q-20 -80 0 -150 q20 70 0 150" fill="#3FA796" ${out(T3)}/>`)}`,
  svamp: () => `${rect(0, 0, W, 700, "#2E5E3A")}${rep(7, (i) => `<g><rect x="${i * 150 + 50}" y="${200 + (i % 2) * 60}" width="40" height="${FLOOR - 200}" fill="#FFF3D6" ${out(T3)}/><ellipse cx="${i * 150 + 70}" cy="${200 + (i % 2) * 60}" rx="70" ry="40" fill="${i % 2 ? "#E5484D" : "#FF8A3C"}" ${out()}/>${rep(3, (j) => `<circle cx="${i * 150 + 40 + j * 30}" cy="${190 + (i % 2) * 60}" r="7" fill="#fff"/>`)}</g>`)}${rep(14, (i) => `<circle cx="${(i * 71) % W}" cy="${60 + (i * 37) % 140}" r="4" fill="#FFF6A0" class="pl-twinkle"/>`)}${ground("#5A9E5F")}`,
  skat: () => `${rect(0, 0, W, 700, "#3A2E5A")}${rep(12, (i) => `<path d="M${i * 90} ${FLOOR} q45 -${60 + (i % 3) * 30} 90 0Z" fill="#E9C46A" ${out(T3)}/>`)}${rep(16, (i) => `<circle cx="${(i * 63) % W}" cy="${FLOOR - 20 - (i % 4) * 14}" r="9" fill="#FFD93D" ${out('stroke-width="2"')}/>`)}${ground("#5B4A3A")}${rep(4, (i) => `<path d="M${120 + i * 240} 60 l20 30 h-40z" fill="#9BE7FF" ${out(T3)}/>`)}`,
  loft: (s0, s1) => `${skyDef(s0, s1)}${rect(0, 0, W, FLOOR, "#C98B55")}<path d="M0 0 L${W / 2} -120 L${W} 0 V60 L${W / 2} -60 L0 60Z" fill="#8B5A3C"/>${rep(8, (i) => `<path d="M${i * 140} 0 L${W / 2} -200" stroke="#8B5A3C" stroke-width="18"/>`)}<circle cx="500" cy="170" r="70" fill="#fff" ${out()}/><circle cx="500" cy="170" r="56" fill="url(#pl-sky)"/>${ground("#A9764C")}${rep(10, (i) => `<path d="M${i * 100} ${FLOOR} V700" stroke="#8B5A3C" stroke-width="3"/>`)}`,
  bibliotek: () => `${rect(0, 0, W, FLOOR, "#4A2D5C")}${rep(6, (i) => `${rect(20 + i * 165, 60, 150, FLOOR - 60, "#6B3F2A", 6, out())}${rep(5, (j) => `${rect(28 + i * 165, 80 + j * 70, 134, 8, "#8B5A3C")}${rep(7, (k) => rect(32 + i * 165 + k * 18, 40 + j * 70 + (k % 2) * 6, 14, 40 - (k % 2) * 6, ["#E5484D", "#4D96FF", "#FFD93D", "#6BCB77", "#F15BB5"][(i + j + k) % 5], 2))}`)}`)}${rep(8, (i) => `<g class="pl-cloud"><rect x="${80 + i * 110}" y="${30 + (i % 3) * 20}" width="34" height="24" rx="3" fill="#FFF3D6" ${out('stroke-width="2"')}/></g>`)}${ground("#6B3F2A")}`,
};
const SECRET_ROOMS = {
  "hem-grotte": { n: "Havfrue-grotten", area: "redning", em: "🧜", secret: true, bg: secretBg.grotte, decor: [["skattekiste", 500, 600], ["soestjerne", 300, 610], ["blaeksprutte", 760, 600], ["muslingeseng", 180, 560]], npcs: [] },
  "hem-svamp": { n: "Svampelandet", area: "skov", em: "🍄", secret: true, bg: secretBg.svamp, decor: [["troldedoer", 500, 470], ["lysblomst", 300, 600], ["feeloekke", 700, 610], ["oenskebroend", 880, 560]], npcs: [] },
  "hem-skat": { n: "Skatkammeret", area: "nat", em: "💎", secret: true, bg: secretBg.skat, decor: [["trone", 500, 560], ["skattekiste", 260, 610], ["skattekiste", 760, 610], ["rustning", 120, 560]], npcs: [] },
  "hem-loft": { n: "Det hemmelige loft", area: "centrum", em: "🪜", secret: true, bg: secretBg.loft, decor: [["papkasser", 220, 600], ["gyngehest", 480, 610], ["lanterne", 700, 520], ["pudebjerg", 860, 610]], npcs: [] },
  "hem-bibliotek": { n: "Det hemmelige bibliotek", area: "centrum", em: "📚", secret: true, bg: secretBg.bibliotek, decor: [["laenestol", 300, 600], ["bogstabel", 520, 610], ["krystalkugle", 720, 560], ["globus", 880, 600]], npcs: [] },
};
addWorld({ places: SECRET_ROOMS });
export const secretRooms = (st) => Object.entries(SECRET_ROOMS).filter(([id]) => SECRETS.some((s) => s[6] === id && (st.d.secrets || []).includes(s[0])));
/* The little glints where something is hidden, and the doors that were found. */
export function secretsSvg(ctx) {
  const st = A.st(), here = A.spaceId(), found = st.d.secrets || [];
  if (st.build) return "";
  return SECRETS.filter((s) => s[1] === here)
    .map(([id, , x, y, em, , room]) => {
      if (!found.includes(id)) return `<text x="${x}" y="${y}" class="pl-glint" style="animation-delay:${(id.length % 6) * -1.3}s" pointer-events="none">✨</text>`;
      return room ? `<g class="pl-secretdoor" data-pl="secret" data-k="${id}" transform="translate(${x} ${y})" role="button" aria-label="${esc(ctx.t(SECRET_ROOMS[room].n))}"><rect x="-26" y="-50" width="52" height="56" rx="12" fill="#8B5A3C" stroke="${OL}" stroke-width="4"/><circle cx="14" cy="-20" r="4" fill="#FFD93D"/><text y="-60" text-anchor="middle" font-size="26">${em}</text></g>` : "";
    })
    .join("");
}
/* A tap near a hidden secret finds it. True when the tap is used up. */
export function tapSecret(ctx, p, target) {
  const st = A.st(), here = A.spaceId();
  if (target?.closest?.("[data-pl='secret']")) {
    const s = SECRETS.find((x) => x[0] === target.closest("[data-pl='secret']").dataset.k);
    if (s?.[6]) A.goTo(ctx, s[6]);
    return true;
  }
  const s = SECRETS.find((x) => x[1] === here && !(st.d.secrets || []).includes(x[0]) && Math.hypot(p.x - x[2], p.y - x[3]) < 55);
  if (!s) return false;
  st.d.secrets = [...(st.d.secrets || []), s[0]];
  Sound.sfx("chest");
  A.confetti(ctx, s[2], s[3] - 30, "#FFD93D", true);
  A.floatIcons(ctx, s[2], s[3] - 40, [s[4], "✨"]);
  A.say(ctx, s[2], s[3] + 140, `🔍 ${ctx.t("Hemmelighed fundet: {name}!", { name: ctx.t(s[5]) })} (${st.d.secrets.length}/${SECRETS.length})`);
  A.save(ctx);
  setTimeout(() => A.redraw(ctx), 1600);
  return true;
}
export const secretCount = (st) => `${(st.d.secrets || []).length}/${SECRETS.length}`;

/* ------------------------------------------------------------------ the post office: a gift every Friday */
export const postGiftOpen = () => [5, 6, 0].includes(new Date().getDay()) && A.st().d.post !== A.weekKey();
async function postOffice(ctx, it) {
  const st = A.st();
  if (!postGiftOpen()) return A.say(ctx, it.x, it.y, `📮 ${ctx.t("Næste gave kommer på fredag!")}`);
  const owned = A.owned();
  // A season gift when an occasion is near, otherwise any small thing the child does not have yet.
  const pool = [...A.seasonPacks(), ...A.packs()].flatMap((pk) => pk.items).filter((k) => A.CAT[k] && !owned.has(k) && A.CAT[k].pack !== "start" && A.CAT[k].price <= 30);
  st.d.post = A.weekKey();
  if (!pool.length) {
    A.save(ctx);
    return A.say(ctx, it.x, it.y, `🎁 ${ctx.t("Du har alt! Her er en glad hilsen fra posthuset.")}`);
  }
  const k = pool[Math.floor(Math.random() * Math.min(pool.length, 40))];
  await A.unlock([k], 0);
  const room = A.R();
  if (!room.ro) room.items.push({ id: "i" + Math.random().toString(36).slice(2, 7), k, x: Math.min(860, it.x + 160), y: 600 });
  Sound.sfx("buy");
  A.confetti(ctx, it.x, it.y - 120, "#F15BB5", true);
  A.say(ctx, it.x, it.y, `🎁 ${ctx.t("Fredagsgave: {name}!", { name: ctx.t(A.CAT[k].n) })}`);
  A.save(ctx);
  setTimeout(() => A.redraw(ctx), 1400);
}

/* ------------------------------------------------------------------ the hair salon */
function hairSheet(ctx) {
  const st = A.st(), me = st.d.me, t = ctx.t;
  st.hairEl?.close?.();
  st.hairEl = ctx.sheet(`<h2>💇 ${esc(t("Ny frisure"))}</h2><p class="t-sub">${esc(t("Vælg frisure og farve. Det kan altid laves om."))}</p>
    <div class="fun-row">${Object.entries(A.HAIRS).map(([k, n]) => `<button class="pl-chip" data-act="toy-hair" data-f="hair" data-k="${k}" aria-pressed="${(me.hair || "kort") === k}">${esc(t(n))}</button>`).join("")}</div>
    <div class="fun-row" style="margin-top:8px">${A.HAIRC.map((c) => `<button class="pl-sw" data-act="toy-hair" data-f="hairc" data-k="${c}" aria-pressed="${me.hairc === c}" style="--c:${c}" aria-label="${esc(c)}"></button>`).join("")}</div>
    <div class="sheet-actions"><button class="btn soft" data-act="toy-hair" data-f="rand">🎲 ${esc(t("Overrask mig"))}</button><button class="btn" data-close>${esc(t("Færdig"))}</button></div>`);
}

/* ------------------------------------------------------------------ the café stove: cooking */
const INGR = { tomat: "🍅", ost: "🧀", mel: "🌾", aeg: "🥚", maelk: "🥛", jordbaer: "🍓", chokolade: "🍫", gulerod: "🥕", banan: "🍌", broed: "🍞" };
const INGR_N = { tomat: "Tomat", ost: "Ost", mel: "Mel", aeg: "Æg", maelk: "Mælk", jordbaer: "Jordbær", chokolade: "Chokolade", gulerod: "Gulerod", banan: "Banan", broed: "Brød" };
/* [the ingredients (sorted), the dish, its emoji, a thing to put out] */
const RECIPES = [
  [["mel", "ost", "tomat"], "Pizza", "🍕", "pizza"],
  [["aeg", "maelk", "mel"], "Pandekager", "🥞", "pandekager"],
  [["aeg", "chokolade", "mel"], "Chokoladekage", "🎂", "lagkage"],
  [["aeg", "gulerod", "mel"], "Gulerodskage", "🥕", "lagkage"],
  [["banan", "jordbaer", "maelk"], "Smoothie", "🥤", "juice"],
  [["broed", "ost", "tomat"], "Toast", "🥪", "madpakke"],
  [["banan", "chokolade", "maelk"], "Kakao med banan", "☕", "kopper"],
  [["gulerod", "tomat"], "Suppe", "🍲", "gryde"],
  [["jordbaer", "maelk"], "Jordbærmælk", "🥛", "maelk"],
  [["mel", "aeg"], "Boller", "🥯", "boller"],
  [["banan", "jordbaer"], "Frugtsalat", "🍓", "frugtskaal"],
];
function cookSheet(ctx) {
  const st = A.st(), t = ctx.t, pick = st.cook || [];
  st.cookEl?.close?.();
  st.cookEl = ctx.sheet(`<h2>🍳 ${esc(t("Lav mad"))}</h2><p class="t-sub">${esc(t("Vælg op til tre ting, og se hvad der kommer ud af gryden."))}</p>
    <div class="pl-ingr">${Object.entries(INGR).map(([k, em]) => `<button data-act="toy-ingr" data-k="${k}" aria-pressed="${pick.includes(k)}"><span>${em}</span>${esc(t(INGR_N[k]))}</button>`).join("")}</div>
    <div class="sheet-actions"><button class="btn soft" data-close>${esc(t("Luk"))}</button><button class="btn" data-act="toy-cook"${pick.length ? "" : " disabled"}>${esc(t("Lav mad!"))}</button></div>`);
}
function cook(ctx) {
  const st = A.st(), pick = [...(st.cook || [])].sort(), it = st.cookAt;
  st.cook = [];
  const r = RECIPES.find(([ing]) => ing.length === pick.length && ing.every((x, i) => x === pick[i])) || RECIPES.find(([ing]) => ing.every((x) => pick.includes(x)));
  const [, n, em, k] = r || [[], "Overraskelsesret", "🍛", "gryde"];
  const room = A.R();
  if (it && A.CAT[k] && !room.ro) room.items.push({ id: "i" + Math.random().toString(36).slice(2, 7), k, x: Math.min(900, it.x + 140), y: Math.max(560, Math.min(620, it.y + 40)) });
  Sound.sfx("yum");
  A.save(ctx);
  A.redraw(ctx);
  setTimeout(() => {
    A.floatIcons(ctx, it?.x || 500, (it?.y || 500) - 160, [em, "😋", "✨"]);
    A.say(ctx, it?.x || 500, it?.y || 500, `${em} ${ctx.t("Du lavede {dish}!", { dish: ctx.t(n) })}`);
  }, 80);
}

/* ------------------------------------------------------------------ the party: the music player */
export const SONGS = [["Solskinsdans", "fest0"], ["Neonnat", "fest1"], ["Hop og spring", "fest2"], ["Stjerneskud", "fest3"]];
function party(ctx, it) {
  const st = A.st(), sid = A.spaceId();
  const now = st.party?.sid === sid ? st.party.song + 1 : 0;
  if (now >= SONGS.length) {
    st.party = null;
    A.say(ctx, it.x, it.y, `🔇 ${ctx.t("Festen holder pause")}`);
  } else {
    st.party = { sid, song: now };
    A.say(ctx, it.x, it.y, `🎵 ${ctx.t(SONGS[now][0])}`);
  }
  A.redraw(ctx);
}
export const partySong = () => {
  const st = A?.st();
  return st?.party && st.party.sid === A.spaceId() ? SONGS[st.party.song][1] : "";
};
export const partySvg = () =>
  partySong()
    ? `<g class="pl-party" pointer-events="none">${[[200, "#F15BB5"], [500, "#FFE066"], [800, "#00BBF9"]].map(([x, c]) => `<path d="M${x} -10 L${x - 170} ${FLOOR + 160} H${x + 170}Z" fill="${c}" opacity=".16" class="pl-beam"/>`).join("")}${rep(12, (i) => `<circle cx="${(i * 89) % W}" cy="${40 + ((i * 53) % 300)}" r="${4 + (i % 3) * 2}" fill="${["#FFD93D", "#F15BB5", "#4D96FF"][i % 3]}" class="pl-twinkle"/>`)}</g>`
    : "";

/* ------------------------------------------------------------------ season decorations in the town */
const SPOTS = [[90, 610], [930, 610], [500, 210]];
export function seasonSvg(ctx, pl) {
  if (!pl || pl.secret) return "";
  const pk = A.seasonPacks()[0];
  if (!pk) return "";
  const keys = pk.items.filter((k) => A.CAT[k]).slice(0, 3);
  return `<g class="pl-season" pointer-events="none">${keys.map((k, i) => {
    const T = A.CAT[k], [x, y] = SPOTS[i];
    return `<g transform="translate(${x} ${y}) scale(.7)">${T.d(T.c)}</g>`;
  }).join("")}</g>`;
}

/* ------------------------------------------------------------------ what some things do, when tapped */
export function special(ctx, it) {
  const k = it.k, st = A.st();
  if (st.build) return false;
  if (k === "frisoerstol") return hairSheet(ctx), true;
  if (["komfur", "bageovn", "gryde", "stegepande", "minikokken", "bagerovn"].includes(k)) {
    st.cookAt = { x: it.x, y: it.y };
    st.cook = [];
    return cookSheet(ctx), true;
  }
  if (k === "jukebox" || k === "boombox") return party(ctx, it), true;
  if (["postskranke", "postkasse", "postsaek"].includes(k) && A.spaceId() === "by-post") return postOffice(ctx, it), true;
  return false;
}
export const acts = {
  "toy-hair": (el, ev, ctx) => {
    const st = A.st(), f = el.dataset.f;
    if (f === "rand") {
      const hs = Object.keys(A.HAIRS);
      st.d.me = { ...st.d.me, hair: hs[Math.floor(Math.random() * hs.length)], hairc: A.HAIRC[Math.floor(Math.random() * A.HAIRC.length)] };
    } else st.d.me = { ...st.d.me, [f]: el.dataset.k };
    Sound.sfx("tap");
    A.save(ctx);
    A.redraw(ctx);
    hairSheet(ctx);
  },
  "toy-ingr": (el, ev, ctx) => {
    const st = A.st(), k = el.dataset.k, pick = (st.cook ||= []);
    if (pick.includes(k)) st.cook = pick.filter((x) => x !== k);
    else if (pick.length < 3) pick.push(k);
    Sound.sfx("pop");
    cookSheet(ctx);
  },
  "toy-cook": (el, ev, ctx) => {
    A.st().cookEl?.close?.();
    cook(ctx);
  },
};

export const TOYS_EN = {
  Lommen: "The pocket", "Lommen er fuld": "The pocket is full", "Tag frem": "Take out", "Træk en figur eller en ting (i Byg) hen på tasken for at tage den med.": "Drag a character, or a thing (in Build), onto the bag to take it with you.",
  "Hemmelighed fundet: {name}!": "Secret found: {name}!", Hemmeligheder: "Secrets",
  "Næste gave kommer på fredag!": "The next gift comes on Friday!", "Fredagsgave: {name}!": "Friday gift: {name}!", "Du har alt! Her er en glad hilsen fra posthuset.": "You have everything! Here is a happy hello from the post office.",
  "Ny frisure": "New hairstyle", "Vælg frisure og farve. Det kan altid laves om.": "Pick a style and a colour. You can always change it.", "Overrask mig": "Surprise me", "Færdig": "Done",
  "Lav mad": "Cook", "Vælg op til tre ting, og se hvad der kommer ud af gryden.": "Pick up to three things, and see what comes out of the pot.", "Lav mad!": "Cook!", "Du lavede {dish}!": "You made {dish}!",
  Tomat: "Tomato", Ost: "Cheese", Mel: "Flour", "Æg": "Egg", "Mælk": "Milk", "Jordbær": "Strawberry", Chokolade: "Chocolate", Gulerod: "Carrot", Banan: "Banana", "Brød": "Bread",
  Pizza: "Pizza", Pandekager: "Pancakes", Chokoladekage: "Chocolate cake", Gulerodskage: "Carrot cake", Smoothie: "Smoothie", Toast: "Toast", "Kakao med banan": "Cocoa with banana", Suppe: "Soup", "Jordbærmælk": "Strawberry milk", Boller: "Buns", Frugtsalat: "Fruit salad", Overraskelsesret: "Surprise dish",
  Solskinsdans: "Sunshine dance", Neonnat: "Neon night", "Hop og spring": "Hop and jump", Stjerneskud: "Shooting star", "Festen holder pause": "The party takes a break",
  "Havfrue-grotten": "The mermaid grotto", Svampelandet: "Mushroom land", Skatkammeret: "The treasure vault", "Det hemmelige loft": "The secret attic", "Det hemmelige bibliotek": "The secret library",
  "En gammel sok under sengen": "An old sock under the bed",
  "En mariehøne i græsset": "A ladybird in the grass",
  "Hundenes gemte kødben": "The dogs' hidden bone",
  "En dør under molen": "A door under the pier",
  "En lille dør i svampehuset": "A little door in the mushroom house",
  "Et gyldent æg i høet": "A golden egg in the hay",
  "Et par glemte høretelefoner": "A pair of forgotten headphones",
  "En backstage-billet": "A backstage ticket",
  "Den hemmelige småkageopskrift": "The secret cookie recipe",
  "En gylden slikkepind": "A golden lollipop",
  "En ballon i træet": "A balloon in the tree",
  "En perle i en musling": "A pearl in a shell",
  "Et lysende batteri": "A glowing battery",
  "En lille satellit": "A little satellite",
  "Et stjerneskud": "A shooting star",
  "En lem i hulens væg": "A hatch in the cave wall",
  "Et halvspist croissant": "A half-eaten croissant",
  "En glemt hårsløjfe": "A forgotten hair bow",
  "Et brev uden afsender": "A letter with no sender",
  "En lem til loftet": "A hatch to the attic",
  "En due med en besked": "A pigeon with a message",
  "Et gyldent skateboard": "A golden skateboard",
  "En mønt i springvandet": "A coin in the fountain",
  "En fisk i søen": "A fish in the lake",
  "Et plaster med hjerter": "A plaster with hearts",
  "En bamse bag skiltet": "A teddy behind the sign",
  "En dør bag tavlen": "A door behind the blackboard",
  "En badeand i poolen": "A rubber duck in the pool",
  "Den sidste puslespilsbrik": "The last jigsaw piece",
  "Havfruens krone": "The mermaid's crown",
  "En lille fe": "A little fairy",
  "Den gyldne pokal": "The golden trophy",
  "En kasse med gamle billeder": "A box of old photos",
  "En lysende kugle": "A glowing orb",
};

export const TOYS_CSS = `
.pl-pocket { cursor: pointer; }
.pl-pocket.open circle:first-child { fill: #FFF3B0; }
.pl-pocketn { font: 900 16px system-ui, sans-serif; fill: #fff; }
.pl-pocketbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 10px 0 0; padding: 10px; border-radius: 18px; background: #FFF6E6; border: 2px solid #2B2340; }
.pl-pocketbar button { width: 72px; height: 72px; border-radius: 14px; border: 2px solid #2B2340; background: #fff; padding: 2px; cursor: pointer; }
.pl-pocketbar svg { width: 100%; height: 100%; }
.pl-glint { font-size: 22px; opacity: 0; animation: plglint 7s ease-in-out infinite; }
@keyframes plglint { 0%, 80%, 100% { opacity: 0; } 88% { opacity: .75; } }
.pl-secretdoor { cursor: pointer; }
.pl-ingr { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 8px; }
.pl-ingr button { display: grid; justify-items: center; gap: 2px; padding: 8px; border-radius: 14px; border: 2px solid var(--line, #ddd); background: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.pl-ingr button span { font-size: 30px; }
.pl-ingr button[aria-pressed="true"] { border-color: #2B2340; background: #FFF3B0; }
#pl-stage.party .pl-npc .pl-body, #pl-stage.party .pl-me .pl-body, #pl-stage.party .pl-peer .pl-body { animation: pldance .45s ease-in-out infinite alternate !important; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes pldance { from { transform: rotate(-6deg) translateY(0); } to { transform: rotate(6deg) translateY(-10px); } }
`;
