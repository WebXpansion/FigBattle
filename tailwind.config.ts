import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette dérivée des captures Editing Battle.
        ink: "#0b0414",        // fond principal violet-noir
        "ink-2": "#160a24",    // surfaces / cartes
        "ink-3": "#241338",    // bordures / hover
        magenta: "#ff2e88",    // accent primaire
        cyan: "#5ad7ff",       // accent secondaire (OK / argent)
        gold: "#f5c542",       // or / 1ère place
        bronze: "#cd8a4b",     // bronze / 3ème place
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
