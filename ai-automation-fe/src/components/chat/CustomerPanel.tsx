"use client";

import {
  User,
  MessageSquare,
  Bot,
  Clock,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import {
  ConversationListItem,
  STATUS_CONFIG,
  getAvatarColor,
  formatDateTime,
} from "./types";

interface CustomerPanelProps {
  conversation: ConversationListItem | null;
  onResolve: () => void;
  isResolving: boolean;
  onHandoverToBot: () => void;
  isHandingOver: boolean;
}

export function CustomerPanel({
  conversation,
  onResolve,
  isResolving,
  onHandoverToBot,
  isHandingOver,
}: CustomerPanelProps) {
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <User className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chọn hội thoại để xem thông tin
        </p>
      </div>
    );
  }

  const avatarColor = getAvatarColor(conversation.customer.name);
  const status = STATUS_CONFIG[conversation.status];
  const canHandoverToBot =
    conversation.status === "OPEN" || conversation.status === "SNOOZED";

  return (
    <div className="h-full overflow-y-auto">
      {/* Customer Profile */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-xl shadow-lg mb-3`}
          >
            {conversation.customer.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {conversation.customer.name}
          </h3>
          <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            ID: {conversation.customer.id.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Conversation Details */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Chi tiết hội thoại
        </h4>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Trạng thái
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${status.bgColor} ${status.color}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}
              />
              {status.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Bot
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-xs font-medium truncate max-w-[120px]">
              {conversation.agent.name}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Tin nhắn
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
              {conversation._count.messages}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Bắt đầu
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-xs">
              {formatDateTime(conversation.createdAt)}
            </span>
          </div>

          {conversation.lastMessageAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Cập nhật
              </span>
              <span className="text-slate-700 dark:text-slate-300 text-xs">
                {formatDateTime(conversation.lastMessageAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 space-y-2">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Thao tác
        </h4>

        {/* Bàn giao cho Bot — chỉ hiện khi OPEN hoặc SNOOZED */}
        {canHandoverToBot && (
          <button
            onClick={onHandoverToBot}
            disabled={isHandingOver}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isHandingOver ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                </svg>
                Đang bàn giao...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Bàn giao cho Bot
              </>
            )}
          </button>
        )}

        {/* Đánh dấu đã xử lý */}
        {conversation.status !== "RESOLVED" ? (
          <button
            onClick={onResolve}
            disabled={isResolving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResolving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Đánh dấu đã xử lý
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            Đã xử lý xong
          </div>
        )}
      </div>

      {/* Future enhancement note */}
      <div className="px-5 py-3 mx-4 mb-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
          Thông tin liên hệ, nhãn và ghi chú khách hàng sẽ được bổ sung ở phiên
          bản tiếp theo.
        </p>
      </div>
    </div>
  );
}
