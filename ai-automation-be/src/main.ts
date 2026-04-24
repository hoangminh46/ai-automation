import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // rawBody cần cho Facebook webhook signature verification (X-Hub-Signature-256)
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3001);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());

  // CORS — allow frontend dev server + production
  app.enableCors({
    origin:
      nodeEnv === 'development'
        ? ['http://localhost:3000', 'http://localhost:3001']
        : (configService.get<string>('CORS_ORIGINS') || '')
            .split(',')
            .filter(Boolean),
    credentials: true,
  });

  // API prefix + versioning — exclude webhook (Facebook gọi trực tiếp)
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'webhook/facebook', method: RequestMethod.GET },
      { path: 'webhook/facebook', method: RequestMethod.POST },
    ],
  });

  // Global standard response format: { success, data } / { success, error }
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

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

  // Swagger API docs — chỉ bật ở development
  if (nodeEnv === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AI Chatbot API')
      .setDescription(
        'Multi-tenant AI Chatbot backend cho seller TMĐT Việt Nam. ' +
          'RAG-based, Facebook Messenger integration, real-time WebSocket.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local Development')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(
    `🚀 AI Chatbot Service running on http://localhost:${port} [${nodeEnv}]`,
  );
}

bootstrap().catch((err) => {
  console.error('Error starting server', err);
  process.exit(1);
});
