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
  assignBot: (tenantId: string, channelId: string, agentId: string | null) => Promise<boolean>;
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

  assignBot: async (tenantId: string, channelId: string, agentId: string | null) => {
    set({ error: null });
    try {
      const updated = await channelService.assignBot(tenantId, channelId, agentId);
      set({
        channels: get().channels.map((ch) =>
          ch.id === channelId ? updated : ch
        ),
      });
      return true;
    } catch (error) {
      const axiosErr = error as {
        response?: { data?: { message?: string } };
      };
      const message =
        axiosErr.response?.data?.message ||
        (error instanceof Error
          ? error.message
          : "Không thể gán bot cho kênh");
      set({ error: message });
      console.error("Lỗi assign bot:", error);
      return false;
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
