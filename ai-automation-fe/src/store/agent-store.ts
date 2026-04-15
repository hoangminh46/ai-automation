import { create } from "zustand";
import { Agent, CreateAgentPayload, UpdateAgentPayload, agentService } from "@/lib/services/agent.service";

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  loadedForTenantId: string | null;
  error: string | null;

  fetchAgents: (tenantId: string) => Promise<void>;
  createAgent: (tenantId: string, payload: CreateAgentPayload) => Promise<boolean>;
  updateAgent: (tenantId: string, agentId: string, payload: UpdateAgentPayload) => Promise<boolean>;
  deleteAgent: (tenantId: string, agentId: string) => Promise<boolean>;
  toggleAgentActive: (tenantId: string, agentId: string, isActive: boolean) => Promise<boolean>;
  resetAgentStore: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  isLoading: false,
  loadedForTenantId: null,
  error: null,

  resetAgentStore: () => {
    set({ agents: [], isLoading: false, loadedForTenantId: null, error: null });
  },

  fetchAgents: async (tenantId: string) => {
    // Nếu đã load cho đúng tenant này rồi thì bỏ qua
    if (get().loadedForTenantId === tenantId) return;

    // Reset data cũ + bật loading (atomic, không có trạng thái trung gian)
    set({ agents: [], isLoading: true, error: null, loadedForTenantId: null });
    try {
      const data = await agentService.getAgents(tenantId);
      set({ agents: data, loadedForTenantId: tenantId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách Bot";
      set({ error: message, loadedForTenantId: tenantId });
      console.error("Lỗi tải danh sách Agent:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  createAgent: async (tenantId: string, payload: CreateAgentPayload) => {
    set({ isLoading: true, error: null });
    try {
      const newAgent = await agentService.createAgent(tenantId, payload);
      set({ agents: [...get().agents, newAgent] });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tạo Bot";
      set({ error: message });
      console.error("Lỗi tạo Agent:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAgent: async (tenantId: string, agentId: string, payload: UpdateAgentPayload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await agentService.updateAgent(tenantId, agentId, payload);
      set({
        agents: get().agents.map((a) => (a.id === agentId ? updated : a)),
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể cập nhật Bot";
      set({ error: message });
      console.error("Lỗi cập nhật Agent:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAgent: async (tenantId: string, agentId: string) => {
    set({ isLoading: true, error: null });
    try {
      await agentService.deleteAgent(tenantId, agentId);
      set({ agents: get().agents.filter((a) => a.id !== agentId) });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa Bot";
      set({ error: message });
      console.error("Lỗi xóa Agent:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleAgentActive: async (tenantId: string, agentId: string, isActive: boolean) => {
    set({ error: null });
    try {
      const updated = await agentService.updateAgent(tenantId, agentId, { isActive });
      set({
        agents: get().agents.map((a) => (a.id === agentId ? updated : a)),
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể chuyển trạng thái Bot";
      set({ error: message });
      console.error("Lỗi toggle Agent:", error);
      return false;
    }
  },
}));
