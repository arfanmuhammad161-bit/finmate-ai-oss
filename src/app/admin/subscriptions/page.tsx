"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CreditCard, Loader2, Crown, Clock, Ban, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton, ListItemSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/PageHeader';

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubs(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const proActive = subs.filter(s => s.status === 'active' && s.plan !== 'trial').length;
  const trialActive = subs.filter(s => s.status === 'active' && s.plan === 'trial').length;
  const expired = subs.filter(s => s.status !== 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Langganan</h2>
          <p className="text-sm text-text-muted mt-0.5">Kelola Pro dan Trial pengguna</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Pro Aktif', value: proActive, icon: Crown, bg: 'bg-green-50', tx: 'text-green-600', border: 'border-green-100' },
          { label: 'Trial Aktif', value: trialActive, icon: Clock, bg: 'bg-orange-50', tx: 'text-orange-600', border: 'border-orange-100' },
          { label: 'Kadaluarsa', value: expired, icon: Ban, bg: 'bg-red-50', tx: 'text-red-600', border: 'border-red-100' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className={cn("overflow-hidden", s.border)}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", s.bg, s.tx)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-text-muted truncate">{s.label}</span>
                </div>
                <div className={cn("text-2xl font-bold tabular-nums", s.tx)}>{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Langganan</CardTitle>
          <CardDescription>Semua riwayat paket langganan pengguna FinMate.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {[0, 1, 2].map(i => <div key={i} className="px-4 sm:px-6 py-4"><ListItemSkeleton /></div>)}
            </div>
          ) : subs.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="Belum ada data langganan"
              description="Riwayat paket Pro & Trial akan muncul di sini."
            />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] text-text-muted uppercase tracking-wider bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Pengguna</th>
                      <th className="px-4 py-3 font-semibold">Paket</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Berakhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subs.map((s) => (
                      <tr key={s.id} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-text-main">{s.full_name}</p>
                          <p className="text-xs text-text-muted">{s.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            s.plan === 'trial' ? "bg-orange-100 text-orange-700" : "bg-primary-100 text-primary-700")}>
                            {s.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            s.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">{formatDate(s.expires_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-border">
                {subs.map((s) => (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-main truncate">{s.full_name}</p>
                        <p className="text-xs text-text-muted truncate">{s.email}</p>
                      </div>
                      <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        s.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {s.status === 'active' ? 'Aktif' : 'Off'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        s.plan === 'trial' ? "bg-orange-100 text-orange-700" : "bg-primary-100 text-primary-700")}>
                        {s.plan}
                      </span>
                      <span className="text-text-muted">Berakhir: {formatDate(s.expires_at)}</span>
                    </div>
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
