#!/usr/bin/env python3
"""Turn the extracted places (extract_locations.py) into hv-worlds-data.js: for every place of the game a list of
furniture with where it stands and how big it is, laid out like the original, drawn with our own shapes.

    python tools/homedesigner/build_places.py <out.js>      (run where game_data/ is)
"""

from __future__ import annotations

import collections
import json
from pathlib import Path
import re
import sys

K = 38.3  # pixels in the game for one unit of the original
FLOOR_PX = 470  # where the floor of a room begins in the game's rooms
MAXW = 2400

# worlds: id -> (Danish name, English name, emoji, level, colour, wall, floor)
WORLDS = {
    "Town": ("Byen", "The Town", "🏘️", 1, "#F4A261", "#FFF0D6", "#C98B55"),
    "City": ("Storbyen", "The City", "🏙️", 1, "#FF8A3C", "#F7D9EC", "#E8E2D6"),
    "School": ("Skolen", "The School", "🏫", 2, "#FFD93D", "#FFF3B0", "#C9A27A"),
    "Neighborhood": ("Kvarteret", "The Neighbourhood", "🏠", 2, "#6BCB77", "#E2F5D9", "#D9C29A"),
    "Farm": ("Gården", "The Farm", "🚜", 2, "#8FD08A", "#FFE9C7", "#B98960"),
    "Pets": ("Dyrenes by", "Pet Town", "🐾", 2, "#FF9AB5", "#FFE0EC", "#E8C69A"),
    "BunBakery": ("Bollebageriet", "The Bun Bakery", "🥐", 2, "#D9A066", "#FFE9D6", "#C98B55"),
    "Hospital": ("Hospitalet", "The Hospital", "🏥", 3, "#E5484D", "#E8F6FF", "#E8E8E8"),
    "Office": ("Kontorbyen", "Office Town", "🏢", 3, "#4D96FF", "#E8EEF6", "#9AA4BA"),
    "After School": ("Fritidsklubben", "After School", "🎨", 3, "#9B5DE5", "#E2D5FF", "#CBB6A0"),
    "Vacation": ("Feriestedet", "The Resort", "🏖️", 3, "#4FC3F7", "#E8F6FF", "#E8D5B5"),
    "Waterfront": ("Havnefronten", "The Waterfront", "⚓", 4, "#00BBF9", "#C7E6FF", "#9AA4BA"),
    "MagoMall": ("Indkøbscentret", "The Mall", "🛍️", 4, "#B388FF", "#F2F6FF", "#E8E2D6"),
    "Winter": ("Vinterbyen", "Winter Town", "⛷️", 4, "#BFE6FF", "#F2F9FF", "#D9D2C2"),
    "Arcade": ("Spillehallen", "The Arcade", "🕹️", 4, "#7C83FD", "#2B2340", "#3A3A55"),
    "FancyRestaurant": ("Finrestauranten", "The Fancy Restaurant", "🍽️", 5, "#7A1F3D", "#F8E6D2", "#8B5A3C"),
    "Dentist": ("Tandlægen", "The Dentist", "🦷", 3, "#9FD4FF", "#E8F6FF", "#E8E8E8"),
    "University": ("Universitetet", "The University", "🎓", 5, "#2B3A6E", "#E6DCC8", "#A9764C"),
    "HighSchool": ("Gymnasiet", "High School", "📚", 5, "#FF8A3C", "#FFF0D6", "#C9A27A"),
    "MovieStudio": ("Filmstudiet", "The Movie Studio", "🎬", 6, "#3A3A55", "#C9C3D9", "#5B5B7A"),
    "PomPomEmporium": ("Pomponbutikken", "The Pom Pom Emporium", "🧶", 5, "#F15BB5", "#FFE0EC", "#E8C69A"),
    "AmusementPark": ("Forlystelsesparken", "The Amusement Park", "🎡", 6, "#FFB347", "#CDEBFF", "#E8D5B5"),
    "WaterPark": ("Badelandet", "The Water Park", "💦", 6, "#00E5FF", "#C7F5FF", "#B9E4F2"),
    "OutdoorPool": ("Friluftsbadet", "The Outdoor Pool", "🏊", 5, "#4FB3FF", "#CDEBFF", "#E8D5B5"),
    "HauntedHouse": ("Spøgelseshuset", "The Haunted House", "👻", 6, "#5D4E7A", "#3B3355", "#4A3F5E"),
    "TreeHouse": ("Træhuset", "The Tree House", "🌳", 4, "#5A9E5F", "#E8F6D0", "#A9764C"),
    "IceSkating": ("Skøjtehallen", "The Ice Rink", "⛸️", 5, "#9FD4FF", "#E8F6FF", "#DFF3FF"),
    "Wildlife": ("Naturen", "Wildlife", "🦌", 4, "#4FB05F", "#CDEBFF", "#9BD7A0"),
    "HarvestFestival": ("Høstfesten", "Harvest Festival", "🎃", 5, "#FF8A3C", "#FFE9C7", "#C98B55"),
    "AllStarStadium": ("Stadionet", "The Stadium", "🏟️", 6, "#6BCB77", "#CDEBFF", "#9BD7A0"),
    "CentralStation": ("Banegården", "Central Station", "🚉", 5, "#7A849E", "#E8EEF6", "#9AA4BA"),
    "MusicFestival": ("Musikfestivalen", "The Music Festival", "🎵", 6, "#F15BB5", "#2B2340", "#5B5B7A"),
    "PetAdoptionCenter": ("Dyrenes hjem", "Pet Adoption Centre", "🐶", 5, "#C98B55", "#FFF0D6", "#E8C69A"),
    "Stable": ("Stalden", "The Stable", "🐴", 3, "#A9764C", "#F2E3CF", "#8B5A3C"),
}
# places: name in the game -> (Danish, English)
PLACES = {
    "Store": ("Butikken", "Store"),
    "Restaurant": ("Restauranten", "Restaurant"),
    "PoliceStation": ("Politistationen", "Police Station"),
    "Park": ("Parken", "Park"),
    "HavannasRoom": ("Havannas værelse", "Havanna's Room"),
    "FamilyHome": ("Familiehjemmet", "Family Home"),
    "HairSalon": ("Frisørsalonen", "Hair Salon"),
    "LoftApartment": ("Loftlejligheden", "Loft Apartment"),
    "FoodCourt": ("Madcentret", "Food Court"),
    "Theatre": ("Teatret", "Theatre"),
    "Tailor": ("Skrædderen", "Tailor"),
    "MallWithElectronics": ("Elektronikcentret", "Electronics Mall"),
    "WorldPostOffice": ("Posthuset", "Post Office"),
    "AdultsWard": ("Voksenafdelingen", "Adults' Ward"),
    "Basement": ("Kælderen", "Basement"),
    "Entrance": ("Indgangen", "Entrance"),
    "KidsWard": ("Børneafdelingen", "Kids' Ward"),
    "Treatment": ("Behandlingen", "Treatment"),
    "Apartment": ("Lejligheden", "Apartment"),
    "Bank": ("Banken", "Bank"),
    "Courthouse": ("Retsbygningen", "Courthouse"),
    "Daycare": ("Vuggestuen", "Daycare"),
    "RooftopCafe": ("Tagcaféen", "Rooftop Café"),
    "Workplace": ("Arbejdspladsen", "Workplace"),
    "AgilityPark": ("Agilitybanen", "Agility Park"),
    "Bungalow": ("Bungalowen", "Bungalow"),
    "PetHotel": ("Dyrehotellet", "Pet Hotel"),
    "PetShop": ("Dyrebutikken", "Pet Shop"),
    "Veterinary": ("Dyrlægen", "Veterinary"),
    "ArtWorkshop": ("Kunstværkstedet", "Art Workshop"),
    "DanceStudio": ("Dansestudiet", "Dance Studio"),
    "RooftopSports": ("Tagsportspladsen", "Rooftop Sports"),
    "Skatepark": ("Skateparken", "Skate Park"),
    "ApartmentBlockBottomFloor": ("Etagehuset, stuen", "Apartment Block, Ground Floor"),
    "ApartmentBlockTopFloor": ("Etagehuset, toppen", "Apartment Block, Top Floor"),
    "InteriorDesignStore": ("Indretningsbutikken", "Interior Design Store"),
    "RobotCafe": ("Robotcaféen", "Robot Café"),
    "MountainCabin": ("Bjerghytten", "Mountain Cabin"),
    "Piste": ("Skibakken", "Ski Slope"),
    "SkiLodge": ("Skihytten", "Ski Lodge"),
    "Onsen": ("Varm kilde", "Onsen"),
    "FishingBoat": ("Fiskerbåden", "Fishing Boat"),
    "Aquarium": ("Akvariet", "Aquarium"),
    "SeafoodRestaurant": ("Fiskerestauranten", "Seafood Restaurant"),
    "CloudVillage": ("Skylandsbyen", "Cloud Village"),
    "SpaceWorld": ("Rumverdenen", "Space World"),
    "UnderwaterLand": ("Undervandslandet", "Underwater Land"),
    "OutdoorPool": ("Friluftsbadet", "Outdoor Pool"),
    "HH_GroundFloor": ("Stueetagen", "Ground Floor"),
    "HH_Attic": ("Loftet", "Attic"),
    "TreeHouse": ("Træhuset", "Tree House"),
    "IceSkatingRink": ("Skøjtebanen", "Ice Rink"),
    "IceSkatingApartment": ("Skøjtelejligheden", "Skating Apartment"),
    "Dentist": ("Tandlægen", "Dentist"),
    "MagoMallGroundLevel": ("Centret, stuen", "Mall, Ground Level"),
    "MagoMallFashionLevel": ("Centret, mode", "Mall, Fashion Level"),
    "MagoMallRooftopGarden": ("Centret, tagen", "Mall, Rooftop Garden"),
    "Wildlife": ("Naturen", "Wildlife"),
    "CampusPark": ("Campusparken", "Campus Park"),
    "Dormitory": ("Kollegiet", "Dormitory"),
    "LectureHall": ("Auditoriet", "Lecture Hall"),
    "HarvestFestival": ("Høstfesten", "Harvest Festival"),
    "IndoorMovieStudio": ("Indendørs studie", "Indoor Studio"),
    "RooftopMovieSet": ("Tagfilmsættet", "Rooftop Set"),
    "StudioEntrance": ("Studieindgangen", "Studio Entrance"),
    "DiningRoom": ("Spisesalen", "Dining Room"),
    "Kitchen": ("Køkkenet", "Kitchen"),
    "Arcade": ("Spillehallen", "Arcade"),
    "BubbleBerryBay": ("Bærbugten", "Bubble Berry Bay"),
    "MysticalLagoon": ("Lagunen", "Mystical Lagoon"),
    "FitnessClub": ("Fitnesscentret", "Fitness Club"),
    "BunBakery": ("Bollebageriet", "Bun Bakery"),
    "PomPomEmporiumFloor1": ("Pomponbutikken, 1. sal", "Emporium, Floor 1"),
    "PomPomEmporiumFloor2": ("Pomponbutikken, 2. sal", "Emporium, Floor 2"),
    "AllStarStadiumEntrance": ("Stadionindgangen", "Stadium Entrance"),
    "AllStarStadiumField": ("Stadionbanen", "Stadium Field"),
    "StationHall": ("Stationshallen", "Station Hall"),
    "TrainPlatform": ("Perronen", "Train Platform"),
    "FestivalStage": ("Festivalscenen", "Festival Stage"),
    "FestivalEntrance": ("Festivalindgangen", "Festival Entrance"),
    "HighSchoolFloor1": ("Gymnasiet, 1. sal", "High School, Floor 1"),
    "HighSchoolFloor2": ("Gymnasiet, 2. sal", "High School, Floor 2"),
    "HighSchoolFloor3": ("Gymnasiet, 3. sal", "High School, Floor 3"),
    "PetAdoptionCenterFloor1": ("Dyrenes hjem, 1. sal", "Adoption Centre, Floor 1"),
    "PetAdoptionCenterFloor2": ("Dyrenes hjem, 2. sal", "Adoption Centre, Floor 2"),
    "MessHall": ("Kantinen", "Mess Hall"),
    "Playground": ("Legepladsen", "Playground"),
    "Classroom": ("Klasseværelset", "Classroom"),
    "YouthClub": ("Ungdomsklubben", "Youth Club"),
    "SchoolHouse": ("Skolebygningen", "School House"),
    "FarmField": ("Marken", "Farm Field"),
    "FarmHouse": ("Gårdhuset", "Farm House"),
    "Barn": ("Laden", "Barn"),
    "FarmStore": ("Gårdbutikken", "Farm Store"),
    "Hotel_GroundFloor": ("Hotellet, stuen", "Hotel, Ground Floor"),
    "Hotel_FirstFloor": ("Hotellet, 1. sal", "Hotel, First Floor"),
    "Hotel_SecondFloor": ("Hotellet, 2. sal", "Hotel, Second Floor"),
    "Hotel_ThirdFloor": ("Hotellet, 3. sal", "Hotel, Third Floor"),
    "Sightseeing": ("Udsigtspunktet", "Sightseeing"),
    "Airport": ("Lufthavnen", "Airport"),
    "Beach": ("Stranden", "Beach"),
    "StableStorage": ("Staldlageret", "Stable Storage"),
    "Arena": ("Ridebanen", "Arena"),
    "Forest": ("Skoven", "Forest"),
    "Stalls": ("Boksene", "Stalls"),
    "GlobeMap": ("Globussen", "Globe"),
}
SKIP_WORLDS = {"_root", "HomeDesigner", "CrumpetJunkyard", "CreatorTools", "GuestCharacterStorage"}
SKIP_PLACES = {"WorldStorage", "VacationStorage", "StableStorage", "GlobeMap", "Empty", "UnityShop"}

# what a surface or a thing is called in the original -> one of our shapes
BY_NAME = [
    (r"sofa|couch", "sofa"),
    (r"armchair", "armchair"),
    (r"bench", "bench"),
    (r"chair|seat|stool", "chair"),
    (r"bed|crib|cot", "bed"),
    (r"desk", "desk"),
    (r"table|picnic", "table"),
    (r"counter|bar\b|checkout|cashier|reception|kitchen|island|stove|oven", "counter"),
    (r"fridge|freezer|cooler|vending", "fridge"),
    (r"wardrobe|closet|locker|cabinet|cupboard|drawer|dresser", "cabinet"),
    (r"bookshelf|library|bookcase", "bookcase"),
    (r"shelf|shelves|rack|stand|display|containershelf|bread", "shopshelf"),
    (r"tv|screen|monitor", "tv"),
    (r"piano|keyboard", "piano"),
    (r"plant|tree|bush|hedge|flower", "plant"),
    (r"lamp|light", "floorlamp"),
    (r"trash|bin", "trash"),
    (r"cart|trolley", "cart"),
    (r"tub|bath", "bathtub"),
    (r"toilet", "toilet"),
    (r"sink|basin", "sink"),
    (r"rug|carpet|mat\b", "rug"),
    (r"pool|pond|fountain", "fountain"),
    (r"tent", "tent"),
    (r"fire", "fireplace"),
    (r"sign|poster|picture|frame", "frame"),
]
FLOORISH = re.compile(r"floor|ground|terrace|platform|deck|grass|road|street|carpet|stage|ceiling|roof|wall", re.I)


def shape_of(name: str, w: float, levels: int, wall: bool) -> str:
    low = name.lower()
    for rx, shape in BY_NAME:
        if re.search(rx, low):
            if shape == "shopshelf" and wall and levels < 3:
                return "wallshelf"
            if shape == "shopshelf" and levels < 3:
                return "shelfunit" if w < 3.5 else "display"
            if shape in ("chair",) and w > 3:
                return "bench"
            return shape
    if wall:
        return "wallshelf"
    return "chair" if w < 1.8 else "table" if w < 3.4 else "counter"


def main() -> int:
    out = Path(sys.argv[1])
    data = json.loads(Path("game_data/locations.json").read_text(encoding="utf-8"))
    worlds_in = json.loads(Path("game_data/worlds.json").read_text(encoding="utf-8"))
    locs: dict[str, dict] = {}
    for loc, rec in data.items():
        if rec["world"] in SKIP_WORLDS or loc in SKIP_PLACES or rec["world"] not in WORLDS:
            continue
        things = [
            t for t in rec["things"] if (t["w"] > 0.35 and "Surface" in "".join(t["kinds"])) or t["kinds"] == ["Trash"]
        ]
        floors = sorted(
            (t for t in things if FLOORISH.search(t["name"]) or (t["w"] >= 9 and t["h"] >= 0.6)), key=lambda t: -t["w"]
        )
        if not things or not floors:
            continue
        main_floor = floors[0]
        floor_top = main_floor["y"] + main_floor["h"] / 2
        bands = [(f["y"], f["x"] - f["w"] / 2, f["x"] + f["w"] / 2) for f in floors if f["w"] >= 5]
        rest = [t for t in things if t not in floors and t["w"] <= 14]
        # stacks: surfaces over one another (the shelves of one unit) are one thing
        stacks: dict[tuple[int, int], list[dict]] = collections.defaultdict(list)
        for t in rest:
            stacks[(round(t["x"] / 0.9), round(t["w"] / 0.9))].append(t)
        min(t["x"] - t["w"] / 2 for t in rest) if rest else main_floor["x"] - 6
        items = []
        for group in stacks.values():
            ys = sorted(g["y"] for g in group)
            elevation = ys[0] - floor_top  # how high the lowest surface is above the floor
            base = max((b[0] for b in bands if b[0] <= ys[0] + 0.4), default=None)
            wall = elevation > 3.0 and base is None
            name = collections.Counter(g["name"].split(" (")[0] for g in group).most_common(1)[0][0]
            w = max(g["w"] for g in group)
            x = sum(g["x"] for g in group) / len(group)
            shape = shape_of(name, w, len(group), wall)
            if wall:
                y_px = round(FLOOR_PX - 40 - min(250, elevation * K * 0.45))
                px_h = 40
            else:
                if base is None:
                    base = min(ys[0], floor_top)
                height = max(0.8, ys[-1] - base + 0.3)
                y_px = round(FLOOR_PX + 56 + max(0, (floor_top - base)) * K * 0.8)
                px_h = height * K
            y_px = max(150, min(615, y_px)) if wall else max(500, min(615, y_px))
            items.append(
                {
                    "shape": shape,
                    "x": x,
                    "y": y_px,
                    "uw": round(w * 100),
                    "uh": round(px_h / K * 100),
                    "wall": wall,
                    "levels": len(group),
                }
            )
        if not items:
            continue
        xs = sorted(i["x"] for i in items)
        left = xs[0] - 3
        width = max(1000, min(MAXW, round(((xs[-1] - left) * K + 260) / 100) * 100))
        world = rec["world"]
        locs[loc] = {
            "world": world,
            "n": PLACES.get(loc, (re.sub(r"(?<=[a-z])(?=[A-Z])", " ", loc),) * 2)[0],
            "en": PLACES.get(loc, (loc, re.sub(r"(?<=[a-z])(?=[A-Z])", " ", loc)))[1],
            "w": width,
            "things": [
                [
                    i["shape"],
                    round(70 + (i["x"] - left) * K),
                    i["y"],
                    i["uw"],
                    i["uh"],
                    1 if i["wall"] else 0,
                    i["levels"],
                ]
                for i in sorted(items, key=lambda i: (i["wall"], i["y"]))
            ],
        }
    ordered = collections.OrderedDict()
    for w in WORLDS:
        ls = [loc for loc in worlds_in.get(w, []) if loc in locs]
        if ls:
            ordered[w] = ls
    worlds = [
        {
            "id": w,
            "n": WORLDS[w][0],
            "en": WORLDS[w][1],
            "em": WORLDS[w][2],
            "lvl": WORLDS[w][3],
            "col": WORLDS[w][4],
            "wall": WORLDS[w][5],
            "floor": WORLDS[w][6],
            "places": ls,
        }
        for w, ls in ordered.items()
    ]
    js = (
        "/* Hverdagsro - the places of the worlds, laid out like the original's (generated by tools/homedesigner/build_places.py).\n"
        "   WORLDS: the worlds (towns) and their places. PLACES: id -> { n, en, w (width in px), things } where a thing is\n"
        "   [shape, x, y (px), width, height (1/100 of the original's units), on the wall (1), shelves it has]. */\n"
        f"export const WORLDS = {json.dumps(worlds, ensure_ascii=False, separators=(',', ':'))};\n"
        f"export const PLACES = {json.dumps(dict(locs.items()), ensure_ascii=False, separators=(',', ':'))};\n"
    )
    out.write_text(js, encoding="utf-8")
    print(
        "worlds",
        len(worlds),
        "places",
        len(locs),
        "things",
        sum(len(v["things"]) for v in locs.values()),
        len(js) // 1024,
        "KB",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
