import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    CommonModule,
    AuthModule,
    TenantModule,
    AgentModule,
    ConversationModule,
  ],
})
export class AppModule {}
