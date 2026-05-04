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
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Info,
} from "lucide-react";

export default function ChannelsPage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const tenantHasLoaded = useTenantStore((state) => state.hasLoaded);

  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Webhook URL copy
  const [copied, setCopied] = useState(false);

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

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const webhookUrl = `${apiBaseUrl}/webhook/facebook`;

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

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API not available */
    }
  };

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

          {/* ── Setup Guide Card ── */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Guide Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Hướng dẫn thiết lập
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cấu hình Webhook cho Facebook & Zalo
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Webhook URL */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Facebook Webhook Callback URL
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg break-all">
                    {webhookUrl || "https://your-domain.com/webhook/facebook"}
                  </code>
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-all shrink-0"
                    title="Sao chép"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Steps */}
              <ol className="space-y-4">
                <StepItem
                  step={1}
                  title="Tạo Facebook App / Zalo App"
                  description="Facebook: developers.facebook.com → Create App → thêm Messenger product. Zalo: developers.zalo.me → Tạo ứng dụng."
                  link="https://developers.facebook.com/apps/"
                />
                <StepItem
                  step={2}
                  title="Cấu hình Webhook"
                  description="Dán Webhook URL ở trên vào App Settings. Facebook: dùng FB_VERIFY_TOKEN. Zalo: chọn event send_message."
                />
                <StepItem
                  step={3}
                  title="Kết nối trên Dashboard"
                  description="Nhấn nút 'Kết nối' ở card phía trên → đăng nhập → cấp quyền → hoàn tất tự động. Không cần copy token thủ công."
                />
              </ol>

              {/* Important Notes */}
              <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  Lưu ý quan trọng
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400/80 space-y-1 list-disc list-inside">
                  <li>
                    Webhook URL phải là HTTPS — dùng <strong>ngrok</strong> khi
                    phát triển local.
                  </li>
                  <li>
                    Token được lấy tự động qua OAuth — không cần copy thủ công.
                  </li>
                  <li>
                    Mỗi Facebook Page / Zalo OA chỉ kết nối được với{" "}
                    <strong>1 cửa hàng</strong>.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepItem({
  step,
  title,
  description,
  link,
}: {
  step: number;
  title: string;
  description: string;
  link?: string;
}) {
  return (
    <li className="flex gap-3">
      <div className="w-7 h-7 shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
        {step}
      </div>
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
          {description}
        </p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 font-medium"
          >
            Mở trang <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </li>
  );
}
