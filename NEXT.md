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

`node tests/lair.mjs` — **38 passed, 0 failed**, no console errors. This run is the visual pass: rock lumps, door frame, slung hammocks, garage beside the pool, and a walled room.

Covered: the ten prices, HQ first, slide needs the pool, exact drops, no second charge, the menu showing the price before the garage's 50-coin Yes, enter, chair, map, tunnel to the back beach and back, dive, slide, climb, telescope fov 18 then 55, rock doors, hammock, four course gates, park and launch with no coin change, and reload keeping score 80, two badges, yacht, fuel 0.35/0.8, three isle discoveries, streak 6, hat, and all ten parts.

`node tests/smoke.mjs` — **14 passed, 0 failed**. There is no older full gameplay suite in this repo. This smoke checks live constants and a short boat move. It does not play a mini-game. Full tank is still 20 coins. The fuel module's `PRICE` constant is 5 (unchanged here). Tickets stay 10, baseball and Tecmo stay 30, the math gate stays every 3. Home beach is walkable. The power boat still moves at home and does not spend coins. Boarding and tow hooks are still present. Baseball still has 13 questions.

Headless SwiftShader, median of three (not a phone). Same-spot comparison hides the lair groups, then shows them, from the same boat at the garage mooring:

- Sea suite this pass: home harbor **7.9** (worst; cold first run 3.6), open water 12.5, sea edge 14.9, Pirate Point 13.1.
- Lair suite same spot: bare island median **6.8** (runs 3.9, 6.8, 8.0), built lair median **8.0** (runs 6.4, 8.0, 8.9). Harbor in that suite was 9.4. The built lair is not slower than the bare island at that spot. The spread between runs is larger than the difference.

## Honest look versus the approved pictures

The rock is several overlapping lumps with a stone base ring and a grass cap, not one smooth ball. A wood frame and two lanterns mark the round door, with a step in front. Red and blue hammocks sag between posts on the roof under the string of lights. The garage mouth sits beside the pool, on the open side of the approach, so the palms stay and the doors are not behind them. The chute, pool, board, tower, and telescope are unchanged in kind. The hut, red X, palms, and dock are still there. The island radius did not grow.

Inside, the shell stays up. A floor, four walls, and a ceiling enclose the room. The follow camera tucks in, and only a wall between the camera and the captain is hidden. The map is the blue disk with green and gold islands, the chair is a seat with a back and legs, trophies sit on a shelf, and the tank holds the fish.

Limits that are still true:

- The door is still a disk in a frame. E enters. There is no carved hole through the rock mesh.
- Garage doors are stone slabs. They slide, and the boat parks and launches. From the dock they read as the stone mouth by the pool, not a detailed cave.
- Hammocks are slung strips between posts. They are recognizable up close and small in a wide shot. They are not the concept's large striped slings.
- The room is low and the captain model is large, so a close interior shot still fills with the captain, the ceiling, and the map blobs. Outdoor palms no longer show through a missing shell. It is not the cutaway illustration.
- The passage is a timber tunnel to a beach arch, not an open hillside.
- The course is four gates on the grass.
- HUD shots: portrait prompt "Hidden door / Press E", portrait "Yes, build it" for the rooftop at 25 coins with 100 on hand, and short landscape "costs 25 coins. You have 5." The confirm card sits at the top of the shop so it is on screen in portrait.

## Do not do yet

Do not merge. Do not publish to https://eleveneff.github.io/captain-adventure/.
