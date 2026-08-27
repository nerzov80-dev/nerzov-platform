/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e293b",
        accent: "#4f46e5",

        background: "#ffffff",
        surface: "#f8fafc",

        text: "#0f172a",
        muted: "#64748b",

        border: {
          DEFAULT: "#e2e8f0",
          default: "#e2e8f0",
        },

        success: "#16a34a",
        danger: "#dc2626",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
