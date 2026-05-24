export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcff",
          100: "#d9f7fb",
          200: "#b8eef5",
          500: "#1e9bb0",
          600: "#157c94",
          700: "#0f6076",
        },
        coral: {
          50: "#fff0ea",
          100: "#ffd9ca",
          500: "#f47e57",
          600: "#d8643e",
        },
        sun: {
          50: "#fff9e7",
          100: "#ffefb9",
          300: "#ffd46f",
          500: "#d9a432",
        },
        berry: {
          500: "#e57b6a",
          600: "#cb6252",
        },
        aqua: {
          50: "#f1fdfc",
          100: "#d8f8f3",
          400: "#7dded0",
          500: "#4ebdaf",
        },
      },
      boxShadow: {
        soft: "0 22px 60px rgba(24, 49, 74, 0.12)",
        neon: "0 24px 60px rgba(30, 155, 176, 0.28)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%": { transform: "translateY(-16px) scale(1.03)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(22, 115, 104, 0)" },
          "50%": { boxShadow: "0 0 48px rgba(22, 115, 104, 0.28)" },
        },
        shimmerMove: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        floatySlow: "floaty 10s ease-in-out infinite",
        pulseGlow: "pulseGlow 3.2s ease-in-out infinite",
        shimmerMove: "shimmerMove 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
