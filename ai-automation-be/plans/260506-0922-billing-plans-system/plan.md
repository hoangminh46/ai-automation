# Plan: Billing Plans System

Created: 2026-05-06
Status: Complete

## Overview

Implemented the billing plan and usage tracking foundation for the AI Chatbot SaaS.

- Plan per seller: 1 user = 1 subscription shared across all tenants.
- Data-driven plans stored in DB for future CMS management.
- This plan covers quota, usage, downgrade, and billing UI foundations.
- Online payment was completed in the follow-up plan `260507-1000-payment-vietqr-sepay`.

## Business Rules

### 1. Plan per Seller
- Subscription belongs to Seller, not Tenant.
- Quotas are aggregated across all tenants.
- AI response quota is shared across all shops.

### 2. Out of Responses -> Block + Response Pack
- Bot stops auto-replying when quota is exhausted.
- Human replies still work normally.
- Seller can buy response packs to continue.
- Response packs accumulate in `bonusResponsesRemaining`.

### 3. Expired Plan -> Auto-downgrade to Free
- Status becomes `EXPIRED`, then seller falls back to Free.
- Data is not deleted.
- Resources above quota are deactivated based on policy.

### 4. Hard Limit Bots/Team, Soft Limit Knowledge
- Bots above quota are deactivated.
- Team members above quota are deactivated.
- Knowledge files are preserved; only new uploads are blocked when over limit.

## Core Entities

### Plan
`plans(id, slug, name, price, maxAiResponses, maxBots, maxTeamMembers, maxKnowledgeFiles, maxKnowledgeSizeMb, hasBrandingWatermark, displayOrder, isActive, createdAt, updatedAt)`

### SellerSubscription
`seller_subscriptions(id, sellerId, planId, billingPeriod, status, aiResponsesUsed, bonusResponsesRemaining, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt)`

### ResponsePackPurchase
`response_pack_purchases(id, sellerId, amount, price, purchasedAt)`

## Quota Check Logic

```text
totalAvailable = plan.maxAiResponses - subscription.aiResponsesUsed + subscription.bonusResponsesRemaining

When AI replies:
  if totalAvailable <= 0 -> BLOCK
  if aiResponsesUsed < plan.maxAiResponses -> increment aiResponsesUsed
  else -> decrement bonusResponsesRemaining

Monthly reset resets only aiResponsesUsed, not bonusResponsesRemaining
```

## Phases

| Phase | Name | Status | Progress | Depends On |
|-------|------|--------|----------|------------|
| 01 | DB Schema, Plan Model & Seed | Complete | 100% | - |
| 02 | QuotaService Core (AI Responses) | Complete | 100% | 01 |
| 03 | Resource Limits & Monthly Reset | Complete | 100% | 02 |
| 04 | Branding Injection & REST APIs | Complete | 100% | 02 |
| 05 | Downgrade & Expiry Logic | Complete | 100% | 03, 04 |
| 06 | FE Usage & Billing UI | Complete | 100% | 04 |

## Acceptance Criteria

- [x] New seller auto-gets Free plan
- [x] AI responses are blocked when quota is exhausted
- [x] Response pack purchase increases bonus quota and restores bot operation
- [x] Free plan branding watermark is appended to AI replies
- [x] Bot/upload creation above quota is blocked across all tenants
- [x] Expired paid plan auto-downgrades to Free and deactivates excess resources
- [x] Knowledge is preserved on downgrade
- [x] Monthly reset keeps `bonusResponsesRemaining`
- [x] Frontend includes usage dashboard, comparison table, and warning banners

## Notes

- Synced with `.brain/brain.json`: `billing_management.status = complete`.
- Payment, VietQR, SePay webhook, transaction history, and expiry reminder were completed in the next dedicated payment plan.

## Quick Commands

- Review progress: `/next`
- Save context: `/save-brain`
