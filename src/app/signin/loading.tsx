import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm bg-card text-card-foreground border rounded-lg p-6">
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </main>
  );
}

