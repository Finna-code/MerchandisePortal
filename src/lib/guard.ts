// src/lib/guard.ts
import { auth } from "@/auth";
export async function requireRole(role: "admin" | "user") {
  const s = await auth();
  if (!s || (s as any).role !== role) return null;
  return s;
}
