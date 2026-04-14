import axios from "axios";
import { createClient } from "./supabase/client";

// Base API config (gọi sang NestJS backend)
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
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

// Bắt lỗi response (ví dụ 401 hết phiên đăng nhập -> đá ra màn login)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Logic xử lý kick về trang đăng nhập nếu JWT hết hạn (tạm log console)
      console.warn("JWT Expired or Unauthorized. Should redirect to login.");
    }
    return Promise.reject(error);
  }
);
