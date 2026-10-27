/* Hverdagsro – the everyday things of the home: kitchen, food, clothes, devices, the bathroom, books and toys,
   storage, the garden and little treasures. Free for everyone in the house (the home pack), so every room can be
   filled with real everyday life. Same shape as hv-playcat's THINGS: key: [name, category, colour, w, h, draw(c)]. */
import { OL, shade, DRAW } from "./hv-playcat.js";

const { r, c, e, p, ln, dot, gl, L, tx, star, heart, rep, leaf, T3 } = DRAW;

export const HOME_THINGS = {
  /* ---------------------------------------------------------------- the kitchen */
  gryde: ["Gryde", "pynt", "#E5484D", 110, 80, (k) => `${p("M-44 -54 H44 V-14 Q44 0 30 0 H-30 Q-44 0 -44 -14Z", k)}${e(0, -54, 44, 8, shade(k, 0.8))}${ln("M-44 -44 h-14 M44 -44 h14", OL, 6)}${c(0, -68, 7, OL)}`],
  stegepande: ["Stegepande", "pynt", "#3A3A55", 150, 40, (k) => `${e(-20, -18, 50, 14, k)}${e(-20, -20, 38, 9, shade(k, 1.4))}${e(-30, -22, 10, 6, "#FFD93D", T3)}${dot(-30, -22, 4, "#FF8A3C")}${ln("M30 -20 H72", "#C98B55", 9)}`],
  kaffemaskine: ["Kaffemaskine", "pynt", "#3A3A55", 80, 110, (k) => `${r(-34, -106, 68, 106, k, 8)}${r(-24, -60, 48, 40, "#BFE6FF", 4, T3)}${p("M-14 -34 H14 V-22 Q14 -16 8 -16 H-8 Q-14 -16 -14 -22Z", "#8B5A3C", T3)}${dot(18, -90, 5, "#6BCB77")}`],
  elkedel: ["Elkedel", "pynt", "#FFFFFF", 80, 90, (k) => `${p("M-30 0 L-24 -70 H24 L30 0Z", k)}${p("M24 -60 q22 4 14 40", "none", 'stroke-width="6"')}${ln("M-24 -62 l-16 -12", OL, 6)}${r(-10, -84, 20, 12, OL, 4)}`],
  broedrister: ["Brødrister", "pynt", "#CFD6E6", 90, 80, (k) => `${p("M-26 -66 h18 v-10 h-18z M8 -66 h18 v-10 h-18z", "#E9B65A", T3)}${r(-40, -68, 80, 68, k, 16)}${ln("M-26 -66 h18 M8 -66 h18", OL, 4)}${r(36, -40, 10, 8, OL, 2)}`],
  mikroovn: ["Mikroovn", "pynt", "#FFFFFF", 130, 80, (k) => `${r(-60, -76, 120, 76, k, 8)}${r(-50, -66, 76, 56, "#3A3A55", 4, T3)}${r(34, -64, 18, 30, "#E8EEF6", 3, T3)}${dot(43, -22, 5, OL)}`],
  skaerebraet: ["Skærebræt med grønt", "pynt", "#C98B55", 140, 50, (k) => `${r(-64, -20, 128, 20, k, 8)}${c(-30, -30, 14, "#FF6B6B", T3)}${e(10, -28, 20, 9, "#6BCB77", T3)}${p("M36 -24 l20 -14 l4 6 l-20 14z", "#FF8A3C", T3)}`],
  tallerkener: ["Tallerkenstak", "pynt", "#BFE6FF", 100, 60, (k) => `${rep(4, (i) => e(0, -10 - i * 10, 46, 9, i % 2 ? "#fff" : k, T3))}`],
  kopper: ["Kopper på række", "pynt", "#FF9AB5", 140, 50, (k) => `${rep(3, (i) => `${r(-60 + i * 44, -40, 32, 40, [k, "#FFD93D", "#B9E4C9"][i], 8, T3)}${p(`M${-28 + i * 44} -30 q10 0 8 12 q-2 8 -8 6`, "none", T3)}`)}`],
  frugtskaal: ["Frugtskål", "pynt", "#E8C39E", 120, 70, (k) => `${c(-24, -40, 16, "#FF6B6B", T3)}${c(6, -46, 16, "#6BCB77", T3)}${p("M20 -50 q30 -10 28 16 q-14 -6 -28 -16z", "#FFD93D", T3)}${p("M-50 -36 H50 Q46 0 0 0 Q-46 0 -50 -36Z", k)}`],
  broedkurv: ["Brødkurv", "pynt", "#C98B55", 110, 60, (k) => `${e(-16, -36, 30, 14, "#E9B65A", T3)}${e(18, -38, 26, 13, "#D99A4E", T3)}${p("M-48 -32 H48 L40 0 H-40Z", k)}${rep(3, (i) => ln(`M-44 ${-24 + i * 8} H44`, shade(k, 0.75), 3))}`],
  maelk: ["Mælk", "pynt", "#FFFFFF", 50, 100, (k) => `${p("M-20 0 V-70 L-10 -88 H10 L20 -70 V0Z", k)}${r(-20, -56, 40, 30, "#4D96FF", 0, T3)}${tx(0, -36, "MÆLK", 9, "#fff")}`],
  juice: ["Juice", "pynt", "#FF8A3C", 50, 100, (k) => `${p("M-18 0 V-60 Q-18 -76 -8 -80 V-94 H8 V-80 Q18 -76 18 -60 V0Z", k, 'fill-opacity=".85"')}${c(0, -36, 11, "#FFD93D", T3)}${r(-10, -102, 20, 10, "#6BCB77", 3, T3)}`],
  madpakke: ["Madpakke", "leg", "#6BCB77", 100, 60, (k) => `${r(-46, -52, 92, 52, k, 12)}${r(-46, -52, 92, 16, shade(k, 0.8), 8)}${r(-34, -30, 30, 18, "#E9B65A", 4, T3)}${c(18, -22, 9, "#FF6B6B", T3)}`],
  /* ---------------------------------------------------------------- food */
  pizza: ["Pizza", "pynt", "#E9B65A", 120, 40, (k) => `${e(0, -16, 56, 16, k)}${e(0, -18, 46, 11, "#E5484D", T3)}${rep(5, (i) => dot(-30 + i * 15, -18 + (i % 2) * 5, 5, i % 2 ? "#FFF3D6" : "#6BCB77"))}`],
  aeble: ["Æble", "pynt", "#E5484D", 60, 70, (k) => `${p("M0 -50 Q-30 -64 -28 -30 Q-26 0 0 -4 Q26 0 28 -30 Q30 -64 0 -50Z", k)}${ln("M0 -50 q2 -12 6 -16", "#8B5A3C", 4)}${leaf(4, -60, -30, "#6BCB77", 0.4)}`],
  banan: ["Bananer", "pynt", "#FFD93D", 90, 50, (k) => `${p("M-40 -30 Q0 10 40 -30 Q0 -6 -40 -30Z", k)}${p("M-36 -20 Q0 20 36 -20 Q0 2 -36 -20Z", shade(k, 0.92))}${ln("M40 -30 l6 -6", "#8B5A3C", 4)}`],
  ost: ["Ost", "pynt", "#FFD93D", 90, 60, (k) => `${p("M-40 0 V-36 L36 -56 V0Z", k)}${p("M-40 -36 L36 -56 L40 -50 L-36 -30Z", shade(k, 1.1))}${c(-14, -18, 6, shade(k, 0.8), T3)}${c(14, -26, 5, shade(k, 0.8), T3)}`],
  boller: ["Boller", "pynt", "#E9B65A", 110, 50, (k) => `${rep(3, (i) => `${e(-36 + i * 36, -18, 20, 16, k)}${rep(3, (j) => dot(-42 + i * 36 + j * 6, -26, 2, "#fff"))}`)}`],
  pandekager: ["Pandekager", "pynt", "#E9B65A", 100, 80, (k) => `${e(0, -6, 46, 8, "#fff")}${rep(4, (i) => e(0, -16 - i * 10, 38, 8, k, T3))}${p("M-20 -50 q20 -12 40 0 q-4 16 -20 12 q-16 4 -20 -12z", "#E5484D", T3)}`],
  vandmelon: ["Vandmelon", "pynt", "#6BCB77", 120, 60, (k) => `${p("M-54 -10 A54 54 0 0 1 54 -10Z", "#FF6B6B")}${p("M-54 -10 A54 54 0 0 1 54 -10", "none", `stroke="${k}" stroke-width="10"`)}${rep(5, (i) => e(-28 + i * 14, -28 + Math.abs(i - 2) * 4, 3, 5, OL, 'stroke-width="0"'))}`],
  cornflakes: ["Morgenmad", "pynt", "#FFD93D", 100, 110, (k) => `${r(-40, -106, 54, 106, k, 4)}${star(-13, -70, 12, "#FF6B6B")}${e(28, -18, 26, 10, "#fff")}${p("M2 -20 H54 Q50 0 28 0 Q6 0 2 -20Z", "#4D96FF")}`],
  /* ---------------------------------------------------------------- clothes */
  jakkeknage: ["Jakke på knage", "væg", "#4D96FF", 120, 140, (k) => `${ln("M-50 -128 H50", "#C98B55", 8)}${c(0, -126, 5, OL)}${p("M-22 -118 L-50 -100 L-58 -40 H-42 L-36 -80 V-8 H36 V-80 L42 -40 H58 L50 -100 L22 -118 Q0 -104 -22 -118Z", k)}${ln("M0 -110 V-8", OL, 3)}${rep(3, (i) => dot(-8, -90 + i * 24, 3, "#fff"))}${r(-30, -56, 18, 12, shade(k, 0.8), 3, T3)}`],
  gummistoevler: ["Gummistøvler", "leg", "#FFD93D", 100, 80, (k) => `${rep(2, (i) => p(`M${-38 + i * 40} -76 H${-14 + i * 40} V-16 H${2 + i * 40} V0 H${-38 + i * 40}Z`, k))}`],
  skoletaske: ["Skoletaske", "leg", "#9B5DE5", 90, 110, (k) => `${p("M-30 -90 q30 -24 60 0", "none", 'stroke-width="6"')}${r(-40, -92, 80, 92, k, 16)}${r(-30, -50, 60, 36, shade(k, 0.85), 10, T3)}${star(0, -70, 10, "#FFD93D")}`],
  kasket: ["Kasket", "pynt", "#E5484D", 90, 50, (k) => `${p("M-30 -16 Q-30 -50 4 -50 Q34 -50 34 -16Z", k)}${p("M24 -16 H60 Q58 -6 30 -6 H24Z", shade(k, 0.8))}${dot(2, -50, 5, "#fff")}`],
  halstoerklaede: ["Halstørklæde", "pynt", "#FF8A3C", 120, 60, (k) => `${p("M-56 -40 H56 V-24 H-56Z", k)}${p("M20 -24 V10 H40 V-24", k)}${rep(4, (i) => ln(`M${-44 + i * 24} -40 V-24`, "#fff", 4))}`],
  pyjamas: ["Pyjamas", "pynt", "#BFE6FF", 110, 60, (k) => `${r(-50, -56, 100, 26, k, 6)}${r(-46, -30, 92, 28, shade(k, 0.9), 6)}${rep(4, (i) => star(-34 + i * 22, -42, 5, "#fff", 'stroke-width="2"'))}`],
  sokker: ["Sokker", "pynt", "#F15BB5", 90, 70, (k) => `${rep(2, (i) => `${p(`M${-34 + i * 36} -64 H${-14 + i * 36} V-24 Q${-14 + i * 36} -8 ${-4 + i * 36} -8 L${-4 + i * 36} 0 H${-38 + i * 36} Q${-34 + i * 36} -16 ${-34 + i * 36} -24Z`, i ? "#FFD93D" : k)}${ln(`M${-34 + i * 36} -50 H${-14 + i * 36}`, "#fff", 4)}`)}`],
  skopar: ["Sko ved døren", "leg", "#3A3A55", 120, 40, (k) => `${rep(2, (i) => p(`M${-56 + i * 58} -4 V-26 Q${-56 + i * 58} -32 ${-48 + i * 58} -32 L${-30 + i * 58} -28 Q${-10 + i * 58} -20 ${-8 + i * 58} -4Z`, k))}${rep(2, (i) => r(-58 + i * 58, -6, 52, 6, "#fff", 2, T3))}`],
  /* ---------------------------------------------------------------- devices */
  tablet: ["Tablet", "leg", "#3A3A55", 100, 80, (k) => `${r(-46, -74, 92, 70, k, 10)}${r(-38, -66, 76, 54, "#4D96FF", 4, T3)}${c(-10, -42, 10, "#FFD93D", T3)}${p("M6 -50 l14 8 l-14 8z", "#fff", T3)}`],
  mobil: ["Mobiltelefon", "leg", "#2B2340", 50, 90, (k) => `${r(-20, -86, 40, 82, k, 8)}${r(-15, -78, 30, 60, "#9FD4FF", 3, T3)}${rep(4, (i) => r(-11 + (i % 2) * 12, -72 + Math.floor(i / 2) * 14, 9, 9, ["#FF6B6B", "#6BCB77", "#FFD93D", "#F15BB5"][i], 2, 'stroke-width="2"'))}`],
  fjernbetjening: ["Fjernbetjening", "leg", "#3A3A55", 40, 90, (k) => `${r(-14, -86, 28, 82, k, 10)}${dot(0, -72, 5, "#E5484D")}${rep(6, (i) => dot(-6 + (i % 2) * 12, -54 + Math.floor(i / 2) * 12, 3, "#fff"))}`],
  computer: ["Bærbar computer", "leg", "#CFD6E6", 130, 90, (k) => `${p("M-48 -84 H48 V-18 H-48Z", k)}${r(-40, -76, 80, 52, "#3A3A55", 3, T3)}${ln("M-30 -60 h40 M-30 -48 h24 M-30 -36 h32", "#6BCB77", 3)}${p("M-62 -18 H62 L54 0 H-54Z", shade(k, 0.9))}`],
  smarthoejttaler: ["Smart højttaler", "pynt", "#9AA4BA", 60, 90, (k) => `${r(-26, -86, 52, 86, k, 22)}${rep(4, (i) => ln(`M-14 ${-68 + i * 12} H14`, shade(k, 0.75), 3))}${e(0, -84, 18, 4, "#4D96FF", T3)}`],
  controller: ["Spillecontroller", "leg", "#FFFFFF", 100, 60, (k) => `${p("M-40 -40 Q-50 -40 -48 -20 Q-46 0 -30 -4 L-16 -16 H16 L30 -4 Q46 0 48 -20 Q50 -40 40 -40Z", k)}${ln("M-30 -28 h12 M-24 -34 v12", OL, 4)}${dot(24, -32, 4, "#E5484D")}${dot(32, -24, 4, "#4D96FF")}`],
  hovedtelefoner: ["Hovedtelefoner", "leg", "#F15BB5", 90, 80, (k) => `${p("M-34 -24 Q-34 -76 0 -76 Q34 -76 34 -24", "none", 'stroke-width="8"')}${r(-44, -36, 20, 34, k, 8)}${r(24, -36, 20, 34, k, 8)}`],
  vaekkeur: ["Vækkeur", "pynt", "#FF6B6B", 70, 80, (k) => `${c(-20, -64, 10, k)}${c(20, -64, 10, k)}${c(0, -36, 30, k)}${c(0, -36, 22, "#fff", T3)}${ln("M0 -36 V-50 M0 -36 h10", OL, 3)}${ln("M-18 -6 l-6 6 M18 -6 l6 6", OL, 4)}`],
  radio: ["Radio", "pynt", "#6BCB77", 110, 80, (k) => `${ln("M30 -60 L44 -90", OL, 3)}${r(-50, -62, 100, 62, k, 10)}${c(-22, -30, 18, "#3A3A55", T3)}${c(-22, -30, 8, "#9AA4BA", 'stroke-width="2"')}${r(8, -46, 30, 12, "#FFF3D6", 3, T3)}${dot(14, -20, 5, "#FFD93D")}${dot(30, -20, 5, "#FFD93D")}`],
  /* ---------------------------------------------------------------- the bathroom */
  tandkrus: ["Tandbørster i krus", "pynt", "#BFE6FF", 60, 90, (k) => `${ln("M-8 -40 L-16 -84 M8 -40 L14 -86 M0 -40 V-80", OL, 6)}${r(-20, -88, 8, 14, "#6BCB77", 2, 'stroke-width="2"')}${r(10, -92, 8, 14, "#FF9AB5", 2, 'stroke-width="2"')}${r(-4, -86, 8, 14, "#FFD93D", 2, 'stroke-width="2"')}${p("M-22 -44 H22 L18 0 H-18Z", k)}`],
  haandklaede: ["Håndklæde", "væg", "#6BCB77", 90, 120, (k) => `${c(0, -110, 6, OL)}${r(-34, -104, 68, 100, k, 6)}${rep(3, (i) => ln(`M-34 ${-30 + i * 8} H34`, "#fff", 3))}`],
  badeand: ["Badeand", "leg", "#FFD93D", 80, 70, (k) => `${p("M-34 -26 Q-36 0 0 0 Q34 0 34 -26 Q20 -20 6 -26Z", k)}${c(12, -44, 18, k)}${p("M28 -44 l14 4 l-14 6z", "#FF8A3C", T3)}${dot(16, -48, 3, OL)}`],
  shampoo: ["Shampoo og sæbe", "pynt", "#9B5DE5", 90, 90, (k) => `${r(-36, -76, 30, 76, k, 10)}${r(-28, -88, 14, 12, OL, 3)}${e(22, -14, 22, 14, "#FF9AB5")}${rep(3, (i) => c(10 + i * 12, -38 - i * 8, 5, "#E8F6FF", 'stroke-width="2"'))}`],
  toiletrulle: ["Toiletpapir", "pynt", "#FFFFFF", 60, 70, (k) => `${r(-26, -60, 52, 60, k, 10)}${e(0, -60, 26, 8, "#F2F2F2")}${e(0, -60, 9, 4, "#C98B55", 'stroke-width="2"')}`],
  bademaatte: ["Bademåtte", "leg", "#4D96FF", 170, 30, (k) => `${e(0, -12, 80, 14, k)}${e(0, -12, 64, 9, "none", 'stroke="#fff" stroke-width="3" stroke-dasharray="6 6"')}`, 0, 1],
  badekaabe: ["Badekåbe", "væg", "#FF9AB5", 100, 160, (k) => `${c(0, -150, 6, OL)}${p("M-24 -144 L-46 -10 H46 L24 -144 Q0 -150 -24 -144Z", k)}${p("M-24 -144 L0 -90 L24 -144", "none")}${ln("M-40 -70 H40", shade(k, 0.8), 6)}`],
  /* ---------------------------------------------------------------- books and toys */
  bogstabel: ["Bøger", "pynt", "#4D96FF", 110, 80, (k) => `${rep(4, (i) => r(-46 + (i % 2) * 6, -18 - i * 18, 86, 16, [k, "#FF6B6B", "#FFD93D", "#6BCB77"][i], 3, T3))}`],
  aabenbog: ["Åben bog", "pynt", "#FFF3D6", 120, 50, (k) => `${p("M0 -10 Q-30 -30 -56 -20 V-4 Q-30 -12 0 6 Q30 -12 56 -4 V-20 Q30 -30 0 -10Z", k)}${ln("M0 -10 V6", OL, 3)}${rep(3, (i) => ln(`M${-44} ${-16 + i * 5} q18 -6 34 2 M${10} ${-14 + i * 5} q18 -8 34 -2`, "#9AA4BA", 2))}`],
  puslespil: ["Puslespil", "leg", "#B9E4C9", 130, 40, (k) => `${r(-60, -24, 120, 20, k, 4)}${rep(4, (i) => r(-56 + i * 28, -22, 26, 16, ["#FF9AB5", "#BFE6FF", "#FFD93D", "#FFB86B"][i], 2, 'stroke-width="2"'))}`, 0, 1],
  braetspil: ["Brætspil", "leg", "#FFFFFF", 130, 40, (k) => `${r(-60, -24, 120, 20, k, 4)}${rep(6, (i) => r(-54 + i * 18, -20, 14, 12, i % 2 ? "#E5484D" : "#4D96FF", 2, 'stroke-width="2"'))}${p("M30 -24 l-6 -18 h12z", "#FFD93D", T3)}`, 0, 1],
  klodsborg: ["Klodsborg", "leg", "#E5484D", 120, 110, (k) => `${rep(3, (j) => rep(3 - j, (i) => r(-48 + i * 32 + j * 16, -30 - j * 30, 32, 30, [k, "#4D96FF", "#FFD93D", "#6BCB77"][(i + j) % 4], 3, T3)))}${rep(3, (i) => dot(-38 + i * 32, -34, 4, "rgba(0,0,0,.2)"))}`],
  tegneblok: ["Tegneblok og farver", "pynt", "#FFFFFF", 130, 40, (k) => `${r(-60, -30, 76, 26, k, 3)}${p("M-50 -18 q14 -10 26 0 q12 10 24 -2", "none", 'stroke="#F15BB5" stroke-width="3"')}${rep(4, (i) => p(`M${26 + i * 9} -4 V-34 l4 -6 l4 6 V-4Z`, ["#E5484D", "#4D96FF", "#FFD93D", "#6BCB77"][i], 'stroke-width="2"'))}`],
  legetog: ["Legetøjstog", "leg", "#E5484D", 160, 70, (k) => `${r(-70, -50, 50, 40, k, 6)}${r(-62, -66, 20, 16, OL, 4)}${r(-14, -40, 40, 30, "#4D96FF", 6)}${r(32, -40, 40, 30, "#FFD93D", 6)}${rep(6, (i) => c(-60 + i * 23, -6, 8, OL))}`],
  sjippetov: ["Sjippetov", "leg", "#F15BB5", 130, 40, (k) => `${p("M-50 -20 Q0 20 50 -20", "none", 'stroke-width="4"')}${r(-62, -34, 14, 26, k, 6)}${r(48, -34, 14, 26, k, 6)}`],
  /* ---------------------------------------------------------------- around the house */
  vasketoejskurv: ["Vasketøjskurv", "mob", "#E8C39E", 100, 90, (k) => `${p("M-28 -80 q8 -14 20 0 M10 -80 q8 -18 22 -2", "#4D96FF", T3)}${p("M-42 -76 H42 L36 0 H-36Z", k)}${rep(4, (i) => ln(`M-38 ${-60 + i * 14} H38`, shade(k, 0.75), 3))}`],
  doermaatte: ["Dørmåtte", "leg", "#8B5A3C", 160, 30, (k) => `${r(-76, -20, 152, 20, k, 4)}${tx(0, -5, "VELKOMMEN", 13, "#FFF3D6")}`, 0, 1],
  paraply: ["Paraplystativ", "mob", "#3A3A55", 70, 130, (k) => `${p("M-24 0 V-60 H24 V0Z", k)}${ln("M-8 -60 L-14 -120 M8 -60 L16 -118", OL, 5)}${p("M-14 -120 q-8 -10 -16 0", "none", 'stroke="#E5484D" stroke-width="5"')}${p("M16 -118 q8 -10 16 0", "none", 'stroke="#FFD93D" stroke-width="5"')}`],
  stoevsugerstav: ["Støvsuger", "leg", "#E5484D", 80, 160, (k) => `${ln("M0 -150 V-20", "#9AA4BA", 6)}${r(-8, -154, 16, 12, OL, 4)}${r(-16, -100, 32, 60, k, 12)}${r(-34, -20, 68, 18, OL, 8)}`],
  fejekost: ["Kost og fejebakke", "leg", "#FFD93D", 120, 170, (k) => `${ln("M-20 -160 V-40", "#C98B55", 6)}${p("M-40 -40 H0 L4 0 H-44Z", k)}${rep(4, (i) => ln(`M${-36 + i * 10} -36 V-4`, shade(k, 0.75), 2))}${p("M20 0 V-24 H60 L56 0Z", "#4D96FF")}${ln("M40 -24 V-40", OL, 5)}`],
  strygebraet: ["Strygebræt", "mob", "#BFE6FF", 200, 110, (k) => `${ln("M-50 0 L30 -80 M50 0 L-30 -80", "#9AA4BA", 5)}${p("M-90 -90 H70 Q96 -90 96 -84 Q96 -78 70 -78 H-90Z", k)}${p("M-40 -96 H10 L18 -86 H-48Z", "#3A3A55", T3)}`],
  papkasser: ["Papkasser", "mob", "#E8C39E", 140, 120, (k) => `${r(-60, -60, 70, 60, k, 2)}${r(-4, -56, 60, 56, shade(k, 0.92), 2)}${r(-40, -112, 64, 52, shade(k, 1.05), 2)}${ln("M-25 -60 V0 M26 -56 V0 M-8 -112 V-60", "#C98B55", 4)}`],
  /* ---------------------------------------------------------------- the garden and the garage */
  haveslange: ["Haveslange", "leg", "#6BCB77", 110, 70, (k) => `${c(0, -34, 30, "none", `stroke="${k}" stroke-width="10"`)}${c(0, -34, 18, "none", `stroke="${k}" stroke-width="10"`)}${ln("M30 -34 q20 0 30 20", k, 8)}${r(56, -18, 12, 14, "#FFD93D", 3, T3)}`],
  plaeneklipper: ["Plæneklipper", "leg", "#6BCB77", 150, 110, (k) => `${ln("M10 -40 L60 -100 H76", OL, 6)}${r(-60, -46, 90, 34, k, 10)}${c(-44, -10, 12, OL)}${c(16, -10, 12, OL)}${r(-30, -60, 30, 14, "#3A3A55", 4, T3)}`],
  haveredskab: ["Skovl og handsker", "leg", "#FF8A3C", 110, 120, (k) => `${ln("M-20 -110 V-40", "#C98B55", 6)}${p("M-34 -40 H-6 V-10 Q-20 4 -34 -10Z", "#9AA4BA")}${p("M10 -40 h20 v-14 l6 -6 l6 6 v14 h4 v30 h-36z", k)}`],
  loebehjul: ["Løbehjul", "leg", "#00BBF9", 140, 130, (k) => `${ln("M40 -10 L30 -120 M16 -120 H44", k, 8)}${ln("M40 -10 L30 -120", OL, 2)}${r(-50, -22, 90, 12, k, 5)}${c(-46, -8, 10, OL)}${c(40, -8, 10, OL)}`],
  cykelhjelm: ["Cykelhjelm", "pynt", "#F15BB5", 90, 60, (k) => `${p("M-40 -6 Q-40 -56 0 -56 Q40 -56 40 -6Z", k)}${rep(3, (i) => r(-20 + i * 14, -50, 8, 18, "#fff", 3, 'stroke-width="2"'))}${ln("M-30 -6 L-24 10 M30 -6 L24 10", OL, 3)}`],
  grill: ["Grill", "mob", "#3A3A55", 120, 130, (k) => L(`${gl(0, -100, 40, 20, "#FFB86B")}${ln("M-30 0 L-14 -60 M30 0 L14 -60", OL, 5)}${p("M-50 -80 H50 Q50 -40 0 -40 Q-50 -40 -50 -80Z", k)}${ln("M-44 -84 H44", "#9AA4BA", 4)}${e(-16, -92, 14, 6, "#C2502A", T3)}${e(16, -92, 14, 6, "#C2502A", T3)}`)],
  /* ---------------------------------------------------------------- little treasures */
  fotoalbum: ["Fotoalbum", "pynt", "#9B5DE5", 100, 40, (k) => `${r(-46, -30, 92, 26, k, 4)}${r(-38, -26, 34, 18, "#FFF3D6", 2, 'stroke-width="2"')}${heart(16, -18, 0.4, "#FF6B6B")}`],
  tulipaner: ["Tulipaner i vase", "pynt", "#FF6B6B", 80, 130, (k) => `${ln("M-10 -60 L-20 -110 M0 -60 V-120 M10 -60 L22 -106", "#6BCB77", 4)}${rep(3, (i) => p(`M${[-26, -6, 16][i]} ${[-110, -120, -106][i]} q6 -22 12 0 q-6 6 -12 0`, i === 1 ? "#FFD93D" : k, T3))}${p("M-20 0 Q-30 -40 -14 -60 H14 Q30 -40 20 0Z", "#BFE6FF", 'fill-opacity=".85"')}`],
  stearinlys: ["Stearinlys", "lys", "#FFFFFF", 70, 110, (k) => L(`${gl(0, -96, 30, 30, "#FFE8A3")}${r(-16, -76, 32, 70, k, 4)}${p("M0 -78 q-8 -14 0 -26 q8 12 0 26z", "#FFB86B", T3)}${e(0, -4, 30, 6, "#E9C46A")}`)],
  blyantskrus: ["Krus med blyanter", "pynt", "#4D96FF", 60, 100, (k) => `${rep(4, (i) => p(`M${-14 + i * 9} -46 V-86 l4 -8 l4 8 V-46Z`, ["#E5484D", "#FFD93D", "#6BCB77", "#F15BB5"][i], 'stroke-width="2"'))}${p("M-22 -50 H22 L18 0 H-18Z", k)}`],
  snekugle: ["Snekugle", "pynt", "#BFE6FF", 80, 90, (k) => `${r(-30, -20, 60, 20, "#C98B55", 4)}${c(0, -50, 32, k, 'fill-opacity=".75"')}${p("M-12 -30 L0 -56 L12 -30Z", "#6BCB77", T3)}${rep(6, (i) => dot(-18 + i * 7, -70 + (i % 3) * 10, 2.5, "#fff"))}`],
  vaegkalender: ["Vægkalender", "væg", "#FFFFFF", 110, 130, (k) => `${r(-46, -124, 92, 120, k, 4)}${r(-46, -124, 92, 26, "#E5484D", 4)}${rep(12, (i) => r(-38 + (i % 4) * 20, -90 + Math.floor(i / 4) * 24, 16, 18, i === 6 ? "#FFD93D" : "#F2F2F2", 2, 'stroke-width="1.5"'))}`],
  boernetegning: ["Børnetegning", "væg", "#FFFFFF", 110, 90, (k) => `${r(-48, -84, 96, 76, k, 2)}${c(28, -66, 10, "#FFD93D", 'stroke-width="2"')}${p("M-36 -20 L-20 -50 L-4 -20Z", "#E5484D", 'stroke-width="2"')}${r(-32, -20, 24, 0.1, OL, 0, 'stroke-width="2"')}${ln("M8 -20 V-44 M0 -36 h16 M8 -44 a6 6 0 1 1 0.1 0", OL, 2)}`],
  medaljeophaeng: ["Medaljer og diplom", "væg", "#E9C46A", 120, 110, (k) => `${r(-56, -104, 56, 70, "#FFF3D6", 3)}${star(-28, -76, 10, k)}${ln("M10 -100 L20 -60 M34 -100 L30 -56", "#4D96FF", 5)}${c(20, -52, 10, k, T3)}${c(30, -46, 10, "#CFD6E6", T3)}`],
};

/* What they do when tapped (hv-play's ACT): the kinds. */
export const HOME_ACT = {
  yum: ["pizza", "aeble", "banan", "ost", "boller", "pandekager", "vandmelon", "cornflakes", "maelk", "juice", "madpakke", "frugtskaal", "broedkurv", "gryde", "stegepande", "kaffemaskine", "elkedel", "broedrister", "skaerebraet", "grill"],
  screen: ["tablet", "mobil", "computer", "mikroovn", "fjernbetjening", "controller"],
  music: ["smarthoejttaler", "radio", "hovedtelefoner"],
  bounce: ["badeand", "gummistoevler", "legetog", "klodsborg", "sjippetov", "skoletaske"],
  drive: ["stoevsugerstav", "plaeneklipper", "loebehjul"],
  read: ["bogstabel", "aabenbog", "fotoalbum", "vaegkalender", "tegneblok"],
  spin: ["snekugle", "vaekkeur"],
};

/* The pack: free for everybody in the house. */
export const HOME_PACK = { id: "home", n: "Hjemmet", em: "🏡", lvl: 1, d: "Hverdagens ting: køkken, mad, tøj, apparater, bad, bøger og have.", items: Object.keys(HOME_THINGS) };

export const HOME_EN = {
  Gryde: "Pot", Stegepande: "Frying pan", Kaffemaskine: "Coffee machine", Elkedel: "Kettle", "Brødrister": "Toaster", Mikroovn: "Microwave", "Skærebræt med grønt": "Chopping board with veg",
  Tallerkenstak: "Pile of plates", "Kopper på række": "Row of cups", "Frugtskål": "Fruit bowl", "Brødkurv": "Bread basket", "Mælk": "Milk", Juice: "Juice", Madpakke: "Lunch box",
  Pizza: "Pizza", "Æble": "Apple", Bananer: "Bananas", Ost: "Cheese", Boller: "Buns", Pandekager: "Pancakes", Vandmelon: "Watermelon", Morgenmad: "Breakfast",
  "Jakke på knage": "Coat on a hook", "Gummistøvler": "Wellies", Skoletaske: "School bag", Kasket: "Cap", "Halstørklæde": "Scarf", Pyjamas: "Pyjamas", Sokker: "Socks", "Sko ved døren": "Shoes by the door",
  Tablet: "Tablet", Mobiltelefon: "Mobile phone", Fjernbetjening: "Remote control", "Bærbar computer": "Laptop", "Smart højttaler": "Smart speaker", Spillecontroller: "Game controller", Hovedtelefoner: "Headphones", "Vækkeur": "Alarm clock", Radio: "Radio",
  "Tandbørster i krus": "Toothbrushes in a mug", "Håndklæde": "Towel", Badeand: "Rubber duck", "Shampoo og sæbe": "Shampoo and soap", Toiletpapir: "Toilet paper", "Bademåtte": "Bath mat", "Badekåbe": "Bathrobe",
  "Bøger": "Books", "Åben bog": "Open book", Puslespil: "Jigsaw puzzle", "Brætspil": "Board game", Klodsborg: "Block castle", "Tegneblok og farver": "Sketchbook and crayons", "Legetøjstog": "Toy train", Sjippetov: "Skipping rope",
  "Vasketøjskurv": "Laundry basket", "Dørmåtte": "Doormat", Paraplystativ: "Umbrella stand", "Støvsuger": "Vacuum cleaner", "Kost og fejebakke": "Broom and dustpan", "Strygebræt": "Ironing board", Papkasser: "Cardboard boxes",
  Haveslange: "Garden hose", "Plæneklipper": "Lawn mower", "Skovl og handsker": "Spade and gloves", "Løbehjul": "Scooter", Cykelhjelm: "Bike helmet", Grill: "Barbecue",
  Fotoalbum: "Photo album", "Tulipaner i vase": "Tulips in a vase", Stearinlys: "Candle", "Krus med blyanter": "Mug of pencils", Snekugle: "Snow globe", "Vægkalender": "Wall calendar", "Børnetegning": "Child's drawing", "Medaljer og diplom": "Medals and diploma",
  Hjemmet: "The home", "Hverdagens ting: køkken, mad, tøj, apparater, bad, bøger og have.": "Everyday things: kitchen, food, clothes, devices, bathroom, books and garden.",
};
