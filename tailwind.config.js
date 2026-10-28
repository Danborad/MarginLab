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
        // 大厂官网级暗色体系（即梦 / 可灵 视觉语言）
        aurora: {
          void: "#0A0B0E",
          deep: "#0E1016",
          base: "#12141A",
          raised: "#171A21",
          float: "#1E2028",
          line: "rgba(255,255,255,0.08)",
          lineStrong: "rgba(255,255,255,0.18)",
          text: "#F4F6FA",
          muted: "#9BA3B4",
          dim: "#6B7385",
          green: "#22C55E",
          greenBright: "#00E676",
          cyan: "#22D3EE",
          violet: "#8B5CF6",
          blue: "#0D254C",
        },
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
        // 暗色体系专用
        "glass": "0 16px 48px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        "glass-lg": "0 32px 80px -24px rgba(0, 0, 0, 0.85), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
        "aurora": "0 0 32px -6px rgba(34, 197, 94, 0.45)",
        "aurora-lg": "0 0 64px -12px rgba(34, 197, 94, 0.55)",
      },
      backgroundImage: {
        "aurora-glow":
          "radial-gradient(60% 50% at 18% 0%, rgba(13,37,76,0.85) 0%, transparent 60%), radial-gradient(50% 45% at 82% 8%, rgba(139,92,246,0.32) 0%, transparent 62%), radial-gradient(45% 40% at 50% 0%, rgba(34,211,238,0.18) 0%, transparent 65%)",
        "aurora-line":
          "linear-gradient(90deg, rgba(34,197,94,0) 0%, rgba(34,197,94,0.55) 50%, rgba(34,197,94,0) 100%)",
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [],
}
