# 🚀 Kế Hoạch Hành Động — AI Commerce Suite

> **Ngày tạo:** 13/04/2026  
> **Trạng thái:** PLANNING  
> **Mục tiêu:** Xây dựng platform All-in-one AI cho Seller TMĐT Việt Nam

---

## 1. Tầm Nhìn Sản Phẩm

### 1.1 One-liner
> **AI Commerce Suite** — Platform AI giúp seller TMĐT Việt Nam tạo content tự động và chốt đơn 24/7.

### 1.2 Vấn đề giải quyết
Seller TMĐT Việt Nam đang đối mặt với 2 "nỗi đau" lớn:

| Nỗi đau | Hiện trạng | Giải pháp |
|---|---|---|
| **Content crisis** | Cần hàng chục video/ngày để thuật toán TikTok, Shopee đẩy sản phẩm. Quay thủ công tốn thời gian & tiền. | 🎥 AI Video: Tạo video từ ảnh sản phẩm trong vài phút |
| **Trả lời chat 24/7** | Khách nhắn tin lúc 2h sáng, không ai trả lời → mất đơn. Thuê nhân viên trực đắt đỏ. | 🤖 AI Chatbot: Tư vấn + chốt đơn tự động, không nghỉ |

### 1.3 Đối tượng khách hàng (ICP)

**Primary:** Seller trên Shopee / TikTok Shop
- Doanh thu 20-500 triệu/tháng
- 1-10 nhân viên
- Bán hàng đa kênh (sàn + Facebook + Zalo)
- Đau đớn nhất: thiếu content + mất đơn do trả lời chậm

**Secondary:** Agency marketing / Digital marketing freelancer
- Quản lý 5-50 fanpage/shop
- Cần tool tự động hóa cho nhiều khách

---

## 2. Chiến Lược Go-to-Market

### 2.1 Pricing (đề xuất)

| Gói | Chatbot | Video | Giá/tháng |
|---|---|---|---|
| **Free** | 100 tin nhắn | 3 video | 0đ |
| **Starter** | 2,000 tin | 20 video | 299,000đ |
| **Growth** | 10,000 tin | 100 video | 799,000đ |
| **Pro** | 50,000 tin | 500 video | 1,999,000đ |
| **Enterprise** | Unlimited | Unlimited | Liên hệ |

### 2.2 Khác biệt vs đối thủ

| Đối thủ làm | Mình làm khác |
|---|---|
| Giá không công khai | ✅ Pricing minh bạch trên website |
| Thanh toán 12 tháng | ✅ Thanh toán tháng, hủy bất kỳ lúc nào |
| Cần liên hệ setup | ✅ Self-serve: đăng ký → hoạt động 5 phút |
| Chỉ có Chatbot HOẶC Video | ✅ CẢ HAI trong 1 platform |
| Tích hợp ít (KiotViet, WC) | ✅ Shopee + TikTok Shop + Lazada + Haravan |
| Charge theo tin nhắn | ✅ Option charge theo đơn chốt thành công |

### 2.3 Kênh tiếp cận khách hàng

| Kênh | Chi tiết | Chi phí |
|---|---|---|
| **Facebook Groups** | Các group Shopee seller, TikTok Shop seller | Free |
| **TikTok organic** | Demo video "before/after" dùng AI | Free |
| **Affiliate** | Cho seller giới thiệu → nhận hoa hồng | Performance-based |
| **SEO/Blog** | Content về tips bán hàng + AI cho seller | Free (thời gian) |
| **Cold DM** | Nhắn tin trực tiếp cho seller trên Shopee/TikTok | Free |

---

## 3. Tech Stack Đề Xuất

### 3.1 Frontend
```
Framework:    Next.js 15 (App Router)
Language:     TypeScript
Styling:      Tailwind CSS
UI Library:   shadcn/ui
State:        Zustand
```

### 3.2 Backend
```
Runtime:      Node.js (NestJS) hoặc Python (FastAPI)
Database:     PostgreSQL (Supabase)
Cache:        Redis
Queue:        BullMQ (cho video processing)
Storage:      AWS S3 / Cloudflare R2
```

### 3.3 AI & Integrations
```
LLM:          OpenAI GPT-4o (chính) + Claude (backup)
              → Model routing: query đơn giản → GPT-4o-mini (rẻ)
              → Query phức tạp → GPT-4o hoặc Claude
Video AI:     Replicate / RunwayML / Kling API
Voice:        ElevenLabs (tiếng Việt)
Messaging:    Facebook Graph API, Zalo OA API
E-commerce:   Shopee Open API, TikTok Shop API
Payment:      VNPay / MoMo / Stripe
```

### 3.4 Infrastructure
```
Hosting:      Vercel (FE) + Railway/Fly.io (BE)
CI/CD:        GitHub Actions
Monitoring:   Sentry + Uptime Robot
Analytics:    Mixpanel / PostHog
```

---

## 4. Lộ Trình Chi Tiết

### Phase 1: AI Chatbot MVP (Tháng 1–4)

#### Tháng 1: Foundation
- [ ] Setup project (Next.js + NestJS + Supabase)
- [ ] Auth system (đăng ký/đăng nhập)
- [ ] Tích hợp OpenAI API cho hội thoại
- [ ] Knowledge Base: upload text → AI học
- [ ] Widget chatbot embed vào website

#### Tháng 2: Đa kênh
- [ ] Tích hợp Facebook Messenger API
- [ ] Tích hợp Zalo OA API
- [ ] Dashboard quản lý hội thoại
- [ ] Chuyển tiếp AI ↔ Nhân viên (Handoff)
- [ ] **Goal: 5 khách beta (free)**

#### Tháng 3: E-commerce Integration
- [ ] Tích hợp Shopee chat (nếu API cho phép)
- [ ] Knowledge Base: upload PDF, DOCX
- [ ] Auto-crawl website lấy data sản phẩm
- [ ] Follow-up tự động (nhắc khách chưa chốt)
- [ ] Landing page + pricing page
- [ ] **Goal: 10 khách, 5 trả tiền**

#### Tháng 4: Analytics & Polish
- [ ] Dashboard analytics (số hội thoại, tỷ lệ chốt)
- [ ] Thông báo đơn hàng mới qua Telegram
- [ ] Onboarding flow tự phục vụ
- [ ] Payment integration (VNPay)
- [ ] **Goal: 20 khách, 10-15 trả tiền**

**💰 KPI Phase 1:** 10-30 triệu VND/tháng recurring

---

### Phase 2: AI Video MVP (Tháng 5–8)

#### Tháng 5: Video Generation Basic
- [ ] Upload ảnh sản phẩm → Video slideshow với AI
- [ ] Chọn template (review, unboxing, so sánh)
- [ ] AI script generation từ mô tả sản phẩm

#### Tháng 6: AI Voiceover & Enhancement
- [ ] Text-to-Speech tiếng Việt (ElevenLabs)
- [ ] Background music library
- [ ] Auto subtitle/caption
- [ ] **Goal: 10 khách beta video**

#### Tháng 7: Bulk & Templates
- [ ] Bulk generation (nhiều video cùng lúc)
- [ ] Template marketplace
- [ ] Tích hợp vào platform chung với Chatbot

#### Tháng 8: Distribution
- [ ] Auto-post TikTok / Facebook Reels
- [ ] Scheduling (lên lịch đăng bài)
- [ ] **Goal: 30 khách video**

**💰 KPI Phase 2:** 30-60 triệu VND/tháng

---

### Phase 3: AI Commerce Suite (Tháng 9–12)

#### Tháng 9: Unified Platform
- [ ] Gộp Chatbot + Video vào 1 dashboard
- [ ] Cross-feature: video sản phẩm → chatbot auto gửi

#### Tháng 10: Smart Analytics
- [ ] ROI tracking cho seller (đo doanh thu tăng)
- [ ] AI insights (sản phẩm nào bán tốt, khách hỏi gì nhiều)

#### Tháng 11: Advanced Monetization
- [ ] Outcome-based pricing option
- [ ] Whitelabel cho agency
- [ ] API cho third-party integration

#### Tháng 12: Scale
- [ ] Partnership program
- [ ] Agency reseller model
- [ ] **Goal: 100+ khách**

**💰 KPI Phase 3:** 50-150 triệu VND/tháng

---

## 5. Ước Tính Chi Phí Vận Hành

| Hạng mục | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| AI API (OpenAI/Claude) | $50-200 | $200-500 | $500-2000 |
| Video AI API | — | $100-500 | $300-1000 |
| Hosting (Vercel+BE+DB) | $20-50 | $50-100 | $100-300 |
| Storage (S3/R2) | $5 | $20-50 | $50-200 |
| Domain + SSL | $1 | $1 | $1 |
| **Tổng/tháng** | **$76-256** | **$371-1151** | **$951-3501** |
| **Tổng (VND)** | **~2-6tr** | **~9-29tr** | **~24-88tr** |

---

## 6. Metrics Theo Dõi

### Business Metrics
- [ ] MRR (Monthly Recurring Revenue)
- [ ] Số khách trả tiền (Paying Customers)
- [ ] ARPU (Average Revenue Per User)
- [ ] Churn Rate (% khách rời)
- [ ] CAC (Chi phí kiếm 1 khách)
- [ ] LTV (Lifetime Value)

### Product Metrics
- [ ] DAU/MAU (Daily/Monthly Active Users)
- [ ] Automation Rate (% hội thoại AI tự xử lý)
- [ ] Video generation count
- [ ] Time to first value (bao lâu từ đăng ký → hoạt động)

---

## 7. Rủi Ro & Giảm Thiểu

| Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|
| Platform (FB/Zalo) thay đổi API | Cao | Đa kênh, không phụ thuộc 1 platform |
| TikTok tự build AI Video | Trung bình | Tích hợp sâu e-commerce (TikTok không làm) |
| Chi phí AI API tăng | Trung bình | Model routing (dùng model rẻ cho task đơn giản) |
| Không đủ khách hàng | Cao | Validate trước khi build, free tier |
| Chất lượng AI không đủ tốt | Trung bình | Human-in-the-loop, cho phép seller can thiệp |

---

## 8. Bước Tiếp Theo Ngay Bây Giờ

### Tuần 1: Validate
- [ ] Liệt kê 20 seller trên Shopee/TikTok Shop để phỏng vấn
- [ ] Soạn kịch bản phỏng vấn (5-10 câu hỏi)
- [ ] Phỏng vấn ít nhất 10 seller
- [ ] Ghi nhận: Họ có sẵn sàng trả tiền? Bao nhiêu? Tính năng nào quan trọng nhất?

### Tuần 2: Landing Page
- [ ] Build landing page giới thiệu sản phẩm
- [ ] Form đăng ký early access / waitlist
- [ ] Đo lường: có bao nhiêu người đăng ký?

### Tuần 3-4: MVP Sprint
- [ ] Nếu validate OK → Bắt đầu build Phase 1, Tháng 1
- [ ] Nếu validate FAIL → Pivot sang ý tưởng khác từ danh sách nghiên cứu

---

*Tài liệu này sẽ được cập nhật liên tục theo tiến độ dự án.*  
*Tạo bởi Mine — 13/04/2026*
