"use client";

import { useEffect, useState, useCallback } from "react";
import { Bot, Plus, AlertCircle } from "lucide-react";
import { useTenantStore } from "@/store/tenant-store";
import { useAgentStore } from "@/store/agent-store";
import { Agent, CreateAgentPayload } from "@/lib/services/agent.service";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AgentCard } from "@/components/agent/agent-card";
import { AgentEmptyState } from "@/components/agent/agent-empty-state";
import { AgentFormModal } from "@/components/agent/agent-form-modal";
import { AgentDeleteDialog } from "@/components/agent/agent-delete-dialog";

export default function AgentsPage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);

  const agents = useAgentStore((state) => state.agents);
  const hasLoaded = useAgentStore((state) => state.hasLoaded);
  const error = useAgentStore((state) => state.error);
  const fetchAgents = useAgentStore((state) => state.fetchAgents);
  const createAgent = useAgentStore((state) => state.createAgent);
  const updateAgent = useAgentStore((state) => state.updateAgent);
  const deleteAgent = useAgentStore((state) => state.deleteAgent);
  const toggleAgentActive = useAgentStore((state) => state.toggleAgentActive);
  const resetAgentStore = useAgentStore((state) => state.resetAgentStore);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Khi đổi Tenant: reset cache cũ rồi fetch data mới
  const tenantId = activeTenant?.id;
  useEffect(() => {
    if (!tenantId) return;
    resetAgentStore();
    fetchAgents(tenantId);
  }, [tenantId, resetAgentStore, fetchAgents]);

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
    setSelectedAgent(agent);
    setIsDeleteOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    async (agent: Agent) => {
      if (!activeTenant) return;
      await toggleAgentActive(activeTenant.id, agent.id, !agent.isActive);
    },
    [activeTenant, toggleAgentActive]
  );

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

      setIsSubmitting(false);
      if (success) {
        setIsFormOpen(false);
        setSelectedAgent(null);
      }
    },
    [activeTenant, selectedAgent, createAgent, updateAgent]
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

  // Nếu chưa chọn Tenant
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

  // Loading lần đầu
  if (!hasLoaded) {
    return <LoadingScreen text="Đang tải Binh đoàn Bot AI..." />;
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
    </div>
  );
}
