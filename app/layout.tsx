import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPPD · Human Capital",
  description: "Ruang kerja perjalanan dinas dan permintaan uang Human Capital.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
