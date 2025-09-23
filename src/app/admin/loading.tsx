import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <Skeleton className="h-9 w-48 mb-6" />
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-card text-card-foreground border">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-5 w-36" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
