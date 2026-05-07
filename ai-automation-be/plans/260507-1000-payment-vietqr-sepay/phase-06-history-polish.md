# Phase 06: Transaction History & Polish
Status: ⬜ Pending
Dependencies: Phase 04, Phase 05

## Objective
FE hiển thị lịch sử thanh toán, Response Pack purchase flow, và polish UX.

## Implementation Steps

1. [ ] FE: Transaction History trên /dashboard/billing
   - Bảng: Ngày | Gói/Loại | Số tiền | Trạng thái | Mã GD
   - Paginated (10 per page)
   - Status badges: COMPLETED (xanh), EXPIRED (xám), CANCELLED (đỏ)

2. [ ] FE: Response Pack purchase flow
   - Nút "Mua thêm AI Responses" trên Usage page
   - Modal chọn pack (500/99k, 1500/249k, 5000/699k)
   - Click → PaymentModal (reuse) → CK → auto-activate → bonus cộng dồn

3. [ ] Polish & Edge Cases
   - [ ] Loading skeleton cho PaymentModal
   - [ ] Error state: nếu createOrder fail → hiện lỗi + nút retry
   - [ ] QR image fallback: nếu SePay QR chậm → hiện thông tin CK text
   - [ ] Accessibility: copy feedback toast
   - [ ] SEO: meta tags cho billing pages

4. [ ] SePay Dashboard setup guide (README hoặc docs/)
   - Hướng dẫn anh setup SePay account
   - Thêm TK Vietcombank
   - Cấu hình webhook URL
   - Cấu hình mã thanh toán (prefix AICHAT)
   - Test bằng giả lập giao dịch

## Acceptance Criteria
- [ ] Transaction history hiển thị đúng, paginated
- [ ] Response Pack mua xong → bonus hiện trên Usage page
- [ ] QR image load fail → fallback text info
- [ ] Setup guide đủ rõ để anh tự setup SePay

## Definition of Done
- [ ] Full payment flow hoạt động end-to-end
- [ ] Transaction history hiển thị
- [ ] Response Pack flow hoạt động
- [ ] SePay setup guide viết xong
- [ ] Manual test pass tất cả acceptance criteria
