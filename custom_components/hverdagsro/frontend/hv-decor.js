/* Hverdagsro – the occasions the sky and the house are decorated for. Pure date logic. */

const dn = (Y, M, D) => Date.UTC(Y, M - 1, D) / 864e5;
export const dayNumber = (d) => dn(d.getFullYear(), d.getMonth() + 1, d.getDate());
export function easter(Y) {
  const a = Y % 19, b = Math.floor(Y / 100), c = Y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return dn(Y, mo, da);
}
export const WED = [[1, "papirbryllup"], [2, "bomuldsbryllup"], [3, "læderbryllup"], [4, "blomsterbryllup"], [5, "træbryllup"], [6, "sukkerbryllup"], [7, "uldbryllup"], [8, "bronzebryllup"], [9, "pilbryllup"], [10, "tinbryllup"], [11, "stålbryllup"], [12, "silkebryllup"], [12.5, "kobberbryllup"], [13, "kniplingsbryllup"], [14, "elfenbensbryllup"], [15, "krystalbryllup"], [20, "porcelænsbryllup"], [25, "sølvbryllup"], [30, "perlebryllup"], [35, "koralbryllup"], [40, "rubinbryllup"], [45, "safirbryllup"], [50, "guldbryllup"], [55, "smaragdbryllup"], [60, "diamantbryllup"], [65, "krondiamantbryllup"], [70, "jernbryllup"], [75, "atombryllup"], [80, "egebryllup"]];
export const BIG = { 12.5: "#B87333", 25: "#C0C6CF", 40: "#C21E56", 50: "#E3B341", 60: "#BDE6F5" };
export const wedName = (n) => (WED.find((w) => w[0] === n) || [0, ""])[1];
const parse = (iso) => iso.split("-").map(Number);

function anniv(iso, Y, half) {
  if (!iso) return [];
  const [y, m, d] = parse(iso), out = [];
  if (Y - y > 0) out.push([dn(Y, m, d), dn(Y, m, d), Y - y]);
  if (half) [12.5, 72.5].forEach((n) => { const dt = new Date(Date.UTC(y + Math.floor(n), m - 1 + 6, d)); if (dt.getUTCFullYear() === Y) { const k = Math.round(dt / 864e5); out.push([k, k, n]); } });
  return out;
}

/* [key, Danish name, emoji, colour, dates(Y) → [[from, to, who]], default {before, after}, greeting] */
export function occasions(settings, family) {
  const a = settings?.anniversaries || {};
  return [
    ["jul", "Jul", "🎄", "#D9473B", (Y) => [[dn(Y, 12, 24), dn(Y, 12, 26)]], [23, 2], "Glædelig jul"],
    ["nytaar", "Nytår", "🎆", "#E3A21A", (Y) => [[dn(Y, 12, 31), dn(Y + 1, 1, 1)]], [0, 1], "Godt nytår"],
    ["fastelavn", "Fastelavn", "🎭", "#8B5CF6", (Y) => [[easter(Y) - 49, easter(Y) - 49]], [2, 0], "Glædelig fastelavn"],
    ["paaske", "Påske", "🐣", "#D4A20B", (Y) => [[easter(Y) - 3, easter(Y) + 1]], [4, 0], "God påske"],
    ["halloween", "Halloween", "🎃", "#F97316", (Y) => [[dn(Y, 10, 31), dn(Y, 10, 31)]], [7, 0], "Glædelig halloween"],
    ["fodselsdag", "Fødselsdage", "🎂", "#E4568C", (Y) => (family || []).filter((p) => p.birthday).map((p) => { const [, m, d] = parse(p.birthday); return [dn(Y, m, d), dn(Y, m, d), p.id]; }), [1, 0], "Tillykke"],
    ["grundlov", "Grundlovsdag", "🇩🇰", "#C8102E", (Y) => [[dn(Y, 6, 5), dn(Y, 6, 5)]], [0, 0], "God grundlovsdag"],
    ["sankthans", "Sankt Hans", "🔥", "#EA580C", (Y) => [[dn(Y, 6, 23), dn(Y, 6, 23)]], [0, 0], "God sankthans"],
    ["valentin", "Valentinsdag", "💗", "#EC4899", (Y) => [[dn(Y, 2, 14), dn(Y, 2, 14)]], [0, 0], "Glædelig valentinsdag"],
    ["aarsdag", "Årsdag", "💞", "#E11D48", (Y) => anniv(a.together, Y, false), [0, 0], "Tillykke med årsdagen"],
    ["bryllup", "Bryllupsdag", "💍", "#C9A227", (Y) => anniv(a.wedding, Y, true), [1, 0], "Tillykke med bryllupsdagen"],
  ];
}

/* The occasions that are decorated for today, nearest first. */
export function activeDecor(today, settings, family, preview) {
  if (preview) return [{ key: preview, a: 0, b: 0, d0: 0, prev: true }];
  const t = dayNumber(today), Y = today.getFullYear(), out = [];
  for (const o of occasions(settings, family)) {
    if (settings?.decor?.[o[0]] === false) continue;
    const days = settings?.decor_days || {};
    const before = days[`${o[0]}_before`] ?? o[5][0], after = days[`${o[0]}_after`] ?? o[5][1];
    [Y - 1, Y, Y + 1].forEach((y) => o[4](y).forEach(([a, b, who]) => { if (t >= a - before && t <= b + after) out.push({ key: o[0], a, b, d0: a - t, past: t > b, who }); }));
  }
  return out.sort((x, y) => Math.abs(x.d0) - Math.abs(y.d0));
}
export const ageOn = (iso, n) => { const [y, m, d] = parse(iso), dt = new Date(n * 864e5); let age = dt.getUTCFullYear() - y; if (dt.getUTCMonth() + 1 < m || (dt.getUTCMonth() + 1 === m && dt.getUTCDate() < d)) age--; return age; };
