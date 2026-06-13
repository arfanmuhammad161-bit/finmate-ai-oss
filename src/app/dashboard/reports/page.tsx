"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, FileText, CalendarDays, CalendarIcon, SlidersHorizontal, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

  const generateAIReport = async () => {
    if (Object.keys(categoryBreakdown).length === 0) return; // No expenses
    setGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/reports/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: summary.income,
          expense: summary.expense,
          categoryBreakdown
        })
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setAiReport(data);
    } catch (e) {
      console.error(e);
      setAiError('Gagal menghasilkan analisis AI. Silakan coba lagi nanti.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFillColor(59, 130, 246); // Primary blue
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`FINMATE AI - Laporan Keuangan`, 14, 17);
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const periodText = activeTab === 'monthly' ? monthName : activeTab === 'yearly' ? 'Tahun ' + year : (customStart && customEnd ? customStart + ' s/d ' + customEnd : 'Custom');
      doc.text(`Periode: ${periodText}`, 14, 35);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 42);
      
      // Ringkasan Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Ringkasan Keuangan`, 14, 55);
      
      autoTable(doc, {
        startY: 60,
        head: [['Total Pemasukan', 'Total Pengeluaran', 'Sisa Saldo (Net)']],
        body: [[
          formatRupiah(summary.income), 
          formatRupiah(summary.expense), 
          formatRupiah(summary.net)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { fontStyle: 'bold', fontSize: 12 },
        columnStyles: {
          0: { textColor: [22, 163, 74] }, // Green
          1: { textColor: [220, 38, 38] }, // Red
          2: { textColor: summary.net >= 0 ? [37, 99, 235] : [220, 38, 38] } // Blue or Red
        }
      });
      
      let finalY = (doc as any).lastAutoTable.finalY + 15;
      
      // Kategori Pengeluaran Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(`Rincian Pengeluaran per Kategori`, 14, finalY);
      
      const catBody = pieData.map(p => [p.name, formatRupiah(p.value)]);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Kategori', 'Total Pengeluaran']],
        body: catBody.length > 0 ? catBody : [['Belum ada pengeluaran', '-']],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      finalY = (doc as any).lastAutoTable.finalY + 15;
      
      // 5 Pengeluaran Terbesar Section
      if (topTransactions.length > 0) {
        if (finalY > 220) {
          doc.addPage();
          finalY = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`5 Pengeluaran Terbesar`, 14, finalY);
        
        const txBody = topTransactions.map(t => [
          t.date,
          t.description || 'Tanpa Keterangan', 
          t.category_name, 
          formatRupiah(t.amount)
        ]);
        
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah']],
          body: txBody,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] },
          styles: { overflow: 'linebreak', cellWidth: 'wrap' },
          columnStyles: {
            1: { cellWidth: 'auto' }, // Allow description to wrap safely
            3: { halign: 'right', fontStyle: 'bold' }
          }
        });
        
        finalY = (doc as any).lastAutoTable.finalY + 15;
      }

      // AI Analysis Section
      if (aiReport) {
        if (finalY > 200) {
          doc.addPage();
          finalY = 20;
        }

        // AI Header Background
        doc.setFillColor(240, 249, 255);
        doc.rect(14, finalY, pageWidth - 28, 8, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(3, 105, 161);
        doc.text(`Analisis AI FinMate`, 16, finalY + 6);
        
        finalY += 15;
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Kategori Paling Boros:`, 14, finalY);
        doc.setFont('helvetica', 'normal');
        const worstSplit = doc.splitTextToSize(aiReport.worst_category_text || '-', pageWidth - 28);
        doc.text(worstSplit, 14, finalY + 6);
        finalY += (worstSplit.length * 6) + 6;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Kabar Baik:`, 14, finalY);
        doc.setFont('helvetica', 'normal');
        const goodSplit = doc.splitTextToSize(aiReport.good_news_text || '-', pageWidth - 28);
        doc.text(goodSplit, 14, finalY + 6);
        finalY += (goodSplit.length * 6) + 6;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`💡 Tips Hemat Khusus Untuk Anda:`, 14, finalY);
        doc.setFont('helvetica', 'normal');
        let tipY = finalY + 6;
        aiReport.tips?.forEach((tip: string) => {
          const tipSplit = doc.splitTextToSize(`• ${tip}`, pageWidth - 28);
          doc.text(tipSplit, 14, tipY);
          tipY += (tipSplit.length * 6) + 2;
        });
      }
      
      doc.save(`Laporan_FinMate_${monthName.replace(/ /g, '_')}.pdf`);
    } catch (e) {
      console.error('Gagal generate PDF:', e);
      alert('Maaf, terjadi kesalahan saat membuat PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
  const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Laporan Keuangan</h2>
          <p className="text-text-muted">Analisis mendalam kondisi keuangan Anda dengan AI.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleDownloadPDF} 
            variant="gradient" 
            className="shadow-md"
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isDownloading ? 'Memproses PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">

        <Card 
          className={cn("cursor-pointer transition-all hover:border-primary-500", activeTab === 'monthly' ? "border-primary-500 ring-1 ring-primary-500 shadow-md" : "")}
          onClick={() => setActiveTab('monthly')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", activeTab === 'monthly' ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500")}>
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-text-main">Bulanan</h3>
              <p className="text-xs text-text-muted">{monthName}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn("cursor-pointer transition-all hover:border-primary-500", activeTab === 'yearly' ? "border-primary-500 ring-1 ring-primary-500 shadow-md" : "")}
          onClick={() => setActiveTab('yearly')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", activeTab === 'yearly' ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500")}>
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-text-main">Tahunan</h3>
              <p className="text-xs text-text-muted">Tahun {year}</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:border-primary-500", activeTab === 'custom' ? "border-primary-500 ring-1 ring-primary-500 shadow-md" : "")}
          onClick={() => setActiveTab('custom')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", activeTab === 'custom' ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500")}>
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-text-main">Custom</h3>
              <p className="text-xs text-text-muted">Pilih Tanggal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'custom' && (
        <Card className="print:hidden border border-primary-200 bg-primary-50/30">
          <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs font-medium text-text-muted">Dari Tanggal</label>
              <input 
                type="date" 
                className="w-full flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs font-medium text-text-muted">Sampai Tanggal</label>
              <input 
                type="date" 
                className="w-full flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Preview */}
      <Card id="report-container" className="border-t-4 border-t-primary-500 shadow-lg bg-white">
        <CardHeader className="text-center pb-8 border-b border-gray-100">
          <CardTitle className="text-2xl">
            Laporan Keuangan {activeTab === 'monthly' ? monthName : activeTab === 'yearly' ? `Tahun ${year}` : (customStart && customEnd ? `${customStart} s.d ${customEnd}` : 'Custom')}
          </CardTitle>
          <CardDescription>Berdasarkan transaksi riil Anda pada periode terpilih</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Summary & Charts */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-text-main mb-4 border-b pb-2">Ringkasan Eksekutif</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-text-muted mb-1">Total Pemasukan</p>
                    <p className="text-xl font-bold text-green-600">{formatRupiah(summary.income)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-text-muted mb-1">Total Pengeluaran</p>
                    <p className="text-xl font-bold text-red-600">{formatRupiah(summary.expense)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 col-span-2">
                    <p className="text-sm text-text-muted mb-1">Sisa Uang (Net)</p>
                    <p className={cn("text-2xl font-bold", summary.net >= 0 ? "text-primary-600" : "text-red-600")}>
                      {formatRupiah(summary.net)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text-main mb-4 border-b pb-2">Distribusi Pengeluaran</h3>
                {pieData.length > 0 ? (
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-text-muted bg-gray-50 rounded-xl border border-dashed">
                    Belum ada pengeluaran bulan ini
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AI Insights */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-6 rounded-2xl border border-primary-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-primary-900 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary-600" />
                    Analisis FinMate AI
                  </h3>
                  {!aiReport && pieData.length > 0 && (
                    <Button variant="gradient" size="sm" onClick={generateAIReport} disabled={generatingAi}>
                      {generatingAi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      {generatingAi ? 'Menganalisis...' : 'Mulai Analisis'}
                    </Button>
                  )}
                </div>
                
                {aiReport ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-white/60 p-3 rounded-xl border border-white">
                      <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-text-main text-sm">Kategori Paling Boros</p>
                        <p className="text-sm text-text-muted mt-1">{aiReport.worst_category_text}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 bg-white/60 p-3 rounded-xl border border-white">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-text-main text-sm">Kabar Baik</p>
                        <p className="text-sm text-text-muted mt-1">{aiReport.good_news_text}</p>
                      </div>
                    </div>
                  </div>
                ) : aiError ? (
                  <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 text-sm">Gagal Menganalisis</p>
                      <p className="text-sm text-red-700 mt-1">{aiError}</p>
                      <Button variant="ghost" size="sm" className="mt-2 text-red-700 hover:text-red-900 hover:bg-red-100 px-0" onClick={generateAIReport}>
                        Coba Lagi
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-primary-700/60 text-sm">
                    {pieData.length > 0 
                      ? "Klik tombol di atas untuk melihat insight spesifik berdasarkan pengeluaran Anda." 
                      : "Catat pengeluaran terlebih dahulu agar AI dapat menganalisis keuangan Anda."}
                  </div>
                )}
              </div>

              <div className="bg-accent-50 p-6 rounded-2xl border border-accent-100">
                <h3 className="font-bold text-accent-900 mb-3">💡 Tips Hemat Bulan Ini</h3>
                {aiReport ? (
                  <ul className="space-y-2 text-sm text-accent-800 list-disc list-inside">
                    {aiReport.tips?.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-sm text-accent-800/60 list-disc list-inside">
                    <li>AI akan membuatkan tips khusus setelah Anda memulai analisis.</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Top Transactions Section */}
          {topTransactions.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100 break-inside-avoid">
              <h3 className="text-lg font-bold text-text-main mb-4">5 Pengeluaran Terbesar Bulan Ini</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-text-muted uppercase bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium">Deskripsi</th>
                      <th className="px-4 py-3 font-medium">Kategori</th>
                      <th className="px-4 py-3 font-medium text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTransactions.map((trx, idx) => (
                      <tr key={idx} className="bg-white border-b border-border hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-text-main">{trx.description || 'Tanpa Keterangan'}</td>
                        <td className="px-4 py-3 text-text-muted">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs">
                            {trx.category_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">
                          {formatRupiah(trx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
