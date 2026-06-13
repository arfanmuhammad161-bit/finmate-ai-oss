"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
  onDesktopMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick, onDesktopMenuClick }: TopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling setiap 30 detik
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/transactions?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleOpenNotifications = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && notifications.some(n => !n.is_read)) {
      // Tandai semua sebagai dibaca jika membuka dropdown
      await fetch('/api/notifications', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="flex h-16 items-center justify-between bg-white/70 backdrop-blur-md px-4 sm:px-6 border-b border-border sticky top-0 z-10 print:hidden">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick} 
          className="md:hidden text-text-muted hover:text-text-main"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onDesktopMenuClick} 
          className="hidden md:flex text-text-muted hover:text-text-main mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {title && <h1 className="text-xl font-semibold text-text-main hidden sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <form onSubmit={handleSearch} className="relative hidden sm:block w-48 lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input 
            type="text" 
            placeholder="Cari transaksi..." 
            className="pl-9 bg-gray-50/50 border-transparent focus:bg-white focus:border-primary-500 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative rounded-full text-text-muted hover:text-text-main"
            onClick={handleOpenNotifications}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </Button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-border bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-text-main text-sm">Notifikasi</h3>
                {unreadCount > 0 && <span className="text-xs text-primary-600 font-medium">{unreadCount} Baru</span>}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-sm">
                    Belum ada notifikasi.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`p-4 transition-colors hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/50' : 'bg-white'}`}>
                        <div className="flex gap-3 items-start">
                          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-primary-500' : 'bg-transparent'}`} />
                          <div>
                            <h4 className="text-sm font-semibold text-text-main leading-tight">{notif.title}</h4>
                            <p className="text-xs text-text-muted mt-1">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-2">
                              {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
