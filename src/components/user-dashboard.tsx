import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";
import Link from "next/link";

export default async function UserDashboard() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return <div className="text-red-500">Error: User not found</div>;
    }

    // Fetch orders and product count in parallel for faster TTFB
    const [orders, productsCount] = await Promise.all([
      prisma.order.findMany({
        where: { userId: Number(userId), status: { not: OrderStatus.cart } },
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { product: true } },
        },
      }),
      prisma.product.count(),
    ]);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                You have no new notifications.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Products
              </CardTitle>
              <Link href="/products">
                <Button variant="outline" size="sm" className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productsCount}</div>
              <p className="text-xs text-muted-foreground">
                {productsCount > 0 ? "+ New arrivals this month" : "No products yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Create New Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/products">
                <Button size="sm" className="w-full transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm">
                  Create Order
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Here are all orders you have placed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-muted-foreground">You have not placed any orders yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>{formatMoney(order.total, order.currency)}</TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {order.items.map((item) => item.product.name).join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="text-red-500">
        Error loading dashboard. Please try again later.
      </div>
    );
  }
}
