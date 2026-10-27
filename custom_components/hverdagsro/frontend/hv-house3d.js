/* Hverdagsro – the family's house as a big open doll's house in 3D perspective (the "Huset" page of the map).
   Drawn from the floor plan made in Husbyggeren: the floors of the rooms, the walls (the front ones cut low so the
   rooms can be seen), the windows, and the furniture as little blocks. Tap a room to go there. Without a floor plan a
   family house with the usual rooms is drawn instead. Everything is drawn here, seen by a camera in front of and above
   the house. */
import { OL, shade } from "./hv-playcat.js";
import { houseRooms, houseData } from "./hv-world.js";

const W = 1000, H = 620, U = 60; // Husbyggeren: 60 units to the metre
const WALL = 2.5, LOW = 0.32, INNER = 1.25, PITCH = (48 * Math.PI) / 180;

/* How tall the furniture is, and its colour. */
const FURN = {
  sofa: [0.8, "#8FA0C8"], corner: [0.8, "#8FA0C8"], chaise: [0.8, "#8FA0C8"], arm: [0.9, "#F2A65A"], pouf: [0.4, "#F7B5CF"], coffee: [0.4, "#C98B55"], sidet: [0.5, "#C98B55"], tvbench: [0.5, "#3A3A55"],
  sideboard: [0.8, "#C98B55"], shelf: [1.8, "#E9C46A"], piano: [1.2, "#2B2340"], stove: [1.1, "#3A3A55"], rug: [0.03, "#F7B5CF"], plant: [1.1, "#6BCB77"],
  base: [0.9, "#FFFFFF"], sinkc: [0.9, "#FFFFFF"], hobc: [0.9, "#3A3A55"], dishc: [0.9, "#FFFFFF"], ovenc: [2.1, "#E8EEF6"], fridgec: [1.9, "#E8EEF6"], tall: [2.1, "#FFFFFF"], counter: [0.9, "#FFFFFF"], island: [0.9, "#FFF6E6"],
  table: [0.75, "#C98B55"], tround: [0.75, "#C98B55"], chair: [0.9, "#6BCB77"], stool: [0.7, "#FFB347"], bench: [0.45, "#C98B55"],
  bed2: [0.55, "#9B8CFF"], bed1: [0.55, "#4D96FF"], nightstand: [0.55, "#C98B55"], wardrobe: [2, "#F2E3CF"], dresser: [0.9, "#C98B55"], vanity: [0.8, "#FFD1E3"], bbench: [0.45, "#C98B55"],
  bunk: [1.7, "#4D96FF"], crib: [0.9, "#FFD93D"], desk: [0.75, "#FFD93D"], toybox: [0.5, "#FF6B6B"], playk: [0.9, "#FFB347"], tipi: [1.6, "#FFE4CC"], beanbag: [0.6, "#F15BB5"],
  tub: [0.55, "#FFFFFF"], shower: [2, "#BFE6FF"], toilet: [0.75, "#FFFFFF"], sink: [0.85, "#FFFFFF"], vanityb: [0.85, "#FFFFFF"],
  wm: [0.85, "#FFFFFF"], td: [0.85, "#FFFFFF"], tower: [1.7, "#FFFFFF"], usink: [0.9, "#FFFFFF"], clean: [1.9, "#E8EEF6"], shoes: [0.5, "#C98B55"],
  standd: [0.75, "#E9C46A"], ochair: [1, "#3A3A55"], cabinet: [1.2, "#CFD6E6"], work: [0.9, "#C98B55"], gshelf: [1.8, "#9AA4BA"], bike: [1, "#E5484D"], bins: [1.1, "#3E8E4E"],
  gset: [0.75, "#C98B55"], gtable: [0.75, "#C98B55"], lounge: [0.6, "#CFD6E6"], lounger: [0.4, "#FFFFFF"], tramp: [0.6, "#3A3A55"], sandbox: [0.3, "#F2D7A0"], raised: [0.6, "#A9764C"],
  playhouse: [1.8, "#FF6B6B"], swing: [2, "#E9C46A"], firepit: [0.4, "#3A3A55"], pizza: [1.1, "#C2502A"], weber: [0.9, "#2B2340"], grill: [1, "#3A3A55"], parasol: [0.05, "#F2E3CF"],
};
const FLOOR = { kitchen: "#FFF0B8", living: "#F7D2A6", bath: "#CDEBFA", bed: "#E2D5FF", kid: "#BFE3FF", hall: "#F2E3CF", office: "#D8F0D0", utility: "#E2E8F0", garage: "#CFD6E6", other: "#FFF6E6" };
const WALLC = { kitchen: "#FFF8DC", living: "#FFE9D6", bath: "#E8F6FF", bed: "#EFE6FF", kid: "#DDF0FF", hall: "#FFF6E6", office: "#ECF8E6", utility: "#F0F3F8", garage: "#E2E8F0", other: "#FFF6E6" };
const AREA = { lawn: "#8FD08A", deck: "#D9A66B", drive: "#B8BCCB", terrace: "#D9A66B", patio: "#CFC6B8", bed: "#A9764C", water: "#7FC8F8" };

/* ------------------------------------------------------------------ the camera */
function camera(cx, cy, span) {
  const dist = span * 1.9, cos = Math.cos(PITCH), sin = Math.sin(PITCH);
  const C = [cx, cy + dist * cos, dist * sin];
  return (x, y, z) => {
    // right = (1, 0, 0); up = (0, -sin, cos); forward = (0, -cos, -sin)
    const vx = x - C[0], vy = y - C[1], vz = z - C[2];
    const d = -vy * cos - vz * sin;
    return [vx / d, (vy * sin - vz * cos) / d, d];
  };
}
const inside = (x, y, pts) => {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) hit = !hit;
  }
  return hit;
};
const centroid = (pts) => {
  let a = 0, x = 0, y = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const f = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
    a += f;
    x += (pts[j][0] + pts[i][0]) * f;
    y += (pts[j][1] + pts[i][1]) * f;
  }
  if (Math.abs(a) < 1e-6) return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  return [x / (3 * a), y / (3 * a)];
};
const area = (pts) => Math.abs(pts.reduce((s, p, i) => s + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0) / 2);

/* The house as rooms (in metres), walls, furniture and the garden. */
function model(ctx) {
  const house = houseData(ctx), HR = houseRooms(ctx);
  const rooms = (house.rooms || []).filter((r) => Array.isArray(r.pts) && r.pts.length >= 3).map((r) => {
    const h = HR.find((x) => x.room.id === r.id);
    const fb = house.fallback && h?.kid ? ctx.t("{name}s værelse", { name: ctx.member(h.kid)?.name || "" }) : "";
    return { id: r.id, name: fb || (h ? ctx.t(h.n) : r.name), look: h?.look || "other", em: h?.em || "🏠", kid: h?.kid || "", pts: r.pts.map(([x, y]) => [x / U, y / U]) };
  });
  const walls = (house.walls || []).filter((w) => Array.isArray(w.a) && Array.isArray(w.b)).map((w) => ({ a: [w.a[0] / U, w.a[1] / U], b: [w.b[0] / U, w.b[1] / U], ext: w.k === "ext" }));
  const furn = (house.items || []).filter((it) => ((it.type === "furn" && FURN[it.fk]) || it.type === "tv") && typeof it.x === "number").map((it) => (it.type === "tv" ? { k: "tv", x: it.x / U, y: it.y / U + 0.25, w: 1.3, d: 0.15, rot: 0 } : { k: it.fk, x: it.x / U, y: it.y / U, w: (it.w || 60) / U, d: (it.h || 60) / U, rot: it.rot || 0 }));
  const windows = (house.items || []).filter((it) => it.type === "window" && typeof it.x === "number").map((it) => ({ x: it.x / U, y: it.y / U, w: (it.w || 90) / U }));
  const areas = (house.areas || []).filter((a) => Array.isArray(a.pts) && a.pts.length >= 3).map((a) => ({ id: a.id, kind: a.kind, name: a.name, pts: a.pts.map(([x, y]) => [x / U, y / U]) }));
  return { rooms, walls, furn, windows, areas };
}
/* Walls from the rooms when the plan has none: every side of a room; the sides two rooms share are inside walls. */
function wallsOf(rooms) {
  const key = (p) => `${Math.round(p[0] * 20)}:${Math.round(p[1] * 20)}`, seen = new Map();
  for (const r of rooms)
    r.pts.forEach((a, i) => {
      const b = r.pts[(i + 1) % r.pts.length], k1 = `${key(a)}|${key(b)}`, k2 = `${key(b)}|${key(a)}`;
      if (seen.has(k2)) seen.get(k2).ext = false;
      else if (!seen.has(k1)) seen.set(k1, { a, b, ext: true });
    });
  return [...seen.values()];
}

/* ------------------------------------------------------------------ drawing */
export function houseSvg(ctx, here, peers, t, opts = {}) {
  const M = model(ctx);
  const rooms = M.rooms, walls = M.walls.length ? M.walls : wallsOf(rooms);
  const all = rooms.flatMap((r) => r.pts);
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs) - 2, x1 = Math.max(...xs) + 2, y0 = Math.min(...ys) - 1.2, y1 = Math.max(...ys) + 3;
  const cam = camera((x0 + x1) / 2, (y0 + y1) / 2, Math.max(x1 - x0, (y1 - y0) * 1.3));
  // Fit the picture into the page, under the tabs.
  const probe = [[x0, y0, WALL], [x1, y0, WALL], [x0, y1, 0], [x1, y1, 0], [x0, y1, -0.6], [x1, y1, -0.6], [x0, y0, 0], [x1, y0, 0]].map(([a, b, c]) => cam(a, b, c));
  const px0 = Math.min(...probe.map((q) => q[0])), px1 = Math.max(...probe.map((q) => q[0])), py0 = Math.min(...probe.map((q) => q[1])), py1 = Math.max(...probe.map((q) => q[1]));
  const box = [30, 74, W - 30, H - 20], s = Math.min((box[2] - box[0]) / (px1 - px0), (box[3] - box[1]) / (py1 - py0));
  const ox = (box[0] + box[2]) / 2 - ((px0 + px1) / 2) * s, oy = (box[1] + box[3]) / 2 - ((py0 + py1) / 2) * s;
  const P = (x, y, z = 0) => {
    const q = cam(x, y, z);
    return [ox + q[0] * s, oy + q[1] * s, q[2]];
  };
  const pts = (list) => list.map(([x, y, z]) => P(x, y, z).slice(0, 2).map((n) => n.toFixed(1)).join(",")).join(" ");
  const poly = (list, fill, o = "") => `<polygon points="${pts(list)}" fill="${fill}" stroke="${OL}" stroke-width="2" stroke-linejoin="round" ${o}/>`;
  const faces = [];
  // A face: drawn far to near; the ones facing away are not drawn.
  const face = (list, fill, o = "", bias = 0) => {
    const n = list.length, c = list.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n, a[2] + p[2] / n], [0, 0, 0]);
    faces.push([P(...c)[2] + bias, poly(list, fill, o)]);
  };
  // A round tree or plant, always facing us: a trunk and a crown, as big as it is far away.
  const tree = (x, y, h, r, col = "#6BCB77") => {
    const [bx, by, d] = P(x, y, 0.05), [tx, ty] = P(x, y, h), [ex] = P(x + r, y, h), R = Math.abs(ex - tx);
    faces.push([d, `<g pointer-events="none"><ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${(R * 0.7).toFixed(1)}" ry="${(R * 0.28).toFixed(1)}" fill="rgba(0,0,0,.14)"/><path d="M${bx.toFixed(1)} ${by.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}" stroke="#A9764C" stroke-width="${Math.max(3, R * 0.22).toFixed(1)}" stroke-linecap="round"/><circle cx="${tx.toFixed(1)}" cy="${(ty - R * 0.4).toFixed(1)}" r="${R.toFixed(1)}" fill="${col}" stroke="${OL}" stroke-width="2"/><circle cx="${(tx - R * 0.35).toFixed(1)}" cy="${(ty - R * 0.75).toFixed(1)}" r="${(R * 0.3).toFixed(1)}" fill="#fff" opacity=".3"/></g>`]);
  };
  const camAt = [(x0 + x1) / 2, (y0 + y1) / 2 + Math.max(x1 - x0, (y1 - y0) * 1.3) * 1.9 * Math.cos(PITCH)];
  // A block: a box standing on the floor, turned like the thing. Only the sides we can see.
  const block = (cx, cy, w, d, rot, h, col, z0 = 0, top = null, out = null) => {
    const a = (rot * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const c = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [cx + u * ca - v * sa, cy + u * sa + v * ca]);
    for (let i = 0; i < 4; i++) {
      const p = c[i], q = c[(i + 1) % 4], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const nx = mx - cx, ny = my - cy;
      if (nx * (camAt[0] - mx) + ny * (camAt[1] - my) <= 0) continue;
      const lit = ny > Math.abs(nx) ? 0.9 : nx < 0 ? 0.82 : 0.74;
      // The outside of an outside wall is brick.
      const L0 = Math.hypot(nx, ny) || 1, outer = out && (nx * out[0] + ny * out[1]) / L0 > 0.5;
      face([[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z0 + h], [p[0], p[1], z0 + h]], shade(outer ? out[2] : col, lit), outer ? 'stroke-width="2"' : "");
    }
    face(c.map(([x, y]) => [x, y, z0 + h]), top || shade(col, 1.06));
  };
  // The ground: a toy garden on a thick slab.
  const ap = M.areas.flatMap((a) => a.pts), gx0 = Math.min(x0, ...ap.map((q) => q[0] - 0.5)), gx1 = Math.max(x1, ...ap.map((q) => q[0] + 0.5)), gy0 = Math.min(y0, ...ap.map((q) => q[1] - 0.5)), gy1 = Math.max(y1, ...ap.map((q) => q[1] + 0.5));
  const g0 = [[gx0, gy0, 0], [gx1, gy0, 0], [gx1, gy1, 0], [gx0, gy1, 0]];
  let svg = `${poly([[gx0, gy1, -0.7], [gx1, gy1, -0.7], [gx1, gy1, 0], [gx0, gy1, 0]], "#A97C55")}${poly([[gx1, gy0, -0.7], [gx1, gy1, -0.7], [gx1, gy1, 0], [gx1, gy0, 0]], "#8E6646")}${poly([[gx0, gy0, -0.7], [gx0, gy1, -0.7], [gx0, gy1, 0], [gx0, gy0, 0]], "#8E6646")}${poly(g0, "#A8DD9A")}`;
  // The garden, the terrace and the drive.
  const gardenKeys = [];
  for (const a of M.areas) {
    const col = AREA[a.kind] || "#A8DD9A", lawn = a.kind === "lawn";
    const el = poly(a.pts.map(([x, y]) => [x, y, 0.02]), col, 'stroke-width="1.5"');
    svg += lawn ? `<g class="hz-garden" data-pl="go" data-k="have" role="button" aria-label="${t("Haven")}">${el}</g>` : el;
    if (lawn) gardenKeys.push(centroid(a.pts));
    if (a.kind === "drive") {
      const [cx, cy] = centroid(a.pts);
      block(cx, cy, 1.8, 4.2, 0, 0.7, "#4D96FF", 0.25);
      block(cx, cy + 0.2, 1.6, 2, 0, 0.5, "#CFE8FF", 0.95);
    }
  }
  // The floors.
  const HL = [];
  for (const r of rooms) {
    const key = r.kid ? (r.kid === ctx.me?.id ? "vaerelse" : `visit:${r.kid}`) : `h:${r.id}`;
    r.key = key;
    svg += poly(r.pts.map(([x, y]) => [x, y, 0.04]), FLOOR[r.look] || FLOOR.other);
    // Boards or tiles, in perspective.
    const rxs = r.pts.map((q) => q[0]), rys = r.pts.map((q) => q[1]), ax = Math.min(...rxs), bx = Math.max(...rxs), ay = Math.min(...rys), by = Math.max(...rys);
    const tiles = ["kitchen", "bath", "utility", "garage"].includes(r.look), step = tiles ? 0.6 : 0.45, ln = [];
    for (let x = ax + step; x < bx - 0.05; x += step) ln.push([[x, ay], [x, by]]);
    if (tiles) for (let y = ay + step; y < by - 0.05; y += step) ln.push([[ax, y], [bx, y]]);
    const cid = `hzc-${String(r.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
    svg += `<clipPath id="${cid}"><polygon points="${pts(r.pts.map(([x, y]) => [x, y, 0.04]))}"/></clipPath><g clip-path="url(#${cid})" pointer-events="none" stroke="${shade(FLOOR[r.look] || FLOOR.other, 0.86)}" stroke-width="1.5">${ln.map(([a, b]) => {
      const [p1x, p1y] = P(a[0], a[1], 0.045), [p2x, p2y] = P(b[0], b[1], 0.045);
      return `<path d="M${p1x.toFixed(1)} ${p1y.toFixed(1)} L${p2x.toFixed(1)} ${p2y.toFixed(1)}"/>`;
    }).join("")}</g>`;
    HL.push(r);
  }
  // The walls: tall at the back and the sides, cut low at the front, half height inside.
  for (const w of walls) {
    const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy);
    if (L < 0.05) continue;
    let nx = -dy / L, ny = dx / L;
    const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2;
    // The outside is where there is no room.
    if (rooms.some((r) => inside(mx + nx * 0.3, my + ny * 0.3, r.pts))) [nx, ny] = [-nx, -ny];
    const inRoom = rooms.find((r) => inside(mx - nx * 0.3, my - ny * 0.3, r.pts));
    const front = w.ext && ny > 0.35;
    const h = !w.ext ? INNER : front ? LOW : WALL, th = w.ext ? 0.2 : 0.12;
    const col = w.ext ? (front ? "#FFFFFF" : WALLC[inRoom?.look] || "#FFF6E6") : "#FFFDF8";
    block(mx, my, L + th * 0.6, th, (Math.atan2(dy, dx) * 180) / Math.PI, h, col, 0, w.ext ? "#5A5A66" : "#FFFFFF", w.ext ? [nx, ny, "#4A4A55"] : null);
  }
  // Windows on the tall outside walls.
  for (const win of M.windows) {
    let best = null;
    for (const w of walls) {
      if (!w.ext) continue;
      const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L2 = dx * dx + dy * dy, u = Math.max(0, Math.min(1, ((win.x - w.a[0]) * dx + (win.y - w.a[1]) * dy) / (L2 || 1)));
      const dd = Math.hypot(w.a[0] + u * dx - win.x, w.a[1] + u * dy - win.y);
      if (dd < 0.4 && (!best || dd < best.dd)) best = { w, u, dd, L: Math.sqrt(L2) };
    }
    if (!best) continue;
    const { w } = best, dx = (w.b[0] - w.a[0]) / best.L, dy = (w.b[1] - w.a[1]) / best.L;
    let nx = -dy, ny = dx;
    if (rooms.some((r) => inside(win.x + nx * 0.3, win.y + ny * 0.3, r.pts))) [nx, ny] = [-nx, -ny];
    if (ny > 0.35) continue;
    // On the inside face of the wall, so it can be seen from the room.
    const ix = win.x - nx * 0.11, iy = win.y - ny * 0.11, hw = Math.min(win.w, 2.4) / 2;
    face([[ix - dx * hw, iy - dy * hw, 0.95], [ix + dx * hw, iy + dy * hw, 0.95], [ix + dx * hw, iy + dy * hw, 2.05], [ix - dx * hw, iy - dy * hw, 2.05]], "#BFE6FF", 'stroke-width="1.5"', -0.02);
  }
  // The furniture, as little blocks. A room with nothing in it from Husbyggeren gets the usual things.
  const BASIC = { kid: [["bed1", 0.25, 0.3, 0.9, 2], ["desk", 0.75, 0.15, 1.2, 0.6], ["toybox", 0.75, 0.75, 0.7, 0.4]], bath: [["tub", 0.5, 0.15, 1.7, 0.75], ["toilet", 0.85, 0.6, 0.4, 0.65], ["sink", 0.2, 0.8, 0.6, 0.45]], bed: [["bed2", 0.5, 0.3, 1.8, 2], ["wardrobe", 0.9, 0.7, 0.6, 1.4]], office: [["desk", 0.5, 0.2, 1.4, 0.7], ["ochair", 0.5, 0.45, 0.6, 0.6]], utility: [["wm", 0.3, 0.15, 0.6, 0.6], ["td", 0.6, 0.15, 0.6, 0.6]], hall: [["shoes", 0.5, 0.15, 0.8, 0.3]], kitchen: [["counter", 0.5, 0.1, 2.4, 0.62], ["table", 0.5, 0.6, 1.6, 0.9]], living: [["sofa", 0.5, 0.8, 2.3, 0.95], ["coffee", 0.5, 0.55, 1.2, 0.6], ["tvbench", 0.5, 0.12, 1.8, 0.4]] };
  for (const r of rooms) {
    if (M.furn.some((f) => inside(f.x, f.y, r.pts)) || !BASIC[r.look]) continue;
    const rxs = r.pts.map((q) => q[0]), rys = r.pts.map((q) => q[1]), ax = Math.min(...rxs), ay = Math.min(...rys), w = Math.max(...rxs) - ax, d = Math.max(...rys) - ay;
    for (const [k2, fx, fy, fw, fd] of BASIC[r.look]) {
      const f = { k: k2, x: ax + fx * w, y: ay + fy * d, w: Math.min(fw, w * 0.8), d: Math.min(fd, d * 0.7), rot: 0 };
      if (inside(f.x, f.y, r.pts)) M.furn.push(f);
    }
  }
  for (const f of M.furn) {
    if (!rooms.some((r) => inside(f.x, f.y, r.pts)) && !M.areas.some((a) => inside(f.x, f.y, a.pts))) continue;
    const [h, col] = FURN[f.k] || [0.75, "#1B1530"];
    if (f.k === "rug") {
      svg += poly([[f.x - f.w / 2, f.y - f.d / 2, 0.05], [f.x + f.w / 2, f.y - f.d / 2, 0.05], [f.x + f.w / 2, f.y + f.d / 2, 0.05], [f.x - f.w / 2, f.y + f.d / 2, 0.05]], col, 'stroke-width="1.5" opacity=".8"');
      continue;
    }
    if (f.k === "bed1" || f.k === "bed2" || f.k === "bunk") {
      // A bed: a frame, a duvet and a pillow at the head.
      block(f.x, f.y, f.w, f.d, f.rot, 0.3, "#C98B55");
      block(f.x, f.y, f.w * 0.92, f.d * 0.9, f.rot, 0.16, col, 0.3);
      const a = (f.rot * Math.PI) / 180;
      block(f.x - Math.sin(-a) * f.d * 0.36, f.y - Math.cos(a) * f.d * 0.36, f.w * 0.7, f.d * 0.16, f.rot, 0.12, "#FFFFFF", 0.46);
      if (f.k === "bunk") block(f.x, f.y, f.w, f.d, f.rot, 0.16, col, 1.4);
      continue;
    }
    if (f.k === "plant") {
      block(f.x, f.y, f.w * 0.7, f.d * 0.7, 0, 0.4, "#E5484D");
      tree(f.x, f.y, 0.9, Math.max(0.3, f.w * 0.7), "#6BCB77");
      continue;
    }
    if (f.k === "parasol" || f.k === "tramp") {
      // Round things in the garden, drawn facing us: a parasol on its pole, a trampoline on its legs.
      const R = Math.max(0.6, f.w / 2), top = f.k === "parasol" ? 2.2 : 0.6, [bx, by, dd] = P(f.x, f.y, 0.03), [tx, ty] = P(f.x, f.y, top), [ex] = P(f.x + R, f.y, top), [, ey] = P(f.x, f.y + R, top), rx = Math.abs(ex - tx), ry = Math.abs(ey - ty);
      faces.push([dd, f.k === "parasol"
        ? `<g pointer-events="none"><ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${(rx * 0.8).toFixed(1)}" ry="${(ry * 0.8).toFixed(1)}" fill="rgba(0,0,0,.12)"/><path d="M${bx.toFixed(1)} ${by.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}" stroke="${OL}" stroke-width="3"/><path d="M${(tx - rx).toFixed(1)} ${ty.toFixed(1)} Q${tx.toFixed(1)} ${(ty - ry * 1.6).toFixed(1)} ${(tx + rx).toFixed(1)} ${ty.toFixed(1)} Q${tx.toFixed(1)} ${(ty + ry * 0.5).toFixed(1)} ${(tx - rx).toFixed(1)} ${ty.toFixed(1)}Z" fill="#FFF6E6" stroke="${OL}" stroke-width="2"/><path d="M${tx.toFixed(1)} ${(ty - ry * 0.8).toFixed(1)} L${(tx - rx * 0.5).toFixed(1)} ${(ty + ry * 0.1).toFixed(1)} M${tx.toFixed(1)} ${(ty - ry * 0.8).toFixed(1)} L${(tx + rx * 0.5).toFixed(1)} ${(ty + ry * 0.1).toFixed(1)}" stroke="#E5484D" stroke-width="3"/></g>`
        : `<g pointer-events="none"><path d="M${(tx - rx * 0.7).toFixed(1)} ${ty.toFixed(1)} V${(by - ry * 0.3).toFixed(1)} M${(tx + rx * 0.7).toFixed(1)} ${ty.toFixed(1)} V${(by - ry * 0.3).toFixed(1)}" stroke="${OL}" stroke-width="3"/><ellipse cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="#4D96FF" stroke="${OL}" stroke-width="2"/><ellipse cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" rx="${(rx * 0.82).toFixed(1)}" ry="${(ry * 0.82).toFixed(1)}" fill="#2B2340"/></g>`]);
      continue;
    }
    if (f.k === "tv") {
      block(f.x, f.y, f.w, f.d, f.rot, 0.75, "#1B1530", 0.55, "#2E3A6E");
      continue;
    }
    block(f.x, f.y, f.w, f.d, f.rot, h, col);
  }
  // A tree or two in the garden.
  for (const a of M.areas.filter((q) => q.kind === "lawn").slice(0, 2)) {
    const lx = a.pts.map((q) => q[0]), ly = a.pts.map((q) => q[1]);
    tree(Math.max(...lx) - 1.2, Math.min(...ly) + 1.4, 2.2, 0.8);
    tree(Math.min(...lx) + 1.2, Math.max(...ly) - 1.2, 1.8, 0.7, "#5A9E5F");
  }
  faces.sort((a, b) => b[0] - a[0]);
  svg += faces.map((f) => f[1]).join("");
  // Tap a room: the whole floor, on top of everything. Then the signs.
  let taps = "", signs = "";
  const order = [...HL].sort((a, b) => centroid(a.pts)[1] - centroid(b.pts)[1]);
  for (const r of order) {
    const [cx, cy] = centroid(r.pts), [lx, ly] = P(cx, cy, 1.5);
    // The name when there is room for it on the floor, else just the picture. A child's room says the child's name.
    const nm = r.kid ? ctx.member(r.kid)?.name || r.name : r.name, rx = r.pts.map((q) => q[0]);
    const roomW = Math.abs(P(Math.max(...rx), cy, 0)[0] - P(Math.min(...rx), cy, 0)[0]), big = 30 + [...nm].length * 8.2 <= roomW * 1.05;
    const who = peers.filter((pe) => pe.space === (r.kid ? `room:${r.kid}` : `h:${r.id}`));
    const isHere = r.key && r.key === here, can = !!r.key;
    if (can) taps += `<polygon class="hz-tap${isHere ? " here" : ""}" points="${pts(r.pts.map(([x, y]) => [x, y, 0.04]))}" data-pl="go" data-k="${r.key}" role="button" aria-label="${r.name}"/>`;
    const text = big ? `${r.em} ${nm}` : r.em, wpx = big ? Math.min(220, 18 + [...nm].length * 8.2 + 26) : 40;
    signs += `<g class="hz-sign${isHere ? " here" : ""}${can ? "" : " off"}"${can ? ` data-pl="go" data-k="${r.key}" role="button" aria-label="${r.name}"` : ""}><path d="M${lx.toFixed(1)} ${(ly + 6).toFixed(1)} v16" stroke="${OL}" stroke-width="2.5"/><rect x="${(lx - wpx / 2).toFixed(1)}" y="${(ly - 24).toFixed(1)}" width="${wpx.toFixed(1)}" height="30" rx="15" fill="${r.kid ? "#C7E6FF" : "#FFFFFF"}" stroke="${OL}" stroke-width="2.5"/><text x="${lx.toFixed(1)}" y="${(ly - 4).toFixed(1)}" class="hz-t">${text}</text>${who.map((pe, j) => `<circle cx="${(lx + wpx / 2 - 4 - j * 12).toFixed(1)}" cy="${(ly - 26).toFixed(1)}" r="8" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="3"/>`).join("")}${isHere ? `<g class="hz-you"><circle cx="${(lx - wpx / 2 + 2).toFixed(1)}" cy="${(ly - 26).toFixed(1)}" r="11" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><text x="${(lx - wpx / 2 + 2).toFixed(1)}" y="${(ly - 21).toFixed(1)}" class="hz-yt">★</text></g>` : ""}</g>`;
  }
  // The garden's sign.
  const gw = peers.filter((pe) => pe.space === "have"), [gx, gy] = gardenKeys[0] || [x1 - 2.5, y1 - 2.5], [sx, sy] = P(gx, gy, 0.6);
  signs += `<g class="hz-sign${here === "have" ? " here" : ""}" data-pl="go" data-k="have" role="button" aria-label="${t("Haven")}"><rect x="${(sx - 56).toFixed(1)}" y="${(sy - 24).toFixed(1)}" width="112" height="30" rx="15" fill="#E8F8E0" stroke="${OL}" stroke-width="2.5"/><text x="${sx.toFixed(1)}" y="${(sy - 4).toFixed(1)}" class="hz-t">🌳 ${t("Haven")}</text>${gw.map((pe, j) => `<circle cx="${(sx + 52 - j * 12).toFixed(1)}" cy="${(sy - 26).toFixed(1)}" r="8" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="3"/>`).join("")}</g>`;
  const sky = `<linearGradient id="hz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD4FF"/><stop offset="1" stop-color="#E4F4FF"/></linearGradient>`;
  const hint = opts.hint ? `<text x="${W - 22}" y="38" class="hz-hint">${opts.hint}</text>` : "";
  return `<defs>${sky}</defs><rect width="${W}" height="${H}" fill="url(#hz-sky)"/><path d="M0 230 Q200 170 420 210 T840 190 T1000 200 V${H} H0Z" fill="#B5E3A8"/>${svg}${taps}${signs}${hint}`;
}

export const HOUSE3D_CSS = `
.hz-tap { fill: transparent; cursor: pointer; }
.hz-tap:hover, .hz-tap.here { fill: rgba(255,255,255,.22); }
.hz-sign { cursor: pointer; }
.hz-sign.off { cursor: default; opacity: .8; }
.hz-sign:hover rect { fill: #FFF3B0; }
.hz-sign.here rect { fill: #FFD93D; }
.hz-garden { cursor: pointer; }
.hz-t { font: 800 14px system-ui, sans-serif; fill: #2B2340; text-anchor: middle; }
.hz-yt { font: 900 13px system-ui, sans-serif; fill: #2B2340; text-anchor: middle; }
.hz-hint { font: 800 15px system-ui, sans-serif; fill: #2B2340; text-anchor: end; opacity: .75; paint-order: stroke; stroke: #fff; stroke-width: 4px; }
.hz-you { animation: hzpulse 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes hzpulse { 50% { transform: scale(1.18); } }
@media (prefers-reduced-motion: reduce) { .hz-you { animation: none; } }
`;
export const HOUSE3D_EN = { Depot: "Storeroom", Toilet: "Toilet", Gang: "Hallway", Gæsteværelse: "Guest room", Badeværelse: "Bathroom", "Walk-in": "Walk-in", Soveværelse: "Bedroom", Entré: "Entrance", Bryggers: "Utility room", Køkken: "Kitchen", Stue: "Living room", "Tryk på et rum for at gå derind": "Tap a room to go in" };
