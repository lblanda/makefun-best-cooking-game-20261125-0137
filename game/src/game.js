// Sizzle & Serve — the world: one kitchen, one chef, a board of tickets, and the clock.
// The world is pure logic: it takes a step of fixed length and answers with events
// (sounds, floating text, screen changes) the shell turns into feedback.
import { CHEF_RADIUS, HEARTS, LEVEL_SECONDS, STEP } from './config.js';
import { createRandom } from './rng.js';
import {
  createOrderBoard, findMatchingOrder, removeOrder, resetOrderBoard,
  serveValue, stepOrderBoard,
} from './orders.js';
import {
  createKitchen, interactStation, nearestStation, resetKitchen,
  stationCentre, stepKitchen,
} from './kitchen.js';
import { clearChefTarget, createChef, resetChef, setChefTarget, stepChef } from './player.js';

export const EVENT_ORDER = 1;
export const EVENT_SERVED = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_COOKED = 8;
export const EVENT_BURNT = 16;
export const EVENT_CHOPPED = 32;
export const EVENT_ERROR = 64;
export const EVENT_OVER = 128;
export const EVENT_PICKUP = 256;

export function createWorld(random) {
  return {
    random: random ?? createRandom((Math.random() * 4294967296) >>> 0),
    chef: createChef(),
    kitchen: createKitchen(),
    board: null,
    elapsed: 0,
    coins: 0,
    served: 0,
    hearts: HEARTS,
    level: 1,
    over: false,
    // Floating "+$18" texts and steam puffs the renderer draws.
    floats: [],
    particles: [],
    message: '',
    messageTimer: 0,
    // The station the chef is about to use, highlighted by the renderer.
    nearStation: null,
  };
}

export function resetWorld(world) {
  world.board = createOrderBoard(world.random);
  resetOrderBoard(world.board);
  resetChef(world.chef);
  resetKitchen(world.kitchen);
  world.elapsed = 0;
  world.coins = 0;
  world.served = 0;
  world.hearts = HEARTS;
  world.level = 1;
  world.over = false;
  world.floats.length = 0;
  world.particles.length = 0;
  world.message = '';
  world.messageTimer = 0;
  world.nearStation = null;
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1.2 });
}

function puff(world, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    world.particles.push({
      x: x + (world.random.next() - 0.5) * 30,
      y: y + (world.random.next() - 0.5) * 12,
      vx: (world.random.next() - 0.5) * 20,
      vy: -18 - world.random.next() * 22,
      life: 0.7 + world.random.next() * 0.5,
      maxLife: 1.2,
      color,
      size: 3 + world.random.next() * 4,
    });
  }
}

function showMessage(world, text, seconds = 2) {
  world.message = text;
  world.messageTimer = seconds;
}

/** Walk the chef to a clicked point; a click on a station approaches it to use it. */
export function queueMoveTarget(world, point, useOnArrive) {
  if (useOnArrive) {
    const station = nearestStation(point.x, point.y);
    if (station) {
      const centre = stationCentre(station.kind, station.index);
      setChefTarget(world.chef, { x: centre.x, y: Math.min(centre.y, 760) }, true);
      return;
    }
  }
  setChefTarget(world.chef, point, useOnArrive);
}

function useNearestStation(world) {
  const chef = world.chef;
  const station = nearestStation(chef.x, chef.y);
  if (!station) return EVENT_ERROR;
  const result = interactStation(world.kitchen, station, chef.carrying, (items) => {
    const order = findMatchingOrder(world.board, items);
    return order !== null;
  }, chef);
  chef.carrying = result.carrying;
  switch (result.type) {
    case 'pickup':
      return EVENT_PICKUP;
    case 'grill-place':
      showMessage(world, 'Patty on the grill — watch it cook!');
      return EVENT_PICKUP;
    case 'chop-place':
      showMessage(world, 'Chopping…');
      return EVENT_PICKUP;
    case 'plate-add': {
      puff(world, chef.x, chef.y - 30, '#ffd166', 4);
      return EVENT_PICKUP;
    }
    case 'plate-take':
      return EVENT_PICKUP;
    case 'trash':
      showMessage(world, 'Tossed it.');
      return EVENT_PICKUP;
    case 'serve': {
      const order = findMatchingOrder(world.board, result.items);
      if (!order) return EVENT_ERROR;
      const value = serveValue(order);
      removeOrder(world.board, order.id);
      world.coins += value;
      world.served += 1;
      addFloat(world, 1076, 360, `+$${value}`, '#ffd166');
      puff(world, 1076, 360, '#ffd166', 10);
      showMessage(world, `${order.name} served! +$${value}`);
      return EVENT_SERVED;
    }
    case 'hands-full':
      showMessage(world, 'Hands full — put this down first.');
      return EVENT_ERROR;
    case 'grill-full':
      showMessage(world, 'The grill is full!');
      return EVENT_ERROR;
    case 'chopper-busy':
      showMessage(world, 'The board is busy — come back in a moment.');
      return EVENT_ERROR;
    case 'burnt-no-plate':
      showMessage(world, 'Burnt! That goes in the bin, not on a plate.');
      return EVENT_ERROR;
    case 'already-on-plate':
      showMessage(world, 'That is already on the plate.');
      return EVENT_ERROR;
    case 'plate-full':
      showMessage(world, 'The plate is full.');
      return EVENT_ERROR;
    default:
      return 0;
  }
}

/**
 * Advance the world one fixed step. `direction` is the held-key move direction;
 * `interact` is true on the step the player pressed E / Space / clicked a station.
 * Returns a bitmask of events for sounds and announcements.
 */
export function stepWorld(world, direction, interact, demo = false) {
  if (world.over) return 0;
  let events = 0;
  world.elapsed += STEP;
  world.level = 1 + Math.floor(world.elapsed / LEVEL_SECONDS);

  const arrivedUse = stepChef(world.chef, direction, STEP);
  if (interact || arrivedUse) events |= useNearestStation(world);

  const kitchenEvents = stepKitchen(world.kitchen, STEP);
  for (const event of kitchenEvents) {
    if (event.type === 'cooked') {
      events |= EVENT_COOKED;
      showMessage(world, 'Patty cooked — grab it before it burns!');
      puff(world, 168, 330, '#ffffff', 6);
    } else if (event.type === 'burnt') {
      events |= EVENT_BURNT;
      showMessage(world, 'A patty burnt on the grill!');
      puff(world, 168, 330, '#555555', 8);
    } else if (event.type === 'chopped') {
      events |= EVENT_CHOPPED;
      puff(world, 441, 330, '#b7e4a8', 6);
    }
  }

  const before = world.board.orders.length;
  const expired = stepOrderBoard(world.board, STEP, world.level);
  if (world.board.orders.length > before) events |= EVENT_ORDER;
  for (const order of expired) {
    world.hearts -= 1;
    events |= EVENT_EXPIRED;
    showMessage(world, `Too slow — ${order.name} walked out! -1 ♥`);
    if (world.hearts <= 0) {
      world.over = true;
      events |= EVENT_OVER;
    }
  }

  world.nearStation = nearestStation(world.chef.x, world.chef.y);
  if (world.messageTimer > 0) world.messageTimer -= STEP;
  else world.message = '';
  for (let i = world.floats.length - 1; i >= 0; i -= 1) {
    const item = world.floats[i];
    item.life -= STEP;
    item.y -= 28 * STEP;
    if (item.life <= 0) world.floats.splice(i, 1);
  }
  for (let i = world.particles.length - 1; i >= 0; i -= 1) {
    const item = world.particles[i];
    item.life -= STEP;
    item.x += item.vx * STEP;
    item.y += item.vy * STEP;
    if (item.life <= 0) world.particles.splice(i, 1);
  }
  if (demo) clearChefTarget(world.chef);
  return events;
}

/** The chef's distance to the nearest station, for the renderer's highlight. */
export function chefReach(world) {
  return world.nearStation !== null;
}

export { CHEF_RADIUS };
