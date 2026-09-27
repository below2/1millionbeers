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
      },
      fontFamily: {
        display: ["'Georgia'", "serif"],
      },
      boxShadow: {
        glow: "0 0 30px rgba(242,167,27,0.25)",
      },
    },
  },
  plugins: [],
};
