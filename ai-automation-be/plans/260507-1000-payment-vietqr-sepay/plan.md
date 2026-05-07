# Plan: Payment Integration (VietQR + SePay)
Created: 2026-05-07
Status: ✅ Complete (all 6 phases done, E2E tested)
Last Updated: 2026-05-07T15:47:00+07:00

## Overview
Tích hợp thanh toán bằng chuyển khoản ngân hàng vào hệ thống Billing hiện tại.
- **QR Code**: Dùng SePay QR API (chuẩn VietQR) — sinh QR chứa STK + số tiền + nội dung
- **Auto-detect**: SePay webhook — tự động nhận diện giao dịch CK đến TK
- **Kết quả**: User scan QR → CK → 10-30s auto-activate subscription

## Phases

| Phase | Name | Status | Effort | Key Files |
|-------|------|--------|--------|-----------|
| 01 | DB Schema & Payment Service | ✅ Done | BE 0.5d | `prisma/schema.prisma`, `payment.service.ts` |
| 02 | SePay Webhook & Order Matching | ✅ Done | BE 1d | `sepay-webhook.controller.ts`, `sepay-webhook.dto.ts` |
| 03 | Payment APIs & QR Generation | ✅ Done | BE 0.5d | `payment.controller.ts`, `create-order.dto.ts` |
| 04 | FE Payment Modal & Polling | ✅ Done | FE 1d | `payment-modal.tsx`, `payment.service.ts` |
| 05 | Expiry Reminder & Notifications | ✅ Done | BE+FE 1d | `expiry-reminder.service.ts`, `expiry-check.service.ts`, `notification.gateway.ts`, `expiry-warning-banner.tsx` |
| 06 | Transaction History & Polish | ✅ Done | FE 0.5d | `transaction-history.tsx`, `response-pack-selector.tsx`, `billing/page.tsx` |

**Total: BE ~3d, FE ~2d — COMPLETED 2026-05-07**

## Acceptance Criteria
- [x] User bấm Upgrade → hiện Payment Modal (QR + STK + nội dung)
- [x] User CK đúng → 10-30s hệ thống auto-activate subscription
- [x] FE polling detect thành công → đóng modal + toast + refresh
- [x] Order hết 30 phút chưa CK → auto-expire
- [x] Trước hết hạn 3 ngày → hiện banner nhắc gia hạn
- [x] Gói hết hạn → hiện thông báo "Gói đã hết hạn, vui lòng gia hạn"
- [x] User mua Response Pack → bonus cộng dồn
- [x] Transaction history hiển thị đầy đủ (ngày, gói, số tiền, trạng thái)
- [x] SePay webhook retry → không duplicate activate
- [x] Webhook có auth (API Key verify)

## Testing Notes (2026-05-07)
- E2E test passed: FE create order → webhook simulate → order COMPLETED → subscription activated
- 2 runtime bugs found & fixed:
  1. **DTO `@Allow()` fix**: Global ValidationPipe rejected webhook payload (missing decorators). Fix: `@Allow()` on all fields.
  2. **SePay env**: Must add SEPAY_* vars to `.env` and **full restart BE** (ConfigModule caches at bootstrap).
- Amount match: order 447480 = Standard plan (599,000đ).

## Out of Scope (future)
- Refund flow, invoice PDF, international payments, auto-debit/recurring
- Admin manual CK resolution UI

## Quick Commands
- Save: `/save-brain`
- Next feature: `/brainstorm` or `/plan`
