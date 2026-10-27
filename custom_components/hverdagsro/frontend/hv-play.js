/* Hverdagsro – Mit værelse: the child's own room, a little doll's house they build themselves.
   The child has an avatar they dress, their pet lives in the room, furniture and wall things are dragged in from a
   drawer, and the day's routine cards and missions float in the room as bubbles to tap when they are done. The real
   lights of the child's room are switched from the switch on the wall. Stored on the member: member.playroom. */
import { esc } from "./hv-core.js";
import { svg } from "./hv-icons.js";
import * as Kids from "./hv-kids.js";

const W = 1000, H = 620, FLOOR = 440;
const OL = "#2B2340"; // the outline everything is drawn with
const S = (o = "") => `stroke="${OL}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"${o ? " " + o : ""}`;
const shade = (hex, k) => {
  const n = parseInt(String(hex).slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
};

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
function avatarSvg(me, mood = "") {
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
  }[me.extra] || "";
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
  const floor = FLOORS[d.floor] || FLOORS.lys;
  const fl = d.floor === "tern" ? `<rect width="80" height="40" fill="#F3F3F3"/><rect width="40" height="20" fill="#CFCFE0"/><rect x="40" y="20" width="40" height="20" fill="#CFCFE0"/>` : d.floor === "lys" || d.floor === "mork" ? `<rect width="200" height="36" fill="${floor[1]}"/><path d="M0 35 h200 M120 0 v36" stroke="${shade(floor[1], 0.82)}" stroke-width="3"/>` : `<rect width="40" height="40" fill="${floor[1]}"/><circle cx="20" cy="20" r="2" fill="${shade(floor[1], 0.9)}"/>`;
  return `<defs>${pat ? `<pattern id="pl-wp" width="${p === "skyer" ? 80 : 60}" height="60" patternUnits="userSpaceOnUse">${pat}</pattern>` : ""}<pattern id="pl-fl" width="${d.floor === "lys" || d.floor === "mork" ? 200 : d.floor === "tern" ? 80 : 40}" height="${d.floor === "lys" || d.floor === "mork" ? 36 : d.floor === "tern" ? 40 : 40}" patternUnits="userSpaceOnUse">${fl}</pattern>
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
  const wd = (new Date().getDay() + 6) % 7;
  if (ctx.feature(m, "missions"))
    for (const x of ctx.data.missions || [])
      if ((x.member === m.id || x.member === "all") && (x.days || []).includes(wd) && !(`${x.id}:${m.id}` in dt)) out.push({ kind: "mission", id: x.id, em: x.emoji || "⭐", label: x.title, pts: x.points });
  for (const x of Kids.homeworkFor ? Kids.homeworkFor(ctx, m.id) : []) if (!(`${x.id}:${m.id}` in dt)) out.push({ kind: "homework", id: x.id, em: "✏️", label: x.t });
  void iso;
  return out.slice(0, 9);
}
const hourIn = (slot) => {
  const h = new Date().getHours() + new Date().getMinutes() / 60, hh = h < 5 ? h + 24 : h;
  return { morgen: [5, 12], eftermiddag: [12, 17.5], aften: [17.5, 29] }[slot]?.[0] <= hh && hh < ({ morgen: [5, 12], eftermiddag: [12, 17.5], aften: [17.5, 29] }[slot]?.[1] ?? 0);
};

function stage(ctx, m) {
  const d = ST.d, [s0, s1, tod] = sky(ctx), lights = realLights(ctx, m), lit = lights.some((id) => ctx.hass.states[id]?.state === "on");
  const happy = (() => {
    const L = bubbles(ctx, m);
    return L.length < 3;
  })();
  let s = patternDefs(d);
  s += `<rect width="${W}" height="${FLOOR}" fill="${d.wall?.p && d.wall.p !== "ren" ? "url(#pl-wp)" : wallFill(d)}"/><rect y="${FLOOR - 16}" width="${W}" height="16" fill="#fff" ${S()}/>`;
  s += `<rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="url(#pl-fl)"/><rect y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="url(#pl-shadow)" opacity=".0"/>`;
  // the window shows the real sky
  s += `<g class="pl-win"><rect x="560" y="70" width="230" height="200" rx="14" fill="#fff" ${S()}/><linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s0}"/><stop offset="1" stop-color="${s1}"/></linearGradient><rect x="574" y="84" width="202" height="172" rx="6" fill="url(#pl-sky)"/>${
    tod === "night" ? `<circle cx="720" cy="130" r="22" fill="#FFF6C9"/><circle cx="730" cy="122" r="20" fill="${s0}"/>${[[600, 110], [640, 150], [690, 100], [750, 200], [610, 210]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" class="pl-twinkle"/>`).join("")}` : `<circle cx="720" cy="130" r="26" fill="#FFE066" ${tod === "dusk" ? 'opacity=".8"' : ""}/><g class="pl-cloud"><ellipse cx="630" cy="150" rx="34" ry="14" fill="#fff"/><ellipse cx="650" cy="140" rx="22" ry="16" fill="#fff"/></g>`
  }<path d="M675 84 v172 M574 170 h202" ${S()} fill="none"/><path d="M560 60 h230" stroke="#FF6B6B" stroke-width="16" stroke-linecap="round"/></g>`;
  // the light switch for the real lights
  if (lights.length) s += `<g class="pl-switch${lit ? " on" : ""}" data-pl="light" role="button" aria-label="${esc(ctx.t("Lyset i dit værelse"))}"><rect x="500" y="210" width="40" height="60" rx="8" fill="#fff" ${S()}/><rect x="510" y="${lit ? 222 : 240}" width="20" height="20" rx="5" fill="${lit ? "#FFD93D" : "#CFCFE0"}" ${S("stroke-width=\"3\"")}/></g>`;
  // things, back to front
  const drawItem = (it) => {
    const T = ITEMS[it.k];
    if (!T) return "";
    const sc = it.s || 1, sel = ST.build && ST.sel === it.id;
    return `<g class="pl-it${T[1] === "lys" ? " lampit" : ""}${sel ? " sel" : ""}" data-pl="item" data-id="${esc(it.id)}" transform="translate(${it.x} ${it.y}) scale(${it.f ? -sc : sc} ${sc})">${T[4](it.c || T[3])}${sel ? `<rect x="-${ITEMW(it.k) / 2 + 12}" y="-${ITEMH(it.k) + 12}" width="${ITEMW(it.k) + 24}" height="${ITEMH(it.k) + 24}" rx="16" class="pl-selbox"/>` : ""}</g>`;
  };
  const wallIt = d.items.filter((it) => ITEMS[it.k] && ITEMS[it.k][1] === "væg"), flat = d.items.filter((it) => ITEMS[it.k]?.[2] === 1);
  s += wallIt.map(drawItem).join("") + flat.map(drawItem).join("");
  const actors = [
    ...d.items.filter((it) => ITEMS[it.k] && ITEMS[it.k][1] !== "væg" && ITEMS[it.k][2] !== 1).map((it) => [it.y, drawItem(it)]),
    [d.ay, `<g class="pl-me" data-pl="me" transform="translate(${d.ax} ${d.ay})"><ellipse cx="0" cy="0" rx="56" ry="10" fill="rgba(0,0,0,.14)"/><g class="pl-body">${avatarSvg(d.me, ST.mood || (tod === "night" && !lit ? "sleep" : ""))}</g></g>`],
    ...(m.pet && ctx.feature(m, "pet") ? [[d.py, `<g class="pl-pet${happy ? " happy" : ""}" data-pl="pet" transform="translate(${d.px} ${d.py}) scale(.8)"><ellipse cx="0" cy="0" rx="60" ry="10" fill="rgba(0,0,0,.14)"/><g class="pl-petb">${petInRoom(m, happy)}</g><text y="-150" text-anchor="middle" class="pl-petname">${esc(m.pet.name || "")}</text></g>`]] : []),
  ].sort((a, b) => a[0] - b[0]);
  s += actors.map((a) => a[1]).join("");
  // night: dark unless the lights are on
  s += `<rect width="${W}" height="${H}" class="pl-dark" fill="#0B1030" opacity="${tod === "night" && !lit ? 0.42 : tod === "dusk" && !lit ? 0.18 : 0}" pointer-events="none"/>`;
  if (lit) s += `<rect width="${W}" height="${H}" fill="#FFD27A" opacity=".08" pointer-events="none"/>`;
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

/* ------------------------------------------------------------------ the page */
function render(ctx) {
  const m = ctx.me;
  if (!m) return `<section class="card"><p class="t-sub">${esc(ctx.t("Vælg, hvem du er."))}</p></section>`;
  if (!ST || ST.kid !== m.id) ST = { kid: m.id, d: JSON.parse(JSON.stringify(m.playroom || defaults(m))), sel: null, build: false, tab: "mob" };
  const B = bubbles(ctx, m), pts = ctx.points(m.id), lights = realLights(ctx, m), lit = lights.some((id) => ctx.hass.states[id]?.state === "on");
  const head = `<div class="pl-head"><div><span class="eyebrow">${esc(ctx.t("Mit værelse"))}</span><h2 class="h2">${esc(ctx.t("Hej {name}!", { name: m.name }))}</h2><span class="t-sub">${esc(ST.build ? ctx.t("Træk tingene derhen, hvor de skal stå. Tryk på noget for at ændre det.") : B.length ? ctx.t("Tryk på boblerne, når du har gjort det.") : ctx.t("Alt er klaret lige nu. Godt gået!"))}</span></div>
    <div class="pl-acts">${lights.length && !ST.build ? `<button class="btn soft" data-go="mitlys">${svg("bulb")}${esc(ctx.t("Lys og stemning"))}</button>` : ""}${ctx.feature(m, "points") ? `<span class="pl-pill">${svg("pstar")}<b class="num">${pts}</b></span>` : ""}<button class="btn${ST.build ? "" : " soft"}" data-pl="build">${svg(ST.build ? "check" : "edit")}${esc(ST.build ? ctx.t("Færdig") : ctx.t("Byg dit værelse"))}</button></div></div>`;
  return `<div class="pl" style="--pc:${esc(m.color)}">${head}<div class="pl-stagebox${ST.build ? " build" : ""}"><svg id="pl-stage" class="${lit ? "on" : ""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ctx.t("Dit værelse"))}">${stage(ctx, m)}</svg>${ST.build ? selTools(ctx) : ""}</div>${ST.build ? drawer(ctx, m) : ""}</div>`;
}
function selTools(ctx) {
  const it = ST.d.items.find((x) => x.id === ST.sel);
  if (!it) return `<div class="pl-tip">${esc(ctx.t("Vælg noget nedenfor, eller træk i tingene for at flytte dem."))}</div>`;
  return `<div class="pl-tools"><b>${esc(ctx.t(ITEMS[it.k][0]))}</b><button data-pl="t-color" aria-label="${esc(ctx.t("Farve"))}"><i style="background:${esc(it.c || ITEMS[it.k][3])}"></i></button><button data-pl="t-flip" aria-label="${esc(ctx.t("Vend"))}">⇆</button><button data-pl="t-small" aria-label="${esc(ctx.t("Mindre"))}">−</button><button data-pl="t-big" aria-label="${esc(ctx.t("Større"))}">+</button><button data-pl="t-del" aria-label="${esc(ctx.t("Fjern"))}">${svg("trash")}</button></div>`;
}
function drawer(ctx, m) {
  const tabs = [["mob", "Møbler"], ["leg", "Legetøj"], ["lys", "Lamper"], ["væg", "På væggen"], ["tapet", "Tapet og gulv"], ["mig", "Mig"]];
  const thumb = (k) => `<button class="pl-th" data-pl="add" data-k="${k}"><svg viewBox="${-ITEMW(k) / 2 - 14} ${-ITEMH(k) - 14} ${ITEMW(k) + 28} ${ITEMH(k) + 28}" aria-hidden="true">${ITEMS[k][4](ITEMS[k][3])}</svg><span>${esc(ctx.t(ITEMS[k][0]))}</span></button>`;
  let body = "";
  if (ST.tab === "tapet")
    body = `<div class="pl-row"><b>${esc(ctx.t("Væggen"))}</b>${Object.entries(WALLS).map(([k, c]) => `<button class="pl-sw" data-pl="wall" data-k="${k}" aria-pressed="${ST.d.wall?.c === k}" style="--c:${c}" aria-label="${esc(k)}"></button>`).join("")}</div>
      <div class="pl-row">${Object.entries(PATTERNS).map(([k, n]) => `<button class="pl-chip" data-pl="pat" data-k="${k}" aria-pressed="${(ST.d.wall?.p || "ren") === k}">${esc(ctx.t(n))}</button>`).join("")}</div>
      <div class="pl-row"><b>${esc(ctx.t("Gulvet"))}</b>${Object.entries(FLOORS).map(([k, [n, c]]) => `<button class="pl-chip" data-pl="floor" data-k="${k}" aria-pressed="${ST.d.floor === k}"><i style="background:${c}"></i>${esc(ctx.t(n))}</button>`).join("")}</div>`;
  else if (ST.tab === "mig") {
    const me = ST.d.me;
    const sw = (key, list) => list.map((c) => `<button class="pl-sw" data-pl="me" data-f="${key}" data-k="${c}" aria-pressed="${me[key] === c}" style="--c:${c}" aria-label="${esc(c)}"></button>`).join("");
    body = `<div class="pl-row"><b>${esc(ctx.t("Hud"))}</b>${sw("skin", SKINS)}</div>
      <div class="pl-row"><b>${esc(ctx.t("Hår"))}</b>${Object.entries(HAIRS).map(([k, n]) => `<button class="pl-chip" data-pl="me" data-f="hair" data-k="${k}" aria-pressed="${me.hair === k}">${esc(ctx.t(n))}</button>`).join("")}</div>
      <div class="pl-row"><b>${esc(ctx.t("Hårfarve"))}</b>${sw("hairc", HAIRC)}</div>
      <div class="pl-row"><b>${esc(ctx.t("Trøje"))}</b>${sw("top", PAL)}</div>
      <div class="pl-row"><b>${esc(ctx.t("Bukser"))}</b>${sw("bottom", PAL)}</div>
      <div class="pl-row"><b>${esc(ctx.t("Ekstra"))}</b>${Object.entries(EXTRAS).map(([k, n]) => `<button class="pl-chip" data-pl="me" data-f="extra" data-k="${k}" aria-pressed="${(me.extra || "ingen") === k}">${esc(ctx.t(n))}</button>`).join("")}</div>`;
  } else body = `<div class="pl-ths">${Object.keys(ITEMS).filter((k) => ITEMS[k][1] === ST.tab || (ST.tab === "mob" && ITEMS[k][1] === "pynt")).map(thumb).join("")}</div>`;
  return `<section class="card pl-drawer"><div class="pl-tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" data-pl="tab" data-k="${k}" aria-selected="${ST.tab === k}">${esc(ctx.t(n))}</button>`).join("")}</div>${body}</section>`;
}

/* ------------------------------------------------------------------ doing things */
function redraw(ctx) {
  const box = ctx.root.querySelector(".pl");
  if (!box) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = render(ctx);
  box.replaceWith(tmp.firstElementChild);
  bind(ctx);
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
function confetti(ctx, x, y, color) {
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
  const svgEl = ctx.$("pl-stage"), box = ctx.root.querySelector(".pl");
  if (!svgEl || !box || box._hv) return;
  box._hv = 1;
  let drag = null;
  svgEl.addEventListener("pointerdown", (e) => {
    const t = e.target.closest("[data-pl]"), p = toSvg(svgEl, e);
    if (!ST.build) {
      if (t?.dataset.pl === "bub") return tapBubble(ctx, t);
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
      const it = ST.d.items.find((x) => x.id === ST.sel);
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
    if (drag.kind === "item") {
      const it = drag.it, wall = ITEMS[it.k][1] === "væg";
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
    if (d.moved || d.kind === "item") {
      save(ctx);
      redraw(ctx);
    }
  };
  svgEl.addEventListener("pointerup", up);
  svgEl.addEventListener("pointercancel", up);
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-pl]");
    if (!b) return;
    const a = b.dataset.pl, k = b.dataset.k, it = ST.d.items.find((x) => x.id === ST.sel);
    if (a === "build") {
      ST.build = !ST.build;
      ST.sel = null;
      if (!ST.build) save(ctx);
    } else if (a === "tab") {
      ST.tab = k;
      if (k === "mig" || k === "tapet") ST.sel = null;
    }
    else if (a === "add") {
      const wall = ITEMS[k][1] === "væg", id = "i" + Math.random().toString(36).slice(2, 7);
      if (ST.d.items.length >= 140) return ctx.toast(ctx.t("Der er ikke plads til mere"));
      ST.d.items.push({ id, k, x: 380 + Math.round(Math.random() * 240), y: wall ? 200 : ITEMS[k][2] ? 600 : 560 });
      ST.sel = id;
      save(ctx);
    } else if (a === "wall") (ST.d.wall ||= {}).c = k;
    else if (a === "pat") (ST.d.wall ||= {}).p = k;
    else if (a === "floor") ST.d.floor = k;
    else if (a === "me") ST.d.me[b.dataset.f] = k;
    else if (it && a === "t-flip") it.f = it.f ? 0 : 1;
    else if (it && a === "t-big") it.s = Math.min(1.8, Math.round(((it.s || 1) + 0.15) * 100) / 100);
    else if (it && a === "t-small") it.s = Math.max(0.5, Math.round(((it.s || 1) - 0.15) * 100) / 100);
    else if (it && a === "t-color") it.c = PAL[(PAL.indexOf(it.c || ITEMS[it.k][3]) + 1) % PAL.length];
    else if (it && a === "t-del") {
      ST.d.items = ST.d.items.filter((x) => x !== it);
      ST.sel = null;
    } else return;
    if (a !== "tab" && a !== "build") save(ctx);
    redraw(ctx);
  });
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
  acts: {},
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
@media (max-width: 640px) { .pl-tools { top: 8px; bottom: auto; gap: 4px; padding: 4px 6px 4px 12px; } .pl-tools button { width: 38px; height: 38px; font-size: 18px; } .pl-tools b { font-size: 12px; } .pl-stagebox { border-radius: 20px; } .pl-th svg { width: 60px; height: 52px; } }
@media (prefers-reduced-motion: reduce) { .pl-me .pl-body, .pl-pet .pl-petb, .pl-bub, .pl-cloud, .pl-fish, .pl-twinkle { animation: none !important; } }
`,
  en: {
    "Mit værelse": "My room", "Hej {name}!": "Hi {name}!", "Tryk på boblerne, når du har gjort det.": "Tap the bubbles when you have done it.", "Alt er klaret lige nu. Godt gået!": "All done for now. Well done!",
    "Træk tingene derhen, hvor de skal stå. Tryk på noget for at ændre det.": "Drag things where they should go. Tap something to change it.", "Byg dit værelse": "Build your room", "Lys og stemning": "Lights and mood", Færdig: "Done", "Dit værelse": "Your room", "Lyset i dit værelse": "The light in your room",
    "Vælg noget nedenfor, eller træk i tingene for at flytte dem.": "Pick something below, or drag things to move them.", Farve: "Colour", Vend: "Flip", Mindre: "Smaller", Større: "Bigger", Fjern: "Remove",
    Møbler: "Furniture", Legetøj: "Toys", Lamper: "Lamps", "På væggen": "On the wall", "Tapet og gulv": "Wallpaper and floor", Mig: "Me", Væggen: "The wall", Gulvet: "The floor",
    Hud: "Skin", Hår: "Hair", Hårfarve: "Hair colour", Trøje: "Top", Bukser: "Trousers", Ekstra: "Extra", "Der er ikke plads til mere": "There's no room for more", "Vælg, hvem du er.": "Choose who you are.",
  },
};
