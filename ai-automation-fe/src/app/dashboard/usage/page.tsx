"use client";

import { useEffect } from "react";
import { Zap, Bot, Users, Database, Calendar, ArrowUpRight } from "lucide-react";
import { useUsageStore } from "@/store/usage-store";
import { UsageProgressBar } from "@/components/billing/usage-progress-bar";
import { UsageSkeleton } from "@/components/skeletons/usage-skeleton";
import Link from "next/link";

export default function UsagePage() {
  const usage = useUsageStore(state => state.usage);
  const isLoading = useUsageStore(state => state.isLoading);
  const hasLoadedUsage = useUsageStore(state => state.hasLoadedUsage);
  const error = useUsageStore(state => state.error);
  const fetchUsage = useUsageStore(state => state.fetchUsage);

  useEffect(() => {
    fetchUsage(true);
  }, [fetchUsage]);

  if (!hasLoadedUsage || isLoading) return <UsageSkeleton />;
  if (error) {
    return (
      <div className="text-center py-16 text-red-500 dark:text-red-400">
        <p>{error}</p>
      </div>
    );
  }
  if (!usage) return null;

  const cycleDays = usage.billing.daysRemaining;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tình trạng sử dụng
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gói <span className="font-semibold text-blue-600 dark:text-blue-400">{usage.plan.name}</span>
            {cycleDays !== null && ` · Còn ${cycleDays} ngày trong chu kỳ`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/billing#response-pack"
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-medium text-sm rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4" />
            Mua thêm responses
          </Link>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            Nâng cấp
          </Link>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Responses */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">AI Responses</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lượt trả lời AI trong tháng</p>
            </div>
          </div>
          <UsageProgressBar
            label="Đã sử dụng"
            used={usage.aiResponses.used}
            limit={usage.aiResponses.limit}
          />
          {usage.aiResponses.bonus > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              + {usage.aiResponses.bonus} bonus responses còn lại
            </p>
          )}
        </div>

        {/* Bots */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Bot AI</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng Bot đang hoạt động</p>
            </div>
          </div>
          <UsageProgressBar
            label="Đang dùng"
            used={usage.bots.used}
            limit={usage.bots.limit}
          />
        </div>

        {/* Team */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Thành viên</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nhân sự (không tính chủ shop)</p>
            </div>
          </div>
          <UsageProgressBar
            label="Đang dùng"
            used={usage.team.used}
            limit={usage.team.limit}
          />
        </div>

        {/* Knowledge */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Tri thức (RAG)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tài liệu đào tạo Bot</p>
            </div>
          </div>
          <UsageProgressBar
            label="Số file"
            used={usage.knowledge.filesUsed}
            limit={usage.knowledge.filesLimit}
          />
          <UsageProgressBar
            label="Dung lượng"
            used={usage.knowledge.sizeUsedMb}
            limit={usage.knowledge.sizeLimitMb}
            unit="MB"
          />
        </div>
      </div>

      {/* Cycle Info */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-slate-400" />
          <p className="font-semibold text-slate-900 dark:text-white">Thông tin chu kỳ</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Trạng thái</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              {usage.billing.status}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Bắt đầu</p>
            <p className="font-medium text-slate-900 dark:text-white mt-1">
              {new Date(usage.billing.currentPeriodStart).toLocaleDateString("vi-VN")}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Kết thúc</p>
            <p className="font-medium text-slate-900 dark:text-white mt-1">
              {usage.billing.currentPeriodEnd
                ? new Date(usage.billing.currentPeriodEnd).toLocaleDateString("vi-VN")
                : "Không giới hạn"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Còn lại</p>
            <p className="font-medium text-slate-900 dark:text-white mt-1">
              {cycleDays !== null ? `${cycleDays} ngày` : "∞"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

