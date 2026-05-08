import { Skeleton } from "@/components/ui/skeleton";

export function KnowledgeSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* Stats badges */}
      <div className="flex gap-3">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-36 rounded-full" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex gap-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="px-6 py-4 border-b border-slate-50 dark:border-slate-900 flex items-center gap-6"
          >
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
