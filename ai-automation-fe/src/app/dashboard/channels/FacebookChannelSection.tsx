"use client";

import { useState, useEffect } from "react";
import {
  channelService,
  type ChannelConnection,
} from "@/lib/services/channel.service";
import {
  AlertCircle,
  Link2,
  Link2Off,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { BotAssignment } from "@/components/channel/bot-assignment";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface FacebookChannelSectionProps {
  tenantId: string;
  fbConnection: ChannelConnection | undefined;
  onRefresh: () => Promise<void>;
  pendingSessionId?: string | null;
}

export default function FacebookChannelSection({
  tenantId,
  fbConnection,
  onRefresh,
  pendingSessionId,
}: FacebookChannelSectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-page selection
  const [pendingPages, setPendingPages] = useState<
    { id: string; name: string }[] | null
  >(null);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isSelectingPage, setIsSelectingPage] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    pendingSessionId || null,
  );

  // Load pending pages nếu có sessionId
  useEffect(() => {
    if (!sessionId || !tenantId) return;

    const loadPages = async () => {
      setIsLoadingPages(true);
      setError(null);
      try {
        const pages = await channelService.getPendingPages(
          tenantId,
          sessionId,
        );
        setPendingPages(pages);
      } catch (err) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
        };
        const msg =
          axiosErr.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "Không thể tải danh sách Pages");
        setError(msg);
        setSessionId(null);
      } finally {
        setIsLoadingPages(false);
      }
    };

    loadPages();
  }, [sessionId, tenantId]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { authUrl } = await channelService.getFacebookAuthUrl(tenantId);
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

  const handleSelectPage = async (pageId: string) => {
    if (!sessionId) return;
    setIsSelectingPage(true);
    setError(null);
    try {
      await channelService.selectFacebookPage(tenantId, sessionId, pageId);
      setPendingPages(null);
      setSessionId(null);
      await onRefresh();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Kết nối Page thất bại");
      setError(msg);
    } finally {
      setIsSelectingPage(false);
    }
  };

  const handleCancelSelection = () => {
    setPendingPages(null);
    setSessionId(null);
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      await channelService.disconnectFacebook(tenantId);
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: "#1877F2",
              boxShadow: "0 4px 14px rgba(24, 119, 242, 0.2)",
            }}
          >
            <FacebookIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Facebook Messenger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kết nối Facebook Page để chatbot trả lời trên Messenger
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {fbConnection ? (
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

        {/* ── Page Selection Modal ── */}
        {pendingPages && pendingPages.length > 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Chọn Facebook Page
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400/80">
                Tài khoản của bạn quản lý {pendingPages.length} Pages. Chọn Page
                muốn kết nối với chatbot:
              </p>
            </div>

            <div className="space-y-2">
              {pendingPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page.id)}
                  disabled={isSelectingPage}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                      <FacebookIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {page.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {page.id}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Chọn →
                  </span>
                </button>
              ))}
            </div>

            {isSelectingPage && (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang kết nối...
              </div>
            )}

            <button
              onClick={handleCancelSelection}
              disabled={isSelectingPage}
              className="w-full px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              Huỷ
            </button>
          </div>
        )}

        {/* ── Loading Pages ── */}
        {isLoadingPages && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải danh sách Pages...
          </div>
        )}

        {/* ── Connected State ── */}
        {!pendingPages && !isLoadingPages && fbConnection && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Tên Page
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {fbConnection.externalName ||
                    `FB Page ${fbConnection.externalId}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Page ID
                </span>
                <code className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {fbConnection.externalId}
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
                  {new Date(fbConnection.createdAt).toLocaleDateString(
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
              <BotAssignment channel={fbConnection} />

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
                  <strong>ngừng trả lời</strong> trên Messenger. Webhook sẽ được
                  tự động huỷ đăng ký. Bạn có thể kết nối lại bất kỳ lúc nào.
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
        )}

        {/* ── Not Connected ── */}
        {!pendingPages && !isLoadingPages && !fbConnection && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kết nối Facebook Page để chatbot AI tự động trả lời khách hàng
              trên Messenger.
            </p>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#1877F2" }}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang chuyển hướng...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Kết nối Facebook Page
                </>
              )}
            </button>

            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                📋 Cách kết nối chỉ với 3 bước:
              </p>
              <ol className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-none">
                <li className="flex gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold">1</span>
                  Nhấn nút <strong className="text-slate-700 dark:text-slate-300">Kết nối Facebook Page</strong> ở trên
                </li>
                <li className="flex gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold">2</span>
                  Đăng nhập Facebook → chọn trang cửa hàng muốn kết nối
                </li>
                <li className="flex gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold">3</span>
                  Nhấn <strong className="text-slate-700 dark:text-slate-300">Cho phép</strong> → chatbot sẽ tự động hoạt động trên Messenger
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
