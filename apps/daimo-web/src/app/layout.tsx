import type { Metadata } from "next";
import { headers } from "next/headers";

import "@rainbow-me/rainbowkit/styles.css";
import { neueMontreal } from "../fonts/font";
import { getI18N } from "../i18n";
import { getAbsoluteUrl } from "../utils/getAbsoluteUrl";
import "./globals.css";

export function generateMetadata(): Metadata {
  const i18n = getI18N(headers().get("accept-language"));
  return {
    metadataBase: new URL(getAbsoluteUrl("/")),
    title: i18n.meta.title(),
    description: i18n.meta.description(),
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const i18n = getI18N(headers().get("accept-language"));
  return (
    <html lang={i18n.lang} className={`${neueMontreal.variable} font-sans`}>
      <body>{children}</body>
    </html>
  );
}
