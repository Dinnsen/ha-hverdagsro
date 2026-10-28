#!/usr/bin/env python3
"""Extract HomeDesigner prefab structure and per-scene furnishable surfaces from a Unity APK.

Writes game_data/prefabs.json and game_data/scenes.json, which build_scenes.py uses to
generate .tlws save files. Needs only read access to the APK.
"""

from __future__ import annotations

import argparse
import collections
import contextlib
import json
from pathlib import Path
import re
import struct
import sys

EXTERNALS_FALLBACK = ["globalgamemanagers.assets", "resources.assets"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("apk", type=Path, help="Path to the Unity APK you own")
    parser.add_argument("-o", "--output", type=Path, default=Path("game_data"))
    parser.add_argument("--scenes-only", action="store_true", help="Skip the slow prefab pass")
    return parser.parse_args()


class ApkIndex:
    """Raw-byte helpers: MonoBehaviour typetrees are unreadable in this IL2CPP build."""

    def __init__(self, apk: Path) -> None:
        import UnityPy

        print(f"Loading {apk} ...", flush=True)
        self.env = UnityPy.load(str(apk))
        self.by_file: dict[str, dict[int, object]] = collections.defaultdict(dict)
        self.scripts: dict[tuple[str, int], str] = {}
        for obj in self.env.objects:
            self.by_file[obj.assets_file.name][obj.path_id] = obj
            if obj.type.name == "MonoScript":
                with contextlib.suppress(Exception):
                    self.scripts[(obj.assets_file.name, obj.path_id)] = obj.parse_as_object().m_ClassName
        print(f"Indexed {sum(len(v) for v in self.by_file.values())} objects", flush=True)

    def externals(self, file_name: str) -> list[str]:
        some = next(iter(self.by_file[file_name].values()))
        return [file_name] + [e.path for e in some.assets_file.externals]

    def script_class(self, raw: bytes, file_name: str, externals: list[str]) -> str | None:
        file_id, path_id = struct.unpack("<iq", raw[16:28])
        target = externals[file_id] if file_id < len(externals) else None
        return self.scripts.get((target, path_id)) if target else None


def id_component(raw: bytes) -> tuple[str, int] | None:
    """Read the (scene, id) pair stored in GameElementFragment-style components."""
    start = raw.find(b"HD")
    if start < 4:
        return None
    length = struct.unpack("<i", raw[start - 4 : start])[0]
    if not 0 < length < 128:
        return None
    scene = raw[start : start + length].decode("ascii", errors="replace")
    offset = (start + length + 3) & ~3
    return scene, struct.unpack("<i", raw[offset : offset + 4])[0]


class GameObjectInfo:
    def __init__(self, index: ApkIndex, go_obj, file_name: str, externals: list[str]) -> None:
        go = go_obj.parse_as_object()
        self.name: str = go.m_Name
        self.scripts: list[str] = []
        self.native: list[str] = []
        self.ids: dict[str, tuple[str, int]] = {}
        self.transform = None
        self.box = None
        self.poly = None
        self.box_offset = (0.0, 0.0)
        for comp in go.m_Component:
            ptr = comp.component.deref()
            kind = ptr.type.name
            if kind == "Transform":
                self.transform = ptr.parse_as_object()
            elif kind == "MonoBehaviour":
                raw = ptr.get_raw_data()
                script = index.script_class(raw, file_name, externals) or "?"
                self.scripts.append(script)
                found = id_component(raw)
                if found and found[1]:
                    self.ids[script] = found
            else:
                self.native.append(kind)
                if kind == "BoxCollider2D":
                    box = ptr.parse_as_object()
                    self.box = (box.m_Size.x, box.m_Size.y)
                    self.box_offset = (box.m_Offset.x, box.m_Offset.y)
                elif kind == "PolygonCollider2D":
                    paths = ptr.parse_as_object().m_Points.m_Paths
                    pts = [(p.x, p.y) for path in paths for p in path]
                    if pts:
                        self.poly = pts

    @property
    def local(self) -> tuple[float, float]:
        t = self.transform
        return (t.m_LocalPosition.x, t.m_LocalPosition.y) if t else (0.0, 0.0)

    @property
    def scale(self) -> tuple[float, float]:
        t = self.transform
        return (t.m_LocalScale.x, t.m_LocalScale.y) if t else (1.0, 1.0)


def local_rect(info: GameObjectInfo) -> tuple[float, float, float, float] | None:
    """Bounding rect (x0, x1, y0, y1) of the collider in the GameObject's own space."""
    if info.poly:
        xs = [p[0] for p in info.poly]
        ys = [p[1] for p in info.poly]
        return min(xs), max(xs), min(ys), max(ys)
    if info.box:
        w, h = info.box
        ox, oy = info.box_offset
        return ox - w / 2, ox + w / 2, oy - h / 2, oy + h / 2
    return None


def stub_type(info: GameObjectInfo) -> int | None:
    """Type id of the saved sub-object a prefab child produces, or None if it has none."""
    scripts = set(info.scripts)
    if "Container" in scripts:
        return 19
    if "EffectObject" in scripts:
        return 22
    if scripts & {"SVGMeshComponent", "WorldSurface", "Trash", "SvgMeshInterface"}:
        return 0
    if "GameElementFragment" in scripts and "ParticleSystem" not in info.native:
        return 0
    return None


ROOT_TYPES = {"Item": 2, "SceneObject": 18, "SceneLamp": 14, "EffectObject": 22}


def root_type(scripts: list[str]) -> tuple[int, bool]:
    for script in scripts:
        if script in ROOT_TYPES:
            return ROOT_TYPES[script], True
    return 1, any(s in {"GameElementFragment", "WorldSurface", "HDFurniture"} for s in scripts)


def read_prefab(index: ApkIndex, go_obj, file_name: str, externals: list[str]) -> dict:
    stubs: list[int] = []
    surfaces: list[dict] = []
    containers: list[dict] = []
    footprint = [1e9, -1e9, 1e9, -1e9]

    def visit(obj, origin, is_root: bool) -> GameObjectInfo:
        info = GameObjectInfo(index, obj, file_name, externals)
        px, py = info.local
        pos = (origin[0] + (0 if is_root else px), origin[1] + (0 if is_root else py))
        if is_root and "WorldSurface" in info.scripts:
            rect = local_rect(info)
            if rect:
                surfaces.append({"stub": -1, "name": info.name, "rect": list(rect)})
        if not is_root:
            kind = stub_type(info)
            if kind is not None:
                stubs.append(kind)
            rect = local_rect(info)
            if "WorldSurface" in info.scripts and rect:
                surfaces.append(
                    {
                        "stub": len(stubs) - 1,
                        "name": info.name,
                        "rect": [rect[0] + pos[0], rect[1] + pos[0], rect[2] + pos[1], rect[3] + pos[1]],
                    }
                )
            if "Container" in info.scripts:
                rect = local_rect(info)
                containers.append(
                    {
                        "stub": len(stubs) - 1,
                        "name": info.name,
                        "rect": [rect[0] + pos[0], rect[1] + pos[0], rect[2] + pos[1], rect[3] + pos[1]]
                        if rect
                        else None,
                    }
                )
        rect = local_rect(info)
        if rect:
            footprint[0] = min(footprint[0], rect[0] + pos[0])
            footprint[1] = max(footprint[1], rect[1] + pos[0])
            footprint[2] = min(footprint[2], rect[2] + pos[1])
            footprint[3] = max(footprint[3], rect[3] + pos[1])
        if info.transform:
            for child in info.transform.m_Children:
                child_go = child.deref().parse_as_object().m_GameObject.deref()
                visit(child_go, pos, False)
        return info

    root = visit(go_obj, (0.0, 0.0), True)
    rtype, known = root_type(root.scripts)
    has_footprint = footprint[1] > footprint[0]
    return {
        "root_type": rtype,
        "root_known": known,
        "root_scripts": root.scripts,
        "stubs": [] if rtype == 14 else stubs,
        "surfaces": surfaces,
        "containers": containers,
        "footprint": footprint if has_footprint else None,
    }


def read_catalog(index: ApkIndex) -> list[dict]:
    asset = next(
        o for o in index.by_file["resources.assets"].values() if o.type.name == "TextAsset" and o.path_id == 212074
    )
    text = asset.get_raw_data().decode("utf-8", errors="replace")
    rows = []
    for line in text.split("\n"):
        if ".prefab" not in line or line.count(",") < 3:
            continue
        parts = line.split(",")
        path = parts[0][parts[0].find("Assets/") :] if "Assets/" in parts[0] else parts[0]
        rows.append({"path": path, "guid": parts[1], "category": parts[3]})
    return rows


def extract_prefabs(index: ApkIndex, catalog: list[dict]) -> dict:
    externals = index.externals("resources.assets")
    by_name: dict[str, list] = collections.defaultdict(list)
    for obj in index.by_file["resources.assets"].values():
        if obj.type.name == "GameObject":
            try:
                by_name[obj.peek_name()].append(obj)
            except Exception:
                continue
    prefabs: dict[str, dict] = {}
    missing = 0
    wanted = [r for r in catalog if "/HomeDesigner/" in r["path"]]
    for n, row in enumerate(wanted, 1):
        name = Path(row["path"]).stem
        candidates = by_name.get(name, [])
        if not candidates:
            missing += 1
            continue
        try:
            data = read_prefab(index, candidates[0], "resources.assets", externals)
        except Exception as error:
            print(f"  skip {name}: {error}", file=sys.stderr)
            continue
        found = re.search(r"/HomeDesigner/([^/]+)/", row["path"])
        pack = found.group(1) if found else "_root"
        data.update(name=name, pack=pack, category=row["category"], path=row["path"])
        prefabs[row["guid"]] = data
        if n % 500 == 0:
            print(f"  prefabs {n}/{len(wanted)}", flush=True)
    print(f"Prefabs read: {len(prefabs)} (no GameObject for {missing})", flush=True)
    return prefabs


def world_pos(index: ApkIndex, info_by_go: dict, go_obj, file_name, externals) -> tuple[float, float]:
    x = y = 0.0
    chain = []
    cur = go_obj
    while cur is not None:
        info = info_by_go.get(cur.path_id)
        if info is None:
            info = GameObjectInfo(index, cur, file_name, externals)
            info_by_go[cur.path_id] = info
        chain.append(info)
        father = info.transform.m_Father if info.transform else None
        if father is None or not father.path_id:
            break
        cur = father.deref().parse_as_object().m_GameObject.deref()
    sx = sy = 1.0
    for info in reversed(chain):
        lx, ly = info.local
        x += lx * sx
        y += ly * sy
        sx *= info.scale[0]
        sy *= info.scale[1]
    return x, y


def extract_scenes(index: ApkIndex) -> dict:
    scenes: dict[str, dict] = {}
    for file_name in sorted(index.by_file):
        if not file_name.startswith("level"):
            continue
        objects = index.by_file[file_name]
        externals = index.externals(file_name)
        info_by_go: dict[int, GameObjectInfo] = {}
        surfaces = []
        bases = collections.Counter()
        for obj in objects.values():
            if obj.type.name != "MonoBehaviour":
                continue
            raw = obj.get_raw_data()
            if index.script_class(raw, file_name, externals) != "HDFurnishableSurface":
                continue
            go_obj = objects.get(struct.unpack("<q", raw[4:12])[0])
            if go_obj is None:
                continue
            info = GameObjectInfo(index, go_obj, file_name, externals)
            ident = info.ids.get("WorldSurface") or next(iter(info.ids.values()), None)
            if not ident:
                continue
            rect = local_rect(info)
            x, y = world_pos(index, info_by_go, go_obj, file_name, externals)
            base = None
            father = info.transform.m_Father if info.transform else None
            while father is not None and father.path_id:
                parent_go = father.deref().parse_as_object().m_GameObject.deref()
                parent = GameObjectInfo(index, parent_go, file_name, externals)
                if "GameElementFragment" in parent.ids:
                    base = parent.ids["GameElementFragment"][1]
                    break
                father = parent.transform.m_Father if parent.transform else None
            if base:
                bases[base] += 1
            surfaces.append(
                {
                    "name": info.name,
                    "id": ident[1],
                    "scene": ident[0],
                    "base": base,
                    "x": x,
                    "y": y,
                    "rect": list(rect) if rect else None,
                }
            )
        if not surfaces:
            continue
        scene_ids = {s["scene"] for s in surfaces}
        scene_name = collections.Counter(s["scene"] for s in surfaces).most_common(1)[0][0]
        scenes[scene_name] = {
            "level": file_name,
            "save_scene": sorted(scene_ids)[0] if scene_ids else scene_name,
            "base": bases.most_common(1)[0][0] if bases else None,
            "surfaces": surfaces,
        }
        print(f"  {scene_name}: {len(surfaces)} surfaces", flush=True)
    return scenes


def main() -> int:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    index = ApkIndex(args.apk)
    catalog = read_catalog(index)
    print(f"Catalog rows: {len(catalog)}", flush=True)
    scenes = extract_scenes(index)
    (args.output / "scenes.json").write_text(json.dumps(scenes, indent=1), encoding="utf-8")
    if args.scenes_only:
        return 0
    prefabs = extract_prefabs(index, catalog)
    (args.output / "prefabs.json").write_text(json.dumps(prefabs), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
