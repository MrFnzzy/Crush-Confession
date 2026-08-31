import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B1029",
        inkRaised: "#2A1B3D",
        inkLight: "#3A2650",
        paper: "#FAF3E4",
        paperDim: "#EFE2C8",
        rose: "#E2536B",
        roseDeep: "#C43857",
        gold: "#D9A441",
        slateInk: "#5B4A57",
      },
      fontFamily: {
        display: ["var(--font-fraunces)"],
        body: ["var(--font-manrope)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        note: "2px 16px 2px 16px",
      },
      boxShadow: {
        note: "0 10px 0 rgba(0,0,0,0.22)",
        noteLg: "0 14px 0 rgba(0,0,0,0.28)",
        glow: "0 0 0 1px rgba(217,164,65,0.25), 0 20px 60px -20px rgba(226,83,107,0.45)",
      },
      screens: {
        xs: "420px",
      },
    },
  },
  plugins: [],
};
export default config;
