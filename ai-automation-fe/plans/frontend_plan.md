# Plan: AI Chatbot Frontend (Next.js)

**Mục tiêu:** Xây dựng Dashboard quản lý (Self-serve Portal) cho các Seller TMĐT Việt Nam.
**Stack:** Next.js 16.2 (App Router), React 19, Tailwind CSS v4, TypeScript, Supabase SSR, Zustand.

---

## 📍 Triết Lý Xây Dựng (Giảm thiểu Bug Backend/Frontend)

Đối với các màn hình phức tạp, áp dụng luồng chia trị:
**DỰNG UI TĨNH (Mock Data) → REVIEW → RÁP API & LOGIC.**

---

## 🗺️ Các Giai Đoạn Triển Khai (Sprints)

### 🧱 SPRINT 1: Nền Tảng (Foundation) ✅
- **Phase 01: Core Architecture**
  - [x] Khởi tạo folder structure.
  - [x] Cài đặt dependencies (`lucide-react`, `zustand`, `@supabase/ssr`, `twMerge`).
  - [x] Tạo `axios` global config tự động đính kèm JWT (đã xong).
  - [x] Setup Middleware bảo vệ route `/dashboard`.
- **Phase 02: Authentication**
  - [x] UI/UX trang Login / Đăng ký với Dark/Light mode đẹp mắt.
  - [x] Tích hợp Supabase Auth Client xác thực trực tiếp trên màn hình, Callback API route xử lý Session.

### 🏪 SPRINT 2: Quản Lý Cửa Hàng (Tenant) ✅
- **Phase 03A: Onboarding**
  - [x] Flow bắt buộc cho User chưa có Cửa hàng: Màn hình chào mừng & Tạo Tenant đầu tiên.
  - [x] Form Create Tenant kết hợp gọi API NestJS BE, Tự sinh Slug.
- **Phase 03B: Dashboard Layout & Settings**
  - [x] Sidebar Navigation tĩnh & Top header.
  - [x] Cài đặt Context toàn cục lưu dữ liệu "Cửa hàng đang chọn" bằng thư viện Zustand (Fetch tự động).
  - [x] Đổi tên Cửa hàng (inline edit trên tiêu đề Dashboard, không cần trang Settings riêng).

### 🤖 SPRINT 3: Quản Lý Bot (Agent) & Config ✅
- **Phase 04A: Agent List UI** ✅
  - [x] Vẽ UI Danh sách Bot (Dạng lưới Cards), kèm Indicator bật/tắt (active/inactive).
  - [x] Tính năng xoá/huỷ bot qua API.
  - [x] Dark/Light/System Theme Mode + ThemeToggle.
- **Phase 04B: Cấu hình chuyên sâu (Agent Config) - Phần UI** ✅
  - [x] Layout Form: Input Text (Name, Greeting), Textarea lớn (Persona).
  - [x] ~~Sliders (Temperature, MaxTokens)~~ → Ẩn khỏi user, platform controls model.
  - [x] Agent Card hiển thị persona preview thay vì model chips.
- **Phase 04C: Cấu hình chuyên sâu - Data Binding** ✅
  - [x] Nút "Thử Bot" (Test Chat dialog) — giúp seller kiểm tra persona trước khi deploy.
  - [x] Validation nâng cao cho form Agent (name ≥ 2 chars, persona maxLength 2000, greeting maxLength 500).
  - [x] Fix sidebar `<a>` → `<Link>` (SPA client-side navigation).
  - [x] Fix loading flash: dùng `loadedForTenantId` + `tenantHasLoaded` gate.

### 📚 SPRINT 4: Tri thức (Knowledge Base / RAG) ⬜
- **Phase 05A: Upload Area & List UI**
  - [ ] Component vùng kéo/thả File (Drag & Drop Zone).
  - [ ] Bảng trạng thái tài liệu (Đang xử lý Vector, Lỗi, Xong).
- **Phase 05B: API Integration**
  - [ ] Đẩy file multipart/form-data sang NestJS Endpoint.

### 💬 SPRINT 5: Tương tác (CRM & Channels) ⬜
- **Phase 06A: CRM Layout 3 Cột (Chỉ vẽ UI)**
  - [ ] Vẽ bộ khung: Sidebar trái (List Box chat), Cột giữa (Bóng thoại Customer vs AI), Cột phải (Khách CRM metadata). Mockup dummy data thuần HTML/Tailwind.
- **Phase 06B: Data Binding & Sockets/Polling**
  - [ ] Gọi GET danh sách Conversation. Gọi GET list Messages. Đổ dữ liệu thật vào bong bóng chat.
- **Phase 06C: Manual Override**
  - [ ] Tool bar cho nhân viên tạm ngưng bot, "Cướp quyền", nhập Input gửi tin nhắn thủ công.
- **Phase 06D: Tích hợp Kênh Dữ Liệu (Channels)**
  - [ ] UI Cấu hình Webhook Facebook / QR token.

---

## 🎯 Current Status (2026-04-15)

### Đã hoàn tất:
- ✅ **SPRINT 1**: Foundation + Auth (100%)
- ✅ **SPRINT 2**: Tenant Onboarding + Dashboard Layout + Đổi tên (100%)
- ✅ **SPRINT 3**: Agent CRUD + Config + Test Chat + Rate Limit (100%)

### Chưa bắt đầu:
- ⬜ SPRINT 4: Knowledge RAG UI
- ⬜ SPRINT 5: CRM + Facebook Channels

### Thay đổi so với plan gốc:
- **Model/Temperature/MaxTokens**: Ẩn khỏi user — platform controls AI model (business decision 2026-04-15)
- **BE Phase 04 LLM**: Đã hoàn tất — Gemini 2.5 Flash, ConversationModule ready. API sẵn sàng cho Sprint 5.
- **"Thử Bot"**: Thêm vào Phase 04C — seller test persona trước khi deploy Facebook.
- **Test Chat endpoint riêng**: `POST /chat/test` — không lưu DB, rate limited (10 req/hour).
- **Settings page**: Không tạo trang riêng — gộp inline edit đổi tên ngay trên Dashboard title.

### Thứ tự ưu tiên tiếp theo:
```
Sprint 4 (Knowledge RAG UI)                ← TIẾP THEO
Sprint 5 (CRM 3-cột + Facebook)            ← SAU NỮA
```

