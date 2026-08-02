import { useMemo, useRef, useState } from "react";
import {
  CAGED_LETTERS,
  getCagedShape,
  placeShape,
  type CagedLetter,
  type CagedQuality,
} from "../lib/music/caged";
import {
  CAGED_PATTERN_ORDER,
  cagedScalePatterns,
  dotsForCagedPattern,
  getScale,
  rootPcFromKey,
  SCALES,
  type CagedPatternLetter,
  type ScaleId,
} from "../lib/music/scales";
import {
  MAJOR_KEYS,
  MINOR_KEYS,
  noteToPc,
  pcToName,
  preferFlatForKey,
  type KeyId,
} from "../lib/music/theory";
import { midiAt, STRING_LABELS } from "../lib/music/fretboard";
import { playSequence, playMidiNote } from "../lib/chord-audio";
import { unlockAudioSync } from "../lib/woodblock";
import { Fretboard, type FretMark } from "./Fretboard";

type Tab = "scales" | "caged";

const ROOTS = ["C", "G", "D", "A", "E", "F", "Bb", "B", "Eb", "Ab", "F#", "Db"] as const;

export function ScaleCagedApp() {
  const [tab, setTab] = useState<Tab>("scales");

  const [scaleId, setScaleId] = useState<ScaleId>("major");
  const [key, setKey] = useState<KeyId>("G");
  const [patternLetter, setPatternLetter] = useState<CagedPatternLetter>("E");
  const [playing, setPlaying] = useState(false);
  const [, setActiveIdx] = useState<number | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const [cagedRoot, setCagedRoot] = useState<string>("G");
  const [cagedQuality, setCagedQuality] = useState<CagedQuality>("maj");
  const [cagedLetter, setCagedLetter] = useState<CagedLetter>("E");

  const scale = getScale(scaleId);
  const preferFlat = preferFlatForKey(key);
  const rootPc = rootPcFromKey(key);

  const patterns = useMemo(() => cagedScalePatterns(rootPc), [rootPc]);
  const activePattern =
    patterns.find((p) => p.letter === patternLetter) ?? patterns[0]!;

  // If selected letter missing for this key (rare), fall back
  const pattern =
    activePattern ??
    ({
      letter: "E" as const,
      label: "E pattern",
      tip: "",
      rootString: 0,
      rootFret: 0,
      fretStart: 0,
      fretEnd: 4,
    } as const);

  const patternDots = useMemo(
    () =>
      dotsForCagedPattern(rootPc, scale.intervals, preferFlat, pattern),
    [rootPc, scale.intervals, preferFlat, pattern],
  );

  const scaleMarks: FretMark[] = useMemo(() => {
    return patternDots.map((d) => ({
      string: d.string,
      fret: d.fret,
      kind: d.isRoot ? "root" : "scale",
      label: d.isRoot ? "R" : String(d.degree),
    }));
  }, [patternDots]);

  const sequenceMidis = useMemo(() => {
    // Play low→high: primarily by pitch
    const sorted = [...patternDots].sort(
      (a, b) => midiAt(a.string, a.fret) - midiAt(b.string, b.fret),
    );
    return sorted.map((d) => midiAt(d.string, d.fret));
  }, [patternDots]);

  const stop = () => {
    cancelRef.current?.();
    cancelRef.current = null;
    setPlaying(false);
    setActiveIdx(null);
  };

  const playAsc = async (dir: "up" | "down") => {
    if (playing) {
      stop();
      return;
    }
    unlockAudioSync();
    setPlaying(true);
    const midis = dir === "up" ? sequenceMidis : [...sequenceMidis].reverse();
    const cancel = await playSequence(midis, {
      noteSec: 0.26,
      onStep: (i) => {
        if (i < 0) {
          setPlaying(false);
          setActiveIdx(null);
          return;
        }
        setActiveIdx(i);
      },
    });
    cancelRef.current = cancel;
  };

  const shape = getCagedShape(cagedLetter, cagedQuality);
  const rootPcCaged = noteToPc(cagedRoot);
  const placed = placeShape(shape, rootPcCaged);

  const cagedMarks: FretMark[] = useMemo(() => {
    if (!placed) return [];
    return placed.placed.map((p) => ({
      string: p.string,
      fret: p.absFret,
      kind: p.root ? "root" : "chord",
      label: p.root ? "R" : p.finger && p.finger > 0 ? String(p.finger) : "·",
    }));
  }, [placed]);

  const hearChord = () => {
    if (!placed) return;
    unlockAudioSync();
    const midis = placed.placed
      .filter((p) => p.fret >= 0)
      .map((p) => midiAt(p.string, p.absFret))
      .sort((a, b) => a - b);
    const uniq = [...new Set(midis)].slice(0, 5);
    void playSequence(uniq, { noteSec: 0.12, volume: 0.26 });
  };

  const rootStringLabel = STRING_LABELS[pattern.rootString] ?? "E";

  return (
    <div className="tool-page">
      <div>
        <span className="badge badge-wood">Lines · shapes</span>
        <h1 className="tool-title">Scale & CAGED Lab</h1>
        <p className="tool-lede">
          The five CAGED scale patterns — C, A, G, E, D — plus movable chord
          grips. One pattern at a time, intermediate and clear.
        </p>
      </div>

      <div className="chip-row" role="tablist" aria-label="Lab mode">
        <button
          type="button"
          className={tab === "scales" ? "chip active" : "chip"}
          onClick={() => {
            stop();
            setTab("scales");
          }}
        >
          Scale patterns
        </button>
        <button
          type="button"
          className={tab === "caged" ? "chip active" : "chip"}
          onClick={() => {
            stop();
            setTab("caged");
          }}
        >
          CAGED chords
        </button>
      </div>

      {tab === "scales" ? (
        <div className="card">
          <div className="string-line" />
          <div className="card-body tool-stack">
            <section>
              <h3 className="section-label">Scale</h3>
              <div className="chip-row wrap">
                {SCALES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={scaleId === s.id ? "chip active" : "chip"}
                    onClick={() => {
                      stop();
                      setScaleId(s.id);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="section-label">Key</h3>
              <p className="key-label">Major / modal roots</p>
              <div className="key-chips">
                {MAJOR_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={key === k ? "active" : ""}
                    onClick={() => {
                      stop();
                      setKey(k);
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <p className="key-label">Minor</p>
              <div className="key-chips">
                {MINOR_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={key === k ? "active" : ""}
                    onClick={() => {
                      stop();
                      setKey(k);
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="section-label">CAGED pattern</h3>
              <div className="chip-row caged-pattern-row">
                {CAGED_PATTERN_ORDER.map((letter) => {
                  const p = patterns.find((x) => x.letter === letter);
                  const selected = pattern.letter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      className={selected ? "chip active caged-pat" : "chip caged-pat"}
                      disabled={!p}
                      onClick={() => {
                        stop();
                        setPatternLetter(letter);
                      }}
                    >
                      <span className="caged-pat-letter">{letter}</span>
                      <span className="chip-sub">
                        {p ? `frets ${p.fretStart}–${p.fretEnd}` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="hint" style={{ textAlign: "left", margin: "0.5rem 0 0" }}>
                {pattern.label} · root on {rootStringLabel} string (fret{" "}
                {pattern.rootFret})
              </p>
            </section>

            <Fretboard
              frets={Math.max(12, pattern.fretEnd)}
              marks={scaleMarks}
              windowStart={pattern.fretStart}
              windowEnd={pattern.fretEnd}
              footer={
                <p className="fret-legend">
                  <span className="leg root">R</span> root · numbers are scale
                  degrees · five CAGED patterns
                </p>
              }
            />

            <div className="transport">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (playing) stop();
                  else void playAsc("up");
                }}
              >
                {playing ? "Stop" : "Play ascending"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void playAsc("down")}
                disabled={playing}
              >
                Descending
              </button>
            </div>

            <div className="info-block">
              <h4>
                {scale.label} in {key} — {pattern.label}
              </h4>
              <p>{pattern.tip}</p>
              <p style={{ marginTop: "0.5rem" }}>{scale.tip}</p>
              <p style={{ marginTop: "0.5rem" }}>
                Tones:{" "}
                {scale.intervals
                  .map((iv) => pcToName((rootPc + iv) % 12, preferFlat))
                  .join(" · ")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="string-line" />
          <div className="card-body tool-stack">
            <section>
              <h3 className="section-label">Root</h3>
              <div className="key-chips">
                {ROOTS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={cagedRoot === r ? "active" : ""}
                    onClick={() => setCagedRoot(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="section-label">Quality</h3>
              <div className="chip-row">
                <button
                  type="button"
                  className={cagedQuality === "maj" ? "chip active" : "chip"}
                  onClick={() => setCagedQuality("maj")}
                >
                  Major
                </button>
                <button
                  type="button"
                  className={cagedQuality === "min" ? "chip active" : "chip"}
                  onClick={() => setCagedQuality("min")}
                >
                  Minor
                </button>
              </div>
            </section>

            <section>
              <h3 className="section-label">CAGED shape</h3>
              <div className="chip-row">
                {CAGED_LETTERS.map((L) => (
                  <button
                    key={L}
                    type="button"
                    className={cagedLetter === L ? "chip active caged-pat" : "chip caged-pat"}
                    onClick={() => setCagedLetter(L)}
                  >
                    <span className="caged-pat-letter">{L}</span>
                  </button>
                ))}
              </div>
            </section>

            <Fretboard
              frets={15}
              marks={cagedMarks}
              footer={
                <p className="fret-legend">
                  <span className="leg root">R</span> root · numbers = suggested
                  fingers
                </p>
              }
            />

            <div className="transport">
              <button type="button" className="btn btn-primary" onClick={hearChord}>
                Hear shape
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  void playMidiNote(40 + rootPcCaged, { duration: 0.6 });
                }}
              >
                Hear root
              </button>
            </div>

            <div className="info-block">
              <h4>
                {cagedRoot}
                {cagedQuality === "min" ? "m" : ""} — {shape.label}
              </h4>
              <p>{shape.tip}</p>
              {placed ? (
                <p style={{ marginTop: "0.5rem" }}>
                  Root reference fret {placed.rootFret || "open"} · shape frets{" "}
                  {Math.min(...placed.placed.map((p) => p.absFret))}–
                  {Math.max(...placed.placed.map((p) => p.absFret))}
                </p>
              ) : (
                <p style={{ marginTop: "0.5rem" }}>
                  Couldn’t place this shape in frets 0–12 for that root — try
                  another letter.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
