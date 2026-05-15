# Hướng dẫn cài đặt SePay cho Mine Chatbot

## 1. Tạo tài khoản SePay

1. Truy cập [SePay.vn](https://sepay.vn) → Đăng ký
2. Xác thực email + số điện thoại

## 2. Thêm tài khoản ngân hàng

1. Vào **Quản lý ngân hàng** → **Thêm ngân hàng**
2. Chọn **Vietcombank** (hoặc ngân hàng bạn muốn nhận tiền)
3. Nhập:
   - Số tài khoản: `<STK của bạn>`
   - Tên chủ tài khoản: `<Tên trên thẻ>`
4. **Xác thực tài khoản** theo hướng dẫn SePay

## 3. Cấu hình Webhook

1. Vào **Cài đặt** → **Webhook**
2. Thêm Webhook URL:
   ```
   https://your-domain.com/api/v1/webhooks/sepay
   ```
3. **API Key**: copy lại → điền vào `.env` file:
   ```env
   SEPAY_API_KEY="<api-key-tu-sepay>"
   ```
4. Chọn sự kiện: **Giao dịch mới** (New transaction)
5. Bật webhook

## 4. Cấu hình .env Backend

Thêm/sửa các biến sau trong file `.env` của `ai-automation-be`:

```env
# SePay Configuration
SEPAY_API_KEY="api-key-tu-sepay-dashboard"
SEPAY_BANK_ACCOUNT_NUMBER="0123456789"
SEPAY_BANK_NAME="Vietcombank"
SEPAY_BANK_ACCOUNT_NAME="NGUYEN VAN A"
SEPAY_BANK_BIN="970436"
SEPAY_TRANSFER_PREFIX="AICHAT"
```

### Giải thích:
| Biến | Mô tả |
|------|-------|
| `SEPAY_API_KEY` | API key từ SePay dashboard |
| `SEPAY_BANK_ACCOUNT_NUMBER` | Số tài khoản ngân hàng nhận tiền |
| `SEPAY_BANK_NAME` | Tên ngân hàng (VD: Vietcombank) |
| `SEPAY_BANK_ACCOUNT_NAME` | Tên chủ tài khoản (IN HOA, không dấu) |
| `SEPAY_BANK_BIN` | Mã BIN ngân hàng (xem bảng bên dưới) |
| `SEPAY_TRANSFER_PREFIX` | Prefix cho nội dung chuyển khoản (VD: AICHAT) |

### Bảng BIN ngân hàng phổ biến:
| Ngân hàng | BIN |
|-----------|-----|
| Vietcombank | 970436 |
| Techcombank | 970407 |
| MB Bank | 970422 |
| ACB | 970416 |
| VPBank | 970432 |
| TPBank | 970423 |

## 5. Test thanh toán

### Cách 1: Giả lập webhook (Development)

Gửi POST request tới webhook endpoint:

```bash
curl -X POST http://localhost:3001/api/v1/webhooks/sepay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEPAY_API_KEY>" \
  -d '{
    "id": 12345,
    "gateway": "Vietcombank",
    "transactionDate": "2026-05-07 15:00:00",
    "accountNumber": "0123456789",
    "transferType": "in",
    "transferAmount": 199000,
    "accumulated": 1000000,
    "code": null,
    "content": "AICHAT ORD250507ABC123 chuyen tien",
    "referenceCode": "FT26127123456",
    "description": "AICHAT ORD250507ABC123"
  }'
```

> **Lưu ý**: `content` phải chứa đúng mã đơn hàng (VD: `ORD250507ABC123`) để hệ thống match.

### Cách 2: Chuyển khoản thật (Staging/Production)

1. Mở trang Billing → Chọn gói → Quét QR
2. Chuyển khoản đúng số tiền + nội dung CK
3. SePay sẽ gọi webhook → hệ thống tự xác nhận
4. Kiểm tra: đơn hàng chuyển sang COMPLETED

## 6. Luồng thanh toán tổng quát

```
[User chọn gói] → [FE tạo order] → [BE tạo PaymentOrder PENDING]
       ↓
[Hiện QR VietQR] → [User quét + chuyển khoản]
       ↓
[SePay detect giao dịch] → [Gọi webhook] → [BE match order by transferContent]
       ↓
[Order → COMPLETED] → [Subscription upgraded] → [FE poll detect → Success screen]
```

## 7. Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| Webhook 401 | API Key sai | Kiểm tra `SEPAY_API_KEY` trong `.env` |
| Webhook nhận nhưng không match order | Nội dung CK không chứa mã đơn | Kiểm tra prefix + orderCode format |
| QR không hiện | BIN sai hoặc STK sai | Kiểm tra `SEPAY_BANK_BIN` và `SEPAY_BANK_ACCOUNT_NUMBER` |
| Đơn hết hạn | User chuyển khoản sau 30 phút | Tạo đơn mới, chuyển lại |
