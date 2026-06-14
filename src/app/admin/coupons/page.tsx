"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Trash2, Ticket, Copy, Share2, Tag, Layers, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [codeType, setCodeType] = useState('single'); // single or unique
  const [code, setCode] = useState('');
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const [maxUses, setMaxUses] = useState('100');
  
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [voucherType, setVoucherType] = useState('langganan');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [applicablePlan, setApplicablePlan] = useState('all');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (res.ok) setCoupons(data.coupons || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PROMO-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Berhasil disalin ke clipboard.');
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !discountValue || !validFrom || !validUntil) {
      toast.warning('Harap isi semua kolom wajib (bertanda *).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code: code.toUpperCase(),
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          max_uses: hasMaxUses ? parseInt(maxUses) : 999999,
          valid_from: new Date(validFrom).toISOString(),
          valid_until: new Date(validUntil).toISOString(),
          max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
          min_purchase_amount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
          voucher_type: voucherType,
          applicable_plan: applicablePlan
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat kupon');

      toast.success('Kupon berhasil dibuat.');
      // Reset form
      setName('');
      setCode('');
      setDiscountValue('');
      setMaxDiscountAmount('');
      setMinPurchaseAmount('');
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat kupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Hapus kupon?',
      message: 'Kupon akan dihapus dari sistem dan tidak bisa digunakan lagi.',
      confirmLabel: 'Hapus',
      tone: 'danger',
    });
    if (!ok) return;

    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus kupon');
      toast.success('Kupon berhasil dihapus.');
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus kupon.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/settings?coupon=${code}` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
          <Ticket className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Kupon & Promo</h2>
          <p className="text-sm text-text-muted mt-0.5">Buat & kelola kode promo untuk user</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 card-depth">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="hidden sm:inline text-xs text-text-muted font-semibold uppercase tracking-wider shrink-0">URL Promo:</span>
          <div className="bg-gray-50 px-3 py-2 rounded-lg flex-1 text-text-muted truncate font-mono text-xs border border-gray-100">
            {code ? shareUrl : 'Buat kupon dulu untuk dapat URL...'}
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-primary-600 border-primary-200 hover:bg-primary-50 shrink-0" onClick={() => handleCopy(shareUrl)} disabled={!code}>
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Salin URL
        </Button>
      </div>

      <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KOLOM KIRI */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800">Buat Voucher</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Kode voucher yang Anda buat akan berlaku untuk semua item yang memenuhi syarat di keranjang belanja Anda.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700"><span className="text-red-500">*</span> Nama Voucher</label>
                <Input 
                  placeholder="Masukkan Nama Voucher" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Pilih Jenis Kode Voucher</label>
                <div className="space-y-3">
                  <div 
                    onClick={() => setCodeType('single')}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      codeType === 'single' ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Tag className={cn("h-5 w-5 mt-0.5", codeType === 'single' ? "text-emerald-600" : "text-gray-400")} />
                    <div>
                      <h4 className={cn("font-semibold text-sm", codeType === 'single' ? "text-emerald-800" : "text-gray-700")}>Kode Voucher Tunggal</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Satu kode untuk berbagai kegunaan</p>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setCodeType('unique')}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all opacity-60",
                      codeType === 'unique' ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Layers className={cn("h-5 w-5 mt-0.5", codeType === 'unique' ? "text-emerald-600" : "text-gray-400")} />
                    <div>
                      <h4 className={cn("font-semibold text-sm", codeType === 'unique' ? "text-emerald-800" : "text-gray-700")}>Hasilkan Kode Unik</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Buat beberapa kode unik untuk sekali pakai. (Segera Hadir)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700"><span className="text-red-500">*</span> Kode</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Buat kode voucher" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="bg-gray-50 uppercase font-mono"
                    required
                  />
                  <Button type="button" onClick={generateRandomCode} variant="outline" className="shrink-0 text-gray-600 border-gray-300" title="Generate Random">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button type="button" onClick={() => handleCopy(code)} className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 px-6">
                    Menyalin
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-semibold text-gray-700">Jumlah Voucher Tetap</label>
                <button 
                  type="button"
                  onClick={() => setHasMaxUses(!hasMaxUses)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    hasMaxUses ? "bg-emerald-500" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm",
                    hasMaxUses ? "translate-x-5.5 left-0.5" : "translate-x-0 left-0.5"
                  )} />
                </button>
              </div>
              
              {hasMaxUses && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-medium text-gray-500">Kuota Maksimal Pemakaian</label>
                  <Input 
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="bg-gray-50"
                    min="1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800">Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700"><span className="text-red-500">*</span> Waktu Promosi</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="datetime-local" 
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="bg-gray-50"
                    required
                  />
                  <span className="text-gray-400 text-sm">hingga</span>
                  <Input 
                    type="datetime-local" 
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="bg-gray-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700"><span className="text-red-500">*</span> Jenis Voucher</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value)}
                >
                  <option value="langganan">Diskon Langganan FinMate Pro</option>
                  <option value="umum">Voucher Umum</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700"><span className="text-red-500">*</span> Target Paket (Khusus Langganan)</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={applicablePlan}
                  onChange={(e) => setApplicablePlan(e.target.value)}
                  disabled={voucherType !== 'langganan'}
                >
                  <option value="all">Berlaku untuk Semua Paket</option>
                  <option value="monthly">Khusus Paket 1 Bulan</option>
                  <option value="yearly">Khusus Paket 1 Tahun</option>
                </select>
                <p className="text-xs text-gray-500">Kupon ini hanya bisa digunakan oleh pembeli paket yang sesuai.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700"><span className="text-red-500">*</span> Pembelian</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                >
                  <option value="percent">Diskon Persentase (%)</option>
                  <option value="fixed">Diskon Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700"><span className="text-red-500">*</span> Nilai Diskon</label>
                  <div className="relative">
                    <Input 
                      type="number"
                      placeholder="Masukkan Angka" 
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="bg-gray-50 pl-12"
                      required
                      min="1"
                      max={discountType === 'percent' ? "100" : undefined}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      {discountType === 'percent' ? '%' : 'IDR'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Jumlah Diskon Maksimum</label>
                  <div className="relative">
                    <Input 
                      type="number"
                      placeholder="Masukkan Jumlah" 
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      className="bg-gray-50 pl-12"
                      disabled={discountType === 'fixed'}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">IDR</div>
                  </div>
                  {discountType === 'fixed' && <p className="text-xs text-gray-400 mt-1">Hanya untuk diskon persen</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Jumlah Pembelian Minimum</label>
                <div className="relative">
                  <Input 
                    type="number"
                    placeholder="Masukkan Jumlah" 
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    className="bg-gray-50 pl-12 max-w-[50%]"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">IDR</div>
                </div>
              </div>

            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-12 rounded-xl font-semibold shadow-lg shadow-emerald-500/20" disabled={submitting}>
              {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Ticket className="h-5 w-5 mr-2" />}
              Simpan Voucher
            </Button>
          </div>
        </div>
      </form>

      {/* TABLE SECTION */}
      <Card className="shadow-sm border-gray-100 mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Daftar Voucher Aktif</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-y border-gray-100">
                <tr>
                  <th className="px-6 py-4">NAMA & KODE</th>
                  <th className="px-6 py-4">NILAI DISKON</th>
                  <th className="px-6 py-4">MASA BERLAKU</th>
                  <th className="px-6 py-4">TERPAKAI</th>
                  <th className="px-6 py-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Memuat data voucher...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Belum ada voucher yang dibuat.
                    </td>
                  </tr>
                ) : coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{c.name || 'Voucher FinMate'}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-emerald-600 font-mono text-xs font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-100">
                        <Ticket className="h-3 w-3" />
                        {c.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {c.discount_type === 'percent' ? (
                        <div>
                          <span className="text-emerald-700 font-bold">{c.discount_value}%</span>
                          {c.max_discount_amount && <div className="text-xs text-gray-500 font-normal mt-0.5">Maks Rp{c.max_discount_amount.toLocaleString('id-ID')}</div>}
                        </div>
                      ) : (
                        <span>Rp{parseInt(c.discount_value).toLocaleString('id-ID')}</span>
                      )}
                      {c.min_purchase_amount && <div className="text-xs text-gray-500 font-normal mt-0.5">Min Rp{c.min_purchase_amount.toLocaleString('id-ID')}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      <div>Dari: {c.valid_from ? new Date(c.valid_from).toLocaleDateString('id-ID') : '-'}</div>
                      <div>Sampai: {c.valid_until ? new Date(c.valid_until).toLocaleDateString('id-ID') : '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      <span className={c.used_count >= c.max_uses ? "text-red-500 font-bold bg-red-50 px-2 py-1 rounded" : "bg-gray-100 px-2 py-1 rounded"}>
                        {c.used_count} / {c.max_uses > 10000 ? '∞' : c.max_uses}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteCoupon(c.id)}
                        disabled={deleteLoading === c.id}
                      >
                        {deleteLoading === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
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
