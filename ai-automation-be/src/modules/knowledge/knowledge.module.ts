import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller.js';
import { KnowledgeService } from './knowledge.service.js';
import { TextExtractorService } from './services/text-extractor.service.js';
import { TextChunkerService } from './services/text-chunker.service.js';
import { EmbeddingService } from './services/embedding.service.js';

@Module({
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    TextExtractorService,
    TextChunkerService,
    EmbeddingService,
  ],
  exports: [EmbeddingService],
})
export class KnowledgeModule {}
