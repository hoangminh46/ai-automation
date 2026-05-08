"use client";

import { useState } from "react";
import { Package, Zap } from "lucide-react";
import { PaymentModal } from "./payment-modal";

interface ResponsePack {
  size: number;
  price: number;
  label: string;
}

const RESPONSE_PACKS: ResponsePack[] = [
  { size: 500, price: 99000, label: "500 responses" },
  { size: 1500, price: 249000, label: "1,500 responses" },
  { size: 5000, price: 699000, label: "5,000 responses" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

interface ResponsePackSelectorProps {
  onSuccess: () => void;
}

export function ResponsePackSelector({
  onSuccess,
}: ResponsePackSelectorProps) {
  const [selectedPack, setSelectedPack] = useState<ResponsePack | null>(null);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Mua thêm AI Responses
          </h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gói lẻ sẽ được cộng dồn vào tài khoản, không hết hạn.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RESPONSE_PACKS.map((pack) => (
            <button
              key={pack.size}
              onClick={() => setSelectedPack(pack)}
              className="group relative flex flex-col items-center gap-2 p-5 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {pack.label}
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {formatCurrency(pack.price)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reuse PaymentModal cho response pack */}
      {selectedPack && (
        <PaymentModal
          isOpen={!!selectedPack}
          onClose={() => { setSelectedPack(null); onSuccess(); }}
          onSuccess={() => {
            setSelectedPack(null);
            onSuccess();
          }}
          planSlug={`response-pack-${selectedPack.size}`}
          planName={selectedPack.label}
          orderType="RESPONSE_PACK"
          packSize={selectedPack.size}
        />
      )}
    </>
  );
}
