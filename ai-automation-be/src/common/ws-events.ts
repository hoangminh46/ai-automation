/**
 * WebSocket event types emitted by services, listened by ChatGateway.
 * Pattern: Service emits NestJS EventEmitter event → ChatGateway broadcasts to Socket.IO rooms.
 */

export const WS_EVENTS = {
  NEW_MESSAGE: 'ws.new_message',
  CONVERSATION_UPDATED: 'ws.conversation_updated',
  NEW_CONVERSATION: 'ws.new_conversation',
} as const;

export interface WsNewMessagePayload {
  tenantId: string;
  conversationId: string;
  message: {
    id: string;
    conversationId: string;
    role: string;
    content: string | null;
    createdAt: Date;
  };
}

export interface WsConversationUpdatedPayload {
  tenantId: string;
  conversationId: string;
  status: string | null;
  lastMessageAt: Date | null;
}

export interface WsNewConversationPayload {
  tenantId: string;
  conversation: {
    id: string;
    tenantId: string;
    agentId: string;
    customerId: string;
    status: string;
    channelType: string | null;
    lastMessageAt: Date | null;
    createdAt: Date;
  };
}
