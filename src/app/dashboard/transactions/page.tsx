"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, ArrowDownRight, ArrowUpRight, X, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/PageHeader';
import { Receipt, Wallet } from 'lucide-react';

const categoryList = [
  "Makanan", "Transportasi", "Hiburan", "Belanja", "Tagihan", "Kesehatan", "Pendidikan", "Lainnya",
  "Gaji", "Freelance", "Investasi"
];

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category_name: string;
  description: string;
  date: string;
  source: string;
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [showModal, setShowModal] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTransactions = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    const { data } = await query;
    setTransactions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSave = async () => {
    const amountNum = parseInt(amount);
    if (!amount || !desc) {
      toast.warning('Mohon isi jumlah dan keterangan terlebih dahulu.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.warning('Jumlah harus berupa angka lebih dari nol.');
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: txType,
        amount: amountNum,
        description: desc,
        category_name: category || (txType === 'income' ? 'Gaji' : 'Lainnya'),
        date,
        source: 'web'
      });

      if (error) throw error;

      // Reset form
      setAmount(''); setDesc(''); setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setShowModal(false);
      toast.success('Transaksi berhasil disimpan.');
      await fetchTransactions();
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan transaksi. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Hapus transaksi?',
      message: 'Transaksi yang dihapus tidak bisa dikembalikan.',
      confirmLabel: 'Hapus',
      tone: 'danger',
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error(error);
      toast.error('Gagal menghapus transaksi. Silakan coba lagi.');
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transaksi berhasil dihapus.');
  };

  const filtered = transactions.filter(t => {
    const matchFilter = filter === 'all' || t.type === filter;
    const matchSearch = !search || 
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category_name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Transaksi</h2>
            <p className="text-sm text-text-muted mt-0.5">Pantau & kelola aktivitas keuangan Anda</p>
          </div>
        </div>
        <Button variant="gradient" size="sm" className="shadow-sm shrink-0" onClick={() => setShowModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />Tambah Transaksi
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input 
                  placeholder="Cari transaksi..." 
                  className="pl-9 bg-gray-50 border-gray-200"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {[{id:'all',label:'Semua'},{id:'income',label:'Pemasukan'},{id:'expense',label:'Pengeluaran'}].map(f => (
                <button 
                  key={f.id}
                  className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", filter === f.id ? "bg-white shadow-sm text-text-main" : "text-text-muted")}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-7 w-7" />}
              title={search || filter !== 'all' ? 'Tidak ada hasil' : 'Belum ada transaksi'}
              description={search || filter !== 'all' ? 'Coba ubah kata kunci atau filter.' : 'Mulai catat aktivitas keuangan Anda di sini.'}
              action={(!search && filter === 'all') && (
                <Button variant="gradient" onClick={() => setShowModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />Catat transaksi pertama
                </Button>
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              {/* DESKTOP VIEW (Table) */}
              <table className="hidden md:table w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Keterangan</th>
                    <th className="px-6 py-4 font-medium">Kategori</th>
                    <th className="px-6 py-4 font-medium">Tanggal</th>
                    <th className="px-6 py-4 font-medium text-right">Jumlah</th>
                    <th className="px-6 py-4 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((trx) => (
                    <tr key={trx.id} className="bg-white border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-main">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            trx.type === 'income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          )}>
                            {trx.type === 'income' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          {trx.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          {trx.category_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted">{trx.date}</td>
                      <td className={cn("px-6 py-4 text-right font-bold", trx.type === 'income' ? "text-green-600" : "text-text-main")}>
                        {trx.type === 'income' ? '+' : '-'} {formatRupiah(trx.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant="ghost" size="icon" 
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(trx.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* MOBILE VIEW (Card List) */}
              <div className="md:hidden flex flex-col">
                {filtered.map((trx) => (
                  <div key={trx.id} className="flex flex-col p-4 border-b border-gray-100 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm",
                          trx.type === 'income' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                        )}>
                          {trx.type === 'income' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-text-main text-sm line-clamp-1">{trx.description}</span>
                          <span className="text-xs text-text-muted mt-0.5">{trx.date}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end pl-2">
                        <span className={cn("font-bold text-sm", trx.type === 'income' ? "text-green-600" : "text-text-main")}>
                          {trx.type === 'income' ? '+' : '-'} {formatRupiah(trx.amount)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase">
                            {trx.category_name || '-'}
                          </span>
                          <button onClick={() => handleDelete(trx.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-md">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold text-text-main">Tambah Transaksi</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Type Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setTxType('expense')}
                  className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all", txType === 'expense' ? "bg-white shadow-sm text-red-600" : "text-text-muted")}
                >Pengeluaran</button>
                <button
                  onClick={() => setTxType('income')}
                  className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all", txType === 'income' ? "bg-white shadow-sm text-green-600" : "text-text-muted")}
                >Pemasukan</button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main">Jumlah</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">Rp</span>
                  <Input type="number" placeholder="0" className="pl-10 text-xl font-bold h-14" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main">Keterangan</label>
                <Input placeholder="Contoh: Makan siang di warteg" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main">Kategori</label>
                <div className="grid grid-cols-4 gap-2">
                  {(txType === 'income' ? ['Gaji', 'Freelance', 'Investasi', 'Lainnya'] : ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Lainnya']).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "px-2 py-2 rounded-xl border text-xs font-medium transition-all text-center",
                        category === cat ? "border-primary-500 bg-primary-50 text-primary-700" : "border-border text-text-muted hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700"
                      )}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main">Tanggal</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>

              <Button variant="gradient" className="w-full h-12 text-base font-semibold" onClick={handleSave} disabled={saving || !amount || !desc}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
