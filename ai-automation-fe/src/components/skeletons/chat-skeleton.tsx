import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="flex h-full animate-in fade-in duration-300">
      {/* Left - Conversation list */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Center - Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="flex justify-start">
            <Skeleton className="h-16 w-64 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-24 w-72 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Right - Customer panel */}
      <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 hidden xl:block">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}
