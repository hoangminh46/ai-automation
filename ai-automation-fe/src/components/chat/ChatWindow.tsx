"use client";

import React, { useRef, useEffect } from "react";
import {
  Bot,
  User,
  Shield,
  Info,
  Loader2,
  Zap,
  MessageSquare,
  Lock,
} from "lucide-react";
import {
  ConversationListItem,
  MessageItem,
  STATUS_CONFIG,
  getAvatarColor,
  formatDateTime,
} from "./types";

interface ChatWindowProps {
  conversation: ConversationListItem | null;
  messages: MessageItem[];
  isLoadingMessages: boolean;
}

function getRoleConfig(role: MessageItem["role"]) {
  switch (role) {
    case "CUSTOMER":
      return {
        align: "left" as const,
        bubbleBg:
          "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
        textColor: "text-slate-900 dark:text-slate-100",
        icon: <User className="w-4 h-4 text-slate-500" />,
        iconBg: "bg-slate-100 dark:bg-slate-800",
        label: "Khách",
      };
    case "ASSISTANT":
      return {
        align: "right" as const,
        bubbleBg: "bg-blue-600 dark:bg-blue-700",
        textColor: "text-white",
        icon: <Bot className="w-4 h-4 text-white" />,
        iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
        label: "Bot AI",
      };
    case "HUMAN_AGENT":
      return {
        align: "right" as const,
        bubbleBg: "bg-emerald-600 dark:bg-emerald-700",
        textColor: "text-white",
        icon: <Shield className="w-4 h-4 text-white" />,
        iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
        label: "Nhân viên",
      };
    case "SYSTEM":
    case "TOOL":
      return {
        align: "center" as const,
        bubbleBg:
          "bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700",
        textColor: "text-slate-500 dark:text-slate-400",
        icon: <Info className="w-3.5 h-3.5" />,
        iconBg: "",
        label: "Hệ thống",
      };
  }
}

export function ChatWindow({
  conversation,
  messages,
  isLoadingMessages,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6">
          <MessageSquare className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Live Chat CRM
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          Chọn một hội thoại từ danh sách bên trái để xem lịch sử tin nhắn
          giữa khách hàng và Bot AI.
        </p>
      </div>
    );
  }

  const status = STATUS_CONFIG[conversation.status];
  const avatarColor = getAvatarColor(conversation.customer.name);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Chat Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
          >
            {conversation.customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {conversation.customer.name}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium ${status.color}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}
                />
                {status.label}
              </span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Bot: {conversation.agent.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 px-2">
            {conversation._count.messages} tin nhắn
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Đang tải tin nhắn...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hội thoại chưa có tin nhắn nào
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (!msg.content) return null;
            const config = getRoleConfig(msg.role);

            if (config.align === "center") {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full ${config.bubbleBg} ${config.textColor}`}
                  >
                    {config.icon}
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            const isRight = config.align === "right";

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isRight ? "justify-end" : "justify-start"}`}
              >
                {!isRight && (
                  <div
                    className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center shrink-0 mt-1`}
                  >
                    {config.icon}
                  </div>
                )}

                <div
                  className={`max-w-[70%] ${isRight ? "items-end" : "items-start"} flex flex-col`}
                >
                  <span
                    className={`text-[10px] font-medium mb-1 px-1 ${
                      isRight
                        ? "text-right text-slate-400"
                        : "text-left text-slate-400"
                    }`}
                  >
                    {config.label}
                  </span>

                  <div
                    className={`${config.bubbleBg} ${config.textColor} px-4 py-2.5 shadow-sm ${
                      isRight
                        ? "rounded-2xl rounded-tr-md"
                        : "rounded-2xl rounded-tl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>

                    {msg.promptTokens != null && (
                      <div
                        className={`flex items-center gap-1.5 mt-2 pt-2 text-[10px] ${
                          isRight
                            ? "border-t border-white/20 text-white/60"
                            : "border-t border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>
                          {msg.promptTokens}↓ {msg.completionTokens}↑
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>

                {isRight && (
                  <div
                    className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center shrink-0 mt-1`}
                  >
                    {config.icon}
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — Disabled until Phase 06C (Manual Override) */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Tính năng gửi tin nhắn nhân viên sẽ có ở phiên bản tiếp theo
          </p>
        </div>
      </div>
    </div>
  );
}
