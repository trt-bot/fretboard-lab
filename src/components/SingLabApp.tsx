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
import {
  PitchLineGraph,
  appendPitchSample,
  type PitchSample,
} from "./PitchLineGraph";

export function SingLabApp() {
  const [root, setRoot] = useState<SingRoot>("G");
  const [quality, setQuality] = useState<SingQuality>("maj");
  const [exerciseId, setExerciseId] = useState<ExerciseId>("scaleUp");
  const [step, setStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<PitchFrame | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [graphRev, setGraphRev] = useState(0);
  const monitorRef = useRef<MicPitchMonitor | null>(null);
  const holdOkRef = useRef(0);
  const samplesRef = useRef<PitchSample[]>([]);
  const lastUiRef = useRef(0);
  const [exerciseStartT, setExerciseStartT] = useState<number | null>(null);

  const notes = useMemo(
    () => buildExercise(root, quality, exerciseId),
    [root, quality, exerciseId],
  );
  const target = notes[step] ?? notes[0]!;
  const exercise = EXERCISES.find((e) => e.id === exerciseId)!;
  const chordName = chordLabel(root, quality);

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

  const clearTrail = useCallback(() => {
    samplesRef.current = [];
    setGraphRev((n) => n + 1);
  }, []);

  useEffect(() => {
    resetStep();
    clearTrail();
  }, [root, quality, exerciseId, resetStep, clearTrail]);

  useEffect(() => {
    return () => {
      monitorRef.current?.stop();
      monitorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!listening || !autoAdvance || !inTune) {
      holdOkRef.current = 0;
      return;
    }
    holdOkRef.current += 1;
    if (holdOkRef.current > 28) {
      holdOkRef.current = 0;
      setStep((s) => (s + 1) % notes.length);
    }
  }, [pitch, listening, autoAdvance, inTune, notes.length]);

  const onPitchFrame = useCallback((frame: PitchFrame) => {
    appendPitchSample(samplesRef.current, frame, 12);
    const now = performance.now();
    if (now - lastUiRef.current > 66) {
      lastUiRef.current = now;
      setPitch(frame);
    }
  }, []);

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
    clearTrail();
    try {
      const mon = new MicPitchMonitor();
      monitorRef.current = mon;
      await mon.start(onPitchFrame);
      setExerciseStartT(performance.now());
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
    setExerciseStartT(null);
    setPitch(null);
    holdOkRef.current = 0;
  };

  const statusLabel =
    !listening
      ? "Mic off"
      : targetCents === null
        ? pitch?.frequency
          ? "Listening…"
          : "Sing the highlighted lane"
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
          Sing scales and arpeggios over a guitar chord. Your pitch draws a
          moving line — stay in the target lane like a studio pitch track.
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

          <div className="sing-target-panel">
            <div className="sing-target-main">
              <span className="prompt-kicker">Target lane</span>
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

          <div className="pitch-meter-card">
            <div className="control-row">
              <h3>Pitch track</h3>
              <span
                className={`pitch-status ${
                  inTune ? "ok" : close ? "near" : targetCents !== null ? "off" : ""
                }`}
              >
                {statusLabel}
                {targetCents !== null
                  ? ` · ${targetCents > 0 ? "+" : ""}${Math.round(targetCents)}¢`
                  : ""}
              </span>
            </div>

            <PitchLineGraph
              notes={notes}
              exerciseStartT={exerciseStartT}
              activeStep={step}
              samplesRef={samplesRef}
              listening={listening}
              revision={graphRev}
            />

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

            {micError && <p className="feedback bad">{micError}</p>}

            <div className="sing-graph-actions">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                />
                Auto-advance when held in tune (~½ sec)
              </label>
              <button type="button" className="btn btn-secondary" onClick={clearTrail}>
                Clear trail
              </button>
            </div>
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
              1) Play the <strong>{chordName}</strong> chord for context.
              2) Start the mic — your pitch draws a continuous line across the track.
              3) Hold the line inside the green target lane (within ~15¢). Optional auto-advance steps through the scale or arpeggio.
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              Use headphones so the guitar doesn’t throw the detector. Quiet room
              works best.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
