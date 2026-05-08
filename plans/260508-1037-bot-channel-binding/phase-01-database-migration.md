# Phase 01: Database Migration & Seed

Status: ✅ Complete
Dependencies: Không

## Objective

Cập nhật Prisma schema, tạo migration, và seed dữ liệu cho hệ thống hiện tại để phù hợp kiến trúc mới (isDefault, agentId trên channel, bảng AgentKnowledge).

## Why This Phase Exists

Tất cả logic backend và frontend đều phụ thuộc vào schema mới. Phase này phải hoàn thành trước khi bắt đầu code bất kỳ feature nào.

## Scope

### In Scope
- Thêm `isDefault` vào model Agent
- Thêm `agentId` vào model ChannelConnection
- Tạo model `AgentKnowledge` (bảng trung gian N:M)
- Migration script cho data hiện tại
- Seed: gán `isDefault=true` cho bot đầu tiên của mỗi tenant

### Out of Scope
- Logic nghiệp vụ (API, UI)
- Thay đổi message routing

## Implementation Steps

1. [ ] **Cập nhật Prisma schema — Agent model**
   - Thêm `isDefault Boolean @default(false) @map("is_default")`
   - Thêm relation `channels ChannelConnection[]`
   - Thêm relation `knowledgeLinks AgentKnowledge[]`
   - File: `prisma/schema.prisma` (line 196-215)

2. [ ] **Cập nhật Prisma schema — ChannelConnection model**
   - Thêm `agentId String? @map("agent_id")`
   - Thêm relation `agent Agent? @relation(fields: [agentId], references: [id], onDelete: SetNull)`
   - File: `prisma/schema.prisma` (line 243-265)

3. [ ] **Tạo model AgentKnowledge (bảng trung gian)**
   ```prisma
   model AgentKnowledge {
     id            String   @id @default(uuid())
     agentId       String   @map("agent_id")
     knowledgeId   String   @map("knowledge_id")
     agent         Agent             @relation(fields: [agentId], references: [id], onDelete: Cascade)
     knowledge     KnowledgeDocument @relation(fields: [knowledgeId], references: [id], onDelete: Cascade)
     assignedAt    DateTime @default(now()) @map("assigned_at")

     @@unique([agentId, knowledgeId])
     @@index([agentId])
     @@index([knowledgeId])
     @@map("agent_knowledge")
   }
   ```
   - Thêm relation `agentLinks AgentKnowledge[]` vào KnowledgeDocument

4. [ ] **Chạy `npx prisma migrate dev`**
   - Migration name: `add_bot_channel_knowledge_binding`

5. [ ] **Tạo data migration script** cho dữ liệu hiện tại
   - File: `prisma/migrations/seed-bot-channel-binding.ts`
   - Logic:
     ```
     Với mỗi Tenant:
       1. Lấy agent đầu tiên (sort by createdAt ASC) → set isDefault = true
       2. Nếu tenant chưa có agent → tạo bot mặc định
       3. Lấy tất cả ChannelConnection của tenant → set agentId = defaultBot.id
       4. Lấy tất cả KnowledgeDocument của tenant → tạo AgentKnowledge cho defaultBot
     ```

6. [ ] **Chạy migration script** và verify bằng Prisma Studio

7. [ ] **Cập nhật tenant.service.ts — create()**
   - Thêm `isDefault: true` vào block `agents.create` (line 42)
   - Thêm `isActive: true` explicitly (Rule 12: bot mặc định mặc định active)
   - Verify: không đổi gì ở schema `isActive @default(true)` hiện tại (đã đúng)

8. [ ] **Verify schema** — chạy `npx prisma validate` và `npx prisma generate`

## Files to Create/Modify
- `prisma/schema.prisma` — Thêm fields + model mới
- `prisma/migrations/seed-bot-channel-binding.ts` — Data migration script
- `src/modules/tenant/tenant.service.ts` — Thêm `isDefault: true` khi tạo tenant

## Acceptance Criteria
- [ ] `npx prisma validate` pass
- [ ] Migration chạy thành công, không mất data
- [ ] Mỗi tenant có đúng 1 agent với `isDefault = true`
- [ ] Tất cả channels hiện tại có `agentId` trỏ tới bot mặc định
- [ ] Tất cả knowledge hiện tại có link N:M tới bot mặc định
- [ ] `tenant.create()` tạo bot mới với `isDefault: true`

## Test Criteria
- [ ] Kiểm tra Prisma Studio: bảng `agents` có cột `is_default`
- [ ] Kiểm tra Prisma Studio: bảng `channel_connections` có cột `agent_id`
- [ ] Kiểm tra Prisma Studio: bảng `agent_knowledge` có data
- [ ] Tạo tenant mới qua API → verify bot mặc định có `isDefault: true`

## Definition of Done
- [ ] Schema updated & migration applied
- [ ] Data migration verified (no data loss)
- [ ] Prisma Client regenerated
- [ ] Existing API endpoints still work (backward compatible)

---
Next Phase: [Phase 02 — Backend Agent CRUD](./phase-02-backend-agent-crud.md)
