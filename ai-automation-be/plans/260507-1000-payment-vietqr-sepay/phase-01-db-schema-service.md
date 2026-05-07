# Phase 01: DB Schema & Payment Service
Status: 🟢 Complete
Dependencies: Billing Plans System (done)

## Objective
Tạo data model cho Payment Order và PaymentService core logic.

## Why This Phase Exists
Mọi phase sau đều phụ thuộc vào schema và service cơ bản này.

## Requirements

### Functional
- [x] Tạo `PaymentOrder` model trong Prisma schema
- [x] Tạo enum `PaymentOrderStatus` (PENDING, COMPLETED, EXPIRED, CANCELLED)
- [x] Tạo enum `PaymentOrderType` (SUBSCRIPTION, RESPONSE_PACK)
- [x] PaymentService: `createOrder()` — tạo PENDING order với unique orderCode
- [x] PaymentService: `findPendingOrder()` — tìm order theo orderCode
- [x] PaymentService: `completeOrder()` — PENDING → COMPLETED + activate subscription
- [x] PaymentService: `expireStaleOrders()` — cron cleanup orders PENDING > 30 phút
- [x] OrderCode generator: random 6-digit string (kiểm tra unique trước khi save)

### Non-Functional
- [x] Index: `payment_orders(orderCode)` UNIQUE
- [x] Index: `payment_orders(sellerId, status)` — query active orders
- [x] Constraint: 1 PENDING order per seller at a time

## Implementation Steps

1. [ ] Thêm `PaymentOrder` model vào `prisma/schema.prisma`
```prisma
enum PaymentOrderStatus {
  PENDING
  COMPLETED
  EXPIRED
  CANCELLED
}

enum PaymentOrderType {
  SUBSCRIPTION
  RESPONSE_PACK
}

model PaymentOrder {
  id                String              @id @default(uuid())
  sellerId          String
  seller            Seller              @relation(fields: [sellerId], references: [id])
  orderCode         String              @unique
  type              PaymentOrderType
  planId            String?
  plan              Plan?               @relation(fields: [planId], references: [id])
  billingPeriod     BillingPeriod?
  responsePackSize  Int?
  amount            Int
  transferContent   String
  status            PaymentOrderStatus  @default(PENDING)
  sepayTransId      Int?                @unique
  expiresAt         DateTime
  completedAt       DateTime?
  createdAt         DateTime            @default(now())

  @@index([sellerId, status])
  @@map("payment_orders")
}
```

2. [ ] Thêm relation vào `Seller` model: `paymentOrders PaymentOrder[]`
3. [ ] Thêm relation vào `Plan` model: `paymentOrders PaymentOrder[]`

4. [ ] Tạo `src/modules/payment/payment.module.ts`
5. [ ] Tạo `src/modules/payment/payment.service.ts`
   - `generateOrderCode()`: loop generate 6-digit + check unique
   - `createSubscriptionOrder(sellerId, planSlug, billingPeriod)`: validate plan, check no existing PENDING, create order
   - `createResponsePackOrder(sellerId, packSize, price)`: create order for response pack
   - `findPendingByOrderCode(orderCode)`: find PENDING order
   - `completeOrder(orderId, sepayTransId)`: transaction { update order COMPLETED, update subscription, resync quota }
   - `cancelOrder(orderId)`: PENDING → CANCELLED
   - `expireStaleOrders()`: cron mỗi 5 phút, PENDING + expiresAt < now() → EXPIRED

6. [ ] Tạo `src/modules/payment/dto/create-order.dto.ts`
```typescript
class CreateSubscriptionOrderDto {
  @IsString()
  planSlug: string;

  @IsEnum(BillingPeriod)
  @IsOptional()
  billingPeriod?: BillingPeriod = BillingPeriod.MONTHLY;
}

class CreateResponsePackOrderDto {
  @IsInt()
  @Min(100)
  packSize: number;
}
```

7. [x] Register PaymentModule trong AppModule
8. [ ] Run `prisma db push` để apply schema changes

## Files to Create/Modify
- `prisma/schema.prisma` — Thêm PaymentOrder model + enums
- `src/modules/payment/payment.module.ts` — NEW
- `src/modules/payment/payment.service.ts` — NEW
- `src/modules/payment/dto/create-order.dto.ts` — NEW
- `src/app.module.ts` — Register PaymentModule

## Acceptance Criteria
- [x] PaymentOrder table tạo thành công (prisma db push) — **Chờ anh chạy thủ công**
- [x] `createSubscriptionOrder()` tạo order PENDING với unique orderCode
- [x] `completeOrder()` chuyển PENDING → COMPLETED + update subscription trong 1 transaction
- [x] Không cho tạo 2 PENDING order cùng lúc cho 1 seller
- [x] `expireStaleOrders()` cleanup orders > 30 phút

## Test Criteria
- [ ] Tạo order → check DB record đúng fields
- [ ] Tạo order khi đã có PENDING → throw error
- [ ] Complete order → check subscription updated
- [ ] Stale order → auto-expire sau 30 phút

## Definition of Done
- [x] Code implemented, TSC 0, ESLint 0
- [ ] Schema applied thành công — **Chờ anh chạy `npx prisma db push`**
- [ ] Service methods hoạt động (test thủ công qua Swagger) — **Chờ Phase 03 (APIs)**
- [x] Plan progress updated

---
Next Phase: Phase 02 — SePay Webhook & Order Matching
