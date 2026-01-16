/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",               // Include main HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Include all JS/TS/React/Vue/Svelte files in src
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E40AF", // Example custom color
        secondary: "#9333EA",
      },
    },
  },
  plugins: [],
};
