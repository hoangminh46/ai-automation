"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  paymentService,
  CreateOrderResponse,
} from "@/lib/services/payment.service";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planSlug: string;
  planName: string;
  orderType?: "SUBSCRIPTION" | "RESPONSE_PACK";
  packSize?: number;
}

type ModalState = "loading" | "payment" | "success" | "error" | "expired" | "pending_conflict";

const POLL_INTERVAL = 3000;
const ORDER_TIMEOUT_MS = 30 * 60 * 1000;

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  planSlug,
  planName,
  orderType = "SUBSCRIPTION",
  packSize,
}: PaymentModalProps) {
  const [state, setState] = useState<ModalState>("loading");
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(ORDER_TIMEOUT_MS);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [orderKey, setOrderKey] = useState(0);
  const [cancellingPending, setCancellingPending] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollRef.current = null;
    countdownRef.current = null;
  }, []);

  // Step 1: Create order via useEffect + .then() (conforms to project lint)
  // useRef guard: React StrictMode remounts effects → without guard, 2 orders are created
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    if (creatingRef.current) return;
    creatingRef.current = true;

    const createOrder =
      orderType === "RESPONSE_PACK" && packSize
        ? paymentService.createResponsePackOrder(packSize)
        : paymentService.createSubscriptionOrder(planSlug);

    createOrder
      .then((data) => {
        setOrderData(data);
        setState("payment");
        const expiresAt = new Date(data.order.expiresAt).getTime();
        const remaining = expiresAt - Date.now();
        setTimeLeft(remaining > 0 ? remaining : 0);
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
        const message = axiosErr?.response?.data?.error?.message
          || (err instanceof Error ? err.message : "Không thể tạo đơn thanh toán");
        const isPendingConflict = axiosErr?.response?.status === 409
          && message.includes("chưa hoàn tất");

        setError(message);
        setState(isPendingConflict ? "pending_conflict" : "error");
      })
      .finally(() => {
        creatingRef.current = false;
      });

    return cleanup;
  }, [isOpen, planSlug, orderKey, cleanup, orderType, packSize]);

  // Step 2: Polling status
  useEffect(() => {
    if (state !== "payment" || !orderData) return;

    pollRef.current = setInterval(() => {
      paymentService
        .checkOrderStatus(orderData.order.id)
        .then((result) => {
          if (result.status === "COMPLETED") {
            cleanup();
            setState("success");
          } else if (
            result.status === "EXPIRED" ||
            result.status === "CANCELLED"
          ) {
            cleanup();
            setState("expired");
          }
        })
        .catch(() => {
          // Polling fail silently — retry next cycle
        });
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [state, orderData, cleanup]);

  // Step 3: Countdown timer
  useEffect(() => {
    if (state !== "payment") return;

    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          cleanup();
          setState("expired");
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [state, cleanup]);

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleSuccess = () => {
    cleanup();
    onSuccess();
  };

  const handleRetry = () => {
    setOrderKey((k) => k + 1);
  };

  const handleResumePending = () => {
    setState("loading");
    paymentService
      .getPendingOrder()
      .then((data) => {
        if (data) {
          setOrderData(data);
          setState("payment");
          const expiresAt = new Date(data.order.expiresAt).getTime();
          const remaining = expiresAt - Date.now();
          setTimeLeft(remaining > 0 ? remaining : 0);
        } else {
          handleRetry();
        }
      })
      .catch(() => {
        setError("Không thể tải đơn thanh toán. Vui lòng thử lại.");
        setState("error");
      });
  };

  const handleCancelAndRetry = () => {
    setCancellingPending(true);
    paymentService
      .getPendingOrder()
      .then((data) => {
        if (data) {
          return paymentService.cancelOrder(data.order.id);
        }
      })
      .then(() => {
        setCancellingPending(false);
        handleRetry();
      })
      .catch(() => {
        setCancellingPending(false);
        setError("Không thể huỷ đơn cũ. Vui lòng thử lại.");
        setState("error");
      });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value) + "đ";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {state === "success"
              ? "Thanh toán thành công!"
              : `Nâng cấp ${planName}`}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Loading */}
          {state === "loading" && (
            <div className="flex flex-col items-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Đang tạo đơn thanh toán...
              </p>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-xl hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Pending Conflict */}
          {state === "pending_conflict" && (
            <div className="flex flex-col items-center py-10 gap-5">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Bạn đang có đơn thanh toán chưa hoàn tất
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vui lòng tiếp tục thanh toán hoặc huỷ đơn cũ để tạo đơn mới.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancelAndRetry}
                  disabled={cancellingPending}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {cancellingPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang huỷ...
                    </span>
                  ) : (
                    "Huỷ đơn cũ"
                  )}
                </button>
                <button
                  onClick={handleResumePending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            </div>
          )}

          {/* Payment */}
          {state === "payment" && orderData && (
            <div className="space-y-5">
              {/* Timer */}
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Hết hạn sau {formatTime(timeLeft)}
                </span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={orderData.qrUrl}
                    alt="QR chuyển khoản"
                    width={220}
                    height={220}
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Số tiền
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(orderData.order.amount)}
                </p>
              </div>

              {/* Bank Info */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <CopyRow
                  label="Ngân hàng"
                  value={orderData.bankInfo.bankName}
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <CopyRow
                  label="Số tài khoản"
                  value={orderData.bankInfo.accountNumber}
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                  highlight
                />
                <CopyRow
                  label="Chủ tài khoản"
                  value={orderData.bankInfo.accountName}
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <CopyRow
                  label="Nội dung CK"
                  value={orderData.order.transferContent}
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                  highlight
                />
              </div>

              {/* Polling indicator */}
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang chờ xác nhận thanh toán...
              </div>
            </div>
          )}

          {/* Expired */}
          {state === "expired" && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Đơn thanh toán đã hết hạn
              </p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-xl hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tạo đơn mới
              </button>
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Đã kích hoạt gói {planName}!
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Gói dịch vụ đã được kích hoạt thành công.
                </p>
              </div>
              <button
                onClick={handleSuccess}
                className="px-6 py-2.5 bg-emerald-600 text-white font-medium text-sm rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copiedField,
  onCopy,
  highlight,
}: {
  label: string;
  value: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  highlight?: boolean;
}) {
  const isCopied = copiedField === label;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        <p
          className={`text-sm font-medium truncate ${
            highlight
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {value}
        </p>
      </div>
      <button
        onClick={() => onCopy(value, label)}
        className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
        title={`Copy ${label}`}
      >
        {isCopied ? (
          <Check className="w-4 h-4 text-emerald-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
