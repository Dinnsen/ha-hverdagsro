/* Hverdagsro – texts. The panel is written in Danish; EN holds the English texts.
   Every module may bring its own English texts (export `en`), added with addTexts(). */
import BASE from "./hv-text-en.js";

const EN = { ...BASE };

export function addTexts(map) {
  Object.assign(EN, map || {});
}

export function translate(lang, text, vars) {
  let s = lang === "en" ? (EN[text] ?? text) : text;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}
