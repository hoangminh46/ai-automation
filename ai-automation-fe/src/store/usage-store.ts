import { create } from "zustand";
import { planService, Plan, UsageStats } from "@/lib/services/plan.service";

interface UsageState {
  usage: UsageStats | null;
  plans: Plan[];
  isLoading: boolean;
  hasLoadedUsage: boolean;
  hasLoadedPlans: boolean;
  error: string | null;

  fetchUsage: (force?: boolean) => Promise<void>;
  fetchPlans: (force?: boolean) => Promise<void>;
  refreshAll: () => Promise<void>;
  resetUsageStore: () => void;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  usage: null,
  plans: [],
  isLoading: false,
  hasLoadedUsage: false,
  hasLoadedPlans: false,
  error: null,

  fetchUsage: async (force = false) => {
    if (!force && get().hasLoadedUsage) return;

    const isFirstLoad = !get().hasLoadedUsage;
    set({ isLoading: isFirstLoad, error: null });
    try {
      const data = await planService.getUsage();
      set({ usage: data, hasLoadedUsage: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải dữ liệu sử dụng";
      set({ error: message });
      console.error("Lỗi tải usage:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPlans: async (force = false) => {
    if (!force && get().hasLoadedPlans) return;
    try {
      const data = await planService.getPlans();
      set({ plans: data, hasLoadedPlans: true });
    } catch (error) {
      console.error("Lỗi tải plans:", error);
    }
  },

  refreshAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [usageData, plansData] = await Promise.all([
        planService.getUsage(),
        planService.getPlans(),
      ]);
      set({
        usage: usageData,
        plans: plansData,
        hasLoadedUsage: true,
        hasLoadedPlans: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải dữ liệu";
      set({ error: message });
      console.error("Lỗi refresh usage/plans:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  resetUsageStore: () => {
    set({
      usage: null,
      plans: [],
      isLoading: false,
      hasLoadedUsage: false,
      hasLoadedPlans: false,
      error: null,
    });
  },
}));
