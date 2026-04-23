import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller.js';
import { ChannelService } from './channel.service.js';
import { FacebookWebhookController } from './webhook/facebook-webhook.controller.js';
import { FacebookAdapter } from './adapters/facebook.adapter.js';
import { KnowledgeModule } from '../knowledge/knowledge.module.js';

@Module({
  imports: [KnowledgeModule],
  controllers: [ChannelController, FacebookWebhookController],
  providers: [ChannelService, FacebookAdapter],
  exports: [ChannelService],
})
export class ChannelModule {}
