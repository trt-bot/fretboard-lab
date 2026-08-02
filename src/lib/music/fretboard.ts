/** Guitar fretboard helpers — standard tuning, frets 0–12 */

export const STRING_COUNT = 6;
export const FRET_MAX = 12;

/** Low E → high e open pitch classes */
export const OPEN_STRING_PC = [4, 9, 2, 7, 11, 4] as const;

/** Display names for strings low→high */
export const STRING_LABELS = ["E", "A", "D", "G", "B", "e"] as const;

export const NATURAL_PCS = [0, 2, 4, 5, 7, 9, 11] as const;

export function pcAt(stringIndex: number, fret: number): number {
  return (OPEN_STRING_PC[stringIndex]! + fret) % 12;
}

export function midiAt(stringIndex: number, fret: number): number {
  // Low E open = 40
  const openMidi = [40, 45, 50, 55, 59, 64][stringIndex]!;
  return openMidi + fret;
}

export function allPositionsForPc(
  pc: number,
  maxFret = FRET_MAX,
): Array<{ string: number; fret: number }> {
  const out: Array<{ string: number; fret: number }> = [];
  for (let s = 0; s < STRING_COUNT; s++) {
    for (let f = 0; f <= maxFret; f++) {
      if (pcAt(s, f) === pc) out.push({ string: s, fret: f });
    }
  }
  return out;
}
