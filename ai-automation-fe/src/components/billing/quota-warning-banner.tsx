"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { planService, UsageStats } from "@/lib/services/plan.service";
import Link from "next/link";

function isDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const dismissedAt = localStorage.getItem("quota-warning-dismissed");
  if (!dismissedAt) return false;
  const hoursSinceDismiss =
    (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
  return hoursSinceDismiss < 24;
}

export function QuotaWarningBanner() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [dismissed, setDismissed] = useState(() => isDismissedRecently());

  useEffect(() => {
    if (dismissed) return;

    planService
      .getUsage()
      .then(setUsage)
      .catch(() => {});
  }, [dismissed]);

  if (dismissed || !usage) return null;

  const aiPct =
    usage.aiResponses.limit > 0
      ? (usage.aiResponses.used / usage.aiResponses.limit) * 100
      : 0;

  if (aiPct < 80) return null;

  const isExhausted = aiPct >= 100;

  const handleDismiss = () => {
    localStorage.setItem("quota-warning-dismissed", String(Date.now()));
    setDismissed(true);
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
        isExhausted
          ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-b border-red-200 dark:border-red-800"
          : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800"
      }`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1">
        {isExhausted
          ? `Đã hết ${usage.aiResponses.limit} AI responses tháng này.`
          : `Đã dùng ${usage.aiResponses.used}/${usage.aiResponses.limit} AI responses (${Math.round(aiPct)}%).`}{" "}
        <Link
          href="/dashboard/billing"
          className="underline hover:no-underline font-semibold"
        >
          Nâng cấp ngay
        </Link>
      </span>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
