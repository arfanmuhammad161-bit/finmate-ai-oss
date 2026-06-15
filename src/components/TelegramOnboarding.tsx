"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Bot, X, Check, Copy, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/Toast';

const DISMISS_KEY = 'finmate_tg_onboard_dismissed';

/**
 * Popup onboarding yang muncul otomatis setelah login KALAU user belum
 * menghubungkan Telegram. Bisa di-dismiss (disimpan di localStorage agar
 * tidak muncul terus dalam sesi yang sama).
 */
export function TelegramOnboarding() {
  const [show, setShow] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        // Jangan tampilkan kalau user sudah dismiss di sesi ini
        if (typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY)) {
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Admin tidak perlu dipaksa (opsional)
        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_id')
          .eq('id', user.id)
          .single();

        // Tampilkan HANYA kalau belum connect Telegram
        if (!profile?.telegram_id) {
          setVerificationCode(`FIN-${user.id.substring(0, 8).toUpperCase()}`);
          setShow(true);
        }
      } catch {
        // diam saja
      } finally {
        setLoading(false);
      }
    };
    // delay sedikit biar tidak ganggu render awal dashboard
    const t = setTimeout(check, 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    toast.success('Kode disalin! Tempel ke chat bot Telegram.');
  };

  if (loading || !show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 p-6 text-white overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <button onClick={dismiss} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors">
            <X className="h-4 w-4" />
          </button>
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Aktifkan Bot Telegram Anda</h3>
            <p className="text-sm text-primary-100 mt-1">
              Catat keuangan langsung dari chat — lebih cepat & praktis!
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {[
              <>Buka Telegram, cari bot <strong className="text-primary-700">@FinMateApp_Bot</strong></>,
              <>Ketik <strong>/start</strong> ke bot</>,
              <>Salin kode di bawah & kirim ke bot</>,
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">{i + 1}</span>
                <span className="text-sm text-text-main leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {/* Kode verifikasi */}
          <div className="bg-gray-50 border border-border rounded-xl p-3 flex items-center justify-between gap-2">
            <code className="font-mono font-bold text-primary-700 text-base tracking-wide truncate">{verificationCode}</code>
            <Button variant="outline" size="sm" onClick={copyCode} className="shrink-0">
              <Copy className="h-3.5 w-3.5 mr-1.5" />Salin
            </Button>
          </div>

          {/* Manfaat singkat */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['📸 Foto struk', '🎤 Voice note', '🔔 Notif harian', '📄 Laporan PDF'].map((b) => (
              <span key={b} className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">{b}</span>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <a href="https://t.me/FinMateApp_Bot" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="gradient" className="w-full">
                Buka Bot Telegram <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </a>
          </div>
          <button onClick={dismiss} className="w-full text-center text-xs text-text-muted hover:text-text-main transition-colors">
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  );
}
