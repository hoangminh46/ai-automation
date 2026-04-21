import { create } from "zustand";
import {
  ConversationListItem,
  chatService,
} from "@/lib/services/chat.service";

interface ConversationState {
  conversations: ConversationListItem[];
  isLoading: boolean;
  loadedForTenantId: string | null;
  error: string | null;

  fetchConversations: (tenantId: string, force?: boolean) => Promise<void>;
  resolveConversation: (
    tenantId: string,
    conversationId: string,
  ) => Promise<boolean>;
  resetConversationStore: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  isLoading: false,
  loadedForTenantId: null,
  error: null,

  resetConversationStore: () => {
    set({
      conversations: [],
      isLoading: false,
      loadedForTenantId: null,
      error: null,
    });
  },

  fetchConversations: async (tenantId: string, force = false) => {
    if (!force && get().loadedForTenantId === tenantId) return;

    set({
      conversations: [],
      isLoading: true,
      error: null,
      loadedForTenantId: null,
    });
    try {
      const data = await chatService.getConversations(tenantId);
      set({ conversations: data, loadedForTenantId: tenantId });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách hội thoại";
      set({ error: message, loadedForTenantId: tenantId });
      console.error("Lỗi tải conversations:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  resolveConversation: async (tenantId: string, conversationId: string) => {
    try {
      await chatService.resolveConversation(tenantId, conversationId);
      set({
        conversations: get().conversations.map((c) =>
          c.id === conversationId
            ? { ...c, status: "RESOLVED" as const }
            : c,
        ),
      });
      return true;
    } catch (error) {
      console.error("Lỗi resolve conversation:", error);
      return false;
    }
  },
}));
