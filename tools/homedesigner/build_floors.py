#!/usr/bin/env python3
"""Build the floors of the houses: for every building of the theme packs, its floors (as many as the original's house
has, each with its rooms as wide as they are there, which are outdoors, and where the windows, doors and the lift
stand). Writes custom_components/hverdagsro/frontend/hv-floors-data.js.

    python tools/homedesigner/build_floors.py [-d game_data]

The packs that have no house of their own in the original are built on the shell of one that is alike (turned the
other way round), so no pack is left with a single bare room.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))
import shells

K = 38.3  # px per unit of the original, measured on the furniture
PAD = 40
MAXW = 4800
OUT_JS = Path(__file__).resolve().parents[2] / "custom_components/hverdagsro/frontend/hv-floors-data.js"


def floors(*names: str) -> list[str]:
    return [f"HD{n}" for n in names]


# id -> (pack id, scenes bottom floor first, turned round?). The scenes are the original's own.
BUILDINGS: dict[str, tuple[str, list[str], bool]] = {
    "hd-storfamilie": (
        "hd-storfamilie",
        floors("BigFamilyHomePackFloor1", "BigFamilyHomePackFloor2", "BigFamilyHomePackFloor3"),
        False,
    ),
    "hd-lejlighed": ("hd-lejlighed", floors(*(f"ApartmentLivingPackFloor{i}" for i in range(5))), False),
    "hd-skovhytte": ("hd-skovhytte", floors("CottagePack"), False),
    "hd-aertehus": ("hd-aertehus", floors("SweetPeaCottagePackFloor1", "SweetPeaCottagePackFloor2"), False),
    "hd-bohem": ("hd-bohem", floors("BohemianPack"), False),
    "hd-japandi": (
        "hd-japandi",
        floors("JapandiHousePackFloor1", "JapandiHousePackFloor2", "JapandiHousePackFloor3"),
        False,
    ),
    "hd-boernehave": ("hd-boernehave", floors("DaycarePack"), False),
    "hd-katoghund": ("hd-katoghund", floors("CatsAndDogsPack"), False),
    "hd-aktivpark": ("hd-aktivpark", floors("ActivityParkPack"), False),
    "hd-byparken": ("hd-byparken", floors("CityParkPack"), False),
    "hd-startkassen": ("hd-startkassen", floors("FreePack"), False),
    "hd-startkassen-stort": ("hd-startkassen", floors("FreeBigHouseFloor1", "FreeBigHouseFloor2"), False),
    "hd-kystvilla": (
        "hd-kystvilla",
        floors("CoastalVillaPackFloor1", "CoastalVillaPackFloor2", "CoastalVillaPackFloor3"),
        False,
    ),
    "hd-strandhus": ("hd-strandhus", floors("RomanticBeachHousePack"), False),
    "hd-poolvilla": ("hd-poolvilla", floors("PoolVillaPack"), False),
    "hd-autocamper": ("hd-autocamper", floors("CamperVanOutdoors", "CamperVanIndoors"), False),
    "hd-taghave": ("hd-taghave", floors("RooftopGardenApartmentPack"), False),
    "hd-supermarked": ("hd-supermarked", floors("SupermarketPackFloor1", "SupermarketPackFloor2"), False),
    "hd-lokalbutik": ("hd-lokalbutik", floors("LocalShopPack"), False),
    "hd-lokalbutik-ahorn": ("hd-lokalbutik", floors("MapleAvenueLocationFloor1", "MapleAvenueLocationFloor2"), False),
    "hd-lokalbutik-gade": ("hd-lokalbutik", floors("BeakStreetLocation"), False),
    "hd-modebutik2": ("hd-modebutik2", floors("FashionStorePackFloor1", "FashionStorePackFloor2"), False),
    "hd-loppemarked": ("hd-loppemarked", floors("VintageMarketPack"), False),
    "hd-bageri": ("hd-bageri", floors("CoquetteBakeryPackFloor1", "CoquetteBakeryPackFloor2"), False),
    "hd-restaurant": ("hd-restaurant", floors("CozyRestaurantPack"), False),
    "hd-herregaard": ("hd-herregaard", floors(*(f"CountryManorPackFloor{i}" for i in range(1, 5))), False),
    "hd-palae": ("hd-palae", floors("MansionPackFloor1", "MansionPackFloor2"), False),
    "hd-hotel": (
        "hd-hotel",
        floors("FiveStarHotelPackFloor1", "FiveStarHotelPackFloor2", "FiveStarHotelPackFloor3"),
        False,
    ),
    "hd-velvaere": ("hd-velvaere", floors("CareAndCoreLocation"), False),
    "hd-neonregnbue": ("hd-neonregnbue", floors("NeonRainbowPack"), False),
    "hd-tusindaar": ("hd-tusindaar", floors("Y2KPack"), False),
    "hd-stjernehus": ("hd-stjernehus", floors(*(f"InfluencerHousePackFloor{i}" for i in range(4))), False),
    "hd-loft": ("hd-loft", floors("DowntownLoftPack"), False),
    "hd-rengoering": ("hd-rengoering", floors("CleanTokPackFloor1", "CleanTokPackFloor2"), False),
    "hd-boblespa": ("hd-boblespa", floors("BubbleBopSpaPack"), False),
    # no house of their own in the original: built on the shell of one that is alike, turned round
    "hd-velkomst": ("hd-velkomst", floors("FreeBigHouseFloor1", "FreeBigHouseFloor2"), True),
    "hd-krammebjoern": ("hd-krammebjoern", floors("FreePack"), True),
    "hd-bedstevenner": ("hd-bedstevenner", floors("PoolVillaPack"), True),
    "hd-julestue": ("hd-julestue", floors("CottagePack"), True),
    "hd-foraar": ("hd-foraar", floors("SweetPeaCottagePackFloor1", "SweetPeaCottagePackFloor2"), True),
    "hd-uhyggehus": ("hd-uhyggehus", floors("MansionPackFloor1", "MansionPackFloor2"), True),
    "hd-gaveregn": ("hd-gaveregn", floors("FreePack"), False),
    "hd-solnedgang": ("hd-solnedgang", floors("RomanticBeachHousePack"), True),
    "hd-glans": ("hd-glans", floors("LocalShopPack"), True),
    "hd-gammeldags": ("hd-gammeldags", floors("CountryManorPackFloor1", "CountryManorPackFloor2"), True),
    "hd-bryllup": ("hd-bryllup", floors("CozyRestaurantPack"), True),
    "hd-solskin": ("hd-solskin", floors("DowntownLoftPack"), True),
    "hd-streamer": ("hd-streamer", floors("NeonRainbowPack"), True),
    "hd-vaerksted": ("hd-vaerksted", floors("VintageMarketPack"), True),
}
# one room of its own (a child's own room): no shell in the original
INLINE = {"hd-miniverden": [[0.0, 28.0, "in"]]}


def tile(rooms: list[list]) -> list[list]:
    """Rooms side by side with nothing between them: a gap of the original is a hall (where the lift stands) if it is
    wide, else the two rooms meet in the middle of it."""
    out = [list(rooms[0])]
    for a, b, kind in rooms[1:]:
        prev = out[-1]
        gap = a - prev[1]
        if gap >= 4:
            out.append([prev[1], a, "hall"])
        elif gap > 0:
            mid = round((a + prev[1]) / 2, 1)
            prev[1] = mid
            a = mid
        out.append([a, b, kind])
    return out


def floor_of(scene: dict | None, inline: list | None, turn: bool) -> dict:
    rooms = tile([list(r) for r in inline] if inline else shells.rooms_of(scene))
    fx = {"win": [], "door": [], "lift": None, "has_lift": False} if inline else shells.fixtures_of(scene, rooms)
    x0, x1 = rooms[0][0], rooms[-1][1]
    if turn:  # the other way round
        rooms = [[x0 + x1 - b, x0 + x1 - a, k] for a, b, k in reversed(rooms)]
        fx = {
            **fx,
            "win": [x0 + x1 - x for x in fx["win"]],
            "door": [x0 + x1 - x for x in fx["door"]],
            "lift": None if fx["lift"] is None else x0 + x1 - fx["lift"],
        }
    s = min(K, (MAXW - 2 * PAD) / max(1.0, x1 - x0))

    def px(x: float) -> int:
        return round((x - x0) * s) + PAD

    inside = lambda x: x0 - 0.5 <= x <= x1 + 0.5  # noqa: E731
    return {
        "w": px(x1) + PAD,
        "rooms": [[px(a), px(b), k] for a, b, k in rooms],
        "win": [px(x) for x in fx["win"] if inside(x)],
        "door": [px(x) for x in fx["door"] if inside(x)],
        "lift": px(fx["lift"]) if fx["lift"] is not None and inside(fx["lift"]) else None,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("-d", "--data", type=Path, default=Path("game_data"))
    args = ap.parse_args()
    scenes = json.loads((args.data / "shells.json").read_text(encoding="utf-8"))
    out = {}
    for bid, (pack, names, turn) in BUILDINGS.items():
        fl = [floor_of(scenes[n], None, turn) for n in names]
        out[bid] = {"pack": pack, "floors": fl}
    for bid, rooms in INLINE.items():
        out[bid] = {"pack": bid, "floors": [floor_of(None, rooms, False)]}
    body = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    OUT_JS.write_text(
        "/* Generated by tools/homedesigner/build_floors.py: the floors of the houses of the theme packs, with the rooms\n"
        "   of each as wide as they are in the original, which are outdoors, and where the windows, doors and the lift\n"
        "   stand (px). Do not edit by hand. */\n"
        f"export const HOUSES = {body};\n",
        encoding="utf-8",
    )
    rooms = sum(len(f["rooms"]) for b in out.values() for f in b["floors"])
    print(f"{len(out)} buildings, {sum(len(b['floors']) for b in out.values())} floors, {rooms} rooms -> {OUT_JS.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
