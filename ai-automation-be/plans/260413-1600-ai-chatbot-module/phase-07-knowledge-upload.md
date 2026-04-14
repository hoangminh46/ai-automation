# Phase 07: Knowledge Upload & Processing
Status: ⬜ Pending | Dependencies: Phase 04

## Objective
Implement knowledge document upload pipeline: seller upload text/PDF → extract text → chunk → embed via OpenAI → store vectors trong pgvector.

## Implementation Steps
1. [ ] Install deps: `pdf-parse`, `@supabase/storage-js` (hoặc dùng supabase-js đã có)
2. [ ] Implement `TextExtractorService`:
   - Extract text từ plain text file
   - Extract text từ PDF (pdf-parse)
   - Error handling: file corrupt, empty content
3. [ ] Implement `ChunkingService`:
   - Recursive text splitter
   - Chunk size: 500 tokens, overlap: 50 tokens
   - Separators: `["\n\n", "\n", ". ", " "]`
4. [ ] Implement `EmbeddingService`:
   - Batch embed text via OpenAI `text-embedding-3-small`
   - Batch size: 20 chunks/call
   - Retry 3 lần khi API fail
5. [ ] Implement document upload endpoint: `POST /tenants/:id/knowledge/documents`
   - Accept multipart/form-data (max 10MB)
   - Store file → trigger async processing
   - Return document with status PENDING
6. [ ] Implement async processing pipeline:
   - PENDING → PROCESSING → extract → chunk → embed → store in pgvector → READY
   - On error: status = ERROR + error_message

## Acceptance Criteria
- [ ] Upload text file → status chuyển PENDING → PROCESSING → READY
- [ ] Upload PDF → text extracted + chunked + embedded thành công
- [ ] Chunks + vectors lưu đúng trong DB
- [ ] File > 10MB → 413 error
- [ ] PDF corrupt → status ERROR + message rõ ràng

## Definition of Done
- [ ] Upload endpoint hoạt động
- [ ] Extract → Chunk → Embed pipeline hoạt động
- [ ] Status tracking chính xác
- [ ] Error handling đầy đủ

---
Next: Phase 08 - Knowledge Search & RAG
