# Plan: AI Chatbot Frontend (Next.js)

**Mục tiêu:** Xây dựng Dashboard quản lý (Self-serve Portal) cho các Seller TMĐT Việt Nam.
**Stack:** Next.js 16.2 (App Router), React 19, Tailwind CSS v4, TypeScript, Supabase SSR, Zustand.

---

## 📍 Triết Lý Xây Dựng (Giảm thiểu Bug Backend/Frontend)

Đối với các màn hình phức tạp, áp dụng luồng chia trị:
**DỰNG UI TĨNH (Mock Data) → REVIEW → RÁP API & LOGIC.**

---

## 🗺️ Các Giai Đoạn Triển Khai (Sprints)

### 🧱 SPRINT 1: Nền Tảng (Foundation)
- **Phase 01: Core Architecture**
  - [x] Khởi tạo folder structure.
  - [x] Cài đặt dependencies (`lucide-react`, `zustand`, `@supabase/ssr`, `twMerge`).
  - [x] Tạo `axios` global config tự động đính kèm JWT (đã xong).
  - [x] Setup Middleware bảo vệ route `/dashboard`.
- **Phase 02: Authentication**
  - [x] UI/UX trang Login / Đăng ký với Dark/Light mode đẹp mắt.
  - [x] Tích hợp Supabase Auth Client xác thực trực tiếp trên màn hình, Callback API route xử lý Session.

### 🏪 SPRINT 2: Quản Lý Cửa Hàng (Tenant)
- **Phase 03A: Onboarding**
  - [x] Flow bắt buộc cho User chưa có Cửa hàng: Màn hình chào mừng & Tạo Tenant đầu tiên.
  - [x] Form Create Tenant kết hợp gọi API NestJS BE, Tự sinh Slug.
- **Phase 03B: Dashboard Layout & Settings**
  - [x] Sidebar Navigation tĩnh & Top header.
  - [x] Cài đặt Context toàn cục lưu dữ liệu "Cửa hàng đang chọn" bằng thư viện Zustand (Fetch tự động).
  - [ ] Màn hình Settings đổi tên Cửa hàng.

### 🤖 SPRINT 3: Quản Lý Bot (Agent) & Config
- **Phase 04A: Agent List UI**
  - [ ] Vẽ UI Danh sách Bot (Dạng lưới Cards), kèm Indicator bật/tắt (active/inactive).
  - [ ] Tính năng xoá/huỷ bot qua API.
- **Phase 04B: Cấu hình chuyên sâu (Agent Config) - Phần UI**
  - [ ] Layout Form đẹp: Input Text (Name, Greeting), Textarea lớn (Persona), Sliders (Temperature).
- **Phase 04C: Cấu hình chuyên sâu - Data Binding**
  - [ ] Áp dụng Hook Form / DTO Validation. Load trạng thái Bot từ API BE vào form, và Save.

### 📚 SPRINT 4: Tri thức (Knowledge Base / RAG)
- **Phase 05A: Upload Area & List UI**
  - [ ] Component vùng kéo/thả File (Drag & Drop Zone).
  - [ ] Bảng trạng thái tài liệu (Đang xử lý Vector, Lỗi, Xong).
- **Phase 05B: API Integration**
  - [ ] Đẩy file multipart/form-data sang NestJS Endpoint.

### 💬 SPRINT 5: Tương tác (CRM & Channels)
- **Phase 06A: CRM Layout 3 Cột (Chỉ vẽ UI)**
  - [ ] Vẽ bộ khung: Sidebar trái (List Box chat), Cột giữa (Bóng thoại Customer vs AI), Cột phải (Khách CRM metadata). Mockup dummy data thuần HTML/Tailwind.
- **Phase 06B: Data Binding & Sockets/Polling**
  - [ ] Gọi GET danh sách Conversation. Gọi GET list Messages. Đổ dữ liệu thật vào bong bóng chat.
- **Phase 06C: Manual Override**
  - [ ] Tool bar cho nhân viên tạm ngưng bot, "Cướp quyền", nhập Input gửi tin nhắn thủ công.
- **Phase 06D: Tích hợp Kênh Dữ Liệu (Channels)**
  - [ ] UI Cấu hình Webhook Facebook / QR token.

---

## 🎯 Current Status
- Đã hoàn tất 100% **SPRINT 1 & SPRINT 2 (UI Hạt Nhân + Onboarding Cửa hàng)**.
- Đã xử lý triệt để Re-renders Layout NextJS, Zustand Global Stores, Middleware Edge Supabase V2 Auth. 
- **Next Turn:** Bắt đầu **SPRINT 3 - Quản lý Cấu hình Bot (Agent & Config)**. Chuẩn bị thao tác với API Cấu Hình Bot từ Supabase/NestJS (Phase 04A).
