/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Naira Green. Green and gold: money, and Nigerian without waving a
        // flag about it. Neutrals carry a slight green bias so they read as
        // chosen rather than inherited.
        ground: "#EFF4F1",
        ink: "#0E1A15",
        muted: "#5A6862",
        faint: "#7E8C85",
        line: "#E7EDE9",
        accent: "#0B6B4F",
        accent2: "#0E8560",
        accentSoft: "#E3EFE9",
        gold: "#C99A27",
        // Status colours live here so no screen has to invent its own. Every
        // pending badge in the app is the same amber, because it is this one.
        waitingBg: "#FBF0DC", waitingInk: "#8A5B10",
        okBg: "#DCEFE5", okInk: "#0B6B4F",
        noBg: "#FBE4E0", noInk: "#A32E1B",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-serif)", "Georgia", "serif"],
      },
      fontSize: {
        // The scale. Six steps, each with a job, and nothing off it.
        micro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.09em" }], // 11 — caps labels
        tiny: ["0.8125rem", { lineHeight: "1.15rem" }],                        // 13 — help text
        base: ["0.9375rem", { lineHeight: "1.5rem" }],                         // 15 — body
        lead: ["1.0625rem", { lineHeight: "1.5rem" }],                         // 17 — card titles
        title: ["1.3125rem", { lineHeight: "1.65rem", letterSpacing: "-0.01em" }], // 21
        figure: ["1.6875rem", { lineHeight: "1.9rem", letterSpacing: "-0.02em" }], // 27 — money
      },
      boxShadow: { card: "0 1px 3px rgba(11,40,30,0.05), 0 8px 24px -10px rgba(11,40,30,0.10)" },
    },
  },
  plugins: [],
};
