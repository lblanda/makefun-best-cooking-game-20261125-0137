# Sizzle & Serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/lblanda/makefun-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/lblanda/makefun-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle & Serve is a fast-paced cooking game: run a kitchen against the clock. Tickets arrive on the order board — fetch ingredients from the crates, chop them on the board, grill the patties (and grab them before they burn), build each dish on a plate, and serve it before its ticket runs out. Serve fast for bigger tips; three walked-out orders close the kitchen for the day. Recipes grow with the day: Classic Burger and Garden Salad from the start, Cheeseburger from Day 2, Deluxe Burger from Day 3.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network: the game is static files under `game/`.

## Play

- **WASD / arrows** — move the chef
- **E / Space** — use the nearest station (take, chop, grill, plate, serve, bin)
- **Click a station** — walk over and use it; **click anywhere** — walk there
- **P** — pause · **M** — mute

The grill takes 6 seconds a patty and burns it 5 seconds later; the chopping board takes 2.5 seconds. A plate only serves when its items exactly match an open ticket — extra items can be taken back off the plate, and burnt food belongs in the bin.

## How it is built

Plain HTML, CSS and canvas JavaScript under `game/src/`, one file per job: the numbers and recipes (`config.js`), the seeded random generator (`rng.js`), the order board and its tickets (`orders.js`), the stations — crates, grill, chopping board, plates, bin (`kitchen.js`), the chef and its pathfinding (`player.js`), the world and its rules (`game.js`), synthesized WebAudio sound (`audio.js`), all the drawing (`render.js`), the staged screenshot scenes (`shots.js`), and input (`input.js`). `main.ts` hands the game in to make.fun.

---

<sub>Entered on [make.fun](https://make.fun/?ref=3zwarjv0&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
