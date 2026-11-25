// The order board: tickets arrive on a schedule, count down, and are matched against the
// exact set of prepared ingredients on a plate. A ticket that runs out costs a heart.
import {
  MAX_ORDERS, ORDER_FIRST_AT, ORDER_INTERVAL_MIN, ORDER_INTERVAL_SHRINK,
  ORDER_INTERVAL_START, ORDER_TIME_LIMIT_MIN, ORDER_TIME_LIMIT_SHRINK,
  ORDER_TIME_LIMIT_START, RECIPE_IDS, RECIPES, TIP_MAX,
} from './config.js';

let nextTicketId = 1;

function recipePoolFor(level) {
  return RECIPE_IDS.filter((id) => RECIPES[id].minLevel <= level);
}

function orderInterval(level) {
  return Math.max(ORDER_INTERVAL_MIN, ORDER_INTERVAL_START - (level - 1) * ORDER_INTERVAL_SHRINK);
}

function orderTimeLimit(level) {
  return Math.max(ORDER_TIME_LIMIT_MIN, ORDER_TIME_LIMIT_START - (level - 1) * ORDER_TIME_LIMIT_SHRINK);
}

export function createOrderBoard(random) {
  return {
    orders: [],
    nextAt: ORDER_FIRST_AT,
    random,
  };
}

export function resetOrderBoard(board) {
  board.orders.length = 0;
  board.nextAt = ORDER_FIRST_AT;
}

function spawnOrder(board, level) {
  const pool = recipePoolFor(level);
  const recipeId = board.random.pick(pool);
  const limit = orderTimeLimit(level);
  board.orders.push({
    id: nextTicketId,
    recipeId,
    name: RECIPES[recipeId].name,
    items: [...RECIPES[recipeId].items],
    price: RECIPES[recipeId].price,
    timeLeft: limit,
    timeLimit: limit,
  });
  nextTicketId += 1;
}

/**
 * Advance the board by dt seconds. Returns the tickets that expired this step, so the
 * game can charge a heart and play the sound for each.
 */
export function stepOrderBoard(board, dt, level) {
  const expired = [];
  board.nextAt -= dt;
  if (board.nextAt <= 0 && board.orders.length < MAX_ORDERS) {
    spawnOrder(board, level);
    board.nextAt = orderInterval(level);
  }
  for (let i = board.orders.length - 1; i >= 0; i -= 1) {
    const order = board.orders[i];
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      expired.push(order);
      board.orders.splice(i, 1);
    }
  }
  return expired;
}

/** The same multiset of prepared ingredients, in any order, completes the ticket. */
export function plateMatchesOrder(plateItems, order) {
  if (plateItems.length !== order.items.length) return false;
  const remaining = [...order.items];
  for (const item of plateItems) {
    const index = remaining.indexOf(item);
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return remaining.length === 0;
}

/** The first open ticket a plate completes, or null when no ticket matches it. */
export function findMatchingOrder(board, plateItems) {
  for (const order of board.orders) {
    if (plateMatchesOrder(plateItems, order)) return order;
  }
  return null;
}

export function removeOrder(board, orderId) {
  const index = board.orders.findIndex((order) => order.id === orderId);
  if (index !== -1) board.orders.splice(index, 1);
}

/** Coins for serving: the recipe price plus a tip that shrinks as the ticket ages. */
export function serveValue(order) {
  const fraction = Math.max(0, order.timeLeft / order.timeLimit);
  return order.price + Math.round(TIP_MAX * fraction);
}
