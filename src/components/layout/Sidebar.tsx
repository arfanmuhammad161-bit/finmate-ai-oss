"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon, Settings, X, Crown, CreditCard, LayoutDashboard, Users, Send, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
  role?: 'user' | 'admin';
  userMeta?: { name: string; email: string; plan: string; trialDaysLeft?: number; avatarUrl?: string };
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
}

export function Sidebar({ items, title = "FinMate AI", role = 'user', userMeta, isOpen = false, isCollapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white border-r border-border shadow-sm transition-all duration-300 md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("flex h-16 items-center border-b border-border transition-all", isCollapsed ? "justify-center px-0" : "justify-between px-6")}>
          <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold">
              F
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold tracking-tight text-gradient whitespace-nowrap">
                {title}
              </span>
            )}
          </Link>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose && onClose()}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                  isActive 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-text-muted hover:bg-gray-50 hover:text-text-main"
                )}
              >
                <Icon className={cn("shrink-0", isCollapsed ? "h-6 w-6" : "h-5 w-5", isActive ? "text-primary-600" : "text-gray-400")} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border flex flex-col gap-3">
          {userMeta?.plan?.toLowerCase().includes('trial') && !isCollapsed && (
            <Link 
              href="/dashboard/settings?tab=subscription"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-semibold shadow-sm transition-all"
            >
              <Crown className="h-4 w-4" />
              Upgrade ke Pro
            </Link>
          )}
          
          <Link
            href={role === 'admin' ? '/admin/settings' : '/dashboard/settings'}
            title={isCollapsed ? "Pengaturan Profil" : undefined}
            className={cn(
              "flex items-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group overflow-hidden",
              isCollapsed ? "p-2 justify-center" : "w-full gap-3 p-3 text-left"
            )}
          >
            <div className={cn(
              "rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0",
              isCollapsed ? "h-10 w-10" : "h-9 w-9",
              (userMeta?.plan === 'monthly' || userMeta?.plan === 'yearly' || userMeta?.plan === 'admin') 
                ? "bg-gradient-to-br from-amber-400 to-yellow-600 group-hover:from-amber-500 group-hover:to-yellow-700"
                : "bg-gradient-to-br from-primary-400 to-secondary-400 group-hover:from-primary-500 group-hover:to-secondary-500"
            )}>
              {userMeta?.avatarUrl ? (
                <img src={userMeta.avatarUrl} alt="Avatar" className="h-full w-full object-cover scale-110" />
              ) : (
                userMeta?.name ? userMeta.name[0].toUpperCase() : (role === 'admin' ? 'A' : 'U')
              )}
            </div>
            
            {!isCollapsed && (
              <>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-main group-hover:text-primary-700 truncate">
                    {userMeta?.name || (role === 'admin' ? 'Admin Owner' : 'User')}
                  </span>
                  <span className={cn(
                    "text-xs truncate flex items-center gap-1 transition-colors",
                    (userMeta?.plan === 'monthly' || userMeta?.plan === 'yearly' || userMeta?.plan === 'admin') 
                      ? "text-amber-600 font-semibold group-hover:text-amber-700" 
                      : "text-text-muted group-hover:text-primary-600"
                  )}>
                    {(userMeta?.plan === 'monthly' || userMeta?.plan === 'yearly' || userMeta?.plan === 'admin') && <Crown className="h-3 w-3" />}
                    {userMeta?.plan === 'monthly' ? 'Pro Bulanan' : userMeta?.plan === 'yearly' ? 'Pro Tahunan' : userMeta?.plan === 'admin' ? 'Admin' : `Trial: ${userMeta?.trialDaysLeft ?? 0} hari`}
                  </span>
                </div>
                <Settings className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors shrink-0" />
              </>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
