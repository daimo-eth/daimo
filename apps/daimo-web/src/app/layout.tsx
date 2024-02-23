import type { Metadata } from "next";
import localFont from "next/font/local";

import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daimo",
  description: "Stablecoin payments app",
  icons: {
    icon: "/logo-web-favicon.png",
  },
};

const neueMontreal = localFont({
  src: [
    {
      path: "../fonts/PPNeueMontreal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontreal-Book.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontreal-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontreal-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/PPNeueMontreal-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-neue-montreal",
});

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${neueMontreal.variable} font-sans`}>
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;
