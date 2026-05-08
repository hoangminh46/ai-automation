# Phase 08: Frontend — Knowledge UI & E2E Testing

Status: ✅ Complete
Dependencies: Phase 06, Phase 07

## Objective

Cập nhật trang Knowledge (bot badges, filter), Playground, Chat. Chạy E2E test toàn bộ 15 rules.

## Why This Phase Exists

Phase cuối — hoàn thiện UX và verify end-to-end. Knowledge page cần phản ánh mô hình N:M. Testing đảm bảo 15 rules hoạt động đúng.

## Implementation Steps

1. [x] **Cập nhật Knowledge page — Bot badges**
   - Mỗi document hiện chips "Bot X", "Bot Y"
   - Chưa gán bot nào → "(chưa gán bot nào)"
   - File: `src/app/dashboard/knowledge/page.tsx`

2. [x] **Cập nhật Knowledge page — Filter by bot**
   - Dropdown filter: "Tất cả bot" / tên từng bot
   - Filter client-side (data có agents[])
   - File: `src/app/dashboard/knowledge/page.tsx`

3. [x] **Cập nhật knowledge-store.ts**
   - Response type: document giờ include `agents: {id, name}[]`
   - File: `src/store/knowledge-store.ts`

4. [x] **Cập nhật Chat page — Bot name**
   - Hiện "🤖 [Bot name]" trên conversation
   - Nếu agentId = null → "Bot đã bị xoá" hoặc "Chưa gán bot"
   - File: `src/app/dashboard/chat/page.tsx`

5. [x] **Verify Playground — Bot selector**
   - Dropdown chọn bot hoạt động đúng
   - Bot inactive vẫn test được
   - File: `src/app/dashboard/playground/page.tsx`

6. [ ] **E2E Test: Onboarding Flow**
   ```
   Tạo tenant → verify bot mặc định
   Upload knowledge → verify thuộc tenant
   Gán knowledge cho bot → verify N:M
   Kết nối FB → verify agentId = null
   Gán bot → verify agentId set
   Gửi tin → verify bot reply
   ```

7. [ ] **E2E Test: Multi-bot Flow**
   ```
   Tạo bot mới → verify inactive, no channels
   Edit → tick channel + knowledge → save
   Toggle active → gửi tin → verify đúng bot reply
   Đổi bot trên channel → confirm → verify bot mới
   Set inactive → verify không reply
   ```

8. [ ] **E2E Test: Delete & Edge Cases**
   ```
   Xoá bot thường → verify channels unlink, knowledge giữ
   Xoá bot mặc định → verify blocked
   Disconnect channel → verify bot vẫn OK
   Bot không có knowledge → verify reply bằng prompt only
   ```

## Files to Create/Modify
- `src/app/dashboard/knowledge/page.tsx` — Badges + filter
- `src/store/knowledge-store.ts` — Type updates
- `src/app/dashboard/chat/page.tsx` — Bot name
- `src/app/dashboard/playground/page.tsx` — Verify

## Acceptance Criteria
- [ ] Knowledge page hiện bot badges
- [ ] Filter by bot hoạt động
- [ ] Chat hiện bot name
- [ ] Playground bot selector OK
- [ ] E2E Onboarding flow pass
- [ ] E2E Multi-bot flow pass
- [ ] E2E Delete flow pass

## Definition of Done
- [ ] All UI implemented
- [ ] All 15 rules verified end-to-end
- [ ] No TypeScript errors
- [ ] Git committed

---
🎉 Feature Complete!
