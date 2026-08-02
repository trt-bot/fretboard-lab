import type { ReactNode } from "react";
import { FRET_MAX, STRING_COUNT, STRING_LABELS } from "../lib/music/fretboard";

export type FretMark = {
  string: number; // 0 low E
  fret: number;
  kind?: "root" | "chord" | "scale" | "target" | "mute" | "correct" | "wrong";
  label?: string;
};

type Props = {
  frets?: number;
  marks?: FretMark[];
  onCellClick?: (string: number, fret: number) => void;
  interactive?: boolean;
  /** Highlight a fret window (inclusive) */
  windowStart?: number;
  windowEnd?: number;
  className?: string;
  footer?: ReactNode;
};

export function Fretboard({
  frets = FRET_MAX,
  marks = [],
  onCellClick,
  interactive = false,
  windowStart,
  windowEnd,
  className = "",
  footer,
}: Props) {
  const markMap = new Map<string, FretMark>();
  for (const m of marks) {
    markMap.set(`${m.string}-${m.fret}`, m);
  }

  // Display strings high e at top (visual guitar)
  const displayOrder = Array.from({ length: STRING_COUNT }, (_, i) => STRING_COUNT - 1 - i);

  return (
    <div className={`fretboard-wrap ${className}`}>
      <div
        className="fretboard"
        style={{
          gridTemplateColumns: `2rem repeat(${frets + 1}, minmax(1.6rem, 1fr))`,
        }}
        role={interactive ? "grid" : "img"}
        aria-label="Guitar fretboard"
      >
        {/* Fret numbers */}
        <div className="fretboard-corner" />
        {Array.from({ length: frets + 1 }, (_, f) => (
          <div key={`n-${f}`} className="fret-num">
            {f === 0 ? "nut" : f}
          </div>
        ))}

        {displayOrder.map((s) => (
          <div key={`row-${s}`} className="fretboard-row-contents" style={{ display: "contents" }}>
            <div className="string-label">{STRING_LABELS[s]}</div>
            {Array.from({ length: frets + 1 }, (_, f) => {
              const m = markMap.get(`${s}-${f}`);
              const inWindow =
                windowStart === undefined ||
                windowEnd === undefined ||
                (f >= windowStart && f <= windowEnd);
              const dim = windowStart !== undefined && !inWindow;
              return (
                <button
                  key={`${s}-${f}`}
                  type="button"
                  className={[
                    "fret-cell",
                    f === 0 ? "nut-cell" : "",
                    m ? `mark-${m.kind ?? "scale"}` : "",
                    dim ? "dim" : "",
                    interactive ? "interactive" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={!interactive}
                  onClick={() => onCellClick?.(s, f)}
                  aria-label={`String ${STRING_LABELS[s]}, fret ${f}${m?.label ? `, ${m.label}` : ""}`}
                >
                  <span className="string-line-h" aria-hidden />
                  {m && (
                    <span className="fret-dot">
                      {m.label ? <span className="dot-label">{m.label}</span> : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}
