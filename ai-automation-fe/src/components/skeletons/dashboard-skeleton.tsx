import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header: title + button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Quota bar */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
