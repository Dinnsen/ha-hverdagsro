/* Hverdagsro – the living sky in the header: time of day, weather, sun and moon, the house,
   the bins on collection day and decorations for the family's occasions. Canvas, no dependencies. */
import { BIG } from "./hv-decor.js";

export const WX = { rain: { over: .62, clouds: 10, drops: 1 }, cloudy: { over: .42, clouds: 8, drops: 0 }, partly: { over: .2, clouds: 6, drops: 0 }, sun: { over: 0, clouds: 3, drops: 0 }, snow: { over: .45, clouds: 8, drops: 2 } };
export const weatherKind = (state) => ({ rainy: "rain", pouring: "rain", "lightning-rainy": "rain", lightning: "rain", hail: "rain", snowy: "snow", "snowy-rainy": "snow", cloudy: "cloudy", fog: "cloudy", windy: "cloudy", "windy-variant": "cloudy", partlycloudy: "partly", sunny: "sun", "clear-night": "sun", exceptional: "cloudy" })[state] || "partly";

/* opts: { decor() → [{key, who, a, b, d0}], alarm() → {state, color, speed} | null, waste() → [{body, lid, label, soon}],
           house: bool, car() → {charging} | null, wasteButton: element } */
export function createSky(cv, opts) {
  const cx = cv.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const realNow = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  let W = 0, H = 0, DPR = 1, stars = [], clouds = [], drops = [], running = false, raf = 0;
  let hour = realNow(), manualHour = false, RISE = 7.5, SET = 17;
  let weather = "partly", wx = WX.partly;
  let WASTE_HIT = null;
  const decorActive = () => opts.decor();
  const decorHas = (k) => decorActive().filter((e) => e.key === k);
function seed() {
  stars = Array.from({ length: 140 }, () => ({ x: rnd(0, 1), y: rnd(0, .55), r: rnd(.4, 1.4), p: rnd(0, 6.3) }));
  clouds = Array.from({ length: 12 }, () => ({ x: rnd(-200, 1400), y: rnd(.05, .42), s: rnd(.6, 1.5), v: rnd(4, 14) }));
  drops = Array.from({ length: 400 }, () => ({ x: rnd(0, 1600), y: rnd(-600, 600), v: rnd(380, 620), l: rnd(9, 18), r: rnd(1, 2.6), ph: rnd(0, 6.3) }));
}
seed();
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect(); if (!r.width) return;
  if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1) return;
  W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = (c, a = 1) => `rgba(${c.map(Math.round).join(",")},${a})`;
const grey = c => { const l = c[0] * .3 + c[1] * .59 + c[2] * .11; return [l * .96, l, l * 1.07]; };
const KF = () => [[0,"#0B1030","#1A2350"],[RISE-1.3,"#0E1538","#27305E"],[RISE-.2,"#3D3F7A","#F09F7E"],[RISE+.9,"#5E9BE3","#F5D2A6"],[12,"#3C8BDF","#A8D6F2"],[SET-1.4,"#5A8DD6","#F2C68E"],[SET,"#4A4A8E","#EE896B"],[SET+.9,"#1D2150","#4A3D7A"],[24,"#0B1030","#1A2350"]];
function skyColors(h) {
  const K = KF();
  for (let i = 0; i < K.length - 1; i++) if (h >= K[i][0] && h <= K[i + 1][0]) { const t = (h - K[i][0]) / (K[i + 1][0] - K[i][0]); return [mix(hex(K[i][1]), hex(K[i + 1][1]), t), mix(hex(K[i][2]), hex(K[i + 1][2]), t)]; }
  return [hex("#0B1030"), hex("#1A2350")];
}
const sunElev = h => (h >= RISE && h <= SET) ? Math.sin(Math.PI * (h - RISE) / (SET - RISE)) : -Math.min(1, Math.min(Math.abs(h - SET), Math.abs(RISE - h), Math.abs(RISE + 24 - h)) / 3);
const hill = (x, base, amp, f, ph) => base + amp * Math.sin(x * f + ph) + amp * .45 * Math.sin(x * f * 2.3 + ph * 1.7);
let last = performance.now();
function frame(now) { if (!running) return; const dt = Math.min(.05, (now - last) / 1000); last = now; if (!manualHour) hour = realNow(); resize(); draw(dt, now / 1000); if (!reduceMotion) raf = requestAnimationFrame(frame); }
function draw(dt, T) {
  if (!W) return;
  const mini = H < 120, el = sunElev(hour), dark = Math.max(0, Math.min(1, (.18 - el) / .42));
  let [top, bot] = skyColors(hour); top = mix(top, grey(top), wx.over); bot = mix(bot, grey(bot), wx.over * .9);
  const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot)); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  const sa = dark * (1 - wx.over * .85);
  if (sa > .02) for (const s of stars) { cx.fillStyle = `rgba(255,255,255,${sa * (.55 + .45 * Math.sin(T * 2 + s.p))})`; cx.beginPath(); cx.arc(s.x * W, s.y * Math.max(H, 300), s.r, 0, 7); cx.fill(); }
  const SH = mini ? 260 : H, horizon = SH * .78;
  if (hour >= RISE - .3 && hour <= SET + .3) {
    const p = (hour - RISE) / (SET - RISE), x = W * (.06 + .88 * p), y = horizon - Math.max(el, -.05) * SH * .62, vis = 1 - wx.over * .95;
    const gl = cx.createRadialGradient(x, y, 0, x, y, 120); gl.addColorStop(0, `rgba(255,230,170,${.55 * vis})`); gl.addColorStop(1, "rgba(255,230,170,0)"); cx.fillStyle = gl; cx.fillRect(x - 130, y - 130, 260, 260);
    cx.fillStyle = `rgba(255,${Math.round(214 + 30 * el)},${Math.round(130 + 80 * el)},${.2 + .8 * vis})`; cx.beginPath(); cx.arc(x, y, 26, 0, 7); cx.fill();
  } else {
    const nh = hour < RISE ? hour + 24 : hour, p = (nh - SET) / (RISE + 24 - SET), x = W * (.1 + .8 * p), y = horizon - Math.sin(Math.PI * p) * SH * .5;
    cx.fillStyle = `rgba(236,238,255,${.9 - wx.over * .6})`; cx.beginPath(); cx.arc(x, y, 18, 0, 7); cx.fill(); cx.fillStyle = rgb(top); cx.beginPath(); cx.arc(x + 8, y - 5, 16, 0, 7); cx.fill();
  }
  const cc = mix(mix(hex("#FFFFFF"), hex("#C5CBD7"), Math.min(1, wx.over * 1.2)), hex("#39405F"), dark);
  clouds.forEach((c, i) => {
    c.x += c.v * dt * (weather === "rain" ? 1.6 : 1); if (c.x > W + 220) c.x = -220; if (i >= wx.clouds) return;
    cx.fillStyle = rgb(cc, (i < 3 && weather === "sun") ? .55 : .62 + wx.over * .32);
    const s = c.s * (W < 600 ? .75 : 1) * (mini ? .7 : 1), y = mini ? c.y * 140 : c.y * H;
    cx.beginPath(); [[0,0,34],[30,-14,30],[62,-4,34],[92,6,24],[-28,8,22],[50,14,28],[18,14,26]].forEach(([dx, dy, r]) => { cx.moveTo(c.x + dx * s + r * s, y + dy * s); cx.arc(c.x + dx * s, y + dy * s, r * s, 0, 7); }); cx.fill();
  });
  drawDecorSky(dt, T, dark, mini);
  if (!mini) {
    [["#8CCBBF","#22324F",.70,16,.006,1],["#46A69C","#1A263F",.80,13,.009,2.6],["#1F7470","#111A2E",.90,10,.013,4.1]].forEach(([d, n, b, amp, f, ph], li) => {
      const col = mix(mix(hex(d), grey(hex(d)), wx.over * .45), hex(n), dark); cx.fillStyle = rgb(col); cx.beginPath(); cx.moveTo(0, H);
      for (let x = 0; x <= W + 8; x += 8) cx.lineTo(x, hill(x, H * b, amp, f, ph)); cx.lineTo(W, H); cx.fill();
      if (li === 1) drawHouse(dark);
    });
  } else {
    const col = mix(hex("#1F7470"), hex("#111A2E"), dark); cx.fillStyle = rgb(col, .5); cx.beginPath(); cx.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 8) cx.lineTo(x, hill(x, H * .88, 5, .01, 1)); cx.lineTo(W, H); cx.fill();
  }
  if (wx.drops === 1) {
    cx.strokeStyle = `rgba(220,232,255,${.38 + dark * .1})`; cx.lineWidth = 1.2; cx.beginPath();
    const n = Math.min(drops.length, Math.round(W / 4));
    for (let i = 0; i < n; i++) { const d = drops[i]; d.y += d.v * dt; d.x -= d.v * dt * .18; if (d.y > H) { d.y = rnd(-40, 0); d.x = rnd(0, W + 80); } cx.moveTo(d.x, d.y); cx.lineTo(d.x + d.l * .18, d.y - d.l); }
    cx.stroke();
  } else if (wx.drops === 2) {
    cx.fillStyle = "rgba(255,255,255,.85)";
    const n = Math.min(drops.length, Math.round(W / 6));
    for (let i = 0; i < n; i++) { const d = drops[i]; d.y += d.v * dt * .09; d.x += Math.sin(T + d.ph) * .4; if (d.y > H) { d.y = rnd(-20, 0); d.x = rnd(0, W); } cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 7); cx.fill(); }
  }
}

/* ===================== Pynt i himlen ===================== */
const gY = xx => hill(xx, H * .80, 13, .009, 2.6) + 4;
let FW = [], CONF = [];
function dk(px, py, w, h, wave, T, ph = 0) {
  // Dannebrog som vajende strimler: rød dug og hvidt kors (12/37 fra stangen, 4/28 bredt)
  const n = 10, sw = w / n;
  for (let i = 0; i < n; i++) { const u = i / n, off = Math.sin(T * 5 + ph + i * .7) * wave * u, x0 = px + i * sw, y0 = py + off;
    cx.fillStyle = "#C8102E"; cx.fillRect(x0, y0, sw + .6, h);
    cx.fillStyle = "#fff"; cx.fillRect(x0, y0 + h * 12 / 28, sw + .6, h * 4 / 28);
    if (u >= 12 / 37 - .001 && u < 16 / 37) cx.fillRect(x0, y0, sw + .6, h); }
}
function roofPts(x, base, w, h, sag, step) {
  const L = [x - w / 2 - 8, base - h + 2], A = [x, base - h - 34], R = [x + w / 2 + 8, base - h + 2], pts = [];
  [[L, A], [A, R]].forEach(([p0, p1]) => { const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), n = Math.max(2, Math.round(len / step)); for (let i = 0; i <= n; i++) { const t = i / n; pts.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t + Math.sin(Math.PI * t) * sag]); } });
  return pts;
}
function glow(px, py, r, col, a) { const g = cx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, rgb(col, a)); g.addColorStop(1, rgb(col, 0)); cx.fillStyle = g; cx.fillRect(px - r, py - r, r * 2, r * 2); }
function pumpkin(px, py, r, dark, T, ph) {
  cx.fillStyle = "#E8711C"; cx.beginPath(); cx.ellipse(px, py - r, r * 1.25, r, 0, 0, 7); cx.fill();
  cx.strokeStyle = "rgba(150,60,10,.55)"; cx.lineWidth = 1; [-.5, 0, .5].forEach(k => { cx.beginPath(); cx.ellipse(px + k * r * .7, py - r, r * .35, r * .96, 0, 0, 7); cx.stroke(); });
  cx.fillStyle = "#4D6B2A"; cx.fillRect(px - 1.2, py - r * 2 - 3, 2.4, 4);
  const fl = .75 + .25 * Math.sin(T * 9 + ph) * Math.sin(T * 4.3 + ph * 2), lit = dark > .25;
  if (lit) glow(px, py - r, r * 3.2, [255, 170, 60], .35 * fl * dark);
  cx.fillStyle = lit ? `rgba(255,${200 + 40 * fl},90,${.9})` : "#5A2A0A";
  cx.beginPath(); cx.moveTo(px - r * .62, py - r * 1.25); cx.lineTo(px - r * .3, py - r * 1.25); cx.lineTo(px - r * .46, py - r * 1.6); cx.closePath();
  cx.moveTo(px + r * .3, py - r * 1.25); cx.lineTo(px + r * .62, py - r * 1.25); cx.lineTo(px + r * .46, py - r * 1.6); cx.closePath(); cx.fill();
  cx.beginPath(); cx.moveTo(px - r * .7, py - r * .85); cx.quadraticCurveTo(px, py - r * .2, px + r * .7, py - r * .85); cx.lineTo(px + r * .4, py - r * .7); cx.lineTo(px + r * .2, py - r * .9); cx.lineTo(px, py - r * .6); cx.lineTo(px - r * .2, py - r * .9); cx.lineTo(px - r * .4, py - r * .7); cx.closePath(); cx.fill();
}
function bat(bx, by, s, flap) {
  const f = Math.sin(flap) * .6;
  cx.beginPath(); cx.moveTo(bx, by);
  cx.quadraticCurveTo(bx - s * .6, by - s * (.5 + f), bx - s * 1.5, by - s * f * 1.2);
  cx.quadraticCurveTo(bx - s * 1.1, by + s * .05, bx - s * .9, by + s * .3);
  cx.quadraticCurveTo(bx - s * .5, by + s * .05, bx, by + s * .35);
  cx.quadraticCurveTo(bx + s * .5, by + s * .05, bx + s * .9, by + s * .3);
  cx.quadraticCurveTo(bx + s * 1.1, by + s * .05, bx + s * 1.5, by - s * f * 1.2);
  cx.quadraticCurveTo(bx + s * .6, by - s * (.5 + f), bx, by); cx.fill();
  cx.beginPath(); cx.arc(bx, by + s * .1, s * .28, 0, 7); cx.fill();
}
function witch(x, y, s, T) {
  cx.save(); cx.translate(x, y); cx.scale(s, s); cx.rotate(-.08 + Math.sin(T * 1.6) * .05); cx.fillStyle = "#1B1530"; cx.strokeStyle = "#1B1530";
  cx.lineWidth = 2.2; cx.lineCap = "round"; cx.beginPath(); cx.moveTo(-34, 8); cx.lineTo(26, 2); cx.stroke();
  cx.fillStyle = "#6B4A2B"; cx.beginPath(); cx.moveTo(-34, 8); cx.lineTo(-50, 1); cx.lineTo(-52, 9); cx.lineTo(-48, 16); cx.closePath(); cx.fill();
  cx.fillStyle = "#1B1530"; const fl = Math.sin(T * 8) * 3; cx.beginPath(); cx.moveTo(-6, 4); cx.lineTo(-22 - fl, 10); cx.lineTo(-14, -2); cx.lineTo(-4, -12); cx.lineTo(6, -10); cx.lineTo(8, 4); cx.closePath(); cx.fill();
  cx.beginPath(); cx.arc(4, -16, 4.6, 0, 7); cx.fill(); cx.beginPath(); cx.moveTo(-6, -18); cx.lineTo(14, -18); cx.lineTo(3, -36); cx.closePath(); cx.fill();
  cx.strokeStyle = "#1B1530"; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(6, -6); cx.lineTo(14, 2); cx.stroke(); cx.restore();
}
function heart(hx, hy, s) { cx.beginPath(); cx.moveTo(hx, hy + s * .35); cx.bezierCurveTo(hx - s * 1.1, hy - s * .35, hx - s * .45, hy - s * 1.05, hx, hy - s * .45); cx.bezierCurveTo(hx + s * .45, hy - s * 1.05, hx + s * 1.1, hy - s * .35, hx, hy + s * .35); cx.fill(); }
const FWC = [[255, 90, 90], [255, 210, 80], [120, 200, 255], [190, 130, 255], [120, 240, 170], [255, 255, 255]];
function drawDecorSky(dt, T, dark, mini) {
  const L = decorActive(); if (!L.length) return;
  const keys = new Set(L.map(e => e.key));
  if (keys.has("halloween")) {
    cx.fillStyle = `rgba(${mix([40, 30, 55], [10, 8, 18], dark).map(Math.round).join(",")},.92)`;
    for (let i = 0; i < 6; i++) { const sp = 26 + i * 7, bx = ((T * sp + i * 230) % (W + 160)) - 80, by = (mini ? H * .45 : H * (.16 + i * .045)) + Math.sin(T * 1.3 + i * 2) * (mini ? 8 : 18); bat(bx, by, mini ? 5 : 6 + (i % 3) * 2, T * 14 + i); }
  }
  if (keys.has("nytaar")) {
    if (!reduceMotion && Math.random() < dt * (mini ? .9 : 1.4) && FW.length < 7) { const col = FWC[Math.floor(Math.random() * FWC.length)], n = 26 + Math.floor(Math.random() * 14); FW.push({ x: W * (.08 + Math.random() * .84), y: (mini ? H * (.25 + Math.random() * .35) : H * (.1 + Math.random() * .32)), t: 0, col, n, sp: 46 + Math.random() * 40 }); }
    cx.save(); cx.globalCompositeOperation = dark > .3 ? "lighter" : "source-over";
    FW = FW.filter(f => (f.t += dt) < 1.8);
    FW.forEach(f => { const a = (1 - f.t / 1.8) * (.45 + .55 * dark); if (f.t < .12) glow(f.x, f.y, 26, f.col, a);
      for (let i = 0; i < f.n; i++) { const ang = i / f.n * Math.PI * 2, r = f.sp * (1 - Math.exp(-f.t * 2.6)) * (mini ? .55 : 1), px = f.x + Math.cos(ang) * r, py = f.y + Math.sin(ang) * r + f.t * f.t * 14;
        cx.fillStyle = rgb(f.col, a * (.7 + .3 * Math.sin(T * 30 + i))); cx.beginPath(); cx.arc(px, py, 1.6, 0, 7); cx.fill(); } });
    cx.restore();
  }
  if (keys.has("fastelavn") || keys.has("fodselsdag")) {
    if (!reduceMotion && CONF.length < (mini ? 24 : 46) && Math.random() < dt * 14) CONF.push({ x: Math.random() * W, y: -6, v: 18 + Math.random() * 22, r: Math.random() * 6, c: ["#F43F5E", "#F59E0B", "#10B981", "#3B82F6", "#A855F7", "#fff"][Math.floor(Math.random() * 6)] });
    CONF = CONF.filter(c => (c.y += c.v * dt) < H + 6);
    CONF.forEach(c => { cx.save(); cx.translate(c.x + Math.sin(T * 2 + c.r) * 6, c.y); cx.rotate(T * 3 + c.r); cx.fillStyle = c.c; cx.globalAlpha = .85; cx.fillRect(-2.5, -1.2, 5, 2.4); cx.restore(); });
  }
  if (keys.has("sankthans")) { const sp = 34, wx0 = ((T * sp) % (W + 260)) - 130, wy = (mini ? H * .42 : H * .2) + Math.sin(T * 1.6) * (mini ? 5 : 12);
    for (let i = 1; i < 14; i++) { cx.fillStyle = `rgba(255,${180 + i * 4},90,${(1 - i / 14) * .8})`; cx.beginPath(); cx.arc(wx0 - 30 - i * 7 + Math.sin(T * 6 + i) * 2, wy + 6 + Math.sin(T * 3 + i) * 3, 1.6 - i * .08, 0, 7); cx.fill(); }
    glow(wx0, wy - 8, mini ? 26 : 48, [255, 226, 160], .22 + .35 * dark); witch(wx0, wy, mini ? .7 : 1.45, T); }
  if (keys.has("bryllup") || keys.has("aarsdag")) { for (let i = 0; i < 18; i++) { const tw = .5 + .5 * Math.sin(T * 3 + i * 1.7); cx.fillStyle = keys.has("bryllup") ? `rgba(255,224,140,${tw * .8})` : `rgba(255,140,170,${tw * .7})`; const px = (i * 97.3) % W, py = (mini ? (i * 13) % H : (i * 41.7) % (H * .5)); cx.beginPath(); cx.arc(px, py, 1.4 + tw, 0, 7); cx.fill(); } }
  if (mini && keys.has("valentin")) { cx.fillStyle = "rgba(236,72,153,.7)"; for (let i = 0; i < 6; i++) { const t = (T * .12 + i / 6) % 1; heart(W * (.1 + i * .15) + Math.sin(T + i) * 10, H - t * H, 4); } }
}
function drawDecorHouse(x, base, w, h, dark, T) {
  const L = decorActive(); if (!L.length) return;
  const keys = new Set(L.map(e => e.key)), slot = x - w / 2 - 92, sg = gY(slot), lights = dark > .2;
  // Jul: lyskæde på taget, juletræ med stjerne, julestjerne i vinduet
  if (keys.has("jul")) {
    const ty = sg; cx.fillStyle = "#5B3A1E"; cx.fillRect(slot - 2.5, ty - 8, 5, 8);
    [[0, 20, 13], [-10, 16, 10], [-19, 12, 7]].forEach(([dy, hw, hh], k) => { cx.fillStyle = rgb(mix(hex("#1F7A3F"), hex("#0E3D24"), dark * .7)); cx.beginPath(); cx.moveTo(slot - hw, ty - 6 + dy); cx.lineTo(slot, ty - 6 + dy - hh - 8); cx.lineTo(slot + hw, ty - 6 + dy); cx.closePath(); cx.fill(); });
    const top = ty - 45; if (lights) glow(slot, top, 16, [255, 214, 90], .55 * dark);
    cx.fillStyle = "#FFD45A"; cx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.4 : 5.5, a = -Math.PI / 2 + i * Math.PI / 5; cx.lineTo(slot + Math.cos(a) * r, top + Math.sin(a) * r); } cx.closePath(); cx.fill();
    [[-8, -10], [6, -12], [-3, -20], [9, -4], [-13, -3], [2, -29], [-5, -33]].forEach(([dx, dy], i) => { const tw = .5 + .5 * Math.sin(T * 3 + i * 1.7); cx.fillStyle = rgb(FWC[i % 4], lights ? .55 + .45 * tw : .9); cx.beginPath(); cx.arc(slot + dx, ty + dy, 1.6, 0, 7); cx.fill(); });
    const pts = roofPts(x, base, w, h, 3, 7); cx.strokeStyle = "rgba(20,30,20,.6)"; cx.lineWidth = 1; cx.beginPath(); pts.forEach(([px, py], i) => i ? cx.lineTo(px, py) : cx.moveTo(px, py)); cx.stroke();
    pts.forEach(([px, py], i) => { const col = [[255, 70, 70], [80, 220, 120], [255, 210, 80], [90, 170, 255]][i % 4], tw = .45 + .55 * Math.abs(Math.sin(T * 2.2 + i * .9)); if (lights) glow(px, py + 2.5, 7, col, .5 * tw * dark); cx.fillStyle = rgb(col, lights ? .4 + .6 * tw : .95); cx.beginPath(); cx.arc(px, py + 2.5, 1.9, 0, 7); cx.fill(); });
    const sx = x - 23, sy = base - 28.5; if (lights) glow(sx, sy, 12, [255, 245, 220], .6 * dark); cx.fillStyle = lights ? "#FFF6DD" : "#F1E7C9"; cx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2 : 5, a = -Math.PI / 2 + i * Math.PI / 5; cx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } cx.closePath(); cx.fill();
  }
  // Halloween: lysende græskar foran huset
  if (keys.has("halloween")) { pumpkin(x - 20, base, 6.5, dark, T, 0); pumpkin(x + 3, base, 4.5, dark, T, 4); pumpkin(x + 23, base, 5.5, dark, T, 2); }
  // Påske: påskeliljer foran huset og en påskegren med æg
  if (keys.has("paaske")) {
    for (let i = 0; i < 7; i++) { const fx = x - w / 2 + 6 + i * 13.5, sw = Math.sin(T * 1.6 + i) * 1.5; cx.strokeStyle = "#3F8F3A"; cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(fx, base); cx.quadraticCurveTo(fx + 1, base - 8, fx + sw, base - 15); cx.stroke();
      cx.fillStyle = "#FFD93B"; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .3; cx.beginPath(); cx.ellipse(fx + sw + Math.cos(a) * 3, base - 16 + Math.sin(a) * 3, 2.6, 1.5, a, 0, 7); cx.fill(); } cx.fillStyle = "#F28C1B"; cx.beginPath(); cx.arc(fx + sw, base - 16, 1.8, 0, 7); cx.fill(); }
    cx.strokeStyle = "#6B4A2B"; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(slot, sg); cx.lineTo(slot, sg - 40); cx.stroke(); cx.lineWidth = 1.3;
    const br = [[-16, -34], [14, -38], [-12, -22], [12, -24], [-6, -44], [7, -46]]; br.forEach(([dx, dy]) => { cx.beginPath(); cx.moveTo(slot, sg + dy + 10); cx.quadraticCurveTo(slot + dx * .5, sg + dy, slot + dx, sg + dy - 4); cx.stroke(); });
    const ec = ["#F472B6", "#60A5FA", "#FBBF24", "#34D399", "#A78BFA", "#F87171"];
    br.forEach(([dx, dy], i) => { const ex = slot + dx * .8 + Math.sin(T * 2 + i) * 1.2, ey = sg + dy + 3; cx.strokeStyle = "rgba(255,255,255,.5)"; cx.lineWidth = .7; cx.beginPath(); cx.moveTo(slot + dx * .8, sg + dy - 2); cx.lineTo(ex, ey - 3); cx.stroke(); cx.fillStyle = ec[i]; cx.beginPath(); cx.ellipse(ex, ey, 2.6, 3.4, 0, 0, 7); cx.fill(); cx.fillStyle = "rgba(255,255,255,.75)"; cx.fillRect(ex - 2.4, ey - .5, 4.8, 1); });
    [[slot + 20, 0], [slot + 30, 3], [slot - 18, 1]].forEach(([ex], i) => { const ey = gY(ex); cx.fillStyle = ec[(i + 2) % 6]; cx.beginPath(); cx.ellipse(ex, ey - 3.6, 3, 3.8, .2, 0, 7); cx.fill(); });
  }
  // Fastelavn: tønde med kat i et stativ og en flagranke i mange farver
  if (keys.has("fastelavn")) {
    cx.strokeStyle = "#7A5230"; cx.lineWidth = 2.4; cx.beginPath(); cx.moveTo(slot - 18, sg); cx.lineTo(slot - 18, sg - 46); cx.lineTo(slot + 18, sg - 46); cx.lineTo(slot + 18, sg); cx.stroke();
    const sw = Math.sin(T * 1.8) * .18; cx.save(); cx.translate(slot, sg - 46); cx.rotate(sw); cx.strokeStyle = "#D6C29A"; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, 10); cx.stroke();
    cx.fillStyle = "#B7793A"; cx.beginPath(); cx.ellipse(0, 20, 9, 11, 0, 0, 7); cx.fill(); cx.strokeStyle = "#5B3A1E"; cx.lineWidth = 1.4; [13, 27].forEach(yy => { cx.beginPath(); cx.moveTo(-8.6, yy); cx.lineTo(8.6, yy); cx.stroke(); });
    cx.fillStyle = "#1B1530"; cx.beginPath(); cx.ellipse(0, 22, 3.6, 2.6, 0, 0, 7); cx.arc(0, 18, 2.2, 0, 7); cx.fill(); cx.beginPath(); cx.moveTo(-2, 16.6); cx.lineTo(-1.4, 14.6); cx.lineTo(-.6, 16.4); cx.moveTo(2, 16.6); cx.lineTo(1.4, 14.6); cx.lineTo(.6, 16.4); cx.fill(); cx.restore();
    const pts = roofPts(x, base, w, h, 5, 8), cols = ["#F43F5E", "#F59E0B", "#10B981", "#3B82F6", "#A855F7"]; cx.strokeStyle = "rgba(255,255,255,.6)"; cx.lineWidth = .8; cx.beginPath(); pts.forEach(([px, py], i) => i ? cx.lineTo(px, py) : cx.moveTo(px, py)); cx.stroke();
    pts.forEach(([px, py], i) => { if (i === pts.length - 1) return; const fl = Math.sin(T * 3 + i) * 1.2; cx.fillStyle = cols[i % 5]; cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px + 6, py); cx.lineTo(px + 3 + fl, py + 7); cx.closePath(); cx.fill(); });
  }
  // Fødselsdag og grundlovsdag: Dannebrog på flagstangen; fødselsdag også flagranke og balloner
  if (keys.has("fodselsdag") || keys.has("grundlov")) {
    const top = sg - 68; cx.fillStyle = "#E8E8EE"; cx.fillRect(slot - 1.2, top, 2.4, 68); cx.fillStyle = "#E3B341"; cx.beginPath(); cx.arc(slot, top - 1, 2.4, 0, 7); cx.fill();
    dk(slot + 1.2, top + 2, 30, 21, 3, T);
  }
  if (keys.has("fodselsdag")) {
    const pts = roofPts(x, base, w, h, 4, 9); cx.strokeStyle = "rgba(255,255,255,.7)"; cx.lineWidth = .8; cx.beginPath(); pts.forEach(([px, py], i) => i ? cx.lineTo(px, py) : cx.moveTo(px, py)); cx.stroke();
    pts.forEach(([px, py], i) => { if (i === pts.length - 1) return; dk(px, py, 7, 5.2, .6, T, i); });
    const ax = x + w / 2 - 4, ay = base - 14; [["#F43F5E", -14, 0], ["#3B82F6", -2, 1.3], ["#F59E0B", 10, 2.6]].forEach(([c, dx, ph]) => { const bx = ax + dx + Math.sin(T * 1.4 + ph) * 3, by = base - h - 26 + Math.sin(T * 1.1 + ph) * 3 + Math.abs(dx) * .4;
      cx.strokeStyle = "rgba(255,255,255,.7)"; cx.lineWidth = .7; cx.beginPath(); cx.moveTo(ax, ay); cx.quadraticCurveTo(ax + dx * .3, (ay + by) / 2, bx, by + 7); cx.stroke();
      cx.fillStyle = c; cx.beginPath(); cx.ellipse(bx, by, 5.5, 7, 0, 0, 7); cx.fill(); cx.fillStyle = "rgba(255,255,255,.45)"; cx.beginPath(); cx.ellipse(bx - 2, by - 2.5, 1.4, 2.2, -.4, 0, 7); cx.fill(); });
  }
  // Sankt Hans: bål på bakken
  if (keys.has("sankthans")) {
    const bx = W * .42, by = gY(bx) - 4; glow(bx, by - 10, 60, [255, 140, 40], .25 + .45 * dark);
    cx.strokeStyle = "#4A2E18"; cx.lineWidth = 3; [[-12, 4, 10, -6], [12, 4, -10, -6], [-8, 4, 6, -12]].forEach(([a, b, c2, d]) => { cx.beginPath(); cx.moveTo(bx + a, by + b); cx.lineTo(bx + c2, by + d); cx.stroke(); });
    for (let i = 0; i < 6; i++) { const fh = 16 + 8 * Math.sin(T * 7 + i * 1.9), fx = bx + (i - 2.5) * 3.2; cx.fillStyle = i % 2 ? "rgba(255,200,60,.9)" : "rgba(255,110,30,.85)"; cx.beginPath(); cx.moveTo(fx - 4, by); cx.quadraticCurveTo(fx - 3, by - fh * .6, fx + Math.sin(T * 5 + i) * 2, by - fh); cx.quadraticCurveTo(fx + 3, by - fh * .6, fx + 4, by); cx.fill(); }
    for (let i = 0; i < 10; i++) { const t = (T * .6 + i / 10) % 1; cx.fillStyle = `rgba(255,200,90,${(1 - t) * .9})`; cx.beginPath(); cx.arc(bx + Math.sin(i * 3 + T) * 10 * t, by - 20 - t * 50, 1.2, 0, 7); cx.fill(); }
  }
  // Årsdag: hjerter fra taget og en hjerteranke; bryllupsdag: hvid flagranke og to guldringe over huset
  if (keys.has("aarsdag") || keys.has("bryllup")) { for (let i = 0; i < 6; i++) { const t = (T * .2 + i / 6) % 1; cx.fillStyle = `rgba(225,29,72,${Math.sin(Math.PI * t) * .8})`; heart(x + Math.sin(i * 2.4 + t * 5) * 26, base - h - 34 - t * 100, 4.5 + (i % 3)); }
    const pts = roofPts(x, base, w, h, 4, 9); cx.strokeStyle = "rgba(255,255,255,.7)"; cx.lineWidth = .8; cx.beginPath(); pts.forEach(([px, py], i) => i ? cx.lineTo(px, py) : cx.moveTo(px, py)); cx.stroke();
    pts.forEach(([px, py], i) => { if (i === pts.length - 1) return; if (keys.has("bryllup")) { cx.fillStyle = i % 2 ? "#FFFFFF" : "#F1E2B8"; cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px + 6, py); cx.lineTo(px + 3, py + 7); cx.closePath(); cx.fill(); } else { cx.fillStyle = i % 2 ? "#F43F5E" : "#FDA4AF"; heart(px + 3, py + 4, 3); } }); }
  if (keys.has("bryllup")) { const be = decorHas("bryllup")[0], rc = (be && BIG[be.who]) || "#E3B341", ry = base - h - 62 + Math.sin(T * 1.2) * 3; glow(x, ry, 30, hex(rc), .35 + .2 * dark); cx.strokeStyle = rc; cx.lineWidth = 3; cx.beginPath(); cx.arc(x - 6, ry, 9, 0, 7); cx.stroke(); cx.beginPath(); cx.arc(x + 6, ry, 9, 0, 7); cx.stroke(); cx.fillStyle = "#DDF4FF"; cx.beginPath(); cx.moveTo(x - 6, ry - 12); cx.lineTo(x - 3, ry - 9); cx.lineTo(x - 6, ry - 6); cx.lineTo(x - 9, ry - 9); cx.closePath(); cx.fill(); }
  // Valentinsdag: hjerter der stiger op fra taget
  if (keys.has("valentin")) { for (let i = 0; i < 7; i++) { const t = (T * .22 + i / 7) % 1; cx.fillStyle = `rgba(236,72,153,${Math.sin(Math.PI * t) * .85})`; heart(x + Math.sin(i * 2.1 + t * 6) * 28, base - h - 34 - t * 110, 5 + (i % 3)); } }
}

/* Alarmen: huset lyser op i alarmens farve. Hjemme blå, ude rød, nat lilla; orange blinker under tilkobling. */
function alarmGlow() {
  const a = opts.alarm(); if (!a) return null;
  const col = hex(a.color), sp = a.speed || 1.1, pu = .5 + .5 * Math.sin(performance.now() / 1000 * sp * Math.PI);
  return { st: a.state, col, pu };
}
function drawHouse(dark) {
  const x = W * (W < 600 ? .8 : .74), base = hill(x, H * .80, 13, .009, 2.6) + 4, w = 92, h = 50;
  const body = mix(hex("#F4F1FA"), hex("#20253F"), dark * .9), al = alarmGlow();
  if (al) { const R = 110 + al.pu * 26, g = cx.createRadialGradient(x, base - 30, 8, x, base - 30, R); g.addColorStop(0, rgb(al.col, .6 + .25 * al.pu)); g.addColorStop(.45, rgb(al.col, .26 + .12 * al.pu)); g.addColorStop(1, rgb(al.col, 0)); cx.fillStyle = g; cx.fillRect(x - R, base - 30 - R, R * 2, R * 2);
    cx.fillStyle = rgb(al.col, .22 + .14 * al.pu); cx.beginPath(); cx.ellipse(x, base + 2, w * .8, 7, 0, 0, 7); cx.fill(); }
  cx.fillStyle = rgb(mix(body, grey(body), wx.over * .3)); cx.fillRect(x - w / 2, base - h, w, h);
  if (al) { cx.fillStyle = rgb(al.col, .3 + .2 * al.pu); cx.fillRect(x - w / 2, base - h, w, h); }
  cx.fillStyle = rgb(mix(hex("#1B1530"), hex("#0B0E1C"), dark)); cx.beginPath(); cx.moveTo(x - w / 2 - 8, base - h + 2); cx.lineTo(x, base - h - 34); cx.lineTo(x + w / 2 + 8, base - h + 2); cx.closePath(); cx.fill();
  const lit = Math.max(.15, dark); cx.fillStyle = `rgba(255,${200 + 20 * (1 - lit)},120,${.35 + .65 * lit})`;
  [[-30,-34],[8,-34],[-30,-18],[8,-18]].forEach(([dx, dy]) => cx.fillRect(x + dx, base + dy, 14, 11));
  if (al) { cx.save(); cx.shadowColor = rgb(al.col, 1); cx.shadowBlur = 12 + 14 * al.pu; cx.strokeStyle = rgb(mix(al.col, [255, 255, 255], .25), .95); cx.lineWidth = 2.5; cx.lineJoin = "round";
    cx.beginPath(); cx.moveTo(x - w / 2, base); cx.lineTo(x - w / 2, base - h + 2); cx.lineTo(x - w / 2 - 8, base - h + 2); cx.lineTo(x, base - h - 34); cx.lineTo(x + w / 2 + 8, base - h + 2); cx.lineTo(x + w / 2, base - h + 2); cx.lineTo(x + w / 2, base); cx.stroke(); cx.restore(); }
  if (lit > .4) { const gl = cx.createRadialGradient(x, base - 24, 0, x, base - 24, 90); gl.addColorStop(0, `rgba(255,200,110,${.22 * lit})`); gl.addColorStop(1, "rgba(255,200,110,0)"); cx.fillStyle = gl; cx.fillRect(x - 100, base - 120, 200, 140); }
  drawBins(x - w / 2 - 14, base, dark);
  const cxp = x + w / 2 + 34, cy = base - 2; cx.fillStyle = rgb(mix(hex("#2B2F45"), hex("#0D1020"), dark));
  cx.beginPath(); cx.roundRect ? cx.roundRect(cxp - 24, cy - 14, 48, 12, 5) : cx.rect(cxp - 24, cy - 14, 48, 12); cx.fill();
  cx.beginPath(); cx.roundRect ? cx.roundRect(cxp - 15, cy - 23, 28, 11, 5) : cx.rect(cxp - 15, cy - 23, 28, 11); cx.fill();
  cx.fillStyle = "rgba(20,20,30,.9)"; [cxp - 14, cxp + 14].forEach(wx_ => { cx.beginPath(); cx.arc(wx_, cy - 2, 4.5, 0, 7); cx.fill(); });
  const pulse = .5 + .5 * Math.sin(performance.now() / 380); cx.fillStyle = `rgba(60,220,130,${.5 + .5 * pulse})`; cx.beginPath(); cx.arc(cxp - 30, cy - 10, 2.6 + pulse, 0, 7); cx.fill();
  drawDecorHouse(x, base, w, h, dark, performance.now() / 1000);
}

/* ===================== Hovedet ===================== */
function drawBins(right, base, dark) {
  const bins = opts.waste(); const wb = opts.wasteButton;
  if (!bins.length) { if (wb) wb.hidden = true; WASTE_HIT = null; return; }
  const T = performance.now() / 1000;
  [...bins].reverse().forEach((b, k) => {
    const bx = right - 10 - k * 15, due = k === bins.length - 1, by = base - 2 + (due ? 3 : 0), bw = 13, bh = 18, lift = due ? Math.max(0, Math.sin(T * 2.4)) * 1.5 : 0;
    const body = mix(hex(b.body), hex("#151826"), dark * .45), lid = mix(hex(b.lid), hex("#151826"), dark * .4);
    cx.fillStyle = rgb(body); cx.beginPath(); cx.roundRect ? cx.roundRect(bx - bw / 2, by - bh, bw, bh, 2) : cx.rect(bx - bw / 2, by - bh, bw, bh); cx.fill();
    cx.fillStyle = rgb(lid); cx.beginPath(); cx.roundRect ? cx.roundRect(bx - bw / 2 - 1.5, by - bh - 4 - lift, bw + 3, 4, 1.5) : cx.rect(bx - bw / 2 - 1.5, by - bh - 4 - lift, bw + 3, 4); cx.fill();
    cx.fillStyle = "rgba(20,20,30,.8)"; cx.beginPath(); cx.arc(bx - 4, by, 2, 0, 7); cx.arc(bx + 4, by, 2, 0, 7); cx.fill();
  });
  const first = bins[0], dw = first.label, lx = right - 10 - 15, ly = base - 40 - Math.sin(T * 2) * 1.5;
  cx.font = "800 11px Figtree, system-ui, sans-serif"; const tw = cx.measureText(dw).width + 14;
  cx.fillStyle = `rgba(255,255,255,${first.soon ? .95 : .82})`; cx.beginPath(); cx.roundRect ? cx.roundRect(lx - tw / 2, ly - 11, tw, 17, 8.5) : cx.rect(lx - tw / 2, ly - 11, tw, 17); cx.fill();
  cx.fillStyle = first.soon ? "#D9473B" : "#1B1530"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(dw, lx, ly - 2.5);
  WASTE_HIT = { x: lx - tw / 2 - 8, y: ly - 19, w: tw + 16, h: 33 };
  if (wb) { wb.hidden = false; const st = wb.style; st.left = WASTE_HIT.x + "px"; st.top = (WASTE_HIT.y - 30) + "px"; st.width = WASTE_HIT.w + "px"; st.height = (WASTE_HIT.h + 34) + "px"; }
}
  seed();
  return {
    start() { if (running) return; running = true; last = performance.now(); resize(); if (reduceMotion) draw(0, 0); else raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    redraw() { resize(); draw(0, performance.now() / 1000); },
    setWeather(kind) { weather = WX[kind] ? kind : "partly"; wx = WX[weather]; },
    setSun(rise, set) { if (rise > 0 && set > rise) { RISE = rise; SET = set; } },
    setHour(h) { if (h == null) { manualHour = false; hour = realNow(); } else { manualHour = true; hour = h; } if (reduceMotion) draw(0, 0); },
    get hour() { return hour; },
    get rise() { return RISE; },
    get set() { return SET; },
    sunElev: (h) => sunElev(h),
  };
}
