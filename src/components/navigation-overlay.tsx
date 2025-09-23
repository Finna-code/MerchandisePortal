"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

export default function NavigationOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Show when a navstart event is dispatched (from header/auth buttons)
  useEffect(() => {
    const onStart = (_e: Event) => {
      // Delay slightly to avoid flicker on super-fast transitions
      const t = setTimeout(() => setVisible(true), 100);
      // Store timer to clear if needed
      window.__navTimer = t;
      // Also set a fallback auto-hide in case no path change occurs
      if (window.__navHideFallback) clearTimeout(window.__navHideFallback);
      window.__navHideFallback = setTimeout(() => setVisible(false), 1000);
    };
    window.addEventListener("navstart", onStart);
    return () => window.removeEventListener("navstart", onStart);
  }, []);

  // Hide when route actually changes
  useEffect(() => {
    // If a start timer is pending, clear it and still show briefly
    if (window.__navTimer) {
      clearTimeout(window.__navTimer);
      window.__navTimer = undefined;
      // Ensure we show at least a minimal animation frame
      setVisible(true);
    }
    // Clear fallback and schedule a short hide for real navigations
    if (window.__navHideFallback) {
      clearTimeout(window.__navHideFallback);
      window.__navHideFallback = undefined;
    }
    // Always schedule a hide after a real navigation, regardless of current state
    const t = setTimeout(() => setVisible(false), 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!mounted) return null;
  return createPortal(
    <div
      aria-hidden
      className={
        "fixed inset-x-0 top-0 z-[9999] h-0.5 transition-opacity " +
        (visible ? "opacity-100" : "opacity-0 pointer-events-none")
      }
    >
      <div className="h-full w-0 bg-foreground/70 animate-[progress_0.8s_ease-out_forwards] rounded-r-full" />
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-[progress_0.8s_ease-out_forwards] { animation: none; }
        }
      `}</style>
    </div>,
    document.body
  );
}
