# Phase 01: DB Schema, Plan Model & Seed
Status: ✅ Done
Dependencies: None

## Objective
Tạo DB schema cho Plans, SellerSubscription, ResponsePackPurchase. Seed 4 plans mặc định. Migrate existing sellers → Free plan.

## Why This Phase Exists
Data model là foundation. Mọi phase sau phụ thuộc vào schema này.

## Scope
### In Scope
- Prisma schema: Plan, SellerSubscription, ResponsePackPurchase + enums
- Seed 4 default plans (idempotent upsert)
- Migrate existing sellers → Free subscription
- PlanModule + PlanService skeleton

### Out of Scope
- Quota enforcement (Phase 02)
- Downgrade logic (Phase 03)
- APIs & FE (Phase 03-04)

## Requirements

### Functional
- [ ] Enum `BillingPeriod`: MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL
- [ ] Enum `SubscriptionStatus`: ACTIVE, EXPIRED, CANCELLED
- [ ] Model `Plan` — tất cả fields theo plan.md (slug unique, displayOrder, isActive)
- [ ] Model `SellerSubscription` — FK sellerId (UNIQUE), FK planId, status, aiResponsesUsed, bonusResponsesRemaining, currentPeriodStart/End
- [ ] Model `ResponsePackPurchase` — FK sellerId, amount, price, purchasedAt
- [ ] Relation: Seller hasOne SellerSubscription
- [ ] Relation: Seller hasMany ResponsePackPurchase
- [ ] Relation: Plan hasMany SellerSubscription
- [ ] Seed script: upsert 4 plans by slug (idempotent)
- [ ] Migration script: tạo SellerSubscription(plan=free, status=ACTIVE) cho mọi seller chưa có
- [ ] PlanModule đăng ký trong AppModule
- [ ] PlanService: findAllActive(), findBySlug()

### Non-Functional
- [ ] Backward-compatible: messageUsed/messageQuota trên Tenant giữ nguyên (deprecate sau)
- [ ] Seed + migration idempotent (chạy lại không duplicate)

## Implementation Steps

1. [ ] Thêm enums `BillingPeriod`, `SubscriptionStatus` vào schema.prisma
2. [ ] Thêm model `Plan` vào schema.prisma
3. [ ] Thêm model `SellerSubscription` vào schema.prisma (FK seller, unique sellerId)
4. [ ] Thêm model `ResponsePackPurchase` vào schema.prisma
5. [ ] Thêm relations vào model Seller: subscription, responsePacks
6. [ ] Chạy `npx prisma db push`
7. [ ] Tạo `src/modules/plan/plan.module.ts`
8. [ ] Tạo `src/modules/plan/plan.service.ts` (findAllActive, findBySlug)
9. [ ] Tạo `prisma/seed-plans.ts` — upsert 4 plans
10. [ ] Tạo `prisma/migrate-subscriptions.ts` — assign Free cho existing sellers
11. [ ] Chạy seed + migration
12. [ ] Đăng ký PlanModule trong AppModule

## Seed Data

```typescript
const PLANS = [
  {
    slug: 'free',
    name: 'Miễn phí',
    price: 0,
    billingPeriod: 'MONTHLY', // Free dùng MONTHLY nhưng currentPeriodEnd = null (không hết hạn)
    maxAiResponses: 50,
    maxBots: 1,
    maxTeamMembers: 1,
    maxKnowledgeFiles: 3,
    maxKnowledgeSizeMb: 5,
    hasBrandingWatermark: true,
    displayOrder: 1,
  },
  {
    slug: 'basic',
    name: 'Cơ bản',
    price: 299000,
    billingPeriod: 'MONTHLY', // Base period. Seller chọn 1/3/6/12 tháng khi đăng ký.
    maxAiResponses: 3000,
    maxBots: 3,
    maxTeamMembers: 3,
    maxKnowledgeFiles: 10,
    maxKnowledgeSizeMb: 30,
    hasBrandingWatermark: false,
    displayOrder: 2,
  },
  {
    slug: 'standard',
    name: 'Tiêu chuẩn',
    price: 599000,
    billingPeriod: 'MONTHLY', // Base period. Seller chọn 1/3/6/12 tháng khi đăng ký.
    maxAiResponses: 8000,
    maxBots: 5,
    maxTeamMembers: 10,
    maxKnowledgeFiles: 30,
    maxKnowledgeSizeMb: 100,
    hasBrandingWatermark: false,
    displayOrder: 3,
  },
  {
    slug: 'premium',
    name: 'Cao cấp',
    price: 1199000,
    billingPeriod: 'MONTHLY', // Base period. Seller chọn 1/3/6/12 tháng khi đăng ký.
    maxAiResponses: 20000,
    maxBots: 10,
    maxTeamMembers: -1,
    maxKnowledgeFiles: 100,
    maxKnowledgeSizeMb: 500,
    hasBrandingWatermark: false,
    displayOrder: 4,
  },
];
```

## Files to Create/Modify
- `prisma/schema.prisma` — Plan, SellerSubscription, ResponsePackPurchase + enums
- `src/modules/plan/plan.module.ts` — NEW
- `src/modules/plan/plan.service.ts` — NEW
- `prisma/seed-plans.ts` — NEW
- `prisma/migrate-subscriptions.ts` — NEW
- `src/app.module.ts` — Import PlanModule

## Acceptance Criteria
- [ ] DB push thành công, 3 tables mới tồn tại
- [ ] 4 plans trong DB sau seed
- [ ] Mỗi seller có 1 SellerSubscription (Free plan)
- [ ] PlanService injectable và trả data đúng
- [ ] Chạy seed lại không duplicate

## Definition of Done
- [ ] Schema pushed, seed + migration xong
- [ ] PlanModule registered
- [ ] Features hiện tại KHÔNG bị break
- [ ] TSC 0, ESLint 0

---
Next Phase: Phase 02 — QuotaService & Enforcement Refactor
