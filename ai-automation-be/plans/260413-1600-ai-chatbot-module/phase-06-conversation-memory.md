# Phase 06: Conversation & Memory
Status: ✅ Done | Dependencies: Phase 05

## Objective
Implement Conversation module (chat session management), Message storage, quota tracking, và kết nối vào pipeline (History stage + Response stage).

## Implementation Steps
1. [x] Implement Conversation service:
   - `findOrCreate(tenantId, agentId, channelConversationId)` — tạo mới hoặc tìm conversation
   - `findByTenant(tenantId, pagination)` — list conversations
   - `findById(conversationId)` — chi tiết + messages
2. [x] Implement Message service:
   - `create(conversationId, role, content, metadata)` — lưu message
   - `findByConversation(conversationId, limit)` — load history (last N)
3. [x] Update Pipeline Stage ② `HistoryStage`:
   - Replace stub → load last 20 messages từ conversation
4. [x] Update Pipeline Stage ⑤ `ResponseStage`:
   - Replace stub → save customer message + AI response vào DB
   - Update conversation.last_message_at
5. [x] Implement Message quota tracking:
   - Check `tenant.message_used < tenant.message_quota` trước khi gọi LLM
   - Increment `message_used` sau mỗi response thành công
   - Reject với 429 + fallback message khi hết quota
6. [x] Read-only API cho seller:
   - `GET /tenants/:id/conversations` (paginated, sorted by last_message_at)
   - `GET /tenants/:id/conversations/:convId` (messages)
7. [x] **Human Reply endpoint** (added Sprint 5, 2026-04-21):
   - `POST /tenants/:id/conversations/:convId/human-reply` — staff direct message
   - Saves message with role HUMAN_AGENT, auto-transitions BOT_HANDLING/RESOLVED → OPEN
   - HumanReplyDto: `{ content: string }` (max 5000 chars)
   - `PATCH /tenants/:id/conversations/:convId/resolve` — mark as RESOLVED

## Acceptance Criteria
- [x] Chat qua test endpoint → AI nhớ ngữ cảnh (hỏi tiếp câu trước)
- [x] Messages được lưu vào DB (cả customer + assistant)
- [x] Hết quota → 429 + fallback, không gọi LLM
- [x] Seller xem được danh sách hội thoại + chi tiết
- [x] Staff gửi tin nhắn trực tiếp (human-reply, không qua LLM)

## Definition of Done
- [x] Conversation + Message CRUD hoạt động
- [x] Pipeline stages ②⑤ connected
- [x] Quota tracking hoạt động
- [x] Conversation API cho seller
- [x] Human reply + resolve endpoints

---
Next: Phase 07 - Knowledge Upload & Processing
