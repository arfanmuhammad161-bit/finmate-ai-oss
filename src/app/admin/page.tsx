"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, UserPlus, CreditCard, TrendingUp, DollarSign, Download, Loader2, LayoutDashboard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/Toast';
import { Skeleton, CardSkeleton, StatsGridSkeleton } from '@/components/ui/Skeleton';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        const adminEmail = user?.email || '';
        
        const res = await fetch(`/api/admin/metrics?adminEmail=${encodeURIComponent(adminEmail)}`);
        const data = await res.json();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="space-y-2"><Skeleton className="h-7 w-44" /><Skeleton className="h-3.5 w-72" /></div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <StatsGridSkeleton count={4} />
        <CardSkeleton className="h-72" />
      </div>
    );
  }

  const formatRupiah = (n: number) => `Rp${(n || 0).toLocaleString('id-ID')}`;

  const handleExportData = () => {
    if (!metrics || !metrics.recentUsers || metrics.recentUsers.length === 0) {
      toast.warning('Tidak ada data user untuk diekspor.');
      return;
    }

    const headers = ["ID,Nama,Email,Paket,Status,Tanggal Bergabung"];
    const rows = metrics.recentUsers.map((u: any) => 
      `${u.id},"${u.name || ''}","${u.email || ''}","${u.plan || ''}","${u.status || ''}","${u.joinDate || ''}"`
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join('\n'), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinMate_Users_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Admin Overview</h2>
            <p className="text-sm text-text-muted mt-0.5">Pantau pertumbuhan & metrik utama aplikasi</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="bg-white" onClick={() => router.push('/dashboard')}>
            <span className="hidden sm:inline">Kembali ke </span>User
          </Button>
          <Button variant="outline" size="sm" className="bg-white" onClick={handleExportData}>
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metric Cards — compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total User', value: metrics?.totalUsers || 0, icon: Users, bg: 'bg-blue-50', tx: 'text-blue-600', sub: 'Dari Supabase Auth' },
          { label: 'User Trial', value: metrics?.activeTrials || 0, icon: UserPlus, bg: 'bg-orange-50', tx: 'text-orange-600', sub: 'Selain admin' },
          { label: 'User Pro', value: metrics?.proUsers || 1, icon: CreditCard, bg: 'bg-purple-50', tx: 'text-purple-600', sub: 'Akses penuh' },
          { label: 'Volume Tx', value: formatRupiah(metrics?.totalVolume || 0), icon: DollarSign, bg: 'bg-green-50', tx: 'text-green-600', sub: 'Total aktivitas' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", m.bg, m.tx)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-text-muted">{m.label}</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-text-main tabular-nums truncate">
                  {m.value}
                </div>
                <p className="text-[10px] sm:text-xs text-text-muted mt-1 truncate">{m.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pertumbuhan User</CardTitle>
            <CardDescription>Akumulasi total user per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Area type="monotone" dataKey="users" name="Total User" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Volume</CardTitle>
            <CardDescription>Volume transaksi bulanan (Riil dari Database)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `${value/1000000}M`} />
                  <Tooltip 
                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Volume']}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                  />
                  <Area type="monotone" dataKey="revenue" name="Volume" stroke="#22c55e" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Terdaftar</CardTitle>
            <CardDescription>Daftar pendaftaran user baru dari Supabase</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>Lihat Semua</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted uppercase bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Nama User</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Bergabung</th>

                </tr>
              </thead>
              <tbody>
                {metrics?.recentUsers?.map((user: any) => (
                  <tr key={user.id} className="bg-white border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-main">{user.name}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        user.plan.includes('Pro') ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1",
                        user.status === 'Active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", user.status === 'Active' ? "bg-green-600" : "bg-red-600")} />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {user.joinDate}
                    </td>

                  </tr>
                ))}
                {(!metrics?.recentUsers || metrics.recentUsers.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                      Belum ada user mendaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
