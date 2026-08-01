import { useCallback, useEffect, useRef, useState } from "react";
import {
  ensureAudioReady,
  getAudioState,
  playWoodblock,
  unlockAudioSync,
} from "../lib/woodblock";
import { keepAwake, releaseAwake } from "../lib/wake-lock";

const BPM_MIN = 40;
const BPM_MAX = 240;
const BPM_DEFAULT = 100;

const TIMER_PRESETS = [
  { label: "Off", seconds: 0 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
] as const;

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function MetronomeApp() {
  const [bpm, setBpm] = useState(BPM_DEFAULT);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [timerPreset, setTimerPreset] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [audioHint, setAudioHint] = useState<string | null>(null);
  const beatsPerBar = 4;

  const bpmRef = useRef(bpm);
  const volumeRef = useRef(volume);
  const playingRef = useRef(playing);
  const nextNoteTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const timerEndRef = useRef<number | null>(null);
  const timerIdRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);


  const schedulerTick = useCallback(async () => {
    const ctx = await ensureAudioReady();
    if (ctx.state === "suspended") {
      playingRef.current = false;
      setPlaying(false);
      setAudioHint(
        "Sound is blocked. Unmute your phone (ring switch), then tap Play again.",
      );
      return;
    }

    const scheduleAhead = 0.15;

    while (
      playingRef.current &&
      nextNoteTimeRef.current < ctx.currentTime + scheduleAhead
    ) {
      if (timerEndRef.current !== null && performance.now() >= timerEndRef.current) {
        playingRef.current = false;
        setPlaying(false);
        setRemaining(0);
        timerEndRef.current = null;
        releaseAwake();
        break;
      }

      const accent = beatIndexRef.current % beatsPerBar === 0;
      playWoodblock({ volume: volumeRef.current, accent }, nextNoteTimeRef.current);

      const beatNum = beatIndexRef.current % beatsPerBar;
      const scheduledAt = nextNoteTimeRef.current;
      const delayMs = Math.max(0, (scheduledAt - ctx.currentTime) * 1000);

      window.setTimeout(() => {
        if (!playingRef.current) return;
        setBeat(beatNum);
      }, delayMs);

      beatIndexRef.current += 1;
      nextNoteTimeRef.current += 60 / bpmRef.current;
    }

    if (playingRef.current) {
      timerIdRef.current = window.setTimeout(() => {
        void schedulerTick();
      }, 25);
    }
  }, [beatsPerBar]);

  const stop = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    releaseAwake();
    if (timerIdRef.current) {
      window.clearTimeout(timerIdRef.current);
      timerIdRef.current = 0;
    }
  }, []);

  const start = useCallback(async () => {
    // Critical for iOS: audio + screen-awake both need the user-gesture stack
    unlockAudioSync();
    void keepAwake(); // do not await first — start video/lock ASAP in gesture
    const ctx = await ensureAudioReady();
    // Re-assert wake after async gap (iOS can drop locks across awaits)
    void keepAwake();

    if (ctx.state === "suspended") {
      setAudioHint(
        "Couldn't enable audio. Unmute your iPhone (side ring switch), then tap Play again.",
      );
      return;
    }

    setAudioHint(null);

    // Audible warm-up click so user immediately hears sound on first play
    playWoodblock(
      { volume: Math.max(0.35, volumeRef.current), accent: true },
      ctx.currentTime,
    );

    beatIndexRef.current = 0;
    setBeat(0);
    nextNoteTimeRef.current = ctx.currentTime + 60 / bpmRef.current;

    if (timerPreset > 0) {
      timerEndRef.current = performance.now() + timerPreset * 1000;
      setRemaining(timerPreset);
    } else {
      timerEndRef.current = null;
      setRemaining(0);
    }

    playingRef.current = true;
    setPlaying(true);
    void schedulerTick();
  }, [schedulerTick, timerPreset]);

  const toggle = useCallback(() => {
    if (playing) {
      stop();
      return;
    }
    unlockAudioSync();
    void start();
  }, [playing, start, stop]);

  useEffect(() => {
    if (!playing || timerPreset <= 0) return;
    const id = window.setInterval(() => {
      if (timerEndRef.current === null) return;
      const left = Math.max(0, (timerEndRef.current - performance.now()) / 1000);
      setRemaining(left);
      if (left <= 0) stop();
    }, 200);
    return () => window.clearInterval(id);
  }, [playing, timerPreset, stop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (playingRef.current) stop();
      else {
        unlockAudioSync();
        void start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, stop]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      releaseAwake();
      if (timerIdRef.current) window.clearTimeout(timerIdRef.current);
    };
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && getAudioState() === "running") {
        setAudioHint(null);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const selectTimer = (seconds: number) => {
    setTimerPreset(seconds);
    if (!playing) setRemaining(seconds);
    else if (seconds > 0) {
      timerEndRef.current = performance.now() + seconds * 1000;
      setRemaining(seconds);
    } else {
      timerEndRef.current = null;
      setRemaining(0);
    }
  };

  const reset = () => {
    stop();
    setBpm(BPM_DEFAULT);
    setBeat(0);
    setTimerPreset(0);
    setRemaining(0);
    setVolume(0.9);
    setAudioHint(null);
  };

  return (
    <div className="metro">
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
          Woodblock Metronome
        </h1>
        <p style={{ margin: "0.75rem 0 0", color: "var(--muted)", maxWidth: "28rem" }}>
          Clean clicks with a natural woodblock tone. Set tempo, pick a practice
          timer, and press play — or hit space.
        </p>
      </div>

      {audioHint && (
        <div
          role="status"
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md, 10px)",
            border: "1px solid color-mix(in oklab, var(--wood, #b07a3a) 40%, transparent)",
            background: "color-mix(in oklab, var(--wood, #b07a3a) 12%, transparent)",
            fontSize: "0.9rem",
          }}
        >
          {audioHint}
        </div>
      )}

      <div className="card">
        <div className="string-line" />
        <div className="card-header" style={{ textAlign: "center", paddingTop: "2rem" }}>
          <div className="metro-display">
            <div className={`metro-circle ${playing ? "playing" : ""}`}>
              <span className="metro-bpm">{bpm}</span>
              <span className="metro-label">BPM</span>
            </div>
          </div>
          <div className="beat-dots" aria-label="Beats in bar">
            {Array.from({ length: beatsPerBar }, (_, i) => (
              <span
                key={i}
                className={`beat-dot ${playing && beat === i ? "on" : ""} ${
                  playing && beat === i && i === 0 ? "accent" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <section>
            <div className="control-row">
              <h3>Tempo</h3>
              <div className="nudge">
                <button type="button" onClick={() => setBpm((b) => Math.max(BPM_MIN, b - 1))}>
                  −1
                </button>
                <button type="button" onClick={() => setBpm((b) => Math.min(BPM_MAX, b + 1))}>
                  +1
                </button>
              </div>
            </div>
            <input
              className="slider"
              type="range"
              min={BPM_MIN}
              max={BPM_MAX}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              aria-label="Tempo in BPM"
            />
            <div className="preset-row">
              <span>{BPM_MIN}</span>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {[60, 80, 100, 120, 140].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={bpm === p ? "active" : ""}
                    onClick={() => setBpm(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <span>{BPM_MAX}</span>
            </div>
          </section>

          <section>
            <div className="control-row">
              <h3>Practice timer</h3>
              {timerPreset > 0 && (
                <span
                  className={`timer-remain ${
                    playing && remaining <= 10 && remaining > 0 ? "warn" : ""
                  }`}
                >
                  {formatTime(playing ? remaining : timerPreset)}
                </span>
              )}
            </div>
            <div className="timer-grid">
              {TIMER_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={timerPreset === p.seconds ? "active" : ""}
                  onClick={() => selectTimer(p.seconds)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="hint" style={{ textAlign: "left" }}>
              Timer stops the metronome automatically when time runs out.
            </p>
          </section>

          <section>
            <div className="control-row">
              <h3>Volume</h3>
            </div>
            <input
              className="slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </section>

          <div className="transport">
            <button type="button" className="btn btn-secondary btn-icon" onClick={reset} aria-label="Reset">
              ↺
            </button>
            <button type="button" className="btn btn-primary btn-lg" onClick={toggle}>
              {playing ? "Stop" : "Play"}
            </button>
          </div>
          <p className="hint">
            {playing
              ? "Screen locked on · keep this tab open while you practice"
              : "Tap Play to enable sound · keeps screen awake on iPhone"}
          </p>
        </div>
      </div>
    </div>
  );
}
