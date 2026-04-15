import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';

/**
 * LlmModule: Export LlmService global để mọi feature module dùng mà không cần import lại.
 * Import vào CommonModule hoặc các module cần gọi LLM.
 */
@Module({
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
