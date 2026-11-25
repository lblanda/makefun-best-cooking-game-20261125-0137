// The chef: a circle that walks the kitchen floor, steered by keys or by a click target,
// and stopped by counters and walls. Key movement is direct and axis-separated, so
// sliding along a counter feels smooth instead of sticking on its corner. A click target
// is reached by a short breadth-first path over the open floor, so the chef walks around
// a counter instead of wedging into its corner.
import { CANVAS_HEIGHT, CANVAS_WIDTH, CHEF_RADIUS, CHEF_SPEED, STATIONS, TOP_BAR_HEIGHT } from './config.js';

const WALLS = [
  { x: 0, y: TOP_BAR_HEIGHT, w: CANVAS_WIDTH, h: 8 },
  { x: 0, y: CANVAS_HEIGHT - 8, w: CANVAS_WIDTH, h: 8 },
  { x: 0, y: TOP_BAR_HEIGHT, w: 8, h: CANVAS_HEIGHT - TOP_BAR_HEIGHT },
  { x: CANVAS_WIDTH - 8, y: TOP_BAR_HEIGHT, w: 8, h: CANVAS_HEIGHT - TOP_BAR_HEIGHT },
];

function solidRects() {
  return [
    ...WALLS,
    ...STATIONS.crates,
    STATIONS.grill,
    STATIONS.chopper,
    STATIONS.assembly,
    STATIONS.bin,
    STATIONS.serve,
  ];
}

function hitsAny(x, y, radius, rects) {
  for (const rect of rects) {
    const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    const dx = x - closestX;
    const dy = y - closestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

// The pathfinding grid: 40 px cells over the kitchen floor.
const CELL = 40;
const COLS = Math.ceil(CANVAS_WIDTH / CELL);
const ROWS = Math.ceil(CANVAS_HEIGHT / CELL);

function cellOf(x, y) {
  return {
    col: Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))),
    row: Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL))),
  };
}

function cellCentre(col, row) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

function walkable(col, row, rects) {
  const centre = cellCentre(col, row);
  return !hitsAny(centre.x, centre.y, CHEF_RADIUS + 2, rects);
}

const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/** A path of floor points from (fromX, fromY) to (toX, toY), or null when unreachable. */
export function findPath(fromX, fromY, toX, toY) {
  const rects = solidRects();
  const start = cellOf(fromX, fromY);
  const goal = cellOf(toX, toY);
  const key = (col, row) => row * COLS + col;
  const cameFrom = new Map();
  const queue = [start];
  cameFrom.set(key(start.col, start.row), null);
  // The goal cell itself may sit inside a counter's margin; take the nearest walkable one.
  let goalCell = goal;
  if (!walkable(goal.col, goal.row, rects)) {
    let best = null;
    let bestDistance = Infinity;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (!walkable(col, row, rects)) continue;
        const distance = Math.hypot(col - goal.col, row - goal.row);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = { col, row };
        }
      }
    }
    if (!best) return null;
    goalCell = best;
  }
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.col === goalCell.col && current.row === goalCell.row) {
      const path = [];
      let cell = current;
      while (cell) {
        path.unshift(cellCentre(cell.col, cell.row));
        cell = cameFrom.get(key(cell.col, cell.row));
      }
      path.push({ x: toX, y: toY });
      return path;
    }
    for (const [dc, dr] of DIRS) {
      const next = { col: current.col + dc, row: current.row + dr };
      if (next.col < 0 || next.col >= COLS || next.row < 0 || next.row >= ROWS) continue;
      if (cameFrom.has(key(next.col, next.row))) continue;
      if (!walkable(next.col, next.row, rects)) continue;
      // No cutting corners: a diagonal step needs both neighbours open.
      if (dc !== 0 && dr !== 0) {
        if (!walkable(current.col + dc, current.row, rects) || !walkable(current.col, current.row + dr, rects)) continue;
      }
      cameFrom.set(key(next.col, next.row), current);
      queue.push(next);
    }
  }
  return null;
}

export function createChef() {
  return {
    x: CANVAS_WIDTH / 2,
    y: 640,
    carrying: null,
    facing: 1,
    moving: false,
    walkPhase: 0,
    // A click target the chef walks toward, or null.
    target: null,
    // The path of floor points to the target, or null.
    path: null,
    // Whether to use the station on arrival (a click on a station sets this).
    useOnArrive: false,
  };
}

export function resetChef(chef) {
  chef.x = CANVAS_WIDTH / 2;
  chef.y = 640;
  chef.carrying = null;
  chef.facing = 1;
  chef.moving = false;
  chef.walkPhase = 0;
  chef.target = null;
  chef.path = null;
  chef.useOnArrive = false;
}

export function setChefTarget(chef, target, useOnArrive) {
  chef.target = target;
  chef.useOnArrive = useOnArrive;
  chef.path = findPath(chef.x, chef.y, target.x, target.y);
  if (!chef.path) chef.target = null;
}

export function clearChefTarget(chef) {
  chef.target = null;
  chef.path = null;
  chef.useOnArrive = false;
}

function moveToward(chef, x, y, dt, rects) {
  const dx = x - chef.x;
  const dy = y - chef.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;
  const speed = CHEF_SPEED * dt;
  const stepX = (dx / distance) * speed;
  const stepY = (dy / distance) * speed;
  let movedX = 0;
  let movedY = 0;
  if (!hitsAny(chef.x + stepX, chef.y, CHEF_RADIUS, rects)) {
    chef.x += stepX;
    movedX = stepX;
  }
  if (!hitsAny(chef.x, chef.y + stepY, CHEF_RADIUS, rects)) {
    chef.y += stepY;
    movedY = stepY;
  }
  chef.moving = movedX !== 0 || movedY !== 0;
  if (chef.moving) {
    if (movedX !== 0) chef.facing = movedX > 0 ? 1 : -1;
    chef.walkPhase += dt * 10;
  }
}

/**
 * Move the chef one step. `direction` is the held-key direction [x, y] (or [0, 0]);
 * a click target steers along its path instead when no key is held. Returns true when
 * the chef arrived at a click target that wants a station use.
 */
export function stepChef(chef, direction, dt) {
  const rects = solidRects();
  if (direction[0] !== 0 || direction[1] !== 0) {
    // Keys steer directly and cancel any click target.
    chef.target = null;
    chef.path = null;
    chef.useOnArrive = false;
    const length = Math.hypot(direction[0], direction[1]) || 1;
    moveToward(chef, chef.x + (direction[0] / length) * 10, chef.y + (direction[1] / length) * 10, dt, rects);
    return false;
  }
  if (chef.path && chef.path.length > 0) {
    const next = chef.path[0];
    const distance = Math.hypot(next.x - chef.x, next.y - chef.y);
    if (distance < 12) {
      chef.path.shift();
      if (chef.path.length === 0) {
        chef.path = null;
        chef.target = null;
        const use = chef.useOnArrive;
        chef.useOnArrive = false;
        chef.moving = false;
        return use;
      }
      return false;
    }
    moveToward(chef, next.x, next.y, dt, rects);
    return false;
  }
  chef.moving = false;
  return false;
}
