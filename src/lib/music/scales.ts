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
    tip: "Blues/rock default. Add the ♭5 (blue note) later once the pattern is automatic.",
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

export function rootPcFromKey(key: KeyId): number {
  return noteToPc(keyRootName(key));
}

export type NeckDot = {
  string: number;
  fret: number;
  pc: number;
  degree: number;
  isRoot: boolean;
  label: string;
};

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

/** CAGED scale pattern letters — the classic five shapes */
export type CagedPatternLetter = "C" | "A" | "G" | "E" | "D";

export const CAGED_PATTERN_ORDER: CagedPatternLetter[] = ["C", "A", "G", "E", "D"];

/**
 * Major-scale CAGED pattern fingerings as fret offsets from the pattern root.
 * rootString = which string holds the defining root at offset 0.
 * Patterns follow common intermediate CAGED teaching grips.
 */
type RelNote = { string: number; fret: number; root?: boolean };

const MAJOR_CAGED_PATTERNS: Record<
  CagedPatternLetter,
  { rootString: number; label: string; tip: string; notes: RelNote[] }
> = {
  // E shape — open E major family; roots on 6th & 1st
  E: {
    rootString: 0,
    label: "E pattern",
    tip: "Like an E barre chord. Roots on the low E and high e — the most common “home” pattern.",
    notes: [
      { string: 0, fret: 0, root: true },
      { string: 0, fret: 2 },
      { string: 0, fret: 3 },
      { string: 1, fret: 0 },
      { string: 1, fret: 2 },
      { string: 1, fret: 3 },
      { string: 2, fret: 1 },
      { string: 2, fret: 2 },
      { string: 2, fret: 4 },
      { string: 3, fret: 1 },
      { string: 3, fret: 2 },
      { string: 3, fret: 4 },
      { string: 4, fret: 0 },
      { string: 4, fret: 2 },
      { string: 4, fret: 4 },
      { string: 5, fret: 0, root: true },
      { string: 5, fret: 2 },
      { string: 5, fret: 4 },
    ],
  },
  // D shape — root on D string
  D: {
    rootString: 2,
    label: "D pattern",
    tip: "Sits under a D-shape triad. Compact — great for double-stops on the top four strings.",
    notes: [
      { string: 0, fret: 0 },
      { string: 0, fret: 2 },
      { string: 0, fret: 3 },
      { string: 1, fret: 0 },
      { string: 1, fret: 2 },
      { string: 1, fret: 3 },
      { string: 2, fret: 0, root: true },
      { string: 2, fret: 2 },
      { string: 2, fret: 4 },
      { string: 3, fret: 0 },
      { string: 3, fret: 2 },
      { string: 3, fret: 4 },
      { string: 4, fret: 2 },
      { string: 4, fret: 3 },
      { string: 4, fret: 5 },
      { string: 5, fret: 2 },
      { string: 5, fret: 3 },
      { string: 5, fret: 5 },
    ],
  },
  // C shape — root on A string (like open C)
  C: {
    rootString: 1,
    label: "C pattern",
    tip: "Built around the C-shape chord. Root on the A string — connect it to the A pattern above it.",
    notes: [
      { string: 0, fret: 0 },
      { string: 0, fret: 1 },
      { string: 0, fret: 3 },
      { string: 1, fret: 0, root: true },
      { string: 1, fret: 2 },
      { string: 1, fret: 3 },
      { string: 2, fret: 0 },
      { string: 2, fret: 2 },
      { string: 2, fret: 3 },
      { string: 3, fret: 0 },
      { string: 3, fret: 2 },
      { string: 3, fret: 4 },
      { string: 4, fret: 1 },
      { string: 4, fret: 3 },
      { string: 4, fret: 5 },
      { string: 5, fret: 1 },
      { string: 5, fret: 3 },
      { string: 5, fret: 5 },
    ],
  },
  // A shape — root on A string (open A family)
  A: {
    rootString: 1,
    label: "A pattern",
    tip: "Like an A barre chord. Root on the A string; pairs with the E pattern a string set lower.",
    notes: [
      { string: 0, fret: 2 },
      { string: 0, fret: 3 },
      { string: 0, fret: 5 },
      { string: 1, fret: 0, root: true },
      { string: 1, fret: 2 },
      { string: 1, fret: 3 },
      { string: 2, fret: 0 },
      { string: 2, fret: 2 },
      { string: 2, fret: 4 },
      { string: 3, fret: 0 },
      { string: 3, fret: 2 },
      { string: 3, fret: 4 },
      { string: 4, fret: 2 },
      { string: 4, fret: 3 },
      { string: 4, fret: 5 },
      { string: 5, fret: 2 },
      { string: 5, fret: 3 },
      { string: 5, fret: 5 },
    ],
  },
  // G shape — roots on 6th & 1st (open G family)
  G: {
    rootString: 0,
    label: "G pattern",
    tip: "Open G family. Roots on low E and high e three frets above a neighboring E pattern root.",
    notes: [
      { string: 0, fret: 0, root: true },
      { string: 0, fret: 2 },
      { string: 0, fret: 3 },
      { string: 1, fret: 0 },
      { string: 1, fret: 2 },
      { string: 1, fret: 4 },
      { string: 2, fret: 0 },
      { string: 2, fret: 2 },
      { string: 2, fret: 4 },
      { string: 3, fret: 0 },
      { string: 3, fret: 2 },
      { string: 3, fret: 4 },
      { string: 4, fret: 0 },
      { string: 4, fret: 1 },
      { string: 4, fret: 3 },
      { string: 5, fret: 0, root: true },
      { string: 5, fret: 1 },
      { string: 5, fret: 3 },
    ],
  },
};

export type CagedScalePattern = {
  letter: CagedPatternLetter;
  label: string;
  tip: string;
  rootString: number;
  /** Absolute root fret used for this placement (on rootString) */
  rootFret: number;
  /** Inclusive fret window covered by the pattern */
  fretStart: number;
  fretEnd: number;
};

function findRootFrets(stringIndex: number, rootPc: number, maxFret = 15): number[] {
  const out: number[] = [];
  for (let f = 0; f <= maxFret; f++) {
    if ((OPEN_STRING_PC[stringIndex]! + f) % 12 === rootPc) out.push(f);
  }
  return out;
}

/**
 * Place all five CAGED scale patterns for a key root on the neck.
 * Prefers placements that sit mostly within frets 0–12.
 */
export function cagedScalePatterns(rootPc: number): CagedScalePattern[] {
  const patterns: CagedScalePattern[] = [];

  for (const letter of CAGED_PATTERN_ORDER) {
    const def = MAJOR_CAGED_PATTERNS[letter];
    const candidates = findRootFrets(def.rootString, rootPc, 15);

    let best: CagedScalePattern | null = null;
    let bestScore = Infinity;

    for (const rootFret of candidates) {
      const absFrets = def.notes.map((n) => rootFret + n.fret);
      const fretStart = Math.min(...absFrets);
      const fretEnd = Math.max(...absFrets);
      // Prefer patterns fully or mostly on 0–12
      if (fretEnd < 0 || fretStart > 14) continue;
      const outOfRange =
        absFrets.filter((f) => f < 0 || f > FRET_MAX).length +
        Math.max(0, fretEnd - FRET_MAX) +
        Math.max(0, -fretStart);
      const score = outOfRange * 10 + fretStart; // prefer lower neck when tied
      if (score < bestScore) {
        bestScore = score;
        best = {
          letter,
          label: def.label,
          tip: def.tip,
          rootString: def.rootString,
          rootFret,
          fretStart: Math.max(0, fretStart),
          fretEnd: Math.min(15, fretEnd),
        };
      }
    }

    if (best) patterns.push(best);
  }

  return patterns;
}

/**
 * Dots for a CAGED pattern: scale tones that fall on the pattern’s
 * string/fret offsets (major grip skeleton), filtered to the active scale.
 * Also includes any extra scale tones strictly inside the same per-string
 * fret span so pentatonics/modes still look complete in-hand.
 */
export function dotsForCagedPattern(
  rootPc: number,
  intervals: number[],
  preferFlat: boolean,
  pattern: CagedScalePattern,
): NeckDot[] {
  const def = MAJOR_CAGED_PATTERNS[pattern.letter];
  const scaleSet = new Map(
    intervals.map((iv, idx) => [(rootPc + iv) % 12, idx] as const),
  );

  // Per-string offset range from the major skeleton
  const ranges = new Map<number, { min: number; max: number }>();
  for (const n of def.notes) {
    const cur = ranges.get(n.string) ?? { min: n.fret, max: n.fret };
    cur.min = Math.min(cur.min, n.fret);
    cur.max = Math.max(cur.max, n.fret);
    ranges.set(n.string, cur);
  }

  const dots: NeckDot[] = [];
  const seen = new Set<string>();

  for (const [s, range] of ranges) {
    for (let off = range.min; off <= range.max; off++) {
      const fret = pattern.rootFret + off;
      if (fret < 0 || fret > 15) continue;
      const pc = pcAt(s, fret);
      const idx = scaleSet.get(pc);
      if (idx === undefined) continue;
      const key = `${s}-${fret}`;
      if (seen.has(key)) continue;
      seen.add(key);
      dots.push({
        string: s,
        fret,
        pc,
        degree: idx + 1,
        isRoot: idx === 0,
        label: pcToName(pc, preferFlat),
      });
    }
  }

  return dots;
}

/** @deprecated use cagedScalePatterns */
export function scaleBoxWindows(rootPc: number) {
  return cagedScalePatterns(rootPc).map((p, i) => ({
    id: i + 1,
    label: p.label,
    fretStart: p.fretStart,
    fretEnd: p.fretEnd,
    letter: p.letter,
  }));
}

export function filterDotsInBox(
  dots: NeckDot[],
  fretStart: number,
  fretEnd: number,
): NeckDot[] {
  return dots.filter((d) => d.fret >= fretStart && d.fret <= fretEnd);
}
