import { useCallback, useMemo, useState } from "react";
import {
  FRET_MAX,
  NATURAL_PCS,
  pcAt,
  STRING_COUNT,
  STRING_LABELS,
} from "../lib/music/fretboard";
import { NOTE_NAMES_SHARP, pcToName } from "../lib/music/theory";
import { playFretNote } from "../lib/chord-audio";
import { unlockAudioSync } from "../lib/woodblock";
import type { FretMark } from "./Fretboard";
import { AcousticFretboard } from "./AcousticFretboard";

type Mode = "find" | "name";

type Prompt =
  | { mode: "find"; string: number; pc: number; label: string }
  | { mode: "name"; string: number; fret: number; pc: number; label: string };

function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makePrompt(mode: Mode, naturalsOnly: boolean): Prompt {
  const pool = naturalsOnly
    ? NATURAL_PCS
    : ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const);
  const pc = randomOf(pool);
  const label = pcToName(pc, false);
  const string = Math.floor(Math.random() * STRING_COUNT);

  if (mode === "find") {
    return { mode: "find", string, pc, label };
  }
  // name: pick a fret on that string with that pc, or any fret
  const candidates: number[] = [];
  for (let f = 0; f <= FRET_MAX; f++) {
    if (pcAt(string, f) === pc) candidates.push(f);
  }
  const fret =
    candidates.length > 0
      ? randomOf(candidates)
      : Math.floor(Math.random() * (FRET_MAX + 1));
  const actualPc = pcAt(string, fret);
  return {
    mode: "name",
    string,
    fret,
    pc: actualPc,
    label: pcToName(actualPc, false),
  };
}

export function NoteLabApp() {
  const [mode, setMode] = useState<Mode>("find");
  const [naturalsOnly, setNaturalsOnly] = useState(true);
  const [prompt, setPrompt] = useState<Prompt>(() => makePrompt("find", true));
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [flash, setFlash] = useState<FretMark | null>(null);
  const [correct, setCorrect] = useState(0);
  const [tries, setTries] = useState(0);
  const [nameChoice, setNameChoice] = useState<string | null>(null);

  const next = useCallback(
    (m = mode, nat = naturalsOnly) => {
      setFeedback(null);
      setFlash(null);
      setNameChoice(null);
      setPrompt(makePrompt(m, nat));
    },
    [mode, naturalsOnly],
  );

  const switchMode = (m: Mode) => {
    setMode(m);
    next(m, naturalsOnly);
  };

  const marks: FretMark[] = useMemo(() => {
    const list: FretMark[] = [];
    if (prompt.mode === "name") {
      list.push({
        string: prompt.string,
        fret: prompt.fret,
        kind: "target",
        label: "?",
      });
    }
    if (flash) list.push(flash);
    return list;
  }, [prompt, flash]);

  const onCell = async (string: number, fret: number) => {
    if (prompt.mode !== "find") return;
    unlockAudioSync();
    void playFretNote(string, fret);
    setTries((t) => t + 1);
    const ok = string === prompt.string && pcAt(string, fret) === prompt.pc;
    if (ok) {
      setCorrect((c) => c + 1);
      setFeedback("correct");
      setFlash({ string, fret, kind: "correct", label: prompt.label });
      window.setTimeout(() => next(), 550);
    } else {
      setFeedback("wrong");
      setFlash({ string, fret, kind: "wrong" });
      window.setTimeout(() => setFlash(null), 400);
    }
  };

  const onName = (name: string) => {
    if (prompt.mode !== "name") return;
    unlockAudioSync();
    void playFretNote(prompt.string, prompt.fret);
    setNameChoice(name);
    setTries((t) => t + 1);
    const sharp = pcToName(prompt.pc, false);
    const flat = pcToName(prompt.pc, true);
    const ok = name === sharp || name === flat || name === prompt.label;
    if (ok) {
      setCorrect((c) => c + 1);
      setFeedback("correct");
      setFlash({
        string: prompt.string,
        fret: prompt.fret,
        kind: "correct",
        label: prompt.label,
      });
      window.setTimeout(() => next(), 550);
    } else {
      setFeedback("wrong");
    }
  };

  const nameOptions = useMemo(() => {
    if (naturalsOnly) return ["C", "D", "E", "F", "G", "A", "B"];
    return [...NOTE_NAMES_SHARP];
  }, [naturalsOnly]);

  return (
    <div className="tool-page">
      <div>
        <span className="badge badge-wood">Fretboard</span>
        <h1 className="tool-title">Note Lab</h1>
        <p className="tool-lede">
          Drill note locations on the neck. Intermediate warm-up — frets 0–12,
          standard tuning.
        </p>
      </div>

      <div className="card">
        <div className="string-line" />
        <div className="card-body tool-stack">
          <div className="chip-row" role="tablist" aria-label="Drill mode">
            <button
              type="button"
              className={mode === "find" ? "chip active" : "chip"}
              onClick={() => switchMode("find")}
            >
              Find the note
            </button>
            <button
              type="button"
              className={mode === "name" ? "chip active" : "chip"}
              onClick={() => switchMode("name")}
            >
              Name the note
            </button>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={naturalsOnly}
              onChange={(e) => {
                setNaturalsOnly(e.target.checked);
                next(mode, e.target.checked);
              }}
            />
            Natural notes only (no sharps/flats)
          </label>

          <div className="prompt-panel" aria-live="polite">
            {prompt.mode === "find" ? (
              <>
                <span className="prompt-kicker">Tap on the neck</span>
                <p className="prompt-main">
                  Find <strong>{prompt.label}</strong> on the{" "}
                  <strong>{STRING_LABELS[prompt.string]}</strong> string
                </p>
              </>
            ) : (
              <>
                <span className="prompt-kicker">Name the highlighted note</span>
                <p className="prompt-main">
                  {STRING_LABELS[prompt.string]} string · fret {prompt.fret}
                </p>
              </>
            )}
            {feedback === "correct" && (
              <p className="feedback ok">Correct</p>
            )}
            {feedback === "wrong" && (
              <p className="feedback bad">Try again</p>
            )}
          </div>

          <AcousticFretboard
            marks={marks}
            interactive={prompt.mode === "find"}
            onCellClick={(s, f) => void onCell(s, f)}
          />

          {prompt.mode === "name" && (
            <div className="name-grid">
              {nameOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip ${nameChoice === n ? (feedback === "correct" ? "ok" : feedback === "wrong" ? "bad" : "active") : ""}`}
                  onClick={() => onName(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          <div className="score-row">
            <span>
              Score <strong>{correct}</strong> / {tries}
            </span>
            <div className="transport">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCorrect(0);
                  setTries(0);
                  next();
                }}
              >
                Reset
              </button>
              <button type="button" className="btn btn-primary" onClick={() => next()}>
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
