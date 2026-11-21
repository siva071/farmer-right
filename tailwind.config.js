/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F8F3",
        surface: "#FFFFFF",
        outline: "#E3E6DF",
        primary: "#1B5E20",
        "primary-container": "#E3F0E3",
        ink: "#1A1C1A",
        muted: "#475569",
        amber: "#92400E",
        "amber-bg": "#FEF3C7",
        success: "#15803D",
        "success-bg": "#DCFCE7",
        error: "#B91C1C",
        "error-bg": "#FEE2E2",
        notel: "#57534E",
        "notel-bg": "#F5F5F4",
        info: "#1D4ED8",
        "info-bg": "#DBEAFE",
      },
      fontFamily: {
        sans: ["Noto Sans Telugu", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
