import { SoundType } from '../../types/game';

/**
 * Silnik audio odtwarzający wyłącznie pliki z public/resources/sounds.
 * Zmiana brzmienia = podmiana pliku WAV (lub dopisanie wpisu w SOUNDS).
 */
interface SoundDef {
    file: string;
    loop?: boolean;
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
}

const SOUNDS = {
    shoot: { file: 'shoot.wav' },
    tripleShot: { file: 'tripleShot.wav' },
    laser: { file: 'laser.wav' },
    tokenCollect: { file: 'tokenCollect.wav' },
    explosion: { file: 'explosion.wav' },
    powerUp: { file: 'powerUp.wav' },
    uiHover: { file: 'uiHover.wav' },
    uiClick: { file: 'uiClick.wav' },
    warpJump: { file: 'warpJump.wav' },
    targetAcquiring: { file: 'targetAcquiring.wav' },
    targetLocked: { file: 'targetLocked.wav' },
    menuMusic: { file: 'menuMusic.wav', loop: true, volume: 1 },
    introSoundscape: { file: 'introSoundscape.wav', fadeOut: 0.35 },
    hangarAmbience: { file: 'hangarAmbience.wav', loop: true, volume: 0.38, fadeIn: 1.2, fadeOut: 0.6 },
} satisfies Record<string, SoundDef>;

type SoundId = keyof typeof SOUNDS;

const SOUND_TYPE_TO_ID: Partial<Record<SoundType, SoundId>> = {
    [SoundType.SHOOT]: 'shoot',
    [SoundType.TRIPLE_SHOT]: 'tripleShot',
    [SoundType.LASER]: 'laser',
    [SoundType.TOKEN_COLLECT]: 'tokenCollect',
    [SoundType.EXPLOSION]: 'explosion',
    [SoundType.POWER_UP]: 'powerUp',
};

const SOUNDS_URL = 'resources/sounds/';
const MAX_ONE_SHOT_DELAY_MS = 300;

export interface ISoundEngine {
    setSoundEnabled(enabled: boolean): void;
    isSoundEnabled(): boolean;
    resumeContext(): Promise<void>;
    playSound(type: SoundType): void;
    startMenuMusic(): void;
    stopMenuMusic(): void;
    playUiHover(): void;
    playUiClick(): void;
    playWarpJump(): void;
    playTargetAcquiringBeep(): void;
    playTargetLockedAlert(): void;
    playCinematicIntroSoundscape(): void;
    stopCinematicIntroSoundscape(): void;
    startHangarAmbience(): void;
    stopHangarAmbience(): void;
}

interface ActiveSound {
    source: AudioBufferSourceNode;
    gain: GainNode;
}

class SoundEngine implements ISoundEngine {
    private ctx: AudioContext | null = null;
    private soundEnabled = true;
    private readonly buffers = new Map<SoundId, AudioBuffer>();
    private readonly loading = new Map<SoundId, Promise<AudioBuffer | null>>();
    private readonly active = new Map<SoundId, ActiveSound>();
    private readonly wanted = new Set<SoundId>();

    private initCtx(): AudioContext | null {
        if (typeof window === 'undefined') return null;

        if (!this.ctx) {
            try {
                const AudioCtx =
                    window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            } catch (err) {
                console.warn('[SoundEngine] Nie udało się zainicjalizować AudioContext:', err);
                return null;
            }
            if (this.ctx) (Object.keys(SOUNDS) as SoundId[]).forEach((id) => void this.load(id));
        }

        if (this.ctx?.state === 'suspended') {
            this.ctx.resume().catch((err) => console.warn('[SoundEngine] Błąd wznowienia AudioContext:', err));
        }
        return this.ctx;
    }

    private load(id: SoundId): Promise<AudioBuffer | null> {
        const cached = this.buffers.get(id);
        if (cached) return Promise.resolve(cached);
        const ctx = this.ctx;
        if (!ctx) return Promise.resolve(null);

        let pending = this.loading.get(id);
        if (!pending) {
            pending = fetch(`${SOUNDS_URL}${SOUNDS[id].file}`)
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.arrayBuffer();
                })
                .then((data) => ctx.decodeAudioData(data))
                .then((buffer) => {
                    this.buffers.set(id, buffer);
                    return buffer;
                })
                .catch((err) => {
                    console.warn(`[SoundEngine] Nie udało się załadować '${id}':`, err);
                    this.loading.delete(id);
                    return null;
                });
            this.loading.set(id, pending);
        }
        return pending;
    }

    private spawn(id: SoundId, buffer: AudioBuffer, ctx: AudioContext): ActiveSound {
        const def: SoundDef = SOUNDS[id];
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = def.loop ?? false;

        const gain = ctx.createGain();
        const volume = def.volume ?? 1;
        if (def.fadeIn) {
            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + def.fadeIn);
        } else {
            gain.gain.value = volume;
        }

        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        return { source, gain };
    }

    private playOnce(id: SoundId): void {
        if (!this.soundEnabled) return;
        const ctx = this.initCtx();
        if (!ctx) return;
        const requestedAt = performance.now();

        void this.load(id).then((buffer) => {
            if (!buffer || !this.soundEnabled) return;
            if (performance.now() - requestedAt > MAX_ONE_SHOT_DELAY_MS) return;
            this.spawn(id, buffer, ctx);
        });
    }

    private start(id: SoundId): void {
        if (!this.soundEnabled || this.wanted.has(id)) return;
        const ctx = this.initCtx();
        if (!ctx) return;
        this.wanted.add(id);

        void this.load(id).then((buffer) => {
            if (!buffer || !this.wanted.has(id) || this.active.has(id)) return;
            const entry = this.spawn(id, buffer, ctx);
            this.active.set(id, entry);
            entry.source.onended = () => {
                if (this.active.get(id) === entry) {
                    this.active.delete(id);
                    this.wanted.delete(id);
                }
            };
        });
    }

    private stop(id: SoundId): void {
        this.wanted.delete(id);
        const entry = this.active.get(id);
        if (!entry || !this.ctx) return;
        this.active.delete(id);

        const fade = (SOUNDS[id] as SoundDef).fadeOut ?? 0.2;
        const now = this.ctx.currentTime;
        try {
            entry.gain.gain.cancelScheduledValues(now);
            entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
            entry.gain.gain.linearRampToValueAtTime(0, now + fade);
            entry.source.onended = null;
            entry.source.stop(now + fade);
        } catch (err) {
            console.debug(`[SoundEngine] Błąd zatrzymania '${id}':`, err);
        }
    }

    public async resumeContext(): Promise<void> {
        const ctx = this.initCtx();
        if (ctx?.state === 'suspended') {
            try {
                await ctx.resume();
            } catch (err) {
                console.warn('[SoundEngine] Błąd resumeContext():', err);
            }
        }
    }

    public setSoundEnabled(enabled: boolean): void {
        this.soundEnabled = enabled;
        if (!enabled) {
            this.stopMenuMusic();
            this.stopHangarAmbience();
            this.stopCinematicIntroSoundscape();
        }
    }

    public isSoundEnabled(): boolean {
        return this.soundEnabled;
    }

    public playSound(type: SoundType): void {
        const id = SOUND_TYPE_TO_ID[type];
        if (id) this.playOnce(id);
    }

    public playUiHover(): void { this.playOnce('uiHover'); }
    public playUiClick(): void { this.playOnce('uiClick'); }
    public playWarpJump(): void { this.playOnce('warpJump'); }
    public playTargetAcquiringBeep(): void { this.playOnce('targetAcquiring'); }
    public playTargetLockedAlert(): void { this.playOnce('targetLocked'); }

    public startMenuMusic(): void { this.start('menuMusic'); }
    public stopMenuMusic(): void { this.stop('menuMusic'); }

    public playCinematicIntroSoundscape(): void {
        this.stop('introSoundscape');
        this.start('introSoundscape');
    }
    public stopCinematicIntroSoundscape(): void { this.stop('introSoundscape'); }

    public startHangarAmbience(): void { this.start('hangarAmbience'); }
    public stopHangarAmbience(): void { this.stop('hangarAmbience'); }
}

export const soundEngine: ISoundEngine = new SoundEngine();
