// The kitchen's stations: ingredient crates, the grill, the chopping board, the assembly
// plates and the bin. Each station holds its own state and advances with the clock; the
// game asks a station what an interaction does and plays the result.
import { CHEF_RADIUS, INGREDIENTS, STATIONS } from './config.js';

export const REACH = 78;

function rectOf(kind, index) {
  if (kind === 'crate') return STATIONS.crates[index];
  if (kind === 'grill') return STATIONS.grill;
  if (kind === 'chopper') return STATIONS.chopper;
  if (kind === 'assembly') return STATIONS.assembly;
  if (kind === 'bin') return STATIONS.bin;
  if (kind === 'serve') return STATIONS.serve;
  return null;
}

function distanceToRect(x, y, rect) {
  const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
  const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

export function createKitchen() {
  return {
    grill: Array.from({ length: STATIONS.grill.slots }, () => ({ item: null, phase: 'empty', timer: 0 })),
    chopper: { item: null, phase: 'empty', timer: 0 },
    plates: Array.from({ length: STATIONS.assembly.plates }, () => []),
  };
}

export function resetKitchen(kitchen) {
  for (const slot of kitchen.grill) {
    slot.item = null;
    slot.phase = 'empty';
    slot.timer = 0;
  }
  kitchen.chopper.item = null;
  kitchen.chopper.phase = 'empty';
  kitchen.chopper.timer = 0;
  for (const plate of kitchen.plates) plate.length = 0;
}

/** The distance from (x, y) to one station's rectangle (0 when overlapping it). */
export function stationDistance(x, y, kind, index) {
  return distanceToRect(x, y, rectOf(kind, index));
}

/** The nearest station within reach of (x, y), or null. Crates answer per crate. */
export function nearestStation(x, y) {
  let best = null;
  let bestDistance = REACH;
  for (let i = 0; i < STATIONS.crates.length; i += 1) {
    const distance = distanceToRect(x, y, STATIONS.crates[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { kind: 'crate', index: i };
    }
  }
  for (const kind of ['grill', 'chopper', 'assembly', 'bin']) {
    const distance = distanceToRect(x, y, rectOf(kind, 0));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { kind, index: 0 };
    }
  }
  return best;
}

/** Whether a canvas point falls on any station (for click-to-use). */
export function pointOnStation(point) {
  const all = [...STATIONS.crates, STATIONS.grill, STATIONS.chopper, STATIONS.assembly, STATIONS.bin];
  return all.some((rect) => point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h);
}

/** The centre of a station, for walking the chef to it. */
export function stationCentre(kind, index) {
  const rect = rectOf(kind, index);
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 + rect.h / 2 + CHEF_RADIUS + 8 };
}

/** The point to stand at to reach one assembly plate (left plate 0, right plate 1). */
export function plateApproachPoint(index) {
  const rect = STATIONS.assembly;
  return { x: rect.x + 78 + index * 156, y: rect.y + rect.h + CHEF_RADIUS + 8 };
}

/**
 * Advance grill and chopper timers by dt seconds. Returns events the game turns into
 * sounds and floating text: cooked, burnt and chopped.
 */
export function stepKitchen(kitchen, dt) {
  const events = [];
  for (const slot of kitchen.grill) {
    if (slot.phase === 'cooking') {
      slot.timer += dt;
      if (slot.timer >= INGREDIENTS.patty.cookSeconds) {
        slot.phase = 'cooked';
        slot.timer = 0;
        events.push({ type: 'cooked' });
      }
    } else if (slot.phase === 'cooked') {
      slot.timer += dt;
      if (slot.timer >= INGREDIENTS.patty.burnSeconds) {
        slot.phase = 'burnt';
        slot.timer = 0;
        events.push({ type: 'burnt' });
      }
    }
  }
  const chopper = kitchen.chopper;
  if (chopper.phase === 'chopping') {
    chopper.timer += dt;
    const seconds = INGREDIENTS[chopper.item].chopSeconds;
    if (chopper.timer >= seconds) {
      chopper.phase = 'done';
      chopper.timer = 0;
      events.push({ type: 'chopped' });
    }
  }
  return events;
}

/**
 * Use the station the chef stands by. `carrying` is the ingredient in the chef's hands
 * (null when empty); `matchesOrder` answers whether a plate's items complete an open
 * ticket; `chefPos` picks which assembly plate the chef means (the nearer one).
 * The return value tells the game what changed: the new carried item, or an event
 * name such as 'serve' with the plate that was served.
 */
export function interactStation(kitchen, station, carrying, matchesOrder = () => false, chefPos = null) {
  if (!station) return { type: 'none', carrying };
  if (station.kind === 'crate') {
    if (carrying !== null) return { type: 'hands-full', carrying };
    const id = STATIONS.crates[station.index].id;
    return { type: 'pickup', carrying: id };
  }
  if (station.kind === 'grill') {
    for (const slot of kitchen.grill) {
      if (carrying === 'patty' && slot.phase === 'empty') {
        slot.item = 'patty';
        slot.phase = 'cooking';
        slot.timer = 0;
        return { type: 'grill-place', carrying: null };
      }
      if (carrying === null && (slot.phase === 'cooked' || slot.phase === 'burnt')) {
        const item = slot.phase === 'cooked' ? 'patty:cooked' : 'patty:burnt';
        slot.item = null;
        slot.phase = 'empty';
        slot.timer = 0;
        return { type: 'pickup', carrying: item };
      }
    }
    if (carrying === 'patty') return { type: 'grill-full', carrying };
    return { type: 'none', carrying };
  }
  if (station.kind === 'chopper') {
    const chopper = kitchen.chopper;
    if (carrying !== null && INGREDIENTS[carrying] && INGREDIENTS[carrying].prep === 'chop' && chopper.phase === 'empty') {
      chopper.item = carrying;
      chopper.phase = 'chopping';
      chopper.timer = 0;
      return { type: 'chop-place', carrying: null };
    }
    if (carrying === null && chopper.phase === 'done') {
      const item = `${chopper.item}:chopped`;
      chopper.item = null;
      chopper.phase = 'empty';
      chopper.timer = 0;
      return { type: 'pickup', carrying: item };
    }
    if (carrying !== null && chopper.phase !== 'empty') return { type: 'chopper-busy', carrying };
    return { type: 'none', carrying };
  }
  if (station.kind === 'assembly') {
    // The plate the chef means is the nearer of the two to where they stand, so two
    // dishes can be built side by side: walk to the left plate or the right one.
    const rect = STATIONS.assembly;
    let plateIndex = 0;
    if (chefPos) {
      const centres = kitchen.plates.map((_, i) => rect.x + 78 + i * 156);
      if (Math.abs(chefPos.x - centres[1]) < Math.abs(chefPos.x - centres[0])) plateIndex = 1;
    }
    const plate = kitchen.plates[plateIndex];
    if (carrying !== null) {
      if (carrying === 'patty:burnt') return { type: 'burnt-no-plate', carrying };
      if (plate.includes(carrying)) return { type: 'already-on-plate', carrying };
      if (plate.length >= 5) return { type: 'plate-full', carrying };
      plate.push(carrying);
      return { type: 'plate-add', carrying: null, plateIndex };
    }
    // Empty hands at the assembly counter: a finished plate goes out first, otherwise
    // the chef takes the last item back off the nearer plate to fix a mistake.
    const orderByDistance = kitchen.plates
      .map((_, i) => i)
      .sort((a, b) => Math.abs((chefPos?.x ?? 0) - (rect.x + 78 + a * 156)) - Math.abs((chefPos?.x ?? 0) - (rect.x + 78 + b * 156)));
    for (const i of orderByDistance) {
      if (kitchen.plates[i].length > 0 && matchesOrder(kitchen.plates[i])) {
        const items = [...kitchen.plates[i]];
        kitchen.plates[i].length = 0;
        return { type: 'serve', carrying: null, plateIndex: i, items };
      }
    }
    for (const i of orderByDistance) {
      if (kitchen.plates[i].length > 0) {
        const item = kitchen.plates[i].pop();
        return { type: 'plate-take', carrying: item, plateIndex: i };
      }
    }
    return { type: 'none', carrying };
  }
  if (station.kind === 'bin') {
    if (carrying === null) return { type: 'none', carrying };
    return { type: 'trash', carrying: null };
  }
  return { type: 'none', carrying };
}
