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
    const handler = (e: CustomEvent<{ theme: 'light' | 'dark' }>) =>
      setTheme(e?.detail?.theme === 'dark' ? 'dark' : 'light');
    window.addEventListener('themechange', handler as EventListener);
    return () => window.removeEventListener('themechange', handler as EventListener);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    // Persist explicit choice; pre-hydration script handles applying and meta color
    if (typeof window !== 'undefined' && window.__setTheme) {
      window.__setTheme(next);
    }
    setTheme(next);
  }

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <Button
      size="sm"
      variant="outline"
      aria-label={label}
      title={label}
      onClick={toggle}
      className="group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm"
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-150 group-hover:rotate-6 group-hover:scale-110" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-150 group-hover:-rotate-6 group-hover:scale-110" />
      )}
    </Button>
  );
}
