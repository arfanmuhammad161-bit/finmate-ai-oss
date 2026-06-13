"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { TrendingUp, Loader2, DollarSign, Users, CreditCard } from 'lucide-react';

export default function AdminRevenuePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(res => res.json())
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatRupiah = (n: number) => `Rp${(n || 0).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Laporan Pendapatan</h2>
        <p className="text-text-muted">Statistik pendapatan langganan aplikasi secara real-time.</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-primary-100 font-medium mb-1">Total Pendapatan Kotor</p>
                    <h3 className="text-3xl font-bold">{formatRupiah(data?.totalRevenue)}</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-text-muted font-medium mb-1">Total Pelanggan Berbayar</p>
                    <h3 className="text-3xl font-bold text-text-main">{data?.totalPaidUsers || 0}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-text-muted font-medium mb-1">Paket Tahunan Terjual</p>
                    <h3 className="text-3xl font-bold text-text-main">{data?.yearlyCount || 0}</h3>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grafik Pendapatan</CardTitle>
              <CardDescription>Visualisasi pertumbuhan akan tersedia saat data lebih dari 1 bulan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-text-muted bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Belum cukup data untuk membuat grafik tren (membutuhkan min. 2 bulan berjalan).</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
