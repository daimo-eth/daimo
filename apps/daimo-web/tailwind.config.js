/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      primary: "#007aff",
      primaryLight: "#2888f7",
      white: "#ffffff",
      ivory: "#fafafa",
      ivoryDark: "#f2f2f2",
      grayLight: "#e2e2e2",
      grayMid: "#717171",
      midnight: "#262626",
    },
  },
  plugins: [],
};
