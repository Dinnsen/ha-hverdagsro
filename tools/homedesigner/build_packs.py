#!/usr/bin/env python3
"""Turn the extracted catalog (game_data/prefabs.json) into hv-packs4-data.js: Danish names, one of our own drawings
(hv-proto.js) and a colour for every thing that can be named without a proper noun. Run from the project root:
    python tools/homedesigner/build_packs.py <out.js>
"""

import collections
import json
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).parent))
from dict_da import ADJ, COLOURS, MATS, MODS, NOUNS, PHRASES
from packmeta import EN, MERGE, PACKS, SKIP, TOWNS

CAP = 52  # things per pack (the shop shows them all; a child should not drown)

N, A, C, M, X = {}, {}, {}, {}, {}
for tok in NOUNS.split():
    en, rest = tok.split(">")
    da, g = rest.rsplit(":", 1)
    N[en] = (da, g)
for tok in re.split(r"\s+(?=[a-z]+>)", ADJ.strip()):
    en, rest = tok.split(">", 1)
    f = rest.split(",")
    A[en] = (f[0], f[1], f[2] if len(f) > 2 else f[0] + "e")
for tok in COLOURS.split():
    en, rest = tok.split(">")
    forms, hexv = rest.split("|")
    f = forms.split(",")
    C[en] = (f[0], f[1], f[2], hexv)
for tok in MODS.split():
    en, da = tok.split(">")
    M[en] = da
for tok in MATS.split():
    en, da = tok.split(">")
    X[en] = da
PH = []
for en, da, g in re.findall(r"([a-z]+(?: [a-z]+)*)>([a-zæøåé ]+?):([ntp])(?=\s|$)", PHRASES):
    PH.append((en.split(), da, g))
PH.sort(key=lambda t: -len(t[0]))

NOISE = {
    "hd",
    "pack",
    "start",
    "free",
    "drop",
    "variant",
    "fp",
    "fixed",
    "completed",
    "promo",
    "the",
    "a",
    "s",
    "d",
    "k",
    "hh",
    "it",
    "away",
    "up",
}
BRANDISH = {
    "toca",
    "crumpet",
    "glnce",
    "slomo",
    "sloo",
    "sloth",
    "tanuki",
    "beany",
    "iva",
    "ella",
    "vera",
    "hero",
    "rebel",
    "collector",
    "gashapon",
    "supreme",
    "indie",
    "timey",
    "bop",
    "bubble",
}


def split_name(name, pack):
    n = re.sub(r"^HD_", "", name)
    n = re.sub(r"^[A-Za-z0-9]*?Pack_", "", n)
    n = re.sub(r"^(FP|FreeDrop|Christmas2020|Halloween2026|BeakStreet|MapleAvenueBuilding|FreeBigHouse)_", "", n)
    n = re.sub(r"^(Fancy|Collector)_?", "", n)
    n = n.replace("_", " ")
    words = re.findall(r"[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+", n)
    pack_words = {w.lower() for w in re.findall(r"[A-Z]?[a-z]+", pack)}
    out = []
    for w in words:
        w = w.lower()
        if w.isdigit() or w in NOISE or (len(w) < 2 and w not in ("tv",)):
            continue
        out.append(w)
    # the pack's own name at the front (PeachySunset_..., Christmas2020_...) is not part of the thing's name
    while out and out[0] in pack_words and out[0] not in N:
        out.pop(0)
    return out


def translate(tokens):
    """-> (danish, english, colour hex or None, head english) or None."""
    if not tokens or any(t in BRANDISH for t in tokens):
        return None
    items = []  # (kind, en, data)
    i = 0
    while i < len(tokens):
        hit = None
        for words, da, g in PH:
            if tokens[i : i + len(words)] == words:
                hit = (words, da, g)
                break
        if hit:
            items.append(("P", " ".join(hit[0]), (hit[1], hit[2])))
            i += len(hit[0])
            continue
        t = tokens[i]
        if t in C:
            items.append(("C", t, C[t]))
        elif t in A:
            items.append(("A", t, A[t]))
        elif t in X:
            items.append(("X", t, X[t]))
        elif t in N:
            items.append(("N", t, N[t]))
        elif t in M:
            items.append(("M", t, M[t]))
        else:
            return None
        i += 1
    heads = [k for k, it in enumerate(items) if it[0] in ("P", "N")]
    if not heads:
        return None
    h = heads[-1]
    head = items[h]
    da_head, gender = head[2]
    pre, post = items[:h], items[h + 1 :]
    if any(it[0] in ("P", "N", "M") for it in post):
        return None
    adjs, mods, mat, colour = [], [], None, None
    for it in pre + post:
        kind = it[0]
        if kind in ("A", "C"):
            forms = it[2][:3]
            if kind == "C" and colour is None:
                colour = it[2][3]
            adjs.append(forms)
        elif kind == "X":
            mat = it[2]
        elif kind == "M":
            mods.append(it[2])
        elif kind in ("N", "P"):
            mods.append(M.get(it[1], it[2][0]))
    # a colour that is the only thing besides the head is a good colour, not a long name
    adjs = adjs[:2]
    mods = mods[:2]
    idx = {"n": 0, "t": 1, "p": 2}[gender]
    parts = [a[idx] for a in adjs]
    core = "".join(mods) + da_head
    core = re.sub(r"(.)\1\1", r"\1\1", core)
    name = " ".join([*parts, core])
    if mat:
        name += f" af {mat}"
    name = name[0].upper() + name[1:]
    if len(name) > 34:
        return None
    en = " ".join(t for t in tokens)
    en = en[0].upper() + en[1:]
    return name, en, colour, head[1].split()[-1]


# ----------------------------------------------------------------------------- which drawing
# (regex on the English tokens, drawing, scale, variation). The first rule that matches wins.
RULES = [
    (r"mobile", "garland", 1, 0),
    (r"(hood|extractor)", "hood", 1, 0),
    (r"\bbunk\b", "bunk", 1, 0),
    (r"\b(crib|cradle|bassinet)\b", "crib", 1, 0),
    (r"\bbedside|night ?stand\b", "dresser", 0.6, 1),
    (r"\bhammock|swing\b", "hammock", 1, 0),
    (r"\b(bed|mattress)\b", "bed", 1, 0),
    (r"\b(chaise|lounger|sunbed|deck chair)\b", "lounger", 1, 0),
    (r"\b(sofa|couch|loveseat|divan|settee)\b", "sofa", 1, 0),
    (r"\b(armchair|recliner|arm chair)\b", "armchair", 1, 0),
    (r"\b(beanbag|bean bag|pouf|ottoman|floor cushion)\b", "pouf", 1, 0),
    (r"\bstool\b", "stool", 1, 0),
    (r"\bbench\b", "bench", 1, 0),
    (r"\b(chair|seat)\b", "chair", 1, 0),
    (r"\b(coffee table|side table|tea table|center table)\b", "coffeetable", 1, 0),
    (r"\b(round table|bistro|cafe table)\b", "roundtable", 1, 0),
    (r"\b(desk|vanity|workbench|work bench|dressing)\b", "desk", 1, 0),
    (r"\b(island)\b", "island", 1, 0),
    (r"\b(counter|bar|checkout|cashier|reception|kitchen unit)\b", "counter", 1, 0),
    (r"\btable\b", "table", 1, 0),
    (r"\b(wardrobe|closet)\b", "wardrobe", 1, 0),
    (r"\b(dresser|drawers|drawer)\b", "dresser", 1, 0),
    (r"\b(bookcase|bookshelf|book case)\b", "bookcase", 1, 0),
    (r"\b(wall shelf|floating shelf|ceiling shelf|built in shelf)\b", "wallshelf", 1, 0),
    (r"\b(shelf|shelves|shelving|storage unit|cubes?)\b", "shelfunit", 1, 0),
    (r"\b(cabinet|cupboard|locker|sideboard|buffet|filing)\b", "cabinet", 1, 0),
    (r"\b(clothes rack|garment|coat rack|rack|hanger)\b", "rack", 1, 0),
    (r"\bhooks?\b", "hooks", 1, 0),
    (r"\b(display|vitrine|showcase|stand)\b", "display", 1, 0),
    (r"\b(chest|trunk)\b", "chest", 1, 0),
    (r"\bcrate\b", "crate", 1, 0),
    (r"\b(gift|present|wrapped|wrapping)\b", "gift", 1, 0),
    (r"\b(box|carton|package|container)\b", "box", 1, 0),
    (r"\b(basket|hamper)\b", "basket", 1, 0),
    (r"\b(suitcase|bag|backpack|purse)\b", "bag", 1, 0),
    (r"\b(barrel|keg)\b", "barrel", 1, 0),
    (r"\b(fridge|refrigerator|freezer)\b", "fridge", 1, 0),
    (r"\b(oven|stove|cooker|hob)\b", "oven", 1, 0),
    (r"\b(sink|basin)\b", "sink", 1, 0),
    (r"\b(washing|washer|laundry)\b", "washer", 1, 0),
    (r"\b(bath|tub|bathtub)\b", "bathtub", 1, 0),
    (r"\b(toilet|potty|wc)\b", "toilet", 1, 0),
    (r"\bshower\b", "shower", 1, 0),
    (r"\bmedicine\b", "mirrorcab", 1, 0),
    (r"\bmirror\b", "mirror", 1, 0),
    (r"\b(tv|television)\b", "tv", 1, 0),
    (r"\b(monitor|screen)\b", "screen", 1, 0),
    (r"\b(computer|laptop|tablet)\b", "laptop", 1, 0),
    (r"\b(radio|jukebox|boombox|gramophone|record player|vinyl player)\b", "radio", 1, 0),
    (r"\bspeaker\b", "speaker", 1, 0),
    (r"\b(phone|telephone|fax)\b", "phone", 1, 0),
    (r"\b(camera|polaroid|projector|lens)\b", "camera", 1, 0),
    (r"\b(console|controller|gaming|arcade)\b", "console", 1, 0),
    (r"\b(piano|keyboard|organ)\b", "piano", 1, 0),
    (r"\b(guitar|violin|ukulele|instrument|microphone|drum)\b", "guitar", 1, 0),
    (r"\b(painting|picture|photo|canvas|sketch|drawing|portrait|frame|art)\b", "frame", 1, 1),
    (r"\b(landscape|scenery)\b", "landscape", 1, 0),
    (r"\b(poster|flyer|menu|noteboard|board|note|sticker|graffiti)\b", "poster", 1, 0),
    (r"\bcard\b", "card", 1, 0),
    (r"\bclock\b", "clock", 1, 0),
    (r"\bneon\b", "neon", 1, 0),
    (r"\b(sign|signage)\b", "sign", 1, 0),
    (r"\b(curtain|drape|canopy)\b", "curtain", 1, 0),
    (r"\b(garland|fairy lights|string lights|lights)\b", "garland", 1, 0),
    (r"\b(bunting|banner|flag)\b", "banner", 1, 0),
    (r"\b(rug|carpet|mat)\b", "rug", 1, 0),
    (r"\b(ceiling|hanging|chandelier|pendant)\b.*\b(lamp|light|chandelier)\b|\bchandelier\b", "ceilinglamp", 1, 0),
    (r"\b(floor|standing)\b.*\b(lamp|light|spotlight)\b", "floorlamp", 1, 0),
    (r"\blantern\b", "lantern", 1, 0),
    (r"\bcandles?\b", "candle", 1, 0),
    (r"\b(fairy|bulb|led|spotlight)\b", "fairy", 1, 0),
    (r"\b(lamp|light)\b", "tablelamp", 1, 0),
    (r"\btree\b", "tree", 1, 0),
    (r"\b(cactus|aloe)\b", "cactus", 1, 0),
    (r"\b(succulent)\b", "smallplant", 1, 0),
    (
        r"\b(big|tall|floor|large|giant)\b.*\b(plant|monstera|palm|bush|fern|topiary)\b|\b(palm|bush|topiary|bamboo)\b",
        "plant",
        1,
        0,
    ),
    (r"\b(plant|monstera|fern|bonsai|ivy|moss|herb|planter|leaf|leaves)\b", "smallplant", 1, 0),
    (r"\b(flowers?|bouquet|roses?|tulip|lily)\b", "flowers", 1, 0),
    (r"\bvase\b", "vase", 1, 0),
    (
        r"\b(cake|pie|cupcake|dessert|donut|cookies?|bread|croissant|pizza|waffle|sandwich|burger|noodles|pasta|sushi|dumpling|toast|salad|sausage|ham|cheese|egg|eggs)\b",
        "cake",
        1,
        0,
    ),
    (
        r"\b(apple|banana|strawberry|cherry|lemon|mango|pear|peach|kiwi|watermelon|pineapple|grapefruit|blueberry|raspberry|blackberry|tomato|potato|onion|carrot|cucumber|corn|mushroom|avocado|fruit|vegetable|garlic|chili|beetroot|pumpkin)\b",
        "fruit",
        1,
        0,
    ),
    (r"\b(soda|juice|milk|tea|lemonade|cocoa|latte|smoothie|drink|sparkling|water)\b", "drink", 1, 0),
    (r"\b(bottle|flask|thermos|shampoo|lotion|perfume|oil|sauce|conditioner|soap)\b", "bottle", 1, 0),
    (r"\b(jar|jam|honey|tin|can)\b", "jar", 1, 0),
    (r"\b(cup|mug|teacup|tumbler|glass)\b", "cup", 1, 0),
    (r"\bbowl\b", "bowl", 1, 0),
    (r"\b(plate|dish|tray|platter|teaplate)\b", "plate", 1, 0),
    (r"\b(pot|pan|kettle|teapot|wok)\b", "pot", 1, 0),
    (
        r"\b(knife|fork|spoon|spatula|whisk|cutlery|brush|pen|pencil|marker|scissors|comb|tape|thread|yarn)\b",
        "tool",
        1,
        0,
    ),
    (r"\b(teddy|bear|plush|plushie|bunny|rabbit|duck|frog|horse|dino|toy)\b", "toy", 1, 0),
    (r"\bdoll\b", "doll", 1, 0),
    (r"\b(cat|dog|pet|bird|fish)\b", "pet", 1, 0),
    (r"\bball\b", "ball", 1, 0),
    (r"\b(blocks|puzzle|chess|game|cards|dice)\b", "blocks", 1, 0),
    (r"\b(trophy|medal|award)\b", "trophy", 1, 0),
    (r"\b(statue|sculpture|figurine|bust|ornament|decoration|skull)\b", "statue", 1, 0),
    (r"\b(trash|bin|garbage)\b", "trash", 1, 0),
    (r"\b(cart|trolley|wagon)\b", "cart", 1, 0),
    (r"\bmannequin\b", "mannequin", 1, 0),
    (r"\b(pedestal|plinth|column|podium|platform|stage)\b", "pedestal", 1, 0),
    (r"\bladder\b", "ladder", 1, 0),
    (r"\bpool\b", "pool", 1, 0),
    (r"\b(tent|teepee|tipi|gazebo)\b", "tent", 1, 0),
    (r"\b(fireplace|firepit|bonfire)\b", "fireplace", 1, 0),
    (r"\bfountain\b", "fountain", 1, 0),
    (r"\b(parasol|umbrella)\b", "parasol", 1, 0),
    (r"\b(grill|bbq)\b", "bbq", 1, 0),
    (r"\b(fence|gate|barrier)\b", "fence", 1, 0),
    (r"\b(scale|kettlebell|dumbbell)\b", "scale", 1, 0),
    (r"\b(pillow|cushion|blanket)\b", "pillow", 1, 0),
    (r"\b(books?|magazine|notebook)\b", "books", 1, 0),
    (r"\b(towel|clothes|hat|dress|shirt|shoes?|socks?)\b", "hooks", 1, 0),
    (r"\b(candy|chocolate|lollipop|marshmallow)\b", "jar", 1, 0),
]
RULES = [(re.compile(rx), p, s, n) for rx, p, s, n in RULES]


def proto_of(en_tokens, category):
    s = " ".join(en_tokens)
    for rx, proto, scale, var in RULES:
        if rx.search(s):
            return proto, scale, var
    return ("cabinet" if category == "Furniture" else "box"), 1, 0


def main():
    out = Path(sys.argv[1])
    prefabs = json.loads(Path("game_data/prefabs.json").read_text(encoding="utf-8"))
    by_pack = collections.defaultdict(list)
    stats = collections.Counter()
    for _g, p in prefabs.items():
        pk = MERGE.get(p["pack"], p["pack"])
        if p["pack"] in SKIP or pk not in PACKS or not p["root_known"]:
            continue
        stats["seen"] += 1
        toks = split_name(p["name"], p["pack"])
        res = translate(toks)
        if not res:
            stats["dropped"] += 1
            continue
        da, en, colour, _head = res
        proto, scale, var = proto_of(toks, p["category"])
        by_pack[pk].append(
            {
                "da": da,
                "en": en,
                "colour": colour,
                "proto": proto,
                "scale": scale,
                "var": var,
                "cat": p["category"],
                "src": p["name"],
            }
        )
    packs_out = []
    kept = 0
    for pk, meta in PACKS.items():
        slug, name, emoji, lvl, desc, town, pal, wall, floor = meta
        seen, pool = set(), []
        for it in sorted(by_pack.get(pk, []), key=lambda t: (t["cat"] != "Furniture", t["da"])):
            if it["da"] in seen:
                continue
            seen.add(it["da"])
            pool.append(it)
        # a spread over the drawings: take one of each, again and again, furniture first
        groups = collections.defaultdict(list)
        for it in pool:
            groups[it["proto"]].append(it)
        chosen = []
        order = sorted(groups, key=lambda k: (groups[k][0]["cat"] != "Furniture", k))
        rnd = 0
        while len(chosen) < CAP and any(len(groups[k]) > rnd for k in order):
            for k in order:
                if len(groups[k]) > rnd and len(chosen) < CAP:
                    chosen.append(groups[k][rnd])
            rnd += 1
        cols = list(pal)
        rows = []
        for i, it in enumerate(chosen):
            hexv = it["colour"] or pal[(i * 7 + len(it["da"])) % len(pal)]
            if hexv not in cols:
                cols.append(hexv)
            key = re.sub(r"[^a-z0-9]+", "-", it["en"].lower()).strip("-")[:28]
            rows.append(
                [
                    f"hd-{slug}-{key}",
                    it["da"],
                    it["proto"],
                    cols.index(hexv),
                    (cols.index(hexv) + 2) % len(pal),
                    it["var"],
                    round(it["scale"] * 100),
                    it["en"],
                ]
            )
        # unique keys inside the pack
        used = collections.Counter()
        for r in rows:
            used[r[0]] += 1
            if used[r[0]] > 1:
                r[0] += f"-{used[r[0]]}"
        kept += len(rows)
        packs_out.append(
            {
                "id": f"hd-{slug}",
                "n": name,
                "en": EN[slug][0],
                "den": EN[slug][1],
                "em": emoji,
                "lvl": lvl,
                "d": desc,
                "town": town,
                "cols": cols,
                "wall": wall,
                "floor": floor,
                "items": rows,
            }
        )
        print(f"{pk:30s} {len(by_pack.get(pk, [])):4d} named -> {len(rows):3d} kept")
    towns = [{"id": t[0], "n": t[1], "em": t[2], "lvl": t[3], "col": t[4]} for t in TOWNS]
    print(stats, "kept", kept)
    js = "/* Hverdagsro - the theme packs (generated by tools/homedesigner/build_packs.py; the shapes are in hv-proto.js). Each thing:\n   [key, name, shape, colour (index in cols), accent (index), variation, size in %, English name]. */\n"
    js += "export const TOWNS4 = " + json.dumps(towns, ensure_ascii=False) + ";\n"
    js += (
        "export const PACKDATA = [\n"
        + ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in packs_out)
        + "\n];\n"
    )
    out.write_text(js, encoding="utf-8")
    print("wrote", out, len(js) // 1024, "KB")


main()
