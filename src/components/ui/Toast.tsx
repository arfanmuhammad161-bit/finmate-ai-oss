"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  durationMs: number;
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let externalPush: ((kind: ToastKind, message: string, durationMs?: number) => void) | null = null;

export function toast(kind: ToastKind, message: string, durationMs?: number) {
  if (externalPush) externalPush(kind, message, durationMs);
  else if (typeof window !== "undefined") {
    console.warn("[toast] ToastProvider belum termount. Pesan:", message);
  }
}

toast.success = (message: string, durationMs?: number) => toast("success", message, durationMs);
toast.error = (message: string, durationMs?: number) => toast("error", message, durationMs);
toast.info = (message: string, durationMs?: number) => toast("info", message, durationMs);
toast.warning = (message: string, durationMs?: number) => toast("warning", message, durationMs);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipanggil di dalam ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, durationMs = 4000) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, kind, message, durationMs }]);
      if (durationMs > 0) {
        setTimeout(() => remove(id), durationMs);
      }
    },
    [remove]
  );

  useEffect(() => {
    externalPush = push;
    return () => {
      externalPush = null;
    };
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
        aria-live="polite"
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const styles: Record<ToastKind, { icon: React.ElementType; bg: string; iconBg: string; border: string }> = {
    success: {
      icon: CheckCircle2,
      bg: "bg-white/95",
      iconBg: "bg-green-100 text-green-600",
      border: "border-green-200",
    },
    error: {
      icon: XCircle,
      bg: "bg-white/95",
      iconBg: "bg-red-100 text-red-600",
      border: "border-red-200",
    },
    info: {
      icon: Info,
      bg: "bg-white/95",
      iconBg: "bg-blue-100 text-blue-600",
      border: "border-blue-200",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-white/95",
      iconBg: "bg-orange-100 text-orange-600",
      border: "border-orange-200",
    },
  };
  const s = styles[item.kind];
  const Icon = s.icon;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-2xl border shadow-lg backdrop-blur-md px-4 py-3 animate-in fade-in slide-in-from-top-2",
        s.bg,
        s.border
      )}
      style={{ animationDuration: "200ms" }}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", s.iconBg)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="flex-1 text-sm text-text-main leading-relaxed pt-1">{item.message}</p>
      <button
        onClick={onClose}
        className="shrink-0 p-1 rounded-lg text-text-muted hover:bg-gray-100 transition-colors"
        aria-label="Tutup"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
