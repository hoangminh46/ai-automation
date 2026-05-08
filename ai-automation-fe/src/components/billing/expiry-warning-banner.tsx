"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, X } from "lucide-react";
import { useUsageStore } from "@/store/usage-store";
import Link from "next/link";

const DISMISS_KEY = "expiry-warning-dismissed";

function isDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;
  const hoursSinceDismiss =
    (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
  return hoursSinceDismiss < 24;
}

/**
 * Banner "Sắp hết hạn" (vàng, dismissable 24h):
 *   Hiện khi daysRemaining <= 3 AND plan != free
 *
 * Banner "Đã hết hạn" (đỏ, không dismissable):
 *   Hiện khi billing.status !== "ACTIVE" (hoặc plan bị revert về free sau expiry)
 *   → Trường hợp này phức tạp, dùng: daysRemaining === 0 hoặc < 0
 *
 * Fallback: luôn check daysRemaining khi component mount (không cần WS).
 * WS chỉ trigger refresh data.
 */
export function ExpiryWarningBanner() {
  const usage = useUsageStore(state => state.usage);
  const fetchUsage = useUsageStore(state => state.fetchUsage);
  const [dismissed, setDismissed] = useState(() => isDismissedRecently());
  const [wsExpired, setWsExpired] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // WebSocket listener: lắng nghe real-time events
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamic import socket.io-client to avoid SSR issues
    let cleanup: (() => void) | undefined;

    import("socket.io-client").then(({ io }) => {
      const token = document.cookie
        .split("; ")
        .find((c) => c.startsWith("sb-"))
        ?.split("=")[1];

      if (!token) return;

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const socket = io(`${apiUrl}/notifications`, {
        query: { token },
        transports: ["websocket"],
      });

      socket.on("subscription_expiring_soon", () => {
        fetchUsage(true);
      });

      socket.on("subscription_expired", () => {
        setWsExpired(true);
        fetchUsage(true);
      });

      cleanup = () => socket.disconnect();
    }).catch(() => {});

    return () => cleanup?.();
  }, []);

  if (!usage) return null;

  const { daysRemaining } = usage.billing;
  const isFree = usage.plan.slug === "free";

  // Đã hết hạn (bị revert về Free qua WS event)
  if (wsExpired) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-b border-red-200 dark:border-red-800">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="flex-1">
          Gói dịch vụ đã hết hạn. Nâng cấp để tiếp tục sử dụng đầy đủ tính
          năng.{" "}
          <Link
            href="/dashboard/billing"
            className="underline hover:no-underline font-semibold"
          >
            Nâng cấp ngay
          </Link>
        </span>
      </div>
    );
  }

  // Không hiện banner cho Free plan hoặc null daysRemaining
  if (isFree || daysRemaining === null) return null;

  // Sắp hết hạn (≤ 3 ngày)
  if (daysRemaining <= 3 && daysRemaining > 0) {
    if (dismissed) return null;

    const handleDismiss = () => {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setDismissed(true);
    };

    return (
      <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800">
        <Clock className="w-4 h-4 shrink-0" />
        <span className="flex-1">
          Gói {usage.plan.name} sẽ hết hạn sau {daysRemaining} ngày.{" "}
          <Link
            href="/dashboard/billing"
            className="underline hover:no-underline font-semibold"
          >
            Gia hạn ngay
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

  // Đã hết hạn (daysRemaining <= 0, chưa bị downgrade)
  if (daysRemaining <= 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-b border-red-200 dark:border-red-800">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="flex-1">
          Gói {usage.plan.name} đã hết hạn. Gia hạn để tiếp tục sử dụng.{" "}
          <Link
            href="/dashboard/billing"
            className="underline hover:no-underline font-semibold"
          >
            Gia hạn ngay
          </Link>
        </span>
      </div>
    );
  }

  return null;
}
