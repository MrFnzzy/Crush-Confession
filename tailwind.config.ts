import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B1B2F",
        inkLight: "#2A2A45",
        paper: "#FBF6EC",
        paperDim: "#F1E9D8",
        rose: "#E85D75",
        roseDeep: "#C7415C",
        gold: "#D9A441",
        slateInk: "#4A4A5A",
      },
      fontFamily: {
        display: ["var(--font-fraunces)"],
        body: ["var(--font-inter)"],
      },
      borderRadius: {
        note: "2px 14px 2px 14px",
      },
    },
  },
  plugins: [],
};
export default config;
