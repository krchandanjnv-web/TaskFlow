import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        coral:   { DEFAULT: "#FF8A73", bg: "#FFE8E3", text: "#C44B30", deep: "#7D2A19" },
        violet:  { DEFAULT: "#9B84F7", bg: "#EDE8FF", text: "#5B3FBE", deep: "#2E1C7A" },
        sage:    { DEFAULT: "#5BC98A", bg: "#E3F5EB", text: "#267A4B", deep: "#123D25" },
        sky:     { DEFAULT: "#5AADEE", bg: "#E0F1FF", text: "#1A6EA8", deep: "#0A3455" },
        amber:   { DEFAULT: "#F5B942", bg: "#FFF3D6", text: "#9A6A00", deep: "#4D3500" },
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease both",
        "slide-in": "slideIn 0.25s ease both",
      },
      keyframes: {
        fadeUp:  { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideIn: { from: { opacity: "0", transform: "scale(0.96)" },      to: { opacity: "1", transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};

export default config;
