"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Target, Sparkles, TrendingUp, X } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  color: string;
  deadline: string | null;
  status: string;
  icon: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '' });
  const [topUpAmount, setTopUpAmount] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchGoals = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setGoals(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleCreate = async () => {
    if (!form.name || !form.target_amount) {
      toast.warning('Mohon isi nama dan target nominal terlebih dahulu.');
      return;
    }
    const target = parseInt(form.target_amount);
    if (isNaN(target) || target <= 0) {
      toast.warning('Target nominal harus berupa angka lebih dari nol.');
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        name: form.name,
        target_amount: target,
        current_amount: 0,
        deadline: form.deadline || null,
        color: '#3b82f6'
      });

      if (error) throw error;

      setForm({ name: '', target_amount: '', deadline: '' });
      setShowModal(false);
      toast.success('Target keuangan berhasil dibuat.');
      await fetchGoals();
    } catch (e) {
      console.error(e);
      toast.error('Gagal membuat target. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleTopUp = async (goalId: string, currentAmount: number) => {
    const addAmount = parseInt(topUpAmount[goalId] || '0');
    if (!addAmount || addAmount <= 0) {
      toast.warning('Mohon isi jumlah top up terlebih dahulu.');
      return;
    }
    setSavingId(goalId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('goals').update({
        current_amount: currentAmount + addAmount
      }).eq('id', goalId);

      if (error) throw error;

      setTopUpAmount(prev => ({ ...prev, [goalId]: '' }));
      toast.success(`Berhasil tambah Rp${addAmount.toLocaleString('id-ID')} ke target.`);
      await fetchGoals();
    } catch (e) {
      console.error(e);
      toast.error('Gagal melakukan top up. Silakan coba lagi.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
  }

  const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Target Keuangan</h2>
          <p className="text-text-muted">Wujudkan impian Anda dengan perencanaan cerdas.</p>
        </div>
        <Button variant="gradient" className="shadow-md" onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />Buat Target
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-text-muted gap-4">
            <Target className="h-16 w-16 text-gray-200" />
            <div className="text-center">
              <p className="text-lg font-semibold text-text-main">Belum ada target keuangan</p>
              <p className="text-sm">Buat target pertama Anda untuk mulai menabung secara terarah.</p>
            </div>
            <Button variant="gradient" onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />Buat Target Sekarang
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.current_amount / Math.max(1, goal.target_amount)) * 100));
            const remaining = goal.target_amount - goal.current_amount;

            return (
              <Card key={goal.id} className="overflow-hidden flex flex-col">
                <CardHeader className="border-b border-border bg-gray-50/50 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 shadow-sm border border-white text-xl font-bold">
                        {goal.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        {goal.deadline && (
                          <CardDescription className="text-xs">Target: {goal.deadline}</CardDescription>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full",
                      percentage >= 100 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {percentage >= 100 ? '✅ Tercapai' : `${percentage}%`}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-text-muted">Terkumpul</p>
                        <p className="text-3xl font-bold text-text-main">{formatRupiah(goal.current_amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-muted">Target</p>
                        <p className="text-lg font-semibold text-text-main">{formatRupiah(goal.target_amount)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-muted">{formatRupiah(remaining)} lagi untuk mencapai target</p>
                    </div>

                    {percentage < 100 && (
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">Rp</span>
                            <Input
                              type="number"
                              placeholder="Top up jumlah"
                              className="pl-9"
                              value={topUpAmount[goal.id] || ''}
                              onChange={e => setTopUpAmount(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            />
                          </div>
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() => handleTopUp(goal.id, goal.current_amount)}
                            disabled={savingId === goal.id}
                          >
                            {savingId === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Top Up'}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 bg-primary-50 p-3 rounded-xl border border-primary-100">
                      <Sparkles className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-primary-800 leading-relaxed">
                        {percentage >= 100 
                          ? 'Selamat! Target ini sudah tercapai. 🎉'
                          : remaining > 0 && goal.deadline
                            ? `Butuh ${formatRupiah(Math.ceil(remaining / Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 2592000000))))} per bulan untuk mencapai target sebelum deadline.`
                            : `Sisa ${formatRupiah(remaining)} lagi. Terus semangat menabung!`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold text-text-main">Buat Target Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Target</label>
                <Input placeholder="Contoh: Beli Laptop, Dana Darurat" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jumlah Target (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">Rp</span>
                  <Input type="number" placeholder="0" className="pl-10 text-lg font-bold h-12" value={form.target_amount} onChange={e => setForm(p => ({ ...p, target_amount: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline (opsional)</label>
                <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <Button variant="gradient" className="w-full h-12 font-semibold" onClick={handleCreate} disabled={saving || !form.name || !form.target_amount}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                {saving ? 'Menyimpan...' : 'Buat Target'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
