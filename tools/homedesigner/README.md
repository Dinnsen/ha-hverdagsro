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

The data file is committed, so the game does not need any of this to run.
