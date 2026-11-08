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

The four suggested additions are in this head, at no extra price. They show up only with the part they belong to.

- Lanterns stand along the dry stepping-stone path. Each one is an emissive box on a post. The lair adds no point lights.
- The garage has a plank apron out to the water and a red-and-white buoy beside the existing mooring. Parking and launching are the same action as before.
- The hammocks sag between taller posts. Lying down rests in the dip. Standing up sets the tilt back to zero.
- The course has a START banner and flags 1 to 4. A later gate does not count until the earlier ones are done.

The HQ room and the lighthouse got a finish pass, not a new layout. The room has a wood band, a gold edge on the rug, framed sea pictures, a cushioned chair, a chart lamp, a shelf back, and a brass tank frame. The lighthouse climb camera sits outside the turn and looks down, so the hat and the torso stay in view at the bottom and the middle of the stairs. Near the top, and while walking up to the lamp, the camera stands to the side of the cage instead of looking through a brass post. A near plane of 0.35 keeps a tread that touches the lens from filling the picture. Brick, portholes, and the lamp were left as they are.

`node tests/lair.mjs` on this head: **53 passed, 0 failed**, no console errors. Same-spot frames: bare **9.7**, built **9.8**. Worst spot in that suite is the harbor at **4.9**. `node tests/smoke.mjs`: **26 passed, 0 failed**, including the lighthouse climb, the lamp, the climb down, and leaving. `node tests/sea-spread.mjs`: **79 passed, 0 failed**. Deep radius **324.23**. Outer save still moves to about **{-207.28, 128.22}**.

SHA-256 of `index.html`: `bf54a4ab82542549fb5bdc831601c59de8cacee777e8c35fc1b8578ef55bcdfc`.

Nits still there: the door is a disk in a frame, and the garage doors are still stone slabs. A boat aimed at the back of the island does not show the lair; the dock side does.

No further ideas are queued. Do not start more features.

## Lessons for the Princess team

Read from the published Princess Explorer (v4.3, no files there were changed), the lighthouse already in this game, and the Pirate Point room. These are for the castle team to use. They are not a request to edit that repo from here.

- Close the room before you decorate it. The castle paints a mural on a shell you see only from the inside, so the garden never shows through the walls. The lighthouse does the same with a painted cylinder. The lair hides the island while you are indoors. A window should be a framed picture of the sea, not a hole.
- Keep the camera inside the floor you can walk. The lighthouse pulls the camera back in when it would leave the tower. The lair uses two corners inside the room and looks at the captain's chest. Looking through the ceiling, or standing the camera in a wall, is what made the rooms feel unfinished.
- Light the whole room once. The castle uses one warm light plus glowing crystals that share a material. A lantern on a path can be an emissive box. It does not need its own light. That keeps the frame rate steady.
- Finish a surface with a few cheap strips: a wood band on the lower wall, a darker edge on the rug, a frame around glass, a baseboard. The castle's red runner with gold edges is the model. Flat boxes with no edge read as prototypes.
- Build a chair, a table, or a lamp from a handful of primitives at the captain's size, and leave a clear walk down the middle. The castle stations sit on the walls. The middle stays open.
- Show the route in the world. Numbers on the gates, a start banner, lanterns on the dry path, and a buoy by the garage tell a child where to go without a new menu or a new price.

## Do not do yet

`node tests/lh-view.mjs` on the lighthouse camera fix: **14 passed, 0 failed**. It checks the hat and the torso on screen at the bottom, middle, and top of the climb, and at the lamp. `node tests/smoke.mjs` on this same head: **26 passed, 0 failed**, including the lighthouse climb, the lamp, and the climb down. The sea and lair frame-rate sweeps were not run again on this camera-only change.

The user has authorized publication. This agent cannot merge: the pull-request tool has no merge action, and the GitHub CLI here is read-only. The coordinator can merge PR 1 from GitHub after checks are green. Do not report the live site as v4.6 until a cache-busted fetch of https://eleveneff.github.io/captain-adventure/ shows version v4.6 and the same SHA-256 as `index.html`.
