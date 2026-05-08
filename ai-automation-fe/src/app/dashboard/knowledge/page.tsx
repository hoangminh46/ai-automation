"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Database, AlertCircle, FileText, Bot, ChevronDown } from "lucide-react";
import { useTenantStore } from "@/store/tenant-store";
import { useKnowledgeStore } from "@/store/knowledge-store";
import { useAgentStore } from "@/store/agent-store";
import { KnowledgeDocument } from "@/lib/services/knowledge.service";
import { KnowledgeSkeleton } from "@/components/skeletons/knowledge-skeleton";
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

  const agents = useAgentStore((state) => state.agents);
  const fetchAgents = useAgentStore((state) => state.fetchAgents);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bot filter
  const [filterBotId, setFilterBotId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const tenantId = activeTenant?.id;
  useEffect(() => {
    if (!tenantId) return;
    fetchDocuments(tenantId);
    fetchAgents(tenantId);
  }, [tenantId, fetchDocuments, fetchAgents]);

  // Client-side filter
  const filteredDocuments = useMemo(() => {
    if (!filterBotId) return documents;
    return documents.filter((doc) =>
      doc.agentLinks?.some((link) => link.agent.id === filterBotId)
    );
  }, [documents, filterBotId]);

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
    return <KnowledgeSkeleton />;
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

  const selectedBotName = filterBotId
    ? agents.find((a) => a.id === filterBotId)?.name ?? "Bot"
    : null;

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

      {/* Bot Filter + Document List */}
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
        <div className="space-y-4">
          {/* Bot Filter Dropdown */}
          {agents.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    filterBotId
                      ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  {filterBotId ? selectedBotName : "Tất cả bot"}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
                </button>

                {isFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                    <div className="absolute z-20 top-full left-0 mt-1 min-w-[180px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        type="button"
                        onClick={() => { setFilterBotId(null); setIsFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          !filterBotId
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                        }`}
                      >
                        Tất cả bot
                      </button>
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => { setFilterBotId(agent.id); setIsFilterOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            filterBotId === agent.id
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                          }`}
                        >
                          {agent.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {filterBotId && (
                <span className="text-xs text-slate-400">
                  {filteredDocuments.length} / {documents.length} tài liệu
                </span>
              )}
            </div>
          )}

          <DocumentTable documents={filteredDocuments} onDelete={handleOpenDelete} />
        </div>
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
