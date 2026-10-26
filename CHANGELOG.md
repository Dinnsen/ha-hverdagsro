# Changelog

All notable changes to Hverdagsro. The version is the one in `custom_components/hverdagsro/manifest.json`.

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
