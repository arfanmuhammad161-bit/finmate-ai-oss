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
  description: "Asisten keuangan AI yang catat pengeluaran lewat chat Telegram, foto struk, atau voice note. Gratis 14 hari, tanpa kartu kredit.",
  keywords: ["aplikasi keuangan", "catat pengeluaran", "ai keuangan", "telegram bot keuangan", "scan struk belanja", "asisten finansial", "finmate"],
  authors: [{ name: "Muhammad Arfan" }],
  creator: "Muhammad Arfan",
  openGraph: {
    title: "FinMate AI — Catat keuangan semudah chat WA",
    description: "Asisten keuangan AI yang catat pengeluaran lewat chat Telegram, foto struk, atau voice note. Gratis 14 hari, tanpa kartu kredit.",
    url: "https://finmate-ai-brown.vercel.app",
    siteName: "FinMate AI",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinMate AI — Catat keuangan semudah chat WA",
    description: "Asisten keuangan AI gratis 14 hari. Catat pengeluaran lewat Telegram, foto struk, atau voice note.",
    creator: "@arfanmuhammad",
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
