/* Hverdagsro – hand-drawn children's rooms. A room in Husbyggeren can pick one of these drawings instead of the
   one drawn from its type. Each drawing has places for its lamps; the room's real lights are put in them by name
   (or as chosen in the room's "lamps"), and a place without a light is drawn as an ordinary, unlit lamp. */
import { mixHex, prng } from "./hv-core.js";

let P3, sc3, pt3, poly3, ln3, qLeft, qRight, box3, shell3, window3, beam3, panthella3, ceilingDisc3, lampAttrs;
const qFloor = (u0, u1, t0, t1, v = 0) => [P3(u0, t0, v), P3(u1, t0, v), P3(u1, t1, v), P3(u0, t1, v)];
const fpath = (pts) => "M" + pts.map(([u, t]) => pt3(P3(u, t, 0))).join(" L") + "Z";
const pan = (u, t, v, attrs, big = 1) => panthella3(u, t, v, "__A__", "__K__", big).replace(lampAttrs("__K__", "__A__"), attrs);
const disc = (u, t, attrs) => ceilingDisc3(u, t, "__A__", "__K__").replace(lampAttrs("__K__", "__A__"), attrs);

function drawStudio(k, W) {
  let s = shell3({ k, ceil: "#E3DCD2", ceil2: "#D2C9BD", floor: "#B07E4F", floor2: "#C99A68", left: "#6F6367", right: "#F1EDE8", back: "#EEE9E4", plank: "rgba(90,55,25,.28)", seam: "rgba(120,110,95,.35)", seed: 5 });
  s += `<defs><pattern id="${k}-str" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(-24)"><rect width="9" height="9" fill="#fff"/><rect width="4.5" height="9" fill="#E5414B"/></pattern></defs>`;
  // billeder på den mørke væg
  [[.5, .6, .5, .66, "#F4EFE9"], [.63, .7, .58, .76, "#F8E4E8"], [.73, .8, .5, .66, "#EDE7DF"], [.6, .66, .4, .53, "#F3E8DC"], [.82, .86, .42, .52, "#fff"], [.44, .52, .36, .48, "#E8E2DA"]].forEach(([a, b, c, d, f]) => { s += poly3(qLeft(a, b, c, d), "#1E1A1C") + poly3(qLeft(a + .008, b - .008, c + .015, d - .015), f); });
  s += `<path d="M${pt3(P3(0, .78, .82))} Q${pt3(P3(.07, .9, .76))} ${pt3(P3(.14, 1, .82))}" fill="none" stroke="#F4EEE6" stroke-width="2.4" stroke-dasharray="3 2"/>`;
  [[.035, .84, .775, "#fff"], [.075, .92, .755, "#F4C6D6"], [.11, .985, .775, "#fff"]].forEach(([u, t, v, c]) => { const [x, y] = P3(u, t, v); s += `<circle cx="${x.toFixed(1)}" cy="${(y + 4).toFixed(1)}" r="${(4.6 * sc3(t)).toFixed(1)}" fill="${c}"/>`; });
  // reol i hjørnet
  s += box3(.02, .1, .9, .99, 0, .66, "#F2EDE6", "#E9E3DB", "#D9D2C8");
  [.16, .3, .44, .58].forEach((v, i) => { s += poly3([P3(.02, .9, v), P3(.1, .9, v), P3(.1, .99, v), P3(.02, .99, v)], "#D8B98E"); const [x, y] = P3(.06, .945, v); s += `<rect x="${(x - 5).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="${4 + i}" height="8" fill="${["#E4568C", "#3B82F6", "#F59E0B", "#10B981"][i]}"/>`; });
  // vindue, Panthella og plante
  s += window3(.3, .86, .37, .78, k, W);
  s += box3(.6, .65, .975, .99, .38, .42, "#7D7F86", null, "#6D6F75") + `<path d="M${pt3(P3(.625, .985, .42))} c-6,-10 -2,-18 4,-20 M${pt3(P3(.625, .985, .42))} c4,-8 10,-12 14,-10 M${pt3(P3(.625, .985, .42))} c-2,-12 -10,-16 -14,-12" stroke="#7A2E57" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // sovesofa med rød-hvid dyne og bamser
  s += box3(0, .44, .26, .72, 0, .17, "#7A7B80", "#86878C", "#6B6C70");
  s += box3(0, .07, .26, .9, 0, .34, "#808186", "#8E8F94", "#717277");
  s += box3(0, .44, .72, .9, 0, .3, "#7E7F84", "#8C8D92", "#6E6F74");
  s += poly3([P3(.05, .28, .18), P3(.42, .28, .18), P3(.42, .7, .18), P3(.07, .7, .18)], `url(#${k}-str)`) + poly3([P3(.05, .28, .18), P3(.42, .28, .18), P3(.42, .28, .06), P3(.05, .28, .05)], `url(#${k}-str)`);
  s += poly3([P3(.07, .5, .185), P3(.2, .5, .185), P3(.2, .66, .185), P3(.07, .66, .185)], "#F7F3EE");
  [[.25, .45, "#E04FA0", 7], [.32, .4, "#9C8B78", 6], [.14, .38, "#F2EDE6", 8]].forEach(([u, t, c, r]) => { const [x, y] = P3(u, t, .18); s += `<ellipse cx="${x.toFixed(1)}" cy="${(y - r * .55).toFixed(1)}" rx="${r * 1.3}" ry="${r * .75}" fill="${c}"/>`; });
  { const [x, y0] = P3(.5, .4, 0), y = y0 - 13; s += `<ellipse cx="${x}" cy="${y0}" rx="18" ry="4" fill="rgba(0,0,0,.18)"/><g class="rm-cow"><ellipse cx="${x}" cy="${y}" rx="17" ry="14" fill="#F5F2EE"/><path d="M${x - 14},${y - 4} q6,-10 14,-6 q-2,8 -12,10z M${x + 4},${y + 3} q8,-4 12,2 q-4,8 -12,4z" fill="#1E1C1E"/><ellipse cx="${x + 2}" cy="${y + 6}" rx="7" ry="4.5" fill="#F3C9CF"/></g>`; }
  // skrivebord, skuffer, skærm, stol
  s += box3(.42, 1, .82, .99, .27, .3, "#F7F5F2", "#FFFFFF", "#E6E2DD");
  s += box3(.43, .53, .83, .97, 0, .27, "#F4F2EF", null, "#E4E0DA");
  for (let v = .04; v < .26; v += .045) s += ln3(P3(.43, .83, v), P3(.53, .83, v), "#D4CFC8", .8);
  s += box3(.86, 1, .45, .83, 0, .3, "#EEEAE5", "#DCD8D3", "#E0DCD6");
  s += box3(.7, .84, .95, .96, .31, .47, "#1E1F24", null, "#2B2C31") + poly3([P3(.765, .955, .3), P3(.775, .955, .3), P3(.775, .955, .31), P3(.765, .955, .31)], "#2B2C31");
  { const [x, y] = P3(.62, .66, .24), sx = sc3(.66); s += `<g><path d="M${x},${y + 8 * sx} v${24 * sx}" stroke="#DCD8D2" stroke-width="${3 * sx}"/><path d="M${x - 14 * sx},${y + 34 * sx} h${28 * sx}" stroke="#E8E4DE" stroke-width="${2.5 * sx}"/><path d="M${x - 15 * sx},${y - 10 * sx} a${15 * sx},${13 * sx} 0 0 0 ${30 * sx},0 v-6 h-${30 * sx}z" fill="#F7F5F2"/></g>`; }
  [[.6, .9, "#2C2E35"], [.47, .9, "#E2D2C0"]].forEach(([u, t, c]) => { s += box3(u, u + .06, t, t + .05, .3, .36, c, mixHex(c, "#FFFFFF", .2), mixHex(c, "#000000", .15)); }); s += box3(.88, .95, .62, .7, .3, .38, "#E4568C", "#EE86AE", "#C94477");
  // hylder og spejlskab på højre væg
  [.62, .74].forEach(v => { s += poly3([P3(1, .58, v), P3(1, .92, v), P3(.95, .92, v), P3(.95, .58, v)], "#FFFFFF"); });
  [[.64, "#F2A9BF"], [.72, "#7FB9E8"], [.8, "#F5D08A"], [.88, "#C9A4E8"]].forEach(([t, c], i) => { const v = .62 + (i % 2) * .12, [x, y] = P3(.975, t, v); s += `<rect x="${(x - 3).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="6" height="8" rx="1.5" fill="${c}"/>`; });
  s += poly3(qRight(.36, .52, .44, .82), "#FFFFFF") + poly3(qRight(.38, .5, .48, .78), "#DCE6EE");
  // rundt bord forrest
  s += `<ellipse cx="96" cy="262" rx="74" ry="22" fill="#F7F5F2"/><ellipse cx="96" cy="258" rx="70" ry="19" fill="#FFFFFF"/><g fill="#7DA36B"><circle cx="86" cy="250" r="5"/><circle cx="94" cy="248" r="4"/></g><rect x="84" y="251" width="12" height="6" rx="2" fill="#E8E1D8"/>`;
  return s;
}
function lampsStudio(k, L) {
  const [lx, ly] = P3(.47, .56, .76), r = 15 * sc3(.56), [cx0, cy0] = P3(.47, .56, 1);
  let petals = ""; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; petals += `<circle class="rm-shade" cx="${(lx + Math.cos(a) * r * .82).toFixed(1)}" cy="${(ly + Math.sin(a) * r * .82).toFixed(1)}" r="${(r * .36).toFixed(1)}" fill="#ECE8E2"/>`; }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .3; petals += `<circle class="rm-shade" cx="${(lx + Math.cos(a) * r * .42).toFixed(1)}" cy="${(ly + Math.sin(a) * r * .42).toFixed(1)}" r="${(r * .34).toFixed(1)}" fill="#F2EEE9"/>`; }
  let s = `<g class="rm-sway" style="transform-origin:${cx0}px ${cy0}px">${ln3([cx0, cy0], [lx, ly - r], "#DCD6CE", 1.1)}<g ${L("loft")}><circle cx="${lx}" cy="${ly}" r="${r * 1.7}" fill="transparent"/><circle class="rm-shade" cx="${lx}" cy="${ly}" r="${r}" fill="#E6E1DA"/>${petals}</g></g>`;
  s += pan(.36, .985, .38, L("panthella"));
  { const a = P3(.55, .83, .262), b = P3(.98, .83, .262); s += `<g ${L("strip")}><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="transparent" stroke-width="16"/><line class="rm-shade rm-strip" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#D9D4CC" stroke-width="2.2" stroke-linecap="round"/></g>`; }
  s += pan(.92, .66, .3, L("mini"), .72);
  return s;
}
function glowsStudio(k, H) {
  const [lx, ly] = P3(.47, .56, .76), [px, py] = P3(.36, .985, .48), [mx, my] = P3(.92, .66, .38);
  return beam3(k, .3, .86, .37) + H("loft", lx, ly, 80, [...P3(.47, .55, 0), 140, 34]) + H("panthella", px, py, 44, [...P3(.36, .99, .36), 40, 9]) + H("strip", ...P3(.75, .86, .1), 70, [...P3(.75, .8, 0), 110, 16]) + H("mini", mx, my, 34, null);
}

function drawRacer(k, W) {
  let s = shell3({ k, ceil: "#E6E0D6", ceil2: "#D6CEC2", floor: "#A9784A", floor2: "#C6935F", left: "#ECE7E1", right: "#F3EEE8", back: "#F4EFE9", low: "#3F5B62", lowBack: [.5], plank: "rgba(90,55,25,.28)", seam: "rgba(120,110,95,.35)", seed: 9 });
  // vindue med Panthella-plads, Miffy og plante
  s += window3(.12, .5, .37, .8, k, W);
  { const [x, y] = P3(.43, .985, .38), sx = sc3(.985); s += `<g><ellipse cx="${x}" cy="${y - 9 * sx}" rx="${6 * sx}" ry="${8 * sx}" fill="#FBFAF7"/><ellipse cx="${x - 2.4 * sx}" cy="${y - 20 * sx}" rx="${1.8 * sx}" ry="${5 * sx}" fill="#FBFAF7"/><ellipse cx="${x + 2.4 * sx}" cy="${y - 20 * sx}" rx="${1.8 * sx}" ry="${5 * sx}" fill="#FBFAF7"/><circle cx="${x - 2 * sx}" cy="${y - 11 * sx}" r=".9" fill="#333"/><circle cx="${x + 2 * sx}" cy="${y - 11 * sx}" r=".9" fill="#333"/></g>`; }
  { const [x, y] = P3(.31, .985, .38); s += `<rect x="${x - 4}" y="${y - 6}" width="8" height="6" rx="1.5" fill="#8C8F95"/><g fill="#79B34F"><circle cx="${x - 3}" cy="${y - 9}" r="3.4"/><circle cx="${x + 3}" cy="${y - 10}" r="3.2"/><circle cx="${x}" cy="${y - 13}" r="3.4"/></g>`; }
  // væghylder i træ
  s += ln3(P3(.55, 1, .58), P3(.55, 1, .86), "#6B4A2B", 1.6) + ln3(P3(.66, 1, .58), P3(.66, 1, .86), "#6B4A2B", 1.6);
  [.62, .76].forEach(v => { s += poly3([P3(.545, 1, v), P3(.665, 1, v), P3(.665, .975, v), P3(.545, .975, v)], "#7A5636"); });
  { const [x, y] = P3(.58, .99, .76); s += `<rect x="${x - 6}" y="${y - 14}" width="12" height="14" fill="#2F6FB7" rx="1"/><rect x="${x - 4}" y="${y - 12}" width="8" height="8" fill="#9ED0F0"/>`; }
  // bogreol på højre væg
  [.62, .7].forEach(v => s += poly3([P3(1, .75, v), P3(1, .95, v), P3(.96, .95, v), P3(.96, .75, v)], "#3B3F45"));
  [[.78, "#E9B949"], [.83, "#5CA3D9"], [.88, "#E46E5B"], [.92, "#7DC383"]].forEach(([t, c]) => { const [x, y] = P3(.975, t, .7); s += `<rect x="${x - 3}" y="${y - 12}" width="7" height="12" fill="${c}"/>`; });
  // juniorseng og bamsestol
  s += box3(.52, .77, .86, .99, 0, .17, "#F7F6F3", "#FFFFFF", "#E5E2DD");
  s += box3(.52, .77, .97, .99, .17, .33, "#FBFAF8", null, "#E8E5E0");
  for (let u = .54; u < .76; u += .025) s += ln3(P3(u, .97, .2), P3(u, .97, .31), "#DAD6D0", .7);
  s += poly3([P3(.55, .88, .175), P3(.74, .88, .175), P3(.74, .96, .175), P3(.55, .96, .175)], "#E9E1D3");
  s += box3(.78, .95, .84, .97, .06, .17, "#EFE8DC", "#F6F0E6", "#E2DACC");
  { const [x, y] = P3(.865, .97, .27), sx = sc3(.97); s += `<path d="M${x - 30 * sx},${y + 16 * sx} v-${18 * sx} a${30 * sx},${26 * sx} 0 0 1 ${60 * sx},0 v${18 * sx}z" fill="#F3ECE0"/>`; s += ln3(P3(.8, .86, 0), P3(.8, .86, .06), "#B48A5A", 1.2) + ln3(P3(.93, .86, 0), P3(.93, .86, .06), "#B48A5A", 1.2); }
  // vejtæppe med veje og magnetbrikker
  s += poly3(qFloor(.26, .8, .12, .62), "#E3E0DA");
  s += `<path d="${fpath([[.33, .2], [.7, .2], [.72, .5], [.36, .55]])}" fill="none" stroke="#9B9C9F" stroke-width="5" stroke-linejoin="round"/><path d="${fpath([[.33, .2], [.7, .2], [.72, .5], [.36, .55]])}" fill="none" stroke="#fff" stroke-width=".8" stroke-dasharray="3 3"/>`;
  s += `<path d="M${pt3(P3(.5, .2, 0))} L${pt3(P3(.53, .52, 0))}" stroke="#9B9C9F" stroke-width="4"/>`;
  const mc = ["#E5484D", "#F2B01E", "#3B82F6", "#10B981", "#A855F7", "#F97316"], r = prng(4);
  for (let i = 0; i < 16; i++) { const u = .5 + r() * .22, t = .14 + r() * .3; s += poly3(qFloor(u, u + .035, t, t + .045), mc[i % 6], `opacity=".85"`); }
  // bilbanetårn med en bil der kører rundt
  s += poly3(qFloor(.27, .4, .64, .78), "rgba(0,0,0,.16)") + box3(.27, .39, .65, .77, 0, .04, "#E0E4EA", "#F2F4F7", "#C9CED6") + box3(.3, .34, .68, .74, .04, .62, "#2F6FD6", "#3F80E6", "#2557B0");
  const [tx, ty] = P3(.36, .7, .3), q = sc3(.7);
  s += `<path id="${k}-track" d="M${tx - 14 * q},${ty + 30 * q} C${tx - 34 * q},${ty} ${tx + 40 * q},${ty - 30 * q} ${tx + 30 * q},${ty - 50 * q} C${tx + 20 * q},${ty - 70 * q} ${tx - 30 * q},${ty - 50 * q} ${tx - 10 * q},${ty - 20 * q} C${tx + 10 * q},${ty + 10 * q} ${tx + 28 * q},${ty + 30 * q} ${tx - 14 * q},${ty + 30 * q}" fill="none" stroke="#FF6A1A" stroke-width="${4 * q}" stroke-linecap="round"/>`;
  s += `<rect x="-3.5" y="-2" width="7" height="4" rx="1.4" fill="#FFD23F"><animateMotion dur="3.6s" repeatCount="indefinite" rotate="auto"><mpath href="#${k}-track"/></animateMotion></rect>`;
  { const [x, y] = P3(.32, .68, .62); s += `<rect x="${x - 7}" y="${y - 9}" width="16" height="10" rx="3" fill="#E5484D"/><text x="${x + 1}" y="${y - 2}" font-size="5" font-weight="800" fill="#fff" text-anchor="middle">ULTIMATE</text>`; }
  // garderobe forrest til venstre
  s += box3(0, .2, 0, .55, 0, .96, "#9A968F", "#B4B0A9", "#8C8882");
  [[.04, .26], [.3, .52]].forEach(([a, b]) => { s += poly3([P3(.2, a, .08), P3(.2, b, .08), P3(.2, b, .46), P3(.2, a, .46)], "none", `stroke="#B3AFA8" stroke-width="1.2"`) + poly3([P3(.2, a, .52), P3(.2, b, .52), P3(.2, b, .9), P3(.2, a, .9)], "none", `stroke="#B3AFA8" stroke-width="1.2"`); });
  { const [x, y] = P3(.2, .27, .5); s += `<circle cx="${x}" cy="${y}" r="2.4" fill="#3A3633"/>`; }
  // reol med legetøj langs højre væg
  s += box3(.86, 1, .05, .62, 0, .22, "#33464C", "#6F858C", "#2A3B40");
  [[.89, .46, "#E5484D", .06], [.9, .3, "#2F6FD6", .08], [.9, .14, "#F2B01E", .05]].forEach(([u, t, c, hh]) => { s += poly3(qFloor(u - .005, u + .075, t - .005, t + .085, .221), "rgba(0,0,0,.25)") + box3(u, u + .07, t, t + .08, .222, .222 + hh, c, mixHex(c, "#FFFFFF", .25), mixHex(c, "#000000", .2)); });
  return s;
}
function lampsRacer(k, L) {
  const [fx, fy] = P3(.86, .78, .76), s = sc3(.78), r = 14 * s, [ax, ay] = P3(.86, .78, 1);
  let fl = ""; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, rr = r * (.85 + (i % 3) * .1); fl += `<line class="rm-shade rm-feather" x1="${(fx + Math.cos(a) * r * .25).toFixed(1)}" y1="${(fy + Math.sin(a) * r * .25).toFixed(1)}" x2="${(fx + Math.cos(a) * rr).toFixed(1)}" y2="${(fy + Math.sin(a) * rr).toFixed(1)}" stroke="#ECE7E0" stroke-width="2.6" stroke-linecap="round"/>`; }
  let o = `<g class="rm-sway slow" style="transform-origin:${ax}px ${ay}px">${ln3([ax, ay], [fx, fy - r], "#D7D1C8", 1)}<g ${L("sky")}><circle cx="${fx}" cy="${fy}" r="${r * 1.7}" fill="transparent"/><circle class="rm-shade" cx="${fx}" cy="${fy}" r="${r * .8}" fill="#E4DED5"/>${fl}</g></g>`;
  o += disc(.56, .42, L("ripls")) + pan(.2, .985, .38, L("panthella"));
  return o;
}
function glowsRacer(k, H) {
  const [fx, fy] = P3(.86, .78, .76), [rx, ry] = P3(.56, .42, 1), [px, py] = P3(.2, .985, .48);
  return beam3(k, .12, .5, .37) + H("ripls", rx, ry + 16, 85, [...P3(.56, .42, 0), 170, 40]) + H("sky", fx, fy, 70, [...P3(.86, .78, 0), 90, 20]) + H("panthella", px, py, 44, [...P3(.2, .99, .36), 40, 9]);
}

function drawNursery(k, W) {
  let s = shell3({ k, ceil: "#E7E1D8", ceil2: "#D7CFC3", floor: "#AF7F4E", floor2: "#CB9A66", left: "#ECE9E5", right: "#93A8BA", back: "#F3F0EC", plank: "rgba(90,55,25,.26)", seam: "rgba(120,110,95,.35)", seed: 2 });
  s += window3(.1, .6, .37, .84, k, W);
  // Panthella i vindueskarmen (ikke i HA), elefanter og plante
  s += pan(.24, .985, .38, `class="rm-static"`);
  { const [x, y] = P3(.5, .985, .38); s += `<rect x="${x - 4}" y="${y - 6}" width="8" height="6" fill="#55595F"/><path d="M${x},${y - 6} c-2,-8 -6,-12 -8,-12 M${x},${y - 6} c1,-10 4,-14 7,-14 M${x},${y - 6} c0,-8 0,-12 1,-16" stroke="#3E6B3A" stroke-width="3" fill="none" stroke-linecap="round"/>`; }
  { const [x, y] = P3(.36, .985, .38); s += `<ellipse cx="${x}" cy="${y - 3}" rx="5" ry="3.5" fill="#C9A27A"/><ellipse cx="${x + 13}" cy="${y - 3}" rx="4" ry="3" fill="#E2E0DC"/>`; }
  // billeder på den blå væg
  [[.86, .92, .54, .72, "#E8F1F6"], [.93, .98, .56, .68, "#F6F2EA"]].forEach(([a, b, c, d, f]) => { s += poly3(qRight(a, b, c, d), "#D4B483") + poly3(qRight(a + .006, b - .006, c + .012, d - .012), f); });
  // tremmeseng med himmel
  { const [ax, ay] = P3(.09, .88, 1); const l = P3(0, .62, .3), rr = P3(.25, .9, .3); s += `<path d="M${ax},${ay + 4} Q${ax - 30},${(ay + l[1]) / 2} ${l[0] + 4},${l[1] + 30} L${rr[0]},${rr[1] + 18} Q${ax + 22},${(ay + rr[1]) / 2} ${ax},${ay + 4}Z" fill="#9A9894"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${ax},${ay + 6} L${ax - 20 + i * 12},${l[1] + 26}" stroke="#86847F" stroke-width="1" fill="none"/>`; }
  s += box3(.02, .24, .56, .9, 0, .25, "#F7F6F3", "#FFFFFF", "#E7E4DF");
  for (let u = .04; u < .23; u += .022) s += ln3(P3(u, .56, .14), P3(u, .56, .24), "#D8D4CE", .8);
  s += poly3([P3(.04, .57, .24), P3(.2, .57, .24), P3(.2, .57, .1), P3(.04, .57, .12)], "#F1EEE8");
  // wishbone-stol
  { const [x, y] = P3(.32, .88, .17), q = sc3(.88); s += `<g stroke="#1C1C1F" stroke-width="${2.2 * q}" fill="none" stroke-linecap="round"><path d="M${x - 12 * q},${y} v${30 * q} M${x + 12 * q},${y} v${30 * q}"/><path d="M${x - 13 * q},${y - 2 * q} Q${x},${y - 30 * q} ${x + 13 * q},${y - 2 * q}"/><path d="M${x},${y - 1 * q} v-${12 * q}"/></g><ellipse cx="${x}" cy="${y}" rx="${14 * q}" ry="${4 * q}" fill="#C9A15F"/>`; }
  // bilgarage og kurv
  s += box3(.38, .46, .76, .84, 0, .1, "#EDE7DA", "#F7F2E8", "#DDD6C8");
  [["#E5484D", .395], ["#3B82F6", .42], ["#F2B01E", .445]].forEach(([c, u]) => { const [x, y] = P3(u, .8, .1); s += `<rect x="${(x - 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="5" height="5" rx="1" fill="${c}"/>`; });
  s += box3(.48, .56, .88, .96, 0, .09, "#B38B5A", "#C49B69", "#A07A4D");
  // reol med kasser og legetøj langs den blå væg
  s += box3(.72, .98, .52, .96, 0, .19, "#4A4E55", "#545961", "#3D4147");
  [[.74, "#E5484D"], [.81, "#F2B01E"], [.88, "#3B82F6"]].forEach(([u, c]) => { s += poly3([P3(u, .52, .03), P3(u + .055, .52, .03), P3(u + .055, .52, .15), P3(u, .52, .15)], mixHex(c, "#4A4E55", .35)); });
  s += box3(.76, .84, .62, .7, .19, .27, "#E04848", "#F0F0F0", "#C43C3C");
  s += box3(.86, .95, .72, .84, .19, .2, "#2FA84F", "#33B657", "#2A9446");
  // legekøkken/værkbænk
  s += box3(.8, 1, .3, .48, 0, .32, "#4D525A", "#D8B98E", "#43474E");
  s += poly3(qRight(.33, .47, .32, .5), "#5A5F67");
  // dino og gyngedyr forrest
  { const [x, y] = P3(.12, .14, 0); s += `<g><ellipse cx="${x + 6}" cy="${y}" rx="22" ry="4" fill="rgba(0,0,0,.18)"/><ellipse cx="${x + 4}" cy="${y - 14}" rx="18" ry="15" fill="#5E8C55"/><path d="M${x + 12},${y - 22} q10,-12 6,-24" stroke="#6E9C63" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="${x + 18}" cy="${y - 47}" r="8" fill="#6E9C63"/><circle cx="${x + 21}" cy="${y - 49}" r="1.2" fill="#1C1C1F"/><ellipse cx="${x + 6}" cy="${y - 10}" rx="9" ry="7" fill="#E9E3D2"/></g>`; }
  { const [x, y] = P3(.8, .1, 0); s += `<g><ellipse cx="${x}" cy="${y}" rx="40" ry="4" fill="rgba(0,0,0,.15)"/><path d="M${x - 40},${y - 4} q40,10 80,0" stroke="#A7B6A0" stroke-width="5" fill="none"/><path d="M${x - 22},${y - 4} l6,-12 M${x + 22},${y - 4} l-6,-12" stroke="#A7B6A0" stroke-width="4"/><ellipse cx="${x}" cy="${y - 22}" rx="26" ry="14" fill="#A9C09F"/><path d="M${x + 18},${y - 28} q8,-6 8,-14" stroke="#A9C09F" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="${x + 27}" cy="${y - 44}" r="10" fill="#B3C9A9"/><g fill="#F2D35B"><circle cx="${x - 8}" cy="${y - 28}" r="3"/><circle cx="${x + 6}" cy="${y - 22}" r="2.6"/><circle cx="${x - 14}" cy="${y - 18}" r="2.2"/></g></g>`; }
  return s;
}
function lampsNursery(k, L) {
  const [bx, by] = P3(.84, .34, .7), s = sc3(.34), r = 26 * s, [ax, ay] = P3(.84, .34, 1);
  const bal = `M${bx - r},${by} C${bx - r},${by - r * 1.5} ${bx + r},${by - r * 1.5} ${bx + r},${by} C${bx + r},${by + r * .55} ${bx + r * .3},${by + r * .9} ${bx + r * .22},${by + r * 1.15} L${bx - r * .22},${by + r * 1.15} C${bx - r * .3},${by + r * .9} ${bx - r},${by + r * .55} ${bx - r},${by}Z`;
  let stripes = ""; for (let i = -3; i <= 3; i++) stripes += `<path d="M${bx + i * r * .2},${by - r * 1.1} Q${bx + i * r * .32},${by} ${bx + i * r * .06},${by + r * 1.12}" stroke="rgba(160,150,140,.35)" stroke-width=".8" fill="none"/>`;
  let o = `<g class="rm-bob" style="transform-origin:${ax}px ${ay}px">${ln3([ax, ay], [bx, by - r * 1.1], "#D7D1C8", 1)}<g ${L("balloon")}><circle cx="${bx}" cy="${by}" r="${r * 1.6}" fill="transparent"/><path class="rm-shade" d="${bal}" fill="#F1EDE6"/>${stripes}
    ${ln3([bx - r * .2, by + r * 1.15], [bx - r * .3, by + r * 1.6], "#B79C78", .8)}${ln3([bx + r * .2, by + r * 1.15], [bx + r * .3, by + r * 1.6], "#B79C78", .8)}
    <path d="M${bx - r * .38},${by + r * 1.58} h${r * .76} l-${r * .08},${r * .42} h-${r * .6}z" fill="#C49B5C"/><circle cx="${bx}" cy="${by + r * 1.5}" r="${r * .14}" fill="#E0B347"/></g></g>`;
  o += disc(.42, .45, L("ripls"));
  return o;
}
function glowsNursery(k, H) {
  const [bx, by] = P3(.84, .34, .7), [rx, ry] = P3(.42, .45, 1);
  return beam3(k, .1, .6, .37) + H("ripls", rx, ry + 16, 85, [...P3(.42, .45, 0), 170, 40]) + H("balloon", bx, by, 66, [...P3(.84, .32, 0), 110, 26]);
}

/* Lys og scener pr. værelse. Lysene er de rigtige entiteter i HA; scenerne er rummets egne Hue-scener. */

/* The drawings: [id, name, draw, lamps, glows, lamp places [id, how much it lights the room, which names fit it, label]]. */
export const ART = {
  studio: { name: "Stort barn med sovesofa og skrivebord", draw: drawStudio, lamps: lampsStudio, glows: glowsStudio, slots: [["loft", 0.8, /loft|ceiling|pendel|blomst/i, "Loftlampe"], ["panthella", 0.3, /panthella(?!.*mini)|bordlampe|vindue/i, "Lampe i vinduet"], ["strip", 0.25, /strip|led/i, "Lysbånd over skrivebordet"], ["mini", 0.15, /mini|skrivebord|desk/i, "Lille lampe på reolen"]] },
  racer: { name: "Barn med bilbane og juniorseng", draw: drawRacer, lamps: lampsRacer, glows: glowsRacer, slots: [["ripls", 0.8, /ripls|loft|ceiling/i, "Loftlampe"], ["sky", 0.45, /sky|fjer|filament|pendel/i, "Fjerlampe"], ["panthella", 0.3, /panthella|bordlampe|vindue/i, "Lampe i vinduet"]] },
  nursery: { name: "Lille barn med tremmeseng og luftballon", draw: drawNursery, lamps: lampsNursery, glows: glowsNursery, slots: [["ripls", 0.8, /ripls|loft|ceiling/i, "Loftlampe"], ["balloon", 0.5, /ballon|balloon|pendel/i, "Luftballon-lampe"]] },
};
export const ART_IDS = Object.keys(ART);

/* Give each lamp place one of the room's lights: the one picked for it, then by name, then the rest in order. */
export function assign(art, lights, picked = {}) {
  const slots = ART[art].slots, out = {}, used = new Set();
  for (const [id] of slots) {
    const ent = picked[id];
    const l = ent && lights.find((x) => x.ent === ent && !used.has(x));
    if (l) (out[id] = l), used.add(l);
  }
  for (const [id, , re] of slots) {
    if (out[id]) continue;
    const l = lights.find((x) => !used.has(x) && !picked[id] && re.test(`${x.name} ${x.ent}`));
    if (l) (out[id] = l), used.add(l);
  }
  for (const [id] of slots) {
    if (out[id] || picked[id]) continue;
    const l = lights.find((x) => !used.has(x) && x.ent);
    if (l) (out[id] = l), used.add(l);
  }
  return out;
}

/* Draw it. h: the drawing helpers of hv-rooms.js; lights: the room's lights, in the order lookCss uses. */
export function drawArt(h, art, k, W, lights, picked) {
  ({ P3, sc3, pt3, poly3, ln3, qLeft, qRight, box3, shell3, window3, beam3, panthella3, ceilingDisc3, lampAttrs } = h);
  const A = ART[art], got = assign(art, lights, picked);
  for (const [id, w] of A.slots) if (got[id]) got[id].w = w;
  const L = (id) => (got[id] ? lampAttrs(k, got[id].id) : `class="rm-static"`);
  const H = (id, ...rest) => (got[id] ? h.halo3(k, lights.indexOf(got[id]), ...rest) : "");
  return { draw: A.draw(k, W), glows: A.glows(k, H), lamps: A.lamps(k, L), got };
}
