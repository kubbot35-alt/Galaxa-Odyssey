// Web Audio API Retro Sound Generator mirroring the Java synthetic sound synthesis
import { SoundType } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private menuMusicPlaying = false;
  private musicTimeout: number | null = null;
  private melodyIndex = 0;

  private melody = [
    261.63, 329.63, 392.00, 523.25,
    392.00, 329.63, 293.66, 261.63,
    220.00, 261.63, 329.63, 440.00,
    329.63, 293.66, 261.63, 196.00
  ];

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopMenuMusic();
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public playSound(type: SoundType) {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (type === SoundType.SHOOT) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === SoundType.TRIPLE_SHOT) {
        // High-energy triple punch sound
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(620, now);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.14);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.14);
        osc2.stop(now + 0.14);
      } else if (type === SoundType.LASER) {
        // Piercing laser continuous hum / beam discharge
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1250, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.08);

        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(2500, now);
        oscHarmonic.frequency.linearRampToValueAtTime(1600, now + 0.08);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        oscHarmonic.start(now);
        osc.stop(now + 0.08);
        oscHarmonic.stop(now + 0.08);
      } else if (type === SoundType.TOKEN_COLLECT) {
        // Glorious arpeggio for weapon token unlock
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.045;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.25, start);
          gain.gain.exponentialRampToValueAtTime(0.005, start + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.12);
        });
      } else if (type === SoundType.EXPLOSION) {
        // White noise generator
        const bufferSize = ctx.sampleRate * 0.35;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.35);
      } else if (type === SoundType.POWER_UP) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(990, now + 0.25);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio playback error fallback
    }
  }

  public startMenuMusic() {
    if (!this.soundEnabled || this.menuMusicPlaying) return;
    this.menuMusicPlaying = true;
    this.playNextMusicNote();
  }

  private playNextMusicNote() {
    if (!this.menuMusicPlaying || !this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const freq = this.melody[this.melodyIndex];
      this.melodyIndex = (this.melodyIndex + 1) % this.melody.length;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const dur = 0.18;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);

      this.musicTimeout = window.setTimeout(() => {
        this.playNextMusicNote();
      }, dur * 1000);
    } catch {
      // Audio note error fallback
    }
  }

  public stopMenuMusic() {
    this.menuMusicPlaying = false;
    if (this.musicTimeout !== null) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    this.melodyIndex = 0;
  }

  // 21st-century modern sci-fi UI sounds
  public playUiHover() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.03);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Audio fallback
    }
  }

  public playUiClick() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.06);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, now);
      osc2.frequency.exponentialRampToValueAtTime(400, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.065);
      osc2.stop(now + 0.065);
    } catch {
      // Audio fallback
    }
  }

  public playWarpJump() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // 1. Bass sub-rumble sweep
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(60, now);
      sub.frequency.exponentialRampToValueAtTime(320, now + 0.85);
      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.95);

      // 2. High-energy beam charge whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(3800, now + 0.8);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch {
      // Audio fallback
    }
  }

  public playTargetAcquiringBeep() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.04);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Audio fallback
    }
  }

  public playTargetLockedAlert() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1760, now + 0.04);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1320, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.04);
      osc1.stop(now + 0.12);
      osc2.stop(now + 0.12);
    } catch {
      // Audio fallback
    }
  }
}

export const soundEngine = new SoundEngine();
