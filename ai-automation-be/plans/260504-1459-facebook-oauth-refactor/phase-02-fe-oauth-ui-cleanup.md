# Phase 02: FE — OAuth UI + Cleanup Legacy
Status: ✅ Complete
Dependencies: Phase 01

## Objective
Đổi UI kết nối Facebook từ form manual (nhập Page ID + Token) sang nút OAuth 1-click. Cleanup code cũ.

## Why This Phase Exists
FE cần matching với BE OAuth flow mới. Đồng thời dọn code cũ (form, DTO, service methods) không còn dùng.

## Scope
### In Scope
- Tạo `FacebookChannelSection.tsx` (giống ZaloChannelSection pattern)
- channels/page.tsx: xoá form manual, import FacebookChannelSection
- channel.service.ts (FE): thêm `getFacebookAuthUrl()`, xoá `connectFacebook()`
- Xử lý OAuth callback query params `?facebook=connected/error`
- Cleanup BE: xoá `ConnectFacebookDto`, xoá/deprecate `POST facebook/connect` endpoint

### Out of Scope
- Multi-page selection UI (nếu user có nhiều Pages → chọn Page đầu tiên, enhancement sau)
- Facebook setup guide (giữ setup guide card hiện tại)

## Implementation Steps
1. [x] channel.service.ts (FE) — thay đổi:
   - Thêm `getFacebookAuthUrl(tenantId)` → `GET /tenants/:id/channels/facebook/auth-url`
   - Xoá `connectFacebook()` (không cần nữa)
   - Xoá `ConnectFacebookPayload` interface
2. [x] FacebookChannelSection.tsx — NEW component:
   - Pattern giống ZaloChannelSection
   - Not connected: nút "Kết nối Facebook Page" → redirect OAuth
   - Connected: hiện Page name, Page ID, trạng thái, ngày kết nối
   - Disconnect: confirm dialog (giữ nguyên logic)
   - Style: FB blue (#1877F2), icon Facebook
3. [x] channels/page.tsx — refactor:
   - Xoá toàn bộ form manual (pageId, pageAccessToken, pageName inputs)
   - Xoá states liên quan: pageId, pageAccessToken, pageName, showToken, isConnecting, connectError, connectSuccess, validateForm, handleConnect
   - Import + render FacebookChannelSection
   - Thêm xử lý `?facebook=connected/error` query params (giống Zalo toast)
   - Giữ Setup Guide card (chỉ update nội dung cho phù hợp — bỏ bước "lấy token thủ công")
4. [x] Cleanup BE (minor):
   - Xoá `ConnectFacebookDto` file
   - Xoá/comment `POST facebook/connect` endpoint trong controller
   - Xoá `connectFacebookPage()` method manual (hoặc giữ nội bộ dùng bởi callback)

## Files to Create/Modify
### FE
- `src/app/dashboard/channels/FacebookChannelSection.tsx` — NEW
- `src/app/dashboard/channels/page.tsx` — major refactor (xoá form)
- `src/lib/services/channel.service.ts` — update

### BE (cleanup)
- `src/modules/channel/channel.controller.ts` — xoá POST endpoint
- `src/modules/channel/dto/connect-facebook.dto.ts` — DELETE file
- `src/modules/channel/channel.service.ts` — cleanup method cũ

## Acceptance Criteria
- [x] Click "Kết nối Facebook" → redirect OAuth → callback → hiện trạng thái
- [x] Disconnect → confirm → ngắt kết nối
- [x] Form manual đã bị xoá hoàn toàn
- [x] OAuth callback toast hiển thị đúng (success/error)
- [x] Dark/light mode hoạt động
- [x] Responsive: mobile-friendly
- [x] Code cũ (DTO, manual connect endpoint) đã cleanup

## Test Criteria
- [x] TSC FE: 0 errors
- [x] TSC BE: 0 errors
- [x] ESLint FE: 0 errors

## Definition of Done
- [x] FE OAuth UI hoạt động end-to-end
- [x] Legacy code cleanup hoàn tất
- [x] TSC 0 errors (FE + BE)
- [x] plan.md Phase 02 → ✅ Done

---
Feature complete! 🎉
