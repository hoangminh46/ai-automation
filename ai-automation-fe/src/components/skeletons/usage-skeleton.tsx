import { Skeleton } from "@/components/ui/skeleton";

export function UsageSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* 4 Usage Cards (2x2 grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Cycle Info */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
