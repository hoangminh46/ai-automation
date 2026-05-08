# 🤖 Đặc tả: Quan hệ Bot ↔ Channel

**Ngày tạo:** 2026-05-08
**Trạng thái:** ✅ Đã xác nhận tất cả rules
**Phiên bản:** 1.0

---

## Mục lục

1. [Tổng quan quan hệ](#1-tổng-quan-quan-hệ)
2. [15 Business Rules](#2-15-business-rules)
3. [Ma trận trạng thái](#3-ma-trận-trạng-thái)
4. [User Flows](#4-user-flows)
5. [Thay đổi kiến trúc cần thiết](#5-thay-đổi-kiến-trúc-cần-thiết)

---

## 1. Tổng quan quan hệ

```
┌─────────────────────────────────────────────┐
│                  Tenant                      │
│                                              │
│   Bot (Agent)              Channel           │
│   ┌──────────┐         ┌──────────────┐      │
│   │ Bot mặc  │────────→│ Facebook     │      │
│   │ định ⭐  │────┐    │ Messenger    │      │
│   └──────────┘    │    └──────────────┘      │
│                   │                          │
│   ┌──────────┐    └───→┌──────────────┐      │
│   │ Bot CSKH │         │ Zalo OA      │      │
│   │          │─ ✗ ─ ─ ─│ (đã có bot)  │      │
│   └──────────┘         └──────────────┘      │
│                                              │
│   ┌──────────┐                               │
│   │ Bot Test │  (chưa gán channel nào)       │
│   │ inactive │                               │
│   └──────────┘                               │
│                                              │
│   Knowledge Base: Thuộc cửa hàng              │
│   → Bot chọn knowledge nào để dùng             │
└─────────────────────────────────────────────┘

Quan hệ:  Bot ←─── 1:N ───→ Channel
          (1 bot phục vụ nhiều kênh)
          (1 kênh chỉ do 1 bot phụ trách)
```

---

## 2. 15 Business Rules

### Rule 1: 1 Channel chỉ kết nối được với 1 Bot
**Trạng thái:** ✅ Confirmed

Mỗi channel (Facebook Page, Zalo OA) chỉ được gán cho **duy nhất 1 bot** tại một thời điểm. Điều này tránh xung đột khi có tin nhắn đến — hệ thống biết chính xác bot nào xử lý.

**Ví dụ:**
- ✅ Facebook Page "Shop ABC" → Bot Tư vấn
- ❌ Facebook Page "Shop ABC" → Bot Tư vấn + Bot CSKH (KHÔNG cho phép)

---

### Rule 2: 1 Bot có thể kết nối được với nhiều Channels
**Trạng thái:** ✅ Confirmed

Một bot có thể phục vụ nhiều kênh cùng lúc. Bot sử dụng cùng prompt và knowledge base cho tất cả các kênh mà nó được gán.

**Ví dụ:**
```
Bot Tư vấn ──→ Facebook Messenger
           └──→ Zalo OA
           └──→ (tương lai: Instagram, Website widget...)
```

---

### Rule 3: Mỗi Tenant có 1 Bot mặc định, không thể xoá
**Trạng thái:** ✅ Confirmed

Khi tạo tenant mới, hệ thống tự động tạo 1 bot mặc định. Bot này:

| Đặc tính | Giá trị |
|----------|---------|
| Tên mặc định | "Bot mặc định" (user có thể đổi tên) |
| Trạng thái mặc định | ✅ Active |
| Xoá được? | ❌ Không — nút xoá bị ẩn/disabled |
| Hiển thị đặc biệt | Badge ⭐ "Mặc định" |
| Đổi tên được? | ✅ Có |
| Chỉnh prompt/knowledge? | ✅ Có, giống bot thường |
| Chuyển active/inactive? | ✅ Có |

**Lý do:** Đảm bảo tenant luôn có ít nhất 1 bot, tránh trường hợp user xoá hết bot rồi không biết tạo lại.

---

### Rule 4: Xoá Bot → Channels bị bỏ kết nối
**Trạng thái:** ✅ Confirmed

Khi user xoá 1 bot:
1. Tất cả channels đang kết nối với bot đó sẽ chuyển về trạng thái **"Chưa gán bot"** (`agentId = null`)
2. Channels **KHÔNG bị xoá** — chúng vẫn connected với Facebook/Zalo, chỉ mất liên kết bot
3. Sau khi bỏ kết nối, channels **ngừng auto-reply** (tin nhắn đến chỉ hiện trong Chat cho nhân viên xử lý thủ công)
4. Knowledge **KHÔNG bị xoá** — knowledge thuộc tenant, chỉ liên kết giữa bot và knowledge bị xoá

**Flow:**
```
User xoá Bot CSKH
  → Confirm: "Bot đang kết nối với Zalo OA. Xoá bot sẽ ngắt kết nối. Tiếp tục?"
  → User confirm
  → Bot bị xoá
  → Zalo OA: agentId → null
  → Zalo OA vẫn connected nhưng không auto-reply
  → Knowledge của tenant vẫn còn nguyên (chỉ mất liên kết với bot đã xoá)
```

---

### Rule 5: Xoá kết nối Channel → Bot mất kết nối tới Channel đó
**Trạng thái:** ✅ Confirmed

Khi user disconnect 1 channel (ví dụ disconnect Facebook Page):
1. Channel bị xoá khỏi hệ thống (hoặc set `isActive = false`)
2. Bot trước đó phục vụ channel này tự động mất kết nối (vì channel không còn)
3. Bot **KHÔNG bị ảnh hưởng** — vẫn hoạt động bình thường với các channels khác (nếu có)

**Flow:**
```
User disconnect Facebook Page
  → Confirm: "Ngắt kết nối Facebook Page 'Shop ABC'?"
  → User confirm
  → ChannelConnection bị deactivate
  → Bot Tư vấn (trước đó gán FB) vẫn hoạt động
  → Bot Tư vấn vẫn phục vụ Zalo OA (nếu có)
```

---

### Rule 6: Bot mới tạo → Mặc định Inactive, không kết nối Channel
**Trạng thái:** ✅ Confirmed

Khi user tạo bot mới (không phải bot mặc định):

| Thuộc tính | Giá trị mặc định |
|-----------|-----------------|
| Status | ❌ Inactive |
| Channels | Không kết nối (trừ khi user tick ở form tạo) |
| Knowledge | Chưa chọn knowledge nào (user chọn từ kho của tenant sau) |
| Prompt | Template mặc định |
| Dùng Playground? | ✅ Có (dù inactive vẫn test được) |
| Auto-reply? | ❌ Không (vì inactive) |

**Lý do:** Tránh bot chưa sẵn sàng (chưa có knowledge, chưa test prompt) tiếp khách thật.

---

### Rule 7: Form tạo Bot hiện list Channels để tick chọn
**Trạng thái:** ✅ Confirmed

Khi tạo bot, form hiển thị danh sách tất cả channels hiện có của tenant:

**Trường hợp 1: Có channels, một số đã gán bot**
```
┌─ Tạo Bot mới ─────────────────────────────────┐
│  Tên bot:  [Bot CSKH              ]            │
│  Prompt:   [Bạn là nhân viên CSKH...]          │
│                                                │
│  Kết nối kênh:                                 │
│  ☐ Facebook "Shop ABC"  ← (trống, cho tick)    │
│  ☐ Zalo OA "Shop ABC"   🔒 Đang dùng bởi      │
│                             "Bot Tư vấn"       │
│                          (disabled, không tick) │
│                                                │
│  [Huỷ]                         [Tạo Bot]       │
└────────────────────────────────────────────────┘
```

**Trường hợp 2: Không có channel nào**
```
┌─ Tạo Bot mới ─────────────────────────────────┐
│  Tên bot:  [Bot Test               ]           │
│  Prompt:   [...]                               │
│                                                │
│  Kết nối kênh:                                 │
│  ℹ️ Chưa có kênh nào. Kết nối kênh tại         │
│     trang Channels.                            │
│                                                │
│  [Huỷ]                         [Tạo Bot]       │
└────────────────────────────────────────────────┘
```

> Bot vẫn được tạo bình thường, chỉ là không có kênh nào kết nối.

**Trường hợp 3: Tất cả channels đã gán bot**
```
┌─ Tạo Bot mới ─────────────────────────────────┐
│  Tên bot:  [Bot Remarketing        ]           │
│  Prompt:   [...]                               │
│                                                │
│  Kết nối kênh:                                 │
│  ☐ Facebook "Shop ABC"  🔒 Đang dùng bởi      │
│                             "Bot Tư vấn"       │
│  ☐ Zalo OA "Shop ABC"   🔒 Đang dùng bởi      │
│                             "Bot CSKH"         │
│  (Tất cả disabled)                             │
│                                                │
│  [Huỷ]                         [Tạo Bot]       │
└────────────────────────────────────────────────┘
```

> Bot vẫn tạo được. Muốn gán channel → vào Edit bot hoặc trang Channels để đổi.

---

### Rule 8: Channel mới kết nối → KHÔNG auto-gán bot
**Trạng thái:** ✅ Confirmed

Khi user kết nối 1 channel mới (ví dụ kết nối Facebook Page), channel đó ở trạng thái **"Chưa gán bot"**. User phải chủ động vào chọn bot.

**Lý do:**
- User có thể chưa muốn bot auto-reply ngay (cần setup knowledge trước)
- Tránh gán nhầm bot không phù hợp

**UX trang Channels sau khi kết nối:**
```
┌─ Facebook Messenger ─────────────────────────┐
│  Page: "Shop Mỹ Phẩm ABC"                   │
│  Status: ✅ Connected                        │
│  Bot: ⚠️ Chưa gán — Chọn bot để bật         │
│       auto-reply [▼ Chọn bot]                │
└──────────────────────────────────────────────┘
```

---

### Rule 9: Cho phép đổi Bot cho Channel (Reassign) + Confirm
**Trạng thái:** ✅ Confirmed

User có thể đổi bot phục vụ 1 channel bất kỳ lúc nào. Khi đổi:

1. **Hiện confirm dialog:**
   ```
   ┌─ Xác nhận đổi bot ──────────────────────┐
   │                                          │
   │  ⚠️ Bot "Tư vấn SP" sẽ ngừng trả lời   │
   │  kênh Facebook "Shop ABC".              │
   │                                          │
   │  Bot "CSKH" sẽ tiếp quản từ bây giờ.    │
   │                                          │
   │  Lịch sử hội thoại cũ được giữ nguyên.  │
   │                                          │
   │  [Huỷ]                    [Xác nhận]     │
   └──────────────────────────────────────────┘
   ```

2. **Conversation history:** Giữ nguyên toàn bộ. Bot mới tiếp quản từ tin nhắn tiếp theo.

3. **Chỗ đổi:** Có thể đổi từ:
   - Trang **Channels** (dropdown chọn bot)
   - Form **Edit Bot** (tick/untick channels)

---

### Rule 10: Form tạo bot — Channel đã có bot → Disabled
**Trạng thái:** ✅ Confirmed

Khi tạo bot mới, nếu 1 channel đã gán cho bot khác:
- Checkbox bị **disabled** (không cho tick)
- Hiển thị text: **"🔒 Đang dùng bởi [Tên bot]"**
- User **KHÔNG thể** gán channel đã có bot vào bot mới từ form Create

**Nếu muốn chuyển channel sang bot mới:**
1. Tạo bot mới (không tick channel)
2. Vào trang Channels hoặc Edit bot cũ → bỏ gán channel
3. Vào Edit bot mới → tick channel

> Đây là cách an toàn nhất, tránh user vô tình "cướp" channel từ bot đang hoạt động.

---

### Rule 11: Bot Inactive + Có Channel → KHÔNG auto-reply
**Trạng thái:** ✅ Confirmed

Trạng thái `active/inactive` của bot quyết định bot có tự động trả lời hay không:

| Bot Status | Channel | Kết quả |
|:----------:|:-------:|---------|
| ✅ Active | ✅ Có kết nối | Bot **tự động trả lời** mọi tin nhắn đến |
| ❌ Inactive | ✅ Có kết nối | Bot **KHÔNG trả lời**. Tin nhắn hiện trong Chat cho nhân viên xử lý thủ công |
| ✅ Active | ❌ Không | Bot hoạt động nhưng không có kênh. Chỉ test được trong Playground |
| ❌ Inactive | ❌ Không | Bot "ngủ đông". Chỉ test được trong **Playground** |

> **Playground luôn hoạt động** — dù bot inactive, user vẫn test chat được trong Playground để tinh chỉnh prompt/knowledge trước khi bật active.

**UX toggle active/inactive:**
```
┌─ Bot CSKH ────────────────────────────────┐
│  Status: [🔘 Inactive ──── Active]        │
│                                           │
│  ⚠️ Bot đang inactive. Các kênh kết nối  │
│  sẽ không tự động trả lời.               │
└───────────────────────────────────────────┘
```

---

### Rule 12: Bot mặc định — Đặc tính riêng
**Trạng thái:** ✅ Confirmed

| Đặc tính | Bot mặc định ⭐ | Bot thường |
|----------|:--------------:|:----------:|
| Tạo bởi | Hệ thống (auto khi tạo tenant) | User |
| Trạng thái mặc định | ✅ Active | ❌ Inactive |
| Xoá được | ❌ Không | ✅ Có |
| Đổi tên | ✅ Có | ✅ Có |
| Chỉnh prompt/knowledge | ✅ Có | ✅ Có |
| Toggle active/inactive | ✅ Có | ✅ Có |
| Hiển thị UI | Badge ⭐ "Mặc định" | Không badge |
| Auto-gán channel mới | ❌ Không | ❌ Không |

---

### Rule 13: Form Edit Bot — Cho phép thay đổi Channels
**Trạng thái:** ✅ Confirmed

Khi edit 1 bot, form hiển thị list channels giống form Create, nhưng:
- Channels **đang gán cho bot này** → ☑️ (checked)
- Channels **trống** (chưa gán bot nào) → ☐ (cho tick)
- Channels **đang gán bot khác** → 🔒 Disabled + "Đang dùng bởi [Bot X]"

**Khi user untick 1 channel đang gán:**
- Channel chuyển về "Chưa gán bot"
- Bot ngừng phục vụ channel đó

**Khi user tick 1 channel trống:**
- Channel được gán cho bot hiện tại

---

### Rule 14: Knowledge Base ở Tenant-level, Bot chọn Knowledge để dùng
**Trạng thái:** ✅ Confirmed

Knowledge base thuộc về **cửa hàng (tenant)**, không thuộc về bot. Mỗi bot có thể **chọn** những knowledge nào nó muốn sử dụng.

**Mô hình quan hệ:**
```
Tenant (Cửa hàng)
  │
  ├── Knowledge Base (thuộc tenant)
  │     ├── 📄 Catalog sản phẩm
  │     ├── 📄 Bảng giá 2026
  │     ├── 📄 Chính sách đổi trả
  │     └── 📄 Chương trình KM tháng 5
  │
  ├── Bot Tư vấn SP ──→ chọn: Catalog, Bảng giá
  ├── Bot CSKH       ──→ chọn: Chính sách đổi trả
  └── Bot Remarketing──→ chọn: Catalog, Chương trình KM
```

**Quan hệ:** `Bot ←── N:M ──→ KnowledgeDocument` (Many-to-Many)
- 1 bot có thể chọn nhiều knowledge documents
- 1 knowledge document có thể được nhiều bot sử dụng
- Knowledge vẫn thuộc tenant, không bị xoá khi xoá bot

**Rules:**
| Rule | Mô tả |
|------|--------|
| Upload knowledge | Gán vào **tenant**, mọi bot trong tenant đều thấy |
| Xoá knowledge | Xoá khỏi tenant, tự động mất liên kết với tất cả bot đang dùng |
| Xoá bot | Knowledge **KHÔNG** bị xoá, chỉ mất liên kết |
| Bot mới tạo | Chưa chọn knowledge nào, user tự chọn |
| Trang Knowledge | Hiện **tất cả** knowledge của tenant, có thể filter theo bot đang dùng |

**UX — Form tạo/edit Bot:**
```
┌─ Tạo Bot mới ─────────────────────────────────────┐
│  Tên bot:  [Bot CSKH              ]                │
│  Prompt:   [Bạn là nhân viên CSKH...]              │
│                                                    │
│  Kết nối kênh:                                     │
│  ☐ Facebook "Shop ABC"                             │
│  ☐ Zalo OA "Shop ABC"   🔒 Đang dùng bởi "Bot.." │
│                                                    │
│  Chọn Knowledge:                                   │
│  ☑ Chính sách đổi trả (3 trang)                    │
│  ☑ FAQ vận chuyển (2 trang)                         │
│  ☐ Catalog sản phẩm (15 trang)                     │
│  ☐ Chương trình KM tháng 5 (1 trang)               │
│                                                    │
│  [Huỷ]                         [Tạo Bot]           │
└────────────────────────────────────────────────────┘
```

**UX — Trang Knowledge (hiện tất cả của tenant):**
```
┌─ Knowledge Base ─────────────────────────────────────┐
│                                                      │
│  [+ Upload tài liệu]     Filter: [▼ Tất cả bot]    │
│                                                      │
│  📄 Catalog sản phẩm     Bot: Tư vấn, Remarketing   │
│  📄 Bảng giá 2026        Bot: Tư vấn                │
│  📄 Chính sách đổi trả   Bot: CSKH                  │
│  📄 FAQ vận chuyển        Bot: CSKH                  │
│  📄 KM tháng 5           Bot: Remarketing            │
│  📄 Hướng dẫn sử dụng   Bot: (chưa gán bot nào)     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### Rule 15: Bot mặc định tính vào Quota
**Trạng thái:** ✅ Confirmed

Bot mặc định **được tính** vào giới hạn số bot của gói:

| Gói | Giới hạn bot | Thực tế |
|-----|:-----------:|---------|
| Free | 1 bot | = Chỉ bot mặc định, không tạo thêm được |
| Basic | 3 bots | = Bot mặc định + 2 bot thêm |
| Standard | 5 bots | = Bot mặc định + 4 bot thêm |
| Premium | 10 bots | = Bot mặc định + 9 bot thêm |

**Lý do:** Đơn giản, user dễ hiểu. "Gói Free cho 1 bot" = đúng 1 bot.

---

## 3. Ma trận trạng thái

### Bot States:
```
                    ┌───────────┐
   Tạo bot ────→   │ INACTIVE  │ ←── Toggle off
                    │ (draft)   │
                    └─────┬─────┘
                          │ Toggle on
                          ▼
                    ┌───────────┐
                    │  ACTIVE   │ ←── Bot mặc định start ở đây
                    │ (live)    │
                    └─────┬─────┘
                          │ Xoá bot (chỉ bot thường)
                          ▼
                    ┌───────────┐
                    │  DELETED  │
                    │           │
                    └───────────┘
```

### Channel-Bot Assignment States:
```
Channel mới kết nối
        │
        ▼
  ┌─────────────┐     User chọn bot      ┌─────────────┐
  │ Chưa gán    │ ──────────────────────→ │ Đã gán bot  │
  │ (no bot)    │ ←────────────────────── │ (assigned)  │
  └─────────────┘   User bỏ gán /        └─────────────┘
        ▲            Xoá bot                    │
        │                                       │ User đổi bot
        │                                       ▼
        │                                ┌─────────────┐
        └─────────────────────────────── │ Reassigned  │
               Xoá bot mới              └─────────────┘
```

### Tin nhắn đến — Decision Tree:
```
Tin nhắn đến từ channel
        │
        ▼
  Channel có bot?
  ├── Không → Hiện trong Chat, nhân viên xử lý thủ công
  └── Có
        │
        ▼
  Bot đang Active?
  ├── Không (Inactive) → Hiện trong Chat, nhân viên xử lý thủ công
  └── Có (Active) → Bot tự động trả lời bằng AI
```

---

## 4. User Flows

### Flow 1: Onboarding mới (Lần đầu dùng app)
```
1. User đăng ký → Tạo tenant → Auto tạo bot mặc định (Active, trống knowledge)
2. User vào Agents → Thấy 1 bot mặc định ⭐
3. User vào Knowledge → Upload tài liệu cho cửa hàng
4. User vào Agents → Edit bot mặc định → Chọn knowledge để dùng
5. User vào Playground → Test bot, chỉnh prompt
6. User vào Channels → Kết nối Facebook Page
7. Channel mới tạo → "Chưa gán bot" → User chọn bot mặc định
8. Bot bắt đầu auto-reply → Done ✅
```

### Flow 2: Tạo bot chuyên biệt
```
1. User vào Agents → Click "Tạo bot mới"
2. Nhập tên, prompt → Thấy list channels:
   - Facebook ☐ (trống, cho tick)
   - Zalo 🔒 "Đang dùng bởi Bot mặc định" (disabled)
3. User tick Facebook → Tạo bot
4. Bot mới tạo (Inactive) + gán Facebook channel
5. User vào Agents → Edit bot mới → Chọn knowledge từ kho của tenant
6. User vào Playground → Chọn bot mới → Test
7. User hài lòng → Toggle Active
8. Bot mới bắt đầu auto-reply trên Facebook ✅
```

### Flow 3: Xoá bot
```
1. User vào Agents → Click xoá "Bot CSKH"
2. Confirm: "Bot đang kết nối với Zalo OA. Xoá bot sẽ ngắt kết nối. Tiếp tục?"
3. User confirm
4. Bot CSKH bị xoá, Knowledge của tenant vẫn còn nguyên
5. Zalo OA → "Chưa gán bot" (ngừng auto-reply)
6. Tin nhắn Zalo mới → hiện Chat cho nhân viên xử lý thủ công
```

---

## 5. Thay đổi kiến trúc cần thiết

### Database Schema Changes:

```prisma
// ChannelConnection — Thêm agentId
model ChannelConnection {
  id          String   @id @default(uuid())
  tenantId    String
  channelType String   // FACEBOOK | ZALO
  isActive    Boolean
  agentId     String?  // 🆕 Bot phụ trách (null = chưa gán)
  agent       Agent?   @relation(fields: [agentId], references: [id], onDelete: SetNull)
  // ...
}

// Agent — Thêm isDefault flag
model Agent {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  isActive    Boolean  @default(false)
  isDefault   Boolean  @default(false)  // 🆕 Bot mặc định
  channels    ChannelConnection[]       // 🆕 Relation
  knowledgeLinks AgentKnowledge[]       // 🆕 Many-to-Many với Knowledge
  // ...
}

// KnowledgeDocument — GIỮ NGUYÊN tenantId (thuộc cửa hàng)
model KnowledgeDocument {
  id        String   @id @default(uuid())
  tenantId  String                       // ✅ Giữ nguyên — knowledge thuộc tenant
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  agentLinks AgentKnowledge[]            // 🆕 Many-to-Many với Bot
  // ...
}

// 🆕 Bảng trung gian: Bot ↔ Knowledge (Many-to-Many)
model AgentKnowledge {
  id            String   @id @default(uuid())
  agentId       String
  knowledgeId   String
  agent         Agent             @relation(fields: [agentId], references: [id], onDelete: Cascade)
  knowledge     KnowledgeDocument @relation(fields: [knowledgeId], references: [id], onDelete: Cascade)
  assignedAt    DateTime @default(now())

  @@unique([agentId, knowledgeId])
}
```

### API Changes:
| API | Thay đổi |
|-----|----------|
| `POST /agents` | Thêm field `channelIds?: string[]` để gán channels khi tạo |
| `PATCH /agents/:id` | Thêm field `channelIds?: string[]` để đổi channels |
| `DELETE /agents/:id` | Check `isDefault`, nếu true → reject. Cascade: set `agentId = null` trên channels |
| `POST /channels/connect` | Không auto-gán bot, `agentId = null` |
| `PATCH /channels/:id/assign-bot` | 🆕 Gán bot cho channel |
| `POST /knowledge/upload` | Giữ nguyên `tenantId` — knowledge thuộc tenant |
| `GET /knowledge` | Giữ filter theo `tenantId`, thêm optional filter `agentId` |
| `POST /agents/:id/knowledge` | 🆕 Gán/bỏ gán knowledge cho bot (`knowledgeIds: string[]`) |
| `GET /agents/:id/knowledge` | 🆕 Lấy list knowledge đang gán cho bot |
| `POST /tenants` | Auto tạo bot mặc định (`isDefault: true`, `isActive: true`) |

### Frontend Changes:
| Trang | Thay đổi |
|-------|----------|
| Agents | Form create/edit: thêm channel list với checkbox |
| Agents | Nút xoá: ẩn cho bot mặc định, confirm cho bot thường |
| Agents | Badge ⭐ "Mặc định" cho bot mặc định |
| Agents | Toggle Active/Inactive |
| Channels | Dropdown chọn bot cho mỗi channel |
| Channels | Hiện trạng thái "Chưa gán bot" với warning |
| Knowledge | Hiện tất cả knowledge của tenant, filter theo bot |
| Knowledge | Upload gửi `tenantId` (giữ nguyên) |
| Knowledge | Hiện badge "đang dùng bởi Bot X, Bot Y" bên cạnh mỗi document |
| Playground | Dropdown chọn bot để test |
| Chat | Hiện tên bot đang xử lý conversation |
