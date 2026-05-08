"use client";

import { useEffect, useState, useCallback } from "react";
import { Bot, Plus, AlertCircle } from "lucide-react";
import { useTenantStore } from "@/store/tenant-store";
import { useAgentStore } from "@/store/agent-store";
import { Agent, CreateAgentPayload } from "@/lib/services/agent.service";
import { AgentsSkeleton } from "@/components/skeletons/agents-skeleton";
import { AgentCard } from "@/components/agent/agent-card";
import { AgentEmptyState } from "@/components/agent/agent-empty-state";
import { AgentFormModal } from "@/components/agent/agent-form-modal";
import { AgentDeleteDialog } from "@/components/agent/agent-delete-dialog";

export default function AgentsPage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const tenantHasLoaded = useTenantStore((state) => state.hasLoaded);

  const agents = useAgentStore((state) => state.agents);
  const loadedForTenantId = useAgentStore((state) => state.loadedForTenantId);
  const error = useAgentStore((state) => state.error);
  const fetchAgents = useAgentStore((state) => state.fetchAgents);
  const createAgent = useAgentStore((state) => state.createAgent);
  const updateAgent = useAgentStore((state) => state.updateAgent);
  const deleteAgent = useAgentStore((state) => state.deleteAgent);
  const toggleAgentActive = useAgentStore((state) => state.toggleAgentActive);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle warning
  const [toggleWarning, setToggleWarning] = useState<{ agentId: string; targetActive: boolean } | null>(null);

  const tenantId = activeTenant?.id;
  useEffect(() => {
    if (!tenantId) return;
    fetchAgents(tenantId);
  }, [tenantId, fetchAgents]);

  // Handlers
  const handleOpenCreate = useCallback(() => {
    setSelectedAgent(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setIsFormOpen(true);
  }, []);

  const handleOpenDelete = useCallback((agent: Agent) => {
    if (agent.isDefault) return;
    setSelectedAgent(agent);
    setIsDeleteOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    (agent: Agent) => {
      if (agent.isActive) {
        setToggleWarning({ agentId: agent.id, targetActive: false });
      } else {
        if (!activeTenant) return;
        toggleAgentActive(activeTenant.id, agent.id, true);
      }
    },
    [activeTenant, toggleAgentActive]
  );

  const confirmToggle = useCallback(async () => {
    if (!activeTenant || !toggleWarning) return;
    await toggleAgentActive(activeTenant.id, toggleWarning.agentId, toggleWarning.targetActive);
    setToggleWarning(null);
  }, [activeTenant, toggleWarning, toggleAgentActive]);

  const handleFormSubmit = useCallback(
    async (payload: CreateAgentPayload) => {
      if (!activeTenant) return;
      setIsSubmitting(true);

      let success: boolean;
      if (selectedAgent) {
        success = await updateAgent(activeTenant.id, selectedAgent.id, payload);
      } else {
        success = await createAgent(activeTenant.id, payload);
      }

      if (success) {
        // Knowledge sync for new agents (create returns updated agent in store)
        if (!selectedAgent && payload.channelIds) {
          // Knowledge sẽ sync trong form modal cho edit mode
        }
        await fetchAgents(activeTenant.id, true);
      }

      setIsSubmitting(false);
      if (success) {
        setIsFormOpen(false);
        setSelectedAgent(null);
      }
    },
    [activeTenant, selectedAgent, createAgent, updateAgent, fetchAgents]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeTenant || !selectedAgent) return;
    setIsDeleting(true);
    const success = await deleteAgent(activeTenant.id, selectedAgent.id);
    setIsDeleting(false);
    if (success) {
      setIsDeleteOpen(false);
      setSelectedAgent(null);
    }
  }, [activeTenant, selectedAgent, deleteAgent]);

  // 1. Chờ cả tenant và agent data load xong
  if (!tenantHasLoaded || (activeTenant && loadedForTenantId !== activeTenant.id)) {
    return <AgentsSkeleton />;
  }

  // 2. Tenant đã load nhưng chưa tạo cửa hàng
  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Chưa chọn Cửa hàng
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Vui lòng tạo hoặc chọn một Cửa hàng ở trang Tổng quan trước.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Binh đoàn Bot AI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Quản lý toàn bộ Bot AI đang phục vụ{" "}
            <strong className="text-slate-700 dark:text-slate-200">{activeTenant.name}</strong>
          </p>
        </div>

        {agents.length > 0 && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-600/20 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Tạo Bot mới
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Content */}
      {agents.length === 0 ? (
        <AgentEmptyState onCreateClick={handleOpenCreate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AgentFormModal
        isOpen={isFormOpen}
        agent={selectedAgent}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAgent(null);
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <AgentDeleteDialog
        isOpen={isDeleteOpen}
        agent={selectedAgent}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedAgent(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Toggle inactive warning dialog */}
      {toggleWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setToggleWarning(null)}
          />
          <div className="relative bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Tạm dừng Bot?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Bot sẽ <strong className="text-slate-700 dark:text-slate-200">không tự động trả lời</strong> tin nhắn dù có kênh kết nối. Tin nhắn mới sẽ được chuyển sang trạng thái chờ xử lý.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 pt-0">
              <button
                type="button"
                onClick={() => setToggleWarning(null)}
                className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-medium text-sm transition-all"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={confirmToggle}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm"
              >
                Xác nhận tạm dừng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
