// Generative underwater ambience — no audio files. A slow drone pair under a
// lowpass, a brown-noise "pressure bed", and sparse pentatonic droplets fed
// through a feedback delay.
//
// Moods are parameter presets on the same graph so transitions crossfade
// smoothly. Boss fights add real menace: a war-drum heartbeat, a tritone
// dread layer beating against the root drone, a brighter (angrier) filter,
// quicker swells, and darker, denser droplets.

import { ensureAudio } from './zzfx';

export type Mood = 'calm' | 'battle' | 'boss';

interface MoodPreset {
  filterHz: number;
  swellHz: number;
  noiseGain: number;
  pulseGain: number; // minor-third pulse (C2 against the A1 root)
  pulseWobble: number;
  tritoneGain: number; // Eb2 against A1 — pure dread
  drums: boolean;
  dropletMin: number;
  dropletVar: number;
  dropletOctaveDown: boolean;
}

const MOODS: Record<Mood, MoodPreset> = {
  calm: { filterHz: 260, swellHz: 0.045, noiseGain: 0.05, pulseGain: 0, pulseWobble: 0, tritoneGain: 0, drums: false, dropletMin: 4500, dropletVar: 5000, dropletOctaveDown: false },
  battle: { filterHz: 330, swellHz: 0.07, noiseGain: 0.06, pulseGain: 0.03, pulseWobble: 0.015, tritoneGain: 0, drums: false, dropletMin: 2600, dropletVar: 3200, dropletOctaveDown: false },
  boss: { filterHz: 540, swellHz: 0.13, noiseGain: 0.085, pulseGain: 0.085, pulseWobble: 0.045, tritoneGain: 0.055, drums: true, dropletMin: 1300, dropletVar: 1700, dropletOctaveDown: true },
};

class MusicEngine {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private dropletTimer: number | null = null;
  private drumTimer: number | null = null;
  private running = false;
  private mood: Mood = 'calm';
  private volume = 0.5;
  private enabled = true;

  // mood-controlled handles
  private droneFilter: BiquadFilterNode | null = null;
  private swellLfo: OscillatorNode | null = null;
  private noiseGain: GainNode | null = null;
  private pulseGain: GainNode | null = null;
  private pulseWobbleGain: GainNode | null = null;
  private tritoneGain: GainNode | null = null;

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stop();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.out && this.ctx) this.out.gain.setTargetAtTime(v * 0.5, this.ctx.currentTime, 0.4);
  }

  setMood(mood: Mood) {
    this.mood = mood;
    if (this.running) this.applyMood();
  }

  private applyMood() {
    const ctx = this.ctx;
    if (!ctx) return;
    const p = MOODS[this.mood];
    const t = ctx.currentTime;
    this.droneFilter?.frequency.setTargetAtTime(p.filterHz, t, 1.2);
    this.swellLfo?.frequency.setTargetAtTime(p.swellHz, t, 1.2);
    this.noiseGain?.gain.setTargetAtTime(p.noiseGain, t, 1.5);
    this.pulseGain?.gain.setTargetAtTime(p.pulseGain, t, 1.2);
    this.pulseWobbleGain?.gain.setTargetAtTime(p.pulseWobble, t, 1.2);
    this.tritoneGain?.gain.setTargetAtTime(p.tritoneGain, t, 2.0);
    if (p.drums) this.startDrums();
    else this.stopDrums();
  }

  /** war-drum heartbeat: BOOM-boom pairs, pitch-dropping sine thumps */
  private startDrums() {
    if (this.drumTimer != null || !this.ctx || !this.out) return;
    const beat = () => {
      if (!this.running || !this.ctx || !this.out) return;
      // suspended (hidden tab): currentTime is frozen, so scheduled thumps
      // would stack on one instant and blast together on resume — skip
      if (this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime + 0.04;
      this.thump(t, true);
      this.thump(t + 0.32, false);
    };
    beat();
    this.drumTimer = window.setInterval(beat, 1580);
  }

  private stopDrums() {
    if (this.drumTimer != null) {
      clearInterval(this.drumTimer);
      this.drumTimer = null;
    }
  }

  private thump(t: number, accent: boolean) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(accent ? 115 : 92, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 0.13);
    const g = ctx.createGain();
    const peak = (accent ? 0.42 : 0.26) * (0.92 + Math.random() * 0.16);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + (accent ? 0.45 : 0.32));
    o.connect(g);
    g.connect(this.out!);
    o.start(t);
    o.stop(t + 0.5);
  }

  start() {
    if (this.running || !this.enabled) return;
    let ctx: AudioContext;
    try {
      ctx = ensureAudio();
    } catch {
      return;
    }
    this.ctx = ctx;
    this.running = true;

    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(this.volume * 0.5, ctx.currentTime, 2);
    out.connect(ctx.destination);
    this.out = out;

    // drone pair
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = MOODS[this.mood].filterHz;
    droneFilter.connect(out);
    this.droneFilter = droneFilter;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.16;
    droneGain.connect(droneFilter);

    for (const [freq, detune] of [[55, 0], [55, 6], [82.41, -4], [110, 3]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(droneGain);
      o.start();
      this.nodes.push(o);
    }

    // slow swell LFO on the drone
    const lfo = ctx.createOscillator();
    lfo.frequency.value = MOODS[this.mood].swellHz;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.07;
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);
    lfo.start();
    this.nodes.push(lfo);
    this.swellLfo = lfo;

    // brown-noise pressure bed
    const noiseLen = 4 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < noiseLen; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 190;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = MOODS[this.mood].noiseGain;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(out);
    noise.start();
    this.nodes.push(noise);
    this.noiseGain = noiseGain;

    // droplet delay bus
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.46;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1500;
    delay.connect(feedback);
    feedback.connect(delayFilter);
    delayFilter.connect(delay);
    const delayOut = ctx.createGain();
    delayOut.gain.value = 0.55;
    delay.connect(delayOut);
    delayOut.connect(out);

    const pentatonic = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
    const droplet = () => {
      if (!this.running) return;
      const p = MOODS[this.mood];
      if (ctx.state !== 'running') {
        // hidden tab: keep the timer chain alive but don't stack frozen notes
        this.dropletTimer = window.setTimeout(droplet, p.dropletMin + Math.random() * p.dropletVar);
        return;
      }
      const o = ctx.createOscillator();
      o.type = 'triangle';
      const base = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      o.frequency.value = p.dropletOctaveDown ? base / 2 : base;
      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.connect(g);
      g.connect(out);
      g.connect(delay);
      o.start(t);
      o.stop(t + 3.4);
      this.dropletTimer = window.setTimeout(droplet, p.dropletMin + Math.random() * p.dropletVar);
    };
    this.dropletTimer = window.setTimeout(droplet, 1200);

    // minor-third pulse (C2) — breathes against the root in battles
    const pulseOsc = ctx.createOscillator();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.value = 65.4; // C2
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0;
    pulseOsc.connect(pulseGain);
    pulseGain.connect(droneFilter);
    pulseOsc.start();
    this.nodes.push(pulseOsc);
    this.pulseGain = pulseGain;

    const pulseLfo = ctx.createOscillator();
    pulseLfo.frequency.value = 0.35;
    const pulseWobbleGain = ctx.createGain();
    pulseWobbleGain.gain.value = 0;
    pulseLfo.connect(pulseWobbleGain);
    pulseWobbleGain.connect(pulseGain.gain);
    pulseLfo.start();
    this.nodes.push(pulseLfo);
    this.pulseWobbleGain = pulseWobbleGain;

    // tritone dread layer (Eb2 against the A1 root) — boss fights only
    const tritoneOsc = ctx.createOscillator();
    tritoneOsc.type = 'sine';
    tritoneOsc.frequency.value = 77.78; // Eb2
    const tritoneGain = ctx.createGain();
    tritoneGain.gain.value = 0;
    tritoneOsc.connect(tritoneGain);
    tritoneGain.connect(droneFilter);
    tritoneOsc.start();
    this.nodes.push(tritoneOsc);
    this.tritoneGain = tritoneGain;

    this.applyMood();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.stopDrums();
    if (this.dropletTimer) clearTimeout(this.dropletTimer);
    const out = this.out;
    if (out && this.ctx) {
      out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6);
      const doomed = this.nodes;
      window.setTimeout(() => {
        doomed.forEach((n) => {
          try {
            (n as OscillatorNode).stop?.();
          } catch {
            /* already stopped */
          }
          n.disconnect();
        });
        out.disconnect();
      }, 1600);
    }
    this.nodes = [];
    this.out = null;
    this.droneFilter = null;
    this.swellLfo = null;
    this.noiseGain = null;
    this.pulseGain = null;
    this.pulseWobbleGain = null;
    this.tritoneGain = null;
  }
}

export const music = new MusicEngine();
