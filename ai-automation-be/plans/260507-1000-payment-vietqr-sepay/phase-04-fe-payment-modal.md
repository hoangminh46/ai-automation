# Phase 04: FE Payment Modal & Polling
Status: ⬜ Pending
Dependencies: Phase 03

## Objective
Payment Confirmation Modal — QR, thông tin CK, polling auto-detect. UI theo style AIGENZ.

## Implementation Steps

1. [ ] Tạo `src/lib/services/payment.service.ts` (API layer)
2. [ ] Tạo `src/components/billing/PaymentModal.tsx`
   - Props: planSlug, planName, amount, onClose, onSuccess
   - Mount → createOrder → hiện QR + bank info
   - Polling: GET status mỗi 3s → detect COMPLETED → success screen
   - Countdown 30 phút → expired → nút "Tạo lại"
   - Copy buttons cho STK, nội dung CK
   - Dark theme, mobile responsive
3. [ ] QR URL: `https://qr.sepay.vn/img?acc={STK}&bank=Vietcombank&amount={AMOUNT}&des={CONTENT}`
4. [ ] Tích hợp vào Billing page — thay UpgradeModal bằng PaymentModal
5. [ ] Success screen: hiện plan name + thời hạn → đóng → refresh

## Acceptance Criteria
- [ ] Click "Nâng cấp" → PaymentModal → QR + info hiển thị đúng
- [ ] Polling detect COMPLETED → success toast → refresh
- [ ] Copy buttons hoạt động
- [ ] Timer countdown + cleanup khi unmount
- [ ] Hết 30 phút → expired state

---
Next Phase: Phase 05 — Expiry Reminder & Notifications
