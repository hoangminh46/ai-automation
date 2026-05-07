"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { planService, Plan, UsageStats } from "@/lib/services/plan.service";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";
import { PaymentModal } from "@/components/billing/payment-modal";
import { TransactionHistory } from "@/components/billing/transaction-history";
import { ResponsePackSelector } from "@/components/billing/response-pack-selector";

interface SelectedPlan {
  slug: string;
  name: string;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    Promise.all([planService.getPlans(), planService.getUsage()])
      .then(([plansData, usageData]) => {
        setPlans(plansData);
        setUsage(usageData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlan({
      slug: plan.slug,
      name: plan.name,
    });
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    setRefreshKey((k) => k + 1);
  };

  if (loading) return <BillingSkeleton />;
  if (!usage || plans.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gói dịch vụ
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý gói cước, mua thêm responses và xem lịch sử giao dịch
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6" />
            <span className="text-sm font-medium opacity-80">Gói hiện tại</span>
          </div>
          <h2 className="text-3xl font-bold mb-1">{usage.plan.name}</h2>
          <p className="text-sm opacity-80">
            {usage.billing.status === "ACTIVE"
              ? "Đang hoạt động"
              : usage.billing.status}
            {usage.billing.daysRemaining !== null &&
              ` · Còn ${usage.billing.daysRemaining} ngày`}
          </p>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            So sánh các gói
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chọn gói phù hợp với nhu cầu kinh doanh
          </p>
        </div>
        <PlanComparisonTable
          plans={plans}
          currentPlanSlug={usage.plan.slug}
          onUpgrade={handleUpgrade}
        />
      </div>

      {/* Response Pack */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <ResponsePackSelector
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Lịch sử giao dịch
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tất cả giao dịch thanh toán
          </p>
        </div>
        <div className="p-6">
          <TransactionHistory />
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handlePaymentSuccess}
          planSlug={selectedPlan.slug}
          planName={selectedPlan.name}
        />
      )}
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  );
}
