import localFont from "next/font/local";

export const neueMontreal = localFont({
  src: [
    {
      path: "./PPNeueMontreal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./PPNeueMontreal-Book.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "./PPNeueMontreal-Book.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "./PPNeueMontreal-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./PPNeueMontreal-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./PPNeueMontreal-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-neue-montreal",
});
