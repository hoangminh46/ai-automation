"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTenantStore } from "@/store/tenant-store";
import { useChannelStore } from "@/store/channel-store";
import FacebookChannelSection from "./FacebookChannelSection";
import ZaloChannelSection from "./ZaloChannelSection";
import { ChannelsSkeleton } from "@/components/skeletons/channels-skeleton";
import {
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ChannelsPage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const tenantHasLoaded = useTenantStore((state) => state.hasLoaded);

  const channels = useChannelStore((state) => state.channels);
  const isLoading = useChannelStore((state) => state.isLoading);
  const loadedForTenantId = useChannelStore((state) => state.loadedForTenantId);
  const error = useChannelStore((state) => state.error);
  const fetchChannels = useChannelStore((state) => state.fetchChannels);

  const searchParams = useSearchParams();

  // Derive initial OAuth state from URL params (computed at mount, not in effect)
  const [oauthToast, setOauthToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(() => {
    const zaloStatus = searchParams.get("zalo");
    const fbStatus = searchParams.get("facebook");
    if (!zaloStatus && !fbStatus) return null;

    if (zaloStatus === "connected")
      return { type: "success", message: `Kết nối ${searchParams.get("oa_name") || "Zalo OA"} thành công!` };
    if (zaloStatus === "error")
      return { type: "error", message: `Kết nối Zalo thất bại: ${searchParams.get("reason") || "Không rõ lỗi"}` };
    if (fbStatus === "connected")
      return { type: "success", message: `Kết nối ${searchParams.get("page_name") || "Facebook Page"} thành công!` };
    if (fbStatus === "select_page")
      return { type: "success", message: "Vui lòng chọn Facebook Page muốn kết nối." };
    if (fbStatus === "error")
      return { type: "error", message: `Kết nối Facebook thất bại: ${searchParams.get("reason") || "Không rõ lỗi"}` };
    return null;
  });

  const [fbPendingSession, setFbPendingSession] = useState<string | null>(() => {
    if (searchParams.get("facebook") === "select_page") {
      return searchParams.get("session_id");
    }
    return null;
  });

  const tenantId = activeTenant?.id;
  const fbConnection = channels.find(
    (c) => c.channelType === "FACEBOOK" && c.isActive,
  );
  const zaloConnection = channels.find(
    (c) => c.channelType === "ZALO" && c.isActive,
  );

  useEffect(() => {
    if (!tenantId) return;
    fetchChannels(tenantId);
  }, [tenantId]);

  // Side effects only: cleanup URL, auto-dismiss toast, trigger refetch after OAuth
  useEffect(() => {
    const zaloStatus = searchParams.get("zalo");
    const fbStatus = searchParams.get("facebook");
    if (!zaloStatus && !fbStatus) return;

    // Force refresh channels after successful OAuth connection
    const shouldRefetch = zaloStatus === "connected" || fbStatus === "connected";
    if (shouldRefetch && tenantId) {
      fetchChannels(tenantId, true);
    }

    // Clean OAuth params from URL
    window.history.replaceState({}, "", "/dashboard/channels");

    // Auto-dismiss toast after 6 seconds (setState in callback = OK)
    const timer = setTimeout(() => setOauthToast(null), 6000);
    return () => clearTimeout(timer);
  }, [searchParams, tenantId, fetchChannels]);

  if (!tenantHasLoaded || (activeTenant && loadedForTenantId !== activeTenant.id)) {
    return <ChannelsSkeleton />;
  }

  if (!activeTenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Vui lòng chọn cửa hàng trước khi quản lý kênh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Kênh liên kết
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kết nối Facebook Page hoặc Zalo OA để chatbot AI tự động trả lời
          khách hàng.
        </p>
      </div>

      {/* OAuth Callback Toast */}
      {oauthToast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
            oauthToast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`}
        >
          {oauthToast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {oauthToast.message}
        </div>
      )}

      {/* Global Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Channel Cards — 2-col grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Facebook Channel Section ── */}
        <FacebookChannelSection
          tenantId={tenantId!}
          fbConnection={fbConnection}
          onRefresh={async () => {
            setFbPendingSession(null);
            await fetchChannels(tenantId!, true);
          }}
          pendingSessionId={fbPendingSession}
        />

        {/* ── Zalo OA Channel Section ── */}
        <ZaloChannelSection
          tenantId={tenantId!}
          zaloConnection={zaloConnection}
          onRefresh={() => fetchChannels(tenantId!, true)}
        />
      </div>
    </div>
  );
}
