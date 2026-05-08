"use client";

import { Bot, Pencil, Trash2, Power, MessageSquare, Sparkles, Star, Globe } from "lucide-react";
import { Agent } from "@/lib/services/agent.service";

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onToggleActive: (agent: Agent) => void;
}

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  FACEBOOK: { label: "FB", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  ZALO: { label: "Zalo", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
};

export function AgentCard({ agent, onEdit, onDelete, onToggleActive }: AgentCardProps) {
  const channelCount = agent.channels?.length ?? 0;
  const knowledgeCount = agent.knowledgeLinks?.length ?? 0;

  return (
    <div className="group relative bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/60 transition-all duration-300 overflow-hidden">
      {/* Active indicator bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 transition-colors ${
          agent.isActive
            ? "bg-gradient-to-r from-green-400 to-emerald-500"
            : "bg-slate-200 dark:bg-slate-700"
        }`}
      />

      <div className="p-6">
        {/* Header: Bot icon + Name + Status + Default badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                agent.isActive
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <Bot
                className={`w-5 h-5 ${
                  agent.isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  {agent.name}
                </h3>
                {agent.isDefault && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    Mặc định
                  </span>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                  agent.isActive
                    ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30"
                    : "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    agent.isActive ? "bg-green-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {agent.isActive ? "Đang trực" : "Tạm nghỉ"}
              </span>
            </div>
          </div>
        </div>

        {/* Channel chips */}
        {channelCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {agent.channels.map((ch) => {
              const cfg = CHANNEL_LABELS[ch.channelType] ?? { label: ch.channelType, color: "bg-slate-100 text-slate-600" };
              return (
                <span
                  key={ch.id}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${cfg.color}`}
                >
                  <Globe className="w-3 h-3" />
                  {ch.externalName || cfg.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Knowledge count */}
        {knowledgeCount > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            📚 {knowledgeCount} tài liệu
          </p>
        )}

        {/* Greeting preview */}
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {agent.greeting}
            </p>
          </div>
        </div>

        {/* Persona preview */}
        {agent.persona && (
          <div className="flex items-start gap-2 mb-5 px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {agent.persona}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onToggleActive(agent)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              agent.isActive
                ? "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
            }`}
            title={agent.isActive ? "Tạm dừng Bot" : "Kích hoạt Bot"}
          >
            <Power className="w-4 h-4" />
            {agent.isActive ? "Tạm dừng" : "Kích hoạt"}
          </button>

          <div className="flex-1" />

          <button
            onClick={() => onEdit(agent)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-all"
            title="Chỉnh sửa"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {!agent.isDefault && (
            <button
              onClick={() => onDelete(agent)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Xóa Bot"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
