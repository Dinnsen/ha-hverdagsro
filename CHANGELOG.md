# Changelog

All notable changes to Hverdagsro. The version is the one in `custom_components/hverdagsro/pack.json`.

## [0.23.0] - 2026-10-29

### Added
- **Indstillinger › Spillet:** the grown-ups decide what the room game may do to the real house: whether a child controls the real light of their own room from the game, whether the game shows that the real tv and speakers play, which children may control their own light, and exactly which lights the game may control. The game's shop (unlock, prices, locks, coins) opens from there too.

### Changed
- **Everybody can switch the light in every room of the game.** Only the lights in the children's rooms are real, and only the child can control their own: in the child's own room the switch works the real lights (if the grown-ups allow it); in every other room (a sibling's room, the rooms of the house, the places of the world) it switches the game's own light and the real lights are only shown. (0.21.0 had taken the switch away from those rooms.)

## [0.22.0] - 2026-10-28

### Added
- **Seven new towns in the world, under a new map page, Byerne:** Hjemmebyen, Børnebyen, Årstidsbyen, Strandbyen, Handelsbyen, Slotsbyen and Neonbyen. Each town opens at its own level and has a place for every theme pack, so there are 47 new places to visit. A place is a long room that scrolls, furnished from its pack: the furniture along the walls, things on the shelves, tables and counters, and pictures, curtains and lamps up.
- **47 theme packs with 2,284 new things** for the shop, from the family home, the nursery and the cabin to the supermarket, the bakery, the manor and the neon studio. Every thing has a Danish and an English name, its own colours and a price from the level of its pack. They are all our own drawings, made from about seventy shapes in `hv-proto.js` (a bed, a sofa, a bookcase, a fridge, a lamp …); the names and colours are in `hv-packs4-data.js`, made by `tools/homedesigner/build_packs.py`. No characters or brands from films, shows or games.
- **Things that open and work:** fridges, cupboards, wardrobes, chests and chests of drawers open when tapped, show their shelves, and keep what you put inside them out of sight when they are shut. Stoves can be turned on (flames, and a pot on a burning stove bubbles), the cooker hood turns its fan, baths fill, showers run, taps and toilets have their scenes, and the tvs and screens have channels.
- **Free things for the rooms of the house:** 50 everyday things (bookcases, open shelves, cube shelves, wall shelves, vases, books, cups, plants, pictures, clocks, baskets, a fridge, a stove, a hood, a chest …) are free for everybody.

### Changed
- **Every room of the house is fuller:** bookcases and open shelves with things on them, shelves on the wall, a fridge and a cupboard with things inside, pictures, a clock, a plant, a basket. What the family has put in a room in Husbyggeren stays where it is; the rest is added around it.
- A place of the world can be a wide room that scrolls (`width` on the place), like the rooms of the house.
- `hv-fixtures.js` can be told about more things that open or work (`registerFx`), and things have shelves inside while they are open.

## [0.21.0] - 2026-10-28

### Added
- **Grown-ups run the room game** (the 🔑 *Forældre* button in the shop, for grown-ups only): unlock a pack or a place for a child (or take it away again), unlock everything at once, give or take coins, move a child a level up or down. **Prices:** one setting for all prices in per cent (0 % is free), a price per pack (per thing) and per place. **Locks:** lock a pack or a place, and a child cannot buy it until a grown-up opens it (the server checks it too). Everything is kept by Home Assistant (`hverdagsro/game_admin`), so every device sees it.
- **The real tv and speakers of the house show that they play:** in the rooms of the house, the tv and the speakers of the game are on when the real ones play (with the title over them), and off when they do not. They cannot be switched from the game: tapping one says that it is the real one.

### Changed
- **The real lights can only be switched from the child's own room.** In a sibling's room and in the rooms of the house the game shows how the lights are, but there is no switch.
- Text next to a picture (a price beside its coin) now updates when the page is drawn again; before, only the pictures did.

## [0.20.0] - 2026-10-28

### Added
- **Carrying with two hands:** a big thing you pick up (a giant toothbrush, a guitar, a ball, a teddy, a photo booth …) is held in front of you with both arms and both hands, not in one hand. Small things stay in the right hand.
- **The hair dye machine** (in the hair salon): pick any hair colour of the original and see it on your figure. **The haircut machine:** step through every hairstyle, pick short, long or crazy hair, a bald head, or a beard.
- **Toothbrushes:** a toothbrush and a giant toothbrush (a free home thing); tap one and your figure brushes its teeth with foam, bubbles and a happy face.
- **The photo booth** (in the fashion store and the wedding venue): four pictures in a row with a count-down and a flash, shown as a photo strip and kept in the album of the mirror.
- **The other players see your expressions and dances:** what your figure is doing (laughing, sad, kissing, a dance) goes live to the others who are playing, and they see your clothes and face too (the server dropped every number of a figure before; it now keeps them).

## [0.19.0] - 2026-10-28

### Added
- **Swing and jump.** Tap a swing (the swing set, the garden swing) and your figure sits on it and swings with the ropes; tap a trampoline and your figure stands on the mat and jumps, and the mat gives under the landing. Tap again, or tap the figure, to get off. `hv-ride.js`.
- **The floors of a house are easy to find:** a lift button (🛗 *Etager*) in the toolbar of every house with more than one floor shows all the floors and where you are; the first time you walk into such a house you are told, and the map of the towns shows how many floors each building has.
- **Round the buildings, much more detail** (`hv-scenery.js`). The outdoor stretches of the packs are no longer a plain garden: every pack gets what the original's scene has round it, found by reading the original's scenes (`tools/homedesigner/extract_scenery.py`): a pool with palms, a roofed patio and loungers (pool villa, hotel); a spa pool with bubbles and steam; a beach with sea, sailboats, parasols and a porch; a café terrace with an awning, string lights and tables; a bakery garden with picket fence, vegetable beds and a rose trellis; a lotus pond with an arched bridge, bamboo and stone lanterns; a cottage garden with a stone gate with ivy, a tiered fountain and a waterfall; a city park with an iron gate, a winding path, a duck pond and lamps; an activity park with a great tree with a swing, a slide, flags and a city hanging upside down in the sky; a supermarket yard with a loading dock, a truck and crates; a rooftop with chimneys, a water tank, planters and string lights; a campsite with pines, a campfire, a tent and a saucer with its beam; a porch with rocking chairs and a mailbox; a manor with clipped hedges, topiary and columns; and a city balcony with the lit skyline and neon signs.

### Changed
- **The buildings of Byerne are much richer** (`hv-buildings.js`): each building is as tall as the original's house has floors, has a roof of its kind (gable, hip, flat with a stair house and air-conditioners), ledges between the floors, balconies, a porch with posts, an awning with stripes, chimneys with smoke, wings on the manors, and stands in a lot with what its pack has round it (a pool and palms, a pier, a terrace, a fence and beds, a lotus pond, a gate, a swing in a tree, tents and a fire, a loading dock with a truck).
- **The washing machine and the tumble dryer turn round their own centre.** The drums, the cooker hood fan and the microwave plate now rotate with SMIL about their centre, the same in every browser.
- **The curtains of the house work:** the curtains at the windows of your house draw across the window and are the real curtains of the room (the cover of the area in Home Assistant) when there is one.

## [0.18.0] - 2026-10-28

### Added
- **The avatars of the original.** The whole catalog of the character creator is in the game now, drawn with our own shapes: **548 hair styles and beards** (short, long, crazy, beards), **1,552 pieces of clothes** (dresses, sweaters, jackets, suits, swimwear, pyjamas, towels, uniforms, costumes, winter clothes … with colours and patterns: stripes, dots, plaid, flowers, camo, stars, hearts, rainbow, leopard, zebra), **647 hats**, **664 pairs of glasses and masks**, **193 ear accessories**, the parts of the face (284 eyes, 525 brows, 544 noses, 567 mouths, 233 cheeks, 127 freckles, 83 wrinkles, 12 scars) and **259 colours**. Made by `tools/homedesigner/extract_avatars.py` and `build_avatars.py`; brands, licensed characters and real people are left out.
- **544 premade figures and 761 pets** live in the places of their worlds (the hospital, the school, the farm, the stable, the mall …), as the original has them: they talk, and the pets make their sound. Their skin and hair colours are not in the original in a readable form, so they are picked from the palettes by name; the species and colour of a pet come from its name. In every place a few pets are out, and which ones changes from day to day.
- **The figure workshop** has the wardrobe of the original: pick hair, beard, clothes, hats, glasses and masks, ear accessories and the parts of the face from pages of little pictures, sorted by kind; choose colours; and a button for a random look.
- **32 expressions:** tap the head of your figure for the menu: neutral, happy, surprised, sleepy, sick, angry, furious, sad, sobbing, screaming, laughing, celebrating, super excited, confused, creepy, dead, kiss, naughty kiss, heart eyes, heartbroken, flushed, freezing, hot and tired, smug, evil smirk, grimace, pleading, rolling eyes, yummy, oops, wink.
- **Six dances** (dance 1, 2, 3, the prom dance and two pool yoga dances) from the same menu, and when a radio or a speaker plays, the people in the room dance to it.
- **Talking:** a figure moves its mouth when it speaks; **eating** makes a yummy face; **the mirror** lets you change your hair, colour, clothes, hat and face and **take pictures** that you keep.

## [0.17.0] - 2026-10-28

### Changed
- **Things are the right size.** Every thing is now sized from the original's own drawings (the bounding boxes of the meshes it is made of), measured against the furniture of the game: 38.3 pixels to a unit. A cup, a vase, a bowl and a candle are a third smaller than before and no longer look as big as the furniture beside them; furniture stays close to its shape.
- **4,575 things in the packs, up from 2,284.** The Danish dictionary of `tools/homedesigner` now covers about 5,000 names (food, animals, tools, plants, shops, toys), so far fewer are left out. Things with a proper noun or a brand are still left out.
- **396 things open (up from 51):** a thing that has doors or drawers and room inside it in the original opens here too, with the shelves of the original inside it. Open storage (a basket, a bowl, a box) can hold things, and a thing with a light in the original can be lit.
- Decorations on the floor and the wall (stains, cracks, calendars) are drawn as what they are, and a thing with no matching shape is no longer drawn as a cupboard.
- **Rooms make sense.** The places of the towns are laid out by what each one is for (`hv-layout.js`): a kitchen is a row of units with the fridge, the sink and the stove with the cooker hood over it, and a dining table with chairs in front; a bedroom has the bed between its two bedside tables, a wardrobe and a picture over the bed; a living room has a sofa with a coffee table and a rug, and the tv on a cabinet; a shop has rows of shelves with a counter in front. The little things on a shelf or a counter fit it (kitchen things on the kitchen units, books and plants on the shelves, toys on the children's), and what is inside a fridge or a cupboard is out of sight until it is opened.
- **Every building in a town is its own:** a cottage, a tall house, a shop with an awning, a mall, a tower, a manor with wings, a villa with a pool, a cabin among pines, a market pavilion, a park, a haunted house, a camper van. Which one is by what the place is.
- **The old things open and work too:** the fridge, the mini fridge, the wardrobe, the medicine cabinet, the shoe rack, the feed cupboard and the bedside table open (with shelves inside), and the bake ovens light up.
- **The worlds of the original, as towns:** Byerne now starts with 34 towns (Byen, Storbyen, Skolen, Kvarteret, Gården, Hospitalet, Kontorbyen, Feriestedet, Havnefronten, Indkøbscentret, Vinterbyen, Forlystelsesparken …) and 104 places in them (a bakery, a hospital ward, a school, a farm, a mall, a ski lodge …). Each place is laid out like the original's: the same furniture in the same order, as wide, and with the shelves where the original has them. The furniture is drawn with our own shapes at the sizes of the original and dressed with little things; the towns of the theme packs come after them. Made by `tools/homedesigner/extract_locations.py` and `build_places.py`.
- **Doors, windows, curtains and lights where the original has them,** and the two ends of each place are the two ends of the original's scene, so the places are as long. The furniture is spread over the whole depth of the floor. The houses and shops of the theme packs get the same: a door at each end, windows with curtains, lamps on the wall.
- **Curtains you can pull:** the curtains at the windows (of the places of the worlds, of the theme-pack houses and the ones in the shop) are things now: tap one and it is drawn across the window; tap it again and it opens.
- **The real world outside every window:** the windows of all the new places show the real sky of the hour and the real weather (rain or snow falls in front of it), the places are dark at night, and the map of the towns has the real sky, a night with stars, and rain or snow. The holiday decorations of the places apply as before.
- **More detail in every drawing:** every solid shape has a light edge on top and a soft shade underneath, and round shapes have a glint.
- **The house:** up to 26 of the family's own pieces of furniture from Husbyggeren come into the game (it was 16), and the fridge, wardrobes and bedside tables of the house open.

### Floors
- **Every house has the floors of the original's.** A house of the theme packs is no longer one long room: it has as many floors as the original's (the family home three, the manor four, the flat five, the hotel three, the star house four), and each floor is a row of rooms as wide as in the original: a living room, a kitchen, bedrooms, a bath, a hall, and a garden or a balcony outside, with a doorway in the wall between the rooms and a glass door out to the garden. 50 buildings, 81 floors, 354 rooms (`hv-floors-data.js`, made from the shells of the original by `tools/homedesigner/extract_shells.py` and `build_floors.py`). The packs that have no house of their own in the original are built on the shell of one that is alike, turned the other way round; the local shop pack has its two other houses (Ahornalléen, Næbgaden) and the starter pack its big house as places of their own.
- **The lift,** as in the original: every floor has a lift, in the hall between the rooms, that takes you to the other floors (a sheet asks which one); the van has a door in and out. You step out of the lift of the floor you chose.
- **The rooms are furnished by what they are for:** the biggest room of the ground floor is the living room, then the kitchen and the dining room; the floors above have bedrooms (a bed, a wardrobe, bedside tables where there is room), the bath, a children's room, a study; a hotel has rooms with a bed and a tv, a shop floor has shelves and a counter. The pack's own furniture is used first, then plain furniture in the pack's colours if it has none. Every kind of room has its own walls and floor (tiles in the kitchen and the bath, stripes in a bedroom, dots for the children), and a garden or a balcony has its own sky, the real weather, a fence or a railing.
- Places are up to twice as long (4,800 units), and a person on any floor of a building shows at that building on the map.

### Fixed
- **The pet:** tapping the pet while it was running after the ball was taken for a drag, so its menu did not open (and a tap on the pet where something was hidden found the hidden thing instead). The pet cannot be grabbed while it fetches the ball; a tap in the meantime opens its menu as soon as it is back, and a tap on a person or a pet is no longer taken for a search of the place.

## [0.16.0] - 2026-10-28

### Added
- **Husbygger, locks:** lock any element (room, wall, area, thing) so it cannot be moved, one at a time from its panel, or in one go: the drawing (rooms, walls, doors, windows), the outdoors (areas, hedges, fences, trees, bushes) or everything else (furniture, lamps, devices). A padlock shows what is locked. "Gem og luk" saves and closes.
- **Huset, zoom:** pinch with two fingers, scroll, or use the buttons to zoom the plan, and drag to move around in it.
- **The room pages:** the appliances in the room are shown as the living tiles of the Apparater page; the rest of the room's things are tiles instead of rows. In "Tilpas rummet", tick exactly which things are on the page, search Home Assistant to add more, and place each lamp in the picture by tapping where it goes.

### Changed
- The builder's palette on a phone is a grid instead of a long list.
- The curtains in the game are only play: they no longer open or close the real curtains.
- The layer buttons on the Huset page are icon chips; the "Redigér huset" button is gone (the builder is under Mere and in the settings).

## [0.15.0] - 2026-10-28

### Added
- **The art pack, part two:** the figure's parts (108: every hairstyle, top, bottom, shoes, face, hat, thing to carry, mouth and mood), the 104 characters of the world, the three pets and 45 backdrops (the rooms of the house by kind, the places of the world, the child's own rooms) are in the pack too, each as an SVG file in the figure's or the room's own frame. A redrawn file is used in the game in place of the drawing. The figure's parts and the backdrops are off in `pack.json` until they are redrawn, since a part from a file keeps the file's colours.

## [0.14.0] - 2026-10-28

### Added
- **The living house:** the grown-ups are in the living room and the kitchen only when they are really at home (their person in Home Assistant). Every room of the house has its real lights: the room is dark at night until the real light is on, and the switch in the room turns it on. The tv in a room shows what really plays on the tv there (from Husbyggeren's tv with its media player), with the title over it. When it rains or snows outside, it rains or snows on the windows.

### Changed
- **More detail in every room:** a cornice, a pendant lamp with its glow, curtains, a picture on the wall, a rug, the planks of the floor and the skirting board, and a soft shadow under every thing.

## [0.13.0] - 2026-10-28

### Added
- **The art pack:** every thing in the game (508) exported as an SVG file in `art/`, one per thing, with a manifest and an overview page, so an illustrator can redraw them. Put the folder in Home Assistant as `config/www/hverdagsro-art/`, and the game draws from the files instead of its own drawings; things without a file are drawn as before. `node tools/art-export.mjs` makes the pack again.

## [0.12.0] - 2026-10-28

### Changed
- **The house is one long row of rooms**, like a doll's house seen from the front: the rooms stand side by side in the order you would walk through them, with the garden at the end. The rooms next door are already there to the left and the right; walk out at the end of one and you are in the next, without a jump. No more doors in the back wall.
- **Walking:** hold an arrow key (or W A S D) and the figure keeps walking, with its legs swinging; drag it and it walks too, turning the way it goes.
- **The picture is not redrawn** every time you do something: only what changed is swapped, so the tv, the water, the window and the rest keep running.
- **The bath:** you sit in it, awake and happy, with the water on, instead of falling asleep in it.
- **Hair** now covers the whole head on every hairstyle.

## [0.12.0] - 2026-10-28

### Changed
- **The house is one long row of rooms**, like a doll's house seen from the front: the rooms stand side by side in the order you would walk through them, with the garden at the end. The rooms next door are already there to the left and the right; walk out at the end of one and you are in the next, without a jump. No more doors in the back wall.
- **Walking:** hold an arrow key (or W A S D) and the figure keeps walking, with its legs swinging; drag it and it walks too, turning the way it goes.
- **The picture is not redrawn** every time you do something: only what changed is swapped, so the tv, the water, the window and the rest keep running.
- **The bath:** you sit in it, awake and happy, with the water on, instead of falling asleep in it.
- **Hair** now covers the whole head on every hairstyle.

## [0.11.0] - 2026-10-27

### Added
- **Walk through the house:** the rooms of the house are as wide as they really are, and the picture scrolls along when the figure walks or when the room is dragged sideways. Rooms that share a wall have doors: at the ends of the room for the rooms beside it, and in the back wall for the rest. Walk out at the end, or tap a door, and you are in the next room, by its door.
- **The arrow keys** (or W A S D) walk the figure left and right and up and down in the room, and through the doors. In Byg they move the chosen thing.
- **The pet:** tap it for treats, ball play, cuddles and tricks (sit, paw, roll over, jump, play dead). The pet's hearts of the day show in the menu.
- **More like a doll's house:** give food to a character and it is eaten; give them something else and they hold it (and you can take it back). Food in your own hand is eaten bite by bite. Tap your figure's head for a new face: happy, surprised, tongue out, cross or sad. The figure turns the way it walks.
- **The timetable and the routine list on the wall** of the child's own room, with a tick over what is done. Tap them to see them big; the routine cards can be ticked off there.
- **Tuck the bubbles away:** a little arrow folds the day's bubbles into one button with the number on it, and back.

### Changed
- **The house in Verden** is now the family's real house: a long, low L of dark brick under a slate roof, with the double garage, the front door, the wing at the back and the covered terrace by the garden. The house used when there is no floor plan follows the same drawings, and the outside walls of the 3D house are brick.
- **Full screen:** sheets and messages now show in full screen too.

## [0.10.0] - 2026-10-27

### Added
- **Verden and Huset:** the map now has three tabs: Verden (the whole world, with Centrum and the house in it), Centrum, and Huset. In Verden the house stands closed with its roof on; tap it, and Huset opens as a big doll's house in 3D perspective, drawn from the floor plan in Husbyggeren: floors with boards and tiles, the walls cut low at the front, the windows, the furniture, the terrace, the garden and the drive. Tap a room to go into it. A family without a floor plan gets a house laid out like a real family house, with the children's rooms given to the children.
- **Things on things:** put things on tables, desks, beds, sofas, kitchen counters and on the shelves of a bookcase or a wall shelf. They stay there and go along when the table or the shelf is moved, and fall to the floor when it is taken away.
- **Something in the hand:** drag a small thing onto your own figure to hold it. It goes along everywhere; tap it to use it (eat it, play it), or drag it out to put it down.
- **Things that work:** the tap runs, the toilet flushes, the bath and the new shower fill with water, the stove burns, the washing machine and the microwave run, the kettle and the coffee maker steam, and the tv, the game screens, the computer, the tablet and the phone have five channels (cartoons, the sea, football, music and space). With sounds.
- **Everybody looks their age:** the figures follow the birthday, automatically for the whole family. Small children are small with short legs, grown-ups are taller with longer legs and wear grown-up clothes until they dress themselves.

### Changed
- **Move things without Byg:** tap a thing to use it, drag it to move it. Byg is for new things and for changing them. The fixed things (the kitchen, the stove, the fridge, the toilet, the bath, the sink, the shower, the washing machine) stay where they are while playing.
- **The signs in Verden** sit right over their own building, with the name of the part of town, NEW or explored, and who is there. Today's gift is a bubble beside the house.
- **Full screen:** the pocket opens as a small tray in the corner of the game instead of a bar under it, and the family bar lies over the bottom of the game, so the game no longer grows or slides under the buttons.

## [0.9.0] - 2026-10-27

### Added
- **Everyday life in the game:** the play world and Hverdagsro's own days hang together.
  - **The characters ask for help** with the real tasks of the day: the cook with the kitchen, the neighbour with tidying, the café cat with the pets, the scout with the garden, the owl with homework. A red "!" shows who needs help, on the map too. When the task is really done, the child says "Done!" in the game, it is ticked off in Hverdagsro, and the character says thank you. Every five thank-yous bring a present.
  - **The grown-ups at home** show a "?" when they have a task of their own: the child can offer to help.
  - **The room mirrors the day:** a little mess on the floor while tidying waits, sparkles when it is done, and a plant on the window sill that grows with every good day of the week.
  - **Tonight's dinner** from the meal plan is on the wall of the house kitchen and the café. The children vote for next week's dinners in the game, and the grown-ups see the votes on the meal plan page.
  - **Homework becomes knowledge:** a book on the shelf for every piece of homework, stamps for every five in a subject, and things to discover (telescope, microscope, globe, crystal ball, blackboard).
  - **The routines are the game's day:** before the morning routine the child wakes in bed, every routine card done shows above the avatar, pyjamas in the evening, and a bedtime story by the moon (read aloud if the device can).
  - **The family's building site** in Centrum: everything real that anyone in the family does lays a brick (counted in Home Assistant), and together you build a playground, a tree house, a zoo, an observatory and more, with coins for the builders and a party.
  - **Help each other:** say you helped a sibling or a grown-up with their task; when they say yes, you both get coins.
  - **The postman brings the day:** a letter in the room with today's and tomorrow's plans, pickups, tonight's dinner and rain or snow tomorrow.
  - **When the game may be played** (per child, under Familieindstillinger › Børnene): always, after the morning routine, after homework, when today's tasks are done, or minutes earned for each thing done. The game shows what is missing, and the time left.

## [0.8.0] - 2026-10-27

### Added
- **Centrum, a whole new town to play in** (free from the start, on its own map: the bus at the town's bus stop goes there, the map has a tab for each town):
  - The café, the hair salon, the post office, the apartments with a rooftop terrace, Somersault Park, the square and the campsite.
  - Places to open with coins (yours for good): the hospital, the mall, the university, the pool villa and the big family house.
  - 33 new characters of our own: a barista and the café cat, a hair stylist and her poodle, the postman and a parcel robot, a DJ, skaters, a scout, doctors and nurses, a professor owl, a lifeguard, grandparents and more.
  - 43 new things for the town, in 12 new packs, among them café, post office, rooftop party, hospital, mall, university, pool villa, the big family, caravan, the cuddly bears, the neon rainbow apartment, and calm and care.
- **Figure workshop:** make up to eight figures of your own with hair, face, clothes and things to carry, name them, and put them into any place.
- **The pocket:** drag a character (or, in Build, a thing) onto the bag in the corner to take it with you, then take it out somewhere else. That's how stories move between places.
- **Secrets:** 34 hidden things across the world. A little glint sometimes shows where. Five of them are doors to secret rooms: the mermaid grotto, mushroom land, the treasure vault, the secret attic and the secret library.
- **A gift at the post office every Friday** (Friday to Sunday), with a season gift around the occasions.
- **The hair salon:** sit in the chair, or tap it, for a new hairstyle and hair colour.
- **Cooking:** tap the stove or the oven, pick up to three ingredients, and see what comes out (pizza, pancakes, cakes, smoothies, soup and a surprise dish).
- **Rooftop parties:** the music player plays four party songs of our own, with disco lights, and everyone dances.
- **Paint the rooms:** the walls and floors of the house's rooms and the indoor places can be painted in Build.
- **Children make challenges for each other:** a child gives a challenge to a sibling (or everyone), pays the coins from their own, and approves it themselves.
- **Style packs:** the bookworm look, the masquerade, sporty, and rain and glitter. 16 new things to wear, including a ball gown, a tulle skirt, a feather mask, light-up sneakers, roller skates and an umbrella.
- **Season decorations in the whole world** around Halloween, Christmas and the other occasions.

## [0.7.0] - 2026-10-27

### Added
- **Familieleg, the whole family plays together:** grown-ups and children in the same world at the same time.
  - **Today's family mission:** one small shared goal a day (wave to each other, visit places, talk to characters, meet up, build, hug, find stars). Everyone who helps gets coins when the family reaches it.
  - **Star hunt:** stars get hidden around the house for the players you choose. Each star found gives coins, and all of them found gives a party.
  - **Hide and seek:** hide a thing somewhere in the house, and the others look for it with warmer and colder hints. Both the finder and the hider get coins.
  - **Fun tasks from the grown-ups:** a small task, in real life or in the game, for one child or everyone. The child says done, a grown-up approves, and the coins come.
  - **Call the family:** everyone playing gets "come here!" with a button that takes them there.
  - **Hug and high five:** tap someone, then wave, hug or high five. A sibling who is playing sees it too.
  - A party with confetti and sounds when the family reaches a goal.
- **Your own furniture in the game:** the rooms of the house have the furniture the family put in with Husbyggeren, in the same order.
- **75 everyday things for the house**, free for everyone: kitchen, food, clothes, devices, bathroom, books and toys, storage, garden and little treasures. Fridges, wardrobes, bags and chests open and show what is inside, and books open.
- **Sit in vehicles and on more furniture:** cars, tractor, bike, canoe, sledge, plane, armchairs, rocking chair, garden swing and more.
- **The map shows where you have been:** a tick on explored places and "NY" on places that are open but not visited yet.
- **More to wear:** glasses and masks on the face as well as a hat, and something to carry (bag, backpack, necklace, medal, teddy). Outfits can be named.
- **My stories:** keep a game as a story and play it again another day.
- **Everything saves by itself:** a moment after each change, at once when the app is hidden or closed, and again later if Home Assistant could not be reached. The game opens where the child left off, on any device, including the map, the outfit and the sound choice.

### Fixed
- Tapping your own avatar could stop it waving (an error in 0.6.0).
- A sibling who waved once kept jumping.

## [0.6.0] - 2026-10-27

### Added
- **The map is a little town:** a bright isometric town in the style of a toy world, with streets, zebra crossings, cars, a bus stop, trees and lamp posts. The family's house sits in the middle as a doll's house drawn from its floor plan in Husbyggeren, with low walls so you can look into every room. Each area has its own buildings, the shop has its own house, and the daily gift waits on the map.
- **38 new theme packs (58 in all) with 168 new things:** fire station, air rescue, builders, mountain rescue, robot rescue, the cosy bear, the little elephant, the worm garden, forest friends, the farm, dolls and toys, the fantasy forest, dance academy, backstage, streetwear, photo studio, music producer, fashion shop, beauty salon, festival, bake shop, sweet kingdom, miniature house, cute animal friends, gift shop, tea party, water park, ice cream stand, animal clinic, camping trip, summer house, at our home, vegetable garden, hero academy, the secret base, inventor's workshop, cosmic heroes and magic school. Everything is drawn here, our own designs.
- **Music and sounds:** every kind of place has its own little theme tune, and every place in a part of town plays its own version of it. Characters have voices by what they are (dogs, cats, owls, robots, sweet figures, people), and things make sounds when tapped: music, bouncing, engines, spinning, screens, eating. Coins, buying, the gift chest and a new level have their own sounds. All of it is made in the browser, with no sound files.
- **Mute:** the speaker button in the game goes from music and sounds, to sounds only, to quiet. It is remembered on the device. Nothing plays before the child has touched the screen, and the music stops when the game is not on screen.
- **Sit and sleep:** the avatar sits on sofas, chairs and benches, and lies down under the duvet in a bed.
- **Outfits:** more tops, trousers, shoes, hairstyles, eye colours and mouths. Save up to eight outfits, put one on with a tap, or roll a random one.
- **The game for grown-ups:** parents get a "Spillet" tab to see and play in the world too.

## [0.5.0] - 2026-10-27

### Added
- **Mit værelse grows into a whole play world:**
  - A map with the family's own house in the middle, drawn from its floor plan in Husbyggeren. Every room of the house is a place to play, the garden too, and a sibling's room can be visited.
  - Seven areas open one level at a time, each with two places: Rescue Town (station and harbour), Forest Town (clearing and farm), Pop Town (dance studio and concert stage), the Adventure Park (rides and water park), Sweet Town (bakery and sweet shop), Tech Town (lab and roof terrace) and Night Town (street and secret cave).
  - 70 characters of our own, ten per area: rescue dogs with a job each, forest creatures, the pop group Stjerneskud with dancers, a producer and a stylist, sweet little figures, park mascots, inventor heroes and heroes of the night. Tap them to hear what they say, drag them anywhere.
  - The grown-ups of the family are at home in the living room and kitchen, and a sibling is in their own room.
  - 60 new things for the house and the town: sofa, TV, kitchen, bathroom, car, swings, lamp posts, a fountain, a market stall, rides, a cake counter, a lab, and more.
  - Things do something when tapped: lamps turn on, screens switch, music plays, balls bounce, cars drive off, wheels spin, the rest wiggles.
  - Each child's own copy of every place keeps where they put things and characters.
- **Play together, live:** siblings who play at the same time see each other in the same place, walk about, and wave to each other. It runs through Home Assistant's own connection; where they are is only kept in memory and is never stored.
- **Full screen, lying down:** the game fills the screen on phones, tablets and computers, with a hint to turn a phone on its side. Building has its drawer at the side.
- **Two homes:** a child who lives with mum and dad in turns gets a plan under Familieindstillinger › Børnene: week on week off, 2-2-3, every other weekend, 9/5 or their own cycle of up to four weeks, plus single dates swapped for holidays. Fixed tasks belong to this home, the other home or both, the routine board and Hent og bring follow the plan, and the child's page says where they sleep tonight.
- **My menu:** everyone puts the tabs in their own order under Mine indstillinger and moves the ones they rarely use to "Mere". The first tab is their start page.

### Fixed
- **Lists:** a long description (like the Rema 1000 items from Middagsro) no longer squeezes the item's name into one letter per line. The name and the description are stacked.

## [0.4.0] - 2026-10-27

### Added
- **Mit værelse, the children's own room** (their start page now):
  - A little doll's house they build themselves: drag furniture, toys, lamps and wall things in from a drawer, then move, flip, resize, recolour or remove them.
  - Wallpaper patterns and floors.
  - Their own avatar to dress (skin, hair, hair colour, top, trousers and an extra like a crown or glasses). Tap the floor to walk, tap the avatar to wave and jump.
  - Their pet lives in the room, wags when the day goes well, and can be moved.
  - The routine cards for this part of the day, the day's missions and homework float as bubbles to tap when done.
  - The window shows the real sky, the switch on the wall turns the real lights in their room on and off, and the room gets dark at night when the lights are off.
- **Mit værelse is a game now:**
  - Coins for every routine card (3), a whole routine (+10), a mission (10) and homework (8), plus a treasure chest with 5 coins once a day. Ticking something off again takes its coins back.
  - The coins buy new things in the shop, one at a time or a whole pack at a discount: 20 packs with 132 new things, 11 wallpapers, 6 floors and 10 things to wear. Among them a den (pillow fort, hammock, fairy lights), a gaming setup (screens, console, arcade machine, LED lights), rescue pups (lighthouse headquarters, fire engine, helicopter), a pop stage (lights, microphone, disco ball), space, animals, jungle, sport, a creative corner, the sea bed and a fairy-tale castle. All drawn for Hverdagsro, with no characters or brands from shows or bands.
  - Party packs come to the shop around the occasions the family decorates for: Christmas, New Year, Shrovetide, Easter, Halloween, birthdays, Midsummer, Valentine's Day and Constitution Day. The first thing in each is a gift, and what is bought stays.
  - Every coin also gives experience. Ten levels open the packs and four more rooms to furnish: the den, the tree house, the space station and the big stage, plus a gold wallpaper, a rainbow floor and a gold crown.
  - A coin flies up when a bubble is tapped, and a new level or a new thing is celebrated.
- **The room page, picture first (layout A):**
  - The room's picture across the top with its name and temperature. Tap a lamp in the picture to open it in the drawer below (brightness, colour, on and off); tap it again to turn it off.
  - The moods as a row of chips, favourites first, then the room's scenes from Home Assistant.
  - "Alle N lamper i rummet" lists every lamp. Climate, music and TV, doors, windows and cameras, and the rest are small cards below.
  - "Tilpas rummet" chooses what the page shows, the favourite moods, names for the lamps, lamps to hide, and whether the room is pinned to the front page. Parents choose for the whole family; anyone can choose only for themselves.
- **Routines and homework among the missions, without points:** each part of the routine board shows as one mission (done when all its cards are), and homework from Aula (Min Uddannelse via the Aula integration) shows on its weekday.
- **Husbyggeren, much easier to build with:**
  - The keyboard works anywhere on the page: undo and redo, Delete, Esc, arrows to nudge (Shift for long steps, Alt for fine ones), `,` and `.` to turn, Ctrl/⌘ D to duplicate.
  - Choose several things with Shift-click, a Shift-drag frame or the "Markér flere" button, then move, duplicate, turn or delete them together.
  - Hold Alt to place freely.
  - Walls snap to other walls' ends and corners. Drawing back to the start closes the room and adds it.
  - Doors, windows and ports sit in their wall at any angle (also slanted walls) and move with the wall. So do TVs, wall lamps and furniture that stands against a wall, with their back to it.
  - Moving or resizing a room takes its walls, doors and furniture along. Moving a wall end stretches the walls and rooms that meet there.
  - Rooms get edge handles for resizing.
  - Many more furniture, grouped by room: kitchen cabinets, sink, hob, dishwasher, fridge and wall cupboards, bathroom vanity, mirror cabinet and towel rail, washer, dryer and laundry tower, shoe rack, office chair and standing desk, workbench, bikes and bins.
  - For the garden: hedges and fences (drawn like walls), raised beds, trampoline, garden furniture, lounge set, sun loungers, parasol, pizza oven, Weber grill, gas grill, fire pit, sandbox, swing, playhouse, and a shed/workshop.
  - A search field for entities that finds them by name, area or id, so access points (and everything else) can be picked.
  - Access points show whether they are online and how many devices are on them.
- **Husbyggeren saves by itself:** every change is saved a moment later, so nothing is lost on a reload.
- **Hent og bring:**
  - A fixed plan plus each week's own plan.
  - "Kopiér fra ugen før", "Brug den faste plan", "Gør ugen til fast plan", and "Samme som …" another child.
  - Messages to the phones follow the week's plan.
- **Hide lessons in the timetable** (e.g. Aula's "Pædagog i skolen"): tap them under Familieindstillinger › Børnene. They disappear from the timetable, the calendar and the children's pages.
- **Hverdagsro on the home screen:** its own icon, name and start page, with steps for iPhone, Android and the desktop under Mine indstillinger.
- **Appliances:** select all or none of an appliance's entities. The dishwasher always has a "Billigst" button, which uses the family's own "start at the cheapest hour" button when there is one.

### Changed
- **Room pictures are redrawn:** every room type has its own furnishing, and nothing stands in front of the window.
- **A room shows all its lights** (drawn lamps first), not just the ones drawn in Husbyggeren. Lamps drawn without a light no longer sit in the list as dead buttons.
- **Møblér rummet** only adds what the room is missing and never removes furniture.
- Windows and doors can be much narrower (from 25 cm), with the width in centimetres.
- Grass, tiles and gravel no longer carry a label (unless you have given them a name).
- The cars' battery rings show the charge in green, amber or red on a faint track.

### Fixed
- Husbyggeren no longer redraws itself in the middle of a drag when something changes in Home Assistant.

## [0.3.1] - 2026-10-26

### Added
- **Hand-drawn children's rooms:** a room can use one of three hand-drawn rooms instead of the one drawn from its type (Husbyggeren › Rum › Tegning). The room's lights take their places in the drawing by name, or as picked per lamp.
- **Locks and garage doors as living tiles** under the house plan: the padlock opens, the garage door rolls up, and every tap asks first, also to lock and close.
- **Wish lists on the child's own person page**, and the phone's battery on the person cards when the person has no phone of their own in Home Assistant.

### Changed
- **Updates patch the page in place** instead of replacing it: nothing jumps, blinks or replays its animation, and an open picker stays open.
- **The timeline only moves the time when you drag sideways,** so scrolling past it doesn't jump to the top.
- **Lists are picked from a dropdown.**
- **Cars on a phone** show the charging plan or what matters now, with a small home/away badge on the ring.
- **The + menu** no longer shows quick actions with conditions or Tilpas.

### Fixed
- Fridges and freezers showed as off. They're on unless their power switch is off, they're offline or the door is open.
- Group lights no longer show as a lamp of their own in a child's room.

## [0.3.0] - 2026-10-26

The panel is now 1:1 with the prototype, page by page, with real Home Assistant data.

### Added
- **The car popup** with the price clock and the charging controls, written straight to EV Planner.
- **Quick actions with conditions:** always, a time window or when an entity is on; who sees each one; your own order and hidden ones; a countdown with cancel; an optional question; the alarm afterwards.
- **Family settings like the prototype:** Funktioner, Børn (institution, birthday, modules per child, pet, school timetable, read-aloud speaker), Ønskeskyen, Musik, Pynt, Quick actions, Alarm and Rettigheder.
- **Ønskeskyen:** each parent logs in with their own account; Hverdagsro keeps only the key, never the password. Wish lists go to a child, the parents, both or friends and family, and wishes can be added.
- **The children's pages:** the routine board, the school timetable, wishes, pets and read-aloud.
- **Faste rutiner:** fixed chores, Hent og bring per child and weekday with helpers, and the routine board builder.
- **Messages to the phones:** purchases in the shop, missions, goals, who brings and picks up (in the morning and 30 minutes before), the waste the evening before, points and messages from a parent. Each person turns the kinds off one by one.
- **PINs** for the children on a shared tablet, checked in Home Assistant.
- **The family band** in all its styles, person pages, the child's day with a pinned message, and the chosen goal per child.
- **Lister, musik, apparater, kalender and madplan** as in the prototype, incl. the queue, sleep timer, moving the music, the cheapest dishwasher start and appliances found in Home Assistant.
- **Sikkerhed** as in the prototype, with the alarm's rights, cameras with Frigate, today's events and the house plan; rooms with their lamps and things.

### Changed
- Saving the family only restarts Hverdagsro when a child is added, renamed or removed.

## [0.2.0] - 2026-10-26

### Added
- **Electricity and cars under the sky** on the home page: the price now and the next 24 hours with the cheapest and most expensive hour, and a tile for each car in EV Planner with its charge level and plan. Tap a car to open EV Planner.
- **The + button** with the alarm and your own shortcuts: scripts, scenes and buttons, chosen under Familieindstillinger → Hjemmet.
- **The Mere menu** as in the prototype: big tiles with what is happening on each page, and links to the Husbygger and the settings.
- **Phone battery** on each family member's card, from the phone of their person.
- **Appliances found in Home Assistant** (robots, Home Connect and others) can be added with one tap.

### Changed
- The panel fills the whole screen on phones: the sky runs up under the status bar, and the tab bar sits at the bottom.
- The children's cards under Opgaver scroll sideways on phones instead of filling the page.
- *Hjemme nu* counts the people whose whereabouts are known.
- The energy module is on by default.

## [0.1.0] - 2026-10-26

The first release.

### Added
- **The Hverdagsro panel** in the sidebar, for parents and children: a living sky with today's weather, sunrise and sunset, a timeline of the day with calendar events and electricity prices, waste pickups, and decorations for birthdays, wedding days and holidays.
- **A setup guide** in the panel: the family from Home Assistant's people, the modules you want, and the home's calendars, lists, weather, alarm, speakers, cameras, prices and waste – found automatically, so you mostly confirm.
- **Missions, points and a shop** for the children, with approval by a parent. A shared family tablet can be used by the children.
- **Calendar, meal plan and lists** from your calendar and to-do integrations.
- **Music** for every media player: choose the speaker, control each one, group them, browse and play favourites.
- **Appliances** with live, animated status, in the order you choose.
- **The house:** draw it in the Husbygger – walls, rooms, gardens, doors, windows, garage doors, sensors, cameras, lights, furniture, TVs, speakers, robot vacuums and mowers, cars, chargers, solar and batteries – and see it live under Huset with the alarm, cameras and today's events. Tap a room to open it.
- **Rooms:** a drawing of each room by type, children's rooms by age and style, or your own photo; with the room's lights and devices.
- **Entities:** points (sensor) and today's missions (to-do list) for each child.
- **Actions:** `hverdagsro.add_points` and `hverdagsro.complete_mission`.
- Danish and English.
