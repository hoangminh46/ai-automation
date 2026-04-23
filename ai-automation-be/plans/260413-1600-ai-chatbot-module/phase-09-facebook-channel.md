# Phase 09: Facebook Messenger Channel
Status: ✅ Done | Dependencies: Phase 05, 06

## Objective
Implement Facebook Messenger channel: webhook, channel adapter pattern, page connection, message routing, reply. Sau phase này, khách nhắn tin trên FB → AI trả lời tự động.

## Implementation Steps
1. [x] Define `ChannelAdapter` interface (reusable cho Zalo/Widget sau):
   ```typescript
   interface ChannelAdapter {
     channelType: ChannelType;
     normalizeIncoming(rawEvent: any): IncomingMessage;
     sendReply(recipientId: string, message: string, accessToken: string): Promise<void>;
   }
   ```
2. [x] Implement `FacebookAdapter` — normalize FB event → IncomingMessage, send reply via Graph API
3. [x] Implement webhook verification: `GET /webhook/facebook`
   - Check `hub.verify_token` → respond `hub.challenge`
4. [x] Implement webhook handler: `POST /webhook/facebook`
   - Verify `X-Hub-Signature-256` (HMAC-SHA256 + timingSafeEqual)
   - Parse messaging events
   - Respond 200 immediately, process async
5. [x] Implement message routing:
   - Extract page_id → find ChannelConnection → get tenant + agent
   - Find or create Conversation by sender_id
   - Call pipeline → get response → send reply
6. [x] Implement page connection: `POST /tenants/:id/channels/facebook/connect`
   - Body: `{ pageId, pageAccessToken, pageName }`
   - MVP: lưu access_token plain (TODO: encrypt AES-256 Phase 10)
7. [x] Implement message deduplication:
   - Track processed message_ids (in-memory Map, TTL 5 min)
8. [x] Channel management:
   - `GET /tenants/:id/channels` — list connections
   - `DELETE /tenants/:id/channels/facebook/disconnect`
9. [x] Human reply → Facebook: nhân viên gửi tin nhắn qua CMS → gửi qua Messenger cho khách
10. [x] Handover to Bot: `PATCH .../handover-bot` — chuyển lại cho bot xử lý tự động

## Acceptance Criteria
- [x] FB webhook verification thành công
- [x] Khách nhắn tin trên Messenger → AI trả lời tự động (tested via ngrok)
- [x] AI trả lời dựa trên knowledge (Phase 08 done)
- [x] Invalid signature → 403
- [x] Duplicate message → xử lý 1 lần
- [x] Page connect/disconnect hoạt động
- [x] Nhân viên gửi tin nhắn → khách nhận trên Messenger
- [x] Nhân viên bàn giao cho Bot → bot tiếp tục tự trả lời

## Definition of Done
- [x] Channel adapter interface defined
- [x] Facebook adapter implemented
- [x] End-to-end: FB message → AI reply (tested via ngrok)
- [x] Security: signature verification (timingSafeEqual) + Bearer token auth
- [x] Deduplication hoạt động
- [x] Human agent reply → FB Messenger
- [x] Handover to Bot with SYSTEM audit message

## Security Fixes Applied
- `timingSafeEqual` for webhook HMAC signature verification (anti timing attack)
- `Authorization: Bearer` header instead of URL query param for FB Graph API
- `OnModuleDestroy` cleanup for dedup interval (anti memory leak)

## FE Changes (Sprint 6)
- `chat.service.ts`: handoverToBot API
- `conversation-store.ts`: handoverToBot Zustand action
- `CustomerPanel.tsx`: "Bàn giao cho Bot" button (blue, OPEN/SNOOZED)
- `page.tsx`: wired handler + state

## Notes
- Cần Facebook App trên developers.facebook.com
- Local dev dùng ngrok cho HTTPS webhook URL
- FB yêu cầu respond trong 5s → respond 200 trước, xử lý async
- **Real-time CRM:** Sau khi FB Channel hoạt động, FE cần cập nhật tin nhắn mới real-time (FE Phase 06E). Giải pháp MVP: FE polling. Nếu cần nâng cấp: BE thêm WebSocket Gateway hoặc SSE endpoint để push new messages/conversations xuống CRM dashboard.
- **Multi-instance:** In-memory Map dedup sẽ cần chuyển Redis SET khi scale nhiều instances.

---
Next: Phase 10 - Self-serve API & Polish
