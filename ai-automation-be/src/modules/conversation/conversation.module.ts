import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller.js';
import { ConversationService } from './conversation.service.js';
import { ChatGateway } from './chat.gateway.js';
import { KnowledgeModule } from '../knowledge/knowledge.module.js';
import { ChannelModule } from '../channel/channel.module.js';
import { PlanModule } from '../plan/plan.module.js';

@Module({
  imports: [KnowledgeModule, ChannelModule, PlanModule],
  controllers: [ConversationController],
  providers: [ConversationService, ChatGateway],
  exports: [ChatGateway],
})
export class ConversationModule {}
