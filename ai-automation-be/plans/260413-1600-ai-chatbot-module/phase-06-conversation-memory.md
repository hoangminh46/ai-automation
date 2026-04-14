# Phase 06: Conversation & Memory
Status: ⬜ Pending | Dependencies: Phase 05

## Objective
Implement Conversation module (chat session management), Message storage, quota tracking, và kết nối vào pipeline (History stage + Response stage).

## Implementation Steps
1. [ ] Implement Conversation service:
   - `findOrCreate(tenantId, agentId, channelConversationId)` — tạo mới hoặc tìm conversation
   - `findByTenant(tenantId, pagination)` — list conversations
   - `findById(conversationId)` — chi tiết + messages
2. [ ] Implement Message service:
   - `create(conversationId, role, content, metadata)` — lưu message
   - `findByConversation(conversationId, limit)` — load history (last N)
3. [ ] Update Pipeline Stage ② `HistoryStage`:
   - Replace stub → load last 10 messages từ conversation
4. [ ] Update Pipeline Stage ⑤ `ResponseStage`:
   - Replace stub → save customer message + AI response vào DB
   - Update conversation.last_message_at
5. [ ] Implement Message quota tracking:
   - Check `tenant.message_used < tenant.message_quota` trước khi gọi LLM
   - Increment `message_used` sau mỗi response thành công
   - Reject với 429 + fallback message khi hết quota
6. [ ] Read-only API cho seller:
   - `GET /tenants/:id/conversations` (paginated, sorted by last_message_at)
   - `GET /tenants/:id/conversations/:convId` (messages)

## Acceptance Criteria
- [ ] Chat qua test endpoint → AI nhớ ngữ cảnh (hỏi tiếp câu trước)
- [ ] Messages được lưu vào DB (cả customer + assistant)
- [ ] Hết quota → 429 + fallback, không gọi LLM
- [ ] Seller xem được danh sách hội thoại + chi tiết

## Definition of Done
- [ ] Conversation + Message CRUD hoạt động
- [ ] Pipeline stages ②⑤ connected
- [ ] Quota tracking hoạt động
- [ ] Conversation API cho seller

---
Next: Phase 07 - Knowledge Upload & Processing
