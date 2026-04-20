"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { KnowledgeDocument } from "@/lib/services/knowledge.service";

interface DeleteDialogProps {
  isOpen: boolean;
  document: KnowledgeDocument | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function KnowledgeDeleteDialog({
  isOpen,
  document,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteDialogProps) {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Xoá tài liệu?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
          Bạn sắp xoá tài liệu:
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4 truncate">
          &quot;{document.fileName}&quot;
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Tất cả các đoạn tri thức (chunks) và vector AI liên quan cũng sẽ bị
          xoá vĩnh viễn. Hành động này không thể hoàn tác.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/20 disabled:opacity-70"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xoá...
              </>
            ) : (
              "Xoá vĩnh viễn"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
