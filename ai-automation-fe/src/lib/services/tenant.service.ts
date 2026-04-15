import { api } from "../axios";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  messageQuota: number;
  messageUsed: number;
  createdAt: string;
  updatedAt: string;
  settings?: Record<string, unknown>;
}

export const tenantService = {
  // Lấy toàn bộ danh sách Cửa hàng của tài khoản đang đăng nhập
  getTenants: async (): Promise<Tenant[]> => {
    // Lưu ý: Backend không dùng Global Prefix
    const response = await api.get("/tenants");
    return response.data;
  },

  // Khởi tạo một Cửa hàng mới tinh
  createTenant: async (name: string, description?: string): Promise<Tenant> => {
    // Hàm bóp Tiếng Việt có dấu thành Slug (Ví dụ: "Test Shop 1" -> "test-shop-1")
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || `shop-${Date.now()}`;

    const response = await api.post("/tenants", {
      name,
      slug,
      description,
    });
    return response.data;
  },

  updateTenant: async (tenantId: string, payload: { name?: string; slug?: string }): Promise<Tenant> => {
    const response = await api.patch(`/tenants/${tenantId}`, payload);
    return response.data;
  },
};
