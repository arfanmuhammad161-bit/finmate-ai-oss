"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Sparkles, Check, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const goals = [
  "Mengontrol pengeluaran",
  "Menabung",
  "Mengatur budget",
  "Menganalisis keuangan pribadi"
];

export default function RegisterPage() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!fullName || !email || !password) {
      setError('Semua field wajib diisi.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            financial_goal: selectedGoal || 'Mengontrol pengeluaran'
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Cek Email Anda!</h2>
          <p className="text-text-muted mb-6">
            Kami telah mengirim link verifikasi ke <strong>{email}</strong>. Klik link tersebut untuk mengaktifkan akun dan mulai trial 14 hari gratis Anda.
          </p>
          <Link href="/login">
            <Button variant="gradient" className="w-full h-12">Kembali ke Halaman Masuk</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-primary-200 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] rounded-full bg-secondary-200 blur-[100px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 text-white shadow-lg">
            <span className="text-2xl font-bold">F</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-gradient">FinMate AI</span>
        </div>

        <Card variant="glass" className="border-white/50 bg-white/60 shadow-xl backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold">Mulai Perjalanan Anda</CardTitle>
            <CardDescription>Daftar sekarang dan nikmati akses penuh AI Financial Assistant</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">Nama Lengkap</label>
                  <Input 
                    placeholder="Arfan S" className="bg-white/80"
                    value={fullName} onChange={e => setFullName(e.target.value)} required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">Email</label>
                  <Input 
                    type="email" placeholder="nama@email.com" className="bg-white/80"
                    value={email} onChange={e => setEmail(e.target.value)} required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main">Password</label>
                  <Input 
                    type="password" placeholder="Min. 6 karakter" className="bg-white/80"
                    value={password} onChange={e => setPassword(e.target.value)} required 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-text-main">Apa tujuan utama keuangan Anda?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <div
                      key={goal}
                      onClick={() => setSelectedGoal(goal)}
                      className={cn(
                        "cursor-pointer rounded-xl border p-3 text-sm font-medium transition-all hover:border-primary-500",
                        selectedGoal === goal 
                          ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm" 
                          : "border-border bg-white/80 text-text-muted hover:bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        {goal}
                        {selectedGoal === goal && <Check className="h-4 w-4 text-primary-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-medium mt-2" variant="gradient" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {loading ? 'Mendaftar...' : 'Mulai Gratis 14 Hari'}
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <p className="text-sm text-text-muted">
                Sudah punya akun?{' '}
                <Link href="/login" className="font-semibold text-primary-600 hover:underline">Masuk di sini</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
