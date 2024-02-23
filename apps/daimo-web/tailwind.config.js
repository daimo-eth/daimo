/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      danger: "#f35369",
      yellow: "#FFDC62",
      success: "#0CA01B",
      primary: "#007aff",
      primaryLight: "#144B44",
      white: "#ffffff",
      ivory: "#fafafa",
      ivoryDark: "#f2f2f2",
      grayLight: "#D6D6D6",
      grayMid: "#717171",
      midnight: "#262626",
      black: "#000000",
      royalblue: "#022F61",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-neue-montreal)"],
      },
      backgroundImage: {
        "midnight-gradient":
          "linear-gradient(to bottom, #FFFFFF 30%, #14B174 50%, #111111 70%)",
      },
    },
  },
  plugins: [],
};
