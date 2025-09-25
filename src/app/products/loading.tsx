import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <Skeleton className="h-9 w-56 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card text-card-foreground border rounded-lg shadow-md p-4 flex flex-col items-center">
            <Skeleton className="w-[200px] h-[200px] mb-4" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-10 w-28 mt-auto" />
          </div>
        ))}
      </div>
    </main>
  );
}

