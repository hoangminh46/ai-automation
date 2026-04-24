-- ===========================================================================
-- Phase 11: Database Indexes for Performance
-- Chạy 1 lần duy nhất. Chỉ cần chạy lại khi tạo DB mới.
-- Cách chạy: node scripts/run-indexes.js HOẶC paste vào Supabase SQL Editor
-- ===========================================================================

-- 1. Conversation lookup by tenant (CRM conversation list)
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_recent
  ON conversations (tenant_id, last_message_at DESC);

-- 2. Message lookup by conversation (chat history)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
  ON messages (conversation_id, created_at ASC);

-- 3. Customer lookup by external ID (FB user matching)
CREATE INDEX IF NOT EXISTS idx_customers_external_lookup
  ON customers (tenant_id, external_id)
  WHERE external_id IS NOT NULL;

-- 4. Channel connection lookup (webhook routing: page external_id → tenant)
CREATE INDEX IF NOT EXISTS idx_channel_connections_external
  ON channel_connections (external_id)
  WHERE is_active = true;

-- 5. Vector search index on knowledge_chunks (RAG)
-- Cần: SET maintenance_work_mem = '128MB' trước khi chạy nếu bị lỗi memory
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Verify: SELECT indexname, tablename FROM pg_indexes
--         WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
