"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon, Settings, X, Crown, LogOut } from 'lucide-react';
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

  const isPro = userMeta?.plan === 'monthly' || userMeta?.plan === 'yearly' || userMeta?.plan === 'admin';
  const planLabel = userMeta?.plan === 'monthly' ? 'Pro Bulanan'
    : userMeta?.plan === 'yearly' ? 'Pro Tahunan'
    : userMeta?.plan === 'admin' ? 'Admin'
    : `Trial · ${userMeta?.trialDaysLeft ?? 0} hari`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white border-r border-border transition-all duration-300 md:static md:translate-x-0 shadow-xl md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Brand */}
        <div className={cn(
          "flex h-16 items-center border-b border-border shrink-0",
          isCollapsed ? "justify-center px-0" : "justify-between px-5"
        )}>
          <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 overflow-hidden group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
              F
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-gradient whitespace-nowrap">
                {title}
              </span>
            )}
          </Link>
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg text-text-muted hover:bg-gray-100 hover:text-text-main">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted/70">
              Menu
            </p>
          )}
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
                  "relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 group",
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-gradient-to-r from-primary-50 via-primary-50 to-transparent text-primary-700"
                    : "text-text-muted hover:bg-gray-50 hover:text-text-main"
                )}
              >
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-primary-500 to-secondary-500" />
                )}
                <div className={cn(
                  "flex items-center justify-center rounded-lg transition-colors shrink-0",
                  isCollapsed ? "h-9 w-9" : "h-7 w-7",
                  isActive
                    ? "bg-white text-primary-600 shadow-sm"
                    : "bg-transparent text-gray-400 group-hover:text-text-main"
                )}>
                  <Icon className={cn(isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                </div>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Upgrade CTA + Profile */}
        <div className="p-3 border-t border-border space-y-2.5 shrink-0">
          {!isPro && !isCollapsed && (
            <Link
              href="/dashboard/settings?tab=subscription"
              className="relative overflow-hidden flex items-center gap-2.5 w-full py-2.5 px-3 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:via-orange-600 hover:to-rose-600 text-white rounded-xl font-semibold text-sm shadow-sm transition-all group"
            >
              <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-white/20 blur-xl group-hover:bg-white/30" />
              <Crown className="h-4 w-4 shrink-0 relative" />
              <span className="relative">Upgrade ke Pro</span>
            </Link>
          )}

          <Link
            href={role === 'admin' ? '/admin/settings' : '/dashboard/settings'}
            title={isCollapsed ? "Profil & Pengaturan" : undefined}
            className={cn(
              "flex items-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group overflow-hidden",
              isCollapsed ? "p-2 justify-center" : "w-full gap-3 p-2.5"
            )}
          >
            <div className={cn(
              "rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0 shadow-sm",
              isCollapsed ? "h-10 w-10 text-base" : "h-9 w-9 text-sm",
              isPro
                ? "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500"
                : "bg-gradient-to-br from-primary-500 to-secondary-500"
            )}>
              {userMeta?.avatarUrl ? (
                <img src={userMeta.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                userMeta?.name ? userMeta.name[0].toUpperCase() : (role === 'admin' ? 'A' : 'U')
              )}
            </div>

            {!isCollapsed && (
              <>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold text-text-main truncate">
                    {userMeta?.name || (role === 'admin' ? 'Admin' : 'User')}
                  </span>
                  <span className={cn(
                    "text-[11px] truncate flex items-center gap-1 font-medium",
                    isPro ? "text-amber-600" : "text-text-muted"
                  )}>
                    {isPro && <Crown className="h-2.5 w-2.5" />}
                    {planLabel}
                  </span>
                </div>
                <Settings className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors shrink-0" />
              </>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
