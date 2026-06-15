"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageSquare, Send, Bell, Loader2, CheckCircle2, Smartphone } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!title || !message) return;
    setSending(true);
    
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      });
      
      if (res.ok) {
        const data = await res.json().catch(() => ({} as any));
        setSuccess(true);
        setTitle('');
        setMessage('');
        const tgInfo = typeof data.telegramSent === 'number'
          ? ` In-app: ${data.count} user · Telegram: ${data.telegramSent} terkirim${data.telegramFailed > 0 ? `, ${data.telegramFailed} gagal` : ''}.`
          : '';
        toast.success(`Broadcast terkirim!${tgInfo}`);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        toast.error('Gagal mengirim broadcast. Silakan coba lagi.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">Kirim Broadcast</h2>
          <p className="text-sm text-text-muted mt-0.5">Pengumuman massal ke seluruh user via in-app</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tulis Pesan Notifikasi</CardTitle>
              <CardDescription>Pesan ini akan muncul di menu lonceng notifikasi semua pengguna.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Broadcast berhasil dikirim!</p>
                    <p className="text-xs text-green-700/80 mt-0.5">Pesan masuk ke notif in-app + chat Telegram user yang sudah terhubung.</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 text-blue-900 p-3 rounded-xl flex items-start gap-2 text-xs">
                <Send className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Broadcast akan terkirim ke <strong>2 tempat sekaligus</strong>: notif lonceng web app + chat Telegram user yang sudah connect bot.</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main">Judul Notifikasi</label>
                <Input 
                  placeholder="Contoh: Fitur AI Baru Telah Hadir!" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-main">Isi Pesan</label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs font-semibold bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 text-purple-700"
                    onClick={async () => {
                      if (!title && !message) return;
                      setSending(true);
                      try {
                        const res = await fetch('/api/admin/broadcast/ai', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title, message })
                        });
                        const data = await res.json();
                        if (data.title) setTitle(data.title);
                        if (data.message) setMessage(data.message);
                      } catch (e) {
                        toast.error('Gagal merapikan pesan dengan AI. Cek koneksi atau coba lagi.');
                      } finally {
                        setSending(false);
                      }
                    }}
                    disabled={sending || (!title && !message)}
                  >
                    ✨ Rapikan dengan AI
                  </Button>
                </div>
                <textarea 
                  className="w-full h-32 rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Ketik pengumuman Anda di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="gradient" onClick={handleSend} disabled={!title || !message || sending}>
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {sending ? 'Memproses...' : 'Kirim ke Semua User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="bg-gray-50 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm">Preview Notifikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex gap-3 relative">
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                <div className="mt-1 shrink-0 p-2 bg-primary-50 rounded-full text-primary-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-main text-sm">
                    {title || "Judul Notifikasi"}
                  </h4>
                  <p className="text-xs text-text-muted mt-1 break-words">
                    {message || "Isi pesan Anda akan muncul seperti ini di perangkat pengguna."}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">Baru saja</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
