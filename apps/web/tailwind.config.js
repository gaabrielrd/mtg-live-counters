/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#06070a",
        ink: "#ffffff",
        ember: "#f27d4d",
        moss: "#16211f",
        gold: "#d8b36a",
        paper: "#0d1015"
      },
      boxShadow: {
        card: "0 30px 90px rgba(0, 0, 0, 0.35)"
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
