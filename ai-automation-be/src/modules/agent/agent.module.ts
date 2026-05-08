import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentKnowledgeService } from './agent-knowledge.service';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [PlanModule],
  controllers: [AgentController],
  providers: [AgentService, AgentKnowledgeService],
  exports: [AgentKnowledgeService],
})
export class AgentModule {}
