export default function ChatLoading() {
  return (
    <div className="flex h-full animate-pulse">
      {/* Left - Conversation list skeleton */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-3">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Center - Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="flex justify-start">
            <div className="h-16 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <div className="h-12 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <div className="h-24 w-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Right - Customer panel skeleton */}
      <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 hidden xl:block">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
        </div>
        <div className="space-y-3 pt-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}
