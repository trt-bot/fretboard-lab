import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playGuitarChordHQ, playReferenceTone } from "../lib/guitar-hq";
import {
  MicPitchMonitor,
  centsOff,
  type PitchFrame,
} from "../lib/pitch-detect";
import {
  EXERCISES,
  SING_ROOTS,
  buildExercise,
  chordLabel,
  type ExerciseId,
  type SingQuality,
  type SingRoot,
} from "../lib/sing/exercises";
import { unlockAudioSync } from "../lib/woodblock";

const CENTS_RANGE = 50; // display ±50 cents

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function SingLabApp() {
  const [root, setRoot] = useState<SingRoot>("G");
  const [quality, setQuality] = useState<SingQuality>("maj");
  const [exerciseId, setExerciseId] = useState<ExerciseId>("scaleUp");
  const [step, setStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<PitchFrame | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const monitorRef = useRef<MicPitchMonitor | null>(null);
  const holdOkRef = useRef(0);

  const notes = useMemo(
    () => buildExercise(root, quality, exerciseId),
    [root, quality, exerciseId],
  );
  const target = notes[step] ?? notes[0]!;
  const exercise = EXERCISES.find((e) => e.id === exerciseId)!;
  const chordName = chordLabel(root, quality);

  // cents vs target note
  const targetCents = useMemo(() => {
    if (!pitch?.frequency || !target) return null;
    if ((pitch.clarity ?? 0) < 0.55) return null;
    return centsOff(pitch.frequency, target.freq);
  }, [pitch, target]);

  const inTune = targetCents !== null && Math.abs(targetCents) <= 15;
  const close = targetCents !== null && Math.abs(targetCents) <= 30;

  const resetStep = useCallback(() => {
    setStep(0);
    holdOkRef.current = 0;
  }, []);

  useEffect(() => {
    resetStep();
  }, [root, quality, exerciseId, resetStep]);

  useEffect(() => {
    return () => {
      monitorRef.current?.stop();
      monitorRef.current = null;
    };
  }, []);

  // Auto-advance when held in tune
  useEffect(() => {
    if (!listening || !autoAdvance || !inTune) {
      holdOkRef.current = 0;
      return;
    }
    holdOkRef.current += 1;
    // ~20 frames ≈ 1/3s at 60fps; require sustained
    if (holdOkRef.current > 28) {
      holdOkRef.current = 0;
      setStep((s) => (s + 1) % notes.length);
    }
  }, [pitch, listening, autoAdvance, inTune, notes.length]);

  const playChord = async () => {
    unlockAudioSync();
    await playGuitarChordHQ(root, quality, { duration: 2.6, volume: 0.24 });
  };

  const playTarget = async () => {
    unlockAudioSync();
    await playReferenceTone(target.midi, { duration: 1.0, volume: 0.2 });
  };

  const playChordAndTone = async () => {
    unlockAudioSync();
    await playGuitarChordHQ(root, quality, { duration: 2.8, volume: 0.22 });
    window.setTimeout(() => {
      void playReferenceTone(target.midi, { duration: 0.95, volume: 0.18 });
    }, 350);
  };

  const startMic = async () => {
    setMicError(null);
    unlockAudioSync();
    try {
      const mon = new MicPitchMonitor();
      monitorRef.current = mon;
      await mon.start((frame) => setPitch(frame));
      setListening(true);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Microphone permission denied";
      setMicError(
        msg.includes("Permission") || msg.includes("NotAllowed")
          ? "Microphone blocked — allow mic access and try again."
          : "Could not open the microphone. Check browser permissions.",
      );
      setListening(false);
    }
  };

  const stopMic = () => {
    monitorRef.current?.stop();
    monitorRef.current = null;
    setListening(false);
    setPitch(null);
    holdOkRef.current = 0;
  };

  const needlePct = useMemo(() => {
    if (targetCents === null) return 50;
    return clamp(50 + (targetCents / CENTS_RANGE) * 50, 4, 96);
  }, [targetCents]);

  const statusLabel =
    !listening
      ? "Mic off"
      : targetCents === null
        ? pitch?.frequency
          ? "Listening…"
          : "Sing the target note"
        : inTune
          ? "In tune"
          : close
            ? "Close"
            : targetCents > 0
              ? "Sharp"
              : "Flat";

  return (
    <div className="tool-page">
      <div>
        <span className="badge badge-wood">Voice · ear</span>
        <h1 className="tool-title">Sing Lab</h1>
        <p className="tool-lede">
          Sing scales and arpeggios over a real guitar chord. Watch the pitch
          meter and lock each target note before moving on.
        </p>
      </div>

      <div className="card">
        <div className="string-line" />
        <div className="card-body tool-stack">
          <section>
            <h3 className="section-label">Chord context</h3>
            <div className="chip-row wrap">
              {SING_ROOTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={root === r ? "chip active" : "chip"}
                  onClick={() => setRoot(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="chip-row" style={{ marginTop: "0.55rem" }}>
              <button
                type="button"
                className={quality === "maj" ? "chip active" : "chip"}
                onClick={() => setQuality("maj")}
              >
                Major
              </button>
              <button
                type="button"
                className={quality === "min" ? "chip active" : "chip"}
                onClick={() => setQuality("min")}
              >
                Minor
              </button>
              <span className="badge badge-wood" style={{ marginLeft: "0.25rem" }}>
                {chordName}
              </span>
            </div>
          </section>

          <section>
            <h3 className="section-label">Exercise</h3>
            <div className="chip-row wrap">
              {EXERCISES.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  className={exerciseId === ex.id ? "chip active" : "chip"}
                  onClick={() => setExerciseId(ex.id)}
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <p className="hint" style={{ textAlign: "left", margin: "0.55rem 0 0" }}>
              {exercise.tip}
            </p>
          </section>

          {/* Target + sequence */}
          <div className="sing-target-panel">
            <div className="sing-target-main">
              <span className="prompt-kicker">Sing this</span>
              <div className="sing-target-note">
                <span className="sing-deg">{target.degree}</span>
                <span className="sing-name">{target.label}</span>
              </div>
              <span className="sing-hz">
                {Math.round(target.freq)} Hz · step {step + 1}/{notes.length}
              </span>
            </div>
            <div className="sing-seq" role="list" aria-label="Exercise notes">
              {notes.map((n, i) => (
                <button
                  key={`${n.midi}-${i}`}
                  type="button"
                  role="listitem"
                  className={`sing-seq-chip ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
                  onClick={() => {
                    setStep(i);
                    holdOkRef.current = 0;
                  }}
                >
                  <span className="deg">{n.degree}</span>
                  <span className="nm">{n.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pitch meter */}
          <div className="pitch-meter-card">
            <div className="control-row">
              <h3>Pitch meter</h3>
              <span
                className={`pitch-status ${
                  inTune ? "ok" : close ? "near" : targetCents !== null ? "off" : ""
                }`}
              >
                {statusLabel}
                {targetCents !== null ? ` · ${targetCents > 0 ? "+" : ""}${Math.round(targetCents)}¢` : ""}
              </span>
            </div>

            <div className="pitch-meter" aria-live="polite">
              <div className="pitch-scale">
                <span>−50¢</span>
                <span>in tune</span>
                <span>+50¢</span>
              </div>
              <div className="pitch-track">
                <div className="pitch-zone near" />
                <div className="pitch-zone ok" />
                <div
                  className={`pitch-needle ${targetCents === null ? "idle" : inTune ? "ok" : close ? "near" : "off"}`}
                  style={{ left: `${needlePct}%` }}
                />
                <div className="pitch-center" />
              </div>
              <div className="pitch-readout">
                <div>
                  <span className="pitch-k">You</span>
                  <strong>
                    {pitch?.noteName && pitch.frequency
                      ? `${pitch.noteName} · ${Math.round(pitch.frequency)} Hz`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span className="pitch-k">Target</span>
                  <strong>
                    {target.label} · {Math.round(target.freq)} Hz
                  </strong>
                </div>
              </div>
            </div>

            {micError && <p className="feedback bad">{micError}</p>}

            <label className="check-row" style={{ marginTop: "0.35rem" }}>
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
              />
              Auto-advance when held in tune (~½ sec)
            </label>
          </div>

          <div className="transport sing-transport">
            <button type="button" className="btn btn-secondary" onClick={() => void playChord()}>
              Play chord
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void playTarget()}>
              Hear target
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void playChordAndTone()}
            >
              Chord + tone
            </button>
            {!listening ? (
              <button type="button" className="btn btn-primary btn-lg" onClick={() => void startMic()}>
                Start mic
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" onClick={stopMic}>
                Stop mic
              </button>
            )}
          </div>

          <div className="transport">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep((s) => Math.min(notes.length - 1, s + 1))}
              disabled={step >= notes.length - 1}
            >
              Next
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetStep}>
              Restart
            </button>
          </div>

          <div className="info-block">
            <h4>How to practice</h4>
            <p>
              1) Play the <strong>{chordName}</strong> guitar chord for context.
              2) Start the mic and sing the highlighted degree.
              3) Center the needle (green = within ~15 cents). Optional auto-advance moves you through the exercise.
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              Works best in a quiet room with headphones so the chord doesn’t
              confuse the pitch detector. Allow microphone access when prompted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
