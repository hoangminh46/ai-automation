import { api } from "../axios";

// === Types aligned with BE API (ConversationService + Prisma) ===

export type ConversationStatus = "BOT_HANDLING" | "OPEN" | "SNOOZED" | "RESOLVED";
export type MessageRole = "CUSTOMER" | "ASSISTANT" | "SYSTEM" | "HUMAN_AGENT" | "TOOL";

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

export interface ConversationListItem {
  id: string;
  tenantId: string;
  agentId: string;
  customerId: string;
  assigneeId: string | null;
  status: ConversationStatus;
  channelConversationId: string | null;
  channelType: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  agent: { id: string; name: string };
  customer: { id: string; name: string };
  _count: { messages: number };
}

export interface MessageItem {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string | null;
  attachments: unknown[];
  promptTokens: number | null;
  completionTokens: number | null;
  feedbackScore: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ConversationDetailResponse {
  conversation: ConversationListItem;
  messages: MessageItem[];
}

export const chatService = {
  sendMessage: async (
    tenantId: string,
    payload: SendMessagePayload,
  ): Promise<ChatResponse> => {
    const response = await api.post(`/tenants/${tenantId}/chat`, payload);
    return response.data;
  },

  getConversations: async (
    tenantId: string,
  ): Promise<ConversationListItem[]> => {
    const response = await api.get(`/tenants/${tenantId}/conversations`);
    return response.data;
  },

  getMessages: async (
    tenantId: string,
    conversationId: string,
  ): Promise<ConversationDetailResponse> => {
    const response = await api.get(
      `/tenants/${tenantId}/conversations/${conversationId}/messages`,
    );
    return response.data;
  },

  resolveConversation: async (
    tenantId: string,
    conversationId: string,
  ): Promise<void> => {
    await api.patch(
      `/tenants/${tenantId}/conversations/${conversationId}/resolve`,
    );
  },

  humanReply: async (
    tenantId: string,
    conversationId: string,
    content: string,
  ): Promise<{
    messageId: string;
    conversationId: string;
    content: string;
    role: MessageRole;
    createdAt: string;
  }> => {
    const response = await api.post(
      `/tenants/${tenantId}/conversations/${conversationId}/human-reply`,
      { content },
    );
    return response.data;
  },
};
