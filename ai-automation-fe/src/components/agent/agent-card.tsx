"use client";

import { Bot, Pencil, Trash2, Power, Cpu, Thermometer, MessageSquare } from "lucide-react";
import { Agent } from "@/lib/services/agent.service";

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onToggleActive: (agent: Agent) => void;
}

const MODEL_LABELS: Record<string, string> = {
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4o": "GPT-4o",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-3.5-turbo": "GPT-3.5",
};

export function AgentCard({ agent, onEdit, onDelete, onToggleActive }: AgentCardProps) {
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
        {/* Header: Bot icon + Name + Status */}
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
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {agent.name}
              </h3>
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

        {/* Greeting preview */}
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {agent.greeting}
            </p>
          </div>
        </div>

        {/* Model info chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
            <Cpu className="w-3.5 h-3.5" />
            {MODEL_LABELS[agent.model] || agent.model}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
            <Thermometer className="w-3.5 h-3.5" />
            {agent.temperature}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
            {agent.maxTokens} tokens
          </span>
        </div>

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
          <button
            onClick={() => onDelete(agent)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all"
            title="Xóa Bot"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
