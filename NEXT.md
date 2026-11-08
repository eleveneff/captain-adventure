# NEXT — Captain Adventure

Branch `cursor/sea-spread-lair-concepts-fa88`. PR https://github.com/eleveneff/captain-adventure/pull/1. Do not merge and do not publish. The coordinator reviews the release. Live site is still v4.4 on `main`.

Game version marker: **v4.6**.

## Approved concepts and prices

Both pictures were approved.

- Exterior: `concepts/pirate-point-lair-exterior.jpg`
- Cutaway: `concepts/pirate-point-lair-cutaway.jpg`

Site is **Pirate Point** (`id: "pirate"`, radius 20). Home hub is 23.44 and is not the lair. Turtle Cove 19, Parrot Palms 18, activity islands 17.19.

| Feature | Coins | Needs |
| --- | ---: | --- |
| Secret HQ (hidden door, captain chair, map) | 60 | — |
| Swimming pool | 40 | HQ |
| Hidden boat garage | 50 | HQ |
| Lookout telescope tower | 30 | HQ |
| Treasure / trophy room | 25 | HQ |
| Pool water slide | 35 | HQ and pool |
| Training obstacle course | 30 | HQ |
| Aquarium room | 40 | HQ |
| Rooftop hammock hangout | 25 | HQ |
| Underground passage | 45 | HQ |

No new coin sources. Full tank 20, baseball and Tecmo 30, other games and fishing 10, 3-in-a-row gate 20.

## What shipped in this branch

Sea: buoy radius 290 → 324.23 (`sqrt(1.25)`, area ×1.25). Land radii unchanged. Offshore islands and sea sights moved out. Home, bridges, activity islands, drawbridge, speedway, and the 120–185 swell band were not resized.

Saves: `layoutVer` 4. A layout-2 position on an old offshore spot is moved with that island. Coins, badges, prizes, fuel, discoveries, and shop items are not cleared. Positions inside radius 140 stay. A save from before layout 2 drops only `pos`.

Lair: all ten parts on Pirate Point, hidden until bought. The sign is always there. `commit` re-checks ownership, prerequisites, and coins, then subtracts once. Short funds and a second buy do not deduct. Owned parts live on `Ne.v45.owned` and come back after reload.

## Tests on this resume

`node tests/sea-spread.mjs` — **79 passed, 0 failed**, no console errors.

Outer save `{x:-185.4,z:114.68}` became `{x:-207.28,z:128.22}` with 77 coins, the yacht, fuel, and the pirate discovery kept. Inner `{x:0,z:8}` with 88 coins stayed.

`node tests/lair.mjs` — **37 passed, 0 failed**, no console errors. This run is after the interior-wall fix and includes the Yes-button purchase.

Covered: the ten prices, HQ first, slide needs the pool, exact drops, no second charge, the menu showing the price before the garage's 50-coin Yes, enter, chair, map, tunnel to the back beach and back, dive, slide, climb, telescope fov 18 then 55, rock doors, hammock, four course gates, park and launch with no coin change, and reload keeping score 80, two badges, yacht, fuel 0.35/0.8, three isle discoveries, streak 6, hat, and all ten parts.

Headless SwiftShader, median of three ~1.2s runs (not a phone):

- Sea suite: home harbor **7.4** (worst; cold first run 3.1), open water 12.8, sea edge 14.4, Pirate Point 12.4.
- Lair suite after the build: home harbor 6.4, pirate lair **5.9** (worst that run). The harbor and the built lair are the slow spots. Open water is faster.

## Honest look versus the approved pictures

The dome, green cap, string of lights, blue chute, curved pool, white board, tower, stairs, and brass telescope read in the game's simple Lambert shapes. The hut, red X, palms, and dock are still there. The island radius did not grow.

Limits, on purpose:

- Hammocks are small roof pads, not the concept's big striped slings.
- The round door is a disk on the shell. E enters; there is no carved hole in the mesh.
- Garage doors are stone slabs just outside the shell. They open, and the boat parks and launches, but palms hide them from the dock view.
- The passage lowers you through a timber tunnel and pops you out at a beach arch. It is not the cutaway's open hillside.
- Indoors, the shell hides and you stand in an open room with the map table, gold trophies, and a glass tank of fish. It is brighter and more open than a closed cave.
- The course is four gates on the grass. The exterior concept did not draw that course.
- A big green distant peak sits off the dock side of Pirate Point. It is an existing world shape, not part of the lair. Screenshots are taken from the other side so it stays small.

## Do not do yet

Do not merge. Do not publish to https://eleveneff.github.io/captain-adventure/.
