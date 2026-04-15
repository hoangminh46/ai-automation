import { api } from "../axios";

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  persona: string;
  greeting: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tools: AgentTool[];
}

export interface AgentTool {
  id: string;
  agentId: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  isActive: boolean;
}

export interface CreateAgentPayload {
  name: string;
  persona?: string;
  greeting?: string;
  isActive?: boolean;
}

export type UpdateAgentPayload = Partial<CreateAgentPayload>;

export const agentService = {
  getAgents: async (tenantId: string): Promise<Agent[]> => {
    const response = await api.get(`/tenants/${tenantId}/agents`);
    return response.data;
  },

  getAgent: async (tenantId: string, agentId: string): Promise<Agent> => {
    const response = await api.get(`/tenants/${tenantId}/agents/${agentId}`);
    return response.data;
  },

  createAgent: async (tenantId: string, payload: CreateAgentPayload): Promise<Agent> => {
    const response = await api.post(`/tenants/${tenantId}/agents`, payload);
    return response.data;
  },

  updateAgent: async (tenantId: string, agentId: string, payload: UpdateAgentPayload): Promise<Agent> => {
    const response = await api.patch(`/tenants/${tenantId}/agents/${agentId}`, payload);
    return response.data;
  },

  deleteAgent: async (tenantId: string, agentId: string): Promise<void> => {
    await api.delete(`/tenants/${tenantId}/agents/${agentId}`);
  },
};
