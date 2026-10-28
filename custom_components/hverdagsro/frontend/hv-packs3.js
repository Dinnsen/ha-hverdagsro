/* Hverdagsro – more theme packs for the play world (part 3): the sweet and cute world, family life and holidays,
   and heroes, inventors and magic. All our own drawings; same shape as hv-playcat's THINGS:
   key: [name, category, colour, width, height, draw(c), price, flat]. */
import { OL, shade, DRAW } from "./hv-playcat.js";

const { r, c, e, p, ln, dot, gl, L, tx, star, heart, rep, leaf, T3 } = DRAW;
const eyes = (x, y, s = 1) => `${dot(x - 10 * s, y, 4 * s, OL)}${dot(x + 10 * s, y, 4 * s, OL)}${p(`M${x - 6 * s} ${y + 8 * s} q${6 * s} ${6 * s} ${12 * s} 0`, "none", T3)}`;
const blush = (x, y, s = 1) => `${dot(x - 18 * s, y + 6 * s, 5 * s, "#FF9AB5")}${dot(x + 18 * s, y + 6 * s, 5 * s, "#FF9AB5")}`;

export const THINGS3 = {
  /* ---------------------------------------------------------------- Kageværkstedet */
  bageovn: ["Bageovn", "mob", "#FF9AB5", 150, 160, (k) => `${r(-70, -150, 140, 150, k, 12)}${r(-56, -110, 112, 80, "#3A3A55", 8)}${r(-46, -100, 92, 60, "#FFB86B", 6, T3)}${rep(3, (i) => c(-40 + i * 40, -130, 8, "#fff", T3))}${ln("M-40 -20 H40", OL, 6)}`, 25],
  roerepind: ["Røreskål", "pynt", "#BFE6FF", 110, 90, (k) => `${p("M-50 -60 H50 Q46 0 0 0 Q-46 0 -50 -60Z", k)}${e(0, -60, 50, 10, "#FFF3D6")}${ln("M10 -64 L40 -110", "#C98B55", 7)}`, 10],
  lagkageopsats: ["Kageopsats", "pynt", "#FFF3D6", 120, 160, (k) => `${ln("M0 0 V-150", "#CFD6E6", 6)}${e(0, -6, 50, 8, "#fff")}${e(0, -66, 40, 7, "#fff")}${e(0, -120, 28, 6, "#fff")}${rep(3, (i) => c(-30 + i * 30, -24, 12, ["#FF9AB5", k, "#B9E4C9"][i], T3))}${rep(2, (i) => c(-14 + i * 28, -82, 11, ["#FFD93D", "#FF9AB5"][i], T3))}${c(0, -134, 10, "#FF6B6B", T3)}`, 15],
  kagerulle: ["Bagebord", "mob", "#E8C39E", 220, 120, (k) => `${r(-100, -110, 200, 20, k, 6)}${ln("M-88 -90 V0 M88 -90 V0", shade(k, 0.75), 10)}${e(-30, -118, 40, 8, "#FFF3D6")}${r(20, -126, 70, 14, "#C98B55", 7, T3)}${rep(3, (i) => c(-60 + i * 22, -124, 7, "#FFB86B", T3))}`, 20],
  kokkehue: ["Kokkehue på knag", "væg", "#FFFFFF", 90, 110, (k) => `${ln("M-30 -40 H30", "#C98B55", 8)}${p("M-26 -50 V-74 Q-46 -84 -34 -100 Q-24 -116 0 -106 Q24 -116 34 -100 Q46 -84 26 -74 V-50Z", k)}`, 10],
  /* ---------------------------------------------------------------- Slikriget */
  slikmaskine: ["Slikautomat", "mob", "#FF6B6B", 110, 180, (k) => `${r(-30, -60, 60, 60, k, 8)}${c(0, -110, 48, "#E8F6FF", 'fill-opacity=".9"')}${rep(9, (i) => dot(-28 + (i % 3) * 28, -130 + Math.floor(i / 3) * 22, 9, ["#FFD93D", "#4D96FF", "#6BCB77", "#F15BB5"][i % 4]))}${r(-12, -40, 24, 16, "#FFD93D", 4, T3)}`, 20],
  slikstok: ["Kæmpe slikstok", "pynt", "#FF6B6B", 90, 240, (k) => `${ln("M0 0 V-170 Q0 -230 -40 -220 Q-60 -210 -50 -190", "#fff", 22)}${ln("M0 0 V-170 Q0 -230 -40 -220 Q-60 -210 -50 -190", k, 22)}${rep(7, (i) => ln(`M-10 ${-20 - i * 24} l20 -12`, "#fff", 8))}`, 15],
  lollipoptrae: ["Slikkepindetræ", "pynt", "#F15BB5", 160, 220, (k) => `${ln("M0 0 V-110", "#fff", 10)}${c(0, -160, 56, k)}${p("M0 -160 m0 -40 a40 40 0 1 1 -1 0 M0 -160 m0 -20 a20 20 0 1 0 1 0", "none", 'stroke="#fff" stroke-width="8"')}`, 15],
  gummibamse: ["Vingummibamse", "leg", "#6BCB77", 90, 120, (k) => `${e(0, -40, 34, 40, k, 'fill-opacity=".85"')}${c(0, -94, 26, k, 'fill-opacity=".85"')}${c(-20, -114, 10, k)}${c(20, -114, 10, k)}${eyes(0, -96, 0.7)}`, 10],
  skumfidussofa: ["Skumfidussofa", "mob", "#FFC8DD", 240, 130, (k) => `${rep(3, (i) => r(-110 + i * 74, -120, 72, 70, i % 2 ? "#fff" : k, 30))}${rep(4, (i) => r(-116 + i * 58, -60, 58, 54, i % 2 ? k : "#fff", 24))}`, 25],
  /* ---------------------------------------------------------------- Miniaturehuset */
  minikokken: ["Minikøkken", "leg", "#B9E4C9", 160, 150, (k) => `${r(-70, -110, 140, 110, k, 8)}${c(-36, -100, 14, "#3A3A55", T3)}${c(10, -100, 14, "#3A3A55", T3)}${r(-60, -76, 60, 60, "#fff", 6, T3)}${r(10, -76, 50, 60, shade(k, 0.85), 6, T3)}${ln("M50 -110 V-150 Q50 -160 40 -160", "#CFD6E6", 5)}`, 20],
  mininaboer: ["Mininaboer", "leg", "#FFD93D", 140, 90, (k) => `${rep(3, (i) => `${c(-46 + i * 46, -56, 18, ["#F2C9A0", "#C98B55", "#FFE0BD"][i], T3)}${r(-60 + i * 46, -40, 28, 40, [k, "#4D96FF", "#F15BB5"][i], 10, T3)}${dot(-50 + i * 46, -58, 3, OL)}${dot(-42 + i * 46, -58, 3, OL)}`)}`, 15],
  minibil: ["Lille bilbane", "leg", "#3A3A55", 260, 40, (k) => `${e(0, -18, 126, 22, k)}${e(0, -18, 90, 12, "#6BCB77", T3)}${p("M-110 -18 H110", "none", 'stroke="#fff" stroke-width="3" stroke-dasharray="10 10"')}${r(-60, -30, 30, 16, "#FF6B6B", 5, T3)}${r(40, -24, 30, 16, "#4D96FF", 5, T3)}`, 20, 1],
  rulletrappe: ["Legetøjselevator", "leg", "#4D96FF", 120, 220, (k) => `${r(-50, -210, 100, 210, k, 10)}${rep(3, (i) => r(-40, -200 + i * 66, 80, 56, "#FFF3D6", 6, T3))}${r(-14, -176, 28, 30, "#FFD93D", 4, T3)}`, 20],
  /* ---------------------------------------------------------------- Søde dyrevenner */
  kattepude: ["Kattepude", "mob", "#FFE0BD", 130, 100, (k) => `${e(0, -40, 60, 40, k)}${p("M-46 -66 L-40 -96 L-20 -76Z M46 -66 L40 -96 L20 -76Z", k)}${eyes(0, -46)}${blush(0, -46)}`, 15],
  hvalpbamse: ["Plyshvalp", "leg", "#C98B55", 100, 110, (k) => `${e(0, -36, 36, 34, k)}${c(0, -76, 30, k)}${e(-30, -76, 10, 22, shade(k, 0.7))}${e(30, -76, 10, 22, shade(k, 0.7))}${eyes(0, -80, 0.8)}${dot(0, -72, 5, OL)}`, 10],
  pandaslag: ["Pandahængekøje", "mob", "#FFFFFF", 220, 170, (k) => `${ln("M-100 -160 V0 M100 -160 V0", "#C98B55", 8)}${p("M-100 -140 Q0 -40 100 -140", k)}${c(0, -100, 26, "#fff")}${c(-20, -122, 9, OL)}${c(20, -122, 9, OL)}${e(-10, -102, 6, 8, OL)}${e(10, -102, 6, 8, OL)}${dot(-10, -102, 2, "#fff")}${dot(10, -102, 2, "#fff")}`, 20],
  froepude: ["Frøpude", "mob", "#6BCB77", 140, 90, (k) => `${e(0, -34, 66, 34, k)}${c(-30, -66, 18, k)}${c(30, -66, 18, k)}${c(-30, -66, 8, "#fff", T3)}${c(30, -66, 8, "#fff", T3)}${dot(-30, -66, 4, OL)}${dot(30, -66, 4, OL)}${p("M-20 -36 q20 16 40 0", "none", T3)}`, 15],
  sky: ["Søvnig sky-lampe", "lys", "#E8F6FF", 150, 90, (k) => L(`${gl(0, -44, 70, 40, "#E8F6FF")}${p("M-60 -10 Q-80 -10 -74 -36 Q-70 -60 -40 -56 Q-30 -86 4 -80 Q30 -90 44 -62 Q76 -64 70 -34 Q70 -10 50 -10Z", k)}${p("M-24 -40 q8 6 16 0 M8 -40 q8 6 16 0", "none", T3)}${blush(0, -40, 0.9)}`), 20],
  /* ---------------------------------------------------------------- Gavebutikken */
  gavehylde: ["Gavehylde", "mob", "#E8C39E", 180, 200, (k) => `${r(-80, -196, 160, 196, k, 8)}${rep(3, (i) => ln(`M-80 ${-130 + i * 64} H80`, shade(k, 0.7), 6))}${rep(3, (i) => r(-66 + i * 46, -186, 36, 50, ["#FF9AB5", "#BFE6FF", "#FFD93D"][i], 4, T3))}${rep(2, (i) => c(-40 + i * 80, -100, 22, ["#B9E4C9", "#F15BB5"][i], T3))}`, 20],
  gaveaesker: ["Gavestak", "pynt", "#9B5DE5", 120, 140, (k) => `${r(-50, -60, 100, 60, k, 4)}${r(-36, -104, 72, 44, "#FFD93D", 4)}${r(-22, -134, 44, 30, "#FF6B6B", 4)}${ln("M0 0 V-134", "#fff", 6)}${p("M0 -134 q-16 -14 -20 0 q8 6 20 0 q16 -14 20 0 q-8 6 -20 0", "#fff", T3)}`, 15],
  kortstativ: ["Kortstativ", "mob", "#CFD6E6", 90, 200, (k) => `${ln("M0 0 V-190", k, 6)}${e(0, -4, 30, 6, k)}${rep(6, (i) => r(i % 2 ? 4 : -40, -184 + Math.floor(i / 2) * 50, 36, 44, ["#FF9AB5", "#FFD93D", "#B9E4C9", "#BFE6FF", "#F15BB5", "#FFB86B"][i], 3, T3))}`, 15],
  sloejfekasse: ["Sløjfekurv", "pynt", "#FF6B6B", 100, 80, (k) => `${p("M-44 -40 L-36 0 H36 L44 -40Z", "#E8C39E")}${rep(3, (i) => p(`M${-26 + i * 26} -48 q-14 -16 -18 0 q8 6 18 0 q14 -16 18 0 q-8 6 -18 0`, [k, "#4D96FF", "#FFD93D"][i], T3))}`, 10],
  /* ---------------------------------------------------------------- Teselskabet */
  tebord: ["Tebord", "mob", "#FFFFFF", 200, 110, (k) => `${e(0, -86, 96, 18, k)}${ln("M-70 -76 V0 M70 -76 V0", "#E8C39E", 8)}${p("M-20 -100 Q-24 -130 0 -130 Q24 -130 20 -100Z", "#FF9AB5")}${ln("M20 -116 q16 -2 16 10", OL, 4)}${e(50, -100, 14, 5, "#BFE6FF")}${e(-56, -100, 14, 5, "#B9E4C9")}`, 20],
  etagere: ["Kageetagere", "pynt", "#FFD93D", 90, 150, (k) => `${ln("M0 0 V-140", k, 5)}${e(0, -10, 40, 6, "#fff")}${e(0, -66, 32, 6, "#fff")}${e(0, -116, 24, 5, "#fff")}${rep(3, (i) => c(-24 + i * 24, -20, 8, ["#FF9AB5", "#B9E4C9", "#FFE0BD"][i], T3))}${rep(2, (i) => c(-12 + i * 24, -76, 8, ["#FFD93D", "#FF9AB5"][i], T3))}`, 15],
  blomstervase: ["Blomstervase", "pynt", "#BFE6FF", 80, 140, (k) => `${p("M-24 0 Q-34 -40 -16 -60 H16 Q34 -40 24 0Z", k)}${ln("M-4 -60 L-20 -110 M4 -60 L20 -116 M0 -60 V-124", "#6BCB77", 4)}${c(-20, -112, 10, "#FF9AB5", T3)}${c(20, -118, 10, "#FFD93D", T3)}${c(0, -128, 10, "#F15BB5", T3)}`, 10],
  festlys: ["Lyskæde med hjerter", "væg", "#FF9AB5", 280, 60, (k) => L(`${p("M-136 -50 Q0 0 136 -50", "none")}${rep(7, (i) => heart(-114 + i * 38, -34 + Math.abs(i - 3) * -4, 0.7, i % 2 ? "#FFD93D" : k))}`), 15],
  /* ---------------------------------------------------------------- Vandlandet */
  vandrutsjebane: ["Vandrutsjebane", "leg", "#4D96FF", 260, 240, (k) => `${ln("M80 0 V-220 M120 0 V-220", "#CFD6E6", 8)}${rep(6, (i) => ln(`M80 ${-30 - i * 34} H120`, "#CFD6E6", 6))}${p("M80 -220 Q-40 -200 -20 -120 Q0 -40 -120 -16", "none", `stroke="${OL}" stroke-width="30"`)}${p("M80 -220 Q-40 -200 -20 -120 Q0 -40 -120 -16", "none", `stroke="${k}" stroke-width="22"`)}${e(-120, -10, 40, 10, "#9FD4FF")}`, 30],
  badering: ["Badering", "leg", "#FF6B6B", 110, 60, (k) => `${e(0, -26, 52, 24, k)}${e(0, -26, 22, 9, "#9FD4FF")}${rep(4, (i) => p(`M${-46 + i * 26} -40 l12 6`, "none", 'stroke="#fff" stroke-width="10"'))}`, 10],
  bassin: ["Soppebassin", "leg", "#9FD4FF", 260, 60, (k) => `${e(0, -24, 126, 26, "#4D96FF")}${e(0, -26, 110, 18, k)}${p("M-60 -28 q10 -6 20 0 q10 6 20 0 M20 -24 q10 -6 20 0 q10 6 20 0", "none", 'stroke="#fff" stroke-width="3"')}`, 20, 1],
  vandpistol: ["Vandkanon", "leg", "#6BCB77", 120, 70, (k) => `${r(-50, -50, 90, 26, k, 12)}${r(-30, -60, 30, 14, "#FFD93D", 6, T3)}${r(-46, -28, 20, 28, shade(k, 0.8), 6, T3)}${ln("M40 -38 h20", OL, 6)}${rep(3, (i) => dot(70 + i * 12, -40 - i * 4, 4, "#9FD4FF"))}`, 10],
  solskaerm: ["Parasol", "mob", "#FFD93D", 200, 220, (k) => `${ln("M0 0 V-190", "#fff", 6)}${p("M-96 -170 Q0 -240 96 -170Z", k)}${p("M-48 -190 Q-30 -170 -48 -170 M0 -205 V-170 M48 -190 Q30 -170 48 -170", "none", 'stroke="#fff" stroke-width="10"')}`, 15],
  /* ---------------------------------------------------------------- Isboden */
  isvogn: ["Isvogn", "mob", "#BFE6FF", 200, 200, (k) => `${c(-60, -16, 16, OL)}${c(60, -16, 16, OL)}${r(-90, -110, 180, 90, k, 12)}${p("M-96 -150 Q0 -190 96 -150 V-130 H-96Z", "#FF9AB5")}${ln("M-80 -130 V-110 M80 -130 V-110", "#fff", 6)}${rep(3, (i) => `${p(`M${-48 + i * 48} -70 l-12 -24 h24Z`, "#E8C39E", T3)}${c(-48 + i * 48, -98, 12, ["#FF9AB5", "#FFF3D6", "#8B5A3C"][i], T3)}`)}`, 30],
  isvaffel: ["Kæmpe isvaffel", "pynt", "#FFC8DD", 80, 180, (k) => `${p("M-28 -100 L0 0 L28 -100Z", "#E8C39E")}${ln("M-18 -90 L8 -30 M18 -90 L-8 -30", shade("#E8C39E", 0.8), 3)}${c(0, -116, 30, k)}${c(-12, -146, 22, "#B9E4C9")}${c(8, -162, 18, "#FFF3D6")}${c(10, -184, 8, "#FF6B6B", T3)}`, 10],
  isskilt: ["Isskilt", "pynt", "#FF9AB5", 90, 170, (k) => `${ln("M0 0 V-90", OL, 6)}${r(-36, -170, 72, 80, k, 10)}${p("M-14 -126 L0 -100 L14 -126Z", "#E8C39E", T3)}${c(0, -136, 14, "#fff", T3)}`, 10],
  softice: ["Softicemaskine", "mob", "#CFD6E6", 130, 160, (k) => `${r(-56, -150, 112, 150, k, 10)}${r(-40, -136, 80, 40, "#fff", 6, T3)}${tx(0, -108, "SOFT", 18)}${r(-30, -80, 60, 20, "#3A3A55", 4, T3)}${p("M-6 -60 q6 -14 12 0 q8 0 0 12 h-12 q-8 -12 0 -12Z", "#FFF3D6", T3)}`, 20],
  /* ---------------------------------------------------------------- Dyreklinikken */
  undersoegelsesbord: ["Dyrlægebord", "mob", "#E8F6FF", 200, 120, (k) => `${r(-90, -100, 180, 20, k, 6)}${ln("M-70 -80 V0 M70 -80 V0", "#9AA4BA", 8)}${e(10, -110, 40, 16, "#FFE0BD")}${c(-34, -118, 16, "#FFE0BD")}${eyes(-34, -120, 0.5)}${r(-10, -120, 50, 10, "#FFFFFF", 4, T3)}`, 25],
  dyrlaegetaske: ["Dyrlægetaske", "leg", "#FF6B6B", 110, 80, (k) => `${r(-50, -60, 100, 60, k, 10)}${p("M-20 -60 v-12 h40 v12", "none", 'stroke-width="6"')}${r(-14, -44, 28, 28, "#fff", 4, T3)}${p("M0 -40 V-20 M-10 -30 H10", "none", 'stroke="#FF6B6B" stroke-width="5"')}`, 15],
  kaeledyrsseng: ["Kæledyrsseng", "mob", "#9B5DE5", 150, 70, (k) => `${e(0, -28, 70, 28, k)}${e(0, -34, 50, 16, "#FFF3D6")}${c(-14, -46, 16, "#C98B55", T3)}${e(10, -42, 24, 14, "#C98B55", T3)}${dot(-18, -48, 3, OL)}`, 15],
  foderskab: ["Foderhylde", "mob", "#B9E4C9", 160, 180, (k) => `${r(-70, -176, 140, 176, k, 8)}${ln("M-70 -90 H70", shade(k, 0.7), 6)}${rep(3, (i) => r(-60 + i * 42, -164, 34, 64, ["#FFD93D", "#FF9AB5", "#BFE6FF"][i], 6, T3))}${rep(2, (i) => c(-30 + i * 60, -40, 22, "#C98B55", T3))}`, 15],
  /* ---------------------------------------------------------------- Camping */
  telt: ["Kuppeltelt", "mob", "#6BCB77", 240, 160, (k) => `${p("M-110 0 Q-100 -150 0 -150 Q100 -150 110 0Z", k)}${p("M0 0 L-30 -110 Q0 -120 30 -110Z", shade(k, 0.7))}${ln("M-60 -20 Q-56 -120 0 -150 M60 -20 Q56 -120 0 -150", "#fff", 3)}`, 25],
  baalsted: ["Lejrbål med pinde", "pynt", "#FF8A3C", 120, 120, (k) => L(`${gl(0, -40, 56, 40, "#FFB86B")}${ln("M-40 -6 L40 -20 M-40 -20 L40 -6", "#8B5A3C", 12)}${p("M-24 -16 Q-30 -60 0 -100 Q30 -60 24 -16Z", k)}${p("M-10 -16 Q-14 -40 0 -66 Q14 -40 10 -16Z", "#FFD93D", T3)}${ln("M30 -30 L60 -80", "#C98B55", 4)}${c(62, -84, 7, "#fff", T3)}`), 15],
  campingstol: ["Campingstol", "mob", "#4D96FF", 110, 130, (k) => `${ln("M-40 0 L30 -70 M40 0 L-30 -70", "#9AA4BA", 5)}${r(-40, -76, 80, 16, k, 4)}${r(-36, -126, 72, 50, k, 4)}${ln("M-36 -100 H36", shade(k, 0.75), 3)}`, 15],
  kano: ["Kano", "leg", "#E5484D", 260, 70, (k) => `${p("M-126 -40 Q0 0 126 -40 Q100 -20 0 -16 Q-100 -20 -126 -40Z", k)}${p("M-126 -40 Q0 -54 126 -40", "none")}${ln("M-30 -80 L40 -10", "#C98B55", 6)}${e(40, -10, 8, 14, "#C98B55", 'transform="rotate(-45 40 -10)"')}`, 25],
  stjernehimmel: ["Stjerneplakat", "væg", "#2B2340", 160, 110, (k) => `${r(-76, -106, 152, 106, k, 6)}${rep(7, (i) => star(-56 + ((i * 37) % 112), -86 + ((i * 23) % 72), 6 + (i % 3) * 2, "#FFD93D"))}${c(48, -80, 14, "#FFF3D6", T3)}`, 10],
  /* ---------------------------------------------------------------- Sommerhuset */
  havegynge: ["Havegynge", "mob", "#FFFFFF", 240, 220, (k) => `${ln("M-110 0 L-90 -210 L-70 0 M110 0 L90 -210 L70 0 M-90 -210 H90", k, 8)}<g class="sw s0">${ln("M-50 -210 V-80 M50 -210 V-80", "#9AA4BA", 3)}${r(-66, -86, 132, 18, "#FFB86B", 6)}${r(-66, -130, 132, 46, "#FFB86B", 10)}${rep(3, (i) => c(-40 + i * 40, -108, 10, "#fff", T3))}</g>`, 30],
  hangekurv: ["Picnickurv", "pynt", "#E8C39E", 120, 100, (k) => `${p("M-50 -50 L-40 0 H40 L50 -50Z", k)}${rep(3, (i) => ln(`M-46 ${-40 + i * 12} H46`, shade(k, 0.75), 3))}${p("M-30 -50 Q0 -100 30 -50", "none", 'stroke-width="6"')}${r(-50, -58, 100, 10, "#FF6B6B", 3, T3)}`, 10],
  strandhaandklaede: ["Strandhåndklæde", "leg", "#00BBF9", 240, 50, (k) => `${p("M-110 -10 L-90 -40 H110 L90 -10Z", k)}${rep(4, (i) => p(`M${-86 + i * 50} -10 L${-66 + i * 50} -40 H${-46 + i * 50} L${-66 + i * 50} -10Z`, "#fff", T3))}`, 10, 1],
  sandslot: ["Sandslot", "pynt", "#F2D7A0", 160, 140, (k) => `${r(-70, -60, 140, 60, k, 4)}${rep(3, (i) => r(-66 + i * 48, -110, 36, 54, k, 3))}${rep(3, (i) => p(`M${-66 + i * 48} -110 v-8 h8 v8 h10 v-8 h8 v8`, "none", T3))}${ln("M0 -110 V-136", OL, 3)}${p("M0 -136 l18 6 l-18 6Z", "#FF6B6B", T3)}${r(-10, -34, 20, 34, shade(k, 0.75), 10, T3)}`, 15],
  /* ---------------------------------------------------------------- Hjemme hos os */
  familiebord: ["Familiens spisebord", "mob", "#C98B55", 260, 130, (k) => `${r(-120, -110, 240, 18, k, 6)}${ln("M-100 -92 V0 M100 -92 V0", shade(k, 0.75), 10)}${rep(4, (i) => e(-84 + i * 56, -114, 18, 5, "#fff"))}${e(0, -124, 26, 10, "#FFB86B")}`, 25],
  vaskemaskine2: ["Vaskemaskine", "mob", "#FFFFFF", 130, 150, (k) => `${r(-60, -146, 120, 146, k, 10)}${c(0, -66, 40, "#CFD6E6")}${c(0, -66, 28, "#9FD4FF", T3)}${rep(3, (i) => dot(-40 + i * 16, -128, 5, ["#6BCB77", "#FFD93D", "#FF6B6B"][i]))}`, 20],
  stoevsuger: ["Robotstøvsuger", "leg", "#3A3A55", 100, 40, (k) => `${e(0, -16, 46, 16, k)}${e(0, -22, 30, 8, shade(k, 1.4), T3)}${dot(20, -22, 4, "#6BCB77")}`, 15, 1],
  familietavle: ["Familietavle", "væg", "#FFF3D6", 180, 130, (k) => `${r(-86, -126, 172, 126, "#C98B55", 8)}${r(-76, -116, 152, 106, k, 4, T3)}${rep(4, (i) => r(-66 + i * 36, -104, 28, 34, ["#FF9AB5", "#BFE6FF", "#FFD93D", "#B9E4C9"][i], 2, T3))}${rep(3, (i) => ln(`M-60 ${-56 + i * 14} H${40 - i * 20}`, OL, 3))}${heart(56, -40, 0.6, "#FF6B6B")}`, 10],
  /* ---------------------------------------------------------------- Køkkenhaven */
  drivhus: ["Drivhus", "mob", "#E8F6FF", 220, 200, (k) => `${p("M-100 0 V-120 L0 -190 L100 -120 V0Z", k, 'fill-opacity=".75"')}${ln("M-50 0 V-150 M0 0 V-190 M50 0 V-150 M-100 -60 H100", "#fff", 5)}${rep(3, (i) => leaf(-70 + i * 54, -20, -60, "#6BCB77", 0.8))}${c(56, -30, 12, "#FF6B6B", T3)}`, 30],
  hoejbed: ["Højbed med grønt", "mob", "#C98B55", 220, 110, (k) => `${r(-100, -60, 200, 60, k, 4)}${ln("M-100 -30 H100", shade(k, 0.75), 3)}${e(0, -62, 96, 8, "#8B5A3C")}${rep(5, (i) => `${leaf(-80 + i * 40, -66, -70, "#6BCB77", 0.6)}${leaf(-80 + i * 40, -66, -110, "#4CAF50", 0.6)}`)}${c(-40, -84, 8, "#FF6B6B", T3)}${c(40, -84, 8, "#FF8A3C", T3)}`, 20],
  vandkande2: ["Havekande", "leg", "#6BCB77", 120, 90, (k) => `${p("M-40 -70 H30 L36 0 H-46Z", k)}${ln("M30 -50 L70 -84", k, 10)}${ln("M30 -50 L70 -84", OL, 2)}${e(72, -86, 10, 6, shade(k, 0.8))}${p("M-40 -60 q-30 10 -6 40", "none", 'stroke-width="6"')}`, 10],
  fugleskraemsel: ["Fugleskræmsel", "pynt", "#FFD93D", 140, 260, (k) => `${ln("M0 0 V-240 M-60 -170 H60", "#C98B55", 8)}${p("M-50 -180 H50 L40 -100 H-40Z", "#4D96FF")}${c(0, -206, 26, "#F2D7A0")}${p("M-34 -216 H34 L20 -246 H-20Z", k)}${p("M-6 -204 q6 6 12 0", "none", T3)}${dot(-10, -210, 3, OL)}${dot(10, -210, 3, OL)}`, 15],
  /* ---------------------------------------------------------------- Helteakademiet */
  heltekappe: ["Heltekappe på bøjle", "væg", "#E5484D", 120, 170, (k) => `${p("M-10 -160 q10 -10 20 0", "none", 'stroke-width="5"')}${ln("M-40 -150 H40", "#9AA4BA", 6)}${p("M-36 -150 Q-60 -40 -50 -10 Q0 4 50 -10 Q60 -40 36 -150Z", k)}${star(0, -90, 18, "#FFD93D")}`, 15],
  traeningsbane: ["Forhindringsbane", "leg", "#FF8A3C", 280, 120, (k) => `${rep(3, (i) => `${ln(`M${-120 + i * 90} 0 V-80 M${-80 + i * 90} 0 V-80`, OL, 5)}${r(-124 + i * 90, -90, 52, 14, i % 2 ? "#4D96FF" : k, 4, T3)}`)}${e(110, -10, 30, 10, "#FFD93D")}`, 25],
  heltemaske: ["Maskevæg", "væg", "#9B5DE5", 180, 100, (k) => `${rep(3, (i) => p(`M${-80 + i * 56} -60 q24 -20 48 0 q-4 20 -12 20 q-8 -12 -24 0 q-8 0 -12 -20Z`, [k, "#E5484D", "#00BBF9"][i], T3))}${rep(3, (i) => `${dot(-66 + i * 56, -56, 4, "#fff")}${dot(-46 + i * 56, -56, 4, "#fff")}`)}`, 10],
  heltepokal: ["Heltepokal", "pynt", "#E9C46A", 90, 140, (k) => `${r(-30, -20, 60, 20, "#3A3A55", 4)}${ln("M0 -20 V-50", k, 10)}${p("M-36 -120 H36 Q36 -60 0 -54 Q-36 -60 -36 -120Z", k)}${p("M-36 -110 q-22 0 -16 24 q6 10 18 8 M36 -110 q22 0 16 24 q-6 10 -18 8", "none")}${star(0, -94, 14, "#fff")}`, 20],
  /* ---------------------------------------------------------------- Den hemmelige base */
  kontrolpanel: ["Kontrolpanel", "mob", "#3A3A55", 240, 150, (k) => `${r(-110, -80, 220, 80, k, 8)}${r(-100, -146, 200, 70, "#2B2340", 8)}${r(-90, -138, 84, 54, "#00BBF9", 4, T3)}${r(6, -138, 84, 54, "#6BCB77", 4, T3)}${ln("M-80 -110 l20 -14 l20 20 l20 -24", "#fff", 3)}${rep(6, (i) => dot(-90 + i * 34, -50, 8, ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#F15BB5", "#FF8A3C"][i]))}`, 30],
  hemmeligdoer: ["Bogreol med lem", "mob", "#8B5A3C", 160, 260, (k) => `${r(-76, -256, 152, 256, k, 6)}${rep(4, (i) => ln(`M-76 ${-194 + i * 62} H76`, shade(k, 0.7), 6))}${rep(4, (i) => rep(5, (j) => r(-68 + j * 28, -250 + i * 62, 20, 50, ["#FF6B6B", "#4D96FF", "#FFD93D", "#6BCB77", "#9B5DE5"][(i + j) % 5], 2, T3)))}${c(50, -130, 8, "#FFD93D", T3)}`, 25],
  periskop: ["Periskop", "leg", "#6BCB77", 80, 220, (k) => `${r(-14, -180, 28, 180, k, 6)}${r(-14, -210, 54, 30, k, 6)}${r(26, -206, 14, 22, "#BFE6FF", 3, T3)}${r(-30, -30, 60, 30, shade(k, 0.75), 6)}`, 15],
  kodekort: ["Hemmeligt kort", "væg", "#F2D7A0", 180, 130, (k) => `${p("M-84 -120 L-30 -126 L30 -116 L84 -124 V-10 L30 -4 L-30 -14 L-84 -6Z", k)}${p("M-60 -90 q30 30 60 0 q20 -20 40 10", "none", 'stroke="#E5484D" stroke-width="4" stroke-dasharray="8 8"')}${p("M40 -76 l12 12 M52 -76 l-12 12", "none", 'stroke="#E5484D" stroke-width="5"')}`, 10],
  /* ---------------------------------------------------------------- Opfinderværkstedet */
  opfinderbord: ["Opfinderbord", "mob", "#C98B55", 240, 170, (k) => `${r(-110, -100, 220, 16, k, 4)}${ln("M-96 -84 V0 M96 -84 V0", shade(k, 0.75), 10)}${c(-60, -120, 20, "#FFD93D")}${ln("M-60 -140 V-160", OL, 3)}${rep(3, (i) => c(10 + i * 26, -116, 12, "#9AA4BA", T3))}${p("M70 -104 L80 -160 L94 -104Z", "#9FD4FF", T3)}`, 25],
  tandhjul: ["Tandhjulsur", "væg", "#E9C46A", 150, 130, (k) => `${c(-30, -66, 40, k)}${c(-30, -66, 14, "#fff", T3)}${rep(8, (i) => r(-36 + Math.cos(i * 0.785) * 44, -72 + Math.sin(i * 0.785) * 44, 12, 12, k, 2, T3))}${c(40, -86, 26, "#CFD6E6")}${c(40, -86, 8, "#fff", T3)}`, 15],
  lynmaskine: ["Lynmaskine", "lys", "#9B5DE5", 120, 200, (k) => L(`${gl(0, -150, 50, 50, "#E0C3FF")}${r(-40, -40, 80, 40, "#3A3A55", 6)}${ln("M-20 -40 V-120 M20 -40 V-120", "#9AA4BA", 6)}${c(-20, -130, 14, k, T3)}${c(20, -130, 14, k, T3)}${p("M-6 -160 L6 -150 L-4 -144 L8 -130", "none", 'stroke="#FFD93D" stroke-width="5"')}`), 25],
  raketstoevle: ["Raketsko", "leg", "#FF6B6B", 120, 80, (k) => `${p("M-50 -20 V-60 H-10 V-40 H40 Q56 -40 56 -20Z", k)}${r(-56, -22, 116, 14, "#fff", 6, T3)}${p("M-50 -8 l-8 20 l16 -10 l8 16 l6 -26", "#FFB86B", T3)}`, 15],
  /* ---------------------------------------------------------------- Kosmiske helte */
  planetring: ["Planetlampe med ring", "lys", "#9B5DE5", 160, 160, (k) => L(`${gl(0, -80, 70, 60, "#E0C3FF")}${c(0, -80, 46, k)}${e(0, -80, 76, 16, "none", 'stroke="#FFD93D" stroke-width="7"')}${dot(-16, -96, 6, shade(k, 1.3))}${ln("M0 -34 V0", OL, 5)}`), 25],
  stjernekappe: ["Stjernekappe", "væg", "#2B2340", 120, 170, (k) => `${ln("M-40 -150 H40", "#9AA4BA", 6)}${p("M-36 -150 Q-60 -40 -50 -10 Q0 4 50 -10 Q60 -40 36 -150Z", k)}${rep(6, (i) => star(-30 + (i % 3) * 30, -120 + Math.floor(i / 3) * 50, 8, "#FFD93D"))}`, 15],
  meteor: ["Meteor-sækkestol", "mob", "#FF8A3C", 160, 110, (k) => `${p("M-70 -40 Q-90 -100 -20 -100 Q60 -96 70 -40 Q60 0 0 0 Q-60 0 -70 -40Z", k)}${rep(3, (i) => c(-30 + i * 30, -60 + (i % 2) * 14, 10, shade(k, 0.75), T3))}`, 20],
  rumkapsel: ["Rumkapsel-seng", "mob", "#E8F6FF", 300, 150, (k) => `${p("M-140 -20 Q-140 -120 0 -130 Q140 -120 140 -20Z", k)}${r(-140, -26, 280, 26, "#9AA4BA", 8)}${e(-20, -86, 60, 30, "#9FD4FF", T3)}${dot(90, -60, 8, "#6BCB77")}${dot(110, -60, 8, "#FF6B6B")}`, 30],
  /* ---------------------------------------------------------------- Magiskolen */
  troldmandsbord: ["Tryllebord", "mob", "#9B5DE5", 220, 140, (k) => `${r(-100, -100, 200, 100, k, 6)}${rep(4, (i) => star(-76 + i * 50, -50, 10, "#FFD93D"))}${p("M-30 -100 H30 L20 -140 H-20Z", "#2B2340")}${e(0, -100, 40, 6, "#2B2340")}${c(60, -114, 14, "#BFE6FF", 'fill-opacity=".8"')}`, 20],
  krystalkugle: ["Krystalkugle", "lys", "#E0C3FF", 100, 130, (k) => L(`${gl(0, -70, 50, 50, "#E0C3FF")}${p("M-30 0 L-20 -24 H20 L30 0Z", "#8B5A3C")}${c(0, -64, 40, k, 'fill-opacity=".85"')}${dot(-14, -80, 7, "#fff")}${star(10, -56, 8, "#fff")}`), 20],
  tryllebog: ["Tryllebog på pult", "pynt", "#E5484D", 120, 150, (k) => `${ln("M0 0 V-90", "#8B5A3C", 8)}${p("M-50 -100 L0 -90 L50 -100 L50 -130 L0 -120 L-50 -130Z", "#FFF3D6")}${ln("M0 -90 V-120", OL, 3)}${p("M-50 -100 L-56 -96 L0 -86 L56 -96 L50 -100", k)}${rep(2, (i) => star(-26 + i * 52, -144 - i * 8, 7, "#FFD93D"))}`, 15],
  kost: ["Flyvekost", "leg", "#C98B55", 200, 60, (k) => `${ln("M-90 -36 L40 -30", k, 9)}${ln("M-90 -36 L40 -30", OL, 2)}${p("M40 -40 L96 -54 L100 -10 L40 -20Z", "#FFD93D")}${ln("M50 -30 L96 -40 M50 -26 L98 -24", shade("#FFD93D", 0.8), 3)}`, 15],
  stjernestav: ["Tryllestav-holder", "pynt", "#F15BB5", 80, 160, (k) => `${p("M-24 0 L-20 -50 H20 L24 0Z", k)}${rep(3, (i) => `${ln(`M${-10 + i * 10} -50 L${-20 + i * 20} -130`, "#8B5A3C", 4)}${star(-20 + i * 20, -136, 10, ["#FFD93D", "#fff", "#BFE6FF"][i])}`)}`, 10],
};

/* The new packs. */
export const PACKS3 = [
  { id: "kage", n: "Kageværkstedet", em: "🧁", lvl: 1, d: "Ovn, røreskål, bagebord og en høj lagkage.", items: ["bageovn", "roerepind", "lagkageopsats", "kagerulle", "kokkehue"] },
  { id: "slikriget", n: "Slikriget", em: "🍭", lvl: 2, d: "Slikautomat, slikstokke og en skumfidussofa.", items: ["slikmaskine", "slikstok", "lollipoptrae", "gummibamse", "skumfidussofa"] },
  { id: "miniature", n: "Miniaturehuset", em: "🏘️", lvl: 2, d: "Minikøkken, små naboer og en bilbane.", items: ["minikokken", "mininaboer", "minibil", "rulletrappe"] },
  { id: "kawaii", n: "Søde dyrevenner", em: "🐼", lvl: 1, d: "Kattepude, plyshvalp, pandakøje og en søvnig sky.", items: ["kattepude", "hvalpbamse", "pandaslag", "froepude", "sky"] },
  { id: "gavebutik", n: "Gavebutikken", em: "🎁", lvl: 2, d: "Hylder med gaver, kort og sløjfer.", items: ["gavehylde", "gaveaesker", "kortstativ", "sloejfekasse"] },
  { id: "teselskab", n: "Teselskabet", em: "🫖", lvl: 1, d: "Tebord, kageetagere og lyskæde med hjerter.", items: ["tebord", "etagere", "blomstervase", "festlys"] },
  { id: "vandland", n: "Vandlandet", em: "💦", lvl: 3, d: "Rutsjebane, soppebassin og vandkanon.", items: ["vandrutsjebane", "badering", "bassin", "vandpistol", "solskaerm"] },
  { id: "isbod", n: "Isboden", em: "🍦", lvl: 1, d: "Isvogn, softice og en kæmpe isvaffel.", items: ["isvogn", "isvaffel", "isskilt", "softice"] },
  { id: "dyreklinik", n: "Dyreklinikken", em: "🩺", lvl: 2, d: "Dyrlægebord, taske, seng og foder.", items: ["undersoegelsesbord", "dyrlaegetaske", "kaeledyrsseng", "foderskab"] },
  { id: "camping", n: "Campingturen", em: "⛺", lvl: 2, d: "Telt, lejrbål, kano og stjerner.", items: ["telt", "baalsted", "campingstol", "kano", "stjernehimmel"] },
  { id: "sommerhus", n: "Sommerhuset", em: "🏖️", lvl: 3, d: "Havegynge, picnickurv, håndklæde og sandslot.", items: ["havegynge", "hangekurv", "strandhaandklaede", "sandslot"] },
  { id: "hverdag", n: "Hjemme hos os", em: "🏠", lvl: 1, d: "Spisebord, vaskemaskine, robotstøvsuger og familietavle.", items: ["familiebord", "vaskemaskine2", "stoevsuger", "familietavle"] },
  { id: "koekkenhave", n: "Køkkenhaven", em: "🥕", lvl: 2, d: "Drivhus, højbed, havekande og fugleskræmsel.", items: ["drivhus", "hoejbed", "vandkande2", "fugleskraemsel"] },
  { id: "helte", n: "Helteakademiet", em: "🦸", lvl: 3, d: "Kappe, forhindringsbane, masker og pokal.", items: ["heltekappe", "traeningsbane", "heltemaske", "heltepokal"] },
  { id: "base", n: "Den hemmelige base", em: "🕵️", lvl: 4, d: "Kontrolpanel, bogreol med lem og et hemmeligt kort.", items: ["kontrolpanel", "hemmeligdoer", "periskop", "kodekort"] },
  { id: "opfinder", n: "Opfinderværkstedet", em: "⚙️", lvl: 4, d: "Opfinderbord, tandhjul, lynmaskine og raketsko.", items: ["opfinderbord", "tandhjul", "lynmaskine", "raketstoevle"] },
  { id: "kosmisk", n: "Kosmiske helte", em: "🌌", lvl: 5, d: "Planetlampe, stjernekappe, meteor og rumkapsel.", items: ["planetring", "stjernekappe", "meteor", "rumkapsel"] },
  { id: "magi", n: "Magiskolen", em: "🪄", lvl: 5, d: "Tryllebord, krystalkugle, tryllebog og flyvekost.", items: ["troldmandsbord", "krystalkugle", "tryllebog", "kost", "stjernestav"] },
];

/* English names (the panel's English mode looks names up by their Danish text). */
export const PACKS3_EN = {
  Bageovn: "Oven", "Røreskål": "Mixing bowl", Kageopsats: "Cake stand", Bagebord: "Baking table", "Kokkehue på knag": "Chef's hat on a hook",
  Slikautomat: "Sweet machine", "Kæmpe slikstok": "Giant candy cane", "Slikkepindetræ": "Lollipop tree", Vingummibamse: "Gummy bear", Skumfidussofa: "Marshmallow sofa",
  "Minikøkken": "Mini kitchen", Mininaboer: "Tiny neighbours", "Lille bilbane": "Little car track", "Legetøjselevator": "Toy lift",
  Kattepude: "Cat cushion", Plyshvalp: "Plush puppy", "Pandahængekøje": "Panda hammock", "Frøpude": "Frog cushion", "Søvnig sky-lampe": "Sleepy cloud lamp",
  Gavehylde: "Gift shelf", Gavestak: "Pile of presents", Kortstativ: "Card stand", "Sløjfekurv": "Bow basket",
  Tebord: "Tea table", Kageetagere: "Cake tiers", Blomstervase: "Flower vase", "Lyskæde med hjerter": "Heart lights",
  Vandrutsjebane: "Water slide", Badering: "Swim ring", Soppebassin: "Paddling pool", Vandkanon: "Water blaster", Parasol: "Sunshade",
  Isvogn: "Ice cream van", "Kæmpe isvaffel": "Giant ice cream cone", Isskilt: "Ice cream sign", Softicemaskine: "Soft serve machine",
  "Dyrlægebord": "Vet's table", "Dyrlægetaske": "Vet's bag", "Kæledyrsseng": "Pet bed", Foderhylde: "Pet food shelf",
  Kuppeltelt: "Dome tent", "Lejrbål med pinde": "Campfire", Campingstol: "Camping chair", Kano: "Canoe", Stjerneplakat: "Star poster",
  Havegynge: "Garden swing", Picnickurv: "Picnic basket", "Strandhåndklæde": "Beach towel", Sandslot: "Sandcastle",
  "Familiens spisebord": "Family dinner table", Vaskemaskine: "Washing machine", "Robotstøvsuger": "Robot vacuum", Familietavle: "Family board",
  Drivhus: "Greenhouse", "Højbed med grønt": "Raised bed", Havekande: "Watering can", "Fugleskræmsel": "Scarecrow",
  "Heltekappe på bøjle": "Hero cape", Forhindringsbane: "Obstacle course", "Maskevæg": "Mask wall", Heltepokal: "Hero trophy",
  Kontrolpanel: "Control panel", "Bogreol med lem": "Secret bookcase", Periskop: "Periscope", "Hemmeligt kort": "Secret map",
  Opfinderbord: "Inventor's desk", "Tandhjulsur": "Gear clock", Lynmaskine: "Lightning machine", Raketsko: "Rocket shoes",
  "Planetlampe med ring": "Ringed planet lamp", Stjernekappe: "Star cape", "Meteor-sækkestol": "Meteor beanbag", "Rumkapsel-seng": "Space pod bed",
  Tryllebord: "Magic table", Krystalkugle: "Crystal ball", "Tryllebog på pult": "Spell book on a stand", Flyvekost: "Flying broom", "Tryllestav-holder": "Wand holder",
  "Kageværkstedet": "Bake shop", Slikriget: "Sweet kingdom", Miniaturehuset: "Miniature house", "Søde dyrevenner": "Cute animal friends", Gavebutikken: "Gift shop",
  Teselskabet: "Tea party", Vandlandet: "Water park", Isboden: "Ice cream stand", Dyreklinikken: "Animal clinic", Campingturen: "Camping trip",
  Sommerhuset: "Summer house", "Hjemme hos os": "At our home", "Køkkenhaven": "Vegetable garden", Helteakademiet: "Hero academy",
  "Den hemmelige base": "The secret base", "Opfinderværkstedet": "Inventor's workshop", "Kosmiske helte": "Cosmic heroes", Magiskolen: "Magic school",
  "Ovn, røreskål, bagebord og en høj lagkage.": "Oven, mixing bowl, baking table and a tall layer cake.",
  "Slikautomat, slikstokke og en skumfidussofa.": "Sweet machine, candy canes and a marshmallow sofa.",
  "Minikøkken, små naboer og en bilbane.": "Mini kitchen, tiny neighbours and a car track.",
  "Kattepude, plyshvalp, pandakøje og en søvnig sky.": "Cat cushion, plush puppy, panda hammock and a sleepy cloud.",
  "Hylder med gaver, kort og sløjfer.": "Shelves of presents, cards and bows.",
  "Tebord, kageetagere og lyskæde med hjerter.": "Tea table, cake tiers and heart lights.",
  "Rutsjebane, soppebassin og vandkanon.": "Water slide, paddling pool and water blaster.",
  "Isvogn, softice og en kæmpe isvaffel.": "Ice cream van, soft serve and a giant cone.",
  "Dyrlægebord, taske, seng og foder.": "Vet's table, bag, bed and pet food.",
  "Telt, lejrbål, kano og stjerner.": "Tent, campfire, canoe and stars.",
  "Havegynge, picnickurv, håndklæde og sandslot.": "Garden swing, picnic basket, towel and sandcastle.",
  "Spisebord, vaskemaskine, robotstøvsuger og familietavle.": "Dinner table, washing machine, robot vacuum and family board.",
  "Drivhus, højbed, havekande og fugleskræmsel.": "Greenhouse, raised bed, watering can and scarecrow.",
  "Kappe, forhindringsbane, masker og pokal.": "Cape, obstacle course, masks and trophy.",
  "Kontrolpanel, bogreol med lem og et hemmeligt kort.": "Control panel, a secret bookcase and a secret map.",
  "Opfinderbord, tandhjul, lynmaskine og raketsko.": "Inventor's desk, gears, lightning machine and rocket shoes.",
  "Planetlampe, stjernekappe, meteor og rumkapsel.": "Planet lamp, star cape, meteor and space pod.",
  "Tryllebord, krystalkugle, tryllebog og flyvekost.": "Magic table, crystal ball, spell book and flying broom.",
};
