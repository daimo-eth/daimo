import type { Metadata } from "next";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "Daimo",
  description: "Stablecoin payments app",
  icons: {
    icon: "/logo-web-favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
