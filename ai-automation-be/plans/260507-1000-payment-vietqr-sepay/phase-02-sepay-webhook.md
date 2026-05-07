# Phase 02: SePay Webhook & Order Matching
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Xây dựng webhook endpoint nhận thông báo giao dịch từ SePay, match với PaymentOrder và auto-activate subscription.

## Why This Phase Exists
Đây là phần cốt lõi của auto-detect — biến CK thành subscription activation mà không cần admin duyệt.

## Requirements

### Functional
- [ ] Webhook endpoint `POST /webhook/sepay` (public, không cần JWT)
- [ ] Verify SePay API Key từ `Authorization` header
- [ ] Whitelist SePay IPs (optional, thêm lớp bảo mật)
- [ ] Parse webhook payload → extract `content`, `transferAmount`, `id`
- [ ] Match logic: tìm `orderCode` trong `content` field → lookup PENDING order
- [ ] Verify `transferAmount` >= `order.amount`
- [ ] Complete order → activate subscription (reuse PaymentService.completeOrder)
- [ ] Dedup: skip nếu `sepayTransId` đã tồn tại
- [ ] Response: `{ "success": true }` với HTTP 200

### Non-Functional
- [ ] Webhook phải respond < 8 giây (SePay timeout)
- [ ] Log toàn bộ webhook payload (debug)
- [ ] Xử lý async nếu cần (respond 200 trước, process sau)

## Implementation Steps

1. [ ] Thêm env vars vào `.env` và `src/common/config/env.validation.ts`
```env
SEPAY_API_KEY=your-sepay-api-key
SEPAY_ACCOUNT_NO=your-vcb-account
SEPAY_BANK_NAME=Vietcombank
PAYMENT_CODE_PREFIX=AICHAT
```

2. [ ] Tạo `src/modules/payment/webhook/sepay-webhook.controller.ts`
```typescript
@Controller('webhook')
export class SepayWebhookController {
  @Post('sepay')
  @HttpCode(200)
  async handleSepayWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: SepayWebhookPayload,
    @Req() req: Request,
  ) {
    // Step 1: Verify API Key
    // Step 2: Verify IP whitelist (optional)
    // Step 3: Check transferType === 'in'
    // Step 4: Extract orderCode from content
    // Step 5: Find PENDING order by orderCode
    // Step 6: Verify amount
    // Step 7: Dedup check (sepayTransId)
    // Step 8: Complete order
    return { success: true };
  }
}
```

3. [ ] Tạo `src/modules/payment/dto/sepay-webhook.dto.ts`
```typescript
class SepayWebhookPayload {
  id: number;              // SePay transaction ID
  gateway: string;         // "Vietcombank"
  transactionDate: string;
  accountNumber: string;
  code: string | null;     // Mã thanh toán (SePay tự nhận diện)
  content: string;         // Nội dung CK
  transferType: string;    // "in" | "out"
  transferAmount: number;  // Số tiền
  accumulated: number;     // Số dư lũy kế
  subAccount: string | null;
  referenceCode: string;   // Mã tham chiếu bank
  description: string;     // Full SMS content
}
```

4. [ ] OrderCode extraction logic:
```typescript
// Content: "AICHAT 761197 chuyen tien" → extract "761197"
// Strategy: tìm chuỗi match pattern "{PREFIX} {6-digit}" trong content
extractOrderCode(content: string, prefix: string): string | null {
  const regex = new RegExp(`${prefix}\\s*(\\d{6})`, 'i');
  const match = content.match(regex);
  return match ? match[1] : null;
}
```

5. [ ] SePay API Key verification:
```typescript
verifySepayAuth(authHeader: string): boolean {
  const expected = `Apikey ${configService.get('SEPAY_API_KEY')}`;
  return timingSafeEqual(
    Buffer.from(authHeader),
    Buffer.from(expected),
  );
}
```

6. [ ] IP Whitelist (optional guard):
```typescript
const SEPAY_IPS = [
  '172.236.138.20', '172.233.83.68', '171.244.35.2',
  '151.158.108.68', '151.158.109.79', '103.255.238.139',
];
```

7. [ ] Exclude `/webhook/sepay` from API prefix (`/api/v1`)
   - Đã có pattern: webhook/facebook đã được exclude

8. [ ] Register SepayWebhookController trong PaymentModule

## Files to Create/Modify
- `src/modules/payment/webhook/sepay-webhook.controller.ts` — NEW
- `src/modules/payment/dto/sepay-webhook.dto.ts` — NEW
- `src/modules/payment/payment.service.ts` — Thêm extractOrderCode(), verifySepayAuth()
- `src/main.ts` — Exclude `webhook/sepay` from global prefix (nếu chưa)
- `.env` / `src/common/config/env.validation.ts` — Thêm SEPAY env vars

## Acceptance Criteria
- [ ] SePay webhook gọi đúng → order COMPLETED + subscription activated
- [ ] SePay webhook sai API Key → reject 401
- [ ] Webhook payload không chứa orderCode → ignore (return success)
- [ ] Webhook với sepayTransId đã có → skip (dedup)
- [ ] Webhook với transferType !== 'in' → skip
- [ ] Webhook với amount < order.amount → skip (không activate)

## Test Criteria
- [ ] Giả lập SePay webhook (Postman/curl) → verify order completed
- [ ] Dùng SePay Sandbox giả lập giao dịch → verify webhook nhận được
- [ ] Retry webhook → verify dedup hoạt động

## Definition of Done
- [ ] Webhook endpoint hoạt động, verify auth
- [ ] Match + activate logic đúng
- [ ] Dedup + edge cases handled
- [ ] Logs đầy đủ để debug

---
Next Phase: Phase 03 — Payment APIs & QR Generation
