# Plan: Landing Page UI — AI Chatbot

Created: 2026-05-13T08:35
Status: ✅ Complete
Spec: [roadmap-post-mvp.md#12](../../docs/roadmap-post-mvp.md) | [feature-gaps-preny.md](../../docs/feature-gaps-preny.md)

## Overview

Xây dựng giao diện Landing Page hoàn chỉnh cho `aichatbot.vn` trên nền Astro base code đã setup. Landing page cần đạt 3 mục tiêu: **SEO ranking** (Google top 10 cho "ai chatbot shop online"), **Conversion Rate** (>5% click CTA), và **Brand Trust** (cảm giác premium, đáng tin cậy).

## Goal

- Giao diện đẹp, chuyên nghiệp, mobile-first
- 7 content sections theo roadmap đã định nghĩa
- Tối ưu Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- Nội dung tiếng Việt, SEO keywords targeting
- Mọi CTA trỏ đúng sang `app.aichatbot.vn`

## Scope

### In Scope
- 7 sections: Hero, Features, How it Works, Pricing, Social Proof, FAQ, Final CTA
- Header + Footer polish
- Responsive (mobile, tablet, desktop)
- Animations & micro-interactions
- SEO structured data (FAQPage schema)

### Out of Scope
- Blog section, Interactive demo widget, A/B testing, Multi-language, Domain setup

## Content Strategy

### SEO Keywords Target
- Primary: "ai chatbot shop online", "chatbot bán hàng tự động"
- Secondary: "chatbot facebook messenger", "chatbot zalo", "tự động trả lời khách hàng"

### Messaging Framework
- **Pain:** Shop CSKH 24/7 bằng tay → bỏ lỡ đơn, tốn nhân sự
- **Solution:** AI Chatbot học từ tài liệu, trả lời chính xác trên FB + Zalo
- **Proof:** 80% tiết kiệm thời gian, 100+ shop đang dùng
- **CTA:** Dùng thử miễn phí, không cần thẻ tín dụng

## Acceptance Criteria

- [ ] 7 sections đầy đủ nội dung tiếng Việt (không placeholder)
- [ ] Mobile responsive (320px - 1440px+)
- [ ] Scroll reveal animations trên mỗi section
- [ ] Pricing khớp chính xác với bảng giá trong docs
- [ ] FAQ accordion interactive (React component)
- [ ] JSON-LD FAQPage schema
- [ ] Build production 0 errors
- [ ] OG Image 1200x630

---

## Master Task Tracker

| Phase | Task | Status | File(s) |
|:-----:|------|:------:|---------|
| 01 | 1.1 Data models (consts.ts) | ✅ Done | `consts.ts` |
| 01 | 1.2 Hero section — headline + badge + CTA | ✅ Done | `index.astro` |
| 01 | 1.3 Hero section — chat mockup illustration | ✅ Done | `index.astro` |
| 01 | 1.4 Hero section — platform badges + stats row | ✅ Done | `index.astro` |
| 02 | 2.1 FeatureCard component | ✅ Done | `FeatureCard.astro` |
| 02 | 2.2 Features section layout + grid | ✅ Done | `index.astro` |
| 03 | 3.1 StepCard component | ✅ Done | `StepCard.astro` |
| 03 | 3.2 How It Works section + connector | ✅ Done | `index.astro` |
| 04 | 4.1 PricingCard component | ✅ Done | `PricingCard.astro` |
| 04 | 4.2 Pricing section layout | ✅ Done | `index.astro` |
| 05 | 5.1 Social proof metrics section | ✅ Done | `index.astro` |
| 05 | 5.2 FAQAccordion React component | ✅ Done | `FAQAccordion.tsx` |
| 05 | 5.3 FAQ section + FAQPage JSON-LD | ✅ Done | `index.astro` |
| 06 | 6.1 Final CTA section upgrade | ✅ Done | `index.astro` |
| 06 | 6.2 Footer polish | ✅ Done | `Footer.astro` |
| 06 | 6.3 OG Image generation | ✅ Done | `public/og-image.png` |
| 06 | 6.4 Build + responsive audit | ✅ Done | - |

---

## Phase 01: Hero Section — Premium Redesign

> Mục tiêu: Hero gây ấn tượng mạnh, product mockup, social proof ngay từ above-the-fold.

### Task 1.1: Data models ✅ Done
- **File:** `src/consts.ts`
- **Nội dung:** Đã thêm STATS, FEATURES, STEPS, PLANS, FAQS, CHANNELS
- **Verify:** Pricing khớp với docs ✅

### Task 1.2: Hero — Headline + Badge + CTA
- **File:** `src/pages/index.astro` (Hero section)
- **Làm gì:**
  - Giữ headline + sub-headline hiện tại (đã tối ưu keywords)
  - Cải thiện badge styling (thêm gradient border)
  - Đổi layout thành 2 columns: text trái + mockup phải (desktop)
  - Mobile: stack vertical, text trên mockup dưới
- **Output:** Hero section có layout 2 cột responsive

### Task 1.3: Hero — Chat Mockup Illustration
- **File:** `src/pages/index.astro` (bên trong Hero)
- **Làm gì:**
  - Tạo static chat mockup bằng HTML/CSS (không dùng image)
  - Mockup hiển thị: bubble khách hỏi + bubble bot trả lời
  - Floating animation nhẹ (animate-float)
  - Shadow + rounded corners tạo cảm giác device
- **Output:** Chat mockup illustration bên phải Hero

### Task 1.4: Hero — Platform Badges + Stats Row
- **File:** `src/pages/index.astro` (dưới CTA buttons)
- **Làm gì:**
  - Thay gradient circles bằng 3 platform icons (Facebook, Zalo, Globe)
  - Thêm text "Hỗ trợ trên" + 3 badges
  - Stats row: 3 cột metrics từ `STATS` const
  - Divider lines giữa các stats
- **Output:** Platform badges + 3 số liệu thống kê

### ✅ Checkpoint Phase 01:
- [ ] Hero 2-column layout (text + mockup)
- [ ] Chat mockup illustration hiển thị
- [ ] Platform badges (FB, Zalo, Web)
- [ ] Stats row (100+, 50K+, 99.9%)
- [ ] Mobile responsive stack

---

## Phase 02: Features Section — 6 Feature Cards

> Mục tiêu: Grid 6 cards với SVG icons, hover effects, reveal animation.

### Task 2.1: FeatureCard Component
- **File:** `src/components/FeatureCard.astro`
- **Làm gì:**
  - Props: `icon`, `title`, `description`
  - Layout: icon circle top + title + description
  - SVG icons inline (switch/case theo icon name)
  - Hover: lift shadow + scale nhẹ
  - Border subtle + rounded-2xl
- **Output:** Reusable FeatureCard component

### Task 2.2: Features Section Layout
- **File:** `src/pages/index.astro` (thay placeholder Features)
- **Làm gì:**
  - Section header: label "Tính năng" + h2 "Tất cả công cụ bạn cần để bán hàng hiệu quả hơn"
  - Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  - Map `FEATURES` array → `<FeatureCard />` components
  - Mỗi card có class `reveal` cho scroll animation
  - Staggered animation delay (0.1s increment)
- **Output:** 6 cards grid, responsive, animated

### ✅ Checkpoint Phase 02:
- [ ] FeatureCard component hoạt động
- [ ] 6 cards hiển thị đúng nội dung
- [ ] Grid responsive: 1 col → 2 col → 3 col
- [ ] Hover effects + reveal animations

---

## Phase 03: How It Works — 3-Step Visual Flow

> Mục tiêu: 3 bước đơn giản, connecting line, CTA button cuối.

### Task 3.1: StepCard Component
- **File:** `src/components/StepCard.astro`
- **Làm gì:**
  - Props: `number`, `title`, `description`, `icon`
  - Layout: number circle (gradient) + icon + title + description
  - Number circle: w-12 h-12, gradient bg, bold white text
  - SVG icons cho user-plus, upload, message-circle
- **Output:** Reusable StepCard component

### Task 3.2: How It Works Section
- **File:** `src/pages/index.astro` (thay placeholder How it works)
- **Làm gì:**
  - Section header: label "Cách hoạt động" + h2 "3 bước đơn giản"
  - 3 cards horizontal desktop, vertical mobile
  - Connecting dotted line/arrow SVG giữa các bước (desktop only)
  - CTA button cuối: "Bắt đầu ngay — chỉ mất 2 phút"
  - `reveal` class cho animation
- **Output:** 3-step flow with visual connectors

### ✅ Checkpoint Phase 03:
- [ ] StepCard component hoạt động
- [ ] 3 bước hiển thị đúng thứ tự
- [ ] Connecting line (desktop) / vertical (mobile)
- [ ] CTA button cuối section

---

## Phase 04: Pricing Section — 4-Tier Table

> Mục tiêu: 4 pricing cards, Standard highlighted, feature checklist.

### Task 4.1: PricingCard Component
- **File:** `src/components/PricingCard.astro`
- **Làm gì:**
  - Props: plan object (name, price, period, features, highlighted, cta)
  - Layout: header (name + description) + price + feature list + CTA button
  - Highlighted variant: gradient border, "Phổ biến nhất" badge, scale nhẹ
  - Feature list: check icon (green) hoặc x icon (red) theo `included`
  - CTA button: primary style cho highlighted, outline cho others
- **Output:** Reusable PricingCard component

### Task 4.2: Pricing Section Layout
- **File:** `src/pages/index.astro` (thay placeholder Pricing)
- **Làm gì:**
  - Section header: label "Bảng giá" + h2 "Gói phù hợp cho mọi quy mô"
  - Sub-text: "Tất cả gói đều kết nối unlimited kênh. Nâng/hạ gói bất kỳ lúc nào."
  - Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
  - Map `PLANS` array → `<PricingCard />` components
  - Standard card z-10 + scale-105 trên desktop
- **Output:** 4 pricing cards, Standard nổi bật

### ✅ Checkpoint Phase 04:
- [ ] PricingCard component (normal + highlighted)
- [ ] 4 cards hiển thị đúng data từ docs
- [ ] Standard card nổi bật (badge + border + scale)
- [ ] Feature checklist ✓/✗ icons
- [ ] Mobile stacking responsive

---

## Phase 05: Social Proof + FAQ Accordion

> Mục tiêu: Trust metrics + FAQ interactive accordion (React).

### Task 5.1: Social Proof Metrics Section
- **File:** `src/pages/index.astro` (section mới giữa Pricing và FAQ)
- **Làm gì:**
  - Background gradient (primary-600 → primary-800)
  - 3 metrics columns: "50% tăng tỷ lệ chốt đơn", "80% tiết kiệm CSKH", "2 phút setup"
  - Large bold number + description text white
  - Responsive: 3 col desktop, stack mobile
- **Output:** Trust metrics band section

### Task 5.2: FAQAccordion React Component
- **File:** `src/components/FAQAccordion.tsx`
- **Làm gì:**
  - Props: `items: Array<{question, answer}>`
  - Accordion behavior: click to open/close, only 1 open at a time
  - Animation: smooth height transition (max-height trick hoặc grid-rows)
  - Chevron icon rotate on open
  - Styling: border-b dividers, hover highlight
  - Hydration: `client:visible` (chỉ load JS khi user scroll tới)
- **Output:** Interactive FAQ accordion React component

### Task 5.3: FAQ Section + FAQPage JSON-LD
- **File:** `src/pages/index.astro` (thay placeholder FAQ)
- **Làm gì:**
  - Section header: label "FAQ" + h2 "Câu hỏi thường gặp"
  - Import + render `<FAQAccordion client:visible items={FAQS} />`
  - Thêm `<script type="application/ld+json">` FAQPage schema
  - Max-width container cho readability
- **Output:** FAQ section interactive + SEO schema

### ✅ Checkpoint Phase 05:
- [ ] Social proof metrics hiển thị 3 số liệu
- [ ] FAQAccordion mở/đóng smooth
- [ ] Chỉ 1 FAQ mở tại 1 thời điểm
- [ ] FAQPage JSON-LD valid
- [ ] `client:visible` hydration (check zero JS trước scroll)

---

## Phase 06: Final CTA + Polish + OG Image

> Mục tiêu: Hoàn thiện, responsive audit, production build.

### Task 6.1: Final CTA Section Upgrade
- **File:** `src/pages/index.astro` (Final CTA section)
- **Làm gì:**
  - Cải thiện visual: thêm 3 mini-feature icons dưới text
  - "✓ Miễn phí dùng thử", "✓ Không cần thẻ tín dụng", "✓ Setup 2 phút"
  - Gradient background polish
- **Output:** Final CTA section premium hơn

### Task 6.2: Footer Polish
- **File:** `src/components/Footer.astro`
- **Làm gì:**
  - Thêm column "Liên hệ" (email, phone placeholder)
  - Social media icons (Facebook, placeholder)
  - Verify tất cả links hoạt động
- **Output:** Footer hoàn chỉnh

### Task 6.3: OG Image Generation
- **File:** `public/og-image.png`
- **Làm gì:**
  - Generate image 1200x630 chứa: logo + tagline + gradient bg
  - Copy vào public/
- **Output:** OG Image cho social sharing

### Task 6.4: Build + Responsive Audit
- **Làm gì:**
  - `npm run build` — verify 0 errors
  - Test responsive: 375px, 768px, 1024px, 1440px
  - Check Lighthouse score > 90
  - Verify all JSON-LD schemas valid
- **Output:** Production-ready build ✅

### ✅ Checkpoint Phase 06 (Final):
- [ ] Final CTA có mini-feature list
- [ ] Footer có contact info + social
- [ ] OG Image 1200x630 tồn tại
- [ ] Build 0 errors
- [ ] Responsive ok trên 4 breakpoints

---

## Design References

### Tone & Style:
- **Clean, modern, trustworthy** — Như Intercom, Crisp, Tidio
- **Color:** Primary blue (#2563eb) + Accent violet (#8b5cf6) + Dark surface (#0f172a)
- **Typography:** Inter font, bold headlines, relaxed body text
- **Animations:** Subtle fade-up reveals, hover lifts, gradient shifts

### Competitor Insights (Preny.ai):
- Multi-channel badges prominent
- Interactive demo trên hero (dùng mockup thay)
- Pricing đơn giản, highlight gói giữa
- FAQ giải quyết rào cản tin tưởng AI
