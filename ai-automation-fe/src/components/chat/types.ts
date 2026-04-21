import type { ConversationStatus } from "@/lib/services/chat.service";

// Re-export API types for components
export type {
  ConversationStatus,
  ConversationListItem,
  MessageItem,
  MessageRole,
} from "@/lib/services/chat.service";

// === UI-specific config ===

export const STATUS_CONFIG: Record<
  ConversationStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  BOT_HANDLING: {
    label: "Bot xử lý",
    color: "text-blue-700 dark:text-blue-400",
    bgColor:
      "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
  },
  OPEN: {
    label: "Nhân viên",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor:
      "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
  },
  SNOOZED: {
    label: "Tạm hoãn",
    color: "text-amber-700 dark:text-amber-400",
    bgColor:
      "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
  },
  RESOLVED: {
    label: "Đã xong",
    color: "text-slate-500 dark:text-slate-400",
    bgColor:
      "bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700",
    dotColor: "bg-slate-400",
  },
};

// === UI helpers ===

const AVATAR_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-indigo-500 to-blue-500",
  "from-fuchsia-500 to-pink-500",
  "from-teal-500 to-cyan-500",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins}ph`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}
