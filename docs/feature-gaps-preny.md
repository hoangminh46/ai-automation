# Feature Gaps — Từ phân tích đối thủ Preny.ai

> **Ngày ghi nhận:** 11/05/2026  
> **Nguồn:** Phân tích đối thủ Preny.ai (https://preny.ai)  
> **Trạng thái:** Chưa triển khai  

---

## 🔴 P0 — Ưu tiên cao

### 1. TikTok + Instagram Integration
- **Preny có:** Tích hợp TikTok Business + Instagram DM vào unified inbox
- **Mình hiện tại:** Chỉ có Facebook Messenger + Zalo OA
- **Tại sao quan trọng:** TikTok Shop và Instagram là 2 kênh bán hàng tăng trưởng nhanh nhất VN 2025-2026. Thiếu 2 kênh này là mất phần lớn thị trường e-commerce
- **Scope dự kiến:** OAuth flow, webhook receiver, message adapter cho mỗi kênh
- **Trạng thái:** ❌ Chưa bắt đầu

### 2. Facebook Comment → DM Automation
- **Preny có:** AI tự động reply comment trên post/quảng cáo → kéo khách vào DM → chốt đơn
- **Mình hiện tại:** Chỉ xử lý tin nhắn DM, không monitor comment
- **Tại sao quan trọng:** Khi chạy quảng cáo tin nhắn trên Facebook, comment là điểm chạm đầu tiên. Auto-reply comment giúp tăng điểm chất lượng ads (giảm CPC) và kéo khách vào inbox nhanh hơn
- **Scope dự kiến:** Facebook Graph API subscribe comment webhook, AI auto-reply logic, comment → DM bridge
- **Trạng thái:** ❌ Chưa bắt đầu

---

## 🟡 P1 — Ưu tiên trung bình

### 3. Remarketing / Re-engagement
- **Preny có:** Tự động phân loại khách hàng cũ → gửi tin nhắn remarketing theo kịch bản
- **Mình hiện tại:** Không có tính năng nhắn lại khách cũ tự động
- **Tại sao quan trọng:** Khách chưa chốt đơn lần đầu có thể chuyển đổi khi được nhắc lại đúng thời điểm. Đây là feature tăng CR đáng kể mà chi phí thấp
- **Scope dự kiến:** Customer segmentation rules, scheduled message campaigns, FB Messenger Marketing API (24h policy), Zalo ZNS
- **Trạng thái:** ❌ Chưa bắt đầu

### 4. Customer Tagging & Phân quyền nhân viên
- **Preny có:** 
  - Color-coded tags (🟢 đã có SĐT, 🟡 đang tương tác, 🔴 cần can thiệp, ⬜ không phản hồi)
  - Phân trạng thái hội thoại (Tư vấn, Chốt đơn, Khách quen, Spam)
  - Phân quyền sales team (multi-seat theo gói)
- **Mình hiện tại:** Customer list cơ bản, chưa có tagging system, chưa có multi-seat
- **Tại sao quan trọng:** Khi team > 1 người, cần biết KH nào ưu tiên xử lý trước và ai đang phụ trách. Tag system giúp sales team làm việc hiệu quả hơn gấp nhiều lần
- **Scope dự kiến:**
  - Tags: Auto-tag (dựa trên hành vi) + manual tag
  - Conversation status: Enum trạng thái hội thoại
  - Multi-seat: TenantMember roles (owner/admin/agent), phân công hội thoại
- **Trạng thái:** ❌ Chưa bắt đầu

---

## Ghi chú

- Các feature này được xác định từ phân tích đối thủ, chưa qua đánh giá effort/feasibility chi tiết
- Cần `/plan` riêng cho từng feature trước khi triển khai
- Thứ tự ưu tiên có thể thay đổi tùy theo chiến lược kinh doanh và feedback từ khách hàng thực tế
