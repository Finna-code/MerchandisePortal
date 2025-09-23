"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 'light');

  // Reflect current applied theme from <html data-theme>
  useEffect(() => {
    const get = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    setTheme(get());
    const handler = (e: any) => setTheme(e?.detail?.theme === 'dark' ? 'dark' : 'light');
    window.addEventListener('themechange', handler as any);
    return () => window.removeEventListener('themechange', handler as any);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    // Persist explicit choice; pre-hydration script handles applying and meta color
    if (typeof window !== 'undefined' && (window as any).__setTheme) {
      (window as any).__setTheme(next);
    }
    setTheme(next);
  }

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <Button size="sm" variant="outline" aria-label={label} title={label} onClick={toggle}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
