import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller.js';
import { ChannelService } from './channel.service.js';
import { FacebookWebhookController } from './webhook/facebook-webhook.controller.js';
import { FacebookCallbackController } from './webhook/facebook-callback.controller.js';
import { ZaloWebhookController } from './webhook/zalo-webhook.controller.js';
import { ZaloCallbackController } from './webhook/zalo-callback.controller.js';
import { FacebookAdapter } from './adapters/facebook.adapter.js';
import { ZaloAdapter } from './adapters/zalo.adapter.js';
import { ZaloTokenService } from './services/zalo-token.service.js';
import { KnowledgeModule } from '../knowledge/knowledge.module.js';

@Module({
  imports: [KnowledgeModule],
  controllers: [
    ChannelController,
    FacebookWebhookController,
    FacebookCallbackController,
    ZaloWebhookController,
    ZaloCallbackController,
  ],
  providers: [ChannelService, FacebookAdapter, ZaloAdapter, ZaloTokenService],
  exports: [ChannelService],
})
export class ChannelModule {}
