"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  Bot, PieChart, ShieldCheck, Sparkles, CheckCircle2, 
  Zap, ArrowRight, Star, Menu, X, MessageSquare, Camera, Mic
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: "Chat & Voice Input",
    desc: "Catat transaksi cukup dengan mengetik atau merekam suara via Telegram. AI langsung mengerti."
  },
  {
    icon: Camera,
    title: "Scan Struk Foto",
    desc: "Upload foto struk belanja, AI akan membaca dan mencatat semua transaksi secara otomatis."
  },
  {
    icon: Bot,
    title: "AI Financial Advisor",
    desc: "Tanya apa saja tentang keuangan Anda. AI memberikan jawaban berdasarkan data nyata Anda."
  },
  {
    icon: PieChart,
    title: "Laporan Cerdas",
    desc: "Laporan keuangan bulanan dengan grafik, insight AI, dan saran hemat yang dipersonalisasi."
  },
  {
    icon: ShieldCheck,
    title: "Aman & Terenkripsi",
    desc: "Data keuangan Anda dienkripsi end-to-end dan hanya bisa diakses oleh Anda sendiri."
  },
  {
    icon: Zap,
    title: "Real-time Update",
    desc: "Setiap transaksi langsung tersinkronisasi antara Telegram Bot dan Web App Anda."
  },
];

const testimonials = [
  { name: "Budi S.", role: "Freelancer", text: "Sejak pakai FinMate AI, saya akhirnya tahu ke mana uang saya pergi. Chat bot-nya super mudah dipakai!", rating: 5 },
  { name: "Siti R.", role: "Karyawan", text: "Laporan PDF-nya sangat rapi. Saya pakai buat evaluasi keuangan bulanan. Fitur scan struk paling keren!", rating: 5 },
  { name: "Ahmad F.", role: "Wirausaha", text: "Admin bot kontrolnya luar biasa. Bisa pantau bisnis dari HP saja. Recommended banget!", rating: 5 },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-text-main overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold text-lg">
              F
            </div>
            <span className="text-xl font-bold text-gradient">FinMate AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">Fitur</a>
            <a href="#pricing" className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">Harga</a>
            <a href="#testimonials" className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">Testimoni</a>
            <Link href="/login">
              <Button variant="outline" size="sm">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button variant="gradient" size="sm">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Mulai Gratis 14 Hari
              </Button>
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-border p-4 space-y-3">
            <a href="#features" className="block text-sm font-medium py-2">Fitur</a>
            <a href="#pricing" className="block text-sm font-medium py-2">Harga</a>
            <a href="#testimonials" className="block text-sm font-medium py-2">Testimoni</a>
            <Link href="/login" className="block"><Button variant="outline" className="w-full">Masuk</Button></Link>
            <Link href="/register" className="block"><Button variant="gradient" className="w-full">Mulai Gratis</Button></Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* BG Gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[5%] right-[10%] w-[40%] h-[40%] rounded-full bg-primary-100 blur-[100px] opacity-60" />
          <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[40%] rounded-full bg-secondary-100 blur-[100px] opacity-60" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-2 rounded-full border border-primary-100 mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Personal Finance
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Kelola Keuangan
            <br />
            <span className="text-gradient">Dengan AI</span>
          </h1>

          <p className="text-xl md:text-2xl text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            Catat transaksi lewat <strong className="text-text-main">chat</strong>, <strong className="text-text-main">voice</strong>, atau <strong className="text-text-main">foto struk</strong>. Biarkan AI mengelola, menganalisis, dan memberikan saran keuangan Anda.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/register">
              <Button variant="gradient" size="lg" className="text-base shadow-xl shadow-primary-200 hover:shadow-primary-300">
                Mulai Gratis 14 Hari
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base bg-white">
                Lihat Demo
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['bg-blue-400','bg-purple-400','bg-pink-400','bg-green-400'].map((c,i) => (
                  <div key={i} className={`h-8 w-8 rounded-full ${c} border-2 border-white`} />
                ))}
              </div>
              <span><strong className="text-text-main">1,200+</strong> user aktif</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
              <span className="ml-1"><strong className="text-text-main">4.9/5</strong> rating</span>
            </div>
            <div>
              <strong className="text-text-main">Gratis 14 hari</strong>, tidak perlu kartu kredit
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-main mb-4">Semua yang Anda Butuhkan</h2>
            <p className="text-xl text-text-muted max-w-xl mx-auto">Satu platform lengkap untuk mengelola keuangan pribadi Anda secara cerdas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 duration-200">
                <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-text-main mb-2">{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-main mb-4">Harga yang Jujur</h2>
            <p className="text-xl text-text-muted">Mulai gratis, upgrade kapanpun siap.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Free Trial */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-border">
              <h3 className="font-bold text-lg text-text-main mb-1">Trial Gratis</h3>
              <div className="text-3xl font-bold text-text-main my-4">Rp 0<span className="text-base text-text-muted font-normal">/14 hari</span></div>
              <p className="text-sm text-text-muted mb-4">Tidak perlu kartu kredit. Semua fitur terbuka.</p>
              <ul className="space-y-2 text-sm text-text-muted mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Semua fitur AI</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Telegram Bot</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Web Dashboard</li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">Mulai Trial</Button>
              </Link>
            </div>

            {/* Monthly — Featured */}
            <div className="bg-gradient-to-b from-primary-600 to-secondary-600 rounded-2xl p-6 text-white shadow-2xl shadow-primary-200 scale-105">
              <div className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full w-fit mb-3">PALING POPULER</div>
              <h3 className="font-bold text-lg mb-1">Paket Bulanan</h3>
              <div className="text-3xl font-bold my-4">Rp 29.000<span className="text-base text-primary-100 font-normal">/bulan</span></div>
              <p className="text-sm text-primary-100 mb-4">Ideal untuk mulai membiasakan diri.</p>
              <ul className="space-y-2 text-sm text-primary-50 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-white" /> Semua fitur AI</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-white" /> Laporan PDF & Google Doc</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-white" /> Telegram Bot 24/7</li>
              </ul>
              <Link href="/register">
                <Button className="w-full bg-white text-primary-700 hover:bg-primary-50 font-semibold">
                  Pilih Paket Ini
                </Button>
              </Link>
            </div>

            {/* Yearly */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-border">
              <h3 className="font-bold text-lg text-text-main mb-1">Paket Tahunan</h3>
              <div className="text-3xl font-bold text-text-main my-4">Rp 249.000<span className="text-base text-text-muted font-normal">/tahun</span></div>
              <div className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit mb-4">Hemat 28%</div>
              <ul className="space-y-2 text-sm text-text-muted mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Semua fitur Bulanan</li>
                <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Prioritas support</li>
                <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Analisis lebih mendalam</li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">Pilih Paket Ini</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-main mb-4">Dipercaya Ribuan Pengguna</h2>
            <p className="text-xl text-text-muted">Lihat apa kata mereka tentang FinMate AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                <div className="flex mb-3">
                  {Array.from({length: t.rating}).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-text-muted italic mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-text-main">{t.name}</p>
                    <p className="text-sm text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-secondary-500 to-accent-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-[30%] w-[40%] h-[60%] rounded-full bg-white blur-[100px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Siap Kelola Keuangan Lebih Cerdas?</h2>
          <p className="text-xl text-primary-100 mb-10">Bergabung dengan 1.200+ pengguna yang sudah mempercayakan keuangan mereka ke FinMate AI.</p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 font-bold text-base shadow-xl">
              Mulai Gratis 14 Hari Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-primary-200 text-sm mt-4">Tidak perlu kartu kredit • Batalkan kapanpun</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold">F</div>
              <span className="text-lg font-bold text-gradient">FinMate AI</span>
            </div>
            <p className="text-sm text-text-muted">© 2026 FinMate AI. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-text-muted">
              <a href="#" className="hover:text-text-main">Privacy</a>
              <a href="#" className="hover:text-text-main">Terms</a>
              <a href="#" className="hover:text-text-main">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
