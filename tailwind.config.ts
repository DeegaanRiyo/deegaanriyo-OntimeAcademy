import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand:   { DEFAULT: "#C1440E", 2: "#E05520", wash: "rgba(193,68,14,.08)" },
        gold:    { DEFAULT: "#c9921a", light: "#f0b832" },
        dark:    { DEFAULT: "#111111", 2: "#F5F5F5", 3: "#EBEBEB", 4: "#F0F0F0" },
        muted:   { DEFAULT: "#6B7280", 2: "#9CA3AF" },
        "off-white": "#FFFFFF",
        border:  "rgba(17,17,17,0.08)",
      },
      fontFamily: {
        sans:  ["var(--font-jakarta)", "'Plus Jakarta Sans'", "sans-serif"],
        serif: ["var(--font-fraunces)", "Fraunces", "serif"],
      },
      maxWidth: {
        layout:  "1280px",
        content: "1440px",
      },
      screens: {
        "3xl": "1600px",
      },
    },
  },
  plugins: [],
};
export default config;
