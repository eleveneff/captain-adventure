# Plan: walkable outlying islands

This is a plan only. Nothing in this file is built. Liberty Isle now lives on the old Turtle Cove landmass (island id `turtle`, radius 19), which already had a dock and a walkable disk. The small extra Liberty island beside the lighthouse has been removed.

The pieces below are the places a captain can sail up to but cannot yet explore on foot, plus Parrot Palms, which has a dock and a single secret but no ring of stations.

## Shared work

One landing system should serve every new shore:

- A dock prefab: a short plank run, two piles, a sand apron where the planks meet the beach, and a boat spot about 10 units offshore so the existing land check still works.
- A walk mesh: a disk or ring registered with the same walk-circle list the home pads and the outer islands already use, plus a path rectangle from the dock to the first station.
- Colliders only while the captain is on that island. Room and mountain bumps stay local to the active shore. The existing push-out when the captain is inside a blocker is the anti-stuck watchdog and should stay.
- Camera: keep the current follow camera. Do not add a second mode. Fade props that sit between the camera and the captain when a lesson card is open.
- Each activity is a 3-question gate in the same pattern as Liberty Isle and the lair builds. A perfect first try can refund 1 coin. Prices stay in the current bands: fuel 20, small builds 25–50, big games 30, other tickets 10.

## Parrot Palms

- Size and look: radius 18, the lowest of the outer islands (center height about 0.7). Seven palms, a hut, rocks, and a parrot perch. A dock already exists.
- Theme: listening, counting, and leaving wild things alone. Fits the existing parrot story.
- Activities: shell count (3 questions), tide and time (3), a short reading of the island story (3). No new monument.
- Dock: keep the current dock. Add the sand apron from the shared prefab so the landward end does not cut the beach.
- Walkable area: the island already has a walk disk of radius about 17. Add two path rectangles from the dock to the perch and the shell scatter. No mountain collider.
- Coins: each set pays 30 on a perfect first try, same as a Liberty station. No build price.
- Effort: small. The dock and walk disk exist. The new work is three question sets and two paths.

## Sandy Sandbar

- Size and look: an oval sand bank about 15 units long and 7 wide, sitting near radius 148 from home (`132 * SEA_SPREAD`). A red-and-white marker stands on it. It is scenery only.
- Theme: measurement and tides. A sandbar is a good place to practice length, time, and “how deep is safe.”
- Activities: measure the bar (3), tide table (3), a “which way is deep water” chart question (3).
- Dock: a short prefab dock on the home-facing end. The boat spot should sit in water just off the bar, inside the current `near: 22` approach.
- Walkable area: one walk disk covering the sand, radius about 6, plus the dock path. No extra colliders. The bar is flat.
- Coins: 30 for a perfect set. No build.
- Effort: small. New dock, one walk disk, three question sets.

## Lighthouse Rock

- Size and look: a rock about 16 units across with a red-and-white striped tower, near radius 196 from home (`175 * SEA_SPREAD`). This is the sea-sight rock, not the home-island lighthouse the captain already climbs.
- Theme: light, distance, and keeping a promise. Pairs with the home lighthouse story without copying the climb.
- Activities: beam direction (3), counting stripes or steps (3), a short log-writing reading (3). Optional: light the lamp for a 25-coin gate, same band as a small lair part.
- Dock: prefab dock on the side facing home, boat spot in open water.
- Walkable area: a ring path around the rock and a ramp to the tower door. The rock itself is a collider while the captain is on this shore, with the same push-out watchdog used on Liberty’s mountain.
- Coins: question sets pay 30. The optional lamp build is 25, with a 1-coin refund on a perfect first try.
- Effort: medium. The rock mesh exists, but it needs a dock, a walk ring, a ramp, and a local collider. The tower interior can stay a door and a question, not a second full lighthouse.

## Dolphin waters

- Size and look: not an island. A moving pod near radius 168 (`150 * SEA_SPREAD`). The approach radius is 22.
- Theme: groups, fractions, and animal behavior. Watching from the boat is enough. Do not invent a sand island under the dolphins.
- Activities: count the pod (3), a fraction of the pod (3), “why they swim together” (3). The captain stays in the boat.
- Dock: none. A buoy ring marks the stop.
- Walkable area: none.
- Coins: 30 for a perfect set. No build.
- Effort: small. It is a boat-side card, not a landing.

## Whale grounds

- Size and look: open water near radius 224 (`200 * SEA_SPREAD`), with the whale mesh. Approach radius 26.
- Theme: scale and comparison. Length, weight, and “how many boats long.”
- Activities: compare lengths (3), a reading of one whale fact (3), a map question about where the whale was last seen (3).
- Dock: none.
- Walkable area: none.
- Coins: 30 for a perfect set.
- Effort: small. Same boat-side card as the dolphins.

## Treasure buoy

- Size and look: a small buoy near radius 237 (`212 * SEA_SPREAD`). Approach radius 12. It is a marker, not land.
- Theme: codes and coordinates, in the same spirit as the treasure-code lesson on the home island.
- Activities: read a 3-step code (3), plot a bearing (3). Two sets are enough. Do not add a chest you can walk to.
- Dock: none.
- Walkable area: none.
- Coins: 30 for a perfect set.
- Effort: small.

## Already built, not in this update

- Pirate Point (radius 20) is the lair. It already has a dock, rooms, and priced builds from 25 to 60.
- The lava volcano is a home-ring station, not an outer island. Leave it.

## Risks

- Tablets already draw the sea, four shores, the lair, and the home ring. Each new walkable shore adds a terrain mesh, a dock, and question UI. Build Parrot and the sandbar first. Leave Lighthouse Rock until those two stay smooth.
- Keep colliders local. A global list of every rock on every shore will make the walk check slower and can shove the captain on a different island.
- The follow camera sits in front of the captain. Tall roofs and towers end up in the foreground. Fade them when the camera is close, the way Liberty’s cave rooms fade outside the tunnel.
- New docks must stay inside the buoy ring. The sea-spread test already checks that every shore’s dock is in water and inside the buoys.
- Saves: new progress should be its own object, as `state.v51` is for Liberty. Do not rewrite coins, fuel, or older island discoveries.
