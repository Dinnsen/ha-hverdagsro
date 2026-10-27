/* Hverdagsro – walking around the house in the game, like in a doll's house you can walk through:
   - every room of the house is as wide as it really is (from the floor plan in Husbyggeren), and the picture scrolls
     along when the figure walks (or when the room is dragged sideways);
   - the rooms that share a wall have doors: at the left and right ends of the room for the rooms beside it, and in
     the back wall for the rooms behind and in front. Walk out at an end, or through a door, and you are in the next
     room.
   Places outside the house are one screen wide and are reached from the map. */
import { esc } from "./hv-core.js";
import * as World from "./hv-world.js";
import { OL } from "./hv-playcat.js";

export const VW = 1000; // the width of the screen in the game's units
const MIN_W = 1000, MAX_W = 2400, ME_MIN = 1300;
const visitOf = (sid) => (String(sid).startsWith("visit:") ? sid.slice(6) : "");
/* The room of the floor plan a place of the game is. */
export function planRoom(ctx, sid, me) {
  const HR = World.houseRooms(ctx);
  if (sid === "vaerelse") return HR.find((h) => h.kid && h.kid === me) || null;
  if (visitOf(sid)) return HR.find((h) => h.kid === visitOf(sid)) || null;
  return HR.find((h) => h.id === sid) || null;
}
const bbox = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
/* How wide a place is in the game. */
export function roomWidth(ctx, sid, me) {
  const own = sid === "vaerelse" || !!visitOf(sid), h = (own || String(sid).startsWith("h:")) && planRoom(ctx, sid, me);
  const w = Math.max(own ? ME_MIN : MIN_W, h ? World.planWidth(h.room?.pts) : MIN_W);
  return Math.max(MIN_W, Math.min(MAX_W, w));
}
const inside = (x, y, pts) => {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) hit = !hit;
  }
  return hit;
};
const centre = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
/* How much wall two rooms share (in plan units): walk round one room and look just outside it. */
function shared(a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i++) {
    const [x1, y1] = a[i], [x2, y2] = a[(i + 1) % a.length], L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 1) continue;
    const nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    for (let s = 7.5; s < L; s += 15) {
      const px = x1 + ((x2 - x1) * s) / L, py = y1 + ((y2 - y1) * s) / L;
      if (inside(px + nx * 12, py + ny * 12, b) || inside(px - nx * 12, py - ny * 12, b)) n += 15;
    }
  }
  return n;
}
/* The key of the game's place for a room of the house. */
const keyOf = (h, me) => (h.kid ? (h.kid === me ? "vaerelse" : `visit:${h.kid}`) : h.id);
/* The rooms next door: { key, name, em, side: "left" | "right" | "wall", x }. */
export function neighbours(ctx, sid, me, rw) {
  const A = planRoom(ctx, sid, me);
  if (!A || !Array.isArray(A.room?.pts)) return [];
  const [ax0, , ax1] = bbox(A.room.pts), [acx, acy] = centre(A.room.pts);
  const list = [];
  for (const B of World.houseRooms(ctx)) {
    if (B.id === A.id || !Array.isArray(B.room?.pts) || B.room.pts.length < 3) continue;
    const s = shared(A.room.pts, B.room.pts);
    if (s < 36) continue;
    const [bcx, bcy] = centre(B.room.pts), dx = bcx - acx, dy = bcy - acy;
    list.push({ key: keyOf(B, me), name: B.kid ? ctx.t("{name}s værelse", { name: ctx.member(B.kid)?.name || "" }) : ctx.t(B.n), em: B.kid ? "🧸" : B.em, s, dir: Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "left" : "right") : "wall", f: Math.max(0.12, Math.min(0.88, (bcx - ax0) / (ax1 - ax0 || 1))) });
  }
  // One door at each end of the room; the rest in the back wall, spread out.
  list.sort((a, b) => b.s - a.s);
  let left = false, right = false;
  for (const n of list) {
    if (n.dir === "left" && !left) [n.side, left] = ["left", true];
    else if (n.dir === "right" && !right) [n.side, right] = ["right", true];
    else n.side = "wall";
  }
  const wall = list.filter((n) => n.side === "wall").sort((a, b) => a.f - b.f);
  wall.forEach((n, i) => {
    n.x = Math.round(160 + n.f * (rw - 320));
    if (i && n.x - wall[i - 1].x < 190) n.x = wall[i - 1].x + 190;
  });
  return list;
}
/* Where you come in, coming from a room: by its door. */
export function arrival(ctx, from, to, me, rw) {
  const n = neighbours(ctx, to, me, rw).find((x) => x.key === from);
  if (!n) return null;
  if (n.side === "left") return { x: 150, y: 590 };
  if (n.side === "right") return { x: rw - 150, y: 590 };
  return { x: Math.max(120, Math.min(rw - 120, n.x)), y: 520 };
}
/* The doors, drawn in the room. */
export function doorsSvg(ctx, list, rw, FLOOR) {
  return list.map((n) => {
    const label = `${n.em} ${n.name}`, lw = Math.min(260, 34 + [...label].length * 9.2);
    if (n.side === "wall") {
      const x = n.x;
      return `<g class="wk-door" data-pl="door" data-k="${esc(n.key)}" role="button" aria-label="${esc(n.name)}"><rect x="${x - 62}" y="${FLOOR - 262}" width="124" height="262" rx="8" fill="#C98B55" stroke="${OL}" stroke-width="5"/><rect x="${x - 50}" y="${FLOOR - 250}" width="100" height="250" rx="5" fill="#3A2E5A" opacity=".85"/><path d="M${x - 50} ${FLOOR} L${x - 50} ${FLOOR - 250} L${x + 34} ${FLOOR - 236} L${x + 34} ${FLOOR + 12}Z" fill="#E8C69A" stroke="${OL}" stroke-width="4"/><circle cx="${x + 20}" cy="${FLOOR - 120}" r="6" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><rect x="${x - lw / 2}" y="${FLOOR - 304}" width="${lw}" height="32" rx="16" fill="#fff" stroke="${OL}" stroke-width="3"/><text x="${x}" y="${FLOOR - 282}" class="wk-t">${esc(label)}</text></g>`;
    }
    const left = n.side === "left", x = left ? 0 : rw;
    return `<g class="wk-door edge" data-pl="door" data-k="${esc(n.key)}" role="button" aria-label="${esc(n.name)}"><path d="M${x} ${FLOOR - 270} H${left ? 46 : rw - 46} V${FLOOR + 30} H${x}Z" fill="#C98B55" stroke="${OL}" stroke-width="5"/><path d="M${x} ${FLOOR - 258} H${left ? 34 : rw - 34} V${FLOOR + 22} H${x}Z" fill="#3A2E5A" opacity=".85"/><g transform="translate(${left ? 24 : rw - 24} ${FLOOR + 84})"><rect x="${left ? -10 : 10 - lw - 26}" y="-18" width="${lw + 16}" height="36" rx="18" fill="#FFD93D" stroke="${OL}" stroke-width="3"/><text x="${left ? lw / 2 - 2 : 2 - lw / 2 - 16}" y="6" class="wk-t">${left ? "←" : ""} ${esc(label)} ${left ? "" : "→"}</text></g></g>`;
  }).join("");
}

export const WALK_CSS = `
.wk-door { cursor: pointer; }
.wk-door:hover > rect:first-child, .wk-door:hover > path:first-child { filter: brightness(1.08); }
.wk-t { font: 800 16px system-ui, sans-serif; fill: #2B2340; text-anchor: middle; }
#pl-world { transition: transform .45s cubic-bezier(.3,.9,.4,1); }
#pl-world.now { transition: none; }
`;
