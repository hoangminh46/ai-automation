import { api } from "../axios";

export interface AgentChannel {
  id: string;
  channelType: "FACEBOOK" | "ZALO";
  externalName: string | null;
  isActive: boolean;
}

export interface AgentKnowledgeLink {
  knowledge: {
    id: string;
    fileName: string;
    status: string;
  };
}

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
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  tools: AgentTool[];
  channels: AgentChannel[];
  knowledgeLinks: AgentKnowledgeLink[];
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
  channelIds?: string[];
}

export type UpdateAgentPayload = Partial<CreateAgentPayload>;

export interface AssignKnowledgePayload {
  knowledgeIds: string[];
}

export interface ChatMessage {
  role: "CUSTOMER" | "BOT" | "HUMAN_AGENT";
  content: string;
}

export interface ChatResponse {
  reply: string;
  agentName: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

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

  syncKnowledge: async (tenantId: string, agentId: string, payload: AssignKnowledgePayload): Promise<{ count: number }> => {
    const response = await api.put(`/tenants/${tenantId}/agents/${agentId}/knowledge`, payload);
    return response.data;
  },

  testChatWithAgent: async (
    tenantId: string,
    agentId: string,
    message: string,
    history?: ChatMessage[],
  ): Promise<ChatResponse> => {
    const response = await api.post(`/tenants/${tenantId}/chat/test`, {
      agentId,
      message,
      history,
    });
    return response.data;
  },
};
