import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base for GitHub Pages (works under /fretboard-lab/ or custom domain)
export default defineConfig({
  plugins: [react()],
  base: "./",
});
