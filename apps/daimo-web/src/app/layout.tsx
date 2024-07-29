import type { Metadata } from "next";

import "@rainbow-me/rainbowkit/styles.css";
import { neueMontreal } from "../fonts/font";
import "./globals.css";
import { getAbsoluteUrl } from "../utils/getAbsoluteUrl";

// TODO: adapt to i18n
export const metadata: Metadata = {
  metadataBase: new URL(getAbsoluteUrl("/")),
  title: "Daimo",
  description: "Stablecoin payments app",
  icons: {
    icon: "/logo-web-favicon.png",
  },
  openGraph: {
    images: [
      {
        url: "/logo-link-preview.png",
        alt: "Daimo",
        width: 128,
        height: 105,
      },
    ],
  },
  viewport: "width=device-width, initial-scale=1, minimum-scale=0.4",
};

// TODO: adapt to i18n
function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${neueMontreal.variable} font-sans`}>
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;
