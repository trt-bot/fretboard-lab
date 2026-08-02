import { midiToFreq } from "./music/theory";
import { ensureAudioReady, unlockAudioSync } from "./woodblock";

/**
 * Richer acoustic-style pluck: multi-partial + noise burst + body filter.
 * Not a sample, but much closer than a plain triangle for practice context.
 */
function acousticPluck(
  audio: AudioContext,
  midi: number,
  when: number,
  duration: number,
  gain: number,
) {
  const freq = midiToFreq(midi);
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, when);
  master.gain.linearRampToValueAtTime(Math.max(0.0001, gain), when + 0.008);
  master.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.45), when + 0.18);
  master.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  const body = audio.createBiquadFilter();
  body.type = "lowpass";
  body.Q.value = 0.7;
  body.frequency.setValueAtTime(3200, when);
  body.frequency.exponentialRampToValueAtTime(900, when + duration * 0.7);

  const highShelf = audio.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.value = 2500;
  highShelf.gain.value = -4;

  // Partials: fundamental + inharmonic guitar-ish overtones
  const partials: Array<{ mul: number; type: OscillatorType; amp: number; detune: number }> = [
    { mul: 1, type: "triangle", amp: 1, detune: 0 },
    { mul: 2, type: "sine", amp: 0.42, detune: 3 },
    { mul: 3, type: "sine", amp: 0.18, detune: -2 },
    { mul: 4, type: "sine", amp: 0.1, detune: 4 },
    { mul: 5.04, type: "sine", amp: 0.06, detune: 0 }, // slight inharmonic
  ];

  for (const p of partials) {
    const osc = audio.createOscillator();
    osc.type = p.type;
    osc.frequency.value = freq * p.mul;
    osc.detune.value = p.detune;
    const g = audio.createGain();
    g.gain.value = p.amp;
    // higher partials die faster
    const life = duration * (0.35 + 0.65 / p.mul);
    g.gain.setValueAtTime(p.amp, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + life);
    osc.connect(g);
    g.connect(body);
    osc.start(when);
    osc.stop(when + life + 0.02);
  }

  // Pick noise transient
  const noiseDur = 0.03;
  const nBuf = audio.createBuffer(1, Math.ceil(audio.sampleRate * noiseDur), audio.sampleRate);
  const data = nBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = audio.createBufferSource();
  noise.buffer = nBuf;
  const nFilter = audio.createBiquadFilter();
  nFilter.type = "bandpass";
  nFilter.frequency.value = Math.min(4200, freq * 4);
  nFilter.Q.value = 0.8;
  const nGain = audio.createGain();
  nGain.gain.setValueAtTime(gain * 0.35, when);
  nGain.gain.exponentialRampToValueAtTime(0.0001, when + noiseDur);
  noise.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(body);
  noise.start(when);
  noise.stop(when + noiseDur + 0.01);

  body.connect(highShelf);
  highShelf.connect(master);
  master.connect(audio.destination);
}

/** Open-position style voicings in MIDI (guitar register). */
const OPEN_VOICINGS: Record<string, number[]> = {
  C: [48, 52, 55, 60, 64], // C E G C E
  G: [43, 47, 50, 55, 59, 67], // G B D G B G
  D: [50, 57, 62, 66], // D A D F#
  A: [45, 52, 57, 61, 64], // A E A C# E
  E: [40, 47, 52, 56, 59, 64], // E B E G# B E
  F: [41, 48, 53, 57, 60], // F C F A C
  Am: [45, 52, 57, 60, 64], // A E A C E
  Em: [40, 47, 52, 55, 59, 64], // E B E G B E
  Dm: [50, 57, 62, 65], // D A D F
  Bm: [47, 54, 59, 62, 66], // B F# B D F#
  "F#m": [42, 49, 54, 57, 61],
  Cm: [48, 55, 60, 63, 67],
  Bb: [46, 50, 53, 58, 62],
  B: [47, 54, 59, 63, 66],
  Eb: [51, 58, 63, 67],
  Ab: [44, 51, 56, 60, 63],
};

export function guitarChordMidis(rootName: string, quality: "maj" | "min"): number[] {
  const key = quality === "min" ? `${rootName}m` : rootName;
  if (OPEN_VOICINGS[key]) return OPEN_VOICINGS[key]!;
  // fallback: build close voicing around guitar range
  const roots: Record<string, number> = {
    C: 48, "C#": 49, Db: 49, D: 50, "D#": 51, Eb: 51, E: 40, F: 41,
    "F#": 42, Gb: 42, G: 43, "G#": 44, Ab: 44, A: 45, "A#": 46, Bb: 46, B: 47,
  };
  const root = roots[rootName] ?? 48;
  const third = quality === "min" ? 3 : 4;
  return [root, root + third, root + 7, root + 12, root + 12 + third];
}

export async function playGuitarChordHQ(
  rootName: string,
  quality: "maj" | "min",
  opts?: { duration?: number; volume?: number },
): Promise<void> {
  unlockAudioSync();
  const audio = await ensureAudioReady();
  const when = audio.currentTime + 0.02;
  const duration = opts?.duration ?? 2.4;
  const volume = opts?.volume ?? 0.22;
  const midis = guitarChordMidis(rootName, quality);
  midis.forEach((midi, i) => {
    // slight strum
    acousticPluck(
      audio,
      midi,
      when + i * 0.028,
      duration - i * 0.02,
      volume / Math.sqrt(midis.length),
    );
  });
}

export async function playReferenceTone(
  midi: number,
  opts?: { duration?: number; volume?: number },
): Promise<void> {
  unlockAudioSync();
  const audio = await ensureAudioReady();
  const when = audio.currentTime + 0.01;
  const duration = opts?.duration ?? 0.9;
  const volume = opts?.volume ?? 0.18;
  // soft pure reference for the note to sing
  const freq = midiToFreq(midi);
  const osc = audio.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(volume, when + 0.04);
  g.gain.linearRampToValueAtTime(volume * 0.7, when + duration * 0.5);
  g.gain.linearRampToValueAtTime(0.0001, when + duration);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}
