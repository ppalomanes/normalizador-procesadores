module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg: {
            primary: "#121212",
            secondary: "#1e1e1e",
            tertiary: "#2d2d2d",
          },
          text: {
            primary: "#f3f4f6",
            secondary: "#d1d5db",
            muted: "#9ca3af",
          },
          border: {
            DEFAULT: "#3f3f46",
            dark: "#52525b",
            light: "#27272a",
          },
          accent: {
            blue: "#3b82f6",
            green: "#10b981",
            red: "#ef4444",
            yellow: "#f59e0b",
            purple: "#8b5cf6",
            indigo: "#6366f1",
          },
        },
      },
      boxShadow: {
        "dark-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.7)",
        "dark-md":
          "0 4px 6px -1px rgba(0, 0, 0, 0.7), 0 2px 4px -1px rgba(0, 0, 0, 0.7)",
        "dark-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -2px rgba(0, 0, 0, 0.7)",
        "dark-xl":
          "0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.7)",
      },
    },
  },
  plugins: [],
};
