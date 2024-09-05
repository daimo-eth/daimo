import type { Metadata } from "next";
import { headers } from "next/headers";

import { neueMontreal } from "../fonts/font";
import { getI18N } from "../i18n";
import { I18NProvider } from "../i18n/context";
import { getAbsoluteUrl } from "../utils/getAbsoluteUrl";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

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
      <body>
        <I18NProvider lang={i18n.lang}>{children}</I18NProvider>
      </body>
    </html>
  );
}
