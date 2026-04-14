# Phase 11: Testing & Hardening
Status: ⬜ Pending | Dependencies: Phase 01-10

## Objective
Integration tests cho critical flows, security hardening (prompt injection, sanitization), performance indexes, production Docker, deployment docs.

## Implementation Steps
1. [ ] Write integration test: Onboarding flow
   - Register → tenant created → agent created → verify DB
2. [ ] Write integration test: Chat pipeline
   - Upload knowledge → send message → AI response matches knowledge
3. [ ] Write integration test: FB webhook
   - Mock webhook event → verify routing → verify reply
4. [ ] Implement prompt injection guard:
   - Detect: "ignore previous", "system prompt", "forget instructions"
   - Block + log attempt + return generic response
5. [ ] Add input sanitization pipe:
   - Strip HTML tags, limit message length (2000 chars)
6. [ ] Add database indexes:
   ```sql
   CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks 
     USING ivfflat (embedding vector_cosine_ops);
   CREATE INDEX idx_conversations_tenant ON conversations(tenant_id, last_message_at DESC);
   CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
   ```
7. [ ] Production readiness:
   - Environment validation on startup (fail fast)
   - Graceful shutdown
   - Production Dockerfile (multi-stage build)
   - Deployment README (Supabase setup, FB App setup, env reference)

## Acceptance Criteria
- [ ] Integration tests pass
- [ ] Prompt injection bị chặn
- [ ] Missing env var → server fail fast với error rõ ràng
- [ ] Docker image build thành công
- [ ] Deployment guide đủ cho developer mới setup

## Definition of Done
- [ ] Tests green
- [ ] Security measures active
- [ ] Indexes applied
- [ ] Docker production ready
- [ ] Documentation complete

---
🎉 MODULE COMPLETE — Ready for production beta!

Next Steps:
- Build frontend dashboard (ai-automation-fe)
- Add Zalo OA channel
- Add Website Widget channel
- Add Handoff AI → Nhân viên
- Integrate payment
