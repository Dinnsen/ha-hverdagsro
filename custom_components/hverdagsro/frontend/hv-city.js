/* Hverdagsro – Centrum: the free start town of the play world, with apartments, a café, a hair salon, the post office
   (a gift every Friday), a rooftop for parties, a hangout park, the town square and the campsite, plus places to
   open with coins: the hospital, the mall, the university and two big houses. Our own places, characters and map.
   Everything is data: hv-world takes the places and characters, hv-play draws them. */
import { OL, shade } from "./hv-playcat.js";
import { BG, addWorld } from "./hv-world.js";

const { W, H, FLOOR, T3, rect, out, rep, skyDef, sunMoon, cloud, hills, ground, outdoor, house } = BG;

/* ------------------------------------------------------------------ backdrops */
/* Inside a building: a wall, a floor, a window with the real sky, and what makes the room its own. */
function inside(s0, s1, tod, wall0, floor0, extra = "", win = 760) {
  const wall = BG.look?.wall || wall0, floor = BG.look?.floor || floor0;
  const sky = `${skyDef(s0, s1)}${rect(win, 70, 190, 160, "#fff", 12, out())}${rect(win + 12, 82, 166, 136, "url(#pl-sky)", 6)}${tod === "night" ? `<circle cx="${win + 120}" cy="120" r="16" fill="#FFF6C9"/>` : `<circle cx="${win + 120}" cy="120" r="20" fill="#FFE066"/>`}<path d="M${win + 95} 82 V218 M${win + 12} 150 H${win + 178}" stroke="${OL}" stroke-width="6"/>`;
  return `${rect(0, 0, W, FLOOR, wall)}${extra}${win ? sky : ""}${rect(0, FLOOR - 16, W, 16, "#fff", 0, out())}${rect(0, FLOOR, W, H - FLOOR, floor)}${rep(6, (i) => `<path d="M0 ${FLOOR + 30 * (i + 1)} H${W}" stroke="${shade(floor, 0.9)}" stroke-width="3"/>`)}`;
}
const stripes = (col1, col2, wdt = 50) => rep(Math.ceil(W / wdt), (i) => rect(i * wdt, 0, wdt / 2, FLOOR, i % 2 ? col1 : col2));
const awning = (y, cols) => `<path d="M0 ${y} H${W} V${y + 40} ${rep(10, (i) => `Q${i * 100 + 50} ${y + 70} ${(i + 1) * 100} ${y + 40}`)} V${y}Z" fill="${cols[0]}" ${out()}/>${rep(10, (i) => `<path d="M${i * 100 + 25} ${y} V${y + 52}" stroke="${cols[1]}" stroke-width="22"/>`)}`;
const skyline = (col = "#9AA4BA") => rep(10, (i) => `<rect x="${i * 104}" y="${140 + ((i * 53) % 110)}" width="92" height="${FLOOR}" fill="${shade(col, 0.9 + (i % 3) * 0.06)}" ${out(T3)}/>${rep(4, (j) => `<rect x="${i * 104 + 16}" y="${170 + ((i * 53) % 110) + j * 40}" width="18" height="20" fill="#FFF3B0" opacity=".7"/><rect x="${i * 104 + 56}" y="${170 + ((i * 53) % 110) + j * 40}" width="18" height="20" fill="#FFF3B0" opacity=".7"/>`)}`);

/* ------------------------------------------------------------------ the places */
export const CITY_PLACES = {
  "by-cafe": {
    n: "Caféen", area: "centrum", em: "☕", inside: true,
    bg: (s0, s1, tod) => inside(s0, s1, tod, "#FFE9D6", "#C98B55", `${stripes("#FFE0C2", "#FFE9D6", 60)}${awning(0, ["#E5484D", "#fff"])}`),
    decor: [["kagemontre", 260, 560], ["espresso", 140, 420], ["menutavle", 420, 230], ["cafebord", 620, 610], ["chair", 540, 610], ["chair", 700, 610], ["cafebord", 860, 560], ["komfur", 600, 470]],
    npcs: [["bodil", 300, 610], ["karla", 760, 600], ["kasper", 470, 560]],
  },
  "by-frisor": {
    n: "Frisørsalonen", area: "centrum", em: "💇", inside: true,
    bg: (s0, s1, tod) => inside(s0, s1, tod, "#F7D9EC", "#FFFFFF", `${rep(20, (i) => rep(8, (j) => ((i + j) % 2 ? rect(i * 50, FLOOR + j * 25, 50, 25, "#EADCF2") : "")))}${rep(3, (i) => `${rect(110 + i * 220, 90, 140, 180, "#E8F6FF", 70, out())}${rect(122 + i * 220, 102, 116, 156, "#C7E6FF", 58)}`)}`, 0),
    decor: [["frisoerstol", 180, 590], ["frisoerstol", 400, 590], ["frisoerstol", 620, 590], ["haartoerrer", 820, 470], ["neglelak", 900, 600], ["haarboerster", 280, 470]],
    npcs: [["fie", 300, 610], ["kroelle", 760, 610]],
  },
  "by-post": {
    n: "Posthuset", area: "centrum", em: "📮", inside: true,
    bg: (s0, s1, tod) => inside(s0, s1, tod, "#FFF3B0", "#A9764C", `${rect(0, 300, W, 140, "#E5484D")}${rep(12, (i) => rect(i * 84 + 10, 316, 64, 40, "#FFD93D", 4, out(T3)))}`),
    decor: [["postskranke", 500, 560], ["pakkehylde", 140, 470], ["postsaek", 820, 610], ["postkasse", 920, 470], ["papkasser", 300, 610]],
    npcs: [["per", 520, 470], ["pip", 700, 600]],
  },
  "by-lejlighed": {
    n: "Lejlighederne", area: "centrum", em: "🏢", inside: true,
    bg: (s0, s1, tod) => inside(s0, s1, tod, "#C7E6FF", "#E8C69A", `${rect(0, 0, 330, FLOOR, "#FFE0EC")}${rect(330, 0, 6, FLOOR, "#fff", 0, out(T3))}${rect(660, 0, 6, FLOOR, "#fff", 0, out(T3))}${rect(666, 0, 334, FLOOR, "#E2F5D9")}`, 400),
    decor: [["sofa", 160, 580], ["tv", 160, 470], ["dobbeltseng", 500, 590], ["natbord", 380, 520], ["koekken", 820, 470], ["cafebord", 840, 600], ["stueplante", 300, 520]],
    npcs: [["naja", 620, 610], ["musse", 900, 610]],
  },
  "by-tag": {
    n: "Tagterrassen", area: "centrum", em: "🎉", party: true,
    bg: (s0, s1, tod) => `${skyDef(s0, s1)}${rect(0, 0, W, FLOOR, "url(#pl-sky)")}${sunMoon(820, 90, tod)}${skyline("#8E98B2")}${rect(0, FLOOR - 40, W, 40, "#E8E2D6", 0, out())}${rep(25, (i) => rect(i * 40 + 6, FLOOR - 70, 8, 34, "#fff", 2, out(T3)))}<path d="M0 ${FLOOR - 70} H${W}" stroke="${OL}" stroke-width="4"/>${ground("#D9CFC0")}${rep(10, (i) => rect(i * 100, FLOOR, 4, H - FLOOR, "#C9BFAF"))}`,
    decor: [["jukebox", 140, 560], ["festlamper", 500, 120], ["discokugle", 500, 200], ["hoejttaler", 880, 600], ["solseng", 700, 620], ["parasol", 760, 560], ["palme2", 940, 520]],
    npcs: [["disko", 300, 600], ["rytme", 560, 610]],
  },
  "by-park": {
    n: "Kolbøtteparken", area: "centrum", em: "🛹",
    bg: (s0, s1, tod) => `${outdoor(s0, s1, tod, "#9BD7A0", "#7CC489")}${ground("#B9E4C9")}<path d="M560 ${FLOOR + 60} A120 120 0 1 1 800 ${FLOOR + 60}" fill="none" stroke="${OL}" stroke-width="40"/><path d="M560 ${FLOOR + 60} A120 120 0 1 1 800 ${FLOOR + 60}" fill="none" stroke="#FF8A3C" stroke-width="30"/>${rep(6, (i) => `<circle cx="${120 + i * 70}" cy="${FLOOR + 120}" r="14" fill="${["#FF6B6B", "#FFD93D", "#4D96FF"][i % 3]}" opacity=".5"/>`)}`,
    decor: [["skateboard", 300, 620], ["trampolin", 160, 600], ["baenk", 900, 600], ["isbod", 460, 470], ["graffitivaeg", 940, 300], ["boombox", 820, 610]],
    npcs: [["sam", 420, 610], ["kolboette", 640, 600], ["pling", 220, 520]],
  },
  "by-torv": {
    n: "Torvet", area: "centrum", em: "⛲",
    bg: (s0, s1, tod) => `${skyDef(s0, s1)}${rect(0, 0, W, FLOOR, "url(#pl-sky)")}${sunMoon(860, 80, tod)}${tod === "night" ? "" : cloud(220, 70)}${house(40, 200, 200, 240, "#FFB86B", "#C2502A")}${house(290, 160, 180, 280, "#9FD4FF", "#2B3A6E")}${house(520, 210, 200, 230, "#F7B5CF", "#9B5DE5")}${house(770, 180, 190, 260, "#B9E4C9", "#3F7F4A")}${ground("#E8E2D6")}${rep(20, (i) => rep(4, (j) => rect(i * 50 + (j % 2) * 25, FLOOR + 10 + j * 45, 46, 40, "#DCD3C4", 4)))}`,
    decor: [["fontaene", 500, 600], ["marked", 200, 600], ["baenk", 760, 610], ["lygtepael", 920, 470], ["blomsterbed", 360, 470], ["skilt", 80, 470]],
    npcs: [["bent", 640, 600], ["dagny", 380, 610]],
  },
  "by-camping": {
    n: "Campingpladsen", area: "centrum", em: "⛺",
    bg: (s0, s1, tod) => `${outdoor(s0, s1, tod, "#5A9E5F", "#6BCB77")}${rep(9, (i) => `<path d="M${i * 120 - 20} ${FLOOR} L${i * 120 + 30} ${220 + (i % 3) * 30} L${i * 120 + 80} ${FLOOR}Z" fill="${i % 2 ? "#3F7F4A" : "#4E9A5A"}" ${out(T3)}/>`)}${ground("#8FD08A")}${rect(700, FLOOR + 20, 300, 80, "#7FC8F8", 40)}`,
    decor: [["telt", 220, 560], ["baalsted", 480, 610], ["campingstol", 380, 610], ["campingvogn", 760, 520], ["kano", 860, 620], ["haengekoeje2", 120, 470]],
    npcs: [["sif", 560, 600], ["gustav", 300, 620], ["olga", 640, 470]],
  },
  "by-hospital": {
    n: "Hospitalet", area: "centrum", em: "🏥", inside: true, price: 200,
    bg: (s0, s1, tod) => inside(s0, s1, tod, "#E8F6FF", "#D8F1E6", `${rect(0, 330, W, 20, "#6BCB77")}${rect(40, 60, 120, 120, "#fff", 10, out())}<path d="M90 80 h20 v30 h30 v20 h-30 v30 h-20 v-30 h-30 v-20 h30z" fill="#E5484D"/>`),
    decor: [["hospitalsseng", 300, 590], ["roentgen", 520, 230], ["apotek", 640, 470], ["rullestol", 840, 610], ["ambulance", 880, 470]],
    npcs: [["laerke", 480, 600], ["simon", 720, 610], ["brumme", 230, 560]],
  },
  "by-indkob": {
    n: "Indkøbscentret", area: "centrum", em: "🛍️", inside: true, price: 250,
    bg: (s0, s1, tod) => inside(s0, s1, tod, "#F2EDE6", "#FFFFFF", `${rep(4, (i) => `${rect(20 + i * 245, 40, 220, 260, ["#FFE0EC", "#E2F5D9", "#FFF3B0", "#E2D5FF"][i], 10, out())}${rect(40 + i * 245, 90, 180, 150, "#E8F6FF", 6, out(T3))}`)}${rect(0, 0, W, 30, "#9B5DE5")}`, 0),
    decor: [["butiksvindue", 180, 470], ["rulletrappe2", 760, 470], ["indkoebsvogn", 420, 610], ["mannequin", 560, 520], ["fontaene", 900, 610], ["kasseapparat", 300, 600]],
    npcs: [["emil", 340, 600], ["sofie", 620, 610], ["mona", 480, 520]],
  },
  "by-uni": {
    n: "Universitetet", area: "centrum", em: "🎓", inside: true, price: 250,
    bg: (s0, s1, tod) => inside(s0, s1, tod, "#E6DCC8", "#8B5A3C", `${rep(10, (i) => rect(i * 100, 0, 30, FLOOR, "#D6C8AE"))}${rect(0, 0, W, 50, "#2B3A6E")}`),
    decor: [["stortavle", 360, 260], ["auditorie", 400, 610], ["mikroskop", 760, 560], ["globus", 640, 600], ["teleskop", 900, 520], ["bogstabel", 140, 600]],
    npcs: [["pi", 560, 470], ["saga", 240, 600], ["rektor", 860, 610]],
  },
  "by-villa": {
    n: "Villaen med pool", area: "centrum", em: "🏝️", price: 350,
    bg: (s0, s1, tod) => `${skyDef(s0, s1)}${rect(0, 0, W, FLOOR, "url(#pl-sky)")}${sunMoon(820, 90, tod)}${rect(0, 240, W, 200, "#7FC8F8")}${rect(80, 120, 520, 320, "#FFFFFF", 6, out())}${rect(100, 160, 480, 160, "#C7E6FF", 4, out(T3))}<path d="M340 160 V320" stroke="${OL}" stroke-width="5"/>${rect(60, 100, 560, 30, "#E8E2D6", 6, out())}${ground("#F2D7A0")}`,
    decor: [["pool", 560, 612], ["solseng", 200, 600], ["solseng", 860, 600], ["parasol", 920, 560], ["palme2", 680, 470], ["palme2", 120, 470], ["badebassin", 300, 470]],
    npcs: [["lasse", 440, 600], ["flamme", 780, 610]],
  },
  "by-familiehus": {
    n: "Det store familiehus", area: "centrum", em: "🏡", inside: true, price: 300,
    bg: (s0, s1, tod) => inside(s0, s1, tod, "#FFF0D6", "#C98B55", `${rep(5, (i) => rect(60 + i * 140, 70, 100, 76, "#fff", 4, out(T3)) + rect(68 + i * 140, 78, 84, 60, ["#FF9AB5", "#9FD4FF", "#FFD93D", "#B9E4C9", "#E2D5FF"][i], 2))}`),
    decor: [["storsofa", 260, 590], ["langbord", 720, 600], ["chair", 580, 610], ["chair", 860, 610], ["bunk", 960, 470], ["klodsborg", 460, 620], ["gulvtaeppe", 300, 620]],
    npcs: [["bedste", 160, 600], ["morfar", 640, 590], ["vuffe", 420, 610]],
  },
};

/* What a place costs to open (coins), when it is not free. */
export const placePrice = (id) => CITY_PLACES[id]?.price || 0;

/* ------------------------------------------------------------------ the people and animals of Centrum (our own) */
const person = (skin, hair, hairc, top, bottom, extra = "ingen", wear = []) => ({ kind: "person", me: { skin, hair, hairc, top, bottom, extra }, wear });
export const CITY_NPCS = {
  bodil: ["Barista Bodil", "centrum", "Barista med krøllet rødt hår i en knold, grønt forklæde og et stort smil. Laver kakao med skum.", person("#F6C9A3", "knold", "#C2502A", "#FFFFFF", "#3A3A55", "ingen", [["apron", "#3F9E5A"]]), ["En kakao med skum?", "Dagens kage er med jordbær!", "Velkommen på caféen!"]],
  karla: ["Kaffekatten Karla", "centrum", "En brun og hvid kat med et lille sort forklæde. Bor på caféen og sover helst på vindueskarmen.", { kind: "cat", fur: "#C98B55", belly: "#FFFFFF", ears: "point", snout: "cat", tail: "curl", outfit: "apron", outc: "#2B2340" }, ["Mjav, er der fløde?", "Purr...", "Jeg passer på kagerne."]],
  kasper: ["Kok Kasper", "centrum", "Kok med sort skæg, hvid kokkejakke og høj kokkehue. Elsker at lave pandekager.", person("#C68B5E", "kort", "#2B1D14", "#FFFFFF", "#3A3A55", "ingen", [["chef", "#FFFFFF"]]), ["Hvad skal vi lave i dag?", "Bland tre ting i gryden!", "Mmm, det dufter godt!"]],
  fie: ["Frisør Fie", "centrum", "Frisør med lilla bob og sølvsaks i lommen. Sort tøj og lyserødt forklæde.", person("#F6C9A3", "bob", "#9B5DE5", "#2B2340", "#2B2340", "ingen", [["apron", "#F7B5CF"]]), ["Sæt dig i stolen!", "Skal vi prøve en ny frisure?", "Klip klip!"]],
  kroelle: ["Krølle", "centrum", "En hvid krølhåret puddel med lyserød sløjfe. Salonens maskot.", { kind: "dog", fur: "#FFFFFF", belly: "#F3F3F3", ears: "flop", snout: "dog", tail: "puff", hat: "bow", hatc: "#F15BB5" }, ["Vuf! Se min frisure!", "Lækkert hår i dag.", "Krøllerne sidder!"]],
  per: ["Postbud Per", "centrum", "Postbud med rødt jakke, gul kasket og en stor taske fuld af breve.", person("#E3A87C", "kort", "#5B3A21", "#E5484D", "#2B3A6E", "ingen", [["cap", "#FFD93D"], ["bag", "#C98B55"]]), ["Der er post til dig!", "Hver fredag er der en gave!", "Pakker, pakker, pakker!"]],
  pip: ["Pakke-Pip", "centrum", "En lille gul robot med fire hjul og en kasse på ryggen. Sorterer pakker lynhurtigt.", { kind: "robot", fur: "#FFD93D", icing: "#E5484D", back: "backpack", backc: "#C98B55" }, ["Pakke sorteret!", "Bip bip, levering!", "Til hvem er den her?"]],
  naja: ["Nabo Naja", "centrum", "Naboen på tredje sal med lange fletninger, gul regnjakke og en vandkande. Har mange planter.", person("#8D5524", "fletninger", "#2B1D14", "#FFD93D", "#4D96FF", "ingen", [["scarf", "#6BCB77"]]), ["Hej nabo!", "Mine planter skal vandes.", "Kom op og se min altan!"]],
  musse: ["Musse Mus", "centrum", "En lille grå mus med store ører, der bor i væggen i lejligheden og samler ostestumper.", { kind: "mouse", fur: "#9AA4BA", belly: "#E8EEF6", ears: "big", snout: "mouse", tail: "thin" }, ["Pip pip!", "Har du set noget ost?", "Jeg bor bag væggen."]],
  disko: ["DJ Disko", "centrum", "DJ med høretelefoner, glimmerjakke og kort pink hår. Styrer musikken på tagterrassen.", person("#C68B5E", "pjusk", "#F15BB5", "#9B5DE5", "#2B2340", "solbriller", [["headphones", "#2B2340"]]), ["Skru op!", "Tryk på musikafspilleren!", "Alle mand på dansegulvet!"]],
  rytme: ["Rytme", "centrum", "En blå kanin med headset, der danser hele tiden og banker takten med fødderne.", { kind: "bunny", fur: "#9FD4FF", belly: "#FFFFFF", ears: "long", snout: "mouse", tail: "puff", hat: "headset", hatc: "#2B2340" }, ["Bum bum bum!", "Kan du danse sådan her?", "Musik er det bedste!"]],
  sam: ["Skater Sam", "centrum", "Skater med hættetrøje, kasket bagfrem og plaster på knæet. Laver kolbøtter i rampen.", person("#F6C9A3", "pjusk", "#E9B65A", "#FF8A3C", "#3A3A55", "kasket"), ["Se mig lave et trick!", "Kolbøtte!", "Rampen er vild!"]],
  kolboette: ["Kolbøtte", "centrum", "En orange ræv med striber på halen, der går på hænder og elsker at stå på hovedet.", { kind: "fox", fur: "#FF8A3C", belly: "#FFFFFF", ears: "point", snout: "dog", tail: "bushy", tailc: "#FF8A3C", acc: "star", accc: "#FFD93D" }, ["Verden ser sjov ud på hovedet!", "Kolbøtte, kolbøtte!", "Kan du stå på hænder?"]],
  pling: ["Pling", "centrum", "En lille grøn klat med en propel på hovedet, der svæver rundt i parken og siger pling.", { kind: "blob", fur: "#6BCB77", hat: "antenna", hatc: "#FFD93D" }, ["Pling!", "Pling pling!", "Vil du lege fangeleg?"]],
  bent: ["Borgmester Bent", "centrum", "Byens rare borgmester med hvidt overskæg, høj hat og en guldkæde om halsen.", person("#F6C9A3", "skaldet", "#FFFFFF", "#2B3A6E", "#2B3A6E", "ingen", [["vest", "#E9C46A"]]), ["Velkommen til Centrum!", "Byen er jeres!", "Hvad skal vi bygge næste gang?"]],
  dagny: ["Due Dagny", "centrum", "En grå og lilla due, der går rundt på torvet og samler krummer.", { kind: "hen", fur: "#B9BED0", belly: "#E2D5FF", hat: "none" }, ["Kurr kurr!", "Har du en krumme?", "Jeg kender alle tagene."]],
  sif: ["Spejder Sif", "centrum", "Spejder med grøn skjorte, tørklæde og mange mærker. Kan tænde bål og finde vej.", person("#E3A87C", "hale", "#5B3A21", "#3F9E5A", "#8B5A3C", "ingen", [["scarf", "#FFD93D"], ["bag", "#8B5A3C"]]), ["Skal vi riste skumfiduser?", "Jeg kan finde nordstjernen!", "Alle teltene er sat op."]],
  gustav: ["Gustav Pindsvin", "centrum", "Et lille pindsvin med en rød hue, der bor under campingvognen.", { kind: "hedgehog", fur: "#8B5A3C", belly: "#F2D7A0", hat: "beanie", hatc: "#E5484D" }, ["Snøf snøf!", "Er der æbler i dag?", "Jeg ruller mig sammen!"]],
  olga: ["Ugle-Olga", "centrum", "En brun ugle med briller, der fortæller godnathistorier ved lejrbålet.", { kind: "owl", fur: "#A9764C", belly: "#F2D7A0", acc: "glasses", accc: "#2B2340" }, ["Uhu! Skal du høre en historie?", "Stjernerne er tændt.", "Uhu, uhu!"]],
  laerke: ["Læge Lærke", "centrum", "Læge med lang mørk hestehale, hvid kittel og et stetoskop. Rolig og venlig.", person("#8D5524", "hale", "#2B1D14", "#FFFFFF", "#4D96FF", "ingen", [["labcoat", "#FFFFFF"]]), ["Sig aaah!", "Du er rask som en fisk!", "Hvem har brug for et plaster?"]],
  simon: ["Sygeplejer Simon", "centrum", "Sygeplejer med blå uniform, kort blond hår og et plaster-ur. Altid klar til at hjælpe.", person("#F6C9A3", "kort", "#E9B65A", "#4D96FF", "#4D96FF", "ingen", [["uniform", "#4D96FF"]]), ["Her er et plaster!", "Hvil dig lidt.", "Godt gået, du var modig!"]],
  brumme: ["Bamsen Brumme", "centrum", "En brun bamse med plaster på armen, der ligger på hospitalet og venter på at blive rask.", { kind: "bear", fur: "#C98B55", belly: "#F2D7A0", ears: "round", snout: "bear", acc: "scarf", accc: "#9FD4FF" }, ["Av, min arm!", "Kan du give mig et plaster?", "Nu har jeg det bedre!"]],
  emil: ["Ekspedient Emil", "centrum", "Ekspedient med navneskilt, stribet skjorte og briller. Kender alle butikkerne.", person("#E3A87C", "kort", "#2B1D14", "#4D96FF", "#3A3A55", "briller", [["vest", "#E5484D"]]), ["Kan jeg hjælpe?", "Der er udsalg i dag!", "Prøverummet er ledigt."]],
  sofie: ["Shoppe-Sofie", "centrum", "Pige med store indkøbsposer, solhat og lyserød kjole. Elsker at prøve tøj.", person("#F6C9A3", "lang", "#E9B65A", "#F7B5CF", "#F7B5CF", "solhat", [["bag", "#9B5DE5"]]), ["Se min nye kjole!", "Skal vi prøve hatte?", "Shopping, shopping!"]],
  mona: ["Mona", "centrum", "En mannequin der kan bevæge sig, når ingen kigger. Har altid det nyeste tøj på.", person("#E8E2D6", "skaldet", "#E8E2D6", "#2B2340", "#2B2340", "solbriller"), ["...", "Psst, jeg kan godt bevæge mig.", "Klæd mig på!"]],
  pi: ["Professor Pi", "centrum", "En klog grå ugle med lærerkasket og tavlekridt. Underviser i stjerner og tal.", { kind: "owl", fur: "#9AA4BA", belly: "#E8EEF6", hat: "tophat", hatc: "#2B2340", acc: "glasses", accc: "#2B2340" }, ["Uhu, to plus to er fire!", "Se i mikroskopet!", "Viden er sjovt!"]],
  saga: ["Studerende Saga", "centrum", "Studerende med hættetrøje, rygsæk og mange bøger under armen.", person("#C68B5E", "bob", "#2B1D14", "#9B5DE5", "#3A3A55", "briller", [["bag", "#4D96FF"]]), ["Jeg læser til opfinder!", "Biblioteket er kæmpestort.", "Har du set min lommeregner?"]],
  rektor: ["Robo-Rektor", "centrum", "En høj sølvfarvet robot med studenterhue, der byder alle velkommen på universitetet.", { kind: "robot", fur: "#CFD6E6", icing: "#4D96FF", hat: "tophat", hatc: "#2B2340" }, ["Velkommen, studerende!", "Bip, viden indlæst.", "Undervisningen starter nu!"]],
  lasse: ["Livredder Lasse", "centrum", "Livredder med rød badedragt, solbriller og fløjte om halsen.", person("#C68B5E", "pjusk", "#E9B65A", "#E5484D", "#E5484D", "solbriller"), ["Husk at gå, ikke løbe!", "Hop i poolen!", "Fløjt!"]],
  flamme: ["Flamme Flamingo", "centrum", "En lyserød flamingo med solbriller, der står på ét ben ved poolen.", { kind: "hen", fur: "#FF9AB5", belly: "#FFC8DD", acc: "glasses", accc: "#2B2340" }, ["Jeg står på ét ben!", "Poolen er perfekt.", "Lyserød er min farve."]],
  bedste: ["Bedste", "centrum", "En glad bedstemor med grå knold, strikket cardigan og en kurv med boller.", person("#F6C9A3", "knold", "#CFD6E6", "#9B5DE5", "#3A3A55", "briller", [["scarf", "#FF9AB5"]]), ["Kom og få en bolle!", "Hvor er du blevet stor!", "Skal vi spille spil?"]],
  morfar: ["Morfar", "centrum", "En høj bedstefar med hvidt skæg, ternet skjorte og hængeslips. Fortæller vittigheder.", person("#E3A87C", "skaldet", "#FFFFFF", "#E5484D", "#5B3A21", "briller"), ["Kender du den om...?", "Lad os bygge en hule!", "Morfar er her!"]],
  vuffe: ["Vuffe", "centrum", "En stor sort labrador med rødt halsbånd, der bor i familiehuset og elsker at blive kælet.", { kind: "dog", fur: "#3A3A55", belly: "#5B5B7A", ears: "flop", snout: "dog", tail: "wag", acc: "scarf", accc: "#E5484D" }, ["Vuf vuf!", "Kast bolden!", "Kæl for mig!"]],
};

/* The area: free from the start, on the second map. */
export const CITY_AREA = { id: "centrum", n: "Centrum", em: "🏙️", lvl: 1, x: 0, y: 0, col: "#FF8A3C", map: "city" };

addWorld({ places: CITY_PLACES, areas: [CITY_AREA], npcs: CITY_NPCS });

/* ------------------------------------------------------------------ the map of Centrum */
const MW = 1000, MH = 620, IX = 9.2, IY = 4.7, ZH = 7.2, OX = 420, OY = 128;
const Pp = (x, y, z = 0) => [OX + (x - y) * IX, OY + (x + y) * IY - z * ZH];
const pts = (a) => a.map(([x, y, z]) => Pp(x, y, z).map((n) => n.toFixed(1)).join(",")).join(" ");
const poly = (a, f, o = "") => `<polygon points="${pts(a)}" fill="${f}" stroke="${OL}" stroke-width="2" stroke-linejoin="round" ${o}/>`;
const flat = (a, f, o = "") => `<polygon points="${pts(a)}" fill="${f}" ${o}/>`;
function box(x, y, w, d, h, col, z0 = 0) {
  return `${poly([[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z0 + h], [x, y + d, z0 + h]], col)}${poly([[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z0 + h], [x + w, y, z0 + h]], shade(col, 0.84))}${poly([[x, y, z0 + h], [x + w, y, z0 + h], [x + w, y + d, z0 + h], [x, y + d, z0 + h]], shade(col, 1.08))}`;
}
function windows(x, y, w, d, h, rows, colsF, colsR, col = "#C7E6FF", z0 = 0) {
  let s = "";
  const rh = h / rows;
  for (let r = 0; r < rows; r++) {
    const za = z0 + r * rh + rh * 0.3, zb = z0 + r * rh + rh * 0.78;
    for (let c = 0; c < colsF; c++) {
      const a = x + (c + 0.25) * (w / colsF), b = x + (c + 0.75) * (w / colsF);
      s += flat([[a, y + d, za], [b, y + d, za], [b, y + d, zb], [a, y + d, zb]], col, `stroke="${OL}" stroke-width="1.2"`);
    }
    for (let c = 0; c < colsR; c++) {
      const a = y + (c + 0.25) * (d / colsR), b = y + (c + 0.75) * (d / colsR);
      s += flat([[x + w, a, za], [x + w, b, za], [x + w, b, zb], [x + w, a, zb]], shade(col, 0.85), `stroke="${OL}" stroke-width="1.2"`);
    }
  }
  return s;
}
function gable(x, y, w, d, h, rh, roof, wall) {
  return `${poly([[x, y, h], [x + w, y, h], [x + w, y + d / 2, h + rh], [x, y + d / 2, h + rh]], shade(roof, 0.8))}${poly([[x + w, y, h], [x + w, y + d, h], [x + w, y + d / 2, h + rh]], shade(wall, 0.84))}${poly([[x, y + d, h], [x + w, y + d, h], [x + w, y + d / 2, h + rh], [x, y + d / 2, h + rh]], roof)}`;
}
const door = (x, y, d, w = 1.4, h = 2.4, col = "#C98B55") => flat([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]], col, `stroke="${OL}" stroke-width="1.5"`);
function tree(x, y, s = 1, col = "#6BCB77") {
  const [bx, by] = Pp(x, y), [tx, ty] = Pp(x, y, 3.2 * s);
  return `<ellipse cx="${bx}" cy="${by}" rx="${7 * s}" ry="${3.5 * s}" fill="rgba(0,0,0,.12)"/><path d="M${bx} ${by} V${ty + 6 * s}" stroke="#A9764C" stroke-width="${3 * s}" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="${10 * s}" fill="${col}" stroke="${OL}" stroke-width="2"/>`;
}
function pine(x, y, s = 1) {
  const [bx, by] = Pp(x, y), [, ty] = Pp(x, y, 5 * s);
  return `<path d="M${bx - 9 * s} ${by} L${bx} ${ty} L${bx + 9 * s} ${by}Z" fill="#3F7F4A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`;
}
function sign(x, y, z, em) {
  const [sx, sy] = Pp(x, y, z);
  return `<g class="tm-sign"><path d="M${sx} ${sy} v-10" stroke="${OL}" stroke-width="2"/><circle cx="${sx}" cy="${sy - 27}" r="17" fill="#fff" stroke="${OL}" stroke-width="2.5"/><text x="${sx}" y="${sy - 20}" class="tm-em">${em}</text></g>`;
}
const label = (x, y, z, text) => {
  const [lx, ly] = Pp(x, y, z);
  return `<text x="${lx}" y="${ly}" class="tm-lbl">${text}</text>`;
};
/* The buildings. bx, by: the back corner of the block (12 x 12). Two places may share a block. */
const CB = {
  "by-cafe": (bx, by) => `${box(bx + 0.8, by + 1, 5, 5, 3.2, "#FFE9D6")}${windows(bx + 0.8, by + 1, 5, 5, 3.2, 1, 2, 2, "#C7E6FF")}${box(bx + 0.8, by + 5.9, 5, 0.6, 0.4, "#E5484D", 2.4)}${door(bx + 2.6, by + 1, 5)}${sign(bx + 3.3, by + 3.5, 3.4, "☕")}`,
  "by-frisor": (bx, by) => `${box(bx + 6.6, by + 1, 4.8, 5, 3.6, "#F7D9EC")}${windows(bx + 6.6, by + 1, 4.8, 5, 3.6, 1, 2, 2, "#FFFFFF")}${door(bx + 8.4, by + 1, 5)}${sign(bx + 9, by + 3.5, 3.8, "💇")}${(() => {
    const [a, b] = Pp(bx + 11.2, by + 6, 0), [, c] = Pp(bx + 11.2, by + 6, 3);
    return `<path d="M${a} ${b} V${c}" stroke="#E5484D" stroke-width="5"/><path d="M${a} ${b} V${c}" stroke="#fff" stroke-width="5" stroke-dasharray="4 4"/>`;
  })()}`,
  "by-lejlighed": (bx, by) => `${box(bx + 1, by + 1, 7, 6, 9, "#C7E6FF")}${windows(bx + 1, by + 1, 7, 6, 9, 4, 4, 3, "#FFF6E6")}${door(bx + 3.8, by + 1, 6)}${sign(bx + 4.5, by + 4, 9.2, "🏢")}`,
  "by-tag": (bx, by) => `${box(bx + 8.4, by + 1, 3, 3, 5.5, "#FFB86B")}${windows(bx + 8.4, by + 1, 3, 3, 5.5, 2, 1, 1, "#FFF6E6")}${(() => {
    const [a, b] = Pp(bx + 4.5, by + 4, 9.2);
    return `${rep(5, (i) => `<circle cx="${a - 36 + i * 18}" cy="${b - 4 + (i % 2) * 4}" r="4" fill="${["#FFD93D", "#F15BB5", "#4D96FF"][i % 3]}" stroke="${OL}" stroke-width="1"/>`)}`;
  })()}${sign(bx + 9.9, by + 2.5, 5.7, "🎉")}`,
  "by-post": (bx, by) => `${box(bx + 1, by + 1.5, 9, 6, 3.6, "#FFF3B0")}${windows(bx + 1, by + 1.5, 9, 6, 3.6, 1, 4, 3, "#C7E6FF")}${box(bx + 1, by + 7.1, 9, 0.5, 0.8, "#E5484D", 2.6)}${label(bx + 5.5, by + 7.6, 3.2, "POSTHUS")}${door(bx + 4.8, by + 1.5, 6)}${box(bx + 10.4, by + 6, 0.8, 0.8, 1.6, "#E5484D")}${sign(bx + 5.5, by + 4.5, 3.8, "📮")}`,
  "by-park": (bx, by) => `${flat([[bx + 0.6, by + 0.6, 0.4], [bx + 11.4, by + 0.6, 0.4], [bx + 11.4, by + 11.4, 0.4], [bx + 0.6, by + 11.4, 0.4]], "#9BD7A0", `stroke="${OL}" stroke-width="1.5"`)}${(() => {
    const [a, b] = Pp(bx + 6, by + 6, 0.5);
    return `<path d="M${a - 30} ${b + 8} A30 30 0 1 1 ${a + 30} ${b + 8}" fill="none" stroke="${OL}" stroke-width="10"/><path d="M${a - 30} ${b + 8} A30 30 0 1 1 ${a + 30} ${b + 8}" fill="none" stroke="#FF8A3C" stroke-width="7"/>`;
  })()}${tree(bx + 2, by + 2, 0.7)}${tree(bx + 10, by + 3, 0.7, "#8FD08A")}${tree(bx + 3, by + 10, 0.7)}${sign(bx + 6, by + 6, 4, "🛹")}`,
  "by-torv": (bx, by) => `${flat([[bx + 0.6, by + 0.6, 0.4], [bx + 11.4, by + 0.6, 0.4], [bx + 11.4, by + 11.4, 0.4], [bx + 0.6, by + 11.4, 0.4]], "#E8E2D6", `stroke="${OL}" stroke-width="1.5"`)}${(() => {
    const [a, b] = Pp(bx + 6, by + 6, 0.5);
    return `<ellipse cx="${a}" cy="${b}" rx="34" ry="15" fill="#9BE7FF" stroke="${OL}" stroke-width="2"/><path d="M${a} ${b} v-22 m-10 8 q10 -24 20 0" stroke="#4FB3FF" stroke-width="3" fill="none"/>`;
  })()}${box(bx + 1.2, by + 8.5, 2.4, 1.6, 1.6, "#FFB86B")}${box(bx + 8.6, by + 8.5, 2.4, 1.6, 1.6, "#9FD4FF")}${sign(bx + 6, by + 6, 3.4, "⛲")}`,
  "by-camping": (bx, by) => `${flat([[bx + 0.6, by + 0.6, 0.4], [bx + 11.4, by + 0.6, 0.4], [bx + 11.4, by + 11.4, 0.4], [bx + 0.6, by + 11.4, 0.4]], "#8FD08A", `stroke="${OL}" stroke-width="1.5"`)}${pine(bx + 1.5, by + 1.5)}${pine(bx + 4, by + 1.2, 0.8)}${pine(bx + 1.3, by + 4.5, 0.9)}${(() => {
    const [a, b] = Pp(bx + 6.5, by + 6.5, 0.4), [c, d] = Pp(bx + 9, by + 8, 0.4);
    return `<path d="M${a - 20} ${b} L${a} ${b - 26} L${a + 20} ${b}Z" fill="#6BCB77" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/><path d="M${a - 5} ${b} L${a} ${b - 14} L${a + 5} ${b}Z" fill="#3F7F4A"/><circle cx="${c}" cy="${d}" r="6" fill="#FF8A3C" stroke="${OL}" stroke-width="2"/>`;
  })()}${sign(bx + 6.5, by + 6.5, 4.6, "⛺")}`,
  "by-hospital": (bx, by) => `${box(bx + 1, by + 1, 9, 7, 6, "#FFFFFF")}${windows(bx + 1, by + 1, 9, 7, 6, 3, 5, 4, "#C7E6FF")}${box(bx + 4, by + 7.4, 3, 0.8, 1.4, "#E5484D", 0)}${door(bx + 4.8, by + 1, 7)}${sign(bx + 5.5, by + 4.5, 6.2, "🏥")}`,
  "by-indkob": (bx, by) => `${box(bx + 0.6, by + 1, 10.8, 8, 4.4, "#E2D5FF")}${windows(bx + 0.6, by + 1, 10.8, 8, 4.4, 1, 5, 4, "#FFF6E6")}${box(bx + 0.6, by + 8.6, 10.8, 0.4, 0.8, "#9B5DE5", 3.2)}${label(bx + 6, by + 9, 3.7, "SHOPPING")}${door(bx + 5, by + 1, 8, 2, 2.4, "#BFE6FF")}${sign(bx + 6, by + 5, 4.6, "🛍️")}`,
  "by-uni": (bx, by) => `${box(bx + 1, by + 1, 10, 7, 5, "#E6DCC8")}${rep(5, (i) => box(bx + 1.6 + i * 2, by + 7.6, 0.6, 0.6, 3.6, "#FFFFFF"))}${gable(bx + 1, by + 1, 10, 7, 5, 2.4, "#2B3A6E", "#E6DCC8")}${door(bx + 5.2, by + 1, 7, 1.6, 2.6)}${sign(bx + 6, by + 4.5, 7.4, "🎓")}`,
  "by-villa": (bx, by) => `${box(bx + 1, by + 1, 7, 5, 3, "#FFFFFF")}${box(bx + 3, by + 1, 5, 5, 2.4, "#F2EDE6", 3)}${windows(bx + 1, by + 1, 7, 5, 3, 1, 3, 2, "#9FD4FF")}${flat([[bx + 2, by + 7.2, 0.45], [bx + 10, by + 7.2, 0.45], [bx + 10, by + 10.6, 0.45], [bx + 2, by + 10.6, 0.45]], "#4FB3FF", `stroke="${OL}" stroke-width="2"`)}${tree(bx + 10.6, by + 2, 0.8, "#6BCB77")}${sign(bx + 4.5, by + 3.5, 5.6, "🏝️")}`,
  "by-familiehus": (bx, by) => `${box(bx + 1.5, by + 1.5, 8, 6, 3.6, "#FFF0D6")}${gable(bx + 1.5, by + 1.5, 8, 6, 3.6, 2.6, "#C2502A", "#FFF0D6")}${windows(bx + 1.5, by + 1.5, 8, 6, 3.6, 1, 4, 3, "#C7E6FF")}${door(bx + 5, by + 1.5, 6)}${tree(bx + 10.5, by + 9, 0.8)}${sign(bx + 5.5, by + 4.5, 6.4, "🏡")}`,
};
/* Which block each place stands in (blocks are 12 x 12 with roads between). */
const CBLOCK = {
  "by-cafe": [0, 0], "by-frisor": [0, 0], "by-lejlighed": [14, 0], "by-tag": [14, 0], "by-post": [28, 0], "by-park": [42, 0],
  "by-camping": [0, 14], "by-torv": [14, 14], "by-hospital": [28, 14], "by-indkob": [42, 14],
  "by-uni": [0, 28], "by-villa": [14, 28], "by-familiehus": [28, 28],
};
/* Where a place's badge (new, explored, locked, live players) goes. */
const BADGE = { "by-cafe": [3.3, 3.5, 3.4], "by-frisor": [9, 3.5, 3.8], "by-lejlighed": [4.5, 4, 9.2], "by-tag": [9.9, 2.5, 5.7], "by-post": [5.5, 4.5, 3.8], "by-park": [6, 6, 4], "by-camping": [6.5, 6.5, 4.6], "by-torv": [6, 6, 3.4], "by-hospital": [5.5, 4.5, 6.2], "by-indkob": [6, 5, 4.6], "by-uni": [6, 4.5, 7.4], "by-villa": [4.5, 3.5, 5.6], "by-familiehus": [5.5, 4.5, 6.4] };

/* Centrum seen from above. opts: { seen, open(id) → bool, price(id), gift: the post office has a gift today }. */
export function citySvg(ctx, here, peers, t, opts = {}) {
  const sky = `<linearGradient id="cm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9B8"/><stop offset="1" stop-color="#FFF1E2"/></linearGradient>`;
  const far = rep(24, (i) => {
    const x = i * 44 - 10, h = 50 + ((i * 41) % 100);
    return `<rect x="${x}" y="${200 - h}" width="38" height="${h + 40}" rx="3" fill="${["#F2C6B4", "#E9D2C6", "#F5DACB"][i % 3]}"/>`;
  });
  const land = `${poly([[0, 42, -2.5], [56, 42, -2.5], [56, 42, 0], [0, 42, 0]], "#A97C55")}${poly([[56, 0, -2.5], [56, 42, -2.5], [56, 42, 0], [56, 0, 0]], "#8E6646")}${poly([[0, 0, 0], [56, 0, 0], [56, 42, 0], [0, 42, 0]], "#C9E8B8")}`;
  const road = (x, y, w, d) => flat([[x, y, 0.04], [x + w, y, 0.04], [x + w, y + d, 0.04], [x, y + d, 0.04]], "#B8BCCB");
  const roads = `${road(12, 0, 2, 42)}${road(26, 0, 2, 42)}${road(40, 0, 2, 42)}${road(0, 12, 56, 2)}${road(0, 26, 56, 2)}`;
  const plots = [[0, 0], [14, 0], [28, 0], [42, 0], [0, 14], [14, 14], [28, 14], [42, 14], [0, 28], [14, 28], [28, 28], [42, 28]].map(([x, y], i) => box(x + 0.4, y + 0.4, 11.2, 11.2, 0.35, ["#FBE3EC", "#E2F0FB", "#FFF6D6", "#DFF3D8"][i % 4])).join("");
  // The bus back to the town (the corner block).
  const [bx2, by2] = Pp(48, 34, 0.5);
  const bus = `<g class="tm-place" data-pl="town" role="button" aria-label="${t("Til byen")}">${box(43.5, 31, 8, 3, 2.6, "#FFD93D", 0.4)}${windows(43.5, 31, 8, 3, 2.6, 1, 5, 1, "#C7E6FF", 0.4)}${(() => {
    const [a, b] = Pp(44.5, 34, 0.4), [c, d] = Pp(50.5, 34, 0.4);
    return `<circle cx="${a}" cy="${b}" r="6" fill="${OL}"/><circle cx="${c}" cy="${d}" r="6" fill="${OL}"/>`;
  })()}<rect x="${bx2 - 46}" y="${by2 + 12}" width="92" height="26" rx="13" fill="#fff" stroke="${OL}" stroke-width="2"/><text x="${bx2}" y="${by2 + 30}" class="tm-area">🚌 ${t("Til byen")}</text></g>${tree(44, 40, 0.8)}${tree(53, 29.5, 0.8, "#8FD08A")}`;
  const items = [];
  for (const [id, pl] of Object.entries(CITY_PLACES)) {
    const blk = CBLOCK[id];
    if (!blk || !CB[id]) continue;
    const open = opts.open ? opts.open(id) : !pl.price;
    // The badge sits by the sign on the roof (same place as the sign).
    const [ox, oy, oz] = BADGE[id] || [6, 6, 4], [px, py] = Pp(blk[0] + 0.4 + ox, blk[1] + 0.4 + oy, oz), sx = px + 26, sy = py - 46;
    const who = peers.filter((pe) => pe.space === id);
    const seen = (opts.seen || []).includes(id);
    const badge = !open
      ? `<g class="tm-lock" pointer-events="none"><rect x="${sx - 30}" y="${sy - 12}" width="60" height="24" rx="12" fill="#fff" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 5}" class="tm-newt">🔒 ${pl.price} 🪙</text></g>`
      : seen
        ? `<g class="tm-seen" pointer-events="none"><circle cx="${sx}" cy="${sy}" r="11" fill="#6BCB77" stroke="#fff" stroke-width="3"/><path d="M${sx - 5} ${sy} l4 4 l7 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`
        : `<g class="tm-new" pointer-events="none"><rect x="${sx - 19}" y="${sy - 11}" width="38" height="22" rx="11" fill="#FFD93D" stroke="${OL}" stroke-width="2"/><text x="${sx}" y="${sy + 5}" class="tm-newt">${t("NY")}</text></g>`;
    const gift = id === "by-post" && opts.gift ? `<g class="tm-gift" pointer-events="none"><rect x="${sx - 52}" y="${sy - 62}" width="104" height="30" rx="12" fill="#fff" stroke="${OL}" stroke-width="2.5"/><text x="${sx}" y="${sy - 42}" class="tm-area">🎁 ${t("Fredagsgave")}</text></g>` : "";
    items.push([blk[0] + blk[1] + (id === "by-tag" || id === "by-frisor" ? 0.5 : 0), `<g class="tm-place${open ? "" : " locked"}${id === here ? " here" : ""}" data-pl="go" data-k="${id}" role="button" aria-label="${t(pl.n)}">${CB[id](blk[0] + 0.4, blk[1] + 0.4)}${badge}${gift}${who.map((pe, j) => `<circle cx="${sx + 22 - j * 12}" cy="${sy - 22}" r="9" fill="${pe.color || "#9B5DE5"}" stroke="#fff" stroke-width="3"/>`).join("")}</g>`]);
  }
  items.sort((a, b) => a[0] - b[0]);
  const deco = [[13, 6], [27, 6], [41, 6], [13, 20], [27, 20], [41, 20], [6, 13], [20, 13], [34, 13], [48, 13], [6, 27], [20, 27], [34, 27]].map(([a, b], i) => {
    const [x, y] = Pp(a, b, 0.05);
    return i % 2 ? `<path d="M${x - 6} ${y} h12" stroke="#fff" stroke-width="2"/>` : "";
  }).join("");
  return `<defs>${sky}</defs><rect width="${MW}" height="${MH}" fill="url(#cm-sky)"/>${far}${hills("#F3C9A0", 230)}${land}${roads}${deco}${plots}${bus}${items.map((i) => i[1]).join("")}`;
}

export const CITY_MAP_EN = {
  Centrum: "Downtown", "Til byen": "To the town", "Til Centrum": "To downtown", Fredagsgave: "Friday gift", "Caféen": "The café", "Frisørsalonen": "The hair salon", Posthuset: "The post office",
  Lejlighederne: "The apartments", Tagterrassen: "The rooftop", "Kolbøtteparken": "Somersault Park", Torvet: "The square", Campingpladsen: "The campsite", Hospitalet: "The hospital",
  "Indkøbscentret": "The mall", Universitetet: "The university", "Villaen med pool": "The pool villa", "Det store familiehus": "The big family house",
};
