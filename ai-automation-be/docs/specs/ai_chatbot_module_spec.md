# 📋 Spec: AI Chatbot Module (Standalone Backend)

> **Ngày tạo:** 13/04/2026
> **Trạng thái:** PLANNING
> **Module:** `ai-chatbot-service`
> **Tech Stack:** NestJS + Supabase (PostgreSQL + pgvector) + OpenAI

---

## 1. Executive Summary

Xây dựng **module AI Chatbot backend độc lập** — một NestJS service nhận tin nhắn từ nhiều kênh (MVP: Facebook Messenger), xử lý qua AI Agent Pipeline (lấy cảm hứng từ GoClaw), và trả lời tự động dựa trên knowledge base của từng seller.

Module này là service đầu tiên trong hệ sinh thái **AI Commerce Suite**, được thiết kế để hoạt động độc lập và có thể kết hợp với các module khác (AI Video, Analytics...) sau này.

---

## 2. Goal & Non-Goals

### Goals
- Seller TMĐT tự đăng ký, upload data sản phẩm, kết nối FB page → chatbot hoạt động trong 5 phút
- AI trả lời khách hàng 24/7 dựa trên knowledge base riêng của từng seller
- Multi-tenant: mỗi seller có workspace riêng biệt, data cách ly hoàn toàn
- Kiến trúc modular, dễ mở rộng thêm kênh (Zalo, Widget) và module khác

### Non-Goals (Out of Scope MVP)
- ❌ Handoff AI → Nhân viên (Phase sau)
- ❌ Zalo OA / Website Widget (Phase sau)
- ❌ AI Video features
- ❌ E-commerce integration (Shopee, TikTok Shop API)
- ❌ Payment / Subscription billing
- ❌ Follow-up tự động
- ❌ Analytics dashboard

---

## 3. Actors / Roles

| Actor | Mô tả | Hành động chính |
|---|---|---|
| **Seller** | Chủ shop TMĐT, đăng ký dùng platform | Tạo agent, upload KB, kết nối FB page, xem hội thoại |
| **End Customer** | Khách hàng nhắn tin trên Facebook | Gửi tin nhắn, nhận trả lời từ AI |
| **System** | Backend service | Xử lý pipeline, gọi LLM, lưu data |

---

## 4. Architecture Overview (Inspired by GoClaw)

### 4.1 Tổng quan hệ thống

```
┌────────────────────────────────────────────────────────────────┐
│                    AI CHATBOT SERVICE (NestJS)                  │
│                                                                │
│  ┌──────────┐   ┌──────────────────────────────────────────┐  │
│  │ Channel   │   │         Agent Pipeline (5-Stage)         │  │
│  │ Adapters  │   │                                          │  │
│  │           │   │  ① Context    → Load tenant + agent      │  │
│  │ • FB Msg  │──▶│  ② History    → Load conversation ctx    │  │
│  │ • (Zalo)  │   │  ③ Knowledge  → RAG search relevant docs │  │
│  │ • (Widget)│   │  ④ LLM        → Build prompt + call API  │  │
│  │           │   │  ⑤ Response   → Send reply + save memory │  │
│  └──────────┘   └──────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   │
│  │ Knowledge │   │ Auth     │   │ Tenant   │   │ Conver-  │   │
│  │ Service   │   │ Module   │   │ Module   │   │ sation   │   │
│  │           │   │          │   │          │   │ Module   │   │
│  │ • Upload  │   │ • JWT    │   │ • CRUD   │   │ • Store  │   │
│  │ • Chunk   │   │ • Guard  │   │ • Config │   │ • Query  │   │
│  │ • Embed   │   │ • Supa   │   │ • Limits │   │ • Export │   │
│  │ • Search  │   │          │   │          │   │          │   │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Supabase (PostgreSQL + pgvector)         │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Agent Pipeline — 5 Stage (Simplified from GoClaw's 8)

GoClaw dùng 8 stage: `context → history → prompt → think → act → observe → memory → summarize`

Cho MVP, rút gọn thành **5 stage** đủ dùng:

| Stage | Tên | Nhiệm vụ | Tương đương GoClaw |
|---|---|---|---|
| ① | **Context** | Load tenant config, agent persona, system prompt | context |
| ② | **History** | Load N tin nhắn gần nhất của conversation | history |
| ③ | **Knowledge** | RAG: embed query → search pgvector → lấy relevant chunks | prompt (knowledge injection) |
| ④ | **LLM** | Build full prompt, gọi OpenAI API, nhận response | think + act |
| ⑤ | **Response** | Gửi reply về channel, lưu message vào DB | memory |

**Tại sao bỏ `observe`, `summarize`?**
- `observe`: GoClaw dùng cho tool calling (agent gọi tool, observe kết quả). MVP chưa cần tool system.
- `summarize`: GoClaw tự tóm tắt session → episodic memory. MVP chỉ dùng working memory (conversation history trực tiếp).
- Cả 2 sẽ thêm vào khi scale lên.

### 4.3 NestJS Module Structure

```
ai-chatbot-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/                     # Shared utilities
│   │   ├── decorators/             # Custom decorators (@CurrentTenant, etc.)
│   │   ├── guards/                 # Auth guards, tenant guards
│   │   ├── interceptors/           # Logging, error handling
│   │   ├── filters/                # Exception filters
│   │   ├── pipes/                  # Validation pipes
│   │   └── interfaces/             # Shared types/interfaces
│   │
│   ├── auth/                       # Auth Module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/             # JWT, Supabase strategies
│   │   └── dto/
│   │
│   ├── tenant/                     # Tenant Module (Seller workspace)
│   │   ├── tenant.module.ts
│   │   ├── tenant.controller.ts
│   │   ├── tenant.service.ts
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── agent/                      # Agent Module (AI chatbot config)
│   │   ├── agent.module.ts
│   │   ├── agent.controller.ts
│   │   ├── agent.service.ts
│   │   ├── pipeline/               # ⭐ Agent Pipeline (core)
│   │   │   ├── pipeline.service.ts
│   │   │   ├── stages/
│   │   │   │   ├── context.stage.ts
│   │   │   │   ├── history.stage.ts
│   │   │   │   ├── knowledge.stage.ts
│   │   │   │   ├── llm.stage.ts
│   │   │   │   └── response.stage.ts
│   │   │   └── interfaces/
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── knowledge/                  # Knowledge Base Module
│   │   ├── knowledge.module.ts
│   │   ├── knowledge.controller.ts
│   │   ├── knowledge.service.ts
│   │   ├── chunking/               # Text chunking strategies
│   │   ├── embedding/              # Vector embedding service
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── conversation/               # Conversation Module
│   │   ├── conversation.module.ts
│   │   ├── conversation.controller.ts
│   │   ├── conversation.service.ts
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── channel/                    # Channel Adapters
│   │   ├── channel.module.ts
│   │   ├── interfaces/
│   │   │   └── channel-adapter.interface.ts  # Abstract interface
│   │   ├── facebook/               # FB Messenger adapter
│   │   │   ├── facebook.controller.ts        # Webhook endpoint
│   │   │   ├── facebook.service.ts
│   │   │   └── facebook.types.ts
│   │   └── (future: zalo/, widget/)
│   │
│   ├── llm/                        # LLM Provider Module
│   │   ├── llm.module.ts
│   │   ├── llm.service.ts
│   │   ├── providers/
│   │   │   ├── openai.provider.ts
│   │   │   └── (future: claude.provider.ts)
│   │   └── interfaces/
│   │
│   └── config/                     # App configuration
│       ├── database.config.ts
│       ├── openai.config.ts
│       └── facebook.config.ts
│
├── prisma/                         # DB schema & migrations
│   ├── schema.prisma
│   └── migrations/
│
├── test/
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 5. Domain Entities & Relationships

### 5.1 Entity Relationship Diagram

```
┌──────────┐     1:N     ┌──────────┐     1:N     ┌──────────────────┐
│  Seller  │────────────▶│  Tenant  │────────────▶│  Agent           │
│  (User)  │             │(Workspace)│             │  (AI Bot Config) │
└──────────┘             └──────────┘             └──────────────────┘
                              │                         │
                              │ 1:N                     │ 1:N
                              ▼                         ▼
                    ┌──────────────────┐      ┌─────────────────┐
                    │ ChannelConnection│      │  Conversation   │
                    │ (FB Page link)   │      │  (Chat session) │
                    └──────────────────┘      └─────────────────┘
                              │                         │
                              │                         │ 1:N
                              │                         ▼
                              │               ┌─────────────────┐
                              │               │    Message       │
                              │               │  (Chat message)  │
                              │               └─────────────────┘
                              │
                    ┌──────────────────┐     1:N     ┌──────────────┐
                    │KnowledgeDocument │────────────▶│KnowledgeChunk│
                    │  (Uploaded file) │             │ (Embedded)   │
                    └──────────────────┘             └──────────────┘
```

### 5.2 Entity Details

#### Seller (User)
```
- id: UUID (PK)
- email: string (unique)
- full_name: string
- avatar_url: string?
- supabase_uid: string (FK to Supabase Auth)
- created_at: timestamp
- updated_at: timestamp
```

#### Tenant (Seller's Workspace)
```
- id: UUID (PK)
- seller_id: UUID (FK → Seller)
- name: string (shop name)
- slug: string (unique)
- plan: enum (FREE, STARTER, GROWTH, PRO)
- message_quota: int (monthly limit)
- message_used: int (current month usage)
- quota_reset_at: timestamp
- status: enum (ACTIVE, SUSPENDED, CANCELLED)
- settings: JSONB (timezone, language, etc.)
- created_at: timestamp
```

#### Agent (AI Bot Configuration)
```
- id: UUID (PK)
- tenant_id: UUID (FK → Tenant)
- name: string ("Trợ lý shop ABC")
- persona: text (system prompt / personality)
- greeting_message: text
- llm_provider: enum (OPENAI, CLAUDE)
- llm_model: string ("gpt-4o-mini")
- temperature: float (0.7)
- max_tokens: int (1024)
- is_active: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### ChannelConnection (Linked messaging platform)
```
- id: UUID (PK)
- tenant_id: UUID (FK → Tenant)
- agent_id: UUID (FK → Agent)
- channel_type: enum (FACEBOOK, ZALO, WIDGET)
- channel_config: JSONB (page_id, access_token encrypted, etc.)
- status: enum (CONNECTED, DISCONNECTED, ERROR)
- connected_at: timestamp
```

#### Conversation (Chat session)
```
- id: UUID (PK)
- tenant_id: UUID (FK → Tenant)
- agent_id: UUID (FK → Agent)
- channel_type: enum
- channel_conversation_id: string (FB sender_id, etc.)
- customer_name: string?
- customer_avatar: string?
- status: enum (ACTIVE, CLOSED, HANDED_OFF)
- metadata: JSONB
- last_message_at: timestamp
- created_at: timestamp
```

#### Message
```
- id: UUID (PK)
- conversation_id: UUID (FK → Conversation)
- tenant_id: UUID (FK → Tenant, for query performance)
- role: enum (CUSTOMER, ASSISTANT, SYSTEM)
- content: text
- metadata: JSONB (tokens_used, model, latency_ms)
- created_at: timestamp
```

#### KnowledgeDocument
```
- id: UUID (PK)
- tenant_id: UUID (FK → Tenant)
- file_name: string
- file_type: enum (TEXT, PDF, DOCX, CSV, URL)
- file_url: string? (Supabase Storage)
- raw_content: text
- chunk_count: int
- status: enum (PENDING, PROCESSING, READY, ERROR)
- error_message: string?
- created_at: timestamp
```

#### KnowledgeChunk
```
- id: UUID (PK)
- document_id: UUID (FK → KnowledgeDocument)
- tenant_id: UUID (FK → Tenant, for query performance)
- content: text (chunk text)
- embedding: vector(1536) (OpenAI text-embedding-3-small)
- chunk_index: int
- metadata: JSONB (page_number, heading, etc.)
- created_at: timestamp
```

---

## 6. Core Flows

### Flow 1: Seller Onboarding (Self-Serve)

```
Seller → Đăng ký (email/password)
  → Supabase Auth signUp() → JWT token
  → POST /tenants (tên shop) → Tạo tenant + default agent
  → Upload file sản phẩm (PDF/text)
  → POST /knowledge/documents (file) → Chunk → Embed → Store vectors
  → Kết nối Facebook Page
  → FB OAuth flow → get page_access_token
  → POST /channels/facebook (page_id, token) → Subscribe webhook
  → Chatbot hoạt động! 🎉
```

### Flow 2: Customer Chat (Agent Pipeline)

```
Khách nhắn trên FB Messenger: "Sản phẩm này giá bao nhiêu?"
  → FB gửi webhook POST /webhook/facebook
  → Verify signature + Find tenant by page_id
  → Agent Pipeline:
    ① Context  → Load agent config (persona, model, temp)
    ② History  → Load last 10 messages of conversation
    ③ Knowledge (RAG)
       → Embed query → pgvector similarity search → top 5 chunks
    ④ LLM
       → Build prompt (system + knowledge + history + query)
       → Call OpenAI Chat Completion
       → Response: "Dạ anh ơi, Serum Vitamin C giá 350.000đ ạ!"
    ⑤ Response
       → Save customer message + AI response to DB
       → Increment message_used counter
       → Send reply via FB Messenger API
  → Khách nhận: "Dạ anh ơi, Serum Vitamin C giá 350.000đ ạ!"
```

### Flow 3: Knowledge Upload & Processing

```
Seller uploads PDF
  → Store file in Supabase Storage
  → Extract text from PDF
  → Split into chunks (500 tokens each, 50 token overlap)
  → Batch embed chunks via OpenAI text-embedding-3-small
  → Store chunks + vectors in pgvector
  → Update document status = READY
  → Knowledge available for RAG ✅
  
  Error cases:
  → Extract fail → status = ERROR, notify seller
  → Embed fail → retry 3x → status = ERROR
```

---

## 7. API Contract (REST)

### Auth
```
POST   /auth/register          # Đăng ký seller
POST   /auth/login             # Đăng nhập
POST   /auth/refresh           # Refresh token
GET    /auth/me                # Thông tin user hiện tại
```

### Tenant
```
POST   /tenants                # Tạo workspace
GET    /tenants/:id            # Xem workspace
PATCH  /tenants/:id            # Cập nhật workspace  
GET    /tenants/:id/usage      # Xem usage (messages used/quota)
```

### Agent
```
POST   /tenants/:id/agents             # Tạo agent
GET    /tenants/:id/agents             # Danh sách agents
GET    /tenants/:id/agents/:agentId    # Xem chi tiết agent
PATCH  /tenants/:id/agents/:agentId    # Cập nhật agent (persona, model...)
DELETE /tenants/:id/agents/:agentId    # Xóa agent
```

### Knowledge
```
POST   /tenants/:id/knowledge/documents          # Upload document
GET    /tenants/:id/knowledge/documents          # Danh sách documents
DELETE /tenants/:id/knowledge/documents/:docId   # Xóa document
POST   /tenants/:id/knowledge/search             # Test search (debug)
```

### Channel
```
POST   /tenants/:id/channels/facebook/connect    # Kết nối FB page
DELETE /tenants/:id/channels/facebook/disconnect  # Ngắt kết nối
GET    /tenants/:id/channels                      # Danh sách channels
```

### Conversations (Read-only for MVP)
```
GET    /tenants/:id/conversations                 # Danh sách conversations
GET    /tenants/:id/conversations/:convId         # Chi tiết + messages
```

### Webhook (Public - no auth)
```
GET    /webhook/facebook                          # FB verification
POST   /webhook/facebook                          # FB message webhook
```

---

## 8. Edge Cases & Failure States

| Tình huống | Xử lý |
|---|---|
| Seller hết message quota | Trả lời khách bằng fallback: "Hệ thống đang bảo trì..." + Notify seller |
| OpenAI API timeout/error | Retry 1 lần → nếu fail, gửi fallback message |
| Knowledge base rỗng (chưa upload) | AI trả lời dựa trên persona + greeting, không hallucinate |
| FB webhook duplicate message | Deduplicate bằng message_id từ Facebook |
| File upload quá lớn | Giới hạn 10MB/file, trả lỗi rõ ràng |
| PDF không extract được text | Status = ERROR, hiển thị lỗi cho seller |
| Seller kết nối page không phải admin | FB OAuth trả lỗi → thông báo rõ |
| Concurrent messages cùng 1 conversation | Queue xử lý tuần tự per conversation |
| Embedding API fail | Retry 3 lần → mark document ERROR |
| Token limit exceeded (prompt quá dài) | Truncate history (giữ 5 thay vì 10), giảm knowledge chunks |

---

## 9. Assumptions

1. Frontend (Next.js dashboard) sẽ được build riêng, spec này chỉ cover **backend API**
2. Supabase Auth xử lý authentication, backend verify JWT
3. MVP chỉ hỗ trợ text messages (không xử lý hình ảnh, sticker, voice từ khách)
4. Seller tự lấy Facebook Page access token qua OAuth flow (frontend handle)
5. 1 Seller = 1 Tenant = 1 Agent (MVP). Multi-agent per tenant sẽ thêm sau
6. Không có billing/payment cho MVP — phân biệt plan bằng config thủ công
7. Knowledge search dùng cosine similarity, top 5 chunks
8. Conversation history window: 10 messages gần nhất

---

## 10. Risks & Open Questions

### Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Facebook API thay đổi policy | Cao | Abstract qua Channel Adapter interface |
| Chi phí OpenAI tăng khi có nhiều seller | Trung bình | Model routing: gpt-4o-mini mặc định |
| Supabase free tier hết quota | Thấp | Monitor usage, upgrade khi cần ($25/mo) |
| Knowledge search không chính xác | Trung bình | Hybrid search (FTS + vector), tune chunk size |

### Open Questions
1. Streaming response có cần cho MVP không? (FB không hỗ trợ, Widget sau này sẽ cần)
2. Seller có cần chọn model (GPT-4o vs Claude) trong MVP? Hay fix gpt-4o-mini?
3. Rate limit cụ thể cho free tier: 100 hay 500 messages/tháng?

---

## 11. Build Phases Overview

| Phase | Tên | Tasks | Ước tính |
|---|---|---|---|
| 01 | Project Setup & Database | 8 tasks | 2-3 ngày |
| 02 | AI Agent Pipeline Engine | 10 tasks | 4-5 ngày |
| 03 | Knowledge Base (RAG) | 8 tasks | 3-4 ngày |
| 04 | Facebook Messenger Channel | 8 tasks | 3-4 ngày |
| 05 | Seller API & Self-Serve | 7 tasks | 2-3 ngày |
| 06 | Testing & Hardening | 6 tasks | 2-3 ngày |
| **Tổng** | | **47 tasks** | **~16-22 ngày** |

---

*Spec này là tài liệu sống — sẽ cập nhật theo tiến độ.*
*Tạo bởi Mine — 13/04/2026*
