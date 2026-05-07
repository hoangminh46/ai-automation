"use client";

import { Plan } from "@/lib/services/plan.service";
import { Zap, Bot, Users, Database, Check, X } from "lucide-react";

interface PlanComparisonTableProps {
  plans: Plan[];
  currentPlanSlug: string;
  onUpgrade: (plan: Plan) => void;
}

export function PlanComparisonTable({
  plans,
  currentPlanSlug,
  onUpgrade,
}: PlanComparisonTableProps) {
  const formatLimit = (value: number) => {
    if (value === -1) return "Không giới hạn";
    return value.toLocaleString("vi-VN");
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Miễn phí";
    return `${price.toLocaleString("vi-VN")}đ/tháng`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">
              Tính năng
            </th>
            {plans.map((plan) => (
              <th
                key={plan.slug}
                className={`p-4 text-center ${
                  plan.slug === "standard"
                    ? "bg-blue-50 dark:bg-blue-950/50 rounded-t-2xl"
                    : ""
                }`}
              >
                <div className="space-y-1">
                  {plan.slug === "standard" && (
                    <span className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                      Phổ biến
                    </span>
                  )}
                  <p className="font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {formatPrice(plan.price)}
                  </p>
                  {plan.slug === currentPlanSlug ? (
                    <span className="inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                      Gói hiện tại
                    </span>
                  ) : (
                    plan.slug !== "free" && (
                      <button
                        onClick={() => onUpgrade(plan)}
                        className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        Nâng cấp →
                      </button>
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          <FeatureRow
            icon={<Zap className="w-4 h-4" />}
            label="AI Responses/tháng"
            plans={plans}
            currentSlug={currentPlanSlug}
            getValue={(p) => formatLimit(p.maxAiResponses)}
          />
          <FeatureRow
            icon={<Bot className="w-4 h-4" />}
            label="Số Bot"
            plans={plans}
            currentSlug={currentPlanSlug}
            getValue={(p) => formatLimit(p.maxBots)}
          />
          <FeatureRow
            icon={<Users className="w-4 h-4" />}
            label="Thành viên"
            plans={plans}
            currentSlug={currentPlanSlug}
            getValue={(p) => formatLimit(p.maxTeamMembers)}
          />
          <FeatureRow
            icon={<Database className="w-4 h-4" />}
            label="Tài liệu RAG"
            plans={plans}
            currentSlug={currentPlanSlug}
            getValue={(p) => `${formatLimit(p.maxKnowledgeFiles)} file`}
          />
          <FeatureRow
            icon={<Database className="w-4 h-4" />}
            label="Dung lượng RAG"
            plans={plans}
            currentSlug={currentPlanSlug}
            getValue={(p) => `${p.maxKnowledgeSizeMb}MB`}
          />
          <tr>
            <td className="p-4 text-slate-700 dark:text-slate-300 flex items-center gap-2">
              Branding
            </td>
            {plans.map((plan) => (
              <td
                key={plan.slug}
                className={`p-4 text-center ${
                  plan.slug === "standard"
                    ? "bg-blue-50/50 dark:bg-blue-950/30"
                    : ""
                }`}
              >
                {plan.hasBrandingWatermark ? (
                  <X className="w-4 h-4 text-red-400 mx-auto" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FeatureRow({
  icon,
  label,
  plans,
  currentSlug,
  getValue,
}: {
  icon: React.ReactNode;
  label: string;
  plans: Plan[];
  currentSlug: string;
  getValue: (plan: Plan) => string;
}) {
  return (
    <tr>
      <td className="p-4 text-slate-700 dark:text-slate-300 flex items-center gap-2">
        {icon}
        {label}
      </td>
      {plans.map((plan) => (
        <td
          key={plan.slug}
          className={`p-4 text-center font-medium ${
            plan.slug === currentSlug
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-900 dark:text-slate-100"
          } ${
            plan.slug === "standard"
              ? "bg-blue-50/50 dark:bg-blue-950/30"
              : ""
          }`}
        >
          {getValue(plan)}
        </td>
      ))}
    </tr>
  );
}
