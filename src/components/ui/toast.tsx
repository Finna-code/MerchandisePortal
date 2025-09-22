"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
  duration?: number; // ms
};

const ToastContext = createContext<{ toast: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    const duration = t.duration ?? 2500;
    const next: Toast = { id, ...t };
    setToasts((prev) => [...prev, next]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), duration);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "min-w-64 max-w-sm rounded-md border shadow-lg px-4 py-3 text-sm",
                    t.variant === "destructive"
                      ? "bg-red-600 text-white border-red-700"
                      : t.variant === "success"
                      ? "bg-black text-white border-black"
                      : "bg-neutral-900 text-white border-neutral-800"
                  )}
                >
                  {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
                  {t.description && <div className="opacity-90">{t.description}</div>}
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
