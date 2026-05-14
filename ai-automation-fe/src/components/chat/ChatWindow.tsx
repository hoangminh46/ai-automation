"use client";

import React, { Fragment, useRef, useEffect, useState } from "react";
import {
  Bot,
  User,
  Shield,
  Info,
  Loader2,
  Zap,
  MessageSquare,
  Send,
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
  onSendMessage?: (content: string) => Promise<void>;
  sendError?: string | null;
}

const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

function normalizeUrl(candidate: string): string {
  return candidate.startsWith("http://") || candidate.startsWith("https://")
    ? candidate
    : `https://${candidate}`;
}

function splitTrailingPunctuation(value: string): [string, string] {
  const match = value.match(/^(.+?)([),.!?:;]+)?$/);
  return [match?.[1] ?? value, match?.[2] ?? ""];
}

function renderInlineContent(text: string, keyPrefix: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const linkRegex =
    /((?:https?:\/\/|www\.)[^\s]+|(?:[\w.+-]+@[\w-]+(?:\.[\w-]+)+))/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  const pushTextWithBold = (value: string) => {
    if (!value) return;

    const boldRegex = /\*\*(.+?)\*\*/g;
    let boldLastIndex = 0;
    let boldMatch: RegExpExecArray | null;

    while ((boldMatch = boldRegex.exec(value)) !== null) {
      const before = value.slice(boldLastIndex, boldMatch.index);
      if (before) {
        result.push(
          <Fragment key={`${keyPrefix}-text-${partIndex++}`}>
            {before}
          </Fragment>,
        );
      }

      result.push(
        <strong key={`${keyPrefix}-bold-${partIndex++}`} className="font-semibold">
          {boldMatch[1]}
        </strong>,
      );
      boldLastIndex = boldMatch.index + boldMatch[0].length;
    }

    const tail = value.slice(boldLastIndex);
    if (tail) {
      result.push(
        <Fragment key={`${keyPrefix}-text-${partIndex++}`}>
          {tail}
        </Fragment>,
      );
    }
  };

  while ((match = linkRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    pushTextWithBold(before);

    const [rawLink, trailing] = splitTrailingPunctuation(match[0]);
    const isEmail = rawLink.includes("@") && !rawLink.includes("/");
    const href = isEmail ? `mailto:${rawLink}` : normalizeUrl(rawLink);

    result.push(
      <a
        key={`${keyPrefix}-link-${partIndex++}`}
        href={href}
        target={isEmail ? undefined : "_blank"}
        rel={isEmail ? undefined : "noreferrer noopener"}
        className="font-medium underline underline-offset-2 decoration-current/60 break-normal"
      >
        {rawLink}
      </a>,
    );

    if (trailing) {
      pushTextWithBold(trailing);
    }

    lastIndex = match.index + match[0].length;
  }

  pushTextWithBold(text.slice(lastIndex));
  return result;
}

function renderMessageBody(content: string): React.ReactNode {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n{2,}/).filter(Boolean);

  return blocks.map((block, blockIndex) => {
    const lines = block.split("\n").map((line) => line.trimEnd());
    const isBulletList =
      lines.length > 1 &&
      lines.every((line) => /^([*-]|•)\s+/.test(line.trim()));

    if (isBulletList) {
      return (
        <ul
          key={`list-${blockIndex}`}
          className="my-2 space-y-1.5 pl-5 marker:text-current/70 list-disc"
        >
          {lines.map((line, lineIndex) => (
            <li key={`list-${blockIndex}-${lineIndex}`} className="pl-1">
              {renderInlineContent(
                line.replace(/^([*-]|•)\s+/, ""),
                `list-${blockIndex}-${lineIndex}`,
              )}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`paragraph-${blockIndex}`} className={blockIndex > 0 ? "mt-3" : ""}>
        {lines.map((line, lineIndex) => (
          <Fragment key={`paragraph-${blockIndex}-${lineIndex}`}>
            {lineIndex > 0 && <br />}
            {renderInlineContent(line, `paragraph-${blockIndex}-${lineIndex}`)}
          </Fragment>
        ))}
      </p>
    );
  });
}

function shouldGroupMessages(
  previous: MessageItem | undefined,
  current: MessageItem | undefined,
): boolean {
  if (!previous || !current) return false;
  if (previous.role !== current.role) return false;

  const previousConfig = getRoleConfig(previous.role);
  const currentConfig = getRoleConfig(current.role);

  if (previousConfig.align === "center" || currentConfig.align === "center") {
    return false;
  }

  const previousTime = new Date(previous.createdAt).getTime();
  const currentTime = new Date(current.createdAt).getTime();

  return (
    Number.isFinite(previousTime) &&
    Number.isFinite(currentTime) &&
    Math.abs(currentTime - previousTime) <= MESSAGE_GROUP_WINDOW_MS
  );
}

function getBubbleShape(
  isRight: boolean,
  groupedWithPrev: boolean,
  groupedWithNext: boolean,
) {
  if (isRight) {
    return [
      "rounded-tl-2xl rounded-bl-2xl",
      groupedWithPrev ? "rounded-tr-md" : "rounded-tr-2xl",
      groupedWithNext ? "rounded-br-md" : "rounded-br-lg",
    ].join(" ");
  }

  return [
    "rounded-tr-2xl rounded-br-2xl",
    groupedWithPrev ? "rounded-tl-md" : "rounded-tl-2xl",
    groupedWithNext ? "rounded-bl-md" : "rounded-bl-lg",
  ].join(" ");
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
  onSendMessage,
  sendError,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset input when switching conversation
  useEffect(() => {
    setInputValue("");
    setIsSending(false);
  }, [conversation?.id]);

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
                Bot: {conversation.agent?.name ?? "Chưa gán bot"}
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
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
          messages.filter((msg) => msg.content).map((msg, index, visibleMessages) => {
            if (!msg.content) return null;
            const config = getRoleConfig(msg.role);
            const previousMessage = visibleMessages[index - 1];
            const nextMessage = visibleMessages[index + 1];
            const groupedWithPrev = shouldGroupMessages(previousMessage, msg);
            const groupedWithNext = shouldGroupMessages(msg, nextMessage);

            if (config.align === "center") {
              return (
                <div key={msg.id} className={`flex justify-center ${index === 0 ? "" : "mt-4"}`}>
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
                className={`flex gap-2.5 ${isRight ? "justify-end" : "justify-start"} ${
                  index === 0 ? "" : groupedWithPrev ? "mt-1.5" : "mt-4"
                }`}
              >
                {!isRight ? (
                  <div
                    className={`w-8 h-8 shrink-0 mt-1 ${groupedWithNext ? "invisible" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}
                    >
                      {config.icon}
                    </div>
                  </div>
                ) : null}

                <div
                  className={`max-w-[min(85%,38rem)] sm:max-w-[min(75%,42rem)] min-w-0 ${
                    isRight ? "items-end" : "items-start"
                  } flex flex-col`}
                >
                  {!groupedWithPrev && (
                    <span
                      className={`text-[10px] font-medium mb-1 px-1 ${
                        isRight
                          ? "text-right text-slate-400"
                          : "text-left text-slate-400"
                      }`}
                    >
                      {config.label}
                    </span>
                  )}

                  <div
                    className={`${config.bubbleBg} ${
                      config.textColor
                    } max-w-full min-w-0 px-4 py-2.5 shadow-sm ${getBubbleShape(
                      isRight,
                      groupedWithPrev,
                      groupedWithNext,
                    )}`}
                  >
                    <div className="message-content text-sm leading-relaxed">
                      {renderMessageBody(msg.content)}
                    </div>

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

                  {!groupedWithNext && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                      {formatDateTime(msg.createdAt)}
                    </span>
                  )}
                </div>

                {isRight ? (
                  <div
                    className={`w-8 h-8 shrink-0 mt-1 ${groupedWithNext ? "invisible" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}
                    >
                      {config.icon}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — Human Reply */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        {/* Send error toast */}
        {sendError && (
          <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400 animate-in fade-in">
            Gửi thất bại: {sendError}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = inputValue.trim();
            if (!trimmed || isSending || !onSendMessage) return;
            setIsSending(true);
            try {
              await onSendMessage(trimmed);
              setInputValue("");
              // Reset textarea height
              if (inputRef.current) inputRef.current.style.height = "auto";
              inputRef.current?.focus();
            } catch {
              // Error handled by parent — keep input text so user can retry
            } finally {
              setIsSending(false);
            }
          }}
          className="flex items-start gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-expand textarea
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              disabled={isSending}
              placeholder="Gửi tin nhắn với tư cách nhân viên..."
              rows={1}
              className="w-full px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-colors disabled:opacity-50"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="shrink-0 self-start w-[42px] h-[42px] flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
