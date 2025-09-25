"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectItem } from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
const ROLES = ["user", "dept_head", "admin"] as const;

type User = {
  id: number;
  name: string | null;
  email: string;
  role: (typeof ROLES)[number];
  deptId?: number | null;
  createdAt: string;
  emailVerifiedAt: string | null;
};

type Invite = {
  id: number;
  email: string;
  role: (typeof ROLES)[number];
  tokenHash: string;
  invitedBy: { id: number; name: string | null; email: string };
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

const inviteSchema = z.object({
  email: z.string().email({ message: "Enter a valid email" }),
  role: z.enum(ROLES),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/signin");
  }, [status, session, router]);

  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "user" },
  });

  const pendingInvites = useMemo(() => invites.filter((invite) => !invite.acceptedAt), [invites]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, invitesRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/invites", { cache: "no-store" }),
      ]);
      if (!usersRes.ok) throw new Error(await usersRes.text());
      if (!invitesRes.ok) throw new Error(await invitesRes.text());
      setUsers(await usersRes.json());
      setInvites(await invitesRes.json());
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

  const onInviteSubmit = inviteForm.handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send invite");
      }
      toast({ variant: "invert", title: "Invite sent", description: `Invite sent to ${values.email}` });
      inviteForm.reset({ email: "", role: "user" });
      setInviteDialogOpen(false);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send invite";
      toast({ variant: "destructive", title: "Invite failed", description: msg });
    }
  });

  async function resendInvite(inviteId: number) {
    try {
      const res = await fetch(`/api/admin/invites/${inviteId}/resend`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to resend invite");
      }
      toast({ variant: "invert", title: "Invite resent", description: `Another invite has been emailed.` });
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to resend invite";
      toast({ variant: "destructive", title: "Resend failed", description: msg });
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/admin" className="font-medium text-foreground hover:underline">Admin Panel</Link>
        <span className="mx-1">/</span>
        <span>Users</span>
      </nav>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <AlertDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="default">Invite user</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Invite a new user</AlertDialogTitle>
              <AlertDialogDescription>
                We&apos;ll send an email with instructions to join and set a password.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={onInviteSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="invitee@example.com"
                  {...inviteForm.register("email")}
                  disabled={inviteForm.formState.isSubmitting}
                />
                {inviteForm.formState.errors.email && (
                  <p className="text-xs text-red-600">{inviteForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Role</label>
                <Select
                  value={inviteForm.watch("role")}
                  onValueChange={(val) => inviteForm.setValue("role", val as InviteFormValues["role"])}
                  disabled={inviteForm.formState.isSubmitting}
                >
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </Select>
                {inviteForm.formState.errors.role && (
                  <p className="text-xs text-red-600">{inviteForm.formState.errors.role.message}</p>
                )}
              </div>
              <AlertDialogFooter className="flex justify-end gap-2">
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <Button type="submit" disabled={inviteForm.formState.isSubmitting}>
                  {inviteForm.formState.isSubmitting ? "Sending..." : "Send invite"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
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
                  <TableHead>Status</TableHead>
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
                      {u.emailVerifiedAt ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Unverified</Badge>
                      )}
                    </TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Pending invites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : pendingInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invites.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited by</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell><Badge variant="secondary">{invite.role}</Badge></TableCell>
                    <TableCell>{invite.invitedBy.name ?? invite.invitedBy.email}</TableCell>
                    <TableCell>{new Date(invite.expiresAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvite(invite.id)}
                      >
                        Resend invite
                      </Button>
                    </TableCell>
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





