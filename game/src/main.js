// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=title|cover|rush|serve (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './rng.js';
import { createWorld, resetWorld, stepWorld, queueMoveTarget, EVENT_OVER, EVENT_SERVED, EVENT_EXPIRED, EVENT_COOKED, EVENT_BURNT, EVENT_CHOPPED, EVENT_ERROR, EVENT_ORDER } from './game.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { sfx, startSizzle, stopSizzle, unlockAudio, setMuted, isMuted } from './audio.js';
import { pointOnStation } from './kitchen.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function playEvents(events) {
  if (events & EVENT_ORDER) sfx.orderUp();
  if (events & EVENT_SERVED) sfx.serve();
  if (events & EVENT_EXPIRED) sfx.expired();
  if (events & EVENT_COOKED) sfx.cooked();
  if (events & EVENT_BURNT) sfx.burnt();
  if (events & EVENT_CHOPPED) sfx.chopped();
  if (events & EVENT_ERROR) sfx.error();
  if (events & EVENT_OVER) sfx.gameOver();
  const grilling = world.kitchen.grill.some((slot) => slot.phase === 'cooking');
  if (grilling) startSizzle();
  else stopSizzle();
}

function runShot(name) {
  resetWorld(world);
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  input.setStationHitTest((point) => pointOnStation(point));
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    resetWorld(world);
    accumulator = 0;
    screen = SCREEN_PLAY;
    sfx.start();
    announce('Playing. Serve the tickets before they run out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    stopSizzle();
    if (world.coins > best) {
      best = world.coins;
      saveBest(best);
    }
    announce(`Service over. ${world.served} dishes served, $${world.coins} earned. Best $${best}.`);
  }

  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      setMuted(!isMuted());
      announce(isMuted() ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      unlockAudio();
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      stopSizzle();
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    // A click walks the chef; the input already decided whether it means "use".
    const target = input.peekMoveTarget();
    if (target && screen === SCREEN_PLAY) {
      input.takeMoveTarget();
      const use = input.takeInteractOnArrive();
      queueMoveTarget(world, target, use);
    } else if (target) {
      input.takeMoveTarget();
      input.takeInteractOnArrive();
    }
  }

  function step(interact) {
    if (screen === SCREEN_TITLE) {
      stepWorld(world, [0, 0], false);
      return;
    }
    const events = stepWorld(world, input.direction(), interact);
    playEvents(events);
    if (events & EVENT_OVER) endGame();
    else if (events & EVENT_SERVED) announce(`Served! $${world.coins} earned, ${world.served} dishes.`);
    else if (events & EVENT_EXPIRED) announce(`An order walked out. ${world.hearts} hearts left.`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(Boolean(actions & ACTION_INTERACT));
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting tickets run out unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      stopSizzle();
      announce('Paused.');
    }
  });

  resetWorld(world);
  announce('Sizzle and Serve. Press Space or click to start cooking.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
