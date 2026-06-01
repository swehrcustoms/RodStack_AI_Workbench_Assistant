/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgba(56,189,248,0.16), 0 20px 40px rgba(2,6,23,0.6)",
      },
    },
  },
  plugins: [],
};
