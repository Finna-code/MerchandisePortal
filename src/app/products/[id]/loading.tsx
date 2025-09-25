import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-card text-card-foreground border rounded-lg p-4 flex items-center justify-center">
          <Skeleton className="w-[500px] max-w-full h-[320px]" />
        </div>
        <div>
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-4 w-full max-w-[520px] mb-2" />
          <Skeleton className="h-4 w-4/5 mb-6" />
          <Skeleton className="h-7 w-32 mb-6" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
          <Skeleton className="h-4 w-56 mt-6" />
        </div>
      </div>
    </main>
  );
}

