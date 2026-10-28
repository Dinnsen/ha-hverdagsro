/* Hverdagsro – the house as one long row of rooms you walk through, like a doll's house seen from the front:
   - the rooms of the house (from the floor plan in Husbyggeren) stand side by side in a row, each as wide as it
     really is, with an open doorway in the wall between them, and the garden at the end;
   - the picture scrolls along as the figure walks (or when the room is dragged sideways), and the rooms next door
     are already there, to the left and the right: walk out at the end of one, and you are in the next.
   Places outside the house are one screen wide and are reached from the map. */
import * as World from "./hv-world.js";
import { OL, shade } from "./hv-playcat.js";

export const VW = 1000; // the width of the screen in the game's units
const MIN_W = 1000, MAX_W = 4800, ME_MIN = 1300;
const visitOf = (sid) => (String(sid).startsWith("visit:") ? sid.slice(6) : "");
/* The room of the floor plan a place of the game is. */
export function planRoom(ctx, sid, me) {
  const HR = World.houseRooms(ctx);
  if (sid === "vaerelse") return HR.find((h) => h.kid && h.kid === me) || null;
  if (visitOf(sid)) return HR.find((h) => h.kid === visitOf(sid)) || null;
  return HR.find((h) => h.id === sid) || null;
}
/* How wide a place is in the game. */
export function roomWidth(ctx, sid, me) {
  // A place of the world can be a wide room that scrolls, like the rooms of the house.
  const wide = World.PLACES?.[sid]?.width;
  if (wide) return Math.max(MIN_W, Math.min(MAX_W, wide));
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
/* How much wall two rooms share (in plan units). */
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
const keyOf = (h, me) => (h.kid ? (h.kid === me ? "vaerelse" : `visit:${h.kid}`) : h.id);
/* The order of the rooms in the row: a walk through the house that goes from room to room through the walls they
   share, as far as it can (a garage first, the garden last). The same for everyone in the family. */
let stripCache = null;
export function strip(ctx, me) {
  const HR = World.houseRooms(ctx).filter((h) => Array.isArray(h.room?.pts) && h.room.pts.length >= 3);
  const sig = HR.map((h) => h.id + ":" + h.room.pts.length).join(",") + "|" + me;
  if (stripCache && stripCache.sig === sig) return stripCache.list;
  const left = HR.slice().sort((a, b) => centre(a.room.pts)[0] - centre(b.room.pts)[0]);
  const list = [], done = new Set();
  let cur = left.find((h) => h.look === "garage") || left[0];
  while (cur) {
    list.push(cur);
    done.add(cur.id);
    const [cx, cy] = centre(cur.room.pts);
    const rest = HR.filter((h) => !done.has(h.id));
    if (!rest.length) break;
    const score = (h) => {
      const [x, y] = centre(h.room.pts), sh = shared(cur.room.pts, h.room.pts);
      return (sh > 36 ? 0 : 100000) + Math.hypot(x - cx, y - cy);
    };
    cur = rest.sort((a, b) => score(a) - score(b))[0];
  }
  const out = list.map((h) => ({ key: keyOf(h, me), name: h.kid ? ctx.t("{name}s værelse", { name: ctx.member(h.kid)?.name || "" }) : ctx.t(h.n), em: h.kid ? "🧸" : h.em }));
  out.push({ key: "have", name: ctx.t("Haven"), em: "🌳" });
  stripCache = { sig, list: out };
  return out;
}
/* The rooms either side of a place in the row: { left, right } (null at the ends). */
export function neighbours(ctx, sid, me) {
  const list = strip(ctx, me), i = list.findIndex((r) => r.key === sid);
  if (i < 0) return { left: null, right: null, list, i };
  return { left: list[i - 1] || null, right: list[i + 1] || null, list, i };
}
/* The doorways in the wall at the ends of the room: open, so the next room can be seen through them. */
export function doorwaySvg(side, rw, FLOOR, label) {
  const x = side === "left" ? 0 : rw, dir = side === "left" ? 1 : -1;
  // The wall between two rooms is a post you walk past; a little sign on it says where you are going.
  return `<g class="wk-way ${side}" pointer-events="none"><rect x="${x - 14}" y="-10" width="28" height="${FLOOR + 20}" fill="#F4EEE4" stroke="${OL}" stroke-width="4"/><rect x="${x - 14}" y="-10" width="28" height="${FLOOR + 20}" fill="url(#wk-post)" opacity=".5"/>${label ? `<g transform="translate(${x + dir * 92} 300)"><rect x="-78" y="-16" width="156" height="32" rx="16" fill="#fff" stroke="${OL}" stroke-width="3"/><text y="6" class="wk-t">${side === "left" ? "← " : ""}${label}${side === "right" ? " →" : ""}</text></g>` : ""}</g>`;
}
export const WALK_DEFS = `<pattern id="wk-post" width="8" height="24" patternUnits="userSpaceOnUse"><rect width="8" height="24" fill="none"/><path d="M0 12 h8" stroke="${shade("#F4EEE4", 0.9)}" stroke-width="3"/></pattern>`;

export const WALK_CSS = `
.wk-t { font: 800 15px system-ui, sans-serif; fill: #2B2340; text-anchor: middle; }
#pl-world { transition: transform .45s cubic-bezier(.3,.9,.4,1); }
#pl-world.now { transition: none; }
.wk-peek { opacity: .96; }
`;
