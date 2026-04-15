"use client";

import { AlertTriangle } from "lucide-react";
import { Agent } from "@/lib/services/agent.service";

interface AgentDeleteDialogProps {
  isOpen: boolean;
  agent: Agent | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function AgentDeleteDialog({ isOpen, agent, onClose, onConfirm, isDeleting }: AgentDeleteDialogProps) {
  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          {/* Warning icon */}
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Xóa Bot AI?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Bot <strong className="text-slate-700 dark:text-slate-200">&quot;{agent.name}&quot;</strong> sẽ bị xóa vĩnh viễn cùng toàn bộ cấu hình.
            Thao tác này không thể hoàn tác.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-4 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-70 text-sm"
          >
            {isDeleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Đang xóa...
              </>
            ) : (
              "Xác nhận xóa"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
