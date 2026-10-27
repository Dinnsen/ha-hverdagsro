/* Hverdagsro – Mit værelse: the child's own room, a little doll's house they build themselves.
   The child has an avatar they dress, their pet lives in the room, furniture and wall things are dragged in from a
   drawer, and the day's routine cards and missions float in the room as bubbles to tap when they are done. The real
   lights of the child's room are switched from the switch on the wall. Stored on the member: member.playroom. */
import { esc } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import * as Kids from "./hv-kids.js";
import { occasions, dayNumber } from "./hv-decor.js";
import * as World from "./hv-world.js";
import { charSvg } from "./hv-chars.js";
import { WORLD_THINGS, WORLD_NAMES_EN } from "./hv-worlditems.js";
import { OL, S, shade, THINGS, PATTERNS_X, FLOORS_X, EXTRAS_X, PACKS, SPACES, FEST_WALL, LEVELS, LEVEL_GIFTS, LEVEL_THINGS, levelOf, SEASON_DAYS } from "./hv-playcat.js";

const W = 1000, H = 620, FLOOR = 440;

/* ------------------------------------------------------------------ what can go in the room
   Each thing is drawn from its bottom centre (0,0) upwards. c: its colour (the child can change it). */
const PAL = ["#FF6B6B", "#FFB347", "#FFD93D", "#6BCB77", "#4D96FF", "#9B5DE5", "#F15BB5", "#00BBF9", "#FFFFFF", "#3A3A55"];
const ITEMS = {
  bed: ["Seng", "mob", 0, "#4D96FF", (c) => `<rect x="-150" y="-60" width="300" height="50" rx="12" fill="#C98B55" ${S()}/><rect x="-150" y="-150" width="40" height="150" rx="14" fill="#C98B55" ${S()}/><rect x="-108" y="-100" width="250" height="44" rx="18" fill="#fff" ${S()}/><rect x="-104" y="-122" width="78" height="34" rx="16" fill="#fff" ${S()}/><path d="M-60 -104 h190 a14 14 0 0 1 14 14 v32 h-204z" fill="${c}" ${S()}/><path d="M-30 -84 h140" stroke="${shade(c, 0.8)}" stroke-width="5" stroke-linecap="round"/><rect x="-146" y="-12" width="14" height="12" fill="${OL}"/><rect x="132" y="-12" width="14" height="12" fill="${OL}"/>`],
  bunk: ["Køjeseng", "mob", 0, "#F15BB5", (c) => `<rect x="-115" y="-330" width="20" height="330" rx="6" fill="#C98B55" ${S()}/><rect x="95" y="-330" width="20" height="330" rx="6" fill="#C98B55" ${S()}/><rect x="-110" y="-70" width="220" height="34" rx="10" fill="#C98B55" ${S()}/><rect x="-110" y="-230" width="220" height="34" rx="10" fill="#C98B55" ${S()}/><rect x="-92" y="-98" width="190" height="30" rx="12" fill="${c}" ${S()}/><rect x="-92" y="-258" width="190" height="30" rx="12" fill="${shade(c, 1.15)}" ${S()}/><rect x="-90" y="-112" width="50" height="22" rx="10" fill="#fff" ${S()}/><rect x="-90" y="-272" width="50" height="22" rx="10" fill="#fff" ${S()}/><path d="M60 -230 v190 M90 -230 v190 M60 -200 h30 M60 -160 h30 M60 -120 h30" ${S()} fill="none"/>`],
  desk: ["Skrivebord", "mob", 0, "#FFD93D", (c) => `<rect x="-110" y="-130" width="220" height="22" rx="8" fill="${c}" ${S()}/><rect x="-100" y="-110" width="16" height="110" fill="${shade(c, 0.8)}" ${S()}/><rect x="40" y="-110" width="60" height="110" rx="6" fill="${shade(c, 0.9)}" ${S()}/><path d="M48 -74 h44 M48 -40 h44" ${S()}/><circle cx="70" cy="-92" r="4" fill="${OL}"/><circle cx="70" cy="-57" r="4" fill="${OL}"/>`],
  chair: ["Stol", "mob", 0, "#6BCB77", (c) => `<rect x="-30" y="-130" width="60" height="70" rx="16" fill="${c}" ${S()}/><rect x="-36" y="-66" width="72" height="16" rx="8" fill="${shade(c, 0.85)}" ${S()}/><path d="M-26 -50 v50 M26 -50 v50" ${S()}/>`],
  shelf: ["Reol med legetøj", "mob", 0, "#FFFFFF", (c) => `<rect x="-90" y="-240" width="180" height="240" rx="10" fill="${c}" ${S()}/><path d="M-90 -160 h180 M-90 -80 h180" ${S()}/><rect x="-74" y="-206" width="34" height="44" rx="6" fill="#FF6B6B" ${S()}/><circle cx="2" cy="-180" r="18" fill="#FFD93D" ${S()}/><rect x="36" y="-198" width="38" height="36" rx="8" fill="#4D96FF" ${S()}/><rect x="-74" y="-126" width="20" height="44" fill="#9B5DE5" ${S()}/><rect x="-52" y="-120" width="20" height="38" fill="#6BCB77" ${S()}/><rect x="-30" y="-130" width="20" height="48" fill="#F15BB5" ${S()}/><circle cx="50" cy="-104" r="22" fill="#FFB347" ${S()}/><rect x="-70" y="-60" width="140" height="52" rx="10" fill="${shade(c, 0.9)}" ${S()}/>`],
  wardrobe: ["Klædeskab", "mob", 0, "#9B5DE5", (c) => `<rect x="-85" y="-290" width="170" height="276" rx="12" fill="${c}" ${S()}/><path d="M0 -290 v276" ${S()}/><circle cx="-12" cy="-150" r="6" fill="#FFD93D" ${S()}/><circle cx="12" cy="-150" r="6" fill="#FFD93D" ${S()}/><rect x="-80" y="-14" width="14" height="14" fill="${OL}"/><rect x="66" y="-14" width="14" height="14" fill="${OL}"/>`],
  beanbag: ["Sækkestol", "mob", 0, "#F15BB5", (c) => `<path d="M-66 0 C-80 -40 -50 -96 0 -96 C50 -96 80 -40 66 0 Z" fill="${c}" ${S()}/><path d="M-30 -40 Q0 -60 30 -40" stroke="${shade(c, 0.75)}" stroke-width="6" fill="none" stroke-linecap="round"/>`],
  rug: ["Tæppe", "mob", 1, "#00BBF9", (c) => `<ellipse cx="0" cy="-14" rx="170" ry="26" fill="${c}" ${S()}/><ellipse cx="0" cy="-14" rx="130" ry="17" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 10"/>`],
  floorlamp: ["Standerlampe", "lys", 0, "#FFB347", (c) => `<g class="pl-lamp"><ellipse cx="0" cy="-196" rx="80" ry="70" class="pl-glow" fill="#FFE8A3"/><path d="M-6 -4 h12 v-176 h-12z" fill="#7A6A8A" ${S()}/><ellipse cx="0" cy="-4" rx="34" ry="8" fill="#7A6A8A" ${S()}/><path d="M-44 -176 L-28 -236 h56 L44 -176 Z" fill="${c}" ${S()}/></g>`],
  tablelamp: ["Bordlampe", "lys", 0, "#4D96FF", (c) => `<g class="pl-lamp"><ellipse cx="0" cy="-60" rx="56" ry="46" class="pl-glow" fill="#FFE8A3"/><rect x="-24" y="-12" width="48" height="12" rx="5" fill="#7A6A8A" ${S()}/><path d="M-4 -12 v-30 h8 v30" fill="#7A6A8A" ${S()}/><path d="M-30 -40 L-20 -80 h40 L30 -40 Z" fill="${c}" ${S()}/></g>`],
  plant: ["Plante", "pynt", 0, "#FF6B6B", (c) => `<path d="M-30 -50 h60 l-8 50 h-44z" fill="${c}" ${S()}/><path d="M0 -50 C-10 -90 -50 -100 -50 -130 C-20 -120 -4 -96 0 -50 M0 -50 C6 -100 30 -120 44 -140 C50 -110 30 -80 0 -50 M0 -50 C0 -90 -4 -120 6 -150" fill="#6BCB77" ${S()}/>`],
  teddy: ["Bamse", "leg", 0, "#C98B55", (c) => `<ellipse cx="0" cy="-34" rx="30" ry="32" fill="${c}" ${S()}/><circle cx="0" cy="-82" r="26" fill="${c}" ${S()}/><circle cx="-20" cy="-102" r="10" fill="${c}" ${S()}/><circle cx="20" cy="-102" r="10" fill="${c}" ${S()}/><ellipse cx="0" cy="-74" rx="11" ry="8" fill="#F5E1C8" ${S("stroke-width=\"3\"")}/><circle cx="-9" cy="-88" r="3.5" fill="${OL}"/><circle cx="9" cy="-88" r="3.5" fill="${OL}"/><circle cx="0" cy="-77" r="3" fill="${OL}"/>`],
  ball: ["Bold", "leg", 0, "#FF6B6B", (c) => `<circle cx="0" cy="-26" r="26" fill="${c}" ${S()}/><path d="M-26 -26 Q0 -10 26 -26 M0 -52 Q-14 -26 0 0" fill="none" stroke="#fff" stroke-width="5"/>`],
  tipi: ["Legetelt", "leg", 0, "#FFD93D", (c) => `<path d="M-110 0 L0 -220 L110 0 Z" fill="${c}" ${S()}/><path d="M-40 0 L0 -120 L40 0Z" fill="#3A3A55" ${S()}/><path d="M-14 -246 L0 -220 L14 -246" ${S()} fill="none"/><path d="M-80 -60 h160 M-56 -110 h112" stroke="${shade(c, 0.8)}" stroke-width="8" stroke-dasharray="14 12"/>`],
  aquarium: ["Akvarie", "pynt", 0, "#00BBF9", (c) => `<rect x="-60" y="-90" width="120" height="84" rx="10" fill="${c}" fill-opacity=".55" ${S()}/><rect x="-66" y="-10" width="132" height="12" rx="4" fill="#7A6A8A" ${S()}/><g class="pl-fish"><path d="M-20 -54 q14 -14 28 0 q-14 14 -28 0 l-10 -8 v16z" fill="#FFB347" ${S("stroke-width=\"3\"")}/></g><path d="M30 -10 q-6 -20 4 -40 M40 -10 q4 -16 -2 -30" stroke="#6BCB77" stroke-width="5" fill="none"/>`],
  guitar: ["Guitar", "leg", 0, "#FF6B6B", (c) => `<path d="M-30 -10 C-46 -40 -30 -60 -14 -64 C-26 -84 -10 -100 4 -96 C22 -92 26 -70 14 -62 C34 -54 36 -20 14 -6 C0 4 -20 4 -30 -10Z" fill="${c}" ${S()}/><circle cx="-2" cy="-44" r="9" fill="${OL}"/><rect x="0" y="-180" width="12" height="96" fill="#C98B55" ${S()} transform="rotate(14)"/>`],
  dollhouse: ["Dukkehus", "leg", 0, "#F15BB5", (c) => `<rect x="-80" y="-130" width="160" height="130" rx="6" fill="#fff" ${S()}/><path d="M-96 -126 L0 -190 L96 -126Z" fill="${c}" ${S()}/><rect x="-60" y="-100" width="40" height="34" fill="#4D96FF" ${S()}/><rect x="20" y="-100" width="40" height="34" fill="#4D96FF" ${S()}/><rect x="-16" y="-54" width="32" height="54" fill="#FFB347" ${S()}/>`],
  car: ["Legetøjsbil", "leg", 0, "#4D96FF", (c) => `<path d="M-46 -14 v-20 l18 -18 h46 l18 18 h10 v20z" fill="${c}" ${S()}/><path d="M-20 -48 h34 l12 14 h-46z" fill="#BFE6FF" ${S()}/><circle cx="-26" cy="-12" r="12" fill="${OL}"/><circle cx="26" cy="-12" r="12" fill="${OL}"/>`],
  blocks: ["Klodser", "leg", 0, "#FFD93D", (c) => `<rect x="-40" y="-40" width="40" height="40" rx="4" fill="${c}" ${S()}/><rect x="2" y="-40" width="40" height="40" rx="4" fill="#4D96FF" ${S()}/><rect x="-20" y="-80" width="40" height="40" rx="4" fill="#FF6B6B" ${S()}/><text x="-20" y="-12" font-size="26" font-weight="900" text-anchor="middle" fill="${OL}">A</text><text x="22" y="-12" font-size="26" font-weight="900" text-anchor="middle" fill="#fff">B</text>`],
  gaming: ["Gamerstol", "mob", 0, "#3A3A55", (c) => `<rect x="-40" y="-170" width="80" height="110" rx="24" fill="${c}" ${S()}/><path d="M-24 -150 h48" stroke="#FF6B6B" stroke-width="8" stroke-linecap="round"/><rect x="-50" y="-70" width="100" height="22" rx="10" fill="${shade(c, 1.3)}" ${S()}/><path d="M0 -48 v34 M-34 -6 h68" ${S()}/><circle cx="-34" cy="-4" r="6" fill="${OL}"/><circle cx="34" cy="-4" r="6" fill="${OL}"/>`],
  poster: ["Plakat med stjerne", "væg", 0, "#9B5DE5", (c) => `<rect x="-50" y="-130" width="100" height="130" rx="6" fill="${c}" ${S()}/><path d="M0 -104 l12 26 28 3 -21 19 6 28 -25 -14 -25 14 6 -28 -21 -19 28 -3z" fill="#FFD93D" ${S("stroke-width=\"3\"")}/>`],
  rainbow: ["Regnbue", "væg", 0, "#FFFFFF", (c) => `<rect x="-62" y="-92" width="124" height="92" rx="8" fill="${c}" ${S()}/><path d="M-44 -18 a44 44 0 0 1 88 0" stroke="#FF6B6B" stroke-width="10" fill="none"/><path d="M-32 -18 a32 32 0 0 1 64 0" stroke="#FFD93D" stroke-width="10" fill="none"/><path d="M-20 -18 a20 20 0 0 1 40 0" stroke="#4D96FF" stroke-width="10" fill="none"/>`],
  clock: ["Ur", "væg", 0, "#FFB347", () => `<circle cx="0" cy="-36" r="36" fill="#fff" ${S()}/><path class="pl-clock" d="M0 -36 v-22 M0 -36 l16 8" ${S()} fill="none"/>`],
  garland: ["Lyskæde", "væg", 0, "#FFD93D", (c) => `<path d="M-160 -40 Q-80 0 0 -30 Q80 0 160 -40" fill="none" ${S("stroke-width=\"3\"")}/>${[-130, -90, -50, -10, 30, 70, 110, 150].map((x, i) => `<g class="pl-lamp"><circle cx="${x}" cy="${-28 + (Math.abs(x) % 40) / 4}" r="14" class="pl-glow" fill="#FFE8A3"/><circle cx="${x}" cy="${-24 + (Math.abs(x) % 40) / 4}" r="8" fill="${i % 2 ? c : PAL[(i * 3) % 8]}" ${S("stroke-width=\"3\"")}/></g>`).join("")}`],
  wallshelf: ["Hylde med bøger", "væg", 0, "#C98B55", (c) => `<rect x="-80" y="-10" width="160" height="12" rx="4" fill="${c}" ${S()}/>${[["#FF6B6B", 18, 52], ["#4D96FF", 16, 46], ["#6BCB77", 18, 56], ["#FFD93D", 14, 40], ["#9B5DE5", 18, 50]].map(([f, w, h], i) => `<rect x="${-70 + i * 22}" y="${-10 - h}" width="${w}" height="${h}" rx="3" fill="${f}" ${S("stroke-width=\"3\"")}/>`).join("")}`],
  mirror: ["Spejl", "væg", 0, "#FFB347", (c) => `<ellipse cx="0" cy="-70" rx="40" ry="70" fill="${c}" ${S()}/><ellipse cx="0" cy="-70" rx="30" ry="58" fill="#DDF3FF" ${S("stroke-width=\"3\"")}/><path d="M-12 -100 l14 -16 M-6 -80 l18 -20" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`],
  photo: ["Billede", "væg", 0, "#C98B55", (c) => `<rect x="-46" y="-70" width="92" height="70" rx="4" fill="${c}" ${S()}/><rect x="-36" y="-60" width="72" height="50" fill="#BFE6FF"/><path d="M-36 -10 l22 -24 16 14 14 -12 20 22z" fill="#6BCB77"/><circle cx="20" cy="-46" r="7" fill="#FFD93D"/>`],
  moon: ["Månelampe", "lys", 0, "#FFE8A3", (c) => `<g class="pl-lamp"><circle cx="0" cy="-40" r="64" class="pl-glow" fill="#FFE8A3"/><path d="M14 -76 a40 40 0 1 0 0 72 a32 32 0 1 1 0 -72z" fill="${c}" ${S()}/></g>`],
};
const WALLS = { mint: "#BDEFD8", rosa: "#FFD1E3", himmel: "#C7E6FF", sol: "#FFF0B8", lilla: "#E2D5FF", sand: "#F2E3CF", nat: "#2E3A6E" };
const PATTERNS = { ren: "Ensfarvet", striber: "Striber", prikker: "Prikker", stjerner: "Stjerner", hjerter: "Hjerter", skyer: "Skyer" };
const FLOORS = { lys: ["Lyst træ", "#E8C69A"], mork: ["Mørkt træ", "#A9764C"], blaa: ["Blåt tæppe", "#8FB5F2"], gron: ["Grønt tæppe", "#9BD7A0"], rosa: ["Lyserødt tæppe", "#F7B5CF"], tern: ["Ternet", "#F3F3F3"] };
const SKINS = ["#FFE0C7", "#F6C9A3", "#E3A87C", "#B97A52", "#7A4B2D"];
const HAIRS = { kort: "Kort", lang: "Langt", hale: "Hestehale", kroller: "Krøller", knold: "Knold", pjusk: "Pjusket" };
const HAIRC = ["#2B1D14", "#5B3A21", "#A8642A", "#E9C46A", "#E76F51", "#9B5DE5", "#4D96FF"];
const EXTRAS = { ingen: "Ingen", briller: "Briller", kasket: "Kasket", sloife: "Sløjfe", krone: "Krone", horn: "Enhjørning" };

function defaults(m) {
  const girl = /a$|e$|ie$/i.test(m.name.split(" ")[0]);
  return {
    v: 1,
    wall: { c: girl ? "rosa" : "himmel", p: "prikker" },
    floor: "lys",
    items: [
      { id: "i1", k: "rug", x: 520, y: 600 },
      { id: "i2", k: "bed", x: 220, y: 560 },
      { id: "i3", k: "desk", x: 820, y: 520 },
      { id: "i4", k: "tablelamp", x: 780, y: 390 },
      { id: "i5", k: "plant", x: 920, y: 600 },
      { id: "i6", k: "poster", x: 200, y: 230 },
      { id: "i7", k: "garland", x: 420, y: 110 },
    ],
    me: { skin: SKINS[1], hair: girl ? "lang" : "kort", hairc: HAIRC[1], top: m.color || "#FF6B6B", bottom: "#4D96FF", extra: "ingen" },
    ax: 500,
    ay: 590,
    px: 660,
    py: 600,
  };
}

/* ------------------------------------------------------------------ the avatar (our own figure: big head, small body) */
export function avatarSvg(me, mood = "") {
  const sk = me.skin || SKINS[1], hc = me.hairc || HAIRC[1], top = me.top || "#FF6B6B", bot = me.bottom || "#4D96FF";
  const hairBack = {
    lang: `<path d="M-62 -196 C-70 -120 -60 -96 -40 -92 L40 -92 C60 -96 70 -120 62 -196 Z" fill="${hc}" ${S()}/>`,
    hale: `<path d="M50 -230 C96 -230 100 -170 74 -140 C70 -170 60 -190 40 -200 Z" fill="${hc}" ${S()}/>`,
    kroller: [-56, -36, 0, 36, 56, -60, 60].map((x, i) => `<circle cx="${x}" cy="${i > 4 ? -170 : -238 + Math.abs(x) * 0.6}" r="26" fill="${hc}" ${S()}/>`).join(""),
    knold: `<circle cx="0" cy="-262" r="24" fill="${hc}" ${S()}/>`,
  }[me.hair] || "";
  const hairFront = {
    kort: `<path d="M-58 -200 C-58 -250 58 -250 58 -200 C40 -214 20 -206 0 -216 C-18 -206 -40 -214 -58 -200Z" fill="${hc}" ${S()}/>`,
    lang: `<path d="M-60 -196 C-60 -252 60 -252 60 -196 C30 -222 -10 -224 -60 -196Z" fill="${hc}" ${S()}/>`,
    hale: `<path d="M-60 -196 C-60 -252 60 -252 60 -196 C30 -222 -10 -224 -60 -196Z" fill="${hc}" ${S()}/><circle cx="56" cy="-218" r="9" fill="#FF6B6B" ${S("stroke-width=\"3\"")}/>`,
    kroller: `<path d="M-50 -210 C-40 -246 40 -246 50 -210 C30 -224 -30 -224 -50 -210Z" fill="${hc}" ${S()}/>`,
    knold: `<path d="M-58 -200 C-58 -252 58 -252 58 -200 C30 -220 -30 -220 -58 -200Z" fill="${hc}" ${S()}/>`,
    pjusk: `<path d="M-60 -196 L-64 -232 -40 -224 -34 -256 -10 -236 4 -262 18 -236 40 -252 42 -224 64 -230 60 -196 C30 -214 -30 -214 -60 -196Z" fill="${hc}" ${S()}/>`,
  }[me.hair || "kort"];
  const extra = {
    briller: `<g fill="none" ${S("stroke-width=\"4\"")}><circle cx="-22" cy="-178" r="14"/><circle cx="22" cy="-178" r="14"/><path d="M-8 -178 h16"/></g>`,
    kasket: `<path d="M-60 -206 C-56 -256 56 -256 60 -206 Z" fill="#4D96FF" ${S()}/><path d="M20 -210 h70 q6 6 -2 12 h-68z" fill="#4D96FF" ${S()}/>`,
    sloife: `<path d="M24 -236 l-22 -14 v28z M24 -236 l22 -14 v28z" fill="#F15BB5" ${S("stroke-width=\"3\"")}/><circle cx="24" cy="-236" r="6" fill="#F15BB5" ${S("stroke-width=\"3\"")}/>`,
    krone: `<path d="M-34 -236 l10 -30 14 20 10 -26 10 26 14 -20 10 30z" fill="#FFD93D" ${S()}/>`,
    horn: `<path d="M-8 -238 L0 -290 L8 -238Z" fill="#FFD93D" ${S()}/><path d="M-4 -258 h8 M-6 -248 h12" stroke="${OL}" stroke-width="2"/>`,
  }[me.extra] || (EXTRAS_X[me.extra] ? EXTRAS_X[me.extra][1](hc) : "");
  const mouth = mood === "wow" ? `<ellipse cx="0" cy="-150" rx="9" ry="11" fill="${OL}"/>` : mood === "sleep" ? `<path d="M-10 -152 h20" ${S()}/>` : `<path d="M-14 -156 Q0 -142 14 -156" fill="#fff" ${S("stroke-width=\"3.5\"")}/>`;
  const eyes = mood === "sleep" ? `<path d="M-30 -180 q8 6 16 0 M14 -180 q8 6 16 0" fill="none" ${S("stroke-width=\"3.5\"")}/>` : `<ellipse cx="-22" cy="-180" rx="7" ry="9" fill="${OL}"/><ellipse cx="22" cy="-180" rx="7" ry="9" fill="${OL}"/><circle cx="-19" cy="-184" r="2.6" fill="#fff"/><circle cx="25" cy="-184" r="2.6" fill="#fff"/>`;
  return `${hairBack}
    <path d="M-30 -70 v56 h22 v-56z M8 -70 v56 h22 v-56z" fill="${bot}" ${S()}/><path d="M-36 -12 h30 v12 h-34 q-4 0 -4 -6z M6 -12 h30 q4 0 4 6 v6 h-34z" fill="#3A3A55" ${S()}/>
    <path d="M-44 -134 h88 l6 70 h-100z" fill="${top}" ${S()}/>
    <g class="pl-arm l"><path d="M-44 -128 l-28 52" stroke="${OL}" stroke-width="22" stroke-linecap="round"/><path d="M-44 -128 l-28 52" stroke="${top}" stroke-width="14" stroke-linecap="round"/><circle cx="-74" cy="-72" r="11" fill="${sk}" ${S("stroke-width=\"3.5\"")}/></g>
    <g class="pl-arm r"><path d="M44 -128 l28 52" stroke="${OL}" stroke-width="22" stroke-linecap="round"/><path d="M44 -128 l28 52" stroke="${top}" stroke-width="14" stroke-linecap="round"/><circle cx="74" cy="-72" r="11" fill="${sk}" ${S("stroke-width=\"3.5\"")}/></g>
    <circle cx="0" cy="-184" r="62" fill="${sk}" ${S()}/><circle cx="-60" cy="-178" r="11" fill="${sk}" ${S("stroke-width=\"3.5\"")}/><circle cx="60" cy="-178" r="11" fill="${sk}" ${S("stroke-width=\"3.5\"")}/>
    ${hairFront}${eyes}<circle cx="-36" cy="-158" r="9" fill="#FF8FA3" opacity=".55"/><circle cx="36" cy="-158" r="9" fill="#FF8FA3" opacity=".55"/>${mouth}${extra}`;
}

/* The pet in the room: the family's dog, cat or little dragon, drawn like the avatar. */
function petInRoom(m, happy) {
  const c = m.color || "#FFB347", kind = m.pet?.kind || "hund";
  const ears = kind === "kat" ? `<path d="M-34 -96 l-6 -34 28 18z M34 -96 l6 -34 -28 18z" fill="${c}" ${S()}/>` : kind === "drage" ? `<path d="M-24 -104 l-8 -30 22 16z M24 -104 l8 -30 -22 16z" fill="#FFD93D" ${S()}/><path d="M-60 -70 q-30 -30 -10 -50 q4 20 20 26z" fill="${shade(c, 0.85)}" ${S()}/>` : `<ellipse cx="-44" cy="-86" rx="14" ry="26" fill="${shade(c, 0.8)}" ${S()} transform="rotate(20 -44 -86)"/><ellipse cx="44" cy="-86" rx="14" ry="26" fill="${shade(c, 0.8)}" ${S()} transform="rotate(-20 44 -86)"/>`;
  const tail = kind === "kat" ? `<path d="M50 -24 q40 -10 30 -60" fill="none" stroke="${OL}" stroke-width="16" stroke-linecap="round"/><path d="M50 -24 q40 -10 30 -60" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>` : kind === "drage" ? `<path d="M48 -20 q50 0 56 -40 l10 18 -18 6" fill="${c}" ${S()}/>` : `<path class="pl-wag" d="M48 -34 q30 -10 30 -40" fill="none" stroke="${OL}" stroke-width="16" stroke-linecap="round"/><path class="pl-wag" d="M48 -34 q30 -10 30 -40" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`;
  return `${tail}<ellipse cx="0" cy="-34" rx="54" ry="34" fill="${c}" ${S()}/><path d="M-36 -8 v8 M-14 -6 v8 M14 -6 v8 M36 -8 v8" ${S("stroke-width=\"10\"")}/>${ears}<circle cx="0" cy="-86" r="44" fill="${c}" ${S()}/><ellipse cx="0" cy="-72" rx="20" ry="14" fill="#fff" ${S("stroke-width=\"3\"")}/><ellipse cx="-16" cy="-94" rx="6" ry="8" fill="${OL}"/><ellipse cx="16" cy="-94" rx="6" ry="8" fill="${OL}"/><circle cx="-14" cy="-97" r="2.2" fill="#fff"/><circle cx="18" cy="-97" r="2.2" fill="#fff"/><ellipse cx="0" cy="-78" rx="6" ry="4.5" fill="${OL}"/>${happy ? `<path d="M-8 -68 q8 8 16 0" fill="none" ${S("stroke-width=\"3\"")}/>` : `<path d="M-6 -66 h12" ${S("stroke-width=\"3\"")}/>`}`;
}

/* ------------------------------------------------------------------ the room */
let ST = null; // { kid, d: the room, sel, build, tab, saveT, drag }
const wallFill = (d) => (WALLS[d.wall?.c] ? WALLS[d.wall.c] : WALLS.himmel);
function patternDefs(d) {
  const c = wallFill(d), dk = shade(c, 0.9), lt = shade(c, 1.06), p = d.wall?.p || "ren";
  const pat = {
    striber: `<rect width="60" height="60" fill="${c}"/><rect width="30" height="60" fill="${lt}"/>`,
    prikker: `<rect width="60" height="60" fill="${c}"/><circle cx="15" cy="15" r="6" fill="${dk}"/><circle cx="45" cy="45" r="6" fill="${dk}"/>`,
    stjerner: `<rect width="60" height="60" fill="${c}"/><path d="M30 12 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="${dk}"/>`,
    hjerter: `<rect width="60" height="60" fill="${c}"/><path d="M30 42 C10 28 16 14 26 16 C29 17 30 20 30 21 C30 20 31 17 34 16 C44 14 50 28 30 42z" fill="${dk}"/>`,
    skyer: `<rect width="80" height="60" fill="${c}"/><path d="M14 36 a10 10 0 0 1 16 -10 a12 12 0 0 1 22 4 a8 8 0 0 1 2 16 h-36 a8 8 0 0 1 -4 -10z" fill="${lt}"/>`,
  }[p];
  const PX = PATTERNS_X[p];
  const floor = FLOORS[d.floor] || FLOORS_X[d.floor] || FLOORS.lys;
  const fl = d.floor === "tern" ? `<rect width="80" height="40" fill="#F3F3F3"/><rect width="40" height="20" fill="#CFCFE0"/><rect x="40" y="20" width="40" height="20" fill="#CFCFE0"/>` : d.floor === "lys" || d.floor === "mork" ? `<rect width="200" height="36" fill="${floor[1]}"/><path d="M0 35 h200 M120 0 v36" stroke="${shade(floor[1], 0.82)}" stroke-width="3"/>` : `<rect width="40" height="40" fill="${floor[1]}"/><circle cx="20" cy="20" r="2" fill="${shade(floor[1], 0.9)}"/>`;
  const planks = d.floor === "lys" || d.floor === "mork" || d.floor === "scene";
  const fl2 = d.floor === "scene" ? `<rect width="200" height="36" fill="${floor[1]}"/><path d="M0 35 h200 M120 0 v36" stroke="${shade(floor[1], 0.7)}" stroke-width="3"/>` : d.floor === "regnbue" ? `<rect width="40" height="40" fill="#F7B5CF"/><rect x="0" y="0" width="20" height="20" fill="#C7E6FF"/><rect x="20" y="20" width="20" height="20" fill="#FFF0B8"/>` : d.floor === "graes" ? `<rect width="40" height="40" fill="${floor[1]}"/><path d="M6 30 l3 -8 3 8 M24 14 l3 -8 3 8" stroke="${shade(floor[1], 0.8)}" stroke-width="2" fill="none"/>` : fl;
  return `<defs>${pat ? `<pattern id="pl-wp" width="${p === "skyer" ? 80 : 60}" height="60" patternUnits="userSpaceOnUse">${pat}</pattern>` : PX ? `<pattern id="pl-wp" width="${PX[2]}" height="${PX[3]}" patternUnits="userSpaceOnUse">${PX[1](c, dk, lt)}</pattern>` : ""}<pattern id="pl-fl" width="${planks ? 200 : d.floor === "tern" ? 80 : 40}" height="${planks ? 36 : 40}" patternUnits="userSpaceOnUse">${fl2}</pattern>
    <radialGradient id="pl-g"><stop offset="0" stop-color="#FFE8A3" stop-opacity=".9"/><stop offset="1" stop-color="#FFE8A3" stop-opacity="0"/></radialGradient></defs>`;
}
function sky(ctx) {
  const el = ctx.hass.states["sun.sun"]?.attributes?.elevation ?? 20;
  return el > 6 ? ["#8FD3FF", "#D8F1FF", "day"] : el > -4 ? ["#FF9E7A", "#FFD39E", "dusk"] : ["#1B2150", "#36407A", "night"];
}
/* The child's real room in the house drawing, and its lights. */
function realLights(ctx, m) {
  const rooms = ctx.data.house?.rooms || [];
  const r = rooms.find((x) => x.kid === m.id) || rooms.find((x) => new RegExp(`(^|[^a-zæøå])${m.name.split(" ")[0]}`, "i").test(x.name || ""));
  if (!r) return [];
  const isGroup = (id) => Array.isArray(ctx.hass.states[id]?.attributes?.entity_id);
  const inArea = r.area ? ctx.entities("light").filter((id) => ctx.area(id) === r.area) : [];
  const single = inArea.filter((id) => !isGroup(id));
  const list = single.length ? single : inArea;
  return list.length ? list : r.light && ctx.hass.states[r.light] ? [r.light] : [];
}
/* What floats in the room: the routine cards for now, the day's missions and homework. */
function bubbles(ctx, m) {
  const out = [];
  if (ctx.on("board") && ctx.feature(m, "board")) {
    const now = Kids.routineMissions ? Kids.routineMissions(ctx, m.id).find((x) => !x.done && hourIn(x.slot)) : null;
    const B = ctx.data.routines?.boards?.[m.id] || {}, done = ctx.data.board_done?.[m.id] || [];
    if (now)
      (B[now.slot] || []).forEach((cid, i) => {
        if (done.includes(`${now.slot}:${i}`)) return;
        const c = (Kids.RCARDS || []).find((x) => x[0] === cid) || (ctx.data.routines?.cards || []).find((x) => x[0] === cid) || [cid, cid, "⭐"];
        out.push({ kind: "card", id: `${now.slot}:${i}`, em: c[2], label: c[1], slot: now.slot, i });
      });
  }
  const iso = new Date().toISOString().slice(0, 10), dt = ctx.data.done_today || {};
  if (ctx.feature(m, "missions"))
    for (const x of ctx.missionsOn(m))
      if (!(`${x.id}:${m.id}` in dt)) out.push({ kind: "mission", id: x.id, em: x.emoji || "⭐", label: x.title, pts: x.points });
  for (const x of Kids.homeworkFor ? Kids.homeworkFor(ctx, m.id) : []) if (!(`${x.id}:${m.id}` in dt)) out.push({ kind: "homework", id: x.id, em: "✏️", label: x.t });
  void iso;
  return out.slice(0, 9);
}
const hourIn = (slot) => {
  const h = new Date().getHours() + new Date().getMinutes() / 60, hh = h < 5 ? h + 24 : h;
  return { morgen: [5, 12], eftermiddag: [12, 17.5], aften: [17.5, 29] }[slot]?.[0] <= hh && hh < ({ morgen: [5, 12], eftermiddag: [12, 17.5], aften: [17.5, 29] }[slot]?.[1] ?? 0);
};

/* The room the child is in: the bedroom itself (the playroom data), or one of the rooms they have opened. */
const isSpace = (id) => SPACES.some((x) => x.id === id);
const visitKid = (id) => (String(id).startsWith("visit:") ? id.slice(6) : "");
/* Where the child is: their room, one of their own rooms (hule …), a sibling's room (visit:<id>) or a place of the
   world (the house's rooms h:<id>, the garden, the areas). */
function spaceId() {
  const id = ST.d.space || "vaerelse", ctx = ST.ctx;
  if (id === "vaerelse" || isSpace(id)) return id;
  if (ctx && visitKid(id) && ctx.member(visitKid(id)) && visitKid(id) !== ST.kid) return id;
  if (ctx && World.place(ctx, id)) return id;
  return "vaerelse";
}
const placeOf = (ctx, id) => (isSpace(id) || id === "vaerelse" || visitKid(id) ? null : World.place(ctx, id));
/* The level a place opens at. */
function levelFor(id) {
  const sp = SPACES.find((x) => x.id === id);
  if (sp) return sp.lvl;
  const pl = World.PLACES[id];
  return pl ? World.AREAS.find((a) => a.id === pl.area)?.lvl || 1 : 1;
}
/* The key others see us at (live play): our own rooms are ours, the world's places are shared. */
function presenceKey(id = spaceId()) {
  if (id === "vaerelse") return `room:${ST.kid}`;
  if (visitKid(id)) return `room:${visitKid(id)}`;
  if (isSpace(id)) return `${id}:${ST.kid}`;
  return id;
}
function R() {
  const id = spaceId();
  if (id === "vaerelse") return ST.d;
  if (visitKid(id)) {
    const sib = ST.ctx.member(visitKid(id));
    return { ...(sib.playroom || defaults(sib)), ro: true };
  }
  const all = (ST.d.spaces ||= {});
  const pl = placeOf(ST.ctx, id);
  if (pl && !all[id]) all[id] = { items: (pl.decor || []).map(([k, x, y], i) => ({ id: `w${i}`, k, x, y })), npc: Object.fromEntries((pl.npcs || []).map(([n, x, y]) => [n, [x, y]])) };
  // A new room comes with a few things from the start pack.
  const start = { hule: [["rug", 500, 600], ["beanbag", 250, 580], ["teddy", 330, 590], ["moon", 160, 300]], trae: [["rug", 520, 600], ["plant", 120, 590], ["wallshelf", 300, 250], ["ball", 760, 600]], rumstation: [["moon", 240, 320], ["blocks", 820, 600]], scene: [["guitar", 820, 600]] }[id] || [];
  const r = (all[id] ||= { items: start.map(([k, x, y], i) => ({ id: `${id}${i}`, k, x, y })) });
  r.items ||= [];
  return r;
}
/* The walls, window and floor of the other rooms. The window always shows the real sky. */
function backdrop(id, s0, s1, tod) {
  const win = (x, y, rr) => `<clipPath id="pl-wc"><circle cx="${x}" cy="${y}" r="${rr}"/></clipPath><circle cx="${x}" cy="${y}" r="${rr + 14}" fill="#fff" ${S()}/><g clip-path="url(#pl-wc)"><rect x="${x - rr}" y="${y - rr}" width="${rr * 2}" height="${rr * 2}" fill="url(#pl-sky)"/>${tod === "night" ? [[-30, -20], [20, -40], [40, 20], [-10, 30]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="3" fill="#fff" class="pl-twinkle"/>`).join("") : `<circle cx="${x + 30}" cy="${y - 26}" r="20" fill="#FFE066"/>`}</g>`;
  const sky = `<linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s0}"/><stop offset="1" stop-color="${s1}"/></linearGradient>`;
  if (id === "hule")
    return `${sky}<rect width="${W}" height="${H}" fill="#5B3A6E"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M500 -10 L${-120 + i * 250} ${FLOOR + 10}" stroke="#4A2D5C" stroke-width="10" fill="none"/>`).join("")}
      <path d="M760 ${FLOOR} L860 120 L960 ${FLOOR}Z" fill="url(#pl-sky)" ${S()}/><path d="M760 ${FLOOR} L860 120 L820 ${FLOOR}Z" fill="#7B4F8E" ${S()}/>
      <path d="M40 60 Q260 140 500 70 Q740 140 960 60" fill="none" stroke="#7A6A8A" stroke-width="3"/>${Array.from({ length: 14 }, (_, i) => {
        const x = 60 + i * 66, y = 70 + Math.sin((i / 13) * Math.PI * 2) * 26 + 24;
        return `<g class="pl-lamp"><circle cx="${x}" cy="${y}" r="16" class="pl-glow on" fill="#FFE8A3"/><circle cx="${x}" cy="${y}" r="7" fill="${["#FFE066", "#FF8FA3", "#9BE7FF"][i % 3]}"/></g>`;
      }).join("")}
      <rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="#8C5E9E"/>${[120, 330, 560, 800].map((x, i) => `<ellipse cx="${x}" cy="${FLOOR + 40 + (i % 2) * 30}" rx="110" ry="26" fill="${["#9B5DE5", "#F15BB5", "#4D96FF", "#FFB347"][i]}" opacity=".55"/>`).join("")}`;
  if (id === "trae")
    return `${sky}<rect width="${W}" height="${FLOOR}" fill="#C98B55"/>${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 80} 0 V${FLOOR}" stroke="#A9764C" stroke-width="4"/><circle cx="${i * 80 + 40}" cy="${30 + (i % 3) * 140}" r="4" fill="#8B5A2B"/>`).join("")}
      ${win(680, 190, 110)}<path d="M560 190 H800 M680 70 V310" stroke="${OL}" stroke-width="10"/>
      <path d="M-10 120 Q120 90 220 150 L240 130" fill="none" stroke="#8B5A2B" stroke-width="30" stroke-linecap="round"/>${[[60, 100], [130, 120], [200, 140]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y - 20}" rx="34" ry="18" fill="${i % 2 ? "#6BCB77" : "#5A9E5F"}" ${S()}/>`).join("")}
      <path d="M0 ${FLOOR - 16} H${W}" stroke="#8B5A2B" stroke-width="16"/><rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="#A9764C"/>${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${FLOOR + 36 * (i + 1)} H${W}" stroke="#8B5A2B" stroke-width="3"/>`).join("")}
      <rect x="430" y="${FLOOR + 60}" width="140" height="70" rx="8" fill="#5A3A20" ${S()}/><path d="M460 ${FLOOR + 60} V${H} M540 ${FLOOR + 60} V${H} M460 ${FLOOR + 90} H540 M460 ${FLOOR + 120} H540" stroke="#E9C46A" stroke-width="6"/>`;
  if (id === "rumstation")
    return `<rect width="${W}" height="${FLOOR}" fill="#3A4466"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 170 + 6}" y="10" width="158" height="${FLOOR - 40}" rx="10" fill="#434E73" stroke="#2B3352" stroke-width="4"/>${[20, FLOOR - 50].map((y) => `<circle cx="${i * 170 + 22}" cy="${y}" r="5" fill="#9AA4BA"/><circle cx="${i * 170 + 148}" cy="${y}" r="5" fill="#9AA4BA"/>`).join("")}`).join("")}
      <circle cx="660" cy="190" r="136" fill="#CFD6E6" ${S()}/><circle cx="660" cy="190" r="116" fill="#0B1030" ${S()}/>${[[-80, -40], [40, -80], [70, 50], [-40, 70], [10, 10], [-90, 30], [90, -20]].map(([a, b]) => `<circle cx="${660 + a}" cy="${190 + b}" r="${2 + ((a + b) & 1)}" fill="#fff" class="pl-twinkle"/>`).join("")}<circle cx="620" cy="230" r="46" fill="#4D96FF" ${S()}/><path d="M590 214 q20 -10 30 6 q-6 20 -26 14z M630 250 q18 -6 22 10" fill="#6BCB77" stroke="${OL}" stroke-width="3"/>
      ${[120, 220, 320].map((x, i) => `<circle cx="${x}" cy="90" r="9" fill="${["#FF6B6B", "#6BCB77", "#FFD93D"][i]}" class="pl-blink" style="animation-delay:${-i * 0.6}s"/>`).join("")}
      <rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="#7A849E"/>${Array.from({ length: 25 }, (_, i) => `<path d="M${i * 40} ${FLOOR} V${H}" stroke="#646E88" stroke-width="3"/>`).join("")}<path d="M0 ${FLOOR} H${W}" stroke="#FFD93D" stroke-width="8" stroke-dasharray="30 20"/>`;
  if (id === "scene")
    return `<rect width="${W}" height="${H}" fill="#1B1530"/>${[[200, "#F15BB5"], [500, "#FFE066"], [800, "#00BBF9"]].map(([x, c]) => `<path d="M${x} -10 L${x - 150} ${FLOOR + 40} H${x + 150}Z" fill="${c}" opacity=".16" class="pl-beam"/>`).join("")}
      <path d="M0 0 H150 Q120 220 160 ${FLOOR} H0Z" fill="#D9473B" ${S()}/><path d="M${W} 0 H${W - 150} Q${W - 120} 220 ${W - 160} ${FLOOR} H${W}Z" fill="#D9473B" ${S()}/>${[40, 80, 120].map((x) => `<path d="M${x} 0 Q${x - 10} 220 ${x + 10} ${FLOOR}" stroke="#B5352B" stroke-width="5" fill="none"/><path d="M${W - x} 0 Q${W - x + 10} 220 ${W - x - 10} ${FLOOR}" stroke="#B5352B" stroke-width="5" fill="none"/>`).join("")}
      <path d="M0 0 H${W} V50 Q${W / 2} 90 0 50Z" fill="#B5352B" ${S()}/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${100 + i * 100}" cy="${130 + (i % 2) * 20}" r="3" fill="#fff" class="pl-twinkle" style="animation-delay:${-i * 0.4}s"/>`).join("")}
      <rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="#8B5A2B"/>${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${FLOOR + 36 * (i + 1)} H${W}" stroke="#6E4520" stroke-width="3"/>`).join("")}<path d="M0 ${FLOOR} H${W}" stroke="#FFD93D" stroke-width="6"/>${Array.from({ length: 12 }, (_, i) => `<g class="pl-lamp"><circle cx="${40 + i * 84}" cy="${FLOOR + 6}" r="10" class="pl-glow on" fill="#FFE8A3"/><circle cx="${40 + i * 84}" cy="${FLOOR + 6}" r="5" fill="#FFE066"/></g>`).join("")}`;
  return "";
}

/* The others in the place: its characters, the family at home, a sibling in their own room, and the siblings who
   are playing right now (live). Each is [y, svg] to sort with the things. */
function people(ctx, m, sid, room, pl) {
  const out = [];
  const npcAt = room.npc || {};
  for (const [id, pos] of Object.entries(npcAt)) {
    const N = World.NPCS[id];
    if (!N) continue;
    out.push([pos[1], `<g class="pl-npc" data-pl="npc" data-id="${esc(id)}" transform="translate(${pos[0]} ${pos[1]}) scale(.82)"><ellipse cx="0" cy="0" rx="56" ry="10" fill="rgba(0,0,0,.14)"/><g class="pl-body" style="animation-delay:${-(id.length % 5) * 0.4}s">${charSvg(N[3], ST.npcMood?.[id] || "", avatarSvg)}</g></g>`]);
  }
  const key = presenceKey(sid), live = new Set();
  for (const [pid, pe] of Object.entries(ST.peers || {})) {
    if (pid === m.id || pe.space !== key || Date.now() - (pe.seen || 0) > 45000) continue;
    live.add(pid);
    out.push([pe.y || 560, `<g class="pl-peer" data-pl="peer" data-id="${esc(pid)}" transform="translate(${pe.x || 500} ${pe.y || 560})"><ellipse cx="0" cy="0" rx="56" ry="10" fill="rgba(0,0,0,.14)"/><g class="pl-body${pe.emote ? " jump wave" : ""}">${avatarSvg(pe.me || defaults(ctx.member(pid) || { name: "x" }).me, pe.mood || "")}</g><text y="-262" text-anchor="middle" class="pl-petname">${esc(ctx.member(pid)?.name || "")}</text></g>`]);
  }
  // A sibling at home in their own room, and the family in the house's living rooms.
  const vk = visitKid(sid);
  const fam = vk ? [ctx.member(vk)].filter(Boolean) : pl && pl.area === "hjem" && ["living", "kitchen"].includes(pl.look) ? ctx.members().filter((x) => x.id !== m.id && x.role !== "child") : [];
  fam.forEach((x, i) => {
    if (live.has(x.id)) return;
    const me = x.playroom?.me || familyLook(x), px = vk ? x.playroom?.ax || 640 : 700 + i * 140, py = vk ? x.playroom?.ay || 590 : 600;
    out.push([py, `<g class="pl-npc pl-fam" data-pl="fam" data-id="${esc(x.id)}" transform="translate(${px} ${py})"><ellipse cx="0" cy="0" rx="56" ry="10" fill="rgba(0,0,0,.14)"/><g class="pl-body">${avatarSvg(me, "")}</g><text y="-262" text-anchor="middle" class="pl-petname">${esc(x.name)}</text></g>`]);
  });
  return out;
}
/* A grown-up's look, made from their colour until they have dressed their own avatar. */
function familyLook(x) {
  const n = [...String(x.name || "x")].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
  return { skin: SKINS[n % 3], hair: ["kort", "lang", "pjusk", "hale", "knold", "kroller"][(n >> 3) % 6], hairc: HAIRC[(n >> 6) % 5], top: x.color || "#6E4AFF", bottom: ["#3A3A55", "#4D96FF", "#5B3A21"][(n >> 9) % 3], extra: (n >> 11) % 3 ? "ingen" : "briller" };
}
function stage(ctx, m) {
  const d = ST.d, room = R(), sid = spaceId(), [s0, s1, tod] = sky(ctx), lights = sid === "vaerelse" ? realLights(ctx, m) : [], lit = lights.some((id) => ctx.hass.states[id]?.state === "on");
  const happy = bubbles(ctx, m).length < 3, pl = placeOf(ctx, sid), vk = visitKid(sid), dd = vk ? room : d;
  let s = patternDefs(dd);
  if (sid === "vaerelse" || vk) {
    s += `<rect width="${W}" height="${FLOOR}" fill="${dd.wall?.p && dd.wall.p !== "ren" ? "url(#pl-wp)" : wallFill(dd)}"/><rect y="${FLOOR - 16}" width="${W}" height="16" fill="#fff" ${S()}/>`;
    s += `<rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="url(#pl-fl)"/>`;
    // the window shows the real sky
    s += `<g class="pl-win"><rect x="560" y="70" width="230" height="200" rx="14" fill="#fff" ${S()}/><linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s0}"/><stop offset="1" stop-color="${s1}"/></linearGradient><rect x="574" y="84" width="202" height="172" rx="6" fill="url(#pl-sky)"/>${
      tod === "night" ? `<circle cx="720" cy="130" r="22" fill="#FFF6C9"/><circle cx="730" cy="122" r="20" fill="${s0}"/>${[[600, 110], [640, 150], [690, 100], [750, 200], [610, 210]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" class="pl-twinkle"/>`).join("")}` : `<circle cx="720" cy="130" r="26" fill="#FFE066" ${tod === "dusk" ? 'opacity=".8"' : ""}/><g class="pl-cloud"><ellipse cx="630" cy="150" rx="34" ry="14" fill="#fff"/><ellipse cx="650" cy="140" rx="22" ry="16" fill="#fff"/></g>`
    }<path d="M675 84 v172 M574 170 h202" ${S()} fill="none"/><path d="M560 60 h230" stroke="#FF6B6B" stroke-width="16" stroke-linecap="round"/></g>`;
    // the light switch for the real lights
    if (lights.length) s += `<g class="pl-switch${lit ? " on" : ""}" data-pl="light" role="button" aria-label="${esc(ctx.t("Lyset i dit værelse"))}"><rect x="500" y="210" width="40" height="60" rx="8" fill="#fff" ${S()}/><rect x="510" y="${lit ? 222 : 240}" width="20" height="20" rx="5" fill="${lit ? "#FFD93D" : "#CFCFE0"}" ${S("stroke-width=\"3\"")}/></g>`;
  } else if (pl) s += pl.bg(s0, s1, tod);
  else s += backdrop(sid, s0, s1, tod);
  // things, back to front
  const drawItem = (it) => {
    const T = CAT[it.k];
    if (!T) return "";
    const sc = it.s || 1, sel = ST.build && ST.sel === it.id;
    return `<g class="pl-it${T.cat === "lys" ? " lampit" : ""}${it.on ? " lit" : ""}${sel ? " sel" : ""}" data-pl="item" data-id="${esc(it.id)}" transform="translate(${it.x} ${it.y}) scale(${it.f ? -sc : sc} ${sc})">${T.d(it.c || T.c)}${sel ? `<rect x="-${T.w / 2 + 12}" y="-${T.h + 12}" width="${T.w + 24}" height="${T.h + 24}" rx="16" class="pl-selbox"/>` : ""}</g>`;
  };
  const items = room.items || [];
  const isWall = (it) => wallK(it.k);
  const wallIt = items.filter(isWall), flat = items.filter((it) => !isWall(it) && CAT[it.k]?.flat === 1);
  s += wallIt.map(drawItem).join("") + flat.map(drawItem).join("");
  const actors = [
    ...items.filter((it) => CAT[it.k] && !isWall(it) && CAT[it.k].flat !== 1).map((it) => [it.y, drawItem(it)]),
    [d.ay, `<g class="pl-me" data-pl="me" transform="translate(${d.ax} ${d.ay})"><ellipse cx="0" cy="0" rx="56" ry="10" fill="rgba(0,0,0,.14)"/><g class="pl-body">${avatarSvg(d.me, ST.mood || (tod === "night" && !lit && sid === "vaerelse" ? "sleep" : ""))}</g></g>`],
    ...people(ctx, m, sid, room, pl),
    ...(m.pet && ctx.feature(m, "pet") ? [[d.py, `<g class="pl-pet${happy ? " happy" : ""}" data-pl="pet" transform="translate(${d.px} ${d.py}) scale(.8)"><ellipse cx="0" cy="0" rx="60" ry="10" fill="rgba(0,0,0,.14)"/><g class="pl-petb">${petInRoom(m, happy)}</g><text y="-150" text-anchor="middle" class="pl-petname">${esc(m.pet.name || "")}</text></g>`]] : []),
  ].sort((a, b) => a[0] - b[0]);
  s += actors.map((a) => a[1]).join("");
  // night: dark unless the lights are on (the bedroom and the tree house have real windows)
  const dark = sid === "vaerelse" || sid === "trae" || !!vk || (pl && pl.area === "hjem");
  s += `<rect width="${W}" height="${H}" class="pl-dark" fill="#0B1030" opacity="${dark && tod === "night" && !lit ? 0.42 : dark && tod === "dusk" && !lit ? 0.18 : 0}" pointer-events="none"/>`;
  if (lit) s += `<rect width="${W}" height="${H}" fill="#FFD27A" opacity=".08" pointer-events="none"/>`;
  // the treasure chest with the coins of the day
  const g = game(ctx, m);
  if (!ST.build && ctx.data.today && g.daily !== ctx.data.today)
    s += `<g class="pl-chest" data-pl="daily" role="button" aria-label="${esc(ctx.t("Dagens mønter"))}" transform="translate(${sid === "vaerelse" ? 420 : 880} ${H - 30})"><ellipse cx="0" cy="4" rx="54" ry="9" fill="rgba(0,0,0,.18)"/>${CAT.skattekiste ? CAT.skattekiste.d("#C98B55") : ""}<g class="pl-sparkle"><path d="M-40 -110 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z M44 -96 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFE066" stroke="${OL}" stroke-width="2"/></g></g>`;
  // the bubbles to tap
  const B = ST.build ? [] : bubbles(ctx, m);
  s += B.map((b, i) => {
    const x = 72 + (i % 5) * 106 + (i >= 5 ? 52 : 0), y = 66 + (i >= 5 ? 124 : 0), col = b.kind === "card" ? "#4D96FF" : b.kind === "homework" ? "#6BCB77" : "#FFB347";
    return `<g class="pl-bub" data-pl="bub" data-kind="${b.kind}" data-id="${esc(b.id)}" role="button" aria-label="${esc(b.label)}" style="animation-delay:${-i * 0.7}s" transform="translate(${x} ${y})"><circle r="40" fill="#fff" stroke="${col}" stroke-width="7"/><text y="14" text-anchor="middle" font-size="38">${esc(b.em)}</text><text y="64" text-anchor="middle" class="pl-bl">${esc(b.label.length > 11 ? b.label.slice(0, 10) + "…" : b.label)}</text>${b.pts ? `<g transform="translate(30 -30)"><circle r="15" fill="#FFD93D" ${S("stroke-width=\"3\"")}/><text y="6" text-anchor="middle" class="pl-pts">${b.pts}</text></g>` : ""}</g>`;
  }).join("");
  return s;
}
const ITEMW = (k) => ({ bed: 300, bunk: 230, desk: 220, chair: 72, shelf: 180, wardrobe: 170, beanbag: 140, rug: 340, floorlamp: 90, tablelamp: 60, plant: 100, teddy: 64, ball: 52, tipi: 220, aquarium: 132, guitar: 80, dollhouse: 192, car: 96, blocks: 84, gaming: 100, poster: 100, rainbow: 124, clock: 72, garland: 320, wallshelf: 160, mirror: 80, photo: 92, moon: 80 })[k] || 100;
const ITEMH = (k) => ({ bed: 150, bunk: 330, desk: 130, chair: 130, shelf: 240, wardrobe: 290, beanbag: 96, rug: 40, floorlamp: 236, tablelamp: 80, plant: 150, teddy: 112, ball: 52, tipi: 246, aquarium: 90, guitar: 180, dollhouse: 190, car: 52, blocks: 80, gaming: 170, poster: 130, rainbow: 92, clock: 72, garland: 60, wallshelf: 66, mirror: 140, photo: 70, moon: 80 })[k] || 100;

/* ------------------------------------------------------------------ the catalogue: the start pack and the packs
   One shape for every thing: { n: name, cat, flat, c: colour, w, h, d: draw(c), price, pack }. */
const CAT = {};
for (const [k, v] of Object.entries(ITEMS)) CAT[k] = { n: v[0], cat: v[1], flat: v[2], c: v[3], w: ITEMW(k), h: ITEMH(k), d: v[4], price: 0, pack: "start" };
for (const pk of PACKS) for (const k of pk.items) if (THINGS[k]) {
  const v = THINGS[k];
  CAT[k] = { n: v[0], cat: v[1], c: v[2], w: v[3], h: v[4], d: v[5], price: v[6] || 20, flat: v[7] || 0, pack: pk.id };
}
for (const [k, v] of Object.entries(WORLD_THINGS)) CAT[k] = { n: v[0], cat: v[1], c: v[2], w: v[3], h: v[4], d: v[5], price: 0, flat: v[7] || 0, pack: "world" };
const LOOKS = { p: [PATTERNS_X, 25], f: [FLOORS_X, 20], x: [EXTRAS_X, 30] };
/* A thing or a look ("p:…" wallpaper, "f:…" floor, "x:…" to wear): its name and price. */
function info(id) {
  if (CAT[id]) return { n: CAT[id].n, price: CAT[id].price };
  const [t, k] = String(id).split(":"), L = LOOKS[t];
  return L && L[0][k] ? { n: L[0][k][0], price: L[1] } : { n: id, price: 0 };
}
const packOf = (id) => PACKS.find((pk) => pk.items.includes(id));
const game = (ctx, m) => ({ coins: 0, xp: 0, owned: [], ...(ctx.data.game?.[m.id] || {}) });
/* What the child has: the start pack, what they have unlocked, and the gifts of their level. */
function ownedSet(ctx, m) {
  const g = game(ctx, m), lv = levelOf(g.xp), set = new Set(g.owned);
  for (const [n, id] of Object.entries(LEVEL_THINGS)) if (lv >= +n) set.add(id);
  return set;
}
const has = (owned, id) => (CAT[id] ? CAT[id].pack === "start" || owned.has(id) : owned.has(id));
/* A season pack is in the shop around its occasion (the ones the family decorates for). */
function seasonOpen(ctx, pk) {
  if (!pk.season) return { open: true };
  const set = ctx.data.settings || {};
  if (set.decor?.[pk.season] === false) return { open: false };
  const o = occasions(set, ctx.data.family).find((x) => x[0] === pk.season);
  if (!o) return { open: false };
  const t = dayNumber(new Date()), Y = new Date().getFullYear(), [pre, post] = SEASON_DAYS[pk.season] || [10, 2];
  let next = null;
  for (const y of [Y - 1, Y, Y + 1])
    for (const [a, b] of o[4](y)) {
      if (t >= a - pre && t <= b + post) return { open: true, until: b + post, day: a };
      if (a - pre > t && (next == null || a - pre < next)) next = a - pre;
    }
  return { open: false, next };
}
const fromDay = (n) => new Date(n * 864e5);
/* A small picture of a thing or a look, for the drawer and the shop. */
function thumb(id, me) {
  if (CAT[id]) {
    const T = CAT[id];
    return `<svg viewBox="${-T.w / 2 - 14} ${-T.h - 14} ${T.w + 28} ${T.h + 28}" aria-hidden="true">${T.d(T.c)}</svg>`;
  }
  const [t, k] = String(id).split(":");
  if (t === "p") {
    const P = PATTERNS_X[k], c = "#C7E6FF";
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><defs><pattern id="th-${k}" width="${P[2]}" height="${P[3]}" patternUnits="userSpaceOnUse">${P[1](c, shade(c, 0.85), shade(c, 1.08))}</pattern></defs><rect x="4" y="4" width="112" height="82" rx="12" fill="url(#th-${k})" ${S()}/></svg>`;
  }
  if (t === "f") return `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M4 40 L30 14 H90 L116 40 V80 Q116 86 110 86 H10 Q4 86 4 80Z" fill="${FLOORS_X[k][1]}" ${S()}/></svg>`;
  if (t === "x") return `<svg viewBox="-110 -340 220 220" aria-hidden="true">${avatarSvg({ ...(me || {}), extra: k })}</svg>`;
  return "";
}
const wallK = (k) => !!CAT[k] && (CAT[k].cat === "væg" || FEST_WALL.has(k));
const COIN = `<svg viewBox="0 0 24 24" class="pl-coin" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#FFD93D" stroke="#2B2340" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="none" stroke="#E0A800" stroke-width="2"/></svg>`;

/* ------------------------------------------------------------------ the page */
function render(ctx) {
  const m = ctx.me;
  if (!m) return `<section class="card"><p class="t-sub">${esc(ctx.t("Vælg, hvem du er."))}</p></section>`;
  if (!ST || ST.kid !== m.id) ST = { kid: m.id, d: JSON.parse(JSON.stringify(m.playroom || defaults(m))), sel: null, build: false, shop: false, tab: "mob", peers: {} };
  ST.ctx = ctx;
  if (visitKid(spaceId())) ST.build = false;
  const t = ctx.t, B = bubbles(ctx, m), pts = ctx.points(m.id), sid = spaceId(), lights = sid === "vaerelse" ? realLights(ctx, m) : [], lit = lights.some((id) => ctx.hass.states[id]?.state === "on");
  const g = game(ctx, m), lv = levelOf(g.xp), lo = LEVELS[lv - 1] || 0, hi = LEVELS[lv];
  const prog = hi ? Math.round(((g.xp - lo) / (hi - lo)) * 100) : 100;
  const sub = ST.shop ? t("Byt dine mønter til nye ting. Mønter får du for rutiner, opgaver og lektier.") : ST.build ? t("Træk tingene derhen, hvor de skal stå. Tryk på noget for at ændre det.") : B.length ? t("Tryk på boblerne, når du har gjort det.") : t("Alt er klaret lige nu. Godt gået!");
  const head = `<div class="pl-head"><div><span class="eyebrow">${esc(t("Mit værelse"))}</span><h2 class="h2">${esc(t("Hej {name}!", { name: m.name }))}</h2><span class="t-sub">${esc(sub)}</span></div>
    <div class="pl-acts"><span class="pl-pill pl-coins" title="${esc(t("Mønter"))}">${COIN}<b class="num">${g.coins}</b></span>
      <span class="pl-lv" title="${esc(hi ? t("{n} XP til næste niveau", { n: hi - g.xp }) : t("Højeste niveau"))}"><b>${esc(t("Niveau {n}", { n: lv }))}</b><i style="--p:${prog}%"></i></span>
      ${ctx.feature(m, "points") ? `<span class="pl-pill pl-pts-pill" title="${esc(t("Point"))}">${svg("pstar")}<b class="num">${pts}</b></span>` : ""}</div></div>
    <div class="pl-bar">${ST.shop ? `<button class="btn soft" data-pl="shop">${svg("back")}${esc(t("Tilbage til værelset"))}</button>` : `<div class="pl-where"><button class="btn${ST.map ? "" : " soft"} pl-mapb" data-pl="map">${ST.map ? svg("back") : "🗺️"}${esc(ST.map ? t("Tilbage") : t("Kort"))}</button>${ST.map ? "" : `<span class="pl-here">${esc(placeName(ctx, sid))}</span>`}</div>
      <div class="pl-bar-b">${lights.length && !ST.build && !ST.map ? `<button class="btn soft" data-go="mitlys" aria-label="${esc(t("Lys og stemning"))}">${svg("bulb")}<span class="pl-hide-s">${esc(t("Lys og stemning"))}</span></button>` : ""}<button class="btn soft pl-shopb" data-pl="shop">${COIN}<span class="pl-hide-s">${esc(t("Butikken"))}</span></button>${visitKid(sid) || ST.map ? "" : `<button class="btn${ST.build ? "" : " soft"}" data-pl="build">${svg(ST.build ? "check" : "edit")}${esc(ST.build ? t("Færdig") : t("Byg"))}</button>`}<button class="btn soft pl-fullb" data-pl="full" aria-label="${esc(ST.full ? t("Luk fuld skærm") : t("Fuld skærm"))}">${ST.full ? "✕" : "⛶"}</button></div>`}</div>`;
  if (ST.shop) return `<div class="pl" style="--pc:${esc(m.color)}">${head}${shop(ctx, m, g, lv)}</div>`;
  if (ST.map) {
    const peers = Object.entries(ST.peers || {}).filter(([id, pe]) => id !== m.id && Date.now() - (pe.seen || 0) < 45000).map(([id, pe]) => ({ ...pe, color: ctx.member(id)?.color }));
    const sibs = ctx.children().filter((k) => k.id !== m.id);
    return `<div class="pl" style="--pc:${esc(m.color)}">${head}<div class="pl-stagebox pl-mapbox"><svg id="pl-stage" class="pl-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("Kort"))}">${World.mapSvg(ctx, lv, sid, peers, t)}</svg></div>
      <div class="pl-mine"><b>${esc(t("Mine rum"))}</b>${[["vaerelse", "🛏️", t("Mit værelse"), 1], ...SPACES.filter((x) => x.id !== "vaerelse").map((x) => [x.id, x.em, t(x.n), x.lvl])].map(([id, em, n, l]) => `<button data-pl="go" data-k="${id}" aria-pressed="${sid === id}"${lv < l ? ` class="locked"` : ""}><span>${em}</span>${esc(n)}${lv < l ? `<small>🔒 ${l}</small>` : ""}</button>`).join("")}${sibs.map((k) => `<button data-pl="go" data-k="visit:${esc(k.id)}" aria-pressed="${sid === "visit:" + k.id}"><span>👋</span>${esc(t("Besøg {name}", { name: k.name }))}${Object.values(ST.peers || {}).some((pe) => pe.space === "room:" + k.id && Date.now() - (pe.seen || 0) < 45000) ? `<i class="pl-live"></i>` : ""}</button>`).join("")}</div></div>`;
  }
  const glow = lit || sid !== "vaerelse";
  return `<div class="pl${ST.full ? " full" : ""}" style="--pc:${esc(m.color)}">${ST.full && !ST.turnOk ? `<button class="pl-turn" data-pl="turnok"><i>📱</i>${esc(t("Vend skærmen, så er der mere plads til at lege"))}<small>${esc(t("Tryk for at spille på langs alligevel"))}</small></button>` : ""}${head}<div class="pl-stagebox${ST.build ? " build" : ""}"><svg id="pl-stage" class="${glow ? "on" : ""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("Dit værelse"))}">${stage(ctx, m)}</svg>${ST.build ? selTools(ctx) : ""}</div>${ST.build ? drawer(ctx, m) : ""}</div>`;
}
/* The name of where the child is. */
function placeName(ctx, id) {
  if (id === "vaerelse") return ctx.t("Mit værelse");
  if (visitKid(id)) return ctx.t("{name}s værelse", { name: ctx.member(visitKid(id))?.name || "" });
  const sp = SPACES.find((x) => x.id === id);
  if (sp) return `${sp.em} ${ctx.t(sp.n)}`;
  const pl = placeOf(ctx, id);
  return pl ? `${pl.em || ""} ${ctx.t(pl.n)}` : "";
}
/* Go somewhere: from the map or the room list. */
function goTo(ctx, key) {
  const lv = levelOf(game(ctx, ctx.me).xp), need = levelFor(key);
  if (lv < need) return ctx.toast(ctx.t("Det åbner på niveau {n}. Klar rutiner og opgaver for at komme dertil.", { n: need }));
  ST.d.space = key;
  ST.map = false;
  ST.build = false;
  ST.sel = null;
  // Arrive at the edge of the place, like walking in.
  ST.d.ax = 140;
  ST.d.ay = 590;
  save(ctx);
  redraw(ctx);
  publish(ctx);
}
/* The big moments: a new level, or a new thing bought. Shown once, as a sheet over the page. */
function showPop(ctx) {
  const m = ctx.me;
  if (!m || !ST || ST.kid !== m.id || ST.build || (ST.popEl && ST.popEl.isConnected)) return;
  const t = ctx.t, lv = levelOf(game(ctx, m).xp);
  let html = "";
  if (lv > (ST.d.lvl || 1)) {
    const gifts = (LEVEL_GIFTS[lv] || []).map((x) => t(x.includes(":") ? info(x).n : x));
    html = `<div class="pl-pop-badge">${lv}</div><h2>${esc(t("Niveau {n}!", { n: lv }))}</h2><p class="t-sub">${esc(gifts.length ? t("Nu har du åbnet: {things}", { things: gifts.join(", ") }) : t("Du bliver bedre og bedre. Bliv ved!"))}</p><div class="pl-pop-b"><button class="btn" data-close>${esc(t("Fedt!"))}</button></div>`;
    ST.d.lvl = lv;
    save(ctx);
  } else if (ST.got) {
    const id = ST.got, I = info(id);
    ST.got = null;
    html = `<div class="pl-pop-th">${thumb(id, ST.d.me)}</div><h2>${esc(t("Ny ting!"))}</h2><p class="t-sub">${esc(t("{name} er din nu.", { name: t(I.n) }))}</p><div class="pl-pop-b"><button class="btn soft" data-close>${esc(t("Senere"))}</button><button class="btn" data-act="play-place" data-k="${esc(id)}" data-close>${esc(id.startsWith("x:") ? t("Tag den på") : id.includes(":") ? t("Brug den nu") : t("Stil den ind nu"))}</button></div>`;
  }
  if (!html) return;
  const sh = ctx.sheet(`<div class="pl-pop-c" style="--pc:${esc(m.color)}">${html}</div>`, { cls: "pl-pop-sheet" });
  ST.popEl = sh.el;
}
function selTools(ctx) {
  const it = R().items.find((x) => x.id === ST.sel);
  if (!it || !CAT[it.k]) return `<div class="pl-tip">${esc(ctx.t("Vælg noget nedenfor, eller træk i tingene for at flytte dem."))}</div>`;
  return `<div class="pl-tools"><b>${esc(ctx.t(CAT[it.k].n))}</b><button data-pl="t-color" aria-label="${esc(ctx.t("Farve"))}"><i style="background:${esc(it.c || CAT[it.k].c)}"></i></button><button data-pl="t-flip" aria-label="${esc(ctx.t("Vend"))}">⇆</button><button data-pl="t-small" aria-label="${esc(ctx.t("Mindre"))}">−</button><button data-pl="t-big" aria-label="${esc(ctx.t("Større"))}">+</button><button data-pl="t-del" aria-label="${esc(ctx.t("Fjern"))}">${svg("trash")}</button></div>`;
}
function drawer(ctx, m) {
  const t = ctx.t, owned = ownedSet(ctx, m), sid = spaceId();
  const tabs = [["mob", "Møbler"], ["leg", "Legetøj"], ["lys", "Lamper"], ["væg", "På væggen"], ["fest", "Fest"], ...(sid === "vaerelse" ? [["tapet", "Tapet og gulv"]] : []), ["mig", "Mig"]];
  if (ST.tab === "tapet" && sid !== "vaerelse") ST.tab = "mob";
  const more = `<button class="pl-th pl-more" data-pl="shop"><span class="pl-more-ic">${COIN}</span><span>${esc(t("Flere ting i butikken"))}</span></button>`;
  const th = (k) => `<button class="pl-th" data-pl="add" data-k="${k}">${thumb(k)}<span>${esc(t(CAT[k].n))}</span></button>`;
  let body = "";
  if (ST.tab === "tapet") {
    const pats = [...Object.entries(PATTERNS), ...Object.entries(PATTERNS_X).filter(([k]) => owned.has("p:" + k)).map(([k, v]) => [k, v[0]])];
    const floors = [...Object.entries(FLOORS), ...Object.entries(FLOORS_X).filter(([k]) => owned.has("f:" + k))];
    body = `<div class="pl-row"><b>${esc(t("Væggen"))}</b>${Object.entries(WALLS).map(([k, c]) => `<button class="pl-sw" data-pl="wall" data-k="${k}" aria-pressed="${ST.d.wall?.c === k}" style="--c:${c}" aria-label="${esc(k)}"></button>`).join("")}</div>
      <div class="pl-row">${pats.map(([k, n]) => `<button class="pl-chip" data-pl="pat" data-k="${k}" aria-pressed="${(ST.d.wall?.p || "ren") === k}">${esc(t(n))}</button>`).join("")}</div>
      <div class="pl-row"><b>${esc(t("Gulvet"))}</b>${floors.map(([k, [n, c]]) => `<button class="pl-chip" data-pl="floor" data-k="${k}" aria-pressed="${ST.d.floor === k}"><i style="background:${c}"></i>${esc(t(n))}</button>`).join("")}<button class="pl-chip" data-pl="shop">${COIN}${esc(t("Flere"))}</button></div>`;
  } else if (ST.tab === "mig") {
    const me = ST.d.me;
    const sw = (key, list) => list.map((c) => `<button class="pl-sw" data-pl="me" data-f="${key}" data-k="${c}" aria-pressed="${me[key] === c}" style="--c:${c}" aria-label="${esc(c)}"></button>`).join("");
    const extras = [...Object.entries(EXTRAS), ...Object.entries(EXTRAS_X).filter(([k]) => owned.has("x:" + k)).map(([k, v]) => [k, v[0]])];
    body = `<div class="pl-row"><b>${esc(t("Hud"))}</b>${sw("skin", SKINS)}</div>
      <div class="pl-row"><b>${esc(t("Hår"))}</b>${Object.entries(HAIRS).map(([k, n]) => `<button class="pl-chip" data-pl="me" data-f="hair" data-k="${k}" aria-pressed="${me.hair === k}">${esc(t(n))}</button>`).join("")}</div>
      <div class="pl-row"><b>${esc(t("Hårfarve"))}</b>${sw("hairc", HAIRC)}</div>
      <div class="pl-row"><b>${esc(t("Trøje"))}</b>${sw("top", PAL)}</div>
      <div class="pl-row"><b>${esc(t("Bukser"))}</b>${sw("bottom", PAL)}</div>
      <div class="pl-row"><b>${esc(t("Ekstra"))}</b>${extras.map(([k, n]) => `<button class="pl-chip" data-pl="me" data-f="extra" data-k="${k}" aria-pressed="${(me.extra || "ingen") === k}">${esc(t(n))}</button>`).join("")}<button class="pl-chip" data-pl="shop">${COIN}${esc(t("Flere"))}</button></div>`;
  } else {
    const keys = Object.keys(CAT).filter((k) => (CAT[k].cat === ST.tab || (ST.tab === "mob" && CAT[k].cat === "pynt")) && has(owned, k));
    body = `<div class="pl-ths">${keys.map(th).join("")}${more}</div>${ST.tab === "fest" && !keys.length ? `<p class="t-sub">${esc(t("Til jul, påske, halloween og fødselsdage kommer der festpakker i butikken."))}</p>` : ""}`;
  }
  return `<section class="card pl-drawer"><div class="pl-tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" data-pl="tab" data-k="${k}" aria-selected="${ST.tab === k}">${esc(t(n))}</button>`).join("")}</div>${body}</section>`;
}

/* ------------------------------------------------------------------ the shop */
const packPrice = (owned, pk) => {
  const rest = pk.items.filter((id) => !has(owned, id));
  const sum = rest.reduce((a, id) => a + info(id).price, 0);
  return { rest, sum, price: rest.length > 1 ? Math.round((sum * 0.75) / 5) * 5 : sum };
};
function shop(ctx, m, g, lv) {
  const t = ctx.t, owned = ownedSet(ctx, m);
  if (ST.pack) {
    const pk = PACKS.find((x) => x.id === ST.pack);
    if (pk) return packPage(ctx, m, g, lv, owned, pk);
    ST.pack = null;
  }
  const card = (pk) => {
    const so = seasonOpen(ctx, pk), locked = lv < pk.lvl, { rest, price } = packPrice(owned, pk), n = pk.items.length - rest.length;
    const art = pk.items.filter((id) => CAT[id]).slice(0, 3).map((id) => `<span>${thumb(id)}</span>`).join("");
    const tag = locked ? `🔒 ${esc(t("Niveau {n}", { n: pk.lvl }))}` : pk.season && !so.open ? esc(so.next ? t("Kommer {date}", { date: ctx.fmt.date(fromDay(so.next), { day: "numeric", month: "long" }) }) : t("Kommer senere")) : !rest.length ? `✓ ${esc(t("Alle sammen"))}` : `${COIN}${price}`;
    return `<button class="pl-pack${locked || (pk.season && !so.open) ? " locked" : ""}${!rest.length ? " done" : ""}" data-pl="pack" data-k="${pk.id}"><span class="pl-pack-art">${art}</span><span class="pl-pack-t"><b>${pk.em} ${esc(t(pk.n))}</b><small>${esc(t("{n} af {total} ting", { n, total: pk.items.length }))}</small></span><span class="pl-pack-p">${tag}</span></button>`;
  };
  const now = PACKS.filter((pk) => pk.season && seasonOpen(ctx, pk).open);
  const packs = PACKS.filter((pk) => !pk.season).sort((a, b) => (lv < a.lvl) - (lv < b.lvl) || a.lvl - b.lvl);
  const later = PACKS.filter((pk) => pk.season && !seasonOpen(ctx, pk).open);
  return `<section class="pl-shop">
    ${now.length ? `<h3 class="pl-sh">${esc(t("Lige nu"))}</h3><div class="pl-packs now">${now.map(card).join("")}</div>` : ""}
    <h3 class="pl-sh">${esc(t("Pakker"))}</h3><div class="pl-packs">${packs.map(card).join("")}</div>
    <div class="card pl-earn"><b>${esc(t("Sådan får du mønter"))}</b><ul><li>${COIN}<span>${esc(t("Et rutinekort"))}</span><b>3</b></li><li>${COIN}<span>${esc(t("Hele rutinen"))}</span><b>+10</b></li><li>${COIN}<span>${esc(t("En opgave"))}</span><b>10</b></li><li>${COIN}<span>${esc(t("En lektie"))}</span><b>8</b></li><li>${COIN}<span>${esc(t("Skattekisten hver dag"))}</span><b>5</b></li></ul><small>${esc(t("Alle mønter, du får, giver også XP. Med mere XP stiger du i niveau og åbner nye rum og pakker."))}</small></div>
    ${later.length ? `<h3 class="pl-sh">${esc(t("Festpakker, der kommer igen"))}</h3><div class="pl-packs small">${later.map(card).join("")}</div>` : ""}
  </section>`;
}
function packPage(ctx, m, g, lv, owned, pk) {
  const t = ctx.t, so = seasonOpen(ctx, pk), locked = lv < pk.lvl || (pk.season && !so.open);
  const { rest, sum, price } = packPrice(owned, pk);
  // A season pack gives its first thing free while the occasion lasts.
  const gift = pk.season && so.open && !pk.items.some((id) => owned.has(id)) ? pk.items[0] : null;
  const row = (id) => {
    const mine = has(owned, id), I = info(id), cost = id === gift ? 0 : I.price, ask = ST.ask === id;
    return `<div class="pl-buy${mine ? " mine" : ""}"><span class="pl-buy-th">${thumb(id, ST.d.me)}</span><b>${esc(t(I.n))}</b>${mine ? `<span class="pl-own">✓ ${esc(t("Din"))}</span>` : locked ? `<span class="pl-own">🔒</span>` : `<button class="btn ${ask ? "" : "soft"} sm${g.coins < cost ? " poor" : ""}" data-pl="buy" data-k="${esc(id)}" data-cost="${cost}">${ask ? esc(t("Køb?")) : cost ? `${COIN}${cost}` : esc(t("Gratis"))}</button>`}</div>`;
  };
  const note = lv < pk.lvl ? t("Pakken åbner, når du når niveau {n}.", { n: pk.lvl }) : pk.season && !so.open ? t("Pakken kommer i butikken igen til {name}.", { name: t(pk.n) }) : pk.season && so.until ? t("I butikken til og med {date}.", { date: ctx.fmt.date(fromDay(so.until), { day: "numeric", month: "long" }) }) + (gift ? " " + t("Den første ting er en gave.") : "") : "";
  return `<section class="pl-shop"><button class="lnk pl-back" data-pl="packs">${svg("back")}${esc(t("Alle pakker"))}</button>
    <div class="card pl-packhead"><span class="pl-packem">${pk.em}</span><div><h3>${esc(t(pk.n))}</h3><p class="t-sub">${esc(t(pk.d))}</p>${note ? `<p class="pl-note">${esc(note)}</p>` : ""}</div>
      ${!locked && rest.length > 1 ? `<button class="btn${ST.ask === "pack:" + pk.id ? "" : " soft"}${g.coins < price ? " poor" : ""}" data-pl="buy" data-k="pack:${pk.id}" data-cost="${price}">${ST.ask === "pack:" + pk.id ? esc(t("Køb hele pakken?")) : `${esc(t("Hele pakken"))} ${COIN}${price}`}${sum > price && ST.ask !== "pack:" + pk.id ? `<small>${esc(t("spar {n}", { n: sum - price }))}</small>` : ""}</button>` : ""}</div>
    <div class="pl-buys">${pk.items.map(row).join("")}</div></section>`;
}

/* ------------------------------------------------------------------ doing things */
function redraw(ctx) {
  const box = ctx.root.querySelector(".pl-fs .pl") || ctx.root.querySelector(".pl");
  if (!box) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = render(ctx);
  box.replaceWith(tmp.firstElementChild);
  bind(ctx);
  showPop(ctx);
}
function save(ctx) {
  clearTimeout(ST.saveT);
  const kid = ST.kid, d = JSON.parse(JSON.stringify(ST.d));
  ST.saveT = setTimeout(async () => {
    try {
      await ctx.ws("prefs", { member: kid, prefs: { playroom: d } });
      const me = ctx.member(kid);
      if (me) me.playroom = d;
    } catch (err) {
      ctx.toast(String(err?.message || err));
    }
  }, 900);
}
const toSvg = (svgEl, e) => {
  const pt = svgEl.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
};
function confetti(ctx, x, y, color, big = false) {
  const svgEl = ctx.$("pl-stage");
  if (!svgEl) return;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "pl-burst");
  g.innerHTML = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return `<circle cx="${x}" cy="${y}" r="7" fill="${[color, "#FFD93D", "#6BCB77", "#F15BB5"][i % 4]}" style="--dx:${Math.cos(a) * 90}px;--dy:${Math.sin(a) * 90}px"/>`;
  }).join("");
  svgEl.appendChild(g);
  setTimeout(() => g.remove(), 900);
}
function walk(ctx, x, y) {
  const d = ST.d;
  setTimeout(() => publish(ctx), 50);
  d.ax = Math.max(60, Math.min(W - 60, x));
  d.ay = Math.max(FLOOR + 40, Math.min(H - 8, y));
  const me = ctx.root.querySelector(".pl-me");
  if (me) {
    me.classList.add("walking");
    me.setAttribute("transform", `translate(${d.ax} ${d.ay})`);
    setTimeout(() => me.classList.remove("walking"), 700);
  }
  save(ctx);
}
async function tapBubble(ctx, el) {
  const m = ctx.me, kind = el.dataset.kind, id = el.dataset.id;
  const tr = el.getAttribute("transform").match(/translate\(([\d.]+) ([\d.]+)\)/);
  confetti(ctx, +tr[1], +tr[2], m.color);
  coinPop(ctx, +tr[1], +tr[2], kind === "card" ? 3 : kind === "homework" ? 8 : 10);
  el.classList.add("pop");
  ST.mood = "wow";
  setTimeout(() => {
    ST.mood = "";
    redraw(ctx);
  }, 900);
  try {
    if (kind === "card") {
      const [slot, i] = id.split(":");
      const res = await ctx.ws("board", { member: m.id, slot, index: +i, done: true });
      (ctx.data.board_done ||= {})[m.id] = res.done;
    } else {
      const res = await ctx.ws("mission", { mission: id, member: m.id, done: true });
      ctx.data.done_today = { ...(ctx.data.done_today || {}), [`${id}:${m.id}`]: { at: new Date().toISOString() } };
      if (res?.points != null) ctx.data.points = { ...(ctx.data.points || {}), [m.id]: res.points };
    }
  } catch (err) {
    ctx.toast(String(err?.message || err));
  }
}
function bind(ctx) {
  const svgEl = ctx.$("pl-stage"), box = ctx.root.querySelector(".pl-fs .pl") || ctx.root.querySelector(".pl");
  if (!box || box._hv) return;
  box._hv = 1;
  // The shop has no room to drag in; its buttons are handled below.
  if (svgEl) bindStage(ctx, svgEl);
  bindButtons(ctx, box);
}
function bindStage(ctx, svgEl) {
  let drag = null;
  svgEl.addEventListener("pointerdown", (e) => {
    const t = e.target.closest("[data-pl]"), p = toSvg(svgEl, e);
    if (t?.dataset.pl === "go") return goTo(ctx, t.dataset.k);
    if (ST.map) return;
    if (!ST.build) {
      if (t?.dataset.pl === "npc") {
        const id = t.dataset.id, at = R().npc?.[id];
        if (!at) return;
        drag = { kind: "npc", id, el: t, sx: p.x, sy: p.y, ox: at[0], oy: at[1] };
        try {
          svgEl.setPointerCapture(e.pointerId);
        } catch (err) {
          /* synthetic */
        }
        e.preventDefault();
        return;
      }
      if (t?.dataset.pl === "fam" || t?.dataset.pl === "peer") return hello(ctx, t);
      if (t?.dataset.pl === "item") return itemTap(ctx, t);
      if (t?.dataset.pl === "bub") return tapBubble(ctx, t);
      if (t?.dataset.pl === "daily") return openChest(ctx, t);
      if (t?.dataset.pl === "light") return toggleLight(ctx);
      if (t?.dataset.pl === "me") {
        ST.wave = true;
        ctx.root.querySelector(".pl-me .pl-body")?.classList.add("wave", "jump");
        setTimeout(() => ctx.root.querySelector(".pl-me .pl-body")?.classList.remove("wave", "jump"), 900);
        return;
      }
      if (t?.dataset.pl === "pet") {
        const pet = ctx.root.querySelector(".pl-pet");
        pet?.classList.add("jump");
        confetti(ctx, ST.d.px, ST.d.py - 120, "#FF6B6B");
        setTimeout(() => pet?.classList.remove("jump"), 700);
        drag = { kind: "pet", sx: p.x, sy: p.y, ox: ST.d.px, oy: ST.d.py };
        return;
      }
      if (p.y > FLOOR) walk(ctx, p.x, p.y);
      return;
    }
    // build mode: pick up a thing, or the avatar and the pet
    if (t?.dataset.pl === "item") {
      ST.sel = t.dataset.id;
      const it = R().items.find((x) => x.id === ST.sel);
      drag = { kind: "item", it, sx: p.x, sy: p.y, ox: it.x, oy: it.y, el: t };
      try {
        svgEl.setPointerCapture(e.pointerId);
      } catch (err) {
        /* synthetic */
      }
      e.preventDefault();
      return;
    }
    if (t?.dataset.pl === "me" || t?.dataset.pl === "pet") {
      drag = { kind: t.dataset.pl, sx: p.x, sy: p.y, ox: t.dataset.pl === "me" ? ST.d.ax : ST.d.px, oy: t.dataset.pl === "me" ? ST.d.ay : ST.d.py, el: t };
      e.preventDefault();
      return;
    }
    ST.sel = null;
    redraw(ctx);
  });
  svgEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = toSvg(svgEl, e), dx = p.x - drag.sx, dy = p.y - drag.sy;
    if (Math.hypot(dx, dy) < 4 && !drag.moved) return;
    drag.moved = true;
    if (drag.kind === "npc") {
      const x = Math.round(Math.max(60, Math.min(W - 60, drag.ox + dx))), y = Math.round(Math.max(FLOOR + 40, Math.min(H - 8, drag.oy + dy)));
      drag.x = x;
      drag.y = y;
      drag.el.setAttribute("transform", `translate(${x} ${y}) scale(.82)`);
      drag.el.classList.add("held");
    } else if (drag.kind === "item") {
      const it = drag.it, wall = wallK(it.k);
      it.x = Math.round(Math.max(30, Math.min(W - 30, drag.ox + dx)));
      it.y = Math.round(wall ? Math.max(40, Math.min(FLOOR - 20, drag.oy + dy)) : Math.max(FLOOR + 10, Math.min(H - 4, drag.oy + dy)));
      drag.el.setAttribute("transform", `translate(${it.x} ${it.y}) scale(${it.f ? -(it.s || 1) : it.s || 1} ${it.s || 1})`);
    } else {
      const x = Math.max(60, Math.min(W - 60, drag.ox + dx)), y = Math.max(FLOOR + 40, Math.min(H - 8, drag.oy + dy));
      if (drag.kind === "me") Object.assign(ST.d, { ax: x, ay: y });
      else Object.assign(ST.d, { px: x, py: y });
      ctx.root.querySelector(drag.kind === "me" ? ".pl-me" : ".pl-pet")?.setAttribute("transform", `translate(${x} ${y})${drag.kind === "pet" ? " scale(.8)" : ""}`);
    }
  });
  const up = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.kind === "npc") {
      d.el.classList.remove("held");
      if (!d.moved) return npcTap(ctx, d.el, d.id);
      (R().npc ||= {})[d.id] = [d.x, d.y];
      return save(ctx);
    }
    if (d.moved || d.kind === "item") {
      save(ctx);
      redraw(ctx);
    }
  };
  svgEl.addEventListener("pointerup", up);
  svgEl.addEventListener("pointercancel", up);
}
function bindButtons(ctx, box) {
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-pl]");
    if (!b) return;
    const a = b.dataset.pl, k = b.dataset.k, room = R(), it = room.items.find((x) => x.id === ST.sel);
    if (a === "build") {
      ST.build = !ST.build;
      ST.sel = null;
      if (!ST.build) save(ctx);
    } else if (a === "shop") {
      ST.shop = !ST.shop;
      ST.build = false;
      ST.pack = null;
      ST.ask = null;
      ST.sel = null;
      ctx.root.querySelector(".pl")?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    } else if (a === "map") {
      ST.map = !ST.map;
      ST.build = false;
    } else if (a === "go") return goTo(ctx, k);
    else if (a === "turnok") ST.turnOk = true;
    else if (a === "full") return toggleFull(ctx);
    else if (a === "pack") {
      ST.pack = k;
      ST.ask = null;
    } else if (a === "packs") {
      ST.pack = null;
      ST.ask = null;
    } else if (a === "buy") return buy(ctx, b);
    else if (a === "space") {
      const sp = SPACES.find((x) => x.id === k), lv = levelOf(game(ctx, ctx.me).xp);
      if (!sp) return;
      if (lv < sp.lvl) return ctx.toast(ctx.t("{name} åbner på niveau {n}. Få flere mønter for at komme dertil.", { name: ctx.t(sp.n), n: sp.lvl }));
      ST.d.space = k;
      ST.sel = null;
      save(ctx);
    } else if (a === "tab") {
      ST.tab = k;
      if (k === "mig" || k === "tapet") ST.sel = null;
    } else if (a === "add") {
      const id = "i" + Math.random().toString(36).slice(2, 7);
      if (room.items.length >= (room === ST.d ? 140 : 80)) return ctx.toast(ctx.t("Der er ikke plads til mere"));
      room.items.push({ id, k, x: 380 + Math.round(Math.random() * 240), y: wallK(k) ? 200 : CAT[k]?.flat ? 600 : 560 });
      ST.sel = id;
      save(ctx);
    } else if (a === "wall") (ST.d.wall ||= {}).c = k;
    else if (a === "pat") (ST.d.wall ||= {}).p = k;
    else if (a === "floor") ST.d.floor = k;
    else if (a === "me") ST.d.me[b.dataset.f] = k;
    else if (it && a === "t-flip") it.f = it.f ? 0 : 1;
    else if (it && a === "t-big") it.s = Math.min(1.8, Math.round(((it.s || 1) + 0.15) * 100) / 100);
    else if (it && a === "t-small") it.s = Math.max(0.5, Math.round(((it.s || 1) - 0.15) * 100) / 100);
    else if (it && a === "t-color") it.c = PAL[(PAL.indexOf(it.c || CAT[it.k].c) + 1) % PAL.length];
    else if (it && a === "t-del") {
      room.items = room.items.filter((x) => x !== it);
      ST.sel = null;
    } else return;
    if (!["tab", "build", "shop", "pack", "packs", "map"].includes(a)) save(ctx);
    redraw(ctx);
  });
}
/* Buying: the first tap asks, the second buys. */
async function buy(ctx, b) {
  const m = ctx.me, id = b.dataset.k, cost = +b.dataset.cost || 0, g = game(ctx, m);
  if (ST.ask !== id) {
    ST.ask = id;
    return redraw(ctx);
  }
  ST.ask = null;
  if (g.coins < cost) {
    ctx.toast(ctx.t("Du mangler {n} mønter. Klar en rutine eller en opgave, så kommer de.", { n: cost - g.coins }));
    return redraw(ctx);
  }
  const owned = ownedSet(ctx, m);
  const items = id.startsWith("pack:") ? (PACKS.find((x) => x.id === id.slice(5))?.items || []).filter((x) => !has(owned, x)) : [id];
  if (!items.length) return redraw(ctx);
  try {
    const res = await ctx.ws("game", { member: m.id, action: "unlock", items, cost });
    ctx.data.game = { ...(ctx.data.game || {}), [m.id]: res };
    ST.got = items.find((x) => CAT[x]) || items[0];
    redraw(ctx);
    confetti(ctx, W / 2, H / 3, m.color, true);
  } catch (err) {
    ctx.toast(String(err?.message || err));
    redraw(ctx);
  }
}
/* Put a new thing in the room right away (or wear it, or use the wallpaper). */
function place(ctx, id) {
  ST.got = null;
  ST.shop = false;
  ST.pack = null;
  const [t, k] = id.split(":");
  if (CAT[id]) {
    const room = R();
    const nid = "i" + Math.random().toString(36).slice(2, 7);
    room.items.push({ id: nid, k: id, x: 420 + Math.round(Math.random() * 160), y: wallK(id) ? 200 : CAT[id].flat ? 600 : 560 });
    ST.build = true;
    ST.sel = nid;
    ST.tab = wallK(id) ? (CAT[id].cat === "fest" ? "fest" : "væg") : CAT[id].cat === "pynt" ? "mob" : CAT[id].cat;
  } else if (t === "p") {
    ST.d.space = "vaerelse";
    (ST.d.wall ||= {}).p = k;
  } else if (t === "f") {
    ST.d.space = "vaerelse";
    ST.d.floor = k;
  } else if (t === "x") ST.d.me.extra = k;
  save(ctx);
  redraw(ctx);
}
/* Coins flying up from where something was done. */
function coinPop(ctx, x, y, n) {
  const svgEl = ctx.$("pl-stage");
  if (!svgEl || !n) return;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "pl-coinpop");
  g.innerHTML = `<g transform="translate(${x} ${y - 40})"><circle r="20" fill="#FFD93D" stroke="#2B2340" stroke-width="4"/><circle r="12" fill="none" stroke="#E0A800" stroke-width="3"/><text x="28" y="10" class="pl-cp">+${n}</text></g>`;
  svgEl.appendChild(g);
  setTimeout(() => g.remove(), 1300);
}
async function openChest(ctx, el) {
  const m = ctx.me;
  el.classList.add("open");
  const tr = el.getAttribute("transform").match(/translate\(([\d.]+) ([\d.]+)\)/);
  confetti(ctx, +tr[1], +tr[2] - 60, "#FFD93D");
  coinPop(ctx, +tr[1], +tr[2] - 80, 5);
  try {
    const res = await ctx.ws("game", { member: m.id, action: "daily" });
    ctx.data.game = { ...(ctx.data.game || {}), [m.id]: res };
  } catch (err) {
    ctx.toast(String(err?.message || err));
  }
  setTimeout(() => redraw(ctx), 1100);
}
/* ------------------------------------------------------------------ the characters and the things come alive */
/* A speech bubble over someone. */
function say(ctx, x, y, text) {
  const svgEl = ctx.$("pl-stage");
  if (!svgEl) return;
  svgEl.querySelectorAll(".pl-say").forEach((n) => n.remove());
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const w = Math.min(440, 40 + text.length * 13), bx = Math.max(10, Math.min(W - w - 10, x - w / 2)), by = Math.max(10, y - 300);
  g.setAttribute("class", "pl-say");
  g.innerHTML = `<rect x="${bx}" y="${by}" width="${w}" height="58" rx="22" fill="#fff" stroke="#2B2340" stroke-width="4"/><path d="M${Math.max(bx + 24, Math.min(bx + w - 24, x)) - 12} ${by + 56} l12 20 l12 -20z" fill="#fff" stroke="#2B2340" stroke-width="4" stroke-linejoin="round"/><rect x="${Math.max(bx + 24, Math.min(bx + w - 24, x)) - 14}" y="${by + 50}" width="28" height="8" fill="#fff"/><text x="${bx + w / 2}" y="${by + 37}" text-anchor="middle" class="pl-sayt">${esc(text)}</text>`;
  svgEl.appendChild(g);
  setTimeout(() => g.remove(), 2600);
}
function npcTap(ctx, el, id) {
  const N = World.NPCS[id], at = R().npc?.[id];
  if (!N || !at) return;
  const body = el.querySelector(".pl-body");
  body?.classList.add("jump");
  setTimeout(() => body?.classList.remove("jump"), 700);
  const lines = N[4] || ["Hej!"];
  say(ctx, at[0], at[1], `${N[0]}: ${ctx.t(lines[Math.floor(Math.random() * lines.length)])}`);
}
/* Wave to a sibling (live) or to the family. */
function hello(ctx, el) {
  const id = el.dataset.id, body = el.querySelector(".pl-body");
  body?.classList.add("wave", "jump");
  setTimeout(() => body?.classList.remove("wave", "jump"), 900);
  const tr = el.getAttribute("transform").match(/translate\(([\d.]+) ([\d.]+)\)/);
  if (tr) say(ctx, +tr[1], +tr[2], el.dataset.pl === "peer" ? `👋 ${ctx.t("Hej {name}!", { name: ctx.member(id)?.name || "" })}` : `${ctx.member(id)?.name || ""}: ${ctx.t(["Hej skat!", "Hvad leger du?", "Godt gået i dag!"][Math.floor(Math.random() * 3)])}`);
  if (el.dataset.pl === "peer") publish(ctx, { emote: "wave", to: id });
}
/* Things do something when tapped: lamps turn on, music plays, balls bounce, cars drive, the rest wiggles. */
const ACT = {
  music: ["guitar", "keyboard", "mikrofon", "hoejttaler", "lysstav", "bandplakat", "guldplade", "headset"],
  bounce: ["ball", "pudebjerg", "trampolin", "trampolinhave", "boeje", "knoglepude", "soestjerne", "beanbag", "teddy", "hjertepude", "hvalpebamse", "abebamse", "dragebamse", "enhjoerning", "rumvaesen", "blaeksprutte", "krokodille", "paaskehare", "kylling", "nisse", "snemand"],
  drive: ["car", "brandbil", "politibil", "redningsbaad", "helikopter", "loebecykel", "skateboard", "bil", "cykel", "traktor", "raket"],
  spin: ["discokugle", "globus", "pariserhjul", "karrusel", "vaskemaskine", "uro", "fiskeuro", "planetlampe", "ufolampe"],
  screen: ["tv", "skaerm", "dobbeltskaerm", "konsol", "arkade", "kontrolpult"],
  yum: ["lagkage", "slikskaal", "madskaal", "slikautomat", "kagedisk", "isbod", "koeleskab", "komfur", "bagerovn"],
};
function itemTap(ctx, el) {
  const room = R(), it = room.items.find((x) => x.id === el.dataset.id);
  if (!it || !CAT[it.k]) return;
  const k = it.k, kind = Object.keys(ACT).find((a) => ACT[a].includes(k)) || (CAT[k].cat === "lys" ? "light" : "wiggle");
  if (kind === "light") {
    it.on = !it.on;
    el.classList.toggle("lit", !!it.on);
    if (!room.ro) save(ctx);
    return;
  }
  if (kind === "screen") {
    it.on = !it.on;
    el.classList.toggle("off", !it.on);
  }
  el.classList.remove("pl-do", "do-music", "do-bounce", "do-drive", "do-spin", "do-wiggle", "do-yum");
  void el.getBBox();
  el.classList.add("pl-do", `do-${kind === "screen" ? "wiggle" : kind}`);
  setTimeout(() => el.classList.remove("pl-do", `do-${kind === "screen" ? "wiggle" : kind}`), 1400);
  const T = CAT[k], top = it.y - T.h * (it.s || 1);
  if (kind === "music") floatIcons(ctx, it.x, top, ["♪", "♫", "♪"]);
  if (kind === "yum") floatIcons(ctx, it.x, top, ["😋", "✨"]);
  if (kind === "bounce") floatIcons(ctx, it.x, top, ["💫"]);
}
function floatIcons(ctx, x, y, list) {
  const svgEl = ctx.$("pl-stage");
  if (!svgEl) return;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "pl-notes");
  g.innerHTML = list.map((n, i) => `<text x="${x - 30 + i * 30}" y="${y - 10}" class="pl-note" style="animation-delay:${i * 0.15}s">${n}</text>`).join("");
  svgEl.appendChild(g);
  setTimeout(() => g.remove(), 1600);
}

/* ------------------------------------------------------------------ playing together (live, through Home Assistant) */
/* Where we are goes to Home Assistant, which passes it on to the siblings who are playing. Nothing is stored. */
let pubT = 0, pubWait = null;
function publish(ctx, extra = {}) {
  if (!ST || !ctx.me || !ctx.hass?.connection) return;
  const send = () => {
    pubT = Date.now();
    pubWait = null;
    ctx.ws("play", { member: ST.kid, space: presenceKey(), x: Math.round(ST.d.ax || 500), y: Math.round(ST.d.ay || 590), me: ST.d.me, ...extra }).catch(() => {});
  };
  if (extra.emote || Date.now() - pubT > 300) return send();
  clearTimeout(pubWait);
  pubWait = setTimeout(send, 300);
}
let presenceUnsub = null, presenceFor = "", beat = null;
function presence(ctx) {
  if (!ctx.me || !ctx.hass?.connection || presenceFor === ctx.me.id) return;
  stopPresence();
  presenceFor = ctx.me.id;
  ctx.hass.connection
    .subscribeMessage((msg) => peerUpdate(ctx, msg), { type: "hverdagsro/play_subscribe" })
    .then((un) => {
      presenceUnsub = un;
    })
    .catch(() => {
      presenceFor = "";
    });
  clearInterval(beat);
  beat = setInterval(() => {
    if (!ctx.host?.isConnected || ctx.view !== "vaerelse") return stopPresence(ctx);
    publish(ctx);
  }, 15000);
  publish(ctx);
}
function stopPresence(ctx) {
  clearInterval(beat);
  if (presenceUnsub) presenceUnsub();
  presenceUnsub = null;
  if (ctx && presenceFor && ctx.hass?.connection) ctx.ws("play", { member: presenceFor, space: "" }).catch(() => {});
  presenceFor = "";
}
function peerUpdate(ctx, msg) {
  if (!ST) return;
  const list = msg.players || (msg.player ? [msg.player] : []);
  for (const pe of list) {
    if (!pe.member || pe.member === ST.kid) continue;
    if (!pe.space) delete ST.peers[pe.member];
    else ST.peers[pe.member] = { ...ST.peers[pe.member], ...pe, seen: Date.now() };
    if (pe.emote === "wave" && pe.to === ST.kid) {
      const el = ctx.root.querySelector(`.pl-peer[data-id="${CSS.escape(pe.member)}"]`);
      if (el) say(ctx, pe.x, pe.y, `👋 ${ctx.member(pe.member)?.name || ""}`);
    }
  }
  // Move the ones we can see; draw again when someone comes or goes.
  const key = presenceKey(), shown = new Set([...ctx.root.querySelectorAll(".pl-peer")].map((n) => n.dataset.id));
  const here = new Set(Object.entries(ST.peers).filter(([, pe]) => pe.space === key).map(([id]) => id));
  const same = shown.size === here.size && [...here].every((id) => shown.has(id));
  if (same && !ST.map) {
    for (const id of here) {
      const pe = ST.peers[id], el = ctx.root.querySelector(`.pl-peer[data-id="${CSS.escape(id)}"]`);
      el?.setAttribute("transform", `translate(${pe.x} ${pe.y})`);
    }
  } else if (!ST.build && !ST.shop) redraw(ctx);
}

/* ------------------------------------------------------------------ full screen, lying down */
function toggleFull(ctx) {
  const box = ctx.root.querySelector(".pl-fs .pl") || ctx.root.querySelector(".pl");
  if (!box) return;
  if (!ST.full) {
    ST.full = true;
    ST.home = box.parentElement;
    const fs = document.createElement("div");
    fs.className = "pl-fs";
    ctx.root.appendChild(fs);
    fs.appendChild(box);
    const el = fs;
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" }).then(() => screen.orientation?.lock?.("landscape").catch(() => {})).catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    const onFs = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && ST.full && ST.fsApi) exitFull(ctx);
      ST.fsApi = !!(document.fullscreenElement || document.webkitFullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    ST.fsOff = () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
    redraw(ctx);
  } else exitFull(ctx);
}
function exitFull(ctx) {
  if (!ST.full) return;
  ST.full = false;
  ST.fsApi = false;
  ST.fsOff?.();
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
    screen.orientation?.unlock?.();
  } catch (err) {
    /* not in full screen */
  }
  const fs = ctx.root.querySelector(".pl-fs"), box = fs?.querySelector(".pl");
  if (box && ST.home?.isConnected) ST.home.appendChild(box);
  fs?.remove();
  redraw(ctx);
}

async function toggleLight(ctx) {
  const lights = realLights(ctx, ctx.me);
  if (!lights.length) return;
  const on = lights.some((id) => ctx.hass.states[id]?.state === "on");
  const sw = ctx.root.querySelector(".pl-switch");
  sw?.classList.toggle("on", !on);
  await ctx.call("light", on ? "turn_off" : "turn_on", { entity_id: lights });
  setTimeout(() => redraw(ctx), 600);
}

let tick = null;
export default {
  id: "play",
  views: {
    vaerelse: {
      kidOnly: true,
      module: "house",
      keep: true, // the room draws itself; it is refreshed on its own, never under the child's fingers
      title: (ctx) => ctx.t("Mit værelse"),
      render,
      after(ctx) {
        bind(ctx);
        showPop(ctx);
        presence(ctx);
        clearInterval(tick);
        // The sky, the lights and the bubbles follow along, but never in the middle of building.
        tick = setInterval(() => {
          if (ctx.view !== "vaerelse" || !ctx.host.isConnected) return clearInterval(tick);
          if (!ST || ST.build) return;
          redraw(ctx);
        }, 15000);
      },
    },
  },
  acts: {
    "play-place": (el, ev, ctx) => place(ctx, el.dataset.k),
  },
  inputs: {},
  css: `
.pl-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.pl-head .h2 { margin: 2px 0; }
.pl-acts { display: flex; gap: 8px; align-items: center; }
.pl-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: #FFD93D; color: #2B2340; font-weight: 800; }
.pl-pill .ic { width: 18px; height: 18px; }
.pl-stagebox { position: relative; border-radius: 28px; overflow: hidden; box-shadow: 0 0 0 4px #2B2340, var(--shadow); background: #2B2340; }
#pl-stage { display: block; width: 100%; height: auto; touch-action: manipulation; user-select: none; -webkit-user-select: none; }
.pl-stagebox.build #pl-stage { touch-action: none; }
.pl-me, .pl-pet { transition: transform .7s cubic-bezier(.3,.9,.4,1); cursor: pointer; }
.pl-me .pl-body { animation: plbob 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.pl-me.walking .pl-body { animation: plwalk .35s ease-in-out infinite; }
.pl-body.jump { animation: pljump .7s cubic-bezier(.3,1.6,.5,1) !important; }
.pl-body.wave .pl-arm.r { animation: plwave .3s ease-in-out 3; transform-box: fill-box; transform-origin: 0 0; }
.pl-pet .pl-petb { animation: plbob 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.pl-pet.jump .pl-petb { animation: pljump .6s cubic-bezier(.3,1.6,.5,1); }
.pl-pet.happy .pl-wag { animation: plwag .4s ease-in-out infinite; transform-box: fill-box; transform-origin: 0 100%; }
.pl-petname { font: 800 22px var(--font-display, sans-serif); fill: #2B2340; paint-order: stroke; stroke: #fff; stroke-width: 6px; }
.pl-bub { cursor: pointer; animation: plfloat 3.2s ease-in-out infinite; }
.pl-bub.pop { animation: plpop .4s ease-in forwards; }
.pl-bl { font: 800 17px var(--font-body, sans-serif); fill: #2B2340; paint-order: stroke; stroke: #fff; stroke-width: 6px; }
.pl-pts { font: 900 15px var(--font-body, sans-serif); fill: #2B2340; }
.pl-burst circle { animation: plburst .8s ease-out forwards; }
.pl-glow { opacity: 0; transition: opacity .6s; }
.pl-lamps-on .pl-glow, svg.on .pl-glow { opacity: .8; }
.pl-switch { cursor: pointer; }
.pl-twinkle { animation: pltw 2s ease-in-out infinite; }
.pl-cloud { animation: plcloud 18s linear infinite; }
.pl-fish { animation: plfish 4s ease-in-out infinite; }
.pl-it { cursor: default; }
.pl-stagebox.build .pl-it { cursor: grab; }
.pl-selbox { fill: none; stroke: #9B5DE5; stroke-width: 5; stroke-dasharray: 14 10; animation: dash 1s linear infinite; }
.pl-tools { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; gap: 6px; align-items: center; background: #fff; border-radius: 999px; padding: 6px 8px 6px 16px; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
.pl-tools b { font-size: 14px; margin-right: 4px; white-space: nowrap; }
.pl-tools button { width: 44px; height: 44px; border-radius: 999px; border: 0; background: var(--surface-2); font: 900 20px var(--font-body); color: var(--ink); display: grid; place-items: center; cursor: pointer; }
.pl-tools button i { width: 24px; height: 24px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(0,0,0,.2); }
.pl-tools .ic { width: 20px; height: 20px; }
.pl-tip { pointer-events: none; position: absolute; left: 12px; right: 12px; bottom: 12px; text-align: center; color: #fff; font-weight: 700; font-size: 13px; text-shadow: 0 1px 3px rgba(0,0,0,.5); }
.pl-drawer { margin-top: 14px; }
.pl-tabs { display: flex; gap: 6px; overflow-x: auto; margin-bottom: 12px; }
.pl-tabs button { flex: none; border: 0; border-radius: 999px; padding: 10px 16px; font: 800 14px var(--font-body); background: var(--surface-2); color: var(--ink); cursor: pointer; }
.pl-tabs button[aria-selected="true"] { background: var(--pc); color: #fff; }
.pl-ths { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.pl-th { border: 0; border-radius: 18px; background: var(--surface-2); padding: 8px; display: grid; gap: 4px; justify-items: center; cursor: pointer; font: 700 12px var(--font-body); color: var(--ink); transition: transform .15s; }
.pl-th:active { transform: scale(.94); }
.pl-th svg { width: 72px; height: 64px; }
.pl-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
.pl-row b { min-width: 80px; font-size: 14px; }
.pl-sw { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--c); box-shadow: inset 0 0 0 2px rgba(0,0,0,.15); cursor: pointer; }
.pl-sw[aria-pressed="true"] { box-shadow: 0 0 0 3px var(--surface), 0 0 0 6px var(--pc); }
.pl-chip { border: 0; border-radius: 999px; padding: 9px 14px; font: 700 13px var(--font-body); background: var(--surface-2); color: var(--ink); cursor: pointer; display: inline-flex; gap: 6px; align-items: center; }
.pl-chip i { width: 16px; height: 16px; border-radius: 50%; }
.pl-chip[aria-pressed="true"] { background: var(--ink); color: var(--bg); }
@keyframes plbob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes plwalk { 0%, 100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-10px) rotate(2deg) } }
@keyframes pljump { 0% { transform: translateY(0) } 40% { transform: translateY(-60px) scale(1.04, .96) } 100% { transform: translateY(0) } }
@keyframes plwave { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(-70deg) } }
@keyframes plwag { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(-18deg) } }
@keyframes plfloat { 0%, 100% { translate: 0 0 } 50% { translate: 0 -10px } }
@keyframes plpop { to { scale: 1.6; opacity: 0 } }
@keyframes plburst { from { transform: translate(0, 0); opacity: 1 } to { transform: translate(var(--dx), var(--dy)); opacity: 0 } }
@keyframes pltw { 0%, 100% { opacity: .3 } 50% { opacity: 1 } }
@keyframes plcloud { from { transform: translateX(-40px) } to { transform: translateX(120px) } }
@keyframes plfish { 0%, 100% { transform: translateX(-14px) } 50% { transform: translateX(18px) } }
.pl-glow.on { opacity: .85; }
/* the map and the places */
.pl-where { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 200px; }
.pl-here { font-weight: 800; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pl-map text { pointer-events: none; }
.wm-name { font: 800 21px var(--font-display, sans-serif); text-anchor: middle; fill: #2B2340; paint-order: stroke; stroke: #fff; stroke-width: 6px; }
.wm-big { font-size: 46px; text-anchor: middle; }
.wm-em { font-size: 26px; text-anchor: middle; }
.wm-rt { font-size: 22px; text-anchor: middle; }
.wm-pin, .wm-room { cursor: pointer; transition: transform .15s; transform-box: fill-box; transform-origin: center; }
.wm-pin:hover, .wm-room:hover { transform: scale(1.08); }
.wm-pin.here circle:first-child, .wm-room.here polygon { stroke: var(--pc); stroke-width: 7; }
.wm-area.locked > circle, .wm-pin.locked { opacity: .55; }
.pl-mine { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 12px; }
.pl-mine b { font-size: 14px; margin-right: 4px; }
.pl-mine button { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border: 0; border-radius: 999px; background: var(--surface); box-shadow: inset 0 0 0 1.5px var(--line); font: 800 13.5px var(--font-body); color: var(--ink); cursor: pointer; position: relative; }
.pl-mine button[aria-pressed="true"] { background: var(--pc); color: #fff; box-shadow: none; }
.pl-mine button.locked { opacity: .55; }
.pl-mine small { font-size: 11px; }
.pl-live { position: absolute; top: 4px; right: 6px; width: 10px; height: 10px; border-radius: 50%; background: #22C55E; box-shadow: 0 0 0 2px var(--surface); }
.pl-npc, .pl-peer, .pl-fam { cursor: pointer; }
.pl-npc .pl-body, .pl-peer .pl-body, .pl-fam .pl-body { animation: plbob 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.pl-npc.held { filter: drop-shadow(0 12px 8px rgba(0,0,0,.25)); }
.pl-peer { transition: transform .45s linear; }
.pl-npc .pl-body.jump, .pl-peer .pl-body.jump, .pl-fam .pl-body.jump { animation: pljump .7s cubic-bezier(.3,1.6,.5,1); }
.pl-say { pointer-events: none; animation: plin .25s ease-out; }
.pl-sayt { font: 800 24px var(--font-body, sans-serif); fill: #2B2340; }
.pl-it.lit .pl-glow { opacity: .85; }
.pl-it.off .pl-screen { opacity: .15; }
.pl-it { transform-box: fill-box; }
.pl-it.do-wiggle > * { animation: plwig .6s ease-in-out; transform-box: fill-box; transform-origin: 50% 100%; }
.pl-it.do-bounce > * { animation: pljump .8s cubic-bezier(.3,1.6,.5,1); transform-box: fill-box; transform-origin: 50% 100%; }
.pl-it.do-music > * { animation: plwig .4s ease-in-out 3; transform-box: fill-box; transform-origin: 50% 100%; }
.pl-it.do-yum > * { animation: plwig .5s ease-in-out 2; transform-box: fill-box; transform-origin: 50% 100%; }
.pl-it.do-drive > * { animation: pldrive 1.3s ease-in-out; transform-box: fill-box; }
.pl-it.do-spin > * { animation: plspin 1s ease-in-out; transform-box: fill-box; transform-origin: 50% 50%; }
.pl-spin, .pl-wheel { animation: plspin 8s linear infinite; transform-box: view-box; }
.pl-bob { animation: plbob 2.4s ease-in-out infinite; }
.pl-note { font-size: 40px; font-weight: 900; fill: #9B5DE5; paint-order: stroke; stroke: #fff; stroke-width: 5px; animation: plnote 1.4s ease-out forwards; }
@keyframes plwig { 0%, 100% { transform: rotate(0) } 25% { transform: rotate(-6deg) } 75% { transform: rotate(6deg) } }
@keyframes pldrive { 0%, 100% { transform: translateX(0) } 45% { transform: translateX(160px) } 55% { transform: translateX(160px) scaleX(-1) } }
@keyframes plspin { to { transform: rotate(360deg) } }
@keyframes plnote { from { transform: translateY(0); opacity: 1 } to { transform: translateY(-90px); opacity: 0 } }
/* full screen, lying down */
.pl-fs { position: fixed; inset: 0; z-index: 400; background: #2B2340; display: grid; overflow: hidden; }
.pl-fs .pl { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; height: 100dvh; padding: max(8px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left)); gap: 6px; color: #fff; }
.pl-fs .pl-head { display: none; }
.pl-fs .pl-bar { margin: 0; }
.pl-fs .pl-here { color: #fff; }
.pl-fs .pl-stagebox { align-self: center; justify-self: center; width: min(100%, calc((100dvh - 80px) * 1000 / 620)); box-shadow: 0 0 0 4px #000; }
.pl-fs .pl-drawer { position: fixed; right: 10px; top: 64px; bottom: 10px; width: min(340px, 40vw); overflow: auto; z-index: 3; margin: 0; color: var(--ink); }
.pl-fs .pl-mine { color: #fff; margin: 0; }
.pl-fs .pl-shop { overflow: auto; max-height: calc(100dvh - 70px); color: var(--ink); }
.pl-fs .pl-sh, .pl-fs .pl-back { color: #fff; }
.pl-turn { display: none; }
.pl-turn small { font-size: 14px; font-weight: 600; opacity: .8; }
.pl-fs .pl-stagebox.build { justify-self: start; width: min(calc(100% - min(350px, 41vw)), calc((100dvh - 80px) * 1000 / 620)); }
@media (orientation: portrait) and (max-width: 700px) { .pl-fs .pl-turn { display: grid; position: fixed; inset: 0; z-index: 5; place-items: center; align-content: center; gap: 14px; border: 0; background: rgba(27,21,48,.92); color: #fff; text-align: center; padding: 24px; font: 800 20px var(--font-body); } .pl-fs .pl-drawer { left: 10px; right: 10px; width: auto; top: auto; height: 46dvh; } .pl-turn i { font-style: normal; font-size: 64px; animation: plturn 1.6s ease-in-out infinite; } }
@keyframes plturn { 0%, 30% { transform: rotate(0) } 60%, 100% { transform: rotate(90deg) } }
.pl-coin { width: 20px; height: 20px; flex: none; }
.pl-coins { background: #FFF3B0; }
.pl-pts-pill { background: var(--surface-2); color: var(--ink); }
.pl-lv { display: inline-grid; gap: 4px; min-width: 96px; padding: 6px 12px; border-radius: 14px; background: color-mix(in srgb, var(--pc) 14%, var(--surface)); }
.pl-lv b { font-size: 13px; font-weight: 800; }
.pl-lv i { display: block; height: 7px; border-radius: 9px; background: color-mix(in srgb, var(--pc) 20%, var(--surface-2)); position: relative; overflow: hidden; }
.pl-lv i::after { content: ""; position: absolute; inset: 0 auto 0 0; width: var(--p); border-radius: 9px; background: var(--pc); }
.pl-bar { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.pl-bar-b { display: flex; gap: 8px; align-items: center; }
.pl-bar-b .btn .pl-coin { width: 18px; height: 18px; }
.pl-spaces { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; flex: 1 1 260px; min-width: 0; padding: 2px; }
.pl-spaces::-webkit-scrollbar { display: none; }
.pl-spaces button { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border: 0; border-radius: 999px; background: var(--surface); box-shadow: inset 0 0 0 1.5px var(--line); font: 800 13.5px var(--font-body); color: var(--ink); cursor: pointer; }
.pl-spaces button[aria-selected="true"] { background: var(--pc); color: #fff; box-shadow: none; }
.pl-spaces button.locked { opacity: .55; }
.pl-spaces small { font-size: 11px; font-weight: 800; }
.pl-chest { cursor: pointer; animation: plchest 2.4s ease-in-out infinite; }
.pl-chest.open { animation: plpop .6s ease-in forwards; }
.pl-sparkle { animation: pltw 1.4s ease-in-out infinite; }
.pl-coinpop { animation: plcoin 1.2s ease-out forwards; pointer-events: none; }
.pl-cp { font: 900 34px var(--font-body, sans-serif); fill: #2B2340; paint-order: stroke; stroke: #fff; stroke-width: 7px; }
.pl-blink { animation: pltw 1.2s ease-in-out infinite; }
.pl-beam { animation: plbeam 4s ease-in-out infinite alternate; transform-origin: 50% 0; transform-box: fill-box; }
.pl-more { background: color-mix(in srgb, #FFD93D 22%, var(--surface)); }
.pl-more-ic { width: 64px; height: 56px; display: grid; place-items: center; }
.pl-more-ic .pl-coin { width: 40px; height: 40px; }
.pl-th svg { pointer-events: none; }
/* the shop */
.pl-shop { display: grid; gap: 12px; }
.pl-sh { margin: 6px 0 0; font-size: 15px; font-weight: 800; letter-spacing: .02em; }
.pl-packs { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.pl-packs.small { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
.pl-pack { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; padding: 12px; border: 0; border-radius: 22px; background: var(--surface); box-shadow: var(--shadow); text-align: left; color: var(--ink); font: inherit; cursor: pointer; transition: transform .15s; position: relative; }
.pl-pack:active { transform: scale(.97); }
.pl-packs.now .pl-pack { box-shadow: 0 0 0 3px #FFD93D, var(--shadow); }
.pl-pack.locked { filter: grayscale(.7); opacity: .7; }
.pl-pack-art { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; height: 96px; border-radius: 16px; background: color-mix(in srgb, var(--pc) 10%, var(--surface-2)); padding: 6px; }
.pl-packs.small .pl-pack-art { height: 64px; }
.pl-pack-art span { display: grid; place-items: center; min-width: 0; min-height: 0; height: 100%; overflow: hidden; }
.pl-pack-art svg { width: 100%; height: 100%; max-height: 84px; }
.pl-packs.small .pl-pack-art svg { max-height: 52px; }
.pl-pack-t b { display: block; font-size: 15px; }
.pl-pack-t small { color: var(--muted); font-size: 12.5px; }
.pl-pack-p { display: inline-flex; align-items: center; gap: 4px; font-weight: 800; font-size: 14px; }
.pl-pack.done .pl-pack-p { color: #16A34A; }
.pl-earn { display: grid; gap: 8px; }
.pl-earn ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
.pl-earn li { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 12px; background: var(--surface-2); font-size: 13.5px; font-weight: 600; }
.pl-earn li span { flex: 1; }
.pl-earn small { color: var(--muted); font-size: 12.5px; }
.pl-back { display: inline-flex; align-items: center; gap: 4px; font-weight: 800; min-height: 44px; justify-self: start; }
.pl-back .ic { width: 18px; height: 18px; }
.pl-packhead { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.pl-packhead > div { flex: 1 1 220px; min-width: 0; }
.pl-packhead h3 { margin: 0; font-size: 22px; }
.pl-packhead .t-sub { margin: 2px 0 0; }
.pl-packem { font-size: 46px; line-height: 1; }
.pl-note { margin: 6px 0 0; font-size: 13px; font-weight: 700; color: var(--pc); }
.pl-packhead .btn { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }
.pl-packhead .btn small { font-size: 11.5px; font-weight: 700; opacity: .8; }
.btn.poor { opacity: .55; }
.pl-buys { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
.pl-buy { display: grid; justify-items: center; gap: 6px; padding: 10px; border-radius: 20px; background: var(--surface); box-shadow: var(--shadow); text-align: center; }
.pl-buy-th { width: 100%; height: 92px; display: grid; place-items: center; border-radius: 14px; background: var(--surface-2); }
.pl-buy-th svg { width: 86%; height: 86%; }
.pl-buy b { font-size: 13.5px; line-height: 1.2; }
.pl-buy .btn { min-height: 40px; display: inline-flex; align-items: center; gap: 4px; }
.pl-buy .btn .pl-coin { width: 16px; height: 16px; }
.pl-buy.mine { background: color-mix(in srgb, #6BCB77 14%, var(--surface)); }
.pl-own { font-weight: 800; font-size: 13px; color: #16A34A; min-height: 40px; display: grid; place-items: center; }
/* the big moments */
.pl-pop-c { text-align: center; display: grid; gap: 10px; justify-items: center; padding: 8px 4px; animation: plin .5s cubic-bezier(.3,1.6,.5,1); }
.pl-pop-c h2 { margin: 0; font-size: 26px; }
.pl-pop-c p { margin: 0; color: var(--muted); }
.pl-pop-th { width: 160px; height: 140px; display: grid; place-items: center; border-radius: 22px; background: color-mix(in srgb, #FFD93D 25%, var(--surface)); }
.pl-pop-th svg { width: 88%; height: 88%; }
.pl-pop-badge { width: 92px; height: 92px; border-radius: 50%; display: grid; place-items: center; font: 900 44px var(--font-display, sans-serif); color: #2B2340; background: radial-gradient(circle at 35% 30%, #FFF6C9, #FFD93D 60%, #E0A800); box-shadow: 0 0 0 5px #2B2340, 0 0 40px #FFD93D; }
.pl-pop-b { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
@keyframes plchest { 0%, 100% { translate: 0 0 } 50% { translate: 0 -6px } }
@keyframes plcoin { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(-110px); opacity: 0 } }
@keyframes plbeam { from { transform: rotate(-6deg) } to { transform: rotate(6deg) } }
@keyframes plfade { from { opacity: 0 } }
@keyframes plin { from { transform: scale(.6); opacity: 0 } }
@media (max-width: 640px) { .pl-hide-s { display: none; } .pl-lv { min-width: 80px; } .pl-buys { grid-template-columns: repeat(2, minmax(0, 1fr)); } .pl-packs { grid-template-columns: minmax(0, 1fr); } .pl-packs.small { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .pl-tools { top: 8px; bottom: auto; gap: 4px; padding: 4px 6px 4px 12px; } .pl-tools button { width: 38px; height: 38px; font-size: 18px; } .pl-tools b { font-size: 12px; } .pl-stagebox { border-radius: 20px; } .pl-th svg { width: 60px; height: 52px; } }
@media (prefers-reduced-motion: reduce) { .pl-me .pl-body, .pl-pet .pl-petb, .pl-bub, .pl-cloud, .pl-fish, .pl-twinkle, .pl-chest, .pl-sparkle, .pl-blink, .pl-beam, .pl-pop-c { animation: none !important; } }
`,
  en: {
    "Mit værelse": "My room", "Hej {name}!": "Hi {name}!", "Tryk på boblerne, når du har gjort det.": "Tap the bubbles when you have done it.", "Alt er klaret lige nu. Godt gået!": "All done for now. Well done!",
    "Træk tingene derhen, hvor de skal stå. Tryk på noget for at ændre det.": "Drag things where they should go. Tap something to change it.", "Byg dit værelse": "Build your room", "Lys og stemning": "Lights and mood", Færdig: "Done", "Dit værelse": "Your room", "Lyset i dit værelse": "The light in your room",
    "Vælg noget nedenfor, eller træk i tingene for at flytte dem.": "Pick something below, or drag things to move them.", Farve: "Colour", Vend: "Flip", Mindre: "Smaller", Større: "Bigger", Fjern: "Remove",
    Møbler: "Furniture", Legetøj: "Toys", Lamper: "Lamps", "På væggen": "On the wall", "Tapet og gulv": "Wallpaper and floor", Mig: "Me", Væggen: "The wall", Gulvet: "The floor",
    Mønter: "Coins", "{n} XP til næste niveau": "{n} XP to the next level", "Højeste niveau": "Highest level", "Niveau {n}": "Level {n}", Point: "Points", "Tilbage til værelset": "Back to the room",
    "Åbner på niveau {n}": "Opens at level {n}", Butikken: "The shop", Byg: "Build", "Byt dine mønter til nye ting. Mønter får du for rutiner, opgaver og lektier.": "Swap your coins for new things. You get coins for routines, missions and homework.",
    "Niveau {n}!": "Level {n}!", "Nu har du åbnet: {things}": "Now you have opened: {things}", "Du bliver bedre og bedre. Bliv ved!": "You get better and better. Keep going!", "Fedt!": "Cool!",
    "Ny ting!": "New thing!", "{name} er din nu.": "{name} is yours now.", Senere: "Later", "Tag den på": "Put it on", "Brug den nu": "Use it now", "Stil den ind nu": "Put it in now",
    Fest: "Party", "Flere ting i butikken": "More things in the shop", Flere: "More", "Til jul, påske, halloween og fødselsdage kommer der festpakker i butikken.": "At Christmas, Easter, Halloween and birthdays there are party packs in the shop.",
    "Kommer {date}": "Comes {date}", "Kommer senere": "Comes later", "Alle sammen": "All of them", "{n} af {total} ting": "{n} of {total} things", "Lige nu": "Right now", Pakker: "Packs",
    "Sådan får du mønter": "How you get coins", "Et rutinekort": "A routine card", "Hele rutinen": "The whole routine", "En opgave": "A mission", "En lektie": "Homework", "Skattekisten hver dag": "The treasure chest every day",
    "Alle mønter, du får, giver også XP. Med mere XP stiger du i niveau og åbner nye rum og pakker.": "Every coin you get also gives XP. With more XP you go up a level and open new rooms and packs.",
    "Festpakker, der kommer igen": "Party packs that come back", Din: "Yours", "Køb?": "Buy?", Gratis: "Free", "Pakken åbner, når du når niveau {n}.": "The pack opens when you reach level {n}.",
    "Pakken kommer i butikken igen til {name}.": "The pack comes back to the shop for {name}.", "I butikken til og med {date}.": "In the shop until {date}.", "Den første ting er en gave.": "The first thing is a gift.",
    "Alle pakker": "All packs", "Køb hele pakken?": "Buy the whole pack?", "Hele pakken": "The whole pack", "spar {n}": "save {n}", "{name} åbner på niveau {n}. Få flere mønter for at komme dertil.": "{name} opens at level {n}. Get more coins to get there.",
    "Du mangler {n} mønter. Klar en rutine eller en opgave, så kommer de.": "You need {n} more coins. Do a routine or a mission and they'll come.", "Dagens mønter": "Today's coins",
    Kort: "Map", Tilbage: "Back", "Mine rum": "My rooms", "Besøg {name}": "Visit {name}", "{name}s værelse": "{name}'s room", "Det åbner på niveau {n}. Klar rutiner og opgaver for at komme dertil.": "That opens at level {n}. Do routines and missions to get there.",
    "Luk fuld skærm": "Close full screen", "Fuld skærm": "Full screen", "Vend skærmen, så er der mere plads til at lege": "Turn the screen for more room to play", "Tryk for at spille på langs alligevel": "Tap to play upright anyway",
    "Hej skat!": "Hi sweetie!", "Hvad leger du?": "What are you playing?", "Godt gået i dag!": "Well done today!", "Vores hus": "Our house", Haven: "The garden", "niv. {n}": "lvl {n}",
    Huset: "The house", Redningsbyen: "Rescue Town", Skovbyen: "Forest Town", Popbyen: "Pop Town", Eventyrparken: "The Adventure Park", Slikbyen: "Sweet Town", Teknobyen: "Tech Town", Natbyen: "Night Town",
    Redningsstationen: "The rescue station", Havnen: "The harbour", Skovlysningen: "The forest clearing", Bondegården: "The farm", Dansestudiet: "The dance studio", Koncertscenen: "The concert stage", Bageriet: "The bakery", Slikbutikken: "The sweet shop",
    Vandlandet: "The water park", Laboratoriet: "The lab", "Heltenes tagterrasse": "The heroes' roof terrace", "Natbyens gade": "Night Town's street", "Den hemmelige hule": "The secret cave",
    // the things, looks and packs (hv-playcat.js)
    "Pudefort": "Pillow fort",
    "Sengehimmel": "Bed canopy",
    "Sovepose": "Sleeping bag",
    "Lommelygte": "Torch",
    "H\u00e6ngek\u00f8je": "Hammock",
    "Pudebjerg": "Pile of cushions",
    "Skattekiste": "Treasure chest",
    "Stjerneprojektor": "Star projector",
    "Lanterne": "Lantern",
    "Skilt: Hulen": "Sign: The den",
    "Lysgardin": "Fairy light curtain",
    "Gamerbord": "Gaming desk",
    "Gamersk\u00e6rm": "Gaming screen",
    "Dobbeltsk\u00e6rm": "Two screens",
    "TV med spillekonsol": "TV with games console",
    "LED-lys": "LED light",
    "Headset p\u00e5 holder": "Headset on a stand",
    "Arkademaskine": "Arcade machine",
    "Neonskilt": "Neon sign",
    "Minik\u00f8leskab": "Mini fridge",
    "VR-briller": "VR headset",
    "Racerstol": "Racing chair",
    "Redningsfyrt\u00e5rn": "Rescue lighthouse",
    "Brandbil": "Fire engine",
    "Politibil": "Police car",
    "Redningsb\u00e5d": "Lifeboat",
    "Helikopter": "Helicopter",
    "Hundekurv": "Dog basket",
    "Knoglepude": "Bone cushion",
    "Potet\u00e6ppe": "Paw rug",
    "Poteplakat": "Paw poster",
    "Madsk\u00e5l": "Food bowl",
    "Hvalpebamse": "Puppy plush",
    "Scene": "Stage",
    "Mikrofon": "Microphone",
    "Spotlight": "Spotlight",
    "Discokugle": "Disco ball",
    "H\u00f8jttaler": "Speaker",
    "Neonhjerte": "Neon heart",
    "Bandplakat": "Band poster",
    "Glimmergardin": "Glitter curtain",
    "Keyboard": "Keyboard",
    "Lysstav": "Light stick",
    "Guldplade": "Gold record",
    "Raket": "Rocket",
    "Planetlampe": "Planet lamp",
    "Teleskop": "Telescope",
    "Rumdragt": "Space suit",
    "UFO-lampe": "UFO lamp",
    "Rumv\u00e6sen-bamse": "Alien plush",
    "Stjernekort": "Star map",
    "Robot": "Robot",
    "Globus": "Globe",
    "Kaninbur": "Rabbit hutch",
    "Hamsterbur": "Hamster cage",
    "Kradsetr\u00e6": "Cat tree",
    "Papeg\u00f8je p\u00e5 pind": "Parrot on a perch",
    "Skildpadde": "Tortoise",
    "Gyngehest": "Rocking horse",
    "Enhj\u00f8rning-bamse": "Unicorn plush",
    "Fuglehus": "Birdhouse",
    "Palme": "Palm tree",
    "Lianer": "Vines",
    "Abebamse": "Monkey plush",
    "L\u00f8vet\u00e6ppe": "Lion rug",
    "Bambus": "Bamboo",
    "Tropeplakat": "Tropical poster",
    "Krokodille-bamse": "Crocodile plush",
    "Basketkurv": "Basketball hoop",
    "Fodboldm\u00e5l": "Football goal",
    "Skateboard": "Skateboard",
    "Trampolin": "Trampoline",
    "Bokses\u00e6k": "Punching bag",
    "L\u00f8becykel": "Balance bike",
    "Pokalhylde": "Trophy shelf",
    "Medaljer": "Medals",
    "Staffeli": "Easel",
    "Kridttavle": "Chalkboard",
    "Malerpletter": "Paint splash rug",
    "Garnkurv": "Yarn basket",
    "Byggebord": "Building table",
    "Uro med stjerner": "Star mobile",
    "Tegninger p\u00e5 snor": "Drawings on a string",
    "Muslingeseng": "Shell bed",
    "S\u00f8stjernepude": "Starfish cushion",
    "Fiskeuro": "Fish mobile",
    "Dykkerhjelm": "Diving helmet",
    "Stort akvarie": "Big aquarium",
    "Bl\u00e6ksprutte-bamse": "Octopus plush",
    "Skib i flaske": "Ship in a bottle",
    "Trone": "Throne",
    "Slotsseng": "Castle bed",
    "Rustning": "Suit of armour",
    "Skjold": "Shield",
    "Dragebamse": "Dragon plush",
    "Slotsport": "Castle gate",
    "Fane": "Banner",
    "Gr\u00e6skarlygte": "Pumpkin lantern",
    "Sp\u00f8gelse": "Ghost",
    "Edderkoppespind": "Spider web",
    "Heksekedel": "Witch's cauldron",
    "Flagermus-guirlande": "Bat garland",
    "Sliksk\u00e5l": "Sweets bowl",
    "Juletr\u00e6": "Christmas tree",
    "Julesok": "Christmas stocking",
    "Julegaver": "Christmas presents",
    "Nisse": "Elf",
    "Snemand": "Snowman",
    "Adventskrans": "Advent wreath",
    "Julestjerne": "Christmas star",
    "P\u00e5skekurv": "Easter basket",
    "P\u00e5skekylling": "Easter chick",
    "P\u00e5skehare": "Easter bunny",
    "G\u00e6kkebrev": "Snowdrop letter",
    "P\u00e5skeliljer": "Daffodils",
    "Lagkage": "Layer cake",
    "Balloner": "Balloons",
    "Flagguirlande": "Bunting",
    "Gave\u00e6ske": "Present",
    "Tillykke-banner": "Birthday banner",
    "Fastelavnst\u00f8nde": "Shrovetide barrel",
    "Udkl\u00e6dningskiste": "Dressing-up chest",
    "Maske": "Mask",
    "Fyrv\u00e6rkeriplakat": "Fireworks poster",
    "Konfettikanon": "Confetti cannon",
    "Nyt\u00e5rsur": "New Year clock",
    "Lejrb\u00e5l": "Campfire",
    "Solsikker": "Sunflowers",
    "Hjertepude": "Heart cushion",
    "Hjerteballon": "Heart balloon",
    "Bordflag": "Table flag",
    "R\u00f8d-hvid guirlande": "Red and white garland",
    "Poter": "Paws",
    "Neon": "Neon",
    "Glimmer": "Glitter",
    "Galakse": "Galaxy",
    "Junglerblade": "Jungle leaves",
    "Bobler": "Bubbles",
    "Slotsmur": "Castle wall",
    "Flagermus": "Bats",
    "Snefnug": "Snowflakes",
    "Guldtapet": "Gold wallpaper",
    "Regnbuestriber": "Rainbow stripes",
    "Scenegulv": "Stage floor",
    "M\u00e5nest\u00f8v": "Moon dust",
    "Kunstgr\u00e6s": "Artificial grass",
    "Sand": "Sand",
    "Gamer-t\u00e6ppe": "Gamer rug",
    "Regnbuegulv": "Rainbow floor",
    "Hunde\u00f8rer": "Dog ears",
    "Headset": "Headset",
    "Rumhjelm": "Space helmet",
    "Stjernebriller": "Star glasses",
    "Heksehat": "Witch's hat",
    "Nissehue": "Elf hat",
    "Kanin\u00f8rer": "Bunny ears",
    "Festhat": "Party hat",
    "Ridderhjelm": "Knight's helmet",
    "Guldkrone": "Gold crown",
    "Redningshvalpene": "The rescue pups",
    "Popstjerne": "Pop star",
    "Gamer-setup": "Gaming setup",
    "Dyrevenner": "Animal friends",
    "Sport": "Sport",
    "Kreativt hj\u00f8rne": "Creative corner",
    "Junglen": "The jungle",
    "Rumrejsen": "The space trip",
    "Havets bund": "The sea bed",
    "Eventyrslottet": "The fairy-tale castle",
    "Halloween": "Halloween",
    "Jul": "Christmas",
    "P\u00e5ske": "Easter",
    "F\u00f8dselsdag": "Birthday",
    "Fastelavn": "Shrovetide",
    "Nyt\u00e5r": "New Year",
    "Sankt Hans": "Midsummer",
    "Valentinsdag": "Valentine's Day",
    "Grundlovsdag": "Constitution Day",
    "Puder, telte, lysk\u00e6der og en skattekiste til en hemmelig hule.": "Cushions, tents, fairy lights and a treasure chest for a secret den.",
    "Et redningsfyrt\u00e5rn, biler, b\u00e5de og alt til hvalpene p\u00e5 mission.": "A rescue lighthouse, cars, boats and everything for the pups on a mission.",
    "En scene med lys, mikrofon og glimmer. Nu skal der danses.": "A stage with lights, a microphone and glitter. Time to dance.",
    "Sk\u00e6rme, konsol, arkademaskine og LED-lys til det fede gamerhj\u00f8rne.": "Screens, a console, an arcade machine and LED lights for the cool gaming corner.",
    "Kanin, hamster, papeg\u00f8je og en gyngehest.": "Rabbit, hamster, parrot and a rocking horse.",
    "M\u00e5l, kurv, trampolin og pokaler.": "Goal, hoop, trampoline and trophies.",
    "Staffeli, kridttavle og byggebord.": "Easel, chalkboard and a building table.",
    "Palmer, lianer og en abe i v\u00e6relset.": "Palms, vines and a monkey in the room.",
    "Raket, rumdragt og UFO-lampe.": "Rocket, space suit and a UFO lamp.",
    "Muslingeseng, stort akvarie og bl\u00e6ksprutte.": "Shell bed, big aquarium and an octopus.",
    "Trone, slotsseng, rustning og en drage.": "Throne, castle bed, armour and a dragon.",
    "Gr\u00e6skar, sp\u00f8gelser og spindelv\u00e6v.": "Pumpkins, ghosts and cobwebs.",
    "Juletr\u00e6, nisse, gaver og snemand.": "Christmas tree, elf, presents and a snowman.",
    "Kylling, hare, \u00e6g og g\u00e6kkebrev.": "Chick, bunny, eggs and a snowdrop letter.",
    "Lagkage, balloner og flag til f\u00f8dselsdagen.": "Cake, balloons and flags for the birthday.",
    "T\u00f8nde, maske og udkl\u00e6dningskiste.": "Barrel, mask and a dressing-up chest.",
    "Fyrv\u00e6rkeri og konfetti.": "Fireworks and confetti.",
    "Lejrb\u00e5l og solsikker.": "Campfire and sunflowers.",
    "Hjerter til dem, man holder af.": "Hearts for the ones you love.",
    "Flag og r\u00f8d-hvid guirlande.": "Flags and a red and white garland.",
    Værelset: "The room", Hulen: "The den", Trætophuset: "The tree house", Rumstationen: "The space station", "Den store scene": "The big stage",
    Hud: "Skin", Hår: "Hair", Hårfarve: "Hair colour", Trøje: "Top", Bukser: "Trousers", Ekstra: "Extra", "Der er ikke plads til mere": "There's no room for more", "Vælg, hvem du er.": "Choose who you are.",
    ...WORLD_NAMES_EN,
  },
};
