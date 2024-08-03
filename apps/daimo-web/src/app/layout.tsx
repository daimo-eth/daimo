import type { Metadata } from "next";

import "@rainbow-me/rainbowkit/styles.css";
import { neueMontreal } from "../fonts/font";
import "./globals.css";
import { getAbsoluteUrl } from "../utils/getAbsoluteUrl";

import { getI18N } from "../i18n";
import { headers } from "next/headers";

export function generateMetadata(): Metadata {
  const i18n = getI18N(headers().get("accept-language"));
  const i18 = i18n.app.layout;

  return {
    metadataBase: new URL(getAbsoluteUrl("/")),
    title: "Daimo",
    description: i18.metadata.description(),
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
