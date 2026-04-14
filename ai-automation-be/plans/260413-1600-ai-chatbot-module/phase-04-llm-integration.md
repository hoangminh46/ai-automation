# Phase 04: LLM Integration
Status: ⬜ Pending | Dependencies: Phase 01

## Objective
Implement LLM module: abstract provider interface + OpenAI implementation + prompt builder. Đây là "giọng nói" của chatbot.

## Implementation Steps
1. [ ] Define `LlmProvider` interface:
   ```typescript
   interface LlmProvider {
     name: string;
     chatCompletion(messages: ChatMessage[], options: LlmOptions): Promise<LlmResponse>;
   }
   ```
2. [ ] Implement `OpenAiProvider`:
   - Install `openai` package
   - Chat Completion API call
   - Error handling: timeout, rate limit, invalid key
   - Response parsing: content + usage (tokens)
3. [ ] Implement `LlmService` facade:
   - Provider registry (MVP: chỉ OpenAI)
   - Model selection (default: gpt-4o-mini)
   - Fallback message khi API fail
4. [ ] Implement `PromptBuilder` utility:
   ```
   System: [Agent persona]
   ---
   Thông tin liên quan: [Knowledge chunks - injected later]
   ---
   Lịch sử: [History messages - injected later]
   ---
   Khách hàng: [User query]
   ```
5. [ ] Unit test: mock OpenAI API → verify prompt format + response parsing

## Acceptance Criteria
- [ ] `LlmService.chatCompletion()` gọi OpenAI thành công
- [ ] PromptBuilder tạo đúng format prompt
- [ ] OpenAI error (timeout/401/429) → fallback message, không crash
- [ ] Token usage được log

## Definition of Done
- [ ] LLM module hoạt động với OpenAI
- [ ] PromptBuilder hoạt động
- [ ] Error handling cho tất cả failure cases
- [ ] Provider interface sẵn sàng cho Claude sau này

---
Next: Phase 05 - Agent Pipeline Core
