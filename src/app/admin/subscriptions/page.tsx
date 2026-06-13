"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CreditCard, Loader2, Crown, Clock, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Subscriptions</h2>
        <p className="text-text-muted">Kelola langganan Pro dan Trial pengguna.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Crown className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-green-800">Pro Aktif</p>
                <p className="text-2xl font-bold text-green-900">{subs.filter(s => s.status === 'active' && s.plan !== 'trial').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-orange-800">Trial Aktif</p>
                <p className="text-2xl font-bold text-orange-900">{subs.filter(s => s.status === 'active' && s.plan === 'trial').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Ban className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-red-800">Kadaluarsa</p>
                <p className="text-2xl font-bold text-red-900">{subs.filter(s => s.status !== 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Langganan</CardTitle>
          <CardDescription>Semua riwayat paket langganan pengguna FinMate.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Pengguna</th>
                    <th className="px-6 py-4 font-medium">Paket</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Berakhir Pada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                        Belum ada data langganan
                      </td>
                    </tr>
                  ) : (
                    subs.map((s) => (
                      <tr key={s.id} className="bg-white hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text-main">{s.full_name}</p>
                          <p className="text-xs text-text-muted">{s.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase tracking-wider", 
                            s.plan === 'trial' ? "bg-orange-100 text-orange-700" : "bg-primary-100 text-primary-700")}>
                            {s.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", 
                            s.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-muted">
                          {formatDate(s.expires_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
