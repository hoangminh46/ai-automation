# Phase 01: BE — Facebook OAuth + Callback
Status: ✅ Complete
Dependencies: none

## Objective
Thêm Facebook OAuth flow vào backend: tạo auth URL, xử lý callback, exchange code → Page Access Token, auto-subscribe webhook.

## Why This Phase Exists
Hiện tại seller phải tự lấy Page ID + Page Access Token thủ công → chuyển sang OAuth để backend tự động hoàn tất.

## Scope
### In Scope
- `getFacebookAuthUrl(tenantId)` — tạo OAuth URL với đúng scopes
- `FacebookCallbackController` — public controller xử lý callback
- `handleFacebookCallback(tenantId, code)` — exchange code → tokens → connect Page
- Auto-subscribe webhook cho Page (`POST /{pageId}/subscribed_apps`)
- Exchange short-lived → long-lived User Token → Page Token (không hết hạn)
- Multi-page handling: nếu user quản lý nhiều Page → chọn Page đầu tiên (hoặc redirect FE kèm list)

### Out of Scope
- FE UI (Phase 02)
- Multi-page selection UI (future enhancement)
- Xoá code cũ (Phase 02 sẽ cleanup)

## Implementation Steps
1. [x] channel.controller.ts — thêm endpoint:
   - `GET facebook/auth-url` → trả `{ authUrl }` (giống `zalo/auth-url`)
2. [x] channel.service.ts — thêm methods:
   - `getFacebookAuthUrl(tenantId)` — build OAuth URL:
     - URL: `https://www.facebook.com/v21.0/dialog/oauth`
     - Params: `client_id`, `redirect_uri`, `scope`, `state=tenantId`, `response_type=code`
     - Scopes: `pages_show_list,pages_messaging,pages_manage_metadata`
     - Redirect URI: `{APP_BASE_URL}/api/v1/channels/facebook/callback`
   - `handleFacebookCallback(tenantId, code)` — full flow:
     - Step 1: Exchange `code` → short-lived User Access Token
       - `GET https://graph.facebook.com/v21.0/oauth/access_token?client_id=&client_secret=&redirect_uri=&code=`
     - Step 2: Exchange short-lived → long-lived User Token (60 ngày)
       - `GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=&client_secret=&fb_exchange_token={short_token}`
     - Step 3: Get Pages list
       - `GET https://graph.facebook.com/v21.0/me/accounts?access_token={long_lived_user_token}`
       - Trả về danh sách Pages + Page Access Token cho mỗi page
     - Step 4: Chọn Page (lấy page đầu tiên nếu chỉ có 1)
     - Step 5: Subscribe webhook cho Page
       - `POST https://graph.facebook.com/v21.0/{pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token={page_token}`
     - Step 6: Upsert ChannelConnection (giống pattern Zalo)
       - `channelType: 'FACEBOOK'`
       - `externalId: pageId`
       - `externalName: pageName`
       - `accessTokenEnc: pageAccessToken` (long-lived, không hết hạn)
       - `tokenExpiresAt: null` (Page Token từ long-lived User Token = không hết hạn)
3. [x] facebook-callback.controller.ts — NEW public controller:
   - Route: `channels/facebook/callback` (nằm trong /api/v1 prefix)
   - `GET callback?code=xxx&state=tenantId`
   - Xử lý giống `zalo-callback.controller.ts`:
     - Thiếu code/state → redirect FE `?facebook=error`
     - Success → redirect FE `?facebook=connected&page_name=xxx`
     - Error → redirect FE `?facebook=error&reason=xxx`
4. [x] channel.module.ts — register FacebookCallbackController
5. [x] configs.ts — đảm bảo `FB_APP_ID` mapped (đã có `appId` field)
6. [x] .env.example — update document env vars cần thiết

## Files to Create/Modify
- `src/modules/channel/channel.controller.ts` — thêm `GET facebook/auth-url`
- `src/modules/channel/channel.service.ts` — thêm 2 methods
- `src/modules/channel/webhook/facebook-callback.controller.ts` — NEW
- `src/modules/channel/channel.module.ts` — register controller
- `.env.example` — update

## Acceptance Criteria
- [x] `GET /tenants/:id/channels/facebook/auth-url` trả đúng OAuth URL
- [x] Callback exchange code → Page Token thành công
- [x] Page Token là long-lived (không hết hạn)
- [x] Webhook auto-subscribed cho Page
- [x] ChannelConnection được tạo/update đúng
- [x] Conflict check: Page đã kết nối bởi tenant khác → lỗi
- [x] Error handling: thiếu code, invalid code, no pages → redirect FE với reason

## Test Criteria
- [x] TSC: 0 errors
- [x] ESLint: 0 errors

## Definition of Done
- [x] OAuth flow hoạt động end-to-end (manual test qua browser)
- [x] TSC 0 errors
- [x] plan.md Phase 01 → ✅ Done
