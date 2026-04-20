import { api } from "../axios";

export interface SendMessagePayload {
  agentId: string;
  message: string;
  customerName?: string;
  customerId?: string;
  conversationId?: string;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  reply: string;
  agentName: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Conversation {
  id: string;
  tenantId: string;
  agentId: string;
  customerId: string;
  status: "BOT_HANDLING" | "HUMAN_HANDLING" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "CUSTOMER" | "BOT" | "HUMAN_AGENT";
  content: string;
  createdAt: string;
}

export const chatService = {
  sendMessage: async (
    tenantId: string,
    payload: SendMessagePayload,
  ): Promise<ChatResponse> => {
    const response = await api.post(`/tenants/${tenantId}/chat`, payload);
    return response.data;
  },

  getConversations: async (tenantId: string): Promise<Conversation[]> => {
    const response = await api.get(`/tenants/${tenantId}/conversations`);
    return response.data;
  },

  getMessages: async (
    tenantId: string,
    conversationId: string,
  ): Promise<Message[]> => {
    const response = await api.get(
      `/tenants/${tenantId}/conversations/${conversationId}/messages`,
    );
    return response.data;
  },
};
