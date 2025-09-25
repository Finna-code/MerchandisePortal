import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="rounded-md border bg-card p-6">
          <Skeleton className="mb-6 h-6 w-24" />
          <div className="space-y-6">
            {[...Array(2)].map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <Skeleton className="h-20 w-20 rounded-md" />
                <div className="flex-1 space-y-3 sm:px-4">
                  <Skeleton className="h-5 w-64 max-w-full" />
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-4 w-32 max-w-full" />
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-md border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="rounded-md border bg-card p-6 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}

