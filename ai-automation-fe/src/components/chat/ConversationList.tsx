"use client";

import { useState } from "react";
import { Search, Filter, Bot, Loader2 } from "lucide-react";
import {
  ConversationListItem,
  STATUS_CONFIG,
  getAvatarColor,
  formatTimeAgo,
} from "./types";

type FilterTab = "ALL" | "ACTIVE" | "RESOLVED";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ACTIVE", label: "Đang xử lý" },
  { key: "RESOLVED", label: "Đã xong" },
];

function filterConversations(
  conversations: ConversationListItem[],
  filter: FilterTab,
  search: string,
): ConversationListItem[] {
  let filtered = conversations;

  if (filter === "ACTIVE") {
    filtered = filtered.filter((c) => c.status !== "RESOLVED");
  } else if (filter === "RESOLVED") {
    filtered = filtered.filter((c) => c.status === "RESOLVED");
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((c) =>
      c.customer.name.toLowerCase().includes(q),
    );
  }

  return filtered;
}

interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");

  const filtered = filterConversations(conversations, filterTab, searchQuery);
  const activeCount = conversations.filter((c) => c.status !== "RESOLVED").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Hội thoại
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {conversations.length} tổng
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterTab === tab.key
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
              {tab.key === "ACTIVE" && activeCount > 0 && (
                <span className="ml-1 text-[10px] opacity-60">
                  ({activeCount})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Đang tải hội thoại...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Không tìm thấy kết quả"
                : "Chưa có hội thoại nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onClick={() => onSelect(conv.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: ConversationListItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = STATUS_CONFIG[conversation.status];
  const avatarColor = getAvatarColor(conversation.customer.name);
  const initial = conversation.customer.name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all group relative ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          : "hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
          >
            {initial}
          </div>
          {conversation.status !== "RESOLVED" && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${status.dotColor} border-2 border-white dark:border-slate-950`}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-semibold truncate ${
                isSelected
                  ? "text-blue-900 dark:text-blue-200"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {conversation.customer.name}
            </span>
            {conversation.lastMessageAt && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                {formatTimeAgo(conversation.lastMessageAt)}
              </span>
            )}
          </div>

          {/* Agent info */}
          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            <Bot className="w-3 h-3 shrink-0" />
            <span className="truncate">{conversation.agent.name}</span>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${status.bgColor} ${status.color}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}
              />
              {status.label}
            </span>

            {/* Message count */}
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {conversation._count.messages} tin nhắn
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
