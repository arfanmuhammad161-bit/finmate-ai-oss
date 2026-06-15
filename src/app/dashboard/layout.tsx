"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { TelegramOnboarding } from '@/components/TelegramOnboarding';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, Wallet, PieChart, Target, FileText, Bot, Settings, Shield, Lock, Crown
} from 'lucide-react';

const defaultSidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', href: '/dashboard/transactions', icon: Wallet },
  { name: 'Budget', href: '/dashboard/budget', icon: PieChart },
  { name: 'Target', href: '/dashboard/goals', icon: Target },
  { name: 'Laporan', href: '/dashboard/reports', icon: FileText },
  { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Bot },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
];

function ExpiredGate({ trialPlan }: { trialPlan?: string }) {
  const wasTrial = trialPlan === 'trial' || trialPlan === 'none';
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-500 blur-2xl opacity-30 rounded-full" />
        <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center shadow-lg">
          <Lock className="h-9 w-9 text-white" />
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
        {wasTrial ? 'Masa Trial Anda Berakhir' : 'Langganan Anda Berakhir'}
      </h2>
      <p className="text-text-muted mt-2 max-w-md leading-relaxed">
        {wasTrial
          ? 'Trial gratis 14 hari sudah habis. Upgrade ke Pro untuk lanjut mencatat keuangan, pakai AI, dan semua fitur lainnya.'
          : 'Masa langganan Anda sudah berakhir. Perpanjang untuk kembali mengakses semua fitur FinMate AI.'}
      </p>
      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/settings?tab=subscription">
          <Button variant="gradient" size="lg" className="shadow-lg">
            <Crown className="mr-2 h-5 w-5" />
            {wasTrial ? 'Upgrade ke Pro' : 'Perpanjang Langganan'}
          </Button>
        </Link>
      </div>
      <p className="text-xs text-text-muted mt-5">
        Data Anda aman tersimpan — semua kembali begitu Anda upgrade. 🔒
      </p>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userMeta, setUserMeta] = useState<{ name: string; email: string; plan: string; trialDaysLeft?: number; avatarUrl?: string, isAdmin?: boolean } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status, expires_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const trialDaysLeft = sub?.expires_at
        ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000))
        : 0;

      // Special handling for admin account
      const isAdmin = user.email?.toLowerCase().trim() === 'arfanmuhammad161@gmail.com';

      // Cek apakah trial/langganan sudah habis (admin tidak pernah expired)
      const expiresMs = sub?.expires_at ? new Date(sub.expires_at).getTime() : 0;
      const expired = !isAdmin && (!sub || (expiresMs > 0 && expiresMs <= Date.now()));
      setIsExpired(expired);

      setUserMeta({
        name: profile?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        plan: isAdmin ? 'admin' : (sub?.plan || 'trial'),
        trialDaysLeft: trialDaysLeft,
        avatarUrl: profile?.avatar_url,
        isAdmin
      });
    };
    fetchUser();
  }, []);

  const activeSidebarItems = userMeta?.isAdmin 
    ? [
        defaultSidebarItems[0], // Dashboard
        { name: 'Panel Admin', href: '/admin', icon: Shield },
        ...defaultSidebarItems.slice(1)
      ]
    : defaultSidebarItems;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {!userMeta?.isAdmin && <TelegramOnboarding />}
      <Sidebar
        items={activeSidebarItems} 
        role={userMeta?.isAdmin ? 'admin' : 'user'} 
        userMeta={userMeta || undefined} 
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full min-w-0">
        <Topbar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onDesktopMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-[1536px] mx-auto">
            {isExpired && !pathname.startsWith('/dashboard/settings') ? (
              <ExpiredGate trialPlan={userMeta?.plan} />
            ) : (
              <>
                {isExpired && (
                  <div className="mb-5 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Lock className="h-4 w-4 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">
                        Masa aktif Anda sudah berakhir. Upgrade untuk buka semua fitur.
                      </span>
                    </div>
                    <Link href="/dashboard/settings?tab=subscription" className="shrink-0">
                      <Button size="sm" className="bg-white text-red-600 hover:bg-red-50 font-bold border-0 h-8">
                        <Crown className="mr-1 h-3 w-3" />Upgrade
                      </Button>
                    </Link>
                  </div>
                )}
                {children}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
