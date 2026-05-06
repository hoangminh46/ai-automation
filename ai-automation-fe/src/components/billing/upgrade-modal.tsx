"use client";

import { X, MessageCircle, Mail } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Nâng cấp gói dịch vụ
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Liên hệ đội ngũ hỗ trợ để được tư vấn và nâng cấp nhanh chóng
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="https://zalo.me/0123456789"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                Chat Zalo
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phản hồi trong 5 phút
              </p>
            </div>
          </a>

          <a
            href="mailto:support@aichatbot.vn?subject=Nâng cấp gói dịch vụ"
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="w-10 h-10 bg-slate-600 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                Email hỗ trợ
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                support@aichatbot.vn
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
