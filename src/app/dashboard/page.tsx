import { auth } from "@/auth";
import UserDashboard from "@/components/user-dashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Browse products, manage your cart, and view your orders.</p>
      </div>
      <UserDashboard />
    </main>
  );
}

