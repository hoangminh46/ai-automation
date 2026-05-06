# Phase 03: Resource Limits & Monthly Reset
Status: ✅ Done
Dependencies: Phase 02

## Objective
Thêm enforcement cho bot/team/knowledge limits (aggregate across all tenants của seller). Cron monthly reset aiResponsesUsed.

## Scope
- QuotaService: checkBotLimit, checkTeamLimit, checkKnowledgeLimit
- Guard khi create agent, invite member, upload knowledge
- Monthly reset cron job
- Install @nestjs/schedule

## Implementation Steps
1. [x] `QuotaService.checkBotLimit(sellerId)` — COUNT agents (isActive=true) across ALL tenants WHERE tenant.sellerId
2. [x] `QuotaService.checkTeamLimit(sellerId)` — COUNT tenant_members (isActive=true, exclude OWNER) across ALL tenants. Skip if maxTeamMembers = -1.
3. [x] `QuotaService.checkKnowledgeLimit(sellerId, newFileSize?)` — COUNT docs + SUM fileSize across ALL tenants
4. [x] Thêm checkBotLimit trong `agent.service.ts` create method
5. [x] Thêm checkKnowledgeLimit trong knowledge upload service
6. [x] Cài `@nestjs/schedule`, đăng ký `ScheduleModule.forRoot()` trong AppModule
7. [x] Tạo `src/modules/plan/monthly-reset.service.ts` — `@Cron('0 0 1 * *')`: reset aiResponsesUsed = 0, update currentPeriodStart/End. KHÔNG reset bonusResponsesRemaining. Idempotent.

## Files
- `src/modules/plan/quota.service.ts` — MODIFY: thêm 3 methods
- `src/modules/plan/monthly-reset.service.ts` — NEW
- `src/modules/plan/plan.module.ts` — MODIFY: register ScheduleModule
- `src/modules/agent/agent.service.ts` — MODIFY: checkBotLimit
- `src/modules/knowledge/` — MODIFY: checkKnowledgeLimit
- `src/app.module.ts` — MODIFY: ScheduleModule.forRoot()

## Acceptance Criteria
- [x] Free: tạo bot thứ 2 → blocked (aggregate across tenants)
- [x] Free: upload file thứ 4 → blocked
- [x] Free: upload tổng > 5MB → blocked
- [x] Monthly reset: aiResponsesUsed = 0, bonusResponsesRemaining giữ nguyên
- [x] TSC 0, ESLint 0

---
Next Phase: Phase 04 — Branding Injection & REST APIs
