#!/usr/bin/env python3
"""Build the avatar catalog of the game: hair and beards, the clothes, hats, masks and ear accessories (each with a
Danish and an English name, the kind of drawing it is, and its colours), the colour palettes, the face parts, the
expressions, the dances and the premade figures with the world they live in. Reads game_data/avatars_raw.pkl and
game_data/catalog.json (made by extract_avatars.py) and writes custom_components/hverdagsro/frontend/hv-avatars-data.js.

    python tools/homedesigner/build_avatars.py [-d game_data]

Only names and numbers are used. The figures are drawn with the game's own shapes (hv-avatars.js); things that carry a
brand, a licensed character or a real person's name are left out. Skin and hair colours of the premade figures are not
in the build in a form that can be read, so they are picked from the palettes by the figure's name.
"""

from __future__ import annotations

import argparse
import collections
import json
from pathlib import Path
import pickle
import re
import struct

OUT_JS = Path(__file__).resolve().parents[2] / "custom_components/hverdagsro/frontend/hv-avatars-data.js"
# brands, licensed characters and real people: left out
BLOCK = {
    "adidas",
    "hm",
    "pusheen",
    "hello",
    "hellokitty",
    "kitty",
    "kuromi",
    "katseye",
    "spongebob",
    "kpdh",
    "wicked",
    "glinda",
    "sanrio",
    "cinnamoroll",
    "mymelody",
    "pochacco",
    "keroppi",
    "nike",
    "puma",
    "disney",
    "marvel",
    "barbie",
    "lego",
    "toca",
    "crumpet",
}
COLOR = {
    "blue": "#4D96FF",
    "lightblue": "#9FD4FF",
    "darkblue": "#2B3A6E",
    "navy": "#2B3A6E",
    "sky": "#9FD4FF",
    "green": "#6BCB77",
    "lightgreen": "#A8E6A1",
    "darkgreen": "#2F7A4B",
    "mint": "#9FE6C8",
    "olive": "#8A8F3C",
    "lime": "#B5E34B",
    "yellow": "#FFD93D",
    "orange": "#FF8A3C",
    "red": "#E5484D",
    "darkred": "#9E2B34",
    "burgundy": "#8C2F45",
    "maroon": "#8C2F45",
    "pink": "#F7A1C4",
    "hotpink": "#F15BB5",
    "lightpink": "#FBD3E3",
    "purple": "#9B5DE5",
    "lilac": "#C9B1F0",
    "lavender": "#C9B1F0",
    "violet": "#7B4FD0",
    "brown": "#A9764C",
    "tan": "#D2B48C",
    "beige": "#E8D5B0",
    "cream": "#FFF3D6",
    "white": "#FFFFFF",
    "black": "#2B2340",
    "gray": "#9AA4BA",
    "grey": "#9AA4BA",
    "silver": "#CFD6E6",
    "gold": "#E9C46A",
    "golden": "#E9C46A",
    "teal": "#2A9D8F",
    "turquoise": "#3CC5C9",
    "aqua": "#6FD6E0",
    "peach": "#FFB59A",
    "coral": "#FF7F6B",
    "rose": "#F28BA8",
    "magenta": "#D9338F",
    "khaki": "#C3B77A",
    "denim": "#5E81AC",
    "dark": "#3A3A55",
    "neon": "#B5FF4B",
    "cherry": "#D6304A",
    "mustard": "#D9A62B",
    "forest": "#2F7A4B",
    "ice": "#CFEFFF",
}
PATTERN = {
    "striped": "stripes",
    "stripes": "stripes",
    "stripe": "stripes",
    "dots": "dots",
    "dotted": "dots",
    "polka": "dots",
    "plaid": "plaid",
    "checkered": "plaid",
    "checked": "plaid",
    "tartan": "plaid",
    "gingham": "plaid",
    "floral": "flowers",
    "flower": "flowers",
    "flowers": "flowers",
    "camo": "camo",
    "camouflage": "camo",
    "stars": "stars",
    "star": "stars",
    "hearts": "hearts",
    "heart": "hearts",
    "rainbow": "rainbow",
    "leopard": "leopard",
    "zebra": "zebra",
    "tiedye": "rainbow",
    "sequin": "stars",
    "glitter": "stars",
}
# garment words -> (kind of top, kind of bottom or "" for the colour of the top)
GARMENT = [
    (("swimsuit", "swim", "bikini", "trunks", "swimwear"), "swim", ""),
    (("towel",), "towel", ""),
    (("bathrobe", "robe"), "robe", ""),
    (("pajama", "pyjama", "pyjamas", "pajamas", "sleepwear", "nightgown", "sleep"), "pyjamas", "bukser"),
    (("onesie",), "onesie", ""),
    (("dress", "gown", "prom", "frock"), "kjole", ""),
    (("skirt", "tutu", "ballet"), "tshirt", "nederdel"),
    (("jumpsuit", "romper", "dungarees", "overalls", "coverall", "boilersuit"), "overalls", ""),
    (("suit", "blazer", "tuxedo", "tux"), "suit", "bukser"),
    (("raincoat", "rain", "mac"), "regnfrakke", ""),
    (("coat", "parka", "trench", "cloak", "cape"), "coat", ""),
    (("puffer", "ski", "snow", "winter", "padded"), "puffer", "bukser"),
    (("jacket", "bomber", "windbreaker"), "jakke", "bukser"),
    (("cardigan",), "cardigan", "bukser"),
    (("sweater", "jumper", "pullover", "knit", "knitted", "sweatshirt"), "sweater", "bukser"),
    (("hoodie",), "hoodie", "bukser"),
    (("shirt", "blouse", "polo", "tunic"), "skjorte", "bukser"),
    (("vest", "waistcoat"), "vest", "bukser"),
    (("jersey", "soccer", "football", "team", "sporty", "athletic", "basketball", "hockey"), "sport", "shorts"),
    (("tracksuit", "track"), "traeningsdragt", ""),
    (("uniform", "scrubs", "labcoat", "apron", "chef"), "uniform", "bukser"),
    (("armour", "armor", "knight"), "costume", ""),
    (("costume", "outfit", "fancy"), "costume", ""),
    (("tshirt", "tee", "top", "tank", "crop", "cropped"), "tshirt", "bukser"),
]
BOTTOM = [
    (("shorts",), "shorts"),
    (("jeans",), "jeans"),
    (("leggings",), "leggings"),
    (("pants", "trousers", "joggers", "sweatpants"), "bukser"),
]
HAT = [
    (("cap", "baseball", "trucker", "snapback", "visor"), "cap"),
    (("beanie", "bobble", "woolly", "knit"), "beanie"),
    (("helmet", "hardhat"), "helmet"),
    (("crown", "tiara", "princess", "queen", "king"), "crown"),
    (("headband", "sweatband", "hairband"), "headband"),
    (("bow", "ribbon", "hairclip", "clip", "scrunchie"), "bow"),
    (("hood",), "hood"),
    (("wig", "afro", "hair", "mohawk", "bun"), "wig"),
    (("horn", "horns", "unicorn", "devil"), "horns"),
    (("ears", "bunny", "cat", "bear", "dog", "fox", "mouse", "panda"), "ears"),
    (("flower", "wreath", "daisy", "garland"), "flower"),
    (("party", "cone", "birthday"), "party"),
    (("bucket", "fisherman"), "bucket"),
    (("cowboy", "western"), "cowboy"),
    (("chef", "toque"), "chef"),
    (("witch", "wizard"), "witch"),
    (("sun", "straw", "sunhat", "panama"), "sunhat"),
    (("top", "tophat", "bowler"), "tophat"),
    (("pirate",), "pirate"),
    (("santa", "christmas", "elf"), "santa"),
    (("halo", "angel"), "halo"),
    (("beret", "painter"), "beret"),
]
MASK = [
    (("sunglasses", "shades", "aviator"), "sunglasses"),
    (("monocle",), "monocle"),
    (("goggles", "diving", "snorkel", "ski"), "goggles"),
    (("glasses", "specs", "spectacles", "eyewear"), "glasses"),
    (("eyepatch", "patch"), "eyepatch"),
    (("facepaint", "paint", "whiskers", "stripes", "makeup", "tattoo", "sticker", "stickers", "freckle"), "facepaint"),
    (("facemask", "breathing", "surgical", "medical", "respirator", "gas", "ninja", "bandana", "scarf"), "facemask"),
    (("helmet", "visor"), "helmet"),
    (("hood",), "hood"),
    (("mustache", "moustache", "beard", "stache"), "mustache"),
    (("nose", "clown"), "clownnose"),
    (("mask", "masquerade", "venetian", "hero", "luchador"), "mask"),
]
EAR = [
    (("hoop", "hoops"), "hoop"),
    (("stud", "studs", "diamond"), "stud"),
    (("dangler", "drop", "drops", "hanging", "tassel"), "dangle"),
    (("pearl",), "pearl"),
    (("hearing", "aid"), "hearing"),
    (("earbud", "earbuds", "earpod", "earpods", "headphones", "pod", "pods"), "bud"),
    (("cuff", "ring", "bling"), "cuff"),
    (("butterfly", "star", "stars", "heart", "floral", "flower"), "charm"),
]
DA = {
    "blue": "blå",
    "lightblue": "lyseblå",
    "darkblue": "mørkeblå",
    "navy": "marineblå",
    "sky": "himmelblå",
    "green": "grøn",
    "lightgreen": "lysegrøn",
    "darkgreen": "mørkegrøn",
    "mint": "mynte",
    "olive": "oliven",
    "lime": "lime",
    "yellow": "gul",
    "orange": "orange",
    "red": "rød",
    "darkred": "mørkerød",
    "burgundy": "bordeaux",
    "maroon": "rødbrun",
    "pink": "lyserød",
    "hotpink": "pink",
    "lightpink": "lyserosa",
    "purple": "lilla",
    "lilac": "syren",
    "lavender": "lavendel",
    "violet": "violet",
    "brown": "brun",
    "tan": "lysebrun",
    "beige": "beige",
    "cream": "creme",
    "white": "hvid",
    "black": "sort",
    "gray": "grå",
    "grey": "grå",
    "silver": "sølv",
    "gold": "guld",
    "golden": "gylden",
    "teal": "petrol",
    "turquoise": "turkis",
    "aqua": "akvablå",
    "peach": "fersken",
    "coral": "koral",
    "rose": "rosa",
    "magenta": "magenta",
    "khaki": "kaki",
    "denim": "denim",
    "dark": "mørk",
    "neon": "neon",
    "cherry": "kirsebær",
    "mustard": "sennep",
    "forest": "skov",
    "ice": "is",
    "striped": "stribet",
    "stripes": "stribet",
    "dots": "prikket",
    "dotted": "prikket",
    "polka": "prikket",
    "plaid": "tern",
    "checkered": "tern",
    "checked": "tern",
    "tartan": "tern",
    "gingham": "tern",
    "floral": "blomstret",
    "flower": "blomster",
    "flowers": "blomster",
    "camo": "camouflage",
    "stars": "stjerne",
    "star": "stjerne",
    "hearts": "hjerte",
    "heart": "hjerte",
    "rainbow": "regnbue",
    "leopard": "leopard",
    "zebra": "zebra",
    "sequin": "palet",
    "glitter": "glimmer",
    "swimsuit": "badedragt",
    "swim": "bade",
    "bikini": "bikini",
    "trunks": "badebukser",
    "towel": "håndklæde",
    "bathrobe": "badekåbe",
    "robe": "kåbe",
    "pajama": "pyjamas",
    "pyjama": "pyjamas",
    "pajamas": "pyjamas",
    "sleepwear": "nattøj",
    "nightgown": "natkjole",
    "onesie": "onesie",
    "dress": "kjole",
    "gown": "gallakjole",
    "prom": "festkjole",
    "skirt": "nederdel",
    "tutu": "tyllenederdel",
    "ballet": "ballet",
    "jumpsuit": "buksedragt",
    "romper": "playsuit",
    "dungarees": "overalls",
    "overalls": "overalls",
    "suit": "jakkesæt",
    "blazer": "blazer",
    "tuxedo": "smoking",
    "raincoat": "regnfrakke",
    "coat": "frakke",
    "parka": "parka",
    "trench": "trenchcoat",
    "cloak": "kappe",
    "cape": "kappe",
    "puffer": "dunjakke",
    "ski": "ski",
    "snow": "sne",
    "winter": "vinter",
    "jacket": "jakke",
    "bomber": "bomberjakke",
    "cardigan": "cardigan",
    "sweater": "sweater",
    "jumper": "striktrøje",
    "pullover": "pullover",
    "knit": "strik",
    "knitted": "strikket",
    "sweatshirt": "sweatshirt",
    "hoodie": "hættetrøje",
    "shirt": "skjorte",
    "blouse": "bluse",
    "polo": "poloshirt",
    "vest": "vest",
    "jersey": "trøje",
    "soccer": "fodbold",
    "football": "fodbold",
    "team": "holdets",
    "sporty": "sportslig",
    "tracksuit": "træningsdragt",
    "uniform": "uniform",
    "scrubs": "kitler",
    "labcoat": "laborkittel",
    "apron": "forklæde",
    "chef": "kok",
    "armour": "rustning",
    "armor": "rustning",
    "knight": "ridder",
    "costume": "kostume",
    "outfit": "outfit",
    "fancy": "fin",
    "tshirt": "T-shirt",
    "tee": "T-shirt",
    "top": "top",
    "tank": "tanktop",
    "crop": "kort",
    "cropped": "kort",
    "shorts": "shorts",
    "jeans": "jeans",
    "leggings": "leggings",
    "pants": "bukser",
    "trousers": "bukser",
    "joggers": "joggingbukser",
    "long": "lang",
    "short": "kort",
    "casual": "afslappet",
    "vintage": "retro",
    "summer": "sommer",
    "streetwear": "streetwear",
    "cozy": "hyggelig",
    "cosy": "hyggelig",
    "party": "fest",
    "christmas": "jule",
    "space": "rum",
    "pregnant": "gravid",
    "diaper": "ble",
    "cap": "kasket",
    "baseball": "baseball",
    "trucker": "trucker",
    "visor": "skygge",
    "beanie": "hue",
    "bobble": "pomponhue",
    "helmet": "hjelm",
    "hardhat": "sikkerhedshjelm",
    "crown": "krone",
    "tiara": "tiara",
    "princess": "prinsesse",
    "queen": "dronning",
    "king": "konge",
    "headband": "pandebånd",
    "bow": "sløjfe",
    "ribbon": "bånd",
    "clip": "hårspænde",
    "hood": "hætte",
    "wig": "paryk",
    "afro": "afro",
    "horn": "horn",
    "horns": "horn",
    "unicorn": "enhjørning",
    "devil": "djævle",
    "ears": "ører",
    "bunny": "kanin",
    "cat": "kat",
    "bear": "bjørne",
    "dog": "hunde",
    "fox": "ræve",
    "mouse": "mus",
    "panda": "panda",
    "wreath": "krans",
    "daisy": "margerit",
    "cone": "kegle",
    "birthday": "fødselsdags",
    "bucket": "bøllehat",
    "cowboy": "cowboy",
    "witch": "heksehat",
    "wizard": "troldmandshat",
    "sun": "sol",
    "straw": "strå",
    "sunhat": "solhat",
    "pirate": "pirat",
    "santa": "nisse",
    "elf": "alf",
    "halo": "glorie",
    "angel": "engle",
    "beret": "baret",
    "hat": "hat",
    "headset": "headset",
    "headphones": "hovedtelefoner",
    "sunglasses": "solbriller",
    "shades": "solbriller",
    "aviator": "pilot",
    "monocle": "monokel",
    "goggles": "briller",
    "diving": "dykker",
    "snorkel": "snorkel",
    "glasses": "briller",
    "eyepatch": "øjenklap",
    "patch": "klap",
    "facepaint": "ansigtsmaling",
    "paint": "maling",
    "whiskers": "knurhår",
    "makeup": "makeup",
    "tattoo": "tatovering",
    "facemask": "mundbind",
    "breathing": "åndedræts",
    "surgical": "kirurg",
    "ninja": "ninja",
    "bandana": "bandana",
    "scarf": "tørklæde",
    "mask": "maske",
    "mustache": "overskæg",
    "moustache": "overskæg",
    "beard": "skæg",
    "nose": "næse",
    "clown": "klovne",
    "masquerade": "maskerade",
    "hero": "helte",
    "star": "stjerne",
    "earring": "ørering",
    "earrings": "ørenringe",
    "hoop": "creol",
    "hoops": "creoler",
    "stud": "ørestik",
    "studs": "ørestikker",
    "dangler": "hængeørering",
    "drop": "dråbe",
    "drops": "dråber",
    "pearl": "perle",
    "hearing": "høre",
    "aid": "apparat",
    "earbud": "øresnegl",
    "earbuds": "øresnegle",
    "earpod": "ørepude",
    "earpods": "ørepuder",
    "cuff": "ørecuff",
    "tassel": "kvast",
    "hanging": "hængende",
    "ring": "ring",
    "bling": "glimmer",
    "butterfly": "sommerfugl",
    "small": "lille",
    "big": "stor",
    "little": "lille",
    "baby": "baby",
    "kid": "barne",
    "adult": "voksen",
    "old": "gammel",
    "cozy": "hyggelig",
    "sleeping": "sove",
    "bag": "taske",
    "pack": "pakke",
    "gift": "gave",
    "free": "gratis",
    "wrapped": "indpakket",
    "slime": "slim",
    "neon": "neon",
    "coastal": "kyst",
    "swimming": "svømme",
    "stars": "stjerne",
    "sailor": "sømands",
    "school": "skole",
    "band": "band",
    "wool": "uld",
    "woolly": "uld",
    "fuzzy": "bamse",
    "fluffy": "fnuggede",
    "shiny": "skinnende",
    "cool": "seje",
    "spy": "spion",
}
EN_FIX = {"tshirt": "T-shirt", "tee": "T-shirt"}
GENERIC = {
    "default",
    "baby",
    "fantasy",
    "custom",
    "clothes",
    "hat",
    "mask",
    "accessory",
    "left",
    "right",
    "ear",
    "variant",
    "pack",
    "store",
    "free",
    "start",
    "gift",
}


def split(name: str) -> list[str]:
    return re.findall(r"[A-Z]+(?![a-z])|[A-Z][a-z]+|[a-z]+|\d+", name.replace("_", " "))


def low(ts: list[str]) -> list[str]:
    return [t.lower() for t in ts]


def hexof(rgb) -> str:
    return "#" + "".join(f"{max(0, min(255, round(c * 255))):02X}" for c in rgb[:3])


def seed_of(s: str) -> int:
    h = 7
    for ch in s:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


def blocked(ts: list[str]) -> bool:
    l = low(ts)
    return any(t in BLOCK for t in l) or "".join(l) in BLOCK


def colors_in(ts: list[str]) -> list[str]:
    out, i, l = [], 0, low(ts)
    while i < len(l):
        two = l[i] + l[i + 1] if i + 1 < len(l) else ""
        if two in COLOR:
            out.append(COLOR[two])
            i += 2
            continue
        if l[i] in COLOR:
            out.append(COLOR[l[i]])
        i += 1
    return out


def pattern_in(ts: list[str]) -> str:
    return next((PATTERN[t] for t in low(ts) if t in PATTERN), "")


def pick(table, ts: list[str]):
    l = set(low(ts))
    for words, val, *rest in table:
        if l & set(words):
            return (val, *rest) if rest else val
    return None


def label(ts: list[str]) -> tuple[str, str]:
    """A Danish and an English name from the words that are known; names of people are dropped."""
    l = low(ts)
    da_words, en_words = [], []
    for t in l:
        if t in GENERIC or t.isdigit():
            continue
        if t in DA:
            da_words.append(DA[t])
            en_words.append(EN_FIX.get(t, t))
    da = " ".join(dict.fromkeys(da_words)).strip()
    en = " ".join(dict.fromkeys(en_words)).strip()
    return da[:1].upper() + da[1:], en[:1].upper() + en[1:]


def owner_of(ts: list[str]) -> str:
    """The person whose own outfit, hat … it is: the words that are not known words."""
    rest = [
        t
        for t in ts
        if t.lower() not in DA
        and t.lower() not in GENERIC
        and t.lower() not in COLOR
        and t.lower() not in PATTERN
        and not t.isdigit()
    ]
    return " ".join(rest)


PAL = ["#E5484D", "#4D96FF", "#6BCB77", "#FFB347", "#9B5DE5", "#F15BB5", "#2A9D8F", "#FFD93D", "#FF8A3C", "#5E81AC"]


def swatches(raw: dict) -> dict:
    groups: dict[str, list] = collections.defaultdict(list)
    for cls, name, data, _ext in raw.values():
        if cls != "AvatarColorSwatch":
            continue
        if any(b in name.lower() for b in BLOCK):
            continue
        n = struct.unpack_from("<i", data, 28)[0]
        off = (32 + n + 3) & ~3
        vals = struct.unpack_from("<ii i 8f", data, off)  # 0, hash, 6, r g b a r g b a
        a, b = vals[3:6], vals[7:10]
        key = re.sub(r"\d+$", "", name).replace("Color", "").lower()
        groups[key].append((name, hexof(a), hexof(b)))
    return {k: [[m, s] for _, m, s in sorted(v)] for k, v in groups.items()}


def clothes(names: list[str]) -> tuple[list, dict]:
    out, by_name = [], {}
    for name in sorted(names):
        ts = split(name)
        if ts and ts[-1] == "Clothes":
            ts = ts[:-1]
        baby = bool(ts) and ts[0] == "Baby"
        fantasy = bool(ts) and ts[0] == "Fantasy"
        if blocked(ts):
            continue
        core = [t for t in ts if t.lower() not in ("default", "baby", "fantasy", "custom")]
        g = pick(GARMENT, core)
        own = g is None and not [t for t in core if t.lower() in DA or t.lower() in COLOR or t.lower() in PATTERN]
        cs, pat = colors_in(core), pattern_in(core)
        h = seed_of(name)
        if g is None:
            kinds = [
                "tshirt",
                "hoodie",
                "skjorte",
                "jakke",
                "sweater",
                "cardigan",
                "kjole",
                "overalls",
                "tshirt",
                "sweater",
                "kjole",
                "sport",
            ]
            g = (kinds[h % len(kinds)], "bukser")
        top, bot = g[0], (g[1] if len(g) > 1 else "")
        c1 = cs[0] if cs else PAL[h % len(PAL)]
        c2 = cs[1] if len(cs) > 1 else ("#4D6FA8" if (h >> 4) % 3 else "#2B2340") if bot else c1
        bk = pick(BOTTOM, core) or bot
        da, en = label(core)
        who = owner_of(core)
        if not da:
            da, en = (f"{who}s tøj", f"{who}'s outfit") if who else ("Tøj", "Outfit")
        elif who and own:
            da, en = f"{who}s {da.lower()}", f"{who}'s {en.lower()}"
        item = [name, da, en, top, c1, c2, pat, bk or "", 1 if baby else 2 if fantasy else 0]
        by_name[name] = len(out)
        out.append(item)
    return out, by_name


def items(names: list[str], suffix: str, table, default: str):
    out, by_name = [], {}
    for name in sorted(names):
        ts = split(name)
        while ts and ts[-1] == suffix:
            ts = ts[:-1]
        if blocked(ts):
            continue
        core = [t for t in ts if t.lower() not in ("default", "baby", "fantasy", "custom")]
        fam = pick(table, core) or default
        cs = colors_in(core)
        da, en = label(core)
        who = owner_of(core)
        if not da:
            da, en = (
                (f"{who}s {DA.get(default, default)}", f"{who}'s {default}")
                if who
                else (DA.get(default, default).capitalize(), default.capitalize())
            )
        h = seed_of(name)
        by_name[name] = len(out)
        out.append([name, da, en, fam, cs[0] if cs else PAL[h % len(PAL)], cs[1] if len(cs) > 1 else ""])
    return out, by_name


EXPRESSIONS = [
    # id, Danish, English
    ("neutral", "Almindelig", "Neutral"),
    ("happy", "Glad", "Happy"),
    ("surprised", "Overrasket", "Surprised"),
    ("sleepy", "Søvnig", "Sleepy"),
    ("blink", "Blink", "Blink"),
    ("sick", "Syg", "Sick"),
    ("angry", "Sur", "Angry"),
    ("rage", "Rasende", "Furious"),
    ("sad", "Ked af det", "Sad"),
    ("sob", "Græder højt", "Sobbing"),
    ("scream", "Skriger", "Screaming"),
    ("laughter", "Griner", "Laughing"),
    ("celebrate", "Fejrer", "Celebrating"),
    ("hyper", "Hyperglad", "Super excited"),
    ("confused", "Forvirret", "Confused"),
    ("creepy", "Uhyggelig", "Creepy"),
    ("dead", "Død", "Dead"),
    ("kiss", "Kys", "Kiss"),
    ("evilkiss", "Drilsk kys", "Naughty kiss"),
    ("hearteyes", "Hjerteøjne", "Heart eyes"),
    ("heartbreak", "Knust hjerte", "Heartbroken"),
    ("flushed", "Rødmer", "Flushed"),
    ("freezing", "Fryser", "Freezing"),
    ("warm", "Varm og træt", "Hot and tired"),
    ("smug", "Selvtilfreds", "Smug"),
    ("evilsmirk", "Fræk grin", "Evil smirk"),
    ("grimace", "Gnier tænder", "Grimace"),
    ("pleading", "Beder pænt", "Pleading"),
    ("rolling", "Himler med øjnene", "Rolling eyes"),
    ("yummy", "Mums", "Yummy"),
    ("fart", "Ups", "Oops"),
    ("wink", "Blinker", "Wink"),
]
DANCES = [
    ("1", "Dans 1", "Dance 1"),
    ("2", "Dans 2", "Dance 2"),
    ("3", "Dans 3", "Dance 3"),
    ("Prom", "Galla-dans", "Prom dance"),
    ("PoolYoga", "Poolyoga", "Pool yoga"),
    ("PoolYoga2", "Poolyoga 2", "Pool yoga 2"),
]
CATEGORY_DA = {
    "Blush": ("Kinder", "Cheeks"),
    "BodyType": ("Kropstype", "Body type"),
    "ClothesCold": ("Vintertøj", "Cold weather"),
    "ClothesComfy": ("Hyggetøj", "Comfy"),
    "ClothesCustom": ("Eget tøj", "Custom"),
    "ClothesDresses": ("Kjoler", "Dresses"),
    "ClothesFantasy": ("Fantasi", "Fantasy"),
    "ClothesProfessions": ("Arbejdstøj", "Professions"),
    "ClothesSporty": ("Sport", "Sporty"),
    "ClothesSuits": ("Jakkesæt", "Suits"),
    "ClothesSweaters": ("Striktrøjer", "Sweaters"),
    "ClothesTshirts": ("T-shirts", "T-shirts"),
    "EarAccessories": ("Ørepynt", "Ear accessories"),
    "EarAccessoriesHearingAid": ("Høreapparater", "Hearing aids"),
    "EarAccessoriesPods": ("Øresnegle", "Earbuds"),
    "Eyebrows": ("Bryn", "Eyebrows"),
    "Eyes": ("Øjne", "Eyes"),
    "FacialHair": ("Skæg", "Facial hair"),
    "Freckles": ("Fregner", "Freckles"),
    "HairCrazy": ("Skørt hår", "Crazy hair"),
    "HairLong": ("Langt hår", "Long hair"),
    "HairShort": ("Kort hår", "Short hair"),
    "HatsBabiespets": ("Baby og dyr", "Babies and pets"),
    "HatsBeanies": ("Huer", "Beanies"),
    "HatsClassic": ("Klassiske hatte", "Classic hats"),
    "HatsLight": ("Lette hatte", "Light hats"),
    "HatsRandomparty": ("Festhatte", "Party hats"),
    "HatsTrucker": ("Kasketter", "Caps"),
    "HatsWork": ("Arbejdshatte", "Work hats"),
    "Limbs": ("Arme og ben", "Limbs"),
    "MaskFacemasks": ("Ansigtsmasker", "Face masks"),
    "MaskFacemaskstransparent": ("Gennemsigtige masker", "Clear masks"),
    "MaskGlasses": ("Briller", "Glasses"),
    "MaskHelmets": ("Hjelme", "Helmets"),
    "MaskHoods": ("Hætter", "Hoods"),
    "MaskShades": ("Solbriller", "Sunglasses"),
    "MaskVarious": ("Ansigtspynt", "Face things"),
    "Mouth": ("Mund", "Mouth"),
    "Nose": ("Næse", "Nose"),
    "Wrinkles": ("Rynker", "Wrinkles"),
}
# what a premade pet is, from the words of its name: species word -> (kind of drawing, Danish name)
SPECIES = [
    (
        (
            "dog",
            "puppy",
            "pup",
            "hound",
            "beagle",
            "terrier",
            "retriever",
            "poodle",
            "husky",
            "corgi",
            "dachshund",
            "inu",
            "wolf",
        ),
        "dog",
        "hund",
    ),
    (("cat", "kitten", "kitty", "tabby", "lynx", "tiger", "lion", "leopard"), "cat", "kat"),
    (("rabbit", "bunny", "hare"), "rabbit", "kanin"),
    (("hamster", "gerbil", "guinea", "mouse", "rat", "squirrel", "chinchilla", "ferret"), "mouse", "gnaver"),
    (("horse", "pony", "donkey", "unicorn", "zebra", "foal"), "horse", "hest"),
    (("pig", "piglet", "boar", "hog"), "pig", "gris"),
    (("sloth", "bear", "panda", "koala", "monkey", "ape", "gorilla", "raccoon"), "bear", "bjørn"),
    (("owl",), "owl", "ugle"),
    (
        (
            "chicken",
            "hen",
            "rooster",
            "chick",
            "duck",
            "duckling",
            "goose",
            "mallard",
            "pigeon",
            "bird",
            "budgie",
            "parrot",
            "canary",
            "swan",
            "penguin",
            "crow",
            "sparrow",
            "crested",
            "cockatiel",
            "turkey",
        ),
        "hen",
        "fugl",
    ),
    (
        (
            "fish",
            "koi",
            "goldfish",
            "shark",
            "whale",
            "dolphin",
            "seal",
            "otter",
            "octopus",
            "crab",
            "squid",
            "jellyfish",
            "sea",
            "shell",
            "lobster",
        ),
        "blob",
        "havdyr",
    ),
    (
        (
            "frog",
            "toad",
            "turtle",
            "tortoise",
            "lizard",
            "gecko",
            "snake",
            "dino",
            "dragon",
            "crocodile",
            "alligator",
            "newt",
        ),
        "dino",
        "krybdyr",
    ),
    (
        (
            "butterfly",
            "bug",
            "bee",
            "ladybug",
            "beetle",
            "spider",
            "worm",
            "ant",
            "moth",
            "caterpillar",
            "fly",
            "snail",
            "slug",
            "bat",
        ),
        "butterfly",
        "insekt",
    ),
    (("bot", "robot", "virus", "ghost", "rock", "creature", "monster", "alien"), "robot", "væsen"),
]
SKIP_PET = {"gifts", "subscriptionboxes", "miniso", "codeunlock", "creatortools", "homedesigner"}
PET_WORDS = {
    "pet",
    "start",
    "wrapped",
    "gift",
    "event",
    "po",
    "variant",
    "baby",
    "infant",
    "big",
    "small",
    "little",
    "fluffy",
}


def pets(rows) -> list:
    """The premade pets: [name, world, species, colour, seed]. The species and the colour come from the words of the name,
    the rest of the look from the seed."""
    out = []
    for path, _h, _g, kind, _x in rows:
        if kind != "PremadePet":
            continue
        parts = path.split("/")
        name = parts[-1][:-7]
        folder = [x.lower() for x in parts[3:-1]]
        if "pets" in [x.lower() for x in parts[:-1]]:
            i = [x.lower() for x in parts].index("pets")
            world = parts[i + 1] if len(parts) > i + 2 else "Pets"
        else:
            world = "PetAdoptionCenter"
        if any(f in SKIP_PET for f in [world.lower()] + folder[:1]) and world.lower() != "pets":
            world = "PetAdoptionCenter"
        ts = split(name)
        if blocked(ts) or not ts:
            continue
        low_ = [t.lower() for t in ts]
        sp = next(((k, da) for words, k, da in SPECIES if set(words) & set(low_)), None)
        cs = colors_in(ts)
        shown = [t for t in ts if t.lower() not in PET_WORDS and t.lower() not in COLOR]
        label = " ".join(shown) if shown else (sp[1].capitalize() if sp else "Kæledyr")
        out.append([label, world, sp[0] if sp else "", cs[0] if cs else "", seed_of(name), sp[1] if sp else ""])
    return out


def roster(rows, cl_by, hat_by, mask_by, ear_by, feats):
    out = []
    skip_w = {"CharacterCreator", "GuestCharacters", "GuestCharacterStorage", "World"}
    for path, _h, _g, kind, _x in rows:
        if kind != "PremadeCharacter" or not path.startswith("Assets/Characters/"):
            continue
        parts = path.split("/")
        world, name = parts[2], parts[-1][:-7]
        if world in skip_w:
            continue
        ts = split(name)
        if blocked(ts) or not ts:
            continue
        baby = ts[0] == "Baby"
        core = ts[1:] if baby else ts
        key = [t for t in core]
        n = len(key)

        def has(names, want=key, n=n):
            for nm in names:
                t = split(nm)
                for i in range(len(t) - n + 1):
                    if t[i : i + n] == want:
                        return nm
            return None

        cl = has(cl_by)
        hat = has(hat_by)
        mask = has(mask_by)
        ear = has(ear_by)
        fantasy = any(f.startswith("Fantasy") and has([f]) for f in feats)
        flags = {w: any(w in f and has([f]) for f in feats) for w in ("Freckles", "Wrinkles", "Blush", "Scar")}
        age = 1 if baby else 3 if flags["Wrinkles"] else 0
        disp = " ".join(("Dr." if t == "Dr" else "Mr." if t == "Mr" else "Mrs." if t == "Mrs" else t) for t in core)
        out.append(
            [
                disp,
                world,
                age,
                1 if fantasy else 0,
                cl_by.get(cl, -1) if cl else -1,
                hat_by.get(hat, -1) if hat else -1,
                mask_by.get(mask, -1) if mask else -1,
                ear_by.get(ear, -1) if ear else -1,
                seed_of(name),
                (1 if flags["Freckles"] else 0)
                | (2 if flags["Blush"] else 0)
                | (4 if flags["Wrinkles"] else 0)
                | (8 if flags["Scar"] else 0),
            ]
        )
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("-d", "--data", type=Path, default=Path("game_data"))
    args = ap.parse_args()
    D = pickle.loads((args.data / "avatars_raw.pkl").read_bytes())
    raw = D["raw"]
    names = collections.defaultdict(list)
    for cls, name, _d, _e in raw.values():
        names[cls].append(name)
    rows = json.loads((args.data / "catalog.json").read_text(encoding="utf-8"))
    cl, cl_by = clothes(names["CharacterFeatureClothesAsset"])
    hats, hat_by = items([n for n in names["CharacterFeatureItemAsset"] if n.endswith("Hat")], "Hat", HAT, "hat")
    masks, mask_by = items([n for n in names["CharacterFeatureItemAsset"] if n.endswith("Mask")], "Mask", MASK, "mask")
    ears, ear_by = items(names["CharacterFeatureEarAccessoryAsset"], "Left", EAR, "stud")
    ear_by.update({n: i for n, i in ear_by.items()})
    for n in names["CharacterFeatureEarAccessoryAsset"]:
        base = re.sub(r"(Left|Right)$", "", n)
        ear_by.setdefault(base, ear_by.get(n, -1))
    # hair and beards: the numbers there are
    hair = {
        g: sorted(int(re.search(r"\d+", n).group()) for n in names["CharacterFeatureHairAsset"] if n.startswith(g))
        for g in ("Short", "Long", "Crazy", "Beard")
    }
    feat_names = (
        names["CharacterFeatureAsset"] + names["CharacterFeatureItemAsset"] + names["CharacterFeatureEarAccessoryAsset"]
    )
    face = collections.Counter()
    for n in names["CharacterFeatureAsset"]:
        t = split(n)
        for part in (
            "Eyebrows",
            "Eyes",
            "Nose",
            "Mouth",
            "Blush",
            "Freckles",
            "Wrinkles",
            "Scar",
            "Head",
            "Torso",
            "Ears",
        ):
            if t and t[-1] == part:
                face[part.lower()] += 1
    cats = []
    for n in sorted(names["AvatarFeatureCategory"]):
        k = re.sub(r"Category$", "", n)
        da, en = CATEGORY_DA.get(k, (k, k))
        cats.append([k, da, en])
    people = roster(rows, cl_by, hat_by, mask_by, ear_by, feat_names)
    dances = []
    for key, da, en in DANCES:
        parts = sorted(
            {"_".join(n.split("_")[1:]) for n in names["DanceMoveConfig"] if n.split("_")[0] == f"DanceMove{key}"}
        )
        dances.append([key, da, en, parts])
    data = {
        "sw": swatches(raw),
        "hair": hair,
        "cl": cl,
        "hat": hats,
        "mask": masks,
        "ear": ears,
        "face": dict(face),
        "cat": cats,
        "expr": EXPRESSIONS,
        "dance": dances,
        "people": people,
        "pets": pets(rows),
    }
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    OUT_JS.write_text(
        "/* Generated by tools/homedesigner/build_avatars.py: the avatar catalog (hair, clothes, hats, masks, ear accessories,\n"
        "   colours, face parts, expressions, dances) and the premade figures of the worlds. Do not edit by hand. */\n"
        f"export const AV = {body};\n",
        encoding="utf-8",
    )
    fam = (
        collections.Counter(h[3] for h in hats),
        collections.Counter(m[3] for m in masks),
        collections.Counter(e[3] for e in ears),
        collections.Counter(c[3] for c in cl),
    )
    print(
        f"clothes {len(cl)}, hats {len(hats)}, masks {len(masks)}, ears {len(ears)}, hair {sum(map(len, hair.values()))}, people {len(people)}, pets {len(data['pets'])}, swatches {sum(map(len, data['sw'].values()))}"
    )
    for f in fam:
        print(dict(f.most_common(14)))
    print("face", dict(face), "size", OUT_JS.stat().st_size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
