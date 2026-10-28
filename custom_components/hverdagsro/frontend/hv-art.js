/* Hverdagsro – the art pack: drawings from files instead of the game's own. If Home Assistant has a folder
   config/www/hverdagsro-art/ with a pack.json (made by tools/art-export.mjs, then redrawn by an illustrator), every
   thing that has a file there is drawn from the file. Things without a file are drawn as before. */
const BASE = "/local/hverdagsro-art/";
let loaded = null;
const PARTS = new Map(), NPC = new Map(), PETS = new Map(), BGS = new Map();
/* The figure's viewBox: every part file is drawn in it, so it lands where the part goes. */
const FIG = [-130, -330, 260, 340];
const img = (href, [x, y, w, h], extra = "") => `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
/* A part of a figure (hair-lang, top-hoodie …), a character (npc-frida), a pet (pet-hund) or a backdrop
   (room-kitchen, place-skov-lysning), from the pack; null when the pack has no such file. */
export const part = (key) => (PARTS.has(key) ? img(PARTS.get(key), FIG) : null);
export const npc = (id) => (NPC.has(id) ? img(NPC.get(id), FIG) : null);
export const pet = (kind) => (PETS.has(kind) ? img(PETS.get(kind), [-130, -200, 260, 210]) : null);
export const bg = (key, rw = 1000) => (BGS.has(key) ? img(BGS.get(key), [0, 0, rw, 620], 'preserveAspectRatio="none"') : null);
/* Load the manifest once and swap the drawings in. CAT is the game's catalogue; done(n) is called with the number of
   things taken over, so the room can be drawn again. */
export function load(CAT, done) {
  if (loaded) return loaded;
  loaded = (typeof fetch === "function" ? fetch(`${BASE}pack.json`, { cache: "no-cache" }) : Promise.reject(new Error("no fetch")))
    .then((r) => (r.ok ? r.json() : null))
    .then((m) => {
      if (!m || !Array.isArray(m.items)) return 0;
      const pad = +m.pad || 0;
      const href = (f) => `${BASE}${encodeURIComponent(f)}${m.v ? `?v=${encodeURIComponent(m.v)}` : ""}`;
      for (const it of m.parts_off ? [] : m.parts || []) PARTS.set(it.id, href(it.file));
      for (const it of m.npcs || []) NPC.set(it.id, href(it.file));
      for (const it of m.pets || []) PETS.set(it.id, href(it.file));
      for (const it of m.backdrops_off ? [] : m.backdrops || []) BGS.set(it.id, href(it.file));
      let n = PARTS.size + NPC.size + PETS.size + BGS.size;
      for (const it of m.items) {
        const T = CAT[it.id];
        if (!T || !it.file) continue;
        const w = (it.w || T.w) + pad * 2, h = (it.h || T.h) + pad * 2, x = -(it.w || T.w) / 2 - pad, y = -(it.h || T.h) - pad;
        T.art = true;
        T.d = () => `<image href="${href(it.file)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet"/>`;
        n++;
      }
      if (n) done?.(n);
      return n;
    })
    .catch(() => 0);
  return loaded;
}
