import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { MetronomePage } from "./pages/MetronomePage";
import { ProgressionsPage } from "./pages/ProgressionsPage";

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
            <span>
              <div className="brand-title">Fretboard Lab</div>
              <div className="brand-sub">Guitar practice apps</div>
            </span>
          </NavLink>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Workshop
            </NavLink>
            <NavLink to="/metronome">Metronome</NavLink>
            <NavLink to="/progressions">Progressions</NavLink>
          </nav>
        </div>
      </header>

      <main className="main-inner">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/metronome" element={<MetronomePage />} />
          <Route path="/progressions" element={<ProgressionsPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>Fretboard Lab — a home for guitar practice tools</p>
          <p className="small">Built for players who practice with intention</p>
        </div>
      </footer>
    </div>
  );
}
