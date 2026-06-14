"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Check, X, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Verifikasi Pembayaran</h1>
          <p className="text-text-muted mt-1">Kelola bukti transfer dan aktivasi akun pengguna</p>
        </div>
        <Button variant="outline" onClick={fetchPayments} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh Data
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-text-muted font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">TANGGAL</th>
                  <th className="px-6 py-4">PENGGUNA</th>
                  <th className="px-6 py-4">PAKET</th>
                  <th className="px-6 py-4">JUMLAH</th>
                  <th className="px-6 py-4">BUKTI</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Memuat data...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                      Belum ada data pembayaran.
                    </td>
                  </tr>
                ) : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-text-muted">
                      {new Date(p.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-text-main">
                        {p.profiles?.full_name || 'User'}
                      </div>
                      <div className="text-xs text-text-muted font-mono">{p.user_id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize font-medium text-text-main">
                      {p.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-text-main">
                      Rp{parseInt(p.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.proof_url ? (
                        <a 
                          href={p.proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Lihat Bukti
                        </a>
                      ) : (
                        <span className="text-text-muted italic">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold",
                        p.status === 'success' ? "bg-green-100 text-green-700" :
                        p.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {p.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleAction(p.id, 'approve')}
                            disabled={actionLoading === p.id}
                            title="Setujui"
                          >
                            {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleAction(p.id, 'reject')}
                            disabled={actionLoading === p.id}
                            title="Tolak"
                          >
                            {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
