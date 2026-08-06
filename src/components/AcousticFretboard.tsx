import { useMemo, type CSSProperties, type ReactNode } from "react";
import { FRET_MAX, STRING_COUNT, STRING_LABELS } from "../lib/music/fretboard";
import type { FretMark } from "./Fretboard";

/**
 * Precision SVG fretboard (shared by Note Lab + Scale & CAGED Lab).
 * Geometry mirrors public/fretboard-hd.svg (viewBox 1200×270), frets 0–12.
 * Double inlays at frets 5 and 12; single at 3, 7, 9.
 */
const IMG = `${import.meta.env.BASE_URL}fretboard-hd.svg`;

const VB_W = 1200;
const VB_H = 270;
const BOARD_X0 = 48;
const BOARD_X1 = 1152;
const NUT_W = 14;
const PLAY_X0 = BOARD_X0 + NUT_W;
const PLAY_X1 = BOARD_X1;

function fretWireXs(frets: number): number[] {
  const span = PLAY_X1 - PLAY_X0;
  const raw: number[] = [0];
  for (let n = 1; n <= frets; n++) {
    raw.push(1 - 2 ** (-n / 12));
  }
  const scale = raw[raw.length - 1]!;
  return raw.map((p) => PLAY_X0 + (p / scale) * span);
}

function cellXRange(wires: number[], fret: number): { leftPct: number; widthPct: number } {
  let x0: number;
  let x1: number;
  if (fret === 0) {
    x0 = BOARD_X0;
    x1 = wires[1]!;
  } else {
    x0 = wires[fret - 1]!;
    x1 = wires[fret]!;
  }
  const pad = (x1 - x0) * 0.04;
  return {
    leftPct: ((x0 + pad) / VB_W) * 100,
    widthPct: ((x1 - x0 - pad * 2) / VB_W) * 100,
  };
}

function stringCenterY(displayRow: number): number {
  // Matches string lines in public/fretboard-hd.svg (compact layout)
  const yTop = 40;
  const yBot = 200;
  return yTop + displayRow * ((yBot - yTop) / (STRING_COUNT - 1));
}

type Props = {
  /** Always capped at 12 — SVG neck is frets 0–12 */
  frets?: number;
  marks?: FretMark[];
  onCellClick?: (string: number, fret: number) => void;
  interactive?: boolean;
  /** Dim frets outside this inclusive window (scale pattern highlight) */
  windowStart?: number;
  windowEnd?: number;
  className?: string;
  footer?: ReactNode;
  caption?: string;
};

export function AcousticFretboard({
  frets = FRET_MAX,
  marks = [],
  onCellClick,
  interactive = false,
  windowStart,
  windowEnd,
  className = "",
  footer,
  caption,
}: Props) {
  // SVG only has frets 0–12
  const fretCount = Math.min(FRET_MAX, Math.max(1, frets));
  const wires = useMemo(() => fretWireXs(fretCount), [fretCount]);

  const markMap = useMemo(() => {
    const m = new Map<string, FretMark>();
    for (const mark of marks) {
      if (mark.fret < 0 || mark.fret > fretCount) continue;
      m.set(`${mark.string}-${mark.fret}`, mark);
    }
    return m;
  }, [marks, fretCount]);

  return (
    <div className={`acoustic-fb ${className}`}>
      <div className="acoustic-fb-frame acoustic-fb-frame--svg">
        <img
          src={IMG}
          alt="Precision guitar fretboard, frets 0 through 12, standard tuning"
          className="acoustic-fb-img acoustic-fb-img--svg"
          draggable={false}
        />

        {/* Optional pattern window veil */}
        {windowStart !== undefined && windowEnd !== undefined && (
          <div className="acoustic-fb-window-veil" aria-hidden>
            {windowStart > 0 && (
              <div
                className="acoustic-fb-veil"
                style={{
                  left: "0%",
                  width: `${cellXRange(wires, windowStart).leftPct}%`,
                }}
              />
            )}
            {windowEnd < fretCount && (
              <div
                className="acoustic-fb-veil"
                style={{
                  left: `${
                    cellXRange(wires, windowEnd).leftPct +
                    cellXRange(wires, windowEnd).widthPct
                  }%`,
                  right: "0%",
                }}
              />
            )}
          </div>
        )}

        <div className="acoustic-fb-grid" role="grid" aria-label="Fretboard notes">
          {Array.from({ length: STRING_COUNT }, (_, stringIndex) => {
            const displayRow = STRING_COUNT - 1 - stringIndex;
            const cy = stringCenterY(displayRow);
            const rowH = ((200 - 40) / (STRING_COUNT - 1)) * 0.92;
            const topPct = ((cy - rowH / 2) / VB_H) * 100;
            const heightPct = (rowH / VB_H) * 100;

            return Array.from({ length: fretCount + 1 }, (_, fret) => {
              const mark = markMap.get(`${stringIndex}-${fret}`);
              const { leftPct, widthPct } = cellXRange(wires, fret);
              const inWindow =
                windowStart === undefined ||
                windowEnd === undefined ||
                (fret >= windowStart && fret <= windowEnd);
              const style: CSSProperties = {
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
              };
              return (
                <button
                  key={`${stringIndex}-${fret}`}
                  type="button"
                  role="gridcell"
                  className={[
                    "acoustic-fb-cell",
                    interactive ? "is-interactive" : "",
                    mark ? `is-mark mark-${mark.kind ?? "scale"}` : "",
                    !inWindow ? "is-dim" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={style}
                  disabled={!interactive && !mark}
                  onClick={() => onCellClick?.(stringIndex, fret)}
                  aria-label={`${STRING_LABELS[stringIndex]} string, fret ${fret}${
                    mark?.label ? `, ${mark.label}` : ""
                  }`}
                >
                  {mark && (
                    <span className="acoustic-fb-dot">
                      {mark.label ? (
                        <span className="acoustic-fb-dot-label">{mark.label}</span>
                      ) : null}
                    </span>
                  )}
                </button>
              );
            });
          })}
        </div>
      </div>
      {footer}
      <p className="acoustic-fb-caption">
        {caption ??
          `Precision neck · frets 0–${fretCount} · low E at the bottom · nut on the left`}
      </p>
    </div>
  );
}
