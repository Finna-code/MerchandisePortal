import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <Skeleton className="h-9 w-40 mb-6" />
      <div className="rounded-md border p-6 bg-card text-card-foreground">
        <Skeleton className="h-5 w-96 max-w-full mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    </main>
  );
}
