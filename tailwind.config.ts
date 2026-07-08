import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aqua: "#14B8A6",
        sun: "#FACC15",
        rose: "#EC4899",
        ink: "#111827"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
