"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if the user has a session, meaning they arrived via the recovery link successfully.
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Sesi tidak valid atau telah kedaluwarsa. Silakan ulangi proses lupa sandi.');
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
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Logout after resetting password so they can log in normally.
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
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Kata Sandi Berhasil Diubah!</h2>
          <p className="text-text-muted mb-6">
            Kata sandi Anda telah berhasil diperbarui. Silakan login kembali dengan kata sandi baru Anda.
          </p>
          <Button variant="gradient" className="w-full" onClick={() => router.push('/login')}>
            Ke Halaman Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-main mb-2">Buat Sandi Baru</h1>
            <p className="text-text-muted text-sm">
              Masukkan kata sandi baru untuk akun Anda.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main">Kata Sandi Baru</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="password" 
                  placeholder="Minimal 6 karakter" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main">Ulangi Kata Sandi Baru</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="password" 
                  placeholder="Ulangi kata sandi" 
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full py-6 text-base mt-2" disabled={loading || !!error.includes('Sesi tidak valid')}>
              {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
