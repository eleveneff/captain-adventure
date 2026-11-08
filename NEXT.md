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

`node tests/lair.mjs` — **38 passed, 0 failed**, no console errors. This run is the visual pass: rock lumps, door frame, slung hammocks, garage beside the pool, and a walled room. The count for the current head is in the second pass below.

Covered: the ten prices, HQ first, slide needs the pool, exact drops, no second charge, the menu showing the price before the garage's 50-coin Yes, enter, chair, map, tunnel to the back beach and back, dive, slide, climb, telescope fov 18 then 55, rock doors, hammock, four course gates, park and launch with no coin change, and reload keeping score 80, two badges, yacht, fuel 0.35/0.8, three isle discoveries, streak 6, hat, and all ten parts.

`node tests/smoke.mjs` — **22 passed, 0 failed**. This drives the real panels, not just constants. Three correct math-gate answers pay 20 (score 40 to 60). The fuel dock then charges 20 and fills an empty tank (score 60 to 40), and Cast off boards the power boat. Holding forward drains that tank and the free tow returns the captain to a dock with the coins unchanged. Home is not a lair prompt before or after. Baseball's first play opens its math gate, pays the gate reward, then charges 30 (220 to 190). Play again charges another 30 and does not reopen the gate (190 to 160). Tennis charges 10 (220 to 210). Reload keeps the volcano badge, the yacht, turtle and pirate discoveries, the hat, streak 6, yacht fuel 0.8, layout 4, and the score.

Headless SwiftShader, median of three (not a phone). Same-spot comparison hides the lair groups, then shows them, from the same boat at the garage mooring:

- Sea suite this pass: home harbor **7.9** (worst; cold first run 3.6), open water 12.5, sea edge 14.9, Pirate Point 13.1.
- Lair suite same spot this pass: bare island median **8.8** (runs 6.5, 8.8, 9.2), built lair median **9.5** (runs 8.6, 9.5, 10.8). Harbor in that suite was 4.4 on a cold first run. The built lair is not slower than the bare island at that spot. The spread between runs is larger than the difference.

## Honest look versus the approved pictures

The rock is several overlapping lumps with a stone base ring and a grass cap, not one smooth ball. A wood frame and two lanterns mark the round door, with a step in front. Red and blue hammocks sag between posts on the roof under the string of lights. The garage mouth sits beside the pool, on the open side of the approach, so the palms stay and the doors are not behind them. The chute, pool, board, tower, and telescope are unchanged in kind. The hut, red X, palms, and dock are still there. The island radius did not grow.

Inside, entering the door uses the room camera, not the outdoor follow camera. The floor sits above the hill, the walls are drawn from both sides, and the ceiling stays above the view. While the captain is inside, island props and the roof, tower, pool, and slide are hidden so they cannot poke through the walls. Leaving puts them back. The entry view shows the captain on the rug, the chair, the chart table, the trophy shelves, and the aquarium, with open floor to walk. The same camera is what desktop, portrait, and short landscape use.

Still true:

- The door is a framed disk. E enters. There is no carved hole through the rock mesh.
- Garage doors are stone slabs beside the pool. They slide, and the boat parks and launches.
- Hammocks are slung cloth between posts. They read up close and stay small in a wide shot.
- The passage is an enclosed corridor under the island: wood floor, rock walls, a ceiling, and timber posts. It stays hidden until you walk it. A beach arch is the outside door.
- The course is four gates on the grass.

## Second pass

Walked the built lair with the real gameplay camera. Fixed:

- Standing at the chart no longer gets stolen by the chair prompt. The table nudge pushes you toward the map.
- Leaving the HQ puts the captain on dry stepping stones beside the rock, clear of the pool, the slide, and the diving board. The hidden-door prompt is on that same dry path, so the dock walk does not share a spot with the water.
- The hammock rest is on the cloth, and the camera sits outside the rock. Getting up clears the lie tilt so later views are not stuck on their side.
- The passage is a closed corridor with a floor, rock walls, a ceiling, and timber. The captain stays upright. Walking one way comes out at the beach arch; walking back, or using the arch, returns through the corridor to the room. Grass and palms stay hidden while you are inside it. The corridor itself is hidden until you enter.
- The garage prompt stands on the open grass by the pool, not inside the beam.
- The Exit button sits above the keyboard hint, and above the joystick on touch.

`node tests/lair.mjs` on this head: **47 passed, 0 failed**, no console errors. Same-spot frames: bare **8.5**, built **10.2**. `node tests/smoke.mjs`: **22 passed, 0 failed**, no console errors. `node tests/sea-spread.mjs`: **79 passed, 0 failed**, no console errors. Deep radius **324.23**. Outer save still moves to about **{-207.28, 128.22}**.

Nits still there: the door is a disk in a frame, the garage is still stone slabs, and the hammock sling is shallow. A boat aimed at the back of the island does not show the lair; the dock side does.

Ideas only, not built:

1. Lanterns along the stepping-stone path from the dock.
2. A mooring buoy and a clearer garage apron on the water side.
3. A deeper hammock sling readable from the dock.
4. Numbered course flags and a start banner.

## Do not do yet

Do not merge. Do not publish to https://eleveneff.github.io/captain-adventure/.
