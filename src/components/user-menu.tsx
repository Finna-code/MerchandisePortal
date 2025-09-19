"use client";
import { signOut, useSession } from "next-auth/react";
export function UserMenu() {
  const { data } = useSession();
  if (!data) return <a href="/signin" className="underline">Sign in</a>;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{data.user?.email}</span>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="border px-2 py-1 text-sm">Sign out</button>
    </div>
  );
}
