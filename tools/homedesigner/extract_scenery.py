#!/usr/bin/env python3
"""Read everything a HomeDesigner scene is built from, not only the floors and walls: every object with where it stands, how
big it is and which picture or mesh it is drawn with (by name only), so the areas around the buildings (gardens, fronts,
streets, patios, balconies, pools, beaches) can be built like the original's. Writes game_data/scenery.json.

    python tools/homedesigner/extract_scenery.py <your.apk> [-o game_data]
"""

from __future__ import annotations

import argparse
import collections
import contextlib
import json
from pathlib import Path

import UnityPy


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("apk", type=Path)
    ap.add_argument("-o", "--output", type=Path, default=Path("game_data"))
    args = ap.parse_args()
    worlds = json.loads((args.output / "worlds.json").read_text(encoding="utf-8"))
    order = json.loads((args.output / "scene_order.json").read_text(encoding="utf-8"))
    wanted = {loc: f"level{order.index(loc)}" for loc in worlds["HomeDesigner"] if loc in order}
    env = UnityPy.load(str(args.apk))
    by_file: dict[str, dict] = collections.defaultdict(dict)
    for obj in env.objects:
        by_file[obj.assets_file.name][obj.path_id] = obj
    out = {}
    for loc, file_name in sorted(wanted.items(), key=lambda kv: int(kv[1][5:])):
        objs = by_file[file_name]
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

        rows = []
        for o in objs.values():
            if o.type.name != "GameObject":
                continue
            d = o.parse_as_object()
            tf = None
            sprite = mesh = ""
            box = None
            for c in d.m_Component:
                p = c.component.deref()
                n = p.type.name
                if n in ("Transform", "RectTransform"):
                    tf = p.path_id
                elif n == "SpriteRenderer":
                    with contextlib.suppress(Exception):
                        sprite = p.parse_as_object().m_Sprite.deref().peek_name() or ""
                elif n == "MeshFilter":
                    with contextlib.suppress(Exception):
                        mesh = p.parse_as_object().m_Mesh.deref().peek_name() or ""
                elif n == "BoxCollider2D":
                    with contextlib.suppress(Exception):
                        b = p.parse_as_object()
                        box = [round(b.m_Size.x, 2), round(b.m_Size.y, 2)]
            if tf is None:
                continue
            x, y, sx, sy = world(tf)
            rows.append(
                [
                    d.m_Name,
                    round(x, 2),
                    round(y, 2),
                    round(sx, 2),
                    round(sy, 2),
                    sprite,
                    mesh,
                    box,
                    1 if d.m_IsActive else 0,
                ]
            )
        out[loc] = rows
        print(f"{loc:34s} {len(rows):5d} objects", flush=True)
    (args.output / "scenery.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
