import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Scale all font sizes up 3 steps
      fontSize: {
        xs:   ["0.875rem",  { lineHeight: "1.25rem" }],   // was 0.75
        sm:   ["1rem",      { lineHeight: "1.5rem" }],     // was 0.875
        base: ["1.125rem",  { lineHeight: "1.75rem" }],    // was 1
        lg:   ["1.25rem",   { lineHeight: "1.875rem" }],   // was 1.125
        xl:   ["1.5rem",    { lineHeight: "2rem" }],       // was 1.25
        "2xl":["1.875rem",  { lineHeight: "2.25rem" }],    // was 1.5
        "3xl":["2.25rem",   { lineHeight: "2.5rem" }],     // was 1.875
      },
      colors: {
        brand: {
          DEFAULT: "#06B6D4",
          50:  "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        navy: {
          DEFAULT: "#1E3A8A",
          light: "#1D4ED8",
          dark:  "#172554",
        },
        note: {
          default: "#ffffff",
          yellow:  "#fff475",
          green:   "#ccff90",
          blue:    "#cbf0f8",
          purple:  "#d7aefb",
          pink:    "#fdcfe8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
