import { api } from "../axios";

export type DocumentStatus = "PENDING" | "PROCESSING" | "READY" | "ERROR";

export interface KnowledgeDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: DocumentStatus;
  errorMessage: string | null;
  chunkCount: number | null;
  createdAt: string;
}

export const knowledgeService = {
  getDocuments: async (tenantId: string): Promise<KnowledgeDocument[]> => {
    const response = await api.get(`/tenants/${tenantId}/knowledge/documents`);
    return response.data;
  },

  uploadDocument: async (
    tenantId: string,
    file: File,
  ): Promise<KnowledgeDocument> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/tenants/${tenantId}/knowledge/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  deleteDocument: async (
    tenantId: string,
    documentId: string,
  ): Promise<{ message: string }> => {
    const response = await api.delete(
      `/tenants/${tenantId}/knowledge/documents/${documentId}`,
    );
    return response.data;
  },
};
