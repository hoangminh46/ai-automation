"use client";

import {
  FileText,
  FileType,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Layers,
} from "lucide-react";
import { KnowledgeDocument, DocumentStatus } from "@/lib/services/knowledge.service";

interface DocumentTableProps {
  documents: KnowledgeDocument[];
  onDelete: (doc: KnowledgeDocument) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  PENDING: {
    label: "Chờ xử lý",
    icon: <Clock className="w-3.5 h-3.5" />,
    className:
      "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800",
  },
  PROCESSING: {
    label: "Đang xử lý",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    className:
      "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800",
  },
  READY: {
    label: "Sẵn sàng",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className:
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800",
  },
  ERROR: {
    label: "Lỗi",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    className:
      "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800",
  },
};

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType === "application/pdf") {
    return (
      <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
        <FileType className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
      <FileText className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
    </div>
  );
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export function DocumentTable({ documents, onDelete }: DocumentTableProps) {
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-[1fr_100px_100px_120px_80px_80px] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <span>Tên tài liệu</span>
        <span>Kích thước</span>
        <span>Trạng thái</span>
        <span>Ngày tạo</span>
        <span className="text-center">Chunks</span>
        <span className="text-center">Thao tác</span>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="grid grid-cols-1 md:grid-cols-[1fr_100px_100px_120px_80px_80px] gap-2 md:gap-4 px-5 py-4 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group"
          >
            {/* File name + icon */}
            <div className="flex items-center gap-3 min-w-0">
              <FileIcon fileType={doc.fileType} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {doc.fileName}
                </p>
                {doc.status === "ERROR" && doc.errorMessage && (
                  <p className="text-xs text-red-500 dark:text-red-400 truncate mt-0.5">
                    {doc.errorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Size */}
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {formatFileSize(doc.fileSize)}
            </span>

            {/* Status */}
            <div>
              <StatusBadge status={doc.status} />
            </div>

            {/* Date */}
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(doc.createdAt)}
            </span>

            {/* Chunks */}
            <div className="flex items-center justify-center">
              {doc.chunkCount !== null && doc.chunkCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {doc.chunkCount}
                </span>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => onDelete(doc)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Xoá tài liệu"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
