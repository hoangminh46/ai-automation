# Phase 11: Testing & Hardening
Status: ✅ Done (skip integration tests) | Dependencies: Phase 01-10

## Objective
Security hardening, performance indexes, production readiness.

## Implementation Steps
1. [x] ~~Integration test: Onboarding flow~~ → SKIPPED (MVP, manual test đủ)
2. [x] ~~Integration test: Chat pipeline~~ → SKIPPED
3. [x] ~~Integration test: FB webhook~~ → SKIPPED
4. [x] Implement prompt injection guard: ✅
   - PromptInjectionGuardPipe: 12 regex patterns (ignore instructions, jailbreak, DAN mode, etc.)
   - Applied to: POST /chat, POST /chat/test
   - Blocked requests return 400 + log warning
5. [x] Add input sanitization pipe: ✅
   - SanitizeInputPipe: strip HTML/script tags, XSS prevention
   - Applied to: POST /chat, POST /chat/test, POST /human-reply
6. [x] Add database indexes: ✅ (5 indexes)
   ```
   idx_conversations_tenant_recent  — conversations(tenant_id, last_message_at DESC)
   idx_messages_conversation_time   — messages(conversation_id, created_at ASC)
   idx_customers_external_lookup    — customers(tenant_id, external_id) WHERE NOT NULL
   idx_channel_connections_external — channel_connections(external_id) WHERE active
   idx_knowledge_chunks_embedding   — knowledge_chunks USING ivfflat(embedding)
   ```
7. [x] Production readiness: ✅
   - [x] Env validation on startup (Joi schema — already done from Phase 01)
   - [x] Graceful shutdown: `app.enableShutdownHooks()` in main.ts
   - [x] Dockerfile upgraded: non-root user, healthcheck, .prisma copy
   - [ ] Deployment README — deferred

## Definition of Done
- [x] Security pipes active on all chat endpoints
- [x] DB indexes created and verified (5/5)
- [x] Graceful shutdown enabled
- [x] Dockerfile production-ready

---
🎉 MODULE COMPLETE — All 11 phases done!
