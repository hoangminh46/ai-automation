import { api } from "../axios";

export interface ChannelConnection {
  id: string;
  channelType: "FACEBOOK" | "ZALO";
  externalId: string;
  externalName: string | null;
  isActive: boolean;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const channelService = {
  listChannels: async (tenantId: string): Promise<ChannelConnection[]> => {
    const response = await api.get(`/tenants/${tenantId}/channels`);
    return response.data;
  },

  getFacebookAuthUrl: async (
    tenantId: string,
  ): Promise<{ authUrl: string }> => {
    const response = await api.get(
      `/tenants/${tenantId}/channels/facebook/auth-url`,
    );
    return response.data;
  },

  disconnectFacebook: async (
    tenantId: string,
  ): Promise<ChannelConnection> => {
    const response = await api.delete(
      `/tenants/${tenantId}/channels/facebook/disconnect`,
    );
    return response.data;
  },

  getPendingPages: async (
    tenantId: string,
    sessionId: string,
  ): Promise<{ id: string; name: string }[]> => {
    const response = await api.get(
      `/tenants/${tenantId}/channels/facebook/pending-pages/${sessionId}`,
    );
    return response.data;
  },

  selectFacebookPage: async (
    tenantId: string,
    sessionId: string,
    pageId: string,
  ): Promise<{ pageName: string }> => {
    const response = await api.post(
      `/tenants/${tenantId}/channels/facebook/select-page`,
      { sessionId, pageId },
    );
    return response.data;
  },

  getZaloAuthUrl: async (
    tenantId: string,
  ): Promise<{ authUrl: string }> => {
    const response = await api.get(
      `/tenants/${tenantId}/channels/zalo/auth-url`,
    );
    return response.data;
  },

  disconnectZalo: async (tenantId: string): Promise<ChannelConnection> => {
    const response = await api.delete(
      `/tenants/${tenantId}/channels/zalo/disconnect`,
    );
    return response.data;
  },
};
