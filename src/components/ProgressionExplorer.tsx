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

export function ProgressionExplorer() {
  const [genreId, setGenreId] = useState<GenreId>("bluegrass");
  const genre = GENRE_PACKS.find((g) => g.id === genreId)!;
  const [key, setKey] = useState<KeyId>(() => defaultKeyForGenre(genre));
  const [progId, setProgId] = useState(genre.progressions[0]!.id);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selectedChord, setSelectedChord] = useState<number | null>(null);
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
    setPlaying(true);
    setSelectedChord(null);
    const cancel = await playProgression(chords, {
      beatSec: 0.75,
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

  return (
    <div className="prog-page">
      <div>
        <span className="badge badge-wood">Practice tool</span>
        <h1
          style={{
            margin: "0.75rem 0 0",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
          }}
        >
          Chord Progression Explorer
        </h1>
        <p style={{ margin: "0.75rem 0 0", color: "var(--muted)", maxWidth: "40rem" }}>
          Browse genre vocabularies, transpose to guitar-friendly keys, hear
          changes, and dig into the theory — including a songwriter toolkit.
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
          <h2 className="card-title" style={{ fontSize: "1.5rem" }}>
            {genre.label}
          </h2>
          <p className="card-desc" style={{ fontSize: "1rem" }}>
            {genre.description}
          </p>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <section className="key-section">
            <h2>Key</h2>
            <p className="key-label">Major</p>
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
            <p className="key-label">Minor</p>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div className="string-line" />
            <div className="card-header">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
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
            <div className="card-body">
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

              <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                <button type="button" className="btn btn-primary" onClick={() => void hearProgression()}>
                  {playing ? "Stop" : "Play progression"}
                </button>
                <span style={{ fontSize: "0.75rem", color: "var(--subtle)" }}>
                  Tap a chord to hear it alone
                </span>
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                  <span className="badge badge-wood">
                    {FUNCTION_LABEL[focusChord.functionHint]}
                  </span>
                  <span className="badge badge-outline">{focusChord.quality}</span>
                  {guitarShapeHint(focusChord.name) && (
                    <span className="badge badge-solid">
                      Shape {guitarShapeHint(focusChord.name)}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
                  {FUNCTION_BLURB[focusChord.functionHint]}
                </p>
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
