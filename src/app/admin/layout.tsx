"use client";

import React from 'react';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  Settings,
  Ticket
} from 'lucide-react';

const adminSidebarItems: SidebarItem[] = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Pembayaran', href: '/admin/payments', icon: CreditCard },
  { name: 'Kupon & Promo', href: '/admin/coupons', icon: Ticket },
  { name: 'Revenue', href: '/admin/revenue', icon: TrendingUp },
  { name: 'Error Center', href: '/admin/errors', icon: AlertTriangle },
  { name: 'Broadcast', href: '/admin/broadcast', icon: MessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        items={adminSidebarItems} 
        role="admin" 
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Topbar 
          onMenuClick={() => setIsSidebarOpen(true)}
          onDesktopMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
