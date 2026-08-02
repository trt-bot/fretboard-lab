import { noteToPc, pcToName, type KeyId, keyRootName } from "./theory";
import { FRET_MAX, OPEN_STRING_PC, pcAt, STRING_COUNT } from "./fretboard";

export type ScaleId =
  | "major"
  | "minor"
  | "majorPent"
  | "minorPent"
  | "mixolydian"
  | "dorian";

export type ScaleDef = {
  id: ScaleId;
  label: string;
  short: string;
  intervals: number[];
  tip: string;
};

export const SCALES: ScaleDef[] = [
  {
    id: "major",
    label: "Major",
    short: "Maj",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    tip: "Home base for most pop & bluegrass. Chord tones are 1–3–5–7.",
  },
  {
    id: "minor",
    label: "Natural minor",
    short: "Min",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    tip: "Relative to major a minor third up. Darker color, same key signature as its relative major.",
  },
  {
    id: "majorPent",
    label: "Major pentatonic",
    short: "Maj pent",
    intervals: [0, 2, 4, 7, 9],
    tip: "Safe melodic glue over I–IV–V. Skip the half-steps for a more “sung” line.",
  },
  {
    id: "minorPent",
    label: "Minor pentatonic",
    short: "Min pent",
    intervals: [0, 3, 5, 7, 10],
    tip: "Blues/rock default. Add the ♭5 (blue note) later once the box is automatic.",
  },
  {
    id: "mixolydian",
    label: "Mixolydian",
    short: "Mixo",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    tip: "Major with ♭7 — the sound of dominant chords and jam-band grooves.",
  },
  {
    id: "dorian",
    label: "Dorian",
    short: "Dor",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    tip: "Minor with raised 6th. Classic over ii chords and minor funk vamps.",
  },
];

export function getScale(id: ScaleId): ScaleDef {
  return SCALES.find((s) => s.id === id)!;
}

export function scalePcs(rootPc: number, intervals: number[]): number[] {
  return intervals.map((i) => (rootPc + i) % 12);
}

export function rootPcFromKey(key: KeyId): number {
  return noteToPc(keyRootName(key));
}

export type NeckDot = {
  string: number;
  fret: number;
  pc: number;
  degree: number; // 1-based index in scale intervals
  isRoot: boolean;
  label: string;
};

/** All scale tones on frets 0–maxFret */
export function scaleDotsOnNeck(
  rootPc: number,
  intervals: number[],
  preferFlat: boolean,
  maxFret = FRET_MAX,
): NeckDot[] {
  const set = new Map(intervals.map((iv, idx) => [(rootPc + iv) % 12, idx] as const));
  const dots: NeckDot[] = [];
  for (let s = 0; s < STRING_COUNT; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const pc = pcAt(s, f);
      const idx = set.get(pc);
      if (idx === undefined) continue;
      dots.push({
        string: s,
        fret: f,
        pc,
        degree: idx + 1,
        isRoot: idx === 0,
        label: pcToName(pc, preferFlat),
      });
    }
  }
  return dots;
}

/**
 * CAGED-style box windows for a scale: five overlapping 4-fret regions
 * anchored to the lowest root on string 0 (low E) within frets 0–12.
 */
export function scaleBoxWindows(rootPc: number): Array<{ id: number; label: string; fretStart: number; fretEnd: number }> {
  // Find root frets on low E
  const roots: number[] = [];
  for (let f = 0; f <= FRET_MAX; f++) {
    if ((OPEN_STRING_PC[0]! + f) % 12 === rootPc) roots.push(f);
  }
  const anchor = roots[0] ?? 0;
  // Five boxes stepping up the neck
  const starts = [anchor, anchor + 2, anchor + 4, anchor + 7, anchor + 9].map((x) =>
    Math.max(0, Math.min(9, x)),
  );
  // Unique-ish windows
  const seen = new Set<number>();
  const boxes: Array<{ id: number; label: string; fretStart: number; fretEnd: number }> = [];
  let id = 1;
  for (const start of starts) {
    if (seen.has(start)) continue;
    seen.add(start);
    boxes.push({
      id,
      label: `Box ${id}`,
      fretStart: start,
      fretEnd: Math.min(FRET_MAX, start + 4),
    });
    id += 1;
    if (boxes.length >= 5) break;
  }
  return boxes;
}

export function filterDotsInBox(
  dots: NeckDot[],
  fretStart: number,
  fretEnd: number,
): NeckDot[] {
  return dots.filter((d) => d.fret >= fretStart && d.fret <= fretEnd);
}
