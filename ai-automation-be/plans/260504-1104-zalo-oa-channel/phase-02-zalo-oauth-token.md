# Phase 02: Zalo OAuth + Token Refresh
Status: ✅ Complete
Dependencies: Phase 01

## Objective
Implement Zalo OAuth2 flow cho seller kết nối Zalo OA, và auto-refresh token service để access_token luôn valid.

## Why This Phase Exists
Zalo OA access_token chỉ sống 1 giờ (khác FB page token sống rất lâu). Cần:
1. OAuth flow để seller authorize OA → lấy access_token + refresh_token
2. Auto-refresh service để token không bao giờ hết hạn trong giờ hoạt động
Nếu không có phase này, seller phải re-authorize mỗi giờ — UX rất tệ.

## Scope
### In Scope
- OAuth authorization URL generation
- OAuth callback endpoint (exchange code → tokens)
- Connect Zalo OA endpoint (store tokens)
- Disconnect Zalo OA endpoint
- Token refresh service (auto-refresh trước khi hết hạn)
- Error handling khi refresh_token hết hạn (3 tháng)

### Out of Scope
- Webhook receive (Phase 03)
- FE UI (Phase 04)

## Requirements
### Functional
- [ ] `GET /api/v1/tenants/:tenantId/channels/zalo/auth-url` — trả về Zalo OAuth URL để FE redirect
- [ ] `GET /api/v1/tenants/:tenantId/channels/zalo/callback` — OAuth callback, exchange code → tokens
- [ ] `DELETE /api/v1/tenants/:tenantId/channels/zalo/disconnect` — ngắt kết nối Zalo OA
- [ ] `ZaloTokenService` auto-refresh access_token trước khi hết hạn
- [ ] Khi refresh_token hết hạn → ghi log + đánh dấu connection inactive

### Non-Functional
- [ ] Token refresh interval: mỗi 50 phút (buffer 10 phút trước khi hết hạn 1h)
- [ ] Refresh token securely stored (cùng cấp với accessTokenEnc hiện tại)
- [ ] Graceful: nếu refresh fail do network → retry 3 lần trước khi đánh dấu inactive

## Implementation Steps
1. [x] **OAuth URL Generation** (`ChannelService` hoặc `ZaloAuthService`)
   ```typescript
   // GET /tenants/:tenantId/channels/zalo/auth-url
   getZaloAuthUrl(tenantId: string): string {
     const params = new URLSearchParams({
       app_id: this.configService.get('zalo.appId'),
       redirect_uri: `${BASE_URL}/api/v1/tenants/${tenantId}/channels/zalo/callback`,
       state: tenantId, // Anti-CSRF
     });
     return `https://permission.zalo.me/v3/permission?${params}`;
   }
   ```

2. [x] **OAuth Callback** — exchange authorization code → tokens
   ```typescript
   // GET /tenants/:tenantId/channels/zalo/callback?code=xxx
   async handleZaloCallback(tenantId: string, code: string) {
     // POST https://oauth.zaloapp.com/v4/oa/access_token
     const tokenResponse = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         secret_key: this.configService.get('zalo.appSecret'),
       },
       body: new URLSearchParams({
         app_id: this.configService.get('zalo.appId'),
         code,
         grant_type: 'authorization_code',
       }),
     });
     // Response: { access_token, refresh_token, expires_in }
     // Lưu vào ChannelConnection
   }
   ```

3. [x] **Store Tokens** — lưu vào ChannelConnection
   - `accessTokenEnc` = access_token
   - `refreshTokenEnc` = refresh_token
   - `tokenExpiresAt` = now + expires_in seconds
   - `externalId` = OA ID (từ Zalo response hoặc gọi GET OA info)
   - `externalName` = OA name
   - `channelType` = 'ZALO'

4. [x] **Get OA Info** — sau khi có access_token, gọi API lấy thông tin OA
   ```typescript
   // GET https://openapi.zalo.me/v2.0/oa/getoa
   // Header: access_token: <token>
   // Response: { data: { oa_id, name, avatar, ... } }
   ```

5. [x] **Disconnect Zalo OA**
   - Set `isActive = false` (giống FB disconnect)
   - Không revoke token (Zalo không có revoke API rõ ràng)

6. [x] **ZaloTokenService** (`src/modules/channel/services/zalo-token.service.ts`)
   ```typescript
   @Injectable()
   export class ZaloTokenService implements OnModuleInit, OnModuleDestroy {
     private refreshInterval: ReturnType<typeof setInterval>;
     
     onModuleInit() {
       // Chạy refresh check mỗi 10 phút
       this.refreshInterval = setInterval(() => this.refreshExpiredTokens(), 10 * 60 * 1000);
     }
     
     async refreshExpiredTokens() {
       // Tìm tất cả Zalo connections có tokenExpiresAt < now + 10 phút
       // Gọi refresh API cho từng connection
       // Update accessTokenEnc + tokenExpiresAt
       // Nếu refresh fail (refresh_token hết hạn) → isActive = false, log warning
     }
   }
   ```

7. [x] **Refresh Token API call**
   ```typescript
   // POST https://oauth.zaloapp.com/v4/oa/access_token
   // Headers: secret_key: APP_SECRET
   // Body: app_id, grant_type=refresh_token, refresh_token=xxx
   // Response: { access_token, refresh_token (new!), expires_in }
   ```
   **Quan trọng**: Zalo trả về refresh_token MỚI mỗi lần refresh → phải update cả 2

8. [x] **Register trong ChannelModule**
   - Thêm ZaloTokenService vào providers
   - Export nếu cần

## Files to Create/Modify
- `src/modules/channel/services/zalo-token.service.ts` — NEW
- `src/modules/channel/channel.service.ts` — thêm connectZaloOA, disconnectZaloOA, getZaloAuthUrl, handleZaloCallback
- `src/modules/channel/channel.controller.ts` — thêm endpoints
- `src/modules/channel/channel.module.ts` — register ZaloTokenService
- `src/modules/channel/dto/connect-zalo.dto.ts` — NEW (nếu cần)

## Acceptance Criteria
- [ ] Gọi GET /auth-url → trả về URL redirect Zalo hợp lệ
- [ ] Sau khi user authorize trên Zalo → callback nhận code → exchange thành công → tokens lưu DB
- [ ] ChannelConnection record tạo đúng (channelType=ZALO, externalId=OA_ID, tokens saved)
- [ ] Sau 50 phút → ZaloTokenService auto refresh access_token
- [ ] Refresh token mới được lưu lại (thay thế cũ)
- [ ] Disconnect → isActive = false
- [ ] Khi refresh_token hết hạn → connection đánh dấu inactive + log warning

## Test Criteria
- [ ] Manual: Truy cập auth URL → redirect Zalo → authorize → callback → tokens saved
- [ ] Manual: Chờ hoặc mock token expiry → verify auto-refresh
- [ ] TSC 0 errors
- [ ] Prisma Studio: verify ChannelConnection record

## Definition of Done
- [ ] OAuth flow hoạt động end-to-end
- [ ] Token refresh service running
- [ ] Error cases handled (invalid code, expired refresh_token)
- [ ] plan.md Phase 02 → ✅ Done

## Assumptions / Notes
- OAuth callback URL phải HTTPS (dùng ngrok khi dev local)
- Zalo OAuth redirect_uri phải được đăng ký trong Zalo Developers portal
- `state` param dùng tenantId để biết callback thuộc tenant nào
- Nếu seller re-authorize → update tokens (upsert, giống FB reconnect)
- Zalo trả refresh_token mới mỗi lần refresh → PHẢI update cả refreshTokenEnc

---
Next Phase: Phase 03 - Zalo Webhook + Message Routing
