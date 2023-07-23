import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daimo Explorer",
  description: "View activity on Ethereum",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="max-w-lg mx-auto px-4">{children}</body>
    </html>
  );
}
