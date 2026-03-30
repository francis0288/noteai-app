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
          yellow: "#fff475",
          green: "#ccff90",
          blue: "#cbf0f8",
          purple: "#d7aefb",
          pink: "#fdcfe8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
