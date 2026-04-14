# Phase 02: Database Schema & Auth
Status: ⬜ Pending | Dependencies: Phase 01

## Objective
Setup Prisma + Supabase PostgreSQL, tạo schema cho tất cả entities, enable pgvector, implement Supabase Auth (JWT verify + guards).

## Implementation Steps
1. [ ] Init Prisma: `npx prisma init` + configure DATABASE_URL
2. [ ] Enable pgvector extension trong migration:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. [ ] Tạo Prisma schema cho tất cả entities:
   - Seller, Tenant, Agent, ChannelConnection
   - KnowledgeDocument, KnowledgeChunk (vector column)
   - Conversation, Message
4. [ ] Run migration: `npx prisma migrate dev`
5. [ ] Install auth deps: `@supabase/supabase-js @nestjs/passport passport-jwt`
6. [ ] Implement Auth module:
   - Supabase JWT verification strategy
   - AuthGuard (protect routes)
   - `@CurrentUser()` decorator
7. [ ] Implement TenantGuard: verify seller owns the tenant being accessed

## Acceptance Criteria
- [ ] Database có tất cả tables đúng schema
- [ ] pgvector extension hoạt động
- [ ] Request không có JWT → 401
- [ ] Request truy cập tenant của seller khác → 403

## Definition of Done
- [ ] Prisma schema complete + migrated
- [ ] Auth module hoạt động (JWT verify)
- [ ] AuthGuard + TenantGuard hoạt động
- [ ] `@CurrentUser()` decorator trả đúng user info

---
Next: Phase 03 - Tenant & Agent CRUD
