/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        deep: "#0B1120",
        panel: "#111A2E",
        panel2: "#0F1729",
        line: "#1E293B",
        sky: "#38BDF8",
        amber: "#F5A623",
        teal: "#2DD4BF",
        coral: "#FB7185",
        textPrimary: "#E6EDF5",
        textMuted: "#7C8AA5",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        glow: "0 0 24px rgba(56,189,248,0.25)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(20px,-15px) scale(1.06)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.4, transform: "scale(0.85)" },
        },
        riseIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 14s ease-in-out infinite",
        pulseDot: "pulseDot 2s ease-in-out infinite",
        riseIn: "riseIn 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
