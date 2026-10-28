/* Hverdagsro – the wardrobe of the figure workshop, as the original's character creator has it: hair styles and beards,
   clothes, hats, glasses and masks, ear accessories, the parts of the face, the colours, and the 32 expressions. Each
   part is a page of little pictures to pick from, sorted by kind; a part opens when you tap its name, so the page stays
   light. Used by the "mig" drawer of hv-play. A figure (me) keeps the choices in hs, bd, cl, ht, mk, er, fe …, expr. */
import { AV, AV_EN, randomLook } from "./hv-avatars.js";

const PER = 12;
const GROUPS = [
  ["hs", "Frisure"], ["bd", "Skæg"], ["cl", "Tøj"], ["ht", "Hatte"], ["mk", "Briller og masker"], ["er", "Ørepynt"], ["face", "Ansigt"], ["col", "Farver"], ["expr", "Udtryk"],
];
const FAMS = {
  hs: [["", "Alle"], ["S", "Kort hår"], ["L", "Langt hår"], ["C", "Skørt hår"]],
  cl: [["", "Alle"], ["kjole", "Kjoler"], ["tshirt", "T-shirts"], ["sweater", "Striktrøjer"], ["jakke", "Jakker"], ["hoodie", "Hættetrøjer"], ["sport", "Sport"], ["suit", "Jakkesæt"], ["swim", "Badetøj"], ["pyjamas", "Nattøj"], ["towel", "Håndklæder"], ["robe", "Kåber"], ["uniform", "Uniformer"], ["costume", "Kostumer"], ["overalls", "Overalls"], ["puffer", "Vintertøj"], ["coat", "Frakker"], ["cardigan", "Cardigans"], ["skjorte", "Skjorter"], ["vest", "Veste"]],
  ht: [["", "Alle"], ["cap", "Kasketter"], ["beanie", "Huer"], ["party", "Festhatte"], ["crown", "Kroner"], ["bow", "Sløjfer"], ["headband", "Pandebånd"], ["wig", "Parykker"], ["ears", "Ører"], ["horns", "Horn"], ["flower", "Blomster"], ["bucket", "Bøllehatte"], ["cowboy", "Cowboy"], ["chef", "Kok"], ["witch", "Hekse"], ["sunhat", "Solhatte"], ["santa", "Nisse"], ["pirate", "Pirat"], ["helmet", "Hjelme"], ["hat", "Andre"]],
  mk: [["", "Alle"], ["glasses", "Briller"], ["sunglasses", "Solbriller"], ["goggles", "Dykkerbriller"], ["monocle", "Monokler"], ["eyepatch", "Øjenklap"], ["facepaint", "Ansigtsmaling"], ["facemask", "Mundbind"], ["helmet", "Hjelme"], ["hood", "Hætter"], ["mustache", "Overskæg"], ["clownnose", "Klovnenæser"], ["mask", "Andre"]],
  er: [["", "Alle"], ["stud", "Ørestikker"], ["hoop", "Creoler"], ["dangle", "Hængeører"], ["pearl", "Perler"], ["hearing", "Høreapparater"], ["bud", "Øresnegle"], ["cuff", "Cuffs"], ["charm", "Vedhæng"]],
};
const STEPS = [["fe", "Øjne", 284], ["fb", "Bryn", 525], ["fn", "Næse", 544], ["fm", "Mund", 567], ["fh", "Kinder", 233], ["ff", "Fregner", 127], ["fw", "Rynker", 83], ["fs", "Ar", 12]];
const idOf = (g, n) => g + String(n).padStart(3, "0");
export const WARD_EN = {
  Frisure: "Hair style", Skæg: "Beard", Tøj: "Clothes", Hatte: "Hats", "Briller og masker": "Glasses and masks", Ørepynt: "Ear accessories", Ansigt: "Face", Farver: "Colours", Udtryk: "Expression",
  Alle: "All", "Kort hår": "Short hair", "Langt hår": "Long hair", "Skørt hår": "Crazy hair", Kjoler: "Dresses", "T-shirts": "T-shirts", Striktrøjer: "Sweaters", Jakker: "Jackets", Hættetrøjer: "Hoodies", Sport: "Sporty", Jakkesæt: "Suits", Badetøj: "Swimwear", Nattøj: "Pyjamas", Håndklæder: "Towels", Kåber: "Robes", Uniformer: "Uniforms", Kostumer: "Costumes", Overalls: "Overalls", Vintertøj: "Winter clothes", Frakker: "Coats", Cardigans: "Cardigans", Skjorter: "Shirts", Veste: "Vests",
  Kasketter: "Caps", Huer: "Beanies", Festhatte: "Party hats", Kroner: "Crowns", Sløjfer: "Bows", Pandebånd: "Headbands", Parykker: "Wigs", Ører: "Ears", Horn: "Horns", Blomster: "Flowers", Bøllehatte: "Bucket hats", Cowboy: "Cowboy", Kok: "Chef", Hekse: "Witch hats", Solhatte: "Sun hats", Nisse: "Santa", Pirat: "Pirate", Hjelme: "Helmets", Andre: "Others",
  Briller: "Glasses", Solbriller: "Sunglasses", Dykkerbriller: "Goggles", Monokler: "Monocles", Øjenklap: "Eye patches", Ansigtsmaling: "Face paint", Mundbind: "Face masks", Hætter: "Hoods", Overskæg: "Moustaches", Klovnenæser: "Clown noses",
  Ørestikker: "Studs", Creoler: "Hoops", Hængeører: "Drop earrings", Perler: "Pearls", Høreapparater: "Hearing aids", Øresnegle: "Earbuds", Cuffs: "Cuffs", Vedhæng: "Charms",
  Øjne: "Eyes", Bryn: "Brows", Næse: "Nose", Mund: "Mouth", Kinder: "Cheeks", Fregner: "Freckles", Rynker: "Wrinkles", Ar: "Scar", Intet: "None", Hår: "Hair", Hud: "Skin", "Tilfældig figur": "Random figure", Side: "Page",
  "Tilfældigt udseende": "Random look", "Udseende fra originalen": "Looks from the original",
};
Object.assign(AV_EN, WARD_EN);

/* The list behind each part: [index or id, name]. */
function itemsOf(key, fam) {
  if (key === "hs") {
    const out = [];
    for (const [g, list] of [["S", AV.hair.Short], ["L", AV.hair.Long], ["C", AV.hair.Crazy]]) if (!fam || fam === g) for (const n of list) out.push([idOf(g, n), `${g === "S" ? "Kort" : g === "L" ? "Langt" : "Skørt"} ${n}`]);
    return out;
  }
  if (key === "bd") return AV.hair.Beard.map((n) => [idOf("B", n), `Skæg ${n}`]);
  const list = { cl: AV.cl, ht: AV.hat, mk: AV.mask, er: AV.ear }[key];
  const at = key === "cl" ? 3 : 3;
  return list.map((it, i) => [i, it[1], it[at]]).filter((x) => !fam || x[2] === fam);
}
const sw = (key, cur, list) => list.map(([m]) => `<button class="pl-sw" data-pl="me" data-f="${key}" data-k="${m}" aria-pressed="${cur === m}" style="--c:${m}" aria-label="${m}"></button>`).join("");

/* The rows of the wardrobe. api: { esc, t, avatar(me, mood) }, st: the state, me: the figure. */
export function rows(api, st, me) {
  const { esc, t, avatar } = api, open = st.avOpen || "";
  let h = `<div class="pl-row"><b>${esc(t("Udseende fra originalen"))}</b><button class="pl-chip" data-pl="avrand">🎲 ${esc(t("Tilfældigt udseende"))}</button></div>`;
  for (const [key, name] of GROUPS) {
    const isOpen = open === key;
    h += `<div class="pl-row pl-avh"><button class="pl-chip" data-pl="avopen" data-k="${key}" aria-pressed="${isOpen}">${isOpen ? "▾" : "▸"} ${esc(t(name))}</button></div>`;
    if (!isOpen) continue;
    if (key === "face") {
      h += `<div class="pl-av-steps">${STEPS.map(([f, n, max]) => {
        const v = me[f] === undefined || me[f] === "" || me[f] === null ? -1 : +me[f];
        return `<span class="pl-av-step"><b>${esc(t(n))}</b><button class="pl-chip" data-pl="avstep" data-f="${f}" data-n="${max}" data-k="-1" aria-label="-">‹</button><span>${v < 0 ? esc(t("Intet")) : `${v + 1}/${max}`}</span><button class="pl-chip" data-pl="avstep" data-f="${f}" data-n="${max}" data-k="1" aria-label="+">›</button></span>`;
      }).join("")}</div>`;
      continue;
    }
    if (key === "col") {
      h += `<div class="pl-row"><b>${esc(t("Hår"))}</b>${sw("hairc", me.hairc, AV.sw.hair || [])}</div><div class="pl-row"><b>${esc(t("Hud"))}</b>${sw("skin", me.skin, AV.sw.skin || [])}</div>`;
      continue;
    }
    if (key === "expr") {
      h += `<div class="pl-av-grid">${AV.expr.map(([id, da]) => `<button class="pl-cell" data-pl="me" data-f="expr" data-k="${me.expr === "x:" + id ? "" : "x:" + id}" aria-pressed="${me.expr === "x:" + id}" title="${esc(t(da))}"><svg viewBox="-84 -262 168 150" aria-hidden="true">${avatar({ ...me, expr: "" }, "x:" + id)}</svg><small>${esc(t(da))}</small></button>`).join("")}</div>`;
      continue;
    }
    const fams = FAMS[key], fam = (st.avFam || {})[key] || "";
    if (fams) h += `<div class="pl-row pl-av-fams">${fams.map(([k, n]) => `<button class="pl-chip" data-pl="avfam" data-f="${key}" data-k="${k}" aria-pressed="${fam === k}">${esc(t(n))}</button>`).join("")}</div>`;
    const list = itemsOf(key, fam), pages = Math.max(1, Math.ceil(list.length / PER)), page = Math.min((st.avPage || {})[key] || 0, pages - 1);
    const view = list.slice(page * PER, page * PER + PER), head = key === "hs" || key === "bd" || key === "cl" ? "" : "head";
    const none = `<button class="pl-cell" data-pl="me" data-f="${key}" data-k="" aria-pressed="${me[key] === undefined || me[key] === "" || me[key] === null}"><span class="pl-none">∅</span><small>${esc(t("Intet"))}</small></button>`;
    h += `<div class="pl-av-grid">${none}${view.map(([id, nm]) => `<button class="pl-cell" data-pl="me" data-f="${key}" data-k="${id}" aria-pressed="${String(me[key]) === String(id)}" title="${esc(t(nm))}"><svg viewBox="${head ? "-92 -300 184 190" : "-112 -330 224 342"}" aria-hidden="true">${avatar({ ...me, [key]: id, ...(key === "cl" ? { topk: "", botk: "" } : {}) }, "")}</svg><small>${esc(t(nm))}</small></button>`).join("")}</div>`;
    h += `<div class="pl-row pl-av-pages"><button class="pl-chip" data-pl="avpage" data-f="${key}" data-k="${page - 1}" ${page ? "" : "disabled"}>‹</button><span>${esc(t("Side"))} ${page + 1}/${pages}</span><button class="pl-chip" data-pl="avpage" data-f="${key}" data-k="${page + 1}" ${page < pages - 1 ? "" : "disabled"}>›</button></div>`;
  }
  return h;
}

/* A tap on the wardrobe. Returns true if it was one of ours. */
export function act(a, b, k, st, target) {
  if (a === "avopen") st.avOpen = st.avOpen === k ? "" : k;
  else if (a === "avfam") {
    (st.avFam ||= {})[b.dataset.f] = k;
    (st.avPage ||= {})[b.dataset.f] = 0;
  } else if (a === "avpage") (st.avPage ||= {})[b.dataset.f] = Math.max(0, +k || 0);
  else if (a === "avstep") {
    const f = b.dataset.f, n = +b.dataset.n, cur = target[f] === undefined || target[f] === "" || target[f] === null ? -1 : +target[f];
    const v = ((cur + 1 + +k + (n + 1)) % (n + 1)) - 1;
    target[f] = v < 0 ? "" : v;
  } else if (a === "avrand") Object.assign(target, randomLook());
  else return false;
  return true;
}

export const WARD_CSS = `
.pl-avh { margin-top: 6px; }
.pl-av-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px; margin: 6px 0; }
.pl-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px; border-radius: 14px; border: 3px solid #2B2340; background: #fff; cursor: pointer; min-width: 0; }
.pl-cell[aria-pressed="true"] { background: #FFF3B0; box-shadow: 0 0 0 3px #FFD93D; }
.pl-cell svg { width: 100%; height: 86px; }
.pl-cell small { font: 800 10px system-ui, sans-serif; color: #2B2340; text-align: center; line-height: 1.1; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-none { display: flex; align-items: center; justify-content: center; height: 86px; font-size: 34px; color: #9AA4BA; }
.pl-av-steps { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 6px; margin: 6px 0; }
.pl-av-step { display: flex; align-items: center; gap: 6px; font: 800 13px system-ui, sans-serif; }
.pl-av-step b { min-width: 52px; }
.pl-av-pages { align-items: center; justify-content: center; gap: 12px; font: 800 13px system-ui, sans-serif; }
`;
