"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Users as UsersIcon, Search, Loader2, Trash2, Key, Mail, Target, Bell, Calendar, X, Activity } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Manajemen User</h2>
        <p className="text-text-muted">Kelola semua pengguna terdaftar di aplikasi FinMate AI.</p>
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
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-text-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Avatar</th>
                    <th className="px-6 py-4 font-medium">Nama Lengkap</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Telegram ID</th>
                    <th className="px-6 py-4 font-medium">Tanggal Daftar</th>
                    <th className="px-6 py-4 font-medium">Status Langganan</th>
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                          ) : (
                            user.full_name?.charAt(0) || 'U'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-text-main">{user.full_name || 'Tidak ada nama'}</td>
                      <td className="px-6 py-4 text-text-muted">{user.email}</td>
                      <td className="px-6 py-4 text-text-muted">{user.telegram_id || '-'}</td>
                      <td className="px-6 py-4 text-text-muted">
                        {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          user.plan?.toLowerCase() === 'monthly' || user.plan?.toLowerCase() === 'yearly' ? 'bg-green-100 text-green-700' : 
                          user.plan === 'Admin Pro' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.plan || 'Trial'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Hapus permanen user ${user.full_name || user.email}?`)) {
                              try {
                                const res = await fetch('/api/user/delete', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: user.id })
                                });
                                if (res.ok) {
                                  setUsers(users.filter(u => u.id !== user.id));
                                  alert('User berhasil dihapus.');
                                } else {
                                  alert('Gagal menghapus user.');
                                }
                              } catch (e) {
                                alert('Error saat menghapus user.');
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
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
          ) : (
            <div className="text-center py-16 text-text-muted">
              <UsersIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Tidak ada data pengguna ditemukan.</p>
            </div>
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
