import localFont from "next/font/local";

export const neueMontreal = localFont({
  src: [
    {
      path: "./PPNeueMontreal-Book.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "./PPNeueMontreal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./PPNeueMontreal-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./PPNeueMontreal-SemiBold.woff2",
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
