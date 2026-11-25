// The screenshot scenes behind ?shot=title|cover|rush|serve. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a re-planning
// autopilot that always works on the oldest open ticket: it fetches what the dish needs,
// preps it at the grill or the chopping board, and builds it on a plate. The same seed
// always gives the same frame.
import { STEP } from './config.js';
import { stepWorld } from './game.js';
import { INGREDIENTS, RECIPES } from './config.js';
import { stationCentre, plateApproachPoint } from './kitchen.js';
import { setChefTarget } from './player.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;

/**
 * Send the chef to a point (a station's approach point); the world uses the station
 * on arrival when `use` is true. While the chef is already walking somewhere, the
 * autopilot waits instead of re-aiming every step.
 */
function goTo(world, point, use) {
  if (world.chef.target !== null) return { direction: [0, 0], interact: false };
  setChefTarget(world.chef, point, use);
  return { direction: [0, 0], interact: false };
}

function goToStation(world, kind, index, use = true) {
  return goTo(world, stationCentre(kind, index), use);
}

function goToPlate(world, plateIndex, use = true) {
  return goTo(world, plateApproachPoint(plateIndex), use);
}

function crateIndexFor(id) {
  return { bun: 0, patty: 1, cheese: 2, tomato: 3, lettuce: 4, onion: 5 }[id];
}

/** The plate the autopilot is filling: one already holding this ticket's items, else the left plate. */
function targetPlateIndex(world, order) {
  for (let i = 0; i < world.kitchen.plates.length; i += 1) {
    if (world.kitchen.plates[i].some((item) => order.items.includes(item))) return i;
  }
  return 0;
}

function plateHas(plate, item) {
  return plate.includes(item);
}

/**
 * One autopilot step toward finishing the oldest ticket. `serveWhenDone` serves the
 * dish once the plate is complete; `stopOneShort` leaves the last item in the chef's
 * hands beside the assembly counter, for the mid-assembly cover shot.
 */
function autopilotStep(world, serveWhenDone, stopOneShort) {
  const chef = world.chef;
  const board = world.board;
  if (board.orders.length === 0) return { direction: [0, 0], interact: false };
  const order = board.orders[0];
  const plateIndex = targetPlateIndex(world, order);
  const plate = world.kitchen.plates[plateIndex];
  const needed = order.items.filter((item) => !plateHas(plate, item));
  const carrying = chef.carrying;

  // The dish is done: serve it, or stand by the plate with the last item for the cover shot.
  if (needed.length === 0) {
    if (serveWhenDone) return goToPlate(world, plateIndex, true);
    return { direction: [0, 0], interact: false };
  }
  if (stopOneShort && needed.length === 1 && carrying === needed[0]) {
    return goToPlate(world, plateIndex, false);
  }

  // Burnt food goes in the bin before anything else.
  if (carrying === 'patty:burnt') return goToStation(world, 'bin', 0);

  // The chef carries something: take it where it belongs.
  if (carrying !== null) {
    if (needed.includes(carrying)) return goToPlate(world, plateIndex, true);
    const base = carrying.split(':')[0];
    const info = INGREDIENTS[base];
    if (info && info.prep === 'grill' && carrying === 'patty') return goToStation(world, 'grill', 0);
    if (info && info.prep === 'chop') return goToStation(world, 'chopper', 0);
    return goToStation(world, 'bin', 0);
  }

  // Empty hands: fetch the first missing item, prepping it on the way if it needs it.
  const next = needed[0];
  const base = next.split(':')[0];
  const info = INGREDIENTS[base];
  if (next === 'patty:cooked') {
    const cooked = world.kitchen.grill.findIndex((slot) => slot.phase === 'cooked');
    if (cooked !== -1) return goToStation(world, 'grill', 0);
    const burnt = world.kitchen.grill.findIndex((slot) => slot.phase === 'burnt');
    if (burnt !== -1) return goToStation(world, 'grill', 0);
    const cooking = world.kitchen.grill.some((slot) => slot.phase === 'cooking');
    if (cooking) return { direction: [0, 0], interact: false };
    return goToStation(world, 'crate', crateIndexFor('patty'));
  }
  if (next.endsWith(':chopped')) {
    const chopper = world.kitchen.chopper;
    if (chopper.phase === 'done' && chopper.item === base) return goToStation(world, 'chopper', 0);
    if (chopper.phase === 'chopping' && chopper.item === base) return { direction: [0, 0], interact: false };
    return goToStation(world, 'crate', crateIndexFor(base));
  }
  return goToStation(world, 'crate', crateIndexFor(base));
}

function runFor(world, seconds, decide) {
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    const action = decide(world);
    stepWorld(world, action.direction, action.interact);
    if (world.over) break;
  }
}

/** Run the autopilot until one dish is served (or the time runs out). */
function serveOneDish(world, limitSeconds) {
  const steps = Math.round(limitSeconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    const before = world.served;
    const action = autopilotStep(world, true, false);
    stepWorld(world, action.direction, action.interact);
    if (world.served > before || world.over) return true;
  }
  return false;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Scenes: title (menu over a live kitchen), cover (a dish mid-assembly, the judge's
 * first look), rush (the lunch rush at full tilt), serve (a dish just served).
 */
export function stageShot(name, world) {
  if (name === 'title') {
    runFor(world, 6, () => ({ direction: [0, 0], interact: false }));
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'cover') {
    // Build the oldest ticket until one item is left, then hold it by the counter.
    runFor(world, 40, (w) => autopilotStep(w, false, true));
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    serveOneDish(world, 60);
    // Let the "+$…" float rise for a beat so the frame catches the payoff.
    runFor(world, 0.45, () => ({ direction: [0, 0], interact: false }));
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: 0 };
  }
  // rush: serve two dishes, then get the grill and the chopping board busy at once.
  serveOneDish(world, 60);
  serveOneDish(world, 60);
  const grillBusy = () => world.kitchen.grill.some((slot) => slot.phase === 'cooking' || slot.phase === 'cooked');
  const boardBusy = () => world.kitchen.chopper.phase === 'chopping' || world.kitchen.chopper.phase === 'done';
  for (let i = 0; i < Math.round(25 / SAMPLE) && !(grillBusy() && boardBusy()); i += 1) {
    const chef = world.chef;
    let action;
    // Staging only: anything in hand that is not part of this setup goes in the bin,
    // so the chef never stands around holding food while the frame waits.
    if (chef.carrying !== null && chef.carrying !== 'patty' && chef.carrying !== 'tomato') action = goToStation(world, 'bin', 0);
    else if (chef.carrying === 'patty') action = goToStation(world, 'grill', 0);
    else if (chef.carrying === 'tomato') action = goToStation(world, 'chopper', 0);
    else if (!grillBusy()) action = goToStation(world, 'crate', crateIndexFor('patty'));
    else if (world.kitchen.chopper.phase === 'empty') action = goToStation(world, 'crate', crateIndexFor('tomato'));
    else action = { direction: [0, 0], interact: false };
    stepWorld(world, action.direction, action.interact);
    if (world.over) break;
  }
  runFor(world, 1, () => ({ direction: [0, 0], interact: false }));
  return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: 0 };
}

export { RECIPES };
