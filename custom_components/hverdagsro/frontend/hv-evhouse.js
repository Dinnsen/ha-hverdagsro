/* Hverdagsro – EV Planner's house in the header, when EV Planner is installed: the family's house and cars
   straight from the front in Hverdagsro's own sky (2D), or EV Planner's clay house seen low from its corner (3D).
   The house plans and the clay house are EV Planner's own (its panel module); the 2D drawing is Hverdagsro's. */

const EV_URL = "/ev_household_planner_static/ev-planner-panel.js";
let EV = null, EV_WAIT = null;
export const evInstalled = (hass) => (hass?.config?.components || []).includes("ev_household_planner");
// EV Planner's panel module, fetched once: its clay house (_ClayScene) and its styles.
export function loadEv(hass, done) {
  if (EV) return EV;
  if (!evInstalled(hass)) return null;
  if (!EV_WAIT) EV_WAIT = import(EV_URL).then((m) => { EV = { Scene: m._ClayScene, STYLE: m.STYLE, TEXT: m.TEXT }; done?.(); }).catch(() => { EV_WAIT = null; });
  return null;
}
export const evHouses = () => (EV ? EV.Scene.HOUSES : []);
export const evBodies = () => (EV ? EV.Scene.BODIES : ["mini", "sedan", "suv", "estate", "van"]);
// A house's name as EV Planner calls it.
export const houseName = (kind, lang) => (EV?.TEXT?.[lang === "en" ? "en" : "da"]?.[`house_${kind}`]) || kind;
export const housePreview = (kind) => (EV ? EV.Scene.housePreview(kind) : "");
export const paintHouses = (root) => { if (EV && root?.querySelector(".sc-pic [data-r]")) EV.Scene.paintPreview(root); };
export const carPreview = (body, paint) => (EV ? EV.Scene.preview(body, paint) : "");

const GB = (rise, axis = "x", more = {}) => ({ type: "gable", axis, rise, ...more });
const FL = { type: "flat" };
const HAND = {
  classic: {
    wings: [
      { x0: -1.4, x1: 6, y0: 4.4, y1: 9.8, h: 2.65, roof: FL, gates: [[0.2, 4.8]] },
      { x0: 6, x1: 14, y0: 2, y1: 8.6, h: 3.2, roof: GB(2.55, "x"), winS: [[8.2, 9.8, 0.93, 2.3], [10.6, 12.4, 0.93, 2.3]], doors: [[6.55, 7.45]], winE: [[3.5, 5, 0.93, 2.3], [5.8, 7.4, 0.93, 2.3]] },
    ],
    solar: { wing: 1, face: "S", a: 7.6, b: 13.2 }, chargers: [{ x: 3.4, w: 0 }, { x: 5.4, w: 0 }], battery: { x: 8.0, w: 1 }, heat: { x: 15.2, y: 6.4 },
    trees: [[-3.4, 2.4, 1], [-2.2, 1.2, 0.75], [19.2, 7.6, 0.85]], slots: [0.4, 3.2],
  },
  angle: {
    wings: [
      { x0: 0, x1: 8.51, y0: 0, y1: 10.68, h: 2.63, roof: GB(2.21, "y"), winE: [[2, 3.6], [5.2, 6.8]] },
      { x0: 0, x1: 21.35, y0: 10.68, y1: 19.19, h: 2.63, roof: GB(2.21, "x"), winS: [[2, 3.6], [5, 6.6], [11.2, 12.8]], doors: [[9.53, 10.5]], gates: [[15.05, 17.58], [18.11, 20.64]], winE: [[11.8, 12.84, 0, 2.1]] },
    ],
    solar: { wing: 1, face: "S", a: 10.8, b: 14.6 }, chargers: [{ x: 14.7, w: 1 }, { x: 20.95, w: 1 }], battery: { x: 11.4, w: 1 }, heat: { x: 22.6, y: 14 },
    trees: [[-3.2, 6.5, 1], [-2.6, 13.5, 0.8], [13.5, 3.2, 0.9], [24.6, 12.2, 0.85]], slots: [15.2, 18.3],
  },
};
function houseOf(kind, PLANS) {
  if (HAND[kind]) return HAND[kind];
  const p = PLANS[kind] || PLANS.long;
  const wallX = (o) => {
    const wall = p.walls?.[o.w];
    const wi = wall?.wing ?? 0, wing = p.wings[wi];
    return wall?.kind === "E" ? { x: wing.x1, y: wing.y0 + o.u, w: wi, east: true } : { x: o.u, w: wi };
  };
  return {
    wings: p.wings, solar: p.solar || null,
    chargers: (p.chargers || []).map(wallX), battery: p.battery ? wallX(p.battery) : null, heat: p.heat ? { x: p.heat.x + 0.5, y: p.heat.y } : null,
    trees: p.trees || [], slots: (p.slots || []).map((s) => s.x),
  };
}

/* ---------------------------------------------------------------- colours */
const hex = (h) => (h[0] === "#" ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).slice(0, 3).map(Number));
const mixc = (a, b, t) => { const [x, y] = [hex(a), hex(b)]; return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`; };
const PALETTE = {
  toon: { wall: "#F4F1FA", wallE: "#D9D3EA", roof: "#1B1530", roofE: "#2C2550", roofTop: "#3A3366", win: "#FFC86E", door: "#FF7A59", gate: "#D9D4E8", gateLine: "#B9B2CF", wood: "#3A3F5C", woodE: "#2B2F45", panel: "#24345F", panelLine: "#8FA6D6", ink: "#1B1530", charger: "#11A39A", tree: ["#2E9E6B", "#24855A"], trunk: "#7A4E2E", box: "#F2F3F6", heat: "#E3E6EC", night: "#20253F", glass: "#BFE3FF", glassN: "#2B3A5C", tyre: "#1B1530", rim: "#C9CCD6", font: "Bricolage Grotesque", bubbles: ["#6E4AFF", "#FF7A59"] },
};
const PAINT = { white: "#F7F8FA", black: "#2A2D33" };

/* ---------------------------------------------------------------- the house straight from the front, in 2D */
// As Hverdagsro's own house: walls as seen from the road, a roof whose ridge runs across as its front slope,
// a roof whose ridge runs towards the road as a triangle. Wings further back are drawn first, so the ones in front cover them.
const OV = 0.3; // the eaves
function roofTop(w) { return w.h + (w.roof.type === "gable" ? w.roof.rise : 0.25); }
export function drawHouse(cx, { kind, cfg, PLANS, style, dark, x, base, width, maxH, T = 0 }) {
  const pal = PALETTE[style], H = houseOf(kind, PLANS);
  const ymax = Math.max(...H.wings.map((w) => w.y1));
  const xs = H.wings.flatMap((w) => [w.x0 - OV - 0.6, w.x1 + OV + 0.6]); // the trees may stand outside the picture
  if (cfg.heat && H.heat) xs.push(H.heat.x + 1.3);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), span = x1 - x0;
  const tall = Math.max(...H.wings.map(roofTop)) + 0.6;
  const k = Math.min(width / span, maxH / tall);
  const ox = x - ((x0 + x1) / 2) * k;
  const P = (p) => [ox + p[0] * k, base - p[2] * k];
  const night = (c, t = 0.75) => mixc(c, pal.night, dark * t);
  const fillP = (pts, c) => { cx.fillStyle = c; cx.beginPath(); pts.forEach(([a, z], i) => { const [u, v] = P([a, 0, z]); i ? cx.lineTo(u, v) : cx.moveTo(u, v); }); cx.closePath(); cx.fill(); };
  const rect = (a, b, z0, z1, c) => fillP([[a, z0], [b, z0], [b, z1], [a, z1]], c);
  const line = (a, z0, b, z1, c, w = 1) => { const [p, q] = P([a, 0, z0]), [r, s] = P([b, 0, z1]); cx.strokeStyle = c; cx.lineWidth = w; cx.beginPath(); cx.moveTo(p, q); cx.lineTo(r, s); cx.stroke(); };
  const thin = Math.max(0.6, k * 0.035);
  const tree = ([tx, , tk]) => {
    const [bx, by] = P([tx, 0, 0]), s = k * tk;
    cx.fillStyle = night(pal.trunk); cx.fillRect(bx - 0.15 * s, by - 1.5 * s, 0.3 * s, 1.5 * s);
    cx.fillStyle = night(pal.tree[0]); cx.beginPath(); cx.arc(bx, by - 2.3 * s, 1.05 * s, 0, 7); cx.fill();
    cx.fillStyle = night(pal.tree[1]); cx.beginPath(); cx.arc(bx - 0.7 * s, by - 1.8 * s, 0.7 * s, 0, 7); cx.fill();
    cx.fillStyle = night(pal.tree[0]); cx.beginPath(); cx.arc(bx + 0.7 * s, by - 1.85 * s, 0.75 * s, 0, 7); cx.fill();
  };
  H.trees.filter((t) => t[1] < ymax - 1).forEach(tree);
  const order = H.wings.map((w, i) => i).sort((a, b) => H.wings[a].y1 - H.wings[b].y1 || roofTop(H.wings[b]) - roofTop(H.wings[a]));
  for (const i of order) {
    const w = H.wings[i], r = w.roof, back = w.y1 < ymax - 0.5;
    const shade = (c) => night(back ? mixc(c, pal.ink, 0.16) : c);
    const eav = w.h - 0.1, top = roofTop(w), xm = (w.x0 + w.x1) / 2;
    // The roof first where it is a triangle (the walls stand in front of its foot), then the walls.
    const sol = cfg.solar && H.solar && H.solar.wing === i ? H.solar : null;
    if (r.type === "gable" && r.axis === "y") fillP([[w.x0 - OV, eav], [xm, top + 0.12], [w.x1 + OV, eav]], shade(pal.roof));
    rect(w.x0, w.x1, 0, w.h, shade(w.wood ? pal.wood : pal.wall));
    if (w.wood) for (let u = w.x0 + 0.35; u < w.x1; u += 0.35) line(u, 0, u, w.h, "rgba(0,0,0,.18)", thin);
    // Gates, doors and windows; at night the windows light up, and their glow stays on their own wall.
    for (const [u0, u1] of w.gates || []) { rect(u0, u1, 0, 2.05, night(pal.gate)); for (let z = 0.45; z < 2; z += 0.45) line(u0, z, u1, z, night(pal.gateLine), Math.max(1, k * 0.04)); }
    for (const [u0, u1, z1 = 2.1] of w.doors || []) rect(u0, u1, 0, z1, night(pal.door, 0.5));
    const wins = (w.winS || []).map(([u0, u1, z0 = 0.93, z1 = 2.19, cols = 1]) => [u0, u1, Math.min(z0, w.h - 0.4), Math.min(z1, w.h - 0.25), cols]);
    for (const [u0, u1, z0, z1, cols] of wins) {
      rect(u0, u1, z0, z1, dark > 0.35 ? mixc(pal.win, "#FFE7A8", 0.5) : night(mixc(pal.win, "#FFFFFF", 0.1), 0.55));
      for (let c = 1; c < cols; c += 1) line(u0 + ((u1 - u0) * c) / cols, z0, u0 + ((u1 - u0) * c) / cols, z1, night(pal.wall, 0.4), thin * 1.6);
    }
    if (dark > 0.35 && wins.length) {
      cx.save(); const [ax, ay] = P([w.x0, 0, w.h]), [bx2, by2] = P([w.x1, 0, 0]); cx.beginPath(); cx.rect(ax, ay, bx2 - ax, by2 - ay); cx.clip();
      for (const [u0, u1, z0, z1] of wins) { const [gx, gy] = P([(u0 + u1) / 2, 0, (z0 + z1) / 2]), R = (u1 - u0 + 1.4) * k; const g = cx.createRadialGradient(gx, gy, 0, gx, gy, R); g.addColorStop(0, `rgba(255,214,140,${0.28 * dark})`); g.addColorStop(1, "rgba(255,214,140,0)"); cx.fillStyle = g; cx.fillRect(gx - R, gy - R, 2 * R, 2 * R); }
      cx.restore();
    }
    // The roof seen from the road.
    if (r.type === "flat") {
      rect(w.x0 - 0.1, w.x1 + 0.1, w.h, w.h + 0.25, shade(pal.roofTop));
      if (sol && sol.face === "top") { const n = Math.max(2, Math.round((sol.b - sol.a) / 1.1)), d = (sol.b - sol.a) / n; for (let j = 0; j < n; j += 1) { fillP([[sol.a + j * d + 0.08, w.h + 0.3], [sol.a + (j + 1) * d - 0.08, w.h + 0.3], [sol.a + (j + 1) * d - 0.12, w.h + 0.85], [sol.a + j * d + 0.04, w.h + 0.85]], night(pal.panel, 0.4)); line(sol.a + j * d + 0.06, w.h + 0.58, sol.a + (j + 1) * d - 0.1, w.h + 0.58, pal.panelLine, thin); } }
    } else if (r.axis === "x") {
      // A small slant at a free end, so the slope reads as a roof; a hip slants as far as it goes back.
      const abut = (q) => H.wings.some((o) => o !== w && o.roof.type === "gable" && o.roof.axis === "x" && Math.abs(q(o)) < 0.05);
      const a = w.x0 - OV + (r.hip0 || (abut((o) => o.x1 - w.x0) ? 0 : 0.35)), b = w.x1 + OV - (r.hip1 || (abut((o) => o.x0 - w.x1) ? 0 : 0.35));
      fillP([[w.x0 - OV, eav], [w.x1 + OV, eav], [b, top], [a, top]], shade(pal.roof));
      rect(w.x0 - OV, w.x1 + OV, eav - 0.12, eav, shade(mixc(pal.roof, "#000000", 0.25)));
      if (sol && sol.face === "S") {
        const z0 = eav + (top - eav) * 0.14, z1 = eav + (top - eav) * 0.86, sa = Math.max(sol.a, a + 0.3), sb = Math.min(sol.b, b - 0.3);
        rect(sa, sb, z0, z1, night(pal.panel, 0.4));
        const n = Math.max(2, Math.round((sb - sa) / 1.05));
        for (let j = 1; j < n; j += 1) line(sa + ((sb - sa) * j) / n, z0, sa + ((sb - sa) * j) / n, z1, pal.panelLine, thin);
        line(sa, (z0 + z1) / 2, sb, (z0 + z1) / 2, pal.panelLine, thin);
      }
    } else if (sol && (sol.face === "E" || sol.face === "S")) {
      // Panels on a slope that faces the side: a band along its edge, from the eave towards the ridge.
      const L = (t) => [w.x1 + OV + (xm - w.x1 - OV) * t, eav + (top - eav) * t], q = (t, d) => { const [u, z] = L(t); return [u - d, z - d * 0.9]; };
      const t0 = 0.12, t1 = 0.8, dd = Math.min(1.2, (w.x1 - w.x0) * 0.18);
      fillP([q(t0, 0.15), q(t1, 0.15), q(t1, 0.15 + dd), q(t0, 0.15 + dd)], night(pal.panel, 0.4));
      for (let j = 1; j < 5; j += 1) { const t = t0 + ((t1 - t0) * j) / 5, [p0, z0] = q(t, 0.15), [p1, z1] = q(t, 0.15 + dd); line(p0, z0, p1, z1, pal.panelLine, thin); }
    }
    // Dormers in the front slope.
    for (const [d0, d1, z0, z1] of w.dormers || []) {
      rect(d0, d1, z0, z1, shade(pal.wall)); rect(d0 + 0.25, d1 - 0.25, z0 + 0.25, z1 - 0.2, dark > 0.35 ? mixc(pal.win, "#FFE7A8", 0.5) : night(pal.win, 0.55));
      fillP([[d0 - 0.2, z1], [d1 + 0.2, z1], [d1 + 0.2, z1 + 0.18], [d0 - 0.2, z1 + 0.18]], shade(pal.roof));
    }
  }
  // On the walls: chargers, the battery; beside the house: the heat pump.
  const onFront = (o, n = 0) => { const w = H.wings[o.w ?? 0]; return o.east ? w.x1 - 0.55 - 0.7 * n : o.x; };
  const wallTop = (o) => H.wings[o.w ?? 0].h;
  const chargers = H.chargers.slice(0, cfg.chargers).map((o, n) => { const wx = onFront(o, n); rect(wx - 0.2, wx + 0.2, 1.0, 1.55, night(pal.charger, 0.4)); rect(wx - 0.1, wx + 0.1, 1.3, 1.42, "#FFFFFF"); return P([wx, 0, 1.0]); });
  if (cfg.battery && H.battery) { const wx = onFront(H.battery, 2); rect(wx - 0.3, wx + 0.3, 0.7, Math.min(1.8, wallTop(H.battery) - 0.3), night(pal.box, 0.5)); rect(wx - 0.18, wx + 0.05, 1.45, 1.53, "#3CCB83"); }
  if (cfg.heat && H.heat) { const hx = H.heat.x; rect(hx, hx + 1.1, 0, 0.9, night(pal.heat, 0.5)); const [fx, fy] = P([hx + 0.55, 0, 0.45]); cx.strokeStyle = night("#8A90A3", 0.4); cx.lineWidth = Math.max(1, k * 0.06); cx.beginPath(); cx.arc(fx, fy, k * 0.28, 0, 7); cx.stroke(); }
  H.trees.filter((t) => t[1] >= ymax - 1).forEach(tree);
  // The roof's edge for Hverdagsro's decorations: the main wing's eave, and its ridge or gable.
  const main = H.wings.reduce((m, w) => ((w.x1 - w.x0) * (w.y1 - w.y0) * (w.roof.type === "gable" ? 1.4 : 1) > (m.x1 - m.x0) * (m.y1 - m.y0) * (m.roof.type === "gable" ? 1.4 : 1) ? w : m), H.wings[0]);
  const r = main.roof, eave = main.h - 0.05, mt = roofTop(main);
  let edge;
  if (r.type === "gable" && r.axis === "y") edge = [[main.x0 - OV, eave], [(main.x0 + main.x1) / 2, mt + 0.1], [main.x1 + OV, eave]];
  else if (r.type === "gable") edge = [[main.x0 - OV, eave], [main.x0 - OV + (r.hip0 || 0), mt], [main.x1 + OV - (r.hip1 || 0), mt], [main.x1 + OV, eave]];
  else edge = [[main.x0 - 0.1, main.h + 0.25], [main.x1 + 0.1, main.h + 0.25]];
  const lineOut = edge.map(([a, z]) => P([a, 0, z]));
  // Where the cars stand: in front of the garage doors, else at the parking places.
  const gates = H.wings.flatMap((w) => (w.gates || []).map(([u0, u1]) => (u0 + u1) / 2)).sort((p, q) => p - q);
  const spots = gates.length ? gates : (H.slots.length ? H.slots.map((s) => s + 1.05) : [H.wings[0].x0 + 1.2]);
  return { k, P, H, chargers, spots, line: lineOut, slot: ox + x0 * k - 26, w: (main.x1 - main.x0) * k, h: main.h * k, cx: P([(main.x0 + main.x1) / 2, 0, 0])[0], left: ox + x0 * k, right: ox + x1 * k };
}

/* A car straight from the front, standing at x just in front of the house: wheels, body, cabin with the windscreen, lights and plate. */
const FRONT = { mini: [1.8, 1.45], sedan: [1.85, 1.42], suv: [1.88, 1.68], estate: [1.9, 1.5], van: [1.98, 1.95] };
export function drawCarFront(cx, house, { body, paint, x }, pal, dark, charging, T) {
  const [Wd, Hc] = FRONT[body] || FRONT.sedan, k = house.k, [gx, gy0] = house.P([x, 0, 0]), gy = gy0 + 0.25 * k;
  const X = (u) => gx + u * k, Z = (z) => gy - z * k;
  const col = PAINT[paint] || paint, nightc = (c) => mixc(c, pal.night, dark * 0.6), shade = mixc(col, "#000000", 0.22);
  const poly = (pts, c) => { cx.fillStyle = c; cx.beginPath(); pts.forEach(([u, z], i) => (i ? cx.lineTo(X(u), Z(z)) : cx.moveTo(X(u), Z(z)))); cx.closePath(); cx.fill(); };
  const rr = (u0, u1, z0, z1, rad, c) => { cx.fillStyle = c; cx.beginPath(); const a = X(u0), b = Z(z1), w = X(u1) - a, h = Z(z0) - b; cx.roundRect ? cx.roundRect(a, b, w, h, rad * k) : cx.rect(a, b, w, h); cx.fill(); };
  const h = Wd / 2, belt = Hc * 0.56, van = body === "van";
  cx.fillStyle = "rgba(0,0,0,.2)"; cx.beginPath(); cx.ellipse(gx, gy + 0.04 * k, (h + 0.25) * k, 0.18 * k, 0, 0, 7); cx.fill();
  rr(-h + 0.08, -h + 0.42, 0, 0.62, 0.08, pal.tyre); rr(h - 0.42, h - 0.08, 0, 0.62, 0.08, pal.tyre);
  // The cabin: narrower at the roof, the windscreen inside it.
  const cw0 = h - 0.08, cw1 = van ? h - 0.12 : h * 0.66;
  poly([[-cw0, belt - 0.02], [cw0, belt - 0.02], [cw1, Hc], [-cw1, Hc]], nightc(col));
  poly([[-cw0 + 0.12, belt + 0.04], [cw0 - 0.12, belt + 0.04], [cw1 - 0.08, Hc - 0.1], [-cw1 + 0.08, Hc - 0.1]], nightc(dark > 0.4 ? pal.glassN : pal.glass));
  rr(-h - 0.14, -h + 0.06, belt - 0.02, belt + 0.14, 0.04, nightc(col)); rr(h - 0.06, h + 0.14, belt - 0.02, belt + 0.14, 0.04, nightc(col));
  // The body, the grille, lights and plate.
  rr(-h, h, 0.22, belt + 0.02, 0.18, nightc(col));
  rr(-h + 0.4, h - 0.4, 0.3, 0.46, 0.05, nightc(shade));
  const lamp = dark > 0.35 ? "#FFF3C4" : "#E9EEF5";
  rr(-h + 0.1, -h + 0.5, belt - 0.24, belt - 0.1, 0.05, lamp); rr(h - 0.5, h - 0.1, belt - 0.24, belt - 0.1, 0.05, lamp);
  rr(-0.3, 0.3, 0.32, 0.45, 0.02, "#F2F3F5");
  if (dark > 0.35) for (const s of [-1, 1]) { const lx = X(s * (h - 0.3)), ly = Z(belt - 0.17), g = cx.createRadialGradient(lx, ly, 0, lx, ly, k * 1.1); g.addColorStop(0, "rgba(255,240,190,.4)"); g.addColorStop(1, "rgba(255,240,190,0)"); cx.fillStyle = g; cx.fillRect(lx - k * 1.1, ly - k * 1.1, k * 2.2, k * 2.2); }
  // The charging port, front left, glowing while it charges.
  const port = [X(-h + 0.22), Z(belt - 0.04)];
  if (charging) { cx.fillStyle = `rgba(60,230,150,${0.55 + 0.45 * Math.sin(T * 3)})`; cx.beginPath(); cx.arc(port[0], port[1], Math.max(1.5, k * 0.09), 0, 7); cx.fill(); }
  return port;
}


/* The sky's hooks for the 2D house: get() → { house, cars: [{body, paint}], decor } or null for Hverdagsro's own house. */
export function skyHooks(get) {
  let house = null;
  return {
    houseDraw: (cx, i) => {
      const s = get();
      if (!s) { house = null; return undefined; }
      if (s.view === "3d") { house = null; return null; }
      house = drawHouse(cx, { kind: s.house, cfg: { chargers: 0 }, PLANS: EV.Scene.PLANS, style: "toon", dark: i.dark, x: i.x, base: i.base, width: i.W * (i.W < 600 ? 0.38 : 0.26), maxH: i.H * 0.34, T: i.T });
      return house;
    },
    front: (cx, i) => {
      const s = get();
      if (!s || !house) return;
      s.cars.slice(0, 2).forEach((c, n) => {
        const sp = house.spots, x = sp[n] ?? sp[sp.length - 1] + 2.6 * (n - sp.length + 1);
        drawCarFront(cx, house, { ...c, x }, PALETTE.toon, i.dark, false, i.T);
      });
    },
  };
}

/* 3D: EV Planner's clay house where Hverdagsro's house stands, on the same hill, seen lower from its corner. */
const CLAY_CSS = `:host{display:block!important;height:auto!important;min-height:0!important;background:transparent!important;padding:0!important}
section.panel{background:transparent!important;box-shadow:none!important;border:0!important;padding:0!important;margin:0!important}
.bare .cscene{background:transparent!important;box-shadow:none!important;border:0!important}`;
const hillY = (x, H) => H * 0.8 + 13 * Math.sin(x * 0.009 + 2.6) + 13 * 0.45 * Math.sin(x * 0.009 * 2.3 + 2.6 * 1.7) + 4;
export function mountClay(host, box) {
  if (!EV) return null;
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${EV.STYLE}\n${CLAY_CSS}</style><section class="panel home-flow bare"><div class="scene-slot"></div></section>`;
  const sc = new EV.Scene();
  root.querySelector(".scene-slot").append(sc.el);
  const fit = () => {
    const W = box.clientWidth, H = box.clientHeight, x = W * (W < 600 ? 0.72 : 0.74), w = Math.min(W * (W < 600 ? 0.52 : 0.28), 400);
    host.style.width = `${w}px`; host.style.left = `${x - w * 0.5}px`; host.style.top = `${hillY(x, H) - w * 0.6}px`;
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(box);
  return {
    update: (s, light) => sc.update({
      house: s.house, light, elev: 0.2, bare: true, season: s.decor || null, solar: null, battery: null, heat: null, chargers: [],
      cars: s.cars.slice(0, 2).map((c, n) => ({ id: `car${n}`, image: null, body: c.body, paint: c.paint, plugged: false, charging: false, status: "idle", charger: null })),
      flows: {}, labels: [],
    }),
    stop: () => ro.disconnect(),
  };
}
