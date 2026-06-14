"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Bot, PieChart, ShieldCheck, Sparkles, CheckCircle2,
  Zap, ArrowRight, Menu, X, MessageSquare, Camera, Mic,
  Receipt, TrendingUp, Coffee, Code2, Send, Smartphone
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: "Chat seperti ngobrol biasa",
    desc: "Ketik \"kopi 18rb\" di Telegram, AI yang catat. Tidak perlu buka form atau pilih kategori manual.",
    color: "from-primary-500 to-primary-600",
    bg: "bg-primary-50",
    tx: "text-primary-600",
  },
  {
    icon: Camera,
    title: "Foto struk → otomatis tercatat",
    desc: "Habis belanja? Jepret struknya, AI baca semua item dan jumlahnya. Hemat waktu, no typo.",
    color: "from-secondary-500 to-secondary-600",
    bg: "bg-secondary-50",
    tx: "text-secondary-600",
  },
  {
    icon: Bot,
    title: "Asisten AI yang paham keuanganmu",
    desc: "Tanya \"bulan ini boros di mana?\" atau \"berapa tabungan saya?\" — AI jawab pakai data nyata.",
    color: "from-accent-500 to-accent-600",
    bg: "bg-accent-50",
    tx: "text-accent-600",
  },
  {
    icon: PieChart,
    title: "Laporan yang gampang dibaca",
    desc: "Bukan tabel rumit. Grafik bersih, insight singkat, dan rekomendasi yang bisa langsung dipraktikkan.",
    color: "from-orange-500 to-amber-500",
    bg: "bg-orange-50",
    tx: "text-orange-600",
  },
  {
    icon: ShieldCheck,
    title: "Datamu aman & privat",
    desc: "Pakai Supabase dengan Row Level Security — datamu hanya bisa diakses akunmu sendiri, titik.",
    color: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    tx: "text-emerald-600",
  },
  {
    icon: Zap,
    title: "Real-time di mana saja",
    desc: "Catat di Telegram, langsung muncul di web. Catat di web, ringkasan dikirim ke Telegram tiap pagi.",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    tx: "text-rose-600",
  },
];

const howItWorks = [
  { step: "1", title: "Daftar dengan email", desc: "Cuma butuh 30 detik. Tidak perlu kartu kredit, tidak ada formulir panjang." },
  { step: "2", title: "Hubungkan Telegram Bot", desc: "Klik tombol di pengaturan, dapatkan kode unik, paste ke bot. Selesai dalam 1 menit." },
  { step: "3", title: "Mulai catat seperti ngobrol", desc: "Ketik bebas di Telegram. AI yang otomatis catat ke dashboard." },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-main overflow-x-hidden relative">
      {/* Global background gradient mesh (sudah ada di body, tapi reinforce di landing) */}
      <div className="fixed inset-0 pointer-events-none opacity-60">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-primary-200 blur-[120px] opacity-40" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[50%] rounded-full bg-secondary-200 blur-[120px] opacity-40" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white font-bold text-lg shadow-md">
              F
            </div>
            <span className="text-lg font-bold text-gradient">FinMate AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="text-sm font-medium text-text-muted hover:text-text-main px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Fitur</a>
            <a href="#how-it-works" className="text-sm font-medium text-text-muted hover:text-text-main px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cara Kerja</a>
            <a href="#pricing" className="text-sm font-medium text-text-muted hover:text-text-main px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Harga</a>
            <a href="#story" className="text-sm font-medium text-text-muted hover:text-text-main px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cerita</a>
            <div className="w-px h-5 bg-border mx-2" />
            <Link href="/login">
              <Button variant="ghost" size="sm">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button variant="gradient" size="sm" className="ml-1">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Mulai Gratis
              </Button>
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-border p-4 space-y-2">
            <a href="#features" className="block text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Fitur</a>
            <a href="#how-it-works" className="block text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Cara Kerja</a>
            <a href="#pricing" className="block text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Harga</a>
            <a href="#story" className="block text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Cerita</a>
            <div className="h-px bg-border my-2" />
            <Link href="/login" className="block" onClick={() => setMenuOpen(false)}>
              <Button variant="outline" className="w-full">Masuk</Button>
            </Link>
            <Link href="/register" className="block" onClick={() => setMenuOpen(false)}>
              <Button variant="gradient" className="w-full">
                <Sparkles className="mr-1.5 h-3 w-3" />Mulai Gratis 14 Hari
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          {/* Honest "Early Access" badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-primary-100 text-primary-700 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm mb-6 sm:mb-8">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Early Access · Beta Terbuka
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] mb-5 sm:mb-6 tracking-tight">
            Catat keuangan
            <br />
            <span className="text-gradient">semudah chat WA.</span>
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-text-muted max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
            Ketik bebas di Telegram seperti{' '}
            <span className="font-mono bg-white border border-primary-100 text-primary-700 px-2 py-0.5 rounded-md text-sm sm:text-base">&quot;kopi 18rb&quot;</span>
            {' '}— AI yang catat, kategori, dan kasih insight. Bukan aplikasi keuangan rumit.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 sm:mb-14">
            <Link href="/register">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base shadow-xl shadow-primary-200/50 hover:shadow-primary-200">
                Coba gratis 14 hari
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base bg-white">
                Lihat cara kerjanya
              </Button>
            </a>
          </div>

          {/* Honest trust signals - no fake user counts */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-text-muted">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Tanpa kartu kredit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Data dienkripsi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Open Source</span>
            </div>
          </div>

          {/* Demo preview card */}
          <div className="mt-12 sm:mt-16 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl border border-border shadow-2xl shadow-primary-200/30 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white border-b border-border px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-xs text-text-muted font-mono">FinMate AI Dashboard</div>
              </div>
              <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 p-6 sm:p-8 text-left">
                <div className="text-primary-100 text-sm font-medium mb-1 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" />Saldo bulan ini
                </div>
                <div className="text-white text-3xl sm:text-5xl font-bold tracking-tight tabular-nums">
                  Rp 9.529.600
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white font-medium">
                  <TrendingUp className="h-3 w-3" /> Surplus bulan ini
                </div>
                <div className="mt-5 pt-5 border-t border-white/15 grid grid-cols-2 gap-4 text-white">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-primary-100/80 font-semibold">↓ Masuk</div>
                    <div className="text-base sm:text-lg font-bold tabular-nums">Rp 10.000.000</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-primary-100/80 font-semibold">↑ Keluar</div>
                    <div className="text-base sm:text-lg font-bold tabular-nums">Rp 470.400</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-secondary-50 text-secondary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Zap className="h-3 w-3" />Cara kerja
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-main mb-3 tracking-tight">Tiga langkah, beres.</h2>
            <p className="text-base sm:text-lg text-text-muted max-w-xl mx-auto">Tidak ada belajar fitur ribet. Yang penting Anda bisa catat dan AI yang urus sisanya.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {howItWorks.map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-6 border border-border card-depth">
                <div className="absolute -top-3 left-6 h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold flex items-center justify-center shadow-md">
                  {s.step}
                </div>
                <h3 className="font-bold text-base text-text-main mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="h-3 w-3" />Fitur
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-main mb-3 tracking-tight">Yang bikin FinMate beda.</h2>
            <p className="text-base sm:text-lg text-text-muted max-w-xl mx-auto">Bukan sekadar aplikasi catatan. Ini AI yang ngobrol dan paham keuanganmu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-border card-depth hover:-translate-y-1 transition-transform duration-200">
                  <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center mb-4", f.bg, f.tx)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-text-main mb-1.5">{f.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-accent-50 text-accent-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Coffee className="h-3 w-3" />Lebih murah dari kopi
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-main mb-3 tracking-tight">Harga jujur, no game.</h2>
            <p className="text-base sm:text-lg text-text-muted">Mulai gratis. Upgrade kalau merasa terbantu. Bisa pakai kupon promo dari kami.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:items-stretch">
            {/* Free Trial */}
            <div className="bg-white rounded-2xl p-6 border border-border card-depth flex flex-col">
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Gratis</div>
              <h3 className="font-bold text-xl text-text-main mb-1">Trial</h3>
              <p className="text-sm text-text-muted mb-4">14 hari, semua fitur AI terbuka.</p>
              <div className="text-3xl font-bold text-text-main mb-1 tabular-nums">Rp 0</div>
              <div className="text-xs text-text-muted mb-6">14 hari trial</div>
              <ul className="space-y-2.5 text-sm text-text-muted mb-6 flex-1">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Semua fitur AI</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Telegram Bot 24/7</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Web dashboard</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Tanpa kartu kredit</li>
              </ul>
              <Link href="/register"><Button variant="outline" className="w-full">Mulai gratis</Button></Link>
            </div>

            {/* Monthly — Featured */}
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 rounded-2xl p-6 text-white shadow-2xl shadow-primary-300/40 md:scale-105 md:-my-2 flex flex-col overflow-hidden">
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit mb-2 inline-flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />Paling populer
                </div>
                <h3 className="font-bold text-xl mb-1">Bulanan</h3>
                <p className="text-sm text-primary-100 mb-4">Cocok buat mulai membiasakan diri.</p>
                <div className="text-3xl font-bold mb-1 tabular-nums">Rp 29.000</div>
                <div className="text-xs text-primary-100 mb-6">/bulan, bisa berhenti kapan saja</div>
                <ul className="space-y-2.5 text-sm text-primary-50 mb-6 flex-1">
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-white mt-0.5 shrink-0" /> Semua fitur Trial</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-white mt-0.5 shrink-0" /> Laporan PDF tak terbatas</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-white mt-0.5 shrink-0" /> Insight AI mingguan</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-white mt-0.5 shrink-0" /> Prioritas update fitur</li>
                </ul>
                <Link href="/register"><Button className="w-full bg-white text-primary-700 hover:bg-primary-50 font-semibold">Pilih Bulanan</Button></Link>
              </div>
            </div>

            {/* Yearly */}
            <div className="bg-white rounded-2xl p-6 border border-border card-depth flex flex-col">
              <div className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full w-fit mb-2">Hemat 28%</div>
              <h3 className="font-bold text-xl text-text-main mb-1">Tahunan</h3>
              <p className="text-sm text-text-muted mb-4">Setara Rp 20.750/bulan saja.</p>
              <div className="text-3xl font-bold text-text-main mb-1 tabular-nums">Rp 249.000</div>
              <div className="text-xs text-text-muted mb-6">/tahun, hemat Rp 99.000</div>
              <ul className="space-y-2.5 text-sm text-text-muted mb-6 flex-1">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Semua fitur Bulanan</li>
                <li className="flex items-start gap-2"><Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> Prioritas support</li>
                <li className="flex items-start gap-2"><Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> Analisis tahunan lengkap</li>
                <li className="flex items-start gap-2"><Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> Early access fitur baru</li>
              </ul>
              <Link href="/register"><Button variant="outline" className="w-full">Pilih Tahunan</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Story / Built in public */}
      <section id="story" className="py-16 sm:py-24 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-border card-depth p-6 sm:p-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
                <Coffee className="h-5 w-5" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Built in Public</div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-main mb-4 tracking-tight">Kenapa saya buat FinMate.</h2>
            <div className="space-y-4 text-text-muted leading-relaxed text-sm sm:text-base">
              <p>
                Saya selalu kesusahan catat pengeluaran. Pakai aplikasi keuangan rasanya seperti kerja kantoran — buka form, pilih kategori, ketik nominal, klik simpan. Capek di tengah hari.
              </p>
              <p>
                Tapi saya bisa chat ratusan kali sehari di WhatsApp tanpa lelah. Kenapa catat keuangan tidak bisa segampang itu?
              </p>
              <p>
                Jadi saya bangun <strong className="text-text-main">FinMate AI</strong>. Anda ketik bebas di Telegram, AI yang catat. Tidak ada form. Tidak ada belajar fitur. Cuma chat.
              </p>
              <p>
                Proyek ini <strong className="text-text-main">open source</strong> dan masih beta. Kalau Anda nyangkut bug atau punya ide, kasih tahu — saya kerjain langsung.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold shadow-sm">A</div>
                <div>
                  <p className="font-semibold text-text-main text-sm">Arfan Muhammad</p>
                  <p className="text-xs text-text-muted">Founder & Developer FinMate AI</p>
                </div>
              </div>
              <a
                href="https://github.com/arfanmuhammad161-bit/finmate-ai-oss"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-text-main bg-gray-50 hover:bg-gray-100 border border-border px-4 py-2 rounded-xl transition-colors"
              >
                <Code2 className="h-4 w-4" />
                Lihat source code
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 rounded-3xl p-8 sm:p-12 text-white text-center overflow-hidden shadow-2xl shadow-primary-300/40">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-secondary-400/30 blur-2xl" />
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight">Siap mulai catat tanpa drama?</h2>
              <p className="text-base sm:text-lg text-primary-100 mb-7 max-w-xl mx-auto">14 hari gratis, semua fitur terbuka. Tidak perlu kartu kredit, tidak ada langganan otomatis.</p>
              <Link href="/register">
                <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 font-bold text-base shadow-lg">
                  Daftar gratis sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-primary-200 text-xs mt-3">Bisa berhenti kapan saja · 30 detik daftar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white font-bold shadow-md">F</div>
              <span className="text-base font-bold text-gradient">FinMate AI</span>
            </div>
            <p className="text-xs text-text-muted text-center">© 2026 FinMate AI · Built with care in Indonesia 🇮🇩</p>
            <div className="flex gap-4 text-xs text-text-muted">
              <a href="https://github.com/arfanmuhammad161-bit/finmate-ai-oss" target="_blank" rel="noopener noreferrer" className="hover:text-text-main flex items-center gap-1">
                <Code2 className="h-3 w-3" />GitHub
              </a>
              <Link href="/login" className="hover:text-text-main">Masuk</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
