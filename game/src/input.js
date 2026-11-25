// Keyboard and pointer input. The chef moves with WASD or arrows; E or Space uses the
// nearest station. Clicking (or tapping) a spot walks the chef there, and clicking a station
// walks over and uses it on arrival, so the whole game plays with the mouse alone too.
export const ACTION_INTERACT = 1;
export const ACTION_CONFIRM = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;

const MOVE_KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

export function createInput(canvas) {
  const held = new Set();
  let queuedActions = 0;
  // A click target in canvas coordinates, or null when the chef walks free.
  let moveTarget = null;
  let interactOnArrive = false;
  // Set by the game: given a canvas point, answers whether it is on a usable station.
  let stationHit = null;

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    if (MOVE_KEYS[event.code]) {
      held.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      queuedActions |= ACTION_INTERACT;
      event.preventDefault();
    } else if (event.code === 'Enter') {
      queuedActions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      queuedActions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      queuedActions |= ACTION_MUTE;
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onPointerDown(event) {
    const point = toCanvas(event);
    moveTarget = point;
    // A click on a station means "go there and use it"; anywhere else just walks.
    interactOnArrive = stationHit ? Boolean(stationHit(point)) : false;
    queuedActions |= ACTION_CONFIRM;
    event.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    // The held-key direction, normalised; [0, 0] when no move key is down.
    direction() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        const delta = MOVE_KEYS[code];
        if (delta) {
          x += delta[0];
          y += delta[1];
        }
      }
      if (x === 0 && y === 0) return [0, 0];
      const length = Math.hypot(x, y);
      return [x / length, y / length];
    },
    takeActions() {
      const actions = queuedActions;
      queuedActions = 0;
      return actions;
    },
    takeMoveTarget() {
      const target = moveTarget;
      moveTarget = null;
      return target;
    },
    peekMoveTarget() {
      return moveTarget;
    },
    clearMoveTarget() {
      moveTarget = null;
      interactOnArrive = false;
    },
    takeInteractOnArrive() {
      const value = interactOnArrive;
      interactOnArrive = false;
      return value;
    },
    // The game tells input which point counts as a station, so a click on one can auto-use it.
    setStationHitTest(fn) {
      stationHit = fn;
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
    },
  };
}
