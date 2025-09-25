"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "invert";
  duration?: number; // ms
};

const ToastContext = createContext<{ toast: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      const initial = (document.documentElement.getAttribute("data-theme") as "light" | "dark" | null) ?? "light";
      setTheme(initial === "dark" ? "dark" : "light");
      const onTheme = (e: Event) => {
        // layout.tsx dispatches CustomEvent('themechange', { detail: { theme } })
        const detail = (e as CustomEvent<{ theme: string }>).detail;
        const next = detail?.theme === "dark" ? "dark" : "light";
        setTheme(next);
      };
      window.addEventListener("themechange", onTheme as EventListener);
      return () => window.removeEventListener("themechange", onTheme as EventListener);
    }
  }, []);
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
                    // Theme-aware defaults using design tokens
                    t.variant === "destructive"
                      ? "bg-red-600 text-white border-red-700"
                      : t.variant === "invert"
                        ? theme === "dark"
                          ? "bg-white text-black border-neutral-200"
                          : "bg-black text-white border-black"
                        : "bg-background text-foreground border-border"
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

