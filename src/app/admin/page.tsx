"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    redirect("/signin");
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="mt-2 text-muted-foreground">Manage products, orders, and users.</p>
      </div>
      <div className="mb-8 rounded-md border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">You are viewing the Admin Panel.</div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Manage Products</CardTitle>
            <CardDescription>
              Add, edit, or remove products from the store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Control the product catalog, update stock levels, and manage product
              visibility.
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
              <Link href="/admin/products">Go to Products</Link>
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manage Orders</CardTitle>
            <CardDescription>
              View and process customer orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Track orders from placement to delivery, and manage order statuses.
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
              <Link href="/admin/orders">Go to Orders</Link>
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>
              View and manage user accounts and roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Manage user roles, departments, and access permissions.
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
              <Link href="/admin/users">Go to Users</Link>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

