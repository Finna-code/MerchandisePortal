import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();
  if (!session || (session as any).role !== "admin") redirect("/signin");
  return <main className="p-6">Admin dashboard</main>;
}