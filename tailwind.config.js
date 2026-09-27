/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pub: {
          bg: "#12100e",
          surface: "#1c1815",
          surface2: "#262019",
          border: "#3a2f24",
          amber: "#f2a71b",
          amber2: "#d4880a",
          foam: "#fdf6e3",
          gold: "#e6b800",
        },
        // "Playful Pub-Brutalism" additions
        stout: "#0b0908",
        neon: "#39ff88",
        neon2: "#1fcf6b",
      },
      fontFamily: {
        display: ["'Georgia'", "serif"],
        arcade: ["'Arial Black'", "'Helvetica Neue'", "sans-serif"],
      },
      borderWidth: {
        3: "3px",
      },
      boxShadow: {
        glow: "0 0 30px rgba(242,167,27,0.25)",
        brutalSm: "2px 2px 0px 0px #0b0908",
        brutal: "4px 4px 0px 0px #0b0908",
        brutalLg: "8px 8px 0px 0px #0b0908",
        brutalAmber: "4px 4px 0px 0px #d4880a",
        brutalNeon: "4px 4px 0px 0px #1fcf6b",
        brutalInset: "inset 3px 3px 0px 0px rgba(11,9,8,0.5)",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "20%": { transform: "translateX(-6px) rotate(-1.5deg)" },
          "40%": { transform: "translateX(5px) rotate(1.5deg)" },
          "60%": { transform: "translateX(-4px) rotate(-1deg)" },
          "80%": { transform: "translateX(3px) rotate(1deg)" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) scale(0.7)", opacity: "0" },
          "15%": { transform: "translateY(-8px) scale(1.1)", opacity: "1" },
          "100%": { transform: "translateY(-90px) scale(1.3)", opacity: "0" },
        },
        bubble: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.7" },
          "100%": { transform: "translateY(-60px) scale(0.4)", opacity: "0" },
        },
        pop: {
          "0%": { transform: "scale(0.9)" },
          "50%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
      },
      animation: {
        shake: "shake 0.5s ease-in-out",
        floatUp: "float-up 1.1s ease-out forwards",
        bubble: "bubble 2.4s ease-in infinite",
        pop: "pop 0.35s ease-out",
        wiggle: "wiggle 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
