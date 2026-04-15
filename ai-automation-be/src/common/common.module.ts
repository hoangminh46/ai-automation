import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { LlmModule } from './llm/llm.module.js';

@Global()
@Module({
  imports: [LlmModule],
  providers: [PrismaService],
  exports: [PrismaService, LlmModule],
})
export class CommonModule {}
