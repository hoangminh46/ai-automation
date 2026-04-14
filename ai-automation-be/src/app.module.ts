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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig, databaseConfig, supabaseConfig, openaiConfig, facebookConfig],
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),
    CommonModule,
    AuthModule,
  ],
})
export class AppModule {}
