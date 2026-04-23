"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenantStore } from "@/store/tenant-store";
import {
  channelService,
  type ChannelConnection,
  type ConnectFacebookPayload,
} from "@/lib/services/channel.service";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  Link2Off,
  Loader2,
  Copy,
  Check,
  Info,
  ShieldCheck,
} from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function ChannelsPage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const tenantHasLoaded = useTenantStore((state) => state.hasLoaded);

  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connect form
  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [pageName, setPageName] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  // Disconnect
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Webhook URL copy
  const [copied, setCopied] = useState(false);

  const tenantId = activeTenant?.id;
  const fbConnection = channels.find(
    (c) => c.channelType === "FACEBOOK" && c.isActive,
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

  const validateForm = (): string | null => {
    if (!pageId.trim()) return "Vui lòng nhập Facebook Page ID";
    if (!/^\d+$/.test(pageId.trim()))
      return "Page ID phải là chuỗi số (VD: 55454061255579)";
    if (!pageAccessToken.trim())
      return "Vui lòng nhập Page Access Token";
    if (pageAccessToken.trim().length < 50)
      return "Access Token không hợp lệ — quá ngắn";
    return null;
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    const validationError = validateForm();
    if (validationError) {
      setConnectError(validationError);
      return;
    }

    setIsConnecting(true);
    setConnectError(null);
    setConnectSuccess(null);

    try {
      const payload: ConnectFacebookPayload = {
        pageId: pageId.trim(),
        pageAccessToken: pageAccessToken.trim(),
      };
      if (pageName.trim()) payload.pageName = pageName.trim();

      await channelService.connectFacebook(tenantId, payload);

      setConnectSuccess("Kết nối Facebook Page thành công!");
      setPageId("");
      setPageAccessToken("");
      setPageName("");
      setShowToken(false);

      await fetchChannels();

      setTimeout(() => setConnectSuccess(null), 5000);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Kết nối thất bại");
      setConnectError(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!tenantId) return;
    setIsDisconnecting(true);
    try {
      await channelService.disconnectFacebook(tenantId);
      setShowDisconnectConfirm(false);
      await fetchChannels();
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

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback nếu clipboard API không khả dụng
    }
  };

  if (!tenantHasLoaded) return <LoadingScreen text="Đang tải..." />;

  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Chưa chọn Cửa hàng
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Vui lòng tạo hoặc chọn một Cửa hàng ở trang Tổng quan trước.
        </p>
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
          Kết nối Facebook Page để chatbot AI tự động trả lời khách hàng trên
          Messenger.
        </p>
      </div>

      {/* Global Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ── Facebook Connection Card ── */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <FacebookIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Facebook Messenger
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kết nối Facebook Page của bạn
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
              {fbConnection ? (
                /* ── Connected State ── */
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                        Tên Page
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {fbConnection.externalName || `FB Page ${fbConnection.externalId}`}
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

                  {/* Disconnect Button */}
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
                        <strong>ngừng trả lời</strong> trên Messenger. Bạn có
                        thể kết nối lại bất kỳ lúc nào.
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
                /* ── Connect Form ── */
                <form onSubmit={handleConnect} className="space-y-4">
                  {/* Success Alert */}
                  {connectSuccess && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {connectSuccess}
                    </div>
                  )}

                  {/* Error Alert */}
                  {connectError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {connectError}
                    </div>
                  )}

                  {/* Page ID */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Facebook Page ID{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={pageId}
                      onChange={(e) => {
                        setPageId(e.target.value);
                        setConnectError(null);
                      }}
                      placeholder="VD: 55454061255579"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Tìm ở{" "}
                      <span className="font-medium">
                        Facebook Page → Settings → Page ID
                      </span>
                    </p>
                  </div>

                  {/* Page Access Token */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Page Access Token{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={pageAccessToken}
                        onChange={(e) => {
                          setPageAccessToken(e.target.value);
                          setConnectError(null);
                        }}
                        placeholder="EAAxxxxxxx..."
                        className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showToken ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Lấy từ{" "}
                      <span className="font-medium">
                        Meta Developer → Graph API Explorer
                      </span>
                    </p>
                  </div>

                  {/* Page Name (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Tên hiển thị{" "}
                      <span className="text-slate-400 font-normal">
                        (tuỳ chọn)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value)}
                      placeholder="VD: Shop ABC"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang kết nối...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Kết nối Facebook Page
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
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
                  Các bước cấu hình Facebook Webhook
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Webhook URL */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Webhook Callback URL
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
                  title="Tạo Facebook App"
                  description="Vào developers.facebook.com → My Apps → Create App → chọn Business → thêm Messenger product."
                  link="https://developers.facebook.com/apps/"
                />
                <StepItem
                  step={2}
                  title="Cấu hình Webhook"
                  description="Trong Messenger Settings → Webhooks → dán URL ở trên → Verify Token lấy từ file .env (FB_VERIFY_TOKEN)."
                />
                <StepItem
                  step={3}
                  title="Subscribe events"
                  description="Chọn events: messages, messaging_postbacks. Subscribe Page vào webhook."
                />
                <StepItem
                  step={4}
                  title="Lấy Page Access Token"
                  description="Vào Graph API Explorer → chọn Page → lấy token → dán vào form bên trái."
                  link="https://developers.facebook.com/tools/explorer/"
                />
                <StepItem
                  step={5}
                  title="Kết nối tại đây"
                  description="Nhập Page ID + Access Token → nhấn Kết nối. Chatbot sẽ tự động trả lời trên Messenger."
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
                    Page Access Token có thời hạn — cần generate token dài hạn
                    cho production.
                  </li>
                  <li>
                    Mỗi Facebook Page chỉ kết nối được với{" "}
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
