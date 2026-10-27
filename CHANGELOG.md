# Changelog

All notable changes to Hverdagsro. The version is the one in `custom_components/hverdagsro/manifest.json`.

## [0.4.0] - 2026-10-27

### Added
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
