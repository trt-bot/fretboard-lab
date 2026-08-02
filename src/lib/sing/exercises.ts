import { noteToPc, pcToName, midiToFreq } from "../music/theory";

export type SingRoot = "C" | "D" | "E" | "F" | "G" | "A" | "Bb";
export type SingQuality = "maj" | "min";
export type ExerciseId =
  | "scaleUp"
  | "scaleUpDown"
  | "arp"
  | "arpUpDown";

export type ExerciseDef = {
  id: ExerciseId;
  label: string;
  short: string;
  tip: string;
};

export const EXERCISES: ExerciseDef[] = [
  {
    id: "scaleUp",
    label: "Scale ascending",
    short: "Scale ↑",
    tip: "Sing each degree of the scale up one octave. Chord sets the key center.",
  },
  {
    id: "scaleUpDown",
    label: "Scale up & down",
    short: "Scale ↕",
    tip: "Up the scale, then back down to the root. Stay centered on the chord.",
  },
  {
    id: "arp",
    label: "Arpeggio ascending",
    short: "Arp ↑",
    tip: "Chord tones only: 1–3–5–8. Match the guitar voicing’s color.",
  },
  {
    id: "arpUpDown",
    label: "Arpeggio up & down",
    short: "Arp ↕",
    tip: "1–3–5–8–5–3–1. Great for tuning the third and fifth.",
  },
];

export const SING_ROOTS: SingRoot[] = ["C", "D", "E", "F", "G", "A", "Bb"];

function scaleIntervals(quality: SingQuality): number[] {
  return quality === "min"
    ? [0, 2, 3, 5, 7, 8, 10, 12]
    : [0, 2, 4, 5, 7, 9, 11, 12];
}

function arpIntervals(quality: SingQuality): number[] {
  return quality === "min" ? [0, 3, 7, 12] : [0, 4, 7, 12];
}

export type SingNote = {
  midi: number;
  label: string;
  degree: string;
  freq: number;
};

function rootMidi(root: SingRoot, quality: SingQuality): number {
  const pc = noteToPc(root);
  let m = 60 + ((pc - 0 + 12) % 12);
  if (m > 66) m -= 12;
  if (m < 55) m += 12;
  if (root === "A" || root === "Bb") {
    m = 57 + ((pc - 9 + 12) % 12);
    if (m > 64) m -= 12;
  }
  if (quality === "min" && m > 64) m -= 12;
  return m;
}

export function buildExercise(
  root: SingRoot,
  quality: SingQuality,
  exerciseId: ExerciseId,
): SingNote[] {
  const r = rootMidi(root, quality);
  const preferFlat = root === "Bb" || root === "F";
  let semis: number[];
  if (exerciseId === "scaleUp") {
    semis = scaleIntervals(quality);
  } else if (exerciseId === "scaleUpDown") {
    const up = scaleIntervals(quality);
    semis = [...up, ...[...up].reverse().slice(1)];
  } else if (exerciseId === "arp") {
    semis = arpIntervals(quality);
  } else {
    const up = arpIntervals(quality);
    semis = [...up, ...[...up].reverse().slice(1)];
  }

  const degNamesMaj = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const degNamesMin = ["1", "2", "♭3", "4", "5", "♭6", "♭7", "8"];
  const degMap = quality === "min" ? degNamesMin : degNamesMaj;
  const intervalSet =
    exerciseId === "arp" || exerciseId === "arpUpDown"
      ? arpIntervals(quality)
      : scaleIntervals(quality);

  return semis.map((semi) => {
    const midi = r + semi;
    const withinOct = ((semi % 12) + 12) % 12;
    let degIdx = intervalSet.indexOf(withinOct === 0 && semi > 0 ? 12 : withinOct);
    if (semi === 12) degIdx = intervalSet.indexOf(12);
    if (degIdx < 0) {
      degIdx = intervalSet.indexOf(withinOct);
    }
    if (degIdx < 0) degIdx = 0;
    let degree = degMap[Math.min(degIdx, degMap.length - 1)]!;
    if (semi === 12) degree = "8";
    return {
      midi,
      label: pcToName(((midi % 12) + 12) % 12, preferFlat),
      degree,
      freq: midiToFreq(midi),
    };
  });
}

export function chordLabel(root: SingRoot, quality: SingQuality): string {
  return quality === "min" ? `${root}m` : root;
}
