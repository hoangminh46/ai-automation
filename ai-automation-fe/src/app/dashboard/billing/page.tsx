"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { useUsageStore } from "@/store/usage-store";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";
import { BillingSkeleton } from "@/components/skeletons/billing-skeleton";
import { PaymentModal } from "@/components/billing/payment-modal";
import { TransactionHistory } from "@/components/billing/transaction-history";
import { ResponsePackSelector } from "@/components/billing/response-pack-selector";
import type { Plan } from "@/lib/services/plan.service";

interface SelectedPlan {
  slug: string;
  name: string;
}

export default function BillingPage() {
  const usage = useUsageStore(state => state.usage);
  const plans = useUsageStore(state => state.plans);
  const isLoading = useUsageStore(state => state.isLoading);
  const hasLoadedUsage = useUsageStore(state => state.hasLoadedUsage);
  const fetchUsage = useUsageStore(state => state.fetchUsage);
  const fetchPlans = useUsageStore(state => state.fetchPlans);
  const refreshAll = useUsageStore(state => state.refreshAll);

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [txRefreshKey, setTxRefreshKey] = useState(0);

  useEffect(() => {
    fetchUsage(true);
    fetchPlans(true);
  }, [fetchUsage, fetchPlans]);

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlan({
      slug: plan.slug,
      name: plan.name,
    });
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    setTxRefreshKey((k) => k + 1);
    refreshAll();
  };

  if (!hasLoadedUsage || isLoading) return <BillingSkeleton />;
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
        <ResponsePackSelector onSuccess={() => { refreshAll(); setTxRefreshKey((k) => k + 1); }} />
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
          <TransactionHistory key={txRefreshKey} />
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={!!selectedPlan}
          onClose={() => { setSelectedPlan(null); setTxRefreshKey((k) => k + 1); }}
          onSuccess={handlePaymentSuccess}
          planSlug={selectedPlan.slug}
          planName={selectedPlan.name}
        />
      )}
    </div>
  );
}
