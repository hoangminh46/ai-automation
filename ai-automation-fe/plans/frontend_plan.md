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

### 📚 SPRINT 4: Tri thức (Knowledge Base / RAG) ✅
- **Phase 05A: Upload Area & List UI** ✅
  - [x] Component vùng kéo/thả File (Drag & Drop Zone) với visual feedback.
  - [x] Bảng trạng thái tài liệu (PENDING/PROCESSING/READY/ERROR) với status badges.
  - [x] Stats badges (số tài liệu sẵn sàng + tổng chunks).
  - [x] Empty state hướng dẫn seller upload tài liệu đầu tiên.
  - [x] Delete dialog xác nhận xoá tài liệu (cascade chunks).
- **Phase 05B: API Integration** ✅
  - [x] knowledge.service.ts — API layer (GET/POST/DELETE documents).
  - [x] knowledge-store.ts — Zustand store (loadedForTenantId pattern).
  - [x] Multipart/form-data upload qua axios.

### 💬 SPRINT 5: Tương tác (CRM & Channels) 🟡
- **Phase 06A: CRM Layout 3 Cột (Chỉ vẽ UI)** ✅
  - [x] Vẽ bộ khung: Sidebar trái (ConversationList), Cột giữa (ChatWindow — bóng thoại 5 roles), Cột phải (CustomerPanel — metadata + resolve).
  - [x] Loading skeleton 3 cột, dark/light mode, responsive (ẩn panel phải < xl).
  - [x] types.ts (STATUS_CONFIG, helpers), full-height layout cho /dashboard/chat route.
- **Phase 06B: Data Binding** ✅
  - [x] conversation-store.ts — Zustand store (loadedForTenantId gate, optimistic resolve).
  - [x] chat.service.ts — Types aligned với BE Prisma schema (ConversationListItem, MessageItem, 4 endpoints).
  - [x] ConversationList → API data (agent name, message count, status badges, search+filter).
  - [x] ChatWindow → Real messages (5 roles, token display, loading/empty states). Input disabled (Phase 06C).
  - [x] CustomerPanel → Limited API data (name, conversation details, resolve button).
  - [x] Error banners, refresh button, loading states throughout.
- **Phase 06C: Manual Override** ✅
  - [x] Wire input area → POST /conversations/:id/human-reply.
  - [x] Nhân viên gửi tin nhắn trực tiếp (HUMAN_AGENT role), auto-take over conversation.
  - [x] Error toast (auto-dismiss 4s), giữ nội dung khi lỗi, auto-expand textarea.
  - [x] Silent refresh store (không flash UI), optimistic status update (OPEN + lastMessageAt).
  - [x] Reset input khi đổi conversation.
- **Phase 06D: Tích hợp Kênh Dữ Liệu (Channels)** ⬜
  - [ ] UI Cấu hình Webhook Facebook / QR token.
- **Phase 06E: Real-time CRM Updates** ⬜
  - [ ] Polling messages mỗi 5-10s khi đang xem conversation (hoặc WebSocket nếu cần).
  - [ ] Hiển thị tin nhắn mới từ Customer/Bot mà không cần refresh thủ công.
  - [ ] *Ưu tiên: làm SAU khi Facebook Channel hoạt động — cần dữ liệu thật để test.*

---

## 🎯 Current Status (2026-04-23)

### Đã hoàn tất:
- ✅ **SPRINT 1**: Foundation + Auth (100%)
- ✅ **SPRINT 2**: Tenant Onboarding + Dashboard Layout + Đổi tên (100%)
- ✅ **SPRINT 3**: Agent CRUD + Config + Test Chat + Rate Limit (100%)
- ✅ **SPRINT 4**: Knowledge RAG UI — Upload Zone + Document Table + API Integration (100%)

### Đang làm:
- 🟡 **SPRINT 5**: CRM + Channels (Phase 06A+B+C done + Handover to Bot, 06D next)

### Thay đổi so với plan gốc:
- **Model/Temperature/MaxTokens**: Ẩn khỏi user — platform controls AI model (business decision 2026-04-15)
- **BE Phase 04 LLM**: Đã hoàn tất — Gemini 2.5 Flash, ConversationModule ready. API sẵn sàng cho Sprint 5.
- **"Thử Bot"**: Thêm vào Phase 04C — seller test persona trước khi deploy Facebook.
- **Test Chat endpoint riêng**: `POST /chat/test` — không lưu DB, rate limited (10 req/hour).
- **Settings page**: Không tạo trang riêng — gộp inline edit đổi tên ngay trên Dashboard title.
- **Sprint 4 mở rộng**: Thêm stats badges, empty state hướng dẫn, status badges (PENDING/PROCESSING/READY/ERROR).
- **Sprint 5 Phase 06B**: Bỏ Sockets/Polling (chưa cần), thay bằng API fetch + manual refresh.
- **BE human-reply endpoint**: Thêm `POST /conversations/:id/human-reply` — nhân viên gửi trực tiếp, không qua LLM (2026-04-21).
- **Phase 06C polish**: Error toast, auto-expand textarea, silent refresh store, optimistic update (2026-04-22).
- **Phase 06E**: Thêm phase Real-time CRM Updates (polling/WS) — làm sau khi Facebook Channel hoạt động.
- **Handover to Bot**: Thêm nút "Bàn giao cho Bot" trong CustomerPanel + API `PATCH .../handover-bot` (2026-04-23).
- **BE Phase 09 done**: Facebook Channel hoàn thành (webhook, adapter, routing, reply, handover) — 9/11 phases.

### Thứ tự ưu tiên tiếp theo:
```
Phase 06D: Facebook Channel UI (config webhook, connect page) ← TIẾP THEO
Phase 06E: Real-time CRM Updates (polling/WebSocket)          ← SAU
```
