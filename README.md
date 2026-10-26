<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="custom_components/hverdagsro/brand/dark_logo.png">
    <img src="custom_components/hverdagsro/brand/logo.png" alt="Hverdagsro" width="420">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/Dinnsen/ha-hverdagsro/releases"><img alt="Version" src="https://img.shields.io/github/v/release/Dinnsen/ha-hverdagsro?style=flat-square&label=version&color=6E4AFF"></a>
  <a href="https://hacs.xyz"><img alt="HACS" src="https://img.shields.io/badge/HACS-custom-41BDF5?style=flat-square"></a>
  <img alt="Home Assistant 2026.3+" src="https://img.shields.io/badge/Home%20Assistant-2026.3%2B-18BCF2?style=flat-square&logo=homeassistant&logoColor=white">
  <a href="https://github.com/Dinnsen/ha-hverdagsro/actions/workflows/tests.yml"><img alt="Tests" src="https://img.shields.io/github/actions/workflow/status/Dinnsen/ha-hverdagsro/tests.yml?branch=main&style=flat-square&label=tests"></a>
  <a href="LICENSE"><img alt="Licence: MIT" src="https://img.shields.io/badge/licence-MIT-97ca00?style=flat-square"></a>
</p>

# Hverdagsro for Home Assistant

🇩🇰 [Læs på dansk](README.da.md)

*Hverdagsro* is Danish for "calm in everyday life". Hverdagsro adds one beautiful panel to Home Assistant's sidebar for the whole family: what is happening today, the children's missions and points, the calendar, the meal plan and the shopping list, the music, the appliances, and the house itself – drawn by you and alive with the state of your home. Parents see the family; each child sees their own day.

Everything is set up in the panel by a guide that finds your calendars, lists, speakers, cameras and the rest by itself. You mostly confirm.

**Contents:** [Features](#features) · [Requirements](#requirements) · [Installation](#installation) · [Setup](#setup) · [Who sees what](#who-sees-what) · [The house](#the-house) · [Entities](#entities) · [Actions](#actions) · [Privacy](#privacy) · [Limitations](#known-limitations) · [Removal](#removing-the-integration)

## Features

- **A living sky.** The top of the panel is today's sky: sunrise and sunset from `sun.sun`, rain, snow and clouds from your weather entity, decorations for birthdays, wedding days and holidays, the waste bins when a pickup is near, and the house glowing in the alarm's colour when it is armed.
- **The day at a glance.** A timeline from 06 to 24 with the day's events, the hourly forecast and the electricity price. Drag it to watch the day go by.
- **Missions, points and a shop.** Morning, afternoon and evening missions for each child with points; rewards the children can buy, approved by a parent; a goal to save for. Works with the children's own Home Assistant users, or with a shared family tablet.
- **Calendar, meal plan and lists** from any calendar and to-do integration (Google, CalDAV, local, Bring!, Todoist …).
- **Music.** Pick a speaker, control each one on its own, group them, browse and play favourites. Works with any media player; best with Sonos, Music Assistant, Google Cast, Spotify and Apple TV/AirPlay.
- **Appliances** – washer, dryer, dishwasher, oven, hob, coffee machine, fridge, freezer, robot vacuum, lawn mower, ventilation – with live, animated status in the order you like.
- **The house.** Draw your home in the *Husbygger* and see it live: open doors and windows, locks, garage doors, motion, smoke, lights in their real colour, TVs and speakers playing, robots driving around, cars at home with the charging cable showing connected, charging, scheduled, paused or charged. Tap a room to open it.
- **Rooms.** A drawing of every room from its type – children's rooms by age and style – or your own photo, with the room's lights and devices.
- **Alarm, cameras and today's events** together under *Huset*.
- **Themes** for each family member, light and dark.
- **Danish and English.**

## Requirements

- Home Assistant 2026.3 or newer.
- The people in your family as [persons](https://www.home-assistant.io/integrations/person/) (Settings → People). Link a person to a user to let them open their own page.
- Optional: calendars, to-do lists, a weather entity, media players, an alarm panel, cameras, an electricity price sensor (Energi Data Service, Nord Pool …) and waste pickup sensors or calendars.

## Installation

### HACS

1. Open HACS → ⋮ → **Custom repositories**, add `https://github.com/Dinnsen/ha-hverdagsro` as an **Integration**.
2. Find **Hverdagsro** in HACS and download it.
3. Restart Home Assistant.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Dinnsen&repository=ha-hverdagsro&category=integration)

### Manually

Copy `custom_components/hverdagsro` into your `config/custom_components` folder and restart Home Assistant.

## Setup

1. Settings → Devices & services → **Add integration** → **Hverdagsro**.
2. Open **Hverdagsro** in the sidebar. The guide takes you through:
   - **The family** – pre-filled from your persons. Choose who are parents and who are children, colours, birthdays and the children's school or kindergarten.
   - **Modules** – turn on what your family uses.
   - **The home** – weather, calendars, meal plan, lists, alarm, speakers, cameras, electricity price and waste pickups, found automatically.
   - **The house** – draw it now, start from your Home Assistant areas, or later.
3. Done. Everything can be changed later under *Familieindstillinger* in the profile menu.

The integration's options (Settings → Devices & services → Hverdagsro → Configure) set the panel's name and icon in the sidebar, and whether only administrators may open it.

## Who sees what

| | Parents | Children |
|---|---|---|
| Home with the family, today and approvals | ✓ | |
| My day: missions, points, goal | | ✓ |
| Shop | all children | their own |
| Calendar, meal plan, lists | ✓ | lists |
| Music, appliances, the house, alarm and cameras | ✓ | their own room |
| Settings and the Husbygger | ✓ | |

A **parent** is a family member marked as parent, or a Home Assistant administrator who isn't in the family. A **child** sees their own page when their person is linked to their user. A **shared tablet** – a user that isn't anyone in the family – asks *Who are you?* and can act for the children, never for the parents. Parents can look at Hverdagsro as any family member from the profile menu.

## The house

The *Husbygger* (profile menu → Husbygger) is a drawing tool for your home:

- **Draw** walls, rooms and outdoor areas (lawn, tiles, terrace, driveway, flower beds) with as many corners as you need.
- **Place** doors, windows and garage doors on the walls – with their sensor, and optionally a lock – cameras, motion, smoke and water sensors, lights (ceiling, pendant, spot, floor, table, wall, LED strip, RGBWW, garden), furniture (or furnish a whole room at once), TVs, speakers, appliances, robot vacuums and lawn mowers, cars, chargers, solar panels, home batteries, trees and bushes.
- **Size, move and rotate** everything; undo and redo; snap to walls.
- **Start from your areas** to get a room for each Home Assistant area, and **import or export** the drawing as a file.

Cars are shown only when their presence entity says they are home. Draw a charging cable from the car's charge port to a charger; it shows when the car is connected and tells whether it is charging, scheduled, paused, charged or has a fault. A charger can serve several cars.

The drawing is stored in Home Assistant (see [Privacy](#privacy)) and shared by the whole family.

## Entities

For each child:

| Entity | |
|---|---|
| `sensor.<child>_points` | The child's points. Attributes: the next goal in the shop and its price, today's missions and how many are done, purchases waiting for approval. |
| `todo.<child>_missions` | Today's missions. Ticking one off here gives its points, just like in the panel. |

## Actions

| Action | |
|---|---|
| `hverdagsro.add_points` | Give a child points – or take them away with a negative number – with a reason. |
| `hverdagsro.complete_mission` | Mark a child's mission as done (today, or on a date) and give its points. |

Example: points for emptying the dishwasher, from a button.

```yaml
action: hverdagsro.add_points
data:
  member: Ida
  points: 10
  reason: Emptied the dishwasher
```

## Privacy

Hverdagsro runs entirely in your Home Assistant. It makes no connections to the internet. The family, the missions, the points and the house drawing are stored in Home Assistant's `.storage` folder (`hverdagsro.<entry id>`), which is part of your backups. Room photos you upload are stored by Home Assistant's own image upload. Diagnostics leave out names, birthdays and people.

## Known limitations

- The panel is built for Home Assistant's own frontend and the Home Assistant apps; it isn't a dashboard card.
- Room drawings are generic. Upload a photo for a room to make it yours.
- Hverdagsro shows and controls what your integrations offer: if a speaker can't group, Hverdagsro can't group it.

## Removing the integration

Settings → Devices & services → Hverdagsro → ⋮ → **Delete**. The family's stored data is deleted with it. Then remove Hverdagsro in HACS and restart.

## Support

Found a bug or have an idea? [Open an issue](https://github.com/Dinnsen/ha-hverdagsro/issues). If Hverdagsro brings calm to your everyday life, you can [buy me a coffee](https://buymeacoffee.com/dinnsen) ☕.

Licence: [MIT](LICENSE).
