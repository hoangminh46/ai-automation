import axios from "axios";
import { createClient } from "./supabase/client";

// Base API config (gọi sang NestJS backend)
export const api = axios.create({
  baseURL:
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Tự động nhét JWT Authentication Header vào mỗi request.
api.interceptors.request.use(
  async (config) => {
    // 1. Khởi tạo Supabase browser client
    const supabase = createClient();
    
    // 2. Lấy session hiện tại
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    
    // 3. Nếu có token đang active → Bơm thẳng vào config headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Bắt lỗi response + auto-unwrap standard format { success, data }
api.interceptors.response.use(
  (response) => {
    // BE trả { success: true, data: ... } → unwrap để service layer vẫn dùng response.data bình thường
    if (response.data && typeof response.data === "object" && "success" in response.data && response.data.success === true) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("JWT Expired or Unauthorized. Should redirect to login.");
    }
    // Extract error message từ standard format { success: false, error: { message } }
    if (error.response?.data?.error?.message) {
      error.message = error.response.data.error.message;
    }
    return Promise.reject(error);
  }
);

