// Tiny synthesized sound effects (no audio files). Muted state is remembered.
const KEY = 'studyforge:muted';
let ctx = null;
let muted = false;

try {
  muted = localStorage.getItem(KEY) === '1';
} catch {
  /* storage unavailable */
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, duration, { type = 'sine', gain = 0.07 } = {}) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  tick: () => tone(660, 0, 0.07, { type: 'square', gain: 0.035 }),
  go: () => {
    tone(523, 0, 0.12);
    tone(784, 0.1, 0.22);
  },
  correct: (streak = 1) => {
    const base = 523 * Math.pow(1.0595, Math.min(streak, 8) * 2);
    tone(base, 0, 0.12, { type: 'triangle' });
    tone(base * 1.5, 0.09, 0.2, { type: 'triangle' });
  },
  wrong: () => {
    tone(196, 0, 0.18, { type: 'sawtooth', gain: 0.05 });
    tone(147, 0.12, 0.28, { type: 'sawtooth', gain: 0.05 });
  },
  freeze: () => {
    tone(880, 0, 0.1);
    tone(1175, 0.08, 0.1);
    tone(1568, 0.16, 0.2);
  },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, { type: 'triangle' })),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, { type: 'triangle', gain: 0.05 })),
};
