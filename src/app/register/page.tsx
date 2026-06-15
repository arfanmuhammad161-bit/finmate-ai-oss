"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Sparkles, Check, Loader2, AlertCircle, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthShell } from '@/components/layout/AuthShell';

const goals = [
  "Kontrol pengeluaran",
  "Mulai menabung",
  "Atur anggaran bulanan",
  "Analisis keuangan pribadi",
];

export default function RegisterPage() {
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
      setError('Semua kolom wajib diisi.');
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
            financial_goal: selectedGoal || 'Kontrol pengeluaran',
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
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
      <AuthShell>
        <div className="bg-white rounded-3xl border border-border shadow-xl shadow-primary-100/40 p-6 sm:p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-md">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight mb-2">Cek email Anda</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Kami sudah kirim link verifikasi ke <strong className="text-text-main">{email}</strong>.
            Klik link itu untuk aktifkan akun & mulai trial gratis 14 hari.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left mb-5">
            💡 Cek folder <strong>Spam/Promosi</strong> kalau emailnya tidak muncul dalam 2 menit.
          </div>
          <Link href="/login">
            <Button variant="gradient" className="w-full h-11">Kembali ke halaman masuk</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="bg-white rounded-3xl border border-border shadow-xl shadow-primary-100/40 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">Daftar gratis</h2>
          <p className="text-sm text-text-muted mt-1">14 hari trial, tanpa kartu kredit.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Nama lengkap</label>
            <Input
              placeholder="Misal: Arfan Muhammad"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Email</label>
            <Input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Password</label>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tujuan utama Anda?</label>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((goal) => (
                <button
                  type="button"
                  key={goal}
                  onClick={() => setSelectedGoal(goal)}
                  className={cn(
                    "rounded-xl border p-2.5 text-xs font-medium transition-all text-left flex items-center justify-between gap-1",
                    selectedGoal === goal
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-border bg-white text-text-muted hover:border-primary-300 hover:bg-primary-50/30"
                  )}
                >
                  <span className="leading-tight">{goal}</span>
                  {selectedGoal === goal && <Check className="h-3.5 w-3.5 text-primary-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" variant="gradient" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? 'Mendaftarkan...' : 'Mulai gratis 14 hari'}
          </Button>

          <p className="text-[11px] text-text-muted text-center leading-relaxed">
            Dengan mendaftar, Anda setuju untuk catat keuangan dengan lebih sadar. ✨
          </p>
        </form>

        <div className="mt-5 pt-5 border-t border-border text-center">
          <p className="text-sm text-text-muted">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-primary-600 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
