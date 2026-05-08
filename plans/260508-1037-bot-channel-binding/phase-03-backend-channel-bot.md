# Phase 03: Backend — Channel-Bot Binding

Status: ✅ Complete
Dependencies: Phase 02

## Objective

Tạo API gán bot cho channel, cập nhật Agent create/update để hỗ trợ `channelIds`, và include agent info trong Channel response.

## Why This Phase Exists

Đây là core binding giữa Bot và Channel — quyết định bot nào phục vụ kênh nào. Frontend Phase 06-07 cần API này để hiện dropdown chọn bot.

## Implementation Steps

1. [ ] **Tạo AssignBotDto**
   - `agentId: string | null` (IsUUID hoặc IsOptional + allow null)
   - File: `src/modules/channel/dto/assign-bot.dto.ts`

2. [ ] **Tạo ChannelService.assignBot()**
   - Validate: agent thuộc cùng tenantId
   - Validate: agent tồn tại
   - Update `channelConnection.agentId = dto.agentId`
   - File: `src/modules/channel/channel.service.ts`

3. [ ] **Tạo ChannelController endpoint**
   - `PATCH /tenants/:tenantId/channels/:channelId/assign-bot`
   - Guard: SupabaseAuth + Tenant (Owner/Admin only)
   - File: `src/modules/channel/channel.controller.ts`

4. [ ] **Cập nhật Channel response — include agent**
   - Tất cả endpoints trả channel → include `agent: { id, name, isActive, isDefault }`
   - File: `src/modules/channel/channel.service.ts`

5. [ ] **Cập nhật Agent create/update — channelIds**
   - Thêm `channelIds?: string[]` vào CreateAgentDto + UpdateAgentDto
   - Create: sau khi tạo agent, update channels set agentId
   - Update: sync channels (bỏ gán cũ, thêm gán mới)
   - Validate: channels thuộc cùng tenant, channels chưa gán bot khác
   - File: `src/modules/agent/dto/*.dto.ts`, `src/modules/agent/agent.service.ts`

6. [ ] **Verify: Channel connect (OAuth) KHÔNG auto-gán bot (Rule 8)**
   - Kiểm tra flow OAuth callback cho Facebook + Zalo
   - Đảm bảo khi tạo ChannelConnection mới, `agentId` luôn là `null`
   - Nếu có logic cũ auto-gán agent → xoá bỏ
   - File: `src/modules/channel/channel.service.ts`, OAuth callback handlers

## Files to Create/Modify
- `src/modules/channel/dto/assign-bot.dto.ts` — **Mới**
- `src/modules/channel/channel.service.ts` — assignBot + include agent
- `src/modules/channel/channel.controller.ts` — Endpoint mới
- `src/modules/agent/dto/create-agent.dto.ts` — Thêm channelIds
- `src/modules/agent/dto/update-agent.dto.ts` — Thêm channelIds
- `src/modules/agent/agent.service.ts` — Channel sync logic

## Acceptance Criteria
- [ ] `PATCH /channels/:id/assign-bot` gán bot thành công
- [ ] `PATCH /channels/:id/assign-bot` với agentId=null → bỏ gán
- [ ] `PATCH /channels/:id/assign-bot` agent khác tenant → 400
- [ ] `GET /channels` trả về agent info cho mỗi channel
- [ ] `POST /agents` với channelIds → channels được gán
- [ ] `PATCH /agents/:id` với channelIds → channels sync đúng

## Definition of Done
- [ ] Code implemented
- [ ] Tested via Swagger
- [ ] Validation messages rõ ràng

---
Next Phase: [Phase 04 — Backend Knowledge N:M](./phase-04-backend-knowledge-nm.md)
