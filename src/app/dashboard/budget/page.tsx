"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, AlertTriangle, X } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/PageHeader';
import { PieChart } from 'lucide-react';

interface Budget {
  id: string;
  category_name: string;
  amount: number;
  month: number;
  year: number;
  spent?: number;
}

const categoryColors: Record<string, { color: string; bg: string; text: string; bar: string }> = {
  Makanan: { color: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500' },
  Transportasi: { color: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500' },
  Hiburan: { color: 'bg-purple-500', bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-500' },
  Belanja: { color: 'bg-pink-500', bg: 'bg-pink-100', text: 'text-pink-600', bar: 'bg-pink-500' },
  Tagihan: { color: 'bg-teal-500', bg: 'bg-teal-100', text: 'text-teal-600', bar: 'bg-teal-500' },
  Kesehatan: { color: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-600', bar: 'bg-red-500' },
  Pendidikan: { color: 'bg-violet-500', bg: 'bg-violet-100', text: 'text-violet-600', bar: 'bg-violet-500' },
  Lainnya: { color: 'bg-gray-500', bg: 'bg-gray-100', text: 'text-gray-600', bar: 'bg-gray-500' },
};

const defaultColor = { color: 'bg-indigo-500', bg: 'bg-indigo-100', text: 'text-indigo-600', bar: 'bg-indigo-500' };
const categoryList = ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Lainnya'];

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category_name: '', amount: '' });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchBudgets = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year);

    // Get actual spending per category this month
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const { data: txData } = await supabase
      .from('transactions')
      .select('category_name, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', monthStart);

    const spentByCategory: Record<string, number> = {};
    (txData || []).forEach(t => {
      spentByCategory[t.category_name] = (spentByCategory[t.category_name] || 0) + t.amount;
    });

    const enriched = (budgetData || []).map(b => ({
      ...b,
      spent: spentByCategory[b.category_name] || 0
    }));

    setBudgets(enriched);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const handleCreate = async () => {
    if (!form.category_name || !form.amount) {
      toast.warning('Mohon pilih kategori dan isi nominal anggaran.');
      return;
    }
    const amountNum = parseInt(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.warning('Nominal anggaran harus lebih dari nol.');
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('budgets').upsert({
        user_id: user.id,
        category_name: form.category_name,
        amount: amountNum,
        month,
        year
      }, { onConflict: 'user_id,category_name,month,year' });

      if (error) throw error;

      setForm({ category_name: '', amount: '' });
      setShowModal(false);
      toast.success('Anggaran berhasil disimpan.');
      await fetchBudgets();
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan anggaran. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Hapus anggaran?',
      message: 'Anggaran kategori ini akan dihapus untuk bulan berjalan.',
      confirmLabel: 'Hapus',
      tone: 'danger',
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus anggaran.');
      return;
    }
    setBudgets(prev => prev.filter(b => b.id !== id));
    toast.success('Anggaran berhasil dihapus.');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-3.5 w-72" /></div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const warningBudgets = budgets.filter(b => {
    const pct = ((b.spent || 0) / Math.max(1, b.amount)) * 100;
    return pct >= 80;
  });

  const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Budget Bulanan</h2>
          <p className="text-text-muted">Kontrol pengeluaran Anda. Bulan: {now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
        <Button variant="gradient" className="shadow-md" onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />Tambah Budget
        </Button>
      </div>

      {/* AI Warning */}
      {warningBudgets.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-red-100 rounded-full text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Peringatan AI: Budget Hampir Habis</h3>
                <p className="text-sm text-red-800 mt-1 leading-relaxed">
                  {warningBudgets.map(b => b.category_name).join(', ')} sudah melewati 80% dari budget. Perhatikan pengeluaran Anda!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<PieChart className="h-7 w-7" />}
              title="Belum ada anggaran bulan ini"
              description="Buat anggaran per kategori untuk kendalikan pengeluaran Anda."
              action={
                <Button variant="gradient" onClick={() => setShowModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />Buat anggaran pertama
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const spent = budget.spent || 0;
            const percentage = Math.min(100, Math.round((spent / Math.max(1, budget.amount)) * 100));
            const isWarning = percentage >= 80;
            const c = categoryColors[budget.category_name] || defaultColor;

            return (
              <Card key={budget.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm", c.bg, c.text)}>
                        {budget.category_name.charAt(0)}
                      </div>
                      <h3 className="font-semibold text-text-main">{budget.category_name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-text-main">{formatRupiah(spent)}</p>
                        <p className="text-xs text-text-muted">dari {formatRupiah(budget.amount)}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Terpakai</span>
                      <span className={cn("font-medium", isWarning ? "text-red-600" : "text-text-main")}>{percentage}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", isWarning ? "bg-red-500" : c.bar)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold text-text-main">Buat Budget Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <div className="grid grid-cols-2 gap-2">
                  {categoryList.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm(p => ({ ...p, category_name: cat }))}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-sm font-medium transition-all text-left",
                        form.category_name === cat ? "border-primary-500 bg-primary-50 text-primary-700" : "border-border text-text-muted hover:border-primary-300"
                      )}
                    >{cat}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Batas Budget (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">Rp</span>
                  <Input type="number" placeholder="0" className="pl-10 text-lg font-bold h-12" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
              </div>
              <Button variant="gradient" className="w-full h-12 font-semibold" onClick={handleCreate} disabled={saving || !form.category_name || !form.amount}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {saving ? 'Menyimpan...' : 'Simpan Budget'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
