import type { Metadata } from "next";
import localFont from "next/font/local";

import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daimo",
  description: "Stablecoin payments app",
  icons: {
    icon: "/logo-web-favicon.png", // todo
  },
};

const neueMontreal = localFont({
  src: "../fonts/PPNeueMontreal-Book.otf",
  variable: "--font-neue-montreal",
});

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${neueMontreal.className}`}>
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;
