"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Settings } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Pengaturan Sistem</h2>
        <p className="text-text-muted">Konfigurasi variabel dan sistem inti FinMate.</p>
      </div>
      
      {/* 1. API Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrasi API</CardTitle>
          <CardDescription>Atur kunci API untuk layanan pihak ketiga (Gemini, n8n).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main">Google Gemini API Key</label>
            <div className="flex gap-2">
              <input type="password" placeholder="AIzaSy..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" defaultValue="AIzaSy*************************" />
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700" onClick={() => toast.info('Untuk saat ini, ganti kunci API lewat Vercel Environment Variables. Fitur ini akan tersedia setelah setup database config.')}>Simpan</button>
            </div>
            <p className="text-xs text-text-muted">Gunakan API Key yang memiliki limit cukup untuk menghindari Error 429.</p>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-text-main">n8n Webhook URL (Opsional)</label>
            <div className="flex gap-2">
              <input type="text" placeholder="https://n8n.example.com/webhook/..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700" onClick={() => toast.info('Integrasi n8n sedang dalam pengembangan.')}>Simpan</button>
            </div>
            <p className="text-xs text-text-muted">Untuk menjalankan alur AI kompleks di luar aplikasi utama.</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Pembayaran */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Pembayaran</CardTitle>
          <CardDescription>Integrasi payment gateway (Midtrans/Stripe) untuk langganan paket.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800 text-sm">
            Fitur integrasi pembayaran pihak ketiga saat ini masih <strong>Terkunci (Tahap Pengembangan)</strong>. Pengguna belum bisa menekan tombol langganan untuk checkout otomatis.
          </div>
        </CardContent>
      </Card>
      
      {/* 3. Keamanan */}
      <Card>
        <CardHeader>
          <CardTitle>Keamanan Admin</CardTitle>
          <CardDescription>Ganti kata sandi utama untuk masuk ke dasbor admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main">Kata Sandi Baru</label>
            <input type="password" placeholder="Minimal 6 karakter" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700" onClick={() => toast.info('Untuk ganti password admin, gunakan halaman Settings di dashboard user.')}>Update Password</button>
        </CardContent>
      </Card>
    </div>
  );
}
