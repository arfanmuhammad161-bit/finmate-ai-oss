"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, FileText, CalendarDays, CalendarIcon, SlidersHorizontal, Sparkles, AlertCircle, CheckCircle2, Loader2, TrendingUp, TrendingDown, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { Skeleton, StatsGridSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/PageHeader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const categoryColors: Record<string, string> = {
  Makanan: '#f97316', // orange-500
  Transportasi: '#3b82f6', // blue-500
  Hiburan: '#a855f7', // purple-500
  Belanja: '#ec4899', // pink-500
  Tagihan: '#14b8a6', // teal-500
  Kesehatan: '#ef4444', // red-500
  Pendidikan: '#8b5cf6', // violet-500
  Lainnya: '#6b7280', // gray-500
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [pieData, setPieData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});
  const [topTransactions, setTopTransactions] = useState<any[]>([]);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [isDownloading, setIsDownloading] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let startDate = '';
    let endDate = '';

    if (activeTab === 'monthly') {
      startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    } else if (activeTab === 'yearly') {
      startDate = `${year}-01-01`;
      endDate = `${year + 1}-01-01`;
    } else if (activeTab === 'custom') {
      if (!customStart || !customEnd) {
        setLoading(false);
        return; // Wait for user to select dates
      }
      startDate = customStart;
      // Add one day to end date to make it inclusive
      const eDate = new Date(customEnd);
      eDate.setDate(eDate.getDate() + 1);
      endDate = eDate.toISOString().split('T')[0];
    }

    const { data: txData } = await supabase
      .from('transactions')
      .select('type, category_name, amount, description')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lt('date', endDate);

    let inc = 0;
    let exp = 0;
    const catMap: Record<string, number> = {};

    (txData || []).forEach(t => {
      if (t.type === 'income') {
        inc += t.amount;
      } else {
        exp += t.amount;
        catMap[t.category_name] = (catMap[t.category_name] || 0) + t.amount;
      }
    });

    const topTxs = [...(txData || [])]
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setSummary({ income: inc, expense: exp, net: inc - exp });
    setCategoryBreakdown(catMap);
    setTopTransactions(topTxs);

    const pieArr = Object.entries(catMap).map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name] || '#94a3b8'
    }));
    
    pieArr.sort((a, b) => b.value - a.value);
    setPieData(pieArr);
    setAiReport(null); // Reset AI report when tab changes
    setLoading(false);
  }, [month, year, activeTab, customStart, customEnd]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const generateAIReport = useCallback(async (catBreakdown: Record<string, number>, sum: typeof summary) => {
    if (Object.keys(catBreakdown).length === 0) return;
    setGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/reports/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: sum.income,
          expense: sum.expense,
          categoryBreakdown: catBreakdown,
        })
      });
      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'AI lagi sibuk. Coba 1 menit lagi.');
        }
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setAiReport(data);
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || 'Gagal menghasilkan analisis AI. Silakan coba lagi.');
    } finally {
      setGeneratingAi(false);
    }
  }, []);

  // AUTO trigger analisis saat data tersedia (tidak ada tombol manual lagi)
  useEffect(() => {
    if (!loading && Object.keys(categoryBreakdown).length > 0 && !aiReport && !generatingAi && !aiError) {
      generateAIReport(categoryBreakdown, summary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, categoryBreakdown]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const { generateReportPdf } = await import('@/lib/generateReportPdf');

      const periodLabel = activeTab === 'monthly'
        ? monthName
        : activeTab === 'yearly'
          ? `Tahun ${year}`
          : (customStart && customEnd ? `${customStart} → ${customEnd}` : 'Periode Custom');

      // Ambil nama user dari Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      let userName = 'User FinMate';
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        userName = profile?.full_name || user.email?.split('@')[0] || 'User FinMate';
      }

      const pdfBytes = generateReportPdf({
        userName,
        periodLabel,
        income: summary.income,
        expense: summary.expense,
        net: summary.net,
        categoryBreakdown,
        topTransactions: topTransactions.map(t => ({
          description: t.description || '',
          category_name: t.category_name || '',
          amount: Number(t.amount),
          date: t.date,
        })),
        aiInsights: aiReport ? {
          worst_category_text: aiReport.worst_category_text,
          good_news_text: aiReport.good_news_text,
          tips: aiReport.tips,
        } : undefined,
      });

      // Trigger download di browser
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FinMate_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Gagal generate PDF:', e);
      toast.error('Maaf, terjadi kesalahan saat membuat PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-3.5 w-56" /></div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0,1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <CardSkeleton className="h-96" />
      </div>
    );
  }

  const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
  const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Laporan Keuangan</h2>
            <p className="text-sm text-text-muted mt-0.5">Analisis mendalam dengan AI</p>
          </div>
        </div>
        <Button
          onClick={handleDownloadPDF}
          variant="gradient"
          size="sm"
          className="shadow-sm shrink-0"
          disabled={isDownloading}
        >
          {isDownloading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
          {isDownloading ? 'Memproses...' : 'Download PDF'}
        </Button>
      </div>

      {/* Segmented control — gaya Stripe, compact & info-dense */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center print:hidden">
        <div className="inline-flex bg-white border border-border card-depth p-1 rounded-xl shadow-sm">
          {[
            { id: 'monthly', label: 'Bulanan', icon: CalendarDays, sub: monthName },
            { id: 'yearly', label: 'Tahunan', icon: CalendarIcon, sub: `Tahun ${year}` },
            { id: 'custom', label: 'Custom', icon: SlidersHorizontal, sub: 'Pilih tanggal' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm"
                    : "text-text-muted hover:text-text-main hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        {activeTab !== 'custom' && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted px-2">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{activeTab === 'monthly' ? monthName : `Tahun ${year}`}</span>
          </div>
        )}

        {/* Inline date picker — hanya muncul saat Custom dipilih */}
        {activeTab === 'custom' && (
          <div className="flex items-center gap-2 flex-1 bg-primary-50/40 border border-primary-100 rounded-xl px-3 py-2">
            <input
              type="date"
              className="flex-1 min-w-0 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 text-text-main"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              aria-label="Dari tanggal"
            />
            <span className="text-text-muted text-xs">→</span>
            <input
              type="date"
              className="flex-1 min-w-0 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 text-text-main"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              aria-label="Sampai tanggal"
            />
          </div>
        )}
      </div>


      {/* Report Preview */}
      <Card id="report-container" className="overflow-hidden border-none shadow-lg bg-white">
        {/* Hero header with period */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-secondary-400/30 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary-100/80 mb-1">Laporan Keuangan</div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {activeTab === 'monthly' ? monthName : activeTab === 'yearly' ? `Tahun ${year}` : (customStart && customEnd ? `${customStart} → ${customEnd}` : 'Periode Custom')}
              </h3>
              <p className="text-sm text-primary-100 mt-1">Dari transaksi riil yang Anda catat</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs uppercase tracking-wider text-primary-100/80 font-semibold">Sisa Bersih</div>
              <div className={cn("text-3xl sm:text-4xl font-extrabold tabular-nums")}>{formatRupiah(summary.net)}</div>
              <div className={cn("mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 backdrop-blur-sm")}>
                {summary.net >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {summary.net >= 0 ? 'Surplus' : 'Defisit'}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-5 sm:p-7">
          {/* Stats Row — full width, info-dense ala Stripe */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6 pb-6 border-b border-gray-100">
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                <ArrowDownRight className="h-3 w-3 text-green-500" />Pemasukan
              </div>
              <div className="text-lg sm:text-xl font-bold text-text-main tabular-nums mt-1">
                {formatRupiah(summary.income)}
              </div>
            </div>
            <div className="px-3 py-2.5 lg:border-l border-gray-100">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                <ArrowUpRight className="h-3 w-3 text-red-500" />Pengeluaran
              </div>
              <div className="text-lg sm:text-xl font-bold text-text-main tabular-nums mt-1">
                {formatRupiah(summary.expense)}
              </div>
            </div>
            <div className="px-3 py-2.5 lg:border-l border-gray-100">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                <Flame className="h-3 w-3 text-orange-500" />Transaksi
              </div>
              <div className="text-lg sm:text-xl font-bold text-text-main tabular-nums mt-1">
                {topTransactions.length > 0 ? topTransactions.length + Math.max(0, (Object.keys(categoryBreakdown).length - topTransactions.length)) : 0}<span className="text-xs text-text-muted ml-1 font-normal">tx</span>
              </div>
            </div>
            <div className="px-3 py-2.5 lg:border-l border-gray-100">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                <Sparkles className="h-3 w-3 text-secondary-500" />Rata-rata
              </div>
              <div className="text-lg sm:text-xl font-bold text-text-main tabular-nums mt-1">
                {(() => {
                  const days = activeTab === 'monthly' ? 30 : activeTab === 'yearly' ? 365 : 30;
                  return formatRupiah(Math.round(summary.expense / days));
                })()}<span className="text-xs text-text-muted ml-1 font-normal">/hari</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-10">

            {/* Left Column: Pie Chart only (Ringkasan sudah di stats row di atas) */}
            <div className="space-y-7">
              <div>
                <h3 className="text-sm font-bold text-text-main mb-3 uppercase tracking-wider">Distribusi Pengeluaran</h3>
                {pieData.length > 0 ? (
                  <div>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Custom legend list — lebih readable dari bawaan Recharts */}
                    <div className="mt-3 space-y-1.5">
                      {pieData.slice(0, 6).map((entry, i) => {
                        const pct = summary.expense > 0 ? (entry.value / summary.expense) * 100 : 0;
                        return (
                          <div key={i} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                              <span className="font-medium text-text-main truncate">{entry.name}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-text-muted text-xs tabular-nums">{pct.toFixed(0)}%</span>
                              <span className="font-bold text-text-main tabular-nums text-xs">{formatRupiah(entry.value)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Flame className="h-6 w-6" />}
                    title="Belum ada pengeluaran"
                    description="Catat transaksi dulu untuk melihat distribusi pengeluaran."
                    className="py-8"
                  />
                )}
              </div>
            </div>

            {/* Right Column: AI Insights — AUTO fetch saat data tersedia */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6 rounded-2xl border border-primary-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-primary-900">Analisis FinMate AI</h3>
                  {generatingAi && <span className="text-[10px] uppercase tracking-wider bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">Menganalisis...</span>}
                </div>

                {generatingAi ? (
                  <div className="space-y-3">
                    <div className="flex gap-3 bg-white/60 p-3 rounded-xl border border-white">
                      <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    </div>
                    <div className="flex gap-3 bg-white/60 p-3 rounded-xl border border-white">
                      <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </div>
                ) : aiReport ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-white/60 p-3 rounded-xl border border-white">
                      <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-text-main text-sm">Kategori Paling Boros</p>
                        <p className="text-sm text-text-muted mt-1 leading-relaxed">{aiReport.worst_category_text}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white/60 p-3 rounded-xl border border-white">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-text-main text-sm">Kabar Baik</p>
                        <p className="text-sm text-text-muted mt-1 leading-relaxed">{aiReport.good_news_text}</p>
                      </div>
                    </div>
                  </div>
                ) : aiError ? (
                  <div className="bg-red-50/80 backdrop-blur-sm p-3.5 rounded-xl border border-red-200">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-800 text-sm">Gagal menganalisis</p>
                        <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{aiError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-[11px] border-red-300 text-red-700 hover:bg-red-100"
                          onClick={() => { setAiError(null); generateAIReport(categoryBreakdown, summary); }}
                        >
                          <Loader2 className={cn("h-3 w-3 mr-1", generatingAi && "animate-spin")} />
                          Coba lagi
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-primary-700/60 text-sm">
                    Catat pengeluaran terlebih dahulu agar AI bisa menganalisis keuangan Anda.
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 rounded-2xl border border-orange-100">
                <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">💡</span>Tips Hemat Bulan Ini
                </h3>
                {generatingAi ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-11/12" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                ) : aiReport?.tips ? (
                  <ul className="space-y-2 text-sm text-orange-900/90">
                    {aiReport.tips.map((tip: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-orange-500 shrink-0">•</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-orange-900/60 leading-relaxed">Tips otomatis dibuatkan saat ada data pengeluaran.</p>
                )}
              </div>
            </div>
          </div>

          {/* Top Transactions Section */}
          {topTransactions.length > 0 && (
            <div className="mt-10 pt-7 border-t border-gray-100 break-inside-avoid">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Flame className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-text-main">5 Pengeluaran Terbesar</h3>
              </div>
              <div className="space-y-2">
                {topTransactions.map((trx, idx) => {
                  const pct = summary.expense > 0 ? (trx.amount / summary.expense) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/60 hover:bg-gray-50 border border-gray-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          idx === 0 ? "bg-red-100 text-red-700" : idx === 1 ? "bg-orange-100 text-orange-700" : idx === 2 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                        )}>
                          #{idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text-main text-sm truncate">{trx.description || 'Tanpa Keterangan'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-gray-200 text-text-muted">
                              {trx.category_name}
                            </span>
                            <span className="text-[10px] text-text-muted tabular-nums">{pct.toFixed(1)}% dari total</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-red-600 text-sm sm:text-base tabular-nums">{formatRupiah(trx.amount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
