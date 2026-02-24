import type { Config } from "tailwindcss";
// @ts-expect-error - daisyui does not have types
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
};

export default config;
