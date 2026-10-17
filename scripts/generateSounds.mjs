// Generuje efekty, muzykę menu, intro i ambient hangaru (WAV 16-bit mono) do public/resources/sounds.
// Uruchomienie: npm run sounds
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RATE = 44100;
const OUT = path.resolve('public', 'resources', 'sounds');

const osc = {
    sine: (p) => Math.sin(2 * Math.PI * p),
    square: (p) => (p % 1 < 0.5 ? 1 : -1),
    sawtooth: (p) => 2 * (p % 1) - 1,
    triangle: (p) => 4 * Math.abs((p % 1) - 0.5) - 1,
};

const expRamp = (v0, v1, t, dur) => v0 * Math.pow(v1 / v0, Math.min(t / dur, 1));
const linRamp = (v0, v1, t, dur) => v0 + (v1 - v0) * Math.min(t / dur, 1);

/** Dodaje oscylator z przesuwem częstotliwości i obwiednią gain do bufora. */
function addTone(buf, { type, f0, f1, fDur, ramp = expRamp, g0, g1, gPeak, start = 0, dur }) {
    const wave = osc[type];
    const first = Math.floor(start * RATE);
    const n = Math.floor(dur * RATE);
    let phase = 0;
    for (let i = 0; i < n && first + i < buf.length; i++) {
        const t = i / RATE;
        phase += ramp(f0, f1 ?? f0, t, fDur ?? dur) / RATE;
        let g;
        if (gPeak) {
            // g0 -> gPeak.value w czasie gPeak.at, potem -> g1 do końca
            g = t < gPeak.at ? expRamp(g0, gPeak.value, t, gPeak.at) : expRamp(gPeak.value, g1, t - gPeak.at, dur - gPeak.at);
        } else {
            g = expRamp(g0, g1, t, dur);
        }
        buf[first + i] += wave(phase) * g;
    }
}

function addExplosion(buf, dur, g0, g1) {
    const n = Math.floor(dur * RATE);
    let lp = 0;
    for (let i = 0; i < n; i++) {
        const t = i / RATE;
        const a = 1 - Math.exp((-2 * Math.PI * expRamp(800, 100, t, dur)) / RATE);
        lp += a * ((Math.random() * 2 - 1) * Math.exp(-i / (RATE * 0.08)) - lp);
        buf[i] += lp * expRamp(g0, g1, t, dur) * 3;
    }
}

const sounds = {
    shoot: (b) => addTone(b, { type: 'square', f0: 880, f1: 110, g0: 0.2, g1: 0.01, dur: 0.12 }),
    tripleShot: (b) => {
        addTone(b, { type: 'sawtooth', f0: 950, f1: 160, g0: 0.22, g1: 0.01, dur: 0.14 });
        addTone(b, { type: 'square', f0: 620, f1: 120, g0: 0.22, g1: 0.01, dur: 0.14 });
    },
    laser: (b) => {
        addTone(b, { type: 'sawtooth', f0: 1250, f1: 800, ramp: linRamp, g0: 0.18, g1: 0.01, dur: 0.08 });
        addTone(b, { type: 'sine', f0: 2500, f1: 1600, ramp: linRamp, g0: 0.18, g1: 0.01, dur: 0.08 });
    },
    tokenCollect: (b) =>
        [440, 554.37, 659.25, 880].forEach((f, i) =>
            addTone(b, { type: 'triangle', f0: f, g0: 0.25, g1: 0.005, start: i * 0.045, dur: 0.12 }),
        ),
    explosion: (b) => addExplosion(b, 0.35, 0.4, 0.01),
    powerUp: (b) => addTone(b, { type: 'triangle', f0: 330, f1: 990, g0: 0.25, g1: 0.01, dur: 0.25 }),
    uiHover: (b) => addTone(b, { type: 'sine', f0: 1400, f1: 1800, fDur: 0.03, g0: 0.04, g1: 0.001, dur: 0.035 }),
    uiClick: (b) => {
        addTone(b, { type: 'triangle', f0: 800, f1: 2400, fDur: 0.06, g0: 0.12, g1: 0.001, dur: 0.065 });
        addTone(b, { type: 'sine', f0: 1200, f1: 400, fDur: 0.06, g0: 0.12, g1: 0.001, dur: 0.065 });
    },
    warpJump: (b) => {
        addTone(b, { type: 'sawtooth', f0: 60, f1: 320, fDur: 0.85, g0: 0.25, g1: 0.01, dur: 0.95 });
        addTone(b, { type: 'sine', f0: 350, f1: 3800, fDur: 0.8, g0: 0.08, gPeak: { at: 0.7, value: 0.22 }, g1: 0.001, dur: 0.9 });
    },
    targetAcquiring: (b) =>
        addTone(b, { type: 'sine', f0: 1480, f1: 1760, fDur: 0.04, g0: 0.045, g1: 0.001, dur: 0.045 }),
    targetLocked: (b) => {
        // Obwiednia 0.08 -> 0.001 przez 120 ms; druga część startuje po 40 ms
        const g40 = expRamp(0.08, 0.001, 0.04, 0.12);
        addTone(b, { type: 'triangle', f0: 880, g0: 0.08, g1: g40, dur: 0.04 });
        addTone(b, { type: 'triangle', f0: 1760, g0: g40, g1: 0.001, start: 0.04, dur: 0.08 });
        addTone(b, { type: 'sawtooth', f0: 1320, g0: g40, g1: 0.001, start: 0.04, dur: 0.08 });
    },
};

function toWav(samples) {
    const peak = samples.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
    const scale = peak > 1 ? 1 / peak : 1;
    const data = Buffer.alloc(samples.length * 2);
    samples.forEach((s, i) => data.writeInt16LE(Math.round(s * scale * 32767), i * 2));
    const h = Buffer.alloc(44);
    h.write('RIFF', 0);
    h.writeUInt32LE(36 + data.length, 4);
    h.write('WAVEfmt ', 8);
    h.writeUInt32LE(16, 16);
    h.writeUInt16LE(1, 20);
    h.writeUInt16LE(1, 22);
    h.writeUInt32LE(RATE, 24);
    h.writeUInt32LE(RATE * 2, 28);
    h.writeUInt16LE(2, 32);
    h.writeUInt16LE(16, 34);
    h.write('data', 36);
    h.writeUInt32LE(data.length, 40);
    return Buffer.concat([h, data]);
}



// ---- Dłuższe ścieżki: muzyka menu, intro kinowe, ambient hangaru ----

/** Automatyzacja wartości w stylu Web Audio; zdarzenia: [czas, wartość, 'set' | 'lin' | 'exp']. */
function autom(ev, t) {
    let i = -1;
    for (let k = 0; k < ev.length && ev[k][0] <= t; k++) i = k;
    if (i === -1) return ev[0][1];
    const prev = ev[i];
    const next = ev[i + 1];
    if (!next || next[2] === 'set') return prev[1];
    const f = (t - prev[0]) / (next[0] - prev[0]);
    return next[2] === 'exp' ? prev[1] * Math.pow(next[1] / prev[1], f) : prev[1] + (next[1] - prev[1]) * f;
}

function addVoice(buf, { type, freq, gain, start, stop, cents = 0, filter }) {
    const wave = osc[type];
    const detune = Math.pow(2, cents / 1200);
    let phase = 0;
    let lp = 0;
    let bp = 0;
    for (let i = Math.floor(start * RATE); i < Math.floor(stop * RATE) && i < buf.length; i++) {
        const t = i / RATE;
        const f = Array.isArray(freq) ? autom(freq, t) : freq;
        phase += (f * detune) / RATE;
        let s = wave(phase);
        if (filter) {
            const fc = filter.cutoff(t);
            const f1 = 2 * Math.sin((Math.PI * fc) / RATE);
            lp += f1 * bp;
            bp += f1 * (s - lp - bp / filter.q);
            s = lp;
        }
        buf[i] += s * autom(gain, t);
    }
}

function mulberry32(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function addBandNoise(buf, rand, { start, stop, freq, q, gain }) {
    let lp = 0;
    let bp = 0;
    for (let i = Math.floor(start * RATE); i < Math.floor(stop * RATE) && i < buf.length; i++) {
        const t = i / RATE;
        const f1 = 2 * Math.sin((Math.PI * autom(freq, t)) / RATE);
        const x = rand() * 2 - 1;
        lp += f1 * bp;
        bp += f1 * (x - lp - bp / q);
        buf[i] += (bp / q) * autom(gain, t);
    }
}

const MELODY = [
    261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 261.63,
    220.0, 261.63, 329.63, 440.0, 329.63, 293.66, 261.63, 196.0,
];

const tracks = {
    menuMusic: {
        length: MELODY.length * 0.18,
        render: (b) =>
            MELODY.forEach((f, i) =>
                addVoice(b, {
                    type: 'square', freq: f, start: i * 0.18, stop: (i + 1) * 0.18,
                    gain: [[i * 0.18, 0.06, 'set'], [(i + 1) * 0.18, 0.001, 'exp']],
                }),
            ),
    },
    introSoundscape: {
        length: 7.6,
        render: (b) => {
            const rand = mulberry32(7);
            addVoice(b, {
                type: 'sine', start: 0, stop: 7.6,
                freq: [[0, 55, 'set'], [3, 48, 'lin'], [6, 60, 'lin']],
                gain: [[0, 0.28, 'set'], [6.6, 0.28, 'set'], [7.6, 0.001, 'exp']],
            });
            [110, 164.81, 220, 329.63].forEach((f, idx) =>
                addVoice(b, {
                    type: idx % 2 === 0 ? 'triangle' : 'sine', freq: f, cents: (idx - 1.5) * 8, start: 0, stop: 7.6,
                    gain: [
                        [0, 0.001, 'set'], [0.8 + idx * 0.2, 0.045 / (idx + 1), 'exp'],
                        [4.5, 0.06 / (idx + 1), 'lin'], [7.5, 0.001, 'exp'],
                    ],
                }),
            );
            addBandNoise(b, rand, {
                start: 0.4, stop: 1.9, q: 3,
                freq: [[0.4, 1400, 'set'], [1.8, 450, 'exp']],
                gain: [[0, 0.001, 'set'], [0.5, 0.12, 'exp'], [1.8, 0.001, 'exp']],
            });
            addVoice(b, {
                type: 'sine', start: 2.8, stop: 4.8,
                freq: [[2.8, 587.33, 'set'], [3.0, 880, 'set'], [3.2, 1174.66, 'set']],
                gain: [[2.8, 0.001, 'set'], [3.2, 0.09, 'lin'], [4.8, 0.001, 'exp']],
            });
            addVoice(b, {
                type: 'triangle', start: 5, stop: 7.2,
                freq: [[5, 440, 'set'], [5.5, 880, 'exp']],
                gain: [[5, 0.001, 'set'], [5.4, 0.08, 'lin'], [7.2, 0.001, 'exp']],
            });
            const master = [[0, 0.001, 'set'], [1.2, 0.35, 'exp'], [6.8, 0.35, 'set'], [7.6, 0.001, 'exp']];
            for (let i = 0; i < b.length; i++) b[i] *= autom(master, i / RATE);
        },
    },
    // Pętla: całkowita liczba okresów każdego składnika mieści się w długości ścieżki
    hangarAmbience: {
        length: 24,
        render: (b) => {
            const rand = mulberry32(21);
            addVoice(b, { type: 'sine', freq: 48, start: 0, stop: 24, gain: [[0, 0.24, 'set']] });
            addVoice(b, {
                type: 'triangle', freq: 72, start: 0, stop: 24, gain: [[0, 0.18, 'set']],
                filter: { q: 2.2, cutoff: (t) => 160 + 55 * Math.sin(2 * Math.PI * 0.125 * t) },
            });
            [[2.5, 1.8, 1700, 500], [14, 2.2, 1800, 520], [21, 2, 1650, 480]].forEach(([t, d, f0, f1]) =>
                addBandNoise(b, rand, {
                    start: t, stop: t + d, q: 2.8,
                    freq: [[t, f0, 'set'], [t + d, f1, 'exp']],
                    gain: [[t, 0.001, 'set'], [t + 0.12, 0.12, 'lin'], [t + d, 0.001, 'exp']],
                }),
            );
            [[6, 0], [6, 0.35], [17, 0], [17, 0.38]].forEach(([t, off]) => {
                const o = t + off;
                addVoice(b, {
                    type: 'sine', start: o, stop: o + 0.4,
                    freq: [[o, 280, 'set'], [o + 0.09, 90, 'exp']],
                    gain: [[o, 0.06, 'set'], [o + 0.09, 0.001, 'exp'], [o + 0.14, 0.022, 'set'], [o + 0.38, 0.001, 'exp']],
                });
            });
            [[11, 900], [19, 1100]].forEach(([o, f]) =>
                addVoice(b, {
                    type: 'triangle', start: o, stop: o + 0.48,
                    freq: [[o, f, 'set'], [o + 0.18, f * 0.6, 'exp']],
                    gain: [[o, 0.04, 'set'], [o + 0.16, 0.002, 'exp'], [o + 0.17, 0.018, 'set'], [o + 0.45, 0.001, 'exp']],
                }),
            );
        },
    },
};

mkdirSync(OUT, { recursive: true });
for (const [name, render] of Object.entries(sounds)) {
    const buf = new Float32Array(RATE);
    render(buf);
    let end = buf.length;
    while (end > 1 && Math.abs(buf[end - 1]) < 1e-4) end--;
    writeFileSync(path.join(OUT, `${name}.wav`), toWav(buf.subarray(0, end)));
    console.log(`${name}.wav (${Math.round((end / RATE) * 1000)} ms)`);
}
for (const [name, { length, render }] of Object.entries(tracks)) {
    const buf = new Float32Array(Math.round(length * RATE));
    render(buf);
    writeFileSync(path.join(OUT, `${name}.wav`), toWav(buf));
    console.log(`${name}.wav (${length.toFixed(2)} s)`);
}
