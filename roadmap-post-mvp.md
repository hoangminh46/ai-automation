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

## 🅲️ Hướng 3: Monetization (Kiếm tiền)

### 8. Usage Tracking Dashboard
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

### 9. Billing & Plans
> Free/Pro/Enterprise tiers, Stripe integration

**BE:**
- [ ] Plan model: free (100 msg/month), pro (5000 msg), enterprise (unlimited)
- [ ] Stripe webhook: subscription created/updated/cancelled
- [ ] Billing API: current plan, upgrade, downgrade, invoice history
- [ ] Quota enforcement based on plan tier

**FE:**
- [ ] /dashboard/billing page
- [ ] Plan comparison table
- [ ] Stripe Checkout redirect
- [ ] Invoice history table
- [ ] Upgrade CTA khi hết quota

**Effort:** BE 3 ngày, FE 2 ngày | **Giá trị:** ⭐⭐⭐ Kiếm tiền

---

### 10. Landing Page
> Giới thiệu sản phẩm, pricing, CTA đăng ký

**FE only (có thể tách repo):**
- [ ] Hero section: headline + demo video/screenshot
- [ ] Features grid: 4-6 key features với icons
- [ ] Pricing table: 3 tiers
- [ ] Testimonials / Social proof
- [ ] CTA → /login (đăng ký)
- [ ] SEO optimized, responsive, dark mode

**Effort:** FE 2 ngày | **Giá trị:** ⭐⭐⭐ Marketing & conversion

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

## Known Technical Debt
- [ ] Encrypt FB access token AES-256 (plain text hiện tại)
- [ ] Redis SET dedup khi multi-instance
- [ ] @socket.io/redis-adapter khi horizontal scaling
- [ ] Deployment README + CI/CD pipeline
- [ ] E2E test full flow (khi product ổn định)
