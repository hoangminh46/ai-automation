import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller.js';
import { ConversationService } from './conversation.service.js';
import { KnowledgeModule } from '../knowledge/knowledge.module.js';

@Module({
  imports: [KnowledgeModule],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule {}
