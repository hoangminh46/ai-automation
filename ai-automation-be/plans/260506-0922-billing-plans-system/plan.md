# Plan: Billing Plans System (No Payment)
Created: 2026-05-06
Status: 🟡 In Progress

## Overview
Xây dựng hệ thống quản lý gói cước (Plans) và tracking usage cho AI Chatbot SaaS.
- **Plan per-Seller**: 1 user = 1 subscription, tất cả tenants (shops) dùng chung quota.
- **Data-driven**: Plans lưu DB → CMS quản lý sau.
- **Sprint này KHÔNG bao gồm payment gateway** — upgrade = manual liên hệ.

## Business Rules Đã Chốt

### 1. Plan per-Seller (không per-Tenant)
- Subscription gắn với Seller (user), không gắn Tenant (shop)
- Quota tổng cộng across all tenants: 3 bots = 3 bots TỔNG cho tất cả shops
- AI responses quota dùng chung tất cả shops

### 2. Hết responses → Block + Response Pack
- Bot ngừng trả lời (fallback message)
- Nhân viên vẫn chat tay bình thường (human reply không tốn AI response)
- Seller mua thêm Response Pack (VD: 500 responses = 99k) để tiếp tục
- Response Pack cộng dồn vào `bonusResponsesRemaining`

### 3. Plan hết hạn → Auto-downgrade Free
- Status → EXPIRED, auto-tạo subscription Free mới
- Data KHÔNG bị xóa
- Tài nguyên vượt quota bị deactivate (xem rule 4)

### 4. Hard limit bots/team, Soft limit knowledge
- **Bots**: Deactivate bots vượt quota (isActive=false). Seller chọn bots giữ lại.
- **Team Members**: Deactivate members vượt quota (isActive=false).
- **Knowledge**: Giữ nguyên tất cả files + RAG vẫn hoạt động. Chỉ chặn upload mới.
- Data KHÔNG BAO GIỜ bị xóa.

## Core Entities

### Plan (Gói cước — lưu DB, CMS-ready)
```
plans:
  id                    UUID PK
  slug                  String UNIQUE (free, basic, standard, premium)
  name                  String
  price                 Int (VND/tháng, 0 cho free — giá base monthly)
  maxAiResponses        Int (per month)
  maxBots               Int
  maxTeamMembers        Int (-1 = unlimited)
  maxKnowledgeFiles     Int
  maxKnowledgeSizeMb    Int
  hasBrandingWatermark  Boolean
  displayOrder          Int
  isActive              Boolean
  createdAt, updatedAt
```

### SellerSubscription (1:1 với Seller)
```
seller_subscriptions:
  id                        UUID PK
  sellerId                  String FK → sellers (UNIQUE)
  planId                    String FK → plans
  billingPeriod             MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL
  status                    ACTIVE | EXPIRED | CANCELLED
  aiResponsesUsed           Int (reset monthly)
  bonusResponsesRemaining   Int (từ response packs, không reset)
  currentPeriodStart        DateTime
  currentPeriodEnd          DateTime (null cho Free — không hết hạn)
  createdAt, updatedAt
```

### ResponsePackPurchase (Lịch sử mua gói lẻ)
```
response_pack_purchases:
  id            UUID PK
  sellerId      String FK → sellers
  amount        Int (số responses mua)
  price         Int (VND)
  purchasedAt   DateTime
```

## Quota Check Logic
```
totalAvailable = plan.maxAiResponses - subscription.aiResponsesUsed + subscription.bonusResponsesRemaining

Khi AI response:
  if totalAvailable <= 0 → BLOCK
  if aiResponsesUsed < plan.maxAiResponses → increment aiResponsesUsed
  else → decrement bonusResponsesRemaining

Monthly reset: chỉ reset aiResponsesUsed, KHÔNG reset bonusResponsesRemaining
```

## Phases

| Phase | Name | Status | Progress | Depends On |
|-------|------|--------|----------|------------|
| 01 | DB Schema, Plan Model & Seed | ✅ Done | 100% | - |
| 02 | QuotaService Core (AI Responses) | ✅ Done | 100% | 01 |
| 03 | Resource Limits & Monthly Reset | ✅ Done | 100% | 02 |
| 04 | Branding Injection & REST APIs | ✅ Done | 100% | 02 |
| 05 | Downgrade & Expiry Logic | ✅ Done | 100% | 03, 04 |
| 06 | FE Usage & Billing UI | ✅ Done | 100% | 04 |

## Acceptance Criteria
- [x] Seller mới auto nhận Free plan
- [x] AI response bị block khi hết quota (Free: 50)
- [ ] Mua response pack → bonus cộng dồn → bot hoạt động tiếp (chưa có Payment flow)
- [x] Branding watermark cuối AI response gói Free (không có ở Playground)
- [x] Tạo bot/upload vượt limit → bị block (aggregate across all tenants)
- [x] Plan hết hạn → auto-downgrade Free + deactivate bots/team vượt quota
- [x] Knowledge giữ nguyên khi downgrade
- [x] Monthly reset aiResponsesUsed, giữ bonusResponsesRemaining
- [x] FE: Usage dashboard + Plan comparison + Warning banners

## Quick Commands
- Start: `/code phase-01`
- Progress: `/next`
- UI: `/visualize`
- Save: `/save-brain`
