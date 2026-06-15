"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthShell } from '@/components/layout/AuthShell';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionInvalid, setSessionInvalid] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Sesi tidak valid atau telah kedaluwarsa. Silakan ulangi proses lupa sandi.');
        setSessionInvalid(true);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell>
        <div className="bg-white rounded-3xl border border-border shadow-xl shadow-primary-100/40 p-6 sm:p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-md">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight mb-2">Kata sandi diperbarui</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Sandi Anda sudah diganti. Silakan masuk dengan sandi baru.
          </p>
          <Button variant="gradient" className="w-full h-11" onClick={() => router.push('/login')}>
            Ke halaman masuk
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell backHref="/login" backLabel="Kembali ke halaman masuk">
      <div className="bg-white rounded-3xl border border-border shadow-xl shadow-primary-100/40 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">Buat sandi baru</h2>
          <p className="text-sm text-text-muted mt-1">
            Masukkan kata sandi baru untuk akun Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Kata sandi baru</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Ulangi sandi</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="password"
                placeholder="Ulangi kata sandi"
                className="pl-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full h-11 text-base font-semibold mt-2" disabled={loading || sessionInvalid}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Menyimpan...' : 'Simpan sandi baru'}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
