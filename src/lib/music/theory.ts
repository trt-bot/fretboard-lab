export const NOTE_NAMES_SHARP = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export const NOTE_NAMES_FLAT = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
] as const;

export type ChordQuality =
  | "maj" | "min" | "dom7" | "maj7" | "min7" | "dim" | "dim7"
  | "halfdim" | "aug" | "sus2" | "sus4" | "min6" | "maj6"
  | "dom9" | "min9" | "dom7b9" | "maj9";

export type ChordFunction =
  | "tonic" | "subdominant" | "dominant" | "predominant"
  | "secondary" | "passing" | "modal";

const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  halfdim: [0, 3, 6, 10],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  min6: [0, 3, 7, 9],
  maj6: [0, 4, 7, 9],
  dom9: [0, 4, 7, 10, 14],
  min9: [0, 3, 7, 10, 14],
  dom7b9: [0, 4, 7, 10, 13],
  maj9: [0, 4, 7, 11, 14],
};

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: "",
  min: "m",
  dom7: "7",
  maj7: "maj7",
  min7: "m7",
  dim: "dim",
  dim7: "dim7",
  halfdim: "m7♭5",
  aug: "aug",
  sus2: "sus2",
  sus4: "sus4",
  min6: "m6",
  maj6: "6",
  dom9: "9",
  min9: "m9",
  dom7b9: "7♭9",
  maj9: "maj9",
};

const PREFER_FLAT = new Set([
  "F", "Bb", "Eb", "Ab", "Db", "Gb", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm",
]);

export const MAJOR_KEYS = [
  "C", "G", "D", "A", "E", "B", "F", "Bb", "Eb", "Ab",
] as const;

export const MINOR_KEYS = [
  "Am", "Em", "Bm", "F#m", "C#m", "Dm", "Gm", "Cm", "Fm",
] as const;

export type KeyId =
  | (typeof MAJOR_KEYS)[number]
  | (typeof MINOR_KEYS)[number];

export function isMinorKey(key: KeyId): boolean {
  return key.endsWith("m") && key.length > 1;
}

export function keyRootName(key: KeyId): string {
  return isMinorKey(key) ? key.slice(0, -1) : key;
}

export function noteToPc(note: string): number {
  const n = note.replace("♭", "b").replace("♯", "#");
  const sharp = NOTE_NAMES_SHARP.indexOf(n as (typeof NOTE_NAMES_SHARP)[number]);
  if (sharp >= 0) return sharp;
  const flat = NOTE_NAMES_FLAT.indexOf(n as (typeof NOTE_NAMES_FLAT)[number]);
  if (flat >= 0) return flat;
  const map: Record<string, number> = { Cb: 11, Fb: 4, "E#": 5, "B#": 0 };
  if (n in map) return map[n]!;
  throw new Error(`Unknown note: ${note}`);
}

export function pcToName(pc: number, preferFlat: boolean): string {
  const i = ((pc % 12) + 12) % 12;
  return preferFlat ? NOTE_NAMES_FLAT[i]! : NOTE_NAMES_SHARP[i]!;
}

export function preferFlatForKey(key: KeyId): boolean {
  return PREFER_FLAT.has(key);
}

export function diatonicOffsets(minor: boolean): number[] {
  return minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
}

const ROMAN_MAP: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7,
};

export function parseDegree(token: string) {
  let s = token.trim();
  let alter = 0;
  if (s.startsWith("b") || s.startsWith("♭")) {
    alter = -1;
    s = s.slice(1);
  } else if (s.startsWith("#") || s.startsWith("♯")) {
    alter = 1;
    s = s.slice(1);
  }

  const m = s.match(/^(vii|iii|ii|iv|vi|v|i)(.*)$/i);
  if (!m) throw new Error(`Bad degree token: ${token}`);
  const roman = m[1]!;
  const tail = m[2] ?? "";
  const degree = ROMAN_MAP[roman.toLowerCase()]!;
  const isUpper = roman[0] === roman[0]!.toUpperCase();
  const t = tail.replace("°", "dim").replace("ø", "halfdim");

  let quality: ChordQuality;
  if (t === "7") quality = isUpper ? "dom7" : "min7";
  else if (t === "maj7" || t === "Δ" || t === "M7") quality = "maj7";
  else if (t === "m7" || t === "-7") quality = "min7";
  else if (t === "dim" || t === "o") quality = "dim";
  else if (t === "dim7" || t === "o7") quality = "dim7";
  else if (t === "halfdim" || t === "m7b5") quality = "halfdim";
  else if (t === "aug" || t === "+") quality = "aug";
  else if (t === "sus2") quality = "sus2";
  else if (t === "sus4" || t === "sus") quality = "sus4";
  else if (t === "6") quality = isUpper ? "maj6" : "min6";
  else if (t === "m6") quality = "min6";
  else if (t === "9") quality = "dom9";
  else if (t === "m9") quality = "min9";
  else if (t === "7b9" || t === "7♭9") quality = "dom7b9";
  else if (t === "maj9") quality = "maj9";
  else quality = isUpper ? "maj" : "min";

  return { raw: token, degree, alter, quality };
}

export type ResolvedChord = {
  name: string;
  root: string;
  quality: ChordQuality;
  pcs: number[];
  midis: number[];
  functionHint: ChordFunction;
  degreeLabel: string;
};

export function functionForDegree(
  degree: number,
  quality: ChordQuality,
  minor: boolean,
): ChordFunction {
  if (quality === "dom7" || quality === "dom9" || quality === "dom7b9") {
    return degree === 5 ? "dominant" : "secondary";
  }
  if (degree === 1) return "tonic";
  if (degree === 5) return "dominant";
  if (degree === 4) return "subdominant";
  if (degree === 2) return "predominant";
  if (degree === 6) return minor ? "subdominant" : "tonic";
  if (degree === 3) return "tonic";
  if (degree === 7) return "dominant";
  return "passing";
}

export function resolveChord(key: KeyId, degreeToken: string): ResolvedChord {
  const parsed = parseDegree(degreeToken);
  const minor = isMinorKey(key);
  const preferFlat = preferFlatForKey(key);
  const rootPc = noteToPc(keyRootName(key));
  const offsets = diatonicOffsets(minor);
  const base = offsets[parsed.degree - 1]!;
  const chordRootPc = (rootPc + base + parsed.alter + 120) % 12;
  const quality = parsed.quality;
  const intervals = QUALITY_INTERVALS[quality];
  const pcs = intervals.map((i) => (chordRootPc + i) % 12);
  const rootName = pcToName(chordRootPc, preferFlat);
  const name = `${rootName}${QUALITY_SUFFIX[quality]}`;
  const baseMidi = 48 + chordRootPc;
  const midis = intervals.map((semi) => {
    let m = baseMidi + semi;
    while (m > baseMidi + 14) m -= 12;
    return m;
  });

  return {
    name,
    root: rootName,
    quality,
    pcs,
    midis,
    functionHint: functionForDegree(parsed.degree, quality, minor),
    degreeLabel: degreeToken,
  };
}

export function resolveProgression(key: KeyId, degrees: string[]): ResolvedChord[] {
  return degrees.map((d) => resolveChord(key, d));
}

export const FUNCTION_LABEL: Record<ChordFunction, string> = {
  tonic: "Tonic",
  subdominant: "Subdominant",
  dominant: "Dominant",
  predominant: "Predominant",
  secondary: "Secondary dominant",
  passing: "Passing / color",
  modal: "Modal color",
};

export const FUNCTION_BLURB: Record<ChordFunction, string> = {
  tonic: "Home base — rest, resolution, and the sense of “here.”",
  subdominant: "Moves away from home; opens space without demanding resolution.",
  dominant: "Creates tension that wants to resolve back to tonic.",
  predominant: "Sets up the dominant; the classic approach to V.",
  secondary: "Temporarily tonicizes another chord (often V of V, or V of ii).",
  passing: "Connects harmonies; more about motion than destination.",
  modal: "Borrowed color from a parallel mode or related scale.",
};

export function guitarShapeHint(chordName: string): string | null {
  const open: Record<string, string> = {
    C: "x32010", Cmaj7: "x32000", G: "320003", D: "xx0232", D7: "xx0212",
    A: "x02220", A7: "x02020", E: "022100", E7: "020100", Am: "x02210",
    Am7: "x02010", Em: "022000", Em7: "020000", Dm: "xx0231", Dm7: "xx0211",
    F: "133211 (barre)", Bm: "x24432 (barre)", B7: "x21202", "F#m": "244222 (barre)",
  };
  return open[chordName] ?? null;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
