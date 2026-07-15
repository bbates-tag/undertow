// ZzFX - Zuper Zmall Zound Zynth v1.3.1 (adapted)
// By Frank Force 2019 — public domain (MIT-0 / CC0-style "do what you want").
// https://github.com/KilledByAPixel/ZzFX
// Adapted to TypeScript with a shared AudioContext + master gain so the game
// synthesizes every sound effect at runtime — no audio files shipped.

export const zzfxR = 44100;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function audioContext(): AudioContext | null {
  return ctx;
}

export function ensureAudio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  // never auto-resume while the page is hidden — the visibility handler
  // suspended it on purpose (backgrounded tab / app-switched phone)
  if (ctx.state === 'suspended' && !document.hidden) void ctx.resume();
  return ctx;
}

/** Silence everything when the tab is hidden (phone home screen, tab switch),
    pick up where we left off when it returns. Install once at app boot. */
export function installAudioVisibilityHandler() {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) {
      if (ctx.state === 'running') void ctx.suspend();
    } else if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  });
}

export function masterGain(): GainNode | null {
  return master;
}

export function setMasterVolume(v: number) {
  if (master) master.gain.value = v;
}

export type ZzfxParams = (number | undefined)[];

export function zzfx(...params: ZzfxParams): void {
  const c = ensureAudio();
  const samples = zzfxG(...params);
  const buffer = c.createBuffer(1, samples.length, zzfxR);
  buffer.getChannelData(0).set(samples);
  const source = c.createBufferSource();
  source.buffer = buffer;
  source.connect(master!);
  source.start();
}

// eslint-disable-next-line complexity
export function zzfxG(
  volume = 1, randomness = 0.05, frequency = 220, attack = 0, sustain = 0,
  release = 0.1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0,
  pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0, modulation = 0,
  bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0, filter = 0,
): number[] {
  const PI2 = Math.PI * 2;
  const sign = (v: number) => (v < 0 ? -1 : 1);
  let startSlide = (slide *= (500 * PI2) / zzfxR / zzfxR);
  const startFrequencyBase = (frequency *= ((1 + randomness * 2 * Math.random() - randomness) * PI2) / zzfxR);
  let startFrequency = startFrequencyBase;
  const b: number[] = [];
  let t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f: number;

  // biquad LP/HP filter
  const quality = 2;
  const w = (PI2 * Math.abs(filter) * 2) / zzfxR;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / 2 / quality;
  const a0 = 1 + alpha;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  const b0 = (1 + sign(filter) * cos) / 2 / a0;
  const b1 = -(sign(filter) + cos) / a0;
  const b2 = b0;
  let x2 = 0, x1 = 0, y2 = 0, y1 = 0;

  // scale by sample rate
  attack = attack * zzfxR + 9; // minimum attack to prevent pop
  decay *= zzfxR;
  sustain *= zzfxR;
  release *= zzfxR;
  delay *= zzfxR;
  deltaSlide *= (500 * PI2) / zzfxR ** 3;
  modulation *= PI2 / zzfxR;
  pitchJump *= PI2 / zzfxR;
  pitchJumpTime *= zzfxR;
  repeatTime = (repeatTime * zzfxR) | 0;
  volume *= 0.3;

  const length = (attack + decay + sustain + release + delay) | 0;
  for (; i < length; b[i++] = s * volume) {
    if (!(++c % ((bitCrush * 100) | 0 || 1)) || !bitCrush) {
      s = shape
        ? shape > 1
          ? shape > 2
            ? shape > 3
              ? Math.sin(t ** 3) // 4: noise
              : Math.max(Math.min(Math.tan(t), 1), -1) // 3: tan
            : 1 - (((2 * t) / PI2) % 2 + 2) % 2 // 2: saw
          : 1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) // 1: triangle
        : Math.sin(t); // 0: sin

      s =
        (repeatTime ? 1 - tremolo + tremolo * Math.sin((PI2 * i) / repeatTime) : 1) *
        sign(s) *
        Math.abs(s) ** shapeCurve *
        (i < attack
          ? i / attack
          : i < attack + decay
            ? 1 - ((i - attack) / decay) * (1 - sustainVolume)
            : i < attack + decay + sustain
              ? sustainVolume
              : i < length - delay
                ? ((length - i - delay) / release) * sustainVolume
                : 0);

      s = delay
        ? s / 2 +
          (delay > i
            ? 0
            : ((i < length - delay ? 1 : (length - i) / delay) * b[(i - delay) | 0]) / 2 / volume)
        : s;

      if (filter) s = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = s) - a2 * y2 - a1 * (y2 = y1);
    }

    f = (frequency += slide += deltaSlide) * Math.cos(modulation * tm++);
    t += f + f * noise * Math.sin(i ** 5);

    if (j && ++j > pitchJumpTime) {
      frequency += pitchJump;
      startFrequency += pitchJump;
      j = 0;
    }

    if (repeatTime && !(++r % repeatTime)) {
      frequency = startFrequency;
      slide = startSlide;
      j = j || 1;
    }
  }
  return b;
}
