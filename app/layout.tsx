import type { Metadata } from "next";
import "./globals.css";
import "./login/login.css";
import "./brand.css";

export const metadata: Metadata = {
  title: "SPPD · Human Capital",
  description: "Ruang kerja perjalanan dinas dan permintaan uang Human Capital.",
  icons: {
    icon: "/bank-kalsel-logo.png",
    shortcut: "/bank-kalsel-logo.png",
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
