# NEXT — Captain Adventure

Live game stays on `main` until this branch is reviewed. Do not publish or merge yet.

## Largest offshore island

Measured from the current build (`Ot = 1.5625`), not from the island name.

| Place | Code | Radius | Area scale (r²) |
| --- | --- | --- | --- |
| Home hub (excluded) | `$n = 15 * Ot` | 23.44 | 549 |
| **Pirate Point** | remote `R: 20` | **20** | **400** |
| Turtle Cove | remote `R: 19` | 19 | 361 |
| Parrot Palms | remote `R: 18` | 18 | 324 |
| Eight activity islands | `Hc = 11 * Ot` | 17.19 | 295 |
| Lighthouse Rock | collision `r: 10.5` | ~10.5 | ~110 |
| Sandy Sandbar | ellipse about 7.3 × 17 | — | ~137 |

**The secret lair site is Pirate Point** (`id: "pirate"`). It is the largest island that is not the home hub. The home island is larger and stays the harbor.

## Concepts for approval (lair look not built)

Feature list and prices are approved. These pictures are the first look at the lair. Nothing from this list is in the playable build yet.

- Exterior: `concepts/pirate-point-lair-exterior.jpg`
- Cutaway: `concepts/pirate-point-lair-cutaway.jpg`

The exterior keeps the existing hut, palms, red X, dock, and checker ocean, and adds a rock-hill lair: hidden lit door, captain’s map room implied inside, curved pool, diving board, floating toys, water slide, sliding-rock boat garage, telescope tower, rooftop hammocks and string lights. The cutaway shows the map room and captain chair, trophy room, aquarium with a blank fact plaque, pool and slide, and an underground passage to a second beach exit.

Still to place after approval: the training obstacle course on the open grass beside the red X. The built lair must sit on today’s island radius (20). The mockup rock hill must not grow the shoreline.

### Approved prices (not charged until the lair is built)

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

Purchase rules when this is built: show the price, refuse if coins are short, never go negative, never charge twice, save the build, show it in the world, and make every bought part something the captain can use. No new coin sources.

## Sea expansion in this branch (v4.5)

Boating area is the disk inside the orange buoys. Old radius 290. New radius `290 * sqrt(1.25)` ≈ 324.23. Area ratio 1.25.

What moved, by `SEA_SPREAD = sqrt(1.25)`:

- Buoy ring and `DEEP_R`
- Turtle Cove, Pirate Point, and Parrot Palms centers (radii 19 / 20 / 18 unchanged)
- Sandy Sandbar, dolphins, Lighthouse Rock, whale, and treasure buoy
- Fog far, so the haze at the new edge matches the old edge
- Buoy count `round(56 * SEA_SPREAD)` so the ring does not look sparse

What did not move or grow:

- Home hub, wooden bridges, eight activity islands, drawbridge, speedway
- Land radii, docks’ local shapes, wave band at 120–185, wake code
- Coin prices: full tank 20, baseball and Tecmo 30, other games and fishing 10, 3-in-a-row gate 20

Saves: `layoutVer` 3. Coins, stars, badges, prizes, fuel, and island discoveries stay. A saved position inside radius 140 stays. A saved position farther out (old offshore spot) is cleared so the captain restarts on the home beach instead of in open water. Older saves that were not yet layout 2 still drop their position, same as the previous world bump.

## Checked on this branch

`node tests/sea-spread.mjs` against headless Chrome (SwiftShader). 79 checks, no console errors.

- Buoy radius 324.23, area exactly 1.25× the old 290 disk. Fog far 557.8. Camera far still 820.
- Pirate Point, Turtle Cove, and Parrot Palms kept radii 20 / 19 / 18 and moved out to 243.7 / 248.2 / 252.7. All three docks are water, and the boat can land. Sea sights moved with them and stay inside the buoys.
- Six bearings accept water inside the ring and refuse it outside. Open water between the hub and Pirate Point still boats. Home harbor water still boats.
- Home radius 23.44, activity islands 17.19, ring 62.5, drawbridge and speedway radii were not edited. Lagoon screenshots match the old camera.
- Holding W moved the power boat about 75 units and did not change coins. A keydown sets the left control and keyup clears it. Portrait touch shows the joystick (`display: block`) and the action button.
- A layout-2 save with 77 coins, the yacht, a volcano badge, half a tank, and Pirate Point discovered kept all of that. Its old offshore position was cleared. A save standing at home (0, 8) with 88 coins kept that position.
- Same-camera shots: `tests` writes `/tmp/cap-shots/before` and `/tmp/cap-shots/after`. The hub is unchanged. Pirate Point sits farther out, with more open water between it and the speedway.
- Frame rate in software GL, median of three 1.2s runs: home harbor 8.1 (worst, densest spot, cold first run 3.6), open water 12.2, sea edge 14.2, Pirate Point 12.6. The new water is not the slow spot. These numbers are the headless renderer, not a player phone.

## Not in this branch

- Lair meshes, purchase menu, and interactions (waiting on the concepts above)
- Publishing to GitHub Pages
- Princess Adventure
