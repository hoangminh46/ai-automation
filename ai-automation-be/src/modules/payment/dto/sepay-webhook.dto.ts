import { Allow } from 'class-validator';

/**
 * SePay Webhook payload structure.
 * Ref: https://my.sepay.vn/userguide/webhooks
 *
 * SePay gửi POST request khi có giao dịch mới.
 *
 * Dùng @Allow() trên mỗi field thay vì validation decorators,
 * vì đây là external webhook — ta validate thủ công trong controller.
 * @Allow() cho phép field tồn tại qua Global ValidationPipe (whitelist mode)
 * mà không ép kiểu hay reject.
 */
export class SepayWebhookPayload {
  @Allow()
  id: number; // SePay transaction ID (dùng làm sepayTransId dedup)

  @Allow()
  gateway: string; // Tên ngân hàng: "MBBank", "Vietcombank", ...

  @Allow()
  transactionDate: string; // "2024-01-15 10:30:00"

  @Allow()
  accountNumber: string; // Số tài khoản nhận

  @Allow()
  code: string | null; // Mã thanh toán SePay tự nhận diện

  @Allow()
  content: string; // Nội dung chuyển khoản (chứa orderCode)

  @Allow()
  transferType: string; // "in" = nhận tiền, "out" = chuyển đi

  @Allow()
  transferAmount: number; // Số tiền giao dịch (VND)

  @Allow()
  accumulated: number; // Số dư lũy kế

  @Allow()
  subAccount: string | null; // Tài khoản phụ

  @Allow()
  referenceCode: string; // Mã tham chiếu ngân hàng

  @Allow()
  description: string; // Full SMS/notification content
}
