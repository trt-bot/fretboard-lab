import type { SingNote } from "../lib/sing/exercises";
import type { SingRoot, SingQuality } from "../lib/sing/exercises";

/** Map MIDI to treble-staff Y position (rough diatonic steps from middle C). */
function midiToStaffStep(midi: number): number {
  const PC_STEPS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
  const n = Math.round(midi);
  const oct = Math.floor(n / 12) - 5;
  const pc = ((n % 12) + 12) % 12;
  return oct * 7 + PC_STEPS[pc]!;
}

const KEY_SIG_SHARPS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6,
  F: 0, Bb: 0,
};
const KEY_SIG_FLATS: Record<string, number> = {
  F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6,
};

type Props = {
  notes: SingNote[];
  root: SingRoot;
  quality: SingQuality;
  activeIndex?: number;
  playheadFrac?: number;
};

export function SimpleStaff({ notes, root, quality, activeIndex = -1 }: Props) {
  const preferFlat = root === "Bb" || root === "F";
  const width = Math.max(420, 80 + notes.length * 36 + 60);
  const height = 110;
  const staffTop = 28;
  const staffGap = 10;
  const left = 54;
  const noteArea = width - left - 20;

  const e4Step = midiToStaffStep(64);
  const yForMidi = (midi: number) => {
    const step = midiToStaffStep(midi);
    return staffTop + 4 * staffGap - (step - e4Step) * (staffGap / 2);
  };

  const sharpCount = !preferFlat ? (KEY_SIG_SHARPS[root] ?? 0) : 0;
  const flatCount = preferFlat ? (KEY_SIG_FLATS[root] ?? 0) : 0;
  const sharpYs = [0, 1.5, -0.5, 1, 2.5, 0.5, 2].map((s) => staffTop + s * staffGap);
  const flatYs = [1, -0.5, 1.5, 0, 2, 0.5, 2.5].map((s) => staffTop + s * staffGap);

  return (
    <div className="simple-staff-wrap">
      <svg
        className="simple-staff"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Exercise notation"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={left - 8}
            x2={width - 12}
            y1={staffTop + i * staffGap}
            y2={staffTop + i * staffGap}
            stroke="#2a2a2a"
            strokeWidth="1"
          />
        ))}

        <text x={8} y={staffTop + 3.4 * staffGap} fontSize="42" fontFamily="Georgia, serif" fill="#1a1a1a">
          {'\u{1D11E}'}
        </text>

        {Array.from({ length: sharpCount }).map((_, i) => (
          <text key={`s${i}`} x={34 + i * 8} y={sharpYs[i]! + 4} fontSize="16" fill="#1a1a1a">
            {'\u266F'}
          </text>
        ))}
        {Array.from({ length: flatCount }).map((_, i) => (
          <text key={`f${i}`} x={34 + i * 8} y={flatYs[i]! + 4} fontSize="16" fill="#1a1a1a">
            {'\u266D'}
          </text>
        ))}

        <text x={left - 2} y={staffTop + 1.6 * staffGap} fontSize="15" fontWeight="700" fontFamily="Georgia, serif" fill="#1a1a1a">4</text>
        <text x={left - 2} y={staffTop + 3.3 * staffGap} fontSize="15" fontWeight="700" fontFamily="Georgia, serif" fill="#1a1a1a">4</text>

        {notes.map((n, i) => {
          const x = left + 28 + (i / Math.max(1, notes.length - 1)) * (noteArea - 40);
          const y = yForMidi(n.midi);
          const active = i === activeIndex;
          const isLast = i === notes.length - 1;
          const ledgers: number[] = [];
          const bottomY = staffTop + 4 * staffGap;
          const topY = staffTop;
          if (y > bottomY + 1) {
            for (let ly = bottomY + staffGap; ly < y + 1; ly += staffGap) ledgers.push(ly);
          }
          if (y < topY - 1) {
            for (let ly = topY - staffGap; ly > y - 1; ly -= staffGap) ledgers.push(ly);
          }
          return (
            <g key={`${n.midi}-${i}`}>
              {ledgers.map((ly) => (
                <line key={ly} x1={x - 10} x2={x + 10} y1={ly} y2={ly} stroke="#2a2a2a" strokeWidth="1" />
              ))}
              <ellipse
                cx={x}
                cy={y}
                rx={isLast ? 9 : 7}
                ry={5}
                fill={active ? "#3b8cf0" : "#1a1a1a"}
                transform={`rotate(-15 ${x} ${y})`}
              />
              {!isLast && (
                <line x1={x + 6} x2={x + 6} y1={y} y2={y - 28} stroke={active ? "#3b8cf0" : "#1a1a1a"} strokeWidth="1.4" />
              )}
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fontFamily="DM Sans, system-ui, sans-serif"
                fill={active ? "#3b8cf0" : "#8a847c"}
                fontWeight={active ? 600 : 500}
              >
                {n.degree}
              </text>
            </g>
          );
        })}

        {[4, 8, 12].map((idx) => {
          if (idx >= notes.length) return null;
          const x = left + 28 + (idx / Math.max(1, notes.length - 1)) * (noteArea - 40) - 14;
          return (
            <line key={idx} x1={x} x2={x} y1={staffTop} y2={staffTop + 4 * staffGap} stroke="#2a2a2a" strokeWidth="1" />
          );
        })}
        <line x1={width - 14} x2={width - 14} y1={staffTop} y2={staffTop + 4 * staffGap} stroke="#2a2a2a" strokeWidth="2" />
      </svg>
      <p className="simple-staff-caption">
        {quality === "min" ? `${root} minor` : `${root} major`} · written exercise
      </p>
    </div>
  );
}
