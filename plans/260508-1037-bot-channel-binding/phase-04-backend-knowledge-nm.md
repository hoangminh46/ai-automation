# Phase 04: Backend — Knowledge N:M API

Status: ✅ Complete
Dependencies: Phase 02

## Objective

Tạo API gán/bỏ gán knowledge cho bot (many-to-many qua bảng AgentKnowledge), và cập nhật Knowledge response để include agents đang dùng.

## Why This Phase Exists

Knowledge giờ thuộc tenant nhưng bot chọn knowledge nào để dùng. Phase này tạo API để frontend (Phase 06, 08) có data hiện checkbox knowledge và badge bot.

## Implementation Steps

1. [ ] **Tạo AssignKnowledgeDto**
   - `knowledgeIds: string[]` (IsArray, each IsUUID)
   - File: `src/modules/agent/dto/assign-knowledge.dto.ts`

2. [ ] **Tạo AgentKnowledgeService**
   - `syncKnowledge(tenantId, agentId, knowledgeIds[])`:
     - Validate tất cả knowledge thuộc cùng tenantId
     - Delete tất cả AgentKnowledge cũ của agentId
     - Insert mới cho knowledgeIds
   - `getAgentKnowledge(agentId)`: lấy list knowledge đang gán
   - File: `src/modules/agent/agent-knowledge.service.ts`

3. [ ] **Tạo API endpoints**
   - `PUT /tenants/:tenantId/agents/:agentId/knowledge` — Body: AssignKnowledgeDto
   - `GET /tenants/:tenantId/agents/:agentId/knowledge`
   - File: `src/modules/agent/agent.controller.ts`

4. [ ] **Cập nhật Knowledge response — include agents**
   - `GET /tenants/:tenantId/knowledge` → mỗi document kèm `agents: [{id, name}]`
   - Query: include `agentLinks` → `agent` (select: id, name)
   - File: `src/modules/knowledge/knowledge.service.ts`

## Files to Create/Modify
- `src/modules/agent/dto/assign-knowledge.dto.ts` — **Mới**
- `src/modules/agent/agent-knowledge.service.ts` — **Mới**
- `src/modules/agent/agent.controller.ts` — 2 endpoints mới
- `src/modules/agent/agent.module.ts` — Register AgentKnowledgeService
- `src/modules/knowledge/knowledge.service.ts` — Include agents

## Acceptance Criteria
- [ ] `PUT /agents/:id/knowledge` gán knowledge thành công
- [ ] `PUT /agents/:id/knowledge` với `[]` → bỏ gán tất cả
- [ ] `GET /agents/:id/knowledge` trả về đúng list
- [ ] `GET /knowledge` mỗi document kèm agents[]
- [ ] Knowledge khác tenant → 400

## Definition of Done
- [ ] Code implemented
- [ ] Tested via Swagger
- [ ] AgentKnowledge bảng có data đúng

---
Next Phase: [Phase 05 — Backend Message Routing & RAG](./phase-05-backend-message-routing.md)
