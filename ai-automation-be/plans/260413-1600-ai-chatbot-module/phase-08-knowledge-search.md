# Phase 08: Knowledge Search & RAG
Status: ⬜ Pending | Dependencies: Phase 05, 07

## Objective
Implement semantic search trên pgvector, kết nối vào Pipeline Stage ③ (Knowledge), và thêm knowledge context vào prompt. Sau phase này, chatbot sẽ trả lời dựa trên data seller đã upload.

## Implementation Steps
1. [ ] Implement `KnowledgeSearchService`:
   - Embed query via OpenAI
   - pgvector cosine similarity search: `1 - (embedding <=> query_embedding)`
   - Filter by tenant_id (multi-tenant isolation)
   - Return top K chunks (default K=5)
2. [ ] Update Pipeline Stage ③ `KnowledgeStage`:
   - Replace stub → call KnowledgeSearchService
   - Embed incoming message → search → add results to context
3. [ ] Update `PromptBuilder` — inject knowledge chunks:
   ```
   [System: Agent persona]
   
   [Thông tin sản phẩm liên quan:]
   - Chunk 1...
   - Chunk 2...
   
   [Lịch sử hội thoại:]
   ...
   
   [Khách hàng: user message]
   ```
4. [ ] Test search endpoint: `POST /tenants/:id/knowledge/search`
   - Body: `{ query: string, topK?: number }`
   - Return matched chunks with similarity scores
5. [ ] Document management endpoints:
   - `GET /tenants/:id/knowledge/documents` — list (with status)
   - `DELETE /tenants/:id/knowledge/documents/:docId` — cascade delete chunks

## Acceptance Criteria
- [ ] Upload knowledge → hỏi chatbot câu liên quan → AI trả lời dựa trên nội dung
- [ ] Search endpoint trả chunks sorted by relevance
- [ ] Delete document → chunks xóa → AI không còn dùng data đó
- [ ] Multi-tenant: search chỉ trả chunks của tenant đó

## Definition of Done
- [ ] Semantic search hoạt động
- [ ] Pipeline Stage ③ connected
- [ ] Knowledge inject vào prompt
- [ ] Document management API
- [ ] Multi-tenant isolation verified

---
Next: Phase 09 - Facebook Messenger Channel
