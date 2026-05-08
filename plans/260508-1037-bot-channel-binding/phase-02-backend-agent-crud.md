# Phase 02: Backend — Agent CRUD Updates

Status: ✅ Complete
Dependencies: Phase 01

## Objective

Cập nhật Agent CRUD để hỗ trợ `isDefault` (không xoá được), include channels + knowledge trong response, và protect bot mặc định.

## Why This Phase Exists

Agent service hiện tại là CRUD cơ bản chưa có logic isDefault, chưa include relations mới. Phase này là nền tảng cho tất cả phases sau.

## Scope

### In Scope
- Agent delete: block nếu isDefault
- Agent findAll/findOne: include channels[], knowledgeLinks[]
- Agent remove: unlink channels trước khi xoá

### Out of Scope
- Channel assign-bot API (Phase 03)
- Knowledge N:M API (Phase 04)
- channelIds trong create/update DTO (Phase 03)

## Implementation Steps

1. [ ] **Cập nhật AgentService.findAll()**
   - Include `channels` (select: id, channelType, externalName, isActive)
   - Include `knowledgeLinks` → `knowledge` (select: id, fileName, status)
   - Include `isDefault` trong select
   - File: `src/modules/agent/agent.service.ts`

2. [ ] **Cập nhật AgentService.findOne()**
   - Giống findAll, include channels + knowledgeLinks
   - File: `src/modules/agent/agent.service.ts`

3. [ ] **Cập nhật AgentService.remove() — isDefault guard**
   - Trước khi xoá: fetch agent, check `isDefault === true` → throw `ForbiddenException("Không thể xoá bot mặc định")`
   - File: `src/modules/agent/agent.service.ts`

4. [ ] **Cập nhật AgentService.remove() — unlink channels**
   - Trước khi delete agent: `updateMany({ where: { agentId: id }, data: { agentId: null } })` trên ChannelConnection
   - Đảm bảo xoá agent không cascade xoá channels
   - File: `src/modules/agent/agent.service.ts`

5. [ ] **Test API qua Swagger**
   - GET /agents → verify response có channels[], knowledgeLinks[], isDefault
   - DELETE /agents/:defaultBotId → verify 403
   - DELETE /agents/:normalBotId → verify channels unlink

6. [ ] **Verify QuotaService.checkBotLimit() đếm đúng (Rule 15)**
   - Bot mặc định phải tính vào quota (Free = 1 bot = chỉ bot mặc định)
   - Kiểm tra logic `checkBotLimit()` đếm tất cả agents (bao gồm isDefault)
   - Nếu logic hiện tại đã đếm tất cả → OK, chỉ verify
   - File: `src/modules/plan/quota.service.ts`

## Files to Create/Modify
- `src/modules/agent/agent.service.ts` — CRUD updates

## Acceptance Criteria
- [ ] `GET /agents` trả về channels[], knowledgeLinks[], isDefault
- [ ] `GET /agents/:id` trả về channels[], knowledgeLinks[], isDefault
- [ ] `DELETE /agents/:id` với isDefault=true → 403
- [ ] `DELETE /agents/:id` với bot thường → channels.agentId = null

## Definition of Done
- [ ] Code implemented
- [ ] Tested via Swagger
- [ ] Existing API responses backward compatible (thêm fields, không bỏ fields)

---
Next Phase: [Phase 03 — Backend Channel-Bot Binding](./phase-03-backend-channel-bot.md)
