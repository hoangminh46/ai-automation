import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  envValidationSchema,
  appConfig,
  databaseConfig,
  supabaseConfig,
  openaiConfig,
  facebookConfig,
} from './config/index.js';
import { CommonModule } from './common/common.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TenantModule } from './modules/tenant/tenant.module.js';
import { AgentModule } from './modules/agent/agent.module.js';
import { ConversationModule } from './modules/conversation/conversation.module.js';
import { KnowledgeModule } from './modules/knowledge/knowledge.module.js';
import { ChannelModule } from './modules/channel/channel.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [
        appConfig,
        databaseConfig,
        supabaseConfig,
        openaiConfig,
        facebookConfig,
      ],
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 10 },
      { name: 'long', ttl: 3600000, limit: 100 },
    ]),
    EventEmitterModule.forRoot(),
    CommonModule,
    AuthModule,
    TenantModule,
    AgentModule,
    ConversationModule,
    KnowledgeModule,
    ChannelModule,
  ],
})
export class AppModule {}
