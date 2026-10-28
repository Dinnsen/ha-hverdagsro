/* Hverdagsro – export every thing in the game as an SVG file, so an illustrator can redraw them.
   node tools/art-export.mjs [outdir]   (default: art/)
   Writes <outdir>/<id>.svg (viewBox: the thing stands on y=0, centred on x=0), manifest.json and README.md.
   Put the folder in Home Assistant as config/www/hverdagsro-art/ and the game uses the files instead of its own
   drawings (hv-art.js). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

globalThis.window = globalThis;
globalThis.customElements = { define() {}, get() {} };
globalThis.HTMLElement = class {};
globalThis.localStorage = { getItem: () => null, setItem() {} };
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { PLAY_CAT } = await import(path.join(ROOT, "custom_components/hverdagsro/frontend/hv-play.js"));
const out = process.argv[2] || path.join(ROOT, "art");
fs.mkdirSync(out, { recursive: true });
const PAD = 12, manifest = [];
for (const [id, T] of Object.entries(PLAY_CAT)) {
  const body = T.d(T.c), w = T.w + PAD * 2, h = T.h + PAD * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-T.w / 2 - PAD} ${-T.h - PAD} ${w} ${h}" width="${w}" height="${h}">
<!-- Hverdagsro: ${T.n} (${id}). The thing stands on y=0, centred on x=0. Keep the viewBox; draw anything inside. -->
${body}
</svg>
`;
  fs.writeFileSync(path.join(out, `${id}.svg`), svg);
  manifest.push({ id, name: T.n, cat: T.cat, pack: T.pack, w: T.w, h: T.h, flat: T.flat || 0, file: `${id}.svg` });
}
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({ version: 1, pad: PAD, items: manifest }, null, 1));
fs.writeFileSync(path.join(out, "README.md"), `# Hverdagsro – kunstpakken

Alle ting i spillet, én SVG-fil pr. ting (${manifest.length} filer). Tegn dem om i Illustrator eller et andet program,
og læg mappen i Home Assistant som \`config/www/hverdagsro-art/\`. Spillet bruger så filerne i stedet for sine egne
tegninger. Filer, der mangler, tegnes som før, så du kan tage én ting ad gangen.

- Behold viewBox'en: tingen står på y=0 og er centreret om x=0. Bredden og højden står i manifest.json.
- Alt, hvad der er inde i filen, vises. Farver, skygger, billeder (indlejrede PNG'er) – alt er tilladt.
- En ting med en egen farve i spillet (farveknappen i Byg) mister den, når den tegnes fra en fil.
- manifest.json siger, hvilke ting der er: id, navn, kategori, pakke, bredde, højde.
- Opdatér en fil: læg den i mappen igen og genindlæs siden (hold Shift nede, hvis browseren viser den gamle).
`);
// An overview page: every thing with its name, by category, to look through.
const cats = [...new Set(manifest.map((m) => m.cat))];
fs.writeFileSync(path.join(out, "index.html"), `<!doctype html><meta charset="utf-8"><title>Hverdagsro – kunstpakken</title>
<style>body{font:14px system-ui,sans-serif;margin:20px;background:#f6f3ee}h2{margin:28px 0 10px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.c{background:#fff;border:1px solid #ddd;border-radius:10px;padding:8px;text-align:center}.c img{width:100%;height:110px;object-fit:contain}.c small{color:#777;display:block}</style>
<h1>Hverdagsro – kunstpakken (${manifest.length} ting)</h1>${cats.map((c) => `<h2>${c}</h2><div class="g">${manifest.filter((m) => m.cat === c).map((m) => `<div class="c"><img src="${m.file}" alt=""><b>${m.name}</b><small>${m.id} · ${m.w}×${m.h} · ${m.pack}</small></div>`).join("")}</div>`).join("")}`);
console.log(`${manifest.length} things → ${out}`);
