"use client";

import { Bot, Sparkles } from "lucide-react";

interface AgentEmptyStateProps {
  onCreateClick: () => void;
}

export function AgentEmptyState({ onCreateClick }: AgentEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Bot className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
        Chưa có Bot AI nào
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-8 leading-relaxed">
        Hãy tạo Bot AI đầu tiên để tự động hoá việc tư vấn & chăm sóc khách hàng
        trên Cửa hàng của bạn.
      </p>

      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all group shadow-lg shadow-blue-600/20"
      >
        <Bot className="w-5 h-5" />
        Tạo Bot AI đầu tiên
        <Sparkles className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}
