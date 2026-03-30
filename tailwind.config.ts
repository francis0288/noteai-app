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
      colors: {
        note: {
          default: "#ffffff",
          red: "#f28b82",
          orange: "#fbbc04",
          yellow: "#fff475",
          green: "#ccff90",
          teal: "#a7ffeb",
          blue: "#cbf0f8",
          darkblue: "#aecbfa",
          purple: "#d7aefb",
          pink: "#fdcfe8",
          brown: "#e6c9a8",
          gray: "#e8eaed",
        },
      },
    },
  },
  plugins: [],
};

export default config;
