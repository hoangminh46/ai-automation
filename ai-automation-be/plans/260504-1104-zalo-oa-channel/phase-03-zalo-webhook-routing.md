# Phase 03: Zalo Webhook + Message Routing
Status: ✅ Complete
Dependencies: Phase 01, Phase 02

## Objective
Nhận tin nhắn từ Zalo qua webhook, verify signature, route qua AI pipeline, gửi reply lại cho khách.

## Why This Phase Exists
Core flow: khách nhắn Zalo → AI trả lời. Cũng mở rộng sendHumanReplyToChannel cho ZALO.

## Scope
### In Scope
- ZaloWebhookController (POST /webhook/zalo)
- Signature verification (X-ZEvent-Signature = sha256(appId + data + timestamp + OASecretKey))
- Message routing: OA_ID → tenant → agent → pipeline → reply
- Extend sendHumanReplyToChannel cho ZALO
- Token check trước khi sendReply

### Out of Scope
- FE UI (Phase 04)
- Rich media messages

## Implementation Steps
1. [x] ZaloWebhookController (`src/modules/channel/webhook/zalo-webhook.controller.ts`)
   - POST /webhook/zalo: verify signature → respond 200 → process async
   - verifySignature: sha256(appId + data + timestamp + OASecretKey) vs X-ZEvent-Signature
2. [x] processZaloWebhookEvent trong ChannelService
   - Check event_name === 'user_send_text', skip others
   - normalizeIncoming → dedup → handleIncomingZaloMessage
3. [x] handleIncomingZaloMessage
   - Lookup ChannelConnection (channelType=ZALO, externalId=OA_ID)
   - Token check: refresh nếu gần hết hạn
   - resolveCustomer (externalId = Zalo user_id, name = "Zalo User XXXX")
   - resolveConversation (channelType=ZALO)
   - OPEN status → lưu tin không gọi bot
   - runPipeline → sendReply → save message → emit WS events
4. [x] Extend sendHumanReplyToChannel cho channelType=ZALO
5. [x] ensureValidZaloToken helper: check expiry → refresh if needed
6. [x] Register ZaloWebhookController trong ChannelModule
7. [x] main.ts: exclude webhook/zalo from /api/v1 prefix

## Files to Create/Modify
- `src/modules/channel/webhook/zalo-webhook.controller.ts` — NEW
- `src/modules/channel/channel.service.ts` — extend
- `src/modules/channel/channel.module.ts` — register controller
- `src/main.ts` — exclude webhook/zalo

## Acceptance Criteria
- [x] POST /webhook/zalo → AI reply gửi về Zalo (tested via ngrok)
- [x] Invalid signature → 403
- [x] Duplicate msg_id → skip
- [x] Conversation OPEN → lưu tin không gọi bot
- [x] Nhân viên reply từ CMS → khách nhận trên Zalo
- [x] Token auto-refresh trước khi gửi
- [x] WS events emit đúng

## Definition of Done
- [x] End-to-end: Zalo message → AI reply
- [x] Human reply → Zalo
- [x] Webhook signature verification
- [x] TSC 0 errors

---
Next Phase: Phase 04 - Frontend Channel UI Extension
