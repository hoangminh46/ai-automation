import { create } from "zustand";
import {
  channelService,
  ChannelConnection,
} from "@/lib/services/channel.service";

interface ChannelState {
  channels: ChannelConnection[];
  isLoading: boolean;
  loadedForTenantId: string | null;
  error: string | null;

  fetchChannels: (tenantId: string, force?: boolean) => Promise<void>;
  resetChannelStore: () => void;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  isLoading: false,
  loadedForTenantId: null,
  error: null,

  fetchChannels: async (tenantId: string, force = false) => {
    if (!force && get().loadedForTenantId === tenantId) return;

    const isFirstLoad = get().loadedForTenantId !== tenantId;
    set({
      channels: isFirstLoad ? [] : get().channels,
      isLoading: isFirstLoad,
      error: null,
      loadedForTenantId: isFirstLoad ? null : tenantId,
    });
    try {
      const data = await channelService.listChannels(tenantId);
      set({ channels: data, loadedForTenantId: tenantId });
    } catch (error) {
      const axiosErr = error as {
        response?: { data?: { message?: string } };
      };
      const message =
        axiosErr.response?.data?.message ||
        (error instanceof Error
          ? error.message
          : "Không thể tải danh sách kênh");
      set({ error: message, loadedForTenantId: tenantId });
      console.error("Lỗi tải channels:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  resetChannelStore: () => {
    set({
      channels: [],
      isLoading: false,
      loadedForTenantId: null,
      error: null,
    });
  },
}));
