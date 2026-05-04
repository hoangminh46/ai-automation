"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTenantStore } from "@/store/tenant-store";
import FacebookChannelSection from "./FacebookChannelSection";
import ZaloChannelSection from "./ZaloChannelSection";
import {
  channelService,
  type ChannelConnection,
} from "@/lib/services/channel.service";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function ChannelsPage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const tenantHasLoaded = useTenantStore((state) => state.hasLoaded);

  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // OAuth callback toast (for both Zalo and Facebook)
  const [oauthToast, setOauthToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [fbPendingSession, setFbPendingSession] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const tenantId = activeTenant?.id;
  const fbConnection = channels.find(
    (c) => c.channelType === "FACEBOOK" && c.isActive,
  );
  const zaloConnection = channels.find(
    (c) => c.channelType === "ZALO" && c.isActive,
  );



  const fetchChannels = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await channelService.listChannels(tenantId);
      setChannels(data);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Không thể tải danh sách kênh");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Handle OAuth callback query params (Zalo + Facebook)
  useEffect(() => {
    const zaloStatus = searchParams.get("zalo");
    const fbStatus = searchParams.get("facebook");

    if (!zaloStatus && !fbStatus) return;

    if (zaloStatus === "connected") {
      const oaName = searchParams.get("oa_name") || "Zalo OA";
      setOauthToast({
        type: "success",
        message: `Kết nối ${oaName} thành công!`,
      });
      fetchChannels();
    } else if (zaloStatus === "error") {
      const reason = searchParams.get("reason") || "Không rõ lỗi";
      setOauthToast({
        type: "error",
        message: `Kết nối Zalo thất bại: ${reason}`,
      });
    }

    if (fbStatus === "connected") {
      const pageName = searchParams.get("page_name") || "Facebook Page";
      setOauthToast({
        type: "success",
        message: `Kết nối ${pageName} thành công!`,
      });
      fetchChannels();
    } else if (fbStatus === "select_page") {
      const sessionIdParam = searchParams.get("session_id");
      if (sessionIdParam) {
        setFbPendingSession(sessionIdParam);
        setOauthToast({
          type: "success",
          message: "Vui lòng chọn Facebook Page muốn kết nối.",
        });
      }
    } else if (fbStatus === "error") {
      const reason = searchParams.get("reason") || "Không rõ lỗi";
      setOauthToast({
        type: "error",
        message: `Kết nối Facebook thất bại: ${reason}`,
      });
    }

    window.history.replaceState({}, "", "/dashboard/channels");

    const timer = setTimeout(() => setOauthToast(null), 6000);
    return () => clearTimeout(timer);
  }, [searchParams, fetchChannels]);



  if (!tenantHasLoaded) {
    return <LoadingScreen />;
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Channel Cards — 2-col grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* ── Facebook Channel Section ── */}
            <FacebookChannelSection
              tenantId={tenantId!}
              fbConnection={fbConnection}
              onRefresh={async () => {
                setFbPendingSession(null);
                await fetchChannels();
              }}
              pendingSessionId={fbPendingSession}
            />

            {/* ── Zalo OA Channel Section ── */}
            <ZaloChannelSection
              tenantId={tenantId!}
              zaloConnection={zaloConnection}
              onRefresh={fetchChannels}
            />
          </div>
        </div>
      )}
    </div>
  );
}
