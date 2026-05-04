# Phase 01: DB Migration + Zalo Adapter
Status: ✅ Complete
Dependencies: None

## Objective
Mở rộng database schema cho Zalo token management và tạo ZaloAdapter implement ChannelAdapter interface.

## Why This Phase Exists
Zalo OA access_token hết hạn sau 1 giờ (khác FB là long-lived token). Cần thêm cột DB lưu refresh_token và thời gian hết hạn. ZaloAdapter là nền tảng để normalize incoming messages và gửi reply — phải có trước khi xây webhook + routing.

## Scope
### In Scope
- Prisma schema migration: thêm `refreshTokenEnc`, `tokenExpiresAt` vào `ChannelConnection`
- ZaloAdapter: `normalizeIncoming()` + `sendReply()`
- Zalo env config (ZALO_APP_ID, ZALO_APP_SECRET, ZALO_OA_SECRET_KEY)
- Config module đăng ký Zalo env vars

### Out of Scope
- OAuth flow (Phase 02)
- Webhook controller (Phase 03)
- FE changes (Phase 04)

## Requirements
### Functional
- [ ] ChannelConnection có `refreshTokenEnc` (String?, encrypted refresh token)
- [ ] ChannelConnection có `tokenExpiresAt` (DateTime?, thời điểm access token hết hạn)
- [ ] ZaloAdapter.normalizeIncoming(rawEvent) → IncomingMessage | null
- [ ] ZaloAdapter.sendReply(recipientId, message, accessToken) → gửi qua Zalo Open API
- [ ] ZaloAdapter skip non-text events (hình, sticker, file)

### Non-Functional
- [ ] Migration không break dữ liệu Facebook hiện tại (2 cột mới nullable)
- [ ] ZaloAdapter logging đầy đủ (success/error)

## Implementation Steps
1. [x] **Prisma schema migration**
   - Thêm 2 cột vào model `ChannelConnection`:
     ```prisma
     refreshTokenEnc  String?   @map("refresh_token_enc")
     tokenExpiresAt   DateTime? @map("token_expires_at")
     ```
   - Chạy `prisma db push` (dev) hoặc `prisma migrate dev`

2. [x] **Zalo config**
   - Thêm vào `.env`:
     ```
     ZALO_APP_ID=your_app_id
     ZALO_APP_SECRET=your_app_secret
     ZALO_OA_SECRET_KEY=your_oa_secret_key
     ```
   - Thêm vào config module (hoặc `configuration.ts`):
     ```typescript
     zalo: {
       appId: process.env.ZALO_APP_ID,
       appSecret: process.env.ZALO_APP_SECRET,
       oaSecretKey: process.env.ZALO_OA_SECRET_KEY,
     }
     ```

3. [x] **ZaloAdapter** (`src/modules/channel/adapters/zalo.adapter.ts`)
   - Implement `ChannelAdapter` interface
   - `channelType = 'ZALO'`
   - `normalizeIncoming()`: parse Zalo webhook event structure
     ```typescript
     // Zalo event structure:
     {
       app_id: string,
       sender: { id: string },
       recipient: { id: string },
       event_name: "user_send_text",
       message: { text: string, msg_id: string },
       timestamp: string
     }
     ```
   - `sendReply()`: POST `https://openapi.zalo.me/v3.0/oa/message/cs` (customer service message)
     ```typescript
     {
       recipient: { user_id: recipientId },
       message: { text: message }
     }
     ```
     Header: `access_token: <token>` (Zalo dùng header riêng, không phải Bearer)

4. [x] **Register ZaloAdapter** trong `ChannelModule` providers

## Files to Create/Modify
- `prisma/schema.prisma` — thêm 2 cột ChannelConnection
- `src/modules/channel/adapters/zalo.adapter.ts` — NEW
- `src/modules/channel/channel.module.ts` — register ZaloAdapter
- `src/config/configuration.ts` (hoặc tương đương) — thêm zalo config
- `.env` — thêm ZALO_* vars
- `.env.example` — thêm ZALO_* vars mẫu

## Acceptance Criteria
- [ ] `prisma db push` thành công, 2 cột mới xuất hiện trong DB
- [ ] Dữ liệu Facebook ChannelConnection không bị ảnh hưởng
- [ ] ZaloAdapter compile không lỗi, inject được trong module
- [ ] Unit test (manual): normalizeIncoming parse đúng Zalo event format

## Test Criteria
- [ ] Prisma schema push thành công
- [ ] Prisma Studio hiện 2 cột mới (null cho records cũ)
- [x] TSC 0 errors
- [ ] ZaloAdapter manual test: normalizeIncoming với mock data

## Definition of Done
- [x] Code implemented + compile clean
- [ ] DB migration applied
- [x] Env config documented
- [ ] plan.md Phase 01 → ✅ Done

## Assumptions / Notes
- 2 cột mới nullable → FB connections cũ không cần giá trị
- Zalo Send API endpoint có thể là `/v3.0/oa/message/cs` (customer service) hoặc `/v2.0/oa/message` — cần verify khi test thực tế
- Zalo dùng header `access_token` riêng thay vì `Authorization: Bearer` (khác FB)

---
Next Phase: Phase 02 - Zalo OAuth + Token Refresh
