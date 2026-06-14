"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Check, X, ExternalLink, Loader2, RefreshCw, CreditCard, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { Skeleton, ListItemSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/PageHeader';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
      } else {
        console.error('Error fetching payments:', data.error);
      }
    } catch (e) {
      console.error('Error fetching payments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAction = async (paymentId: string, action: 'approve' | 'reject') => {
    setActionLoading(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
      
      toast.success(action === 'approve' ? 'Pembayaran disetujui dan akun user diaktifkan.' : 'Pembayaran ditolak.');
      fetchPayments();
    } catch (e: any) {
      toast.error(e.message || 'Gagal memproses pembayaran.');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'success') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Verifikasi Pembayaran</h2>
            <p className="text-sm text-text-muted mt-0.5">Kelola bukti transfer & aktivasi user</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {[0, 1, 2].map(i => <div key={i} className="px-4 sm:px-6 py-4"><ListItemSkeleton /></div>)}
            </div>
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-7 w-7" />}
              title="Belum ada pembayaran"
              description="Pembayaran masuk dari user akan muncul di sini."
            />
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-text-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Tanggal</th>
                      <th className="px-4 py-3 font-semibold">Pengguna</th>
                      <th className="px-4 py-3 font-semibold">Paket</th>
                      <th className="px-4 py-3 font-semibold">Jumlah</th>
                      <th className="px-4 py-3 font-semibold">Bukti</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                          {new Date(p.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-text-main">{p.profiles?.full_name || 'User'}</div>
                          <div className="text-xs text-text-muted font-mono">{p.user_id.substring(0, 8)}...</div>
                        </td>
                        <td className="px-4 py-3 capitalize font-medium text-text-main">{p.plan}</td>
                        <td className="px-4 py-3 font-bold text-text-main tabular-nums">Rp{parseInt(p.amount).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3">
                          {p.proof_url ? (
                            <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />Bukti
                            </a>
                          ) : <span className="text-text-muted italic text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", statusBadge(p.status))}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleAction(p.id, 'approve')} disabled={actionLoading === p.id} title="Setujui" className="h-8 w-8 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 flex items-center justify-center disabled:opacity-50">
                                {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </button>
                              <button onClick={() => handleAction(p.id, 'reject')} disabled={actionLoading === p.id} title="Tolak" className="h-8 w-8 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center disabled:opacity-50">
                                {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y divide-border">
                {payments.map((p) => (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-main truncate">{p.profiles?.full_name || 'User'}</p>
                        <p className="text-[11px] text-text-muted">
                          {new Date(p.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusBadge(p.status))}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">{p.plan}</p>
                        <p className="font-bold text-text-main tabular-nums">Rp{parseInt(p.amount).toLocaleString('id-ID')}</p>
                      </div>
                      {p.proof_url && (
                        <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 text-xs font-medium bg-primary-50 px-2.5 py-1.5 rounded-lg">
                          <ExternalLink className="h-3 w-3" />Bukti
                        </a>
                      )}
                    </div>
                    {p.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-500 text-white" onClick={() => handleAction(p.id, 'approve')} disabled={actionLoading === p.id}>
                          {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-4 w-4" />Setujui</>}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(p.id, 'reject')} disabled={actionLoading === p.id}>
                          {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="mr-1 h-4 w-4" />Tolak</>}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
