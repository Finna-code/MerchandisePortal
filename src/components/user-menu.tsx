"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
export function UserMenu() {
  const { data, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    );
  }

  if (!data)
    return (
      <Button asChild size="sm" variant="outline" className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground/80">{data.user?.email}</span>
      <Button size="sm" variant="outline" onClick={() => signOut({ callbackUrl: "/" })} className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">Sign out</Button>
    </div>
  );
}

