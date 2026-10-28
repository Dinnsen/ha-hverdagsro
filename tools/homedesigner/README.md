# The theme packs: how they are made

`hv-packs4-data.js` (the names, shapes and colours of the 47 theme packs) is generated. The shapes themselves are
drawn by hand in `custom_components/hverdagsro/frontend/hv-proto.js`; everything in the game is our own drawing.

1. `extract_game_data.py <your.apk> -o game_data` reads the catalog of furniture and things (names, which parts open,
   where the shelves are) from an Android game build **you own**. It needs `pip install "UnityPy>=1.20,<2"`.
   Only names and structure are read: no art is copied, and nothing from the build is kept in this repository.
2. `build_packs.py <out.js>` (run from the folder that holds `game_data/`) turns the catalog into
   `hv-packs4-data.js`: a Danish and an English name for every thing (`dict_da.py`), which of our shapes it is drawn
   with, and a colour. Things whose name needs a proper noun, a brand or a character are left out. The packs, their
   levels, towns and colours are in `packmeta.py`.

```
python tools/homedesigner/extract_game_data.py game.apk -o game_data
python tools/homedesigner/build_packs.py custom_components/hverdagsro/frontend/hv-packs4-data.js
```

3. `extract_locations.py <your.apk>` reads the hand-built places of the same game (every piece of furniture with where it
   stands and how big it is), and `build_places.py <out.js>` turns them into `hv-worlds-data.js`: the places of the
   worlds, laid out like the original with our own shapes.

4. `extract_shells.py <your.apk>` reads the shells of the HomeDesigner houses (every floor of a house is a scene of its own:
   its rooms, walls, balconies, windows, doors and lift, each with where it stands and how wide it is), and
   `build_floors.py` (with `shells.py`) turns them into `hv-floors-data.js`: the floors of 50 buildings with their rooms
   as wide as in the original. The game furnishes the rooms by what they are for (`hv-floors.js`).

```
python tools/homedesigner/extract_shells.py game.apk -o game_data
python tools/homedesigner/build_floors.py -d game_data
```

5. `extract_avatars.py <your.apk>` reads the avatar system of the game (the catalog of hair, beards, clothes, hats, masks,
   ear accessories, colours and their categories, the dance moves, the premade figures and pets and the world each lives
   in), and `build_avatars.py` turns it into `hv-avatars-data.js`. Only names, numbers and colours are read: every figure is
   drawn by the game's own shapes (`hv-avatars.js`). Brands, licensed characters and real people are left out.

```
python tools/homedesigner/extract_avatars.py game.apk -o game_data
python tools/homedesigner/build_avatars.py -d game_data
```

The data files are committed, so the game does not need any of this to run.
