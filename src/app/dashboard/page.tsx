import { auth } from "@/auth";
import UserDashboard from "@/components/user-dashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Welcome, {session.user.name || "User"}!</h1>
      <UserDashboard />
    </main>
  );
}
