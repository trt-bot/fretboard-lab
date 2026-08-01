import { Link } from "react-router-dom";

const EAR_TRAINER = "https://trt-bot.github.io/guitar-interval-trainer/";

const apps = [
  {
    id: "interval-trainer",
    title: "Guitar Interval Trainer",
    description:
      "Train your ear on guitar intervals with interactive drills. Identify distances between notes by sound and build fretboard fluency.",
    tags: ["Ear training", "Intervals", "Listening"],
    href: EAR_TRAINER,
    external: true,
    status: "External",
  },
  {
    id: "metronome",
    title: "Woodblock Metronome",
    description:
      "A focused practice metronome with a natural woodblock click, smooth tempo slider, and easy one-tap practice timers.",
    tags: ["Timing", "Practice", "Built-in"],
    to: "/metronome",
    external: false,
    status: "Built-in",
  },
  {
    id: "progressions",
    title: "Chord Progression Explorer",
    description:
      "Bluegrass, gypsy jazz, pop, and a songwriting toolkit — transpose to any key, hear the changes, and learn why they work.",
    tags: ["Harmony", "Genres", "Songwriting"],
    to: "/progressions",
    external: false,
    status: "Built-in",
  },
] as const;

export function HomePage() {
  return (
    <>
      <section className="hero" style={{ marginBottom: "3rem" }}>
        <span className="badge badge-wood">Practice hub</span>
        <h1 style={{ marginTop: "1rem" }}>
          Everything you build for guitar, in one place.
        </h1>
        <p>
          Fretboard Lab is a simple holding site for guitar apps — ear training,
          timing tools, harmony explorers, and whatever comes next. Open a tool
          and get to work.
        </p>
        <div className="hero-rule" aria-hidden />
      </section>

      <section aria-labelledby="apps-heading">
        <div className="section-head">
          <div>
            <h2 id="apps-heading">Apps</h2>
            <p>{apps.length} tools ready to practice with</p>
          </div>
        </div>

        <div className="app-grid">
          {apps.map((app) => (
            <article key={app.id} className="card app-card">
              <div className="card-header" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="app-card-top">
                  <div className="app-icon" aria-hidden>
                    {app.id === "interval-trainer" && "◎"}
                    {app.id === "metronome" && "⏱"}
                    {app.id === "progressions" && "♯"}
                  </div>
                  <span
                    className={`badge ${
                      app.external ? "badge-outline" : "badge-wood"
                    }`}
                  >
                    {app.status}
                  </span>
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
                    Open app ↗
                  </a>
                ) : (
                  <Link className="btn btn-primary" to={app.to!}>
                    Open app →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="note-panel">
        <h2>Growing workshop</h2>
        <p>
          This hub is designed so new practice apps can land here as you build
          them — tuners, chord quizzes, scale explorers, and more. Each card is
          either a built-in tool on this site or a link to a dedicated app.
        </p>
      </section>
    </>
  );
}
