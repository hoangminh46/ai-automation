# Phase 04: Frontend Channel UI Extension
Status: ✅ Complete
Dependencies: Phase 02, Phase 03

## Objective
Mở rộng /dashboard/channels page để seller kết nối/ngắt Zalo OA, hiển thị trạng thái, hướng dẫn setup.

## Why This Phase Exists
Seller cần giao diện để kết nối Zalo OA. Tận dụng page /dashboard/channels đã có (từ Sprint 5 Phase 06D) thay vì tạo page mới.

## Scope
### In Scope
- Mở rộng /dashboard/channels: thêm section Zalo OA
- "Kết nối Zalo OA" button → redirect OAuth Zalo
- Hiển thị trạng thái đã kết nối (OA name, created date)
- Disconnect button + confirm dialog
- Setup guide cho Zalo OA (tạo App, cấu hình webhook)
- channel.service.ts FE: thêm getZaloAuthUrl, disconnectZalo

### Out of Scope
- Tạo page mới (reuse existing channels page)
- Zalo OA management (quản lý OA settings)

## Implementation Steps
1. [x] channel.service.ts (FE) — thêm API calls:
   - `getZaloAuthUrl(tenantId)` → GET /tenants/:tenantId/channels/zalo/auth-url
   - `disconnectZalo(tenantId)` → DELETE /tenants/:tenantId/channels/zalo/disconnect
2. [x] channels/page.tsx — mở rộng UI:
   - Section "Zalo Official Account" bên cạnh Facebook section
   - Zalo icon (inline SVG, màu xanh dương Zalo #0068FF)
   - Trạng thái: Chưa kết nối → nút "Kết nối Zalo OA"
   - Trạng thái: Đã kết nối → hiện OA name + nút Disconnect
   - Disconnect confirm dialog (giống FB)
3. [x] OAuth redirect flow:
   - Click "Kết nối" → gọi API lấy auth URL → window.location.href redirect
   - Sau authorize → Zalo redirect về callback BE → BE lưu token → redirect FE /dashboard/channels?zalo=connected
   - FE detect query param → hiện success toast → refresh channel list
4. [x] Setup guide cho Zalo (collapsible):
   - Bước 1: Tạo Zalo OA tại oa.zalo.me
   - Bước 2: Tạo App tại developers.zalo.me
   - Bước 3: Cấu hình webhook URL
   - Bước 4: Xác thực domain
   - Bước 5: Kết nối trên Dashboard
5. [x] Token expiry indicator (optional):
   - Nếu connection isActive nhưng tokenExpiresAt đã quá hạn → hiện warning badge

## Files to Create/Modify
- `src/lib/services/channel.service.ts` (FE) — thêm 2 API calls
- `src/app/dashboard/channels/page.tsx` (FE) — mở rộng UI
- Có thể tách `ZaloChannelSection.tsx` component nếu code dài

## Acceptance Criteria
- [x] Hiển thị section Zalo OA trên /dashboard/channels
- [x] Click "Kết nối" → redirect Zalo OAuth → callback → hiện trạng thái kết nối
- [x] Disconnect → confirm → ngắt kết nối thành công
- [x] Setup guide hiển thị đúng 5 bước
- [x] Dark/light mode hoạt động
- [x] Responsive: mobile-friendly

## Definition of Done
- [x] FE UI hoạt động end-to-end
- [x] TSC 0 errors
- [x] Dark/light mode
- [x] plan.md Phase 04 → ✅ Done

---
Feature complete! 🎉
