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

  // Hangar Procedural Ambient Layer
  private hangarAmbienceRunning = false;
  private hangarMasterGain: GainNode | null = null;
  private hangarNodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[] = [];
  private hangarTimeoutIds: number[] = [];

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopMenuMusic();
      this.stopHangarAmbience();
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

  // Active cinematic intro audio nodes for clean cleanup on skip or completion
  private introGainNode: GainNode | null = null;
  private introOscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];

  public playCinematicIntroSoundscape() {
    if (!this.soundEnabled) return;
    this.stopCinematicIntroSoundscape();
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.35, now + 1.2);
      masterGain.connect(ctx.destination);
      this.introGainNode = masterGain;

      // 1. Deep Hangar Ambience & Sub Drone (45Hz - 55Hz subtle slow pulsing)
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(55, now);
      sub.frequency.linearRampToValueAtTime(48, now + 3.0);
      sub.frequency.linearRampToValueAtTime(60, now + 6.0);
      subGain.gain.setValueAtTime(0.28, now);
      sub.connect(subGain);
      subGain.connect(masterGain);
      sub.start(now);
      this.introOscillators.push(sub);

      // 2. Sci-Fi Harmonic Atmosphere Pad (Warm Fifth Chord)
      const chordNotes = [110, 164.81, 220, 329.63]; // A2, E3, A3, E4
      chordNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const chordGain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        // Slight detune for analog cinematic warmth
        osc.detune.setValueAtTime((idx - 1.5) * 8, now);

        chordGain.gain.setValueAtTime(0.001, now);
        chordGain.gain.exponentialRampToValueAtTime(0.045 / (idx + 1), now + 0.8 + idx * 0.2);
        chordGain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + 4.5);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + 7.5);

        osc.connect(chordGain);
        chordGain.connect(masterGain);
        osc.start(now);
        this.introOscillators.push(osc);
      });

      // 3. Hydraulic Airlock / Vent Hiss (White noise through bandpass)
      const bufferSize = ctx.sampleRate * 1.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now + 0.4);
      filter.frequency.exponentialRampToValueAtTime(450, now + 1.8);
      filter.Q.value = 3.0;

      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(0.001, now);
      hissGain.gain.exponentialRampToValueAtTime(0.12, now + 0.5);
      hissGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      whiteNoise.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(masterGain);
      whiteNoise.start(now + 0.4);
      this.introOscillators.push(whiteNoise);

      // 4. Thruster Spool-up & Diagnostic Chime at mid-flight (t = 3.2s)
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(587.33, now + 2.8); // D5
      chimeOsc.frequency.setValueAtTime(880, now + 3.0); // A5
      chimeOsc.frequency.setValueAtTime(1174.66, now + 3.2); // D6
      chimeGain.gain.setValueAtTime(0.001, now + 2.8);
      chimeGain.gain.linearRampToValueAtTime(0.09, now + 3.2);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 4.8);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(masterGain);
      chimeOsc.start(now + 2.8);
      chimeOsc.stop(now + 4.8);
      this.introOscillators.push(chimeOsc);

      // 5. Hero Reveal Fanfare Chime (t = 5.2s)
      const heroOsc = ctx.createOscillator();
      const heroGain = ctx.createGain();
      heroOsc.type = 'triangle';
      heroOsc.frequency.setValueAtTime(440, now + 5.0);
      heroOsc.frequency.exponentialRampToValueAtTime(880, now + 5.5);
      heroGain.gain.setValueAtTime(0.001, now + 5.0);
      heroGain.gain.linearRampToValueAtTime(0.08, now + 5.4);
      heroGain.gain.exponentialRampToValueAtTime(0.001, now + 7.2);

      heroOsc.connect(heroGain);
      heroGain.connect(masterGain);
      heroOsc.start(now + 5.0);
      heroOsc.stop(now + 7.2);
      this.introOscillators.push(heroOsc);
    } catch {
      // Audio fallback
    }
  }

  public stopCinematicIntroSoundscape() {
    if (!this.introGainNode) return;
    try {
      const ctx = this.ctx;
      if (ctx) {
        const now = ctx.currentTime;
        this.introGainNode.gain.cancelScheduledValues(now);
        this.introGainNode.gain.setValueAtTime(this.introGainNode.gain.value, now);
        this.introGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      }
      setTimeout(() => {
        this.introOscillators.forEach((osc) => {
          try {
            if ('stop' in osc) osc.stop();
          } catch {}
        });
        this.introOscillators = [];
        this.introGainNode = null;
      }, 400);
    } catch {
      this.introOscillators = [];
      this.introGainNode = null;
    }
  }

  /**
   * Procedural Hangar Ambient Layer:
   * - Deep mechanical reactor hums & ventilation breathing
   * - Periodic cryo steam vent decompression hisses
   * - Distant echoing footsteps and metallic gantry resonance
   */
  public startHangarAmbience() {
    if (!this.soundEnabled || this.hangarAmbienceRunning) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      this.hangarAmbienceRunning = true;
      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.38, now + 1.2);
      masterGain.connect(ctx.destination);
      this.hangarMasterGain = masterGain;

      // 1. Deep Mechanical Drone & Low-Frequency Station Generator Resonance (48 Hz + 72 Hz)
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(48.0, now);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.24, now);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      this.hangarNodes.push(subOsc);

      // Industrial machinery overtone (72 Hz triangle)
      const machOsc = ctx.createOscillator();
      machOsc.type = 'triangle';
      machOsc.frequency.setValueAtTime(72.0, now);
      machOsc.detune.setValueAtTime(5, now);

      // Low-pass filter to give heavy cavernous acoustics
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(160, now);
      lpf.Q.setValueAtTime(2.2, now);

      // Slow ventilation breathing LFO (0.12 Hz)
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(55, now);
      lfo.connect(lfoGain);
      lfoGain.connect(lpf.frequency);
      lfo.start(now);
      this.hangarNodes.push(lfo);

      const machGain = ctx.createGain();
      machGain.gain.setValueAtTime(0.18, now);

      machOsc.connect(lpf);
      lpf.connect(machGain);
      machGain.connect(masterGain);
      machOsc.start(now);
      this.hangarNodes.push(machOsc);

      // 2. Procedural Atmospheric Steam Vent Routine
      const scheduleNextSteamVent = () => {
        if (!this.hangarAmbienceRunning || !this.ctx || !this.hangarMasterGain) return;
        const delay = 6000 + Math.random() * 8000; // 6 to 14 seconds
        const tid = window.setTimeout(() => {
          this.triggerProceduralSteamVent();
          scheduleNextSteamVent();
        }, delay);
        this.hangarTimeoutIds.push(tid);
      };
      scheduleNextSteamVent();

      // 3. Procedural Echoing Footsteps & Gantry Pings Routine
      const scheduleNextFootsteps = () => {
        if (!this.hangarAmbienceRunning || !this.ctx || !this.hangarMasterGain) return;
        const delay = 4500 + Math.random() * 7000; // 4.5 to 11.5 seconds
        const tid = window.setTimeout(() => {
          this.triggerProceduralEchoingFootstep();
          scheduleNextFootsteps();
        }, delay);
        this.hangarTimeoutIds.push(tid);
      };
      scheduleNextFootsteps();
    } catch {
      // Audio fallback
    }
  }

  private triggerProceduralSteamVent() {
    if (!this.soundEnabled || !this.hangarAmbienceRunning || !this.ctx || !this.hangarMasterGain) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const duration = 1.4 + Math.random() * 0.8;

      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      const startFreq = 1600 + Math.random() * 400;
      const endFreq = 450 + Math.random() * 150;
      bandpass.frequency.setValueAtTime(startFreq, now);
      bandpass.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      bandpass.Q.setValueAtTime(2.8, now);

      const ventGain = ctx.createGain();
      ventGain.gain.setValueAtTime(0.001, now);
      ventGain.gain.linearRampToValueAtTime(0.12, now + 0.12);
      ventGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(bandpass);
      bandpass.connect(ventGain);
      ventGain.connect(this.hangarMasterGain);

      noiseSource.start(now);
      noiseSource.stop(now + duration);
    } catch {}
  }

  private triggerProceduralEchoingFootstep() {
    if (!this.soundEnabled || !this.hangarAmbienceRunning || !this.ctx || !this.hangarMasterGain) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const isPing = Math.random() > 0.45;

      if (isPing) {
        // High distant metallic tool clank with cathedral reverb slapback
        const pingFreq = 840 + Math.random() * 320;
        const osc = ctx.createOscillator();
        const pingGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pingFreq, now);
        osc.frequency.exponentialRampToValueAtTime(pingFreq * 0.6, now + 0.18);

        pingGain.gain.setValueAtTime(0.04, now);
        pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        // Slapback echo at +0.16s
        const echoGain = ctx.createGain();
        echoGain.gain.setValueAtTime(0.001, now);
        echoGain.gain.setValueAtTime(0.018, now + 0.16);
        echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(pingGain);
        pingGain.connect(this.hangarMasterGain);
        osc.connect(echoGain);
        echoGain.connect(this.hangarMasterGain);

        osc.start(now);
        osc.stop(now + 0.48);
      } else {
        // Echoing boots on metal floor (double tap)
        const stepOffsets = [0, 0.32 + Math.random() * 0.08];
        stepOffsets.forEach((offset) => {
          const osc = ctx.createOscillator();
          const stepGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260 + Math.random() * 40, now + offset);
          osc.frequency.exponentialRampToValueAtTime(90, now + offset + 0.09);

          stepGain.gain.setValueAtTime(0.001, now);
          stepGain.gain.setValueAtTime(0.06, now + offset);
          stepGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

          // Cavernous echo
          const echoGain = ctx.createGain();
          echoGain.gain.setValueAtTime(0.001, now);
          echoGain.gain.setValueAtTime(0.022, now + offset + 0.14);
          echoGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.38);

          osc.connect(stepGain);
          stepGain.connect(this.hangarMasterGain!);
          osc.connect(echoGain);
          echoGain.connect(this.hangarMasterGain!);

          osc.start(now + offset);
          osc.stop(now + offset + 0.4);
        });
      }
    } catch {}
  }

  public stopHangarAmbience() {
    if (!this.hangarAmbienceRunning) return;
    this.hangarAmbienceRunning = false;
    this.hangarTimeoutIds.forEach((tid) => clearTimeout(tid));
    this.hangarTimeoutIds = [];

    if (this.hangarMasterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.hangarMasterGain.gain.cancelScheduledValues(now);
        this.hangarMasterGain.gain.setValueAtTime(this.hangarMasterGain.gain.value, now);
        this.hangarMasterGain.gain.linearRampToValueAtTime(0.001, now + 0.6);
      } catch {}
    }

    setTimeout(() => {
      this.hangarNodes.forEach((node) => {
        try {
          if ('stop' in node) (node as OscillatorNode).stop();
        } catch {}
      });
      this.hangarNodes = [];
      this.hangarMasterGain = null;
    }, 650);
  }
}

export const soundEngine = new SoundEngine();
