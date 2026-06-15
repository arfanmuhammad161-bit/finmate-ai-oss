import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://finmate-ai-brown.vercel.app"),
  title: {
    default: "FinMate AI — Catat keuangan semudah chat WA",
    template: "%s · FinMate AI",
  },
  description: "AI yang catat pengeluaran via Telegram, foto struk, atau voice note. Gratis 14 hari.",
  keywords: ["aplikasi keuangan", "catat pengeluaran", "ai keuangan", "telegram bot keuangan", "scan struk belanja", "asisten finansial", "finmate"],
  authors: [{ name: "Muhammad Arfan" }],
  creator: "Muhammad Arfan",
  openGraph: {
    title: "FinMate AI — Catat keuangan semudah chat WA",
    description: "AI yang catat pengeluaran via Telegram, foto struk, atau voice note. Gratis 14 hari.",
    url: "https://finmate-ai-brown.vercel.app",
    siteName: "FinMate AI",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FinMate AI — Catat keuangan semudah chat WA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinMate AI — Catat keuangan semudah chat WA",
    description: "AI yang catat pengeluaran via Telegram, foto struk, atau voice note. Gratis 14 hari.",
    creator: "@arfanmuhammad",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
