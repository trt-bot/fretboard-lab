import type { KeyId } from "./theory";

export type GenreId = "bluegrass" | "gypsy" | "pop" | "songwriting";

export type Progression = {
  id: string;
  name: string;
  degrees: string[];
  summary: string;
  theory: string;
  guitarTip: string;
  defaultKeys?: KeyId[];
  tags?: string[];
};

export type GenrePack = {
  id: GenreId;
  label: string;
  shortLabel: string;
  description: string;
  preferMinor?: boolean;
  hallmarks: string[];
  theoryGuide: {
    title: string;
    paragraphs: string[];
    tips: string[];
  };
  progressions: Progression[];
};

export const GENRE_PACKS: GenrePack[] = [
  {
    id: "bluegrass",
    label: "Bluegrass",
    shortLabel: "Bluegrass",
    description:
      "Open-string keys, strong I–IV–V motion, and turnarounds that keep the band rolling between verses and breaks.",
    hallmarks: [
      "Major keys (G, A, D, C, E)",
      "I–IV–V backbone",
      "Secondary dominants (II7, VI7)",
      "Fast changes & circle movement",
    ],
    theoryGuide: {
      title: "Bluegrass harmony in plain language",
      paragraphs: [
        "Most bluegrass harmony is diatonic major with a heavy lean on I, IV, and V. The groove and melody do a lot of the storytelling; chords keep the form clear so solos can fly.",
        "When a progression walks, it often uses secondary dominants — major chords built on scale degrees that would normally be minor (II7, VI7). These create a temporary pull into the next chord, classic in fiddle-tune turnarounds.",
        "Keys like G, A, D, and C favor open rings and double-stops. Know where V lands so you can set up the resolve into the next chorus.",
      ],
      tips: [
        "Learn every progression in G and A first — jam standards live there.",
        "Practice II7 → V → I slowly; that turnaround shows up everywhere.",
        "On guitar, keep rhythm sparse: boom-chuck or simple chop on the backbeat.",
      ],
    },
    progressions: [
      {
        id: "bg-145",
        name: "Classic I–IV–V",
        degrees: ["I", "IV", "V", "I"],
        summary: "The bedrock of breakdowns, gospel numbers, and fiddle tunes.",
        theory: "Tonic → subdominant → dominant → tonic. IV opens space; V demands home.",
        guitarTip: "In G: G–C–D–G. Use open shapes and let the high strings ring.",
        defaultKeys: ["G", "A", "D", "C"],
        tags: ["foundation", "jam"],
      },
      {
        id: "bg-1645",
        name: "I–vi–IV–V",
        degrees: ["I", "vi", "IV", "V"],
        summary: "A softer verse cycle that still turns around cleanly on V.",
        theory: "vi is the relative minor — same notes as I, darker color. Then IV–V re-establishes major drive.",
        guitarTip: "Great for ballads. Voice vi close to I so the left hand barely moves.",
        defaultKeys: ["G", "C", "D"],
        tags: ["verse", "ballad"],
      },
      {
        id: "bg-1625",
        name: "I–VI7–II7–V",
        degrees: ["I", "VI7", "II7", "V"],
        summary: "The circle turnaround — secondary dominants walking home.",
        theory: "VI7 is V of ii; II7 is V of V. Each chord is a temporary dominant aiming at the next.",
        guitarTip: "In G: G–E7–A7–D. Practice the E7→A7→D run until it is automatic.",
        defaultKeys: ["G", "A", "C", "D"],
        tags: ["turnaround", "circle"],
      },
      {
        id: "bg-1415",
        name: "I–IV–I–V",
        degrees: ["I", "IV", "I", "V"],
        summary: "Verse motion that returns to I before the dominant push.",
        theory: "Revisiting I mid-phrase reinforces the home key so the final V feels like a clear question.",
        guitarTip: "Standard for many A-parts. Count bar lengths carefully when trading breaks.",
        defaultKeys: ["G", "A", "D"],
        tags: ["verse"],
      },
      {
        id: "bg-b7",
        name: "I–♭VII–IV–I",
        degrees: ["I", "bVII", "IV", "I"],
        summary: "Modal mixolydian color — flat-seven folk rock edge.",
        theory: "♭VII is borrowed from mixolydian. It softens the dominant pull and feels open / modal.",
        guitarTip: "In G: G–F–C–G. Works great with droning open G or D strings.",
        defaultKeys: ["G", "A", "D", "E"],
        tags: ["modal", "groove"],
      },
      {
        id: "bg-1251",
        name: "I–II7–V–I",
        degrees: ["I", "II7", "V", "I"],
        summary: "Short secondary-dominant punch into the cadence.",
        theory: "II7 (V/V) intensifies the approach to V. Two chords of setup, then a strong authentic cadence.",
        guitarTip: "In A: A–B7–E–A. Common in up-tempo numbers and tags.",
        defaultKeys: ["A", "G", "D", "E"],
        tags: ["cadence", "tag"],
      },
    ],
  },
  {
    id: "gypsy",
    label: "Gypsy Jazz",
    shortLabel: "Gypsy jazz",
    description:
      "Minor-key drama, dominant cycles, diminished passing chords, and the Django vocabulary of V7s that never sit still.",
    preferMinor: true,
    hallmarks: [
      "Minor keys (Am, Dm, Em, Gm)",
      "V7 and V7♭9 tension",
      "ii–V–i minor cadences",
      "Diminished approach chords",
    ],
    theoryGuide: {
      title: "Gypsy jazz harmony in plain language",
      paragraphs: [
        "Gypsy jazz loves minor tonality and dominant chords that pull hard. Expect lots of V7 resolving to i, plus circle-of-fifths motion.",
        "The classic minor ii–V–i uses half-diminished on ii, then V7 into i. Major-key swing tunes still appear, but the Django sound is often the minor side.",
        "Rhythm guitar (la pompe) outlines chord changes clearly; lead lines weave arpeggios around these targets.",
      ],
      tips: [
        "Internalize i–iv–V7–i and i–iiø–V7–i in Am and Dm.",
        "Practice dominant cycles: E7–A7–D7–G7 walking by fifths.",
        "On guitar, learn shell voicings (root–3–7) for fast changes.",
      ],
    },
    progressions: [
      {
        id: "gj-i-iv-v",
        name: "i–iv–V7–i",
        degrees: ["i", "iv", "V7", "i"],
        summary: "Minor blues-adjacent home loop with a strong dominant.",
        theory: "Raising the leading tone makes V major/dominant, which is why V7 → i feels so final.",
        guitarTip: "In Am: Am–Dm–E7–Am. Accent the pompe on 2 and 4.",
        defaultKeys: ["Am", "Dm", "Em", "Gm"],
        tags: ["foundation", "minor"],
      },
      {
        id: "gj-ii-v-i",
        name: "iiø–V7–i",
        degrees: ["iiø", "V7", "i"],
        summary: "The essential minor cadence — target practice for solos.",
        theory: "iiø shares tension tones with V7; together they form a concentrated pull into i.",
        guitarTip: "In Am: Bm7♭5–E7–Am. Arpeggiate each chord as a daily drill.",
        defaultKeys: ["Am", "Dm", "Em"],
        tags: ["cadence", "core"],
      },
      {
        id: "gj-django",
        name: "i–VI7–iiø–V7",
        degrees: ["i", "VI7", "iiø", "V7"],
        summary: "A Django-friendly cycle that never quite rests.",
        theory: "VI7 acts as a secondary dominant toward ii; then iiø–V7 sets up resolution.",
        guitarTip: "In Am: Am–F7–Bm7♭5–E7. Great for minor swing heads.",
        defaultKeys: ["Am", "Dm", "Gm"],
        tags: ["swing", "turnaround"],
      },
      {
        id: "gj-andalusian",
        name: "i–VII–VI–V7",
        degrees: ["i", "VII", "VI", "V7"],
        summary: "Descending Andalusian bass — dramatic minor walk-down.",
        theory: "A stepwise bass from i down to V. V7 restores the leading tone for a powerful loop.",
        guitarTip: "In Am: Am–G–F–E7. Let bass notes sing on the low strings.",
        defaultKeys: ["Am", "Dm", "Em"],
        tags: ["bass line", "dramatic"],
      },
      {
        id: "gj-circle",
        name: "Minor circle: i–iv–VII–III–VI–iiø–V7–i",
        degrees: ["i", "iv", "VII", "III", "VI", "iiø", "V7", "i"],
        summary: "Long-form minor circle — full tour of the key.",
        theory: "Moving mostly by descending fifths. The final iiø–V7–i seals the form.",
        guitarTip: "In Am: Am Dm G C F Bm7♭5 E7 Am. One chord per bar slowly, then la pompe.",
        defaultKeys: ["Am", "Dm"],
        tags: ["study", "circle"],
      },
      {
        id: "gj-major-rhythm",
        name: "I–VI7–ii7–V7",
        degrees: ["I", "VI7", "ii7", "V7"],
        summary: "Major-key rhythm changes cell (gypsy swing standards).",
        theory: "Same secondary-dominant logic as jazz rhythm changes: VI7 → ii, then ii–V back to I.",
        guitarTip: "In C: C–A7–Dm7–G7.",
        defaultKeys: ["C", "G", "F", "Bb"],
        tags: ["major", "swing"],
      },
    ],
  },
  {
    id: "pop",
    label: "Pop",
    shortLabel: "Pop",
    description:
      "Singable loops, relative-minor drama, and the handful of progressions behind decades of hits — mapped for guitar keys.",
    hallmarks: [
      "I–V–vi–IV and siblings",
      "Relative minor lifts",
      "Four-chord loops",
      "Clear verse / chorus lifts",
    ],
    theoryGuide: {
      title: "Pop harmony in plain language",
      paragraphs: [
        "Modern pop often loops four diatonic chords. Order and melodic emphasis matter more than rare jazz harmony.",
        "I–V–vi–IV balances lift (V), melancholy (vi), and openness (IV). Starting on vi flips the emotional center toward the relative minor.",
        "Open-friendly keys (G, C, D, A, E, Am) keep progressions singable and capo-friendly.",
      ],
      tips: [
        "Write the melody first on two chords, then expand to four.",
        "Try the same four chords starting on a different degree for a new section.",
        "Capo to keep open shapes while matching a singer’s range.",
      ],
    },
    progressions: [
      {
        id: "pop-axis",
        name: "I–V–vi–IV",
        degrees: ["I", "V", "vi", "IV"],
        summary: "The modern pop axis — anthemic and endlessly reusable.",
        theory: "V lifts, vi brings relative-minor color, IV softens before looping.",
        guitarTip: "In G: G–D–Em–C. Capo and open chords cover most singer ranges.",
        defaultKeys: ["G", "C", "D", "A"],
        tags: ["chorus", "hit"],
      },
      {
        id: "pop-sensitive",
        name: "vi–IV–I–V",
        degrees: ["vi", "IV", "I", "V"],
        summary: "Same family as above, starting on vi for a bittersweet open.",
        theory: "Beginning on vi makes the loop feel minor even though all chords are from the major key.",
        guitarTip: "In C: Am–F–C–G. Classic ballad / indie bed for fingerpicking.",
        defaultKeys: ["C", "G", "D", "A"],
        tags: ["ballad", "verse"],
      },
      {
        id: "pop-50s",
        name: "I–vi–IV–V",
        degrees: ["I", "vi", "IV", "V"],
        summary: "Doo-wop / 50s progression — timeless story-song cycle.",
        theory: "I–vi is a gentle step into relative minor; IV–V is a textbook approach to cadence.",
        guitarTip: "In G: G–Em–C–D.",
        defaultKeys: ["G", "C", "D", "A", "F"],
        tags: ["classic", "story"],
      },
      {
        id: "pop-1645-var",
        name: "I–IV–vi–V",
        degrees: ["I", "IV", "vi", "V"],
        summary: "Opens with plagal warmth, then minor color into V.",
        theory: "I–IV is churchy/plagal; vi darkens; V reloads the loop.",
        guitarTip: "In D: D–G–Bm–A. Nice for mid-tempo acoustic pop.",
        defaultKeys: ["D", "G", "C", "A"],
        tags: ["verse", "acoustic"],
      },
      {
        id: "pop-canon",
        name: "I–V–vi–iii–IV–I–IV–V",
        degrees: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"],
        summary: "Pachelbel-style descent — long-form diatonic elegance.",
        theory: "A mostly stepwise harmonic bass with diatonic chords.",
        guitarTip: "In C: C G Am Em F C F G. Use arpeggios; let bass notes outline the walk.",
        defaultKeys: ["C", "G", "D"],
        tags: ["ballad", "long form"],
      },
      {
        id: "pop-251",
        name: "ii–V–I",
        degrees: ["ii", "V", "I"],
        summary: "Jazz-pop cadence for bridges, outros, and soulful turns.",
        theory: "Predominant → dominant → tonic. Even one ii–V–I can elevate a bridge.",
        guitarTip: "In C: Dm–G–C. Add 7ths (Dm7–G7–C) for smoother R&B color.",
        defaultKeys: ["C", "G", "F", "D"],
        tags: ["bridge", "cadence"],
      },
    ],
  },
  {
    id: "songwriting",
    label: "Songwriting & theory",
    shortLabel: "Songwriting",
    description:
      "General-purpose maps for writers: cadences, borrowed color, emotional tools, and how to explore when you are stuck.",
    hallmarks: [
      "Functional harmony",
      "Cadences & emotion",
      "Modal interchange",
      "Exploration prompts",
    ],
    theoryGuide: {
      title: "A songwriter’s harmonic toolkit",
      paragraphs: [
        "Think in functions, not only chord names. Tonic feels like home. Subdominant moves away gently. Dominant creates need.",
        "When stuck, change one variable: start on a different chord, swap V for IV, borrow one chord from parallel minor, or insert a secondary dominant.",
        "Melody and bass tell the truth. Use this explorer to hear chord functions, then sing against them.",
      ],
      tips: [
        "Write with roman numerals first, then pick a guitar-friendly key.",
        "Limit new songs to 3–5 chords until the melody is strong.",
        "Borrow one chord max at first — small color, big impact.",
        "Map verse = softer functions, chorus = clearer I and V.",
      ],
    },
    progressions: [
      {
        id: "sw-authentic",
        name: "Authentic cadence: V–I",
        degrees: ["V", "I"],
        summary: "The strongest period at the end of a musical sentence.",
        theory: "Dominant to tonic. Use at phrase ends for certainty.",
        guitarTip: "Practice landing V with a rest, then I on the downbeat.",
        defaultKeys: ["G", "C", "D", "A", "Am"],
        tags: ["cadence", "foundation"],
      },
      {
        id: "sw-plagal",
        name: "Plagal cadence: IV–I",
        degrees: ["IV", "I"],
        summary: "The amen cadence — warm resolution without dominant bite.",
        theory: "Subdominant to tonic. Softer than V–I; great for outros and gospel color.",
        guitarTip: "In G: C–G. Try hammer-ons on the C shape into open G.",
        defaultKeys: ["G", "C", "D", "E"],
        tags: ["cadence", "soft"],
      },
      {
        id: "sw-deceptive",
        name: "Deceptive cadence: V–vi",
        degrees: ["V", "vi"],
        summary: "Sets up home, then slips to relative minor — emotional twist.",
        theory: "Listeners expect V–I; V–vi postpones closure.",
        guitarTip: "In C: G–Am. Follow later with a real V–I so the story still resolves.",
        defaultKeys: ["C", "G", "D", "A"],
        tags: ["cadence", "drama"],
      },
      {
        id: "sw-borrowed",
        name: "Modal interchange: I–♭VII–IV–I",
        degrees: ["I", "bVII", "IV", "I"],
        summary: "Borrow ♭VII from mixolydian / parallel minor for rock color.",
        theory: "One borrowed chord can redefine a major-key song without a full key change.",
        guitarTip: "In A: A–G–D–A. Power-chord friendly.",
        defaultKeys: ["A", "G", "E", "D"],
        tags: ["color", "rock"],
      },
      {
        id: "sw-secondary",
        name: "Secondary dominant: I–V/V–V–I",
        degrees: ["I", "II7", "V", "I"],
        summary: "Briefly tonicize V — a classic way to raise stakes mid-phrase.",
        theory: "II7 is V of V. You step outside pure diatonic harmony for one chord.",
        guitarTip: "In G: G–A7–D–G. The A7 is only one shape away from open A.",
        defaultKeys: ["G", "C", "D", "A"],
        tags: ["tension", "lift"],
      },
      {
        id: "sw-minor-lift",
        name: "Relative pivot: I–iii–vi–IV",
        degrees: ["I", "iii", "vi", "IV"],
        summary: "Walk into the relative-minor neighborhood, then open on IV.",
        theory: "iii is underused and acts as a smooth bridge toward vi.",
        guitarTip: "In C: C–Em–Am–F. Fingerstyle-friendly; bass can walk C–B–A–F.",
        defaultKeys: ["C", "G", "D", "F"],
        tags: ["verse", "melody"],
      },
      {
        id: "sw-explore",
        name: "Writer’s loop: I–vi–ii–V",
        degrees: ["I", "vi", "ii", "V"],
        summary: "A balanced loop for sketching melodies and lyric phrasing.",
        theory: "Covers tonic color (I, vi), predominant (ii), and dominant (V).",
        guitarTip: "In C: C–Am–Dm–G. Record a two-minute loop and sing until phrases stick.",
        defaultKeys: ["C", "G", "F", "D", "A"],
        tags: ["sketch", "loop"],
      },
    ],
  },
];

export function getGenre(id: GenreId): GenrePack {
  const g = GENRE_PACKS.find((p) => p.id === id);
  if (!g) throw new Error(`Unknown genre: ${id}`);
  return g;
}

export function defaultKeyForGenre(genre: GenrePack): KeyId {
  const first = genre.progressions[0]?.defaultKeys?.[0];
  if (first) return first;
  return genre.preferMinor ? "Am" : "G";
}
