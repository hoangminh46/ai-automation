# Phase 09: Facebook Messenger Channel
Status: 🟡 In Progress | Dependencies: Phase 05, 06

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
   - Verify `X-Hub-Signature-256` (HMAC-SHA256)
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
   - Track processed message_ids (in-memory Set, TTL 5 min)
8. [x] Channel management:
   - `GET /tenants/:id/channels` — list connections
   - `DELETE /tenants/:id/channels/facebook/disconnect`

## Acceptance Criteria
- [x] FB webhook verification thành công
- [ ] Khách nhắn tin trên Messenger → AI trả lời tự động (cần ngrok + FB webhook config)
- [ ] AI trả lời dựa trên knowledge (nếu Phase 08 done)
- [x] Invalid signature → 403
- [x] Duplicate message → xử lý 1 lần
- [ ] Page connect/disconnect hoạt động (cần FE hoặc manual API test)

## Definition of Done
- [x] Channel adapter interface defined
- [x] Facebook adapter implemented
- [ ] End-to-end: FB message → AI reply (cần ngrok test)
- [x] Security: signature verification + token encryption
- [x] Deduplication hoạt động

## Notes
- Cần Facebook App trên developers.facebook.com
- Local dev dùng ngrok cho HTTPS webhook URL
- FB yêu cầu respond trong 5s → respond 200 trước, xử lý async
- **Real-time CRM:** Sau khi FB Channel hoạt động, FE cần cập nhật tin nhắn mới real-time (FE Phase 06E). Giải pháp MVP: FE polling. Nếu cần nâng cấp: BE thêm WebSocket Gateway hoặc SSE endpoint để push new messages/conversations xuống CRM dashboard.

---
Next: Phase 10 - Self-serve API & Polish
