# Phase 04: Branding Injection & REST APIs
Status: ✅ Done
Dependencies: Phase 02

## Objective
Inject branding watermark cho gói Free. Tạo REST APIs cho seller xem plans, subscription, usage.

## Scope
- Branding injection (Free plan only, không áp dụng Playground)
- GET /plans (public)
- GET /sellers/me/subscription (auth)
- GET /sellers/me/usage (auth) — aggregate across tenants

## Implementation Steps
1. [x] `QuotaService.injectBranding(sellerId, content)` — nếu Free → append `\n\n🤖 Được hỗ trợ bởi Mine Chatbot`
2. [x] Gọi injectBranding trong conversation.service.ts `sendMessage()` (sau LLM response)
3. [x] Gọi injectBranding trong channel.service.ts (sau LLM response)
4. [x] KHÔNG gọi trong `testMessage()` (Playground)
5. [x] Tạo `plan.controller.ts`: GET /plans (public, no auth)
6. [x] Thêm endpoints seller: GET /sellers/me/subscription, GET /sellers/me/usage
7. [x] `getUsageStats(sellerId)` — aggregate: botsUsed, teamUsed, knowledgeUsed, daysRemaining
8. [x] Tạo DTOs: PlanResponseDto, SubscriptionResponseDto, UsageResponseDto
9. [x] Swagger decorators

## Files
- `src/modules/plan/quota.service.ts` — MODIFY: injectBranding, getUsageStats
- `src/modules/plan/plan.controller.ts` — NEW
- `src/modules/plan/dto/*.dto.ts` — NEW (3 files)
- `src/modules/conversation/conversation.service.ts` — MODIFY
- `src/modules/channel/channel.service.ts` — MODIFY

## Acceptance Criteria
- [x] Free: AI response qua FB/Zalo có branding cuối tin nhắn
- [x] Free: Playground test KHÔNG có branding
- [x] Paid plan: không có branding
- [x] GET /plans → 4 plans sorted
- [x] GET /sellers/me/usage → đúng aggregate data
- [x] TSC 0, ESLint 0

---
Next Phase: Phase 05 — Downgrade & Expiry Logic
