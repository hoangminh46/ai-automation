# Phase 06: FE Usage & Billing UI
Status: ✅ Done
Dependencies: Phase 04

## Objective
FE pages: seller xem usage, plan hiện tại, bảng giá, warning banners, upgrade CTA.

## Scope
- /dashboard/usage page (progress bars, cycle info)
- /dashboard/billing page (plan comparison, upgrade CTA)
- Warning banner khi gần hết quota
- Sidebar menu items

## Implementation Steps
1. [x] Tạo `src/lib/services/plan.service.ts` — API calls: getPlans, getSubscription, getUsage
2. [x] Tạo `UsageProgressBar` component — color gradient (xanh→vàng→cam→đỏ theo %)
3. [x] Tạo `/dashboard/usage/page.tsx` — progress bars (AI responses, bots, knowledge), cycle info, nút upgrade
4. [x] Tạo `/dashboard/usage/loading.tsx` — skeleton (inline trong page)
5. [x] Tạo `PlanComparisonTable` component — 4 columns, highlight Standard, đánh dấu gói hiện tại
6. [x] Tạo `UpgradeModal` component — MVP: hướng dẫn liên hệ (Zalo/Email)
7. [x] Tạo `/dashboard/billing/page.tsx` — current plan card + comparison table
8. [x] Tạo `/dashboard/billing/loading.tsx` — skeleton (inline trong page)
9. [x] Tạo `QuotaWarningBanner` — vàng >80%, đỏ 100%. Dismissable (localStorage)
10. [x] Thêm QuotaWarningBanner vào dashboard layout
11. [x] Thêm sidebar items: "Sử dụng" + "Gói dịch vụ"
12. [x] Dark mode + responsive

## Files
- `src/lib/services/plan.service.ts` — NEW
- `src/app/dashboard/usage/` — NEW (page + loading)
- `src/app/dashboard/billing/` — NEW (page + loading)
- `src/components/billing/*.tsx` — NEW (4 components)
- `src/app/dashboard/layout.tsx` — MODIFY (sidebar + banner)

## Acceptance Criteria
- [x] Usage page: progress bars chính xác
- [x] Billing page: 4 gói hiển thị, gói hiện tại đánh dấu
- [x] Warning banner hiện >80% quota, dismiss được
- [x] Upgrade → modal hướng dẫn
- [x] Dark mode + responsive + loading states
- [x] TSC 0, ESLint 0

---
End of Plan. Payment Integration = sprint riêng.
