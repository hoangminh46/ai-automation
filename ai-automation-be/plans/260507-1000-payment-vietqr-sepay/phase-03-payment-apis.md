# Phase 03: Payment APIs & QR Generation
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Tạo REST APIs cho FE gọi: tạo order, check status, cancel order, sinh QR URL, lịch sử giao dịch.

## Why This Phase Exists
FE cần endpoints để tạo order, lấy QR code, polling status, và hiển thị lịch sử.

## Requirements

### Functional
- [ ] `POST /sellers/me/payment-orders` — Tạo order (subscription hoặc response pack)
- [ ] `GET /sellers/me/payment-orders/:id/status` — Check order status (polling)
- [ ] `DELETE /sellers/me/payment-orders/:id` — Cancel PENDING order
- [ ] `GET /sellers/me/payment-orders` — Lịch sử thanh toán (paginated)
- [ ] QR URL construction: `https://qr.sepay.vn/img?acc={STK}&bank=Vietcombank&amount={AMOUNT}&des={CONTENT}`

### Non-Functional
- [ ] Rate limit: tạo order tối đa 5/phút/seller
- [ ] Status polling: response nhẹ (chỉ trả status + completedAt)

## Implementation Steps

1. [ ] Tạo `src/modules/payment/payment.controller.ts`
```typescript
@Controller('sellers/me')
@UseGuards(SupabaseAuthGuard)
export class PaymentController {

  @Post('payment-orders')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createOrder(
    @CurrentUser() user,
    @Body() dto: CreateSubscriptionOrderDto | CreateResponsePackOrderDto,
  ) {
    // Tạo order → return { order, qrUrl, bankInfo }
  }

  @Get('payment-orders/:id/status')
  async checkStatus(
    @CurrentUser() user,
    @Param('id') orderId: string,
  ) {
    // Return { status, completedAt } — lightweight cho polling
  }

  @Delete('payment-orders/:id')
  async cancelOrder(
    @CurrentUser() user,
    @Param('id') orderId: string,
  ) {
    // Cancel PENDING order
  }

  @Get('payment-orders')
  async getHistory(
    @CurrentUser() user,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    // Paginated transaction history
  }
}
```

2. [ ] Response shape cho `createOrder`:
```json
{
  "order": {
    "id": "uuid",
    "orderCode": "761197",
    "amount": 599000,
    "transferContent": "AICHAT 761197",
    "status": "PENDING",
    "expiresAt": "2026-05-07T10:30:00Z"
  },
  "qrUrl": "https://qr.sepay.vn/img?acc=XXX&bank=Vietcombank&amount=599000&des=AICHAT%20761197",
  "bankInfo": {
    "bankName": "Vietcombank",
    "accountNumber": "XXXXX",
    "accountName": "TEN CHU TK"
  }
}
```

3. [ ] PaymentService additions:
   - `buildQrUrl(order)`: construct SePay QR URL
   - `getBankInfo()`: return bank info from env
   - `getOrderStatus(sellerId, orderId)`: check ownership + return status
   - `getOrderHistory(sellerId, page, limit)`: paginated query

4. [ ] Thêm env vars:
```env
SEPAY_ACCOUNT_NAME=TEN_CHU_TAI_KHOAN
```

5. [ ] Response Pack pricing (hardcoded for MVP):
```typescript
const RESPONSE_PACKS = [
  { size: 500, price: 99000 },
  { size: 1500, price: 249000 },
  { size: 5000, price: 699000 },
];
```

## Files to Create/Modify
- `src/modules/payment/payment.controller.ts` — NEW
- `src/modules/payment/payment.service.ts` — Thêm methods
- `src/modules/payment/dto/create-order.dto.ts` — Finalize
- `src/modules/payment/payment.module.ts` — Register controller

## Acceptance Criteria
- [ ] POST tạo order → return QR URL + bank info + order details
- [ ] GET status → return lightweight status object
- [ ] DELETE cancel PENDING order → status CANCELLED
- [ ] GET history → paginated list (newest first)
- [ ] Rate limit: 6th request/minute → 429

## Test Criteria
- [ ] Swagger: tạo order → copy QR URL → open browser → thấy QR code
- [ ] Polling status mỗi 3s → response < 100ms
- [ ] Cancel order đã COMPLETED → error

## Definition of Done
- [ ] All endpoints hoạt động trên Swagger
- [ ] QR URL sinh đúng format
- [ ] Rate limiting configured

---
Next Phase: Phase 04 — FE Payment Modal & Polling
