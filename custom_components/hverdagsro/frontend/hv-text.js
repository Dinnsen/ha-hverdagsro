/* Hverdagsro – texts. The panel is written in Danish; EN holds the English texts.
   Every module brings its own English texts (export `en`), added with addTexts(map, module). The same Danish word
   can mean different things in two modules ("Klar": ready / bright), so a module's own texts win while the panel
   renders that module (setModule); the shared texts are the fallback. */
import BASE from "./hv-text-en.js";

const EN = { ...BASE };
const BY_MODULE = {};
let current = null;

export function addTexts(map, module = null) {
  if (module) BY_MODULE[module] = { ...(BY_MODULE[module] || {}), ...(map || {}) };
  for (const [k, v] of Object.entries(map || {})) if (!(k in EN)) EN[k] = v;
}

export function setModule(module) {
  current = module;
}

export function translate(lang, text, vars) {
  let s = lang === "en" ? ((current && BY_MODULE[current]?.[text]) ?? EN[text] ?? text) : text;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}
