#!/usr/bin/env python3
"""Read the avatar system of a Unity game build you own: the catalog of what a figure is made of (hair, beards, clothes,
hats and other items, ear accessories, colours, the categories they are sorted in), the dance moves, the guest
figures and the talking mouths. Only names, numbers and which asset belongs to which category are read; no art is
copied. Writes game_data/avatars_raw.pkl and game_data/catalog.json (for build_avatars.py).

    python tools/homedesigner/extract_avatars.py <your.apk> [-o game_data]
"""

from __future__ import annotations

import argparse
import collections
import contextlib
import json
from pathlib import Path
import pickle
import re
import struct

import UnityPy

FEAT = re.compile(
    r"^(CharacterFeature\w*Asset|AvatarColorSwatch|AvatarColorSwatchHub|AvatarCatalog|AvatarFeatureCategory|AvatarFeatureSet|"
    r"AvatarRandomizationRules|AvatarRandomizationRule|AvatarEntry|AvatarItem|ClothesMetaData|DanceMoveConfig|"
    r"TalkingMouthConfiguration\w*|GuestCharacterData|CharacterFeatureSet|CharacterFeaturesSortOrder|SkinHelper|"
    r"CharacterExpression\w*|EmojiConfigurationProvider|CustomOutfit\w*)$"
)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("apk", type=Path)
    ap.add_argument("-o", "--output", type=Path, default=Path("game_data"))
    args = ap.parse_args()
    env = UnityPy.load(str(args.apk))
    scripts: dict = {}
    by_file: dict[str, dict] = collections.defaultdict(dict)
    for obj in env.objects:
        by_file[obj.assets_file.name][obj.path_id] = obj
        if obj.type.name == "MonoScript":
            with contextlib.suppress(Exception):
                scripts[(obj.assets_file.name, obj.path_id)] = obj.parse_as_object().m_ClassName
    raw: dict = {}
    index: dict = {}
    for f, objs in by_file.items():
        ext = [f] + [e.path for e in next(iter(objs.values())).assets_file.externals]
        for pid, o in objs.items():
            tn = o.type.name
            if tn == "MonoBehaviour":
                try:
                    data = o.get_raw_data()
                    fid, spid = struct.unpack("<iq", data[16:28])
                    t = ext[fid] if 0 <= fid < len(ext) else None
                    cls = scripts.get((t, spid)) if t else None
                except Exception:
                    continue
                if cls and FEAT.match(cls):
                    name = ""
                    with contextlib.suppress(Exception):
                        name = o.peek_name() or ""
                    raw[(f, pid)] = (cls, name, data, ext)
                    index[(f, pid)] = (tn, name, cls)
            elif f == "resources.assets" and tn in (
                "Sprite",
                "Texture2D",
                "Mesh",
                "Material",
                "GameObject",
                "AnimationClip",
                "TextAsset",
            ):
                with contextlib.suppress(Exception):
                    index[(f, pid)] = (tn, o.peek_name() or "", None)
    # the catalog of the game's prefabs (path, hash, guid, kind, …): which premade figures there are, and in which world
    rows = []
    cat = next(
        (o for o in by_file["resources.assets"].values() if o.type.name == "TextAsset" and o.path_id == 212074), None
    )
    if cat is not None:
        for line in cat.get_raw_data().decode("utf-8", errors="replace").splitlines():
            parts = line.split(",")
            if ".prefab" in line and len(parts) >= 4:
                rows.append([parts[0][parts[0].find("Assets/") :] if "Assets/" in parts[0] else parts[0], *parts[1:5]])
    (args.output / "catalog.json").write_text(json.dumps(rows), encoding="utf-8")
    print(f"{len(raw)} avatar assets, {len(index)} indexed objects, {len(rows)} catalog rows", flush=True)
    with (args.output / "avatars_raw.pkl").open("wb") as fh:
        pickle.dump({"raw": raw, "index": index}, fh)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
