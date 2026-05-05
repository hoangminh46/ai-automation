# Roadmap: AI Chatbot — Post-MVP Features
Created: 2026-04-24 | Status: 📋 Backlog

## Context
BE Module hoàn thành 11/11 phases. FE Sprint 1-5 done.
MVP core: Seller đăng ký → upload knowledge → kết nối FB → chatbot hoạt động → CRM real-time.

---

## 🅰️ Hướng 1: Mở rộng kênh (Revenue)

### 1. Website Chat Widget
> Snippet JS nhúng vào web seller — không phụ thuộc FB App Review

**BE:**
- [ ] WebWidgetAdapter (tương tự FacebookAdapter)
- [ ] Widget authentication: anonymous visitor + session ID
- [ ] REST endpoint `POST /widget/:tenantSlug/chat` (public, rate limited)
- [ ] CORS cho phép origin của seller

**FE:**
- [ ] Widget iframe / standalone JS bundle (React build riêng)
- [ ] Chat bubble UI (floating button → expand chat window)
- [ ] Seller dashboard: copy embed snippet code
- [ ] Customization: màu sắc, greeting, vị trí bubble

**Effort:** BE 3 ngày, FE 2 ngày | **Giá trị:** ⭐⭐⭐ Cao — seller nào cũng có web

---

### 2. Zalo OA Channel
> Tương tự FB adapter, dùng Zalo OA API

**BE:**
- [ ] ZaloAdapter (normalize incoming + sendReply)
- [ ] Webhook endpoint `POST /webhook/zalo`
- [ ] Zalo OA token management
- [ ] Message routing: OA ID → tenant → agent → pipeline

**FE:**
- [ ] Channel management page: thêm tab Zalo
- [ ] Connect/disconnect Zalo OA flow
- [ ] Setup guide cho Zalo OA

**Effort:** BE 2 ngày, FE 1 ngày | **Giá trị:** ⭐⭐⭐ Cao — thị trường VN

---

### 3. Instagram DM
> Meta API tương tự Facebook Messenger

**BE:**
- [ ] InstagramAdapter (reuse Facebook Graph API pattern)
- [ ] Webhook shared hoặc riêng cho IG
- [ ] Media handling (IG hay gửi ảnh/story reply)

**FE:**
- [ ] Channel management: thêm tab Instagram

**Effort:** BE 1 ngày, FE 0.5 ngày | **Giá trị:** ⭐⭐ Trung bình

---

## 🅱️ Hướng 2: Nâng cấp trải nghiệm (Retention)

### 4. Streaming Response
> Bot trả lời từng chữ thay vì đợi toàn bộ — UX "wow"

**BE:**
- [ ] LlmService: switch sang streaming mode (OpenAI SDK `stream: true`)
- [ ] SSE endpoint hoặc WebSocket event `message_chunk`
- [ ] Token counting vẫn chính xác sau stream kết thúc

**FE:**
- [ ] ChatWindow: render từng chunk khi nhận (typing effect)
- [ ] Typing indicator chuyển thành streaming text
- [ ] Cancel button khi đang stream

**Effort:** BE 1 ngày, FE 1 ngày | **Giá trị:** ⭐⭐⭐ Cao — UX improvement lớn

---

### 5. Dashboard Analytics
> Thống kê conversations, response time, satisfaction

**BE:**
- [ ] Analytics endpoints: conversation count, avg response time, messages/day
- [ ] Aggregate queries (GROUP BY date, status)
- [ ] Cache results (5 phút TTL)

**FE:**
- [ ] /dashboard/analytics page
- [ ] Chart components (line chart conversations/day, bar chart by status)
- [ ] KPI cards: total conversations, avg response time, resolution rate
- [ ] Date range filter (7d / 30d / custom)

**Effort:** BE 1 ngày, FE 2 ngày | **Giá trị:** ⭐⭐⭐ Cao — seller cần data

---

### 6. Multi-Agent Strategy
> Seller tạo nhiều bot chuyên biệt (bán hàng, hỗ trợ, FAQ)

**Infra đã sẵn sàng** — Agent CRUD, per-agent persona, per-agent knowledge.

**Cần thêm:**
- [ ] Agent routing logic: intent detection → chọn agent phù hợp
- [ ] FE: Agent selector trong channel config (FB page gắn với agent nào?)
- [ ] FE: Agent performance comparison trong analytics

**Effort:** BE 2 ngày, FE 1 ngày | **Giá trị:** ⭐⭐ Trung bình

---

### 7. Notification System
> Sound/badge khi có tin nhắn mới ở conversation không đang xem

**FE only:**
- [ ] Browser notification permission request
- [ ] Sound effect khi nhận WS `new_message` (conversation khác đang xem)
- [ ] Badge count trên sidebar "Live Chat" menu item
- [ ] Favicon badge (unread count)
- [ ] Tab title flash: "(3) Tin nhắn mới — AI Chatbot"

**Effort:** FE 0.5 ngày | **Giá trị:** ⭐⭐ Thấp nhưng cải thiện UX đáng kể

---

### 8. Bám đuổi khách hàng (AI Follow-up / Retargeting)
> Tự động nhắn tin lại cho khách hàng sau một khoảng thời gian im lặng để chốt đơn (Tuân thủ luật 24h của Facebook).

**BE:**
- [ ] Cronjob quét các hội thoại trạng thái OPEN mà tin nhắn cuối là của Bot (> 2h).
- [ ] LlmService: Dùng context lịch sử để tạo câu nhắc khéo cá nhân hóa (Proactive message).
- [ ] Gửi tự động qua Facebook API và lưu DB.

**FE (Giao diện cấu hình Bám đuổi):**
- [ ] Màn hình Settings riêng biệt cho tính năng Bám đuổi (Retargeting).
- [ ] Công tắc On/Off tính năng.
- [ ] Timeline Builder đơn giản: Cho phép shop thêm các mốc thời gian (VD: Gửi tin nhắn 1 sau 2 giờ, Tin nhắn 2 sau 23 giờ).
- [ ] Custom Prompt Input: Ô nhập liệu để shop chỉ định "Kịch bản nhắc khéo" cho AI (VD: "Báo khách là kho chỉ còn 1 cái", "Tặng mã giảm 10%").
- [ ] UI Lock: Toàn bộ màn hình này sẽ bị làm mờ (grayed out) và có ổ khóa nếu user chưa đăng ký gói Premium, kèm nút CTA "Nâng cấp gói để mở khóa".

**Effort:** BE 2 ngày, FE 2 ngày | **Giá trị:** ⭐⭐⭐ Cao — tăng tỷ lệ chuyển đổi cho shop

---

### 9. Hỗ trợ đa phương thức (Multimodal: Ảnh & Voice)
> Nhận diện và xử lý tin nhắn hình ảnh, âm thanh từ khách hàng (Sử dụng Gemini Vision & Audio).

**BE:**
- [ ] Facebook/Zalo Adapter: Bắt sự kiện tin nhắn có chứa file đính kèm (image/audio).
- [ ] Download media buffer và truyền định dạng base64/buffer vào OpenAI SDK cho Gemini.
- [ ] Prompt Tuning: Hướng dẫn AI cách phân tích ảnh (VD: khách gửi ảnh cái áo, AI quét trong Knowledge Base tìm mẫu tương tự và báo giá).

**FE:**
- [ ] ChatWindow: Hiển thị được hình ảnh và audio player thay vì chỉ hiện text.
- [ ] Settings: Công tắc bật/tắt tính năng Multimodal cho từng Agent (để shop tiết kiệm token nếu không cần).

**Effort:** BE 3 ngày, FE 1 ngày | **Giá trị:** ⭐⭐⭐ Rất Cao — Cực kỳ phù hợp cho shop thời trang/phụ kiện.

---

## 🅲️ Hướng 3: Monetization (Kiếm tiền)

### 10. Usage Tracking Dashboard
> Hiển thị token/message đã dùng — tiền đề cho billing

**BE:**
- [ ] Aggregate endpoint: tokens used, messages sent, by period
- [ ] Quota check middleware (soft limit → warning, hard limit → block)

**FE:**
- [ ] /dashboard/usage page
- [ ] Progress bars: messages used / limit, tokens used / limit
- [ ] Usage trend chart (daily)
- [ ] Warning banner khi gần hết quota

**Effort:** BE 0.5 ngày, FE 1 ngày | **Giá trị:** ⭐⭐⭐ Cần cho billing

---

### 11. Billing & Plans
> 4 Tiers: Free (7-day trial), Basic, Standard, Premium. Tích hợp thanh toán online.

**BE:**
- [ ] Plan model: 
  - Free: 0đ (Trial 7 ngày kể từ lúc đăng ký, max 300 msg). Sau 7 ngày tự động lock tính năng AI.
  - Basic: ~299k (3.000 msg, 3 bots).
  - Standard: ~599k (8.000 msg, 5 bots).
  - Premium: ~1.199k (20.000 msg, 10 bots, mở khóa tích hợp ERP/API).
- [ ] Job kiểm tra hết hạn trial (Cronjob chạy mỗi ngày hoặc check lúc user gọi API).
- [ ] Stripe/VNPay webhook: subscription created/updated/cancelled
- [ ] Billing API: current plan, trial status, upgrade, downgrade, invoice history
- [ ] Quota enforcement (Message limit & Trial expire date) based on plan tier

**FE:**
- [ ] /dashboard/billing page
- [ ] Plan comparison table
- [ ] Stripe Checkout redirect
- [ ] Invoice history table
- [ ] Upgrade CTA khi hết quota

**Effort:** BE 3 ngày, FE 2 ngày | **Giá trị:** ⭐⭐⭐ Kiếm tiền

---

### 12. Landing Page
> Tối ưu hóa SEO, Tỷ lệ chuyển đổi (Conversion Rate) và Kiến trúc SaaS.

**Kiến trúc hệ thống (Mô hình Subdomain chuyên nghiệp):**
- **Tách biệt hoàn toàn Landing Page và Web App:**
  - **Landing Page (Trang Marketing):** Chạy trên tên miền chính (VD: `aichatbot.vn`). Xây dựng thành một dự án độc lập (Static HTML/Next.js/Webflow) để tối ưu 100% tốc độ tải trang và SEO. Đội Marketing có thể dễ dàng quản trị riêng.
  - **Web App (Hệ thống Dashboard hiện tại):** Triển khai trên tên miền phụ (VD: `app.aichatbot.vn`). Không tốn thêm chi phí, tạo subdomain miễn phí trên DNS/Vercel.
- **Flow Đăng nhập/Đăng ký:**
  - Các nút CTA trên Landing Page sẽ là external link trỏ thẳng sang Web App.
  - Nút [Đăng nhập] -> `<a href="https://app.aichatbot.vn/login">`
  - Nút [Dùng thử miễn phí] -> `<a href="https://app.aichatbot.vn/register">`.

**Cấu trúc nội dung Landing Page (7 Blocks):**
- [ ] **1. Hero Section:** Headline đánh vào nỗi đau ("Tự động chốt đơn 24/7"), Sub-headline giải thích RAG AI, 2 Nút CTA (Dùng thử miễn phí / Xem Demo video).
- [ ] **2. Lợi ích & Tính năng lõi (Zic-zac layout):** Nêu bật tính năng Đa kênh (FB, Zalo), Tự động học từ PDF, và Bám đuổi khách hàng 24h.
- [ ] **3. How it works (3 Bước đơn giản):** Đăng ký -> Upload tài liệu -> AI tự động chat.
- [ ] **4. Bảng giá (Pricing):** Trình bày 4 gói (Free Trial, Basic, Standard, Premium). Làm nổi bật gói Standard.
- [ ] **5. Social Proof:** Khu vực chuẩn bị sẵn cho Testimonials và Logo khách hàng/đối tác.
- [ ] **6. FAQ (Hỏi đáp):** Giải đáp rào cản (AI có nói bậy không? Bảo mật dữ liệu không?).
- [ ] **7. Final CTA:** Lời kêu gọi cuối cùng ở chân trang, trỏ về `/register`.

**Effort:** FE 3 ngày | **Giá trị:** ⭐⭐⭐ Cực kỳ quan trọng để Marketing & Chốt sale

---

## 📋 Đề xuất thứ tự ưu tiên

```
Nếu mục tiêu "ra sản phẩm MVP nhanh":
  1. Website Chat Widget        ← Không phụ thuộc FB App Review
  2. Streaming Response          ← UX wow, effort nhỏ  
  3. Dashboard Analytics         ← Seller thấy giá trị

Nếu mục tiêu "kiếm tiền sớm":
  1. Usage Tracking              ← Tiền đề billing
  2. Billing & Plans             ← Thu phí
  3. Landing Page                ← Marketing

Nếu mục tiêu "phủ thị trường VN":
  1. Zalo OA Channel             ← 80% user VN dùng Zalo
  2. Website Chat Widget         ← Universal
  3. Instagram DM                ← Gen Z
```

---

## Known Technical Debt & Scaling
- [ ] **Chạy Multi-instance & Load Balancer**: Thiết lập chạy nhiều bản sao Backend song song để tăng sức chịu tải (High Traffic) và đảm bảo tính sẵn sàng cao (High Availability).
- [ ] **Sử dụng Redis để Dedup tin nhắn**: Dùng Redis làm bộ nhớ chung khử trùng lặp webhook từ FB/Zalo, tránh bot trả lời 2 lần khi chạy multi-instance.
- [ ] **Sử dụng @socket.io/redis-adapter**: Làm trạm trung chuyển (broadcaster) cho Socket.io, giúp nhân viên nhận tin nhắn real-time chính xác dù server nào nhận được webhook.
- [ ] Encrypt FB access token AES-256 (plain text hiện tại)
- [ ] Deployment README + CI/CD pipeline
- [ ] E2E test full flow (khi product ổn định)
