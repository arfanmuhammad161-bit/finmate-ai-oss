"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthShell } from '@/components/layout/AuthShell';

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
    <AuthShell>
      <div className="bg-white rounded-3xl border border-border shadow-xl shadow-primary-100/40 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">Selamat datang kembali</h2>
          <p className="text-sm text-text-muted mt-1">Masuk ke akun FinMate AI Anda.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                Lupa sandi?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" variant="gradient" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center">
          <p className="text-sm text-text-muted">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-primary-600 hover:underline">
              Daftar gratis
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
