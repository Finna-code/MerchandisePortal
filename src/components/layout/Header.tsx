"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "admin";

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      prefetch
      href={href}
      onClick={() => {
        try { window.dispatchEvent(new Event('navstart')); } catch {}
      }}
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
          <Image src="/logo.svg" alt="Logo" width={24} height={24} priority className="logo select-none" draggable={false} />
          <Link href="/" className="font-semibold" onClick={() => { try { window.dispatchEvent(new Event('navstart')); } catch {} }}>MerchPortal</Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/products">Products</NavLink>
            <NavLink href="/cart">Cart</NavLink>
            {status === 'loading' ? (
              <>
                <span className="h-7 w-24 rounded-md bg-accent/60 animate-pulse" />
                <span className="h-7 w-20 rounded-md bg-accent/60 animate-pulse" />
              </>
            ) : (
              <>
                {session && <NavLink href="/dashboard">Dashboard</NavLink>}
                {isAdmin && <NavLink href="/admin">Admin</NavLink>}
              </>
            )}
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
