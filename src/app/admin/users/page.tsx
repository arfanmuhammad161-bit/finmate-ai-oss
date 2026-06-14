"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Users as UsersIcon, Search, Loader2, Trash2, Key, Mail, Target, Bell, Calendar, X, Activity, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton, ListItemSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        const adminEmail = user?.email || '';
        
        const res = await fetch(`/api/admin/users?adminEmail=${encodeURIComponent(adminEmail)}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setUsers(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.telegram_id?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = async (user: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await confirmDialog({
      title: 'Hapus user permanen?',
      message: `Semua data milik ${user.full_name || user.email} akan dihapus permanen dan tidak bisa dipulihkan.`,
      confirmLabel: 'Ya, hapus',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== user.id));
        toast.success('User berhasil dihapus.');
      } else {
        toast.error('Gagal menghapus user.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus user.');
    }
  };

  const planBadgeClass = (plan: string) => {
    const p = plan?.toLowerCase() || '';
    if (p === 'monthly' || p === 'yearly') return 'bg-green-100 text-green-700';
    if (p === 'admin pro' || p === 'admin') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Manajemen User</h2>
            <p className="text-sm text-text-muted mt-0.5">Kelola semua pengguna terdaftar</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Daftar Pengguna ({users.length})</CardTitle>
              <CardDescription>Semua user yang melengkapi profil.</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input 
                placeholder="Cari nama pengguna..." 
                className="pl-9 bg-gray-50" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {[0, 1, 2, 3].map(i => <div key={i} className="px-4 sm:px-6 py-4"><ListItemSkeleton /></div>)}
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-7 w-7" />}
              title={search ? 'Tidak ada hasil' : 'Belum ada pengguna'}
              description={search ? 'Coba kata kunci lain.' : 'User yang mendaftar akan muncul di sini.'}
            />
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-text-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Pengguna</th>
                      <th className="px-4 py-3 font-semibold">Telegram</th>
                      <th className="px-4 py-3 font-semibold">Bergabung</th>
                      <th className="px-4 py-3 font-semibold">Langganan</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                              ) : (
                                user.full_name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-text-main truncate">{user.full_name || 'Tanpa Nama'}</p>
                              <p className="text-xs text-text-muted truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">{user.telegram_id || '—'}</td>
                        <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                          {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", planBadgeClass(user.plan))}>
                            {user.plan || 'Trial'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => handleDeleteUser(user, e)}
                            className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus Akun"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y divide-border">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="px-4 py-3 active:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                          user.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-text-main truncate">{user.full_name || 'Tanpa Nama'}</p>
                          <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", planBadgeClass(user.plan))}>
                            {user.plan || 'Trial'}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[11px] text-text-muted">
                            {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <button
                            onClick={(e) => handleDeleteUser(user, e)}
                            className="text-red-400 hover:text-red-600 active:bg-red-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-gradient-to-br from-primary-600 to-secondary-600 text-white flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center font-bold text-2xl overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    selectedUser.full_name?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.full_name || 'Tanpa Nama'}</h3>
                  <p className="text-primary-100 flex items-center gap-1 text-sm mt-1">
                    <Mail className="h-3 w-3" /> {selectedUser.email}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 text-text-muted mb-1">
                    <Activity className="h-4 w-4 text-primary-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Transaksi</span>
                  </div>
                  <p className="text-2xl font-bold text-text-main">{selectedUser.total_transactions || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 text-text-muted mb-1">
                    <Target className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Financial Goal</span>
                  </div>
                  <p className="text-sm font-semibold text-text-main truncate" title={selectedUser.financial_goal}>{selectedUser.financial_goal || 'Belum diatur'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-text-main uppercase tracking-wider">Detail Informasi</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-text-muted flex items-center gap-2"><Calendar className="h-4 w-4" /> Bergabung Sejak</span>
                    <span className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-text-muted flex items-center gap-2"><Key className="h-4 w-4" /> Telegram ID</span>
                    <span className="font-medium">{selectedUser.telegram_id || 'Belum terhubung'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-text-muted flex items-center gap-2"><Key className="h-4 w-4" /> Telegram Username</span>
                    <span className="font-medium">{selectedUser.telegram_username ? `@${selectedUser.telegram_username}` : '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-text-muted flex items-center gap-2"><Bell className="h-4 w-4" /> Notifikasi Bot</span>
                    <span className="font-medium">{selectedUser.notification_settings?.dailySummary ? 'Aktif' : 'Mati'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-border flex justify-end">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-white border border-border text-text-main rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
