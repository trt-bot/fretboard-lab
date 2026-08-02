import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { MetronomePage } from "./pages/MetronomePage";
import { ProgressionsPage } from "./pages/ProgressionsPage";
import { NoteLabPage } from "./pages/NoteLabPage";
import { ScaleCagedPage } from "./pages/ScaleCagedPage";

function GuitarMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      <path
        d="M8.5 15.5c-1.2 1.8-1 3.7.2 4.9 1.2 1.2 3.1 1.4 4.9.2l6.9-6.9c1.2-1.8 1-3.7-.2-4.9-1.2-1.2-3.1-1.4-4.9-.2L8.5 15.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10.2" cy="17.2" r="1.1" fill="currentColor" />
      <path d="M14.5 9.5 18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M16.8 4.2c.7-.7 2.1-.5 2.8.2.7.7.9 2.1.2 2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M4 20.5 7.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to="/" className="brand" end>
            <span className="brand-mark">
              <GuitarMark />
            </span>
            <span className="brand-text">
              <div className="brand-title">Fretboard Lab</div>
              <div className="brand-sub">Intermediate guitar practice</div>
            </span>
          </NavLink>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Lab
            </NavLink>
            <NavLink to="/metronome">Time</NavLink>
            <NavLink to="/progressions">Harmony</NavLink>
            <NavLink to="/notes">Notes</NavLink>
            <NavLink to="/scales">Scales</NavLink>
          </nav>
        </div>
      </header>

      <main className="main-inner">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/metronome" element={<MetronomePage />} />
          <Route path="/progressions" element={<ProgressionsPage />} />
          <Route path="/notes" element={<NoteLabPage />} />
          <Route path="/scales" element={<ScaleCagedPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>Fretboard Lab — practice tools for intermediate guitar</p>
          <p className="small">Hear · Time · Harmony · Fretboard · Lines</p>
        </div>
      </footer>
    </div>
  );
}
