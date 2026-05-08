# Phase 05: Backend — Message Routing & RAG Scoping

Status: ✅ Complete
Dependencies: Phase 03, Phase 04

## Objective

Cập nhật webhook handler để tin nhắn đến route đúng bot theo channel.agentId, và giới hạn RAG context chỉ query knowledge mà bot đã chọn.

## Why This Phase Exists

Đây là logic nghiệp vụ quan trọng nhất: tin nhắn → đúng bot → đúng knowledge. Sai routing = bot trả lời nhầm hoặc dùng nhầm data.

## Implementation Steps

1. [ ] **Cập nhật Webhook — Bot Selection**
   - Hiện tại: tìm agent đầu tiên active của tenant
   - Sau: tìm channel → lấy `channel.agentId` → dùng bot đó
   - Include agent khi query channel: `include: { agent: true }`
   - File: `src/modules/channel/facebook/facebook-webhook.service.ts`

2. [ ] **Cập nhật Webhook — Inactive/No-bot Handling**
   - `channel.agentId = null` → lưu conversation (status: OPEN), không gọi LLM
   - `agent.isActive = false` → lưu conversation (status: OPEN), không gọi LLM
   - Conversation vẫn hiện trong Chat cho nhân viên xử lý thủ công
   - File: `src/modules/channel/facebook/facebook-webhook.service.ts`

3. [ ] **Cập nhật Conversation creation**
   - Set `agentId = channel.agentId` (thay vì pick bot đầu tiên)
   - Nếu không có agent → vẫn tạo conversation nhưng status = OPEN
   - File: webhook handler (nơi tạo conversation)

4. [ ] **Cập nhật RAG Pipeline — Bot-scoped query**
   - Hiện tại: query tất cả chunks WHERE tenantId = ?
   - Sau: query chunks WHERE documentId IN (SELECT knowledgeId FROM agent_knowledge WHERE agentId = ?)
   - Nếu bot chưa gán knowledge → không có RAG context, chỉ dùng prompt
   - File: `src/knowledge/embedding/` hoặc `src/llm/`

5. [ ] **Handle edge case: Conversation.agentId onDelete**
   - Hiện tại: `onDelete: Cascade` → xoá bot xoá luôn conversations
   - Đề xuất: đổi thành `onDelete: SetNull` để giữ history
   - Nếu agentId = null trên conversation → hiện "Bot đã bị xoá" trên UI
   - File: `prisma/schema.prisma` (line 374)

## Files to Create/Modify
- `src/modules/channel/facebook/facebook-webhook.service.ts` — Bot selection + inactive handling
- `src/knowledge/embedding/` hoặc `src/llm/` — Bot-scoped RAG query
- `prisma/schema.prisma` — Conversation.agentId onDelete change (if confirmed)

## Acceptance Criteria
- [ ] Tin nhắn FB đến channel có bot active → đúng bot auto-reply
- [ ] Tin nhắn FB đến channel không có bot → conversation OPEN, không reply
- [ ] Tin nhắn FB đến channel có bot inactive → conversation OPEN, không reply
- [ ] Bot chỉ dùng knowledge đã chọn, không dùng knowledge khác
- [ ] Bot chưa gán knowledge → reply bằng prompt only (không RAG)

## Definition of Done
- [ ] Message routing tested end-to-end (gửi tin thật qua FB)
- [ ] RAG scoping verified (bot chỉ trả lời từ knowledge đã gán)
- [ ] No regression trên flow hiện tại

---
Next Phase: [Phase 06 — Frontend Agents UI](./phase-06-frontend-agents.md)
