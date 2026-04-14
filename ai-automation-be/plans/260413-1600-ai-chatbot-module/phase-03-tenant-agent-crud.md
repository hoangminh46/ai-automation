# Phase 03: Tenant & Agent CRUD
Status: ⬜ Pending | Dependencies: Phase 02

## Objective
Implement Tenant module (workspace CRUD) và Agent module (AI bot config CRUD). Đây là 2 entity cơ bản mà seller tương tác trực tiếp.

## Implementation Steps
1. [ ] Implement Tenant module:
   - `POST /tenants` — Tạo workspace (name, slug)
   - `GET /tenants/:id` — Xem workspace
   - `PATCH /tenants/:id` — Cập nhật (name, settings)
2. [ ] Implement Tenant DTOs với class-validator
3. [ ] Implement Agent module:
   - `POST /tenants/:id/agents` — Tạo agent (name, persona, model, temperature)
   - `GET /tenants/:id/agents` — List agents
   - `GET /tenants/:id/agents/:agentId` — Chi tiết agent
   - `PATCH /tenants/:id/agents/:agentId` — Cập nhật (persona, greeting, model...)
   - `DELETE /tenants/:id/agents/:agentId` — Xóa
4. [ ] Implement Agent DTOs với Swagger decorators
5. [ ] Tạo default Agent khi tạo Tenant (persona template e-commerce VN)
6. [ ] Wire TenantGuard vào tất cả routes `/tenants/:id/*`

## Acceptance Criteria
- [ ] CRUD Tenant hoạt động (tạo/xem/sửa)
- [ ] CRUD Agent hoạt động (tạo/xem/sửa/xóa)
- [ ] Tạo Tenant → tự động tạo default Agent
- [ ] Default Agent có persona phù hợp e-commerce VN
- [ ] Seller chỉ access được tenant/agent của mình

## Definition of Done
- [ ] Tenant module complete
- [ ] Agent module complete
- [ ] DTOs validated
- [ ] TenantGuard wired

---
Next: Phase 04 - LLM Integration
