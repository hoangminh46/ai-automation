import { create } from "zustand";
import { Tenant, tenantService } from "@/lib/services/tenant.service";

interface TenantState {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  isLoading: boolean;
  hasLoaded: boolean; // Flag chặn việc call lại API liên tục
  
  // Hành động
  fetchTenants: () => Promise<void>;
  setActiveTenant: (tenant: Tenant) => void;
  createNewTenant: (name: string) => Promise<boolean>;
  clearStore: () => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  tenants: [],
  activeTenant: null,
  isLoading: false,
  hasLoaded: false,

  clearStore: () => {
    set({
      tenants: [],
      activeTenant: null,
      isLoading: false,
      hasLoaded: false,
    });
  },

  fetchTenants: async () => {
    // Nếu đã load rồi thì bỏ qua để tiết kiệm API Calls
    if (get().hasLoaded) return;
    
    set({ isLoading: true });
    try {
      const data = await tenantService.getTenants();
      set({ 
        tenants: data, 
        activeTenant: data.length > 0 ? data[0] : null,
        hasLoaded: true 
      });
    } catch (error) {
      console.error("Lỗi lấy danh sách Tenant:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveTenant: (tenant) => set({ activeTenant: tenant }),

  createNewTenant: async (name) => {
    set({ isLoading: true });
    try {
      const newTenant = await tenantService.createTenant(name);
      const currentTenants = get().tenants;
      // Cộng dồn vào danh sách hiện tại & Đặt luôn làm cửa hàng đang thao tác
      set({ 
        tenants: [...currentTenants, newTenant],
        activeTenant: newTenant,
      });
      return true;
    } catch (error) {
      console.error("Lỗi khởi tạo Tenant:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
}));
