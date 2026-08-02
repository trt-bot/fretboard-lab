import { midiToFreq, type ResolvedChord } from "./music/theory";
import { ensureAudioReady, unlockAudioSync } from "./woodblock";
import { midiAt } from "./music/fretboard";

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
  filter.frequency.linearRampToValueAtTime(800, when + duration * 0.6);
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(Math.max(0.0001, gain), when + 0.01);
  g.gain.linearRampToValueAtTime(Math.max(0.0001, gain * 0.35), when + 0.12);
  g.gain.linearRampToValueAtTime(0.0001, when + duration);
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
  unlockAudioSync();
  const audio = await ensureAudioReady();
  const when = audio.currentTime + 0.02;
  const duration = opts?.duration ?? 1.1;
  const volume = opts?.volume ?? 0.28;
  const notes = chord.midis.slice(0, 4);
  notes.forEach((midi, i) => {
    pluck(audio, midi, when + i * 0.012, duration, volume / Math.sqrt(notes.length));
  });
}

export async function playMidiNote(
  midi: number,
  opts?: { duration?: number; volume?: number },
): Promise<void> {
  unlockAudioSync();
  const audio = await ensureAudioReady();
  pluck(
    audio,
    midi,
    audio.currentTime + 0.01,
    opts?.duration ?? 0.45,
    opts?.volume ?? 0.3,
  );
}

export async function playFretNote(string: number, fret: number): Promise<void> {
  return playMidiNote(midiAt(string, fret));
}

export type ProgressionPlayOpts = {
  beatSec?: number;
  volume?: number;
  loop?: boolean;
  countIn?: boolean;
  onStep?: (i: number) => void;
  onCountIn?: (beat: number) => void;
};

/**
 * Play chords in sequence. Returns cancel fn.
 * onStep(-1) when a non-looping run finishes.
 */
export async function playProgression(
  chords: ResolvedChord[],
  opts?: ProgressionPlayOpts,
): Promise<() => void> {
  unlockAudioSync();
  const audio = await ensureAudioReady();
  const beat = opts?.beatSec ?? 0.7;
  const volume = opts?.volume ?? 0.28;
  const loop = opts?.loop ?? false;
  const countIn = opts?.countIn ?? false;
  let cancelled = false;
  const timers: number[] = [];

  const scheduleOnce = (origin: number) => {
    let t = origin;
    if (countIn) {
      for (let b = 0; b < 4; b++) {
        const when = t + b * beat;
        const delay = Math.max(0, (when - audio.currentTime) * 1000);
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            opts?.onCountIn?.(b);
            // soft click via short high pluck
            pluck(audio, 88, audio.currentTime, 0.08, 0.12);
          }, delay),
        );
      }
      t += 4 * beat;
    }

    chords.forEach((chord, i) => {
      const when = t + i * beat;
      const delay = Math.max(0, (when - audio.currentTime) * 1000);
      timers.push(
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
        }, delay),
      );
    });

    const endAt = t + chords.length * beat;
    const endDelay = Math.max(0, (endAt - audio.currentTime) * 1000);
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        if (loop) {
          scheduleOnce(audio.currentTime + 0.02);
        } else {
          opts?.onStep?.(-1);
        }
      }, endDelay),
    );
  };

  scheduleOnce(audio.currentTime + 0.05);

  return () => {
    cancelled = true;
    timers.forEach((id) => window.clearTimeout(id));
  };
}

/** Ascending or descending midis sequence */
export async function playSequence(
  midis: number[],
  opts?: { noteSec?: number; volume?: number; onStep?: (i: number) => void },
): Promise<() => void> {
  unlockAudioSync();
  const audio = await ensureAudioReady();
  const noteSec = opts?.noteSec ?? 0.28;
  const volume = opts?.volume ?? 0.28;
  let cancelled = false;
  const timers: number[] = [];
  const start = audio.currentTime + 0.04;

  midis.forEach((midi, i) => {
    const when = start + i * noteSec;
    const delay = Math.max(0, (when - audio.currentTime) * 1000);
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        opts?.onStep?.(i);
        pluck(audio, midi, audio.currentTime, noteSec * 0.9, volume);
      }, delay),
    );
  });

  timers.push(
    window.setTimeout(() => {
      if (!cancelled) opts?.onStep?.(-1);
    }, (midis.length * noteSec + 0.05) * 1000),
  );

  return () => {
    cancelled = true;
    timers.forEach((id) => window.clearTimeout(id));
  };
}
