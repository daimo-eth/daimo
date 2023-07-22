import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Daimo",
  description: "Experimental stablecoin wallet",
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
        <main className="max-w-md mx-auto px-4">{children}</main>
      </body>
    </html>
  );
}
