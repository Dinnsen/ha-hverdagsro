"""What a house shell of the original is made of: the rooms of a floor (as wide as they are), which of them are
outdoors, and where the windows, doors and the lift are. Used by build_floors.py; reads game_data/shells.json
(made by extract_shells.py). Units are the original's; one unit is 38.3 px in the game."""

from __future__ import annotations

import re

NOISE = re.compile(r"obstructor|decor|carpet|categor|ambience|background|panel|anim|counter\b|_furnish", re.I)
OUT = re.compile(
    r"garden|patio|terrace|outside|balcon|porch|gaz[e]?e?bo|beach|island|platform|park|campsite|front\b", re.I
)
ROOM_FLOOR = re.compile(r"^room\s*0?(\d+)\s*floor(partial|left|righ?t?)?$", re.I)
WALL = re.compile(r"^(room\s*0?\d+\s*back\s*wall|wall[\w_ ()]*|.*backwall.*)$", re.I)
LIFT = re.compile(r"^elevator(doors?|_|$)|^elevator$", re.I)
DOOR = re.compile(r"^(door|room\w*door|entrancedoor|vandoor|dooranimator|doorbell|frontdoor)", re.I)


def parts_of(scene: dict, rx: re.Pattern, min_w: float = 0.0, skip: re.Pattern | None = None) -> list[dict]:
    return [
        p for p in scene["parts"] if rx.search(p["name"]) and p["w"] >= min_w and not (skip and skip.search(p["name"]))
    ]


def span(p: dict) -> tuple[float, float]:
    return p["x"] - p["w"] / 2, p["x"] + p["w"] / 2


def rooms_of(scene: dict) -> list[list]:
    """[[x0, x1, 'in' | 'out'], ...] from left to right, tiling the floor without overlaps."""
    floors = [p for p in scene["parts"] if ROOM_FLOOR.match(p["name"]) and p["w"] >= 3]
    out_parts = [
        p
        for p in scene["parts"]
        if OUT.search(p["name"])
        and re.search(r"floor|garden|patio|terrace", p["name"], re.I)
        and p["w"] >= 2.5
        and p["w"] < 70
        and not NOISE.search(p["name"])
    ]
    if len(floors) >= 2 or (floors and out_parts):
        base = sorted({(round(span(p)[0], 1), round(span(p)[1], 1)) for p in floors})
    else:
        walls = [
            p
            for p in scene["parts"]
            if re.match(r"^(wall\d*|room\d+backwall\w*|wall_room\w*)", p["name"], re.I)
            and p["w"] >= 4
            and p["h"] >= 3
            and not NOISE.search(p["name"])
        ]
        base = []
        for p in sorted(walls, key=lambda q: -q["w"]):
            a, b = span(p)
            if all(min(b, d) - max(a, c) < 0.6 * min(b - a, d - c) for c, d in base):
                base.append((round(a, 1), round(b, 1)))
        base.sort()
        if not base:
            fl = [
                p for p in scene["parts"] if re.match(r"^(main)?floor\d*$|^floor", p["name"], re.I) and 6 <= p["w"] < 70
            ]
            base = sorted({(round(span(p)[0], 1), round(span(p)[1], 1)) for p in fl}) or [(-14.0, 14.0)]
    # a garden is fenced by a wall of its own
    out_parts += [p for p in scene["parts"] if re.match(r"^gardenwall", p["name"], re.I) and 5 <= p["w"] < 70]
    # outdoor stretches that no room covers
    for p in out_parts:
        a, b = span(p)
        if all(min(b, d) - max(a, c) < 0.5 * (b - a) for c, d in base):
            base.append((round(a, 1), round(b, 1)))
    base.sort()
    # merge near-duplicates, then cut the overlaps in the middle
    merged: list[list[float]] = []
    for a, b in base:
        if merged and min(b, merged[-1][1]) - max(a, merged[-1][0]) > 0.8 * min(b - a, merged[-1][1] - merged[-1][0]):
            merged[-1] = [min(a, merged[-1][0]), max(b, merged[-1][1])]
        else:
            merged.append([a, b])
    for i in range(1, len(merged)):
        b0 = merged[i - 1][1]
        a1 = merged[i][0]
        if a1 < b0 or a1 - b0 < 2.5:  # overlap or a thin gap: they meet in the middle
            mid = round((max(a1, b0) + min(a1, b0)) / 2, 1) if a1 < b0 else round((a1 + b0) / 2, 1)
            merged[i - 1][1] = mid
            merged[i][0] = mid
    rooms = []
    for a, b in merged:
        if b - a < 3.5:
            continue
        mid = (a + b) / 2
        outdoor = any(
            (OUT.search(p["name"]) or p["name"].lower().startswith("gardenwall"))
            and span(p)[0] - 1 <= mid <= span(p)[1] + 1
            for p in scene["parts"]
            if p["w"] >= 2.5 and not NOISE.search(p["name"])
        )
        walled = any(
            WALL.match(p["name"]) and p["h"] >= 3 and span(p)[0] - 1 <= mid <= span(p)[1] + 1 for p in scene["parts"]
        )
        rooms.append([a, b, "out" if outdoor and not walled else "in"])
    return rooms


def fixtures_of(scene: dict, rooms: list[list]) -> dict:
    """Windows (the shelves of the windows), doors and the lift, by x in the scene's units."""
    wins = sorted(
        {round(p["x"], 1) for p in scene["parts"] if re.match(r"^windowshelf", p["name"], re.I) and p["w"] >= 1}
    )
    door = [round(p["x"], 1) for p in scene["parts"] if DOOR.match(p["name"]) and abs(p["x"]) > 0.05]
    lift = [round(p["x"], 1) for p in scene["parts"] if LIFT.match(p["name"]) and abs(p["x"]) > 0.05]
    return {
        "win": wins,
        "door": door,
        "lift": lift[0] if lift else None,
        "has_lift": any(LIFT.match(p["name"]) for p in scene["parts"]),
    }
