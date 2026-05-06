# Phase 05: Downgrade & Expiry Logic
Status: ✅ Done
Dependencies: Phase 03, Phase 04

## Objective
Xử lý khi plan thay đổi (downgrade) hoặc hết hạn: deactivate tài nguyên vượt quota, auto-downgrade về Free.

## Scope
- DowngradeService: deactivate excess bots/team khi plan thay đổi
- ExpiryCheckService: cron kiểm tra subscription hết hạn
- Knowledge giữ nguyên (soft limit)

## Implementation Steps
1. [x] Tạo `src/modules/plan/downgrade.service.ts`
2. [x] `handlePlanChange(sellerId, newPlanId)`:
   - Đếm bots active across all tenants → nếu > newPlan.maxBots → deactivate LIFO (mới nhất trước)
   - Đếm team members active → nếu > newPlan.maxTeamMembers → deactivate LIFO (exclude OWNER)
   - Knowledge: KHÔNG deactivate, chỉ log warning
   - Return danh sách tài nguyên bị deactivate
3. [x] Tạo `src/modules/plan/expiry-check.service.ts`
4. [x] `@Cron('0 */6 * * *')` (mỗi 6 giờ): tìm subscriptions `currentPeriodEnd < now() AND status = ACTIVE`
   - Mark status = EXPIRED
   - Auto-create Free subscription mới
   - Trigger handlePlanChange(sellerId, freePlanId)
5. [x] Register cả 2 services trong PlanModule

## Files
- `src/modules/plan/downgrade.service.ts` — NEW
- `src/modules/plan/expiry-check.service.ts` — NEW
- `src/modules/plan/plan.module.ts` — MODIFY: register services

## Acceptance Criteria
- [x] Premium → Free: excess bots deactivated (LIFO), knowledge giữ nguyên
- [x] Expired subscription → auto Free + deactivate excess
- [x] OWNER role KHÔNG bao giờ bị deactivate
- [x] Chạy expiry check lại (idempotent) → không duplicate
- [x] TSC 0, ESLint 0

---
Next Phase: Phase 06 — FE Usage & Billing UI
