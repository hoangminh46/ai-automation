# Plan: Zalo OA Channel Integration
Created: 2026-05-04T11:04:00+07:00
Status: 🟡 In Progress

## Overview
Tích hợp kênh Zalo Official Account (OA) vào hệ thống AI Chatbot. Cho phép seller kết nối Zalo OA → khách nhắn Zalo → AI trả lời tự động → nhân viên can thiệp qua CRM dashboard.

Tận dụng **ChannelAdapter interface** đã có sẵn từ Phase 09 (Facebook Channel) để giảm thiểu thay đổi kiến trúc.

## Goal
- Seller kết nối Zalo OA qua OAuth → hệ thống tự động nhận/gửi tin nhắn
- Khách nhắn Zalo OA → AI pipeline trả lời (RAG + knowledge)
- Nhân viên CRM reply → gửi qua Zalo cho khách
- Token auto-refresh (access_token 1h, refresh_token 3 tháng)

## Scope
### In Scope
- ZaloAdapter (implement ChannelAdapter interface)
- Zalo OAuth2 flow (authorization_code + refresh_token)
- Zalo webhook (receive messages + signature verification)
- Zalo Send API (reply text messages)
- Token auto-refresh service
- DB migration: thêm refreshTokenEnc + tokenExpiresAt
- FE: mở rộng /dashboard/channels cho Zalo OA
- Connect/disconnect Zalo OA

### Out of Scope
- Zalo ZNS template messages (tin nhắn chăm sóc khách hàng)
- Zalo Mini App
- Rich media (hình ảnh, sticker, file, video)
- Zalo Pay integration
- Multi-OA per tenant (MVP: 1 OA per tenant)

## Actors
- **Seller**: kết nối Zalo OA, cấu hình
- **Khách hàng**: nhắn tin qua Zalo cho OA
- **Nhân viên CRM**: xem/reply tin nhắn trên dashboard

## Core Entities
- `ChannelConnection` (existing, channelType=ZALO) + 2 cột mới
- `ZaloAdapter` (new, implements ChannelAdapter)
- `ZaloWebhookController` (new)
- `ZaloTokenService` (new, auto-refresh)

## Assumptions
- Seller đã có Zalo OA trên oa.zalo.me
- Hệ thống dùng 1 Zalo App chung (App ID + Secret Key ở .env)
- Mỗi seller authorize OA riêng → nhận access_token + refresh_token riêng
- MVP: chỉ hỗ trợ text message
- Zalo API version: v3.0 / v4 (OAuth endpoint v4, message endpoint v2.0)

## Risks
- Zalo API thay đổi endpoint/format không báo trước → cần abstract qua adapter
- Refresh token hết hạn sau 3 tháng → seller phải re-authorize
- Zalo rate limit không rõ ràng trong docs → cần monitor
- Domain verification requirement trên Zalo Developers portal

## Acceptance Criteria
- [ ] Seller kết nối Zalo OA qua OAuth thành công
- [ ] Khách nhắn Zalo OA → AI trả lời tự động (tested via ngrok)
- [ ] Nhân viên gửi reply trên CMS → khách nhận trên Zalo
- [ ] Token auto-refresh hoạt động (không cần seller re-auth mỗi giờ)
- [ ] Invalid signature → reject webhook
- [ ] Duplicate message → xử lý 1 lần
- [ ] Disconnect Zalo OA hoạt động
- [ ] FE hiển thị trạng thái kết nối Zalo OA

## Phases

| Phase | Name | Status | Progress | Depends On |
|-------|------|--------|----------|------------|
| 01 | DB Migration + Zalo Adapter | ✅ Done | 100% | - |
| 02 | Zalo OAuth + Token Refresh | ✅ Done | 100% | 01 |
| 03 | Zalo Webhook + Message Routing | ✅ Done | 100% | 01, 02 |
| 04 | Frontend Channel UI Extension | ✅ Done | 100% | 02, 03 |

## Quick Commands
- Start current phase: `/code phase-01`
- Check progress: `/next`
- Visualize UI: `/visualize`
- Save context: `/save-brain`
