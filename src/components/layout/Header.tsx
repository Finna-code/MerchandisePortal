"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "admin";

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
    <header className="w-full border-b bg-white supports-[backdrop-filter]:bg-white/80 backdrop-blur dark:bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">MerchPortal</Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/products">Products</NavLink>
            <NavLink href="/cart">Cart</NavLink>
            {session && <NavLink href="/dashboard">Dashboard</NavLink>}
            {isAdmin && <NavLink href="/admin">Admin</NavLink>}
          </nav>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
