"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

type Resolver = (value: boolean) => void;

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolver: Resolver | null;
}

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

let externalConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (externalConfirm) return externalConfirm(opts);
  if (typeof window !== "undefined") {
    return Promise.resolve(window.confirm(opts.message));
  }
  return Promise.resolve(false);
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm harus dipanggil di dalam ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    message: "",
    resolver: null,
  });

  const ask = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, ...opts, resolver: resolve });
    });
  }, []);

  useEffect(() => {
    externalConfirm = ask;
    return () => {
      externalConfirm = null;
    };
  }, [ask]);

  const close = (value: boolean) => {
    state.resolver?.(value);
    setState((s) => ({ ...s, open: false, resolver: null }));
  };

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open]);

  const tone = state.tone || "default";
  const isDanger = tone === "danger";

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
            style={{ animationDuration: "150ms" }}
            onClick={() => close(false)}
          />
          <div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in"
            style={{ animationDuration: "150ms" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                    isDanger ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                  )}
                >
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-bold text-text-main">
                    {state.title || (isDanger ? "Hapus permanen?" : "Konfirmasi tindakan")}
                  </h3>
                  <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{state.message}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => close(false)}>
                  {state.cancelLabel || "Batal"}
                </Button>
                <Button
                  className={cn(
                    isDanger && "bg-red-600 hover:bg-red-500 text-white shadow-sm hover:shadow-md"
                  )}
                  variant={isDanger ? "default" : "gradient"}
                  onClick={() => close(true)}
                >
                  {state.confirmLabel || (isDanger ? "Hapus" : "Lanjutkan")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
