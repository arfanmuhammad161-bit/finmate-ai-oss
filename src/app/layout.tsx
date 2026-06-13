import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinMate AI | Premium Personal Finance Assistant",
  description: "Kelola Keuangan Dengan AI. Catat transaksi lewat chat, voice, atau foto struk. Biarkan AI mengelola sisanya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${inter.variable} antialiased font-sans bg-background text-text-main`}
      >
        {children}
      </body>
    </html>
  );
}
