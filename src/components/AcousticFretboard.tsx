import { useMemo, type CSSProperties } from "react";
import { FRET_MAX, STRING_COUNT, STRING_LABELS } from "../lib/music/fretboard";
import type { FretMark } from "./Fretboard";

/**
 * Precision SVG fretboard for Note Lab.
 * Geometry mirrors public/fretboard-hd.svg (viewBox 1200×320).
 */
const IMG = `${import.meta.env.BASE_URL}fretboard-hd.svg`;

// SVG layout constants (must match fretboard-hd.svg)
const VB_W = 1200;
const VB_H = 320;
const BOARD_X0 = 48; // left of nut
const BOARD_X1 = 1152; // end of board
const NUT_W = 14;
const PLAY_X0 = BOARD_X0 + NUT_W; // 62 — start of open/fret spaces after nut face
const PLAY_X1 = BOARD_X1;
/** 12-TET fret wire x positions in viewBox units (0 = nut face, 12 = 12th wire). */
function fretWireXs(frets: number): number[] {
  const span = PLAY_X1 - PLAY_X0;
  const raw: number[] = [0];
  for (let n = 1; n <= frets; n++) {
    raw.push(1 - 2 ** (-n / 12));
  }
  const scale = raw[raw.length - 1]!;
  return raw.map((p) => PLAY_X0 + (p / scale) * span);
}

/** Left edge + width of fret cell in % of viewBox. */
function cellXRange(wires: number[], fret: number): { leftPct: number; widthPct: number } {
  let x0: number;
  let x1: number;
  if (fret === 0) {
    x0 = BOARD_X0;
    x1 = wires[1]!;
  } else {
    x0 = wires[fret]!; // finger behind the fret wire toward nut... 
    // Standard UI: fretted note N occupies space BETWEEN wire N-1 and wire N
    // (you press in that space). Open is nut→wire1.
    x0 = wires[fret - 1]!;
    x1 = wires[fret]!;
  }
  // slight inset so dots sit in the cell
  const pad = (x1 - x0) * 0.04;
  return {
    leftPct: ((x0 + pad) / VB_W) * 100,
    widthPct: ((x1 - x0 - pad * 2) / VB_W) * 100,
  };
}

function stringCenterY(displayRow: number): number {
  // SVG strings: high e at top — 6 strings from y≈70 to y≈230
  const yTop = 70;
  const yBot = 230;
  return yTop + displayRow * ((yBot - yTop) / (STRING_COUNT - 1));
}

type Props = {
  frets?: number;
  marks?: FretMark[];
  onCellClick?: (string: number, fret: number) => void;
  interactive?: boolean;
  className?: string;
};

export function AcousticFretboard({
  frets = FRET_MAX,
  marks = [],
  onCellClick,
  interactive = false,
  className = "",
}: Props) {
  const wires = useMemo(() => fretWireXs(frets), [frets]);

  const markMap = useMemo(() => {
    const m = new Map<string, FretMark>();
    for (const mark of marks) m.set(`${mark.string}-${mark.fret}`, mark);
    return m;
  }, [marks]);

  return (
    <div className={`acoustic-fb ${className}`}>
      <div className="acoustic-fb-frame acoustic-fb-frame--svg">
        <img
          src={IMG}
          alt="Precision guitar fretboard, frets 0 through 12, standard tuning"
          className="acoustic-fb-img acoustic-fb-img--svg"
          draggable={false}
        />

        <div className="acoustic-fb-grid" role="grid" aria-label="Fretboard notes">
          {Array.from({ length: STRING_COUNT }, (_, stringIndex) => {
            // stringIndex 0 = low E (bottom), 5 = high e (top)
            const displayRow = STRING_COUNT - 1 - stringIndex;
            const cy = stringCenterY(displayRow);
            const rowH = ((230 - 70) / (STRING_COUNT - 1)) * 0.92;
            const topPct = ((cy - rowH / 2) / VB_H) * 100;
            const heightPct = (rowH / VB_H) * 100;

            return Array.from({ length: frets + 1 }, (_, fret) => {
              const mark = markMap.get(`${stringIndex}-${fret}`);
              const { leftPct, widthPct } = cellXRange(wires, fret);
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
      <p className="acoustic-fb-caption">
        Precision neck · frets 0–{frets} · low E at the bottom · nut on the left
      </p>
    </div>
  );
}
