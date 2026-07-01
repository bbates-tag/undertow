// Generative underwater ambience — no audio files. A slow drone pair under a
// lowpass, a brown-noise "pressure bed", and sparse pentatonic droplets fed
// through a feedback delay. Boss fights add a pulsing low third.

import { ensureAudio } from './zzfx';

export type Mood = 'calm' | 'battle' | 'boss';

class MusicEngine {
  private out: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private dropletTimer: number | null = null;
  private running = false;
  private mood: Mood = 'calm';
  private volume = 0.5;
  private enabled = true;

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stop();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.out) this.out.gain.setTargetAtTime(v * 0.5, this.out.context.currentTime, 0.4);
  }

  setMood(mood: Mood) {
    this.mood = mood;
  }

  start() {
    if (this.running || !this.enabled) return;
    let ctx: AudioContext;
    try {
      ctx = ensureAudio();
    } catch {
      return;
    }
    this.running = true;

    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(this.volume * 0.5, ctx.currentTime, 2);
    out.connect(ctx.destination);
    this.out = out;

    // drone pair
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 260;
    droneFilter.connect(out);

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
    lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.07;
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);
    lfo.start();
    this.nodes.push(lfo);

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
    noiseGain.gain.value = 0.05;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(out);
    noise.start();
    this.nodes.push(noise);

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
      const o = ctx.createOscillator();
      o.type = 'triangle';
      const base = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      o.frequency.value = this.mood === 'boss' ? base / 2 : base;
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
      const interval = this.mood === 'calm' ? 4500 + Math.random() * 5000 : 2600 + Math.random() * 3200;
      this.dropletTimer = window.setTimeout(droplet, interval);
    };
    this.dropletTimer = window.setTimeout(droplet, 1200);

    // boss pulse — dissonant low third that breathes
    const pulseOsc = ctx.createOscillator();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.value = 65.4; // C2
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0;
    pulseOsc.connect(pulseGain);
    pulseGain.connect(droneFilter);
    pulseOsc.start();
    this.nodes.push(pulseOsc);
    const pulseLfo = ctx.createOscillator();
    pulseLfo.frequency.value = 0.35;
    const pulseLfoGain = ctx.createGain();
    pulseLfoGain.gain.value = 0.05;
    pulseLfo.connect(pulseLfoGain);
    pulseLfo.start();
    this.nodes.push(pulseLfo);
    // engage/disengage the pulse depending on mood
    const moodWatch = window.setInterval(() => {
      if (!this.running) { clearInterval(moodWatch); return; }
      const target = this.mood === 'boss' ? 0.075 : this.mood === 'battle' ? 0.03 : 0;
      pulseGain.gain.setTargetAtTime(target, ctx.currentTime, 1.5);
      if (this.mood === 'boss' && !this.pulseConnected) {
        pulseLfoGain.connect(pulseGain.gain);
        this.pulseConnected = true;
      }
    }, 900);
  }

  private pulseConnected = false;

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.dropletTimer) clearTimeout(this.dropletTimer);
    const out = this.out;
    if (out) {
      out.gain.setTargetAtTime(0, out.context.currentTime, 0.6);
      window.setTimeout(() => {
        this.nodes.forEach((n) => {
          try {
            (n as OscillatorNode).stop?.();
          } catch { /* already stopped */ }
          n.disconnect();
        });
        out.disconnect();
      }, 1600);
    }
    this.nodes = [];
    this.out = null;
    this.pulseConnected = false;
  }
}

export const music = new MusicEngine();
