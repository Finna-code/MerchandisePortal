// src/lib/guard.ts
import { auth } from "@/auth";
export async function requireRole(role: "admin" | "user") {
  const s = await auth();
  const userRole = (s as any)?.user?.role;
  if (!s || userRole !== role) return null;
  return s;
}

export async function requireAdmin() {
  const s = await auth();
  const userRole = (s as any)?.user?.role;
  if (!s || userRole !== "admin") return null;
  return s;
}

export async function requireAuth() {
  const s = await auth();
  if (!s) return null;
  return s;
}
