"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Bot, ShieldCheck, MessageSquare, ArrowLeft } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
  /** Show back link to landing/login at top. */
  backHref?: string;
  backLabel?: string;
  /** Optional override for the highlight headline on the hero panel. */
  heroTitle?: string;
  heroSubtitle?: string;
}

/**
 * Shared visual frame for /login /register /forgot-password /reset-password.
 * Mobile: single column, brand at top, form below.
 * Desktop (lg+): split — gradient hero left (4/12), form right (8/12 wider, 5/12 with hero).
 */
export function AuthShell({
  children,
  backHref,
  backLabel,
  heroTitle = "Catat keuangan semudah chat WA.",
  heroSubtitle = "Ketik bebas seperti \"kopi 18rb\" — AI yang catat, kategori, dan kasih insight.",
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-background relative overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[60%] h-[50%] rounded-full bg-primary-200/40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] rounded-full bg-secondary-200/40 blur-[120px]" />
      </div>

      {/* DESKTOP HERO (lg+) */}
      <div className="hidden lg:flex w-5/12 xl:w-1/2 flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 p-10 xl:p-12 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-secondary-400/30 blur-2xl" />

        <Link href="/landing" className="relative z-10 flex items-center gap-2.5 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 font-bold text-lg">
            F
          </div>
          <span className="text-lg font-bold tracking-tight">FinMate AI</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
            Early Access · Beta
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight mb-4">
            {heroTitle}
          </h1>
          <p className="text-base xl:text-lg text-primary-100 leading-relaxed mb-8">
            {heroSubtitle}
          </p>

          <div className="space-y-3">
            {[
              { icon: MessageSquare, text: "Chat di Telegram, AI catat otomatis" },
              { icon: Bot, text: "Tanya AI tentang kebiasaan keuanganmu" },
              { icon: ShieldCheck, text: "Data terenkripsi & open source" },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-primary-50">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-primary-200 text-xs">
          © 2026 FinMate AI · Built with care in Indonesia 🇮🇩
        </p>
      </div>

      {/* FORM COLUMN */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
            <Link href="/landing" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white font-bold text-lg shadow-md">
                F
              </div>
              <span className="text-xl font-bold text-gradient">FinMate AI</span>
            </Link>
          </div>

          {/* Optional back link */}
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel || "Kembali"}
            </Link>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
