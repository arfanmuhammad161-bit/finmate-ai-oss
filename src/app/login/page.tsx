"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Bot, Sparkles, ShieldCheck, PieChart, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setError(error.message === 'Invalid login credentials' 
          ? 'Email atau password salah. Coba lagi.' 
          : error.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left Column: Hero Section */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-primary-600 via-secondary-500 to-accent-500 p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white blur-[100px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-white blur-[120px]" />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <span className="text-2xl font-bold">F</span>
          </div>
          <span className="text-2xl font-bold tracking-tight">FinMate AI</span>
        </div>

        <div className="relative z-10 max-w-lg mt-12">
          <h1 className="text-5xl font-bold leading-tight mb-6">Kelola Keuangan Dengan AI</h1>
          <p className="text-xl text-primary-50 mb-12 leading-relaxed">
            Catat transaksi lewat chat, voice, atau foto struk. Biarkan AI mengelola sisanya.
          </p>
          <div className="space-y-6">
            {[
              { icon: Bot, title: "AI Financial Assistant", desc: "Chat seperti dengan teman untuk kelola uang" },
              { icon: PieChart, title: "Smart Insights", desc: "Analisis pengeluaran dan saran otomatis" },
              { icon: ShieldCheck, title: "Aman & Terpercaya", desc: "Data dienkripsi dan dijamin kerahasiaannya" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-primary-100 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-primary-100 text-sm mt-12">© 2026 FinMate AI. All rights reserved.</div>
      </div>

      {/* Right Column: Login Card */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-lg">
              <span className="text-3xl font-bold">F</span>
            </div>
            <span className="text-3xl font-bold tracking-tight text-gradient">FinMate AI</span>
          </div>

          <Card variant="glass" className="border-white/50 bg-white/60 shadow-xl backdrop-blur-xl">
            <CardHeader className="space-y-2 text-center pb-8">
              <CardTitle className="text-3xl font-bold tracking-tight">Selamat Datang</CardTitle>
              <CardDescription className="text-base">Masuk ke akun FinMate AI Anda</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-main">Email</label>
                    <Input 
                      id="email" type="email" placeholder="nama@email.com" 
                      className="bg-white/80" value={email}
                      onChange={e => setEmail(e.target.value)} required 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-main">Password</label>
                      <Link href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                        Lupa Sandi?
                      </Link>
                    </div>
                    <Input 
                      id="password" type="password" placeholder="••••••••" 
                      className="bg-white/80" value={password}
                      onChange={e => setPassword(e.target.value)} required 
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-medium" variant="gradient" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {loading ? 'Masuk...' : 'Masuk'}
                </Button>


              </CardContent>
              <CardFooter className="flex justify-center pb-8">
                <p className="text-sm text-text-muted">
                  Belum punya akun?{' '}
                  <Link href="/register" className="font-semibold text-primary-600 hover:underline">Daftar Gratis 14 Hari</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
