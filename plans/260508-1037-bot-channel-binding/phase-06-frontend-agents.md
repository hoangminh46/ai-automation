# Phase 06: Frontend — Agents UI

Status: ✅ Complete
Dependencies: Phase 02, Phase 03, Phase 04

## Objective

Cập nhật trang Agents: badge ⭐ bot mặc định, toggle active/inactive, form create/edit với channel checkboxes + knowledge checkboxes, delete guard.

## Why This Phase Exists

Biến logic backend (isDefault, channel binding, knowledge N:M) thành giao diện user có thể tương tác. Đây là trang quản lý bot chính.

## Implementation Steps

1. [x] **Cập nhật agent-store.ts**
   - Response type: thêm `channels[]`, `knowledgeLinks[]`, `isDefault`
   - Thêm action: `toggleActive(agentId, isActive)`
   - File: `src/store/agent-store.ts`

2. [x] **Cập nhật Agent Card/Row component**
   - Badge ⭐ "Mặc định" nếu `isDefault = true`
   - Toggle switch Active/Inactive (gọi PATCH API)
   - Ẩn nút Delete nếu `isDefault = true`
   - Chips hiện channels đang kết nối ("FB", "Zalo")
   - File: Agent card/row component trong `src/app/dashboard/agents/`

3. [x] **Tạo/cập nhật Agent Create Modal**
   - Section "Kết nối kênh": checkbox list channels
     - Channel trống → cho tick
     - Channel đã gán bot khác → disabled + "🔒 Đang dùng bởi [Bot X]"
     - Không có channel → info text
   - Section "Chọn Knowledge": checkbox list knowledge tenant
   - Submit gửi `channelIds` + `knowledgeIds`
   - File: Create modal component

4. [x] **Tạo/cập nhật Agent Edit Modal**
   - Giống Create nhưng pre-fill channels (checked) + knowledge (checked)
   - Untick channel → bỏ gán
   - Tick channel trống → gán mới
   - File: Edit modal component

5. [x] **Cập nhật Agent Delete logic**
   - Nút xoá disabled/ẩn cho bot mặc định
   - Confirm dialog cho bot thường: "Bot đang kết nối với [N] kênh. Xoá sẽ ngắt kết nối. Tiếp tục?"
   - File: `src/app/dashboard/agents/page.tsx`

6. [x] **Cập nhật Agent active toggle warning**
   - Toggle inactive → warning: "Bot sẽ không auto-reply dù có kênh kết nối"
   - File: `src/app/dashboard/agents/page.tsx`

7. [x] **Cập nhật TypeScript types**
   - Agent type: thêm `isDefault`, `channels[]`, `knowledgeLinks[]`
   - CreateAgentDto: thêm `channelIds?`, `knowledgeIds?`
   - File: `src/types/` hoặc trong service file

## Files to Create/Modify
- `src/store/agent-store.ts` — Type + actions
- `src/app/dashboard/agents/page.tsx` — Badge, toggle, delete
- `src/app/dashboard/agents/` — Create/edit modal components
- `src/types/` — Agent type updates

## Acceptance Criteria
- [ ] Bot mặc định hiện badge ⭐, không có nút xoá
- [ ] Toggle active/inactive hoạt động + warning
- [ ] Form tạo bot hiện channels (disabled nếu gán) + knowledge
- [ ] Form edit bot pre-fill đúng channels + knowledge
- [ ] Xoá bot thường → confirm → channels unlink

## Definition of Done
- [ ] Code implemented
- [ ] UI responsive
- [ ] TypeScript clean

---
Next Phase: [Phase 07 — Frontend Channels UI](./phase-07-frontend-channels.md)
