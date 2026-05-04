"use client";

import { useState } from "react";
import {
  channelService,
  type ChannelConnection,
} from "@/lib/services/channel.service";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2,
  Link2Off,
  Loader2,
  ShieldCheck,
} from "lucide-react";

function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" className={className}>
      <path d="M12.5 6C8.91 6 6 8.91 6 12.5v23C6 39.09 8.91 42 12.5 42h23c3.59 0 6.5-2.91 6.5-6.5v-23C42 8.91 39.09 6 35.5 6h-23zm2.14 11h18.72c.46 0 .85.26.96.64.11.38-.04.79-.38 1.01L22.27 27H31.5c.55 0 1 .45 1 1s-.45 1-1 1H12.78c-.46 0-.85-.26-.96-.64-.11-.38.04-.79.38-1.01L23.73 19H14.64c-.55 0-1-.45-1-1s.45-1 1-1zM35 30.5c0 2.49-2.01 4.5-4.5 4.5h-13c-2.49 0-4.5-2.01-4.5-4.5" />
    </svg>
  );
}

interface ZaloChannelSectionProps {
  tenantId: string;
  zaloConnection: ChannelConnection | undefined;
  onRefresh: () => Promise<void>;
}

export default function ZaloChannelSection({
  tenantId,
  zaloConnection,
  onRefresh,
}: ZaloChannelSectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const isTokenExpired =
    zaloConnection?.tokenExpiresAt &&
    new Date(zaloConnection.tokenExpiresAt).getTime() < Date.now();

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { authUrl } = await channelService.getZaloAuthUrl(tenantId);
      window.location.href = authUrl;
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Không thể tạo link kết nối");
      setError(msg);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      await channelService.disconnectZalo(tenantId);
      setShowDisconnectConfirm(false);
      await onRefresh();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Ngắt kết nối thất bại");
      setError(msg);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: "#0068FF", boxShadow: "0 4px 14px rgba(0, 104, 255, 0.2)" }}>
            <ZaloIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Zalo Official Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kết nối Zalo OA để chatbot trả lời trên Zalo
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {zaloConnection ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đã kết nối
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-full">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Chưa kết nối
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="px-6 py-5">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {zaloConnection ? (
          /* ── Connected State ── */
          <div className="space-y-4">
            {/* Token Expiry Warning */}
            {isTokenExpired && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Token đã hết hạn — hệ thống sẽ tự động refresh. Nếu vẫn lỗi, hãy kết nối lại.
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Tên OA
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {zaloConnection.externalName || `Zalo OA ${zaloConnection.externalId}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  OA ID
                </span>
                <code className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {zaloConnection.externalId}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Trạng thái
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Hoạt động
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Kết nối từ
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {new Date(zaloConnection.createdAt).toLocaleDateString(
                    "vi-VN",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            </div>

            {/* Disconnect */}
            {!showDisconnectConfirm ? (
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <Link2Off className="w-4 h-4" />
                Ngắt kết nối
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
                <p className="text-sm text-red-700 dark:text-red-400">
                  ⚠️ Ngắt kết nối sẽ khiến chatbot{" "}
                  <strong>ngừng trả lời</strong> trên Zalo. Bạn có thể kết nối
                  lại bất kỳ lúc nào.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2Off className="w-4 h-4" />
                    )}
                    {isDisconnecting
                      ? "Đang ngắt..."
                      : "Xác nhận ngắt kết nối"}
                  </button>
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Not Connected ── */
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kết nối Zalo Official Account để chatbot AI tự động trả lời khách
              hàng trên Zalo.
            </p>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#0068FF" }}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang chuyển hướng...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Kết nối Zalo OA
                </>
              )}
            </button>

            {/* Collapsible Setup Guide */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all"
              >
                <span>📋 Hướng dẫn thiết lập Zalo OA</span>
                {showGuide ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showGuide && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <ol className="space-y-3">
                    <GuideStep
                      step={1}
                      title="Tạo Zalo Official Account"
                      description="Truy cập oa.zalo.me, đăng nhập và tạo OA mới (hoặc dùng OA đã có)."
                      link="https://oa.zalo.me/"
                    />
                    <GuideStep
                      step={2}
                      title="Tạo App trên Zalo Developers"
                      description="Vào developers.zalo.me → Tạo ứng dụng mới → liên kết với OA vừa tạo."
                      link="https://developers.zalo.me/"
                    />
                    <GuideStep
                      step={3}
                      title="Cấu hình Webhook URL"
                      description="Trong App Settings → Webhook → dán URL webhook của hệ thống. Chọn events: send_message."
                    />
                    <GuideStep
                      step={4}
                      title="Xác thực domain"
                      description="Upload file xác minh hoặc thêm DNS record theo hướng dẫn của Zalo."
                    />
                    <GuideStep
                      step={5}
                      title="Kết nối trên Dashboard"
                      description="Nhấn nút 'Kết nối Zalo OA' ở trên → authorize → hoàn tất."
                    />
                  </ol>

                  <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                      Lưu ý
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-400/80 space-y-1 list-disc list-inside">
                      <li>
                        Zalo access token hết hạn sau <strong>1 giờ</strong> — hệ
                        thống sẽ tự động gia hạn.
                      </li>
                      <li>
                        Mỗi Zalo OA chỉ kết nối được với{" "}
                        <strong>1 cửa hàng</strong>.
                      </li>
                      <li>
                        Webhook URL phải là HTTPS — dùng <strong>ngrok</strong>{" "}
                        khi phát triển local.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GuideStep({
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
      <div
        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: "#0068FF" }}
      >
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
