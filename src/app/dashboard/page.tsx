"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowUpRight, ArrowDownRight, Wallet, Coins, Bot, Sparkles,
  TrendingUp, TrendingDown, Clock, Crown, Plus, FileText, Receipt, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category_name: string;
  description: string;
  date: string;
  source: string;
}

interface DashboardStats {
  balance: number;
  income: number;
  expense: number;
  savings: number;
  trialDaysLeft: number;
  userName: string;
}

function getGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 11) return { greeting: 'Selamat pagi', emoji: '☀️' };
  if (hour < 15) return { greeting: 'Selamat siang', emoji: '🌤️' };
  if (hour < 18) return { greeting: 'Selamat sore', emoji: '🌇' };
  return { greeting: 'Selamat malam', emoji: '🌙' };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatRupiah(n: number): string {
  return `Rp${n.toLocaleString('id-ID')}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return n.toString();
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: profile }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('full_name, trial_ends_at').eq('id', user.id).single(),
      supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).eq('status', 'active').single()
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .order('date', { ascending: false });

    const allTxs: Transaction[] = txs || [];
    const income = allTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = allTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayTxs = allTxs.filter(t => t.date === dateStr);
      return {
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        in: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        out: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });

    const trialDaysLeft = (sub?.expires_at && user.email !== 'arfanmuhammad161@gmail.com')
      ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000))
      : 0;

    setStats({
      balance: income - expense,
      income,
      expense,
      savings: Math.max(0, income - expense),
      trialDaysLeft,
      userName: profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User'
    });
    setTransactions(allTxs.slice(0, 5));
    setChartData(last7);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) return <DashboardSkeleton />;

  const { greeting, emoji } = getGreeting();
  const aiScore = stats && stats.income > 0
    ? Math.min(100, Math.round((stats.savings / stats.income) * 100 + 50))
    : null;
  const balanceDisplay = hideBalance ? '••••••••' : formatRupiah(stats?.balance || 0);

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Trial Banner */}
      {stats && stats.trialDaysLeft > 0 && stats.trialDaysLeft <= 14 && (
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">
              Trial tinggal <strong>{stats.trialDaysLeft} hari</strong> lagi
            </span>
          </div>
          <Link href="/dashboard/settings?tab=subscription" className="shrink-0">
            <Button size="sm" className="bg-white text-orange-600 hover:bg-orange-50 font-bold border-0 h-8">
              <Crown className="mr-1 h-3 w-3" />Upgrade
            </Button>
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div>
        <p className="text-sm text-text-muted">{formatDate(new Date())}</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-main mt-0.5">
          {greeting}, {stats?.userName} {emoji}
        </h2>
      </div>

      {/* HERO BALANCE CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 text-white shadow-xl">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-secondary-400/30 blur-2xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 p-5 sm:p-6">
          {/* LEFT: balance info */}
          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary-100 text-sm font-medium">
                <Wallet className="h-4 w-4" />
                Saldo bulan ini
              </div>
              <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums">
                  {balanceDisplay}
                </span>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Sembunyikan saldo"
                >
                  {hideBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {stats && (stats.income > 0 || stats.expense > 0) && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium">
                  {stats.balance >= 0 ? (
                    <><TrendingUp className="h-3 w-3" /> Surplus bulan ini</>
                  ) : (
                    <><TrendingDown className="h-3 w-3" /> Defisit bulan ini</>
                  )}
                </div>
              )}
            </div>

            {/* In/Out micro-summary inside hero */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-primary-100/80 font-semibold">
                  <ArrowDownRight className="h-3 w-3" />Masuk
                </div>
                <div className="text-base sm:text-lg font-bold tabular-nums mt-0.5">
                  {hideBalance ? '••••' : formatRupiah(stats?.income || 0)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-primary-100/80 font-semibold">
                  <ArrowUpRight className="h-3 w-3" />Keluar
                </div>
                <div className="text-base sm:text-lg font-bold tabular-nums mt-0.5">
                  {hideBalance ? '••••' : formatRupiah(stats?.expense || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AI Score + sparkline */}
          <div className="hidden lg:flex flex-col justify-between gap-4 pl-5 border-l border-white/15">
            <div>
              <div className="flex items-center gap-1.5 text-primary-100 text-sm font-medium">
                <Sparkles className="h-4 w-4" />AI Financial Score
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tabular-nums">{aiScore ?? '--'}</span>
                <span className="text-base text-primary-200">/100</span>
              </div>
              <p className="text-xs text-primary-100 mt-1.5 leading-relaxed">
                {aiScore !== null
                  ? aiScore >= 70 ? 'Skor sehat, pertahankan!' : aiScore >= 50 ? 'Cukup baik, masih bisa ditingkatkan.' : 'Perlu evaluasi pengeluaran.'
                  : 'Catat transaksi untuk dapat skor.'}
              </p>
            </div>
            {chartData.length > 0 && chartData.some(d => d.in > 0 || d.out > 0) && (
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="in" stroke="rgba(255,255,255,0.95)" strokeWidth={2} fill="url(#heroSpark)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS — di mobile vertikal tinggi, di laptop horizontal compact */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { href: "/dashboard/transactions", icon: Plus, label: "Catat Transaksi", iconBg: "bg-primary-50 text-primary-600", hoverBorder: "hover:border-primary-300" },
          { href: "/dashboard/ai-assistant", icon: Bot, label: "Tanya AI", iconBg: "bg-secondary-50 text-secondary-600", hoverBorder: "hover:border-secondary-300" },
          { href: "/dashboard/reports", icon: FileText, label: "Laporan", iconBg: "bg-accent-50 text-accent-600", hoverBorder: "hover:border-accent-300" },
        ].map((qa) => {
          const Icon = qa.icon;
          return (
            <Link key={qa.href} href={qa.href} className="group">
              <div className={cn(
                "bg-white border border-border rounded-2xl card-depth p-3 lg:p-3 flex flex-col sm:flex-row items-center sm:justify-start gap-2 sm:gap-3 transition-all hover:-translate-y-0.5 active:scale-[0.98]",
                qa.hoverBorder
              )}>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", qa.iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-text-main text-center sm:text-left leading-tight">
                  {qa.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* STATS GRID — Tabungan + AI Score (di mobile saja, di laptop AI score sudah ada di hero) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Coins className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-text-muted">Tabungan bersih</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-purple-600 tabular-nums truncate">
              {hideBalance ? '••••' : formatRupiah(stats?.savings || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-text-muted mt-1">Pemasukan − pengeluaran</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-text-muted">AI Score</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-primary-600 tabular-nums">
              {aiScore ?? '--'}<span className="text-sm text-text-muted">/100</span>
            </div>
            <p className="text-[10px] sm:text-xs text-text-muted mt-1">
              {aiScore !== null ? (aiScore >= 70 ? 'Sehat' : aiScore >= 50 ? 'Cukup baik' : 'Perlu evaluasi') : 'Belum tersedia'}
            </p>
          </CardContent>
        </Card>

        {/* Hari ini stat card — diisi di laptop saat AI Score sudah ada di hero */}
        <Card className="overflow-hidden hidden lg:block">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-text-muted">Aktivitas bulan ini</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-700 tabular-nums">
              {transactions.length}<span className="text-sm text-text-muted ml-1">transaksi</span>
            </div>
            <p className="text-[10px] sm:text-xs text-text-muted mt-1">
              {transactions.length === 0 ? 'Belum ada catatan' : 'Terus dicatat ya!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHART + INSIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Arus 7 hari terakhir</CardTitle>
                <CardDescription className="text-xs">Tren pemasukan vs pengeluaran harian</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="h-48 md:h-[280px] flex flex-col items-center justify-center text-text-muted gap-3">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-text-main">Grafik akan muncul di sini</p>
                  <p className="text-sm mt-0.5">Catat transaksi pertama untuk melihat tren keuangan</p>
                </div>
                <Link href="/dashboard/transactions">
                  <Button variant="gradient" size="sm" className="mt-1">
                    <Plus className="mr-1.5 h-4 w-4" />Mulai catat
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="h-48 md:h-[280px] w-full -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} width={42} />
                    <Tooltip
                      formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)' }}
                    />
                    <Area type="monotone" dataKey="in" name="Pemasukan" stroke="#22c55e" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="out" name="Pengeluaran" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insight */}
        <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-orange-200">
          <CardContent className="p-5 sm:p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-orange-900">Insight AI</h3>
            </div>
            <p className="text-sm text-orange-900/80 leading-relaxed flex-1">
              {stats && stats.income > 0
                ? stats.savings > 0
                  ? `Mantap! Bulan ini Anda berhasil menghemat ${formatRupiah(stats.savings)}. Pertahankan kebiasaan ini untuk masa depan yang lebih tenang. 🌱`
                  : 'Pengeluaran melebihi pemasukan bulan ini. Yuk cek kategori mana yang paling besar dan evaluasi bersama AI Assistant.'
                : 'Belum ada catatan keuangan bulan ini. Mulai dari yang kecil — bahkan secangkir kopi pagi pun penting untuk dicatat. ☕'}
            </p>
            <Link href="/dashboard/ai-assistant" className="mt-4">
              <Button variant="link" className="px-0 h-auto text-orange-700 font-semibold">
                Diskusi dengan AI <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* RECENT TRANSACTIONS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Aktivitas Terakhir</CardTitle>
            <CardDescription className="text-xs">5 transaksi terbaru Anda</CardDescription>
          </div>
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm" className="text-text-muted hover:text-primary-600">
              Semua <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Receipt className="h-7 w-7 text-gray-400" />
              </div>
              <p className="font-semibold text-text-main">Belum ada aktivitas</p>
              <p className="text-sm mt-1">Aktivitas keuangan Anda akan muncul di sini</p>
              <Link href="/dashboard/transactions">
                <Button variant="gradient" size="sm" className="mt-4">
                  <Plus className="mr-1.5 h-4 w-4" />Catat yang pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((trx) => (
                <Link
                  key={trx.id}
                  href="/dashboard/transactions"
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 active:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold",
                      trx.type === 'income'
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                    )}>
                      {trx.type === 'income' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-main text-sm truncate">{trx.description}</p>
                      <p className="text-xs text-text-muted truncate">{trx.category_name} · {trx.date}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "shrink-0 font-bold text-sm tabular-nums",
                    trx.type === 'income' ? "text-green-600" : "text-text-main"
                  )}>
                    {trx.type === 'income' ? '+' : '-'}{hideBalance ? '••••' : formatRupiah(trx.amount)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
