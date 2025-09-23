"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Select, SelectItem } from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const ROLES = ["user", "dept_head", "admin"] as const;

type User = {
  id: number;
  name: string | null;
  email: string;
  role: (typeof ROLES)[number];
  deptId?: number | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/signin");
  }, [status, session, router]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      setUsers(await res.json());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load users";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") load();
  }, [status, session]);

  async function updateRole(userId: number, role: User["role"]) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to update role");
      await load();
      toast({ variant: "invert", title: "Role updated", description: `User #${userId} is now ${role}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update role";
      setError(msg);
      toast({ variant: "destructive", title: "Update failed", description: String(msg) });
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>#{u.id}</TableCell>
                    <TableCell>{u.name ?? "-"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={u.role}
                          onValueChange={(val) => updateRole(u.id, val as User["role"])}
                          aria-label={`Role for user #${u.id}`}
                          className="min-w-32"
                          disabled={session?.user?.id === u.id}
                        >
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </Select>
                        {session?.user?.id === u.id && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm"
                                  aria-label="Info: You’ll lock yourself out!"
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                You’ll lock yourself out!
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
