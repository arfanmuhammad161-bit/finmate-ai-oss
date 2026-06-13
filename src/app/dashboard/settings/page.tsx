"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  User, Bell, CreditCard, Bot, Shield, LogOut,
  CheckCircle2, AlertCircle, ExternalLink, Copy, Clock, Crown, Zap, Loader2, X, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const tabs = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'subscription', label: 'Langganan', icon: CreditCard },
  { id: 'telegram', label: 'Telegram Bot', icon: Bot },
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
  { id: 'security', label: 'Keamanan', icon: Shield },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted animate-pulse">Memuat pengaturan...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const [telegramConnected, setTelegramConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ full_name: '', email: '', avatar_url: '', telegram_id: '' });
  const [sub, setSub] = useState<{ plan: string; expires_at: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('FIN-...');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    budgetAlert: true,
    dailySummary: true,
    weeklySummary: false,
    trialReminder: true,
    aiTips: false
  });

  const NOTIF_CONFIG = [
    { key: 'budgetAlert', label: 'Notifikasi Budget Hampir Habis', desc: 'Dapatkan peringatan saat budget kategori mencapai 80%' },
    { key: 'dailySummary', label: 'Ringkasan Harian', desc: 'Laporan singkat pengeluaran hari ini via Telegram' },
    { key: 'weeklySummary', label: 'Ringkasan Mingguan', desc: 'Analisis keuangan setiap hari Senin pagi' },
    { key: 'trialReminder', label: 'Reminder Trial Berakhir', desc: 'Pengingat 7, 3, dan 1 hari sebelum trial habis' },
    { key: 'aiTips', label: 'Tips Keuangan AI', desc: 'Saran dan tips hemat personal dari AI' },
  ] as const;
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  
  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly'|'yearly'|null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount_type: string, discount_value: number, min_purchase_amount?: number, max_discount_amount?: number} | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  const AVATAR_OPTIONS = [
    'Milo', 'Abby', 'Buster', 'Lucy', 'Gizmo', 'Loki', 
    'Max', 'Bella', 'Toby', 'Oliver', 'Chloe', 'Charlie'
  ].map(seed => `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=transparent`);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('profiles').select('full_name, telegram_id, avatar_url').eq('id', user.id).single(),
      supabase.from('subscriptions').select('plan, expires_at').eq('user_id', user.id).eq('status', 'active').single()
    ]);
    
    // Fetch payments
    try {
      const res = await fetch('/api/user/payments');
      if (res.ok) {
        const payments = await res.json();
        setPaymentHistory(Array.isArray(payments) ? payments : []);
      }
    } catch (e) {
      console.error(e);
    }
    
    // Fetch settings
    try {
      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const { settings } = await res.json();
        if (settings) setNotifSettings(settings);
      }
    } catch (e) {
      console.error(e);
    }
    
    setProfile({ full_name: p?.full_name || '', email: user.email || '', avatar_url: p?.avatar_url || '', telegram_id: p?.telegram_id || '' });
    setSub(s);
    setTelegramConnected(!!p?.telegram_id);
    setVerificationCode(`FIN-${user.id.substring(0, 8).toUpperCase()}`);
    setIsAdmin(user.email?.toLowerCase().trim() === 'arfanmuhammad161@gmail.com');
    setLoading(false);
  }, []);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  const handlePayment = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
    setShowPaymentModal(true);
  };

  const getBasePrice = () => selectedPlan === 'monthly' ? 29000 : 249000;
  
  const getFinalPrice = () => {
    const base = getBasePrice();
    if (!appliedCoupon) return base;
    
    // Check if base price meets minimum purchase amount
    if (appliedCoupon.min_purchase_amount && base < appliedCoupon.min_purchase_amount) {
      return base; // Or we could show an error elsewhere, but for now we ignore the coupon if it doesn't meet minimum
    }

    if (appliedCoupon.discount_type === 'percent') {
      let discountAmount = base * appliedCoupon.discount_value / 100;
      // Apply max discount cap if it exists
      if (appliedCoupon.max_discount_amount && discountAmount > appliedCoupon.max_discount_amount) {
        discountAmount = appliedCoupon.max_discount_amount;
      }
      return Math.max(0, base - discountAmount);
    }
    
    return Math.max(0, base - appliedCoupon.discount_value);
  };

  const isFree = getFinalPrice() === 0;

  const validateCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, plan: selectedPlan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kupon tidak valid');
      
      const base = getBasePrice();
      if (data.coupon.min_purchase_amount && base < data.coupon.min_purchase_amount) {
        throw new Error(`Kupon ini mensyaratkan minimum pembelian Rp${data.coupon.min_purchase_amount.toLocaleString('id-ID')}`);
      }
      
      setAppliedCoupon(data.coupon);
      setCouponError('');
    } catch (e: any) {
      setCouponError(e.message);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const submitPaymentProof = async () => {
    if (!isFree && !paymentProof) {
      alert('Harap unggah bukti transfer terlebih dahulu.');
      return;
    }
    try {
      setSubmittingPayment(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      let publicUrl = '';
      
      // Jika tidak gratis 100%, upload bukti
      if (!isFree && paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(fileName, paymentProof);

        if (uploadError) throw new Error('Gagal mengunggah bukti transfer: ' + uploadError.message);
        const { data } = supabase.storage.from('payment_proofs').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      // Catat ke tabel payments via API
      const res = await fetch('/api/payment/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: selectedPlan, 
          proof_url: publicUrl,
          coupon_code: appliedCoupon?.code
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan data pembayaran');

      if (isFree) {
        alert('Kupon berhasil diklaim! Paket langganan Anda sudah aktif.');
        window.location.reload();
      } else {
        alert('Bukti transfer berhasil dikirim! Silakan tunggu verifikasi admin (maks. 1x24 jam).');
        setShowPaymentModal(false);
        setPaymentProof(null);
        setAppliedCoupon(null);
        loadData(); // Refresh history
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ full_name: profile.full_name, avatar_url: profile.avatar_url }).eq('id', user.id);
    setSaveSuccess(true);
    setSavingProfile(false);
    setTimeout(() => {
      setSaveSuccess(false);
      window.location.reload(); // Reload to update sidebar
    }, 1000);
  };

  const handleSelectAvatar = (url: string) => {
    setProfile(p => ({ ...p, avatar_url: url }));
    setShowAvatarModal(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trialDaysLeft = sub?.expires_at
    ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  const expiresDateStr = sub?.expires_at
    ? new Date(sub.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Pengaturan</h2>
        <p className="text-text-muted">Kelola akun, langganan, dan preferensi Anda.</p>
      </div>

      {/* Trial Banner */}
      {!isAdmin && sub?.plan === 'trial' && trialDaysLeft <= 7 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900">Trial Gratis Anda — {trialDaysLeft} Hari Tersisa</p>
                  <p className="text-sm text-orange-700">Upgrade sekarang untuk menjaga akses semua fitur AI.</p>
                </div>
              </div>
              <Button variant="gradient" size="sm" className="shrink-0" onClick={() => setActiveTab('subscription')}>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        activeTab === tab.id
                          ? "bg-primary-50 text-primary-600"
                          : "text-text-muted hover:bg-gray-50 hover:text-text-main"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary-600" : "text-gray-400")} />
                      {tab.label}
                    </button>
                  );
                })}
                <div className="pt-2 border-t border-border mt-2">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content */}
        <div className="flex-1 space-y-6">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Profil</CardTitle>
                  <CardDescription>Perbarui informasi dasar akun Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-500 shadow-sm border border-primary-100 overflow-hidden">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt="Avatar"
                            className="h-full w-full object-cover scale-110"
                          />
                        ) : (
                          <span className="text-4xl font-bold text-white bg-gradient-to-br from-primary-500 to-secondary-500 w-full h-full flex items-center justify-center">
                            {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => setShowAvatarModal(true)}
                        className="absolute -bottom-3 bg-white hover:bg-gray-50 text-primary-600 px-3 py-1 rounded-full border border-border text-xs font-semibold w-max left-1/2 -translate-x-1/2 shadow-sm transition-colors"
                      >
                        Ubah Avatar
                      </button>
                    </div>
                    <div className="text-center sm:text-left mt-2 sm:mt-4 space-y-1">
                      <p className="text-lg font-bold text-text-main">{profile.full_name || 'User'}</p>
                      <p className="text-sm text-text-muted">{profile.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-text-main">Nama Lengkap</label>
                      <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-text-main">Email</label>
                      <Input type="email" value={profile.email} disabled className="bg-gray-50" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    {saveSuccess && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />Tersimpan!</span>}
                    <Button variant="gradient" onClick={handleSaveProfile} disabled={savingProfile}>
                      {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Avatar Modal */}
              {showAvatarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAvatarModal(false)} />
                  <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-6 border-b border-border">
                      <div>
                        <h3 className="text-xl font-bold text-text-main">Pilih Avatar Anda</h3>
                        <p className="text-sm text-text-muted">Pilih satu identitas virtual yang paling cocok dengan Anda.</p>
                      </div>
                      <button onClick={() => setShowAvatarModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {AVATAR_OPTIONS.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectAvatar(url)}
                            className={cn(
                              "relative aspect-square rounded-2xl border-2 overflow-hidden transition-all hover:scale-105",
                              profile.avatar_url === url 
                                ? "border-primary-500 shadow-md ring-2 ring-primary-500/20 bg-primary-50" 
                                : "border-gray-100 bg-gray-50 hover:border-primary-200 hover:bg-primary-50/50"
                            )}
                          >
                            <img src={url} alt={`Avatar ${i+1}`} className="w-full h-full object-cover scale-110" />
                            {profile.avatar_url === url && (
                              <div className="absolute top-2 right-2 h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white">
                                <CheckCircle2 className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Status Langganan Anda</CardTitle>
                  <CardDescription>Kelola paket dan pembayaran Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100 rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full", isAdmin ? 'bg-amber-100 text-amber-700' : sub?.plan === 'trial' ? 'bg-orange-100 text-orange-700' : sub?.plan ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                            {isAdmin ? 'Admin Pro' : sub?.plan === 'trial' ? 'Trial Aktif' : sub?.plan === 'monthly' ? 'Pro Bulanan' : sub?.plan === 'yearly' ? 'Pro Tahunan' : 'Memuat...'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-text-main">
                          {isAdmin ? 'Akses Penuh Selamanya (Pro Lifetime)' : sub?.plan === 'trial' ? 'Free Trial — 14 Hari' : sub?.plan === 'monthly' ? 'Paket Bulanan' : sub?.plan === 'yearly' ? 'Paket Tahunan' : 'Memuat paket...'}
                        </h3>
                        {!isAdmin && <p className="text-text-muted text-sm mt-1">Berakhir pada <strong>{expiresDateStr}</strong></p>}
                      </div>
                      {!isAdmin && sub?.plan === 'trial' && (
                        <div className="text-4xl font-bold text-primary-600">{trialDaysLeft}<span className="text-lg text-text-muted"> hari</span></div>
                      )}
                    </div>
                  </div>

                  {!isAdmin && (
                    <div>
                      <h4 className="font-semibold text-text-main mb-4">Pilih Paket</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border-2 border-primary-500 rounded-2xl p-5 bg-primary-50/50 relative">
                          <div className="absolute -top-3 left-4 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">POPULER</div>
                          <h3 className="text-lg font-bold text-text-main mt-2">Paket Bulanan</h3>
                          <div className="text-3xl font-bold text-primary-600 my-2">Rp 29.000<span className="text-sm text-text-muted font-normal">/bulan</span></div>
                          <ul className="text-sm text-text-muted space-y-2 mb-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Semua fitur AI</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Telegram Bot 24/7</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Laporan PDF & Google Doc</li>
                          </ul>
                          <Button variant="gradient" className="w-full" onClick={() => handlePayment('monthly')}>
                            Pilih Paket Ini
                          </Button>
                        </div>
                        <div className="border border-border rounded-2xl p-5 bg-white">
                          <h3 className="text-lg font-bold text-text-main">Paket Tahunan</h3>
                          <div className="text-3xl font-bold text-text-main my-2">Rp 249.000<span className="text-sm text-text-muted font-normal">/tahun</span></div>
                          <div className="text-xs text-green-600 font-semibold mb-2 bg-green-50 px-2 py-1 rounded w-fit">Hemat 28%!</div>
                          <ul className="text-sm text-text-muted space-y-2 mb-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Semua fitur Bulanan</li>
                            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Prioritas support</li>
                            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Analisis lebih mendalam</li>
                          </ul>
                          <Button variant="outline" className="w-full" onClick={() => handlePayment('yearly')}>
                            Pilih Paket Ini
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-text-main mb-4">Histori Pembayaran</h4>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Tanggal</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Paket</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Jumlah</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {paymentHistory.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-6 text-center text-text-muted">Belum ada riwayat pembayaran.</td></tr>
                          ) : paymentHistory.map((p: any) => (
                            <tr key={p.id} className="bg-white hover:bg-gray-50">
                              <td className="px-4 py-3 text-text-muted">
                                {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-text-main font-medium capitalize">{p.plan}</td>
                              <td className="px-4 py-3 text-text-main font-semibold">Rp{parseInt(p.amount).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  p.status === 'LUNAS' ? "bg-green-100 text-green-700" : p.status === 'PENDING' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                )}>{p.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modal Pembayaran Manual */}
              {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submittingPayment && setShowPaymentModal(false)} />
                  <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                      <h3 className="text-xl font-bold text-text-main">Transfer Pembayaran</h3>
                      <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted transition-colors" disabled={submittingPayment}>
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-5 space-y-5">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                        <p className="text-sm font-medium text-blue-900 mb-1">Total Tagihan:</p>
                        {appliedCoupon && (
                          <p className="text-sm font-semibold text-text-muted line-through mb-1">
                            Rp {getBasePrice().toLocaleString('id-ID')}
                          </p>
                        )}
                        <p className="text-3xl font-bold text-primary-600">
                          Rp {getFinalPrice().toLocaleString('id-ID')}
                        </p>
                        {appliedCoupon && (
                          <div className="mt-2 inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">
                            Diskon Diterapkan
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text-main">Kode Promo / Kupon (Opsional)</label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Masukkan kode..." 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            disabled={!!appliedCoupon || validatingCoupon || submittingPayment}
                          />
                          {!appliedCoupon ? (
                            <Button 
                              variant="secondary" 
                              onClick={validateCoupon} 
                              disabled={!couponCode || validatingCoupon || submittingPayment}
                            >
                              {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Terapkan'}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="text-red-500 hover:text-red-600"
                              onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                              disabled={submittingPayment}
                            >
                              Hapus
                            </Button>
                          )}
                        </div>
                        {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
                      </div>

                      {!isFree && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-text-main mb-3">Silakan transfer sesuai nominal ke salah satu rekening berikut:</p>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-gray-50">
                                <div>
                                  <p className="font-bold text-text-main">DANA / GoPay</p>
                                  <p className="font-mono text-sm text-text-muted">081222134103</p>
                                </div>
                                <div className="text-right text-xs font-semibold text-text-muted uppercase">a/n Muhammad Arfan</div>
                              </div>
                              <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-gray-50">
                                <div>
                                  <p className="font-bold text-text-main">Bank BRI</p>
                                  <p className="font-mono text-sm text-text-muted">4043 0102 0430 534</p>
                                </div>
                                <div className="text-right text-xs font-semibold text-text-muted uppercase">a/n Muhammad Arfan</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-text-main">Upload Bukti Transfer</label>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                              disabled={submittingPayment}
                            />
                            <p className="text-xs text-text-muted">Format: JPG, PNG maksimal 2MB.</p>
                          </div>
                        </>
                      )}

                      <Button 
                        variant="gradient" 
                        className="w-full" 
                        onClick={submitPaymentProof}
                        disabled={submittingPayment || (!isFree && !paymentProof)}
                      >
                        {submittingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {submittingPayment 
                          ? 'Memproses...' 
                          : isFree 
                            ? 'Klaim Paket Gratis' 
                            : 'Kirim Bukti Pembayaran'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Telegram Tab */}
          {activeTab === 'telegram' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary-600" />
                    Koneksi Telegram Bot
                  </CardTitle>
                  <CardDescription>
                    Hubungkan akun Telegram Anda untuk mencatat transaksi melalui chat bot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!telegramConnected ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                        <h3 className="font-bold text-blue-900 mb-4">Cara Menghubungkan:</h3>
                        <ol className="space-y-4 text-sm text-blue-800">
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                            <span>Buka Telegram dan cari bot: <strong>@FinMateApp_Bot</strong></span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                            <span>Kirim perintah <strong>/start</strong> ke bot tersebut</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
                            <span>Salin kode verifikasi di bawah dan kirimkan ke bot</span>
                          </li>
                        </ol>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-text-main">Kode Verifikasi Anda</label>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 font-mono text-lg font-bold tracking-[0.3em] bg-gray-50 border border-border rounded-xl px-4 py-3 text-center text-primary-600">
                            {verificationCode}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(verificationCode)}
                            className="shrink-0"
                          >
                            {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-text-muted mt-2">Kode unik akun Anda</p>
                      </div>

                      <a 
                        href="https://t.me/FinMateApp_Bot" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        Buka @FinMateApp_Bot di Telegram
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl p-4">
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-green-900">Telegram Terhubung!</p>
                          <p className="text-sm text-green-700">{profile.telegram_id ? `@${profile.telegram_id}` : 'Terhubung'}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-border rounded-xl p-4 space-y-2">
                        <h4 className="font-semibold text-text-main text-sm">Cara Mencatat via Telegram:</h4>
                        <p className="text-sm text-text-muted">💬 Teks: <span className="font-mono bg-white px-2 py-0.5 rounded border">"makan siang 35rb"</span></p>
                        <p className="text-sm text-text-muted">📸 Foto struk → AI baca otomatis</p>
                        <p className="text-sm text-text-muted">🎤 Voice note → ditranskripsi & dicatat</p>
                        <p className="text-sm text-text-muted">📊 Ketik <span className="font-mono bg-white px-2 py-0.5 rounded border">/laporan</span> untuk ringkasan bulanan</p>
                      </div>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setTelegramConnected(false); alert('Koneksi Telegram telah diputuskan.'); }}>
                        Putuskan Koneksi Telegram
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Notifikasi</CardTitle>
                <CardDescription>Pilih notifikasi yang ingin Anda terima.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {NOTIF_CONFIG.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-text-main">{item.label}</p>
                      <p className="text-sm text-text-muted">{item.desc}</p>
                    </div>
                    <div
                      onClick={async () => {
                        const newSettings = { ...notifSettings, [item.key]: !notifSettings[item.key as keyof typeof notifSettings] };
                        setNotifSettings(newSettings);
                        try {
                          await fetch('/api/user/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ settings: newSettings })
                          });
                        } catch (e) {
                          console.error('Gagal menyimpan pengaturan');
                        }
                      }}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
                        notifSettings[item.key as keyof typeof notifSettings] ? "bg-primary-600" : "bg-gray-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all",
                        notifSettings[item.key as keyof typeof notifSettings] ? "left-6" : "left-1"
                      )} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Keamanan Akun</CardTitle>
                <CardDescription>Jaga keamanan akun FinMate AI Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-main">Password Lama</label>
                    <Input type="password" placeholder="••••••••" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-main">Password Baru</label>
                    <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-main">Konfirmasi Password Baru</label>
                    <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="gradient" onClick={async () => {
                      if (!oldPassword || !newPassword || !confirmPassword) { alert('Semua field harus diisi.'); return; }
                      if (newPassword !== confirmPassword) { alert('Password baru dan konfirmasi tidak cocok.'); return; }
                      if (newPassword.length < 6) { alert('Password baru minimal 6 karakter.'); return; }
                      const supabase = createClient();
                      const { error } = await supabase.auth.updateUser({ password: newPassword });
                      if (error) { alert('Gagal mengubah password: ' + error.message); } else { alert('Password berhasil diubah!'); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }
                    }}>Ubah Password</Button>
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-red-700">Hapus Akun</h4>
                      <p className="text-sm text-text-muted mt-1">Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data Anda.</p>
                    </div>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 shrink-0" onClick={async () => {
                      if (window.confirm('Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan dan semua data Anda akan hilang.')) {
                        try {
                          const supabase = createClient();
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) return;
                          
                          const res = await fetch('/api/user/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id })
                          });
                          
                          if (res.ok) {
                            await supabase.auth.signOut();
                            router.push('/login');
                          } else {
                            alert('Gagal menghapus akun.');
                          }
                        } catch (e) {
                          alert('Terjadi kesalahan saat menghapus akun.');
                        }
                      }
                    }}>
                      Hapus Akun
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
