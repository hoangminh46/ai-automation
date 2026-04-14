# Phase 05: Agent Pipeline Core
Status: ⬜ Pending | Dependencies: Phase 03, 04

## Objective
Implement 5-Stage Agent Pipeline — trái tim xử lý tin nhắn (lấy cảm hứng từ GoClaw). Pipeline nhận message → chạy qua 5 stage tuần tự → trả response.

## Implementation Steps
1. [ ] Define `PipelineContext` interface:
   ```typescript
   interface PipelineContext {
     tenantId: string;
     agentId: string;
     conversationId?: string;
     incomingMessage: { content: string; senderId: string };
     agent?: AgentConfig;
     history?: Message[];
     knowledgeChunks?: string[];
     prompt?: ChatMessage[];
     llmResponse?: string;
     metrics: { stageTimings: Record<string, number> };
   }
   ```
2. [ ] Define `PipelineStage` interface:
   ```typescript
   interface PipelineStage {
     name: string;
     execute(ctx: PipelineContext): Promise<PipelineContext>;
   }
   ```
3. [ ] Implement `PipelineService` — orchestrator chạy stages tuần tự, log metrics
4. [ ] Implement Stage ① `ContextStage` — load agent config từ DB
5. [ ] Implement Stage ② `HistoryStage` — load last 10 messages (stub: empty array, Phase 06 implement)
6. [ ] Implement Stage ③ `KnowledgeStage` — stub: return empty array (Phase 08 implement)
7. [ ] Implement Stage ④ `LlmStage` — build prompt via PromptBuilder + call LlmService
8. [ ] Implement Stage ⑤ `ResponseStage` — stub: return response (Phase 06 sẽ add save to DB)
9. [ ] Tạo test endpoint: `POST /test/chat` (body: { tenantId, message }) — dev only

## Acceptance Criteria
- [ ] `POST /test/chat { tenantId, message: "Xin chào" }` → AI trả lời theo persona
- [ ] Pipeline log metrics: tên stage + duration ms
- [ ] LLM fail → fallback message
- [ ] Agent không tồn tại → 404

## Definition of Done
- [ ] Pipeline orchestrator + 5 stages hoạt động
- [ ] Test endpoint hoạt động end-to-end
- [ ] Metrics logging
- [ ] Stubs ready cho Phase 06 (history) và Phase 08 (knowledge)

## Notes
- History + Knowledge stages là stub trong phase này. Chúng sẽ được "fill in" ở Phase 06 và 08.
- Cách tiếp cận này giúp test pipeline end-to-end sớm mà không cần chờ tất cả modules.

---
Next: Phase 06 - Conversation & Memory
