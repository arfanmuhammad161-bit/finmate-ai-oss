"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Terminal, Database, Webhook, Bot, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const initialErrors = [
  { id: 1, service: 'n8n Workflow', type: 'Webhook Timeout', message: 'Failed to process incoming transaction receipt from Telegram.', time: '10 mins ago', status: 'Unresolved', icon: Webhook, color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 2, service: 'Supabase DB', type: 'Connection Pool', message: 'Maximum connection pool size reached during peak hours.', time: '1 hour ago', status: 'Resolved', icon: Database, color: 'text-red-500', bg: 'bg-red-100' },
  { id: 3, service: 'OpenAI API', type: 'Rate Limit', message: 'Exceeded quota for gpt-4o model requests.', time: '3 hours ago', status: 'Unresolved', icon: Terminal, color: 'text-purple-500', bg: 'bg-purple-100' },
  { id: 4, service: 'Telegram Bot', type: 'API Error', message: 'Bad Request: chat not found.', time: '5 hours ago', status: 'Resolved', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100' },
];

export default function ErrorCenterPage() {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchErrors = async () => {
    try {
      const res = await fetch('/api/admin/errors');
      if (res.ok) {
        const data = await res.json();
        setErrors(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
    const interval = setInterval(fetchErrors, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleClearResolved = async () => {
    try {
      await fetch('/api/admin/errors', { method: 'PUT' });
      setErrors((prev) => prev.filter((e) => e.status !== 'Resolved'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Error Center</h2>
          <p className="text-text-muted">Monitor integritas sistem dan log error dari berbagai layanan.</p>
        </div>
        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white" onClick={handleClearResolved}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Clear All Resolved
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Logs</CardTitle>
            <CardDescription>Recent errors from your infrastructure</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-text-muted">Loading logs...</div>
              ) : errors.length === 0 ? (
                <div className="p-8 text-center text-text-muted">Belum ada log error.</div>
              ) : errors.map((error) => {
                let Icon = Terminal;
                let bgClass = "bg-gray-100";
                let colorClass = "text-gray-500";
                
                if (error.service?.toLowerCase().includes('database')) { Icon = Database; bgClass = "bg-red-100"; colorClass = "text-red-500"; }
                else if (error.service?.toLowerCase().includes('webhook')) { Icon = Webhook; bgClass = "bg-orange-100"; colorClass = "text-orange-500"; }
                else if (error.service?.toLowerCase().includes('bot')) { Icon = MessageSquare; bgClass = "bg-blue-100"; colorClass = "text-blue-500"; }

                return (
                  <div key={error.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg mt-0.5", bgClass, colorClass)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-text-main">{error.service}</h4>
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {error.type}
                            </span>
                          </div>
                          <p className="text-sm text-text-muted">{error.message}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(error.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={cn(
                              "flex items-center gap-1 font-medium",
                              error.status === 'Resolved' ? "text-green-600" : "text-orange-600"
                            )}>
                              {error.status === 'Resolved' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                              {error.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 bg-white" onClick={() => alert(`[${error.service}] ${error.message}`)}>
                        Detail
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Owner Control Card */}
        <div className="space-y-6">
          <Card className="border-primary-200 bg-gradient-to-b from-primary-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-900">
                <Bot className="h-5 w-5 text-primary-600" />
                Owner Bot Control
              </CardTitle>
              <CardDescription>
                Kendali sistem via Telegram Admin Bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-primary-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">Status Notifikasi</span>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Bot aktif memonitor error dan akan mengirimkan notifikasi ke Telegram Anda secara real-time.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-main">Quick Commands</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center font-mono text-xs text-text-muted">
                      /restart_n8n
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center font-mono text-xs text-text-muted">
                      /clear_cache
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center font-mono text-xs text-text-muted">
                      /system_status
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center font-mono text-xs text-text-muted">
                      /pause_bot
                    </div>
                  </div>
                </div>
                
                <Button className="w-full mt-2" variant="outline" onClick={() => window.open('https://t.me/FinMateAIBot', '_blank')}>
                  Buka Telegram Bot
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
