"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Cek Email Anda</h2>
          <p className="text-text-muted mb-6">
            Kami telah mengirimkan link untuk mereset kata sandi ke <strong>{email}</strong>.
          </p>
          <Link href="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Kembali ke Halaman Login
          </Link>
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
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-text-muted hover:text-text-main mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Login
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-main mb-2">Lupa Kata Sandi?</h1>
            <p className="text-text-muted text-sm">
              Masukkan email Anda dan kami akan mengirimkan instruksi untuk mereset kata sandi Anda.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main">Alamat Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="email" 
                  placeholder="nama@email.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full py-6 text-base" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Link Reset Sandi'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
