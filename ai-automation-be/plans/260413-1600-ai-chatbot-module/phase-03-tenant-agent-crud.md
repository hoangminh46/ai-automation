# Phase 03: Tenant & Agent CRUD
Status: ✅ Complete | Dependencies: Phase 02

## Objective
Implement Tenant module (workspace CRUD) và Agent module (AI bot config CRUD). Đây là 2 entity cơ bản mà seller tương tác trực tiếp.

## Implementation Steps
1. [x] Implement Tenant module:
   - `POST /tenants` — Tạo workspace (name, slug)
   - `GET /tenants/:id` — Xem workspace
   - `PATCH /tenants/:id` — Cập nhật (name, settings)
2. [x] Implement Tenant DTOs với class-validator
3. [x] Implement Agent module:
   - `POST /tenants/:id/agents` — Tạo agent (name, persona, model, temperature)
   - `GET /tenants/:id/agents` — List agents
   - `GET /tenants/:id/agents/:agentId` — Chi tiết agent
   - `PATCH /tenants/:id/agents/:agentId` — Cập nhật (persona, greeting, model...)
   - `DELETE /tenants/:id/agents/:agentId` — Xóa
4. [x] Implement Agent DTOs với Swagger decorators
5. [x] Tạo default Agent khi tạo Tenant (persona template e-commerce VN)
6. [x] Wire TenantGuard vào tất cả routes `/tenants/:id/*`

## Acceptance Criteria
- [x] CRUD Tenant hoạt động (tạo/xem/sửa)
- [x] CRUD Agent hoạt động (tạo/xem/sửa/xóa)
- [x] Tạo Tenant → tự động tạo default Agent
- [x] Default Agent có persona phù hợp e-commerce VN
- [x] Seller chỉ access được tenant/agent của mình (Role Based Access Control với TenantGuard)

## Definition of Done
- [x] Tenant module complete
- [x] Agent module complete
- [x] DTOs validated
- [x] TenantGuard wired

---
Next: Phase 04 - LLM Integration
