# Phase 09: Facebook Messenger Channel
Status: ⬜ Pending | Dependencies: Phase 05, 06

## Objective
Implement Facebook Messenger channel: webhook, channel adapter pattern, page connection, message routing, reply. Sau phase này, khách nhắn tin trên FB → AI trả lời tự động.

## Implementation Steps
1. [ ] Define `ChannelAdapter` interface (reusable cho Zalo/Widget sau):
   ```typescript
   interface ChannelAdapter {
     channelType: ChannelType;
     normalizeIncoming(rawEvent: any): IncomingMessage;
     sendReply(recipientId: string, message: string, accessToken: string): Promise<void>;
   }
   ```
2. [ ] Implement `FacebookAdapter` — normalize FB event → IncomingMessage, send reply via Graph API
3. [ ] Implement webhook verification: `GET /webhook/facebook`
   - Check `hub.verify_token` → respond `hub.challenge`
4. [ ] Implement webhook handler: `POST /webhook/facebook`
   - Verify `X-Hub-Signature-256` (HMAC-SHA256)
   - Parse messaging events
   - Respond 200 immediately, process async
5. [ ] Implement message routing:
   - Extract page_id → find ChannelConnection → get tenant + agent
   - Find or create Conversation by sender_id
   - Call pipeline → get response → send reply
6. [ ] Implement page connection: `POST /tenants/:id/channels/facebook/connect`
   - Body: `{ pageId, pageAccessToken, pageName }`
   - Encrypt access_token (AES-256) before saving
7. [ ] Implement message deduplication:
   - Track processed message_ids (in-memory Set, TTL 5 min)
8. [ ] Channel management:
   - `GET /tenants/:id/channels` — list connections
   - `DELETE /tenants/:id/channels/facebook/disconnect`

## Acceptance Criteria
- [ ] FB webhook verification thành công
- [ ] Khách nhắn tin trên Messenger → AI trả lời tự động
- [ ] AI trả lời dựa trên knowledge (nếu Phase 08 done)
- [ ] Invalid signature → 403
- [ ] Duplicate message → xử lý 1 lần
- [ ] Page connect/disconnect hoạt động

## Definition of Done
- [ ] Channel adapter interface defined
- [ ] Facebook adapter implemented
- [ ] End-to-end: FB message → AI reply
- [ ] Security: signature verification + token encryption
- [ ] Deduplication hoạt động

## Notes
- Cần Facebook App trên developers.facebook.com
- Local dev dùng ngrok cho HTTPS webhook URL
- FB yêu cầu respond trong 5s → respond 200 trước, xử lý async
- **Real-time CRM:** Sau khi FB Channel hoạt động, FE cần cập nhật tin nhắn mới real-time (FE Phase 06E). Giải pháp MVP: FE polling. Nếu cần nâng cấp: BE thêm WebSocket Gateway hoặc SSE endpoint để push new messages/conversations xuống CRM dashboard.

---
Next: Phase 10 - Self-serve API & Polish
