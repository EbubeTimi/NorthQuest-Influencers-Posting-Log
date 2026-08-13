/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: { colors: { ink: "#161221", accent: "#6D4CE0", accent2: "#8A6FF0" }, fontFamily: { display: ["Georgia", "serif"] }, boxShadow: { card: "0 1px 3px rgba(20,10,50,0.06), 0 8px 24px -8px rgba(20,10,50,0.10)" } } }, plugins: []
};
