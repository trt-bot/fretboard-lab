/**
 * CAGED chord shapes — intermediate-friendly major & minor grips.
 * Frets are offsets from the shape’s root fret (barre / index reference).
 * string: 0 = low E … 5 = high e
 */

export type CagedLetter = "C" | "A" | "G" | "E" | "D";
export type CagedQuality = "maj" | "min";

export type ShapeFret = {
  string: number;
  /** fret offset from rootFret; -1 = mute */
  fret: number;
  /** finger hint 0=open/barre, 1–4 */
  finger?: number;
  root?: boolean;
};

export type CagedShape = {
  letter: CagedLetter;
  quality: CagedQuality;
  label: string;
  /** Which string carries the named root for this shape */
  rootString: number;
  frets: ShapeFret[];
  tip: string;
};

/** Major CAGED — classic movable forms */
const MAJOR: CagedShape[] = [
  {
    letter: "E",
    quality: "maj",
    label: "E shape",
    rootString: 0,
    frets: [
      { string: 0, fret: 0, finger: 0, root: true },
      { string: 1, fret: 2, finger: 3 },
      { string: 2, fret: 2, finger: 4 },
      { string: 3, fret: 1, finger: 2 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 0, finger: 0, root: true },
    ],
    tip: "Open E moved up with a barre. Root on low E — most common barre grip.",
  },
  {
    letter: "A",
    quality: "maj",
    label: "A shape",
    rootString: 1,
    frets: [
      { string: 0, fret: -1 },
      { string: 1, fret: 0, finger: 0, root: true },
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 2, finger: 3 },
      { string: 4, fret: 2, finger: 4 },
      { string: 5, fret: 0, finger: 0 },
    ],
    tip: "Open A moved up. Root on the A string. Great for mid-neck majors.",
  },
  {
    letter: "G",
    quality: "maj",
    label: "G shape",
    rootString: 0,
    frets: [
      { string: 0, fret: 3, finger: 3, root: true },
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 3, finger: 4, root: true },
    ],
    tip: "Open G family. Often thinned to fewer strings higher up the neck.",
  },
  {
    letter: "C",
    quality: "maj",
    label: "C shape",
    rootString: 1,
    frets: [
      { string: 0, fret: -1 },
      { string: 1, fret: 3, finger: 3, root: true },
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 1, finger: 1 },
      { string: 5, fret: 0, finger: 0 },
    ],
    tip: "Open C moved up. Root on A string three frets above the index.",
  },
  {
    letter: "D",
    quality: "maj",
    label: "D shape",
    rootString: 2,
    frets: [
      { string: 0, fret: -1 },
      { string: 1, fret: -1 },
      { string: 2, fret: 0, finger: 0, root: true },
      { string: 3, fret: 2, finger: 1 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 2, finger: 2 },
    ],
    tip: "Open D triangle moved up. Compact — perfect for double-stops too.",
  },
];

const MINOR: CagedShape[] = [
  {
    letter: "E",
    quality: "min",
    label: "Em shape",
    rootString: 0,
    frets: [
      { string: 0, fret: 0, finger: 0, root: true },
      { string: 1, fret: 2, finger: 3 },
      { string: 2, fret: 2, finger: 4 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 0, finger: 0, root: true },
    ],
    tip: "Open Em barred up the neck. Your default minor barre shape.",
  },
  {
    letter: "A",
    quality: "min",
    label: "Am shape",
    rootString: 1,
    frets: [
      { string: 0, fret: -1 },
      { string: 1, fret: 0, finger: 0, root: true },
      { string: 2, fret: 2, finger: 3 },
      { string: 3, fret: 2, finger: 4 },
      { string: 4, fret: 1, finger: 2 },
      { string: 5, fret: 0, finger: 0 },
    ],
    tip: "Open Am moved up. Root on A string — pairs with the major A shape.",
  },
  {
    letter: "G",
    quality: "min",
    label: "Gm shape",
    rootString: 0,
    frets: [
      { string: 0, fret: 3, finger: 3, root: true },
      { string: 1, fret: 5, finger: 4 },
      { string: 2, fret: 5, finger: 4 },
      { string: 3, fret: 3, finger: 1 },
      { string: 4, fret: 3, finger: 1 },
      { string: 5, fret: 3, finger: 1, root: true },
    ],
    tip: "Less common movable minor; think of it as a thick Em-form variant.",
  },
  {
    letter: "C",
    quality: "min",
    label: "Cm shape",
    rootString: 1,
    frets: [
      { string: 0, fret: -1 },
      { string: 1, fret: 3, finger: 3, root: true },
      { string: 2, fret: 5, finger: 4 },
      { string: 3, fret: 5, finger: 4 },
      { string: 4, fret: 4, finger: 2 },
      { string: 5, fret: 3, finger: 1 },
    ],
    tip: "Related to Am shape but rooted higher — useful for Cm higher up.",
  },
  {
    letter: "D",
    quality: "min",
    label: "Dm shape",
    rootString: 2,
    frets: [
      { string: 0, fret: -1 },
      { string: 1, fret: -1 },
      { string: 2, fret: 0, finger: 0, root: true },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 1, finger: 1 },
    ],
    tip: "Open Dm triangle moved up. Great for little minor grips on top strings.",
  },
];

export const CAGED_LETTERS: CagedLetter[] = ["C", "A", "G", "E", "D"];

export function getCagedShape(letter: CagedLetter, quality: CagedQuality): CagedShape {
  const list = quality === "maj" ? MAJOR : MINOR;
  return list.find((s) => s.letter === letter)!;
}

/** Place a shape so the root lands on `rootPc`. */
export function placeShape(
  shape: CagedShape,
  rootPc: number,
): { rootFret: number; placed: Array<ShapeFret & { absFret: number }> } | null {
  // Find frets on rootString that match rootPc (0–12)
  for (let f = 0; f <= 12; f++) {
    const open = [4, 9, 2, 7, 11, 4][shape.rootString]!;
    if ((open + f) % 12 !== rootPc) continue;
    // root fret of shape is where the root marker sits
    const rootOffset = shape.frets.find((x) => x.root)?.fret ?? 0;
    const rootFret = f - rootOffset;
    if (rootFret < 0 || rootFret > 10) continue;
    const placed = shape.frets
      .filter((x) => x.fret >= 0)
      .map((x) => ({
        ...x,
        absFret: rootFret + x.fret,
      }))
      .filter((x) => x.absFret >= 0 && x.absFret <= 15);
    if (placed.some((p) => p.root)) {
      return { rootFret, placed };
    }
  }
  return null;
}
