"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthShell } from '@/components/layout/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email) {
      setError('Silakan masukkan alamat email Anda.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell backHref="/login" backLabel="Kembali ke halaman masuk">
        <div className="bg-white rounded-3xl border border-border shadow-xl shadow-primary-100/40 p-6 sm:p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-md">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight mb-2">Cek email Anda</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-5">
            Kami sudah kirim link untuk reset kata sandi ke <strong className="text-text-main">{email}</strong>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left">
            💡 Cek folder <strong>Spam/Promosi</strong> kalau emailnya tidak muncul dalam 2 menit.
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell backHref="/login" backLabel="Kembali ke halaman masuk">
      <div className="bg-white rounded-3xl border border-border shadow-xl shadow-primary-100/40 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">Lupa kata sandi?</h2>
          <p className="text-sm text-text-muted mt-1">
            Masukkan email Anda dan kami kirim link untuk buat sandi baru.
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
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="email"
                placeholder="nama@email.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Mengirim...' : 'Kirim link reset'}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
