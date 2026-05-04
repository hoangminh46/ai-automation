# Plan: Facebook OAuth Refactor — Manual → 1-Click Connect

## Mục tiêu
Chuyển flow kết nối Facebook từ **manual** (user tự copy Page ID + Token) sang **OAuth 1-click** (giống Zalo OA).

## Lý do
- UX hiện tại phức tạp: seller cần 5 bước kỹ thuật (tạo App, Graph Explorer, copy token...)
- Token ngắn hạn (2h) nếu user không biết tạo long-lived token
- Token lộ cho user → rủi ro bảo mật
- Không nhất quán: Zalo dùng OAuth, Facebook dùng manual

## Phạm vi thay đổi

### Backend (ai-automation-be)
- **channel.controller.ts**: Thêm `GET facebook/auth-url` (giống `zalo/auth-url`)
- **channel.service.ts**: 
  - Thêm `getFacebookAuthUrl(tenantId)` — tạo OAuth URL
  - Thêm `handleFacebookCallback(tenantId, code)` — exchange code → tokens → connect
  - Refactor `connectFacebookPage()` — nhận token từ OAuth thay vì từ user
  - Thêm auto-subscribe webhook via Graph API
- **facebook-callback.controller.ts**: NEW — public controller xử lý OAuth callback
- **configs.ts**: Thêm `APP_BASE_URL` đã có, đảm bảo `FB_APP_ID` + `FB_APP_SECRET` đủ
- **Xoá**: `ConnectFacebookDto` (không cần user gửi pageId/token nữa)

### Frontend (ai-automation-fe)
- **channel.service.ts**: Thêm `getFacebookAuthUrl()`, xoá `connectFacebook()`
- **channels/page.tsx**: Xoá form manual → thay bằng nút OAuth (giống ZaloChannelSection)
- **FacebookChannelSection.tsx**: NEW — tách component (giống ZaloChannelSection)

### Không thay đổi
- DB schema (dùng ChannelConnection hiện tại, không cần migration)
- Facebook webhook controller (GET verify + POST events — giữ nguyên)
- Channel routing logic (handleIncomingMessage — giữ nguyên)
- Zalo code (không đụng)

## Điều kiện tiên quyết
- `FB_APP_ID` và `FB_APP_SECRET` phải có trong `.env`
- `APP_BASE_URL` phải là HTTPS (ngrok cho dev)
- Facebook App phải bật **Facebook Login** product
- Callback URL phải được whitelist trong Facebook App → Settings → Valid OAuth Redirect URIs

## Phases

| Phase | Tên | Status | Progress | Dependencies |
|-------|------|--------|----------|--------------|
| 01 | BE: Facebook OAuth + Callback | ✅ Done | 100% | - |
| 02 | FE: OAuth UI + Cleanup | ✅ Done | 100% | 01 |

## Quick Commands
- Start phase: `/code phase-01`
