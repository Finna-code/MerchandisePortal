"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export function UserMenu() {
  const { data } = useSession();
  if (!data)
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700 dark:text-gray-200">{data.user?.email}</span>
      <Button size="sm" variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
    </div>
  );
}
