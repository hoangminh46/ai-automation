# Plan: Bot ↔ Channel Binding & Knowledge N:M

Created: 2026-05-08T10:37
Status: 🟡 In Progress
Spec: [bot-channel-spec.md](../../docs/bot-channel-spec.md)

## Overview

Triển khai quan hệ Bot ↔ Channel (1:N) và Bot ↔ Knowledge (N:M) theo 15 business rules đã confirm. Bao gồm: bot mặc định, gán bot vào channel, chọn knowledge cho bot, cập nhật message routing.

## Goal

- Mỗi channel chỉ do 1 bot phụ trách, 1 bot phục vụ nhiều channels
- Knowledge thuộc tenant, bot chọn knowledge nào để dùng (N:M)
- Bot mặc định tự động tạo khi tạo tenant, không xoá được
- Bot inactive thì không auto-reply dù có channel
- UI cho phép gán/đổi bot trên cả trang Agents lẫn Channels

## Scope

### In Scope
- Database: `isDefault` trên Agent, `agentId` trên ChannelConnection, bảng `AgentKnowledge`
- Backend: Agent CRUD (isDefault, channels, knowledge), Channel assign-bot API, Message routing
- Frontend: Agent form (channels + knowledge checkboxes), Channel bot dropdown, Knowledge filter

### Out of Scope
- Widget channel (chưa implement)
- Multi-language bot persona
- Bot A/B testing analytics
- Knowledge auto-suggest cho bot

## Actors
- **Seller (Owner/Admin)**: Quản lý bot, channel, knowledge
- **Agent (Staff)**: Chỉ xem và trả lời chat

## Core Entities (Thay đổi)

```
Agent           → thêm: isDefault (Boolean)
                → thêm: relation channels[], knowledgeLinks[]

ChannelConnection → thêm: agentId (String?, FK → Agent)

AgentKnowledge  → MỚI: bảng trung gian (agentId, knowledgeId, assignedAt)

KnowledgeDocument → giữ nguyên tenantId, thêm relation agentLinks[]
```

## Assumptions
- Conversation.agentId hiện tại đã tồn tại → giữ nguyên, chỉ thay đổi logic chọn agent
- Bot mặc định đã được tạo khi `tenant.create()` (line 41-48 tenant.service.ts) → chỉ cần thêm `isDefault: true`
- Knowledge embedding (vector) không bị ảnh hưởng — chỉ thay đổi cách query chunks (filter theo bot's knowledge)

## Risks
- **Data migration**: Tenant hiện tại chưa có bot mặc định với `isDefault=true` → cần migration seed
- **Channel chưa có agentId**: Sau migration, channels cũ `agentId=null` → bot không auto-reply cho tới khi user gán
- **Knowledge N:M**: Cần migration gán tất cả knowledge hiện tại vào bot mặc định của tenant tương ứng

## Acceptance Criteria
- [ ] Tạo tenant → auto tạo bot mặc định (isDefault=true, isActive=true)
- [ ] Không xoá được bot mặc định (API trả 403)
- [ ] Bot mặc định hiện badge ⭐ trên UI
- [ ] Create/Edit bot hiện danh sách channels + knowledge checkboxes
- [ ] Channel đã gán bot khác → disabled trên form tạo bot
- [ ] Trang Channels hiện dropdown chọn bot, warning nếu chưa gán
- [ ] Đổi bot trên channel → hiện confirm dialog
- [ ] Xoá bot → channels chuyển "chưa gán", knowledge giữ nguyên
- [ ] Bot inactive + có channel → không auto-reply
- [ ] Tin nhắn đến → routing đúng bot theo channel.agentId
- [ ] Bot dùng đúng knowledge đã chọn (không phải toàn bộ tenant)
- [ ] Trang Knowledge hiện tất cả của tenant, badge "đang dùng bởi Bot X"

## Phases

| Phase | Name | Status | Tasks | Depends On |
|-------|------|--------|:-----:|------------|
| 01 | Database Migration & Seed | ✅ Complete | 8 | - |
| 02 | BE — Agent CRUD (isDefault, includes) | ✅ Complete | 6 | 01 |
| 03 | BE — Channel-Bot Binding | ✅ Complete | 6 | 02 |
| 04 | BE — Knowledge N:M API | ✅ Complete | 4 | 02 |
| 05 | BE — Message Routing & RAG | ✅ Complete | 5 | 03, 04 |
| 06 | FE — Agents UI | ✅ Complete | 7 | 02, 03, 04 |
| 07 | FE — Channels UI | ✅ Complete | 5 | 03, 06 |
| 08 | FE — Knowledge UI & E2E Testing | ✅ Complete | 8 | 06, 07 |

**Tổng: 49 tasks / 8 phases** (trung bình ~6 tasks/phase)

## Quick Commands
- Start current phase: `/code phase-01`
- Check progress: `/next`
- Visualize UI: `/visualize`
- Save context: `/save-brain`
