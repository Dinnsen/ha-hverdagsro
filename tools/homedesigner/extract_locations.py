#!/usr/bin/env python3
"""Read the hand-built places of a Unity game build: every furniture-like object of a scene, with its name, where it
stands and how big it is, so a place can be laid out like the original. Writes game_data/locations.json.

    python tools/homedesigner/extract_locations.py <your.apk> [-o game_data] [--only BunBakery,HairSalon]
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
SKIP = re.compile(
    r"(weather|ambience|sky|sun|moon|rays|glow|halo|shooting|cloud|shadow|light(origin|transform)?|eventsystem|canvas|ui|button|"
    r"panel|countdown|recording|timer|clap|progress|frame$|cover|fill|export|play|stop|delete|mask|spot$|camera|sfx|audio|"
    r"particle|counter\s?\d|bg\s?\d|background|backestground|general|foreground|fg\s?\d|touch|depth|sorting|area$|trigger)",
    re.I,
)


def script_name(raw: bytes, scripts: dict, externals: list[str], file_name: str) -> str | None:
    file_id, path_id = struct.unpack("<iq", raw[16:28])
    target = externals[file_id] if file_id and file_id < len(externals) else file_name
    return scripts.get((target, path_id))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("apk", type=Path)
    ap.add_argument("-o", "--output", type=Path, default=Path("game_data"))
    ap.add_argument("--only", default="", help="comma separated location names")
    args = ap.parse_args()
    only = {x for x in args.only.split(",") if x}
    worlds = json.loads((args.output / "worlds.json").read_text(encoding="utf-8"))
    wanted = {
        loc: w for w, locs in worlds.items() for loc in locs if w != "HomeDesigner" and not loc.startswith("Elevator")
    }
    if only:
        wanted = {k: v for k, v in wanted.items() if k in only}
    env = UnityPy.load(str(args.apk))
    scripts: dict = {}
    by_file: dict[str, list] = collections.defaultdict(list)
    for obj in env.objects:
        by_file[obj.assets_file.name].append(obj)
        if obj.type.name == "MonoScript":
            with contextlib.suppress(Exception):
                scripts[(obj.assets_file.name, obj.path_id)] = obj.parse_as_object().m_ClassName
    # the n-th scene of the game's own list is the file levelN
    order = json.loads((args.output / "scene_order.json").read_text(encoding="utf-8"))
    level_of = {loc: f"level{order.index(loc)}" for loc in wanted if loc in order}
    out = {}
    for loc, file_name in sorted(level_of.items()):
        objs = {o.path_id: o for o in by_file[file_name]}
        externals = [file_name] + [e.path for e in next(iter(objs.values())).assets_file.externals]
        gos = {pid: o for pid, o in objs.items() if o.type.name == "GameObject"}
        info: dict[int, dict] = {}
        transforms = {}
        for pid, o in objs.items():
            if o.type.name in ("Transform", "RectTransform"):
                t = o.parse_as_object()
                transforms[pid] = t
        for pid, g in gos.items():
            d = g.parse_as_object()
            rec = {"name": d.m_Name, "scripts": [], "box": None, "tf": None, "active": bool(d.m_IsActive)}
            for c in d.m_Component:
                p = c.component.deref()
                kind = p.type.name
                if kind in ("Transform", "RectTransform"):
                    rec["tf"] = p.path_id
                elif kind == "MonoBehaviour":
                    try:
                        s = script_name(p.get_raw_data(), scripts, externals, file_name)
                    except Exception:
                        s = None
                    if s:
                        rec["scripts"].append(s)
                elif kind == "BoxCollider2D":
                    b = p.parse_as_object()
                    rec["box"] = [b.m_Offset.x, b.m_Offset.y, b.m_Size.x, b.m_Size.y]
                elif kind == "PolygonCollider2D":
                    pts = [(q.x, q.y) for path in p.parse_as_object().m_Points.m_Paths for q in path]
                    if pts:
                        xs, ys = [q[0] for q in pts], [q[1] for q in pts]
                        rec["box"] = [
                            (min(xs) + max(xs)) / 2,
                            (min(ys) + max(ys)) / 2,
                            max(xs) - min(xs),
                            max(ys) - min(ys),
                        ]
            info[pid] = rec

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

        things = []
        for rec in info.values():
            if rec["tf"] is None or not rec["active"]:
                continue
            kinds = [s for s in rec["scripts"] if s in KINDS]
            if not rec["box"] and not kinds:
                continue
            if SKIP.search(rec["name"]) and not kinds:
                continue
            x, y, sx, sy = world(rec["tf"])
            box = rec["box"]
            w = abs(box[2] * sx) if box else 0
            h = abs(box[3] * sy) if box else 0
            things.append(
                {
                    "name": rec["name"],
                    "x": round(x + (box[0] * sx if box else 0), 2),
                    "y": round(y + (box[1] * sy if box else 0), 2),
                    "w": round(w, 2),
                    "h": round(h, 2),
                    "kinds": kinds,
                }
            )
        out[loc] = {"world": wanted[loc], "level": file_name, "things": things}
        print(f"{wanted[loc]:16s} {loc:28s} {len(things):4d} objects")
    (args.output / "locations.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
