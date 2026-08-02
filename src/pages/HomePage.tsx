import { Link } from "react-router-dom";

const EAR_TRAINER = "https://trt-bot.github.io/guitar-interval-trainer/";

type AppCard = {
  id: string;
  pillar: string;
  title: string;
  description: string;
  tags: string[];
  to?: string;
  href?: string;
  external?: boolean;
};

const apps: AppCard[] = [
  {
    id: "interval-trainer",
    pillar: "Hear",
    title: "Interval Trainer",
    description:
      "Identify guitar intervals by ear. Build the listening half of fretboard fluency.",
    tags: ["Ear", "Intervals"],
    href: EAR_TRAINER,
    external: true,
  },
  {
    id: "metronome",
    pillar: "Time",
    title: "Woodblock Metronome",
    description:
      "Natural woodblock click, tempo control, and practice timers. Keep time without fuss.",
    tags: ["Timing", "Practice"],
    to: "/metronome",
  },
  {
    id: "progressions",
    pillar: "Harmony",
    title: "Progression Explorer",
    description:
      "Bluegrass, gypsy jazz, pop, songwriting — transpose, loop at tempo, hear why changes work.",
    tags: ["Chords", "Genres"],
    to: "/progressions",
  },
  {
    id: "notes",
    pillar: "Fretboard",
    title: "Note Lab",
    description:
      "Find and name notes on the neck (frets 0–12). Fast geography drills for intermediate hands.",
    tags: ["Notes", "Drill"],
    to: "/notes",
  },
  {
    id: "scales",
    pillar: "Lines",
    title: "Scale & CAGED Lab",
    description:
      "One scale box at a time, plus movable CAGED major/minor shapes you can actually grip.",
    tags: ["Scales", "CAGED"],
    to: "/scales",
  },
  {
    id: "sing",
    pillar: "Voice",
    title: "Sing Lab",
    description:
      "Sing scales and arpeggios over a guitar chord. Live pitch meter shows how close you are to each target note.",
    tags: ["Singing", "Pitch"],
    to: "/sing",
  },
]

export function HomePage() {
  return (
    <>
      <section className="hero" style={{ marginBottom: "2.5rem" }}>
        <span className="badge badge-wood">Intermediate practice lab</span>
        <h1 style={{ marginTop: "1rem" }}>Guitar tools that stay out of your way.</h1>
        <p>
          Fretboard Lab is a focused set of practice apps — ear, time, harmony,
          neck geography, and scale/CAGED shapes. Open one tool, practice with
          intention, close the laptop.
        </p>
        <div className="hero-rule" aria-hidden />
        <p className="practice-path">
          <strong>Simple path:</strong> Note Lab → Scale pattern → Sing Lab over a chord → loop a progression.
        </p>
      </section>

      <section aria-labelledby="apps-heading">
        <div className="section-head">
          <div>
            <h2 id="apps-heading">The lab</h2>
            <p>{apps.length} tools · same calm wood UI</p>
          </div>
        </div>

        <div className="app-grid">
          {apps.map((app) => (
            <article key={app.id} className="card app-card">
              <div
                className="card-header"
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <div className="app-card-top">
                  <span className="pillar-tag">{app.pillar}</span>
                </div>
                <h3 className="card-title">{app.title}</h3>
                <p className="card-desc">{app.description}</p>
                <div className="tags">
                  {app.tags.map((t) => (
                    <span key={t} className="badge badge-solid">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card-footer">
                {app.external ? (
                  <a
                    className="btn btn-secondary"
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open ↗
                  </a>
                ) : (
                  <Link className="btn btn-primary" to={app.to!}>
                    Open →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
