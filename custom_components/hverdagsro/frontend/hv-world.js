/* Hverdagsro – the play world around the child's room: the family's own house (the rooms drawn in Husbyggeren), the
   garden, and seven areas to open one level at a time. Every place has its own backdrop, things that stand there and
   characters who live there. All data: a new place is a new entry here. Every character is our own. */
import { OL, S, shade } from "./hv-playcat.js";
import { furnish } from "./hv-furnish.js";

const W = 1000, H = 620, FLOOR = 440;
const T3 = 'stroke-width="3"';
const rect = (x, y, w, h, f, rx = 0, o = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${o}/>`;
const out = (o = "") => S(o);
const rep = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");
const skyDef = (s0, s1) => `<linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s0}"/><stop offset="1" stop-color="${s1}"/></linearGradient>`;
const sunMoon = (x, y, tod) => (tod === "night" ? `<circle cx="${x}" cy="${y}" r="26" fill="#FFF6C9"/><circle cx="${x + 12}" cy="${y - 8}" r="24" fill="#1B2150"/>${[[x - 300, 60], [x - 200, 120], [x - 420, 90], [x + 80, 140], [x - 120, 40]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3" fill="#fff" class="pl-twinkle"/>`).join("")}` : `<circle cx="${x}" cy="${y}" r="34" fill="#FFE066"/>`);
const cloud = (x, y, s = 1) => `<g class="pl-cloud" opacity=".9"><ellipse cx="${x}" cy="${y}" rx="${50 * s}" ry="${18 * s}" fill="#fff"/><ellipse cx="${x + 24 * s}" cy="${y - 12 * s}" rx="${30 * s}" ry="${20 * s}" fill="#fff"/></g>`;
const hills = (col, y = 330) => `<path d="M0 ${y} Q160 ${y - 70} 330 ${y - 10} T680 ${y - 20} T1000 ${y - 40} V${FLOOR} H0Z" fill="${col}"/>`;
const ground = (col, line = shade(col, 0.85)) => `${rect(0, FLOOR, W, H - FLOOR, col)}<path d="M0 ${FLOOR} H${W}" stroke="${line}" stroke-width="6"/>`;
const outdoor = (s0, s1, tod, far, near) => `${skyDef(s0, s1)}${rect(0, 0, W, FLOOR, "url(#pl-sky)")}${sunMoon(820, 90, tod)}${tod === "night" ? "" : cloud(200, 90) + cloud(560, 60, 0.8)}${hills(far, 320)}${hills(near, 380)}`;
const house = (x, y, w, h, wall, roof, door = "#C98B55") => `<path d="M${x - 14} ${y} L${x + w / 2} ${y - h * 0.55} L${x + w + 14} ${y}Z" fill="${roof}" ${out()}/>${rect(x, y, w, h, wall, 4, out())}${rect(x + w / 2 - 18, y + h - 54, 36, 54, door, 4, out(T3))}${rect(x + 14, y + 20, 30, 28, "#BFE6FF", 3, out(T3))}${rect(x + w - 44, y + 20, 30, 28, "#BFE6FF", 3, out(T3))}`;

/* ------------------------------------------------------------------ the characters, area by area (all our own) */
/* id: [name, area, description, the drawing (hv-chars), what they say] */
export const NPCS = {
  /* Redningsbyen: a team of rescue dogs, each with their own job */
  bjeff: ["Bjeff", "redning", "En brun og hvid beagle med lange, bløde ører. Politihund i mørkeblå vest med stjernebadge og blå kasket. Rolig og hjælpsom.", { kind: "dog", fur: "#C98B55", belly: "#FFFFFF", ear: "#8B5A2B", ears: "flop", snout: "dog", tail: "wag", outfit: "vest", outc: "#2B3A6E", hat: "cap", hatc: "#2B3A6E", acc: "badge", accc: "#FFD93D" }, ["Alt er i orden her!", "Jeg holder øje med byen.", "Vuf! Godt klaret!"]],
  gnist: ["Gnist", "redning", "En gylden retriever med bløde ører. Brandhund i rød jakke og rød hjelm med gult skjold. Modig og altid klar.", { kind: "dog", fur: "#E9B65A", belly: "#FFF0D0", ear: "#C98B3A", ears: "flop", snout: "dog", tail: "bushy", tailc: "#E9B65A", outfit: "uniform", outc: "#E5484D", hat: "helmet", hatc: "#E5484D" }, ["Vand på, vi kører!", "Ingen ild er for stor.", "Hvor er brandbilen?"]],
  fjer: ["Fjer", "redning", "En lille hvid puddel med krøllet top. Flyverhund i turkis flyverdragt og læderhue med beskyttelsesbriller.", { kind: "dog", fur: "#FFFFFF", belly: "#F3F3F3", ear: "#E8E8E8", ears: "flop", snout: "dog", tail: "puff", outfit: "suit", outc: "#00BBF9", hat: "aviator", hatc: "#A9764C" }, ["Jeg flyver højt!", "Klar til start!", "Wiii!"]],
  mursten: ["Mursten", "redning", "En grå terrier med strittende pels. Byghund i orange overalls og hvid sikkerhedshjelm. Stærk og glad.", { kind: "dog", fur: "#9AA4BA", belly: "#E8EEF6", ears: "point", snout: "dog", tail: "wag", outfit: "overalls", outc: "#FFB347", hat: "hardhat", hatc: "#FFFFFF" }, ["Vi bygger en bro!", "Hvor er hammeren?", "Bank bank bank!"]],
  boelge: ["Bølge", "redning", "En sort newfoundlænder med stor, blød pels. Vandredder i gul redningsvest og sømandshue.", { kind: "dog", fur: "#3A3A55", belly: "#5B5B7A", ears: "flop", snout: "bear", tail: "bushy", tailc: "#3A3A55", outfit: "lifevest", outc: "#FFD93D", hat: "sailor", hatc: "#2B3A6E" }, ["Plask! Jeg elsker vand.", "Hold fast i ringen!", "Båden er klar."]],
  skrue: ["Skrue", "redning", "En plettet blandingshund i lilla og hvid. Reparatør i grøn kasket og rygsæk med værktøj.", { kind: "dog", fur: "#FFFFFF", belly: "#FFFFFF", ears: "point", ear: "#9B5DE5", snout: "dog", tail: "curl", marks: "spots", markc: "#9B5DE5", headmarks: "patch", outfit: "none", hat: "cap", hatc: "#3F9E5A", back: "backpack", backc: "#3F9E5A" }, ["Det kan jeg lave!", "Intet er for gammelt til en ny chance.", "Skru, skru!"]],
  frost: ["Frost", "redning", "En husky med grå ryg og hvid mave og blå øjne. Sneredder i rød vinterjakke og hue med kvast.", { kind: "dog", fur: "#7A849E", belly: "#FFFFFF", ears: "point", snout: "dog", tail: "curl", tailc: "#7A849E", outfit: "hoodie", outc: "#E5484D", hat: "beanie", hatc: "#4D96FF" }, ["Brrr, hvor er her koldt!", "Jeg finder vej i sneen.", "Skal vi kælke?"]],
  sporer: ["Sporer", "redning", "En lille brun gravhund med lange ører. Spejder i grøn vest med kikkert og rygsæk.", { kind: "dog", fur: "#A9764C", belly: "#E8C69A", ears: "flop", ear: "#7A4B2D", snout: "dog", tail: "thin", outfit: "vest", outc: "#5A9E5F", back: "backpack", backc: "#FFB347", acc: "scarf", accc: "#FF6B6B" }, ["Jeg kan lugte et spor!", "Følg mig!", "Hvad er det derovre?"]],
  hanne: ["Havnefoged Hanne", "redning", "Havnefoged med rødt hår i fletning. Mørkeblå uniform med guldknapper og kasket. Leder holdet fra kontroltårnet.", { kind: "person", me: { skin: "#F6C9A3", hair: "hale", hairc: "#C2502A", top: "#2B3A6E", bottom: "#2B3A6E", extra: "ingen" }, wear: [["uniform", "#2B3A6E"], ["cap", "#2B3A6E"]] }, ["Godt arbejde, hold!", "Alle mand til stationen!", "Der er en mission!"]],
  bip: ["Bip", "redning", "En lille rund hjælperobot med hvid skal og blå lys. Holder styr på alt udstyret.", { kind: "robot", fur: "#FFFFFF", icing: "#00BBF9" }, ["Bip bup!", "Udstyret er talt op.", "Alle systemer klar!"]],
  /* Skovbyen: the forest, the farm and the creatures who live there */
  mosse: ["Mosse", "skov", "Et rundt mostrold med grøn pels, små mostotter og store øjne. Bor under de gamle rødder.", { kind: "blob", fur: "#6BCB77" }, ["Pst, jeg gemmer mig.", "Mos er det blødeste.", "Hihi!"]],
  bjoern: ["Brumbasse", "skov", "En stor, blød brun bjørn med rød halstørklæde. Elsker honning og lange lure.", { kind: "bear", fur: "#8B5A2B", belly: "#E8C69A", ears: "round", snout: "bear", tail: "none", acc: "scarf", accc: "#E5484D" }, ["Mmm, honning.", "Skal vi tage en lur?", "Knus?"]],
  hugo: ["Hugo Hare", "skov", "En lysebrun hare med lange ører og blå vest. Hopper hurtigere end alle andre.", { kind: "bunny", fur: "#D9B48F", belly: "#FFFFFF", ears: "long", snout: "mouse", tail: "puff", outfit: "vest", outc: "#4D96FF" }, ["Hop hop!", "Skal vi løbe om kap?", "Gulerødder til alle!"]],
  ugleline: ["Ugleline", "skov", "En klog brun ugle med store briller. Ved alt om stjerner og bøger.", { kind: "owl", fur: "#A9764C", belly: "#F2E3CF", acc: "glasses" }, ["Uhuu.", "Vidste du det?", "Lad os læse en bog."]],
  mille: ["Mille Mus", "skov", "En lille grå mus med store runde ører, lyserød næse og gul kjole.", { kind: "mouse", fur: "#B9BED0", belly: "#F3F3F3", ears: "round", snout: "mouse", tail: "thin", tailc: "#F7B5CF", outfit: "dress", outc: "#FFD93D" }, ["Pip!", "Jeg har fundet en ost.", "Skal vi lege gemme?"]],
  rikke: ["Rikke Ræv", "skov", "En orange ræv med hvid hals og busket hale. Grøn halstørklæde og et drillende smil.", { kind: "fox", fur: "#F08A3C", belly: "#FFFFFF", ears: "point", snout: "cat", tail: "bushy", tailc: "#F08A3C", acc: "scarf", accc: "#5A9E5F" }, ["Fang mig, hvis du kan!", "Jeg kender en hemmelig sti.", "Hehe."]],
  pigge: ["Pigge", "skov", "Et lille rundt pindsvin med brune pigge og lys snude. Ruller sig sammen, når det er genert.", { kind: "hedgehog", fur: "#8B5A2B", belly: "#F2E3CF", ears: "small", snout: "mouse", tail: "none", marks: "stripes", markc: "#5A3A20", hat: "none" }, ["Åh, hej.", "Jeg samler blade.", "Prik prik."]],
  snegl: ["Sneglen Sigurd", "skov", "En langsom, venlig snegl med et stribet hus på ryggen.", { kind: "snail", fur: "#FFD8A8", icing: "#C98B55" }, ["Tag den med ro.", "Jeg kommer, jeg kommer.", "Hvilket dejligt regnvejr."]],
  hilda: ["Høne Hilda", "skov", "En hvid høne med rød kam. Holder styr på alle æggene på gården.", { kind: "hen", fur: "#FFFFFF" }, ["Kluk kluk!", "Nye æg i dag!", "Hvem har taget min regnorm?"]],
  bonde: ["Bonde Bo", "skov", "En glad bonde med skæg, ternet skjorte og grønne overalls. Kører traktoren.", { kind: "person", me: { skin: "#E3A87C", hair: "kort", hairc: "#5B3A21", top: "#E5484D", bottom: "#3F9E5A", extra: "ingen" }, wear: [["cap", "#3F9E5A"], ["vest", "#3F9E5A"]] }, ["Godmorgen!", "Køerne skal fodres.", "Skal du køre med?"]],
  /* Popbyen: Stjerneskud, our own pop group of six, and the people around them */
  luna: ["Luna", "pop", "Sangerinde i Stjerneskud. Langt sort hår, lilla glimmerjakke og stjernebriller. Rolig og sikker på scenen.", { kind: "person", me: { skin: "#E3A87C", hair: "lang", hairc: "#2B1D14", top: "#9B5DE5", bottom: "#1B1530", extra: "popbriller" }, wear: [["mic", ""]] }, ["En, to, tre, fire!", "Syng med!", "Stjerneskud forever!"]],
  kaya: ["Kaya", "pop", "Danser i Stjerneskud. Blåt hår i knold, sporty top og store sneakers. Altid i bevægelse.", { kind: "person", me: { skin: "#B97A52", hair: "knold", hairc: "#4D96FF", top: "#00BBF9", bottom: "#FFFFFF", extra: "ingen" }, wear: [["headphones", "#FF6B6B"]] }, ["Se det her trin!", "Hop og drej!", "Vi øver igen."]],
  mira: ["Mira", "pop", "Rapper i Stjerneskud. Korte lyserøde krøller, oversize hættetrøje og kasket.", { kind: "person", me: { skin: "#F6C9A3", hair: "kroller", hairc: "#F15BB5", top: "#F15BB5", bottom: "#3A3A55", extra: "kasket" } }, ["Yo yo yo!", "Jeg har et nyt rim.", "Beatet er fedt."]],
  zoe: ["Zoe", "pop", "Sangerinde i Stjerneskud. Lang gylden hestehale, hvid scenedragt med guldstjerne.", { kind: "person", me: { skin: "#FFE0C7", hair: "hale", hairc: "#E9C46A", top: "#FFFFFF", bottom: "#E9C46A", extra: "sloife" }, wear: [["star", "#E9C46A"]] }, ["La la laa!", "Højere!", "Det er min yndlingssang."]],
  nia: ["Nia", "pop", "Danser i Stjerneskud. Sort, pjusket hår, orange top og glimmerbukser.", { kind: "person", me: { skin: "#7A4B2D", hair: "pjusk", hairc: "#2B1D14", top: "#FFB347", bottom: "#9B5DE5", extra: "ingen" } }, ["Fem, seks, syv, otte!", "Dans med mig!", "Jeg er klar!"]],
  ivy: ["Ivy", "pop", "Keyboardspiller i Stjerneskud. Grønt hår til skuldrene, runde briller og mintgrøn jakke.", { kind: "person", me: { skin: "#F6C9A3", hair: "lang", hairc: "#6BCB77", top: "#9BD7A0", bottom: "#1B1530", extra: "briller" } }, ["Lyt til den her melodi.", "Pling plong!", "Jeg har skrevet en ny sang."]],
  beat: ["Beat", "pop", "Breakdanser med kort hår, løs t-shirt og kæmpe sneakers.", { kind: "person", me: { skin: "#B97A52", hair: "kort", hairc: "#2B1D14", top: "#FF6B6B", bottom: "#4D96FF", extra: "kasket" } }, ["Se mig snurre!", "Breakdance!", "Bum tjak!"]],
  nova: ["Nova", "pop", "Danser med regnbuefarvet hår og tøj i mange lag.", { kind: "person", me: { skin: "#FFE0C7", hair: "lang", hairc: "#FF6FAE", top: "#4D96FF", bottom: "#FFD93D", extra: "sloife" } }, ["Farver gør mig glad!", "Kom og dans!", "Wow!"]],
  mix: ["Mix", "pop", "Musikproducer med store høretelefoner, grå hættetrøje og en tablet med lyde.", { kind: "person", me: { skin: "#E3A87C", hair: "pjusk", hairc: "#5B3A21", top: "#7A849E", bottom: "#1B1530", extra: "ingen" }, wear: [["headphones", "#1B1530"], ["tablet", ""]] }, ["Mere bas!", "Den skal lige mixes.", "Tryk på knappen!"]],
  stitch: ["Sting", "pop", "Stylist med farverige briller, målebånd om halsen og en taske fuld af tilbehør.", { kind: "person", me: { skin: "#F6C9A3", hair: "knold", hairc: "#9B5DE5", top: "#FFD93D", bottom: "#F15BB5", extra: "briller" }, wear: [["bag", "#F15BB5"]] }, ["Det klæder dig!", "Prøv den her!", "Glimmer gør alt bedre."]],
  /* Slikbyen: the sweet little town */
  snurre: ["Snurre", "slik", "En kanelsnegl med gyldenbrun krop og hvid glasur. Altid i godt humør.", { kind: "bun", fur: "#D9A066" }, ["Duft af kanel!", "Jeg er nybagt.", "Mums!"]],
  glasura: ["Glasura", "slik", "En donut med lyserød glasur og farvet krymmel.", { kind: "donut", fur: "#E3A87C", icing: "#F15BB5" }, ["Krymmel til alle!", "Jeg er rund og glad.", "Hihi!"]],
  muffi: ["Muffi", "slik", "En lilla cupcake med lyserød frosting og et kirsebær på toppen.", { kind: "cupcake", fur: "#9B5DE5", icing: "#F7B5CF" }, ["Pynt mig!", "Hvem har fødselsdag?", "Søde drømme!"]],
  mochimo: ["Mochimo", "slik", "En lille rund, hvid og blød risbolle med små ører.", { kind: "mochi", fur: "#FFFFFF" }, ["Blød og glad.", "Hop!", "Mo mo!"]],
  bea: ["Bea Bær", "slik", "Et jordbær med grøn bladkrone og gule frø.", { kind: "berry", fur: "#FF5A6E" }, ["Jeg er sød!", "Med flødeskum, tak.", "Jordbærsommer!"]],
  makro: ["Makro", "slik", "En lavendelfarvet makron med cremet fyld og en sløjfe.", { kind: "macaron", fur: "#C7B8FF", hat: "bow", hatc: "#F15BB5" }, ["Bonjour!", "Sprød udenpå, blød indeni.", "Smag mig!"]],
  kara: ["Kara Kat", "slik", "En lille karamelfarvet kat med lyserød næse og mintgrønt halsbånd.", { kind: "cat", fur: "#E9B65A", belly: "#FFF0D0", ears: "point", snout: "cat", tail: "curl", acc: "scarf", accc: "#9BD7A0" }, ["Mjav!", "Er der fløde?", "Pur pur."]],
  kiks: ["Kiks", "slik", "En lyserød kanin med lange ører og en lille taske med småkager.", { kind: "bunny", fur: "#F7B5CF", belly: "#FFFFFF", ears: "long", snout: "mouse", tail: "puff", back: "backpack", backc: "#FFD93D" }, ["Vil du have en småkage?", "Hop hop!", "Sødt!"]],
  pebbe: ["Pebbe", "slik", "En lille brun honningkagebamse med hvid glasurkant og rød knap.", { kind: "bear", fur: "#B07A4A", belly: "#D9A066", ears: "round", snout: "bear", outfit: "none", acc: "heart", accc: "#E5484D" }, ["Jeg dufter af jul!", "Knas!", "Hej med dig."]],
  bente: ["Bager Bente", "slik", "Bager med krøllet brunt hår, hvid kokkehue og lyserødt forklæde. Bager hele natten.", { kind: "person", me: { skin: "#F6C9A3", hair: "kroller", hairc: "#7A4B2D", top: "#FFFFFF", bottom: "#F7B5CF", extra: "ingen" }, wear: [["apron", "#F7B5CF"], ["chef", ""]] }, ["Friskbagt!", "Hvad skal det være?", "Smag en kage!"]],
  /* Eventyrparken: the park mascots */
  blomma: ["Blomma", "park", "En blomstermaskot med gule kronblade, grønne blade og et stort smil.", { kind: "flower", fur: "#FFD93D", icing: "#FFB347" }, ["Velkommen i parken!", "Duft til mig!", "Sommer!"]],
  pjus: ["Pjus", "park", "En lille fantasikanin med lyseblå pels, store øjne og en farverig vest.", { kind: "bunny", fur: "#C7E6FF", belly: "#FFFFFF", ears: "long", snout: "mouse", tail: "puff", outfit: "vest", outc: "#F15BB5" }, ["Skal vi i karrusellen?", "Hop!", "Juhu!"]],
  dino: ["Dino", "park", "En lille grøn dinosaur med rund mave, korte arme og orange takker.", { kind: "dino", fur: "#6BCB77" }, ["Roooar! Bare for sjov.", "Jeg er en venlig dino.", "Hvem vil på rutsjebanen?"]],
  lilli: ["Lilli", "park", "En sommerfugl med pastelfarvede vinger, antenner og en lille kjole.", { kind: "butterfly", fur: "#9B5DE5", icing: "#C7B8FF", icing2: "#FFB4C2" }, ["Flagre flagre!", "Se mine vinger!", "Blomsterne er så smukke."]],
  bobo: ["Bobo", "park", "En brun bjørnemaskot i grøn parkuniform og kasket.", { kind: "bear", fur: "#A9764C", belly: "#E8C69A", ears: "round", snout: "bear", outfit: "uniform", outc: "#3F9E5A", hat: "cap", hatc: "#3F9E5A" }, ["Har du din billet?", "Følg kortet!", "God tur!"]],
  sproejt: ["Sprøjt", "park", "En blå vandmaskot formet som en dråbe med svømmebriller.", { kind: "drop", fur: "#4FB3FF", acc: "goggles", accc: "#FFD93D" }, ["Plask!", "Hvem vil i vandlandet?", "Pas på, jeg sprøjter!"]],
  flora: ["Flora", "park", "Gartner med blomsterkrans, grønne overalls og en lille vandkande.", { kind: "person", me: { skin: "#E3A87C", hair: "lang", hairc: "#A8642A", top: "#FFF0B8", bottom: "#5A9E5F", extra: "ingen" }, wear: [["vest", "#5A9E5F"]] }, ["Blomsterne skal vandes.", "Se, en sommerfugl!", "Hvor er det grønt."]],
  kvikke: ["Kvikke", "park", "En hurtig orange rævemaskot med sporty sko og et stort smil.", { kind: "fox", fur: "#FF8A3C", belly: "#FFFFFF", ears: "point", snout: "cat", tail: "bushy", tailc: "#FF8A3C", outfit: "hoodie", outc: "#4D96FF" }, ["Hurtigere!", "Kom nu!", "Jeg vandt!"]],
  tang: ["Tang", "park", "En lille turkis havfigur med bølget hår og en redningsring.", { kind: "drop", fur: "#2EC4B6", hat: "flowers" }, ["Bølgerne kalder.", "Svømmetur?", "Blub blub."]],
  parko: ["Parkvært Pelle", "park", "Parkvært med farverig uniform, navneskilt, kasket og en taske med billetter.", { kind: "person", me: { skin: "#F6C9A3", hair: "kort", hairc: "#E9C46A", top: "#FF6B6B", bottom: "#4D96FF", extra: "ingen" }, wear: [["uniform", "#FF6B6B"], ["cap", "#FFD93D"], ["bag", "#4D96FF"]] }, ["Billetter her!", "Velkommen!", "God fornøjelse!"]],
  /* Teknobyen: our own heroes of science and inventions */
  volt: ["Volt", "tekno", "Helt i turkis dragt med et batteri på brystet og gule handsker. Kan lade alt op med sine hænder.", { kind: "person", me: { skin: "#E3A87C", hair: "pjusk", hairc: "#2B1D14", top: "#2EC4B6", bottom: "#2EC4B6", extra: "ingen" }, wear: [["visor", "#FFD93D"], ["bolt", "#FFD93D"]] }, ["Fuld opladning!", "Bzzzt!", "Energi til alle!"]],
  kvantia: ["Kvantia", "tekno", "Opfinder og heltinde i lilla laboratoriekittel med svævende briller og en lysende tablet.", { kind: "person", me: { skin: "#7A4B2D", hair: "kroller", hairc: "#2B1D14", top: "#9B5DE5", bottom: "#3A3A55", extra: "briller" }, wear: [["labcoat", ""], ["tablet", ""]] }, ["Lad os eksperimentere!", "Hypotese bekræftet!", "Videnskab er magi, man kan forklare."]],
  turbo: ["Turbo", "tekno", "Helt med raketstøvler, orange og hvid dragt og en rund hjelm.", { kind: "person", me: { skin: "#F6C9A3", hair: "kort", hairc: "#E9C46A", top: "#FFB347", bottom: "#FFFFFF", extra: "ingen" }, wear: [["helmet", "#FFFFFF"], ["star", "#FFB347"]] }, ["Fuld fart frem!", "Wroom!", "Jeg er tilbage før du ved det."]],
  pixel: ["Pixel", "tekno", "Digital heltinde med firkantet hår i mange farver og et lysende visir.", { kind: "person", me: { skin: "#FFE0C7", hair: "knold", hairc: "#00BBF9", top: "#1B1530", bottom: "#1B1530", extra: "ingen" }, wear: [["visor", "#6BCB77"], ["star", "#00BBF9"]] }, ["Indlæser…", "Level up!", "Jeg kan hacke legetøjet."]],
  magnus: ["Magnus Magnet", "tekno", "Helt i sølv og grøn dragt med en hesteskomagnet på brystet. Kan tiltrække metal.", { kind: "person", me: { skin: "#B97A52", hair: "kort", hairc: "#2B1D14", top: "#9AA4BA", bottom: "#5A9E5F", extra: "ingen" }, wear: [["cape", "#5A9E5F"], ["mask", "#5A9E5F"]] }, ["Klonk! Fik den.", "Alt metal, kom her!", "Magnetisk!"]],
  solveig: ["Solveig Sol", "tekno", "Heltinde i gul og koral dragt med en solskive på ryggen. Lyser op i mørket.", { kind: "person", me: { skin: "#F6C9A3", hair: "lang", hairc: "#FFB347", top: "#FFD93D", bottom: "#FF8A6B", extra: "ingen" }, wear: [["cape", "#FF8A6B"], ["star", "#FFFFFF"]] }, ["Solskin til alle!", "Mørket er væk!", "Varm og glad."]],
  ekko: ["Ekko", "tekno", "Lydhelt med store høretelefoner, blå dragt med lydbølger og en lille højttaler på armen.", { kind: "person", me: { skin: "#E3A87C", hair: "pjusk", hairc: "#4D96FF", top: "#4D96FF", bottom: "#1B1530", extra: "ingen" }, wear: [["headphones", "#FF6B6B"]] }, ["HALLO!", "Hører du det?", "Ekko… ekko…"]],
  gizmo: ["Gizmo", "tekno", "En lille orange robothund med antenner og hjul i stedet for poter.", { kind: "robot", fur: "#FFB347", icing: "#6BCB77", hat: "antenna", hatc: "#FF6B6B" }, ["Vov-bip!", "Jeg kan hente!", "Batteri 100 %."]],
  prisme: ["Professor Prisme", "tekno", "En gammel opfinder med hvidt pjusket hår, laboratoriekittel og regnbuebriller.", { kind: "person", me: { skin: "#F6C9A3", hair: "pjusk", hairc: "#F3F3F3", top: "#4D96FF", bottom: "#3A3A55", extra: "briller" }, wear: [["labcoat", ""]] }, ["Eureka!", "Hvem har set min skruetrækker?", "Lad os prøve igen."]],
  byggebot: ["Byggebot", "tekno", "En høj gul byggerobot med kranarm og blinkende lys.", { kind: "robot", fur: "#FFD93D", icing: "#FF6B6B", hat: "hardhat", hatc: "#FFB347" }, ["Byg byg!", "Klar til opgave.", "Bip boop."]],
  /* Natbyen: our own heroes of the night (mysterious, never scary) */
  natugle: ["Natugle", "nat", "En ugleheltinde i mørkeblå dragt med fjerkappe og sølvmaske. Ser alt om natten.", { kind: "owl", fur: "#2B3A6E", belly: "#B9BED0", acc: "mask", accc: "#CFD6E6", back: "cape", backc: "#1B2150" }, ["Uhuu, jeg ser dig.", "Natten er min.", "Følg månen."]],
  maaneskin: ["Måneskin", "nat", "Heltinde i sølv og lavendel med en måne på brystet og en glitrende kappe.", { kind: "person", me: { skin: "#FFE0C7", hair: "lang", hairc: "#CFD6E6", top: "#C7B8FF", bottom: "#3A3A55", extra: "ingen" }, wear: [["cape", "#7A6A8A"], ["star", "#FFF6C9"]] }, ["Lys i mørket.", "Se månen!", "God nat, by."]],
  lygte: ["Lygtemanden", "nat", "Helt i mørkegrøn dragt med en varm lanterne, der aldrig går ud.", { kind: "person", me: { skin: "#B97A52", hair: "kort", hairc: "#2B1D14", top: "#2F4F4F", bottom: "#1B1530", extra: "ingen" }, wear: [["hood", "#2F4F4F"], ["wand", ""]] }, ["Jeg lyser vejen.", "Ingen er alene i mørket.", "Følg lyset."]],
  skygge: ["Skygge", "nat", "En smidig sort ræv i mørk dragt med lilla maske. Kan gemme sig hvor som helst.", { kind: "fox", fur: "#3A3A55", belly: "#7A6A8A", ears: "point", snout: "cat", tail: "bushy", tailc: "#3A3A55", acc: "mask", accc: "#9B5DE5" }, ["Hvor blev jeg af?", "Shhh.", "Her er jeg!"]],
  stjernekaster: ["Stjernekaster", "nat", "Tryllehelt i mørkeblå kappe med stjerner, der kan kaste lysende stjerner.", { kind: "person", me: { skin: "#E3A87C", hair: "kroller", hairc: "#2B1D14", top: "#1B2150", bottom: "#1B2150", extra: "ingen" }, wear: [["cape", "#4D96FF"], ["wand", ""]] }, ["Abrakadabra!", "Ønsk dig noget!", "Stjerneregn!"]],
  drilsk: ["Doktor Drilsk", "nat", "En fjollet opfinder med prikket jakke og en kæmpe sløjfe. Laver sjove opfindelser, der altid går galt.", { kind: "person", me: { skin: "#F6C9A3", hair: "pjusk", hairc: "#FF6B6B", top: "#FFD93D", bottom: "#4D96FF", extra: "ingen" }, wear: [["labcoat", ""], ["scarf", "#F15BB5"]] }, ["Muhaha! Ups.", "Det var ikke meningen!", "Min nye opfindelse virker… næsten."]],
  konfetti: ["Konfetti", "nat", "En spøgefugl med regnbuehår, farvestrålende tøj og en konfettikanon. Elsker at lave sjov.", { kind: "person", me: { skin: "#7A4B2D", hair: "kroller", hairc: "#9B5DE5", top: "#6BCB77", bottom: "#F15BB5", extra: "ingen" }, wear: [["scarf", "#FFD93D"]] }, ["Overraskelse!", "Pang! Konfetti!", "Hihi, fik dig!"]],
  vagtbot: ["Vagtbot", "nat", "En høj sølvrobot med blå lys, der passer på byen om natten.", { kind: "robot", fur: "#9AA4BA", icing: "#4D96FF", hat: "antenna", hatc: "#4D96FF" }, ["Alt er roligt.", "Patrulje fortsætter.", "Bip. God nat."]],
  ravna: ["Ravna", "nat", "Heltinde med fjerkappe i sort og blå, sølvmaske og et klogt blik.", { kind: "person", me: { skin: "#FFE0C7", hair: "lang", hairc: "#1B1530", top: "#1B1530", bottom: "#2B3A6E", extra: "ingen" }, wear: [["cape", "#2B3A6E"], ["mask", "#CFD6E6"]] }, ["Krah!", "Jeg flyver over tagene.", "Byen sover trygt."]],
  havfrand: ["Havfrand", "nat", "En havhelt med grønne skæl, tangkappe og en skal på brystet. Passer på havnen.", { kind: "person", me: { skin: "#E3A87C", hair: "lang", hairc: "#2EC4B6", top: "#2EC4B6", bottom: "#5A9E5F", extra: "ingen" }, wear: [["cape", "#5A9E5F"], ["heart", "#FFB4C2"]] }, ["Havet er roligt.", "Fiskene siger hej.", "Blub!"]],
};

/* ------------------------------------------------------------------ the places */
/* Each place: name, area, a backdrop (sky s0/s1 and time of day), the things that stand there [key, x, y], and who
   lives there [character, x, y]. */
const P = {
  have: {
    n: "Haven", area: "hjem", em: "🌳",
    bg: (s0, s1, tod) => `${outdoor(s0, s1, tod, "#9BD7A0", "#7CC489")}<path d="M0 ${FLOOR - 70} H${W} V${FLOOR} H0Z" fill="#5A9E5F" opacity=".5"/>${rep(25, (i) => `<rect x="${i * 40 + 4}" y="${FLOOR - 70}" width="12" height="70" rx="4" fill="#C98B55" ${out(T3)}/>`)}<path d="M0 ${FLOOR - 50} H${W} M0 ${FLOOR - 20} H${W}" stroke="#A9764C" stroke-width="8"/>${ground("#7CC489")}`,
    decor: [["trae", 120, 470], ["trampolinhave", 360, 560], ["havemoebel", 730, 600], ["blomsterbed", 900, 520], ["sandkasse", 560, 610], ["gyngestativ", 860, 470]],
  },
  "redning-station": {
    n: "Redningsstationen", area: "redning", em: "🚒",
    bg: (s0, s1, tod) => `${outdoor(s0, s1, tod, "#9BD7A0", "#8FC7E8")}${house(60, 160, 380, 280, "#E5484D", "#2B3A6E", "#FFD93D")}<rect x="120" y="300" width="120" height="140" fill="#3A3A55" ${out()}/>${rep(5, (i) => `<path d="M120 ${310 + i * 26} H240" stroke="#7A849E" stroke-width="4"/>`)}<rect x="280" y="300" width="120" height="140" fill="#3A3A55" ${out()}/>${rep(5, (i) => `<path d="M280 ${310 + i * 26} H400" stroke="#7A849E" stroke-width="4"/>`)}<text x="250" y="270" font-size="34" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui">REDNING</text>${ground("#B9BED0", "#9AA4BA")}${rep(10, (i) => `<rect x="${i * 100 + 20}" y="${FLOOR + 80}" width="60" height="10" rx="5" fill="#fff"/>`)}`,
    decor: [["brandbil", 520, 600], ["politibil", 780, 610], ["brandhane", 940, 560], ["hejsekran", 680, 470], ["skilt", 900, 470]],
    npcs: [["bjeff", 560, 520], ["gnist", 420, 560], ["mursten", 700, 580], ["hanne", 860, 600], ["bip", 320, 610]],
  },
  "redning-havn": {
    n: "Havnen", area: "redning", em: "⚓",
    bg: (s0, s1, tod) => `${skyDef(s0, s1)}${rect(0, 0, W, 300, "url(#pl-sky)")}${sunMoon(820, 90, tod)}${tod === "night" ? "" : cloud(260, 80)}${rect(0, 300, W, H - 300, "#4FB3FF")}<path d="M0 300 H${W}" stroke="#2F8FD6" stroke-width="5"/>${rep(8, (i) => `<path d="M${i * 130 + 20} ${340 + (i % 3) * 30} q20 -10 40 0" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>`)}<path d="M620 300 V180 L660 140 L700 180 V300Z" fill="#fff" ${out()}/><path d="M620 210 H700 M620 250 H700" stroke="#E5484D" stroke-width="16"/>${rect(0, FLOOR, W, H - FLOOR, "#C98B55")}${rep(20, (i) => `<path d="M${i * 50} ${FLOOR} V${H}" stroke="#A9764C" stroke-width="3"/>`)}`,
    decor: [["redningsbaad", 220, 400], ["boeje", 520, 380], ["boeje", 880, 420], ["redningsring", 760, 300], ["fyrtaarn", 940, 600], ["bro", 420, 520]],
    npcs: [["boelge", 300, 600], ["fjer", 480, 580], ["frost", 640, 600], ["skrue", 780, 590], ["sporer", 160, 590]],
  },
  "skov-lysning": {
    n: "Skovlysningen", area: "skov", em: "🌲",
    bg: (s0, s1, tod) => `${outdoor(s0, s1, tod, "#5A9E5F", "#6BCB77")}${rep(9, (i) => `<path d="M${i * 120 - 20} ${FLOOR} L${i * 120 + 30} ${200 + (i % 3) * 30} L${i * 120 + 80} ${FLOOR}Z" fill="${i % 2 ? "#3F7F4A" : "#4E9A5A"}" ${out(T3)}/>`)}${ground("#7CC489")}${rep(14, (i) => `<circle cx="${i * 72 + 30}" cy="${FLOOR + 30 + (i % 3) * 40}" r="6" fill="${["#FF6B6B", "#FFD93D", "#fff"][i % 3]}"/>`)}`,
    decor: [["svampehus", 180, 470], ["trae", 860, 460], ["busk", 540, 470], ["baenk", 640, 600]],
    npcs: [["mosse", 340, 590], ["bjoern", 520, 600], ["ugleline", 780, 470], ["rikke", 700, 590], ["pigge", 240, 610], ["snegl", 900, 610]],
  },
  "skov-gaard": {
    n: "Bondegården", area: "skov", em: "🐔",
    bg: (s0, s1, tod) => `${outdoor(s0, s1, tod, "#B5D99C", "#9BD7A0")}<path d="M520 ${FLOOR} V230 L660 150 L800 230 V${FLOOR}Z" fill="#C2502A" ${out()}/><path d="M600 ${FLOOR} V320 H720 V${FLOOR}" fill="#8B3A1F" ${out()}/><path d="M600 320 L720 ${FLOOR} M720 320 L600 ${FLOOR}" stroke="#fff" stroke-width="8"/>${rep(10, (i) => `<rect x="${i * 50 + 20}" y="${FLOOR - 50}" width="10" height="50" fill="#FFFFFF" ${out(T3)}/>`)}<path d="M0 ${FLOOR - 40} H500 M0 ${FLOOR - 16} H500" stroke="#FFFFFF" stroke-width="7"/>${ground("#C9B26B", "#A9924B")}`,
    decor: [["traktor", 220, 600], ["hoeballe", 860, 600], ["hoeballe", 900, 520], ["blomsterbed", 420, 520]],
    npcs: [["bonde", 520, 600], ["hilda", 700, 600], ["hugo", 360, 610], ["mille", 800, 610]],
  },
  "pop-studie": {
    n: "Dansestudiet", area: "pop", em: "💃",
    bg: () => `${rect(0, 0, W, FLOOR, "#2B2340")}${rep(6, (i) => `<rect x="${i * 170 + 20}" y="60" width="140" height="300" rx="10" fill="#C7E6FF" opacity=".25" ${out(T3)}/>`)}<path d="M0 360 H${W}" stroke="#FFD93D" stroke-width="10"/>${rep(8, (i) => `<g class="pl-lamp"><circle cx="${80 + i * 120}" cy="30" r="22" class="pl-glow on" fill="${["#F15BB5", "#00BBF9", "#FFD93D"][i % 3]}"/><circle cx="${80 + i * 120}" cy="30" r="10" fill="${["#F15BB5", "#00BBF9", "#FFD93D"][i % 3]}"/></g>`)}${rect(0, FLOOR, W, H - FLOOR, "#C98B55")}${rep(12, (i) => `<path d="M${i * 90} ${FLOOR} L${i * 90 - 60} ${H}" stroke="#A9764C" stroke-width="3"/>`)}`,
    decor: [["hoejttaler", 80, 600], ["hoejttaler", 920, 600], ["keyboard", 760, 520], ["discokugle", 500, 150], ["neonhjerte", 260, 200]],
    npcs: [["kaya", 300, 600], ["nia", 440, 580], ["beat", 580, 600], ["nova", 700, 590], ["mix", 860, 520], ["stitch", 160, 520]],
  },
  "pop-scene": {
    n: "Koncertscenen", area: "pop", em: "🎤",
    bg: () => `${rect(0, 0, W, H, "#1B1530")}${[[200, "#F15BB5"], [500, "#FFE066"], [800, "#00BBF9"]].map(([x, c]) => `<path d="M${x} -10 L${x - 160} ${FLOOR + 40} H${x + 160}Z" fill="${c}" opacity=".18" class="pl-beam"/>`).join("")}<path d="M0 0 H${W} V60 Q${W / 2} 100 0 60Z" fill="#9B5DE5" ${out()}/><text x="500" y="44" font-size="34" font-weight="900" text-anchor="middle" fill="#FFD93D" font-family="system-ui">★ STJERNESKUD ★</text>${rect(0, FLOOR, W, H - FLOOR, "#3A3A55")}<path d="M0 ${FLOOR} H${W}" stroke="#F15BB5" stroke-width="8"/>${rep(14, (i) => `<g class="pl-lamp"><circle cx="${40 + i * 70}" cy="${FLOOR + 10}" r="12" class="pl-glow on" fill="#FFE8A3"/><circle cx="${40 + i * 70}" cy="${FLOOR + 10}" r="6" fill="#FFE066"/></g>`)}`,
    decor: [["spotlight", 90, 600], ["spotlight", 910, 600], ["mikrofon", 500, 590], ["glimmergardin", 500, 300]],
    npcs: [["luna", 500, 560], ["zoe", 360, 580], ["mira", 640, 580], ["ivy", 800, 600]],
  },
  "slik-bageri": {
    n: "Bageriet", area: "slik", em: "🧁",
    bg: () => `${rect(0, 0, W, FLOOR, "#FFE4EE")}${rep(20, (i) => `<path d="M${i * 50} 0 V${FLOOR}" stroke="#FFD1E3" stroke-width="22"/>`)}<path d="M0 0 H${W} V60 ${rep(10, (i) => `Q${i * 100 + 50} 100 ${(i + 1) * 100} 60`)} V0Z" fill="#F15BB5" ${out()}/>${rect(0, FLOOR, W, H - FLOOR, "#FFF6EE")}${rep(10, (i) => rep(3, (j) => `<rect x="${i * 100 + ((j % 2) * 50)}" y="${FLOOR + j * 60}" width="50" height="60" fill="#F7B5CF" opacity=".5"/>`))}`,
    decor: [["kagedisk", 300, 600], ["bagerovn", 760, 470], ["lagkage", 300, 450], ["slikautomat", 920, 600]],
    npcs: [["bente", 560, 600], ["snurre", 120, 600], ["muffi", 440, 600], ["mochimo", 660, 610], ["pebbe", 820, 600]],
  },
  "slik-butik": {
    n: "Slikbutikken", area: "slik", em: "🍭",
    bg: () => `${rect(0, 0, W, FLOOR, "#E2D5FF")}${rep(12, (i) => `<circle cx="${i * 90 + 40}" cy="${50 + (i % 2) * 30}" r="${10 + (i % 3) * 4}" fill="${["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#F15BB5"][i % 5]}" opacity=".6"/>`)}${rect(0, FLOOR, W, H - FLOOR, "#9BE7C4")}${rep(10, (i) => `<path d="M${i * 100} ${FLOOR} l50 ${H - FLOOR} M${i * 100 + 50} ${FLOOR} l-50 ${H - FLOOR}" stroke="#7FD3AE" stroke-width="5"/>`)}`,
    decor: [["slikhylde", 200, 470], ["slikhylde", 800, 470], ["slikautomat", 500, 600], ["slikskaal", 360, 600]],
    npcs: [["glasura", 300, 600], ["bea", 640, 600], ["makro", 760, 610], ["kara", 120, 610], ["kiks", 900, 600]],
  },
  "park-plads": {
    n: "Eventyrparken", area: "park", em: "🎡",
    bg: (s0, s1, tod) => `${outdoor(s0, s1, tod, "#9BD7A0", "#7CC489")}${rep(16, (i) => `<path d="M${i * 66} 40 l33 30 l33 -30" fill="${["#FF6B6B", "#FFD93D", "#4D96FF", "#6BCB77"][i % 4]}" ${out(T3)}/>`)}<path d="M0 40 H${W}" stroke="${OL}" stroke-width="3"/>${ground("#F2D7A0", "#E3BE7F")}`,
    decor: [["pariserhjul", 200, 460], ["karrusel", 760, 470], ["isbod", 520, 470], ["blomsterbed", 380, 600], ["baenk", 900, 600]],
    npcs: [["blomma", 340, 570], ["pjus", 480, 600], ["bobo", 620, 600], ["parko", 120, 600], ["kvikke", 820, 600]],
  },
  "park-vand": {
    n: "Vandlandet", area: "park", em: "💦",
    bg: (s0, s1, tod) => `${outdoor(s0, s1, tod, "#9BD7A0", "#7CC489")}${ground("#C7E6FF", "#9DCBEF")}${rep(12, (i) => `<rect x="${i * 84}" y="${FLOOR + (i % 2) * 40}" width="84" height="40" fill="#E8F6FF" opacity=".8"/>`)}`,
    decor: [["rutsjebane", 220, 470], ["badebassin", 560, 600], ["fontaene", 820, 470], ["parasol", 920, 600]],
    npcs: [["sproejt", 420, 590], ["tang", 680, 600], ["dino", 300, 610], ["lilli", 820, 600], ["flora", 140, 600]],
  },
  "tekno-lab": {
    n: "Laboratoriet", area: "tekno", em: "🧪",
    bg: () => `${rect(0, 0, W, FLOOR, "#E8F6FF")}${rep(5, (i) => `<rect x="${i * 200 + 20}" y="40" width="160" height="110" rx="12" fill="#C7E6FF" ${out(T3)}/><path d="M${i * 200 + 40} 110 l30 -30 l30 20 l30 -40 l30 20" stroke="#00BBF9" stroke-width="4" fill="none"/>`)}<path d="M0 220 H${W}" stroke="#9AA4BA" stroke-width="6"/>${rect(0, FLOOR, W, H - FLOOR, "#CFD6E6")}${rep(10, (i) => rep(3, (j) => `<rect x="${i * 100 + 4}" y="${FLOOR + j * 60 + 4}" width="92" height="52" rx="6" fill="#DDE3EE"/>`))}`,
    decor: [["labbord", 260, 600], ["kontrolpult", 720, 470], ["hologram", 520, 470], ["robotarm", 900, 600]],
    npcs: [["kvantia", 420, 600], ["prisme", 140, 600], ["gizmo", 600, 610], ["byggebot", 800, 600], ["ekko", 300, 520]],
  },
  "tekno-tag": {
    n: "Heltenes tagterrasse", area: "tekno", em: "🏙️",
    bg: (s0, s1, tod) => `${skyDef(s0, s1)}${rect(0, 0, W, FLOOR, "url(#pl-sky)")}${sunMoon(820, 90, tod)}${rep(9, (i) => `<rect x="${i * 115}" y="${120 + (i * 37) % 120}" width="100" height="${FLOOR}" fill="${["#7A849E", "#9AA4BA", "#646E88"][i % 3]}" ${out(T3)}/>${rep(4, (j) => `<rect x="${i * 115 + 16}" y="${150 + (i * 37) % 120 + j * 50}" width="20" height="24" fill="${tod === "night" ? "#FFE066" : "#C7E6FF"}"/><rect x="${i * 115 + 60}" y="${150 + (i * 37) % 120 + j * 50}" width="20" height="24" fill="${tod === "night" ? "#FFE066" : "#C7E6FF"}"/>`)}`)}${rect(0, FLOOR, W, H - FLOOR, "#9AA4BA")}<path d="M0 ${FLOOR} H${W}" stroke="#FFD93D" stroke-width="8" stroke-dasharray="40 20"/>`,
    decor: [["heltestatue", 500, 470], ["antennemast", 900, 470], ["raket", 140, 600]],
    npcs: [["volt", 320, 600], ["turbo", 660, 590], ["pixel", 780, 610], ["magnus", 420, 590], ["solveig", 560, 610]],
  },
  "nat-gade": {
    n: "Natbyens gade", area: "nat", em: "🌙",
    bg: () => `${rect(0, 0, W, FLOOR, "#1B2150")}<circle cx="820" cy="100" r="50" fill="#FFF6C9"/><circle cx="844" cy="86" r="46" fill="#1B2150"/>${rep(12, (i) => `<circle cx="${(i * 83) % 1000}" cy="${30 + (i * 47) % 140}" r="3" fill="#fff" class="pl-twinkle"/>`)}${rep(7, (i) => `<path d="M${i * 150} ${FLOOR} V${190 + (i % 3) * 40} L${i * 150 + 40} ${150 + (i % 3) * 40} L${i * 150 + 80} ${190 + (i % 3) * 40} V${FLOOR}Z" fill="${["#2B2340", "#3A2E5A", "#2E3A6E"][i % 3]}" ${out(T3)}/>${rep(3, (j) => `<rect x="${i * 150 + 24}" y="${220 + (i % 3) * 40 + j * 60}" width="30" height="30" rx="15" fill="#FFE066" opacity="${(i + j) % 3 ? 0.9 : 0.3}"/>`)}`)}${rect(0, FLOOR, W, H - FLOOR, "#3A3A55")}${rep(14, (i) => `<rect x="${i * 72}" y="${FLOOR + 80}" width="40" height="8" rx="4" fill="#7A6A8A"/>`)}`,
    decor: [["lygtepael", 140, 470], ["lygtepael", 860, 470], ["baenk", 500, 470], ["skraldespand", 700, 470]],
    npcs: [["maaneskin", 300, 600], ["lygte", 520, 600], ["stjernekaster", 680, 600], ["drilsk", 840, 610], ["konfetti", 160, 610]],
  },
  "nat-hule": {
    n: "Den hemmelige hule", area: "nat", em: "🦉",
    bg: () => `${rect(0, 0, W, H, "#241B3A")}<path d="M0 0 H${W} V120 Q800 200 600 120 T200 140 T0 100Z" fill="#1B1530" ${out()}/>${rep(8, (i) => `<path d="M${i * 130 + 40} 110 l14 50 l14 -50Z" fill="#3A2E5A" ${out(T3)}/>`)}${rep(6, (i) => `<g class="pl-lamp"><circle cx="${100 + i * 160}" cy="230" r="30" class="pl-glow on" fill="#9BE7FF"/><circle cx="${100 + i * 160}" cy="230" r="10" fill="#9BE7FF"/></g>`)}${rect(0, FLOOR, W, H - FLOOR, "#3A2E5A")}<path d="M0 ${FLOOR} H${W}" stroke="#9B5DE5" stroke-width="6"/>`,
    decor: [["kontrolpult", 760, 470], ["hologram", 300, 470], ["skattekiste", 520, 600], ["heltestatue", 120, 470]],
    npcs: [["natugle", 420, 590], ["skygge", 640, 600], ["vagtbot", 880, 600], ["ravna", 240, 600], ["havfrand", 760, 600]],
  },
};

/* The areas on the map, and the level that opens them. */
export const AREAS = [
  { id: "hjem", n: "Huset", em: "🏠", lvl: 1, x: 500, y: 290, col: "#FFD93D" },
  { id: "redning", n: "Redningsbyen", em: "🚒", lvl: 2, x: 150, y: 440, col: "#E5484D" },
  { id: "skov", n: "Skovbyen", em: "🌲", lvl: 3, x: 150, y: 190, col: "#5A9E5F" },
  { id: "pop", n: "Popbyen", em: "🎤", lvl: 3, x: 850, y: 190, col: "#9B5DE5" },
  { id: "park", n: "Eventyrparken", em: "🎡", lvl: 4, x: 850, y: 440, col: "#FFB347" },
  { id: "slik", n: "Slikbyen", em: "🧁", lvl: 5, x: 500, y: 510, col: "#F15BB5" },
  { id: "tekno", n: "Teknobyen", em: "🤖", lvl: 6, x: 320, y: 86, col: "#00BBF9" },
  { id: "nat", n: "Natbyen", em: "🌙", lvl: 7, x: 680, y: 86, col: "#2B3A6E" },
];
export const PLACES = P;

/* ------------------------------------------------------------------ the family's own house (from Husbyggeren) */
const guessType = (n) => {
  n = String(n || "").toLowerCase();
  return /køkken|kokken|alrum|kitchen/.test(n) ? "kitchen" : /stue|opholds|living/.test(n) ? "living" : /sove|bedroom/.test(n) ? "bed" : /bad|bath|toilet|wc/.test(n) ? "bath" : /kontor|office/.test(n) ? "office" : /bryggers|vask|utility/.test(n) ? "utility" : /entr|gang|hall/.test(n) ? "hall" : /garage|carport/.test(n) ? "garage" : /værelse|vaerelse|børn|born|kid/.test(n) ? "kid" : "other";
};
const ROOMLOOK = {
  living: { wall: "#F2E3CF", floor: "#C98B55", decor: [["sofa", 300, 560], ["sofabord", 320, 610], ["tv", 760, 520], ["gulvtaeppe", 420, 610], ["stueplante", 920, 520], ["maleri", 300, 240], ["familiefoto", 560, 230]] },
  kitchen: { wall: "#E8F6FF", floor: "#E8E8E8", tiles: "#C7E6FF", decor: [["koekken", 300, 470], ["komfur", 520, 470], ["koeleskab", 660, 470], ["spisebord", 820, 600], ["chair", 720, 600], ["chair", 930, 600]] },
  bath: { wall: "#E8F6FF", floor: "#FFFFFF", tiles: "#BFE6FF", decor: [["badekar", 220, 560], ["bruser", 440, 500], ["toilet", 600, 520], ["haandvask", 760, 470], ["vaskemaskine", 900, 520]] },
  bed: { wall: "#E2D5FF", floor: "#C98B55", decor: [["dobbeltseng", 380, 560], ["natbord", 160, 520], ["natbord", 600, 520], ["wardrobe", 860, 470], ["maleri", 380, 230]] },
  office: { wall: "#F2E3CF", floor: "#A9764C", decor: [["desk", 400, 520], ["gamerstol", 420, 580], ["shelf", 800, 470], ["skaerm", 400, 390]] },
  hall: { wall: "#FFF0B8", floor: "#A9764C", decor: [["knager", 300, 240], ["skoreol", 300, 520], ["stueplante", 800, 520], ["familiefoto", 640, 230]] },
  utility: { wall: "#E8F6FF", floor: "#CFD6E6", tiles: "#E2E8F0", decor: [["vaskemaskine", 300, 520], ["vaskemaskine", 440, 520], ["shelf", 760, 470]] },
  garage: { wall: "#CFD6E6", floor: "#9AA4BA", decor: [["bil", 420, 590], ["cykel", 820, 600], ["vaerktoejsvaeg", 760, 250], ["skraldespand", 920, 520]] },
  kid: { wall: "#C7E6FF", floor: "#E8C69A", decor: [["bed", 260, 560], ["desk", 760, 520], ["rug", 520, 610], ["shelf", 900, 470]] },
  other: { wall: "#F2E3CF", floor: "#C98B55", decor: [["shelf", 260, 470], ["stueplante", 800, 520], ["baenk", 520, 600]] },
};
function roomBackdrop(look, s0, s1, tod, wd = W) {
  // The family may have painted the room (Byg › Væg og gulv): BG.look has their colours.
  const L = { ...(ROOMLOOK[look] || ROOMLOOK.other), ...(BG.look?.wall ? { wall: BG.look.wall } : {}), ...(BG.look?.floor ? { floor: BG.look.floor } : {}) };
  const tiles = L.tiles ? rep(Math.ceil(wd / 40), (i) => rep(6, (j) => `<rect x="${i * 40}" y="${FLOOR - 180 + j * 30}" width="40" height="30" fill="none" stroke="${L.tiles}" stroke-width="3"/>`)) : "";
  const garage = look === "garage" ? `<rect x="560" y="80" width="380" height="${FLOOR - 80}" fill="#B9BED0" ${out()}/>${rep(8, (i) => `<path d="M560 ${110 + i * 40} H940" stroke="#9AA4BA" stroke-width="5"/>`)}` : "";
  // A wide room has more windows along the wall.
  const more = look === "garage" ? "" : rep(Math.max(0, Math.floor((wd - 1000) / 700)), (i) => {
    const x = 1150 + i * 700;
    return `<rect x="${x}" y="70" width="200" height="170" rx="12" fill="#fff" ${out()}/><rect x="${x + 14}" y="84" width="172" height="142" rx="6" fill="url(#pl-sky)"/><path d="M${x + 100} 84 V226 M${x + 14} 155 H${x + 186}" stroke="${OL}" stroke-width="5"/>`;
  });
  const window = look === "garage" ? "" : `${skyDef(s0, s1)}<rect x="${look === "kitchen" ? 760 : 620}" y="70" width="200" height="170" rx="12" fill="#fff" ${out()}/><rect x="${look === "kitchen" ? 774 : 634}" y="84" width="172" height="142" rx="6" fill="url(#pl-sky)"/>${tod === "night" ? `<circle cx="${look === "kitchen" ? 900 : 760}" cy="130" r="14" fill="#FFF6C9"/>` : `<circle cx="${look === "kitchen" ? 900 : 760}" cy="130" r="18" fill="#FFE066"/>`}<path d="M${look === "kitchen" ? 860 : 720} 84 V226 M${look === "kitchen" ? 774 : 634} 155 H${look === "kitchen" ? 946 : 806}" stroke="${OL}" stroke-width="5"/>`;
  // The little things that make a room a room: a cornice, a pendant lamp with its glow, curtains, a picture, the
  // skirting board, the planks of the floor, a rug in the living rooms, and rain or snow on the window.
  const lampX = Math.min(wd - 200, 420), pend = look === "garage" ? "" : `<path d="M${lampX} 0 V46" stroke="${OL}" stroke-width="3"/><ellipse cx="${lampX}" cy="78" rx="90" ry="44" class="pl-glow" fill="#FFE8A3" opacity="${tod === "night" ? 0.5 : 0.18}"/><path d="M${lampX - 44} 76 L${lampX - 30} 46 H${lampX + 30} L${lampX + 44} 76Z" fill="${{ kitchen: "#2B2340", bath: "#E8F6FF", bed: "#F7B5CF", kid: "#FFD93D" }[look] || "#F2E3CF"}" ${out()}/><ellipse cx="${lampX}" cy="76" rx="44" ry="8" fill="#FFF6C9" ${out(T3)}/>`;
  const wx = BG.wx || "", winX = look === "kitchen" ? 760 : 620;
  const drops = wx === "rain" ? `<g class="fx-rain" clip-path="url(#pl-winc)">${rep(9, (i) => `<path d="M${winX + 20 + i * 19} 80 v12" stroke="#4FB3FF" stroke-width="3" stroke-linecap="round" style="--fall:150px;animation-delay:${-(i * 0.17) % 0.6}s"/>`)}</g>` : wx === "snow" ? `<g class="fx-rain" clip-path="url(#pl-winc)">${rep(8, (i) => `<circle cx="${winX + 24 + i * 22}" cy="86" r="4" fill="#fff" style="--fall:150px;animation-delay:${-(i * 0.33) % 1.6}s;animation-duration:1.6s"/>`)}</g>` : "";
  const winClip = look === "garage" ? "" : `<clipPath id="pl-winc"><rect x="${winX + 14}" y="84" width="172" height="142" rx="6"/></clipPath>`;
  const curtains = look === "garage" ? "" : `<path d="M${winX - 26} 56 h252" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>`;
  const picture = ["living", "bed", "hall", "office", "kid", "other"].includes(look) ? `<rect x="${Math.min(wd - 190, 230)}" y="120" width="130" height="100" rx="6" fill="#fff" ${out()}/><rect x="${Math.min(wd - 190, 230) + 12}" y="132" width="106" height="76" fill="${{ bed: "#C7E6FF", hall: "#FFE4CC" }[look] || "#9BD7A0"}"/><circle cx="${Math.min(wd - 190, 230) + 86}" cy="156" r="12" fill="#FFE066"/><path d="M${Math.min(wd - 190, 230) + 12} 208 q30 -40 50 -14 q20 -40 56 -2 v16 h-106z" fill="#5A9E5F"/>` : "";
  const rug = ["living", "bed", "kid", "office"].includes(look) ? `<ellipse cx="${Math.min(wd - 300, 520)}" cy="${FLOOR + 130}" rx="230" ry="44" fill="${shade(L.floor, 0.78)}" opacity=".35"/><ellipse cx="${Math.min(wd - 300, 520)}" cy="${FLOOR + 130}" rx="200" ry="34" fill="none" stroke="${shade(L.floor, 1.2)}" stroke-width="4" opacity=".5"/>` : "";
  const planks = rep(Math.ceil(wd / 180), (i) => rep(3, (j) => `<path d="M${i * 180 + (j % 2) * 90} ${FLOOR + 30 + j * 60} v30" stroke="${shade(L.floor, 0.84)}" stroke-width="3"/>`));
  return `${rect(0, 0, wd, FLOOR, L.wall)}${rect(0, 0, wd, 14, shade(L.wall, 0.92))}${tiles}${garage}${winClip}${window}${drops}${curtains}${more}${picture}${pend}${rect(0, FLOOR - 16, wd, 16, "#fff", 0, out())}${rect(0, FLOOR, wd, H - FLOOR, L.floor)}${rep(6, (i) => `<path d="M0 ${FLOOR + 30 * (i + 1)} H${wd}" stroke="${shade(L.floor, 0.88)}" stroke-width="3"/>`)}${planks}${rug}${rect(0, FLOOR, wd, 10, "rgba(0,0,0,.08)")}`;
}
/* A family house for the game when no floor plan has been drawn in Husbyggeren yet: a long, low L-shaped house with
   a double garage, the utility room and the entrance, the children's rooms along the front, a big kitchen and family
   room, the living room in the wing with the guest room, the bathrooms, the walk-in and the bedroom, and a covered
   terrace in the corner by the garden. In metres, north up. */
const FB_ROOMS = [
  ["garage", "Garage", "garage", [[0, 0], [7.67, 0], [7.67, 8.51], [0, 8.51]]],
  ["bryggers", "Bryggers", "utility", [[7.67, 0], [10.95, 0], [10.95, 2.7], [7.67, 2.7]]],
  ["depot", "Depot", "utility", [[7.67, 2.7], [9.1, 2.7], [9.1, 3.95], [7.67, 3.95]]],
  ["entre", "Entré", "hall", [[10.95, 0], [12.6, 0], [12.6, 3.95], [10.95, 3.95]]],
  ["v1", "Værelse", "kid", [[12.6, 0], [16, 0], [16, 3.45], [12.6, 3.45]]],
  ["v2", "Værelse", "kid", [[16, 0], [21.35, 0], [21.35, 3.05], [16, 3.05]]],
  ["gang", "Gang", "hall", [[16, 3.05], [17.6, 3.05], [17.6, 4.9], [16, 4.9]]],
  ["bad1", "Badeværelse", "bath", [[17.6, 3.05], [21.35, 3.05], [21.35, 4.9], [17.6, 4.9]]],
  ["kokken", "Køkken", "kitchen", [[7.67, 3.95], [9.1, 3.95], [12.6, 3.95], [12.6, 3.45], [16, 3.45], [16, 4.9], [16.92, 4.9], [16.92, 8.51], [7.67, 8.51]]],
  ["v3", "Værelse", "kid", [[16.92, 4.9], [21.35, 4.9], [21.35, 7.95], [16.92, 7.95]]],
  ["stue", "Stue", "living", [[12.84, 8.51], [16.92, 8.51], [16.92, 15.17], [12.84, 15.17]]],
  ["gaeste", "Gæsteværelse", "guest", [[16.92, 7.95], [21.35, 7.95], [21.35, 10.7], [16.92, 10.7]]],
  ["bad2", "Badeværelse", "bath", [[16.92, 10.7], [21.35, 10.7], [21.35, 13], [16.92, 13]]],
  ["walkin", "Walk-in", "walkin", [[16.92, 13], [21.35, 13], [21.35, 14.7], [16.92, 14.7]]],
  ["sove", "Soveværelse", "bed", [[16.92, 14.7], [21.35, 14.7], [21.35, 19.19], [16.92, 19.19]]],
];
const FB_FURN = [
  ["bed1", 13.5, 1.7, 0.9, 2], ["desk", 15.2, 0.5, 1.2, 0.6], ["bed1", 20.6, 1.4, 0.9, 2], ["desk", 18.4, 0.5, 1.2, 0.6], ["bed1", 20.6, 6.4, 0.9, 2], ["desk", 18.4, 7.5, 1.2, 0.6],
  ["wm", 9.6, 2.2, 0.6, 0.6], ["td", 10.3, 2.2, 0.6, 0.6], ["usink", 9.3, 0.5, 0.8, 0.6], ["shoes", 11.8, 3.6, 0.8, 0.3], ["hooks", 12.45, 1.8, 0.12, 1],
  ["toilet", 21, 3.5, 0.4, 0.65], ["shower", 20.9, 4.4, 0.9, 0.9], ["sink", 18.4, 4.5, 0.6, 0.45],
  ["tall", 8.1, 5.6, 0.6, 0.6], ["ovenc", 8.1, 6.2, 0.6, 0.6], ["counter", 8.1, 7.3, 0.62, 1.6], ["hobc", 8.1, 6.9, 0.6, 0.6], ["island", 9.8, 6.2, 1, 2.4], ["table", 13.4, 6.3, 2.8, 1.2],
  ["chair", 12.4, 5.5, 0.48, 0.5], ["chair", 13.4, 5.5, 0.48, 0.5], ["chair", 14.4, 5.5, 0.48, 0.5], ["chair", 12.4, 7.1, 0.48, 0.5], ["chair", 13.4, 7.1, 0.48, 0.5], ["chair", 14.4, 7.1, 0.48, 0.5], ["fridgec", 8.1, 4.4, 0.6, 0.65],
  ["stove", 14.5, 8.65, 1.5, 0.4], ["sofa", 16.3, 11.6, 0.95, 3], ["coffee", 14.8, 11.6, 1, 1.6], ["arm", 13.6, 10.1, 0.85, 0.85], ["arm", 13.6, 13.2, 0.85, 0.85],
  ["bed1", 19.2, 9.4, 1.2, 2], ["tub", 19.2, 11.4, 1.7, 0.75], ["sink", 19.2, 12.6, 0.6, 0.45], ["toilet", 21, 12.3, 0.4, 0.65], ["wardrobe", 19.1, 13.4, 3.4, 0.6], ["bed2", 19.2, 17.4, 1.8, 2], ["nightstand", 18, 18.6, 0.45, 0.4],
  ["gset", 14.8, 17.3, 2.4, 1.8], ["tramp", 7, 14, 3.6, 3.6], ["sandbox", 3, 11.5, 1.5, 1.5], ["gtable", 10.6, 10.6, 1.8, 0.9],
];
const FB_AREAS = [
  ["terr", "deck", [[12.84, 15.17], [16.92, 15.17], [16.92, 19.19], [12.84, 19.19]]],
  ["have", "lawn", [[-1, 8.51], [12.84, 8.51], [12.84, 21], [-1, 21]]],
  ["terr2", "deck", [[8.5, 8.51], [12.84, 8.51], [12.84, 12.5], [8.5, 12.5]]],
  ["indk", "drive", [[0, -6], [7.67, -6], [7.67, 0], [0, 0]]],
];
const M2U = (pts) => pts.map(([x, y]) => [Math.round(x * 60), Math.round(y * 60)]);
/* The house the game uses: the family's own floor plan, or the house above with the children's rooms given to the
   children. */
export function houseData(ctx) {
  const h = ctx.data?.house;
  if ((h?.rooms || []).some((r) => r && r.id && r.name && Array.isArray(r.pts) && r.pts.length >= 3)) return h;
  const kids = ctx.children ? ctx.children() : [];
  let k = 0;
  return {
    fallback: true,
    rooms: FB_ROOMS.map(([id, name, rtype, pts]) => ({ id, name, rtype, pts: M2U(pts), kid: rtype === "kid" ? kids[k++]?.id || "" : "" })).map((r) => (r.rtype === "kid" && !r.kid ? { ...r, rtype: "guest", name: "Værelse" } : r)),
    walls: [],
    items: FB_FURN.map(([fk, x, y, w, d], i) => ({ type: "furn", id: `fb${i}`, fk, x: Math.round(x * 60), y: Math.round(y * 60), w: Math.round(w * 60), h: Math.round(d * 60), rot: 0 })),
    areas: FB_AREAS.map(([id, kind, pts]) => ({ id, kind, pts: M2U(pts) })),
  };
}
/* The rooms of the family's house as places: "h:<room id>". A child's room is that child's own room. */
export function houseRooms(ctx) {
  const rooms = (houseData(ctx).rooms || []).filter((r) => r && r.id && r.name);
  return rooms.map((r) => {
    const kid = r.kid || (ctx.children ? ctx.children() : []).find((c) => c.name && new RegExp(`(^|[^a-zæøå])${c.name.split(" ")[0]}`, "i").test(r.name))?.id || "";
    const look = r.rtype && ROOMLOOK[r.rtype] ? r.rtype : r.rtype === "smallbath" || r.rtype === "toilet" ? "bath" : r.rtype === "guest" ? "bed" : r.rtype === "walkin" ? "bed" : guessType(r.name);
    return { id: `h:${r.id}`, room: r, n: r.name, kid, look, em: { living: "🛋️", kitchen: "🍳", bath: "🛁", bed: "🛏️", office: "💻", hall: "🚪", utility: "🧺", garage: "🚗", kid: "🧸", other: "🏠" }[look] || "🏠" };
  });
}
/* ------------------------------------------------------------------ the house's own furniture (from Husbyggeren)
   What the family has put in a room in Husbyggeren comes into the game in the same order, left to right and back to
   front. Furniture the game has no drawing for is left out. */
const FURN_GAME = {
  sofa: "sofa", corner: "sofa", chaise: "sofa", arm: "laenestol", pouf: "hyggepude", coffee: "sofabord", sidet: "natbord", tvbench: "tv",
  sideboard: "shelf", shelf: "shelf", piano: "keyboard", rug: "gulvtaeppe", plant: "stueplante",
  base: "koekken", sinkc: "koekken", counter: "koekken", island: "koekken", tall: "koekken", dishc: "koekken", hobc: "komfur", ovenc: "komfur",
  fridgec: "koeleskab", table: "spisebord", tround: "spisebord", chair: "chair", stool: "chair", bench: "baenk",
  bed2: "dobbeltseng", bed1: "bed", nightstand: "natbord", wardrobe: "wardrobe", dresser: "natbord", vanity: "sminkebord", bbench: "baenk",
  bunk: "bunk", crib: "dukkeseng", desk: "desk", standd: "desk", ochair: "gaming", cabinet: "shelf", toybox: "blocks", playk: "minikokken", tipi: "tipi", beanbag: "beanbag",
  tub: "badekar", shower: "bruser", toilet: "toilet", sink: "haandvask", vanityb: "haandvask", usink: "haandvask", mirror: "mirror", mirrorw: "mirror",
  wm: "vaskemaskine", td: "vaskemaskine", tower: "vaskemaskine", clean: "wardrobe", hooks: "knager", shoes: "skoreol",
  work: "vaerktoejskasse", gshelf: "shelf", bike: "cykel", bins: "skraldespand", tools: "vaerktoejsvaeg",
  gset: "havemoebel", gtable: "havemoebel", lounge: "havemoebel", lounger: "baenk", parasol: "parasol", firepit: "baal", tramp: "trampolinhave",
  sandbox: "sandkasse", raised: "hoejbed", playhouse: "telt", swing: "gyngestativ",
};
const LIGHT_GAME = { floor: "floorlamp", table: "tablelamp", garden: "lygtepael" };
const ON_WALL = new Set(["mirror", "knager", "vaerktoejsvaeg"]);
const inside = (x, y, pts) => {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) hit = !hit;
  }
  return hit;
};
/* How wide a room of the house is in the game: as long as its longest side (290 to the metre, one to 2.4 screens). */
export function planWidth(pts) {
  if (!Array.isArray(pts) || pts.length < 3) return W;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), m = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 60;
  return Math.max(W, Math.min(2400, Math.round((m * 290) / 10) * 10));
}
/* Where the windows of a room are (the middle of each): the curtains hang there, and can be pulled. */
export const windowXs = (look, wd = W) => (look === "garage" ? [] : [(look === "kitchen" ? 760 : 620) + 100, ...Array.from({ length: Math.max(0, Math.floor((wd - 1000) / 700)) }, (_, i) => 1150 + i * 700 + 100)]);
export function houseDecor(ctx, room) {
  const pts = room?.pts;
  if (!Array.isArray(pts) || pts.length < 3) return null;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const out = [];
  for (const it of houseData(ctx).items || []) {
    if (typeof it.x !== "number" || typeof it.y !== "number" || !inside(it.x, it.y, pts)) continue;
    const k = it.type === "furn" ? FURN_GAME[it.fk] : it.type === "light" ? LIGHT_GAME[it.lk] : it.type === "tv" ? "tv" : it.type === "washer" || it.type === "dryer" ? "vaskemaskine" : null;
    if (!k) continue;
    const fx = (it.x - x0) / (x1 - x0 || 1), fy = (it.y - y0) / (y1 - y0 || 1);
    const wd = planWidth(pts), sx = Math.round(90 + fx * (wd - 180)), sy = ON_WALL.has(k) ? 240 : Math.round(470 + fy * 160);
    // The same thing right next to itself (a row of kitchen units) is one.
    if (out.some(([ok, ox, oy]) => ok === k && Math.abs(ox - sx) < 90 && Math.abs(oy - sy) < 60)) continue;
    out.push([k, sx, sy]);
  }
  return out.length >= 2 ? out.slice(0, 26) : null;
}
/* A place, by its key: an area's place, a room of the house, or the garden. */
export function place(ctx, key) {
  if (P[key]) return { id: key, ...P[key] };
  if (String(key).startsWith("h:")) {
    const h = houseRooms(ctx).find((x) => x.id === key);
    if (!h) return null;
    // What the family has put in the room stays; shelves with things on them, pictures and plants are added around it.
    const own = houseDecor(ctx, h.room), base = own || (ROOMLOOK[h.look] || ROOMLOOK.other).decor;
    return { ...h, area: "hjem", bg: (s0, s1, tod, wd) => roomBackdrop(h.look, s0, s1, tod, wd), decor: furnish(h.look, base, planWidth(h.room?.pts)), curtains: windowXs(h.look, planWidth(h.room?.pts)), own: !!own, npcs: [] };
  }
  return null;
}
export const placesOf = (area) => Object.entries(P).filter(([, v]) => v.area === area).map(([id, v]) => ({ id, ...v }));

/* ------------------------------------------------------------------ the map */
/* The world map: the family's house in the middle (its real floor plan from Husbyggeren), roads out to the areas. */
export function mapSvg(ctx, lv, here, peers, t) {
  const rooms = (ctx.data?.house?.rooms || []).filter((r) => Array.isArray(r.pts) && r.pts.length >= 3);
  let plan = "";
  if (rooms.length) {
    const xs = rooms.flatMap((r) => r.pts.map((q) => q[0])), ys = rooms.flatMap((r) => r.pts.map((q) => q[1]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min(210 / (x1 - x0 || 1), 140 / (y1 - y0 || 1)), ox = 500 - ((x1 - x0) * s) / 2, oy = 290 - ((y1 - y0) * s) / 2;
    const HR = houseRooms(ctx);
    plan = rooms.map((r) => {
      const h = HR.find((x) => x.room.id === r.id), pts = r.pts.map((q) => `${(ox + (q[0] - x0) * s).toFixed(1)},${(oy + (q[1] - y0) * s).toFixed(1)}`).join(" ");
      const cx = r.pts.reduce((a, q) => a + q[0], 0) / r.pts.length, cy = r.pts.reduce((a, q) => a + q[1], 0) / r.pts.length;
      const key = h?.kid ? (h.kid === ctx.me?.id ? "vaerelse" : `visit:${h.kid}`) : `h:${r.id}`;
      const pk = h?.kid ? `room:${h.kid}` : key, who = peers.filter((pe) => pe.space === pk);
      const tx = ox + (cx - x0) * s, ty = oy + (cy - y0) * s;
      return `<g class="wm-room${key === here ? " here" : ""}" data-pl="go" data-k="${key}" role="button" aria-label="${r.name}"><polygon points="${pts}" fill="${h?.kid ? "#C7E6FF" : "#FFF6E6"}" ${out(T3)}/><text x="${tx.toFixed(1)}" y="${(ty + 8).toFixed(1)}" class="wm-rt">${h?.em || ""}</text>${who.map((pe, j) => `<circle cx="${(tx + 14 - j * 10).toFixed(1)}" cy="${(ty - 14).toFixed(1)}" r="8" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="3"/>`).join("")}</g>`;
    }).join("");
  } else plan = `<g class="wm-room" data-pl="go" data-k="vaerelse" role="button">${house(430, 270, 140, 90, "#FFF6E6", "#E5484D")}</g>`;
  const roads = AREAS.slice(1).map((a) => `<path d="M500 290 Q${(500 + a.x) / 2 + (a.y > 290 ? 40 : -40)} ${(290 + a.y) / 2} ${a.x} ${a.y}" stroke="#E8D5B5" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M500 290 Q${(500 + a.x) / 2 + (a.y > 290 ? 40 : -40)} ${(290 + a.y) / 2} ${a.x} ${a.y}" stroke="#fff" stroke-width="3" stroke-dasharray="14 12" fill="none"/>`).join("");
  const areas = AREAS.slice(1).map((a) => {
    const open = lv >= a.lvl, pl = placesOf(a.id);
    const pins = pl.map((q, i) => {
      const px = a.x + (i - (pl.length - 1) / 2) * 62, py = a.y + 62;
      const who = peers.filter((pe) => pe.space === q.id);
      return `<g class="wm-pin${q.id === here ? " here" : ""}${open ? "" : " locked"}" data-pl="go" data-k="${q.id}" role="button" aria-label="${q.n}"><circle cx="${px}" cy="${py}" r="26" fill="#fff" ${out(T3)}/><text x="${px}" y="${py + 9}" class="wm-em">${q.em}</text>${who.map((pe, j) => `<circle cx="${px + 20 - j * 12}" cy="${py - 22}" r="10" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="3"/>`).join("")}</g>`;
    }).join("");
    return `<g class="wm-area${open ? "" : " locked"}"><circle cx="${a.x}" cy="${a.y}" r="54" fill="${a.col}" ${out()}/><text x="${a.x}" y="${a.y + 14}" class="wm-big">${open ? a.em : "🔒"}</text><text x="${a.x}" y="${Math.max(24, a.y - 64)}" class="wm-name">${t(a.n)}${open ? "" : ` · ${t("niv. {n}", { n: a.lvl })}`}</text>${pins}</g>`;
  }).join("");
  const gw = peers.filter((pe) => pe.space === "have");
  const garden = `<g class="wm-pin${here === "have" ? " here" : ""}" data-pl="go" data-k="have" role="button" aria-label="${t("Haven")}"><circle cx="608" cy="388" r="26" fill="#fff" ${out(T3)}/><text x="608" y="397" class="wm-em">🌳</text>${gw.map((pe, j) => `<circle cx="${628 - j * 12}" cy="366" r="10" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="3"/>`).join("")}</g>`;
  return `<rect width="${W}" height="${H}" fill="#9BD7A0"/>${rep(30, (i) => `<circle cx="${(i * 137) % 1000}" cy="${(i * 211) % 620}" r="${6 + (i % 4) * 3}" fill="#8BC98F"/>`)}<path d="M0 580 Q200 550 400 600 T1000 590 V620 H0Z" fill="#4FB3FF" opacity=".7"/>${roads}<circle cx="500" cy="290" r="128" fill="#B5E3A8" ${out(T3)}/>${plan}<text x="500" y="186" class="wm-name">${t("Vores hus")}</text>${garden}${areas}`;
}

/* ------------------------------------------------------------------ more of the world (hv-city.js and later) */
/* The drawing helpers for backdrops, and a way to add places, areas and characters from other files. */
export const BG = { W, H, FLOOR, T3, rect, out, rep, skyDef, sunMoon, cloud, hills, ground, outdoor, house, look: {}, wx: "" };
export function addWorld({ places = {}, areas = [], npcs = {} }) {
  Object.assign(P, places);
  for (const a of areas) if (!AREAS.some((x) => x.id === a.id)) AREAS.push(a);
  Object.assign(NPCS, npcs);
}
