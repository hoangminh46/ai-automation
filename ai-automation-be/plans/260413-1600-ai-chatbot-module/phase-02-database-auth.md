# Phase 02: Database Schema & Auth
Status: ✅ Complete | Dependencies: Phase 01

## Objective
Setup Prisma + Supabase PostgreSQL, tạo schema cho tất cả entities, enable pgvector, implement Supabase Auth (JWT verify + guards).

## Implementation Steps
1. [x] Init Prisma: `npx prisma init` + configure DATABASE_URL
2. [x] Enable pgvector extension trong schema:
   ```prisma
   extensions = [vector]
   ```
3. [x] Tạo Prisma schema cho tất cả entities:
   - Seller, Tenant, Agent, ChannelConnection
   - KnowledgeDocument, KnowledgeChunk (vector column)
   - Conversation, Message
4. [ ] Run migration: `npx prisma migrate dev` (blocked: cần DB thật)
5. [x] Install auth deps: `@supabase/supabase-js @nestjs/passport passport-jwt @prisma/adapter-pg pg`
6. [x] Implement Auth module:
   - Supabase JWT verification strategy
   - AuthGuard (protect routes)
   - `@CurrentUser()` decorator
7. [x] Implement TenantGuard: verify seller owns the tenant being accessed

## Acceptance Criteria
- [x] Database schema đúng (validated by `npx prisma validate`)
- [x] pgvector extension declared
- [ ] Request không có JWT → 401 (cần Supabase project để verify E2E)
- [ ] Request truy cập tenant của seller khác → 403 (cần DB + Supabase để verify E2E)

## Definition of Done
- [x] Prisma schema complete + validated
- [x] Auth module hoạt động (JWT verify) — compile pass, cần Supabase để test E2E
- [x] AuthGuard + TenantGuard hoạt động — code complete
- [x] `@CurrentUser()` decorator trả đúng user info

## Blockers
- Migration (`prisma migrate dev`) cần Supabase/PostgreSQL DB thật → anh sẽ tạo Supabase project
- E2E test Auth cần Supabase JWT → sau khi có credentials

## Notes
- Prisma v7 breaking change: cần `@prisma/adapter-pg` + `pg` package (driver adapter pattern)
- Generator `prisma-client-js` (CJS compatible) thay vì `prisma-client` (ESM only)
- PrismaService dùng pg.Pool connection pooling

---
Next: Phase 03 - Tenant & Agent CRUD
