/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      fontFamily: {
        serif: ["\"Cormorant Garamond\"", "\"Playfair Display\"", "\"Noto Serif SC\"", "serif"],
        cormorant: ["\"Cormorant Garamond\"", "serif"],
        playfair: ["\"Playfair Display\"", "serif"],
        cinzel: ["\"Cinzel\"", "serif"],
        syne: ["\"Syne\"", "sans-serif"],
        sans: ["\"Plus Jakarta Sans\"", "\"Inter\"", "system-ui", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "\"Space Mono\"", "monospace"],
        display: ["\"Instrument Serif\"", "\"Cormorant Garamond\"", "serif"],
      },
      colors: {
        studio: {
          bg: "var(--studio-bg)",
          sidebar: "var(--studio-sidebar)",
          panel: "var(--studio-panel)",
          card: "var(--studio-card)",
          border: "var(--studio-border)",
          borderSubtle: "var(--studio-border-subtle)",
          text: "var(--studio-text)",
          muted: "var(--studio-muted)",
          hover: "var(--studio-hover)",
          accent: "var(--studio-accent)",
          accentHover: "var(--studio-accent-hover)",
          accentCrimson: "var(--studio-accent-crimson)",
          accentOlive: "var(--studio-accent-olive)",
          canvasBg: "var(--studio-canvas-bg)",
        },
        paper: {
          canvas: "#F6F4F0",
          ivory: "#FFFDF9",
          sand: "#ECE7E1",
          stone: "#DDD6CC",
          ink: "#1A1817",
        }
      },
      boxShadow: {
        "soft-float": "0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.08)",
        "canvas-drop": "0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 1px 1px rgba(0, 0, 0, 0.05)",
        "subtle-glow": "0 0 25px -5px rgba(229, 196, 159, 0.2)",
      }
    },
  },
  plugins: [],
}
