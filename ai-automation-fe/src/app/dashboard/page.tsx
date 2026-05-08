"use client";

import { useEffect, useState, useTransition } from "react";
import { Store, ArrowRight, Bot, MessageSquare, Zap, Pencil, Check, X, Plus, Crown } from "lucide-react";
import { useTenantStore } from "@/store/tenant-store";
import { useUsageStore } from "@/store/usage-store";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import Link from "next/link";

export default function DashboardPage() {
  const { tenants, activeTenant, hasLoaded, isLoading, fetchTenants, createNewTenant } = useTenantStore();
  const updateTenantName = useTenantStore(state => state.updateTenantName);
  const [shopName, setShopName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Quota state (shared store)
  const usage = useUsageStore(state => state.usage);
  const fetchUsage = useUsageStore(state => state.fetchUsage);
  const refreshTenants = useTenantStore(state => state.refreshTenants);

  useEffect(() => {
    fetchTenants(true);
    fetchUsage(true);
  }, []);

  // Refresh data khi đổi cửa hàng (activeTenant thay đổi)
  const activeTenantId = activeTenant?.id;
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    if (!activeTenantId) return;
    startTransition(async () => {
      await Promise.all([
        refreshTenants(),
        fetchUsage(true),
      ]);
    });
  }, [activeTenantId, refreshTenants, fetchUsage]);

  const tenantQuota = usage?.tenants;
  const canCreate = tenantQuota ? tenantQuota.used < tenantQuota.limit : true;
  const quotaPercent = tenantQuota ? Math.round((tenantQuota.used / tenantQuota.limit) * 100) : 0;

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    setIsSubmitting(true);
    await createNewTenant(shopName);
    setIsSubmitting(false);
  };

  const handleCreateFromModal = async () => {
    if (!createName.trim()) return;
    setCreateError("");
    setIsCreating(true);

    const success = await createNewTenant(createName.trim());
    setIsCreating(false);

    if (success) {
      setCreateName("");
      setShowCreateModal(false);
      fetchUsage(true);
    } else {
      setCreateError("Không thể tạo. Có thể đã đạt giới hạn gói.");
    }
  };

  const startEditing = () => {
    setEditName(activeTenant?.name ?? "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName("");
  };

  const saveNewName = async () => {
    if (!activeTenant || !editName.trim() || editName.trim() === activeTenant.name) {
      cancelEditing();
      return;
    }
    setIsSaving(true);
    const success = await updateTenantName(activeTenant.id, editName.trim());
    setIsSaving(false);
    if (success) setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveNewName();
    if (e.key === "Escape") cancelEditing();
  };

  // 1. Loading (lần đầu hoặc đổi cửa hàng)
  if (!hasLoaded || isLoading || isPending) {
    return <DashboardSkeleton />;
  }

  // 2. Onboarding (first-time user, no tenants)
  if (tenants.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Khởi tạo Không Gian Làm Việc!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
            Có vẻ đây là lần đầu tiên bạn đến với nền tảng. <br className="hidden sm:block"/>
            Vui lòng tạo một Cửa hàng (Workspace) để chứa binh đoàn Bot AI của bạn.
          </p>

          <form onSubmit={handleCreateShop} className="max-w-md mx-auto space-y-6">
            <div className="text-left space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tên Cửa hàng (Thương hiệu)
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                autoFocus
                placeholder="Ví dụ: Giày Thể Thao VN"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-lg"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !shopName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed group text-lg"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Đang thiết lập...
                </>
              ) : (
                <>
                  Tạo Shop Và Đi Tiếp
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Dashboard (has tenants)
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleEditKeyDown}
                disabled={isSaving}
                className="text-3xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none py-0 px-0 w-auto min-w-[200px]"
              />
              <button onClick={saveNewName} disabled={isSaving || !editName.trim()} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Lưu">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={cancelEditing} disabled={isSaving} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Huỷ">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Tổng quan: {activeTenant?.name}
              </h1>
              <button onClick={startEditing} className="p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Đổi tên cửa hàng">
                <Pencil className="w-5 h-5" />
              </button>
            </div>
          )}
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Báo cáo hiệu suất hoạt động của Bot AI trong cửa hàng.
          </p>
        </div>

        {/* Nút tạo cửa hàng mới — chỉ trên dashboard */}
        <button
          onClick={() => canCreate ? setShowCreateModal(true) : null}
          disabled={!canCreate}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
            canCreate
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          }`}
          title={!canCreate ? "Đã đạt giới hạn. Nâng cấp gói để tạo thêm." : ""}
        >
          <Plus className="w-4 h-4" />
          {canCreate ? "Tạo cửa hàng mới" : "Đã đạt giới hạn"}
        </button>
      </div>

      {/* Quota Info Bar */}
      {tenantQuota && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hạn mức cửa hàng</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Gói <span className="font-semibold text-slate-700 dark:text-slate-300">{usage?.plan.name}</span>
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {tenantQuota.used}/{tenantQuota.limit}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                quotaPercent >= 100 ? "bg-red-500" : quotaPercent >= 80 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(quotaPercent, 100)}%` }}
            />
          </div>
          {!canCreate && (
            <div className="mt-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Đã đạt giới hạn.{" "}
                <Link href="/dashboard/billing" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">
                  Nâng cấp gói
                </Link>{" "}
                để tạo thêm cửa hàng.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Grid Thông Số */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-full">Khả dụng</span>
          </div>
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Quota Tin Nhắn</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{activeTenant?.messageQuota || 0}</span>
              <span className="text-slate-400 text-sm">tin</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Tin đã tiêu thụ</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{activeTenant?.messageUsed || 0}</span>
              <span className="text-slate-400 text-sm">tin</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Số Bot đang trực</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">--</span>
              <span className="text-slate-400 text-sm">bot</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Chưa kết nối API Agent</p>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Tạo cửa hàng mới</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {tenantQuota && `Đang sử dụng ${tenantQuota.used}/${tenantQuota.limit} cửa hàng (Gói ${usage?.plan.name})`}
            </p>
            <input
              autoFocus
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFromModal();
                if (e.key === "Escape") setShowCreateModal(false);
              }}
              placeholder="Tên cửa hàng mới..."
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {createError && <p className="text-xs text-red-500 mt-2">{createError}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateFromModal} disabled={isCreating || !createName.trim()} className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isCreating ? "Đang tạo..." : "Tạo cửa hàng"}
              </button>
              <button onClick={() => { setShowCreateModal(false); setCreateName(""); setCreateError(""); }} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
