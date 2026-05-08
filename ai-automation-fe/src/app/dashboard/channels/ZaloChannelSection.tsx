"use client";

import { useState } from "react";
import {
  channelService,
  type ChannelConnection,
} from "@/lib/services/channel.service";
import {
  AlertCircle,
  AlertTriangle,
  Link2,
  Link2Off,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { BotAssignment } from "@/components/channel/bot-assignment";

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

              {/* Bot Assignment */}
              <BotAssignment channel={zaloConnection} />

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

            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                📋 Cách kết nối chỉ với 3 bước:
              </p>
              <ol className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-none">
                <li className="flex gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 text-[10px] font-bold">1</span>
                  Bạn cần có một <strong className="text-slate-700 dark:text-slate-300">trang Zalo doanh nghiệp</strong> (tạo miễn phí tại{" "}
                  <a href="https://oa.zalo.me/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">oa.zalo.me</a>)
                </li>
                <li className="flex gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 text-[10px] font-bold">2</span>
                  Nhấn nút <strong className="text-slate-700 dark:text-slate-300">Kết nối Zalo OA</strong> ở trên → đăng nhập Zalo → chọn trang muốn kết nối
                </li>
                <li className="flex gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 text-[10px] font-bold">3</span>
                  Nhấn <strong className="text-slate-700 dark:text-slate-300">Cho phép</strong> → chatbot sẽ tự động hoạt động trên Zalo
                </li>
              </ol>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                💡 Mỗi trang Zalo chỉ kết nối được với 1 cửa hàng.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

