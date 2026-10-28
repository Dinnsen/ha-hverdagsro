/* Things to ride: the swings swing with whoever sits on them, the trampolines send whoever stands on them up in the air.
   The motion is SMIL (animateTransform), put into the drawing of the thing and into the figure on it with the same period,
   so both move together in every browser; they start at the same moment (the start of the page), so they never drift apart.
   A thing marks the parts that move: <g class="sw s0"> is a swing (rope and seat) and <g class="tp"> is the mat of a trampoline. */
const calm = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* swing: the pivots (where the ropes hang from, in the thing's own coordinates) of each seat, in the order of its seats.
   jump: the trampolines, with how high a jump goes. */
export const RIDE = {
  gyngestativ: { t: "swing", piv: [[-15, -236], [60, -236]] },
  havegynge: { t: "swing", piv: [[0, -210], [0, -210]], one: true },
  trampolin: { t: "jump", up: 110 },
  trampolinhave: { t: "jump", up: 150 },
};
export const ridable = (k) => !!RIDE[k];

const SWING_S = 2.4, JUMP_S = 0.85;
const swingAnim = (px, py, deg, add) =>
  `<animateTransform attributeName="transform" type="rotate" values="${-deg} ${px} ${py};${deg} ${px} ${py};${-deg} ${px} ${py}" keyTimes="0;.5;1" calcMode="spline" keySplines=".37 0 .63 1;.37 0 .63 1" dur="${SWING_S}s" repeatCount="indefinite"${add ? ' additive="sum"' : ""}/>`;

/* The thing itself while someone rides it: the part that moves gets its motion. i is the seat that is taken. */
export function moveThing(markup, it, i) {
  const R = RIDE[it.k];
  if (!R || calm()) return markup;
  if (R.t === "swing") {
    const [px, py] = R.piv[i] || R.piv[0];
    return markup.replace(R.one ? /<g class="sw s0">/ : new RegExp(`<g class="sw s${i}">`), (m) => m + swingAnim(px, py, 24, false));
  }
  return markup.replace(
    '<g class="tp">',
    `<g class="tp"><animateTransform attributeName="transform" type="translate" values="0 9;0 0;0 0;0 9" keyTimes="0;.14;.86;1" dur="${JUMP_S}s" repeatCount="indefinite"/>`,
  );
}

/* The figure on it, at room position (sx, sy): its own motion, added to the place it was put (translate(sx sy)). */
export function moveRider(it, i, sx, sy) {
  const R = RIDE[it.k];
  if (!R || calm()) return "";
  const sc = it.s || 1;
  if (R.t === "swing") {
    const [px, py] = R.piv[i] || R.piv[0];
    // a mirrored swing swings the other way round, so the figure turns the other way too
    return swingAnim((it.x + (it.f ? -px : px) * sc) - sx, it.y + py * sc - sy, it.f ? -24 : 24, true);
  }
  const up = -R.up * sc;
  return `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${up};0 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".215 .61 .355 1;.55 .055 .675 .19" dur="${JUMP_S}s" repeatCount="indefinite" additive="sum"/>`;
}
