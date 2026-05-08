"use client";

import { useState, useEffect } from "react";
import { Bot, ChevronDown, AlertCircle, AlertTriangle } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import { useChannelStore } from "@/store/channel-store";
import { useTenantStore } from "@/store/tenant-store";
import { ChannelConnection } from "@/lib/services/channel.service";

interface BotAssignmentProps {
  channel: ChannelConnection;
}

export function BotAssignment({ channel }: BotAssignmentProps) {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const tenantId = activeTenant?.id;

  const agents = useAgentStore((s) => s.agents);
  const fetchAgents = useAgentStore((s) => s.fetchAgents);
  const assignBot = useChannelStore((s) => s.assignBot);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Confirm dialog state
  const [pendingAssign, setPendingAssign] = useState<{
    agentId: string | null;
    agentName: string;
  } | null>(null);

  useEffect(() => {
    if (tenantId) fetchAgents(tenantId);
  }, [tenantId, fetchAgents]);

  const currentAgent = channel.agent;

  const handleSelectAgent = (agentId: string | null, agentName: string) => {
    setIsDropdownOpen(false);

    // Nếu đang có bot → cần confirm trước khi đổi
    if (currentAgent && agentId !== currentAgent.id) {
      setPendingAssign({ agentId, agentName });
      return;
    }

    // Gán trực tiếp nếu channel chưa có bot
    executeAssign(agentId);
  };

  const executeAssign = async (agentId: string | null) => {
    if (!tenantId) return;
    setIsAssigning(true);
    const success = await assignBot(tenantId, channel.id, agentId);
    if (success) {
      // Refresh agents store để sync channel chips
      await fetchAgents(tenantId, true);
    }
    setIsAssigning(false);
    setPendingAssign(null);
  };

  return (
    <div className="space-y-3">
      {/* Bot assignment label */}
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
          Bot phụ trách
        </span>
      </div>

      {/* Current assignment + dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isAssigning}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-60 ${
            currentAgent
              ? "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-700"
              : "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-300 dark:hover:border-amber-700"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {currentAgent ? (
              <>
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  currentAgent.isActive ? "bg-green-500" : "bg-slate-400"
                }`} />
                <span className="truncate">{currentAgent.name}</span>
                {currentAgent.isDefault && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                    ⭐
                  </span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Chưa gán bot</span>
              </>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Bỏ gán option */}
              {currentAgent && (
                <button
                  type="button"
                  onClick={() => handleSelectAgent(null, "Bỏ gán")}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  — Bỏ gán —
                </button>
              )}

              {agents.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-400 italic">
                  Chưa có bot nào. Tạo bot ở trang Agents trước.
                </p>
              ) : (
                agents.map((agent) => {
                  const isSelected = currentAgent?.id === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleSelectAgent(agent.id, agent.name)}
                      disabled={isSelected}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 cursor-default"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          agent.isActive ? "bg-green-500" : "bg-slate-400"
                        }`} />
                        <span className="truncate">{agent.name}</span>
                        {agent.isDefault && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                            ⭐
                          </span>
                        )}
                      </div>
                      {!agent.isActive && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          inactive
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] text-blue-500 font-semibold shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Warning: chưa gán bot */}
      {!currentAgent && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Chưa gán bot — chọn bot để bật auto-reply
        </p>
      )}

      {/* Info: bot inactive */}
      {currentAgent && !currentAgent.isActive && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Bot đang inactive, chưa auto-reply
        </p>
      )}

      {/* Assigning spinner */}
      {isAssigning && (
        <p className="text-xs text-blue-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Đang cập nhật...
        </p>
      )}

      {/* Confirm dialog khi đổi bot */}
      {pendingAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPendingAssign(null)}
          />
          <div className="relative bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {pendingAssign.agentId ? "Đổi Bot phụ trách?" : "Bỏ gán Bot?"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {pendingAssign.agentId ? (
                  <>
                    Bot <strong className="text-slate-700 dark:text-slate-200">&quot;{currentAgent?.name}&quot;</strong> sẽ ngừng trả lời kênh{" "}
                    <strong className="text-slate-700 dark:text-slate-200">{channel.externalName || channel.channelType}</strong>.{" "}
                    Bot <strong className="text-slate-700 dark:text-slate-200">&quot;{pendingAssign.agentName}&quot;</strong> sẽ tiếp quản. Lịch sử hội thoại giữ nguyên.
                  </>
                ) : (
                  <>
                    Kênh <strong className="text-slate-700 dark:text-slate-200">{channel.externalName || channel.channelType}</strong> sẽ không có bot phụ trách. Tin nhắn mới sẽ không được tự động trả lời.
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 pt-0">
              <button
                type="button"
                onClick={() => setPendingAssign(null)}
                className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-medium text-sm transition-all"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => executeAssign(pendingAssign.agentId)}
                disabled={isAssigning}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-70 text-sm"
              >
                {isAssigning ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
