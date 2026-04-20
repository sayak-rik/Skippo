import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        ink: {
          DEFAULT: "#0a0a0a",
          soft:    "#3f3f46",
          muted:   "#71717a",
          faint:   "#a1a1aa",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft:    "#fafafa",
          muted:   "#f4f4f5",
          border:  "#e4e4e7",
        },
        dark: {
          DEFAULT: "#09090b",
          card:    "#111113",
          border:  "#27272a",
          muted:   "#3f3f46",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card:   "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        lift:   "0 4px 24px -4px rgb(0 0 0 / 0.10), 0 2px 8px -2px rgb(0 0 0 / 0.06)",
        heavy:  "0 20px 60px -10px rgb(0 0 0 / 0.25), 0 8px 24px -8px rgb(0 0 0 / 0.15)",
        glow:   "0 0 0 3px rgb(99 102 241 / 0.25)",
        brand:  "0 8px 32px -4px rgb(79 70 229 / 0.40)",
        "brand-lg": "0 16px 48px -8px rgb(79 70 229 / 0.50)",
        "glow-sm": "0 0 20px rgb(99 102 241 / 0.20)",
        "glow-md": "0 0 40px rgb(99 102 241 / 0.30)",
        "glow-violet": "0 0 40px rgb(139 92 246 / 0.30)",
      },
      animation: {
        "fade-up":    "fadeUp 0.6s cubic-bezier(0.25, 0.4, 0.25, 1) both",
        "fade-in":    "fadeIn 0.5s ease both",
        "slide-in":   "slideIn 0.5s ease both",
        "pulse-dot":  "pulseDot 2s ease-in-out infinite",
        "float":      "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "ticker":     "ticker 28s linear infinite",
        "ticker-rev": "tickerRev 28s linear infinite",
        "shimmer":    "shimmer 2.5s linear infinite",
        "gradient":   "gradientShift 8s ease infinite",
        "border-spin":"borderSpin 6s linear infinite",
        "scale-in":   "scaleIn 0.4s cubic-bezier(0.25, 0.4, 0.25, 1) both",
        "blur-in":    "blurIn 0.6s cubic-bezier(0.25, 0.4, 0.25, 1) both",
        "spin-slow":  "spin 20s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1",   transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(1.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%":      { transform: "translateY(-12px) rotate(0.5deg)" },
          "66%":      { transform: "translateY(-6px) rotate(-0.5deg)" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        tickerRev: {
          "0%":   { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        borderSpin: {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blurIn: {
          "0%":   { opacity: "0", filter: "blur(12px)", transform: "translateY(16px)" },
          "100%": { opacity: "1", filter: "blur(0px)",  transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
