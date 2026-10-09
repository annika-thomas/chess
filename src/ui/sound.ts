import { state } from '../engine/store';

let ctx: AudioContext | undefined;

function tone(freqs: number[], dur = 0.09, type: OscillatorType = 'sine', gain = 0.08): void {
  if (!state.settings.sound) return;
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const f of freqs) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.8);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur * 2);
      t += dur;
    }
  } catch {
    /* audio unavailable */
  }
}

export const sound = {
  move: () => tone([520], 0.04, 'triangle', 0.06),
  capture: () => tone([340], 0.05, 'triangle', 0.08),
  correct: () => tone([660, 880], 0.08),
  wrong: () => tone([300, 220], 0.1, 'square', 0.04),
  finish: () => tone([523, 659, 784, 1046], 0.1),
};
