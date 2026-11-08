# NEXT — Captain Adventure

**PRODUCTION PAUSED.** Owner is out of weekly tokens and asked to stop. Do not merge, do not publish, do not start the next feature, and do not resume QC until the owner says so.

Branch: `cursor/sea-spread-lair-concepts-fa88`
PR: https://github.com/eleveneff/captain-adventure/pull/1
Live site is still v4.4 on `main`. This branch is not released.

## Approved concepts and prices

Both pictures were approved: "Yes, build the lair with this design."

- Exterior: `concepts/pirate-point-lair-exterior.jpg`
- Cutaway: `concepts/pirate-point-lair-cutaway.jpg`

Site is **Pirate Point** (`id: "pirate"`, radius 20). Home hub is larger (23.44) and is not the lair. Turtle Cove is 19, Parrot Palms 18, activity islands 17.19.

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

No new coin sources. Full tank still 20, baseball/Tecmo 30, other games and fishing 10, 3-in-a-row gate 20.

## Implemented in this WIP (not released)

Sea, already committed before this pause:

- Boating disk 290 → 324.23 (`sqrt(1.25)`, area ×1.25). Land radii unchanged.
- Offshore islands and sea sights moved out. Home, bridges, activity islands, drawbridge, speedway, and wakes were not resized.
- `layoutVer` 4. A layout-2 save standing on an old offshore spot is **moved with that island**, not deleted. Coins, badges, prizes, fuel, and discoveries are not cleared. Inner positions (within 140) stay. A pre-layout save still drops only `pos`.

Lair, in the uncommitted-until-this-checkpoint `index.html` (game version string v4.6):

- All ten parts exist as groups on Pirate Point. They stay hidden until bought. A "Secret Lair" sign is always there.
- Buy path re-checks ownership, prerequisite, and coins at the moment of charge. Short funds and duplicates do not deduct. Score is not allowed to go negative.
- Owned parts save on `Ne.v45.owned` and show again after reload.
- HQ: E at the round door enters; chair sits/stands; map toast lists harbor and the other islands; Exit lair leaves.
- Pool: curved water, board, duck/ball/toy. E on the board dives.
- Slide: blue chute. Refuses purchase without HQ and pool. E rides it into the pool.
- Garage: E slides the rock doors. A motorboat at the side mooring parks inside without a coin charge. E launches it again.
- Tower: stairs raise you as you walk up; E climbs to the platform. Telescope sets the camera fov to 18 and names the place you are aimed at. E closes it and restores fov.
- Trophy room and aquarium: visible after you enter. E reads trophies or the next ocean fact.
- Course: four gates on the grass. Walking through them in order counts to 4. No coin reward.
- Passage: E inside starts the tunnel; walking to the end comes out on the back beach. The beach arch goes back in.
- Hammock: E holds the captain on the roof pad. E gets up.

## Tests already run (do not rerun until resume)

`node tests/lair.mjs` — **35 passed, 0 failed**, no console errors.

Covered prices, HQ-first, slide-needs-pool, exact drops (HQ 60, pool 40, then garage 50, tower 30, trophy 25, slide 35, course 30, aqua 40, roof 25, tunnel 45), no second charge, enter/chair/tunnel/beach/dive/slide/climb/telescope/doors/hammock/course/park/launch, and reload keeping score 80, two badges, yacht, fuel 0.35/0.8, three isle discoveries, streak 6, hat, and all ten owned flags.

`node tests/sea-spread.mjs` — **78 passed, 1 failed**, then the assertion was edited and **not re-run**.

The failure was the source check still looking for `Ne.layoutVer!==3`. Behavior in that same run was good: outer save `{x:-185.4,z:114.68}` became `{x:-207.28,z:128.22}` with 77 coins, yacht, fuel, and pirate discovery kept. Inner `{x:0,z:8}` with 88 coins stayed. The edited check looks for `function relocateSave()` and `Ne.layoutVer===4`.

Headless SwiftShader, median of three ~1.2s runs:

- Sea suite: home harbor 8.6 (worst), open water 12.7, sea edge 14.0, Pirate Point 13.4.
- Lair suite, after the build: home harbor 8.2, pirate lair 7.9 (worst that run).

These are software-GL numbers, not a phone. No console errors in either run.

## Known gaps (do this after the weekly reset, not now)

1. Re-run `node tests/sea-spread.mjs` once, to confirm the edited layout assertion. Do not treat the old 1-failure log as the final sea result.
2. Screenshot sweep is not release-ready. The last desktop/portrait/landscape frames were taken **after** `enter()`, so they show the open interior, the "Exit lair" button, and a palm crown clipping the camera. Retake exterior shots before enter, from a higher dock-side camera. Also shoot the garage doors from the side and a clean interior.
3. Honest concept gap: the dome, green cap, pool, blue chute, diving board, tower, stairs, telescope, round door, and string lights read in the game's simple Lambert style. Hammocks are small pads. Garage doors sit just outside the shell and are easy to miss from the dock. The tunnel is a walk that lowers you and pops you out at a timber arch, not the cutaway's open hillside. The obstacle course is four gates on the grass, which the exterior concept did not draw clearly. Do not grow the island radius.
4. Purchase confirm UI exists (`ask` then Yes). The automated test called `commit` directly. A manual click-through of the menu is still undone.
5. Do not merge PR #1 and do not publish to https://eleveneff.github.io/captain-adventure/ until those shots and the sea re-run look right.

## Resume commands

```bash
git checkout cursor/sea-spread-lair-concepts-fa88
node tests/sea-spread.mjs
node tests/lair.mjs
```

Then retake exterior screenshots before calling `Lair.enter()`, update this file, and only then ask the owner about release.
