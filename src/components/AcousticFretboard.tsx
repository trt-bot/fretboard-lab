import { useMemo, type CSSProperties } from "react";
import { FRET_MAX, STRING_COUNT, STRING_LABELS } from "../lib/music/fretboard";
import type { FretMark } from "./Fretboard";

/**
 * Photo-based acoustic neck for Note Lab.
 * Image: nut on the left, bridge direction right, low E at bottom.
 *
 * Layout constants are percentages of the photo content box and can be
 * nudged if the asset is replaced.
 */
const IMG = `${import.meta.env.BASE_URL}acoustic-fretboard.jpg`;

/** Horizontal span of the fingerboard playable surface (open → 12th). */
const BOARD_X0 = 6.2; // % — open/nut zone starts
const BOARD_X1 = 97.2; // % — past 12th fret

/** Vertical span covering the six strings (high e → low E top→bottom). */
const BOARD_Y0 = 27.5;
const BOARD_Y1 = 71.5;

type Props = {
  frets?: number;
  marks?: FretMark[];
  onCellClick?: (string: number, fret: number) => void;
  interactive?: boolean;
  className?: string;
};

function cellStyle(stringIndex: number, fret: number, frets: number): CSSProperties {
  // Display: high e at top → stringIndex 5 at top of photo, 0 at bottom
  const displayRow = STRING_COUNT - 1 - stringIndex; // 0 = top visual row
  const rowH = (BOARD_Y1 - BOARD_Y0) / STRING_COUNT;
  const colW = (BOARD_X1 - BOARD_X0) / (frets + 1);

  const left = BOARD_X0 + fret * colW;
  const top = BOARD_Y0 + displayRow * rowH;

  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${colW}%`,
    height: `${rowH}%`,
  };
}

export function AcousticFretboard({
  frets = FRET_MAX,
  marks = [],
  onCellClick,
  interactive = false,
  className = "",
}: Props) {
  const markMap = useMemo(() => {
    const m = new Map<string, FretMark>();
    for (const mark of marks) m.set(`${mark.string}-${mark.fret}`, mark);
    return m;
  }, [marks]);

  return (
    <div className={`acoustic-fb ${className}`}>
      <div className="acoustic-fb-frame">
        <img
          src={IMG}
          alt="Acoustic guitar fretboard, frets 0 through 12, standard tuning"
          className="acoustic-fb-img"
          draggable={false}
        />

        {/* String gutter labels */}
        <div className="acoustic-fb-string-labels" aria-hidden>
          {Array.from({ length: STRING_COUNT }, (_, displayRow) => {
            const stringIndex = STRING_COUNT - 1 - displayRow;
            const rowH = (BOARD_Y1 - BOARD_Y0) / STRING_COUNT;
            const top = BOARD_Y0 + displayRow * rowH;
            return (
              <span
                key={stringIndex}
                className="acoustic-fb-slabel"
                style={{ top: `${top + rowH * 0.15}%`, height: `${rowH * 0.7}%` }}
              >
                {STRING_LABELS[stringIndex]}
              </span>
            );
          })}
        </div>

        {/* Fret number strip */}
        <div className="acoustic-fb-fret-nums" aria-hidden>
          {Array.from({ length: frets + 1 }, (_, f) => {
            const colW = (BOARD_X1 - BOARD_X0) / (frets + 1);
            const left = BOARD_X0 + f * colW;
            return (
              <span
                key={f}
                className="acoustic-fb-fnum"
                style={{ left: `${left}%`, width: `${colW}%` }}
              >
                {f === 0 ? "0" : f}
              </span>
            );
          })}
        </div>

        {/* Hit targets + marks */}
        <div className="acoustic-fb-grid" role="grid" aria-label="Fretboard notes">
          {Array.from({ length: STRING_COUNT }, (_, stringIndex) =>
            Array.from({ length: frets + 1 }, (_, fret) => {
              const mark = markMap.get(`${stringIndex}-${fret}`);
              const style = cellStyle(stringIndex, fret, frets);
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
            }),
          )}
        </div>
      </div>
      <p className="acoustic-fb-caption">
        Acoustic neck · nut on the left · low E at the bottom · frets 0–{frets}
      </p>
    </div>
  );
}
