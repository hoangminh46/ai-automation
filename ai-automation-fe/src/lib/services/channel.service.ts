import { api } from "../axios";

export interface ChannelConnection {
  id: string;
  channelType: "FACEBOOK";
  externalId: string;
  externalName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectFacebookPayload {
  pageId: string;
  pageAccessToken: string;
  pageName?: string;
}

export const channelService = {
  listChannels: async (tenantId: string): Promise<ChannelConnection[]> => {
    const response = await api.get(`/tenants/${tenantId}/channels`);
    return response.data;
  },

  connectFacebook: async (
    tenantId: string,
    payload: ConnectFacebookPayload,
  ): Promise<ChannelConnection> => {
    const response = await api.post(
      `/tenants/${tenantId}/channels/facebook/connect`,
      payload,
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
};
