# Zalo OA Channel — Feature Spec
Created: 2026-05-04

## 1. Executive Summary
Tích hợp kênh Zalo Official Account vào hệ thống AI Chatbot. Tận dụng ChannelAdapter pattern từ Facebook Channel (Phase 09). Seller kết nối Zalo OA qua OAuth → khách nhắn Zalo → AI trả lời tự động → nhân viên can thiệp qua CRM.

## 2. Goal and Non-Goals
**Goals:** End-to-end Zalo OA messaging, OAuth connect, auto token refresh, CRM reply.
**Non-Goals:** ZNS templates, Zalo Mini App, rich media, Zalo Pay, multi-OA per tenant.

## 3. Actors
- Seller (connect OA, configure)
- Customer (nhắn tin qua Zalo)
- CRM Staff (view/reply on dashboard)

## 4. User Stories
- Là Seller, tôi muốn kết nối Zalo OA để khách hàng nhắn tin được AI trả lời tự động
- Là Khách hàng, tôi muốn nhắn Zalo và nhận câu trả lời nhanh
- Là Nhân viên CRM, tôi muốn xem và reply tin nhắn Zalo trên dashboard

## 5. Domain Entities
- `ChannelConnection` (existing) + refreshTokenEnc, tokenExpiresAt
- `ZaloAdapter` implements ChannelAdapter
- `ZaloTokenService` (auto-refresh)
- `ZaloWebhookController`

## 6. Core Flows

### Connect Flow
```
Seller → Click "Kết nối Zalo OA" → Redirect Zalo OAuth
→ Authorize → Callback with code → Exchange tokens
→ Get OA info → Save ChannelConnection → Show success
```

### Incoming Message Flow
```
Customer nhắn Zalo → Zalo POST /webhook/zalo
→ Verify signature → Parse event (user_send_text)
→ Normalize → Dedup → Route (OA_ID → tenant → agent)
→ Check status (OPEN → skip bot) → Pipeline (history + RAG + LLM)
→ Send reply via Zalo API → Save message → Emit WS
```

### Token Refresh Flow
```
Every 10 min: check tokenExpiresAt < now + 10min
→ POST oauth.zaloapp.com/v4/oa/access_token (grant_type=refresh_token)
→ Update accessTokenEnc + refreshTokenEnc + tokenExpiresAt
→ If refresh fails (3-month expiry) → isActive=false + log warning
```

## 7. Edge Cases
- Token expired mid-reply → ensureValidZaloToken refreshes inline
- Refresh token expired (3 months) → mark inactive, notify seller
- Non-text message (sticker/image) → skip gracefully
- Duplicate webhook event → dedup via msg_id
- Zalo API timeout → retry with exponential backoff
- Network error during refresh → retry 3 times

## 8. API Contract

### BE Endpoints (new)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/tenants/:tenantId/channels/zalo/auth-url | JWT+TenantGuard | Get OAuth redirect URL |
| GET | /api/v1/tenants/:tenantId/channels/zalo/callback | None (OAuth) | OAuth callback |
| DELETE | /api/v1/tenants/:tenantId/channels/zalo/disconnect | JWT+TenantGuard | Disconnect |
| POST | /webhook/zalo | None (public) | Receive Zalo events |

### Zalo External APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| permission.zalo.me/v3/permission | GET | OAuth redirect |
| oauth.zaloapp.com/v4/oa/access_token | POST | Exchange/refresh tokens |
| openapi.zalo.me/v3.0/oa/message/cs | POST | Send customer service message |
| openapi.zalo.me/v2.0/oa/getoa | GET | Get OA info |

## 9. Data Design
```prisma
model ChannelConnection {
  // ... existing fields ...
  refreshTokenEnc  String?   @map("refresh_token_enc")   // NEW
  tokenExpiresAt   DateTime? @map("token_expires_at")     // NEW
}
```

## 10. Security
- Webhook signature: SHA256(appId + data + timestamp + OASecretKey) via timingSafeEqual
- Tokens stored same security level as FB tokens (plain text MVP, AES-256 future)
- OAuth state param = tenantId (anti-CSRF)

## 11. Env Config
```
ZALO_APP_ID=
ZALO_APP_SECRET=
ZALO_OA_SECRET_KEY=
```

## 12. Build Checklist
- [ ] Phase 01: DB migration + ZaloAdapter
- [ ] Phase 02: OAuth + Token Refresh
- [ ] Phase 03: Webhook + Message Routing
- [ ] Phase 04: Frontend UI
