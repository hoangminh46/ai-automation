# Phase 07: Frontend — Channels UI

Status: ✅ Complete
Dependencies: Phase 03, Phase 06

## Objective

Cập nhật trang Channels: dropdown chọn bot cho mỗi channel, warning "chưa gán bot", confirm dialog khi đổi bot.

## Why This Phase Exists

Trang Channels là nơi thứ hai user có thể quản lý bot-channel binding (ngoài trang Agents). Cần đồng bộ UX giữa 2 nơi.

## Implementation Steps

1. [x] **Cập nhật channel-store.ts**
   - Response type: channel giờ include `agent: {id, name, isActive, isDefault}`
   - Thêm action: `assignBot(channelId, agentId)`
   - File: `src/store/channel-store.ts`

2. [x] **Cập nhật Channel Card — Bot assignment UI**
   - Mỗi channel card hiện dropdown "Bot phụ trách"
   - Options: list agents của tenant (active + inactive)
   - Option thêm: "— Bỏ gán —" (set agentId = null)
   - Nếu chưa gán: hiện ⚠️ "Chưa gán bot — chọn bot để bật auto-reply"
   - File: Channel section components (FacebookChannelSection, ZaloChannelSection)

3. [x] **Tạo Confirm Dialog đổi bot**
   - Trigger: user chọn bot khác cho channel đã có bot
   - Nội dung: "Bot [A] sẽ ngừng trả lời kênh [X]. Bot [B] sẽ tiếp quản. Lịch sử hội thoại giữ nguyên."
   - Buttons: Huỷ / Xác nhận
   - File: Shared component hoặc inline dialog

4. [x] **Cập nhật API service frontend**
   - `channelService.assignBot(tenantId, channelId, agentId)`
   - File: `src/services/channel-service.ts`

5. [ ] **Test manual: flow gán/đổi/bỏ gán bot trên Channels page**

## Files to Create/Modify
- `src/store/channel-store.ts` — Type + assignBot action
- `src/services/channel-service.ts` — assignBot API
- `src/app/dashboard/channels/` — Bot dropdown + confirm dialog
- `src/components/` — Confirm dialog (nếu tạo shared)

## Acceptance Criteria
- [ ] Channel card hiện dropdown chọn bot
- [ ] Chưa gán → warning ⚠️
- [ ] Đổi bot → confirm dialog → API call → UI update
- [ ] Bỏ gán → channel hiện "chưa gán bot"
- [ ] Gán bot inactive → hiện info "Bot đang inactive, chưa auto-reply"

## Definition of Done
- [ ] Code implemented
- [ ] Đồng bộ UX với Agent page (gán bot từ cả 2 nơi hoạt động đúng)
- [ ] TypeScript clean

---
Next Phase: [Phase 08 — Frontend Knowledge UI & E2E Testing](./phase-08-frontend-knowledge-testing.md)
