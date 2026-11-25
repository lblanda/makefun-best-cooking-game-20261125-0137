// All sound is synthesised with WebAudio: short blips and filtered noise, no audio files.
// The context is created lazily on the first user gesture, so a silent page load stays silent.
let context = null;
let muted = false;
let sizzleNodes = null;

function audioContext() {
  if (context) return context;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

export function unlockAudio() {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  if (muted) stopSizzle();
}

export function isMuted() {
  return muted;
}

function tone(freq, duration, type, gainValue, when = 0, slideTo = null) {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function noiseBurst(duration, gainValue, filterFreq) {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export const sfx = {
  pickup() { tone(520, 0.07, 'sine', 0.12); },
  drop() { tone(340, 0.07, 'sine', 0.1); },
  chop() { noiseBurst(0.09, 0.25, 1800); },
  chopped() { tone(660, 0.09, 'triangle', 0.14); tone(880, 0.12, 'triangle', 0.12, 0.08); },
  grillOn() { tone(220, 0.1, 'sawtooth', 0.06, 0, 180); },
  cooked() { tone(740, 0.1, 'sine', 0.14); tone(988, 0.14, 'sine', 0.12, 0.09); },
  burnt() { tone(160, 0.3, 'sawtooth', 0.12, 0, 90); },
  orderUp() { tone(880, 0.1, 'triangle', 0.14); tone(1174, 0.16, 'triangle', 0.14, 0.1); },
  serve() {
    tone(523, 0.1, 'triangle', 0.16);
    tone(659, 0.1, 'triangle', 0.16, 0.09);
    tone(784, 0.18, 'triangle', 0.18, 0.18);
  },
  coin() { tone(1318, 0.08, 'sine', 0.12); tone(1760, 0.14, 'sine', 0.1, 0.07); },
  error() { tone(140, 0.18, 'square', 0.1, 0, 110); },
  expired() { tone(392, 0.16, 'triangle', 0.14); tone(311, 0.24, 'triangle', 0.14, 0.14); },
  start() {
    tone(523, 0.09, 'triangle', 0.14);
    tone(659, 0.09, 'triangle', 0.14, 0.08);
    tone(784, 0.16, 'triangle', 0.16, 0.16);
  },
  gameOver() {
    tone(523, 0.2, 'triangle', 0.14);
    tone(415, 0.2, 'triangle', 0.14, 0.18);
    tone(330, 0.36, 'triangle', 0.14, 0.36);
  },
};

// A soft looping hiss while any patty is on the grill; started and stopped by the game.
export function startSizzle() {
  if (muted || sizzleNodes) return;
  const ctx = audioContext();
  if (!ctx) return;
  const length = ctx.sampleRate * 1;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4000;
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  sizzleNodes = { source, gain };
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try { sizzleNodes.source.stop(); } catch { /* already stopped */ }
  sizzleNodes = null;
}
