/* Hverdagsro – the art pack: drawings from files instead of the game's own. If Home Assistant has a folder
   config/www/hverdagsro-art/ with a pack.json (made by tools/art-export.mjs, then redrawn by an illustrator), every
   thing that has a file there is drawn from the file. Things without a file are drawn as before. */
const BASE = "/local/hverdagsro-art/";
let loaded = null;
/* Load the manifest once and swap the drawings in. CAT is the game's catalogue; done(n) is called with the number of
   things taken over, so the room can be drawn again. */
export function load(CAT, done) {
  if (loaded) return loaded;
  loaded = (typeof fetch === "function" ? fetch(`${BASE}pack.json`, { cache: "no-cache" }) : Promise.reject(new Error("no fetch")))
    .then((r) => (r.ok ? r.json() : null))
    .then((m) => {
      if (!m || !Array.isArray(m.items)) return 0;
      const pad = +m.pad || 0;
      let n = 0;
      for (const it of m.items) {
        const T = CAT[it.id];
        if (!T || !it.file) continue;
        const w = (it.w || T.w) + pad * 2, h = (it.h || T.h) + pad * 2, x = -(it.w || T.w) / 2 - pad, y = -(it.h || T.h) - pad;
        const href = `${BASE}${encodeURIComponent(it.file)}${m.v ? `?v=${encodeURIComponent(m.v)}` : ""}`;
        T.art = true;
        T.d = () => `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet"/>`;
        n++;
      }
      if (n) done?.(n);
      return n;
    })
    .catch(() => 0);
  return loaded;
}
