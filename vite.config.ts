import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Absolute project base so deep links (/metronome) resolve assets correctly
export default defineConfig({
  plugins: [react()],
  base: "/fretboard-lab/",
});
