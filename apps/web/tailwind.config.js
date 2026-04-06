/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f5efe2",
        ink: "#1e1f1c",
        ember: "#a84622",
        moss: "#2f4f3b",
        gold: "#d0a95d",
        paper: "#fffaf0"
      },
      boxShadow: {
        card: "0 18px 50px rgba(49, 32, 19, 0.14)"
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
