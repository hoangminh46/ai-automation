"use client";

import { useEffect, useState, useCallback } from "react";
import { Database, AlertCircle, FileText } from "lucide-react";
import { useTenantStore } from "@/store/tenant-store";
import { useKnowledgeStore } from "@/store/knowledge-store";
import { KnowledgeDocument } from "@/lib/services/knowledge.service";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { UploadZone } from "@/components/knowledge/upload-zone";
import { DocumentTable } from "@/components/knowledge/document-table";
import { KnowledgeDeleteDialog } from "@/components/knowledge/delete-dialog";

export default function KnowledgePage() {
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const tenantHasLoaded = useTenantStore((state) => state.hasLoaded);

  const documents = useKnowledgeStore((state) => state.documents);
  const loadedForTenantId = useKnowledgeStore((state) => state.loadedForTenantId);
  const error = useKnowledgeStore((state) => state.error);
  const fetchDocuments = useKnowledgeStore((state) => state.fetchDocuments);
  const uploadDocument = useKnowledgeStore((state) => state.uploadDocument);
  const deleteDocument = useKnowledgeStore((state) => state.deleteDocument);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tenantId = activeTenant?.id;
  useEffect(() => {
    if (!tenantId) return;
    fetchDocuments(tenantId);
  }, [tenantId, fetchDocuments]);

  const handleUpload = useCallback(
    async (file: File): Promise<boolean> => {
      if (!activeTenant) return false;
      return uploadDocument(activeTenant.id, file);
    },
    [activeTenant, uploadDocument],
  );

  const handleOpenDelete = useCallback((doc: KnowledgeDocument) => {
    setSelectedDoc(doc);
    setIsDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeTenant || !selectedDoc) return;
    setIsDeleting(true);
    const success = await deleteDocument(activeTenant.id, selectedDoc.id);
    setIsDeleting(false);
    if (success) {
      setIsDeleteOpen(false);
      setSelectedDoc(null);
    }
  }, [activeTenant, selectedDoc, deleteDocument]);

  // 1. Chờ cả tenant và knowledge data load xong
  if (
    !tenantHasLoaded ||
    (activeTenant && loadedForTenantId !== activeTenant.id)
  ) {
    return <LoadingScreen text="Đang tải Tri thức RAG..." />;
  }

  // 2. Tenant đã load nhưng chưa tạo cửa hàng
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

  const readyCount = documents.filter((d) => d.status === "READY").length;
  const totalChunks = documents.reduce(
    (sum, d) => sum + (d.chunkCount || 0),
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Tri thức (RAG)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Tải lên tài liệu để Bot AI hiểu rõ hơn về{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {activeTenant.name}
            </strong>
          </p>
        </div>

        {/* Stats badges */}
        {documents.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              <FileText className="w-4 h-4" />
              {readyCount} tài liệu
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 text-sm font-medium">
              <Database className="w-4 h-4" />
              {totalChunks} đoạn tri thức
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload Zone */}
      <UploadZone onUpload={handleUpload} />

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Chưa có tài liệu nào
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Hãy tải lên file .txt hoặc .pdf chứa thông tin về sản phẩm, chính
            sách, FAQ của cửa hàng. Bot AI sẽ dùng tri thức này để trả lời
            khách hàng chính xác hơn.
          </p>
        </div>
      ) : (
        <DocumentTable documents={documents} onDelete={handleOpenDelete} />
      )}

      {/* Delete Dialog */}
      <KnowledgeDeleteDialog
        isOpen={isDeleteOpen}
        document={selectedDoc}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedDoc(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
