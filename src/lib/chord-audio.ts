import { midiToFreq, type ResolvedChord } from "./music/theory";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export async function ensureChordAudio(): Promise<AudioContext> {
  const c = getCtx();
  if (c.state === "suspended") await c.resume();
  return c;
}

function pluck(
  audio: AudioContext,
  midi: number,
  when: number,
  duration: number,
  gain: number,
) {
  const freq = midiToFreq(midi);
  const osc = audio.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = freq;
  const osc2 = audio.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = freq * 2;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2200, when);
  filter.frequency.exponentialRampToValueAtTime(800, when + duration * 0.6);
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.01);
  g.gain.exponentialRampToValueAtTime(gain * 0.35, when + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  const g2 = audio.createGain();
  g2.gain.value = 0.18;
  osc.connect(filter);
  osc2.connect(g2);
  g2.connect(filter);
  filter.connect(g);
  g.connect(audio.destination);
  osc.start(when);
  osc2.start(when);
  osc.stop(when + duration + 0.02);
  osc2.stop(when + duration + 0.02);
}

export async function playChord(
  chord: ResolvedChord,
  opts?: { duration?: number; volume?: number },
): Promise<void> {
  const audio = await ensureChordAudio();
  const when = audio.currentTime + 0.02;
  const duration = opts?.duration ?? 1.1;
  const volume = opts?.volume ?? 0.22;
  const notes = chord.midis.slice(0, 4);
  notes.forEach((midi, i) => {
    pluck(audio, midi, when + i * 0.012, duration, volume / Math.sqrt(notes.length));
  });
}

export async function playProgression(
  chords: ResolvedChord[],
  opts?: { beatSec?: number; volume?: number; onStep?: (i: number) => void },
): Promise<() => void> {
  const audio = await ensureChordAudio();
  const beat = opts?.beatSec ?? 0.7;
  const volume = opts?.volume ?? 0.22;
  let cancelled = false;
  const start = audio.currentTime + 0.05;

  chords.forEach((chord, i) => {
    const when = start + i * beat;
    const delay = Math.max(0, (when - audio.currentTime) * 1000);
    window.setTimeout(() => {
      if (cancelled) return;
      opts?.onStep?.(i);
      const notes = chord.midis.slice(0, 4);
      notes.forEach((midi, ni) => {
        pluck(
          audio,
          midi,
          audio.currentTime + ni * 0.01,
          beat * 0.95,
          volume / Math.sqrt(notes.length),
        );
      });
    }, delay);
  });

  window.setTimeout(() => {
    if (!cancelled) opts?.onStep?.(-1);
  }, (chords.length * beat + 0.05) * 1000);

  return () => {
    cancelled = true;
  };
}
