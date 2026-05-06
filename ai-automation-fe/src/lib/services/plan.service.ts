import { api } from "../axios";

export interface Plan {
  slug: string;
  name: string;
  price: number;
  maxAiResponses: number;
  maxBots: number;
  maxTeamMembers: number;
  maxKnowledgeFiles: number;
  maxKnowledgeSizeMb: number;
  hasBrandingWatermark: boolean;
  displayOrder: number;
}

export interface Subscription {
  id: string;
  planSlug: string;
  planName: string;
  status: string;
  billingPeriod: string;
  aiResponsesUsed: number;
  bonusResponsesRemaining: number;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
}

export interface UsageStats {
  plan: { slug: string; name: string };
  aiResponses: { used: number; limit: number; bonus: number };
  bots: { used: number; limit: number };
  team: { used: number; limit: number };
  knowledge: {
    filesUsed: number;
    filesLimit: number;
    sizeUsedMb: number;
    sizeLimitMb: number;
  };
  billing: {
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
    daysRemaining: number | null;
  };
}

export const planService = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get("/plans");
    return response.data;
  },

  getSubscription: async (): Promise<Subscription> => {
    const response = await api.get("/sellers/me/subscription");
    return response.data;
  },

  getUsage: async (): Promise<UsageStats> => {
    const response = await api.get("/sellers/me/usage");
    return response.data;
  },
};
