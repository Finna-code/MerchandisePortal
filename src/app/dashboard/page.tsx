import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Welcome, {session.user.name || "User"}!</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="mb-2">Email: <span className="font-mono">{session.user.email}</span></p>
        <p className="mb-2">Role: <span className="font-mono uppercase">{session.user.role}</span></p>
        <p className="mb-2">Department: <span className="font-mono">{session.user.deptId ?? "N/A"}</span></p>
      </div>
      <div className="mt-8 text-gray-600">
        <p>This is your personalized dashboard. More features coming soon!</p>
      </div>
    </main>
  );
}