"use client";

interface UsageProgressBarProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  showFraction?: boolean;
}

export function UsageProgressBar({
  label,
  used,
  limit,
  unit = "",
  showFraction = true,
}: UsageProgressBarProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

  const getBarColor = () => {
    if (isUnlimited) return "bg-emerald-500";
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-amber-500";
    if (percentage >= 60) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  const getTextColor = () => {
    if (isUnlimited) return "text-emerald-600 dark:text-emerald-400";
    if (percentage >= 100) return "text-red-600 dark:text-red-400";
    if (percentage >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-slate-600 dark:text-slate-400";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className={`text-sm font-semibold ${getTextColor()}`}>
          {showFraction ? (
            isUnlimited ? (
              `${used} / ∞`
            ) : (
              <>
                {used}
                {unit} / {limit}
                {unit}
              </>
            )
          ) : (
            `${Math.round(percentage)}%`
          )}
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor()}`}
          style={{ width: isUnlimited ? "0%" : `${percentage}%` }}
        />
      </div>
    </div>
  );
}
