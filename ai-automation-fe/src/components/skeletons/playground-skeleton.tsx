import { Skeleton } from "@/components/ui/skeleton";

export function PlaygroundSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Chat area — empty state */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <Skeleton className="h-16 w-16 rounded-2xl mb-4" />
        <Skeleton className="h-6 w-56 mb-2" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <div className="flex items-end gap-3">
          <Skeleton className="flex-1 h-11 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
