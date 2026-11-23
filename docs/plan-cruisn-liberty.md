# Cruis'n Liberty

Follow-up to the Liberty Isle layout. Do not build this until PR #7 is approved. PR #7 only moves the Road Trip Rally station onto Turtle Cove, with a bigger static track and a nicer parked car, so the layout can ship.

## What it is

Cruis'n Liberty is a chase-camera arcade race on the Turtle Cove track. It feels like Cruis'n USA: short, bright, and easy to steer. It is not a simulation.

The player races 3 or 4 rival cars through light traffic. A run is a chain of short US stages:

- Golden Gate and San Francisco
- Grand Canyon desert
- Chicago
- Washington, DC

Each stage has a few landmark props the player can name, a checkpoint timer, and a time extension for reaching the checkpoint. A nitro boost is available. Steering is drift-friendly and forgiving. The run ends on a podium.

Controls work with touch, the on-screen joystick, and the keyboard. The race has to hold a tablet frame rate. Bake repeated props and keep the live draw count in the same band as the rest of Liberty Isle.

## Questions and rewards

Reuse the existing rally questions and postcards. Do not add a new coin rate.

At each checkpoint, pause on one quick ISEE Lower Level geography or measurement question. A wrong answer gets the teach-it tutorial and one practice question, the same pattern the stations already use. A run asks at least 3 questions. Rewards stay on the current rally payout. Replays stay on the smaller payout. Do not inflate coins, and do not change prices.

## Saves

New race fields, if any, default safely and must not reset placed states, flags, landmarks, postcards, or coins. The static Turtle Cove track from PR #7 is the course the race drives on.
