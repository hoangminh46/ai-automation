import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3001);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());

  // CORS — allow frontend dev server + production
  app.enableCors({
    origin: nodeEnv === 'development'
      ? ['http://localhost:3000', 'http://localhost:3001']
      : (configService.get<string>('CORS_ORIGINS') || '')
          .split(',')
          .filter(Boolean),
    credentials: true,
  });

  // Global validation pipe — reject invalid DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port);
  logger.log(`🚀 AI Chatbot Service running on http://localhost:${port} [${nodeEnv}]`);
}

bootstrap();
