import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  envValidationSchema,
  appConfig,
  databaseConfig,
  supabaseConfig,
  openaiConfig,
  facebookConfig,
} from './config';

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
  ],
})
export class AppModule {}
