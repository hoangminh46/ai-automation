import { api } from "../axios";

export interface PaymentOrder {
  id: string;
  orderCode: string;
  type: "SUBSCRIPTION" | "RESPONSE_PACK";
  amount: number;
  transferContent: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
  responsePackSize?: number;
}

export interface CreateOrderResponse {
  order: PaymentOrder;
  qrUrl: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface OrderStatus {
  status: PaymentOrder["status"];
  completedAt: string | null;
}

export const paymentService = {
  createSubscriptionOrder: async (
    planSlug: string,
    billingPeriod: "MONTHLY" | "YEARLY" = "MONTHLY"
  ): Promise<CreateOrderResponse> => {
    const response = await api.post(
      "/sellers/me/payment-orders/subscription",
      { planSlug, billingPeriod }
    );
    return response.data;
  },

  createResponsePackOrder: async (
    packSize: number
  ): Promise<CreateOrderResponse> => {
    const response = await api.post(
      "/sellers/me/payment-orders/response-pack",
      { packSize }
    );
    return response.data;
  },

  checkOrderStatus: async (orderId: string): Promise<OrderStatus> => {
    const response = await api.get(
      `/sellers/me/payment-orders/${orderId}/status`
    );
    return response.data;
  },

  cancelOrder: async (orderId: string): Promise<PaymentOrder> => {
    const response = await api.delete(
      `/sellers/me/payment-orders/${orderId}`
    );
    return response.data;
  },

  getPendingOrder: async (): Promise<CreateOrderResponse | null> => {
    const response = await api.get("/sellers/me/payment-orders/pending");
    return response.data;
  },

  getOrderHistory: async (limit = 50): Promise<PaymentOrder[]> => {
    const response = await api.get("/sellers/me/payment-orders", {
      params: { limit },
    });
    return response.data;
  },
};
