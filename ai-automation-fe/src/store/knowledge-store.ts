import { create } from "zustand";
import {
  KnowledgeDocument,
  knowledgeService,
} from "@/lib/services/knowledge.service";

interface KnowledgeState {
  documents: KnowledgeDocument[];
  isLoading: boolean;
  loadedForTenantId: string | null;
  error: string | null;

  fetchDocuments: (tenantId: string) => Promise<void>;
  uploadDocument: (tenantId: string, file: File) => Promise<boolean>;
  deleteDocument: (tenantId: string, documentId: string) => Promise<boolean>;
  resetKnowledgeStore: () => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  documents: [],
  isLoading: false,
  loadedForTenantId: null,
  error: null,

  resetKnowledgeStore: () => {
    set({
      documents: [],
      isLoading: false,
      loadedForTenantId: null,
      error: null,
    });
  },

  fetchDocuments: async (tenantId: string) => {
    if (get().loadedForTenantId === tenantId) return;

    set({
      documents: [],
      isLoading: true,
      error: null,
      loadedForTenantId: null,
    });
    try {
      const data = await knowledgeService.getDocuments(tenantId);
      set({ documents: data, loadedForTenantId: tenantId });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách tài liệu";
      set({ error: message, loadedForTenantId: tenantId });
      console.error("Lỗi tải Knowledge Documents:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (tenantId: string, file: File) => {
    set({ error: null });
    try {
      const newDoc = await knowledgeService.uploadDocument(tenantId, file);
      set({ documents: [newDoc, ...get().documents] });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải lên tài liệu";
      set({ error: message });
      console.error("Lỗi upload document:", error);
      return false;
    }
  },

  deleteDocument: async (tenantId: string, documentId: string) => {
    set({ error: null });
    try {
      await knowledgeService.deleteDocument(tenantId, documentId);
      set({
        documents: get().documents.filter((d) => d.id !== documentId),
      });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xoá tài liệu";
      set({ error: message });
      console.error("Lỗi xoá document:", error);
      return false;
    }
  },
}));
