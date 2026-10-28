#!/usr/bin/env python3
"""Read the shells of the HomeDesigner houses of a Unity game build: for every scene of a house (every floor of it has
its own scene, and the elevators between them) the floors, walls, balconies, patios, steps, doors and windows, each
with where it stands in the scene and how big it is. A house can then be built with as many floors as the original,
with the rooms of each floor as wide as the original's. Writes game_data/shells.json.

    python tools/homedesigner/extract_shells.py <your.apk> [-o game_data]
"""

from __future__ import annotations

import argparse
import collections
import contextlib
import json
from pathlib import Path
import re
import struct

import UnityPy

KINDS = ("WorldSurface", "Container", "EffectObject", "SceneLamp", "Pet", "Trash", "LiquidSource")
# what a house is made of
PART = re.compile(
    r"(floor|wall|balcon|patio|terrace|garden|counter|stair|step|escalator|elevator|lift|door|window|exit|pillar|room|"
    r"back|front|roof|attic|basement|porch|gazebo|gazeebo|pool|platform|entrance|hall|corridor|curtain|light)",
    re.I,
)
NOISE = re.compile(r"(canvas|button|eventsystem|camera|sfx|audio|particle|weather|sky|cloud|shadow|ui$)", re.I)


def script_name(raw: bytes, scripts: dict, externals: list[str], file_name: str) -> str | None:
    file_id, path_id = struct.unpack("<iq", raw[16:28])
    target = externals[file_id] if file_id and file_id < len(externals) else file_name
    return scripts.get((target, path_id))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("apk", type=Path)
    ap.add_argument("-o", "--output", type=Path, default=Path("game_data"))
    args = ap.parse_args()
    worlds = json.loads((args.output / "worlds.json").read_text(encoding="utf-8"))
    order = json.loads((args.output / "scene_order.json").read_text(encoding="utf-8"))
    wanted = {loc: f"level{order.index(loc)}" for loc in worlds["HomeDesigner"] if loc in order}
    env = UnityPy.load(str(args.apk))
    scripts: dict = {}
    by_file: dict[str, list] = collections.defaultdict(list)
    for obj in env.objects:
        by_file[obj.assets_file.name].append(obj)
        if obj.type.name == "MonoScript":
            with contextlib.suppress(Exception):
                scripts[(obj.assets_file.name, obj.path_id)] = obj.parse_as_object().m_ClassName
    out = {}
    for loc, file_name in sorted(wanted.items(), key=lambda kv: int(kv[1][5:])):
        objs = {o.path_id: o for o in by_file[file_name]}
        externals = [file_name] + [e.path for e in next(iter(objs.values())).assets_file.externals]
        transforms = {
            pid: o.parse_as_object() for pid, o in objs.items() if o.type.name in ("Transform", "RectTransform")
        }

        def world(tf_id: int, transforms=transforms) -> tuple[float, float, float, float]:
            x = y = 0.0
            sx = sy = 1.0
            chain = []
            cur = transforms.get(tf_id)
            while cur is not None:
                chain.append(cur)
                f = cur.m_Father
                cur = transforms.get(f.path_id) if f and f.path_id else None
            for t in reversed(chain):
                x += t.m_LocalPosition.x * sx
                y += t.m_LocalPosition.y * sy
                sx *= t.m_LocalScale.x
                sy *= t.m_LocalScale.y
            return x, y, sx, sy

        parts = []
        for o in objs.values():
            if o.type.name != "GameObject":
                continue
            d = o.parse_as_object()
            if not d.m_IsActive or NOISE.search(d.m_Name):
                continue
            tf = box = None
            kinds = []
            for c in d.m_Component:
                p = c.component.deref()
                kind = p.type.name
                if kind in ("Transform", "RectTransform"):
                    tf = p.path_id
                elif kind == "MonoBehaviour":
                    with contextlib.suppress(Exception):
                        s = script_name(p.get_raw_data(), scripts, externals, file_name)
                        if s in KINDS:
                            kinds.append(s)
                elif kind == "BoxCollider2D":
                    b = p.parse_as_object()
                    box = [b.m_Offset.x, b.m_Offset.y, b.m_Size.x, b.m_Size.y]
                elif kind == "PolygonCollider2D":
                    pts = [(q.x, q.y) for path in p.parse_as_object().m_Points.m_Paths for q in path]
                    if pts:
                        xs, ys = [q[0] for q in pts], [q[1] for q in pts]
                        box = [(min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(xs) - min(xs), max(ys) - min(ys)]
            if tf is None or not (PART.search(d.m_Name) or kinds):
                continue
            x, y, sx, sy = world(tf)
            w = abs(box[2] * sx) if box else 0
            h = abs(box[3] * sy) if box else 0
            cx = x + (box[0] * sx if box else 0)
            cy = y + (box[1] * sy if box else 0)
            parts.append(
                {
                    "name": d.m_Name,
                    "x": round(cx, 2),
                    "y": round(cy, 2),
                    "w": round(w, 2),
                    "h": round(h, 2),
                    "kinds": kinds,
                }
            )
        out[loc] = {"level": file_name, "parts": parts}
        print(f"{loc:34s} {len(parts):4d} parts")
    (args.output / "shells.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
