/* Hverdagsro – export every thing in the game as an SVG file, so an illustrator can redraw them.
   node tools/art-export.mjs [outdir]   (default: art/)
   Writes <outdir>/<id>.svg (viewBox: the thing stands on y=0, centred on x=0), pack.json and README.md.
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
// The figure: every part in the figure's own frame (viewBox -130 -330 260 340; the feet stand on y=0).
const FIGBOX = "-130 -330 260 340", figFile = (dir, id, body, note) => {
  fs.mkdirSync(path.join(out, dir), { recursive: true });
  fs.writeFileSync(path.join(out, dir, `${id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FIGBOX}" width="260" height="340">\n<!-- Hverdagsro: ${note}. The whole figure's frame; only this part is drawn. Feet on y=0, head around y=-184. -->\n${body}\n</svg>\n`);
  return { id, file: `${dir}/${id}.svg` };
};
const P = await import(path.join(ROOT, "custom_components/hverdagsro/frontend/hv-play.js"));
const base = { skin: "#F6C9A3", hair: "kort", hairc: "#5B3A21", top: "#FF6B6B", bottom: "#4D96FF", extra: "ingen", _parts: true };
const partsOf = (me, mood = "", pose = "") => P.avatarSvg({ ...base, ...me }, mood, pose);
const PARTS = {};
const take = (rec) => Object.assign(PARTS, rec);
for (const h of Object.keys(P.HAIRS)) take(partsOf({ hair: h }));
for (const k of Object.keys(P.TOPS)) take(partsOf({ topk: k }));
for (const k of Object.keys(P.BOTTOMS)) take(partsOf({ botk: k }));
for (const k of Object.keys(P.SHOES)) take(partsOf({ shoek: k }));
for (const k of [...Object.keys(P.EXTRAS), ...Object.keys(P.EXTRAS_X)]) take(partsOf({ extra: k }));
for (const k of Object.keys(P.FACES)) take(partsOf({ face: k }));
for (const k of Object.keys(P.ACCS)) take(partsOf({ acc: k }));
for (const k of Object.keys(P.MOUTHS)) take(partsOf({ mouth: k }));
for (const [k, v] of Object.entries(P.STYLE)) take(partsOf({ [{ top: "topk", bot: "botk", shoe: "shoek", face: "face", acc: "acc" }[k.split(":")[0]]]: k.split(":")[1] }));
for (const mood of ["sleep", "wow", "glad", "tunge", "sur", "trist"]) take(partsOf({}, mood));
const parts = Object.entries(PARTS).filter(([, v]) => v).map(([id, body]) => figFile("figur", id, body, `figure part ${id}`));
// The characters of the world, and the pets.
const W = await import(path.join(ROOT, "custom_components/hverdagsro/frontend/hv-world.js"));
const { charSvg } = await import(path.join(ROOT, "custom_components/hverdagsro/frontend/hv-chars.js"));
const npcs = Object.entries(W.NPCS).map(([id, N]) => figFile("figurer", id, charSvg(N[3], "", P.avatarSvg), `${N[0]} (${id})`));
const pets = ["hund", "kat", "drage"].map((k) => {
  fs.mkdirSync(path.join(out, "dyr"), { recursive: true });
  fs.writeFileSync(path.join(out, "dyr", `${k}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-130 -200 260 210" width="260" height="210">\n<!-- Hverdagsro: the pet (${k}). Feet on y=0. -->\n${P.petInRoom({ color: "#FFB347", pet: { kind: k } }, true)}\n</svg>\n`);
  return { id: k, file: `dyr/${k}.svg` };
});
// The backdrops: the rooms of the house by kind, the places of the world, the child's own rooms.
fs.mkdirSync(path.join(out, "baggrunde"), { recursive: true });
const bgFile = (id, body, note) => {
  fs.writeFileSync(path.join(out, "baggrunde", `${id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620">\n<!-- Hverdagsro: backdrop ${note}. The floor line is y=440; a wider room is stretched. -->\n<defs>${W.BG.skyDef("#8FD3FF", "#D8F1FF")}</defs>${body}\n</svg>\n`);
  return { id, file: `baggrunde/${id}.svg` };
};
const fakeCtx = { data: { house: null }, children: () => [], member: () => null, t: (x) => x };
const backdrops = [];
const looks = new Set();
for (const h of W.houseRooms(fakeCtx)) {
  if (looks.has(h.look)) continue;
  looks.add(h.look);
  const pl = W.place(fakeCtx, h.id);
  backdrops.push(bgFile(`room-${h.look}`, pl.bg("#8FD3FF", "#D8F1FF", "day", 1000), `a ${h.look} room of the house`));
}
for (const [id, pl] of Object.entries(W.PLACES)) if (pl.bg) backdrops.push(bgFile(`place-${id}`, pl.bg("#8FD3FF", "#D8F1FF", "day", 1000), `${pl.n} (${id})`));
for (const id of ["hule", "trae", "rumstation", "scene"]) backdrops.push(bgFile(`place-${id}`, P.spaceBackdrop(id, "#8FD3FF", "#D8F1FF", "day"), id));
fs.writeFileSync(path.join(out, "pack.json"), JSON.stringify({ version: 2, pad: PAD, parts_off: true, backdrops_off: true, items: manifest, parts, npcs, pets, backdrops }, null, 1));
console.log(`${parts.length} figure parts, ${npcs.length} characters, ${pets.length} pets, ${backdrops.length} backdrops`);
fs.writeFileSync(path.join(out, "README.md"), `# Hverdagsro – kunstpakken

Alle ting i spillet, én SVG-fil pr. ting (${manifest.length} filer). Tegn dem om i Illustrator eller et andet program,
og læg mappen i Home Assistant som \`config/www/hverdagsro-art/\`. Spillet bruger så filerne i stedet for sine egne
tegninger. Filer, der mangler, tegnes som før, så du kan tage én ting ad gangen.

- Behold viewBox'en: tingen står på y=0 og er centreret om x=0. Bredden og højden står i pack.json.
- "figur/": figurens dele (hår, tøj, sko, ansigt, ting at bære) i figurens egen ramme. Hver fil tegner kun sin del,
  men i hele figurens ramme, så den lander det rigtige sted. En del fra fil har sin egen farve (hårfarve og tøjfarve
  fra spillet gælder ikke for den).
  Figurens dele og baggrundene er slået fra i pack.json ("parts_off" og "backdrops_off"), indtil du har tegnet
  dem om: sæt dem til false, når filerne skal bruges. Ellers ville alle i familien få filernes farver, og
  baggrundene fra fil har ikke regn, nat og lampeskær.
- "figurer/": byens karakterer, hele figuren. "dyr/": kæledyrene. "baggrunde/": rummene i huset (efter slags),
  verdens steder og barnets egne rum. Gulvlinjen er y=440; et bredt rum strækkes.
- Alt, hvad der er inde i filen, vises. Farver, skygger, billeder (indlejrede PNG'er) – alt er tilladt.
- En ting med en egen farve i spillet (farveknappen i Byg) mister den, når den tegnes fra en fil.
- pack.json siger, hvilke ting der er: id, navn, kategori, pakke, bredde, højde.
- Opdatér en fil: læg den i mappen igen og genindlæs siden (hold Shift nede, hvis browseren viser den gamle).
`);
// An overview page: every thing with its name, by category, to look through.
const cats = [...new Set(manifest.map((m) => m.cat))];
fs.writeFileSync(path.join(out, "index.html"), `<!doctype html><meta charset="utf-8"><title>Hverdagsro – kunstpakken</title>
<style>body{font:14px system-ui,sans-serif;margin:20px;background:#f6f3ee}h2{margin:28px 0 10px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.c{background:#fff;border:1px solid #ddd;border-radius:10px;padding:8px;text-align:center}.c img{width:100%;height:110px;object-fit:contain}.c small{color:#777;display:block}</style>
<h1>Hverdagsro – kunstpakken (${manifest.length} ting)</h1>
<h2>Figuren (${parts.length} dele)</h2><div class="g">${parts.map((m) => `<div class="c"><img src="${m.file}" alt=""><b>${m.id}</b></div>`).join("")}</div>
<h2>Karakterer (${npcs.length})</h2><div class="g">${npcs.map((m) => `<div class="c"><img src="${m.file}" alt=""><b>${m.id}</b></div>`).join("")}</div>
<h2>Kæledyr</h2><div class="g">${pets.map((m) => `<div class="c"><img src="${m.file}" alt=""><b>${m.id}</b></div>`).join("")}</div>
<h2>Baggrunde (${backdrops.length})</h2><div class="g">${backdrops.map((m) => `<div class="c"><img src="${m.file}" alt="" style="height:80px"><b>${m.id}</b></div>`).join("")}</div>
${cats.map((c) => `<h2>${c}</h2><div class="g">${manifest.filter((m) => m.cat === c).map((m) => `<div class="c"><img src="${m.file}" alt=""><b>${m.name}</b><small>${m.id} · ${m.w}×${m.h} · ${m.pack}</small></div>`).join("")}</div>`).join("")}`);
console.log(`${manifest.length} things → ${out}`);
