"use client";

import { useEffect, useState } from "react";
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import {
  paymentService,
  PaymentOrder,
} from "@/lib/services/payment.service";

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<
  PaymentOrder["status"],
  { label: string; className: string }
> = {
  COMPLETED: {
    label: "Thành công",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  PENDING: {
    label: "Chờ thanh toán",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  },
  EXPIRED: {
    label: "Hết hạn",
    className:
      "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  },
  CANCELLED: {
    label: "Đã huỷ",
    className:
      "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function orderTypeLabel(order: PaymentOrder): string {
  if (order.type === "RESPONSE_PACK") {
    return `Gói lẻ ${order.responsePackSize ?? ""} responses`;
  }
  return "Nâng cấp gói";
}

export function TransactionHistory() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    paymentService
      .getOrderHistory(200)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
        <Receipt className="w-10 h-10" />
        <p className="text-sm">Chưa có giao dịch nào</p>
      </div>
    );
  }

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const pageOrders = orders.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="pb-3 font-medium">Ngày</th>
              <th className="pb-3 font-medium">Loại</th>
              <th className="pb-3 font-medium text-right">Số tiền</th>
              <th className="pb-3 font-medium text-center">Trạng thái</th>
              <th className="pb-3 font-medium text-right">Mã GD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageOrders.map((order) => {
              const config = STATUS_CONFIG[order.status];
              return (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="py-3 text-slate-700 dark:text-slate-300">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3 text-slate-700 dark:text-slate-300">
                    {orderTypeLabel(order)}
                  </td>
                  <td className="py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(order.amount)}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${config.className}`}
                    >
                      {config.label}
                    </span>
                  </td>
                  <td className="py-3 text-right text-xs text-slate-400 font-mono">
                    {order.orderCode}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400">
            Trang {page + 1} / {totalPages} ({orders.length} giao dịch)
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
