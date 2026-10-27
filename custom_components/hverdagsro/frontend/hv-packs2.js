/* Hverdagsro – more theme packs for the play world (part 2): rescue and adventure, the children's universe with
   forest friends and the farm, and music, dance and fashion. All our own drawings; same shape as hv-playcat's
   THINGS: key: [name, category, colour, width, height, draw(c), price, flat]. */
import { OL, shade, DRAW } from "./hv-playcat.js";

const { r, c, e, p, ln, dot, gl, L, tx, star, heart, rep, leaf, T3 } = DRAW;

export const THINGS2 = {
  /* ---------------------------------------------------------------- Brandstationen */
  brandslange: ["Brandslange på hjul", "mob", "#E5484D", 120, 130, (k) => `${r(-10, -110, 20, 110, "#9AA4BA", 4)}${c(0, -70, 46, k)}${c(0, -70, 30, shade(k, 0.8))}${c(0, -70, 14, "#FFD93D")}${ln("M40 -50 q30 10 40 40", OL, 8)}${ln("M40 -50 q30 10 40 40", k, 4)}`, 25],
  brandstige: ["Brandstige", "mob", "#FFFFFF", 90, 300, (k) => `${ln("M-30 0 L-20 -290 M30 0 L20 -290", k, 9)}${ln("M-30 0 L-20 -290 M30 0 L20 -290", OL, 2)}${rep(9, (i) => ln(`M${-29 + i * 1.1} ${-24 - i * 30} H${29 - i * 1.1}`, k, 7))}`, 20],
  brandslukker: ["Brandslukker", "leg", "#E5484D", 60, 110, (k) => `${r(-20, -86, 40, 86, k, 14)}${r(-10, -100, 20, 16, OL, 4)}${ln("M8 -96 q24 -6 22 20", OL, 5)}${r(-14, -60, 28, 20, "#fff", 4, T3)}`, 15],
  sirenelampe: ["Sirenelampe", "lys", "#4D96FF", 70, 70, (k) => L(`${gl(0, -34, 50, 40, "#9FD4FF")}${r(-30, -16, 60, 16, "#3A3A55", 4)}${p("M-22 -16 Q-22 -60 0 -60 Q22 -60 22 -16Z", k)}${p("M-10 -40 q4 -8 10 -10", "none", 'stroke="#fff" stroke-width="5"')}`), 20],
  brandhjelmstativ: ["Hjelmstativ", "mob", "#C98B55", 130, 200, (k) => `${ln("M0 0 V-170 M-40 -150 H40", k, 8)}${ln("M-40 -150 V-120 M40 -150 V-120", k, 6)}${p("M-66 -96 Q-62 -136 -40 -136 Q-18 -136 -14 -96Z", "#E5484D")}${p("M14 -96 Q18 -136 40 -136 Q62 -136 66 -96Z", "#FFD93D")}${e(0, -2, 34, 8, k)}`, 20],
  /* ---------------------------------------------------------------- Luftredning */
  landingsplads: ["Helikopterplads", "mob", "#3A3A55", 300, 50, (k) => `${e(0, -20, 146, 26, k)}${e(0, -20, 110, 18, "none", 'stroke="#FFD93D" stroke-width="5"')}${tx(0, -10, "H", 26, "#fff")}`, 30, 1],
  vindpose: ["Vindpose", "pynt", "#FF8A3C", 140, 200, (k) => `${ln("M-50 0 V-190", "#9AA4BA", 6)}${p("M-50 -186 L50 -174 L50 -150 L-50 -150Z", k)}${p("M-24 -184 L-24 -150 M2 -180 L2 -152 M26 -178 L26 -152", "none", 'stroke="#fff" stroke-width="10"')}`, 15],
  propelfly: ["Propelfly", "leg", "#FFD93D", 180, 90, (k) => `${p("M-80 -40 Q-80 -60 -50 -60 H60 L84 -46 L60 -32 H-50 Q-80 -32 -80 -40Z", k)}${p("M-10 -60 L10 -86 H30 L20 -60Z M-10 -32 L10 -6 H30 L20 -32Z", shade(k, 0.85))}${p("M-74 -50 L-90 -72 H-80 L-60 -54Z", shade(k, 0.85))}${r(30, -56, 18, 12, "#BFE6FF", 3, T3)}${ln("M86 -66 V-26", OL, 5)}`, 30],
  radar: ["Radar", "pynt", "#CFD6E6", 120, 170, (k) => `${r(-30, -50, 60, 50, "#7A849E", 6)}${ln("M0 -50 V-90", OL, 6)}${p("M-50 -150 Q0 -60 50 -150 Q0 -130 -50 -150Z", k)}${ln("M0 -110 L18 -140", OL, 3)}${c(18, -142, 5, "#FF6B6B", T3)}`, 25],
  faldskaerm: ["Faldskærm", "væg", "#F15BB5", 180, 200, (k) => `${p("M-86 -120 Q0 -220 86 -120Z", k)}${rep(4, (i) => p(`M${-86 + i * 43} -120 q21.5 16 43 0`, i % 2 ? "#fff" : k, T3))}${ln("M-86 -120 L-6 -30 M86 -120 L6 -30 M0 -120 V-30", OL, 2)}${r(-10, -36, 20, 24, "#4D96FF", 6)}`, 20],
  /* ---------------------------------------------------------------- Byggehelte */
  gravko: ["Gravko", "leg", "#FFD93D", 220, 140, (k) => `${r(-100, -36, 120, 22, OL, 10)}${rep(4, (i) => c(-84 + i * 30, -25, 8, "#7A849E", 'stroke-width="2"'))}${r(-90, -90, 90, 56, k, 8)}${r(-80, -124, 50, 36, k, 6)}${r(-74, -118, 36, 24, "#BFE6FF", 3, T3)}${ln("M0 -80 L50 -120 L90 -70", k, 14)}${ln("M0 -80 L50 -120 L90 -70", OL, 2)}${p("M80 -76 L110 -56 L84 -40 Z", "#7A849E")}`, 35],
  kegle: ["Trafikkegle", "leg", "#FF8A3C", 60, 80, (k) => `${p("M-14 -74 L14 -74 L26 -10 H-26Z", k)}${p("M-18 -50 H18 L22 -34 H-22Z", "#fff", 'stroke-width="2"')}${r(-30, -12, 60, 12, k, 3)}`, 10],
  betonblander: ["Betonblander", "mob", "#FF6B6B", 160, 150, (k) => `${ln("M-40 0 L-20 -60 M40 0 L20 -60", OL, 6)}${c(-50, -6, 10, OL)}${p("M-60 -60 L40 -120 L60 -80 L-40 -30Z", k)}${p("M-40 -100 L40 -90", "none", 'stroke="#fff" stroke-width="6"')}${e(52, -104, 14, 22, "#7A849E", 'transform="rotate(-30 52 -104)"')}`, 30],
  stillads: ["Stillads", "mob", "#9AA4BA", 220, 300, (k) => `${ln("M-100 0 V-290 M0 0 V-290 M100 0 V-290", k, 8)}${rep(3, (i) => `${r(-104, -100 - i * 90, 208, 14, "#C98B55", 3)}${ln(`M-100 ${-10 - i * 90} L0 ${-90 - i * 90} L100 ${-10 - i * 90}`, k, 4)}`)}`, 30],
  vaerktoejskasse: ["Værktøjskasse", "leg", "#E5484D", 120, 80, (k) => `${r(-56, -56, 112, 56, k, 8)}${p("M-20 -56 v-14 h40 v14", "none", 'stroke-width="6"')}${ln("M-56 -36 H56", OL, 3)}${r(-8, -42, 16, 10, "#FFD93D", 2, 'stroke-width="2"')}`, 15],
  murstensstak: ["Murstensstak", "leg", "#C2502A", 130, 90, (k) => `${rep(3, (j) => rep(3 - (j % 2), (i) => r(-60 + i * 40 + (j % 2) * 20, -28 - j * 28, 40, 28, k, 2, T3)))}`, 10],
  trillebor: ["Trillebør", "leg", "#4D96FF", 160, 90, (k) => `${c(-50, -20, 18, OL)}${c(-50, -20, 7, "#CFD6E6")}${p("M-70 -70 H40 L20 -30 H-60Z", k)}${ln("M40 -60 L80 -40 M20 -34 L70 -10", OL, 6)}${ln("M-20 -30 V0 M10 -30 V0", OL, 5)}`, 15],
  /* ---------------------------------------------------------------- Bjergredning */
  ski: ["Ski og stave", "væg", "#FF6B6B", 120, 200, (k) => `${p("M-40 -10 L-30 -190 Q-24 -200 -20 -186 L-26 -10Z", k)}${p("M-10 -10 L0 -190 Q6 -200 10 -186 L4 -10Z", k)}${ln("M30 -10 L46 -180 M54 -10 L66 -180", OL, 4)}${c(46, -184, 6, "#FFD93D", 'stroke-width="2"')}${c(66, -184, 6, "#FFD93D", 'stroke-width="2"')}`, 20],
  kaelk: ["Kælk", "leg", "#E5484D", 170, 70, (k) => `${p("M-80 -10 H70 Q90 -10 84 -30", "none", 'stroke-width="6"')}${ln("M-60 -10 V-34 M40 -10 V-34", OL, 5)}${r(-74, -50, 140, 18, k, 6)}${ln("M70 -40 q20 -10 20 -30", OL, 3)}`, 15],
  termokande: ["Varm kakao", "pynt", "#9B5DE5", 80, 110, (k) => `${r(-26, -96, 52, 92, k, 12)}${r(-20, -106, 40, 14, "#3A3A55", 6)}${p("M-10 -110 q-4 -14 4 -24 M8 -110 q-4 -14 4 -24", "none", 'stroke="#CFD6E6" stroke-width="4"')}${star(0, -56, 12, "#fff")}`, 10],
  slaede: ["Hundeslæde", "mob", "#C98B55", 230, 120, (k) => `${p("M-100 -10 H90 Q114 -10 106 -36", "none", 'stroke-width="7"')}${r(-90, -60, 160, 30, k, 6)}${ln("M-90 -60 V-110 L-60 -110", k, 8)}${ln("M-70 -30 V-10 M40 -30 V-10", OL, 5)}${r(-60, -84, 70, 24, "#FF6B6B", 8, T3)}`, 30],
  isbjerg: ["Isbjerg", "pynt", "#C7E6FF", 180, 150, (k) => `${p("M-86 0 L-40 -110 L-10 -80 L30 -146 L86 0Z", k)}${p("M30 -146 L44 -90 L20 -60 L-10 -80Z", "#FFFFFF", T3)}`, 20],
  pingvin: ["Pingvin-bamse", "leg", "#3A3A55", 80, 120, (k) => `${e(0, -54, 34, 52, k)}${e(0, -46, 22, 40, "#FFFFFF", 'stroke-width="0"')}${dot(-9, -84, 4, OL)}${dot(9, -84, 4, OL)}${p("M-6 -74 h12 l-6 8z", "#FFB347", T3)}${e(-14, -2, 12, 5, "#FFB347", T3)}${e(14, -2, 12, 5, "#FFB347", T3)}${r(-20, -110, 40, 12, "#E5484D", 6, T3)}`, 15],
  /* ---------------------------------------------------------------- Robotredning */
  ladestation: ["Ladestation", "lys", "#6BCB77", 80, 160, (k) => L(`${gl(0, -110, 40, 40, "#C7FFD8")}${r(-30, -150, 60, 150, "#3A4466", 10)}${r(-20, -136, 40, 50, "#1B1530", 6, T3)}${p("M4 -132 L-8 -112 H2 L-4 -92 L10 -116 H0Z", k, 'stroke-width="2"')}${ln("M0 -40 q30 10 30 40", OL, 5)}`), 25],
  drone: ["Drone", "leg", "#FFFFFF", 160, 70, (k) => `${ln("M-60 -40 H60", OL, 6)}${e(-60, -46, 26, 5, "#CFD6E6", 'stroke-width="2"')}${e(60, -46, 26, 5, "#CFD6E6", 'stroke-width="2"')}${r(-30, -40, 60, 26, k, 10)}${c(0, -16, 8, "#1B1530", T3)}${dot(-16, -30, 3, "#FF6B6B")}`, 25],
  robothund: ["Robothund", "leg", "#CFD6E6", 140, 110, (k) => `${r(-50, -70, 80, 40, k, 14)}${ln("M-40 -30 V0 M-10 -30 V0 M10 -30 V0 M20 -30 V0", OL, 6)}${r(20, -100, 46, 40, k, 12)}${r(30, -90, 26, 14, "#1B1530", 4, 'stroke-width="2"')}${dot(36, -83, 3, "#00BBF9")}${dot(48, -83, 3, "#00BBF9")}${ln("M-50 -60 l-20 -20", OL, 4)}${c(-70, -80, 5, "#FF6B6B", 'stroke-width="2"')}`, 30],
  /* ---------------------------------------------------------------- Den hyggelige bjørn */
  honningkrukke: ["Honningkrukke", "pynt", "#FFB347", 80, 90, (k) => `${p("M-30 -70 Q-38 -30 -30 -6 H30 Q38 -30 30 -70Z", k)}${r(-32, -84, 64, 16, "#C98B55", 6)}${p("M-30 -70 q10 14 20 0 q10 14 20 0 q10 14 20 0", k, T3)}${tx(0, -26, "HONNING", 10, OL)}`, 10],
  laenestol: ["Lænestol", "mob", "#E3A87C", 160, 150, (k) => `${r(-60, -146, 120, 90, k, 30)}${r(-80, -90, 40, 60, shade(k, 0.9), 16)}${r(40, -90, 40, 60, shade(k, 0.9), 16)}${r(-50, -70, 100, 34, shade(k, 1.08), 12)}${ln("M-64 -30 V0 M64 -30 V0", OL, 6)}`, 30],
  gyngestol: ["Gyngestol", "mob", "#C98B55", 160, 170, (k) => `${p("M-70 -10 Q0 16 70 -10", "none", 'stroke-width="7"')}${ln("M-40 -4 L-34 -70 M40 -4 L34 -70", OL, 6)}${r(-40, -80, 80, 14, k, 6)}${ln("M-34 -80 L-40 -160 M34 -80 L40 -160", k, 9)}${rep(4, (i) => ln(`M-32 ${-100 - i * 18} H32`, k, 5))}${r(-34, -104, 68, 30, "#F7B5CF", 10, T3)}`, 30],
  hyggepude: ["Stor hyggepude", "mob", "#9BD7A0", 160, 70, (k) => `${p("M-74 -10 Q-80 -66 -40 -64 Q0 -70 40 -64 Q80 -66 74 -10 Q0 4 -74 -10Z", k)}${ln("M-40 -36 h80", shade(k, 0.8), 5)}${heart(0, -40, 0.7, "#FF6B6B")}`, 15],
  bjoernebog: ["Bog om bjørne", "pynt", "#4D96FF", 100, 60, (k) => `${p("M-46 -10 L-46 -50 Q-20 -60 0 -46 Q20 -60 46 -50 L46 -10 Q20 -20 0 -6 Q-20 -20 -46 -10Z", "#fff")}${p("M0 -46 V-6", "none", T3)}${c(-22, -32, 8, "#C98B55", 'stroke-width="2"')}${ln("M10 -40 h24 M10 -30 h20", "#9AA4BA", 3)}`, 10],
  /* ---------------------------------------------------------------- Den lille elefant */
  elefantbamse: ["Elefantbamse", "leg", "#C7B8FF", 120, 110, (k) => `${e(0, -40, 40, 34, k)}${e(-40, -76, 22, 26, shade(k, 0.9))}${e(40, -76, 22, 26, shade(k, 0.9))}${c(0, -76, 30, k)}${ln("M0 -64 Q-4 -30 14 -24", OL, 14)}${ln("M0 -64 Q-4 -30 14 -24", k, 8)}${dot(-10, -84, 4, OL)}${dot(10, -84, 4, OL)}`, 20],
  vandkande: ["Vandkande", "pynt", "#4D96FF", 120, 90, (k) => `${p("M-40 -70 H30 L36 -6 H-46Z", k)}${ln("M30 -50 L66 -80", OL, 10)}${ln("M30 -50 L66 -80", k, 5)}${e(70, -84, 8, 5, k, T3)}${p("M-40 -60 q-30 4 -24 30", "none", 'stroke-width="6"')}`, 10],
  tromme: ["Tromme", "leg", "#FF6B6B", 110, 90, (k) => `${e(0, -76, 46, 12, "#FFF6EE")}${p("M-46 -76 V-14 Q0 0 46 -14 V-76", k)}${rep(5, (i) => ln(`M${-40 + i * 20} -70 l10 50`, "#FFD93D", 3))}${ln("M30 -96 L60 -120 M10 -100 L30 -128", "#C98B55", 5)}`, 15],
  badebalje: ["Badebalje", "mob", "#9AA4BA", 170, 80, (k) => `${p("M-80 -60 H80 L66 -6 H-66Z", k)}${e(0, -60, 80, 12, "#BFE6FF")}${c(-30, -66, 10, "#fff", 'stroke-width="2"')}${c(-14, -72, 6, "#fff", 'stroke-width="2"')}${e(30, -68, 14, 8, "#FFD93D", T3)}`, 20],
  /* ---------------------------------------------------------------- Ormehaven */
  jordbunke: ["Jordbunke", "pynt", "#8B5A2B", 160, 70, (k) => `${p("M-76 0 Q-60 -60 0 -64 Q60 -60 76 0Z", k)}${dot(-30, -30, 4, shade(k, 0.7))}${dot(20, -40, 3, shade(k, 0.7))}${p("M-10 -60 q4 -20 10 -24 q6 4 4 24", "#6BCB77", T3)}`, 10],
  plantekasse: ["Plantekasse", "mob", "#C98B55", 200, 120, (k) => `${r(-96, -50, 192, 50, k, 6)}${rep(5, (i) => `${ln(`M${-70 + i * 35} -50 V-90`, "#5A9E5F", 4)}${leaf(-70 + i * 35, -86, -60, "#6BCB77", 0.5)}${leaf(-70 + i * 35, -86, -120, "#6BCB77", 0.5)}`)}${p("M-40 -50 l6 -16 6 16z", "#FF8A3C", T3)}`, 20],
  tunnelroer: ["Krybetunnel", "leg", "#6BCB77", 220, 90, (k) => `${p("M-100 -80 Q0 -96 100 -80 V-6 Q0 -22 -100 -6Z", k)}${e(-100, -43, 18, 38, shade(k, 0.7))}${e(100, -43, 18, 38, "#2B3A2E")}${rep(4, (i) => ln(`M${-60 + i * 40} -86 V-12`, shade(k, 0.8), 4))}`, 20],
  regnorm: ["Regnorm-bamse", "leg", "#FF8FA3", 130, 70, (k) => `${rep(5, (i) => c(-48 + i * 22, -24 - Math.sin(i) * 8, 16, i === 4 ? k : shade(k, 0.95)))}${dot(42, -36, 3, OL)}${dot(52, -36, 3, OL)}${p("M40 -22 q6 6 12 0", "none", 'stroke-width="2"')}`, 10],
  gulerod: ["Kæmpegulerod", "pynt", "#FF8A3C", 60, 160, (k) => `${p("M-20 -110 Q0 -100 20 -110 L0 0Z", k)}${ln("M-12 -80 h10 M-6 -50 h10 M-4 -30 h6", shade(k, 0.8), 3)}${leaf(0, -110, -70, "#6BCB77", 0.8)}${leaf(0, -110, -110, "#5A9E5F", 0.8)}`, 10],
  /* ---------------------------------------------------------------- Skovens venner */
  svampe: ["Svampe", "pynt", "#FF6B6B", 120, 90, (k) => `${r(-38, -40, 16, 40, "#FFF6E6", 6)}${p("M-60 -40 Q-60 -80 -30 -80 Q0 -80 0 -40Z", k)}${dot(-40, -60, 5, "#fff")}${dot(-20, -66, 4, "#fff")}${r(24, -30, 12, 30, "#FFF6E6", 5)}${p("M10 -30 Q10 -60 30 -60 Q50 -60 50 -30Z", "#C98B55")}`, 10],
  bladbunke: ["Bladbunke", "pynt", "#FFB347", 150, 60, (k) => `${[[-50, -10, 0, k], [-10, -20, 40, "#E5484D"], [30, -12, -30, "#FFD93D"], [0, -6, 80, "#C98B55"], [50, -14, 120, k]].map(([x, y, a, f]) => leaf(x, y, a, f, 0.9)).join("")}`, 5, 1],
  musehus: ["Musehus i en stub", "mob", "#A9764C", 160, 160, (k) => `${p("M-70 0 V-120 Q-70 -140 -50 -140 H50 Q70 -140 70 -120 V0Z", k)}${e(0, -140, 70, 16, "#E8C69A")}${p("M-50 -140 m20 0 a30 10 0 1 0 60 0", "none", 'stroke="#C98B55" stroke-width="3"')}${p("M-20 0 V-40 a20 20 0 0 1 40 0 V0Z", "#3A2A20")}${c(36, -80, 12, "#FFE066", T3)}${r(-60, -60, 26, 20, "#BFE6FF", 4, T3)}`, 30],
  egern: ["Egern med nød", "leg", "#C9772E", 100, 110, (k) => `${e(32, -60, 22, 46, k, 'transform="rotate(20 32 -60)"')}${e(-6, -36, 26, 32, k)}${c(-6, -82, 22, k)}${p("M-20 -98 L-24 -114 L-10 -102Z M8 -98 L12 -114 L-2 -102Z", k, T3)}${dot(-14, -86, 3, OL)}${dot(2, -86, 3, OL)}${e(-10, -48, 10, 12, "#8B5A2B", T3)}`, 15],
  /* ---------------------------------------------------------------- Bondegården */
  ko: ["Ko", "leg", "#FFFFFF", 200, 140, (k) => `${ln("M-60 -40 V0 M-30 -40 V0 M40 -40 V0 M70 -40 V0", OL, 9)}${e(0, -66, 86, 40, k)}${[[-30, -80, 18], [30, -56, 14], [50, -86, 10]].map(([x, y, rr]) => e(x, y, rr, rr * 0.8, "#3A3A55", 'stroke-width="0"')).join("")}${e(84, -96, 30, 26, k)}${e(96, -84, 18, 12, "#FFB4C2", T3)}${dot(76, -104, 3, OL)}${p("M70 -120 l-8 -12 M98 -120 l8 -12", "none", 'stroke-width="5"')}${e(-30, -24, 14, 8, "#FFB4C2", T3)}`, 30],
  gris: ["Gris", "leg", "#FFB4C2", 150, 100, (k) => `${ln("M-40 -30 V0 M-14 -30 V0 M20 -30 V0 M44 -30 V0", OL, 8)}${e(0, -54, 64, 34, k)}${c(60, -66, 24, k)}${e(78, -62, 12, 9, shade(k, 0.9), T3)}${dot(74, -63, 2, OL)}${dot(82, -63, 2, OL)}${dot(58, -76, 3, OL)}${p("M48 -86 l-6 -14 14 6z", k, T3)}${p("M-64 -60 c-12 -6 -12 -20 0 -16", "none", T3)}`, 25],
  faar: ["Får", "leg", "#FFFFFF", 150, 110, (k) => `${ln("M-36 -30 V0 M-10 -30 V0 M16 -30 V0 M40 -30 V0", OL, 7)}${rep(9, (i) => c(-46 + (i % 5) * 22, -58 - Math.floor(i / 5) * 22, 18, k))}${e(64, -64, 20, 24, "#3A3A55")}${dot(58, -70, 3, "#fff")}${dot(70, -70, 3, "#fff")}`, 20],
  hoensehus: ["Hønsehus", "mob", "#E5484D", 160, 170, (k) => `${ln("M-50 0 V-60 M50 0 V-60", OL, 6)}${r(-60, -120, 120, 64, k, 4)}${p("M-70 -116 L0 -164 L70 -116Z", "#8B3A1F")}${p("M-14 -56 V-90 a14 14 0 0 1 28 0 V-56Z", "#3A2A20")}${ln("M-30 0 L0 -56", "#C98B55", 6)}`, 30],
  maelkejunge: ["Mælkejunge", "pynt", "#CFD6E6", 70, 120, (k) => `${p("M-24 -84 Q-30 -40 -26 -4 H26 Q30 -40 24 -84Z", k)}${r(-16, -110, 32, 26, k, 6)}${r(-20, -116, 40, 10, "#9AA4BA", 4)}${ln("M-26 -60 H26", "#9AA4BA", 4)}`, 10],
  /* ---------------------------------------------------------------- Dukkehus og legetøj */
  dukkevogn: ["Dukkevogn", "leg", "#F7B5CF", 150, 130, (k) => `${c(-40, -16, 16, OL)}${c(40, -16, 16, OL)}${c(-40, -16, 6, "#CFD6E6")}${c(40, -16, 6, "#CFD6E6")}${p("M-60 -40 H60 Q60 -90 0 -90 H-60Z", k)}${p("M-60 -90 Q-60 -130 -10 -128 L0 -90Z", shade(k, 0.85))}${ln("M60 -60 L80 -110 h14", OL, 5)}`, 25],
  kludedukke: ["Kludedukke", "leg", "#FFB347", 70, 120, (k) => `${p("M-24 -70 L24 -70 L34 -4 H-34Z", "#4D96FF")}${c(0, -88, 22, "#F6C9A3")}${p("M-22 -96 Q0 -124 22 -96", k, 'stroke-width="3"')}${ln("M-22 -94 q-6 20 -2 40 M22 -94 q6 20 2 40", k, 7)}${dot(-7, -90, 3, OL)}${dot(7, -90, 3, OL)}${p("M-5 -80 q5 4 10 0", "none", 'stroke-width="2"')}`, 15],
  tesaet: ["Tesæt", "pynt", "#F7B5CF", 160, 80, (k) => `${p("M-50 -50 Q-56 -10 -30 -6 Q-4 -10 -10 -50Z", k)}${p("M-10 -40 q16 0 14 16", "none", 'stroke-width="5"')}${p("M-56 -40 q-14 -10 -16 -26", "none", 'stroke-width="5"')}${r(-36, -58, 12, 8, k, 3, 'stroke-width="2"')}${[20, 56].map((x) => `${p(`M${x - 14} -30 h28 q0 20 -14 22 q-14 -2 -14 -22z`, "#fff", T3)}${e(x, -6, 20, 4, "#fff", 'stroke-width="2"')}`).join("")}`, 15],
  dukkeseng: ["Dukkeseng", "mob", "#9B5DE5", 140, 80, (k) => `${r(-66, -70, 14, 70, "#C98B55", 4)}${r(52, -50, 14, 50, "#C98B55", 4)}${r(-60, -40, 120, 20, "#C98B55", 4)}${r(-52, -56, 30, 18, "#fff", 8, T3)}${r(-24, -52, 76, 16, k, 6, T3)}`, 15],
  /* ---------------------------------------------------------------- Fantasiskoven */
  troldedoer: ["Troldedør", "væg", "#8B5A2B", 100, 150, (k) => `${p("M-44 -6 V-90 Q-44 -146 0 -146 Q44 -146 44 -90 V-6Z", k)}${rep(3, (i) => ln(`M${-24 + i * 24} -136 V-10`, shade(k, 0.7), 4))}${c(26, -70, 6, "#FFD93D", T3)}${p("M-60 -6 H60", "none", 'stroke="#5A9E5F" stroke-width="10"')}`, 20],
  oenskebroend: ["Ønskebrønd", "mob", "#9AA4BA", 170, 210, (k) => `${p("M-70 -20 V-90 H70 V-20 Q0 0 -70 -20Z", k)}${rep(3, (i) => ln(`M-70 ${-40 - i * 20} H70`, shade(k, 0.8), 3))}${e(0, -90, 70, 14, "#4D96FF")}${ln("M-56 -90 V-180 M56 -90 V-180", "#C98B55", 8)}${p("M-80 -170 L0 -210 L80 -170Z", "#E5484D")}${ln("M0 -176 V-120", OL, 2)}${r(-10, -120, 20, 16, "#C98B55", 3, T3)}`, 35],
  lysblomst: ["Lysende blomst", "lys", "#C7B8FF", 90, 170, (k) => L(`${gl(0, -130, 50, 46, k)}${ln("M0 0 V-110", "#5A9E5F", 6)}${leaf(0, -40, -40, "#6BCB77", 0.7)}${rep(6, (i) => e(Math.cos((i * Math.PI) / 3) * 22, -130 + Math.sin((i * Math.PI) / 3) * 22, 16, 10, k, `transform="rotate(${i * 60} ${Math.cos((i * Math.PI) / 3) * 22} ${-130 + Math.sin((i * Math.PI) / 3) * 22})"`))}${c(0, -130, 12, "#FFF6C9")}`), 20],
  feeloekke: ["Feeløkke", "pynt", "#FF6B6B", 200, 60, (k) => `${rep(8, (i) => {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * 80, y = -26 + Math.sin(a) * 18;
    return `${r(x - 4, y - 8, 8, 16, "#FFF6E6", 3, 'stroke-width="2"')}${p(`M${x - 14} ${y - 6} Q${x} ${y - 26} ${x + 14} ${y - 6}Z`, i % 2 ? k : "#F15BB5", 'stroke-width="2"')}`;
  })}${rep(5, (i) => dot(-40 + i * 20, -60 - (i % 2) * 10, 3, "#FFE066"))}`, 20, 1],
  /* ---------------------------------------------------------------- Danseakademiet */
  balletstang: ["Balletstang", "mob", "#C98B55", 300, 130, (k) => `${ln("M-140 -100 H140", k, 10)}${ln("M-140 -100 H140", OL, 2)}${ln("M-130 0 V-104 M130 0 V-104", "#9AA4BA", 7)}`, 20],
  spejlvaeg: ["Spejlvæg", "væg", "#E8F6FF", 300, 200, (k) => `${r(-146, -196, 292, 192, "#fff", 6)}${rep(3, (i) => r(-136 + i * 92, -186, 88, 172, k, 2, 'stroke-width="2"'))}${ln("M-110 -170 l30 -10 M-20 -160 l40 -14 M74 -150 l24 -8", "#fff", 6)}`, 30],
  dansegulv: ["Lysende dansegulv", "mob", "#9B5DE5", 300, 60, (k) => `${p("M-140 -10 L-100 -50 H100 L140 -10Z", "#1B1530")}${rep(6, (i) => rep(2, (j) => p(`M${-130 + i * 44 + j * 20} ${-12 - j * 18} l20 -18 h40 l-20 18z`, ["#F15BB5", "#00BBF9", "#FFD93D", "#6BCB77", k][(i + j) % 5], 'stroke-width="2" class="pl-blink"')))}`, 40, 1],
  balletsko: ["Balletsko", "pynt", "#F7B5CF", 100, 60, (k) => `${p("M-44 -10 Q-46 -30 -26 -30 H-6 Q4 -30 4 -14 Q4 -6 -10 -6 H-36Z", k)}${p("M4 -14 Q2 -34 22 -34 H40 Q50 -34 50 -18 Q50 -8 36 -8 H12Z", k)}${ln("M-20 -30 q-10 -24 10 -40 M30 -34 q10 -20 -6 -40", k, 3)}`, 10],
  tutustativ: ["Tutu på stativ", "mob", "#F15BB5", 120, 220, (k) => `${ln("M0 0 V-200", "#9AA4BA", 6)}${e(0, -2, 30, 6, "#9AA4BA")}${p("M-20 -200 Q0 -216 20 -200 L16 -140 H-16Z", "#fff")}${p("M-60 -130 Q-40 -150 -20 -136 Q0 -150 20 -136 Q40 -150 60 -130 Q30 -110 0 -116 Q-30 -110 -60 -130Z", k)}`, 25],
  /* ---------------------------------------------------------------- Backstage */
  sminkebord: ["Sminkebord med lys", "mob", "#FFFFFF", 220, 260, (k) => L(`${r(-90, -256, 180, 140, k, 10)}${r(-74, -240, 148, 108, "#E8F6FF", 4, T3)}${rep(6, (i) => `${gl(-90 + i * 36, -256, 14, 14)}${c(-90 + i * 36, -256, 7, "#FFE066", 'stroke-width="2"')}`)}${r(-100, -110, 200, 18, "#F7B5CF", 4)}${ln("M-90 -92 V0 M90 -92 V0", OL, 7)}${r(-60, -130, 20, 20, "#FF6B6B", 4, 'stroke-width="2"')}${r(20, -126, 30, 16, "#9B5DE5", 4, 'stroke-width="2"')}`), 40],
  toejstativ: ["Tøjstativ", "mob", "#9AA4BA", 240, 230, (k) => `${ln("M-110 0 V-210 H110 V0", k, 7)}${[["#FF6B6B", -80], ["#FFD93D", -40], ["#4D96FF", 0], ["#F15BB5", 40], ["#6BCB77", 80]].map(([f, x]) => `${p(`M${x} -210 v10`, "none", 'stroke-width="2"')}${p(`M${x - 16} -196 h32 l6 70 h-44z`, f, T3)}`).join("")}${c(-110, -4, 6, OL)}${c(110, -4, 6, OL)}`, 30],
  sminkekuffert: ["Sminkekuffert", "pynt", "#9B5DE5", 120, 80, (k) => `${r(-56, -56, 112, 50, k, 8)}${p("M-56 -56 L-40 -80 H40 L56 -56", shade(k, 1.1))}${rep(4, (i) => r(-46 + i * 24, -76, 16, 18, ["#FF6B6B", "#FFD93D", "#F15BB5", "#00BBF9"][i], 4, 'stroke-width="2"'))}${star(0, -30, 10, "#FFD93D")}`, 20],
  skaermvaeg: ["Omklædningsskærm", "mob", "#F7B5CF", 230, 200, (k) => `${[-75, 0, 75].map((x, i) => `${r(x - 36, -196, 72, 190, i % 2 ? shade(k, 0.9) : k, 6)}${heart(x, -110, 0.8, "#fff")}`).join("")}`, 30],
  /* ---------------------------------------------------------------- Streetwear */
  sneakerhylde: ["Sneakerhylde", "væg", "#FFFFFF", 200, 150, (k) => `${rep(3, (j) => `${r(-96, -50 - j * 46, 192, 8, "#C98B55", 3)}${rep(3, (i) => p(`M${-80 + i * 60} ${-58 - j * 46} q0 -16 18 -16 h14 q14 0 18 16z`, ["#FF6B6B", "#4D96FF", "#FFD93D", "#6BCB77", "#F15BB5", "#9B5DE5"][(i + j * 2) % 6], 'stroke-width="2"'))}`)}`, 25],
  boombox: ["Boombox", "leg", "#3A3A55", 160, 90, (k) => `${r(-76, -76, 152, 72, k, 10)}${ln("M-50 -76 v-12 h100 v12", OL, 5)}${c(-44, -40, 22, "#1B1530")}${c(44, -40, 22, "#1B1530")}${c(-44, -40, 8, "#9AA4BA")}${c(44, -40, 8, "#9AA4BA")}${r(-16, -64, 32, 20, "#00BBF9", 3, 'stroke-width="2"')}`, 25],
  graffitivaeg: ["Graffitivæg", "væg", "#9AA4BA", 300, 180, (k) => `${r(-146, -176, 292, 172, k, 4)}${rep(4, (j) => rep(6, (i) => r(-146 + i * 49 + (j % 2) * 24, -176 + j * 43, 49, 43, "none", 0, 'stroke="#7A849E" stroke-width="2"')))}${p("M-110 -60 q30 -80 60 -20 q20 -60 50 0 q30 -70 60 -10", "none", 'stroke="#F15BB5" stroke-width="16"')}${p("M-110 -60 q30 -80 60 -20 q20 -60 50 0 q30 -70 60 -10", "none", 'stroke="#FFD93D" stroke-width="5"')}${star(100, -120, 22, "#00BBF9")}`, 30],
  haettetroejebojle: ["Hættetrøje på bøjle", "væg", "#9B5DE5", 120, 150, (k) => `${p("M-20 -140 q20 -16 40 0", "none", T3)}${p("M-50 -120 Q0 -140 50 -120 L56 -10 H-56Z", k)}${p("M-30 -126 q30 30 60 0", shade(k, 0.85), T3)}${r(-24, -60, 48, 24, shade(k, 0.9), 8, T3)}`, 15],
  /* ---------------------------------------------------------------- Fotostudiet */
  kamerastativ: ["Kamera på stativ", "mob", "#3A3A55", 120, 200, (k) => `${ln("M0 -110 L-40 0 M0 -110 L40 0 M0 -110 V0", OL, 5)}${r(-36, -160, 72, 50, k, 8)}${c(10, -135, 18, "#1B1530")}${c(10, -135, 8, "#4D96FF")}${r(-30, -170, 20, 10, k, 3)}`, 30],
  softbox: ["Fotolampe", "lys", "#FFFFFF", 140, 240, (k) => L(`<path d="M-40 -160 L-200 -80 L-200 -240Z" class="pl-glow" fill="#FFF6C9" opacity=".5"/>${ln("M0 0 V-150 M-30 0 L0 -60 L30 0", OL, 5)}${p("M-10 -200 L50 -230 V-110 L-10 -140Z", k)}${r(-20, -190, 20, 40, "#3A3A55", 4)}`), 30],
  fotobaggrund: ["Fotobaggrund", "væg", "#C7B8FF", 260, 260, (k) => `${ln("M-120 -250 H120", OL, 8)}${p("M-110 -246 H110 V-30 Q0 -10 -110 -30Z", k)}${star(-50, -180, 16, "#fff")}${star(40, -130, 10, "#fff")}${heart(30, -200, 0.8, "#fff")}`, 25],
  polaroidvaeg: ["Billedsnor med fotos", "væg", "#FFFFFF", 260, 120, (k) => `${ln("M-126 -110 Q0 -80 126 -110", OL, 3)}${[-90, -30, 30, 90].map((x, i) => `<g transform="rotate(${(i % 2 ? 6 : -6)} ${x} -96)">${r(x - 22, -100, 44, 52, k, 2, 'stroke-width="2"')}${r(x - 17, -95, 34, 32, ["#FFD93D", "#4D96FF", "#F15BB5", "#6BCB77"][i], 1, 'stroke-width="1.5"')}</g>`).join("")}`, 15],
  /* ---------------------------------------------------------------- Musikproduceren */
  mixerpult: ["Mixerpult", "mob", "#3A3A55", 260, 150, (k) => `${p("M-120 -60 L-100 -100 H100 L120 -60Z", k)}${r(-126, -62, 252, 62, shade(k, 0.85), 6)}${rep(8, (i) => `${ln(`M${-84 + i * 24} -94 v-0`, "none", 1)}${r(-90 + i * 24, -96, 12, 30, "#1B1530", 3, 'stroke-width="1.5"')}${r(-92 + i * 24, -86 + (i * 7) % 18, 16, 6, ["#FF6B6B", "#FFD93D", "#6BCB77", "#00BBF9"][i % 4], 2, 'stroke-width="1.5"')}`)}`, 40],
  studiemonitor: ["Studiehøjttaler", "mob", "#1B1530", 80, 130, (k) => `${r(-34, -126, 68, 122, k, 8)}${c(0, -94, 16, "#3A3A55")}${c(0, -94, 6, "#9AA4BA")}${c(0, -44, 26, "#3A3A55")}${c(0, -44, 10, "#FFD93D")}`, 25],
  trommesaet: ["Trommesæt", "mob", "#E5484D", 260, 200, (k) => `${e(0, -60, 54, 54, k)}${c(0, -60, 38, "#fff")}${star(0, -60, 14, k)}${e(-90, -90, 34, 10, "#FFF6EE")}${p("M-124 -90 V-50 Q-90 -40 -56 -50 V-90", k)}${e(80, -110, 30, 10, "#FFF6EE")}${p("M50 -110 V-70 Q80 -60 110 -70 V-110", k)}${ln("M-110 -160 V-40 M110 -170 V-40", OL, 4)}${e(-110, -166, 34, 6, "#FFD93D")}${e(110, -176, 30, 6, "#FFD93D")}`, 50],
  popfilter: ["Studiemikrofon", "leg", "#9AA4BA", 100, 220, (k) => `${ln("M-20 0 V-150 L20 -170", OL, 6)}${e(-20, -2, 30, 7, k)}${r(10, -206, 26, 46, k, 12)}${c(-14, -184, 20, "none", 'stroke-width="3"')}${c(-14, -184, 16, "#3A3A55", 'fill-opacity=".3" stroke-width="0"')}`, 25],
  /* ---------------------------------------------------------------- Modebutikken */
  proeverum: ["Prøverum", "mob", "#9B5DE5", 160, 260, (k) => `${r(-76, -256, 152, 252, shade(k, 0.9), 6)}${ln("M-80 -250 H80", OL, 6)}${p("M-70 -244 Q-50 -120 -70 -10 H20 Q0 -120 20 -244Z", k)}${rep(4, (i) => ln(`M${-60 + i * 20} -244 Q${-46 + i * 20} -120 ${-60 + i * 20} -12`, shade(k, 0.8), 3))}`, 35],
  mannequin: ["Mannequin", "mob", "#F2E3CF", 100, 260, (k) => `${ln("M0 0 V-80", OL, 6)}${e(0, -2, 34, 8, "#9AA4BA")}${p("M-34 -200 Q-40 -150 -26 -80 H26 Q40 -150 34 -200 Q0 -214 -34 -200Z", "#F15BB5")}${c(0, -226, 22, k)}${ln("M-34 -196 L-50 -130 M34 -196 L50 -130", k, 10)}`, 30],
  taskehylde: ["Taskehylde", "væg", "#FFFFFF", 200, 140, (k) => `${rep(2, (j) => `${r(-96, -70 - j * 60, 192, 8, "#C98B55", 3)}${rep(3, (i) => `${p(`M${-76 + i * 60} ${-78 - j * 60} h40 l-4 -36 h-32z`, ["#FF6B6B", "#FFD93D", "#4D96FF", "#9B5DE5", "#F15BB5", "#6BCB77"][i + j * 3], 'stroke-width="2"')}${p(`M${-66 + i * 60} ${-114 - j * 60} q10 -14 20 0`, "none", 'stroke-width="2"')}`)}`)}`, 25],
  kasseapparat: ["Kasseapparat", "pynt", "#4D96FF", 120, 110, (k) => `${p("M-50 -6 L-40 -60 H40 L50 -6Z", k)}${r(-30, -100, 60, 36, "#1B1530", 6)}${tx(0, -76, "42 kr", 14, "#6BCB77")}${rep(6, (i) => r(-30 + (i % 3) * 22, -50 + Math.floor(i / 3) * 16, 16, 10, "#fff", 2, 'stroke-width="1.5"'))}`, 20],
  /* ---------------------------------------------------------------- Skønhedssalonen */
  frisoerstol: ["Frisørstol", "mob", "#F15BB5", 130, 180, (k) => `${ln("M0 -40 V-6 M-40 0 H40", OL, 7)}${r(-40, -80, 80, 30, k, 12)}${r(-36, -170, 72, 96, k, 20)}${r(-50, -100, 16, 40, shade(k, 0.85), 8)}${r(34, -100, 16, 40, shade(k, 0.85), 8)}`, 30],
  haartoerrer: ["Hårtørrer", "pynt", "#9B5DE5", 120, 90, (k) => `${p("M-50 -70 Q-56 -40 -30 -36 H30 L44 -60 Q20 -76 -50 -70Z", k)}${r(-16, -40, 22, 40, k, 6)}${p("M44 -60 l30 -14 v30z", "#CFD6E6", T3)}${ln("M60 -66 h20 M60 -56 h24 M60 -46 h20", "#9FD4FF", 3)}`, 15],
  neglelak: ["Neglelakhylde", "væg", "#FFFFFF", 180, 100, (k) => `${r(-86, -96, 172, 8, "#C98B55", 3)}${r(-86, -46, 172, 8, "#C98B55", 3)}${rep(7, (i) => `${r(-80 + i * 23, -126, 14, 30, ["#FF6B6B", "#F15BB5", "#9B5DE5", "#4D96FF", "#6BCB77", "#FFD93D", "#FF8A3C"][i], 4, 'stroke-width="2"')}${r(-77 + i * 23, -138, 8, 12, OL, 2, 'stroke-width="0"')}`)}${rep(7, (i) => r(-80 + i * 23, -76, 14, 30, ["#FFD93D", "#FF8A3C", "#FF6B6B", "#F15BB5", "#9B5DE5", "#4D96FF", "#6BCB77"][i], 4, 'stroke-width="2"'))}`, 15],
  haarboerster: ["Hårbørster", "pynt", "#F15BB5", 120, 80, (k) => `${r(-50, -40, 60, 26, k, 12)}${r(10, -32, 50, 10, k, 5)}${rep(6, (i) => ln(`M${-44 + i * 10} -40 v-10`, OL, 2))}${p("M-20 -6 h70 q8 0 8 -8 l-10 -16 h-60z", "#FFD93D", T3)}`, 10],
  /* ---------------------------------------------------------------- Festivalen */
  festivaltelt: ["Festivaltelt", "mob", "#FF6B6B", 300, 230, (k) => `${p("M-140 0 V-120 L0 -220 L140 -120 V0Z", "#FFF6EE")}${rep(6, (i) => p(`M${-140 + i * 46.6} -120 L0 -220 L${-140 + (i + 1) * 46.6} -120Z`, i % 2 ? k : "#FFF6EE", T3))}${p("M-40 0 V-90 Q0 -110 40 -90 V0Z", "#3A2A20")}${ln("M0 -220 V-250", OL, 4)}${p("M0 -250 l30 8 l-30 8z", "#FFD93D", T3)}`, 45],
  madvogn: ["Madvogn", "mob", "#FFD93D", 260, 200, (k) => `${r(-120, -170, 240, 140, k, 14)}${r(-90, -140, 140, 60, "#3A2A20", 6)}${ln("M-100 -84 H70", "#fff", 8)}${c(-80, -20, 20, OL)}${c(80, -20, 20, OL)}${p("M-130 -180 H130 L120 -150 H-120Z", "#FF6B6B")}${tx(-20, -100, "🌭", 34)}`, 40],
  armbaandsbod: ["Armbånd", "pynt", "#9B5DE5", 120, 60, (k) => `${rep(5, (i) => e(-40 + i * 20, -24, 18, 8, ["#FF6B6B", "#FFD93D", "#4D96FF", k, "#6BCB77"][i], 'stroke-width="3" fill-opacity="0"'))}`, 10],
  flagbanner: ["Festivalflag", "pynt", "#00BBF9", 120, 260, (k) => `${ln("M-40 0 V-250", OL, 5)}${p("M-38 -246 Q20 -230 50 -244 V-160 Q20 -150 -38 -166Z", k)}${star(6, -200, 16, "#fff")}`, 15],
};

/* The new packs. */
export const PACKS2 = [
  { id: "brand", n: "Brandstationen", em: "🚒", lvl: 2, d: "Slange, stige, slukker og sirene.", items: ["brandslange", "brandstige", "brandslukker", "sirenelampe", "brandhjelmstativ", "brandhane"] },
  { id: "luft", n: "Luftredning", em: "🚁", lvl: 3, d: "Helikopterplads, fly, radar og faldskærm.", items: ["landingsplads", "vindpose", "propelfly", "radar", "faldskaerm", "helikopter"] },
  { id: "byg", n: "Byggehelte", em: "🚧", lvl: 2, d: "Gravko, kegler, stillads og værktøj.", items: ["gravko", "kegle", "betonblander", "stillads", "vaerktoejskasse", "murstensstak", "trillebor"] },
  { id: "bjerg", n: "Bjergredning", em: "🏔️", lvl: 3, d: "Ski, kælk, slæde og en pingvin.", items: ["ski", "kaelk", "termokande", "slaede", "isbjerg", "pingvin"] },
  { id: "robotredning", n: "Robotredning", em: "🤖", lvl: 4, d: "Drone, robothund og ladestation.", items: ["ladestation", "drone", "robothund", "robot"] },
  { id: "bjorn", n: "Den hyggelige bjørn", em: "🧸", lvl: 1, d: "Honning, lænestol, gyngestol og puder.", items: ["honningkrukke", "laenestol", "gyngestol", "hyggepude", "bjoernebog"] },
  { id: "elefant", n: "Den lille elefant", em: "🐘", lvl: 2, d: "Elefant, vandkande, tromme og badebalje.", items: ["elefantbamse", "vandkande", "tromme", "badebalje"] },
  { id: "ormehaven", n: "Ormehaven", em: "🪱", lvl: 1, d: "Jord, planter, en tunnel og en regnorm.", items: ["jordbunke", "plantekasse", "tunnelroer", "regnorm", "gulerod"] },
  { id: "skovvenner", n: "Skovens venner", em: "🦔", lvl: 2, d: "Svampe, blade, et musehus og et egern.", items: ["svampe", "bladbunke", "musehus", "egern"] },
  { id: "gaard", n: "Bondegården", em: "🐄", lvl: 3, d: "Ko, gris, får og hønsehus.", items: ["ko", "gris", "faar", "hoensehus", "maelkejunge", "hoeballe"] },
  { id: "dukkehus", n: "Dukkehus og legetøj", em: "🎎", lvl: 1, d: "Dukkevogn, kludedukke, tesæt og dukkeseng.", items: ["dukkevogn", "kludedukke", "tesaet", "dukkeseng"] },
  { id: "fantasiskov", n: "Fantasiskoven", em: "🍄", lvl: 4, d: "En troldedør, en ønskebrønd og lysende blomster.", items: ["troldedoer", "oenskebroend", "lysblomst", "feeloekke"] },
  { id: "danseakademi", n: "Danseakademiet", em: "🩰", lvl: 2, d: "Stang, spejle, lysende gulv og tutu.", items: ["balletstang", "spejlvaeg", "dansegulv", "balletsko", "tutustativ"] },
  { id: "backstage", n: "Backstage", em: "💄", lvl: 3, d: "Sminkebord, tøjstativ og omklædningsskærm.", items: ["sminkebord", "toejstativ", "sminkekuffert", "skaermvaeg"] },
  { id: "streetwear", n: "Streetwear", em: "👟", lvl: 2, d: "Sneakers, boombox og graffiti.", items: ["sneakerhylde", "boombox", "graffitivaeg", "haettetroejebojle"] },
  { id: "foto", n: "Fotostudiet", em: "📸", lvl: 3, d: "Kamera, lys, baggrund og billeder.", items: ["kamerastativ", "softbox", "fotobaggrund", "polaroidvaeg"] },
  { id: "producer", n: "Musikproduceren", em: "🎧", lvl: 4, d: "Mixerpult, højttalere, trommer og mikrofon.", items: ["mixerpult", "studiemonitor", "trommesaet", "popfilter"] },
  { id: "modebutik", n: "Modebutikken", em: "👗", lvl: 3, d: "Prøverum, mannequin, tasker og kasse.", items: ["proeverum", "mannequin", "taskehylde", "kasseapparat"] },
  { id: "salon", n: "Skønhedssalonen", em: "💅", lvl: 2, d: "Frisørstol, hårtørrer, neglelak og børster.", items: ["frisoerstol", "haartoerrer", "neglelak", "haarboerster"] },
  { id: "festival", n: "Festivalen", em: "🎪", lvl: 5, d: "Telt, madvogn, armbånd og flag.", items: ["festivaltelt", "madvogn", "armbaandsbod", "flagbanner"] },
];

/* English names (the panel's English mode looks names up by their Danish text). */
export const PACKS2_EN = {
  "Brandslange på hjul": "Fire hose reel", Brandstige: "Fire ladder", Brandslukker: "Fire extinguisher", Sirenelampe: "Siren lamp", Hjelmstativ: "Helmet stand",
  Helikopterplads: "Helipad", Vindpose: "Windsock", Propelfly: "Propeller plane", Radar: "Radar", "Faldskærm": "Parachute",
  Gravko: "Digger", Trafikkegle: "Traffic cone", Betonblander: "Cement mixer", Stillads: "Scaffolding", "Værktøjskasse": "Toolbox", Murstensstak: "Pile of bricks", "Trillebør": "Wheelbarrow",
  "Ski og stave": "Skis and poles", "Kælk": "Sledge", "Varm kakao": "Hot cocoa", "Hundeslæde": "Dog sled", Isbjerg: "Iceberg", "Pingvin-bamse": "Penguin plush",
  Ladestation: "Charging station", Drone: "Drone", Robothund: "Robot dog",
  Honningkrukke: "Honey pot", "Lænestol": "Armchair", Gyngestol: "Rocking chair", "Stor hyggepude": "Big cosy cushion", "Bog om bjørne": "Book about bears",
  Elefantbamse: "Elephant plush", Vandkande: "Watering can", Tromme: "Drum", Badebalje: "Bath tub",
  Jordbunke: "Pile of soil", Plantekasse: "Planter", Krybetunnel: "Crawl tunnel", "Regnorm-bamse": "Earthworm plush", "Kæmpegulerod": "Giant carrot",
  Svampe: "Mushrooms", Bladbunke: "Pile of leaves", "Musehus i en stub": "Mouse house in a stump", "Egern med nød": "Squirrel with a nut",
  Ko: "Cow", Gris: "Pig", "Får": "Sheep", "Hønsehus": "Hen house", "Mælkejunge": "Milk churn",
  Dukkevogn: "Doll's pram", Kludedukke: "Rag doll", "Tesæt": "Tea set", Dukkeseng: "Doll's bed",
  "Troldedør": "Troll door", "Ønskebrønd": "Wishing well", "Lysende blomst": "Glowing flower", "Feeløkke": "Fairy ring",
  Balletstang: "Ballet barre", "Spejlvæg": "Mirror wall", "Lysende dansegulv": "Light-up dance floor", Balletsko: "Ballet shoes", "Tutu på stativ": "Tutu on a stand",
  "Sminkebord med lys": "Make-up table with lights", "Tøjstativ": "Clothes rail", Sminkekuffert: "Make-up case", "Omklædningsskærm": "Changing screen",
  Sneakerhylde: "Sneaker shelf", Boombox: "Boombox", "Graffitivæg": "Graffiti wall", "Hættetrøje på bøjle": "Hoodie on a hanger",
  "Kamera på stativ": "Camera on a tripod", Fotolampe: "Photo light", Fotobaggrund: "Photo backdrop", "Billedsnor med fotos": "Photo string",
  Mixerpult: "Mixing desk", "Studiehøjttaler": "Studio speaker", "Trommesæt": "Drum kit", Studiemikrofon: "Studio microphone",
  "Prøverum": "Fitting room", Mannequin: "Mannequin", Taskehylde: "Bag shelf", Kasseapparat: "Till",
  "Frisørstol": "Hairdresser's chair", "Hårtørrer": "Hairdryer", Neglelakhylde: "Nail polish shelf", "Hårbørster": "Hairbrushes",
  Festivaltelt: "Festival tent", Madvogn: "Food truck", "Armbånd": "Bracelets", Festivalflag: "Festival flag",
  Brandstationen: "The fire station", Luftredning: "Air rescue", Byggehelte: "Builders", Bjergredning: "Mountain rescue", Robotredning: "Robot rescue",
  "Den hyggelige bjørn": "The cosy bear", "Den lille elefant": "The little elephant", Ormehaven: "The worm garden", "Skovens venner": "Forest friends",
  "Bondegården": "The farm", "Dukkehus og legetøj": "Dolls and toys", Fantasiskoven: "The fantasy forest", Danseakademiet: "Dance academy",
  Backstage: "Backstage", Streetwear: "Streetwear", Fotostudiet: "Photo studio", Musikproduceren: "Music producer", Modebutikken: "Fashion shop",
  "Skønhedssalonen": "Beauty salon", Festivalen: "The festival",
  "Slange, stige, slukker og sirene.": "Hose, ladder, extinguisher and siren.",
  "Helikopterplads, fly, radar og faldskærm.": "Helipad, plane, radar and parachute.",
  "Gravko, kegler, stillads og værktøj.": "Digger, cones, scaffolding and tools.",
  "Ski, kælk, slæde og en pingvin.": "Skis, sledge, dog sled and a penguin.",
  "Drone, robothund og ladestation.": "Drone, robot dog and charging station.",
  "Honning, lænestol, gyngestol og puder.": "Honey, armchair, rocking chair and cushions.",
  "Elefant, vandkande, tromme og badebalje.": "Elephant, watering can, drum and bath tub.",
  "Jord, planter, en tunnel og en regnorm.": "Soil, plants, a tunnel and an earthworm.",
  "Svampe, blade, et musehus og et egern.": "Mushrooms, leaves, a mouse house and a squirrel.",
  "Ko, gris, får og hønsehus.": "Cow, pig, sheep and hen house.",
  "Dukkevogn, kludedukke, tesæt og dukkeseng.": "Doll's pram, rag doll, tea set and doll's bed.",
  "En troldedør, en ønskebrønd og lysende blomster.": "A troll door, a wishing well and glowing flowers.",
  "Stang, spejle, lysende gulv og tutu.": "Barre, mirrors, light-up floor and tutu.",
  "Sminkebord, tøjstativ og omklædningsskærm.": "Make-up table, clothes rail and changing screen.",
  "Sneakers, boombox og graffiti.": "Sneakers, boombox and graffiti.",
  "Kamera, lys, baggrund og billeder.": "Camera, lights, backdrop and photos.",
  "Mixerpult, højttalere, trommer og mikrofon.": "Mixing desk, speakers, drums and microphone.",
  "Prøverum, mannequin, tasker og kasse.": "Fitting room, mannequin, bags and till.",
  "Frisørstol, hårtørrer, neglelak og børster.": "Hairdresser's chair, hairdryer, nail polish and brushes.",
  "Telt, madvogn, armbånd og flag.": "Tent, food truck, bracelets and flags.",
};
