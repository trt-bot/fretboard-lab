import { useCallback, useMemo, useRef, useState } from "react";
import {
  GENRE_PACKS,
  defaultKeyForGenre,
  type GenreId,
  type Progression,
} from "../lib/music/progressions";
import {
  FUNCTION_BLURB,
  FUNCTION_LABEL,
  MAJOR_KEYS,
  MINOR_KEYS,
  guitarShapeHint,
  resolveProgression,
  type KeyId,
  type ResolvedChord,
} from "../lib/music/theory";
import { playChord, playProgression } from "../lib/chord-audio";
import { unlockAudioSync } from "../lib/woodblock";

const GUITAR_KEYS: KeyId[] = ["G", "A", "D", "C", "E", "Am", "Em", "Dm"];

export function ProgressionExplorer() {
  const [genreId, setGenreId] = useState<GenreId>("bluegrass");
  const genre = GENRE_PACKS.find((g) => g.id === genreId)!;
  const [key, setKey] = useState<KeyId>(() => defaultKeyForGenre(genre));
  const [progId, setProgId] = useState(genre.progressions[0]!.id);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selectedChord, setSelectedChord] = useState<number | null>(null);
  const [bpm, setBpm] = useState(100);
  const [loop, setLoop] = useState(true);
  const [countIn, setCountIn] = useState(true);
  const [capo, setCapo] = useState(0);
  const cancelRef = useRef<(() => void) | null>(null);

  const progression: Progression = useMemo(
    () => genre.progressions.find((p) => p.id === progId) ?? genre.progressions[0]!,
    [genre, progId],
  );

  const chords: ResolvedChord[] = useMemo(
    () => resolveProgression(key, progression.degrees),
    [key, progression.degrees],
  );

  const stopPlayback = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setPlaying(false);
    setActiveStep(null);
  }, []);

  const switchGenre = (id: GenreId) => {
    stopPlayback();
    setSelectedChord(null);
    setGenreId(id);
    const g = GENRE_PACKS.find((x) => x.id === id)!;
    setKey(defaultKeyForGenre(g));
    setProgId(g.progressions[0]!.id);
  };

  const selectProgression = (id: string) => {
    stopPlayback();
    setSelectedChord(null);
    setProgId(id);
  };

  const onKeyChange = (k: KeyId) => {
    stopPlayback();
    setKey(k);
  };

  const hearProgression = async () => {
    if (playing) {
      stopPlayback();
      return;
    }
    unlockAudioSync();
    setPlaying(true);
    setSelectedChord(null);
    const beatSec = 60 / bpm;
    const cancel = await playProgression(chords, {
      beatSec,
      loop,
      countIn,
      onStep: (i) => {
        if (i < 0) {
          setPlaying(false);
          setActiveStep(null);
          return;
        }
        setActiveStep(i);
      },
    });
    cancelRef.current = cancel;
  };

  const hearChord = async (index: number) => {
    stopPlayback();
    setSelectedChord(index);
    setActiveStep(index);
    await playChord(chords[index]!);
    window.setTimeout(() => {
      setActiveStep((cur) => (cur === index ? null : cur));
    }, 900);
  };

  const focusChord =
    selectedChord !== null
      ? chords[selectedChord]
      : activeStep !== null
        ? chords[activeStep]
        : chords[0];

  const shapeHint = focusChord ? guitarShapeHint(focusChord.name) : null;

  // Capo: shapes key is what you finger; sounding is shapes + capo
  // If user fingers `key` with capo N, sounding is up N semitones.
  // Display: "Finger in {key}; sounding ~ {sounding}"
  // And reverse: want sounding key with capo → play shapes in lowered key
  const soundingBlurb = useMemo(() => {
    if (capo === 0) return `No capo — sounding key is ${key}.`;
    // crude sounding label via shifting root name is enough for majors
    return `Capo ${capo}: finger shapes as if in ${key}; pitch sounds ${capo} frets higher.`;
  }, [capo, key]);

  return (
    <div className="tool-page prog-page">
      <div>
        <span className="badge badge-wood">Harmony</span>
        <h1 className="tool-title">Chord Progression Explorer</h1>
        <p className="tool-lede">
          Genre vocabularies, guitar-friendly keys, hear the changes, loop a
          practice tempo — then dig into why it works.
        </p>
      </div>

      <div className="genre-tabs" role="tablist" aria-label="Genre">
        {GENRE_PACKS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={g.id === genreId}
            className={g.id === genreId ? "active" : ""}
            onClick={() => switchGenre(g.id)}
          >
            {g.shortLabel}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ fontSize: "1.35rem" }}>
            {genre.label}
          </h2>
          <p className="card-desc">{genre.description}</p>
        </div>
        <div className="card-body">
          <div className="hallmarks">
            {genre.hallmarks.map((h) => (
              <span key={h} className="badge badge-solid">
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="prog-layout">
        <div className="tool-stack">
          <section className="key-section">
            <h2>Key</h2>
            <div className="chip-row wrap" style={{ marginBottom: "0.75rem" }}>
              {GUITAR_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={key === k ? "chip active" : "chip"}
                  onClick={() => onKeyChange(k)}
                >
                  {k}
                </button>
              ))}
            </div>
            <p className="key-label">All major</p>
            <div className="key-chips">
              {MAJOR_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={key === k ? "active" : ""}
                  onClick={() => onKeyChange(k)}
                >
                  {k}
                </button>
              ))}
            </div>
            <p className="key-label">All minor</p>
            <div className="key-chips">
              {MINOR_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={key === k ? "active" : ""}
                  onClick={() => onKeyChange(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          </section>

          <section className="list-section">
            <h2>Progressions</h2>
            <ul className="prog-list">
              {genre.progressions.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={p.id === progression.id ? "active" : ""}
                    onClick={() => selectProgression(p.id)}
                  >
                    <span className="name">{p.name}</span>
                    <span className="degrees">{p.degrees.join(" – ")}</span>
                    <span className="summary">{p.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="tool-stack">
          <div className="card">
            <div className="string-line" />
            <div className="card-header">
              <div className="chip-row wrap" style={{ marginBottom: "0.5rem" }}>
                <span className="badge badge-outline">{key}</span>
                {progression.tags?.map((t) => (
                  <span key={t} className="badge badge-solid">
                    {t}
                  </span>
                ))}
              </div>
              <h3 className="card-title">{progression.name}</h3>
              <p className="card-desc">{progression.summary}</p>
            </div>
            <div className="card-body tool-stack">
              <div className="chord-strip">
                {chords.map((c, i) => (
                  <button
                    key={`${c.name}-${i}`}
                    type="button"
                    className={`chord-chip ${
                      activeStep === i || selectedChord === i ? "lit" : ""
                    }`}
                    onClick={() => void hearChord(i)}
                  >
                    <span className="deg">{c.degreeLabel}</span>
                    <span className="name">{c.name}</span>
                    <span className="fn">{FUNCTION_LABEL[c.functionHint]}</span>
                  </button>
                ))}
              </div>

              <div className="playback-panel">
                <div className="control-row">
                  <h3>Tempo</h3>
                  <span className="mono-stat">{bpm} BPM</span>
                </div>
                <input
                  className="slider"
                  type="range"
                  min={60}
                  max={160}
                  step={1}
                  value={bpm}
                  onChange={(e) => {
                    stopPlayback();
                    setBpm(Number(e.target.value));
                  }}
                  aria-label="Playback tempo"
                />
                <div className="check-row-group">
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={loop}
                      onChange={(e) => {
                        stopPlayback();
                        setLoop(e.target.checked);
                      }}
                    />
                    Loop
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={countIn}
                      onChange={(e) => {
                        stopPlayback();
                        setCountIn(e.target.checked);
                      }}
                    />
                    Count-in (1 bar)
                  </label>
                </div>
                <div className="control-row">
                  <h3>Capo</h3>
                  <span className="mono-stat">{capo === 0 ? "Off" : `Fret ${capo}`}</span>
                </div>
                <input
                  className="slider"
                  type="range"
                  min={0}
                  max={7}
                  step={1}
                  value={capo}
                  onChange={(e) => setCapo(Number(e.target.value))}
                  aria-label="Capo fret"
                />
                <p className="hint" style={{ textAlign: "left", margin: 0 }}>
                  {soundingBlurb}
                </p>
                <div className="transport">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={() => void hearProgression()}
                  >
                    {playing ? "Stop" : "Play progression"}
                  </button>
                </div>
                <p className="hint">Tap a chord chip to hear it alone</p>
              </div>

              <div className="info-grid">
                <div className="info-block">
                  <h4>Theory</h4>
                  <p>{progression.theory}</p>
                </div>
                <div className="info-block">
                  <h4>On guitar</h4>
                  <p>{progression.guitarTip}</p>
                </div>
              </div>
            </div>
          </div>

          {focusChord && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ fontSize: "1rem" }}>
                  Chord focus
                </h3>
                <p className="card-desc">
                  {focusChord.degreeLabel} in {key} →{" "}
                  <span style={{ color: "var(--wood-bright)" }}>{focusChord.name}</span>
                </p>
              </div>
              <div className="card-body">
                <div className="chip-row wrap" style={{ marginBottom: "0.75rem" }}>
                  <span className="badge badge-wood">
                    {FUNCTION_LABEL[focusChord.functionHint]}
                  </span>
                  <span className="badge badge-outline">{focusChord.quality}</span>
                  {shapeHint && (
                    <span className="badge badge-solid">Shape {shapeHint}</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
                  {FUNCTION_BLURB[focusChord.functionHint]}
                </p>
                {shapeHint && (
                  <div className="shape-diagram" aria-label="Chord shape hint">
                    <span className="shape-tab">{shapeHint}</span>
                    <span className="hint" style={{ margin: 0 }}>
                      Tab left→right is low E→high e (x = mute)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card theory-guide">
        <div className="card-header">
          <h2 className="card-title">{genre.theoryGuide.title}</h2>
        </div>
        <div className="card-body">
          {genre.theoryGuide.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
          <h3 style={{ margin: "0.5rem 0", fontSize: "0.875rem", fontWeight: 500 }}>
            Practice tips
          </h3>
          <ul>
            {genre.theoryGuide.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
