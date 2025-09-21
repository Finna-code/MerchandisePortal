"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    redirect("/signin");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="mb-2">Welcome, <span className="font-mono">{session?.user?.name || "Admin"}</span>!</p>
        <p className="mb-2">Email: <span className="font-mono">{session?.user?.email}</span></p>
        <p className="mb-2">Role: <span className="font-mono uppercase">{session?.user?.role}</span></p>
        <p className="mb-2">Department: <span className="font-mono">{session?.user?.deptId ?? "N/A"}</span></p>
      </div>
      <div className="mt-8 text-gray-600">
        <p>This is your personalized admin dashboard. More features coming soon!</p>
      </div>
    </main>
  );
}
