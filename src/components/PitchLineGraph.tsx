import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { SingNote } from "../lib/sing/exercises";
import type { PitchFrame } from "../lib/pitch-detect";
import { midiToFreq } from "../lib/pitch-detect";

export type PitchSample = {
  t: number;
  midi: number | null;
  clarity: number;
};

type Props = {
  notes: SingNote[];
  step: number;
  /** Rolling buffer — parent mutates via appendPitchSample */
  samplesRef: MutableRefObject<PitchSample[]>;
  listening: boolean;
  windowSec?: number;
  className?: string;
  /** bump to force redraw when step/notes change (optional) */
  revision?: number;
};

function midiToY(midi: number, midiMin: number, midiMax: number, h: number, pad: number) {
  const t = (midi - midiMin) / Math.max(0.001, midiMax - midiMin);
  return pad + (1 - t) * (h - pad * 2);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function PitchLineGraph({
  notes,
  step,
  samplesRef,
  listening,
  windowSec = 8,
  className = "",
  revision = 0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(step);
  const listeningRef = useRef(listening);
  const notesRef = useRef(notes);
  stepRef.current = step;
  listeningRef.current = listening;
  notesRef.current = notes;

  const range = useMemo(() => {
    const midis = notes.map((n) => n.midi);
    const lo = Math.min(...midis);
    const hi = Math.max(...midis);
    return { midiMin: lo - 3, midiMax: hi + 3 };
  }, [notes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    let raf = 0;
    let alive = true;

    const draw = () => {
      if (!alive) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = wrap.clientWidth || 640;
      const cssH = wrap.clientHeight || 240;
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        raf = requestAnimationFrame(draw);
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = cssW;
      const h = cssH;
      const padL = 44;
      const padR = 12;
      const padY = 16;
      const plotW = w - padL - padR;
      const { midiMin, midiMax } = range;
      const now = performance.now();
      const t0 = now - windowSec * 1000;
      const notesNow = notesRef.current;
      const stepNow = stepRef.current;
      const listeningNow = listeningRef.current;
      const samples = samplesRef.current;

      // lanes
      const seen = new Set<number>();
      const lanes: Array<{ midi: number; label: string }> = [];
      for (const n of notesNow) {
        if (seen.has(n.midi)) continue;
        seen.add(n.midi);
        lanes.push({ midi: n.midi, label: n.label });
      }
      lanes.sort((a, b) => b.midi - a.midi);

      ctx.fillStyle = "#14110f";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      roundRect(ctx, padL, padY - 4, plotW, h - padY * 2 + 8, 10);
      ctx.fill();

      const targetMidi = notesNow[stepNow]?.midi;

      for (const lane of lanes) {
        const y = midiToY(lane.midi, midiMin, midiMax, h, padY);
        const isTarget = lane.midi === targetMidi;
        const yHi = midiToY(lane.midi + 0.22, midiMin, midiMax, h, padY);
        const yLo = midiToY(lane.midi - 0.22, midiMin, midiMax, h, padY);
        ctx.fillStyle = isTarget
          ? "rgba(110, 231, 168, 0.16)"
          : "rgba(196, 165, 116, 0.05)";
        ctx.fillRect(padL, yHi, plotW, Math.max(2, yLo - yHi));

        ctx.strokeStyle = isTarget
          ? "rgba(110, 231, 168, 0.6)"
          : "rgba(120, 113, 108, 0.32)";
        ctx.lineWidth = isTarget ? 1.6 : 1;
        ctx.setLineDash(isTarget ? [] : [4, 5]);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isTarget ? "#e0c59a" : "#78716c";
        ctx.font = `600 11px "DM Sans", system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(lane.label, padL - 8, y);
      }

      // time grid (scrolls with time)
      const secOffset = (now / 1000) % 1;
      ctx.strokeStyle = "rgba(46, 41, 38, 0.85)";
      ctx.lineWidth = 1;
      for (let s = -1; s <= windowSec + 1; s++) {
        const x = padL + ((s - secOffset) / windowSec) * plotW;
        if (x < padL || x > padL + plotW) continue;
        ctx.beginPath();
        ctx.moveTo(x, padY);
        ctx.lineTo(x, h - padY);
        ctx.stroke();
      }

      // now line (right edge)
      const nowX = padL + plotW - 1;
      ctx.strokeStyle = "rgba(224, 197, 154, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(nowX, padY);
      ctx.lineTo(nowX, h - padY);
      ctx.stroke();

      const pts = samples.filter(
        (s) => s.t >= t0 && s.midi != null && s.clarity >= 0.5,
      );

      if (pts.length >= 2) {
        ctx.lineWidth = 2.6;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = "#e0c59a";
        ctx.shadowColor = "rgba(196, 165, 116, 0.5)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < pts.length; i++) {
          const s = pts[i]!;
          const x = padL + ((s.t - t0) / (windowSec * 1000)) * plotW;
          const y = midiToY(s.midi!, midiMin, midiMax, h, padY);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
            continue;
          }
          const prev = pts[i - 1]!;
          const jump = Math.abs(s.midi! - (prev.midi ?? s.midi!));
          if (jump > 4) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        const last = pts[pts.length - 1]!;
        if (last.midi != null) {
          const lx = padL + ((last.t - t0) / (windowSec * 1000)) * plotW;
          const ly = midiToY(last.midi, midiMin, midiMax, h, padY);
          let fill = "#e0c59a";
          if (targetMidi != null) {
            const cents =
              1200 * Math.log2(midiToFreq(last.midi) / midiToFreq(targetMidi));
            if (Math.abs(cents) <= 15) fill = "#6ee7a8";
            else if (Math.abs(cents) <= 30) fill = "#e0c59a";
            else fill = "#f0a090";
          }
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(Math.min(lx, nowX), ly, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(12, 10, 9, 0.55)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = "#78716c";
        ctx.font = `500 13px "DM Sans", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          listeningNow
            ? "Sing — hold the line in the green target lane"
            : "Start mic — pitch draws a scrolling line (Singer Studio style)",
          padL + plotW / 2,
          h / 2,
        );
      }

      ctx.strokeStyle = "rgba(68, 64, 60, 0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, padL, padY - 4, plotW, h - padY * 2 + 8, 10);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [range, windowSec, samplesRef, revision]);

  return (
    <div ref={wrapRef} className={`pitch-graph-wrap ${className}`}>
      <canvas
        ref={canvasRef}
        className="pitch-graph-canvas"
        aria-label="Live scrolling pitch line graph"
      />
    </div>
  );
}

export function appendPitchSample(
  prev: PitchSample[],
  frame: PitchFrame,
  maxSec = 12,
): PitchSample[] {
  const t = performance.now();
  const midi =
    frame.frequency && frame.clarity >= 0.5 && frame.midi != null
      ? frame.midi
      : null;
  prev.push({ t, midi, clarity: frame.clarity });
  const cutoff = t - maxSec * 1000;
  // mutate in place for perf
  let i = 0;
  while (i < prev.length && prev[i]!.t < cutoff) i++;
  if (i > 0) prev.splice(0, i);
  // hard cap
  if (prev.length > 720) prev.splice(0, prev.length - 720);
  return prev;
}
