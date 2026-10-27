/* Hverdagsro – the things of Centrum: the café, the hair salon, the post office, the rooftop, the hospital, the mall,
   the university, the big houses and the campsite. Our own drawings, in the same shape as hv-playcat's THINGS:
   key: [name, category, colour, w, h, draw(c), price, flat]. They stand in the places; most can be bought in packs. */
import { OL, shade, DRAW } from "./hv-playcat.js";

const { r, c, e, p, ln, dot, gl, L, tx, star, heart, rep, leaf, T3 } = DRAW;

export const CITY_THINGS = {
  /* ---------------------------------------------------------------- café */
  cafebord: ["Cafébord", "mob", "#FFFFFF", 130, 110, (k) => `${e(0, -96, 60, 12, k)}${ln("M0 -86 V-8", OL, 6)}${e(0, -6, 36, 7, "#9AA4BA")}${r(-28, -118, 22, 22, "#FF9AB5", 6, T3)}${p("M10 -104 q8 -16 18 0z", "#E9B65A", T3)}`, 20],
  menutavle: ["Menutavle", "væg", "#2B2340", 160, 120, (k) => `${r(-74, -116, 148, 108, "#C98B55", 8)}${r(-66, -108, 132, 92, k, 4, T3)}${tx(0, -84, "MENU", 18, "#fff")}${rep(3, (i) => ln(`M-50 ${-64 + i * 16} H${30 - i * 10}`, "#FFF3D6", 3))}${tx(46, -40, "☕", 18, "#fff")}`, 15],
  kagemontre: ["Kagemontre", "mob", "#E8F6FF", 200, 140, (k) => `${r(-92, -60, 184, 60, "#C98B55", 6)}${p("M-88 -60 V-120 Q0 -140 88 -120 V-60Z", k, 'fill-opacity=".7"')}${rep(4, (i) => `${r(-76 + i * 40, -84, 30, 22, ["#FF9AB5", "#FFE0BD", "#B9E4C9", "#8B5A3C"][i], 4, T3)}${dot(-61 + i * 40, -90, 4, "#E5484D")}`)}`, 25],
  espresso: ["Espressomaskine", "pynt", "#CFD6E6", 140, 110, (k) => `${r(-60, -100, 120, 100, k, 10)}${r(-50, -90, 100, 30, "#3A3A55", 6, T3)}${rep(2, (i) => `${r(-36 + i * 48, -56, 20, 14, "#3A3A55", 3, T3)}${r(-38 + i * 48, -30, 24, 26, "#fff", 4, T3)}`)}${dot(40, -76, 5, "#6BCB77")}`, 20],
  /* ---------------------------------------------------------------- the post office */
  postskranke: ["Postskranke", "mob", "#E5484D", 260, 140, (k) => `${r(-120, -100, 240, 100, k, 8)}${r(-120, -110, 240, 14, "#FFD93D", 6)}${r(-60, -76, 120, 40, "#fff", 6, T3)}${tx(0, -48, "POST", 22, "#E5484D")}${r(60, -136, 40, 26, "#E8C39E", 3, T3)}`, 25],
  postsaek: ["Postsæk", "leg", "#E8C39E", 100, 100, (k) => `${p("M-40 0 Q-50 -60 -24 -84 L-10 -96 H10 L24 -84 Q50 -60 40 0Z", k)}${ln("M-14 -88 H14", "#C98B55", 6)}${p("M-12 -46 h24 v16 h-24z M-12 -46 l12 9 l12 -9", "#fff", T3)}`, 10],
  pakkehylde: ["Pakkehylde", "mob", "#C98B55", 180, 200, (k) => `${r(-80, -196, 160, 196, k, 6)}${rep(3, (i) => ln(`M-80 ${-130 + i * 64} H80`, shade(k, 0.7), 6))}${rep(6, (i) => r(-70 + (i % 3) * 50, -186 + Math.floor(i / 3) * 64, 40, 40 - (i % 2) * 10, i % 2 ? "#E8C39E" : "#FF9AB5", 3, T3))}`, 20],
  /* ---------------------------------------------------------------- the rooftop */
  jukebox: ["Musikafspiller", "mob", "#9B5DE5", 130, 200, (k) => L(`${gl(0, -110, 70, 90, "#E0C3FF")}${p("M-56 0 V-140 Q-56 -196 0 -196 Q56 -196 56 -140 V0Z", k)}${p("M-40 -140 Q-40 -176 0 -176 Q40 -176 40 -140 V-100 H-40Z", "#FFD93D", T3)}${rep(4, (i) => ln(`M${-30 + i * 20} -150 V-110`, "#FF6B6B", 4))}${r(-40, -84, 80, 30, "#2B2340", 4, T3)}${rep(3, (i) => dot(-20 + i * 20, -36, 6, ["#6BCB77", "#FF6B6B", "#00BBF9"][i]))}`), 35],
  festlamper: ["Festlamper", "væg", "#FFD93D", 300, 80, (k) => L(`${p("M-146 -70 Q0 -10 146 -70", "none")}${rep(8, (i) => `${gl(-126 + i * 36, -50 + Math.abs(i - 3.5) * -6, 14, 14, ["#FFE066", "#FF9AB5", "#9FD4FF"][i % 3])}${c(-126 + i * 36, -50 + Math.abs(i - 3.5) * -6, 9, ["#FFD93D", "#F15BB5", "#4D96FF"][i % 3], T3)}`)}`), 15],
  solseng: ["Solseng", "mob", "#FFFFFF", 220, 80, (k) => `${ln("M-90 0 V-20 M80 0 V-20", "#9AA4BA", 6)}${p("M-100 -30 H50 L100 -70 L106 -60 L60 -20 H-100Z", k)}${rep(4, (i) => ln(`M${-80 + i * 34} -30 V-22`, "#4D96FF", 4))}`, 20],
  /* ---------------------------------------------------------------- the hospital */
  hospitalsseng: ["Hospitalsseng", "mob", "#E8F6FF", 280, 160, (k) => `${ln("M-120 0 V-80 M120 0 V-120", "#9AA4BA", 8)}${r(-130, -70, 260, 26, "#9AA4BA", 6)}${r(-124, -96, 248, 30, k, 8)}${r(-120, -110, 60, 20, "#fff", 8, T3)}${c(-110, -4, 8, OL)}${c(110, -4, 8, OL)}`, 30],
  roentgen: ["Røntgenbillede", "væg", "#2B2340", 130, 130, (k) => L(`${gl(0, -66, 60, 60, "#BFE6FF")}${r(-56, -124, 112, 116, k, 6)}${c(0, -100, 16, "none", 'stroke="#fff" stroke-width="5"')}${ln("M0 -84 V-36 M-24 -70 H24 M-18 -56 H18 M-12 -42 H12 M0 -36 L-16 -18 M0 -36 L16 -18", "#fff", 4)}`), 15],
  rullestol: ["Kørestol", "mob", "#4D96FF", 140, 140, (k) => `${c(-20, -40, 40, "none", `stroke="${OL}" stroke-width="8"`)}${c(-20, -40, 40, "none", `stroke="#9AA4BA" stroke-width="4"`)}${r(-50, -86, 70, 14, k, 4)}${r(10, -136, 14, 64, k, 4)}${c(40, -10, 10, OL)}${ln("M20 -78 L40 -20", OL, 4)}`, 20],
  ambulance: ["Ambulance", "leg", "#FFFFFF", 220, 130, (k) => `${p("M-100 -30 V-110 H40 L90 -70 V-30Z", k)}${r(-104, -36, 200, 14, "#E5484D", 6)}${p("M-50 -96 v20 m-10 -10 h20", "none", 'stroke="#E5484D" stroke-width="8"')}${p("M48 -100 L80 -72 H48Z", "#BFE6FF", T3)}${r(-16, -124, 28, 14, "#4D96FF", 4, T3)}${c(-60, -20, 18, OL)}${c(56, -20, 18, OL)}`, 30],
  apotek: ["Medicinskab", "mob", "#B9E4C9", 140, 200, (k) => `${r(-64, -196, 128, 196, k, 8)}${p("M-10 -180 h20 v14 h14 v20 h-14 v14 h-20 v-14 h-14 v-20 h14z", "#fff", T3)}${rep(3, (i) => ln(`M-64 ${-110 + i * 40} H64`, shade(k, 0.7), 5))}${rep(6, (i) => r(-54 + (i % 3) * 38, -104 + Math.floor(i / 3) * 40, 26, 30, ["#FF9AB5", "#FFD93D", "#BFE6FF"][i % 3], 6, 'stroke-width="2"'))}`, 20],
  /* ---------------------------------------------------------------- the mall */
  indkoebsvogn: ["Indkøbsvogn", "leg", "#9AA4BA", 150, 120, (k) => `${p("M-60 -100 H60 L48 -40 H-48Z", "none", `stroke="${k}" stroke-width="6"`)}${rep(4, (i) => ln(`M${-44 + i * 30} -96 L${-38 + i * 26} -44`, k, 3))}${ln("M60 -100 L76 -120 H90", OL, 6)}${c(-40, -14, 10, OL)}${c(40, -14, 10, OL)}${r(-30, -90, 30, 24, "#FF6B6B", 4, T3)}${c(14, -80, 12, "#6BCB77", T3)}`, 15],
  butiksvindue: ["Butiksvindue", "mob", "#F15BB5", 260, 220, (k) => `${r(-120, -216, 240, 216, k, 6)}${r(-104, -170, 208, 150, "#E8F6FF", 4, T3)}${tx(0, -186, "SHOP", 20, "#fff")}${c(-50, -110, 18, "#FFE0BD", T3)}${p("M-74 -92 h48 l8 60 h-64z", "#FFD93D", T3)}${c(50, -110, 18, "#C98B55", T3)}${p("M26 -92 h48 l8 60 h-64z", "#4D96FF", T3)}`, 30],
  rulletrappe2: ["Rulletrappe", "mob", "#CFD6E6", 280, 220, (k) => `${p("M-130 0 L60 -200 H130 V-180 H70 L-110 0Z", k)}${rep(8, (i) => ln(`M${-100 + i * 22} ${-30 - i * 22} h24`, shade(k, 0.7), 4))}${p("M-130 -40 L50 -230", "none", 'stroke-width="6"')}`, 30],
  /* ---------------------------------------------------------------- the university */
  auditorie: ["Auditoriebænk", "mob", "#C98B55", 280, 110, (k) => `${r(-130, -60, 260, 16, k, 4)}${r(-130, -100, 260, 12, shade(k, 0.85), 4)}${rep(4, (i) => ln(`M${-110 + i * 72} -44 V0`, OL, 6))}${rep(3, (i) => r(-90 + i * 80, -114, 40, 12, ["#4D96FF", "#FFD93D", "#FF6B6B"][i], 2, 'stroke-width="2"'))}`, 25],
  mikroskop: ["Mikroskop", "pynt", "#FFFFFF", 80, 120, (k) => `${r(-34, -14, 68, 14, OL, 4)}${p("M10 -14 V-60 Q10 -90 -10 -96", "none", 'stroke-width="10"')}${r(-24, -116, 18, 40, k, 6, 'transform="rotate(-20 -15 -96)"')}${r(-24, -50, 30, 8, "#9AA4BA", 2, T3)}`, 15],
  stortavle: ["Stor tavle", "væg", "#2F5D50", 280, 140, (k) => `${r(-132, -136, 264, 128, "#C98B55", 6)}${r(-124, -128, 248, 112, k, 4, T3)}${tx(-60, -90, "E = mc²", 22, "#fff")}${p("M20 -110 q20 -20 40 0 t40 0", "none", 'stroke="#fff" stroke-width="3"')}${ln("M30 -60 h80 M30 -44 h50", "#fff", 3)}`, 20],
  diplomhat: ["Studenterhue", "pynt", "#2B2340", 100, 60, (k) => `${p("M-46 -36 L0 -56 L46 -36 L0 -16Z", k)}${p("M-26 -28 V-8 Q0 4 26 -8 V-28", k)}${ln("M30 -38 V-6", "#FFD93D", 3)}${c(30, -4, 5, "#FFD93D", 'stroke-width="2"')}`, 10],
  /* ---------------------------------------------------------------- the big houses and the pool */
  pool: ["Swimmingpool", "mob", "#4FB3FF", 420, 60, (k) => `${r(-206, -40, 412, 40, "#E8F6FF", 10)}${r(-194, -34, 388, 28, k, 8, T3)}${rep(5, (i) => p(`M${-160 + i * 80} -22 q10 -6 20 0 q10 6 20 0`, "none", 'stroke="#fff" stroke-width="3"'))}${ln("M170 -40 V-90 M190 -40 V-90 M170 -60 H190 M170 -76 H190", "#9AA4BA", 4)}`, 40, 1],
  palme2: ["Palme i krukke", "pynt", "#6BCB77", 160, 220, (k) => `${p("M-30 0 L-24 -40 H24 L30 0Z", "#E8C39E")}${p("M0 -40 Q-6 -120 6 -170", "none", 'stroke="#A9764C" stroke-width="12"')}${rep(5, (i) => leaf(6, -170, -170 + i * 40, i % 2 ? k : shade(k, 0.85), 1.4))}`, 20],
  storsofa: ["Stor familiesofa", "mob", "#9B5DE5", 360, 150, (k) => `${r(-170, -120, 340, 70, shade(k, 0.85), 30)}${r(-176, -70, 352, 56, k, 20)}${r(-180, -100, 40, 90, k, 18)}${r(140, -100, 40, 90, k, 18)}${rep(3, (i) => r(-130 + i * 90, -110, 80, 50, i === 1 ? "#FFD93D" : "#FF9AB5", 18, T3))}${ln("M-150 -14 V0 M150 -14 V0", OL, 8)}`, 30],
  langbord: ["Langt spisebord", "mob", "#C98B55", 380, 130, (k) => `${r(-180, -110, 360, 18, k, 6)}${ln("M-160 -92 V0 M160 -92 V0", shade(k, 0.75), 10)}${rep(6, (i) => e(-150 + i * 60, -114, 18, 5, "#fff"))}${c(0, -128, 14, "#FF9AB5", T3)}`, 30],
  /* ---------------------------------------------------------------- the campsite */
  campingvogn: ["Campingvogn", "mob", "#FFFFFF", 300, 180, (k) => `${p("M-130 -30 V-130 Q-130 -160 -100 -160 H110 Q140 -160 140 -130 V-30Z", k)}${r(-130, -100, 270, 20, "#4D96FF", 0)}${r(-90, -140, 60, 40, "#BFE6FF", 6, T3)}${r(40, -140, 50, 100, "#C98B55", 6, T3)}${c(-40, -20, 20, OL)}${ln("M140 -40 h30", OL, 6)}`, 35],
  haengekoeje2: ["Hængekøje mellem træer", "mob", "#FF8A3C", 300, 220, (k) => `${ln("M-130 0 V-200 M130 0 V-200", "#8B5A3C", 16)}${rep(2, (i) => c(-130 + i * 260, -210, 40, "#6BCB77", T3))}${p("M-130 -150 Q0 -40 130 -150", "none", `stroke="${k}" stroke-width="22"`)}${p("M-130 -150 Q0 -40 130 -150", "none", 'stroke-width="3"')}`, 25],
};

export const CITY_EN = {
  "Cafébord": "Café table", Menutavle: "Menu board", Kagemontre: "Cake display", Espressomaskine: "Espresso machine",
  Postskranke: "Post counter", "Postsæk": "Mail bag", Pakkehylde: "Parcel shelf",
  Musikafspiller: "Music player", Festlamper: "Party lights", Solseng: "Sun lounger",
  Hospitalsseng: "Hospital bed", "Røntgenbillede": "X-ray", "Kørestol": "Wheelchair", Ambulance: "Ambulance", Medicinskab: "Medicine cabinet",
  "Indkøbsvogn": "Shopping trolley", Butiksvindue: "Shop window", Rulletrappe: "Escalator",
  "Auditoriebænk": "Lecture bench", Mikroskop: "Microscope", "Stor tavle": "Big blackboard", Studenterhue: "Graduation cap",
  Swimmingpool: "Swimming pool", "Palme i krukke": "Palm in a pot", "Stor familiesofa": "Big family sofa", "Langt spisebord": "Long dining table",
  Campingvogn: "Caravan", "Hængekøje mellem træer": "Hammock between trees",
};

/* The packs with Centrum's things, in the shop. */
export const CITY_PACKS = [
  { id: "cafe", n: "Caféen", em: "☕", lvl: 1, d: "Cafébord, menutavle, kagemontre og espressomaskine.", items: ["cafebord", "menutavle", "kagemontre", "espresso"] },
  { id: "posthus", n: "Posthuset", em: "📮", lvl: 1, d: "Postskranke, postsæk og en hylde fuld af pakker.", items: ["postskranke", "postsaek", "pakkehylde"] },
  { id: "tagfest", n: "Fest på taget", em: "🎉", lvl: 2, d: "Musikafspiller, festlamper og en solseng.", items: ["jukebox", "festlamper", "solseng"] },
  { id: "hospital", n: "Hospitalet", em: "🏥", lvl: 2, d: "Hospitalsseng, røntgen, kørestol, ambulance og medicinskab.", items: ["hospitalsseng", "roentgen", "rullestol", "ambulance", "apotek"] },
  { id: "indkob", n: "Indkøbscentret", em: "🛍️", lvl: 3, d: "Indkøbsvogn, butiksvindue og rulletrappe.", items: ["indkoebsvogn", "butiksvindue", "rulletrappe2"] },
  { id: "uni", n: "Universitetet", em: "🎓", lvl: 3, d: "Auditoriebænk, mikroskop, stor tavle og studenterhue.", items: ["auditorie", "mikroskop", "stortavle", "diplomhat"] },
  { id: "poolvilla", n: "Feriehuset med pool", em: "🏝️", lvl: 4, d: "Swimmingpool, solseng og palmer.", items: ["pool", "solseng", "palme2"] },
  { id: "storfamilie", n: "Storfamilien", em: "👨‍👩‍👧‍👦", lvl: 2, d: "En kæmpe sofa og et langt spisebord til hele familien.", items: ["storsofa", "langbord"] },
  { id: "campingvogn", n: "Campingvognen", em: "🚐", lvl: 2, d: "Campingvogn og hængekøje mellem træerne.", items: ["campingvogn", "haengekoeje2"] },
];
Object.assign(CITY_EN, {
  "Caféen": "The café", "Cafébord, menutavle, kagemontre og espressomaskine.": "Café table, menu board, cake display and espresso machine.",
  Posthuset: "The post office", "Postskranke, postsæk og en hylde fuld af pakker.": "Post counter, mail bag and a shelf full of parcels.",
  "Fest på taget": "Rooftop party", "Musikafspiller, festlamper og en solseng.": "Music player, party lights and a sun lounger.",
  Hospitalet: "The hospital", "Hospitalsseng, røntgen, kørestol, ambulance og medicinskab.": "Hospital bed, X-ray, wheelchair, ambulance and medicine cabinet.",
  "Indkøbscentret": "The mall", "Indkøbsvogn, butiksvindue og rulletrappe.": "Shopping trolley, shop window and escalator.",
  Universitetet: "The university", "Auditoriebænk, mikroskop, stor tavle og studenterhue.": "Lecture bench, microscope, big blackboard and graduation cap.",
  "Feriehuset med pool": "The pool holiday house", "Swimmingpool, solseng og palmer.": "Swimming pool, sun lounger and palms.",
  Storfamilien: "The big family", "En kæmpe sofa og et langt spisebord til hele familien.": "A huge sofa and a long dining table for the whole family.",
  Campingvognen: "The caravan", "Campingvogn og hængekøje mellem træerne.": "Caravan and a hammock between the trees.",
});

/* ------------------------------------------------------------------ furniture packs: cuddly bears, neon rainbow, calm and care */
Object.assign(CITY_THINGS, {
  bjoernestol: ["Bjørnestol", "mob", "#C98B55", 160, 170, (k) => `${c(-56, -150, 22, k)}${c(56, -150, 22, k)}${c(-56, -150, 11, "#F2D7A0", T3)}${c(56, -150, 11, "#F2D7A0", T3)}${r(-70, -150, 140, 110, k, 50)}${r(-80, -70, 160, 60, shade(k, 0.9), 26)}${dot(-22, -112, 6, OL)}${dot(22, -112, 6, OL)}${e(0, -96, 16, 10, "#F2D7A0", T3)}${dot(0, -100, 4, OL)}`, 30],
  skyseng: ["Skyseng", "mob", "#E8F6FF", 300, 160, (k) => `${p("M-140 -40 Q-160 -90 -110 -96 Q-100 -140 -50 -126 Q-20 -160 30 -130 Q80 -150 100 -110 Q150 -110 140 -40Z", k)}${r(-140, -50, 280, 40, "#FFFFFF", 16)}${r(-110, -80, 70, 30, "#FFC8DD", 14, T3)}${ln("M-130 -10 V0 M130 -10 V0", OL, 8)}`, 35],
  honninglampe: ["Honninglampe", "lys", "#FFD93D", 90, 130, (k) => L(`${gl(0, -70, 50, 50, "#FFE8A3")}${p("M-34 -30 Q-40 -100 0 -110 Q40 -100 34 -30Z", k)}${rep(3, (i) => ln(`M-32 ${-90 + i * 20} H32`, "#E9B65A", 4))}${r(-20, -30, 40, 30, "#C98B55", 6)}${p("M-10 -120 q10 -14 20 0", "none", T3)}`), 20],
  bamsereol: ["Bamsereol", "mob", "#F2D7A0", 160, 190, (k) => `${r(-74, -186, 148, 186, k, 10)}${rep(3, (i) => ln(`M-74 ${-126 + i * 60} H74`, "#C98B55", 6))}${rep(3, (i) => `${c(-40 + i * 40, -150, 16, ["#C98B55", "#FFFFFF", "#FF9AB5"][i], T3)}${c(-50 + i * 40, -164, 6, ["#C98B55", "#FFFFFF", "#FF9AB5"][i], 'stroke-width="2"')}${c(-30 + i * 40, -164, 6, ["#C98B55", "#FFFFFF", "#FF9AB5"][i], 'stroke-width="2"')}`)}`, 25],
  poteplaid: ["Plaid med poter", "leg", "#FF9AB5", 200, 40, (k) => `${p("M-90 -10 L-70 -36 H90 L70 -10Z", k)}${rep(4, (i) => `${dot(-50 + i * 34, -24, 5, "#fff")}${dot(-56 + i * 34, -30, 2.5, "#fff")}${dot(-44 + i * 34, -30, 2.5, "#fff")}`)}`, 15, 1],
  neonsofa: ["Neonsofa", "mob", "#F15BB5", 260, 120, (k) => L(`${gl(0, -60, 130, 40, "#FFC8DD")}${r(-120, -100, 240, 50, shade(k, 0.85), 20)}${r(-126, -56, 252, 44, k, 16)}${ln("M-120 -50 H120", "#00F5D4", 4)}${ln("M-100 -12 V0 M100 -12 V0", OL, 8)}`), 30],
  regnbuereol: ["Regnbuereol", "mob", "#FFFFFF", 180, 200, (k) => `${r(-80, -196, 160, 196, k, 8)}${rep(5, (i) => r(-70, -186 + i * 36, 140, 28, ["#FF6B6B", "#FFB347", "#FFD93D", "#6BCB77", "#4D96FF"][i], 4, T3))}`, 25],
  neonlampe: ["Neon-regnbuelampe", "lys", "#F15BB5", 160, 110, (k) => L(`${gl(0, -50, 80, 50, "#FFC8DD")}${rep(4, (i) => p(`M${-66 + i * 10} -10 A${66 - i * 10} ${66 - i * 10} 0 0 1 ${66 - i * 10} -10`, "none", `stroke="${["#F15BB5", "#FFD93D", "#00F5D4", "#9B5DE5"][i]}" stroke-width="7" stroke-linecap="round"`))}${r(-74, -12, 148, 12, OL, 4)}`), 25],
  diskogulv: ["Diskotæppe", "leg", "#9B5DE5", 260, 40, (k) => `${rep(8, (i) => r(-120 + i * 30, -30, 30, 28, ["#F15BB5", "#00F5D4", "#FFD93D", k][i % 4], 2, 'stroke-width="2" class="pl-twinkle"'))}`, 20, 1],
  hjertespejl: ["Hjertespejl", "væg", "#FF9AB5", 120, 120, (k) => `${p("M0 -10 C-60 -40 -60 -110 -20 -110 C-6 -110 0 -96 0 -90 C0 -96 6 -110 20 -110 C60 -110 60 -40 0 -10Z", k)}${p("M0 -24 C-44 -48 -44 -98 -16 -98 C-6 -98 0 -88 0 -84 C0 -88 6 -98 16 -98 C44 -98 44 -48 0 -24Z", "#E8F6FF", T3)}`, 20],
  yogamaatte: ["Yogamåtte", "leg", "#B9E4C9", 240, 40, (k) => `${r(-110, -24, 220, 18, k, 6)}${c(110, -20, 14, shade(k, 0.85))}`, 15, 1],
  stueplanter: ["Plantehylde", "mob", "#E8C39E", 180, 200, (k) => `${r(-80, -196, 160, 196, k, 6)}${rep(3, (i) => ln(`M-80 ${-130 + i * 64} H80`, "#C98B55", 6))}${rep(6, (i) => `${p(`M${-62 + (i % 3) * 50} ${-138 + Math.floor(i / 3) * 64} h28 l-4 -22 h-20z`, "#FF8A3C", T3)}${leaf(-48 + (i % 3) * 50, -160 + Math.floor(i / 3) * 64, -70, "#6BCB77", 0.5)}${leaf(-48 + (i % 3) * 50, -160 + Math.floor(i / 3) * 64, -120, "#3FA796", 0.5)}`)}`, 25],
  boblebad: ["Boblebad", "mob", "#9FD4FF", 280, 110, (k) => `${p("M-130 -70 H130 V-20 Q130 0 110 0 H-110 Q-130 0 -130 -20Z", "#FFFFFF")}${e(0, -70, 128, 14, k)}${rep(8, (i) => c(-100 + i * 28, -84 - (i % 3) * 10, 8 + (i % 2) * 4, "#FFFFFF", 'stroke-width="2"'))}`, 30],
  duftlys: ["Duftlys og sten", "lys", "#FFF3D6", 140, 80, (k) => L(`${gl(0, -50, 60, 30, "#FFE8A3")}${rep(3, (i) => `${r(-56 + i * 40, -50 + (i % 2) * 10, 28, 46 - (i % 2) * 10, k, 4)}${p(`M${-42 + i * 40} ${-52 + (i % 2) * 10} q-6 -10 0 -18 q6 8 0 18z`, "#FFB86B", 'stroke-width="2"')}`)}${e(-60, -8, 14, 8, "#9AA4BA")}${e(60, -8, 16, 9, "#CFD6E6")}`), 15],
  meditationspude: ["Meditationspude", "leg", "#9B5DE5", 120, 50, (k) => `${e(0, -22, 54, 20, k)}${e(0, -28, 40, 10, shade(k, 1.2), T3)}${c(0, -28, 6, "#FFD93D", 'stroke-width="2"')}`, 15],
});
CITY_PACKS.push(
  { id: "kaelebjorne", n: "Kælebjørnene", em: "🧸", lvl: 1, d: "Bjørnestol, skyseng, honninglampe, bamsereol og plaid med poter.", items: ["bjoernestol", "skyseng", "honninglampe", "bamsereol", "poteplaid"] },
  { id: "neonregnbue", n: "Neon-regnbue-lejligheden", em: "🌈", lvl: 2, d: "Neonsofa, regnbuereol, neonlampe, diskotæppe og hjertespejl.", items: ["neonsofa", "regnbuereol", "neonlampe", "diskogulv", "hjertespejl"] },
  { id: "ro", n: "Ro og pleje", em: "🧘", lvl: 2, d: "Yogamåtte, plantehylde, boblebad, duftlys og meditationspude.", items: ["yogamaatte", "stueplanter", "boblebad", "duftlys", "meditationspude"] },
);
Object.assign(CITY_EN, {
  "Bjørnestol": "Bear chair", Skyseng: "Cloud bed", Honninglampe: "Honey lamp", Bamsereol: "Teddy shelf", "Plaid med poter": "Paw blanket",
  Neonsofa: "Neon sofa", Regnbuereol: "Rainbow shelf", "Neon-regnbuelampe": "Neon rainbow lamp", "Diskotæppe": "Disco rug", Hjertespejl: "Heart mirror",
  "Yogamåtte": "Yoga mat", Plantehylde: "Plant shelf", Boblebad: "Bubble bath", "Duftlys og sten": "Candles and stones", Meditationspude: "Meditation cushion",
  "Kælebjørnene": "The cuddly bears", "Bjørnestol, skyseng, honninglampe, bamsereol og plaid med poter.": "Bear chair, cloud bed, honey lamp, teddy shelf and paw blanket.",
  "Neon-regnbue-lejligheden": "The neon rainbow apartment", "Neonsofa, regnbuereol, neonlampe, diskotæppe og hjertespejl.": "Neon sofa, rainbow shelf, neon lamp, disco rug and heart mirror.",
  "Ro og pleje": "Calm and care", "Yogamåtte, plantehylde, boblebad, duftlys og meditationspude.": "Yoga mat, plant shelf, bubble bath, candles and meditation cushion.",
});
