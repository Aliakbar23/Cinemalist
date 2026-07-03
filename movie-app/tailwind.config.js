/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        card: "var(--card)",
        border: "var(--border)",
        text: "var(--text)",
        purple: {
          DEFAULT: "var(--purple)",
          light: "var(--purple-light)",
          deep: "var(--purple-deep)",
          glow: "var(--purple-glow)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
          glow: "var(--gold-glow)",
        },
        muted: "var(--muted)",
        soft: "var(--soft)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      backgroundImage: {
        "cinema": "linear-gradient(135deg, var(--cinema-g1), var(--cinema-g2))",
        "gold-shine": "linear-gradient(135deg, var(--gold-shine-g1), var(--gold-shine-g2))",
        "card-glow": "linear-gradient(135deg, var(--card-glow-g1), var(--card-glow-g2))",
        "hero-overlay": "var(--hero-overlay)",
        "hero-bottom": "var(--hero-bottom)",
        "text-gradient": "var(--text-gradient)",
      },
      boxShadow: {
        cinema: "0 0 40px var(--purple-glow)",
        "cinema-sm": "0 0 16px var(--purple-glow)",
        gold: "0 0 24px var(--gold-glow)",
        poster: "0 20px 60px rgba(0,0,0,0.3)",
      },
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
    },
  },
  plugins: [],
};
