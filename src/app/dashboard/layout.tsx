"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, Wallet, PieChart, Target, FileText, Bot, Settings, Shield
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userMeta, setUserMeta] = useState<{ name: string; email: string; plan: string; trialDaysLeft?: number; avatarUrl?: string, isAdmin?: boolean } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
