"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Wallet, Building2, Smartphone, PiggyBank, X, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/PageHeader';

interface Account {
  id: string;
  name: string;
  type: string;
  color: string;
  created_at: string;
  current_balance: number;
}

const ACCOUNT_TYPES = [
  { id: 'cash',    label: 'Kas / Tunai',     icon: Wallet,    color: '#10b981', desc: 'Uang tunai di tangan' },
  { id: 'bank',    label: 'Rekening Bank',   icon: Building2, color: '#3b82f6', desc: 'BRI, BCA, Mandiri, dll' },
  { id: 'ewallet', label: 'Dompet Digital',  icon: Smartphone,color: '#8b5cf6', desc: 'GoPay, OVO, Dana, dll' },
  { id: 'savings', label: 'Tabungan',        icon: PiggyBank, color: '#f59e0b', desc: 'Tabungan terpisah' },
]

function getTypeConfig(type: string) {
  return ACCOUNT_TYPES.find(t => t.id === type) || ACCOUNT_TYPES[0]
}

function formatRp(n: number) {
  const abs = Math.abs(n)
  return (n < 0 ? '-' : '') + 'Rp' + abs.toLocaleString('id-ID')
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('cash');
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Gagal memuat daftar akun.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.warning('Masukkan nama akun.'); return; }
    setSaving(true);
    try {
      const typeConfig = getTypeConfig(newType);
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), type: newType, color: typeConfig.color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat akun');
      setAccounts(prev => [...prev, data]);
      setNewName(''); setNewType('cash');
      setShowModal(false);
      toast.success(`Akun "${data.name}" berhasil dibuat.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (acc: Account) => {
    const ok = await confirmDialog({
      title: `Hapus akun "${acc.name}"?`,
      message: 'Transaksi yang sudah tercatat di akun ini tidak ikut terhapus.',
      confirmLabel: 'Hapus Akun',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acc.id }),
      });
      if (!res.ok) throw new Error('Gagal menghapus akun');
      setAccounts(prev => prev.filter(a => a.id !== acc.id));
      toast.success(`Akun "${acc.name}" dihapus.`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.current_balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Akun Keuangan</h2>
            <p className="text-sm text-text-muted mt-0.5">Kelola kas, rekening bank & dompet digital Anda</p>
          </div>
        </div>
        <Button variant="gradient" size="sm" className="shadow-sm shrink-0" onClick={() => setShowModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />Tambah Akun
        </Button>
      </div>

      {/* Total Balance Card */}
      {accounts.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 text-white p-6 shadow-lg">
          <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-medium text-primary-100">Total Saldo Semua Akun</p>
            <p className="text-4xl font-extrabold tabular-nums mt-1">{formatRp(totalBalance)}</p>
            <p className="text-xs text-primary-200 mt-2">{accounts.length} akun terdaftar</p>
          </div>
        </div>
      )}

      {/* Account Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          title="Belum ada akun"
          description="Tambahkan akun untuk melacak saldo kas, bank, atau dompet digital Anda."
          action={
            <Button variant="gradient" onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />Tambah Akun Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const cfg = getTypeConfig(acc.type);
            const Icon = cfg.icon;
            return (
              <Card key={acc.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: acc.color || cfg.color }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-text-main text-sm">{acc.name}</p>
                        <p className="text-xs text-text-muted">{cfg.label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(acc)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Saldo dari transaksi tercatat</p>
                    <p className={cn(
                      "text-2xl font-extrabold tabular-nums",
                      acc.current_balance >= 0 ? "text-text-main" : "text-red-600"
                    )}>
                      {formatRp(acc.current_balance)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
        <strong>Cara menggunakan:</strong> Saat catat transaksi di form atau via Telegram, pilih/sebutkan nama akun.
        Contoh di Telegram: <em>"beli bensin 50rb dari BRI"</em> — bot otomatis mencatat ke akun BRI.
      </div>

      {/* Add Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold text-text-main">Tambah Akun Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main">Tipe Akun</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setNewType(t.id)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                          newType === t.id ? "border-primary-500 bg-primary-50" : "border-border hover:border-primary-200"
                        )}
                      >
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: t.color }}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={cn("text-xs font-semibold", newType === t.id ? "text-primary-700" : "text-text-main")}>{t.label}</p>
                          <p className="text-[10px] text-text-muted leading-tight">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main">Nama Akun</label>
                <Input
                  placeholder={newType === 'bank' ? 'Contoh: BRI, BCA, Mandiri' : newType === 'ewallet' ? 'Contoh: GoPay, OVO, Dana' : 'Contoh: Dompet, Kas Kantor'}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>

              <Button variant="gradient" className="w-full" onClick={handleCreate} disabled={saving || !newName.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {saving ? 'Menyimpan...' : 'Buat Akun'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
