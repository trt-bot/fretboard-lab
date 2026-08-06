import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { SingNote } from "../lib/sing/exercises";
import type { PitchFrame } from "../lib/pitch-detect";

export type PitchSample = {
  t: number;
  midi: number | null;
  clarity: number;
};

type Props = {
  notes: SingNote[];
  /** Absolute performance.now() when the exercise started, or null if not playing */
  exerciseStartT: number | null;
  /** Seconds allocated per note (default 1.2) */
  noteDurationSec?: number;
  /** Rolling buffer — parent mutates via appendPitchSample */
  samplesRef: MutableRefObject<PitchSample[]>;
  listening: boolean;
  className?: string;
  /** bump to force redraw when notes change */
  revision?: number;
  /** which step is currently active (for highlight) */
  activeStep?: number;
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
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Soft blue capsule like Singer Studio target blobs */
function drawCapsule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  active: boolean,
) {
  const r = h / 2;
  // outer glow
  ctx.save();
  ctx.shadowColor = active ? "rgba(59, 130, 246, 0.75)" : "rgba(59, 130, 246, 0.45)";
  ctx.shadowBlur = active ? 18 : 12;
  ctx.fillStyle = active ? "#3b82f6" : "#60a5fa";
  roundRect(ctx, x, y - h / 2, w, h, r);
  ctx.fill();
  ctx.restore();

  // inner highlight (lighter blue)
  ctx.fillStyle = active ? "rgba(147, 197, 253, 0.55)" : "rgba(147, 197, 253, 0.35)";
  roundRect(ctx, x + 2, y - h / 2 + 2, w - 4, h * 0.38, r * 0.6);
  ctx.fill();

  // thin white outline
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.4;
  roundRect(ctx, x, y - h / 2, w, h, r);
  ctx.stroke();

  // small white squiggle inside (ideal sustained tone / vibrato hint)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  const midY = y;
  const startX = x + w * 0.18;
  const endX = x + w * 0.82;
  const amp = h * 0.12;
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = startX + (endX - startX) * t;
    const py = midY + Math.sin(t * Math.PI * 2.2) * amp * (i === 0 || i === steps ? 0 : 1);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

export function PitchLineGraph({
  notes,
  exerciseStartT,
  noteDurationSec = 1.2,
  samplesRef,
  listening,
  className = "",
  revision = 0,
  activeStep = -1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef(notes);
  const startRef = useRef(exerciseStartT);
  const activeRef = useRef(activeStep);
  notesRef.current = notes;
  startRef.current = exerciseStartT;
  activeRef.current = activeStep;

  const range = useMemo(() => {
    if (!notes.length) return { midiMin: 55, midiMax: 75 };
    const midis = notes.map((n) => n.midi);
    const lo = Math.min(...midis);
    const hi = Math.max(...midis);
    return { midiMin: lo - 2.5, midiMax: hi + 2.5 };
  }, [notes]);

  const totalSec = Math.max(1, notes.length * noteDurationSec);

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
      const cssH = wrap.clientHeight || 260;
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
      const padL = 48;
      const padR = 16;
      const padY = 18;
      const plotW = w - padL - padR;
      const { midiMin, midiMax } = range;
      const notesNow = notesRef.current;
      const startT = startRef.current;
      const stepNow = activeRef.current;
      const samples = samplesRef.current;
      const now = performance.now();

      // light studio background (matches reference image)
      ctx.fillStyle = "#faf9f7";
      ctx.fillRect(0, 0, w, h);

      // subtle plot panel
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      roundRect(ctx, padL - 4, padY - 6, plotW + 8, h - padY * 2 + 12, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // lanes + labels
      const seen = new Set<number>();
      const lanes: Array<{ midi: number; label: string }> = [];
      for (const n of notesNow) {
        if (seen.has(n.midi)) continue;
        seen.add(n.midi);
        lanes.push({ midi: n.midi, label: n.label });
      }
      lanes.sort((a, b) => b.midi - a.midi);

      for (const lane of lanes) {
        const y = midiToY(lane.midi, midiMin, midiMax, h, padY);
        ctx.strokeStyle = "rgba(0,0,0,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();

        ctx.fillStyle = "#57534e";
        ctx.font = `600 11px "DM Sans", system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(lane.label, padL - 10, y);
      }

      // vertical measure lines (every 4 notes)
      const nNotes = Math.max(1, notesNow.length);
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= nNotes; i++) {
        if (i % 4 !== 0 && i !== nNotes) continue;
        const x = padL + (i / nNotes) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, padY);
        ctx.lineTo(x, h - padY);
        ctx.stroke();
      }

      // blue target capsules
      const capsuleH = Math.max(14, Math.min(22, (h - padY * 2) / Math.max(6, lanes.length + 2)));
      for (let i = 0; i < notesNow.length; i++) {
        const n = notesNow[i]!;
        const slotW = plotW / nNotes;
        const cx = padL + (i + 0.5) * slotW;
        const capW = Math.max(28, Math.min(slotW * 0.72, 70));
        const y = midiToY(n.midi, midiMin, midiMax, h, padY);
        const isActive = i === stepNow;
        drawCapsule(ctx, cx - capW / 2, y, capW, capsuleH, isActive);
      }

      // playhead
      if (startT != null) {
        const elapsed = (now - startT) / 1000;
        const frac = Math.min(1, Math.max(0, elapsed / totalSec));
        const playheadX = padL + frac * plotW;
        ctx.strokeStyle = "rgba(37, 99, 235, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, padY - 4);
        ctx.lineTo(playheadX, h - padY + 4);
        ctx.stroke();
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.moveTo(playheadX, padY - 4);
        ctx.lineTo(playheadX - 5, padY - 12);
        ctx.lineTo(playheadX + 5, padY - 12);
        ctx.closePath();
        ctx.fill();
      }

      // white voice trail
      let trailPts: Array<{ x: number; y: number }> = [];
      if (startT != null) {
        for (const s of samples) {
          if (s.midi == null || s.clarity < 0.45) continue;
          const rel = (s.t - startT) / 1000;
          if (rel < -0.2 || rel > totalSec + 0.4) continue;
          const x = padL + (rel / totalSec) * plotW;
          const y = midiToY(s.midi, midiMin, midiMax, h, padY);
          trailPts.push({ x, y });
        }
      } else {
        const windowSec = totalSec;
        const t0 = now - windowSec * 1000;
        for (const s of samples) {
          if (s.midi == null || s.clarity < 0.45 || s.t < t0) continue;
          const x = padL + ((s.t - t0) / (windowSec * 1000)) * plotW;
          const y = midiToY(s.midi, midiMin, midiMax, h, padY);
          trailPts.push({ x, y });
        }
      }

      if (trailPts.length >= 2) {
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        // dark under-stroke for contrast
        ctx.strokeStyle = "rgba(30, 30, 30, 0.35)";
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(trailPts[0]!.x, trailPts[0]!.y);
        for (let i = 1; i < trailPts.length; i++) {
          ctx.lineTo(trailPts[i]!.x, trailPts[i]!.y);
        }
        ctx.stroke();
        // bright white line
        ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(trailPts[0]!.x, trailPts[0]!.y);
        for (let i = 1; i < trailPts.length; i++) {
          const prev = trailPts[i - 1]!;
          const cur = trailPts[i]!;
          if (Math.abs(cur.y - prev.y) > (h - padY * 2) * 0.35) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cur.x, cur.y);
          } else {
            ctx.lineTo(cur.x, cur.y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        const last = trailPts[trailPts.length - 1]!;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(30,30,30,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (!listening) {
        ctx.fillStyle = "#a8a29e";
        ctx.font = `500 13px "DM Sans", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Start mic + Play sequence — sing the blue targets as the playhead moves",
          padL + plotW / 2,
          h / 2,
        );
      } else if (startT == null) {
        ctx.fillStyle = "#a8a29e";
        ctx.font = `500 13px "DM Sans", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Press Play sequence to hear the arpeggio tones and follow the targets",
          padL + plotW / 2,
          h / 2,
        );
      }

      // outer border
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 10);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [range, noteDurationSec, totalSec, samplesRef, revision]);

  return (
    <div ref={wrapRef} className={`pitch-graph-wrap studio-track ${className}`}>
      <canvas
        ref={canvasRef}
        className="pitch-graph-canvas"
        aria-label="Studio pitch track with timed target capsules"
      />
    </div>
  );
}

export function appendPitchSample(
  prev: PitchSample[],
  frame: PitchFrame,
  maxSec = 20,
): PitchSample[] {
  const t = performance.now();
  const midi =
    frame.frequency && frame.clarity >= 0.5 && frame.midi != null
      ? frame.midi
      : null;
  prev.push({ t, midi, clarity: frame.clarity });
  const cutoff = t - maxSec * 1000;
  let i = 0;
  while (i < prev.length && prev[i]!.t < cutoff) i++;
  if (i > 0) prev.splice(0, i);
  if (prev.length > 900) prev.splice(0, prev.length - 900);
  return prev;
}
