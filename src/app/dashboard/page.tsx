"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, Landmark, Bot, Sparkles,
  TrendingUp, Clock, Crown, Loader2, Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get profile & subscription
    const [{ data: profile }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('full_name, trial_ends_at').eq('id', user.id).single(),
      supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).eq('status', 'active').single()
    ]);

    // Get transactions for current month
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

    // Build cashflow chart data (last 7 days)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {stats && stats.trialDaysLeft > 0 && stats.trialDaysLeft <= 14 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl px-5 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">
              Free Trial: <strong>{stats.trialDaysLeft} hari</strong> tersisa. Upgrade sekarang untuk tetap mengakses semua fitur AI.
            </span>
          </div>
          <Link href="/dashboard/settings">
            <Button size="sm" className="bg-white text-orange-600 hover:bg-orange-50 font-bold shrink-0 border-0">
              <Crown className="mr-1.5 h-3 w-3" />Upgrade
            </Button>
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Halo, {stats?.userName} 👋</h2>
          <p className="text-text-muted">Ini ringkasan keuangan Anda bulan ini.</p>
        </div>
        <Link href="/dashboard/ai-assistant">
          <Button variant="gradient" className="shadow-lg">
            <Bot className="mr-2 h-4 w-4" />Tanya AI Assistant
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Saldo Saat Ini', value: formatRupiah(stats?.balance || 0), icon: Wallet, color: 'bg-blue-50 text-blue-600', change: null },
          { title: 'Total Pemasukan', value: formatRupiah(stats?.income || 0), icon: ArrowDownRight, color: 'bg-green-50 text-green-600', change: null },
          { title: 'Total Pengeluaran', value: formatRupiah(stats?.expense || 0), icon: ArrowUpRight, color: 'bg-red-50 text-red-600', change: null },
          { title: 'Tabungan', value: formatRupiah(stats?.savings || 0), icon: Landmark, color: 'bg-purple-50 text-purple-600', change: null },
        ].map((c, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-text-muted text-sm">{c.title}</h3>
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", c.color)}>
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-text-main">{c.value}</div>
              <p className="text-xs text-text-muted mt-2">Bulan ini</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cashflow 7 Hari Terakhir</CardTitle>
            <CardDescription>Perbandingan pemasukan dan pengeluaran</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="h-56 md:h-[300px] flex flex-col items-center justify-center text-text-muted gap-4">
                <TrendingUp className="h-12 w-12 text-gray-300" />
                <div className="text-center">
                  <p className="font-medium">Belum ada transaksi</p>
                  <p className="text-sm">Mulai catat transaksi pertama Anda!</p>
                </div>
                <Link href="/dashboard/transactions">
                  <Button variant="gradient" size="sm">
                    <Plus className="mr-2 h-4 w-4" />Tambah Transaksi
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="h-56 md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                    />
                    <Area type="linear" dataKey="in" name="Pemasukan" stroke="#22c55e" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                    <Area type="linear" dataKey="out" name="Pengeluaran" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Score & Insight */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-primary-100 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />AI Financial Score
              </h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-bold">
                  {stats && stats.income > 0
                    ? Math.min(100, Math.round((stats.savings / stats.income) * 100 + 50))
                    : '--'}
                </span>
                <span className="text-xl text-primary-200 mb-1">/100</span>
              </div>
              <p className="mt-4 text-sm text-primary-50 leading-relaxed">
                {stats && stats.income > 0
                  ? stats.savings > 0 
                    ? `Bagus! Anda berhasil menghemat ${formatRupiah(stats.savings)} bulan ini.`
                    : 'Pengeluaran melebihi pemasukan bulan ini. Yuk evaluasi!'
                  : 'Belum ada transaksi bulan ini. Mulai catat sekarang!'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-orange-100 rounded-lg text-orange-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">AI Insight</h3>
                  <p className="text-sm text-orange-800 mt-1 leading-relaxed">
                    {transactions.length > 0
                      ? `Anda sudah mencatat ${transactions.length} transaksi bulan ini. Terus pertahankan kebiasaan ini!`
                      : 'Mulai catat transaksi Anda untuk mendapatkan insight keuangan dari AI.'}
                  </p>
                  <Link href="/dashboard/ai-assistant">
                    <Button variant="link" className="px-0 h-auto text-orange-700 font-semibold mt-2">
                      Tanya AI Assistant →
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <CardDescription>Aktivitas keuangan Anda terbaru</CardDescription>
          </div>
          <Link href="/dashboard/transactions">
            <Button variant="outline" size="sm">Lihat Semua</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <Wallet className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p>Belum ada transaksi.</p>
              <Link href="/dashboard/transactions">
                <Button variant="gradient" size="sm" className="mt-3">
                  <Plus className="mr-2 h-4 w-4" />Tambah Transaksi Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((trx) => (
                <div key={trx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold",
                      trx.type === 'income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {trx.category_name?.charAt(0) || (trx.type === 'income' ? '↓' : '↑')}
                    </div>
                    <div>
                      <p className="font-semibold text-text-main">{trx.description}</p>
                      <p className="text-xs text-text-muted">{trx.category_name} • {trx.date}</p>
                    </div>
                  </div>
                  <div className={cn("font-bold", trx.type === 'income' ? "text-green-600" : "text-text-main")}>
                    {trx.type === 'income' ? '+' : '-'} {formatRupiah(trx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
