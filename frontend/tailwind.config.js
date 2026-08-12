export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        medical: {
          blue: "#2563eb",
          cyan: "#06b6d4",
          pink: "#ec4899",
          rose: "#f43f5e",
          ink: "#0f172a"
        }
      },
      boxShadow: {
        glass: "0 24px 80px rgba(15, 23, 42, 0.14)"
      }
    }
  },
  plugins: []
};
