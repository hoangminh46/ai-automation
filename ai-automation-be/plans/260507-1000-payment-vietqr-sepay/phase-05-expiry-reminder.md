# Phase 05: Expiry Reminder & Notifications
Status: ⬜ Pending
Dependencies: Phase 02

## Objective
Thông báo nhắc gia hạn trước khi hết hạn + thông báo khi gói đã hết hạn.

## Implementation Steps

1. [ ] Tạo `ExpiryReminderService` — cron job chạy mỗi 6h
   - Query subscriptions: `currentPeriodEnd - 3 days <= now() AND status = ACTIVE`
   - Emit WebSocket event `subscription_expiring_soon` tới seller
   - Flag `reminderSentAt` trên subscription (tránh spam gửi lại)

2. [ ] Cập nhật `ExpiryCheckService` (đã có):
   - Khi hết hạn → revert Free → emit event `subscription_expired`

3. [ ] FE: Banner "Gói sắp hết hạn" (3 ngày trước)
   - Hiện trên dashboard layout (giống QuotaWarningBanner)
   - Nút CTA "Gia hạn ngay" → mở PaymentModal
   - Dismissable 24h (localStorage)

4. [ ] FE: Banner "Gói đã hết hạn" (khi đã revert Free)
   - Style đỏ, không dismissable
   - "Gói Standard đã hết hạn. Nâng cấp để tiếp tục sử dụng."
   - CTA → Billing page

5. [ ] WebSocket events mới:
   - `subscription_expiring_soon`: { sellerId, daysLeft, planName }
   - `subscription_expired`: { sellerId, previousPlan }

## Acceptance Criteria
- [ ] 3 ngày trước hết hạn → banner vàng "Sắp hết hạn" + nút gia hạn
- [ ] Gói hết hạn → banner đỏ "Đã hết hạn" + CTA nâng cấp
- [ ] Reminder chỉ gửi 1 lần (reminderSentAt flag)
- [ ] Banner dismissable 24h cho "sắp hết", không dismissable cho "đã hết"

---
Next Phase: Phase 06 — Transaction History & Polish
