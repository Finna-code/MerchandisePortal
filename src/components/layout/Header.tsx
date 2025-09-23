"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "admin";
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const get = () => document.documentElement.getAttribute("data-theme");
    setTheme(get());
    const onChange = (e: any) => setTheme(e?.detail?.theme ?? get());
    window.addEventListener("themechange", onChange as any);
    return () => window.removeEventListener("themechange", onChange as any);
  }, []);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className={cn(
        "text-sm px-3 py-1.5 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
        pathname === href && "bg-accent text-accent-foreground"
      )}
    >
      {children}
    </Link>
  );

  return (
    <header className="w-full border-b bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" width={24} height={24} className="logo select-none" draggable={false} />
          <Link href="/" className="font-semibold">MerchPortal</Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/products">Products</NavLink>
            <NavLink href="/cart">Cart</NavLink>
            {session && <NavLink href="/dashboard">Dashboard</NavLink>}
            {isAdmin && <NavLink href="/admin">Admin</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
