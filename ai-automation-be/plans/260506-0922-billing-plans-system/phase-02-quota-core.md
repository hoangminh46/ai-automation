# Phase 02: QuotaService Core (AI Responses)
Status: ✅ Done
Dependencies: Phase 01

## Objective
Tạo QuotaService tập trung xử lý AI response quota. Refactor conversation.service.ts + channel.service.ts để dùng QuotaService thay vì hardcode tenant.messageUsed.

## Scope
- QuotaService: getSubscription, checkAndDeductAiResponse
- Refactor conversation.service.ts (2 blocks: check + increment)
- Refactor channel.service.ts (2 blocks: check + increment, cần resolve sellerId từ tenantId)
- Auto-assign Free subscription nếu seller chưa có

## Implementation Steps
1. [x] Tạo `src/modules/plan/quota.service.ts`
2. [x] `getSubscription(sellerId)` — eager load plan. Auto-create Free nếu chưa có.
3. [x] `checkAndDeductAiResponse(sellerId)` — logic:
   - `totalAvailable = (plan.maxAiResponses - sub.aiResponsesUsed) + sub.bonusResponsesRemaining`
   - Nếu `<= 0` → throw 429
   - Nếu `aiResponsesUsed < plan.maxAiResponses` → increment aiResponsesUsed
   - Else → decrement bonusResponsesRemaining
4. [x] Export QuotaService từ PlanModule
5. [x] Refactor `conversation.service.ts`: inject QuotaService, thay quota check + increment
6. [x] Refactor `channel.service.ts`: resolve sellerId từ tenantId, thay quota check + increment
7. [x] Verify: human reply KHÔNG bị block (chỉ AI response mới check quota)

## Files
- `src/modules/plan/quota.service.ts` — NEW
- `src/modules/plan/plan.module.ts` — MODIFY: export QuotaService
- `src/modules/conversation/conversation.service.ts` — MODIFY
- `src/modules/channel/channel.service.ts` — MODIFY

## Acceptance Criteria
- [x] Free seller: response #51 rejected 429 với message rõ ràng
- [x] Thêm bonusResponses vào DB → response #51 OK, bonus giảm 1
- [x] Human reply vẫn hoạt động khi hết quota
- [x] Seller mới (chưa có subscription) → auto Free → chat bình thường
- [x] TSC 0, ESLint 0

---
Next Phase: Phase 03 — Resource Limits & Monthly Reset
